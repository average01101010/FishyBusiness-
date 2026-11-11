"""The coast in 3D (05.10.2026): the harbour unit from Blender at the receivers along the coast in its three looks (06b-coastports.js;
a today's plant, b the old fish plant, c the big plant), laid out when the eye comes near so the crane, the forklift and the people work
there too; a rorbu by Gryllefjord with the boat at its quay (07d-rorbu.js); and the coast's sea marks and lights (01e-marks.js) off Tromsø at
night. Pictures: coast_plant_a.png, coast_plant_b.png, coast_plant_c.png, coast_rorbu.png, coast_lights.png. Prints OK or FEIL per check.
The skerries (Ø13 K4, 11.11.2026; view3d/17i-rocks.js): by a rock rocksIn gives off Bodø and by one of Senja's own, the rock is drawn in
3D where the data have it, dry at low water and under the sea at the highest; its foot is no wider than what grounds the boat; its
shape is the same when asked again; and with #rocks0 in the address none is drawn. Pictures: coast_rock_bodo.png, coast_rock_senja.png.
KYST_COAST3D=rocks runs only this part."""
from _env import GAME, boot
import asyncio, json, os
ONLY = os.environ.get('KYST_COAST3D', '')
# a rock of rocksIn near a place (lat, lon; none: one of Senja's own), free of the land and of the harbours, and the boat 40 m off it at
# the lowest water of a June day
ROCK = """(async ll => {
  let P0; if (ll) P0 = P(ll[0], ll[1]); else { const q = SEAMARKS.rocks.filter(q => !inHarbour({x:q[0], y:q[1]}))[40]; P0 = {x:q[0], y:q[1]}; }
  await mapNeed(P0, 6);
  const R = rocksIn(P0.x - 5, P0.y - 5, P0.x + 5, P0.y + 5), free = (q, r) => { for (let k = 0; k < 12; k++){ const a = k / 12 * 2 * Math.PI; if (isLand({x:q[0] + Math.sin(a) * r, y:q[1] + Math.cos(a) * r})) return false; } return !isLand({x:q[0], y:q[1]}); };
  // (one 3D would draw: over the sea bed there, and alone within 60 m, so the boat lies by this one)
  const D = G3._debug, draws = q => { if (!D.rockShape) return true; const s = D.rockShape(q[0], q[1]); return D.terrH(s.x, s.z) < s.top - 0.5 && R.filter(o => Math.hypot(o[0] - q[0], o[1] - q[1]) < 0.06).length === 1; };
  let best = null; for (const q of R){ if (inHarbour({x:q[0], y:q[1]}) || !free(q, 0.08) || !free(q, 0.04) || !draws(q)) continue; const d = Math.hypot(q[0] - P0.x, q[1] - P0.y); if (!best || d < best.d) best = {q, d}; }
  if (!best) return null; const q = best.q, p = {x:q[0], y:q[1]}, H0 = (Date.UTC(2027, 5, 12, 6) - EPOCH) / 36e5; let lo = null, hi = null;
  for (let d = 0; d < 30; d++) for (let h = 0; h < 12; h += 0.5){ const H = H0 + d * 24 + h, t = tideH(H, p); if (!lo || t < lo.t) lo = {H, t}; if (!hi || t > hi.t) hi = {H, t}; }
  const b = S.boat; if (window.__mult === undefined) window.__mult = S.mult; S.t = Math.round(lo.H * 60); S.mult = 0; b.status = 'idle'; b.port = null; b.plan = null; S.plan = null; b.pos = {x:q[0] + 0.035, y:q[1] + 0.02}; b.heading = 0.6;
  const c = G3._debug.cam; c.helm = false; c.dist = 38; c.pitch = 0.2; c.yaw = 2.1;
  return {x:q[0], y:q[1], n:R.length, senja:inSenja(q[0], q[1]), lo:lo.t, hi:hi.t}; })"""
