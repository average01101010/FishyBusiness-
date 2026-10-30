from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1000, 'height': 700})
        await boot(pg, GAME + '#notut'); await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("""(async () => { const p = {x:1100.194, y:145.2158}, bt = S.boat; await mapNeed(p, 3); bt.status = 'idle'; bt.port = null; bt.plan = null; S.plan = null; bt.pos = {x:p.x, y:p.y}; })()""")
        await pg.wait_for_timeout(30000)
        print(json.dumps(await pg.evaluate("G3._debug.seaU()"))); await b.close()
asyncio.run(main())
