from _env import GAME, boot
# The boot barrier (11-boot.js): after a reload the time away is played only when the depths are in, and the clock does not step before.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY === true", timeout=30000)
        t0 = await pg.evaluate("(() => { S.boatName = 'Prøve'; save(); window.removeEventListener('pagehide', save); window.save = () => {}; const o = JSON.parse(localStorage.getItem(KEY)); o.lastReal = Date.now() - 2 * 3600e3; localStorage.setItem(KEY, JSON.stringify(o)); return o.t; })()")
        # watch the reload: before the depths are in, the clock must stand
        await pg.add_init_script("window.__early = []; const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S) window.__early.push([S.t, typeof SIMREADY !== 'undefined' && SIMREADY, typeof DEPTH !== 'undefined' && !!DEPTH]); } catch (e) {} if (window.__early.length > 400) clearInterval(iv); }, 5);")
        await pg.reload()
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY === true", timeout=60000)
        r = await pg.evaluate("({t:S.t, away:!!document.querySelector('#modal:not([hidden]) .log, #modal:not([hidden]) h2'), depth:!!DEPTH, early:window.__early})")
        early = r['early']; before = [e for e in early if not e[1]]
        stood = all(e[0] == t0 for e in before); moved = r['t'] - t0
        print(json.dumps({'t0': t0, 'moved': moved, 'samplesBefore': len(before), 'stood': stood, 'depth': r['depth'], 'awayModal': r['away']}))
        print(ok(len(before) > 0 and stood), 'before the depths are in, the clock stands')
        print(ok(r['depth'] and 715 <= moved <= 730 and r['away']), 'then the two hours away are played (720 game minutes) with the depths loaded, and «Mens du var borte» shows')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
