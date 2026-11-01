# Driftsplan 2, fase 0: plays today's operations plan (core/06d-drift.js) in the test build and logs what it does, minute by minute.
# Scenarios: A1 line+jig with you aboard, A2 the same with the crew alone, B nets in three strings, C round the clock 2+2, D two vessels,
# W the weather limits, N energy, E open against closed (catch-up) and the replay time of nine days.
import asyncio, json, sys, os, time
sys.path.insert(0, '/home/user/FishyBusiness-/tests')
from playwright.async_api import async_playwright
from _env import boot
OUTD = os.environ.get('REV_OUT') or os.path.dirname(os.path.abspath(__file__))
ONLY = sys.argv[1:]

REV = r"""window.REV = (() => {
  function seed(s){ let a = s >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const T0 = Math.round((Date.UTC(2028, 2, 6, 3, 0) - EPOCH) / 6e4);
  const hod = t => driftClock(driftHod(t / 60));
  const day = t => Math.floor((t - T0) / 1440) + 1;
  const when = t => 'D' + day(t) + ' ' + hod(t);
  function reset(sd){
    TAB.held = true; DYN.on = false; WX_FORCE = null; seed(sd || 1);
    S.fleet = S.fleet.filter(v => v.id === S.cur); S.me = S.cur;
    S.t = T0; S.qseed = 12345; S.stock = initStock(); S.marks = []; S.sales = []; S.log = []; S.msgs = []; S.sets = []; S.gearLog = []; S.jobs = [];
    S.energy = 100; S.sleep = null; S.rest = null; S.skip = null; S.drowsy = false; S.enWarn = false; S.cash = 1e6; S.tut = 0; S.settings.autoOn = false; S.lic = null; S.quota = null; S.shelter = null; S.plan = null; S.draft = []; S.tripOwner = false;
    S.stats.revenue = 0; S.stats.kg = 0; S.stats.costs = 0;
  }
  // a boat in port with crew; the skipper and the mate appointed; you aboard (me) or ashore
  function boat(vt, n, me, port){
    const b = S.boat, home = portById(port || S.home || HOME0);
    b.type = vt; applyVessel(); b.status = 'port'; b.port = home.id; b.pos = {...home.p}; b.anch = null; b.berth = 'main'; S.plan = null; S.hold = []; b.fuel = BOAT.fuelCap; b.ice = BOAT.iceCap; b.gear = true; b.land = null; b.landWait = null; b.gop = null; b.fishUntil = null;
    S.crew = Array.from({length:n}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, traits:[], known:[true, true]})); if (n){ setSkipper(S.crew[0].id); if (n > 1) setMate(S.crew[1].id); }
    S.me = me ? S.cur : 'nobody'; S.sets = (S.sets || []).filter(s => s.vid !== S.cur); S.jobs = []; S.ops = null; S.pgear = newPGear(); S.equip.jukse = 0;
    return home.id;
  }
  function gear(kind, n){
    const pg = S.pgear; pg.kits.n = 6;
    if (kind === 'line'){ S.equip.linehaler = true; const L = pg.lines.hyse; L.n = n; L.baited = n; L.bt = {makrell:n}; }
    if (kind === 'garn'){ S.equip.garnhaler = true; pg.nets = [{id:'nx', mesh:180, ty:'bunn', n, cond:1, max:0.95}]; }
    if (kind === 'teine'){ S.equip.teinehaler = true; pg.pots.big = n; pg.bait = {makrell:n * GPRICE.potBait * 4}; }
  }
  // places at sea near a point: deep enough, clear of land, apart from each other, open to the jig
  function spots(k, r0, r1, c){
    const home = c || portById(S.home || HOME0).p, out = [];
    for (let r = r0 || 2; r < (r1 || 12) && out.length < k; r += 0.5) for (let a = 0; a < 24 && out.length < k; a++){ const q = {x:home.x + r * Math.sin(a * 0.26), y:home.y - r * Math.cos(a * 0.26)};
      try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && out.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})) out.push({x:q.x, y:q.y, r, d:Math.round(depthF(q))}); } catch (e){} }
    return out;
  }
  const make = o => new Promise(res => driftMake(o, res));
  const st = (b, o) => { const pl = S.plan, w = pl && pl.wps[pl.idx - 1]; return (pl && pl.ops ? pl.opsK : pl ? (pl.returning ? 'ret' : 'own') : '-') + ':' + b.status + (b.port ? '@' + b.port : '') + (b.gop ? '/' + b.gop.op + '-' + b.gop.kind : '') + (b.status === 'fishing' && w && w.jc ? '/J' + w.jc : '') + (b.anch ? '/anch' : '') + (S.shelter ? '/shelter' : '') + (b.land ? '/land' : '') + (o && o.wait ? '?' + o.wait.k : '') + (o && o.held ? '!held' : '') + (o && o.stop ? '!stop:' + o.stop.k : '') + (o && !o.on ? '!off' : '') + (asleep() ? '/zz' : ''); };
  const snap = (b, o) => ({w:when(S.t), en:Math.round(S.energy), fat:S.crew.map(c => Math.round(c.fatigue)), watch:S.crew.map(c => c.sleepW ? 'z' : 'w').join(''), wind:Math.round(windAt(S.t / 60, b.pos) * 10) / 10, hs:Math.round(hsAt(b.pos, S.t / 60) * 100) / 100, hold:Math.round(holdTotal()), cash:Math.round(S.cash), st:st(b, o), now:o ? driftNow(o)[0] : '', sets:mySets().map(s => (s.fid || '?') + ':' + s.n + ':' + Math.round((S.t - s.tSet) / 6) / 10)});
  // play the minutes: 'open' lets the event loop run every ten minutes (the way the game's own tick does), 'closed' plays them as catchUp does
  async function run(mins, mode, tag, others, hook){
    const b = S.boat, o = S.ops, L = REV.L = {tag, mode, ev:[], hr:[], log0:S.log.length, msg0:S.msgs.length, t0:S.t, sketch:[], oth:{}};
    let was = null, lastDay = null; const wasO = {};
    for (const v of others || []) L.oth[v.id] = {ev:[], hr:[]};
    const t00 = performance.now();
    for (let i = 0; i < mins; i++){
      if (hook) hook(i);
      DYN.on = false; step();
      const s = st(b, o); if (s !== was){ L.ev.push([when(S.t), s, Math.round(S.energy), Math.round(Math.max(0, ...S.crew.map(c => c.fatigue))), Math.round(holdTotal())]); was = s; }
      if (S.t % 60 === 0) L.hr.push(snap(b, o));
      if (o && o.wait && o.wait.k === 'dep' && lastDay !== day(S.t)){ lastDay = day(S.t); try { const sk = driftSketch(o); L.sketch.push({at:when(S.t), sk:(sk || []).map(x => [driftClock(driftHod(x.t)), x.no])}); } catch (e){ L.sketch.push({at:when(S.t), err:String(e)}); } }
      for (const v of others || []) withVessel(v, () => { const s2 = st(S.boat, S.ops); if (s2 !== wasO[v.id]){ L.oth[v.id].ev.push([when(S.t), s2, Math.round(Math.max(0, ...S.crew.map(c => c.fatigue))), Math.round(holdTotal())]); wasO[v.id] = s2; } if (S.t % 60 === 0) L.oth[v.id].hr.push(snap(S.boat, S.ops)); });
      if (mode === 'open' && i % 10 === 9) await new Promise(r => setTimeout(r, 0));
    }
    L.ms = Math.round(performance.now() - t00);
    return finish(L, others);
  }
  function finish(L, others){
    const o = S.ops, b = S.boat;
    L.t1 = S.t; L.log = S.log.slice(L.log0).map(e => [when(e.t), (e.no || '').slice(0, 200)]); L.msgs = S.msgs.slice(L.msg0).map(m => [when(m.t), (m.from || m.who || m.title || ''), (m.no || m.text || '').slice(0, 300)]);
    L.rep = ((o && o.rep) || []).map(r => ({w:when(r.t), port:r.port, kg:r.kg, kr:r.kr, h:r.h, landed:r.landed}));
    L.sales = (S.sales || []).filter(s => s.t >= L.t0).map(s => ({w:when(s.t), v:s.v, port:s.port, kg:Math.round(s.kg || 0), total:Math.round(s.total || 0), acc:s.acc, conf:Math.round(s.confKg || 0), sp:s.lines ? s.lines.map(l => (l.sp || l.s) + ':' + Math.round(l.kg)) : (s.rows ? s.rows.map(l => (l.sp || l.s) + ':' + Math.round(l.kg)) : Object.keys(s).join(','))}));
    L.sets = mySets().map(s => ({fid:s.fid, kind:s.kind, n:s.n, set:when(s.tSet), ageH:Math.round((S.t - s.tSet) / 6) / 10, acc:Object.entries(s.acc || {}).map(([k, v]) => k + ':' + Math.round(v.kg)).join(' ')}));
    L.gearLog = (S.gearLog || []).filter(e => (e.t || e.tSet || 0) >= L.t0).map(e => JSON.stringify(e).slice(0, 220));
    L.marks = (S.marks || []).filter(m => m.t >= L.t0).map(m => ({w:when(m.t), g:m.g || null, kgph:m.kgph, kgu:m.kgu}));
    L.ops = o ? {on:o.on, stop:o.stop, wait:o.wait, held:o.held, M:o.M, Mname:(portById(o.M) || {}).name, home:o.home, homeName:(portById(o.home) || {}).name, fails:o.fails, day:o.day, last:o.last, legs:Object.keys(o.legs || {}).length, fields:o.fields, jigs:o.jigs} : null;
    L.fin = {en:Math.round(S.energy), fat:S.crew.map(c => Math.round(c.fatigue)), cash:Math.round(S.cash), hold:Math.round(holdTotal()), status:b.status, port:b.port, pos:[+b.pos.x.toFixed(2), +b.pos.y.toFixed(2)], revenue:Math.round(S.stats.revenue), kg:Math.round(S.stats.kg), costs:Math.round(S.stats.costs)};
    for (const v of others || []) withVessel(v, () => { const o2 = S.ops; L.oth[v.id].rep = (o2.rep || []).map(r => ({w:when(r.t), port:r.port, kg:r.kg, kr:r.kr, landed:r.landed})); L.oth[v.id].ops = {on:o2.on, stop:o2.stop, wait:o2.wait, M:o2.M, now:driftNow(o2)[0]}; L.oth[v.id].sets = mySets().map(s => ({fid:s.fid, n:s.n, set:when(s.tSet)})); L.oth[v.id].fin = {fat:S.crew.map(c => Math.round(c.fatigue)), hold:Math.round(holdTotal()), status:S.boat.status, port:S.boat.port}; });
    return L;
  }
  function info(){
    const h = portById(S.home || HOME0), M = PORTS.filter(q => q.mottak).map(q => ({id:q.id, name:q.name, km:Math.round(dist(q.p, h.p) * 10) / 10})).sort((a, c) => a.km - c.km).slice(0, 6);
    return {home:S.home, homeName:h.name, HOME0, mottak:M, when:when(S.t), restOk:planRestOk(S.home || HOME0), DRP, DRW, ENERGY:{sea:ENERGY.sea * 60, quay:ENERGY.quay * 60, warn:ENERGY.warn, wake:ENERGY.wake}};
  }
  return {seed, reset, boat, gear, spots, make, run, finish, info, when, T0, st, snap};
})();"""

