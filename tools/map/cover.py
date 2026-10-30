# The land cover classes ('cover', region.cover: ESA WorldCover, OpenStreetMap's natural areas and land use, a class per 50 m cell) written
# into the 'view' packs of a map dir made by region.py, without making the rest again (G1 of docs/planer/grafikk-natur-og-miljo.md;
# deep.py adds 'deep' to the core the same way). The layer has the forest layer's cells; the packs' names and the manifest change.
# Run it again after region.py has written new view packs (region.py now writes 'cover' itself).
#   python3 tools/map/cover.py [region] [map dir]
import os, sys, json, hashlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import frame
from region import cover_box, COVER
from pack import raw_deflate

def main(rname, d):
    mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp)); F = man['layers']['forest']; n = F['n']
    R = frame.REGIONS[rname]; box = R.lonlat_box()
    C = cover_box(box, F['c'], F['ix0'], F['iy0'], F['nx'], F['ny'])
    T = man['tile']; bk = round(n * F['c'])
    per = {}
    for j in range(F['ny'] // n):
        for i in range(F['nx'] // n):
            bx, by = F['ix0'] // n + i, F['iy0'] // n + j
            per.setdefault((bx * bk // T, by * bk // T), []).append((bx, by, raw_deflate(np.ascontiguousarray(C[j * n:(j + 1) * n, i * n:(i + 1) * n]).tobytes())))
    done = 0
    for pk in man['packs']:
        if pk['kind'] != 'view' or tuple(pk['tile']) not in per: continue
        data = open(os.path.join(d, pk['file']), 'rb').read(); assert data[:4] == b'KMP1'
        hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); body = data[8 + hl:]
        blocks, parts, off = [], [], 0
        for l, bx, by, o, ln, *cnt in head['blocks']:
            if l == 'cover': continue
            blocks.append([l, bx, by, off, ln] + cnt); parts.append(body[o:o + ln]); off += ln
        for bx, by, z in per[tuple(pk['tile'])]: blocks.append(['cover', bx, by, off, len(z)]); parts.append(z); off += len(z)
        head['blocks'] = blocks; hj = json.dumps(head, separators=(',', ':')).encode()
        out = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(parts); h = hashlib.sha256(out).hexdigest()[:12]
        fn = f"view-{pk['tile'][0]}-{pk['tile'][1]}-{h}.wasm"
        if fn != pk['file']: open(os.path.join(d, fn), 'wb').write(out); os.remove(os.path.join(d, pk['file']))
        pk.update(file=fn, hash=h, bytes=len(out)); done += 1
    man['layers']['cover'] = dict(F, type='u8', kind='view', dec=None)
    json.dump(man, open(mp, 'w'), separators=(',', ':'))
    land = C > 0; cnt = np.bincount(C.ravel(), minlength=len(COVER) + 1)
    print(json.dumps({'packs': done, 'cells': int(land.sum()), 'share': {k: round(float(cnt[i + 1] / max(1, land.sum())), 3) for i, k in enumerate(COVER)}}))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'senja', sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', '..', 'src', 'data', 'map'))
