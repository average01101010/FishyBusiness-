# The yard and the tackle shop in Longyearbyen (H1b R7, V4 B of docs/planer/havsteget-h1b-rammen.md; Jonas 03.11.2026: «Ja, longyearbyen må
# ha verft og utstyrsbutikk, på denne måten er spillerne dekket mot det meste»). Longyearbyen is a harbour without a plant: no catch is landed
# there. The yard sells fuel as along the coast. Both are placed by the rule in docs/handelssteder.md («Plassering av stedene»):
#   - on a quay face of the game's vector packs that is good by steder.py's criteria (strict, soft, any usable face, then a pier line or a
#     stretch of coast), with land within GAPOK m of the unit's ground and no bridge or fixed obstacle in the berth (as landflytt.py),
#   - SPACE km (1.5) from each other and from every other place, YARDS km from the other yards,
#   - in shelter: national.expo() covers only the old frame, so the openness here is measured on the spot: the mean fetch over open water
#     in 24 directions (the 25 m mask, up to FETCH km), scaled 0-1,
#   - near the town: the walk to Longyearbyen's centre (Kartverket's place name, 78.2232 N 15.6469 E) counts, and the yard goes first.
# The names are the place's (the town is «Longyearbyen»), never a firm's. Idempotent: entries within REACH km of the town are replaced.
#   python3 tools/steder/svalbard.py [--dry]     (the vector packs with Svalbard: python3 tools/map/release.py and game.py, kart-31 or later)
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import numpy as np
import fotavtrykk as F
import mottak, frame
from steder import good, SPACE, YARDS
from landflytt import land_gap, bad, cost, GAPOK

STEDER = os.path.join(ROOT, 'src', 'data', 'steder.json'); MOTTAK = os.path.join(ROOT, 'src', 'data', 'mottak.json'); RORBU = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
TOWN = 'Longyearbyen'; CENTRE = (78.2232, 15.6469)   # lat, lon
REACH = 5.0          # km from the centre: the quays looked at
FETCH = 30.0         # km: the longest fetch counted
W_EXPO, W_WALK = 40.0, 6.0   # the weights: openness (0-1) and the walk to the centre (km), against landflytt's cost

def openness(x, y):
    """mean open-water fetch from (x, y) km in 24 directions, as a share of FETCH (0 sheltered, 1 open sea)"""
    tot = 0.0
    for k in range(24):
        a = 2 * math.pi * k / 24; dx, dy = math.sin(a), -math.cos(a); s = 0.1
        while s < FETCH:
            try:
                if F.land((x + dx * s) * 1000, (y + dy * s) * 1000): break
            except F.Missing: pass   # off the packs: the open sea
            s += 0.2
        tot += min(s, FETCH)
    return tot / 24 / FETCH

def main():
    Q = mottak.quay_faces(F.GAME); X, Y, A, Ln, D, K = Q
    M = json.load(open(MOTTAK)); S = json.load(open(STEDER)); RB = json.load(open(RORBU))['r']
    cx, cy = frame.to_nat(np.array([CENTRE[1]]), np.array([CENTRE[0]])); cx, cy = float(cx[0]), float(cy[0])
    keep = [r for r in S['r'] if math.hypot(r[0] - cx, r[1] - cy) > REACH]
    hx, hy = F.LG(57.395, 27.563)
    pts = [(x['q'][0], x['q'][1]) for x in M['m'] if x.get('q')] + [(r[0], r[1]) for r in keep] + [(r[0], r[1]) for r in RB] + [(56.058, 53.575), (hx, hy)]
    yards = [(r[0], r[1]) for r in keep if r[5] == 1]
    d = np.hypot(X - cx, Y - cy); near = np.nonzero(d < REACH)[0]; near = near[np.argsort(d[near])]
    print(len(near), 'quay faces within %.0f km of %s' % (REACH, TOWN), flush=True)
    seen = set(); out = []
    for kind in ('verft', 'butikk'):
        best = None
        for tier in range(5):
            cands = []
            for j in near:
                j = int(j); fx, fy = float(X[j]), float(Y[j])
                if (round(fx, 3), round(fy, 3), kind) in seen: continue
                seen.add((round(fx, 3), round(fy, 3), kind))
                if not (good(Q, j, False) or (tier >= 1 and good(Q, j, True)) or (tier >= 2 and good(Q, j, 2)) or (tier >= 3 and Ln[j] >= 15 and D[j] >= 2.5) or (tier >= 4 and Ln[j] >= 8 and D[j] >= 1.5)): continue
                if any(math.hypot(fx - a, fy - b) < SPACE for a, b in pts): continue
                if kind == 'verft' and any(math.hypot(fx - a, fy - b) < YARDS for a, b in yards): continue
                nu = F.make_unit('x', kind, fx, fy, float(A[j]))
                try: g2 = land_gap(nu)
                except F.Missing: continue
                if g2 > GAPOK: continue
                r2 = F.measure(nu, F.Env(nu.o[0], nu.o[1], 150))
                if bad(r2): continue
                ex = openness(fx, fy); walk = math.hypot(fx - cx, fy - cy)
                cands.append((cost(r2) + W_EXPO * ex + W_WALK * walk, j, ex, walk, g2))
            seen = {s for s in seen if s[2] != kind}   # the next tier looks at every face again
            if cands: best = min(cands); break
        if not best: print('UNSOLVED', kind); continue
        c, j, ex, walk, g2 = best
        row = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), 1 if kind == 'verft' else 0, TOWN]
        out.append(row); pts.append((row[0], row[1]))
        if kind == 'verft': yards.append((row[0], row[1]))
        lo, la = frame.to_ll(row[0], row[1])
        print('%-7s (%.4f, %.4f) = %.4f N %.4f E, face %.0f m, %.1f m deep, kind %d, openness %.2f, %.2f km from the centre, land gap %.0f m, tier %d'
              % (kind, row[0], row[1], la, lo, row[3], row[4], int(K[j]), ex, walk, g2, tier), flush=True)
    if len(out) == 2: print('between them: %.2f km' % math.hypot(out[0][0] - out[1][0], out[0][1] - out[1][1]))
    if out and '--dry' not in sys.argv:
        S['r'] = sorted(keep + out, key=lambda o: (o[0], o[1]))
        S['meta']['svalbard'] = 'the yard and the tackle shop in Longyearbyen (H1b R7), tools/steder/svalbard.py'
        S['meta']['shops'] = sum(1 for o in S['r'] if o[5] == 0); S['meta']['yards'] = sum(1 for o in S['r'] if o[5] == 1)
        json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
        print('written:', STEDER)

if __name__ == '__main__': main()
