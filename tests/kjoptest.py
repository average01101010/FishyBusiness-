"""The shop (05.10.2026, ui/10i-shop.js; supabase/functions/shop-checkout, stripe-webhook; migration 20261006040000_shop.sql) with
stand-ins for WorkOS, Supabase and Stripe: before Stripe is set up a signed-in player sees «Snart i salg» and gets nothing free; when
it is, the buy buttons show the price and the small consent line, and a tap asks shop-checkout for a page for the right product and
boat and goes there with no dialog in between; back from Stripe with ?kjop=… the game gives what the server granted (haill, trim on the
boat, the yard done), tells the server, and never gives the same grant twice; a cancelled payment says so.
The stand-in for Supabase keeps the grants as the server does after HS2 (10.11.2026, supabase/migrations/20261110180000_haill_use.sql):
shop_pending answers the open ones and the haill that is delivered and not used (held), shop_done and haill_use change them, and a
refund takes one away. So the haill from the server is checked as a copy of what the server holds: in store after the purchase, back
in a new game on the same account, used once on the server when it is switched on (also with no network, told when it is back), gone
after a refund, the confirmation shown once; and against a server from before the migration (haill_use answers 404) the game is as
it was.
After HS3 (11.11.2026, supabase/migrations/20261111120000_shop_back.sql) the stand-in also answers the trim, Skippertak and yard grants
delivered the last 7 days (held, with done_at), and step 9 checks that a save without them gets them again with only the time that is
left, never twice, nothing when the time has passed, two after each other with the end they had, and nothing from a server from before
that migration (st['hs3'] False). The pictures of the message and the Trim app go to tests/out/ (KJOP_SHOTS=<absolute folder> puts them
elsewhere). Prints OK or FEIL."""
from _env import GAME, OUT, boot
import asyncio, datetime, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'spiller@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
BASE = GAME.split('#')[0]
url = lambda q='': BASE + (('&' if '?' in BASE else '?') + q if q else '') + '#notut,ro0'   # (ro0: the calm off, tests/_env.py)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []; calls = []; st = {'ready': False, 'grants': [], 'hs': True, 'hs3': True, 'offline': False, 'used': []}
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
            # the grants as the server keeps them: done (the game has said shop_done), used (haill_use), gone (refunded). st['hs'] False is
            # a server from before HS2: only the open grants, and no haill_use (404); st['offline'] drops haill_use on the way
            # (HS3: the trim, Skippertak and yard grants delivered the last 7 days come too, and a delivered grant has done_at; st['hs3']
            # False is a server from before that migration)
            G = st['grants']; isH = lambda g: g['data'].get('give') == 'haill'; now = datetime.datetime.now(datetime.timezone.utc)
            week = lambda g: g['data'].get('give') in ('trim', 'skip', 'yard') and g.get('done_at') and (now - datetime.datetime.fromisoformat(g['done_at'])).total_seconds() < 7 * 86400
            if fn == 'shop_pending':
                r = [dict({'id': g['id'], 'product': g['product'], 'data': g['data']}, **(dict({'held': True}, **({'done_at': g.get('done_at')} if st['hs3'] else {})) if g.get('done') else {})) for g in G
                     if not g.get('gone') and (not g.get('done') or (st['hs'] and isH(g) and not g.get('used')) or (st['hs3'] and week(g)))]
                await route.fulfill(status=200, content_type='application/json', body=json.dumps(r)); return
            if fn == 'shop_done':
                for g in G:
                    if g['id'] in (body.get('ids') or []) and not g.get('done'): g['done'] = True; g['done_at'] = now.isoformat()
            if fn == 'haill_use':
                if not st['hs']: await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}'); return
                if st['offline']: await route.abort(); return
                g = next((g for g in G if g['id'] == body.get('id') and isH(g) and not g.get('used') and not g.get('gone')), None)
                if g: g['used'] = g['done'] = True
                st['used'].append((body.get('id'), bool(g)))
                await route.fulfill(status=200, content_type='application/json', body=json.dumps(bool(g))); return
            r = {'tm_hello': dict({'consent': False, 'owned': []}, **st.get('hello', {})), 'save_get': None}.get(fn, '')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.route('https://sb.test/**', handle)
        await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
        # what the Luck app shows: the game's own and the server's together (against the game from before HS2, the game's own: so the checks can be seen red)
        STOCK = "(typeof haillStock === 'function' ? haillStock(S.haillInv, S.haillSrv, S.haillUsed) : Object.assign({haill:0, luksus:0, takk:0}, S.haillInv))"
        # KJOP_FRA=6 runs only steps 6 to 8 (one start and one reload, four minutes instead of twelve): the haill of step 3 is then
        # put on the stand-in as step 3 leaves it, delivered and not used (HS2 10.11.2026, to see the last checks red and green)
        ONLY = os.environ.get('KJOP_FRA') == '6'
        if ONLY: st['grants'] = [{'id': 7, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}, 'done': True}]
        if not ONLY:
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            # 1. not set up yet: «Snart i salg», and a tap gives nothing
            await boot(pg, url()); await pg.wait_for_timeout(1500)
            r = await pg.evaluate("""(async () => { S.tut = 0; const n0 = (S.haillInv || {}).haill || 0; PHONE.open('haill'); await new Promise(r => setTimeout(r, 300));
              const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]'), lab = b && b.textContent; b.click(); await new Promise(r => setTimeout(r, 300));
              const n1 = (S.haillInv || {}).haill || 0; PHONE.show(false); return {mode:shopMode(), lab, given:n1 - n0, fine:!!document.querySelector('#phone .shop-fine')}; })()""")
            check(r['mode'] == 'off' and r['lab'] == 'Snart i salg' and r['given'] == 0 and not r['fine'], 'before Stripe is set up a signed-in player sees «Snart i salg» and gets nothing free', r)
            # 2. set up: the price on the button, the consent line, and a tap goes straight to Stripe with the right product and boat
            # the start's own shopStart asked too: its answer (not ready) must be in before the test asks, or it can land after it (Ø2)
            await pg.wait_for_function("SHOP.ready !== null", timeout=60000)
            st['ready'] = True
            await pg.evaluate("shopStart()"); await pg.wait_for_function("SHOP.ready === true", timeout=20000)
            r = await pg.evaluate("""(async () => { PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]');
              const f = document.querySelector('#phone .shop-fine'), cs = f && getComputedStyle(f); return {mode:shopMode(), lab:b.textContent, fine:f && f.textContent, size:cs && parseFloat(cs.fontSize), op:cs && +cs.opacity, cur:S.cur}; })()""")
            check(r['mode'] == 'live' and r['lab'] == 'Kjøp · 💎 29 kr' and r['fine'] and 'angreretten' in r['fine'] and r['size'] <= 11 and r['op'] < 0.8, 'set up: the button shows the price, with a small quiet line on the right of withdrawal under it', r)
            cur = r['cur']
            async with pg.expect_navigation(url='**/checkout.stripe.test/**', timeout=45000):
                await pg.evaluate("document.querySelector('#phone [data-pa=haillbuy][data-k=haill]').click()")
            co = [c for c in calls if c[0] == 'checkout']
            check(co and co[-1][1].get('product') == 'haill' and co[-1][1].get('boat') == cur and co[-1][2] == 'Bearer tok_test' and 'checkout.stripe.test' in pg.url, 'a tap asks shop-checkout for the haill with the player\'s token and boat, and goes straight to Stripe', {'call': co[-1][1] if co else None, 'url': pg.url})
            # 3. back from Stripe: the grants are given, the server told, nothing twice
            st['grants'] = [{'id': 7, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}},
                             {'id': 8, 'product': 'trim_turbo', 'data': {'give': 'trim', 'k': 'turbo', 'boat': cur}},
                             {'id': 9, 'product': 'verft_na', 'data': {'give': 'yard', 'boat': cur}}]
            pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e)))
            await pg.close()
            n0 = len(calls)
            # a saved game: no first screen, the game goes straight on (boot() waits for the new game's «Start»)
            pg2.set_default_timeout(120000); await pg2.goto(url('kjop=cs_test_1'))
            await pg2.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true && (S.shopGiven || []).length >= 3", timeout=120000); await pg2.wait_for_timeout(800)
            r = await pg2.evaluate("""({inv:""" + STOCK + """.haill, own:(S.haillInv || {}).haill || 0, srv:(S.haillSrv || []).map(x => x.id), trim:S.boat.trim && S.boat.trim.k, vmax:BOAT.vmax, spec:VESSELS[S.boat.type].vmax, diesel:canBoost(VESSELS[S.boat.type]),
              given:S.shopGiven, qs:location.search, toast:(document.getElementById('toast') || {}).textContent || ''})""")
            done = [c[1].get('ids') for c in calls[n0:] if c[0] == 'shop_done']
            check(r['inv'] == 1 and (not r['diesel'] or (r['trim'] == 'turbo' and abs(r['vmax'] - r['spec'] * 2) < 0.05)) and r['given'] == [7, 8, 9] and done and done[0] == [7, 8, 9] and 'kjop' not in r['qs'],
                  'back from Stripe the game gives the haill and the trim on the boat, tells the server, and clears ?kjop from the address', {'r': r, 'done': done})
            inv1 = r['inv']
            # (HS2) the bought haill is the server's: in the copy with its id, not in the game's own numbers, and the Luck app shows it
            try: await pg2.wait_for_selector('.shoprc', timeout=15000)
            except Exception: pass
            app = await pg2.evaluate("""(async () => { const rc = [...document.querySelectorAll('.shoprc .shoprc-it b')].map(b => b.textContent); document.getElementById('modal').hidden = true;
              PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#phone [data-pa=haillon][data-k=haill]'), kv = b && b.previousElementSibling;
              const o = {rc, row:kv ? kv.textContent : null, btn:!!b}; PHONE.show(false); return o; })()""")
            check(r['srv'] == [7] and r['own'] == 0 and app['btn'] and '× 1' in (app['row'] or ''), 'HS2: a bought haill is in store as the copy of the server\'s grant (S.haillSrv), and the Luck app shows it with «Aktiver»', {'r': {k: r[k] for k in ('inv', 'own', 'srv')}, 'app': app})
            await pg2.evaluate("shopClaim()"); await pg2.wait_for_timeout(600)
            await pg2.evaluate("shopClaim()"); await pg2.wait_for_timeout(2600)
            r2 = await pg2.evaluate("({inv:" + STOCK + ".haill, srv:(S.haillSrv || []).map(x => x.id), thanks:S.msgs.filter(m => /Takk for kjøpet/.test(m.no)).length, rc:!!document.querySelector('#modal:not([hidden]) .shoprc')})")
            check(r2['inv'] == inv1 and r2['srv'] == [7], 'the same grants asked for again are not given twice', {'before': inv1, 'after': r2})
            check('Haill' in app['rc'] and r2['thanks'] == 1 and not r2['rc'], 'HS2: the confirmation of the purchase comes once, when the grant is delivered, and never when the copy is replaced', {'rc': app['rc'], 'after': r2})
            # 3b. the thank-you for feedback (20261006140000_feedback_reward.sql): into the store with its own words, 12 hours at +100 % and then gone
            # (the pictures for Jonas: the Luck app with a haill from the server and a luxury luck of the game's own, standing and lying)
            await pg2.evaluate("S.haillInv.luksus = (S.haillInv.luksus || 0) + 1")
            for nm_, w, h in (('staaende', 800, 1280), ('liggende', 1280, 800)):
                await pg2.set_viewport_size({'width': w, 'height': h}); await pg2.evaluate("PHONE.show(true); PHONE.open('haill'); PHONE.render()"); await pg2.wait_for_timeout(500)
                await pg2.screenshot(path=os.path.join(OUT, 'kjop-haill-%s.png' % nm_))
            await pg2.evaluate("S.haillInv.luksus--; PHONE.show(false)"); await pg2.set_viewport_size({'width': 1100, 'height': 800})
            st['grants'] += [{'id': 21, 'product': 'fb_haill', 'data': {'give': 'haill', 'type': 'takk', 'reward': True, 'fid': 5}}]
            r3 = await pg2.evaluate("""(async () => { const n0 = """ + STOCK + """.takk, m0 = S.msgs.length; await shopClaim();
              const inv = """ + STOCK + """.takk, m = S.msgs[S.msgs.length - 1], t0 = S.t; useHaill('takk');
              const at = h => { S.t = t0 + h * 60; return haillBoost(); }, b = [at(0.1), at(6), at(11.9), at(12.1)]; S.t = t0 + 60; const st = haillStage(); S.t = t0;
              PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const card = !!document.querySelector('#phone .fb-gift [data-pa=fbOpen]'); PHONE.show(false);
              return {got:inv - n0, msg:m && m.no, newMsg:S.msgs.length - m0, boost:b, stage:st && st.no, card, haill:""" + STOCK + """.haill}; })()""")
            check(r3['got'] == 1 and 'Takk for tilbakemeldingen' in (r3['msg'] or '') and r3['boost'] == [1, 1, 1, 0] and r3['stage'] == 'Takk-haill' and r3['card'] and r3['haill'] == inv1,
                  'a thank-you for feedback goes into the store as takk-haill with its own message (no «Takk for kjøpet»), +100 % all through 12 hours and then gone; the Luck app tells of it', r3)
            # (HS2) switching it on told the server once, and it is used there
            await pg2.wait_for_function("!(S.haillQ || []).length", timeout=90000); await pg2.wait_for_timeout(400)
            u21 = [u for u in st['used'] if u[0] == 21]; g21 = next(g for g in st['grants'] if g['id'] == 21)
            check(u21 == [(21, True)] and g21.get('used'), 'HS2: switching on a haill from the server calls haill_use once, and it is used on the server', {'calls': st['used'], 'grant': g21})
            # 4. a cancelled payment says so
            pg3 = await ctx.new_page(); pg3.on('pageerror', lambda e: errs.append(str(e))); await pg2.close()
            # every text the toast shows, from the start: the cancelled line comes at shopStart, and a later toast (the start, the weather)
            # took its place before the test looked when the start was slow (Ø2 05.11.2026)
            await pg3.add_init_script("""window.__toasts = []; document.addEventListener('DOMContentLoaded', () => { const el = document.getElementById('toast'); if (el) new MutationObserver(() => window.__toasts.push(el.textContent)).observe(el, {childList:true, characterData:true, subtree:true}); });""")
            pg3.set_default_timeout(120000); await pg3.goto(url('kjop=avbrutt'))
            await pg3.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready !== null", timeout=120000)
            try: await pg3.wait_for_function("window.__toasts.some(t => /avbrutt/.test(t))", timeout=15000)
            except Exception: pass
            t = await pg3.evaluate("window.__toasts.join(' | ')")
            check('avbrutt' in t, 'a cancelled payment says the purchase was cancelled and nothing was charged', t[:200])
            await pg3.close()   # (a game left running beside the next starts made them slower than boot() waits, HS2 10.11.2026: 72 s alone on the session's machine, of 90)
            # 5. on the game's own site with the cloud off (#nocloud, no network; Ø6 funn 5): the shop is closed, nothing is given free
            ctx2 = await br.new_context(viewport={'width': 1100, 'height': 800}); await ctx2.add_init_script(STUB); await ctx2.route('https://sb.test/**', handle)
            pg4 = await ctx2.new_page(); pg4.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg4, BASE + '#notut,nocloud,ro0'); await pg4.wait_for_timeout(800)
            r5 = await pg4.evaluate("""(async () => { S.tut = 0; const n0 = (S.haillInv || {}).haill || 0; PHONE.open('haill'); await new Promise(r => setTimeout(r, 300));
              const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]'), lab = b && b.textContent; if (b) b.click(); await new Promise(r => setTimeout(r, 300));
              const n1 = (S.haillInv || {}).haill || 0; PHONE.show(false); return {on:CLOUD.on, pub:pubHost(), mode:shopMode(), lab, given:n1 - n0}; })()""")
            check(not r5['on'] and r5['pub'] and r5['mode'] == 'off' and r5['lab'] == 'Snart i salg' and r5['given'] == 0,
                  "#nocloud on the game's own site: the shop is closed («Snart i salg») and a tap gives nothing (Ø6 funn 5)", r5)
            await ctx2.close()
        # 6. the shop closed for new accounts (P5, 10.11.2026, 20261110170000_shop_gate.sql): the server's hello says shop:false, and
        # with Stripe set up the button still says «Snart i salg», a tap asks for no payment and gives nothing; without it, the price
        st['ready'] = True; st['hello'] = {'shop': False}; n0 = len([c for c in calls if c[0] == 'checkout'])
        ask = """(async () => { S.tut = 0; const n0 = (S.haillInv || {}).haill || 0; PHONE.open('haill'); await new Promise(r => setTimeout(r, 300));
          const b = document.querySelector('#phone [data-pa=haillbuy][data-k=haill]'), lab = b && b.textContent, fine = !!document.querySelector('#phone .shop-fine'); if (TAP) b.click(); await new Promise(r => setTimeout(r, 600));
          const n1 = (S.haillInv || {}).haill || 0; PHONE.show(false); return {off:CLOUD.shopOff, mode:shopMode(), lab, given:n1 - n0, fine}; })()"""
        ctx3 = await br.new_context(viewport={'width': 1100, 'height': 800}); await ctx3.add_init_script(STUB); await ctx3.route('https://sb.test/**', handle)
        pg6 = await ctx3.new_page(); pg6.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg6, url()); await pg6.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true", timeout=120000)
        r6 = await pg6.evaluate(ask.replace('TAP', 'true')); r6['asked'] = len([c for c in calls if c[0] == 'checkout']) - n0
        st['hello'] = {'shop': True}; await pg6.reload(); await pg6.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true", timeout=120000)
        r6b = await pg6.evaluate(ask.replace('TAP', 'false'))
        check(r6['off'] is True and r6['mode'] == 'off' and r6['lab'] == 'Snart i salg' and r6['given'] == 0 and not r6['fine'] and r6['asked'] == 0 and 'stripe' not in pg6.url
              and r6b['off'] is False and r6b['mode'] == 'live' and '29 kr' in (r6b['lab'] or ''),
              'the shop closed for new accounts: «Snart i salg», no payment asked and nothing given; with shop:true the price is back', {'closed': r6, 'open': r6b})
        # 7. (HS2) this is a new game on the same account (a new device, a save that went on without the purchase): the haill bought in
        # step 3 was delivered and never switched on, so the server still holds it, and it is back in store with no confirmation
        try: await pg6.wait_for_function("(S.haillSrv || []).some(x => x.id === 7)", timeout=30000)
        except Exception: pass
        r7 = await pg6.evaluate("({inv:" + STOCK + ", srv:S.haillSrv, own:S.haillInv, given:S.shopGiven || [], thanks:S.msgs.filter(m => /Takk for kjøpet|Takk for tilbakemeldingen/.test(m.no)).length, rc:!!document.querySelector('.shoprc'), })")
        check(r7['inv'] == {'haill': 1, 'luksus': 0, 'takk': 0} and r7['srv'] == [{'id': 7, 'type': 'haill'}] and r7['thanks'] == 0 and not r7['rc'] and 7 not in r7['given'],
              'HS2: a new game on the same account gets the bought haill again at the next start, with no confirmation', r7)
        # (HS3) and in the whole run the turbo trim and the yard done now of step 3 were delivered to the first game some minutes ago: this
        # new game has them again, the trim with a little under its 72 hours left, the yard as a credit, each with one line and no confirmation
        if not ONLY:
            r7b = await pg6.evaluate("({trim:S.boat.trim && S.boat.trim.k, left:+trimLeft(S.boat).toFixed(2), vx:+(BOAT.vmax / VESSELS[S.boat.type].vmax).toFixed(2), credit:S.yardCredit || 0, back:S.msgs.filter(m => /lagt inn igjen/.test(m.no)).map(m => m.no), given:S.shopGiven || []})")
            check(r7b['trim'] == 'turbo' and 68 < r7b['left'] < 72 and r7b['vx'] == 2 and r7b['credit'] == 1 and len(r7b['back']) == 2 and 8 in r7b['given'] and 9 in r7b['given'] and r7['thanks'] == 0 and not r7['rc'],
                  'HS3: a new game on the same account gets the trim and the yard done now of the first game again at the start: the trim with the time that is left, the yard as a credit, one line each and no confirmation', r7b)
        # switched on in the Luck app: on at once, the server told once, and not back at the next claim
        n0 = len(st['used'])
        r8 = await pg6.evaluate("""(async () => { S.tut = 0; PHONE.open('haill'); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#phone [data-pa=haillon][data-k=haill]'); if (b) b.click();
          await new Promise(r => setTimeout(r, 1500)); await shopClaim(); PHONE.show(false);
          return {btn:!!b, on:S.haill && S.haill.type, how:S.haill && S.haill.how, boost:haillBoost(), inv:""" + STOCK + """.haill, q:S.haillQ, used:S.haillUsed}; })()""")
        check(r8['btn'] and r8['on'] == 'haill' and r8['how'] == 'srv' and r8['boost'] == 1 and r8['inv'] == 0 and r8['q'] == [] and r8['used'] == [7] and st['used'][n0:] == [(7, True)],
              'HS2: «Aktiver» switches the server\'s haill on at once, haill_use is called once, and it does not come back', {'r': r8, 'calls': st['used'][n0:]})
        # with no network (V1 A): on at once, kept on the list for the server, never shown again meanwhile, and told when the network is back
        st['grants'].append({'id': 30, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}, 'done': True}); st['offline'] = True; n0 = len(st['used'])
        r9 = await pg6.evaluate("""(async () => { CLOUD.sid = CLOUD.sid || 'sid_test'; CLOUD.q = []; await shopClaim(); const back = CLOUD.q.filter(e => e.k === 'haill_back').map(e => e.d.id), had = """ + STOCK + """.haill, t0 = S.t; S.haill = null; const ok = useHaill('haill'); await new Promise(r => setTimeout(r, 800));
          await shopClaim(); return {had, back, ok, on:S.haill && S.haill.how, boost:haillBoost(), q:(S.haillQ || []).slice(), inv:""" + STOCK + """.haill, srv:S.haillSrv}; })()""")
        off = st['used'][n0:]; st['offline'] = False
        await pg6.evaluate("window.dispatchEvent(new Event('online'))"); await pg6.wait_for_function("!(S.haillQ || []).length", timeout=90000); await pg6.wait_for_timeout(300)
        check(r9['had'] == 1 and r9['back'] == [30] and r9['ok'] and r9['on'] == 'srv' and r9['boost'] == 1 and r9['q'] == [30] and r9['inv'] == 0 and r9['srv'] == [] and off == [] and st['used'][n0:] == [(30, True)],
              'HS2: a haill the save did not have is counted as haill_back; switched on with no network it is on at once and waits on the list; the server still holding it does not bring it back; told once when the network is back', {'r': r9, 'offline': off, 'after': st['used'][n0:]})
        # a refund before it is used takes it out of the store
        st['grants'].append({'id': 31, 'product': 'luksus', 'data': {'give': 'haill', 'type': 'luksus'}, 'done': True}); n0 = len(st['used'])
        a = await pg6.evaluate("(async () => { await shopClaim(); return " + STOCK + ".luksus; })()")
        st['grants'][-1]['gone'] = True
        b = await pg6.evaluate("(async () => { await shopClaim(); return {inv:" + STOCK + ".luksus, use:useHaill('luksus')}; })()")
        check(a == 1 and b == {'inv': 0, 'use': False} and st['used'][n0:] == [], 'HS2: a refund before the haill is used takes it out of the store, and it cannot be switched on', {'before': a, 'after': b})
        # 8. (HS2) a server from before the migration (shop_pending with only the open grants, haill_use 404): the game as it was, the
        # haill into the game's own numbers, told done, and still there when the server then answers nothing
        st['hs'] = False; st['grants'] = [{'id': 40, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}}]; n0 = len(calls)
        r10 = await pg6.evaluate("""(async () => { SHOP.hs = null; const o0 = (S.haillInv || {}).haill || 0; await shopClaim(); await new Promise(r => setTimeout(r, 300)); await shopClaim();
          return {own:((S.haillInv || {}).haill || 0) - o0, srv:S.haillSrv, inv:""" + STOCK + """.haill, hs:SHOP.hs, old:S.haillOld, use:useHaill('haill'), how:S.haill && S.haill.how, q:S.haillQ}; })()""")
        done = [c[1].get('ids') for c in calls[n0:] if c[0] == 'shop_done']
        check(r10['own'] == 1 and r10['srv'] == [] and r10['inv'] == 1 and r10['hs'] is False and 40 in (r10['old'] or []) and done == [[40]] and r10['use'] and r10['how'] == 'inv' and r10['q'] == [],
              'HS2: against a server from before the migration (haill_use 404) the haill goes into the game\'s own numbers as before, is told done once, and is switched on with no call', {'r': r10, 'done': done})
        st['hs'] = True
        # 9. (HS3) trim, Skippertak and the yard done now, delivered and not in this save (a new game on the same account): given again
        # with only the time that is left. The times are real hours since the delivery; the test's clock is the game's own, so one
        # real hour is GAME_RATE game hours taken from the game's minute now (core backT)
        ago = lambda h: (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=h)).isoformat()
        dn = lambda id_, product, data, h: {'id': id_, 'product': product, 'data': data, 'done': True, 'done_at': ago(h)}
        cur6 = await pg6.evaluate("(() => { delete S.boat.trim; applyVessel(); S.skip = null; S.yardCredit = 0; S.jobs = (S.jobs || []).filter(j => !YARD_KINDS.includes(j.kind)); CLOUD.sid = CLOUD.sid || 'sid_test'; document.getElementById('modal').hidden = true; window.__th0 = S.msgs.filter(m => /Takk for kjøpet/.test(m.no)).length; return S.cur; })()")   # (the confirmation of step 8's haill is closed and not counted)
        SEE = """({trim:S.boat.trim ? {k:S.boat.trim.k, left:+trimLeft(S.boat).toFixed(2), until:Math.round(trimUntil(S.boat))} : null, vx:+(BOAT.vmax / VESSELS[S.boat.type].vmax).toFixed(2), skip:S.skip ? {k:S.skip.k, left:+skipLeft().toFixed(2), until:Math.round(S.skip.until)} : null, en:S.energy, credit:S.yardCredit || 0,
          back:S.msgs.filter(m => /lagt inn igjen/.test(m.no)).map(m => m.no), logs:S.log.filter(l => /lagt inn igjen/.test(l.no)).length, thanks:S.msgs.filter(m => /Takk for kjøpet/.test(m.no)).length - window.__th0, rc:!!document.querySelector('#modal:not([hidden]) .shoprc'),
          given:(S.shopGiven || []).slice(), ev:(CLOUD.q || []).filter(e => e.k === 'shop_back').map(e => e.d)})"""
        claim = "(async () => { CLOUD.q = []; const m0 = S.msgs.length; await shopClaim(); await new Promise(r => setTimeout(r, 300)); const o = " + SEE + "; o.newMsg = S.msgs.length - m0; return o; })()"
        # a turbo trim (72 h) delivered two real hours ago: back on the boat with 60 h left, one line in Meldinger, no confirmation, the server not told again
        st['grants'] = [dn(50, 'trim_turbo', {'give': 'trim', 'k': 'turbo', 'boat': cur6}, 2)]; n0 = len(calls)
        a = await pg6.evaluate(claim); done = [c[1].get('ids') for c in calls[n0:] if c[0] == 'shop_done']
        check(a['trim'] and a['trim']['k'] == 'turbo' and abs(a['trim']['left'] - 60) < 0.4 and a['vx'] == 2 and a['newMsg'] == 1 and 'Økt turbotrykk' in a['back'][-1] and '60 timer igjen' in a['back'][-1] and a['thanks'] == 0 and not a['rc'] and 50 in a['given'] and done == []
              and len(a['ev']) == 1 and a['ev'][0].get('product') == 'trim_turbo' and abs(a['ev'][0].get('h', 0) - 60) < 0.4,
              'HS3: a trim delivered and not in the save (a new game on the same account) is given again on the boat with the time that is left (72 h bought two real hours ago: 60 h), with one line in Meldinger, the event shop_back and no new confirmation', {'r': {k: a[k] for k in ('trim', 'vx', 'back', 'logs', 'thanks', 'rc', 'given', 'ev')}, 'done': done})
        # (the pictures for Jonas: the message and the Trim app after, standing and lying)
        shots = os.environ.get('KJOP_SHOTS') or OUT; os.makedirs(shots, exist_ok=True)
        for nm_, w, h in (('staaende', 800, 1280), ('liggende', 1280, 800)):
            await pg6.set_viewport_size({'width': w, 'height': h})
            for app in ('meld', 'trim'):
                await pg6.evaluate("PHONE.show(true); PHONE.open('%s'); PHONE.render()" % app); await pg6.wait_for_timeout(600)
                await pg6.screenshot(path=os.path.join(shots, 'kjop-hs3-%s-%s.jpg' % (app, nm_)), type='jpeg', quality=60)
        await pg6.evaluate("PHONE.show(false)"); await pg6.set_viewport_size({'width': 1100, 'height': 800})
        # in the save now: never twice, whatever the server answers
        b = await pg6.evaluate(claim); b2 = await pg6.evaluate(claim)
        check(b['trim'] and b['trim']['until'] == a['trim']['until'] and b2['trim']['until'] == a['trim']['until'] and b['newMsg'] == 0 and b2['newMsg'] == 0 and b2['ev'] == [] and len(b2['back']) == len(a['back']),
              'HS3: a trim that is in the save is not given twice: asked again, the end stands and nothing is said', {'first': a['trim'], 'again': b['trim'], 'again2': b2['trim'], 'msgs': len(b2['back'])})
        # one whose time has passed (a pump, 24 h, delivered five real hours ago: 30 game hours) gives nothing, and is not asked about again
        await pg6.evaluate("(() => { delete S.boat.trim; applyVessel(); })()"); st['grants'] = [dn(51, 'trim_pump', {'give': 'trim', 'k': 'pump', 'boat': cur6}, 5)]
        c = await pg6.evaluate(claim)
        check(c['trim'] is None and c['vx'] == 1 and c['newMsg'] == 0 and c['ev'] == [] and 51 in c['given'], 'HS3: a trim whose time has passed is not given again', {k: c[k] for k in ('trim', 'vx', 'newMsg', 'given')})
        # two of the same kind after each other (a pump five real hours ago and one 4.5 hours ago: the first ended six game hours ago,
        # but when it was bought the second was added to it, and ended 24 h later): the same end as when they were bought, 18 h left
        await pg6.evaluate("(() => { delete S.boat.trim; applyVessel(); S.shopGiven = S.shopGiven.filter(x => x !== 51); })()")
        st['grants'] = [dn(53, 'trim_pump', {'give': 'trim', 'k': 'pump', 'boat': cur6}, 4.5), dn(51, 'trim_pump', {'give': 'trim', 'k': 'pump', 'boat': cur6}, 5)]
        d = await pg6.evaluate(claim)
        check(d['trim'] and d['trim']['k'] == 'pump' and abs(d['trim']['left'] - 18) < 0.4 and d['vx'] == 1.5 and d['newMsg'] == 1 and len(d['ev']) == 1,
              'HS3: two trims of the same kind after each other come back with the end they had when they were bought (18 h left), in one line', {'trim': d['trim'], 'vx': d['vx'], 'newMsg': d['newMsg'], 'msg': d['back'][-1:], 'ev': d['ev']})
        # a trim for a boat that is not in the fleet is not given
        await pg6.evaluate("(() => { delete S.boat.trim; applyVessel(); })()"); st['grants'] = [dn(54, 'trim_turbo', {'give': 'trim', 'k': 'turbo', 'boat': 'not_in_fleet'}, 1)]
        e = await pg6.evaluate(claim)
        check(e['trim'] is None and e['newMsg'] == 0 and e['vx'] == 1 and 54 not in e['given'], 'HS3: a trim bought for a boat that is not in the fleet is not given, and not marked as given (it is asked about again)', {k: e[k] for k in ('trim', 'vx', 'newMsg', 'given')})
        # Skippertak (48 h) delivered one real hour ago: 42 h left, rested; again: not twice. One whose time has passed: nothing, and no rest
        await pg6.evaluate("S.energy = 40"); st['grants'] = [dn(55, 'skip', {'give': 'skip', 'k': 'std'}, 1)]
        f = await pg6.evaluate(claim); f2 = await pg6.evaluate(claim)
        await pg6.evaluate("(() => { S.skip = null; S.energy = 40; })()"); st['grants'] = [dn(56, 'skip_light', {'give': 'skip', 'k': 'light'}, 5)]
        f3 = await pg6.evaluate(claim)
        check(f['skip'] and f['skip']['k'] == 'std' and abs(f['skip']['left'] - 42) < 0.4 and f['en'] == 100 and f['newMsg'] == 1 and 'Skippertak' in f['back'][-1] and len(f['ev']) == 1 and f['thanks'] == 0
              and f2['skip']['until'] == f['skip']['until'] and f2['newMsg'] == 0 and f3['skip'] is None and f3['en'] < 100 and f3['newMsg'] == 0 and 56 in f3['given'],
              'HS3: a Skippertak delivered and not in the save is given again with the time that is left (42 h of 48) and the rest, never twice; one whose time has passed gives nothing and no rest', {'given': {k: f[k] for k in ('skip', 'en', 'newMsg', 'thanks', 'ev')}, 'msg': f['back'][-1:], 'again': f2['skip'], 'passed': {k: f3[k] for k in ('skip', 'en', 'newMsg')}})
        # the yard done now, with no yard job running: kept as a credit, once
        st['grants'] = [dn(57, 'verft_na', {'give': 'yard', 'boat': cur6}, 30)]
        g1 = await pg6.evaluate(claim); g2 = await pg6.evaluate(claim)
        check(g1['credit'] == 1 and g1['newMsg'] == 1 and 'Ferdig nå' in g1['back'][-1] and g2['credit'] == 1 and g2['newMsg'] == 0 and g1['thanks'] == 0,
              'HS3: the yard done now delivered and not in the save is kept as a credit for the next yard job, once', {'first': {k: g1[k] for k in ('credit', 'newMsg', 'thanks')}, 'msg': g1['back'][-1:], 'again': g2['credit']})
        # a server from before HS3's migration (the delivered ones are not answered): nothing is given again, as before
        await pg6.evaluate("(() => { delete S.boat.trim; applyVessel(); S.shopGiven = S.shopGiven.filter(x => x !== 50); })()"); st['hs3'] = False; st['grants'] = [dn(50, 'trim_turbo', {'give': 'trim', 'k': 'turbo', 'boat': cur6}, 2)]
        h1 = await pg6.evaluate(claim); st['hs3'] = True
        check(h1['trim'] is None and h1['newMsg'] == 0, 'HS3: against a server from before the migration nothing is given again, as before', {k: h1[k] for k in ('trim', 'vx', 'newMsg')})
        # the ids are kept by age, not the last 200: 300 newer ids do not push out one the server can still list
        st['grants'] = [dn(50, 'trim_turbo', {'give': 'trim', 'k': 'turbo', 'boat': cur6}, 2)]
        i1 = await pg6.evaluate(claim.replace("CLOUD.q = [];", "CLOUD.q = []; for (let i = 0; i < 300; i++) S.shopGiven.push(1000 + i);"))
        i2 = await pg6.evaluate(claim)
        check(i1['trim'] and 50 in i1['given'] and len(i1['given']) > 300 and i2['newMsg'] == 0 and i2['trim']['until'] == i1['trim']['until'],
              'HS3: the ids given are kept by age, not the last 200: with 300 newer ids the trim is still not given twice', {'n': len(i1['given']), 'trim': i1['trim'], 'again': i2['trim'], 'newMsg': i2['newMsg']})
        await ctx3.close()
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
