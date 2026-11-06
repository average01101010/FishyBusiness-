// The walk along a leg (core/11-route.js legRunsWalk, legRuns): a leg whose end is not a number (NaN, or endless) has no length to
// walk, and the walk must end at once. Before 06.11.2026 W.s never reached L then, and legRuns (with no time limit) held the page for
// good: one of the endless loops found while looking for the start that locked on Adrian's phone (ui/11-boot.js BOOTG). Seen red: with
// the guard taken out, the run below never ends (`timeout 20 node tests/unit/run.mjs legruns` stops it).
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const W =(p, q) => K.legRunsW(p, q, 5);
  for (const [nm, p, q] of [['NaN i starten', {x:NaN, y:1}, {x:2, y:2}], ['NaN i enden', {x:1, y:1}, {x:2, y:NaN}], ['uendelig enden', {x:1, y:1}, {x:Infinity, y:2}]]){
    const w = W(p, q);
    t.eq(K.legRunsWalk(w, Infinity), true, 'en etappe uten endelig lengde er ferdig med en gang (' + nm + ')');
    t.ok(Array.isArray(K.legRuns(p, q, 5)), 'legRuns svarer for den samme etappen (' + nm + ')');
  }
  // an ordinary short leg is answered as before (under LEGOPEN.min it is one piece, without the walk)
  const r = K.legRuns({x:1, y:1}, {x:1.2, y:1}, 5);
  t.eq(r.length === 1 && r[0][0] === 0 && Math.abs(r[0][1] - 0.2) < 1e-9, true, 'en kort etappe er ett stykke som før');
}
