"""The sea ice by month (Havsteget H1b R5, valg V3 A, Jonas 03.11.2026: «iskanten etter måned»).

From EUMETSAT OSI SAF's global sea ice concentration climate data record, release 3 (OSI-450-a, 1978-2020, 25 km EASE2 grid;
doi:10.15770/EUM_SAF_OSI_0013; CC BY 4.0, «Licensed under CC BY 4.0 by EUMETSAT» on osi-saf.eumetsat.int), the monthly mean
concentration of every month of tools/is/is.json's "period" (1991-2020), averaged per calendar month: the climatology the game's ice
edge follows (core/03h-is.js). The files' own `license` attribute is read and written into the result, so the licence is the one the
data say, not one remembered.

The files are found on MET Norway's THREDDS server (the catalogs in is.json's "roots", crawled for the northern hemisphere's monthly
files; when no monthly file is found, the daily files every 3rd day are averaged instead). The cloud session cannot reach the server;
.github/workflows/is.yml runs this and keeps the result as a release is-<run number>.

The result, src/data/is.json, is the game's frame (tools/map/frame.py FRAME) in cells of cell_km (25 km, the source's own), the value
of a cell the concentration in steps of step_pct (10 %, so 0-10), run-length coded per month (pairs of value and count, 1-255) and
base64. Land and the source's missing cells get the nearest sea cells' value (inverse distance over the 4 nearest), so a fjord or a
sound has the ice of the sea outside it; the game decides itself what is land. Only the seas the plan names and their neighbours keep
ice: the Baltic and the Gulf of Bothnia (inside the frame, out of reach from the Norwegian coast) are set to 0.

    python3 tools/is/is.py probe            what the server has (the catalogs, a file's variables and attributes)
    python3 tools/is/is.py build [out]      the climatology (out: is.json)
    python3 tools/is/is.py build out --synthetic   the same from made-up fields (to try the coding and the game's reader offline)
"""
import base64, io, json, math, os, re, sys, time
import xml.etree.ElementTree as ET
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'map'))
from frame import FRAME   # noqa: E402

CFG = json.load(open(os.path.join(HERE, 'is.json'), encoding='utf-8'))
CACHE = os.path.join(HERE, 'cache')
TDS = 'https://thredds.met.no/thredds'
NS = {'c': 'http://www.unidata.ucar.edu/namespaces/thredds/InvCatalog/v1.0'}


def session():
    import requests
    s = requests.Session(); s.headers['User-Agent'] = 'kystfiske-is/1 (github.com/average01101010/FishyBusiness-)'
    return s


def get(s, url, tries=5, stream=False):
    for k in range(tries):
        try:
            r = s.get(url, timeout=(20, 300), stream=stream)
            if r.status_code == 200: return r
            print('  ', r.status_code, url, flush=True)
            if r.status_code == 404: return None
        except Exception as e:
            print('  ', repr(e)[:200], url, flush=True)
        time.sleep(5 * (k + 1))
    return None


def catalog(s, url):
    """(sub-catalog urls, [(name, urlPath)]) of a THREDDS catalog.xml"""
    r = get(s, url)
    if r is None: return [], []
    root = ET.fromstring(r.content); base = url.rsplit('/', 1)[0] + '/'
    refs = [base + e.get('{http://www.w3.org/1999/xlink}href') for e in root.iter('{%s}catalogRef' % NS['c'])]
    ds = [(e.get('name'), e.get('urlPath')) for e in root.iter('{%s}dataset' % NS['c']) if e.get('urlPath')]
    return refs, ds


def find_files(s, monthly=True, step=3):
    """{(year, month): [fileServer urls]} of the northern hemisphere's files in the period: the monthly means, or every step-th day"""
    y0, y1 = CFG['period']; out = {}; seen = set()
    want = re.compile(r'_nh_.*?((?:19|20)\d\d)(\d\d)(\d\d)?\d*\.nc$')
    todo = [(u, 0) for u in CFG['roots']]
    while todo:
        u, depth = todo.pop(0)
        if u in seen or depth > 4: continue
        seen.add(u); refs, ds = catalog(s, u)
        for name, path in ds:
            m = want.search(name or '')
            if not m or ('450' not in path and '450' not in u) or 'monthly' in path and not monthly: continue
            y, mo, day = int(m.group(1)), int(m.group(2)), m.group(3)
            if not (y0 <= y <= y1): continue
            if monthly and day is not None: continue
            if not monthly and (day is None or (int(day) - 1) % step): continue
            out.setdefault((y, mo), []).append(f'{TDS}/fileServer/{path}')
        for r in refs:
            tail = r.lower()
            # the record's own folders: 450a (and the years under them); monthly or daily as asked
            if depth == 0 and len(CFG['roots']) > 1 and u == CFG['roots'][-1] and not ('450a' in tail): continue
            if monthly and depth >= 1 and 'daily' in tail: continue
            if not monthly and 'monthly' in tail: continue
            m = re.search(r'/((?:19|20)\d\d)/', tail)
            if m and not (y0 <= int(m.group(1)) <= y1): continue
            todo.append((r, depth + 1))
        if monthly and len(out) >= 12 * (y1 - y0 + 1): break
    return out


