# The tide out in the open sea and at the foreign coasts (Havsteget H1b R5, 04.11.2026), where Kartverket's prediction has no points:
# from the global empirical ocean tide model EOT20 (Hart-Davis, Piccioni, Dettmering, Schwatke, Passaro and Seitz 2021, DGFI-TUM;
# SEANOE doi:10.17882/79489, CC BY; north of 66° N the model is filled from FES2014b by its authors). For points on a lattice of
# LAT_KM over the game's frame (tools/map/frame.py), at sea in the model and more than AWAY km from every one of Kartverket's points,
# the hourly tide of the same year as fetch.py's is predicted from the model's amplitudes and Greenwich phases of M2, S2, N2, K2, K1
# and O1 with the usual nodal factors (Schureman), and the game's constants are fitted to it by the same least squares as fetch.py
# (fit), so they stand in the game's own astronomical arguments. The mean sea level above chart datum (zc) is the year's lowest water
# below the mean, as chart datum is near the lowest astronomical tide. The rows are added to the tide.json fetch.py made.
# Where a Kartverket point and the model meet (the coast), both are printed: the check that the arguments agree.
#   python3 tools/tide/eot.py tide.json
import io, math, os, re, sys, json, zipfile, datetime as dt
import numpy as np, requests
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'map'))
from fetch import fit, YEAR0, CONS   # noqa: E402
from frame import FRAME   # noqa: E402
PAGE = 'https://www.seanoe.org/data/00683/79489/'
CACHE = os.path.join(HERE, 'cache'); LAT_KM = 150; AWAY = 60

def nodal(t):
    """{constituent: (f, u°, V0°)} at a UTC time, with the standard arguments (T = 15° UT + 180°, the mean longitudes s, h, p and the node N)"""
    d = (t - dt.datetime(2000, 1, 1, 12, tzinfo=dt.timezone.utc)).total_seconds() / 86400; Tc = d / 36525
    s = 218.3165 + 481267.8813 * Tc; h = 280.4661 + 36000.7698 * Tc; p = 83.3535 + 4069.0137 * Tc; N = math.radians(125.0445 - 1934.1363 * Tc)
    T = 15 * (t.hour + t.minute / 60) + 180
    fM = 1 - 0.037 * math.cos(N); uM = -2.1 * math.sin(N)
    return {'M2': (fM, uM, 2 * T - 2 * s + 2 * h), 'S2': (1, 0, 2 * T), 'N2': (fM, uM, 2 * T - 3 * s + 2 * h + p),
            'K2': (1.024 + 0.286 * math.cos(N) + 0.008 * math.cos(2 * N), -17.7 * math.sin(N) + 0.7 * math.sin(2 * N), 2 * T + 2 * h),
            'K1': (1.006 + 0.115 * math.cos(N) - 0.009 * math.cos(2 * N), -8.9 * math.sin(N) + 0.7 * math.sin(2 * N), T + h - 90),
            'O1': (1.009 + 0.187 * math.cos(N) - 0.015 * math.cos(2 * N), 10.8 * math.sin(N) - 1.3 * math.sin(2 * N) + 0.2 * math.sin(3 * N), T - 2 * s + h + 90)}

def model():
    """{constituent: (lat, lon, amplitude m, phase °)} from the model's ocean tide grids, fetched once into the cache"""
    import netCDF4
    os.makedirs(CACHE, exist_ok=True); S = requests.Session(); S.headers['User-Agent'] = 'kystfiske-tide/1 (github.com/average01101010/FishyBusiness-)'
    html = S.get(PAGE, timeout=120).text
    links = sorted(set(re.findall(r'https?://www\.seanoe\.org/data/00683/79489/data/\d+\.zip', html)))
    print('EOT20 files on the page:', links, file=sys.stderr, flush=True)
    lic = re.search(r'(CC[- ]BY[^<"]{0,20})', html); print('licence on the page:', lic.group(1) if lic else 'not found', file=sys.stderr, flush=True)
    out = {}
    for u in links:
        f = os.path.join(CACHE, u.rsplit('/', 1)[1])
        if not os.path.exists(f):
            with S.get(u, timeout=(30, 1800), stream=True) as r:
                r.raise_for_status(); print('fetching', u, r.headers.get('Content-Length'), file=sys.stderr, flush=True)
                with open(f + '.part', 'wb') as o:
                    for b in r.iter_content(1 << 22): o.write(b)
            os.replace(f + '.part', f)
        z = zipfile.ZipFile(f); names = z.namelist(); print('in the zip:', names[:40], file=sys.stderr, flush=True)
        # the ocean tides may lie in a zip of their own inside the record's zip
        zs = [z] + [zipfile.ZipFile(io.BytesIO(z.read(n))) for n in names if n.lower().endswith('.zip') and 'ocean' in n.lower()]
        for zz in zs[1:]: print('inner zip:', zz.namelist()[:40], file=sys.stderr, flush=True)
        for c in CONS:
            if c in out: continue
            m = [(zz, n) for zz in zs for n in zz.namelist() if re.search(rf'(^|/){c}_ocean[^/]*\.nc$', n, re.I)]
            if not m: continue
            with netCDF4.Dataset('x', memory=m[0][0].read(m[0][1])) as d:
                V = list(d.variables); a = next(v for v in ('amplitude', 'amp', 'Amplitude') if v in V); g = next(v for v in ('phase', 'pha', 'Phase') if v in V)
                A = np.ma.filled(d.variables[a][:].astype('f8'), np.nan); G = np.ma.filled(d.variables[g][:].astype('f8'), np.nan)
                units = getattr(d.variables[a], 'units', '')
                lat = d.variables['lat'][:].astype('f8'); lon = d.variables['lon'][:].astype('f8')
                if A.shape != (len(lat), len(lon)): A, G = A.T, G.T
                if 'cm' in units or np.nanmax(A) > 20: A = A / 100
                out[c] = (lat, lon, A, G); print(c, m[0][1], A.shape, units, file=sys.stderr, flush=True)
        if len(out) == len(CONS): break
    if len(out) < len(CONS): sys.exit('EOT20: only ' + ','.join(out) + ' found')
    return out

