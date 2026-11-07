from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':820,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*110+6)*60; S.settings.autoOn=false; S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:56.3,y:50.2}; S.boat.heading=-1.3;")
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(5000)
        await pg.evaluate("G3._debug.cam.dist=70; G3._debug.cam.pitch=0.18; G3._debug.cam.yaw=0;"); await pg.wait_for_timeout(8000)
        await pg.screenshot(path='o3.png')
        await pg.evaluate("G3._debug.cam.dist=600; G3._debug.cam.pitch=0.22; G3._debug.cam.yaw=0.4;"); await pg.wait_for_timeout(6000)
        await pg.screenshot(path='o4.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
