# The sea floor offshore over the whole frame (H1b R2 of the ocean step, 03.11.2026; first for the Greenland halibut, 07.10.2026). The
# coast's tiles end 40-65 km out, and beyond them depthF has only the game's model (never deeper than about 260 m), so the core has a
# layer 'deep': the depth on 1 km cells over the wide frame (frame.WIDE: East Greenland to Novaya Zemlya), in 10 m steps (dec 'x10',
# 0 is land or no data, at most 2 550 m), for the shelf edges, the banks of the Barents Sea (the trawl, the snow crab's pots) and the
# Norwegian Sea.
#   source  GEBCO 2025 (15 arc-seconds, about 460 m north-south; the GEBCO Compilation Group, free to use with the source named), its
#           two northern 90 x 90 degree GeoTIFF tiles, averaged over 3 x 3 points in each 1 km cell. Kartverket's 50 m model
#           (dybde.yml, the coast's tiles) wins where it has most of a 1 km cell. GEBCO is closed to the cloud session, so it is fetched
#           by .github/workflows/gebco.yml (tools/map/gebco.json) and kept as a release gebco-N; kart.json's 'gebco' names it.
#           Without it (a local run without the release), Terrarium z8 (ETOPO1 offshore) stands in, and the result says so.
#   python3 tools/map/deep.py gebco [out]      fetch GEBCO, write out/gebco/gebco1k.npz (the workflow)
#   python3 tools/map/deep.py layer            the layer as national.py ramme takes it (prints what it came from)
import os, sys, json, time, zipfile, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import frame
C = 1.0   # km
# where GEBCO 2025 is looked for: GEBCO's pages (the links to BODC's downloads) and Source Cooperative's cloud-optimised copy (its STAC
# catalogue); the links found are printed and tried in turn, a .tif read over HTTP ranges, a .zip downloaded whole
GEBCO_PAGES = ['https://www.gebco.net/data-products-gridded-bathymetry-data/gebco2025-grid', 'https://www.gebco.net/data-products/historical-data-sets',
               'https://www.gebco.net/gebco2025-grid', 'https://data.source.coop/cboettig/high-seas/gebco-2025/stac-collection.json',
               'https://data.source.coop/cboettig/high-seas/README.md']
GEBCO_URLS = ['https://www.bodc.ac.uk/data/open_download/gebco/gebco_2025/geotiff/', 'https://www.bodc.ac.uk/data/open_download/gebco/gebco_2025/zip/',
              'https://www.bodc.ac.uk/data/open_download/gebco/gebco_2025_sub_ice_topo/geotiff/']
GEBCO_TILES = {-90: 'n90.0_s0.0_w-90.0_e0.0', 0: 'n90.0_s0.0_w0.0_e90.0'}   # west edge -> the name's part; 240 pixels a degree
BOX = (-57.0, 52.5, 86.0, 85.0)   # lon/lat round frame.WIDE
GD = os.path.join(HERE, 'out', 'gebco')

def cells():
    x0, y0, x1, y1 = frame.WIDE; nx, ny = round((x1 - x0) / C), round((y1 - y0) / C)
    return x0, y0, nx, ny

# the 3 x 3 points in each cell of a band of rows, as lon/lat
def band_ll(j0, j1):
    x0, y0, nx, ny = cells(); o = (np.arange(3) + 0.5) / 3
    xs = (x0 + np.arange(nx)[:, None] * C + o[None, :] * C).ravel(); ys = (y0 + np.arange(j0, j1)[:, None] * C + o[None, :] * C).ravel()
    Y, X = np.meshgrid(ys, xs, indexing='ij'); return frame.to_ll(X, Y), (j1 - j0, nx)

# the mean depth (m, >= 0) of the 3 x 3 heights in each cell
def mean9(h, shape):
    ny, nx = shape; d = np.clip(-h, 0, None).reshape(ny, 3, nx, 3).mean(axis=(1, 3)); land = (h > 0).reshape(ny, 3, nx, 3).sum(axis=(1, 3)) >= 5
    return np.where(land, 0, d).astype(np.float32)

def gebco_links():
    import re, requests
    found = []
    for p in GEBCO_PAGES:
        try:
            r = requests.get(p, timeout=60); print('page', p, r.status_code, len(r.text), flush=True)
            if r.status_code != 200: continue
            base = p.rsplit('/', 1)[0] + '/'
            for h in re.findall(r'(?:href|"href")\s*[=:]\s*"([^"]+)"', r.text) + re.findall(r'https?://[^\s"\'<>)]+', r.text):
                if not h.startswith('http'): h = (requests.compat.urljoin(p, h))
                if re.search(r'gebco.?2025', h, re.I) and not re.search(r'tid|\.(png|jpe?g|pdf|html?)$', h, re.I): found.append(h)
        except Exception as e: print('page failed', p, repr(e)[:200], flush=True)
    found = list(dict.fromkeys(found)); print('links', json.dumps(found, indent=0), flush=True)
    tif = [h for h in found if h.lower().endswith(('.tif', '.tiff'))]; dl = [h for h in found if 'open_download' in h or h.lower().endswith('.zip')]
    return tif + dl + [u for u in GEBCO_URLS if u not in dl]

