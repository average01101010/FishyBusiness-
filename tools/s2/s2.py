# A summer mosaic of Sentinel-2 (G3 of docs/planer/grafikk-natur-og-miljo.md): the ground's colour as the satellites see it in July and
# August, without clouds, cloud shadows or snow. From the L2A scenes Element 84 keeps open on AWS (s3://sentinel-cogs, Cloud-Optimised
# GeoTIFFs, read over HTTPS without an account). Licence: the Copernicus Sentinel data are free for any use, commercial too, with the
# source given: «Contains modified Copernicus Sentinel data <years>» (Commission Delegated Regulation (EU) No 1159/2013).
#   per MGRS square (100 km, e.g. 33WXT): the scenes from 15 June to 31 August of the years asked with under 60 % cloud (the scene's own
#   json), each read at 20 m (TCI, the true colour at the overview 2, and SCL, the scene classification), and per pixel the median of the
#   scenes where SCL says vegetation (4), bare ground (5), water (6) or unclassified (7); clouds (8, 9, 10), cloud shadows (3), snow (11),
#   dark or topographic shadow (2) and no data (0, 1) are left out. Done in strips of 183 rows, at most MAXS scenes (the clearest first).
#   out: an .npz per square with rgb (uint8, rows north to south) and n (the scenes that counted), and the square's transform
#   python3 tools/s2/s2.py <square> [<square> ...]      e.g. 33WXT 33WWT
import os, sys, json, time, urllib.request, urllib.parse, numpy as np
os.environ.setdefault('GDAL_DISABLE_READDIR_ON_OPEN', 'EMPTY_DIR'); os.environ.setdefault('GDAL_HTTP_MAX_RETRY', '4'); os.environ.setdefault('GDAL_HTTP_RETRY_DELAY', '2')
if os.path.exists('/root/.ccr/ca-bundle.crt'): os.environ.setdefault('CURL_CA_BUNDLE', '/root/.ccr/ca-bundle.crt')
import rasterio
from rasterio.windows import Window
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
S3 = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/'; ROOT = 'sentinel-s2-l2a-cogs/'
YEARS = (2021, 2022, 2023, 2024, 2025); MAXS = 18; GOOD = (4, 5, 6, 7)

def ls(prefix):
    out, tok = [], None
    while True:
        u = S3 + '?list-type=2&delimiter=/&prefix=' + prefix + ('&continuation-token=' + urllib.parse.quote(tok) if tok else '')
        x = urllib.request.urlopen(u, timeout=60).read().decode()
        import re
        out += re.findall(r'<Prefix>([^<]+)</Prefix>', x)[1:]
        m = re.search(r'<NextContinuationToken>([^<]+)</NextContinuationToken>', x)
        if not m: return out
        tok = m.group(1)

def scenes(sq):
    z, b, s = sq[:2], sq[2], sq[3:]; got = []
    for y in YEARS:
        for mo in (6, 7, 8):
            for p in ls(f'{ROOT}{z}/{b}/{s}/{y}/{mo}/'):
                name = p.rstrip('/').split('/')[-1]; d = int(name.split('_')[2][6:8])
                if mo == 6 and d < 15: continue
                try: j = json.load(urllib.request.urlopen(S3 + p + name + '.json', timeout=60))
                except Exception: continue
                cc = j['properties'].get('eo:cloud_cover', 100); nd = j['properties'].get('s2:nodata_pixel_percentage', 0)
                if cc < 60 and nd < 80: got.append((cc + nd * 0.3, p))
    got.sort(); return [p for _, p in got[:MAXS]]

def mosaic(sq):
    t0 = time.time(); S = scenes(sq)
    if not S: print(json.dumps({'sq': sq, 'scenes': 0})); return None
    tci = [rasterio.open('/vsicurl/' + S3 + p + 'TCI.tif') for p in S]; scl = [rasterio.open('/vsicurl/' + S3 + p + 'SCL.tif') for p in S]
    N = scl[0].height; tr = scl[0].transform; crs = str(scl[0].crs)
    rgb = np.zeros((N, N, 3), np.uint8); cnt = np.zeros((N, N), np.uint8)
    for r0 in range(0, N, 183):
        h = min(183, N - r0); st = np.zeros((len(S), h, N, 3), np.uint8); ok = np.zeros((len(S), h, N), bool)
        for k in range(len(S)):
            try:
                a = tci[k].read(window=Window(0, r0 * 2, N * 2, h * 2), out_shape=(3, h, N))
                c = scl[k].read(1, window=Window(0, r0, N, h))
            except Exception as e:
                print('  skip', S[k][-28:], str(e)[:60], flush=True); continue
            st[k] = a.transpose(1, 2, 0); ok[k] = np.isin(c, GOOD) & (a.sum(0) > 0)
        n = ok.sum(0); cnt[r0:r0 + h] = n
        f = st.astype(np.float32); f[~ok] = np.nan
        with np.errstate(all='ignore'): m = np.nanmedian(f, axis=0)
        rgb[r0:r0 + h] = np.nan_to_num(m).clip(0, 255).astype(np.uint8)
    np.savez_compressed(os.path.join(OUT, sq + '.npz'), rgb=rgb, n=cnt, tr=np.array(tr)[:6], crs=crs)
    print(json.dumps({'sq': sq, 'scenes': len(S), 'covered': round(float((cnt > 0).mean()), 3), 's': round(time.time() - t0)}), flush=True)
    return rgb

if __name__ == '__main__':
    import urllib.parse
    for sq in sys.argv[1:]: mosaic(sq)
