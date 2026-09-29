from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':780}, device_scale_factor=2)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(800); await pg.click('[data-close]')
        await pg.evaluate("S.settings.autoOn=false; S.t=(24*80+8)*60; for(let i=0;i<60*30;i++) step(); refreshAll();")
        await pg.click('#phoneBtn'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='r1.png')
        await pg.evaluate("PHONE.open('post')"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='r2.png')
        await pg.evaluate("PHONE.show(false); PHONE.switchVessel('snekke');"); await pg.wait_for_timeout(400)
        await pg.click('#view3d'); await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path='r3.png')
        print(logs[:10]); await b.close()
asyncio.run(main())
