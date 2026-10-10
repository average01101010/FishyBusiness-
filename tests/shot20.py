from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
H0="(24*80+13)*60"   # 20 May 19:00: coastal ship at the Finnsnes quay, ferry running
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':430,'height':820}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(800)
        await pg.click('[data-close]')
        await pg.evaluate(f"S.t={H0}; S.settings.autoOn=false; view.cx=PORTS[0].p.x; view.cy=PORTS[0].p.y-1; view.z=6; applyView(); renderStatic(); renderDyn();")
        await pg.wait_for_timeout(1200)
        print(await pg.evaluate("JSON.stringify(npcStates(S.t/60).map(n=>[n.id,n.v,+n.p.x.toFixed(2),+n.p.y.toFixed(2)]))"))
        await pg.screenshot(path='n1.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.click('#view3d'); await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.evaluate("G3._debug.cam.dist=260; G3._debug.cam.pitch=0.18; G3._debug.cam.yaw=0.9;")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path='n2.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3.setHelm(true);")
        await pg.wait_for_timeout(3500)
        await pg.screenshot(path='n3.png', clip={'x':0,'y':66,'width':430,'height':470})
        # out on the bank off Mefjorden, midday
        await pg.evaluate("G3.setHelm(false); S.t=(24*80+6)*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[1].p}; S.boat.heading=0.4; G3.reset(); G3._debug.cam.dist=70; G3._debug.cam.pitch=0.12;")
        await pg.wait_for_timeout(3000)
        await pg.evaluate("G3._debug.spawnWild('porpoise'); G3._debug.spawnWild('humpback'); G3._debug.spawnWild('orca');")
        for i in range(3):
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=f'n4_{i}.png', clip={'x':0,'y':66,'width':430,'height':470})
        print(logs[:10])
        await b.close()
asyncio.run(main())
