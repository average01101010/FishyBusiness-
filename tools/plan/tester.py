#!/usr/bin/env python3
"""The tests that cover what a branch changed (tools/plan/RUTINE.md point 6.3, 07.11.2026).

`python3 tests/run.py changed` looks only at what is not committed yet (git diff HEAD). The work routine commits as it goes, so before
its gate it needs the tests for everything the step changed since it left the working branch, committed or not:

    python3 tools/plan/tester.py                        files changed against origin/ccr-5e1ba2f4-pusvyd (from the merge base) plus the uncommitted
    python3 tools/plan/tester.py origin/some-branch     against another base
    python3 tools/plan/tester.py --both                 only the files BOTH sides changed since the merge base (after a merge, RUTINE.md 6.7)
    python3 tools/plan/tester.py --run                  runs them: python3 tests/run.py smoke [unit] <tests>

Picks them as run.py does (COVER; a test file names itself; any other file under src/ gives trip2), and puts `unit` first when the core,
the data or the build is touched (UNIT_SRC). Prints the files, the tests and the command; with --run, exits as run.py does.
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
import run as R   # tests/run.py: COVER, D3, LITE, UNIT_SRC (its main() runs only as a script)


def git(*a):
    return subprocess.run(['git'] + list(a), cwd=ROOT, capture_output=True, text=True).stdout.split('\n')


def files(base, both):
    mb = git('merge-base', base, 'HEAD')[0].strip()
    mine = set(git('diff', '--name-only', mb, 'HEAD')) | set(git('diff', '--name-only', 'HEAD')) | set(git('ls-files', '--others', '--exclude-standard'))
    if both:
        theirs = set(git('diff', '--name-only', mb, base))
        mine &= theirs
    return sorted(f for f in mine if f)


def tests(fs):
    out = []
    for f in fs:
        if f in R.COVER: out += R.COVER[f]
        elif f.startswith('tests/') and f.endswith('.py') and os.path.basename(f)[:-3] in R.D3 + R.LITE: out.append(os.path.basename(f)[:-3])
        elif f.startswith('src/'): out.append('trip2')
    names = list(dict.fromkeys(out))
    if any(f.startswith(R.UNIT_SRC) for f in fs): names.insert(0, 'unit')
    return names


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    base = args[0] if args else 'origin/ccr-5e1ba2f4-pusvyd'
    fs = files(base, '--both' in sys.argv)
    names = tests(fs)
    print('Endrede filer mot %s: %s' % (base, ', '.join(fs) or 'ingen'))
    print('Tester: %s' % (' '.join(names) or 'ingen'))
    if not names:
        print('Ingen tester dekker disse endringene.'); return 0
    cmd = [sys.executable, os.path.join(ROOT, 'tests', 'run.py'), 'smoke'] + names
    print(' '.join(cmd[1:]))
    if '--run' in sys.argv:
        return subprocess.call(cmd, cwd=ROOT)
    return 0


if __name__ == '__main__':
    sys.exit(main())
