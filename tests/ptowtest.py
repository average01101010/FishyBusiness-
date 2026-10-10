"""Towing between players (09.10.2026; ui/10o-ptow.js, supabase/migrations/20261009260000_tows.sql). The one towed: «Spør om slep» in the
Redning app when the boat has broken down; a message when someone comes; under tow the boat follows behind the helper; in harbour when
she moors; nobody in 20 minutes calls the rescue boat. The helper: the ask as a mark on the chart and a message, a tap gives «Hjelp»,
«Ta slep» among the buttons within 150 m, the speed capped while towing, and the game's reward and the badge when she moors. A mock
stands in for the database. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => { const R = {}, b = S.boat, calls = [], wait = ms => new Promise(f => setTimeout(f, ms));
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user}; let mine = null, open = [];
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (fn === 'tow_ask') return 41; if (fn === 'tow_mine') return mine; if (fn === 'tow_open') return open;
            if (fn === 'tow_take' || fn === 'tow_hook' || fn === 'tow_cancel') return 'ok'; if (fn === 'tow_done') return {ok:true, pay:true}; return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_x'}; S.tut = 0;
          // ---- the one towed: broken down at sea
          const fp = portById('finnsnes').p; b.status = 'adrift'; b.port = null; b.pos = {x:fp.x + 2, y:fp.y + 1.5}; b.v = 0; S.plan = null;
          PHONE.show(true); PHONE.open('redning'); R.card = /Spør om slep/.test(document.getElementById('phView').innerText);
          const m0 = S.msgs.length; document.querySelector('[data-pa="ptAsk"]').click(); await wait(80);
          R.ask = (calls.find(c => c[0] === 'tow_ask') || [0, null])[1]; R.ptow = S.ptow && S.ptow.id === 41;
          mine = {id:41, role:'needer', st:'come', other:{user:'Ola', boat:'Fjordbris', x:b.pos.x + 1, y:b.pos.y, hd:0, v:5, age:3}};
          PTOW._P.busy = false; PTOW.tick(); await wait(80); R.come = S.msgs.slice(m0).some(m => /Ola kommer for å slepe deg/.test(m.no));
          // under tow: east at 5 kn, the boat 50 m behind her
          mine = {id:41, role:'needer', st:'tow', other:{user:'Ola', boat:'Fjordbris', x:b.pos.x + 1, y:b.pos.y, hd:Math.PI / 2, v:5, age:0}};
          PTOW.tick(); await wait(80); R.st = b.status; const hx = mine.other.x; S.t += 1; step();
          R.behind = b.pos.x < hx + 0.2 && b.pos.x > hx - 0.1 && Math.abs(b.pos.y - mine.other.y) < 0.01 && Math.abs(b.heading - Math.PI / 2) < 1e-6;
          mine = {id:41, role:'needer', st:'done', port:'finnsnes', other:{user:'Ola', boat:'Fjordbris'}};
          PTOW.tick(); await wait(80); R.done = b.status === 'port' && b.port === 'finnsnes' && !S.ptow && S.msgs.slice(m0).some(m => /slepte deg inn til/.test(m.no));
          // nobody comes in 20 minutes: the rescue boat
          b.status = 'adrift'; b.port = null; b.pos = {x:fp.x + 2, y:fp.y + 1.5}; S.ptow = {id:42, t0:Date.now() - 21 * 60000, st:'ask'};
          mine = {id:42, role:'needer', st:'ask', other:null}; PTOW.tick(); await wait(120); R.rescue = b.status === 'tow' && !S.ptow && calls.some(c => c[0] === 'tow_cancel');
          b.tow = null; b.status = 'idle';
          // ---- the helper
          mine = null; S.ptow = null; b.status = 'idle'; b.port = null; b.pos = {x:fp.x + 2, y:fp.y + 1.5}; b.v = 0;
          open = [{id:9, user:'Kari', boat:'Nordlys', x:b.pos.x + 2, y:b.pos.y, age:30}];
          const m1 = S.msgs.length; PTOW._P.at = 0; PTOW.tick(); await wait(80); R.heard = S.msgs.slice(m1).some(m => /Kari .*trenger slep/.test(m.no));
          PHONE.show(false); openPlotter(); renderDyn(); R.mark = /Trenger slep/.test(document.getElementById('map').innerHTML);
          R.tap = PTOW.tap({x:b.pos.x + 2, y:b.pos.y}, 0.2); const c = document.getElementById('ptCard'); R.cardH = !c.hidden && /Hjelp/.test(c.innerText);
          calls.length = 0; c.querySelector('[data-p="take"]').click(); await wait(80); R.take = (calls.find(x => x[0] === 'tow_take') || [0, null])[1]; R.H = S.ptowH && S.ptowH.st === 'come';
          const I = (id, ic, no, en, o) => Object.assign({id}, o || {});
          R.farItem = PTOW.dockItem(I) === null; S.plan = null; b.status = 'idle'; b.pos = {x:b.pos.x + 1.95, y:b.pos.y}; b.v = 0;
          const it = PTOW.dockItem(I); R.item = !!it && it.id === 'ptow'; it.run(); await wait(80); R.towing = ptowTowing() && speedCap(0.3) <= 5.5;
          const c0c = S.cash; dock('finnsnes'); await wait(120); R.paid = S.cash - c0c; R.badge = achC('ptow'); R.clear = !S.ptowH;
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; PHONE.show(false); return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1200])
        print(ok(r['card'] and r['ask'] and r['ptow']), 'broken down: the Redning app asks the players near, from where the boat lies')
        print(ok(r['come'] and r['st'] == 'ptow' and r['behind']), 'a message when a player comes; under tow the boat follows 50 m behind her, on her heading')
        print(ok(r['done']), 'when she moors, the boat lies in that harbour, with thanks in the messages')
        print(ok(r['rescue']), 'nobody in 20 minutes: the ask is cancelled and the rescue boat comes')
        print(ok(r['heard'] and r['mark'] and r['tap'] and r['cardH'] and r['take'] == {'id': 9} and r['H']), 'the helper hears of the ask, sees it on the chart, and takes it from the card')
        print(ok(r['farItem'] and r['item'] and r['towing']), '«Ta slep» only within 150 m, and the speed is capped while towing')
        print(ok(r['paid'] == 25000 and r['badge'] == 1 and r['clear']), 'moored: the game pays 25 000 kr and the badge counts', [r['paid'], r['badge']])
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
