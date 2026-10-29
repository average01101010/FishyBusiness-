"""The trees from the map (G4, view3d/17c-trees.js): off Finnsnes in summer the birch woods on the slopes are instances of the Blender
models (src/data/trees.b64) from the trees layer, drawn with no GL errors; a picture low and one from above (tests/out/tree_*.png).
Needs the trees layer in the build (a map release with it, or tools/s2/inject.py for the tile). Prints OK or FEIL per check."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix')
        await pg.evaluate("""async () => { const q = P(69.226, 17.96); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
          b.pos = {x:q.x, y:q.y}; b.heading = 1.8; b.v = 0; S.t = Math.round((Date.UTC(2027, 6, 10, 0) + 13 * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }""")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(30000)
        R = {}
        for name, dist, pitch in (('low', 150, 0.12), ('high', 700, 0.5)):
            await pg.evaluate("([d, p]) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = p; c.yaw = -1.2; }", [dist, pitch]); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=os.path.join(OUT, f'tree_{name}.png')); R[name] = await pg.evaluate("G3._debug.trees")
        R['gl'] = await pg.evaluate("G3._debug.glErr()")
        print(json.dumps(R))
        check(R['high']['M'] and R['high']['P'], 'the tree models and their program are in')
        check(R['high']['n'] > 1000, 'over a thousand trees are drawn off Finnsnes', R['high']['n'])
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
