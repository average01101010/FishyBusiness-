# The fishing along the coast as it really was (B1 of docs/planer/bestand-og-flaate.md, 01.11.2026): what the Norwegian fleet took, where,
# when, with what and from what size of boat, read from Fiskeridirektoratet's landing notes (sluttsedler, «fangstdata (seddel)», NLOD, the
# same files and cache as tools/mottak/mottak.py), and how many boats each kommune has, read from the vessel register (fartøyregisteret,
# «uttrekk fra fartøyregisteret», frtyweb.tar, NLOD). Out: src/data/fiske.json (KYST_FISKE=<file> writes there instead).
#
#   python3 tools/npc/fiske.py [years ...]      (default the last two whole years; the files are fetched into tools/mottak/cache/)
#
# Only statistics are written: no vessel names, registration marks, call signs, owners, firms or buyers (Jonas 07.10.2026: «Jeg orker
# ikke å bli saksøkt»). The notes and the register carry them; they are never read into the result. The owner files of the register
# (juridisk_enhet.csv, fartoy_eier.csv) are not opened at all.
#
# fiske.json:
#   meta   made, years, ny (number of years), src, the keys below (lg, gear, lok, hom, homOut), tot {sp: {year: kg}} (all of the
#          species by Norwegian vessels that year), chk {year: {key: kg}} (the same filters as Fiskeridirektoratet's weekly statistics,
#          tests/unit/fiske.test.mjs), cover {sp: [12 shares]} (the share of the 578 locations with landings that month), boats {...}
#   sp     {species: {k: [...], h: [...]}}, summed over the years (divide by meta.ny for a year), each a list of areas
#          [area, [12 months]], and each month a flat list of three numbers per cell: [gear × 6 + length group, kg, landings]
#          (gear meta.gear, 8 = mixed: the cells under meta.small kg of the area and month joined, with the length group that had the
#          most of their kilos; length group meta.lg). kg has three significant figures, written 12e4 for 120000 (valid JSON).
#            k  the coast: area = index in meta.lok (the location's code in rules.json), for boats under 28 m where the note has a
#               location of rules.json
#            h  the rest: area = index in meta.hom (the main area): boats of 28 m and over, boats under 28 m whose note has no location
#               of rules.json (lokasjon 00, Barentshavet 20-xx, the North Sea 4x outside the locations), and the ones without a length
#               (leisure, school, research); meta.homOut are the main areas that are not in rules.json (99 unknown)
#          A landing is one boat at one receiver on one day (Fartøy ID, Landingsdato, Mottaksstasjon), counted once per cell.
#   kom    {kommunenummer: [[length group, gear, registered, active, reserve], ...]}: the vessels in the register by their home kommune,
#          their largest length and their main gear (most kilos over the years, all species; meta.gear, or 8 = none landed, meta.komGear8); active
#          is landings in the last year; reserve is boats with landings in the last year that are not in the register now (sold,
#          scrapped, renamed), counted by the kommune on their notes
#   kn     {kommunenummer: name} (the kommune's name as the notes write it)
import os, io, sys, csv, json, time, pickle, tarfile, zipfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak'))
import mottak                                                 # get() and the cache: the same notes as the receivers
CACHE = mottak.CACHE
NOTES = mottak.NOTES
REGISTER = 'https://register.fiskeridir.no/fartoyreg/last/frtyweb.tar'
# the species: the game's (cod of either stock, haddock, saithe, pollack, ling, tusk, common redfish, Atlantic halibut, Greenland halibut,
# brown crab, king crab) and the ones the ocean fleet needs (Norwegian spring-spawning herring, mackerel, snow crab; plan valg 4 = A)
GROUP = {'Torsk': 'torsk', 'Hyse': 'hyse', 'Sei': 'sei', 'Blåkveite': 'blakveite', 'Taskekrabbe': 'krabbe', 'Kongekrabbe, han': 'kongekrabbe',
         'Kongekrabbe, annen': 'kongekrabbe', 'Makrell': 'makrell', 'Snøkrabbe': 'snokrabbe'}
