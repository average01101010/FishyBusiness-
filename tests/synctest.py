"""The save between devices, one device at a time (ui/10f-cloud.js; supabase/migrations/20261011120000_sync.sql and
20261013120000_active.sql; Jonas 13.10.2026: «Det skal ikke kunne være mulig å spille på to enheter samtidig … Lagringen mellom enhetene
må være 100% bulletproof og oppdatert til enhver tid»). Two devices (an Android tablet and an iPhone) on one account against a stand-in
for the database that counts the saves and keeps the active device the way the SQL does. The tablet plays and saves, then plays on
without saving; the phone starts: it takes the game, waits for the tablet's very last state (the hand-over) and goes on exactly from it;
the tablet stops playing and says the game is on the iPhone (stående and liggende). «Spill her i stedet» on the tablet takes the game
back with what the phone did meanwhile, and the phone stops in its turn. A tablet that slept wakes paused, before it plays. When two
games really went apart, the choice shows both, each with what it is, and «Spillet på denne enheten» writes over (the other kept in the
history). The card in Settings says when the game was saved. Prints OK or FEIL."""
from _env import GAME, OUT, boot
import asyncio, json, os, time
from datetime import datetime, timezone
from playwright.async_api import async_playwright

IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
TAB = 'Mozilla/5.0 (Linux; Android 14; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_sync', email:'sync@test.no'}), getAccessToken: async () => 'tok_sync',
  signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
READY = "typeof SIMREADY !== 'undefined' && SIMREADY && !document.getElementById('cloudGate')"
bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:400])
    if not c: bad.append(msg)

# the stand-in for the cloud: one save row with its revision and the active device, and what was written over
DB = {'row': None, 'hist': [], 'calls': []}
iso = lambda t=None: datetime.fromtimestamp(t or time.time(), timezone.utc).isoformat()
HEAD = ('rev', 'saved_at', 'game_t', 'summary', 'device', 'device_name', 'updated_at', 'active_dev', 'active_name', 'active_since')
def head(): return dict({k: DB['row'][k] for k in HEAD}, now=iso()) if DB['row'] else None
def put4(b):
    cur = DB['row']; other = bool(cur and cur.get('active_dev') and cur['active_dev'] != b['device'])
    if cur and not b.get('force') and (cur['rev'] != b.get('base_rev') or (other and not b.get('handoff'))):
        return {'ok': False, 'moved': cur['device'] != b['device'], 'taken': other, 'cloud': {k: cur[k] for k in HEAD}}
    if cur and b.get('force'): DB['hist'].append(dict(cur))
    rev = (cur['rev'] if cur else 0) + 1
    keep = b.get('handoff') and other
    DB['row'] = {'data': b['data'], 'saved_at': b['saved_at'], 'game_t': b['game_t'], 'summary': b['summary'], 'rev': rev, 'device': b['device'],
                 'device_name': b['device_name'], 'updated_at': iso(),
                 'active_dev': cur['active_dev'] if keep else b['device'], 'active_name': cur['active_name'] if keep else b['device_name'],
                 'active_at': cur['active_at'] if keep else time.time(),
                 'active_since': cur['active_since'] if keep else (cur['active_since'] if cur and cur.get('active_dev') == b['device'] else iso())}
    return {'ok': True, 'rev': rev, 'saved_at': b['saved_at'], 'updated_at': DB['row']['updated_at']}
def claim(b):
    cur = DB['row']
    if not cur: return {'ok': False, 'now': iso()}
    r = {'ok': True, 'rev': cur['rev'], 'now': iso(), 'prev_dev': cur.get('active_dev'), 'prev_name': cur.get('active_name'),
         'prev_age': (time.time() - cur['active_at']) if cur.get('active_at') else None}
    if cur.get('active_dev') != b['device']: cur['active_since'] = iso()
    cur.update(active_dev=b['device'], active_name=b['device_name'], active_at=time.time())
    return r
def beat(b):
    cur = DB['row']
    if not cur: return None
    if not cur.get('active_dev'): cur.update(active_dev=b['device'], active_at=time.time(), active_since=iso())
    elif cur['active_dev'] == b['device']: cur['active_at'] = time.time()
    return head()

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
        elif fn == 'save_get': r = DB['row'] and {k: v for k, v in DB['row'].items() if k != 'active_at'}
        elif fn == 'save_head': r = head()
        elif fn in ('save_put4', 'save_put3'): r = put4(b)
        elif fn == 'save_claim': r = claim(b)
        elif fn == 'save_beat': r = beat(b)
        else: r = ''
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs

