from _env import GAME
import asyncio
from playwright.async_api import async_playwright
SC = [
 ('e1', "S.t=5*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:GROUNDS[1].p.x+1.5, y:GROUNDS[1].p.y+2}; S.boat.heading=2.4; G3.reset(); G3._debug.cam.pitch=0.12; G3._debug.cam.dist=40;"),
 ('e2', "S.t=5*60; S.boat.status='idle'; S.boat.pos={x:43.9, y:14.0}; S.boat.heading=3.1; G3.reset(); G3._debug.cam.pitch=0.1; G3._debug.cam.dist=30;"),
 ('e3', "S.t=5*60; S.boat.status='port'; S.boat.port='finnsnes'; S.boat.pos={...PORTS[0].p}; G3.reset(); G3._debug.cam.pitch=0.45; G3._debug.cam.dist=2500; G3._debug.cam.yaw=2.6;"),
 ('e4', "S.t=5*60; S.boat.status='port'; S.boat.port='senjahopen'; S.boat.pos={...portById('senjahopen').p}; G3.reset(); G3._debug.cam.pitch=0.25; G3._debug.cam.dist=300; G3._debug.cam.yaw=3.14;"),
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
        await pg.wait_for_function("G3.isActive()", timeout=30000)
        for name, js in SC:
            await pg.evaluate(js)
            await pg.wait_for_timeout(3500)
            await pg.screenshot(path=name+'.png', clip={'x':0,'y':66,'width':390,'height':480})
        print(logs[:10])
        await b.close()
asyncio.run(main())
