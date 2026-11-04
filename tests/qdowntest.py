"""The 3D level a device has shown it cannot hold (view3d/00-head.js QM, 04.11.2026; Jonas: «3d nivå skal senkes automatisk om det må
det»), on auto (no «#qfix»): a page that stopped while it drew 3D (another page's beat 60 s old) takes the next start one level down;
a context lost in play takes it one more and is remembered for the reload; two hangs of 6 s within ten minutes take a fresh device down;
a level chosen by hand is left as it is. Prints OK or FEIL per check."""
import asyncio, json
from playwright.async_api import async_playwright
from _env import *

AUTO = BASE + 'index.html' + ('#seed=' + SEED if SEED != '0' else '') + '#notut'


def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


async def in3d(pg):
    await pg.evaluate("() => { if (!G3.isActive()) G3.show(true); }")
    await pg.wait_for_function("G3.isActive()", timeout=180000)
    await pg.wait_for_function("G3._debug.qm.beat", timeout=120000, polling=1000)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        # 1. a crash in 3D and a lost context
        ctx = await b.new_context(viewport={'width': 1000, 'height': 700}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, AUTO); await in3d(pg)
        first = await pg.evaluate("() => G3._debug.qm")
        check(first['cap'] == 3 and not first['last'], 'a fresh device has no cap', first)
        await ctx.close()
        # (a new device whose storage has the beat of a page that stopped 60 s ago while it drew 3D)
        ctx = await b.new_context(viewport={'width': 1000, 'height': 700})
        await ctx.add_init_script("if (!sessionStorage.getItem('qd_seed')){ sessionStorage.setItem('qd_seed', '1'); localStorage.setItem('dsb_q3d_alive', JSON.stringify({qother: Date.now() - 60000})); }")
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, AUTO); await in3d(pg)
        r = await pg.evaluate("() => ({qm: G3._debug.qm, lvl: G3._debug.QUAL.lvl, st: JSON.parse(localStorage.getItem('dsb_qdown') || 'null'), alive: Object.keys(JSON.parse(localStorage.getItem('dsb_q3d_alive') || '{}'))})")
        check(r['qm']['cap'] == 1 and r['qm']['last'] == 'krasj' and r['lvl'] <= 1, 'a page that stopped in 3D takes the start one level down', r)
        check(r['st'] and r['st']['lvl'] == 1 and r['st']['why'] == 'krasj', 'the device remembers it', r['st'])
        check('qother' not in r['alive'] and len(r['alive']) == 1, 'the stopped page\'s beat is taken away, this one beats', r['alive'])
        await pg.evaluate("() => { const c = document.getElementById('gl'); const g = c.getContext('webgl2') || c.getContext('webgl'); g.getExtension('WEBGL_lose_context').loseContext(); }")
        await pg.wait_for_function("JSON.parse(localStorage.getItem('dsb_qdown') || '{}').why === 'kontekst'", timeout=30000)
        r = await pg.evaluate("() => ({qm: G3._debug.qm, st: JSON.parse(localStorage.getItem('dsb_qdown') || 'null'), alive: Object.keys(JSON.parse(localStorage.getItem('dsb_q3d_alive') || '{}'))})")
        check(r['qm']['cap'] == 0 and r['st']['lvl'] == 0, 'a context lost in play takes it one more', r)
        check(not r['alive'], 'a lost context takes the beat away (not a crash next time)', r['alive'])
        await ctx.close()
        # 2. two hangs on a fresh device
        ctx = await b.new_context(viewport={'width': 1000, 'height': 700}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, AUTO); await in3d(pg)
        for k in range(2):
            await pg.evaluate("() => { const t = performance.now(); while (performance.now() - t < 6000); }")
            await pg.wait_for_timeout(3000)
        await pg.wait_for_function("G3._debug.qm.last === 'heng'", timeout=60000, polling=1000)
        r = await pg.evaluate("() => ({qm: G3._debug.qm, st: JSON.parse(localStorage.getItem('dsb_qdown') || 'null')})")
        check(r['qm']['cap'] < 3 and r['st']['why'] == 'heng', 'two hangs take auto one level down', r)
        # 3. a level chosen by hand stays
        r = await pg.evaluate("() => { S.settings.q3d = 'high'; const was = G3._debug.qm.cap, did = G3._debug.qmDown('test'); return {did, was, now: G3._debug.qm.cap, lvl: G3._debug.QUAL.lvl}; }")
        check(r['did'] is False and r['now'] == r['was'], 'a level chosen by hand is not touched', r)
        await ctx.close()
        check(not errs, 'no page errors', errs[:3])
        await b.close()
asyncio.run(main())
