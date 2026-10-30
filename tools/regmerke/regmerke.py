"""Registration marks of fishing vessels by municipality, for the paint shop's registration mark (Malerverkstedet, Jonas 06.10.2026).

The mark is the county's letters, a serial number and the municipality's letters (ervervstillatelsesforskriften § 22, FOR-2012-12-07-1144,
lovdata.no), painted on both sides of the hull near the stem, white on black or black on white (§ 23). Which letters a municipality has
is read from Fiskeridirektoratet's landing notes (register.fiskeridir.no/uttrekk/fangstdata_<year>.csv.zip, the same files as
tools/mottak/mottak.py and its cache): for each vessel municipality the letters most of its vessels carry, and the serial numbers in use,
so the game gives a player a number no real vessel there has. Writes src/data/regmerke.json:
  {"meta": {...}, "k": {"<municipality, lower case>": [county letters, municipality letters, [numbers in use, ascending]]}}
Run: python3 tools/regmerke/regmerke.py"""
import collections, csv, io, json, os, re, sys, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(ROOT, 'tools', 'mottak', 'cache'); OUT = os.path.join(ROOT, 'src', 'data', 'regmerke.json')
NOTES = 'https://register.fiskeridir.no/uttrekk/fangstdata_{}.csv.zip'
YEARS = (2024, 2025)
MARK = re.compile(r'^([A-Z]{1,2})\s*0*(\d{1,4})([A-ZÆØÅ]{1,3})$')


def notes(y):
    p = os.path.join(CACHE, 'fangstdata_%d.csv.zip' % y)
    if not os.path.exists(p):
        os.makedirs(CACHE, exist_ok=True); print('henter', NOTES.format(y), file=sys.stderr)
        urllib.request.urlretrieve(NOTES.format(y), p)
    return p


def main():
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
                        'law': 'ervervstillatelsesforskriften §§ 22–23 (FOR-2012-12-07-1144)'}, 'k': out},
              open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(out), 'kommuner,', os.path.getsize(OUT), 'byte ->', OUT)


if __name__ == '__main__':
    main()