def read(s, url):
    """(lat, lon, concentration in %, NaN off the sea; the file's attributes) of a netCDF file, kept in the cache"""
    import netCDF4
    os.makedirs(CACHE, exist_ok=True); f = os.path.join(CACHE, url.rsplit('/', 1)[1])
    if not os.path.exists(f):
        r = get(s, url, stream=True)
        if r is None: return None
        with open(f + '.part', 'wb') as o:
            for b in r.iter_content(1 << 20): o.write(b)
        os.replace(f + '.part', f)
    with netCDF4.Dataset(f) as d:
        names = list(d.variables)
        v = 'ice_conc' if 'ice_conc' in names else next(n for n in names if 'conc' in n and 'raw' not in n and 'uncert' not in n)
        a = np.ma.filled(d.variables[v][:].astype('f8'), np.nan).squeeze()
        if np.nanmax(a) <= 1.5: a = a * 100   # a fraction, not percent
        if 'status_flag' in names:   # land and lakes (status_flag bits 1 and 2 in OSI-450-a) are not sea
            st = np.ma.filled(d.variables['status_flag'][:], 0).squeeze().astype(int); a[(st & 3) > 0] = np.nan
        lat = np.ma.filled(d.variables['lat'][:], np.nan); lon = np.ma.filled(d.variables['lon'][:], np.nan)
        att = {k: str(getattr(d, k)) for k in d.ncattrs()}
    return lat, lon, a, att


def frame_cells(c):
    """the cells' middles (x, y, km) of the game's frame and their lat/lon (UTM 33: x = (E + 250 km)/1000, y = (8 050 km - N)/1000)"""
    from pyproj import Transformer
    x0, y0, x1, y1 = FRAME; ix0, iy0 = math.floor(x0 / c), math.floor(y0 / c); nx, ny = math.ceil(x1 / c) - ix0, math.ceil(y1 / c) - iy0
    X, Y = np.meshgrid((np.arange(nx) + ix0 + 0.5) * c, (np.arange(ny) + iy0 + 0.5) * c)
    lon, lat = Transformer.from_crs(25833, 4326, always_xy=True).transform(X * 1000 - 250000, 8050000 - Y * 1000)
    return ix0, iy0, nx, ny, lat, lon


def xyz(lat, lon):
    la, lo = np.radians(lat), np.radians(lon)
    return np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)


def regrid(slat, slon, conc, lat, lon):
    """the 12 months' concentration at the frame's cells: the inverse distance over the 4 nearest sea cells of the source"""
    from scipy.spatial import cKDTree
    ok = np.isfinite(slat) & np.isfinite(slon) & np.all(np.isfinite(conc), 0)
    tree = cKDTree(xyz(slat[ok], slon[ok])); d, i = tree.query(xyz(lat.ravel(), lon.ravel()), k=4)
    w = 1 / np.maximum(d, 1e-6) ** 2; w /= w.sum(1, keepdims=True)
    src = conc[:, ok]
    return np.stack([(src[m][i] * w).sum(1).reshape(lat.shape) for m in range(12)])


def outside(lat, lon):
    """the Baltic and the Gulf of Bothnia (out of reach from the coast, and not the seas of the plan): no ice there"""
    return (lon > 9.5) & (lon < 30.5) & (lat < 66.2)


def rle(v):
    out = bytearray(); i = 0; n = len(v)
    while i < n:
        j = i
        while j < n and v[j] == v[i] and j - i < 255: j += 1
        out += bytes([int(v[i]), j - i]); i = j
    return base64.b64encode(bytes(out)).decode()


