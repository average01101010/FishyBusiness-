"""«Første tur» with the boat lying still at sea without a route (ui/07b-first-trip.js tutAdrift; Jonas 05.10.2026: «Båten stoppet midt
i ruta og nå kommer jeg ingen vei fordi jeg er låst i tutorialen og kan ikke lage ny rute til botnhamn»): on the way in to the plant
and on the way out to the grounds the guide leads to a new route and lets the chart and «Kast loss» through, and not while the boat
sails. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


SETUP = """(upto => { const ids = TSTEPS.map(s => s.id), m = {}; for (const id of ids.slice(0, ids.indexOf(upto) + 1)) m[id] = 1;
  S.tut = {v:2, m, catch:false, pAt:Date.now()}; const b = S.boat, g = tutField().p;
  b.status = 'idle'; b.port = null; b.land = null; b.tutWait = 0; b.v = 0; b.pos = {x:g.x + 0.3, y:g.y + 0.3}; S.plan = null; S.draft = []; S.hold = upto === 'cast1' ? [] : S.hold;
  if (upto === 'cast2') S.hold = [{sp:'torsk', kg:300, cls:'m', t:S.t}]; tutUpdate(); })"""
STATE = """(() => { const st = tutStep(), T = st && tutTip(st); return {drift:tutAdrift(), step:st && st.id, el:T && T.el ? (T.el.id || T.el.className) : null, noOk:!!(T && T.noOk),
  tip:T && T.no, okShown:!$('tipOk').hidden, wp:tutAllow('waypoint'), start:tutAllow('start')}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(600)
        # 1. on the way in, stopped: the guide goes back to making the route to the plant
        await pg.evaluate(SETUP + "('cast2')"); await pg.wait_for_timeout(300)
        a = await pg.evaluate(STATE)
        check(a['drift'] == 'in' and a['el'] == 'miniPlot' and a['noOk'] and not a['okShown'] and 'på nytt' in (a['tip'] or '') and a['wp'] and not a['start'],
              'stopped on the way in: the guide points to the chart plotter for a new route, the chart may be used, «Kast loss» waits for a route to the plant', a)
        b = await pg.evaluate("(() => { const q = portById(tutLand()).p; S.draft = [{x:S.boat.pos.x + 0.2, y:S.boat.pos.y + 0.2}, {x:q.x, y:q.y, port:tutLand()}]; return {start:tutAllow('start')}; })()")
        check(b['start'], 'with a route ending at the plant, «Kast loss» is let through', b)
        c = await pg.evaluate("(() => { S.plan = {wps:S.draft.slice(), idx:0}; S.boat.status = 'sailing'; return {drift:tutAdrift(), wp:tutAllow('waypoint')}; })()")
        check(c['drift'] is None and not c['wp'], 'sailing again: the guide goes on as before', c)
        # 2. on the way out, stopped before the grounds
        await pg.evaluate(SETUP + "('cast1')"); await pg.wait_for_timeout(300)
        d = await pg.evaluate(STATE)
        check(d['drift'] == 'out' and d['el'] == 'miniPlot' and d['wp'] and not d['start'], 'stopped on the way out: a new route to the grounds may be made', d)
        e = await pg.evaluate("(() => { const g = tutField().p; S.draft = [{x:g.x, y:g.y, fish:2}]; return {start:tutAllow('start')}; })()")
        check(e['start'], 'with a point in the ring and 2 hours of fishing, «Kast loss» is let through', e)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
