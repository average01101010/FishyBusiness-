"""The app for the home screen (P1 of the PWA plan, 03.10.2026; build.mjs with KYST_PWA=1, src/pwa/): it builds dist-pwa/ itself and
serves it over HTTP (a service worker runs on localhost). The page has the manifest with three icons; the service worker takes over on
the second load and keeps the map packs in its cache; offline the game opens again from the cache; the saved game goes out as a code
from Innstillinger and comes back from it (the artifact and the app keep their own storage). Prints OK or FEIL."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-pwa')
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    env = dict(os.environ, KYST_PWA='1'); env.pop('KYST_DIST', None)
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=env, capture_output=True, text=True)
    check(r.returncode == 0 and os.path.exists(os.path.join(ROOT, 'dist-pwa', 'sw.js')), 'dist-pwa/ bygges med KYST_PWA=1', r.stdout.strip().splitlines()[-1:] or r.stderr[-300:])
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1100, 'height': 760}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        man = await pg.evaluate("fetch('manifest.webmanifest').then(r => r.json()).then(m => ({name:m.name, icons:m.icons.length, display:m.display, link:!!document.querySelector('link[rel=manifest]')}))")
        check(man['link'] and man['icons'] == 3 and man['name'] == 'Det Store Blå', 'siden har manifestet med navn og tre ikoner', man)
        await pg.evaluate("navigator.serviceWorker.ready.then(() => true)")
        await pg.reload(); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000); await pg.wait_for_timeout(3000)
        sw = await pg.evaluate("(async () => ({ctl:!!navigator.serviceWorker.controller, packs:(await (await caches.open('kyst-map')).keys()).length, page:(await caches.keys()).filter(k => k.startsWith('kyst-page-')).length}))()")
        check(sw['ctl'] and sw['packs'] > 0 and sw['page'] == 1, 'service workeren tar over ved neste last, og kartpakkene ligger i mellomlageret', sw)
        await ctx.set_offline(True)
        await pg.reload(); ok = True
        try: await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=60000)
        except Exception: ok = False
        off = await pg.evaluate("({sim:typeof SIMREADY !== 'undefined' && SIMREADY, boat:S && S.boat && S.boat.status})") if ok else None
        check(ok and off['sim'], 'uten nett åpner spillet igjen fra mellomlageret', off)
        await ctx.set_offline(False)
        # the save as a code, out from Innstillinger and back in
        await pg.evaluate("(() => { S.cash = 123456; save(); PHONE.open('innst'); document.querySelector('[data-pa=saveOut]').click(); })()")
        await pg.wait_for_function("document.getElementById('saveCode') && document.getElementById('saveCode').value.startsWith('KYST2:')", timeout=10000)
        code = await pg.evaluate("document.getElementById('saveCode').value")
        await pg.evaluate("(() => { S.cash = 1; save(); document.querySelector('[data-pa=saveIn]').click(); })()")
        await pg.fill('#saveCode', code)
        await pg.evaluate("document.querySelector('[data-pa=saveLoad]').click()")
        await pg.wait_for_timeout(2500); await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        cash = await pg.evaluate("S.cash")
        check(code.startswith('KYST2:') and cash == 123456, 'lagringen går ut som en kode fra Innstillinger og kommer tilbake fra den', (len(code), cash))
        bad = await pg.evaluate("loadCode('KYST2:tull').then(() => 'ok', () => 'avvist')")
        check(bad == 'avvist', 'en kode som ikke kan leses, avvises', bad)
        print('errors:', [e for e in errs if 'fonts' not in e][:5])
        await b.close()


asyncio.run(main())
