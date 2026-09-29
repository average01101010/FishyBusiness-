from _env import GAME
import asyncio
from playwright.async_api import async_playwright
SUM="(3264+8)*60"
SC = [
 ('b1', f"S.t={SUM}; S.plan=null; S.boat.status='port'; S.boat.port='finnsnes'; S.boat.pos={{...PORTS[0].p}}; G3.reset(); G3._debug.cam.pitch=0.35; G3._debug.cam.dist=180; G3._debug.cam.yaw=2.8;"),
 ('b2', f"S.t={SUM}; G3._debug.cam.pitch=0.55; G3._debug.cam.dist=900; G3._debug.cam.yaw=2.4;"),
 ('b3', "S.t=5*60; G3._debug.cam.pitch=0.3; G3._debug.cam.dist=160; G3._debug.cam.yaw=3.3;"),
 ('b4', "S.t=40*60; G3._debug.cam.pitch=0.25; G3._debug.cam.dist=700; G3._debug.cam.yaw=2.6;"),
 ('b5', f"S.t={SUM}; S.boat.port='senjahopen'; S.boat.pos={{...portById('senjahopen').p}}; G3._debug.cam.pitch=0.3; G3._debug.cam.dist=250; G3._debug.cam.yaw=3.3;"),
 ('b6', f"S.t={SUM}; S.boat.port='husoy'; S.boat.pos={{...portById('husoy').p}}; G3._debug.cam.pitch=0.3; G3._debug.cam.dist=300; G3._debug.cam.yaw=1.2;"),
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
        t0=await pg.evaluate("performance.now()")
        await pg.click('#view3d')
        await pg.wait_for_function("G3.isActive()", timeout=40000)
        print('3D ready ms', round(await pg.evaluate("performance.now()")-t0))
        for name, js in SC:
            await pg.evaluate(js)
            await pg.wait_for_timeout(4500)
            await pg.screenshot(path=name+'.png', clip={'x':0,'y':66,'width':390,'height':480})
        print(logs[:10])
        await b.close()
asyncio.run(main())
