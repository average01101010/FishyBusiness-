#!/usr/bin/env python3
"""Lukkerunden: what did this branch leave open?

Lists the bullets this branch added to docs/BACKLOG.md outside the "Strøket"
sections, and the entries it added under "Valg som venter på Jonas" in
docs/planer/koen.md. Exits 1 when a new backlog bullet has no
"**Åpent fordi:**" (on the line itself or on the top-level bullet it belongs
to) with one of the allowed reasons (CLAUDE.md, "Økta lukker det den åpner").

    python3 tools/plan/lukket.py            # against origin/ccr-5e1ba2f4-pusvyd
    python3 tools/plan/lukket.py <base>     # against another base
"""
import re
import subprocess
import sys

BASE = sys.argv[1] if len(sys.argv) > 1 else 'origin/ccr-5e1ba2f4-pusvyd'
BACKLOG = 'docs/BACKLOG.md'
KOEN = 'docs/planer/koen.md'
TAG = re.compile(r'Åpent fordi:\**\s*`?(Jonas|annen økt|ekte penger eller juss|utenfor repoet)', re.I)
BULLET = re.compile(r'^(\s*)[-*] |^(\s*)\d+\. ')


def git(*a):
    return subprocess.run(('git',) + a, capture_output=True, text=True).stdout


def added(path):
    """Line numbers (1-based, in the working tree file) this branch added."""
    mb = git('merge-base', BASE, 'HEAD').strip() or BASE
    out = set()
    for ln in git('diff', '-U0', mb, '--', path).splitlines():
        m = re.match(r'^@@ -\S+ \+(\d+)(?:,(\d+))? @@', ln)
        if m:
            a, n = int(m.group(1)), int(m.group(2) or 1)
            out.update(range(a, a + n))
    return out


def read(path):
    try:
        return open(path, encoding='utf-8').read().split('\n')
    except OSError:
        return []


bad, ok = [], []
lines = read(BACKLOG)
new = added(BACKLOG)
sect, top = '', None
for i, ln in enumerate(lines, 1):
    if ln.startswith('## '):
        sect, top = ln, None
    if ln.startswith('- ') or ln.startswith('* '):
        top = ln
    if i not in new or not BULLET.match(ln) or not ln.strip():
        continue
    if sect.startswith('## Strøket') or '~~' in ln[:8]:
        continue
    (ok if TAG.search(ln) or (top and TAG.search(top)) else bad).append((i, ln))

valg = []
lines = read(KOEN)
new = added(KOEN)
inn = False
for i, ln in enumerate(lines, 1):
    if ln.startswith('## '):
        inn = ln.startswith('## Valg som venter')
    if inn and i in new and re.match(r'^\d+\. ', ln) and not ln.startswith('~~'):
        valg.append((i, ln))


def show(rows):
    for i, ln in rows:
        print('   %s:%d  %s' % (BACKLOG if rows is not valg else KOEN, i, ln.strip()[:150]))


if ok:
    print('Åpent etter økta, med grunn (%d):' % len(ok))
    show(ok)
if valg:
    print('Nye valg under «Valg som venter på Jonas» (%d). Er Jonas spurt i økta først?' % len(valg))
    show(valg)
if bad:
    print('FEIL: %d nye åpne punkter i backloggen uten «**Åpent fordi:**» '
          '(Jonas, annen økt, ekte penger eller juss, utenfor repoet):' % len(bad))
    show(bad)
    print('Lukk dem i økta (slå opp, mål, rett, spør Jonas), eller skriv grunnen og hva som lukker dem.')
    sys.exit(1)
print('OK lukket: ingen nye åpne punkter uten grunn' + ('' if ok or valg else ', og ingenting åpnet'))
