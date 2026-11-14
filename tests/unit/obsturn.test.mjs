// Can she turn through a way round (core/11b-obstacles.js obsTurnable; steg 126 AS1, 14.11.2026): a corner needs of each leg beside it her
// radius (2.5 lengths) times tan(half the turn) and half her length, a leg between two corners both their shares, and the corner into the
// way from the point before (pre) counts on the leg out of it. The zigzag round a mark at Bokn (legs of 35-40 m, turns of 30-60 degrees)
// is too tight for the 21 m coastal vessel and fine for a 7 m snekke; a single point off a long leg is fine for both. Points in km.
export default function (t){
  const K = t.K, BOAT = K.get('BOAT'), len0 = BOAT.len;
  const P = (x, y) => ({x, y});
  // a long leg east with one point 25 m off it in the middle (a way round a mark): small turns, long legs
  const one = [P(0, 0), [P(0.5, -0.025)], P(1, 0)];
  // a zigzag of 37 m legs turning 30-36 degrees (Bokn's way round, 14.11.2026)
  const zz = [P(0, 0), [P(0.037, 0), P(0.069, 0.0185), P(0.1, 0)], P(0.137, 0)];
  // a right angle with a 30 m leg before it, the corner into the way at a from pre
  const pre = P(-0.2, 0), sq = [P(0, 0), [P(0.03, 0), P(0.03, 0.2)], P(0.03, 0.4)];
  try {
    BOAT.len = 21;
    t.eq(K.obsTurnable(...one), true, 'obsTurnable: ett punkt 25 m til siden av en legg på 1 km går for kystbåten (21 m)');
    t.eq(K.obsTurnable(...zz), false, 'obsTurnable: sikksakken av 37 m legger rundt merket ved Bokn går ikke for kystbåten (21 m)');
    t.eq(K.obsTurnable(...sq), false, 'obsTurnable: rett vinkel 30 m etter starten går ikke for kystbåten');
    BOAT.len = 7;
    t.eq(K.obsTurnable(...zz), true, 'obsTurnable: den samme sikksakken går for en snekke (7 m)');
    t.eq(K.obsTurnable(...sq), true, 'obsTurnable: den rette vinkelen 30 m etter starten går for en snekke');
    // the corner at a, coming from pre: a turn of 90 degrees at a with a 20 m leg out of it does not fit 21 m, does without pre
    BOAT.len = 21; const w = [P(0, 0), [P(0, 0.02)], P(0.4, 0.02)];
    t.eq([K.obsTurnable(...w), K.obsTurnable(...w, P(-0.3, 0))], [false, false], 'obsTurnable: rett vinkel på en 20 m legg går ikke, med eller uten punktet før');
    const w2 = [P(0, 0), [P(0.05, 0)], P(0.6, 0.01)];
    t.eq([K.obsTurnable(...w2), K.obsTurnable(...w2, P(0, -0.3))], [true, false], 'obsTurnable: svingen inn ved a fra punktet før (90 grader) teller på leggen ut av den (50 m mot 63 m)');
  } finally { BOAT.len = len0; }
}
