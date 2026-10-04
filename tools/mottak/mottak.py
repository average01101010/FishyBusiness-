# The fish receivers along the coast (M1 of the rules plan, 05.10.2026): every first-hand buyer's place in Fiskeridirektoratet's buyer
# register (kjøperregisteret, NLOD), with what it has taken in by the landing notes (sluttsedler, «fangstdata (seddel)», NLOD) and, from
# Nordmøre to Finnmark, Norges Råfisklag's own map of its receivers (type and zone). The key between them is Mattilsynet's approval
# number (Mottaksstasjon on the notes). Out: tools/mottak/out/mottak.json (and src/data/mottak.json), one entry per receiver:
#   id (the approval number), n (name), t (type), k (kommune), ll [lat, lon], src ('reg' the register's coordinates, 'adr' the address
#   found in Kartverket's address register, 'rf' Råfisklaget's), sl (sales organisation), kg (all landed, kg a year), n_land (landings a
#   year), boats (vessels a year), sp {species: [kg a year, share live, price index, months as a 12-bit mask]}, gear {group: share},
#   small (share of the landings from boats under 15 m), rf (Råfisklaget's type and zone)
# Personal data in Råfisklaget's map (contact, e-mail, phone) is dropped as it is read.
# Prices have moved a lot over the years (Jonas 05.10.2026), so the notes give no prices in kroner: the price index is what the receiver
# paid for the species against what all receivers paid for it the same month of the same year (1.00 = the average), and the game keeps
# its own prices (Råfisklaget's minimum prices, SPECIES.pm).
#   python3 tools/mottak/mottak.py [years ...]      (default 2024 2025; the files are fetched into tools/mottak/cache/)
import os, io, re, sys, csv, json, time, zipfile, requests
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); CACHE = os.path.join(HERE, 'cache')
OUT = os.path.join(HERE, 'out')
REG = 'https://www.fiskeridir.no/registre/kjoeperregisteret/_/service/no.fiskeridir/download-buyer-list?format=csv&locale=no'
NOTES = 'https://register.fiskeridir.no/uttrekk/fangstdata_{}.csv.zip'
RF = 'https://rafisklaget.no/umbraco/Surface/Map/GetData/'
ADR = 'https://ws.geonorge.no/adresser/v1/sok'
# the game's species by the notes' «Art - FDIR» (and king crab, which is coming)
SPECIES = {'Torsk': 'torsk', 'Skrei': 'torsk', 'Hyse': 'hyse', 'Sei': 'sei', 'Lyr': 'lyr', 'Lange': 'lange', 'Brosme': 'brosme',
           'Uer (vanlig)': 'uer', 'Vanlig uer': 'uer', 'Uer': 'uer', 'Blåkveite': None, 'Kveite': 'kveite', 'Atlantisk kveite': 'kveite',
           'Taskekrabbe': 'krabbe', 'Kongekrabbe, han': 'kongekrabbe', 'Kongekrabbe, hun': 'kongekrabbe', 'Kongekrabbe': 'kongekrabbe'}
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
    agg = {}; refs = {}
    for y in years:
        f = get(NOTES.format(y), os.path.join(CACHE, f'fangstdata_{y}.csv.zip'))
        z = zipfile.ZipFile(f); t = io.TextIOWrapper(z.open(z.namelist()[0]), encoding='utf-8-sig', newline='')
        rd = csv.reader(t, delimiter=';'); h = [c.strip('"') for c in next(rd)]; ix = {c: i for i, c in enumerate(h)}
        I = lambda c: ix[c]
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
            sp = SPECIES.get(r[iA].strip('"'))
            if sp:
                s = e['sp'].setdefault(sp, [0.0, 0.0, 0.0, 0]); m = r[iMon].strip('"'); v = num(r[iV])
                ref = refs.setdefault((y, m, sp), [0.0, 0.0]); ref[0] += kg; ref[1] += v
                if kg > 0 and v > 0: pv = e.setdefault('pv', {}).setdefault((y, m, sp), [0.0, 0.0]); pv[0] += kg; pv[1] += v
                s[0] += kg
                if r[iT].strip('"') == '100' or r[iL].strip('"') in ('1', '10', '15'): s[1] += kg
                s[3] |= 1 << (int(m) - 1) if m.isdigit() else 0
        print(f'{y}: {n} lines, {len(agg)} receivers, {time.time() - t0:.0f} s', flush=True)
    # the price index: the receiver's value against the same kilos at the month's average price for the species
    for e in agg.values():
        got = {}; exp = {}
        for (y, m, sp), (kg, v) in e.pop('pv', {}).items():
            rk, rv = refs[(y, m, sp)]
            got[sp] = got.get(sp, 0.0) + v; exp[sp] = exp.get(sp, 0.0) + kg * rv / rk
        for sp, s in e['sp'].items(): s[2] = got[sp] / exp[sp] if exp.get(sp) else 0.0
    return agg
