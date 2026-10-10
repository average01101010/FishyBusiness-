# The sea floor offshore, for the whole frame (blåkveite, 07.10.2026). The coast's tiles end 40-65 km out, and beyond them depthF had
# only the game's model (openness and the distance to the shore, never deeper than about 260 m), so the shelf edge at 500-1000 m was
# missing off Lofoten, Vesterålen, Tromsøflaket and Finnmark, where the Greenland halibut is. This adds a core layer 'deep': the depth
# on 1 km cells from Terrarium's sea floor (ETOPO1 offshore, about 1.8 km; z7 is 400 m at 70° N), in 10 m steps (u8, dec 'x10';
# 0 is land or no data), and writes it into the core pack in src/data/map: the pack's name and the manifest change, and
# tools/map/game.py takes the new core for the whole coast. Run it again after region.py has written a new core.
#   python3 tools/map/deep.py [map dir]
import os, sys, json, hashlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import frame, terrain
from pack import raw_deflate
C, N = 1.0, 50   # cell (km) and block (cells): blocks of 50 km, the core's whole frame in 29 x 35 of them

def layer(nx, ny):
    xs = (np.arange(nx) + 0.5) * C; ys = (np.arange(ny) + 0.5) * C
    out = np.zeros((ny, nx), np.uint8)
    for j0 in range(0, ny, 250):   # in bands, so Terrarium's stitched grid stays small
        Y, X = np.meshgrid(ys[j0:j0 + 250], xs, indexing='ij')
        lon, lat = frame.to_ll(X, Y)
        h = terrain.sample(lon.ravel(), lat.ravel(), 7).reshape(X.shape)
        d = np.clip(-h, 0, None)
        out[j0:j0 + 250] = np.where(d > 0.5, np.clip(np.ceil(d / 10), 1, 255), 0).astype(np.uint8)
        print('rows', j0, 'to', j0 + X.shape[0], 'deepest', int(d.max()), flush=True)
    return out

def main(d):
    mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp))
    L0 = man['layers']['land200']; nx, ny = round(L0['nx'] * L0['c'] / C), round(L0['ny'] * L0['c'] / C)
    assert nx % N == 0 and ny % N == 0, (nx, ny)
    arr = layer(nx, ny)
    core = [p for p in man['packs'] if p['kind'] == 'core']; assert len(core) == 1; pk = core[0]
    data = open(os.path.join(d, pk['file']), 'rb').read(); assert data[:4] == b'KMP1'
    hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); body = data[8 + hl:]
    # the blocks the pack has, without an older 'deep', then the new ones
    blocks, parts, off = [], [], 0
    for l, bx, by, o, ln, *cnt in head['blocks']:
        if l == 'deep': continue
        blocks.append([l, bx, by, off, ln] + cnt); parts.append(body[o:o + ln]); off += ln
    for j in range(ny // N):
        for i in range(nx // N):
            z = raw_deflate(np.ascontiguousarray(arr[j * N:(j + 1) * N, i * N:(i + 1) * N]).tobytes())
            blocks.append(['deep', i, j, off, len(z)]); parts.append(z); off += len(z)
    head['blocks'] = blocks; hj = json.dumps(head, separators=(',', ':')).encode()
    out = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(parts); h = hashlib.sha256(out).hexdigest()[:12]
    fn = f"core-{pk['tile'][0]}-{pk['tile'][1]}-{h}.wasm"
    if fn != pk['file']:
        open(os.path.join(d, fn), 'wb').write(out); os.remove(os.path.join(d, pk['file']))
    pk.update(file=fn, hash=h, bytes=len(out))
    man['layers']['deep'] = dict(c=C, ix0=0, iy0=0, nx=nx, ny=ny, n=N, type='u8', kind='core', dec='x10')
    json.dump(man, open(mp, 'w'), separators=(',', ':'))
    print(json.dumps({'core': fn, 'bytes': len(out), 'was': len(data), 'cells': [nx, ny], 'sea': int((arr > 0).sum()), 'over500m': int((arr >= 50).sum())}))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), '..', 'src', 'data', 'map'))
