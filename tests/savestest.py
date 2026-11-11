"""Every real save starts (Jonas 08.10.2026, after a player's cloud save could not start: «mask block 105,20 is not loaded»): each save is
put on a fresh device, the game is opened, and it must come up without the error card, let two game hours go by without a page error,
and still hold its boat. The save gate of a release (L1c, 11.11.2026; docs/systemer/publisering.md «Lagringsporten»).

  python3 tests/savestest.py                      tests/saves/ when tools/saves/fetch.py has filled it (never in git), else the fixture
                                                  (tests/saves-fixture/: a new player and one with a fleet along the coast), and then
                                                  also the save made broken on purpose (broken/), which must be stopped
  python3 tests/savestest.py --dir <folder>       the saves in that folder (the release job: "$RUNNER_TEMP/saves")
  python3 tests/savestest.py --must               no save is an error (the release job: a release without the gate must not pass quietly)
  python3 tests/savestest.py --old <dist>         the other way: each save is started with the build under test (KYST_DIST), two game
                                                  hours are played, the game saves, and the build in <dist> (the release before) must
                                                  start with what it wrote. A roll-back must not break the game of one who has played
                                                  the new version
  python3 tests/savestest.py --jobs N             N saves at a time, each in a browser context of its own (4)

The log never shows a save: a line names it by its fingerprint (the first 8 characters of the sha256 of the save), and what is quoted in
an error is cut out. The script ends with code 1 when a save did not hold, so a job stops on it; tests/run.py reads the lines as before."""
import asyncio, json, os, glob, sys, time, hashlib, re, threading, functools
arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv and sys.argv.index(k) + 1 < len(sys.argv) else d
# (before _env, which moves to tests/out: a relative folder is the caller's)
DIR, OLD = [os.path.abspath(v) if v else None for v in (arg('--dir'), arg('--old'))]
from _env import GAME, BASE, _Srv, _Quiet
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
HERE = os.path.dirname(os.path.abspath(__file__))
REAL, FIX = os.path.join(HERE, 'saves'), os.path.join(HERE, 'saves-fixture')
JOBS = max(1, int(arg('--jobs', '4')))
FAILED = "/Spillet startet ikke|The game did not start|Kartet lastet ikke/.test((document.getElementById('modal') || {}).innerText || '')"
fp = lambda raw: hashlib.sha256(raw.encode('utf-8')).hexdigest()[:8]
# what a message quotes may be a piece of the save (a JSON error quotes the text it stopped at; a boat's name): out of the log
clean = lambda s: re.sub(r'"[^"]*"|\'[^\']*\'|«[^»]*»|`[^`]*`', '«…»', str(s))[:160]

async def start(br, url, raw, keep=False):
    """One save on a fresh device: opened, two game hours played. With keep, the game then saves, and what it wrote comes back."""
    ctx = await br.new_context(viewport={'width': 1000, 'height': 760})
    await ctx.add_init_script("if (!sessionStorage.getItem('st_put')){ sessionStorage.setItem('st_put', '1'); localStorage.clear(); localStorage.setItem('kystfiske_v2', " + json.dumps(raw) + "); }")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(clean(e)))
    pg.set_default_timeout(150000)
    st = {'ready': False, 'failed': False, 't': None}; out = None
    try:
        await pg.goto(url)
        try: await pg.wait_for_function("(typeof SIMREADY !== 'undefined' && SIMREADY) || " + FAILED, timeout=150000)
        except Exception as e: errs.append('the game neither started nor said why in 150 s (' + type(e).__name__ + ')')
        st = await pg.evaluate("({failed:" + FAILED + ", ready:typeof SIMREADY !== 'undefined' && SIMREADY, t:typeof S !== 'undefined' && S ? S.t : null})")
        if st['failed']: st['msg'] = clean(await pg.evaluate("((document.querySelector('#modal .note') || {}).innerText || '')"))
        if st['ready'] and not st['failed']:
            # two game hours whatever the world clock says (catchUp plays only up to the shared clock, which may be nothing), and
            # with the wait the game itself has: the clock stands until the map round the boats is in (simAreaReady), so the rest
            # is asked for again for up to a minute. A save whose waters never come stands still for its player too, and is stopped
            st['after'] = a = await pg.evaluate("(() => { try { catchUp(2 * 3600e3 / GAME_RATE); } catch (e){ return {err:String(e && e.message || e)}; } return {}; })()")
            end = time.time() + 60
            while not a.get('err'):
                a.update(await pg.evaluate("(t0 => { try { const left = 120 - (S.t - t0); if (left > 0) playMinutes(left, true); } catch (e){ return {err:String(e && e.message || e)}; } return {t:S.t, map:simAreaReady(), boat:!!(S.boat && S.boat.pos && isFinite(S.boat.pos.x) && isFinite(S.boat.pos.y))}; })(" + str(st['t']) + ")"))
                if a.get('t', 0) >= st['t'] + 120 or time.time() > end: break
                await asyncio.sleep(0.25)
            if a.get('err'): a['err'] = clean(a['err'])
            if keep: out = await pg.evaluate("(() => { save(); return localStorage.getItem(KEY); })()")
    except Exception as e: errs.append('test: ' + type(e).__name__)   # (the name only: Playwright's message may quote the script, and the script holds the save)
    await ctx.close()
    a = st.get('after') or {}
    good = bool(st['ready'] and not st['failed'] and not a.get('err') and a.get('boat') and (a.get('t') or 0) >= (st['t'] or 0) + 120 and not errs)
    return good, {'ready': bool(st['ready']), 'card': st.get('msg'), 'err': a.get('err'), 'boat': a.get('boat'), 'map': a.get('map'), 'min': (a.get('t') or 0) - (st['t'] or 0) if a else None, 'errs': errs[:2]}, out

