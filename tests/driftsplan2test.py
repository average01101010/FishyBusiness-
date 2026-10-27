# Driftsplan 2 (docs/planer/driftsplan-2/02-design.md): the scenarios S1–S14 from the brief, one function each. A scenario whose part is
# not built yet prints VENTER, not FEIL. Without 3D (LITE). The harness: a fixed date, a seeded Math.random, the game's loop held, the
# boat at Finnsnes with crew and gear; the day is reckoned dry (planDay) in part 1, and played with the engine from part 2.
import asyncio, json, sys
from playwright.async_api import async_playwright
from _env import boot
ok = lambda c: 'OK  ' if c else 'FEIL'
BUILT = {'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S11', 'S12', 'S14', 'S15', 'S16', 'S17', 'S18'}   # the scenarios the parts built so far cover (part 1: dry; part 2: the engine; part 3: weather, energy, watches, rules, takeover; part 4: closed)

D2 = r"""window.D2 = (() => {
  // the seeded numbers are used only inside step(): the page's own frames between the awaits of an open run draw with the native ones, so two runs draw the same catch
  const NATIVE = Math.random, RNG = {f:null}; function seed(s){ let a = s >>> 0; Math.random = RNG.f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const T0 = Math.round((Date.UTC(2028, 2, 6, 3, 0) - EPOCH) / 6e4);
  const hod = t => driftClock(driftHod(t / 60)), when = t => 'D' + (Math.floor((t - T0) / 1440) + 1) + ' ' + hod(t);
  function reset(sd){
    TAB.held = true; DYN.on = false; WX_FORCE = null; seed(sd || 1);
    S.fleet = S.fleet.filter(v => v.id === S.cur); S.me = S.cur;
    S.t = T0; S.qseed = 12345; S.stock = initStock(); S.marks = []; S.sales = []; S.log = []; S.msgs = []; S.sets = []; S.gearLog = []; S.jobs = [];
    S.energy = 100; S.sleep = null; S.rest = null; S.skip = null; S.drowsy = false; S.enWarn = false; S.cash = 1e6; S.tut = 0; S.settings.autoOn = false; S.lic = null; S.quota = null; S.shelter = null; S.plan = null; S.draft = []; S.tripOwner = false;
    S.stats.revenue = 0; S.stats.kg = 0; S.stats.costs = 0;
  }
  function boat(vt, n, me, port){
    const b = S.boat, home = portById(port || S.home || HOME0);
    b.type = vt; applyVessel(); b.status = 'port'; b.port = home.id; b.pos = {...home.p}; b.anch = null; b.berth = 'main'; S.plan = null; S.hold = []; b.fuel = BOAT.fuelCap; b.ice = BOAT.iceCap; b.gear = true; b.land = null; b.landWait = null; b.gop = null; b.fishUntil = null;
    S.crew = Array.from({length:n}, (_, i) => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, traits:[], known:[true, true], name:['Ole Hansen', 'Per Berg', 'Kari Nilsen', 'Jan Olsen', 'Roger Strand', 'Rune Lie'][i] || 'Mann ' + i}));
    if (n){ setSkipper(S.crew[0].id); if (n > 1) setMate(S.crew[1].id); }
    S.me = me ? S.cur : 'nobody'; S.sets = (S.sets || []).filter(s => s.vid !== S.cur); S.jobs = []; S.ops = null; S.pgear = newPGear(); S.equip.jukse = 0;
    return home.id;
  }
  function gear(kind, n, bait){
    const pg = S.pgear; pg.kits.n = 6;
    if (kind === 'line'){ S.equip.linehaler = true; const L = pg.lines.hyse; L.n = n; L.baited = n; L.bt = {makrell:n}; }
    if (kind === 'garn'){ S.equip.garnhaler = true; pg.nets = [{id:'nx', mesh:180, ty:'bunn', n, cond:1, max:0.95}]; }
    if (kind === 'teine'){ S.equip.teinehaler = true; pg.pots.big = n; pg.bait = {makrell:bait == null ? n * GPRICE.potBait * 4 : bait}; }
  }
  function spots(k, r0, r1, c){
    const home = c || portById(S.home || HOME0).p, out = [];
    for (let r = r0 || 2; r < (r1 || 12) && out.length < k; r += 0.5) for (let a = 0; a < 24 && out.length < k; a++){ const q = {x:home.x + r * Math.sin(a * 0.26), y:home.y - r * Math.cos(a * 0.26)};
      try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && out.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})) out.push({x:q.x, y:q.y}); } catch (e){} }
    return out;
  }
  // the nearest plant to the places, for the dry day (part 2 makes the plan properly)
  function plant(o){ const P = o.places; const mid = {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length}; return PORTS.filter(q => q.mottak).sort((a, c) => dist(a.p, mid) - dist(c.p, mid))[0].id; }
  const felt = (id, q, n, soak, lk, hdg) => ({id, k:'felt', x:q.x, y:q.y, n, soak, hdg:hdg == null ? null : hdg, lk:lk || null}), juks = (id, q) => ({id, k:'juks', x:q.x, y:q.y});
  // a dry day: the day from the answers and a state (the live one, with overrides), and its text
  function dry(o, H0, over){ const st = Object.assign(plan2State(o), over || {}); if (over && over.aboard) st.aboard = Object.assign(plan2State(o).aboard, over.aboard); const day = planDay(o, H0, st); return {day, text:planDayText(o, day).map(x => x[0] + ' ' + x[1]), st}; }
  const h = t => Math.round((t - T0 / 60) * 100) / 100;   // hours since the test's start
  // the engine: the plan made (plan2Make), switched on, and the minutes played as catchUp plays them ('closed') or with the loop let go every ten minutes ('open')
  const make = o => new Promise(res => plan2Make(o, res));
  const st = (b, o) => { const pl = S.plan, w = pl && pl.wps[pl.idx - 1], r = o.run; return (pl && pl.ops ? pl.opsK : pl ? (pl.returning ? 'ret' : 'own') : '-') + ':' + b.status + (b.port ? '@' + b.port : '') + (b.gop ? '/' + b.gop.op + '-' + b.gop.kind : '') + (b.status === 'fishing' && w && w.jc ? '/J' + w.jc : '') + (b.anch ? '/anch' : '') + (S.shelter ? '/shelter' : '') + (b.land ? '/land' : '') + (r && r.wait ? '?' + r.wait.k : '') + (r && r.day ? '#' + r.i : '') + (o.held ? '!held' : '') + (o.stop ? '!stop:' + o.stop.k : '') + (!o.on ? '!off' : '') + (asleep() ? '/zz' : ''); };
  async function run(mins, mode, tag, hook){
    const b = S.boat, o = S.ops, L = {tag, mode, ev:[], log0:S.log.length, msg0:S.msgs.length, t0:S.t, days:[]}; let was = null, dayT0 = null;
    for (let i = 0; i < mins; i++){
      if (hook) hook(i);
      DYN.on = false; step();
      const r = o.run; if (r && r.day && r.t0 !== dayT0){ dayT0 = r.t0; L.days.push({at:when(S.t), text:planDayText(o, r.day).map(x => x[0] + ' ' + x[1])}); }
      const s2 = st(b, o); if (s2 !== was){ L.ev.push([when(S.t), s2, Math.round(S.energy), Math.round(Math.max(0, ...S.crew.map(c => c.fatigue))), Math.round(holdTotal())]); was = s2; }
      if (mode === 'open' && i % 10 === 9){ Math.random = NATIVE; await new Promise(r => setTimeout(r, 0)); Math.random = RNG.f; }
    }
    L.log = S.log.slice(L.log0).map(e => [when(e.t), (e.no || '').slice(0, 160)]); L.msgs = S.msgs.slice(L.msg0).map(m => [when(m.t), (m.no || '').slice(0, 200)]);
    L.gearLog = (S.gearLog || []).filter(e => (e.tSet || 0) >= L.t0).map(e => ({kind:e.kind, n:e.n, set:when(e.tSet), haul:e.tHaul ? when(e.tHaul) : null, soak:e.tHaul ? Math.round((e.tHaul - e.n * DRP2.work.trekk[e.kind] * 60 - e.tSet) / 6) / 10 : null, kg:e.kg}));   // the soak: from the set to the start of the haul
    L.stats = JSON.parse(JSON.stringify(o.stats)); L.ops = {on:o.on, stop:o.stop, wait:o.run && o.run.wait, i:o.run && o.run.i, held:o.held, M:o.M, ly:o.ly};
    L.fin = {en:Math.round(S.energy), fat:S.crew.map(c => Math.round(c.fatigue)), cash:Math.round(S.cash), hold:Math.round(holdTotal()), status:b.status, port:b.port, sets:mySets().map(s => [s.fid, s.n])};
    return L;
  }
  return {seed, reset, boat, gear, spots, plant, felt, juks, dry, h, T0, when, make, run, st};
})();"""

