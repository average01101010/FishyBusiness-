#!/usr/bin/env python3
"""The gate for a fix that goes out by itself (02.11.2026; Jonas: «jeg vil ha prosessen så helautomatisert som overhodet mulig»).

The feedback routine (tools/feedback/RUTINE.md) opens a PR against the working branch with the label `autofix` when a fix is small and
plain; .github/workflows/autofix.yml runs this on it, and merges and deploys when it passes. It passes only when:

1. Every file is one a fix may touch (ALLOW) and none that must not be touched without Jonas (DENY): the cloud, the shop and payments,
   the consent, the error trap, the privacy and terms pages, the data, the app's worker, the server, the workflows, the database, the
   routines themselves. A fix that needs those goes to Jonas.
2. It is small: at most MAX_LINES lines added and removed together, MAX_FILES files.
3. No added code line does what a fix to the game never needs and an attack would: talk to another host (an address that is not
   detstorebla.no), run text as code (eval, new Function, import()), read cookies, beacons, sockets, new workers, write the document.
   The error list and the feedback that the routine reads come from anyone; this is the guard against a «fix» written by them.
4. No test goes red that is green on the working branch, and a new test is green: the tests that cover the changed files (COVER in
   tests/run.py, as `run.py changed` picks them), run on the PR's build and on the working branch's, side by side, plus the unit tests.

Prints what it found, writes it as JSON (--out) and exits 0 when the fix may go out, 1 when not, 2 on a fault of its own.
"""
import argparse, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ALLOW = re.compile(r'^(src/js/|src/styles\.css$|tests/|docs/)')
DENY = re.compile(r'^(src/js/errtrap\.js|src/js/ui/10f-cloud\.js|src/js/ui/10i-shop\.js|src/js/ui/10q-buymoment\.js|src/js/ui/10g-push\.js|'
                  r'src/js/ui/06e-feedback\.js|src/js/lib/|tests/_env\.py|tests/run\.py|tests/unit/run\.mjs|docs/systemer/tilbakemelding-og-admin\.md)')
MAX_LINES, MAX_FILES = 400, 15
BAD = [(re.compile(r'https?://(?!(www\.)?detstorebla\.no\b)', re.I), 'en adresse til en annen vert'),
       (re.compile(r'\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(\s*[\'"`]|\bimport\s*\('), 'tekst som kjøres som kode'),
       (re.compile(r'document\.cookie|sendBeacon|\bWebSocket\b|new\s+(Shared)?Worker\b|document\.write\b|\bsetTimeout\s*\(\s*[\'"`]'), 'noe en retting av spillet ikke trenger'),
       (re.compile(r'DSB_CLOUD|supabase|cloudRpc|localStorage\.clear|FEEDBACK_AGENT|service_role', re.I), 'skyen, lagringen eller nøklene')]


def git(*a):
    return subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True, check=True).stdout


def results(text):
    """OK/FEIL/LES per test from run.py's summary lines."""
    out = {}
    for l in text.splitlines():
        m = re.match(r'^(OK|FEIL|LES)\s+(\S+)\s+\d+ s', l)
        if m: out[m.group(2)] = m.group(1)
    return out


