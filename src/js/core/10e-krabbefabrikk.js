// ===== the snow crab aboard: the factory for the clusters and the live crab in the tanks (H3b of docs/planer/havsteget-h3-snokrabbe.md,
// 06.11.2026) =====
// Jonas 06.11.2026 (V1 A): the snow crab vessel is a combination vessel, with a factory for the clusters and tanks for live crab, and the
// player chooses live or frozen for each trip; the extra quota (82 t in 2026, about 110 t in 2027) is for live delivery only (V2 C: both
// are landed at every plant whose quay takes her).
//
//  The factory (frozen trips): the sorting on deck is H3a's (landSno); the kept crab goes to the factory, which splits it in two clusters
//  (the deck's «gutting», 05-vessels.js deckMinute, at the table's pace), cooks, freezes and glazes them in the freezers (BOAT.freezeT, kg
//  of product a day) and packs them in cartons. The hold fills by the clusters' weight (prodKg), the quota and the price go by the round
//  weight, with Fiskeridirektoratet's factor for the year (SPECIES.snokrabbe.uh is snoUh). Dead crab (H3a's 1 % in the pot, and what dies
//  in the tanks) is not split: it is frozen round and landed for meal (rund), as the notes have it.
//  The tanks (live trips): the hard males and the soft ones go live into the RSW tanks with sea water running through (BOAT.tank), by the
//  notes' size groups (cls 3-6), as long as there is room; the rest goes to the factory. In the tanks the crab dies by and by (snoTankHour):
//  faster the longer it has been there, the warmer the water, the denser the tank and when its shell is soft; with the pumps stopped (no
//  fuel) it dies fast. What dies goes to the freezer round.
//  The landing: the clusters and the dead crab on pallets (07-harbours.js PALL), the live crab pumped from the tanks to tubs on deck and
//  lifted ashore with the crane (KARLV); the live crab first on the extra quota, then on the ordinary (snoLandQ).
//
// Sources (kap. 2b and 5 of the plan; read 06.11.2026 unless said):
//  - the factor: the landing notes 2024-2026 (Fiskeridirektoratet, fangstdata, NLOD): clusters (Klør) landed with 1.61 round per kg of
//    product in 2024 and 2025 and 1.49 from 2026 (6 408 t of 6 662 t in 2026 at 1.49; the rest landings of December 2025 at 1.61)
//  - the packing: the notes have the clusters «fryst og glasert», «emballert», «konsumpakket», «i lås» and «½ blk i krt 25 kg»; the glaze
//    is 7-12 %, about 10 % (Råfisklaget, rundskriv 2020_41, a snippet); the gross weight includes it, the product weight does not
//  - the dead crab: the notes for 2026 (the discard ban for dead and dying snow crab from 1.1.2026, høstingsforskriften § 51) have dead
//    crab landed round for meal («Rund», «Oppmaling») on the live landings: 142 t against 4 699 t live, 2.9 % by weight (the median landing
//    2.1 %, the tenth highest 9 %; 0.3 % in January, 2.8-2.9 % in February and March, 4.9 % in April, 3.7 % in May, 8.3 % in June), on the
//    extra and the ordinary quota alike; the meal paid 1 kr/kg in 2025 (seven rows)
//  - the live crab: 2-3 days from the last catch to the landing (the median), 9 days between landings (the quartiles 7 and 15) and 32 t a
//    landing in 2026 (the notes); 29-32 % of the live crab on the extra quota. The tanks: «Ved lossing etter endt tur så pumpes et parti
//    levende krabbe fra RSW-tank til lossekar på dekk», and a 100 m3 tank (FHF 901919, a snippet); Nofima's trials at 100, 150 and
//    200 kg/m3 for 30-35 days, with mortality more than halved at 50 kg/m3 and none at 25 (nofima.brage.unit.no, a snippet), and the
//    guideline of at most 25 kg/m3 (FHF 901091, a snippet); below 5 °C and 30-34 ‰ (Nofima 2016, a snippet); in water the crab bears
//    3-25 days (KrabbeFrakt, FHF 901989, a snippet). No mortality a day aboard was found: SNOT is calibrated to the notes' 2.9 %
//  - the prices (snoPrice): see SNOP
const SNOUH = {2024:1.61, 2025:1.61, 2026:1.49};
// the year's factor from clusters to round weight (the last known year's after it, the first's before)
function snoUh(H){ const y = yearH(H == null ? (S && S.t != null ? S.t / 60 : 0) : H), ys = Object.keys(SNOUH).map(Number); return SNOUH[clamp(y, Math.min(...ys), Math.max(...ys))]; }
// a vessel whose pots are the snow crab's (VESSELS pot): her catch goes through this factory
const snoVessel = () => !!(typeof BOAT !== 'undefined' && BOAT && BOAT.pot && POTS[BOAT.pot] && POTS[BOAT.pot].sno);
// ---- live or frozen, a choice for the trip (S.boat.snoMode: 'frys', the default, or 'lev'); only a vessel with tanks can go live
const snoTanks = () => !!(BOAT && BOAT.tank && BOAT.tank.kg > 0);
const snoLive = () => snoTanks() && S.boat.snoMode === 'lev';
function snoSetMode(m){
  const b = S.boat; if (!snoTanks()) return false; m = m === 'lev' ? 'lev' : 'frys'; if ((b.snoMode || 'frys') === m) return false; b.snoMode = m;
  log(m === 'lev' ? 'Turen er for levende krabbe: de harde og de bløte hannene går i tankene, så lenge det er plass, og resten til fabrikken.' : 'Turen er for fryste klør: fangsten deles, kokes og fryses i fabrikken.' + (tankLoad() > 1 ? ' Krabben som alt er i tankene, blir der til levering.' : ''),
    m === 'lev' ? 'The trip is for live crab: the hard and the soft males go into the tanks while there is room, and the rest to the factory.' : 'The trip is for frozen clusters: the catch is split, cooked and frozen in the factory.' + (tankLoad() > 1 ? ' The crab already in the tanks stays there until the landing.' : ''));
  return true;
}
// ---- the tanks
const tankCap = () => (BOAT && BOAT.tank && BOAT.tank.kg) || 0;
const tankLoad = () => S.hold.reduce((a, x) => a + (x.tank ? x.kg : 0), 0);
const tankRoom = () => Math.max(0, tankCap() - tankLoad());
// the notes' size group of a live crab (kg): cls 3 800 g and over, 4 500-800 g, 5 350-500 g, 6 under 350 g
const snoSz = w => w >= 0.8 ? 3 : w >= 0.5 ? 4 : w >= 0.35 ? 5 : 6;
// The crab dying in the tanks, a day's share: h0 at rho0 kg/m3 for crab just in, rising with its days there (1 + age / tau), with the
// density (rho / rho0, Nofima: more than halved at 50 against 100-200 kg/m3), with the water over t0 °C (exp(tk (T - t0)); kept below
// 5 °C, Nofima), soft-shelled (soft times; newly moulted crab is weak, our figure) and with the pumps stopped (still times). h0 is
// calibrated so that a live trip of nine days in February and March, the last catch two days before the landing, the tanks filling to
// about 32 t, lands about 2.9 % dead (the notes for 2026; tests/unit/krabbefabrikk.test.mjs). tau, tk, soft and still are assumptions
const SNOT = {h0:0.0064, rho0:100, tau:10, t0:4, tk:0.2, soft:4, still:20};
function snoDayF(x, H, rho, T, flow){ const age = Math.max(0, H - x.hr) / 24, sf = x.kg > 0 ? (x.sk || 0) / x.kg : 0;
  return SNOT.h0 * (1 + age / SNOT.tau) * Math.max(0.1, rho / SNOT.rho0) * Math.exp(SNOT.tk * Math.max(0, T - SNOT.t0)) * (1 + (SNOT.soft - 1) * sf) * (flow ? 1 : SNOT.still); }
