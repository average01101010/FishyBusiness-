"""The route editor. Part 1: WP names, a card per waypoint with course, length and ETA, undo and redo, moving a point with a finger,
inserting one with the «+» on a leg, and the harbour's way-out points (A12). Touch goes through CDP, in landscape and portrait.
Part 2: «Følg leia» from Finnsnes to every fishing ground and to Botnhamn (clear of land and hazards, at most 12 WP, slices under
16 ms, and how its length compares with the hand-drawn routes in routes.json and the tightest way along the shore), the button and
the tap on the chart, undo in one step, and the comparison line for a hand-drawn route. Prints OK or FEIL per check."""
from _env import GAME, ROUTES, boot
import asyncio, json, re
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


class Touch:
    def __init__(self, cdp): self.cdp = cdp
    async def ev(self, typ, pts): await self.cdp.send('Input.dispatchTouchEvent', {'type': typ, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in pts]})
    async def tap(self, x, y):
        await self.ev('touchStart', [(0, (x, y))]); await asyncio.sleep(0.05); await self.ev('touchEnd', []); await asyncio.sleep(0.15)
    async def drag(self, x0, y0, x1, y1, n=10):
        await self.ev('touchStart', [(0, (x0, y0))])
        for k in range(1, n + 1): await self.ev('touchMove', [(0, (x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n))]); await asyncio.sleep(0.02)
        await self.ev('touchEnd', []); await asyncio.sleep(0.2)


SETUP = """(() => { S.cash = 50000; S.boat.gear = true; openPlotter(); const r = svg.getBoundingClientRect(); view.cx = LG(56.3, 49.4).x; view.cy = LG(56.3, 49.4).y; view.z = MAP_H / 13; applyView(); scheduleStatic(); renderDyn(); return 1; })()"""
C = "(p => mapToClient(p))"
# a sea point about d px from w on screen, and a land point near it
NEAR = """([i, d, land]) => { const w = S.draft[i]; for (let k = 0; k < 64; k++){ const a = k / 64 * Math.PI * 2, r = (d + (k % 8) * 6) / view.px, p = {x:w.x + Math.cos(a) * r, y:w.y + Math.sin(a) * r};
  if (isLand(p) === land && (land || legClear(i ? S.draft[i - 1] : S.boat.pos, p) && (!S.draft[i + 1] || legClear(p, S.draft[i + 1])))) return JSON.stringify({p, c:mapToClient(p), w:mapToClient(w)}); } return 'null'; }"""


