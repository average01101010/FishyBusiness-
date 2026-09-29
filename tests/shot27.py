from _env import GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['4']
async def run(w,h,tag,dpr):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=dpr)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700)
        await pg.fill('#obCo', 'Johansen Kystfiske'); await pg.fill('#obBoat', 'Senjaværing')
        await pg.screenshot(path=f'{tag}_ob.png')
        await pg.click('#obGo')
        await pg.wait_for_function("G3.isActive()", timeout=40000); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{tag}_tut1.png')
        # simulate a trip so the log has content
        await pg.evaluate("(()=>{const w=%s; S.settings.autoOn=false; S.draft=w.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===w.length-1?2:0})); w.slice(0,-1).reverse().forEach(q=>S.draft.push({x:q.x,y:q.y,port:null,fish:0})); const f=PORTS[0].p; S.draft.push({x:f.x,y:f.y,port:'finnsnes',fish:0}); S.boat.ice=100; })()" % json.dumps(R))
        await pg.evaluate("(()=>{ S.plan={wps:S.draft.map(w=>({...w})),idx:0,speed:16,returning:false,depAt:null}; S.draft=[]; depart(); for(let i=0;i<60*14;i++) step(); doAct({dataset:{act:'sell'}}); doAct({dataset:{act:'fuel'}}); for(let i=0;i<60*30;i++) step(); S.tut=0; refreshAll(); })()")
        await pg.wait_for_timeout(800)
        await pg.click('#logbook'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{tag}_book1.png')
        # drag halfway to show the page turning, then release to complete
        box = await pg.locator('#bkStage').bounding_box()
        x0,y0 = box['x']+box['width']*0.08, box['y']+box['height']*0.5
        await pg.mouse.move(x0,y0); await pg.mouse.down()
        for k in range(1,9): await pg.mouse.move(x0+k*box['width']*0.05, y0-k*2); await pg.wait_for_timeout(30)
        await pg.screenshot(path=f'{tag}_book2.png')
        await pg.mouse.up(); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{tag}_book3.png')
        await pg.click('[data-bk=prev]'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{tag}_book4.png')
        print(tag, logs[:6]); await b.close()
async def main():
    import sys
    if sys.argv[1]=='tb': await run(1180,820,'tb',1)
    else: await run(390,844,'mb',2)
asyncio.run(main())
