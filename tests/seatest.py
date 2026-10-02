from _env import GAME, boot
# The sea (03b-sea.js): fetch up-wind over open water, so the lee is calm and the open sea is not; exposure() (fish and depth) unchanged.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
EXPO_SUM = 19066.9774   # exposure() summed over a grid before the sea model: fish and depth use it, so it must not move

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{
          const R = {}, D = [0, 45, 90, 135, 180, 225, 270, 315], r1 = v => Math.round(v * 10) / 10;
          let s = 0; for (let x = 0.2; x < 78; x += 0.37) for (let y = 0.2; y < 82; y += 0.41) s += exposure({x, y}); R.expo = Math.round(s * 1e4) / 1e4;
          R.rose = {}; for (const g of GROUNDS) R.rose[g.name.no] = D.map(d => r1(fetchAt(g.p, d)));
          for (const q of PORTS) R.rose[q.id] = D.map(d => r1(fetchAt(q.p, d)));
          // smooth: the cached field over a full turn in 1 degree steps, and against fetchAt
          // (a step per degree is never more than a tenth of the step between two 10 degree sectors; the wind sea goes as the root of the fetch)
          const g0 = GROUNDS[0].p; let jump = 0, prev = fetchField(g0, 0), dev = 0, sec = 0;
          for (let k = 0; k < 36; k++) sec = Math.max(sec, Math.abs(fetchField(g0, (k + 1) * 10) - fetchField(g0, k * 10)));
          for (let d = 1; d <= 360; d++){ const v = fetchField(g0, d); jump = Math.max(jump, Math.abs(v - prev)); prev = v; }
          // (the field blends neighbouring sectors, so it is held to the rays within ±10 degrees, as a real wind wanders)
          for (const g of GROUNDS) for (let d = 0; d < 360; d += 15){ const a = [-10, -5, 0, 5, 10].map(e => Math.sqrt(Math.max(1, fetchAt(g.p, d + e)))), f = Math.sqrt(Math.max(1, fetchField(g.p, d)));
            dev = Math.max(dev, f / Math.max(...a) - 1, Math.min(...a) / f - 1); }
          R.jump = r1(jump / (sec / 10)); R.dev = r1(dev * 100);
          let t0 = performance.now(); for (let i = 0; i < 2000; i++) fetchAt({x:Math.random() * 78, y:Math.random() * 82}, Math.random() * 360); R.usRay = r1((performance.now() - t0) / 2000 * 1000);
          t0 = performance.now(); for (let i = 0; i < 10000; i++) fetchField({x:40 + Math.random(), y:10 + Math.random()}, 200 + Math.random() * 20); R.usWarm0 = r1((performance.now() - t0) / 10000 * 1000);
          t0 = performance.now(); for (let i = 0; i < 10000; i++) fetchField({x:40 + Math.random(), y:10 + Math.random()}, 200 + Math.random() * 20); R.usWarm = r1((performance.now() - t0) / 10000 * 1000);
          return R; })()""")
        for k, v in r['rose'].items(): print('  ', k.ljust(22), v)
        print(json.dumps({k: v for k, v in r.items() if k != 'rose'}))
        R = r['rose']
        print(ok(abs(r['expo'] - EXPO_SUM) < 1e-3), 'exposure() is unchanged, so the fish and the depths are too')
        print(ok(all(min(R[g][0], R[g][7]) > 200 and R[g][4] < 30 for g in ['Havet nord for Husøy', 'Utenfor Mefjorden', 'Vest av Gryllefjord'])), 'the outer grounds have the open sea to the north and north-west and the land in the lee to the south')
        print(ok(all(max(R[q]) < 5 for q in ['husoy', 'senjahopen', 'sommaroy', 'botnhamn'])), 'the harbours have under 5 km of fetch from every side')
        print(ok(all(max(R[g]) < 15 for g in ['Gisundet nord', 'Solbergfjorden', 'Malangsgapet'])), 'the fjord grounds have short fetches')
        print(ok(r['jump'] <= 1.05 and r['dev'] < 15), 'the cached field turns smoothly with the wind, and its wave height is within 15 % of what the rays give within 10 degrees at the grounds')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
