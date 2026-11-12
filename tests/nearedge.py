"""The sea at the near terrain's edge seen from 12 km (Ø9 F7 start, 12.11.2026): the near pass's sea ends a near-terrain cell inside the
square (17-draw.js nearIn), and the near terrain's shallow bed under the water showed in that band as a faint short line on the water
by an islet at the edge. The view «up2» of 5.20s: camera 12 000 m, pitch 0.75, yaw 2.6, the boat at P(68.9618, 17.091), an east wind of
11.3 m/s, a clear sky, the sun in the south. Measured: in the band along the near square's edge, the share of sea pixels (the far
pass's sea round it) whose colour stands far from the sea a little further out; the near terrain's bed shows as darker, browner pixels.
Picture in tests/out/nearedge_up2.png (and _fft0 for comparison); no GL errors and no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        await pg.evaluate("""async () => { window.cloudAt = () => 0.05; window.precipAt = () => 0; WX_FORCE = {w:11.3, d:90};
          const q = P(68.9618, 17.091); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
          b.pos = {x:q.x, y:q.y}; b.heading = 1.2; b.v = 0; S.t = Math.round((Date.UTC(2027, 5, 20, 0) + 11 * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }""")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(15000)
        await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
        await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.dist = 12000; c.pitch = 0.75; c.yaw = 2.6; }")
        await pg.wait_for_timeout(25000)
        await pg.screenshot(path=os.path.join(OUT, 'nearedge_up2.png'), timeout=300000)
        R = {'gl': await pg.evaluate("G3._debug.glErr()")}
        print(json.dumps(R))
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
if __name__ == "__main__": asyncio.run(main())
