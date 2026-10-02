from _env import GAME, boot
# Bunkering (B5): filling fuel takes the boat from the plant's quay over to the bunker quay, the pump runs at its rate and the boat
# pays as it fills; landing from the bunker quay goes back first; Finnsnes fills where she lies; departures and standing plans wait.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 9, 10) - EPOCH) / 6e4); const R = {}, b = S.boat, run = n => { for (let i = 0; i < n; i++) step(); };
          const at = pid => { const q = portById(pid); b.status = 'port'; b.port = pid; b.pos = {...q.p}; b.berth = 'main'; b.shift = b.fueling = b.land = b.after = null; S.plan = null; };
          // Husøy, a skiff with 10 L of petrol: over to the bunker quay, then 80 L at 45 L/min
          at('husoy'); b.fuel = 10; const c0 = S.cash; renderActs(); R.btn = DOCK.items('verft').some(x => x.id === 'bunker' && !x.off);
          doAct({dataset:{act:'fuel'}, disabled:false}); R.shift = b.shift && {to:b.shift.to, cast:b.shift.castUntil - S.t, total:Math.round((b.shift.until - S.t) * 10) / 10}; R.fuel0 = b.fuel;
          renderActs(); R.bar = DOCK.text();
          const T = b.shift.until - S.t; run(Math.ceil(T)); R.berth = b.berth; R.fueling = b.fueling && {liters:Math.round(b.fueling.liters), lpm:b.fueling.lpm, dur:Math.round((b.fueling.until - b.fueling.t0) * 10) / 10};
          const fl = []; for (let i = 0; i < 6; i++){ step(); fl.push(Math.round(b.fuel)); } R.flow = fl; R.after = {fueling:!!b.fueling, fuel:Math.round(b.fuel), paid:Math.round(c0 - S.cash), price:Math.round(80 * fuelPrice())};
          // landing from the bunker quay: back to the plant's quay first, then the crane
          S.hold = [{sp:'sei', cls:1, kg:200, n:50, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}]; doAct({dataset:{act:'sell'}, disabled:false});
          R.back = b.shift && b.shift.to; run(Math.ceil(b.shift.until - S.t)); R.landing = !!b.land && b.berth === 'main';
          // a departure set while the pump runs waits
          at('husoy'); b.fuel = 10; startFueling(false); S.draft = [{x:b.pos.x, y:b.pos.y + 0.05, port:null, fish:0}, {x:b.pos.x, y:b.pos.y, port:'husoy', fish:0}]; doAct({dataset:{act:'start'}, disabled:false});
          R.wait = S.plan && S.plan.depAt >= b.shift.until; const st = []; for (let i = 0; i < 40 && b.status === 'port'; i++){ step(); } R.leftFull = b.status === 'unmooring' || b.status === 'sailing' ? Math.round(b.fuel) : 'still ' + b.status;
          // Finnsnes: filled where she lies
          at('finnsnes'); b.fuel = 30; startFueling(false); R.finnsnes = {shift:!!b.shift, fueling:!!b.fueling}; run(5); R.finnsnesFuel = Math.round(b.fuel);
          // Frovåg has its harbour unit's bunker berth now
          at('frovag'); b.fuel = 30; R.frovag = startFueling(false);
          // a sjark fills diesel at 90 L/min
          b.type = 'sjark'; applyVessel(); at('torsken'); b.fuel = 100; startFueling(false); run(Math.ceil(b.shift.until - S.t)); R.sjark = b.fueling && {lpm:b.fueling.lpm, liters:Math.round(b.fueling.liters)};
          b.type = 'skiff'; applyVessel();
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['btn'] and r['shift'] and r['shift']['to'] == 'bunker' and r['shift']['cast'] == 2 and r['fuel0'] == 10 and 'bunkerskaia' in r['bar']), 'Refuel at Husøy casts off for the bunker quay (lines in for two minutes, then over)')
        print(ok(r['berth'] == 'bunker' and r['fueling'] and r['fueling']['lpm'] == 45 and r['fueling']['liters'] == 80), 'made fast at the bunker quay, the pump starts: 80 L of petrol at 45 L/min')
        print(ok(r['flow'][0] <= 10 and r['flow'][-1] == 90 and len(set(r['flow'])) >= 3 and not r['after']['fueling'] and abs(r['after']['paid'] - r['after']['price']) <= 1), 'the fuel runs in over a few minutes and is paid as it fills')
        print(ok(r['back'] == 'main' and r['landing']), "landing from the bunker quay: back to the plant's quay, then the crane starts")
        print(ok(r['wait'] and r['leftFull'] == 90), 'a route set while at the pump leaves when she is full')
        print(ok(not r['finnsnes']['shift'] and r['finnsnes']['fueling'] and r['finnsnesFuel'] > 30 and r['frovag'] is True), 'Finnsnes fills where she lies; Frovåg fills at its bunker berth')
        print(ok(r['sjark'] and r['sjark']['lpm'] == 90), 'a sjark takes diesel at 90 L/min')
        # in 3D: a bunker station at each bunker quay and in Finnsnes; the move follows the game clock; the meter counts while the pump runs
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1000)
        st = await pg.evaluate("JSON.stringify(G3._debug.BUNKERS.map(B => B.id + '|' + B.kind))")
        await pg.evaluate("""(()=>{ S.mult = 0.00001; S.cash = 1e6; const q = portById('husoy'), b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...q.p}; b.berth = 'main'; b.shift = b.fueling = b.land = b.after = null; S.plan = null; G3.vesselChanged();
          const t0 = performance.now() / 1000; for (let i = 0; i < 60; i++) G3._debug.stepBoat(0.05, t0 + i * 0.05, 0); b.fuel = 5; startFueling(false); window.SH = {...b.shift}; const c = G3._debug.cam; c.dist = 14; c.yaw = 1.3; c.pitch = 0.3; })()""")
        ph = []
        for fr in [-0.5, 0.5, 1.5]:   # before the lines are in, half way over, the lines going on
            ph.append(await pg.evaluate(f"""(()=>{{ const b = S.boat, s = SH, now = S.t + liveFrac(), want = fr < 0 ? s.t0 + CAST_MIN * 0.5 : fr < 1 ? s.castUntil + (s.arriveAt - s.castUntil) * {fr} : s.arriveAt + (s.until - s.arriveAt) * 0.5, d = now - want;
              b.shift = {{...s, t0:s.t0 + d, castUntil:s.castUntil + d, arriveAt:s.arriveAt + d, until:s.until + d}}; const t0 = performance.now() / 1000; for (let i = 0; i < 3; i++) G3._debug.stepBoat(0.05, t0 + i * 0.05, 0);
              return G3._debug.MO.phase; }})()""".replace('fr <', str(fr) + ' <')))
        await pg.evaluate("""(()=>{ const b = S.boat; b.shift = null; b.berth = 'bunker'; b.after = null; startFueling(false); const f = b.fueling, d = S.t + liveFrac() - (f.pumpAt + 0.5); f.t0 += d; f.pumpAt += d; f.until += d;
          const t0 = performance.now() / 1000; for (let i = 0; i < 80; i++) G3._debug.stepBoat(0.05, t0 + i * 0.05, 0); })()""")
        await pg.wait_for_timeout(4000)
        meter = await pg.evaluate("JSON.stringify((G3._debug.BUNKERS.find(B => B.id === 'husoy') || {}).last)")
        print('stations:', st, 'phases:', ph, 'meter:', meter)
        print(ok(sorted(json.loads(st)) == sorted(['finnsnes|main'] + [k + '|bunker' for k in ['husoy', 'senjahopen', 'gryllefjord', 'botnhamn', 'torsken', 'sommaroy', 'brensholmen', 'frovag']])), 'a bunker station at every harbour unit\'s bunker berth, and at the quay in Finnsnes')
        print(ok(ph == ['out', 'in', 'lines']), 'in 3D the move follows the game clock: lines in, over, lines on')
        m = json.loads(meter) if meter else {}
        print(ok(m.get('here') and 15 <= m.get('liters', 0) <= 30), 'the pump meter counts the litres while the nozzle is in')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
