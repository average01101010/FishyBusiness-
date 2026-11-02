"""M7 in docs/planer/butikker-og-sponsorer.md: the partner's banner in front of the shop in Finnsnes (view3d/07-harbour-unit.js drawSigns),
and its measure (IAB's intrinsic in-game guidelines, start values): seen while it covers 1.5 % of the screen within 55°, one view after a
second in a row, the seconds added; nothing without an agreement; the counts handed over for sp_view. Uses the made-up test sponsor
(#sptest). Pictures in both formats. Prints OK or FEIL per check."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


async def shot(pg, path):
    # (SwiftShader can stall for minutes; a picture that does not come is said, not a failure of what the test checks)
    try: await pg.screenshot(path=path, timeout=150000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


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
        # the test camera straight at the banner from the quay: seen, and counted after a second
        await pg.evaluate("G3.signAt('front', 10)")
        pl = {}
        for _ in range(20):
            await pg.wait_for_timeout(2000)
            seen = await pg.evaluate("G3.signs"); pl = seen['pl'].get('-3') or {}
            if pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1: break
        check(seen['tex'] >= 1, 'banneret med partnerens navn er tegnet', seen)
        check(pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1 and pl.get('area', 0) >= 0.015 and (pl.get('last') or {}).get('vis'), 'synlig og stort nok: det telles som sett etter ett sekund', pl)
        await shot(pg, 'skilt_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(6000)
        await shot(pg, 'skilt_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # from behind the shop: the building hides it, and nothing is counted
        await pg.evaluate("G3.signTake(); G3.signAt('back', 14)")
        hp = {}
        for _ in range(12):
            await pg.wait_for_timeout(2000)
            hp = (await pg.evaluate("G3.signs"))['pl'].get('-3') or {}
            if (hp.get('last') or {}).get('vis') is False: break
        check((hp.get('last') or {}).get('vis') is False and hp.get('imp', 0) == 0, 'bak butikken er banneret skjult og telles ikke', hp)
        await pg.evaluate("G3.signAt('front', 10)"); await pg.wait_for_timeout(6000)
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
