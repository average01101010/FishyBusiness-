from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':600,'height':800})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        out = await pg.evaluate("""(()=>{ const F = typeof FLEET !== 'undefined' ? FLEET : []; const k = F[0] ? Object.keys(F[0]) : [];
          return {keys:k, rows:F.map(v => ({n:v.name, L:v.L || v.len || v.loa || (v.dim && v.dim[0]), spots:(v.spots || v.fish || []).map(s => { const q = Array.isArray(s) ? {x:s[0], y:s[1]} : (s.p || s); return insideFjord(q); })}))}; })()""")
        print(json.dumps(out, ensure_ascii=False)[:1800])
        # rod game still lands fish with sizes
        await pg.evaluate("S.tut=0; S.t=Math.round((Date.UTC(2028,2,10,9)-EPOCH)/6e4); S.boat.status='fishing'; S.boat.port=null; S.boat.pos={...GROUNDS[0].p}; S.boat.fishUntil=S.t+600; S.hold=[];")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        await pg.evaluate("renderActs(); document.querySelector('#dock [data-act=rod]').click()"); await pg.wait_for_timeout(800)
        await pg.evaluate("ROD._strike(); ROD._prog(1)"); await pg.dispatch_event('#rodUI .rod-btn', 'pointerdown'); await pg.wait_for_timeout(20000)
        print('rod:', await pg.evaluate("JSON.stringify({st:ROD.state().st, hold:S.hold.map(x=>[x.sp,x.cls,+x.kg.toFixed(1),x.hook]), n:S.rodN})"))
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
