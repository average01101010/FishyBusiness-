from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':1100,'height':800}, device_scale_factor=1.5)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        pg.on('console', lambda m: logs.append(m.type+': '+m.text) if m.type=='error' else None)
        await pg.goto(GAME)
        await pg.wait_for_timeout(800)
        await pg.click('[data-close]')
        # fast-forward a few days so there are messages, news and landings
        await pg.evaluate("""(()=>{ S.settings.autoOn=false; for(let i=0;i<60*24*4;i++) step(); S.sales.push({t:S.t-600,port:'husoy',kg:212,total:10900,sp:[['torsk',150],['sei',62]]}); S.cash=420000; refreshAll(); })()""")
        await pg.click('#phoneBtn'); await pg.wait_for_timeout(600)
        await pg.screenshot(path='p_home.png', clip={'x':740,'y':110,'width':360,'height':690})
        shots=[('vaer',None),('post',None),('salg',None),('salg','land'),('salg','top'),('redning',None),('fartoy',None),('fartoy','marked'),('utstyr',None),('mannskap',None),('bank',None),('meld',None)]
        for a,sb in shots:
            await pg.evaluate(f"PHONE.open('{a}')"); await pg.wait_for_timeout(250)
            if sb: await pg.click(f'#phView [data-pa=sub][data-s={sb}]'); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'p_{a}{"_"+sb if sb else ""}.png', clip={'x':740,'y':110,'width':360,'height':690})
        print(logs[:10])
        await b.close()
asyncio.run(main())
