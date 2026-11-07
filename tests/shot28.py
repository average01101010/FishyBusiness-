from _env import GAME, ROUTES
import asyncio, json, sys
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['4']
async def run(w,h,tag,dpr):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':w,'height':h}, device_scale_factor=dpr)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*21+11.9)*60; S.settings.autoOn=false;")
        await pg.wait_for_function("G3.isActive()", timeout=40000); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{tag}_port.png')
        await pg.evaluate("(()=>{const w=%s; S.plan={wps:w.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===w.length-1?2:0})),idx:0,speed:16,returning:false,depAt:null}; depart(); for(let i=0;i<4;i++) step(); refreshAll(); })()" % json.dumps(R))
        await pg.wait_for_timeout(3000)
        await pg.screenshot(path=f'{tag}_sail.png')
        print(tag, logs[:5]); await b.close()
async def main():
    if sys.argv[1]=='mb': await run(390,844,'c_mb',2)
    else: await run(820,1180,'c_tb',1)
asyncio.run(main())
