#!/usr/bin/env python3
"""Taket: how many steps wait for Jonas to look at them?

Counts the files in docs/spill-dette/ (one per step; the coordinator moves the
ones Jonas has seen to sett.md and deletes the file). Files first committed
before FRA (12.11.2026, Jonas: «Tell fra i dag») are the old pile and do not
count against the cap. Exits 1 when more than TAK new ones wait.

    python3 tools/plan/venter.py            # the count; exit 1 over the cap
    python3 tools/plan/venter.py --liste    # also writes docs/spill-dette/SAMLET.md,
                                            # every line sorted by where in the game
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIR = os.path.join(ROOT, 'docs', 'spill-dette')
FRA = '2026-11-12'
TAK = 5
ANNET = 'Annet, og det du skal si fra om'
SKIP = {'README.md', 'sett.md', 'SAMLET.md'}
STEDER = [
    ('Til havs (havbåtene)', r'til havs|havbåt|autoline|snøkrabbe|tråler|ringnot'),
    ('Telefonen, kartet og driftsplanen', r'telefon|app\b|appen|kartet|driftsplan|kystposten|menyen|innstilling|kvote|bank|skuff'
     r'|rederi|nettet|loggbok|regler|skjema|ark\b|toast|megler|hjemler|konto|rutekort|trykk på'),
    ('Ved kai, mottaket, verftet og butikken', r'kai|havn|mottak|lever|verft|butikk|naust|rorbu|fortøy|lossing|kjøp|disken|puben'),
    ('På feltet og under seiling', r'felt|sjø|seil|fisk|setter|haler|garn|line|teine|juks|om bord|dekk|natt|vær|bølg|fart'
     r'|sund|straum|strøm|ferje|roret|broa|sløy|kar\b|mannskap|sjark|kyst15|kyst21|anker|ruta|3d|grafikk|bildetakt'
     r'|senja|bodø|bergen|tromsø|finnmark|finnsnes|båtsfjord|kristiansand|vannlinja|ved '),
]


def first_date(name):
    out = subprocess.run(['git', 'log', '--diff-filter=A', '--follow', '--format=%ad', '--date=short', '--',
                          os.path.join('docs', 'spill-dette', name)], cwd=ROOT, capture_output=True, text=True).stdout.split()
    return out[-1] if out else '9999-99-99'   # not committed yet: new


files = sorted(f for f in os.listdir(DIR) if f.endswith('.md') and f not in SKIP)
dates = {f: first_date(f) for f in files}
new = [f for f in files if dates[f] >= FRA]
old = [f for f in files if dates[f] < FRA]

if '--liste' in sys.argv:
    buckets = {s: [] for s, _ in STEDER}
    buckets[ANNET] = []
    for f in files:
        txt = open(os.path.join(DIR, f), encoding='utf-8').read().split('\n')
        title = next((l[2:].strip() for l in txt if l.startswith('# ')), f)
        for l in txt:
            if not l.startswith('- '):
                continue
            m = re.match(r'- \*\*(.+?)\*\*', l)
            where = (m.group(1) if m else l[:80]).lower()
            for s, rx in STEDER:
                if re.search(rx, where):
                    break
            else:
                s = ANNET
            buckets[s].append('- _%s_ (`%s`%s): %s' % (title, f, '' if f in old else ', ny', l[2:]))
    out = ['# Spill dette, samlet', '',
           'Skrevet av `python3 tools/plan/venter.py --liste`; rediger ikke for hånd. %d steg venter på at Jonas ser på dem: '
           '%d fra før %s (tas i eget tempo) og %d nye (taket er %d). Sortert etter hvor i spillet det prøves.'
           % (len(files), len(old), FRA, len(new), TAK), '']
    for s in [x for x, _ in STEDER] + [ANNET]:
        if buckets[s]:
            out += ['## ' + s, ''] + buckets[s] + ['']
    open(os.path.join(DIR, 'SAMLET.md'), 'w', encoding='utf-8').write('\n'.join(out))
    print('Skrev docs/spill-dette/SAMLET.md')

print('Venter på at Jonas ser på dem: %d nye (taket er %d), %d fra før %s.' % (len(new), TAK, len(old), FRA))
if new:
    print('   nye: ' + ' '.join(new))
if len(new) > TAK:
    print('FEIL: over taket. Ingen ny runde og ingen steg spilleren merker før Jonas har sett på dem '
          '(docs/spill-dette/SAMLET.md).')
    sys.exit(1)
print('OK under taket')
