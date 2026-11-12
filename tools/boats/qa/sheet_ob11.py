"""before and after sheets: the FØR row is round 3's ETTER row (the same model as before this round, from docs/okter/2026-11-12-ob11-r3/),
the ETTER row from tests/ombord.py's pictures now: landscape frames 1 and 2 and the portrait frame 2, each 360 high, as round 3 laid them.
python3 sheet.py <for-dir with <op>.jpg rows> <etter ombord dir> <out-dir>"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
fd, ed, od = sys.argv[1:4]; os.makedirs(od, exist_ok=True); H = 360
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: font = ImageFont.load_default()
def label(im, t):
    d = ImageDraw.Draw(im); w = d.textlength(t, font=font); d.rectangle([0, 0, w + 16, 34], fill=(0, 0, 0)); d.text((8, 4), t, fill=(255, 255, 255), font=font)
for n in sorted(os.listdir(fd)):
    op = n[:-4]; fr = Image.open(os.path.join(fd, n)).convert('RGB'); W = fr.width
    row = Image.new('RGB', (W, H), (0, 0, 0)); x = 0
    for f, k in (('liggende', 1), ('liggende', 2), ('staaende', 2)):
        p = os.path.join(ed, 'breisjark', '%s_%s_%d.jpg' % (op, f, k))
        if not os.path.exists(p): x += 640 if f == 'liggende' else 0; continue
        im = Image.open(p).convert('RGB'); im = im.resize((int(im.width * H / im.height), H))
        if f == 'staaende': cw = W - x; l = max(0, (im.width - cw) // 2); im = im.crop((l, 0, l + cw, H))
        row.paste(im, (x, 0)); x += im.width
    label(fr, 'FØR (runde 3)'); label(row, 'ETTER (runde 4)')
    sh = Image.new('RGB', (W, 2 * H), (0, 0, 0)); sh.paste(fr, (0, 0)); sh.paste(row, (0, H)); sh.save(os.path.join(od, n), quality=84); print(op)
