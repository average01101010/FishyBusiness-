from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':820,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e))); pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*110+6)*60; S.settings.autoOn=false;")  # mid June, midday
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(6000)
        await pg.evaluate("G3._debug.cam.dist=160; G3._debug.cam.pitch=0.32; G3._debug.cam.yaw=2.2;"); await pg.wait_for_timeout(6000)
        await pg.screenshot(path='o1.png')
        await pg.evaluate("G3._debug.cam.dist=900; G3._debug.cam.pitch=0.3; G3._debug.cam.yaw=2.8;"); await pg.wait_for_timeout(7000)
        await pg.screenshot(path='o2.png')
        print(logs[:8]); await b.close()
asyncio.run(main())
