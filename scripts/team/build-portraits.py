#!/usr/bin/env python3
"""Crop the founder portraits to 4:5 and export WebP sizes for team.html.

Usage: python3 scripts/team/build-portraits.py
Sources stay untouched in added-assets/Portraits/.
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT / "added-assets" / "Portraits"
OUT_DIR = ROOT / "added-assets" / "team"
ASPECT = 4 / 5
WIDTHS = (440, 880)
QUALITY = 80

# (source file, output slug, vertical focus 0..1, zoom >= 1, horizontal centre 0..1)
PORTRAITS = (
    ("3-Sreenath.JPG", "founder-sreenath", 0.78, 1.45, 0.53),
    ("2-Lakshana.png", "founder-lakshana", 0.5, 1.0, 0.5),
)


def crop_to_aspect(img, focus_y, zoom=1.0, center_x=0.5):
    w, h = img.size
    if zoom > 1.0:
        # Tighter crop: a 4:5 window 1/zoom of the height, centred on center_x.
        new_h = round(h / zoom)
        new_w = round(new_h * ASPECT)
        left = min(max(round(w * center_x - new_w / 2), 0), w - new_w)
        top = round((h - new_h) * focus_y)
        return img.crop((left, top, left + new_w, top + new_h))
    if w / h > ASPECT:
        new_w = round(h * ASPECT)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    new_h = round(w / ASPECT)
    top = round((h - new_h) * focus_y)
    return img.crop((0, top, w, top + new_h))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src_name, slug, focus_y, zoom, center_x in PORTRAITS:
        src = SRC_DIR / src_name
        if not src.exists():
            raise SystemExit(f"Missing portrait: {src}")
        cropped = crop_to_aspect(ImageOps.exif_transpose(Image.open(src)).convert("RGB"), focus_y, zoom, center_x)
        for width in WIDTHS:
            size = (width, round(width / ASPECT))
            out = OUT_DIR / f"{slug}-{width}.webp"
            cropped.resize(size, Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
            print(f"{out.relative_to(ROOT)}  {size[0]}x{size[1]}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
