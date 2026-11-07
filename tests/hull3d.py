"""The hull in the sea in 3D (Fysikk 4 F2, docs/planer/fysikk-4-sjo-og-skrog.md; view3d/16-motion.js hullSea, hullMove; core/03c-stability.js
hullStep): heave and pitch from the buoyancy of the hull's sections, against the old following of the surface («#hull0», the same page
with G3._debug.bv.hsea.on false). The hull is stepped by hand at 30 frames a second, as the old measurements of 19.10.2026 were
(SwiftShader draws a frame every few seconds, and the waves run on the real clock): she lies or runs on the open ground off Husøy at her
real speed through the waves, so she meets them as she would at sea (in still water: in the harbour of Finnsnes, where no swell comes in;
the ground had a metre of the April swell with the wind at 0.3 m/s). Checks:
  1. the sjark in still water floats where the old following put her (± 5 cm), level;
  2. let go from 0.3 m over her rest in still water she heaves at stabOf's Tz (± 15 %), and the swing dies out;
  3. in 3.5 m beam sea lying still: the roll is the old roll (the model is the same, Ikeda and the slope across her; ± 30 %) and the heave
     about the old (0.6-1.4 x); the numbers (significant roll, heave as 4 sigma) are printed beside the 19.10.2026 ones (10°, 1.0-1.2 m);
  4. in 6 m head sea at 8.5 knots the sjark pitches and slams (more than one slam a minute), and the slams are in S.incidents;
  5. the skiff at 18 knots in a short, steep sea (10 m/s against her) slams; in calm water at the same speed she never does;
  6. nothing goes NaN, no page errors; and what the sea at the sections costs a frame (G3._debug.bv.hsea.ms).
Pictures (tests/out/hull3d_*.png, both formats): the sjark in head sea, her stern in a following sea, and the slam's spray."""
import asyncio, json, math, os
from playwright.async_api import async_playwright
from _env import GAME, boot

