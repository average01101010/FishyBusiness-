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
        types = await pg.evaluate("Object.keys(VESSELS).filter(t => vesselSpec(t) && (!vesselSpec(t).hand || glbHas(t)))")
        if ONLY: types = [t for t in types if t in ONLY]
        counts = {}
        for t in types:
            info = await pg.evaluate("""(t => { const t0 = performance.now(), m = buildVesselModel(t, 1), ms = performance.now() - t0, b = S.boat; b.type = t; applyVessel(); G3.vesselChanged();
              S.crew = [0, 1, 2].map(() => Object.assign(genCrew(), {bi:false, off:false})).slice(0, VESSELS[t].crewMax);
              const V = VESSELS[t], hull = (() => { if (!m.glb) return null; const H = glbPart(t, 'lod0') || m.o; let z0 = 1e9, z1 = -1e9, x0 = 1e9, x1 = -1e9; for (let i = 0; i < H.p.length; i += 3){ const y = H.p[i + 1]; if (y < -0.3 || y > 1.5) continue; const x = H.p[i], z = H.p[i + 2]; z0 = Math.min(z0, z); z1 = Math.max(z1, z); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } return [+(x1 - x0).toFixed(2), +(z1 - z0).toFixed(2)]; })();
              const need = ['eye', 'skipperAt', 'crewSpots', 'lights', 'hauler', 'pole', 'deck', 'stern', 'bow'];
              return {verts:m.o.p.length / 3, glass:m.glass.p.length / 3, ms:Math.round(ms * 10) / 10, len:V.len, beam:V.beam, cls:V.cls, glb:!!m.glb, hull, geoOk:need.every(k => m.geo && m.geo[k] != null),
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
            # a detailed model from tools/boats is drawn as triangles without shared corners: about three points to a triangle
            budget = 120000 if i['glb'] else 45000 if i['cls'] == 'hav' else 25000
            print(ok(i['verts'] <= budget and not i['nan']), '%s: %d punkter (budsjett %d), bygget på %.1f ms, uten NaN' % (t, i['verts'], budget, budget and i['ms']))
            L = i['len']
            if i['glb']:
                # the hull from just below the waterline to 1.5 m above it (the fender strake, the stem up to the strake), without the bow roller,
                # the riding sail's boom and the gantry over the stern
                print(ok(abs(i['hull'][1] - L) / L < 0.03 and abs(i['hull'][0] - i['beam']) / i['beam'] < 0.05 and i['geoOk']), '%s (GLB): skroget er %.2f m langt og %.2f m bredt mot %.2f x %.2f m, og alle plassene for 3D-visningen finnes' % (t, i['hull'][1], i['hull'][0], L, i['beam']))
            else: print(ok(abs(i['box'][1] - L) / L < 0.08), '%s: modellen er %.2f m lang mot %.2f m i dataene' % (t, i['box'][1], L))
        # the market's showroom: the boat afloat off the harbour, the camera turning round it, a chip with the way back
        if not ONLY or 'showroom' in ONLY:
            await pg.evaluate("(()=>{ const b = S.boat; b.type = 'skiff'; applyVessel(); G3.vesselChanged(); b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; })()"); await pg.wait_for_timeout(1500)
            await pg.evaluate("G3.showroom('kyst15')"); await pg.wait_for_timeout(3500)
            sr = await pg.evaluate("({showing:G3.showing, chip:!document.getElementById('showChip').hidden, text:document.getElementById('scTx').textContent})")
            await pg.screenshot(path=os.path.join(OUT, 'vessel_showroom.png'))
            await pg.click('#scBack'); await pg.wait_for_timeout(600)
            sr2 = await pg.evaluate("({showing:G3.showing, chip:!document.getElementById('showChip').hidden, drawer:!document.getElementById('drawer').hidden})")
            print('showroom:', json.dumps(sr, ensure_ascii=False), json.dumps(sr2))
            print(ok(sr['showing'] == 'kyst15' and sr['chip'] and '14,99' in sr['text'] and sr2['showing'] is None and not sr2['chip'] and sr2['drawer']), 'the showroom shows the boat with a chip, and Tilbake goes back to the market')
        # the local fleet: each boat on the nearest kit model, scaled, in a livery; near and middle versions within their budgets,
        # and a screenshot from beside a boat that fishes (vessel_npc_*.png)
        if not ONLY or 'npc' in ONLY:
            npc = await pg.evaluate("""(()=>{ const R = {kits:FLEET.map(f => { const t = npcKit(f.L, f.B), V = VESSELS[t]; return [f.n, f.L, t, +(f.L / V.len).toFixed(2), +(f.B / V.beam).toFixed(2)]; })};
              R.verts = [...new Set(R.kits.map(k => k[2]))].map(t => { const m = npcModel(t, 1, 1); return [t, m.o.p.length / 3, npcModel(t, 0.3, 2).o.p.length / 3, !!m.glb]; });
              R.liv = (() => { const a = npcModel('sjark', 0.3, 0).o.c, b = npcModel('sjark', 0.3, 1).o.c; let d = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 1e-3) d++; return d; })();
              // a day in April when a boat is on her ground: the player's skiff lies 25 m off her
              let at = null; for (let m = 0; m < 24 * 60 && !at; m += 10){ const t = (Date.UTC(2028, 3, 12, 0) - EPOCH) / 6e4 + m, n = npcStates(t / 60).find(q => q.fleet && q.st === 'fishing' && FLEET[q.fi].L > 10); if (n) at = {t, n}; }
              if (!at) return R; S.t = Math.round(at.t) + 30; const n = npcStates(S.t / 60).find(q => q.id === at.n.id), b = S.boat; R.npc = [n.name, n.st, FLEET[n.fi].L];
              b.type = 'skiff'; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; b.pos = {x:n.p.x + Math.cos(n.hd) * 0.025, y:n.p.y + Math.sin(n.hd) * 0.025}; b.heading = n.hd; S.crew = []; S.mult = 0;   // time stands still, so she stays beside you
              const c = G3._debug.cam; c.helm = false; c.dist = 38; c.pitch = 0.2; return R; })()""")
            print('npc:', json.dumps(npc, ensure_ascii=False)[:1500])
            for i, yaw in enumerate((0.6, 2.2, 3.8, 5.4)):
                await pg.evaluate("G3._debug.cam.yaw = %s" % yaw); await pg.wait_for_timeout(1600)
                await pg.screenshot(path=os.path.join(OUT, 'vessel_npc_%d.png' % i))
            await pg.evaluate("S.mult = 1")
            sc = [k[3] for k in npc['kits']] + [k[4] for k in npc['kits']]
            print(ok(all(0.8 <= x <= 1.25 for x in sc) and all(k[2] for k in npc['kits'])), 'every boat in the local fleet gets a kit model within 20 % of her length and beam', [k[:3] for k in npc['kits']])
            print(ok(all(v[1] <= (120000 if v[3] else 25000) and v[2] <= (10000 if v[3] else 6000) for v in npc['verts']) and npc['liv'] > 0), 'near versions under 25 000 points (detailed GLB models 120 000), middle under 6 000 (GLB 10 000), and the liveries change the colours', npc['verts'])
            print(ok(bool(npc.get('npc'))), 'found a boat on her ground for the screenshots', npc.get('npc'))
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
