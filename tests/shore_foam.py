import os
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700})
        await boot(pg, GAME + '#notut'); await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(async () => { const p = {x:1100.194, y:145.2158}, bt = S.boat; await mapNeed(p, 3); S.t = Math.round((Date.UTC(2026, 9, 12, 9, 12) - EPOCH) / 6e4);
          bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; bt.heading = 220 * Math.PI / 180; const c = G3._debug.cam; c.helm = false; c.dist = 120; c.pitch = 0.9; c.yaw = 3.84; })()""")
        await pg.wait_for_timeout(28000)
        await pg.screenshot(path='shore_cmp/foam_n_%s.png' % os.environ.get('TAG','x') + '', timeout=120000)
        await pg.evaluate("G3._debug.seaDbg = true"); await pg.wait_for_timeout(5000)
        await pg.screenshot(path='shore_cmp/foam_d_%s.png' % os.environ.get('TAG','x') + '', timeout=120000); await b.close()
asyncio.run(main())
