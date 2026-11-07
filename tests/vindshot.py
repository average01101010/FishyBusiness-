"""The wind turbines and the power lines over the sea (G7, view3d/17d-vind.js, src/data/vind.json): from the sea off Smøla (the park
on the island's north-west), off Havøygavlen (Finnmark), by Kvitfjell and Raudfjell from the sea west of Kvaløya, and under the
Sognefjord's 4.7 km crossing at Ortnevik, at summer noon and (Smøla) at night with the obstacle lights. Prints the counts, takes a
picture of each (tests/out/vind_*.png) and checks: turbines and spans are drawn, none stands in the sea (wetT, wetM count those on
ground under 0, which the data should not have), no GL errors, no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
# where the boat lies, what the camera looks at, the hour, and what must be drawn there
PLACES = [('smola', 63.47, 7.80, 63.406, 7.919, 13, 'T'), ('smola_natt', 63.47, 7.80, 63.406, 7.919, 23.5, 'T'), ('havoy', 71.06, 24.45, 71.0, 24.6, 13, 'T'),
          ('kvitfjell', 69.62, 17.85, 69.65, 18.0, 13, 'T'), ('sogn', 61.15, 6.88, 61.156, 6.88, 13, 'W')]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix')
        R = {}
        for name, lat, lon, tla, tlo, hr, need in PLACES:
            await pg.evaluate("""async ([lat, lon, hr]) => { const q = P(lat, lon); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
              b.pos = {x:q.x, y:q.y}; b.heading = 0; b.v = 0; S.t = Math.round((Date.UTC(2027, 6, 10, 0) + hr * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }""", [lat, lon, hr])
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(25000)
            await pg.evaluate("([lat, lon, tla, tlo]) => { const q = P(lat, lon), w = P(tla, tlo), c = G3._debug.cam; c.helm = false; c.dist = 60; c.pitch = 0.04; c.yaw = Math.atan2(w.x - q.x, -(w.y - q.y)) - S.boat.heading; }", [lat, lon, tla, tlo]); await pg.wait_for_timeout(8000)
            await pg.screenshot(path=os.path.join(OUT, f'vind_{name}.png'), timeout=300000); r = await pg.evaluate("G3._debug.vind"); r['need'] = need; R[name] = r
        R['gl'] = await pg.evaluate("G3._debug.glErr()")
        print(json.dumps(R))
        for name, *_, need in PLACES:
            r = R[name]; check(r['nT'] > 0 if need == 'T' else r['nW'] > 0, f'{name}: ' + ('turbines' if need == 'T' else 'wires') + ' are drawn', {k: r[k] for k in ('nT', 'nP', 'nH', 'nW')})
            check(r['wetT'] == 0 and r['wetM'] == 0, f'{name}: no turbine or mast on ground under the sea', (r['wetT'], r['wetM']))
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
