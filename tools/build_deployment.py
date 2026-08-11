#!/usr/bin/env python3
"""Build a production-ready deployment/ folder from the generated site.

Copies only what the static host needs:
  - index.html
  - az/index.html, az/categories/, az/assets/, az/data/, az/illustrations/

Excludes builder tools, source .docx stories, and oversized local archives.
"""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / "deployment"

COPY_ROOT_FILES = ("index.html",)
COPY_AZ_DIRS = ("assets", "categories", "data", "illustrations")
COPY_AZ_FILES = ("index.html",)


def main() -> None:
    if not (ROOT / "az" / "index.html").is_file():
        raise SystemExit("Missing az/index.html — run tools/build_website.py first.")

    if DEPLOY.exists():
        shutil.rmtree(DEPLOY)
    DEPLOY.mkdir(parents=True)

    for name in COPY_ROOT_FILES:
        src = ROOT / name
        if src.is_file():
            shutil.copy2(src, DEPLOY / name)

    az_dst = DEPLOY / "az"
    az_dst.mkdir()
    for name in COPY_AZ_FILES:
        src = ROOT / "az" / name
        if src.is_file():
            shutil.copy2(src, az_dst / name)

    for name in COPY_AZ_DIRS:
        src = ROOT / "az" / name
        if not src.is_dir():
            raise SystemExit(f"Missing required folder: {src}")
        shutil.copytree(src, az_dst / name)

    files = sum(1 for p in DEPLOY.rglob("*") if p.is_file())
    size_mb = sum(p.stat().st_size for p in DEPLOY.rglob("*") if p.is_file()) / (1024 * 1024)
    print(f"deployment: {DEPLOY}")
    print(f"files={files} size_mb={size_mb:.1f}")


if __name__ == "__main__":
    main()
