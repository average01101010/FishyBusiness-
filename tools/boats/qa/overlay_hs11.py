"""The overlay for hs11.py (sulebas-bygging.md kap. 15.2): the render from starboard (shots.py K3s, orthographic) under the profile of the
drawing the boat is measured from (not in the repository: pass its path; Jonas showed it 02.11.2026). The drawing's crop is given in its
own pixels: the transom's x and the base line's y, and its scale (131.7 px/m on the 3392 px wide picture).
    python3 tools/boats/qa/overlay_hs11.py <drawing.jpg> <render K3s.png> <out.png>"""
import sys
from PIL import Image, ImageChops
draw, rend, out = sys.argv[1:4]
L, WL, XA = 10.99, 1.18, 0.0; XM = L / 2
R = Image.open(rend).convert('RGB'); W, H = R.size
ppm = W / (L * 1.12)                                                   # render pixels per metre (ortho width Lb * 1.12)
D = Image.open(draw).convert('L')
k = 3392 / 2000; ox, oy, dppm = 520 * k + 35, 270 * k + 840, 131.7  # the transom and the base line in the drawing, its pixels per metre
s = ppm / dppm
D2 = D.resize((int(D.width * s), int(D.height * s)))
# where the drawing's origin (x 0, z 0) lands in the render: centre (W/2, H/2) is (XM, WL + 0.6)
rx0 = W / 2 - XM * ppm; ry0 = H / 2 + (WL + 0.6) * ppm
canvas = Image.new('L', (W, H), 255)
canvas.paste(D2, (int(rx0 - ox * s), int(ry0 - oy * s)))
lines = canvas.point(lambda v: 0 if v < 140 else 255)
red = Image.new('RGB', (W, H), (230, 20, 20))
outimg = Image.composite(R, red, lines)
outimg.save(out); print('saved', out)
