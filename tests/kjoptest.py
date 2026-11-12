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
elsewhere).
After HS4 (11.11.2026, supabase/migrations/20261111140000_haill_srv.sql) the server is the truth: with st['hs4'] the stand-in also has
shop_state (which delivers the open haill, trim, Skippertak and yard grants itself), haill_on, yard_use, haill_import, pub_spin and
ach_haill, and step 10 (hs4 below; run alone, as tests/fasittest.py or with KJOP_FRA=10) checks, for each thing, that a save that was written in has what the
server says after the next start: the haill in store, the haill aboard, the trim, Skippertak, the credit for the yard done now and a
paint design; that the game's own numbers are brought over once within the server's cap; that a purchase is delivered and confirmed
once; that the pub's wheel is the server's and needs a network; and that a server from before the migration (404) gets the game as
after HS3. Without st['hs4'] those functions answer 404, as a server from before it. Prints OK or FEIL."""
from _env import GAME, OUT, boot
import asyncio, datetime, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


CFG = {'hosts': ['127.0.0.1', 'localhost'], 'supabaseUrl': 'https://sb.test', 'supabaseAnon': 'anon_test', 'workosClientId': 'client_test'}
STUB = """window.DSB_CLOUD = %s;
window.DSB_AUTHKIT = {createClient: async () => ({getUser: () => ({id:'user_test', email:'spiller@test.no'}), getAccessToken: async () => 'tok_test', signIn: () => {}, signUp: () => {}, signOut: () => {}})};""" % json.dumps(CFG)
BASE = GAME.split('#')[0]
# (ro0: the calm off, tests/_env.py. no3d under tests/run.py, KYST_LITE, as _env.py's own address has it: no check here looks at 3D, and
# with every frame drawn under SwiftShader the test took over half an hour, 11.11.2026. Run by hand it draws 3D, for the pictures)
url = lambda q='': BASE + (('&' if '?' in BASE else '?') + q if q else '') + '#notut,ro0' + (',no3d' if os.environ.get('KYST_LITE') == '1' else '')



# 10. (HS4) the server is the truth for haill and everything bought: a new game in its own context, against the stand-in with shop_state
async def hs4(br, handle, st, calls, errs):
    st.update({'ready': True, 'grants': [], 'hs': True, 'hs3': True, 'hs4': True, 'imp': True, 'offline': False, 'owned': [], 'pubhad': False, 'ach': False, 'hop': []}); st['used'].clear(); st['yard'].clear(); st['impcalls'].clear()
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); await ctx.add_init_script(STUB); await ctx.route('https://sb.test/**', handle)
    await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
    pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, url()); await pg.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true", timeout=120000)
    ago = lambda h: (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=h)).isoformat()
    dn = lambda id_, product, data, h: {'id': id_, 'product': product, 'data': data, 'done': True, 'done_at': ago(h)}
    SEE = """({stock:haillStock(S.haillInv, S.haillSrv, S.haillUsed), inv:[(S.haillInv || {}).haill || 0, (S.haillInv || {}).luksus || 0], on:S.haill ? {type:S.haill.type, age:Math.round(S.t - S.haill.t0)} : null, boost:haillBoost(),
      trim:S.boat.trim ? {k:S.boat.trim.k, left:+trimLeft(S.boat).toFixed(2)} : null, vx:+(BOAT.vmax / VESSELS[S.boat.type].vmax).toFixed(2), skip:S.skip ? {k:S.skip.k, left:+skipLeft().toFixed(2)} : null, credit:S.yardCredit || 0,
      cos:Object.keys(S.cos || {}).sort(), fix:(CLOUD.q || []).filter(e => e.k === 'srv_fix').map(e => e.d.what).sort(), thanks:S.msgs.filter(m => /Takk for kjøpet/.test(m.no)).length, rc:!!document.querySelector('#modal:not([hidden]) .shoprc'), hs4:SHOP.hs4})"""
    claim = "(async () => { CLOUD.sid = CLOUD.sid || 'sid_test'; CLOUD.q = []; const n = await shopClaim(); await new Promise(r => setTimeout(r, 300)); const o = " + SEE + "; o.n = n; return o; })()"
    cur = await pg.evaluate("(async () => { S.tut = 0; S.cash = 50000; await shopClaim(); return S.cur; })()")
    # a. the game's own numbers from before are brought over once, within the server's cap (2 haill, 1 luksus; the thank-you and the
    # credit only within what the server itself delivered: here none), and the haill aboard goes with them, as old as it was (120
    # game minutes, and the minutes the claim itself takes on the server's clock)
    # (one of the five haill is the server's own, id 64, given into the numbers by a page from before HS2, S.haillOld, and still unused
    # on the server: it stays there and is not sent, so it is neither counted twice nor lost to the cap. The luksus aboard is the
    # one luksus the cap allows)
    st['imp'] = False; st['grants'].append(dn(64, 'haill', {'give': 'haill', 'type': 'haill'}, 40))
    await pg.evaluate("(() => { S.haillInv = {haill:5, luksus:3, takk:1}; S.haillOld = [64]; S.yardCredit = 4; S.haill = {type:'luksus', t0:S.t - 120, how:'inv'}; })()")
    a = await pg.evaluate(claim); a2 = await pg.evaluate(claim); ic = st['impcalls'][:]
    check(a['hs4'] is True and a['stock'] == {'haill': 3, 'luksus': 0, 'takk': 0} and a['inv'] == [0, 0] and a['credit'] == 0 and a['on'] and a['on']['type'] == 'luksus' and 119 <= a['on']['age'] <= 140 and a['boost'] == 2 and st['used'] == []
          and len(ic) == 1 and {k: ic[0].get(k) for k in ('haill', 'luksus', 'takk', 'yard')} == {'haill': 4, 'luksus': 3, 'takk': 1, 'yard': 4} and (ic[0].get('on') or {}).get('type') == 'luksus' and a2['stock'] == a['stock'] and a2['on']['type'] == 'luksus',
          'HS4: the save\'s own haill and credits are brought over once, within the server\'s cap (4 haill of its own and one the server still keeps, 3 luksus, 1 thank-you, 4 credits: 2 and the server\'s one, the luksus aboard, 0, 0), the haill aboard stays as old as it was, and the numbers in the save are gone', {'a': {k: a[k] for k in ('hs4', 'stock', 'inv', 'credit', 'on', 'boost')}, 'calls': ic, 'again': a2['stock']})
    # b. written into the save, then the next start: the haill in store, the haill aboard, a trim, Skippertak, the credit and a
    # paint design are what the server says, not what the save says
    await pg.evaluate("""(() => { S.haillInv = {haill:50, luksus:9}; S.haillSrv.push({id:999, type:'luksus'}); S.haill = {type:'luksus', t0:S.t, how:'inv'}; S.boat.trim = {k:'turbo', t0:S.t, until:S.t + 72 * 60}; applyVessel();
      S.skip = {k:'max', t0:S.t, until:S.t + 96 * 60}; S.yardCredit = 9; S.cos = {ripe:1, logo:1}; save(); })()""")
    b0 = await pg.evaluate(SEE)
    await pg.reload(); await pg.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true", timeout=120000)
    b = await pg.evaluate(claim)
    check(b0['stock']['haill'] == 53 and b0['stock']['luksus'] == 10 and b0['on']['age'] <= 2 and b0['trim'] and b0['vx'] == 2 and b0['skip'] and b0['credit'] == 9 and b0['cos'] == ['logo', 'ripe'], 'HS4: (the save is written in: 50 haill, 10 luksus, a fresh luksus aboard, a turbo trim, Skippertak Max, 9 credits, two designs)', {k: b0[k] for k in ('stock', 'on', 'trim', 'vx', 'skip', 'credit', 'cos')})
    check(b['stock'] == {'haill': 3, 'luksus': 0, 'takk': 0} and b['inv'] == [0, 0], 'HS4: haill written into the save (the game\'s own numbers and the copy of the server\'s) is gone after the next start: the store is the server\'s', {k: b[k] for k in ('stock', 'inv')})
    check(b['on'] and b['on']['type'] == 'luksus' and b['on']['age'] >= 119, 'HS4: the haill aboard has the server\'s minute after the next start, not the one written into the save', b['on'])
    check(b['trim'] is None and b['vx'] == 1, 'HS4: a trim written into the save is gone after the next start, and the top speed is the boat\'s own', {k: b[k] for k in ('trim', 'vx')})
    check(b['skip'] is None, 'HS4: a Skippertak written into the save is gone after the next start', b['skip'])
    check(b['credit'] == 0, 'HS4: credits for the yard done now written into the save are gone after the next start', b['credit'])
    check(b['cos'] == [], 'HS4: a paint design written into the save is gone after the next start (the account owns none)', b['cos'])
    shots = os.environ.get('KJOP_SHOTS') or OUT; os.makedirs(shots, exist_ok=True)
    async def shoot(name, app=None):
        for nm_, w, h in (('staaende', 800, 1280), ('liggende', 1280, 800)):
            await pg.set_viewport_size({'width': w, 'height': h})
            if app: await pg.evaluate("PHONE.show(true); PHONE.open('%s'); PHONE.render()" % app)
            await pg.wait_for_timeout(600); await pg.screenshot(path=os.path.join(shots, 'kjop-hs4-%s-%s.jpg' % (name, nm_)), type='jpeg', quality=60)
        if app: await pg.evaluate("PHONE.show(false)")
        await pg.set_viewport_size({'width': 1100, 'height': 800})
    await shoot('haill', 'haill'); await shoot('trim', 'trim')
    # c. what the server has, a save without it gets (as HS3, and now also a credit older than a day and a design), and writing the
    # ends further out does not last: the next claim puts the server's back, and the fix is counted
    st['grants'] += [dn(60, 'trim_turbo', {'give': 'trim', 'k': 'turbo', 'boat': cur}, 2), dn(61, 'skip', {'give': 'skip', 'k': 'std'}, 1), dn(62, 'verft_na', {'give': 'yard', 'boat': cur}, 30), dn(63, 'haill', {'give': 'haill', 'type': 'haill'}, 30)]; st['owned'] = ['des_ripe']
    c = await pg.evaluate(claim)
    await pg.evaluate("(() => { S.boat.trim.until += 1000 * 60; applyVessel(); S.skip.until += 5000 * 60; S.yardCredit = 7; S.haillSrv = S.haillSrv.concat([{id:998, type:'luksus'}]); S.cos = {lakk:1}; S.haill = {type:'luksus', t0:S.t, how:'inv'}; })()")
    c2 = await pg.evaluate(claim)
    want = lambda r: r['trim'] and r['trim']['k'] == 'turbo' and abs(r['trim']['left'] - 60) < 0.5 and r['vx'] == 2 and r['skip'] and r['skip']['k'] == 'std' and abs(r['skip']['left'] - 42) < 0.5 and r['credit'] == 1 and r['stock'] == {'haill': 4, 'luksus': 0, 'takk': 0} and r['cos'] == ['ripe'] and r['on']['age'] >= 119
    check(want(c) and c['thanks'] == 0 and not c['rc'], 'HS4: what the server has delivered comes to a save without it: the trim and Skippertak with the time that is left (60 h, 42 h), the credit, the haill and the design, with no new confirmation', {k: c[k] for k in ('trim', 'vx', 'skip', 'credit', 'stock', 'cos', 'thanks')})
    check(want(c2) and c2['fix'] == ['haill', 'skip', 'trim', 'yard'], 'HS4: the ends written further out, more credits, another design and a fresh haill aboard do not last: the next claim puts the server\'s back, and each fix is counted (srv_fix)', {k: c2[k] for k in ('trim', 'skip', 'credit', 'stock', 'cos', 'on', 'fix')})
    # d. a purchase: the server delivers it in the answer itself, the game shows it and confirms it once, and says no shop_done for it
    # (a second pump with no boat, as a correction from the admin: on the first boat, which is this one, added to the first)
    st['grants'] += [{'id': 70, 'product': 'trim_pump', 'data': {'give': 'trim', 'k': 'pump', 'boat': cur}}, {'id': 71, 'product': 'haill', 'data': {'give': 'haill', 'type': 'haill'}}, {'id': 73, 'product': 'trim_pump', 'data': {'give': 'trim', 'k': 'pump', 'comp': True}}]; n0 = len(calls)
    d = await pg.evaluate(claim); await pg.evaluate("document.getElementById('modal').hidden = true"); d2 = await pg.evaluate(claim)
    done = [c_[1].get('ids') for c_ in calls[n0:] if c_[0] == 'shop_done']; srv = {g['id']: bool(g.get('done')) for g in st['grants'] if g['id'] in (70, 71, 73)}
    check(d['n'] == 3 and d['trim'] and d['trim']['k'] == 'pump' and abs(d['trim']['left'] - 48) < 0.5 and d['vx'] == 1.5 and d['stock']['haill'] == 5 and d['thanks'] == 1 and d['rc'] and done == [] and srv == {70: True, 71: True, 73: True}
          and d2['n'] == 0 and d2['thanks'] == 1 and not d2['rc'] and d2['trim'] and d2['trim']['k'] == 'pump' and abs(d2['trim']['left'] - d['trim']['left']) < 0.5 and d2['stock'] == d['stock'],
          'HS4: a trim and a haill bought (and a second pump given with no boat, on the first boat: 48 h) are delivered by the server\'s answer, on the boat and in the store at once, confirmed once («Takk for kjøpet!»), with no shop_done, and not again at the next claim', {'first': {k: d[k] for k in ('n', 'trim', 'vx', 'stock', 'thanks', 'rc')}, 'done': done, 'server': srv, 'again': {k: d2[k] for k in ('n', 'thanks', 'rc')}})
    # e. the credit for the yard done now is a grant: the next yard job is done at once and the server told; one bought with a job
    # running finishes it and is used at once
    await pg.evaluate("(() => { const q = portById(S.boat.port) || PORTS.find(x => x.mottak); S.boat.status = 'port'; S.boat.port = q.id; S.boat.pos = {...q.p}; queueJob({kind:'svc', h:5}); })()")
    # (the yard's own step, core vesselStep, as the game runs it every game minute: here at once, not after a wait)
    await pg.evaluate("vesselStep(S.t / 60)")
    try: await pg.wait_for_function("(S.yardCredit || 0) === 0 && !(S.yardQ || []).length", timeout=90000)
    except Exception: pass
    e = await pg.evaluate("({credit:S.yardCredit || 0, run:(S.jobs || []).filter(j => YARD_KINDS.includes(j.kind) && j.until > S.t).length, q:(S.yardQ || []).slice()})"); y1 = st['yard'][:]
    await pg.evaluate("queueJob({kind:'hull', h:5})"); st['grants'].append({'id': 72, 'product': 'verft_na', 'data': {'give': 'yard', 'boat': cur}})
    e2 = await pg.evaluate(claim); await pg.evaluate("document.getElementById('modal').hidden = true")
    try: await pg.wait_for_function("!(S.yardQ || []).length", timeout=30000)
    except Exception: pass
    e3 = await pg.evaluate("({credit:S.yardCredit || 0, run:(S.jobs || []).filter(j => YARD_KINDS.includes(j.kind) && j.until > S.t).length, msg:S.msgs.filter(m => /Takk for kjøpet/.test(m.no)).pop().no})")
    check(e == {'credit': 0, 'run': 0, 'q': []} and y1 == [62] and e2['n'] == 1 and e3['credit'] == 0 and e3['run'] == 0 and 'ferdig med én gang' in e3['msg'] and st['yard'] == [62, 72],
          'HS4: the server\'s credit finishes the next yard job at once and is told as used (yard_use); a «Ferdig nå» bought with a job running finishes it and is used at once', {'credit': e, 'told': y1, 'bought': {'n': e2['n'], 'after': e3}, 'yard_use': st['yard']})
    # f. switching a haill on tells the server (haill_on), and it stays; one the server no longer has (taken back while there was no
    # network) is taken off the boat when the server answers
    n0 = len(st['used'])
    f = await pg.evaluate("(async () => { const ok = useHaill('haill'); await new Promise(r => setTimeout(r, 900)); const id = S.haill && S.haill.id; await shopClaim(); return {ok, id, on:S.haill && S.haill.type, how:S.haill && S.haill.how, age:S.haill && Math.round(S.t - S.haill.t0), q:(S.haillQ || []).slice(), stock:haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill}; })()")
    u1 = st['used'][n0:]; st['grants'].append(dn(65, 'luksus', {'give': 'haill', 'type': 'luksus'}, 1)); await pg.evaluate("shopClaim()"); st['offline'] = True
    f2 = await pg.evaluate("(async () => { const ok = useHaill('luksus'); await new Promise(r => setTimeout(r, 600)); return {ok, id:S.haill.id, on:S.haill.type, q:(S.haillQ || []).slice()}; })()")
    for g in st['grants']:
        if g['id'] == f2['id']: g['gone'] = True
    st['offline'] = False
    await pg.evaluate("window.dispatchEvent(new Event('online'))"); await pg.wait_for_function("!(S.haillQ || []).length", timeout=90000); await pg.wait_for_timeout(300)
    f3 = await pg.evaluate("({on:S.haill && S.haill.type})"); f4 = await pg.evaluate(claim)
    check(f['ok'] and f['on'] == 'haill' and f['how'] == 'srv' and f['age'] <= 2 and f['q'] == [] and f['stock'] == 4 and u1 == [(f['id'], True)] and f2['ok'] and f2['on'] == 'luksus' and f2['q'] == [f2['id']] and f3['on'] is None and f4['on'] and f4['on']['type'] == 'haill' and f4['stock']['luksus'] == 0,
          'HS4: «Aktiver» tells the server once with haill_on and the haill stays aboard; one switched on with no network that the server has taken back meanwhile is taken off when the server answers, and the one before it is aboard again', {'on': f, 'told': u1, 'offline': f2, 'after': f3, 'claim': f4['on']})
    # g. the pub: the wheel is the server's (a haill won is in the store with the server's id, the 1 000 kroner paid here), one round
    # per evening; with no network no round and nothing paid; a round the server says is had is not paid again
    await pg.evaluate("(() => { S.t = Math.ceil(S.t / 1440 + 1) * 1440 + (15 - EPOCH_HR + 2) * 60; const q = portById(S.boat.port) || PORTS.find(x => x.mottak); S.boat.status = 'port'; S.boat.port = q.id; S.boat.pos = {...q.p}; S.cash = 50000; S.pubE = null; })()")
    st['pubk'] = 'haill'; st['pubhad'] = False; n0 = len(calls)
    g1 = await pg.evaluate("(async () => { const open = pubOpen(S.t / 60), c0 = S.cash, s0 = haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill, d = await PUBW.round(), d2 = await PUBW.round(); return {open, k:d && d.seg && d.seg.k, err:d && d.err, paid:c0 - S.cash, won:haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill - s0, inv:(S.haillInv || {}).haill || 0, id:S.haillSrv.map(x => x.id).pop(), again:d2, had:S.pubE === pubEvening(S.t / 60)}; })()")
    spins = len([c_ for c_ in calls[n0:] if c_[0] == 'pub_spin']); gid = max(g['id'] for g in st['grants'])
    st['offline'] = True
    g2 = await pg.evaluate("(async () => { S.pubE = null; const c0 = S.cash, d = await PUBW.round(); PUBW.open(); document.querySelector('#pubUI [data-p=spin]').click(); for (let i = 0; i < 80 && !/nett/.test(document.querySelector('#pubUI .pubmsg').textContent); i++) await new Promise(r => setTimeout(r, 250)); return {err:d && d.err, paid:c0 - S.cash, had:S.pubE != null, shown:document.querySelector('#pubUI .pubmsg').textContent}; })()")
    await shoot('pub-uten-nett'); await pg.evaluate("document.getElementById('pubUI').hidden = true")
    st['offline'] = False
    g3 = await pg.evaluate("(async () => { S.pubE = null; const c0 = S.cash, d = await PUBW.round(); return {err:d && d.err, paid:c0 - S.cash, had:S.pubE === pubEvening(S.t / 60)}; })()")
    st['pubhad'] = False; st['pubk'] = 'tom'
    g4 = await pg.evaluate("(async () => { S.pubE = null; const c0 = S.cash, d = await PUBW.round(); return {k:d && d.seg && d.seg.k, paid:c0 - S.cash}; })()")
    check(g1['open'] and g1['k'] == 'haill' and not g1['err'] and g1['paid'] == 1000 and g1['won'] == 1 and g1['inv'] == 0 and g1['id'] == gid and g1['again'] is None and g1['had'] and spins == 1,
          'HS4: the pub asks the server for the round (pub_spin once): the haill won is in the store with the server\'s id, the 1 000 kroner are paid here, and there is no second round that evening', {'r': g1, 'spins': spins, 'grant': gid})
    check(g2['err'] and 'nett' in g2['err'] and g2['paid'] == 0 and not g2['had'] and 'nett' in g2['shown'], 'HS4: with no network the pub gives no round, takes no money and says it needs a network', g2)
    check(g3['err'] and 'kveldens runde' in g3['err'] and g3['paid'] == 0 and g3['had'] and g4 == {'k': 'tom', 'paid': 1000}, 'HS4: a round the server says is had (another device, a lost save) is not paid again and is marked as had; an empty evening is paid and is the server\'s', {'had': g3, 'empty': g4})
    # h. the haill of chapter 2 is asked for from the server, once per account
    h = await pg.evaluate("(async () => { const s0 = haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill, ask = achHaillAsk(); await new Promise(r => setTimeout(r, 50)); await shopClaim(); await shopClaim(); const s1 = haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill, ask2 = achHaillAsk(); await new Promise(r => setTimeout(r, 50)); await shopClaim(); await shopClaim(); return {ask, got:s1 - s0, ask2, got2:haillStock(S.haillInv, S.haillSrv, S.haillUsed).haill - s1, inv:(S.haillInv || {}).haill || 0, left:S.achH || 0}; })()")
    ach = len([c_ for c_ in calls if c_[0] == 'ach_haill'])
    check(h == {'ask': True, 'got': 1, 'ask2': True, 'got2': 0, 'inv': 0, 'left': 0} and ach == 2, 'HS4: the haill of chapter 2 is the server\'s grant, in the store once; asked for again, the server gives none', {'r': h, 'calls': ach})
    # j. the hop over the rest of a route (HO3, ui/10u-hopp.js, 20261112200000_hopp.sql). Jonas 12.11.2026: «Når brukeren trykker på
    # hopp-knappen stopper båten momentant som om den var fryst i tiden», «Når spilleren har kommet fram til endepunktet av ruten ved hjelp
    # av hoppet er tjenesten levert og spilleren skal ikke ha noe "hopp" tilgode», «Hopp skal ikke selges i kaiboden». The button stops the
    # boat (the hold), the card's «Kjøp» asks shop-checkout for the hop with the minutes and the stop, the boat lies still while the page
    # is at Stripe and after it is back (the time away played in), and the grant hops her from there; a grant for a boat no longer held
    # is not made and is marked for a refund, once, with nothing owed in the game
    ROUTE = """async (back) => { const b = S.boat; S.tut = 0; S.settings.autoOn = false; WX_FORCE = {w:3, d:180}; if (S.turer) S.turer.act = [];
      const A = portById(b.port) || PORTS.find(p => dist(p.p, b.pos) < 1);
      const B = back ? portById(back) : PORTS.filter(p => p.id !== A.id && !p.naust && dist(p.p, A.p) > 8 && dist(p.p, A.p) < 30).sort((p, q) => dist(p.p, A.p) - dist(q.p, A.p))[0];
      const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); for (const w of r.wps) await mapNeed(w, 1);
      b.status = 'sailing'; b.port = null; b.pos = {x:r.wps[0].x, y:r.wps[0].y}; b.v = 6; b.fuel = BOAT.fuelCap; b.hopHold = null;
      S.plan = {wps:r.wps.slice(1), idx:0, speed:BOAT.vcruise || BOAT.vmax * 0.8, returning:false, depAt:null, unsafe:r.wps.slice(1).map(() => false)}; S.plan.wps[S.plan.wps.length - 1].port = B.id;
      return {A:A.id, B:B.id}; }"""
    POS = "JSON.stringify([S.boat.pos, S.plan && S.plan.idx])"
    CARD = """(async () => { hopOpen(); const p0 = """ + POS + """; for (let i = 0; i < 100 && !document.getElementById('hopGo'); i++) await new Promise(r => setTimeout(r, 50));
      await new Promise(r => setTimeout(r, 2500)); const q = hopQuote(), m = document.getElementById('modal');
      return {lab:(document.getElementById('hopGo') || {}).textContent, fine:!!m.querySelector('.shop-fine'), min:q.realMin, kr:q.kr, text:m.innerText, pos:p0, still:p0 === """ + POS + """, v:S.boat.v, hold:!!S.boat.hopHold}; })()"""
    rt = await pg.evaluate(ROUTE, None)
    # (the kontroll: a card that says no lets the boat go at once, so it is never a free stop in a storm)
    cn = await pg.evaluate("(async () => { const f = S.boat.fuel; S.boat.fuel = 0.2; hopOpen(); for (let i = 0; i < 100 && !/diesel/.test(document.getElementById('modal').innerText); i++) await new Promise(r => setTimeout(r, 50)); const out = {why:/diesel/.test(document.getElementById('modal').innerText), hold:!!S.boat.hopHold}; document.getElementById('modal').hidden = true; S.boat.fuel = f; return out; })()")
    check(cn == {'why': True, 'hold': False}, 'HO3: a card that says no (too little diesel) does not hold the boat', cn)
    c1 = await pg.evaluate(CARD); n0 = len(calls)
    lp = await pg.evaluate("(() => { const q = livePose(0.9), b = S.boat; return Math.round(dist(q.p, b.pos) * 1e6) / 1e3; })()")
    check(c1['hold'] and c1['still'] and c1['v'] == 0 and lp == 0, 'HO3: the fast-forward button stops the boat at once: with the card open for 2,5 s she has not moved, and the pose the chart and the 3D view draw is where she lies (%s m)' % lp, {k: c1[k] for k in ('hold', 'still', 'v')})
    async with pg.expect_navigation(url='**/checkout.stripe.test/**', timeout=45000):
        await pg.evaluate("document.getElementById('hopGo').click()")
    co = [c[1] for c in calls[n0:] if c[0] == 'checkout']; co = co[-1] if co else {}
    check(c1['lab'] == 'Kjøp · 💎 %d kr' % c1['kr'] and c1['fine'] and co.get('product') == 'hopp' and co.get('min') == c1['min'] and (co.get('to') or {}).get('port') == rt['B'] and co.get('boat') == cur,
          'HO3: on a route the card\'s «Kjøp» shows the price for the minutes and asks shop-checkout for the hop with the whole minutes, the stop and the boat, straight to Stripe', {'card': {k: c1[k] for k in ('lab', 'fine', 'min', 'kr')}, 'checkout': co})
    pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); await pg.close(); pg = pg2
    pg.set_default_timeout(120000); await pg.goto(url('kjop=cs_test_hop'))
    await pg.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && SHOP.ready === true && typeof SIMREADY !== 'undefined' && SIMREADY", timeout=120000)
    await pg.wait_for_timeout(3000)
    j0 = await pg.evaluate("({st:S.boat.status, hold:S.boat.hopHold, pos:" + POS + "})")
    check(j0['st'] == 'sailing' and j0['hold'] and j0['hold'].get('pay') and j0['pos'] == c1['pos'], 'HO3: back from Stripe, before the payment is confirmed, the boat lies where the button stopped her (the time away played in)', {'st': j0['st'], 'hold': j0['hold'], 'same': j0['pos'] == c1['pos']})
    st['grants'].append({'id': 80, 'product': 'hopp', 'data': {'give': 'hopp', 'boat': cur, 'min': co.get('min'), 'to': co.get('to'), 'kr': c1['kr']}})
    await pg.evaluate("shopClaim()")
    try: await pg.wait_for_function("S.boat.status === 'port' && !HOPUI.busy && !(S.hopQ || []).length", timeout=60000)
    except Exception: pass
    j1 = await pg.evaluate("({st:S.boat.status, port:S.boat.port, hold:S.boat.hopHold || null, q:(S.hopQ || []).slice(), log:S.log.slice(-6).map(e => e.no).join(' | ')})")
    check(j1['st'] == 'port' and j1['port'] == rt['B'] and j1['hold'] is None and st['hop'] == [80] and 'Hoppet til' in j1['log'],
          'HO3: the payment confirmed, the boat is hopped from where she lay to the quay at the end of the route, the hold is gone and the server is told once (hop_use)', {'r': j1, 'hop_use': st['hop']})
    # (the kontroll: an answer read before hop_use came, still listing the hop, never marks a hop made here for a refund: S.hopDone)
    st['hopStale'] = True
    js = await pg.evaluate("(async () => { await shopClaim(); await new Promise(r => setTimeout(r, 300)); return {void:(S.hopVoid || []).slice(), done:(S.hopDone || []).slice()}; })()")
    st['hopStale'] = False
    check(js['void'] == [] and 80 in js['done'] and not st.get('voidc'), 'HO3: an answer from before the server was told still lists the hop made here: it is not marked for a refund', {'r': js, 'hop_void': st.get('voidc')})
    # (the receipt has the price paid and the minutes, from the purchase, not from the card the page had before Stripe)
    try: await pg.wait_for_function("(() => { const m = document.getElementById('modal'); return !m.hidden && /Takk for kjøpet/.test(m.innerText); })()", timeout=15000)
    except Exception: pass
    rc = await pg.evaluate("(() => { const m = document.getElementById('modal'); return m.hidden ? '' : m.innerText; })()")
    check(c1['kr'] != 5 and ('\U0001F48E %d kr' % c1['kr']) in rc and ('(%d min)' % c1['min']) in rc, 'HO3: the receipt says the hop with its minutes and the price paid (%d kr, %d min)' % (c1['kr'], c1['min']), {'text': rc[:300]})
    await pg.evaluate("document.getElementById('modal').hidden = true")
    # a grant for a boat not held (here she is at the quay): not made, marked for a refund, said once, and nothing in Kaiboden
    st['grants'].append({'id': 81, 'product': 'hopp', 'data': {'give': 'hopp', 'boat': cur, 'min': 60, 'to': {'x': 0, 'y': 0, 'port': 'et-annet-sted'}, 'kr': 45}})
    j2 = await pg.evaluate("""(async () => { await shopClaim(); await new Promise(r => setTimeout(r, 400)); document.getElementById('modal').hidden = true; await shopClaim(); await new Promise(r => setTimeout(r, 400));
      document.getElementById('modal').hidden = true; PHONE.open('trim'); await new Promise(r => setTimeout(r, 300)); const t = document.getElementById('phone').innerText; PHONE.show(false);
      const L = S.log.map(e => e.no).filter(x => /Hoppet ble ikke gjort/.test(x)); return {st:S.boat.status, void:(S.hopVoid || []).slice(), n:L.length, last:L[L.length - 1] || '', trim:/Hopp over resten av ruta/.test(t)}; })()""")
    j2b = await pg.evaluate("(async () => { S.hopVoid = []; await shopClaim(); await new Promise(r => setTimeout(r, 300)); document.getElementById('modal').hidden = true; return S.log.map(e => e.no).filter(x => /Hoppet ble ikke gjort/.test(x)).length; })()")
    check(j2['st'] == 'port' and j2['void'] == [81] and j2['n'] == 1 and j2b == 1 and 'pengene betales tilbake' in j2['last'] and not j2['trim'] and st['hop'] == [80] and st.get('voidc') == [81],
          'HO3: a grant for a boat not held is not made: it is marked for a refund on the server (hop_void) and said once, also with the save\'s own list lost; nothing is owed and nothing is in Kaiboden', {'r': j2, 'again': j2b, 'hop_use': st['hop'], 'hop_void': st.get('voidc')})
    # k. a hop paid for while the time the game was closed is still played in (hopWait, held true here) waits for it, the boat still held,
    # and is made when that is done; the time away played in is what hopWait waits for (CATCH_LEFT); one paid for far fewer minutes
    # than the trip is not made and is marked for a refund; a purchase cancelled at Stripe lets the boat go
    STOP = "(() => { const pl = S.plan, w = pl.wps[hopStop(pl)]; return {x:w.x, y:w.y, port:w.port, min:hopQuote().realMin}; })()"
    await pg.evaluate(ROUTE, rt['A']); k0 = await pg.evaluate(STOP)
    kc = await pg.evaluate("() => { const was = CATCH_LEFT; CATCH_LEFT = 5; const w = hopWait(); CATCH_LEFT = was; return w; }")
    await pg.evaluate("() => { hopHoldOn(); S.boat.hopHold.pay = true; window.__hw = true; window.__hwReal = hopWait; hopWait = () => window.__hw || window.__hwReal(); }")
    kp = await pg.evaluate(POS)
    st['grants'].append({'id': 82, 'product': 'hopp', 'data': {'give': 'hopp', 'boat': cur, 'min': k0['min'], 'to': {'x': k0['x'], 'y': k0['y'], 'port': k0['port']}, 'kr': 9}})
    k1 = await pg.evaluate("(async () => { await shopClaim(); await new Promise(r => setTimeout(r, 2500)); return {st:S.boat.status, hop:(S.hopQ || []).includes(82), still:" + POS + " === " + json.dumps(kp) + "}; })()")
    await pg.evaluate("() => { window.__hw = false; }")
    try: await pg.wait_for_function("S.boat.status === 'port' && !HOPUI.busy && !(S.hopQ || []).length", timeout=60000)
    except Exception: pass
    k2 = await pg.evaluate("({st:S.boat.status, port:S.boat.port})")
    check(kc is True and k1['st'] == 'sailing' and k1['still'] and not k1['hop'] and k2 == {'st': 'port', 'port': rt['A']} and st['hop'][-1:] == [82],
          'HO3: a hop paid for while the time away is played in (CATCH_LEFT makes hopWait true) waits for it with the boat held, and is made when it is done (hop_use told)', {'catch': kc, 'waiting': k1, 'after': k2, 'hop_use': st['hop']})
    await pg.evaluate("() => { document.getElementById('modal').hidden = true; hopWait = window.__hwReal; }")
    await pg.evaluate(ROUTE, rt['B']); k3s = await pg.evaluate(STOP); await pg.evaluate("() => { hopHoldOn(); S.boat.hopHold.pay = true; }")
    st['grants'].append({'id': 83, 'product': 'hopp', 'data': {'give': 'hopp', 'boat': cur, 'min': 1, 'to': {'x': k3s['x'], 'y': k3s['y'], 'port': k3s['port']}, 'kr': 5}})
    k3 = await pg.evaluate("(async () => { await shopClaim(); await new Promise(r => setTimeout(r, 500)); for (let i = 0; i < 200 && (HOPUI.busy || HOPUI.pend.size); i++) await new Promise(r => setTimeout(r, 100)); await new Promise(r => setTimeout(r, 600)); document.getElementById('modal').hidden = true; return {st:S.boat.status, hold:!!S.boat.hopHold, void:(S.hopVoid || []).slice(), log:S.log.slice(-4).map(e => e.no).join(' | ')}; })()")
    check(k3s['min'] > 4 and k3['st'] == 'sailing' and not k3['hold'] and 83 in k3['void'] and 'lengre enn hoppet ble kjøpt for' in k3['log'] and 'pengene betales tilbake' in k3['log'] and 83 not in st['hop'],
          'HO3: a hop paid for 1 minute is not made on a trip of %d minutes: marked for a refund, the log says why, and the boat sails on' % k3s['min'], {'r': k3, 'hop_use': st['hop']})
    await pg.evaluate("() => { hopHoldOn(); S.boat.hopHold.pay = true; save(); }")
    pg2 = await ctx.new_page(); pg2.on('pageerror', lambda e: errs.append(str(e))); await pg.close(); pg = pg2
    pg.set_default_timeout(120000); await pg.goto(url('kjop=avbrutt'))
    await pg.wait_for_function("typeof SHOP !== 'undefined' && CLOUD.user && typeof SIMREADY !== 'undefined' && SIMREADY", timeout=120000); await pg.wait_for_timeout(1500)
    k5 = await pg.evaluate("({st:S.boat.status, hold:S.boat.hopHold || null})")
    check(k5 == {'st': 'sailing', 'hold': None}, 'HO3: a purchase cancelled at Stripe lets the boat go: she sails on', k5)
    # (in a harbour by a hop, for the steps after: the pub needs a harbour)
    k4 = await pg.evaluate("(async () => { const q = await hopGo(true); return {why:q && q.why, st:S.boat.status}; })()")
    if k4 != {'why': None, 'st': 'port'}: print('(in a harbour: ' + json.dumps(k4, ensure_ascii=False) + ')')
    # i. a server from before the migration (the new functions answer 404): the game as after HS3, all of it. What is in the save stands,
    # the pub draws itself, and the chapter's haill is the game's own
    st['hs4'] = False
    i = await pg.evaluate("""(async () => { SHOP.hs4 = null; S.boat.trim = {k:'turbo', t0:S.t, until:S.t + 72 * 60}; applyVessel(); S.haillInv = {haill:3, luksus:0}; await shopClaim(); const hs4 = SHOP.hs4, trim = S.boat.trim && S.boat.trim.k, inv = S.haillInv.haill;
      const ask = achHaillAsk(); S.pubE = null; const c0 = S.cash, d = await PUBW.round(); return {hs4, trim, inv, ask, k:!!(d && d.seg), paid:c0 - S.cash}; })()""")
    check(i == {'hs4': False, 'trim': 'turbo', 'inv': 3, 'ask': False, 'k': True, 'paid': 1000}, 'HS4: against a server from before the migration the game is as after HS3: what is in the save stands, the pub draws itself and the chapter\'s haill is the game\'s own', i)
    await ctx.close()

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []; calls = []; st = {'ready': False, 'grants': [], 'hs': True, 'hs3': True, 'offline': False, 'used': [], 'hs4': False, 'imp': True, 'impcalls': [], 'yard': [], 'nid': 500, 'pubk': 'tom', 'pubhad': False, 'ach': False, 'owned': [], 't0': datetime.datetime.now(datetime.timezone.utc)}
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
            week = lambda g: g['data'].get('give') in ('trim', 'skip', 'yard') and g.get('done_at') and (now - datetime.datetime.fromisoformat(g['done_at'])).total_seconds() < (1 if g['data'].get('give') == 'yard' else 7) * 86400   # (the yard done now: one day)
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
            # (HS4: the server as the truth. The server's game minute runs with the real clock, 6 game minutes a minute; the page's own
            # clock is the game's, so only the age of a minute counts there, core srvToT)
            if fn in ('shop_state', 'haill_on', 'yard_use', 'haill_import', 'pub_spin', 'ach_haill', 'hop_use', 'hop_void'):
                if not st['hs4']: await route.fulfill(status=404, content_type='application/json', body='{"code":"PGRST202"}'); return
                if st['offline']: await route.abort(); return
                gm = 100000 + (now - st['t0']).total_seconds() / 10; give = lambda g: g['data'].get('give')
                def new(product, data, **k): st['nid'] += 1; g = dict({'id': st['nid'], 'product': product, 'data': data, 'done': True, 'done_at': now.isoformat()}, **k); G.append(g); return g
                if fn == 'shop_state':
                    fresh = []
                    for g in G:
                        if not g.get('done') and not g.get('gone') and give(g) in ('haill', 'trim', 'skip', 'yard', 'hopp'): g['done'] = True; g['done_at'] = now.isoformat(); fresh.append(g['id'])
                    wk = lambda g: g.get('done_at') and (now - datetime.datetime.fromisoformat(g['done_at'])).total_seconds() < 7 * 86400
                    lst = [dict({'id': g['id'], 'product': g['product'], 'data': g['data']}, **({'held': True, 'done_at': g.get('done_at') or (now - datetime.timedelta(hours=1)).isoformat()} if g.get('done') else {}), **({'new': True} if g['id'] in fresh else {}))
                           for g in G if not g.get('gone') and (not g.get('done') or (give(g) in ('haill', 'yard', 'hopp') and not g.get('used')) or (give(g) in ('trim', 'skip') and wk(g))
                               or (st.get('hopStale') and give(g) == 'hopp'))]   # (hopStale: an answer read before hop_use came, still listing the hop)
                    used = [g for g in G if isH(g) and g.get('used') and not g.get('gone') and g.get('t0') is not None]; on = max(used, key=lambda g: (g['t0'], g['id'])) if used else None
                    r = {'v': 4, 't': gm, 'list': lst, 'on': {'id': on['id'], 'type': on['data']['type'], 't0': on['t0']} if on else None, 'imp': st['imp'], 'owned': st['owned'], 'pub': None}
                elif fn == 'haill_on':
                    g = next((g for g in G if g['id'] == body.get('id') and isH(g) and not g.get('gone')), None); t0 = body.get('t0')
                    if g and not g.get('used'): g['used'] = g['done'] = True; g.setdefault('done_at', now.isoformat()); g['t0'] = min(t0, gm) if isinstance(t0, (int, float)) else gm; r = {'ok': True}
                    else: r = {'ok': False, 'why': 'used' if g else 'gone'}
                    if body.get('id'): st['used'].append((body.get('id'), r['ok']))
                elif fn == 'hop_use':   # (HO3, 20261112200000_hopp.sql: the hop's grant is unused until a hop is made with it)
                    g = next((g for g in G if g['id'] == body.get('id') and give(g) == 'hopp' and not g.get('used') and not g.get('gone')), None)
                    if g: g['used'] = g['done'] = True
                    st['hop'].append(body.get('id')); r = bool(g)
                elif fn == 'hop_void':   # (HO3: a hop the game could not make, marked for a refund on the server)
                    g = next((g for g in G if g['id'] == body.get('id') and give(g) == 'hopp' and not g.get('used') and not g.get('gone') and 'void' not in g['data']), None)
                    if g: g['data'] = dict(g['data'], void=body.get('why'))
                    st.setdefault('voidc', []).append(body.get('id')); r = bool(g)
                elif fn == 'yard_use':
                    g = next((g for g in G if g['id'] == body.get('id') and give(g) == 'yard' and not g.get('used') and not g.get('gone')), None)
                    if g: g['used'] = g['done'] = True
                    st['yard'].append(body.get('id')); r = bool(g)
                elif fn == 'haill_import':
                    st['impcalls'].append(body.get('inv'))
                    if st['imp']: r = {'ok': False}
                    else:
                        st['imp'] = True; inv = body.get('inv') or {}; r = {'ok': True}; o = inv.get('on') or {}
                        for ty, cap in (('haill', 2), ('luksus', 1), ('takk', 0), ('yard', 0)):
                            if o.get('type') == ty and ty != 'yard' and cap > 0: new('imp_' + ty, {'give': 'haill', 'type': ty, 'imp': True}, used=True, t0=min(o.get('t0', gm), gm)); r['on'] = ty; cap -= 1   # (the haill aboard is one of its kind)
                            n = max(0, min(int(inv.get(ty) or 0), cap)); r[ty] = n
                            for _ in range(n): new('imp_' + ty, {'give': 'yard', 'imp': True} if ty == 'yard' else {'give': 'haill', 'type': ty, 'imp': True})
                elif fn == 'pub_spin':
                    if st['pubhad']: r = {'ok': False, 'why': 'had', 'e': 0, 'k': st['pubk']}
                    else:
                        st['pubhad'] = True; k = st['pubk']; g = new('pub_' + k, {'give': 'haill', 'type': k, 'pub': True}) if k in ('haill', 'luksus') else None
                        r = {'ok': True, 'k': k, 'e': 0, 'id': g and g['id']}
                else:
                    if st['ach'] or body.get('ch') != 1: r = {'ok': False}
                    else: st['ach'] = True; r = {'ok': True, 'id': new('ach_haill', {'give': 'haill', 'type': 'haill', 'ach': 1})['id']}
                await route.fulfill(status=200, content_type='application/json', body=json.dumps(r)); return
            r = {'tm_hello': dict({'consent': False, 'owned': []}, **st.get('hello', {})), 'save_get': None}.get(fn, '')
            await route.fulfill(status=200, content_type='application/json', body=r if isinstance(r, str) else json.dumps(r))
        await ctx.route('https://sb.test/**', handle)
        await ctx.route('https://checkout.stripe.test/**', lambda r: r.fulfill(status=200, content_type='text/html', body='<title>Stripe</title><p>Stripe Checkout</p>'))
        # what the Luck app shows: the game's own and the server's together (against the game from before HS2, the game's own: so the checks can be seen red)
        STOCK = "(typeof haillStock === 'function' ? haillStock(S.haillInv, S.haillSrv, S.haillUsed) : Object.assign({haill:0, luksus:0, takk:0}, S.haillInv))"
        # KJOP_FRA=6 runs only steps 6 to 8 (one start and one reload, four minutes instead of twelve): the haill of step 3 is then
        # put on the stand-in as step 3 leaves it, delivered and not used (HS2 10.11.2026, to see the last checks red and green)
        if os.environ.get('KJOP_FRA') == '10':
            await hs4(br, handle, st, calls, errs); print('errors:', errs[:3]); await ctx.close(); await br.close(); return
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
        st['grants'] = [dn(57, 'verft_na', {'give': 'yard', 'boat': cur6}, 3)]
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
