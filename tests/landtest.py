from _env import GAME
# Landing (B4): the catch goes up with the crane over game time, the landing note comes at the end, departure waits for it,
# a standing plan's report comes with the note, and ice runs down the chute.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 9, 10) - EPOCH) / 6e4); const R = {};
          const fish = kg => [{sp:'sei', cls:1, kg, n:Math.round(kg / 4), bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}];
          const b = S.boat, q = portById('husoy'); b.status = 'port'; b.port = 'husoy'; b.pos = {...q.p}; S.plan = null; S.hold = fish(300);
          // the player lands 300 kg from the skiff: 8 boxes, one lift
          renderActs(); R.btn = !!document.querySelector('#actbar [data-act="sell"]');
          doAct({dataset:{act:'sell'}, disabled:false}); const L = b.land;
          R.plan = L && {kind:L.kind, n:L.n, lifts:L.lifts, dur:L.until - L.t0}; renderActs(); R.bar = document.getElementById('actbar').innerText;
          R.stillHold = holdTotal(); R.sale0 = S.lastSale;
          // a route set now leaves when the landing is done
          S.draft = [{x:q.p.x, y:q.p.y + 0.05, port:null, fish:0}, {x:q.p.x, y:q.p.y, port:'husoy', fish:0}]; doAct({dataset:{act:'start'}, disabled:false});
          R.depAt = S.plan && S.plan.depAt - L.until; R.statusAfterStart = b.status;
          const mid = []; while (S.t < L.until - 1){ step(); mid.push(b.status); } R.midPort = mid.every(s => s === 'port'); R.holdBefore = holdTotal(); R.textMid = landText(false);
          step(); R.landed = !b.land && holdTotal() === 0 && S.lastSale && S.lastSale.port === 'husoy'; step(); step(); R.after = b.status;
          // a sjark lands in tubs, and takes longer
          const P = landPlan('sjark', 2500), P2 = landPlan('sjarkny', 6000), P3 = landPlan('snekke', 900); R.sjark = P; R.sjarkny = P2; R.snekke = P3;
          // ice: the chute runs a minute for 50 kg
          b.status = 'port'; b.port = 'husoy'; b.pos = {...q.p}; S.plan = null; b.ice = 0; b.iceUntil = 0; doAct({dataset:{act:'ice'}, disabled:false}); R.ice = {kg:b.ice, run:b.iceUntil - S.t};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['btn'] and r['plan'] == {'kind':'box', 'n':8, 'lifts':1, 'dur':12.5} and r['stillHold'] == 300 and 'kranen' in r['bar']), 'the Land button starts a landing: 8 boxes in one lift, 12.5 game minutes, the fish stays aboard until then')
        print(ok(r['depAt'] == 1 and r['midPort'] and r['holdBefore'] == 300), 'a route set during the landing leaves the minute after it is done')
        print(ok(r['landed'] and r['after'] == 'unmooring'), 'the landing note comes at the end, then she casts off')
        print(ok(r['sjark']['kind'] == 'tub' and r['sjark']['lifts'] == 9 and r['sjarkny']['lifts'] == 20 and r['snekke']['lifts'] == 3), 'sjarks land in tubs of 300 kg, skiffs and snekker in boxes of 40 kg, nine to a lift')
        print(ok(r['ice']['kg'] == 50 and r['ice']['run'] == 1), 'ice runs down the chute')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
