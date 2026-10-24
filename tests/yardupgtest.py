# The yard's rebuilds of the boat itself (core/03-simulation.js UPGS): offered by what the boat has, priced on its value, and their effects.
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.cash = 1e9;
          const offered = t => { b.type = t; b.upg = {}; applyVessel(); return Object.keys(UPGS).filter(k => upgNext(b, k)); };
          R.skiff = offered('skiff'); R.trebat = offered('trebat'); R.sjark = offered('sjark'); R.sjarkny = offered('sjarkny');
          R.types = Object.keys(VESSELS);
          R.hav = Object.keys(VESSELS).filter(t => VESSELS[t].cls === 'hav').map(t => [t, offered(t)]);
          b.type = 'snekke'; b.upg = {}; applyVessel(); R.price = [VESSELS.snekke.price, upPrice(0.03)];
          b.type = Object.keys(VESSELS).find(t => VESSELS[t].cls === 'hav'); R.pricehav = [VESSELS[b.type].price, upPrice(0.03)];
          // effects: cabins and galley and the rest change what the crew and the boat do
          b.type = 'sjark'; b.upg = {}; applyVessel(); const f0 = {fuel:BOAT.fuelCap, sea:BOAT.sea, fx:JSON.stringify(BOAT.fx)};   // (the havsjark: a hotplate and no drying room, so the yard's galley and drying room fit; the new sjark has both built in)
          b.upg = {cabin:3, galley:3, dry:2, insul:2, tank:2, stab:1}; applyVessel(); R.fx = BOAT.fx; R.fuel = [f0.fuel, BOAT.fuelCap]; R.sea = [f0.sea, BOAT.sea];
          b.upg = {}; b.engLv = 2; applyVessel(); R.svc = [VESSELS[b.type].svcCost, BOAT.svcCost];
          b.engLv = 0; b.upg = {}; applyVessel();
          // a job at the yard finishes and sets the step
          b.type = 'sjarkny'; b.status = 'port'; b.port = PORTS.find(q => q.sted === 'verft').id; const q = PORTS.find(q => q.sted === 'verft'); b.pos = {x:q.p.x, y:q.p.y};
          R.queued = queueJob({kind:'upg', u:'cabin', lv:1, h:8, no:'Ombygging: Bedre køyer', en:'Rebuild: Better bunks'}); for (let i = 0; i < 400; i++) step(); R.lv = upgLv(b, 'cabin');
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1500])
        print(ok('cabin' not in r['skiff'] and 'galley' not in r['skiff'] and 'dry' not in r['skiff']), 'a boat without bunks gets no cabin, galley or drying room', r['skiff'])
        print(ok(all(not x[1] for x in r['hav']) or all('insul' not in x[1] and 'tank' not in x[1] for x in r['hav'])), 'the ocean vessels get no insulated hold or extra tank', r['hav'])
        print(ok(r['price'][1] > 5000 and r['pricehav'][1] > 1e6), 'the price follows the boat: a snekke pays a few thousand, an ocean vessel millions', [r['price'], r['pricehav']])
        fx = r['fx']
        print(ok(fx.get('fat') == 0.78 and fx.get('cook') == 12 and fx.get('mood') == 6 and fx.get('cold') == 0.7 and fx.get('ice') == 0.7), 'cabins, galley, drying room and insulation set their effects', fx)
        print(ok(r['fuel'][1] == round(r['fuel'][0] * 1.5) and r['sea'][1] < r['sea'][0]), 'the large tank holds half again and the stabiliser lowers the loss at sea', [r['fuel'], r['sea']])
        print(ok(r['svc'][1] == round(r['svc'][0] * 1.5)), 'the biggest engine makes the engine service dearer', r['svc'])
        print(ok(r['queued'] and r['lv'] == 1), 'a yard job for a rebuild finishes and sets the step', [r['queued'], r['lv']])
        # økt 7 (docs/batplan.md): the machines over 14.99 m, freight on deck first, loading time
        m = await pg.evaluate("""(()=>{ const b = S.boat, t0 = b.type, u0 = b.upg, R = {}; const fits = k => Object.keys(UPGS).filter(u => UPGS[u].fit(VESSELS[k]));
          R.k15 = fits('kyst15'); R.k21 = fits('kyst21'); R.al = fits('autoliner');
          b.type = 'kyst21'; b.upg = {gut:1, ice:1}; applyVessel(); R.mach = [BOAT.gutMachine, BOAT.iceMaker]; R.price = [upPrice(UPGS.gut.steps[0].pc, UPGS.gut.steps[0].min), upPrice(UPGS.ice.steps[0].pc, UPGS.ice.steps[0].min)];
          // the machine guts faster: 600 kg an hour on top of the hands
          const keepCrew = S.crew, keepHold = S.hold, st0 = b.status, p0 = b.port, ds0 = b.deckStop, g0 = S.settings.gut, i0 = S.settings.ice;
          S.crew = []; S.hold = [{sp:'torsk', cls:1, kg:2000, n:500, bled:true, iced:false, hr:0, fresh:95, gut:false, hook:true}]; b.status = 'fishing'; b.port = null; b.deckStop = true; b.ice = 0; S.settings.gut = true; S.settings.ice = false;
          const g = () => S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0); deckMinute(); R.gutMach = +g().toFixed(1);
          b.upg = {}; applyVessel(); S.hold = [{sp:'torsk', cls:1, kg:2000, n:500, bled:true, iced:false, hr:0, fresh:95, gut:false, hook:true}]; deckMinute(); R.gutHand = +g().toFixed(1);
          // the ice machine fills the ice room at sea
          b.upg = {ice:1}; applyVessel(); b.ice = 0; for (let i = 0; i < 60; i++) iceMinute(); R.iceH = +b.ice.toFixed(1);
          // freight on deck first: the snekke's 300 kg on deck and the rest among the boxes
          b.type = 'snekke'; b.upg = {}; applyVessel(); S.hold = []; const c0 = S.cargo; S.cargo = []; R.room0 = cargoRoom(); S.cargo = [{tur:1, kg:200}]; R.cap1 = capHold(); S.cargo = [{tur:1, kg:500}]; R.cap2 = capHold(); R.room2 = cargoRoom();
          R.min = [cargoMin(500)]; b.type = 'kyst15'; applyVessel(); R.min.push(cargoMin(5000));
          S.cargo = c0; S.crew = keepCrew; S.hold = keepHold; b.type = t0; b.upg = u0; applyVessel(); b.status = st0; b.port = p0; b.deckStop = ds0; S.settings.gut = g0; S.settings.ice = i0; return R; })()""")
        print(json.dumps(m, ensure_ascii=False))
        print(ok('gut' not in m['k15'] and 'ice' not in m['k15'] and 'gut' in m['k21'] and 'ice' in m['k21'] and 'gut' not in m['al'] and 'ice' not in m['al']), 'the gutting and ice machines are offered only over 14.99 m, and not where the factory has them', [m['k15'], m['k21'], m['al']])
        print(ok(m['mach'] == [600, 1500] and m['price'][0] >= 350000 and m['price'][1] >= 300000), 'fitted, they give 600 kg an hour and 1,500 kg of ice a day, from 350 000 and 300 000 kr', [m['mach'], m['price']])
        print(ok(m['gutMach'] - m['gutHand'] > 9 and abs(m['iceH'] - 62.5) < 1), 'the machine guts 10 kg a minute more than the hands alone, and the ice machine makes 62.5 kg an hour', [m['gutMach'], m['gutHand'], m['iceH']])
        print(ok(m['room0'] == 1200 and m['cap1'] == 900 and m['cap2'] == 700 and m['room2'] == 700 and m['min'] == [9, 25]), 'freight goes on deck first and takes hold room only beyond it; loading by hand takes a minute per 60 kg, with the crane per 200 kg a tonne', [m['room0'], m['cap1'], m['cap2'], m['room2'], m['min']])
        print(ok(not errs), 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
