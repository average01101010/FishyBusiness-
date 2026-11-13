"""The harbour units against the land (13.11.2026; Jonas, with pictures of Engenes verft from the land side: «sørge for at modellene glir
sømløst inn i omgivelsene uten å lage slike utgravninger og tagger … Det kan godt hende det gjelder andre typer bygg langs kysten også»).
The boat in port at a plant, a yard and a tackle shop (the units, view3d/03-berths-naust.js unitTerr and unitPatch), looked at from above the
land behind them as Jonas did, at summer noon; pictures in tests/out/enhet_<name><KYST_TAG>.png.
Checks: along the unit's back and sides, the ground the 3D view draws (G3._debug.unitEdge) is at the deck's height or rises with the land
behind it, never lower than the deck there (a trench by the wall where the sea shows), no GL errors and no page errors.
Needs the whole coast (dist-vec). KYST_DIST=<dir> takes another build (for a picture of before). 3D, alone."""
import asyncio, json, os
from playwright.async_api import async_playwright
ROOT0 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT0, 'dist-vec'))
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
TAG = os.environ.get('KYST_TAG', '')
# [file name, how the harbour is found (its name), the camera's yaw from behind the unit]
SHOTS = [('engenes', 'Engenes verft'), ('alesund', 'Ålesund'), ('vanse', 'Vanse utstyrsbutikk'), ('bodo', 'Bodø')]
ONLY = [s for s in os.environ.get('KYST_ENHET', '').split(',') if s]

GO = """async ([name, k]) => { const pt = PORTS.find(q => q.name === name) || PORTS.find(q => q.name.startsWith(name) && UNITS[q.id]); if (!pt) return null;
  await mapNeed(pt.p, MAPD.simR); const b = S.boat; S.plan = null; S.draft = []; b.status = 'port'; b.port = pt.id; b.berth = 'main'; b.v = 0; b.pos = {x:pt.p.x, y:pt.p.y};
  if (typeof BERTHPOSE_RESET === 'function') BERTHPOSE_RESET();
  S.t = Math.round((Date.UTC(2027, 6, 14, 0) + 13 * 3.6e6 - EPOCH) / 6e4) + k; WX_FORCE = {w:2, d:200}; if (!G3.isActive()) G3.show(true);
  return {id:pt.id, name:pt.name, y:!!UNITS[pt.id].y}; }"""
# the camera above the land behind the unit, looking down at it over its back (the unit's n points out to sea; the boat lies off its face)
CAM = """([id, dist, pitch]) => { const U = UNITS[id], c = G3._debug.cam, hd = G3._debug.bv.head || 0;
  c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = Math.atan2(U.n[0], -U.n[1]) - hd; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix#glchk')
        R = {}; k = 0
        for name, pname in SHOTS:
            if ONLY and name not in ONLY: continue
            k += 1
            r = await pg.evaluate(GO, [pname, k])
            if not r: print('FEIL', name, 'not found'); continue
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
            # over the land behind it, near from the land side, and straight down (Jonas 13.11.2026: «ta bilde rett ovenfra og ned så ser du det
            # med en gang»)
            for suf, d, pt in (('', 150 if r['y'] else 110, 0.85), ('_naer', 70, 0.45), ('_topp', 170 if r['y'] else 120, 1.5)):
                await pg.evaluate(CAM, [r['id'], d, pt]); await pg.wait_for_timeout(9000)
                await pg.screenshot(path=os.path.join(OUT, f'enhet_{name}{suf}{TAG}.png'), timeout=300000)
            e = await pg.evaluate("id => G3._debug.unitEdge ? G3._debug.unitEdge(id) : null", r['id'])
            R[name] = dict(r, edge=e)
        R['gl'] = await pg.evaluate("G3._debug.glErr()"); R['glFirst'] = await pg.evaluate("G3._debug.glFirst")
        print(json.dumps(R, ensure_ascii=False))
        for name, _ in SHOTS:
            if name not in R: continue
            e = R[name]['edge']
            check(e is not None and e['low'] == 0, f'{name}: the ground along the back and the sides is not below the deck (no trench where the sea shows)', e and {k2: e[k2] for k2 in ('n', 'low', 'min')})
        check(R['gl'] == 0 and not R['glFirst'], 'no GL errors', (R['gl'], R['glFirst']))
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
