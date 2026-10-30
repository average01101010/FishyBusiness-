from _env import GAME, boot
import asyncio, json, base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700})
        await boot(pg, GAME + '#notut'); await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(async () => { const p = {x:1100.194, y:145.2158}, bt = S.boat; await mapNeed(p, 3); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; })()""")
        await pg.wait_for_timeout(30000)
        r = await pg.evaluate("""(() => { const N = G3._debug.NEARM, M = G3._debug.landMask, bv = G3._debug.bv; if (!M) return null; const k = M.width / N.sx, cx = (bv.x - N.x0) * k, cz = (bv.z - N.z0) * k, R = 200 * k;
          const c = document.createElement('canvas'); c.width = c.height = 800; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(M, cx - R, cz - R, 2 * R, 2 * R, 0, 0, 800, 800);
          g.fillStyle = 'red'; g.fillRect(396, 396, 8, 8); return {png:c.toDataURL('image/png'), texel:1 / k}; })()""")
        print(r['texel']); open('shore_cmp/maskzoom.png', 'wb').write(base64.b64decode(r['png'].split(',')[1])); await b.close()
asyncio.run(main())
