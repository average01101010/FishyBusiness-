# The satellites' layers (sy, sco, scg; coast.sat_tile) and the trees (trees; coast.trees_tile) into a built game dir's view packs, for the tiles given (a local trial before the
# map release has them): python3 tools/s2/inject.py tools/map/out/game tx,ty [...]   (the mosaics in tools/map/out/s2/<tx>_<ty>.npz)
import os, sys, json, hashlib, numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'map'))
import coast
from pack import raw_deflate, med16
from frame import BLOCK
def inject(d, tiles):
    mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp)); C = man['layers']['cover']; n = C['n']
    man['layers']['sy'] = dict(C, type='i16', dec='raw'); man['layers']['trees'] = dict(C)
    for k in ('sco', 'scg'): man['layers'][k] = dict(C, type='i16', dec='raw', c=C['c'] * 2, ix0=C['ix0'] // 2, iy0=C['iy0'] // 2, nx=C['nx'] // 2, ny=C['ny'] // 2, n=n // 2)
    for pk in man['packs']:
        if pk['kind'] != 'view' or tuple(pk['tile']) not in tiles: continue
        tx, ty = pk['tile']; L = coast.tile(tx, ty); S = dict(coast.sat_tile(tx, ty, L), **coast.trees_tile(tx, ty, L))
        data = open(os.path.join(d, pk['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); body = data[8 + hl:]
        blocks, parts, off = [], [], 0
        for l, bx, by, o, ln, *cnt in head['blocks']:
            if l in S or l in ('sr', 'sg', 'sb'): continue
            blocks.append([l, bx, by, off, ln] + cnt); parts.append(body[o:o + ln]); off += ln
        T = 50 // round(n * C['c']); bx0, by0 = tx * T, ty * T
        for l, arr in S.items():
            m = man['layers'][l]['n']
            for j in range(T):
                for i in range(T):
                    blk = arr[j * m:(j + 1) * m, i * m:(i + 1) * m]; z = raw_deflate(med16(blk) if blk.dtype == np.int16 else np.ascontiguousarray(blk).tobytes()); blocks.append([l, bx0 + i, by0 + j, off, len(z)]); parts.append(z); off += len(z)
        head['blocks'] = blocks; hj = json.dumps(head, separators=(',', ':')).encode()
        o2 = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(parts); h = hashlib.sha256(o2).hexdigest()[:12]; fn = f'view-{tx}-{ty}-{h}.wasm'
        if fn != pk['file']: open(os.path.join(d, fn), 'wb').write(o2); os.remove(os.path.join(d, pk['file']))
        pk.update(file=fn, hash=h, bytes=len(o2)); print(json.dumps({'tile': [tx, ty], 'kb': round(sum(len(p) for p in parts[-3 * T * T:]) / 1000, 1)}), flush=True)
    json.dump(man, open(mp, 'w'), separators=(',', ':'))
if __name__ == '__main__': inject(sys.argv[1], {tuple(map(int, a.split(','))) for a in sys.argv[2:]})
