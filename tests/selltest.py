from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':600,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(500)
        out = {} if False else await pg.evaluate("""(()=>{
          const R = {};
          const catchDay = (y, m, d, g, gut) => { S.t = Math.round((Date.UTC(y, m, d, 7) - EPOCH) / 6e4); S.hold = []; S.facc = {}; S.fnext = {}; S.settings.gut = gut;
            S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 480; S.boat.gear = true; S.equip.jukse = 0; S.boat.ice = 150;
            for (let i = 0; i < 480 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); } S.fsess = {x:GROUNDS[g].p.x, y:GROUNDS[g].p.y};
            S.t += 120; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; };
          S.crew = []; S.quota = null;
          // 1: normal landing in March
          catchDay(2028, 2, 10, 0, false); const c0 = S.cash; sell(); const ls = S.lastSale;
          R.march = {cash:Math.round(S.cash - c0), field:ls.field, lines:ls.lines.map(r => [r.sp, SPECIES[r.sp].cls[r.c][2], r.g, Math.round(r.kg), +(r.sum / r.kg).toFixed(2)]), quota:Math.round(quotaState().torsk), stopDoy:codStopDoy(2028), limit:codLimitNow(S.t/60)};
          // 2: quota almost used -> the rest is confiscated
          catchDay(2028, 2, 12, 0, false); quotaState().torsk = codLimitNow(S.t/60) - 50; const c1 = S.cash; sell();
          R.over = {cash:Math.round(S.cash - c1), confKg:Math.round(S.lastSale.confKg), confKr:Math.round(S.lastSale.confKr), quota:Math.round(quotaState().torsk)};
          // 3: July, quota full: cod within 20 % of the week's landings goes on the fresh-fish scheme
          catchDay(2028, 6, 12, 0, false); quotaState().torsk = 99999; const codH = S.hold.filter(x => x.sp === 'torsk').reduce((a, x) => a + x.kg, 0), all = holdTotal(); const c2 = S.cash; sell();
          R.july = {pct:ffPct(S.t/60), codKg:Math.round(codH), allKg:Math.round(all), ffKg:Math.round(S.lastSale.ffKg), confKg:Math.round(S.lastSale.confKg), cash:Math.round(S.cash - c2)};
          // 4: gutted on board
          S.quota = null; catchDay(2028, 2, 14, 2, true); const c3 = S.cash; sell();
          R.gut = {cash:Math.round(S.cash - c3), ex:S.lastSale.ex, lines:S.lastSale.lines.slice(0, 3).map(r => [r.sp, r.gut, Math.round(r.kg), +(r.sum / r.kg).toFixed(2)])};
          R.fjord = {husoyPort:insideFjord(portById('husoy').p), groundsInside:GROUNDS.map(g => g.name.no + ':' + insideFjord(g.p)), finnsnes:fieldCode(portById('finnsnes').p), gryl:fieldCode(GROUNDS[2].p)};
          R.prices = SP.map(sp => sp + ' ' + price(portById('husoy'), sp, S.t / 60).toFixed(2));
          return R; })()""")
        print(json.dumps(out, ensure_ascii=False, indent=0)[:3500])
        # UI: quota tab and plotter fjord line
        await pg.evaluate("S.t = Math.round((Date.UTC(2028, 3, 20, 9) - EPOCH) / 6e4); PHONE.open('salg')"); await pg.wait_for_timeout(600)
        await pg.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Kvote').click()"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='q1.png')
        await pg.evaluate("PHONE.close && PHONE.close()"); await pg.wait_for_timeout(300)
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(2500); await pg.screenshot(path='q2.png')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
