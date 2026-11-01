"""A boat script without Blender: bpy, bmesh and mathutils are replaced by empty modules, so the tables, the sections and check() run
in a second with the system's Python (sulebas-bygging.md kap. 13). Prints check() if the script has one; with --volume NAME it
integrates the script's section function NAME(x) -> [(y, z) or (y, z, kind)] under its WL and reports the displacement (weigh an old
script before a revision: the old snekke gave 10.5 t against 3.0 t; give the section's span with --x0/--x1 if it has no XA/XF).
    python3 tools/boats/qa/stubcheck.py tools/boats/snekke26.py
    python3 tools/boats/qa/stubcheck.py tools/boats/<old>.py --volume curve"""
import os, sys, types, importlib.util, argparse
ap = argparse.ArgumentParser(); ap.add_argument('script'); ap.add_argument('--volume'); ap.add_argument('--x0', type=float); ap.add_argument('--x1', type=float)
a = ap.parse_args()
for n in ('bpy', 'bmesh'): sys.modules[n] = types.ModuleType(n)
m = types.ModuleType('mathutils'); m.Vector = lambda *v: v; m.Matrix = object; m.noise = None; sys.modules['mathutils'] = m
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); sys.path.insert(0, os.path.dirname(os.path.abspath(a.script)))
spec = importlib.util.spec_from_file_location('B', a.script); B = importlib.util.module_from_spec(spec); sys.argv = [a.script]; spec.loader.exec_module(B)
if a.volume:
    f = getattr(B, a.volume); x0 = a.x0 if a.x0 is not None else getattr(B, 'XA', 0.0); x1 = a.x1 if a.x1 is not None else B.XF; wl = B.WL
    def area(x):
        s = f(x); A = 0.0
        for p, q in zip(s, s[1:]):
            za, zb = min(p[1], wl), min(q[1], wl)
            if q[1] > p[1] and za < wl: A += (p[0] + q[0]) / 2 * (zb - za)
        return 2 * A
    xs = [x0 + (x1 - x0) * i / 400 for i in range(401)]; Ar = [area(x) for x in xs]
    print('%s: %.2f t under WL %.2f (section %s, x %.2f-%.2f; whatever the section leaves out, a separate keel, is not counted)' % (os.path.basename(a.script), sum((Ar[i] + Ar[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(400)) * 1.025, wl, a.volume, x0, x1))
elif hasattr(B, 'check'): sys.exit(0 if B.check() else 1)
else: print('no check() in', a.script)