# what 3D has there: the nearest drawn rock and its shape asked twice
SEEN = """(([x, y]) => { const D = G3._debug, r = D.rocks ? D.rocks(x * 1000, y * 1000) : null; if (!r) return null; const a = D.rockShape(x, y), b = D.rockShape(x, y); delete r.foamL;
  return {r, same:JSON.stringify(a) === JSON.stringify(b), foot:+(Math.max(a.a, a.b) * 1.17).toFixed(1), top:a.top}; })"""
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


# with #rocks0 in the address none is drawn; on a page of its own after the first is shut (two pages drawing 3D at once did not
# get to the first screen in 90 s with SwiftShader)
async def no_rocks(b):
    ctx2 = await b.new_context(viewport={'width': 960, 'height': 600}); pg2 = await ctx2.new_page()
    await boot(pg2, GAME + ',rocks0#notut'); await pg2.wait_for_function("G3.isActive()", timeout=90000)
    q = await pg2.evaluate(ROCK, [67.30, 14.25]); await pg2.wait_for_timeout(12000)
    v = await pg2.evaluate("G3._debug.rocks ? G3._debug.rocks() : null"); print(json.dumps(v))
    print(ok(bool(v) and v['off'] and v['drawn'] == 0 and v['meshes'] == 0), 'with #rocks0 in the address no rock is drawn')
    await ctx2.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        # the skerries: off Bodø (the coast's, from the chart packs) and one of Senja's own
        for name, ll in [('bodo', [67.30, 14.25]), ('senja', None)]:
            q = await pg.evaluate(ROCK, ll)
            if not q: print(ok(False), 'a rock of rocksIn free of the land by %s' % name); continue
            for _ in range(20):
                await pg.wait_for_timeout(2000); v = await pg.evaluate(SEEN, [q['x'], q['y']])
                if not v or v['r']['at']: break
            print(json.dumps({'rock': q, 'seen': v}))
            r = (v or {}).get('r') or {}
            print(ok(bool(v) and r.get('drawn', 0) > 0 and r.get('at') is True), '%s: the rock rocksIn has there is drawn in 3D, where the data have it' % name, [r.get('rocks'), r.get('drawn'), r.get('at')])
            print(ok(bool(v) and v['top'] > q['lo'] + 0.2 and v['top'] < q['hi']), '%s: its top (%s m) is dry at the lowest water (%s m) and under the sea at the highest (%s m)' % (name, v and round(v['top'], 2), round(q['lo'], 2), round(q['hi'], 2)))
            print(ok(bool(v) and v['same'] and v['foot'] <= 12), '%s: the shape is the same when asked again, and the foot (%s m at most from the point) is within the 12 m that ground her' % (name, v and v['foot']))
            await pg.screenshot(path='coast_rock_%s.png' % name, timeout=120000)
        await pg.evaluate("S.mult = window.__mult")   # (the game's time runs again for the checks after)
        if ONLY == 'rocks': print('errors:', errs[:3]); await pg.close(); await no_rocks(b); await b.close(); return
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
          const h = s ? G3._debug.terrH(s.o[0] - s.n[0] * 8, s.o[1] - s.n[1] * 8) - (QTOP + 0.22 + s.lift) : null; return {site:!!s, model:!!M, lift:s ? s.lift : null, under:h === null ? null : +h.toFixed(2), rest:resting()}; })""", r['id'])
        print(json.dumps({'r': r, 'q': q}))
        print(ok(r['site'] and q['site'] and q['model'] and q['under'] is not None and q['under'] <= 0 and q['rest']), 'by Gryllefjord the rorbu stands on the map\'s own ground in 3D (its floor over it, lifted %s m; no bank of its own since 01.11.2026) in its colour (%s), with the boat at its quay and the skipper ashore' % (q['lift'], r['v']))
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
        print('errors:', errs[:3]); await pg.close(); await no_rocks(b); await b.close()

asyncio.run(main())
