# Usage: python3 -I tools/kalibrering/ers_garn.py ers-2024.zip ers-2025.zip ers-2026.zip (the ERS zips from register.fiskeridir.no/vms-ers/ERS/,
# elektronisk-rapportering-ers-YYYY.zip). Used for the nets calibration 05.11.2026 (docs/systemer/redskap.md, Kalibrering).
# Gillnet catch per net from Fiskeridirektoratet's ERS catch reports (DCA), Norwegian vessels, by length group, month, area and soak.
import csv, sys, zipfile, io, collections, json
def num(s):
    try: return float(s.replace(',', '.'))
    except Exception: return None
H = {}; best = {}; gearn = collections.Counter()
for fn in sys.argv[1:]:
    zf = zipfile.ZipFile(fn); name = [n for n in zf.namelist() if 'dca' in n.lower()][0]
    r = csv.reader(io.TextIOWrapper(zf.open(name), encoding='utf-8-sig', newline=''), delimiter=';'); h = next(r); ix = {k: i for i, k in enumerate(h)}
    g = lambda row, k: row[ix[k]]
    for row in r:
        gc = g(row, 'Redskap FDIR (kode)')
        if gc not in ('20', '21', '22'): continue
        if g(row, 'Fartøynasjonalitet (kode)') != 'NOR': continue
        gearn[(gc, g(row, 'Redskap FDIR'))] += 1
        reg = g(row, 'Registreringsmerke (ERS)') or g(row, 'Radiokallesignal (ERS)'); mn = g(row, 'Meldingsnummer')
        try: ver = int(g(row, 'Meldingsversjon'))
        except Exception: ver = 1
        if ver < best.get((reg, mn), 0): continue
        best[(reg, mn)] = ver
        k = (reg, mn, ver, g(row, 'Starttidspunkt'), g(row, 'Stopptidspunkt'), g(row, 'Startposisjon bredde'), g(row, 'Startposisjon lengde'))
        d = H.get(k)
        if d is None:
            d = H[k] = {'gear': gc, 'start': g(row, 'Startdato'), 'dur': num(g(row, 'Varighet')), 'qty': num(g(row, 'Redskap mengde')), 'area': g(row, 'Hovedområde start (kode)'),
                        'lg': g(row, 'Lengdegruppe'), 'mesh': num(g(row, 'Redskap maskevidde')), 'lat': num(g(row, 'Startposisjon bredde')), 'depth': num(g(row, 'Havdybde start')), 'sp': collections.Counter()}
        d['sp'][g(row, 'Art - FDIR')] += num(g(row, 'Rundvekt')) or 0
L = [v for k, v in H.items() if best[(k[0], k[1])] == k[2]]
print('gear codes', gearn.most_common(6))
def q(xs, p): xs = sorted(xs); return xs[min(len(xs) - 1, int(p * len(xs)))] if xs else float('nan')
def mon(h):
    try: return int(h['start'].split('.')[1])
    except Exception: return 0
cod = lambda sp: sum(v for k, v in sp.items() if k.lower().startswith('torsk'))
tot = lambda sp: sum(sp.values())
def rep(label, xs):
    if len(xs) < 8: print(f'  {label:52s} n={len(xs)}'); return
    print(f'  {label:52s} n={len(xs):4d} p25={q(xs,.25):5.0f} med={q(xs,.5):5.0f} p75={q(xs,.75):5.0f} p90={q(xs,.9):5.0f}')
ok = lambda h: h['qty'] and 3 <= h['qty'] <= 300 and h['dur'] and h['dur'] >= 120
print('lengths:', collections.Counter(h['lg'] for h in L).most_common())
print('nets per set (15-20.99 m):', q([h['qty'] for h in L if h['lg'] == '15-20,99 m' and ok(h)], .5), 'mesh med', q([h['mesh'] for h in L if h['mesh']], .5))
for lg in ('15-20,99 m', '21-27,99 m'):
    print('==', lg)
    for months, lab in (((2, 3, 4), 'Feb-Apr (skrei)'), ((3,), 'March'), ((5, 6, 7, 8, 9), 'May-Sep'), ((10, 11, 12, 1), 'Oct-Jan')):
        S = [h for h in L if h['lg'] == lg and mon(h) in months and ok(h)]
        rep(lab + ': cod kg/net/set, all soaks', [cod(h['sp']) / h['qty'] for h in S])
        rep(lab + ': all species kg/net/set, all soaks', [tot(h['sp']) / h['qty'] for h in S])
        rep(lab + ': cod kg/net, soak 12-24 h', [cod(h['sp']) / h['qty'] for h in S if 720 <= h['dur'] <= 1440])
        rep(lab + ': cod kg/net, soak 3-11 h', [cod(h['sp']) / h['qty'] for h in S if 180 <= h['dur'] < 720])
        rep(lab + ': soak h', [h['dur'] / 60 for h in S])
print('== 15-20.99 m, Feb-Apr, by area (cod kg/net/set, all soaks)')
for ar in ('00', '03', '04', '05', '06', '07', '28'):
    S = [h for h in L if h['lg'] == '15-20,99 m' and mon(h) in (2, 3, 4) and h['area'] == ar and ok(h)]
    rep('area ' + ar, [cod(h['sp']) / h['qty'] for h in S])
