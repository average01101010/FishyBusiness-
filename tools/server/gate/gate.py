#!/usr/bin/env python3
"""The save gate on our own server (step 102, 11.11.2026; docs/planer/lagringsporten-hetzner.md, «Lagringsporten» in
docs/systemer/publisering.md). Jonas 11.11.2026: «A, flytt lagringsporten til Hetzner»: the players' saves are not to pass through
GitHub, whose data processing agreement does not cover the account. The release job (.github/workflows/deploy.yml) only uploads the
build and asks; this script, installed by tools/server/gate/setup.sh as /opt/dsb-gate/gate.py and owned by root, does the rest here:

  gate.py fetch   dsb-gate-fetch.service: with the database key in its environment (systemd reads /etc/dsb-gate.env as root; the key
                  is in no file this user can read) it runs the installed tools/saves/fetch.py, which writes every player's save and
                  the one before to the saves folder. Runs only code setup.sh installed, never anything the job uploaded.
  gate.py test    dsb-gate.service, after the fetch, with no key and no network but localhost (PrivateNetwork): starts every save
                  with the uploaded build (tests/savestest.py as the job uploaded it), then «the other way» against the build the
                  players have now, and writes the result.
  gate.py clean   after the test, whatever happened: the saves and the work folder are deleted.

What leaves this machine is out/result.json and out/log.txt, which the job reads and prints in a public log: a save is named by its
fingerprint only (savestest prints nothing else), and a failure of this script by its kind. Never a player's id, name or save.

The folders (DSB_GATE_IN, _OUT, _VAR, _OPT move them, for tests/gatetest.py):
  /srv/dsb-gate/in/     the job's, uploaded with rsync: build/ (the new build), prev/ (the build the players have), files/ (savestest,
                        _env, the fixture), and last ask (JSON: id, other), which starts the gate (dsb-gate.path)
  /srv/dsb-gate/out/    ours: result.json {id, ok, stage, why, saves, secs}, log.txt
  /var/lib/dsb-gate/    saves/ and work/, readable by this user only
  /opt/dsb-gate/        this script, tools/saves/fetch.py and src/data/cloud.json beside it, as setup.sh installed them
"""
import json, os, re, shutil, subprocess, sys, time

IN = os.environ.get('DSB_GATE_IN', '/srv/dsb-gate/in')
OUT = os.environ.get('DSB_GATE_OUT', '/srv/dsb-gate/out')
VAR = os.environ.get('DSB_GATE_VAR', '/var/lib/dsb-gate')
OPT = os.environ.get('DSB_GATE_OPT', '/opt/dsb-gate')
SAVES, WORK = os.path.join(VAR, 'saves'), os.path.join(VAR, 'work')
RESULT, LOG = os.path.join(OUT, 'result.json'), os.path.join(OUT, 'log.txt')
LIMIT = int(os.environ.get('DSB_GATE_LIMIT', '840'))   # seconds for each of the two runs: with the fetch's 600 at most 38 minutes, and the job waits 40

def ask():
    # the job's question. It is data from outside: only an id of plain characters and a yes or no are taken from it
    try: a = json.load(open(os.path.join(IN, 'ask'), encoding='utf-8'))
    except Exception: return None
    i = str(a.get('id', ''))
    return {'id': i, 'other': a.get('other') is True} if re.fullmatch(r'[0-9A-Za-z_.-]{1,64}', i) else None

def result(a, ok, stage, why='', saves=None, t0=None):
    os.makedirs(OUT, exist_ok=True)
    r = {'id': a['id'] if a else '', 'ok': bool(ok), 'stage': stage, 'why': why, 'saves': saves, 'secs': round(time.time() - t0) if t0 else None}
    tmp = RESULT + '.tmp'
    # whole or not at all (the job reads it while we write), and readable by the job's user, which is another one than ours: the
    # services run with UMask=0077 for the saves' sake, and the answer would else be ours alone and the job would wait in vain
    with open(tmp, 'w', encoding='utf-8') as f: json.dump(r, f)
    os.chmod(tmp, 0o644); os.replace(tmp, RESULT)
    return r

def log(text, new=False):
    os.makedirs(OUT, exist_ok=True)
    with open(LOG, 'w' if new else 'a', encoding='utf-8') as f: f.write(text if text.endswith('\n') else text + '\n')
    os.chmod(LOG, 0o644)

def wipe():
    for d in (SAVES, WORK): shutil.rmtree(d, ignore_errors=True)

def run(cmd, env, cwd=None, limit=None):
    # (code, output); the output is the test's own lines, which name a save by its fingerprint only
    try:
        p = subprocess.run(cmd, env=env, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=limit or LIMIT)
        return p.returncode, p.stdout.decode('utf-8', 'replace')
    except subprocess.TimeoutExpired as e:
        return 124, (e.stdout or b'').decode('utf-8', 'replace') + '\nFEIL the run took more than %d s and was stopped\n' % (limit or LIMIT)

