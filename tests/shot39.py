from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*26+2.4)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(5000)
        if which=='a':
            await pg.evaluate("G3._debug.cam.dist=35; G3._debug.cam.pitch=0.16; G3._debug.cam.yaw=0.4;"); await pg.wait_for_timeout(10000); await pg.screenshot(path='s1.png')
            await pg.evaluate("G3._debug.cam.dist=900; G3._debug.cam.pitch=0.3; G3._debug.cam.yaw=2.4;"); await pg.wait_for_timeout(11000); await pg.screenshot(path='s2.png')
        else:
            await pg.evaluate("G3._debug.cam.dist=5000; G3._debug.cam.pitch=0.75; G3._debug.cam.yaw=0.3;"); await pg.wait_for_timeout(14000); await pg.screenshot(path='s3.png')
            await pg.evaluate("S.t=(24*26+10)*60; G3._debug.cam.dist=120; G3._debug.cam.pitch=0.1; G3._debug.cam.yaw=3.3;"); await pg.wait_for_timeout(11000); await pg.screenshot(path='s4.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
