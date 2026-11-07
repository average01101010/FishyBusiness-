"""#61: the same place from above, two builds: python3 shore_top.py <prefix> (KYST_DIST picks the build). Havøysund, low water, the boat 300 m off the land."""
from _env import GAME, boot
import asyncio, sys
from playwright.async_api import async_playwright
PRE = sys.argv[1]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        await pg.evaluate("""(async () => { const p = {x:1100.194, y:145.2158}, bt = S.boat; await mapNeed(p, 3); S.t = Math.round((Date.UTC(2026, 9, 12, 9, 12) - EPOCH) / 6e4);
          bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; bt.heading = 220 * Math.PI / 180; })()""")
        await pg.wait_for_timeout(25000)
        for i, (dist, pitch, yaw) in enumerate(((700, 1.25, 3.84), (350, 1.0, 3.84), (180, 0.5, 3.84))):
            await pg.evaluate("([d, pi, y]) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = pi; c.yaw = y; c.zoom = 1; }", [dist, pitch, yaw]); await pg.wait_for_timeout(9000)
            await pg.screenshot(path='shore_cmp/top_%s_%d.png' % (PRE, i), timeout=120000)
        # the foam alone (the sea shader's debug picture: white = foam)
        await pg.evaluate("([d, pi, y]) => { const c = G3._debug.cam; c.dist = d; c.pitch = pi; c.yaw = y; G3._debug.seaDbg = true; }", [350, 1.0, 3.84]); await pg.wait_for_timeout(8000)
        await pg.screenshot(path='shore_cmp/top_%s_foam.png' % PRE, timeout=120000)
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
