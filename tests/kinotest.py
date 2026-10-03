"""The cinema (view3d.js KINO, 08-actions.js kinoUi; the user's wish 03.10.2026): under way off Senja with «Kino» on, the camera goes
through its shots (drone, low along the side, from ahead, from the shore, wide, from behind), each with the eye clear of the land and
the sea and the boat in sight; «Skjul» hides the HUD and the buttons but the two cinema buttons; the camera button ends the cinema.
A picture per shot: kino_<shot>.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # under way over the first fishing ground on a June day (open water: off Finnsnes the Gisund bridge hid half the shots)
        await pg.evaluate("""(() => { S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); const b = S.boat, g = GROUNDS[0].p; b.status = 'sailing'; b.port = null;
          b.pos = {x:g.x, y:g.y}; b.heading = 1.2; S.plan = {wps:[{x:b.pos.x + Math.sin(1.2) * 6, y:b.pos.y - Math.cos(1.2) * 6, port:null, fish:0}], idx:0, speed:8, returning:false}; })()""")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.click('#kinoBtn'); await pg.wait_for_timeout(2500)
        seen = {}
        for i in range(6):
            await pg.evaluate("G3._debug.kinoNext()"); await pg.wait_for_timeout(2500)
            k = await pg.evaluate("G3._debug.kino")
            if k: seen[k['type']] = k; await pg.screenshot(path='kino_%s.png' % k['type'])
        bad = {t: (round(k['up'], 1), round(k['free'], 2)) for t, k in seen.items() if k['up'] < 0.3 or k['free'] < 0.85}
        check(len(seen) >= 5, 'kino går gjennom opptakene', sorted(seen))
        check(not bad, 'i hvert opptak er øyet over land og sjø, og båten er i bildet uten land imellom', bad or {t: round(k['d']) for t, k in seen.items()})
        await pg.click('#kinoHud'); await pg.wait_for_timeout(400)
        vis = await pg.evaluate("['hud', 'dock', 'phoneFab', 'compass3d', 'kinoBtn', 'kinoHud'].map(id => { const e = document.getElementById(id); return id + ':' + (e && getComputedStyle(e).display !== 'none' ? 1 : 0); })")
        check(vis == ['hud:0', 'dock:0', 'phoneFab:0', 'compass3d:0', 'kinoBtn:1', 'kinoHud:1'], '«Skjul» tar bort statusboksen, knappene og kompasset, men ikke kinoknappene', vis)
        await pg.screenshot(path='kino_clean.png')
        await pg.click('#kinoHud'); await pg.wait_for_timeout(300)
        await pg.click('#camBtn'); await pg.wait_for_timeout(500)
        st = await pg.evaluate("[G3.kino(), document.body.classList.contains('kino-clean'), document.getElementById('kinoHud').hidden]")
        check(st == [False, False, True], 'kameraknappen avslutter kino', st)
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
