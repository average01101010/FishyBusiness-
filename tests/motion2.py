from _env import GAME
import asyncio, json, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':400,'height':500})
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        out = await pg.evaluate("""(()=>{
          S.tut = 0; S.mult = 1; S.t = Math.round((Date.UTC(2027, 3, 10, 11) - EPOCH) / 6e4); S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; S.boat.fuel = 90;
          const D = G3._debug, bv = D.bv; bv.init = false; D.stepBoat(1 / 60, 0, 0);
          const R = FLEET[0].rt[0]; S.plan = {wps:R.slice(1).map(q => ({x:q[0], y:q[1], port:null, fish:0})), idx:0, speed:24, returning:false}; S.plan.wps[S.plan.wps.length - 1].fish = 2; S.boat.status = 'sailing'; S.boat.port = null;
          let frac = 0, t = 0; const rec = [];
          for (let i = 0; i < 60 * 150; i++){ const dt = 1 / 60; t += dt; frac += dt * GAME_RATE / 60; while (frac >= 1){ S.t++; step(); frac -= 1; }
            D.stepBoat(dt, t, frac); if (S.boat.status !== 'sailing') break;
            if (i % 30 === 0){ const L = livePose(frac); rec.push([+t.toFixed(1), +S.boat.v.toFixed(1), +(bv.spd / (1852 / 3600 * GAME_RATE)).toFixed(1), +bv.yr.toFixed(2), +((bv.head - bv.cog) * 180 / Math.PI).toFixed(1), Math.round(Math.hypot(L.p.x * 1000 - bv.px, L.p.y * 1000 - bv.pz)), +(bv.roll * 180 / Math.PI).toFixed(1)]); } }
          return rec; })()""")
        print(' t(s)  sim kn  vis kn  yaw rad/s  bow-in°  lag m  roll°')
        for r in out[::6]: print('%5.1f  %6.1f  %6.1f  %9.2f  %7.1f  %5d  %5.1f' % tuple(r))
        yaws=[r[3] for r in out]; spd=[r[2] for r in out]
        print('max speed change per 0.5 s: %.1f kn' % max(abs(spd[i+1]-spd[i]) for i in range(len(spd)-1)))
        print('max lag: %d m, max bow-into-turn: %.1f deg, max yaw %.2f rad/s' % (max(r[5] for r in out), max(abs(r[4]) for r in out), max(abs(y) for y in yaws)))
        await b.close()
asyncio.run(main())
