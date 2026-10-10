"""The guestbooks and Kystfareren (09.10.2026; ui/10m-guestbook.js, supabase/migrations/20261009220000_guestbook.sql): the book where the
boat lies (from the village menu, a rorbu or the pub's «I kveld»), signed with a preset line or just the name, once a day; the places
signed on another device come in; Kystfareren in Milepæler counts by part of the coast (south to Finnmark, checked at Kristiansand,
Bergen, Kristiansund, Bodø, Tromsø, Hammerfest and Vardø) and the long badge takes its first step; a database without the functions is
left alone. A mock stands in for the database. Prints OK or FEIL per check."""
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
          const real = cloudRpc, c0 = {on:CLOUD.on, user:CLOUD.user}; let miss = false;
          const other = PORTS.find(p => !p.rorbu && p.id !== b.port && /^[a-z]/.test(p.id));
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (miss) throw new Error('rpc ' + fn + ' 404');
            if (fn === 'gb_get') return {n:3, rows:[{user:'Ola', boat:'Fjordbris', k:0, age:120, me:false}, {user:'', boat:'', k:-1, age:7200, me:false}]};
            if (fn === 'gb_mine') return [other.id]; if (fn === 'gb_sign') return 'ok'; return null; };
          CLOUD.on = true; CLOUD.user = {id:'user_x'}; S.gb = {};
          b.status = 'port'; R.port = b.port;
          PHONE.show(true); PHONE.open('gbook'); await wait(150); PHONE.open('gbook'); let t = document.getElementById('phView').innerText;
          R.page = /Gjesteboka/.test(t) && /3 har skrevet seg inn/.test(t) && /Godt fiske her!/.test(t) && /Bare navnet/.test(t) && /Ola/.test(t) && /Fjordbris/.test(t);
          R.synced = !!S.gb[other.id];
          calls.length = 0; document.querySelector('[data-pa="gbSign"][data-k="1"]').click(); await wait(120);
          R.sign = (calls.find(c => c[0] === 'gb_sign') || [0, null])[1]; PHONE.open('gbook'); t = document.getElementById('phView').innerText;
          R.today = /Du har skrevet deg inn her i dag/.test(t) && !document.querySelector('[data-pa="gbSign"]') && !!S.gb[b.port];
          // the pub's panel
          S.gb = {}; R.pub = /Gjesteboka/.test(PUBSOC.whoHtml()) && /data-q="gbSign:0"/.test(PUBSOC.whoHtml());
          calls.length = 0; R.pubAct = PUBSOC.act('gbSign:4'); await wait(80); R.pubSign = (calls.find(c => c[0] === 'gb_sign') || [0, null])[1];
          // Kystfareren
          achCheck(true); R.badge = (S.ach.l.kyst || 0) >= 1;
          PHONE.open('merker'); PHONE.dact('merker', 'sub', {s:'kyst'}); PHONE.render(); t = document.querySelector('.ph-appv').innerText;
          R.kyst = /Kystfareren/.test(t) && /Finnmark/.test(t) && /Sør/.test(t) && /\\b\\d+ \\/ \\d+/.test(t);
          R.parts = [[58.15, 8.0], [60.39, 5.32], [63.11, 7.73], [67.28, 14.4], [69.65, 18.96], [70.66, 23.68], [70.37, 31.1]].map(([la, lo]) => GBOOK.part({p:P(la, lo)}));
          // a database without the functions
          miss = true; GBOOK._G.off = false; delete GBOOK._B[b.port]; PHONE.open('gbook'); await wait(120); PHONE.open('gbook'); R.off = GBOOK._G.off && /ikke klare/.test(document.getElementById('phView').innerText);
          window.cloudRpc = real; CLOUD.on = c0.on; CLOUD.user = c0.user; PHONE.show(false); return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1200])
        print(ok(r['page'] and r['synced']), 'the book where the boat lies: how many have signed, the preset lines and «Bare navnet», the last signatures; the places signed elsewhere come in')
        print(ok(r['sign'] == {'place': r['port'], 'k': 1} and r['today']), 'signing sends the place and the line, and the book says you have signed today', r['sign'])
        print(ok(r['pub'] and r['pubAct'] and r['pubSign'] == {'place': r['port'], 'k': 4}), 'the pub\'s «I kveld» has the guestbook, and a line signs it')
        print(ok(r['badge'] and r['kyst']), 'Kystfareren in Milepæler counts by part of the coast, and the long badge takes its first step')
        print(ok(r['parts'] == ['sor', 'vest', 'midt', 'nordl', 'troms', 'finnm', 'finnm']), 'the parts of the coast: Kristiansand, Bergen, Kristiansund, Bodø, Tromsø, Hammerfest, Vardø', r['parts'])
        print(ok(r['off']), 'a database without the functions is left alone')
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
