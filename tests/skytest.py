"""The clouds drift in real time with the wind at their height (view3d.js cloudStep, #352): downwind (the offset taken off the sample
moves against the wind, veered 15 degrees), at 1.2 * 1.5 U / 1500 units a second, and without a jump when the wind turns.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, math
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 640, 'height': 400}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.evaluate("(() => { WX_FORCE = {w:10, d:270}; S.mult = 0; G3.show(true); })()")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(15000)   # (the wind in 3D settles to the forced one)
        a = await pg.evaluate("({off:[...G3._debug.cld.off], t:performance.now()})")
        await pg.wait_for_timeout(10000)
        b = await pg.evaluate("({off:[...G3._debug.cld.off], t:performance.now()})")
        secs = (b['t'] - a['t']) / 1000; dx, dz = b['off'][0] - a['off'][0], b['off'][1] - a['off'][1]
        # the wind from the west blows east (+x); veered 15 degrees it goes to 105 degrees: (sin, -cos) = (0.966, 0.259); the offset goes the other way
        v = (math.sin(math.radians(105)), -math.cos(math.radians(105))); rate = 1.2 * 15 / 1500
        exp = (-v[0] * rate * secs, -v[1] * rate * secs)
        check(abs(dx - exp[0]) < 0.25 * abs(exp[0]) and abs(dz - exp[1]) < 0.35 * abs(exp[1]) + 0.005, 'in 10 m/s from the west the clouds drift east-south-east at 15 m/s over a 1 500 m deck', {'secs': round(secs, 1), 'd': [round(dx, 4), round(dz, 4)], 'exp': [round(exp[0], 4), round(exp[1], 4)]})
        # the wind turns 30 degrees: the sky goes on from where it was (no jump), now the new way
        await pg.evaluate("(() => { WX_FORCE = {w:10, d:300}; })()")
        # (the path the sky went over six seconds, set against the time that went: a slow frame under SwiftShader makes up its seconds in
        # one step, which lengthens no path; a jump does)
        c0 = await pg.evaluate("({off:[...G3._debug.cld.off], t:performance.now()})"); t0 = c0['t']; path = 0
        for _ in range(12):
            await pg.wait_for_timeout(500); c1 = await pg.evaluate("({off:[...G3._debug.cld.off], t:performance.now()})")
            path += math.hypot(c1['off'][0] - c0['off'][0], c1['off'][1] - c0['off'][1]); c0 = c1
        drift = rate * (c0['t'] - t0) / 1000
        check(path - drift < 0.03, 'when the wind turns 30 degrees the clouds go on without a jump', {'path': round(path, 4), 'drift in the time': round(drift, 4)})
        await pg.screenshot(path='tests/out/skytest.png')
        print('errors:', errs[:3])
        await br.close()

asyncio.run(main())
