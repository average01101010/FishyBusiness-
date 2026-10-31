"""Driftsplan 2's chart window (ui/03g-planmap.js, part 6 of docs/planer/driftsplan-2/02-design.md, S13): «Velg i kartet …» opens the
plotter in plan mode with real touches through the DevTools protocol. A tap in the sea adds a field of the kind chosen, a tap on land is
refused, a tap on a pin opens its card (units and soak), a pin dragged moves, Juksplass adds a jig place, and «Ferdig» goes back to the
Drift page with the day reckoned anew. Screenshots in 800×1280, 1280×800 and 384×853 go to tests/out/."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')

SETUP = """(async () => {
  S.tut = 0; S.settings.lang = 'no'; S.lang = 'no'; DRIFT2 = true;
  const b = S.boat, HP = portById('husoy'); b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; S.plan = null; S.ops = null; S.draft = []; S.me = S.cur;
  S.crew = [Object.assign(genCrew(), {bi:false, off:false, name:'Ole Mikalsen', known:[true, true]}), Object.assign(genCrew(), {bi:false, off:false, name:'Per Hansen', known:[true, true]})];
  S.equip.linehaler = true; S.pgear.kits.n = 6; const LN = S.pgear.lines.hyse; LN.n = 4; LN.baited = 4; LN.bt = {makrell:4};
  await mapNeed(HP.p, 14);
  PHONE.dact('drift', 'p2-new', {}); const o = S.ops; o.rig = 'line'; o.jig = true; o.places = [];
  // a sea point and a land point near home, in map km
  const sea = [], land = []; for (let r = 2; r < 10 && sea.length < 4; r += 0.5) for (let a = 0; a < 24 && sea.length < 4; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.5 && sea.every(z => dist(z, q) > 1.5) && !ruBlockMsg({p:q, len:BOAT.len, gear:'line', sp:null})) sea.push(q); } catch (e){} }
  for (let r = 0.3; r < 4 && !land.length; r += 0.1) for (let a = 0; a < 24 && !land.length; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (isLand(q) && !inHarbour(q)) land.push(q); } catch (e){} }
  return {sea, land, home:o.home}; })()"""

# screen coordinates of a map point (the chart's own transform), and the plan's places
# (the chart is centred on the point first, so it lies on the screen and under neither the bar nor the card)
SCR = "mp => { view.cx = mp.x; view.cy = mp.y; applyView(); renderDyn(); const pt = svg.createSVGPoint(); pt.x = mp.x; pt.y = mp.y; const q = pt.matrixTransform(svg.getScreenCTM()); return {x:q.x, y:q.y}; }"
PLACES = "() => S.ops.places.map(q => ({id:q.id, k:q.k, x:q.x, y:q.y, n:q.n, soak:q.soak}))"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        ctx = await b.new_context(viewport={'width': 800, 'height': 1280}, has_touch=True)
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        async def tap(x, y):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)
        async def drag(x0, y0, x1, y1):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0, 'id': 0}]}); await asyncio.sleep(0.05)
            for k in range(1, 9):
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * k / 8, 'y': y0 + (y1 - y0) * k / 8, 'id': 0}]}); await asyncio.sleep(0.03)
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)
        async def tap_el(sel):
            r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return q.width ? {x:q.x + q.width / 2, y:q.y + q.height / 2} : null; }", sel)
            if r: await tap(r['x'], r['y'])
            return bool(r)
        await boot(pg)
        st = await pg.evaluate(SETUP); sea, land = st['sea'], st['land']
        print('oppsett:', len(sea), 'sjøpunkt,', len(land), 'landpunkt, hjem', st['home'])
        # «Velg i kartet …» on the page opens the plotter in plan mode with the bar and the pins
        await pg.evaluate("PHONE.dact('drift', 'p2-map', {})"); await pg.wait_for_timeout(900)
        r1 = await pg.evaluate("() => ({on:PLANMAP.isOn(), bar:!document.getElementById('pmBar').hidden, plot:document.body.classList.contains('vplot') || !document.body.classList.contains('v3d'), tool:document.querySelector('#pmBar .pm-t button.on') && document.querySelector('#pmBar .pm-t button.on').dataset.k, pins:(document.querySelector('#map g.pm') || {innerHTML:''}).innerHTML.split('<circle').length - 1})")
        print(ok(r1['on'] and r1['bar'] and r1['tool'] == 'felt' and r1['pins'] >= 1), '«Velg i kartet» opens the plotter in plan mode with the bar, Felt chosen and home pinned', r1)
        await pg.screenshot(path=os.path.join(OUT, 'driftsplan2map-800x1280.png'))
        # a tap in the sea adds a field; the card opens with its units and soak
        s0 = await pg.evaluate(SCR, sea[0]); await tap(s0['x'], s0['y'])
        P = await pg.evaluate(PLACES); card = await pg.evaluate("() => { const c = document.getElementById('pmCard'); return {hidden:c.hidden, text:c.innerText.replace(/\\s+/g, ' ')}; }")
        print(ok(len(P) == 1 and P[0]['k'] == 'felt' and not card['hidden'] and 'Felt 1' in card['text'] and 'Ståtid' in card['text']), 'a tap in the sea adds a field, and its card opens', [P, card['text'][:80]])
        # the card's buttons: units and soak
        await tap_el('#pmCard [data-pm=n][data-d="1"]'); await tap_el('#pmCard [data-pm=s][data-d="1"]'); P2 = await pg.evaluate(PLACES)
        print(ok(len(P2) == 1 and P2[0]['n'] == P[0]['n'] + 1 and P2[0]['soak'] == P[0]['soak'] + 1), 'the card\'s + buttons add a tub and an hour of soak', [P[0]['n'], P2[0]['n'], P[0]['soak'], P2[0]['soak']])
        # the string's heading: a turn from the card draws the string on the chart, and the day's length stands in the bar
        hd = await pg.evaluate("() => { const o = S.ops, q = o.places[0]; for (let k = 0; k < 4 && q.n > 1; k++) document.querySelector('#pmCard [data-pm=n][data-d=\"-1\"]').click(); let n = 0; for (let k = 0; k < 24 && q.hdg == null; k++){ document.querySelector('#pmCard [data-pm=h][data-d=\"15\"]').click(); n++; } return {hdg:q.hdg, tries:n, line:(document.querySelector('#map g.pm') || {innerHTML:''}).innerHTML.includes('pm-string'), card:document.getElementById('pmCard').innerText.replace(/\\s+/g, ' ').slice(0, 160), bar:document.getElementById('pmBar').innerText}; }")
        print(ok(hd['hdg'] is not None and hd['line'] and '°' in hd['card'] and 'Dagen blir' in hd['bar']), 'a turn from the card gives the string a heading, drawn on the chart; the bar says how long the day gets', [hd['hdg'], hd['tries'], hd['line'], hd['bar'][-60:]])
        await pg.screenshot(path=os.path.join(OUT, 'driftsplan2map-800x1280-kort.png'))
        # a tap on land is refused (a toast, no place)
        l0 = await pg.evaluate(SCR, land[0]); await tap(l0['x'], l0['y']); P3 = await pg.evaluate(PLACES)
        print(ok(len(P3) == 1), 'a tap on land adds nothing', len(P3))
        # the pin dragged moves the field (a short drag, in the sea)
        p0 = await pg.evaluate(SCR, {'x': P3[0]['x'], 'y': P3[0]['y']}); tgt = await pg.evaluate("c => toMap(c.x, c.y)", {'x': p0['x'] - 120, 'y': p0['y'] - 60})
        await drag(p0['x'], p0['y'], p0['x'] - 120, p0['y'] - 60); P4 = await pg.evaluate(PLACES)
        moved = len(P4) == 1 and abs(P4[0]['x'] - tgt['x']) < 0.1 and abs(P4[0]['y'] - tgt['y']) < 0.1 and (abs(P4[0]['x'] - P3[0]['x']) > 0.1 or abs(P4[0]['y'] - P3[0]['y']) > 0.1)
        print(ok(moved), 'a pin dragged moves the field to where the finger lifted', [P3[0]['x'], P3[0]['y'], '->', P4[0]['x'], P4[0]['y'], 'mål', tgt])
        # Juksplass, then a tap in the sea adds a jig place
        top = await pg.evaluate("() => { const e = document.querySelector('#pmBar [data-pm=tool][data-k=juks]'), q = e.getBoundingClientRect(), t = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return {x:Math.round(q.x), y:Math.round(q.y), w:Math.round(q.width), h:Math.round(q.height), top:t ? t.tagName + '#' + t.id + '.' + t.className : null}; }"); print('  juks-knappen:', top)
        await tap_el('#pmBar [data-pm=tool][data-k=juks]'); tl = await pg.evaluate("() => PLANMAP.tool()"); s2 = await pg.evaluate(SCR, sea[2]); await tap(s2['x'], s2['y']); P5 = await pg.evaluate(PLACES)
        tst = await pg.evaluate("() => { const t = document.getElementById('toast'); return t ? t.textContent.slice(0, 120) : null; }")
        print(ok(len(P5) == 2 and P5[1]['k'] == 'juks'), 'Juksplass and a tap add a jig place', [q['k'] for q in P5], 'verktøy', tl, 'toast', tst)
        # «Ferdig»: plan mode off, the Drift page open with the places and the day
        await tap_el('#pmBar [data-pm=done]'); await pg.wait_for_timeout(600)
        r2 = await pg.evaluate("() => { const d = document.getElementById('drawerBody'); return {on:PLANMAP.isOn(), bar:document.getElementById('pmBar').hidden, page:!!d && !d.closest('[hidden]') && d.innerText.includes('Driftsplan'), places:d ? d.innerText.includes('1 felt, 1 juksplass') : false, day:d ? /Setter|Jukser/.test(d.innerText) : false}; }")
        print(ok(not r2['on'] and r2['bar'] and r2['page'] and r2['places'] and r2['day']), '«Ferdig» goes back to the page with the places and the day', r2)
        # the two other formats: plan mode opened again with the places, a screenshot of each
        for w, h in [(1280, 800), (384, 853)]:
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate("PHONE.dact('drift', 'p2-map', {}); PLANMAP.tap({x:S.ops.places[0].x, y:S.ops.places[0].y}, 0.2)"); await pg.wait_for_timeout(900)
            ov = await pg.evaluate("() => { const bar = document.getElementById('pmBar').getBoundingClientRect(), c = document.getElementById('pmCard').getBoundingClientRect(); return {barW:Math.round(bar.width), cardW:Math.round(c.width), cardBottom:Math.round(c.bottom), overlap:bar.bottom > c.top, inside:c.right <= innerWidth + 1 && bar.right <= innerWidth + 1}; }")
            print(ok(ov['inside'] and not ov['overlap'] and ov['cardW'] > 100), 'the bar and the card fit at %d×%d without covering each other' % (w, h), ov)
            await pg.screenshot(path=os.path.join(OUT, 'driftsplan2map-%dx%d.png' % (w, h)))
            await pg.evaluate("PLANMAP.close()"); await pg.wait_for_timeout(300)
        print('sidefeil:', errs[:4]); await b.close()
asyncio.run(main())
