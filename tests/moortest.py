from _env import GAME
# Mooring (B2) and the fish plants (B3): a berth alongside the quay in every harbour, coming alongside with the lines going on, and casting off before moving.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':800, 'height':600})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1000)
        berths = await pg.evaluate("""JSON.stringify(PORTS.filter(q => !q.coastal).map(q => Object.keys(BEAM).filter(t => VESSELS[t].cls !== 'hav').map(t => { const b = berthPose(q.id, t); return b ? {ok:b.face.hl * 2 >= b.Lb + 2 && (QUAYS[q.id] || !isLand({x:b.x, y:b.y})), d:Math.round(Math.hypot(b.x - q.p.x, b.y - q.p.y) * 1000)} : null; })).flat())""")
        B = json.loads(berths)
        print(ok(all(x and x['ok'] and x['d'] < 120 for x in B)), 'every harbour has a berth for every vessel type, in the water, on a long enough face, near the harbour point (the real quays are checked against the 3D coastline in harbourtest)')
        # coming alongside at Husøy
        r = await pg.evaluate("""(()=>{ S.tut = 0; S.mult = 1;
          const q = portById('husoy'), a = portApproach(q), k = 0.06 / Math.hypot(a.x - q.p.x, a.y - q.p.y), b = S.boat;
          b.status = 'sailing'; b.port = null; b.pos = {x:q.p.x + (a.x - q.p.x) * k, y:q.p.y + (a.y - q.p.y) * k}; S.plan = null; G3.vesselChanged();
          const t0 = performance.now() / 1000; G3._debug.stepBoat(0.05, t0, 0); dock('husoy');
          const seen = []; for (let i = 0; i < 2000; i++){ G3._debug.stepBoat(0.05, t0 + i * 0.05, 0); const ph = G3._debug.MO.phase; if (seen[seen.length - 1] !== ph) seen.push(ph); }
          const bp = berthPose('husoy', 'skiff'), bv = G3._debug.bv;
          return {seen, lines:G3._debug.MO.lines, off:Math.round(Math.hypot(bv.px - bp.x * 1000, bv.pz - bp.y * 1000) * 10) / 10, head:Math.round(Math.abs(Math.atan2(Math.sin(bv.cog - bp.hd), Math.cos(bv.cog - bp.hd))) * 100) / 100}; })()""")
        print('alongside:', json.dumps(r))
        print(ok(r['seen'] == ['in', 'lines', 'moored'] and r['lines'] == 4 and r['off'] < 0.5 and r['head'] < 0.05), 'comes in, puts the four lines on and lies alongside, parallel to the quay')
        # casting off: the lines come in before the boat moves
        c = await pg.evaluate("""(()=>{ const b = S.boat; S.plan = {wps:[{x:b.pos.x, y:b.pos.y - 0.3, port:null, fish:0}], idx:0, speed:10, returning:false}; depart();
          const st0 = b.status, until = b.castUntil - S.t, R = {st0, until, st:[]};
          for (let i = 0; i < 3; i++){ step(); R.st.push(b.status); }
          return R; })()""")
        print('cast off:', json.dumps(c))
        cm = await pg.evaluate('CAST_MIN')
        print(ok(c['st0'] == 'unmooring' and c['until'] == cm and c['st'] == ['unmooring'] * (cm - 1) + ['sailing'] * (4 - cm)), 'casting off takes CAST_MIN game minutes, then she sails', cm)
        pl = json.loads(await pg.evaluate("JSON.stringify(G3._debug.PLANTS.map(P => P.id))"))
        print(ok(sorted(pl) == sorted(['husoy', 'senjahopen', 'botnhamn', 'gryllefjord', 'sommaroy', 'brensholmen', 'torsken', 'frovag'])), 'all eight fish plants are laid out in 3D (plant, silo, crane, people)')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
