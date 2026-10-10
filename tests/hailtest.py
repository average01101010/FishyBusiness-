"""Tuting and the six phrases (09.10.2026; ui/10n-hail.js, supabase/migrations/20261009240000_hails.sql): «Tut» among the boat's buttons
only with a player's boat within 1 nm, the horn sent and counted for the badge, not again at the same boat within a minute; the six
lines on the AIS card of a player within 5 nm and none farther out; what came in goes to the messages (a friend's under Venner) and the
next fetch asks after the last id; a database without the functions is left alone. A mock stands in for the database. Prints OK or FEIL."""
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
        r = await pg.evaluate("""(async () => { const R = {}, g = S.boat.pos, calls = [], wait = ms => new Promise(f => setTimeout(f, ms));
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user}; let miss = false;
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (miss) throw new Error('rpc ' + fn + ' 404');
            if (fn === 'hail_send') return 'ok';
            if (fn === 'hails_get') return a.since ? [] : [{id:5, from:'Ola', fid:'aaaaaaaaaa', boat:'Fjordbris', k:-1, friend:true, age:3}, {id:6, from:'Kari', fid:'bbbbbbbbbb', boat:'Nordlys', k:2, friend:false, age:2}];
            return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_x'};
          const I = (id, ic, no, en, o) => Object.assign({id, ic}, o || {}), now = Date.now();
          const peer = (id, dx, user, boat) => ({id, boat, vtype:'trebat', x:g.x + dx, y:g.y, hd:0, v:0, st:'sailing', user, fs:0, at:now});
          PEERS.length = 0; PEERS.push(peer('bbbbbbbbbb', 12, 'Kari', 'Nordlys'));
          R.none = HAIL.dockItem(I) === null;
          PEERS.push(peer('aaaaaaaaaa', 0.8, 'Ola', 'Fjordbris'));
          const it = HAIL.dockItem(I); R.item = !!it && it.id === 'tut';
          calls.length = 0; it.run(); await wait(80); R.horn = (calls.find(c => c[0] === 'hail_send') || [0, null])[1]; R.count = achC('horn');
          calls.length = 0; it.run(); await wait(50); R.again = calls.filter(c => c[0] === 'hail_send').length;
          // the AIS card: six lines near, none far
          const near = peerStates().find(n => n.id === 'paaaaaaaaaa'), far = peerStates().find(n => n.id === 'pbbbbbbbbbb');
          R.lines = (HAIL.card(near).match(/data-hl=/g) || []).length; R.farLines = HAIL.card(far);
          openPlotter(); AISNOW = peerStates(); AISSEL = 'paaaaaaaaaa'; renderAisCard();
          calls.length = 0; const btn = document.querySelector('#aisCard [data-hl="3"]'); R.inCard = !!btn; if (btn) btn.click(); await wait(80); R.line = (calls.find(c => c[0] === 'hail_send') || [0, null])[1];
          AISSEL = null; renderAisCard();
          // what came in
          S.hailId = 0; const m0 = S.msgs.length; calls.length = 0; HAIL.fetch(); await wait(100);
          R.msgs = S.msgs.slice(m0).map(m => [m.from, m.no]); R.lastId = S.hailId;
          HAIL.fetch(); await wait(80); R.since = (calls.filter(c => c[0] === 'hails_get').pop() || [0, {}])[1].since;
          miss = true; HAIL.fetch(); await wait(80); R.off = HAIL._H.off && HAIL.dockItem(I) === null;
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; PEERS.length = 0; return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1200])
        print(ok(r['none'] and r['item'] and r['horn'] == {'target': 'aaaaaaaaaa', 'k': -1} and r['count'] == 1 and r['again'] == 0),
              '«Tut» only with a player within 1 nm; the horn goes to her and counts for the badge, and not again within a minute', [r['none'], r['item'], r['horn'], r['count'], r['again']])
        print(ok(r['lines'] == 6 and r['farLines'] == '' and r['inCard'] and r['line'] == {'target': 'aaaaaaaaaa', 'k': 3}), 'the AIS card has the six lines for a player within 5 nm, none farther out, and a line is sent', [r['lines'], r['line']])
        print(ok(r['msgs'] == [['Venner', 'Ola tutet fra «Fjordbris».'], ['Sjøen', 'Kari: «Ses på kaia!»']] and r['lastId'] == 6 and r['since'] == 6), "what came in goes to the messages (a friend's under Venner), and the next fetch asks after the last", r['msgs'])
        print(ok(r['off']), 'a database without the functions is left alone')
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