def fetch():
    t0 = time.time(); a = ask(); wipe()
    try: os.remove(RESULT)
    except OSError: pass
    log('The save gate, question %s' % (a['id'] if a else '?'), new=True)
    if not a: result(None, False, 'fetch', 'the question could not be read', t0=t0); return 1
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not key:
        log('FEIL the database key is not on this server (/etc/dsb-gate.env): the gate cannot run, and a release does not go out without it')
        result(a, False, 'fetch', 'no key', t0=t0); return 1
    os.makedirs(SAVES, mode=0o700, exist_ok=True)
    # only the installed fetch.py runs with the key; SUPABASE_URL is not passed on, so it reads the address from the installed cloud.json
    env = {'PATH': os.environ.get('PATH', '/usr/bin:/bin'), 'SUPABASE_SERVICE_ROLE_KEY': key, 'LANG': 'C.UTF-8'}
    code, out = run([sys.executable, os.path.join(OPT, 'tools/saves/fetch.py'), '--hist', '1', '--out', SAVES], env, limit=600)   # under the unit's 900 s, so the stop is ours and is answered
    # fetch.py prints counts only; an error of urllib could name the address, never a save, but only its last line is kept anyway
    last = [l for l in out.strip().split('\n') if l.strip()][-1:] or ['']
    log(('FEIL the saves could not be fetched: ' if code else '') + last[0][:200])
    if code: wipe(); result(a, False, 'fetch', 'the saves could not be fetched', t0=t0); return 1
    n = len([f for f in os.listdir(SAVES) if f.endswith('.json')])
    if not n: wipe(); log('FEIL no saves came'); result(a, False, 'fetch', 'no saves', t0=t0); return 1
    return 0

def test():
    t0 = time.time(); a = ask()
    if not a: result(None, False, 'test', 'the question could not be read', t0=t0); return 1
    build, prev, files = (os.path.join(IN, d) for d in ('build', 'prev', 'files'))
    try:
        n = len([f for f in os.listdir(SAVES) if f.endswith('.json')]) if os.path.isdir(SAVES) else 0
        if not n: log('FEIL there are no saves to test (the fetch did not run)'); result(a, False, 'test', 'no saves', t0=t0); return 1
        if not os.path.isfile(os.path.join(build, 'index.html')): log('FEIL no build was uploaded'); result(a, False, 'test', 'no build', t0=t0); return 1
        shutil.rmtree(WORK, ignore_errors=True); shutil.copytree(files, WORK)   # the test writes beside itself (tests/out)
        st = os.path.join(WORK, 'tests', 'savestest.py')
        if not os.path.isfile(st): log('FEIL the test was not uploaded'); result(a, False, 'test', 'no test', t0=t0); return 1
        fx = os.path.join(WORK, 'tests', 'saves-fixture')
        for f in sorted(os.listdir(fx)) if os.path.isdir(fx) else []:   # the fixture's healthy ones, as the job did
            if f.endswith('.json'): shutil.copy(os.path.join(fx, f), SAVES)
        n = len([f for f in os.listdir(SAVES) if f.endswith('.json')])
        env = {k: v for k, v in os.environ.items() if 'SUPABASE' not in k and 'KEY' not in k}
        env['KYST_DIST'] = build
        code, out = run([sys.executable, st, '--dir', SAVES, '--must'], env, cwd=WORK)
        log('---- every save starts with this build ----\n' + out)
        if code: result(a, False, 'gate', 'a save did not start' if code == 1 else 'the test stopped (%d)' % code, n, t0); return 1
        if a['other']:
            if not os.path.isfile(os.path.join(prev, 'index.html')):
                log('::warning::The build the players have now was not uploaded: the other way was not tried in this release.')
            else:
                code, out = run([sys.executable, st, '--dir', SAVES, '--must', '--old', prev], env, cwd=WORK)
                log('---- the other way: what this build saves starts with the build before ----\n' + out)
                if code: result(a, False, 'other', 'a save this build wrote did not start with the build before' if code == 1 else 'the test stopped (%d)' % code, n, t0); return 1
        result(a, True, 'done', '', n, t0); return 0
    except Exception as e:
        # the kind of the error only: a message could quote what it stopped at
        log('FEIL the gate itself failed: ' + type(e).__name__); result(a, False, 'test', 'the gate itself failed: ' + type(e).__name__, t0=t0); return 1
    finally:
        wipe()

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode == 'fetch': sys.exit(fetch())
    if mode == 'test': sys.exit(test())
    if mode == 'clean': wipe(); sys.exit(0)
    sys.exit('gate.py fetch | test | clean')
