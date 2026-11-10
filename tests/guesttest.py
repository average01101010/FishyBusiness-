"""A new player as a guest (ui/10f-cloud.js, supabase/migrations/20261006180000_guest.sql; Jonas 06.10.2026: no sign-in to start,
registering after the third landing) with stand-ins for WorkOS and Supabase: the game starts at once with an anonymous sign-in and
talks to the cloud with the guest's token; a card says one landing is left; after the third landing casting off waits for the letter
from Fiskeridirektoratet, which shows what is the player's and closes with «Ikke nå»; a guest cannot buy; «Registrer meg» puts the
game up, takes a one-time code and goes to WorkOS; back as an account the guest's things move over first, and a luxury luck is aboard:
the server's grant (HS1, supabase/migrations/20261110150000_reg_gift.sql; the stand-in gives it from shop_pending), given once, and the
key on the device alone gives nothing.
Prints OK or FEIL per check."""
from _env import GAME, boot, OUT
import asyncio, json, os
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
        r = replies.get(fn, 404 if fn in ('save_put3', 'save_head') else '')
        if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')
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
        # 2. one landing left: a card that says so, with «Senere» (after the statistics question, which comes first and is answered here)
        try: await pg.wait_for_selector('#cgNo', timeout=8000); await pg.click('#cgNo')
        except Exception: pass
        await pg.evaluate("(() => { S.tut = 0; S.landN = 1; S.regAsk = 1; guestNudge(2); })()"); await pg.wait_for_selector('#modal .ob.reg', timeout=15000)
        soft = await pg.evaluate("(() => { const t = document.querySelector('#modal .ob.reg').innerText; document.getElementById('regLater').click(); return {t, closed:document.getElementById('modal').hidden}; })()")
        check('Én landing til' in soft['t'] and 'Senere' in soft['t'] and soft['closed'], 'after the first landing a card says one landing is left on Father\'s papers, and «Senere» closes it', soft['t'][:160])
        # 3. after the second landing: casting off waits, the letter shows what is the player's (the boat still by her mark), asks for the
        # boat's name and a player name, and «Ikke nå» closes it
        d = await pg.evaluate("""(() => { const b = S.boat; S.landN = 2; S.cash = 23456; S.stats.kg = 789; CLOUD.regT = 0; const st0 = b.status, r = depart();
          const box = document.querySelector('#modal .ob.reg'), t = box ? box.innerText : ''; const wide = box ? box.querySelector('.reg-have').getBoundingClientRect().width : 0;
          return {r, st0, st:b.status, t, wide, plan:!!S.plan, unnamed:S.unnamed === true, mark:S.boatName, boat:!!document.getElementById('regBoat'), user:!!document.getElementById('regUser')}; })()""")
        await pg.click('#regLater'); closed = await pg.evaluate("document.getElementById('modal').hidden")
        check(d['r'] is False and d['st'] == d['st0'] == 'port' and 'fiskermanntallet' in d['t'] and 'levert 2 ganger' in d['t'] and d['unnamed'] and d['mark'] in d['t'] and '«' not in d['t'].split('båten din')[0][-30:]
              and not d['boat'] and not d['user'] and 'etterpå' in d['t'] and '23 456 kr' in d['t'] and '789 kg' in d['t']
              and 'denne nettleseren' in d['t'] and 'Luksushaill' in d['t'] and 'Registrer meg' in d['t'] and closed,
              'after the second landing casting off waits: the letter from Fiskeridirektoratet shows the nameless boat by her mark, the money and the fish, says it takes ten seconds and that the names come afterwards, says the game lives only in this browser, offers a luxury luck, and «Ikke nå» closes it', d['t'][:300])
        # 4. a guest cannot buy, and the account card says what a guest is
        g = await pg.evaluate("""(() => { payBuy('haill', () => { window.__given = 1; }); const t = (document.querySelector('#modal .ob.reg') || {}).innerText || ''; document.getElementById('modal').hidden = true;
          PHONE.open('innst'); const card = document.getElementById('phView').innerText; PHONE.show(false); return {t, given:!!window.__given, card:card.includes('Du spiller som gjest') && card.includes('Registrer meg')}; })()""")
        check('Kjøp krever registrering' in g['t'] and not g['given'] and g['card'], 'a guest cannot buy with real money (the letter asks to register instead), and Settings says the game lives in this browser until then', g)
        # 5. «Registrer meg»: the game up first, a one-time code kept on the device, then WorkOS
        await pg.evaluate("(() => { CLOUD.regT = 0; depart(); })()"); await pg.wait_for_selector('#regGo', timeout=10000)
        # one tap: no names before the sign-in (they are asked for afterwards, with a name suggested)
        await pg.evaluate("S.lastReal = Date.now(); CLOUD.lastSave = 0; document.getElementById('regGo').click()")
        await pg.wait_for_function("window.__signUp === 1", timeout=15000)
        check(await pg.evaluate("localStorage.getItem('dsb_names')") is None and not [c for c in calls if c[0] == 'name_free'], 'registering is one tap: nothing is asked or kept before the sign-in', {})
        kept = await pg.evaluate("JSON.parse(localStorage.getItem('dsb_guest_code') || 'null')")
        claim = [c for c in calls if c[0] == 'guest_claim']; puts = [c for c in calls if c[0] == 'save_put2']
        check(kept == {'code': 'code_abc', 'gid': 'g-1'} and claim and claim[0][2] == 'Bearer gtok' and puts and calls.index(puts[-1]) < calls.index(claim[0]),
              '«Registrer meg» puts the game up, takes a one-time code as the guest, keeps it on the device and goes to WorkOS', {'kept': kept, 'order': [c[0] for c in calls[-6:]]})
        check(errs == [], 'sidefeil som gjest', errs)
        await ctx.close()

        # 5b. another dialog (a badge, the landing note) takes the card's place just after it opened: the card is not counted as asked, and comes again
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_put2': {'ok': True, 'saved_at': '2026-10-06T10:00:00Z'}}
        ctx, pg, errs = await page(br, calls, replies, "window.__noUser = 1;")
        await boot(pg)
        await pg.evaluate("(() => { S.tut = 0; S.landN = 1; S.regAsk = 0; guestNudge(2); setTimeout(() => modal('<h2>Første levering</h2><button data-close>OK</button>'), 3200); })()")
        await pg.wait_for_function("(document.querySelector('#modal h2') || {}).textContent === 'Første levering'", timeout=15000)
        first = await pg.evaluate("S.regAsk || 0")
        await pg.evaluate("document.getElementById('modal').hidden = true")
        await pg.wait_for_selector('#modal .ob.reg', timeout=20000)
        check(first == 0, 'a card that another dialog took the place of is not counted as asked, and comes again when the screen is free', {'regAsk_after_overwrite': first})
        await ctx.close()

        # 6. back from registering: the guest's things move to the account first, then the welcome gift
        GIFT = [{'id': 7, 'product': 'reg_luksus', 'data': {'give': 'haill', 'type': 'luksus', 'gift': True}}]   # what tm_hello made on the server
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'guest_merge': {'merged': True, 'save': True}, 'name_claim': '"ok"', 'shop_pending': GIFT, 'shop_done': '', 'haill_use': 'false'}   # (haill_use answers: the server keeps the haill, HS2)
        ctx, pg, errs = await page(br, calls, replies, "localStorage.setItem('dsb_guest_code', JSON.stringify({code:'code_abc', gid:'g-1'})); localStorage.setItem('dsb_guest', JSON.stringify({at:'gtok', rt:'grt', exp:9e9, id:'g-1'})); if (!sessionStorage.getItem('n')){ sessionStorage.setItem('n', 1); localStorage.setItem('dsb_names', JSON.stringify({boat:'Havbris', user:'Kystjenta'})); }")
        await boot(pg)
        STOCK = "(typeof haillStock === 'function' ? haillStock(S.haillInv, S.haillSrv, S.haillUsed) : Object.assign({haill:0, luksus:0, takk:0}, S.haillInv))"   # (HS2: the gift is a haill the server keeps, S.haillSrv; the Luck app shows this number)
        await pg.wait_for_function(STOCK + ".luksus >= 1 && S.user === 'Kystjenta'", timeout=20000)
        r = await pg.evaluate("""({code:localStorage.getItem('dsb_guest_code'), guestKey:localStorage.getItem('dsb_guest'), gift:localStorage.getItem('dsb_reg_gift'), guest:!!CLOUD.guest,
          msg:S.msgs.some(m => m.from === 'Fiskeridirektoratet' && /fiskermanntallet/.test(m.no))})""")
        # (the pictures for Jonas: the toast, then the message in Meldinger, standing and lying)
        try: await pg.wait_for_function("(t => t && t.classList.contains('on') && /Registrert|fiskermanntallet/.test(t.textContent))(document.getElementById('toast'))", timeout=20000)   # (the toasts wait for the start to end)
        except Exception: pass
        for nm_, w, h in (('staaende', 800, 1280), ('liggende', 1280, 800)):
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(250); await pg.screenshot(path=os.path.join(OUT, 'guest-gave-toast-%s.png' % nm_))
        for nm_, w, h in (('staaende', 800, 1280), ('liggende', 1280, 800)):
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.evaluate("document.getElementById('modal').hidden = true; PHONE.show(true); PHONE.open('meld'); PHONE.render()")
            await pg.wait_for_timeout(300); await pg.screenshot(path=os.path.join(OUT, 'guest-gave-meld-%s.png' % nm_))
        await pg.evaluate("PHONE.show(false)"); await pg.set_viewport_size({'width': 1100, 'height': 800})
        # the stand-in goes on offering the grant, and the key asks once more after five seconds: still one luck, one message, and the server told
        await pg.wait_for_timeout(6500)
        one = await pg.evaluate("({luksus:" + STOCK + ".luksus, srv:S.haillSrv, own:S.haillInv.luksus, msgs:S.msgs.filter(m => m.from === 'Fiskeridirektoratet' && /fiskermanntallet/.test(m.no)).length, given:S.shopGiven, shoprc:!!document.querySelector('.shoprc'), bought:S.msgs.some(m => /Takk for kjøpet|59 kr/.test(m.no))})")
        done = [c[1] for c in calls if c[0] == 'shop_done']
        check(one['luksus'] == 1 and one['srv'] == [{'id': 7, 'type': 'luksus'}] and one['own'] == 0 and one['msgs'] == 1 and one['given'] == [7] and done and all(d == {'ids': [7]} for d in done) and not one['shoprc'] and not one['bought'],
              'the welcome gift is the server\'s grant: one luxury luck however often it is asked for, the server told it is given, and no purchase confirmation or price', {'one': one, 'done': done})
        nm = await pg.evaluate("({boat:S.boatName, unnamed:!!S.unnamed, user:S.user, kept:localStorage.getItem('dsb_names')})")
        claim = [c for c in calls if c[0] == 'name_claim']
        check(nm['boat'] == 'Havbris' and not nm['unnamed'] and nm['user'] == 'Kystjenta' and not nm['kept'] and claim and claim[0][1] == {'name': 'Kystjenta'} and claim[0][2] == 'Bearer tok_test',
              'on the account the boat is named «Havbris» and the player name is taken (as the account), and the names are gone from the device', {'nm': nm, 'claim': claim[:1]})
        order = [c[0] for c in calls if c[0] in ('guest_merge', 'tm_hello', 'save_get')]; mg = [c for c in calls if c[0] == 'guest_merge']
        check(order[:3] == ['guest_merge', 'tm_hello', 'save_get'] and mg[0][1] == {'code': 'code_abc'} and mg[0][2] == 'Bearer tok_test' and not r['code'] and not r['guestKey'] and not r['gift'] and not r['guest'] and r['msg'],
              'back as an account: the guest\'s things move over first (with the code, as the account), the guest is forgotten on the device, and a luxury luck and a message from Fiskeridirektoratet are aboard', {'order': order, 'r': r})
        check(errs == [], 'sidefeil som ny konto', errs)
        await ctx.close()
        # 6b. the key alone gives nothing (HS1): an account with dsb_reg_gift set by hand and no grant on the server gets no luck and no message
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'shop_pending': [], 'shop_done': '', 'haill_use': 'false'}
        ctx, pg, errs = await page(br, calls, replies, "if (!sessionStorage.getItem('n')){ sessionStorage.setItem('n', 1); localStorage.setItem('dsb_reg_gift', '1'); }")
        await boot(pg)
        await pg.wait_for_function("!localStorage.getItem('dsb_reg_gift')", timeout=20000); await pg.wait_for_timeout(7000)
        k = await pg.evaluate("({luksus:" + STOCK + ".luksus, msg:S.msgs.some(m => m.from === 'Fiskeridirektoratet' && /fiskermanntallet/.test(m.no)), key:localStorage.getItem('dsb_reg_gift')})")
        asked = len([c for c in calls if c[0] == 'shop_pending'])
        check(k['luksus'] == 0 and not k['msg'] and not k['key'] and asked >= 2, 'the key set by hand with no grant on the server gives no luxury luck and no message; it only asks the server', {'k': k, 'shop_pending': asked})
        check(errs == [], 'sidefeil nøkkelen alene', errs)
        await ctx.close()
        # 7. back as an account with no name and an unnamed boat: one card with a name suggested and the boat to name, one tap to save
        calls = []; replies = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': 'null', 'name_mine': 'null', 'name_free': 'true', 'name_claim': '"ok"', 'save_put2': {'ok': True, 'saved_at': '2026-10-11T10:00:00Z'}}
        ctx, pg, errs = await page(br, calls, replies)
        await boot(pg)
        await pg.evaluate("(() => { S.tut = 0; S.unnamed = true; S.user = null; nameAsk(); })()")   # (the tests, #notut, ask for it themselves)
        await pg.wait_for_selector('#nmUser', timeout=30000)
        sug = await pg.evaluate("({v:document.getElementById('nmUser').value, boat:!!document.getElementById('nmBoat2')})")
        await pg.fill('#nmBoat2', 'Havbris'); await pg.click('#nmUserGo')
        await pg.wait_for_function("S.user && S.boatName === 'Havbris'", timeout=15000)
        claim = [c for c in calls if c[0] == 'name_claim']
        check(sug['boat'] and len(sug['v']) >= 5 and claim and claim[-1][1] == {'name': sug['v']}, 'after the sign-in the card has a free player name suggested and the boat to name; one tap saves both', {'sug': sug, 'claim': [c[1] for c in claim]})
        check(errs == [], 'sidefeil navnekortet', errs)
        await ctx.close(); await br.close()

asyncio.run(main())
