# A summer mosaic of Sentinel-2 per game tile (G3 of docs/planer/grafikk-natur-og-miljo.md): the ground's colour as the satellites see it
# from mid June to August, without clouds, cloud shadows or snow, on the tile's 50 m cells in the game's frame (UTM 33, coast.py).
# From the L2A scenes Element 84 keeps open on AWS (s3://sentinel-cogs, Cloud-Optimised GeoTIFFs, read over HTTPS without an account).
# Licence: the Copernicus Sentinel data are free for any use, commercial too, with the source given: «Contains modified Copernicus
# Sentinel data 2021-2025» (Commission Delegated Regulation (EU) No 1159/2013).
#   the scenes: those of the MGRS squares (100 km) over the tile, 15 June to 31 August 2021-2025, under 60 % cloud (the scene's json),
#   the clearest MAXS per square; each warped to the tile's grid (GDAL picks the overview: 40 m for 50 m cells), the true colour (TCI)
#   averaged, the classification (SCL) by its nearest. A cell counts where SCL says vegetation (4), bare ground (5), water (6) or
#   unclassified (7); clouds (8, 9, 10), cloud shadows (3), snow (11), dark or topographic shadow (2) and no data (0, 1) do not.
#   The colour is the median of the scenes that count (n of them); a cell none counts is 0.
#   python3 tools/s2/s2.py tile tx,ty [...]     an .npz per tile in tools/s2/out/tiles (rgb 1000 x 1000 x 3 u8, rows north to south; n)
#   python3 tools/s2/s2.py part k K             the k-th of K shares of the tiles in tools/map/dybde.json (the coast's 168), for s2.yml
import os, sys, json, time, re, urllib.request, urllib.parse, numpy as np
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR'); os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '4'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '2')
os.environ.setdefault('VSI_CACHE', 'TRUE')
if os.path.exists('/root/.ccr/ca-bundle.crt'): os.environ.setdefault('CURL_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
import rasterio, mgrs
from rasterio.vrt import WarpedVRT
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from pyproj import Transformer
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out', 'tiles'); os.makedirs(OUT, exist_ok=True)
S3 = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/'; ROOT = 'sentinel-s2-l2a-cogs/'
YEARS = (2021, 2022, 2023, 2024, 2025); MAXS = 14; GOOD = np.array([4, 5, 6, 7]); TILE = 50000; CELL = 50

def ls(prefix):
    out, tok = [], None
    while True:
        u = S3 + '?list-type=2&delimiter=/&prefix=' + prefix + ('&continuation-token=' + urllib.parse.quote(tok) if tok else '')
        for k in range(4):
            try: x = urllib.request.urlopen(u, timeout=60).read().decode(); break
            except Exception:
                if k == 3: raise
                time.sleep(2 ** k)
        out += re.findall(r'<Prefix>([^<]+)</Prefix>', x)[1:]
        m = re.search(r'<NextContinuationToken>([^<]+)</NextContinuationToken>', x)
        if not m: return out
        tok = m.group(1)

SQC = {}
def scenes(sq):
    if sq in SQC: return SQC[sq]
    z, b, s = sq[:2], sq[2], sq[3:]; got = []
    for y in YEARS:
        for mo in (6, 7, 8):
            for p in ls(f'{ROOT}{int(z)}/{b}/{s}/{y}/{mo}/'):
                name = p.rstrip('/').split('/')[-1]; d = int(name.split('_')[2][6:8])
                if mo == 6 and d < 15: continue
                try: j = json.load(urllib.request.urlopen(S3 + p + name + '.json', timeout=60))
                except Exception: continue
                cc = j['properties'].get('eo:cloud_cover', 100); nd = j['properties'].get('s2:nodata_pixel_percentage', 0)
                if cc < 60 and nd < 90: got.append((cc + nd * 0.3, p))
    got.sort(); SQC[sq] = [p for _, p in got[:MAXS]]; return SQC[sq]

# the MGRS squares over a tile: its 50 m grid sampled every 5 km
LL = Transformer.from_crs(32633, 4326, always_xy=True); MG = mgrs.MGRS()
def squares(tx, ty):
    E0, N1 = tx * TILE - 250000, 8050000 - ty * TILE; out = set()
    for i in range(11):
        for j in range(11):
            lon, lat = LL.transform(E0 + i * 5000, N1 - j * 5000); out.add(MG.toMGRS(lat, lon, MGRSPrecision=0))
    return sorted(out)

def tile(tx, ty):
    t0 = time.time(); E0, N1 = tx * TILE - 250000, 8050000 - ty * TILE; n = TILE // CELL
    tr = from_origin(E0, N1, CELL, CELL); S = []
    for sq in squares(tx, ty): S += scenes(sq)
    rgbs, oks = [], []
    for p in S:
        try:
            with rasterio.open('/vsicurl/' + S3 + p + 'TCI.tif') as src, WarpedVRT(src, crs='EPSG:32633', transform=tr, width=n, height=n, resampling=Resampling.average) as v:
                a = v.read()
            if not a.any(): continue
            with rasterio.open('/vsicurl/' + S3 + p + 'SCL.tif') as src, WarpedVRT(src, crs='EPSG:32633', transform=tr, width=n, height=n, resampling=Resampling.nearest) as v:
                c = v.read(1)
        except Exception as e:
            print('  skip', p[-30:], str(e)[:80], flush=True); continue
        ok = np.isin(c, GOOD) & (a.sum(0) > 0)
        if ok.any(): rgbs.append(a.transpose(1, 2, 0)); oks.append(ok)
    rgb = np.zeros((n, n, 3), np.uint8); cnt = np.zeros((n, n), np.uint8)
    if rgbs:
        for r0 in range(0, n, 100):   # the median in strips (14 scenes per square, up to 4 squares)
            st = np.stack([q[r0:r0 + 100] for q in rgbs]).astype(np.float32); ok = np.stack([q[r0:r0 + 100] for q in oks])
            st[~ok] = np.nan
            with np.errstate(all='ignore'): m = np.nanmedian(st, axis=0)
            rgb[r0:r0 + 100] = np.nan_to_num(m).clip(0, 255).astype(np.uint8); cnt[r0:r0 + 100] = ok.sum(0)
    np.savez_compressed(os.path.join(OUT, f'{tx}_{ty}.npz'), rgb=rgb, n=cnt)
    print(json.dumps({'tile': [tx, ty], 'squares': squares(tx, ty), 'scenes': len(rgbs), 'covered': round(float((cnt > 0).mean()), 3), 's': round(time.time() - t0)}), flush=True)

if __name__ == '__main__':
    if sys.argv[1] == 'tile':
        for a in sys.argv[2:]: tile(*map(int, a.split(',')))
    elif sys.argv[1] == 'part':
        k, K = int(sys.argv[2]), int(sys.argv[3]); T = json.load(open(os.path.join(HERE, '..', 'map', 'dybde.json')))['tiles']
        for i, (tx, ty) in enumerate(T):
            if i % K == k and not os.path.exists(os.path.join(OUT, f'{tx}_{ty}.npz')): tile(tx, ty)
