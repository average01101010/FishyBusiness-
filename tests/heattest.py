"""The echo-sounder heat map and the fish model under it. Prints OK or FEIL per check, then the page errors.

Part 1, the model: the stock is read between the four nearest cells and a catch is taken from the same four, so the drop where
you fish is exactly kg/K · Σw²; a fished-down cell comes all the way back (rounding used to stop it at 0.876); the stock has no
hard 2 km edges.
"""
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def model(pg):
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      S.stock = initStock(); delete S.cstk; S.tut = 0;
      // a sea point well away from the grounds the local fleet works
      let p = null; for (let k = 0; k < 4000 && !p; k++){ const q = {x:4 + (k * 7.31) % 70, y:4 + (k * 3.77) % 74};
        if (!isLand(q) && GROUNDS.slice(0, 3).every(g => dist(q, g.p) > 18) && stockW(q).every(([i]) => S.stock[i] === 1)) p = q; }
      const R = {p};
      const w = stockW(p), s0 = stockAt(p); takeStock(p, 1500);
      R.drop = s0 - stockAt(p); R.want = 1500 / STK.K * w.reduce((a, [, x]) => a + x * x, 0);
      R.total = w.reduce((a, [i]) => a + (1 - S.stock[i]), 0) * STK.K;
      // no step at a cell edge: two cells side by side with different stock
      S.stock = initStock(); const c = Math.floor(p.x / STK.c), e = (c + 1) * STK.c, i0 = stockIdx(p); S.stock[i0] = 0.4;
      R.edge = Math.abs(stockAt({x:e - 1e-4, y:p.y}) - stockAt({x:e + 1e-4, y:p.y}));
      // regrowth all the way back: no other fleets, the whole sea fished down to a half
      const keep = npcStates; npcStates = () => []; S.stock = new Array(STK.nx * STK.ny).fill(0.5); S.cstk = new Array(STK.nx * STK.ny).fill(0.1);
      const H0 = (Date.UTC(2028, 5, 1, 0) - EPOCH) / 36e5; let d42 = null;
      for (let h = 0; h < 2400; h++){ stockHour(H0 + h); if (h === 42 * 24) d42 = S.stock[i0]; }
      npcStates = keep; R.d42 = d42; R.d100 = S.stock[i0]; R.crab = S.cstk[i0];
      S.stock = initStock(); delete S.cstk;
      return R; })())"""))
    check(abs(r['drop'] - r['want']) < 1e-9, 'bestanden synker med nøyaktig kg/K·Σw² der det fiskes', {k: round(r[k], 5) for k in ('drop', 'want')})
    check(abs(r['total'] - 1500) < 1e-6, 'hele fangsten trekkes fra bestanden, fordelt på de fire nærmeste rutene', round(r['total'], 3))
    check(r['edge'] < 1e-3, 'bestanden har ingen brå kant mellom to ruter', round(r['edge'], 6))
    check(r['d42'] >= 0.99 and r['d100'] == 1, 'en rute fisket ned til 0,5 er full igjen etter 42 dager (før stoppet den på 0,876)', {'42 d': r['d42'], '100 d': r['d100']})
    check(r['crab'] >= 0.97, 'krabbebestanden kommer også tilbake (før stoppet den på 0,667)', r['crab'])


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(500)
        await pg.wait_for_function("typeof DEPTH !== 'undefined' && DEPTH", timeout=60000)
        await model(pg)
        print(errs)
        await b.close()

asyncio.run(main())
