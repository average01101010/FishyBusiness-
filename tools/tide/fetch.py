# The tide along the coast (phase K10 of the coast plan): Kartverket's tide prediction (vannstand.kartverket.no, «Se havnivå», CC BY 4.0) for a
# year at each point of points.json, hourly and above chart datum, and the harmonic constants the game's tide uses fitted to it by least
# squares: the mean sea level above chart datum (zc) and the amplitude and phase of M2, S2, N2, K2, K1 and O1, with the astronomical
# arguments exactly as tideH in src/js/core/03-simulation.js has them (no nodal factors: a year's fit takes them in). Kartverket's
# host is closed to the cloud session, so .github/workflows/tidevann.yml runs this and keeps out/tide.json as a release tide-<run>.
#   python3 tools/tide/fetch.py [out]
import os, re, sys, json, math, time, datetime as dt, numpy as np, requests
HERE = os.path.dirname(os.path.abspath(__file__))
APIS = ['https://vannstand.kartverket.no/tideapi.php', 'https://api.sehavniva.no/tideapi.php']   # the new address first, the old one if it does not answer
API = APIS[0]
YEAR0 = dt.datetime(2026, 10, 1, tzinfo=dt.timezone.utc)
CONS = ['M2', 'S2', 'N2', 'K2', 'K1', 'O1']
S = requests.Session(); S.headers['User-Agent'] = 'kystfiske-tide/1 (github.com/average01101010/FishyBusiness-)'

def fetch(lat, lon, t0, t1):
    p = dict(tide_request='locationdata', lat=lat, lon=lon, datatype='PRE', refcode='CD', lang='en', interval=60, dst=0, tzone=0,
             fromtime=t0.strftime('%Y-%m-%dT%H:%M'), totime=t1.strftime('%Y-%m-%dT%H:%M'), place='', file='')
    for k in range(4):
        try:
            r = S.get(API, params=p, timeout=(20, 180)); r.raise_for_status(); break
        except Exception as e:
            if k == 3: raise
            time.sleep(5 * (k + 1))
    out = []
    for v, t in re.findall(r'<waterlevel\s+value="([-\d.]+)"\s+time="([^"]+)"', r.text):
        out.append((dt.datetime.fromisoformat(t).astimezone(dt.timezone.utc), float(v) / 100))
    name = re.search(r'<location[^>]*\sname="([^"]*)"', r.text)
    return out, (name.group(1) if name else ''), r.text[:300]

# the game's astronomical arguments (degrees) at a UTC time, as tideH computes them
def args(t):
    d = (t - dt.datetime(2000, 1, 1, 12, tzinfo=dt.timezone.utc)).total_seconds() / 86400; Tc = d / 36525
    sL = 218.3165 + 481267.8813 * Tc; hL = 280.4661 + 36000.7698 * Tc; pL = 83.3535 + 4069.0137 * Tc
    T0 = 15 * (t.hour + t.minute / 60 + t.second / 3600); tau = T0 + hL - sL
    return {'M2': 2 * tau, 'S2': 2 * T0, 'N2': 2 * tau - sL + pL, 'K2': 2 * (T0 + hL), 'K1': T0 + hL, 'O1': T0 + hL - 2 * sL}

def fit(series):
    t = [a for a, b in series]; z = np.array([b for a, b in series]); V = [args(x) for x in t]
    cols = [np.ones(len(t))]
    for c in CONS:
        v = np.radians([q[c] for q in V]); cols += [np.cos(v), np.sin(v)]
    A = np.stack(cols, 1); sol, *_ = np.linalg.lstsq(A, z, rcond=None); res = z - A @ sol
    out = [round(float(sol[0]), 3)]
    for i, c in enumerate(CONS):
        a, b = sol[1 + 2 * i], sol[2 + 2 * i]; out += [round(float(math.hypot(a, b)), 3), round(float(math.degrees(math.atan2(b, a)) % 360), 1)]
    return out, float(np.sqrt(np.mean(res ** 2))), float(z.max() - z.min())

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'out', 'tide.json')
    pts = json.load(open(os.path.join(HERE, 'points.json')))['points']; res = []; t00 = time.time()
    # a day at the first point at each address, so the log shows what the service answers; the first that gives values is used
    for u in APIS:
        API = u
        try: s, name, head = fetch(pts[0][2], pts[0][3], YEAR0, YEAR0 + dt.timedelta(days=1))
        except Exception as e: s, name, head = [], '', repr(e)[:300]
        print('probe', u, len(s), name, repr(head), file=sys.stderr, flush=True)
        if s: break
    else: sys.exit('no address of the tide service answered with values')
    for k, (tx, ty, lat, lon, x, y) in enumerate(pts):
        ser = []; name = ''; head = ''
        for q in range(4):   # a quarter a request
            a = YEAR0 + dt.timedelta(days=91.25 * q); b = YEAR0 + dt.timedelta(days=91.25 * (q + 1)) - dt.timedelta(hours=1)
            s, name, head = fetch(lat, lon, a, b); ser += s; time.sleep(0.3)
        if len(ser) < 8000:
            print(f'{k + 1}/{len(pts)} {lat},{lon}: {len(ser)} values, left out: {head!r}', file=sys.stderr, flush=True); continue
        c, rms, rng = fit(ser)
        res.append([tx, ty, lat, lon, x, y] + c); res[-1].append(round(rms, 3))
        print(f'{k + 1}/{len(pts)} {name} {lat},{lon}: zc {c[0]} M2 {c[1]} m {c[2]} deg, range {rng:.2f} m, rms {rms:.3f} m, {time.time() - t00:.0f} s', file=sys.stderr, flush=True)
    if len(res) < len(pts) // 2: sys.exit(f'only {len(res)} of {len(pts)} points')
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    json.dump({'src': 'Kartverket, Se havnivå (api.sehavniva.no), prediction above chart datum, hourly ' + YEAR0.date().isoformat() + ' + 1 year; CC BY 4.0',
               'cols': ['tx', 'ty', 'lat', 'lon', 'x', 'y', 'zc'] + [f'{c}{p}' for c in CONS for p in ('A', 'g')] + ['rms'], 'points': res}, open(out, 'w'))
    print(json.dumps({'points': len(res), 'of': len(pts), 'sec': round(time.time() - t00)}))
