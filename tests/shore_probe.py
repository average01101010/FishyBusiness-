"""Probe for tilbakemelding #61 (see through land, foam off the coast): the boat at ports along the coast, the camera low looking at the shore."""
from _env import GAME, boot
import asyncio, json, sys
from playwright.async_api import async_playwright

PLACES = {'tromso':(69.65, 18.96), 'bergen':(60.39, 5.32), 'bodo':(67.28, 14.40), 'hammerfest':(70.66, 23.68), 'husoy':(69.54, 17.67)}
SEL = sys.argv[1].split(',') if len(sys.argv) > 1 else list(PLACES)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        names = await pg.evaluate("PORTS.filter(q => q.coastal).map(q => q.id).slice(0, 400)")
        print(len(names))
        for key in SEL:
            pid = await pg.evaluate("(ll => { const t = P(ll[0], ll[1]); let best = null, bd = 1e9; for (const q of PORTS) { if (!q.coastal) continue; const d = Math.hypot(q.p.x - t.x, q.p.y - t.y); if (d < bd) { bd = d; best = q; } } return best && best.id; })", list(PLACES[key]))
            if not pid: print('no port', key); continue
            await pg.evaluate("""(async id => { const q = portById(id), b = S.boat; await mapNeed(q.p, 3); S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); const ev = tideEvents(S.t / 60, 14, q.p).find(e => e.kind === 'low'); if (ev) S.t = Math.round(ev.t * 60);
              b.status = 'idle'; b.port = null; b.plan = null; S.plan = null; b.pos = {x:q.p.x + 0.12, y:q.p.y + 0.05}; const c = G3._debug.cam; c.helm = false; c.dist = 220; c.pitch = 0.12; c.yaw = 1.2; })""", pid)
            await pg.wait_for_timeout(20000)
            await pg.screenshot(path='shore_%s_a.png' % key, timeout=120000)
            await pg.evaluate("(() => { const c = G3._debug.cam; c.yaw = 3.4; c.pitch = 0.08; c.dist = 160; })()")
            await pg.wait_for_timeout(5000)
            await pg.screenshot(path='shore_%s_b.png' % key, timeout=120000)
            print('done', key, pid)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