def at(M, c, la, lo):
    lat, lon, A, G = M[c]; lo = lo % 360 if lon.max() > 180 else lo
    i, j = int(np.argmin(abs(lat - la))), int(np.argmin(abs(lon - lo)))
    for r in range(0, 4):   # the nearest cell with a value, within 3 cells
        a, g = A[max(0, i - r):i + r + 1, max(0, j - r):j + r + 1], G[max(0, i - r):i + r + 1, max(0, j - r):j + r + 1]; ok = np.isfinite(a) & np.isfinite(g)
        if ok.any():
            z = (a[ok] * np.exp(1j * np.radians(g[ok]))).mean(); return abs(z), math.degrees(math.atan2(z.imag, z.real)) % 360
    return None

def series(M, la, lo):
    k = [at(M, c, la, lo) for c in CONS]
    if any(v is None for v in k): return None
    out = []
    for hh in range(0, 365 * 24):
        t = YEAR0 + dt.timedelta(hours=hh); nd = nodal(t)
        out.append((t, sum(nd[c][0] * a * math.cos(math.radians(nd[c][2] + nd[c][1] - g)) for c, (a, g) in zip(CONS, k))))
    return out

if __name__ == '__main__':
    from pyproj import Transformer
    dst = sys.argv[1] if len(sys.argv) > 1 else 'tide.json'; T = json.load(open(dst)); cols = T['cols']; ix, iy = cols.index('x'), cols.index('y')
    M = model(); inv = Transformer.from_crs(25833, 4326, always_xy=True)
    kv = [(r[ix], r[iy]) for r in T['points']]
    # the check: the model against Kartverket's constants at a few points along the coast (the model is coarse in the fjords)
    for r in T['points'][::12]:
        s = series(M, r[2], r[3])
        if s:
            c, rms, rng = fit(s); print('check', r[2], r[3], 'Kartverket M2', r[7], r[8], 'K1', r[15], r[16], '| EOT20 M2', c[1], c[2], 'K1', c[9], c[10], file=sys.stderr, flush=True)
    add = []; x0, y0, x1, y1 = FRAME
    for y in np.arange(y0 + LAT_KM / 2, y1, LAT_KM):
        for x in np.arange(x0 + LAT_KM / 2, x1, LAT_KM):
            if min(math.hypot(x - a, y - b) for a, b in kv) < AWAY: continue
            lo, la = inv.transform(x * 1000 - 250000, 8050000 - y * 1000); s = series(M, la, lo)
            if not s: continue
            c, rms, rng = fit(s); zc = round(-min(v for _, v in s), 3); c[0] = zc
            add.append([int(x // 50), int(y // 50), round(la, 5), round(lo, 5), round(float(x), 1), round(float(y), 1)] + c + [round(rms, 3)])
            print('open sea', round(la, 2), round(lo, 2), 'zc', zc, 'M2', c[1], c[2], 'range', round(rng, 2), file=sys.stderr, flush=True)
    T['points'] += add
    T['src'] += f'; {len(add)} points in the open sea and at the foreign coasts from EOT20 (Hart-Davis et al. 2021, DGFI-TUM, SEANOE doi:10.17882/79489, CC BY; FES2014b north of 66° N), tools/tide/eot.py'
    json.dump(T, open(dst, 'w')); print(json.dumps({'open_sea': len(add), 'all': len(T['points'])}))
