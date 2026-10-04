# The fish receivers along the coast (M1 of the rules plan, 04.10.2026): every first-hand buyer's place in Fiskeridirektoratet's buyer
# register (kjøperregisteret, NLOD), with what it has taken in by the landing notes (sluttsedler, «fangstdata (seddel)», NLOD) and, from
# Nordmøre to Finnmark, Norges Råfisklag's own map of its receivers (type and zone). The key between them is Mattilsynet's approval
# number (Mottaksstasjon on the notes). Out: tools/mottak/out/mottak.json (and src/data/mottak.json), one entry per receiver:
#   id (the approval number), n (name), t (type), k (kommune), ll [lat, lon], src ('reg' the register's coordinates, 'adr' the address
#   found in Kartverket's address register, 'rf' Råfisklaget's), kg (all landed, kg a year), n_land (landings a
#   year), boats (vessels a year), sp {species: [kg a year, share live, price index, months as a 12-bit mask]}, gear {group: share},
#   p [x, y] in the game's frame (km), q the quay face it lies at from the game's vector packs [x, y, the normal's angle, length m,
#   depth m, kind, metres from the register's point] or null when none is within 600 m,
#   small (share of the landings from boats under 15 m), rf (Råfisklaget's type and zone)
# Personal data in Råfisklaget's map (contact, e-mail, phone) is dropped as it is read.
# Prices have moved a lot over the years (Jonas 04.10.2026), so the notes give no prices in kroner: the price index is what the receiver
# paid for the species against what all receivers paid for it the same month of the same year (1.00 = the average), and the game keeps
# its own prices (Råfisklaget's minimum prices, SPECIES.pm).
#   python3 tools/mottak/mottak.py [years ...]      (default the last two whole years; the files are fetched into tools/mottak/cache/)
# KYST_MOTTAK=<file> writes there instead of tools/mottak/out/mottak.json; KYST_MAP=<dir> reads the vector packs from there instead of
# tools/map/out/game (tools/map/game.py). The workflow .github/workflows/mottak.yml makes it a release mottak-N every month.
import os, io, re, sys, csv, json, math, time, zipfile, requests
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); CACHE = os.path.join(HERE, 'cache')
OUT = os.path.join(HERE, 'out')
REG = 'https://www.fiskeridir.no/registre/kjoeperregisteret/_/service/no.fiskeridir/download-buyer-list?format=csv&locale=no'
NOTES = 'https://register.fiskeridir.no/uttrekk/fangstdata_{}.csv.zip'
RF = 'https://rafisklaget.no/umbraco/Surface/Map/GetData/'
ADR = 'https://ws.geonorge.no/adresser/v1/sok'
# the game's species by the notes' «Art - gruppe» and «Art - FDIR» (and king crab, which is coming): cod of either stock, haddock,
# saithe, pollack, ling, tusk, common redfish (not beaked), Atlantic halibut (not Greenland), brown crab of either sex, king crab
GROUP = {'Torsk': 'torsk', 'Hyse': 'hyse', 'Sei': 'sei', 'Taskekrabbe': 'krabbe', 'Kongekrabbe, han': 'kongekrabbe', 'Kongekrabbe, annen': 'kongekrabbe'}
ART = {'Lyr': 'lyr', 'Lange': 'lange', 'Brosme': 'brosme', 'Uer (vanlig)': 'uer', 'Kveite': 'kveite'}
def species(art, group): return GROUP.get(group) or ART.get(art)
def get(url, f, **kw):
    if os.path.exists(f): return f
    for i in range(4):
        try:
            r = requests.get(url, timeout=900, stream=True, **kw); r.raise_for_status()
            with open(f + '.part', 'wb') as o:
                for c in r.iter_content(1 << 20): o.write(c)
            os.replace(f + '.part', f); return f
        except requests.RequestException as e:
            print('  retry', url, e); time.sleep(2 ** (i + 1))
    raise SystemExit('could not fetch ' + url)
