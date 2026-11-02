"""M7 in docs/planer/butikker-og-sponsorer.md: the partner's banner in front of the shop in Finnsnes (view3d/07-harbour-unit.js drawSigns),
and its measure (IAB's intrinsic in-game guidelines, start values): seen while it covers 1.5 % of the screen within 55°, one view after a
second in a row, the seconds added; nothing without an agreement; the counts handed over for sp_view. Uses the made-up test sponsor
(#sptest). Pictures in both formats. Prints OK or FEIL per check."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',sptest')
        await pg.wait_for_function("SPN.list.some(r => r.kind === 'sign')", timeout=15000)
        await pg.evaluate("""(() => { S.boat.type = 'snekke'; applyVessel(); S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.boat.berth = 'main'; const q = portById('finnsnes'); S.boat.pos = {x:q.p.x, y:q.p.y}; renderActs(); G3.show(true); })()""")
        await pg.wait_for_timeout(4000)
        lk = await pg.evaluate("G3.signLook()")
        check(lk is not None and lk['d'] < 80, 'butikken i Finnsnes står ved kaia der båten ligger', lk)
        # behind the boat, low (the camera on the far side of the boat from the banner): hidden, so not counted
        await pg.wait_for_timeout(8000)
        hid = await pg.evaluate("G3.signs")
        hp = hid['pl'].get('-3') or {}
        check(hp.get('last') and hp['last'].get('vis') is False and hp.get('imp', 0) == 0, 'bak båten er banneret skjult og telles ikke', hp)
        # from the side and higher, where it shows: seen within a few tries of the camera's angle
        pl = {}
        for off in (1.2, -1.2, 0.8, -0.8, 1.6, -1.6):
            await pg.evaluate("G3.signLook(%s, 14, 0.35)" % off)
            for _ in range(10):
                await pg.wait_for_timeout(1500)
                seen = await pg.evaluate("G3.signs"); pl = seen['pl'].get('-3') or {}
                if pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1: break
            if pl.get('imp', 0) >= 1: break
        check(seen['tex'] >= 1, 'banneret med partnerens navn er tegnet', seen)
        check(pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1 and pl.get('area', 0) >= 0.015 and pl['last'].get('vis'), 'synlig og stort nok: det telles som sett etter ett sekund', pl)
        await pg.screenshot(path='skilt_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(6000)
        await pg.screenshot(path='skilt_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # the counts are handed over once for sending, then start again
        t1 = await pg.evaluate("G3.signTake()"); t2 = await pg.evaluate("G3.signTake()")
        check(any(x['pl'] == -3 and x['imp'] >= 1 for x in t1) and all(x['imp'] == 0 for x in t2 if x['pl'] == -3) and all(set(x) == {'pl', 'imp', 'sec'} for x in t1),
              'tellingen leveres som {pl, imp, sec} og begynner på nytt', [t1, t2])
        # no agreement: the banner goes
        await pg.evaluate("spSet([])"); await pg.wait_for_timeout(3000)
        n = await pg.evaluate("G3.signs.seen")
        check(n == 0, 'uten avtale står det ikke noe banner', n)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
