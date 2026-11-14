// A sharp corner by a mark (core/16b-dyn.js dynTight; steg 126 AS1, 14.11.2026, Jonas: the hands as the last way out): a corner whose
// legs pass a mark, a pile or a pier within two lengths, half the beam and 4 m (the first five lengths of the leg out, the last two of the
// leg in) is one the hands take her round. Stamsund's mark stood 40 m off the leg out, 84 m on, for the 21 m coastal vessel. A line of
// points in metres (national frame), a mark put into the obstacles' index as a chart pack's mark (km).
export default function (t){
  const K = t.K, BOAT = K.get('BOAT'), keep = {len:BOAT.len, beam:BOAT.beam};
  K.set('S', K.newState());
  const MARKS = K.get('MARKS'), ready = K.get('mapReadyAt');
  K.set('mapReadyAt', () => false);
  // a corner of 90 degrees at (300 000, 1 300 000) m: in from the west, out to the south (y grows southward)
  const X = 300000, Z = 1300000, T = {P:[[X - 500, Z], [X, Z], [X, Z + 500]]}, c = {i:1, s:500, th:Math.PI / 2};
  const put = (dx, dz) => { MARKS.tiles.set('t', {k:'t', tx:0, ty:0, lights:[], rocks:[], marks:[[(X + dx) / 1000, (Z + dz) / 1000, 'L', 'port']]}); MARKS.ver++; };
  try {
    BOAT.len = 21; BOAT.beam = 7;
    put(-40, 84); t.eq(K.dynTight(T, c), true, 'dynTight: merket 40 m av leggen ut, 84 m inn på den (Stamsund), gjør hjørnet trangt for kystbåten');
    put(-80, 84); t.eq(K.dynTight(T, c), false, 'dynTight: et merke 80 m av leggen ut gjør ikke hjørnet trangt');
    put(-10, 200); t.eq(K.dynTight(T, c), false, 'dynTight: et merke langt ut på leggen ut (200 m, 95 m forbi fem lengder) teller ikke');
    put(-30, -25); t.eq(K.dynTight(T, c), true, 'dynTight: et merke ved leggen inn, 30 m før hjørnet, teller');
    BOAT.len = 7; BOAT.beam = 2.5; put(-40, 84); t.eq(K.dynTight(T, c), false, 'dynTight: det samme merket gjør ikke hjørnet trangt for en snekke (7 m)');
  } finally { BOAT.len = keep.len; BOAT.beam = keep.beam; MARKS.tiles.delete('t'); MARKS.ver++; K.set('mapReadyAt', ready); }
}
