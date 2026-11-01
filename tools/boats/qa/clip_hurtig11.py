"""The clip check for hurtig11.py (sulebas-bygging.md kap. 5, 11, 12, 13; after clip_havsjark35.py): every point of the fittings, the
wheelhouse, the shelter, the helm and the hull's own decks against the hull's inside (the half-breadth of the section at its height, less
the bulwark), the working deck and the foredeck, and the wheelhouse's walls.
    /opt/bpyenv/bin/python tools/boats/qa/clip_hurtig11.py"""
import os, sys, importlib.util, collections
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'hurtig11.py')); B = importlib.util.module_from_spec(spec); sys.argv = ['x', 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
OUTSIDE = {'anode', 'prop', 'af', 'rubber', 'lampR', 'lampG', 'strake'}     # what may stand outside the hull's surface
hits = collections.Counter(); ex = {}
def report(o, why, mname, p):
    k = (o.name, why, mname); hits[k] += 1; ex.setdefault(k, tuple(round(v, 3) for v in p))
inWH = lambda x, y: B.WX0 - 0.01 < x < B.WXF + 0.3 and abs(y) < B.WY + 0.01
for o in solids:
    me = o.data; mats = [m.name for m in me.materials]; seen = set()
    for f in me.polygons:
        mn = mats[f.material_index] if mats else '?'
        for vi in f.vertices:
            if (vi, mn) in seen: continue
            seen.add((vi, mn)); p = o.matrix_world @ me.vertices[vi].co; x, y, z = p
            if not (B.XA + 0.10 < x < B.XF - 0.15): continue
            sg = 1 if y > 0 else -1; zl, zs = B.z_keel(x), B.z_cap(x, sg); zd = B.dk(x)
            if o.name == 'hull':
                if mn in ('hull', 'af', 'boot', 'stripe', 'strake', 'white'): continue
                if zl < z < zs - 0.002 and abs(y) > B.y_at(x, z, sg) + 0.002: report(o, 'deck outside hull', mn, p)
                continue
            if mn in OUTSIDE: continue
            if o.name == 'under': continue                                                             # under the bottom (the skeg's own anodes)
            if abs(x - B.BILGE[0]) < 0.07 and abs(z - B.BILGE[2]) < 0.07: continue                    # the outlet's lining
            if any(x0 - 0.04 < x < x0 + l + 0.04 for x0, l in B.FREE[sg]) and B.ZMD < z < B.ZMD + 0.22: continue   # the freeing ports' linings
            if B.HP0 - 0.1 < x < B.HP1 + 0.1 and sg < 0 and z > zs - 0.15: continue                  # the hauling port's roller on its sill
            ya = B.y_at(x, z, sg)
            if zl + 0.02 < z < zs - 0.02 and ya - 0.004 < abs(y) < ya + 0.08 and mn not in ('inner', 'steel', 'white', 'dark', 'plate'): report(o, 'through the side', mn, p)
            if zd + 0.02 < z < zs - 0.03 and B.ybw(x, sg) + 0.006 < abs(y) < ya - 0.006 and mn not in ('inner', 'rubber', 'steel', 'white'): report(o, 'in the bulwark', mn, p)
            hold = B.HOLD[0] - 0.05 < x < B.HOLD[1] + 0.05 and abs(y) < B.HOLD[3] + 0.05
            hf = B.HATCH_F[0] - 0.05 < x < B.HATCH_F[1] + 0.05 and abs(y) < B.HATCH_F[3] + 0.05
            stair = B.X_STEP - 0.6 < x < B.X_STEP and z < B.ZMD + 0.06                                # the steps' feet in the cambered deck
            if not inWH(x, y) and not hold and not hf and not stair and zd - 0.4 < z < zd + B.camber(x, y) - 0.008 and abs(y) < B.ybw(x, sg) - 0.02 and mn not in ('inner', 'cabin', 'steel'):
                report(o, 'under the deck', mn, p)
            if B.WX0 + 0.05 < x < B.WXC - 0.30 and B.ZFD + 0.02 < z < B.WR - 0.02 and abs(abs(y) - B.WY) < 0.03 and mn not in ('white', 'inner', 'frame', 'glass', 'steel', 'black', 'roofy', 'wood', 'lampR', 'lampG', 'dark', 'cush'):
                report(o, 'in the wheelhouse side', mn, p)
for k, n in sorted(hits.items(), key=lambda q: -q[1]): print(n, k, ex[k])
print('TOTAL', sum(hits.values()))
