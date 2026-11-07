// The other players' boats between their reports (core/05-vessels.js PTRK, ptPred, ptTake, ptPose; 02.11.2026): carried on along
// the heading at the reported speed, turning as between the last two reports, slowing to a stop when no report comes, and eased onto a
// new report with no jump (a big gap is jumped).
export default function (t){
  const {ptPred, ptTake, ptPose, PTRK, NM, GAME_RATE, PT_MAX, PT_SNAP, newState, peerRouteStr, peerRoute, routeWalk} = t.K;
  t.K.set('S', newState());
  const spd = 8 * NM * GAME_RATE / 3600;   // km per real second at 8 kn
  const q0 = {id:'a', x:10, y:20, hd:Math.PI / 2, v:8, st:'sailing', at:0};
  // straight: east at 8 kn
  let P = ptPred(q0, 0, 10); t.near(P.x, 10 + spd * 10, 1e-9, 'rett fram: 10 s østover med farten'); t.near(P.y, 20, 1e-9, 'rett fram: ingen sideforskyvning');
  // lying still or fishing: where she was reported
  P = ptPred({...q0, st:'fishing'}, 0, 20); t.eq([P.x, P.y], [10, 20], 'fisker: blir liggende');
  // no reports: she slows to a stop, never runs on for ever
  const far = ptPred(q0, 0, 600).x - 10, at35 = ptPred(q0, 0, PT_MAX).x - 10;
  t.ok(far > at35 && far < at35 + spd * 10.01, 'uten rapporter stopper båten mykt etter ' + PT_MAX + ' s');
  t.ok(ptPred(q0, 0, 300).x - ptPred(q0, 0, 299).x < spd * 0.01, 'etter fem minutter står hun nesten stille');
  // turning: the heading changes by at most w × 6 s, and she curves the way she turns
  P = ptPred(q0, 0.05, 30); t.ok(P.hd > q0.hd && P.hd - q0.hd <= 0.05 * 6 + 1e-9, 'svingen dør ut (høyst w · 6 s)'); t.ok(P.y > 20, 'svinger til styrbord (sørover fra øst)');
  // a new report: no jump at the moment it is taken, and on the new track after the blend
  PTRK.clear();
  ptTake(q0, 0);
  const before = ptPose(PTRK.get('a'), 15000);
  const q1 = {...q0, x:10 + spd * 15 + 0.12, y:20.05, at:15000};   // 120 m ahead and 50 m south of where she was carried to
  const T = ptTake(q1, 15000), after = ptPose(T, 15000);
  t.near(after.x, before.x, 1e-9, 'ny rapport: ingen hopp østover'); t.near(after.y, before.y, 1e-9, 'ny rapport: ingen hopp sørover');
  const dur = T.off.dur, mid = ptPose(T, 15000 + dur / 2), end = ptPose(T, 15000 + dur + 1), tr = ptPred(q1, T.w, (dur + 1) / 1000);
  t.ok(mid.y > before.y - 1e-9 && mid.y < 20.05, 'halvveis i overgangen mellom gammelt og nytt spor');
  t.near(end.y, 20.05, 1e-9, 'etter overgangen på det nye sporet'); t.near(end.x, tr.x, 1e-9, 'etter overgangen der den nye rapporten sier');
  // the same report again (her page is hidden): nothing changes
  const T2 = ptTake({...q1, at:15400}, 20000); t.eq(T2.q.at, 15000, 'samme rapport igjen: sporet står');
  // a gap of more than PT_SNAP km is jumped
  PTRK.clear(); ptTake(q0, 0); const T3 = ptTake({...q0, x:10 + PT_SNAP + 1, at:15000}, 15000); t.eq(T3.off, null, 'stort sprang (slept, ny start): hopper');
  // the turn rate from two reports
  PTRK.clear(); ptTake(q0, 0); const T4 = ptTake({...q0, hd:q0.hd + 0.3, at:10000}, 10000); t.near(T4.w, 0.03, 1e-9, 'svingraten fra to rapporter');
  // the route (03.11.2026): sent from the leg she is on up to the first stop, and where it puts her is where she is drawn
  const wps = [{x:11, y:20}, {x:11, y:21}, {x:12, y:21, fish:1}, {x:13, y:21}];
  t.eq(peerRouteStr({x:10, y:20}, wps, 1), '11.0000,21.0000;12.0000,21.0000', 'ruta fra etappen hun er på til første stopp (fiskeplassen)');
  t.eq(peerRoute('11,20;<b>'), null, 'en rute som ikke er tall, blir ikke brukt');
  const R = peerRoute(peerRouteStr({x:10, y:20}, wps, 0));
  let W = routeWalk({x:10, y:20}, R, 1.5, 0); t.near(W.x, 11, 1e-9, 'langs ruta: rundt hjørnet (x)'); t.near(W.y, 20.5, 1e-9, 'langs ruta: rundt hjørnet (y)'); t.near(W.hd, Math.PI, 1e-9, 'langs ruta: kursen er etappens (sør)');
  W = routeWalk({x:10, y:20}, R, 99, 0); t.eq([W.x, W.y], [12, 21], 'langs ruta: stopper ved første stopp');
  const qr = {id:'r', x:10, y:20, hd:Math.PI / 2, v:8, st:'sailing', at:0, rt:'11,20;11,21'}, d60 = spd * 60;
  P = ptPred(qr, 0, 60); t.near(P.x, 11, 1e-9, 'med rute: følger ruta etter hjørnet, ikke kursen (x)'); t.near(P.y, 20 + d60 - 1, 1e-9, 'med rute: følger ruta etter hjørnet (y)');
  P = ptPred(qr, 0, 100); t.ok(P.y > 20 + d60 - 1, 'med rute: ingen oppbremsing etter ' + PT_MAX + ' s (ruta er kjent)');
  PTRK.clear();
}
