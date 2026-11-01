"""The body plan and the profile of a boat script's tables, drawn with PIL, and the displacement at three waterlines: WITHOUT Blender,
in a second (bpy, bmesh and mathutils are replaced by empty modules; the tables and the section function need none of them). The way to
shape a hull against its displacement before anything is rendered, and to weigh an old script before a revision (sulebas-bygging.md
kap. 13). Generalised from lines_snekke26.py (plastsjark, 01.11.2026).
    python3 tools/boats/qa/lines.py tools/boats/<script>.py [--section section] [--keel kb] [--root zr] [--sheer zs] [--out lines]
        -> tools/boats/out/qa/<out>.png
The section function returns [(y, z) or (y, z, kind)] from the keel up; kb, zr and zs (the keel's underside, the body's root, the
sheer) are drawn in the profile when the script has them."""
import os, sys, math, types, importlib.util, argparse
ap = argparse.ArgumentParser(); ap.add_argument('script'); ap.add_argument('--section', default='section'); ap.add_argument('--keel', default='kb')
ap.add_argument('--root', default='zr'); ap.add_argument('--sheer', default='zs'); ap.add_argument('--out', default='lines')
a = ap.parse_args()
for n in ('bpy', 'bmesh'): sys.modules[n] = types.ModuleType(n)
m = types.ModuleType('mathutils'); m.Vector = lambda *v: v; m.Matrix = object; m.noise = None; sys.modules['mathutils'] = m
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS); sys.path.insert(0, os.path.dirname(os.path.abspath(a.script)))
spec = importlib.util.spec_from_file_location('B', a.script); B = importlib.util.module_from_spec(spec); sys.argv = [a.script]; spec.loader.exec_module(B)
from PIL import Image, ImageDraw
sec = getattr(B, a.section); XA = getattr(B, 'XA', 0.0); XF = B.XF; WL = B.WL; XM = (XA + XF) / 2; Lb = XF - XA
pts = lambda x: [(p[0], p[1]) for p in sec(x)]
ymax = max(max(p[0] for p in pts(XA + Lb * i / 40)) for i in range(41)); zmax = max(max(p[1] for p in pts(XA + Lb * i / 40)) for i in range(41))
S = min(1300 / (2 * ymax + 0.4), 700 / (zmax + 0.2)); W, H = 1500, 1400; im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
cx, by = 750, 60 + zmax * S
P = lambda y, z: (cx + y * S, by - z * S)
d.line([P(-ymax - 0.1, WL), P(ymax + 0.1, WL)], fill=(0, 120, 255))
d.line([P(0, 0), P(0, zmax)], fill=(200, 200, 200))
for i in range(15):
    x = XA + Lb * (0.02 + 0.96 * i / 14); col = (200, 0, 0) if x < XM else (0, 0, 0); sg = -1 if x < XM else 1
    d.line([P(sg * y, z) for y, z in pts(x)], fill=col, width=2)
s2 = 1400 / (Lb + 0.6); ox, oy = 50, H - 40
Q = lambda x, z: (ox + (x - XA) * s2, oy - z * s2)
xs = [XA + Lb * i / 300 for i in range(301)]
for nm, col, w in ((a.keel, 'black', 2), (a.root, 'gray', 1), (a.sheer, 'black', 2)):
    f = getattr(B, nm, None)
    if f: d.line([Q(x, f(x)) for x in xs if f(x) is not None], fill=col, width=w)
d.line([Q(XA - 0.2, WL), Q(XF + 0.2, WL)], fill=(0, 120, 255))
od = os.path.join(BOATS, 'out', 'qa'); os.makedirs(od, exist_ok=True); im.save(os.path.join(od, a.out + '.png'))
def area(x, wl):
    s = pts(x); A = 0.0
    for (y0, z0), (y1, z1) in zip(s, s[1:]):
        za, zb = min(z0, wl), min(z1, wl)
        if z1 > z0 and za < wl: A += (y0 + y1) / 2 * (zb - za)
    return 2 * A
for wl in (WL - 0.1, WL, WL + 0.1):
    xx = [XA + Lb * i / 400 for i in range(401)]; Ar = [area(x, wl) for x in xx]
    v = sum((Ar[i] + Ar[i + 1]) / 2 * (xx[i + 1] - xx[i]) for i in range(400))
    print('wl %.2f: %.2f t, largest section %.2f m2' % (wl, v * 1.025, max(Ar)))
print('->', os.path.join(od, a.out + '.png'))
