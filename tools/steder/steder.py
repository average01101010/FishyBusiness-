# The tackle shops and the yards along the coast (trade places, Jonas 07.10.2026: «Verft kan godt plasseres på ekte plasser om vi finner
# data for dette, men vi må sannsynligvis også sette ut en del falske verft på strategiske plasser slik at det aldri er så veldig langt
# å gå til nærmeste verft»). Out: src/data/steder.json, one entry per place:
#   [x, y, a, len, depth, kind, place]   x, y the quay face's middle in the game's frame (km), a the normal's angle (rad, out to sea),
#   len the face's length (m), depth the water in front (m), kind 0 tackle shop and 1 yard, place the postal town (as the plants').
# Placing (Jonas 08.10.2026, docs/handelssteder.md «Plassering av stedene»): no two places (plants, shops, yards, rorbuer, Father's
# naust) nearer than SPACE km, so the mooring choice between two never comes up; sheltered quays first (the openness to the ocean,
# national.py expo); a real yard may move up to MOVE km to a better quay, and yards nearer than YARDS km to one another are thinned;
# no plant more than YARD_NEAR km (20 nm) from a yard; one tackle shop per town.
# Real places come from Overture Maps' places (categories boat_service, boat_dealer, boat_and_ship_manufacturer and boat_storage_facility
# are yards; boat_parts_store and hunting_and_fishing_store are shops), taken only as a point: no name, no address and no phone is kept
# (no real company names in the game, Jonas 07.10.2026). Each point is put on the nearest quay face of the game's vector packs (a quay or
# a pier of 25 m and more, 3 m of water, within 1.2 km), at least 130 m from every plant's and every other place's quay. Where the plants
# along the coast are still far from a yard (50 km) or a shop (28 km), a made-up place is put on the nearest free quay face to the
# plant (a good one within 4 km, else a usable one within 12 km): the largest first. Nothing here is a real firm.
#   python3 tools/steder/steder.py        (the vector packs: python3 tools/map/game.py; the first run reads Overture's places, ~350 MB)
import os, sys, json, math, time
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak'))
import ov, frame, mottak
import pyarrow.compute as pc

YARD = {'boat_service', 'boat_and_ship_manufacturer', 'boat_dealer', 'boat_storage_facility'}
SHOP = {'boat_parts_store', 'hunting_and_fishing_store'}
REACH = {0: 3.0, 1: 2.0}   # km from Overture's point to the quay face it is put on (a shop in its town, a yard moved a little)
SPACE = 1.5             # km between any two places, plants included (Jonas 08.10.2026); 0.6 where a village has no other quay
YARDS = 5.0             # km between two yards: nearer ones are thinned
NEAR = {0: 28.0, 1: 34.0}   # km: how far a plant may be from a shop and from a yard (20 nm by sea, straight a little less)
COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe']
OUT = os.path.join(ROOT, 'src', 'data', 'steder.json')

def good(Q, i, soft=False):
    X, Y, A, Ln, D, K = Q
    if soft == 2: return Ln[i] >= 8 and D[i] >= 1.5 and K[i] in (0, 2)   # any usable face, for the far places (the yard's own quay is its model's)
    return (Ln[i] >= 15 and D[i] >= 2 and K[i] in (0, 2)) if soft else (Ln[i] >= 25 and D[i] >= 3 and K[i] in (0, 2))

