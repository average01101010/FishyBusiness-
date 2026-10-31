"""The measuring run for the boat models (docs/planer/grafikk-batmodeller.md F0, view3d G3.bench): your boat drawn k times over and
more boats round her, each set-up timed and shown in a table on the screen. Here only that the run works (two set-ups each way), not
the numbers: SwiftShader says nothing about a tablet. Picture benchshot.png. Prints OK or FEIL."""
from _env import boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        await pg.evaluate("(() => { const b = S.boat; b.type = 'kyst15'; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; S.mult = 0; })()")
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate("G3.bench([1, 4], [0, 3])")
        rows = r['rows'] if r else []
        await pg.screenshot(path='benchshot.png')
        print('bench:', r)
        check(len(rows) == 4 and all(x['ms'] > 0 and x['tris'] > 0 for x in rows), 'the run times every set-up and counts the triangles', [(x['k'], x['n'], x['tris'], x['ms']) for x in rows])
        t = {(x['k'], x['n']): x['tris'] for x in rows}
        check(t.get((4, 0)) == 4 * t.get((1, 0), -1) and t.get((1, 3)) == 4 * t.get((1, 0), -1), 'k draws her k times, n adds n boats at today\'s detail', t)
        st = await pg.evaluate("({on:G3._debug.cam && true, table:!!document.getElementById('benchOut')})")
        check(st['table'], 'the table stays on the screen until it is tapped', st)
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
