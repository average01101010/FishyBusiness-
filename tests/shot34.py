from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*25+1.5)*60; S.settings.autoOn=false; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(6000)
        if which=='husoy':
            await pg.evaluate("G3._debug.cam.dist=35; G3._debug.cam.pitch=0.25; G3._debug.cam.yaw=0.5;"); await pg.wait_for_timeout(6000); await pg.screenshot(path='f1.png')
            await pg.evaluate("G3._debug.cam.dist=700; G3._debug.cam.pitch=0.55; G3._debug.cam.yaw=2.4;"); await pg.wait_for_timeout(8000); await pg.screenshot(path='f2.png')
        elif which=='sail':
            await pg.evaluate("S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:47.5,y:14.5}; G3._debug.bv.init=false; G3._debug.cam.dist=2400; G3._debug.cam.pitch=0.5; G3._debug.cam.yaw=0.3;"); await pg.wait_for_timeout(10000); await pg.screenshot(path='f3.png')
        else:
            await pg.evaluate("(()=>{ const br=BRIDGES.find(b=>b[2]==='Gryllefjordbrua'); const n=(br.length-4)/2, mx=(br[4]+br[4+(n-1)*2])/2, mz=(br[5]+br[5+(n-1)*2])/2; let wp=null; for (let r=120;r<900&&!wp;r+=40) for (let a=0;a<360;a+=15){ const x=mx+Math.sin(a*Math.PI/180)*r, z=mz-Math.cos(a*Math.PI/180)*r; if(!isLand({x:x/1000,y:z/1000})&&coastDist({x:x/1000,y:z/1000})>0.05){wp={x,z};break;} } S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:wp.x/1000,y:wp.z/1000}; S.boat.heading=Math.atan2(mx-wp.x,-(mz-wp.z)); G3._debug.bv.init=false; G3._debug.cam.dist=60; G3._debug.cam.pitch=0.12; G3._debug.cam.yaw=0; })()")
            await pg.wait_for_timeout(10000); await pg.screenshot(path='f4.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
