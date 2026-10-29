"""The boat's wake in a turn and astern, and the foam by a breakwater (Jonas 29.10.2026, Bleik: the propeller foam drifted through the
breakwater as a straight line; the boat's waves should turn with the foam behind her, ahead and astern). By hand off Bleik's harbour:
ahead, a hard turn, then astern; a picture from above after each, and the foam map's count of wake foam on land (none). Prints OK or
FEIL per check; pictures in tests/out/wake_*.png."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        q = await pg.evaluate("""async () => { const q = P(69.2765, 15.9425); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
          b.pos = {x:q.x, y:q.y}; b.heading = Math.PI * 0.9; b.v = 0; S.settings.manual = true; if (!G3.isActive()) G3.show(true); return q; }""")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
        async def leg(name, thr, rud, secs):
            await pg.evaluate("([t, r]) => { helmTake(); S.helm.thr = t; S.helm.rud = r; }", [thr, rud])
            await pg.wait_for_timeout(secs * 1000)
            await pg.evaluate("() => { const c = G3._debug.cam; c.helm = false; c.dist = 260; c.pitch = 1.15; }"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=os.path.join(OUT, f'wake_{name}.png'))
            return await pg.evaluate("() => { const D = G3._debug, F = D.foam; return {kn: +(S.helm.v || 0).toFixed(1), u: S.boat.dyn ? +S.boat.dyn.u.toFixed(2) : null, foam: F ? {ok: F.ok, G: F.G.map(v => +v.toFixed(1)), cur: F.cur && [+(+F.cur.x).toFixed(2), +(+F.cur.y).toFixed(2)]} : null}; }")
        R = {}
        R['ahead'] = await leg('ahead', 0.7, 0, 14)
        R['turn'] = await leg('turn', 0.7, 0.8, 12)
        R['astern'] = await leg('astern', -0.5, 0, 16)
        print(json.dumps(R))
        check(R['ahead']['foam'] and R['ahead']['foam']['ok'], 'the foam map is on')
        check(R['astern']['u'] is not None and R['astern']['u'] < -0.3, 'she goes astern by hand', R['astern']['u'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