def geocode(e):
    try:
        r = requests.get(ADR, params=dict(sok=e['adr'], kommunenummer=e['knr'], treffPerSide=1), timeout=30).json()
        a = r.get('adresser') or []
        if a: p = a[0]['representasjonspunkt']; return [round(p['lat'], 5), round(p['lon'], 5)]
    except (requests.RequestException, ValueError, KeyError): pass
    return None
def main():
    years = [int(a) for a in sys.argv[1:]] or [2024, 2025]
    os.makedirs(CACHE, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    reg = register(); rf = rafisklaget(); agg = notes(years); ny = len(years)
    out = []; nogeo = 0
    for mt, a in agg.items():
        e = reg.get(mt); f = rf.get(mt)
        if not e and not f: continue
        e = dict(e) if e else dict(id=mt, n=f['name'], t='Ordinært anlegg', k=f.get('city'), knr=None, adr=f.get('address'), ll=None, src=None)
        if not e['ll'] and f and f.get('lat'): e['ll'] = [f['lat'], f['lng']]; e['src'] = 'rf'
        if not e['ll'] and e.get('adr') and e.get('knr'): e['ll'] = geocode(e); e['src'] = 'adr' if e['ll'] else None
        if not e['ll']: nogeo += 1; continue
        kg = a['kg'] / ny
        sp = {k: [round(v[0] / ny), round(v[1] / v[0], 2) if v[0] else 0, round(v[2], 2), v[3]] for k, v in a['sp'].items() if v[0] / ny >= 50}
        gear = {k: round(v / a['kg'], 3) for k, v in sorted(a['gear'].items(), key=lambda kv: -kv[1]) if a['kg'] and v / a['kg'] >= 0.02}
        out.append(dict(id=mt, n=e['n'], t=e['t'], k=e['k'], ll=e['ll'], src=e['src'], kg=round(kg), n_land=round(len(a['docs']) / ny), boats=round(len(a['boats']) / ny),
                        sp=sp, gear=gear, small=round(a['small'] / a['kg'], 3) if a['kg'] else 0, rf=[f['type'], f['zone']] if f else None))
    out.sort(key=lambda x: -x['kg'])
    meta = dict(made=time.strftime('%Y-%m-%d'), years=years, src='Fiskeridirektoratet: kjøperregisteret og fangstdata (seddel), NLOD; Norges Råfisklag: mottakskartet',
                n=len(out), nogeo=nogeo)
    json.dump(dict(meta=meta, m=out), open(os.path.join(OUT, 'mottak.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    game = [x for x in out if any(s in x['sp'] for s in ('torsk', 'hyse', 'sei', 'krabbe', 'kongekrabbe', 'kveite')) and x['t'] in ('Ordinært anlegg', 'Kaiselger')]
    print(json.dumps(meta, ensure_ascii=False), 'with the game\'s species at a fixed place:', len(game))
if __name__ == '__main__': main()
