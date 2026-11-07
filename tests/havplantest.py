# Havsteget H2c (docs/planer/havsteget-h2-autoline.md, 05.11.2026): the autoliner on Driftsplan 2 in the built game with the whole coast.
#  - the day: the autoline in a loop on two fields (set, the soak, hauled through the hauling port and set again at once), round the clock
#    in the teams' watches, without you aboard (the teams have their own skipper and mate), the bait bought at the plant for the trip
#  - a week on the plan against a week of the same fields worked by hand (startSet/startHaul from a script): the catch within 15 %
#  - the shared clock: the same week played as catchUp plays it (playMinutes), the catch within 15 % of the open run
#  - the end of a trip: the hold at 95 %, the lenker hauled home to the magazines, the way to the plant, the landing on pallets, and out again
#  - the weather: over the plan's working limit the haul stops and she waits by the gear; over her lying-to limit she lies to (4.12j) and
#    the plan goes on when it eases; never to a shelter quay
#  - the page, standing and lying (800x1280 and 1280x800): the rows for the ocean vessel
#  - (H3c, 8) the snow crab vessel from Båtsfjord with 40 strings on Sentralbanken: the day dry, a few days on the plan against the same by
#    hand (and against H3b's figures), the same days played as catchUp, a frozen trip from the plant (out, the loop, to the plant with the
#    strings standing, landing, out again), and a season frozen and a season live against the landing notes (tonnes, trips, days between
#    landings); the page for the snow crab vessel in both formats
# LITE (no 3D). Needs the whole coast in tools/map/out/game (python3 tools/map/release.py and game.py).
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'
# python3 havplantest.py [1 2 …]: only those parts (all by default)
SEL = set(sys.argv[1:])
want = lambda k: not SEL or k in SEL

