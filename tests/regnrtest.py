"""One's own number in the registration mark (des_reg, ui/10j-paint.js pntreg and regSet; supabase/migrations/20261107120000_reg_in_use.sql)
after the shop's review 07.11.2026, with stand-ins for WorkOS, Supabase and Stripe as in kjoptest.py. The stand-in for the database keeps
the claims as the migration does: keep is the marks the player's other boats wear, a claim lets go of the player's others, ten in use at
once is the most, and a call without keep counts every claim (as 20261007100000_designs.sql did for all of them). Checked: a number
another player has is refused before the payment, with words that say so, and nothing goes to Stripe; a free one goes to Stripe and onto
the boat when the purchase comes back; eleven numbers in a row on one boat all go on, and only the numbers in use stay claimed (the other
boat's too); ten in use says so; a server without the migration (reg_check 404) still sells and sets the number as before. OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:700]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'spiller@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};
window.__toasts = []; document.addEventListener('DOMContentLoaded', () => { const el = document.getElementById('toast'); if (el) new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, {childList:true, characterData:true, subtree:true}); });""" % json.dumps(CFG)
BASE = GAME.split('#')[0]
HASH = '#' + GAME.split('#', 1)[1]   # #notut, and no3d with KYST_LITE=1
url = lambda q='': BASE + (('&' if '?' in BASE else '?') + q if q else '') + HASH
ME = 'user_test'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []; calls = []
        st = {'pending': [], 'claims': {}, 'force': {}, 'old': False}

        def reg_check(mark, keep):
            if mark in st['force']: return st['force'][mark]
            o = st['claims'].get(mark)
            if o: return 'ok' if o == ME else 'taken'
            n = sum(1 for m, q in st['claims'].items() if q == ME and (keep is None or m in keep))
            return 'many' if n >= 10 else 'ok'

        async def handle(route):
            req = route.request; u = req.url
            if '/functions/v1/shop-checkout' in u:
                if req.method == 'GET': await route.fulfill(status=200, content_type='application/json', body=json.dumps({'ready': True})); return
                calls.append(('checkout', json.loads(req.post_data or '{}')))
                await route.fulfill(status=200, content_type='application/json', body=json.dumps({'url': 'https://checkout.stripe.test/c/pay/cs_test_1'})); return
            fn = u.rsplit('/', 1)[-1]
            try: body = json.loads(req.post_data or '{}')
            except Exception: body = {}
            calls.append((fn, body))
            if fn in ('reg_check', 'reg_claim'):
                keep, mark = body.get('keep'), body.get('mark')
                # PostgREST: a function with these argument names that is not there is a 404 (the old server has reg_claim(mark) only)
                if fn == 'reg_check' and st['old'] or fn == 'reg_claim' and 'keep' in body and st['old'] or set(body) - {'mark', 'keep'}:
                    await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}'); return
                s = reg_check(mark, keep)
                if fn == 'reg_check': await route.fulfill(status=200, content_type='application/json', body=json.dumps(s)); return
                if s == 'many': await route.fulfill(status=400, content_type='application/json', body='{"message":"too many"}'); return
                if s == 'taken': await route.fulfill(status=200, content_type='application/json', body='false'); return
                st['claims'][mark] = ME
                if keep is not None:
                    for m in [m for m, q in st['claims'].items() if q == ME and m != mark and m not in keep]: del st['claims'][m]
                await route.fulfill(status=200, content_type='application/json', body='true'); return
            r = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': None, 'shop_pending': st['pending']}.get(fn, '')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.add_init_script(STUB)
        await ctx.route('https://sb.test/**', handle)
        await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, url()); await pg.wait_for_function("typeof SHOP !== 'undefined' && SHOP.ready === true && shopMode() === 'live'", timeout=60000)
        # a second boat in the fleet with a number of its own (claimed by the player before), and numbers no real boat has
        su = await pg.evaluate("""(() => { S.tut = 0; S.boat.status = 'port'; S.cash = 50000; const r0 = Object.assign({}, regOf(S.boat)), free = [];
          for (let n = 500; free.length < 20; n++) if (!regUsed(r0.f, r0.k, n) && n !== r0.n) free.push(n);
          storeVessel(curVessel()); const v2 = JSON.parse(JSON.stringify(curVessel())); v2.id = 'vReg'; v2.boatName = 'Andrebåt'; v2.crew = [];
          v2.boat = Object.assign({}, v2.boat, {reg:{f:r0.f, n:free[0], k:r0.k}}); S.fleet.push(v2); save();
          DOCK.render(); DOCK.open('maler'); return {r0, free, cur:S.cur, fleet:S.fleet.map(v => v.id)}; })()""")
        await pg.wait_for_selector('#drawerBody #pntNum')
        f, k, free = su['r0']['f'], su['r0']['k'], su['free']
        mk = lambda n: '%s-%d-%s' % (f, n, k)
        other = mk(free[0]); st['claims'][other] = ME; st['claims'][mk(free[1])] = 'user_other'
        tap = """async n => { const q = s => document.querySelector('#drawerBody ' + s); window.__toasts = []; q('#pntNum').value = n; q('[data-pa=pntreg]').click();
          const t0 = Date.now(); while (Date.now() - t0 < %d && regOf(S.boat).n !== n) await new Promise(r => setTimeout(r, 100));
          return {n:regOf(S.boat).n, toasts:window.__toasts.slice(), want:(S.cosWant || {}).reg || null}; }"""
        # 1. not yours yet, a number another player has: refused before the payment, nothing goes to Stripe
        n0 = len(calls)
        try: r1 = await pg.evaluate('(' + tap % 2500 + ')(%d)' % free[1])
        except Exception as e:   # (the page went to Stripe: back to the game and the paint shop)
            r1 = {'n': None, 'toasts': [], 'want': None, 'err': str(e)[:80]}
            try: await pg.wait_for_url('**/checkout.stripe.test/**', timeout=20000)
            except Exception: pass
            r1['url'] = pg.url; await pg.goto(url()); await pg.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true", timeout=120000)
            await pg.evaluate("(() => { S.tut = 0; S.boat.status = 'port'; DOCK.render(); DOCK.open('maler'); })()"); await pg.wait_for_selector('#drawerBody #pntNum')
        c1 = calls[n0:]; chk = [b for fn, b in c1 if fn == 'reg_check']
        check(not [1 for fn, _ in c1 if fn == 'checkout'] and chk and chk[0].get('mark') == mk(free[1]) and chk[0].get('keep') == [other]
              and any('er tatt av en annen båt' in t for t in r1['toasts']) and r1['n'] == su['r0']['n'] and not r1['want'],
              'before the payment: a number another player has is refused with words that say so, and nothing goes to Stripe', {'r': r1, 'calls': c1})
        # 2. a free number: asked first, then straight to Stripe for des_reg on this boat
        n0 = len(calls)
        async with pg.expect_navigation(url='**/checkout.stripe.test/**', timeout=45000):
            await pg.evaluate("""n => { const q = s => document.querySelector('#drawerBody ' + s); q('#pntNum').value = n; q('[data-pa=pntreg]').click(); }""", free[2])
        c2 = calls[n0:]; co = [b for fn, b in c2 if fn == 'checkout']
        check([fn for fn, _ in c2 if fn in ('reg_check', 'checkout')] == ['reg_check', 'checkout'] and co[0].get('product') == 'des_reg' and co[0].get('boat') == su['cur'],
              'a free number is asked for first and then goes straight to Stripe for the number on this boat', c2)
        # 3. back from Stripe: the number goes on the boat it was bought on, claimed with the other boat's mark kept
        st['pending'] = [{'id': 31, 'product': 'des_reg', 'data': {'give': 'cos', 'k': 'reg', 'boat': su['cur']}}]
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); await pg.close()
        n0 = len(calls); pg2.set_default_timeout(120000); await pg2.goto(url('kjop=cs_test_1'))
        await pg2.wait_for_function("typeof SHOP !== 'undefined' && SHOP.ready === true && CLOUD.user && (S.shopGiven || []).includes(31) && regOf(S.boat).n === %d" % free[2], timeout=120000)
        cl = [b for fn, b in calls[n0:] if fn == 'reg_claim']
        mine = sorted(m for m, q in st['claims'].items() if q == ME)
        check(cl and cl[-1].get('mark') == mk(free[2]) and cl[-1].get('keep') == [other] and mine == sorted([other, mk(free[2])]),
              'back from Stripe the number goes on the boat, and the claim keeps the other boat\'s number', {'claim': cl, 'mine': mine})
        # 4. eleven numbers in a row on this boat: every one goes on, and only the numbers in use stay claimed
        await pg2.evaluate("(() => { S.tut = 0; S.boat.status = 'port'; DOCK.render(); DOCK.open('maler'); })()")
        await pg2.wait_for_selector('#drawerBody #pntNum')
        seq = []
        for n in free[3:14]: seq.append(await pg2.evaluate('(' + tap % 5000 + ')(%d)' % n))
        mine = sorted(m for m, q in st['claims'].items() if q == ME)
        check([x['n'] for x in seq] == free[3:14] and mine == sorted([other, mk(free[13])]) and not any('Fikk ikke' in t for x in seq for t in x['toasts']),
              'eleven numbers in a row on one boat all go on; only the two in use stay claimed (this boat\'s and the other boat\'s)', {'set': [x['n'] for x in seq], 'want': free[3:14], 'mine': mine, 'toasts': [x['toasts'] for x in seq][-3:]})
        # 5. yours: another player's number is refused, and ten in use at once says so
        r5 = await pg2.evaluate('(' + tap % 2500 + ')(%d)' % free[1])
        st['force'][mk(free[14])] = 'many'
        r6 = await pg2.evaluate('(' + tap % 2500 + ')(%d)' % free[14])
        check(r5['n'] == free[13] and any('er tatt av en annen båt' in t for t in r5['toasts']) and r6['n'] == free[13] and any('ti båter' in t for t in r6['toasts']),
              'with the number yours: another player\'s is refused, and ten numbers in use at once says that is the most', {'taken': r5, 'many': r6})
        # 6. a server without the migration (reg_check is not there, 404): the number is set as before, and a purchase still goes to Stripe
        st['old'] = True; n0 = len(calls)
        r7 = await pg2.evaluate('(' + tap % 5000 + ')(%d)' % free[15])
        c7 = [(fn, b) for fn, b in calls[n0:] if fn in ('reg_check', 'reg_claim')]
        await pg2.evaluate("(() => { S.cos = {}; CLOUD.owned = []; DOCK.render(); DOCK.open('maler'); })()"); await pg2.wait_for_selector('#drawerBody #pntNum')
        n0 = len(calls); went = True
        try:
            async with pg2.expect_navigation(url='**/checkout.stripe.test/**', timeout=30000):
                await pg2.evaluate("""n => { const q = s => document.querySelector('#drawerBody ' + s); q('#pntNum').value = n; q('[data-pa=pntreg]').click(); }""", free[16])
        except Exception: went = False
        check(r7['n'] == free[15] and c7 and c7[-1] == ('reg_claim', {'mark': mk(free[15])}) and went and [fn for fn, _ in calls[n0:] if fn == 'checkout'],
              'a server without the migration: the number is set with reg_claim as before, and buying it still goes to Stripe', {'r': r7, 'calls': c7, 'went': went})
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
