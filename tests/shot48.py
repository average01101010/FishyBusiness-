from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':700}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e))); pg.on('console', lambda m: logs.append(m.text) if ('WebGL' in m.text or 'rror' in m.text) else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*27+6)*60; S.boat.status='fishing'; S.boat.port=null; S.boat.pos={...GROUNDS[0].p}; S.boat.fishUntil=S.t+600; S.boat.gear=true; S.hold=[{sp:'torsk',kg:40,fresh:1,t:S.t},{sp:'sei',kg:22,fresh:1,t:S.t},{sp:'hyse',kg:12,fresh:1,t:S.t}];")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        await pg.evaluate("renderActs()"); await pg.wait_for_timeout(300)
        print('rod button:', await pg.evaluate("!!document.querySelector('#actbar [data-act=rod]')"))
        await pg.click('#actbar [data-act=rod]'); await pg.wait_for_timeout(5000)
        await pg.screenshot(path='r1.png')
        await pg.evaluate("ROD._strike()"); await pg.wait_for_timeout(300)
        print('state after strike:', await pg.evaluate("ROD.state().st"))
        await pg.evaluate("window.dispatchEvent(new Event('pointerup'))"); await pg.evaluate("ROD._prog(0.9)"); await pg.dispatch_event('#rodUI .rod-btn', 'pointerdown'); await pg.wait_for_timeout(1200)
        await pg.evaluate("G3._debug.cam.dist=6; G3._debug.cam.pitch=0.25; G3._debug.cam.yaw=-0.9;"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='r3.png')
        st = await pg.evaluate("JSON.stringify(ROD.state())"); print('fight:', st[:160])
        await pg.wait_for_timeout(5000); await pg.evaluate("window.dispatchEvent(new Event('pointerup'))")
        print('after:', await pg.evaluate("JSON.stringify({st:ROD.state().st, n:S.rodN, best:S.rodBest, hold:Math.round(holdTotal())})"))
        await pg.evaluate("G3._debug.cam.dist=5; G3._debug.cam.pitch=0.7; G3._debug.cam.yaw=3.1;"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path='r4.png')
        print(logs[:6]); await b.close()
asyncio.run(main())
