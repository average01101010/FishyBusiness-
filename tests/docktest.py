"""The dock (ui/10c-dock.js): round buttons along the bottom that follow what the boat is doing, the fans for Marked, Bygd and Verft,
the drawer at the side (a sheet from below when the screen stands), and the phone with only the apps that are left. Lying and
standing like a tablet, with touch. Prints OK or FEIL per check, and screenshots to tests/out/dock_*.png."""
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def run(p, w, h, tag):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))

    # touch straight through the DevTools protocol, the way tut.py does: Playwright's tap waits for a still frame, and 3D never is
    async def tap(x, y):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.15)

    async def tap_el(sel, **kw):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if r: await tap(r['x'], r['y'])
        else: print('     (finner ikke ' + sel + ')')
        return r

    await pg.goto(GAME); await pg.wait_for_timeout(1500); await tap_el('#obGo'); await pg.wait_for_timeout(600)
    await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(800)
    J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
    ids = lambda: pg.evaluate("[...document.querySelectorAll('#dock [data-dk]')].map(x => x.dataset.dk)")
    print('--', tag, w, 'x', h)

    # in port: Marked, Bygd, Verft, Beholdning and Planlegg; the old action bar is gone
    await pg.evaluate("S.cash = 200000; renderActs()")
    d = await ids()
    check(d == ['marked', 'bygd', 'verft', 'beh'], 'i havn: Marked, Bygd, Verft og Beholdning (Planlegg er borte: den lille kartplotteren åpner den store)', d)
    check(not await pg.evaluate("!!document.getElementById('actbar')"), 'den gamle handlingslinja er borte')
    lbl = await pg.evaluate("[...document.querySelectorAll('#dock .dk-l')].map(x => x.textContent)")
    check(lbl[:3] == ['Marked', 'Bygd', 'Verft'], 'knappene har kort tekst under ikonet', lbl)

    # the fans (at home Bygd also has «Hvil», the rest in Father's naust: 15-energy.js, 05.10.2026)
    for m, want in (('marked', ['lever', 'is', 'agn']), ('bygd', ['pub', 'bank', 'oppdrag', 'mannskap', 'rest', 'naustup']), ('verft', ['batmarked', 'oppgr', 'fiskeutstyr', 'vedlikehold', 'maler', 'bunker'])):
        await tap_el('#dock [data-dk=' + m + ']'); await pg.wait_for_timeout(250)
        f = await pg.evaluate("[...document.querySelectorAll('#dockFan [data-dk]')].map(x => x.dataset.dk)")
        vis = await pg.evaluate("!document.getElementById('dockFan').hidden")
        check(vis and f == want, 'viften for ' + m, f)
        if m == 'verft': await pg.screenshot(path='dock_fan_' + tag + '.png')
        await tap_el('#dock [data-dk=' + m + ']'); await pg.wait_for_timeout(150)
    check(await pg.evaluate("document.getElementById('dockFan').hidden"), 'et nytt trykk lukker viften')

    # a grey item says why: Finnsnes has no fish plant
    await tap_el('#dock [data-dk=marked]'); await pg.wait_for_timeout(200)
    off = await pg.evaluate("document.querySelector('#dockFan [data-dk=lever]').classList.contains('off')")
    await tap_el('#dockFan [data-dk=lever]', force=True); await pg.wait_for_timeout(200)
    t = await pg.evaluate("document.getElementById('toast').textContent")
    check(off and 'mottak' in t, 'Lever er grått i Finnsnes og sier hvorfor', t)

    # the drawer: ice from the market, at the side lying, from below standing, and the middle of the screen stays free
    await tap_el('#dockFan [data-dk=is]'); await pg.wait_for_timeout(300)
    r = json.loads(await J("(() => { const r = document.getElementById('drawer').getBoundingClientRect(); return {x:r.x, y:r.y, w:r.width, h:r.height, title:document.getElementById('drawerTitle').textContent, ice:!!document.querySelector('#drawerBody [data-pa=shop][data-k=ice]')}; })()"))
    side = r['x'] > w * 0.55 if w > h else r['y'] > h * 0.3
    check(r['title'] == 'Is' and r['ice'] and side, 'skuffen med is ' + ('ligger til høyre' if w > h else 'kommer nedenfra'), r)
    await pg.screenshot(path='dock_drawer_' + tag + '.png')
    ice0 = await pg.evaluate("S.boat.ice")
    await tap_el('#drawerBody [data-pa=shop][data-k=ice][data-fill]'); await pg.wait_for_timeout(200)
    await tap_el('#drawerBody [data-pa=shop][data-k=ice][data-fill]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("S.boat.ice") > ice0, 'is kjøpes med to trykk i skuffen', [ice0, await pg.evaluate("S.boat.ice")])
    await tap_el('#drawerClose'); await pg.wait_for_timeout(200)
    check(await pg.evaluate("document.getElementById('drawer').hidden"), 'skuffen lukkes')

    # pages in the yard and the village
    for m, it, title, sel in (('verft', 'oppgr', 'Oppgraderinger', '[data-pa=equip]'), ('verft', 'fiskeutstyr', 'Fiskeutstyr', '[data-pa=grbuy]'), ('verft', 'batmarked', 'Båthandel', '[data-pa=mksel]'),
                              ('verft', 'vedlikehold', 'Vedlikehold', '[data-pa=svc]'), ('bygd', 'bank', 'Kystbanken', '.ph-big'), ('bygd', 'oppdrag', 'Oppdrag', '.ph-card'), ('bygd', 'mannskap', 'Mannskap', '.ph-card')):
        await tap_el('#dock [data-dk=' + m + ']'); await pg.wait_for_timeout(200)
        await tap_el('#dockFan [data-dk=' + it + ']'); await pg.wait_for_timeout(300)
        ok = await pg.evaluate("document.getElementById('drawerTitle').textContent === '" + title + "' && !!document.querySelector('#drawerBody " + sel + "')")
        check(ok, m + ' → ' + title + ' åpner siden i skuffen')
    # the crew page has tabs for the crew exchange
    await tap_el('#drawerTabs [data-pg=bors]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("!!document.querySelector('#drawerBody [data-pa=bhire]') || document.getElementById('drawerBody').textContent.includes('søker hyre')"), 'Mannskap har fanen Mannskapsbørs')
    # buying a net string in the drawer
    await pg.evaluate("DOCK.open('fiske')"); await pg.wait_for_timeout(300)
    n0 = await pg.evaluate("S.pgear.nets.reduce((a, l) => a + l.n, 0)")
    await pg.evaluate("document.querySelector('#drawerBody [data-pa=grbuy][data-w=net]').click()"); await pg.wait_for_timeout(300)
    check(await pg.evaluate("S.pgear.nets.reduce((a, l) => a + l.n, 0)") > n0, 'garn kjøpes i Fiskeutstyr i skuffen')
    await tap_el('#drawerClose'); await pg.wait_for_timeout(200)

    # bunkering from the yard
    await pg.evaluate("S.boat.fuel = 5; renderActs()")
    await tap_el('#dock [data-dk=verft]'); await pg.wait_for_timeout(200)
    await tap_el('#dockFan [data-dk=bunker]'); await pg.wait_for_timeout(400)
    check(await pg.evaluate("!!S.boat.fueling || !!S.boat.shift || S.boat.fuel > 5"), 'Bunkring fyller tanken')

    # the inventory: three tabs
    await tap_el('#dock [data-dk=beh]'); await pg.wait_for_timeout(300)
    tabs = await pg.evaluate("[...document.querySelectorAll('#drawerBody .ph-sub button')].map(x => x.textContent)")
    check(tabs == ['Redskap', 'Rigg', 'Lasterom', 'Båten'], 'Beholdning har fanene Redskap, Rigg, Lasterom og Båten', tabs)
    await tap_el('#drawerClose'); await pg.wait_for_timeout(200)

    # the phone has only the apps that are left, and Kvote is one of them
    await pg.evaluate("PHONE.open('home')"); await pg.wait_for_timeout(400)
    apps = await pg.evaluate("[...document.querySelectorAll('#phone .ph-app')].map(x => x.dataset.a)")
    BASE = ['vaer', 'post', 'meld', 'salg', 'kvote', 'regler', 'ordl', 'haill', 'merker', 'sjomann', 'redning', 'trim', 'patch', 'tilbake', 'innst', 'admin']   # and since 05.10.2026 Notatbok, Sesong and Folk among them, and Tilbakemelding
    check([a for a in apps if a in BASE] == BASE and all(a in BASE + ['notat', 'sesong', 'folk'] for a in apps), 'telefonen har appene, med Kvote, Regler, Oppdrag, Trim, Patchnotes og Admin i rekkefølge', apps)
    # the Rederi app only once the company is founded in the bank (Jonas 06.10.2026)
    rd = await pg.evaluate("(() => { const has = () => [...document.querySelectorAll('#phone .ph-app')].some(x => x.dataset.a === 'rederi'); const f0 = S.form, r0 = has(); S.form = 'AS'; PHONE.open('home'); const r1 = has(); S.form = f0; PHONE.open('home'); return [r0, r1]; })()")
    check(rd == [False, True], 'Rederi-appen kommer først når rederiet er stiftet', rd)
    # the patch notes: a badge until the app is opened, then the latest updates as short lists, newest first
    pn = await pg.evaluate("""(() => { const bd = () => { const e = document.querySelector('#phone .ph-app[data-a=patch] .bd'); return e ? e.textContent : null; }, b0 = bd();
      document.querySelector('#phone .ph-app[data-a=patch]').click(); const cards = [...document.querySelectorAll('#phView .patchc')];
      const r = {b0, cards:cards.length, items:cards.map(c => c.querySelectorAll('li').length), first:cards[0] ? cards[0].querySelector('h4').textContent : ''};
      PHONE.open('home'); r.b1 = bd(); return r; })()""")
    check(pn['b0'] and pn['cards'] >= 5 and min(pn['items']) >= 1 and len(pn['first']) > 5 and pn['b1'] is None, 'Patchnotes: merke til appen er åpnet, så korte lister med det nyeste først', pn)
    # Admin fills the tank anywhere, and a boat adrift with an empty tank can go on (for trips along the coast)
    fu = await pg.evaluate("""(() => { const b = S.boat, st = {status:b.status, fuel:b.fuel}; b.fuel = 0; b.status = 'adrift'; PHONE.open('admin');
      const btn = document.querySelector('#phView [data-pa=admFuel]'); if (btn) btn.click(); const r = {btn:!!btn, fuel:b.fuel, cap:BOAT.fuelCap, status:b.status}; b.status = st.status; b.fuel = st.fuel; return r; })()""")
    check(fu['btn'] and fu['fuel'] == fu['cap'] and fu['status'] == 'idle', 'Admin: «Fyll tanken» fyller tanken, og en båt som drev tom, kan gå videre', fu)
    await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(300)
    # a link to a page that moved opens the drawer
    await pg.evaluate("PHONE.open('utstyr')"); await pg.wait_for_timeout(300)
    check(await pg.evaluate("!PHONE.isOpen() && DOCK.page === 'utstyr'"), 'PHONE.open(utstyr) åpner skuffen i stedet')
    await pg.evaluate("DOCK.close()")

    # at sea: lying still, jigging, sailing
    await pg.evaluate("(() => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {...tutField().p}; b.v = 0; b.gear = true; renderActs(); })()")   # a hand jig aboard: without one nobody fishes (the rod is gone)
    d = await ids()
    check(d[:4] == ['jukse', 'settut', 'taopp', 'nav'] and 'beh' in d, 'stille på sjøen: Jukse, Sett ut, Ta opp, Auto-nav og Beholdning', d)
    await tap_el('#dock [data-dk=taopp]', force=True); await pg.wait_for_timeout(200)
    check('redskap i sjøen' in await pg.evaluate("document.getElementById('toast').textContent"), 'Ta opp er grått uten redskap og sier hvorfor')
    await tap_el('#dock [data-dk=jukse]'); await pg.wait_for_timeout(250)
    await pg.screenshot(path='dock_jig_' + tag + '.png')
    await tap_el('#dockFan [data-dk=startfish]'); await pg.wait_for_timeout(300)
    d = await ids()
    check(await pg.evaluate("S.boat.status") == 'fishing' and d[0] == 'stopfish', 'Start jukse i viften starter fisket', d)
    info = await pg.evaluate("document.getElementById('dockInfo').textContent")
    check('Jukser' in info, 'statusen står som tekst over knappene', info)
    await tap_el('#dock [data-dk=stopfish]'); await pg.wait_for_timeout(300)
    check(await pg.evaluate("S.boat.status") != 'fishing', 'Stopp stopper fisket')
    await pg.evaluate("(() => { S.boat.status = 'sailing'; S.boat.v = 5; renderActs(); })()")
    d = await ids()
    check(d[0] == 'stop', 'under fart: Stopp båten først', d)
    await pg.evaluate("(() => { S.boat.status = 'engine'; renderActs(); })()")
    d = await ids()
    check(d[0] == 'hjelp', 'motorstopp: Hjelp', d)
    await pg.evaluate("(() => { S.boat.status = 'idle'; renderActs(); })()")
    await pg.screenshot(path='dock_sea_' + tag + '.png')

    # «Sett ut»: the chart opens with the gear drawn as a line from the boat, exactly as long as the gear
    await pg.evaluate("(() => { const pg = S.pgear; pg.lines.hyse.n = 3; pg.lines.hyse.baited = 3; pg.kits.n = 4; S.boat.rig = 'line'; S.crew = S.crew.length ? S.crew : []; renderActs(); })()")
    await tap_el('#dock [data-dk=settut]'); await pg.wait_for_timeout(300)
    fan = await pg.evaluate("[...document.querySelectorAll('#dockFan .dk-l')].map(x => x.textContent)")
    i = next((k for k, t in enumerate(fan) if 'hyseline' in t), None)
    check(i is not None, 'Sett ut viser redskapet om bord', fan)
    await tap_el('#dockFan [data-dk=set' + str(i) + ']'); await pg.wait_for_timeout(800)
    r = json.loads(await J("(() => { const p = S.boat.pos, e = setEnd(), a = mapToClient(p), c = mapToClient(e); return {plot:document.body.classList.contains('vplot'), km:setKm(), px:Math.hypot(c.x - a.x, c.y - a.y), want:setKm() * view.px, bar:!document.getElementById('setBar').hidden, n:SETM.n}; })()"))
    check(r['plot'] and r['bar'] and abs(r['km'] - 3 * 700 * 0.0015) < 1e-9 and abs(r['px'] - r['want']) < 2, 'linja i kartet er like lang som 3 stamper hyseline (3 150 m), ±2 px', r)
    await pg.screenshot(path='dock_set_' + tag + '.png')
    # − shortens it by one tub
    await tap_el('#setBar [data-sb="-"]'); await pg.wait_for_timeout(200)
    check(await pg.evaluate("SETM.n === 2 && Math.abs(setKm() - 2.1) < 1e-9"), '− gjør linja én stamp kortere')
    # drag the end round to the south-east; the boat sets exactly there
    tgt = json.loads(await J("(() => { const p = S.boat.pos; for (const a of [135, 90, 180, 45, 225, 270, 315, 0]){ const h = a * Math.PI / 180; SETM.hdg = h; if (!setWhy()) return {a, e:mapToClient(setEnd())}; } return null; })()"))
    check(tgt is not None, 'det finnes en retning der lina kan settes', tgt)
    if tgt:
        await pg.evaluate("SETM.hdg = (" + str(tgt['a']) + " + 40) * Math.PI / 180; renderDyn()")
        e0 = json.loads(await J("mapToClient(setEnd())"))
        await tap(e0['x'], e0['y'])   # a tap near the end does nothing harmful
        await pg.mouse.move(e0['x'], e0['y']); await pg.mouse.down(); await pg.mouse.move((e0['x'] + tgt['e']['x']) / 2, (e0['y'] + tgt['e']['y']) / 2, steps=4); await pg.mouse.move(tgt['e']['x'], tgt['e']['y'], steps=4); await pg.mouse.up()
        await pg.wait_for_timeout(300)
        h = await pg.evaluate("Math.round(SETM.hdg * 180 / Math.PI + 360) % 360")
        check(abs(((h - tgt['a']) + 180) % 360 - 180) <= 3, 'dra i enden snur linja dit fingeren er', [h, tgt['a']])
        hd = await pg.evaluate("SETM.hdg")
        await tap_el('#setBar [data-sb=go]'); await pg.wait_for_timeout(500)
        r = json.loads(await J("(() => { const g = S.boat.gop; return g && {op:g.op, n:g.n, dx:g.b.x - g.a.x, dy:g.b.y - g.a.y, hdg:S.boat.heading, bar:document.getElementById('setBar').hidden, v3d:document.body.classList.contains('v3d')}; })()"))
        import math
        ok = r and r['op'] == 'set' and r['n'] == 2 and abs(math.atan2(r['dx'], -r['dy']) - math.atan2(math.sin(hd), math.cos(hd))) < 1e-6 and abs(math.hypot(r['dx'], r['dy']) - 2.1) < 1e-6
        check(ok, 'Sett ut setter 2 stamper nøyaktig langs linja, og båten snur dit', r)
        # stopping before anything went over the side gives everything back
        await pg.evaluate("(() => { const pg = S.pgear; window._k = pg.kits.n; window._b = pg.lines.hyse.baited; gopAbort('stop'); })()")
        r = json.loads(await J("{kits:S.pgear.kits.n - window._k, baited:S.pgear.lines.hyse.baited - window._b, n:S.pgear.lines.hyse.n}"))
        check(r['kits'] == 1 and r['baited'] == 2 and r['n'] == 3, 'avbrutt setting gir blåsesett og egnede stamper tilbake', r)
    # cancel leaves the set mode and sets nothing
    await pg.evaluate("(() => { const b = S.boat; b.status = 'idle'; b.gop = null; renderActs(); })()")
    await pg.evaluate("setModeStart(setChoices()[0])"); await pg.wait_for_timeout(300)
    await tap_el('#setBar [data-sb=x]'); await pg.wait_for_timeout(400)
    check(await pg.evaluate("SETM === null && !S.boat.gop && document.getElementById('setBar').hidden"), 'Avbryt lukker settemodus uten å sette noe')

    # «Ta opp» lights up within 0.3 km of a buoy; Auto-nav to a buoy goes to a point just off it
    r = json.loads(await J("""(() => { const b = S.boat, p = b.pos, s = {id:'tst', vid:S.cur, kind:'line', lk:'hyse', n:1, hooks:700, a:{x:p.x + 2, y:p.y}, b:{x:p.x + 3, y:p.y}, tSet:S.t, depth:40, heavy:false};
      S.sets = (S.sets || []).filter(x => x.id !== 'tst'); S.sets.push(s); renderActs();
      const far = DOCK.items().find(x => x.id === 'taopp'); const sf = buoyStandoff(s, s.a);
      b.pos = {x:sf.x, y:sf.y}; renderActs(); const near = DOCK.items().find(x => x.id === 'taopp');
      return {far:!!far.off, near:!near.off, act:near.act, d:Math.round(dist(sf, s.a) * 1000)}; })()"""))
    check(r['far'] and r['near'] and r['act'] == 'ghaul' and r['d'] == 50, 'Ta opp er grått langt unna og lyser 50 m fra blåsa', r)
    await pg.evaluate("(() => { const s = S.sets.find(x => x.id === 'tst'); S.sets.splice(S.sets.indexOf(s), 1); renderActs(); })()")
    # Autonav to a set's buoy puts the haul in the route, and it starts there (tilbakemelding #31: line, nets and pots alike)
    r = await pg.evaluate("""(async () => { const b = S.boat, keep = {pos:{...b.pos}, status:b.status, port:b.port, plan:S.plan}, g = GROUNDS[0].p, out = [];
      b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; S.plan = null; const p = b.pos;
      for (const kind of ['line', 'garn', 'teine']){ const s = {id:'tst' + kind, vid:S.cur, kind, lk:'hyse', n:kind === 'teine' ? 10 : 1, hooks:700, pot:'small', a:{x:p.x + 0.8, y:p.y}, b:{x:p.x + 1.4, y:p.y}, tSet:S.t, depth:40, heavy:false};
        S.sets.push(s); S.draft = []; LEIA_ARM = true; gearTap({s, e:s.a});
        for (let i = 0; i < 150 && !S.draft.length; i++) await new Promise(r => setTimeout(r, 100));
        const w = S.draft[S.draft.length - 1]; out.push({kind, act:w && w.act ? w.act.op + ':' + w.act.sid : null, d:w ? Math.round(dist(w, s.a) * 1000) : -1});
        S.sets.splice(S.sets.indexOf(s), 1); S.draft = []; }
      LEIA_ARM = false; Object.assign(b, {pos:keep.pos, status:keep.status, port:keep.port}); S.plan = keep.plan; renderActs(); return out; })()""")
    check(all(x['act'] == 'haul:tst' + x['kind'] and x['d'] < 300 for x in r), 'Autonav til ei blåse legger trekket i ruta for line, garn og teiner, rett ved blåsa', r)
    # the jig game (the rod is gone, 04.10.2026): what a hit is worth, your share leaves the automatic catch while you play, and
    # without a jig nobody fishes
    jg = json.loads(await J("""(() => { const b = S.boat, g0 = b.gear, st0 = b.status, eq = S.equip.jukse, tg = S.target, rg = b.rig; b.gear = true; b.rig = 'juksa'; S.target = 'mix'; S.equip.jukse = 0;
      const G = [0, 0.1, 0.2, 0.5, null].map(o => JIGG.grade(o)); b.status = 'fishing'; const H = S.t / 60, sh = jigMeShare(), p0 = catchFactors(H, 5, 0.5).pen;
      window.jigActive = true; const p1 = catchFactors(H, 5, 0.5).pen; window.jigActive = false;
      b.gear = false; b.status = 'idle'; b.port = null; doAct({dataset:{act:'startfish'}}); const refused = b.status !== 'fishing', msg = document.getElementById('toast').textContent;
      b.gear = g0; b.status = st0; S.equip.jukse = eq; S.target = tg; b.rig = rg; b.fishUntil = null; renderActs();
      return {G, sh:+sh.toFixed(2), p0:+p0.toFixed(3), p1:+p1.toFixed(3), refused, msg, rod:typeof window.ROD}; })()"""))
    check(jg['G'] == [2, 1.5, 1, 0.5, 0.5] and jg['sh'] > 0 and jg['p1'] < jg['p0'] and jg['refused'] and 'juksa' in jg['msg'] and jg['rod'] == 'undefined',
          'jukse-spillet: midt på gir 2×, din del går ut av den automatiske fangsten mens du spiller, uten juksa kan du ikke fiske, og stanga er borte', jg)
    check(errs == [], 'ingen sidefeil', errs)
    await b.close()


async def main():
    async with async_playwright() as p:
        await run(p, 1280, 800, 'liggende')
        await run(p, 800, 1280, 'staende')

asyncio.run(main())
