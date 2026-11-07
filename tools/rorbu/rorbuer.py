# The rorbuer along the coast (05.10.2026; Jonas: «Disse skal plasseres rundt om kring langs kysten slik at spillere kan hvile der,
# eller ligge til kai under uvær. De vil som regel ligge i områder som er litt beskyttet mot bølger og vær»). Two kinds:
#   0  one by each fishing harbour of the game (the receivers 06b-coastports.js makes harbours of, src/data/mottak.json): a rorbu
#      belongs in a fishing village, but not on the plant's quay (Jonas 08.10.2026: «Ikke så langt fra fiskemottak, men ikke så nært at
#      det blir trøbbel med fortøyning»): the most sheltered shore cell NEAR km from the plant, nearest 2.5 km first
#   1  sheltered shore between them: Norwegian sea (Overture's maritime area) next to land at 200 m, with an openness to the ocean
#      (national.py expo, 500 m) of at most SHELTER, and water round it (at least 8 of the 25 cells within 400 m), at least SPACE km
#      from any other rorbu, picked in a fixed shuffled order so the coast is covered evenly
# Every rorbu stands at least APART km from every plant, tackle shop, yard (src/data/steder.json), Father's naust and other rorbu, so
# the choice of where to moor never comes up (docs/handelssteder.md «Plassering av stedene»).
# The point is a sea cell by the shore (km, the game's frame); the game finds the straight shore and the quay's line round it
# (07d-rorbu.js, as for Father's naust). The name is the nearest town or village in the chart packs (kind 0, within 6 km), else the
# nearest island, then water, else none. Writes src/data/rorbuer.json: {"r": [[x, y, kind, name], ...]}.
#   python3 tools/rorbu/rorbuer.py [release dir with the chart packs, default the newest tools/map/out/release/kart-*/game]
import os, sys, json, glob, re, zlib
import numpy as np
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import national
SHELTER, SPACE, NAMER = 0.3, 14.0, 6.0
APART, NEAR = 1.5, (1.5, 4.0)

# the receivers the game makes harbours of (06b-coastports.js, the same filter and the same 1.2 km groups)
WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe']
def places():
    # every plant's quay, the tackle shops and yards, Finnsnes' quay and Father's naust in Vangshamn (frame.py)
    import frame
    m = json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m']
    st = json.load(open(os.path.join(ROOT, 'src', 'data', 'steder.json')))['r']
    hx, hy = frame.to_nat(np.array([18.012]), np.array([69.4724]))
    return [(x['q'][0], x['q'][1]) for x in m if x.get('q')] + [(r[0], r[1]) for r in st] + [(56.058, 53.575), (float(hx[0]), float(hy[0]))]
def harbours():
    m = json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m']
    wf = lambda x: sum(((x['sp'].get(s) or [0])[0] or 0) for s in WF)
    conv = lambda x: sum(v for k, v in (x.get('gear') or {}).items() if re.search(r'Konv|Garn|Line|Jukse|Teine|Snurre', k))
    ok = sorted([x for x in m if x['t'] in ('Ordinært anlegg', 'Kaiselger') and x.get('q') and wf(x) >= 10000 and ((x.get('small') or 0) >= 0.05 or conv(x) >= 0.3)], key=lambda x: -wf(x))
    lead = []
    for x in ok:
        if not any(np.hypot(g['p'][0] - x['p'][0], g['p'][1] - x['p'][1]) < 1.2 for g in lead): lead.append(x)
    return [(x['q'][0], x['q'][1]) for x in lead]

# the place names of the chart packs: [(x, y km, kind, name)]
def names(rel):
    out = []
    for f in glob.glob(os.path.join(rel, 'chart-*.wasm')):
        d = open(f, 'rb').read(); hl = int.from_bytes(d[4:8], 'little'); h = json.loads(d[8:8 + hl]); body = d[8 + hl:]
        tx, ty = h['tile']
        for l, bx, by, o, ln, *c in h['blocks']:
            if l != 'names': continue
            b = body[o:o + ln]
            try: b = zlib.decompress(b, -15)
            except zlib.error: pass
            i = 0
            def vi():
                nonlocal i; v = s = 0
                while True:
                    x = b[i]; i += 1; v |= (x & 127) << s; s += 7
                    if x < 128: return v
            for _ in range(vi()):
                x = vi(); y = vi(); k = b[i]; i += 3; L = vi(); n = b[i:i + L].decode('utf-8'); i += L
                out.append((tx * 50 + x / 1000, ty * 50 + y / 1000, k, n))
    return out

