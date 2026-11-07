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
        if which=='husoy':
            await pg.evaluate("S.tut=0; S.t=(24*25+9.5)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(6000)
            await pg.evaluate("G3._debug.cam.dist=60; G3._debug.cam.pitch=0.14; G3._debug.cam.yaw=0.9;"); await pg.wait_for_timeout(8000); await pg.screenshot(path='g1.png')
            await pg.evaluate("G3._debug.cam.dist=900; G3._debug.cam.pitch=0.16; G3._debug.cam.yaw=3.3;"); await pg.wait_for_timeout(9000); await pg.screenshot(path='g2.png')
        else:
            await pg.evaluate("S.tut=0; S.t=(24*110+6)*60;")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
            print(await pg.evaluate("(()=>{ const br=BRIDGES.find(b=>b[2]==='Gisundbrua'); const n=(br.length-4)/2, ax=br[4], az=br[5], bx=br[4+(n-1)*2], bz=br[5+(n-1)*2], mx=(ax+bx)/2, mz=(az+bz)/2, dx=bx-ax, dz=bz-az, L=Math.hypot(dx,dz), px=-dz/L, pz=dx/L; let wp=null; for (const s of [1,-1]) for (let r=250;r<1500&&!wp;r+=50){ const x=mx+px*r*s, z=mz+pz*r*s; if(!isLand({x:x/1000,y:z/1000})&&coastDist({x:x/1000,y:z/1000})>0.08){ wp={x,z}; } } S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:wp.x/1000,y:wp.z/1000}; S.boat.heading=Math.atan2(mx-wp.x,-(mz-wp.z)); G3._debug.bv.init=false; return JSON.stringify({L:Math.round(L), wp}); })()"))
            await pg.evaluate("G3._debug.cam.dist=40; G3._debug.cam.pitch=0.08; G3._debug.cam.yaw=0;"); await pg.wait_for_timeout(10000); await pg.screenshot(path='g3.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
