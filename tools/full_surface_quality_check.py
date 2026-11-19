# -*- coding: utf-8 -*-
"""Full-surface quality check (Discoveries deferred — ignored)."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
LANGS = ("az", "en", "ru", "ky", "de")
OUT = ROOT / "docs" / "reviews" / "quality-check-20261119-full"
SKIP_PARTS = {"_reviews", "wisdom-stories", "discovery-articles", "node_modules", "discoveries"}

try:
    from publish_policy import SEPARATELY_PUBLISHED_URLS
except ImportError:  # pragma: no cover
    SEPARATELY_PUBLISHED_URLS = frozenset({"https://birinci.cloud/offline/"})

try:
    from locale_catalog_policy import AZ_ONLY_STEMS
except ImportError:
    AZ_ONLY_STEMS = frozenset()


@dataclass
class Finding:
    severity: str
    area: str
    lang: str
    path: str
    detail: str


class Collector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hrefs: list[str] = []
        self.srcs: list[str] = []
        self.ids: set[str] = set()
        self.classes: list[str] = []
        self.guide_sections: list[str] = []
        self.lang_opts: list[dict[str, str]] = []
        self._cur_opt: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        ad = {k: (v or "") for k, v in attrs}
        cls = ad.get("class", "")
        if cls:
            self.classes.append(cls)
        if ad.get("id"):
            self.ids.add(ad["id"])
        if tag == "a" and ad.get("href"):
            self.hrefs.append(ad["href"])
        if tag in {"img", "script", "source"} and ad.get("src"):
            self.srcs.append(ad["src"])
        if tag == "link" and ad.get("href"):
            self.srcs.append(ad["href"])
        if tag == "section" and "guide-section" in cls and ad.get("id"):
            self.guide_sections.append(ad["id"])
        if tag == "a" and "lang-switcher__option" in cls:
            self.lang_opts.append(
                {
                    "lang": ad.get("data-lang", ""),
                    "href": ad.get("href", ""),
                    "target": ad.get("data-lang-target", ""),
                }
            )


def is_discoveries(href: str | Path) -> bool:
    s = str(href).replace("\\", "/").lower()
    return "/discoveries/" in s or s.startswith("discoveries/") or "discoveries-and-inventions" in s


def html_pages(lang: str) -> list[Path]:
    out = []
    for p in (ROOT / lang).rglob("*.html"):
        if any(part in SKIP_PARTS for part in p.parts):
            continue
        if "discoveries" in p.parts:
            continue
        out.append(p)
    return sorted(out)


def resolve(base_file: Path, href: str) -> Path | None:
    href = href.split("#")[0].split("?")[0].strip()
    if not href or href.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return None
    if href.startswith(("http://", "https://")):
        return None
    return (base_file.parent / href).resolve()


def parse(path: Path) -> tuple[str, Collector]:
    text = path.read_text(encoding="utf-8", errors="ignore")
    c = Collector()
    try:
        c.feed(text)
    except Exception:
        pass
    return text, c


def audio_controls_enabled() -> bool:
    site_js = ROOT / "assets" / "site.js"
    if not site_js.is_file():
        return False
    m = re.search(r"const AUDIO_CONTROLS_ENABLED = (true|false)", site_js.read_text(encoding="utf-8"))
    return bool(m and m.group(1) == "true")


def load_stems(lang: str) -> set[str]:
    p = ROOT / lang / "assets" / "stories-data.js"
    if not p.is_file():
        return set()
    text = p.read_text(encoding="utf-8")
    data = json.loads(text[text.find("{") :].rstrip().rstrip(";"))
    return {s["stem"] for c in data.get("categories") or [] for s in c.get("stories") or [] if s.get("stem")}


def check_home(findings: list[Finding]) -> None:
    for lang in LANGS:
        path = ROOT / lang / "index.html"
        text, c = parse(path)
        if "skip" not in text.lower():
            findings.append(Finding("warn", "home", lang, "index.html", "Missing skip-to-content"))
        if "global-search" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing global search"))
        if "user-manual.html" not in text and "data-nav-help" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing Help nav link"))
        if "sitemap.html" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing Sitemap nav/footer link"))
        if "feedback.html" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing Feedback link"))
        if "mission-vision-values.html" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing About/mission link"))
        if "footer-qr" not in text and "qr/" not in text.lower():
            findings.append(Finding("warn", "home", lang, "index.html", "Missing footer QR"))
        if "lang-switcher" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing language switcher"))
        if "site-footer" not in text and "<footer" not in text:
            findings.append(Finding("error", "home", lang, "index.html", "Missing footer"))
        # legal set
        for legal in (
            "privacy-notice.html",
            "terms-of-use.html",
            "cookie-policy.html",
            "legal-notice.html",
        ):
            if legal not in text:
                findings.append(Finding("warn", "home", lang, "index.html", f"Footer/legal missing {legal}"))
        # switcher href/target
        for opt in c.lang_opts:
            if opt["href"] and opt["target"] and opt["href"].split("?")[0] != opt["target"].split("?")[0]:
                findings.append(
                    Finding(
                        "error",
                        "lang_switcher",
                        lang,
                        "index.html",
                        f"href/target mismatch for {opt['lang']}: {opt['href']} vs {opt['target']}",
                    )
                )
        # broken local home links (skip discoveries)
        for href in c.hrefs:
            if is_discoveries(href):
                continue
            if href.startswith(("http", "mailto", "#")):
                if href.rstrip("/") + "/" in SEPARATELY_PUBLISHED_URLS or href in SEPARATELY_PUBLISHED_URLS:
                    continue
                continue
            target = resolve(path, href)
            if target is None:
                continue
            try:
                target.relative_to(ROOT)
            except ValueError:
                continue
            if not target.is_file() and not (target.is_dir() and (target / "index.html").is_file()):
                findings.append(
                    Finding("error", "home_link", lang, "index.html", f"Broken link {href}")
                )


def check_sitemap(findings: list[Finding]) -> None:
    for lang in LANGS:
        path = ROOT / lang / "sitemap.html"
        if not path.is_file():
            findings.append(Finding("error", "sitemap", lang, "sitemap.html", "Missing sitemap page"))
            continue
        text, c = parse(path)
        for needle in (
            "sitemap-overview",
            "sitemap-stories",
            "sitemap-about",
            "sitemap-legal",
            "sitemap-languages",
            "user-manual.html",
            "mission-vision-values.html",
            "sitemap-search-input",
        ):
            if needle not in text:
                findings.append(
                    Finding("warn", "sitemap", lang, "sitemap.html", f"Missing expected piece {needle}")
                )
        if lang == "de" and "authors/" not in text:
            findings.append(
                Finding("warn", "sitemap", "de", "sitemap.html", "DE authors pages not listed")
            )
        # broken links from sitemap (sample all non-discoveries)
        broken = 0
        for href in c.hrefs:
            if is_discoveries(href) or href.startswith(("#", "mailto:", "http")):
                continue
            target = resolve(path, href)
            if target is None:
                continue
            try:
                target.relative_to(ROOT)
            except ValueError:
                continue
            if not target.is_file() and not (target.is_dir() and (target / "index.html").is_file()):
                broken += 1
                if broken <= 8:
                    findings.append(
                        Finding("error", "sitemap_link", lang, "sitemap.html", f"Broken link {href}")
                    )
        if broken > 8:
            findings.append(
                Finding("error", "sitemap_link", lang, "sitemap.html", f"+{broken - 8} more broken links")
            )


def check_help(findings: list[Finding]) -> None:
    sections: dict[str, list[str]] = {}
    for lang in LANGS:
        path = ROOT / lang / "user-manual.html"
        text, c = parse(path)
        sections[lang] = c.guide_sections
        if len(c.guide_sections) < 15:
            findings.append(
                Finding("warn", "help", lang, "user-manual.html", f"Only {len(c.guide_sections)} sections")
            )
        # assets
        for src in c.srcs:
            if "manuals/" not in src and "help.png" not in src:
                continue
            target = resolve(path, src)
            if target and not target.is_file():
                findings.append(Finding("error", "help_asset", lang, "user-manual.html", f"Missing {src}"))
        for stem in ("offline-install", "offline-download", "offline-test", "offline-usb"):
            webp = ROOT / "assets" / "manuals" / lang / f"{stem}.webp"
            if not webp.is_file():
                findings.append(
                    Finding("error", "help_asset", lang, "user-manual.html", f"Missing {stem}.webp")
                )
            elif f"offline-{stem.split('-', 1)[1]}" not in text and stem not in text:
                # section id should appear
                if f'id="{stem}"' not in text:
                    findings.append(
                        Finding("warn", "help", lang, "user-manual.html", f"Section {stem} missing")
                    )
        # offline link policy
        if "birinci.cloud/offline/" in text:
            if "https://birinci.cloud/offline/" not in SEPARATELY_PUBLISHED_URLS:
                findings.append(
                    Finding("warn", "help_offline", lang, "user-manual.html", "Offline URL not in publish policy")
                )
        # switcher
        for opt in c.lang_opts:
            if opt["href"] and opt["target"] and opt["href"] != opt["target"]:
                findings.append(
                    Finding(
                        "error",
                        "lang_switcher",
                        lang,
                        "user-manual.html",
                        f"href/target mismatch {opt['lang']}",
                    )
                )

    base = set(sections.get("en") or [])
    for lang in LANGS:
        miss = sorted(base - set(sections[lang]))
        if miss:
            findings.append(
                Finding("error", "help_parity", lang, "user-manual.html", f"Missing sections vs EN: {miss}")
            )

    # Claims vs reality (non-Discoveries)
    en = (ROOT / "en/user-manual.html").read_text(encoding="utf-8", errors="ignore")
    main = re.search(r'<main id="main">([\s\S]*)</main>', en)
    body = main.group(1) if main else en
    if "does not offer audio" in body or "does not offer audio playback" in body:
        if audio_controls_enabled():
            findings.append(
                Finding(
                    "warn",
                    "help_claim",
                    "en",
                    "user-manual.html#reading",
                    "Help denies audio/read-aloud but AUDIO_CONTROLS_ENABLED is true",
                )
            )
        else:
            findings.append(
                Finding(
                    "info",
                    "help_claim",
                    "en",
                    "user-manual.html#reading",
                    "Help ‘no audio’ matches AUDIO_CONTROLS_ENABLED=false (Listen chrome gated/hidden)",
                )
            )

    de_help = (ROOT / "de/user-manual.html").read_text(encoding="utf-8", errors="ignore")
    de_main = re.search(r'<main id="main">([\s\S]*)</main>', de_help)
    de_body = de_main.group(1) if de_main else ""
    if (ROOT / "de/authors/index.html").is_file():
        if "authors/" not in de_body and "Autorenverzeichnis" not in de_body:
            # author filter mention is not enough if directory pages exist
            if "authors/index" not in de_help:
                findings.append(
                    Finding(
                        "warn",
                        "help_missing",
                        "de",
                        "user-manual.html",
                        "DE Autoren pages exist in sitemap but Help does not document author directory pages",
                    )
                )

    # Feedback limits
    fb = (ROOT / "en/feedback.html").read_text(encoding="utf-8", errors="ignore")
    if 'type="file"' not in fb and "type='file'" not in fb:
        findings.append(Finding("error", "feedback", "en", "feedback.html", "No file input; Help documents attachments"))
    if 'maxlength="5000"' not in fb:
        findings.append(Finding("warn", "feedback", "en", "feedback.html", "Message maxlength not 5000 as Help states"))
    if "privacyconfirm" not in fb:
        findings.append(Finding("error", "feedback", "en", "feedback.html", "Missing privacy confirmation"))


def check_core_pages(findings: list[Finding]) -> None:
    core = (
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
    for lang in LANGS:
        for rel in core:
            p = ROOT / lang / rel
            if not p.is_file():
                findings.append(Finding("error", "page_parity", lang, rel, "Missing core page"))
                continue
            text, c = parse(p)
            if "lang-switcher" not in text:
                findings.append(Finding("error", "chrome", lang, rel, "Missing lang switcher"))
            for opt in c.lang_opts:
                if opt["href"] and opt["target"]:
                    h = opt["href"].split("#")[0].split("?")[0]
                    t = opt["target"].split("#")[0].split("?")[0]
                    if h != t:
                        findings.append(
                            Finding(
                                "error",
                                "lang_switcher",
                                lang,
                                rel,
                                f"href/target mismatch for {opt['lang']}",
                            )
                        )


def check_assets_and_seo(findings: list[Finding]) -> None:
    pins = Counter()
    stale_files = []
    for lang in LANGS:
        for p in html_pages(lang):
            text = p.read_text(encoding="utf-8", errors="ignore")
            for m in re.findall(r"site\.js\?v=([^\"']+)", text):
                pins[m] += 1
                if m != "20261119langswitch1":
                    stale_files.append(p.relative_to(ROOT).as_posix())
        for name in ("stories-data.js", "search-index.js", "i18n.js"):
            if not (ROOT / lang / "assets" / name).is_file():
                findings.append(Finding("error", "assets", lang, f"assets/{name}", "Missing asset"))

    if len(pins) > 1:
        findings.append(
            Finding(
                "warn",
                "assets",
                "*",
                "site.js",
                f"Mixed site.js pins {dict(pins)}; stale e.g. {stale_files[:6]}",
            )
        )
    elif pins:
        findings.append(Finding("info", "assets", "*", "site.js", f"Consistent pin {next(iter(pins))}"))

    # i18n keys
    keys = {}
    for lang in LANGS:
        t = (ROOT / lang / "assets" / "i18n.js").read_text(encoding="utf-8")
        keys[lang] = set(re.findall(r'"([a-zA-Z0-9_.-]+)"\s*:', t))
    for lang in LANGS:
        miss = keys["en"] - keys[lang]
        if miss:
            findings.append(Finding("warn", "i18n", lang, "assets/i18n.js", f"Missing {len(miss)} keys vs EN"))

    sm = ROOT / "sitemap.xml"
    if not sm.is_file():
        findings.append(Finding("error", "seo", "*", "sitemap.xml", "Missing root sitemap.xml"))
    else:
        text = sm.read_text(encoding="utf-8")
        if "de/about/mission-vision-values.html" not in text:
            findings.append(Finding("error", "seo", "de", "sitemap.xml", "Missing de/about"))
        dep = ROOT / "deployment" / "sitemap.xml"
        if dep.is_file() and "de/about/mission-vision-values.html" not in dep.read_text(encoding="utf-8"):
            findings.append(Finding("error", "seo", "de", "deployment/sitemap.xml", "Missing de/about"))

    # categories vs data
    for lang in LANGS:
        cats = {p.stem for p in (ROOT / lang / "categories").glob("*.html")} if (ROOT / lang / "categories").is_dir() else set()
        data_path = ROOT / lang / "assets" / "stories-data.js"
        if not data_path.is_file():
            continue
        blob = json.loads(data_path.read_text(encoding="utf-8")[data_path.read_text(encoding="utf-8").find("{") :].rstrip().rstrip(";"))
        slugs = {c["slug"] for c in blob.get("categories") or []}
        if slugs != cats:
            findings.append(
                Finding(
                    "error",
                    "categories",
                    lang,
                    "categories/",
                    f"slug≠HTML only_data={sorted(slugs-cats)} only_html={sorted(cats-slugs)}",
                )
            )

    # stem policy
    az = load_stems("az")
    for lang in ("en", "ru", "ky", "de"):
        other = load_stems(lang)
        unexpected = sorted((az - other) - AZ_ONLY_STEMS)
        if unexpected:
            findings.append(
                Finding(
                    "warn",
                    "stories",
                    lang,
                    "stem-coverage",
                    f"Unexpected stems in AZ not in {lang}: {unexpected[:10]}",
                )
            )


def check_sample_broken_links(findings: list[Finding]) -> None:
    """Scan all non-Discoveries HTML for broken relative links (cap noise)."""
    per_lang_broken: dict[str, int] = Counter()
    samples: list[Finding] = []
    for lang in LANGS:
        for path in html_pages(lang):
            # skip heavy category story embeds? still check chrome links
            text, c = parse(path)
            for href in c.hrefs:
                if is_discoveries(href) or href.startswith(("#", "mailto:", "http", "javascript:")):
                    continue
                target = resolve(path, href)
                if target is None:
                    continue
                try:
                    rel = target.relative_to(ROOT)
                except ValueError:
                    continue
                if "discoveries" in rel.parts:
                    continue
                if not target.is_file() and not (target.is_dir() and (target / "index.html").is_file()):
                    per_lang_broken[lang] += 1
                    if len(samples) < 25:
                        samples.append(
                            Finding(
                                "error",
                                "broken_link",
                                lang,
                                path.relative_to(ROOT).as_posix(),
                                f"Broken {href}",
                            )
                        )
    findings.extend(samples)
    for lang, n in per_lang_broken.items():
        if n > 5:
            findings.append(
                Finding("error", "broken_link", lang, "*", f"{n} broken relative links (samples above)")
            )


def check_compare_and_tools(findings: list[Finding]) -> None:
    for lang in ("az", "en", "ru", "ky", "de"):
        p = ROOT / lang / "stories" / "compare.html"
        if lang == "de":
            # DE may or may not have compare — flag only if help claims it works for DE the same way
            continue
        if not p.is_file():
            findings.append(Finding("error", "functionality", lang, "stories/compare.html", "Missing compare page"))


def dedupe(findings: list[Finding]) -> list[Finding]:
    seen = set()
    out = []
    for f in findings:
        key = (f.severity, f.area, f.lang, f.path, f.detail)
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def main() -> None:
    findings: list[Finding] = []
    check_home(findings)
    check_sitemap(findings)
    check_help(findings)
    check_core_pages(findings)
    check_assets_and_seo(findings)
    check_compare_and_tools(findings)
    check_sample_broken_links(findings)
    findings = dedupe(findings)

    OUT.mkdir(parents=True, exist_ok=True)
    rows = [asdict(f) for f in findings]
    (OUT / "quality-check.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with (OUT / "quality-check.csv").open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["severity", "area", "lang", "path", "detail"])
        w.writeheader()
        w.writerows(rows)

    by_sev = Counter(f.severity for f in findings)
    by_area = Counter(f.area for f in findings)
    lines = [
        "# Full-surface quality check — 2026-11-19",
        "",
        "**Discoveries deferred — excluded from findings.**",
        "",
        f"Findings: {dict(by_sev)}",
        f"By area: {dict(by_area)}",
        "",
    ]
    for sev in ("error", "warn", "info"):
        lines.append(f"## {sev.upper()}")
        lines.append("")
        group = [f for f in findings if f.severity == sev]
        if not group:
            lines.append("_None._")
            lines.append("")
            continue
        for f in group:
            lines.append(f"- **[{f.area}]** `{f.lang}` `{f.path}` — {f.detail}")
        lines.append("")
    (OUT / "REPORT.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({"findings": len(findings), "by_severity": dict(by_sev), "by_area": dict(by_area)}, indent=2))
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
