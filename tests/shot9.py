from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':760}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type=='error' else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(600)
        await pg.click('[data-close]')
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='c1.png', clip={'x':0,'y':66,'width':390,'height':480})
        # zoom chart on Finnsnes/Gisundet
        await pg.evaluate("view.cx=PORTS[0].p.x; view.cy=PORTS[0].p.y-4; view.z=5; applyView(); renderStatic(); renderDyn();")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path='c2.png', clip={'x':0,'y':66,'width':390,'height':480})
        await pg.evaluate("S.t=5*60; S.settings.autoOn=false")
        t0 = await pg.evaluate("performance.now()")
        await pg.click('#view3d')
        await pg.wait_for_function("G3.isActive()", timeout=30000)
        t1 = await pg.evaluate("performance.now()")
        print('3D ready ms', round(t1-t0))
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='d1.png', clip={'x':0,'y':66,'width':390,'height':480})
        print(logs[:10])
        await b.close()
asyncio.run(main())
