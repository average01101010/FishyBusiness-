from _env import GAME
# Passive gear (R1–R7): nets, line and pots that stand in the sea. Buying and room aboard, rules at setting (two aboard for nets, the fjord
# line's 80 nets and 5,000 hooks), where the string goes, soak curves (line: more over a day, amphipods after; pots: 20 hours, dying after
# 48; nets: fish spoils faster in summer), mesh size, hauling into the deck-work pipeline, crab sorting with fine and deduction, storm loss
# and reporting, tending reminders, wear, mending and the net loft, baiting at the shed and by the crew, the standing plan's stations,
# save and reload, the chart's buoys, 3D without page errors, and the calibration numbers. Math.random is seeded so the runs repeat.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
SEED = """(()=>{ let a = 20260930; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })()"""
PREP = """(()=>{ S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.stock = initStock();
  window.hand = () => Object.assign(genCrew(), {bi:false, off:false});
  window.dry = (kind, extra, p, H0, hours) => { const s = Object.assign({kind, n:1, a:{x:p.x, y:p.y}, b:{x:p.x + 0.3, y:p.y}, tSet:Math.round(H0 * 60), acc:{}, dead:0, dry:true, cond:1}, extra); const t0 = S.t; for (let h = 1; h <= hours; h++){ S.t = Math.round((H0 + h) * 60); soakHour(s, H0 + h); } S.t = t0; return s; };
  window.kgOf = s => Object.values(s.acc).reduce((a, x) => a + x.kg, 0);
  window.atSea = p => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {...p}; b.heading = 1.2; b.gop = null; };
  window.hStep = (n) => { for (let i = 0; i < n && S.boat.gop; i++) step(); };
  window.HOUR = (y, m, d, h) => (Date.UTC(y, m, d, h) - EPOCH) / 3.6e6;
  // a shallow crab spot south on Senja
  let spot = null; for (let y = 60; y < 70 && !spot; y += 0.5) for (let x = 20; x < 60; x += 0.5){ const q = {x, y}; if (!isLand(q) && depthF(q) > 12 && depthF(q) < 35){ spot = q; break; } }
  window.CRABSPOT = spot;
})()"""

