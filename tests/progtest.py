from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        t0 = await pg.evaluate("S.t"); await pg.wait_for_timeout(20000); t1 = await pg.evaluate("S.t")
        print('game minutes in 20 real s:', t1 - t0, '(expected ~2 at 1:6)')
        await pg.evaluate("S.tut=0; S.cash=620000; S.sales=[{t:0,port:'husoy',kg:300,total:15000},{t:1,port:'husoy',kg:300,total:15000},{t:2,port:'husoy',kg:300,total:15000}]; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.boat.gear=true; S.equip.jukse=1; PHONE.open('fartoy')")
        await pg.wait_for_timeout(600)
        await pg.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Marked').click()"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='p1.png', full_page=False)
        await pg.evaluate("document.querySelector('[data-pa=buylic][data-id=u7]').click()"); await pg.wait_for_timeout(600)
        out = await pg.evaluate("JSON.stringify({type:S.boat.type, lic:S.lic && S.lic.hl, cash:Math.round(S.cash), loan:S.loan && {bal:Math.round(S.loan.bal), pay:S.loan.pay}, limit:codLimitNow(S.t/60), open:codOpen(S.t/60)})")
        print('after buying:', out)
        await pg.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Min båt') && 0; PHONE.open('salg')"); await pg.wait_for_timeout(500)
        await pg.evaluate("[...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'Kvote').click()"); await pg.wait_for_timeout(600)
        await pg.screenshot(path='p2.png')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
