# -*- coding: utf-8 -*-
"""Normalize mixed quotation marks in the 9 flagged wisdom stories.

Policy (from quote-style scan): AZ / RU / KY → guillemets « ».
Only the mixed-style stems are touched. Docx sources are left for a later
authoring sync; live site reads stories-data.js (+ mirrored HTML/search).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = Path(__file__).resolve().parent
if str(TOOLS) not in sys.path:
    sys.path.insert(0, str(TOOLS))

# lang → stems that were mixed in the 2026-11-19 scan
MIXED = {
    "az": ("if-fate-allows", "spinach"),
    "ru": ("spinach", "before-you-marry", "istanbul-woman-remembers", "everyone-has-work-to-do"),
    "ky": ("spinach", "before-you-marry", "istanbul-woman-remembers"),
}

CURLY_OPEN = "\u201c"  # “
CURLY_CLOSE = "\u201d"  # ”
GERMAN_OPEN = "\u201e"  # „
GUILLEMET_OPEN = "\u00ab"  # «
GUILLEMET_CLOSE = "\u00bb"  # »


def to_guillemets(text: str, *, lang: str) -> str:
    """Convert curly/German doubles to guillemets; leave existing «» alone."""
    if not text:
        return text
    out = text
    if lang == "ru":
        # Russian mixed set used German „…“; map that pair, then leftover English curls.
        out = out.replace(GERMAN_OPEN, GUILLEMET_OPEN)
        out = out.replace(CURLY_OPEN, GUILLEMET_CLOSE)  # German closer “ → »
        out = out.replace(CURLY_CLOSE, GUILLEMET_CLOSE)
        return out
    # AZ / KY: curly “… ” → «…»
    out = out.replace(GERMAN_OPEN, GUILLEMET_OPEN)
    out = out.replace(CURLY_OPEN, GUILLEMET_OPEN)
    out = out.replace(CURLY_CLOSE, GUILLEMET_CLOSE)
    return out


def _load_blob(path: Path):
    text = path.read_text(encoding="utf-8")
    eq = text.index("=")
    start = eq + 1
    while start < len(text) and text[start] in " \t\r\n":
        start += 1
    data, end = json.JSONDecoder().raw_decode(text, start)
    return text, start, end, data


def _write_blob(path: Path, prefix: str, data, suffix: str) -> None:
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(prefix + body + suffix, encoding="utf-8", newline="\n")


def fix_stories_data(lang: str, stems: set[str]) -> int:
    path = ROOT / lang / "assets" / "stories-data.js"
    text, start, end, data = _load_blob(path)
    changed = 0
    cats = data.get("categories") or []
    for cat in cats:
        for story in cat.get("stories") or []:
            if story.get("stem") not in stems:
                continue
            for key in ("title", "moral", "summary"):
                if key in story and isinstance(story[key], str):
                    new = to_guillemets(story[key], lang=lang)
                    if new != story[key]:
                        story[key] = new
                        changed += 1
            paras = story.get("paragraphs")
            if isinstance(paras, list):
                new_paras = []
                for p in paras:
                    if isinstance(p, str):
                        np = to_guillemets(p, lang=lang)
                        if np != p:
                            changed += 1
                        new_paras.append(np)
                    else:
                        new_paras.append(p)
                story["paragraphs"] = new_paras
    if changed:
        _write_blob(path, text[:start], data, text[end:])
    return changed


def fix_search_index(lang: str, stems: set[str]) -> int:
    path = ROOT / lang / "assets" / "search-index.js"
    if not path.is_file():
        return 0
    text, start, end, data = _load_blob(path)
    changed = 0
    items = data if isinstance(data, list) else data.get("stories") or data.get("items") or []
    if isinstance(data, dict) and not items:
        # try common shapes
        for key, val in data.items():
            if isinstance(val, list):
                items = val
                break
    for item in items:
        if not isinstance(item, dict):
            continue
        if item.get("stem") not in stems:
            continue
        for key, val in list(item.items()):
            if isinstance(val, str):
                new = to_guillemets(val, lang=lang)
                if new != val:
                    item[key] = new
                    changed += 1
            elif isinstance(val, list):
                new_list = []
                for p in val:
                    if isinstance(p, str):
                        np = to_guillemets(p, lang=lang)
                        if np != p:
                            changed += 1
                        new_list.append(np)
                    else:
                        new_list.append(p)
                item[key] = new_list
    if changed:
        _write_blob(path, text[:start], data, text[end:])
    return changed


_ARTICLE_RE = re.compile(
    r'(<article\b[^>]*\bid="(?P<id>[^"]+)"[^>]*>)(?P<body>.*?)(</article>)',
    re.I | re.S,
)


def fix_category_html(lang: str, stems: set[str]) -> int:
    folder = ROOT / lang / "categories"
    if not folder.is_dir():
        return 0
    changed_files = 0
    for path in sorted(folder.glob("*.html")):
        text = path.read_text(encoding="utf-8")
        touches = False

        def repl(match: re.Match[str]) -> str:
            nonlocal touches
            stem = match.group("id")
            if stem not in stems:
                return match.group(0)
            body = match.group("body")
            new_body = to_guillemets(body, lang=lang)
            if new_body != body:
                touches = True
            return match.group(1) + new_body + match.group(4)

        new_text = _ARTICLE_RE.sub(repl, text)
        if touches and new_text != text:
            path.write_text(new_text, encoding="utf-8", newline="\n")
            changed_files += 1
    return changed_files


def main() -> None:
    total = 0
    for lang, stems in MIXED.items():
        stem_set = set(stems)
        n1 = fix_stories_data(lang, stem_set)
        n2 = fix_search_index(lang, stem_set)
        n3 = fix_category_html(lang, stem_set)
        print(f"{lang}: stories-data fields={n1} search={n2} category_files={n3}")
        total += n1 + n2 + n3
    print("total touch count", total)


if __name__ == "__main__":
    main()
