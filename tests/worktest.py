"""Work aboard (core/13-work.js): stations, chains and the speed of the people on them. Prints OK/FEIL lines."""
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
          const A = hand(2), B = hand(4); S.crew = [A, B]; S.me = S.cur; S.myJob = null; A.job = null; B.job = null;
          // fishing with the default chains: with fish in the tub the first hand guts, the rest fish; without, everyone fishes
          sea('fishing'); b.fishUntil = S.t + 600; R.fishEmpty = workAssign().map(p => p.st);
          addCatch('torsk', 30, null, true); R.fishTub = workAssign().map(p => p.st);
          // gutting goes at 5 kg a minute times the gutter's own skill
          const H = S.t / 60, hs = hsAt(b.pos, H), e = crewEff(A, H, hs, 'sloy'), g0 = S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0); deckMinute();
          R.gutRate = [+(S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0) - g0).toFixed(2), +(5 * e).toFixed(2)];
          // the effort counts only those at the rail
          S.hold = []; const eAll = fishEffort(); addCatch('torsk', 30, null, true); const eTub = fishEffort(); R.effort = [+eAll.toFixed(2), +eTub.toFixed(2)];
          // All fish: nobody leaves the rail, so the tub fills up and stops the fishing
          jobPreset('fisk'); R.allFish = workAssign().map(p => p.st); addCatch('torsk', tubCap(), null, true); step(); R.allFishStop = {stop:b.deckStop, on:workAssign().map(p => p.st)};
          jobPreset('en'); R.reset = [A.job, B.job, S.myJob];
          // under way you steer and both hands work the deck
          sea('sailing'); S.plan = {wps:[{x:g.x + 3, y:g.y, port:null, fish:0}], idx:0, speed:8, returning:false}; addCatch('sei', 40, null, true); R.sailing = workAssign().map(p => p.st);
          // without you the best seaman takes the helm, though nobody has it in the chain
          S.me = 'nobody'; R.helm = workAssign().filter(p => p.st === 'ror').map(p => p.c.attr.sjo); S.me = S.cur; S.plan = null;
          // hauling: you and the second hand haul, the first guts; nobody with hauling in the chain still leaves someone hauling
          sea('fishing'); b.gop = {op:'haul', kind:'teine', n:10, done:0, prog:0, a:{...g}, b:{x:g.x + 0.2, y:g.y}}; addCatch('torsk', 30, null, true); R.haul = workAssign().map(p => p.st);
          B.job = ['pause']; const u0 = gopUnitMin(b.gop, H, hs); B.job = ['sort', 'fiske']; R.sort = workAssign().map(p => p.st); const u1 = gopUnitMin(b.gop, H, hs);
          R.sortFaster = [+u0.toFixed(2), +u1.toFixed(2)];
          S.myJob = ['fiske']; A.job = ['fiske']; B.job = ['fiske']; R.forced = workAssign().filter(p => p.st === 'haling').length;
          S.myJob = null; A.job = null; B.job = null;
          // aground nobody works; in port everyone works the deck
          sea('aground'); addCatch('sei', 10, null, true); R.aground = deckHands();
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; R.port = deckHands();
          // the station each person is on is kept on them every minute
          sea('fishing'); b.fishUntil = S.t + 600; addCatch('torsk', 30, null, true); step(); R.kept = [S.mySt, A.st, B.st, !!(A.wk && A.wk.sloy)];
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['fishEmpty'] == ['fiske', 'fiske', 'fiske'] and r['fishTub'] == ['fiske', 'sloy', 'fiske']), 'default chains: everyone fishes; with fish in the tub the first hand guts')
        print(ok(abs(r['gutRate'][0] - r['gutRate'][1]) < 0.05), 'gutting goes at 5 kg a minute times the gutter\'s skill')
        print(ok(r['effort'][1] < r['effort'][0]), 'the hand gutting is not at the rail: less fishing effort')
        print(ok(r['allFish'] == ['fiske', 'fiske', 'fiske'] and r['allFishStop']['stop'] and r['allFishStop']['on'].count('sloy') == 3), 'All fish: everyone at the rail until the tub is full, then all gut')
        print(ok(r['reset'] == [None, None, None]), 'One on deck puts everyone back on the default chain')
        print(ok(r['sailing'] == ['ror', 'sloy', 'sloy'] and r['helm'] == [4]), 'under way you steer and the hands gut; without you the best seaman steers')
        print(ok(r['haul'] == ['haling', 'sloy', 'haling'] and r['sort'] == ['haling', 'sloy', 'sort'] and r['sortFaster'][1] < r['sortFaster'][0] and r['forced'] >= 1), 'hauling follows the chains; a crab sorter spares the haulers; someone always hauls')
        print(ok(r['aground'] == 0 and r['port'] == 3), 'aground nobody works; at the quay everyone works the deck')
        print(ok(r['kept'][:3] == ['fiske', 'sloy', 'fiske'] and r['kept'][3]), 'the station is kept on each person, with minutes per station')
        # learning, meals, the rest rule and the crew's lines (core/14-crewlife.js)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p;
          const hand = (age, kokk) => { const c = Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:['stolt'], known:[true, true], age}); c.gear.sloy = 2; if (kokk) c.attr.kokk = kokk; return c; };
          // learning: 20 hours of gutting for a 19-year-old and a 55-year-old; and the young one again, unhappy
          const y = hand(19), o = hand(55), u = hand(19); u.morale = 20;
          for (const c of [y, o, u]) for (let h = 0; h < 20; h++){ c.wk = {sloy:60}; learnHour(c); }
          R.learn = [y, o, u].map(c => +(c.gear.sloy - 2).toFixed(3));
          // meals: a good cook on a break makes dinner six hours out; with no cook it is bread an hour after it was due
          b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; S.hold = []; S.plan = null; S.meal = null; S.me = S.cur; S.myJob = null;
          const ck = hand(40, 4); S.crew = [ck]; const t0 = S.t; for (let i = 0; i < 400 && !(S.meal && S.meal.hist.length); i++) step();
          R.goodMeal = {q:S.meal.hist[0], after:Math.round((S.t - t0) / 60 * 10) / 10, by:S.meal.last && S.meal.last.by === ck.id};
          const nc = hand(40, 2); S.crew = [nc]; S.meal = null; const t1 = S.t; for (let i = 0; i < 500 && !(S.meal && S.meal.hist.length); i++) step();
          R.bread = {q:S.meal.hist[0], after:Math.round((S.t - t1) / 60 * 10) / 10};
          // the food steers the mood: the same hand, good food against bad, ten hours at sea
          b.status = 'sailing'; S.plan = {wps:[{x:g.x + 30, y:g.y, port:null, fish:0}], idx:0, speed:2, returning:false};
          const mood = hist => { const c = hand(40); c.morale = 60; S.crew = [c]; S.meal = {due:S.t + 9999, cook:null, hist}; for (let h = 0; h < 10; h++) crewTick(S.t / 60 + h); return c.morale; };
          R.mood = [mood([5, 5, 5, 5]), mood([1, 1, 1, 1])].map(v => Math.round(v * 10) / 10);
          // the rest rule: a skiff trip of 15 hours breaks the 14-hour rule; a night at the quay puts it right
          const rr = hand(30); S.crew = [rr]; S.restWarn = -1e9; const m0 = S.msgs.length; R.leftAtStart = restLeft(rr);
          for (let h = 0; h < 15; h++){ rr.wk = {sloy:50}; crewTick(S.t / 60 + h); }
          R.broken = restCheck(rr.rest); R.warned = S.msgs.slice(m0).some(m => /hviletidsreglene/.test(m.no) && /14 timer/.test(m.no)); R.fat = Math.round(rr.fatigue);
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.plan = null; for (let h = 0; h < 10; h++){ rr.wk = {}; crewTick(S.t / 60 + h); }
          R.afterNight = restCheck(rr.rest);
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
        print(ok(r['leftAtStart'] >= 14 and r['broken'] == 'gap' and r['warned'] and r['afterNight'] is None), 'a 15-hour trip breaks the 14-hour rule with a message naming it; a night at the quay puts it right')
        print(ok(r['said'] >= 3 and r['minGap'] >= 15 and r['kept'] >= 1), 'the crew talks during a day at sea, not in bursts, and each keeps their last lines')

        # your energy (core/15-energy.js): a day at sea empties it, eight hours at the quay fill it; at 0 you sleep for eight hours
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat, g = GROUNDS[2].p; S.me = S.cur; S.sleep = null; S.myJob = null;
          const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:['stolt'], known:[true, true]});
          const sea = st => { b.status = st; b.port = null; b.pos = {...g}; b.gop = null; b.deckStop = false; S.hold = []; S.plan = null; b.rig = 'juksa'; b.gear = true; b.drift = 0; };
          sea('idle'); S.crew = []; S.energy = 100; for (let i = 0; i < 60; i++) step(); R.seaHour = +(100 - S.energy).toFixed(2);
          b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.energy = 50; for (let i = 0; i < 60; i++) step(); R.quayHour = +(S.energy - 50).toFixed(2);
          // at 25 % your work goes slower
          sea('idle'); S.energy = 25.02; S.enWarn = false; step(); step(); R.warn = !!S.enWarn; addCatch('torsk', 10, null, true); R.slow = workTeam('sloy', 'sloy').sum;
          // alone at 0: asleep, the jig stops and the boat drifts; the screen goes black with a countdown
          sea('fishing'); b.fishUntil = S.t + 600; S.energy = 0.01; step(); R.asleep = asleep(); R.alone = !!(S.sleep && S.sleep.alone); const p0 = {...b.pos};
          for (let i = 0; i < 60; i++) step(); R.caught = holdTotal(); R.drift = Math.round(dist(p0, b.pos) * 1000); R.st = b.status;
          energyUi(); R.black = !document.getElementById('sleep').hidden; R.count = document.getElementById('slTime').textContent;
          R.work = workAssign().length; for (let i = 0; i < 430 && asleep(); i++) step(); R.woke = {asleep:asleep(), e:Math.round(S.energy)}; energyUi(); R.blackGone = document.getElementById('sleep').hidden;
          // with crew aboard the trip goes on: the best seaman takes the helm
          sea('sailing'); const A = hand(), B = hand(); A.attr.sjo = 2; B.attr.sjo = 4.5; S.crew = [A, B]; S.plan = {wps:[{x:g.x + 8, y:g.y, port:null, fish:0}], idx:0, speed:6, returning:false};
          S.energy = 0.01; S.sleep = null; step(); const q0 = {...b.pos}; for (let i = 0; i < 30; i++) step(); R.crewTrip = {asleep:asleep(), moved:Math.round(dist(q0, b.pos) * 1000), st:b.status, helm:workAssign().filter(p => p.st === 'ror').map(p => p.c.attr.sjo)};
          S.sleep = null; S.energy = 5; energyUi(); R.vign = +document.getElementById('vign').style.opacity; S.energy = 100; energyUi(); R.vignOff = +document.getElementById('vign').style.opacity;
          S.plan = null; return R; })()""")
        print('energy:', json.dumps(r, ensure_ascii=False))
        print(ok(abs(r['seaHour'] - 100 / 24) < 0.02 and abs(r['quayHour'] - 12.5) < 0.05), 'energy: −100/24 an hour at sea, +100/8 at the quay')
        print(ok(r['warn'] and abs(r['slow'] - 0.75) < 1e-6), 'at 25 % you are warned and work at three quarters of your pace')
        print(ok(r['asleep'] and r['alone'] and r['caught'] == 0 and (r['drift'] > 5 or r['st'] == 'aground') and r['work'] == 0), 'alone at 0 % you sleep: no fishing, and the boat drifts with the wind (or grounds)')
        print(ok(r['black'] and 'om' in r['count'] and not r['woke']['asleep'] and r['woke']['e'] == 60 and r['blackGone']), 'asleep the screen is black with a countdown; after eight hours you wake with 60 %')
        print(ok(r['crewTrip']['asleep'] and r['crewTrip']['moved'] > 100 and r['crewTrip']['st'] == 'sailing' and len(r['crewTrip']['helm']) == 1 and r['crewTrip']['helm'][0] >= 4.5), 'with crew the trip goes on while you sleep, the best seaman at the helm')
        print(ok(r['vign'] > 0.4 and r['vignOff'] == 0), 'under 15 % the edges of the screen darken')

        # the Arbeid page: the button shows with crew aboard, a chain is built by tapping, presets and the person card
        for vw, vh, tag in ((1100, 800, 'liggende'), (800, 1180, 'staende')):
            await pg.set_viewport_size({'width':vw, 'height':vh})
            u = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.gop = null; S.hold = []; S.plan = null;
              const c0 = S.crew; S.crew = []; DOCK.render(); R.noCrew = !document.querySelector('#dock [data-dk=arbeid]'); S.crew = c0; DOCK.render();
              R.btn = !!document.querySelector('#dock [data-dk=arbeid]'); DOCK.open('arbeid'); const dr = () => document.getElementById('drawerBody');
              R.rows = dr().querySelectorAll('.wk-p').length; R.flow = [...dr().querySelectorAll('.wk-flow:not(.side) .wk-st b')].map(e => e.textContent);
              const tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
              const B = S.crew[1]; tap('[data-pa=wk-edit][data-id="' + B.id + '"]'); R.picks = dr().querySelectorAll('.wk-pick button').length;
              tap('[data-pa=wk-add][data-k=is]'); tap('[data-pa=wk-add][data-k=sloy]'); tap('[data-pa=wk-add][data-k=fiske]'); tap('[data-pa=wk-add][data-k=sloy]'); tap('[data-pa=wk-add][data-k=sloy]'); tap('[data-pa=wk-done]');
              R.chain = B.job; R.chips = [...dr().querySelectorAll('.wk-p')][2].querySelectorAll('.wk-chip').length;
              tap('[data-pa=wk-pre][data-k=fisk]'); R.preset = S.crew.map(c => c.job && c.job[0]);
              tap('[data-pa=wk-pre][data-k=en]'); R.back = S.crew.map(c => c.job);
              tap('[data-pa=wk-card][data-id="' + S.crew[0].id + '"]'); R.card = dr().querySelectorAll('.wk-card .wk-sk span.wk-v').length; tap('[data-pa=wk-card][data-id="' + S.crew[0].id + '"]'); R.cardShut = !dr().querySelector('.wk-card');
              const W = dr().getBoundingClientRect(); R.overflow = dr().scrollWidth > dr().clientWidth + 1; R.small = [...dr().querySelectorAll('button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43).map(e => e.textContent.slice(0, 20));
              return R; })()""")
            print(tag, json.dumps(u, ensure_ascii=False))
            await pg.screenshot(path=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'work_' + tag + '.png'))
            print(ok(u['noCrew'] and u['btn'] and u['rows'] == 3 and u['flow'] == ['Ror', 'Fiske', 'Sløying', 'Ising']), tag + ': the Arbeid button shows only with crew; the page has the flow for the rig and a row each')
            print(ok(u['picks'] == 7 and u['chain'] == ['is', 'fiske', 'sloy'] and u['chips'] == 3), tag + ': a chain is built by tapping the stations in order, and a second tap takes one out')
            print(ok(u['preset'] == ['fiske', 'fiske'] and u['back'] == [None, None] and u['card'] == 12 and u['cardShut']), tag + ': presets set and reset the chains; the person card shows skills, fatigue and morale, and closes on a second tap')
            print(ok(not u['overflow'] and not u['small']), tag + ': no sideways scroll, and every button is at least 44 px', u['small'])
            await pg.evaluate("DOCK.close()")
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
