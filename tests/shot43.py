from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e))); pg.on('console', lambda m: logs.append(m.text) if ('rror' in m.text or 'shader' in m.text.lower()) else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*110+6)*60; S.equip.vhf=true; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p}; S.boat.heading=1.0; S.boatName='Havbris';")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(5000)
        if which=='out':
            for name,(d,pt,yw) in {'k6':(5,0.05,1.9)}.items():
                await pg.evaluate(f"G3._debug.cam.dist={d}; G3._debug.cam.pitch={pt}; G3._debug.cam.yaw={yw};"); await pg.wait_for_timeout(6000); await pg.screenshot(path=name+'.png')
        else:
            await pg.evaluate("S.boat.status='sailing'; S.boat.v=12; S.plan={wps:[{x:GROUNDS[1].p.x+3,y:GROUNDS[1].p.y+1,port:null,fish:0}],idx:0,speed:12,returning:false}; G3.setHelm(true);"); await pg.wait_for_timeout(9000)
            await pg.screenshot(path='k5.png')
        print(which, logs[:6]); await b.close()
asyncio.run(main(sys.argv[1]))
