from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':430,'height':860}, device_scale_factor=2)
        logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(800); await pg.click('[data-close]')
        await pg.evaluate("S.settings.autoOn=false; S.cash=60000; S.t=(24*80+8)*60; for(let i=0;i<3;i++) S.sales.push({t:S.t-100*i,port:'husoy',kg:200,total:10000,sp:[['torsk',200]]}); refreshAll();")
        # plotter gating: click Plotter without a plotter -> phone opens on Utstyr
        await pg.click('#modeBtn'); await pg.wait_for_timeout(600)
        print('phone app after plotter click:', await pg.evaluate("PHONE.isOpen() && PHONE.app"))
        await pg.click('#phView [data-pa=equip][data-k=plotter]'); await pg.wait_for_timeout(300)
        await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(400)
        await pg.click('#modeBtn'); await pg.wait_for_timeout(1500)
        print('plotter on:', await pg.evaluate("S.settings.plotter"), 'cash', await pg.evaluate("Math.round(S.cash)"))
        # buy the snekke with a loan
        await pg.evaluate("PHONE.open('fartoy')"); await pg.wait_for_timeout(300)
        await pg.click('#phView [data-pa=sub][data-s=marked]'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='q1.png', clip={'x':0,'y':0,'width':430,'height':860})
        await pg.click('#phView [data-pa=buy][data-k=snekke]'); await pg.wait_for_timeout(400)
        print('after buy', await pg.evaluate("JSON.stringify({type:S.boat.type, cash:Math.round(S.cash), loan:S.loan&&{bal:Math.round(S.loan.bal),pay:S.loan.pay}, fuel:Math.round(S.boat.fuel), cap:BOAT.holdCap})"))
        await pg.evaluate("PHONE.open('mannskap')"); await pg.wait_for_timeout(300)
        await pg.click('#phView [data-pa=hire] >> nth=0'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='q2.png', clip={'x':0,'y':0,'width':430,'height':860})
        await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(300)
        await pg.click('#view3d'); await pg.wait_for_function("G3.isActive()", timeout=40000)
        await pg.evaluate("G3._debug.cam.dist=18; G3._debug.cam.pitch=0.22; G3._debug.cam.yaw=2.3;"); await pg.wait_for_timeout(3500)
        await pg.screenshot(path='q3.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='q4.png', clip={'x':0,'y':66,'width':430,'height':470})
        # try the new sjark model too
        await pg.evaluate("G3.setHelm(false); PHONE.switchVessel('sjark'); G3._debug.cam.dist=22; G3._debug.cam.yaw=2.5;"); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='q5.png', clip={'x':0,'y':66,'width':430,'height':470})
        await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(3000)
        await pg.screenshot(path='q6.png', clip={'x':0,'y':66,'width':430,'height':470})
        print(logs[:10]); await b.close()
asyncio.run(main())
