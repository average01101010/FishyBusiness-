"""One page writes the game on a device (ui/02-format-state.js tabMine/tabLose, ui/10f-cloud.js; Adrian 13.10.2026: a tab left open on
the iPhone since the morning woke up and saved its morning over the game played since). 1. Two pages on one device: the page opened last
has the game; the older one saves nothing over it when it is used or wakes up, pauses with a card (stående and liggende), and «Spill her»
loads it again with the game as it is now. 2. With the cloud: a page passed by sends nothing to the account; a game on the device older
than the one the device sent (written back over it by an old page) gives way to the account's at the next start. 3. The app on the home
screen with nothing on it asks «Har du spilt før?» before Father's letter, and «Start et nytt spill» goes on as a guest. Prints OK or FEIL."""
from _env import GAME, OUT, boot
import asyncio, json, os
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:400])
    if not c: bad.append(msg)

CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => (window.__noUser ? null : {id:'user_tab', email:'tab@test.no'}), getAccessToken: async () => 'tok_tab',
  signIn: () => { window.__signIn = 1; }, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
READY = "typeof SIMREADY !== 'undefined' && SIMREADY && !document.getElementById('cloudGate')"

DB = {'row': None, 'calls': []}
def put3(b):
    cur = DB['row']
    if cur and cur['rev'] != b.get('base_rev') and not b.get('force'):
        return {'ok': False, 'moved': cur['device'] != b['device'], 'cloud': {k: cur[k] for k in ('rev', 'saved_at', 'game_t', 'summary', 'device', 'device_name', 'updated_at')}}
    rev = (cur['rev'] if cur else 0) + 1
    DB['row'] = {'data': b['data'], 'saved_at': b['saved_at'], 'game_t': b['game_t'], 'summary': b['summary'], 'rev': rev, 'device': b['device'], 'device_name': b['device_name'],
                 'updated_at': '2026-10-13T12:%02d:00+00:00' % min(rev, 59)}
    return {'ok': True, 'rev': rev, 'saved_at': b['saved_at'], 'updated_at': DB['row']['updated_at']}

