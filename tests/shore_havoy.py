"""#61 reproduction from Jonas's clip (12.10.2026): Havøysund 71°00.358'N 024°40.012'E, heading 274°, the bridge view with binoculars 1x, 3x, 8x."""
from _env import GAME, boot
import asyncio, json, sys
from playwright.async_api import async_playwright

import os
OUTP = os.environ.get('OUTP', '')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        info = await pg.evaluate("""(async () => { const p = P(71.01233, 24.64703), bt = S.boat; await mapNeed(p, 3);
          S.t = Math.round((Date.UTC(2026, 9, 12, 9, 30) - EPOCH) / 6e4); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; bt.heading = 190 * Math.PI / 180;
          const c = G3._debug.cam; c.helm = true; c.yaw = 0; c.pitch = 0.02; c.zoom = 1; return {x:p.x, y:p.y, heading:bt.heading, tide:G3._debug.env.tide}; })()""")
        print(json.dumps(info))
        await pg.wait_for_timeout(25000)
        for z in (3, 6):
            await pg.evaluate("z => { const c = G3._debug.cam; c.zoom = z; c.helm = true; }", z)
            await pg.wait_for_timeout(4000)
            await pg.screenshot(path=OUTP + 'havoy_z%d.png' % z, timeout=120000)
        # also from a few yaws (the user: try several angles)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.zoom = 3; })()")
        for i, yaw in enumerate((-0.5, 0.5, 1.0)):
            await pg.evaluate("y => { const c = G3._debug.cam; c.yaw = y; }", yaw); await pg.wait_for_timeout(3500)
            await pg.screenshot(path=OUTP + 'havoy_yaw%d.png' % i, timeout=120000)
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
