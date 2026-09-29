from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':420,'height':560})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        await pg.evaluate("S.tut=0; S.t=Math.round((Date.UTC(2028,2,6,12)-EPOCH)/6e4); S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.haill={type:'luksus', t0:S.t}")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        await pg.evaluate("G3._debug.cam.helm=false; G3._debug.cam.dist=2.4; G3._debug.cam.pitch=0.3; G3._debug.cam.yaw=Math.PI;"); await pg.wait_for_timeout(4000); await pg.screenshot(path='c1.png')
        await pg.evaluate("S.haill={type:'kveit', t0:S.t}"); await pg.wait_for_timeout(3000); await pg.screenshot(path='c2.png')
        await pg.evaluate("PHONE.open('haill')"); await pg.wait_for_timeout(600); await pg.screenshot(path='c3.png')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
