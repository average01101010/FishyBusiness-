"""The shop (05.10.2026, ui/10i-shop.js; supabase/functions/shop-checkout, stripe-webhook; migration 20261006040000_shop.sql) with
stand-ins for WorkOS, Supabase and Stripe: before Stripe is set up a signed-in player sees «Snart i salg» and gets nothing free; when
it is, the buy buttons show the price and the small consent line, and a tap asks shop-checkout for a page for the right product and
boat and goes there with no dialog in between; back from Stripe with ?kjop=… the game gives what the server granted (haill, trim on the
boat, the yard done), tells the server, and never gives the same grant twice; a cancelled payment says so. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'spiller@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
BASE = GAME.split('#')[0]
url = lambda q='': BASE + (('&' if '?' in BASE else '?') + q if q else '') + '#notut'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []; calls = []; st = {'ready': False, 'pending': []}
        await ctx.add_init_script(STUB)
        async def handle(route):
            req = route.request; u = req.url
            if '/functions/v1/shop-checkout' in u:
                if req.method == 'GET': await route.fulfill(status=200, content_type='application/json', body=json.dumps({'ready': st['ready']})); return
                body = json.loads(req.post_data or '{}'); calls.append(('checkout', body, req.headers.get('authorization')))
                await route.fulfill(status=200, content_type='application/json', body=json.dumps({'url': 'https://checkout.stripe.test/c/pay/cs_test_1'})); return
            fn = u.rsplit('/', 1)[-1]
            try: body = json.loads(req.post_data or '{}')
            except Exception: body = {}
            calls.append((fn, body, None))
            r = {'tm_hello': {'consent': False, 'owned': []}, 'save_get': None, 'shop_pending': st['pending']}.get(fn, '')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.route('https://sb.test/**', handle)
        await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        # 1. not set up yet: «Snart i salg», and a tap gives nothing
        await boot(pg, url()); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("""(async () => { S.tut = 0; const n0 = (S.haillInv || {}).haill || 0; PHONE.open('haill'); await new Promise(r => setTimeout(r, 300));
          const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]'), lab = b && b.textContent; b.click(); await new Promise(r => setTimeout(r, 300));
          const n1 = (S.haillInv || {}).haill || 0; PHONE.show(false); return {mode:shopMode(), lab, given:n1 - n0, fine:!!document.querySelector('#phone .shop-fine')}; })()""")
        check(r['mode'] == 'off' and r['lab'] == 'Snart i salg' and r['given'] == 0 and not r['fine'], 'before Stripe is set up a signed-in player sees «Snart i salg» and gets nothing free', r)
        # 2. set up: the price on the button, the consent line, and a tap goes straight to Stripe with the right product and boat
        st['ready'] = True
        await pg.evaluate("shopStart()"); await pg.wait_for_function("SHOP.ready === true", timeout=20000)
        r = await pg.evaluate("""(async () => { PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]');
          const f = document.querySelector('#phone .shop-fine'), cs = f && getComputedStyle(f); return {mode:shopMode(), lab:b.textContent, fine:f && f.textContent, size:cs && parseFloat(cs.fontSize), op:cs && +cs.opacity, cur:S.cur}; })()""")
        check(r['mode'] == 'live' and r['lab'] == 'Kjøp · 💎 29 kr' and r['fine'] and 'angreretten' in r['fine'] and r['size'] <= 11 and r['op'] < 0.8, 'set up: the button shows the price, with a small quiet line on the right of withdrawal under it', r)
        cur = r['cur']
        async with pg.expect_navigation(url='**/checkout.stripe.test/**', timeout=15000):
            await pg.evaluate("document.querySelector('#phone [data-pa=haillbuy][data-k=haill]').click()")
        co = [c for c in calls if c[0] == 'checkout']
        check(co and co[-1][1].get('product') == 'haill' and co[-1][1].get('boat') == cur and co[-1][2] == 'Bearer tok_test' and 'checkout.stripe.test' in pg.url, 'a tap asks shop-checkout for the haill with the player\'s token and boat, and goes straight to Stripe', {'call': co[-1][1] if co else None, 'url': pg.url})
        # 3. back from Stripe: the grants are given, the server told, nothing twice
        st['pending'] = [{'id': 7, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}},
                         {'id': 8, 'product': 'trim_turbo', 'data': {'give': 'trim', 'k': 'turbo', 'boat': cur}},
                         {'id': 9, 'product': 'verft_na', 'data': {'give': 'yard', 'boat': cur}}]
        pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg.close()
        n0 = len(calls)
        # a saved game: no first screen, the game goes straight on (boot() waits for the new game's «Start»)
        pg2.set_default_timeout(120000); await pg2.goto(url('kjop=cs_test_1'))
        await pg2.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true && (S.shopGiven || []).length >= 3", timeout=120000); await pg2.wait_for_timeout(800)
        r = await pg2.evaluate("""({inv:(S.haillInv || {}).haill || 0, trim:S.boat.trim && S.boat.trim.k, vmax:BOAT.vmax, spec:VESSELS[S.boat.type].vmax, diesel:canBoost(VESSELS[S.boat.type]),
          given:S.shopGiven, qs:location.search, toast:(document.getElementById('toast') || {}).textContent || ''})""")
        done = [c[1].get('ids') for c in calls[n0:] if c[0] == 'shop_done']
        check(r['inv'] >= 1 and (not r['diesel'] or (r['trim'] == 'turbo' and abs(r['vmax'] - r['spec'] * 2) < 0.05)) and r['given'] == [7, 8, 9] and done and done[0] == [7, 8, 9] and 'kjop' not in r['qs'],
              'back from Stripe the game gives the haill and the trim on the boat, tells the server, and clears ?kjop from the address', {'r': r, 'done': done})
        inv1 = r['inv']
        await pg2.evaluate("shopClaim()"); await pg2.wait_for_timeout(600)
        r2 = await pg2.evaluate("({inv:(S.haillInv || {}).haill || 0})")
        check(r2['inv'] == inv1, 'the same grants asked for again are not given twice', {'before': inv1, 'after': r2['inv']})
        # 3b. the thank-you for feedback (20261006140000_feedback_reward.sql): into the store with its own words, 12 hours at +100 % and then gone
        st['pending'] = [{'id': 21, 'product': 'fb_haill', 'data': {'give': 'haill', 'type': 'takk', 'reward': True, 'fid': 5}}]
        r3 = await pg2.evaluate("""(async () => { const n0 = (S.haillInv || {}).takk || 0, m0 = S.msgs.length; await shopClaim();
          const inv = (S.haillInv || {}).takk || 0, m = S.msgs[S.msgs.length - 1], t0 = S.t; useHaill('takk');
          const at = h => { S.t = t0 + h * 60; return haillBoost(); }, b = [at(0.1), at(6), at(11.9), at(12.1)]; S.t = t0 + 60; const st = haillStage(); S.t = t0;
          PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const card = !!document.querySelector('#phone .fb-gift [data-pa=fbOpen]'); PHONE.show(false);
          return {got:inv - n0, msg:m && m.no, newMsg:S.msgs.length - m0, boost:b, stage:st && st.no, card, haill:(S.haillInv || {}).haill || 0}; })()""")
        check(r3['got'] == 1 and 'Takk for tilbakemeldingen' in (r3['msg'] or '') and r3['boost'] == [1, 1, 1, 0] and r3['stage'] == 'Takk-haill' and r3['card'] and r3['haill'] == inv1,
              'a thank-you for feedback goes into the store as takk-haill with its own message (no «Takk for kjøpet»), +100 % all through 12 hours and then gone; the Luck app tells of it', r3)
        # 4. a cancelled payment says so
        st['pending'] = []
        pg3 = await ctx.new_page(); pg3.on('pageerror', lambda e: errs.append(str(e))); await pg2.close()
        pg3.set_default_timeout(120000); await pg3.goto(url('kjop=avbrutt'))
        await pg3.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready !== null", timeout=120000); await pg3.wait_for_timeout(300)
        t = await pg3.evaluate("[...document.querySelectorAll('#toast, .toast')].map(e => e.textContent).join(' | ')")
        check('avbrutt' in t, 'a cancelled payment says the purchase was cancelled and nothing was charged', t[:200])
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
