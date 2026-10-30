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
        await pg.evaluate("S.t=12*60; S.settings.autoOn=false")   # 18:00, coastal ship northbound
        await pg.evaluate("view.cx=PORTS[0].p.x; view.cy=PORTS[0].p.y+6; view.z=3.5; applyView(); renderStatic(); renderDyn();")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path='m1.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.click('#view3d'); await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.wait_for_timeout(1500)
        # put the boat by the coastal ship
        await pg.evaluate("(()=>{const n=npcStates(S.t/60).find(q=>q.type==='coastal'); S.boat.status='idle'; S.boat.port=null; S.boat.pos={x:n.p.x+0.35,y:n.p.y+0.25}; S.boat.heading=-1.2; G3.reset(); G3._debug.cam.dist=180; G3._debug.cam.pitch=0.2; G3._debug.cam.yaw=2.4;})()")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path='m2.png', clip={'x':0,'y':66,'width':430,'height':470})
        # helm view
        await pg.evaluate("G3.setHelm(true); S.boat.heading=2.2;")
        await pg.wait_for_timeout(4000)
        await pg.screenshot(path='m3.png', clip={'x':0,'y':66,'width':430,'height':470})
        # wildlife: spawn a humpback and porpoises near the boat, follow camera
        await pg.evaluate("G3.setHelm(false); G3.reset(); G3._debug.cam.dist=60; G3._debug.cam.pitch=0.15; S.t=8*60; G3._debug.spawnWild('humpback'); G3._debug.spawnWild('porpoise');")
        for i in range(3):
            await pg.wait_for_timeout(1800)
            await pg.screenshot(path=f'm4_{i}.png', clip={'x':0,'y':66,'width':430,'height':470})
        print(logs[:10])
        await b.close()
asyncio.run(main())
