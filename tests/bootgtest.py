"""A start that locks the page (ui/11-boot.js BOOTG, ui/10f-cloud.js cloudSync and cloudGate; 06.11.2026, Adrian on the iPhone app:
«Står bare å laste», eight starts in five hours after Autonav was set in Bodø and the app closed, the route never sent). A page that
locks while the game is built says nothing, and the next start reads the same save and locks again. The locks are made here for real:
the renderer is crashed (CDP Page.crash) a few seconds after the game was built from a save with an Autonav route, before the start
got through, so nothing of the page runs after it, as on the phone.

Without the cloud (the device alone):
  1. the first lock is counted, and the next start goes on as before (the route kept);
  2. after the second, the safe start: the route stops where the boat is and goes back to the draft, the log and the toast say so;
     20 s on, the start has got through and the count is nothing again;
  3. a start that stopped in the background (the phone ended it) is not counted;
  4. four in a row: «Spillet startet ikke» instead of the game; «Start i sikker modus» starts the safe start, and the count from nothing.
With a stand-in for the cloud (as synctest), Adrian's case: the account has the game from before the route was set, the device has it
with the route. The first lock goes to the error list at the sign-in of the next start, with the save's boats and route, before that
start builds the game; after the second, the account's copy goes on (the device's kept as the save before), and the toast says so.
Prints OK or FEIL."""
from _env import GAME, BASE, boot
import asyncio, json, time
from datetime import datetime, timezone
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:500])
    if not c: bad.append(msg)

READY = "typeof SIMREADY !== 'undefined' && SIMREADY === true"
REC = "JSON.parse(localStorage.getItem('dsb_bootg') || 'null')"
# a route from the grounds off Senja: two legs the route would call clear, the boat under way on the first
ROUTE = """(() => { const b = S.boat, g = GROUNDS[2].p; S.tut = 0; S.plan = null; S.draft = [];
  b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; b.fuel = 60;
  const ring = (c, r) => [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({x:c.x + r * Math.cos(k * Math.PI / 4), y:c.y + r * Math.sin(k * Math.PI / 4)}));
  const a = [6, 5, 4].flatMap(r => ring(g, r)).find(q => legClear(g, q)); if (!a) return {err:'no clear leg'};
  const c = [6, 5, 4].flatMap(r => ring(a, r)).find(q => legClear(a, q) && dist(q, g) > 3); if (!c) return {err:'no second leg'};
  S.plan = {wps:[{x:a.x, y:a.y, port:null, fish:0, leia:true}, {x:c.x, y:c.y, port:null, fish:0, leia:true}], idx:0, speed:6, returning:false, depAt:null, unsafe:[false, false]};
  b.status = 'sailing'; b.drift = 0; save(); return {wps:S.plan.wps.length}; })()"""
STATE = """(() => ({fails:BOOTG.fails, safe:BOOTG.safe, plan:S.plan ? S.plan.wps.length - S.plan.idx : 0, draft:(S.draft || []).length, st:S.boat.status,
  said:S.log.filter(l => /er Autonav stoppet der båten er/.test(l.no || '')).length, cash:Math.round(S.cash), rec:""" + REC + """}))()"""


async def lock(ctx, pg):
    """The page dies while on the screen, a few seconds after the game was built (inside the 20 s), as a page that locks."""
    await pg.wait_for_timeout(3000)   # (the record is written at once; this gives the storage time to reach the browser, as on the phone)
    rec = await pg.evaluate(REC)
    cdp = await ctx.new_cdp_session(pg)
    try: await asyncio.wait_for(cdp.send('Page.crash'), 5)
    except Exception: pass
    await asyncio.sleep(1)
    try: await pg.close()
    except Exception: pass
    return rec


async def ready_on(pg, cond):
    """Waits for the game, also through a page that loads itself again on the way (the take of the account's game, the dialog's buttons)."""
    for _ in range(3):
        try: await pg.wait_for_function(cond, timeout=60000); return True
        except Exception: await pg.wait_for_timeout(1000)
    return False


async def start(ctx, url=None, ready=READY):
    pg = await ctx.new_page(); pg.set_default_timeout(120000); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(url or GAME)
    if ready: await ready_on(pg, ready)
    return pg, errs


async def leave(pg):
    """The player leaves the page the ordinary way (another page, the tab closed): the page hears it go."""
    try: await pg.goto('about:blank'); await pg.close()
    except Exception: pass


async def setrec(ctx, rec):
    """The record as a page left it, written from a page of the same site that is not the game (the game would write over it as it closes)."""
    pg = await ctx.new_page(); await pg.goto(BASE + 'ingen-side.html')
    await pg.evaluate("r => localStorage.setItem('dsb_bootg', JSON.stringify(r))", rec); await pg.close()


