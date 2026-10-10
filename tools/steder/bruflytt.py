# Moves the plants, yards and tackle shops that a bridge touches to another quay face (Jonas 08.10.2026: «Juster mottak og verft som blir
# berørt av broer slik at alt er greit»). A place whose footprint (the unit's block, fill and basin, fotavtrykk.py) lies within 5 m of a
# bridge of the vector packs has no business there: the bridge would be drawn over the plant or hang over the berth. For each such place
# the nearest quay face is taken that
#   - is good by tools/steder/steder.py's criteria (the strict ones first, then the soft ones),
#   - lies within REACH km (500 m first, never over 1.5 km) of the old face,
#   - keeps SPACE km to every other place (plants, yards, shops, rorbuer, Father's naust), else no nearer than it was before (at least
#     0.6 km where a village has no other quay), and keeps YARDS km to the other yards,
#   - has no bridge and no fixed obstacle in the berth (fotavtrykk.measure: 'bru', 'pir_liggeplass'), and is not worse in the basin,
#     on the roads and in the buildings, as far as there is a choice.
# The plants' postal towns, names and registers stay; only q (the face, the 7th figure the distance to the register's point) changes in
# src/data/mottak.json, and the entry in src/data/steder.json. No network; reads the vector packs (tools/map/out/game).
#   python3 tools/steder/bruflytt.py [--dry]   (idempotent: a second run finds nothing to move; --dry only prints)
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import numpy as np
import fotavtrykk as F
import mottak
from steder import good, SPACE, YARDS, NEAR

STEDER = os.path.join(ROOT, 'src', 'data', 'steder.json'); MOTTAK = os.path.join(ROOT, 'src', 'data', 'mottak.json'); RORBU = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
REACHES = (0.5, 1.0, 1.5)

def tot(res, k): return sum(v for _, v, _ in res.get(k, []))
def bad(res): return bool(res.get('bru')) or bool(res.get('pir_liggeplass'))
def cost(res): return tot(res, 'pir_basseng') / 50 + tot(res, 'vei') + tot(res, 'bygg') * 5 + tot(res, 'pir_land') / 20

def main():
    md = F.GAME
    Q = mottak.quay_faces(md); X, Y, A, Ln, D, K = Q
    M = json.load(open(MOTTAK)); S = json.load(open(STEDER)); RB = json.load(open(RORBU))['r']
    hx, hy = F.LG(57.395, 27.563)
    # every place as [x, y, ref] (ref: how to write it back)
    pts = [(x['q'][0], x['q'][1], ('m', x['id'])) for x in M['m'] if x.get('q')] + [(r[0], r[1], ('s', i)) for i, r in enumerate(S['r'])]
    pts += [(r[0], r[1], ('r', i)) for i, r in enumerate(RB)] + [(56.058, 53.575, ('f', 0)), (hx, hy, ('n', 0))]
    # which places are touched by a bridge (the footprint measured as in fotavtrykk.measure)
    places, _ = F.load_places(); moved = []; report = []
    for u in places:
        if not hasattr(u, 'ref'): continue
        env = F.Env(u.o[0], u.o[1], 150); res = F.measure(u, env)
        if not res.get('bru'): continue
        ref = u.ref; x0, y0 = u.o[0] / 1000, u.o[1] / 1000
        nn = min(math.hypot(x0 - a, y0 - b) for a, b, r in pts if r != ref)
        yd_nn = min([math.hypot(x0 - a, y0 - b) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1] + [1e9]) if u.kind == 'verft' else None
        best = None
        for reach in REACHES:
            d = np.hypot(X - x0, Y - y0); near = np.nonzero(d < reach)[0]; near = near[np.argsort(d[near])]
            for sp, soft2 in ((SPACE, False), (max(0.6, min(SPACE, nn)), False), (max(0.6, min(SPACE, nn)), True)):   # last: any usable face, as steder.py's far places
                tier2 = None; seen = 0
                for j in near:
                    j = int(j); fx, fy = float(X[j]), float(Y[j])
                    if not (good(Q, j, False) or good(Q, j, True) or (soft2 and good(Q, j, 2))): continue
                    if any(math.hypot(fx - a, fy - b) < sp for a, b, r in pts if r != ref): continue
                    if u.kind == 'verft' and any(math.hypot(fx - a, fy - b) < min(YARDS, yd_nn) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1): continue
                    nu = F.make_unit('x', u.kind, fx, fy, float(A[j])); r2 = F.measure(nu, F.Env(nu.o[0], nu.o[1], 150)); seen += 1
                    if bad(r2): continue
                    if cost(r2) <= cost(res) + 1e-6: best = (j, r2, math.hypot(fx - x0, fy - y0)); break
                    if tier2 is None or cost(r2) + 20 * math.hypot(fx - x0, fy - y0) < tier2[3]: tier2 = (j, r2, math.hypot(fx - x0, fy - y0), cost(r2) + 20 * math.hypot(fx - x0, fy - y0))
                    if seen > 60: break
                if best: break
                if tier2 and not best: best = tier2[:3]; break
            if best: break
        if not best: report.append((ref, u.kind, u.name, 'no face within 1.5 km')); continue
        j, r2, dist = best; new = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), int(K[j])]
        # the point list follows, so the next place sees this one where it now stands
        pts = [(new[0], new[1], r) if r == ref else (a, b, r) for a, b, r in pts]
        moved.append((ref, u.kind, u.name, round(dist * 1000), new, cost(res), cost(r2)))
    for ref, kind, name, m, new, c0, c1 in moved:
        if ref[0] == 'm':
            x = next(e for e in M['m'] if e['id'] == ref[1]); old = x['q']; p = x['p']
            x['q'] = new + [round(math.hypot(new[0] - p[0], new[1] - p[1]) * 1000)]
        else:
            S['r'][ref[1]][:5] = new[:5]
    for r in report: print('UNSOLVED', r)
    for ref, kind, name, m, new, c0, c1 in moved: print('moved %-7s %-14s %-22s %5d m  -> (%.3f, %.3f)  cost %.0f -> %.0f' % (kind, ref[1], name, m, new[0], new[1], c0, c1))
    if moved and '--dry' not in sys.argv:
        nm = sum(1 for r in moved if r[0][0] == 'm'); ns = len(moved) - nm
        S['meta']['bruflytt'] = '%d places moved to another quay face because of bridges (%d plants, %d yards/shops), tools/steder/bruflytt.py' % (len(moved), nm, ns)
        M['meta']['bruflytt'] = '%d plants moved to another quay face because of bridges, tools/steder/bruflytt.py' % nm
        S['r'].sort(key=lambda o: (o[0], o[1]))
        json.dump(M, open(MOTTAK, 'w'), ensure_ascii=False, separators=(',', ':')); json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(moved), 'moved,', len(report), 'unsolved')

if __name__ == '__main__': main()
