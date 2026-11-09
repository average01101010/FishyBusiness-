"""The queue at the fish plants (core/07-harbours.js LANDQ, supabase/migrations/20261107120000_landing_q.sql; docs/planer/etter-tonys-test.md
K1–K4, K6, Jonas 07.11.2026). Without the cloud the landing starts as before. With the cloud (stubbed here): the boat asks for a place,
waits with the queue on the strip, the dock's line and the Lever page («Lever et annet sted» with the plants near by), the landing
starts by itself when the server says go, the place is freed at the end, leaving the queue frees it, a server down lands her anyway,
and the time away is played without the queue. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => { const R = {}, b = S.boat, wait = ms => new Promise(f => setTimeout(f, ms)), calls = [];
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user};
          const at = id => { const q = portById(id); S.tut = 0; S.plan = null; b.status = 'port'; b.port = id; b.pos = {x:q.p.x, y:q.p.y}; b.v = 0; b.land = null; b.landQ = null; b.shift = null; b.berth = 'main'; S.hold = [{sp:'torsk', kg:300, n:60, cls:0, fresh:100, bled:true, gut:true, iced:true}]; b.ice = 100; };
          R.slots = {husoy:landSlots(portById('husoy')), botnhamn:landSlots(portById('botnhamn')), senjahopen:landSlots(portById('senjahopen')), none:landSlots({})};
          // without the cloud: as before
          at('husoy'); CLOUD.on = false; startLanding(false); R.noCloud = {land:!!b.land, q:!!b.landQ};
          // with the cloud: the server says wait
          let answer = {go:false, ahead:1, active:1, slots:2, wait_s:300};
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (fn === 'land_begin') return answer; if (fn === 'land_look') return [{port:'senjahopen', active:4, waiting:1}, {port:'botnhamn', active:0, waiting:0}]; return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_x', email:'x@y.no'}; LANDQ.off = false; LANDQ.fail = 0; LANDQ.look = null;
          at('husoy'); const ok1 = startLanding(false); await wait(120);
          R.wait = {ret:ok1, land:!!b.land, q:b.landQ && {pid:b.landQ.pid, ahead:b.landQ.ahead, wait:b.landQ.wait, slots:b.landQ.slots}, call:calls.find(c => c[0] === 'land_begin'), busy:portBusy(b) > 0,
            strip:DOCK.info().on, short:landQText(true)[1], long:landQText(false)[0]};
          // the Lever page: the queue, «Gå ut av køen», the plants near by with their queues
          DOCK.open('lever'); await wait(150); DOCK.open('lever'); await wait(50); const pageT = document.getElementById('drawerBody').innerText;
          R.page = {q:/Kø/.test(pageT), leave:!!document.querySelector('#drawerBody [data-act=landq0]'), others:[...document.querySelectorAll('#drawerBody .lq-row')].map(e => e.innerText.replace(/\\s+/g, ' ')), go:!!document.querySelector('#drawerBody [data-act=landgo]'), look:calls.filter(c => c[0] === 'land_look').length};
          // asked again only after 15 s: a minute at the quay now asks nothing
          const n0 = calls.filter(c => c[0] === 'land_begin').length; quayMinute(); await wait(50); R.throttle = calls.filter(c => c[0] === 'land_begin').length - n0;
          // her turn: the landing starts by itself
          answer = {go:true, until:'2026-11-07T01:00:00Z', slots:2}; LANDQ.at = 0; quayMinute(); await wait(120);
          R.go = {land:!!b.land, q:!!b.landQ, pid:b.land && b.land.pid, strip:DOCK.info().on};
          // the end of the landing frees the place
          calls.length = 0; const c0 = S.cash; b.land.until = S.t - 1; finishLanding(); await wait(50); R.end = {landEnd:calls.some(c => c[0] === 'land_end'), land:!!b.land, cash:S.cash > c0};
          // leaving the queue frees it too
          answer = {go:false, ahead:0, active:2, slots:2, wait_s:120}; at('husoy'); startLanding(false); await wait(120); calls.length = 0; landQueueEnd(); await wait(50);
          R.leave = {q:!!b.landQ, landEnd:calls.some(c => c[0] === 'land_end')};
          // the server down: she lands anyway after two failures
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); throw new Error('rpc ' + fn + ' 500'); };
          at('husoy'); LANDQ.fail = 0; startLanding(false); await wait(120); R.down1 = {land:!!b.land, q:!!b.landQ}; LANDQ.at = 0; quayMinute(); await wait(120); R.down2 = {land:!!b.land, q:!!b.landQ};
          // a server without the queue (404): as before, and no more asking
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); throw new Error('rpc ' + fn + ' 404'); };
          at('husoy'); LANDQ.off = false; LANDQ.fail = 0; startLanding(false); await wait(120); R.gone = {land:!!b.land, off:LANDQ.off};
          // the time away is played without the queue
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); return {go:false, ahead:3, active:2, slots:2, wait_s:900}; };
          at('husoy'); LANDQ.off = false; LANDQ.fail = 0; LANDQ.away = true; startLanding(false); LANDQ.away = false; R.away = {land:!!b.land, q:!!b.landQ};
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; b.land = null; b.landQ = null; return R; })()""")
        check(r['slots'] == {'husoy': 2, 'botnhamn': 1, 'senjahopen': 4, 'none': 1}, 'losseplassene følger kailengden: Husøy 59 m gir 2, Botnhamn 25 m 1, Senjahopen 144 m 4 (taket), ukjent kai 1', r['slots'])
        check(r['noCloud']['land'] and not r['noCloud']['q'], 'uten skyen starter lossingen som før', r['noCloud'])
        w = r['wait']
        check(w['ret'] and not w['land'] and w['q'] and w['q']['ahead'] == 1 and w['q']['wait'] == 300 and w['q']['slots'] == 2 and w['call'] and w['call'][1]['port'] == 'husoy' and w['call'][1]['slots'] == 2 and w['call'][1]['dur_s'] >= 10 and w['busy'],
              'med skyen spør båten om plass (havn, kg, varighet i ekte sekunder, plasser) og venter med køen i stedet for å losse; planene ser kaia som opptatt', w)
        check('Kø' in w['short'] and '1 foran' in w['short'] and '5 min' in w['short'] and 'Husøy' in w['long'] and w['strip'] == w['short'], 'stripa og linja sier «Kø · 1 foran · ca. 5 min»', {'short': w['short'], 'long': w['long'], 'strip': w['strip']})
        pq = r['page']
        check(pq['q'] and pq['leave'] and pq['go'] and len(pq['others']) >= 2 and any('Senjahopen' in o and 'i kø' in o for o in pq['others']) and any('Botnhamn' in o and 'ledig' in o for o in pq['others']) and pq['look'] >= 1,
              'Lever-siden: køen, «Gå ut av køen» og «Lever et annet sted» med mottakene i nærheten og køen deres (Senjahopen 1 i kø, Botnhamn ledig) med «Kjør dit»', pq)
        check(r['throttle'] == 0, 'det spørres ikke oftere enn hvert 15. sekund', r['throttle'])
        check(r['go']['land'] and not r['go']['q'] and r['go']['pid'] == 'husoy' and 'Kø' not in (r['go']['strip'] or ''), 'når serveren sier go, starter lossingen av seg selv', r['go'])
        check(r['end']['landEnd'] and not r['end']['land'] and r['end']['cash'], 'når lossingen er ferdig, frigis plassen (land_end) og fisken er solgt', r['end'])
        check(not r['leave']['q'] and r['leave']['landEnd'], '«Gå ut av køen» frigir plassen', r['leave'])
        check(not r['down1']['land'] and r['down1']['q'] and r['down2']['land'] and not r['down2']['q'], 'serveren nede: hun losser likevel etter to mislykkede spørsmål', {'first': r['down1'], 'second': r['down2']})
        check(r['gone']['land'] and r['gone']['off'], 'en server uten køen (404): som før, og det spørres ikke mer', r['gone'])
        check(r['away']['land'] and not r['away']['q'], 'tida borte spilles uten køen', r['away'])
        print('sidefeil', errs)
        await b.close()

asyncio.run(main())
