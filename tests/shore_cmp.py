"""#61 before/after: the same places, tides and views from two builds (KYST_DIST), pictures shore_cmp/<prefix>_<place>_<tide>_<view>.png.
Usage: KYST_DIST=/tmp/dist_before python3 shore_cmp.py before [places]"""
from _env import GAME, boot
import asyncio, json, sys, os
from playwright.async_api import async_playwright

PLACES = {'husoy':(69.5445, 17.6690), 'havoy':(71.0123, 24.6470), 'tromso':(69.65, 18.96), 'bergen':(60.39, 5.32), 'bodo':(67.28, 14.40), 'hammerfest':(70.66, 23.68), 'batsfjord':(70.63, 29.73)}
PRE = sys.argv[1] if len(sys.argv) > 1 else 'x'
SEL = sys.argv[2].split(',') if len(sys.argv) > 2 else list(PLACES)
os.makedirs('shore_cmp', exist_ok=True)

SETUP = """(async ([ll, tide]) => { const t = P(ll[0], ll[1]); let best = null, bd = 1e9; for (const q of PORTS) { if (!q.coastal) continue; const d = Math.hypot(q.p.x - t.x, q.p.y - t.y); if (d < bd) { bd = d; best = q; } }
  const q = best, bt = S.boat; await mapNeed(q.p, 3);
  // daylight: the first low (or high) water between 08 and 15 UTC in the next week
  const H0 = Math.round((Date.UTC(2026, 9, 12, 0) - EPOCH) / 6e4) / 60; let hit = null;
  for (const e of tideEvents(H0, 168, q.p)){ if (e.kind !== tide) continue; const hh = (((e.t - H0) % 24) + 24) % 24; if (hh >= 8 && hh <= 15){ hit = e; break; } }
  S.t = Math.round((hit ? hit.t : H0 + 10) * 60);
  bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:q.p.x, y:q.p.y};
  await new Promise(r => setTimeout(r, 5000));
  // open water 150-450 m off land, the boat turned to the land
  const T = G3._debug.terrH, X = q.p.x * 1000, Z = q.p.y * 1000; let pick = null;
  for (const r of [200, 300, 400, 500, 600]) for (let a = 0; a < 360; a += 15){ const px = X + Math.sin(a * Math.PI / 180) * r, pz = Z - Math.cos(a * Math.PI / 180) * r; if (!(T(px, pz) < -2)) continue;
    for (let h = 0; h < 360; h += 10){ const s = Math.sin(h * Math.PI / 180), c = -Math.cos(h * Math.PI / 180); let d0 = null;
      for (let d = 60; d <= 700; d += 20){ if (T(px + s * d, pz + c * d) > 1.0){ d0 = d; break; } }
      if (d0 && d0 >= 150 && d0 <= 450 && (!pick || Math.abs(d0 - 300) < Math.abs(pick.d - 300))) pick = {px, pz, h, d:d0}; } }
  if (!pick) pick = {px:X, pz:Z, h:0, d:0};
  bt.pos = {x:pick.px / 1000, y:pick.pz / 1000}; bt.heading = pick.h * Math.PI / 180; const c = G3._debug.cam; c.helm = true; c.yaw = 0; c.pitch = 0.04; c.zoom = 1;
  return {id:q.id, pick, tide:G3._debug.env.tide, when:hit ? new Date(EPOCH + Math.round(hit.t * 60) * 6e4).toISOString() : null}; })"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        for key in SEL:
            for tide in ('low', 'high'):
                info = await pg.evaluate(SETUP + "(arguments[0])" if False else "f => f", None) if False else None
                info = await pg.evaluate("(a) => (" + SETUP + ")(a)", [list(PLACES[key]), tide])
                print(key, tide, json.dumps(info)); await pg.wait_for_timeout(22000)
                for i, (dy, z) in enumerate(((0, 1), (0.45, 1), (-0.45, 1), (0, 3))):
                    await pg.evaluate("([dy, z]) => { const c = G3._debug.cam; c.helm = true; c.yaw = dy; c.zoom = z; c.pitch = 0.04; }", [dy, z]); await pg.wait_for_timeout(3500)
                    await pg.screenshot(path='shore_cmp/%s_%s_%s_%d.png' % (PRE, key, tide, i), timeout=120000)
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
