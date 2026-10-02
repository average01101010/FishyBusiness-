# The game's map packs (the format of src/js/core/01b-mapdata.js): 'KMP1', u32 header length, the header as JSON
# ({kind, tile, blocks:[[layer, bx, by, offset, length], ...]}), and the blocks, each deflated (raw) on its own. 16-bit blocks go as
# the residual of the median predictor (left, up, up-left), zigzagged, low bytes then high bytes. The file name carries the first
# 12 hex of the pack's SHA-256 (.wasm, which the artifact takes). manifest.json lists the layers and the packs.
import os, json, zlib, hashlib, shutil, numpy as np
from frame import BLOCK, TILE
DT = {'u8': np.uint8, 'i16': np.int16, 'f32': np.float32}
def med16(q):
    q = q.astype(np.int32); n = q.shape[0]
    a = np.zeros_like(q); a[:, 1:] = q[:, :-1]
    b = np.zeros_like(q); b[1:, :] = q[:-1, :]
    c = np.zeros_like(q); c[1:, 1:] = q[:-1, :-1]
    pr = np.where(c >= np.maximum(a, b), np.minimum(a, b), np.where(c <= np.minimum(a, b), np.maximum(a, b), a + b - c))
    d = q - pr; z = ((d << 1) ^ (d >> 31)) & 0xffff
    return np.concatenate([(z & 255).astype(np.uint8).ravel(), (z >> 8).astype(np.uint8).ravel()]).tobytes()
