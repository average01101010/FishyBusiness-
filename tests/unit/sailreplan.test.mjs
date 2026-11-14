// The way round shallow water ahead (core/05-vessels.js sailReplan; steg 126 AS1, 14.11.2026): three tries a leg at most, counted per
// route. Before, the count was keyed only by the leg's index and the route's length («2|5»), so a new route whose leg had the same
// index and length as the last tries of the route before began at three, and the first shallow water on it stopped her at once with
// «Autonav fant ingen trygg vei rundt» (tests/allesteder.py: a place that was red after the one before it and green alone).
export default function (t){
  const K = t.K, SAIL_RP = K.get('SAIL_RP'), keep = K.get('leiaRoute');
  K.set('S', K.newState());
  K.set('leiaRoute', () => new Promise(() => {}));   // (the search never answers here: what is tested is whether she tries)
  const S = K.get('S'), b = S.boat; b.pos = {x:300, y:1300}; b.status = 'sailing';
  const route = () => ({wps:[{x:300.5, y:1300, port:null}, {x:301, y:1300, port:null}], idx:0, speed:7});
  try {
    // the route before: three tries on its first leg, the third the last it was allowed
    const A = route(); S.plan = A;
    for (let i = 0; i < 3; i++){ A.replan = null; t.eq(K.sailReplan(A, b, {x:300, y:1300}), true, 'sailReplan: forsøk ' + (i + 1) + ' på den første ruta holder henne og leter'); }
    t.ok(!!A.replan, 'sailReplan: det tredje forsøket på samme legg leter fortsatt');
    A.replan = null; K.sailReplan(A, b, {x:300, y:1300});
    t.eq(S.plan, null, 'sailReplan: det fjerde forsøket på samme legg stopper henne (tre forsøk per legg)');
    // a new route, the same leg index and length
    const B = route(); S.plan = B; b.status = 'sailing';
    t.eq(K.sailReplan(B, b, {x:300, y:1300}), true, 'sailReplan: en ny rute holder henne ved grunna');
    t.ok(S.plan === B && !!B.replan, 'sailReplan: en ny rute med samme legg og lengde begynner på null forsøk og leter etter en vei rundt');
    t.eq(SAIL_RP.n, 1, 'sailReplan: telleren for den nye ruta er 1 etter det første forsøket');
    // ways round that are each found and put points in (the leg's count begins again) but lead back onto the ground: eight to one point
    const C = route(); S.plan = C; b.status = 'sailing'; let stopped = -1;
    for (let i = 0; i < 12 && stopped < 0; i++){ C.replan = null; K.sailReplan(C, b, {x:300, y:1300}); if (S.plan !== C){ stopped = i + 1; break; } C.wps.splice(C.idx, 0, {x:300.2, y:1300, port:null, leia:true, obs:true}); }
    t.eq(stopped, 9, 'sailReplan: veier rundt som hver legger inn punkter, men fører henne tilbake på grunna: det niende forsøket mot samme punkt stopper henne');
  } finally { K.set('leiaRoute', keep); SAIL_RP.n = 0; SAIL_RP.at = ''; SAIL_RP.pl = null; SAIL_RP.wait = 0; }
}
