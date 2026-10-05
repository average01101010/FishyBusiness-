"""Father's notebook and the dream fish (05.10.2026, core/09b-dream.js, ui/06c-notebook.js): the marks round the home harbour, finding one
by fishing on it, «Vis i kartet», the dream fish landed by the crew and by you in the fight, a halibut in its closed season, how often it
comes. Prints OK or FEIL per check, and a picture of the notebook and the fight in tests/out/."""
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
        # 1. the notebook: Father's marks round Finnsnes
        await pg.evaluate("(() => { S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 10, 10) - EPOCH) / 6e4); PHONE.open('notat'); })()")
        await pg.wait_for_function("S.notes && S.notes.marks && S.notes.marks.length >= 4 && document.querySelector('.nb-mark')", timeout=60000)
        r = await pg.evaluate("""(() => { const N = S.notes, home = portById('finnsnes'), R = {n:N.marks.length, home:N.home, bad:[]};
          for (const m of N.marks){ const d = depthF(m.p), r = dist(m.p, home.p), rng = NOTE_SP.find(x => x[0] === m.sp);
            if (isLand(m.p) || d < rng[1] - 1 || d > rng[2] + 1 || r < 1.9 || r > 12.1 || N.marks.some(o => o !== m && dist(o.p, m.p) < 1.49) || dist(m.c, m.p) > 0.36) R.bad.push([m.id, Math.round(d), +r.toFixed(1)]); }
          R.txt = document.querySelector('.ph-appv').innerText.slice(0, 400); R.sp = N.marks.map(m => m.sp); return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:500])
        print(ok(r['n'] >= 4 and r['home'] == 'finnsnes' and not r['bad'] and 'favner' in r['txt'] and 'Fars méd' in r['txt']), 'Father\'s marks lie in the water, at their depths, 2 to 12 km from Finnsnes and apart; the notebook names them in his words', r['sp'])
        await pg.screenshot(path='dream_notebook.png')
        # 2. «Vis i kartet» puts the circle on the chart; fishing on the mark finds it, and the fish bite better there
        sh = await pg.evaluate("""(() => { const m = S.notes.marks[0]; document.querySelector('[data-pa=notshow][data-id="' + m.id + '"]').click();
          const c = m.c; return {shown:!!S.notes.shown[m.id], phone:PHONE.isOpen(), center:+Math.hypot(view.cx - c.x, view.cy - c.y).toFixed(3), circle:document.querySelectorAll('#map .nbc').length}; })()""")
        print(ok(sh['shown'] and not sh['phone'] and sh['center'] < 0.01 and sh['circle'] >= 1), '«Vis i kartet» shows the circle the mark lies in on the chart', sh)
        fd = await pg.evaluate("""(() => { const m = S.notes.marks.find(x => x.sp === 'torsk') || S.notes.marks[0], b = S.boat, H = S.t / 60;
          const before = noteBoost(m.sp, m.p); b.status = 'fishing'; b.port = null; b.pos = {...m.p}; b.fishUntil = S.t + 30; b.gear = true; S.hold = [];
          window.DREAMUI_SAVE = window.DREAMUI; fish(H, windAt(H), 0.3);
          return {id:m.id, found:!!S.notes.found[m.id], before, after:noteBoost(m.sp, m.p), away:noteBoost(m.sp, {x:m.p.x + 1, y:m.p.y}), msg:S.msgs.slice(-3).map(x => x.from + ': ' + x.no).join(' | '), x:document.querySelectorAll('#map .nbx').length}; })()""")
        await pg.evaluate("renderStatic()")
        fx = await pg.evaluate("document.querySelectorAll('#map .nbx').length")
        print(ok(fd['found'] and fd['before'] == 1 and fd['after'] == 1.3 and fd['away'] == 1 and 'Notatboka' in fd['msg'] and fx >= 1), 'fishing on a mark finds it: a message, a cross on the chart, and 30 % better bites there only', fd['msg'][:80])
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
        # 5. how often: the expected number per 100 hours of jigging on Father's cod mark and on his halibut bank (found), from the chance a minute
        rt = await pg.evaluate("""(() => { const R = {}, H = S.t / 60;
          for (const sp of ['torsk', 'kveite']){ const m = S.notes.marks.find(x => x.sp === sp); if (!m) continue; S.notes.found[m.id] = S.t; const P = dreamP(H, m.p); R[sp] = {per100h:+(P.p * 6000).toFixed(1), kinds:P.ws.map(x => x[0])}; }
          return R; })()""")
        print(json.dumps(rt))
        k = rt.get('kveite', {}); t = rt.get('torsk', {})
        print(ok(t and 0.5 <= t['per100h'] <= 10 and k and k['per100h'] >= 4 * t['per100h'] and 'kveite' in k['kinds']), 'a dream fish comes now and then (0.5 to 10 expected per 100 hours on Father\'s cod mark in June), several times as often on his halibut bank', {'cod mark': t.get('per100h'), 'halibut bank': k.get('per100h')})
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
