"""One's own number in the registration mark (des_reg, ui/10j-paint.js pntreg and regSet) after the shop's review 07.11.2026, with
stand-ins for WorkOS, Supabase and Stripe as in kjoptest.py. Jonas 07.11.2026: «om du betaler penger for registreringsnummeret så skal du
få ha hva du vil, det er jo egentlig bare kosmetisk» and «to ulike spillere skal kunne ha samme nummer om de ønsker». The stand-in for the
database is the production one as it was: reg_claim(mark) gives a mark to one player, and says «too many» after ten numbers ever
(20261007100000_designs.sql). Checked: a number another player wears goes straight to Stripe and onto the boat when the purchase comes
back, without asking the database; eleven numbers in a row on one boat all go on; the number of another of one's own boats may be used
too; a real boat's number is still refused. Prints OK or FEIL."""
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
        st = {'pending': [], 'claims': {}}

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
            # the database as it was: reg_claim(mark) only, one player's per mark, «too many» after ten numbers ever
            if fn == 'reg_claim' and set(body) == {'mark'}:
                o = st['claims'].get(body['mark'])
                if o: await route.fulfill(status=200, content_type='application/json', body=json.dumps(o == ME)); return
                if sum(1 for q in st['claims'].values() if q == ME) >= 10: await route.fulfill(status=400, content_type='application/json', body='{"message":"too many"}'); return
                st['claims'][body['mark']] = ME; await route.fulfill(status=200, content_type='application/json', body='true'); return
            if fn.startswith('reg_c'): await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}'); return
            r = {'tm_hello': {'consent': True, 'owned': []}, 'save_get': None, 'shop_pending': st['pending']}.get(fn, '')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.add_init_script(STUB)
        await ctx.route('https://sb.test/**', handle)
        await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, url()); await pg.wait_for_function("typeof SHOP !== 'undefined' && SHOP.ready === true && shopMode() === 'live'", timeout=60000)
        # a second boat in the fleet with a number of its own, and numbers no real boat has
        su = await pg.evaluate("""(() => { S.tut = 0; S.boat.status = 'port'; S.cash = 50000; const r0 = Object.assign({}, regOf(S.boat)), free = [];
          for (let n = 500; free.length < 16; n++) if (!regUsed(r0.f, r0.k, n) && n !== r0.n) free.push(n);
          storeVessel(curVessel()); const v2 = JSON.parse(JSON.stringify(curVessel())); v2.id = 'vReg'; v2.boatName = 'Andrebåt'; v2.crew = [];
          v2.boat = Object.assign({}, v2.boat, {reg:{f:r0.f, n:free[0], k:r0.k}}); S.fleet.push(v2); save();
          DOCK.render(); DOCK.open('maler'); return {r0, free, cur:S.cur, real:REGM.k.senja[2][2]}; })()""")
        await pg.wait_for_selector('#drawerBody #pntNum')
        f, k, free = su['r0']['f'], su['r0']['k'], su['free']
        mk = lambda n: '%s-%d-%s' % (f, n, k)
        st['claims'][mk(free[1])] = 'user_other'   # another player wears this one
        tap = """async n => { const q = s => document.querySelector('#drawerBody ' + s); window.__toasts = []; q('#pntNum').value = n; q('[data-pa=pntreg]').click();
          const t0 = Date.now(); while (Date.now() - t0 < %d && regOf(S.boat).n !== n) await new Promise(r => setTimeout(r, 100));
          return {n:regOf(S.boat).n, toasts:window.__toasts.slice()}; }"""
        # 1. not yours yet: another player's number goes straight to Stripe for des_reg on this boat, and the database is not asked
        n0 = len(calls)
        async with pg.expect_navigation(url='**/checkout.stripe.test/**', timeout=45000):
            await pg.evaluate("""n => { const q = s => document.querySelector('#drawerBody ' + s); q('#pntNum').value = n; q('[data-pa=pntreg]').click(); }""", free[1])
        c1 = calls[n0:]; co = [b for fn, b in c1 if fn == 'checkout']
        check(co and co[0].get('product') == 'des_reg' and co[0].get('boat') == su['cur'] and not [fn for fn, _ in c1 if fn.startswith('reg_c')],
              'a number another player wears goes straight to Stripe for the number on this boat, without asking the database', c1)
        # 2. back from Stripe: that number goes on the boat
        st['pending'] = [{'id': 31, 'product': 'des_reg', 'data': {'give': 'cos', 'k': 'reg', 'boat': su['cur']}}]
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); await pg.close()
        n0 = len(calls); pg2.set_default_timeout(120000); await pg2.goto(url('kjop=cs_test_1'))
        try: await pg2.wait_for_function("typeof SHOP !== 'undefined' && SHOP.ready === true && CLOUD.user && (S.shopGiven || []).includes(31)", timeout=120000); await pg2.wait_for_timeout(1500)
        except Exception: pass
        r2 = await pg2.evaluate("({n:typeof S !== 'undefined' ? regOf(S.boat).n : null, toast:(document.getElementById('toast') || {}).textContent || ''})")
        check(r2['n'] == free[1] and not [fn for fn, _ in calls[n0:] if fn.startswith('reg_c')],
              'back from Stripe the number goes on the boat, even though another player wears it', {'r': r2, 'want': free[1]})
        # 3. eleven numbers in a row on this boat: every one goes on
        await pg2.evaluate("(() => { S.tut = 0; S.boat.status = 'port'; DOCK.render(); DOCK.open('maler'); })()")
        await pg2.wait_for_selector('#drawerBody #pntNum')
        n0 = len(calls); seq = []
        for n in free[2:13]: seq.append(await pg2.evaluate('(' + tap % 4000 + ')(%d)' % n))
        check([x['n'] for x in seq] == free[2:13] and not any('Fikk ikke' in t for x in seq for t in x['toasts']) and not [fn for fn, _ in calls[n0:] if fn.startswith('reg_c')],
              'eleven numbers in a row on one boat all go on, with no «Fikk ikke sjekket nummeret»', {'set': [x['n'] for x in seq], 'want': free[2:13], 'toasts': [x['toasts'] for x in seq][-3:]})
        # 4. the number of another of one's own boats may be used too; a real boat's number is still refused
        r4 = await pg2.evaluate('(' + tap % 3000 + ')(%d)' % free[0])
        r5 = await pg2.evaluate('(' + tap % 1500 + ')(%d)' % su['real'])
        check(r4['n'] == free[0] and r5['n'] == free[0] and any('er en ekte båt' in t for t in r5['toasts']),
              "another of one's own boats' number may be used too; a real boat's number is still refused", {'own': r4, 'real': r5})
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
