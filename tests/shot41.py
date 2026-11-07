from _env import GAME
import asyncio, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        for tag, day in (('fw',26),('fs',120)):
            await pg.evaluate(f"S.tut=0; S.t=(24*{day}+5)*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={{x:66.025,y:1.725}}; S.boat.heading=Math.PI; G3._debug.bv.init=false;")
            if tag=='fw': await pg.wait_for_function("G3.isActive()", timeout=90000)
            await pg.wait_for_timeout(6000)
            # look from the boat towards the forest slope (south)
            await pg.evaluate("G3._debug.cam.dist=260; G3._debug.cam.pitch=0.12; G3._debug.cam.yaw=Math.PI - G3._debug.bv.head;"); await pg.wait_for_timeout(11000)
            await pg.screenshot(path=tag+'.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
