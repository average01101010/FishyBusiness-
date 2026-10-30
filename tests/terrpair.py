"""Before and after side by side from tests/terrshot.py's pictures: per place a sheet with «Før» on the left and «Etter» on the right,
the view from low over the sea on top and the drone's under it, as jpeg (for docs/pr/<branch>/ and the reports to Jonas).
  python3 tests/terrpair.py <before tag> <after tag> <season> <out dir> [place ...]"""
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out')
b, a, season, dest = sys.argv[1:5]; places = sys.argv[5:] or sorted({os.path.basename(f).split('_')[3] for f in glob.glob(os.path.join(OUT, f'terr_{a}_{season}_*_low.png'))})
os.makedirs(dest, exist_ok=True)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
except OSError: font = ImageFont.load_default()
W, H = 960, 600
for pl in places:
    views = [v for v in ('low', 'high', 'close') if all(os.path.exists(os.path.join(OUT, f'terr_{t}_{season}_{pl}_{v}.png')) for t in (b, a))]
    sheet = Image.new('RGB', (2 * W + 8, len(views) * (H + 8) - 8), (20, 20, 24)); ok = bool(views)
    for r, view in enumerate(views):
        for c, (tag, label) in enumerate(((b, 'Før'), (a, 'Etter'))):
            f = os.path.join(OUT, f'terr_{tag}_{season}_{pl}_{view}.png')
            if not os.path.exists(f): ok = False; continue
            im = Image.open(f).convert('RGB').resize((W, H), Image.LANCZOS); sheet.paste(im, (c * (W + 8), r * (H + 8)))
            d = ImageDraw.Draw(sheet); x, y = c * (W + 8) + 14, r * (H + 8) + 10
            d.text((x + 2, y + 2), f'{label} · {pl} · {season}', fill=(0, 0, 0), font=font); d.text((x, y), f'{label} · {pl} · {season}', fill=(255, 255, 255), font=font)
    if ok:
        fn = os.path.join(dest, f'{pl}-{season}.jpg'); sheet.save(fn, quality=82); print(fn)
