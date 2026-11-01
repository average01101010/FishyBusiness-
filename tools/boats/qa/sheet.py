"""A contact sheet of the renders, to look at many views at once and send them: python3 sheet.py <prefix> K1,K2,... <out.png> [cols]
(reads tools/boats/out/qa/<prefix>_<name>.png)."""
import sys, glob, os
os.chdir(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out', 'qa'))
from PIL import Image, ImageDraw
pre = sys.argv[1]; names = sys.argv[2].split(','); out = sys.argv[3]; cols = int(sys.argv[4]) if len(sys.argv) > 4 else 3
ims = [(n, Image.open('%s_%s.png' % (pre, n)).convert('RGB')) for n in names if os.path.exists('%s_%s.png' % (pre, n))]
w, h = 700, 450; rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (w * cols, h * rows), 'white'); d = ImageDraw.Draw(S)
for i, (n, im) in enumerate(ims):
    im.thumbnail((w, h)); x, y = (i % cols) * w, (i // cols) * h; S.paste(im, (x, y)); d.text((x + 8, y + 8), n, fill=(255, 0, 0))
S.save(out)
