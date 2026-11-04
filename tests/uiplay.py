"""A player plays «Det Store Blå» from a fresh start for a UI review (03.11.2026): the letter, the start picker, the boat, the whole
guided first trip (tapping the guide's ring as tut.py does), and after it a walk through every surface a player meets: the dock and
its fans, every drawer page, every phone app, the chart plotter, the deck log, the settings. A picture of each step lands in
tests/out/uiplay/<format>/NN_<step>.png, and a list of what was seen in tests/out/uiplay/<format>/steps.json.
KYST_UIPLAY_ONE=liggende|staaende plays one format only."""
from _env import GAME_TUT as GAME
import asyncio, json, os, time
from playwright.async_api import async_playwright

STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent,
    tip:$('tip').hidden ? '' : $('tipText').textContent, rod:!!window.jigActive, book:BOOK.isOpen(), st:S.boat.status,
    sleep:!$('sleep').hidden, wake:!$('sleep').hidden && !$('slSkip').hidden && !$('slSkip').disabled, ack:!$('slAck').hidden}; })())"""
OK_RING = ('deck', 'chip', 'slip', 'goal', 'hud', 'apps', 'vaer', 'salg', 'regler', 'redning', 'legs', 'beh', 'intro', 'n1')


async def play(b, W, H, tag):
    out = os.path.join('uiplay', tag); os.makedirs(out, exist_ok=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); pg.set_default_timeout(120000)
    errs, steps, n = [], [], [0]
    pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

    async def shot(name, note=''):
        n[0] += 1; f = '%02d_%s.png' % (n[0], name)
        try: await pg.screenshot(path=os.path.join(out, f), timeout=90000)
        except Exception as e: print('   shot failed', name, e); return
        steps.append({'f': f, 'note': note}); print('   ', tag, f, note[:90], flush=True)

    async def tap(x, y):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)

    async def tap_el(sel):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if r: await tap(r['x'], r['y'])
        return r

    await pg.goto(GAME)
    await pg.wait_for_selector('#ltEnv', timeout=90000); await pg.wait_for_timeout(2500); await shot('konvolutt', 'the envelope')
    await tap_el('#ltEnv'); await pg.wait_for_selector('#ltGo.on', timeout=40000); await pg.wait_for_timeout(400); await shot('brevet', 'the letter')
    await tap_el('#ltGo'); await pg.wait_for_selector('#stGo', state='visible', timeout=20000); await pg.wait_for_timeout(400); await shot('startsted', 'start picker')
    await pg.evaluate("document.querySelector('#startPick .st-it[data-id=vangshamn]').click()")
    await tap_el('#stGo'); await pg.wait_for_selector('#obGo', state='visible', timeout=60000); await pg.wait_for_timeout(400); await shot('baaten', 'the boat')
    await tap_el('#obGo'); await pg.wait_for_timeout(600)
    await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(1500)
    await pg.evaluate("S.mult = 30; save()")
    seen, stuck = [], 0
    for it in range(900):
        await pg.evaluate("if (!asleep() && S.energy < 60) S.energy = 60")
        s = json.loads(await pg.evaluate(STATE)); sid = s['id']
        if not seen or seen[-1] != sid:
            seen.append(sid); stuck = 0; await pg.wait_for_timeout(500); await shot('tut-' + str(sid), s['tip'])
        if sid is None:
            if await pg.evaluate("S.tut === 0"): break
            await pg.wait_for_timeout(500); continue
        stuck += 1
        if s['sleep']:
            if s['ack']: await tap_el('#slAck')
            elif s['wake']: await tap_el('#slSkip')
            await pg.wait_for_timeout(500); continue
        if s['book']:
            await pg.wait_for_timeout(600); await pg.evaluate("BOOK.close()"); await pg.wait_for_timeout(300); continue
        if s['rod'] and sid != 'fish':
            await pg.evaluate("JIGG.stop(); renderActs()"); continue
        if sid == 'fish' and stuck == 8: await shot('fiske-under', 'mid-fishing')
        if s['ok'] and (not s['ring'] or sid in OK_RING) and not (sid == 'slip' and not s['ring'] and s['okText'].startswith('Skjønner')):
            await tap_el('#tipOk'); await pg.wait_for_timeout(400); continue
        if s['ring']:
            await tap(s['ring']['x'], s['ring']['y']); await pg.wait_for_timeout(350); continue
        await pg.wait_for_timeout(500)
    await pg.wait_for_timeout(800); await shot('etter-tur', 'after the first trip, in harbour')
    # the dock fans in harbour
    items = json.loads(await pg.evaluate("JSON.stringify([...document.querySelectorAll('#dock .dk-b')].map(e => e.dataset.dk))"))
    print('   dock', items)
    for i in range(len(items)):
        await pg.evaluate("i => { const e = [...document.querySelectorAll('#dock .dk-b')][i]; e && e.click(); }", i)
        await pg.wait_for_timeout(700); await shot('dock-%d' % i, 'dock button ' + str(items[i]))
        await pg.evaluate("(() => { if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); document.querySelectorAll('#drawer .x, #dockFan').forEach(() => 0); })()")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    # every drawer page
    pages = json.loads(await pg.evaluate("JSON.stringify(Object.keys(typeof DRAWER !== 'undefined' ? DRAWER : {}))"))
    for p in pages:
        try:
            await pg.evaluate("p => DOCK.open(p)", p); await pg.wait_for_timeout(700); await shot('skuff-' + p, 'drawer ' + p)
        except Exception as e: print('   drawer', p, e)
    await pg.evaluate("try { DOCK.close() } catch (e) {}")
    # the phone and its apps
    await pg.evaluate("PHONE.show(false); try { DOCK.close() } catch (e) {}"); await pg.wait_for_timeout(300)
    await pg.evaluate("PHONE.show(true, 'home')"); await pg.wait_for_timeout(700); await shot('telefon', 'phone home')
    apps = json.loads(await pg.evaluate("JSON.stringify([...new Set([...document.querySelectorAll('#phone .ph-app[data-a]')].map(e => e.dataset.a))])"))
    print('   apps', apps)
    for a in apps:
        try:
            await pg.evaluate("a => PHONE.show(true, a)", a); await pg.wait_for_timeout(700); await shot('app-' + a, 'phone app ' + a)
        except Exception as e: print('   app', a, e)
    await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(300)
    # the chart plotter, the deck log
    await pg.evaluate("setBodyView(false); refreshAll()"); await pg.wait_for_timeout(1200); await shot('kartplotter', 'chart plotter')
    await pg.evaluate("setBodyView(true); refreshAll()"); await pg.wait_for_timeout(800)
    await pg.evaluate("BOOK.open()"); await pg.wait_for_timeout(900); await shot('dagbok', 'deck log')
    await pg.evaluate("BOOK.close()"); await pg.wait_for_timeout(300)
    json.dump({'steps': steps, 'tut': seen, 'errs': errs}, open(os.path.join(out, 'steps.json'), 'w'), ensure_ascii=False, indent=1)
    print('   ', tag, 'errors', errs[:5])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        one = os.environ.get('KYST_UIPLAY_ONE', '')
        if one != 'staaende': await play(b, 1280, 800, 'liggende')
        if one != 'liggende': await play(b, 800, 1280, 'staaende')
        await b.close()

asyncio.run(main())
