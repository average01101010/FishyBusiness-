"""The save between devices (ui/10f-cloud.js, supabase/migrations/20261011120000_sync.sql, 11.10.2026): two devices (an iPhone and an Android
phone) on one account against a stand-in for the database that counts the saves the way save_put3 does. A plays and saves; B starts and takes
that game, and is told where it comes from; A plays on; B, still open, is refused when it saves, asks the player with what each game is, and
takes the newest; coming back to the foreground B asks the cloud without the game and is told that A has played; «Behold spillet her» writes
over it (the other kept in the history); the card in Settings says when the game was saved. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
AND = 'Mozilla/5.0 (Linux; Android 14; SM-A526B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_sync', email:'sync@test.no'}), getAccessToken: async () => 'tok_sync',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:400])
    if not c: bad.append(msg)

DB = {'row': None, 'hist': [], 'calls': []}   # the stand-in for the cloud: one save row with its revision, and what was written over
def sum_of(b): return b.get('summary') or {}
def put3(b):
    cur = DB['row']
    if cur and cur['rev'] != b.get('base_rev') and not b.get('force'):
        return {'ok': False, 'moved': cur['device'] != b['device'], 'cloud': {k: cur[k] for k in ('rev', 'saved_at', 'game_t', 'summary', 'device', 'device_name', 'updated_at')}}
    if cur and b.get('force'): DB['hist'].append(dict(cur))
    rev = (cur['rev'] if cur else 0) + 1
    DB['row'] = {'data': b['data'], 'saved_at': b['saved_at'], 'game_t': b['game_t'], 'summary': b['summary'], 'rev': rev, 'device': b['device'], 'device_name': b['device_name'],
                 'updated_at': '2026-10-11T12:%02d:00+00:00' % min(rev, 59)}
    return {'ok': True, 'rev': rev, 'saved_at': b['saved_at'], 'updated_at': DB['row']['updated_at']}

async def device(br, ua):
    ctx = await br.new_context(user_agent=ua, viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script(STUB)
    async def handle(route):
        req = route.request; fn = req.url.rsplit('/', 1)[-1]
        try: b = json.loads(req.post_data or '{}')
        except Exception: b = {}
        DB['calls'].append(fn)
        if fn == 'tm_hello': r = {'consent': False, 'owned': []}
        elif fn == 'save_get': r = DB['row'] or None
        elif fn == 'save_head': r = ({k: v for k, v in DB['row'].items() if k != 'data'} if DB['row'] else None)
        elif fn == 'save_put3': r = put3(b)
        else: r = ''
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs

async def play(pg, cash):
    return await pg.evaluate("""async c => { S.intro = true; S.tut = 0; S.t = Math.max(S.t || 0, 900); S.cash = c; save(); CLOUD.headT = 0; await cloudSaveSoon(false, true);
      return {rv:(syncGet() || {}).rv, stat:CLOUD.stat, text:cloudStatusText()}; }""", cash)

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        A = await device(br, IOS); await boot(A[1])
        r = await play(A[1], 111111)
        check(r['rv'] == 1 and DB['row'] and DB['row']['device_name'] == 'iPhone' and DB['row']['rev'] == 1 and 'Lagret i skyen' in r['text'], 'A saves: revision 1 from «iPhone», and the card says when it was saved', {'r': r, 'row': DB['row'] and DB['row']['rev']})
        # B starts on another device: takes the game from the cloud and is told where it comes from
        B = await device(br, AND); await B[1].goto(GAME)
        told = True
        try: await B[1].wait_for_function("/Fortsetter der du slapp på iPhone/.test(document.body.innerText)", timeout=120000, polling=100)
        except Exception: told = False
        await B[1].wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && !document.getElementById('cloudGate')", timeout=120000)
        b0 = await B[1].evaluate("({cash:S.cash, rv:(syncGet() || {}).rv})"); b0['told'] = told
        check(b0['cash'] == 111111 and b0['rv'] == 1 and b0['told'], 'B starts on a new device: the game comes from the cloud, and B is told it was left on the iPhone', b0)
        # A plays on and saves; B, still open, saves: refused, and asked
        r = await play(A[1], 222222)
        check(r['rv'] == 2 and DB['row']['rev'] == 2, 'A plays on: revision 2', r)
        await B[1].evaluate("(() => { S.t += 60; S.cash += 5; save(); cloudSaveSoon(); })()")
        await B[1].wait_for_selector('#modal .ob.handoff #cgCloud', timeout=15000)
        h = await B[1].evaluate("document.querySelector('#modal .ob.handoff').innerText")
        check(DB['row']['rev'] == 2 and DB['row']['summary']['cash'] == 222222 and 'iPhone' in h and '222 222' in h.replace(' ', ' ') and 'Tidligere lagringer' in h,
              'B saves from an old revision: refused, nothing written over, and the player is asked, with the iPhone and what that game is', h)
        OUT = __file__.rsplit('/', 1)[0] + '/out/'
        for nm, w, hh in (('liggende', 1280, 800), ('stående', 800, 1280), ('telefon', 390, 844)):
            await B[1].set_viewport_size({'width': w, 'height': hh}); await B[1].wait_for_timeout(300)
            await B[1].screenshot(path=OUT + 'sync_handoff_' + nm + '.png')
            box = await B[1].evaluate("(() => { const r = document.querySelector('#modal .ob.handoff').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight]; })()")
            check(box[0] >= 0 and box[1] >= 0 and box[2] <= box[4] and box[3] <= box[5], 'the handoff dialog is inside the screen (' + nm + ')', box)
        await B[1].set_viewport_size({'width': 1100, 'height': 800})
        await B[1].click('#cgCloud'); await B[1].wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && !document.getElementById('cloudGate') && S.cash === 222222", timeout=120000)
        check(await B[1].evaluate("(syncGet() || {}).rv") == 2, 'B takes the newest game: the cash is the iPhone\'s, and the device is on revision 2')
        # A plays again (revision 3); B comes back to the foreground and asks the cloud without the game
        r = await play(A[1], 333333)
        await B[1].evaluate("CLOUD.headT = 0; cloudCheckHead()")
        await B[1].wait_for_selector('#modal .ob.handoff #cgHere', timeout=15000)
        check(DB['calls'].count('save_head') >= 1 and DB['row']['rev'] == 3, 'back in the foreground B asks the cloud without the game and is told that the iPhone has played')
        # «Behold spillet her»: written over (forced), the iPhone's game kept in the history
        await B[1].click('#cgHere')
        for _ in range(60):
            if DB['row']['rev'] >= 4: break
            await B[1].wait_for_timeout(250)
        check(DB['row']['device_name'] == 'Android' and DB['row']['rev'] >= 4 and DB['row']['summary']['cash'] != 333333 and any(h['summary']['cash'] == 333333 for h in DB['hist']),
              '«Behold spillet her» writes over (from the Android phone), and the iPhone\'s game is kept in the history', {'row': DB['row']['rev'], 'hist': len(DB['hist'])})
        await A[0].close(); await B[0].close(); await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
