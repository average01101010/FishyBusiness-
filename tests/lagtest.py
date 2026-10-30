"""The fiskarlag's week, shared (30.10.2026; supabase/migrations/20261030140000_lag_goal.sql, ui/09c-pubsoc.js lagCard/lagHit, ui/06d-season-folk.js,
core/09h-press.js 'lag'): the club's card in the Sesong app with the server's goal and sum, the pub's panel with the same, a switch of club
refused until the week is over, the word and the event when the goal is reached (once a week), and Kystposten's story of it. A mock stands
in for the database. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate("""(async () => { S.tut = 0; const q = portById(S.boat.port) || PORTS.find(x => x.mottak); S.boat.status = 'port'; S.boat.port = q.id; S.boat.pos = {...q.p};
          const calls = []; let lag = {port:q.id, n:9, goal:13500, kg:14200, active:9, hit:true, hitAt:1, members:[{user:'Kari', kg:4100, me:false}, {user:'', kg:2300, me:true}, {user:'Per', kg:1800, me:false}]};
          let joinR = 'wait';
          window.cloudRpc = async (fn, a) => { calls.push([fn, a]); if (fn === 'lag_get') return lag; if (fn === 'lag_join') return joinR; return null; };
          CLOUD.on = true; CLOUD.user = 'u1'; CLOUD.guest = false; S.pubSoc = {}; const m0 = S.msgs.length; const EV = []; const keepEv = cloudEv; cloudEv = (k, d) => EV.push({k, d});
          // the Sesong app: the club's card with the server's numbers
          PUBSOC._lg.d = null; PUBSOC._lg.at = 0; PHONE.show(true); PHONE.open('sesong'); PHONE.render(); await new Promise(r => setTimeout(r, 200)); PHONE.render();
          const txt = document.getElementById('phView').innerText;
          const card = /Fiskarlaget i /.test(txt) && /14,2 \\/ 13,5 tonn denne uka/.test(txt) && /9 båter har levert/.test(txt) && /du: 2\\u00a0300 kg/.test(txt) && /Ukas mål er nådd/.test(txt) && /Kari/.test(txt);
          const getCall = calls.find(c => c[0] === 'lag_get'), withPlace = !!(getCall && getCall[1].x != null && getCall[1].y != null);
          // the word once, and the event
          const said = S.msgs.slice(m0).filter(x => /Fiskarlaget i/.test(x.from)).length, ev = EV.filter(e => e.k === 'lag_goal_hit').length;
          PUBSOC._lg.at = 0; PUBSOC.lagFetch(); await new Promise(r => setTimeout(r, 100)); const saidAgain = S.msgs.slice(m0).filter(x => /Fiskarlaget i/.test(x.from)).length;
          // the pub's panel uses the same numbers
          const pub = PUBSOC.lagHtml(); const pubOk = /14\\u00a0200 \\/ 13\\u00a0500 kg/.test(pub);
          // a switch this week is refused with a word
          const t0 = document.getElementById('toast').textContent; PUBSOC.act('lagjoin'); await new Promise(r => setTimeout(r, 100)); const toastW = document.getElementById('toast').textContent;
          const joinCall = calls.find(c => c[0] === 'lag_join'); const withW = !!(joinCall && typeof joinCall[1].w === 'number');
          // not a member: the card says where to join
          lag = {port:null}; PUBSOC._lg.d = null; PUBSOC._lg.at = 0; PHONE.render(); await new Promise(r => setTimeout(r, 200)); PHONE.render(); const txt2 = document.getElementById('phView').innerText; const joinHint = /Bli med i puben/.test(txt2);
          // Kystposten's story of the club (as the server writes it: no names)
          const st = pressStory({id:1, kind:'lag', gh:100, x:q.p.x, y:q.p.y, d:{port:q.id, kg:14200, n:9}}); const story = !!(st && /Fiskarlaget i .* nådde ukemålet/.test(st.h[0]) && /14\\u00a0200 kg levert av 9 båter/.test(st.ing[0]));
          cloudEv = keepEv; PHONE.show(false); return {card, withPlace, said, ev, saidAgain, pubOk, toastW, withW, joinHint, story, txt:txt.slice(0, 200)}; })()""")
        print(json.dumps(r, ensure_ascii=False)[:800])
        print(ok(r['card'] and r['withPlace']), "the Sesong app shows the club's week with the server's goal and sum, the boats and your kilos, and the harbour's place goes with the call")
        print(ok(r['said'] == 1 and r['ev'] == 1 and r['saidAgain'] == 1), 'the goal reached is said once a week, with the event')
        print(ok(r['pubOk']), "the pub's panel uses the server's goal and sum")
        print(ok('bytte lag når uka er over' in r['toastW'] and r['withW']), 'a switch of club this week is refused with a word, and the join carries the week')
        print(ok(r['joinHint']), 'not a member: the card says to join in the pub')
        print(ok(r['story']), "Kystposten's story of the club names the harbour, the kilos and the boats, no names")
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
