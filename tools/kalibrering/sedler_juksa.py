# Usage: python3 -I tools/kalibrering/sedler_juksa.py 3 fangstdata_2025.csv.zip fangstdata_2026.csv.zip (months comma-separated; the zips from
# register.fiskeridir.no/uttrekk/). Cod per vessel-day with jig by main area of catch, boats under 11 m. Used for COD_AREA 05.11.2026.
# Cod per vessel-day with jig (juksa/pilk) in February-April from the landing notes, by main area of catch and length group.
import csv, sys, zipfile, io, collections
def num(s):
    try: return float(s.replace(',', '.'))
    except Exception: return 0.0
vd = collections.defaultdict(lambda: [0.0, '', '', 0])
gears = collections.Counter()
MON = [int(x) for x in sys.argv[1].split(',')]
for fn in sys.argv[2:]:
    zf = zipfile.ZipFile(fn); r = csv.reader(io.TextIOWrapper(zf.open(zf.namelist()[0]), encoding='utf-8-sig', newline=''), delimiter=';'); h = next(r); ix = {k: i for i, k in enumerate(h)}
    g = lambda row, k: row[ix[k]]
    for row in r:
        if g(row, 'Fartøynasjonalitet (kode)') not in ('NOR', ''): continue
        gc = g(row, 'Redskap (kode)')
        if gc not in ('33', '34', '35'): continue
        try: mi = int(g(row, 'Landingsmåned (kode)'))
        except Exception: continue
        if mi not in MON: continue
        a = g(row, 'Art - FDIR').lower()
        if 'torsk' not in a or 'polar' in a: continue
        gears[(gc, g(row, 'Redskap'))] += 1
        k = (g(row, 'Fartøy ID') or g(row, 'Registreringsmerke (seddel)'), g(row, 'Landingsdato'))
        v = vd[k]; v[0] += num(g(row, 'Rundvekt')); v[1] = g(row, 'Hovedområde (kode)') + '|' + g(row, 'Lokasjon (kode)'); v[2] = g(row, 'Lengdegruppe')
        try: v[3] = max(v[3], int(num(g(row, 'Besetning'))))
        except Exception: pass
print('gears', gears.most_common(5))
def q(xs, p): xs = sorted(xs); return xs[min(len(xs) - 1, int(p * len(xs)))] if xs else 0
REG = {'Vestfjorden (00)': lambda a, l: a == '00', 'Lofoten–Vesterålen ute (05 lok < 20)': lambda a, l: a == '05' and l != '' and int(l) < 20,
       'Senja (05 lok 20-39)': lambda a, l: a == '05' and l != '' and 20 <= int(l) < 40, 'Troms nord (04 lok > 40?)': lambda a, l: False,
       'Vest-Finnmark (04)': lambda a, l: a == '04', 'Øst-Finnmark (03)': lambda a, l: a == '03'}
lgs = sorted({v[2] for v in vd.values()})
print('length groups', lgs)
for name, f in REG.items():
    for lg in ('Under 11 m',):
        xs = []; crew = []
        for v in vd.values():
            a, l = v[1].split('|')
            try:
                if not f(a, l): continue
            except Exception: continue
            if lg != 'alle' and v[2] != lg: continue
            if v[0] <= 0: continue
            xs.append(v[0]); crew.append(v[3])
        if len(xs) >= 10: print(f'{name:38s} {lg:11s} days={len(xs):5d} med={q(xs,.5):6.0f} p25={q(xs,.25):6.0f} p75={q(xs,.75):6.0f} crew med={q(crew,.5)}')
