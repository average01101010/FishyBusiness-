"""The ultra graphics level (05.10.2026, view3d.js QUAL lvl 3; Jonas: «en ultra grafikk setting ... finne ut hvor grensa ligger for
flagship-modeller»): chosen in Settings it draws at the screen's own pixels, builds the near terrain at 384 points a side, the fine
ground at 384, the far terrain 160 km wide at 511 points (32-bit indices), the wave patch at 2 m, and draws without GL errors; back on
high it builds them as before. Auto never goes to ultra. SwiftShader draws on the CPU, so this shows that ultra is built right, not how
fast it runs on a phone (that is measured there, with «Vis bildetakt»). Pictures: ultra.png, ultra_high.png. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
STATE = """(() => { const D = G3._debug, q = G3.quality(); const m = k => { const M = D[k]; return M ? {gn:M.gn, sx:Math.round(M.sx), i32:!!M.i32} : null; };
  return {q, near:m('NEARM'), fine:m('FINEM'), terr:D.TERR ? {gn:D.TERR.gn, sx:Math.round(D.TERR.sx), i32:!!D.TERR.i32} : null, np:D.seaNP, dpr:D.dpr, err:D.glErr(), fps:Math.round(D.fps)}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # small: SwiftShader draws on the CPU, a few frames a second
        pg = await b.new_page(viewport={'width': 400, 'height': 260}, device_scale_factor=2.5); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        # the tests' #qfix holds «Høy» (_env.py): let go of it first, as lighttest does
        await pg.evaluate("(() => { G3._debug.QUAL.fix = false; PHONE.open('innst'); const b = document.querySelector('[data-pa=q3d][data-v=ultra]'); b.click(); PHONE.show(false); const c = G3._debug.cam; c.helm = false; c.dist = 60; c.pitch = 0.25; })()")
        # the dense meshes take minutes to build in SwiftShader (it only shows that they are built right, not how fast a phone is)
        await pg.wait_for_function("(() => { const D = G3._debug; return D.NEARM && D.NEARM.gn === 384 && D.FINEM && D.FINEM.gn === 384; })()", timeout=480000)
        await pg.wait_for_function("(() => { const D = G3._debug; return D.TERR && D.TERR.gn === 511; })()", timeout=480000)
        await pg.wait_for_timeout(4000)
        u = await pg.evaluate(STATE); print(json.dumps(u))
        print(ok(u['q']['lvl'] == 3 and u['q']['set'] == 'ultra' and u['q']['ultra']), 'Ultra is chosen in Settings and the device has 32-bit indices', u['q'])
        print(ok(u['near']['gn'] == 384 and u['fine']['gn'] == 384 and u['near']['i32'] and u['near']['sx'] >= 9000), 'on ultra the near terrain is 384 points a side over 9 km or more, and the fine ground 384', [u['near'], u['fine']])
        print(ok(u['terr']['gn'] == 511 and u['terr']['sx'] == 160000 and u['terr']['i32']), 'on ultra the far terrain is 160 km wide at 511 points', u['terr'])
        print(ok(u['np'] == 300 and u['dpr'] > 2.4 and u['err'] == 0), 'on ultra the wave patch is 2 m, the drawing has the screen\'s own pixels, and there are no GL errors', {'np': u['np'], 'dpr': u['dpr'], 'err': u['err']})
        await pg.screenshot(path='ultra.png', timeout=120000)
        await pg.evaluate("G3.quality('high')")
        await pg.wait_for_function("(() => { const D = G3._debug; return D.NEARM && D.NEARM.gn === 256 && D.TERR && D.TERR.gn === 255; })()", timeout=480000)
        await pg.wait_for_timeout(3000)
        h = await pg.evaluate(STATE); print(json.dumps(h))
        print(ok(h['q']['lvl'] == 2 and h['near']['gn'] == 256 and h['terr']['sx'] == 100000 and h['np'] == 150 and h['dpr'] <= 1.5 and h['err'] == 0), 'back on high the meshes, the wave patch and the pixels are as before', h)
        await pg.screenshot(path='ultra_high.png', timeout=120000)
        a = await pg.evaluate("(() => { G3.quality('auto'); const D = G3._debug; for (let i = 0; i < 200; i++) D.qualTick(0.1, 90, performance.now() + i * 100); return G3.quality().lvl; })()")
        print(ok(a <= 2), 'auto never goes to ultra', a)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
