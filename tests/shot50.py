from _env import GAME
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':700}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('ERR '+str(e)))
        await pg.goto(GAME)
        await pg.wait_for_timeout(900); await pg.click('#obGo')
        await pg.evaluate("S.tut=0; S.t=(24*27+8)*60; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p};")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(4000)
        await pg.evaluate("G3._debug.cam.dist=90; G3._debug.cam.pitch=0.45; G3._debug.cam.yaw=2.9;"); await pg.wait_for_timeout(10000); await pg.screenshot(path='f3.png')
        out = await pg.evaluate("""(()=>{
          G3.show(false); S.plan=null; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.boat.fuel=20; S.hold=[]; S.jobs=[];
          S.crew=[{id:'k1', name:'Ola Hansen', age:34, lv:'erfaren', lvEn:'experienced', skill:1.0, share:0.16}];
          const R=FLEET[0].rt[0], out=R.map(q=>({x:q[0],y:q[1],port:null,fish:0})); out[out.length-1].fish=3; const back=R.slice(0,-1).reverse().map(q=>({x:q[0],y:q[1],port:null,fish:0})); back[back.length-1].port='husoy';
          S.ops={on:true, dep:5, days:[1,1,1,1,1,1,1], maxWind:25, skipper:'k1', last:-1, wps:out.slice(1).concat(back), speed:18, home:'husoy', end:'husoy', hours:6};
          S.t = Math.floor(S.t/1440)*1440 + 1440 + 4*60 + 50 - 6*60;
          const seen=[]; let prev=S.boat.status, cash0=S.cash;
          for (let i=0;i<14*60;i++){ step(); if (S.boat.status!==prev){ seen.push(hm(S.t/60)+' '+S.boat.status); prev=S.boat.status; } }
          return new Promise(res=>setTimeout(()=>res(JSON.stringify({seen, cashDelta:Math.round(S.cash-cash0), fuel:Math.round(S.boat.fuel), ice:Math.round(S.boat.ice), hold:Math.round(holdTotal()), msg:S.msgs.slice(-2).map(m=>JSON.stringify(m).slice(0,260)), log:S.log.slice(-5).map(l=>l.no||'')})), 50));
        })()""")
        print(out)
        print(logs[:5]); await b.close()
asyncio.run(main())