num = lambda s: float(s.replace(',', '.')) if s not in ('', None) else 0.0
def register():
    f = get(REG, os.path.join(CACHE, 'kjoperregister.csv'))
    rows = list(csv.DictReader(open(f, encoding='utf-8-sig'), delimiter=';'))
    by = {}
    for r in rows:
        mt = (r.get('Godkjenningsnummer Mattilsynet') or '').strip()
        if r['Type'] == 'Hovedenhet' or not mt: continue
        e = by.setdefault(mt, dict(id=mt, n=r['Navn på enhet'], t=r['Type'], k=r['Kommune'], knr=r['Kommune (kode)'], adr=r['Adresse'], ll=None, src=None))
        if r['Breddegrad'] and r['Lengdegrad'] and not e['ll']: e['ll'] = [round(float(r['Breddegrad']), 5), round(float(r['Lengdegrad']), 5)]; e['src'] = 'reg'
        if e['t'] != 'Ordinært anlegg' and r['Type'] == 'Ordinært anlegg': e.update(t=r['Type'], n=r['Navn på enhet'], adr=r['Adresse'])
    return by
def rafisklaget():
    f = os.path.join(CACHE, 'rf_mottak.json')
    if not os.path.exists(f):
        d = requests.get(RF, timeout=120).json()
        keep = ('id', 'name', 'lat', 'lng', 'city', 'address', 'orgNumber', 'kjNumber', 'type', 'zone')   # no contact, e-mail or phone
        json.dump([{k: x.get(k) for k in keep} for x in d], open(f, 'w'), ensure_ascii=False)
    return {x['id']: x for x in json.load(open(f))}
def notes(years):
    import pickle
    pk = os.path.join(CACHE, 'agg-' + '-'.join(map(str, years)) + '.pkl')   # the counting takes minutes; kept until the files change
    if os.path.exists(pk) and all(os.path.getmtime(pk) > os.path.getmtime(os.path.join(CACHE, f'fangstdata_{y}.csv.zip')) for y in years if os.path.exists(os.path.join(CACHE, f'fangstdata_{y}.csv.zip'))):
        return pickle.load(open(pk, 'rb'))
    agg = notes_count(years); pickle.dump(agg, open(pk, 'wb')); return agg
def notes_count(years):
    agg = {}; refs = {}
    for y in years:
        f = get(NOTES.format(y), os.path.join(CACHE, f'fangstdata_{y}.csv.zip'))
        z = zipfile.ZipFile(f); t = io.TextIOWrapper(z.open(z.namelist()[0]), encoding='utf-8-sig', newline='')
        rd = csv.reader(t, delimiter=';'); h = [c.strip('"') for c in next(rd)]; ix = {c: i for i, c in enumerate(h)}
        I = lambda c: ix[c]
        iAG = I('Art - gruppe')
        iM, iA, iW, iV, iT, iL, iG, iLen, iMon, iDoc, iBoat, iNat = (I('Mottaksstasjon'), I('Art - FDIR'), I('Rundvekt'), I('Beløp for fisker'), I('Produkttilstand (kode)'),
            I('Landingsmåte (kode)'), I('Redskap - hovedgruppe'), I('Største lengde'), I('Landingsmåned (kode)'), I('Dokumentnummer'), I('Fartøy ID'), I('Landingsnasjon (kode)'))
        n = 0; t0 = time.time()
        for r in rd:
            n += 1
            if r[iNat].strip('"') != 'NOR': continue
            mt = r[iM].strip('"')
            if not mt: continue
            e = agg.setdefault(mt, dict(kg=0.0, docs=set(), boats=set(), sp={}, gear={}, small=0.0))
            kg = num(r[iW]); e['kg'] += kg; e['docs'].add(r[iDoc]); e['boats'].add(r[iBoat])
            g = r[iG].strip('"'); e['gear'][g] = e['gear'].get(g, 0.0) + kg
            if 0 < num(r[iLen]) < 15: e['small'] += kg
            sp = species(r[iA].strip('"'), r[iAG].strip('"'))
            if sp:
                s = e['sp'].setdefault(sp, [0.0, 0.0, 0.0, 0]); m = r[iMon].strip('"'); v = num(r[iV])
                ref = refs.setdefault((y, m, sp), [0.0, 0.0]); ref[0] += kg; ref[1] += v
                if kg > 0 and v > 0: pv = e.setdefault('pv', {}).setdefault((y, m, sp), [0.0, 0.0]); pv[0] += kg; pv[1] += v
                s[0] += kg
                if r[iT].strip('"') == '100' or r[iL].strip('"') in ('1', '10', '15'): s[1] += kg
                if m.isdigit() and 1 <= int(m) <= 12: s[3] |= 1 << (int(m) - 1)      # 13 is 'landed the next year'
        print(f'{y}: {n} lines, {len(agg)} receivers, {time.time() - t0:.0f} s', flush=True)
    # the price index: the receiver's value against the same kilos at the month's average price for the species
    for e in agg.values():
        got = {}; exp = {}
        for (y, m, sp), (kg, v) in e.pop('pv', {}).items():
            rk, rv = refs[(y, m, sp)]
            got[sp] = got.get(sp, 0.0) + v; exp[sp] = exp.get(sp, 0.0) + kg * rv / rk
        for sp, s in e['sp'].items(): s[2] = got[sp] / exp[sp] if exp.get(sp) else 0.0
        e['docs'] = len(e['docs']); e['boats'] = len(e['boats'])
    return agg
