"""Kappløpet Lindesnes–Nordkapp, the core (KL1, steg 116a; docs/planer/kapplop.md, Jonas 12.11.2026). The build must have the whole coast
(python3 tools/map/release.py && python3 tools/map/game.py). With a havsjark (10 kn, class «middels») in still weather (WX_FORCE 3 m/s):
  1. registered at the quay in Lindesnes: the class from the type, the clock not started
  2. leg 1 (south) Lindesnes–Bergen sailed minute by minute on an Autonav route at top speed: the clock starts on casting off, the hop
     is refused («Ikke i kappløpet»), a passing over a speed limit by hand adds 15 minutes, and the checkpoint in Bergen is leg 1
  3. the clock runs in harbour and while bunkering (V2 A, one clock): two hours at the quay and a bunkering, all on the clock
  4. leg 3 (middle) Ålesund–Rørvik played as catchUp plays it with the game closed (playMinutes an hour at a time): Autonav sails on,
     and the checkpoint in Rørvik is leg 3
  5. leg 6 (north) Tromsø–Nordkapp: over the line north of the cape the attempt is finished, with the week it counts in and the best time;
     a hop is allowed again after the finish
  6. a tow from the rescue boat on the way breaks the attempt (dnf, «slep»)
  7. no page errors
  8. an ocean vessel finds the way Rørvik–Bodø (11-route.js leiaSplit, KL1a)
KYST_LOP_MAAL=1 measures instead (kapplop.md «Løypa og tidene»): each leg's length with leiaRoute, and the time per leg and for the
whole course for the trebåt, the havsjark, the kystbåt 15 m and the hurtigsjark (KYST_LOP_TYPER=skiff,autoliner: other types), with and without the turbo trim, in still weather and in
the weather now, with a dry run as hopRun; the bunkering stops; portWhy at each checkpoint for every type.
KYST_LITE=1 python3 tests/kapplop.py. Prints OK or FEIL lines."""
import asyncio, json, os
from _env import boot
from playwright.async_api import async_playwright

FAIL = []
def check(ok, what, info=None):
    print(('OK ' if ok else 'FEIL ') + what + ('' if info is None else ' ' + json.dumps(info, ensure_ascii=False)[:700]))
    if not ok: FAIL.append(what)

# the boat at the quay of a checkpoint (k: 0 the start, 1.. the checkpoints), a type, a full tank, you aboard, still weather
AT = """async (o) => { const b = S.boat, c = o.k ? LOP.cps[o.k - 1] : LOP.start, pt = portById(c.port);
  if (!pt) return {err:'no port ' + c.port};
  await mapNeed(pt.p, 4);
  if (o.type){ b.type = o.type; applyVessel(); }
  S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.sleep = null; S.energy = 95; S.skip = null; WX_FORCE = {w:3, d:180}; S.crew = [];
  if (S.turer) S.turer.act = []; S.sos = null; S.mob = null; S.ptowH = null; S.ptow = null;
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.anch = null; b.hove = null; b.damage = 0; b.dmg = null; b.sale = null; b.landQ = null;
  delete b.trim; applyVessel(); b.fuel = BOAT.fuelCap; S.hold = []; S.plan = null; S.jobs = [];
  return {port:pt.id, name:pt.name, type:b.type, vmax:BOAT.vmax}; }"""
# an Autonav route from the quay she lies at to a checkpoint's quay (k) or to the point past the finish line (k: 'goal')
ROUTE = """async (k) => { const b = S.boat, A = portById(b.port);
  const to = k === 'goal' ? Object.assign(P(71.215, 25.86), {}) : portById(LOP.cps[k - 1].port), toP = k === 'goal' ? to : to.p;
  const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:toP.x, y:toP.y}, A.id, k === 'goal' ? null : to.id); if (r.why) return {err:r.why[0]};
  for (const w of r.wps) await mapNeed(w, 1);
  S.plan = {wps:r.wps.map(w => Object.assign({}, w)), idx:0, speed:BOAT.vmax, returning:false, depAt:null, unsafe:r.wps.map(() => false)};
  if (k !== 'goal') S.plan.wps[S.plan.wps.length - 1].port = to.id;
  return {nm:+r.nm.toFixed(1), n:r.wps.length}; }"""
RUN = """() => { const L = S.lop || {}, r = L.run, T = r ? lopTime(r, S.t) : null;
  return {st:r ? r.st : null, cls:r ? r.cls : null, t0:r ? r.t0 : null, legs:r ? r.legs.map(l => l.pid) : null, pen:r ? r.pen.length : null, T, t:S.t,
    bst:S.boat.status, port:S.boat.port, hist:(L.hist || []).slice(0, 2), best:L.best || {}, legsN:L.legsN || 0}; }"""
