"""Father's naust by the home harbour and the shop on the Finnsnes quay in 3D (05.10.2026, core/07c-naust.js, view3d.js SITES): where the
naust stands (on a straight shore, water in front, land behind, off the harbours), the ground cut under its bank and levelled under the
shop's yard, no mapped house on their ground, and a naust found for a home along the coast. Pictures: site_naust.png, site_shop.png.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        r = await pg.evaluate("""(() => { const L = G3._debug.sitesNow(), n = L.find(s => s.k === 'naust'), sh = L.find(s => s.k === 'shop'), R = {kinds:L.map(s => s.k)};
          if (n){ const at = (x, y) => [n.o[0] + n.u[0] * x - n.n[0] * y, n.o[1] + n.u[1] * x - n.n[1] * y], land = q => isLand({x:q[0] / 1000, y:q[1] / 1000});
            R.naust = {front:[10, 20, 30].map(v => land(at(0, -v))), behind:[10, 18].map(v => land(at(0, v))), portD:Math.round(Math.min(...PORTS.map(q => Math.hypot(q.p.x * 1000 - n.o[0], q.p.y * 1000 - n.o[1])))),
              ground:[0, 4, 8, 12].map(y => +(G3._debug.terrH(...at(0, y)) - [-2.6, -0.15, 1.7, 2.75][[0, 4, 8, 12].indexOf(y)]).toFixed(2)), clear:G3._debug.onSite(...at(0, 6)), home:+(Math.hypot(n.o[0] - portById('finnsnes').p.x * 1000, n.o[1] - portById('finnsnes').p.y * 1000)).toFixed(0)}; }
          if (sh){ const at = (x, y) => [sh.o[0] + sh.u[0] * x - sh.n[0] * y, sh.o[1] + sh.u[1] * x - sh.n[1] * y]; R.shop = {yard:[[0, 15], [-12, 20], [12, 25]].map(([x, y]) => +G3._debug.terrH(...at(x, y)).toFixed(2)), clear:G3._debug.onSite(...at(0, 18))}; }
          R.models = ['naust', 'shop'].map(k => !!G3._debug.siteModel(k)); return R; })()""")
        print(json.dumps(r))
        print(ok(r['kinds'] == ['shop', 'naust'] and all(r['models'])), 'the shop and Father\'s naust are set down by Finnsnes, with their models', r['kinds'])
        N = r.get('naust') or {}
        print(ok(N and not any(N['front']) and all(N['behind']) and N['portD'] >= 70 and 50 <= N['home'] <= 400), 'the naust stands on the shore: water 10-30 m in front, land behind, at least 70 m from a harbour, near the home harbour', N)
        print(ok(N and all(g <= -0.3 for g in N['ground']) and N['clear']), 'the ground under the naust is cut under its own bank, and the map\'s houses go there', N.get('ground'))
        Sh = r.get('shop') or {}
        print(ok(Sh and all(abs(h - 2.3) < 0.05 for h in Sh['yard']) and Sh['clear']), 'the shop\'s yard is levelled just under the deck, and the map\'s houses go there', Sh)
        # pictures: the naust from the water, the shop from the berth
        await pg.evaluate("""(() => { const n = G3._debug.sitesNow().find(s => s.k === 'naust'), b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:(n.o[0] + n.n[0] * 40) / 1000, y:(n.o[1] + n.n[1] * 40) / 1000};
          const c = G3._debug.cam; c.helm = false; c.dist = 26; c.pitch = 0.16; c.yaw = Math.atan2(-n.n[0], n.n[1]) - b.heading; S.t = Math.round((Date.UTC(2027, 5, 12, 13) - EPOCH) / 6e4); })()""")
        await pg.wait_for_timeout(7000); await pg.screenshot(path='site_naust.png')
        await pg.evaluate("""(() => { const b = S.boat, sh = G3._debug.sitesNow().find(s => s.k === 'shop'); b.status = 'idle'; b.port = null; b.pos = {x:(sh.o[0] + sh.n[0] * 55) / 1000, y:(sh.o[1] + sh.n[1] * 55) / 1000};
          const c = G3._debug.cam; c.helm = false; c.dist = 30; c.pitch = 0.2; c.yaw = Math.atan2(-sh.n[0], sh.n[1]) - b.heading; })()""")
        await pg.wait_for_timeout(7000); await pg.screenshot(path='site_shop.png')
        # a home along the coast: its naust is found when its waters are in
        cs = await pg.evaluate("""(async () => { const pt = PORTS.find(q => q.coastal && /Båtsfjord/.test(q.name)) || PORTS.find(q => q.coastal); await mapNeed(pt.p, MAPD.simR); S.home = pt.id; S.naust = null; const n = naustSite();
          const r = {home:pt.name, found:!!n, d:n ? Math.round(Math.hypot(n.o[0] - pt.p.x * 1000, n.o[1] - pt.p.y * 1000)) : null}; S.home = undefined; S.naust = null; return r; })()""")
        print(ok(cs['found'] and cs['d'] < 400), 'a home along the coast gets its naust on the shore near the plant', cs)
        # the naust as a home: the roof before the stove, faster rest in the home harbour, the workbench's cheaper jig
        nu = await pg.evaluate("""(() => { const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:q.p.x, y:q.p.y}; S.naustUp = {}; S.cash = 50000; S.adm = null; S.sleep = null;
          const stoveFirst = naustWhy('ovn'), c0 = S.cash, t = naustBuy('tak'), paid = c0 - S.cash; S.energy = 50; energyMinute(); const dE = S.energy - 50;
          naustBuy('benk'); b.gear = false; const c1 = S.cash; shopBuy('jig', 0, false); const jig = c1 - S.cash;
          b.port = 'husoy'; const away = naustRest(b); b.port = 'finnsnes'; PHONE.open('notat');
          return {stoveFirst:stoveFirst && stoveFirst[0], t, paid, dE:+dE.toFixed(4), want:+(100 / 8 / 60 * 1.25).toFixed(4), jig, gear:PRICE.gear, away}; })()""")
        await pg.wait_for_selector('.nb-up', timeout=60000)
        nu['txt'] = await pg.evaluate("(() => { const t = document.querySelector('.ph-appv').innerText; PHONE.show(false); return t.includes('Naustet') && t.includes('Vedovn') && /gjort/i.test(t); })()")
        print(json.dumps(nu, ensure_ascii=False))
        print(ok(nu['stoveFirst'] == 'Taket må tettes først.' and nu['t'] is None and nu['paid'] == 6000 and abs(nu['dE'] - nu['want']) < 1e-3 and nu['away'] == 1), 'the naust\'s roof (before the stove) makes you rest 25 % faster in the home harbour, and only there')
        print(ok(nu['jig'] == round(nu['gear'] * 0.75) and nu['txt']), 'Father\'s workbench makes the hand jig a quarter cheaper at home; the notebook lists the steps', nu['jig'])
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
