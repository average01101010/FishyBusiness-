from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':400,'height':600})
        await boot(pg)
        print(await pg.evaluate("""JSON.stringify(FLEET.map((v, i) => ({i, L:v.L, home:v.home, ends:v.rt.map(r => { const q = r[r.length - 1]; const p = Array.isArray(q) ? {x:q[0], y:q[1]} : q; return [+p.x.toFixed(1), +p.y.toFixed(1), insideFjord(p)]; })})).filter(v => v.L >= 15))"""))
        await b.close()
asyncio.run(main())
