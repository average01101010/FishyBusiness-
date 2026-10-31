"""Screenshots of the hull's life at sea (view3d/12-skiff.js LIFE_GL, 31.10.2026): the pilot boat's side in the sun (the sky in the
paint), in a hard sea (the wet band over the waterline) and made old (the rust and the scum line, as the local fleet wears it), in
both formats. KYST_DIST=dist-old takes the same pictures of another build to compare. Prints the GL errors and the page's errors;
not in run.py. Pictures: hull_<scene>_<format>.png in tests/out/."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot
from playwright.async_api import async_playwright
TAG = os.environ.get('HULL_TAG', '')
SET = """((t) => { const b = S.boat; S.tut = 0; S.mult = 0.00001; S.t = Math.round((Date.UTC(2027, 5, 12, 14) - EPOCH) / 6e4); WX_FORCE = {w:4, d:300};
  b.type = t; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; b.v = 0; const p = P(69.62, 17.55); b.pos = {x:p.x, y:p.y}; b.heading = 1.2; })"""
CAM = "((d, p, y) => { const c = G3._debug.cam; c.helm = false; c.dist = d; c.pitch = p; c.yaw = y; })"
SCENES = [('sol', 'WX_FORCE = {w:4, d:300}; G3._debug.WV.init = false;', [34, 0.04, 1.75], 0),
          ('sjo', 'WX_FORCE = {w:20, d:160}; G3._debug.WV.init = false;', [30, 0.06, 1.6], 0),
          ('gammel', 'WX_FORCE = {w:4, d:300}; G3._debug.WV.init = false;', [26, 0.03, 2.1], 0.85),
          ('baug', 'WX_FORCE = {w:4, d:300}; G3._debug.WV.init = false;', [22, 0.02, 2.75], 0.85)]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280), 'liten': (800, 500), 'mid': (1040, 650)}
        typ = os.environ.get('HULL_TYPE', 'ringnot38')
        for tag in (sys.argv[1:] or list(FMT)):
            w, h = FMT[tag]
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            await pg.evaluate(SET, typ); await pg.wait_for_function("geoOf(%r) && geoOf(%r).skipperAt" % (typ, typ), timeout=120000)
            for name, wx, cam, age in SCENES:
                if os.environ.get('HULL_ONLY') and name not in os.environ['HULL_ONLY'].split(','): continue
                await pg.evaluate(wx); await pg.evaluate("a => { if (G3._debug.hl) G3._debug.hl.meAge = a; }", age)
                await pg.evaluate(CAM + "(%s * Math.max(0.3, VESSELS[%r].len / 38), %s, %s)" % (cam[0], typ, cam[1], cam[2])); await pg.wait_for_timeout(6000 if name == 'sjo' else 3500)
                await pg.evaluate("document.querySelectorAll('.toast,#toast').forEach(e => e.style.visibility = 'hidden')"); await pg.screenshot(path='hull_%s%s_%s.png' % (name, TAG, tag), clip={'x': w * 0.12, 'y': h * float(os.environ.get('HULL_Y', '0.2')), 'width': w * 0.76, 'height': h * 0.5})
                wl = await pg.evaluate("(() => { const W = G3._debug.wets; const w = W && W.get('me'); return w ? Array.from(w.h).map(v => +v.toFixed(2)) : null; })()")
                print(tag, name, 'wet', wl, 'gl', await pg.evaluate("G3._debug.glErr()"), flush=True)
            print(tag, 'errors', errs[:5], 'glFirst', await pg.evaluate("G3._debug.glFirst"))
            await pg.close()
        await br.close()
asyncio.run(main())
