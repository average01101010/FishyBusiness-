"""The cloud in the game (ui/10f-cloud.js, 04.10.2026) with stand-ins for WorkOS and Supabase: the sign-in gate stops the game for a
player who is not signed in; signed in, the game starts and says hello; the consent is asked with the year of birth; with a yes the
events (an app opened, a grounding) go up in a batch, an error is reported, a session that ends a minute after grounding counts as a
rage quit; the save goes up as a save code, a newer save on the account is offered when the cloud refuses an older one, and a newer
cloud save replaces the one on a new device; the account card is in Settings; the Admin app only for the flagged account. Prints OK or
FEIL."""
from _env import GAME, boot
import asyncio, json, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => (window.__noUser ? null : {id:'user_test', email:'jonas@test.no'}), getAccessToken: async () => 'tok_test',
  signIn: () => { window.__signIn = 1; }, signUp: () => {}, signOut: () => { window.__signOut = 1; }})};""" % json.dumps(CFG)


async def page(br, calls, replies, no_user=False):
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)) if 'cloudtest boom' not in str(e) else None)
    await pg.add_init_script(STUB + ("window.__noUser = 1;" if no_user else ""))
    async def handle(route):
        req = route.request; fn = req.url.rsplit('/', 1)[-1]
        try: body = json.loads(req.post_data or '{}')
        except Exception: body = {}
        calls.append((fn, body, req.headers.get('authorization', '')))
        r = replies.get(fn, '')
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # 1. not signed in: the gate, and no game
        calls = []; ctx, pg, errs = await page(br, calls, {}, no_user=True)
        await pg.goto(GAME); await pg.wait_for_selector('#cloudGate #cgIn', timeout=90000); await pg.wait_for_timeout(1500)
        g = await pg.evaluate("(() => { document.getElementById('cgIn').click(); return {gate:!!document.getElementById('cloudGate'), signIn:window.__signIn === 1, ready:typeof SIMREADY !== 'undefined' && SIMREADY}; })()")
        check(g['gate'] and g['signIn'] and not g['ready'] and not calls, 'not signed in, the gate stops the game, «Logg inn» goes to WorkOS, and nothing is sent', g)
        # the gate's links to the terms and the privacy page lead to the pages next to the game, with their style put in
        legal = await pg.evaluate("""async () => { const out = {};
          for (const a of document.querySelectorAll('#cloudGate a')){ const r = await fetch(a.getAttribute('href')); const t = await r.text();
            out[a.getAttribute('href')] = r.status + ' ' + ((t.match(/<h1>([^<]+)/) || [])[1] || '') + (t.includes('<!--@css-->') ? ' nocss' : ''); }
          return out; }""")
        check(legal.get('vilkar.html') == '200 Vilkår' and legal.get('personvern.html') == '200 Personvernerklæring', 'the gate links the terms and the privacy page, and both are there', legal)
        await ctx.close()

        # 2. signed in: hello, consent, events, errors, rage quit, the save
        calls = []; replies = {'tm_hello': {'consent': None, 'owned': []}, 'save_get': 'null', 'save_put': {'ok': True}}
        ctx, pg, errs = await page(br, calls, replies)
        await boot(pg)
        first = [c[0] for c in calls[:2]]
        await pg.wait_for_selector('#cgYes', timeout=15000)
        await pg.fill('#cgYear', '1990'); await pg.click('#cgYes'); await pg.wait_for_timeout(500)
        cons = [c[1] for c in calls if c[0] == 'tm_consent']; closed = await pg.evaluate("document.getElementById('modal').hidden")
        r = await pg.evaluate("""async () => { PHONE.open('redskap'); PHONE.show(false);
          setTimeout(() => { throw new Error('cloudtest boom'); }, 0); await new Promise(res => setTimeout(res, 300));
          await cloudFlush(false);
          runAground({...S.boat.pos}); await cloudFlush(true);
          S.lastReal = Date.now(); save(); CLOUD.lastSave = 0; await cloudSaveSoon();
          PHONE.open('innst'); const card = document.body.innerText.includes('jonas@test.no'); PHONE.show(false);
          PHONE.open('home'); const admIcon = !!document.querySelector('#phView [data-a=admin]'); PHONE.open('admin'); const admApp = PHONE.app === 'admin'; PHONE.show(false);
          return {sid:CLOUD.sid, consent:CLOUD.consent, card, admIcon, admApp}; }""")
        batches = [c[1] for c in calls if c[0] == 'tm_batch']; ev = [e['k'] for b in batches for e in b.get('evs', [])]
        apps = [e['d'].get('app') for b in batches for e in b.get('evs', []) if e['k'] == 'app']
        errc = [c[1] for c in calls if c[0] == 'tm_error']; puts = [c[1] for c in calls if c[0] == 'save_put']
        last = batches[-1] if batches else {}
        check(first == ['tm_hello', 'save_get'] and all(c[2] == 'Bearer tok_test' for c in calls if c[0] != 'tm_perf'), 'signed in, the game starts after hello and the save check, with the WorkOS token', first)
        check(cons == [{'yes': True, 'birth_year': 1990}] and r['consent'] and closed, 'the consent is asked once with the year of birth, the yes is sent and «Ja, del» closes the dialog', {'calls': cons, 'closed': closed})
        check('start' in ev and 'redskap' in apps and 'aground' in ev and len(batches) >= 2 and last.get('active_s', -1) >= 0 and last.get('meta', {}).get('boat'), 'the events go up in batches with the session and the game state', {'ev': ev[:12], 'meta': last.get('meta')})
        check(last.get('ended') is True and last.get('reason') == 'rage' and 'rage' in ev, 'a session that ends within a minute of grounding counts as a rage quit', {'ended': last.get('ended'), 'reason': last.get('reason')})
        check(any('cloudtest boom' in e['msg'] for e in errc), 'an error in the page is reported', [e['msg'] for e in errc])
        check(len(puts) == 1 and puts[0]['data'].startswith('KYST2:') and puts[0]['force'] is False, 'the save goes up as a save code, not forced', {k: (v[:12] if isinstance(v, str) else v) for k, v in (puts[0] if puts else {}).items()})
        check(r['card'], 'the account card is in Settings, with the e-mail')
        check(not r['admIcon'] and not r['admApp'], 'an account without the admin flag has no Admin app on the phone and cannot open it', {'icon': r['admIcon'], 'app': r['admApp']})
        # the cloud refuses an older save: the player is asked which to keep
        replies['save_put'] = {'ok': False, 'cloud': {'saved_at': '2030-01-01T10:00:00Z', 'game_t': 99999}}
        c2 = await pg.evaluate("async () => { S.lastReal = Date.now() + 5; CLOUD.lastSave = 0; await cloudSaveSoon(); return !document.getElementById('modal').hidden && /Nyere lagring|newer save/.test(document.getElementById('modal').innerText); }")
        check(c2, 'a newer save on the account: the player chooses which to keep')
        code = await pg.evaluate("async () => { S.company = 'Skytest AS'; S.lastReal = Date.now(); save(); return await saveCode(); }")
        print('errors:', errs[:3]); await ctx.close()

        # 3. a new device: the account's save replaces the empty one here
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': [], 'admin': True}, 'save_get': {'data': code, 'saved_at': '2030-01-01T10:00:00Z', 'game_t': 1}}
        ctx, pg, errs = await page(br, calls, replies)
        await pg.goto(GAME); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.company === 'Skytest AS'", timeout=120000)
        n = await pg.evaluate("S.company")
        check(n == 'Skytest AS', 'on a new device the newer save on the account replaces the one here', n)
        adm = await pg.evaluate("(() => { PHONE.open('home'); const i = !!document.querySelector('#phView [data-a=admin]'); PHONE.open('admin'); const a = PHONE.app === 'admin'; PHONE.show(false); return i && a; })()")
        check(adm, "Jonas's account (flagged in the database) has the Admin app")
        print('errors:', errs[:3]); await br.close()


asyncio.run(main())
