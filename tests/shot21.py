from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':430,'height':820}, device_scale_factor=2)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(800); await pg.click('[data-close]')
        await pg.evaluate("S.t=(24*80+13)*60; S.settings.autoOn=false;")
        await pg.click('#view3d'); await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.evaluate("G3.setHelm(true);"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path='o1.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3._debug.cam.hy=0.9;"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='o2.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3.setHelm(false); S.t=(24*80+6)*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p}; S.boat.heading=0.4; G3.reset(); G3._debug.cam.dist=40; G3._debug.cam.pitch=0.1;")
        await pg.wait_for_timeout(3000)
        await pg.evaluate("G3._debug.spawnWild('porpoise', 0.05);"); await pg.wait_for_timeout(700)
        await pg.screenshot(path='o3.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3._debug.spawnWild('humpback', -0.1);"); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='o4.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.wait_for_timeout(1600)
        await pg.screenshot(path='o5.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3._debug.spawnWild('orca', 0.15);"); await pg.wait_for_timeout(1300)
        await pg.screenshot(path='o6.png', clip={'x':0,'y':66,'width':430,'height':470})
        print(logs[:10]); await b.close()
asyncio.run(main())
