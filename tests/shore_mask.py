"""#61: the land mask (white = land) over the near terrain at Havøysund, saved as a picture, with where the boat is and the terrain's own shore."""
from _env import GAME, boot
import asyncio, json, base64
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        await pg.evaluate("""(async () => { const p = P(71.01233, 24.64703), bt = S.boat; await mapNeed(p, 3);
          S.t = Math.round((Date.UTC(2026, 9, 12, 9, 30) - EPOCH) / 6e4); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; bt.heading = 190 * Math.PI / 180;
          const c = G3._debug.cam; c.helm = true; c.zoom = 1; })()""")
        await pg.wait_for_timeout(30000)
        r = await pg.evaluate("""(() => { const N = G3._debug.NEARM, M = G3._debug.landMask, bv = G3._debug.bv, RO = G3._debug.RO;
          if (!N || !M) return {err:'no mask', near:!!N};
          // downscale the mask to 512 and mark the boat
          const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.drawImage(M, 0, 0, 512, 512);
          const bx = (bv.x - N.x0) / N.sx * 512, bz = (bv.z - N.z0) / N.sx * 512; g.fillStyle = 'red'; g.fillRect(bx - 3, bz - 3, 7, 7);
          // the terrain's own land (above the tide) as a second picture: height > 0.3 -> white
          const d = document.createElement('canvas'); d.width = d.height = 512; const h = d.getContext('2d'), im = h.createImageData(512, 512);
          for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++){ const x = N.x0 + (i + 0.5) / 512 * N.sx, z = N.z0 + (j + 0.5) / 512 * N.sz, v = G3._debug.terrH(x, z) > 0.3 ? 255 : 0; const k = (j * 512 + i) * 4; im.data[k] = im.data[k+1] = im.data[k+2] = v; im.data[k+3] = 255; }
          h.putImageData(im, 0, 0); h.fillStyle = 'red'; h.fillRect(bx - 3, bz - 3, 7, 7);
          // how far the mask's edge is from the chart's own coast line (coastSdIf, the vector coast the 2D chart is drawn from): the edge pixels
          const W = M.width, id = M.getContext('2d').getImageData(0, 0, W, W).data, k = W / N.sx, ds = []; let n = 0;
          for (let j = 1; j < W - 1 && ds.length < 4000; j += 3) for (let i = 1; i < W - 1; i += 3){ const v = id[(j * W + i) * 4] > 127; if (v === (id[(j * W + i + 1) * 4] > 127) && v === (id[((j + 1) * W + i) * 4] > 127)) continue;
            const x = N.x0 + (i + 0.5) / k, z = N.z0 + (j + 0.5) / k, d = coastSdIf({x:x / 1000, y:z / 1000}, 60); if (d === d) ds.push(Math.abs(d)); }
          ds.sort((a, b) => a - b); const pct = q => ds.length ? +ds[Math.min(ds.length - 1, Math.floor(ds.length * q))].toFixed(2) : null;
          const edge = {n:ds.length, p50:pct(0.5), p90:pct(0.9), p99:pct(0.99), max:pct(1), texel:+(1 / k).toFixed(2)};
          return {edge, x0:N.x0, z0:N.z0, sx:N.sx, boat:[bv.x, bv.z], mask:c.toDataURL('image/png'), terr:d.toDataURL('image/png')}; })()""")
        print({k: v for k, v in r.items() if k not in ('mask', 'terr')})
        if 'mask' in r:
            for k in ('mask', 'terr'):
                open('havoy_%s.png' % k, 'wb').write(base64.b64decode(r[k].split(',')[1]))
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
