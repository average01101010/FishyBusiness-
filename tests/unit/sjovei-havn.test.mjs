// Autonav in a harbour (core/05e-sjovei.js sjvEval, sjvAuto; steg 126 AS1, 14.11.2026): in a harbour no one turns for another, but she
// takes the way off for a vessel under way closing on her (rule 8 e), and stops when it is within two limits. At Sørarnøy the ferry on
// her way in to her quay at 10 knots ran into the coastal vessel on the way in to the plant past it (tests/allesteder.py, Givær). Before,
// nothing happened in a harbour. She stops only where lying still lets the other pass clear (the independent check, 14.11.2026).
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), SJV = K.get('SJV'), PORTS = K.get('PORTS'), KN = K.get('KN_MS'), keep = {};
  for (const k of ['sjvLive', 'farvLook', 'sjvNarrow']) keep[k] = K.get(k);
  K.set('sjvLive', () => true); K.set('farvLook', () => {}); K.set('sjvNarrow', () => false);
  try {
    const q = PORTS.find(p => !p.havOnly), b = S.boat, H = S.t / 60;
    // she on Autonav 200 m south of the harbour's point, heading north at 5 knots; the ferry 400 m north of her coming south at 10
    b.status = 'sailing'; b.type = 'kyst21'; b.pos = {x:q.p.x, y:q.p.y + 0.2}; b.heading = 0; b.v = 5;
    S.plan = {wps:[{x:q.p.x, y:q.p.y - 1, port:null}], idx:0, speed:9};
    const fer = d => ({id:'ferje:test', name:'MF Prøve', type:'ferry', cls:'pow', p:{x:q.p.x + 0.01, y:q.p.y + 0.2 - d}, hd:Math.PI, cog:Math.PI, v:10, L:64, B:13.4, T:3.1});
    t.ok(K.inHarbour(b.pos), 'i havna: 200 m fra havnepunktet');
    SJV.own = null; K.sjvEval(H, [fer(0.4)]);
    t.ok(!!(SJV.own && SJV.own.harb && SJV.own.t1 == null), 'sjvEval: i havn tar Autonav farten av for ferja som kommer mot henne 400 m unna');
    const sa = K.sjvAuto({u:5 * KN, X:b.pos.x * 1000, Y:b.pos.y * 1000, psi:0}, 0.2, 500, null);
    t.ok(!!sa && sa.v <= 1, 'sjvAuto: farten ned til 1 m/s mens ferja er 400 m unna (fikk ' + (sa && sa.v) + ')');
    K.sjvEval(H + 0.002, [fer(0.2)]);
    const sb = K.sjvAuto({u:1, X:b.pos.x * 1000, Y:b.pos.y * 1000, psi:0}, 0.2, 500, null);
    t.ok(!!SJV.own && !SJV.own.stop && sb.v === 1, 'sjvAuto: ferja går rett mot der hun er: hun stopper ikke i veien for den, men holder sakte fart (fikk ' + sb.v + ')');
    // a ferry crossing ahead of her from the east, 250 m north of her, 300 m east: lying still she lets it pass ahead clear of the limit
    SJV.own = null; SJV.sits.clear(); const cross = {id:'ferje:kryss', name:'MF Kryss', type:'ferry', cls:'pow', p:{x:q.p.x + 0.3, y:q.p.y + 0.2 - 0.25}, hd:-Math.PI / 2, cog:-Math.PI / 2, v:10, L:64, B:13.4, T:3.1};
    K.sjvEval(H + 0.003, [cross]);
    const sc = K.sjvAuto({u:2.5, X:b.pos.x * 1000, Y:b.pos.y * 1000, psi:0}, 0.2, 500, null);
    t.ok(!!SJV.own && SJV.own.harb && SJV.own.stop && sc.v === 0, 'sjvAuto: en ferje som krysser foran henne innen to grenser: hun stopper, og den går klar foran (fikk ' + (sc && sc.v) + ')');
    // the ferry lies still at her quay: on again
    const lie = Object.assign({}, cross, {v:0}); K.sjvEval(H + 0.004, [lie]);
    t.ok(!SJV.own || SJV.own.t1 != null, 'sjvEval: ligger ferja stille, går hun videre');
    // not when she lies at the quay herself (no warnings in port, colregtest)
    SJV.own = null; b.status = 'port'; b.port = q.id; S.plan = null; K.sjvEval(H + 0.006, [fer(0.4)]);
    t.ok(!SJV.own && !SJV.warn, 'sjvEval: ikke når hun ligger i havn selv');
  } finally { for (const k in keep) K.set(k, keep[k]); SJV.own = null; SJV.warn = null; SJV.E.clear(); SJV.sits.clear(); }
}
