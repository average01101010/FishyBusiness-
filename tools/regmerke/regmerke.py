"""Registration marks of fishing vessels by municipality, for the paint shop's registration mark (Malerverkstedet, Jonas 06.10.2026).

The mark is the county's letters, a serial number and the municipality's letters (ervervstillatelsesforskriften § 22, FOR-2012-12-07-1144,
lovdata.no), painted on both sides of the hull near the stem, white on black or black on white (§ 23). Which letters a municipality has
is read from Fiskeridirektoratet's landing notes (register.fiskeridir.no/uttrekk/fangstdata_<year>.csv.zip, the same files as
tools/mottak/mottak.py and its cache): for each vessel municipality the letters most of its vessels carry, and the serial numbers in use,
so the game gives a player a number no real vessel there has. Writes src/data/regmerke.json:
  {"meta": {...}, "k": {"<municipality, lower case>": [county letters, municipality letters, [numbers in use, ascending]]},
   "c": {"<two letters>": [four-digit numbers in use, ascending]}}
"c" is the call signs (kjenningssignal, FOR-2002-06-27-754 § 5: two letters and four digits under 15 m, as LK3764) in the same landing
notes' «Radiokallesignal (seddel)», so the game never paints a real vessel's call sign on a player's boat (Ø11.5, 06.11.2026).
Run: python3 tools/regmerke/regmerke.py         (both)
     python3 tools/regmerke/regmerke.py kall    (only "c", the rest of the file as it is)"""
import collections, csv, io, json, os, re, sys, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, 'tools', 'mottak', 'cache'); OUT = os.path.join(ROOT, 'src', 'data', 'regmerke.json')
NOTES = 'https://register.fiskeridir.no/uttrekk/fangstdata_{}.csv.zip'
YEARS = (2024, 2025)
MARK = re.compile(r'^([A-Z]{1,2})\s*0*(\d{1,4})([A-ZÆØÅ]{1,3})$')
CALL = re.compile(r'^([A-Z]{2})(\d{4})$')


def notes(y):
    p = os.path.join(CACHE, 'fangstdata_%d.csv.zip' % y)
    if not os.path.exists(p):
        os.makedirs(CACHE, exist_ok=True); print('henter', NOTES.format(y), file=sys.stderr)
        urllib.request.urlretrieve(NOTES.format(y), p)
    return p


def calls():
    """the call signs of two letters and four digits in the landing notes, any nationality: {letters: [numbers, ascending]}"""
    used = collections.defaultdict(set)
    for y in YEARS:
        z = zipfile.ZipFile(notes(y))
        with z.open(z.namelist()[0]) as f:
            r = csv.reader(io.TextIOWrapper(f, encoding='utf-8-sig'), delimiter=';'); h = next(r); iK = h.index('Radiokallesignal (seddel)')
            for row in r:
                m = CALL.match(row[iK].strip())
                if m: used[m.group(1)].add(int(m.group(2)))
    return {k: sorted(v) for k, v in sorted(used.items())}


def main():
    if 'kall' in sys.argv[1:]:
        d = json.load(open(OUT)); d['c'] = calls(); d['meta']['c'] = 'Fiskeridirektoratet, sluttsedler ' + '–'.join(map(str, YEARS)) + ', radiokallesignal (FOR-2002-06-27-754 § 5)'
        json.dump(d, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
        print(sum(len(v) for v in d['c'].values()), 'kallesignaler,', os.path.getsize(OUT), 'byte ->', OUT); return
    letters = collections.defaultdict(collections.Counter); used = collections.defaultdict(set)
    for y in YEARS:
        z = zipfile.ZipFile(notes(y))
        with z.open(z.namelist()[0]) as f:
            r = csv.reader(io.TextIOWrapper(f, encoding='utf-8-sig'), delimiter=';'); h = next(r)
            iR, iN, iNat = h.index('Registreringsmerke (seddel)'), h.index('Fartøykommune'), h.index('Fartøynasjonalitet (kode)')
            for row in r:
                m = MARK.match(row[iR].strip()); k = row[iN].strip().lower()
                if not m or not k or row[iNat] not in ('NOR', '') or m.group(1) == 'ZZ': continue
                letters[k][(m.group(1), m.group(3))] += 1; used[(m.group(1), m.group(3))].add(int(m.group(2)))
    out = {}
    for k, c in sorted(letters.items()):
        (f, kl), _ = c.most_common(1)[0]
        out[k] = [f, kl, sorted(used[(f, kl)])]
    json.dump({'meta': {'src': 'Fiskeridirektoratet, sluttsedler ' + '–'.join(map(str, YEARS)) + ' (fangstdata), fartøykommune og registreringsmerke',
                        'law': 'ervervstillatelsesforskriften §§ 22–23 (FOR-2012-12-07-1144)'}, 'k': out, 'c': calls()},
              open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'kommuner,', os.path.getsize(OUT), 'byte ->', OUT)


if __name__ == '__main__':
    main()
