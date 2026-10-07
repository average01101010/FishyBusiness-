"""«Første uke på sjøen» and the long badges (core/09f-merker.js, ui/05e-merker.js; Jonas 07.10.2026): the milestones tick from the
game's state, a gift comes with each, drawn the same way every time for the same game and fitted to what the player has (bait for
lines, mended nets for nets); a chapter opens the next at five of seven and gives its reward at seven (a pennant others see, a luck,
the hull colour «Kystfisker»); the gifts wait during the first trip; a played game is ticked for what it has done; the long badges
give a gift a step; the first tow and the first repair are free; the Merker app and the home chip show it. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("window.__achOn = true;")   # the tests (#notut) pay no gifts unless they ask
        await boot(pg)
        # 1. taking over the boat ticks the first, with a gift
        a = await pg.evaluate("""(() => { achCheck(true); const A = S.ach; return {took:!!A.d.took, gift:A.g.took, open:[achOpen(0), achOpen(1), achOpen(2)], n:ACH.length, ch:[0, 1, 2].map(c => achInCh(c).length),
          log:S.log.some(l => /Gave for «Tok over båten»/.test(l.no))}; })()""")
        check(a['took'] and a['gift'] and a['gift'][0] and a['log'] and a['open'] == [True, False, False] and a['n'] == 21 and a['ch'] == [7, 7, 7],
              'the first milestone ticks on taking over the boat, with a gift in the log; 21 milestones in three chapters of seven, only the first open', a)
        # 2. the gift: the same for the same game, and fitted to what the player has
        g = await pg.evaluate("""(() => { const pg0 = JSON.stringify(S.pgear); const t = () => achPool(1).map(c => c.f(0.5).t[0]).join(' | ');
          const same = JSON.stringify(achDraw('x', 1).t) === JSON.stringify(achDraw('x', 1).t);
          S.pgear = newPGear(); const none = t();
          S.pgear.lines.hyse.n = 10; S.pgear.nets.push({id:'n1', mesh:'6', n:5, cond:0.5}); S.boat.foul = 0.4; const some = t();
          S.pgear = JSON.parse(pg0); S.boat.foul = 0;
          const tiers = {}; for (let i = 0; i < 400; i++){ const r = achRnd('k' + i, 1), tr = r < 0.7 ? 0 : r < 0.9 ? 1 : 2; tiers[tr] = (tiers[tr] || 0) + 1; }
          return {same, none, some, tiers}; })()""")
        check(g['same'] and 'agn' not in g['none'] and 'Bøteriet' not in g['none'] and 'makrell til agn' in g['some'] and 'Bøteriet bøter garna' in g['some'] and 'renser skroget' in g['some']
              and 230 < g['tiers'].get('0', 0) < 330 and 50 < g['tiers'].get('1', 0) < 110 and 20 < g['tiers'].get('2', 0) < 65,
              'a gift is drawn the same each time for the same game; bait comes only with lines, mended nets only with nets, a cleaned hull only when fouled; about 7 in 10 common, 2 good, 1 rare',
              {'same': g['same'], 'tiers': g['tiers'], 'none': [k for k in ('agn', 'Bøteriet') if k in g['none']], 'some': [k for k in ('makrell til agn', 'Bøteriet bøter garna', 'renser skroget') if k in g['some']]})
        # 3. the first trip: the gifts wait for the quay
        o = await pg.evaluate("""(() => { const A = S.ach; S.tut = {v:2}; S.stats.kg = 50; achCheck(true); const owe = A.owe.map(x => x[0]), given = !!(A.g.fish && A.g.fish[0]);
          S.tut = 0; achCheck(true); return {owe, given, after:!!(A.g.fish && A.g.fish[0]), left:A.owe.length}; })()""")
        check(o['owe'] == ['fish'] and not o['given'] and o['after'] and o['left'] == 0, 'during the first trip a milestone ticks but its gift waits, and comes when the trip is over', o)
        # 4. a chapter: five of seven open the next, seven give the reward (the pennant, in the paint code others get)
        c = await pg.evaluate("""(() => { const A = S.ach, h0 = (S.haillInv && S.haillInv.haill) || 0;
          S.landN = 2; S.sales = [{t:S.t, total:12000, port:'finnsnes'}]; achCheck(true); const c5 = {n:achNDone(0), open1:achOpen(1), done0:!!A.ch[0]};
          S.unnamed = false; achAdd('sleep'); achCheck(true); const c7 = {n:achNDone(0), done0:!!A.ch[0], pen:A.pen, liv:livStr(S.boat), msg:S.msgs.some(m => m.from === 'Kystposten' && /Fars båt/.test(m.no))};
          // the second chapter: a luck
          achAdd('equip'); S.sales.push({t:S.t, total:21000, port:'botnhamn'}); S.stats.kg = 1200; S.boat.holdLv = 1; achAdd('crew'); achAdd('storm'); achCheck(true);
          const c2 = {n:achNDone(1), done1:!!A.ch[1], open2:achOpen(2), haill:((S.haillInv && S.haillInv.haill) || 0) - h0, pen:A.pen};
          return {c5, c7, c2}; })()""")
        check(c['c5']['n'] == 5 and c['c5']['open1'] and not c['c5']['done0'] and c['c7']['n'] == 7 and c['c7']['done0'] and c['c7']['pen'] == 1 and 'p:1' in c['c7']['liv'] and c['c7']['msg']
              and c['c2']['n'] == 7 and c['c2']['done1'] and c['c2']['open2'] and c['c2']['haill'] == 1 and c['c2']['pen'] == 2,
              'five of seven open the next chapter; all seven give the pennant (in the paint code the others get) and a word from Kystposten; the second chapter gives a luck', c)
        # 5. the third chapter: the hull colour «Kystfisker», free in the paint shop
        k = await pg.evaluate("""(() => { const A = S.ach, before = palOk(HULLPAL.find(x => x[0] === 'kystfisker'));
          S.sales.push({t:S.t, total:52000, port:'finnsnes'}); S.stats.kg = 5200; achAdd('haul'); achAdd('boat'); achAdd('big'); S.fs = {p:fsNeed(5) + 10, rest:0, away:0}; achCheck(true);
          return {before, done2:!!A.ch[2], after:palOk(HULLPAL.find(x => x[0] === 'kystfisker')), pen:A.pen, liv:livStr(S.boat), chip:achChip()}; })()""")
        check(not k['before'] and k['done2'] and k['after'] and k['pen'] == 3 and 'p:3' in k['liv'] and k['chip'] == '',
              'the third chapter unlocks the hull colour «Kystfisker» and the longest pennant, and the home chip goes when the week is done', k)
        # 6. the long badges: a gift a step
        l = await pg.evaluate("""(() => { const A = S.ach; S.stats.kg = 26000; achCheck(true); return {tonn:A.l.tonn, g0:!!(A.g.tonn0 && A.g.tonn0[0]), g1:!!(A.g.tonn1 && A.g.tonn1[0]), g2:!!A.g.tonn2}; })()""")
        check(l['tonn'] == 2 and l['g0'] and l['g1'] and not l['g2'], 'the long badges: 26 tonnes landed take the 10 and 25 tonne steps, each with a gift', l)
        # 7. the first tow and the first repair are free, the second are paid
        t = await pg.evaluate("""(() => { delete S.free; S.member = false; S.cash = 100000; const b = S.boat; b.status = 'port'; b.port = b.port || 'finnsnes';
          const m0 = S.msgs.length, c0 = S.cash; S.hold = [{sp:'torsk', kg:50, fresh:90, bled:true, iced:true, cls:2, n:10, hr:0}]; rescue(false); const t1 = {paid:c0 - S.cash, hold:Math.round(holdTotal()), msg:S.msgs.slice(m0).some(m => m.from === 'Redningsselskapet' && /første slepet er gratis/.test(m.no))};
          const c1 = S.cash; rescue(true); const t2 = {paid:c1 - S.cash};
          const c2 = S.cash; b.damage = 1; hullRepair(); const r1 = {paid:c2 - S.cash, msg:S.msgs.slice(-1)[0].no}; const c3 = S.cash; b.damage = 1; hullRepair(); const r2 = {paid:c3 - S.cash};
          return {t1, t2, r1, r2, tow:PRICE.tow}; })()""")
        check(t['t1']['paid'] == 0 and t['t1']['hold'] == 50 and t['t1']['msg'] and t['t2']['paid'] == t['tow'] and t['r1']['paid'] == 0 and 'første reparasjonen' in t['r1']['msg'] and t['r2']['paid'] > 0,
              'the first tow is free and keeps the catch even in a distress call, with a word on how to avoid the next; the first repair is free; the second of each is paid', t)
        # 8. a played game: ticked for what it has done; the long badges set without a flood of gifts
        s = await pg.evaluate("""(() => { delete S.ach; S.landN = 14; S.sales = [{t:S.t, total:26000, port:'finnsnes'}, {t:S.t, total:61000, port:'botnhamn'}]; S.stats.kg = 9200; S.unnamed = false;
          achSeed(); achCheck(true); const A = S.ach; return {n:Object.keys(A.d).length, l25:!!A.d.l25, l50:!!A.d.l50, lev:A.l.lev, tonnG:Object.keys(A.g).filter(k => /^tonn/.test(k)).length, gifts:Object.values(A.g).filter(x => x[0]).length}; })()""")
        check(s['n'] >= 10 and s['l25'] and s['l50'] and s['lev'] == 0 and s['tonnG'] == 0 and s['gifts'] >= 8,
              "a game played before the badges is ticked for what it has done and gets the week's gifts, while the long badges start where it is without a flood of gifts", s)
        # 9. the phone: the Merker app's tabs and the chip (the AIS card says nothing of the pennant; Jonas 07.10.2026)
        u = await pg.evaluate("""(() => { delete S.ach; S.landN = 0; S.sales = []; S.stats.kg = 0; S.boat.holdLv = 0; S.fs = {p:0, rest:0, away:0}; achState(); achCheck(true); PHONE.show(true); PHONE.open('home'); const home = document.getElementById('phView').innerText;
          PHONE.open('merker'); const wk = document.getElementById('phView').innerText; PHONE.dact('merker', 'sub', {s:'merker'}); PHONE.render(); const lg = document.getElementById('phView').innerText;
          PHONE.dact('merker', 'sub', {s:'tatover'}); PHONE.render(); const tat = document.getElementById('phView').innerText; PHONE.show(false);
          const card = aisInfo({id:'pX', name:'Fjordbris', player:true, vtype:'snekke', liv:'h:gul;p:2', user:'Kystjenta', fs:40000, v:0, hd:0, st:'port', p:S.boat.pos});
          return {home:home.slice(0, 400), wk:wk.slice(0, 4000), lg:lg.slice(0, 2000), tat:tat.slice(0, 200), pen:!/Vimpel|ach-pen/.test(card)}; })()""")
        check('Første uke:' in u['home'] and 'Kapittel 1' in u['wk'] and 'Fars båt' in u['wk'] and 'Åpnes når fem av sju' in u['wk'] and 'Fartstid' in u['lg'] and 'Levert i alt' in u['lg'] and 'Tatoveringer' in u['tat'] and u['pen'],
              "the phone: the home chip counts the week, the Merker app has the chapters (the next one locked), the badges with the sea time, and the tattoos; the AIS card does not mention the pennant",
              {'chip': 'Første uke:' in u['home'], 'k1': 'Kapittel 1' in u['wk'], 'fars': 'Fars båt' in u['wk'], 'lock': 'Åpnes når fem av sju' in u['wk'], 'fs': 'Fartstid' in u['lg'], 'tonn': 'Levert i alt' in u['lg'], 'tat': 'Tatoveringer' in u['tat'], 'pen': u['pen'], 'wk': u['wk'][-300:]})
        # 10. the banner for a milestone, which takes no taps
        b = await pg.evaluate("""(async () => { ACHQ.length = 0; ACHQ_ON = false; achShow([{a:achOf('fish'), g:{t:['Mottaket gir deg 100 kg is.', 'x'], tier:1}}]); await new Promise(r => setTimeout(r, 300));
          const el = document.getElementById('achPop'); return {on:!!el && el.classList.contains('on'), txt:el ? el.innerText : '', pe:el ? getComputedStyle(el).pointerEvents : ''}; })()""")
        check(b['on'] and 'Første fisk over ripa' in b['txt'] and '100 kg is' in b['txt'] and b['pe'] == 'none', 'a milestone shows as a banner with its gift, and the game goes on under it', b)
        check(errs == [], 'sidefeil', errs)
        await br.close()

asyncio.run(main())
