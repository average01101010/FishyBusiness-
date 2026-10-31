from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        try:
            b = await p.chromium.launch()
        except Exception as e:
            print('launch fail', e); return
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console:'+m.text) if m.type=='error' else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='s1.png')
        await pg.click('[data-close]')
        # tap waypoints: convert map coords via page JS
        pts = [(69.30,18.00),(69.40,18.06),(69.50,18.08),(69.555,18.10)]
        for lat,lon in pts:
            xy = await pg.evaluate(f"(()=>{{const q=P({lat},{lon}); const pt=svg.createSVGPoint(); pt.x=q.x; pt.y=q.y; const r=pt.matrixTransform(svg.getScreenCTM()); return [r.x,r.y];}})()")
            await pg.mouse.click(xy[0], xy[1])
            await pg.wait_for_timeout(150)
        await pg.click('[data-act="fp"][data-i="3"]'); await pg.click('[data-act="fp"][data-i="3"]')
        xy = await pg.evaluate("(()=>{const q=portById('botnhamn').p; const pt=svg.createSVGPoint(); pt.x=q.x; pt.y=q.y; const r=pt.matrixTransform(svg.getScreenCTM()); return [r.x,r.y];})()")
        await pg.mouse.click(xy[0], xy[1])
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='s2.png')
        await pg.click('[data-act="start"]')
        await pg.select_option('#pace','1800')
        await pg.wait_for_timeout(5000)
        await pg.click('[data-tab="fish"]')
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path='s3.png')
        await pg.click('[data-tab="wx"]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='s4.png')
        await pg.wait_for_timeout(6000)
        await pg.click('[data-tab="port"]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='s5.png')
        await pg.emulate_media(color_scheme='dark'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='s6.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
