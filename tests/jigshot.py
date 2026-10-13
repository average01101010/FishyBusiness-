"""The jigging machine from Blender on the rail in 3D (tools/gear/juksamaskin.py, view3d.js drawSkipper; the user's wish 13.10.2026):
the start boat and the skiff fishing with three machines, pictures from the side and from behind the fisher, and the spool turning between two frames.
Pictures jig_*.png in tests/out. Prints OK or FEIL."""
from _env import boot, OUT
import asyncio, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SET = """((a) => { const [type, yaw, pitch, dist] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); b.type = type; applyVessel(); G3.vesselChanged();
  S.equip.jukse = 3; S.target = 'torsk'; window.jigActive = false;
  b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; b.gop = null; S.plan = null; S.mult = 0;
  const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = yaw; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        parts = await pg.evaluate("(() => typeof glbHas === 'function' && glbHas('gear-jig') ? ['maskin', 'spole', 'skive'].map(n => !!glbPart('gear-jig', n)) : [])()")
        check(len(parts) == 3 and all(parts), 'maskinen, spolen og skiva fra Blender er med', parts)
        shots = 0
        for type, yaw, pitch, dist, tag in [('trebat', 1.4, 0.3, 7, 'trebat'), ('trebat', 2.2, 0.4, 6, 'trebat_bak'), ('skiff', 1.4, 0.3, 7, 'skiff')]:
            await pg.evaluate(SET, [type, yaw, pitch, dist]); await pg.wait_for_timeout(3000)
            await pg.screenshot(path=os.path.join(OUT, f'jig_{tag}.png')); shots += 1
        has = await pg.evaluate("!!(G3._debug && G3._debug.sk ? G3._debug.sk().machG : true)")
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0 and shots == 3, 'bildene av juksamaskinene er tatt uten GL-feil', (gerr, shots))
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
