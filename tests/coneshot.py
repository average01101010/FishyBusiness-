"""Screenshots of the deck lights' cones at night (view3d/06-buildings-lights.js drawWorkCones, 31.10.2026): the pilot boat lying
still on a January night in clear air, in fog and in rain, in both formats. Prints how many cones were drawn, the GL errors and the
page's errors; not in run.py. Pictures: cone_<scene>_<format>.png in tests/out/."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot
from playwright.async_api import async_playwright
TAG = os.environ.get('CONE_TAG', '')
SET = """((t) => { const b = S.boat; S.tut = 0; S.mult = 0.00001; S.t = Math.round((Date.UTC(2027, 0, 14, 21) - EPOCH) / 6e4); WX_FORCE = {w:6, d:300};
  b.type = t; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; b.v = 0; const p = P(69.62, 17.55); b.pos = {x:p.x, y:p.y}; b.heading = 1.2; })"""
CAM = "((d, p, y) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = p; c.yaw = y; })"
# the weather held by swapping the model's functions in the page (vis in km, precipitation 0-1, temperature over freezing for rain)
SCENES = [('klar', "visibility = () => 40; precipAt = () => 0;"), ('taake', "visibility = () => 2.5; precipAt = () => 0;"),
          ('regn', "visibility = () => 12; precipAt = () => 0.7; airTemp = () => 4;")]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280), 'mid': (1040, 650), 'midst': (650, 1040)}
        typ = os.environ.get('CONE_TYPE', 'ringnot38')
        for tag in (sys.argv[1:] or ['mid', 'midst']):
            w, h = FMT[tag]
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            await pg.evaluate(SET, typ); await pg.wait_for_function("geoOf(%r) && geoOf(%r).skipperAt" % (typ, typ), timeout=120000)
            d = 50 * max(0.35, await pg.evaluate("VESSELS[%r].len" % typ) / 38)
            for name, wx in SCENES:
                await pg.evaluate(wx); await pg.evaluate(CAM + "(%s, 0.16, %s)" % (d * float(os.environ.get("CONE_D", "1")), os.environ.get("CONE_YAW", "2.2"))); await pg.wait_for_timeout(4000)
                await pg.evaluate("document.querySelectorAll('.toast,#toast').forEach(e => e.style.visibility = 'hidden')")
                await pg.screenshot(path='cone_%s%s_%s.png' % (name, TAG, tag))
                print(tag, name, 'cones', await pg.evaluate("G3._debug.cones"), 'night', round(await pg.evaluate("G3._debug.env.night"), 2), 'vis', await pg.evaluate("G3._debug.env.vis"), 'gl', await pg.evaluate("G3._debug.glErr()"), flush=True)
            print(tag, 'errors', errs[:5], 'glFirst', await pg.evaluate("G3._debug.glFirst"))
            await pg.close()
        await br.close()
asyncio.run(main())