# sailed minute by minute (open) or an hour at a time as catchUp plays the time the game was closed; until she is in port, the attempt
# is over, or n minutes have gone. A way round shallow water found by Autonav is waited for (sailWaiting), as playMinutes does
SAIL = """async (o) => { const t0 = S.t, step = o.closed ? 60 : 1; let idle = 0;
  // (playMinutes stops where the simulation's map is not in yet, simAreaReady, and the game plays the rest when it is: here the map is
  // let in and the minutes played on, as havplantest does)
  for (let i = 0; i < 40000 && S.t - t0 < (o.n || 1e9) && idle < 600; i++){ DYN.on = false; const t1 = S.t;
    playMinutes(o.n ? Math.min(step, o.n - (S.t - t0)) : step, true); CATCH_LEFT = 0; while (sailWaiting()) await new Promise(r => setTimeout(r, 30));
    if (S.t === t1){ idle++; await mapNeed(S.boat.pos, 2).catch(() => {}); await new Promise(r => setTimeout(r, 50)); } else idle = 0;
    if (S.boat.status === 'port' && S.boat.port && !o.n && !o.untilEnd) break; if (o.untilEnd && !(S.lop && S.lop.run)) break; }
  return {st:S.boat.status, port:S.boat.port, min:S.t - t0, idle}; }"""