ok = lambda c: 'OK  ' if c else 'FEIL'
SETUP = "S.t = Math.round((Date.UTC(2027, 3, 10, 13) - EPOCH) / 6e4); WX_FORCE = {w:0.3, d:315}; S.mult = 0.00001; const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; S.plan = null; b.pos = {x:g.x, y:g.y}; b.v = 0; b.heading = 2.2;"
# One run: the boat of type `type` on the ground, the wind U m/s from d, her heading `rel` degrees off the way the waves go (180 head
# sea, 90 beam, 0 following), kn knots through the water, T seconds at 30 frames a second; `force` the sections (true) or the old
# following (false); `y0` an offset to let her go from. Returns the significant motions (heave 4 sigma, pitch and roll 2 sigma, degrees),
# the slams, the local Hs and the rest height.
RUN = """(o) => { const D = G3._debug, b = S.boat, HS = D.bv.hsea;
  if (b.type !== o.type){ b.type = o.type; applyVessel(); G3.vesselChanged(); }
  b.status = 'idle'; b.port = null; S.plan = null; b.v = 0; const g = o.calm ? PORTS[0].p : GROUNDS[0].p; b.pos = {x:g.x, y:g.y};
  WX_FORCE = {w:o.U, d:o.d}; D.WV.init = false; for (let i = 0; i < 3; i++) D.waves(1 / 30, S.t / 60);
  const hd = D.WV.dir + o.rel * Math.PI / 180, v = o.kn * 0.5144, Fr = v / Math.sqrt(9.81 * VESSELS[o.type].len);
  HS.on = o.force; D.bv.init = false; b.heading = hd; let t = 200 + (o.t0 || 0); const rec = {y:[], p:[], r:[]}, n0 = HS.n, i0 = (S.incidents || []).length;
  const step = () => { t += 1 / 30; D.WK.kn = o.kn; D.WK.Fr = Fr; D.WK.pf = 0;
    b.pos = {x:b.pos.x + Math.sin(hd) * v / 30 / 1000, y:b.pos.y - Math.cos(hd) * v / 30 / 1000}; b.heading = hd;
    D.waves(1 / 30, S.t / 60); D.bv.px = b.pos.x * 1000; D.bv.pz = b.pos.y * 1000; D.bv.cog = hd; D.bv.head = hd; D.bv.beta = 0; D.bv.yr = 0; D.stepBoat(1 / 30, t, 0); };
  for (let i = 0; i < 90; i++) step();   // she settles
  if (o.y0){ if (o.force) HS.X.yg += o.y0; else D.bv.y += o.y0; }
  const tide = D.env.tide || 0, nS = Math.round(o.T * 30);
  let green = 0, wet = false;   // (green water: the bow section's deck under, the sea over the forecastle)
  for (let i = 0; i < nS; i++){ step(); rec.y.push(D.bv.y - tide); rec.p.push(D.bv.pitch); rec.r.push(D.bv.roll);
    const under = !!(o.force && HS.X && HS.H && HS.X.h[0] > HS.H.d[0] + HS.H.f[0]); if (under && !wet) green++; wet = under; }
  const m = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => { const q = m(a); return Math.sqrt(a.reduce((x, y) => x + (y - q) ** 2, 0) / a.length); };
  const S2 = D.ssAt(D.bv.x, D.bv.z), WV = D.WV, ren = 1 / Math.sqrt(Math.max(1 - 2 * S2[2] * (1 - S2[2]) * (1 - WV.dot), 0.05));
  const hs = Math.sqrt(8 * WV.list.reduce((x, c) => x + (c.swell ? S2[1] * c.wo : S2[0] * (S2[2] * c.wo + (1 - S2[2]) * c.wy) * ren) ** 2, 0));
  const cr = []; for (let i = 1; i < rec.y.length; i++){ const a = rec.y[i - 1] - rec.y[rec.y.length - 1], c = rec.y[i] - rec.y[rec.y.length - 1]; if (a < 0 !== c < 0) cr.push(i); }
  const inc = (S.incidents || []).filter(x => x.k === 'slam');
  return {type:o.type, force:o.force, hs:+hs.toFixed(2), heave:+(4 * sd(rec.y)).toFixed(2), pitch:+(2 * sd(rec.p) * 180 / Math.PI).toFixed(2), roll:+(2 * sd(rec.r) * 180 / Math.PI).toFixed(2),
    yMean:+m(rec.y).toFixed(3), pMean:+(m(rec.p) * 180 / Math.PI).toFixed(2), last:+rec.y[rec.y.length - 1].toFixed(3), T1:cr.length > 2 ? +((cr[2] - cr[0]) / 30).toFixed(2) : null, Tz:+stabOf(o.type, {hold:0, deck:0, gear:0}).Tz.toFixed(2),
    slams:HS.n - n0, green, incSlam:inc.length ? inc[inc.length - 1].n : 0, fin:rec.y.concat(rec.p, rec.r).every(Number.isFinite), ms:+HS.ms.toFixed(3)}; }"""
