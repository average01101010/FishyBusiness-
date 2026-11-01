"""The clip check for havsjark35.py (sulebas-bygging.md kap. 5, 11, 12, 13; after clip_plast31.py): every point of the fittings, the
wheelhouse, the helm and the hull's own decks against the hull's inside (the half-breadth of the section at its height, less the
bulwark), the aft deck and the forecastle's deck, and the wheelhouse's walls.
    /opt/bpyenv/bin/python tools/boats/qa/clip_havsjark35.py"""
import os, sys, importlib.util, collections
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'havsjark35.py')); B = importlib.util.module_from_spec(spec); sys.argv = ['x', 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
OUTSIDE = {'anode', 'prop', 'af', 'rubber', 'lampR', 'lampG', 'cap'}       # what may stand outside the hull's surface (the transom's fender)
hits = collections.Counter(); ex = {}
def report(o, why, mname, p):
    k = (o.name, why, mname); hits[k] += 1; ex.setdefault(k, tuple(round(v, 3) for v in p))
inWH = lambda x, y: B.WH_X0 - 0.01 < x < B.WH_XF + 0.3 and abs(y) < B.WH_W + 0.01
for o in solids:
    me = o.data; mats = [m.name for m in me.materials]; seen = set()
    for f in me.polygons:
        mn = mats[f.material_index] if mats else '?'
        for vi in f.vertices:
            if (vi, mn) in seen: continue
            seen.add((vi, mn)); p = o.matrix_world @ me.vertices[vi].co; x, y, z = p
            if not (B.XA + 0.10 < x < B.XF - 0.15): continue
            sg = 1 if y > 0 else -1; zl, zs = B.z_low(x), B.z_cap(x, sg); zd = B.dk(x)
            if o.name == 'hull':
                if mn in ('hull', 'af', 'boot', 'stripe', 'cap'): continue
                if zl < z < zs - 0.002 and abs(y) > B.y_at(x, z, sg) + 0.002: report(o, 'deck outside hull', mn, p)
                continue
            if mn in OUTSIDE: continue
            if o.name == 'under' and abs(y) > B.y_at(x, z, sg) - 0.03: continue                   # bolted to the bottom, a little into it
            if any(abs(x - xo) < 0.07 and abs(z - B.WL - ho) < 0.07 for xo, _, ho in (B.EXH_W, B.BILGE)): continue    # the outlets' own linings
            if any(x0 - 0.04 < x < x0 + l + 0.04 for x0, l in B.FREE) and B.z_deck(x) < z < B.z_deck(x) + 0.24: continue   # the freeing ports' linings and flaps
            if any(abs(x - xp) < 0.2 and abs(z - B.PORT_Z) < 0.2 for xp in B.PORTS): continue      # the portholes' reveals, rings and dogs
            ya = B.y_at(x, z, sg)
            # through the hull's side or the bulwark between the body's bottom and the sheer (the strake, the chain plates outside)
            if zl + 0.02 < z < zs - 0.02 and ya - 0.004 < abs(y) < ya + 0.08 and mn not in ('inner', 'steel', 'white', 'mast', 'dark'): report(o, 'through the side', mn, p)
            # inside the bulwark (between its inside and the outside)
            if zd + 0.02 < z < zs - 0.03 and B.ybw(x, sg) + 0.006 < abs(y) < ya - 0.006 and mn not in ('inner', 'rubber', 'steel', 'white', 'cap'): report(o, 'in the bulwark', mn, p)
            # under the deck (not in the wheelhouse, nor the hold's and the hatch's own linings)
            hold = B.HOLD[0] - 0.05 < x < B.HOLD[1] + 0.05 and abs(y) < B.HOLD[3] + 0.05
            hf = B.HATCH_F[0] - 0.05 < x < B.HATCH_F[1] + 0.05 and abs(y) < B.HATCH_F[3] + 0.05
            if not inWH(x, y) and not hold and not hf and zd - 0.4 < z < zd + B.camber(x, y) - 0.008 and abs(y) < B.ybw(x, sg) - 0.02 and mn not in ('inner', 'cabin', 'steel', 'mast'):
                report(o, 'under the deck', mn, p)
            # through the wheelhouse's sides (outside things on its outside, inside things in its inside)
            if B.WH_X0 + 0.05 < x < B.WH_XC - 0.05 and B.WH_FLOOR + 0.02 < z < B.WH_TOP - 0.02 and abs(abs(y) - B.WH_W) < 0.03 and mn not in ('white', 'inner', 'frame', 'glass', 'steel', 'black', 'roof', 'wood', 'lampR', 'lampG'):
                report(o, 'in the wheelhouse side', mn, p)
for k, n in sorted(hits.items(), key=lambda q: -q[1]): print(n, k, ex[k])
print('TOTAL', sum(hits.values()))