ART = {'Lyr': 'lyr', 'Lange': 'lange', 'Brosme': 'brosme', 'Uer (vanlig)': 'uer', 'Kveite': 'kveite', 'Norsk vårgytende sild': 'sild'}
SPECIES = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'blakveite', 'krabbe', 'kongekrabbe', 'sild', 'makrell', 'snokrabbe']
# the length groups of the notes (Lengdegruppe (kode) 1-5), and 5 for the notes without one
LG = ['<11', '11-14.99', '15-20.99', '21-27.99', '28+', 'ukjent']
# the gear as the game knows it, from the notes' Redskap (kode): hooks split into line and jig
GEAR = ['garn', 'line', 'jukse', 'snurrevad', 'teine', 'tral', 'not', 'annet']
def gear_of(code):
    c = int(code) if code.isdigit() else 80
    if 20 <= c <= 29: return 0
    if c in (33, 34): return 2
    if 30 <= c <= 39: return 1
    if c == 61 or 60 <= c <= 69: return 3
    if 40 <= c <= 49: return 4
    if 50 <= c <= 59: return 5
    if 10 <= c <= 19: return 6
    return 7
# the stock areas Fiskeridirektoratet's weekly statistics count Greenland halibut north of 62° N in (the Northeast Arctic stock):
# the Norwegian zone, Svalbard, the Russian zone and the Loophole, not the British zone or Jan Mayen
BK_ZONES = ('Norges økonomiske sone', 'Fiskevernsonen rundt Svalbard', 'Russlands økonomiske sone', 'Internasjonalt område (NEAFC) - Barentshavet ("Smutthullet")')
CHK = {'torsk': 'torsk_n62', 'hyse': 'hyse_n62', 'sei': 'sei_n62', 'lange': 'lange_n62', 'brosme': 'brosme_n62'}
num = mottak.num
SMALL = 5000                   # kg over the years: smaller cells are joined per area and month (main() below; 1.4 % of the kilos)
def sig3(v):
    """kg to three significant figures (the cells are averages of two years; the third figure is already noise)"""
    v = round(v)
    if v < 1000: return v
    e = len(str(v)) - 3; return round(v / 10 ** e) * 10 ** e
def dumps_short(o):
    """JSON with the trailing zeros of the kilos as an exponent (120000 -> 12e4, valid JSON, JSON.parse reads it as the number)"""
    import re
    return re.sub(r'(?<=[,\[])(\d+?)(0{3,})(?=[,\]])', lambda m: m.group(1) + 'e' + str(len(m.group(2))), json.dumps(o, separators=(',', ':')))

def rules_codes():
    R = json.load(open(os.path.join(ROOT, 'src', 'data', 'rules.json')))
    return [x['c'] for x in R['lok']], [x['c'] for x in R['hom']]

def count(years, lok_ok):
    """One pass over each year's notes: the cells, the totals, the checks and what each vessel did."""
    cells = {}                     # (sp, 'k'|'h', area code, month, gear, lg) -> [kg, {landings}]
    tot = {s: {} for s in SPECIES}; chk = {}
    boats = {}                     # Fartøy ID -> [lg, kommune, {gear: kg}, {years}]
    kn = {}
    for y in years:
        f = mottak.get(NOTES.format(y), os.path.join(CACHE, f'fangstdata_{y}.csv.zip'))
        z = zipfile.ZipFile(f); t = io.TextIOWrapper(z.open(z.namelist()[0]), encoding='utf-8-sig', newline='')
        rd = csv.reader(t, delimiter=';'); h = [c.strip('"') for c in next(rd)]; ix = {c: i for i, c in enumerate(h)}
        I = [ix[c] for c in ('Fartøynasjonalitet (kode)', 'Rundvekt', 'Art - gruppe', 'Art - FDIR', 'Hovedområde (kode)', 'Lokasjon (kode)',
             'Landingsmåned (kode)', 'Redskap (kode)', 'Lengdegruppe (kode)', 'Fartøy ID', 'Landingsdato', 'Mottaksstasjon', 'Dokumentnummer',
             'Nord/sør for 62 grader nord', 'Sone', 'Fartøykommune (kode)', 'Fartøykommune')]
        iNat, iW, iAG, iA, iH, iL, iM, iG, iLG, iB, iD, iMt, iDoc, iN62, iZ, iK, iKn = I
        c = chk.setdefault(y, {}); n = 0; t0 = time.time()
        for r in rd:
            n += 1
            if r[iNat] != 'NOR': continue
            kg = num(r[iW]); g = gear_of(r[iG]); boat = r[iB]
            lg = int(r[iLG]) - 1 if r[iLG] in ('1', '2', '3', '4', '5') else 5
            if boat:
                b = boats.get(boat)
                if not b: b = boats[boat] = [lg, r[iK], {}, set()]
                b[0] = lg if lg < 5 else b[0]; b[1] = r[iK] or b[1]; b[2][g] = b[2].get(g, 0.0) + kg; b[3].add(y)
            if r[iK] and r[iKn]: kn[r[iK]] = r[iKn].strip().title()
            sp = GROUP.get(r[iAG]) or ART.get(r[iA])
            if not sp: continue
            tot[sp][y] = tot[sp].get(y, 0.0) + kg
            n62 = r[iN62].startswith('Nord')
            if n62 and sp in CHK: c[CHK[sp]] = c.get(CHK[sp], 0.0) + kg
            if sp == 'blakveite' and n62 and r[iZ] in BK_ZONES: c['blakveite_nea'] = c.get('blakveite_nea', 0.0) + kg
            m = int(r[iM]) if r[iM].isdigit() else 0
            m = 12 if m == 13 else m                                # 13: caught in the year, landed after it
            if not 1 <= m <= 12: continue
            H = r[iH] or '99'; L = r[iL]
            code = f'{H}-{int(L):02d}' if L.isdigit() and r[iH] else None
            key = (sp, 'k', code, m, g, lg) if lg < 4 and code in lok_ok else (sp, 'h', H, m, g, lg)
            e = cells.get(key)
            if not e: e = cells[key] = [0.0, set()]
            e[0] += kg; e[1].add((boat, r[iD], r[iMt]) if boat else (r[iDoc],))
        print(f'{y}: {n} lines, {len(cells)} cells, {len(boats)} vessels, {time.time() - t0:.0f} s', flush=True)
    for e in cells.values(): e[1] = len(e[1])
    return dict(cells=cells, tot=tot, chk=chk, boats=boats, kn=kn)

