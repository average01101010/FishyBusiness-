from _env import GAME
import asyncio
from playwright.async_api import async_playwright
SUM="(3264+8)*60"
SC = [
 ('x1', f"S.t={SUM}; S.boat.port='gryllefjord'; S.boat.pos={{...portById('gryllefjord').p}}; G3._debug.cam.pitch=0.1; G3._debug.cam.dist=35; G3._debug.cam.yaw=0.5;"),
 ('x2', f"S.t={SUM}; S.boat.port='senjahopen'; S.boat.pos={{...portById('senjahopen').p}}; G3._debug.cam.pitch=0.1; G3._debug.cam.dist=35; G3._debug.cam.yaw=-0.4;"),
 ('x3', "S.t=5*60; G3._debug.cam.pitch=0.1; G3._debug.cam.dist=35; G3._debug.cam.yaw=-0.4;"),
 ('x4', "S.t=(24*300+20)*60; G3._debug.cam.pitch=0.1; G3._debug.cam.dist=35; G3._debug.cam.yaw=-0.4;"),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':760}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(500)
        await pg.click('[data-close]')
        await pg.evaluate("S.settings.autoOn=false")
        await pg.click('#view3d')
        await pg.wait_for_function("G3.isActive()", timeout=40000)
        for name, js in SC:
            await pg.evaluate(js)
            await pg.wait_for_timeout(5500)
            await pg.screenshot(path=name+'.png', clip={'x':0,'y':66,'width':390,'height':480})
        print(logs[:10])
        await b.close()
asyncio.run(main())
