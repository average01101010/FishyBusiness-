# The harbours of Senja's legacy square (L2/N1, 02.11.2026; Jonas: «Fiks sånn at Senja også har havner»): tools/map/npc.py leaves the
# square out of the packs (its fleet was the game's FLEET alone), so the square had no harbours for the register's boats. This runs
# npc.build on the four tiles over the square from the game's own packs (the sim layers mask and depth, the vec pack's quay faces), with
# the square let in, and keeps the harbours inside it: the same rule as the rest of the coast, without a new map release. flaate.py puts
# them in flaate.json (x: {"tx:ty": [harbour, ...]}, as npc.py writes them), and the game adds them after the pack's own (flaateApply).
#
#   python3 tools/npc/senja.py [game dir]   -> tools/npc/cache/senja.json (flaate.py reads it)
import os, sys, json, zlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import frame, npc, pack
OUTF = os.path.join(HERE, 'cache', 'senja.json')
LEGW, LEGH = 2 * frame.LEG['KX'], 0.74 * frame.LEG['KY']

def packs(game, tx, ty):
    man = json.load(open(os.path.join(game, 'manifest.json'))); out = {}
    for p in man['packs']:
        if tuple(p['tile']) != (tx, ty) or p['kind'] not in ('sim', 'vec'): continue
        data = open(os.path.join(game, p['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); at = 8 + hl
        for bl in head['blocks']: out.setdefault(bl[0], []).append((bl, zlib.decompress(data[at + bl[3]:at + bl[3] + bl[4]], -15)))
    return out

def layer(P, name, n, typ, tx, ty):
    A = np.zeros((5 * n, 5 * n), np.int32)
    for bl, raw in P.get(name, []):
        bx, by = bl[1] - tx * 5, bl[2] - ty * 5
        blk = pack.unmed16(raw, n) if typ == 'i16' else np.frombuffer(raw, np.uint8).reshape(n, n)
        A[by * n:(by + 1) * n, bx * n:(bx + 1) * n] = blk
    return A

def tiles():
    xs, ys = [], []
    for lx, ly in ((0, 0), (LEGW, 0), (0, LEGH), (LEGW, LEGH)):
        x, y = frame.to_nat(*frame.leg_to_ll(lx, ly)); xs.append(x); ys.append(y)
    return [(tx, ty) for tx in range(int(min(xs) // 50), int(max(xs) // 50) + 1) for ty in range(int(min(ys) // 50), int(max(ys) // 50) + 1)]

def main(game):
    npc.LEGW = -1; npc.CAP = 1000   # the square let in, and no cap on the tile's harbours (only the square's are kept)
    out = {}
    for tx, ty in tiles():
        P = packs(game, tx, ty)
        if 'quay' not in P: continue
        L = {'mask': layer(P, 'mask', 400, 'u8', tx, ty), 'depth': layer(P, 'depth', 200, 'i16', tx, ty)}
        qb = P['quay'][0]; d = npc.build(tx, ty, L, (qb[1], qb[0][5]))
        keep = []
        for h in d['h']:
            lon, lat = frame.to_ll((tx * 50000 + h['x']) / 1000, (ty * 50000 + h['z']) / 1000); lx, ly = frame.ll_to_leg(lon, lat)
            if 0 <= lx <= LEGW and 0 <= ly <= LEGH: keep.append(h)
        if keep: out[f'{tx}:{ty}'] = keep
        print(f'tile {tx},{ty}: {len(keep)} harbours in the square, {sum(len(h["b"]) for h in keep)} berths')
    os.makedirs(os.path.dirname(OUTF), exist_ok=True); json.dump(out, open(OUTF, 'w'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__': main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'map', 'out', 'game'))
