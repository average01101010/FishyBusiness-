"""#61: the shore texture (buildLandMask) measured against the chart's coast line at a place: the texture's height h = r*8-4 at texels
on the foreshore's ramp against the profile 1.7 + sd * g (coastSdIf), and the mask build time. python3 shore_tex.py [lat lon]"""
from _env import GAME, boot
import asyncio, json, sys, base64
from playwright.async_api import async_playwright
LL = (float(sys.argv[1]), float(sys.argv[2])) if len(sys.argv) > 2 else (71.01233, 24.64703)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        await pg.evaluate("""(async ([la, lo]) => { const p = P(la, lo), bt = S.boat; await mapNeed(p, 3);
          S.t = Math.round((Date.UTC(2026, 9, 12, 9, 30) - EPOCH) / 6e4); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; bt.heading = 3.3;
          const c = G3._debug.cam; c.helm = false; c.dist = 120; c.pitch = 1.1; c.yaw = 0; })""", list(LL))
        await pg.wait_for_timeout(30000)
        r = await pg.evaluate("""(() => { const N = G3._debug.NEARM, M = G3._debug.landMask, C = G3._debug.coast3;
          if (!N || !M) return {err:'no mask', near:!!N};
          const W = M.width, id = M.getContext('2d').getImageData(0, 0, W, W).data, k = W / N.sx, errs = [], errM = [], land = [], sea = []; let n = 0, bad = 0;
          for (let j = 2; j < W - 2; j += 2) for (let i = 2; i < W - 2; i += 2){ const LB = Math.round((C.top + 4) / 8 * 255), v = id[(j * W + i) * 4]; if (v === 0 || v === LB) continue;
            const x = N.x0 + (i + 0.5) / k, z = N.z0 + (j + 0.5) / k, sd = coastSdIf({x:x / 1000, y:z / 1000}, 40); if (sd !== sd) continue;
            const h = v * 8 / 255 - 4; n++;
            if (sd >= 0){ land.push(h); continue; }
            const e = h - (C.top + sd * C.g), em = h - (C.top + sd * C.gMole); errs.push(Math.abs(e)); errM.push(Math.abs(em)); if (Math.min(Math.abs(e), Math.abs(em)) > 0.6) bad++; }
          errs.sort((a, b) => a - b); const pct = (a, q) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * q))].toFixed(2) : null;
          // the waterline: texels where the texture crosses the tide against the ramp's own crossing (sd_T)
          const T = G3._debug.env.tide, sdT = (T - C.top) / C.g, cross = []; 
          for (let j = 2; j < W - 2; j += 2) for (let i = 2; i < W - 2; i += 2){ const v = id[(j * W + i) * 4], v2 = id[(j * W + i + 2) * 4]; const h = v * 8 / 255 - 4, h2 = v2 * 8 / 255 - 4; if ((h < T) === (h2 < T)) continue;
            const x = N.x0 + (i + 1.5) / k, z = N.z0 + (j + 0.5) / k, sd = coastSdIf({x:x / 1000, y:z / 1000}, 40); if (sd === sd && cross.length < 5000) cross.push(Math.abs(sd - sdT)); }
          cross.sort((a, b) => a - b);
          return {texel:+(1 / k).toFixed(2), ms:+G3._debug.maskMs.toFixed(1), tide:+T.toFixed(2), sdT:+sdT.toFixed(2), ramp:{n, p50:pct(errs, 0.5), p90:pct(errs, 0.9), p99:pct(errs, 0.99), bad}, landOnRamp:land.length,
            waterline:{n:cross.length, p50:pct(cross, 0.5), p90:pct(cross, 0.9), p99:pct(cross, 0.99)}, img:(() => { const c = document.createElement('canvas'); c.width = c.height = 1024; c.getContext('2d').drawImage(M, 0, 0, 1024, 1024); return c.toDataURL('image/png'); })()}; })()""")
        print({k: v for k, v in r.items() if k != 'img'})
        if 'img' in r: open('shore_cmp/tex.png', 'wb').write(base64.b64decode(r['img'].split(',')[1]))
        await pg.screenshot(path='shore_cmp/tex_view.png', timeout=120000)
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
