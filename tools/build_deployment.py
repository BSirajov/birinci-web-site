#!/usr/bin/env python3
"""Build a local publish tree in deployment/ (gitignored)."""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from i18n_config import SUPPORTED_LANGS  # noqa: E402
from publish_policy import (  # noqa: E402
    PUBLISH_DISCOVERIES_ENV,
    publish_discoveries_enabled,
)

DEPLOY = ROOT / "deployment"
LANGS = SUPPORTED_LANGS
COPY_DIRS = ("assets", "categories")
CONTENT_DIRS = ("wisdom-stories", "discovery-articles")
OPTIONAL_PAGE_DIRS = ("about", "discoveries", "stories")
OPTIONAL_DIRS = ("data",)
COPY_FILES = ("index.html", "sitemap.html")

# Discoveries is authored but not public yet: the publish tree leaves it out
# unless asked for it. The locale trees themselves always keep the section, so
# development keeps serving it from az/, en/, ru/, ky/ as usual.
DISCOVERY_LOCALE_DIRS = ("discoveries", "discovery-articles")

# Word/PDF sources are local authoring inputs — never publish them.
IGNORE_PUBLISH = shutil.ignore_patterns(
    "*.pdf",
    "*.PDF",
    "*.docx",
    "*.DOCX",
    "Age10-14*",
)


def copy_locale(lang: str, *, publish_discoveries: bool) -> None:
    src_root = ROOT / lang
    if not (src_root / "index.html").is_file():
        raise SystemExit(f"Missing {lang}/index.html — run tools/build_website.py first.")
    dst = DEPLOY / lang
    dst.mkdir(parents=True)
    for name in COPY_FILES:
        src = src_root / name
        if src.is_file():
            shutil.copy2(src, dst / name)
    for name in COPY_DIRS:
        src = src_root / name
        if not src.is_dir():
            raise SystemExit(f"Missing required folder: {src}")
        ignore = IGNORE_PUBLISH if name == "assets" else None
        shutil.copytree(src, dst / name, ignore=ignore)
    for group in (CONTENT_DIRS, OPTIONAL_PAGE_DIRS, OPTIONAL_DIRS):
        for name in group:
            if not publish_discoveries and name in DISCOVERY_LOCALE_DIRS:
                continue
            src = src_root / name
            if src.is_dir():
                shutil.copytree(src, dst / name, ignore=IGNORE_PUBLISH)


_NAV_LINK_RE = re.compile(
    r'[ \t]*<a class="primary-nav__link[^"]*" href="[^"]*discoveries-and-inventions\.html"'
    r"[^>]*>.*?</a>\n?",
    re.S,
)
_ROOT_CARD_RE = re.compile(
    r'[ \t]*<a class="cat-card page-card root-entry-card" data-root-entry="discoveries"'
    r"[^>]*>.*?</a>\n?",
    re.S,
)
_SITEMAP_CARD_RE = re.compile(
    r'\s*<a class="sitemap-card[^"]*sitemap-card--discoveries[^"]*"[^>]*>.*?</a>',
    re.S,
)
_SITEMAP_CHIP_RE = re.compile(
    r'\s*<a class="sitemap-jump__chip[^"]*sitemap-jump__chip--discoveries[^"]*"[^>]*>.*?</a>',
    re.S,
)
_SITEMAP_SECTION_RE = re.compile(
    r'[ \t]*<section class="sitemap-section[^"]*sitemap-section--discoveries[^"]*"'
    r".*?</section>\n?",
    re.S,
)
_ROOT_ENTRY_I18N_RE = re.compile(
    r'(<script type="application/json" id="root-entry-i18n">)(.*?)(</script>)',
    re.S,
)
_SITEMAP_URL_RE = re.compile(r"\s*<url>.*?</url>", re.S)

# The publish tree must not link to, list, or contain the section. Class names
# under assets/inventions/ are shared page furniture (the catalogue toolbar and
# sidebar are used by the home, category and sitemap pages), so only routes and
# content folders count as a leak.
DISCOVERY_LEAK_MARKERS = (
    "discoveries/discoveries-and-inventions",
    "discoveries-and-inventions.html",
    "discovery-articles/",
)
TEXT_SUFFIXES = frozenset({".html", ".htm", ".xml", ".txt", ".js", ".json", ".css"})


def strip_root_entry_i18n(html: str) -> str:
    """Drop the Discoveries card and nav labels from the root language payload."""

    def _repl(match: re.Match[str]) -> str:
        data = json.loads(match.group(2))
        for entry in data.values():
            entry.pop("discoveries_label", None)
            entry.pop("discoveries_href", None)
            entry.get("cards", {}).pop("discoveries", None)
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        return f"{match.group(1)}{payload}{match.group(3)}"

    return _ROOT_ENTRY_I18N_RE.sub(_repl, html, count=1)


