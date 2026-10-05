"""The cloud in the game (ui/10f-cloud.js, 04.10.2026) with stand-ins for WorkOS and Supabase: the sign-in gate stops the game for a
player who is not signed in; signed in, the game starts and says hello; the consent is asked with the year of birth; with a yes the
events (an app opened, a grounding) go up in a batch, an error is reported, a session that ends a minute after grounding counts as a
rage quit; the save goes up as a save code with what the game is (summary) and the account's save it comes from (base); when the
account has moved on (another device saved) the player chooses between the two games, seeing each, and «this one» is forced up; the
earlier saves are listed in Settings; on a new device the account's save replaces the empty one here, and a device whose game has been
played since the account moved on asks before the game starts (05.10.2026, the save sync); the account card is in Settings; the Admin
app only for the flagged account. Prints OK or FEIL."""
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
        if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')   # a function the database does not have
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
        calls = []; replies = {'tm_hello': {'consent': None, 'owned': []}, 'save_get': 'null', 'save_put2': {'ok': True, 'saved_at': '2026-10-05T10:00:00.123+00:00'}}
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
        errc = [c[1] for c in calls if c[0] == 'tm_error']; puts = [c[1] for c in calls if c[0] == 'save_put2']
        last = batches[-1] if batches else {}
        check(first == ['tm_hello', 'save_get'] and all(c[2] == 'Bearer tok_test' for c in calls if c[0] != 'tm_perf' and not c[0].startswith('push-send')), 'signed in, the game starts after hello and the save check, with the WorkOS token', first)
        check(cons == [{'yes': True, 'birth_year': 1990}] and r['consent'] and closed, 'the consent is asked once with the year of birth, the yes is sent and «Ja, del» closes the dialog', {'calls': cons, 'closed': closed})
        check('start' in ev and 'redskap' in apps and 'aground' in ev and len(batches) >= 2 and last.get('active_s', -1) >= 0 and last.get('meta', {}).get('boat'), 'the events go up in batches with the session and the game state', {'ev': ev[:12], 'meta': last.get('meta')})
        check(last.get('ended') is True and last.get('reason') == 'rage' and 'rage' in ev, 'a session that ends within a minute of grounding counts as a rage quit', {'ended': last.get('ended'), 'reason': last.get('reason')})
        check(any('cloudtest boom' in e['msg'] for e in errc), 'an error in the page is reported', [e['msg'] for e in errc])
        sm = (puts[0].get('summary') or {}) if puts else {}
        check(len(puts) == 1 and puts[0]['data'].startswith('KYST2:') and puts[0]['force'] is False and puts[0]['base'] is None and sm.get('day', 0) >= 1 and 'cash' in sm and sm.get('type'),
              'the save goes up as a save code with its summary, not forced, from no account save yet', {k: (v[:12] if isinstance(v, str) else v) for k, v in (puts[0] if puts else {}).items()})
        check(r['card'], 'the account card is in Settings, with the e-mail')
        check(not r['admIcon'] and not r['admApp'], 'an account without the admin flag has no Admin app on the phone and cannot open it', {'icon': r['admIcon'], 'app': r['admApp']})
        # the account has moved on (another device saved): nothing is written over, the player sees both games and chooses
        sync = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_sync_user_test') || 'null')")
        replies['save_put2'] = {'ok': False, 'cloud': {'saved_at': '2030-01-01T10:00:00+00:00', 'game_t': 99999, 'summary': {'day': 40, 'cash': 512000, 'boat': 'Havørn', 'type': 'sjark', 'fleet': 2, 'tut': False}}}
        n0 = len(calls)
        c2 = await pg.evaluate("""async () => { S.lastReal = Date.now() + 5; save(); CLOUD.lastSave = 0; await cloudSaveSoon(); await cloudSaveSoon(); const m = document.getElementById('modal');
          return {open:!m.hidden, two:/To spill|Two games/.test(m.innerText), cloud:/Dag 40/.test(m.innerText) && /512 000 kr/.test(m.innerText) && /Havørn/.test(m.innerText), here:(document.getElementById('cgHere') || {}).innerText}; }""")
        puts2 = [c[1] for c in calls[n0:] if c[0] == 'save_put2']
        check(sync and sync['rev'] == '2026-10-05T10:00:00.123+00:00' and len(puts2) == 1 and puts2[0]['base'] == sync['rev'] and puts2[0]['force'] is False,
              'the device keeps which account save its game comes from, and sends it with the next save', {'sync': sync, 'puts': [(q['base'], q['force']) for q in puts2]})
        check(c2['open'] and c2['two'] and c2['cloud'] and c2['here'] and 'Dag' in c2['here'], 'the account has moved on: nothing is written over, and the player sees both games (day, money, boat) and chooses; no second dialog meanwhile', c2)
        replies['save_put2'] = {'ok': True, 'saved_at': '2030-01-01T10:05:00+00:00'}; n0 = len(calls)
        await pg.click('#cgHere'); await pg.wait_for_function("JSON.parse(localStorage.getItem('dsb_sync_user_test')).rev.startsWith('2030-01-01T10:05')", timeout=10000)
        puts3 = [c[1] for c in calls[n0:] if c[0] == 'save_put2']
        check(len(puts3) == 1 and puts3[0]['force'] is True and await pg.evaluate("document.getElementById('modal').hidden && !CLOUD.forceNext"), '«Spillet på denne enheten» puts it up forced (the account keeps the other in its history)', [(q['base'], q['force']) for q in puts3])
        # the earlier saves in Settings
        replies['save_hist_list'] = [{'id': 7, 'saved_at': '2030-01-01T10:00:00+00:00', 'game_t': 99999, 'summary': {'day': 40, 'cash': 512000, 'boat': 'Havørn', 'type': 'sjark', 'fleet': 2}}]
        await pg.evaluate("(() => { PHONE.open('innst'); document.querySelector('#phone [data-pa=cloudHist]').click(); })()")
        await pg.wait_for_selector('#phone [data-pa=cloudRestore][data-id="7"]', timeout=10000)
        h = await pg.evaluate("""(() => { const r = document.querySelector('#phone [data-pa=cloudRestore][data-id="7"]').closest('.hrow'); const q = r.getBoundingClientRect(), p = document.getElementById('phone').getBoundingClientRect(); return {text:r.innerText, fits:q.right <= p.right + 1}; })()""")
        check('Dag 40' in h['text'] and 'Havørn' in h['text'] and h['fits'], "«Tidligere lagringer» in Settings lists the account's earlier saves, each with «Hent»", h)
        await pg.evaluate("PHONE.show(false)")
        # a database without the migration yet (save_put2 is not there): the old put, so the game is still saved
        replies['save_put2'] = 404; replies['save_put'] = {'ok': True}; n0 = len(calls)
        await pg.evaluate("async () => { S.lastReal = Date.now() + 9; save(); CLOUD.lastSave = 0; await cloudSaveSoon(); S.lastReal = Date.now() + 19; save(); await cloudSaveSoon(); }")
        fb = [c[0] for c in calls[n0:] if c[0].startswith('save_put')]
        check(fb == ['save_put2', 'save_put', 'save_put'], 'a database without the new function: the game falls back to the old put, and asks only once', fb)
        code = await pg.evaluate("async () => { S.company = 'Skytest AS'; S.lastReal = Date.now(); save(); return await saveCode(); }")
        print('errors:', errs[:3]); await ctx.close()

        # 3. a new device: the account's save replaces the empty one here
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': [], 'admin': True}, 'save_get': {'data': code, 'saved_at': '2030-01-01T10:00:00Z', 'game_t': 1}}
        ctx, pg, errs = await page(br, calls, replies)
        await pg.goto(GAME); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.company === 'Skytest AS'", timeout=120000)
        n = await pg.evaluate("S.company")
        sync = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_sync_user_test') || 'null')")
        check(n == 'Skytest AS' and sync and sync['rev'] == '2030-01-01T10:00:00Z', 'on a new device the save on the account replaces the empty one here, and the device keeps where it comes from', {'company': n, 'sync': sync})
        adm = await pg.evaluate("(() => { PHONE.open('home'); const i = !!document.querySelector('#phView [data-a=admin]'); PHONE.open('admin'); const a = PHONE.app === 'admin'; PHONE.show(false); return i && a; })()")
        check(adm, "Jonas's account (flagged in the database) has the Admin app")
        # 4. played here, and the account moved on elsewhere meanwhile: the player chooses before the game starts, seeing both
        # (a game of no time and no boat name is an untouched one and the account's is taken without asking, so this one has hours on it)
        await pg.evaluate("(() => { S.company = 'Her AS'; S.cash = 77000; S.t = Math.max(S.t || 0, 600); save(); const k = 'dsb_sync_user_test', s = JSON.parse(localStorage.getItem(k)); s.at = Date.now() - 600000; localStorage.setItem(k, JSON.stringify(s)); })()")
        replies['save_get'] = {'data': code, 'saved_at': '2031-01-01T10:00:00Z', 'game_t': 2, 'summary': {'day': 9, 'cash': 33000, 'boat': 'Fjordbris', 'type': 'skiff', 'fleet': 1}}
        # (the page's last save as it closes is refused: the account has moved on)
        replies['save_put2'] = {'ok': False, 'cloud': {'saved_at': '2031-01-01T10:00:00Z', 'game_t': 2}}
        await pg.reload(); await pg.wait_for_selector('#cloudGate #cgHere', timeout=90000)
        replies['save_put2'] = {'ok': True, 'saved_at': '2031-01-01T10:09:00+00:00'}
        g = await pg.evaluate("(() => ({here:document.getElementById('cgHere').innerText, cloud:document.getElementById('cgCloud').innerText, ready:typeof SIMREADY !== 'undefined' && SIMREADY}))()")
        check('77 000 kr' in g['here'] and 'Dag 9' in g['cloud'] and 'Fjordbris' in g['cloud'] and not g['ready'], 'played here while the account moved on elsewhere: before the game starts the player sees both and chooses', g)
        await pg.screenshot(path='cloud_choose.png')
        n0 = len(calls); await pg.click('#cgHere')
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && !document.getElementById('cloudGate')", timeout=120000)
        r4 = await pg.evaluate("async () => { S.lastReal = Date.now(); save(); CLOUD.lastSave = 0; await cloudSaveSoon(); return {company:S.company}; }")
        puts4 = [c[1] for c in calls[n0:] if c[0] == 'save_put2']
        check(r4['company'] == 'Her AS' and puts4 and puts4[0]['force'] is True, '«Spillet på denne enheten» starts it and puts it up forced', {'company': r4['company'], 'puts': [(q['base'], q['force']) for q in puts4]})
        # 5. deleting the account takes the game on this device too, so the next sign-in begins again with Father's letter (05.10.2026)
        replies['delete_me'] = {'ok': True}
        d5 = await pg.evaluate("""async () => { window.confirm = () => true; cloudAct('cloudDel'); await new Promise(r => setTimeout(r, 800));
          return {game:localStorage.getItem(KEY), prev:localStorage.getItem(KEY_PREV), signed:localStorage.getItem('dsb_signed'), sync:localStorage.getItem('dsb_sync_user_test'), out:window.__signOut === 1}; }""")
        await pg.wait_for_timeout(1500)
        d5['after'] = await pg.evaluate("localStorage.getItem(KEY)")
        check(d5['out'] and not d5['game'] and not d5['prev'] and not d5['signed'] and not d5['sync'] and not d5['after'], 'deleting the account takes the game on this device too, and nothing is saved again on the way out', d5)
        print('errors:', errs[:3]); await br.close()


asyncio.run(main())
