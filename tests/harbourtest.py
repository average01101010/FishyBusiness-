from _env import GAME
# Harbours (B1): the eight fish plants, ice only at the plants, fuel only at the bunker quays.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
PLANTS = ['husoy', 'senjahopen', 'botnhamn', 'gryllefjord', 'sommaroy', 'brensholmen', 'torsken', 'frovag']
FUEL = ['finnsnes', 'husoy', 'senjahopen', 'gryllefjord']

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)
        r = await pg.evaluate("""(()=>{
          S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 9, 10) - EPOCH) / 6e4); const R = {ports:{}};
          const acts = () => document.getElementById('actbar').innerText;
          for (const q of PORTS){
            const b = S.boat; b.status = 'port'; b.port = q.id; b.pos = {...q.p}; b.ice = 0; b.fuel = 10; S.plan = null;
            S.hold = [{sp:'torsk', cls:2, kg:100, n:25, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}];
            renderActs(); const a = acts();
            doAct({dataset:{act:'ice'}, disabled:false}); const ice = b.ice > 0;
            doAct({dataset:{act:'fuel'}, disabled:false}); const fuel = b.fuel > 10;
            let sold = false; if (q.mottak){ sold = !!document.querySelector('#actbar [data-act="sell"]'); sell(); sold = sold && S.lastSale.port === q.id && S.hold.length === 0; }
            R.ports[q.id] = {water:!isLand(q.p), iceBtn:a.includes('Kjøp is'), fuelBtn:a.includes('Fyll drivstoff'), ice, fuel, sold};
          }
          // a standing plan restocks only what the harbour sells
          const b = S.boat; b.port = 'torsken'; b.fuel = 10; b.ice = 0; autoRestock(); R.opsTorsken = {fuel:b.fuel, ice:b.ice};
          b.port = 'finnsnes'; b.fuel = 10; b.ice = 0; autoRestock(); R.opsFinnsnes = {fuel:Math.round(b.fuel), ice:b.ice};
          R.customers = CUSTOMERS.filter(c => ['sommaroy', 'brensholmen', 'torsken', 'frovag'].includes(c.port)).map(c => c.port);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        P = r['ports']
        print(ok(all(P[k]['water'] for k in P)), 'every harbour berth is in the water')
        print(ok(all(P[k]['sold'] and P[k]['iceBtn'] and P[k]['ice'] for k in PLANTS)), 'the eight plants buy fish and sell ice')
        print(ok(not P['finnsnes']['iceBtn'] and not P['finnsnes']['ice']), 'no ice in Finnsnes')
        print(ok(all(P[k]['fuelBtn'] == (k in FUEL) and P[k]['fuel'] == (k in FUEL) for k in P)), 'fuel only at Finnsnes, Husøy, Senjahopen and Gryllefjord')
        print(ok(r['opsTorsken']['fuel'] == 10 and r['opsTorsken']['ice'] > 0 and r['opsFinnsnes']['fuel'] > 10 and r['opsFinnsnes']['ice'] == 0), 'a standing plan restocks only what the harbour sells')
        print(ok(sorted(r['customers']) == ['brensholmen', 'frovag', 'sommaroy', 'torsken']), 'the new plants post orders')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
