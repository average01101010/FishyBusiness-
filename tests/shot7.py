from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':700}, device_scale_factor=1)
        await pg.goto(GAME)
        await pg.wait_for_timeout(400)
        await pg.click('[data-close]')
        await pg.click('#view3d')
        await pg.evaluate("S.t=5*60; G3.reset(); G3._debug.cam.pitch=0.35; G3._debug.cam.dist=2500; G3._debug.cam.yaw=3.3;")
        for name, js in [('dA',"window.DBG_NOFAR=true"),('dB',"window.DBG_NOFAR=false; window.DBG_NOTERR=true")]:
            await pg.evaluate(js); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=name+'.png', clip={'x':0,'y':66,'width':390,'height':420})
        await b.close()
asyncio.run(main())
