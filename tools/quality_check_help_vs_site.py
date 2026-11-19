# -*- coding: utf-8 -*-
"""Quality check: help manuals vs actual site functionality + surface sanity."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("az", "en", "ru", "ky", "de")
OUT = ROOT / "docs" / "reviews" / "quality-check-20261119"

try:
    from publish_policy import SEPARATELY_PUBLISHED_URLS
except ImportError:  # pragma: no cover
    SEPARATELY_PUBLISHED_URLS = frozenset({"https://birinci.cloud/offline/"})


@dataclass
class Finding:
    severity: str  # error | warn | info
    area: str
    lang: str
    detail: str


class AttrCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []
        self.srcs: list[str] = []
        self.ids: set[str] = set()
        self.section_ids: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        ad = {k: (v or "") for k, v in attrs}
        if tag == "a" and ad.get("href"):
            self.hrefs.append(ad["href"])
        if tag in {"img", "script", "link", "source"} and ad.get("src"):
            self.srcs.append(ad["src"])
        if tag == "img" and ad.get("src"):
            self.srcs.append(ad["src"])
        if ad.get("id"):
            self.ids.add(ad["id"])
        if tag == "section" and "guide-section" in ad.get("class", "") and ad.get("id"):
            self.section_ids.append(ad["id"])


def resolve(base: Path, href: str) -> Path | None:
    href = href.split("#")[0].split("?")[0].strip()
    if not href or href.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return None
    if href.startswith(("http://", "https://")):
        return None  # external — checked separately
    return (base / href).resolve()


def load_manual(lang: str) -> tuple[str, AttrCollector]:
    path = ROOT / lang / "user-manual.html"
    text = path.read_text(encoding="utf-8", errors="ignore")
    p = AttrCollector()
    p.feed(text)
    return text, p


def check_manual_assets(lang: str, text: str, parser: AttrCollector, findings: list[Finding]) -> None:
    base = ROOT / lang
    for src in parser.srcs:
        if "manuals/" not in src and "help.png" not in src and "button-reference" not in src:
            # still check manuals and help hero
            if not any(x in src for x in ("manuals/", "help.png", "user-manual")):
                continue
        target = resolve(base, src)
        if target is None:
            continue
        if not target.is_file():
            findings.append(Finding("error", "help_asset", lang, f"Missing asset {src}"))

    # Explicit button-reference imgs via regex (parser got them via src)
    for m in re.finditer(r'src="([^"]*manuals/[^"]+)"', text):
        src = m.group(1)
        target = resolve(base, src)
        if target and not target.is_file():
            findings.append(Finding("error", "help_asset", lang, f"Missing manuals asset {src}"))


def check_manual_links(lang: str, parser: AttrCollector, findings: list[Finding]) -> None:
    base = ROOT / lang
    for href in parser.hrefs:
        if href.startswith("#"):
            continue
        if href.startswith("https://birinci.cloud"):
            # Normalize trailing slash for policy membership.
            canon = href if href.endswith("/") or "." in urlparse(href).path.rsplit("/", 1)[-1] else href + "/"
            if href.rstrip("/") + "/" in SEPARATELY_PUBLISHED_URLS or href in SEPARATELY_PUBLISHED_URLS or canon in SEPARATELY_PUBLISHED_URLS:
                continue
            path = urlparse(href).path.lstrip("/")
            continue
        target = resolve(base, href)
        if target is None:
            continue
        try:
            target.relative_to(ROOT)
        except ValueError:
            continue
        if not target.is_file() and not (target.is_dir() and (target / "index.html").is_file()):
            findings.append(Finding("error", "help_link", lang, f"Broken help href {href}"))


def check_section_parity(findings: list[Finding]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    for lang in LANGS:
        _, p = load_manual(lang)
        sections[lang] = p.section_ids
    base = set(sections["en"])
    for lang in LANGS:
        missing = sorted(base - set(sections[lang]))
        extra = sorted(set(sections[lang]) - base)
        if missing:
            findings.append(
                Finding("error", "help_parity", lang, f"Missing help sections vs EN: {missing}")
            )
        if extra:
            findings.append(
                Finding("warn", "help_parity", lang, f"Extra help sections vs EN: {extra}")
            )
    return sections


FEATURE_CHECKS = [
    # (id, claim_needle_in_en_help, verifier callable name)
]


def site_has_audio(lang: str) -> bool:
    # story audio buttons / mp3 folders
    audio_dir = ROOT / lang / "wisdom-stories" / "audio"
    if audio_dir.is_dir() and any(audio_dir.glob("*.mp3")):
        return True
    # JS markers
    for name in ("site.js", "story-navigation.js"):
        p = ROOT / "assets" / name
        if p.is_file() and "story-audio" in p.read_text(encoding="utf-8", errors="ignore"):
            # presence of player code ≠ audio available
            pass
    # i18n listen keys + data attributes on index
    index = ROOT / lang / "index.html"
    if index.is_file() and "data-story-audio" in index.read_text(encoding="utf-8", errors="ignore"):
        return True
    # preview: count mp3 under assets
    mp3s = list((ROOT / lang).rglob("*.mp3"))
    return len(mp3s) > 0


def check_help_claims_vs_reality(findings: list[Finding]) -> None:
    en_text, _ = load_manual("en")
    de_text, _ = load_manual("de")

    # Claim: no audio
    if "does not offer audio playback" in en_text or "does not offer audio" in en_text:
        for lang in LANGS:
            if site_has_audio(lang):
                findings.append(
                    Finding(
                        "warn",
                        "help_claim",
                        lang,
                        "Help says no audio, but locale has MP3/audio assets — help claim outdated",
                    )
                )
                break

    # Discoveries is deferred (future work). Do not flag help/nav/SEO gaps for it.

    # Authors: DE sitemap has authors; help never mentions Autoren pages
    if "authors/" in (ROOT / "de/sitemap.html").read_text(encoding="utf-8", errors="ignore"):
        if "Autoren" not in de_text and "authors" not in de_text.lower():
            findings.append(
                Finding(
                    "warn",
                    "help_missing",
                    "de",
                    "DE site exposes Autoren pages (sitemap) but DE help never documents them",
                )
            )

    # Compare page
    for lang in ("az", "en", "ru", "ky"):
        compare = ROOT / lang / "stories" / "compare.html"
        if not compare.is_file():
            findings.append(Finding("error", "functionality", lang, "stories/compare.html missing"))
        # help claims multilingual compare via globe — check JS hook exists
    site_js = (ROOT / "assets" / "site.js").read_text(encoding="utf-8", errors="ignore")
    if "multilingual" not in site_js.lower() and "compare" not in site_js.lower():
        # check story-navigation
        sn = ROOT / "assets" / "story-navigation.js"
        if sn.is_file():
            site_js += sn.read_text(encoding="utf-8", errors="ignore")
    if "Multilingual" not in site_js and "compare" not in site_js.lower():
        findings.append(
            Finding("warn", "functionality", "*", "Help documents multilingual compare; JS markers weak")
        )

    # Offline edition is a separately published product (see publish_policy).
    offline_url = "https://birinci.cloud/offline/"
    if offline_url in SEPARATELY_PUBLISHED_URLS:
        findings.append(
            Finding(
                "info",
                "help_offline",
                "*",
                "Help offline sections link to separately published birinci.cloud/offline/ (not in this repo)",
            )
        )
    # Screenshots for offline help sections should exist once manuals are built.
    for lang in LANGS:
        for stem in ("offline-install", "offline-download", "offline-test", "offline-usb"):
            webp = ROOT / "assets" / "manuals" / lang / f"{stem}.webp"
            if not webp.is_file():
                findings.append(
                    Finding("warn", "help_offline", lang, f"Missing offline help screenshot {stem}.webp")
                )

    # Feedback fields claimed
    fb = (ROOT / "en/feedback.html").read_text(encoding="utf-8", errors="ignore")
    for needle, label in (
        ("name", "Name"),
        ("email", "Email"),
        ("subject", "Subject"),
        ("privacy", "privacy confirm"),
        ("type=\"file\"", "file attachment"),
        ("5000", "message limit 5000"),
        ("5", "size hint"),
    ):
        if needle == "5000" and "5000" not in fb and "maxlength=\"5000\"" not in fb:
            findings.append(Finding("warn", "help_claim", "en", "Help claims 5000-char message; feedback form maxlength mismatch"))
        if needle == "type=\"file\"" and 'type="file"' not in fb and "type='file'" not in fb:
            findings.append(Finding("error", "help_claim", "en", "Help documents attachments but feedback form has no file input"))

    # maxlength checks more carefully
    m = re.search(r'name="[^"]*message[^"]*"[^>]*maxlength="(\d+)"', fb, re.I)
    if not m:
        m = re.search(r'maxlength="(\d+)"[^>]*name="[^"]*message', fb, re.I)
    if m and m.group(1) != "5000":
        findings.append(
            Finding("warn", "help_claim", "en", f"Help says message max 5000; form maxlength={m.group(1)}")
        )

    # Skip to content
    for lang in LANGS:
        index = (ROOT / lang / "index.html").read_text(encoding="utf-8", errors="ignore")
        if "skip" not in index.lower():
            findings.append(Finding("warn", "a11y", lang, "Home missing skip-to-content link claimed by help"))

    # Global search Ctrl+K
    if "global-search" not in (ROOT / "en/index.html").read_text(encoding="utf-8", errors="ignore"):
        findings.append(Finding("error", "functionality", "en", "Global search UI missing on home"))

    # QR in footer claimed
    if "qr" not in en_text.lower():
        pass
    else:
        # help mentions QR in footer
        for lang in LANGS:
            index = (ROOT / lang / "index.html").read_text(encoding="utf-8", errors="ignore")
            if "qr" not in index.lower() and "QR" not in index:
                findings.append(
                    Finding("warn", "help_claim", lang, "Help mentions footer QR code; home footer has no QR markup")
                )
                break


def check_surfaces(findings: list[Finding]) -> None:
    # SEO
    sm = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    if "de/about/mission-vision-values.html" not in sm:
        findings.append(Finding("error", "seo", "de", "XML sitemap missing de/about"))
    # Discoveries SEO presence/absence is deferred with the Discoveries product.

    # DE authors inbound
    de_sm = (ROOT / "de/sitemap.html").read_text(encoding="utf-8", errors="ignore")
    if "authors/index.html" not in de_sm:
        findings.append(Finding("error", "sitemap", "de", "DE HTML sitemap missing authors"))

    # site.js pin
    pins = set()
    for lang in LANGS:
        t = (ROOT / lang / "index.html").read_text(encoding="utf-8", errors="ignore")
        m = re.search(r"site\.js\?v=([^\"']+)", t)
        if m:
            pins.add(m.group(1))
    if len(pins) > 1:
        findings.append(Finding("warn", "assets", "*", f"Mixed site.js pins: {sorted(pins)}"))

    # i18n key parity
    keys = {}
    for lang in LANGS:
        t = (ROOT / lang / "assets" / "i18n.js").read_text(encoding="utf-8")
        keys[lang] = set(re.findall(r'"([a-zA-Z0-9_.-]+)"\s*:', t))
    for lang in LANGS:
        miss = keys["en"] - keys[lang]
        if miss:
            findings.append(Finding("warn", "i18n", lang, f"Missing {len(miss)} i18n keys vs EN"))

    # Help controls hidden?
    for lang in LANGS:
        t = (ROOT / lang / "user-manual.html").read_text(encoding="utf-8", errors="ignore")
        if 'class="controls" hidden' in t:
            # user-manual.js may unhide — check JS
            pass
    um = ROOT / "assets" / "user-manual.js"
    if um.is_file():
        js = um.read_text(encoding="utf-8", errors="ignore")
        if "hidden" in js and "controls" in js:
            findings.append(Finding("info", "help_ui", "*", "Guide search/topic controls start hidden; JS should reveal"))
        if "guide-search" not in js:
            findings.append(Finding("error", "help_ui", "*", "user-manual.js missing guide-search wiring"))


def check_nav_help_entry(findings: list[Finding]) -> None:
    for lang in LANGS:
        index = (ROOT / lang / "index.html").read_text(encoding="utf-8", errors="ignore")
        if "user-manual.html" not in index and 'data-nav-help' not in index:
            findings.append(Finding("error", "nav", lang, "Home missing Help / user-manual link"))


def main() -> None:
    findings: list[Finding] = []
    sections = check_section_parity(findings)
    for lang in LANGS:
        text, parser = load_manual(lang)
        check_manual_assets(lang, text, parser, findings)
        check_manual_links(lang, parser, findings)
        if len(parser.section_ids) < 15:
            findings.append(
                Finding("warn", "help", lang, f"Only {len(parser.section_ids)} guide sections")
            )
    check_help_claims_vs_reality(findings)
    check_surfaces(findings)
    check_nav_help_entry(findings)

    # Dedupe
    seen = set()
    uniq: list[Finding] = []
    for f in findings:
        key = (f.severity, f.area, f.lang, f.detail)
        if key in seen:
            continue
        seen.add(key)
        uniq.append(f)
    findings = uniq

    OUT.mkdir(parents=True, exist_ok=True)
    rows = [asdict(f) for f in findings]
    (OUT / "quality-check.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with (OUT / "quality-check.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["severity", "area", "lang", "detail"])
        w.writeheader()
        w.writerows(rows)

    by_sev = Counter(f.severity for f in findings)
    by_area = Counter(f.area for f in findings)
    lines = [
        "# Quality check — 2026-11-19",
        "",
        f"Findings: {dict(by_sev)}",
        f"By area: {dict(by_area)}",
        f"Help sections (EN): {sections.get('en')}",
        "",
        "## ERROR",
        "",
    ]
    errs = [f for f in findings if f.severity == "error"]
    warns = [f for f in findings if f.severity == "warn"]
    infos = [f for f in findings if f.severity == "info"]
    if not errs:
        lines.append("_None._")
    for f in errs:
        lines.append(f"- **[{f.area}]** `{f.lang}` — {f.detail}")
    lines += ["", "## WARN", ""]
    if not warns:
        lines.append("_None._")
    for f in warns:
        lines.append(f"- **[{f.area}]** `{f.lang}` — {f.detail}")
    lines += ["", "## INFO", ""]
    for f in infos:
        lines.append(f"- **[{f.area}]** `{f.lang}` — {f.detail}")
    (OUT / "REPORT.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps({"findings": len(findings), "by_severity": dict(by_sev), "by_area": dict(by_area)}, indent=2))
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