def main():
    md = os.environ.get('KYST_MAP') or os.path.join(ROOT, 'tools', 'map', 'out', 'game')
    Q = mottak.quay_faces(md); X, Y, A, Ln, D, K = Q
    M = json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m']
    wf = lambda x: sum((x['sp'].get(s) or [0])[0] for s in COAST_WF)
    conv = lambda x: sum(v for k, v in (x.get('gear') or {}).items() if any(w in k for w in ('Konv', 'Garn', 'Line', 'Jukse', 'Teine', 'Snurre')))
    plants = [x for x in M if x['t'] in ('Ordinært anlegg', 'Kaiselger') and x.get('q') and wf(x) >= 10000 and (x['small'] >= 0.05 or conv(x) >= 0.3)]
    plants.sort(key=lambda x: -wf(x))
    # every plant the game has (the register's quays), Finnsnes' own quay and Father's naust in Vangshamn (frame.py from lat/lon)
    hx, hy = frame.to_nat(np.array([18.012]), np.array([69.4724]))
    taken = [(x['q'][0], x['q'][1]) for x in M if x.get('q')] + [(56.058, 53.575), (float(hx[0]), float(hy[0]))]
    import national
    E = national.expo()
    def ex(x, y): return float(E[min(E.shape[0] - 1, max(0, int(y / 0.5))), min(E.shape[1] - 1, max(0, int(x / 0.5)))]) / 255
    print(len(plants), 'plants for the coverage;', len(taken), 'quays taken', flush=True)
    # the real ones
    ov.TYPES = ov.TYPES + ['places/place']
    tab = ov.features('places/place', ov.NOR, ['taxonomy', 'operating_status', 'confidence'])
    prim = pc.struct_field(tab.column('taxonomy'), 'primary').to_pylist(); st = tab.column('operating_status').to_pylist(); cf = tab.column('confidence').to_pylist()
    bb = tab.column('bbox'); lon = pc.struct_field(bb, 'xmin').to_numpy(); lat = pc.struct_field(bb, 'ymin').to_numpy()
    cand = [(i, 1 if prim[i] in YARD else 0) for i in range(tab.num_rows) if prim[i] in YARD | SHOP and (st[i] in (None, 'open')) and (cf[i] is None or cf[i] >= 0.4)]
    print(len(cand), 'candidates from Overture', flush=True)
    cx, cy = frame.to_nat(lon[[i for i, _ in cand]], lat[[i for i, _ in cand]])
    out = []; used = list(taken)
    def free(x, y, sp=SPACE): return all(math.hypot(x - a, y - b) >= sp for a, b in used)
    def yard_free(x, y): return all(math.hypot(x - o[0], y - o[1]) >= YARDS for o in out if o[5] == 1)
    def put(j, kind, real):
        o = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), kind, '', real]
        out.append(o); used.append((float(X[j]), float(Y[j]))); return o
    # the quay for a point: good, free, within reach, the most sheltered first (a kilometre's walk is worth 0.25 of openness)
    def best_quay(x, y, kind, reach, soft=False, sp=SPACE):
        d = np.hypot(X - x, Y - y); near = np.nonzero(d < reach)[0]
        ok = [j for j in near if good(Q, j, soft) and free(float(X[j]), float(Y[j]), sp) and (kind == 0 or yard_free(float(X[j]), float(Y[j])))]
        return min(ok, key=lambda j: ex(float(X[j]), float(Y[j])) + 0.25 * float(d[j])) if ok else None
    # the yards first (the most certain first), then the shops, one to a town
    cand.sort(key=lambda c: (-c[1], -(cf[c[0]] or 0)))
    pts = dict(zip([i for i, _ in cand], zip(cx, cy)))
    rows = [{'ll': [round(float(lat[i]), 4), round(float(lon[i]), 4)], 'i': i} for i, k in cand if k == 0]
    mottak.places(rows); town = {r['i']: r.get('v') for r in rows}
    towns = {'Finnsnes'}
    for i, kind in cand:
        x, y = pts[i]
        if kind == 0 and town.get(i) and town[i] in towns: continue
        j = best_quay(x, y, kind, REACH[kind])
        if j is None: j = best_quay(x, y, kind, REACH[kind], False, 0.6)   # a village with no other quay
        if j is None: continue
        o = put(j, kind, 1)
        if kind == 0 and town.get(i): towns.add(town[i]); o[6] = town[i]
    print('real places on a quay:', sum(1 for o in out if o[5] == 0), 'shops,', sum(1 for o in out if o[5] == 1), 'yards', flush=True)
    # coverage: the plants far from a place of each kind get a made-up one on the nearest free quay face
    def far(p, kind): return min([math.hypot(p['q'][0] - o[0], p['q'][1] - o[1]) for o in out if o[5] == kind] + [1e9]) > NEAR[kind]
    made = {0: 0, 1: 0}
    for kind in (1, 0):
        for p in plants:
            if not far(p, kind): continue
            for soft, reach, sp in ((False, 5.0, SPACE), (True, 12.0, SPACE), (2, 34.0, SPACE), (2, 34.0, 0.6)):   # last: a village with no other quay (0.6 km, still far outside the 120 m of the mooring choice)   # a good quay near the plant, else any usable one further off
                j = best_quay(p['q'][0], p['q'][1], kind, reach, soft, sp)
                if j is None: continue
                if kind == 0:   # one shop to a town
                    r = [{'ll': [round(float(v), 4) for v in frame.to_ll(float(X[j]), float(Y[j]))[::-1]]}]; mottak.places(r)
                    if r[0].get('v') in towns: continue
                    if r[0].get('v'): towns.add(r[0]['v'])
                put(j, kind, 0); made[kind] += 1; break
            else:
                if True:
                    d = np.hypot(X - p['q'][0], Y - p['q'][1]); n12 = np.nonzero(d < 12.0)[0]
                    d2 = np.hypot(X - p['q'][0], Y - p['q'][1]); n34 = np.nonzero(d2 < 34.0)[0]; g2 = [j for j in n34 if good(Q, j, 2)]
                    print('  tier2: quays', len(n34), 'good', len(g2), 'free', sum(1 for j in g2 if free(float(X[j]), float(Y[j]))), 'yard_free', sum(1 for j in g2 if yard_free(float(X[j]), float(Y[j]))), flush=True)
                    print('no', 'shop' if kind == 0 else 'yard', 'for', p.get('v') or p['id'], 'quays within 12 km:', len(n12), 'good:', sum(1 for j in n12 if good(Q, j, True)), 'free:', sum(1 for j in n12 if good(Q, j, True) and free(float(X[j]), float(Y[j]))), flush=True)
    print('made up:', made[0], 'shops,', made[1], 'yards', flush=True)
    # the postal towns, as for the plants (Kartverket's address register, cached in tools/mottak/cache/steder.json)
    rows = []
    for o in out:
        lo, la = frame.to_ll(o[0], o[1]); rows.append({'ll': [round(float(la), 4), round(float(lo), 4)], 'o': o})
    mottak.places(rows)
    res = []
    for r in rows:
        o = r['o']; res.append([round(o[0], 4), round(o[1], 4), round(o[2], 3), round(o[3], 1), round(o[4], 2), o[5], r.get('v', '')])
    # one tackle shop to a town, a real one before a made-up one, and none in Finnsnes (its quay has the shop in the boat hall)
    seen = {'Finnsnes'}
    byo = sorted(range(len(res)), key=lambda i: (-rows[i]['o'][7],))
    drop = set()
    for i in byo:
        if res[i][5] != 0 or not res[i][6]: continue
        if res[i][6] in seen: drop.add(i)
        else: seen.add(res[i][6])
    print('shops dropped for a town that has one:', len(drop))
    res = [r for i, r in enumerate(res) if i not in drop]
    res.sort(key=lambda o: (o[0], o[1]))
    meta = dict(made=time.strftime('%Y-%m-%d'), src='Overture Maps places (points only), the game\'s vector packs; made-up places where the plants are far from one',
                shops=sum(1 for o in res if o[5] == 0), yards=sum(1 for o in res if o[5] == 1), real=sum(o[7] for o in out))
    json.dump(dict(meta=meta, r=res), open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(meta, ensure_ascii=False), 'no town for', sum(1 for o in res if not o[6]))

if __name__ == '__main__': main()
