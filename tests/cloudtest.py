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
    # (without a user: a device signed in before, which meets the gate; a new player starts as a guest, guesttest.py)
    await pg.add_init_script(STUB + ("window.__noUser = 1; localStorage.setItem('dsb_signed', '1');" if no_user else ""))
    async def handle(route):
        req = route.request; fn = req.url.rsplit('/', 1)[-1]
        try: body = json.loads(req.post_data or '{}')
        except Exception: body = {}
        calls.append((fn, body, req.headers.get('authorization', '')))
        r = replies.get(fn, '')
        if callable(r): r = r(body)   # a reply that depends on what was sent
        if r == 404: return await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}')   # a function the database does not have
        await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
    await pg.route('https://sb.test/**', handle)
    return ctx, pg, errs


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # 1. signed in before on this device but not now: the gate, and no game
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
        # the sources and the contact page (ehandelsloven § 8) are there too, and the page fetches no type from Google (it is in the page)
        more = await pg.evaluate("""async () => { const out = {};
          for (const f of ['kilder.html', 'kontakt.html']){ const r = await fetch(f); const t = await r.text(); out[f] = r.status + ' ' + ((t.match(/<h1>([^<]+)/) || [])[1] || '') + (t.includes('<!--@css-->') ? ' nocss' : ''); }
          out.google = [...document.querySelectorAll('link[href]')].some(l => /fonts\\.(googleapis|gstatic)/.test(l.href));
          out.fonts = ['Archivo', 'Source Serif 4'].map(f => document.fonts.check('16px "' + f + '"')); return out; }""")
        check(more.get('kilder.html') == '200 Kilder' and more.get('kontakt.html') == '200 Kontakt' and not more['google'] and all(more['fonts']), 'the sources and the contact page are there, and the type is in the page, not fetched from Google', more)
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
        check(first == ['tm_hello', 'save_get'] and all(c[2] == 'Bearer tok_test' for c in calls if c[0] != 'tm_perf' and not c[0].startswith('push-send') and not (c[0].startswith('shop-checkout') and not c[1])), 'signed in, the game starts after hello and the save check, with the WorkOS token', first)
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
        # the shared world V3: my boat goes up, the other players' boats near by come down and show on the AIS (05.10.2026)
        pos = await pg.evaluate("({x:S.boat.pos.x, y:S.boat.pos.y})")
        replies['pos_put'] = 'null'
        replies['pos_world'] = [{'id': 'abc1234567', 'boat': 'Fjordbris', 'vtype': 'skiff', 'x': pos['x'] + 0.5, 'y': pos['y'] + 0.5, 'hd': 1.2, 'v': 5, 'st': 'sailing', 'age': 1, 'user': 'Kystjenta', 'fs': 40000}]
        n0 = len(calls)
        w = await pg.evaluate("""async () => { S.boatName = S.boatName || 'Havbris'; await worldTick(); const n = npcStates(S.t / 60).find(q => q.player);
          return {n:n && {name:n.name, type:n.type, L:n.L, st:n.st, d:Math.hypot(n.p.x - S.boat.pos.x, n.p.y - S.boat.pos.y)}, card:n ? aisInfo(n) : ''}; }""")
        wp = [c[1] for c in calls[n0:] if c[0] == 'pos_put']; wn = [c[1] for c in calls[n0:] if c[0] == 'pos_world']
        check(wp and wp[0]['boat'] and wp[0]['vtype'] and abs(wp[0]['x'] - pos['x']) < 0.01 and isinstance(wp[0].get('fs'), int) and wn and w['n'] and w['n']['name'] == 'Fjordbris' and w['n']['L'] > 5
              and 'Spiller' in w['card'] and 'Fjordbris' in w['card'] and 'Eier' in w['card'] and 'Kystjenta' in w['card'] and '12 år og' in w['card'],
              "the shared world: my boat's place, name, type and sea time go up, and another player's boat near by shows among the boats, with an AIS card that names the owner and the sea time", {'put': wp[0] if wp else None, 'peer': w['n']})
        # the paint goes along (20261007090000_livery.sql), and the other player's paint comes down to her model; a server without it yet
        # (404 for a call with liv) gets the place without the paint, and the shared world stays on
        replies['pos_world'][0]['liv'] = 'h:gul'; n0 = len(calls)
        lv = await pg.evaluate("async () => { S.boat.liv = {hull:'kobolt'}; WORLDP.last = 0; await worldTick(); const n = npcStates(S.t / 60).find(q => q.player); return {liv:n && n.liv, parsed:n && livParse(n.liv)}; }")
        wl = [c[1].get('liv') for c in calls[n0:] if c[0] == 'pos_put']
        # a server without the sea time yet (404 for a call with fs) gets the place and the paint without it; one without the paint
        # either gets the place alone, and the shared world stays on
        replies['pos_put'] = lambda b: 404 if 'fs' in b else 'null'; n0 = len(calls)
        nofs = await pg.evaluate("async () => { await worldTick(); return {noFs:!!WORLDP.noFs, noLiv:!!WORLDP.noLiv}; }")
        wf = [('fs' in c[1], 'liv' in c[1]) for c in calls[n0:] if c[0] == 'pos_put']
        replies['pos_put'] = lambda b: 404 if 'liv' in b or 'fs' in b else 'null'; n0 = len(calls)
        old = await pg.evaluate("async () => { await worldTick(); return {off:!!WORLDP.off, noLiv:!!WORLDP.noLiv, peers:PEERS.length}; }")
        wo2 = [('liv' in c[1]) for c in calls[n0:] if c[0] == 'pos_put']
        check(len(wl) == 1 and wl[0].startswith('h:kobolt;m:') and lv['liv'] == 'h:gul' and lv['parsed'] and abs(lv['parsed']['hull'][0] - 0.95) < 1e-6 and wf == [(True, True), (False, True)] and nofs['noFs'] and not nofs['noLiv']
              and wo2 == [True, False] and not old['off'] and old['noLiv'] and old['peers'] == 1,
              "the boat's paint goes up with her place and another player's paint comes down to her model; a server without sea time or paint yet gets the place without them, and the shared world stays on", {'up': wl, 'peer': lv, 'nofs': wf, 'old': old, 'calls': wo2})
        replies['pos_put'] = 'null'; S_reset = await pg.evaluate("(() => { delete S.boat.liv; WORLDP.noLiv = false; WORLDP.noFs = false; return 1; })()")
        n0 = len(calls)
        hide = await pg.evaluate("async () => { S.settings.showMe = false; PHONE.open('innst'); const card = document.getElementById('phView').innerText; PHONE.show(false); await worldTick(); return {card:card.includes('Vis båten min'), hasOff:typeof worldShowMe !== 'undefined'}; }")
        wo = [c[0] for c in calls[n0:]]
        check(not hide['card'] and not hide['hasOff'] and 'pos_put' in wo and 'pos_off' not in wo and 'pos_world' in wo,
              'there is no hiding the boat: Settings has no such choice, and the place goes up even with the old setting off', {'hide': hide, 'calls': wo})
        # a database without pos_world yet (404) gives the boats near by through pos_near, and the shared world stays on (08.10.2026)
        replies['pos_near'] = list(replies['pos_world']); replies['pos_world'] = lambda b: 404; n0 = len(calls)
        old2 = await pg.evaluate("async () => { WORLDP.last = 0; await worldTick(); return {noAll:!!WORLDP.noAll, off:!!WORLDP.off, peers:PEERS.length}; }")
        wo3 = [c[0] for c in calls[n0:] if c[0] in ('pos_world', 'pos_near')]
        check(old2['noAll'] and not old2['off'] and old2['peers'] == 1 and wo3 == ['pos_world', 'pos_near'], 'a database without pos_world gives the boats near by through pos_near, and the shared world stays on', {'old': old2, 'calls': wo3})
        replies['pos_world'] = replies.pop('pos_near'); replies.pop('pos_near', None)
        await pg.evaluate("WORLDP.noAll = false")
        # every account has a player name (07.10.2026): the name it took elsewhere comes down; without one it is asked for, with no «later»,
        # until a free one is taken; one the admin took away is gone, with the reason
        replies['name_mine'] = {'name': 'Kystjenta', 'removed': False}
        nmc = await pg.evaluate("async () => { S.user = null; await nameCheck(); return S.user; }")
        replies['name_claim'] = '"taken"'; n0 = len(calls)
        await pg.evaluate("(() => { S.user = null; document.getElementById('modal').hidden = true; nameAsk(); })()")
        # the card waits for other dialogs (the error report from «cloudtest boom» above): they are closed here as a player would
        await pg.wait_for_function("(() => { const m = document.getElementById('modal'); if (!document.getElementById('nmUser') && !m.hidden) m.hidden = true; return !!document.getElementById('nmUser'); })()", polling=300, timeout=15000)
        ask = await pg.evaluate("""async () => { const m = document.getElementById('modal'), t = m.innerText, closers = m.querySelectorAll('[data-close]').length, w = ms => new Promise(r => setTimeout(r, ms));
          document.getElementById('nmUser').value = 'a b'; document.getElementById('nmUserGo').click(); await w(200); const bad = document.getElementById('nmUserNote').textContent, open1 = !m.hidden;
          document.getElementById('nmUser').value = 'Havørn_1'; document.getElementById('nmUserGo').click(); await w(400); const taken = document.getElementById('nmUserNote').textContent, open2 = !m.hidden;
          return {t, closers, bad, open1, taken, open2}; }""")
        replies['name_claim'] = '"ok"'
        ok2 = await pg.evaluate("async () => { document.getElementById('nmUser').value = 'Havørn_2'; document.getElementById('nmUserGo').click(); await new Promise(r => setTimeout(r, 400)); return {user:S.user, closed:document.getElementById('modal').hidden, asking:!!NAME_ASK}; }")
        nc = [c[1] for c in calls[n0:] if c[0] == 'name_claim']
        replies['name_mine'] = {'name': 'Havørn_2', 'removed': True, 'reason': 'Upassende'}
        rm = await pg.evaluate("async () => { await nameCheck(); return {user:S.user, msg:S.msgs.some(q => /tatt bort: Upassende/.test(q.no))}; }")
        check(nmc == 'Kystjenta' and 'Velg et brukernavn' in ask['t'] and ask['closers'] == 0 and 'Senere' not in ask['t'] and ask['open1'] and 'mellomrom' in ask['bad'] and ask['open2'] and 'tatt' in ask['taken']
              and nc == [{'name': 'Havørn_1'}, {'name': 'Havørn_2'}] and ok2 == {'user': 'Havørn_2', 'closed': True, 'asking': False} and rm == {'user': None, 'msg': True},
              'every account has a player name: one taken on another device comes down; without one the card has no way round it, refuses a bad or taken name and closes on a free one; one the admin took away is gone with the reason', {'mine': nmc, 'ask': ask, 'ok': ok2, 'claim': nc, 'removed': rm})
        # the shared world V2: my sale and the fish my boat took go up; the other players' open-group cod, deliveries and catch come down
        k = await pg.evaluate("stockIdx(S.boat.pos)")
        replies['land_put'] = 'null'; replies['catch_put'] = 'null'; n0 = len(calls)
        w2 = await pg.evaluate("""async () => { const pt = plantsNear(S.boat.pos, 1)[0].pt, H = S.t / 60, k = stockIdx(S.boat.pos), y = yearH(H);
          S.wcur = 0; S.wq = {c:{}, l:[]}; S.boatName = 'Havbris'; const rec = WSH.rec; takeStock(S.boat.pos, 100); const pend = Object.keys(S.wq.c).length;
          wshLand(pt.id, H, 'open', {torsk:120, hyse:30}, 110); takeStock(S.boat.pos, 100, null, true); const pend2 = Object.keys(S.wq.c).length;
          const before = {st:stkGet(S.stock, k), sat:wshSat(pt.id, 'torsk', H), pr:price(pt, 'torsk', H)};
          window.__cell = k; return {rec, pend, pend2, before, pid:pt.id, y}; }""")
        replies['world_get'] = {'open': 25000, 'boats': 3, 'mkt': [[w2['pid'], 'torsk', 30000]], 'cells': [[k, 1300]], 'cur': 42}
        w3 = await pg.evaluate("""async () => { await worldShare(); const pt = plantsNear(S.boat.pos, 1)[0].pt, H = S.t / 60;
          PHONE.open('kvote'); document.querySelector('#phone [data-pa=sub][data-s=open]').click(); const txt = document.getElementById('phone').innerText; PHONE.show(false);
          return {st:stkGet(S.stock, window.__cell), sat:wshSat(pt.id, 'torsk', H), pr:price(pt, 'torsk', H), open:wshOpen(yearH(H)), cur:S.wcur, q:S.wq, txt:txt.includes('Andre spillere har landet') && txt.includes('3 båter')}; }""")
        lp = [c[1] for c in calls[n0:] if c[0] == 'land_put']; cp = [c[1] for c in calls[n0:] if c[0] == 'catch_put']; wg = [c[1] for c in calls[n0:] if c[0] == 'world_get']
        it = {i['sp']: i for i in (lp[0]['items'] if lp else [])}
        check(w2['rec'] and w2['pend'] >= 1 and w2['pend2'] == w2['pend'] and lp and lp[0]['port'] == w2['pid'] and lp[0]['acc'] == 'open' and it.get('torsk', {}).get('kgq') == 110 and it.get('hyse', {}).get('kgq') == 0
              and cp and abs(sum(c[1] for c in cp[0]['cells']) - 100) < 0.5 and wg and wg[0]['since'] == 0 and w3['q'] == {'c': {}, 'l': []},
              "the shared world V2: a sale (kilos a species, the cod on the open group's quota) and the fish my boat took (by cell; not the local fleet's) go up, and the queue empties",
              {'land': lp[0] if lp else None, 'cells': cp[0]['cells'] if cp else None, 'get': wg[0] if wg else None})
        check(abs(w3['open'] - 25) < 1e-6 and w3['txt'] and abs(w3['sat'] - 30000) < 300 and w3['pr'] <= w2['before']['pr'] and abs((w2['before']['st'] - w3['st']) - 0.5) < 0.02 and w3['cur'] == 42,
              "the shared world V2: the other players' open-group cod counts in the group's catch (shown in Kvote), their deliveries fill the plant and its price, and the fish they took is gone from my sea",
              {'before': w2['before'], 'after': {k2: w3[k2] for k2 in ('st', 'sat', 'pr', 'open', 'cur')}})
        # the open group's leaderboard: the players under their boats' names, and a name that tries to make markup is not markup
        replies['world_top'] = {'rows': [{'rank': 1, 'boat': '<b onclick=x>Snøgg</b>', 'port': 'botnhamn', 'kg': 900, 'me': False}, {'rank': 2, 'boat': 'Havbris', 'port': 'finnsnes', 'kg': 120, 'me': True}], 'mine': {'rank': 2, 'kg': 120}, 'n': 2}
        t = await pg.evaluate("""async () => { S.boatName = 'Havbris'; PHONE.open('salg'); document.querySelector('#phone [data-pa=sub][data-s=top]').click();
          for (let i = 0; i < 40 && !document.querySelector('#phone .ph-tbl td'); i++) await new Promise(r => setTimeout(r, 100));
          await new Promise(r => setTimeout(r, 200)); const tb = document.querySelector('#phone .ph-tbl'), rows = tb ? [...tb.querySelectorAll('tr')].slice(1).map(r => r.innerText.replace(/\\s+/g, ' ').trim()) : [];
          const out = {rows, img:tb ? tb.querySelectorAll('td b, td img').length : -1, xss:!!window.__xss, me:tb && tb.querySelector('tr.me') ? tb.querySelector('tr.me').innerText : null, head:document.querySelector('#phone .ph-card h4') && document.querySelector('#phone .ph-card h4').textContent};
          PHONE.show(false); return out; }""")
        replies['world_top'] = {'grp': 'lukket', 'rows': [{'rank': 1, 'boat': 'Nordkapp', 'company': 'Nordkapp Havfiske AS', 'port': 'botnhamn', 'kg': 24000, 'me': False}], 'mine': None, 'n': 1}
        tl = await pg.evaluate("""async () => { PHONE.open('salg'); document.querySelector('#phone [data-pa=sub][data-s=top]').click(); document.querySelector('#phone [data-pa=salgG][data-s=lukket]').click();
          for (let i = 0; i < 40 && !(document.querySelector('#phone .ph-tbl td') && document.querySelector('#phone .ph-card h4').textContent.includes('lukket')); i++) await new Promise(r => setTimeout(r, 100));
          const tb = document.querySelector('#phone .ph-tbl'), out = {head:document.querySelector('#phone .ph-card h4').textContent, row:tb ? tb.querySelectorAll('tr')[1].innerText.replace(/\\s+/g, ' ') : null}; PHONE.show(false); return out; }""")
        wt = [c[1] for c in calls if c[0] == 'world_top']
        check(tl['head'].endswith('lukket gruppe') and tl['row'] and 'Nordkapp' in tl['row'] and 'Nordkapp Havfiske AS' in tl['row'] and any(a.get('grp') == 'lukket' for a in wt),
              "the closed group's leaderboard: the vessel and the company of each player along the coast", tl)
        check(t['head'] == "Norges beste båter · åpen gruppe" and len(t['rows']) == 2 and 'Snøgg' in t['rows'][0] and 'Botnhamn' in t['rows'][0] and t['img'] == 0 and not t['xss'] and t['me'] and 'Havbris' in t['me'] and '(deg)' in t['me']
              and wt and isinstance(wt[0].get('w'), int) and wt[0].get('grp') == 'open' and lp and lp[0].get('boat') == 'Havbris' and lp[0].get('company') == '',
              "the open group's leaderboard: the players under their boats' names and plants, yourself marked, a name with markup only text; each sale carries the boat's name",
              {'t': t, 'ask': wt[:1], 'boat': lp[0].get('boat') if lp else None})
        n0 = len(calls); await pg.evaluate("worldShare()"); await pg.wait_for_timeout(500)
        wg = [c[1] for c in calls[n0:] if c[0] == 'world_get']
        check(wg and wg[0]['since'] == 42 and not [c for c in calls[n0:] if c[0] in ('land_put', 'catch_put')], 'the shared world V2: the next ask goes on from the cursor, and nothing already sent goes again', wg)
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
