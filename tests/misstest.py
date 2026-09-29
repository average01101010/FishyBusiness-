from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':400,'height':600})
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        print(await pg.evaluate("""(()=>{ S.rep = {}; const O = ordState(); O.active = [{id:99, cust:'fb', port:'botnhamn', sp:'hyse', kg:40, left:40, q:'E', prem:0.3, bonus:1200, due:S.t + 60, days:2}];
          const r0 = repOf('fb'); S.t += 120; ordersTick(S.t / 60); return JSON.stringify({repBefore:r0, repAfter:repOf('fb'), active:O.active.length, lastMsg:(S.msgs[S.msgs.length - 1] || {}).no}); })()"""))
        await b.close()
asyncio.run(main())
