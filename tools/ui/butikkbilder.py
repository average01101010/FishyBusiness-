"""The pictures on the item cards (13.11.2026, Jonas: «skikkelige bilder til alt som selges i butikkene», painted gouache, everything
but the boats): cut out of the sheets generate_game_asset made (tools/ui/out/butikk/ark-a … ark-f, not in git; the prompts are in
docs/systemer/handel-og-steder.md) into one atlas, so the page fetches one picture for all the cards.

    pip install pillow numpy
    python3 tools/ui/butikkbilder.py      -> src/data/items.b64 (the atlas, WebP as base64) and tools/ui/out/butikk/atlas.png to look at

Each sheet is a grid; each cell's background (a plain #eef3f6 or a slightly darker tile) is measured on its rim and moved to the cards'
#eef3f6 (.ic-pic in src/styles.css), the object is found against it, and an 8:5 crop round it goes into the atlas. ORDER is the
atlas's order and must be the same as IC_ATLAS in src/js/ui/05a-itemcard.js.
"""
import os, sys, base64, io
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, 'out', 'butikk'); DATA = os.path.join(ROOT, 'src', 'data')
BG = np.array([0xee, 0xf3, 0xf6], np.float32)
CW, CH, COLS = 384, 240, 8                    # a cell in the atlas (8:5, the card's .ic-pic), and the atlas's columns

# sheet -> (columns, rows, the keys left to right and top to bottom; None: drawn again on another sheet)
SHEETS = {
    'ark-a': (3, 3, ['jig', 'kgear', 'jigset', 'hooks', 'net', 'line', 'pot', 'kit', None]),
    'ark-b': (3, 3, ['jukse', None, 'garnhaler', 'teinehaler', 'linesetter', 'garnrenne', 'krabbekar', 'kniv', 'hott']),
    'ark-c': (3, 3, ['vhf', 'ais', 'plotter', 'chirp', 'sonar', 'radar', 'radarA', 'brovakt', 'olje']),
    'ark-d': (3, 3, ['varme', 'ice', 'bait', 'antigro', None, 'motor', 'prop', 'hold', 'tank']),
    'ark-e': (3, 3, ['cabin', 'galley', 'dry', 'insul', None, 'gut', 'icemaker', 'box', 'potsno']),
    'ark-f': (2, 2, ['linehaler', 'heavy', 'stab', 'motor90']),   # (drawn again: the line hauler was a drum, the dregg two-armed,
}                                                                 # the bilge keels a sailing keel, the outboard had «90» on it)
ORDER = ['jig', 'kgear', 'jigset', 'hooks', 'net', 'line', 'pot', 'kit', 'heavy',
         'jukse', 'linehaler', 'garnhaler', 'teinehaler', 'linesetter', 'garnrenne', 'krabbekar', 'kniv', 'hott',
         'vhf', 'ais', 'plotter', 'chirp', 'sonar', 'radar', 'radarA', 'brovakt', 'olje',
         'varme', 'ice', 'bait', 'antigro', 'motor90', 'motor', 'prop', 'hold', 'tank',
         'cabin', 'galley', 'dry', 'insul', 'stab', 'gut', 'icemaker', 'box', 'potsno']


def cut(a, x0, y0, x1, y1):
    """One cell of a sheet (float RGB) -> its 8:5 picture on the cards' background."""
    c = a[y0:y1, x0:x1]; h, w = c.shape[:2]; m = max(4, int(min(w, h) * 0.04))
    rim = np.concatenate([c[m:2 * m].reshape(-1, 3), c[-2 * m:-m].reshape(-1, 3), c[:, m:2 * m].reshape(-1, 3), c[:, -2 * m:-m].reshape(-1, 3)])
    bg = np.median(rim, axis=0)
    # where a sheet drew tiles, the gaps between them run along the cell's edges: from each edge inward, the rows and columns whose
    # median is not the tile's are gap, and become the background (the objects sit in the middle and are never reached)
    d0 = np.abs(c - bg).max(axis=2); colm = np.median(d0, axis=0); rowm = np.median(d0, axis=1)
    def run(v):
        n = 0
        while n < len(v) // 5 and v[n] > 3: n += 1
        return n
    l, r, t, b = run(colm), run(colm[::-1]), run(rowm), run(rowm[::-1])
    c = np.clip(c + (BG - bg), 0, 255)
    if l: c[:, :l + 2] = BG
    if r: c[:, w - r - 2:] = BG
    if t: c[:t + 2] = BG
    if b: c[h - b - 2:] = BG
    d = np.abs(c - BG).max(axis=2)
    # what is near the background becomes it exactly (the tiles' edges and the paper's grain), softly
    t = np.clip((d - 7) / 9, 0, 1)[..., None]; c = BG + (c - BG) * t
    mask = d > 22; mask[:m] = mask[-m:] = False; mask[:, :m] = mask[:, -m:] = False
    ys, xs = np.nonzero(mask)
    if not len(xs): raise SystemExit('nothing found in a cell')
    bx0, bx1 = np.percentile(xs, [0.3, 99.7]); by0, by1 = np.percentile(ys, [0.3, 99.7])
    cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
    cw = max((bx1 - bx0) * 1.16, (by1 - by0) * 1.16 * CW / CH); chh = cw * CH / CW
    out = Image.new('RGB', (int(round(cw)), int(round(chh))), tuple(int(v) for v in BG))
    img = Image.fromarray(c.astype(np.uint8))
    ox, oy = int(round(cx - cw / 2)), int(round(cy - chh / 2))
    out.paste(img, (-ox, -oy))
    # (what lay outside the cell is the background already: paste leaves the canvas there)
    return out.resize((CW, CH), Image.LANCZOS)


def main():
    pics = {}
    for name, (nc, nr, keys) in SHEETS.items():
        p = next((os.path.join(SRC, name + e) for e in ('.jpg', '.png', '.webp') if os.path.exists(os.path.join(SRC, name + e))), None)
        if not p: raise SystemExit('missing ' + name + ' in ' + SRC)
        a = np.asarray(Image.open(p).convert('RGB'), np.float32); H, W = a.shape[:2]
        for i, k in enumerate(keys):
            if not k: continue
            r, q = divmod(i, nc)
            pics[k] = cut(a, W * q // nc, H * r // nr, W * (q + 1) // nc, H * (r + 1) // nr)
    miss = [k for k in ORDER if k not in pics]
    if miss: raise SystemExit('no picture for ' + ', '.join(miss))
    rows = -(-len(ORDER) // COLS)
    atlas = Image.new('RGB', (CW * COLS, CH * rows), tuple(int(v) for v in BG))
    for i, k in enumerate(ORDER): atlas.paste(pics[k], ((i % COLS) * CW, (i // COLS) * CH))
    atlas.save(os.path.join(SRC, 'atlas.png'))
    buf = io.BytesIO(); atlas.save(buf, 'WEBP', quality=80, method=6)
    with open(os.path.join(DATA, 'items.b64'), 'w') as f: f.write(base64.b64encode(buf.getvalue()).decode())
    print('items.b64: %d pictures, %d x %d, %d KB' % (len(ORDER), atlas.width, atlas.height, len(buf.getvalue()) // 1024))


if __name__ == '__main__':
    main()
