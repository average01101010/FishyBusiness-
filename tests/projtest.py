from _env import GAME, boot
# The projection for the whole coast (00-proj.js): UTM 33 (EPSG:25833) after Krüger/Karney against PROJ (tests/proj_ref.json from
# tools/map/projref.py), forward and back, the meridian convergence and the point scale, and the national frame in km.
import asyncio, json, os
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
REF = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proj_ref.json')))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(ref) => {
          let dE = 0, dG = 0, dK = 0, dBack = 0, dFrame = 0;
          for (const q of ref){
            const u = utm33(q.lat, q.lon); dE = Math.max(dE, Math.hypot(u.E - q.E, u.N - q.N)); dG = Math.max(dG, Math.abs(u.gamma - q.gamma)); dK = Math.max(dK, Math.abs(u.k - q.k));
            const ll = utm33inv(u.E, u.N); dBack = Math.max(dBack, Math.hypot((ll.lat - q.lat) * 111320, (ll.lon - q.lon) * 111320 * Math.cos(q.lat * RAD)));
            const f = natP(q.lat, q.lon), g = natLL(f); dFrame = Math.max(dFrame, Math.hypot((g.lat - q.lat) * 111320, (g.lon - q.lon) * 111320 * Math.cos(q.lat * RAD)));
          }
          // the frame: Grense Jakobselv and the mouth of Iddefjorden inside 0-1450 x 0-1720 km
          const gj = natP(69.7895, 30.9555), id = natP(58.9, 11.43), sw = natP(57.0, 4.0);
          // true north from the grid: a short step north along the meridian points gamma anticlockwise of grid north
          const a = utm33(69.5, 25), c = utm33(69.5001, 25), brg = Math.atan2(c.E - a.E, c.N - a.N) / RAD;
          let t0 = performance.now(); for (let i = 0; i < 100000; i++) utm33(60 + i * 1e-4, 10 + i * 1e-4); const usF = (performance.now() - t0) / 100;
          t0 = performance.now(); for (let i = 0; i < 100000; i++) utm33inv(300000 + i, 7000000 + i); const usI = (performance.now() - t0) / 100;
          return {mm:+(dE * 1000).toFixed(4), gammaDeg:dG, k:dK, backMm:+(dBack * 1000).toFixed(5), frameMm:+(dFrame * 1000).toFixed(4),
            gj:[+gj.x.toFixed(2), +gj.y.toFixed(2)], idd:[+id.x.toFixed(2), +id.y.toFixed(2)], sw:[+sw.x.toFixed(2), +sw.y.toFixed(2)], northBrg:+brg.toFixed(6), gamma:+a.gamma.toFixed(6), usF:+usF.toFixed(3), usI:+usI.toFixed(3)};
        }""", REF)
        print(json.dumps(r))
        print(ok(r['mm'] < 1), 'UTM 33 forward is within 1 mm of PROJ at all', len(REF), 'points (Norway, Grense Jakobselv and Utsira included)')
        print(ok(r['gammaDeg'] < 1e-7 and r['k'] < 1e-9), 'the meridian convergence and the point scale match PROJ')
        print(ok(r['backMm'] < 0.01 and r['frameMm'] < 0.01), 'back to lat/lon within 0.01 mm, also through the national frame in km')
        print(ok(0 < r['gj'][0] < 1450 and 0 < r['gj'][1] < 1720 and 0 < r['idd'][0] < 1450 and 0 < r['idd'][1] < 1720 and r['sw'][0] > 0 and r['sw'][1] < 1720), 'the national frame holds Grense Jakobselv, Iddefjorden and the sea off Jæren')
        print(ok(abs(r['northBrg'] + r['gamma']) < 1e-3), 'true north lies gamma anticlockwise of grid north (true bearing = grid bearing + gamma)')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
