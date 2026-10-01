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