async def local(br):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg); await pg.wait_for_function(READY, timeout=120000)
    r = await pg.evaluate(ROUTE)
    check('wps' in r, 'a route off Senja to start from', r)
    await leave(pg)
    # 1. the start that builds the game from the save with the route, and locks
    pg, e1 = await start(ctx); s0 = await pg.evaluate(STATE); r0 = await lock(ctx, pg)
    check(s0['fails'] == 0 and not s0['safe'] and s0['plan'] == 2 and r0 and r0['in'] and not r0['ok'] and r0['vis'], 'a start writes that it builds the game, and is not through yet', {'s': s0, 'rec': r0})
    pg, e2 = await start(ctx); s1 = await pg.evaluate(STATE); await lock(ctx, pg)
    check(s1['fails'] == 1 and not s1['safe'] and s1['plan'] == 2 and s1['st'] == 'sailing', 'after one lock the next start counts it, and goes on as before with the route', s1)
    # 2. the second lock: the safe start
    pg, e3 = await start(ctx); s2 = await pg.evaluate(STATE)
    check(s2['fails'] == 2 and s2['safe'] and s2['plan'] == 0 and s2['draft'] == 2 and s2['st'] == 'idle' and s2['said'] == 1,
          'after two locks in a row the safe start: Autonav stopped where the boat is, the route back to the draft, and the log says so', s2)
    toast = ''
    try:
        await pg.wait_for_function("/Spillet stoppet under oppstarten/.test((document.getElementById('toast') || {}).innerText || '')", timeout=10000); toast = 'ok'
    except Exception: pass
    check(toast == 'ok', 'the toast tells the player why the boat lies still')
    await pg.wait_for_timeout(21000); r2 = await pg.evaluate(REC)
    check(r2 and r2['ok'] and r2['fails'] == 0, '20 s on, the start has got through and the count is nothing again', r2)
    await leave(pg)
    # 3. a start the phone ended in the background is not a lock
    await setrec(ctx, {'fails': 1, 'in': True, 'ok': False, 'vis': False, 'at': int(time.time() * 1000)})
    pg, e4 = await start(ctx); s3 = await pg.evaluate(STATE); await leave(pg)
    check(s3['fails'] == 1 and not s3['safe'], 'a start that stopped in the background is not counted (the count stands)', s3)
    # 4. four in a row: the dialog instead of the game, and «Start i sikker modus» from it
    await setrec(ctx, {'fails': 3, 'in': True, 'ok': False, 'vis': True, 'at': int(time.time() * 1000)})
    pg, e5 = await start(ctx, ready=None)
    await pg.wait_for_selector('#bfSafe', state='visible', timeout=120000)
    d = await pg.evaluate("({txt:document.getElementById('modal').innerText, ready:typeof SIMREADY !== 'undefined' && SIMREADY, rec:" + REC + "})")
    # (the test browser speaks English: the dialog follows the language, as bootFail does)
    check(('Spillet startet ikke' in d['txt'] and '4 ganger på rad' in d['txt'] or 'The game did not start' in d['txt'] and '4 times in a row' in d['txt'])
          and not d['ready'] and d['rec']['fails'] == 4 and not d['rec']['in'],
          'four locks in a row: «Spillet startet ikke» with the way on, and the game is not built', d)
    await pg.click('#bfSafe')
    up = await ready_on(pg, READY)
    s4 = await pg.evaluate(STATE) if up else {'up': False, 'rec': await pg.evaluate(REC)}
    await leave(pg)
    check(up and s4['safe'] and s4['fails'] == 0, '«Start i sikker modus» starts the safe start, and the count from nothing', s4)
    pg, e6 = await start(ctx); s5 = await pg.evaluate(STATE); await leave(pg)
    check(s5['fails'] == 0 and not s5['safe'], 'and the start after it is an ordinary one', s5)
    allerr = errs + e1 + e2 + e3 + e4 + e5 + e6
    check(not allerr, 'no page errors (device alone)', allerr[:4])
    await ctx.close()


# ---- the stand-in for the cloud (as synctest): one save row, the active device, and the errors sent ----
CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_bootg', email:'bootg@test.no'}), getAccessToken: async () => 'tok_bootg',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
CREADY = READY + " && !document.getElementById('cloudGate')"
DB = {'row': None, 'errs': [], 'noput': False, 'calls': []}
iso = lambda t=None: datetime.fromtimestamp(t or time.time(), timezone.utc).isoformat()
HEAD = ('rev', 'saved_at', 'game_t', 'summary', 'device', 'device_name', 'updated_at', 'active_dev', 'active_name', 'active_since')
def head(): return dict({k: DB['row'][k] for k in HEAD}, now=iso(), active_age=0) if DB['row'] else None
def put4(b):
    if DB['noput']: return None
    cur = DB['row']
    if cur and not b.get('force') and cur['rev'] != b.get('base_rev'): return {'ok': False, 'moved': False, 'taken': False, 'cloud': {k: cur[k] for k in HEAD}}
    rev = (cur['rev'] if cur else 0) + 1
    DB['row'] = {'data': b['data'], 'saved_at': b['saved_at'], 'game_t': b['game_t'], 'summary': b['summary'], 'rev': rev, 'device': b['device'],
                 'device_name': b['device_name'], 'updated_at': iso(), 'active_dev': b['device'], 'active_name': b['device_name'], 'active_since': iso()}
    return {'ok': True, 'rev': rev, 'saved_at': b['saved_at'], 'updated_at': DB['row']['updated_at']}


