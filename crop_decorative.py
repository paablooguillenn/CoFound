"""
Crop the header assets (decorative squares top-left, PRO2 corner logo
top-right) directly from the model TFC PDF, page 2 (which is the cleanest
page — no centered cover logo overlapping anything).
"""
import os
from PIL import Image

SRC = r"C:\CoFound\assets\page2_full.png"
OUT_DIR = r"C:\CoFound\assets"

img = Image.open(SRC).convert("RGBA")
W, H = img.size
print(f"Source: {W}x{H}")


def to_transparent(im: Image.Image) -> Image.Image:
    """Make near-white pixels transparent so the asset blends on the page."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 240 and g > 240 and b > 240:
                px[x, y] = (255, 255, 255, 0)
    return im


# Decorative squares (top-left): three squares in a staircase pattern.
# In page2_full.png at 400 dpi the cluster spans roughly x=120..490, y=50..440.
deco_box = (105, 40, 510, 460)
deco = img.crop(deco_box)
deco = to_transparent(deco)
deco.save(os.path.join(OUT_DIR, "decorative_squares.png"))
print(f"decorative_squares.png saved {deco.size}")

# Corner PRO2 logo (top-right): "La Otra FP" + "PRO2" combined box with the
# rounded right edge. Spans roughly x=2690..3150, y=110..320 in the source.
logo_box = (2680, 100, 3170, 340)
logo = img.crop(logo_box)
logo.save(os.path.join(OUT_DIR, "page1_img1.png"))
print(f"page1_img1.png saved {logo.size}")
