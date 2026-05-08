import fitz
import os

src = r"C:\CoFound\Modelo TFC TECNOLOGIA 24-25 (1).pdf"
# Try to find the file (handle special characters)
candidates = [
    r"C:\CoFound\Modelo TFC TECNOLOGIA 24-25 (1).pdf",
    r"C:\CoFound\Modelo TFC TECNOLOGIA 24-25 (1).pdf".replace("TECNOLOGIA", "TECNOLOGÍA"),
]
for c in os.listdir(r"C:\CoFound"):
    if c.lower().startswith("modelo tfc") and c.lower().endswith(".pdf"):
        src = os.path.join(r"C:\CoFound", c)
        break

print("Using:", src)
doc = fitz.open(src)
print("Pages:", len(doc))

out_dir = r"C:\CoFound\assets"
os.makedirs(out_dir, exist_ok=True)

# Render page 1 (cover) at high resolution to crop the logo
page1 = doc[0]
pix = page1.get_pixmap(dpi=400)
pix.save(os.path.join(out_dir, "page1_full.png"))
print("Page 1 saved:", pix.width, "x", pix.height)

# Render page 2 (with corner logo) at high resolution
page2 = doc[1]
pix2 = page2.get_pixmap(dpi=400)
pix2.save(os.path.join(out_dir, "page2_full.png"))
print("Page 2 saved:", pix2.width, "x", pix2.height)

# Also extract embedded images from each page
for pnum in range(min(3, len(doc))):
    page = doc[pnum]
    images = page.get_images(full=True)
    print(f"Page {pnum+1}: {len(images)} embedded images")
    for idx, img in enumerate(images):
        xref = img[0]
        base = doc.extract_image(xref)
        ext = base["ext"]
        path = os.path.join(out_dir, f"page{pnum+1}_img{idx+1}.{ext}")
        with open(path, "wb") as f:
            f.write(base["image"])
        print(f"  saved {path} ({base['width']}x{base['height']})")

doc.close()
