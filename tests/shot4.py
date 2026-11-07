from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
SC = [
 ('noon_port', "S.t=6*60;"),
 ('noon_sea', "S.t=6*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p}; S.boat.heading=0.5;"),
 ('sailing', "S.t=6*60+30; S.boat.status='sailing'; S.boat.port=null; S.boat.pos={...GROUNDS[3].p}; S.boat.v=16; S.plan={wps:[{x:GROUNDS[0].p.x,y:GROUNDS[0].p.y,port:null,fish:0}],idx:0,speed:16,returning:false}; S.boat.heading=-1.2; G3.reset();"),
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(400)
        await pg.click('[data-close]')
        await pg.click('#view3d')
        for name, js in SC:
            await pg.evaluate(js)
            await pg.wait_for_timeout(2500)
            await pg.screenshot(path=name+'.png')
            info = await pg.evaluate("JSON.stringify({el:G3._debug.env.el, wind:G3._debug.env.wind, cloud:G3._debug.env.cloud, pr:G3._debug.env.precip, temp:G3._debug.env.temp, hs: hsAt(S.boat.pos, S.t/60)})")
            print(name, info)
        print(logs[:10])
        await b.close()
asyncio.run(main())
