"""M7: the partner's banner and flag along the coast (view3d/07-harbour-unit.js drawSigns): at a tackle shop unit, a fish plant and a yard,
each where the model leaves room (SIGNF, or the model's anchors.sign after the next export). Uses the test sponsor (#sptest, sign 'all'
with its flag). Pictures of each in lying format, one standing. Prints OK or FEIL per check."""
from _env import boot, GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))


async def shot(pg, path):
    try: await pg.screenshot(path=path, timeout=150000)
    except Exception as e: print('skjermbildet %s kom ikke: %s' % (path, str(e)[:80]))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ',sptest')
        await pg.wait_for_function("SPN.list.some(r => r.kind === 'sign')", timeout=15000)
        await pg.evaluate("(() => { S.boat.type = 'snekke'; applyVessel(); G3.show(true); })()")
        await pg.wait_for_timeout(3000)
        U = await pg.evaluate("G3.signUnits()")
        check(U['s'] and U['p'] and U['y'], 'kysten har butikk-enheter, mottak og verft', {k: len(v) for k, v in U.items()})
        for kind, key, name in (('s', 's', 'butikk'), ('p', 'mottak', 'mottak'), ('y', 'y', 'verft')):
            if not U[kind]: continue
            uid = U[kind][0]
            await pg.evaluate("(id => { const q = portById(id); S.boat.status = 'port'; S.boat.port = id; S.boat.berth = 'main'; S.boat.pos = {x:q.p.x, y:q.p.y}; renderActs(); })('%s')" % uid)
            await pg.wait_for_timeout(4000)
            r = await pg.evaluate("G3.signAtUnit('%s', 16)" % uid)
            d = None
            for _ in range(15):
                await pg.evaluate("dispatchEvent(new Event('pointerdown'))"); await pg.wait_for_timeout(2000)
                d = await pg.evaluate("G3.signs")
                if any(k.startswith(key) for k in d['drawn']) and d['flags'] > 0: break
            check(r is not None and any(k.startswith(key) for k in d['drawn']) and d['flags'] > 0, 'banneret og flagget står ved %s %s' % (name, uid), {'F': r and r['F'], 'drawn': d['drawn'], 'flags': d['flags']})
            await shot(pg, 'skilt_%s_liggende.png' % name)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(6000)
        await shot(pg, 'skilt_verft_staaende.png')
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
