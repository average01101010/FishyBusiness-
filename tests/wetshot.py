"""Wet and precipitation (G6): Bergen's harbour dry and then in rain at summer noon (the ground, the quays and the decks darker and
glossy), the helm view in the rain from a sjark's wheelhouse (drops on its windows), Finnsnes in snowfall in January (snow on the quays and roofs,
flakes) and Bodø in sleet. The weather is held by replacing precipAt and airTemp (the game's own functions). Pictures in
tests/out/wet_*.png; checks the wetness follows the rain, the drops' program is in, no GL errors and no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
# name, lat, lon, month, hour, rain (0-1), °C, helm view
SHOTS = [('bergen_torr', 60.3985, 5.318, 7, 13, 0.0, 14, False), ('bergen_regn', 60.3985, 5.318, 7, 13, 0.75, 12, False),
         ('bergen_ror', 60.3985, 5.318, 7, 13, 0.75, 12, True), ('finnsnes_sno', 69.229, 17.985, 1, 12, 0.6, -4, False),
         ('bodo_sludd', 67.283, 14.38, 3, 12, 0.6, 1.2, False)]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix')
        R = {}; k = 0
        for name, lat, lon, mo, hr, rain, tc, helm in SHOTS:
            k += 1
            await pg.evaluate("""async ([lat, lon, mo, hr, rain, tc, k]) => { window.precipAt = () => rain; window.airTemp = () => tc;
              const q0 = P(lat, lon); await mapNeed(q0, MAPD.simR); let q = q0, bd = 1e9;
              for (const o of PORTS){ const c = o.coast || {x:o.xy[0], y:o.xy[1]}, d = Math.hypot(c.x - q0.x, c.y - q0.y); if (d < bd){ bd = d; q = {x:c.x, y:c.y}; } }
              await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
              b.pos = {x:q.x, y:q.y}; b.heading = 1.2; b.v = 0; S.t = Math.round((Date.UTC(2027, mo - 1, 12, 0) + hr * 3.6e6 - EPOCH) / 6e4) + k; if (!G3.isActive()) G3.show(true); }""", [lat, lon, mo, hr, rain, tc, k])
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
            # the summary of the time away (the clock was moved) is closed
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }"); await pg.wait_for_timeout(1500)
            await pg.evaluate("h => { if (h){ S.boat.type = 'sjark'; applyVessel(); } G3.setHelm(h); if (!h){ const c = G3._debug.cam; c.dist = 45; c.pitch = 0.16; c.yaw = 2.4; } }", helm); await pg.wait_for_timeout(7000)
            await pg.screenshot(path=os.path.join(OUT, f'wet_{name}.png'), timeout=300000); R[name] = await pg.evaluate("G3._debug.wet")
        R['gl'] = await pg.evaluate("G3._debug.glErr()")
        print(json.dumps(R))
        check(R['bergen_torr']['wet'] < 0.05 and R['bergen_regn']['wet'] > 0.8, 'the ground is wet in the rain and dry without', (R['bergen_torr']['wet'], R['bergen_regn']['wet']))
        check(R['bergen_ror']['drops'], 'the drops on the windows are drawn from the helm in the rain')
        check(R['finnsnes_sno']['snowC'] > 0.8 and R['finnsnes_sno']['wet'] < 0.6, 'fresh snow lies on what is built in the snowfall', R['finnsnes_sno'])
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
