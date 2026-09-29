from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':480,'height':860})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{ const R = {};
          S.tut = 0; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p};
          // daily: tubs and clean hull
          const c0 = capHold(); giveDaily('tubs'); R.tubs = [c0, capHold()]; giveDaily('clean'); R.clean = hullClean();
          const f0 = fuelLph(20, 5); R.fuelNote = 'burn at 20 kn ' + f0.toFixed(1) + ' L/h, with clean hull ' + (f0 * 0.9).toFixed(1);
          // cold in March
          const H = (Date.UTC(2028, 1, 15, 8) - EPOCH) / 36e5; S.t = Math.round(H * 60);
          R.effTemp = Math.round(effTemp(H)); S.clothes = {olje:0, varme:0}; R.cold_none = +coldPen(H, 1.0).toFixed(2); S.clothes = {olje:1, varme:0}; R.cold_olje = +coldPen(H, 1.0).toFixed(2); S.clothes = {olje:1, varme:1}; R.cold_both = +coldPen(H, 1.0).toFixed(2);
          // orders: morning offers at 06:00
          S.orders = null; S.rep = {}; S.t = Math.round((Date.UTC(2028, 2, 10, 6) - EPOCH) / 6e4); ordersTick(S.t / 60); ordersTick(S.t / 60 + 24); R.offers = ordState().offers.map(o => [o.cust, o.sp, o.kg, o.q, o.prem, o.bonus]);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        # take an order through the phone, then land matching fish at its harbour
        await pg.evaluate("PHONE.open('salg')"); await pg.wait_for_timeout(400)
        await pg.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Bestillinger').click()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='o1.png')
        oid = await pg.evaluate("ordState().offers[0].id")
        await pg.evaluate(f"document.querySelector('[data-pa=ordtake][data-id=\"{oid}\"]').click()"); await pg.wait_for_timeout(300)
        res = await pg.evaluate("""(()=>{ const o = ordState().active[0]; if (!o) return 'no active order';
          S.boat.status = 'port'; S.boat.port = o.port; S.boat.pos = {...portById(o.port).p}; S.crew = []; S.quota = null;
          S.hold = [{sp:o.sp, cls:SPECIES[o.sp].ref, kg:o.kg + 40, n:20, bled:true, iced:true, hr:0, fresh:(o.q === 'E' ? 95 : 80), gut:false, hook:true}];
          const c0 = S.cash, r0 = repOf(o.cust); sell(); const ls = S.lastSale;
          return {order:[o.cust, o.sp, o.kg, o.q, o.prem], cash:Math.round(S.cash - c0), ord:ls.ord, repBefore:r0, repAfter:repOf(o.cust), active:ordState().active.length}; })()""")
        print('delivery:', json.dumps(res, ensure_ascii=False))
        # a missed deadline
        miss = await pg.evaluate("""(()=>{ const O = ordState(); O.offers = []; ordersTick(S.t / 60 + 30 * 24 - (S.t / 60) % 24 + 6); const o = O.offers[0]; if (!o) return 'no offer';
          O.offers.splice(0, 1); o.due = S.t + 60; O.active.push(o); const r0 = repOf(o.cust); S.t += 120; ordersTick(S.t / 60); return {cust:o.cust, repBefore:r0, repAfter:repOf(o.cust), active:O.active.length}; })()""")
        print('missed:', json.dumps(miss))
        # clothes through the equipment app
        await pg.evaluate("S.cash = 20000; S.clothes = {olje:0, varme:0}; PHONE.open('utstyr')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelector('[data-pa=cloth][data-k=varme]').click()"); await pg.wait_for_timeout(300)
        print('clothes bought:', await pg.evaluate("JSON.stringify(S.clothes)"), 'cash', await pg.evaluate("S.cash"))
        await pg.evaluate("document.querySelector('.ph-appv') && document.querySelector('.ph-appv').parentElement.scrollTo(0, 99999)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='o2.png')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
