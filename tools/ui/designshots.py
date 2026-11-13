"""Pictures of every menu for a design review (Jonas 13.11.2026: «bilder av UI, UX, GUI fra alle butikker, menyer, undermenyer, skuffer
og alt»): each drawer page, the phone's home and each app, the deck log, and the screen in harbour, upright (800 x 1280) and wide
(1280 x 800). Before and after a redesign the same script gives the same pictures.

    node build.mjs
    KYST_LITE=1 python3 tools/ui/designshots.py            -> tests/out/design/<nn>-<name>-<staaende|liggende>.png (JPEG beside, for sending)
    python3 tools/ui/designshots.py hud                    -> only the screen in harbour and at sea, with 3D drawn
"""
import os, sys, asyncio, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'tests'))
from _env import boot, OUT
from playwright.async_api import async_playwright
from PIL import Image

DIR = os.path.join(OUT, 'design'); os.makedirs(DIR, exist_ok=True)
SIZES = [('staaende', 800, 1280), ('liggende', 1280, 800)]
# the drawer's pages by where they are met: the tackle shop, the plant, the yard, aboard
DRAWER = [('fiske', 'finnsnes'), ('utstyrb', 'finnsnes'), ('service', 'finnsnes'), ('lever', 'botnhamn'), ('is', 'botnhamn'), ('agn', 'botnhamn'), ('oppdrag', 'botnhamn'),
          ('fartoy', 'finnsnes'), ('utstyr', 'finnsnes'), ('maler', 'finnsnes'), ('verksted', 'finnsnes'), ('mannskap', 'finnsnes'), ('bors', 'finnsnes'), ('bank', 'finnsnes'),
          ('havn', 'finnsnes'), ('redskap', 'finnsnes'), ('rigg', 'finnsnes'), ('last', 'finnsnes'), ('beholdning', 'finnsnes'), ('drift', 'finnsnes'), ('arbeid', 'finnsnes')]
APPS = ['vaer', 'post', 'meld', 'rederi', 'salg', 'kvote', 'regler', 'ordl', 'nett', 'kaiboden', 'haill', 'sesong', 'guide', 'folk', 'merker', 'redning', 'trim', 'handbok', 'garderobe', 'patch', 'tilbake', 'innst']


async def main():
    hud = 'hud' in sys.argv; n = [0]; errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for tag, w, h in SIZES:
            pg = await b.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); n[0] = 0
            async def shot(name):
                n[0] += 1; f = os.path.join(DIR, '%s%02d-%s-%s' % ('hud' if hud else '', n[0], name, tag))
                await pg.screenshot(path=f + '.png'); Image.open(f + '.png').convert('RGB').save(f + '.jpg', quality=82)
            async def safe(js, name, wait=350):
                try: await pg.evaluate(js); await pg.wait_for_timeout(wait); await shot(name)
                except Exception as e: print('FEIL', name, tag, str(e)[:160])
            try: await pg.wait_for_function("() => { const e = document.getElementById('pic-items'); return !!e && !e.dataset.src; }", timeout=90000)
            except Exception: pass
            await pg.evaluate("S.cash = 500000; S.boat.status = 'port'; S.crew = S.crew || []; renderActs()"); await pg.wait_for_timeout(hud and 6000 or 400)
            await shot('havn')
            if hud:
                await pg.close(); continue
            for page, port in DRAWER:
                await safe("(() => { const b = S.boat, q = portById('%s'); if (b.port !== q.id){ b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; } DOCK.open('%s'); })()" % (port, page), 'skuff-' + page)
            await pg.evaluate("DOCK.close()")
            await safe("PHONE.show(true)", 'telefon-hjem')
            for a in APPS: await safe("PHONE.open('%s')" % a, 'app-' + a)
            await safe("PHONE.open('nett'); document.querySelector('#phone [data-pa=sub][data-s=shop]').click()", 'app-nett-butikk')
            await pg.evaluate("PHONE.show(false)")
            await safe("BOOK.open()", 'dekksdagbok', 600)
            await pg.close()
        await b.close()
    print('sidefeil', errs[:5]); print(len(os.listdir(DIR)), 'filer i', DIR)

asyncio.run(main())
