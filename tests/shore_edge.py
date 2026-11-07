"""#61: the shore close up, from above and from a kilometre, at low and high water, at places along the coast, from one build:
TAG=<prefix> [KYST_DIST=<build>] python3 shore_edge.py [places]   -> shore_cmp/edge_<prefix>_<place>_<tide>_<shot>.png
The boat is put in open water off the land (40-90 m for the close shots, 700-900 m for the far one, where the near terrain alone is
drawn) turned towards it; the camera orbits behind the boat (cam.yaw 0 = looking along the heading). 'foam' is the sea shader's debug
picture of the top view (white = surf). Prints a line per place and tide with the tide (m above mean sea level) and the picks."""
from _env import GAME, boot
import asyncio, json, sys, os
from playwright.async_api import async_playwright

PLACES = {'havoy':{'ll':(71.0123, 24.6470)}, 'husoy':{'ll':(69.5445, 17.6690)}, 'vangshamn':{'id':'vangshamn'}, 'tromso':{'ll':(69.65, 18.96)},
          'bergen':{'ll':(60.39, 5.32)}, 'bodo':{'ll':(67.28, 14.40)}, 'hammerfest':{'ll':(70.66, 23.68)}, 'batsfjord':{'ll':(70.63, 29.73)}}
TAG = os.environ.get('TAG', 'x')
SEL = sys.argv[1].split(',') if len(sys.argv) > 1 else ['havoy', 'husoy', 'vangshamn', 'tromso', 'bergen', 'bodo']
os.makedirs('shore_cmp', exist_ok=True)

# the place's port (the nearest coastal receiver, or the port by id), the tide's first low or high water in daylight within a week
SETUP = """(async ([spec, tide]) => { let q = null;
  if (spec.id) q = PORTS.find(x => x.id === spec.id); else { const t = P(spec.ll[0], spec.ll[1]); let bd = 1e9; for (const x of PORTS){ if (!x.coastal) continue; const d = Math.hypot(x.p.x - t.x, x.p.y - t.y); if (d < bd){ bd = d; q = x; } } }
  const bt = S.boat; await mapNeed(q.p, 3);
  const H0 = Math.round((Date.UTC(2026, 9, 12, 0) - EPOCH) / 6e4) / 60; let hit = null;
  for (const e of tideEvents(H0, 168, q.p)){ if (e.kind !== tide) continue; const hh = (((e.t - H0) % 24) + 24) % 24; if (hh >= 8 && hh <= 15){ hit = e; break; } }
  S.t = Math.round((hit ? hit.t : H0 + 10) * 60);
  bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:q.p.x, y:q.p.y};
  await new Promise(r => setTimeout(r, 4000));
  return {id:q.id, p:q.p, when:hit ? new Date(EPOCH + Math.round(hit.t * 60) * 6e4).toISOString() : null}; })"""
# open water rMin-rMax m from the port with land dMin-dMax m ahead along some heading; the boat put there, turned to the land
PICK = """(([p, rMin, rMax, dMin, dMax]) => { const T = G3._debug.terrH, X = p.x * 1000, Z = p.y * 1000; let pick = null;
  for (let r = rMin; r <= rMax; r += 50) for (let a = 0; a < 360; a += 12){ const px = X + Math.sin(a * Math.PI / 180) * r, pz = Z - Math.cos(a * Math.PI / 180) * r; if (!(T(px, pz) < -2.5)) continue;
    for (let h = 0; h < 360; h += 8){ const s = Math.sin(h * Math.PI / 180), c = -Math.cos(h * Math.PI / 180); let d0 = null, ok = true;
      for (let d = 10; d <= dMax + 20; d += 5){ const hh = T(px + s * d, pz + c * d); if (hh > 1.0){ d0 = d; break; } if (d < dMin - 10 && hh > -1.5) { ok = false; break; } }
      if (ok && d0 && d0 >= dMin && d0 <= dMax && (!pick || Math.abs(d0 - (dMin + dMax) / 2) < Math.abs(pick.d - (dMin + dMax) / 2))) pick = {px, pz, h, d:d0}; } }
  if (!pick) return null;
  const bt = S.boat; bt.pos = {x:pick.px / 1000, y:pick.pz / 1000}; bt.heading = pick.h * Math.PI / 180; bt.status = 'idle'; return pick; })"""
CAM = "([d, pi, dbg]) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = pi; c.yaw = 0; c.zoom = 1; G3._debug.seaDbg = !!dbg; }"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        for key in SEL:
            for tide in ('low', 'high'):
                info = await pg.evaluate("(a) => (" + SETUP + ")(a)", [PLACES[key], tide])
                out = {'place':key, 'tide':tide, 'port':info['id'], 'when':info['when']}
                near = await pg.evaluate("(a) => (" + PICK + ")(a)", [info['p'], 50, 250, 40, 90]); out['near'] = near
                if near:
                    await pg.wait_for_timeout(22000); out['tideM'] = await pg.evaluate("G3._debug.env.tide")
                    for shot, (d, pi, dbg) in {'near':(35, 0.22, 0), 'top':(150, 1.2, 0), 'foam':(150, 1.2, 1)}.items():
                        await pg.evaluate(CAM, [d, pi, dbg]); await pg.wait_for_timeout(7000)
                        await pg.screenshot(path='shore_cmp/edge_%s_%s_%s_%s.png' % (TAG, key, tide, shot), timeout=120000)
                    await pg.evaluate(CAM, [35, 0.22, 0])
                far = await pg.evaluate("(a) => (" + PICK + ")(a)", [info['p'], 400, 1500, 700, 900]); out['far'] = far
                if far:
                    await pg.wait_for_timeout(22000)
                    await pg.evaluate(CAM, [300, 0.3, 0]); await pg.wait_for_timeout(7000)
                    await pg.screenshot(path='shore_cmp/edge_%s_%s_%s_far.png' % (TAG, key, tide), timeout=120000)
                print(json.dumps(out)); sys.stdout.flush()
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
