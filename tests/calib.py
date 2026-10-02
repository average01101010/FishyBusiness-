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
          const r = {}; const H0 = (Date.UTC(2028,0,15,10) - EPOCH) / 36e5;
          // sea points near the coast inside the map
          const pts = []; let k = 0; while (pts.length < 400 && k < 20000){ k++; const p = LG(Math.random()*MAP_W, Math.random()*MAP_H); if (!isLand(p) && coastDist(p) < 8 && depthF(p) > 8) pts.push(p); }
          for (const sp of SP){ r[sp] = {best:[], p90:[]};
            for (let m = 0; m < 12; m++){ const H = H0 + m * 30.4 * 24;
              const g = GROUNDS.map(q => density(sp, q.p, H)); r[sp].best.push(+(30 * Math.max(...g)).toFixed(1));
              const d = pts.map(p => density(sp, p, H)).sort((a,b)=>a-b); r[sp].p90.push(+(30 * d[Math.floor(d.length*0.9)]).toFixed(1)); } }
          return r; })()""")
        for sp,v in out.items(): print(f"{sp:7s} best-ground kg/h: {v['best']}\n        top-10% sea kg/h: {v['p90']}")
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
