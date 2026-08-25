#!/usr/bin/env python3
"""Build a local publish tree in deployment/ (gitignored)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from i18n_config import SUPPORTED_LANGS  # noqa: E402

DEPLOY = ROOT / "deployment"
LANGS = SUPPORTED_LANGS
COPY_DIRS = ("assets", "categories")
CONTENT_DIRS = ("wisdom-stories", "discovery-articles")
OPTIONAL_PAGE_DIRS = ("about", "discoveries")
OPTIONAL_DIRS = ("data",)
COPY_FILES = ("index.html", "sitemap.html")

# Word/PDF sources are local authoring inputs — never publish them.
IGNORE_PUBLISH = shutil.ignore_patterns(
    "*.pdf",
    "*.PDF",
    "*.docx",
    "*.DOCX",
    "Age10-14",
)


def copy_locale(lang: str) -> None:
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
    for name in CONTENT_DIRS:
        src = src_root / name
        if src.is_dir():
            shutil.copytree(src, dst / name, ignore=IGNORE_PUBLISH)
    for name in OPTIONAL_PAGE_DIRS:
        src = src_root / name
        if src.is_dir():
            shutil.copytree(src, dst / name)
    for name in OPTIONAL_DIRS:
        src = src_root / name
        if src.is_dir():
            shutil.copytree(src, dst / name)


def main() -> None:
    if DEPLOY.exists():
        shutil.rmtree(DEPLOY)
    DEPLOY.mkdir(parents=True)

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
        copy_locale(lang)

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
