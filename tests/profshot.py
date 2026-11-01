"""The profile of a frame (docs/planer/grafikk-batmodeller.md F1, view3d G3.prof, #prof): the parts of the frame timed on the main
thread (and on the GPU where the browser has the timer), and the frame with one part left out or at another pixel density. Here only
that the run works (a few set-ups), not the numbers: SwiftShader says nothing about a tablet. Picture profshot.png. Prints OK or FEIL."""
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
        r = await pg.evaluate("G3.prof([['som nå', {}], ['tomt bilde', {skip:{all:1}}], ['tetthet 0,75', {dpr:0.75}], ['uten sjø', {skip:{sea:1}}], ['synk per del', {sync:true}]])")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='profshot.png')
        rows = {x['set']: x for x in r['rows']} if r else {}
        print('prof:', {k: (v['ms'], v['js'], v['gpu'], v['px']) for k, v in rows.items()}, 'gl', r and r['gl'], 'timer', r and r['timer'])
        print('secs:', r and r['secs'])
        check(len(rows) == 5 and all(x['ms'] > 0 and x['js'] > 0 for x in rows.values()), 'every set-up is timed, the frame and its main thread', [(k, x['ms'], x['js']) for k, x in rows.items()])
        s = (r or {}).get('secs', {})
        check(all(k in s for k in ('upd', 'sky', 'farT', 'farSea', 'nearT', 'boat', 'obj', 'nearSea', 'fx')) and sum(v['js'] for v in s.values()) > 0 and all(v['sync'] is not None for v in s.values()), 'the parts of the frame are timed, also with a pixel read back at each mark', s)
        e, f = rows.get('tomt bilde', {}), rows.get('som nå', {})
        check(e and f and e['js'] < f['js'], 'the empty frame costs the main thread less than the full one', (e.get('js'), f.get('js')))
        d = rows.get('tetthet 0,75', {}).get('px', '0×0').split('×')
        check(int(d[0]) < 960 and int(d[0]) > 0, 'the pixel density is set for the set-up', rows.get('tetthet 0,75', {}).get('px'))
        st = await pg.evaluate("(() => { const el = document.getElementById('profOut'); return {table:!!el, live:el ? /Nå \\(siste 2 s\\)/.test(el.textContent) : false, px:G3._debug.dpr}; })()")
        check(st['table'] and st['live'], 'the table stays on the screen with the parts live until it is tapped', st)
        await pg.click('#profOut'); await pg.wait_for_timeout(300)
        gone = await pg.evaluate("!document.getElementById('profOut')")
        check(gone, 'a tap closes it')
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
