"""Screenshots of green water running off through the scuppers (view3d/24-cinema.js scupperWater, 31.10.2026): a small boat lying
beam-on in a gale; the picture is taken when the jets are out. Prints the water on deck and the jets seen over the run, the GL errors and
the page's errors; not in run.py. Pictures: scupper_<type>_<format>.png in tests/out/."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot
from playwright.async_api import async_playwright
SET = """((t) => { const b = S.boat; S.tut = 0; S.mult = 0.00001; S.t = Math.round((Date.UTC(2027, 5, 12, 13) - EPOCH) / 6e4); WX_FORCE = {w:21, d:300};
  b.type = t; applyVessel(); G3.vesselChanged(); b.port = null; const p = P(69.75, 17.2); b.pos = {x:p.x, y:p.y}; b.status = 'idle'; b.v = 0; b.heading = 0.4; G3._debug.WV.init = false; })"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280), 'mid': (1040, 650), 'midst': (650, 1040)}
        typ = os.environ.get('SC_TYPE', 'sjark')
        for tag in (sys.argv[1:] or ['mid']):
            w, h = FMT[tag]
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            await pg.evaluate(SET, typ); await pg.wait_for_function("geoOf(%r) && geoOf(%r).skipperAt" % (typ, typ), timeout=120000)
            await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 16; c.pitch = 0.22; c.yaw = 1.3; })()")
            best, seen, shot = 0, [], False
            for k in range(60):
                await pg.wait_for_timeout(500)
                r = await pg.evaluate("({w:+G3._debug.scw.w.toFixed(2), n:G3._debug.scw.drawn || 0})"); seen.append(r['n'])
                if r['n'] > max(25, best) and not shot:
                    await pg.screenshot(path='scupper_%s_%s.png' % (typ, tag)); best = r['n']; shot = k > 20
            print(tag, typ, 'jets per frame over the run', seen, 'gl', await pg.evaluate("G3._debug.glErr()"))
            print(tag, 'errors', errs[:5], 'glFirst', await pg.evaluate("G3._debug.glFirst"))
            await pg.close()
        await br.close()
asyncio.run(main())