async def cloud_ctx(br, init=''):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800})
    await ctx.add_init_script(STUB + init)
    async def handle(route):
        req = route.request; fn = req.url.split('?')[0].rsplit('/', 1)[-1]
        try: b = json.loads(req.post_data or '{}')
        except Exception: b = {}
        DB['calls'].append(fn)
        if fn == 'signup': return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'access_token': 'gtok', 'refresh_token': 'grt', 'expires_in': 3600, 'user': {'id': 'g-1'}}))
        if fn == 'tm_hello': r = {'consent': False, 'owned': []}
        elif fn == 'save_get': r = DB['row'] or None
        elif fn == 'save_head': r = ({k: v for k, v in DB['row'].items() if k != 'data'} if DB['row'] else None)
        elif fn == 'save_put3': r = put3(b)
        else: r = ''
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await ctx.route('https://sb.test/**', handle)
    return ctx

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # ---- 1. two pages on one device, no cloud ----
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []
        A = await ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e))); await boot(A)
        await A.evaluate("(() => { S.cash = 111111; save(); })()")
        B = await ctx.new_page(); B.on('pageerror', lambda e: errs.append(str(e))); B.set_default_timeout(120000)
        await B.goto(GAME); await B.wait_for_function(READY, timeout=120000)
        b0 = await B.evaluate("(() => { const c = S.cash; S.cash = 222222; save(); return c; })()")
        check(b0 == 111111, 'the page opened last reads the game as the first one left it', b0)
        # the old page is used again (or wakes up): it writes nothing, and pauses with a card
        a = await A.evaluate("""(() => { S.cash = 999; save(); lastWall = Date.now() - 8000; tick();
          return {lost:TAB.lost, stored:JSON.parse(localStorage.getItem(KEY)).cash, card:!!document.getElementById('tabHere'), text:(document.getElementById('cloudGate') || {}).innerText || ''}; })()""")
        check(a['lost'] and a['stored'] == 222222 and a['card'] and 'annen fane' in a['text'], 'the older page saves nothing over the newer game, and says it is paused', a)
        for nm, w, h in (('liggende', 1280, 800), ('stående', 800, 1280)):
            await A.set_viewport_size({'width': w, 'height': h}); await A.wait_for_timeout(300)
            await A.screenshot(path=os.path.join(OUT, 'tab_lost_' + nm + '.png'))
            box = await A.evaluate("(() => { const r = document.getElementById('tabHere').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight]; })()")
            check(box[0] >= 0 and box[1] >= 0 and box[2] <= box[4] and box[3] <= box[5], 'the «Spill her» button is on the screen (' + nm + ')', box)
        await A.set_viewport_size({'width': 1100, 'height': 800})
        # a page that sleeps while a newer one opens stops when it wakes, before it plays anything
        C = await ctx.new_page(); C.on('pageerror', lambda e: errs.append(str(e))); C.set_default_timeout(120000)
        await C.goto(GAME); await C.wait_for_function(READY, timeout=120000)
        b1 = await B.evaluate("(() => { const t0 = S.t; lastWall = Date.now() - 8000; tick(); return {lost:TAB.lost, played:S.t !== t0}; })()")
        check(b1['lost'] and not b1['played'], 'a page that wakes after a newer one has opened stops before it plays', b1)
        # «Spill her» loads it again with the game as it is now, and it has the game
        await A.click('#tabHere'); await A.wait_for_function(READY, timeout=120000)
        a2 = await A.evaluate("({cash:S.cash, lost:TAB.lost})")
        check(a2['cash'] == 222222 and not a2['lost'], '«Spill her» loads the page again with the game as it is now', a2)
        c1 = await C.evaluate("(() => { save(); return TAB.lost; })()")
        check(c1, 'and the page that had it before is passed by in its turn', c1)
        check(not errs, 'no page errors (two pages)', errs[:3])
        await ctx.close()

        # ---- 2. with the cloud ----
        ctx = await cloud_ctx(br); errs = []
        A = await ctx.new_page(); A.on('pageerror', lambda e: errs.append(str(e))); await boot(A)
        r = await A.evaluate("""async () => { S.intro = true; S.tut = 0; S.cash = 500000; save(); await cloudSaveSoon(false, true); return {sync:syncGet(), seq:S.seq}; }""")
        check(DB['row'] and DB['row']['summary']['cash'] == 500000 and r['sync'] and r['sync'].get('sq') == r['seq'] and r['sync'].get('rv') == 1, 'the game goes up, and the device keeps the save count it sent', r)
        old = await A.evaluate("localStorage.getItem(KEY)")   # the game as a page left open would have it
        await A.evaluate("""async () => { S.cash = 985690; save(); CLOUD.headT = 0; await cloudSaveSoon(false, true); }""")
        n0 = DB['calls'].count('save_put3')
        B = await ctx.new_page(); B.on('pageerror', lambda e: errs.append(str(e))); B.set_default_timeout(120000)
        await B.goto(GAME); await B.wait_for_function(READY, timeout=120000)
        await A.evaluate("""async () => { S.cash = 1; CLOUD.lastSave = 0; await cloudSaveSoon(true); }""")
        check(DB['calls'].count('save_put3') == n0 and DB['row']['summary']['cash'] == 985690, 'a page passed by sends nothing to the account', {'puts': DB['calls'].count('save_put3') - n0, 'cloud': DB['row']['summary']})
        # an old page (code from before this) wrote its older game over the one on the device: the next start takes the account's
        await B.evaluate("o => { SAVE_OFF = true; localStorage.setItem(KEY, o); }", old)
        await B.reload(); await B.wait_for_function(READY, timeout=120000); await B.wait_for_timeout(1500)
        st = await B.evaluate("({cash:S.cash, seq:S.seq, sync:syncGet(), lost:TAB.lost})")
        check(st['cash'] == 985690, 'a game on the device older than the one the device sent gives way to the account\'s at the start', st)
        # signing in on a device that has never been in step with the account (a guest's game, the app): the account's game, never the newest by the clock
        await B.evaluate("o => { SAVE_OFF = true; const g = JSON.parse(o); g.lastReal = Date.now(); g.cash = 1234; localStorage.setItem(KEY, JSON.stringify(g)); localStorage.removeItem(syncKey()); sessionStorage.removeItem('dsb_pulled'); }", old)
        await B.reload(); await B.wait_for_function(READY, timeout=120000); await B.wait_for_timeout(1500)
        st = await B.evaluate("({cash:S.cash, prev:JSON.parse(localStorage.getItem(KEY_PREV) || '{}').cash})")
        check(st['cash'] == 985690 and st['prev'] == 1234, 'a device never in step with the account takes the account\'s game, and keeps its own as the one before', st)
        check(not errs, 'no page errors (cloud)', errs[:3])
        await ctx.close()

        # ---- 3. the app on the home screen, nothing on it ----
        DB['row'] = None
        ctx = await cloud_ctx(br, "window.__noUser = 1; Object.defineProperty(navigator, 'standalone', {get: () => true});"); errs = []
        P = await ctx.new_page(); P.on('pageerror', lambda e: errs.append(str(e))); P.set_default_timeout(120000)
        await P.goto(GAME); await P.wait_for_selector('#cgNew', timeout=90000)
        t = await P.evaluate("document.getElementById('cloudGate').innerText")
        check('Har du spilt før?' in t and 'Logg inn' in t, 'the app with nothing on it asks «Har du spilt før?» with «Logg inn» first', t[:200])
        for nm, w, h in (('liggende', 1280, 800), ('stående', 800, 1280)):
            await P.set_viewport_size({'width': w, 'height': h}); await P.wait_for_timeout(300)
            await P.screenshot(path=os.path.join(OUT, 'tab_app_' + nm + '.png'))
        await P.click('#cgIn'); signed = await P.evaluate("window.__signIn === 1")
        check(signed, '«Logg inn» opens the sign-in')
        await P.click('#cgNew'); await P.wait_for_selector('#obGo', state='visible', timeout=90000)
        g = await P.evaluate("({guest:CLOUD.guest === true, gate:!!document.getElementById('cloudGate')})")
        check(g['guest'] and not g['gate'], '«Start et nytt spill» goes on as a guest, to Father\'s letter', g)
        check(not errs, 'no page errors (app)', errs[:3])
        await ctx.close(); await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
