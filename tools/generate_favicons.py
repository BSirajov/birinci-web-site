#!/usr/bin/env python3
"""Generate crisp multi-size favicons from assets/pearl.webp."""
from __future__ import annotations

import struct
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFilter

ASSETS = Path(__file__).resolve().parents[1] / "assets"
SRC = ASSETS / "pearl.webp"


def fit_square(im: Image.Image, size: int, pad_ratio: float = 0.08) -> Image.Image:
    """Center the transparent logo in a square canvas with padding."""
    rgba = im.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)

    pad = max(2, int(size * pad_ratio))
    inner = max(1, size - pad * 2)
    fitted = rgba.copy()
    fitted.thumbnail((inner, inner), Image.Resampling.LANCZOS)

    # Mild sharpen for small icons so shell/pearl edges stay readable.
    if size <= 48:
        fitted = fitted.filter(ImageFilter.UnsharpMask(radius=0.8, percent=120, threshold=2))
    elif size <= 180:
        fitted = fitted.filter(ImageFilter.UnsharpMask(radius=1.0, percent=90, threshold=2))

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.paste(fitted, (x, y), fitted)
    return canvas


def png_bytes(im: Image.Image) -> bytes:
    buf = BytesIO()
    im.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def write_ico(path: Path, images: list[Image.Image]) -> None:
    """Write a multi-size ICO using embedded PNGs (supported by modern browsers)."""
    pngs = [png_bytes(im) for im in images]
    header = struct.pack("<HHH", 0, 1, len(pngs))
    entries = bytearray()
    payload = bytearray()
    offset = 6 + 16 * len(pngs)
    for im, png in zip(images, pngs):
        side = im.width
        w = 0 if side >= 256 else side
        h = 0 if side >= 256 else side
        entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(png), offset)
        payload += png
        offset += len(png)
    path.write_bytes(header + entries + payload)


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source: {SRC}")

    src = Image.open(SRC).convert("RGBA")
    sizes_png = {
        "favicon-32.png": 32,
        "favicon-48.png": 48,
        "favicon.png": 192,
        "apple-touch-icon.png": 180,
    }
    for name, size in sizes_png.items():
        out = fit_square(src, size)
        path = ASSETS / name
        out.save(path, "PNG", optimize=True)
        print(f"wrote {path.name} ({size}x{size})")

    ico_sizes = [16, 32, 48]
    write_ico(ASSETS / "favicon.ico", [fit_square(src, s) for s in ico_sizes])
    print(f"wrote favicon.ico sizes={ico_sizes}")


if __name__ == "__main__":
    main()
