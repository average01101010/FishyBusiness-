# Driftsplan 2 (docs/planer/driftsplan-2/02-design.md): the scenarios S1–S14 from the brief, one function each. A scenario whose part is
# not built yet prints VENTER, not FEIL. Without 3D (LITE). The harness: a fixed date, a seeded Math.random, the game's loop held, the
# boat at Finnsnes with crew and gear; the day is reckoned dry (planDay) in part 1, and played with the engine from part 2.
import asyncio, json, sys
from playwright.async_api import async_playwright
from _env import boot
ok = lambda c: 'OK  ' if c else 'FEIL'
BUILT = {'S1', 'S2', 'S3', 'S7', 'S12'}   # the scenarios the parts built so far cover (part 1: dry)

D2 = r"""window.D2 = (() => {
  function seed(s){ let a = s >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
  const felt = (id, q, n, soak) => ({id, k:'felt', x:q.x, y:q.y, n, soak, hdg:null}), juks = (id, q) => ({id, k:'juks', x:q.x, y:q.y});
  // a dry day: the day from the answers and a state (the live one, with overrides), and its text
  function dry(o, H0, over){ const st = Object.assign(plan2State(o), over || {}); if (over && over.aboard) st.aboard = Object.assign(plan2State(o).aboard, over.aboard); const day = planDay(o, H0, st); return {day, text:planDayText(o, day).map(x => x[0] + ' ' + x[1]), st}; }
  const h = t => Math.round((t - T0 / 60) * 100) / 100;   // hours since the test's start
  return {seed, reset, boat, gear, spots, plant, felt, juks, dry, h, T0, when};
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
        R = {}

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

        for s in ['S4', 'S5', 'S6', 'S8', 'S9', 'S10', 'S11', 'S13', 'S14']:
            if s not in BUILT: print('VENTER', s, 'bygges i en senere del (02-design.md kapittel 7)')
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