def build(dst, synthetic=False):
    c, step = CFG['cell_km'], CFG['step_pct']; y0, y1 = CFG['period']
    ix0, iy0, nx, ny, lat, lon = frame_cells(c)
    if synthetic:   # a made-up ice edge: 80 % north of a latitude that moves with the month (78° N in September, 72° N in March)
        att = {'license': 'synthetic', 'title': 'synthetic'}
        edge = [72 + 3 * (1 - math.cos(2 * math.pi * (m - 2) / 12)) for m in range(12)]
        clim = np.stack([np.clip((lat - e) * 40 + 40, 0, 100) for e in edge]); n_used = [0] * 12
    else:
        s = session(); files = find_files(s, monthly=True); mode = 'monthly'
        print('monthly files found:', len(files), 'months', flush=True)
        if len(files) < 12 * (y1 - y0 + 1) * 0.8:
            files = find_files(s, monthly=False); mode = 'daily'
            print('daily files found for', len(files), 'months', flush=True)
        if not files: sys.exit('no files of OSI-450-a found under ' + ', '.join(CFG['roots']))
        acc = None; cnt = None; att = None; slat = slon = None; n_used = [0] * 12
        for (y, m), urls in sorted(files.items()):
            for u in urls:
                r = read(s, u)
                if r is None: continue
                la, lo, a, at = r
                if acc is None:
                    acc = np.zeros((12,) + a.shape); cnt = np.zeros((12,) + a.shape); slat, slon, att = la, lo, at
                    print('first file', u, '\n  attributes:', json.dumps(at, ensure_ascii=False)[:3000], flush=True)
                ok = np.isfinite(a); acc[m - 1][ok] += a[ok]; cnt[m - 1][ok] += 1; n_used[m - 1] += 1
            print(y, m, mode, n_used[m - 1], flush=True)
        clim_src = np.where(cnt > 0, acc / np.maximum(cnt, 1), np.nan)
        clim = regrid(slat, slon, clim_src, lat, lon)
    clim[:, outside(lat, lon)] = 0
    q = np.clip(np.round(clim / step), 0, 100 // step).astype(np.uint8)
    months = [rle(q[m].ravel()) for m in range(12)]
    lic = att.get('license') or att.get('licence') or ''
    out = {'src': 'EUMETSAT OSI SAF, global sea ice concentration climate data record v3 (OSI-450-a), doi:10.15770/EUM_SAF_OSI_0013; '
                  'monthly means ' + f'{y0}-{y1}' + ' averaged per calendar month by tools/is/is.py' + ('' if synthetic else ''),
           'license': lic or 'CC BY 4.0 (EUMETSAT, osi-saf.eumetsat.int)', 'title': att.get('title', ''), 'period': [y0, y1],
           'files': n_used, 'c': c, 'step': step, 'ix0': ix0, 'iy0': iy0, 'nx': nx, 'ny': ny, 'm': months}
    if synthetic: out['synthetic'] = True
    json.dump(out, open(dst, 'w'), separators=(',', ':'))
    # what the release log shows: the concentration at places the plan names, March and September
    def at(la_, lo_):
        from pyproj import Transformer
        E, N = Transformer.from_crs(4326, 25833, always_xy=True).transform(lo_, la_); x, y = (E + 250000) / 1000, (8050000 - N) / 1000
        i, j = int(x // c) - ix0, int(y // c) - iy0
        return [int(q[m, j, i]) * step for m in range(12)] if 0 <= i < nx and 0 <= j < ny else None
    for name, la_, lo_ in [('Kong Karls land', 78.8, 28.0), ('Hopen', 76.5, 25.0), ('Bjørnøya', 74.45, 19.0), ('Sentralbanken', 76.0, 35.0),
                           ('Smutthullet', 73.5, 37.0), ('Isfjorden', 78.2, 14.5), ('Danmarkstredet', 66.5, -27.0), ('Jan Mayen', 71.0, -8.5),
                           ('Vardø', 70.4, 31.3), ('Hammerfest', 70.7, 23.5), ('Senja', 69.45, 17.35), ('Kvitsjøen', 65.5, 37.0)]:
        print(f'{name:16s}', at(la_, lo_), flush=True)
    print(json.dumps({'bytes': os.path.getsize(dst), 'nx': nx, 'ny': ny, 'files': n_used, 'license': out['license']}))


def probe():
    s = session()
    for u in CFG['roots']:
        refs, ds = catalog(s, u); print(u, len(refs), 'catalogs', len(ds), 'datasets')
        for r in refs[:40]: print('  ref', r)
        for d in ds[:10]: print('  ds', d)
    files = find_files(s, monthly=True); print('monthly months', len(files), sorted(files)[:3], sorted(files)[-3:])
    if files:
        k = sorted(files)[0]; r = read(s, files[k][0])
        if r: print('attributes', json.dumps(r[3], ensure_ascii=False)[:3000], 'shape', r[2].shape, 'max', np.nanmax(r[2]))


if __name__ == '__main__':
    a = sys.argv[1:] or ['build']
    if a[0] == 'probe': probe()
    else: build(a[1] if len(a) > 1 and not a[1].startswith('--') else 'is.json', '--synthetic' in a)
