"""A new player as a guest (ui/10f-cloud.js, supabase/migrations/20261006180000_guest.sql; Jonas 06.10.2026: no sign-in to start,
registering after the third landing) with stand-ins for WorkOS and Supabase: the game starts at once with an anonymous sign-in and
talks to the cloud with the guest's token; a card says one landing is left; after the third landing casting off waits for the letter
from Fiskeridirektoratet, which shows what is the player's and closes with «Ikke nå»; a guest cannot buy; «Registrer meg» puts the
game up, takes a one-time code and goes to WorkOS; back as an account the guest's things move over first, and a luxury luck is aboard.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => (window.__noUser ? null : {id:'user_test', email:'ny@test.no'}), getAccessToken: async () => 'tok_test',
  signIn: () => { window.__signIn = 1; }, signUp: () => { window.__signUp = 1; }, signOut: () => {}})};""" % json.dumps(CFG)


async def page(br, calls, replies, init=''):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script(STUB + init)
    async def handle(route):
        req = route.request; fn = req.url.split('?')[0].rsplit('/', 1)[-1]
        try: body = json.loads(req.post_data or '{}')
        except Exception: body = {}
        calls.append((fn, body, req.headers.get('authorization', '')))
        if fn == 'signup': return await route.fulfill(status=200, content_type='application/json', body=json.dumps({'access_token': 'gtok', 'refresh_token': 'grt', 'expires_in': 3600, 'user': {'id': 'g-1'}}))
        r = replies.get(fn, '')
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # 1. a new player: no gate, an anonymous sign-in, and the cloud with the guest's token
        calls = []; replies = {'tm_hello': {'consent': None, 'owned': []}, 'guest_claim': '"code_abc"', 'save_put2': {'ok': True, 'saved_at': '2026-10-06T10:00:00Z'}}
        ctx, pg, errs = await page(br, calls, replies, "window.__noUser = 1;")
        await boot(pg)
        st = await pg.evaluate("({gate:!!document.getElementById('cloudGate'), guest:CLOUD.guest === true, id:CLOUD.user && CLOUD.user.id, on:CLOUD.on})")
        hello = [c for c in calls if c[0] == 'tm_hello']
        check(not st['gate'] and st['guest'] and st['id'] == 'g-1' and st['on'] and any(c[0] == 'signup' for c in calls) and hello and hello[0][2] == 'Bearer gtok',
              'a new player starts at once as a guest: no gate, an anonymous sign-in, and the cloud with the guest\'s token', st)
        # 2. one landing left: a card that says so, with «Senere»
        await pg.evaluate("(() => { S.tut = 0; S.landN = 2; S.regAsk = 1; guestNudge(2); })()"); await pg.wait_for_selector('#modal .ob.reg', timeout=15000)
        soft = await pg.evaluate("(() => { const t = document.querySelector('#modal .ob.reg').innerText; document.getElementById('regLater').click(); return {t, closed:document.getElementById('modal').hidden}; })()")
        check('Én landing til' in soft['t'] and 'Senere' in soft['t'] and soft['closed'], 'after the second landing a card says one landing is left on Father\'s papers, and «Senere» closes it', soft['t'][:160])
        # 3. after the third landing: casting off waits, the letter shows what is the player's, «Ikke nå» closes it
        d = await pg.evaluate("""(() => { const b = S.boat; S.landN = 3; S.cash = 23456; S.stats.kg = 789; S.boatName = 'Havbris'; CLOUD.regT = 0; const st0 = b.status, r = depart();
          const box = document.querySelector('#modal .ob.reg'), t = box ? box.innerText : ''; const wide = box ? box.querySelector('.reg-have').getBoundingClientRect().width : 0;
          return {r, st0, st:b.status, t, wide, plan:!!S.plan}; })()""")
        await pg.click('#regLater'); closed = await pg.evaluate("document.getElementById('modal').hidden")
        check(d['r'] is False and d['st'] == d['st0'] == 'port' and 'fiskermanntallet' in d['t'] and '«Havbris»' in d['t'] and '23 456 kr' in d['t'] and '789 kg' in d['t']
              and 'denne nettleseren' in d['t'] and 'Luksushaill' in d['t'] and 'Registrer meg' in d['t'] and closed,
              'after the third landing casting off waits: the letter from Fiskeridirektoratet shows the boat, the money and the fish, says the game lives only in this browser, offers a luxury luck, and «Ikke nå» closes it', d['t'][:300])
        # 4. a guest cannot buy, and the account card says what a guest is
        g = await pg.evaluate("""(() => { payBuy('haill', () => { window.__given = 1; }); const t = (document.querySelector('#modal .ob.reg') || {}).innerText || ''; document.getElementById('modal').hidden = true;
          PHONE.open('innst'); const card = document.getElementById('phView').innerText; PHONE.show(false); return {t, given:!!window.__given, card:card.includes('Du spiller som gjest') && card.includes('Registrer meg')}; })()""")
        check('Kjøp krever registrering' in g['t'] and not g['given'] and g['card'], 'a guest cannot buy with real money (the letter asks to register instead), and Settings says the game lives in this browser until then', g)
        # 5. «Registrer meg»: the game up first, a one-time code kept on the device, then WorkOS
        await pg.evaluate("(() => { CLOUD.regT = 0; depart(); })()"); await pg.wait_for_selector('#regGo', timeout=10000)
        await pg.evaluate("S.lastReal = Date.now(); CLOUD.lastSave = 0; document.getElementById('regGo').click()")
        await pg.wait_for_function("window.__signUp === 1", timeout=15000)
        kept = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_guest_code') || 'null')")
        claim = [c for c in calls if c[0] == 'guest_claim']; puts = [c for c in calls if c[0] == 'save_put2']
        check(kept == {'code': 'code_abc', 'gid': 'g-1'} and claim and claim[0][2] == 'Bearer gtok' and puts and calls.index(puts[-1]) < calls.index(claim[0]),
              '«Registrer meg» puts the game up, takes a one-time code as the guest, keeps it on the device and goes to WorkOS', {'kept': kept, 'order': [c[0] for c in calls[-6:]]})
        check(errs == [], 'sidefeil som gjest', errs)
        await ctx.close()

        # 6. back from registering: the guest's things move to the account first, then the welcome gift
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'guest_merge': {'merged': True, 'save': True}}
        ctx, pg, errs = await page(br, calls, replies, "localStorage.setItem('dsb_guest_code', JSON.stringify({code:'code_abc', gid:'g-1'})); localStorage.setItem('dsb_guest', JSON.stringify({at:'gtok', rt:'grt', exp:9e9, id:'g-1'}));")
        await boot(pg)
        await pg.wait_for_function("S.haillInv && S.haillInv.luksus >= 1", timeout=20000)
        r = await pg.evaluate("""({code:localStorage.getItem('dsb_guest_code'), guestKey:localStorage.getItem('dsb_guest'), gift:localStorage.getItem('dsb_reg_gift'), guest:!!CLOUD.guest,
          msg:S.msgs.some(m => m.from === 'Fiskeridirektoratet' && /fiskermanntallet/.test(m.no))})""")
        order = [c[0] for c in calls if c[0] in ('guest_merge', 'tm_hello', 'save_get')]; mg = [c for c in calls if c[0] == 'guest_merge']
        check(order[:3] == ['guest_merge', 'tm_hello', 'save_get'] and mg[0][1] == {'code': 'code_abc'} and mg[0][2] == 'Bearer tok_test' and not r['code'] and not r['guestKey'] and not r['gift'] and not r['guest'] and r['msg'],
              'back as an account: the guest\'s things move over first (with the code, as the account), the guest is forgotten on the device, and a luxury luck and a message from Fiskeridirektoratet are aboard', {'order': order, 'r': r})
        check(errs == [], 'sidefeil som ny konto', errs)
        await ctx.close(); await br.close()

asyncio.run(main())
