from _env import GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['4']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':390,'height':760})
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('[data-close]')
        await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(800)
        print('plotter open:', await pg.evaluate("document.body.classList.contains('vplot')"))
        js="(()=>{const w=%s; S.settings.autoOn=false; S.draft=w.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===w.length-1?1:0})); const back=w.slice(0,-1).reverse(); back.forEach(q=>S.draft.push({x:q.x,y:q.y,port:null,fish:0})); const f=PORTS[0].p; S.draft.push({x:f.x,y:f.y,port:'finnsnes',fish:0}); panelDirty=true; renderPanel(); })()" % json.dumps(R)
        await pg.evaluate(js); await pg.wait_for_timeout(300)
        await pg.evaluate("document.body.classList.add('drawer')"); await pg.wait_for_timeout(1200); await pg.click('#panel [data-act=start]'); await pg.wait_for_timeout(1500)
        print('after start: 3D', await pg.evaluate("G3.isActive()"), 'status', await pg.evaluate("S.boat.status"), 'dock', await pg.evaluate("DOCK.text()"))
        await pg.evaluate("S.mult=600")
        for i in range(10):
            await pg.wait_for_timeout(2500)
            st = await pg.evaluate("S.boat.status")
            if st=='port': break
        print('end', await pg.evaluate("JSON.stringify({st:S.boat.status, port:S.boat.port, acts:DOCK.text()})"))
        print(logs); await b.close()
asyncio.run(main())