async def run(p, W, H, tag):
    ctx = await p.new_context(viewport={'width': W, 'height': H}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); T = Touch(cdp)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.evaluate(SETUP); await pg.wait_for_timeout(700)
    J = lambda js, *a: pg.evaluate(js, *a)
    n = lambda: J("S.draft.length")
    # three taps on the sea: from Finnsnes out and up Gisundet
    for q in [{'x': 55.65, 'y': 54.05}, {'x': 56.35, 'y': 45.25}, {'x': 57.25, 'y': 44.35}]:
        c = await J("(q => mapToClient(LG(q.x, q.y)))", q); await T.tap(c['x'], c['y'])
    await pg.wait_for_timeout(300)
    d = json.loads(await J("JSON.stringify({n:S.draft.length, auto:S.draft.map(w => w.auto || ''), cards:[...document.querySelectorAll('#panel .wpc')].map(li => li.textContent), nums:[...document.querySelectorAll('#panel .wpc .n')].map(x => x.textContent), labels:[...document.querySelectorAll('#gDyn text.wpn')].map(t => t.textContent)})"))
    names = d['nums']
    check(d['n'] >= 3 and names == ['WP' + str(i) for i in range(d['n'] + 1)] and 'WP0' in d['labels'] and 'WP' + str(d['n']) in d['labels'], tag + ': WP0 er starten, så WP1 … i lista og på kartet', names)
    card = d['cards'][-1]
    check(re.search(r'Kurs \d{3}°', card) and re.search(r'[\d,]+ nm', card) and re.search(r'ETA \d\d:\d\d', card) and 'om ' in card and '°' in card and "'N" in card, tag + ': kortet har kurs, lengde, ETA med nedtelling og koordinat', card[:120])
    # undo and redo with the floating buttons
    tools = json.loads(await J("JSON.stringify(['rUndo', 'rRedo'].map(id => { const r = $(id).getBoundingClientRect(); return {w:Math.round(r.width), h:Math.round(r.height), x:r.x, y:r.y, vis:!$(id).hidden}; }))"))
    check(all(t['vis'] and t['w'] == 44 and t['h'] == 44 for t in tools), tag + ': angre og gjør om er 44 × 44 px', tools)
    n0 = await n()
    await T.tap(tools[0]['x'] + 22, tools[0]['y'] + 22); n1 = await n()
    await T.tap(tools[1]['x'] + 22, tools[1]['y'] + 22); n2 = await n()
    check(n1 == n0 - 1 and n2 == n0, tag + ': angre fjerner siste punkt, gjør om legger det tilbake', [n0, n1, n2])
    last = n0 - 1
    await J("i => doAct({dataset:{act:'fp', i}})", last); f1 = await J("i => S.draft[i].fish", last)
    await T.tap(tools[0]['x'] + 22, tools[0]['y'] + 22); f0 = await J("i => S.draft[i].fish", last)
    await T.tap(tools[1]['x'] + 22, tools[1]['y'] + 22); f2 = await J("i => S.draft[i].fish", last)
    check(f1 == 1 and f0 == 0 and f2 == 1, tag + ': fisketid kan angres og gjøres om', [f1, f0, f2])

    # drag the middle point with a finger to open sea, then undo
    mid = n0 - 2
    s = json.loads(await J(NEAR, [mid, 50, False]))
    before = await J("i => JSON.stringify(S.draft[i])", mid)
    await T.drag(s['w']['x'], s['w']['y'], s['c']['x'], s['c']['y'])
    after = json.loads(await J("i => JSON.stringify(S.draft[i])", mid)); b0 = json.loads(before)
    moved = abs(after['x'] - s['p']['x']) < 0.02 and abs(after['y'] - s['p']['y']) < 0.02
    check(moved and await n() == n0, tag + ': punktet følger fingeren', [round(after['x'], 3), round(after['y'], 3), round(s['p']['x'], 3), round(s['p']['y'], 3)])
    await T.tap(tools[0]['x'] + 22, tools[0]['y'] + 22)
    back = json.loads(await J("i => JSON.stringify(S.draft[i])", mid))
    check(abs(back['x'] - b0['x']) < 1e-9 and abs(back['y'] - b0['y']) < 1e-9, tag + ': flyttingen kan angres')
    # on land: it goes back, with a message
    s = json.loads(await J(NEAR, [mid, 40, True]))
    await T.ev('touchStart', [(0, (s['w']['x'], s['w']['y']))])
    for k in range(1, 9): await T.ev('touchMove', [(0, (s['w']['x'] + (s['c']['x'] - s['w']['x']) * k / 8, s['w']['y'] + (s['c']['y'] - s['w']['y']) * k / 8))]); await asyncio.sleep(0.02)
    await pg.wait_for_timeout(120)
    red = await J("!!document.querySelector('#gDyn circle.wp.drag.landed')")
    await T.ev('touchEnd', []); await pg.wait_for_timeout(250)
    back = json.loads(await J("i => JSON.stringify(S.draft[i])", mid)); toast = await J("$('toast').textContent")
    check(red and abs(back['x'] - b0['x']) < 1e-9 and 'land' in toast, tag + ': på land blir punktet rødt og går tilbake', [red, toast])
    # a second finger cancels the move and pinches the chart
    s = json.loads(await J(NEAR, [mid, 50, False])); z0 = await J("view.z")
    await T.ev('touchStart', [(0, (s['w']['x'], s['w']['y']))])
    for k in range(1, 5): await T.ev('touchMove', [(0, (s['w']['x'] + 8 * k, s['w']['y']))]); await asyncio.sleep(0.02)
    ox, oy = s['w']['x'] + 32, s['w']['y']
    await T.ev('touchStart', [(0, (ox, oy)), (1, (ox + 120, oy + 20))])
    for k in range(1, 6): await T.ev('touchMove', [(0, (ox - 10 * k, oy)), (1, (ox + 120 + 10 * k, oy + 20))]); await asyncio.sleep(0.02)
    await T.ev('touchEnd', []); await pg.wait_for_timeout(250)
    back = json.loads(await J("i => JSON.stringify(S.draft[i])", mid)); z1 = await J("view.z")
    check(abs(back['x'] - b0['x']) < 1e-9 and abs(back['y'] - b0['y']) < 1e-9 and z1 > z0 * 1.05, tag + ': en finger til avbryter flyttingen og zoomer kartet', [round(z0, 2), round(z1, 2)])
    await J(SETUP); await pg.wait_for_timeout(300)

    # insert with the «+» on a leg: a tap puts a point in the middle
    hd = json.loads(await J("JSON.stringify(insHandles().map(h => ({i:h.i, p:h.p, c:mapToClient(h.p), land:isLand(h.p)})))"))
    hd = [h for h in hd if not h['land']]
    if hd:
        h = hd[-1]; m0 = await n()
        await T.tap(h['c']['x'], h['c']['y'])
        w = json.loads(await J("i => JSON.stringify(S.draft[i])", h['i']))
        check(await n() == m0 + 1 and abs(w['x'] - h['p']['x']) < 1e-6 and abs(w['y'] - h['p']['y']) < 1e-6, tag + ': + midt på etappen setter inn et punkt der', [m0, h['i']])
        # and a press on a handle that moves makes a new point where the finger lets go
        hd2 = json.loads(await J("JSON.stringify(insHandles().filter(h => !isLand(h.p)).map(h => ({i:h.i, p:h.p, c:mapToClient(h.p)})))"))
        h2 = hd2[0]; m1 = await n()
        tgt = json.loads(await J("""(h => { for (let k = 0; k < 32; k++){ const a = k / 32 * 6.283, r = 36 / view.px, p = {x:h.p.x + Math.cos(a) * r, y:h.p.y + Math.sin(a) * r}; if (!isLand(p)) return JSON.stringify({p, c:mapToClient(p)}); } return 'null'; })""", h2))
        await T.drag(h2['c']['x'], h2['c']['y'], tgt['c']['x'], tgt['c']['y'])
        w = json.loads(await J("i => JSON.stringify(S.draft[i])", h2['i']))
        check(await n() == m1 + 1 and abs(w['x'] - tgt['p']['x']) < 0.02, tag + ': dra fra + lager et nytt punkt der fingeren slipper')
    else:
        check(False, tag + ': fant ingen +-håndtak på sjøen')

    # end in Finnsnes: the harbour point cannot be dragged, the chart pans instead
    fs = await J("mapToClient(portById('finnsnes').p)")
    await T.tap(fs['x'], fs['y'])
    lastw = json.loads(await J("JSON.stringify(S.draft[S.draft.length - 1])")); cx0 = await J("view.cx")
    await T.drag(fs['x'], fs['y'], fs['x'] + 60, fs['y'] - 40)
    lastw2 = json.loads(await J("JSON.stringify(S.draft[S.draft.length - 1])")); cx1 = await J("view.cx")
    check(lastw['port'] == 'finnsnes' and lastw2['x'] == lastw['x'] and abs(cx1 - cx0) > 0.01, tag + ': havna kan ikke flyttes, kartet panorerer i stedet', [lastw['port'], round(cx1 - cx0, 3)])
    # the button row stays in view at the bottom of the panel
    if W <= 700: await J("document.body.classList.add('drawer')"); await pg.wait_for_timeout(400)
    bar = json.loads(await J("(() => { panel.scrollTop = 0; const b = document.querySelector('#panel .rbar [data-act=start]').getBoundingClientRect(), p = panel.getBoundingClientRect(); return JSON.stringify({b:b.bottom, p:p.bottom, top:b.top, ptop:p.top, sh:panel.scrollHeight, ch:panel.clientHeight}); })()"))
    check(bar['b'] <= bar['p'] + 1 and bar['top'] >= bar['ptop'] and bar['sh'] > bar['ch'], tag + ': Kast loss står fast nederst selv når lista er lang', bar)
    await pg.screenshot(path='route_' + tag + '.png')
    await ctx.close()
    return errs