async def shots(pg, name, sel):
    for nm, w, hh in (('liggende', 1280, 800), ('stående', 800, 1280)):
        await pg.set_viewport_size({'width': w, 'height': hh}); await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(OUT, 'sync_' + name + '_' + nm + '.png'))
        box = await pg.evaluate("s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom, innerWidth, innerHeight]; }", sel)
        check(box[0] >= 0 and box[1] >= 0 and box[2] <= box[4] and box[3] <= box[5], 'the ' + name + ' card is inside the screen (' + nm + ')', box)
    await pg.set_viewport_size({'width': 1100, 'height': 800})

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # 1. the tablet plays and saves, then plays on (the catch on the way in) without saving yet
        A = await device(br, TAB); await boot(A[1])
        r = await A[1].evaluate("""async () => { S.intro = true; S.tut = 0; S.t = Math.max(S.t || 0, 900); S.cash = 111111; save(); CLOUD.headT = 0; await cloudSaveSoon(false, true);
          S.cash = 123456; save(); return {rv:TAB.rv, text:cloudStatusText()}; }""")
        check(r['rv'] == 1 and DB['row']['device_name'] == 'Android-nettbrett' and DB['row']['active_dev'] and 'Lagret i skyen' in r['text'], 'the tablet saves: revision 1, and it has the game', r)
        # 2. the phone starts: takes the game, waits for the tablet's last state, and goes on exactly from it
        B = await device(br, IOS); await B[1].goto(GAME)
        waited = True
        try: await B[1].wait_for_function("/Henter spillet fra Android-nettbrett/.test(document.body.innerText)", timeout=60000, polling=100)
        except Exception: waited = False
        told = True
        try: await B[1].wait_for_function("/Fortsetter der du slapp på Android-nettbrett/.test(document.body.innerText)", timeout=120000, polling=100)
        except Exception: told = False
        await B[1].wait_for_function(READY, timeout=120000)
        b0 = await B[1].evaluate("({cash:S.cash, rv:TAB.rv})")
        check(waited and told and b0['cash'] == 123456 and DB['row']['active_name'] == 'iPhone', 'the phone takes the game, waits for the tablet\'s last state and goes on from exactly there (the catch not saved yet came along)', {'waited': waited, 'told': told, 'b0': b0, 'active': DB['row']['active_name']})
        # 3. the tablet has stopped: it says the game is on the iPhone, and plays no more
        await A[1].wait_for_selector('#cgPlay', timeout=20000)
        a1 = await A[1].evaluate("(async () => { const t0 = S.t, txt = document.getElementById('cloudGate').innerText; await new Promise(r => setTimeout(r, 3000)); return {held:TAB.held, txt, same:S.t === t0}; })()")
        check(a1['held'] and a1['same'] and 'Du spiller nå på iPhone' in a1['txt'] and 'Spill her i stedet' in a1['txt'], 'the tablet stops playing at once and says the game is on the iPhone', a1)
        await shots(A[1], 'held', '#cgPlay')
        # 4. the phone plays on; «Spill her i stedet» on the tablet takes the game back with what the phone did, and the phone stops
        await B[1].evaluate("(() => { S.cash = 222222; save(); })()")
        await A[1].click('#cgPlay')
        await A[1].wait_for_function(READY + " && S.cash === 222222", timeout=120000)
        await B[1].wait_for_selector('#cgPlay', timeout=20000)
        check(DB['row']['active_name'] == 'Android-nettbrett' and await B[1].evaluate("TAB.held"), '«Spill her i stedet» brings the game back to the tablet as the phone left it, and the phone stops in its turn', DB['row']['active_name'])
        # 5. a device that slept wakes paused, before it plays anything (the phone took the game back meanwhile)
        await B[1].click('#cgPlay'); await B[1].wait_for_function(READY + " && !TAB.held", timeout=120000)
        await A[1].wait_for_selector('#cgPlay', timeout=20000)
        await B[1].evaluate("(() => { TAB.held = false; })()")
        await A[1].evaluate("(() => { document.getElementById('cloudGate').remove(); TAB.held = false; CLOUD.beatAt = 0; })()")   # as if it slept through it
        w = await A[1].evaluate("(async () => { const t0 = S.t; lastWall = Date.now() - 60000; tick(); const waiting = TAB.wait; await new Promise(r => setTimeout(r, 2500)); return {waiting, held:TAB.held, same:S.t === t0}; })()")
        check(w['waiting'] and w['held'] and w['same'], 'a tablet that slept asks the account before it plays, and stays paused', w)
        # 6. two games that really went apart: both shown with what they are; «Spillet på denne enheten» writes over, the other kept
        await A[1].evaluate("(() => { document.getElementById('cloudGate').remove(); TAB.held = false; })()")
        await A[1].evaluate("(() => { cloudConflict({rev:99, device:'x', device_name:'iPhone', updated_at:new Date().toISOString(), summary:{t:70000, day:49, cash:333333, boat:'Havbris', type:'sjark', fleet:1}}, true); })()")
        await A[1].wait_for_selector('#cloudGate .handoff #cgHere', timeout=15000)
        h = await A[1].evaluate("document.getElementById('cloudGate').innerText")
        check('Hvilket spill vil du fortsette med?' in h and 'Spillet fra iPhone' in h and '333 333' in h.replace(' ', ' ') and 'Spillet på denne enheten' in h and 'Tidligere lagringer' in h,
              'when two games went apart, the choice shows both, each with what it is, and says the other is kept', h)
        await shots(A[1], 'choice', '#cloudGate .handoff')
        n0 = len(DB['hist'])
        await A[1].click('#cgHere')
        for _ in range(60):
            if len(DB['hist']) > n0: break
            await A[1].wait_for_timeout(250)
        check(len(DB['hist']) > n0 and DB['row']['device_name'] == 'Android-nettbrett', '«Spillet på denne enheten» writes over, and the other game is kept in the history', {'hist': len(DB['hist']), 'row': DB['row']['device_name']})
        check(not A[2] and not B[2], 'no page errors', (A[2] + B[2])[:3])
        await A[0].close(); await B[0].close(); await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
