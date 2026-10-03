from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':420,'height':560})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("S.tut=0; S.settings.speed=1; S.t=Math.round((Date.UTC(2028,2,10,11)-EPOCH)/6e4); S.boat.status='fishing'; S.boat.port=null; S.boat.pos={...GROUNDS[0].p}; S.boat.fishUntil=S.t+900; S.hold=[{sp:'torsk',cls:2,kg:60,n:12,fresh:95,hr:0,bled:true,iced:true}];")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        shots=[]
        for i,(mode,setup) in enumerate([('rod',"S.boat.gear=false; S.equip.jukse=0;"),('juksa',"S.boat.gear=true; S.equip.jukse=0;"),('machine',"S.boat.gear=true; S.equip.jukse=2;")]):
            await pg.evaluate(setup + "G3._debug.cam.helm=false; G3._debug.cam.dist=4.6; G3._debug.cam.pitch=0.16; G3._debug.cam.yaw=-0.85;")
            await pg.wait_for_timeout(2500)
            await pg.evaluate("window.CATCHQ=[{sp:'torsk',kg:5.5,t:performance.now()},{sp:'sei',kg:2.4,t:performance.now()},{sp:'torsk',kg:3.1,t:performance.now()}]")
            await pg.wait_for_timeout(9000 if mode!='rod' else 6000); await pg.screenshot(path=f'an{i}a.png')
            await pg.wait_for_timeout(5000); await pg.screenshot(path=f'an{i}b.png')
            print(mode, await pg.evaluate("JSON.stringify({st:G3._debug.SK.anim.st, mode:G3._debug.SK.anim.mode, fish:G3._debug.SK.anim.fish.length, fly:G3._debug.SK.anim.fly.length, q:window.CATCHQ.length, mc:G3._debug.SK.anim.mc.map(m=>m.st)})"))
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
