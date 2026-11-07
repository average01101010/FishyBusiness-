"""The sea ice in the page (H1b R5, core/03h-is.js, data/is.json): a goal in the ice is refused by Autonav with the reason (for
a boat with ice class 1C with the limit of her class, H3c; under it the search goes on, which is not waited for), a whole route round the ice in March (H1b R6: open water
at both ends, the straight line through the ice; every leg clear of it, and the time it takes), the drift ice in the chart plotter
and the Weather app's ice card, and screenshots of the plotter by Svalbard in March in both formats. tests/unit/is.test.mjs checks the
month, the edge, the sailing and the router's checks without a page; this checks that the page has them. Prints OK or FEIL per check."""
from _env import OUT, boot
import os, asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

GOAL = r"""(async ([a, b, cls]) => { S.t = (Date.UTC(2027, 2, 15, 12) - EPOCH) / 6e4; BOAT.iceClass = cls || undefined; const t0 = performance.now(); let out = null;
  leiaRoute(P(...a), P(...b), null, null).then(r => { out = r; }, e => { out = {err:String(e)}; });
  for (let i = 0; i < 30 && !out; i++) await new Promise(r => setTimeout(r, 100)); BOAT.iceClass = undefined;
  return {ms:Math.round(performance.now() - t0), why:out && out.why ? out.why[0] : null, done:!!out}; })"""

PLOT = r"""(async ([la, lo, hh]) => { S.t = (Date.UTC(2027, 2, 15, 12) - EPOCH) / 6e4; S.settings.chartNight = 'day'; if (!document.body.classList.contains('vplot')) openPlotter();
  const c = P(la, lo); view.cx = c.x; view.cy = c.y; view.z = MAP_H / hh; applyView(); scheduleStatic(); paintChart(1); await new Promise(r => setTimeout(r, 1500)); paintChart(1); await new Promise(r => setTimeout(r, 800));
  return {ice:!!CT.ice, w:CT.ice ? CT.ice.width : 0}; })"""

# (H1b R6) a whole route round the ice: from the open south of the Barents Sea to open water west of Spitsbergen in March, the first goal
# whose straight line crosses the ice; started without returning its promise, then polled (a long route outlives evaluate's wait)
ROUND = r"""(() => { S.t = (Date.UTC(2027, 2, 15, 12) - EPOCH) / 6e4; const H = S.t / 60, A = P(72.6, 30.0); let B = null;
  for (let la = 74.5; la <= 78 && !B; la += 0.5) for (let lo = 8; lo <= 16 && !B; lo += 1){ const q = P(la, lo); if (isLandFar(q) || seaIceAt(q, H) > 10 || coastDistFar(q) < 15) continue; if (seaIceOnLeg(A, q, H, {})) B = q; }
  window.__ice = null; if (!B){ window.__ice = {err:'no pair'}; return 0; }
  S.boat.status = 'idle'; S.boat.port = null; S.boat.pos = {...A}; const t0 = performance.now();
  leiaRoute(A, B, null, null).then(r => { const ms = Math.round(performance.now() - t0); if (r.why){ window.__ice = {why:r.why[0], ms}; return; }
    let p0 = A, hit = 0, maxIce = 0; for (const w of r.wps){ if (seaIceOnLeg(p0, w, H, {})) hit++; const n = Math.ceil(dist(p0, w) / 1); for (let i = 0; i <= n; i++) maxIce = Math.max(maxIce, seaIceAt({x:p0.x + (w.x - p0.x) * i / n, y:p0.y + (w.y - p0.y) * i / n}, H)); p0 = w; }
    window.__ice = {ms, n:r.wps.length, nm:+r.nm.toFixed(0), crow:+(dist(A, B) / NM).toFixed(0), hit, maxIce:Math.round(maxIce), by:r.st.by, slice:+r.st.maxSlice.toFixed(0), B:natLL(B)}; }, e => { window.__ice = {err:String(e).slice(0, 200)}; });
  return 1; })()"""

VAER = r"""(async () => { const b = S.boat; S.t = (Date.UTC(2027, 2, 15, 12) - EPOCH) / 6e4; b.pos = P(78.0, 30.0); b.status = 'idle'; b.port = null;
  PHONE.show(true); PHONE.open('vaer'); PHONE.render(); await new Promise(r => setTimeout(r, 200)); const t = document.getElementById('phView').innerText;
  const card = [...document.querySelectorAll('#phView .ph-card')].find(c => /Drivis her/.test(c.textContent)); if (card) card.scrollIntoView({block:'center'});
  return {card:!!card, shut:/stengt uten isklasse/.test(t), src:/Copyright EUMETSAT/.test(t), at:Math.round(seaIceAt(b.pos))}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        g = await pg.evaluate(GOAL, [[76.0, 24.0], [78.8, 28.0], None])
        print(ok(g['why'] and 'drivisen' in g['why']), 'a goal in the ice (Kong Karls land in March) is refused with the reason (%s ms):' % g['ms'], g['why'])
        # (H3c: the ice class is a limit, 6/10 for 1C, not free going: Kong Karls land at 9/10 is refused with the class' limit. That a goal
        # under it is searched for, is in tests/unit/is.test.mjs: a search here goes on in the background and gets in the way of the next)
        c = await pg.evaluate(GOAL, [[76.0, 24.0], [78.8, 28.0], '1C'])
        print(ok(c['why'] and 'Isklassen 1C går opp til 6/10' in c['why']), 'a boat with ice class 1C: the goal at 9/10 is refused with the limit of her class', c)
        await pg.evaluate(ROUND); r = None
        for _ in range(240):
            r = await pg.evaluate("window.__ice")
            if r: break
            await asyncio.sleep(0.5)
        print(ok(r and not r.get('why') and not r.get('err') and r['hit'] == 0 and r['maxIce'] < 40 and r['nm'] > r['crow'] and r['ms'] < 10000), 'Autonav goes round the ice in March, every leg clear of it (the straight line crosses it):', r)
        v = await pg.evaluate(VAER)
        print(ok(v['card'] and v['shut'] and v['src']), 'the Weather app shows the drift ice where the boat is, shut, and the source', v)
        await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, 'is-vaer-liggende.png'))
        for w, h, tag in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
            await pg.set_viewport_size({'width': w, 'height': h})
            q = await pg.evaluate(PLOT, [77.5, 25.0, 700])
            print(ok(q['ice']), 'the chart plotter draws the drift ice by Svalbard in March (%s)' % tag, q)
            await pg.screenshot(path=os.path.join(OUT, 'is-plotter-%s.png' % tag))
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
