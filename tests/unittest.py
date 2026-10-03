from _env import GAME, boot
# The harbour unit (H5): in every harbour with a plant the quay stands on enough water and nothing of the seabed shows, the forklift
# keeps well inside the deck all along its route, and the landing, bunker and ice places work. Screenshots: unit_<harbour>.png.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("""(()=>{ S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 7, 9, 12) - EPOCH) / 6e4); S.mult = 0.00001; })()""")
        await pg.wait_for_function("G3.isActive() && typeof DEPTH !== 'undefined' && DEPTH", timeout=90000); await pg.wait_for_timeout(800)
        r = await pg.evaluate("""(()=>{
          // the lowest tide at each unit: all the constituents of its place at their low together (phase K10: the tide per place)
          const D = G3._debug, lowAt = p => -tidePlace(p).C.reduce((s, c) => s + c[0], 0), R = {low:-1e9, units:{}};
          for (const U of UNITA){
            const at = (lx, lz) => { const w = unitW(U, lx, lz); return {x:w[0] / 1000, y:w[1] / 1000, w}; }, up = at(0, 0), low = lowAt(up), ZC = tideZC(up); R.low = Math.max(R.low, Math.round(low * 100) / 100);
            // the water along the face (both berths) at the lowest tide: charted depth plus the tide above chart datum
            let face = 1e9; for (let lx = -UNIT.E + 1; lx <= UNIT.E - 1; lx += 2) for (const lz of [0.5, 2, 4, 8]){ const q = at(lx, lz); face = Math.min(face, depthF(q) + low + ZC); }
            // the 3D seabed in the basin and along the face never above the lowest water
            let bed = -1e9; for (let lx = -UNIT.basinX; lx <= UNIT.basinX; lx += 1.5) for (let lz = 0.2; lz <= UNIT.basinZ; lz += 1.5){ const q = at(lx, lz); bed = Math.max(bed, D.terrH(q.w[0], q.w[1])); }
            // the forklift's corners all along its run, in the unit's frame, against the deck (|x| <= E, -B <= z <= 0)
            const P = D.PLANTS.find(q => q.id === U.id), Rn = D.fkRun(P), T = D.unitModel().A.truck; let margin = 1e9, n = 0;
            for (const g of Rn.legs) for (let k = 0; k <= 60; k++){ const s = D.legAt(g, k / 60), F = [Math.sin(s.h), -Math.cos(s.h)], Rt = [Math.cos(s.h), Math.sin(s.h)]; n++;
              for (const [fa, sd] of [[T.front, 1], [T.front, -1], [-T.back, 1], [-T.back, -1]]){ const x = s.x + F[0] * fa + Rt[0] * sd * T.half, z = s.z + F[1] * fa + Rt[1] * sd * T.half, [lx, lz] = unitL(U, x, z);
                margin = Math.min(margin, UNIT.E - Math.abs(lx), -lz, UNIT.B + lz); } }
            // the berths: both on the face, the bunker one by the pump; the plant and the bunker station are there
            const m = berthPose(U.id, 'kyst21', 'main'), k = berthPose(U.id, 'kyst21', 'bunker'), B = D.BUNKERS.find(q => q.id === U.id);
            R.units[U.id] = {face:Math.round(face * 10) / 10, bed:Math.round(bed * 10) / 10, low:Math.round(low * 100) / 100, truck:Math.round(margin * 100) / 100, samples:n, T:Math.round(Rn.T * 100) / 100,
              berths:!!(m && k && m.face.unit === U.id && k.face.unit === U.id), bunker:!!(B && B.unit && B.kind === 'bunker'), plant:!!P, patch:D.UPATCH.some(q => q.unit === U.id) || null};
          }
          // no mapped building or pier stands on a unit's ground
          R.piers = PIERBOX.filter(q => !q.made && UNITA.some(U => { const [lx, lz] = unitL(U, q.x, q.z); return Math.abs(lx) <= UNIT.E && lz <= 0 && lz >= -UNIT.B; })).length;
          return R; })()""")
        print(json.dumps(r))
        U = r['units']
        print(ok(len(U) == 8 and all(v['plant'] and v['berths'] and v['bunker'] for v in U.values())), 'a harbour unit in each of the eight harbours with a plant: its landing and bunker berths, its plant and its bunker station')
        print(ok(all(v['face'] >= 5 for v in U.values())), 'at least 5 m of water all along the face at the lowest tide (up to %.2f m), so kyst21 (3.4 m) lies afloat' % r['low'])
        print(ok(all(v['bed'] <= v['low'] - 0.5 for v in U.values())), 'the 3D seabed in the basin is nowhere above the lowest water (no ground shows at low tide)')
        print(ok(all(v['truck'] >= 1 for v in U.values())), 'the forklift\'s corners keep at least 1 m inside the deck all along its route (it can never drive off the edge)')
        print(ok(all(v['T'] <= 4.6 for v in U.values())), 'a forklift run takes at most two lifts')
        print(ok(r['piers'] == 0), 'no mapped pier stands on a unit\'s quay')
        # pictures of each harbour from above and from the water
        for pid in U:
            await pg.evaluate(f"""(()=>{{ const q = portById('{pid}'), b = S.boat; b.status = 'port'; b.port = '{pid}'; b.pos = {{...q.p}}; b.berth = 'main'; b.land = null; S.plan = null; b.moorT = S.t; G3.vesselChanged();
              const t0 = performance.now() / 1000; for (let i = 0; i < 80; i++) G3._debug.stepBoat(0.05, t0 + i * 0.05, 0); const c = G3._debug.cam; c.dist = 75; c.pitch = 0.45; c.yaw = 2.5; }})()""")
            # the pictures only (no check rides on them): a harbour in SwiftShader can take many seconds a frame
            await pg.wait_for_timeout(2500); await pg.screenshot(path='unit_' + pid + '.png', timeout=90000)
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
