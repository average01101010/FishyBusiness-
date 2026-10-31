from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width':420,'height':600}); pg = await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        url=GAME
        await pg.goto(url); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        before = await pg.evaluate("""(()=>{ S.tut = 0; S.hold = [{sp:'torsk', cls:2, kg:123, n:30, bled:true, iced:true, hr:0, fresh:90, gut:false, hook:true}]; S.crew = [genCrew()]; S.tubs = 110; S.cash = 54321; save();
          const raw = JSON.parse(localStorage.getItem(KEY)); return {fleet:S.fleet.length, cur:S.cur, sameRef:S.fleet[0].hold === S.hold, topHold:'hold' in raw, rawFleetHold:raw.fleet[0].hold.length, crew:S.crew[0].name}; })()""")
        print('saved:', json.dumps(before, ensure_ascii=False))
        await pg.reload(); await pg.wait_for_timeout(1500)
        after = await pg.evaluate("JSON.stringify({fleet:S.fleet.length, hold:S.hold.map(x => x.kg), sameRef:S.fleet[0].hold === S.hold && S.fleet[0].crew === S.crew, crew:S.crew.map(c => c.name), tubs:S.tubs, cash:S.cash, boat:S.boat.type})")
        print('after reload:', after)
        # an old-format save without a fleet
        await pg.evaluate("""(()=>{ window.save = function(){}; window.onbeforeunload = null; const o = JSON.parse(localStorage.getItem(KEY)); const v = o.fleet[0]; delete o.fleet; delete o.cur; for (const k in v) if (k !== 'id') o[k] = v[k]; o.hold = [{sp:'sei', cls:1, kg:77, n:20, bled:true, iced:true, hr:0, fresh:90, gut:false, hook:true}]; o.lastReal = Date.now() - 5 * 3600e3; localStorage.setItem(KEY, JSON.stringify(o)); })()""")
        await pg.reload(); await pg.wait_for_timeout(2500)
        old = await pg.evaluate("JSON.stringify({fleet:S.fleet.length, id:S.fleet[0].id, hold:S.hold.map(x => [x.sp, x.kg]), sameRef:S.fleet[0].hold === S.hold, crew:S.crew.length, t:S.t})")
        print('old save migrated (+5 h away caught up):', old)
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
