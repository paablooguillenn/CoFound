"""
Generate the TFC PDF using Playwright + Chromium.

Strategy:
  Render the entire document with a header on every page (including the
  cover) so that the decorative squares (top-left) and the La Otra FP / PRO2
  corner logo (top-right) appear on all pages, matching the official model
  TFC template ("Modelo TFC TECNOLOGIA"). A page-number footer is also added.

This avoids the limitations of Chromium's @page rule (which doesn't render
images via `content: url(...)`) and the unreliability of `position: fixed`
running headers in Chromium's print mode.
"""
import base64
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(r"C:\CoFound")
HTML = ROOT / "TFC_CoFound_PabloGuillen.html"
OUT_PDF = ROOT / "TFC_CoFound_PabloGuillen.pdf"

DECO = ROOT / "assets" / "decorative_squares.png"
LOGO = ROOT / "assets" / "page1_img1.png"


def b64(p):
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode("ascii")


async def main():
    deco_uri = b64(DECO)
    logo_uri = b64(LOGO)

    # Header template: rendered inside Chromium's reserved top margin area on
    # every page. Inline color-adjust hack keeps PNGs visible in print mode.
    # Sizes/positions measured from "Modelo TFC TECNOLOGIA" page 2:
    #   - decorative squares cluster: 18mm wide, 7mm from left, 4mm from top
    #   - PRO2 corner logo: 27mm wide, 8mm from right, 7mm from top
    header_template = f"""
    <div style='font-size:0; width:100%; padding:0; margin:0;
                -webkit-print-color-adjust:exact; print-color-adjust:exact;'>
      <img src='{deco_uri}'
           style='position:absolute; top:4mm; left:7mm; width:18mm; height:auto;'>
      <img src='{logo_uri}'
           style='position:absolute; top:7mm; right:8mm; width:27mm; height:auto;'>
    </div>
    """

    footer_template = """
    <div style='font-family:\"Times New Roman\", serif; font-size:10pt;
                width:100%; padding:0 18mm 0 0; text-align:right; color:#333;'>
      <span class='pageNumber'></span>
    </div>
    """

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(HTML.as_uri(), wait_until="networkidle")

        await page.pdf(
            path=str(OUT_PDF),
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=header_template,
            footer_template=footer_template,
            margin={"top": "32mm", "right": "20mm", "bottom": "20mm", "left": "20mm"},
        )

        await browser.close()

    print(f"PDF written to {OUT_PDF}")


asyncio.run(main())
