// The limbs keep their length (FB2, steg 123, 13.11.2026; deckcrew.js ik2, armIk, reachBody, legDrop, LEMMER): the upper arm, the
// forearm, the thigh and the shin are as long in every pose, the elbow and the knee are on the side they should be, a hand out of
// reach takes the back and the torso with it within their limits, and a foot out of reach lowers the hips.
export const scripts = ['js/deckcrew.js'];
export default function (t){
  const {ik2, armIk, armHand, reachBody, legDrop, torsoPt, torsoInv, limbLen, LEMMER:C} = t.K, L = limbLen(null);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, rv = s => [(rnd() - 0.5) * 2 * s, (rnd() - 0.5) * 2 * s, (rnd() - 0.5) * 2 * s];

  // 1. the two parts keep their length whatever the target, the end is the target within reach and at the reach beyond it
  let wl = 0, wt = 0, wo = 0, side = 0, n = 0;
  for (let i = 0; i < 4000; i++){ const R = rv(1), T = [R[0] + rv(0.8)[0], R[1] + rv(0.8)[1], R[2] + rv(0.8)[2]], L1 = 0.25 + rnd() * 0.2, L2 = 0.25 + rnd() * 0.2, pole = rv(1), o = ik2(R, T, L1, L2, pole), D = dist(R, T), max = (L1 + L2) * C.REACH;
    wl = Math.max(wl, Math.abs(dist(R, o.j) - L1), Math.abs(dist(o.j, o.e) - L2));
    if (D <= max && D >= Math.abs(L1 - L2) + 1e-3) wt = Math.max(wt, dist(o.e, T)); else if (D > max){ wo = Math.max(wo, Math.abs(dist(R, o.e) - max), Math.abs(o.over - (D - max))); n++; }
    // (the joint off the limb's own line, against the pole square to that line)
    const u = [(o.e[0] - R[0]) / o.d, (o.e[1] - R[1]) / o.d, (o.e[2] - R[2]) / o.d], kj = dot([o.j[0] - R[0], o.j[1] - R[1], o.j[2] - R[2]], u), kp = dot(pole, u);
    if (dot([o.j[0] - R[0] - u[0] * kj, o.j[1] - R[1] - u[1] * kj, o.j[2] - R[2] - u[2] * kj], [pole[0] - u[0] * kp, pole[1] - u[1] * kp, pole[2] - u[2] * kp]) < -1e-9) side++; }
  t.ok(wl < 1e-9, 'begge delene holder lengden sin for 4000 tilfeldige mål (verst ' + wl.toExponential(1) + ' m)');
  t.ok(wt < 1e-9, 'enden er i målet når det er innen rekkevidde (verst ' + wt.toExponential(1) + ' m)');
  t.ok(n > 300 && wo < 1e-9, 'utenfor rekkevidde stopper enden på rekkevidden, på vei mot målet, og «over» er det som mangler (' + n + ' tilfeller)');
  t.ok(side === 0, 'leddet ligger alltid på den sida polen peker');
  { const o = ik2([0, 0, 0], [0, 0, 0], 0.3, 0.3, [0, -1, 0]); t.ok(Number.isFinite(o.j[0] + o.j[1] + o.j[2]) && Math.abs(dist([0, 0, 0], o.j) - 0.3) < 1e-9, 'et mål i selve roten gir fortsatt et ledd i riktig avstand'); }

  // 2. the skiff's skipper (armTo before): the same elbow and hand as its own reckoning gave, segment 0.31
  { let w = 0; for (let i = 0; i < 500; i++){ const Sw = rv(1), Hw = [Sw[0] + rv(0.7)[0], Sw[1] + rv(0.7)[1], Sw[2] + rv(0.7)[2]], sd = i % 2 ? 1 : -1, seg = 0.31;
      const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), Lc = Math.min(Lh, 2 * seg * 0.995);
      let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
      const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
      const o = ik2(Sw, Hw, seg, seg, [0, -1, sd * 0.5]); w = Math.max(w, dist(o.j, E), dist(o.e, Hc)); }
    t.ok(w < 1e-9, 'skipperens arm (armTo) får samme albue og hånd som regnestykket den hadde (verst ' + w.toExponential(1) + ' m)'); }

  // 3. the body goes after the hand: nothing when both reach, the back bends for a hand out ahead, the torso turns for one out to
  // the side, the limits hold, and what is left is reported
  const SH = [[0, C.SH[0], C.SH[1]], [0, C.SH[0], -C.SH[1]]], reach = (L.ua + L.fa) * C.REACH, missOf = (tg, b0, r) => Math.max(...[0, 1].map(i => tg[i] ? dist(tg[i], torsoPt(SH[i], b0 + r.b, r.t)) - reach : -1));
  { const r = reachBody(SH, [[0.3, 0.2, 0.2], [0.3, 0.2, -0.2]], reach, 0); t.ok(r.b === 0 && r.t === 0 && r.over === 0, 'begge hendene når: kroppen står som den sto'); }
  { const tg = [[0.72, 0.3, 0.2], [0.72, 0.3, -0.2]], r = reachBody(SH, tg, reach, 0); t.ok(r.b > 0.1 && Math.abs(r.t) < 0.02 && missOf(tg, 0, r) < 2e-3, 'begge hendene 10 cm for langt fram: ryggen bøyes (' + (r.b * 57.3).toFixed(1) + '°), og hendene når'); }
  { const tg = [[0.62, 0.45, -0.1], null], r = reachBody(SH, tg, reach, 0); t.ok(r.t < -0.01 && r.b > 0.05 && missOf(tg, 0, r) < 2e-3, 'høyre hånd for langt fram og over mot venstre: ryggen bøyes mest, og overkroppen vris litt med høyre skulder fram (' + (r.t * 57.3).toFixed(1) + '°) og bøyes (' + (r.b * 57.3).toFixed(1) + '°), og hånda når'); }
  { const tg = [[1.6, 0.2, 0.2], null], r = reachBody(SH, tg, reach, 0.2); t.ok(r.b <= C.BEND + 1e-9 && Math.abs(r.t) <= C.TWIST + 1e-9 && r.over > 0.25, 'et mål langt utenfor: grensene holder (bøy ' + (r.b * 57.3).toFixed(0) + '°, vri ' + (r.t * 57.3).toFixed(0) + '°), og resten (' + r.over.toFixed(2) + ' m) meldes'); }
  { let prev = null, step = 0; for (let k = 0; k <= 100; k++){ const x = 0.4 + k * 0.005, r = reachBody(SH, [[x, 0.25, 0.3], [0.3, 0.3, -0.2]], reach, 0.1); if (prev) step = Math.max(step, Math.abs(r.b - prev.b), Math.abs(r.t - prev.t)); prev = {b:r.b, t:r.t}; }
    t.ok(step < 0.03, 'et mål som flyttes jevnt utover, tar kroppen jevnt med seg (største sprang ' + (step * 57.3).toFixed(2) + '° per 5 mm)'); }

  // 4. the arm in the torso's frame: the lengths, and the elbow never in the torso (hands all over in front of him, across the chest
  // and down by the sides)
  { let wl2 = 0, inside = 0, back = 0, m = 0; const box = j => Math.abs(j[2]) < 0.17 && Math.abs(j[0]) < 0.1 && j[1] > 0 && j[1] < 0.5;
    for (const sd of [1, -1]) for (let a = -0.1; a <= 0.6; a += 0.05) for (let u = -0.2; u <= 1.0; u += 0.05) for (let r = -0.4; r <= 0.6; r += 0.05){ const s = [0, C.SH[0], sd * C.SH[1]], tg = [a, u, sd * r];
      // (a hand in the torso, behind it on the other side, or further off than the arm reaches is not a pose the elbow can answer for)
      if ((r < 0.2 && a < 0.15 && u > -0.1 && u < 0.6) || (r < 0 && a < 0.15) || dist(s, tg) > (L.ua + L.fa) * 0.97) continue;
      const o = armIk(s, tg, sd, L); m++; wl2 = Math.max(wl2, Math.abs(dist(s, o.j) - L.ua), Math.abs(dist(o.j, o.e) - L.fa)); if (box(o.j)){ inside++; if (process.env.LEMDBG) console.log(tg.map(v => v.toFixed(2)).join(','), '->', o.j.map(v => v.toFixed(2)).join(',')); } if (o.j[1] > C.SH[0] + 0.25 && u < 0.4) back++; }
    t.ok(wl2 < 1e-9, 'armen holder lengdene for ' + m + ' håndstillinger foran kroppen');
    t.ok(inside === 0, 'albuen er aldri inne i overkroppen (' + inside + ' av ' + m + ')');
    t.ok(back === 0, 'albuen er aldri løftet over skulderen når hånda er lavt (' + back + ')');
    const x = armIk([0, C.SH[0], C.SH[1]], [0.17, 0.26, 0.02], 1, L); t.ok(x.j[2] >= C.CLEAR - 0.02 && x.j[1] < 0.35, 'armene i kors (håndleddet foran magen): albuen ute ved sida og ned (' + x.j.map(v => v.toFixed(2)).join(', ') + ')'); }

  // 4b. a hand up at the face (the cup, the binoculars) or over the head: the elbow under it, not behind him; the torso's frame there
  // and back; and the arm to a hand's point: the wrist a hand's length short of it along the forearm
  { const s0 = [0, C.SH[0], C.SH[1]], face = armIk(s0, [0.1, 0.62, 0.1], 1, L), up = armIk(s0, [0.2, 0.78, 0.36], 1, L), low = armIk(s0, [0.05, -0.02, 0.26], 1, L);
    t.ok(face.j[0] > -0.03 && face.j[1] < 0.5, 'hånda oppe ved ansiktet: albuen under den, ikke bak ryggen (' + face.j.map(v => v.toFixed(2)).join(', ') + ')');
    t.ok(up.j[1] < up.e[1] - 0.15 && up.j[0] > -0.05, 'armen løftet: albuen under hånda (' + up.j.map(v => v.toFixed(2)).join(', ') + ')');
    t.ok(low.j[0] < 0, 'hånda ned langs sida: albuen litt bak (' + low.j.map(v => v.toFixed(2)).join(', ') + ')');
    let w = 0; for (let i = 0; i < 200; i++){ const q = rv(0.6), b = rnd() - 0.3, tw = rnd() - 0.5, r = torsoInv(torsoPt(q, b, tw), b, tw); w = Math.max(w, dist(q, r)); } t.ok(w < 1e-12, 'torsoInv er det omvendte av torsoPt');
    let wl3 = 0, wh = 0, n3 = 0; for (let a = 0.1; a <= 0.5; a += 0.1) for (let u = -0.1; u <= 0.7; u += 0.1) for (const r of [0.05, 0.25, 0.45]){ const hd = [a, u, r], o = armHand(s0, hd, 1, L); wl3 = Math.max(wl3, Math.abs(dist(s0, o.j) - L.ua), Math.abs(dist(o.j, o.e) - L.fa)); if (!(o.over > 0 || o.near > 0 || o.push > 0)){ n3++; wh = Math.max(wh, Math.abs(dist(o.e, hd) - C.HAND)); } }
    t.ok(wl3 < 1e-9 && n3 > 60 && wh < 1e-9, 'armHand: lengdene holder, og håndleddet er en håndlengde fra det hånda holder (' + n3 + ' stillinger innen rekkevidde)'); }

  // 5. the legs: standing nothing, the stride lowers the hips, never more than DROP; the knee ahead
  { const hips = [[0, 0.92, -0.11], [0, 0.92, 0.11]], st = legDrop(hips, [[0, 0.08, -0.12], [0, 0.08, 0.12]], L), wk = legDrop(hips, [[0.28, 0.08, -0.12], [-0.28, 0.08, 0.12]], L), far = legDrop(hips, [[0.9, 0.08, -0.12], [0, 0.08, 0.12]], L);
    t.ok(st === 0, 'stående rekker beina dekket uten at hofta senkes'); t.ok(wk > 0.02 && wk <= C.DROP, 'i fullt steg (28 cm fram og bak) senkes hofta ' + (wk * 100).toFixed(1) + ' cm'); t.eq(far, C.DROP, 'aldri mer enn DROP');
    const o = ik2(hips[0], [0, 0.08, -0.12], L.th, L.sn, [C.KNEE[0], C.KNEE[1], 0]); t.ok(o.j[0] > 0.03 && o.over === 0, 'kneet peker fram (' + (o.j[0] * 100).toFixed(1) + ' cm foran linja hofte–ankel stående)'); }
}
