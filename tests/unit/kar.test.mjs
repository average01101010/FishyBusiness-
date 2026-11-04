// The fish tubs on the open boats (core/07f-kar.js, docs/planer/fiskekar-dekk.md, Jonas 04.11.2026): the tubs are the hold (500 kg each,
// one more a yard step up to the boat's places), the catch fills them in turn, the landing lifts each tub with fish and brings the
// empties back, and the packing of a tub never puts a fish through its wall at any species, weight or fill.
export default function (t){
  const {VESSELS, TUB_KG, karN, karSteps, tubLoads, tubsFull, tubPack, tubShown, karIn, fishCorners, inRR, fishLie, KAR_R, KAR_GAP, landPlan, applyVessel, BOAT, SPECIES, newState, HOLDUP} = t.K;
  t.K.set('S', newState());
  t.eq(TUB_KG, 500, 'ett fullt kar er 500 kg');
  // the open boats: the tubs, the capacity, the steps; no code by the type's name, so it is read off VESSELS.kar
  const open = Object.keys(VESSELS).filter(k => VESSELS[k].hold && VESSELS[k].hold.kind === 'dekk');
  t.ok(open.length >= 3, 'det finnes båter uten lasterom (' + open.join(', ') + ')');
  for (const k of open){ const V = VESSELS[k];
    t.ok(V.kar && V.kar.n >= 1 && V.kar.max >= V.kar.n, k + ': har kar (' + (V.kar && V.kar.n) + ', høyst ' + (V.kar && V.kar.max) + ')');
    t.eq(V.holdCap, V.kar.n * TUB_KG, k + ': kapasiteten er karene (' + V.holdCap + ' kg)');
    t.eq(V.land, 'tub', k + ': lander i kar');
    for (let lv = 0; lv <= 3; lv++) t.eq(karN(k, lv), Math.min(V.kar.max, V.kar.n + lv), k + ': ' + lv + ' trinn på verftet gir ' + karN(k, lv) + ' kar');
    t.eq(karSteps(k), V.kar.max - V.kar.n, k + ': verftet har ' + karSteps(k) + ' trinn');
    const S = t.K.get('S'); S.boat.type = k; for (let lv = 0; lv <= 3; lv++){ S.boat.holdLv = lv; applyVessel(); t.eq(BOAT.holdCap, karN(k, lv) * TUB_KG, k + ' trinn ' + lv + ': BOAT.holdCap ' + BOAT.holdCap); }
    S.boat.holdLv = 0; }
  // Jonas' rule: the capacity is the tubs, 1 500 kg would be three; the boats have as many as their deck takes (no room for more)
  for (const k of open) t.eq(VESSELS[k].holdCap / TUB_KG, VESSELS[k].kar.n, k + ': ' + VESSELS[k].holdCap + ' kg er ' + VESSELS[k].kar.n + ' kar');
  for (const k of Object.keys(VESSELS).filter(k => !open.includes(k))) t.ok(!VESSELS[k].kar && karSteps(k) === HOLDUP.length, k + ': lasterom, ingen kar på dekk');
  // the catch in the tubs: in turn, 500 each, the iced at the bottom, nothing lost, round fish and live crabs not in them
  const H = (a) => a.map(([sp, kg, gut, iced]) => ({sp, kg, gut, iced}));
  let T = tubLoads(H([['torsk', 620, true, true], ['sei', 300, true, false], ['hyse', 40, false, false]]), 2);
  t.near(T[0].kg, 500, 1e-6, 'første kar fullt: 500 kg'); t.near(T[1].kg, 420, 1e-6, 'andre kar: resten av det sløyde (420 kg)');
  t.near(T[0].iced, 500, 1e-6, 'det isede ligger nederst'); t.near(T[1].iced, 120, 1e-6, '… og resten av det isede i neste kar'); t.eq(tubsFull(T), 2, 'to kar med fisk');
  t.ok(!('hyse' in T[0].sp) && !('hyse' in T[1].sp), 'fisken som venter på kniven, ligger i bløggekaret, ikke i karene');
  T = tubLoads(H([['torsk', 1700, true, true]]), 3); t.near(T[2].kg, 700, 1e-6, 'mer enn karene rommer: det siste karet tar resten, ingenting forsvinner');
  T = tubLoads([], 3); t.eq(tubsFull(T), 0, 'tomt: ingen kar med fisk'); t.eq(tubLoads(H([['torsk', 10, true, true]]), 0).length, 0, 'ingen kar på en båt med lasterom');
  const crab = Object.keys(SPECIES).find(k => SPECIES[k].live); if (crab) t.eq(tubsFull(tubLoads(H([[crab, 50, true, true]]), 1)), 0, 'levende ' + crab + ' går ikke i karene');
  // the landing: one lift a tub with fish and one with the empties; a boat with a hold fills 500 kg tubs from it
  const S = t.K.get('S'), k0 = open.find(k => VESSELS[k].kar.n >= 2) || open[0]; S.boat.type = k0; S.boat.holdLv = 0;
  let lp = landPlan(k0, 620, H([['torsk', 620, true, true]]));
  t.ok(lp.kind === 'tub' && lp.own && lp.n === 2 && lp.lifts === 4, k0 + ': 620 kg lander i 2 kar, 4 løft med de tomme tilbake ett og ett (' + JSON.stringify(lp) + ')');
  t.ok(lp.kgs[0] === 500 && lp.kgs[1] === 120, '… 500 og 120 kg');
  lp = landPlan('sjark', 3200); t.ok(!lp.own && lp.n === 7 && lp.lifts === 7, 'en båt med lasterom: 3 200 kg i 7 av mottakets kar, ett løft hver (' + lp.n + ')');
  // the packing: every fish inside the tub at its height, for every species and many seeds; the tub fills bottom up to its top
  // a save with the yard's bigger hold on an open boat gets the steps paid back, once
  { const S2 = t.K.get('S'), k1 = open[0]; S2.boat.type = k1; S2.boat.holdLv = 2; const c0 = S2.cash, kr = t.K.karRefund();
    t.ok(kr > 0 && Math.abs(S2.cash - c0 - kr) < 1 && S2.boat.holdLv === 0, k1 + ' med to trinn: ' + kr + ' kr tilbake, trinnene borte'); t.eq(t.K.karRefund(), 0, '… og bare én gang'); }
  const D = {rim:0.74, floor:0.14, in_top:[0.86, 1.06], in_floor:[0.8137, 1.0137]};
  const sps = Object.keys(SPECIES).filter(k => !SPECIES[k].live);
  let worst = 1, n0 = 1e9, n1 = 0, bad = '';
  for (const sp of sps.concat(['mix'])) for (let seed = 1; seed <= 12; seed++){
    const spec = sp === 'mix' ? {torsk:300, sei:120, hyse:60, lange:20} : {[sp]:500}, P = tubPack(D, spec, seed);
    n0 = Math.min(n0, P.length); n1 = Math.max(n1, P.length);
    for (const f of P){ const [hx, hz] = karIn(D, f.y - fishLie(f.sp)[1] * f.s * 0.5), b = fishLie(f.sp)[0] * f.s;
      for (const [x, z] of fishCorners(f.x, f.z, f.yaw, f.s, b)) if (!inRR(x, z, hx, hz, KAR_R, KAR_GAP - 1e-6)){ bad = sp + ' frø ' + seed; worst = 0; }
      if (f.y + fishLie(f.sp)[1] * f.s * 0.5 > D.rim) { bad = sp + ' over kanten'; worst = 0; } } }
  t.ok(worst === 1, 'ingen fisk går gjennom karveggen eller over kanten (alle arter, 12 frø)' + (bad ? ': ' + bad : ''));
  t.ok(n0 >= 6, 'et fullt kar har minst 6 fisk, kveita er stor (' + n0 + '–' + n1 + ')');
  const P = tubPack(D, {torsk:500}, 3); let last = -1, mono = true;
  for (let kg = 0; kg <= 500; kg += 5){ const k = tubShown(P, kg); if (k < last) mono = false; last = k; }
  t.ok(mono && tubShown(P, 0) === 0 && tubShown(P, 500) === P.length, 'fisken kommer til én om gangen og aldri fjernes når kiloene øker');
  t.ok(P.every((f, i) => i === 0 || f.y >= P[i - 1].y - 0.12), 'fisken legges nedenfra og opp');
  t.ok(JSON.stringify(tubPack(D, {torsk:500, sei:100}, 7)) === JSON.stringify(tubPack(D, {torsk:500, sei:100}, 7)), 'planen for et kar er den samme hver gang');
}
