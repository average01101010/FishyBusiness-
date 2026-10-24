# The Senja rasters of the legacy frame (src/data/*.b64, decoded by tools/mappack.mjs's readSenja, the page's own arithmetic) that
# the pipeline still takes as they are: Kartverket's 50 m depth (until Geonorge is open to the pipeline) and the openness to the
# ocean (until the national one replaces it). They are read bilinearly at the national cells' centres.
import os, json, subprocess, numpy as np
from frame import to_ll, ll_to_leg
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache', 'legacy')
JS = """import('%s/tools/mappack.mjs').then(m => { const L = m.readSenja('%s/src/data'), fs = require('fs'), out = {};
  for (const k of ['depth', 'expo', 'mask']){ const a = L[k]; fs.writeFileSync('%s/' + k + '.bin', Buffer.from(a.arr.buffer, a.arr.byteOffset, a.arr.byteLength)); out[k] = {c:a.c, nx:a.nx, ny:a.ny, type:a.type}; }
  fs.writeFileSync('%s/meta.json', JSON.stringify(out)); });"""
def load():
    if not os.path.exists(os.path.join(CACHE, 'meta.json')):
        os.makedirs(CACHE, exist_ok=True); subprocess.run(['node', '-e', JS % (ROOT, ROOT, CACHE, CACHE)], check=True)
    meta = json.load(open(os.path.join(CACHE, 'meta.json'))); out = {}
    for k, m in meta.items():
        a = np.fromfile(os.path.join(CACHE, k + '.bin'), {'i16': np.int16, 'u8': np.uint8, 'f32': np.float32}[m['type']]).reshape(m['ny'], m['nx'])
        out[k] = dict(m, arr=a)
    return out
# a legacy layer read at national points (km): bilinear between cell centres, clamped at the legacy square's edge
def at(L, x, y, how='bilinear'):
    lon, lat = to_ll(x, y); lx, ly = ll_to_leg(lon, lat); a = L['arr'].astype(np.float32); c = L['c']
    if how == 'nearest':
        return a[np.clip(np.floor(ly / c).astype(int), 0, L['ny'] - 1), np.clip(np.floor(lx / c).astype(int), 0, L['nx'] - 1)]
    gx = np.clip(lx / c - 0.5, 0, L['nx'] - 1.001); gy = np.clip(ly / c - 0.5, 0, L['ny'] - 1.001)
    ix = gx.astype(int); iy = gy.astype(int); fx = gx - ix; fy = gy - iy
    return (a[iy, ix] * (1 - fx) + a[iy, ix + 1] * fx) * (1 - fy) + (a[iy + 1, ix] * (1 - fx) + a[iy + 1, ix + 1] * fx) * fy