def run_tests(root, names, env=None):
    if not names: return {}, ''
    p = subprocess.run([sys.executable, os.path.join(root, 'tests', 'run.py'), 'smoke'] + names, cwd=root, capture_output=True, text=True,
                       env=dict(os.environ, **(env or {})))
    return results(p.stdout), p.stdout[-6000:]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--base', default='origin/ccr-5e1ba2f4-pusvyd'); ap.add_argument('--out'); ap.add_argument('--no-tests', action='store_true')
    a = ap.parse_args()
    R = {'ok': False, 'why': [], 'files': [], 'lines': 0, 'bad': [], 'tests': {}}
    mb = git('merge-base', 'HEAD', a.base).strip()
    files = [f for f in git('diff', '--name-only', mb, 'HEAD').split('\n') if f]
    R['files'] = files
    # 1. the files
    for f in files:
        if not ALLOW.match(f) or DENY.match(f): R['why'].append('filen %s er ikke en automatisk retting får endre' % f)
    if not files: R['why'].append('ingen endringer')
    # 2. the size
    for l in git('diff', '--numstat', mb, 'HEAD').split('\n'):
        p = l.split('\t')
        if len(p) == 3: R['lines'] += (int(p[0]) if p[0].isdigit() else 999) + (int(p[1]) if p[1].isdigit() else 999)
    # (a test may be added to, never cut: a fix that makes a test green by taking a check out is not a fix)
    for l in git('diff', '--numstat', '--diff-filter=M', mb, 'HEAD', '--', 'tests/').split('\n'):
        p = l.split('\t')
        if len(p) == 3 and p[1] != '0': R['why'].append('testen %s har fått linjer fjernet (%s)' % (p[2], p[1]))
    if R['lines'] > MAX_LINES: R['why'].append('%d linjer endret, grensen er %d' % (R['lines'], MAX_LINES))
    if len(files) > MAX_FILES: R['why'].append('%d filer endret, grensen er %d' % (len(files), MAX_FILES))
    # 3. what the added code does (comments and docs are left out: a source may be named there)
    for f in files:
        if not f.startswith('src/'): continue
        for l in git('diff', '-U0', mb, 'HEAD', '--', f).split('\n'):
            if not l.startswith('+') or l.startswith('+++'): continue
            code = re.sub(r'//.*$', '', l[1:]).strip()
            if code.startswith('*') or code.startswith('/*'): continue
            for rx, what in BAD:
                if rx.search(code): R['bad'].append('%s: %s: %s' % (f, what, code[:140]))
    if R['bad']: R['why'].append('kode som ikke hører hjemme i en automatisk retting (%d linjer)' % len(R['bad']))
    # 4. the tests, only when the rest holds (they take long)
    if not R['why'] and not a.no_tests:
        sys.path.insert(0, os.path.join(ROOT, 'tests')); import run as RUN
        names = []
        for f in files:
            if f in RUN.COVER: names += RUN.COVER[f]
            elif f.startswith('tests/') and f.endswith('.py') and os.path.basename(f)[:-3] in RUN.D3 + RUN.LITE: names.append(os.path.basename(f)[:-3])
            elif f.startswith('src/'): names.append('trip2')
        names = list(dict.fromkeys(n for n in names if os.path.exists(os.path.join(ROOT, 'tests', n + '.py'))))
        R['tests']['names'] = names
        u = subprocess.run(['node', os.path.join(ROOT, 'tests', 'unit', 'run.mjs')], cwd=ROOT, capture_output=True, text=True)
        R['tests']['unit'] = u.returncode == 0
        if u.returncode: R['why'].append('enhetstestene er røde: ' + (u.stdout.strip().splitlines() or [''])[-1][:200])
        b = subprocess.run(['node', 'build.mjs'], cwd=ROOT, capture_output=True, text=True)
        if b.returncode: R['why'].append('bygget feiler: ' + b.stderr[-300:])
        else:
            mine, log = run_tests(ROOT, names); R['tests']['pr'] = mine
            base_dir = tempfile.mkdtemp(prefix='autofix-base-')
            git('worktree', 'add', '--detach', base_dir, a.base)
            try:
                subprocess.run(['node', 'build.mjs'], cwd=base_dir, capture_output=True, text=True)
                on_base = [n for n in names if os.path.exists(os.path.join(base_dir, 'tests', n + '.py'))]
                base, _ = run_tests(base_dir, on_base); R['tests']['base'] = base
            finally:
                subprocess.run(['git', 'worktree', 'remove', '--force', base_dir], cwd=ROOT, capture_output=True)
            for n in names:
                if mine.get(n) == 'FEIL' and (n not in base or base.get(n) != 'FEIL'):
                    R['why'].append('testen %s er rød med rettingen%s' % (n, '' if n not in base else ', grønn uten'))
                if n not in mine: R['why'].append('testen %s ga ikke noe svar' % n)
            R['tests']['log'] = log
    R['ok'] = not R['why']
    print(('SLIPPES UT' if R['ok'] else 'STOPPET') + ': ' + ('; '.join(R['why']) or 'filene, størrelsen, koden og testene holder'))
    for l in R['bad'][:20]: print('  ' + l)
    if 'pr' in R['tests']: print('tester:', json.dumps({n: [R['tests']['pr'].get(n), R['tests'].get('base', {}).get(n)] for n in R['tests']['names']}, ensure_ascii=False))
    if a.out: json.dump(R, open(a.out, 'w'), ensure_ascii=False, indent=1)
    sys.exit(0 if R['ok'] else 1)


if __name__ == '__main__':
    try: main()
    except subprocess.CalledProcessError as e: print('FEIL i porten:', e, e.stderr); sys.exit(2)
