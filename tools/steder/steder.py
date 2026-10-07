# The tackle shops and the yards along the coast (trade places, Jonas 07.10.2026: «Verft kan godt plasseres på ekte plasser om vi finner
# data for dette, men vi må sannsynligvis også sette ut en del falske verft på strategiske plasser slik at det aldri er så veldig langt
# å gå til nærmeste verft»). Out: src/data/steder.json, one entry per place:
#   [x, y, a, len, depth, kind, place]   x, y the quay face's middle in the game's frame (km), a the normal's angle (rad, out to sea),
#   len the face's length (m), depth the water in front (m), kind 0 tackle shop and 1 yard, place the postal town (as the plants').
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
REACH = 1.2             # km from Overture's point to the nearest good quay face
APART = 0.13            # km between a place's quay and any other quay of a plant or a place
NEAR = {0: 28.0, 1: 50.0}   # km: how far a plant may be from a shop and from a yard before one is made up
COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe']
OUT = os.path.join(ROOT, 'src', 'data', 'steder.json')

def good(Q, i, soft=False):
    X, Y, A, Ln, D, K = Q
    return (Ln[i] >= 15 and D[i] >= 2 and K[i] in (0, 2)) if soft else (Ln[i] >= 25 and D[i] >= 3 and K[i] in (0, 2))

def main():
    md = os.environ.get('KYST_MAP') or os.path.join(ROOT, 'tools', 'map', 'out', 'game')
    Q = mottak.quay_faces(md); X, Y, A, Ln, D, K = Q
    M = json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m']
    wf = lambda x: sum((x['sp'].get(s) or [0])[0] for s in COAST_WF)
    conv = lambda x: sum(v for k, v in (x.get('gear') or {}).items() if any(w in k for w in ('Konv', 'Garn', 'Line', 'Jukse', 'Teine', 'Snurre')))
    plants = [x for x in M if x['t'] in ('Ordinært anlegg', 'Kaiselger') and x.get('q') and wf(x) >= 10000 and (x['small'] >= 0.05 or conv(x) >= 0.3)]
    plants.sort(key=lambda x: -wf(x))
    taken = [(x['q'][0], x['q'][1]) for x in M if x.get('q')] + [(56.058, 53.575)]   # every register quay, and Finnsnes' own
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
    def free(x, y): return all(math.hypot(x - a, y - b) >= APART for a, b in used)
    for (i, kind), x, y in zip(cand, cx, cy):
        d = np.hypot(X - x, Y - y); near = np.nonzero(d < REACH)[0]
        near = [j for j in near[np.argsort(d[near])] if good(Q, j) and free(float(X[j]), float(Y[j]))]
        if not near: continue
        j = near[0]
        out.append([round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), kind, '', 1]); used.append((float(X[j]), float(Y[j])))
    print('real places on a quay:', sum(1 for o in out if o[5] == 0), 'shops,', sum(1 for o in out if o[5] == 1), 'yards', flush=True)
    # coverage: the plants far from a place of each kind get a made-up one on the nearest free quay face
    def far(p, kind): return min([math.hypot(p['q'][0] - o[0], p['q'][1] - o[1]) for o in out if o[5] == kind] + [1e9]) > NEAR[kind]
    made = {0: 0, 1: 0}
    for kind in (1, 0):
        for p in plants:
            if not far(p, kind): continue
            d = np.hypot(X - p['q'][0], Y - p['q'][1]); order = np.argsort(d); done = False
            for soft, reach in ((False, 4.0), (True, 12.0)):   # a good quay near the plant, else any usable one further off
                for j in order[:20000]:
                    if d[j] < APART or d[j] > reach: continue
                    if not good(Q, j, soft) or not free(float(X[j]), float(Y[j])): continue
                    out.append([round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), kind, '', 0]); used.append((float(X[j]), float(Y[j])))
                    made[kind] += 1; done = True; break
                if done: break
    print('made up:', made[0], 'shops,', made[1], 'yards', flush=True)
    # the postal towns, as for the plants (Kartverket's address register, cached in tools/mottak/cache/steder.json)
    rows = []
    for o in out:
        lo, la = frame.to_ll(o[0], o[1]); rows.append({'ll': [round(float(la), 4), round(float(lo), 4)], 'o': o})
    mottak.places(rows)
    res = []
    for r in rows:
        o = r['o']; res.append([round(o[0], 4), round(o[1], 4), round(o[2], 3), round(o[3], 1), round(o[4], 2), o[5], r.get('v', '')])
    res.sort(key=lambda o: (o[0], o[1]))
    meta = dict(made=time.strftime('%Y-%m-%d'), src='Overture Maps places (points only), the game\'s vector packs; made-up places where the plants are far from one',
                shops=sum(1 for o in res if o[5] == 0), yards=sum(1 for o in res if o[5] == 1), real=sum(o[7] for o in out))
    json.dump(dict(meta=meta, r=res), open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps(meta, ensure_ascii=False), 'no town for', sum(1 for o in res if not o[6]))

if __name__ == '__main__': main()
