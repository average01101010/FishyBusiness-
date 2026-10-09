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
          b.type = 'sjarkny'; b.upg = {}; applyVessel(); const f0 = {fuel:BOAT.fuelCap, sea:BOAT.sea, fx:JSON.stringify(BOAT.fx)};
          b.upg = {cabin:3, galley:3, dry:2, insul:2, tank:2, stab:1}; applyVessel(); R.fx = BOAT.fx; R.fuel = [f0.fuel, BOAT.fuelCap]; R.sea = [f0.sea, BOAT.sea];
          b.upg = {}; b.engLv = 2; applyVessel(); R.svc = [VESSELS.sjarkny.svcCost, BOAT.svcCost];
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
        print(ok(not errs), 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
