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
        await pg.evaluate("S.tut=0; S.t=(24*110+6)*60; S.settings.autoOn=false;")
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(1500)
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(800)
        await pg.evaluate("view.cx=43.9; view.cy=19.9; view.z=18; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(800)
        await pg.screenshot(path='c1.png', clip={'x':0,'y':0,'width':820,'height':560})
        await pg.evaluate("view.cx=56.0; view.cy=54.2; view.z=9; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(800)
        await pg.screenshot(path='c2.png', clip={'x':0,'y':0,'width':820,'height':560})
        # Husøy in 3D
        await pg.click('#plotClose'); await pg.wait_for_timeout(1500)
        await pg.evaluate("S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; G3._debug.bv.init=false; G3._debug.cam.dist=420; G3._debug.cam.pitch=0.42; G3._debug.cam.yaw=2.6;"); await pg.wait_for_timeout(9000)
        await pg.screenshot(path='c3.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
