// From joints to bone turns (Folk 2, FB7, steg 125): figFromJoints in src/js/figpose.js on the skeleton of src/data/folk2.b64.
// Checked for both bodies: the wrists and the ankles that come out of figPose stand where they were asked for within 1 cm when the
// limb reaches, the elbow and the knee are on the side asked for, the limbs keep the skeleton's lengths, the elbow and the knee bend
// as hinges the right way (the forearm's own turn is about the elbow's axis, forward; the shin's about the knee's, back) within
// extras.limits, the back's bones keep their limits with the back bent 60 degrees and turned 23, a hand out of reach is pointed at,
// the arms hang at least 13 degrees out from the body at rest, and the hand's rest frame is a right-handed one with the thumb to
// the right side. Seen red 13.11.2026 with the elbow's hinge the wrong way round ([-1, 0, 0] for [1, 0, 0] in figFromJoints: the
// arm rolled half round, so the elbow bent backwards in the mesh): the hinge checks FEIL for both bodies.
export const scripts = ['js/figpose.js', 'js/vessel3d.js'];
export const data = true;

export default function (t){
  const K = t.K, G = K.glbLoad('folk2'), X = G.ex, D = Math.PI / 180;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = v => Math.hypot(v[0], v[1], v[2]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const sex of ['m', 'f']){
    const sk = K.figSkel(X, sex), LN = K.figLens(sk), jt = (P, n) => { const i = sk.ix[n]; return [P.J[i * 3], P.J[i * 3 + 1], P.J[i * 3 + 2]]; };
    t.ok(LN.ua > 0.24 && LN.ua < 0.33 && LN.fa > 0.22 && LN.fa < 0.3 && LN.th > 0.38 && LN.th < 0.47 && LN.sn > 0.38 && LN.sn < 0.45, sex + ': the skeleton\'s lengths are a person\'s (ua ' + LN.ua.toFixed(3) + ', fa ' + LN.fa.toFixed(3) + ', th ' + LN.th.toFixed(3) + ', sn ' + LN.sn.toFixed(3) + ' m)');
    // the poses: [name, bend deg, twist deg, pelvis, right wrist, right elbow side, left wrist, left elbow side, right ankle, left ankle]
    const hipY = LN.hip, shY = LN.hip + LN.sh[0];
    const POS = [
      ['standing, the hands low before him', 0, 0, [0, hipY, 0], [0.2, 0.95, -0.2], [0.3, 1.1, 0.1], [-0.2, 0.95, -0.2], [-0.3, 1.1, 0.1], [0.1, LN.ankle, 0], [-0.1, LN.ankle, 0]],
      ['bent 40 over the rail, the hands out', 40, 0, [0, hipY - 0.03, 0], [0.18, 0.9, -0.5], [0.3, 1.0, -0.2], [-0.18, 0.9, -0.5], [-0.3, 1.0, -0.2], [0.11, LN.ankle, 0.05], [-0.11, LN.ankle, 0.05]],
      ['turned 20 with a hand at the mouth', 5, 20, [0, hipY, 0], [0.05, 1.5, -0.14], [0.3, 1.2, -0.05], [-0.25, 0.9, -0.05], [-0.3, 1.1, 0.1], [0.1, LN.ankle, 0], [-0.1, LN.ankle, 0]],
      ['a stride, bent 60 and turned -23, the hands at the deck', 60, -23, [0, hipY - 0.1, 0], [0.25, 0.8, -0.5], [0.4, 0.9, -0.2], [-0.1, 0.8, -0.55], [-0.35, 0.8, -0.2], [0.1, LN.ankle, -0.3], [-0.1, LN.ankle + 0.05, 0.3]],
      ['seated, the hands on the knees', 8, 0, [0, 0.5, 0], [0.16, 0.6, -0.36], [0.3, 0.8, -0.05], [-0.16, 0.6, -0.36], [-0.3, 0.8, -0.05], [0.17, LN.ankle, -0.44], [-0.17, LN.ankle, -0.44]]];
    let wW = 0, wA = 0, wL = 0, side = 0, hingeBad = 0, flexBad = 0, spineBad = 0, n = 0;
    for (const [nm, bend, twist, pelvis, wr, er, wl, eL, fr, fl] of POS){
      const chest = K.figMul3(K.figRot([-1, 0, 0], bend), K.figRot([0, 1, 0], twist));
      const J = {pelvis, chestR:chest, headR:K.FIG_I3, arms:{R:{wr, el:er}, L:{wr:wl, el:eL}}, legs:{R:{foot:fr, knee:[fr[0], 0.5, fr[2] - 0.6]}, L:{foot:fl, knee:[fl[0], 0.5, fl[2] - 0.6]}}};
      const o = K.figFromJoints(sk, J), P = K.figPose(sk, o.local, o.root);
      for (const sd of ['R', 'L']){ n++;
        const S = jt(P, 'uarm_' + sd), E = jt(P, 'farm_' + sd), W = jt(P, 'hand_' + sd), tg = J.arms[sd].wr, ep = J.arms[sd].el, H = jt(P, 'thigh_' + sd), Kn = jt(P, 'shin_' + sd), F = jt(P, 'foot_' + sd), ft = J.legs[sd].foot;
        wW = Math.max(wW, len(sub(W, tg))); wA = Math.max(wA, len(sub(F, ft)));
        wL = Math.max(wL, Math.abs(len(sub(E, S)) - LN.ua), Math.abs(len(sub(W, E)) - LN.fa), Math.abs(len(sub(Kn, H)) - LN.th), Math.abs(len(sub(F, Kn)) - LN.sn));
        wW = Math.max(wW, len(sub(o.out.wr[sd], W)), len(sub(o.out.el[sd], E)));   // (the joints the function says are the ones figPose gives)
        // the knee ahead of the line from the hip to the ankle (z back: ahead is -z)
        const mid = [(H[0] + F[0]) / 2, (H[1] + F[1]) / 2, (H[2] + F[2]) / 2]; if (Kn[2] - mid[2] > -0.005 && len(sub(H, F)) < (LN.th + LN.sn) * 0.99) side++;
        // the hinges: the forearm's own turn is about the elbow's axis at rest (x, square to the upper arm) by 0 to 150 degrees, the shin's about -x
        for (const [up, lo, end, hx, lim] of [['uarm_', 'farm_', 'hand_', 1, X.limits.farm.flex], ['thigh_', 'shin_', 'foot_', -1, X.limits.shin.flex]]){
          const r = b => sk.rest[sk.ix[b + sd]], d1 = sub(r(lo), r(up)), d2 = sub(r(end), r(lo)), l1 = len(d1), dn = d1.map(v => v / l1);
          // (the arm rests bent, in its own plane: the elbow's axis is that plane's, and its bend is the rest's and the bone's own turn)
          const hg = hx > 0 ? [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]] : [-1, 0, 0], k = dot(hg, dn), h0 = [hg[0] - k * dn[0], hg[1] - k * dn[1], hg[2] - k * dn[2]], hl = len(h0);
          const rest = hx > 0 ? Math.acos(dot(d1, d2) / (l1 * len(d2))) / D : 0, a = K.figAxis(o.local[lo + sd]), c = dot(a.ax, h0) / hl, flex = rest + a.deg * Math.sign(c);
          if (a.deg > 8 && Math.abs(c) < 0.9) hingeBad++; if (flex < lim[0] - 1 || flex > lim[1] + 1) flexBad++; }
      }
      // the spine's bones within their limits (flex is the turn about -x, twist about y)
      for (const b of ['spine1', 'spine2', 'spine3']){ const R = o.local[b], tw = K.figTwist(R, [0, 1, 0]), fx = K.figTwist(R, [-1, 0, 0]), lm = X.limits[b];
        if (tw < lm.twist[0] - 0.5 || tw > lm.twist[1] + 0.5 || fx < lm.flex[0] - 0.5 || fx > lm.flex[1] + 0.5) spineBad++; }
      // the chest is the one asked for
      let dc = 0; const Rc = P.R[sk.ix.spine3]; for (let i = 0; i < 9; i++) dc = Math.max(dc, Math.abs(Rc[i] - chest[i])); if (dc > 1e-6) spineBad++;
    }
    t.near(wW, 0, 0.01, sex + ': the wrists stand where they were asked for (largest miss over ' + n + ' arms, m)');
    t.near(wA, 0, 0.01, sex + ': the ankles stand where they were asked for (m)');
    t.near(wL, 0, 1e-6, sex + ': the limbs keep the skeleton\'s lengths (m)');
    t.eq(side, 0, sex + ': every bent knee is ahead of the leg\'s line');
    t.eq(hingeBad, 0, sex + ': the elbows bend forward and the knees back, as hinges (the lower bone\'s own turn is about the joint\'s axis)');
    t.eq(flexBad, 0, sex + ': the elbows\' and the knees\' bend within extras.limits');
    t.eq(spineBad, 0, sex + ': the back\'s bones within extras.limits, and the chest turned as asked');
    // out of reach: the arm points at the hand's point
    { const tg = [1.2, shY, -1.0], o = K.figFromJoints(sk, {pelvis:[0, hipY, 0], arms:{R:{wr:tg, el:[0.5, 1.0, 0]}}}), P = K.figPose(sk, o.local, o.root), S = jt(P, 'uarm_R'), W = jt(P, 'hand_R'), a = sub(W, S), b = sub(tg, S);
      t.ok(dot(a, b) / (len(a) * len(b)) > 0.9999 && len(a) < LN.ua + LN.fa && o.out.over.R > 0.5, sex + ': a hand out of reach is pointed at, the arm not stretched'); }
    // at rest the arms hang at least 13 degrees out: the hands where drawWorker has them standing (0.26 m out, 0.82 m up; the wrist a hand's length over that)
    { const J = {pelvis:[0, hipY, 0], arms:{R:{wr:[0.26, 0.905, 0], el:[0.3, 1.15, 0.1]}, L:{wr:[-0.26, 0.905, 0], el:[-0.3, 1.15, 0.1]}}}, o = K.figFromJoints(sk, J), P = K.figPose(sk, o.local, o.root);
      for (const [sd, sg] of [['R', 1], ['L', -1]]){ const u = sub(jt(P, 'farm_' + sd), jt(P, 'uarm_' + sd)), deg = Math.atan2(sg * u[0], -u[1]) / D;
        t.ok(deg >= 12.9, sex + ' ' + sd + ': the upper arm hangs at least 13 degrees out at rest (' + deg.toFixed(1) + ')');
        t.near(len(sub(jt(P, 'hand_' + sd), J.arms[sd].wr)), 0, 0.01, sex + ' ' + sd + ': and the wrist is still where it was asked for (m)'); } }
    // the hands' rest frames: right-handed, the fingers down, the right thumb (at -x) and the left (at +x) ahead
    for (const sd of ['R', 'L']){ const H = K.figHandRest(X, sex, sd), x = [H[0], H[3], H[6]], y = [H[1], H[4], H[7]], z = [H[2], H[5], H[8]], c = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
      const th = sub(sk.rest[sk.ix['thumb3_' + sd]], sk.rest[sk.ix['hand_' + sd]]), sx = sd === 'R' ? -1 : 1;
      t.ok(len(sub(c, x)) < 1e-6 && z[1] < -0.9 && sx * dot(th, x) > 0.02 && (sd === 'R' ? y[0] < -0.5 : y[0] > 0.5), sex + ' ' + sd + ': the hand\'s rest frame (x = y × z, the fingers down, the palm in, the thumb at ' + (sx < 0 ? '-x' : '+x') + ')');
      const g = K.figGripAt(X, sex, 'grip', sd); t.ok(g.at[2] > 0.05 && Math.abs(g.at[1]) < 0.03 && Math.abs(Math.abs(g.ax[0]) - 1) < 1e-3, sex + ' ' + sd + ': the fist holds ahead of the wrist, its handle along x (' + g.at.map(v => v.toFixed(3)).join(', ') + ')'); }
  }
}