async def leia(p):
    R = json.load(open(ROUTES))
    ctx = await p.new_context(viewport={'width': 1293, 'height': 830}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); T = Touch(cdp)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.wait_for_function("DEPTH !== null", timeout=90000); await pg.evaluate(SETUP); await pg.wait_for_timeout(800)
    # the algorithm: Finnsnes to each fishing ground (the hand-drawn routes end there) and to Botnhamn
    rows = []
    for k in sorted(R):
        rows.append(json.loads(await pg.evaluate("""async (rt) => { const F = portById('finnsnes'), g = rt[rt.length - 1], sd = safeDepth(); const res = await leiaRoute(F.p, g, 'finnsnes', null);
          if (res.why) return JSON.stringify({why:res.why}); const ti = await leiaRoute(F.p, g, 'finnsnes', null, {tight:true}); let man = dist(F.p, rt[0]); for (let i = 1; i < rt.length; i++) man += dist(rt[i - 1], rt[i]);
          let a = F.p, bad = 0; res.wps.forEach(w => { if (!clearLine(a, w) || legHazard(a, w, sd).unsafe) bad++; a = w; });
          return JSON.stringify({n:res.wps.length, max:res.st.maxWp, nm:+res.nm.toFixed(2), hand:+(res.nm / (man / NM)).toFixed(3), tight:+(res.nm / ti.nm).toFixed(3), bad, slice:+res.st.maxSlice.toFixed(1), at:res.st.at, ms:Math.round(res.st.ms)}); }""", R[k])))
    rows.append(json.loads(await pg.evaluate("""async () => { const F = portById('finnsnes'), B = portById('botnhamn'), sd = safeDepth(); const res = await leiaRoute(F.p, B.p, 'finnsnes', 'botnhamn'); let a = F.p, bad = 0; res.wps.forEach(w => { if (!clearLine(a, w) || legHazard(a, w, sd).unsafe) bad++; a = w; });
      const last = res.wps[res.wps.length - 1]; return JSON.stringify({n:res.wps.length, max:res.st.maxWp, nm:+res.nm.toFixed(2), bad, end:dist(last, B.p) < 0.001, slice:+res.st.maxSlice.toFixed(1), at:res.st.at, ms:Math.round(res.st.ms)}); }""")))
    print('    ', rows)
    ok = [r for r in rows if 'why' not in r]
    check(len(ok) == len(rows) and all(r['bad'] == 0 for r in ok) and rows[-1]['end'], 'Autonav: alle etapper til de seks feltene og Botnhamn er fri for land, grunner og skjær')
    check(all(r['n'] <= r['max'] for r in ok), 'Autonav: høyst maxWp WP (12 på ruter under 80 km, flere på lengre)', [(r['n'], r['max']) for r in ok])
    check(all(r['slice'] < 16 for r in ok), 'Autonav: hver bit tar under 16 ms', [(r['slice'], r.get('at')) for r in ok])
    tight = [r['tight'] for r in ok[:-1]]; hand = [r['hand'] for r in ok[:-1]]
    check(all(0.99 <= x <= 1.35 for x in tight), 'Autonav er litt lengre enn den strammeste veien langs land (eller like lang: 1 % for avrundingen)', tight)
    check(all(0.85 <= x <= 1.35 for x in hand), 'og 0,85–1,35 ganger de håndtegnede testrutene (de er ikke de korteste)', hand)

    # phase K9: Autonav anywhere on the coast. The ends are the nearest sea 300 m or more from the land and deep enough near each town (the tiles' detail); a way must be
    # found, clear of land and hazards, within 40 waypoints (maxWp is a target), no more than 1.6 times the straight line, in slices under 16 ms, and
    # Bergen to Florø inside the skerries (no point of it more than 4 km from the land)
    nat = {}
    for name, a, bb, aport in [('Finnsnes–Tromsø', None, (69.652, 18.962), 'finnsnes'), ('Bodø–Reine', (67.287, 14.385), (67.931, 13.088), None), ('Bergen–Florø', (60.398, 5.315), (61.599, 5.035), None)]:
        nat[name] = json.loads(await pg.evaluate("""async ([a, b, aport]) => { const sd = safeDepth(), sea = async ([la, lo]) => { const c = P(la, lo); await mapNeed(c, 7); for (let r = 0; r <= 60; r++) for (let k = 0; k < Math.max(1, r * 6); k++){ const t = k / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1}; if (!isLand(q) && coastDist(q) >= 0.3 && depthF(q) >= sd + 1) return q; } return null; };
          const A = aport ? portById(aport).p : await sea(a), B = await sea(b), t0 = performance.now(), res = await leiaRoute(A, B, aport, null);
          if (res.why) return JSON.stringify({why:res.why[0]});
          let p = A, bad = 0, far = 0, len = 0; for (const w of res.wps){ if (!clearLine(p, w) || legHazard(p, w, sd).unsafe) bad++; const L = dist(p, w); for (let k = 1; k < L / 0.25; k++){ const u = k * 0.25 / L; far = Math.max(far, coastDistFar({x:p.x + (w.x - p.x) * u, y:p.y + (w.y - p.y) * u})); } len += L; p = w; }
          return JSON.stringify({n:res.wps.length, max:res.st.maxWp, km:+len.toFixed(1), ratio:+(len / dist(A, B)).toFixed(2), bad, far:+far.toFixed(1), slice:+res.st.maxSlice.toFixed(1), at:res.st.at, cell:res.st.cell, s:+((performance.now() - t0) / 1000).toFixed(1)}); }""", [a, bb, aport]))
    print('     K9:', json.dumps(nat, ensure_ascii=False))
    okn = all('why' not in v for v in nat.values())
    check(okn and all(v['bad'] == 0 and v['n'] <= 40 for v in nat.values()), 'Autonav over hele kysten: Finnsnes–Tromsø, Bodø–Reine og Bergen–Florø gir en vei fri for land, grunner og skjær, med høyst 40 punkter (maxWp er et mål)', {k: (v.get('n'), v.get('max'), v.get('bad'), v.get('why')) for k, v in nat.items()})
    check(okn and all(v['ratio'] <= 1.6 for v in nat.values()), 'og ingen er mer enn 1,6 ganger den rette linja', {k: v.get('ratio') for k, v in nat.items()})
    check(okn and nat['Bergen–Florø']['far'] <= 4, 'Bergen–Florø går innaskjærs (ingen punkt mer enn 4 km fra land)', nat['Bergen–Florø'].get('far'))
    check(okn and all(v['slice'] < 16 for v in nat.values()), 'og hver bit tar under 16 ms', {k: (v.get('slice'), v.get('at')) for k, v in nat.items()})

    # the button, then a tap on Botnhamn: the route follows the fairway there, and undo takes it all away at once
    await pg.evaluate("view.cx = LG(55.2, 38.5).x; view.cy = LG(55.2, 38.5).y; view.z = MAP_H / 36; applyView(); scheduleStatic(); renderDyn()"); await pg.wait_for_timeout(500)
    lb = json.loads(await pg.evaluate("JSON.stringify((r => ({x:r.x + r.width / 2, y:r.y + r.height / 2, vis:!$('rAuto').hidden, txt:$('rAuto').textContent}))($('rAuto').getBoundingClientRect()))"))
    await T.tap(lb['x'], lb['y'])
    armed = await pg.evaluate("LEIA_ARM && /Autonav/.test($('panel').textContent) && !document.querySelector('#panel [data-act=leia]')")
    bh = await pg.evaluate("mapToClient(portById('botnhamn').p)")
    await T.tap(bh['x'], bh['y'])
    await pg.wait_for_function("!LEIA_BUSY && S.draft.length > 0", timeout=30000); await pg.wait_for_timeout(300)
    d = json.loads(await pg.evaluate("JSON.stringify({n:S.draft.length, last:S.draft[S.draft.length - 1].port, leia:S.draft.filter(w => w.leia).length, bad:estimate().bad, txt:$('panel').textContent})"))
    check(lb['vis'] and lb['txt'] == 'Autonav' and armed and d['last'] == 'botnhamn' and d['leia'] >= 1 and d['bad'] < 0 and 'Ruta følger leia' in d['txt'], 'Autonav-knappen i kartplotteren og et trykk på Botnhamn gir en rute langs leia (ingen «Følg leia»-knapp i panelet)', {k: d[k] for k in ('n', 'last', 'leia', 'bad')})
    await pg.screenshot(path='route_leia.png')
    await pg.evaluate("$('rUndo').click()"); n1 = await pg.evaluate("S.draft.length")
    check(n1 == 0, 'angre tar bort hele autoruta i ett steg', n1)
    # a hand-drawn route gets the comparison with following the fairway
    await pg.evaluate(SETUP); await pg.wait_for_timeout(400)
    for q in R['4'][:-1]:
        c = await pg.evaluate(C, q); await T.tap(c['x'], c['y'])
    await pg.wait_for_function("/Din rute:/.test($('panel').textContent)", timeout=30000)
    cmp = await pg.evaluate("document.querySelector('#panel .leiacmp').textContent")
    check(re.search(r'Autonav: [\d,]+ nm · .+ · [\d,]+ L\. Din rute: [−+][\d,]+ nm, [−+]\d+ min, [−+][\d,]+ L\.', cmp), 'håndtegnet rute får sammenligningen med leia', cmp)
    # «Kast loss» sets off and the chart plotter stays open (it is closed by hand)
    await pg.evaluate("document.querySelector('#panel .rbar [data-act=start]').click()"); await pg.wait_for_timeout(600)
    k = json.loads(await pg.evaluate("JSON.stringify({plan:!!S.plan, plot:document.body.classList.contains('vplot'), g3:G3.isActive()})"))
    check(k['plan'] and k['plot'] and not k['g3'], 'Kast loss setter ruta i gang, og kartplotteren står åpen', k)
    await ctx.close()
    return errs


