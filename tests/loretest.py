from _env import GAME
# The old ways (O): superstition as lore. The crew, the quay and the pub tell of it at the right moments; what you hear is kept in the
# Seaman app. Lore only: no effect on the crew's mood, the catch or the weather.
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
          S.tut = 0; S.cash = 1e6; S.settings.autoOn = false; const R = {}, b = S.boat, q = portById('finnsnes');
          const old = Object.assign(genCrew(), {age:67, bi:false, off:false}), young = Object.assign(genCrew(), {age:19, bi:false, off:false}); S.crew = [old, young]; S.lore = {};
          const morale0 = S.crew.map(c => c.morale);
          // a Friday departure: the old hand mutters
          S.t = Math.round((Date.UTC(2027, 5, 11, 6) - EPOCH) / 6e4); R.friday = gDate(S.t / 60).getUTCDay();
          b.status = 'port'; b.port = 'finnsnes'; b.pos = {...q.p}; S.plan = {wps:[{x:q.p.x - 0.3, y:q.p.y, port:null, fish:0}], idx:0, speed:8, returning:false}; const m0 = S.msgs.length; depart();
          R.fri = {heard:!!S.lore.fredag, from:(S.msgs[m0] || {}).from, text:(S.msgs[m0] || {}).no, log:S.log.some(e => /fredag/.test(e.no))};
          // the same story not every day
          b.status = 'port'; b.pos = {...q.p}; const m1 = S.msgs.length; S.plan = {wps:[{x:q.p.x - 0.3, y:q.p.y, port:null, fish:0}], idx:0, speed:8, returning:false}; for (let i = 0; i < 20; i++){ b.status = 'port'; depart(); } R.repeat = S.msgs.slice(m1).filter(m => /fredag/.test(m.no)).length;
          // renaming the boat, a new boat from the yard
          loreRename('Nordlys'); R.rename = !!S.lore.omdoping; newVesselObj('snekke', 'finnsnes'); R.coin = !!S.lore.mastemynt && S.msgs.some(m => m.from === 'Verftet' && /mynt under masta/.test(m.no));
          // at sea at night in poor sight the draug may show; over some days at sea the crew brings up the old ways
          b.status = 'sailing'; S.t = Math.round((Date.UTC(2027, 11, 3, 1) - EPOCH) / 6e4); let n = 0; for (let i = 0; i < 400; i++){ S.t += 60; loreHour(); } R.atSea = Object.keys(S.lore);
          // the pub tells a story instead of an empty evening
          const p0 = Object.keys(S.lore).length, st = lorePub(); R.pub = {story:st && st[0], more:Object.keys(S.lore).length - p0};
          // no effect on the crew
          R.morale = S.crew.map(c => c.morale).every((m, i) => m === morale0[i]);
          // the Seaman app
          PHONE.open('sjomann'); const v = document.querySelector('.ph-appv'); R.app = {text:v ? v.innerText.slice(0, 160) : null, cards:v ? v.querySelectorAll('.ph-card').length : 0, unknown:v ? v.innerText.split('Ennå ikke hørt').length - 1 : -1};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['friday'] == 5 and r['fri']['heard'] and r['fri']['text'] and 'fredag' in r['fri']['text'] and r['fri']['log']), 'a Friday departure: the oldest hand mutters, and it goes in the deck log')
        print(ok(r['repeat'] == 0), 'the same story does not come again within three days')
        print(ok(r['rename'] and r['coin']), 'renaming the boat brings up the old belief; the yard lays a coin under the mast of a new boat')
        print(ok(len(r['atSea']) >= 5), 'over some days at sea the crew brings up more of the old ways')
        print(ok(r['pub']['story'] and r['pub']['more'] == 1), 'the pub tells an old story instead of an empty evening')
        print(ok(r['morale']), "lore only: the crew's mood is unchanged")
        print(ok(r['app']['text'] and 'Fra gamle dager' in r['app']['text'] and r['app']['cards'] == 13 and r['app']['unknown'] >= 0), 'the Seaman app shows what you have heard, and the rest as unknown')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
