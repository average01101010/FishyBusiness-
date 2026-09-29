from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def run(w,h,tag):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=(2 if w<600 else 1))
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type=='error' else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{tag}_0.png')
        await pg.click('[data-close]')
        await pg.evaluate("S.settings.autoOn=false; S.t=(24*21+0.3)*60;")
        await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.wait_for_timeout(3500)
        await pg.screenshot(path=f'{tag}_1.png')
        await pg.click('#gps'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{tag}_2.png')
        await pg.click('#plotClose'); await pg.wait_for_timeout(2500)
        await pg.click('#camBtn'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{tag}_3.png')
        await pg.click('#phoneFab'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{tag}_4.png')
        await pg.evaluate("PHONE.open('innst')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{tag}_5.png')
        print(tag, logs[:8])
        await b.close()
async def main():
    await run(390,844,'ph'); await run(1180,820,'tab')
asyncio.run(main())
