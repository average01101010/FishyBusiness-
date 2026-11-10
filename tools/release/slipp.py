#!/usr/bin/env python3
"""The release to production (L1b, 10.11.2026, docs/planer/lansering-plan.md; Jonas' V1 A and V2 A the same day).

`main` is the production: detstorebla.no changes only when `main` moves. A release is the pull request «Slipp <dato>» from the
working branch to `main`, and this writes it: the commits since the last release, the patch notes that come with it (new ids in
PATCH in src/js/ui/phone/07-patch.js), the migrations that must be run in production BEFORE the release (new or changed files in
supabase/migrations/), the Edge Functions that must be deployed there, and a red line on top when the release touches real money
(the shop, the buy moment, shop_* in the database, the shop-* and stripe-* functions) or src/legal/. Such a release always waits
for Jonas (CLAUDE.md).

    python3 tools/release/slipp.py --dry             the description only, nothing is made (--out FILE writes it to a file too)
    python3 tools/release/slipp.py                   makes or updates the pull request with gh; without gh it writes the description
                                                     to --out (default slipp.md) for the GitHub tool create_pull_request
    python3 tools/release/slipp.py --dry --last 10   the last ten commits of the working branch, as if they were the release
    python3 tools/release/slipp.py --auto            the gate for a release nobody asked for (V2 A): exits 1 unless it is 03-05
                                                     Norwegian time, the test edition has stood six hours and nothing waits for Jonas
    --base REF / --head REF                          other ends than origin/main and origin/ccr-5e1ba2f4-pusvyd
    --json                                           what it found as JSON on the last line (money, legal, migrations, ...)

It never merges and never pushes: who moves `main` stands in tools/plan/RUTINE.md («Slippet») and docs/systemer/publisering.md.
"""
import argparse, datetime, json, os, re, subprocess, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPO = 'average01101010/FishyBusiness-'
WORK, PROD = 'ccr-5e1ba2f4-pusvyd', 'main'
PATCH_FILE = 'src/js/ui/phone/07-patch.js'
# real money and the legal pages (CLAUDE.md: never rolled out before Jonas has seen the PR)
MONEY = re.compile(r'^(src/js/ui/10i-shop\.js|src/js/ui/10q-buymoment\.js|supabase/functions/(shop-|stripe-)[^/]*/)')
LEGAL = re.compile(r'^src/legal/')
SHOP_SQL = re.compile(r'\bshop_[a-z0-9_]+')          # shop_* in the database: a migration or a function that names one
PATCH_ID = re.compile(r"^\s*\['([A-Za-z0-9_.-]+)', '([^']*)', '((?:[^'\\]|\\.)*)', ")
EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
MAX_COMMITS, MAX_NOTES = 120, 40                     # a pull request's text holds 65 536 characters; the first release has thousands of commits
TEST_URL, PROD_URL = 'https://test.detstorebla.no/version.json', 'https://detstorebla.no/version.json'
HOURS_ON_TEST = 6                                    # V2 A: the test edition must have stood this long
NIGHT = (3, 5)                                       # V2 A: 03-05 Norwegian time


def git(*a, ok=True):
    r = subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True)
    if ok and r.returncode: sys.exit('git %s: %s' % (' '.join(a), r.stderr.strip()))
    return r.stdout


def has(ref):
    return subprocess.run(['git', 'rev-parse', '--verify', '-q', ref + '^{commit}'], cwd=ROOT, capture_output=True).returncode == 0


def patch_ids(ref):
    """The patch notes at ref, newest first: [(id, date, Norwegian title)]. [] when the file is not there (an empty main)."""
    r = subprocess.run(['git', 'show', ref + ':' + PATCH_FILE], cwd=ROOT, capture_output=True, text=True)
    if r.returncode: return []
    return [(m.group(1), m.group(2), m.group(3).replace("\\'", "'")) for m in map(PATCH_ID.match, r.stdout.splitlines()) if m]


