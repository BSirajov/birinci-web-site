# -*- coding: utf-8 -*-
"""Load the published story catalog from stories-data.js."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_PREFIX = "window.__BIRINCI_STORIES__ = "


def stories_data_path(lang: str) -> Path:
    return ROOT / lang / "assets" / "stories-data.js"


def load_stories_catalog(lang: str) -> dict:
    path = stories_data_path(lang)
    if not path.is_file():
        raise FileNotFoundError(path)
    text = path.read_text(encoding="utf-8")
    start = text.find(_PREFIX)
    if start < 0:
        raise ValueError(f"Missing stories blob in {path}")
    blob, _end = json.JSONDecoder().raw_decode(text, start + len(_PREFIX))
    return blob
