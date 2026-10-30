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
        await pg.evaluate("S.tut=0; S.t=(24*300+15)*60; S.settings.autoOn=false; S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:56.4,y:51.5}; S.boat.heading=Math.PI;")
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(4000)
        await pg.evaluate("G3._debug.cam.dist=40; G3._debug.cam.pitch=0.1; G3._debug.cam.yaw=0;")
        for i in range(3):
            await pg.wait_for_timeout(2500); await pg.screenshot(path=f'n{i}.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
