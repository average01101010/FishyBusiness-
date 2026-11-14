"""The sailors' tattoos in Milepæler › Tatoveringer as painted flash (Jonas 14.11.2026: «Du kan også la gemini lage bildene til
tatoveringene i milepæler»): cut out of the flash sheet generate_game_asset made (tools/ui/out/butikk/tatoveringer.jpg, 4 x 3, and the
hula dancer drawn again on her own, tatovering-hula.jpg, dressed for a 13-year-old audience; not in git) into one square atlas on the
flash's cream paper, so the tattoo list fetches one picture.

    pip install pillow numpy
    python3 tools/ui/tatoveringer.py      -> src/data/tat.b64 (WebP as base64) and tools/ui/out/butikk/tat-atlas.png to look at

ORDER is the atlas's order and must be the same as TAT_ATLAS in src/js/ui/05-tattoo-art.js (and the ids of TATS in core/09-tattoos.js).
"""
import os, base64, io
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, 'out', 'butikk'); DATA = os.path.join(ROOT, 'src', 'data')
PAPER = np.array([0xfb, 0xf6, 0xea], np.float32)   # (the tattoo art's PAPER in 05-tattoo-art.js)
CELL, COLS = 192, 4
ORDER = ['svale1', 'svale2', 'stjerne', 'tau', 'ankere', 'harpun', 'grishane', 'rose', 'anker', 'skilpadde', 'hula', 'neptun']
SHEET = ['svale1', 'svale2', 'stjerne', 'tau', 'ankere', 'harpun', 'grishane', 'rose', 'anker', 'skilpadde', None, 'neptun']


def cut(a):
    """One cell (float RGB) -> a square picture on the paper, the design centred."""
    h, w = a.shape[:2]; m = max(6, int(min(w, h) * 0.035))
    c = a[m:h - m, m:w - m]                       # (the sheet's thin dividing lines lie on the cell's edge)
    h, w = c.shape[:2]; e = max(3, int(min(w, h) * 0.04))
    rim = np.concatenate([c[:e].reshape(-1, 3), c[-e:].reshape(-1, 3), c[:, :e].reshape(-1, 3), c[:, -e:].reshape(-1, 3)])
    bg = np.median(rim, axis=0); c = np.clip(c + (PAPER - bg), 0, 255)
    d = np.abs(c - PAPER).max(axis=2); t = np.clip((d - 8) / 10, 0, 1)[..., None]; c = PAPER + (c - PAPER) * t
    ys, xs = np.nonzero(d > 40)
    x0, x1 = np.percentile(xs, [0.2, 99.8]); y0, y1 = np.percentile(ys, [0.2, 99.8])
    s = max(x1 - x0, y1 - y0) * 1.14; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    out = Image.new('RGB', (int(s), int(s)), tuple(int(v) for v in PAPER))
    out.paste(Image.fromarray(c.astype(np.uint8)), (-int(round(cx - s / 2)), -int(round(cy - s / 2))))
    return out.resize((CELL, CELL), Image.LANCZOS)


def main():
    a = np.asarray(Image.open(os.path.join(SRC, 'tatoveringer.jpg')).convert('RGB'), np.float32); H, W = a.shape[:2]
    pics = {}
    for i, k in enumerate(SHEET):
        if not k: continue
        r, q = divmod(i, 4); y1 = H * (r + 1) // 3
        if k == 'grishane': y1 -= H // 3 * 18 // 100   # (the first hula dancer's head and hand reached up into this cell)
        pics[k] = cut(a[H * r // 3:y1, W * q // 4:W * (q + 1) // 4])
    pics['hula'] = cut(np.asarray(Image.open(os.path.join(SRC, 'tatovering-hula.jpg')).convert('RGB'), np.float32))
    rows = -(-len(ORDER) // COLS)
    atlas = Image.new('RGB', (CELL * COLS, CELL * rows), tuple(int(v) for v in PAPER))
    for i, k in enumerate(ORDER): atlas.paste(pics[k], ((i % COLS) * CELL, (i // COLS) * CELL))
    atlas.save(os.path.join(SRC, 'tat-atlas.png'))
    buf = io.BytesIO(); atlas.save(buf, 'WEBP', quality=82, method=6)
    with open(os.path.join(DATA, 'tat.b64'), 'w') as f: f.write(base64.b64encode(buf.getvalue()).decode())
    print('tat.b64: %d tattoos, %d x %d, %d KB' % (len(ORDER), atlas.width, atlas.height, len(buf.getvalue()) // 1024))


if __name__ == '__main__':
    main()
