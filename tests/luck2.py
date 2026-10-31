from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':400,'height':600})
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const run = (luckType, g, mo) => { let tot = {}; let all = 0;
            for (let k = 0; k < 8; k++){ S.stock = initStock(); S.t = Math.round((Date.UTC(2028, mo, 6 + k, 7) - EPOCH) / 6e4); S.haill = luckType ? {type:luckType, t0:S.t - 60} : null; S.hold = []; S.facc = {}; S.fnext = {};
              S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 240; S.boat.gear = true; S.equip.jukse = 0; S.boat.ice = 150;
              for (let i = 0; i < 240 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); }
              for (const x of S.hold){ tot[x.sp] = (tot[x.sp] || 0) + x.kg; } all += holdTotal(); }
            for (const k in tot) tot[k] = Math.round(tot[k]); tot.ALL = Math.round(all); return tot; };
          return {march_none:run(null, 0, 2), march_haill:run('haill', 0, 2), march_luksus:run('luksus', 0, 2), nov_none:run(null, 2, 10), nov_kveit:run('kveit', 2, 10)}; })()""")
        for k,v in r.items(): print(k, json.dumps(v))
        await pg.evaluate("S.jobs=[]; S.boat.status='port'; S.boat.port='husoy'; queueJob({kind:'repair', h:24, no:'Reparasjon', en:'Repair'}); S.jobs[0].until = S.t; step(); step();")
        print('jobs after rush + step:', await pg.evaluate("S.jobs.length"))
        await b.close()
asyncio.run(main())
