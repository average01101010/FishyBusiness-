from _env import GAME, boot
# Passive gear (R1–R7): nets, line and pots that stand in the sea. Buying and room aboard, rules at setting (two aboard for nets, the fjord
# line's 80 nets and 5,000 hooks), where the string goes, soak curves (line: more over a day, amphipods after; pots: 20 hours, dying after
# 48; nets: fish spoils faster in summer), mesh size, hauling into the deck-work pipeline, king crab kept and sorted by class, dead crab worth nothing, storm loss
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
})()"""
# a king crab spot in West Finnmark (free fishing west of 26° E), 40-150 m deep near 71°03' N 24°54' E; its tiles are loaded before each use
CRABP = """async () => { const c = P(71.05, 24.9); await mapNeed(c, MAPD.simR); let spot = null;
  for (let r = 0; r <= 40 && !spot; r++) for (let k = 0; k < Math.max(1, r * 6); k++){ const t = k / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1}; if (!isLand(q) && depthF(q) > 40 && depthF(q) < 150){ spot = q; break; } }
  window.CRABSPOT = spot; window.crabReady = () => mapNeed(window.CRABSPOT, MAPD.simR); }"""

async def fresh(br):
    pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.evaluate(SEED); await pg.evaluate(PREP); await pg.evaluate(CRABP)
    return pg, errs

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg, errs = await fresh(br)

        # 1. crab is not a fish: the jig never takes it; buying in the phone app, sized to the room aboard
        await pg.evaluate("crabReady()")
        r = await pg.evaluate("""(()=>{ const R = {};
          R.spNoCrab = !SP.includes('krabbe') && ALLSP.includes('krabbe') && SPECIES.krabbe.shell;
          S.t = Math.round(HOUR(2028, 7, 10, 6) * 60); const b = S.boat; b.gear = true;
          const spot = window.CRABSPOT; atSea(spot); b.status = 'fishing'; b.fishUntil = S.t + 480; for (let i = 0; i < 480; i++) step();
          R.jigCrab = S.hold.filter(x => x.sp === 'krabbe').length; R.jigKg = Math.round(holdTotal()); S.hold = [];
          b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; S.pgear = newPGear(); const c0 = S.cash;
          PHONE.open('redskap'); document.querySelector('[data-pa=sub][data-s=kjop]').click();
          const click = sel => { const e = document.querySelector(sel); if (e && !e.disabled) e.click(); return !!(e && !e.disabled); };
          R.clicked = [click('[data-pa=grbuy][data-w=net][data-s="156"]'), click('[data-pa=grbuy][data-w=stamp][data-s=hyse]'), click('[data-pa=grbuy][data-w=pot][data-s=small]'), click('[data-pa=grbuy][data-w=kit]'), click('[data-pa=grbuy][data-w=bait][data-n="20"]')];
          R.pg = {nets:S.pgear.nets.map(l => l.n), hyse:S.pgear.lines.hyse.n, pots:S.pgear.pots.small, kits:S.pgear.kits.n, bait:baitKg(S.pgear)};
          R.spent = Math.round(c0 - S.cash); R.potRoom = VESSELS.skiff.gearMax.teine; R.expect = 6 * GPRICE.net + 4 * LINE_KINDS.hyse.price + R.potRoom * POTS.small.price + GPRICE.kit + 20 * GPRICE.bait;
          R.fullNets = document.querySelector('[data-pa=grbuy][data-w=net]').disabled;
          // haulers: the small electric one is not for a sjark
          PHONE.open('utstyr'); R.elSkiff = !!document.querySelector('[data-pa=equip][data-k=elhaler]') || document.body.innerHTML.includes('Elektrisk haler');
          b.type = 'sjark'; applyVessel(); PHONE.open('utstyr'); R.elSjark = document.getElementById('drawerBody').innerHTML.includes('Elektrisk haler'); R.garnhalerSjark = document.getElementById('drawerBody').innerHTML.includes('Hydraulisk garnhaler');
          PHONE.show(false); b.type = 'skiff'; applyVessel(); return R; })()""")
        print('buy:', json.dumps(r, ensure_ascii=False))
        print(ok(r['spNoCrab'] and r['jigCrab'] == 0 and r['jigKg'] > 0), 'king crab is outside the fish list, and a day of jigging on a crab spot takes no crab')
        print(ok(all(r['clicked']) and r['pg'] == {'nets':[6], 'hyse':4, 'pots':r['potRoom'], 'kits':1, 'bait':20} and r['spent'] == r['expect'] and r['fullNets']), 'buying in the Gear app: nets, tubs, pots, a buoy set and bait, sized to the skiff’s room, paid exactly')
        print(ok(r['elSkiff'] and not r['elSjark'] and r['garnhalerSjark']), 'the electric hauler is for small boats, the hydraulic net hauler for the sjark')

        # 2. rules at setting: two aboard for nets, the fjord line's limits, both ends at sea
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; b.type = 'sjark'; applyVessel(); S.pgear = newPGear(); S.sets = [];
          S.pgear.nets.push({id:'na', mesh:156, n:40, cond:1}, {id:'nb', mesh:156, n:40, cond:1}, {id:'nc', mesh:156, n:1, cond:1}); S.pgear.kits.n = 9; S.pgear.lines.hyse = {n:8, baited:8};
          const inside = GROUNDS.find(g => insideFjord(g.p) && depthF(g.p) > 20).p; window.INSIDE = inside;
          S.crew = []; S.me = S.cur; atSea(inside); b.rig = 'garn'; R.alone = !!gearRules('garn', {nid:'na'}, b.pos);
          S.crew = [hand()]; R.withOne = gearRules('garn', {nid:'na'}, b.pos); S.me = 'nobody'; S.crew = [hand(), hand()]; R.twoCrew = gearRules('garn', {nid:'na'}, b.pos); S.me = S.cur; S.crew = [hand()];
          R.set1 = startSet('garn', {nid:'na'}, 0); hStep(400); b.pos = {x:inside.x + 1.2, y:inside.y + 0.6}; if (isLand(b.pos) || !insideFjord(b.pos)) b.pos = {x:inside.x - 1.2, y:inside.y - 0.6};
          R.set2 = startSet('garn', {nid:'nb'}, 0); hStep(400); b.status = 'idle';
          R.set81 = gearRules('garn', {nid:'nc'}, b.pos); R.nets = mySets().filter(s => insideFjord(setMid(s))).reduce((a, s) => a + s.n, 0);
          b.rig = 'line'; R.hooks8 = gearRules('line', {lk:'hyse', n:8}, b.pos); R.hooks7 = gearRules('line', {lk:'hyse', n:7}, b.pos);
          R.geo = mySets().map(s => [!isLand(s.a), !isLand(s.b), legClear(s.a, s.b), depthF(s.a) >= 5 && depthF(s.b) >= 5, Math.round(dist(s.a, s.b) * 1000)]);
          return R; })()""")
        print('rules:', json.dumps(r, ensure_ascii=False))
        print(ok(r['alone'] and r['withOne'] is None and r['twoCrew'] is None), 'nets need two aboard: not alone; you and one crew, or two crew without you')
        print(ok(r['set1'] is None and r['set2'] is None and r['nets'] == 80 and r['set81'] and r['hooks8'] and r['hooks7'] is None), 'inside the fjord line: 80 nets and no more, 5,000 hooks (7 tubs of haddock line, not 8)')
        print(ok(all(all(g[:4]) for g in r['geo']) and all(1150 <= g[4] <= 1250 for g in r['geo'])), 'each string lies at sea between its buoys, clear of land, on at least 5 m, 30 m a net')

        # 3. soak curves and mesh size (dry sets, no stock taken)
        await pg.evaluate("crabReady()")
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

        # 4. hauling: into the deck work, hook flags, wear; king crab kept and sorted, paid by class while alive; crab outside the fresh-fish scheme
        await pg.evaluate("crabReady()")
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.pgear = newPGear(); S.pgear.kits.n = 4; S.crew = [hand()]; S.me = S.cur;
          S.equip.garnhaler = true; S.equip.linehaler = true; S.equip.teinehaler = true; S.t = Math.round(HOUR(2028, 2, 5, 6) * 60); S.settings.gut = true; S.settings.ice = true; b.ice = 500;
          S.pgear.nets.push({id:'n1', mesh:180, n:10, cond:1}); S.pgear.lines.hyse = {n:2, baited:2};
          const g0 = GROUNDS[2].p; atSea(g0); b.rig = 'garn'; startSet('garn', {nid:'n1'}, 0); hStep(300); b.status = 'idle'; b.pos = {x:g0.x + 1.5, y:g0.y}; if (isLand(b.pos)) b.pos = {x:g0.x - 1.5, y:g0.y};
          b.rig = 'line'; startSet('line', {lk:'hyse', n:2}, 0); hStep(300); b.status = 'idle';
          for (let k = 0; k < 18 * 60; k++) step();
          const sn = S.sets.find(s => s.kind === 'garn'), sl = S.sets.find(s => s.kind === 'line');
          atSea(sn.a); startHaul(sn.id); hStep(900); R.afterNet = {hook:S.hold.filter(x => x.sp !== 'krabbe').every(x => x.hook === false), pend:Math.round(deckPending()), kg:Math.round(holdTotal()), nets:S.pgear.nets.map(l => [l.n, l.cond]), left:S.sets.length};
          S.hold = []; atSea(sl.a); startHaul(sl.id); hStep(900); R.afterLine = {hook:S.hold.every(x => x.hook === true), kg:Math.round(holdTotal()), un:S.pgear.lines.hyse.n - S.pgear.lines.hyse.baited};
          // king crab: all that comes up is kept (J-138-2026 § 5), in Råfisklaget's classes by sex, weight and damage
          S.hold = []; S.t = Math.round(HOUR(2028, 8, 10, 6) * 60); S.pgear.pots.big = 40; S.pgear.bait = 60;
          atSea(window.CRABSPOT); b.heading = Math.PI / 2; b.rig = 'teiner'; R.potSet = startSet('teine', {pot:'big', n:40}, 0); hStep(400); for (let k = 0; k < 30 * 60; k++) step();
          { const s = S.sets.find(x => x.kind === 'teine'); atSea(s.a); startHaul(s.id); hStep(900); }
          const cr = S.hold.filter(x => x.sp === 'krabbe');
          R.crab = {n:cr.reduce((a, x) => a + x.n, 0), kg:+cr.reduce((a, x) => a + x.kg, 0).toFixed(1), cls:[...new Set(cr.map(x => x.cls))].sort(),
            clsOk:cr.every(x => { const w = x.kg / x.n; return [w >= 3.2, w >= 2.2 && w < 3.2, w >= 1.6 && w < 2.2, w >= 0.8 && w < 1.6, true, true, w < 0.8][x.cls]; })};
          R.marks = S.marks.filter(m => m.g).slice(-2).map(m => ({g:m.g, kgu:m.kgu, q:m.q}));   // kilos per line and per pot on the chart (tilbakemelding #33)
          // and a lot of crab that died in the hold (a lot of its own: lots caught in the same hour share their freshness)
          S.hold.push({sp:'krabbe', cls:1, kg:1.2, n:1, bled:true, iced:false, hr:-1, fresh:20, gut:false, hook:false}); { const h0 = S.hold; S.hold = h0.filter(x => x.sp === 'krabbe'); R.crabPend = deckPending(); S.hold = h0; } R.nonCrab = S.hold.filter(x => x.sp !== 'krabbe' && grade(x.fresh) !== 'V').reduce((a, x) => a + x.kg, 0);
          b.status = 'port'; b.port = 'senjahopen'; b.pos = {...portById('senjahopen').p}; const q = quotaState(), ff0 = q.ffTot, m0 = S.msgs.length; sell();
          const ls = S.lastSale, live = ls.lines.filter(r => r.sp === 'krabbe' && r.g !== 'X' && r.g !== 'V');
          R.sale = {fine:ls.crabFine, dead:+(ls.crabDead || 0).toFixed(2), minOk:live.length > 0 && live.every(r => r.sum >= r.kg * SPECIES.krabbe.cls[r.c][1] - 1), krPerKg:Math.round(live.reduce((a, r) => a + r.sum, 0) / Math.max(0.1, live.reduce((a, r) => a + r.kg, 0))),
            ffAdd:quotaState().ffTot - ff0, gear:ls.gear, msgs:S.msgs.slice(m0).map(m => m.from)};
          return R; })()""")
        print('haul:', json.dumps(r, ensure_ascii=False))
        print(ok(r['afterNet']['hook'] and r['afterNet']['kg'] > 50 and r['afterNet']['pend'] > 0 and r['afterNet']['left'] == 1 and r['afterNet']['nets'][0][1] < 1), 'nets come up: net fish is not hook-caught, it goes to the bleeding tub, the nets are aboard again and worn a little')
        print(ok(r['afterLine']['hook'] and r['afterLine']['kg'] > 20 and r['afterLine']['un'] == 2), 'line comes up hook-caught, and the tubs are unbaited')
        print(ok(r['potSet'] is None and r['crab']['n'] >= 20 and r['crab']['clsOk'] and len(r['crab']['cls']) >= 4), 'king crab: all of it is kept (J-138-2026 § 5) and sorted by sex, weight and damage into Råfisklaget’s classes')
        mk = r.get('marks') or []
        print(ok(len(mk) == 2 and mk[0]['g'] == 'line' and mk[1]['g'] == 'teine' and -0.05 < mk[1]['kgu'] - r['crab']['kg'] / 40 < 0.6 and mk[0]['kgu'] >= mk[1]['kgu'] and all(m['q'] is not None for m in mk)),
              'the catch mark gives kilos per line (the whole line) and per pot', mk, r['crab']['kg'])
        print(ok(r['crabPend'] == 0 and not r['sale']['fine'] and abs(r['sale']['dead'] - 1.2) < 0.02 and r['sale']['minOk'] and r['sale']['ffAdd'] <= r['nonCrab'] + 0.01 and 'Fiskeridirektoratet' not in r['sale']['msgs'] and 'teine' in r['sale']['gear']), 'live king crab is paid at least the minimum price of its class and dead crab nothing; no fine, and crab is outside the fresh-fish scheme')

        # 5. weather, deadlines, wear and mending, baiting
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.msgs = []; S.log = [];
          // a storm: force the loss, then report it
          S.pgear.nets.push({id:'ns', mesh:156, n:10, cond:1}); S.pgear.kits.n = 5; atSea(GROUNDS[0].p); b.rig = 'garn'; startSet('garn', {nid:'ns'}, 0); hStep(300); b.status = 'idle';
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
        await pg.evaluate(SEED)   # a fresh seed: the plan's three days must not hang on how many random numbers the sections before used (gear is lost at random)
        r = await pg.evaluate("""(()=>{ const b = S.boat; S.sets = []; S.hold = []; S.cash = 5e6; S.settings.autoW = 16; S.stock = initStock();
          let t0 = null; for (let d = 0; d < 60 && t0 == null; d++){ const H0 = HOUR(2028, 2, 1 + d, 5); let okw = true; for (let k = 0; k <= 60; k++) if (windAt(H0 + k) > 13 || hsOpen(H0 + k) > 2.2) okw = false; if (okw) t0 = H0; }
          S.t = Math.round(t0 * 60) - 30; b.type = 'sjark'; applyVessel(); S.equip.garnhaler = true; b.rig = 'garn'; b.fuel = BOAT.fuelCap; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.status = 'port'; b.gop = null;
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

        # 6b. the rig: one kind of fishing at a time, changed at the yard in port, free once the hauler is aboard, with the gear out of the sea
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.ops = null; S.me = S.cur; S.crew = [hand()]; b.type = 'skiff'; applyVessel(); b.gop = null;
          for (const k of ['elhaler', 'linehaler', 'garnhaler', 'teinehaler']) S.equip[k] = false;
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; delete b.rig; R.def = rigOf();
          R.noHauler = (rigBlock('line') || [''])[0]; R.garnSkiff = (rigBlock('garn') || [''])[0]; R.juksa = rigBlock('juksa');
          S.equip.elhaler = true; R.toLine = rigSet('line'); R.line = rigOf();
          S.pgear = newPGear(); S.pgear.kits.n = 2; S.pgear.lines.hyse = {n:2, baited:2}; S.pgear.nets.push({id:'nr', mesh:156, n:5, cond:1}); S.pgear.pots.small = 5; S.pgear.bait = 5;
          R.choices = [...new Set(setChoices().map(c => c.kind))];
          atSea(GROUNDS[2].p); R.atSea = rigBlock('teiner'); R.netRule = (gearRules('garn', {nid:'nr'}, b.pos) || [''])[0];
          R.setLine = startSet('line', {lk:'hyse', n:1}, 0); hStep(300); b.status = 'idle';
          // fishing hours with a line rig: the boat waits, no jig catch
          S.hold = []; b.status = 'fishing'; b.fishUntil = S.t + 60; for (let i = 0; i < 50; i++) step(); R.jigKg = Math.round(holdTotal() * 10) / 10; endFishing('done');
          DOCK.render(); R.dockJig = DOCK.items().some(x => x.id === 'jukse') ? 0 : 1;
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; R.inSea = (rigBlock('teiner') || [''])[0];
          // an old save with pots in the sea and no rig: rigged for pots
          S.sets[0].kind = 'teine'; delete b.rig; R.guess = rigOf(); S.sets = [];
          DOCK.open('rigg'); const dr = document.getElementById('drawerBody'); R.page = dr.querySelectorAll('[data-pa=rig]').length; R.pageOn = (dr.querySelector('.rig.on h4') || {}).textContent || '';
          dr.querySelector('[data-pa=rig][data-r=juksa]').click(); R.byTap = rigOf(); DOCK.close();
          b.type = 'sjark'; applyVessel(); S.equip.elhaler = false; R.sjarkLine = (rigBlock('line') || [''])[0]; b.type = 'skiff'; applyVessel(); return R; })()""")
        print('rig:', json.dumps(r, ensure_ascii=False))
        print(ok(r['def'] == 'juksa' and r['juksa'] and 'haler' in r['noHauler'] and 'passer ikke' in r['garnSkiff']), 'a new boat is rigged for jigging; line needs a hauler, and nets do not fit a skiff')
        print(ok(r['toLine'] is None and r['line'] == 'line' and r['choices'] == ['line'] and 'rigget for line' in r['netRule']), 'with the electric hauler the skiff rigs for line, and only line can be set')
        print(ok(r['atSea'] is None and r['setLine'] is None and r['jigKg'] == 0 and r['dockJig'] == 1), 'at sea the rig can be changed aboard when nothing is in the sea; fishing hours with a line rig catch nothing on the jig, and the Jig button is gone')
        print(ok('Trekk alt' in r['inSea'] and r['guess'] == 'teiner'), 'gear in the sea blocks re-rigging; an old save takes the rig from the gear in the sea')
        print(ok(r['page'] == 2 and 'Teiner' in r['pageOn'] and r['byTap'] == 'juksa' and 'linehaler' in r['sjarkLine']), 'the Rig page in the drawer offers what the skiff can rig (not nets) and re-rigs on a tap; a sjark needs the hydraulic line hauler')

        # 7. save and reload, and an old save with two vessels gets a gear locker on both
        r = await pg.evaluate("""(()=>{ const b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.gop = null; S.sets = []; S.pgear = newPGear(); S.pgear.kits.n = 1; S.pgear.nets.push({id:'nz', mesh:200, n:5, cond:0.8});
          S.sets.push({id:'sz', vid:S.cur, kind:'teine', pot:'big', n:10, a:LG(30, 60), b:LG(30.2, 60), tSet:S.t, acc:{}, dead:0, lost:null, rep:false, warn:0, heavy:false, depth:20});
          const v2 = newVesselObj('snekke', 'husoy'); storeVessel(curVessel()); delete v2.pgear; save(); return {n:S.fleet.length}; })()""")
        await pg.reload(); await pg.wait_for_timeout(1800); await pg.evaluate(SEED); await pg.evaluate(PREP); await pg.evaluate(CRABP)
        r = await pg.evaluate("""(()=>({sets:S.sets.map(s => s.id), nets:S.pgear.nets.map(l => [l.id, l.n, l.cond]), v2:!!vget(S.fleet[1], 'pgear') && Array.isArray(vget(S.fleet[1], 'pgear').nets)}))()""")
        print('reload:', json.dumps(r))
        print(ok(r['sets'] == ['sz'] and r['nets'] == [['nz', 5, 0.8]] and r['v2']), 'gear in the sea and aboard survives a reload; an old save gets a gear locker on every vessel')

        # 8. the chart shows two buoys a set; 3D draws buoys and the work without page errors
        r = await pg.evaluate("""(()=>{ S.fleet = [S.fleet[0]]; bindVessel(S.fleet[0]); G3.show(false); view.cx = 30; view.cy = 60; view.z = 6; applyView(); renderDyn(); return {buoys:document.querySelectorAll('#gDyn .buoy').length}; })()""")
        await pg.evaluate("crabReady()")
        b3 = await pg.evaluate("""(()=>{ const b = S.boat; b.type = 'sjark'; applyVessel(); S.crew = [hand()]; S.equip.teinehaler = true; S.pgear.pots.big = 10; S.pgear.bait = 10; S.pgear.kits.n = 2;
          atSea(window.CRABSPOT || GROUNDS[3].p); b.heading = Math.PI / 2; b.rig = 'teiner'; const why = startSet('teine', {pot:'big', n:10}, 0); G3.show(true); return {why}; })()""")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path='gear3d.png')
        print('chart/3d:', json.dumps(r), json.dumps(b3))
        print(ok(r['buoys'] == 2 and b3['why'] is None), 'the chart draws two buoys for the set, and setting pots runs in 3D')

        # 9. calibration (start values): kg per unit and the jig day for comparison
        await pg.evaluate("crabReady()")
        r = await pg.evaluate("""(()=>{ S.stock = initStock(); const R = {}, Hf = HOUR(2028, 1, 10, 6), Hm = HOUR(2028, 2, 5, 6), Hc = HOUR(2028, 8, 10, 6);
          // the eight best haddock spots on the grounds: one spot alone swings from 50 to 110 kg a tub with where the fish's patches lie
          const C = []; for (const g of GROUNDS) for (let k = 0; k < 60; k++){ const a = k * 2.4, r0 = g.r * (k % 6) / 5, q = {x:g.p.x + Math.cos(a) * r0, y:g.p.y + Math.sin(a) * r0}; if (isLand(q)) continue; C.push([density('hyse', q, Hf), q]); }
          C.sort((a, b) => b[0] - a[0]); let kg = 0, hy = 0;
          for (const [, q] of C.slice(0, 8)){ S.stock = initStock(); const L = dry('line', {lk:'hyse', hooks:2800, n:4}, q, Hf, 12); kg += kgOf(L); hy += L.acc.hyse.kg; }
          R.linePerTub = Math.round(kg / 32); R.lineHyse = Math.round(hy / kg * 100); S.stock = initStock();
          const N = dry('garn', {mesh:180, n:30}, GROUNDS[2].p, Hm, 20); R.netPerNet = Math.round(kgOf(N) / 30);
          const P = dry('teine', {pot:'big', n:100}, window.CRABSPOT, Hc, 24); R.potPerPot = +(kgOf(P) / 100).toFixed(2);
          let jig = 0; for (let h = 0; h < 8; h++) for (const sp of SP) jig += 30 * density(sp, GROUNDS[2].p, Hm + h); R.jigOneHand8h = Math.round(jig);
          return R; })()""")
        print('calibration:', json.dumps(r))
        print(ok(70 <= r['linePerTub'] <= 115 and r['lineHyse'] >= 50), 'haddock line, 12 hours in February on the eight best haddock spots: 70–115 kg a tub, mostly haddock')
        print(ok(20 <= r['netPerNet'] <= 45), 'cod nets of 180 mm, 20 hours in March west of Gryllefjord: 20–45 kg a net')
        print(ok(2.0 <= r['potPerPot'] <= 12), 'big king crab pots, 24 hours in September in West Finnmark: 2–12 kg a pot (an estimate)')
        # bait (04.10.2026): five kinds with their own species, a set line keeps the tubs' bait, and own saithe as bait counts on the quota
        bt = await pg.evaluate("""(()=>{ const R = {f:[baitF('reke', 'torsk'), baitF('krill', 'uer'), baitF('krill', 'torsk'), baitF('krabbe', 'lange'), baitF('sei', 'kveite'), baitF('makrell', 'sei')]};
          const pg = S.pgear; pg.lines.hyse = {n:3, baited:3, bt:{reke:2, krill:1}}; pg.baitPref = 'reke';
          const L = dry('line', {lk:'hyse', hooks:2100, n:3, baitW:{reke:3}}, GROUNDS[2].p, HOUR(2028, 1, 10, 6), 12), K = dry('line', {lk:'hyse', hooks:2100, n:3, baitW:{krill:3}}, GROUNDS[2].p, HOUR(2028, 1, 10, 6), 12);
          R.cod = [Math.round((L.acc.torsk || {kg:0}).kg), Math.round((K.acc.torsk || {kg:0}).kg)];
          const b = S.boat; b.status = 'port'; b.port = 'husoy'; b.land = null; S.hold = [{sp:'sei', cls:1, kg:60, n:20, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}]; const q0 = quotaState().sei;
          R.own = baitFromHold('sei', 50); R.ownBait = baitOf(pg).sei; R.quota = Math.round(quotaState().sei - q0); R.left = Math.round(holdTotal()); S.hold = []; return R; })()""")
        print('bait:', json.dumps(bt))
        print(ok(bt['f'] == [1.4, 1.8, 0.6, 1, 1.6, 1.4] and bt['cod'][0] > bt['cod'][1] * 1.8 and bt['own'] == 50 and bt['ownBait'] >= 50 and bt['quota'] == 50 and bt['left'] == 10), 'bait: shrimp takes more cod than krill, and own saithe as bait leaves the hold and counts on the quota')
        # 7. the catch comes aboard in slices as the string comes over the rail (tilbakemelding #30), not all at the end of a unit, and the
        #     haul slows as the bleeding tub fills
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.sets = []; S.hold = []; S.pgear = newPGear(); S.pgear.kits.n = 4; S.crew = [hand()]; S.me = S.cur;
          S.equip.garnhaler = true; S.equip.linehaler = true; S.t = Math.round(HOUR(2028, 2, 5, 6) * 60); S.settings.gut = true; S.settings.ice = true; b.ice = 500;
          S.pgear.nets.push({id:'n1', mesh:180, n:6, cond:1}); S.pgear.lines.hyse = {n:2, baited:2};
          const g0 = GROUNDS[2].p; atSea(g0); b.rig = 'garn'; startSet('garn', {nid:'n1'}, 0); hStep(300); b.status = 'idle'; b.pos = {x:g0.x + 1.5, y:g0.y}; if (isLand(b.pos)) b.pos = {x:g0.x - 1.5, y:g0.y};
          b.rig = 'line'; startSet('line', {lk:'hyse', n:2}, 0); hStep(300); b.status = 'idle';
          for (let k = 0; k < 18 * 60; k++) step();
          const walk = id => { const s = S.sets.find(x => x.id === id), A = {n:0}; for (const sp in s.acc) A.n += s.acc[sp].kg; atSea(s.a); S.hold = []; startHaul(id); const g = b.gop, ups = []; let last = 0, k = 0;
            while (b.gop && k++ < 900){ step(); const t = holdTotal(); if (t > last + 0.01){ ups.push({done:g.done, sub:g.sub, d:+(t - last).toFixed(1)}); last = t; } }
            return {sl:g.sl, n:g.n, ups:ups.length, firstUnit:ups.filter(u => u.done === 0).length, big:Math.max(0, ...ups.map(u => u.d)), kg:Math.round(holdTotal()), had:Math.round(A.n), left:Math.round(Object.values(s.acc).reduce((a, x) => a + Math.max(0, x.kg), 0))}; };
          R.net = walk(S.sets.find(s => s.kind === 'garn').id); R.line = walk(S.sets.find(s => s.kind === 'line').id);
          // the tub: 400 kg round (past the tub) with two aboard stops the fishing, unless it is switched on to gut on the way in
          const round = () => { S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:400, n:100, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}]; b.status = 'fishing'; b.gop = null; b.deckStop = false; b.fishUntil = S.t + 300; b.deckEnd = null; };
          // the bleeding tub: up to half full the haul goes at full pace, then slower, to a fifth of it at a full tub (tilbakemelding #30)
          const fillTo = kg => { S.hold = kg ? [{sp:'torsk', cls:SPECIES.torsk.ref, kg, n:Math.round(kg / 3), bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}] : []; return haulSlow({op:'haul'}); };
          // who stands at the hauler: two on a net (one pulls, one bleeds), one on a line, and a third hand guts meanwhile
          const who = (kind, crew) => { S.crew = []; for (let i = 0; i < crew; i++) S.crew.push(hand()); S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:100, n:30, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}]; b.status = 'fishing'; b.deckStop = false;
            b.gop = {op:'haul', kind, n:2, done:0, prog:0, sub:0, sl:1}; const A = workAssign(), st = A.map(p => p.st).sort().join(), bl = A.filter(p => p.bl).length, ms = gopUnitMin(b.gop, S.t / 60, 0); b.gop = null; return {st, bl, ms}; };
          R.who = {net2:who('garn', 1), net3:who('garn', 2), line2:who('line', 1), line3:who('line', 2)}; S.crew = [hand()];
          R.cap = tubCap(); R.slow = [0, 0.25, 0.5, 0.75, 1].map(f => +fillTo(R.cap * f).toFixed(2)); R.slowSet = haulSlow({op:'set'}); S.hold = [];
          return R; })()""")
        print('slices:', json.dumps(r, ensure_ascii=False))
        print(ok(r['line']['sl'] == 7 and r['line']['firstUnit'] >= 4 and r['line']['ups'] > r['line']['n'] * 2), 'a haddock-line tub of 700 hooks comes aboard in seven slices, several of them in the first tub')
        print(ok(r['net']['sl'] == 3 and r['net']['ups'] > r['net']['n'] and r['net']['kg'] > 30), 'a net comes aboard in thirds')
        print(ok(r['line']['left'] <= 1 and r['net']['left'] <= 1), 'everything the strings held has been landed or released when they are up')
        print(ok(r['who']['net2']['st'] == 'haling,haling' and r['who']['net2']['bl'] == 1 and r['who']['net3']['st'] == 'haling,haling,sloy' and r['who']['net3']['bl'] == 1 and r['who']['line2']['st'] == 'haling,sloy' and r['who']['line2']['bl'] == 0 and r['who']['line3']['bl'] == 0 and 'sloy' in r['who']['line3']['st']), 'a net takes two at the hauler, one pulling and one bleeding, with a third hand gutting; a line takes one (and nobody bleeds apart)', r['who'])
        print(ok(r['slow'][0] == 1 and r['slow'][1] == 1 and r['slow'][2] == 1 and 0.55 < r['slow'][3] < 0.65 and r['slow'][4] == 0.2 and r['slowSet'] == 1), 'the haul goes at full pace up to half a tub, then slower, to a fifth at a full tub; setting is not slowed', r['slow'])

        print('errors:', errs[:5]); await br.close()
asyncio.run(main())
