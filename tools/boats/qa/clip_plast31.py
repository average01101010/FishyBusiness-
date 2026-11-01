"""The clip check for plast31.py (sulebas-bygging.md kap. 5, 11, 12, 13; copied from clip_snekke26.py): every point of the fittings, the
wheelhouse, the helm and the hull's own decks against the hull's inside (the half-breadth of the section at its height, less the
bulwark), the deck, the cabin trunk and the wheelhouse's walls.
    /opt/bpyenv/bin/python tools/boats/qa/clip_plast31.py"""
import os, sys, importlib.util, collections
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'plast31.py')); B = importlib.util.module_from_spec(spec); sys.argv = ['x', 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
OUTSIDE = {'anode', 'prop', 'af', 'rubber', 'lampR', 'lampG'}       # what may stand outside the hull's surface
hits = collections.Counter(); ex = {}
z0, zs_, zh_, zr_ = B.wh_z()
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
            if not (B.XA + 0.03 < x < B.XF - 0.08): continue
            zr, zs = B.zr(x), B.zs(x); zd = B.z_deck(x)
            if o.name == 'hull':
                if mn in ('hull', 'af', 'boot', 'stripe', 'wood'): continue                      # (the rubbing strake stands out on purpose)
                if zr < z < zs - 0.002 and abs(y) > B.y_at(x, z) + 0.002: report(o, 'deck outside hull', mn, p)
                continue
            if mn in OUTSIDE: continue
            if o.name == 'under' and abs(y) > B.y_at(x, z) - 0.02: continue                    # bolted to the bottom, a little into it
            if any(abs(x - xo) < 0.05 and abs(z - B.WL - ho) < 0.05 for xo, _, ho in (B.EXH_W, B.BILGE)): continue    # the outlets' own linings
            if any(x0 - 0.04 < x < x0 + l + 0.04 for x0, l in B.FREE) and B.z_deck(x) < z < B.z_deck(x) + 0.22 and abs(y) > B.ybw(x): continue   # the freeing ports' flaps and hinge rods, outside
            if abs(x - 4.30) < 0.04 and abs(z - B.zs(4.30) + 0.10) < 0.04: continue           # the tank's vent hood, screwed on the side
            # through the hull's side or the bulwark between the keel's root and the sheer
            if zr + 0.02 < z < zs - 0.02 and B.y_at(x, z) - 0.004 < abs(y) < B.y_at(x, z) + 0.08 and mn not in ('inner',): report(o, 'through the side', mn, p)
            # inside the bulwark (between its inside and the outside)
            if zd + 0.02 < z < zs - 0.03 and B.ybw(x) + 0.006 < abs(y) < B.y_at(x, z) - 0.006 and mn not in ('inner', 'rubber', 'steel'): report(o, 'in the bulwark', mn, p)
            # under the deck (but not the openings' own linings: the hold, the freeing ports; nor the wheelhouse's sunk sole)
            if B.XA + 0.1 < x < B.XF - 0.4 and not (B.WX0 < x < B.WX1 and abs(y) < B.WY) and zd - 0.4 < z < zd + B.camber(x, y) - 0.008 and abs(y) < B.ybw(x) - 0.02 and mn not in ('inner', 'cabin', 'white', 'steel'):
                report(o, 'under the deck', mn, p)
            # inside the cabin trunk, apart from the openings' own linings
            if B.CX0 + 0.06 < x < B.CX1 - 0.3 and zd + 0.05 < z < B.ttop(x, min(abs(y), B.trunk_y(x, z))) - 0.008 and abs(y) < B.trunk_y(x, z) - 0.008 and mn not in ('cabin', 'white', 'inner', 'glass', 'alu', 'wood', 'steel', 'dark'):
                report(o, 'inside the trunk', mn, p)
            # through the wheelhouse's walls (its sides and its aft wall), outside things on its outside, inside things in its inside
            if B.WX0 + 0.03 < x < B.WX1 - 0.3 and z0 + 0.02 < z < zr_ - 0.02 and abs(abs(y) - B.WY) < 0.004 and mn not in ('white', 'inner', 'frame', 'glass', 'steel', 'black'): report(o, 'in the wheelhouse side', mn, p)
for k, n in sorted(hits.items(), key=lambda q: -q[1]): print(n, k, ex[k])
print('TOTAL', sum(hits.values()))
