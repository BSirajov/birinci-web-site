# -*- coding: utf-8 -*-
"""Read-only cross-language / cross-surface consistency audit for Birİnci."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("az", "en", "ru", "ky", "de")
OUT = ROOT / "docs" / "reviews" / "project-consistency-20261119"

from locale_catalog_policy import AZ_ONLY_STEMS, expected_missing_vs_az  # noqa: E402
CORE_PAGES = (
    "index.html",
    "sitemap.html",
    "feedback.html",
    "user-manual.html",
    "about/mission-vision-values.html",
    "privacy-notice.html",
    "terms-of-use.html",
    "cookie-policy.html",
    "legal-notice.html",
)
SKIP_DIR_PARTS = {"_reviews", "wisdom-stories", "discovery-articles", "node_modules"}


@dataclass
class Finding:
    severity: str  # error | warn | info
    area: str
    lang: str
    path: str
    detail: str


class HrefCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[tuple[str, str]] = []  # (tag, href)
        self.lang_options: list[dict[str, str]] = []
        self._in_lang_option = False
        self._cur: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        ad = {k: (v or "") for k, v in attrs}
        cls = ad.get("class", "")
        if tag == "a" and "lang-switcher__option" in cls:
            self.lang_options.append(
                {
                    "lang": ad.get("data-lang", ""),
                    "href": ad.get("href", ""),
                    "target": ad.get("data-lang-target", ""),
                    "hreflang": ad.get("hreflang", ""),
                }
            )
        href = ad.get("href")
        if href and tag in {"a", "link"}:
            self.hrefs.append((tag, href))


def html_files(lang: str) -> list[Path]:
    root = ROOT / lang
    out = []
    for p in root.rglob("*.html"):
        if any(part in SKIP_DIR_PARTS for part in p.parts):
            continue
        out.append(p)
    return sorted(out)


def rel_page(path: Path, lang: str) -> str:
    return path.relative_to(ROOT / lang).as_posix()


def load_story_stems(lang: str) -> set[str]:
    p = ROOT / lang / "assets" / "stories-data.js"
    if not p.is_file():
        return set()
    text = p.read_text(encoding="utf-8")
    data = json.loads(text[text.find("{") :].rstrip().rstrip(";"))
    stems = set()
    for cat in data.get("categories") or []:
        for s in cat.get("stories") or []:
            if s.get("stem"):
                stems.add(s["stem"])
    return stems


def load_category_slugs(lang: str) -> set[str]:
    cats = ROOT / lang / "categories"
    if not cats.is_dir():
        return set()
    return {p.stem for p in cats.glob("*.html")}


def resolve_local(base_file: Path, href: str) -> Path | None:
    href = href.strip()
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    if re.match(r"^[a-z][a-z0-9+.-]*:", href, re.I):
        return None  # absolute URL
    parsed = urlparse(href)
    path = unquote(parsed.path)
    if not path or path.endswith("/"):
        return None
    # Join against file directory
    candidate = (base_file.parent / path).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return candidate


def expected_lang_target(src_lang: str, page: str, to_lang: str) -> tuple[str, str]:
    """Return (kind, expected_rel_path) where kind is equiv|home_fallback."""
    equiv = f"{to_lang}/{page}"
    if (ROOT / equiv).is_file():
        return "equiv", equiv
    return "home_fallback", f"{to_lang}/index.html"


def normalize_switcher_dest(src_file: Path, href: str) -> str | None:
    resolved = resolve_local(src_file, href.split("#")[0].split("?")[0])
    if not resolved or not resolved.is_file():
        # still return intended relative path if under ROOT
        try:
            joined = (src_file.parent / href.split("#")[0].split("?")[0]).resolve()
            return joined.relative_to(ROOT.resolve()).as_posix().replace("\\", "/")
        except Exception:
            return None
    return resolved.relative_to(ROOT.resolve()).as_posix().replace("\\", "/")


def audit() -> dict:
    findings: list[Finding] = []
    inventory: dict[str, set[str]] = {}
    for lang in LANGS:
        inventory[lang] = {rel_page(p, lang) for p in html_files(lang)}

    # --- Core page parity ---
    for page in CORE_PAGES:
        present = [lang for lang in LANGS if page in inventory[lang]]
        missing = [lang for lang in LANGS if page not in inventory[lang]]
        if missing:
            sev = "error" if page in {"index.html", "sitemap.html", "feedback.html"} or set(missing) != {"de"} else "warn"
            # discoveries-like optional pages already handled elsewhere
            findings.append(
                Finding(
                    sev,
                    "page_parity",
                    ",".join(missing),
                    page,
                    f"Missing in: {', '.join(missing)}; present in: {', '.join(present) or 'none'}",
                )
            )

    # Extra pages only in some langs
    all_pages = set().union(*inventory.values())
    for page in sorted(all_pages):
        if page.startswith("categories/") or page.startswith("authors/") or page.startswith("stories/"):
            continue
        if page in CORE_PAGES:
            continue
        present = [lang for lang in LANGS if page in inventory[lang]]
        missing = [lang for lang in LANGS if page not in inventory[lang]]
        if missing and present:
            # Discoveries is deferred (future work) — skip parity noise for it.
            if page.startswith("discoveries/"):
                continue
            if page.startswith("prominent-figures/"):
                findings.append(
                    Finding(
                        "info",
                        "page_parity",
                        ",".join(missing),
                        page,
                        f"EN-only draft (noindex preview); intentionally missing in {', '.join(missing)}",
                    )
                )
            else:
                findings.append(
                    Finding(
                        "warn",
                        "page_parity",
                        ",".join(missing),
                        page,
                        f"Present in {', '.join(present)}; missing in {', '.join(missing)}",
                    )
                )

    # --- Category slug parity ---
    cat_sets = {lang: load_category_slugs(lang) for lang in LANGS}
    union_cats = set().union(*cat_sets.values()) if cat_sets else set()
    for slug in sorted(union_cats):
        missing = [lang for lang in LANGS if slug not in cat_sets[lang]]
        if missing:
            findings.append(
                Finding(
                    "error",
                    "categories",
                    ",".join(missing),
                    f"categories/{slug}.html",
                    f"Category missing in {', '.join(missing)}",
                )
            )

    # --- Story stem parity ---
    stem_sets = {lang: load_story_stems(lang) for lang in LANGS}
    # Compare non-DE full locales first; DE may be subset
    full = ("az", "en", "ru", "ky")
    for a in full:
        for b in full:
            if a >= b:
                continue
            only_a = sorted(stem_sets[a] - stem_sets[b])
            only_b = sorted(stem_sets[b] - stem_sets[a])
            for stem in only_a[:50]:
                if a == "az" and expected_missing_vs_az(b, stem):
                    findings.append(
                        Finding(
                            "info",
                            "stories",
                            a,
                            stem,
                            f"AZ-only catalog stem (policy); not in {b}",
                        )
                    )
                else:
                    findings.append(
                        Finding("warn", "stories", a, stem, f"Stem in {a} but not in {b}")
                    )
            for stem in only_b[:50]:
                if b == "az" and expected_missing_vs_az(a, stem):
                    findings.append(
                        Finding(
                            "info",
                            "stories",
                            b,
                            stem,
                            f"AZ-only catalog stem (policy); not in {a}",
                        )
                    )
                else:
                    findings.append(
                        Finding("warn", "stories", b, stem, f"Stem in {b} but not in {a}")
                    )
    # DE vs AZ
    de_missing = sorted(stem_sets["az"] - stem_sets["de"])
    de_extra = sorted(stem_sets["de"] - stem_sets["az"])
    policy_only = sorted(s for s in de_missing if s in AZ_ONLY_STEMS)
    unexpected = sorted(s for s in de_missing if s not in AZ_ONLY_STEMS)
    findings.append(
        Finding(
            "info",
            "stories",
            "de",
            "stem-coverage",
            f"DE has {len(stem_sets['de'])} stems; AZ has {len(stem_sets['az'])}; "
            f"AZ-only policy={len(policy_only)}; unexpected missing vs AZ={len(unexpected)}; "
            f"extra vs AZ={len(de_extra)}",
        )
    )
    for stem in policy_only:
        findings.append(
            Finding("info", "stories", "de", stem, "AZ-only catalog stem (policy); not in DE")
        )
    for stem in unexpected[:30]:
        findings.append(Finding("warn", "stories", "de", stem, "Published in AZ but not DE"))

    # --- Lang switcher consistency on key surfaces ---
    key_pages = list(CORE_PAGES) + [
        "categories/hikmet-ve-heyat-dersleri.html",
        "discoveries/discoveries-and-inventions.html",
    ]
    for lang in LANGS:
        for page in key_pages:
            path = ROOT / lang / page
            if not path.is_file():
                continue
            html = path.read_text(encoding="utf-8", errors="ignore")
            parser = HrefCollector()
            try:
                parser.feed(html)
            except Exception as exc:  # noqa: BLE001
                findings.append(Finding("error", "parse", lang, page, f"HTML parse failed: {exc}"))
                continue
            if not parser.lang_options:
                findings.append(Finding("error", "lang_switcher", lang, page, "No lang-switcher options found"))
                continue
            # href vs data-lang-target mismatch
            for opt in parser.lang_options:
                href = opt["href"]
                tgt = opt["target"]
                if href and tgt and href.split("#")[0].split("?")[0] != tgt.split("#")[0].split("?")[0]:
                    findings.append(
                        Finding(
                            "error",
                            "lang_switcher",
                            lang,
                            page,
                            f"href/target mismatch for {opt['lang']}: href={href} target={tgt}",
                        )
                    )
                to_lang = opt["lang"]
                if not to_lang or to_lang == lang:
                    continue
                kind, expected = expected_lang_target(lang, page, to_lang)
                dest = normalize_switcher_dest(path, tgt or href)
                if not dest:
                    findings.append(
                        Finding(
                            "error",
                            "lang_switcher",
                            lang,
                            page,
                            f"Unresolved {to_lang} target {tgt or href}",
                        )
                    )
                    continue
                # Accept either exact expected or path ending
                if dest != expected and not dest.endswith("/" + expected.split("/", 1)[-1]):
                    # Special case: discoveries missing in DE → home is OK
                    if kind == "home_fallback" and dest.endswith(f"{to_lang}/index.html"):
                        continue
                    if dest.endswith(expected.replace("\\", "/")):
                        continue
                    findings.append(
                        Finding(
                            "warn" if kind == "home_fallback" else "error",
                            "lang_switcher",
                            lang,
                            page,
                            f"{to_lang} lands on {dest}; expected {expected} ({kind})",
                        )
                    )

            # Internal broken links (same-site relative)
            for tag, href in parser.hrefs:
                if tag != "a":
                    continue
                resolved = resolve_local(path, href)
                if resolved is None:
                    continue
                if resolved.suffix.lower() in {".html", ""} or "html" in resolved.suffix.lower():
                    check = resolved if resolved.suffix else resolved.with_suffix(".html")
                    if not check.is_file() and not resolved.is_file():
                        # ignore root index redirects etc.
                        if "en/about" in href.replace("\\", "/") and lang == "de":
                            continue
                        findings.append(
                            Finding(
                                "error",
                                "broken_link",
                                lang,
                                page,
                                f"Broken link {href} → missing {check.relative_to(ROOT) if ROOT in check.parents or check.is_relative_to(ROOT) else check}",
                            )
                        )

    # --- Nav chrome: required destinations on index ---
    nav_must = {
        "feedback": "feedback.html",
        "sitemap": "sitemap.html",
        "help": "user-manual.html",
        "about": "about/mission-vision-values.html",
    }
    for lang in LANGS:
        index = ROOT / lang / "index.html"
        if not index.is_file():
            continue
        html = index.read_text(encoding="utf-8", errors="ignore")
        for key, needle in nav_must.items():
            # DE about may be local; discoveries may be EN
            if needle not in html and f"../{needle}" not in html and f"/{needle}" not in html:
                # about for DE historically EN-linked
                if key == "about" and lang == "de":
                    if "about/mission-vision-values.html" not in html and "en/about/mission-vision-values.html" not in html:
                        findings.append(Finding("error", "nav", lang, "index.html", "About link missing"))
                elif key == "about" and f"{lang}/about/" not in html:
                    if "about/mission-vision-values.html" not in html:
                        findings.append(Finding("error", "nav", lang, "index.html", f"Missing nav link for {key}"))
                else:
                    if needle.split("/")[-1] not in html:
                        findings.append(Finding("warn", "nav", lang, "index.html", f"Possible missing nav for {key}"))

        # DE about should be local now
        if lang == "de":
            if "en/about/mission-vision-values.html" in html and "about/mission-vision-values.html" not in html.replace(
                "en/about/mission-vision-values.html", ""
            ):
                findings.append(
                    Finding("error", "nav", "de", "index.html", "About still points only to English")
                )
            elif re.search(r'href="[^"]*en/about/mission-vision-values\.html"', html) and not re.search(
                r'data-nav-id="mission"[^>]*href="about/mission-vision-values\.html"|href="about/mission-vision-values\.html"[^>]*data-nav-id="mission"',
                html,
            ):
                # mission link specifically
                if 'data-nav-id="mission"' in html and "en/about/mission-vision-values.html" in html:
                    findings.append(
                        Finding("error", "nav", "de", "index.html", "Mission nav still points to EN about")
                    )

    # --- Sitemap cards vs files ---
    for lang in LANGS:
        sm = ROOT / lang / "sitemap.html"
        if not sm.is_file():
            findings.append(Finding("error", "sitemap", lang, "sitemap.html", "Sitemap page missing"))
            continue
        html = sm.read_text(encoding="utf-8", errors="ignore")
        parser = HrefCollector()
        parser.feed(html)
        for tag, href in parser.hrefs:
            if tag != "a":
                continue
            resolved = resolve_local(sm, href)
            if resolved is None:
                continue
            if resolved.suffix.lower() == ".html" and not resolved.is_file():
                findings.append(
                    Finding(
                        "error",
                        "sitemap",
                        lang,
                        "sitemap.html",
                        f"Sitemap links to missing {href}",
                    )
                )

    # --- Help / user manual ---
    for lang in LANGS:
        manual = ROOT / lang / "user-manual.html"
        if not manual.is_file():
            findings.append(Finding("error", "help", lang, "user-manual.html", "User manual missing"))
            continue
        html = manual.read_text(encoding="utf-8", errors="ignore")
        parser = HrefCollector()
        parser.feed(html)
        if not parser.lang_options:
            findings.append(Finding("warn", "help", lang, "user-manual.html", "No language switcher on help page"))
        else:
            for opt in parser.lang_options:
                to_lang = opt["lang"]
                if to_lang == lang or not to_lang:
                    continue
                dest = normalize_switcher_dest(manual, opt["target"] or opt["href"])
                expected = f"{to_lang}/user-manual.html" if (ROOT / to_lang / "user-manual.html").is_file() else f"{to_lang}/index.html"
                if dest and not dest.endswith(expected.split("/", 1)[-1]) and dest != expected:
                    if expected.endswith("user-manual.html") and "user-manual.html" not in (dest or ""):
                        findings.append(
                            Finding(
                                "error",
                                "help",
                                lang,
                                "user-manual.html",
                                f"Switcher {to_lang} → {dest}, expected {expected}",
                            )
                        )

    # --- site.js cache-buster spread ---
    versions = Counter()
    for lang in LANGS:
        for path in html_files(lang):
            text = path.read_text(encoding="utf-8", errors="ignore")
            for m in re.finditer(r"assets/site\.js\?v=([^\"'\s]+)", text):
                versions[m.group(1)] += 1
    if len(versions) > 1:
        findings.append(
            Finding(
                "warn",
                "assets",
                "*",
                "site.js",
                f"Multiple site.js versions in HTML: {dict(versions)}",
            )
        )
    elif versions:
        findings.append(
            Finding("info", "assets", "*", "site.js", f"Consistent site.js version: {next(iter(versions))}")
        )

    # --- i18n.js presence ---
    for lang in LANGS:
        i18n = ROOT / lang / "assets" / "i18n.js"
        if not i18n.is_file():
            findings.append(Finding("error", "assets", lang, f"{lang}/assets/i18n.js", "Missing locale i18n.js"))

    # Aggregate
    by_sev = Counter(f.severity for f in findings)
    by_area = Counter(f.area for f in findings)
    return {
        "summary": {
            "findings": len(findings),
            "by_severity": dict(by_sev),
            "by_area": dict(by_area),
            "pages_per_lang": {lang: len(inventory[lang]) for lang in LANGS},
            "stories_per_lang": {lang: len(stem_sets[lang]) for lang in LANGS},
            "categories_per_lang": {lang: len(cat_sets[lang]) for lang in LANGS},
        },
        "findings": [asdict(f) for f in findings],
        "inventory": {lang: sorted(inventory[lang]) for lang in LANGS},
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    result = audit()
    (OUT / "consistency-audit.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    fields = ["severity", "area", "lang", "path", "detail"]
    with (OUT / "consistency-audit.csv").open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for row in result["findings"]:
            w.writerow(row)

    # Compact markdown
    lines = [
        "# Project consistency audit",
        "",
        f"Pages/lang: {result['summary']['pages_per_lang']}",
        f"Stories/lang: {result['summary']['stories_per_lang']}",
        f"Categories/lang: {result['summary']['categories_per_lang']}",
        f"Findings: {result['summary']['by_severity']}",
        "",
    ]
    for sev in ("error", "warn", "info"):
        rows = [f for f in result["findings"] if f["severity"] == sev]
        lines.append(f"## {sev.upper()} ({len(rows)})")
        lines.append("")
        if not rows:
            lines.append("_None._")
            lines.append("")
            continue
        # Cap very large story stem lists in markdown
        shown = 0
        for f in rows:
            if f["area"] == "stories" and "Stem in" in f["detail"]:
                continue  # summarized below
            lines.append(f"- **[{f['area']}]** `{f['lang']}` `{f['path']}` — {f['detail']}")
            shown += 1
            if shown > 200:
                lines.append(f"- … truncated; see CSV for full list ({len(rows)} {sev} rows)")
                break
        stem_warns = [f for f in rows if f["area"] == "stories" and "Stem in" in f["detail"]]
        if stem_warns:
            by_lang = Counter(f["lang"] for f in stem_warns)
            lines.append(f"- Story stem mismatches (sample capped in JSON/CSV): {dict(by_lang)} total {len(stem_warns)}")
        lines.append("")

    (OUT / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
