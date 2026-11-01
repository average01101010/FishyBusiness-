"""The hull's fairness (sulebas-bygging.md kap. 16; the havsjark's bow, 01.11.2026: «Baugen ser veldig bulkete ut», twice): where the
surface kinks or bulges, found in the numbers before a render shows it.

1. The creases: the angle between the two faces at every edge of the script's hull (the object named `hull` from build(True)), summed per
   station (an edge across the hull at one x) and per row (an edge along it), so a station that kinks from the keel to the strake (a
   fallback taking over in the section function) or a row that steps stands out from the creases that are meant (the stem, the strake,
   the chine). Edges sharper than --max (the strake's sides, the stem) are left out.
2. The waterlines (when the script has y_at(x, z) and z_low(x)): the change of their slope from one step to the next, away from the stem.
   Over about 0.02 m per 6 cm step a bulge shows in the game.

    /opt/bpyenv/bin/python tools/boats/qa/fair.py tools/boats/<script>.py [--x0 7 --x1 10.5 --z0 0.3 --z1 1.8 --min 4 --max 30]
The script's frame: x forward, y to port, z up (as havsjark35.py, plast31.py, snekke26.py). Run it after every change of the section."""
import os, sys, math, argparse, importlib.util, collections
ap = argparse.ArgumentParser(); ap.add_argument('script')
for k, v in (('x0', 7.0), ('x1', 99.0), ('z0', 0.3), ('z1', 99.0), ('min', 4.0), ('max', 30.0)): ap.add_argument('--' + k, type=float, default=v)
a = ap.parse_args()
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS); sys.path.insert(0, os.path.dirname(os.path.abspath(a.script)))
spec = importlib.util.spec_from_file_location('B', a.script); B = importlib.util.module_from_spec(spec); sys.argv = [a.script, 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
hull = next((o for o in solids if o.name.startswith('hull')), None)
if hull is None: sys.exit('no object named hull in build(True)')
bm = bmesh.new(); bm.from_mesh(hull.data); bm.normal_update()
st, rows, top = collections.Counter(), collections.Counter(), []
for e in bm.edges:
    if len(e.link_faces) != 2: continue
    p, q = e.verts[0].co, e.verts[1].co; c = (p + q) / 2
    if not (a.x0 < c.x < a.x1 and a.z0 < c.z < a.z1) or c.y > -0.02: continue          # one side (starboard), off the centreline
    ang = math.degrees(e.link_faces[0].normal.angle(e.link_faces[1].normal))
    if ang < a.min or ang > a.max: continue
    across = abs(p.x - q.x) < abs(p.z - q.z)
    if across: st[round(c.x, 2)] += ang
    else: rows[round(c.z, 1)] += ang
    top.append((ang, round(c.x, 3), round(c.y, 2), round(c.z, 2), 'tvers' if across else 'langs'))
print('Stasjonene med mest knekk (sum av vinkler på tvers, grader):')
for x, s in st.most_common(8): print('  x %.2f  %5.1f' % (x, s))
print('Radene med mest knekk (sum av vinkler langs, grader, per 0,1 m høyde):')
for z, s in rows.most_common(5): print('  z %.1f  %5.1f' % (z, s))
print('De skarpeste kantene mellom %g og %g grader:' % (a.min, a.max))
for t in sorted(top, reverse=True)[:12]: print('  %4.1f°  x %.3f y %.2f z %.2f %s' % t)
if hasattr(B, 'y_at') and hasattr(B, 'z_low'):
    worst = (0.0, 0, 0); x0 = max(a.x0 - 4, 0.5)
    for z in [0.5, 0.8, 1.0, 1.3, 1.6]:
        xs = [x0 + 0.06 * i for i in range(int((B.XF - x0) / 0.06)) if B.z_low(x0 + 0.06 * i + 0.18) < z - 0.05]
        yv = [B.y_at(x, z) for x in xs]; d = [q - p for p, q in zip(yv, yv[1:])]
        for i in range(1, len(d)): worst = max(worst, (abs(d[i] - d[i - 1]), xs[i], z))
    print('Vannlinjene: største endring i stigningen %.3f m per 6 cm-steg ved x %.2f, z %.1f (%s; over rundt 0,02 synes en bule)' % (worst + ('OK' if worst[0] < 0.02 else 'FEIL',)))