async def cloud(br):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800})
    await ctx.add_init_script(STUB)
    async def handle(route):
        req = route.request; fn = req.url.rsplit('/', 1)[-1]
        try: b = json.loads(req.post_data or '{}')
        except Exception: b = {}
        DB['calls'].append(fn)
        if fn == 'tm_hello': r = {'consent': False, 'owned': []}
        elif fn == 'tm_error': DB['errs'].append(dict(b, _calls=len(DB['calls']))); r = ''
        elif fn == 'save_get': r = DB['row']
        elif fn == 'save_head': r = head()
        elif fn in ('save_put4', 'save_put3'):
            r = put4(b)
            if r is None: await route.fulfill(status=503, content_type='application/json', body='{}'); return
        elif fn == 'save_claim': r = {'ok': True, 'rev': DB['row']['rev'], 'now': iso(), 'prev_dev': None} if DB['row'] else {'ok': False, 'now': iso()}
        elif fn == 'save_beat': r = head()
        else: r = ''
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await ctx.route('https://sb.test/**', handle)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg); await pg.wait_for_function(CREADY, timeout=120000)
    # the account has the game in port (the last save that went up), then the route is set and the app closed before it is sent
    # (a game that has been played: a new one, t under a minute and no boat name, is «nothing here yet» to cloudSync, as in synctest)
    r = await pg.evaluate("""async () => { S.intro = true; S.tut = 0; S.t = Math.max(S.t || 0, 900); S.boatName = S.boatName || 'Prøve'; S.cash = 111111; save(); await cloudSaveSoon(false, true); return {rv:TAB.rv}; }""")
    DB['noput'] = True; await pg.wait_for_timeout(1500)   # (played a little after the last save that went up)
    r2 = await pg.evaluate(ROUTE.replace("save(); return", "S.cash = 123456; save(); return"))
    check(r['rv'] == 1 and DB['row'] and 'wps' in r2, 'the account has the game from before; the route is set on the device and not sent', {'r': r, 'r2': r2})
    await leave(pg)
    # the start with the route locks; the next one tells it at the sign-in, before it builds the game, and locks too
    pg, e1 = await start(ctx, ready=CREADY); s0 = await pg.evaluate(STATE); await lock(ctx, pg)
    n0, c0 = len(DB['errs']), len(DB['calls'])
    pg, e2 = await start(ctx, ready=CREADY)
    s1 = await pg.evaluate(STATE)
    rep = [x for x in DB['errs'][n0:] if x.get('msg', '').startswith('Oppstarten står fast: siden låste seg')]
    info = json.loads(rep[0]['stack']) if rep else {}
    # (sent before this start read the save and built the game from it: the start may lock the same way)
    calls = DB['calls'][c0:]; early = 'tm_error' in calls and 'save_get' in calls and calls.index('tm_error') < calls.index('save_get')
    check(s0['plan'] == 2 and s0['cash'] == 123456 and s1['fails'] == 1 and len(rep) == 1 and info.get('fails') == 1 and info.get('save', {}).get('b', [{}])[0].get('wps') == 2
          and info['save']['b'][0].get('st') == 'sailing' and early,
          'the lock goes to the error list at the next sign-in («Oppstarten står fast»), with the boat and her route, before that start reads the save', {'s0': s0, 's1': s1, 'rep': rep[:1], 'calls': calls[:8]})
    await lock(ctx, pg)
    # the second lock: the account's copy (in port, before the route) goes on, the device's is kept as the save before
    pg, e3 = await start(ctx, ready=None)
    await ready_on(pg, CREADY + " && sessionStorage.getItem('dsb_pulled')")   # (the take loads the page again)
    s2 = await pg.evaluate(STATE)
    prev = await pg.evaluate("(() => { const o = JSON.parse(localStorage.getItem(KEY_PREV) || 'null'); return o ? Math.round(o.cash) : null; })()")
    toast = ''
    try:
        await pg.wait_for_function("/Vi fortsetter fra den siste lagringen på kontoen din/.test((document.getElementById('toast') || {}).innerText || '')", timeout=10000); toast = 'ok'
    except Exception: pass
    check(s2['cash'] == 111111 and s2['plan'] == 0 and not s2['safe'] and s2['rec']['act'] == 'cloud' and prev == 123456 and toast == 'ok',
          'after two locks the account\'s copy from before the route goes on, the device\'s is kept as the save before, and the toast says so', {'s2': s2, 'prev': prev, 'toast': toast})
    await leave(pg)
    allerr = errs + e1 + e2 + e3
    check(not allerr, 'no page errors (with the cloud)', allerr[:4])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        await local(br)
        await cloud(br)
        await br.close()
    print('røde:', bad if bad else 'ingen')

asyncio.run(main())
