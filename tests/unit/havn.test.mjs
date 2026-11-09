// Little fish inside a harbour (Ø8b S3, docs/planer/spillbarhet-fangst.md V5 B, 09.11.2026; core/03-simulation.js denPlace, HARBF,
// harbourNote): the harbour basin (inHarbour, core/01-world.js: 600 m from the harbour point, 350 m from the way in) holds a tenth of the
// fish the place would give, for every species and every reader of density, and the first time a boat fishes there, one line in the log.
// Node has no map, so the sea is made up here as in felt.test.mjs: water everywhere, a depth of 40-200 m and an exposure that vary.
const HOUR = (y, m, d, h) => (Date.UTC(y, m - 1, d, h) - Date.UTC(2027, 2, 1, 6)) / 3.6e6;

export default function (t){
  const K = t.K;
  K.set('S', K.newState());
  const keep = {}; for (const n of ['isLand', 'isLandFar', 'depthF', 'offDepth', 'expoFar']) keep[n] = K.get(n);
  const sea = p => 40 + 160 * K.noise2(p.x / 6, p.y / 6, 3);
  K.set('isLand', () => false); K.set('isLandFar', () => false); K.set('depthF', sea); K.set('offDepth', sea); K.set('expoFar', p => 60 + 150 * K.noise2(p.x / 9, p.y / 9, 4));
  try {
    // a harbour along the coast with no other harbour within 3 km, and a point 1.2 km from it outside every basin
    const PORTS = K.get('PORTS'), far = pt => PORTS.every(o => o === pt || !o.p || Math.hypot(o.p.x - pt.p.x, o.p.y - pt.p.y) > 3);
    const pt = PORTS.find(q => q.coastal && q.mottak && q.p && far(q)) || PORTS.find(q => q.p && far(q));
    t.ok(!!pt, `en havn uten andre havner innen 3 km (${pt ? pt.name : 'ingen'})`); if (!pt) return;
    const pin = {x:pt.p.x + 0.25, y:pt.p.y + 0.1};
    let pout = null; for (let a = 0; a < 16 && !pout; a++){ const q = {x:pt.p.x + Math.cos(a / 8 * Math.PI) * 1.2, y:pt.p.y + Math.sin(a / 8 * Math.PI) * 1.2}; if (!K.inHarbour(q)) pout = q; }
    t.ok(K.inHarbour(pin) && !!pout, `inHarbour: 270 m fra havnepunktet i ${pt.name} er inne i bassenget, 1,2 km unna er ute`);
    // 1. the place: the basin carries a tenth (q.h), outside nothing
    const qi = K.denPlace(pin), qo = K.denPlace(pout);
    let hf; try { hf = K.get('HARBF'); } catch (e){ hf = undefined; }
    t.eq(hf, 0.1, 'havnebassenget gir ×0,1 (HARBF)');
    t.ok(qi && qi.h === 0.1 && qo && qo.h === 1, `denPlace: h ${qi && qi.h} i bassenget og ${qo && qo.h} utenfor`);
    // 2. density: every species of the jig and the shellfish a tenth of what the same place gives without the basin, in March and July
    let worst = 0, n = 0;
    for (const H of [HOUR(2027, 3, 15, 10), HOUR(2027, 7, 15, 10)]){ const T = K.denTime(H);
      for (const sp of K.SP.concat(K.get('SHELL'))){ const tb = K.tutBonus(sp, pin), a = K.density(sp, pin, H) - tb, b = K.denSp(sp, Object.assign({}, qi, {h:1}), H, T) - tb;   // (the first trip's patch is not the place's)
        if (b > 1e-9){ worst = Math.max(worst, Math.abs(a / b - 0.1)); n++; } } }
    t.ok(n > 10 && worst < 1e-9, `density i bassenget er 0,1 av det samme stedet uten bassenget for ${n} art-måneder (største avvik ${worst.toExponential(1)})`);
    const H0 = HOUR(2027, 3, 15, 10), ro = K.density('torsk', pout, H0), rq = K.denSp('torsk', Object.assign({}, qo, {h:1}), H0, K.denTime(H0));
    t.ok(ro > 0 && Math.abs(ro / rq - 1) < 1e-12, `utenfor bassenget er torsken den samme som før (${ro.toFixed(4)})`);
    // 3. the line in the log: once per boat, the first time she fishes in a basin, not outside
    const S = K.get('S'); K.ensureFleet(); const b = S.boat, L0 = S.log.length, note = K.harbourNote || (() => {});
    b.status = 'fishing'; b.pos = {x:pout.x, y:pout.y}; note();
    t.eq(S.log.length, L0, 'ingen linje når båten fisker utenfor bassenget');
    b.pos = {x:pin.x, y:pin.y}; note(); const ln = S.log[S.log.length - 1];
    t.ok(S.log.length === L0 + 1 && ln.no === 'Inne i havna står det lite fisk.' && ln.en === 'Little fish stands inside the harbour.', `første gang i bassenget: «${ln && ln.no}» / «${ln && ln.en}»`);
    note(); b.status = 'port'; b.harbN = 0; note();
    t.eq(S.log.length, L0 + 1, 'linja kommer bare én gang, og ikke når båten ligger i havn');
  } finally { for (const n in keep) K.set(n, keep[n]); }
}
