# Search in the chart plotter (ui/03f-search.js, Jonas 09.10.2026): the magnifier opens a field, a fish plant is found by name and the
# chart goes there with a card, «Autonav hit» lays a route there; a fjord's name from the chart packs is found once they have come, and
# a typed position is found too.
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800}, has_touch=True)).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("() => { S.tut = 0; S.settings.plotter = false; openPlotter(); renderBase(); }")
        await pg.wait_for_function("document.body.classList.contains('vplot')")
        await pg.click('#zsearch'); await pg.wait_for_timeout(300)
        await pg.fill('#srch input', 'senjahop'); await pg.wait_for_timeout(300)
        r = json.loads(await pg.evaluate("JSON.stringify({open:!SRCH.el.hidden, n:document.querySelectorAll('#srch .sr-l [data-i]').length, first:(document.querySelector('#srch .sr-l [data-i] b') || {}).textContent || ''})"))
        print(ok(r['open'] and r['n'] >= 1 and 'Senjahopen' in r['first']), 'søket finner et mottak på en del av navnet', r)
        await pg.click('#srch .sr-l [data-i="0"]'); await pg.wait_for_timeout(400)
        g = json.loads(await pg.evaluate("JSON.stringify({d:dist({x:view.cx, y:view.cy}, SRCH.hit ? SRCH.hit.p : {x:1e9, y:1e9}), card:!SRCH.card.hidden, ring:!!document.querySelector('#map .srchring'), closed:SRCH.el.hidden})"))
        print(ok(g['d'] < 0.01 and g['card'] and g['ring'] and g['closed']), 'kartet går dit, med ring og kort', g)
        await pg.click('#srchCard [data-s=go]')
        await pg.wait_for_function("S.draft.length > 0 && !LEIA_BUSY", timeout=60000)
        d = json.loads(await pg.evaluate("JSON.stringify({n:S.draft.length, port:S.draft[S.draft.length - 1].port})"))
        print(ok(d['n'] > 0 and d['port'] == 'senjahopen'), 'Autonav hit legger ruta til mottaket', d)
        await pg.screenshot(path='search_route.png')
        # a fjord's name from the chart packs (they are fetched while the field is open)
        await pg.click('#zsearch'); await pg.fill('#srch input', 'mefjord')
        await pg.wait_for_function("SRCH.rs && SRCH.rs.some(it => /Mefjord/.test(it.name))", timeout=120000)
        f = await pg.evaluate("SRCH.rs.filter(it => /Mefjord/.test(it.name)).map(it => it.name + ' / ' + it.sub[0]).slice(0, 3)")
        print(ok(len(f) > 0), 'navn fra sjøkartet (fjorder) blir funnet', f)
        await pg.screenshot(path='search_list.png')
        await pg.fill('#srch input', '69.5 17.2'); await pg.wait_for_timeout(200)
        c = await pg.evaluate("SRCH.rs.length === 1 && SRCH.rs[0].sub[0] === 'Posisjon'")
        print(ok(c), 'en posisjon i desimalgrader blir funnet')
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
