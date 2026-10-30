"""The coast guard (30.10.2026; core/09j-kystvakt.js, ui/phone/08-home-papers-merker.js papKv, core/09h-press.js 'kv', docs/planer/oppdrag-2.md V1):
a clean boat passes, too many nets or hooks inside the fjord lines and bycatch without access are remarks with the regulation's source, the
visit (the ship alongside, the word after half an hour, the badge, the event, Kystposten's story of a remark), the weekly roll and the gale
that stops it, and the papers' card in the Kvote app in both formats (kvtest.py is the older halibut reading). Prints OK or FEIL per check."""
from _env import GAME, OUT, boot
import os
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

JS = r"""(async () => {
  S.tut = 0; S.landN = 5; const q = portById(S.boat.port) || PORTS.find(x => x.mottak); S.boat.status = 'port'; S.boat.port = q.id; S.boat.pos = {...q.p}; S.hold = []; S.sets = [];
  const EV = []; const keepEv = cloudEv; cloudEv = (k, d) => EV.push({k, d}); const m0 = S.msgs.length; const out = {};
  const W = windAt(S.t / 60, S.boat.pos); out.W = Math.round(W * 10) / 10;
  const keepWind = windAt; windAt = () => 6;   // a working day's wind, so the roll is about the rule and not the weather
  out.ready = kvReady();
  // a clean boat
  out.clean = kvCheck(S.boat).items.length;
  // a point inside the fjord lines near the harbour
  let pf = null; for (let r = 0.5; r < 60 && !pf; r += 0.5) for (let a = 0; a < 360 && !pf; a += 15){ const p = {x:q.p.x + Math.sin(a * Math.PI / 180) * r, y:q.p.y - Math.cos(a * Math.PI / 180) * r}; if (insideFjord(p) && !isLandFar(p)) pf = p; }
  out.pf = !!pf;
  const mk = (kind, n, extra) => ({id:'s' + Math.random(), kind, n, vid:S.cur, a:{x:pf.x, y:pf.y}, b:{x:pf.x + 0.3, y:pf.y}, tSet:S.t, depth:60, acc:{torsk:{kg:120, n:30, ts:0}}, warn:0, ...(extra || {})});
  if (pf){
    S.sets = [mk('garn', 50), mk('garn', 40)]; const r1 = kvCheck(S.boat); out.nets = r1.items.map(i => i.k); out.netsRef = (r1.items[0] || {}).ref || ''; out.netsNo = (r1.items[0] || {}).no || '';
    S.sets = [mk('line', 6, {hooks:3600, lk:'hyse'}), mk('line', 4, {hooks:2400, lk:'hyse'})]; const r2 = kvCheck(S.boat); out.hooks = r2.items.map(i => i.k);
    S.sets = [mk('garn', 60)]; out.few = kvCheck(S.boat).items.length;   // 60 nets are within the rule
  }
  // bycatch without access: cod and saithe over 10 % of the hold
  S.sets = []; const keepOwner = S.tripOwner; S.tripOwner = false; out.acc = access();
  S.hold = [{sp:'torsk', cls:'m', kg:300, n:80}, {sp:'kveite', cls:'m', kg:100, n:5}]; const r3 = kvCheck(S.boat); out.byc = r3.items.map(i => i.k); out.bycNo = (r3.items[0] || {}).no || '';
  S.tripOwner = keepOwner; S.hold = [];
  // the visit: she comes alongside, lies there half an hour, and says her word; the ship is listed meanwhile and gone after
  const a0 = (S.ach && S.ach.c && S.ach.c.kv) || 0;
  kvArrive(); out.npc = npcStates(S.t / 60).some(n => n.id === 'kv'); out.visit = !!S.kv.visit;
  for (let i = 0; i < 30; i++){ S.t += 1; kvMinute(); }
  out.visitDone = !S.kv.visit; out.npcGone = !npcStates(S.t / 60).some(n => n.id === 'kv');
  const said1 = S.msgs.slice(m0).filter(x => x.from === 'Kystvakta'); out.said1 = said1.length; out.okWord = !!(said1[0] && /alt i orden/.test(said1[0].no));
  out.n1 = S.kv.n; out.nOk1 = S.kv.nOk; out.ach = ((S.ach && S.ach.c && S.ach.c.kv) || 0) - a0;
  out.ev1 = EV.filter(e => e.k === 'kv_check').map(e => e.d.ok);
  // a visit with a remark: too many nets inside the fjord lines; Kystposten gets the story with the source only
  const P0 = pressState().own.length;
  if (pf){ S.sets = [mk('garn', 50), mk('garn', 40)]; kvArrive(); for (let i = 0; i < 30; i++){ S.t += 1; kvMinute(); } }
  const said2 = S.msgs.slice(m0).filter(x => x.from === 'Kystvakta'); out.said2 = said2.length; out.remark = !!(said2[1] && /merknad/.test(said2[1].no) && /§ 33a/.test(said2[1].no));
  out.n2 = S.kv.n; out.nOk2 = S.kv.nOk; out.logK = (S.kv.log[0] || {}).k || [];
  const st = pressState().own.slice(P0).find(x => x.kind === 'kv'); out.press = !!st; const story = st ? pressStory(st) : null;
  out.story = !!(story && /Kystvakta kontrollerte/.test(story.h[0]) && /§ 33a/.test(story.ing[0]) && !/kg/.test(story.ing[0]));
  S.sets = [];
  // the weekly roll: a new week sets the hour when the dice say so, and the hour that comes with the boat ready starts the visit; a gale stops it
  const K = kvState(); K.wk = -1; K.at = null; K.ok = false; windAt = () => 20; const keepR = Math.random; Math.random = () => 0; kvHour(); Math.random = keepR;
  out.rolled = K.at != null && K.at <= S.t; out.wk = K.wk === weekOf(S.t / 60);
  out.galeReady = kvReady(); kvHour(); out.galeHeld = !K.visit && K.at != null;
  windAt = () => 6; kvHour(); out.fired = !!K.visit && K.at == null; K.visit = null;
  // a clean check halves the chance for two weeks
  K.ok = true; K.last = S.t; K.wk = -1; let n = 0; const keepR2 = Math.random; Math.random = () => { n++; return n === 1 ? 0.3 : 0.5; }; kvHour(); Math.random = keepR2; out.recent = K.at == null;
  K.ok = false; K.wk = -1; n = 0; Math.random = () => { n++; return n === 1 ? 0.3 : 0.5; }; kvHour(); Math.random = keepR2; out.notRecent = K.at != null; K.at = null;
  windAt = keepWind;
  // the papers' card
  PHONE.show(true); PHONE.open('kvote'); PHONE.render(); await new Promise(r => setTimeout(r, 150));
  const txt = document.getElementById('phView').innerText; out.card = /Kystvakta/.test(txt) && /Kontroller\s+2/.test(txt) && /Uten merknad\s+1 \/ 2/.test(txt) && /Merknad: Høstingsforskriften § 33a/.test(txt);
  cloudEv = keepEv; return out; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 800, 'height': 1280})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate(JS)
        print(json.dumps(r, ensure_ascii=False)[:900])
        print(ok(r['ready'] and r['clean'] == 0), 'a boat at the quay after the first week is ready for a visit, and a clean boat has no remarks')
        print(ok(r['pf'] and r['nets'] == ['f33a'] and '§ 33a' in r['netsRef'] and '90' in r['netsNo'] and r['few'] == 0), '90 nets inside the fjord lines are a remark under § 33a with the count, 60 are not')
        print(ok(r['hooks'] == ['f33']), '6 000 hooks inside the fjord lines are a remark under § 33')
        print(ok(r['acc'] == 'none' and r['byc'] == ['byc'] and '300 av 400 kg' in r['bycNo']), 'cod over 10 % without access is a remark with the kilos')
        print(ok(r['npc'] and r['visit'] and r['visitDone'] and r['npcGone']), 'the ship lies alongside for the half hour and is gone after')
        print(ok(r['said1'] == 1 and r['okWord'] and r['n1'] == 1 and r['nOk1'] == 1 and r['ach'] == 1 and r['ev1'] == [True]), 'a clean visit: one word, «Kontrollert», the badge and the event')
        print(ok(r['said2'] == 2 and r['remark'] and r['n2'] == 2 and r['nOk2'] == 1 and r['logK'] == ['f33a']), 'a visit with a remark reads the rule and its source, and the papers keep the code')
        print(ok(r['press'] and r['story']), "Kystposten's story names the source, never the catch")
        print(ok(r['rolled'] and r['wk'] and not r['galeReady'] and r['galeHeld'] and r['fired']), 'the weekly roll sets the hour, a gale holds the visit, and the next fair hour starts it')
        print(ok(r['recent'] and r['notRecent']), 'within two weeks of a clean check the chance is halved')
        print(ok(r['card']), "the papers in the Kvote app show the inspections, the clean ones and the last remark's source")
        SCROLL = "[...document.querySelectorAll('#phView .papc')].find(c => /Kystvakta/.test(c.textContent)).scrollIntoView()"
        await pg.evaluate(SCROLL); await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, 'kv-staaende.png'))
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.evaluate("PHONE.render()"); await pg.wait_for_timeout(200); await pg.evaluate(SCROLL); await pg.wait_for_timeout(150)
        await pg.screenshot(path=os.path.join(OUT, 'kv-liggende.png'))
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