async def run(br, files, old=None, want=True):
    """The saves, JOBS at a time. want False: the saves are broken on purpose, and each must be stopped. Returns how many did not go as wanted."""
    sem = asyncio.Semaphore(JOBS); bad = 0
    async def one(f):
        nonlocal bad
        async with sem:
            raw = open(f, encoding='utf-8').read(); t0 = time.time()
            good, why, wrote = await start(br, GAME, raw, keep=bool(old))
            if old and good:
                g2, w2, _ = await start(br, old, wrote)
                line = (ok(g2), 'a save the new build wrote starts with the build before, plays two game hours and keeps its boat:')
                good, why = g2, dict(w2, wrote=fp(wrote))
            elif old: line = (ok(False), 'the new build starts the save (before the other way can be tried):')
            elif want: line = (ok(good), 'the save starts, plays two game hours and keeps its boat:')
            else: line = (ok(not good), 'a save made broken on purpose is stopped:')
            if good != want: bad += 1
            print(*line, fp(raw), '%.0f s' % (time.time() - t0), json.dumps({k: v for k, v in why.items() if v not in (None, [], True)} if good == want and want else why, ensure_ascii=False)[:420], flush=True)
    await asyncio.gather(*[one(f) for f in files])
    return bad

async def main():
    d, old, fixture = DIR, OLD, False
    if not d:
        d = REAL if glob.glob(os.path.join(REAL, '*.json')) else FIX; fixture = d == FIX
    files = sorted(glob.glob(os.path.join(d, '*.json')))
    if not files:
        print(('FEIL ' if '--must' in sys.argv else '') + 'no saves in', 'the folder asked for' if DIR else 'tests/saves', '(python3 tools/saves/fetch.py, with SUPABASE_SERVICE_ROLE_KEY)'); print('errors: []')
        sys.exit(1 if '--must' in sys.argv else 0)
    oldurl = None
    if old:
        if not os.path.isfile(os.path.join(old, 'index.html')): print('FEIL no build in --old', old); print('errors: []'); sys.exit(1)
        srv = _Srv(('127.0.0.1', 0), functools.partial(_Quiet, directory=old)); threading.Thread(target=srv.serve_forever, daemon=True).start()
        oldurl = GAME.replace(BASE, 'http://127.0.0.1:%d/' % srv.server_port)
    t0 = time.time()
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        bad = await run(br, files, oldurl)
        n = len(files)
        if fixture and not old:
            brk = sorted(glob.glob(os.path.join(FIX, 'broken', '*.json'))); bad += await run(br, brk, want=False); n += len(brk)
        await br.close()
    dt = time.time() - t0
    print('%d saves%s in %.0f s (%.1f s each, %d at a time): %s' % (n, ' (the fixture)' if fixture else '', dt, dt / n, JOBS, 'all held' if not bad else '%d did not hold' % bad))
    print('errors: []')
    sys.exit(1 if bad else 0)

asyncio.run(main())
