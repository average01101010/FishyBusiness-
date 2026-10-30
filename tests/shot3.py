from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        pg.on('console', lambda m: logs.append(m.type+': '+m.text))
        await pg.goto(GAME)
        await pg.wait_for_timeout(500)
        await pg.click('[data-close]')
        webgl = await pg.evaluate("(()=>{const c=document.createElement('canvas');const g=c.getContext('webgl');return !!g && !!g.getExtension('OES_standard_derivatives')})()")
        print('webgl', webgl)
        await pg.click('#view3d')
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='g1.png')
        print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
