"""The body plan and the profile of snekke26.py's tables, drawn with PIL, and the displacement at three waterlines: WITHOUT Blender,
in a second (bpy, bmesh and mathutils are replaced by empty modules; the tables and section() need none of them). The way to shape a
hull against its displacement before anything is rendered, and to weigh the old script before a revision (sulebas-bygging.md kap. 13).
    python3 tools/boats/qa/lines_snekke26.py   -> tools/boats/out/qa/lines.png"""
import os
import sys, math, types, importlib.util
sys.modules['bpy'] = types.ModuleType('bpy'); sys.modules['bmesh'] = types.ModuleType('bmesh')
m = types.ModuleType('mathutils'); m.Vector = lambda *a: a; m.Matrix = object; m.noise = None; sys.modules['mathutils'] = m
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'snekke26.py')); B = importlib.util.module_from_spec(spec)
sys.argv = ['x']; spec.loader.exec_module(B)
from PIL import Image, ImageDraw
S = 260; W, H = 1500, 1300; im = Image.new('RGB', (W, H), 'white'); d = ImageDraw.Draw(im)
cx, by = 750, 760
P = lambda y, z: (cx + y * S, by - z * S)
d.line([P(-1.6, B.WL), P(1.6, B.WL)], fill=(0, 120, 255))
for x in [0.0, 0.5, 1.0, 1.5, 2.5, 3.5, 4.5, 5.5, 6.0, 6.5, 7.0, 7.4, 7.7]:
    sec = B.section(x); col = (200, 0, 0) if x < B.XM else (0, 0, 0); sg = -1 if x < B.XM else 1
    d.line([P(sg * y, z) for y, z, k in sec], fill=col, width=2)
# profile below
ox, oy, s2 = 60, 1250, 175
Q = lambda x, z: (ox + x * s2, oy - z * s2)
xs = [B.X_KA + (B.XF - B.X_KA) * i / 300 for i in range(301)]
d.line([Q(x, B.kb(x)) for x in xs], fill='black', width=2)
xr = [i / 100 * B.XF for i in range(101)]
d.line([Q(x, B.zr(x)) for x in xr], fill='gray'); d.line([Q(x, B.zs(x)) for x in xr], fill='black', width=2)
d.line([Q(-0.2, B.WL), Q(8.1, B.WL)], fill=(0, 120, 255))
os.makedirs(os.path.join(BOATS, 'out', 'qa'), exist_ok=True); im.save(os.path.join(BOATS, 'out', 'qa', 'lines.png'))
def area(x, wl):
    s = B.section(x); a = 0.0
    for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
        za, zb = min(z0, wl), min(z1, wl)
        if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
    return 2 * a
for wl in (1.1, 1.2, 1.3):
    xs = [B.XF * i / 300 for i in range(301)]; A = [area(x, wl) for x in xs]
    v = sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(300))
    print('wl %.2f: %.2f t' % (wl, v * 1.025), 'Amax %.2f' % max(A))
