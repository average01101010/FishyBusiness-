"""Pictures of every menu for a design review (Jonas 13.11.2026: «bilder av UI, UX, GUI fra alle butikker, menyer, undermenyer, skuffer
og alt»): each drawer page, the phone's home and each app, the deck log, and the screen in harbour, upright (800 x 1280) and wide
(1280 x 800). Before and after a redesign the same script gives the same pictures.

    node build.mjs
    KYST_LITE=1 python3 tools/ui/designshots.py            -> tests/out/design/<nn>-<name>-<staaende|liggende>.png (JPEG beside, for sending)
    python3 tools/ui/designshots.py hud                    -> only the screen in harbour and at sea, with 3D drawn
    python3 tools/ui/designshots.py hud telefon liggende   -> only the phone over 3D (D5), one format alone
    KYST_LITE=1 python3 tools/ui/designshots.py d6         -> the dialogs, the tip, the toast (tools/ui/scener.py) and the wardrobe
"""
import os, sys, asyncio, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'tests'))
from _env import boot, OUT, GAME_RO
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scener import SCENES, SLOW
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
    hud = 'hud' in sys.argv; d6 = 'd6' in sys.argv; n = [0]; errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for tag, w, h in [z for z in SIZES if not ({'staaende', 'liggende'} & set(sys.argv)) or z[0] in sys.argv]:   # (`hud kort liggende`: one format alone)
            pg = await b.new_page(viewport={'width': w, 'height': h}); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); n[0] = 0
            async def shot(name):
                n[0] += 1; f = os.path.join(DIR, '%s%02d-%s-%s' % ('hud' if hud else 'd6' if d6 else 'rest' if 'rest' in sys.argv else '', n[0], name, tag))
                await pg.screenshot(path=f + '.png', timeout=600000 if hud else 30000); Image.open(f + '.png').convert('RGB').save(f + '.jpg', quality=82)
            async def safe(js, name, wait=350):
                try: await pg.evaluate(js); await pg.wait_for_timeout(wait); await shot(name)
                except Exception as e: print('FEIL', name, tag, str(e)[:160])
            try: await pg.wait_for_function("() => { const e = document.getElementById('pic-items'); return !!e && !e.dataset.src; }", timeout=90000)
            except Exception: pass
            await pg.evaluate("S.cash = 500000; S.boat.status = 'port'; S.crew = S.crew || []; renderActs()"); await pg.wait_for_timeout(hud and 6000 or 400)
            if d6:
                for name, op, root, cl in SCENES:
                    try: await pg.evaluate(op); await pg.wait_for_timeout(SLOW.get(name, 350) + 250); await shot(name)
                    except Exception as e: print('FEIL', name, tag, str(e)[:160])
                    try: await pg.evaluate(cl)
                    except Exception: pass
                await safe("WARD.open()", 'garderoben', 2500)
                for i in range(1, 4): await safe("(() => { const t = document.querySelectorAll('.wd-tab')[%d]; if (t) t.click(); })()" % i, 'garderoben-fane%d' % (i + 1), 600)
                await pg.close(); continue
            await shot('havn')
            if hud:
                # the screen with 3D drawn: in harbour, a shop, the paint shop and the phone over it, at sea, the chart plotter, a route
                if 'telefon' in sys.argv:   # (`hud telefon`, D5: only the phone over 3D, its home screen and one app, in harbour and at sea)
                    await safe("PHONE.show(true)", 'telefon-over-3d', 3000); await safe("PHONE.open('salg')", 'telefon-app-over-3d', 3000); await pg.evaluate("PHONE.show(false)")
                    await safe("(() => { const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; refreshAll(); PHONE.show(true); })()", 'telefon-til-sjos', 8000)
                    await pg.close(); continue
                if 'kort' not in sys.argv:   # (`hud kort`: only harbour, at sea and the plotter; a 3D picture takes minutes in the test environment)
                    await safe("DOCK.open('fiske')", 'butikk-over-3d', 3000); await safe("DOCK.open('maler')", 'maler-over-3d', 3000); await pg.evaluate("DOCK.close()")
                    await safe("PHONE.show(true)", 'telefon-over-3d', 3000); await pg.evaluate("PHONE.show(false)")
                await safe("(() => { const b = S.boat, g = GROUNDS[0].p; b.status = 'idle'; b.port = null; b.pos = {x:g.x, y:g.y}; b.v = 0; refreshAll(); })()", 'til-sjos', 8000)
                if 'kort' not in sys.argv: await safe("(() => { const e = document.querySelector('#dock button'); })()", 'til-sjos-knapper', 500)
                # (D6: by day too, so the compass and the strip are seen against snow and hills, not only the winter morning's dark)
                await safe("(() => { let best = S.t, el = -99; for (let m = 0; m < 1440; m += 20){ const e = sunAt((S.t + m) / 60, S.boat.pos).el; if (e > el){ el = e; best = S.t + m; } } S.t = best; refreshAll(); })()", 'til-sjos-dag', 8000)
                await safe("openPlotter()", 'kartplotter', 4000)
                if 'kort' not in sys.argv: await safe("(() => { const r = document.getElementById('ecRoute'); if (r && r.offsetParent) r.click(); })()", 'rute', 1500)
                await pg.close(); continue
            if 'rest' in sys.argv:
                # the tabs under each page and app (every tab after the first), and the deck log's tabs
                TABS = "[...document.querySelectorAll('%s .ph-sub button, %s .dr-tabs button, %s .ph-tabs button')].filter(e => e.offsetParent)"
                async def tabs(root, name):
                    try: k = await pg.evaluate("(" + TABS % (root, root, root) + ").length")
                    except Exception: k = 0
                    for i in range(1, min(k, 7)):
                        await safe("(() => { const t = " + TABS % (root, root, root) + "; if (t[%d]) t[%d].click(); })()" % (i, i), name + '-fane%d' % (i + 1))
                for page, port in DRAWER:
                    try: await pg.evaluate("(() => { const b = S.boat, q = portById('%s'); if (b.port !== q.id){ b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; } DOCK.open('%s'); })()" % (port, page)); await pg.wait_for_timeout(250)
                    except Exception: continue
                    await tabs('#drawerBody', 'skuff-' + page)
                await pg.evaluate("DOCK.close()")
                for a in APPS + ['garderobe']:
                    try: await pg.evaluate("PHONE.show(true); PHONE.open('%s')" % a); await pg.wait_for_timeout(250)
                    except Exception as e: print('FEIL åpne', a, str(e)[:80]); continue
                    await tabs('#phone', 'app-' + a)
                await safe("PHONE.open('nett'); document.querySelector('#phone [data-pa=sub][data-s=megler]').click()", 'app-nett-megler')
                await pg.evaluate("PHONE.show(false)")
                await pg.evaluate("BOOK.open()"); await pg.wait_for_timeout(500)
                nb = await pg.evaluate("document.querySelectorAll('.bk-tab').length")
                for i in range(1, nb): await safe("document.querySelectorAll('.bk-tab')[%d].click()" % i, 'dagbok-fane%d' % (i + 1), 500)
                await pg.close()
                # the opening: the loader, the first screen, and what meets a new player after «Start» (the letter, the first tip)
                pg = await b.new_page(viewport={'width': w, 'height': h}); pg.set_default_timeout(120000)
                await pg.goto(GAME_RO); await pg.wait_for_timeout(600); await shot('aapning-innlasting')
                try:
                    await pg.wait_for_selector('#obGo', state='visible', timeout=90000); await shot('aapning-forste-skjerm')
                    await pg.click('#obGo'); await pg.wait_for_timeout(2500); await shot('aapning-etter-start')
                    await pg.wait_for_timeout(6000); await shot('aapning-litt-senere')
                except Exception as e: print('FEIL åpning', tag, str(e)[:120])
                await pg.close(); continue
            for page, port in ([] if 'apper' in sys.argv else DRAWER):   # (`apper`, D5: only the phone's home screen and its apps)
                await safe("(() => { const b = S.boat, q = portById('%s'); if (b.port !== q.id){ b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; } DOCK.open('%s'); })()" % (port, page), 'skuff-' + page)
            await pg.evaluate("DOCK.close()")
            await safe("PHONE.show(true)", 'telefon-hjem')
            for a in APPS: await safe("PHONE.open('%s')" % a, 'app-' + a)
            await safe("PHONE.open('nett'); document.querySelector('#phone [data-pa=sub][data-s=shop]').click()", 'app-nett-butikk')
            await pg.evaluate("PHONE.show(false)")
            if 'apper' in sys.argv:
                for a, i in (('regler', 1), ('regler', 2), ('kvote', 1), ('kvote', 2), ('kvote', 3), ('salg', 1), ('salg', 2), ('merker', 1), ('merker', 3), ('ordl', 1), ('naustp', 0), ('drift', 0), ('gbook', 0), ('logg', 0)):
                    await safe("PHONE.open('%s'); (() => { const t = [...document.querySelectorAll('#phone .ph-sub button')]; if (%d && t[%d]) t[%d].click(); })()" % (a, i, i, i), 'app-%s-fane%d' % (a, i + 1))
                await pg.evaluate("PHONE.show(false)"); await pg.close(); continue
            await safe("BOOK.open()", 'dekksdagbok', 600)
            await pg.close()
        await b.close()
    print('sidefeil', errs[:5]); print(len(os.listdir(DIR)), 'filer i', DIR)

asyncio.run(main())
