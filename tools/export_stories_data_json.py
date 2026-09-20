# -*- coding: utf-8 -*-
"""Emit lang/assets/stories-data.json from stories-data.js for clean fetch()."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "window.__BIRINCI_STORIES__ = "
LANGS = ("az", "en", "ru", "ky")


def main() -> None:
    for lang in LANGS:
        src = ROOT / lang / "assets" / "stories-data.js"
        dst = ROOT / lang / "assets" / "stories-data.json"
        text = src.read_text(encoding="utf-8")
        start = text.index(PREFIX) + len(PREFIX)
        payload, _ = json.JSONDecoder().raw_decode(text, start)
        dst.write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
            newline="\n",
        )
        print(f"wrote {dst.relative_to(ROOT)} ({dst.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
