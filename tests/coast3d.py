"""The coast in 3D (05.10.2026): the harbour unit from Blender at the receivers along the coast in its three looks (06b-coastports.js;
a today's plant, b the old fish plant, c the big plant), laid out when the eye comes near so the crane, the forklift and the people work
there too; a rorbu by Gryllefjord with the boat at its quay (07d-rorbu.js); and the coast's sea marks and lights (01e-marks.js) off Tromsø at
night. Pictures: coast_plant_a.png, coast_plant_b.png, coast_plant_c.png, coast_rorbu.png, coast_lights.png. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        # one plant of each look, near Lofoten and Vesterålen where the packs are in the build
        picks = await pg.evaluate("""(() => { const out = {}; for (const q of PORTS) if (q.coastal && q.mottak && UNITS[q.id] && !out[UNITS[q.id].v] && q.p.y > 300 && q.p.y < 520) out[UNITS[q.id].v] = {id:q.id, name:q.name}; return out; })()""")
        print(json.dumps(picks, ensure_ascii=False))
        for v in ['a', 'b', 'c']:
            pk = picks.get(v)
            if not pk: print(ok(False), 'a plant with look %s along the coast' % v); continue
            await pg.evaluate("""(async id => { const q = portById(id), U = UNITS[id], b = S.boat; await mapNeed(q.p, 2); S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4);
              b.status = 'idle'; b.port = null; b.plan = null; S.plan = null; b.pos = {x:(U.o[0] + U.n[0] * 90) / 1000, y:(U.o[1] + U.n[1] * 90) / 1000}; b.heading = Math.atan2(-U.n[0], U.n[1]);
              const c = G3._debug.cam; c.helm = false; c.dist = 60; c.pitch = 0.22; c.yaw = 0.35; })""", pk["id"])
            await pg.wait_for_timeout(16000)
            r = await pg.evaluate("""(id => { const P = G3._debug.PLANTS.find(q => q.id === id), U = UNITS[id], M = G3._debug.unitModel(U.v);
              const bld = G3._debug.terrH(...(() => { const w = unitW(U, 0, -12); return [w[0], w[1]]; })()); return {laid:!!P, model:!!M, deck:+bld.toFixed(2), v:U.v}; })""", pk['id'])
            print(json.dumps(r))
            print(ok(r['laid'] and r['model'] and r['v'] == v), 'at %s the harbour unit stands in look %s, and its crane and people are laid out when the eye comes near' % (pk['name'], v))
            await pg.screenshot(path='coast_plant_%s.png' % v, timeout=120000)
        # a rorbu (07d-rorbu.js; tools/harbour/rorbu.py) by Gryllefjord in daylight, in its colour, with the boat moored at its quay and the
        # skipper ashore resting
        r = await pg.evaluate("""(async () => { const g = portById('gryllefjord'), R = rorbuNear(g.p, 40).find(e => e.R.kind === 0).R, b = S.boat; await mapNeed(R.cand, 2); rorbuSite(R);
          S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); S.plan = null; b.status = 'port'; b.port = R.id; b.pos = {x:R.p.x, y:R.p.y}; b.berth = 'main'; S.cash = Math.max(S.cash, 500); restStart();
          const c = G3._debug.cam; c.helm = false; c.dist = 45; c.pitch = 0.2; c.yaw = 2.6; return {id:R.id, v:R.v, site:!!R.site, rest:resting()}; })()""")
        await pg.wait_for_timeout(16000)
        q = await pg.evaluate("""(id => { const s = G3._debug.sitesNow().find(s => s.id === id), M = s && G3._debug.siteModel('rorbu:' + s.v);
          const h = s ? G3._debug.terrH(s.o[0] - s.n[0] * 8, s.o[1] - s.n[1] * 8) : null; return {site:!!s, model:!!M, bank:h === null ? null : +h.toFixed(2), rest:resting()}; })""", r['id'])
        print(json.dumps({'r': r, 'q': q}))
        print(ok(r['site'] and q['site'] and q['model'] and q['bank'] is not None and -1.5 < q['bank'] < 2.5 and q['rest']), 'by Gryllefjord the rorbu stands on its bank in 3D in its colour (%s), with the boat at its quay and the skipper ashore' % r['v'])
        await pg.screenshot(path='coast_rorbu.png', timeout=120000)
        await pg.evaluate("restEnd(true)")
        # the coast's marks and lights off Tromsø at night
        r = await pg.evaluate("""(async () => { const P0 = P(69.6489, 18.9561), b = S.boat; await mapNeed(P0, 6); S.t = Math.round((Date.UTC(2027, 0, 12, 22) - EPOCH) / 6e4); S.mult = 0;
          b.status = 'idle'; b.port = null; S.plan = null; b.pos = {x:P0.x, y:P0.y + 0.6}; const c = G3._debug.cam; c.helm = false; c.dist = 40; c.pitch = 0.1; c.yaw = 0;
          const L = marksNear('lights', P0.x, P0.y, 10).filter(q => !inSenja(q[0], q[1])); return {n:L.length}; })()""")
        await pg.wait_for_timeout(15000)
        seen = await pg.evaluate("G3._debug.lightsSeen(performance.now() / 1000)")
        print(json.dumps({'coast': r, 'seen': seen}))
        print(ok(r['n'] > 5 and seen['inR'] > 5), 'off Tromsø the coast\'s lights are there in 3D at night', seen)
        await pg.screenshot(path='coast_lights.png', timeout=120000)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
