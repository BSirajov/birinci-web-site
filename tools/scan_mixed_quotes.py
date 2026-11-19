# -*- coding: utf-8 -*-
"""Read-only scan: mixed quotation-mark styles in published stories."""
from __future__ import annotations

import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("az", "en", "de", "ru", "ky")
OUT_DIR = ROOT / "docs" / "reviews" / "quote-style-scan-20261119"
CSV_PATH = OUT_DIR / "mixed-quotation-marks.csv"

# Expected dialogue style per language (primary).
EXPECTED = {
    "az": "guillemets «» (or curly double “”)",
    "en": "curly double “”",
    "de": "German low-quote „“",
    "ru": "guillemets «»",
    "ky": "guillemets «» (or curly double “”)",  # not specified; aligned with AZ
}

# Unicode quote characters by style family.
STYLE_CHARS: dict[str, str] = {
    "straight_double": '"',
    "straight_single": "'",
    "curly_double": "\u201c\u201d",  # “ ”
    "curly_single": "\u2018\u2019",  # ‘ ’
    "guillemet_double": "\u00ab\u00bb",  # « »
    "guillemet_single": "\u2039\u203a",  # ‹ ›
    "german_low_double": "\u201e",  # „  (closing often “ U+201C)
    "german_low_single": "\u201a",  # ‚  (closing often ‘ U+2018)
    "other_lookalike": "\u2033\u0060\u00b4\u2032",  # ″ ` ´ ′
}

# For german style, closing marks overlap with curly. Track opens separately.
GERMAN_OPEN = "\u201e"  # „
GERMAN_SINGLE_OPEN = "\u201a"  # ‚
CURLY_DOUBLE_OPEN = "\u201c"  # “
CURLY_DOUBLE_CLOSE = "\u201d"  # ”
CURLY_SINGLE_OPEN = "\u2018"  # ‘
CURLY_SINGLE_CLOSE = "\u2019"  # ’

ENTITY_MAP = {
    "&quot;": '"',
    "&#34;": '"',
    "&#x22;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&ldquo;": "\u201c",
    "&rdquo;": "\u201d",
    "&lsquo;": "\u2018",
    "&rsquo;": "\u2019",
    "&laquo;": "\u00ab",
    "&raquo;": "\u00bb",
    "&bdquo;": "\u201e",
    "&sbquo;": "\u201a",
    "&lsaquo;": "\u2039",
    "&rsaquo;": "\u203a",
}

HTML_TAG_RE = re.compile(r"<[^>]+>")
URL_RE = re.compile(r"https?://\S+|www\.\S+", re.I)
ENTITY_RE = re.compile(
    r"&(?:quot|apos|ldquo|rdquo|lsquo|rsquo|laquo|raquo|bdquo|sbquo|lsaquo|rsaquo|#34|#39|#x22);",
    re.I,
)

# Letters used for apostrophe context (Latin + Cyrillic + common extensions).
_LETTER = r"A-Za-z\u00c0-\u024f\u0400-\u04ff\u0100-\u017f"
# In-word contractions: don't, O'Brien
WORD_APOS_RE = re.compile(
    rf"(?<=[{_LETTER}])['\u2019\u2018](?=[{_LETTER}])",
    re.UNICODE,
)
# Possessives: Newton's, teachers', lambs'
POSSESSIVE_APOS_RE = re.compile(
    rf"(?:(?<=[{_LETTER}])['\u2019\u2018]s\b)|(?:(?<=[{_LETTER}]s)['\u2019\u2018](?![{_LETTER}]))",
    re.UNICODE,
)

DOUBLED_STRAIGHT_RE = re.compile(r"''|``")