def hide_discoveries_html(html: str) -> str:
    html = _NAV_LINK_RE.sub("", html, count=1)
    html = _ROOT_CARD_RE.sub("", html, count=1)
    html = _SITEMAP_CHIP_RE.sub("", html, count=1)
    html = _SITEMAP_CARD_RE.sub("", html, count=1)
    html = _SITEMAP_SECTION_RE.sub("", html, count=1)
    if 'id="root-entry-i18n"' in html:
        html = strip_root_entry_i18n(html)
    return html


def hide_discoveries_sitemap(xml: str) -> str:
    return _SITEMAP_URL_RE.sub(
        lambda m: "" if "/discoveries/" in m.group(0) else m.group(0),
        xml,
    )


def hide_discoveries(tree: Path) -> int:
    """Remove every public entry point to Discoveries from a publish tree."""
    edited = 0
    for path in sorted(tree.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        updated = hide_discoveries_html(text)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            edited += 1
    sitemap = tree / "sitemap.xml"
    if sitemap.is_file():
        text = sitemap.read_text(encoding="utf-8")
        updated = hide_discoveries_sitemap(text)
        if updated != text:
            sitemap.write_text(updated, encoding="utf-8")
            edited += 1
    return edited


def find_discovery_leaks(tree: Path) -> list[tuple[str, str]]:
    leaks: list[tuple[str, str]] = []
    for path in sorted(tree.rglob("*")):
        rel = path.relative_to(tree).as_posix()
        if path.is_dir():
            if path.name in DISCOVERY_LOCALE_DIRS:
                leaks.append((rel, "published folder"))
            continue
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in DISCOVERY_LEAK_MARKERS:
            if marker in text:
                leaks.append((rel, marker))
                break
    return leaks


def reset_deploy_dir(path: Path) -> None:
    """Remove a prior publish tree; on Windows keep the folder if it is locked open."""
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
        return
    try:
        shutil.rmtree(path)
    except OSError:
        for child in path.iterdir():
            if child.is_dir():
                shutil.rmtree(child, ignore_errors=True)
            else:
                try:
                    child.unlink()
                except OSError:
                    pass
    path.mkdir(parents=True, exist_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--with-discoveries",
        action="store_true",
        help=(
            "publish the Discoveries and Inventions section "
            f"(also enabled by {PUBLISH_DISCOVERIES_ENV}=1)"
        ),
    )
    args = parser.parse_args()
    # CLI --with-discoveries forces on; otherwise honor BIRINCI_PUBLISH_DISCOVERIES.
    publish_discoveries = publish_discoveries_enabled(
        flag=True if args.with_discoveries else None
    )

    reset_deploy_dir(DEPLOY)

    for name in ("index.html", "robots.txt", "sitemap.xml", "404.html"):
        src = ROOT / name
        if src.is_file():
            shutil.copy2(src, DEPLOY / name)
    languages_json = ROOT / "languages.json"
    if languages_json.is_file():
        shutil.copy2(languages_json, DEPLOY / "languages.json")
    flags_dir = ROOT / "flags"
    if flags_dir.is_dir():
        shutil.copytree(flags_dir, DEPLOY / "flags")
    shared_assets = ROOT / "assets"
    if shared_assets.is_dir():
        shutil.copytree(shared_assets, DEPLOY / "assets", ignore=IGNORE_PUBLISH)

    for lang in LANGS:
        if not (ROOT / lang / "index.html").is_file():
            print(f"skip {lang}: missing {lang}/index.html")
            continue
        copy_locale(lang, publish_discoveries=publish_discoveries)

    if publish_discoveries:
        print("discoveries: published")
    else:
        edited = hide_discoveries(DEPLOY)
        print(f"discoveries: hidden (pages dropped, {edited} files rewritten)")
        print(f"            publish with --with-discoveries or {PUBLISH_DISCOVERIES_ENV}=1")
        leaks = find_discovery_leaks(DEPLOY)
        if leaks:
            raise SystemExit(
                "Publish tree still reaches Discoveries:\n  "
                + "\n  ".join(f"{path}: {marker}" for path, marker in leaks[:10])
            )

    files = sum(1 for p in DEPLOY.rglob("*") if p.is_file())
    size_mb = sum(p.stat().st_size for p in DEPLOY.rglob("*") if p.is_file()) / (1024 * 1024)
    blocked = (
        list(DEPLOY.rglob("*.pdf"))
        + list(DEPLOY.rglob("*.PDF"))
        + list(DEPLOY.rglob("*.docx"))
        + list(DEPLOY.rglob("*.DOCX"))
    )
    print(f"deployment: {DEPLOY} (local publish copy, not committed)")
    print(f"files={files} size_mb={size_mb:.1f}")
    if blocked:
        raise SystemExit(f"Publish tree unexpectedly contains authoring files: {blocked[:5]}")


if __name__ == "__main__":
    main()
