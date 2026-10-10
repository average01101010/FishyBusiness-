from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':600,'height':800})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        out = await pg.evaluate("""(()=>{
          const res = [];
          const day = (y, m, d, g, gear, jk) => {
            S.t = Math.round((Date.UTC(y, m, d, 7) - EPOCH) / 6e4); S.hold = []; S.facc = {}; S.fnext = {}; S.stats.released = 0;
            S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 480; S.boat.gear = gear; S.equip.jukse = jk; S.settings.bleed = true; S.boat.ice = 150;
            for (let i = 0; i < 480 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); deckMinute(); }
            const by = {}; for (const x of S.hold){ by[x.sp] = by[x.sp] || {kg:0, n:0, cls:{}}; by[x.sp].kg += x.kg; by[x.sp].n += x.n; by[x.sp].cls[SPECIES[x.sp].cls[x.cls][2]] = (by[x.sp].cls[SPECIES[x.sp].cls[x.cls][2]] || 0) + x.n; }
            for (const k in by) by[k].kg = Math.round(by[k].kg);
            return {date:y + '-' + (m + 1) + '-' + d, ground:GROUNDS[g].name.no, gear:gear ? 'juksa' : 'stang', jk, total:Math.round(holdTotal()), released:S.stats.released, st:S.boat.status, by};
          };
          res.push(day(2028, 2, 10, 0, true, 0));
          res.push(day(2028, 2, 10, 2, true, 0));
          res.push(day(2028, 6, 12, 0, true, 0));
          res.push(day(2028, 4, 15, 3, true, 0));
          res.push(day(2028, 2, 10, 0, false, 0));
          res.push(day(2028, 2, 10, 0, true, 2));
          // effort ladder for one person alone: rod, hand jig, one and two electric reels (should be 0.35 : 1 : 2 : 4)
          const eff = []; for (const [g, jk] of [[false, 0], [true, 0], [true, 1], [true, 2]]){ S.boat.gear = g; S.equip.jukse = jk; eff.push(+(fishEffort() / teamEff([], true)).toFixed(2)); }
          res.push({effort:eff});
          S.boat.status = 'port'; S.equip.jukse = 0;
          return res; })()""")
        for r in out: print(json.dumps(r, ensure_ascii=False))
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
