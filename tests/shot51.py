from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':700}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*27+8)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.evaluate("G3._debug.cam.dist=45; G3._debug.cam.pitch=0.6; G3._debug.cam.yaw=0.4;"); await pg.wait_for_timeout(10000); await pg.screenshot(path='f3.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
