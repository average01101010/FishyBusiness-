// The closest point of approach with a vessel on her way to lie at a quay (AS1 14.11.2026, core/05e-sjovei.js colregSit, b.dock from
// ferjeAt): at Fitjar one who gave way to a ferry by rule 15 passed astern of her, and she laid to at her quay right on the line. Past the
// hour she reaches the quay she lies still there, so the CPA is with her at the quay and the other going on.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const R = Math.PI / 180, NM = K.NM;
  const V = (x, y, hd, v, o = {}) => Object.assign({p:{x, y}, hd:hd * R, cog:hd * R, v, cls:'pow', L:21}, o);
  // a at the origin north at 7 knots; the ferry 1 km east and 1 km ahead going west at 10 knots, to lie at a quay right on a's line
  const a = V(0, 0, 0, 7), tq = 1 / (10 * NM);   // (hours to the quay 1 km off)
  const free = K.colregSit(a, V(1, -1, 270, 10, {L:64}));
  const dock = K.colregSit(a, V(1, -1, 270, 10, {L:64, dock:{x:0, y:-1, t:tq}}));
  t.ok(free.cpa > 150, 'uten kaia: ferja ser ut til å gå klar forut (CPA over 150 m)', Math.round(free.cpa));
  t.ok(dock.cpa < 5 && dock.risk, 'med kaia på linja hennes: CPA ved kaia, og en fare', Math.round(dock.cpa));
  t.near(dock.tcpa, 60 / (7 * NM), 0.05, 'tiden til CPA er tiden hun bruker til kaia (1 km i 7 knop)');
  t.eq(dock.sit, free.sit, 'regelen er den samme (hvem som viker, endres ikke av kaia)');
  t.near(Math.hypot(dock.vx, dock.vy), 7 * NM, 1e-6, 'etter at ferja ligger, er den relative farten hennes egen');
  // the quay comes after the CPA: nothing changes
  const late = K.colregSit(a, V(1, -1, 270, 10, {L:64, dock:{x:-5, y:-1, t:0.6 / NM}}));
  t.near(late.cpa, free.cpa, 1e-6, 'kaia etter CPA-en: samme CPA som uten');
  // a quay behind a: the closest is at the hour she lies to (a moves away from it)
  const behind = K.colregSit(V(0, 0, 0, 7), V(0.3, 0.4, 270, 10, {L:64, dock:{x:0.2, y:0.4, t:0.1 / (10 * NM)}}));
  t.ok(behind.tcpa >= 0 && behind.tcpa <= 0.1 / (10 * NM) * 60 + 1e-6 && behind.cpa > 400, 'kaia akter for henne: ingen fare', [Math.round(behind.cpa), behind.tcpa]);
  // a lying still: the ferry going to her own quay elsewhere
  const still = K.colregSit(V(0, 0, 0, 0), V(1, -1, 270, 10, {L:64, dock:{x:0, y:-1, t:tq}}));
  t.ok(still.cpa > 900, 'hun ligger stille 1 km unna kaia: ingen fare', Math.round(still.cpa));
}