// the round lot of dead crab for the freezer this hour (frozen by the deck's freezing, not split: rund)
function snoDeadLot(hr){ let y = S.hold.find(h => h.sp === 'snokrabbe' && h.rund && !h.frozen && h.hr === hr);
  if (!y){ y = {sp:'snokrabbe', cls:2, kg:0, n:0, bled:true, iced:false, hr, fresh:100, gut:true, hook:false, rund:true}; S.hold.push(y); } return y; }
// an hour in the tanks (vesselStep, at the full hour): the dead crab out of each lot and into the freezer, round
function snoTankHour(H){
  if (!snoTanks()) return 0; const T = S.hold.filter(x => x.tank && x.kg > 0); if (!T.length) return 0;
  const b = S.boat, rho = tankLoad() / Math.max(1, BOAT.tank.m3), Tw = seaTemp(H, b.pos), flow = b.fuel > 0, hr = Math.floor(H); let dead = 0;
  for (const x of T){ const f = Math.min(1, snoDayF(x, H, rho, Tw, flow) / 24), kg = x.kg * f, n = (x.n || 0) * f; if (kg <= 1e-6) continue;
    x.kg -= kg; x.n = (x.n || 0) - n; if (x.sk) x.sk = Math.max(0, x.sk - kg * Math.min(1, SNOT.soft * x.sk / Math.max(1e-9, x.kg + kg)));
    const y = snoDeadLot(hr); y.kg += kg; y.n += n; dead += kg; if (x.kg < 0.01) S.hold.splice(S.hold.indexOf(x), 1); }
  const tr = tripOf(b); tr.tankDead = (tr.tankDead || 0) + dead; return dead;
}
// ---- the stowing of a crab the sorting kept (landSno, 10d-snokrabbe.js): the dead to the freezer round, a live trip's crab into the
// tanks by its size while there is room, the rest to the factory as the clusters of a hard or a soft crab. Returns where it went
function snoStow(c, k){
  const o = {fresh:100, how:'teine'};
  if (c.dead){ addCatch('snokrabbe', k, 2, false, {...o, rund:true}); return 'rund'; }
  if (snoLive() && tankRoom() >= k){ const x = addCatch('snokrabbe', k, snoSz(c.w), false, {...o, tank:true}); if (c.soft && x) x.sk = (x.sk || 0) + k;
    const tr = tripOf(S.boat); tr.tankIn = (tr.tankIn || 0) + k; return 'tank'; }
  if (snoLive() && !S.boat.tankFull){ S.boat.tankFull = S.t; log('Tankene er fulle (' + fmtC(tankLoad() / 1000, 1) + ' t levende krabbe). Resten deles, kokes og fryses som klør.', 'The tanks are full (' + fmtC(tankLoad() / 1000, 1) + ' t of live crab). The rest is split, cooked and frozen as clusters.'); }
  addCatch('snokrabbe', k, c.soft ? 1 : 0, false, o); return 'fab';
}
// ---- the prices (kr/kg round weight). SNOP: the clusters (SPECIES pm) and the live crab (pmL) by month are the landing notes' (beløp for
// fisker over rund vekt): the month against its year's mean, in 2024 and 2025 (the clusters 2024: January 64.5, February 68.9, March
// 71.0, April 68.6; 2025: January 133.1, February 133.0, March 136.8, April 118.4, May 91.0, July 86.2; the live crab 2025: 85.3, 90.2,
// 91.0, 82.5, 79.4, 80.9 and 70.0 January to July, 2024 by its tonnes), times the mean of 2024, 2025 and 2026 (the clusters 68.90, 130.68
// and 119.8 kr/kg round weight, the live 63.68, 82.41 and 71.12: Fiskeridirektoratet's sak 17/2025, read, and for 2026 Råfisklaget's
// price report week 34/2026, 178.5 kr/kg of product, and NRK 8.7.2026, 71.12 kr/kg, snippets; the notes for 2026 have no amounts yet),
// as the permit's value has them (SNOV in 03d-quota.js): 106.5 and 72.4. August to November (closed) are filled between July and
// December, and December is January's. The live crab by its size group against the mean (sz; the notes 2025: 800-999 g 93.2, 500-800 g
// 83.0, 350-500 g 79.0, under 350 g 79.2 kr/kg); Råfisklaget's minimum prices are the floor (SPECIES cls). The dead crab for meal: 1 kr/kg.
// The world market buys the frozen and the live crab, so a landing does not lower the price at the plant (no saturation, no fresh supply)
const SNOP = {sz:[1.114, 0.992, 0.944, 0.947], dead:1};
function snoPrice(port, x, H){
  const s = SPECIES.snokrabbe, c = x.cls != null ? x.cls : 0; if (x.rund || c === 2) return SNOP.dead;
  const live = !!x.tank, base = seasonal(live ? s.pmL : s.pm, H) * (1 + weekDev('snokrabbe', H)) * (live ? SNOP.sz[c - 3] || 1 : 1) * ((port && port.pf) || 1) * (port ? folkPf(port.id) : 1);
  return Math.round(Math.max(s.cls[c] ? s.cls[c][1] : 0, base) * 100) / 100;
}
// ---- the quota at a landing (landConf and sell, ui/08-actions.js): the live crab first on the extra quota (J-237-2025 § 4: «til
// levering av levende snøkrabbe»), the rest of it and the clusters and the dead crab on the ordinary vessel quota with the flexibility;
// what is over is confiscated. The year's extra quota used is quotaState().snoTq
function snoLandQ(H, q){
  const live = S.hold.reduce((a, x) => a + (x.sp === 'snokrabbe' && x.tank ? x.kg : 0), 0), all = S.hold.reduce((a, x) => a + (x.sp === 'snokrabbe' ? x.kg : 0), 0);
  const Q = S.lic && S.lic.id === 'krab' ? snoQuota(H) : null, tqLeft = Q ? Math.max(0, Q.extra - (q.snoTq || 0)) : 0, tq = Math.min(live, tqLeft);
  const ord = Q ? Math.min(all - tq, snoRoom(H)) : 0;
  return {live, all, tq, ord, conf:Math.max(0, all - tq - ord)};
}
// ---- the landing of the live crab: pumped from the tanks into tubs on deck and lifted ashore with the crane, KARLV.kg of crab a tub and a
// lift every KARLV.lift minutes (no figures found: 400 kg and 5 min are assumptions; Finnmark's plants take 500-600 t of live crab a week,
// Sjømat Norge 2023, read)
const KARLV = {kg:400, lift:5};
// ---- the trip of a snow crab vessel (tripLeft, 04-crew.js): the bait for the pots at the trip's pace (a pot baited at each setting, half
// a kilo; until a day of it, the portal's pace round the clock), and on a live trip the room in the tanks at the pace they filled so far
// (until a tonne is in, 5 t a day) and the days the oldest crab has been in them
function snoTrip(R, b, d){
  const pg = S.pgear, T = tripOf(b), P = POTS.sno;
  const perDay = d >= 1 && (T.potBait || 0) > 0 ? T.potBait / d : 1440 / P.haul * P.bait;
  R.bait = (pg ? baitKg(pg) : 0) / Math.max(1, perDay);
  if (snoLive()){ const inD = d >= 0.5 && (T.tankIn || 0) > 1000 ? T.tankIn / d : 5000; R.tank = tankRoom() / Math.max(1, inD); }
  const old = S.hold.filter(x => x.tank && x.kg > 0.5).reduce((a, x) => Math.min(a, x.hr), Infinity);
  R.tankAge = isFinite(old) ? (S.t / 60 - old) / 24 : null; R.tankDead = T.tankDead || 0;
  return R;
}
