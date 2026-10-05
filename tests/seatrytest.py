"""The sea level the 3D view starts at, learnt from a try that never came back (05.10.2026, view3d.js SEA_TRY): on Windows with Direct3D 11
the full sea has taken the GPU process with it (Intel Iris Xe in Chrome, NVIDIA GTX 980 in Firefox) before the browser said the context was
lost. The level being tried is written down first and cleared when it worked; a load that finds it still there starts a level down.
Prints OK or FEIL per check."""
import asyncio, json
from _env import GAME, boot
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 900, 'height': 600}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        # a try that never came back: the level the last load was trying (0) is still written down
        await pg.goto(GAME.split('#')[0] + '#notut'); await pg.evaluate("localStorage.setItem('dsb_sea_try', '0'); localStorage.removeItem('dsb_sea')")
        await boot(pg, GAME + '#notut'); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        a = await pg.evaluate("({sea:localStorage.getItem('dsb_sea'), tryLeft:localStorage.getItem('dsb_sea_try'), why:G3.failWhy || ''})")
        # a normal load: the mark is set while the sea is made and gone when it worked
        await pg.evaluate("localStorage.removeItem('dsb_sea'); localStorage.removeItem('dsb_sea_try')")
        await pg.reload(); await pg.wait_for_function("typeof G3 !== 'undefined' && G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        b = await pg.evaluate("({sea:localStorage.getItem('dsb_sea'), tryLeft:localStorage.getItem('dsb_sea_try'), why:G3.failWhy || ''})")
        print(json.dumps({'after_crash': a, 'normal': b, 'errs': errs[:3]}))
        print(('OK  ' if a['sea'] == '1' and a['tryLeft'] is None and not a['why'] else 'FEIL') + ' a load after a try that never came back starts the sea a level down, and clears the mark when it works')
        print(('OK  ' if b['sea'] is None and b['tryLeft'] is None and not b['why'] and not errs else 'FEIL') + ' a normal load leaves no mark and keeps the full sea')
        await br.close()
asyncio.run(main())
