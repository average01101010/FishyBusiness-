// Hopp over resten av ruta, the core (HO1, steg 104; docs/planer/hopp.md, Jonas 12.11.2026): the price ladder by the real minutes saved
// (75 øre a minute the first hour, 50 the next three, 25 after, at least 5 kr, no cap), the next stop the hop goes to, the reasons it is
// refused before anything is run (only with no route under way: Jonas 12.11.2026), and the crew's fatigue an hour at sea (crewSeaFat,
// the number crewTick uses).
export default function (t){
  const K = t.K, {hopPrice, hopStop, hopWhy, crewSeaFat, newState, HOP, BOAT} = K;
  // 1. the ladder: Jonas' table (A, 12.11.2026)
  for (const [m, kr] of [[3, 5], [10, 8], [60, 45], [80, 55], [286, 147], [520, 205], [1857, 539]]) t.eq(hopPrice(m), kr, m + ' ekte minutter koster ' + kr + ' kr');
  t.eq(hopPrice(0.5), HOP.min, 'et halvt minutt koster minsteprisen (' + HOP.min + ' kr)');
  // the total always rises with the time (no route is cheaper for being longer, so nobody gains by a detour)
  let up = true, prev = 0; for (let m = 0; m <= 3000; m += 0.5){ const p = hopPrice(m); if (p < prev) up = false; prev = p; }
  t.ok(up, 'prisen stiger aldri ned når minuttene øker (0–3000 min)');
  // the lowest step is dearer per saved hour than every trim fully used (Jonas: «dyrere per time enn trim»)
  const trimBest = Math.max(...Object.values(K.BOOSTS).map(B => B.nok / (B.h / 6 * (B.x - 1))));
  t.ok(HOP.steps[HOP.steps.length - 1][1] * 60 > trimBest, 'laveste trinn ' + HOP.steps[HOP.steps.length - 1][1] * 60 + ' kr/t er dyrere enn den dyreste trimmen per spart time (' + trimBest.toFixed(1) + ' kr/t)');

  // the server's ladder (supabase/migrations/20261112200000_hopp.sql hop_price) on whole minutes: the edges of the steps, the same
  // numbers tests/sqltest.py asks the database for
  for (const [m, kr] of [[1, 5], [6, 5], [7, 5], [59, 44], [61, 46], [239, 135], [241, 135], [3360, 915]]) t.eq(hopPrice(m), kr, m + ' min: ' + kr + ' kr (som hop_price i databasen)');
  // 2. the next stop: a harbour, fishing, gear work, an anchor, or the route's end
  const w = (o) => Object.assign({x:0, y:0, port:null, fish:0}, o);
  t.eq(hopStop({idx:0, wps:[w(), w(), w({port:'p1'})]}), 2, 'rett til havna');
  t.eq(hopStop({idx:0, wps:[w(), w({fish:2}), w(), w({port:'p1'})]}), 1, 'til fiskeplassen først');
  t.eq(hopStop({idx:2, wps:[w(), w({fish:2}), w(), w({port:'p1'})]}), 3, 'etter fisket: til havna');
  t.eq(hopStop({idx:0, wps:[w(), w({act:{op:'set'}}), w()]}), 1, 'til redskapsarbeidet');
  t.eq(hopStop({idx:0, wps:[w(), w({anchor:true}), w()]}), 1, 'til ankringen');
  t.eq(hopStop({idx:0, wps:[w(), w(), w()]}), 2, 'til siste punkt når ruta ikke har noe stopp');

  // the stop of a hop bought (HO3): the same harbour, or within 100 m of the next stop on the route sailed now
  { const {hopMatch} = K, S0 = newState(); K.set('S', S0); S0.boat.status = 'sailing';
    S0.plan = {idx:0, wps:[w({x:1, y:1}), w({x:5, y:5, port:'p1'})]};
    t.ok(hopMatch({x:9, y:9, port:'p1'}), 'samme havn: hoppet går dit');
    t.ok(!hopMatch({x:9, y:9, port:'p2'}), 'en annen havn: hoppet venter i Kaiboden');
    // (the kontroll of HO3: a quay place in a harbour is 'hs:' + a hash, a plant can be 'mØF50'; the stop's own place decides too, so a
    // harbour id kept with characters lost never sends a hop paid for to Kaiboden)
    S0.plan = {idx:0, wps:[w({x:1, y:1}), w({x:5, y:5, port:'hs:ab12'})]};
    t.ok(hopMatch({x:5, y:5, port:'hs:ab12'}), 'en kaiplass i havna (hs:…): samme stopp');
    t.ok(hopMatch({x:5, y:5, port:'hsab12'}), 'havne-id-en uten kolon, men samme plass: samme stopp');
    S0.plan = {idx:0, wps:[w({x:1, y:1}), w({x:5, y:5, fish:1})]};
    t.ok(hopMatch({x:5.05, y:5, port:null}), 'et fiskestopp 50 m unna: samme stopp');
    t.ok(!hopMatch({x:5.3, y:5, port:null}), 'et fiskestopp 300 m unna: ruta er endret');
    t.ok(!hopMatch(null), 'uten stopp i kjøpet: ingen hopp'); }
  // 3. refused before anything is run, and nothing changed
  const S = newState(); K.set('S', S); S.cur = S.cur || 'v1';
  const sailing = () => { S.boat.status = 'sailing'; S.boat.port = null; S.plan = {idx:0, wps:[w({x:1, y:1}), w({x:2, y:2, port:'p1'})], speed:8}; S.tut = null; S.turer = null; };
  S.boat.status = 'port'; S.plan = null; t.ok(!!hopWhy(), 'i havn: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan = null; t.ok(!!hopWhy(), 'uten rute: ' + (hopWhy() || [''])[0]);
  sailing(); t.eq(hopWhy(), null, 'på en rute du har lagt: ingen grunn (verken været eller dieselen nekter, Jonas 12.11.2026)');
  sailing(); S.plan.ops = true; t.ok(!!hopWhy(), 'Driftsplanen: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan.p2 = true; t.ok(!!hopWhy(), 'Driftsplan 2: ' + (hopWhy() || [''])[0]);
  sailing(); S.turer = {board:[], act:[{k:'frakt', vid:'en-annen'}], done:[]}; t.eq(hopWhy(), null, 'et turoppdrag på en annen båt i flåten stopper ikke dette hoppet');
  // the time the game was closed not yet played in (S.t behind the world's clock): the hop would count minutes the catch-up sails anyway
  { const W = K.WCLOCK, on = W.on; W.on = true; sailing(); t.ok(/henter/.test((hopWhy() || [''])[0]), 'tida fra et lukket spill er ikke spilt inn: ' + (hopWhy() || [''])[0]); W.on = on; }
  // (Jonas 12.11.2026: «Ingenting skal være en hindring for å kjøpe "hopp". Det er dårlig business.»): a trip mission, the first trip,
  // «Stopp båten», Autonav's way round, an anchor, a leak, someone in the water and a tow refuse nothing
  for (const [what, set] of [['et turoppdrag i gang med båten', () => { S.turer = {board:[], act:[{k:'frakt', vid:S.cur}], done:[]}; }], ['første tur', () => { S.tut = {v:2}; }],
      ['«Stopp båten»', () => { S.plan.halt = true; }], ['Autonav finner en vei rundt', () => { S.plan.replan = {t:0}; }], ['ankeret ute', () => { S.boat.anch = {}; }],
      ['båten tar inn vann', () => { S.boat.dmg = {A:0.002, w:0.1}; }], ['mann over bord', () => { S.mob = {id:'m1'}; S.plan.mob = true; }], ['et slep av en annen spiller', () => { S.ptowH = {id:'x', st:'tow'}; }]]){
    sailing(); set(); t.eq(hopWhy(), null, what + ': ingen hindring for hoppet'); S.boat.anch = null; S.boat.dmg = null; S.mob = null; S.ptowH = null; }
  // what a hop paid for waits for (HO3, the kontroll): what passes by itself (the time the game was closed played in, Autonav's way round),
  // and nothing else
  const {hopWait, hopCovers} = K;
  sailing(); t.ok(!hopWait(), 'ingenting å vente på');
  { const W = K.WCLOCK, on = W.on; W.on = true; sailing(); t.ok(hopWait(), 'tida fra et lukket spill spilles inn: hoppet venter'); W.on = on; }
  sailing(); S.plan.replan = {t:0}; t.ok(hopWait(), 'Autonav finner en vei rundt: hoppet venter');
  sailing(); S.boat.dmg = {A:0.002, w:0.1}; t.ok(!hopWait(), 'båten tar inn vann: venter ikke, hoppet legges i Kaiboden'); S.boat.dmg = null;
  // the minutes paid for cover the trip made (a little more wind since the purchase is covered; a purchase for far fewer minutes is not)
  t.ok(hopCovers(27, 27) && hopCovers(27, 20), 'et hopp for 27 min dekker en tur på 27 og på 20 min');
  t.ok(hopCovers(27, 31), 'litt mer vind siden kjøpet (31 min): dekket');
  t.ok(!hopCovers(1, 60) && !hopCovers(27, 40), 'et hopp kjøpt for 1 min dekker ikke en tur på 60, og 27 min ikke 40');
  // the hold (Jonas 12.11.2026: «stopper båten momentant som om den var fryst i tiden»): at the stop the card prices, for the purchase of
  // that stop only, and gone when the route no longer leads there, the end has passed, or she is not sailing
  { const {hopHoldOn, hopHeld, hopHoldFor, hopHoldOff} = K; sailing(); S.cur = 'v1'; const h = hopHoldOn();
    t.ok(!!h && hopHeld(S.boat) && h.to.port === 'p1' && S.boat.v === 0, 'holdet: ved stoppet ruta går til, og ingen fart');
    t.ok(hopHoldFor({boat:'v1', to:{x:2, y:2, port:'p1'}}), 'et kjøp for samme stopp og båt: hoppet gjøres fra holdet');
    t.ok(!hopHoldFor({boat:'v2', to:{x:2, y:2, port:'p1'}}) && !hopHoldFor({boat:'v1', to:{x:9, y:9, port:'p9'}}), 'en annen båt eller et annet stopp: ikke dette holdet');
    S.plan.wps[1] = w({x:7, y:7, port:'p7'}); t.ok(!hopHeld(S.boat) && !S.boat.hopHold, 'ruta endret: holdet er borte');
    sailing(); hopHoldOn(); S.t = S.boat.hopHold.until; t.ok(!hopHeld(S.boat), 'etter ' + K.HOP.holdReal + ' ekte minutter: holdet er borte'); S.t = 0;
    sailing(); hopHoldOn(); hopHoldOff(); t.ok(!S.boat.hopHold, 'sluppet: ingen hold');
    sailing(); S.boat.status = 'port'; S.boat.hopHold = {t0:0, until:999, to:{x:2, y:2, port:'p1'}}; t.ok(!hopHeld(S.boat), 'ikke på sjøen: ikke holdt'); }
  // another page or device has the game (TAB): no hop here
  { globalThis.TAB = {lost:true}; sailing(); t.ok(/annet sted/.test((hopWhy() || [''])[0]), 'spillet åpent et annet sted: ' + (hopWhy() || [''])[0]); delete globalThis.TAB; }
  // the cover's words: never «1 minutter»
  t.eq(K.hopMinWords(1)[0], '1 minutt', '«1 minutt»'); t.eq(K.hopCoverMax(27), 32, 'et hopp for 27 min dekker høyst 32');
  sailing(); const before = JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx]); hopWhy(); t.eq(JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx]), before, 'hopWhy endrer ingenting');

  // the time saved in words, rounded to the whole minute first (never «1 t 60 min»)
  const {hopSaved} = K;
  for (const [m, w] of [[119.6, '2 t'], [60, '1 t'], [75, '1 t 15 min'], [0.3, '1 min'], [27.2, '27 min'], [59.6, '1 t']]) t.eq(hopSaved(m), w, m + ' min: «' + w + '»');
  t.eq(hopSaved(75, true), '1 h 15 min', 'på engelsk: «1 h 15 min»');
  // 5. the crew's fatigue an hour at sea: one function for crewTick and the hop
  K.applyVessel();
  const c = {attr:{uth:2}}; const F = BOAT.fac || {};
  t.near(crewSeaFat(c, false, 0, false), 3 * 0.4 * (1.4 - 0.32) * ((BOAT.fx && BOAT.fx.fat) || 1) * (F.house === 'open' ? 1.1 : 1), 1e-9, 'seiling uten arbeid: ' + crewSeaFat(c, false, 0, false).toFixed(2) + ' i timen');
  t.near(crewSeaFat(c, true, 1, true) / crewSeaFat(c, false, 0, false), 2 * (1 / 0.4) * 1.25, 1e-9, 'fiske, fullt arbeid og natt: 6,25 ganger');

  // 6. what the others see (HO2): a report far from the last one is jumped, not glided to (PT_SNAP), so the boat goes out at the start
  // and comes in at the stop; nothing new in pos_put
  const {ptTake, PT_SNAP} = K, now = 5e6;
  ptTake({id:'hop1', at:now - 3000, x:100, y:100, hd:0, st:'sailing', v:8}, now - 3000);
  const T1 = ptTake({id:'hop1', at:now, x:100 + 2 * PT_SNAP, y:100, hd:0, st:'port', v:0}, now);
  t.eq(T1.off, null, 'et hopp på ' + 2 * PT_SNAP + ' km: de andre ser båten forsvinne og dukke opp ved målet, uten å gli dit');
  ptTake({id:'hop2', at:now - 3000, x:100, y:100, hd:0, st:'sailing', v:8}, now - 3000);
  const T2 = ptTake({id:'hop2', at:now, x:100.05, y:100, hd:0, st:'sailing', v:8}, now);
  t.ok(!!T2.off && T2.off.dur > 0, 'en vanlig rapport 50 m unna glir som før (kontroll av testen: ' + (T2.off ? Math.round(T2.off.dur) + ' ms' : 'ingen glidning') + ')');
}
