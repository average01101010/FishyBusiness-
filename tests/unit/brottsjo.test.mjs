// The breaking sea and the slamming (Ø9 F7, docs/planer/fysikk-4-sjo-og-skrog.md F7; Jonas 13.11.2026: «Bare varsel og skrekk»):
// core/03b-sea.js brottCond, brottEvent, brottNear, brottMinute; core/16c-hull.js slamRate, slamMinute; core/14-crewlife.js crewBrott.
// Checked: only in a rough sea where the wind sea and the swell cross at over 60 degrees, or the wind sea runs against a stream of over two
// knots; the same groups for two players (two cores) at the same place and time, and none in a calm sea; how often a boat lying in such a
// sea meets one, against the rate at a point the rule is built on; the warning before the hit; the fright by how she takes it (bow little,
// abeam most); nothing on the hull and nothing lost, and she never sinks; the slams at speed in a head sea, none slow or in a calm, and
// the crew's word and small fright when they go on.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), BRT = K.BRT;
  // ---- the rule for the sea that can raise one (brottCond), with the sea and the stream given ----
  const sea = (w, sw, dir, swDir, tp = 8, swTp = 12) => () => ({w, sw, dir, swDir, tp, swTp, F:50, U:15});
  let cur = null; K.set('seaCur', () => cur); K.set('isLandFar', () => false);
  const p0 = {x:850, y:350};
  K.set('brottSea', sea(3, 2.5, 200, 290)); t.ok(K.brottCond(p0, 100), 'grov sjø (Hs 3,9 m) der vindsjø og dønning krysser med 90°: brottsjø kan komme');
  K.set('brottSea', sea(3, 2.5, 200, 240)); t.ok(!K.brottCond(p0, 100), 'samme sjø som krysser med bare 40°: ingen');
  K.set('brottSea', sea(1.8, 1.6, 200, 290)); t.ok(!K.brottCond(p0, 100), 'kryssende sjø under 3 m (2,4 m): ingen');
  K.set('brottSea', sea(3.2, 0.5, 200, 290)); t.ok(!K.brottCond(p0, 100), 'grov vindsjø uten dønning å krysse, uten strøm: ingen');
  cur = {kn:3, af:1.2, against:2.6}; t.eq((K.brottCond(p0, 100) || {}).why, 'strom', 'grov vindsjø mot 2,6 knop strøm: brottsjø kan komme (strom)');
  cur = {kn:1.5, af:1.1, against:1.5}; t.ok(!K.brottCond(p0, 100), 'samme sjø mot 1,5 knop: ingen');
  cur = null;

  // ---- the same for two players, and none in a calm sea ----
  const rough = () => ({hs:5, w:4, sw:3, dir:200, swDir:290, tp:9, swTp:12, why:'kryss'}), calm = () => null;
  const list = (KK, cond) => { const out = []; for (let t0 = 0; t0 < 6000; t0 += 7) for (const e of KK.brottNear({x:850, y:350}, t0, cond)) out.push(e.id); return [...new Set(out)].sort(); };
  const A = list(K, rough), K2 = t.fresh(), B = list(K2, rough);
  t.ok(A.length > 0, 'grov kryssende sjø i 100 timer: grupper i cellene rundt (' + A.length + ')');
  t.eq(B, A, 'en annen spiller (en annen kjerne) får de samme gruppene på samme sted og tid');
  t.eq(list(K, calm).length, 0, 'ingen i rolig sjø');

  // ---- how often a boat lying in it meets one: the rate at a point, 1 / Tz a real second times e^-8 times the share that breaks ----
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); b.status = 'sailing'; b.v = 1; b.heading = 0; b.pos = {x:851.3, y:349.7};
  K.set('brottSea', sea(4, 3, 200, 290, 9, 12));   // (the sea at her: as rough, no lee)
  S.crew = []; let hits = 0, warns = 0; const N = 600000;
  K.set('crewBrott', k => { if (k === 'hit') hits++; else if (k === 'warn') warns++; return 0; });
  for (S.t = 100; S.t < 100 + N; S.t++) K.brottMinute(rough);
  const tpW = 9, tpS = 12, eW = 16 / 25, lamOf = tp => BRT.rs / (tp / 1.29) * Math.exp(-8) * BRT.B, want = N * (eW * lamOf(tpW) + (1 - eW) * lamOf(tpS));
  t.near(hits / want, 1, 0.25, 'liggende i grov kryssende sjø: så mange brottsjøer som regelen gir for et punkt (' + hits + ' mot ' + want.toFixed(1) + ' på ' + (N / 60 / 24).toFixed(0) + ' spilldøgn)');
  t.ok(warns >= hits, 'mannskapet varsler før den kommer (' + warns + ' varsler, ' + hits + ' treff)');

  // ---- what a hit does: a warning first, then a fright by the side; nothing on the hull, nothing lost, she never sinks ----
  K.set('crewBrott', K.crewBrott);
  // a group of its own, by hand: one cell, one minute, running north (dx 0, dy -1), passing (850, 350) half way through its life
  const ev = (side) => { const e = {id:'t' + side, t:1000, x:850, y:350, dx:0, dy:-1, from:180, hs:5, tp:10, L:156, cg:7.8, life:140, sa:187, sw:390, sys:'w', why:'kryss'}; return e; };
  const meet = (head, o = {}) => {
    K.set('S', K.newState()); const S3 = K.get('S'), b3 = S3.boat; b3.type = 'sjark'; K.applyVessel(); b3.status = 'sailing'; b3.v = o.kn || 6; b3.heading = head; b3.pos = {x:850, y:o.y0 || 350};
    const CC = [K.genCrew(), K.genCrew()]; CC.forEach((c, i) => { c.name = ['Ola A', 'Kari B'][i]; c.off = false; c.bi = false; c.sleepW = false; c.morale = 70; c.attr.sjo = 2; c.traits = []; }); S3.crew = CC;
    const pg = JSON.stringify(S3.pgear), e = ev(head), near = K.brottNear; K.set('brottNear', () => [e]);
    const said = []; for (S3.t = 1000; S3.t < 1020; S3.t++){ const n = S3.log.length;
      if (o.kn) b3.pos = {x:850, y:o.y0 - Math.cos(head) * o.kn * 0.5144 * 60 / 1000 * (S3.t - 1000)};   // (she goes her way, in game minutes)
      K.brottMinute(); for (const l of S3.log.slice(n)) said.push(l.no); }
    K.set('brottNear', near);
    return {said, morale:CC.map(c => c.morale), dmg:b3.dmg, damage:b3.damage, pg:JSON.stringify(S3.pgear) === pg, inc:(S3.incidents || []).filter(i => i.k === 'brott'), status:b3.status};
  };
  // (the group comes from the south, 180 degrees: heading south (pi) she takes it on the bow, heading east abeam to starboard, north astern)
  const bow = meet(Math.PI), beam = meet(Math.PI / 2), aft = meet(0);
  t.ok(bow.said.length === 2 && /Brottsjø forut! Hold baugen opp!/.test(bow.said[0]), 'varselet før den kommer: «Brottsjø forut! Hold baugen opp!»', bow.said);
  t.ok(/Brottsjø om styrbord/.test(beam.said[0]) && /tvers/.test(beam.said[1]), 'tvers: varselet om styrbord, så «Den tok oss tvers!»', beam.said);
  t.ok(/akterfra/.test(aft.said[0]) && /hekken/.test(aft.said[1]), 'akterfra: varselet og «Den kom inn over hekken!»', aft.said);
  const drop = r => 70 - r.morale[0];
  t.ok(drop(bow) > 0 && drop(beam) > drop(aft) && drop(aft) > drop(bow), 'skrekken etter hvor hun tok den: tvers mest, akterfra nesten like mye, på baugen lite (' + [drop(bow), drop(beam), drop(aft)].map(v => v.toFixed(1)).join(', ') + ')');
  t.near(drop(beam), K.FRIGHT.brott * (1.2 - 0.12 * 2), 1e-9, 'tvers: trivselen ned 12 × (1,2 − 0,12 × sjømannskap)');
  // under way into it, as the crew asks: 8 knots south from 1.5 km north of its middle; she covers 250 m a game minute to its 78
  const run = meet(Math.PI, {kn:8, y0:348.5});
  t.ok(run.said.length === 2 && /forut/.test(run.said[0]) && /baugen/.test(run.said[1]), 'i fart mot den: varselet, så «Den tok vi på baugen»', run.said);
  // in the lee (the sea at her under half the group's): nothing
  K.set('brottSea', sea(0.8, 0.5, 200, 290, 4, 12)); const lee = meet(Math.PI / 2); K.set('brottSea', sea(4, 3, 200, 290, 9, 12));
  t.eq(lee.said.length + lee.inc.length, 0, 'i le (0,9 m sjø der hun ligger, gruppen 5 m): ingen varsel og intet treff');
  for (const [nm, r] of [['på baugen', bow], ['tvers', beam], ['akterfra', aft]]){
    t.ok(!r.dmg && !r.damage && r.pg, nm + ': ingen skade på skroget og ingenting gått over bord (Jonas 13.11.2026)');
    t.ok(r.status === 'sailing', nm + ': hun seiler videre, synker aldri');
    t.eq(r.inc.length, 1, nm + ': hendelsen står i S.incidents');
  }

  // ---- the slamming: Ochi's rate at speed in a head sea, none slow, from the beam less, none in a calm ----
  K.set('S', K.newState()); const S4 = K.get('S'), b4 = S4.boat; b4.type = 'sjark'; K.applyVessel(); b4.status = 'sailing'; b4.pos = {x:850, y:350}; S4.t = 600;
  K.set('gridGamma', () => 0);
  K.set('hsParts', sea(6.1, 0, 0, 0, 9.5, 12));   // (6.1 m from the north: heading 0 is a head sea)
  const at = (kn, head) => { b4.v = kn; b4.heading = head; return K.slamRate(b4, 10) * BRT.rs; };
  const h8 = at(8, 0), h3 = at(3, 0), beam8 = at(8, Math.PI / 2), h5 = at(5, 0);
  t.note('sjark i 6,1 m motsjø: ' + h8.toFixed(2) + ' slag per spillminutt i 8 knop, ' + h5.toFixed(2) + ' i 5 knop, ' + beam8.toFixed(2) + ' tvers i 8 knop (3D-modellen, hull3d 5.20n: 12 slag på fire minutter, 0,5 per spillminutt)');
  t.ok(h8 > h5 && h5 > 0, 'flere slag jo fortere hun går mot sjøen (8 knop ' + h8.toFixed(2) + ', 5 knop ' + h5.toFixed(2) + ')');
  t.eq(h3, 0, 'ingen slag i sakte fart (under 4 knop)');
  t.ok(beam8 < h8 * 0.5, 'tvers på sjøen langt færre slag enn mot den');
  t.near(Math.log10(h8 / 0.5), 0, 1, 'størrelsesorden som 3D-modellen i 6,1 m motsjø (innen en faktor 10)');
  const hard = (kn, head) => { b4.v = kn; b4.heading = head; return K.slamRate(b4, 10, K.SLAM.hard) * BRT.rs; };
  K.set('hsParts', sea(0.6, 0, 0, 0, 3, 12)); t.ok(hard(8, 0) < K.SLAM.warn / 3, 'i 0,6 m krapp sjø i 8 knop: få harde slag, langt under varselet (' + hard(8, 0).toFixed(3) + ' per spillminutt)');
  K.set('hsParts', sea(3, 0, 0, 0, 6.8, 12)); t.ok(hard(8, 0) > K.SLAM.warn, 'i 3 m motsjø i 8 knop: over varselet (' + hard(8, 0).toFixed(2) + ')');
  // the warning and the small fright when they go on, nothing on the hull
  K.set('hsParts', sea(3, 0, 0, 0, 6.8, 12)); b4.v = 8; b4.heading = 0; S4.me = S4.cur;
  const C4 = [K.genCrew()]; C4[0].name = 'Ola A'; C4[0].off = false; C4[0].bi = false; C4[0].sleepW = false; C4[0].morale = 70; C4[0].attr.sjo = 2; C4[0].traits = []; S4.crew = C4;
  const said = []; for (; S4.t < 660; S4.t++){ const n = S4.log.length; K.slamMinute(); for (const l of S4.log.slice(n)) said.push(l.no); }
  t.ok(said.length === 2 && /slår hardt|smell/.test(said[0]), 'slag på slag i 3 m motsjø i 8 knop: mannskapet sier fra, høyst hver halvtime (' + said.length + ' på en time)', said);
  t.ok(C4[0].morale < 70 && C4[0].morale > 60, 'en liten skrekk hver gang (' + C4[0].morale.toFixed(1) + ')');
  t.ok(!b4.dmg && !b4.damage, 'ingen skade på skroget av slagene (Jonas 13.11.2026)');
  // the hurtigsjark at 14 knots in 3 m (the sjark is held near 6.4 knots there by speedCap, under the warning): twelve hours on the
  // autopilot: a word every half hour, and the fright never takes them under FRIGHT.slamFloor
  b4.type = 'hurtigsjark'; K.applyVessel(); b4.v = 14; C4[0].morale = 70; const s12 = []; const t12 = S4.t;
  for (; S4.t < t12 + 720; S4.t++){ const n = S4.log.length; K.slamMinute(); for (const l of S4.log.slice(n)) s12.push(l.no); }
  t.ok(s12.length >= 20 && s12.length <= 24, 'hurtigsjarken i 14 knop i 3 m motsjø: mannskapet sier fra hver halvtime (' + s12.length + ' på 12 timer)');
  t.ok(C4[0].morale >= K.FRIGHT.slamFloor, 'skrekken av slagene tar dem aldri under ' + K.FRIGHT.slamFloor + ' (' + C4[0].morale.toFixed(1) + ')');
  // nobody holds it against you when you are not aboard: no word, no fright
  S4.me = 'annen'; C4[0].morale = 70; const s0 = S4.log.length; for (const t0 = S4.t; S4.t < t0 + 120; S4.t++) K.slamMinute();
  t.ok(S4.log.length === s0 && C4[0].morale === 70, 'uten deg om bord: ingen ord og ingen skrekk av slagene');
}
