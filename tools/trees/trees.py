# The trees per game tile (G4 of docs/planer/grafikk-natur-og-miljo.md): how much of each 25 m cell is under trees, how tall they are,
# and whether they carry needles or leaves, as one u8 layer 'trees' in the view packs (coast.py trees_tile).
#   cover and height: Meta and WRI's canopy height maps v2 (CC BY 4.0, s3://dataforgood-fb-data/forests/v2/global/dinov3_global_chm_v2_ml3,
#     1 m, Web Mercator tiles named by quadkey), read at their overview of about 9.6 m (GDAL picks it), warped to the tile's 25 m grid in
#     UTM 33: the share of the 9.6 m cells over 2.5 m (trees) and the mean height of those.
#   leaf type: the summer near infrared of Sentinel-2 (tools/s2/s2.py nir, 50 m): broad leaves reflect about twice what needles do; a
#     cell with trees is needles where the near infrared is under NIR_CONIFER.
#   packing: bits 0-3 the cover (0-15, /15), bits 4-6 the height (0-7: under 4, 4-8, ... 28 m and over), bit 7 needles. 0: no trees.
# Licence and source to give: «Canopy height: Meta and World Resources Institute (2024), CC BY 4.0»; «Contains modified Copernicus
# Sentinel data 2021-2025».
#   python3 tools/trees/trees.py tile tx,ty [...]      an .npz per tile in tools/trees/out/tiles (cover, height, nir-based needles)
#   python3 tools/trees/trees.py part k K               the k-th of K shares of the coast's tiles (tools/map/dybde.json), for trees.yml
import os, sys, json, time, numpy as np
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR'); os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '4'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '2')
if os.path.exists('/root/.ccr/ca-bundle.crt'): os.environ.setdefault('CURL_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
import rasterio
from rasterio.vrt import WarpedVRT
from rasterio.enums import Resampling
from rasterio.transform import from_origin
from pyproj import Transformer
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out', 'tiles'); os.makedirs(OUT, exist_ok=True)
CHM = 'https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/'
TILE = 50000; CELL = 25; TREE_H = 2.5

# the quadkeys (zoom from the index: 10 digits) of the canopy tiles over a game tile, from the corners and the middle in lon/lat
LL = Transformer.from_crs(32633, 4326, always_xy=True)
def quadkey(lon, lat, z):
    import math
    x = (lon + 180) / 360; s = math.sin(math.radians(lat)); y = 0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)
    X, Y = int(x * 2 ** z), int(y * 2 ** z); q = ''
    for i in range(z, 0, -1):
        d = 0; m = 1 << (i - 1)
        if X & m: d += 1
        if Y & m: d += 2
        q += str(d)
    return q
def quads(tx, ty, z=10):
    E0, N1 = tx * TILE - 250000, 8050000 - ty * TILE; out = set()
    for i in range(6):
        for j in range(6):
            lon, lat = LL.transform(E0 + i * 10000, N1 - j * 10000); out.add(quadkey(lon, lat, z))
    return sorted(out)

def tile(tx, ty):
    t0 = time.time(); E0, N1 = tx * TILE - 250000, 8050000 - ty * TILE; n = TILE // CELL; tr = from_origin(E0, N1, CELL, CELL)
    cov = np.zeros((n, n), np.float32); hs = np.zeros((n, n), np.float32); got = 0
    for q in quads(tx, ty):
        try:
            with rasterio.open('/vsicurl/' + CHM + q + '.tif') as src:
                # the 9.6 m overview (an eighth), trees as a share and their heights, each warped to 25 m by its mean
                h = src.read(1, out_shape=(src.height // 8, src.width // 8)).astype(np.float32); t8 = src.transform * src.transform.scale(src.width / h.shape[1], src.height / h.shape[0])
                tree = (h > TREE_H).astype(np.float32); hh = np.where(h > TREE_H, h, 0)
                from rasterio.warp import reproject
                c1 = np.zeros((n, n), np.float32); h1 = np.zeros((n, n), np.float32)
                reproject(tree, c1, src_transform=t8, src_crs=src.crs, dst_transform=tr, dst_crs='EPSG:32633', resampling=Resampling.average, src_nodata=None, dst_nodata=0)
                reproject(hh, h1, src_transform=t8, src_crs=src.crs, dst_transform=tr, dst_crs='EPSG:32633', resampling=Resampling.average, src_nodata=None, dst_nodata=0)
                m = c1 > cov; cov = np.where(m, c1, cov); hs = np.where(m, h1, hs); got += 1
        except Exception as e:
            print('  skip', q, str(e)[:80], flush=True)
    height = np.where(cov > 0.02, hs / np.maximum(cov, 1e-3), 0)
    np.savez_compressed(os.path.join(OUT, f'{tx}_{ty}.npz'), cover=np.round(cov * 255).astype(np.uint8), height=np.round(np.clip(height, 0, 63) * 4).astype(np.uint8))
    print(json.dumps({'tile': [tx, ty], 'quads': got, 'treed': round(float((cov > 0.2).mean()), 3), 'meanh': round(float(height[cov > 0.2].mean()) if (cov > 0.2).any() else 0, 1), 's': round(time.time() - t0)}), flush=True)

if __name__ == '__main__':
    if sys.argv[1] == 'tile':
        for a in sys.argv[2:]: tile(*map(int, a.split(',')))
    elif sys.argv[1] == 'part':
        k, K = int(sys.argv[2]), int(sys.argv[3]); T = json.load(open(os.path.join(HERE, '..', 'map', 'dybde.json')))['tiles']
        for i, (tx, ty) in enumerate(T):
            if i % K == k and not os.path.exists(os.path.join(OUT, f'{tx}_{ty}.npz')): tile(tx, ty)
