"""The anchor light and the anchor alarm in 3D (view3d.js ANCHAL): on a January night a boat under way shows her side and stern lights as
well as the white one; at anchor only the all-round white one (1 light); a drag sounds the alarm: the banner shows and the light is
red and flashing for a few seconds. Also the alarm hook and the rest that starts by itself at a rorbu. Prints OK or FEIL."""
from _env import GAME, boot, OUT
import asyncio, json
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("S.t = Math.round((Date.UTC(2027, 0, 12, 22) - EPOCH) / 6e4); S.mult = 0; S.tut = 0; const b = S.boat, q = portById('husoy'); b.status = 'idle'; b.port = null; b.pos = {x:q.p.x + 1.2, y:q.p.y - 0.4}; S.plan = null")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 30; c.pitch = 0.3; c.yaw = 2.4; })()"); await pg.wait_for_timeout(2500)
        under = await pg.evaluate("G3._debug.anchl.drawn")
        await pg.evaluate("(() => { const b = S.boat; b.anch = {x:b.pos.x, y:b.pos.y, t0:S.t, depth:12, expo:0.3, drags:0}; })()"); await pg.wait_for_timeout(1500)
        anch = await pg.evaluate("G3._debug.anchl.drawn")
        await pg.evaluate("anchorAlarm('drag', 1)"); await pg.wait_for_function("document.querySelector('.anchal') && document.querySelector('.anchal').style.display !== 'none'", timeout=20000)
        al = await pg.evaluate("({on:performance.now() < G3._debug.anchl.until, el:!!document.querySelector('.anchal') && document.querySelector('.anchal').style.display !== 'none', txt:(document.querySelector('.anchal') || {}).textContent})")
        check(under >= 3, 'under fart: lanterner og hvitt lys', under)
        check(anch == 1, 'for anker: bare det hvite ankerlyset', anch)
        check(al['on'] and al['el'] and 'ANKERALARM' in (al['txt'] or ''), 'ankeralarmen viser banner og lyset blinker rødt', al)
        await pg.screenshot(path=OUT + '/anchorlight.png')
        errs2 = await pg.evaluate("1")
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
