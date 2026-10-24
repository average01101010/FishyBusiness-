from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':760,'height':1000})
        await pg.add_init_script("""
          const orig = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function(t, o){ const c = orig.call(this, t, o); if (c && (t==='webgl'||t==='experimental-webgl') && !c.__p){ c.__p = 1; const da = c.drawArrays.bind(c); window.__bad = []; c.drawArrays = function(m, f, n){ const en = []; for (let i = 0; i < 8; i++){ if (c.getVertexAttrib(i, c.VERTEX_ATTRIB_ARRAY_ENABLED) && !c.getVertexAttrib(i, c.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)) en.push(i); } if (en.length && window.__bad.length < 3) window.__bad.push(en.join(',') + ' | ' + new Error().stack.split('\\n').slice(2, 5).join(' <- ')); return da(m, f, n); }; } return c; };
        """)
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        for l in await pg.evaluate("window.__bad"): print(l[:600])
        await b.close()
asyncio.run(main())
