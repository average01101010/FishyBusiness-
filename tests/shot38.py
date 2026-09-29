from _env import GAME
import asyncio, sys
from playwright.async_api import async_playwright
async def main(which):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':820,'height':1180}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        if which=='husoy':
            await pg.evaluate("S.tut=0; S.t=(24*26+1.4)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(5000)
            await pg.evaluate("G3._debug.cam.dist=40; G3._debug.cam.pitch=0.12; G3._debug.cam.yaw=0.6;"); await pg.wait_for_timeout(12000); await pg.screenshot(path='w1.png')
            await pg.evaluate("G3._debug.cam.dist=500; G3._debug.cam.pitch=0.3; G3._debug.cam.yaw=2.6;"); await pg.wait_for_timeout(12000); await pg.screenshot(path='w2.png')
            print(await pg.evaluate("JSON.stringify({tide:G3._debug.env.tide, moon:G3._debug.env.moon, sunEl:G3._debug.env.el})"))
        elif which=='night':
            await pg.evaluate("S.tut=0; S.t=453.5*60; S.boat.status='idle'; S.boat.port=null; S.boat.pos={...GROUNDS[0].p};")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
            info = await pg.evaluate("JSON.stringify({moon:G3._debug.env.moon, sunEl:G3._debug.env.el})"); print(info)
            await pg.evaluate("(()=>{ const m=G3._debug.env.moon; const c=G3._debug.cam, bv=G3._debug.bv; c.dist=45; c.pitch=0.03; c.yaw = m.az - bv.head; })()"); await pg.wait_for_timeout(12000); await pg.screenshot(path='w3.png')
        else:
            await pg.evaluate("S.tut=0; S.t=(24*2+5.2)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
            await pg.click('#gpsBtn'); await pg.wait_for_timeout(1500)
            await pg.evaluate("view.cx=38; view.cy=22; view.z=4; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(1500)
            vid = await pg.evaluate("(()=>{ const n=AISNOW.find(q=>q.fleet&&q.st==='fishing'&&q.v>2.5)||AISNOW.find(q=>q.fleet&&q.st==='fishing'); AISSEL=n&&n.id; renderDyn(); renderAisCard(); return n&&n.name; })()")
            print('selected', vid); await pg.wait_for_timeout(800)
            await pg.screenshot(path='w4.png')
            # pan by dragging and capture mid-drag
            await pg.mouse.move(300,600); await pg.mouse.down(); await pg.mouse.move(420,520, steps=6); await pg.wait_for_timeout(200)
            await pg.screenshot(path='w5.png'); await pg.mouse.up(); await pg.wait_for_timeout(900); await pg.screenshot(path='w6.png')
        print(which, logs[:5]); await b.close()
asyncio.run(main(sys.argv[1]))
