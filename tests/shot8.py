from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':700}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(400)
        await pg.click('[data-close]')
        await pg.evaluate("S.t=5*60; S.settings.autoOn=false")
        # plan: one fishing waypoint on ground 4 (Gisundet nord), back to Finnsnes
        await pg.evaluate("""(()=>{ const R=[{"x": 55.55, "y": 53.75}, {"x": 55.75, "y": 51.55}, {"x": 56.25, "y": 44.95}, {"x": 57.75, "y": 43.45}, {"x": 57.725, "y": 43.425}]; S.draft=R.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===R.length-1?2:0})); hooks.render && 0; })()""")
        await pg.evaluate("panelDirty=true")
        await pg.wait_for_timeout(300)
        t0 = await pg.evaluate("performance.now()")
        await pg.evaluate("document.querySelector('[data-act=start]') && document.querySelector('[data-act=start]').click()")
        t1 = await pg.evaluate("performance.now()")
        print('start+init ms', round(t1-t0), 'active', await pg.evaluate("G3.isActive()"), 'status', await pg.evaluate("S.boat.status"))
        await pg.wait_for_timeout(3000)
        await pg.screenshot(path='f1.png', clip={'x':0,'y':66,'width':390,'height':420})
        # jump to fishing
        await pg.evaluate("S.boat.status='fishing'; S.boat.pos={...GROUNDS[4].p}; S.boat.fishLeft=60; G3._debug.cam.yaw=0.9; G3._debug.cam.dist=12")
        await pg.wait_for_timeout(3000)
        await pg.screenshot(path='f2.png', clip={'x':0,'y':66,'width':390,'height':420})
        await pg.click('#view3d')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path='f3.png', clip={'x':0,'y':66,'width':390,'height':420})
        print('active after toggle', await pg.evaluate("G3.isActive()"))
        print(logs[:10])
        await b.close()
asyncio.run(main())
