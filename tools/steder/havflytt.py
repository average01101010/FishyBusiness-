# Moves the tackle shops and yards that stand too near one of the ocean fleet's plants, so the plant can be a harbour of its own
# (H0 of docs/planer/havsteget.md, 03.11.2026; Jonas: «Rypefjord og fiskarstrand øst må også ha mottak for havflåten. Flytt om så
# butikken eller verftet»). The ocean fleet's plants are the ones core/06b-coastports.js makes harbours for the ocean vessels only (a fixed
# plant at a quay, 500 t a year or more of the game's and the ocean species, a fifth of it or more from vessels of 28 m and over, not a
# coast plant and more than 1.5 km from one); a shop or yard within SPACE km of such a plant is moved, by landflytt.py's rules:
#   - the nearest quay face that is good by steder.py's criteria (strict, soft, any usable face, then a pier line or a stretch of coast),
#   - with land within GAPOK m of the unit's ground, no bridge and no fixed obstacle in the berth (fotavtrykk.measure),
#   - SPACE km to every other place (plants, the ocean fleet's included, yards, shops, rorbuer, Father's naust), YARDS km between yards,
#   - within REACH km of the old face (1 km first, never over 4 km, so a shop stays in its town).
# Only the entry in src/data/steder.json changes. No network; reads the vector packs (tools/map/out/game).
#   python3 tools/steder/havflytt.py [--dry]
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import numpy as np
import fotavtrykk as F
import mottak
from steder import good, SPACE, YARDS
from landflytt import land_gap, bad, cost, GAPOK

STEDER = os.path.join(ROOT, 'src', 'data', 'steder.json'); MOTTAK = os.path.join(ROOT, 'src', 'data', 'mottak.json'); RORBU = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
REACHES = (1.0, 2.0, 3.0, 4.0)
COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe']
HAV_SP = ['sild', 'makrell', 'snokrabbe', 'blakveite']

def hav_plants(M):
    """the plants 06b-coastports.js makes harbours for the ocean vessels only (its rule, kept the same)"""
    wf = lambda x: sum((x['sp'].get(s) or [0])[0] or 0 for s in COAST_WF)
    conv = lambda x: sum(v for k, v in (x.get('gear') or {}).items() if any(t in k for t in ('Konv', 'Garn', 'Line', 'Jukse', 'Teine', 'Snurre')))
    typ = lambda x: x['t'] in ('Ordinært anlegg', 'Kaiselger') and x.get('q')
    ok = sorted([x for x in M if typ(x) and wf(x) >= 10000 and ((x.get('small') or 0) >= 0.05 or conv(x) >= 0.3)], key=lambda x: -wf(x))
    leads = []
    for x in ok:
        if not any(math.hypot(g['p'][0] - x['p'][0], g['p'][1] - x['p'][1]) < 1.2 for g in leads): leads.append(x)
    hkg = lambda x: wf(x) + sum((x['sp'].get(s) or [0])[0] or 0 for s in HAV_SP)
    out = []
    for x in sorted([x for x in M if typ(x) and x not in ok and (x.get('big') or 0) >= 0.2 and hkg(x) >= 500000], key=lambda x: -hkg(x)):
        if any(min(math.hypot(g['p'][0] - x['p'][0], g['p'][1] - x['p'][1]), math.hypot(g['q'][0] - x['q'][0], g['q'][1] - x['q'][1])) < 1.5 for g in leads + out): continue
        out.append(x)
    return out

def main():
    Q = mottak.quay_faces(F.GAME); X, Y, A, Ln, D, K = Q
    M = json.load(open(MOTTAK)); S = json.load(open(STEDER)); RB = json.load(open(RORBU))['r']
    hx, hy = F.LG(57.395, 27.563)
    pts = [(x['q'][0], x['q'][1], ('m', x['id'])) for x in M['m'] if x.get('q')] + [(r[0], r[1], ('s', i)) for i, r in enumerate(S['r'])]
    pts += [(r[0], r[1], ('r', i)) for i, r in enumerate(RB)] + [(56.058, 53.575, ('f', 0)), (hx, hy, ('n', 0))]
    HP = hav_plants(M['m'])
    todo = [(i, r, x) for x in HP for i, r in enumerate(S['r']) if math.hypot(r[0] - x['p'][0], r[1] - x['p'][1]) < SPACE]
    moved, unsolved = [], []
    for i, r, plant in todo:
        ref = ('s', i); kind = 'verft' if r[5] == 1 else 'butikk'; x0, y0 = r[0], r[1]
        best = None
        for reach in REACHES:
            d = np.hypot(X - x0, Y - y0); near = np.nonzero(d < reach)[0]; near = near[np.argsort(d[near])]
            for tier in range(5):
                cands = []; seen = 0
                for j in near:
                    j = int(j); fx, fy = float(X[j]), float(Y[j])
                    if not (good(Q, j, False) or (tier >= 1 and good(Q, j, True)) or (tier >= 2 and good(Q, j, 2)) or (tier >= 3 and Ln[j] >= 15 and D[j] >= 2.5) or (tier >= 4 and Ln[j] >= 8 and D[j] >= 1.5)): continue
                    if any(math.hypot(fx - a, fy - b) < SPACE for a, b, rr in pts if rr != ref): continue
                    if kind == 'verft' and any(math.hypot(fx - a, fy - b) < YARDS for a, b, rr in pts if rr[0] == 's' and rr != ref and S['r'][rr[1]][5] == 1): continue
                    nu = F.make_unit('x', kind, fx, fy, float(A[j]))
                    try: g2 = land_gap(nu)
                    except F.Missing: continue
                    seen += 1
                    if g2 > GAPOK: continue
                    r2 = F.measure(nu, F.Env(nu.o[0], nu.o[1], 150))
                    if bad(r2): continue
                    cands.append((cost(r2) + 20 * math.hypot(fx - x0, fy - y0), j, math.hypot(fx - x0, fy - y0)))
                    if len(cands) >= 6 or seen > 80: break
                if cands: best = min(cands); break
            if best: break
        name = plant.get('v') or plant['k']
        if not best: unsolved.append((kind, r[6], name)); continue
        _, j, dist = best; new = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2)]
        pts = [(new[0], new[1], rr) if rr == ref else (a, b, rr) for a, b, rr in pts]
        moved.append((i, kind, r[6], name, round(dist * 1000), new))
    for u in unsolved: print('UNSOLVED', u)
    for i, kind, town, name, m, new in moved: print('moved %-7s %-14s (by the ocean plant in %s) %5d m -> (%.3f, %.3f), %d m face, %.1f m deep' % (kind, town, name, m, new[0], new[1], new[3], new[4]))
    if moved and '--dry' not in sys.argv:
        for i, kind, town, name, m, new in moved: S['r'][i][:5] = new
        S['meta']['havflytt'] = '%d shops/yards moved 1.5 km from the ocean fleet\'s plants (%s), tools/steder/havflytt.py' % (len(moved), ', '.join(n for *_, n, _, _ in [(0, 0, 0, x[3], 0, 0) for x in moved]))
        S['r'].sort(key=lambda o: (o[0], o[1]))
        json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(HP), 'ocean fleet plants,', len(moved), 'moved,', len(unsolved), 'unsolved')

if __name__ == '__main__': main()
