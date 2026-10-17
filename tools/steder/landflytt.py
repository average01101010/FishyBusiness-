# Moves the plants, yards and tackle shops that stand out in the water to a quay face with land behind it (Jonas 10.10.2026: «Fiskemottaket
# i Vannvåg ligger midt i havet og det ser utrolig dumt ut. Gjelder dette flere fiskemottak, naust, rorbuer, verftet eller utstyrsbutikker?»).
# A place is a harbour unit (01-world.js UNITS, 06b-coastports.js, 06c-steder.js): its block (54.8 m along the face and 24.4 m behind it,
# a yard's 120 by 34 m) and the 4 m of fill behind that. It stands on the quay face of the vector packs, and nothing else holds it to the shore: a face on
# a pier line that runs out from the shore (Vannvåg: a pier line 150 m from land) gives a unit on piles in the middle of the sea.
# land_gap() measures how far the unit's ground lies from land (the 25 m mask the game falls back on, as fotavtrykk.land): 0 when it touches or
# overlaps land, GAPOK m or less counts as joined (the mask is 25 m, the 3D view levels the ground at the edge). A place with a larger gap is
# moved to the nearest quay face that
#   - is good by tools/steder/steder.py's criteria (the strict ones first, then the soft ones, then any usable face, then a pier line or a
#     stretch of coast of 15 m and 2.5 m of water, last one of 8 m and 1.5 m),
#   - has land within GAPOK m of its ground,
#   - lies within REACH km (500 m first, never over 3 km) of the old face,
#   - keeps SPACE km to every other place (as bruflytt.py: plants, yards, shops, rorbuer, Father's naust), and YARDS km to the other yards,
#   - has no bridge and no fixed obstacle in the berth (fotavtrykk.measure: 'bru', 'pir_liggeplass').
# Only q (the face) of the plants in src/data/mottak.json changes, and the entry in src/data/steder.json. No network; reads the vector packs
# (tools/map/out/game). Run it after bruflytt.py (a second run finds nothing to move).
#   python3 tools/steder/landflytt.py [--dry]      (--report prints every place's gap and moves nothing)
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import numpy as np
from shapely.geometry import Point
import fotavtrykk as F
import mottak
from steder import good, SPACE, YARDS

STEDER = os.path.join(ROOT, 'src', 'data', 'steder.json'); MOTTAK = os.path.join(ROOT, 'src', 'data', 'mottak.json'); RORBU = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
REACHES = (0.5, 1.0, 1.5, 3.0)
GAPOK = 6.0       # m from the unit's ground to land that still counts as joined (the fine coast is simplified to 3 m)
FAR = 400.0       # m: the gap is not measured further than this

