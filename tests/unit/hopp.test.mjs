// Hopp over resten av ruta, the core (HO1, steg 104; docs/planer/hopp.md, Jonas 12.11.2026): the price ladder by the real minutes saved
// (75 øre a minute the first hour, 50 the next three, 25 after, at least 5 kr, no cap), the next stop the hop goes to, the reasons it is
// refused before anything is run, the skipper's energy over the minutes skipped, and the crew's fatigue an hour at sea (the same
// number crewTick uses, so the hop cannot drift from the sailing).
export default function (t){
  const K = t.K, {hopPrice, hopStop, hopWhy, hopEnergy, crewSeaFat, newState, ENERGY, HOP, BOAT} = K;
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
    t.ok(!hopMatch({x:5, y:5, port:'p2'}), 'en annen havn: hoppet venter i Kaiboden');
    S0.plan = {idx:0, wps:[w({x:1, y:1}), w({x:5, y:5, fish:1})]};
    t.ok(hopMatch({x:5.05, y:5, port:null}), 'et fiskestopp 50 m unna: samme stopp');
    t.ok(!hopMatch({x:5.3, y:5, port:null}), 'et fiskestopp 300 m unna: ruta er endret');
    t.ok(!hopMatch(null), 'uten stopp i kjøpet: ingen hopp'); }
  // 3. refused before anything is run, and nothing changed
  const S = newState(); K.set('S', S); S.cur = S.cur || 'v1';
  const sailing = () => { S.boat.status = 'sailing'; S.boat.port = null; S.plan = {idx:0, wps:[w({x:1, y:1}), w({x:2, y:2, port:'p1'})], speed:8}; S.tut = null; S.turer = null; };
  S.boat.status = 'port'; S.plan = null; t.ok(!!hopWhy(), 'i havn: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan = null; t.ok(!!hopWhy(), 'uten rute: ' + (hopWhy() || [''])[0]);
  sailing(); t.eq(hopWhy(), null, 'på en rute du har lagt: ingen grunn ennå (været og dieselen regnes i tørrkjøringen)');
  sailing(); S.plan.ops = true; t.ok(!!hopWhy(), 'Driftsplanen: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan.p2 = true; t.ok(!!hopWhy(), 'Driftsplan 2: ' + (hopWhy() || [''])[0]);
  sailing(); S.turer = {board:[], act:[{k:'frakt', vid:S.cur}], done:[]}; t.ok(!!hopWhy(), 'et turoppdrag i gang: ' + (hopWhy() || [''])[0]);
  sailing(); S.turer = {board:[], act:[{k:'frakt', vid:'en-annen'}], done:[]}; t.eq(hopWhy(), null, 'et turoppdrag på en annen båt i flåten stopper ikke dette hoppet');
  sailing(); S.tut = {v:2}; t.ok(!!hopWhy(), 'første tur: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan.halt = true; t.ok(/stopper/.test((hopWhy() || [''])[0]) && !/Vent til hun går videre/.test((hopWhy() || [''])[0]), '«Stopp båten»: ' + (hopWhy() || [''])[0]);
  sailing(); S.plan.replan = {t:0}; t.ok(/vei rundt/.test((hopWhy() || [''])[0]), 'Autonav finner en vei rundt: ' + (hopWhy() || [''])[0]);
  // the time the game was closed not yet played in (S.t behind the world's clock): the hop would count minutes the catch-up sails anyway
  { const W = K.WCLOCK, on = W.on; W.on = true; sailing(); t.ok(/henter/.test((hopWhy() || [''])[0]), 'tida fra et lukket spill er ikke spilt inn: ' + (hopWhy() || [''])[0]); W.on = on; }
  sailing(); S.boat.anch = {}; t.ok(!!hopWhy(), 'mens ankeret er ute: ' + (hopWhy() || [''])[0]); S.boat.anch = null;
  sailing(); S.boat.dmg = {A:0.002, w:0.1}; t.ok(!!hopWhy(), 'båten tar inn vann: ' + (hopWhy() || [''])[0]); S.boat.dmg = null;
  sailing(); S.mob = {id:'m1'}; t.ok(!!hopWhy(), 'mann over bord: ' + (hopWhy() || [''])[0]); S.mob = null;
  sailing(); S.plan.mob = true; t.ok(!!hopWhy(), 'Autonav mot den som er i sjøen: ' + (hopWhy() || [''])[0]);
  sailing(); S.ptowH = {id:'x', st:'tow'}; t.ok(!!hopWhy(), 'mens du sleper en annen spiller: ' + (hopWhy() || [''])[0]);
  sailing(); S.ptowH = {id:'x', st:'come'}; t.eq(hopWhy(), null, 'på vei til en som trenger slep: hoppet går (hjelpen kommer fortere)'); S.ptowH = null;
  sailing(); const before = JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx]); hopWhy(); t.eq(JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx]), before, 'hopWhy endrer ingenting');

  // the time saved in words, rounded to the whole minute first (never «1 t 60 min»)
  const {hopSaved} = K;
  for (const [m, w] of [[119.6, '2 t'], [60, '1 t'], [75, '1 t 15 min'], [0.3, '1 min'], [27.2, '27 min'], [59.6, '1 t']]) t.eq(hopSaved(m), w, m + ' min: «' + w + '»');
  t.eq(hopSaved(75, true), '1 h 15 min', 'på engelsk: «1 h 15 min»');
  // 4. your energy over the minutes skipped, as energyMinute has it: down at sea, asleep at nought for ENERGY.sleep, awake at ENERGY.wake
  t.near(hopEnergy(80, 0, 60, -ENERGY.sea).e, 80 - 60 * ENERGY.sea, 1e-9, 'en time på sjøen: ' + (60 * ENERGY.sea).toFixed(2) + ' % ned');
  let r = hopEnergy(10, 0, 600, -ENERGY.sea); const m0 = Math.ceil(10 / ENERGY.sea);
  t.eq(r.e, 0, 'tom etter ' + m0 + ' min'); t.eq(r.s, ENERGY.sleep - (600 - m0), 'sover resten: ' + r.s + ' min igjen av søvnen');
  r = hopEnergy(10, 0, m0 + ENERGY.sleep + 30, -ENERGY.sea); t.eq(r.s, 0, 'våknet etter søvnen');
  t.near(r.e, ENERGY.wake - 30 * ENERGY.sea, 1e-9, '… med ' + ENERGY.wake + ' % og en halvtime på sjøen etter');
  t.near(hopEnergy(40, 0, 120, 0.5).e, 100, 1e-9, 'i køya fylles energien, høyst 100 %');

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
