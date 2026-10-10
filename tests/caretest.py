from _env import GAME, boot
# Gear care (10b-gearcare.js, Jonas 08.10.2026): the line's condition and hooks (wear from a haul, hooks changed from the store, fresh hooks
# fishing 5 % better for three hauls), the buoy sets bought no further than the gear can use, the tackle shop's service in half the time for a fee
# and its buy-back at a quarter of the price, the pots, the nets' falling ceiling, the jig tackle, the crew's own upkeep in port, and old saves.
# Math.random is seeded so the runs repeat.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
SEED = """(()=>{ let a = 20261008; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })()"""
PREP = """(()=>{ S.equip.linehaler = S.equip.garnhaler = S.equip.teinehaler = true; S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.stock = initStock();
  const b = S.boat; b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; b.gear = true; b.kgear = true;
  S.pgear = newPGear(); S.jobs = []; S.sets = []; S.crew = []; for (let i = 0; i < 2; i++) S.crew.push(Object.assign(genCrew(), {bi:false, off:false}));
  window.done = () => { for (let i = 0; i < 3000 && (S.jobs || []).length; i++){ S.t += 5; step(); } return (S.jobs || []).length; };
})()"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SEED); await pg.evaluate(PREP)
        # 1. the line: new with its hooks, wear in a haul, hooks changed from the store, fresh hooks fish better
        r = await pg.evaluate("""(()=>{ const R = {}, pg = S.pgear; R.b0 = buyGear('stamp', 'hyse', 8); const L = pg.lines.hyse; R.fresh = [L.n, L.cond, L.max, L.miss, L.bent];
          // eight tubs go out and come back after a heavy haul
          const s = {kind:'line', lk:'hyse', n:8, hooks:4800, a:{x:10, y:10}, b:{x:10.3, y:10}, depth:80, cond:L.cond, miss:L.miss, bent:L.bent, sharp:false, acc:{}}; L.n = 0;
          const g = {kg:700, done:8, soak:14}; let W = wearOf(s, g); R.W1 = [W.cond, W.miss, W.bent, W.tore]; careBack(s, 8, W);
          R.after1 = [L.n, L.cond, L.miss, L.bent]; const q1 = lineQ({cond:L.cond, miss:L.miss, bent:L.bent});
          for (let i = 0; i < 12; i++){ L.n = 0; const s2 = {kind:'line', lk:'hyse', n:8, hooks:4800, depth:80, cond:L.cond, miss:L.miss, bent:L.bent, a:{x:10, y:10}, b:{x:10.3, y:10}}; W = wearOf(s2, g); careBack(s2, 8 - (W.tore || 0), W); }
          R.after13 = [L.n, L.cond, L.miss, L.bent]; R.q13 = lineQ({cond:L.cond, miss:L.miss, bent:L.bent}); R.q1 = q1; R.need = hooksNeed('hyse');
          R.noHooks = hooksJob('hyse', false);
          R.bh = buyGear('hooks', 1000, 2); R.stock = pg.hooks; const c0 = S.cash; R.hj = hooksJob('hyse', false); R.queued = S.jobs.map(j => [j.kind, j.n, j.h]); R.left = done();
          R.afterJob = [L.miss, L.bent, L.sharp, pg.hooks]; R.qSharp = lineQ({cond:L.cond, miss:L.miss, bent:L.bent, sharp:true}); R.qNoSharp = lineQ({cond:L.cond, miss:L.miss, bent:L.bent});
          return R; })()""")
        print('line:', json.dumps(r, ensure_ascii=False))
        print(ok(r['b0'] is None and r['fresh'] == [8, 1, 1, 0, 0]), 'a new line comes complete: full condition and no missing or bent hooks')
        print(ok(r['W1'][0] < 1 and r['W1'][1] > 0 and r['W1'][2] > 0 and r['after1'][1] < 1), 'a heavy haul wears the line and the hooks', r['W1'])
        print(ok(r['q13'] < r['q1'] < 1 and r['need'] > 100), 'thirteen hauls later the catch factor is clearly lower and many hooks need changing', [r['q1'], r['q13'], r['need']])
        print(ok(r['noHooks'] and r['bh'] is None and r['stock'] == 2000 and r['hj'] is None and r['left'] == 0 and r['afterJob'][0] == 0 and r['afterJob'][1] == 0 and r['afterJob'][2] == 3), 'without hooks in the store nothing is changed; with a pack the crew changes them, and the fresh hooks are «sharp» for three hauls', r['afterJob'])
        print(ok(abs(r['qSharp'] / r['qNoSharp'] - 1.05) < 1e-6), '5 % better catch while the hooks are fresh')
        # 2. the buoy sets and anchors only up to what the gear can use
        r = await pg.evaluate("""(()=>{ const R = {}; S.pgear = newPGear(); S.sets = []; R.none = buyGear('kit', 0, 1); buyGear('stamp', 'hyse', 2); R.two = buyGear('kit', 0, 3); R.ok2 = buyGear('kit', 0, 2); R.third = buyGear('kit', 0, 1);
          R.heavy = buyGear('heavy', 0, 3); R.heavyOk = buyGear('heavy', 0, 2); R.kits = S.pgear.kits; return R; })()""")
        print('kits:', json.dumps(r, ensure_ascii=False))
        print(ok(r['none'] and r['two'] and r['ok2'] is None and r['third'] and r['heavy'] and r['heavyOk'] is None), 'buoy sets and anchors are limited by the line, nets and pots owned', r['kits'])
        # 3. the shop: service in half the time for a fee, buy-back at a quarter
        r = await pg.evaluate("""(()=>{ const R = {}; S.pgear = newPGear(); S.jobs = []; const pgx = S.pgear, L = pgx.lines.hyse; buyGear('stamp', 'hyse', 8);
          L.cond = 0.5; L.miss = 0.1; L.bent = 0.1; const c0 = S.cash;
          R.self = lineFix('hyse', false); const hSelf = S.jobs[0].h; const cSelf = c0 - S.cash; R.left = done(); R.afterSelf = [L.cond, L.max];
          L.cond = 0.5; const c1 = S.cash; R.shop = lineFix('hyse', true); const hShop = S.jobs[0].h; const cShop = c1 - S.cash; R.left2 = done();
          R.times = [hSelf, hShop, cSelf, cShop]; R.afterShop = [L.cond, L.max];
          const n0 = S.cash; R.sell = sellGear('line', 'hyse', 2); R.sold = S.cash - n0; R.maxSell = Math.round(LINE_KINDS.hyse.price * 0.25 * 2);
          R.hooksSold = (() => { buyGear('hooks', 100, 1); const c = S.cash; sellGear('hooks', 0, 100); return S.cash - c; })();
          R.noShop = (() => { S.boat.port = 'botnhamn'; S.boat.pos = {...portById('botnhamn').p}; const w = sellGear('line', 'hyse', 1); S.boat.port = 'finnsnes'; S.boat.pos = {...portById('finnsnes').p}; return !!w; })();
          return R; })()""")
        print('shop:', json.dumps(r, ensure_ascii=False))
        print(ok(r['self'] is None and r['shop'] is None and r['left'] == 0 and r['left2'] == 0 and r['times'][1] < r['times'][0] and r['times'][3] > r['times'][2]), 'the shop mends the line faster than the crew, for a fee', r['times'])
        print(ok(abs(r['afterSelf'][0] - 1) < 1e-6 and abs(r['afterSelf'][1] - 0.93) < 1e-6 and r['afterShop'][1] < 0.93), 'a repair brings the line back to its ceiling and the ceiling falls', [r['afterSelf'], r['afterShop']])
        print(ok(r['sell'] is None and 0 < r['sold'] <= r['maxSell'] and r['noShop'] and r['hooksSold'] < 300), 'the shop buys gear back for at most a quarter of the new price, and only the shop does', [r['sold'], r['maxSell'], r['hooksSold']])
        # 4. nets, pots and the jig
        r = await pg.evaluate("""(()=>{ const R = {}; S.pgear = newPGear(); S.jobs = []; const pgx = S.pgear; buyGear('net', '156', 6); buyGear('pot', 'big', 4);
          const l = pgx.nets[0]; l.cond = 0.4; R.m1 = mendSelf(l.id); R.l1 = done(); const lm = pgx.nets[0]; R.net1 = [lm.cond, lm.max]; lm.cond = 0.4; R.m2 = netShop(lm.id); R.l2 = done(); R.net2 = [pgx.nets[0].cond, pgx.nets[0].max];
          pgx.potc.cond = 0.4; R.p1 = potFix(false); R.l3 = done(); R.pot1 = [pgx.potc.cond, pgx.potc.max]; pgx.potc.cond = 0.3; R.p2 = potFix(true); R.l4 = done(); R.pot2 = [pgx.potc.cond, pgx.potc.max];
          // the pots' catch factor and a wear on a set
          R.potQ = [potQ({cond:1}), potQ({cond:0})];
          // the jig
          const J = pgx.jig; R.q0 = jigQ(); for (let i = 0; i < 6000; i++) jigWear(); R.c = J.mark.c; R.q1 = jigQ(); R.noSpare = jigJob('mark'); buyGear('jig', 'mark', 2); R.spare = J.mark.n; R.sw = jigJob('mark'); R.l5 = done(); R.c2 = J.mark.c;
          S.target = 'kveite'; R.kv = jigKind(); R.kvQ = jigQ(); R.choose = jigChoose('mix'); R.tg = S.target; S.target = 'mix';
          return R; })()""")
        print('rest:', json.dumps(r, ensure_ascii=False))
        print(ok(r['m1'] is None and r['l1'] == 0 and r['net1'][1] < 0.95 and r['m2'] is None and r['l2'] == 0 and r['net2'][1] < r['net1'][1]), 'nets: mending by the crew and by the shop, and the ceiling falls each time', [r['net1'], r['net2']])
        print(ok(r['p1'] is None and r['l3'] == 0 and r['pot1'][0] > 0.9 and r['p2'] is None and r['l4'] == 0 and r['pot2'][1] < r['pot1'][1] and r['potQ'][0] > r['potQ'][1]), 'pots: repaired by the crew and the shop, the ceiling falls', [r['pot1'], r['pot2']])
        print(ok(r['q0'] == 1 and r['q1'] < 1 and r['c'] < 1 and r['noSpare'] and r['spare'] == 2 and r['sw'] is None and r['l5'] == 0 and r['c2'] == 1 and r['kv'] == 'kveite' and r['tg'] == 'mix'), 'the jig set wears with fishing, a spare is fitted in a job, and the halibut pilk is chosen apart from the hooks', [r['q1'], r['c'], r['c2']])
        # 5. the crew's own upkeep in port; and an old save without the new fields
        r = await pg.evaluate("""(()=>{ const R = {}; S.pgear = newPGear(); S.jobs = []; const pgx = S.pgear; buyGear('stamp', 'hyse', 8); const L = pgx.lines.hyse; L.miss = 0.2; L.bent = 0.2; pgx.hooks = 5000;
          S.settings.careAuto = false; S.t += 120; careTick(); R.off = S.jobs.length; S.settings.careAuto = true; S.t += 120; careTick(); R.on = S.jobs.map(j => j.kind); R.lf = done(); R.after = [L.miss, L.bent];
          const old = newPGear(); for (const k of ['cond', 'max', 'bent', 'miss', 'sharp']) delete old.lines.hyse[k]; delete old.hooks; delete old.potc; delete old.jig; old.nets.push({id:'n1', mesh:156, n:2, cond:0.8}); careInit(old);
          R.old = [old.lines.hyse.cond, old.lines.hyse.max, old.hooks, old.potc.cond, old.jig.mark.c, old.nets[0].max];
          S.crew = []; S.jobs = []; L.miss = 0.2; S.t += 120; careTick(); R.alone = S.jobs.length;
          return R; })()""")
        print('upkeep:', json.dumps(r, ensure_ascii=False))
        print(ok(r['off'] == 0 and r['on'] == ['hk'] and r['lf'] == 0 and r['after'] == [0, 0] and r['alone'] == 0), 'the crew changes worn hooks by itself in port when it has the hooks, not with the setting off, not when alone', r['on'])
        print(ok(r['old'] == [1, 1, 0, 1, 1, 0.95]), 'an old save gets the new fields', r['old'])
        # 6. on screen: the status under Inventory, the shop's Service page, and the buttons work
        r = await pg.evaluate("""(()=>{ const R = {}; const b = S.boat; b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; S.pgear = newPGear(); S.jobs = []; S.cash = 1e6; S.crew = [Object.assign(genCrew(), {bi:false, off:false}), Object.assign(genCrew(), {bi:false, off:false})];
          buyGear('stamp', 'hyse', 8); buyGear('pot', 'big', 3); buyGear('net', '156', 4); buyGear('hooks', 500, 1); const L = S.pgear.lines.hyse; L.miss = 0.1; L.bent = 0.1; L.cond = 0.5; S.pgear.potc.cond = 0.5; S.pgear.nets[0].cond = 0.5; S.pgear.bait = {makrell:40, sild:15};
          PHONE.open('redskap'); document.querySelector('[data-pa=sub][data-s=bord]').click(); const html = document.getElementById('drawerBody').innerHTML; R.bord = ['tak ', 'mangler', 'bøyde', 'Kroker på lager', 'Makrell', 'Sild', 'Reparer teinene selv', 'Reparer lina selv', 'Mannskapet vedlikeholder selv'].map(t => html.includes(t));
          R.hookBtn = !!document.querySelector('[data-pa=carehk][data-m=self]'); R.kjop = ['Kroker og juksautstyr', '500 kroker'].map(t => (document.querySelector('[data-pa=sub][data-s=kjop]').click(), document.getElementById('drawerBody').innerHTML.includes(t)));
          PHONE.open('service'); const d = document.getElementById('drawerBody'); const sh = d.innerHTML; R.service = ['Service i utstyrsbutikken', 'Selg ', 'Reparer lina', 'Bøt garna', 'Reparer teinene'].map(t => sh.includes(t));
          const c0 = S.cash; document.querySelector('#drawerBody [data-pa=carelr][data-m=shop]').click(); R.shopJob = S.jobs.map(j => [j.kind, !!j.shop]); R.paid = c0 - S.cash;
          const n0 = S.pgear.pots.big; document.querySelector('#drawerBody [data-pa=caresell][data-w=pot]').click(); R.sold = n0 - S.pgear.pots.big;
          R.auto = (() => { document.querySelector('[data-pa=careauto]'); return S.settings.careAuto; })(); return R; })()""")
        print('ui:', json.dumps(r, ensure_ascii=False))
        print(ok(all(r['bord']) and r['hookBtn'] and all(r['kjop'])), 'Inventory shows ceilings, hooks, bait kinds and the upkeep buttons, and the Buy tab sells hooks and jig sets', [r['bord'], r['kjop']])
        print(ok(all(r['service']) and r['shopJob'] == [['lr', True]] and r['paid'] > 0 and r['sold'] == 1), 'the Service page offers mending and buy-back, and the buttons work', [r['service'], r['shopJob'], r['paid'], r['sold']])
        # the one buying rule (Jonas 08.10.2026): nothing for line, nets or pots without the hauler, and nothing that goes with gear you do not own
        r = await pg.evaluate("""(()=>{ const R = {}; S.pgear = newPGear(); S.jobs = []; S.cash = 1e7; for (const k of ['linehaler', 'garnhaler', 'teinehaler']) S.equip[k] = false;
          R.noHaul = [buyGear('stamp', 'hyse', 1), buyGear('net', '156', 1), buyGear('pot', 'big', 1)].map(x => !!x);
          R.noGear = [buyGear('hooks', 100, 1), buyGear('kit', 0, 1), buyGear('bait', 'makrell', 10)].map(x => !!x);
          S.equip.linehaler = true; R.line = buyGear('stamp', 'hyse', 1); R.hooks = buyGear('hooks', 100, 1); R.names = ['linehaler', 'garnhaler', 'teinehaler'].map(k => EQUIP[k].name.no);
          return R; })()""")
        print('gate:', json.dumps(r, ensure_ascii=False))
        print(ok(all(r['noHaul']) and all(r['noGear']) and r['line'] is None and r['hooks'] is None and r['names'] == ['Linehaler', 'Garnhaler', 'Teinehaler']), 'line, nets and pots need their hauler, hooks, buoy sets and bait need the gear, and the haulers carry plain names')
        print(ok(not errs), 'no page errors', errs[:2])
        await br.close()
asyncio.run(main())