def commits(rng, last=0):
    """The commits of the range that are not merges, newest first, each with its files and whether its own diff names shop_* in supabase/."""
    args = ['log', '--no-merges', '--format=\x01%h\x02%s', '--name-only'] + (['-%d' % last] if last else []) + [rng]
    out = []
    for blk in git(*args).split('\x01')[1:]:
        head, _, rest = blk.partition('\n')
        h, s = head.split('\x02', 1)
        out.append({'h': h, 's': s.strip(), 'files': [f for f in rest.splitlines() if f.strip()], 'shop_sql': False})
    # one pass over the same commits' diffs in supabase/ for shop_* (added or removed lines)
    by = {c['h']: c for c in out}
    args = ['log', '--no-merges', '--format=\x01%h', '-p', '--unified=0'] + (['-%d' % last] if last else []) + [rng, '--', 'supabase/']
    for blk in git(*args).split('\x01')[1:]:
        h, _, diff = blk.partition('\n')
        if h in by and any(l[:1] in '+-' and not l.startswith(('+++', '---')) and SHOP_SQL.search(l) for l in diff.splitlines()):
            by[h]['shop_sql'] = True
    return out


def why(c):
    """'' or why this commit waits for Jonas."""
    w = []
    if any(MONEY.match(f) for f in c['files']) or c['shop_sql']: w.append('ekte penger')
    if any(LEGAL.match(f) for f in c['files']): w.append('src/legal/')
    return ' og '.join(w)


def version(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'slipp.py'}), timeout=15) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        return {'err': str(e)[:120]}


def oslo_now():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo('Europe/Oslo'))
    except Exception:                                 # (no tz database: winter time, UTC+1)
        return datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)


