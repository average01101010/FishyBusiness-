"""The vessels (core/02-species-gear.js VESSELS): every type has the full spec, the numbers hang together, the rules read the fields
and not the type names, and equipment fits by size. Prints OK/FEIL lines."""
import asyncio, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def guard():
    """No code may branch on a vessel type name: `=== 'sjark'` and the like. The keys live in VESSELS and the data tables only."""
    src = open(os.path.join(ROOT, 'src/js/core/02-species-gear.js')).read()
    keys = re.findall(r"^  (\w+):\{name:", src[src.index('const VESSELS'):src.index('const BOAT')], re.M)
    hits = []
    for d in ('src/js/core', 'src/js/ui', 'src/js'):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if not f.endswith('.js'): continue
            for i, line in enumerate(open(os.path.join(ROOT, d, f)), 1):
                for k in keys:
                    if re.search(r"[!=]==\s*'" + k + r"'|'" + k + r"'\s*[!=]==", line): hits.append('%s/%s:%d' % (d, f, i))
    return keys, sorted(set(hits))


async def main():
    keys, hits = guard()
    print('types:', keys)
    print(ok(not hits), 'no code branches on a vessel type name', hits[:8])
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {bad:[]}, need = ['name', 'len', 'beam', 'draft', 'disp', 'holdCap', 'iceCap', 'fuelCap', 'hp', 'engine', 'vmax', 'vcruise', 'accel', 'turnR',
            'planing', 'outboard', 'diesel', 'fuelK', 'risk', 'sea', 'crewMax', 'berths', 'tubCap', 'land', 'std', 'rigs', 'jukseMax', 'gearMax', 'svcH', 'svcCost', 'svcJobH', 'cls', 'price', 'year', 'desc'];
          for (const [k, V] of Object.entries(VESSELS)){
            for (const f of need) if (V[f] == null) R.bad.push(k + ': mangler ' + f);
            // fullness: displacement over length overall × beam × greatest draft × sea water. With the overall figures (not the waterline
            // ones) small boats come out at 0.1–0.3 and big full hulls up to 0.6
            const cb = V.disp / (V.len * V.beam * V.draft * 1.025);
            if (!(cb > 0.1 && cb < 0.6)) R.bad.push(k + ': blokkoeffisient ' + cb.toFixed(2));
            if (!(V.draft < 0.6 * V.beam)) R.bad.push(k + ': dypgående mot bredde');
            if (!(V.beam < V.len / 1.8)) R.bad.push(k + ': bredde mot lengde');
            if (!(V.vcruise <= V.vmax)) R.bad.push(k + ': marsjfart over toppfart');
            if (!(V.holdCap < V.disp * 1000)) R.bad.push(k + ': last over vekten');
            if (!['box', 'tub'].includes(V.land)) R.bad.push(k + ': land');
            if (V.cls !== 'hav' && BEAM[k] !== V.beam) R.bad.push(k + ': BEAM');
          }
          // equipment fits by size: the small electric hauler on small boats, hydraulic haulers and sonar on bigger ones, the 90 hp outboard on outboard boats
          R.fit = Object.fromEntries(Object.keys(VESSELS).map(k => [k, Object.keys(EQUIP).filter(q => equipFits(q, k)).join(',')]));
          // the 90 hp outboard boosts only a boat with an outboard
          const b = S.boat, t0 = b.type; b.type = 'skiff'; S.equip.motor90 = true; applyVessel(); R.boost = [BOAT.vmax, BOAT.fuelK]; S.equip.motor90 = false; applyVessel(); R.plain = [BOAT.vmax, BOAT.fuelK];
          b.type = t0; applyVessel();
          // the old type table values are kept for the four first types
          R.same = ['skiff', 'snekke', 'sjark', 'sjarkny'].map(k => [k, VESSELS[k].tubCap, VESSELS[k].land, VESSELS[k].svcJobH, VESSELS[k].accel]);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(not r['bad']), 'every vessel type has the full spec and the numbers hang together', r['bad'][:6])
        f = r['fit']
        print(ok('elhaler' in f['skiff'] and 'elhaler' in f['snekke'] and 'elhaler' not in f['sjark'] and 'garnhaler' not in f['skiff'] and 'garnhaler' in f['snekke']
                 and 'sonar' in f['sjark'] and 'sonar' not in f['snekke'] and 'motor90' in f['skiff'] and 'motor90' not in f['snekke']), 'equipment fits by size and engine')
        print(ok(r['boost'] == [30, 1.35] and r['plain'] == [24, 1]), 'the 90 hp outboard gives the skiff 30 kn and a thirstier engine')
        print(ok(r['same'] == [['skiff', 60, 'box', 3, 10], ['snekke', 150, 'box', 5, 3], ['sjark', 300, 'tub', 8, 3], ['sjarkny', 400, 'tub', 10, 10]]), 'the old type tables (tub, landing, yard hours, acceleration) are now fields with the same values')
        # the ladder: prices rise with what you get, the closed-group offers sit on the right boats, the ocean fleet is locked, big boats keep out of the fjords
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat;
          R.ladder = Object.entries(VESSELS).map(([k, V]) => [k, V.len, V.cls, !!V.lock]);
          R.offers = LIC_OFFERS.map(O => [O.id, O.ves, VESSELS[O.ves].len, Math.round((VESSELS[O.ves].price + licValue(O)) / 1000)]);
          // the 8.9 m sjark is in the open group's 8–9.99 m quota group: the year's maximum quota for it (5.6 t in 2026)
          const t0 = b.type; b.type = 'jukesjark'; applyVessel(); R.jukGroup = [lenGroup(), codLimits().max, Math.round((yearQuota(yearH(S.t / 60)).open.max[1] + openMaxAdd(S.t / 60)) * 1000)]; b.type = 'kyst21'; applyVessel();
          const inside = GROUNDS.find(g => insideFjord(g.p) && depthF(g.p) > 20).p; b.status = 'fishing'; b.port = null; b.pos = {...inside}; b.gop = null; b.rig = 'juksa'; b.gear = true; b.fishUntil = S.t + 120; S.hold = []; S.crew = [];
          for (let i = 0; i < 60; i++) step(); R.fjord = {kg:Math.round(holdTotal()), warn:S.log.slice(-40).some(e => /fjordlinj/.test(e.no))};
          b.type = t0; applyVessel(); b.status = 'idle'; return R; })()""")
        print('ladder:', json.dumps(r, ensure_ascii=False))
        # the hold rebuilt at the yard in three steps (04.10.2026): +25 %, +60 %, twice; the ice room grows with it, and a type's own numbers stay
        hd = await pg.evaluate("""(()=>{ const b = S.boat, t0 = b.type, l0 = b.holdLv; b.type = 'skiff'; const out = [];
          for (const lv of [0, 1, 2, 3]){ b.holdLv = lv; applyVessel(); out.push([BOAT.holdCap, BOAT.iceCap, capHold()]); }
          b.holdLv = 0; finishJob({kind:'hold', lv:1, no:'', en:''}); const job = b.holdLv; b.holdLv = l0; b.type = t0; applyVessel();
          return {out, spec:VESSELS.skiff.holdCap, ice:VESSELS.skiff.iceCap, job}; })()""")
        # weight, the engine, the boosts and fouling (04.10.2026): a full hold costs 5-15 % top speed, a bigger engine and the boosts help a
        # displacement boat at most 12 % and a planing one more, the outboard skiff takes none of the diesel boosts, fouling costs 15 % and 25 % fuel
        wt = await pg.evaluate("""(()=>{ const b = S.boat, keep = {type:b.type, hold:S.hold, eng:b.engLv, trim:b.trim, foul:b.foul, fuel:b.fuel}, R = {};
          const sp = () => +speedCap(0.3).toFixed(2), fill = kg => { S.hold = kg ? [{sp:'torsk', cls:1, kg, n:Math.round(kg / 4), bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}] : []; };
          for (const t of ['skiff', 'sjark']){ b.type = t; b.engLv = 0; delete b.trim; b.foul = 0; applyVessel(); b.fuel = BOAT.fuelCap / 2; fill(0); const v0 = sp(); fill(BOAT.holdCap); R[t] = {empty:v0, full:sp(), spec:VESSELS[t].vmax}; fill(0);
            b.engLv = 2; applyVessel(); R[t].eng = +BOAT.vmax.toFixed(2); b.engLv = 0; b.trim = {k:'turbo', t0:S.t}; applyVessel(); R[t].boost = +BOAT.vmax.toFixed(2); b.trim = {k:'turbo', t0:S.t - 73 * 60}; applyVessel(); R[t].gone = +BOAT.vmax.toFixed(2); delete b.trim;
            b.foul = 1; applyVessel(); const vf = sp(), ff = fuelLph(5, 0); b.foul = 0; R[t].foul = [+(vf / v0).toFixed(3), +(ff / fuelLph(5, 0)).toFixed(3)]; }
          Object.assign(b, {type:keep.type, engLv:keep.eng, trim:keep.trim, foul:keep.foul, fuel:keep.fuel}); S.hold = keep.hold; applyVessel(); return R; })()""")
        sk, sj = wt['skiff'], wt['sjark']
        print(ok(0.80 <= sk['full'] / sk['empty'] <= 0.95 and 0.85 <= sj['full'] / sj['empty'] <= 0.95), 'a full hold costs top speed, more on the planing skiff than on the sjark', {k: (v['empty'], v['full']) for k, v in wt.items()})
        print(ok(sj['eng'] <= sj['spec'] * 1.12 + 1e-6 and sj['eng'] > sj['spec'] and abs(sj['boost'] - sj['spec'] * 2) < 0.02 and sj['gone'] == sj['spec'] and sk['eng'] == sk['spec'] and sk['boost'] == sk['spec']), 'a bigger engine helps the sjark (at most +12 %), turbo trim doubles her speed for 72 game hours and then it is gone, the outboard skiff takes neither', {k: (v['spec'], v['eng'], v['boost'], v['gone']) for k, v in wt.items()})
        print(ok(all(abs(v['foul'][0] - 0.85) < 0.01 and abs(v['foul'][1] - 1.25) < 0.01 for v in wt.values())), 'a fully fouled hull costs 15 % speed and 25 % fuel', {k: v['foul'] for k, v in wt.items()})
        print(ok([x[0] for x in hd['out']] == [hd['spec'], round(hd['spec'] * 1.25), round(hd['spec'] * 1.6), hd['spec'] * 2] and hd['out'][3][1] == hd['ice'] * 2 and all(x[0] == x[2] for x in hd['out']) and hd['job'] == 1), 'the hold rebuilt in three steps: +25 %, +60 %, twice, the ice room with it', hd)
        lens = [x[1] for x in r['ladder'] if x[2] != 'hav']
        print(ok(len(r['ladder']) >= 14 and all(x[3] for x in r['ladder'] if x[2] == 'hav') and not any(x[3] for x in r['ladder'] if x[2] != 'hav')), 'the ladder runs from the open boat to the ocean fleet, and only the ocean fleet is locked')
        print(ok([o[0] for o in r['offers']] == ['u7', 'h7', 'h8', 'h9', 'h10', 'h14', 'h20'] and all(r['offers'][i][3] < r['offers'][i + 1][3] for i in range(6))), 'seven closed-group offers by quota length (the coastal vessels with 14–14.9 and 20–20.9 m), dearer the longer')
        print(ok(r['jukGroup'][0] == 1 and r['jukGroup'][1] == r['jukGroup'][2]), 'the 8.9 m sjark fishes in the open group 8–9.99 m, with the year\'s maximum quota for that group', r['jukGroup'])
        print(ok(r['fjord']['kg'] == 0 and r['fjord']['warn']), 'a 21 m vessel may not jig inside the fjord line')
        # the market: tabs, cards with a side view, the spec sheet, the ocean fleet locked, one open-group boat, in landscape and portrait
        for vw, vh, tag in ((1100, 800, 'liggende'), (800, 1180, 'staende')):
            await pg.set_viewport_size({'width':vw, 'height':vh})
            u = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.fleet = [S.fleet[0]]; bindVessel(S.fleet[0]); b.type = 'skiff'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.order = null; S.cash = 3e5; S.fm = {n:10, last:-1, kr:2e5, b:true};
              S.sales = S.sales.length >= 3 ? S.sales : [{t:0, total:1}, {t:0, total:1}, {t:0, total:1}];
              const dr = () => document.getElementById('drawerBody'), tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
              DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])');
              const cards = t => { tap('[data-pa=mktab][data-s=' + t + ']'); return [...dr().querySelectorAll('.vcard')].map(c => [c.dataset.k, c.dataset.o || '', !!c.querySelector('svg polygon, img.vimg')]); };
              R.tabs = {open:cards('open'), lic:cards('lic'), kyst:cards('kyst'), hav:cards('hav')};
              // the sheet of an ocean vessel: every section, and no buy button
              tap('[data-pa=mksel][data-k=bunntral]'); const sh = dr().querySelector('.vsheet'); R.havSecs = [...sh.querySelectorAll('.vsec h5')].map(e => e.textContent); R.havBuy = !!sh.querySelector('[data-pa=buy]'); R.havText = sh.textContent.includes('Bredde') && sh.textContent.includes('Dypgående') && sh.textContent.includes('Vekt');
              tap('[data-pa=mksel]:not([data-k])');
              // an open-group boat: trade-in only before the company owns a closed-group vessel
              tap('[data-pa=mktab][data-s=open]'); tap('[data-pa=mksel][data-k=jukesjark]'); R.fleetBtn = !!dr().querySelector('[data-pa=buy][data-ti="0"]'); R.tiBtn = dr().querySelector('[data-pa=buy][data-ti="1"]'); R.tiOk = !!R.tiBtn && !R.tiBtn.disabled; R.tiBtn = !!R.tiBtn;
              R.small = [...dr().querySelectorAll('button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43).map(e => e.textContent.slice(0, 24)); R.overflow = dr().scrollWidth > dr().clientWidth + 1;
              tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=lic]'); tap('[data-pa=mksel][data-k=trebat][data-o=u7]'); R.licSecs = [...dr().querySelectorAll('.vsheet .vsec h5')].map(e => e.textContent);
              R.licBtns = [...dr().querySelectorAll('[data-pa=buylic]')].length;
              return R; })()""")
            await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', 'market_' + tag + '.png'))
            print(tag, json.dumps(u, ensure_ascii=False)[:900])
            t = u['tabs']
            print(ok(len(t['open']) == 8 and len(t['lic']) == 7 and len(t['kyst']) == 2 and len(t['hav']) == 4 and all(c[2] for v in t.values() for c in v)), tag + ': four tabs with every boat as a card with its side view')
            print(ok(u['havText'] and not u['havBuy'] and len(u['havSecs']) >= 3), tag + ': the ocean vessel has a full spec sheet (length, beam, draft, weight) and no buy button')
            print(ok(u['tiBtn'] and u['tiOk'] and not u['fleetBtn']), tag + ': an open-group boat is bought by trading in, not for the fleet, before the company has a closed-group vessel')
            print(ok('Hjemmel' in u['licSecs'] and u['licBtns'] == 2), tag + ': a boat with a right shows the right and both ways to buy')
            print(ok(not u['overflow'] and not u['small']), tag + ': no sideways scroll and every button at least 44 px', u['small'][:4])
            await pg.evaluate("DOCK.close()")
        # trading the skiff in for the 8.9 m sjark
        r = await pg.evaluate("""(()=>{ S.cash = 9e5; const c0 = S.cash; DOCK.open('fartoy'); const dr = document.getElementById('drawerBody'); const back = dr.querySelector('[data-pa=mksel]:not([data-k])'); if (back) back.click(); dr.querySelector('[data-pa=mktab][data-s=open]').click(); dr.querySelector('[data-pa=mksel][data-k=jukesjark]').click();
          dr.querySelector('[data-pa=buy][data-ti="1"]').click(); const R = {type:S.boat.type, paid:Math.round(c0 - S.cash), fleet:S.fleet.length, open:openVesselId() === S.cur}; DOCK.close(); return R; })()""")
        print('trade-in:', json.dumps(r))
        print(ok(r['type'] == 'jukesjark' and r['paid'] == 750000 - 66500 and r['fleet'] == 1 and r['open']), 'trading the skiff in for the 8.9 m sjark costs the price less the trade-in, and she takes the open-group place')
        # V7, the way to the closed group: blad B, the loans, Innovasjon Norge's top-up and the ladder in «Neste mål»
        r = await pg.evaluate(r'''(()=>{ const R = {}, b = S.boat; S.fleet = [S.fleet[0]]; bindVessel(S.fleet[0]); b.type = 'skiff'; applyVessel(); S.lic = null; S.loan = null; S.loanIN = null; S.inUsed = false; S.order = null;
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.gear = true; S.equip.jukse = 1; S.equip.motor90 = false; S.fm = {n:0, last:-1, kr:0, b:false}; S.msgs = [];
          const dr = () => document.getElementById('drawerBody'), tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
          const goalTxt = () => { DOCK.open('fartoy'); const c = [...dr().querySelectorAll('.ph-card')].find(e => /Neste mål/.test(e.textContent)); const t = c ? [...c.querySelectorAll('b')].map(e => e.textContent) : []; DOCK.close(); return t; };
          R.goals0 = goalTxt();
          // ten landing days with you aboard and 1 G
          const t0 = S.t; for (let d = 0; d < 9; d++){ S.t = t0 + d * 1440; fmLand(15000); } R.b9 = bladB(); S.t = t0 + 9 * 1440; fmLand(15000); R.b10 = bladB(); S.t = t0;
          R.msgB = S.msgs.some(m => /blad B/.test(m.no || m.text || JSON.stringify(m)));
          // migration: an old save gets blad B from its landing notes, or at once with a closed-group right
          const keep = S.sales; S.sales = Array.from({length:10}, (_, i) => ({t:i * 1440 + 600, total:14000})); R.mig = fmInit(); S.sales = keep.length >= 3 ? keep : [{t:0, total:1}, {t:0, total:1}, {t:0, total:1}];
          S.sales = S.sales.slice(-3); const F0 = S.fm; S.fm = null; S.lic = {id:'u7'}; R.migLic = fmInit().b; S.lic = null; S.fm = F0;
          // the loophole: a trade-in pays the loan off first, and only the rest is equity
          S.loan = {bal:200000, rate:0.069, pay:2300, next:S.t + 1e5}; R.loophole = deal(1e6, 66500); S.loan = null;
          // the sheet of the entry boat without and with blad B
          const sheetOf = () => { DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=lic]'); tap('[data-pa=mksel][data-k=trebat][data-o=u7]'); const sh = dr().querySelector('.vsheet'), x = {btns:sh.querySelectorAll('[data-pa=buylic]').length, txt:sh.textContent}; tap('[data-pa=mksel]:not([data-k])'); DOCK.close(); return x; };
          S.fm.b = false; const s0 = sheetOf(); R.noB = {btns:s0.btns, note:/Krever blad B/.test(s0.txt)}; S.fm.b = true; const s1 = sheetOf(); R.withB = {btns:s1.btns, inn:/Innovasjon Norge/.test(s1.txt)};
          R.goals1 = goalTxt();
          // the entry: the skiff traded in and NOK 200 000 in the bank buys the boat with a right under 7 m
          const O = LIC_OFFERS[0], price = VESSELS[O.ves].price + licValue(O); R.price = price; S.cash = 200000; R.noInn = deal(price, vesselValue(curVessel()), false).why;
          DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=lic]'); tap('[data-pa=mksel][data-k=trebat][data-o=u7]'); tap('[data-pa=buylic][data-ti="1"]'); DOCK.close();
          R.after = {type:S.boat.type, lic:S.lic && S.lic.id, cash:Math.round(S.cash), loan:S.loan && Math.round(S.loan.bal), loanIN:S.loanIN && Math.round(S.loanIN.bal), inUsed:!!S.inUsed, innNow:innOK()};
          R.goals2 = goalTxt();
          DOCK.open('bank'); R.bank = dr().textContent.includes('Innovasjon Norge'); DOCK.close();
          PHONE.open('sjomann'); PHONE.dact('sjomann', 'sub', {s:'papir'}); PHONE.render(); R.papers = /blad B/.test(document.querySelector('#phone').textContent) && /Ført på blad B/.test(document.querySelector('#phone').textContent); PHONE.show(false);
          // selling a vessel pays the loans first
          const v2 = newVesselObj('snekke', 'husoy'), l0 = S.loan.bal, c0 = S.cash, val = vesselValue(v2); window.confirm = () => true; PHONE.dact('rederi', 'vsell', {id:v2.id}); R.sell = {loanDown:Math.round(l0 - (S.loan ? S.loan.bal : 0)), cash:Math.round(S.cash - c0), val};
          return R; })()''')
        print('V7:', json.dumps(r, ensure_ascii=False)[:1400])
        print(ok(not r['b9'] and r['b10'] and r['msgB']), 'blad B comes with the tenth landing day and 1 G, with a message from Fiskeridirektoratet')
        print(ok(r['mig']['b'] and r['mig']['n'] == 10 and r['migLic']), 'an old save gets blad B from its landing notes, or at once with a closed-group right')
        print(ok(r['loophole']['payoff'] == 66500 and r['loophole']['tiNet'] == 0 and r['loophole']['eqNeed'] == 200000), 'a trade-in pays off the loan first; only the rest counts as equity')
        print(ok(r['noB']['btns'] == 0 and r['noB']['note'] and r['withB']['btns'] == 2 and r['withB']['inn']), 'a boat with a right needs blad B; with it, both buttons and the top-up from Innovasjon Norge')
        print(ok(r['noInn'] == 'eq' and r['after']['lic'] == 'u7' and r['after']['type'] == 'trebat' and r['after']['cash'] >= 0 and r['after']['loanIN'] and r['after']['loanIN'] <= r['price'] * 0.15 + 1
                 and r['after']['loan'] <= r['price'] * 0.8 + 1 and r['after']['inUsed'] and not r['after']['innNow']), 'the entry: the skiff and NOK 200 000 buy the boat with a right under 7 m with the top-up, not without it')
        g0, g1, g2 = r['goals0'], r['goals1'], r['goals2']
        print(ok(len(g0) == 2 and 'Blad B' in g0[0] and 'under 7 m' in g0[1] and 'under 7 m' in g1[0] and '7–7,9 m' in g2[0] and '14,99' in g2[1]), 'Neste mål follows the ladder: blad B, the entry right, the next right, the 14.99 m coastal vessel', [g0, g1, g2])
        print(ok(r['bank'] and r['papers']), 'the bank shows the risk loan, and the papers show blad B')
        print(ok(r['sell']['loanDown'] == r['sell']['val'] and r['sell']['cash'] == 0), 'selling a vessel pays the loan off first')
        # the catch from tools/fish/fisk.py: every species 1 m long with the head at -z, the halibut flat, the crab 1 m across its legs
        r = await pg.evaluate('''() => { const out = {}; for (const sp of ['torsk', 'sei', 'hyse', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'blakveite', 'krabbe']){ const o = glbPart('fish', sp);
            if (!o){ out[sp] = null; continue; } const lo = [9, 9, 9], hi = [-9, -9, -9]; let fz = 0, fn = 0;
            for (let i = 0; i < o.p.length; i += 3){ for (let k = 0; k < 3; k++){ lo[k] = Math.min(lo[k], o.p[i + k]); hi[k] = Math.max(hi[k], o.p[i + k]); } }
            out[sp] = {tri:o.p.length / 9, size:[0, 1, 2].map(k => +(hi[k] - lo[k]).toFixed(3)), z:[+lo[2].toFixed(3), +hi[2].toFixed(3)]}; } return out; }''')
        fish = {k: v for k, v in r.items() if k != 'krabbe'}
        print(ok(all(r.values()) and all(0.95 <= v['size'][2] <= 1.05 and v['z'][0] >= -0.52 and v['z'][1] <= 0.52 and v['size'][0] < 0.26 for v in fish.values())
                 and r['kveite']['size'][1] > 2.5 * r['kveite']['size'][0] and r['blakveite']['size'][1] > 2.0 * r['blakveite']['size'][0] and 0.8 <= r['krabbe']['size'][0] <= 1.2 and all(300 < v['tri'] < 3000 for v in r.values())),
              'the fish from Blender: ten species, each 1 m from the snout at -z, the halibut and the Greenland halibut flat, the crab about 1 m across', r)
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
