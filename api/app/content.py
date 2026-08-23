from __future__ import annotations

import re

from fastapi import HTTPException

from app.schemas import LOCALES, TARGET_TYPES

SLUG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$")


def normalize_target(locale: str, target_type: str, target_slug: str) -> tuple[str, str, str]:
    loc = (locale or "").strip().lower()
    kind = (target_type or "").strip().lower()
    slug = (target_slug or "").strip()
    if loc not in LOCALES:
        raise HTTPException(status_code=400, detail="Unsupported locale.")
    if kind not in TARGET_TYPES:
        raise HTTPException(status_code=400, detail="target_type must be story or discovery.")
    if not SLUG_RE.match(slug):
        raise HTTPException(status_code=400, detail="Invalid target slug.")
    return loc, kind, slug


def clean_text(value: str, *, max_len: int) -> str:
    text = " ".join((value or "").replace("\r\n", "\n").split())
    text = text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Please enter some text.")
    if len(text) > max_len:
        raise HTTPException(status_code=400, detail=f"Text must be at most {max_len} characters.")
    return text