def land_gap(u):
    """metres from the unit's ground (block and fill) to the nearest land of the fine coast (the game's truth near the boats; the 25 m mask
    where a tile has none): 0 when it touches or overlaps land, FAR + 1 when none within FAR m. Land in front of the face does not join it:
    only what lies beside and behind the face counts (the unit's own frame, lz up to 2 m out from the face)."""
    P = u.poly_land(); x0, z0, x1, z1 = P.bounds
    # on and in the ground: a 4 m grid
    for x in np.arange(x0, x1 + 4, 4.0):
        for z in np.arange(z0, z1 + 4, 4.0):
            if P.intersects(Point(x, z)) and F.land_fine(float(x), float(z)): return 0.0
    # rings round it: the nearer first, the seaward side left out
    for d in (4, 8, 12, 20, 30, 50, 80, 120, 200, FAR):
        ring = P.buffer(d).exterior; n = max(8, int(ring.length // 5))
        for i in range(n):
            q = ring.interpolate(i / n, normalized=True)
            if u.L(q.x, q.y)[1] > 2: continue
            if F.land_fine(q.x, q.y): return float(d)
    return FAR + 1

def tot(res, k): return sum(v for _, v, _ in res.get(k, []))
def bad(res): return bool(res.get('bru')) or bool(res.get('pir_liggeplass'))
def cost(res): return tot(res, 'pir_basseng') / 50 + tot(res, 'vei') + tot(res, 'bygg') * 5 + tot(res, 'pir_land') / 20

def main():
    md = F.GAME
    Q = mottak.quay_faces(md); X, Y, A, Ln, D, K = Q
    M = json.load(open(MOTTAK)); S = json.load(open(STEDER)); RB = json.load(open(RORBU))['r']
    hx, hy = F.LG(57.395, 27.563)
    pts = [(x['q'][0], x['q'][1], ('m', x['id'])) for x in M['m'] if x.get('q')] + [(r[0], r[1], ('s', i)) for i, r in enumerate(S['r'])]
    pts += [(r[0], r[1], ('r', i)) for i, r in enumerate(RB)] + [(56.058, 53.575, ('f', 0)), (hx, hy, ('n', 0))]
    places, _ = F.load_places(); moved = []; report = []; gaps = []
    for u in places:
        if not hasattr(u, 'ref'): continue
        try: g = land_gap(u)
        except F.Missing: report.append((u.ref, u.kind, u.name, 'no map under it')); continue
        gaps.append((g, u))
        if '--report' in sys.argv or g <= GAPOK: continue
        ref = u.ref; x0, y0 = u.o[0] / 1000, u.o[1] / 1000
        # a plant's register entries on the very same face (Kongsfjord: two firms, one quay) are one place with it, not a neighbour
        pts = [t for t in pts if t[2] == ref or t[2][0] != 'm' or math.hypot(t[0] - x0, t[1] - y0) > 0.002]
        nn = min(math.hypot(x0 - a, y0 - b) for a, b, r in pts if r != ref)
        yd_nn = min([math.hypot(x0 - a, y0 - b) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1] + [1e9]) if u.kind == 'verft' else None
        best = None
        for reach in REACHES:
            d = np.hypot(X - x0, Y - y0); near = np.nonzero(d < reach)[0]; near = near[np.argsort(d[near])]
            for sp, tier in ((SPACE, 0), (max(0.6, min(SPACE, nn)), 0), (max(0.6, min(SPACE, nn)), 1), (max(0.6, min(SPACE, nn)), 2), (max(0.6, min(SPACE, nn)), 3), (max(0.6, min(SPACE, nn)), 4), (0.6, 3), (0.6, 4)):   # the last two: a village with no other face keeps 0.6 km (steder.py)
                cands = []; seen = 0
                for j in near:
                    j = int(j); fx, fy = float(X[j]), float(Y[j])
                    # tiers 3 and 4: a pier line or a stretch of coast, as the plants' own faces often are (mottak.py snap); where a village has no quay
                    # of OpenStreetMap's, the land check is what decides
                    if not (good(Q, j, False) or (tier >= 1 and good(Q, j, True)) or (tier >= 2 and good(Q, j, 2)) or (tier >= 3 and Ln[j] >= 15 and D[j] >= 2.5) or (tier >= 4 and Ln[j] >= 8 and D[j] >= 1.5)): continue
                    if any(math.hypot(fx - a, fy - b) < sp for a, b, r in pts if r != ref): continue
                    if u.kind == 'verft' and any(math.hypot(fx - a, fy - b) < min(YARDS, yd_nn) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1): continue
                    nu = F.make_unit('x', u.kind, fx, fy, float(A[j]))
                    try: g2 = land_gap(nu)
                    except F.Missing: continue
                    seen += 1
                    if g2 > GAPOK: continue
                    r2 = F.measure(nu, F.Env(nu.o[0], nu.o[1], 150))
                    if bad(r2): continue
                    cands.append((cost(r2) + 20 * math.hypot(fx - x0, fy - y0), j, g2, r2, math.hypot(fx - x0, fy - y0)))
                    if len(cands) >= 6 or seen > 80: break
                if cands: best = min(cands, key=lambda c: c[0]); break
            if best: break
        if not best: report.append((ref, u.kind, u.name, 'no face with land within 3 km (gap %d m)' % g)); continue
        _, j, g2, r2, dist = best; new = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), int(K[j])]
        pts = [(new[0], new[1], r) if r == ref else (a, b, r) for a, b, r in pts]
        moved.append((ref, u.kind, u.name, round(dist * 1000), new, g, g2))
    gs = sorted(g for g, _ in gaps)
    print('places measured:', len(gs), '| joined (gap <= %d m): %d | gap <= 30 m: %d | further: %d' % (GAPOK, sum(1 for g in gs if g <= GAPOK), sum(1 for g in gs if GAPOK < g <= 30), sum(1 for g in gs if g > 30)))
    if '--report' in sys.argv:
        for g, u in sorted(gaps, key=lambda t: -t[0])[:60]: print('%-8s %-24s gap %5.0f m  (%.3f, %.3f)' % (u.kind, u.name, g, u.o[0] / 1000, u.o[1] / 1000))
        return
    for r in report: print('UNSOLVED', r)
    for ref, kind, name, m, new, g, g2 in moved: print('moved %-7s %-14s %-22s %5d m  -> (%.3f, %.3f)  gap %d -> %d m' % (kind, ref[1], name, m, new[0], new[1], g, g2))
    if moved and '--dry' not in sys.argv:
        for ref, kind, name, m, new, g, g2 in moved:
            if ref[0] == 'm':
                x = next(e for e in M['m'] if e['id'] == ref[1]); p = x['p']; x['q'] = new + [round(math.hypot(new[0] - p[0], new[1] - p[1]) * 1000)]
            else: S['r'][ref[1]][:5] = new[:5]
        nm = sum(1 for r in moved if r[0][0] == 'm'); ns = len(moved) - nm
        S['meta']['landflytt'] = '%d places moved to a quay face with land behind it (%d plants, %d yards/shops), tools/steder/landflytt.py' % (len(moved), nm, ns)
        M['meta']['landflytt'] = '%d plants moved to a quay face with land behind it, tools/steder/landflytt.py' % nm
        S['r'].sort(key=lambda o: (o[0], o[1]))
        json.dump(M, open(MOTTAK, 'w'), ensure_ascii=False, separators=(',', ':')); json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(moved), 'moved,', len(report), 'unsolved')

if __name__ == '__main__': main()
