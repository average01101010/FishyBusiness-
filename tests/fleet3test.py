from _env import GAME
# Fleet phase 3: the Company app with alerts, the vessel selector in the vessel apps, income per vessel and hourly work per vessel.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)

        r = await pg.evaluate("""(()=>{
          const R = {}, q = s => document.querySelector(s), view = () => document.getElementById('phView').innerText;
          S.tut = 0; S.cash = 500000; S.t = Math.round((Date.UTC(2027, 5, 7, 10) - EPOCH) / 6e4);
          const v1 = curVessel(), v2 = newVesselObj('snekke', 'husoy');
          // something to report on each vessel
          S.boat.engH = 150; S.boat.svcAt = 0;
          withVessel(v2, () => { const c = Object.assign(genCrew(), {bi:false, off:false}); S.crew = [c]; S.boat.fuel = 10; S.ops = {on:true, dep:5, days:[1, 1, 1, 1, 1, 0, 0], maxWind:12, skipper:null, last:-1, wps:[], speed:8, home:'husoy', end:'husoy', hours:8}; });
          R.alerts = PHONE.alerts().map(a => a.id + ':' + a.k);
          PHONE.open('home'); const bd = [...document.querySelectorAll('.ph-app')].find(x => x.dataset.a === 'rederi'); R.badge = bd && bd.querySelector('.bd') ? bd.querySelector('.bd').textContent : null;
          // the Company app lists both vessels and the alerts
          PHONE.open('rederi'); R.cards = (view().match(/«/g) || []).length; R.hasFuel = view().includes('Lite drivstoff');
          // an alert opens the right app on the right vessel, without changing the vessel you follow
          const go = [...document.querySelectorAll('[data-pa="goto"]')].find(x => x.dataset.id === v2.id && x.dataset.a === 'mannskap'); go.click();
          R.goto = {app:PHONE.app, sel:PHONE.sel, cur:S.cur, crewShown:view().includes(vget(v2, 'crew')[0].name)};
          // equipment bought with the selector on the second vessel is fitted there
          PHONE.open('utstyr'); [...document.querySelectorAll('[data-pa="vsel"]')].find(x => x.dataset.id === v2.id).click();
          q('[data-pa="equip"][data-k="chirp"]').click();
          R.equip = {v2jobs:(vget(v2, 'jobs') || []).map(j => j.kind + ':' + j.k), v1jobs:(S.jobs || []).map(j => j.kind + ':' + j.k), cur:S.cur, sel:PHONE.sel};
          // income per vessel
          withVessel(v2, () => { S.boat.status = 'port'; S.boat.port = 'husoy'; S.hold = [{sp:'sei', cls:1, kg:200, n:40, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}]; S.tripOwner = true; sell(); });
          const last = S.sales[S.sales.length - 1]; R.sale = {v:last.v, total:last.total};
          PHONE.open('rederi'); R.incomeShown = view().includes(kr(last.total));
          // hourly work per vessel: the service reminder names the vessel
          withVessel(v2, () => { S.boat.engH = 400; S.svcTold = false; }); hourly();
          R.svcMsgs = S.msgs.filter(m => m.from === 'Verkstedet').map(m => m.no.slice(0, 40));
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        a = r['alerts']
        print(ok('v1:svc' in a and 'v2:fuel' in a and 'v2:ops' in a), 'alerts: service on the first vessel, low fuel and a plan without skipper on the second')
        print(ok(r['badge'] == str(len(a))), 'the Company icon shows the number of alerts')
        print(ok(r['cards'] >= 2 and r['hasFuel']), 'the Company app shows the fleet and the alerts')
        print(ok(r['goto']['app'] == 'mannskap' and r['goto']['sel'] == 'v2' and r['goto']['cur'] == 'v1' and r['goto']['crewShown']), 'an alert opens the crew app on the second vessel, following stays on the first')
        print(ok(r['equip']['v2jobs'] == ['fit:chirp'] and r['equip']['v1jobs'] == [] and r['equip']['cur'] == 'v1'), 'equipment bought with the selector goes to the selected vessel')
        print(ok(r['sale']['v'] == 'v2' and r['incomeShown']), 'the landing is booked on the vessel and shows as its income today')
        print(ok(any(m.startswith('«Senjaværing»') for m in r['svcMsgs']) and any(m.startswith('«Havbris»') for m in r['svcMsgs'])), 'service reminders per vessel, with the vessel name')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