def tl(L, key='ev'):
    """a compact timeline of the state changes"""
    return '\n'.join('  %-10s %-44s en=%3s fat=%3s hold=%5s' % tuple(e[:5]) if len(e) >= 5 else '  %-10s %-44s fat=%3s hold=%5s' % tuple(e[:4]) for e in L[key])

def report(L, extra=''):
    print('=' * 100); print('##', L['tag'], L['mode'], 'ms=%s' % L.get('ms'), extra)
    print('ops:', json.dumps(L['ops'], ensure_ascii=False)[:1200])
    print('-- events'); print(tl(L))
    for vid, X in L.get('oth', {}).items(): print('-- events', vid); print(tl(X)); print('   rep', X.get('rep'), 'ops', json.dumps(X.get('ops'), ensure_ascii=False)[:400], 'sets', X.get('sets'), 'fin', X.get('fin'))
    print('-- hourly'); print('\n'.join('  %-9s en=%3d fat=%-14s %s wind=%4.1f hs=%4.2f hold=%5d cash=%8d %-40s %s sets=%s' % (h['w'], h['en'], h['fat'], h['watch'], h['wind'], h['hs'], h['hold'], h['cash'], h['st'][:40], h['now'][:50], h['sets']) for h in L['hr']))
    print('-- sketch (what the page said the next trip would be)'); print(json.dumps(L['sketch'], ensure_ascii=False)[:3000])
    print('-- rep', json.dumps(L['rep'], ensure_ascii=False)); print('-- sales', json.dumps(L['sales'], ensure_ascii=False)[:2500]); print('-- sets', L['sets']); print('-- gearLog', L['gearLog'][:12]); print('-- marks', L['marks'][:12])
    print('-- fin', L['fin'])
    print('-- log'); print('\n'.join('  %s %s' % tuple(e) for e in L['log'][:160]))
    print('-- msgs'); print('\n'.join('  %s %s: %s' % tuple(m) for m in L['msgs'][:40]))
    json.dump(L, open(os.path.join(OUTD, L['tag'] + '.json'), 'w'), ensure_ascii=False)