def main(rel):
    M = national.mask200().astype(bool); NL, NS = national.norway200(); E = national.expo(); C = national.C200
    sea = ~M
    shore = sea & ndimage.binary_dilation(M, structure=np.ones((3, 3), bool))
    wet = ndimage.uniform_filter(sea.astype(np.float32), 5) * 25 >= 8
    iy, ix = np.nonzero(shore & NS & wet)
    px, py = (ix + 0.5) * C, (iy + 0.5) * C
    ey = np.clip((py / 0.5).astype(int), 0, E.shape[0] - 1); ex = np.clip((px / 0.5).astype(int), 0, E.shape[1] - 1)
    e = E[ey, ex] / 255
    keep = (e > 0) & (e <= SHELTER); px, py = px[keep], py[keep]
    print('sheltered shore cells', len(px), file=sys.stderr)
    H = harbours(); print('harbours', len(H), file=sys.stderr)
    P = np.array(places()); print('places to keep clear of', len(P), file=sys.stderr)
    # the sheltered shore cells clear of every place
    from scipy.spatial import cKDTree
    TP = cKDTree(P); dp, _ = TP.query(np.c_[px, py]); clear = dp >= APART; px, py, e = px[clear], py[clear], e[keep][clear]
    print('clear of the places', len(px), file=sys.stderr)
    TS = cKDTree(np.c_[px, py])
    G = {}   # grid of picked points
    def near(x, y, r):
        gx, gy = int(x // SPACE), int(y // SPACE)
        for i in range(gx - 1, gx + 2):
            for j in range(gy - 1, gy + 2):
                for q in G.get((i, j), ()):
                    if (q[0] - x) ** 2 + (q[1] - y) ** 2 < r * r: return True
        return False
    def add(x, y): G.setdefault((int(x // SPACE), int(y // SPACE)), []).append((x, y))
    # by each harbour: the most sheltered cell 1.5-4 km out, nearest 2.5 km first, clear of the other rorbuer
    pick = []
    for hx, hy in H:
        idx = TS.query_ball_point((hx, hy), NEAR[1]); best = None
        for k in idx:
            d = np.hypot(px[k] - hx, py[k] - hy)
            if d < NEAR[0] or near(px[k], py[k], APART): continue
            sc = e[k] + 0.04 * abs(d - 2.5)
            if best is None or sc < best[0]: best = (sc, k)
        if best: k = best[1]; pick.append((px[k], py[k], 0)); add(px[k], py[k])
    nh = len(pick)
    order = np.random.default_rng(20261005).permutation(len(px))
    for k in order:
        x, y = px[k], py[k]
        if near(x, y, SPACE): continue
        pick.append((x, y, 1)); add(x, y)
    print('rorbuer', len(pick), 'of them by harbours', nh, 'of', len(H), file=sys.stderr)
    # names
    N = names(rel); print('names', len(N), file=sys.stderr)
    NA = np.array([(a, b) for a, b, k, n in N]); NK = np.array([k for a, b, k, n in N])
    out = []
    for x, y, kind in pick:
        d = np.hypot(NA[:, 0] - x, NA[:, 1] - y); nm = None
        for want in (0, 2, 1):
            m = (NK == want) & (d < NAMER)
            if m.any(): nm = N[int(np.flatnonzero(m)[np.argmin(d[m])])][3]; break
        out.append([round(float(x), 3), round(float(y), 3), kind, nm])
    out.sort(key=lambda r: (r[1], r[0]))
    f = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
    json.dump({'made': 'tools/rorbu/rorbuer.py', 'shelter': SHELTER, 'space': SPACE, 'r': out}, open(f, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps({'file': f, 'n': len(out), 'harbour': sum(1 for r in out if r[2] == 0), 'named': sum(1 for r in out if r[3]), 'kb': round(os.path.getsize(f) / 1024)}))

if __name__ == '__main__':
    rel = sys.argv[1] if len(sys.argv) > 1 else sorted(glob.glob(os.path.join(ROOT, 'tools', 'map', 'out', 'release', 'kart-*', 'game')), key=lambda f: int(re.search(r'kart-(\d+)', f).group(1)))[-1]
    main(rel)
