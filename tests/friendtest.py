"""Venner (09.10.2026; ui/10k-friends.js, supabase/migrations/20261009180000_friends.sql): the Folk app is now Venner with your code, a
field for another's, the requests to you (a message the first time, accept or decline), the friends with where they are or were last
seen, and the requests you sent. A friend is added by code, from a player's boat on the chart (the AIS card) or in the pub; friends'
boats are green on the chart, and a friend whose game is closed stays where she was last seen. «Vis i kartet» opens the chart on her.
The regulars' bonus at the plants moved to Salgslaget. Without an account the app says how to get one, and a database without the
functions (404) is left alone. A mock stands in for the database. Prints OK or FEIL per check."""
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
        r = await pg.evaluate("""(async () => { const R = {}, b = S.boat, g = b.pos, calls = [], wait = ms => new Promise(f => setTimeout(f, ms));
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user}; let miss = false;
          const D = {code:'ABC234', friends:[{id:'aaaaaaaaaa', user:'Ola', boat:'Fjordbris', vtype:'skiff', x:g.x + 1, y:g.y, hd:0, st:'sailing', age:20},
                                             {id:'bbbbbbbbbb', user:'Kari', boat:'Nordlys', vtype:'trebat', x:g.x + 20, y:g.y + 30, hd:0, st:'port', age:200000}],
                     in:[{id:'cccccccccc', user:'Per', age:60}], out:[{id:'dddddddddd', user:'Lise'}]};
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (miss) throw new Error('rpc ' + fn + ' 404');
            if (fn === 'friend_code') return 'ABC234'; if (fn === 'friends_get') return D; if (fn === 'friend_ask') return 'ok'; return 'ok'; };
          // not signed in: a line on how to get an account
          CLOUD.on = false; PHONE.show(true); PHONE.open('folk'); R.noCloud = /Logg inn/.test(document.getElementById('phView').innerText);
          R.label = [...document.querySelectorAll('#phone .ph-app')].length >= 0 && APPS_LABEL();
          CLOUD.on = true; CLOUD.user = {id:'user_x', email:'x@y.no'}; const m0 = S.msgs.length;
          FRIENDS._F.at = 0; FRIENDS.fetch(true); await wait(150); PHONE.open('folk'); const t = document.getElementById('phView').innerText; R.page = t.slice(0, 600);
          R.shows = /ABC234/.test(t) && /Ola/.test(t) && /Kari/.test(t) && /Per/.test(t) && /Lise/.test(t) && /På sjøen nå/.test(t) && /Sist sett for \\d+ døgn siden/.test(t) && /nm fra deg/.test(t);
          R.msg = S.msgs.slice(m0).filter(m => m.from === 'Venner').length;
          FRIENDS.fetch(true); await wait(100); R.msgOnce = S.msgs.slice(m0).filter(m => m.from === 'Venner').length;
          // accept, add by code, remove with a second tap
          calls.length = 0; document.querySelector('[data-pa="frYes"]').click(); await wait(80); R.yes = calls.find(c => c[0] === 'friend_answer');
          calls.length = 0; document.getElementById('frCode').value = 'xyz789'; document.querySelector('[data-pa="frAdd"]').click(); await wait(80); R.add = calls.find(c => c[0] === 'friend_ask');
          calls.length = 0; document.getElementById('frCode').value = 'abc'; document.querySelector('[data-pa="frAdd"]').click(); await wait(50); R.short = calls.length;
          calls.length = 0; document.querySelector('[data-pa="frRm"][data-id="bbbbbbbbbb"]').click(); await wait(50); R.rm1 = calls.filter(c => c[0] === 'friend_remove').length;
          document.querySelector('[data-pa="frRm"][data-id="bbbbbbbbbb"]').click(); await wait(80); R.rm2 = calls.filter(c => c[0] === 'friend_remove').map(c => c[1].target);
          // the chart: Ola online (in PEERS) is green, Kari offline at her last place, a stranger gets «Legg til som venn»
          PEERS.length = 0; const now = Date.now();
          PEERS.push({id:'aaaaaaaaaa', boat:'Fjordbris', vtype:'skiff', x:g.x + 1, y:g.y, hd:0, v:0, st:'port', user:'Ola', fs:0, at:now}, {id:'eeeeeeeeee', boat:'Havørn', vtype:'trebat', x:g.x - 1, y:g.y, hd:0, v:0, st:'port', user:'Nils', fs:0, at:now});
          PHONE.show(false); openPlotter(); renderBase(); renderDyn(); await wait(50); const svg = document.getElementById('map').innerHTML;
          R.green = /class="ais player friend[^"]*moor/.test(svg); R.off = /ais player friend off/.test(svg) && /Nordlys/.test(svg);
          AISSEL = 'peeeeeeeeee'; renderAisCard(); R.cardAdd = /Legg til som venn/.test(document.getElementById('aisCard').innerText);
          calls.length = 0; document.querySelector('#aisCard [data-fr]').click(); await wait(80); R.cardAsk = (calls.find(c => c[0] === 'friend_ask') || [0, {}])[1].target;
          AISSEL = 'paaaaaaaaaa'; renderAisCard(); R.cardFriend = /Venn/.test(document.getElementById('aisCard').innerText) && !document.querySelector('#aisCard [data-fr]');
          AISSEL = null; renderAisCard();
          // «Vis i kartet» on Kari: the chart centred on her
          PHONE.show(true); PHONE.open('folk'); document.querySelector('[data-pa="frShow"][data-id="bbbbbbbbbb"]').click(); await wait(80);
          R.view = [view.cx - g.x, view.cy - g.y, document.body.className]; R.show = Math.abs(view.cx - (g.x + 20)) < 0.01 && Math.abs(view.cy - (g.y + 30)) < 0.01 && document.body.classList.contains('vplot');
          // the pub: a player in the harbour has the button
          PEERS.length = 0; const pt = portById(b.port); if (pt) PEERS.push({id:'ffffffffff', boat:'Måke', vtype:'trebat', x:pt.p.x + 0.2, y:pt.p.y, hd:0, v:0, st:'port', user:'Anne', fs:0, at:Date.now()});
          R.pub = b.status === 'port' && pt ? /Legg til som venn/.test(PUBSOC.whoHtml()) : 'skip';
          // Salgslaget has the regulars' bonus
          PHONE.open('salg'); R.salg = /Fast kunde/.test(document.getElementById('phView').innerText);
          // a database without the functions
          miss = true; FRIENDS._F.off = false; FRIENDS.fetch(true); await wait(100); PHONE.open('folk'); R.off404 = FRIENDS._F.off && /ikke klare/.test(document.getElementById('phView').innerText);
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; PEERS.length = 0; PHONE.show(false); return R; })()""".replace('APPS_LABEL()', "[...document.querySelectorAll('#phone .ph-app')].some(x => x.dataset.a === 'folk' && /Venner/.test(x.textContent))"))
        print(json.dumps(r, ensure_ascii=False)[:1500])
        print(ok(r['noCloud']), 'without an account the Venner app says how to get one')
        print(ok(r['shows'] and r['msg'] == 1 and r['msgOnce'] == 1), 'the code, the friends (one at sea now, one last seen days ago, with the place and the distance), a request to you and one you sent; a message once')
        print(ok(r['yes'] and r['yes'][1] == {'target': 'cccccccccc', 'yes': True} and r['add'] and r['add'][1] == {'target': 'XYZ789'} and r['short'] == 0), 'accept a request, add by code (upper case), and a short code is not sent', [r['yes'], r['add'], r['short']])
        print(ok(r['rm1'] == 0 and r['rm2'] == ['bbbbbbbbbb']), 'removing a friend takes a second tap', [r['rm1'], r['rm2']])
        print(ok(r['green'] and r['off']), 'on the chart a friend online is green, and a friend whose game is closed stays where she was last seen', [r['green'], r['off']])
        print(ok(r['cardAdd'] and r['cardAsk'] == 'eeeeeeeeee' and r['cardFriend']), 'the AIS card of a player\'s boat asks to be friends, and says «Venn» for a friend', [r['cardAdd'], r['cardAsk'], r['cardFriend']])
        print(ok(r['show']), '«Vis i kartet» opens the chart on the friend')
        print(ok(r['pub'] is True or r['pub'] == 'skip'), 'a player in the pub can be added as a friend', r['pub'])
        print(ok(r['salg'] and r['off404']), 'the regulars\' bonus is in Salgslaget, and a database without the functions is left alone', [r['salg'], r['off404']])
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