def main():
    ap = argparse.ArgumentParser(description='Slipp-PR-en fra arbeidsgrenen til main (L1b)')
    ap.add_argument('--dry', action='store_true'); ap.add_argument('--auto', action='store_true'); ap.add_argument('--json', action='store_true')
    ap.add_argument('--base', default='origin/' + PROD); ap.add_argument('--head', default='origin/' + WORK)
    ap.add_argument('--last', type=int, default=0); ap.add_argument('--out', default=''); ap.add_argument('--no-fetch', action='store_true')
    ap.add_argument('--offline', action='store_true', help='do not ask the two version.json')
    a = ap.parse_args()

    if not a.no_fetch and not a.last:
        for ref, br in ((a.base, PROD), (a.head, WORK)):
            if ref == 'origin/' + br: subprocess.run(['git', 'fetch', '-q', 'origin', br], cwd=ROOT)
    if not has(a.head): sys.exit('Finner ikke %s (git fetch origin %s)' % (a.head, WORK))
    head = git('rev-parse', a.head).strip()

    if a.last:                                        # the last N commits as if they were the release: no base tree, the commits' own files
        cs = commits(a.head, a.last); base = None; base_desc = 'de siste %d commitene på %s' % (a.last, a.head)
        files = sorted({f for c in cs for f in c['files']})
        status = {f: 'M' for f in files}
        old_ids = set()
        new_ids = []                                  # (a patch note is new when one of the commits added its line)
        added = git('log', '--no-merges', '-%d' % a.last, '--format=', '-p', '--unified=0', a.head, '--', PATCH_FILE)
        for l in added.splitlines():
            m = PATCH_ID.match(l[1:]) if l.startswith('+') and not l.startswith('+++') else None
            if m: new_ids.append((m.group(1), m.group(2), m.group(3).replace("\\'", "'")))
        mig_new = sorted({f for c in cs for f in c['files'] if f.startswith('supabase/migrations/')}); mig_chg = []
    else:
        if not has(a.base): sys.exit('Finner ikke %s (git fetch origin %s)' % (a.base, PROD))
        if subprocess.run(['git', 'merge-base', '--is-ancestor', a.head, a.base], cwd=ROOT).returncode == 0:
            print('Ingenting å slippe: %s har alt som står på %s.' % (a.base, a.head)); return 0
        mb = git('merge-base', a.base, a.head, ok=False).strip()
        if not mb: sys.exit('%s og %s har ingen felles historie: et slipp må kunne flyttes framover.' % (a.base, a.head))
        base = git('rev-parse', a.base).strip()
        # the tree of main against the tree of the head: this is what the players get that they do not have
        status = {}
        for l in git('diff', '--name-status', '--no-renames', base, head).splitlines():
            st, f = l.split('\t', 1); status[f] = st[0]
        files = sorted(status)
        cs = commits(base + '..' + head)
        old_ids = {i for i, _, _ in patch_ids(base)}
        new_ids = [p for p in patch_ids(head) if p[0] not in old_ids]
        mig_new = [f for f in files if f.startswith('supabase/migrations/') and status[f] == 'A']
        mig_chg = [f for f in files if f.startswith('supabase/migrations/') and status[f] == 'M']
        base_desc = '`%s` (%s)' % (PROD, base[:8])

    first = not a.last and not git('ls-tree', '-r', '--name-only', base, '--', 'src/').strip()   # main has no game yet: the first release
    money_files = [f for f in files if MONEY.match(f)]
    legal_files = [f for f in files if LEGAL.match(f)]
    # shop_* in the database: over the whole range (the tree diff), so a merge that brought it is seen too
    shop_sql = []
    if base:
        for f in files:
            if not f.startswith('supabase/') or MONEY.match(f): continue
            d = git('diff', '--unified=0', base, head, '--', f, ok=False)
            if any(l[:1] in '+-' and not l.startswith(('+++', '---')) and SHOP_SQL.search(l) for l in d.splitlines()): shop_sql.append(f)
    else:
        shop_sql = sorted({f for c in cs if c['shop_sql'] for f in c['files'] if f.startswith('supabase/') and not MONEY.match(f)})
    marked = [(c, why(c)) for c in cs]
    money = bool(money_files or shop_sql or any('ekte penger' in w for _, w in marked))
    legal = bool(legal_files)
    funcs = sorted({f.split('/')[2] for f in files if f.startswith('supabase/functions/') and f.count('/') >= 3 and f.split('/')[2] != '_shared'})
    shared = any(f.startswith('supabase/functions/_shared/') for f in files)
    server = [f for f in files if f.startswith('tools/server/') and not f.startswith('tools/server/rt/')]

    tv, pv = ({}, {}) if a.offline else (version(TEST_URL), version(PROD_URL))
    now = oslo_now(); hours = None
    if tv.get('at'):
        try: hours = (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(tv['at'].replace('Z', '+00:00'))).total_seconds() / 3600
        except Exception: hours = None

    date = now.strftime('%d.%m.%Y')
    title = 'Slipp %s' % date
    L = []
    if money or legal:
        what = ' og '.join(x for x in ('ekte penger' if money else '', '`src/legal/`' if legal else '') if x)
        L += ['> 🔴 **VENTER PÅ JONAS: slippet rører %s.** Det flettes ikke av en økt eller en rutine før Jonas har sett PR-en (`CLAUDE.md`).' % what]
        for f in (money_files + shop_sql + legal_files)[:20]: L.append('> - `%s`' % f)
        if len(money_files + shop_sql + legal_files) > 20: L.append('> - … og %d filer til' % (len(money_files + shop_sql + legal_files) - 20))
        L.append('')
    L += ['Slippet til produksjonen (`tools/release/slipp.py`, L1b): `%s` flyttes fram til `%s` på arbeidsgrenen `%s`, og detstorebla.no får det som står der.' % (PROD, head[:8], WORK), '',
          '- Fra: %s%s' % (base_desc, ', som er tom: **dette er det første slippet**' if first else ''),
          '- Til: `%s` (%s)' % (head[:8], git('log', '-1', '--format=%s', head).strip()[:100]),
          '- Commits: %d, filer endret: %d' % (len(cs), len(files))]
    if tv or pv:
        L.append('- Testutgaven: versjon `%s`%s. Produksjonen nå: versjon `%s`.' % (tv.get('v', tv.get('err', '?')), ', bygd for %.1f timer siden' % hours if hours is not None else '', pv.get('v', pv.get('err', '?'))))
    L += ['', '## Før slippet (i denne rekkefølgen)', '']
    n = 1
    if mig_new or mig_chg:
        L.append('%d. **Migreringene kjøres i produksjon (`xcqbqzrsgycpeoyclakm`) før `main` flyttes, aldri etter**, i denne rekkefølgen:' % n); n += 1
        if first: L.append('   - `main` er tom, så lista er alle migreringene i repoet. Bare de som ikke står i produksjonens `list_migrations`, kjøres.')
        show = mig_new if len(mig_new) <= 30 else mig_new[-30:]
        if len(mig_new) > 30: L.append('   - … %d eldre (fra `%s`), og de 30 nyeste:' % (len(mig_new) - 30, os.path.basename(mig_new[0])))
        for f in show: L.append('   - `%s`' % os.path.basename(f))
        for f in mig_chg: L.append('   - `%s` (**endret** etter at den ble skrevet: les diffen før den kjøres på nytt)' % os.path.basename(f))
    else:
        L.append('%d. Ingen nye migreringer.' % n); n += 1
    if funcs or shared:
        L.append('%d. **Edge Functions deployes i produksjon:** %s%s.' % (n, ', '.join('`%s`' % f for f in funcs) or 'alle som bruker `_shared/`', ' (og `_shared/` er endret: alle som bruker den)' if shared and funcs else '')); n += 1
    if server:
        L.append('%d. **`setup.sh` kjøres på serveren som root** (utrullingen tar ikke Caddyfilen og tjenestene): %s.' % (n, ', '.join('`%s`' % f for f in server[:6]))); n += 1
    L.append('%d. Porten: «Appen på Hetzner» grønn på `%s`, testutgaven har stått minst %d timer uten en ny feil i feilvarselet, og lagringsporten (når den finnes, L1c) er grønn.' % (n, head[:8], HOURS_ON_TEST)); n += 1
    L.append('%d. `main` flyttes fram til `%s` (ikke squash, ikke rebase: commitene skal være de samme som på arbeidsgrenen).' % (n, head[:8])); n += 1
    L.append('%d. Etterpå: «Appen på Hetzner» på `main` grønn, og `https://detstorebla.no/version.json` har ny versjon uten `ch`.' % n)
    L += ['', '## Patchnotatene som kommer med (%d)' % len(new_ids), '']
    for i, d, t in new_ids[:MAX_NOTES]: L.append('- %s: %s (`%s`)' % (d, t, i))
    if len(new_ids) > MAX_NOTES: L.append('- … og %d eldre' % (len(new_ids) - MAX_NOTES))
    if not new_ids: L.append('Ingen.')
    L += ['', '## Commitene siden forrige slipp (%d, uten flettingene)' % len(cs), '']
    hot = [(c, w) for c, w in marked if w]
    if hot:
        L.append('Merket 🔴 rører ekte penger eller `src/legal/` (%d):' % len(hot)); L.append('')
        for c, w in hot[:40]: L.append('- 🔴 `%s` %s (**%s**)' % (c['h'], c['s'][:140], w))
        if len(hot) > 40: L.append('- … og %d til' % (len(hot) - 40))
        L.append('')
    for c, w in marked[:MAX_COMMITS]: L.append('- %s`%s` %s' % ('🔴 ' if w else '', c['h'], c['s'][:140]))
    if len(cs) > MAX_COMMITS: L.append('- … og %d eldre (`git log --no-merges %s`)' % (len(cs) - MAX_COMMITS, (base[:8] + '..' + head[:8]) if base else a.head))
    L += ['', '## Tilbake', '', 'Et slipp som viser seg å være galt: «Appen på Hetzner» startes for hånd på forrige slipps commit%s (`docs/systemer/publisering.md`, «Slippet»).' % (' (`%s`)' % base[:8] if base and not first else ''), '',
          '🤖 Generated with [Claude Code](https://claude.com/claude-code)']
    body = '\n'.join(L) + '\n'

    # the gate for a release nobody asked for (V2 A)
    stop = []
    if money: stop.append('rører ekte penger: venter på Jonas')
    if legal: stop.append('rører src/legal/: venter på Jonas')
    if not (NIGHT[0] <= now.hour < NIGHT[1]): stop.append('klokka er %s norsk tid, slippet går %02d–%02d' % (now.strftime('%H:%M'), NIGHT[0], NIGHT[1]))
    if hours is None: stop.append('testutgavens alder er ukjent (%s)' % (tv.get('err') or 'ikke spurt'))
    elif hours < HOURS_ON_TEST: stop.append('testutgaven har stått %.1f timer, kravet er %d' % (hours, HOURS_ON_TEST))
    if mig_new or mig_chg: stop.append('%d migrering(er) må kjøres i produksjon først' % len(mig_new + mig_chg))

    print(title); print(); print(body)
    out = a.out or ('' if a.dry else 'slipp.md')
    if out:
        with open(out, 'w', encoding='utf-8') as f: f.write(body)
    if money or legal: print('VENTER PÅ JONAS: slippet rører %s.' % ('ekte penger' if money else 'src/legal/'))
    if a.auto or a.dry:
        print('Automatisk slipp (V2 A): ' + ('porten her holder; resten står i tools/plan/RUTINE.md («Slippet»).' if not stop else 'NEI: ' + '; '.join(stop) + '.'))
    code = 1 if a.auto and stop else 0
    if a.json:
        print(json.dumps({'title': title, 'base': base, 'head': head, 'commits': len(cs), 'first': first, 'money': money, 'legal': legal,
                          'marked': [c['h'] for c, w in marked if w], 'migrations': [os.path.basename(f) for f in mig_new + mig_chg], 'functions': funcs,
                          'notes': [i for i, _, _ in new_ids], 'test': tv, 'prod': pv, 'hours_on_test': hours, 'stop': stop}, ensure_ascii=False))
    if a.dry or a.last or (a.auto and stop): return code

    # the pull request: made or updated with gh where it is there; else the description stands in the file for create_pull_request
    try:
        num = subprocess.run(['gh', 'pr', 'list', '-R', REPO, '--base', PROD, '--head', WORK, '--state', 'open', '--json', 'number', '-q', '.[0].number'],
                             capture_output=True, text=True, timeout=60)
        if num.returncode: raise RuntimeError(num.stderr.strip()[:200])
        if num.stdout.strip():
            r = subprocess.run(['gh', 'pr', 'edit', num.stdout.strip(), '-R', REPO, '--title', title, '--body-file', out], capture_output=True, text=True, timeout=60)
        else:
            r = subprocess.run(['gh', 'pr', 'create', '-R', REPO, '--base', PROD, '--head', WORK, '--title', title, '--body-file', out], capture_output=True, text=True, timeout=60)
        if r.returncode: raise RuntimeError(r.stderr.strip()[:200])
        print('PR-en: ' + (r.stdout.strip() or '#' + num.stdout.strip()))
    except Exception as e:
        print('gh laget ikke PR-en (%s). Beskrivelsen står i %s: lag den med GitHub-verktøyet (create_pull_request, base %s, head %s, tittel «%s»), eller oppdater den åpne (update_pull_request).' % (e, out, PROD, WORK, title))
        return 3
    return code


if __name__ == '__main__':
    sys.exit(main())
