from _env import GAME
import asyncio
from playwright.async_api import async_playwright
SUM="(3264+8)*60"
SC = [
 ('w1', f"S.t={SUM}; S.boat.port='husoy'; S.boat.pos={{...portById('husoy').p}}; G3._debug.cam.pitch=0.25; G3._debug.cam.dist=160; G3._debug.cam.yaw=0.3;"),
 ('w2', f"S.t={SUM}; S.boat.port='finnsnes'; S.boat.pos={{...PORTS[0].p}}; G3._debug.cam.pitch=0.12; G3._debug.cam.dist=90; G3._debug.cam.yaw=0.25;"),
 ('w3', "S.t=(24*300+20)*60; G3._debug.cam.pitch=0.12; G3._debug.cam.dist=90; G3._debug.cam.yaw=0.25;"),
 ('w4', f"S.t={SUM}; S.boat.port='husoy'; S.boat.pos={{...portById('husoy').p}}; G3._debug.cam.pitch=1.2; G3._debug.cam.dist=1500; G3._debug.cam.yaw=-G3._debug.bv.head;"),
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
        r=await pg.evaluate("(()=>{let v=0,d=0;for(const c of G3._debug.CH.values()){ for(const m of [c.mesh,c.dm,c.gd,c.gl]) if(m) v+=m.n; if(c.detail) d++; } return [v,d,G3._debug.CH.size];})()")
        print('verts, detailed chunks, chunks', r)
        print(logs[:10])
        await b.close()
asyncio.run(main())
