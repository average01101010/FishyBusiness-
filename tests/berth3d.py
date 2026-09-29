from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':620})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        H = await pg.evaluate("""(()=>{ for (let d = 0; d < 120; d++){ const H = (Date.UTC(2027, 3, 1 + d, 12) - EPOCH) / 36e5; if (fleetState(0, H).st === 'port') return H; } return null; })()""")
        print('daytime with Havørn in port:', H)
        await pg.evaluate(f"S.tut=0; S.t = Math.round({H} * 60); S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={{...portById('husoy').p}};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        await pg.evaluate("G3._debug.cam.helm=false; G3._debug.cam.dist=55; G3._debug.cam.pitch=0.7; G3._debug.cam.yaw=0.5;"); await pg.wait_for_timeout(6000); await pg.screenshot(path='b2.png')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
