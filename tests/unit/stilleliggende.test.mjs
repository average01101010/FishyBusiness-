// What the review of steg 126 AS1 found (14.11.2026), each checked here:
// - Autonav steers round a vessel lying still at her quay (16b-dyn.js dynAvoid): sjvNear (05e-sjovei.js) keeps those it does not meet as
//   vessels, the moored and the anchored, in a list of their own (s), and the look counts as fresh on the views' clock (the minute and the
//   part of it gone), not on the whole minute alone, which was fresh only in the first ten game seconds of each.
// - The closest point with a ferry lying at her quay (colregSit's dock) is marked dk: she cannot open it on her way, so the one under way does.
// - quayOut with all: NaN unless every sample along the face has the fine coast in, so siteOut never keeps a half answer.
// - ferjeDock: the point at the end of a leg, kept per leg and length.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const R = Math.PI / 180, NM = K.NM, S = K.get('S'), SJV = K.get('SJV');
  const keep = {npcStates:K.get('npcStates'), helmOn:K.get('helmOn'), obsIndex:K.get('obsIndex'), coastSdIf:K.get('coastSdIf'), atRoute:K.get('atRoute')};
  try {
    // colregSit: dk with the quay on her line, not without it
    const V = (x, y, hd, v, o = {}) => Object.assign({p:{x, y}, hd:hd * R, cog:hd * R, v, cls:'pow', L:21}, o);
    const a = V(0, 0, 0, 7), tq = 1 / (10 * NM);
    t.ok(K.colregSit(a, V(1, -1, 270, 10, {L:64, dock:{x:0, y:-1, t:tq}})).dk === true, 'colregSit: CPA-en med ferja ved kaia er merket dk');
    t.ok(!K.colregSit(a, V(1, -1, 270, 10, {L:64})).dk, 'colregSit: uten kaia er den ikke merket');
    // a ferry passing her on the same way, faster, 100 m ahead and 30 m to port, to lie at a quay 1 km ahead right on her line: without the
    // quay they draw apart (no risk); with it the closest is with the ferry lying there
    const ov = V(-0.03, -0.1, 0, 12, {L:64}), tqo = 0.9 / (12 * NM);
    t.ok(!K.colregSit(a, ov).risk, 'colregSit: ferja som går forbi i samme retning, er ingen fare uten kaia');
    const ovd = K.colregSit(a, Object.assign({}, ov, {dock:{x:0, y:-1, t:tqo}}));
    t.ok(ovd.dk && ovd.risk && ovd.cpa < 5, 'colregSit: med kaia rett forut på linja hennes er det en fare, ved kaia', [ovd.dk, ovd.risk, Math.round(ovd.cpa)]);

    // sjvNear: the ferry lying at her quay in s under Autonav, the one under way in v
    S.boat.pos = {x:500, y:500}; S.cur = S.cur || 'b0';
    const ferry = {id:'f1', type:'ferry', p:{x:500, y:499.95}, hd:0, v:0, L:64, B:14};
    const boat = {id:'n1', type:'fish', p:{x:500.05, y:500}, hd:Math.PI, v:6, L:12, B:4, cls:'pow'};
    K.set('npcStates', () => [ferry, boat]); K.set('helmOn', () => false); K.set('obsIndex', () => new Map());
    SJV.tl = null;
    const T = K.sjvNear(10, 500000, 500000);
    t.ok(T.s && T.s.length === 1 && T.s[0].n === ferry, 'sjvNear: ferja som ligger ved kaia, er i lista over de som ligger stille', T.s && T.s.length);
    t.ok(T.v.length === 1 && T.v[0].n === boat, 'sjvNear: båten i fart er i lista over fartøyene', T.v.length);

    // dynAvoid: steers round her when the look was made late in the minute (liveFrac 0.9)
    S.t = 600; const G = K.get('globalThis'); G.liveFrac = () => 0.9;   // (the views' part of the minute: ui/04, not in the core)
    SJV.tl = {vid:S.cur, H:(600 + 0.9) / 60, X:500000, Z:500000, v:[], f:[], g:[],
      s:[{n:ferry, x:500000, z:499950, ve:0, vz:0, hd:Math.PI / 2, L:64, B:14, m:1}]};
    const av = K.dynAvoid({X:500000, Y:500000, psi:0, u:3}, {L:21, B:6});
    t.ok(av && av.n === 1, 'dynAvoid: ferja som ligger stille på linja 50 m forut, styres rundt (blikket tatt sent i minuttet)', av);
    SJV.tl.H = (600 + 0.9) / 60 - 60 / 3600;
    t.ok(K.dynAvoid({X:500000, Y:500000, psi:0, u:3}, {L:21, B:6}) === null, 'dynAvoid: et blikk ett spillminutt gammelt brukes ikke');
    SJV.tl = null;

    // quayOut: with all, NaN when one sample has no fine coast; without, the samples that have it
    const f = {x:0, z:0, ux:0, uz:1, nx:-1, nz:0};
    K.set('coastSdIf', p => p.y * 1000 > 5 ? NaN : -50);   // (deep water where the coast is in)
    t.ok(Number.isNaN(K.quayOut(f, 0, 15, true)), 'quayOut: med all er svaret ukjent når ett punkt langs fronten mangler kysten');
    t.eq(K.quayOut(f, 0, 15), 0, 'quayOut: uten all svarer den fra punktene som har kysten (som før)');

    // ferjeDock: the end of the leg, worked out once per leg and length
    let calls = 0; K.set('atRoute', (Rt, s) => { calls++; return {p:{x:s, y:0}, hd:0}; });
    const leg = {len:2};
    const q1 = K.ferjeDock(leg, 0.04), q2 = K.ferjeDock(leg, 0.04), q3 = K.ferjeDock(leg, 0.05);
    t.ok(q1 === q2 && calls === 2 && Math.abs(q1.x - 1.96) < 1e-12 && Math.abs(q3.x - 1.95) < 1e-12, 'ferjeDock: punktet ved kaia regnes én gang per legg og lengde', calls);
  } finally { for (const k in keep) K.set(k, keep[k]); SJV.tl = null; delete K.get('globalThis').liveFrac; }
}
