from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e))); pg.on('console', lambda m: logs.append(m.text) if 'WebGL' in m.text or 'rror' in m.text else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        g = "GROUNDS[1].p"
        if which=='run':
            await pg.evaluate(f"S.tut=0; S.t=(24*27+7)*60; S.settings.speed=1; S.boat.status='idle'; S.boat.port=null; S.boat.pos={{...{g}}}; S.boat.heading=0.6;")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
            await pg.evaluate(f"S.boat.status='sailing'; S.boat.v=24; S.draftSpeed=24; S.plan={{wps:[{{x:{g}.x+6*Math.sin(0.6),y:{g}.y-6*Math.cos(0.6),port:null,fish:0}}],idx:0,speed:24,returning:false}};")
            await pg.evaluate("G3._debug.cam.dist=40; G3._debug.cam.pitch=0.45; G3._debug.cam.yaw=0.0;"); await pg.wait_for_timeout(16000); await pg.screenshot(path='w1.png')
            await pg.evaluate("G3._debug.cam.dist=16; G3._debug.cam.pitch=0.1; G3._debug.cam.yaw=0.35;"); await pg.wait_for_timeout(5000); await pg.screenshot(path='w2.png')
            await pg.evaluate("G3._debug.cam.dist=9; G3._debug.cam.pitch=0.1; G3._debug.cam.yaw=Math.PI;"); await pg.wait_for_timeout(5000); await pg.screenshot(path='w3.png')
        else:
            await pg.evaluate("S.tut=0; S.t=(24*27+7)*60; S.boat.status='port'; S.boat.port='finnsnes'; S.boat.pos={...portById('finnsnes').p};")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
            await pg.evaluate("G3._debug.cam.dist=7; G3._debug.cam.pitch=0.12; G3._debug.cam.yaw=0.0;"); await pg.wait_for_timeout(6000); await pg.screenshot(path='w4.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