# the quay faces along the coast from the game's vector packs (tools/map/vectors.py 'quay': X, Y u16 m from the tile's corner, the
# normal's angle u16 of 2 pi, length u8 as qlen, depth u8 in quarter metres, kind u8: 0 pier, 1 pier line, 2 quay, 3 coast)
def quay_faces(md):
    import zlib, numpy as np
    man = json.load(open(os.path.join(md, 'manifest.json'))); X, Y, A, Ln, D, K = [], [], [], [], [], []
    for pk in man['packs']:
        if pk['kind'] != 'vec': continue
        data = open(os.path.join(md, pk['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); at = 8 + hl
        for l, bx, by, off, ln, *cnt in head['blocks']:
            if l != 'quay' or not cnt or not cnt[0]: continue
            n = cnt[0]; b = zlib.decompress(data[at + off:at + off + ln], -15); tx, ty = bx // 5, by // 5
            x = np.frombuffer(b, np.uint16, n, 0); y = np.frombuffer(b, np.uint16, n, 2 * n); a = np.frombuffer(b, np.uint16, n, 4 * n)
            q = np.frombuffer(b, np.uint8, n, 6 * n).astype(float); d = np.frombuffer(b, np.uint8, n, 7 * n); k = np.frombuffer(b, np.uint8, n, 8 * n)
            X.append(tx * 50 + x / 1000); Y.append(ty * 50 + y / 1000); A.append(a / 65536 * 2 * math.pi)
            Ln.append(np.where(q < 160, q / 2, 80 + (q - 160) * 2)); D.append(d / 4); K.append(k)
    import numpy as np
    return tuple(np.concatenate(v) for v in (X, Y, A, Ln, D, K)) if X else None
# the receiver's quay: the nearest face within 600 m, a quay or a pier of 15 m and more with 2 m of water before anything else
def snap(Q, x, y):
    import numpy as np
    X, Y, A, Ln, D, K = Q; d = np.hypot(X - x, Y - y); near = np.nonzero(d < 0.6)[0]
    if not len(near): return None
    good = near[(Ln[near] >= 15) & ((D[near] >= 2) | (D[near] == 0)) & (K[near] != 3)]
    pick = good if len(good) else near
    i = pick[np.argmin(d[pick] + (K[pick] == 3) * 0.2)]
    return [round(float(X[i]), 4), round(float(Y[i]), 4), round(float(A[i]), 3), round(float(Ln[i]), 1), round(float(D[i]), 2), int(K[i]), round(float(d[i]) * 1000)]
def geocode(e):
    try:
        r = requests.get(ADR, params=dict(sok=e['adr'], kommunenummer=e['knr'], treffPerSide=1), timeout=30).json()
        a = r.get('adresser') or []
        if a: p = a[0]['representasjonspunkt']; return [round(p['lat'], 5), round(p['lon'], 5)]
    except (requests.RequestException, ValueError, KeyError): pass
    return None
def main():
    Y = int(time.strftime('%Y')); years = [int(a) for a in sys.argv[1:]] or [Y - 2, Y - 1]
    os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    reg = register(); rf = rafisklaget(); agg = notes(years); ny = len(years)
    sys.path.insert(0, os.path.join(ROOT, 'tools', 'map')); import frame
    md = os.environ.get('KYST_MAP') or os.path.join(ROOT, 'tools', 'map', 'out', 'game'); Q = quay_faces(md) if os.path.exists(os.path.join(md, 'manifest.json')) else None
    out = []; nogeo = 0
    for mt, a in agg.items():
        e = reg.get(mt); f = rf.get(mt)
        if not e and not f: continue
        e = dict(e) if e else dict(id=mt, n=f['name'], t='Ordinært anlegg', k=f.get('city'), knr=None, adr=f.get('address'), ll=None, src=None)
        # the register leaves some types untranslated (cold stores and terminals mostly): a plant if Råfisklaget lists it as one
        if e['t'] == 'NOT_TRANSLATED': e['t'] = 'Ordinært anlegg' if f and f.get('type') == 'Fiskemottak' else 'Annet anlegg'
        if not e['ll'] and f and f.get('lat'): e['ll'] = [f['lat'], f['lng']]; e['src'] = 'rf'
        if not e['ll'] and e.get('adr') and e.get('knr'): e['ll'] = geocode(e); e['src'] = 'adr' if e['ll'] else None
        if not e['ll']: nogeo += 1; continue
        kg = a['kg'] / ny
        sp = {k: [round(v[0] / ny), round(v[1] / v[0], 2) if v[0] else 0, round(v[2], 2), v[3]] for k, v in a['sp'].items() if v[0] / ny >= 50}
        gear = {k: round(v / a['kg'], 3) for k, v in sorted(a['gear'].items(), key=lambda kv: -kv[1]) if a['kg'] and v / a['kg'] >= 0.02}
        x, y = frame.to_nat(e['ll'][1], e['ll'][0]); x, y = float(x), float(y)
        out.append(dict(id=mt, n=e['n'], t=e['t'], k=e['k'], ll=e['ll'], p=[round(x, 4), round(y, 4)], q=snap(Q, x, y) if Q else None, src=e['src'], kg=round(kg), n_land=round(a['docs'] / ny), boats=round(a['boats'] / ny),
                        sp=sp, gear=gear, small=round(a['small'] / a['kg'], 3) if a['kg'] else 0, rf=[f['type'], f['zone']] if f else None))
    out.sort(key=lambda x: -x['kg'])
    meta = dict(made=time.strftime('%Y-%m-%d'), years=years, src='Fiskeridirektoratet: kjøperregisteret og fangstdata (seddel), NLOD; Norges Råfisklag: mottakskartet',
                n=len(out), nogeo=nogeo)
    json.dump(dict(meta=meta, m=out), open(os.environ.get('KYST_MOTTAK') or os.path.join(OUT, 'mottak.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    game = [x for x in out if any(s in x['sp'] for s in ('torsk', 'hyse', 'sei', 'krabbe', 'kongekrabbe', 'kveite')) and x['t'] in ('Ordinært anlegg', 'Kaiselger')]
    print(json.dumps(meta, ensure_ascii=False), 'with the game\'s species at a fixed place:', len(game), 'of them at a quay:', sum(1 for x in game if x['q']))
if __name__ == '__main__': main()
