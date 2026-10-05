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
        r = await pg.evaluate("""(() => { const C = PORTS.filter(q => q.coastal), ids = new Set(PORTS.map(q => q.id));
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
        pick = await pg.evaluate("""(() => { const it = [...document.querySelectorAll('#startPick .st-it.rec')], dots = document.querySelectorAll('#startPick .st-dot').length;
          const t = it.find(e => /Båtsfjord|Honningsvåg|Ballstad|Stamsund|Henningsvær|Myre|Andenes|Berlevåg/.test(e.textContent)) || it[0];
          t.click(); return {rec:it.length, dots, name:t.querySelector('b').textContent.replace('★ ', ''), id:t.dataset.id}; })()""")
        print(ok(pick['rec'] >= 8 and pick['dots'] >= 150), 'the start shows the coast\'s plants on the map, with recommended ones', {k: pick[k] for k in ('rec', 'dots', 'name')})
        await pg.click('#stGo')
        await pg.wait_for_selector('#obBoat', timeout=90000)
        st = await pg.evaluate("""(() => { const b = S.boat, pt = portById(S.home), f = S.tutStart && S.tutStart.f;
          return {home:S.home, port:b.port, st:b.status, atPort:pt && dist(b.pos, pt.p) < 0.01, f:!!f, fd:f && pt ? +dist(f.p, pt.p).toFixed(2) : null, land:S.tutStart && S.tutStart.land, center:pt ? +Math.hypot(view.cx - pt.p.x, view.cy - pt.p.y).toFixed(2) : null, startGone:!document.getElementById('startPick')}; })()""")
        print(json.dumps(st, ensure_ascii=False))
        print(ok(st['home'] == pick['id'] and st['port'] == pick['id'] and st['atPort'] and st['st'] == 'port' and st['startGone']), 'picking a place moves the new game\'s boat there, into the harbour', pick['name'])
        print(ok(st['f'] and 1 <= st['fd'] <= 6.5 and st['land'] == pick['id'] and st['center'] is not None and st['center'] < 1), 'the first trip goes to a patch of cod near there and lands at its plant; the chart is round it', st['fd'])
        await pg.fill('#obBoat', 'Testbris'); await pg.click('#obGo')
        await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=30000)
        # the first trip's route step names the place, not Gisundet; then a sale at the coast plant
        tip = await pg.evaluate("""(() => { setBodyView(false); const s = TSTEPS.find(x => x.id === 'route1'); LEIA_ARM = true; const t = s.tip(); LEIA_ARM = false; return ((t && t.no) || '') + ' | ' + JSON.stringify(S.tut.f || null).slice(0, 60); })()""")
        print(ok('Gisundet' not in tip and pick['name'].split(' (')[0] in tip), 'the first trip\'s tips name the new place', tip[:90])
        sale = await pg.evaluate("""(() => { const b = S.boat; S.tut = 0; S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:120, n:30, bled:true, iced:true, hr:Math.floor(S.t / 60), fresh:100, gut:true, hook:true}];
          const c0 = S.cash; S.t = Math.floor(S.t / 1440) * 1440 + 10 * 60 + 1440; sell(); return {c0, c1:S.cash, last:S.lastSale ? S.lastSale.port : null, hold:holdTotal()}; })()""")
        print(json.dumps(sale))
        print(ok(sale['c1'] > sale['c0'] and sale['last'] == pick['id'] and sale['hold'] < 1), 'the catch sells at the coast plant', sale['c1'] - sale['c0'])
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
        print(ok(mv['port'] == to and mv['home'] == to and mv['moved'] and not mv['again'] and 'Flyttet fra Finnsnes' in mv['log']), 'a game from before moves once along the coast from Settings, and the button is gone', mv)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