async def main():
    async with async_playwright() as p:
        # software compositing: with SwiftShader compositing the plotter draws about one frame a second, and each touch move waits for a frame
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = await run(b, 1293, 830, 'liggende')
        errs += await run(b, 915, 1208, 'staaende')
        errs += await leia(b)
        # A12: the harbour adds a way-out or way-in point only when the way from it is clear
        pg = await b.new_page(viewport={'width': 900, 'height': 700})
        await boot(pg)
        r = json.loads(await pg.evaluate("""(() => { const R = {n:0, out:0, inn:0, bad:[]}; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
          for (const pt of PORTS){ approachPath(pt); for (let k = 0; k < 150; k++){ const a = rnd() * 6.283, r = 0.4 + rnd() * 4, to = {x:pt.p.x + Math.cos(a) * r, y:pt.p.y + Math.sin(a) * r}; if (isLand(to)) continue; R.n++;
            const ex = exitWps(pt, to), en = entryWps(pt, to); if (ex.length) R.out++; if (en.length) R.inn++;
            const chain = [pt.p].concat(ex, [to]); for (let i = 1; i < chain.length; i++) if (ex.length && !clearLine(chain[i - 1], chain[i])) { R.bad.push([pt.id, 'out', i]); break; }
            if (ex.some(q => dist(q, pt.p) < 0.002) || en.some(q => dist(q, pt.p) < 0.002)) R.bad.push([pt.id, 'harbour point']);
            const ch2 = [to].concat(en, [pt.p]); for (let i = 1; i < ch2.length; i++) if (en.length && !clearLine(ch2[i - 1], ch2[i])) { R.bad.push([pt.id, 'in', i]); break; } } }
          return JSON.stringify(R); })()"""))
        check(r['n'] > 500 and r['out'] > 20 and r['inn'] > 20 and not r['bad'], 'A12: innseilingspunkter bare med fri sikt hele veien, og aldri selve havnepunktet', {k: r[k] for k in ('n', 'out', 'inn')} | {'bad': r['bad'][:5]})
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
