from _env import GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['0']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':430,'height':820}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type=='error' else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(800)
        await pg.click('[data-close]')
        await pg.wait_for_timeout(500)
        await pg.screenshot(path='k1.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.click('#modeBtn'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path='k2.png', clip={'x':0,'y':66,'width':430,'height':470})
        # sail on the route to the northern ground and look at instruments
        await pg.evaluate("(()=>{const R=%s; S.settings.autoOn=false; S.draft=R.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===R.length-1?2:0})); panelDirty=true;})()" % json.dumps(R))
        await pg.wait_for_timeout(400)
        await pg.click('[data-act=start]')
        await pg.evaluate("S.mult=30")
        await pg.wait_for_timeout(9000)
        await pg.click('#view3d'); await pg.wait_for_timeout(1500)
        await pg.evaluate("view.cx=S.boat.pos.x; view.cy=S.boat.pos.y; view.z=6; applyView(); renderStatic(); renderDyn();")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path='k3.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.click('#modeBtn'); await pg.wait_for_timeout(1500)
        await pg.screenshot(path='k4.png', clip={'x':0,'y':66,'width':430,'height':470})
        print(await pg.evaluate("JSON.stringify({st:S.boat.status, depthLoaded: !!DEPTH, d: depthAt(S.boat.pos)})"))
        print(logs[:10])
        await b.close()
asyncio.run(main())
