"""The dream fish (05.10.2026, core/09b-dream.js, ui/06c-notebook.js): Father's notebook is gone (09.10.2026); the dream fish landed by the
crew and by you in the fight, a halibut in its closed season, how often it comes. Prints OK or FEIL per check, and pictures of the fight."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # 1. Father's notebook and his marks are gone (Jonas 09.10.2026): no app, nothing on the chart, the bites as anywhere else
        await pg.evaluate("(() => { S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 10, 10) - EPOCH) / 6e4); renderStatic(); })()")
        gone = await pg.evaluate("(() => ({app:!!document.querySelector('[data-pa=open][data-a=notat]'), nb:typeof noteBoost, marks:document.querySelectorAll('#map .nbx, #map .nbc').length}))()")
        print(ok(not gone['app'] and gone['nb'] == 'undefined' and gone['marks'] == 0), 'Father\'s notebook and marks are gone', gone)
        # 3. the dream fish: the crew lands a ling; a halibut in its closed season goes back
        cr = await pg.evaluate("""(() => { const b = S.boat; S.hold = []; S.trophies = []; S.dream = {sp:'lange', kg:22.4, t:S.t, p:{...b.pos}}; const r = dreamEnd(true, true);
          const kv = S.t; S.t = Math.round((Date.UTC(2028, 1, 10, 10) - EPOCH) / 6e4); S.dream = {sp:'kveite', kg:96, t:S.t, p:{...b.pos}}; const r2 = dreamEnd(true, true); S.t = kv;
          return {won:r.won, hold:S.hold.filter(x => x.sp === 'lange').reduce((a, x) => a + x.kg, 0), halibutHold:S.hold.filter(x => x.sp === 'kveite').length, rel:r2.rel, tro:S.trophies.map(t => t.sp + ' ' + t.kg + (t.rel ? ' rel' : '')), post:S.msgs.slice(-1)[0].from}; })()""")
        print(ok(cr['won'] and abs(cr['hold'] - 22.4) < 0.01 and cr['rel'] and cr['halibutHold'] == 0 and len(cr['tro']) == 2 and cr['post'] == 'Kystposten'), 'a dream fish goes in the hold and on the trophy wall, and in Kystposten; a halibut in its closed season goes back', cr['tro'])
        # 4. the fight: let go when it runs and before the line goes red, and the halibut is gaffed; hold on all the time, and the line parts
        await pg.evaluate("""(() => { const b = S.boat; S.hold = []; window.DREAMSPD = 4; S.dream = {sp:'kveite', kg:128, t:S.t, p:{...b.pos}}; DREAMUI.start();
          window.POL = () => { const s = DREAMUI.state(); if (!s || s.res) return; DREAMUI._hold(s.run <= 0 && s.ten < 0.7); requestAnimationFrame(POL); }; requestAnimationFrame(POL); })()""")
        await pg.wait_for_timeout(1500); await pg.screenshot(path='dream_fight.png')
        await pg.wait_for_function("DREAMUI.state() && DREAMUI.state().res", timeout=90000)
        f1 = await pg.evaluate("(() => { const s = DREAMUI.state(); return {res:s.res, t:+s.t.toFixed(1), hold:S.hold.filter(x => x.sp === 'kveite').reduce((a, x) => a + x.kg, 0), tro:S.trophies.length, txt:document.querySelector('#dreamUI .dr-h').textContent}; })()")
        await pg.screenshot(path='dream_landed.png')
        print(ok(f1['res']['won'] and f1['res']['why'] == 'gaff' and abs(f1['hold'] - 128) < 0.01 and f1['tro'] == 3 and 15 <= f1['t'] <= 200), 'playing the fish well lands the halibut (into the hold and onto the wall)', {k: f1[k] for k in ('t', 'txt')})
        await pg.evaluate("""(() => { DREAMUI.close(); const b = S.boat; S.dream = {sp:'sei', kg:20, t:S.t, p:{...b.pos}}; DREAMUI.start();
          window.POL2 = () => { const s = DREAMUI.state(); if (!s || s.res) return; DREAMUI._hold(true); requestAnimationFrame(POL2); }; requestAnimationFrame(POL2); })()""")
        await pg.wait_for_function("DREAMUI.state() && DREAMUI.state().res", timeout=60000)
        f2 = await pg.evaluate("(() => { const s = DREAMUI.state(); DREAMUI.close(); return {res:s.res, t:+s.t.toFixed(1), tro:S.trophies.length, dream:S.dream}; })()")
        print(ok(not f2['res']['won'] and f2['res']['why'] == 'snap' and f2['tro'] == 3 and f2['dream'] is None), 'holding on all the time parts the line', f2['res']['why'])
        # 5. how often: the expected number per 100 hours of jigging on the cod ground nearest the home harbour, from the chance a minute
        rt = await pg.evaluate("""(() => { const H = S.t / 60, home = portById(S.home || HOME0), g = GROUNDS.slice().sort((a, c) => dist(a.p, home.p) - dist(c.p, home.p))[0]; const P = dreamP(H, g.p);
          return {per100h:+(P.p * 6000).toFixed(1), kinds:P.ws.map(x => x[0])}; })()""")
        print(json.dumps(rt))
        print(ok(rt['per100h'] <= 10), 'a dream fish comes now and then (at most 10 expected per 100 hours on a ground near home in June)', rt)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