H = r"""window.HPT = (() => {
  const NATIVE = Math.random; function seed(s){ let a = s >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const T0 = Math.round((Date.UTC(2027, 2, 9, 6, 0) - EPOCH) / 6e4), when = t => 'D' + (Math.floor((t - T0) / 1440) + 1) + ' ' + driftClock(driftHod(t / 60));
  let plant = null, F = null, WHERE = '';
  // the autoliner at an ocean plant near Tromsøflaket (or near `where`: {plant:[lat, lon], ground:[lat, lon]}, the spot checks along the
  // coast), with the licence, her autoline, bait and hooks; the teams aboard, you ashore
  async function reset(sd, at, where){
    const wk = JSON.stringify(where || null); if (wk !== WHERE){ plant = null; F = null; WHERE = wk; }
    TAB.held = true; DYN.on = false; WX_FORCE = null; seed(sd || 1);
    S.fleet = S.fleet.filter(v => v.id === S.cur); S.t = T0; S.qseed = 12345; S.stock = initStock(); S.marks = []; S.sales = []; S.log = []; S.msgs = []; S.sets = []; S.gearLog = []; S.jobs = [];
    S.energy = 100; S.sleep = null; S.rest = null; S.skip = null; S.cash = 2e7; S.tut = 0; S.settings.autoOn = false; S.shelter = null; S.plan = null; S.tripOwner = false; S.ops = null;
    const b = S.boat; b.type = 'autoliner'; applyVessel(); S.lic = {id:'konv', hav:true, kf:3.49, hl:'Konvensjonell havfisketillatelse'}; freshQuota();
    S.pgear = newPGear(); const pg = S.pgear; autoL(pg); careInit(pg); baitOf(pg).saury = 3000; baitOf(pg).blekksprut = 3000; pg.hooks = 30000;
    S.crew = []; S.lag = null; lagOf();
    if (!plant){ const tgt = where ? P(where.plant[0], where.plant[1]) : P(70.3, 19.0); plant = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'autoliner')).sort((a, c) => dist(a.p, tgt) - dist(c.p, tgt))[0]; await mapNeed(plant.p, 8); }
    if (!F){ const GR = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})), t2 = where ? P(where.ground[0], where.ground[1]) : P(71.0, 17.0), g = where && where.raw ? t2 : GR.sort((a, c) => dist(a, t2) - dist(c, t2))[0];   // (raw: the point itself, where the NPC autoliners' nearest ground is in another zone) await mapNeed(g, 30);
      // two fields 15 km apart on the ground, clear of the rules (§ 26 and § 32) and with room for a string of four lenker (26 km)
      const C = []; for (let r = 0; r < 45 && C.length < 2; r += 2.5) for (let a = 0; a < 16 && C.length < 2; a++){ const q = {x:g.x + r * Math.sin(a * 0.39), y:g.y - r * Math.cos(a * 0.39)};
        try { if (isLand(q) || depthF(q) < 50 || ruBlockMsg({p:q, len:BOAT.len, gear:'line', sp:null}) || !setGeom(q, 0, 26) || C.some(z => dist(z, q) < 15)) continue; } catch (e){ continue; } C.push(q); }
      F = C; }
    b.fuel = BOAT.fuelCap; b.prov = null; b.trip = null; S.hold = []; b.land = null; b.landWait = null; b.gop = null; b.fishUntil = null; b.hove = null; b.anch = null; b.v = 0;
    if (at === 'sea'){ b.status = 'idle'; b.port = null; b.pos = {x:F[0].x, y:F[0].y}; b.heading = Math.PI / 2; }
    else { b.status = 'port'; b.port = plant.id; b.pos = {x:plant.p.x, y:plant.p.y}; b.berth = 'main'; }
    S.me = 'ashore';
    return {plant:plant.name, F:F.map(q => LL(q)), n:F.length};
  }
  const felt = (id, q, n, soak) => ({id, k:'felt', x:q.x, y:q.y, n, soak, hdg:null, lk:'auto'});
  function plan(over){ const o = S.ops = plan2New(Object.assign({home:plant.id, rig:'line', places:[felt('f1', F[0], 4, 6), felt('f2', F[1], 4, 6)], land:{mode:'port', port:plant.id, when:'full', days:42}}, over || {})); return o; }
  const make = o => new Promise(res => plan2Make(o, res));
  const st = (b, o) => { const pl = S.plan, r = o.run; return (pl && pl.ops ? pl.opsK : pl ? 'own' : '-') + ':' + b.status + (b.port ? '@' + (portById(b.port) || {}).name : '') + (b.gop ? '/' + b.gop.op : '') + (b.hove ? '/bi' : '') + (b.land ? '/land' : '') + (r && r.wait ? '?' + r.wait.k : '') + (o.stop ? '!stop:' + o.stop.k : '') + (!o.on ? '!off' : ''); };
  // play n minutes: 'open' steps with the page let go every ten minutes, 'closed' as catchUp (playMinutes)
  async function run(n, mode, hook){
    const b = S.boat, o = S.ops, L = {ev:[], log0:S.log.length, msg0:S.msgs.length, t0:S.t, days:[], kg0:holdTotal()}; let was = null, d0 = null, k = 0;
    // (closed: as catchUp, an hour at a time; playMinutes stops where the simulation's map is not in yet (simAreaReady) and the game plays
    // the rest when it is, CATCH_LEFT, so here the map is let in and the hour played on)
    if (mode === 'closed'){ const T1 = S.t + n; let i = 0, idle = 0; while (S.t < T1 && idle < 400){ if (hook) hook(i); const t0 = S.t; playMinutes(Math.min(60, T1 - S.t), true); CATCH_LEFT = 0; i += S.t - t0;
        if (S.t === t0){ idle++; await new Promise(r => setTimeout(r, 50)); } else idle = 0; const s2 = st(b, o); if (s2 !== was){ L.ev.push([when(S.t), s2, Math.round(holdTotal())]); was = s2; } } L.idle = idle; }
    // (open: as the game's loop, a minute only when the simulation's map round the boat is in, 08-actions.js tick)
    else for (let i = 0; i < n; i++){ let w = 0; while (!simAreaReady() && w++ < 400){ const R = Math.random; Math.random = NATIVE; await new Promise(r => setTimeout(r, 25)); Math.random = R; } if (hook) hook(i); DYN.on = false; step(); const r = o.run; if (r && r.day && r.t0 !== d0){ d0 = r.t0; if (L.days.length < 4) L.days.push({at:when(S.t), text:planDayText(o, r.day).map(x => x[0] + ' ' + x[1]).slice(0, 14)}); }
      const s2 = st(b, o); if (s2 !== was){ L.ev.push([when(S.t), s2, Math.round(holdTotal())]); was = s2; } if (mode === 'open' && ++k % 10 === 0){ const R = Math.random; Math.random = NATIVE; await new Promise(r => setTimeout(r, 0)); Math.random = R; } }
    L.log = S.log.slice(L.log0).map(e => [when(e.t), (e.no || '').slice(0, 170)]); L.msgs = S.msgs.slice(L.msg0).map(m => [when(m.t), (m.no || '').slice(0, 200)]);
    L.gear = (S.gearLog || []).filter(e => (e.tSet || 0) >= L.t0).map(e => ({n:e.n, set:when(e.tSet), haul:e.tHaul ? when(e.tHaul) : null, kg:e.kg}));
    L.caught = Math.round((o.stats.sum.caught || 0)); L.landed = Math.round(o.stats.sum.kg || 0); L.hold = Math.round(holdTotal()); L.trips = o.stats.sum.trips;
    L.ops = {on:o.on, stop:o.stop, wait:o.run && o.run.wait && o.run.wait.no, M:o.M}; return L;
  }
  // a week by hand: the same two fields worked as the plan works them (the empty field set first, then the string longest in the sea
  // hauled when its soak is up and set again at once), the boat steaming between them at her cruising speed (the time waited, then moved)
  async function hand(mins, soak){
    const b = S.boat, pg = S.pgear, k0 = holdTotal(), T1 = S.t + mins; let wait = 0, to = null, n = 0;
    while (S.t < T1){
      if (!b.gop && b.status !== 'port' && S.t >= wait){
        if (to){ b.pos = {...to.p}; b.status = 'idle'; to.f(); to = null; }
        else { const sets = mySets(), due = sets.filter(s => !s.hauling && S.t - s.tSet >= soak * 60).sort((a, c) => a.tSet - c.tSet)[0];
          const e = F.map((q, j) => ({q, j})).find(x => !sets.some(s => s.fid === 'h' + x.j) && autoL(pg).n >= 4);
          const job = e ? {p:e.q, f:() => startSet('line', {lk:'auto', n:4, fid:'h' + e.j}, 0)} : due ? {p:due.a, f:() => { n++; return startHaul(due.id, true, 0); }} : null;
          if (job){ const m = Math.round(kmTrue(b.pos, job.p) / (BOAT.vcruise * NM) * 60); if (m > 2){ to = job; wait = S.t + m; } else { b.pos = {...job.p}; b.status = 'idle'; job.f(); } } }
      }
      DYN.on = false; step();
    }
    return {kg:Math.round(holdTotal() - k0), hauls:n, log:S.log.slice(-3).map(e => e.no)};
  }
  return {seed, reset, plan, make, run, hand, when, T0, get F(){ return F; }, get plant(){ return plant; }};
})();"""