def steps(d): return [s['k'] + (':' + s['pid'] if s.get('pid') else '') for s in d['steps']]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        try: await boot(pg)
        except Exception as e: print('FEIL boot:', str(e)[:200], 'sidefeil:', errs[:5]); raise
        await pg.evaluate(D2)
        # the crew's own life (a fever, a wedding, 14-crewlife.js) is not what is tested here: it would give the skipper days off by chance
        await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        R = {}; S1L = None

        # S1 (dry): line 2 + 2 at 6 h, one jig place, out at 05:00, you aboard: the day from the answers, and the next days
        r = await pg.evaluate("""(async () => { D2.reset(1); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          o.M = D2.plant(o); const H = S.t / 60, H0 = plan2NextDep(o, H), d1 = D2.dry(o, H0);
          // day 2: the line was hauled and baited by the crew in the evening; the next departure waits for the baiting if it must
          const H2 = plan2NextDep(o, H0 + 20, d1.day.end), d2 = D2.dry(o, H2);
          // day 2 when the line is NOT baited yet
          const d2u = D2.dry(o, H2, {aboard:{line:{n:4, baited:0}}});
          const chk = plan2Check(o);
          return {H0:D2.h(H0), dep:driftClock(driftHod(H0)), d1:{steps:d1.day.steps, text:d1.text, end:D2.h(d1.day.end), home:D2.h(d1.day.home), why:d1.day.why[0], skipped:d1.day.skipped}, d2:{steps:d2.day.steps, text:d2.text, H2:D2.h(H2), dep:driftClock(driftHod(H2))}, d2u:{text:d2u.text, skipped:d2u.day.skipped}, chk, M:o.M}; })()""")
        d1, d2 = r['d1'], r['d2']; k1 = steps(d1); k2 = steps(d2)
        print('S1 dag 1:'); print('  ' + '\n  '.join(d1['text']))
        tr = [s for s in d1['steps'] if s['k'] == 'trekk']; st_ = [s for s in d1['steps'] if s['k'] == 'sett']; jg = [s for s in d1['steps'] if s['k'] == 'juks']
        print(ok(r['chk']['ok'] and r['dep'] == '05:00' and k1[:3] == ['avgang', 'sett:f1', 'sett:f2'] and 'juks:j1' in k1 and k1.index('juks:j1') < k1.index('trekk:f1') < k1.index('trekk:f2') < k1.index('lever') < k1.index('hjem')), 'S1 the day: out at 05:00, set field 1 and 2, jig, haul 1 and 2, land, home', k1)
        print(ok(len(tr) == 2 and all(6.0 - 1e-6 <= s['soakH'] <= 7.0 for s in tr) and all(not s['reset'] for s in tr)), 'S1 the line is hauled when the soak is up (6 h, at most 7), not set again, and comes home for baiting', [round(s['soakH'], 2) for s in tr])
        print(ok(jg and jg[0]['h'] >= 3 and abs(jg[0]['until'] - tr[0]['t']) < 0.4), 'S1 the jig gets the hours until the first haul is due', [round(jg[0]['h'], 2) if jg else None])
        eg = [s for s in d1['steps'] if s['k'] == 'egning']; hv = [s for s in d1['steps'] if s['k'] == 'hvile']
        print(ok(d1['home'] - r['H0'] <= 15 and ('kortere dag' in d1['why'] or d1['home'] - r['H0'] <= 14) and eg and eg[0]['n'] == 4 and eg[0]['where'] == 'mannskapet' and hv and hv[0]['until'] >= eg[0]['ready']), 'S1 home within 15 h and the day says why it runs over 14 (the plant 16 nm away); the crew bait the 4 tubs at home and the rest lasts until they are ready', [round(d1['home'] - r['H0'], 2), d1['why'], eg[0]['where'] if eg else None])
        same = len(k1) == len(k2) and all(a == c for a, c in zip(k1, k2)) and all(abs((a['t'] - r['H0']) - (c['t'] - r['d2']['H2'])) < 0.2 for a, c in zip(d1['steps'], d2['steps']) if a['t'] is not None)
        print(ok(same and r['d2']['dep'] == '05:00'), 'S1 day 2 is day 1 again, at 05:00, step for step within 12 minutes', [r['d2']['dep'], k2])
        print(ok(any('ikke egnet' in x['no'] for x in r['d2u']['skipped']) and 'sett:f1' not in steps({'steps': []})), 'S1 with the line not baited the fields are skipped with the reason', [x['no'] for x in r['d2u']['skipped']])

        # S2 (dry): nets 6 + 6 + 6 at 24 h, crew alone: day 1 sets, day 2 hauls and sets again in order
        r = await pg.evaluate("""(async () => { D2.reset(2); const home = D2.boat('sjark', 3, false); D2.gear('garn', 18); await mapNeed(portById(home).p, 14);
          const F = D2.spots(3, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'garn', jig:true, places:[D2.felt('g1', F[0], 6, 24), D2.felt('g2', F[1], 6, 24), D2.felt('g3', F[2], 6, 24), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          o.M = D2.plant(o); const H0 = plan2NextDep(o, S.t / 60), d1 = D2.dry(o, H0);
          const sets = d1.day.steps.filter(s => s.k === 'sett').map(s => ({fid:s.pid, kind:'garn', n:s.n, tSet:Math.round((s.t + s.h) * 60), x:0, y:0}));
          const H2 = plan2NextDep(o, H0 + 20, d1.day.end), d2 = D2.dry(o, H2, {sets, aboard:{garn:0}}), chk = plan2Check(o);
          return {chk:chk.ok, d1:{steps:d1.day.steps, text:d1.text, skipped:d1.day.skipped}, d2:{steps:d2.day.steps, text:d2.text}}; })()""")
        k1 = steps(r['d1']); k2 = steps(r['d2']); tr = [s for s in r['d2']['steps'] if s['k'] == 'trekk']
        print('S2 dag 1:'); print('  ' + '\n  '.join(r['d1']['text'])); print('S2 dag 2:'); print('  ' + '\n  '.join(r['d2']['text']))
        print(ok(r['chk'] and k1[:4] == ['avgang', 'sett:g1', 'sett:g2', 'sett:g3'] and 'juks:j1' in k1 and 'trekk:g1' not in k1 and len(r['d1']['skipped']) == 3), 'S2 day 1 sets the three strings, jigs, and says the hauls come tomorrow', [k1, [x['no'] for x in r['d1']['skipped']]])
        print(ok([k for k in k2 if k.startswith('trekk')] == ['trekk:g1', 'trekk:g2', 'trekk:g3'] and all(24.0 - 1e-6 <= s['soakH'] <= 26 and s['reset'] for s in tr) and k2.count('sett:g1') == 1 and 'lever' in k2), 'S2 day 2 hauls and sets again in order, each after 24–26 h, and lands', [k2, [round(s['soakH'], 2) for s in tr]])

        # S3 (dry): pots 15 + 15 at 48 h with the jig; bait bought at the plant when it is short
        r = await pg.evaluate("""(async () => { D2.reset(3); const home = D2.boat('kyst15', 3, false); D2.gear('teine', 30, 0); await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'teiner', jig:true, places:[D2.felt('t1', F[0], 15, 48), D2.felt('t2', F[1], 15, 48), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'full'}});
          o.M = D2.plant(o); const H0 = plan2NextDep(o, S.t / 60), d0 = D2.dry(o, H0);
          const d1 = D2.dry(o, H0, {aboard:{teine:30, bait:30 * GPRICE.potBait * 2}});
          const sets = d1.day.steps.filter(s => s.k === 'sett').map(s => ({fid:s.pid, kind:'teine', n:s.n, tSet:Math.round((s.t + s.h) * 60), x:0, y:0}));
          const H2 = plan2NextDep(o, H0 + 20, d1.day.end), d2 = D2.dry(o, H2, {sets, aboard:{teine:0, bait:30 * GPRICE.potBait}});
          const H3 = plan2NextDep(o, H2 + 20, d2.day.end), d3 = D2.dry(o, H3, {sets, aboard:{teine:0, bait:30 * GPRICE.potBait}});
          return {d0:{steps:d0.day.steps, text:d0.text, skipped:d0.day.skipped}, d1:{steps:d1.day.steps, text:d1.text}, d2:{steps:d2.day.steps, text:d2.text, skipped:d2.day.skipped}, d3:{steps:d3.day.steps, text:d3.text}}; })()""")
        k0 = steps(r['d0']); k1 = steps(r['d1']); k2 = steps(r['d2']); k3 = steps(r['d3']); tr = [s for s in r['d3']['steps'] if s['k'] == 'trekk']
        print('S3 uten agn:'); print('  ' + '\n  '.join(r['d0']['text'])); print('S3 dag 3:'); print('  ' + '\n  '.join(r['d3']['text']))
        print(ok('agn' in k0 and 'sett:t1' not in k0 and any('agn' in x['no'] for x in r['d0']['skipped'])), 'S3 without bait the pots are not set, and the day buys bait at the plant', [k0, [x['no'] for x in r['d0']['skipped']]])
        print(ok(k1[:3] == ['avgang', 'sett:t1', 'sett:t2'] and 'juks:j1' in k1 and 'trekk:t1' not in k2 and any('døgn' in x['no'] or 'morgen' in x['no'] for x in r['d2']['skipped'])), 'S3 day 1 sets both strings; day 2 only jigs and says when the pots are hauled', [k1, k2, [x['no'] for x in r['d2']['skipped']]])
        print(ok([k for k in k3 if k.startswith('trekk')] == ['trekk:t1', 'trekk:t2'] and all(48.0 - 1e-6 <= s['soakH'] <= 51 and s['reset'] for s in tr)), 'S3 day 3 hauls the pots after 48 h and sets them again', [k3, [round(s['soakH'], 2) for s in tr]])

        # S7 (dry): the landing rule: nearest or chosen plant; every trip, when the hold is full or the fish must go, every N days
        r = await pg.evaluate("""(async () => { D2.reset(7); const home = D2.boat('sjark', 2, true); await mapNeed(portById(home).p, 14);
          const J = D2.spots(2, 2.5, 6), mk = land => { const o = S.ops = plan2New({home, rig:'juksa', jig:true, places:[D2.juks('j1', J[0]), D2.juks('j2', J[1])], dep:5, land}); o.M = land.mode === 'port' ? land.port : D2.plant(o); return o; };
          const H0 = plan2NextDep(mk({mode:'near', when:'trip'}), S.t / 60), K = (o, over) => { const d = D2.dry(o, H0, over); return {k:d.day.steps.map(s => s.k + (s.port ? ':' + s.port : '') + (s.kg ? ':' + s.kg : '')), text:d.text}; };
          const near = K(mk({mode:'near', when:'trip'})), port = K(mk({mode:'port', port:'husoy', when:'trip'}));
          const full0 = K(mk({mode:'near', when:'full'}), {hold:1000, cap:6500, fresh:100}), full1 = K(mk({mode:'near', when:'full'}), {hold:6000, cap:6500, fresh:100}), fresh = K(mk({mode:'near', when:'full'}), {hold:1000, cap:6500, fresh:60});
          const days0 = K(mk({mode:'near', when:'days', days:2}), {hold:500, cap:6500, fresh:100, dayIndex:1}), days1 = K(mk({mode:'near', when:'days', days:2}), {hold:500, cap:6500, fresh:100, dayIndex:2});
          const chkBad = plan2Check(mk({mode:'port', port:'finnsnes', when:'trip'})).errors;
          return {near, port, full0, full1, fresh, days0, days1, chkBad}; })()""")
        L = lambda x: [k for k in x['k'] if k.startswith('lever') or k.startswith('behold')]
        print('S7:', {k: L(v) for k, v in r.items() if k != 'chkBad'})
        print(ok(L(r['near']) == ['lever:botnhamn'] and L(r['port']) == ['lever:husoy']), 'S7 the nearest plant, or the chosen one', [L(r['near']), L(r['port'])])
        print(ok(L(r['full0']) == ['behold:1000'] and L(r['full1']) == ['lever:botnhamn'] and L(r['fresh']) == ['lever:botnhamn']), 'S7 «when the hold is full»: keeps 1 000 of 6 500 kg aboard, lands at 6 000 kg, and lands when the fish must go', [L(r['full0']), L(r['full1']), L(r['fresh'])])
        print(ok(L(r['days0']) == ['behold:500'] and L(r['days1']) == ['lever:botnhamn'] and any('fiskemottak' in e for e in r['chkBad'])), 'S7 «every 2 days» lands on the even day; a chosen port without a plant is refused', [L(r['days0']), L(r['days1']), r['chkBad']])

        # S12 (dry): with the switch on, older plans are switched off with a word and a v4 is kept; off, nothing is touched
        r = await pg.evaluate("""(() => { const R = {}; D2.reset(12); D2.boat('sjark', 2, true);
          DRIFT2 = false; S.ops = {v:3, on:true, fields:[], jigs:[]}; R.offUntouched = plan2Ops() === null && S.ops && S.ops.v === 3;
          DRIFT2 = true; const n = S.msgs.length; R.v3 = plan2Ops() === null && S.ops === null && S.msgs.length === n + 1 && /slått av/.test(S.msgs[n].no);
          S.ops = {v:2, on:true, sess:[]}; R.v2 = plan2Ops() === null && S.ops === null;
          const o4 = S.ops = plan2New({home:'finnsnes'}); R.v4 = plan2Ops() === o4 && S.ops === o4; R.oldIgnores = driftOps() === null && S.ops === o4;
          DRIFT2 = false; return R; })()""")
        print(ok(r['offUntouched'] and r['v3'] and r['v2'] and r['v4'] and r['oldIgnores']), 'S12 switch off: a v3 is left alone; on: v3 and v2 are switched off with a word, a v4 is kept and the old engine ignores it', r)

        # the watch rules (Jonas 26.10.2026): four hands, a wheelhouse, bunks for everyone aboard, two watches of 12 hours
        r = await pg.evaluate("""(async () => { D2.reset(6); const J = D2.spots(2, 4, 12); const mk = (vt, n, me) => { const home = D2.boat(vt, n, me); const o = S.ops = plan2New({home, rig:'juksa', jig:true, places:[D2.juks('j1', J[0]), D2.juks('j2', J[1])], rhythm:'watch'}); o.M = D2.plant(o); return o; };
          const R = {}; R.three = plan2Check(mk('kyst15', 3, false)).errors; R.four = plan2Check(mk('kyst15', 4, false)).ok; R.fiveOnSjark = plan2Check(mk('sjark', 4, true)).errors;
          const o = mk('kyst15', 4, false); const d = D2.dry(o, S.t / 60 + 3); R.text = d.text; R.vakt = d.day.steps.filter(s => s.k === 'vakt').map(s => [driftClock(driftHod(s.t)), s.w, s.who.length, driftClock(driftHod(s.until))]); R.lever = d.day.steps.some(s => s.k === 'lever' && s.full); return R; })()""")
        print('S6 (vaktene):'); print('  ' + '\n  '.join(r['text']))
        print(ok(any('fire' in e for e in r['three']) and r['four'] and any('køyer til alle' in e for e in r['fiveOnSjark'])), 'S6 (dry) three hands refused, four go, and five aboard with four bunks refused', [r['three'], r['fiveOnSjark']])
        print(ok(len(r['vakt']) >= 2 and all(v[2] == 2 for v in r['vakt']) and r['vakt'][0][1] != r['vakt'][1][1] and all(v[3] in ('06:00', '18:00') for v in r['vakt']) and r['lever']), 'S6 (dry) two watches of two, changing at 06:00 and 18:00, landing when the hold is full', r['vakt'])

        # ---- the engine (part 2): the days played minute by minute with DRIFT2 on
        def tl(L, n=60): return '\n'.join('  %-10s %-48s en=%3s fat=%3s hold=%5s' % tuple(e[:5]) for e in L['ev'][:n])
        def days(L): return [d for d in L['days']]
        def outs(L): return [e[0] for e in L['ev'] if 'unmooring@' in e[1] and e[1].startswith('fish')]
        def logs(L, pat): return [e for e in L['log'] if pat in e[1]]
        print('== S1 med motoren: line 2 + 2 ved 6 t, juksa, ut kl. 05:00, deg om bord, tre døgn')
        L = await pg.evaluate("""(async () => { D2.reset(21); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const L = await D2.run(3 * 1440, 'open', 'S1e'); L.err = err; L.legs = Object.keys(o.legs).length; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S1e plan2Make:', L['err'])
        else:
            print(tl(L, 70)); print('  dager:', len(L['days'])); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:12])) for d in L['days']]
            print('  log:', '\n   '.join(['%s %s' % tuple(e) for e in L['log'] if 'WP' not in e[1] and 'rekord' not in e[1] and ': «' not in e[1]][:70]))
            print('  gearLog:', L['gearLog']); print('  stats:', json.dumps(L['stats'], ensure_ascii=False)[:800]); print('  ops:', json.dumps(L['ops'], ensure_ascii=False)[:300]); print('  fin:', L['fin'])
            o_ = outs(L); hauls = [g for g in L['gearLog'] if g['haul']]
            print(ok(not L['err'] and len(o_) >= 3 and all(x.endswith('05:00') or x.endswith('05:01') or x.endswith('05:02') or x.endswith('05:03') or x.endswith('05:04') or x.endswith('05:05') for x in o_[:3])), 'S1 out at 05:00 (within 5 min) three days running', o_)
            print(ok(len([g for g in L['gearLog']]) >= 6 and len(hauls) >= 6 and all(6.0 - 0.05 <= g['soak'] <= 7.5 for g in hauls)), 'S1 the line is set on both fields and hauled after 6-7.5 h each day', [(g['set'], g['soak']) for g in hauls])
            print(ok(len(logs(L, 'Ferdig med fisket')) >= 3), 'S1 the jig fishes each day', len(logs(L, 'Ferdig med fisket')))
            print(ok(len(L['stats']['days']) >= 3 and all(d['trips'] >= 1 and d['kg'] > 0 for d in L['stats']['days'][:3])), 'S1 landed each day: the statistics have three days with kg and kr', [(d['d'], d['trips'], d['kg'], d['kr']) for d in L['stats']['days']])
            print(ok(len(logs(L, 'Fortøyd i Finnsnes')) >= 3 and len(logs(L, 'stamper er egnet')) >= 4), 'S1 home at Finnsnes each day, and the crew bait the tubs again (at sea on the way home, or at the quay)', [len(logs(L, 'Fortøyd i Finnsnes')), len(logs(L, 'stamper er egnet'))])
            print(ok(L['ops']['on'] and not L['ops']['stop']), 'S1 the plan is still on after three days', L['ops'])
            S1L = L
        print('== S2 med motoren: garn 6 + 6 + 6 ved 24 t, mannskapet alene, tre døgn')
        L = await pg.evaluate("""(async () => { D2.reset(22); const home = D2.boat('sjark', 3, false); D2.gear('garn', 18); await mapNeed(portById(home).p, 14);
          const F = D2.spots(3, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'garn', jig:true, places:[D2.felt('g1', F[0], 6, 24), D2.felt('g2', F[1], 6, 24), D2.felt('g3', F[2], 6, 24), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const L = await D2.run(3 * 1440, 'open', 'S2e'); L.err = err; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S2e plan2Make:', L['err'])
        else:
            print(tl(L, 70)); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:12])) for d in L['days']]
            print('  log:', '\n   '.join(['%s %s' % tuple(e) for e in L['log'] if 'WP' not in e[1] and 'rekord' not in e[1] and ': «' not in e[1]][:60]))
            print('  gearLog:', L['gearLog']); print('  stats:', json.dumps(L['stats'], ensure_ascii=False)[:600]); print('  ops:', json.dumps(L['ops'], ensure_ascii=False)[:300]); print('  fin:', L['fin'])
            hauls = [g for g in L['gearLog'] if g['haul']]; d1 = [g for g in L['gearLog'] if g['set'].startswith('D1')]
            print(ok(not L['err'] and len(d1) == 3 and all(g['n'] == 6 for g in d1)), 'S2 day 1 sets the three strings of six', [(g['set'], g['n']) for g in d1])
            print(ok(len(hauls) >= 6 and all(24.0 - 0.05 <= g['soak'] <= 26 for g in hauls)), 'S2 every string is hauled after 24-26 h, and set again', [(g['set'], g['soak']) for g in hauls])
            print(ok(len(L['fin']['sets']) == 3 and len(L['stats']['days']) >= 2), 'S2 three strings stand at the end, and the catch was landed on day 2 and 3', [L['fin']['sets'], [(d['d'], d['kg']) for d in L['stats']['days']]])
        print('== S3 med motoren: 15 + 15 teiner ved 48 t, juksa, agn kjøpt på mottaket, fire døgn')
        L = await pg.evaluate("""(async () => { D2.reset(23); const home = D2.boat('kyst15', 3, false); D2.gear('teine', 30, 0); await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'teiner', jig:true, places:[D2.felt('t1', F[0], 15, 48), D2.felt('t2', F[1], 15, 48), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'full'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true; const c0 = S.cash;
          const L = await D2.run(4 * 1440, 'open', 'S3e'); L.err = err; L.spent = Math.round(c0 - S.cash); L.bait = S.pgear.bait; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S3e plan2Make:', L['err'])
        else:
            print(tl(L, 80)); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:12])) for d in L['days']]
            print('  log:', '\n   '.join(['%s %s' % tuple(e) for e in L['log'] if 'WP' not in e[1] and 'rekord' not in e[1] and ': «' not in e[1]][:60]))
            print('  gearLog:', L['gearLog']); print('  ops:', json.dumps(L['ops'], ensure_ascii=False)[:300]); print('  fin:', L['fin'], 'spent', L['spent'], 'bait', L['bait'])
            hauls = [g for g in L['gearLog'] if g['haul']]; bought = logs(L, 'Kjøpte')
            print(ok(not L['err'] and bought and all(g['n'] == 15 for g in L['gearLog'][:2]) and len(L['gearLog']) >= 2), 'S3 bait is bought at the plant, then both strings of 15 pots are set', [bought[:2], [(g['set'], g['n']) for g in L['gearLog'][:2]]])
            print(ok(len(hauls) >= 2 and all(48.0 - 0.05 <= g['soak'] <= 52 for g in hauls)), 'S3 the pots are hauled after 48-52 h and set again', [(g['set'], g['soak']) for g in hauls])
            print(ok(L['ops']['on'] and not L['ops']['stop']), 'S3 the plan is still on after four days', L['ops'])
        print('== S7 med motoren: valgt mottak, og «når lasten er full» holder fangsten om bord')
        L = await pg.evaluate("""(async () => { D2.reset(27); const home = D2.boat('sjark', 2, true); await mapNeed(portById(home).p, 14);
          const J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'juksa', jig:true, places:[D2.juks('j1', J[0])], dep:5, land:{mode:'port', port:'husoy', when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true; const L = await D2.run(1440, 'open', 'S7e');
          D2.reset(28); const home2 = D2.boat('sjark', 2, true); await mapNeed(portById(home2).p, 14);
          const o2 = S.ops = plan2New({home:home2, rig:'juksa', jig:true, places:[D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'full'}});
          const err2 = await D2.make(o2); if (err2) return {err:err2}; o2.on = true; const L2 = await D2.run(1440, 'open', 'S7f');
          return {err, M:o.M, port:L.stats.sum.port, days:L.days.map(d => d.text.slice(0, 8)), ev:L.ev.slice(0, 30), full:{M:o2.M, hold:L2.fin.hold, port:L2.fin.port, days:L2.days.map(d => d.text.slice(0, 8)), stats:L2.stats.sum, ev:L2.ev.slice(0, 30), log:L2.log.filter(e => /Fortøyd|Beholder|levert/.test(e[1]))}}; })()""")
        if L.get('err') and 'M' not in L: print('FEIL S7e plan2Make:', L['err'])
        else:
            print('  valgt:', L['M'], L['port'], L['days']); print('  full:', json.dumps(L['full'], ensure_ascii=False)[:1200])
            print(ok(L['M'] == 'husoy' and 'husoy' in L['port']), 'S7 the chosen plant (Husøy) is where the plan lands', [L['M'], L['port']])
            print(ok(L['full']['hold'] > 0 and L['full']['port'] == 'finnsnes' and L['full']['stats']['trips'] == 0), 'S7 «when the hold is full»: the day\'s small catch stays aboard at home, nothing landed yet', [L['full']['hold'], L['full']['port'], L['full']['stats']['trips']])
        print('== S14: statistikken etter S1, og etter lagring og omlasting')
        if S1L:
            d = S1L['stats']['days']; sm = S1L['stats']['sum']
            print(ok(len(d) >= 3 and sum(x['kg'] for x in d) == sm['kg'] and sum(x['trips'] for x in d) == sm['trips'] and all(x['sp'] and x['port'] for x in d[:3])), 'S14 three days with kg, kr, species and plant, and the sum adds up', [(x['d'], x['kg'], x['kr'], list(x['sp'].items())[:3], x['port']) for x in d[:3]])
            r = await pg.evaluate("""(async () => { D2.reset(29); const home = D2.boat('sjark', 2, true); const o = S.ops = plan2New({home, rig:'juksa', places:[D2.juks('j1', {x:portById(home).p.x, y:portById(home).p.y - 3})]}); o.stats.days.push({d:'2028-03-06', trips:1, kg:216, kr:3875, lott:2087, cost:761, conf:0, sp:{torsk:120}, port:{botnhamn:216}}); o.stats.sum.kg = 216; save(); return S.ops.stats.sum.kg; })()""")
            await pg.reload(); await pg.wait_for_timeout(2500)
            r2 = await pg.evaluate("S.ops && S.ops.v === 4 && S.ops.stats && S.ops.stats.days.length === 1 && S.ops.stats.days[0].kg === 216 && S.ops.stats.sum.kg === 216")
            print(ok(r == 216 and r2), 'S14 the statistics survive a save and a reload', [r, r2])
            await pg.evaluate(D2)
        # ---- part 3: the weather without a search, the energy and the tiredness, the watches, the rules with a date, the takeover
        print('== S4: været. Grense 10 m/s. Dag 1: 12 m/s kl. 03–08. Dag 2: fint ved avgang, 15 m/s kl. 11–14. Mannskapet alene.')
        L = await pg.evaluate("""(async () => { D2.reset(24); const home = D2.boat('sjark', 2, false); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, wx:{wind:10, hs:1.5}, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          let LR = 0; const lr0 = leiaRoute; leiaRoute = (...a) => { LR++; return lr0(...a); };
          // the wind by the hour asked for, so the forecast sees it too: 12 m/s 03-08 on day 1, 15 m/s 11-14 on day 2, else 5
          const wind0 = windAt; windAt = (H, p) => { const h = driftHod(H), d = Math.floor((H * 60 - D2.T0) / 1440) + 1; return d === 1 && h >= 3 && h < 8 ? 12 : d === 2 && h >= 11 && h < 14 ? 15 : 5; }; const dir0 = windDir; windDir = () => 200;
          const L = await D2.run(2 * 1440 + 600, 'open', 'S4e'); leiaRoute = lr0; windAt = wind0; windDir = dir0; L.err = err; L.LR = LR; L.ly = o.ly; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S4e plan2Make:', L['err'])
        else:
            print(tl(L, 90)); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:10])) for d in L['days']]
            print('  log:', '\n   '.join(['%s %s' % tuple(e) for e in L['log'] if 'WP' not in e[1] and 'rekord' not in e[1] and ': «' not in e[1]][:70]))
            print('  msgs:', '\n   '.join(['%s %s' % tuple(e) for e in L['msgs'] if 'Trofeveggen' not in e[1]][:20]))
            print('  gearLog:', L['gearLog']); print('  ops:', json.dumps(L['ops'], ensure_ascii=False)[:400]); print('  LR:', L['LR'], 'ly:', L['ly'])
            o_ = outs(L); waits = [m for m in L['msgs'] if 'Venter på været' in m[1]]
            print(ok(len(o_) >= 1 and o_[0].startswith('D1 08:') and waits and 'Går kl. 08:00' in waits[0][1]), 'S4 day 1: the plan waits for the weather with the hour it will go, and goes at 08:00', [o_[:1], waits[:1]])
            ly = logs(L, 'Går i ly'); back = [e for e in L['ev'] if e[0].startswith('D2') and '-:port@' in e[1]]
            print(ok(len(o_) >= 2 and o_[1].startswith('D2 05:0') and ly and back), 'S4 day 2: out at 05:00, the gale at 11 sends her to shelter on the kept legs, and she is moored', [o_[1:2], ly[:1], back[:1]])
            out3 = [x for x in o_ if x.startswith('D2 1')]; hauls = [g for g in L['gearLog'] if g['haul'] and g['set'].startswith('D2')]
            print(ok(out3 and hauls and all(g['soak'] >= 6 for g in hauls) and L['ops']['on'] and not L['ops']['stop']), 'S4 day 2: she goes out again when the wind drops, hauls the line that stood, and the plan is still on', [out3, [(g['set'], g['soak']) for g in hauls], L['ops']['on']])
            print(ok(L['LR'] == 0), 'S4 no route was searched while the plan ran (the shelter used the kept legs)', L['LR'])
        print('== S5: energien. Deg om bord med 0 % kl. 03:00; så mannskapet slitne midt på dagen.')
        L = await pg.evaluate("""(async () => { D2.reset(25); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true; S.energy = 0;
          let dep = null; const hook = i => { if (dep == null && S.boat.status === 'unmooring') dep = S.t; if (dep != null && S.t === dep + 240) for (const c of S.crew) c.fatigue = 75; };   // four hours after the departure: the line has stood two, and is due in four
          const L = await D2.run(1440 + 600, 'open', 'S5e', hook); L.err = err; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S5e plan2Make:', L['err'])
        else:
            print(tl(L, 60)); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:10])) for d in L['days']]
            print('  log:', '\n   '.join(['%s %s' % tuple(e) for e in L['log'] if 'WP' not in e[1] and 'rekord' not in e[1] and ': «' not in e[1]][:40]))
            print('  msgs:', '\n   '.join(['%s %s' % tuple(e) for e in L['msgs'] if 'Trofeveggen' not in e[1]][:12])); print('  gearLog:', L['gearLog'])
            o_ = outs(L); waits = [m for m in L['msgs'] if 'Du må hvile til' in m[1]]; enAt = [e for e in L['ev'] if 'unmooring' in e[1]]
            print(ok(waits and o_ and not o_[0].startswith('D1 05:0') and enAt and enAt[0][2] >= 50), 'S5 with 0 % energy the plan waits, says until when, and goes out rested', [waits[:1], o_[:1], enAt[:1]])
            cut = logs(L, 'Mannskapet er slitne'); hauls = [g for g in L['gearLog'] if g['haul']]
            d1h = [g for g in hauls if g['set'].startswith('D1')]
            print(ok(cut and len(d1h) == 2 and all(5.9 <= g['soak'] <= 7 for g in d1h) and logs(L, 'Fortøyd i Finnsnes')), 'S5 the tired crew end the day: no more jigging, the line is still hauled when due (within 3 h), then in', [cut[:1], [(g['set'], g['soak']) for g in d1h]])
        print('== S6: døgndrift med fire på kyst15, 48 timer')
        L = await pg.evaluate("""(async () => { D2.reset(26); const home = D2.boat('kyst15', 4, false); await mapNeed(portById(home).p, 14);
          const J = D2.spots(2, 4, 12);
          const o = S.ops = plan2New({home, rig:'juksa', jig:true, places:[D2.juks('j1', J[0]), D2.juks('j2', J[1])], rhythm:'watch', dep:5, land:{mode:'near', port:null, when:'full'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const W = []; let fatMax = 0, offWait = 0; const hook = i => { if (i % 60 === 0) W.push(S.crew.map(c => c.sleepW ? 'z' : 'w').join('')); fatMax = Math.max(fatMax, ...S.crew.map(c => c.fatigue)); if (o.run && o.run.wait && o.run.wait.k === 'off') offWait++; };
          const L = await D2.run(2 * 1440, 'open', 'S6e', hook); L.err = err; L.W = W; L.fatMax = Math.round(fatMax); L.offWait = offWait; return L; })()""")
        if L.get('err') and not L.get('ev'): print('FEIL S6e plan2Make:', L['err'])
        else:
            print(tl(L, 40)); [print('   ' + d['at'] + ' | ' + ' | '.join(d['text'][:10])) for d in L['days']]
            print('  vaktene per time:', ''.join(w[0] for w in L['W']), '|', ''.join(w[1] for w in L['W'])); print('  fatMax', L['fatMax'], 'offWait', L['offWait'], 'stats', json.dumps(L['stats']['sum'])[:200], 'fin', L['fin'])
            seq = ''.join(w[0] for w in L['W']); changes = sum(1 for a, c in zip(seq, seq[1:]) if a != c)
            print(ok(L['fatMax'] < 85 and 3 <= changes <= 6 and 'z' in seq and 'w' in seq), 'S6 two watches of 12 hours: the skipper sleeps and wakes at 06 and 18, and the tiredness stays under 85 (a 12-hour watch, Jonas 26.10.2026)', [L['fatMax'], changes])
            print(ok(L['offWait'] == 0 and L['stats']['sum']['trips'] >= 1 and L['ops']['on']), 'S6 the boat never waits for the watch asleep, lands and goes out again', [L['offWait'], L['stats']['sum']['trips'], L['ops']['on']])
        print('== S8: reglene. Et felt stengt til en dato; torskekvoten oppbrukt; åpen gruppe uten deg om bord.')
        L = await pg.evaluate("""(async () => { D2.reset(28); const home = D2.boat('sjark', 2, false); D2.gear('line', 4); await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4), R = {};
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; R.warn = plan2Check(o).warnings; const err = await D2.make(o); if (err) return {err}; o.on = true;
          // field 1 closed until the day after tomorrow at 05:00 (the rules with the hour)
          const closeUntil = D2.T0 / 60 + 48 + 2, rb0 = ruBlockMsg; ruBlockMsg = q => { const H = q.H == null ? S.t / 60 : q.H; if (q.gear === 'line' && q.p && dist(q.p, F[0]) < 0.01 && H < closeUntil) return 'Stengt felt (test).'; return rb0(q); };
          const L1 = await D2.run(3 * 1440, 'open', 'S8a'); ruBlockMsg = rb0;
          R.a = {ev:L1.ev.slice(0, 12), wait:L1.ev.filter(e => e[1].includes('?closed')).map(e => e[0]), msgs:L1.msgs.filter(m => /stengt|Stengt/.test(m[1])).slice(0, 3), outs:L1.ev.filter(e => e[1].includes('unmooring@finnsnes') && e[1].startsWith('fish')).map(e => e[0]), on:o.on, stop:o.stop, sets:L1.gearLog.map(g => g.set)};
          // the cod quota used up: not the plan's business (Jonas 27.10.2026): she goes on, the check only notes it
          S.tripOwner = true; const lim = codLimitNow(S.t / 60), q0 = quotaState().torsk; quotaState().torsk = lim + 10; o.on = true; o.stop = null; o.hold = 0; o.run = null; await D2.run(10, 'open', 'S8b'); R.b = {stop:o.stop && o.stop.k, fix:o.stop && o.stop.fix, access:access()}; quotaState().torsk = q0;
          return R; })()""")
        if L.get('err'): print('FEIL S8 plan2Make:', L['err'])
        else:
            print('  S8:', json.dumps(L, ensure_ascii=False)[:1500])
            a = L['a']
            print(ok(any('om bord for å fiske torsk' in w for w in L['warn'])), 'S8 open group without you aboard: the check warns (cod, haddock and saithe are bycatch)', L['warn'][:1])
            print(ok(a['wait'] and a['msgs'] and 'venter til' in a['msgs'][0][1] and a['on'] and not a['stop'] and a['outs'] and a['outs'][0].startswith('D3')), 'S8 a field closed until a date: the plan waits with the date, does not stop, and goes out when it opens', [a['wait'][:1], a['msgs'][:1], a['outs'][:1]])
            print(ok(not L['b']['stop']), 'S8 the cod quota used up does not stop the plan (the rules confiscate cod over the bycatch share at the landing)', L['b'])
        print('== S11: du tar over midt i S1, seiler et stykke, og gir båten tilbake')
        L = await pg.evaluate("""(async () => { D2.reset(31); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await mapNeed(portById(home).p, 14);
          const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4), R = {};
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const L1 = await D2.run(60 * 4, 'open', 'S11a');   // 07:00: jigging with the line in the sea
          R.before = {status:S.boat.status, sets:mySets().length, i:o.run.i};
          // your own route: a kilometre north, then stop there
          const p = {x:S.boat.pos.x, y:S.boat.pos.y - 1}; S.plan = {wps:[{x:p.x, y:p.y, port:null, fish:0}], idx:0, speed:6, returning:false}; S.boat.status = 'sailing'; S.boat.fishUntil = null;
          const L2 = await D2.run(60, 'open', 'S11b'); R.held = !!o.held; R.took = {status:S.boat.status, plan:!!S.plan, held:!!o.held};
          if (S.plan){ S.plan = null; S.boat.status = 'idle'; }
          plan2Resume(o); const L3 = await D2.run(60 * 14, 'open', 'S11c');
          R.after = {days:L3.days.map(d => d.text.slice(0, 8)), ev:L3.ev.slice(0, 20), gearLog:L3.gearLog, log:L3.log.filter(e => /Trekker|Trakk|Fortøyd|tatt over|Gikk ut/.test(e[1])), on:o.on, stop:o.stop, fin:L3.fin};
          R.sets = mySets().length; return R; })()""")
        if L.get('err'): print('FEIL S11 plan2Make:', L['err'])
        else:
            print('  S11:', json.dumps(L, ensure_ascii=False)[:2000])
            a = L['after']; hauls = [g for g in a['gearLog'] if g['haul']]
            print(ok(L['before']['status'] == 'fishing' and L['before']['sets'] == 2 and L['held'] and L['took']['held']), 'S11 the plan waits while you have the boat; the line stands in the sea', [L['before'], L['took']])
            trakk = [e for e in a['log'] if 'Trakk line' in e[1]]
            print(ok(a['days'] and any('Trekker felt 1' in x for x in a['days'][0]) and len(trakk) == 2 and all('sto 6 t' in e[1] or 'sto 7 t' in e[1] for e in trakk) and L['sets'] == 0 and a['on'] and not a['stop'] and a['fin']['port'] == 'finnsnes'), 'S11 given back, the day goes on from where she is: the line is hauled when due, landed, and home', [a['days'][0][:5] if a['days'] else None, trakk, a['fin']['port']])
        # ---- Jonas' round of 27.10.2026: the line's kind per field and the units owned (points 2 and 4), the order of the places (5), the
        # string's heading from the chart (3), and round the clock with you as the skipper and three crew (the question)
        print('== S15: to linetyper, stampene fordelt på feltene, og dagen i den rekkefølgen plassene står')
        L = await pg.evaluate("""(async () => { const R = {};
          D2.reset(51); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); const pg = S.pgear; pg.lines.bank.n = 10; pg.lines.bank.baited = 10; pg.lines.bank.bt = {makrell:10}; pg.bait = {makrell:80};
          await mapNeed(portById(home).p, 14); const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 4, 6, 'hyse'), D2.felt('f2', F[1], 4, 6, 'bank'), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}}); o.M = D2.plant(o);
          R.units = {hyse:p2Units('line', 'hyse'), bank:p2Units('line', 'bank'), leftF1:p2Left(o, o.places[0]), leftF2:p2Left(o, o.places[1]), kind:p2LineKind(o)};
          const d = D2.dry(o, D2.T0 / 60 + 2); R.dryText = d.text; R.sets = d.day.steps.filter(s => s.k === 'sett').map(s => [s.pid, s.lk, s.n]);
          // a third field of hyseline gets nothing: the four tubs are on field 1 (the page refuses it, the day skips it)
          o.places.splice(2, 0, D2.felt('f3', F[1], 2, 6, 'hyse')); const d2 = D2.dry(o, D2.T0 / 60 + 2); R.skipped3 = d2.day.skipped.map(x => x.id); o.places.splice(2, 1);
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true; let seaMax = {};
          const Lr = await D2.run(1440, 'open', 'S15', () => { for (const s of mySets()) seaMax[s.fid] = [s.lk, s.n]; }); R.sea = seaMax; R.ev = Lr.ev.length; R.fin = Lr.fin; R.log = Lr.msgs.filter(e => /Kunne ikke|plass/i.test(e[1])).slice(0, 4); return R; })()""")
        if L.get('err'): print('FEIL S15 plan2Make:', L['err'])
        else:
            print('  enheter:', L['units']); print('  sett:', L['sets']); print('  i sjøen:', L['sea'], L['log'])
            print(ok(L['units']['hyse'] == 4 and L['units']['bank'] == 10 and L['units']['leftF1'] == 4 and L['units']['leftF2'] == 10 and L['units']['kind'] == 'bank'), 'S15 the tubs are counted per line kind, and a new field would get the kind with most left', L['units'])
            print(ok(L['sets'] == [['f1', 'hyse', 4], ['f2', 'bank', 4]]), 'S15 the day sets each field with its own kind and tubs', L['sets'])
            print(ok('f3' in L['skipped3']), 'S15 a third hyseline field has no tubs left and is skipped in the day', L['skipped3'])
            print(ok(L['sea'].get('f1') == ['hyse', 4] and L['sea'].get('f2') == ['bank', 4]), 'S15 the engine sets the haddock line at field 1 and the bank line at field 2', L['sea'])
        print('== S16: juksplassen først i lista: juksa mesteparten av dagen, lina settes før hjemturen og trekkes neste morgen')
        L = await pg.evaluate("""(async () => { const R = {};
          D2.reset(52); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); await mapNeed(portById(home).p, 14); const F = D2.spots(1, 4, 10), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.juks('j1', J[0]), D2.felt('f1', F[0], 4, 10, 'hyse')], dep:6, land:{mode:'near', port:null, when:'trip'}}); o.M = D2.plant(o);
          const d = D2.dry(o, D2.T0 / 60 + 3); R.dryText = d.text; const ks = d.day.steps.map(s => s.k); R.order = ks; const jk = d.day.steps.find(s => s.k === 'juks'), st = d.day.steps.find(s => s.k === 'sett'); R.jigH = jk ? Math.round(jk.h * 10) / 10 : null; R.setAfterJig = !!(jk && st && st.t > jk.t); R.dayH = Math.round((d.day.home - d.day.t0) * 10) / 10;
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const Lr = await D2.run(2 * 1440, 'open', 'S16'); R.gear = Lr.gearLog.map(g => [g.set, g.haul, g.soak]); R.fin = Lr.fin; R.days = Lr.days.map(x => x.text); return R; })()""")
        if L.get('err'): print('FEIL S16 plan2Make:', L['err'])
        else:
            print('  dagen:', L['dryText']); print('  redskap:', L['gear'])
            print(ok(L['setAfterJig'] and L['jigH'] and L['jigH'] >= 3 and L['order'].index('juks') < L['order'].index('sett') and L['dayH'] <= 14.5), 'S16 the jig comes first with most of the day, the line is set after it, within the day', [L['jigH'], L['dayH'], L['order']])
            g = L['gear']; print(ok(len(g) >= 1 and g[0][1] is not None and g[0][2] is not None and g[0][2] >= 9.5 and int(g[0][0].split(' ')[1].split(':')[0]) >= 12), 'S16 the engine sets the line in the afternoon and hauls it next day after the soak', g)
        print('== S17: lenkeretningen fra kartet: lina settes i den retningen')
        L = await pg.evaluate("""(async () => { const R = {};
          D2.reset(53); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); await mapNeed(portById(home).p, 14); const F = D2.spots(1, 4, 10);
          const km = 4 * LINE_KINDS.hyse.hooks * GEAR.line.kmHook; let hdg = null; for (let a = 0; a < 16 && hdg == null; a++){ const h = a * Math.PI / 8; try { if (setGeomExact(F[0], h, km)) hdg = h; } catch (e){} } if (hdg == null) return {err:'ingen retning passer'};
          const o = S.ops = plan2New({home, rig:'line', jig:false, places:[D2.felt('f1', F[0], 4, 8, 'hyse', hdg)], dep:6, land:{mode:'near', port:null, when:'trip'}}); o.M = D2.plant(o);
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true; let got = null;
          await D2.run(600, 'open', 'S17', () => { const s = mySets()[0]; if (s && !got) got = {a:s.a, b:s.b}; }); if (!got) return {err:'ingen setting på 10 t', hdg};
          const dh = Math.atan2(got.b.x - got.a.x, -(got.b.y - got.a.y)); R.hdg = hdg; R.got = ((dh % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); R.km = Math.round(dist(got.a, got.b) * 100) / 100; R.want = Math.round(km * 100) / 100; return R; })()""")
        if L.get('err'): print('FEIL S17:', L['err'])
        else:
            dd = abs(L['got'] - L['hdg']); dd = min(dd, 2 * 3.14159 - dd)
            print(ok(dd < 0.05 and abs(L['km'] - L['want']) < 0.2), 'S17 the string goes out exactly on the heading from the card, at its length', L)
        print('== S18: døgndrift med deg som skipper og tre i mannskapet: du går dagvakt og sover i køya om natta')
        L = await pg.evaluate("""(async () => { const R = {};
          D2.reset(54); const home = D2.boat('kyst15', 3, true); D2.gear('line', 10); S.pgear.bait = {makrell:200}; await mapNeed(portById(home).p, 16); const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const o = S.ops = plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 5, 8, 'hyse'), D2.felt('f2', F[1], 5, 8, 'hyse'), D2.juks('j1', J[0])], rhythm:'watch', dep:6, land:{mode:'near', port:null, when:'full'}}); o.M = D2.plant(o);
          const C = plan2Check(o); R.check = {ok:C.ok, errors:C.errors}; if (!C.ok) return R;
          DRIFT2 = true; const err = await D2.make(o); if (err) return {err}; o.on = true;
          const W = []; let enMin = 100, bunkAt = [], upAt = [];
          const Lr = await D2.run(2 * 1440, 'open', 'S18', i => { if (i % 60 === 0){ const h = driftHod(S.t / 60); W.push([Math.round(h), S.boat.status, resting() ? 'koye' : '-', Math.round(S.energy), plan2Watch(S.t / 60).w, S.crew.filter(c => c.sleepW).length]); } enMin = Math.min(enMin, S.energy); if (resting() && S.rest && S.rest.w === 'koye') bunkAt.push(Math.round(driftHod(S.t / 60))); });
          R.W = W; R.enMin = Math.round(enMin); R.bunkHours = [...new Set(bunkAt)].sort((a, b) => a - b); R.fin = Lr.fin; R.trips = o.stats.sum.trips; R.on = o.on; R.stop = o.stop; R.wait = o.run && o.run.wait && o.run.wait.no; R.ev = Lr.ev.slice(0, 14); return R; })()""")
        if L.get('err'): print('FEIL S18:', L['err'])
        elif not L['check']['ok']: print('FEIL S18 the check refuses round the clock with you and three crew:', L['check'])
        else:
            print('  timer:', L['W'][:30]); print('  køya:', L['bunkHours'], 'energi min', L['enMin'], 'turer', L['trips'], 'på', L['on'], 'venter', L['wait'])
            night = [h for h in L['bunkHours'] if h >= 19 or h < 5]; day = [h for h in L['bunkHours'] if 7 <= h < 17]
            print(ok(L['on'] and not L['stop'] and L['enMin'] >= 15 and len(night) >= 6 and len(day) == 0), 'S18 with you and three crew the plan runs round the clock: you sleep in the bunk at night, are up by day, and never run out of energy', [L['enMin'], L['bunkHours'], L['on'], L['stop'], L['wait']])
        # ---- part 4: the game closed. The same plan with the same seed: open all the way; open, 30 h closed (playMinutes, as catchUp), open;
        # nine days closed with the wall clock on; and «Mens du var borte»
        print('== S9: lukket spill')
        L = await pg.evaluate("""(async () => { const R = {};
          const setup = async () => { D2.reset(39); const home = D2.boat('sjark', 2, true); D2.gear('line', 4); S.pgear.bait = {makrell:60}; await mapNeed(portById(home).p, 14); return home; };
          const home = await setup(); const F = D2.spots(2, 4, 12), J = D2.spots(1, 2.5, 4);
          const mk = () => plan2New({home, rig:'line', jig:true, places:[D2.felt('f1', F[0], 2, 6), D2.felt('f2', F[1], 2, 6), D2.juks('j1', J[0])], dep:5, land:{mode:'near', port:null, when:'trip'}});
          DRIFT2 = true; const o0 = S.ops = mk(); const err = await D2.make(o0); if (err) return {err}; const made = JSON.stringify(o0);
          const fresh = async () => { await setup(); const o = S.ops = JSON.parse(made); o.on = true; return o; };
          // the map's tiles round the whole plan in first, and one open run as a warm-up: the density reads the sim tiles as they come in, and a
          // tile that comes in between two frames of an open run gives another catch than one that was in from the start
          for (const q of [portById(home).p, portById(o0.M).p].concat(F, J)) await mapNeed(q, 12);
          await fresh(); await D2.run(3 * 1440, 'open', 'S9warm');
          // open all the way
          await fresh(); const A = await D2.run(3 * 1440, 'open', 'S9open');
          // open, then 30 hours in one go, then open
          const o2 = await fresh(); const B1 = await D2.run(1440, 'open', 'S9b1'); const t0 = performance.now(); const B2 = await D2.run(1800, 'closed', 'S9b2'); const ms30 = performance.now() - t0; const B3 = await D2.run(3 * 1440 - 1440 - 1800, 'open', 'S9b3');
          const cat = (...Ls) => Ls.reduce((a, L) => a.concat(L.ev.filter((e, i) => !(i === 0 && a.length && a[a.length - 1][1] === e[1]))), []);
          const B = {ev:cat(B1, B2, B3), stats:JSON.parse(JSON.stringify(o2.stats)), gearLog:B3.gearLog, fin:B3.fin, log:B1.log.concat(B2.log, B3.log)};
          B.gearLogAll = (S.gearLog || []).filter(e => e.tSet >= D2.T0).map(e => [D2.when(e.tSet), e.tHaul ? D2.when(e.tHaul) : null, e.kg]);
          const gl = (S.gearLog || []); 
          // the open run's gear log, for the comparison (kept from run A)
          R.A = {ev:A.ev, stats:A.stats, gearLog:A.gearLog, fin:A.fin, days:A.days.length}; R.B = {ev:B.ev, stats:B.stats, gearLogAll:B.gearLogAll, fin:B.fin, ms30:Math.round(ms30)};
          R.A.gearLogAll = A.gearLog.map(g => [g.set, g.haul, g.kg]);
          // nine days closed, the wall clock on
          const o3 = await fresh(); const t1 = performance.now(); const C = await D2.run(9 * 1440, 'closed', 'S9c'); R.C = {wall_s:Math.round((performance.now() - t1) / 100) / 10, trips:o3.stats.sum.trips, kg:o3.stats.sum.kg, days:C.days.length, on:o3.on, stop:o3.stop, wait:o3.run && o3.run.wait && o3.run.wait.k, fin:C.fin, sets:mySets().length, lr:0};
          // «Mens du var borte»: two days away, played as catchUp plays them, with the away screen before and after
          const o4 = await fresh(); awayStart(2 * 1440, 2 * 1440 / GAME_RATE * 60000); playMinutes(2 * 1440); awayEnd(); await new Promise(r => setTimeout(r, 1600));
          const md = document.getElementById('modal'); R.away = {shown:!!md && !md.hidden, text:(md ? md.innerText : '').replace(/\\s+/g, ' ').slice(0, 400), trips:o4.stats.sum.trips, kg:o4.stats.sum.kg}; if (typeof closeModal === 'function') closeModal(); else if (md) md.hidden = true;
          return R; })()""")
        if L.get('err'): print('FEIL S9 plan2Make:', L['err'])
        else:
            A, B, C = L['A'], L['B'], L['C']
            print('  åpent: dager', A['days'], 'stats', [(d['d'], d['kg'], d['kr']) for d in A['stats']['days']], 'fin', A['fin']); print('  lukket 30 t:', [(d['d'], d['kg'], d['kr']) for d in B['stats']['days']], 'fin', B['fin'], 'ms', B['ms30'])
            print('  redskap åpent:', A['gearLogAll']); print('  redskap lukket:', B['gearLogAll'])
            same_ev = [e[:2] for e in A['ev']] == [e[:2] for e in B['ev']]
            if not same_ev:
                import itertools
                for i, (ea, eb) in enumerate(itertools.zip_longest(A['ev'], B['ev'])):
                    if ea is None or eb is None or ea[:2] != eb[:2]: print('  første avvik ved', i, ea, eb); break
            kgA = sum(d['kg'] for d in A['stats']['days']); kgB = sum(d['kg'] for d in B['stats']['days']); krA = sum(d['kr'] for d in A['stats']['days']); krB = sum(d['kr'] for d in B['stats']['days'])
            print(ok(len(A['stats']['days']) == 3 and len(B['stats']['days']) == 3 and abs(kgA - kgB) <= 0.02 * max(1, kgA) and abs(krA - krB) <= 0.03 * max(1, krA)), 'S9 30 h closed in the middle gives the same landings as open (kg within 2 %, kr within 3 %: the price follows the species and sizes, which vary a little between two runs)', [(kgA, krA), (kgB, krB)])
            # the kg a set gives differs a little between the runs (the density reads the sim tiles as they come in between the frames of an open run), so the minutes are compared, not the kg
            gA = [g[:2] for g in A['gearLogAll']]; gB = [g[:2] for g in B['gearLogAll']]
            print(ok(same_ev and gA == gB and A['fin']['port'] == B['fin']['port'] and A['fin']['en'] == B['fin']['en'] and A['fin']['sets'] == B['fin']['sets']), 'S9 the same steps at the same minutes, the same gear set and hauled at the same minutes, the same place and rest at the end', ['likt' if same_ev else 'ulikt', gA == gB, A['fin'], B['fin']])
            print('  ni døgn lukket:', C)
            print(ok(C['wall_s'] < 20 and C['trips'] >= 8 and C['on'] and not C['stop'] and C['days'] >= 9), 'S9 nine days closed: played in under 20 s (8 s alone, more with other tests beside it), with a landing every day and the plan still on', [C['wall_s'], C['trips'], C['days']])
            print('  borte:', L['away'])
            print(ok(L['away']['shown'] and 'borte' in L['away']['text'] and L['away']['trips'] >= 2), 'S9 «Mens du var borte» shows what the plan landed', L['away'])
        for s in ['S10', 'S13']:
            if s not in BUILT: print('VENTER', s, 'bygges i en senere del (02-design.md kapittel 7)')
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