async def fresh(br):
    pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
    await pg.evaluate(SEED); await pg.evaluate(PREP)
    return pg, errs

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg, errs = await fresh(br)

        # 1. crab is not a fish: the jig never takes it; buying in the phone app, sized to the room aboard
        r = await pg.evaluate("""(()=>{ const R = {};
          R.spNoCrab = !SP.includes('krabbe') && ALLSP.includes('krabbe') && SPECIES.krabbe.shell;
          S.t = Math.round(HOUR(2028, 7, 10, 6) * 60); const b = S.boat; b.gear = true;
          const spot = window.CRABSPOT; atSea(spot); b.status = 'fishing'; b.fishUntil = S.t + 480; for (let i = 0; i < 480; i++) step();
          R.jigCrab = S.hold.filter(x => x.sp === 'krabbe').length; R.jigKg = Math.round(holdTotal()); S.hold = [];
          b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; S.pgear = newPGear(); const c0 = S.cash;
          PHONE.open('redskap'); document.querySelector('[data-pa=sub][data-s=kjop]').click();
          const click = sel => { const e = document.querySelector(sel); if (e && !e.disabled) e.click(); return !!(e && !e.disabled); };
          R.clicked = [click('[data-pa=grbuy][data-w=net][data-s="156"]'), click('[data-pa=grbuy][data-w=stamp][data-s=hyse]'), click('[data-pa=grbuy][data-w=pot][data-s=small]'), click('[data-pa=grbuy][data-w=kit]'), click('[data-pa=grbuy][data-w=bait][data-n="20"]')];
          R.pg = {nets:S.pgear.nets.map(l => l.n), hyse:S.pgear.lines.hyse.n, pots:S.pgear.pots.small, kits:S.pgear.kits.n, bait:S.pgear.bait};
          R.spent = Math.round(c0 - S.cash); R.expect = 6 * GPRICE.net + 4 * LINE_KINDS.hyse.price + 20 * POTS.small.price + GPRICE.kit + 20 * GPRICE.bait;
          R.fullNets = document.querySelector('[data-pa=grbuy][data-w=net]').disabled;
          // haulers: the small electric one is not for a sjark
          PHONE.open('utstyr'); R.elSkiff = !!document.querySelector('[data-pa=equip][data-k=elhaler]') || document.body.innerHTML.includes('Elektrisk haler');
          b.type = 'sjark'; applyVessel(); PHONE.open('utstyr'); R.elSjark = document.getElementById('drawerBody').innerHTML.includes('Elektrisk haler'); R.garnhalerSjark = document.getElementById('drawerBody').innerHTML.includes('Hydraulisk garnhaler');
          PHONE.show(false); b.type = 'skiff'; applyVessel(); return R; })()""")
        print('buy:', json.dumps(r, ensure_ascii=False))
        print(ok(r['spNoCrab'] and r['jigCrab'] == 0 and r['jigKg'] > 0), 'brown crab is outside the fish list, and a day of jigging on a crab spot takes no crab')
        print(ok(all(r['clicked']) and r['pg'] == {'nets':[6], 'hyse':4, 'pots':20, 'kits':1, 'bait':20} and r['spent'] == r['expect'] and r['fullNets']), 'buying in the Gear app: nets, tubs, pots, a buoy set and bait, sized to the skiff’s room, paid exactly')
        print(ok(r['elSkiff'] and not r['elSjark'] and r['garnhalerSjark']), 'the electric hauler is for small boats, the hydraulic net hauler for the sjark')

        # 2. rules at setting: two aboard for nets, the fjord line's limits, both ends at sea
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; b.type = 'sjark'; applyVessel(); S.pgear = newPGear(); S.sets = [];
          S.pgear.nets.push({id:'na', mesh:156, n:40, cond:1}, {id:'nb', mesh:156, n:40, cond:1}, {id:'nc', mesh:156, n:1, cond:1}); S.pgear.kits.n = 9; S.pgear.lines.hyse = {n:8, baited:8};
          const inside = GROUNDS.find(g => insideFjord(g.p) && depthF(g.p) > 20).p; window.INSIDE = inside;
          S.crew = []; S.me = S.cur; atSea(inside); R.alone = !!gearRules('garn', {nid:'na'}, b.pos);
          S.crew = [hand()]; R.withOne = gearRules('garn', {nid:'na'}, b.pos); S.me = 'nobody'; S.crew = [hand(), hand()]; R.twoCrew = gearRules('garn', {nid:'na'}, b.pos); S.me = S.cur; S.crew = [hand()];
          R.set1 = startSet('garn', {nid:'na'}, 0); hStep(400); b.pos = {x:inside.x + 1.2, y:inside.y + 0.6}; if (isLand(b.pos) || !insideFjord(b.pos)) b.pos = {x:inside.x - 1.2, y:inside.y - 0.6};
          R.set2 = startSet('garn', {nid:'nb'}, 0); hStep(400); b.status = 'idle';
          R.set81 = gearRules('garn', {nid:'nc'}, b.pos); R.nets = mySets().filter(s => insideFjord(setMid(s))).reduce((a, s) => a + s.n, 0);
          R.hooks8 = gearRules('line', {lk:'hyse', n:8}, b.pos); R.hooks7 = gearRules('line', {lk:'hyse', n:7}, b.pos);
          R.geo = mySets().map(s => [!isLand(s.a), !isLand(s.b), legClear(s.a, s.b), depthF(s.a) >= 5 && depthF(s.b) >= 5, Math.round(dist(s.a, s.b) * 1000)]);
          return R; })()""")
        print('rules:', json.dumps(r, ensure_ascii=False))
        print(ok(r['alone'] and r['withOne'] is None and r['twoCrew'] is None), 'nets need two aboard: not alone; you and one crew, or two crew without you')
        print(ok(r['set1'] is None and r['set2'] is None and r['nets'] == 80 and r['set81'] and r['hooks8'] and r['hooks7'] is None), 'inside the fjord line: 80 nets and no more, 5,000 hooks (7 tubs of haddock line, not 8)')
        print(ok(all(all(g[:4]) for g in r['geo']) and all(1150 <= g[4] <= 1250 for g in r['geo'])), 'each string lies at sea between its buoys, clear of land, on at least 5 m, 30 m a net')

        # 3. soak curves and mesh size (dry sets, no stock taken)
        r = await pg.evaluate("""(()=>{ const R = {}, Hf = HOUR(2028, 1, 10, 6), Hs = HOUR(2028, 6, 10, 6), Hc = HOUR(2028, 8, 10, 6);
          let best = null, bd = 0; for (const g of GROUNDS) for (let k = 0; k < 60; k++){ const a = k * 2.4, r0 = g.r * (k % 6) / 5, q = {x:g.p.x + Math.cos(a) * r0, y:g.p.y + Math.sin(a) * r0}; if (isLand(q)) continue; const d = density('hyse', q, Hf); if (d > bd){ bd = d; best = q; } }
          const L = h => dry('line', {lk:'hyse', hooks:700, n:1}, best, Hf, h); R.line = [4, 12, 24, 48].map(h => Math.round(kgOf(L(h))));
          const age = s => { const A = s.acc.hyse; return A ? (Hf + 0) : 0; };
          // freshness at haul from the mean catch age: line after 4 h and after 30 h
          const fr = (s, h) => { let kg = 0, ts = 0; for (const k in s.acc){ kg += s.acc[k].kg; ts += s.acc[k].ts; } const ag = Hf + h - ts / kg; return 100 - 2.5 * Math.max(0, ag - 5) - 4 * Math.max(0, h - 24); };
          R.fresh = [Math.round(fr(L(4), 4)), Math.round(fr(L(30), 30))];
          const g0 = GROUNDS[2].p, N = (H0) => { const s = dry('garn', {mesh:156, n:20}, g0, H0, 20); let kg = 0, ts = 0; for (const k in s.acc){ kg += s.acc[k].kg; ts += s.acc[k].ts; } const ag = H0 + 20 - ts / kg; return 84 - (1 + 0.3 * Math.max(0, seasonal(SST, H0) - 3)) * ag; };
          R.netFresh = {winter:Math.round(N(Hf)), summer:Math.round(N(Hs))};
          const P = h => dry('teine', {pot:'big', n:50}, window.CRABSPOT, Hc, h); R.pots = [20, 48].map(h => Math.round(kgOf(P(h)))); R.dead60 = Math.round(P(60).dead);
          const mean = (mesh) => { let s = 0; for (let i = 0; i < 400; i++) s += sampleSel('torsk', 'garn', mesh, g0, HOUR(2028, 2, 5, 6)); return s / 400; };
          R.mesh = [+mean(156).toFixed(2), +mean(200).toFixed(2)];
          return R; })()""")
        print('soak:', json.dumps(r))
        print(ok(r['line'][2] > 2 * r['line'][0] and r['line'][3] < 0.6 * r['line'][2]), 'line: a day gives more than twice four hours; after two days the amphipods have taken much of it')
        print(ok(r['fresh'][0] >= 85 and r['fresh'][1] < 85), 'line: after 4 hours the fish is alive and top grade, after 30 hours it is not')
        print(ok(r['netFresh']['winter'] > r['netFresh']['summer']), 'nets: the fish keeps better in cold water than in summer')
        print(ok(r['pots'][0] >= 0.45 * r['pots'][1] and r['dead60'] > 0), 'pots: half the catch by 20 hours, and crab dies after two days')
        print(ok(r['mesh'][1] >= 1.3 * r['mesh'][0]), '200 mm nets take bigger cod than 156 mm')

        # 4. hauling: into the deck work, hook flags, wear; crab sorting, fine and roe deduction; crab outside the fresh-fish scheme
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.pgear = newPGear(); S.pgear.kits.n = 4; S.crew = [hand()]; S.me = S.cur;
          S.equip.garnhaler = true; S.equip.linehaler = true; S.equip.teinehaler = true; S.t = Math.round(HOUR(2028, 2, 5, 6) * 60); S.settings.gut = true; S.settings.ice = true; b.ice = 500;
          S.pgear.nets.push({id:'n1', mesh:180, n:10, cond:1}); S.pgear.lines.hyse = {n:2, baited:2};
          const g0 = GROUNDS[2].p; atSea(g0); startSet('garn', {nid:'n1'}, 0); hStep(300); b.status = 'idle'; b.pos = {x:g0.x + 1.5, y:g0.y}; if (isLand(b.pos)) b.pos = {x:g0.x - 1.5, y:g0.y};
          startSet('line', {lk:'hyse', n:2}, 0); hStep(300); b.status = 'idle';
          for (let k = 0; k < 18 * 60; k++) step();
          const sn = S.sets.find(s => s.kind === 'garn'), sl = S.sets.find(s => s.kind === 'line');
          atSea(sn.a); startHaul(sn.id); hStep(900); R.afterNet = {hook:S.hold.filter(x => x.sp !== 'krabbe').every(x => x.hook === false), pend:Math.round(deckPending()), kg:Math.round(holdTotal()), nets:S.pgear.nets.map(l => [l.n, l.cond]), left:S.sets.length};
          S.hold = []; atSea(sl.a); startHaul(sl.id); hStep(900); R.afterLine = {hook:S.hold.every(x => x.hook === true), kg:Math.round(holdTotal()), un:S.pgear.lines.hyse.n - S.pgear.lines.hyse.baited};
          // crab: careful sorting leaves no small or berried crab; quick sorting brings the fine and the deduction
          S.hold = []; S.t = Math.round(HOUR(2028, 8, 10, 6) * 60); S.pgear.pots.big = 60; S.pgear.bait = 60;
          const crabRun = (careful) => { S.settings.crabSort = careful; atSea(window.CRABSPOT); b.heading = Math.PI / 2; startSet('teine', {pot:'big', n:60}, 0); hStep(400); for (let k = 0; k < 30 * 60; k++) step();
            const s = S.sets.find(x => x.kind === 'teine'); atSea(s.a); startHaul(s.id); hStep(900); return S.hold.filter(x => x.sp === 'krabbe').map(x => [x.cls, Math.round(x.kg * 10) / 10, Math.round(x.n)]); };
          R.careful = crabRun(true); R.carefulBad = R.careful.filter(x => x[0] >= 2).length; S.hold = []; S.pgear.bait = 60;
          // quick sorting, and a forced small and berried crab so the landing shows both rules
          R.quick = crabRun(false); addCatch('krabbe', 0.35, 2, false, {}); addCatch('krabbe', 0.8, 3, false, {}); R.crabPend = deckPending(); R.nonCrab = S.hold.filter(x => x.sp !== 'krabbe' && grade(x.fresh) !== 'V').reduce((a, x) => a + x.kg, 0);
          b.status = 'port'; b.port = 'senjahopen'; b.pos = {...portById('senjahopen').p}; const q = quotaState(), ff0 = q.ffTot, m0 = S.msgs.length; sell();
          R.sale = {fine:S.lastSale.crabFine, roe:Math.round(S.lastSale.roeCut), conf:+S.lastSale.confKg.toFixed(2), ffAdd:quotaState().ffTot - ff0, gear:S.lastSale.gear, msgs:S.msgs.slice(m0).map(m => m.from)};
          S.settings.crabSort = true; return R; })()""")
        print('haul:', json.dumps(r, ensure_ascii=False))
        print(ok(r['afterNet']['hook'] and r['afterNet']['kg'] > 50 and r['afterNet']['pend'] > 0 and r['afterNet']['left'] == 1 and r['afterNet']['nets'][0][1] < 1), 'nets come up: net fish is not hook-caught, it goes to the bleeding tub, the nets are aboard again and worn a little')
        print(ok(r['afterLine']['hook'] and r['afterLine']['kg'] > 20 and r['afterLine']['un'] == 2), 'line comes up hook-caught, and the tubs are unbaited')
        print(ok(r['careful'] and r['carefulBad'] == 0), 'careful sorting puts back all small and berried crab')
        print(ok(r['crabPend'] == 0 and r['sale']['fine'] >= 2000 and r['sale']['roe'] > 0 and r['sale']['conf'] > 0 and r['sale']['ffAdd'] <= r['nonCrab'] + 0.01 and 'Fiskeridirektoratet' in r['sale']['msgs'] and 'teine' in r['sale']['gear']), 'crab is kept alive; small crab is confiscated with a fine, berried crab costs 10 %, and crab is outside the fresh-fish scheme')

        # 5. weather, deadlines, wear and mending, baiting
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.msgs = []; S.log = [];
          // a storm: force the loss, then report it
          S.pgear.nets.push({id:'ns', mesh:156, n:10, cond:1}); S.pgear.kits.n = 5; atSea(GROUNDS[0].p); startSet('garn', {nid:'ns'}, 0); hStep(300); b.status = 'idle';
          const s = S.sets[0]; const r0 = Math.random; Math.random = () => 0; gearHour(S.t / 60); Math.random = r0;
          R.lost = !!s.lost; R.lostMsg = S.msgs.some(m => /Kystvakten/.test(m.no)); R.alert = PHONE.alerts().some(a => /tapt/.test(a.no));
          R.rep = reportLost(s.id); R.gone = !S.sets.includes(s); R.kv = S.msgs.some(m => m.from === 'Kystvakten');
          // deadlines: two days' warning and the fourth-day reminder
          S.pgear.nets.push({id:'nt', mesh:156, n:5, cond:1}); startSet('garn', {nid:'nt'}, 0); hStep(300); b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p};
          const t = S.sets[0]; t.tSet -= 97 * 60; for (let h = 0; h < 2; h++){ S.t += 60; gearHour(S.t / 60); }
          R.warn48 = S.log.some(e => /to døgn/.test(e.no)); R.fdir = S.msgs.some(m => m.from === 'Fiskeridirektoratet' && /fjerde dag/.test(m.no));
          // wear: nets worn thin tear on the next haul; mending by the crew and at the net loft
          atSea(t.a); t.cond = 0.1; t.acc = {}; startHaul(t.id); hStep(900); R.tore = S.log.some(e => /i filler/.test(e.no)); R.left = S.pgear.nets.filter(l => l.id === 'nt').reduce((a, l) => a + l.n, 0);
          S.pgear.nets = [{id:'nm', mesh:156, n:10, cond:0.4}, {id:'nl', mesh:156, n:10, cond:0.3}];
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.crew = [hand()]; S.jobs = [];
          R.mend = mendSelf('nm'); R.mendH = S.jobs.length ? S.jobs[0].h : null; for (let i = 0; i < 2000 && S.jobs.length; i++) step(); R.mended = (S.pgear.nets.find(l => l.id === 'nm') || {}).cond;
          R.botHusoy = !!botOrder('nl'); b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; const c0 = S.cash; R.bot = botOrder('nl'); R.botFee = Math.round(c0 - S.cash);
          for (let i = 0; i < 25 * 60; i++) step(); R.botBack = (S.pgear.nets.find(l => l.id === 'nl') || {}).cond;
          // baiting: the shed charges and has it ready later; the crew takes about hooks / 560 an hour each
          S.pgear.lines.hyse = {n:4, baited:0}; S.pgear.bait = 100; b.port = 'husoy'; b.pos = {...portById('husoy').p}; const c1 = S.cash;
          R.egn = egnOrder('hyse', 2); R.egnFee = Math.round(c1 - S.cash); R.egnExpect = 2 * (LINE_KINDS.hyse.egn + LINE_KINDS.hyse.baitKg * GPRICE.bait); R.beforeReady = S.pgear.lines.hyse.baited;
          for (let i = 0; i < 6 * 60; i++) step(); R.afterReady = S.pgear.lines.hyse.baited;
          S.jobs = []; R.self = egnSelf('hyse', 2); R.selfH = S.jobs.length ? S.jobs[0].h : null; R.selfExpect = Math.round(2 * 700 / (560 * handsAboard() * teamEff(crewAboard(), meAboard(), 'line')) * 10) / 10;
          for (let i = 0; i < 600 && S.jobs.length; i++) step(); R.selfDone = S.pgear.lines.hyse.baited;
          return R; })()""")
        print('care:', json.dumps(r, ensure_ascii=False))
        print(ok(r['lost'] and r['lostMsg'] and r['alert'] and r['rep'] and r['gone'] and r['kv']), 'a storm takes the gear: a message and an alert, and reporting it to the Coast Guard clears it')
        print(ok(r['warn48'] and r['fdir']), 'two days in the sea brings a warning, the fourth day the Directorate’s reminder')
        print(ok(r['tore'] and r['left'] < 5), 'nets worn thin go to pieces when hauled')
        print(ok(r['mend'] is None and r['mendH'] and r['mended'] == 0.95 and r['botHusoy'] and r['bot'] is None and r['botFee'] > 0 and r['botBack'] == 0.95), 'mending: the crew in port, or the net loft in Finnsnes for a fee, back a day later')
        print(ok(r['egn'] is None and r['egnFee'] == r['egnExpect'] and r['beforeReady'] == 0 and r['afterReady'] == 2 and r['self'] is None and abs(r['selfH'] - r['selfExpect']) < 0.15 and r['selfDone'] == 4), 'baiting: the shed charges fee and bait and has it ready later; the crew baits at about 560 hooks an hour each')

        # 6. the standing plan: a net station set on day one, hauled and set again after that, and refused with one hand
        r = await pg.evaluate("""(()=>{ const b = S.boat; S.sets = []; S.hold = []; S.cash = 5e6; S.settings.autoW = 16; S.stock = initStock();
          let t0 = null; for (let d = 0; d < 60 && t0 == null; d++){ const H0 = HOUR(2028, 2, 1 + d, 5); let okw = true; for (let k = 0; k <= 60; k++) if (windAt(H0 + k) > 13 || hsOpen(H0 + k) > 2.2) okw = false; if (okw) t0 = H0; }
          S.t = Math.round(t0 * 60) - 30; b.type = 'sjark'; applyVessel(); S.equip.garnhaler = true; b.fuel = BOAT.fuelCap; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.status = 'port'; b.gop = null;
          S.crew = [hand(), hand()]; S.me = 'nobody'; S.pgear = newPGear(); S.pgear.nets.push({id:'np', mesh:180, n:30, cond:1}); S.pgear.kits.n = 2;
          const HP = portById('husoy'), W = q => ({x:q.x, y:q.y, port:null, fish:0}), rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0].slice(1).map(q => ({x:q[0], y:q[1]}));
          const wps = exitWps(HP, rt[0]).map(W).concat(rt.map((q, i) => ({x:q.x, y:q.y, port:null, fish:0, act:i === rt.length - 1 ? {op:'cycle', kind:'garn', spec:{nid:'np'}} : undefined})));
          rt.slice(0, -1).reverse().forEach(q => wps.push(W(q))); entryWps(HP, rt[0]).forEach(q => wps.push(W(q))); wps.push({x:HP.p.x, y:HP.p.y, port:'husoy', fish:0});
          S.ops = {on:true, dep:5, days:[1, 1, 1, 1, 1, 1, 1], maxWind:16, skipper:S.crew[0].id, last:-1, wps, speed:9, home:'husoy', end:'husoy', hours:8};
          const s0 = S.sales.length, days = []; for (let d = 0; d < 3; d++){ for (let i = 0; i < 1440; i++) step(); days.push(S.sets.filter(s => !s.lost).map(s => Math.round((S.t - s.tSet) / 60))); }
          const R = {days, sales:S.sales.slice(s0).map(x => x.kg)};
          S.crew = [S.crew[0]]; S.ops.last = -1; const m0 = S.msgs.length; for (let i = 0; i < 1440; i++) step(); R.oneHand = S.msgs.slice(m0).some(m => /to om bord/.test(m.no));
          S.ops = null; S.me = S.cur; return R; })()""")
        print('plan:', json.dumps(r))
        print(ok(len(r['sales']) >= 2 and all(k > 100 for k in r['sales']) and all(len(d) == 1 and d[0] <= 30 for d in r['days'])), 'standing plan: the net station is hauled and set again every day, and the catch is landed')
        print(ok(r['oneHand']), 'with one hand the skipper will not run a plan with nets')

        # 7. save and reload, and an old save with two vessels gets a gear locker on both
        r = await pg.evaluate("""(()=>{ const b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.gop = null; S.sets = []; S.pgear = newPGear(); S.pgear.kits.n = 1; S.pgear.nets.push({id:'nz', mesh:200, n:5, cond:0.8});
          S.sets.push({id:'sz', vid:S.cur, kind:'teine', pot:'big', n:10, a:{x:30, y:60}, b:{x:30.2, y:60}, tSet:S.t, acc:{}, dead:0, lost:null, rep:false, warn:0, heavy:false, depth:20});
          const v2 = newVesselObj('snekke', 'husoy'); storeVessel(curVessel()); delete v2.pgear; save(); return {n:S.fleet.length}; })()""")
        await pg.reload(); await pg.wait_for_timeout(1800); await pg.evaluate(SEED); await pg.evaluate(PREP)
        r = await pg.evaluate("""(()=>({sets:S.sets.map(s => s.id), nets:S.pgear.nets.map(l => [l.id, l.n, l.cond]), v2:!!vget(S.fleet[1], 'pgear') && Array.isArray(vget(S.fleet[1], 'pgear').nets)}))()""")
        print('reload:', json.dumps(r))
        print(ok(r['sets'] == ['sz'] and r['nets'] == [['nz', 5, 0.8]] and r['v2']), 'gear in the sea and aboard survives a reload; an old save gets a gear locker on every vessel')

        # 8. the chart shows two buoys a set; 3D draws buoys and the work without page errors
        r = await pg.evaluate("""(()=>{ S.fleet = [S.fleet[0]]; bindVessel(S.fleet[0]); G3.show(false); view.cx = 30; view.cy = 60; view.z = 6; applyView(); renderDyn(); return {buoys:document.querySelectorAll('#gDyn .buoy').length}; })()""")
        b3 = await pg.evaluate("""(()=>{ const b = S.boat; b.type = 'sjark'; applyVessel(); S.crew = [hand()]; S.equip.teinehaler = true; S.pgear.pots.big = 10; S.pgear.bait = 10; S.pgear.kits.n = 2;
          atSea(window.CRABSPOT || GROUNDS[3].p); b.heading = Math.PI / 2; const why = startSet('teine', {pot:'big', n:10}, 0); G3.show(true); return {why}; })()""")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path='gear3d.png')
        print('chart/3d:', json.dumps(r), json.dumps(b3))
        print(ok(r['buoys'] == 2 and b3['why'] is None), 'the chart draws two buoys for the set, and setting pots runs in 3D')

        # 9. calibration (start values): kg per unit and the jig day for comparison
        r = await pg.evaluate("""(()=>{ S.stock = initStock(); const R = {}, Hf = HOUR(2028, 1, 10, 6), Hm = HOUR(2028, 2, 5, 6), Hc = HOUR(2028, 8, 10, 6);
          let best = null, bd = 0; for (const g of GROUNDS) for (let k = 0; k < 60; k++){ const a = k * 2.4, r0 = g.r * (k % 6) / 5, q = {x:g.p.x + Math.cos(a) * r0, y:g.p.y + Math.sin(a) * r0}; if (isLand(q)) continue; const d = density('hyse', q, Hf); if (d > bd){ bd = d; best = q; } }
          const L = dry('line', {lk:'hyse', hooks:2800, n:4}, best, Hf, 12); R.linePerTub = Math.round(kgOf(L) / 4); R.lineHyse = Math.round(L.acc.hyse.kg / kgOf(L) * 100);
          const N = dry('garn', {mesh:180, n:30}, GROUNDS[2].p, Hm, 20); R.netPerNet = Math.round(kgOf(N) / 30);
          const P = dry('teine', {pot:'big', n:100}, window.CRABSPOT, Hc, 24); R.potPerPot = +(kgOf(P) / 100).toFixed(2);
          let jig = 0; for (let h = 0; h < 8; h++) for (const sp of SP) jig += 30 * density(sp, GROUNDS[2].p, Hm + h); R.jigOneHand8h = Math.round(jig);
          return R; })()""")
        print('calibration:', json.dumps(r))
        print(ok(70 <= r['linePerTub'] <= 115 and r['lineHyse'] >= 55), 'haddock line, 12 hours in February on a good haddock spot: 70–115 kg a tub, mostly haddock')
        print(ok(20 <= r['netPerNet'] <= 45), 'cod nets of 180 mm, 20 hours in March west of Gryllefjord: 20–45 kg a net')
        print(ok(1.0 <= r['potPerPot'] <= 2.5), 'big pots, 24 hours in September south on Senja: 1–2.5 kg a pot')
        print('errors:', errs[:5]); await br.close()
asyncio.run(main())