# the snow crab vessel (H3c): at Båtsfjord with her permit, 8 000 pots, 40 buoy sets with heavy anchors and squid; two fields of 20
# strings on Sentralbanken (74.8° N 34.6° E and 74.9° N 35.4° E) at the banks' depth where the rules allow the pots
HS = r"""window.SNO = (() => {
  let plant = null, F = null, LOG = [];
  // (the season from 4 January 2027, the year's fresh quota; the few days against H3b in February, at H3b's place, 74.8° N 34° E)
  const T0 = Math.round((Date.UTC(2027, 0, 4, 6, 0) - EPOCH) / 6e4), TF = Math.round((Date.UTC(2027, 1, 8, 6, 0) - EPOCH) / 6e4);
  async function reset(sd, at, t0){
    TAB.held = true; DYN.on = false; WX_FORCE = null; HPT.seed(sd || 1);
    S.fleet = S.fleet.filter(v => v.id === S.cur); S.t = t0 != null ? t0 : T0; S.qseed = 12345; S.stock = initStock(); S.marks = []; S.sales = []; S.log = []; S.msgs = []; S.sets = []; S.gearLog = []; S.jobs = [];
    S.energy = 100; S.sleep = null; S.rest = null; S.skip = null; S.cash = 5e7; S.tut = 0; S.settings.autoOn = false; S.shelter = null; S.plan = null; S.tripOwner = false; S.ops = null; S.snoSoft = null;
    const b = S.boat; if (S.lic){ try { regFree(S.lic.id); } catch (e){} }
    b.type = 'snokrabbe'; applyVessel(); b.rig = 'teiner'; S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'}; S.quota = null; freshQuota(); b.snoMode = 'frys'; b.tankFull = null;
    S.pgear = newPGear(); const pg = S.pgear; careInit(pg); pg.pots.sno = 8000; pg.kits.n = 40; pg.kits.heavy = 40; baitOf(pg).blekksprut = 20000;
    S.crew = []; S.lag = null; lagOf();
    if (!plant){ const tgt = P(70.63, 29.72); plant = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'snokrabbe')).sort((a, c) => dist(a.p, tgt) - dist(c.p, tgt))[0]; await mapNeed(plant.p, 8); }
    if (!F){ F = []; for (const [la, lo] of [[74.8, 34.0], [74.95, 34.6]]){ let q0 = null; for (let k = 0; k < 200 && !q0; k++){ const q = P(la + 0.15 * Math.sin(k * 0.7), lo + 0.4 * Math.cos(k * 1.3)); await mapNeed(q, 26);
        const d = depthF(q); if (isLand(q) || d < 230 || d > 340 || ruBlockMsg({p:q, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'})) continue;
        const f = {id:'s' + F.length, k:'felt', x:q.x, y:q.y, n:20, soak:168, hdg:null}; let ok = true; for (let j = 0; j < 20 && ok; j++) if (p2SnoFit(f, j)) ok = false; if (ok) q0 = q; } if (q0) F.push(q0); } }
    b.fuel = BOAT.fuelCap; b.prov = null; b.trip = null; S.hold = []; b.land = null; b.landWait = null; b.gop = null; b.fishUntil = null; b.hove = null; b.anch = null; b.v = 0;
    if (at === 'sea'){ b.status = 'idle'; b.port = null; b.pos = {x:F[0].x, y:F[0].y}; b.heading = 0; }
    else { b.status = 'port'; b.port = plant.id; b.pos = {x:plant.p.x, y:plant.p.y}; b.berth = 'main'; }
    S.me = 'ashore'; LOG = [];
    return {plant:plant.name, F:F.map(q => LL(q)), n:F.length, depth:F.map(q => Math.round(depthF(q)))};
  }
  const plan = over => { const o = S.ops = plan2New(Object.assign({home:plant.id, rig:'teiner', places:F.map((q, i) => ({id:'s' + i, k:'felt', x:q.x, y:q.y, n:20, soak:168, hdg:null})), land:{mode:'port', port:plant.id, when:'days', days:20}}, over || {})); return o; };
  // the strings of the plan already in the sea, stood `days` (one an hour after the other), as the plan sets them (p2SnoLenke)
  function stand(o, days){ const pg = S.pgear, T1 = S.t - days * 1440; let n = 0;
    for (const q of o.places) for (let k = 0; k < q.n; k++){ const L = p2SnoLenke(q, k); S.sets.push({id:'k' + n, vid:S.cur, fid:L.fid, kind:'teine', pot:'sno', n:200, a:{...L.a}, b:{...L.b}, tSet:T1 + n * 60, acc:{}, dead:0, bait:'blekksprut', cond:1, heavy:true, depth:Math.round(depthF(L.a)), warn:0}); n++; }
    pg.pots.sno -= n * 200; pg.kits.n -= n; pg.kits.heavy -= n;
    const tNow = S.t; for (let h = 0; h < days * 24; h++){ S.t = T1 + h * 60; const H = S.t / 60; for (const s of S.sets) if (S.t > s.tSet) soakHour(s, H); } S.t = tNow; return n; }
  // the landings on the plan: the round weight on each quota (the note's sno), the money, the day
  const R0 = plan2Report; plan2Report = function (pid, kg, total, landed){ R0(pid, kg, total, landed); const L = S.lastSale || {}; if (landed && L.t === S.t) LOG.push({t:S.t, d:HPT.when ? gDate(S.t / 60).toISOString().slice(0, 10) : '', ord:Math.round(L.sno ? L.sno.ord : 0), tq:Math.round(L.sno ? L.sno.tq : 0), live:Math.round(L.sno ? L.sno.live : 0), conf:Math.round(L.confKg || 0), kr:Math.round(total)}); };
  // the strings by hand, as the plan works them: the one that has stood its soak longest is hauled and set out again at once, the ship
  // steaming between them at her cruising speed (the time waited, then moved), for `mins`
  async function hand(mins, soakD){
    const b = S.boat, k0 = holdTotal(), T1 = S.t + mins; let wait = -Infinity, to = null, n = 0;   // (the clock is negative before EPOCH)
    while (S.t < T1){
      if (!b.gop && b.status !== 'port' && S.t >= wait){
        if (to){ b.pos = {...to.p}; b.status = 'idle'; to.f(); to = null; }
        else { const due = mySets().filter(s => !s.hauling && S.t - s.tSet >= soakD * 1440).sort((a, c) => a.tSet - c.tSet)[0];
          if (due){ const job = {p:due.a, f:() => { n++; return startHaul(due.id, true, 0); }}, m = Math.round(kmTrue(b.pos, job.p) / (BOAT.vcruise * NM) * 60); if (m > 2){ to = job; wait = S.t + m; } else { b.pos = {...job.p}; b.status = 'idle'; job.f(); } } }
      }
      DYN.on = false; step();
    }
    return {kg:Math.round(holdTotal() - k0), hauls:n};
  }
  return {reset, plan, stand, hand, T0, TF, get LOG(){ return LOG; }, get F(){ return F; }, get plant(){ return plant; }};
})();"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate(H)
        await pg.evaluate(HS)
        # the crew's own life (a fever, a wedding) is not what is tested here
        await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        if want('1'):
            print('== 1: dagen på planen, tørt: fra mottaket og ute på havet')
            R = await pg.evaluate("""(async () => { const R = await HPT.reset(3, 'port'); if (R.n < 2) return R; const o = HPT.plan(); R.check = plan2Check(o);
              R.day = planDayText(o, planDay(o, S.t / 60)).map(x => x[0] + ' ' + x[1]);
              await HPT.reset(3, 'sea'); const o2 = HPT.plan(); const d2 = planDay(o2, S.t / 60); R.daySea = planDayText(o2, d2).map(x => x[0] + ' ' + x[1]);
              R.k = d2.steps.map(s => s.k + (s.again ? '+' : '') + (s.reset ? 'r' : ''));
              // the trip's end: the hold at 95 %: the strings hauled home to the magazines, nothing set, then the plant
              S.hold.push({sp:'torsk', kg:capHold() * 0.96 * 1.5, n:9e4, cls:0, fresh:100, gut:true, iced:true, frozen:true, bled:true, hr:0, hook:true});
              S.sets = []; for (const [i, q] of HPT.F.entries()) S.sets.push({id:'t' + i, vid:S.cur, fid:'f' + (i + 1), kind:'line', lk:'auto', n:4, hooks:20000, a:{...q}, b:{x:q.x + 5, y:q.y}, tSet:S.t - 3 * 60, acc:{}});
              o2.M = HPT.plant.id; const d3 = planDay(o2, S.t / 60); R.dayEnd = planDayText(o2, d3).map(x => x[0] + ' ' + x[1]); R.kEnd = d3.steps.map(s => s.k + (s.reset ? 'r' : ''));
              return R; })()""")
            print('  oppsett:', R.get('plant'), R.get('F'))
            if R.get('n', 0) < 2: print('FEIL fant ikke to felt på autolinefeltet'); await b.close(); return
            print('  sjekk:', R['check']['errors'], R['check']['warnings'])
            print('  fra mottaket:'); [print('    ', x) for x in R['day'][:12]]
            print('  ute på havet:'); [print('    ', x) for x in R['daySea'][:14]]
            print('  turen er over:'); [print('    ', x) for x in R['dayEnd'][:10]]
            print(ok(R['check']['ok']), 'the plan for the autoliner is ready without you aboard (the teams have their own skipper and mate)', R['check']['errors'])
            k = R['k']; print(ok(k[:2] == ['avgang', 'lagvakt'] and k.count('sett') == 2 and 'trekkr' in k and 'sett+' in k and 'lever' not in k and 'hjem' not in k), 'at sea: both fields set, hauled when due and set again at once by the machine, no way home or to the plant', k)
            ke = R['kEnd']; print(ok('sett' not in ke and 'sett+' not in ke and ke.count('trekk') == 2 and ke[-1] == 'lever'), 'the hold at 95 %: the strings hauled home to the magazines, nothing set, then the plant', ke)
        if want('2'):
            print('== 2: tre døgn på planen fra mottaket, uten deg om bord')
            L = await pg.evaluate("""(async () => { await HPT.reset(5, 'port'); const o = HPT.plan(); const err = await HPT.make(o); if (err) return {err}; plan2Start(o);
              const W = [], c0 = S.cash, b0 = baitKg(S.pgear); const L = await HPT.run(3 * 1440, 'open', i => { if (i % 180 === 0) W.push(workAssign().filter(q => q.c && q.c.anon).length); }); L.W = W;
              L.bait = [b0, Math.round(baitKg(S.pgear))]; L.lag = lagN(); return L; })()""")
            if L.get('err'): print('FEIL plan2Make:', L['err'])
            else:
                for e in L['ev'][:24]: print('    ', e)
                for e in [x for x in L['log'] if 'agn' in x[1].lower() or 'Satte' in x[1] or 'Trakk' in x[1]][:12]: print('     log', e)
                hauls = [g for g in L['gear'] if g['haul']]
                print('  hauls', [(g['set'], g['haul'], g['kg']) for g in hauls], 'on deck', L['W'][:12], 'ops', L['ops'])
                print(ok(L['ops']['on'] and not L['ops']['stop'] and len(hauls) >= 3 and all(g['kg'] > 0 for g in hauls) and L['hold'] > 5000), 'three days without you aboard: the lenker set, hauled and set again, the catch aboard', [len(hauls), L['hold']])
                print(ok(L['bait'][1] > L['bait'][0] and any('Kjøpte agn for turen' in x[1] for x in L['log'])), 'the bait for the trip bought at the plant before she went out (squid and saury)', L['bait'])
                print(ok(min(L['W']) >= 4 and not any('ly' in e[1].split(':')[0] or 'home' in e[1].split(':')[0] for e in L['ev'])), 'the teams on deck in their watches all the while, never home or to a shelter', [min(L['W']), max(L['W'])])
        if want('3'):
            print('== 3: en uke på planen mot en uke for hånd, og en uke spilt som catchUp')
            W = await pg.evaluate("""(async () => { const R = {}, week = 7 * 1440;
              await HPT.reset(11, 'sea'); { const o = HPT.plan(); const err = await HPT.make(o); if (err) return {err}; plan2Start(o); const t0 = performance.now(); const L = await HPT.run(week, 'open'); R.open = {kg:Math.round(holdTotal()), hauls:L.gear.filter(g => g.haul).length, ms:Math.round(performance.now() - t0), wait:L.ops.wait, stop:L.ops.stop, waits:L.ev.filter(e => e[1].includes('?')).map(e => e[0] + ' ' + e[1]).slice(0, 12), gear:L.gear.map(g => g.set + '>' + g.haul + ':' + g.kg)}; }
              await HPT.reset(11, 'sea'); { const o = HPT.plan(); await HPT.make(o); plan2Start(o); const t0 = performance.now(); const L = await HPT.run(week, 'closed'); R.closed = {kg:Math.round(holdTotal()), hauls:L.gear.filter(g => g.haul).length, ms:Math.round(performance.now() - t0), gear:L.gear.map(g => g.set + '>' + g.haul + ':' + g.kg)}; }
              await HPT.reset(11, 'sea'); { S.ops = null; const t0 = performance.now(); R.hand = await HPT.hand(week, 6); R.hand.ms = Math.round(performance.now() - t0); }
              return R; })()""")
            if W.get('err'): print('FEIL plan2Make:', W['err'])
            else:
                print('  ', W)
                d = abs(W['open']['kg'] - W['hand']['kg']) / max(1, W['hand']['kg']); dc = abs(W['closed']['kg'] - W['open']['kg']) / max(1, W['open']['kg'])
                print(ok(d <= 0.15), 'a week on the plan catches as a week by hand on the same fields (within 15 %%): %d kg against %d kg, %.1f %%' % (W['open']['kg'], W['hand']['kg'], 100 * d))
                print(ok(dc <= 0.15 and W['closed']['hauls'] >= W['open']['hauls'] - 2), 'the week played as catchUp plays it (the game closed): %d kg against %d kg open, %.1f %%' % (W['closed']['kg'], W['open']['kg'], 100 * dc))
        if want('4'):
            print('== 4: turen er over: lasten full, lenkene inn, lossing på paller, nytt skift og ut igjen')
            T = await pg.evaluate("""(async () => { await HPT.reset(7, 'sea'); const o = HPT.plan(); const err = await HPT.make(o); if (err) return {err}; plan2Start(o);
              await HPT.run(30 * 60, 'open');
              // the hold nearly full of frozen fish: the next haul fills it past 95 %
              const want = capHold() * 0.93 - holdLoad(); S.hold.push({sp:'torsk', kg:want * 1.5, n:Math.round(want / 3), cls:0, fresh:100, gut:true, iced:true, frozen:true, bled:true, hr:0, hook:true});
              const sh0 = lagOf().on; const L = await HPT.run(6 * 1440, 'open'); L.sh = [sh0, lagOf().on]; L.aboard = autoL().n; L.inSea = mySets().length; return L; })()""")
            if T.get('err'): print('FEIL plan2Make:', T['err'])
            else:
                for e in T['ev'][:40]: print('    ', e)
                for e in [x for x in T['log'] if any(w in x[1] for w in ['Lasten', 'paller', 'Skift', 'agn', 'Losset', 'Landet', 'lott', 'Fyller', 'Proviant', 'Skipshandel', 'Avgang', 'venter', 'Går'])][:20]: print('     log', e)
                full = [x for x in T['log'] if 'Trekker det som står inn på magasinene' in x[1]]
                print(ok(full and T['trips'] >= 1 and T['landed'] > 100000 and T['sh'][0] != T['sh'][1]), 'the hold at 95 %: the strings hauled home, the landing at the plant, the other crew signs on', [len(full), T['trips'], T['landed'], T['sh']])
                out = [e for e in T['ev'] if e[1].startswith('fish:') and 'set' in e[1]]
                print(ok(T['ops']['on'] and not T['ops']['stop'] and out and T['hold'] < T['landed']), 'and out again on the next trip', [T['ops'], len(out), T['hold']])
        if want('5'):
            print('== 5: været: over arbeidsgrensen venter skipet ved lina, over grensen for å ligge bi ligger det bi, og planen går videre når det løyer')
            X = await pg.evaluate("""(async () => { await HPT.reset(9, 'sea'); const o = HPT.plan(); const err = await HPT.make(o); if (err) return {err}; plan2Start(o); const R = {lim:o.wx, lie:[windLim(), seaLim()]};
              await HPT.run(14 * 60, 'open'); R.before = {sets:mySets().length, gop:!!S.boat.gop};
              WX_FORCE = {w:20, d:240}; const A = await HPT.run(3 * 60, 'open'); R.A = {ev:A.ev.slice(0, 8), wait:o.run && o.run.wait && o.run.wait.k, hs:+hsAt(S.boat.pos, S.t / 60).toFixed(1), gop:!!S.boat.gop, hove:!!S.boat.hove, log:A.log.filter(x => /grensen|Stopper|ly/.test(x[1])).slice(0, 4), ly:!!(S.plan && S.plan.opsK === 'ly'), status:S.boat.status};
              WX_FORCE = {w:28, d:240}; const B = await HPT.run(3 * 60, 'open'); R.B = {hove:!!S.boat.hove, log:B.log.filter(x => /bi/.test(x[1])).slice(0, 3), port:S.boat.status === 'port', hs:+hsAt(S.boat.pos, S.t / 60).toFixed(1)};
              WX_FORCE = {w:7, d:240}; const C = await HPT.run(10 * 60, 'open'); R.C = {hove:!!S.boat.hove, log:C.log.filter(x => /løyet|Trekker|Setter/.test(x[1])).slice(0, 4), on:o.on, stop:o.stop, ev:C.ev.slice(0, 8)};
              WX_FORCE = null;
              // how often the working limit holds the gear in a year at the first field (every 3 hours, the game's own weather)
              const p0 = HPT.F[0], H0 = S.t / 60; let n = 0, w = 0, lie = 0; for (let k = 0; k < 365 * 8; k++){ const Hk = H0 + 3 * k, W = windAt(Hk, p0), hs = hsAt(p0, Hk); n++; if (W > o.wx.wind || hs > o.wx.hs) w++; if (W > windLim() || hs > seaLim()) lie++; }
              R.year = {work:+(100 * w / n).toFixed(1), lie:+(100 * lie / n).toFixed(1)}; return R; })()""")
            if X.get('err'): print('FEIL plan2Make:', X['err'])
            else:
                print('  ', json.dumps(X, ensure_ascii=False)[:1400])
                print(ok(X['A']['wait'] == 'wx' and not X['A']['gop'] and not X['A']['ly'] and X['A']['status'] != 'port'), 'over the working limit (20 m/s, %.1f m): the work stops and she waits by the gear, not to a shelter quay' % X['A']['hs'], X['A']['log'])
                print(ok(X['B']['hove'] and not X['B']['port']), 'over her lying-to limit (28 m/s, %.1f m): she lies to where she is' % X['B']['hs'], X['B']['log'])
                print(ok(not X['C']['hove'] and X['C']['on'] and not X['C']['stop'] and any('Trekker' in x[1] or 'Setter' in x[1] for x in X['C']['log'])), 'when it eases the plan goes on with the gear', X['C']['log'])
                print('  året ved felt 1: arbeidet holdt igjen %.1f %% av tida, ligge bi %.1f %%' % (X['year']['work'], X['year']['lie']))
        if want('7'):
            print('== 7: stikkprøver langs kysten: to døgn med planen fra et mottak i nord-øst, midt og sør')
            for nm_, pl_, gr_ in [('Båtsfjord', [70.63, 29.72], [71.3, 30.5]), ('Ålesund', [62.47, 6.15], [62.9, 5.2]), ('Egersund', [58.45, 5.99], [58.25, 4.9])]:
                Q = await pg.evaluate("""(async (w) => { const R = await HPT.reset(13, 'port', w); if (R.n < 2) return R; const o = HPT.plan(); R.check = plan2Check(o); if (!R.check.ok) return R;
                  const err = await HPT.make(o); if (err) return Object.assign(R, {err}); plan2Start(o); const L = await HPT.run(2 * 1440, 'closed');
                  R.M = (portById(o.M) || {}).name; R.hauls = L.gear.filter(g => g.haul).length; R.sets = L.gear.length; R.hold = L.hold; R.ops = L.ops; R.ev = L.ev.slice(0, 8); R.at = LL(S.boat.pos); R.log = L.log.slice(-5); R.wp = S.plan ? [S.plan.idx, S.plan.wps.length, S.boat.v] : null; return R; })""", {'plant': pl_, 'ground': gr_, 'raw': nm_ == 'Egersund'})
                print('  ', nm_, json.dumps(Q, ensure_ascii=False)[:900])
                good = Q.get('n', 0) >= 2 and Q.get('check', {}).get('ok') and not Q.get('err') and Q.get('hauls', 0) >= 1 and Q.get('hold', 0) > 1000 and Q['ops']['on'] and not Q['ops']['stop']
                print(ok(good), 'spot check %s: the plan made, out from %s, the lenker set and hauled, fish aboard' % (nm_, Q.get('plant')), [Q.get('F'), Q.get('hauls'), Q.get('hold'), Q.get('err'), (Q.get('check') or {}).get('errors')])
        if want('8'):
            print('== 8: snøkrabbefartøyet (H3c): 40 lenker på Sentralbanken fra Båtsfjord')
            R = await pg.evaluate("""(async () => { const R = await SNO.reset(3, 'port'); if (R.n < 2) return R; const o = SNO.plan(); R.check = plan2Check(o);
              R.day = planDayText(o, planDay(o, S.t / 60)).map(x => x[0] + ' ' + x[1]).slice(0, 16);
              await SNO.reset(3, 'sea'); const o2 = SNO.plan(); SNO.stand(o2, 7); const d2 = planDay(o2, S.t / 60); R.daySea = planDayText(o2, d2).map(x => x[0] + ' ' + x[1]).slice(0, 12); R.k = d2.steps.map(s => s.k + (s.again ? '+' : ''));
              return R; })()""")
            print('  oppsett:', R.get('plant'), R.get('F'), R.get('depth'))
            if R.get('n', 0) < 2: print('FEIL fant ikke to felt på Sentralbanken'); await b.close(); return
            print('  sjekk:', R['check']['errors'], R['check']['warnings'])
            print('  fra mottaket:'); [print('    ', x) for x in R['day']]
            print('  ute ved lenkene:'); [print('    ', x) for x in R['daySea']]
            print(ok(R['check']['ok']), 'the plan for the snow crab vessel is ready without you aboard', R['check']['errors'])
            print(ok(R['k'][:2] == ['avgang', 'lagvakt'] and 'trekk' in R['k'] and 'sett+' in R['k'] and 'lever' not in R['k']), 'at sea: the strings that have stood their week are hauled and set out again at once, the day ends by them', R['k'][:12])
            # a few days on the plan against the same by hand, and played as catchUp
            W = await pg.evaluate("""(async () => { const R = {}, days = 4, mins = days * 1440;
              await SNO.reset(11, 'sea', SNO.TF); { const o = SNO.plan(); SNO.stand(o, 7); const err = await HPT.make(o); if (err) return {err}; plan2Start(o); const t0 = performance.now(); const L = await HPT.run(mins, 'open');
                R.open = {kg:Math.round(holdTotal()), prod:Math.round(holdLoad()), hauls:L.log.filter(x => /^Trakk teiner/.test(x[1])).length, ms:Math.round(performance.now() - t0), wait:L.ops.wait, stop:L.ops.stop, lost:(S.sets || []).filter(s => s.lost).length, inSea:mySets().length, waits:L.ev.filter(e => e[1].includes('?')).map(e => e[0] + ' ' + e[1]).slice(0, 8), log:L.log.filter(x => /Sortert|Trekker teiner|Setter/.test(x[1])).slice(0, 4), long:(() => { const o2 = []; for (let i = 1; i < L.ev.length; i++) if (L.ev[i - 1][1] === 'fish:fishing') o2.push(L.ev[i - 1][0] + '→' + L.ev[i][0]); return o2.slice(0, 6); })(), ev:L.ev.length}; }
              await SNO.reset(11, 'sea', SNO.TF); { const o = SNO.plan(); SNO.stand(o, 7); await HPT.make(o); plan2Start(o); const t0 = performance.now(); const L = await HPT.run(mins, 'closed'); R.closed = {kg:Math.round(holdTotal()), hauls:L.log.filter(x => /^Trakk teiner/.test(x[1])).length, ms:Math.round(performance.now() - t0)}; }
              await SNO.reset(11, 'sea', SNO.TF); { const o = SNO.plan(); SNO.stand(o, 7); S.ops = null; const t0 = performance.now(); R.hand = await SNO.hand(mins, 7); R.hand.ms = Math.round(performance.now() - t0); R.hand.log = S.log.slice(-4).map(e => e.no.slice(0, 90)); }
              R.days = days; return R; })()""")
            if W.get('err'): print('FEIL plan2Make:', W['err'])
            else:
                print('  ', json.dumps(W, ensure_ascii=False)[:1400])
                d = abs(W['open']['kg'] - W['hand']['kg']) / max(1, W['hand']['kg']); dc = abs(W['closed']['kg'] - W['open']['kg']) / max(1, W['open']['kg'])
                print(ok(d <= 0.15 and W['open']['hauls'] >= 10), 'four days on the plan catch as four days by hand on the same strings (within 15 %%): %d kg against %d kg round weight, %.1f %% (%d and %d hauls)' % (W['open']['kg'], W['hand']['kg'], 100 * d, W['open']['hauls'], W['hand']['hauls']))
                pd = W['open']['kg'] / 1000 / W['days']; dh = abs(pd - 5.7) / 5.7
                print(ok(dh <= 0.15), 'and as H3b by hand on Sentralbanken in February: %.1f t round weight a fishing day against 5.7 t (%.1f %%)' % (pd, 100 * dh))
                print(ok(dc <= 0.15 and W['closed']['hauls'] >= W['open']['hauls'] - 2), 'the days played as catchUp plays them (the game closed): %d kg against %d kg open, %.1f %%' % (W['closed']['kg'], W['open']['kg'], 100 * dc))
            # a frozen trip from the plant: out, the strings set, the loop, the trip's days, to the plant with the strings standing, the landing, out again
            T = await pg.evaluate("""(async () => { await SNO.reset(7, 'port', SNO.TF); const o = SNO.plan(); SNO.stand(o, 4); const err = await HPT.make(o); if (err) return {err}; plan2Start(o); const T0 = S.t;
              const L = await HPT.run(26 * 1440, 'closed'); L.tripD = SNO.LOG.length ? (SNO.LOG[0].t - T0) / 1440 : null; L.LOG = SNO.LOG; L.inSea = mySets().length; L.after = SNO.LOG.length ? (S.gearLog || []).filter(e => e.tHaul && e.tHaul > SNO.LOG[0].t).length : 0; L.firstHaul = (S.gearLog || []).filter(e => e.tHaul).map(e => e.tHaul).sort((a, c) => a - c)[0]; L.t0 = SNO.T0; L.potsAboard = S.pgear.pots.sno; L.on = o.on; L.stop = o.stop; L.wait = o.run && o.run.wait && o.run.wait.no;
              L.ev = L.ev.slice(0, 40); L.loglines = L.log.filter(x => /Tankene|Lasten|turen|Turen|Kjøpte|Leverer|Skift|lever|fredning|drivis|Drivis/.test(x[1])).slice(0, 14); delete L.log; delete L.msgs; delete L.gear; return L; })()""")
            if T.get('err'): print('FEIL plan2Make:', T['err'])
            else:
                for e in T['ev'][:30]: print('    ', e)
                for e in T['loglines']: print('     log', e)
                print('   landings', T['LOG'], 'in sea', T['inSea'], 'aboard', T['potsAboard'], T['wait'])
                t1 = T['LOG'][0]['ord'] / 1000 if T['LOG'] else 0; dt = abs(t1 - 95) / 95
                print(ok(T['LOG'] and dt <= 0.15 and T['inSea'] >= 30 and T['on'] and not T['stop']), 'a frozen trip on the plan from the plant (the strings standing): %.1f t round weight landed after %.1f days, against H3b by hand about 95 t a trip of 20 days (%.1f %%), and the strings stood in the sea while she landed (%d)' % (t1, T['tripD'] or 0, 100 * dt, T['inSea']))
                print(ok(T['after'] >= 3), 'and out again to the strings after the landing: %d strings hauled since' % T['after'])
        if want('9'):
            print('== 9: sesongen mot sedlene: fryst og levende, fra januar til kvoten er tatt eller fredningen')
            for mode in ['frys', 'lev']:
                Z = await pg.evaluate("""(async (mode) => { await SNO.reset(21, 'port'); S.boat.snoMode = mode; const o = SNO.plan(); const err = await HPT.make(o); if (err) return {err}; plan2Start(o); const t0 = performance.now();
                  const Q = snoQuota(S.t / 60), end = (Date.UTC(2027, 6, 1) - EPOCH) / 6e4; let lastY = 0;
                  while (S.t < end){ await HPT.run(10 * 1440, 'closed'); const q = quotaState(); if (o.run && o.run.wait && o.run.wait.k === 'idle' && !mySets().length && holdTotal() < 1) break; if (performance.now() - t0 > 400000) break; }
                  const q = quotaState(), LOG = SNO.LOG, gaps = LOG.slice(1).map((x, i) => (x.t - LOG[i].t) / 1440);
                  const lost = (S.sets || []).filter(s => s.lost).length, ms = Math.round(performance.now() - t0);
                  return {mode, Q:{base:Q.base, max:Q.max, extra:Q.extra}, ord:q.snokrabbe, tq:q.snoTq, conf:q.conf, n:LOG.length, LOG:LOG.map(x => [x.d, Math.round((x.ord + x.tq) / 100) / 10, Math.round(x.live / 100) / 10, Math.round(x.kr / 1e5) / 10]), gaps:gaps.map(g => +g.toFixed(1)), lost, ms, until:gDate(S.t / 60).toISOString().slice(0, 10), wait:o.run && o.run.wait && o.run.wait.no, inSea:mySets().length}; })""", mode)
                if Z.get('err'): print('FEIL plan2Make:', Z['err']); continue
                print('  ', json.dumps(Z, ensure_ascii=False)[:1600])
                gaps = sorted(Z['gaps']); med = gaps[len(gaps) // 2] if gaps else 0; tot = (Z['ord'] + Z['tq']) / 1000; per = sorted([x[1] for x in Z['LOG']]); pmed = per[len(per) // 2] if per else 0
                if mode == 'frys': good = 300 <= tot <= 520 and 3 <= Z['n'] <= 8 and 14 <= med <= 26
                else: good = 380 <= tot <= 620 and 8 <= Z['n'] <= 22 and 6 <= med <= 13
                print(ok(good), 'season %s: %.0f t round weight in %d landings (median %.1f t), median %.1f days between landings, %d strings lost, until %s (the notes: %s)' % (mode, tot, Z['n'], pmed, med, Z['lost'], Z['until'], 'frozen 99-127 t a landing, 19-20 days between, about 430 t a vessel in 2026' if mode == 'frys' else 'live 21-32 t a landing, 8-9 days between, about 430 t a vessel in 2026'))
        if want('6'):
            print('== 6: siden i begge formater')
            await pg.evaluate("""(async () => { await HPT.reset(5, 'port'); const o = HPT.plan(); await HPT.make(o); TAB.held = false; })()""")
            for w, h in [(800, 1280), (1280, 800)]:
                await pg.set_viewport_size({'width': w, 'height': h})
                for row in [None, 'places', 'land', 'wx']:
                    if row: await pg.evaluate("PHONE.dact('drift', 'p2-row', {k:'%s'})" % row)
                    await pg.evaluate("DOCK.open('drift')"); await pg.wait_for_timeout(600)
                    if row: await pg.evaluate("(() => { const e = document.querySelector('.dr-row.on'); if (!e) return; let d = e.parentElement; while (d && d !== document.body && !(d.scrollHeight > d.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(d).overflowY))) d = d.parentElement; if (d) d.scrollTop = e.offsetTop - 8; })()")
                    await pg.wait_for_timeout(200)
                    await pg.screenshot(path=os.path.join(OUT, 'havplan-%dx%d%s.png' % (w, h, '-' + row if row else '')))
                    if row: await pg.evaluate("PHONE.dact('drift', 'p2-row', {k:'%s'})" % row)
                ov = await pg.evaluate("(() => { const d = document.getElementById('drawerBody'); return {w:d.scrollWidth, cw:d.clientWidth, txt:d.innerText.slice(0, 600)}; })()")
                print(ok(ov['cw'] > 0 and ov['w'] <= ov['cw'] + 1), 'no sideways overflow at %d px' % w, {'w': ov['w'], 'cw': ov['cw']})
                if w == 800: print('  ', ov['txt'].replace('\n', ' | ')[:600])
                await pg.evaluate("DOCK.close()")
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
