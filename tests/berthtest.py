from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':520,'height':760})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{ const H = (Date.UTC(2027, 2, 10, 1) - EPOCH) / 36e5, res = [];   // 01:00: the fleet is in port
          for (const n of npcStates(H)){ let bd = 1e9, bp = null; for (const q of PORTS){ const d = dist(n.p, q.p); if (d < bd){ bd = d; bp = q.id; } } if (bd < 0.2) res.push([n.id, bp, Math.round(bd * 1000), isLand(n.p)]); }
          let land = 0, pts = 0; for (let k = 0; k < 7 * 24 * 6; k++){ const t = H + k / 6; for (let i = 0; i < FLEET.length; i++){ pts++; if (isLand(fleetState(i, t).p)) land++; } }
          const pairs = []; for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++){ const A = npcStates(H).find(n => n.id === res[i][0]), B = npcStates(H).find(n => n.id === res[j][0]); if (res[i][1] === res[j][1]) pairs.push([res[i][0], res[j][0], Math.round(dist(A.p, B.p) * 1000)]); }
          return {inPort:res, land, pts, pairs}; })()""")
        print('moored near harbours [id, port, metres from harbour point, on land]:', json.dumps(r['inPort']))
        print('week of fleet positions on land:', r['land'], 'of', r['pts'])
        print('vessels sharing a harbour, metres apart:', json.dumps(r['pairs']))
        # a real tap on the Husøy harbour point in the plotter
        await pg.evaluate("S.tut=0; S.t = Math.round((Date.UTC(2027, 2, 10, 1) - EPOCH) / 6e4); S.boat.status='port'; S.boat.port='finnsnes'; S.boat.pos={...portById('finnsnes').p}; S.draft=[];")
        await pg.click('#gpsBtn'); await pg.wait_for_timeout(1200)
        await pg.evaluate("const q = portById('husoy').p; view.cx = q.x; view.cy = q.y; view.z = 40; applyView(); scheduleStatic(); renderDyn();"); await pg.wait_for_timeout(1500)
        box = await pg.evaluate("(() => { const r = svg.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
        await pg.mouse.click(box[0], box[1]); await pg.wait_for_timeout(800)
        print('tap on Husøy: waypoints', await pg.evaluate("S.draft.length"), 'last port', await pg.evaluate("S.draft.length ? S.draft[S.draft.length-1].port : null"), 'AIS selected', await pg.evaluate("typeof AISSEL !== 'undefined' ? AISSEL : null"))
        await pg.screenshot(path='b1.png')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
