"""The sea ice in the page (H1b R5, core/03h-is.js, data/is.json): a goal in the ice is refused by Autonav with the reason (and not for
a boat with an ice class: then the search goes on, which is not waited for), the drift ice in the chart plotter
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
        c = await pg.evaluate(GOAL, [[76.0, 24.0], [78.8, 28.0], '1C'])
        print(ok(not c['why']), 'not for a boat with an ice class', c)
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
