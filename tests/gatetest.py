"""The save gate's server script (tools/server/gate/gate.py, step 102, 11.11.2026), run here as the server runs it, with its folders
moved to a scratch place and a stand-in for tools/saves/fetch.py (the real one needs the database key, which no session has).

What must hold: without the key, without saves or with one save that does not start, the result says stop; with healthy saves it says
go; the saves are gone afterwards whatever happened; and the result and the log name nothing but fingerprints. Needs dist/ (the
fixture's saves start with it). Seen red 11.11.2026 with the wipe taken out of test() (the saves were left) and with the stop of a
failed save turned into a pass.
"""
import json, os, shutil, subprocess, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
GATE = os.path.join(ROOT, 'tools/server/gate/gate.py'); FX = os.path.join(HERE, 'saves-fixture')
DIST = os.path.abspath(os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist'))
bad = []
def check(ok, what, got=''):
    print(('OK  ' if ok else 'FEIL'), what, got if not ok else '')
    if not ok: bad.append(what)

def setup(saves, ask={'id': 'run-1', 'other': False}):
    T = tempfile.mkdtemp(prefix='gate-'); d = {k: os.path.join(T, k) for k in ('in', 'out', 'var', 'opt')}
    os.makedirs(os.path.join(d['in'], 'files/tests')); os.makedirs(os.path.join(d['opt'], 'tools/saves')); os.makedirs(os.path.join(T, 'src'))
    os.symlink(DIST, os.path.join(d['in'], 'build'))
    for f in ('savestest.py', '_env.py'): shutil.copy(os.path.join(HERE, f), os.path.join(d['in'], 'files/tests'))
    os.makedirs(os.path.join(d['in'], 'files/tests/saves-fixture')); shutil.copy(os.path.join(FX, 'ny.json'), os.path.join(d['in'], 'files/tests/saves-fixture'))
    for i, s in enumerate(saves): shutil.copy(s, os.path.join(T, 'src', 'p%d.json' % i))
    # the stand-in: copies what the test laid out, named as fetch.py names them (the real one writes fingerprints), and fails with none
    open(os.path.join(d['opt'], 'tools/saves/fetch.py'), 'w').write(
        "import os, sys, shutil\nsrc = %r; out = sys.argv[sys.argv.index('--out') + 1]\n"
        "assert os.environ.get('SUPABASE_SERVICE_ROLE_KEY') == 'k', 'the key did not come'\n"
        "fs = sorted(os.listdir(src))\nfor f in fs: shutil.copy(os.path.join(src, f), out)\n"
        "print(len(fs), 'saves fetched')\nsys.exit(0 if fs else 'The saves could not be fetched as saves')\n" % os.path.join(T, 'src'))
    if ask is not None: json.dump(ask, open(os.path.join(d['in'], 'ask'), 'w'))
    return T, d

def gate(d, mode, key='k'):
    env = dict(os.environ, DSB_GATE_IN=d['in'], DSB_GATE_OUT=d['out'], DSB_GATE_VAR=d['var'], DSB_GATE_OPT=d['opt'])
    env.pop('SUPABASE_SERVICE_ROLE_KEY', None)
    if key and mode == 'fetch': env['SUPABASE_SERVICE_ROLE_KEY'] = key
    return subprocess.run([sys.executable, GATE, mode], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT).returncode

res = lambda d: json.load(open(os.path.join(d['out'], 'result.json'))) if os.path.isfile(os.path.join(d['out'], 'result.json')) else None
left = lambda d: [f for f in (os.listdir(os.path.join(d['var'], 'saves')) if os.path.isdir(os.path.join(d['var'], 'saves')) else [])]
KEYS = {'id', 'ok', 'stage', 'why', 'saves', 'secs'}
good = [os.path.join(FX, 'flate.json'), os.path.join(FX, 'paa-land.json')]; broken = os.path.join(FX, 'broken/uten-posisjon.json')

# 1. no key: stop, and nothing fetched
T, d = setup(good); c = gate(d, 'fetch', key=''); r = res(d)
check(c == 1 and r and r['ok'] is False and r['why'] == 'no key' and r['id'] == 'run-1' and not left(d), 'without the database key the gate says stop', (c, r, left(d)))
shutil.rmtree(T)
# 2. no saves came: stop
T, d = setup([]); c = gate(d, 'fetch'); r = res(d)
check(c == 1 and r and r['ok'] is False and r['stage'] == 'fetch' and not left(d), 'when no saves come the gate says stop', (c, r))
c2 = gate(d, 'test'); r = res(d)
check(c2 == 1 and r['ok'] is False, 'and the test without saves says stop too', (c2, r))
shutil.rmtree(T)
# 3. a question that is not one: stop, with no id taken from it
T, d = setup(good, ask={'id': '../../etc; rm', 'other': True}); c = gate(d, 'fetch'); r = res(d)
check(c == 1 and r and r['ok'] is False and r['id'] == '', 'a question with a strange id is not taken', (c, r))
shutil.rmtree(T)
# 4. healthy saves: go, the fixture's own added, the saves gone afterwards, the key not with the test
T, d = setup(good); c = gate(d, 'fetch'); n = len(left(d)); c2 = gate(d, 'test'); r = res(d); lg = open(os.path.join(d['out'], 'log.txt')).read()
check(c == 0 and n == 2, 'the fetch lays the saves out', (c, n))
check(c2 == 0 and r['ok'] is True and r['stage'] == 'done' and r['saves'] == 3 and set(r) == KEYS, 'healthy saves: the gate says go, with the fixture added', (c2, r))
check(not left(d) and not os.path.isdir(os.path.join(d['var'], 'work')), 'the saves and the work folder are gone afterwards', left(d))
check('all held' in lg and 'p0' not in lg and d['var'] not in lg, 'the log has the test\'s own lines and no file names of ours', lg[-300:])
shutil.rmtree(T)
# 5. one save that does not start: stop, named by its fingerprint, the saves gone
T, d = setup(good + [broken]); gate(d, 'fetch'); c2 = gate(d, 'test'); r = res(d); lg = open(os.path.join(d['out'], 'log.txt')).read()
check(c2 == 1 and r['ok'] is False and r['stage'] == 'gate' and r['why'] == 'a save did not start', 'one save that does not start: the gate says stop', (c2, r))
check('895c9c53' in lg and not left(d), 'the log names it by its fingerprint, and the saves are gone', (lg[-300:], left(d)))
# 6. clean deletes what a killed run left
os.makedirs(os.path.join(d['var'], 'saves')); open(os.path.join(d['var'], 'saves/x.json'), 'w').write('{}'); gate(d, 'clean')
check(not left(d), 'clean deletes what a stopped run left')
shutil.rmtree(T)
print('errors:', [] if not bad else bad)
sys.exit(1 if bad else 0)
