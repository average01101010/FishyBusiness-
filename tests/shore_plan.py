from _env import GAME, boot
import asyncio, json, base64, os
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700})
        await boot(pg, GAME + '#notut'); await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(async () => { const p = {x:1100.194, y:145.2158}, bt = S.boat; await mapNeed(p, 3); S.t = Math.round((Date.UTC(2026, 9, 12, 9, 12) - EPOCH) / 6e4); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; })()""")
        await pg.wait_for_timeout(30000)
        r = await pg.evaluate("""(() => { const N = G3._debug.NEARM, M = G3._debug.landMask, bv = G3._debug.bv, env = G3._debug.env, T = G3._debug.terrH, H = G3._debug.meshH;
          const W = M.width, id = M.getContext('2d').getImageData(0, 0, W, W).data, k = W / N.sx, S = 400, R = 400, out = document.createElement('canvas'); out.width = out.height = S; const g = out.getContext('2d'), im = g.createImageData(S, S), tide = env.tide;
          let cnt = {cut:0, vis:0, vis_sea:0};
          for (let j = 0; j < S; j++) for (let i = 0; i < S; i++){ const x = bv.x - R + (i + 0.5) * 2 * R / S, z = bv.z - R + (j + 0.5) * 2 * R / S, mi = Math.floor((x - N.x0) * k), mj = Math.floor((z - N.z0) * k), m = id[(mj * W + mi) * 4] / 255, h = H(x, z), t = T(x, z);
            // red: mesh ground above the tide that the mask leaves standing although the real terrain is under water; green: standing and real land; blue: cut
            let c = [20, 40, 70]; const above = h > tide + 0.02;
            if (above && m < 0.3) c = [60, 60, 200]; else if (above && t > tide + 0.5) c = [60, 180, 60]; else if (above) c = [230, 40, 40]; else if (t > tide) c = [255, 255, 0];
            const q = (j * S + i) * 4; im.data[q] = c[0]; im.data[q+1] = c[1]; im.data[q+2] = c[2]; im.data[q+3] = 255; }
          g.putImageData(im, 0, 0); g.fillStyle = 'white'; g.fillRect(S / 2 - 3, S / 2 - 3, 6, 6); return {png:out.toDataURL('image/png'), tide}; })()""")
        print(r['tide']); open('shore_cmp/plan.png', 'wb').write(base64.b64decode(r['png'].split(',')[1])); await b.close()
asyncio.run(main())
