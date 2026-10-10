"""The route list's tab in the chart plotter (08.10.2026, ui/08-actions.js #sideTab): sideways the list slides off to the right and only
the tab stays out (the map widens), upright it goes down and back, and the Rute button of the top bar is gone upright. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
JS = """(() => { const r = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height), disp:getComputedStyle(e).display}; };
  return {side:r('side'), tab:r('sideTab'), map:r('map'), ecRoute:r('ecRoute'), W:innerWidth, H:innerHeight, hide:document.body.classList.contains('sidehide'), drawer:document.body.classList.contains('drawer')}; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        for W, H, tag in ((1100, 700, 'land'), (412, 860, 'port')):
            pg = await (await b.new_context(viewport={'width': W, 'height': H})).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME)
            await pg.evaluate("(() => { S.tut = 0; S.draft = [{x:S.boat.pos.x + 1, y:S.boat.pos.y + 1, port:null, fish:0}, {x:S.boat.pos.x + 2, y:S.boat.pos.y + 1, port:null, fish:0}]; setBodyView(false); applyView(); refreshAll(); })()")
            await pg.wait_for_timeout(700)
            a = json.loads(json.dumps(await pg.evaluate(JS)))
            tab = await pg.evaluate("!!document.getElementById('sideTab')")
            await pg.click('#sideTab'); await pg.wait_for_timeout(600)
            c = await pg.evaluate(JS); await pg.screenshot(path='tests/out/sidetab_%s_1.png' % tag)
            await pg.click('#sideTab'); await pg.wait_for_timeout(600)
            d = await pg.evaluate(JS)
            print(tag, json.dumps({'a': a, 'c': c, 'd': d}))
            if tag == 'land':
                print(ok(tab and a['side']['x'] + a['side']['w'] <= W + 1 and a['side']['x'] < W - 200), tag, 'the list stands at the right with the tab at its edge')
                print(ok(c['hide'] and c['side']['x'] >= W - 2 and c['tab']['x'] >= W - 40 and c['tab']['x'] < W and c['map']['w'] == W), tag, 'a tap slides the list off, the tab stays out at the edge and the map is as wide as the screen')
                print(ok(not d['hide'] and d['side']['x'] < W - 200 and d['map']['w'] < W), tag, 'a second tap brings the list back')
            else:
                print(ok(tab and a['side']['y'] >= H - 2 and a['tab']['y'] < H and a['tab']['y'] > H - 40 and a['ecRoute']['disp'] == 'none'), tag, 'the list is down with the tab out at the bottom, and the Rute button is gone')
                print(ok(c['drawer'] and c['side']['y'] < H - 150 and c['tab']['y'] < c['side']['y']), tag, 'a tap lifts the list, the tab on its upper edge')
                print(ok(not d['drawer'] and d['side']['y'] >= H - 2), tag, 'a second tap sends it down again')
            print('errors:', errs[:3]); await pg.close()
        await b.close()
asyncio.run(main())
