from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(600)
        await pg.click('[data-close]')
        pts = [(69.30,18.00),(69.40,18.06),(69.50,18.08),(69.555,18.10)]
        for lat,lon in pts:
            xy = await pg.evaluate(f"(()=>{{const q=P({lat},{lon}); const pt=svg.createSVGPoint(); pt.x=q.x; pt.y=q.y; const r=pt.matrixTransform(svg.getScreenCTM()); return [r.x,r.y];}})()")
            await pg.mouse.click(xy[0], xy[1]); await pg.wait_for_timeout(120)
        for _ in range(3): await pg.click('[data-act="fp"][data-i="3"]')
        await pg.screenshot(path='t1.png')
        await pg.click('[data-act="start"]')
        await pg.select_option('#pace','300')
        await pg.click('[data-tab="fish"]')
        await pg.wait_for_timeout(9500)
        await pg.screenshot(path='t2.png')
        await pg.click('[data-tab="hold"]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='t3.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
