from __future__ import annotations

import re
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError

from app.config import API_DIR

AVATAR_DIR = API_DIR / "var" / "avatars"
AVATAR_MAX_BYTES = 2 * 1024 * 1024
AVATAR_SIZE = 256
AVATAR_NAME_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$"
)


def avatar_path(filename: str) -> Path:
    return AVATAR_DIR / filename


def _sniff(data: bytes) -> str | None:
    if data[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def save_avatar(user_id: str, data: bytes) -> str:
    if not data:
        raise HTTPException(status_code=400, detail="Please choose a profile picture.")
    if len(data) > AVATAR_MAX_BYTES:
        raise HTTPException(status_code=400, detail="That image is too large (max 2 MB).")
    if _sniff(data) is None:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG, or WebP image.")
    try:
        image = Image.open(BytesIO(data))
        image.load()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG, or WebP image.") from exc

    if image.mode in ("RGBA", "LA", "P"):
        rgba = image.convert("RGBA")
        background = Image.new("RGB", rgba.size, (255, 255, 255))
        background.paste(rgba, mask=rgba.split()[-1])
        image = background
    else:
        image = image.convert("RGB")

    width, height = image.size
    side = min(width, height)
    if side < 1:
        raise HTTPException(status_code=400, detail="Please upload a JPEG, PNG, or WebP image.")
    left = (width - side) // 2
    top = (height - side) // 2
    image = image.crop((left, top, left + side, top + side))
    image = image.resize((AVATAR_SIZE, AVATAR_SIZE), Image.Resampling.LANCZOS)

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{user_id}.jpg"
    image.save(avatar_path(filename), "JPEG", quality=88, optimize=True)
    return filename


def public_avatar_url(filename: str | None) -> str | None:
    if not filename or not AVATAR_NAME_RE.match(filename):
        return None
    path = avatar_path(filename)
    if not path.is_file():
        return None
    version = int(path.stat().st_mtime)
    return f"/api/avatars/{filename}?v={version}"


def delete_avatar_file(filename: str | None) -> None:
    if not filename or not AVATAR_NAME_RE.match(filename):
        return
    try:
        avatar_path(filename).unlink(missing_ok=True)
    except OSError:
        pass
