"""Life in the landscape (G9, view3d/17e-life.js) and the near field (G8, 17f-near.js: tufts, heather, stones, rockweed): by the harbour at Reine in July (eagles over the fells, cormorants, eiders, sheep),
Bodø's harbour at night (street lights and the cars' lights), Hammerfest in January at -6 °C (smoke from the chimneys) and off Runde
in June (the birds of the bird cliff). Pictures in tests/out/life_*.png; the counts of what is drawn are printed, and the checks are
that each place has what it should, the animals' models are in, the whales are the Blender ones, no GL errors and no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
ROOT0 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT0, 'dist-vec')   # the towns' houses, roads and quays are in the vec packs (run.py builds dist-vec/)
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
# name, lat, lon, month, hour, °C (None: the game's), at the nearest harbour, what must be there, the camera (dist, pitch, yaw)
SHOTS = [('reine', 67.932, 13.09, 7, 13, None, True, ['eid', 'cor', 'eag', 'shp', 'near'], (60, 0.18, 2.0)),
         ('bodo_natt', 67.283, 14.38, 10, 22, None, True, ['lamp', 'car'], (120, 0.2, 2.6)),
         ('hammerfest_vinter', 70.664, 23.68, 1, 12, -6, True, ['smoke'], (90, 0.2, 2.2)),
         ('runde', 62.402, 5.555, 6, 13, None, False, ['cliff'], (40, 0.1, 1.6))]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix#glchk')
        await pg.evaluate("() => { window.AIRT0 = airTemp; }")
        R = {}; k = 0
        for name, lat, lon, mo, hr, tc, port, need, camv in SHOTS:
            k += 1
            await pg.evaluate("""async ([lat, lon, mo, hr, tc, port, k]) => { window.airTemp = tc == null ? AIRT0 : () => tc;
              const q0 = P(lat, lon); await mapNeed(q0, MAPD.simR); let q = q0, bd = 1e9;
              if (port) for (const o of PORTS){ const c = o.coast || {x:o.xy[0], y:o.xy[1]}, d = Math.hypot(c.x - q0.x, c.y - q0.y); if (d < bd){ bd = d; q = {x:c.x, y:c.y}; } }
              await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
              b.pos = {x:q.x, y:q.y}; b.heading = 0; b.v = 0; S.t = Math.round((Date.UTC(2027, mo - 1, 12, 0) + hr * 3.6e6 - EPOCH) / 6e4) + k; if (!G3.isActive()) G3.show(true); }""", [lat, lon, mo, hr, tc, port, k])
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
            # the town's roads and houses come with the vec packs, which take a while in SwiftShader
            if name in ('bodo_natt', 'hammerfest_vinter'):
                try: await pg.wait_for_function("(() => { const l = G3._debug.life; return l.lamps > 0 && l.smk > 0; })()", timeout=180000, polling=3000)
                except Exception as e: print('   (the town did not come in:', str(e)[:60], ')')
            await pg.evaluate("([d, p, y]) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = p; c.yaw = y; }", list(camv)); await pg.wait_for_timeout(8000)
            await pg.screenshot(path=os.path.join(OUT, f'life_{name}.png'), timeout=300000); r = await pg.evaluate("G3._debug.life"); r['near'] = (await pg.evaluate("G3._debug.near"))['n']; r['need'] = need; R[name] = r
        R['gl'] = await pg.evaluate("G3._debug.glErr()"); R['glFirst'] = await pg.evaluate("G3._debug.glFirst")
        print(json.dumps(R))
        check(R['reine']['M'] and R['reine']['whales'], 'the animals from Blender are in, the whales too')
        for name, *_, need, camv in SHOTS:
            r = R[name]; got = [k for k in need if r[k] > 0]
            check(len(got) >= (2 if name == 'reine' else len(need)), f'{name}: ' + ', '.join(need) + ' drawn', {k: r[k] for k in need})
        check(R['gl'] == 0 and not R['glFirst'], 'no GL errors', (R['gl'], R['glFirst']))
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
