# -*- coding: utf-8 -*-
"""Compatibility wrapper. Prefer tools/optional/build_kindle_epub.py."""
from pathlib import Path
import runpy

if __name__ == "__main__":
    runpy.run_path(
        str(Path(__file__).resolve().parent / "optional" / "build_kindle_epub.py"),
        run_name="__main__",
    )
