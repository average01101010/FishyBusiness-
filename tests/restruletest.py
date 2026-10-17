"""The rest rule for the crew binds only a skipper with a firm (Jonas 08.10.2026): without S.company nobody breaks it, however long they work;
with S.company the same log breaks the rule."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(() => {
          const R = {}; S.tut = 0; const c = {id:'t1', name:'Test Mann', rest:Array(168).fill(0)};
          S.company = ''; R.offLeft = restLeft(c); S.boat.status = 'sailing'; R.offHour = restHour(c, true);
          S.company = 'Test Fiskeri'; R.onLeft = restLeft(c); R.onHour = restHour(c, true);
          S.company = ''; return R; })()""")
        print(json.dumps(r))
        print(ok(r['offLeft'] == 24 and r['offHour'] is None), 'uten rederi: ingen hviletidsbrudd')
        print(ok(r['onLeft'] == 0 and r['onHour']), 'med rederi: brudd')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
