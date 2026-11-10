// The hull in the sea, buoyancy per section (Fysikk 4 F2, docs/planer/fysikk-4-sjo-og-skrog.md; core/03c-stability.js hullSections,
// hullRest, hullStep). Heave and pitch in 3D are reckoned from forces: the hull is cut in sections along its length, each with its
// breadth and draft from a parametric form of VESSELS (the waterplane Cwp L B and the volume Cb L B T of hullOf), buoyancy rho g times the
// drowned area of each, added mass 0.8 in heave and pitch, damping as wave making. Checked here: the volume against the displacement, the
// floating level in still water, the free periods against stabOf's Tz, the bow that buries (the buoyancy saturates), the slam when the
// bow section re-enters the water fast, and the planing hulls' lift from the speed (simplified Savitsky) against the old fixed trim.
export default function (t){
  const K = t.K, g = 9.81, RHO = 1.025;
  const TYPES = ['skiff', 'trebat', 'snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21', 'autoliner', 'snokrabbe', 'bunntral', 'pelagisk', 'ringnot38'];
  const empty = {hold:0, deck:0, gear:0};
  // free decay from an offset in calm water: the period from the zero crossings, and the amplitude left after two periods
  const decay = (type, what, x0, o = {}) => {
    const H = K.hullSections(type), St = K.stabOf(type, empty), R = K.hullRest(H, St.D), X = K.hullX(R), eta = new Float64Array(H.n), dt = 1 / 120;
    if (what === 'y') X.yg += x0; else X.th += x0;
    const rec = []; for (let i = 0; i < 120 * 12; i++){ K.hullStep(H, R, X, eta, null, dt, o); rec.push(what === 'y' ? X.y - R.y0 : X.th - R.th0); }
    // (the first full swing: the tail, a hundredth of the start, is the heave and pitch trading what is left between them)
    const cross = []; for (let i = 1; i < rec.length; i++) if (rec[i - 1] < 0 !== rec[i] < 0 && rec[i - 1] !== 0) cross.push(i);
    const T = cross.length > 2 ? (cross[2] - cross[0]) * dt : NaN;
    return {T, Tz:St.Tz, rec, X, R, H};
  };

  // ---- the sections: the volume and the waterplane as hullOf has them ----
  for (const type of TYPES){
    const h = K.hullOf(type), H = K.hullSections(type);
    t.ok(H && H.n >= 7 && H.n <= 9, type + ': 7–9 snitt langs skroget');
    t.near(H.V * RHO / h.disp, 1, 0.1, type + ': volumet under vannlinja er deplasementet (' + (H.V * RHO).toFixed(1) + ' t av ' + h.disp + ')');
    t.near(H.Awp / h.Awp, 1, 0.1, type + ': vannlinjearealet er Cwp·L·B');
    t.ok(H.W.every((w, i) => w > 0 && w <= h.B + 1e-9 && H.Bd[i] >= w - 1e-9 && H.Bd[i] <= h.B + 1e-9), type + ': bredden i vannlinja og ved dekk innenfor bredden');
  }
  // the sections follow the 3D model's own ends when they are given (GEO's bow and stern), and the volume stays
  { const H = K.hullSections('sjark', -5, 5.5), h = K.hullOf('sjark'); t.near(H.V * RHO / h.disp, 1, 0.1, 'sjark med modellens ender: volumet står');
    t.ok(H.z[0] > -5 && H.z[H.n - 1] < 5.5 && H.z[0] < H.z[H.n - 1], 'snittene ligger fra baugen (−z) til hekken'); }

  // ---- floating in still water: level, at the design waterline (the model's origin 0.06 m above it), deeper with a load ----
  for (const type of TYPES){
    const H = K.hullSections(type), R = K.hullRest(H, K.stabOf(type, empty).D);
    t.near(R.y0, 0.06, 0.05, type + ': ligger på samme dypgang som før i stille vann (± 5 cm)');
    t.near(R.th0, 0, 0.002, type + ': ligger på rett kjøl i stille vann');
  }
  { const H = K.hullSections('sjark'), St0 = K.stabOf('sjark', empty), St = K.stabOf('sjark', {hold:4000, deck:0, gear:0}), R = K.hullRest(H, St.D);
    t.near(0.06 - R.y0, St.T - St0.T, 0.03, 'sjark med 4 t i rommet: synker like mye som stabiliteten regner (' + (0.06 - R.y0).toFixed(3) + ' m)'); }

  // ---- the free periods in calm water: stabOf's Tz ± 15 % (heave let go from 0.3 m, pitch from 1.5°) ----
  for (const type of ['skiff', 'trebat', 'sjark', 'hurtigsjark', 'kyst21', 'bunntral']){
    const D = decay(type, 'y', 0.3), P = decay(type, 'th', 1.5 * Math.PI / 180);
    t.near(D.T / D.Tz, 1, 0.15, type + ': hiver med egenperioden Tz (' + D.T.toFixed(2) + ' s mot ' + D.Tz.toFixed(2) + ')');
    t.near(P.T / P.Tz, 1, 0.15, type + ': stamper med egenperioden Tz (' + P.T.toFixed(2) + ' s mot ' + P.Tz.toFixed(2) + ')');
    const tail = D.rec.slice(-240).reduce((a, v) => Math.max(a, Math.abs(v)), 0);
    t.ok(tail < 0.01, type + ': hivet dør ut (dempet som bølgedannelse): ' + (tail * 100).toFixed(2) + ' cm etter 10 s');
  }

  // ---- the bow buries: a section wholly under gives no more (the buoyancy saturates) ----
  { const H = K.hullSections('sjark'), i = 0, top = H.d[i] + H.f[i];
    t.near(K.secArea(H, i, top + 2), K.secArea(H, i, top), 1e-9, 'baugsnittet helt under vann gir ikke mer oppdrift');
    t.ok(K.secArea(H, i, 0) === 0 && K.secArea(H, i, -1) === 0, 'et snitt over vannet gir ingen oppdrift');
    t.ok(K.secArea(H, i, top) > K.secArea(H, i, H.d[i]) * 1.5, 'baugen har reserveoppdrift over vannlinja (spring og utfall)'); }

  // ---- the slam: the bow section out of the water and back in at a relative speed over 0.2 sqrt(g L) (about 2 m/s for the sjark) ----
  { const H = K.hullSections('sjark'), R = K.hullRest(H, K.stabOf('sjark', empty).D), vth = K.hullSlamV(H);
    t.near(vth, 2, 0.15, 'sjark: slaggrensen er rundt 2 m/s (' + vth.toFixed(2) + ')');
    const drop = v => { const X = K.hullX(R), eta = new Float64Array(H.n), deta = new Float64Array(H.n); X.th = 0.12; X.vth = -v / Math.abs(H.z[0] - R.zG); X.yg = R.y0 + 0.1;   // bow up out of the water, coming down
      let slam = 0; for (let i = 0; i < 240; i++){ slam = Math.max(slam, K.hullStep(H, R, X, eta, deta, 1 / 120)); } return slam; };
    const hard = drop(3.5), soft = drop(0.8);
    t.ok(hard > 1, 'baugen ned i sjøen i 3,5 m/s gir et slag (' + hard.toFixed(2) + ' av grensen)');
    t.ok(soft === 0, 'baugen ned i 0,8 m/s gir ikke slag'); }

  // ---- planing: the dynamic lift from the speed (simplified Savitsky) instead of the fixed trim; she rises and trims a few degrees ----
  for (const [type, kn] of [['skiff', 24], ['hurtigsjark', 22]]){   // (the new speed sjark is a displacement hull at 12 kn since OB10)
    const H = K.hullSections(type), R = K.hullRest(H, K.stabOf(type, empty).D), X = K.hullX(R), eta = new Float64Array(H.n), V = kn * 0.5144, Fr = V / Math.sqrt(g * K.VESSELS[type].len);
    for (let i = 0; i < 120 * 20; i++) K.hullStep(H, R, X, eta, null, 1 / 120, {V, Fr, planing:true});
    const deg = (X.th - R.th0) * 180 / Math.PI, rise = X.y - R.y0;
    t.ok(deg > 1.5 && deg < 6, type + ' i ' + kn + ' kn på planet: trimmet ' + deg.toFixed(1) + '° (2–5° som på bildene fra 04.11.2026)');
    t.ok(rise > 0.01 * H.L * 0.5 && rise < 0.06 * H.L, type + ' i ' + kn + ' kn: løftet ' + (rise * 100).toFixed(0) + ' cm av farten');
    t.ok(Math.abs(X.vy) < 0.02 && Math.abs(X.vth) < 0.005, type + ' i ' + kn + ' kn: ligger roleg på planet (ingen hopping)');
  }
  // ---- she never sinks: ten times her displacement aboard, more than she carries with the deck awash, she lies deep and stays there ----
  { const H = K.hullSections('sjark'), R = K.hullRest(H, 10 * K.hullOf('sjark').disp), X = K.hullX(R), eta = new Float64Array(H.n);
    for (let i = 0; i < 120 * 10; i++) K.hullStep(H, R, X, eta, null, 1 / 120);
    t.ok([R.y0, R.zG, R.zF, R.K33, R.K55].every(Number.isFinite) && Number.isFinite(X.y) && X.y > -(H.d[4] + H.f[4]) && Math.abs(X.vy) < 0.05, 'sjark med ti ganger deplasementet om bord (mer enn hun bærer med dekket i vannet): synker ikke, ligger dypt og roleg (' + X.y.toFixed(2) + ' m)'); }
  // ---- a planing hull off a crest, the transom out of the water: no lift, she falls ----
  { const H = K.hullSections('skiff'), R = K.hullRest(H, K.stabOf('skiff', empty).D), X = K.hullX(R), eta = new Float64Array(H.n), V = 24 * 0.5144;
    X.yg = R.y0 + 1.5; X.th = 0.05; for (let i = 0; i < H.n; i++) X.h[i] = -1; K.hullStep(H, R, X, eta, null, 1 / 120, {V, Fr:V / Math.sqrt(g * 5.9), planing:true});
    t.near(X.vy, -g / 1.8 / 120, 1e-6, 'skiffen i lufta i 24 kn: ingen planingsløft, hun faller (tyngden over massen med tilleggsmassen)'); }
  // a displacement hull at her hull speed: the bow up about a degree and a little squat, as before
  { const type = 'sjark', H = K.hullSections(type), R = K.hullRest(H, K.stabOf(type, empty).D), X = K.hullX(R), eta = new Float64Array(H.n), V = 10 * 0.5144, Fr = V / Math.sqrt(g * K.VESSELS[type].len);
    for (let i = 0; i < 120 * 20; i++) K.hullStep(H, R, X, eta, null, 1 / 120, {V, Fr, planing:false});
    const deg = (X.th - R.th0) * 180 / Math.PI; t.ok(deg > 0.5 && deg < 1.5 && X.y < R.y0, 'sjark i 10 kn: baugen opp ' + deg.toFixed(2) + '° og litt nedsynking (' + ((X.y - R.y0) * 100).toFixed(1) + ' cm)'); }
}
