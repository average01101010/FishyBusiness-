from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':820,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*110+6)*60; S.settings.autoOn=false;")
        await pg.wait_for_function("G3.isActive()", timeout=60000); await pg.wait_for_timeout(3000)
        # find the richest tree chunk near Finnsnes and park the boat off its shore, camera looking at it
        info = await pg.evaluate("""(()=>{ const D=G3._debug; let best=null; for (let gz=51; gz<=57; gz++) for (let gx=53; gx<=58; gx++){ const k=gz*100+gx, n=D.treeTest(k); if(!best||n>best.n) best={k,n,gx,gz}; }
          const cx=best.gx*1000+500, cz=best.gz*1000+500; let wp=null; for (let r=200;r<2500&&!wp;r+=100) for (let a=0;a<360;a+=15){ const x=cx+Math.sin(a*Math.PI/180)*r, z=cz-Math.cos(a*Math.PI/180)*r; if(!isLand({x:x/1000,y:z/1000}) && coastDist({x:x/1000,y:z/1000})>0.08){ wp={x,z}; break; } }
          S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:wp.x/1000,y:wp.z/1000}; S.boat.heading=Math.atan2(cx-wp.x, -(cz-wp.z)); return JSON.stringify({best, wp}); })()""")
        print(info)
        await pg.evaluate("G3._debug.bv.init=false; G3._debug.cam.dist=45; G3._debug.cam.pitch=0.16; G3._debug.cam.yaw=0;"); await pg.wait_for_timeout(9000)
        await pg.screenshot(path='o5.png')
        await pg.evaluate("S.t=(24*300+6)*60; G3._debug.cam.dist=45;"); await pg.wait_for_timeout(9000)
        await pg.screenshot(path='o6.png')
        print(logs[:5]); await b.close()
asyncio.run(main())
