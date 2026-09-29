from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':400,'height':600})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{ const port = portById('husoy');
          const run = (target, luckType, g, mo) => { const tot = {}; let n = 0, kr = 0, rel0 = S.stats.released || 0;
            for (let k = 0; k < 8; k++){ S.stock = initStock(); S.t = Math.round((Date.UTC(2028, mo, 5 + k, 7) - EPOCH) / 6e4); S.target = target; S.boat.kgear = true; S.haill = luckType ? {type:luckType, t0:S.t - 60} : null;
              S.hold = []; S.facc = {}; S.fnext = {}; S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 480; S.boat.gear = true; S.equip.jukse = 0; S.boat.ice = 150;
              for (let i = 0; i < 480 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); }
              for (const x of S.hold){ tot[x.sp] = (tot[x.sp] || 0) + x.kg; if (x.sp === 'kveite') n += x.n; kr += x.kg * clsPrice(port, x.sp, x.cls, S.t / 60, true); } }
            for (const k in tot) tot[k] = Math.round(tot[k]); return {kg:tot, kveiteN:n, krPerDay:Math.round(kr / 8), released:(S.stats.released || 0) - rel0}; };
          return {sep_kveite:run('kveite', null, 2, 8), sep_kveite_haill:run('kveite', 'kveit', 2, 8), oct_kveite_g0:run('kveite', null, 0, 9)}; })()""")
        for k,v in r.items(): print(k, json.dumps(v, ensure_ascii=False))
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