MAAL = """async (TYPER) => {
  const types = TYPER, out = {legs:[], types:{}, ports:{}}, b = S.boat;
  const ends = [LOP.start].concat(LOP.cps).map(c => portById(c.port));
  // portWhy at each checkpoint for every type: is there a quay within r that takes her
  for (const k in VESSELS){ out.ports[k] = [LOP.start].concat(LOP.cps).map(c => { const ok = PORTS.filter(p => dist(p.p, c.p) <= c.r && !p.naust && p.pier !== false && !portWhy(p, k));
    return ok.length ? ok.length : 0; }); }
  for (const ty of types){
    b.type = ty; delete b.trim; applyVessel(); const R = out.types[ty] = {vmax:BOAT.vmax, fuelCap:BOAT.fuelCap, legs:[]};
    for (let i = 0; i < 6; i++){
      const A = ends[i], goal = i === 5, B = goal ? null : ends[i + 1], toP = goal ? P(71.215, 25.86) : B.p;
      await mapNeed(A.p, 2);
      const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:toP.x, y:toP.y}, A.id, goal ? null : B.id);
      if (r.why){ R.legs.push({err:r.why[0]}); continue; }
      const row = {nm:+r.nm.toFixed(1)};
      for (const [wx, trim] of [['stille', 0], ['stille', 1], ['naa', 0], ['naa', 1]]){
        WX_FORCE = wx === 'stille' ? {w:3, d:180} : null;
        b.status = 'sailing'; b.port = null; b.pos = {x:A.p.x, y:A.p.y}; b.v = 0; delete b.trim; applyVessel(); b.fuel = BOAT.fuelCap;
        if (trim) b.trim = {k:'turbo', t0:S.t, until:S.t + 100000}; applyVessel();
        S.plan = {wps:r.wps.map(w => Object.assign({}, w)), idx:0, speed:BOAT.vmax, returning:false, depAt:null, unsafe:r.wps.map(() => false)};
        if (!goal) S.plan.wps[S.plan.wps.length - 1].port = B.id;
        const q = hopRun(); row[wx + (trim ? '_turbo' : '')] = {h:+(q.min / 60).toFixed(1), real:+(q.real / 60).toFixed(2), fuel:Math.round(q.fuel), stops:Math.max(0, Math.ceil(q.fuel / BOAT.fuelCap) - 1)};
      }
      R.legs.push(row);
    }
    delete b.trim; applyVessel();
  }
  WX_FORCE = {w:3, d:180};
  return out; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.boat.status === 'port'", timeout=90000)
        pg.set_default_timeout(1800000)
        J = lambda js, *a: pg.evaluate(js, *a)
        if os.environ.get('KYST_LOP_MAAL') == '1':
            m = await J(MAAL, (os.environ.get('KYST_LOP_TYPER') or 'trebat,sjark,kyst15,hurtigsjark').split(','))
            print('MAAL ' + json.dumps(m, ensure_ascii=False))
            check(all(not l.get('err') for t in m['types'].values() for l in t['legs']), 'alle etappene har en rute for alle fire typene')
            await br.close(); return
        # 1. registered in Lindesnes
        a = await J(AT, {'k': 0, 'type': 'sjark'}); check(not a.get('err'), 'båten ved kaia i Lindesnes', a)
        r = await J("() => { const r = lopStart(); return r.why ? {why:r.why[0]} : {cls:r.cls, st:r.st, t0:r.t0}; }")
        check(r.get('cls') == 'middels' and r.get('st') == 'reg' and r.get('t0') is None, '1. påmeldt i Lindesnes: klassen middels, klokka ikke startet', r)
        # 2. leg 1, south: Lindesnes–Bergen
        rt = await J(ROUTE, 1); check(not rt.get('err'), 'ruta Lindesnes–Bergen', rt)
        d = await J("() => { const ok = depart(); return {ok, st:S.boat.status, run:S.lop.run.st, t0:S.lop.run.t0, t:S.t}; }")
        check(d['ok'] and d['run'] == 'run' and d['t0'] == d['t'], '2. kastet loss: klokka går fra nå', d)
        await J(SAIL, {'n': 20})
        hw = await J("() => (hopWhy() || [null])[0]")
        check(hw == 'Ikke i kappløpet.', '2. hoppet er nektet i løpet', hw)
        await J("() => farvRec({k:'fart', kn:5, v:9.2, name:'Lindesnes'})")
        s = await J(SAIL, {}); r = await J(RUN)
        check(s['st'] == 'port' and r['legs'] == [a and (await J("() => LOP.cps[0].port"))], '2. sjekkpunkt Bergen: etappe 1', {'s': s, 'legs': r['legs']})
        T = r['T']; check(T and T['pen'] == 15 and abs(T['min'] - (T['raw'] + 15)) < 1e-9 and T['splits'] and abs(T['splits'][0] - T['min']) < 1e-9,
                          '2. tida med tillegget for fartsgrensa (15 min) og mellomtida i Bergen', T)
        leg1 = s['min']; print('ETAPPE 1 seilt på ' + str(leg1) + ' spillminutter (' + str(rt.get('nm')) + ' nm)')
        # 3. the clock in harbour and at the bunker
        r0 = await J(RUN)
        await J(SAIL, {'n': 120}); r1 = await J(RUN)
        check(r1['bst'] == 'port' and abs((r1['T']['raw'] - r0['T']['raw']) - (r1['t'] - r0['t'])) < 1e-9 and r1['t'] - r0['t'] >= 120,
              '3. to timer ved kaia i Bergen: klokka går like mye som verdens klokke', {'raw': r1['T']['raw'] - r0['T']['raw'], 'world': r1['t'] - r0['t']})
        f = await J("""async () => { const b = S.boat; b.fuel = BOAT.fuelCap * 0.4; const t0 = S.t, raw0 = lopTime(S.lop.run, S.t).raw;
          const ok = startFueling(false); let idle = 0;
          for (let i = 0; i < 2000 && (b.shift || b.fueling) && idle < 400; i++){ const t1 = S.t; playMinutes(1, true); CATCH_LEFT = 0;
            if (S.t === t1){ idle++; await mapNeed(b.pos, 2).catch(() => {}); await new Promise(r => setTimeout(r, 50)); } else idle = 0; }
          return {ok, min:S.t - t0, raw:lopTime(S.lop.run, S.t).raw - raw0, fuel:Math.round(b.fuel), cap:BOAT.fuelCap, at:portById(b.port).name, st:S.lop.run.st}; }""")
        check(f['min'] > 0 and f['fuel'] > f['cap'] * 0.4 and abs(f['raw'] - f['min']) < 1e-9 and f['st'] == 'run', '3. bunkringen i ' + str(f['at']) + ': klokka går', f)
        # 4. leg 3, middle: Ålesund–Rørvik, played with the game closed
        await J("() => { const r = S.lop.run; r.legs = [{t:S.t, pid:LOP.cps[0].port}, {t:S.t, pid:LOP.cps[1].port}]; }")
        a = await J(AT, {'k': 2}); rt = await J(ROUTE, 3); check(not rt.get('err'), 'ruta Ålesund–Rørvik', rt)
        await J("() => depart()")
        s = await J(SAIL, {'closed': True}); r = await J(RUN)
        check(s['st'] == 'port' and len(r['legs']) == 3 and r['legs'][2] == (await J("() => LOP.cps[2].port")) and r['st'] == 'run',
              '4. etappe 3 spilt som med spillet lukket: Autonav seilte videre, sjekkpunkt Rørvik', {'s': s, 'legs': r['legs'], 'nm': rt.get('nm')})
        # 5. leg 6, north: Tromsø–Nordkapp, over the line
        await J("() => { const r = S.lop.run; r.legs = LOP.cps.map(c => ({t:S.t, pid:c.port})); }")
        a = await J(AT, {'k': 5}); rt = await J(ROUTE, 'goal'); check(not rt.get('err'), 'ruta Tromsø–forbi Nordkapp', rt)
        await J("() => depart()")
        s = await J(SAIL, {'untilEnd': True}); r = await J(RUN)
        h0 = r['hist'][0] if r['hist'] else {}
        wk = await J("() => lopWeek(lopMs(S.t)).id")
        check(r['st'] is None and h0.get('st') == 'done' and h0.get('how') == 'maal' and h0.get('legs') == 6 and h0.get('week') == wk and r['best'].get(wk) == h0.get('min'),
              '5. over mållinja nord for Nordkapp: fullført, uka ' + wk + ' og beste tid', {'hist': h0, 'best': r['best'], 'nm': rt.get('nm'), 'min': s['min']})
        hw = await J("() => (hopWhy() || [null])[0]")
        check(hw is None, '5. etter mål er hoppet lov igjen (hjem til Honningsvåg)', hw)
        # 6. a tow breaks the attempt
        a = await J(AT, {'k': 0}); await J("() => lopStart()"); rt = await J(ROUTE, 1); await J("() => depart()"); await J(SAIL, {'n': 30})
        # the race boat sails on by Autonav while you are aboard another boat in the fleet (lopTick binds her: onVessel); a passing over a
        # limit and a near miss where she had to give way are counted on her, a near miss where the other gave way is not
        o = await J("""async () => { const rid = S.cur, rb = S.boat, p0 = {x:rb.pos.x, y:rb.pos.y}, v2 = newVesselObj('skiff', LOP.start.port);
          storeVessel(curVessel()); bindVessel(v2); S.me = v2.id; const n0 = S.lop.run.pen.length;
          S.farv = (S.farv || []).concat([{t:S.t, vid:rid, k:'fart', kn:5, v:8}]); S.nearMiss = (S.nearMiss || []).concat([{t:S.t, vid:rid, give:'a', m:30}, {t:S.t, vid:rid, give:'b', m:30}]);
          let idle = 0; const t0 = S.t; while (S.t - t0 < 60 && idle < 400){ const t1 = S.t; playMinutes(1, true); CATCH_LEFT = 0; if (S.t === t1){ idle++; await new Promise(r => setTimeout(r, 50)); } }
          const vr = vesselById(rid), b = vget(vr, 'boat'), R = {cur:S.cur, moved:+dist(p0, b.pos).toFixed(2), st:S.lop.run && S.lop.run.st, pen:S.lop.run ? S.lop.run.pen.slice(n0).map(x => x.k) : null};
          storeVessel(curVessel()); bindVessel(vr); S.me = rid; S.fleet = S.fleet.filter(x => x.id !== v2.id); return R; }""")
        check(o['moved'] > 3 and o['st'] == 'run' and o['pen'] == ['fart', 'vik'], '6. løpsbåten seiler videre på Autonav mens du er om bord i en annen båt, og tilleggene telles på henne', o)
        await J("() => rescue(true)"); await J(SAIL, {'n': 2, 'untilEnd': True}); r = await J(RUN)
        h0 = r['hist'][0] if r['hist'] else {}
        check(r['st'] is None and h0.get('st') == 'dnf' and h0.get('how') == 'slep', '6. slep fra Redningsselskapet: forsøket er brutt', h0)
        # a tow called from the quay as she casts off (rescue() docks her at once, no 'tow' is ever seen): broken too
        await J(AT, {'k': 0}); await J("() => lopStart()"); await J(ROUTE, 1); await J("() => depart()")
        q = await J("() => { const st = S.boat.status; rescue(true); const h = S.lop.hist[0] || {}; return {st, run:!!S.lop.run, how:h.how, id:h.id}; }")
        check(q['st'] == 'unmooring' and not q['run'] and q['how'] == 'slep', '6. slep kalt mens hun kaster loss: forsøket er brutt', q)
        check(r['legsN'] == 3, '6. etappene som er seilt (Bergen, Rørvik og mållinja), teller på merket: ' + str(r['legsN']))
        # 8. an ocean vessel finds the way Rørvik–Bodø (leg 4): before KL1a no route in one piece (11-route.js leiaSplit)
        h = await J("""async () => { const b = S.boat, ty = b.type; b.type = 'autoliner'; applyVessel(); const A = portById(LOP.cps[2].port), B = portById(LOP.cps[3].port);
          await mapNeed(A.p, 2); const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); b.type = ty; applyVessel();
          return r.why ? {why:r.why[0]} : {nm:+r.nm.toFixed(1), by:r.st && r.st.by, split:r.st && r.st.split}; }""")
        check(not h.get('why') and h.get('nm', 0) > 150, '8. et havfartøy (autolineren) finner ruta Rørvik–Bodø', h)
        check(errs == [], '7. ingen sidefeil', errs[:3])
        await br.close()
    print('KAPPLOP ' + ('OK' if not FAIL else 'FEIL: ' + '; '.join(FAIL)))

asyncio.run(main())
