// The fleet's pressure and the stock's baseline (B3 of docs/planer/bestand-og-flaate.md, 03g-trykk.js): the year's pressure of each
// group of the quota chain is the group's quota, the open group's pressure follows its season and stops with it, the baseline is the
// balance between the pressure and the regrowth (lower on the worked grounds, 1 where nobody fishes), the skrei is one body of fish
// through the season, the Senja fleet's own take is gone, and the lookup is quick.
export default function (t){
  const K = t.K; K.set('S', K.newState()); const S = K.get('S');
  const y = 2027, H = (m, d, h = 8) => (Date.UTC(y, m, d, h) - K.EPOCH) / 3.6e6;
  // 1. the year's pressure by group = the group's quota (±2 %)
  const T = K.trykkYear('torsk', y);
  for (const g of ['open', 'u11', 'g11', 'g15', 'g21', 'tral', 'hav']){
    t.ok(Math.abs(T.sums[g] / T.Q[g] - 1) < 0.02, `torsk ${y}, ${g}: årets trykk ${Math.round(T.sums[g] / 1000)} t = gruppekvoten ${Math.round(T.Q[g] / 1000)} t`);
  }
  const Qtot = Object.values(T.Q).reduce((a, b) => a + b, 0), Y = K.yearQuota(y);
  t.ok(Qtot < Y.nor.torsk * 1000 && Qtot > 0.9 * Y.nor.torsk * 1000, `gruppene tar ${Math.round(Qtot / 1e6)} kt av Norges kvote ${Math.round(Y.nor.torsk / 1000)} kt (resten er avsetningene på toppen)`);
  for (const sp of ['hyse', 'sei']){ const Ts = K.trykkYear(sp, y); t.ok(Math.abs(Ts.sums.all / (Y.nor[sp] * 1000) - 1) < 0.02, `${sp} ${y}: årets trykk ${Math.round(Ts.sums.all / 1e6)} kt = Norges kvote ${Math.round(Y.nor[sp] / 1000)} kt`); }

  // 2. the open group: its pressure follows the group's catch day by day, and is nothing when the group has stopped
  const cell = K.P(69.65, 17.65);   // a coastal cell under 11 m boats fish (Senja)
  S.t = Math.round(H(3, 20) * 60); const Yq = K.qyAt(S.t / 60), hS = S.t / 60 - 2;
  K.LOKC.clear(); const fOn = K.fleetF('torsk', cell, hS), keep = Yq.r; Yq.r = 0; K.LOKC.clear(); const fOff = K.fleetF('torsk', cell, hS + 1); Yq.r = keep;
  t.ok(K.trykkOpenScale(hS + 1) >= 0 && fOff < fOn, `åpen gruppe: trykket følger gruppas fangst (${fOn.toFixed(2)} kg/t med fiske, ${fOff.toFixed(2)} når gruppa er stoppet og fangsten er null)`);
  const save = Yq.r; Yq.r = 0; t.eq(K.trykkOpenScale(hS + 1), 0, 'åpen gruppe: null trykk etter stoppen når båtene er over den garanterte kvoten'); Yq.r = save;

  // 3. the baseline: lower on the worked grounds in the season, 1 where nobody fishes, and the stock is the baseline × the deviation
  S.t = 0; K.LOKC.clear();
  const hus = K.GROUNDS[0].p, bM = K.baseAt(hus, 'torsk', H(2, 15)), bJ = K.baseAt(hus, 'torsk', H(6, 15)), bB = K.baseAt(K.P(60.42, 4.95), 'torsk', H(2, 15));
  t.ok(bM > 0.4 && bM < 0.9 && bJ > 0.95, `grunnlinja på Husøy: ${bM.toFixed(2)} i mars (fiskes hardt), ${bJ.toFixed(2)} i juli`);
  t.ok(bB > 0.97, `grunnlinja for torsk utenfor Bergen er nær urørt (${bB.toFixed(3)})`);
  S.stock = {}; t.near(K.stockAt(hus, 'torsk', H(2, 15)), bM, 1e-9, 'bestanden er grunnlinja når spillerne ikke har fisket');
  S.stock[K.stockIdx(hus)] = 0.5; const sa = K.stockAt(hus, 'torsk', H(2, 15)); t.ok(sa < bM && sa > 0.3 * bM, `og grunnlinja × avviket når de har (${sa.toFixed(2)})`); S.stock = {};
  t.ok(K.stockAt(hus, 'blakveite', H(2, 15)) === 1, 'blåkveita har sitt eget lag (ingen grunnlinje fra torskeflåten)');

  // 4. the skrei is one body: what the fleet has taken so far this season is not there further along
  const L = [0, 1, 2, 3, 4, 5].map(m => K.skreiLeft(H(m, 1)));
  t.ok(L.every((v, i) => i === 0 || v <= L[i - 1]) && L[0] > 0.98 && L[5] > 0.6 && L[5] < 0.9, `skreien tynnes gjennom sesongen: ${L.map(v => v.toFixed(2)).join(' ')}`);

  // 5. the Senja fleet's own take is gone: an hour of the stock leaves an untouched sea untouched
  S.stock = {}; K.stockHour(H(2, 15, 9)); t.eq(Object.keys(S.stock).length, 0, 'Senja-flåtens eget uttak er borte: en urørt sjø forblir urørt (trykket ligger i grunnlinja)');
  t.eq(Object.keys(K.initStock()).length, 0, 'ny lagring starter med urørt avvik');

  // 6. the lookup per cell and hour, kept for all species (plan 5b: under 5 µs)
  K.baseAt(hus, 'torsk', H(2, 1)); let t0 = performance.now(); for (let i = 0; i < 2e5; i++) K.baseAt(hus, i & 1 ? 'torsk' : 'sei', H(2, 1)); const us = (performance.now() - t0) * 1000 / 2e5;
  t0 = performance.now(); for (let i = 0; i < 400; i++) K.baseAt(hus, 'torsk', H(2, 2) + i); const usNew = (performance.now() - t0) * 1000 / 400;
  t.ok(us < 5, `baseAt per rute og time tar ${us.toFixed(3)} µs (${usNew.toFixed(1)} µs første gang i en ny time, for alle elleve arter)`);
}
