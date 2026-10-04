"""The chart in 2D (phase K7 of the coast plan, ui/03a-chart.js and paintChart in ui/03-map.js): zoom from the whole country to a
harbour with the coast at the level of detail for the view (coast0 from the core, coast1 and coast2 from the chart packs), the
graticule and the place names from the map packs, the chart near in agreeing with the route check (legClear takes the 25 m mask as
land), touch panning and pinching on the chart, and the time to paint each level with the CPU slowed four times (as a mid-range
phone). Lying and standing like a tablet. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# set the view (centre in km, height in km) and wait for the packs it needs; then paint with the CPU slowed and give the time
SETV = """([cx, cy, hh]) => { view.cx = cx; view.cy = cy; view.z = MAP_H / hh; applyView(); scheduleStatic(); return 1; }"""
READY = """() => { const r = svg.getBoundingClientRect(), hh = MAP_H / view.z, ww = hh * r.width / r.height, x0 = view.cx - ww / 2, y0 = view.cy - hh / 2;
  return chartLevel(hh) === 0 || ['sim', 'chart'].every(k => mapPacksIn(k, x0, y0, x0 + ww, y0 + hh).every(pk => pk.buf)); }"""
# the first picture (the tiles kept, the rest coarse) and the whole chart fine (chartFlush paints the queued tiles at once)
PAINT = """() => { clearTimeout(chartTimer); const t0 = performance.now(); paintChart(1); const t1 = performance.now(); chartFlush(); const ms = performance.now() - t0; renderStatic(); return [t1 - t0, ms]; }"""
# a canvas pixel's colour at a point of the map (km), and the names drawn
PIX = """(pts) => { const r = svg.getBoundingClientRect(), W = chartCv.width, H = chartCv.height, hh = MAP_H / view.z, ww = hh * r.width / r.height, x0 = view.cx - ww / 2, y0 = view.cy - hh / 2, c = chartCv.getContext('2d');
  return pts.map(p => { const i = Math.floor((p.x - x0) / ww * W), j = Math.floor((p.y - y0) / hh * H); if (i < 0 || j < 0 || i >= W || j >= H) return null; return Array.from(c.getImageData(i, j, 1, 1).data.slice(0, 3)); }); }"""
NAMES = "[...document.querySelectorAll('#gStatic text')].map(t => t.textContent)"
LANDC = [(232, 215, 166), (204, 214, 172), (224, 206, 150)]
SEAC = [(249, 251, 252), (167, 203, 235), (134, 180, 223), (59, 106, 165)]
near = lambda c, cs: any(sum(abs(a - b) for a, b in zip(c, q)) < 18 for q in cs)


async def run(p, w, h, tag, full):
    b = await p.chromium.launch(args=['--disable-gpu-compositing'])
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.evaluate("() => { S.settings.plotter = false; S.settings.chartNight = 'day'; openPlotter(); renderBase(); }")   # the day colours (the night ones are checked on their own)
    await pg.wait_for_function("document.body.classList.contains('vplot') && !!MAPD.core && !!MAPD.core.buf", timeout=60000)
    print('--', tag, w, 'x', h)
    P = lambda la, lo: pg.evaluate("([a, b]) => P(a, b)", [la, lo])
    home = await pg.evaluate("PORTS[0].p")
    levels = [('hele landet', 725, 900, 1800, 0), ('regionen', 850, 355, 100, 1), ('fjorden', home['x'], home['y'], 20, 1), ('havna', home['x'], home['y'], 2.2, 2)]
    times = {}; firsts = {}
    for name, cx, cy, hh, lv in levels:
        await pg.evaluate(SETV, [cx, cy, hh]); await pg.wait_for_function(READY, timeout=30000)
        await pg.evaluate(PAINT)   # the first paint unpacks the blocks and builds the paths; the second is the one a moving chart repaints
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        await pg.evaluate("() => { CT.key = ''; }")   # the tiles of the first paint go, so the time is a fresh view's
        first, ms = await pg.evaluate(PAINT)
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
        got = await pg.evaluate("chartLevel(MAP_H / view.z)"); times[name] = round(ms); firsts[name] = round(first)
        check(got == lv, name + ': detaljnivå ' + str(lv), got)
        names = await pg.evaluate(NAMES)
        if name == 'hele landet':
            pts = [await P(60.2, 7.6), await P(64.0, 13.5), await P(69.6, 19.0), await P(67.5, 6.0), await P(63.0, 2.5)]
            c = await pg.evaluate(PIX, pts)   # standing, the sea points can be off the screen (None)
            check(any(c[:3]) and all(x is None or near(x, LANDC) for x in c[:3]) and all(x is None or near(x, SEAC) or x[2] > x[0] for x in c[3:]), 'hele landet: Hardangervidda, Børgefjell og Lyngen er land (ingen sømmer mellom landbitene), Norskehavet er sjø (kysten fra kjernen)', c)
            # the four cities that are inside the view (standing, the view is narrower)
            want = await pg.evaluate("(() => { const r = svg.getBoundingClientRect(), hh = MAP_H / view.z, ww = hh * r.width / r.height; return chartNamesOf(MAPD.core, 'names0', 0.01, 0, 0).filter(q => ['Oslo', 'Bergen', 'Trondheim', 'Tromsø'].includes(q[4]) && Math.abs(q[0] - view.cx) < ww / 2 - 30 && Math.abs(q[1] - view.cy) < hh / 2 - 10).map(q => q[4]); })()")
            check(len(want) >= 3 and all(n in names for n in want), 'hele landet: byene står på kartet (navn fra kjernen)', (want, [n for n in want if n not in names]))
            grid = await pg.evaluate("CHARTV.grid")
            check(grid and grid[2] >= 4 and grid[0] >= 1, 'hele landet: gradnettet går med hele grader', grid)
            if full:
                await pg.screenshot(path='chart_land.png')
        if name == 'regionen':
            pts = [await P(69.33, 17.45)] + await pg.evaluate("GROUNDS.slice(0, 3).map(g => g.p)")
            c = await pg.evaluate(PIX, pts)
            check(c[0] and near(c[0], LANDC) and not any(x and near(x, LANDC) for x in c[1:]), 'regionen: Senja er land, tre av feltene sjø (coast1 fra kartpakkene)', c)
            fj = ('Malangen', 'Andfjorden') if full else ()   # standing, the view is narrower and the fjords' names lie outside it
            check('Senja' in names and 'Finnsnes' in names and all(n in names for n in fj), 'regionen: Senja, fjordene og byene har navn', names)
            # the night colours (the user's list 04.10.2026): the sea dark at night, light by day, and the overlay takes the dark look
            nc = []
            for m in ('night', 'day'):
                await pg.evaluate("(m) => { S.settings.chartNight = m; renderBase(); }", m); await pg.evaluate(PAINT)
                nc.append([await pg.evaluate(PIX, pts[1:]), await pg.evaluate("svg.classList.contains('plot')")])
            await pg.evaluate("() => { S.settings.chartNight = 'day'; renderBase(); }"); await pg.evaluate(PAINT)
            dark = lambda c: c is None or sum(c) < 200
            check(all(dark(x) for x in nc[0][0]) and any(nc[0][0]) and nc[0][1] and not any(x and dark(x) for x in nc[1][0]) and not nc[1][1], 'nattmodus: sjøen er mørk om natta og lys om dagen, og merkene får den mørke stilen', nc)
            if full:
                await pg.screenshot(path='chart_region.png')
        if name == 'havna':
            # near in the chart shows what legClear takes as land: compare a grid of pixels with isLand
            r = await pg.evaluate("""() => { const r = svg.getBoundingClientRect(), W = chartCv.width, H = chartCv.height, hh = MAP_H / view.z, ww = hh * r.width / r.height, x0 = view.cx - ww / 2, y0 = view.cy - hh / 2, c = chartCv.getContext('2d'), d = c.getImageData(0, 0, W, H).data, out = [];
              for (let a = 0; a < 60; a++) for (let b2 = 0; b2 < 40; b2++){ const i = Math.floor((a + 0.5) / 60 * W), j = Math.floor((b2 + 0.5) / 40 * H), o = (j * W + i) * 4; const q = {x:x0 + (i + 0.5) / W * ww, y:y0 + (j + 0.5) / H * hh}, L = isLand(q) ? 1 : 0, e = 0.015;
                // a point within 15 m of the mask's edge does not count: the chart draws that edge as a smooth line between the 25 m cells
                const edge = [[e, 0], [-e, 0], [0, e], [0, -e]].some(([u, v]) => (isLand({x:q.x + u, y:q.y + v}) ? 1 : 0) !== L); out.push([d[o], d[o + 1], d[o + 2], edge ? -1 : L]); }
              return out; }""")
            agree = n = land = 0
            for R, G, B, L in r:
                if L < 0: continue
                c = (R, G, B); isl = near(c, LANDC); iss = near(c, SEAC) and not isl
                if not (isl or iss): continue
                n += 1; agree += (isl == bool(L)); land += isl
            check(n > 1500 and agree / n >= 0.995 and 0.05 < land / n < 0.95, 'havna: kartet viser det ruta regner som land (vektorkysten med moloene, 4.19), %d av %d punkter like' % (agree, n), round(agree / max(n, 1), 4))
            check(len(names) >= 3, 'havna: stedsnavn nær inne', names[:12])
            if full:
                await pg.screenshot(path='chart_harbour.png')
    print('tegnetid med CPU strupet 4x (ms), første bilde:', json.dumps(firsts, ensure_ascii=False), 'hele kartet fint:', json.dumps(times, ensure_ascii=False))
    check(max(times.values()) < 2500, 'tegnetiden for hele kartet fint er under 2,5 s på hvert nivå med CPU strupet 4x', times)
    check(max(firsts.values()) < 600, 'det første bildet (grove fliser) kommer innen 0,6 s på hvert nivå med CPU strupet 4x', firsts)
    # dragging the chart half a view at the fjord level: the next frame has no dark or empty pixel (the tiles kept are drawn where
    # they now are, the new ones coarse), and a little later every tile is fine
    await pg.evaluate(SETV, [home['x'], home['y'], 20]); await pg.wait_for_function(READY, timeout=30000); await pg.evaluate(PAINT)
    pan = await pg.evaluate("""() => new Promise(res => { const hh = MAP_H / view.z; view.cx += hh * 0.5; applyView(); requestAnimationFrame(() => {
      const W = chartCv.width, H = chartCv.height, d = chartCv.getContext('2d').getImageData(0, 0, W, H).data; let bad = 0, n = 0;
      for (let a = 0; a < 50; a++) for (let b = 0; b < 30; b++){ const o = (Math.floor((b + 0.5) / 30 * H) * W + Math.floor((a + 0.5) / 50 * W)) * 4; n++; if (d[o + 3] < 255 || (d[o] < 40 && d[o + 1] < 50 && d[o + 2] < 60)) bad++; }
      res({bad, n, kept:CT.tiles.size}); }); })""")
    await pg.wait_for_timeout(1500)
    left = await pg.evaluate("CT.job.length")
    check(pan['bad'] == 0 and left == 0, 'kartet dras et halvt utsnitt: ingen mørke eller tomme piksler i neste bilde, og alle flisene er fine etter 1,5 s', (pan, left))

    if full:
        # touch: one finger pans the chart, two pinch it out to the whole region and beyond the old limit (0.8)
        await pg.evaluate(SETV, [home['x'], home['y'], 20]); await pg.wait_for_timeout(300)
        r = await pg.evaluate("(() => { const q = svg.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2, px:view.px, cx:view.cx, cy:view.cy}; })()")
        x, y = r['x'], r['y']
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]})
        for k in range(1, 11):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x - 20 * k, 'y': y - 10 * k, 'id': 0}]}); await asyncio.sleep(0.03)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.3)
        v = await pg.evaluate("({cx:view.cx, cy:view.cy, n:S.draft.length})")
        dx, dy = (v['cx'] - r['cx']) * r['px'], (v['cy'] - r['cy']) * r['px']
        check(abs(dx - 200) < 12 and abs(dy - 100) < 12 and v['n'] == 0, 'berøring: én finger drar kartet 200 x 100 px uten å sette et punkt', (round(dx), round(dy)))
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x - 200, 'y': y, 'id': 0}, {'x': x + 200, 'y': y, 'id': 1}]})
        for k in range(1, 13):
            s = 200 - 15 * k
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x - s, 'y': y, 'id': 0}, {'x': x + s, 'y': y, 'id': 1}]}); await asyncio.sleep(0.03)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.4)
        z = await pg.evaluate("view.z")
        want = (await pg.evaluate("MAP_H")) / 200   # 20 km tall, fingers from 400 to 40 px apart
        check(z < 0.8 and abs(z / want - 1) < 0.1, 'berøring: to fingre knipser kartet ut forbi den gamle grensen', (round(z, 3), round(want, 3)))
        await pg.wait_for_timeout(600)
        await pg.screenshot(path='chart_pinch.png')
    check(not errs, 'ingen sidefeil', errs[:3])
    await b.close()


async def main():
    async with async_playwright() as p:
        await run(p, 1280, 800, 'liggende', True)
        await run(p, 800, 1280, 'stående', False)

asyncio.run(main())
