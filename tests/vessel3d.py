"""The vessel models in 3D (src/js/vessel3d.js): each type with a model is shown at sea from the side, the bow and the helm, and a
screenshot is saved in tests/out/ (vessel_<type>_*.png) to be looked at. Prints the vertex count against the budget, and page errors."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import GAME
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
ONLY = [a for a in sys.argv[1:] if not a.startswith('-')]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width':900, 'height':700}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME + ('#notut' if '#' not in GAME else ''))
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("(()=>{ S.tut = 0; S.settings.autoOn = false; S.t = 45 * 1440 + 360; const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {...GROUNDS[1].p}; b.heading = 1.1; })()")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        types = await pg.evaluate("Object.keys(VESSELS).filter(t => vesselSpec(t))")
        if ONLY: types = [t for t in types if t in ONLY]
        counts = {}
        for t in types:
            info = await pg.evaluate("""(t => { const t0 = performance.now(), m = buildVesselModel(t, 1), ms = performance.now() - t0, b = S.boat; b.type = t; applyVessel(); G3.vesselChanged();
              S.crew = [0, 1, 2].map(() => Object.assign(genCrew(), {bi:false, off:false})).slice(0, VESSELS[t].crewMax);
              const V = VESSELS[t]; return {verts:m.o.p.length / 3, glass:m.glass.p.length / 3, ms:Math.round(ms * 10) / 10, len:V.len, cls:V.cls,
                nan:m.o.p.some(x => !isFinite(x)) || m.o.n.some(x => !isFinite(x)),
                box:(() => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y0 = 1e9; for (let i = 0; i < m.o.p.length; i += 3){ const x = m.o.p[i], y = m.o.p[i + 1], z = m.o.p[i + 2]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); y0 = Math.min(y0, y); } return [+(x1 - x0).toFixed(2), +(z1 - z0).toFixed(2), +(-y0).toFixed(2)]; })()}; })""", t)
            counts[t] = info
            for view, yaw, pitch, dist in (('side', 1.57, 0.12, 2.1), ('bow', 0.55, 0.3, 1.9), ('aft', 2.6, 0.35, 1.8)):
                await pg.evaluate("(([y, p, d, L]) => { const c = G3._debug.cam; c.helm = false; c.yaw = y; c.pitch = p; c.dist = Math.max(9, L * d); })(%s)" % json.dumps([yaw, pitch, dist, info['len']]))
                await pg.wait_for_timeout(1800)
                await pg.screenshot(path=os.path.join(OUT, 'vessel_%s_%s.png' % (t, view)))
            await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(1500)
            await pg.screenshot(path=os.path.join(OUT, 'vessel_%s_helm.png' % t)); await pg.evaluate("G3.setHelm(false)")
        print(json.dumps(counts, ensure_ascii=False))
        for t, i in counts.items():
            budget = 45000 if i['cls'] == 'hav' else 25000
            print(ok(i['verts'] <= budget and not i['nan']), '%s: %d punkter (budsjett %d), bygget på %.1f ms, uten NaN' % (t, i['verts'], budget, budget and i['ms']))
            L = i['len']; print(ok(abs(i['box'][1] - L) / L < 0.08), '%s: modellen er %.2f m lang mot %.2f m i dataene' % (t, i['box'][1], L))
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
