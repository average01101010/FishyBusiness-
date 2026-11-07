"""The coast guard (30.10.2026; core/09j-kystvakt.js, ui/phone/08-home-papers-merker.js papKv, core/09h-press.js 'kv', docs/planer/oppdrag-2.md V1):
a clean boat passes, too many nets or hooks inside the fjord lines and bycatch without access are remarks with the regulation's source, the
visit (the ship alongside, the word after half an hour, the badge, the event, Kystposten's story of a remark), the weekly roll and the gale
that stops it, and the papers' card in the Kvote app in both formats (kvtest.py is the older halibut reading). Prints OK or FEIL per check.
The check at sea aboard the autoliner (H2e of docs/planer/havsteget-h2-autoline.md, 06.11.2026; needs the whole coast in tools/map/out/game):
one lenke set and hauled for real on the NPC autoliners' ground nearest 71° N 17° Ø and set again, then the inspectors by the ship's boat
with the ship lying off for 90 minutes, the word with the position along the line, the marking, the vessel quota, the bycatch and the
sample of the last catch; then a lenke with one end within 4 nm (§ 26) and a last catch with 45 % ling as remarks, the card and the word
in both formats."""
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

HAV = r"""(async () => {
  const R = {}, b = S.boat, H0 = (Date.UTC(2027, 5, 10, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60); S.tut = 0; S.landN = 8;
  b.type = 'autoliner'; applyVessel(); S.lic = {id:'konv', hav:true, kf:3.49, hl:'Konvensjonell havfisketillatelse'}; freshQuota();
  S.pgear = newPGear(); const pg = S.pgear; autoL(pg); careInit(pg); baitOf(pg).saury = 4000; baitOf(pg).blekksprut = 3000; pg.hooks = 30000;
  S.crew = []; S.lag = null; S.hold = []; S.sets = []; S.kvHaul = []; S.plan = null; S.me = 'ashore';
  const GR = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})), t2 = P(71.0, 17.0), p = GR.sort((a, c) => dist(a, t2) - dist(c, t2))[0];
  await mapNeed(p, 14); R.ll = LL(p); R.nm = +blNm(p).toFixed(1);
  b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; b.heading = Math.PI / 2; b.hove = null; b.fuel = BOAT.fuelCap; b.gop = null;
  const keepHour = kvHour, keepWind = windAt, EV = [], keepEv = cloudEv; kvHour = () => {}; windAt = () => 6; cloudEv = (k, d) => EV.push({k, d});
  const run = async (cond, max) => { let k = 0; while (cond() && k++ < max){ if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 30)); continue; } step(); if (k % 100 === 0) await new Promise(r => setTimeout(r, 0)); } return k; };
  // one lenke out, six hours in the sea, hauled and set again where it stood (the autoline's «Trekk og sett ut igjen»)
  const ch = setChoices().find(c => c.spec && c.spec.lk === 'auto' && c.n === 1); R.setWhy = ch ? startSet('line', ch.spec, 0, Math.PI / 2) : 'no choice';
  await run(() => b.gop, 400); await run(() => true, 6 * 60);
  const s0 = mySets()[0]; R.set = !!s0; if (s0){ b.pos = {...s0.a}; b.status = 'idle'; R.haulWhy = startHaul(s0.id, true, 0); await run(() => b.gop, 600); }
  const h = (S.kvHaul || [])[0]; R.haul = h ? {kg:Object.fromEntries(Object.entries(h.kg).map(([k, v]) => [k, Math.round(v)])), ms:h.ms} : null; R.setsAfter = mySets().length;
  // the inspection at sea: the ship lies off, the inspectors come over, 90 minutes
  const m0 = S.msgs.length, l0 = S.log.length; kvArrive(); R.vhf = S.log.slice(l0).map(l => l.no).join(' | '); R.visitHav = !!(S.kv.visit && S.kv.visit.hav);
  const kv = npcStates(S.t / 60).find(n => n.id === 'kv'); R.off = kv ? Math.round(dist(kv.p, b.pos) * 1000) : null;
  for (let i = 0; i < 30; i++){ S.t += 1; kvMinute(); } R.after30 = !!S.kv.visit;
  for (let i = 0; i < 60; i++){ S.t += 1; kvMinute(); } R.done = !S.kv.visit;
  const w1 = S.msgs.slice(m0).filter(x => x.from === 'Kystvakta')[0]; R.word1 = w1 ? w1.no : ''; R.k1 = (S.kv.log[0] || {}).k || [];
  R.ev = EV.filter(e => e.k === 'kv_check').map(e => e.d);
  // a lenke with one end within 4 nm of the baseline (§ 26) and a last catch with 45 % ling (J-128-2026: 35 % in each catch)
  let pin = null; const port = PORTS.filter(q => q.mottak).sort((a, c) => dist(a.p, p) - dist(c.p, p))[0];
  for (let f = 0; f <= 1 && !pin; f += 0.01){ const q = {x:p.x + (port.p.x - p.x) * f, y:p.y + (port.p.y - p.y) * f}; await mapNeed(q, 4); const nm = blNm(q); if (nm < 3.5 && nm > 1 && !isLand(q) && depthF(q) > 20) pin = q; }
  R.pin = pin ? {ll:LL(pin), nm:+blNm(pin).toFixed(1)} : null;
  if (pin){ S.sets = [{id:'sv1', kind:'line', lk:'auto', n:1, hooks:5000, vid:S.cur, a:{...pin}, b:{x:pin.x + (p.x - pin.x) / dist(p, pin) * 6.5, y:pin.y + (p.y - pin.y) / dist(p, pin) * 6.5}, tSet:S.t - 120, depth:200, acc:{}, warn:0}]; }
  S.kvHaul.unshift({t:S.t - 30, vid:S.cur, x:p.x, y:p.y, kind:'line', lk:'auto', ms:{torsk:[90, 3], hyse:[40, 1]}, kg:{torsk:420, hyse:130, lange:450}});
  const m1 = S.msgs.length, P0 = pressState().own.length; kvArrive(); for (let i = 0; i < 90; i++){ S.t += 1; kvMinute(); }
  const w2 = S.msgs.slice(m1).filter(x => x.from === 'Kystvakta')[0]; R.word2 = w2 ? w2.no : ''; R.k2 = (S.kv.log[0] || {}).k || []; R.ref2 = (S.kv.log[0] || {}).ref || [];
  const st = pressState().own.slice(P0).find(x => x.kind === 'kv'); R.press = st ? (pressStory(st) || {}).ing : null;
  kvHour = keepHour; windAt = keepWind; cloudEv = keepEv;
  PHONE.show(true); PHONE.open('kvote'); PHONE.render(); await new Promise(r => setTimeout(r, 150));
  const txt = document.getElementById('phView').innerText; R.card = /havbåt/.test(txt) && /§ 49/.test(txt) && /Merknad: Høstingsforskriften § 26/.test(txt);
  return R; })()"""

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
        # the check at sea aboard the autoliner (H2e), with the whole coast
        if not os.path.exists(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'tools', 'map', 'out', 'game', 'manifest.json')):
            print('FEIL havsjekken trenger hele kysten i tools/map/out/game (release.py og game.py)')
        else:
            await pg.set_viewport_size({'width': 800, 'height': 1280})
            pg.set_default_timeout(900000); h = await pg.evaluate(HAV)
            print('hav', json.dumps(h, ensure_ascii=False)[:2400])
            hk = (h.get('haul') or {}).get('kg') or {}; tot = sum(hk.values()) or 1
            print(ok(h['set'] and h['haul'] and tot > 200 and h['setsAfter'] == 1), 'havsjekk: en lenke satt, trukket og satt ut igjen på feltet', [h.get('ll'), h.get('nm'), hk])
            ms = (h.get('haul') or {}).get('ms') or {}; n3 = sum(ms.get(k, [0, 0])[0] for k in ('torsk', 'hyse', 'sei'))
            print(ok(n3 >= 20), 'stikkprøven av draget: fisken telt mens den kom opp, med dem under minstemålet', ms)
            print(ok(h['visitHav'] and 'lettbåten' in h['vhf'] and h['off'] and 120 <= h['off'] <= 260), 'Kystvakta ligger av og setter over inspektører i lettbåten', [h['vhf'][:120], h['off']])
            print(ok(h['after30'] and h['done']), 'havkontrollen tar 90 minutter (ikke 30 som ved kai)')
            w = h['word1']; bad = [k for k in h['k1'] if k in ('f26', 'f26b', 'j32c', 'kvote', 'kvoteh', 'f49')]
            print(ok(w.startswith('Havkontroll på') and '§ 26 og § 32' in w and 'merkingen' in w and 'fartøykvoten' in w and 'stikkprøve av siste fangst' in w and not bad), 'ordet etter kontrollen: posisjonen langs lina, merkingen, kvoten, bifangsten og stikkprøven, uten merknad på posisjon, kvote eller minstemål', [w[:600], h['k1']])
            lsh = hk.get('lange', 0) / tot
            print(ok(('lby' in h['k1']) == (lsh > 0.355)), 'lange i draget: merknad bare om den er over 35 %', [round(lsh * 100, 1), h['k1']])
            print(ok(h['ev'] and h['ev'][0].get('hav') is True), 'hendelsen kv_check sier at det var en havkontroll', h['ev'][:1])
            print(ok(h['pin'] and 'f26' in h['k2'] and 'lby' in h['k2'] and 'nm fra grunnlinja' in h['word2'] and 'siste fangst' in h['word2'] and 'Høstingsforskriften § 26' in h['ref2']), 'en lenke innenfor 4 nm og 45 % lange i siste fangst er to merknader med posisjonen og kilden', [h.get('pin'), h['k2'], h['word2'][:500]])
            print(ok(h['press'] and any('§ 26' in x for x in h['press']) and not any(' kg' in x for x in h['press'])), 'Kystposten nevner kilden, aldri fangsten', h['press'])
            print(ok(h['card']), 'kortet Kystvakta sier hva havsjekken ser på, og siste merknad')
            CARD = "[...document.querySelectorAll('#phView .papc')].find(c => /Kystvakta/.test(c.textContent)).scrollIntoView()"
            await pg.evaluate(CARD); await pg.wait_for_timeout(150); await pg.screenshot(path=os.path.join(OUT, 'kv-hav-staaende.png'))
            await pg.evaluate("PHONE.open('meld'); PHONE.render()"); await pg.wait_for_timeout(200); await pg.screenshot(path=os.path.join(OUT, 'kv-hav-meld-staaende.png'))
            await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.evaluate("PHONE.open('kvote'); PHONE.render()"); await pg.wait_for_timeout(200); await pg.evaluate(CARD); await pg.wait_for_timeout(150)
            await pg.screenshot(path=os.path.join(OUT, 'kv-hav-liggende.png'))
            await pg.evaluate("PHONE.open('meld'); PHONE.render()"); await pg.wait_for_timeout(200); await pg.screenshot(path=os.path.join(OUT, 'kv-hav-meld-liggende.png'))
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
