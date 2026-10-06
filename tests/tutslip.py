"""«Første tur» on the landing note step (ui/07b-first-trip.js 'slip', ui/07-guide.js portSlip; tilbakemelding #15): the note used to go
after four game hours, and the guide's «Vis sluttseddelen» then opened a page without it and stayed. Now the note stays while the guide
waits for it, and after the first trip it goes after four hours as before. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


# the guide on 'slip', the boat at the quay of the first trip's plant, and a landing note from ten game hours ago
SETUP = """(() => { const ids = TSTEPS.map(s => s.id), m = {}; for (const id of ids.slice(0, ids.indexOf('land') + 1)) m[id] = 1;
  S.tut = {v:2, m, catch:false, pAt:Date.now()}; const b = S.boat, q = portById(tutLand()).p;
  b.status = 'port'; b.port = tutLand(); b.land = null; b.shift = null; b.v = 0; b.pos = {x:q.x, y:q.y}; S.plan = null; S.hold = [];
  S.lastSale = {port:tutLand(), t:S.t - 600, lines:[{sp:'torsk', c:0, g:'A', kg:120, sum:3000}], total:3000, ex:{}, lott:0, tk:{sum:0}, gear:['juksa']};
  tutUpdate(); })()"""
STATE = """(() => { const st = tutStep(); return {step:st && st.id, ok:$('tipOk').textContent, okShown:!$('tipOk').hidden, slip:!!document.querySelector('#drawerBody .slipt')}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(600)
        await pg.evaluate(SETUP); await pg.wait_for_timeout(300)
        a = await pg.evaluate(STATE)
        check(a['step'] == 'slip' and a['okShown'] and a['ok'] in ('Vis sluttseddelen', 'Show the landing note'), 'the guide is on the landing note step and offers to show it', a)
        await pg.click('#tipOk'); await pg.wait_for_timeout(800)
        b = await pg.evaluate(STATE)
        check(b['slip'] and b['step'] == 'slip', 'ten game hours after the landing, «Vis sluttseddelen» opens the note', b)
        await pg.click('#tipOk'); await pg.wait_for_timeout(300)
        c = await pg.evaluate(STATE)
        check(c['step'] == 'goal', 'with the note shown, «Skjønner» goes on to the next goal', c)
        # a landing note that is not here: the step can still be passed
        await pg.evaluate(SETUP + "; S.lastSale = null; tutUpdate();"); await pg.wait_for_timeout(300)
        d = await pg.evaluate(STATE)
        await pg.click('#tipOk'); await pg.wait_for_timeout(300)
        e = await pg.evaluate(STATE)
        check(d['step'] == 'slip' and d['okShown'] and e['step'] == 'goal', 'without a landing note here, the step is passed with «Skjønner»', [d, e])
        # after the first trip, the note goes after four game hours as before
        f = await pg.evaluate("(() => { S.tut = 0; S.lastSale = {port:S.boat.port, t:S.t - 600, lines:[], total:0, ex:{}}; const a = portSlip(); S.lastSale.t = S.t - 10; return {old:a.length, fresh:portSlip().length}; })()")
        check(f['old'] == 0 and f['fresh'] > 0, 'after the first trip, a note older than four hours is no longer shown', f)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
