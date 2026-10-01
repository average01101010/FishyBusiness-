from _env import GAME, boot
# Harbours (B1): the eight fish plants, ice only at the plants, fuel only at the bunker quays; the quays where the plants and bunker quays really are.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
PLANTS = ['husoy', 'senjahopen', 'botnhamn', 'gryllefjord', 'sommaroy', 'brensholmen', 'torsken', 'frovag']
FUEL = ['finnsnes', 'husoy', 'senjahopen', 'gryllefjord', 'botnhamn', 'torsken']
BUNKER = ['husoy', 'senjahopen', 'gryllefjord', 'botnhamn', 'torsken']

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 9, 10) - EPOCH) / 6e4); const R = {ports:{}};
          const can = (m, id) => DOCK.items(m).some(x => x.id === id && !x.off);
          for (const q of PORTS){
            const b = S.boat; b.status = 'port'; b.port = q.id; b.pos = {...q.p}; b.ice = 0; b.fuel = 10; S.plan = null; b.berth = 'main'; b.shift = b.fueling = b.land = b.after = null;
            S.hold = [{sp:'torsk', cls:2, kg:100, n:25, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}];
            renderActs(); const a = {ice:can('marked', 'is'), fuel:can('verft', 'bunker'), sell:can('marked', 'lever')};
            doAct({dataset:{act:'ice'}, disabled:false}); const ice = b.ice > 0, chute = ice && /isrenna/.test(S.log[S.log.length - 1].no);
            // filling takes her to the bunker quay and runs the pump: give it time
            doAct({dataset:{act:'fuel'}, disabled:false}); for (let i = 0; i < 40 && (b.shift || b.fueling); i++) step(); const fuel = b.fuel > 10;
            if (b.berth !== 'main'){ b.berth = 'main'; b.shift = b.fueling = b.after = null; }
            let sold = false; if (q.mottak){ sold = a.sell; sell(); sold = sold && S.lastSale.port === q.id && S.hold.length === 0; }
            R.ports[q.id] = {water:!isLand(q.p), iceBtn:a.ice, fuelBtn:a.fuel, ice, chute, fuel, sold};
          }
          // a standing plan restocks only what the harbour sells
          const b = S.boat; b.port = 'frovag'; b.fuel = 10; b.ice = 0; autoRestock(); R.opsFrovag = {fuel:b.fuel, ice:b.ice};
          b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; b.fuel = 10; b.ice = 0; autoRestock(); for (let i = 0; i < 40 && (b.shift || b.fueling); i++) step(); R.opsFinnsnes = {fuel:Math.round(b.fuel), ice:b.ice};
          R.customers = CUSTOMERS.filter(c => ['sommaroy', 'brensholmen', 'torsken', 'frovag'].includes(c.port)).map(c => c.port);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        P = r['ports']
        print(ok(all(P[k]['water'] for k in P)), 'every harbour berth is in the water')
        print(ok(all(P[k]['sold'] and P[k]['iceBtn'] and P[k]['ice'] and P[k]['chute'] for k in PLANTS)), 'the eight plants buy fish and sell ice from the chute')
        print(ok(P['finnsnes']['iceBtn'] and P['finnsnes']['ice'] and not P['finnsnes']['chute']), 'Finnsnes has no chute: the tackle shop sells bagged ice')
        print(ok(all(P[k]['fuelBtn'] == (k in FUEL) and P[k]['fuel'] == (k in FUEL) for k in P)), 'fuel only at Finnsnes and the bunker quays in Husøy, Senjahopen, Gryllefjord, Botnhamn and Torsken')
        print(ok(r['opsFrovag']['fuel'] == 10 and r['opsFrovag']['ice'] > 0 and r['opsFinnsnes']['fuel'] > 10 and r['opsFinnsnes']['ice'] == 0), 'a standing plan restocks only what the harbour sells')
        print(ok(sorted(r['customers']) == ['brensholmen', 'frovag', 'sommaroy', 'torsken']), 'the new plants post orders')
        # the quays from the marked-up satellite pictures: every vessel type lies at the quay face, in the water of the 3D coastline
        await pg.wait_for_function("typeof FINE !== 'undefined' && FINE && FINE.length", timeout=90000)
        q = await pg.evaluate("""(()=>{
          const inPoly = (P, x, z) => { let c = false; for (let i = 0, j = P.xs.length - 1; i < P.xs.length; j = i++){ const xi = P.xs[i], zi = P.zs[i], xj = P.xs[j], zj = P.zs[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
          const land = (x, z) => FINE.some(P => x >= P.bb[0] && x <= P.bb[2] && z >= P.bb[1] && z <= P.bb[3] && inPoly(P, x, z));
          const R = {};
          for (const pid in QUAYS) for (const kind in QUAYS[pid]) for (const t of Object.keys(BEAM)){
            const b = berthPose(pid, t, kind), f = quayFace(pid, kind), fx = Math.sin(b.hd), fz = -Math.cos(b.hd), sx = Math.cos(b.hd), sz = Math.sin(b.hd), X = b.x * 1000, Z = b.y * 1000;
            const pts = [[0, 0], [b.Lb / 2 - 0.5, 0], [-b.Lb / 2 + 0.5, 0], [0, b.Bb / 2], [0, -b.Bb / 2]].map(([l, s]) => [X + fx * l + sx * s, Z + fz * l + sz * s]);
            const off = (X - f.x) * f.nx + (Z - f.z) * f.nz, starb = sx * -f.nx + sz * -f.nz;
            R[pid + '|' + kind + '|' + t] = {wet:pts.every(([x, z]) => !land(x, z)), off:Math.round(off * 10) / 10, bb:b.Bb, starb:starb > 0.99, fits:f.hl * 2 >= b.Lb + 2}; }
          R.near = PORTS.filter(q => QUAYS[q.id]).map(q => { const f = quayFace(q.id, 'main'); return [q.id, Math.round(Math.hypot(q.p.x * 1000 - f.x, q.p.y * 1000 - f.z))]; });
          return R; })()""")
        bad = [k for k, v in q.items() if k != 'near' and not (v['wet'] and v['fits'] and v['starb'] and abs(v['off'] - (v['bb'] / 2 + 0.4)) < 0.6)]
        ntypes = len({k.split('|')[2] for k in q if k != 'near'})
        if bad: print({k: q[k] for k in bad[:20:4]})
        print('quays:', len(q) - 1, 'berths, bad:', bad, 'harbour point to quay (m):', q['near'])
        print(ok(not bad and len(q) - 1 == ntypes * 12 and ntypes >= 10), 'every coastal vessel type (%d) lies alongside each real quay face, half its beam off, quay to starboard, in the water of the 3D coastline' % ntypes)
        print(ok(sorted({k.split('|')[0] for k in q if k.endswith('|bunker|skiff')}) == sorted(BUNKER)), 'bunker quays in Husøy, Senjahopen, Gryllefjord, Botnhamn and Torsken')
        print(ok(all(d < 30 for _, d in q['near'])), 'the harbour point lies off the plant quay (Finnsnes: the quay by the net loft)')
        # the plotter: a tap on a harbour, or on the sea when leaving one, routes round the breakwaters on the way in and out
        rt = await pg.evaluate("""(()=>{ const px0 = view.px; view.px = 400; const R = {}, b = S.boat, legs = () => { let a = b.pos, ok = true; for (const w of S.draft){ if (!clearLine(a, w)) ok = false; a = w; } return ok; };
          for (const q of PORTS){ const out = approachPath(q)[0], sea = {x:out.x + (out.x - q.p.x) * 0.2, y:out.y + (out.y - q.p.y) * 0.2};
            b.status = 'port'; b.port = q.id; b.pos = {...q.p}; S.draft = []; addWaypoint(sea); const o = {n:S.draft.length, clear:legs()};
            b.status = 'idle'; b.port = null; b.pos = sea; S.draft = []; addWaypoint(q.p); R[q.id] = {out:o, in:{n:S.draft.length, clear:legs(), end:(S.draft[S.draft.length - 1] || {}).port}}; }
          view.px = px0; S.draft = []; const q = portById('husoy'); b.status = 'port'; b.port = 'husoy'; b.pos = {...q.p}; return R; })()""")
        print('routes:', json.dumps(rt))
        print(ok(all(v['out']['clear'] and v['out']['n'] >= 1 and v['in']['clear'] and v['in']['end'] == k for k, v in rt.items()) and rt['husoy']['in']['n'] >= 2 and rt['husoy']['out']['n'] >= 2), 'from sea to harbour and out again, a tap gives a route clear of land (Husøy: in through the breakwater gap)')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
