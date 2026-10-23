"""Work aboard (core/13-work.js): stations, how the crew share them by themselves (Jonas 23.10.2026), the mate, and the speed of the
people on them. Prints OK/FEIL lines."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p; S.tut = 0; S.settings.autoOn = false; S.settings.gut = true; S.settings.ice = true;
          const hand = (sjo) => { const c = Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]}); if (sjo) c.attr.sjo = sjo; return c; };
          const at = () => workAssign().map(p => (p.c ? p.c.name.split(' ')[0] : 'me') + ':' + p.st);
          const sea = (st) => { b.status = st; b.port = null; b.pos = {...g}; b.gop = null; b.deckStop = false; b.ice = 300; S.hold = []; b.rig = 'juksa'; b.gear = true; };
          const A = hand(2), B = hand(4); S.crew = [A, B]; S.me = S.cur; A.st = B.st = null; S.mySt = null;
          // fishing: with nothing in the tub everyone jigs; with fish in it one guts and the others jig
          sea('fishing'); b.fishUntil = S.t + 600; R.fishEmpty = workAssign().map(p => p.st);
          addCatch('torsk', 30, null, true); const W1 = workAssign(); R.fishTub = W1.map(p => p.st);
          // gutting goes at 5 kg a minute times the gutter's own skill
          const H = S.t / 60, hs = hsAt(b.pos, H), gp = W1.find(p => p.st === 'sloy'), e = gp ? (gp.c ? crewEff(gp.c, H, hs, 'sloy') : meEff()) : 0, g0 = S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0); deckMinute();
          R.gutRate = [+(S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0) - g0).toFixed(2), +(5 * e).toFixed(2)];
          // the effort counts only those at the rail
          S.hold = []; const eAll = fishEffort(); addCatch('torsk', 30, null, true); const eTub = fishEffort(); R.effort = [+eAll.toFixed(2), +eTub.toFixed(2)];
          // the tub full stops the fishing; then the deck takes as many as it has room for (BOAT.stations.table at the gutting table, one
          // packing and icing: Jonas 20.10.2026, #75), and the rest rest
          addCatch('torsk', tubCap(), null, true); step(); R.allFishStop = {stop:b.deckStop, on:workAssign().map(p => p.st)}; R.table = BOAT.stations.table;
          // a chain set up before becomes what the person is used to (c.hab), and the chain is gone
          A.job = ['is', 'sloy']; step(); R.seed = [A.job === undefined, Math.round((A.hab || {}).is || 0) >= 599, Math.round((A.hab || {}).sloy || 0) >= 479, S.myJob === undefined];
          // under way you steer and both hands work the deck
          sea('sailing'); S.plan = {wps:[{x:g.x + 3, y:g.y, port:null, fish:0}], idx:0, speed:8, returning:false}; addCatch('sei', 40, null, true); R.sailing = workAssign().map(p => p.st);
          // without you the best seaman takes the helm; with a mate, the mate
          S.me = 'nobody'; R.helm = workAssign().filter(p => p.st === 'ror').map(p => p.c.attr.sjo); setMate(A.id); R.mate = workAssign().filter(p => p.st === 'ror').map(p => p.c === A); setMate(null); S.me = S.cur; S.plan = null;
          // hauling pots: someone hauls, someone sorts the crab and someone guts the bycatch (the hold emptied first: gutted fish left
          // from the step before would rightly send the third to the ice); a crab sorter spares the haulers
          sea('fishing'); S.hold = []; b.gop = {op:'haul', kind:'teine', n:10, done:0, prog:0, a:{...g}, b:{x:g.x + 0.2, y:g.y}}; addCatch('torsk', 30, null, true); R.haul = workAssign().map(p => p.st);
          const u1 = gopUnitMin(b.gop, H, hs); const C0 = S.crew; S.crew = []; const u0 = gopUnitMin(b.gop, H, hs); S.crew = C0; R.sortFaster = [+u0.toFixed(2), +u1.toFixed(2)];
          // worn out, someone still hauls
          A.fatigue = B.fatigue = 99; S.energy = 5; R.forced = workAssign().filter(p => p.st === 'haling').length; A.fatigue = B.fatigue = 10; S.energy = 100;
          // aground nobody works; in port everyone works the deck
          sea('aground'); addCatch('sei', 10, null, true); R.aground = deckHands();
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; R.port = deckHands();
          // the station each person is on is kept on them every minute, with minutes per station and what they are used to
          sea('fishing'); b.fishUntil = S.t + 600; addCatch('torsk', 30, null, true); step(); const gt = [S.mySt, A.st, B.st]; R.kept = {st:gt, wk:[A, B].some(c => c.st === 'sloy' && c.wk && c.wk.sloy) || S.mySt === 'sloy', why:[A.why, B.why]};
          // the same answer every time within a minute, and the deck does not reshuffle every minute
          R.same = JSON.stringify(workAssign().map(p => p.st)) === JSON.stringify(workAssign().map(p => p.st));
          const seq = []; for (let i = 0; i < 40; i++){ step(); seq.push(workAssign().map(p => p.st).join(',')); } let sw = 0; for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) sw++; R.switches = sw;
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['fishEmpty'] == ['fiske', 'fiske', 'fiske'] and r['fishTub'].count('sloy') == 1 and r['fishTub'].count('fiske') == 2), 'nobody tells them: everyone jigs; with fish in the tub one goes to gut and the others jig', r['fishTub'])
        print(ok(abs(r['gutRate'][0] - r['gutRate'][1]) < 0.05), 'gutting goes at 5 kg a minute times the gutter\'s skill')
        print(ok(r['effort'][1] < r['effort'][0]), 'the one gutting is not at the rail: less fishing effort')
        print(ok(r['allFishStop']['stop'] and r['allFishStop']['on'].count('sloy') == min(3, r['table']) and r['allFishStop']['on'].count('is') == (1 if r['table'] < 3 else 0)), 'a full tub stops the fishing, and the table and the tub take as many as they have room for', r['allFishStop'])
        print(ok(all(r['seed'])), 'a chain from before becomes what the person is used to, and the chains are gone', r['seed'])
        print(ok(r['sailing'] == (['ror', 'sloy', 'sloy'] if r['table'] >= 2 else ['ror', 'sloy', 'is']) or (r['sailing'][0] == 'ror' and sorted(r['sailing'][1:]) == ['is', 'sloy'])), 'under way you steer and the hands gut and ice', r['sailing'])
        print(ok(r['helm'] == [4] and r['mate'] == [True]), 'without you the best seaman steers; with a mate, the mate', r['helm'], r['mate'])
        print(ok(r['haul'].count('haling') >= 1 and 'sort' in r['haul'] and 'sloy' in r['haul'] and r['sortFaster'][1] < r['sortFaster'][0] and r['forced'] >= 1), 'on pots one hauls, one sorts the crab and one guts; a sorter spares the haulers; worn out, someone still hauls', r['haul'], r['sortFaster'])
        print(ok(r['aground'] == 0 and r['port'] == min(3, r['table'] + 1)), 'aground nobody works; at the quay the deck takes as many as the table and the tub have room for', r['port'])
        print(ok('sloy' in r['kept']['st'] and r['kept']['wk'] and all(r['kept']['why'])), 'the station is kept on each person with why, and minutes per station', r['kept'])
        print(ok(r['same'] and r['switches'] <= 8), 'the same answer every time within a minute, and no reshuffle every minute (changes in 40 minutes)', r['switches'])
        # the stations' places (Jonas 20.10.2026, tilbakemelding #75): on the new sjark with you and three hands one hauls the line while one
        # bleeds and two gut, and three more at the hauler do not haul faster than one; on a net one picks beside the one hauling; the crew's
        # jobs go at the pace of those on them: three baiting three tubs are done sooner than one alone, and the time left follows them
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p, T0 = b.type; b.type = 'sjarkny'; applyVessel(); S.equip.linehaler = S.equip.garnhaler = true;
          const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]}), H = S.t / 60;
          const haul = (kind, crew) => { S.crew = []; for (let i = 0; i < crew; i++) S.crew.push(hand()); S.me = S.cur; S.mySt = null; b.status = 'fishing'; b.port = null; b.pos = {...g}; b.deckStop = false; b.ice = 300;
            S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:30, n:9, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}];
            b.gop = {op:'haul', kind, n:4, done:0, prog:0, sub:0, sl:1, hooksPer:kind === 'line' ? 600 : 0, a:{...g}, b:{x:g.x + 0.2, y:g.y}};
            const A = workAssign(), o = {st:A.map(p => p.st).join(','), n:k => A.filter(p => p.st === k).length, roles:A.filter(p => p.role).map(p => p.role).join(','), haul:A.filter(p => p.st === 'haling').length, tF:workTeam('haling', 'line').eff}; o.min = gopUnitMin(b.gop, H, 0) * o.tF; delete o.n; b.gop = null; return o; };
          R.line4 = haul('line', 3); R.line1 = haul('line', 0); R.net4 = haul('garn', 3);
          // baiting three tubs in port: you alone, then you and two hands
          const bait = crew => { S.crew = []; for (let i = 0; i < crew; i++){ const c = hand(); c.gear.line = 3; S.crew.push(c); } b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.hold = []; S.jobs = [];
            const pg = S.pgear; pg.lines.hyse.n = 3; pg.lines.hyse.baited = 0; baitOf(pg).makrell = 100; egnSelf('hyse', 3); const j = S.jobs.find(x => x.kind === 'egn'), t0 = S.t; let on = 0, left0 = null;
            for (let i = 0; i < 2000 && S.jobs.includes(j); i++){ step(); if (i === 1){ on = workAssign().filter(p => p.st === 'egn').length; left0 = j.until - S.t; } }
            return {min:S.t - t0, on, left0, done:!S.jobs.includes(j) && pg.lines.hyse.baited >= 3}; };
          R.bait1 = bait(0); R.bait3 = bait(2);
          S.crew = []; S.jobs = []; b.type = T0; applyVessel(); return R; })()""")
        print('places:', json.dumps(r, ensure_ascii=False))
        L4 = r['line4']['st'].split(',')
        print(ok(L4.count('haling') == 1 and L4.count('blogg') == 1 and L4.count('sloy') + L4.count('is') == 2 and L4.count('sloy') >= 1 and r['line4']['haul'] == 1 and abs(r['line4']['min'] - r['line1']['min']) < 0.5), 'one hauls the line while one bleeds and the others gut and ice, and the hauler goes as fast as with one aboard (by the hauler\'s own pace)', r['line4'], r['line1'])
        print(ok(r['net4']['roles'] == 'haler,plukk' and 'blogg' in r['net4']['st']), 'on a net one hauls and one picks the fish out, and a third bleeds', r['net4'])
        print(ok(r['bait1']['done'] and r['bait3']['done'] and r['bait3']['on'] == 3 and r['bait3']['min'] < r['bait1']['min'] * 0.6 and abs(r['bait3']['left0'] - r['bait3']['min']) <= 3), 'three baiting three tubs together are done sooner than one alone, and the time left shown is the time it takes', r['bait1'], r['bait3'])
        # learning, meals, the rest rule and the crew's lines (core/14-crewlife.js)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p;
          const hand = (age, kokk) => { const c = Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:['stolt'], known:[true, true], age}); c.gear.sloy = 2; if (kokk) c.attr.kokk = kokk; return c; };
          // learning: 20 hours of gutting for a 19-year-old and a 55-year-old; and the young one again, unhappy
          const y = hand(19), o = hand(55), u = hand(19); u.morale = 20;
          for (const c of [y, o, u]) for (let h = 0; h < 20; h++){ c.wk = {sloy:60}; learnHour(c); }
          R.learn = [y, o, u].map(c => +(c.gear.sloy - 2).toFixed(3));
          // meals: a good cook on a break makes dinner six hours out; with no cook it is bread an hour after it was due
          b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; S.hold = []; S.plan = null; S.meal = null; S.me = S.cur; S.myJob = null;
          const T0 = S.boat.type; S.boat.type = 'sjark'; applyVessel();   // (a hotplate aboard: on the open boats it is a packed lunch and a flask, 14-crewlife.js)
          const ck = hand(40, 4); S.crew = [ck]; const t0 = S.t; for (let i = 0; i < 400 && !(S.meal && S.meal.hist.length); i++) step();
          R.goodMeal = {q:S.meal.hist[0], after:Math.round((S.t - t0) / 60 * 10) / 10, by:S.meal.last && S.meal.last.by === ck.id};
          const nc = hand(40, 2); S.crew = [nc]; S.meal = null; const t1 = S.t; for (let i = 0; i < 500 && !(S.meal && S.meal.hist.length); i++) step();
          R.bread = {q:S.meal.hist[0], after:Math.round((S.t - t1) / 60 * 10) / 10}; S.boat.type = T0; applyVessel();
          // the food steers the mood: the same hand, good food against bad, ten hours at sea
          b.status = 'sailing'; S.plan = {wps:[{x:g.x + 30, y:g.y, port:null, fish:0}], idx:0, speed:2, returning:false};
          const mood = hist => { const c = hand(40); c.morale = 60; S.crew = [c]; S.meal = {due:S.t + 9999, cook:null, hist}; for (let h = 0; h < 10; h++) crewTick(S.t / 60 + h); return c.morale; };
          R.mood = [mood([5, 5, 5, 5]), mood([1, 1, 1, 1])].map(v => Math.round(v * 10) / 10);
          // the crew talks: a day at sea gives some lines, never two periodic ones within an hour and a half
          S.energy = 100; b.status = 'idle'; b.port = null; b.pos = {...g}; S.crew = [hand(30), hand(45)]; S.crew[0].traits = ['spokefugl']; S.sayT = null; const l0 = S.log.length;
          for (let i = 0; i < 24 * 60; i++) step();
          const said = S.log.slice(l0).filter(e => /: «/.test(e.no)); R.said = said.length; let minGap = 1e9; for (let i = 1; i < said.length; i++) minGap = Math.min(minGap, said[i].t - said[i - 1].t); R.minGap = minGap;
          R.kept = S.crew.reduce((a, c) => a + (c.said || []).length, 0);
          return R; })()""")
        print('life:', json.dumps(r, ensure_ascii=False))
        print(ok(r['learn'][0] > 1.5 * r['learn'][1] and r['learn'][2] < 0.3 * r['learn'][0]), 'a 19-year-old learns gutting much faster than a 55-year-old, and an unhappy one hardly learns')
        print(ok(r['goodMeal']['q'] == 4 and 5.9 <= r['goodMeal']['after'] <= 6.7 and r['goodMeal']['by']), 'a cook of 4 on a break makes a meal of 4 about six hours out')
        print(ok(r['bread']['q'] == 1 and 6.9 <= r['bread']['after'] <= 7.2), 'with nobody who can cook it is dry bread an hour after the meal was due')
        print(ok(r['mood'][0] > r['mood'][1] + 3), 'good food lifts the mood, bad food sinks it')
        print(ok(r['said'] >= 3 and r['minGap'] >= 15 and r['kept'] >= 1), 'the crew talks during a day at sea, not in bursts, and each keeps their last lines')

        # effort that varies (hunger, the sea, the mood) and samhold (core/04-crew.js crewDrive, crewEffort, crewTeam, teamHour, teamLine)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p, H = () => S.t / 60;
          const hand = (sjo, tr) => { const c = Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:tr || [], known:[true, true], grudge:{}}); c.cpen = 0; if (sjo) c.attr.sjo = sjo; return c; };
          b.status = 'fishing'; b.port = null; b.pos = {...g}; b.gop = null; b.fishUntil = S.t + 1e5; S.hold = []; S.plan = null; S.cevt = null; S.lang = 'no';
          const A = hand(2, ['omsorgsfull']), B = hand(4.5, ['spokefugl']); S.crew = [A, B]; S.team = null;
          // a meal an hour late takes some of the effort, and the words say so
          S.meal = {due:S.t + 120, cook:null, hist:[3, 3, 3, 3]}; const e0 = crewEff(A, H(), 0.5); S.meal.due = S.t - 60; const e1 = crewEff(A, H(), 0.5), cp = window.coldPen; window.coldPen = () => 0; const w1 = crewEffort(A, H(), 0.5); window.coldPen = cp; S.meal.due = S.t + 120;   // (the cold kept out of the words here: on a winter day it is the bigger drag)
          R.hungry = [+(e1 / e0).toFixed(3), w1.why, w1.text];
          // a heavy sea: the seaman minds it less
          R.sea = [A, B].map(c => +(crewEff(c, H(), 3) / crewEff(c, H(), 0.5)).toFixed(3));
          // the mood in a smooth step
          A.morale = 20; const m20 = crewEff(A, H(), 0.5); A.morale = 85; const m85 = crewEff(A, H(), 0.5); A.morale = 62; R.mood = +(m85 / m20).toFixed(3);
          // samhold: two who get on, good food, sixty hours at sea together
          S.meal.hist = [4, 4, 5, 4]; A.morale = B.morale = 70; const v0 = crewTeam().v; for (let h = 0; h < 60; h++) teamHour(H() + h, [A, B], 0.5, foodScore());
          R.team = [Math.round(v0), Math.round(crewTeam().v), teamLine().text, crewTeam().why];
          // what it does: more effort, and readier to pitch in than to rest
          S.team.v = 80; const eh = crewEff(A, H(), 0.5), rh = restScore({c:A}); S.team.v = 50; const em = crewEff(A, H(), 0.5), rm = restScore({c:A}); S.team.v = R.team[1];
          R.effect = [+(eh / em).toFixed(3), +(rm - rh).toFixed(3)];
          // a new face takes it some of the way back
          const C = hand(3); S.crew.push(C); const vb = crewTeam().v; teamHour(H(), [A, B, C], 0.5, foodScore()); R.fresh = [Math.round(vb), Math.round(crewTeam().v), crewTeam().nw === S.t];
          // a quarrel left hanging pulls it down, and the line says why
          S.cevt = {type:'pair', a:A.id, b:C.id, topic:'kaffe', t0:S.t}; const vq = crewTeam().v; for (let h = 0; h < 30; h++) teamHour(H() + h, [A, B, C], 0.5, foodScore());
          R.quarrel = [Math.round(vq), Math.round(crewTeam().v), teamLine().text]; S.cevt = null;
          return R; })()""")
        print('drive:', json.dumps(r, ensure_ascii=False))
        print(ok(0.9 <= r['hungry'][0] <= 0.94 and r['hungry'][1] == 'hungry' and 'sulten' in r['hungry'][2]), 'a meal an hour late takes about 8 % of the effort, and the words say they are hungry', r['hungry'])
        print(ok(r['sea'][0] < r['sea'][1] < 1), 'a heavy sea slows them, the seaman less', r['sea'])
        print(ok(r['mood'] > 1.2), 'a glad hand works a fifth faster than a sour one', r['mood'])
        print(ok(r['team'][1] >= r['team'][0] + 8 and r['team'][2].startswith(('Godt', 'Greit')) and ':' in r['team'][2]), 'two who get on, with good food and days at sea together, pull together, and the line says why', r['team'])
        print(ok(r['effect'][0] > 1.015 and r['effect'][1] > 0.04), 'a crew that pulls together works harder and rests less', r['effect'])
        print(ok(r['fresh'][1] < r['fresh'][0] and r['fresh'][2]), 'a new face takes the samhold some of the way back to the start', r['fresh'])
        print(ok(r['quarrel'][1] < r['quarrel'][0] - 5 and 'krangel' in r['quarrel'][2]), 'a quarrel left hanging pulls it down, and the line says so', r['quarrel'])

        # your energy (core/15-energy.js): a day at sea empties it, eight hours at the quay fill it; at 0 you sleep for eight hours
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p; S.me = S.cur; S.sleep = null; S.myJob = null;
          const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:['stolt'], known:[true, true]});
          const sea = st => { b.status = st; b.port = null; b.pos = {...g}; b.gop = null; b.deckStop = false; S.hold = []; S.plan = null; b.rig = 'juksa'; b.gear = true; b.drift = 0; };
          sea('idle'); S.crew = []; S.energy = 100; for (let i = 0; i < 60; i++) step(); R.seaHour = +(100 - S.energy).toFixed(2);
          // rest (15-energy.js, 05.10.2026): an open boat at a plant's quay gives none; in the naust at home eight hours to full; a boat with bunks at any quay
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.energy = 50; for (let i = 0; i < 60; i++) step(); R.openQuay = +(S.energy - 50).toFixed(2);
          R.bunks = +(restRate({status:'port', port:'husoy', type:'sjark'}) * 60).toFixed(2);
          b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; S.energy = 50; restStart(); for (let i = 0; i < 60; i++) step(); R.quayHour = +(S.energy - 50).toFixed(2); restEnd(true);
          // at 25 % your work goes slower
          sea('idle'); S.energy = 25.02; S.enWarn = false; step(); step(); R.warn = !!S.enWarn; addCatch('torsk', 10, null, true); R.slow = workTeam('sloy', 'sloy').sum;
          // alone at 0: asleep, the jig stops and the boat drifts; the screen goes black with a countdown
          sea('fishing'); b.fishUntil = S.t + 600; S.energy = 0.01; step(); R.asleep = asleep(); R.alone = !!(S.sleep && S.sleep.alone); const p0 = {...b.pos};
          for (let i = 0; i < 60; i++) step(); R.caught = holdTotal(); R.drift = Math.round(dist(p0, b.pos) * 1000); R.st = b.status;
          energyUi(); R.black = !document.getElementById('sleep').hidden; R.count = document.getElementById('slTime').textContent;
          R.work = workAssign().length; for (let i = 0; i < 430 && asleep(); i++) step(); R.woke = {asleep:asleep(), e:Math.round(S.energy)}; energyUi(); R.blackGone = document.getElementById('sleep').hidden;
          // with crew aboard the trip goes on: the best seaman takes the helm
          sea('sailing'); const A = hand(), B = hand(); A.attr.sjo = 2; B.attr.sjo = 4.5; S.crew = [A, B]; const tgt = [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({x:b.pos.x + 8 * Math.cos(k * Math.PI / 4), y:b.pos.y + 8 * Math.sin(k * Math.PI / 4)})).find(q => legClear(b.pos, q)) || {x:g.x + 8, y:g.y};   // a clear leg (the vector coast has skerries the old mask did not)
          S.plan = {wps:[{x:tgt.x, y:tgt.y, port:null, fish:0}], idx:0, speed:6, returning:false};
          S.energy = 0.01; S.sleep = null; step(); const q0 = {...b.pos}; for (let i = 0; i < 30; i++) step(); R.crewTrip = {asleep:asleep(), moved:Math.round(dist(q0, b.pos) * 1000), st:b.status, helm:workAssign().filter(p => p.st === 'ror').map(p => p.c.attr.sjo)};
          S.sleep = null; S.energy = 5; energyUi(); R.vign = +document.getElementById('vign').style.opacity; S.energy = 100; energyUi(); R.vignOff = +document.getElementById('vign').style.opacity;
          S.plan = null; return R; })()""")
        print('energy:', json.dumps(r, ensure_ascii=False))
        print(ok(abs(r['seaHour'] - 100 / 24) < 0.02 and abs(r['quayHour'] - 12.5) < 0.05 and r['openQuay'] == 0 and abs(r['bunks'] - 12.5) < 0.05), 'energy: −100/24 an hour at sea, +100/8 resting in the naust or aboard a boat with bunks, nothing in an open boat at a plant\'s quay')
        print(ok(r['warn'] and abs(r['slow'] - 0.75) < 1e-6), 'at 25 % you are warned and work at three quarters of your pace')
        print(ok(r['asleep'] and r['alone'] and r['caught'] == 0 and (r['drift'] > 5 or r['st'] == 'aground') and r['work'] == 0), 'alone at 0 % you sleep: no fishing, and the boat drifts with the wind (or grounds)')
        print(ok(r['black'] and 'om' in r['count'] and not r['woke']['asleep'] and r['woke']['e'] == 60 and r['blackGone']), 'asleep the screen is black with a countdown; after eight hours you wake with 60 %')
        print(ok(r['crewTrip']['asleep'] and r['crewTrip']['moved'] > 100 and r['crewTrip']['st'] == 'sailing' and len(r['crewTrip']['helm']) == 1 and r['crewTrip']['helm'][0] >= 4.5), 'with crew the trip goes on while you sleep, the best seaman at the helm')
        print(ok(r['vign'] > 0.4 and r['vignOff'] == 0), 'under 15 % the edges of the screen darken')

        # the Mannskap page: the button shows with crew aboard, each row with why, the mate button and the person card
        for vw, vh, tag in ((1100, 800, 'liggende'), (800, 1180, 'staende')):
            await pg.set_viewport_size({'width':vw, 'height':vh})
            u = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.gop = null; S.hold = []; S.plan = null; addCatch('torsk', 40, null, true);   // (fish to gut at the quay: someone at work)
              const c0 = S.crew; S.crew = []; DOCK.render(); R.noCrew = !document.querySelector('#dock [data-dk=arbeid]'); S.crew = c0; DOCK.render();
              R.btn = !!document.querySelector('#dock [data-dk=arbeid]'); DOCK.open('arbeid'); const dr = () => document.getElementById('drawerBody');
              R.rows = dr().querySelectorAll('.wk-p').length; R.flow = [...dr().querySelectorAll('.wk-flow:not(.side) .wk-st b')].map(e => e.textContent);
              const tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
              const B = S.crew[1]; R.noChains = !dr().querySelector('[data-pa=wk-edit], [data-pa=wk-pre], .wk-pick'); R.whyShown = [...dr().querySelectorAll('.wk-p .wk-chain .ph-note')].filter(e => e.textContent.trim()).length;
              tap('[data-pa=wk-mate][data-id="' + B.id + '"]'); R.mate = [!!B.mate, !S.crew[0].mate, ![...dr().querySelectorAll('[data-pa=wk-mate]')].some(e => e.dataset.id === B.id), (S.ops && S.ops.v === 2) ? S.ops.mate === B.id : true];
              tap('[data-pa=wk-card][data-id="' + S.crew[0].id + '"]'); R.card = dr().querySelectorAll('.wk-card .wk-sk span.wk-v').length; tap('[data-pa=wk-card][data-id="' + S.crew[0].id + '"]'); R.cardShut = !dr().querySelector('.wk-card');
              R.team = (dr().querySelector('.wk-team') || {}).textContent || ''; R.effShown = dr().querySelectorAll('.wk-eff').length; R.working = workAssign().filter(p => p.c && p.st !== 'pause').length;
              const W = dr().getBoundingClientRect(); R.overflow = dr().scrollWidth > dr().clientWidth + 1; R.small = [...dr().querySelectorAll('button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43).map(e => e.textContent.slice(0, 20));
              return R; })()""")
            print(tag, json.dumps(u, ensure_ascii=False))
            await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'work_' + tag + '.png'))
            print(ok(u['noCrew'] and u['btn'] and u['rows'] == 3 and u['flow'] == ['Ror', 'Fiske', 'Sløying', 'Ising']), tag + ': the Arbeid button shows only with crew; the page has the flow for the rig and a row each')
            print(ok(u['noChains'] and u['whyShown'] >= 2), tag + ': no chains to set up: each row says why the person does what they do', u['whyShown'])
            print(ok(all(u['mate']) and u['card'] == 12 and u['cardShut']), tag + ': Gjør til styrmann makes the mate (the plan\'s too); the person card shows skills, fatigue and morale, and closes on a second tap', u['mate'])
            print(ok(u['team'] and u['working'] >= 1 and u['effShown'] == u['working']), tag + ': the samhold line on top, and how each one at work is going in words', u['team'], u['effShown'], u['working'])
            print(ok(not u['overflow'] and not u['small']), tag + ': no sideways scroll, and every button is at least 44 px', u['small'])
            await pg.evaluate("DOCK.close()")
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
