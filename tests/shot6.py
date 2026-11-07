from _env import GAME
import asyncio
from playwright.async_api import async_playwright
SC = [
 ('aurora', "S.t=40*60; S.plan=null; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[4].p}; S.boat.heading=0; G3.reset(); G3._debug.cam.pitch=0.05; G3._debug.cam.dist=24; G3._debug.cam.yaw=3.14;"),
 ('storm', "S.t=1015*60; S.boat.status='sailing'; S.boat.port=null; S.boat.pos={...GROUNDS[0].p}; S.boat.v=6; S.plan={wps:[{x:GROUNDS[1].p.x,y:GROUNDS[1].p.y,port:null,fish:0}],idx:0,speed:16,returning:false}; G3.reset(); G3._debug.cam.yaw=1.2;"),
 ('overview', "S.t=5*60; S.plan=null; S.boat.status='port'; S.boat.port='finnsnes'; S.boat.pos={...portById('finnsnes').p}; G3.reset(); G3._debug.cam.pitch=0.35; G3._debug.cam.dist=2500; G3._debug.cam.yaw=3.3;"),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':700}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(400)
        await pg.click('[data-close]')
        await pg.evaluate("S.settings.autoOn=false")
        await pg.click('#view3d')
        for name, js in SC:
            await pg.evaluate(js)
            await pg.wait_for_timeout(4000)
            await pg.screenshot(path=name+'.png', clip={'x':0,'y':66,'width':390,'height':420})
        print(logs[:10])
        await b.close()
asyncio.run(main())