def notes(years, lok_ok):
    pk = os.path.join(CACHE, 'fiske-' + '-'.join(map(str, years)) + '.pkl')   # the counting takes minutes; kept until the files change
    src = [os.path.join(CACHE, f'fangstdata_{y}.csv.zip') for y in years]
    if os.path.exists(pk) and all(os.path.exists(f) and os.path.getmtime(pk) > os.path.getmtime(f) for f in src) and os.path.getmtime(pk) > os.path.getmtime(__file__):
        return pickle.load(open(pk, 'rb'))
    agg = count(years, lok_ok); pickle.dump(agg, open(pk, 'wb')); return agg

def register():
    """The vessel register now: id, home kommune, largest length. Nothing else is read (no names, marks, owners)."""
    tf = mottak.get(REGISTER, os.path.join(CACHE, 'frtyweb.tar'))
    with tarfile.open(tf) as t:
        m = next(x for x in t.getmembers() if os.path.basename(x.name) == 'fartoy.csv')
        rows = csv.DictReader(io.TextIOWrapper(t.extractfile(m), encoding='utf-8-sig', newline=''))
        return {r['fartoy_id']: (r['kommunenummer'], num(r['stoerste_lengde'] or '')) for r in rows}

def lg_of(length):
    return 0 if length < 11 else 1 if length < 15 else 2 if length < 21 else 3 if length < 28 else 4