# a source as {west edge: (reader of rows r0..r1 and cols, pixels a degree, north edge)}
def gebco_open():
    import requests, rasterio
    from rasterio.windows import from_bounds
    os.makedirs(GD, exist_ok=True)
    for u in gebco_links():
        try:
            if u.lower().endswith(('.tif', '.tiff')):   # cloud-optimised: only the window
                ds = rasterio.open('/vsicurl/' + u); print('cog', u, ds.width, ds.height, ds.bounds, ds.dtypes, flush=True)
                w = from_bounds(BOX[0], BOX[1], BOX[2], BOX[3], ds.transform).round_offsets().round_lengths()
                A = ds.read(1, window=w); t = ds.window_transform(w); print('read', A.shape, flush=True)
                return [(A, t)], u
            z = os.path.join(GD, 'gebco.zip')
            with requests.get(u, stream=True, timeout=600) as r:
                print(u, r.status_code, r.headers.get('content-type'), r.headers.get('content-length'), flush=True)
                if r.status_code != 200 or 'html' in (r.headers.get('content-type') or ''): continue
                with open(z + '.part', 'wb') as o:
                    for c in r.iter_content(1 << 22): o.write(c)
            os.replace(z + '.part', z); zf = zipfile.ZipFile(z); names = zf.namelist(); print('zip', os.path.getsize(z), names, flush=True); out = []
            for part in GEBCO_TILES.values():
                m = [n for n in names if part in n and n.lower().endswith(('.tif', '.tiff'))]
                if not m: break
                f = zf.extract(m[0], GD); ds = rasterio.open(f); w = from_bounds(max(BOX[0], ds.bounds.left), BOX[1], min(BOX[2], ds.bounds.right), BOX[3], ds.transform).round_offsets().round_lengths()
                out.append((ds.read(1, window=w), ds.window_transform(w)))
            os.remove(z)
            if len(out) == 2: return out, u
        except Exception as e: print('failed', u, repr(e)[:300], flush=True)
    sys.exit('GEBCO 2025 was not found')

def gebco_layer():
    T, used = gebco_open(); x0, y0, nx, ny = cells(); D = np.zeros((ny, nx), np.float32); t0 = time.time()
    for j0 in range(0, ny, 100):
        j1 = min(ny, j0 + 100); (lon, lat), sh = band_ll(j0, j1); lon = lon.ravel(); lat = lat.ravel(); h = np.zeros(lon.size, np.float32)
        for A, t in T:
            c = np.floor((lon - t.c) / t.a).astype(int); r = np.floor((lat - t.f) / t.e).astype(int); m = (c >= 0) & (r >= 0) & (c < A.shape[1]) & (r < A.shape[0])
            h[m] = A[r[m], c[m]]
        D[j0:j1] = mean9(h, sh)
        if j0 % 500 == 0: print('rows', j0, j1, 'deepest', int(D[j0:j1].max()), round(time.time() - t0), 's', flush=True)
    np.savez_compressed(os.path.join(GD, 'gebco1k.npz'), d=D, src=np.array('GEBCO 2025 Grid (GEBCO Compilation Group 2025), ' + used))
    print(json.dumps({'cells': [nx, ny], 'sea': int((D > 0).sum()), 'deepest': float(D.max()), 'over500m': int((D >= 500).sum()), 'src': used}))

# the stand-in: Terrarium z8 (ETOPO1 offshore)
def terrarium_layer():
    import terrain
    x0, y0, nx, ny = cells(); D = np.zeros((ny, nx), np.float32)
    for j0 in range(0, ny, 100):
        j1 = min(ny, j0 + 100); (lon, lat), sh = band_ll(j0, j1); D[j0:j1] = mean9(terrain.sample(lon.ravel(), lat.ravel(), 8), sh)
    return D

# Kartverket's 50 m depth (the dybde- release kart.yml unpacks to out/depth/, the coast's tiles) on the 1 km cells it has most of
def kartverket(D):
    x0, y0, nx, ny = cells(); dd = os.path.join(HERE, 'out', 'depth'); n = 0
    if not os.path.isdir(dd): return 0
    for f in os.listdir(dd):
        if not f.endswith('.npz'): continue
        tx, ty = map(int, f[:-4].split('_')); z = np.load(os.path.join(dd, f))['z']
        if z.shape != (1000, 1000): continue
        ok = (z != -32768) & (z != 0); d = np.where(ok, np.maximum(-z.astype(np.float32) / 10, 0), 0)
        cnt = ok.reshape(50, 20, 50, 20).sum(axis=(1, 3)); s = d.reshape(50, 20, 50, 20).sum(axis=(1, 3)); m = cnt >= 200
        j = round(ty * 50 - y0); i = round(tx * 50 - x0)
        if j < 0 or i < 0 or j + 50 > ny or i + 50 > nx: continue
        sub = D[j:j + 50, i:i + 50]; sub[m] = s[m] / cnt[m]; n += int(m.sum())
    return n

def layer():
    f = os.path.join(GD, 'gebco1k.npz')
    if os.path.exists(f): z = np.load(f); D = z['d'].astype(np.float32); src = str(z['src'])
    else: D = terrarium_layer(); src = 'Terrarium z8 (ETOPO1 offshore): stand-in, no gebco- release in out/gebco/'
    x0, y0, nx, ny = cells(); assert D.shape == (ny, nx), (D.shape, ny, nx)
    kv = kartverket(D)
    out = np.where(D > 0.5, np.clip(np.ceil(D / 10), 1, 255), 0).astype(np.uint8)
    print(json.dumps({'deep': src, 'kartverketCells': kv, 'sea': int((out > 0).sum()), 'over500m': int((out >= 50).sum())}), file=sys.stderr, flush=True)
    return out, src

if __name__ == '__main__':
    if sys.argv[1] == 'gebco': gebco_layer()
    elif sys.argv[1] == 'layer': a, s = layer(); print(json.dumps({'src': s, 'shape': list(a.shape)}))