A_PLAN = """(async (me) => { REV.reset(1); const home = REV.boat('sjark', 2, me); REV.gear('line', 4); await mapNeed(portById(home).p, 14);
  const F = REV.spots(2, 4, 12), J = REV.spots(1, 2.5, 4);
  const o = S.ops = driftNew({home, rig:'line', jig:true, fields:F.map((q, i) => ({id:'f' + (i + 1), x:q.x, y:q.y, n:2, soak:6})), jigs:[{id:'j1', x:J[0].x, y:J[0].y}], dep:5, wx:'normal'});
  const err = await REV.make(o); const C = driftCheck(o); o.on = true;
  return {err, C, F, J, M:o.M, Mname:(portById(o.M) || {}).name, legs:Object.keys(o.legs).length, info:REV.info(), sketch:(driftSketch(o) || []).map(x => [driftClock(driftHod(x.t)), x.no])}; })"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text[:200]) if m.type in ('error', 'warning') else None)
        await boot(pg)
        await pg.evaluate(REV)
        want = lambda k: not ONLY or k in ONLY

        if want('A1'):
            s = await pg.evaluate(A_PLAN, True); print('A1 setup:', json.dumps(s, ensure_ascii=False)[:2500])
            L = await pg.evaluate("REV.run(3 * 1440, 'open', 'A1')"); report(L, 'sjark, you aboard, 2 crew, line 2+2 soak 6, 1 jig, dep 05, normal')
        if want('A2'):
            s = await pg.evaluate(A_PLAN, False); print('A2 setup:', json.dumps(s, ensure_ascii=False)[:1500])
            L = await pg.evaluate("REV.run(3 * 1440, 'open', 'A2')"); report(L, 'sjark, crew alone (skipper + mate), line 2+2 soak 6, 1 jig, dep 05')
        if want('T'):
            s = await pg.evaluate("""(async () => { REV.reset(5); const home = REV.boat('kyst15', 3, false); REV.gear('teine', 30); await mapNeed(portById(home).p, 14);
              const F = REV.spots(2, 4, 12), J = REV.spots(1, 2.5, 4);
              const o = S.ops = driftNew({home, rig:'teiner', jig:true, fields:F.map((q, i) => ({id:'t' + (i + 1), x:q.x, y:q.y, n:15, soak:48})), jigs:[{id:'j1', x:J[0].x, y:J[0].y}], dep:5, wx:'normal'});
              const C = driftCheck(o); const err = await REV.make(o); o.on = true; const why = F.map(q => ruBlockMsg({p:q, len:BOAT.len, gear:'teiner', sp:'krabbe'}));
              return {err, C, F, J, why, bait:S.pgear.bait, M:o.M, Mname:(portById(o.M) || {}).name, sketch:(driftSketch(o) || []).map(x => [driftClock(driftHod(x.t)), x.no])}; })()""")
            print('T setup:', json.dumps(s, ensure_ascii=False)[:2500])
            L = await pg.evaluate("REV.run(4 * 1440, 'open', 'T')"); report(L, 'kyst15, crew alone 3, pots 15+15 soak 48, 1 jig, dep 05')
        if want('B'):
            s = await pg.evaluate("""(async () => { REV.reset(2); const home = REV.boat('sjark', 3, false); REV.gear('garn', 18); await mapNeed(portById(home).p, 14);
              const F = REV.spots(3, 4, 12), J = REV.spots(1, 2.5, 4);
              const o = S.ops = driftNew({home, rig:'garn', jig:true, fields:F.map((q, i) => ({id:'g' + (i + 1), x:q.x, y:q.y, n:6, soak:24})), jigs:[{id:'j1', x:J[0].x, y:J[0].y}], dep:5, wx:'normal'});
              const err = await REV.make(o); const C = driftCheck(o); o.on = true; return {err, C, F, J, M:o.M, Mname:(portById(o.M) || {}).name, sketch:(driftSketch(o) || []).map(x => [driftClock(driftHod(x.t)), x.no])}; })()""")
            print('B setup:', json.dumps(s, ensure_ascii=False)[:1500])
            L = await pg.evaluate("REV.run(3 * 1440, 'open', 'B')"); report(L, 'sjark, crew alone 3, nets 6+6+6 soak 24, 1 jig, dep 05')
        if want('C'):
            s = await pg.evaluate("""(async () => { REV.reset(3); let home = REV.boat('kyst15', 3, false); await mapNeed(portById(home).p, 14);
              const J = REV.spots(2, 4, 12); const mk = () => driftNew({home, rig:'juksa', jig:true, jigs:J.map((q, i) => ({id:'j' + (i + 1), x:q.x, y:q.y})), rhythm:'watch', dep:5, wx:'normal'});
              const o3 = S.ops = mk(); const C3 = driftCheck(o3);
              home = REV.boat('kyst15', 4, false); const o = S.ops = mk(); const C4 = driftCheck(o); const err = await REV.make(o); o.on = true;
              return {C3:C3.errors, C4, err, J, M:o.M, Mname:(portById(o.M) || {}).name, roles:(() => { const R = driftRoles(o); return {A:R.A.map(c => c.name), B:R.B.map(c => c.name)}; })()}; })()""")
            print('C setup:', json.dumps(s, ensure_ascii=False)[:1500])
            L = await pg.evaluate("REV.run(2 * 1440, 'open', 'C')"); report(L, 'kyst15, 4 crew, round the clock 2+2, juksa 2 places')
        if want('D'):
            s = await pg.evaluate("""(async () => { REV.reset(4); const home = REV.boat('sjark', 2, true); REV.gear('line', 4); await mapNeed(portById(home).p, 14);
              const F = REV.spots(2, 4, 12), J = REV.spots(1, 2.5, 4), G = REV.spots(3, 5, 14, {x:F[1].x, y:F[1].y});
              const o = S.ops = driftNew({home, rig:'line', jig:true, fields:F.map((q, i) => ({id:'f' + (i + 1), x:q.x, y:q.y, n:2, soak:6})), jigs:[{id:'j1', x:J[0].x, y:J[0].y}], dep:5, wx:'normal'});
              const err1 = await REV.make(o); o.on = true;
              const v2 = newVesselObj('sjark', home); const r2 = withVessel(v2, () => { S.crew = Array.from({length:3}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, traits:[], known:[true, true]})); setSkipper(S.crew[0].id); setMate(S.crew[1].id); S.boat.gear = true; S.boat.fuel = BOAT.fuelCap; S.boat.ice = BOAT.iceCap; S.pgear = newPGear(); REV.gear('garn', 18);
                S.ops = driftNew({home, rig:'garn', jig:true, fields:G.map((q, i) => ({id:'g' + (i + 1), x:q.x, y:q.y, n:6, soak:24})), jigs:[{id:'j1', x:J[0].x, y:J[0].y}], dep:6, wx:'normal'}); return {name:S.boatName, check:driftCheck(S.ops).errors}; });
              const err2 = await new Promise(res => withVessel(v2, () => driftMake(S.ops, res))); withVessel(v2, () => { S.ops.on = true; });
              window.V2 = v2; return {err1, err2, r2, names:S.fleet.map(v => vget(v, 'boatName')), M1:o.M, M2:vget(v2, 'ops').M}; })()""")
            print('D setup:', json.dumps(s, ensure_ascii=False)[:1500])
            L = await pg.evaluate("REV.run(2 * 1440, 'open', 'D', [window.V2])"); report(L, 'two sjarks: you aboard the line boat, the net boat with her own crew')
            r = await pg.evaluate("""(() => { PHONE.open('rederi'); const t = document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : (document.querySelector('.ph-c') || document.body).innerText; return t.slice(0, 1500); })()""")
            print('-- Rederi page text:', r)
        if want('W'):
            # the weather: over the limit at the departure hour, fine from 08, a gale from 11 to 14 while she is out
            s = await pg.evaluate(A_PLAN, False); print('W setup:', json.dumps(s, ensure_ascii=False)[:600])
            L = await pg.evaluate("""(async () => { const hook = i => { const H = driftHod(S.t / 60), d = Math.floor((S.t - REV.T0) / 1440) + 1; WX_FORCE = d === 1 && H >= 3 && H < 8 ? {w:12, d:200} : d === 1 && H >= 11 && H < 14 ? {w:15, d:200} : {w:5, d:200}; };
              return REV.run(2 * 1440, 'open', 'W', [], hook); })()"""); report(L, 'weather: 12 m/s 03-08 (limit 13 normal: NOT over!), 15 m/s 11-14, else 5')
            # the same with the 'safe' limit (10 m/s), where 12 is over
            await pg.evaluate("(() => { S.ops.wx = 'safe'; })()")
            s = await pg.evaluate(A_PLAN, False); await pg.evaluate("(() => { S.ops.wx = 'safe'; })()")
            L = await pg.evaluate("""(async () => { const hook = i => { const H = driftHod(S.t / 60), d = Math.floor((S.t - REV.T0) / 1440) + 1; WX_FORCE = d === 1 && H >= 3 && H < 8 ? {w:12, d:200} : d === 1 && H >= 11 && H < 14 ? {w:15, d:200} : {w:5, d:200}; };
              return REV.run(2 * 1440, 'open', 'Wsafe', [], hook); })()"""); report(L, 'weather with limit safe (10 m/s): 12 m/s 03-08, 15 m/s 11-14, else 5')
            # and the same day played closed (catch-up): the shelter search is async
            s = await pg.evaluate(A_PLAN, False); await pg.evaluate("(() => { S.ops.wx = 'safe'; })()")
            L = await pg.evaluate("""(async () => { const hook = i => { const H = driftHod(S.t / 60), d = Math.floor((S.t - REV.T0) / 1440) + 1; WX_FORCE = d === 1 && H >= 3 && H < 8 ? {w:12, d:200} : d === 1 && H >= 11 && H < 14 ? {w:15, d:200} : {w:5, d:200}; };
              return REV.run(2 * 1440, 'closed', 'Wclosed', [], hook); })()"""); report(L, 'the same weather day played closed (synchronous, as catchUp)')
        if want('N'):
            s = await pg.evaluate(A_PLAN, True); await pg.evaluate("(() => { S.energy = 3; })()"); print('N setup: you aboard with energy 3 at the start')
            L = await pg.evaluate("REV.run(1440 + 600, 'open', 'N')"); report(L, 'energy: you aboard with 3 % at departure')
        if want('E'):
            # twin runs with the same seed: open all the way, and open-closed-open; then the same open run again (determinism)
            s = await pg.evaluate(A_PLAN, True); L1 = await pg.evaluate("REV.run(3 * 1440, 'open', 'E-open')"); report(L1, 'E: open throughout (you aboard, A1 plan)')
            s = await pg.evaluate(A_PLAN, True); L2 = await pg.evaluate("""(async () => { await REV.run(1440 - 1, 'open', 'E-x'); const a = await REV.run(1800, 'closed', 'E-closed30'); REV.L = a; const t = await REV.run(3 * 1440 - 1440 + 1 - 1800, 'open', 'E-after'); return t; })()""")
            # the pieces: the 30 closed hours are in E-closed30.json? no: run() returns only its own window; stitch by the log and rep in the last
            report(L2, 'E: day 1 open, then 30 h closed (synchronous), then open: the last window')
            s = await pg.evaluate(A_PLAN, True); L3 = await pg.evaluate("REV.run(3 * 1440, 'open', 'E-open2')"); report(L3, 'E: open again, same seed (determinism check)')
            print('E compare: open fin', L1['fin'], 'rep', L1['rep']); print('E compare: mixed fin', L2['fin'], 'rep', L2['rep']); print('E compare: open2 fin', L3['fin'], 'rep', L3['rep'])
            # nine days closed: the time it takes, and whether the plan keeps going
            s = await pg.evaluate(A_PLAN, True)
            L9 = await pg.evaluate("""(async () => { const t0 = performance.now(); const L = await REV.run(9 * 1440, 'closed', 'E9'); L.wall_s = Math.round((performance.now() - t0) / 100) / 10; return L; })()""")
            print('E9: nine days closed took %s s wall; landings %d; fin %s; ops %s' % (L9['wall_s'], len(L9['rep']), L9['fin'], json.dumps(L9['ops'], ensure_ascii=False)[:600]))
            print('E9 per day landed:', [(r['w'], r['kg'], r['kr']) for r in L9['rep']]); print('E9 events (first 60):'); print(tl({'ev': L9['ev'][:60]}))
            json.dump(L9, open(os.path.join(OUTD, 'E9.json'), 'w'), ensure_ascii=False)
            # and with the crew alone
            s = await pg.evaluate(A_PLAN, False)
            L9b = await pg.evaluate("""(async () => { const t0 = performance.now(); const L = await REV.run(9 * 1440, 'closed', 'E9crew'); L.wall_s = Math.round((performance.now() - t0) / 100) / 10; return L; })()""")
            print('E9crew: nine days closed took %s s wall; landings %d; fin %s; ops %s' % (L9b['wall_s'], len(L9b['rep']), L9b['fin'], json.dumps(L9b['ops'], ensure_ascii=False)[:600]))
            print('E9crew per day landed:', [(r['w'], r['kg'], r['kr']) for r in L9b['rep']]); print(tl({'ev': L9b['ev'][:80]}))
            json.dump(L9b, open(os.path.join(OUTD, 'E9crew.json'), 'w'), ensure_ascii=False)
        print('sidefeil:', errs[:20])
        await b.close()
asyncio.run(main())
