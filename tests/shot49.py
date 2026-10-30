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
        await pg.evaluate("G3._debug.cam.dist=70; G3._debug.cam.pitch=0.55; G3._debug.cam.yaw=0.4;"); await pg.wait_for_timeout(9000); await pg.screenshot(path='f1.png')
        # prop wash at speed
        g="GROUNDS[1].p"
        await pg.evaluate(f"S.boat.status='sailing'; S.boat.port=null; S.boat.pos={{...{g}}}; S.boat.v=24; S.plan={{wps:[{{x:{g}.x+6*Math.sin(0.6),y:{g}.y-6*Math.cos(0.6),port:null,fish:0}}],idx:0,speed:24,returning:false}}; S.boat.heading=0.6; G3._debug.bv.init=false;")
        await pg.evaluate("G3._debug.cam.dist=60; G3._debug.cam.pitch=0.8; G3._debug.cam.yaw=2.6;"); await pg.wait_for_timeout(16000); await pg.screenshot(path='f2.png')
        # standing plan run by a hired skipper, simulated minute by minute
        out = await pg.evaluate("""(()=>{
          G3.show(false); S.plan=null; S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.boat.fuel=20; S.hold=[]; S.jobs=[];
          S.crew=[{id:'k1', name:'Ola Hansen', age:34, lv:'erfaren', lvEn:'experienced', skill:1.0, share:0.16}];
          const g=GROUNDS[0].p, h=portById('husoy').p;
          S.ops={on:true, dep:5, days:[1,1,1,1,1,1,1], maxWind:25, skipper:'k1', last:-1, wps:[{x:g.x,y:g.y,port:null,fish:3},{x:h.x,y:h.y,port:'husoy',fish:0}], speed:18, home:'husoy', end:'husoy', hours:6};
          S.t = Math.floor(S.t/1440)*1440 + 1440 + 4*60 + 50 - 6*60;   // just before 05:00 the next day
          const seen=[]; let prev=S.boat.status, cash0=S.cash;
          for (let i=0;i<14*60;i++){ step(); if (S.boat.status!==prev){ seen.push(hm(S.t/60)+' '+S.boat.status); prev=S.boat.status; } }
          return JSON.stringify({seen, cash:Math.round(S.cash-cash0), fuel:Math.round(S.boat.fuel), msgs:S.msgs.slice(-3).map(m=>(m.from||'')+': '+(m.no||m.text||'').slice(0,140)), log:S.log.slice(-6).map(l=>l.no||l[1]||'')});
        })()""")
        print(out)
        print(logs[:5]); await b.close()
asyncio.run(main())
