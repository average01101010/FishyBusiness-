from _env import GAME_TUT as GAME, ROUTES
import asyncio, json
from playwright.async_api import async_playwright
R=json.load(open(ROUTES))['4']
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':390,'height':760})
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(700); await pg.click('#obGo')
        await pg.wait_for_function("G3.isActive()", timeout=40000); await pg.wait_for_timeout(800)
        st = lambda: pg.evaluate("JSON.stringify({tut:S.tut, tip:!document.getElementById('tip').hidden, text:document.getElementById('tipText').textContent.slice(0,40), name:S.boatName, co:S.company})")
        print('1', await st())
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(700); print('2', await st())
        await pg.evaluate("(()=>{const w=%s; S.draft=w.map((q,i)=>({x:q.x,y:q.y,port:null,fish:i===w.length-1?2:0})); w.slice(0,-1).reverse().forEach(q=>S.draft.push({x:q.x,y:q.y,port:null,fish:0})); const f=PORTS[0].p; S.draft.push({x:f.x,y:f.y,port:'finnsnes',fish:0}); panelDirty=true; renderPanel(); })()" % json.dumps(R))
        await pg.wait_for_timeout(700); print('3', await st())
        await pg.click('#panel [data-act=start]'); await pg.wait_for_timeout(1500); print('4', await st())
        await pg.click('#tipOk'); await pg.wait_for_timeout(500); print('5', await st())
        await pg.click('#logbook'); await pg.wait_for_timeout(700); print('after book', await st())
        print(logs); await b.close()
asyncio.run(main())