def main():
    Y = int(time.strftime('%Y')); years = [int(a) for a in sys.argv[1:]] or [Y - 2, Y - 1]; ny = len(years); last = max(years)
    os.makedirs(CACHE, exist_ok=True)
    lok_all, hom_all = rules_codes(); lok_ok = set(lok_all)
    agg = notes(years, lok_ok); reg = register()
    # the cells, in a fixed order so the file only changes when the data do
    used_lok = sorted({k[2] for k in agg['cells'] if k[1] == 'k'}); used_hom = sorted({k[2] for k in agg['cells'] if k[1] == 'h'})
    li = {c: i for i, c in enumerate(used_lok)}; hi = {c: i for i, c in enumerate(used_hom)}
    # the small cells (under SMALL kg over the years) of one area and month are joined into one with the gear 8 (mixed) and the length
    # group with the most of their kilos: the place and the month stay, the totals stay, only the split by gear and size goes
    cells = {}
    for key, (kg, n) in agg['cells'].items():
        if kg <= 0 and n == 0: continue
        if kg >= SMALL: cells[key] = [kg, n, None]; continue
        j = key[:4] + (8, -1); e = cells.setdefault(j, [0.0, 0, {}]); e[0] += kg; e[1] += n; e[2][key[5]] = e[2].get(key[5], 0.0) + kg
    sp_out = {}; ncell = 0
    for s in SPECIES:
        o = {'k': {}, 'h': {}}
        for key in sorted((k for k in cells if k[0] == s), key=lambda k: (k[1], k[2], k[3], k[4], k[5])):
            kg, n, by = cells[key]; lg = max(by, key=by.get) if by else key[5]; ncell += 1
            a = li[key[2]] if key[1] == 'k' else hi[key[2]]
            o[key[1]].setdefault(a, [[] for _ in range(12)])[key[3] - 1] += [key[4] * 6 + lg, sig3(kg), n]
        sp_out[s] = {t: [[a, ms] for a, ms in sorted(v.items())] for t, v in o.items()}
    # the coverage: the share of the 578 locations with landings of the species that month (both years together),
    # and of the locations the coast fleet uses at all (any species, any month): most of the others are out at sea, where only boats of
    # 28 m and over fish, and those are counted by main area
    cover = {}; cover_used = {}
    for s in ('torsk', 'sei', 'hyse'):
        per = [sum(1 for a, ms in sp_out[s]['k'] if ms[m]) for m in range(12)]
        cover[s] = [round(p / len(lok_all), 3) for p in per]; cover_used[s] = [round(p / len(used_lok), 3) for p in per]
    # the boats by home kommune, length group and main gear
    kom = {}; nb = dict(registered=len(reg), active=0, reserve=0, nolen=0)
    def main_gear(b): return max(b[2], key=b[2].get) if b and b[2] else 8
    for vid, (knr, length) in reg.items():
        b = agg['boats'].get(vid); act = 1 if b and last in b[3] else 0
        lg = lg_of(length) if length > 0 else (b[0] if b and b[0] < 5 else 0)
        if length <= 0: nb['nolen'] += 1
        e = kom.setdefault(knr, {}).setdefault((lg, main_gear(b)), [0, 0, 0]); e[0] += 1; e[1] += act; nb['active'] += act
    for vid, b in agg['boats'].items():
        if vid in reg or last not in b[3] or not b[1]: continue
        e = kom.setdefault(b[1], {}).setdefault((b[0] if b[0] < 5 else 0, main_gear(b)), [0, 0, 0]); e[2] += 1; nb['reserve'] += 1
    kom_out = {k: [[lg, g] + v for (lg, g), v in sorted(d.items())] for k, d in sorted(kom.items())}
    kn = {k: agg['kn'][k] for k in kom_out if k in agg['kn']}
    meta = dict(made=time.strftime('%Y-%m-%d'), years=years, ny=ny,
                src='Fiskeridirektoratet: fangstdata (seddel) og uttrekk fra fartøyregisteret, NLOD (tools/npc/fiske.py)',
                unit='kg and landings summed over the years; divide by ny for a year', lg=LG, gear=GEAR + ['blandet'], komGear8='ingen landinger', lok=used_lok, hom=used_hom,
                homOut=[h for h in used_hom if h not in set(hom_all)],
                tot={s: {str(y): round(v) for y, v in sorted(agg['tot'][s].items())} for s in SPECIES},
                chk={str(y): {k: round(v) for k, v in sorted(d.items())} for y, d in sorted(agg['chk'].items())}, cover=cover, coverUsed=cover_used, small=SMALL, boats=nb)
    out = os.environ.get('KYST_FISKE') or os.path.join(ROOT, 'src', 'data', 'fiske.json')
    J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    s = '{"meta":' + J(meta) + ',"sp":{' + ','.join(f'"{k}":{{"k":{dumps_short(v["k"])},"h":{dumps_short(v["h"])}}}' for k, v in sp_out.items()) + '},"kom":' + J(kom_out) + ',"kn":' + J(kn) + '}\n'
    open(out, 'w').write(s)
    print(f'{out}: {len(s.encode()) / 1000:.0f} kB, {ncell} cells, '
          f'{len(used_lok)} locations, {len(used_hom)} main areas, {len(kom_out)} kommuner', json.dumps(nb))
    for s_, c in cover.items(): print(' cover', s_, c, 'of the used', cover_used[s_])
    print(' chk', json.dumps(meta['chk']))

if __name__ == '__main__': main()
