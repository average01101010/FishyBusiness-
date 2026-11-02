"""The clip check for snekke26.py (an example to copy for the next boat; sulebas-bygging.md kap. 5, 11, 12, 13): every point of the fittings, the helm, the doghouse and the hull's own decks against the hull's inside
(the half-breadth of the section at its height), the cockpit sole and the trunk"""
import os, sys, importlib.util, collections
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'snekke26.py')); B = importlib.util.module_from_spec(spec); sys.argv = ['x', 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
OUTSIDE = {'anode', 'prop', 'af', 'rubber', 'frame', 'lampR', 'lampG', 'board'}     # what may stand outside the hull's surface
hits = collections.Counter(); ex = {}
def report(o, why, mname, p):
    k = (o.name, why, mname); hits[k] += 1; ex.setdefault(k, tuple(round(v, 3) for v in p))
for o in solids:
    me = o.data; mats = [m.name for m in me.materials]
    seen = set()
    for f in me.polygons:
        mn = mats[f.material_index] if mats else '?'
        for vi in f.vertices:
            if (vi, mn) in seen: continue
            seen.add((vi, mn)); p = o.matrix_world @ me.vertices[vi].co; x, y, z = p
            if not (B.XA + 0.02 < x < B.XF - 0.05): continue
            zr, zs = B.zr(x), B.zs(x)
            if o.name == 'hull':
                if mn in ('hull', 'af', 'boot', 'band'): continue
                if zr < z < zs - 0.002 and abs(y) > B.y_at(x, z) + 0.002: report(o, 'deck outside hull', mn, p)
                continue
            if mn in OUTSIDE: continue
            if abs(x - 4.45) < 0.04 and abs(z - B.zs(4.45) + 0.09) < 0.04: continue        # the tank's vent hood, screwed on the side
            if abs(x - B.BILGE[0]) < 0.05 and abs(z - B.WL - B.BILGE[2]) < 0.05: continue      # the bilge outlet's own lining and collar
            if o.name == 'under' and abs(y) > B.y_at(x, z) - 0.015: continue                 # what is bolted to the bottom, a little into it
            # through the hull's side between the keel's root and the sheer (inside cockpit and cabin)
            if zr + 0.02 < z < zs - 0.01 and abs(y) > B.y_at(x, z) - 0.004 and abs(y) < B.y_at(x, z) + 0.08: report(o, 'through the side', mn, p)
            # under the cockpit sole (but not the hatch's own gutter, lid and the scupper tubes)
            if B.XC0 + 0.05 < x < B.X_BH - 0.01 and B.ZC - 0.3 < z < B.ZC - 0.006 and abs(y) < B.yb(x) - 0.01 and mn not in ('gutter', 'cabin', 'sole', 'steel', 'dark', 'black'):
                report(o, 'under the sole', mn, p)
            # inside the cabin trunk (through its sides or top), apart from the openings' own linings
            if B.X_BH + 0.06 < x < B.CXN - 0.02 and zs + 0.03 < z < B.ttop(x, min(abs(y), B.cabin_w(x) - 0.05)) - 0.006 and abs(y) < B.trunk_y(x, z) - 0.006 and mn not in ('cabin', 'white', 'inner', 'glass', 'alu', 'teak'):
                report(o, 'inside the trunk', mn, p)
for k, n in sorted(hits.items(), key=lambda q: -q[1]): print(n, k, ex[k])
print('TOTAL', sum(hits.values()))