def raw_deflate(b): co = zlib.compressobj(9, zlib.DEFLATED, -15); return co.compress(b) + co.flush()
# layers: {name: {c, ix0, iy0, nx, ny, type, kind, dec, arr (ny x nx)}}, all over whole blocks; vec: [(kind, (tx, ty), name, bytes, count)],
# vector entries (vectors.py, chart.py) at the tile's first block, with the count as a sixth field
def write(layers, out, extra=None, vec=()):
    if os.path.exists(out): shutil.rmtree(out)
    os.makedirs(out)
    man = dict(v=2, frame='utm33', block=BLOCK, tile=TILE, layers={}, packs=[], **(extra or {}))
    groups = {}; T = TILE // BLOCK
    for name, L in layers.items():
        n = L.get('n') or round(BLOCK / L['c']); assert L['ix0'] % n == 0 and L['iy0'] % n == 0 and L['nx'] % n == 0 and L['ny'] % n == 0, name
        man['layers'][name] = dict(c=L['c'], ix0=L['ix0'], iy0=L['iy0'], nx=L['nx'], ny=L['ny'], n=n, type=L['type'], kind=L['kind'], dec=L.get('dec'))
        arr = np.asarray(L['arr']).astype(DT[L['type']])
        for j in range(L['ny'] // n):
            for i in range(L['nx'] // n):
                bx, by = L['ix0'] // n + i, L['iy0'] // n + j; blk = arr[j * n:(j + 1) * n, i * n:(i + 1) * n]
                raw = med16(blk) if L['type'] == 'i16' else np.ascontiguousarray(blk).tobytes()
                tile = (0, 0) if L['kind'] == 'core' else (bx // T, by // T); k = (L['kind'], tile)
                groups.setdefault(k, []).append([name, bx, by, raw_deflate(raw)])
    for kind, (tx, ty), name, b, cnt in vec: groups.setdefault((kind, (tx, ty)), []).append([name, tx * T, ty * T, raw_deflate(b), cnt])
    total = 0
    for (kind, tile), blocks in sorted(groups.items()):
        off = 0; head = {'kind': kind, 'tile': list(tile), 'blocks': []}
        for l, bx, by, z, *cnt in blocks: head['blocks'].append([l, bx, by, off, len(z)] + cnt); off += len(z)
        hj = json.dumps(head, separators=(',', ':')).encode()
        data = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(b[3] for b in blocks)
        h = hashlib.sha256(data).hexdigest()[:12]; fn = f'{kind}-{tile[0]}-{tile[1]}-{h}.wasm'
        open(os.path.join(out, fn), 'wb').write(data); total += len(data)
        box = None if kind == 'core' else [tile[0] * TILE, tile[1] * TILE, (tile[0] + 1) * TILE, (tile[1] + 1) * TILE]
        man['packs'].append(dict(file=fn, hash=h, kind=kind, tile=list(tile), box=box, bytes=len(data)))
    man['packs'].sort(key=lambda p: p['file'])
    json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), separators=(',', ':'))
    return len(man['packs']), total
# a layer read back from packs (for the checks): the whole extent as one array
def unmed16(b, n):
    z = np.frombuffer(b, np.uint8); z = (z[:n * n].astype(np.int32) | (z[n * n:].astype(np.int32) << 8)).reshape(n, n); d = (z >> 1) ^ -(z & 1)
    q = np.zeros((n, n), np.int32)
    for r in range(n):
        for c in range(n):
            a = q[r, c - 1] if c else 0; bb = q[r - 1, c] if r else 0; cc = q[r - 1, c - 1] if r and c else 0
            pr = min(a, bb) if cc >= max(a, bb) else max(a, bb) if cc <= min(a, bb) else a + bb - cc; q[r, c] = pr + d[r, c]
    return q
def read_layer(d, name):
    man = json.load(open(os.path.join(d, 'manifest.json'))); L = man['layers'][name]; n = L['n']
    out = np.zeros((L['ny'], L['nx']), np.float32 if L['type'] == 'f32' else np.int32)
    for p in man['packs']:
        data = open(os.path.join(d, p['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); at = 8 + hl
        for l, bx, by, off, ln, *_ in head['blocks']:
            if l != name: continue
            raw = zlib.decompress(data[at + off:at + off + ln], -15)
            blk = unmed16(raw, n) if L['type'] == 'i16' else np.frombuffer(raw, DT[L['type']]).reshape(n, n)
            j, i = by * n - L['iy0'], bx * n - L['ix0']; out[j:j + n, i:i + n] = blk
    return out, L
# the coast's tiles: [(tx, ty, {layer: array over the 50 km tile})], every kind a pack per tile (the core too); the layers' extents
# are the whole frame, and the manifest lists the tiles there are (a block outside them has no pack)
def write_tiles(tiles, spec, out, extra=None):
    if os.path.exists(out): shutil.rmtree(out)
    os.makedirs(out)
    man = dict(v=2, frame='utm33', block=BLOCK, tile=TILE, layers={}, packs=[], tiles=[[t[0], t[1]] for t in tiles], **(extra or {}))
    for name, (c, typ, kind, dec) in spec.items():
        n = round(BLOCK / c); man['layers'][name] = dict(c=c, ix0=0, iy0=0, nx=round(1450 / c), ny=round(1720 / c), n=n, type=typ, kind=kind, dec=dec)
    total = 0; T = TILE // BLOCK
    for tx, ty, L, *V in tiles:
        groups = {}
        # the vector layers (vectors.py): one entry each, at the tile's first block, with its count as a sixth field
        for name, (b, cnt) in (V[0].items() if V else []): groups.setdefault('vec', []).append([name, tx * T, ty * T, raw_deflate(b), cnt])
        for name, (c, typ, kind, dec) in spec.items():
            n = round(BLOCK / c); arr = np.asarray(L[name]).astype(DT[typ])
            for j in range(T):
                for i in range(T):
                    blk = arr[j * n:(j + 1) * n, i * n:(i + 1) * n]; raw = med16(blk) if typ == 'i16' else np.ascontiguousarray(blk).tobytes()
                    groups.setdefault(kind, []).append([name, tx * T + i, ty * T + j, raw_deflate(raw)])
        for kind, blocks in sorted(groups.items()):
            off = 0; head = {'kind': kind, 'tile': [tx, ty], 'blocks': []}
            for l, bx, by, z, *cnt in blocks: head['blocks'].append([l, bx, by, off, len(z)] + cnt); off += len(z)
            hj = json.dumps(head, separators=(',', ':')).encode(); data = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(b[3] for b in blocks)
            h = hashlib.sha256(data).hexdigest()[:12]; fn = f'{kind}-{tx}-{ty}-{h}.wasm'; open(os.path.join(out, fn), 'wb').write(data); total += len(data)
            man['packs'].append(dict(file=fn, hash=h, kind=kind, tile=[tx, ty], box=[tx * TILE, ty * TILE, (tx + 1) * TILE, (ty + 1) * TILE], bytes=len(data)))
    man['packs'].sort(key=lambda p: p['file'])
    json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), separators=(',', ':'))
    return len(man['packs']), total
