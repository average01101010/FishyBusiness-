from _env import GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['4']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=2)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('[data-close]')
        await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.evaluate("S.cash=40000; S.marks=[{x:57.25,y:44.35,t:S.t,kgph:27},{x:45.2,y:65.1,t:S.t,kgph:44},{x:58.4,y:47.2,t:S.t,kgph:9}]; refreshAll();")
        # workshop
        await pg.click('#phoneFab'); await pg.wait_for_timeout(500)
        await pg.evaluate("PHONE.open('verksted')"); await pg.wait_for_timeout(300)
        await pg.click('#phView [data-pa=svc][data-m=self]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path='y1.png')
        await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(400)
        # plan a route with a later departure
        await pg.click('#gps'); await pg.wait_for_timeout(800)
        await pg.evaluate("(()=>{const w=%s; S.draft=w.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===w.length-1?2:0})); w.slice(0,-1).reverse().forEach(q=>S.draft.push({x:q.x,y:q.y,port:null,fish:0})); const f=PORTS[0].p; S.draft.push({x:f.x,y:f.y,port:'finnsnes',fish:0}); view.cx=56; view.cy=46; view.z=4.5; applyView(); renderStatic(); renderDyn(); panelDirty=true; renderPanel(); })()" % json.dumps(R))
        await pg.wait_for_timeout(400)
        await pg.select_option('#dep', index=8); await pg.wait_for_timeout(300)
        await pg.screenshot(path='y2.png')
        await pg.click('#panel [data-act=start]'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='y3.png')
        print(await pg.evaluate("JSON.stringify({st:S.boat.status, dep:S.plan&&S.plan.depAt, jobs:S.jobs.length, acts:DOCK.text(), hud:document.querySelector('#hud .st').innerText})"))
        print(logs[:10]); await b.close()
asyncio.run(main())
