from _env import GAME
import asyncio, json, math
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':420,'height':560})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        await pg.evaluate("S.tut=0; S.t=Math.round((Date.UTC(2027,3,10,11)-EPOCH)/6e4); S.boat.status='port'; S.boat.port='husoy'; S.boat.pos={...portById('husoy').p}; S.boat.fuel=90;")
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        await pg.evaluate("""(()=>{ const R = FLEET[0].rt[0]; S.plan = {wps:R.slice(1).map(q => ({x:q[0], y:q[1], port:null, fish:0})), idx:0, speed:24, returning:false}; S.boat.status='sailing'; S.boat.port=null; })()""")
        await pg.evaluate("G3._debug.cam.helm=false; G3._debug.cam.dist=70; G3._debug.cam.pitch=1.0; G3._debug.cam.yaw=0;")
        rows=[]
        for i in range(70):
            r = await pg.evaluate("(()=>{ const v = G3._debug.bv, G = {bow:-2.2, stern:3.1}; const sx = v.x - Math.sin(v.head) * 3.1, sz = v.z + Math.cos(v.head) * 3.1; return [performance.now(), v.px, v.pz, v.head, v.cog, v.spd, v.yr, S.boat.v, sx, sz].concat(v.dbg || [0,0,0,0]); })()")
            rows.append(r)
            if i == 45: await pg.screenshot(path='m1.png')
            await pg.wait_for_timeout(400)
        # analysis
        t0=rows[0][0]; out=[]
        for r in rows[::5]: out.append(f"t={ (r[0]-t0)/1000:5.1f}s sim={r[7]:4.1f}kn vis={r[5]/3.087:5.1f}kn yaw={r[6]:+.2f} drift={math.degrees(r[3]-r[4]):+5.1f}° err={math.degrees(r[10]):+6.1f}° toSim={r[11]:5.0f}m toCarrot={r[12]:5.0f}m dt={r[13]:.2f}")
        print('\n'.join(out))
        dh=[abs(((rows[i+1][3]-rows[i][3]+math.pi)%(2*math.pi))-math.pi) for i in range(len(rows)-1)]
        dv=[abs(rows[i+1][5]-rows[i][5])/3.087 for i in range(len(rows)-1)]
        print('max heading step between samples: %.1f°  max speed step: %.1f kn' % (math.degrees(max(dh)), max(dv)))
        # stern path vs pivot path during the biggest turn: the stern should travel further (swing out)
        i=max(range(len(rows)), key=lambda k: abs(rows[k][6]))
        print('sharpest turn: yaw %.2f rad/s at %.0f kn, bow into the turn by %.1f deg' % (rows[i][6], rows[i][5]/3.087, math.degrees(rows[i][3]-rows[i][4])))
        print('resets (jumps > 150 m between samples):', sum(1 for k in range(len(rows)-1) if math.hypot(rows[k+1][1]-rows[k][1], rows[k+1][2]-rows[k][2]) > 150))
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
