import fitz

doc = fitz.open(r"C:\CoFound\TFC_CoFound_PabloGuillen.pdf")
print(f"Total pages: {len(doc)}")

for i in [0, 1, 2, 3, 4, 5, 6, 7]:
    if i >= len(doc):
        break
    page = doc[i]
    pix = page.get_pixmap(dpi=180)
    pix.save(f"C:/CoFound/assets/check_page{i+1}.png")
    print(f"Page {i+1}: {pix.width}x{pix.height}")

doc.close()
