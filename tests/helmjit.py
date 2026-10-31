# The bridge view does not shake (the user's video 09.10.2026): the eye is fixed to the hull in full precision. model() is a Float32Array,
# and the eye was taken through it with the boat's world position (around a million metres), good only to 6 to 12 cm, while the hull was
# drawn relative to it: a sawtooth some ten times a second, worse with speed. Here the eye is compared each frame with where it sits on the
# hull, worked out in double precision, at rest and under way.
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

SAMPLE = """async (n) => { const D = G3._debug, out = [];
  for (let i = 0; i < n; i++){ await new Promise(r => requestAnimationFrame(r));
    const bv = D.bv, e = D.eye, g = geoOf(S.boat.type || 'skiff').eye, cy = Math.cos(-bv.head), sy = Math.sin(-bv.head), cp = Math.cos(bv.pitch), sp = Math.sin(bv.pitch), cr = Math.cos(bv.roll), sr = Math.sin(bv.roll);
    const m = [cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr, -cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr, sy * cp, -sp, cy * cp];
    const w = [bv.x + m[0] * g[0] + m[3] * g[1] + m[6] * g[2], bv.y + m[1] * g[0] + m[4] * g[1] + m[7] * g[2], bv.z + m[2] * g[0] + m[5] * g[1] + m[8] * g[2]];
    out.push(Math.hypot(e[0] - w[0], e[1] - w[1], e[2] - w[2])); }
  return {max:Math.max(...out), mean:out.reduce((a, x) => a + x, 0) / out.length, x:D.bv.x}; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 900, 'height': 640})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(1500)
        rest = await pg.evaluate(SAMPLE, 30)
        # under way: a route out from the harbour
        await pg.evaluate("""(() => { const b = S.boat, q = portById(b.port) || nearestPort(b.pos); S.settings.autoOn = false; const p = portApproach(q) || {x:q.p.x + 1, y:q.p.y};
          S.draft = [{x:p.x + 1.5, y:p.y, port:null, fish:0}]; if (typeof routeChanged === 'function') routeChanged(); document.querySelector('[data-act=start]') && document.querySelector('[data-act=start]').click(); })()""")
        await pg.wait_for_timeout(6000)
        way = await pg.evaluate(SAMPLE, 60)
        print('rest', json.dumps(rest), 'way', json.dumps(way))
        print(ok(rest['max'] < 0.002), 'at rest the bridge eye sits exactly on the hull (under 2 mm)', rest)
        print(ok(way['max'] < 0.002), 'under way the bridge eye sits exactly on the hull, frame after frame (under 2 mm)', way)
        print(ok(not errs), 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
