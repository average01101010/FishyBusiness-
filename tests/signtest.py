"""M7 in docs/planer/butikker-og-sponsorer.md: the partner's banner in front of the shop in Finnsnes (view3d/07-harbour-unit.js drawSigns),
and its measure after IAB/MRC 2.0 (steg 66, the rules in ui/10r-sponsor.js SPM): seen while it covers 1.5 % of the screen within 55°, not
hidden by the building or by the UI (the phone over it), in sight (not in fog, not at night); one viewable impression per placement and
session after a second in a row, a re-view the next time; nothing without an agreement; the counts handed over for sp_view. The sun is
held up (SPM.fix.el) so the test does not depend on the shared clock's hour, then let down for the night. Uses the made-up test sponsor
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
        await pg.evaluate("SPM.fix.el = 30")   # (day, whatever the clock says)
        lk = await pg.evaluate("G3.signLook()")
        check(lk is not None and lk['d'] < 80, 'butikken i Finnsnes står ved kaia der båten ligger', lk)
        # the test camera straight at the banner from the quay: seen, and counted after a second
        await pg.evaluate("G3.signAt('front', 10)")
        pl = {}
        for _ in range(20):
            await pg.evaluate("dispatchEvent(new Event('pointerdown'))"); await pg.wait_for_timeout(2000)
            seen = await pg.evaluate("G3.signs"); pl = seen['pl'].get('-3') or {}
            if pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1: break
        check(seen['tex'] >= 1, 'banneret med partnerens navn er tegnet', seen)
        check(pl.get('imp', 0) >= 1 and pl.get('sec', 0) >= 1 and pl.get('area', 0) >= 0.015 and (pl.get('last') or {}).get('vis') and (pl.get('last') or {}).get('ui') == 0, 'synlig og stort nok, ingen UI over: det telles som sett etter ett sekund', pl)
        await shot(pg, 'skilt_liggende.png')
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(6000)
        await shot(pg, 'skilt_staaende.png')
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # a game nobody has touched for two minutes counts nothing (as a hidden page)
        # from behind the shop: the building hides it, and nothing is counted
        await pg.evaluate("G3.signTake(); G3.signAt('back', 14)")
        hp = {}
        for _ in range(12):
            await pg.wait_for_timeout(2000)
            hp = (await pg.evaluate("G3.signs"))['pl'].get('-3') or {}
            if (hp.get('last') or {}).get('vis') is False: break
        check((hp.get('last') or {}).get('vis') is False and hp.get('imp', 0) == 0, 'bak butikken er banneret skjult og telles ikke', hp)
        await pg.evaluate("G3.signAt('front', 10)")
        for _ in range(12):
            await pg.evaluate("dispatchEvent(new Event('pointerdown'))"); await pg.wait_for_timeout(2000)
            if ((await pg.evaluate("G3.signs"))['pl'].get('-3') or {}).get('re', 0) >= 1: break
        # seen again in the same session: a re-view, not a second viewable impression (IAB 3.2 note 3); handed over once, then again
        t1 = await pg.evaluate("G3.signTake()"); t2 = await pg.evaluate("G3.signTake()")
        a1 = [x for x in t1 if x['pl'] == -3]
        check(a1 and a1[0]['imp'] == 0 and a1[0]['re'] >= 1 and a1[0]['sec'] >= 1 and all(x['imp'] == 0 and x['re'] == 0 for x in t2 if x['pl'] == -3) and all(set(x) == {'pl', 'imp', 're', 'sec', 'm', 'u'} for x in t1),
              'sett igjen i samme økt: et gjensyn, ikke en ny synlig visning; tellingen leveres som {pl, imp, re, sec, m, u} og begynner på nytt', [t1, t2])
        # the phone over the banner (IAB 3.2.4: the UI is occlusion): its cells under the phone, not visible, no seconds. In portrait,
        # where the phone covers the middle of the picture (in landscape it stands at the right, beside the banner)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(3000)
        await pg.evaluate("PHONE.show(true)"); ph = {}
        for _ in range(8):
            await pg.evaluate("dispatchEvent(new Event('pointerdown'))"); await pg.wait_for_timeout(2000)
            ph = (await pg.evaluate("G3.signs"))['pl'].get('-3') or {}
            if (ph.get('last') or {}).get('ui', 0) >= 4: break
        await pg.evaluate("G3.signTake()"); await pg.wait_for_timeout(4000); s1 = [x for x in await pg.evaluate("G3.signTake()") if x['pl'] == -3]
        await shot(pg, 'skilt_telefon_staaende.png')
        check((ph.get('last') or {}).get('ui', 0) >= 4 and (ph.get('last') or {}).get('vis') is False and all(x['sec'] == 0 and x['re'] == 0 for x in s1), 'telefonen over banneret skjuler det, og det telles ikke', [ph.get('last'), s1])
        await pg.evaluate("PHONE.show(false)"); await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(3000)
        # fog thicker than the distance, and night (the sun 10° under): in reach, never counted (IAB 3.2.5)
        res = {}
        for k, fix in (('skodde', "SPM.fix.vis = 0.005"), ('natt', "SPM.fix.vis = null; SPM.fix.el = -10")):
            await pg.evaluate(fix); await pg.wait_for_timeout(3000); await pg.evaluate("G3.signTake()")
            for _ in range(3):
                await pg.evaluate("dispatchEvent(new Event('pointerdown'))"); await pg.wait_for_timeout(2000)
            res[k] = [(await pg.evaluate("G3.signs"))['pl'].get('-3', {}).get('last'), [x for x in await pg.evaluate("G3.signTake()") if x['pl'] == -3]]
        await shot(pg, 'skilt_natt_liggende.png')
        await pg.evaluate("SPM.fix.el = 30")
        check(all((r[0] or {}).get('sight') is False and all(x['sec'] == 0 for x in r[1]) for r in res.values()), 'i skodde tettere enn avstanden og om natta telles banneret ikke', res)
        # no agreement: the banner goes
        await pg.evaluate("spSet([])"); await pg.wait_for_timeout(3000)
        n = await pg.evaluate("G3.signs.seen")
        check(n == 0, 'uten avtale står det ikke noe banner', n)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
