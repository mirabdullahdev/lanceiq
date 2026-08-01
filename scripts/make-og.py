"""
Compose public/og.png, the 1200x630 social card.

Renders the same design as public/og.html, but drawn directly rather than
screenshotted. A browser screenshot is the more faithful route when one is
available; this exists because it needs no display, no headless browser and no
extra dependency beyond Pillow, so it can be re-run any time the wording or
the logo changes.

    python scripts/make-og.py
"""

from PIL import Image, ImageChops, ImageDraw, ImageFont
import math

W, H = 1200, 630

GEORGIA = r'C:\Windows\Fonts\georgia.ttf'
GEORGIA_I = r'C:\Windows\Fonts\georgiai.ttf'
SEGOE = r'C:\Windows\Fonts\segoeui.ttf'
SEGOE_SB = r'C:\Windows\Fonts\seguisb.ttf'
CONSOLAS = r'C:\Windows\Fonts\consola.ttf'

GRAPHITE = (45, 45, 45)
FOREST = (46, 125, 50)
SLATE = (85, 96, 90)
MINT = (114, 219, 151)
INK = (26, 26, 26)


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background() -> Image.Image:
    """radial-gradient(115% 90% at 82% 14%, #eefaf2, #f8fff9 42%, #fff 78%)"""
    img = Image.new('RGB', (W, H))
    px = img.load()
    cx, cy = 0.82 * W, 0.14 * H
    rx, ry = 1.15 * W, 0.90 * H
    c0, c1, c2 = (238, 250, 242), (248, 255, 249), (255, 255, 255)
    for y in range(H):
        for x in range(W):
            d = math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
            if d <= 0.42:
                px[x, y] = lerp(c0, c1, d / 0.42)
            elif d <= 0.78:
                px[x, y] = lerp(c1, c2, (d - 0.42) / 0.36)
            else:
                px[x, y] = c2
    return img


def hairline_grid(base: Image.Image) -> None:
    """88px ruling, faded out by a radial mask so it never reaches the edges."""
    grid = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = ImageDraw.Draw(grid)
    for x in range(0, W, 88):
        g.line([(x, 0), (x, H)], fill=(46, 125, 50, 28), width=1)
    for y in range(0, H, 88):
        g.line([(0, y), (W, y)], fill=(46, 125, 50, 28), width=1)

    mask = Image.new('L', (W, H), 0)
    mp = mask.load()
    cx, cy, rx, ry = 0.70 * W, 0.40 * H, 0.80 * W, 0.75 * H
    for y in range(H):
        for x in range(W):
            d = math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
            mp[x, y] = 255 if d < 0.4 else (0 if d > 0.78 else round(255 * (1 - (d - 0.4) / 0.38)))

    # Multiply the grid's OWN alpha by the mask. Replacing it instead makes the
    # fully transparent gaps opaque, and since their RGB is black the whole
    # thing renders as a black ellipse.
    grid.putalpha(ImageChops.multiply(grid.split()[3], mask))
    base.paste(grid, (0, 0), grid)


def lattice(d: ImageDraw.ImageDraw) -> None:
    """The same field of nodes as the hero: mostly dim, two lit."""
    nodes = [(905, 118, 5), (1010, 176, 3.5), (835, 212, 4), (1108, 126, 4.5),
             (960, 272, 3), (1075, 300, 5), (880, 352, 3.5), (1140, 404, 4),
             (1005, 452, 4.5), (912, 520, 3), (1096, 540, 3.5), (820, 452, 3)]
    edges = [(905, 118, 1010, 176), (1010, 176, 1108, 126), (1010, 176, 960, 272),
             (960, 272, 1075, 300), (960, 272, 880, 352), (880, 352, 1005, 452),
             (1075, 300, 1140, 404), (1140, 404, 1096, 540), (1005, 452, 912, 520),
             (835, 212, 905, 118), (820, 452, 880, 352)]
    for x1, y1, x2, y2 in edges:
        d.line([(x1, y1), (x2, y2)], fill=(76, 175, 80, 46), width=1)
    for x, y, r in nodes:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(46, 125, 50, 41))
    for x, y, halo, core in [(1058, 232, 34, 11), (890, 440, 26, 8.5)]:
        d.ellipse([x - halo, y - halo, x + halo, y + halo], fill=(114, 219, 151, 41))
        d.ellipse([x - core, y - core, x + core, y + core], fill=(114, 219, 151, 255))


def main() -> None:
    img = background()
    hairline_grid(img)

    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    lattice(ImageDraw.Draw(overlay))
    img.paste(overlay, (0, 0), overlay)

    d = ImageDraw.Draw(img)
    PAD = 78

    # Brand lockup
    logo = Image.open('public/logo.png').convert('RGBA')
    lh = 42
    lw = round(logo.width * lh / logo.height)
    img.paste(logo.resize((lw, lh), Image.LANCZOS), (PAD, 92), logo.resize((lw, lh), Image.LANCZOS))

    f_brand = ImageFont.truetype(GEORGIA, 34)
    bx = PAD + lw + 14
    d.text((bx, 96), 'Lance', font=f_brand, fill=GRAPHITE)
    d.text((bx + d.textlength('Lance', font=f_brand), 96), 'Wise', font=f_brand, fill=FOREST)

    # Headline
    f_h1 = ImageFont.truetype(GEORGIA, 76)
    f_h1i = ImageFont.truetype(GEORGIA_I, 76)
    lines = [[('Stop gambling on', f_h1, GRAPHITE)],
             [('Upwork. Start winning', f_h1, GRAPHITE)],
             [('with ', f_h1, GRAPHITE), ('data', f_h1i, FOREST), ('.', f_h1, GRAPHITE)]]
    y = 208
    for line in lines:
        x = PAD
        for text, font, colour in line:
            d.text((x, y), text, font=font, fill=colour)
            x += d.textlength(text, font=font)
        y += 88

    # Sub-line
    f_p = ImageFont.truetype(SEGOE, 25)
    d.text((PAD, y + 22), 'Know which jobs are worth your connects before you spend them.',
           font=f_p, fill=SLATE)

    # Footer: mint pill + status
    f_pill = ImageFont.truetype(CONSOLAS, 16)
    label = ' 3 0 %   O F F   ·   3   M O N T H S '
    pw = round(d.textlength(label, font=f_pill)) + 30
    py0 = y + 92
    d.rounded_rectangle([PAD, py0, PAD + pw, py0 + 42], radius=21, fill=MINT)
    d.text((PAD + 15, py0 + 12), label, font=f_pill, fill=INK)

    f_small = ImageFont.truetype(CONSOLAS, 16)
    d.text((PAD + pw + 22, py0 + 12), 'W A I T L I S T   O P E N', font=f_small, fill=(96, 150, 99))

    img.save('public/og.png', optimize=True)
    print(f'  wrote public/og.png  {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main()
