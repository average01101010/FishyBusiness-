from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        url=GAME
        ctx = await b.new_context(viewport={'width':420,'height':600}); pg = await ctx.new_page()
        await pg.goto(url); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        key, val = await pg.evaluate("""(()=>{ S.tut = 0; S.crew = [genCrew()]; save(); const o = JSON.parse(localStorage.getItem(KEY)); const v = o.fleet[0]; delete o.fleet; delete o.cur; for (const k in v) if (k !== 'id') o[k] = v[k];
          o.hold = [{sp:'sei', cls:1, kg:77, n:20, bled:true, iced:true, hr:0, fresh:90, gut:false, hook:true}]; o.lastReal = Date.now() - 5 * 3600e3; return [KEY, JSON.stringify(o)]; })()""")
        await ctx.close()
        ctx2 = await b.new_context(viewport={'width':420,'height':600})
        await ctx2.add_init_script("if (!sessionStorage.getItem('seeded')){ localStorage.setItem(%s, %s); sessionStorage.setItem('seeded', '1'); }" % (json.dumps(key), json.dumps(val)))
        pg2 = await ctx2.new_page(); errs=[]; pg2.on('pageerror', lambda e: errs.append(str(e)))
        await pg2.goto(url); await pg2.wait_for_timeout(3000)
        print('old-format save:', await pg2.evaluate("JSON.stringify({fleet:S.fleet.length, id:S.fleet[0].id, hold:S.hold.map(x => [x.sp, x.kg]), sameRef:S.fleet[0].hold === S.hold && S.fleet[0].boat === S.boat, crew:S.crew.length, caughtUpMinutes:S.t})"))
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
