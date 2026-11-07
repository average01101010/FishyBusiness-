"""A vertical swipe over a slider scrolls the panel and leaves the value (ui/08-actions.js rangeTouch, spilltest 2: the speed slider in the
route panel caught swipes). Chromium moves the thumb to the finger on touch down and sends pointercancel when the swipe becomes a scroll;
the slider then gets its value back, and the panel is let go (pressHold) so it shows the clock again. A sideways drag still moves it.
Portrait 800x1280 and landscape 1280x800, touch through CDP.
Prints OK or FEIL."""
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = """(() => { S.tut = 0; setTab('route'); const a = S.boat.pos;
  S.draft = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({x:a.x + 0.5 + i * 0.4, y:a.y - 0.3 - i * 0.2}));
  if (G3.isActive()) G3.show(false); setBodyView(false); renderRouteTools(); applyView(); panelDirty = true; panelHtml = ''; renderPanel(); })()"""
# the slider in the middle of the panel's height, the panel scrolled so it can go both ways
AT = """(() => { const s = $('spd'); panel.scrollTop = Math.max(0, s.offsetTop - panel.offsetTop - panel.clientHeight / 2); const r = s.getBoundingClientRect();
  return {x:r.x, y:r.y, w:r.width, h:r.height, st:panel.scrollTop, v:s.value, sp:S.draftSpeed}; })()"""

async def run(p, w, h, errs):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True)
    pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    await pg.evaluate(SETUP)
    await pg.wait_for_selector('#spd', state='visible')
    cdp = await ctx.new_cdp_session(pg)
    async def drag(x0, y0, x1, y1):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0}]})
        for i in range(1, 13):
            await cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + (x1 - x0) * i / 12, 'y': y0 + (y1 - y0) * i / 12}]})
            await asyncio.sleep(0.02)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        await asyncio.sleep(0.5)
    s0 = await pg.evaluate(AT); cx, cy = s0['x'] + s0['w'] * 0.3, s0['y'] + s0['h'] / 2
    # the events of the swipe, to read when it fails (the cancel can come to what lies under the finger, not to the slider)
    await pg.evaluate("window.EV = []; for (const k of ['pointerdown', 'pointercancel', 'pointerup', 'touchstart', 'touchend', 'input', 'change']) window.addEventListener(k, e => EV.push(k + ':' + ($('spd') ? $('spd').value : '-') + ':' + (e.target.id || e.target.tagName) + ':' + (e.pointerId != null ? e.pointerId : '')), true)")
    await drag(cx, cy, cx, cy + 150)
    s1 = await pg.evaluate("({st:panel.scrollTop, v:$('spd').value, sp:S.draftSpeed, hold:pressHold, ev:EV.join(' ')})")
    s2 = await pg.evaluate(AT); cy = s2['y'] + s2['h'] / 2
    await drag(s2['x'] + s2['w'] * 0.9, cy, s2['x'] + s2['w'] * 0.1, cy + 3)
    s3 = await pg.evaluate("({st:panel.scrollTop, v:$('spd').value, sp:S.draftSpeed})")
    await pg.screenshot(path=os.path.join(OUT, 'slider_%dx%d.png' % (w, h)))
    print('%dx%d' % (w, h), json.dumps({'start': s0, 'swipe': s1, 'drag0': s2, 'drag': s3}))
    print(ok(s1['st'] < s0['st'] - 50 and s1['v'] == s0['v'] and s1['sp'] == int(s0['v'])), '%dx%d: a vertical swipe over the slider scrolls the panel and keeps the speed' % (w, h), [s0['st'], s1['st'], s0['v'], s1['v'], s1['sp']])
    print(ok(not s1['hold']), '%dx%d: the panel is free to show the clock again after the swipe (pressHold)' % (w, h), s1['hold'])
    print(ok(s3['v'] != s2['v'] and s3['sp'] == int(s3['v'])), '%dx%d: a sideways drag moves the slider' % (w, h), [s2['v'], s3['v'], s3['sp']])
    await b.close()

async def main():
    errs = []
    async with async_playwright() as p:
        await run(p, 800, 1280, errs); await run(p, 1280, 800, errs)
    print('sidefeil:', errs[:5])
asyncio.run(main())
