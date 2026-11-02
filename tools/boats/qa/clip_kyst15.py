"""The clip check for kyst15.py (sulebas-bygging.md kap. 5, 11, 12, 13; after clip_malo36.py): every point of the fittings, the hauling
station, the wheelhouse, the helm and the hull's own decks against the hull's side (the half-breadth of the section at its height), the
shelter deck's bulwark, the shelter deck itself (nothing under it but the station's own parts), the station's ceiling and inboard wall, and
the wheelhouse's walls.
    python3.11 tools/boats/qa/clip_kyst15.py"""
import os, sys, importlib.util, collections
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS)
spec = importlib.util.spec_from_file_location('B', os.path.join(BOATS, 'kyst15.py')); B = importlib.util.module_from_spec(spec); sys.argv = ['x', 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
reset(); B.colours(); solids, glass = B.build(True)
OUTSIDE = {'anode', 'prop', 'af', 'rubber', 'lampR', 'lampG', 'strake'}       # what may stand outside the hull's surface
hits = collections.Counter(); ex = {}
def report(o, why, mname, p):
    k = (o.name, why, mname); hits[k] += 1; ex.setdefault(k, tuple(round(v, 3) for v in p))
inStation = lambda x, y, z: B.OP0 - 0.06 < x < B.OP1 + 0.06 and -B.ybi(x) - 0.10 < y < B.YB + 0.06 and B.ZMD - 0.05 < z < B.CEIL + 0.02
inWH = lambda x, y, z: B.WX0 - 0.01 < x < B.WXF + B.LEAN + 0.2 and abs(y) < B.wy(min(max(x, B.WX0), B.WXS)) + 0.01 and z > B.z_sd(x) - 0.05
inWell = lambda x, y: B.WELL[0] - 0.05 < x < B.WELL[1] + 0.05 and B.WELL[2] - 0.05 < y < B.WELL[3] + 0.05
for o in solids:
    me = o.data; mats = [m.name for m in me.materials]; seen = set()
    for f in me.polygons:
        mn = mats[f.material_index] if mats else '?'
        for vi in f.vertices:
            if (vi, mn) in seen: continue
            seen.add((vi, mn)); p = o.matrix_world @ me.vertices[vi].co; x, y, z = p
            if not (B.XA + 0.12 < x < B.XF - 0.15): continue
            sg = 1 if y > 0 else -1; zl, zs = B.z_low(x), B.z_cap(x, sg); zd = B.z_sd(x)
            if o.name == 'hull':
                # the hull's own decks and caps: never outside its side
                if mn in ('hull', 'af', 'boot', 'white', 'strake') or x < B.XA + 0.3: continue
                if zl < z < zs - 0.002 and abs(y) > B.y_at(x, z, sg) + 0.002: report(o, 'deck outside hull', mn, p)
                continue
            if mn in OUTSIDE: continue
            if o.name == 'under' and abs(y) > B.y_at(x, z, sg) - 0.04: continue
            if any(abs(x - xo) < 0.08 and abs(z - B.WL - ho) < 0.08 for xo, _, ho in (B.EXH_W, B.BILGE)): continue
            if any(x0 - 0.04 < x < x0 + l + 0.04 for x0, l in B.FREE + B.FREE_F) and zd < z < zd + 0.15: continue   # the slots' linings
            if any(abs(x - xp) < 0.20 and abs(z - B.PORT_Z) < 0.20 for xp in B.PORTS): continue                      # the portholes' rings
            if any(x0 - 0.04 < x < x1 + 0.04 for x0, x1 in B.VENTS) and B.VENT_Z[0] - 0.04 < z < B.VENT_Z[1] + 0.04: continue
            if abs(x - B.HAWSE[0]) < 0.45 and abs(z - B.HAWSE[1]) < 0.45: continue                                    # the hawse pipes
            opening = sg < 0 and B.OP0 - 0.02 < x < B.OP1 + 0.02 and B.SILL - 0.02 < z < B.HEAD + 0.02
            ya = B.y_at(x, z, sg)
            if not opening and zl + 0.02 < z < zs - 0.02 and ya - 0.004 < abs(y) < ya + 0.08 and mn not in ('inner', 'steel', 'white', 'mast', 'cap', 'frame'):
                report(o, 'through the side', mn, p)
            if not opening and zl + 0.05 < z < zs - 0.03 and abs(y) > ya + 0.004 and abs(y) < ya + 0.5 and mn not in ('steel', 'white', 'mast', 'frame', 'black', 'lens', 'dark', 'glass', 'cap'):
                report(o, 'outside the side', mn, p)
            yin = B.ybw(x, sg) + (B.ycap(x, sg) - 0.006 - B.ybw(x, sg)) * max(0.0, min(1.0, (z - zd) / max(0.05, zs - 0.03 - zd)))
            if zd + 0.02 < z < zs - 0.03 and yin + 0.006 < abs(y) < ya - 0.006 and mn not in ('inner', 'rubber', 'steel', 'white', 'cap', 'frame', 'glass', 'roof'):
                report(o, 'in the bulwark', mn, p)
            # under the shelter deck: only the station's parts, the well's lining and the wheelhouse's foot
            if not inStation(x, y, z) and not inWell(x, y) and zd - 0.6 < z < B.sdeck(x, y) - 0.02 and abs(y) < B.ybw(x, sg) - 0.02 and mn not in ('inner', 'steel', 'mast', 'white', 'cabin'):
                report(o, 'under the deck', mn, p)
            # in the station: nothing through its ceiling or its inboard wall
            if B.OP0 < x < B.OP1 and -B.ybi(x) + 0.05 < y < B.YB - 0.02 and B.CEIL - 0.03 < z < B.CEIL + 0.03 and not inWell(x, y) and mn not in ('inner', 'dark', 'lens', 'alu', 'steel'):
                report(o, 'through the ceiling', mn, p)
            if B.OP0 < x < B.OP1 and abs(y - B.YB) < 0.01 and B.ZMD + 0.02 < z < B.CEIL - 0.02 and not (B.IDOOR[0] - 0.06 < x < B.IDOOR[1] + 0.06) and mn not in ('inner', 'steel', 'alu', 'frame', 'roof', 'hose', 'glass'):
                report(o, 'through the inboard wall', mn, p)
            # through the wheelhouse's side walls (a thin band at the wall's plane, between the cap and the roof)
            if B.WX0 + 0.06 < x < B.WXS - 0.06 and zs + 0.02 < z < B.WR - 0.02 and abs(abs(y) - B.wy(x) + B.WT / 2) < B.WT / 2 and mn not in ('white', 'inner', 'frame', 'glass', 'steel', 'dark', 'cush', 'wood'):
                report(o, 'in the wheelhouse side', mn, p)
for k, n in sorted(hits.items(), key=lambda q: -q[1]): print(n, k, ex[k])
print('TOTAL', sum(hits.values()))
