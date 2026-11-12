"""Branches from the last week with commits in src/ that are not in the working branch (/okt-slutt point 5, Ø2 05.11.2026).

The old check counted a commit as merged only when a commit with the same message was in the working branch, so seven older branches
whose code came in later in another form, or under other messages, showed up every time. This one looks at the code: a commit counts as
merged when the lines it added in src/ are in the working branch's files now (at least 70 % of them: later commits change some of the lines, and 05.11.2026 the branches merged in another form had 79–93 % while the unmerged ones had 0–18 %; lines under 12 characters, like
`}` or `return;`, are left out, and a line is looked for in the same file now, in what the working branch added to that file the
last 30 days (code that came in and was replaced later), or anywhere in src/ when that file is gone or moved). A commit under 70 %
counts as merged too when it brought at least two new names into src/ (identifiers that were nowhere in src/ before it) and the
working branch has them all.

  python3 .claude/skills/okt-slutt/unmerged.py [--days 7] [-v]
"""
import re, subprocess, sys, time

A = 'origin/ccr-5e1ba2f4-pusvyd'
days = int(sys.argv[sys.argv.index('--days') + 1]) if '--days' in sys.argv else 7
verbose = '-v' in sys.argv


def git(*a):
    return subprocess.run(['git'] + list(a), capture_output=True, text=True, errors='replace').stdout


# a shallow clone (the cloud sessions clone 50 commits deep) has no merge base for the older branches: every one of them then
# showed some 190 commits as missing, and the check ran for over ten minutes instead of 25 seconds (12.11.2026). The whole
# history is fetched first.
if git('rev-parse', '--is-shallow-repository').strip() == 'true': git('fetch', '-q', '--unshallow', 'origin')
git('fetch', '-q', '--prune', 'origin')
cache, allsrc = {}, None


def lines_at(path):
    if path not in cache:
        txt = git('show', A + ':' + path)
        cache[path] = set(l.strip() for l in txt.splitlines()) if txt else None
    return cache[path]


def anywhere():
    global allsrc
    if allsrc is None:
        allsrc = set()
        for f in git('ls-tree', '-r', '--name-only', A, '--', 'src').split():
            if f.endswith(('.js', '.json', '.html', '.css', '.mjs')): allsrc |= lines_at(f) or set()
    return allsrc


hist = {}


def ever(path):
    # the lines the working branch has added to this file the last 30 days: code that came in and was replaced later is merged too
    if path not in hist:
        hist[path] = set(l[1:].strip() for l in git('log', A, '--since=30 days ago', '--format=', '-p', '-U0', '--no-color', '--', path).splitlines()
                         if l.startswith('+') and not l.startswith('+++'))
    return hist[path]


def added(c):
    out, f = {}, None
    for l in git('show', '--format=', '-U0', '--no-color', c, '--', 'src').splitlines():
        if l.startswith('+++ '): f = l[6:] if l.startswith('+++ b/') else None
        elif l.startswith('+') and f and not f.endswith('.b64'):
            s = l[1:].strip()
            if len(s) >= 12: out.setdefault(f, []).append(s)
    return out


IDENT = re.compile(r'\b[A-Za-z_][A-Za-z0-9_]{3,}\b')


def new_names(c):
    # the names the commit brings into src/ (not anywhere in src/ before it): uCD, cdrift. A commit whose new names are all in the
    # working branch came in, even when its long lines were written over later (the cloud on the fells, 37f9a063)
    txt = git('show', '--format=', '-U0', '--no-color', c, '--', 'src')
    plus = set(IDENT.findall('\n'.join(l for l in txt.splitlines() if l.startswith('+') and not l.startswith('+++'))))
    minus = set(IDENT.findall('\n'.join(l for l in txt.splitlines() if l.startswith('-') and not l.startswith('---'))))
    cand = sorted(plus - minus)
    if not cand: return []
    before = set(git('grep', '-I', '-h', '-o', '-w', '-E', '|'.join(cand), c + '^', '--', 'src').split())
    return [w for w in cand if w not in before]


now = None


def names_now():
    global now
    if now is None: now = set(IDENT.findall('\n'.join(anywhere())))
    return now


def merged(c):
    got = n = 0
    for f, ls in added(c).items():
        have = lines_at(f)
        for s in ls:
            n += 1
            if (have is not None and s in have) or s in ever(f) or s in anywhere(): got += 1
    if n == 0 or got / n >= 0.7: return True, got, n
    names = new_names(c)
    if len(names) >= 2 and all(w in names_now() for w in names): return True, got, n
    return False, got, n


since = time.time() - days * 86400
for b in git('for-each-ref', '--sort=-committerdate', '--format=%(refname:short) %(committerdate:unix)', 'refs/remotes/origin').splitlines():
    name, t = b.rsplit(' ', 1)
    if int(t) < since: break
    if name in (A, 'origin/HEAD', 'origin'): continue
    cs = git('log', '--right-only', '--cherry-pick', '--no-merges', '--format=%h', A + '...' + name, '--', 'src').split()
    bad = []
    for c in cs:
        ok, got, n = merged(c)
        if not ok: bad.append((c, got, n))
    if bad:
        print('%s: %d commit(er) i src/ som ikke er i arbeidsgrenen, siste %s' % (name, len(bad), git('log', '-1', '--format=%cd «%s»', '--date=short', name).strip()))
        if verbose:
            for c, got, n in bad: print('    %s  %d av %d linjer finnes  %s' % (c, got, n, git('log', '-1', '--format=%s', c).strip()[:100]))
