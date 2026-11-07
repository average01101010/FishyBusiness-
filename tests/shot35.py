from _env import GAME, ROUTES
import asyncio, sys, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['0']
async def main(w,h,tag):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.equip.plotter=true; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(1200)
        await pg.evaluate("(()=>{const w=%s; const f=portById('husoy'); S.draft=[{x:43.95,y:18.9,port:null,fish:0},{x:44.4,y:15.2,port:null,fish:0},{x:44.05,y:8.35,port:null,fish:2}]; view.cx=44.1; view.cy=15.5; view.z=5; applyView(); renderStatic(); renderDyn(); panelDirty=true; renderPanel(); })()" % json.dumps(R))
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{tag}1.png')
        await pg.evaluate("view.cx=portById('husoy').p.x; view.cy=portById('husoy').p.y; view.z=60; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{tag}2.png')
        if w<700:
            await pg.click('#ecRoute'); await pg.wait_for_timeout(600); await pg.screenshot(path=f'{tag}4.png')
        await pg.click('#panel [data-act=cm][data-m=fish]'); await pg.wait_for_timeout(300)
        if w<700: await pg.click('#ecRoute'); await pg.wait_for_timeout(500)
        await pg.evaluate("view.z=8; applyView(); renderStatic(); renderDyn();"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{tag}3.png')
        print(tag, logs[:5]); await b.close()
asyncio.run(main(int(sys.argv[1]),int(sys.argv[2]),sys.argv[3]))