def load_stories(lang: str) -> list[dict]:
    path = ROOT / lang / "assets" / "stories-data.js"
    text = path.read_text(encoding="utf-8")
    data = json.loads(text[text.find("{") :].rstrip().rstrip(";"))
    out = []
    for cat in data.get("categories") or []:
        slug = cat.get("slug") or ""
        for i, story in enumerate(cat.get("stories") or [], 1):
            out.append(
                {
                    "lang": lang,
                    "category_slug": slug,
                    "category_title": cat.get("title") or "",
                    "story_index_in_category": i,
                    "stem": story.get("stem") or "",
                    "title": story.get("title") or "",
                    "paragraphs": list(story.get("paragraphs") or []),
                    "image_alt": story.get("imageAlt") or "",
                    "file_path": f"{lang}/categories/{slug}.html#{story.get('stem') or ''}",
                }
            )
    return out


def decode_entities(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        key = m.group(0)
        low = key.lower()
        if low in ENTITY_MAP:
            return ENTITY_MAP[low]
        return ENTITY_MAP.get(key, key)

    return ENTITY_RE.sub(repl, text)


def clean_text(text: str) -> str:
    text = HTML_TAG_RE.sub(" ", text)
    text = URL_RE.sub(" ", text)
    text = decode_entities(text)
    return text


def strip_word_apostrophes(text: str) -> tuple[str, Counter]:
    """Replace contractions/possessives with placeholder; count ' vs ’ as apostrophes."""
    counts: Counter = Counter()

    def repl(m: re.Match[str]) -> str:
        raw = m.group(0)
        # Count the apostrophe character inside the match.
        for ch in raw:
            if ch == "'":
                counts["straight_apos"] += 1
            elif ch == "\u2019":
                counts["curly_apos"] += 1
            elif ch == "\u2018":
                counts["curly_open_as_apos"] += 1
        return "\u0001" * len(raw)

    text = WORD_APOS_RE.sub(repl, text)
    text = POSSESSIVE_APOS_RE.sub(repl, text)
    return text, counts


@dataclass
class QuoteScan:
    style_counts: Counter = field(default_factory=Counter)
    char_counts: Counter = field(default_factory=Counter)
    apos_counts: Counter = field(default_factory=Counter)
    examples: dict[str, str] = field(default_factory=dict)
    # Running open counts so “ can close German „ instead of starting curly.
    pending_german_double: int = 0
    pending_german_single: int = 0
    pending_guillemet_double: int = 0
    pending_guillemet_single: int = 0
    pending_curly_double: int = 0
    pending_curly_single: int = 0
    pending_straight_double: int = 0
    unbalanced_flag: bool = False


def add_example(scan: QuoteScan, style: str, text: str, i: int) -> None:
    if style in scan.examples:
        return
    start = max(0, i - 40)
    end = min(len(text), i + 40)
    scan.examples[style] = text[start:end].replace("\u0001", "'")


def record(scan: QuoteScan, style: str, ch: str, text: str, i: int) -> None:
    scan.style_counts[style] += 1
    scan.char_counts[ch] += 1
    add_example(scan, style, text, i)


def scan_text(text: str, scan: QuoteScan) -> None:
    text = clean_text(text)
    text, apos = strip_word_apostrophes(text)
    scan.apos_counts.update(apos)

    for m in DOUBLED_STRAIGHT_RE.finditer(text):
        scan.style_counts["other_lookalike"] += 1
        scan.char_counts[m.group(0)] += 1
        add_example(scan, "other_lookalike", text, m.start())

    i = 0
    while i < len(text):
        if text[i : i + 2] in ("''", "``"):
            i += 2
            continue
        ch = text[i]
        if ch == "\u0001":
            i += 1
            continue

        if ch == '"':
            record(scan, "straight_double", ch, text, i)
            if scan.pending_straight_double > 0:
                scan.pending_straight_double -= 1
            else:
                scan.pending_straight_double += 1
        elif ch == "'":
            record(scan, "straight_single", ch, text, i)
        elif ch == "\u201e":  # „
            record(scan, "german_low_double", ch, text, i)
            scan.pending_german_double += 1
        elif ch == "\u201a":  # ‚
            record(scan, "german_low_single", ch, text, i)
            scan.pending_german_single += 1
        elif ch == "\u201c":  # “
            if scan.pending_german_double > 0:
                record(scan, "german_low_double", ch, text, i)
                scan.pending_german_double -= 1
            else:
                record(scan, "curly_double", ch, text, i)
                scan.pending_curly_double += 1
        elif ch == "\u201d":  # ”
            record(scan, "curly_double", ch, text, i)
            if scan.pending_curly_double > 0:
                scan.pending_curly_double -= 1
            else:
                scan.unbalanced_flag = True
        elif ch == "\u2018":  # ‘
            if scan.pending_german_single > 0:
                record(scan, "german_low_single", ch, text, i)
                scan.pending_german_single -= 1
            else:
                record(scan, "curly_single", ch, text, i)
                scan.pending_curly_single += 1
        elif ch == "\u2019":  # ’
            if scan.pending_curly_single > 0:
                record(scan, "curly_single", ch, text, i)
                scan.pending_curly_single -= 1
            else:
                # Leftover ’ after apostrophe stripping — treat as apostrophe, not quote.
                scan.apos_counts["curly_apos"] += 1
        elif ch == "\u00ab":  # «
            record(scan, "guillemet_double", ch, text, i)
            scan.pending_guillemet_double += 1
        elif ch == "\u00bb":  # »
            record(scan, "guillemet_double", ch, text, i)
            if scan.pending_guillemet_double > 0:
                scan.pending_guillemet_double -= 1
            else:
                scan.unbalanced_flag = True
        elif ch == "\u2039":  # ‹
            record(scan, "guillemet_single", ch, text, i)
            scan.pending_guillemet_single += 1
        elif ch == "\u203a":  # ›
            record(scan, "guillemet_single", ch, text, i)
            if scan.pending_guillemet_single > 0:
                scan.pending_guillemet_single -= 1
            else:
                scan.unbalanced_flag = True
        elif ch in "\u2033\u0060\u00b4\u2032":
            record(scan, "other_lookalike", ch, text, i)

        i += 1


def dialogue_styles(style_counts: Counter) -> set[str]:
    """Styles that count toward mixed dialogue (collapse related singles with doubles when alone?).

    User wants: two or more different styles for dialogue. We treat these as distinct families:
    straight_double, straight_single (if used as quotes not apostrophes), curly_double,
    curly_single, guillemet_double, guillemet_single, german_low_*, other_lookalike.
    """
    return {s for s, n in style_counts.items() if n > 0}


def is_likely_nested(styles: set[str]) -> bool:
    """Outer guillemet/german + inner single/curly single without foreign doubles."""
    outer = styles & {"guillemet_double", "german_low_double", "curly_double"}
    inner = styles & {"curly_single", "straight_single", "guillemet_single", "german_low_single"}
    extras = styles - outer - inner - {"other_lookalike"}
    if other_lookalike_only := ("other_lookalike" in styles):
        pass
    # Nested pattern: exactly one outer family + optional inner singles, no straight_double mix
    if "straight_double" in styles and (styles - {"straight_double", "straight_single", "curly_single"}):
        return False
    if len(outer) == 1 and inner and not (styles & {"straight_double", "other_lookalike"}):
        # curly_double + curly_single is normal English nesting
        if outer == {"curly_double"} and inner <= {"curly_single", "straight_single"}:
            return True
        # guillemets + inner singles
        if outer == {"guillemet_double"} and inner:
            return True
        # German „…“ with inner ‚…‘ or ‘…’
        if outer == {"german_low_double"} and inner:
            return True
    return False


def foreign_style(lang: str, styles: set[str]) -> list[str]:
    expected_sets = {
        "en": {"curly_double", "curly_single", "straight_single"},  # nesting singles ok
        "de": {"german_low_double", "german_low_single", "curly_double", "curly_single"},
        # German closing is often “ which we classify as curly_double — that's expected with german_low
        "ru": {"guillemet_double", "guillemet_single", "curly_single", "straight_single"},
        "az": {"guillemet_double", "guillemet_single", "curly_double", "curly_single", "straight_single"},
        "ky": {"guillemet_double", "guillemet_single", "curly_double", "curly_single", "straight_single"},
    }
    allowed = expected_sets.get(lang, set())
    foreign = []
    for s in sorted(styles):
        if s == "other_lookalike":
            foreign.append(s)
            continue
        if s not in allowed:
            # German: curly_double alone without german_low is foreign (should use „)
            if lang == "de" and s == "curly_double" and "german_low_double" not in styles:
                foreign.append(s)
            elif lang == "de" and s in {"german_low_double", "curly_double", "curly_single", "german_low_single"}:
                continue
            elif lang != "de":
                foreign.append(s)
    # Refine: for EN, guillemets and german are foreign; straight_double is foreign to preferred curly
    if lang == "en":
        foreign = [s for s in styles if s in {"guillemet_double", "guillemet_single", "german_low_double", "german_low_single", "straight_double", "other_lookalike"}]
    if lang == "ru":
        foreign = [s for s in styles if s in {"german_low_double", "german_low_single", "straight_double", "curly_double", "other_lookalike"}]
    if lang == "de":
        foreign = [s for s in styles if s in {"guillemet_double", "guillemet_single", "straight_double", "other_lookalike"}]
        if "curly_double" in styles and "german_low_double" not in styles:
            foreign.append("curly_double_without_german_open")
    if lang in {"az", "ky"}:
        foreign = [s for s in styles if s in {"german_low_double", "german_low_single", "straight_double", "other_lookalike"}]
    return sorted(set(foreign))


def unbalanced(scan: QuoteScan) -> bool:
    if scan.unbalanced_flag:
        return True
    if (
        scan.pending_german_double
        or scan.pending_german_single
        or scan.pending_guillemet_double
        or scan.pending_guillemet_single
        or scan.pending_curly_double
        or scan.pending_curly_single
        or scan.pending_straight_double
    ):
        return True
    return False


def example_mix_line(scan: QuoteScan, styles: set[str]) -> str:
    parts = []
    for s in sorted(styles):
        if s in scan.examples:
            snip = " ".join(scan.examples[s].split())
            if len(snip) > 80:
                snip = snip[:77] + "…"
            parts.append(f"[{s}] {snip}")
    return " || ".join(parts[:3])


def style_counts_str(counts: Counter) -> str:
    return "; ".join(f"{k}={v}" for k, v in sorted(counts.items()) if v)


def assign_story_numbers(stories: list[dict]) -> None:
    """Stable story number: order of appearance across categories as in catalog."""
    for n, s in enumerate(stories, 1):
        s["story_number"] = n


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_rows = []
    nested_rows = []
    foreign_consistent = []
    apos_mixed = []
    summary = {}

    for lang in LANGS:
        stories = load_stories(lang)
        assign_story_numbers(stories)
        scanned = len(stories)
        mixed_n = unbalanced_n = nested_n = foreign_n = 0

        for story in stories:
            scan = QuoteScan()
            scan_text(story["title"], scan)
            for p in story["paragraphs"]:
                scan_text(p, scan)
            if story["image_alt"]:
                scan_text(story["image_alt"], scan)

            styles = dialogue_styles(scan.style_counts)
            bal = unbalanced(scan)
            foreign = foreign_style(lang, styles)
            nested = is_likely_nested(styles) and len(styles) >= 2
            mixed = len(styles) >= 2 and not nested

            # Apostrophe mix in same story
            if scan.apos_counts.get("straight_apos") and scan.apos_counts.get("curly_apos"):
                apos_mixed.append(
                    {
                        "lang": lang,
                        "story_number": story["story_number"],
                        "title": story["title"],
                        "stem": story["stem"],
                        "file_path": story["file_path"],
                        "apos_counts": dict(scan.apos_counts),
                    }
                )

            if nested:
                nested_n += 1
                nested_rows.append(
                    {
                        "lang": lang,
                        "story_number": story["story_number"],
                        "title": story["title"],
                        "stem": story["stem"],
                        "file_path": story["file_path"],
                        "styles_found": style_counts_str(scan.style_counts),
                        "example": example_mix_line(scan, styles),
                        "expected_style": EXPECTED[lang],
                        "foreign_styles": ", ".join(foreign),
                        "unbalanced": bal,
                        "bucket": "nested_check_manually",
                    }
                )

            if mixed or bal:
                if mixed:
                    mixed_n += 1
                if bal:
                    unbalanced_n += 1
                all_rows.append(
                    {
                        "lang": lang,
                        "story_number": story["story_number"],
                        "title": story["title"],
                        "stem": story["stem"],
                        "file_path": story["file_path"],
                        "styles_found": style_counts_str(scan.style_counts),
                        "style_set": "|".join(sorted(styles)),
                        "example": example_mix_line(scan, styles),
                        "expected_style": EXPECTED[lang],
                        "foreign_styles": ", ".join(foreign),
                        "unbalanced": bal,
                        "mixed": mixed,
                        "bucket": "mixed" if mixed else "unbalanced_only",
                    }
                )

            # Consistent but foreign to language
            if len(styles) == 1 and foreign:
                foreign_n += 1
                foreign_consistent.append(
                    {
                        "lang": lang,
                        "story_number": story["story_number"],
                        "title": story["title"],
                        "stem": story["stem"],
                        "file_path": story["file_path"],
                        "styles_found": style_counts_str(scan.style_counts),
                        "expected_style": EXPECTED[lang],
                        "foreign_styles": ", ".join(foreign),
                        "bucket": "foreign_but_consistent",
                    }
                )
            elif len(styles) >= 1 and foreign and not mixed and not nested:
                # e.g. only straight_double consistently
                if styles <= set(foreign) or (styles & set(foreign)):
                    if not any(r["stem"] == story["stem"] and r["lang"] == lang for r in foreign_consistent):
                        foreign_n += 1
                        foreign_consistent.append(
                            {
                                "lang": lang,
                                "story_number": story["story_number"],
                                "title": story["title"],
                                "stem": story["stem"],
                                "file_path": story["file_path"],
                                "styles_found": style_counts_str(scan.style_counts),
                                "expected_style": EXPECTED[lang],
                                "foreign_styles": ", ".join(foreign),
                                "bucket": "foreign_but_consistent",
                            }
                        )

        summary[lang] = {
            "scanned": scanned,
            "mixed": mixed_n,
            "unbalanced": unbalanced_n,
            "nested_check": nested_n,
            "foreign_consistent": foreign_n,
            "apos_mixed": sum(1 for a in apos_mixed if a["lang"] == lang),
        }

    # Write CSV (mixed + unbalanced primary list)
    fieldnames = [
        "lang",
        "story_number",
        "title",
        "stem",
        "file_path",
        "styles_found",
        "style_set",
        "example",
        "expected_style",
        "foreign_styles",
        "unbalanced",
        "mixed",
        "bucket",
    ]
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for row in sorted(all_rows, key=lambda r: (r["lang"], r["story_number"])):
            w.writerow(row)

    nested_csv = OUT_DIR / "nested-quotes-check-manually.csv"
    with nested_csv.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "lang",
                "story_number",
                "title",
                "stem",
                "file_path",
                "styles_found",
                "example",
                "expected_style",
                "foreign_styles",
                "unbalanced",
                "bucket",
            ],
        )
        w.writeheader()
        for row in sorted(nested_rows, key=lambda r: (r["lang"], r["story_number"])):
            w.writerow(row)

    foreign_csv = OUT_DIR / "foreign-style-consistent.csv"
    with foreign_csv.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "lang",
                "story_number",
                "title",
                "stem",
                "file_path",
                "styles_found",
                "expected_style",
                "foreign_styles",
                "bucket",
            ],
        )
        w.writeheader()
        for row in sorted(foreign_consistent, key=lambda r: (r["lang"], r["story_number"])):
            w.writerow(row)

    apos_csv = OUT_DIR / "mixed-apostrophes.csv"
    with apos_csv.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["lang", "story_number", "title", "stem", "file_path", "apos_counts"],
        )
        w.writeheader()
        for row in sorted(apos_mixed, key=lambda r: (r["lang"], r["story_number"])):
            w.writerow({**row, "apos_counts": json.dumps(row["apos_counts"], ensure_ascii=False)})

    # Markdown report
    md = OUT_DIR / "REPORT.md"
    lines = [
        "# Quotation-mark style scan",
        "",
        "## Summary per language",
        "",
        "| language | stories scanned | mixed | unbalanced | nested (check manually) | foreign but consistent | mixed apostrophes |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    totals = Counter()
    for lang in LANGS:
        s = summary[lang]
        lines.append(
            f"| {lang} | {s['scanned']} | {s['mixed']} | {s['unbalanced']} | {s['nested_check']} | {s['foreign_consistent']} | {s['apos_mixed']} |"
        )
        for k, v in s.items():
            totals[k] += v
    lines += [
        f"| **total** | **{totals['scanned']}** | **{totals['mixed']}** | **{totals['unbalanced']}** | **{totals['nested_check']}** | **{totals['foreign_consistent']}** | **{totals['apos_mixed']}** |",
        "",
        f"Expected styles: " + "; ".join(f"{k}: {v}" for k, v in EXPECTED.items()),
        "",
        f"CSV (mixed/unbalanced): `{CSV_PATH.relative_to(ROOT).as_posix()}`",
        f"CSV (nested): `{nested_csv.relative_to(ROOT).as_posix()}`",
        f"CSV (foreign consistent): `{foreign_csv.relative_to(ROOT).as_posix()}`",
        f"CSV (mixed apostrophes): `{apos_csv.relative_to(ROOT).as_posix()}`",
        "",
        "## Mixed / unbalanced stories",
        "",
    ]
    for lang in LANGS:
        rows = [r for r in all_rows if r["lang"] == lang]
        lines.append(f"### {lang.upper()} ({len(rows)})")
        lines.append("")
        if not rows:
            lines.append("_None._")
            lines.append("")
            continue
        lines.append(
            "| # | title | path | styles found | unbalanced | example |"
        )
        lines.append("|---:|---|---|---|---|---|")
        for r in sorted(rows, key=lambda x: x["story_number"]):
            title = r["title"].replace("|", "\\|")
            ex = r["example"].replace("|", "\\|").replace("\n", " ")
            lines.append(
                f"| {r['story_number']} | {title} | `{r['file_path']}` | {r['styles_found']} | {r['unbalanced']} | {ex} |"
            )
        lines.append("")

    lines += ["## Nested (check manually)", ""]
    for lang in LANGS:
        rows = [r for r in nested_rows if r["lang"] == lang]
        lines.append(f"### {lang.upper()} ({len(rows)})")
        lines.append("")
        if not rows:
            lines.append("_None._")
            lines.append("")
            continue
        lines.append("| # | title | path | styles found | example |")
        lines.append("|---:|---|---|---|---|")
        for r in sorted(rows, key=lambda x: x["story_number"]):
            lines.append(
                f"| {r['story_number']} | {r['title'].replace('|', '\\|')} | `{r['file_path']}` | {r['styles_found']} | {r['example'].replace('|', '\\|')} |"
            )
        lines.append("")

    lines += ["## Foreign style but consistent within the story", ""]
    for lang in LANGS:
        rows = [r for r in foreign_consistent if r["lang"] == lang]
        lines.append(f"### {lang.upper()} ({len(rows)})")
        lines.append("")
        if not rows:
            lines.append("_None._")
            lines.append("")
            continue
        lines.append("| # | title | path | styles found | foreign | expected |")
        lines.append("|---:|---|---|---|---|---|")
        for r in sorted(rows, key=lambda x: x["story_number"]):
            lines.append(
                f"| {r['story_number']} | {r['title'].replace('|', '\\|')} | `{r['file_path']}` | {r['styles_found']} | {r['foreign_styles']} | {r['expected_style']} |"
            )
        lines.append("")

    md.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # Console summary for the agent
    print("SUMMARY")
    for lang in LANGS:
        print(lang, summary[lang])
    print("TOTAL", dict(totals))
    print("CSV", CSV_PATH)
    print("REPORT", md)
    print("mixed_rows", len(all_rows), "nested", len(nested_rows), "foreign", len(foreign_consistent))


if __name__ == "__main__":
    main()