# the wind on the ground that gives a significant wave height near hs (m/s), found in the page
FINDU = """(want) => { const D = G3._debug, b = S.boat, g = GROUNDS[0].p; let best = null;
  b.status = 'idle'; b.port = null; S.plan = null; b.pos = {x:g.x, y:g.y}; D.bv.init = false; D.stepBoat(1 / 30, 150, 0);   // (on the ground, not in the harbour)
  for (let U = 4; U <= 34; U += 0.5){ WX_FORCE = {w:U, d:315}; D.WV.init = false; for (let i = 0; i < 3; i++) D.waves(1 / 30, S.t / 60);
    const S2 = D.ssAt(D.bv.x, D.bv.z), WV = D.WV, ren = 1 / Math.sqrt(Math.max(1 - 2 * S2[2] * (1 - S2[2]) * (1 - WV.dot), 0.05));
    const hs = Math.sqrt(8 * WV.list.reduce((x, c) => x + (c.swell ? S2[1] * c.wo : S2[0] * (S2[2] * c.wo + (1 - S2[2]) * c.wy) * ren) ** 2, 0));
    if (!best || Math.abs(hs - want) < Math.abs(best.hs - want)) best = {U, hs:+hs.toFixed(2)}; }
  return best; }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SETUP)
        await pg.wait_for_function("G3.isActive() && G3._debug.bv.hsea", timeout=300000); await pg.wait_for_timeout(1500)
        R = {}
        # 1. and 2. still water: where she floats, and let go from 0.3 m
        R['calmNew'] = await pg.evaluate(RUN, {'type': 'sjark', 'calm': True, 'U': 0.3, 'd': 315, 'rel': 90, 'kn': 0, 'T': 8, 'force': True})
        R['calmOld'] = await pg.evaluate(RUN, {'type': 'sjark', 'calm': True, 'U': 0.3, 'd': 315, 'rel': 90, 'kn': 0, 'T': 8, 'force': False})
        R['drop'] = await pg.evaluate(RUN, {'type': 'sjark', 'calm': True, 'U': 0.3, 'd': 315, 'rel': 90, 'kn': 0, 'T': 12, 'force': True, 'y0': 0.3})
        # 3. 3.5 m beam sea, lying still
        u35 = await pg.evaluate(FINDU, 3.5); u6 = await pg.evaluate(FINDU, 6.0); R['U'] = {'3.5': u35, '6': u6}
        R['beamNew'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u35['U'], 'd': 315, 'rel': 90, 'kn': 0, 'T': 90, 'force': True})
        R['beamOld'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u35['U'], 'd': 315, 'rel': 90, 'kn': 0, 'T': 90, 'force': False})
        R['bowNew'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u35['U'], 'd': 315, 'rel': 180, 'kn': 0, 'T': 60, 'force': True})
        # 4. 6 m head sea at 8.5 knots (and the old following in the same sea, for the pitch)
        R['headNew'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u6['U'], 'd': 315, 'rel': 180, 'kn': 8.5, 'T': 120, 'force': True})
        R['headOld'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u6['U'], 'd': 315, 'rel': 180, 'kn': 8.5, 'T': 120, 'force': False})
        R['follow'] = await pg.evaluate(RUN, {'type': 'sjark', 'U': u6['U'], 'd': 315, 'rel': 0, 'kn': 8.5, 'T': 60, 'force': True})
        # 5. the skiff at 18 knots: a short, steep sea against her, and calm water
        R['skiffChop'] = await pg.evaluate(RUN, {'type': 'skiff', 'U': 10, 'd': 315, 'rel': 180, 'kn': 18, 'T': 90, 'force': True})
        R['skiffCalm'] = await pg.evaluate(RUN, {'type': 'skiff', 'calm': True, 'U': 0.3, 'd': 315, 'rel': 180, 'kn': 18, 'T': 30, 'force': True})
        R['skiffOld'] = await pg.evaluate(RUN, {'type': 'skiff', 'U': 10, 'd': 315, 'rel': 180, 'kn': 18, 'T': 90, 'force': False})
        print(json.dumps(R, ensure_ascii=False))
        # the pictures: the sjark in head sea (from the bow quarter), her stern in a following sea, and the slam's spray; both formats.
        # SwiftShader draws a frame every second or so, and the waves run on the page's clock while the hull steps at most 0.1 s a frame,
        # so she would be drawn lagging her sea (out of it on a crest); here the page's clock is made to go 1/30 s a frame, as on a tablet
        await pg.evaluate("""() => { if (window.__vclk) return; const pn = performance.now.bind(performance), raf = window.requestAnimationFrame.bind(window); let v = pn();
          window.__vf = 0; performance.now = () => v; window.requestAnimationFrame = cb => raf(() => { v += 1000 / 30; window.__vf++; cb(v); }); window.__vclk = true; }""")
        shots = []
        for name, rel, slam in (('motsjo', 180, False), ('medsjo', 0, False), ('slag', 180, True)):
            for fmt, (w, h) in (('liggende', (1280, 800)), ('staaende', (800, 1280))):
                await pg.set_viewport_size({'width': w, 'height': h})
                await pg.evaluate("""([U, rel]) => { const D = G3._debug, b = S.boat; if (b.type !== 'sjark'){ b.type = 'sjark'; applyVessel(); G3.vesselChanged(); }
                  b.status = 'idle'; b.port = null; S.plan = null; b.v = 0; const g = GROUNDS[0].p; b.pos = {x:g.x, y:g.y}; WX_FORCE = {w:U, d:315}; D.WV.init = false;
                  D.waves(1 / 30, S.t / 60); D.bv.hsea.on = true; const hd = D.WV.dir + rel * Math.PI / 180; b.heading = hd; D.bv.init = false;
                  const c = D.cam; c.helm = false; c.dist = 34; c.pitch = 0.2; c.yaw = rel ? 0.9 : 2.6; window.__f0 = window.__vf; }""", [u6['U'], rel])
                # 4 s of the sea for her to settle into it; for the slam, its spray thrown 6 frames before the picture
                await pg.wait_for_function("window.__vf - window.__f0 > 120", timeout=600000, polling=500)
                if slam:
                    await pg.evaluate("() => { G3._debug.bv.hsea.slam = {t:performance.now() / 1000, s:2.4}; window.__f0 = window.__vf; }")
                    await pg.wait_for_function("window.__vf - window.__f0 >= 6", timeout=300000, polling=200)
                await pg.evaluate("G3.hold(true)")
                f = f'hull3d_{name}_{fmt}.png'; await pg.screenshot(path=f, timeout=300000); shots.append(f)
                await pg.evaluate("G3.hold(false)")
        print('pictures:', shots)
        cN, cO, d = R['calmNew'], R['calmOld'], R['drop']
        print(ok(abs(cN['yMean'] - cO['yMean']) < 0.05 and abs(cN['pMean']) < 0.3), 'the sjark in still water floats where the old following put her (± 5 cm) and level', {'new': cN['yMean'], 'old': cO['yMean'], 'pitch': cN['pMean']})
        print(ok(d['T1'] and abs(d['T1'] / d['Tz'] - 1) < 0.15 and abs(d['last'] - cN['yMean']) < 0.02), 'let go from 0.3 m she heaves at stabOf\'s Tz (± 15 %) and comes to rest', {'T': d['T1'], 'Tz': d['Tz'], 'last': d['last']})
        bN, bO = R['beamNew'], R['beamOld']
        print(ok(bO['roll'] > 0 and 0.7 < bN['roll'] / bO['roll'] < 1.3 and 0.6 < bN['heave'] / max(bO['heave'], 1e-3) < 1.4), 'in %.1f m beam sea the roll is the old roll and the heave about the old' % bN['hs'], {'roll': [bN['roll'], bO['roll']], 'heave': [bN['heave'], bO['heave']], 'bow-on roll': R['bowNew']['roll'], '19.10.2026': 'roll 10°, heave 1.0-1.2 m'})
        hN = R['headNew']
        print(ok(hN['slams'] >= 2 and hN['incSlam'] >= 1 and hN['pitch'] > 1), 'in %.1f m head sea at 8.5 kn the sjark pitches and slams, and the slams are in S.incidents' % hN['hs'], {'slams/2 min': hN['slams'], 'sea over the forecastle': hN['green'], 'pitch': [hN['pitch'], R['headOld']['pitch']], 'heave': [hN['heave'], R['headOld']['heave']], 'following': {'pitch': R['follow']['pitch'], 'slams': R['follow']['slams']}})
        sC, s0 = R['skiffChop'], R['skiffCalm']
        print(ok(sC['slams'] >= 1 and s0['slams'] == 0), 'the skiff at 18 kn slams in a short steep sea (%.1f m), never in the still water of the harbour' % sC['hs'], {'slams/90 s': sC['slams'], 'calm': s0['slams'], 'pitch': [sC['pitch'], R['skiffOld']['pitch']]})
        print(ok(all(R[k]['fin'] for k in R if isinstance(R[k], dict) and 'fin' in R[k]) and not errs), 'nothing goes NaN, no page errors', errs[:3])
        print('the sea at the sections: %.3f ms a frame (SwiftShader page)' % max(R[k]['ms'] for k in R if isinstance(R[k], dict) and 'ms' in R[k]))
        await b.close()

asyncio.run(main())
