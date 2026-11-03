// One national coastal fleet (L2/N1 of docs/planer/bestand-og-flaate.md, tools/npc/flaate.py -> src/data/flaate.json, flaateApply in
// 05-vessels.js): the register's active boats on the harbours' berths, the counts against the register, the boats a harbour gets,
// the boats behind the rights players hold hidden, and the ground of the day by the fleet's pressure.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const D = K.flaateData(); t.ok(D && D.meta && D.h, 'flaate.json leses');
  const M = D.meta, n = Object.values(D.h).reduce((a, e) => a + e.length, 0);
  t.eq(n, M.placed, `alle ${M.placed} plasserte båter ligger på en havn`);
  t.eq(M.lgN.reduce((a, v) => a + v, 0), M.placed, 'lengdegruppene summerer til de plasserte');
  const none = Object.values(M.none).reduce((a, v) => a + v, 0);
  t.eq(M.placed + M.over + none, M.active, `de aktive båtene under 28 m (${M.active}) er plassert (${M.placed}), uten kaiplass (${M.over}) eller i en kommune uten havn i pakkene (${none})`);
  // the register: 4 383 active in 2025 of all lengths (fiske.json meta.boats); under 28 m somewhat fewer
  const F = JSON.parse(K.FISKE_T); t.ok(M.active <= F.meta.boats.active && M.active > 0.85 * F.meta.boats.active, `${M.active} aktive under 28 m av registerets ${F.meta.boats.active} aktive`);
  t.ok(M.placed > 0.8 * M.active, `${Math.round(M.placed / M.active * 100)} % av de aktive har fått en kaiplass`);
  t.ok(M.openShare > 0 && M.openShare <= 0.9, `andelen under 11 m i åpen gruppe ${M.openShare}`);
  let bad = 0; for (const e of Object.values(D.h)) for (const [bi, L, g] of e) if (!(bi >= 0) || !(L >= 6 && L < 28) || !(g >= 0 && g < M.gear.length)) bad++;
  t.eq(bad, 0, 'hver båt har en kaiplass, en lengde under 28 m og et redskap');

  // a harbour of the packs gets the register's boats on its berths, and a harbour with none lies empty
  const [k0, e0] = Object.entries(D.h).find(([, e]) => e.length >= 1), [tile, hi] = k0.split('.'), [tx, ty] = tile.split(':').map(Number);
  const slot = bi => ({id:'c' + tx + ':' + ty + '.' + hi + '.' + bi, L:9, B:3.6, T:1.4, p:{x:0, y:0}, hd:0, name:'X', liv:0});
  const nh = +hi + 1, tl = {tx, ty, npc:Array.from({length:nh + 1}, (_, j) => ({x:0, y:0, boats:j === +hi ? [0, 1, 2, 3, 4].map(slot) : [slot(0)], grounds:[]}))};
  // the harbour after the packs' last one has no entry
  const kEmpty = tx + ':' + ty + '.' + nh; delete D.h[kEmpty];
  K.flaateApply(tl);
  const hb = tl.npc[+hi].boats;
  t.eq(hb.length, e0.length, `havna ${k0} får ${e0.length} båter fra registeret`);
  t.ok(hb.every((b, j) => b.L === e0[j][1] && b.gear === M.gear[e0[j][2]] && b.lg === K.LG_OF(b.L)), 'med lengde, redskap og lengdegruppe');
  t.eq(tl.npc[nh].boats.length, 0, 'en havn uten båter i registeret ligger tom');

  // the rights players hold: no boat hidden by default; when players hold 10 rights under 11 m, that share of the boats under 11 m
  t.eq(K.heldShare(0), 0, 'ingen båter skjult når spillerne ikke eier hjemler');
  const R = K.npcReg(); R.h9 -= 10; t.near(K.heldShare(0), 10 / M.lgN[0], 1e-9, '10 hjemler under 11 m skjuler den andelen av båtene under 11 m'); R.h9 += 10;

  // the ground of the day: every ground is drawn some days, and the one with the most pressure most often
  const H = (Date.UTC(2027, 2, 10, 12) - K.EPOCH) / 3.6e6, hus = K.GROUNDS[0].p, far = K.P(60.42, 4.95);
  const G = [{p:hus}, {p:far}], cnt = [0, 0]; for (let d = 0; d < 400; d++) cnt[G.indexOf(K.coastGround(G, d, 7, H))]++;
  t.ok(cnt[0] > cnt[1] && cnt[1] > 0, `feltet med mest trykk velges oftest (${cnt[0]} mot ${cnt[1]} av 400 dager)`);
}
