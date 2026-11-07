from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e))); pg.on('console', lambda m: logs.append(m.text) if 'shader' in m.text.lower() or 'error' in m.text.lower() else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        # same place and weather as the screenshots: off Senjahopen, late morning, fresh breeze
        await pg.evaluate("S.tut=0; S.t=(24*26+4.3)*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p}; S.boat.heading=2.0;")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(5000)
        shots = {'a':[(30,0.22,0.3,'q1'),(160,0.05,3.2,'q2')], 'b':[(900,0.35,0.3,'q3'),(3500,0.55,1.0,'q4')]}[which]
        for dist,pitch,yaw,name in shots:
            await pg.evaluate(f"G3._debug.cam.dist={dist}; G3._debug.cam.pitch={pitch}; G3._debug.cam.yaw={yaw};"); await pg.wait_for_timeout(11000); await pg.screenshot(path=name+'.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
