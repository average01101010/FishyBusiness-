"""A player plays «Det Store Blå» from a fresh start for a UI review (03.11.2026): the letter, the start picker, the boat, the whole
guided first trip (tapping the guide's ring as tut.py does), and after it a walk through every surface a player meets: the dock and
its fans, every drawer page, every phone app, the chart plotter, the deck log, the settings. A picture of each step lands in
tests/out/uiplay/<format>/NN_<step>.png, and a list of what was seen in tests/out/uiplay/<format>/steps.json.
Landscape only by default (Jonas 04.11.2026); KYST_UIPLAY_ONE=staaende plays upright, KYST_UIPLAY_ONE= both, and
KYST_UIPLAY_SIZE=390x844:tlf one size of its own (a phone upright, UI 2)."""
from _env import GAME_TUT as GAME
import asyncio, json, os, time
from playwright.async_api import async_playwright

STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent,
    tip:$('tip').hidden ? '' : $('tipText').textContent, rod:!!window.jigActive, book:BOOK.isOpen(), st:S.boat.status,
    sleep:!$('sleep').hidden, wake:!$('sleep').hidden && !$('slSkip').hidden && !$('slSkip').disabled, ack:!$('slAck').hidden}; })())"""
# the design census of one picture: the type sizes, families, colours, corner radii and button looks on the screen
CENSUS = """(() => {
      const vis = e => { if (!e.getClientRects().length) return false; const s = getComputedStyle(e); return s.visibility !== 'hidden' && s.display !== 'none'; };
      const C = {size:{}, fam:{}, color:{}, bg:{}, radius:{}, btn:{}};
      const add = (o, k) => o[k] = (o[k] || 0) + 1;
      for (const e of document.querySelectorAll('body *')){ if (!vis(e)) continue;
        const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); const s = getComputedStyle(e);
        if (own){ add(C.size, s.fontSize); add(C.fam, s.fontFamily.split(',')[0]); add(C.color, s.color); }
        if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') add(C.bg, s.backgroundColor);
        if (s.borderRadius !== '0px') add(C.radius, s.borderRadius);
        if (e.tagName === 'BUTTON') add(C.btn, [s.fontSize, s.fontWeight, s.borderRadius, s.backgroundColor].join(' '));
      }
      return C; })()"""
OK_RING = ('deck', 'chip', 'slip', 'goal', 'hud', 'apps', 'vaer', 'salg', 'regler', 'redning', 'legs', 'beh', 'intro', 'n1')


async def play(b, W, H, tag):
    out = os.path.join('uiplay', tag); os.makedirs(out, exist_ok=True)
    ctx = await b.new_context(viewport={'width': W, 'height': H}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); pg.set_default_timeout(120000)
    errs, steps, n, census, seen = [], [], [0], {}, []
    pg.on('pageerror', lambda e: errs.append({'at': steps[-1]['f'] if steps else '', 'err': (getattr(e, 'stack', '') or str(e))[:600]}))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

    async def shot(name, note=''):
        n[0] += 1; f = '%02d_%s.png' % (n[0], name)
        try: await pg.screenshot(path=os.path.join(out, f), timeout=90000)
        except Exception as e: print('   shot failed', name, e); return
        try:
            c = await pg.evaluate(CENSUS)
            for k, o in c.items():
                for v, m in o.items(): census.setdefault(k, {}).setdefault(v, {'n': 0, 'shots': 0}); census[k][v]['n'] += m; census[k][v]['shots'] += 1
        except Exception as e: print('   census failed', e)
        steps.append({'f': f, 'note': note}); print('   ', tag, f, note[:90], flush=True)
        # written after every picture, so a run that is stopped (the 2 h limit under SwiftShader, 06.11.2026) still leaves its census
        json.dump(census, open(os.path.join(out, 'census.json'), 'w'), indent=1)
        json.dump({'steps': steps, 'tut': seen, 'errs': errs, 'done': False}, open(os.path.join(out, 'steps.json'), 'w'), ensure_ascii=False, indent=1)

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
    stuck = 0
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

    # ---------- the walk: every surface a player meets, with a design census of each picture ----------
    async def clear():
        await pg.evaluate("""(() => { try { PHONE.show(false) } catch (e) {} try { DOCK.close() } catch (e) {} try { BOOK.isOpen() && BOOK.close() } catch (e) {}
          try { PUB3.isOpen() && PUB3.close() } catch (e) {} try { NAUST3D.isOpen() && NAUST3D.close() } catch (e) {} try { WARD.isOpen() && WARD.close() } catch (e) {}
          for (let i = 0; i < 4; i++){ const m = document.getElementById('modal'); if (!m || m.hidden) break; const b = [...m.querySelectorAll('button')].filter(e => e.offsetParent); (b[0] || {click(){}}).click(); } })()""")
        await pg.wait_for_timeout(350)

    async def tabs(sel, name):
        """Click each tab under `sel` (the drawer's tab row, an app's sub tabs) and take a picture of each but the first."""
        k = await pg.evaluate("s => [...document.querySelectorAll(s)].filter(e => e.offsetParent).length", sel)
        for i in range(1, min(k, 7)):
            lab = await pg.evaluate("([s, i]) => { const e = [...document.querySelectorAll(s)].filter(e => e.offsetParent)[i]; if (!e) return ''; e.click(); return e.textContent.trim().slice(0, 20); }", [sel, i])
            await pg.wait_for_timeout(500); await shot(name + '-fane%d' % i, name + ' tab ' + lab)

    async def scrolled(box, name):
        """A second picture at the foot of a box that scrolls, when there is more below the first screen."""
        more = await pg.evaluate("s => { const e = document.querySelector(s); if (!e || e.scrollHeight <= e.clientHeight + 40) return false; e.scrollTop = e.scrollHeight; return true; }", box)
        if more: await pg.wait_for_timeout(300); await shot(name + '-bunn', name + ' scrolled to the foot')

    await clear(); await shot('havn-ren', 'in harbour, nothing open')
    # the dock and its fans: each button, and each small button in a fan
    items = json.loads(await pg.evaluate("JSON.stringify([...document.querySelectorAll('#dock .dk-b')].map(e => e.dataset.dk))"))
    print('   dock', items)
    for d in items:
        await clear()
        await pg.evaluate("d => { const e = document.querySelector('#dock .dk-b[data-dk=\"' + d + '\"]'); e && e.click(); }", d)
        await pg.wait_for_timeout(700); await shot('dock-' + d, 'dock button ' + d)
        fan = json.loads(await pg.evaluate("JSON.stringify([...document.querySelectorAll('#dockFan .dk-b')].filter(e => e.offsetParent).map(e => e.dataset.dk))"))
        for f in fan:
            await clear()
            await pg.evaluate("d => { const e = document.querySelector('#dock .dk-b[data-dk=\"' + d + '\"]'); e && e.click(); }", d); await pg.wait_for_timeout(400)
            await pg.evaluate("f => { const e = document.querySelector('#dockFan .dk-b[data-dk=\"' + f + '\"]'); e && e.click(); }", f)
            await pg.wait_for_timeout(800); await shot('vifte-%s-%s' % (d, f), 'fan ' + d + ' > ' + f)
            await tabs('#drawerTabs button', 'vifte-%s-%s' % (d, f)); await scrolled('#drawerBody', 'vifte-%s-%s' % (d, f))
    # every drawer page
    pages = json.loads(await pg.evaluate("JSON.stringify([...PHONE.DRAWER])"))
    for p in pages:
        await clear()
        try:
            await pg.evaluate("p => DOCK.open(p)", p); await pg.wait_for_timeout(700); await shot('skuff-' + p, 'drawer ' + p)
            await tabs('#drawerTabs button', 'skuff-' + p); await scrolled('#drawerBody', 'skuff-' + p)
        except Exception as e: print('   drawer', p, e)
    # every phone app (all of them, also those a new player does not see yet)
    await clear(); await pg.evaluate("PHONE.show(true, 'home')"); await pg.wait_for_timeout(700); await shot('telefon', 'phone home')
    for a in ['vaer', 'post', 'meld', 'rederi', 'salg', 'kvote', 'regler', 'drift', 'ordl', 'nett', 'kaiboden', 'haill', 'sesong', 'guide', 'folk', 'merker', 'redning', 'trim', 'handbok', 'garderobe', 'patch', 'tilbake', 'innst']:
        await clear()
        try:
            if a == 'garderobe':   # the wardrobe is a sheet of its own (ui/10g-wardrobe.js, WARD), opened from the phone by the act 'open'
                await pg.evaluate("PHONE.show(false); WARD.open()"); await pg.wait_for_timeout(1200); await shot('app-' + a, 'the wardrobe sheet'); continue
            await pg.evaluate("a => PHONE.show(true, a)", a); await pg.wait_for_timeout(700); await shot('app-' + a, 'phone app ' + a)
            await tabs('#phone [data-pa="sub"], #phone [data-pa$="tab"], #phone .kb-tab', 'app-' + a)
        except Exception as e: print('   app', a, e)
    # the deck log and its tabs, the chart plotter, the pub in 3D
    await clear(); await pg.evaluate("BOOK.open()"); await pg.wait_for_timeout(900); await shot('dagbok', 'deck log')
    await tabs('.bk-tab', 'dagbok')
    await clear(); await pg.evaluate("setBodyView(false); refreshAll()"); await pg.wait_for_timeout(1200); await shot('kartplotter', 'chart plotter')
    await pg.evaluate("(() => { const r = document.getElementById('ecRoute'); if (r && r.offsetParent) r.click(); })()"); await pg.wait_for_timeout(800); await shot('kartplotter-rute', 'chart plotter, route')
    await pg.evaluate("setBodyView(true); refreshAll()"); await pg.wait_for_timeout(800)
    await clear()
    try:
        await pg.evaluate("PUB3.open()"); await pg.wait_for_timeout(4000); await shot('pub', 'the pub in 3D')
    except Exception as e: print('   pub', e)
    await clear()

    json.dump(census, open(os.path.join(out, 'census.json'), 'w'), indent=1)
    json.dump({'steps': steps, 'tut': seen, 'errs': errs, 'done': True}, open(os.path.join(out, 'steps.json'), 'w'), ensure_ascii=False, indent=1)
    print('   ', tag, 'errors', errs[:5])
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        one = os.environ.get('KYST_UIPLAY_ONE', 'liggende')   # landscape only while the UI is being reviewed (Jonas 04.11.2026); KYST_UIPLAY_ONE= plays both
        size = os.environ.get('KYST_UIPLAY_SIZE', '')   # one size of its own, as «390x844:tlf» (UI 2, U2-0: the phone upright, 06.11.2026)
        if size:
            wh, tag = size.split(':') if ':' in size else (size, size); W, H = (int(v) for v in wh.lower().split('x'))
            await play(b, W, H, tag)
        else:
            if one != 'staaende': await play(b, 1280, 800, 'liggende')
            if one != 'liggende': await play(b, 800, 1280, 'staaende')
        await b.close()

asyncio.run(main())
