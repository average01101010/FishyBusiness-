"""The sun's light at a point (04.11.2026): the land's shadow on what stands on it (the grid SG round the boat, sunV in the shaders) and
the clouds' shadows drifting over land and sea (cloudV). At Fjordgård in the Ørnfjord on Senja on an autumn evening with a low sun: the
grid is worked out round the boat and has cells both in shadow and in sun; the boat, the quays, the houses and the sea in the fell's
shadow are then dark with the ground under them (picture with the grid and without it); and at midday under a broken sky the
clouds' shadows lie on the land and the sea. Pictures in tests/out/sun_*.png; no GL errors and no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

async def place(pg, lat, lon, mo, day, hr, cloud, k):
    await pg.evaluate("""async ([lat, lon, mo, day, hr, cloud, k]) => { window.cloudAt = () => cloud; window.precipAt = () => 0;
      const q0 = P(lat, lon); await mapNeed(q0, MAPD.simR); let q = q0, bd = 1e9;
      for (const o of PORTS){ const c = o.coast || {x:o.xy[0], y:o.xy[1]}, d = Math.hypot(c.x - q0.x, c.y - q0.y); if (d < bd){ bd = d; q = {x:c.x, y:c.y}; } }
      await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
      b.pos = {x:q.x, y:q.y}; b.heading = 1.2; b.v = 0; S.t = Math.round((Date.UTC(2027, mo - 1, day, 0) + hr * 3.6e6 - EPOCH) / 6e4) + k; if (!G3.isActive()) G3.show(true); }""",
      [lat, lon, mo, day, hr, cloud, k])
    await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(15000)
    await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix')
        R = {}
        # the software GPU draws a few frames a second, so the grid gets more time a frame than on a device
        await pg.evaluate("() => { G3._debug.sunW.ms[2] = 150; }")
        # an autumn evening, the sun low in the west-south-west (UTC hours), a clear sky
        await place(pg, 69.555, 17.68, 9, 20, 15.6, 0.0, 1)
        await pg.wait_for_function("G3._debug.sun.on && !G3._debug.sun.job", timeout=300000)
        R['grid'] = await pg.evaluate("""(() => { const g = G3._debug.sun, a = g.a; let dark = 0, lit = 0; for (const v of a){ if (v < 40) dark++; else if (v > 215) lit++; }
          return {n:a.length, dark:dark / a.length, lit:lit / a.length, span:g.span}; })()""")
        await pg.evaluate("() => { const c = G3._debug.cam; c.dist = 140; c.pitch = 0.22; c.yaw = 0.6; }"); await pg.wait_for_timeout(6000)
        await pg.screenshot(path=os.path.join(OUT, 'sun_kveld.png'), timeout=300000)
        await pg.evaluate("() => { G3._debug.sun.on = false; }"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=os.path.join(OUT, 'sun_kveld_uten.png'), timeout=300000)
        await pg.evaluate("() => { G3._debug.sun.on = true; }")
        # midday under a broken sky: the clouds' shadows
        await place(pg, 69.555, 17.68, 7, 10, 11.0, 0.45, 2)
        await pg.evaluate("() => { const c = G3._debug.cam; c.dist = 600; c.pitch = 0.35; c.yaw = 0.6; }"); await pg.wait_for_timeout(8000)
        await pg.screenshot(path=os.path.join(OUT, 'sun_skyer.png'), timeout=300000)
        R['gl'] = await pg.evaluate("G3._debug.glErr()")
        print(json.dumps(R))
        g = R['grid']
        check(g['dark'] > 0.03 and g['lit'] > 0.2, 'the shadow grid round the boat has both shadow and sun on an evening in the Ørnfjord', g)
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
if __name__ == "__main__": asyncio.run(main())
