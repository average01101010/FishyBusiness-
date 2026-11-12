"""Ø13 K3 (steg 33d): the sea marks after IALA region A, in 3D and in the chart plotter, at one cardinal mark of each quadrant, a
lateral mark and an isolated danger buoy, in both formats (800x1280 and 1280x800). Summer noon. The marks are picked from the coast's
chart packs in this build (all read), the nearest to a few places along the coast, and written to tests/out/merkeshot.json; a second
run with KYST_MERKER=tests/out/merkeshot.json (the build before, KYST_DIST) shoots the same places. Pictures in
tests/out/merke_<format>_<what>_{3d,kart}.png. Checks: no GL errors, no page errors."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
TAG = os.environ.get('KYST_MERKE_TAG', 'etter')
# what to look for, near which place (lat, lon): the kinds of mark and the places of the stikkprøver where the data has them
WANT = [('nord', 69.65, 18.96), ('ost', 67.28, 14.37), ('sor', 60.39, 5.32), ('vest', 58.14, 8.0), ('lateral', 70.66, 23.68), ('isolert', 69.65, 18.96)]
# (the page's CSP has no unsafe-eval, so the kinds are named here and matched in the page)
FORMATS = [('staaende', 800, 1280), ('liggende', 1280, 800)]
if os.environ.get('KYST_MERKE_ONLY'):   # one kind in one format, to look at the framing
    WANT = [w for w in WANT if w[0] == os.environ['KYST_MERKE_ONLY']]; FORMATS = FORMATS[1:]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        picks = json.load(open(os.environ['KYST_MERKER'])) if os.environ.get('KYST_MERKER') else None
        errs = []
        for fname, W, H in FORMATS:
            pg = await (await b.new_context(viewport={'width': W, 'height': H})).new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + '#notut#qfix')
            if picks is None:
                picks = await pg.evaluate("""async (want) => { await mapLoadKind('chart');
                  for (const pk of MAPD.packs.filter(p => p.kind === 'chart')) for (const t of pk.tiles || [pk.tile]){ const q = MAPD.byTile.get('chart:' + t[0] + ':' + t[1]); if (q){ await mapLoad(q); marksAdd(q); } }
                  const all = [...MARKS.tiles.values()].filter(Boolean).flatMap(t => t.marks), out = {};
                  const KIND = {nord:m => m[2] === 'C' && m[3] === 'north', ost:m => m[2] === 'C' && m[3] === 'east', sor:m => m[2] === 'C' && m[3] === 'south', vest:m => m[2] === 'C' && m[3] === 'west', lateral:m => m[2] === 'B' && m[3] === 'port', isolert:m => m[2] === 'I'};
                  for (const [k, lat, lon] of want){ const q = P(lat, lon), ok = KIND[k]; let best = null, bd = 1e9;
                    for (const m of all) if (ok(m)){ const d = Math.hypot(m[0] - q.x, m[1] - q.y); if (d < bd){ bd = d; best = m; } }
                    out[k] = best && {mk:best.slice(), km:+bd.toFixed(1)}; }
                  return out; }""", WANT)
                json.dump(picks, open(os.path.join(OUT, 'merkeshot.json'), 'w'))
            for k, *_ in WANT:
                pk = picks.get(k)
                if not pk: check(False, f'{k}: a mark of the kind in the data'); continue
                mk = pk['mk']
                # the boat on the water 20 m or more from the mark, heading for it; the camera behind the boat and to one side, so the mark stands
                # beside the boat in the picture and not behind it
                await pg.evaluate("""async (mk) => { const q0 = {x:mk[0], y:mk[1]}; await mapNeed(q0, MAPD.simR); let q = null;
                  for (const r of [0.02, 0.028, 0.04, 0.06, 0.09]){ for (let a = 0; a < 6.28 && !q; a += 0.26){ const c = {x:q0.x + Math.cos(a) * r, y:q0.y + Math.sin(a) * r}; if (!isLand(c) && depthF(c) > 2) q = c; } if (q) break; }
                  q = q || {x:q0.x, y:q0.y + 0.06};
                  const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.pos = {x:q.x, y:q.y}; b.v = 0;
                  b.heading = Math.atan2(q0.x - q.x, -(q0.y - q.y)) * 180 / Math.PI;
                  S.t = Math.round((Date.UTC(2027, 6, 14, 0) + 12.5 * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }""", mk)
                await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(15000)
                await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
                await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.dist = 10; c.pitch = 0.1; c.yaw = 0.55; }"); await pg.wait_for_timeout(6000)
                await pg.screenshot(path=os.path.join(OUT, f'merke_{TAG}_{fname}_{k}_3d.png'), timeout=300000)
                # the chart plotter on the mark, about 600 m across
                await pg.evaluate("openPlotter()"); await pg.wait_for_timeout(2000)
                await pg.evaluate("""async (mk) => { view.cx = mk[0]; view.cy = mk[1]; view.z = MAP_H / 0.6; applyView(); scheduleStatic(); renderDyn(); await new Promise(r => setTimeout(r, 2500)); }""", mk)
                await pg.screenshot(path=os.path.join(OUT, f'merke_{TAG}_{fname}_{k}_kart.png'), timeout=300000)
                await pg.evaluate("() => { const c = document.getElementById('plotClose'); if (c && !c.hidden) c.click(); }"); await pg.wait_for_timeout(1500)
            gl = await pg.evaluate("G3._debug.glErr()")
            check(gl == 0, f'{fname}: no GL errors', gl)
            await pg.context.close()
        print(json.dumps(picks))
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
