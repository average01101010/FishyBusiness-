"""The waterline (G10): the small-boat harbours (view3d/17g-marina.js, src/data/marina.json) at Kristiansand, Bergen, Bodø and
Hammerfest, and the quays with their wall bands and fittings and the timber piers on piles (05-quays-breakwaters.js pierInto,
quayFit) there and at Finnsnes, and the beaches and shingle (17h-shore.js, tools/map/shore.py), summer noon. The boat lies on the water nearest each marina's middle; pictures in tests/out/havn_*.png.
Checks: small boats lie moored at each marina, no GL errors, no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
SHOTS = [('kristiansand', 58.14098, 7.99883, True), ('bergen', 60.38238, 5.32396, True), ('bodo', 67.28278, 14.36934, True), ('hammerfest', 70.6633, 23.68443, True), ('finnsnes', 69.229, 17.985, False)]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix#glchk')
        R = {}; k = 0
        for name, lat, lon, mar in SHOTS:
            k += 1
            await pg.evaluate("""async ([lat, lon, k]) => { const q0 = P(lat, lon); await mapNeed(q0, MAPD.simR); let q = q0;
              // the nearest water, out in rings of 15 m
              outer: for (let r = 0; r < 400; r += 15) for (let a = 0; a < 6.28; a += 0.4){ const c = {x:q0.x + Math.cos(a) * r / 1000, y:q0.y + Math.sin(a) * r / 1000}; if (!isLand(c) && depthF(c) > 2){ q = c; break outer; } }
              const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.pos = {x:q.x, y:q.y}; b.heading = 0; b.v = 0;
              S.t = Math.round((Date.UTC(2027, 6, 14, 0) + 13 * 3.6e6 - EPOCH) / 6e4) + k; if (!G3.isActive()) G3.show(true); }""", [lat, lon, k])
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
            await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.dist = 70; c.pitch = 0.3; c.yaw = 2.3; }"); await pg.wait_for_timeout(8000)
            await pg.screenshot(path=os.path.join(OUT, f'havn_{name}.png'), timeout=300000); R[name] = await pg.evaluate("G3._debug.marina"); R[name]['shore'] = await pg.evaluate("G3._debug.shore")
        R['gl'] = await pg.evaluate("G3._debug.glErr()"); R['glFirst'] = await pg.evaluate("G3._debug.glFirst")
        print(json.dumps(R))
        for name, *_, mar in SHOTS:
            if mar: check(R[name]['n'] > 0, f'{name}: small boats moored in the marina', R[name])
        check(R['bergen']['shore']['meshes'] > 0, 'the beaches and the shingle lie on the shore at Bergen (needs the shore entry in the packs)', R['bergen']['shore'])
        check(R['gl'] == 0 and not R['glFirst'], 'no GL errors', (R['gl'], R['glFirst']))
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
