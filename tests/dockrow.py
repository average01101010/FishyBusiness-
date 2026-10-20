"""The sea's button row on narrow phones (Adrian #78, 20.10.2026: eight buttons in 256 px ran out over the deck log's tab and the phone
button on a 352 px iPhone upright): every button inside the screen and clear of the tab, the phone button and the info line, upright and
on its side, and the jig card and the inventory's sheet above the rows when they open (upright; on its side the sheet stands at the side).
Pictures dock_<w>x<h>[_<button>].png in tests/out. Prints OK or FEIL."""
import asyncio, os, json
from _env import boot, OUT
from playwright.async_api import async_playwright

OUTD = OUT
SIZES = [(352, 711), (390, 844), (711, 352), (844, 390), (800, 1280)]
# at sea with the most buttons: jig rig, a line set, crew aboard, a plan to anchor
SET = """(() => { const b = S.boat, g = GROUNDS[0].p; S.tut = 0; b.type = 'sjark'; applyVessel(); b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0;
  b.rig = 'juksa'; b.gear = true; S.equip = Object.assign(S.equip || {}, {linehaler:true}); S.pgear = newPGear(); S.pgear.lines.bank.n = 4; S.pgear.lines.bank.baited = 4;
  const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null}); S.crew = [hand(), hand()]; S.hold = [];
  setBodyView(true); refreshAll(); renderActs(); })()"""
MEASURE = """(() => { const R = e => { if (!e || !e.offsetParent) return null; const r = e.getBoundingClientRect(); return r.width > 1 ? {l:r.left, t:r.top, r:r.right, b:r.bottom} : null; };
  const hit = (a, b) => a && b && a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
  const btns = [...document.querySelectorAll('#dock .dk-b')].map(e => ({k:e.dataset.dk, r:R(e)})).filter(x => x.r), W = innerWidth, H = innerHeight;
  const lb = R(document.getElementById('logbook')), ph = R(document.getElementById('phoneFab')), inf = R(document.getElementById('dockInfo'));
  const out = btns.filter(x => x.r.l < 0 || x.r.r > W || x.r.b > H).map(x => x.k), onLog = btns.filter(x => hit(x.r, lb)).map(x => x.k), onPh = btns.filter(x => hit(x.r, ph)).map(x => x.k);
  const onInfo = btns.filter(x => hit(x.r, inf)).map(x => x.k), ov = []; for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) if (hit(btns[i].r, btns[j].r)) ov.push(btns[i].k + '/' + btns[j].k);
  return {n:btns.length, rows:new Set(btns.map(x => Math.round(x.r.t))).size, dkx:getComputedStyle(document.body).getPropertyValue('--dkx'), out, onLog, onPh, onInfo, ov, info:inf ? document.getElementById('dockInfo').textContent.slice(0, 40) : null}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        bad = 0
        for w, h in SIZES:
            ctx = await br.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=w < 900, device_scale_factor=2)
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            await pg.evaluate(SET); await pg.wait_for_timeout(1500)
            m = await pg.evaluate(MEASURE)
            ok = not (m['out'] or m['onLog'] or m['onPh'] or m['onInfo'] or m['ov'] or errs); bad += not ok
            print(('OK  ' if ok else 'FEIL'), f'{w}x{h}: knappene innenfor og fri', json.dumps(m, ensure_ascii=False), errs[:2], flush=True)
            await pg.screenshot(path=os.path.join(OUTD, f'dock_{w}x{h}.png'))
            # what opens above the row: the jig card over its button, and the inventory's sheet
            for k, sel in (('jukse', '#dockFan'), ('beh', '#drawer')):
                await pg.evaluate("(k) => { const e = document.querySelector('#dock [data-dk=' + k + ']'); if (e) e.click(); }", k); await pg.wait_for_timeout(700)
                o = await pg.evaluate("""(sel) => { const R = e => { if (!e || !e.offsetParent || e.hidden) return null; const r = e.getBoundingClientRect(); return r.width > 1 ? r : null; }, f = R(document.querySelector(sel));
                  const hit = [...document.querySelectorAll('#dock .dk-b')].filter(e => { const r = e.getBoundingClientRect(); return f && r.left < f.right - 1 && f.left < r.right - 1 && r.top < f.bottom - 1 && f.top < r.bottom - 1; }).map(e => e.dataset.dk);
                  return {shown:!!f, hit}; }""", sel)
                ok2 = o['shown'] and (not o['hit'] or (k == 'beh' and w > h)); bad += not ok2
                print(('OK  ' if ok2 else 'FEIL'), f'{w}x{h}: {k} åpner over radene', o, flush=True)
                await pg.screenshot(path=os.path.join(OUTD, f'dock_{w}x{h}_{k}.png'))
                await pg.evaluate("(() => { if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); document.body.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true})); })()"); await pg.wait_for_timeout(400)
            await ctx.close()
        await br.close()
        print(('OK  ' if not bad else 'FEIL') + ' knapperaden på sjøen holder seg innenfor skjermen og fri av det som står rundt, i alle størrelsene', bad)

asyncio.run(main())
