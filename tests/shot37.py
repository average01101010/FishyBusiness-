from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':820,'height':1180}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*26+0.7)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        if which=='chart':
            await pg.click('#gpsBtn'); await pg.wait_for_timeout(1500)
            print('paint ms', await pg.evaluate("(()=>{ const t0=performance.now(); paintChart(1); return Math.round(performance.now()-t0)+' ms at full resolution'; })()"))
            await pg.evaluate("view.cx=55.78; view.cy=8.98; view.z=12; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path='v1.png')
            await pg.evaluate("view.z=40; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path='v2.png')
        else:
            await pg.evaluate("G3._debug.cam.dist=45; G3._debug.cam.pitch=0.05; G3._debug.cam.yaw=2.9;"); await pg.wait_for_timeout(9000); await pg.screenshot(path='v3.png')
            await pg.evaluate("G3._debug.cam.dist=30; G3._debug.cam.pitch=0.2; G3._debug.cam.yaw=0.2;"); await pg.wait_for_timeout(7000); await pg.screenshot(path='v4.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
