"""The start along the whole coast (05.10.2026): the fish receivers of the register as harbours (core/06b-coastports.js), «Hvor står fars
naust?» after the letter (ui/08c-start.js), the first trip from there, the ten nearest plants in Salgslaget, and a sale at a coast plant.
Prints OK or FEIL per check."""
from _env import GAME, GAME_TUT, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        # 1. the harbours, and Salgslaget at Finnsnes
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate("""(() => { const C = PORTS.filter(q => q.coastal && q.mottak), ids = new Set(PORTS.map(q => q.id));
          const faces = C.filter(q => quayFace(q.id, 'main')).length, named = C.filter(q => q.name && q.name.length > 1).length, pf = C.map(q => q.pf);
          const merged = PORTS.filter(q => !q.coastal && q.mk).map(q => q.id), near = plantsNear(portById('finnsnes').p, 10).map(x => x.pt.name);
          PHONE.open('salg'); const rows = document.querySelectorAll('.ph-appv .ph-tbl tr.here, .ph-appv .ph-tbl tr').length;
          const txt = document.querySelector('.ph-appv').innerText;
          return {n:C.length, unique:ids.size === PORTS.length, faces, named, pfMin:Math.min(...pf), pfMax:Math.max(...pf), merged, near, nearest:txt.includes('Nærmeste mottak'), rows}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['n'] >= 150 and r['unique'] and r['faces'] == r['n'] and r['named'] == r['n']), 'the coast\'s receivers are harbours: each with a quay face and a name, every id once', r['n'])
        print(ok(0.94 <= r['pfMin'] and r['pfMax'] <= 1.06 and len(r['merged']) >= 3), 'their price factors lie within 0.94 to 1.06, and receivers at Senja\'s own harbours are merged into them', r['merged'])
        print(ok(r['nearest'] and 'Botnhamn' in r['near'] and len(r['near']) == 10), 'Salgslaget shows the ten plants nearest the boat', r['near'][:5])
        print('errors:', errs[:3]); await pg.close()

        # 2. a new game: the letter, «Hvor står fars naust?», the boat's name; a start in the north
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.set_default_timeout(120000)
        await pg.goto(GAME_TUT)
        await pg.wait_for_selector('#ltEnv', state='visible', timeout=90000); await pg.click('#ltEnv')
        await pg.wait_for_selector('#ltGo.on', timeout=60000); await pg.click('#ltGo')
        await pg.wait_for_selector('#startPick', timeout=20000)
        pick = await pg.evaluate("""(() => { const it = [...document.querySelectorAll('#stAll > .st-it.rec')], dots = document.querySelectorAll('#startPick .st-dot').length, all = document.querySelectorAll('#stAll details .st-it').length;
          const sc = [...document.querySelectorAll('#stAll > .st-it')].map(e => startInfo(portById(e.dataset.id)).score), sorted = sc.every((v, i) => !i || v <= sc[i - 1]);
          const q = document.getElementById('stQ'); q.value = 'vangs'; q.dispatchEvent(new Event('input')); const hit = [...document.querySelectorAll('#stHits .st-it')].map(e => e.dataset.id);
          q.value = ''; q.dispatchEvent(new Event('input'));
          const t = it.find(e => /Båtsfjord|Honningsvåg|Ballstad|Stamsund|Henningsvær|Myre|Andenes|Berlevåg/.test(e.textContent)) || it.find(e => e.dataset.id !== HOME0);
          t.click(); return {rec:it.length, dots, all, sorted, hit, name:t.querySelector('b').textContent.replace(/^\\d+\\. /, ''), id:t.dataset.id}; })()""")
        print(ok(pick['rec'] == 12 and pick['dots'] == 0 and pick['all'] >= 150 and pick['sorted'] and pick['hit'][:1] == ['vangshamn']), 'the start has no map: the twelve places with most to earn now first, best first, all of them by region, and a search (Vangshamn)', {k: pick[k] for k in ('rec', 'all', 'sorted', 'hit', 'name')})
        await pg.click('#stGo')
        await pg.wait_for_selector('#obGo', timeout=90000)
        st = await pg.evaluate("""(() => { const b = S.boat, pt = portById(S.home), f = S.tutStart && S.tutStart.f;
          return {home:S.home, port:b.port, st:b.status, atPort:pt && dist(b.pos, pt.p) < 0.01, f:!!f, fd:f && pt ? +dist(f.p, pt.p).toFixed(2) : null, land:S.tutStart && S.tutStart.land, center:pt ? +Math.hypot(view.cx - pt.p.x, view.cy - pt.p.y).toFixed(2) : null, startGone:!document.getElementById('startPick')}; })()""")
        print(json.dumps(st, ensure_ascii=False))
        print(ok(st['home'] == pick['id'] and st['port'] == pick['id'] and st['atPort'] and st['st'] == 'port' and st['startGone']), 'picking a place moves the new game\'s boat there, into the harbour', pick['name'])
        print(ok(st['f'] and 1 <= st['fd'] <= 6.5 and st['land'] == pick['id'] and st['center'] is not None and st['center'] < 1), 'the first trip goes to a patch of cod near there and lands at its plant; the chart is round it', st['fd'])
        # the boat has no name: the card says she goes by her registration mark until the player names her (Jonas 07.10.2026)
        nm = await pg.evaluate("({card:document.getElementById('modal').innerText, input:!!document.getElementById('obBoat'), mark:regText(regOf(S.boat)), name:S.boatName, unnamed:!!S.unnamed})")
        await pg.click('#obGo')
        await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=30000)
        print(ok(not nm['input'] and nm['unnamed'] and nm['name'] == nm['mark'] and nm['mark'] not in nm['card'] and 'registreringsmerke' not in nm['card']),   # the mark is not mentioned (Jonas 10.10.2026); the naming comes with the registration
              'the boat has no name (her mark stands in its place) and the card does not mention the mark: she is named at the registration', {k: nm[k] for k in ('mark', 'name', 'unnamed', 'input')})
        # the first trip's route step names the place, not Gisundet; then a sale at the coast plant
        tip = await pg.evaluate("""(() => { setBodyView(false); const s = TSTEPS.find(x => x.id === 'route1'); LEIA_ARM = true; const t = s.tip(); LEIA_ARM = false; return ((t && t.no) || '') + ' | ' + JSON.stringify(S.tut.f || null).slice(0, 60); })()""")
        print(ok('Gisundet' not in tip and pick['name'].split(' (')[0] in tip), 'the first trip\'s tips name the new place', tip[:90])
        sale = await pg.evaluate("""(() => { const b = S.boat; S.tut = 0; S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:120, n:30, bled:true, iced:true, hr:Math.floor(S.t / 60), fresh:100, gut:true, hook:true}];
          const c0 = S.cash; S.t = Math.floor(S.t / 1440) * 1440 + 10 * 60 + 1440; sell(); return {c0, c1:S.cash, last:S.lastSale ? S.lastSale.port : null, hold:holdTotal()}; })()""")
        print(json.dumps(sale))
        print(ok(sale['c1'] > sale['c0'] and sale['last'] == pick['id'] and sale['hold'] < 1), 'the catch sells at the coast plant', sale['c1'] - sale['c0'])
        await pg.evaluate("(() => { S.landN = 2; S.tut = 0; NAME_ASKED = false; document.getElementById('modal').hidden = true; nameNudge(true); })()")
        # the 3D view is up here, where Playwright's own waits (by animation frame) do not come round in the test machine's lite mode
        # (other cards, such as the first week's badges, wait their turn: they are put away here)
        await pg.wait_for_function("!!document.getElementById('nmBoat') || (document.getElementById('modal').hidden = true, false)", polling=1000, timeout=25000)
        await pg.evaluate("(() => { document.getElementById('nmBoat').value = 'Testbris'; document.getElementById('nmGo').click(); })()")
        ch = await pg.evaluate("({name:S.boatName, unnamed:!!S.unnamed, log:S.log.slice(-3).map(e => e.no).join(' | ')})")
        print(ok(ch['name'] == 'Testbris' and not ch['unnamed'] and 'Døpte båten «Testbris»' in ch['log']), 'without the cloud the boat is named in a dialog of its own after the second landing', ch)
        print('errors:', errs[:3]); await pg.close()

        # 3. a game from before (in Finnsnes, no home): one move along the coast, free, from Settings
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        await pg.evaluate("(() => { delete S.home; S.moved = false; PHONE.open('innst'); document.querySelector('[data-pa=move]').click(); })()")
        await pg.wait_for_selector('#startPick', timeout=20000)
        to = await pg.evaluate("(() => { const t = [...document.querySelectorAll('#startPick .st-it.rec')].find(e => e.dataset.id !== 'finnsnes'); t.click(); return t.dataset.id; })()")
        await pg.click('#stGo')
        await pg.wait_for_function("!document.getElementById('startPick')", timeout=90000)
        mv = await pg.evaluate("(() => { PHONE.open('innst'); return {port:S.boat.port, home:S.home, moved:S.moved, again:!!document.querySelector('[data-pa=move]'), log:S.log.slice(-3).map(e => e.no).join(' | ')}; })()")
        print(ok(mv['port'] == 'finnsnes' and mv['home'] == to and mv['moved'] and not mv['again'] and 'Nytt hjemsted' in mv['log']), 'a game from before chooses a new home once from Settings; the boat stays in Finnsnes (no fast travel), and the button is gone', mv)
        # 4. wherever you start (Jonas 05.10.2026): Father's naust by the plant, the tackle shop by the naust, and the first trip's patch
        # near enough that the start boat fishes and sells on the fuel she has; every 8th plant along the coast
        sv = await pg.evaluate("""(async () => { const C = PORTS.filter(q => q.coastal && q.mottak), out = [], b = S.boat, v = Math.max(3, BOAT.vmax * 0.8);
          for (let i = 0; i < C.length; i += 8){ const pt = C[i]; await mapNeed(pt.p, 7.5); S.home = pt.id; S.naust = null; S.shopN = null;
            const n = naustSite(), sh = n ? shopNear() : null, f = tutFieldNear(pt), dkm = f ? dist(f.p, pt.p) : null;
            const needL = dkm == null ? null : 2 * dkm / (v * NM) * fuelLph(v, 5) + 2 * fuelLph(0.5, 5);
            out.push({id:pt.id, name:pt.name, naust:n ? Math.round(Math.hypot(n.o[0] - pt.p.x * 1000, n.o[1] - pt.p.y * 1000)) : null,
              shop:n && sh ? Math.round(Math.hypot(sh.o[0] - n.o[0], sh.o[1] - n.o[1])) : null, field:dkm == null ? null : +dkm.toFixed(1), needL:needL == null ? null : Math.round(needL)}); }
          S.home = 'finnsnes'; S.naust = null; S.shopN = null; return {cap:BOAT.fuelCap, type:b.type, out}; })()""")
        O = sv['out']; nN = sum(1 for o in O if o['naust'] is not None); nS = sum(1 for o in O if o['shop'] is not None)
        print(json.dumps({'n': len(O), 'naust': nN, 'shop': nS, 'cap': sv['cap'], 'missing': [o['name'] for o in O if o['naust'] is None or o['shop'] is None], 'far': [o for o in O if o['field'] is None or o['field'] > 6 or (o['needL'] or 0) > sv['cap'] * 0.6]}, ensure_ascii=False))
        print(ok(all(o['naust'] is None or o['naust'] <= 400 for o in O) and all(o['shop'] is None or 40 <= o['shop'] <= 170 for o in O)), 'Father\'s naust stands within 400 m of the plant, and the tackle shop 45-160 m from the naust, wherever they are found', [(o['name'], o['naust'], o['shop']) for o in O][:12])
        print(ok(nN >= len(O) * 0.7 and nS == 0), 'along the coast most homes get the naust, and no shop by it: Father\'s naust is only a home (the rest start at the plant\'s quay)', (nN, nS, len(O)))
        print(ok(all(o['field'] is not None and o['field'] <= 6 and o['needL'] <= sv['cap'] * 0.6 for o in O)), 'from every home the first trip\'s patch is at most 6 km out, and there and back takes at most 60 % of the start boat\'s tank', [(o['name'], o['field'], o['needL']) for o in O][:12])
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
