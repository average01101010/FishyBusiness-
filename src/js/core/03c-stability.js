// ===== STABILITY: hydrostatics, the boat's motions in a sea, and what they do to the work aboard =====
// Hydrostatics from VESSELS (len, beam, draft, disp). The draft there is the deepest point; the hull's mean draft is what gives a block
// coefficient of at least 0.35. Waterplane Cwp = (1 + 2 Cb) / 3, KB = T (5/6 - Cb / (3 Cwp)) (Normand), BM = Cwp^2 B^2 / (11.75 Cb T) (Murray).
// The centre of gravity: an open boat or a sjark sits low (KG a share of the depth), a larger boat is built to about GM = 0.09 B + 0.3 m;
// the stiffer of the two. Freeboard 0.35 + 0.035 L (at most 2.5 m), and the deck edge goes under at atan(2 f / B).
// Roll period after IMO's weather criterion (IS Code 2008, 2.3): T = 2 C B / sqrt(GM), C = 0.373 + 0.023 B/d - 0.043 L/100 (B/d at most 3.5,
// as the formula was fitted). Heave and pitch: T = 2 pi sqrt(Cb T (1 + 0.8) / (g Cwp)) (the water that moves with the hull, 0.8 of it).
// IMO's minimum for fishing vessels with one deck: GM 0.35 m (IS Code part B, 2.1). Icing is not modelled (Jonas' choice 02.10.2026).
const STAB_W = {potBig:25, potSno:16, net:9, tub:25, kit:6};   // kg aboard per pot (with its rope), net, line tub, jig kit (the conical snow crab pot 14.5 kg with its share of the string, H3a)
const STAB_C = new Map();
function hullOf(type){
  let h = STAB_C.get(type); if (h) return h;
  const V = VESSELS[type] || VESSELS.skiff, L = V.len, B = V.beam, D0 = V.disp, Tmax = V.draft;
  const T = Math.min(Tmax, D0 / (1.025 * L * B * 0.35)), Cb = clamp(D0 / (1.025 * L * B * T), 0.35, 0.75), Cwp = (1 + 2 * Cb) / 3;
  const KB = T * (5 / 6 - Cb / (3 * Cwp)), BM = Cwp * Cwp * B * B / (11.75 * Cb * T), f = Math.min(2.5, 0.35 + 0.035 * L), Dp = T + f;
  const KGlow = (L < 7 ? 0.62 : 0.78) * Dp + (L >= 7 ? 0.25 : 0), GM0 = Math.max(KB + BM - KGlow, 0.09 * B + 0.3);
  h = {L, B, T, Cb, Cwp, Awp:Cwp * L * B, KB, BM, f, Dp, KG:KB + BM - GM0, GM:GM0, disp:D0, decked:L >= 7};
  STAB_C.set(type, h); return h;
}
// what is aboard: the catch low in the hold (on the floor of an open boat), tubs waiting on deck, and gear on deck
function stabLoad(b = S.boat){
  const pg = S.pgear || {}, pots = pg.pots || {}, lines = pg.lines || {}, nets = (pg.nets || []).reduce((a, n) => a + n.n, 0);
  const gear = (pots.big || 0) * STAB_W.potBig + (pots.sno || 0) * STAB_W.potSno + nets * STAB_W.net + ((lines.hyse || {}).n || 0) * STAB_W.tub + ((lines.bank || {}).n || 0) * STAB_W.tub + ((pg.kits || {}).n || 0) * STAB_W.kit;
  const hold = (typeof holdLoad === 'function' ? holdLoad() : 0) + (typeof hullWaterKg === 'function' ? hullWaterKg(b) : 0), deck = typeof deckPending === 'function' ? deckPending() : 0;
  return {hold, deck, gear};
}
// the boat as loaded: draft, metacentric height, roll, heave and pitch periods, the deck edge angle
function stabOf(type = S.boat.type, load = stabLoad()){
  const h = hullOf(type), w = (load.hold + load.deck + load.gear) / 1000, D = h.disp + w;
  // the sides flare, so the waterplane grows as she settles and BM falls slower than 1/displacement (KM stays about the same)
  const T = h.T + w / (1.025 * h.Awp), KB = h.KB * T / h.T, BM = h.BM * Math.pow(h.disp / D, 0.4);
  const KG = (h.disp * h.KG + load.hold / 1000 * (h.decked ? 0.4 : 0.3) * h.Dp + (load.deck + load.gear) / 1000 * (h.Dp + 0.8)) / D;   // gear stacked on deck: its middle 0.8 m up
  const GM = KB + BM - KG, f = Math.max(0.1, h.f - (T - h.T)), C = 0.373 + 0.023 * Math.min(3.5, h.B / T) - 0.043 * h.L / 100;
  return {GM, KG, T, f, D, Tr:2 * C * h.B / Math.sqrt(Math.max(GM, 0.04)), Tz:2 * Math.PI * Math.sqrt(h.Cb * T * 1.8 / (9.81 * h.Cwp)), deckEdge:Math.atan(2 * f / h.B), L:h.L, B:h.B, decked:h.decked};
}
// The motions in this sea, for the work and the warnings (significant amplitudes). Each wave system (wind sea and swell) is met at the
// encounter frequency we = |w - k v cos m| (m: the waves' heading against the boat's). Roll answers the wave slope pi Hs / lambda across the
// boat as a damped oscillator at its natural period (damping 0.12 of critical for a spread sea): resonance when the encounter period meets
// the roll period. Heave and pitch follow waves longer than the hull and average out shorter ones; the vertical acceleration is taken a
// third of the length forward of the middle, where the work is. Wind heels the boat steadily: 0.5 rho U^2 1.2 on the side above water.
function motionAt(p, H, head, kn, St = stabOf()){
  const q = hsParts(p, H), v = (kn || 0) * 0.5144, wr = 2 * Math.PI / St.Tr, g = gridGamma(p), sys = [[q.w, q.tp, q.dir - g], [q.sw, q.swTp, q.swDir - g]];   // the headings are on the grid, the seas' directions true
  let r2 = 0, a2 = 0, res = 0, rmax = 0;
  for (const [hs, tp, from] of sys){
    if (!(hs > 0.02) || !(tp > 0.3)) continue;
    const w = 2 * Math.PI / tp, k = w * w / 9.81, lam = 2 * Math.PI / k, m = (from + 180) * Math.PI / 180 - head;
    const we = Math.max(0.05, Math.abs(w - k * v * Math.cos(m))), x = we / wr, mag = 1 / Math.sqrt((1 - x * x) ** 2 + (0.24 * x) ** 2);
    const roll = Math.PI * hs / lam * Math.abs(Math.sin(m)) / (1 + 4 * (St.B / lam) ** 2) * mag;
    const fL = 1 / (1 + (k * St.L * Math.abs(Math.cos(m)) / Math.PI) ** 2), heave = we * we * hs / 2 * fL, pitch = we * we * (Math.PI * hs / lam) * fL * Math.abs(Math.cos(m)) * St.L / 3;
    r2 += roll * roll; a2 += heave * heave + pitch * pitch; if (roll > rmax){ rmax = roll; res = x; }
  }
  return {roll:Math.min(0.9, Math.sqrt(r2)), heel:windHeel(St, windAt(H, p)), av:Math.sqrt(a2), res, GM:St.GM, Tr:St.Tr, deckEdge:St.deckEdge};
}
// the steady heel from a beam wind: the pressure 0.5 rho U^2 1.2 on the side above water, its lever over the weight and GM
function windHeel(St, U){ const A = St.L * (St.f + (St.decked ? 1.4 : 0.15)), Z = St.T / 2 + St.f / 2 + (St.decked ? 0.9 : 0.1), lw = 0.5 * 1.25 * U * U * 1.2 * A * Z / (St.D * 1000 * 9.81); return Math.atan(lw / Math.max(St.GM, 0.04)); }
// how steady she is: 0 good, 1 reduced (rank below IMO's 0.35 m, or rolling to 60 % of the deck edge), 2 critical (GM under 0.15 m, or
// rolling to 90 % of the deck edge), with the reason
function stabState(M){
  // (when she is tender, that is the reason to tell: too much on deck is what can be done something about)
  const r = (M.roll + M.heel) / M.deckEdge, lvl = M.GM < 0.15 || r > 0.9 ? 2 : M.GM < 0.35 || r > 0.6 ? 1 : 0;
  return {lvl, why:!lvl ? '' : M.GM < 0.35 ? 'gm' : M.res > 0.75 && M.res < 1.3 ? 'res' : 'roll'};
}
// The work aboard feels the motions, not the wave height as such: the height is scaled by how much this boat moves here, against how much
// it would move drifting beam-on to the same sea with nothing aboard. So the year's work keeps its calibration, and course, speed, load
// and resonance tell. 1 m/s^2 of vertical acceleration counts as much as 10 degrees of roll. A boat with no way on lies beam-on.
const motionIdx = M => M.av + 0.1 * M.roll * 180 / Math.PI;
function boatHead(H, b = S.boat){ const kn = b.status === 'sailing' ? b.v || 0 : 0; return {kn, head:kn > 0.5 ? b.heading || 0 : (windDir(H, b.pos) - gridGamma(b.pos) + 90) * Math.PI / 180}; }
let MW_MEMO = {k:'', v:null};
function motionHere(H, b = S.boat){
  const {kn, head} = boatHead(H, b), L = stabLoad(b), k = b.type + '|' + b.pos.x + '|' + b.pos.y + '|' + H + '|' + kn + '|' + head + '|' + L.hold + '|' + L.deck + '|' + L.gear;
  if (MW_MEMO.k === k && !WX_FORCE) return MW_MEMO.v;
  const St = stabOf(b.type, L), M = motionAt(b.pos, H, head, kn, St), R = motionAt(b.pos, H, (windDir(H, b.pos) - gridGamma(b.pos) + 90) * Math.PI / 180, 0, stabOf(b.type, {hold:0, deck:0, gear:0}));
  const v = {M, St, f:clamp((motionIdx(M) + 0.05) / (motionIdx(R) + 0.05), 0.6, 1.8), state:stabState(M)};
  MW_MEMO = {k, v}; return v;
}
function hsWork(p, H){ const hs = hsAt(p, H), b = S.boat; return b.status === 'port' || p !== b.pos ? hs : hs * motionHere(H, b).f; }
// the boat lies still or works gear: no course or speed to change
const stabStill = b => b.status !== 'sailing' || !!b.gop;
// once a minute at sea: warn when she becomes rank with gear on deck, rolls in resonance with the sea, or rolls towards the deck edge
function stabTick(H){
  const b = S.boat, Z = motionHere(H, b), s = Z.state, was = b.stab || 0;
  if (s.lvl > was && S.t >= (b.stabAt || 0)){
    const gm = fmt1(Z.St.GM), tr = fmt1(Z.St.Tr), deg = Math.round((Z.M.roll + Z.M.heel) * 180 / Math.PI);
    const still = stabStill(b);
    const T = {gm:['Båten er ' + (s.lvl > 1 ? 'farlig ' : '') + 'rank: GM ' + gm + ' m (IMO krever minst 0,35 m for fiskefartøy). For mye på dekk. Sett ut eller lever redskap.', 'The boat is ' + (s.lvl > 1 ? 'dangerously ' : '') + 'tender: GM ' + gm + ' m (IMO asks at least 0.35 m for fishing vessels). Too much on deck. Set or land gear.'],
      // lying still or working gear, course and speed are not hers to change (spilltest 3, U6): advice that can be followed
      res:still ? ['Synkronrulling: sjøen treffer i båtens egen rulleperiode (' + tr + ' s), og hun ruller ' + deg + '°. Vent, eller legg baugen mot sjøen når arbeidet er ferdig.', 'Synchronous rolling: the sea meets her own roll period (' + tr + ' s), and she rolls ' + deg + '°. Wait, or put the bow into the sea once the work is done.']
        : ['Synkronrulling: sjøen treffer i båtens egen rulleperiode (' + tr + ' s), og hun ruller ' + deg + '°. Endre kurs eller fart.', 'Synchronous rolling: the sea meets her own roll period (' + tr + ' s), and she rolls ' + deg + '°. Change course or speed.'],
      roll:['Kraftig rulling, ' + deg + '°: rekka går mot vannet. Legg baugen mer mot sjøen eller sakk farten.', 'Heavy rolling, ' + deg + '°: the rail goes towards the water. Put the bow more into the sea or slow down.']}[s.why];
    log(T[0], T[1], 'nav'); b.stabAt = S.t + (still && s.why === 'res' ? 360 : 30);   // lying still: once in six hours, not every hour of the soak
  }
  b.stab = s.lvl;
}
const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', S.lang === 'no' ? ',' : '.');

// ===== THE HULL IN THE SEA: buoyancy per section (Fysikk 4 F2, 07.11.2026; docs/planer/fysikk-4-sjo-og-skrog.md, Jonas' choice 2B) =====
// Heave and pitch in 3D are reckoned from forces, not by following the surface (view3d/16-motion.js updateBoat; «#hull0» gives the old
// following back). The hull is cut in HS_N sections along its waterline, each with a breadth at the waterline W, a draft d, a breadth at
// the deck Bd and a freeboard f, from a parametric form of VESSELS: a fine entrance over the forward 45 % with the forefoot cut up towards
// the stem, full amidships, a transom aft (a planing hull keeps her width there), the sheer rising forward and the sides flaring out to
// the deck. The breadths are scaled so the waterplane is hullOf's Cwp L B, and every section's underwater shape is w(y) = W (y / d)^p
// with p = Awp / (Cb L B) - 1, so the volume is hullOf's Cb L B T, the displacement. Above the waterline the side flares to Bd at the
// deck; with the deck under, a section gives no more (the buoyancy saturates, and the bow buries). The underwater forms are guessed
// (the models from Blender have no sections we can read), so they are calibrated to stabOf's periods, not to drawings (plan, ch. 7).
const HS_N = 9, HS_RHO = 1025, HS_G = 9.81, HS_C = new Map();
function hullSections(type, zb, zs){
  const key = type + '|' + zb + '|' + zs; let H = HS_C.get(key); if (H) return H;
  const h = hullOf(type), V = VESSELS[type] || VESSELS.skiff, L = h.L, B = h.B, pl = !!V.planing;
  if (!(zs > zb)){ zb = -L / 2; zs = L / 2; }
  const Lg = zs - zb, za = zb + 0.04 * Lg, zf = zs - 0.02 * Lg, n = HS_N, dx = (zf - za) / n;
  const z = [], W = [], d = [], Bd = [], f = [];
  for (let i = 0; i < n; i++){
    const s = (i + 0.5) / n;   // 0 at the bow, 1 at the stern
    z.push(za + (i + 0.5) * dx);
    W.push(Math.pow(Math.sin(Math.PI / 2 * Math.min(1, s / 0.45)), 0.9) * (1 - (pl ? 0.08 : 0.25) * sstep(0.65, 1, s)));
    d.push(0.3 + 0.7 * sstep(0, 0.35, s));
    Bd.push(0.45 + 0.55 * sstep(0, 0.3, s));
    f.push(h.f * (1 + 0.6 * (1 - s) * (1 - s)));
  }
  // the waterplane: scaled to Cwp L B, no section wider than the beam (what one cannot take, the others share)
  const want = h.Cwp * L * B; let kw = 1;
  for (let it = 0; it < 6; it++){ let free = 0, full = 0; for (const w of W){ if (w * kw >= B) full += B; else free += w * kw; } if (!free) break; kw *= Math.max(0, want - full * dx) / (free * dx); }
  for (let i = 0; i < n; i++){ W[i] = Math.min(B, W[i] * kw); Bd[i] = Math.max(W[i], Math.min(B, Bd[i] * B)); }
  const sW = W.reduce((a, w) => a + w, 0), Awp = sW * dx, kd = h.T * sW / W.reduce((a, w, i) => a + w * d[i], 0);
  for (let i = 0; i < n; i++) d[i] *= kd;
  const p = Math.max(0, Awp / (h.Cb * L * B) - 1);
  // the longitudinal radius of gyration: as the waterplane's (so pitch has heave's period, as stabOf gives both), within 0.22-0.30 L
  let zF = 0; for (let i = 0; i < n; i++) zF += W[i] * z[i]; zF /= sW;
  let IL = 0; for (let i = 0; i < n; i++) IL += W[i] * ((z[i] - zF) ** 2 + dx * dx / 12);
  const Lw = zf - za, kyy = clamp(Math.sqrt(IL / sW), 0.22 * Lw, 0.3 * Lw);
  H = {key, type, n, z, dx, W, d, Bd, f, p, zc:d.map(v => v / (p + 2)), V:Awp * h.T / (p + 1), Awp, L, B, T:h.T, Lw, zFwd:za, zAft:zf, kyy, planing:pl, bc:Math.max(...W), beta:14, rest:new Map()};
  HS_C.set(key, H); return H;
}
// a section's drowned area (m^2) and its breadth at the water, the keel h metres under the water (W (y/d)^p up to the waterline, the flare
// out to the deck above it, nothing more with the deck under)
function secArea(H, i, h){
  if (!(h > 0)) return 0;
  const W = H.W[i], d = H.d[i], p = H.p; if (h <= d) return W * d / (p + 1) * Math.pow(h / d, p + 1);
  const f = H.f[i], q = Math.min(h - d, f); return W * d / (p + 1) + q * (W + (H.Bd[i] - W) * q / (2 * f));
}
function secBreadth(H, i, h){ if (!(h > 0)) return 0; const d = H.d[i]; if (h <= d) return H.W[i] * Math.pow(h / d, H.p); const f = H.f[i]; return h - d >= f ? 0 : H.W[i] + (H.Bd[i] - H.W[i]) * (h - d) / f; }
// The bow section back into the water from clear of it at a relative speed over this is a slam (Ochi's threshold is 0.093 sqrt(g L); the
// plan's «rundt 2 m/s for sjarken» is 0.2 sqrt(g L): 2.0 m/s for the sjark, 1.5 for the skiff, 2.9 for the 21 m coaster)
const hullSlamV = H => 0.2 * Math.sqrt(HS_G * H.L);
// She floats in still water with D tonnes aboard: the sinkage where the buoyancy carries her, the centre of gravity over the centre of
// buoyancy (level), the stiffness in heave and pitch, the masses with 0.8 added (stabOf's Tz has the same 0.8), and the damping. The model's
// origin is 0.06 m over its design waterline (the old following put her there), so y0 is 0.06 empty and lower with a load.
function hullRest(H, D){
  const key = Math.round(D * 100); let R = H.rest.get(key); if (R) return R;
  const n = H.n, dx = H.dx;
  // (she never sinks, CLAUDE.md: what is aboard is carried with the decks a little over the water at most, so a swamped or overloaded
  // boat lies deep and does not go on down; the stiffness is taken where she floats, a little under the lowest deck)
  let top = 0; for (let i = 0; i < n; i++) top += secArea(H, i, H.d[i] + H.f[i]);
  const m = Math.min(D * 1000, 0.95 * top * dx * HS_RHO), sMax = 0.95 * Math.min(...H.f); let s = 0;
  for (let it = 0; it < 40; it++){
    let F = 0, Fp = 0; for (let i = 0; i < n; i++){ F += secArea(H, i, H.d[i] + s); Fp += secBreadth(H, i, H.d[i] + s); }
    F = F * dx * HS_RHO - m; Fp *= dx * HS_RHO; if (Math.abs(F) < m * 1e-7) break;
    s = clamp(s - F / Math.max(Fp, m * 0.01), -Math.max(...H.d), Math.max(...H.f));
  }
  const sk = Math.min(s, sMax);
  let A = 0, Az = 0, w = 0, wz = 0;
  for (let i = 0; i < n; i++){ const a = secArea(H, i, H.d[i] + s), b = secBreadth(H, i, H.d[i] + sk); A += a; Az += a * H.z[i]; w += b; wz += b * H.z[i]; }
  const zG = A > 0 ? Az / A : 0, zF = w > 0 ? wz / w : zG; let IG = 0; for (let i = 0; i < n; i++) IG += secBreadth(H, i, H.d[i] + sk) * ((H.z[i] - zG) ** 2 + dx * dx / 12);
  const K33 = HS_RHO * HS_G * Math.max(w, 1e-3 * H.Awp / dx) * dx, K55 = HS_RHO * HS_G * Math.max(IG, 1e-3 * H.Awp / dx * H.kyy * H.kyy) * dx, m33 = 1.8 * m, I55 = 1.8 * m * H.kyy * H.kyy;   // (pitch about the centre of gravity)
  R = {D, m, s, y0:0.06 - s, th0:0, zG, zF, K33, K55, m33, I55};
  if (H.rest.size > 16) H.rest.clear(); H.rest.set(key, R); return R;
}
// the state of a hull let go at rest: the origin's height y (m, over the still water), pitch th (bow up), their speeds, and per section
// the keel's depth under the water last step (the slam looks for a section coming back in)
// (she turns about her centre of gravity, yg its height; y follows from it: the model turns about its origin, zG forward or aft of it)
function hullX(R){ return {y:R.y0, yg:R.y0 - Math.sin(R.th0) * R.zG, vy:0, th:R.th0, vth:0, h:new Float64Array(HS_N), t:0, slamT:-9}; }
// One step of dt seconds: eta[i] is the water's height at section i (over the still water, the short sea's pressure already taken down
// with the depth, Smith's e^(-k d)), deta[i] how fast it rises. The force and the moment about the origin from the buoyancy of each
// section about her centre of gravity (the weight is there), damped as wave making (0.3 of critical at rest, more with way on). With way on (o.V, m/s through the
// water, and o.Fr) she lies in her own wave: the water along her is taken down and tilted, the bow wave's crest forward and the trough
// aft, linearised: a displacement hull squats 0.4 % of her length and lifts her bow a degree near her hull speed (Fr 0.35-0.45, as the
// old trim did), a planing hull climbs her bow wave to some 6 degrees over the hump (Fr 0.25-0.7) and leaves it behind on the plane.
// (A fixed moment for the hump, the first try, lifted the skiff's light bow clear of the water and stood her on her transom at 8-12
// knots, 20-40 degrees: her own wave tilts the water instead, and she can trim no further than it.) On the plane she gets the dynamic
// lift of a planing surface, Savitsky's C_L0 = tau^1.1 0.012 sqrt(lambda)
// (the hydrostatic part of his formula is the sections' own), less for the deadrise, at his centre of pressure l_p / (lambda b) =
// 0.75 - 1 / (5.21 Cv^2 / lambda^2 + 2.39) forward of the transom, with the angle of attack the trim less what her own rise takes off it
// (that damps the porpoising), and the bottom's own degree aft (the buttocks rise a little forward of the transom, so she has lift from the
// start). The trim on the plane comes out of where that lift and the buoyancy carry her, not from a fixed number.
// Returns the slam, as a share of the threshold, when a bow section re-entered the water faster than hullSlamV, else 0.
function hullStep(H, R, X, eta, deta, dt, o){
  const n = H.n, c = Math.cos(X.th), sn = Math.sin(X.th), V = (o && o.V) || 0, Fr = (o && o.Fr) || 0, vth = hullSlamV(H), pl = !!(o && o.planing);
  const way = V > 0.5, wt = !way ? 0 : pl ? 0.1 * sstep(0.25, 0.6, Fr) * (1 - sstep(0.7, 1.4, Fr)) : 0.018 * sstep(0.2, 0.45, Fr), ws = way && !pl ? 0.004 * H.Lw * sstep(0.3, 0.45, Fr) : 0;
  const zG = R.zG; let F = -R.m * HS_G, M = 0, slam = 0;
  for (let i = 0; i < n; i++){
    const z = H.z[i] - zG, h = eta[i] - wt * (H.z[i] - R.zF) - ws - (X.yg - (0.06 + H.d[i]) * c - sn * z), a = secArea(H, i, h) * H.dx * HS_RHO * HS_G;
    F += a; M -= z * a;
    if (i < 2 && X.h[i] <= 0 && h > 0 && X.t - X.slamT > 0.4){
      const vr = (deta ? deta[i] : 0) - (X.vy - z * c * X.vth + (0.06 + H.d[i]) * sn * X.vth);
      if (vr > vth){ slam = Math.max(slam, vr / vth); }
    }
    X.h[i] = h;
  }
  if (slam) X.slamT = X.t;
  if (way && pl){
    const b = H.bc, Cv = V / Math.sqrt(HS_G * b); let Lk = 0;
    for (let i = n - 1; i >= 0; i--){ if (X.h[i] <= 0) break; Lk += H.dx; }
    if (Lk > 0){   // (no lift with the transom out of the water: off a crest she flies, and falls)
      const lam = Math.max(0.5, Lk / b), zcp = H.zAft - lam * b * (0.75 - 1 / (5.21 * Cv * Cv / (lam * lam) + 2.39));
      const tau = clamp((X.th - R.th0 - (X.vy - (zcp - zG) * X.vth) / V) * 180 / Math.PI + 1, 0, 12), CL0 = Math.pow(tau, 1.1) * 0.012 * Math.sqrt(lam);
      const lift = 0.5 * HS_RHO * V * V * b * b * Math.max(0, CL0 - 0.0065 * H.beta * Math.pow(CL0, 0.6)) * sstep(0.8, 1.6, Cv);
      F += lift; M -= (zcp - zG) * lift; }
  }
  const ze = 0.3 + 0.15 * sstep(0.2, 0.8, Fr), c33 = 2 * ze * Math.sqrt(R.K33 * R.m33), c55 = 2 * ze * Math.sqrt(R.K55 * R.I55);
  X.vy += (F - c33 * X.vy) / R.m33 * dt; X.yg += X.vy * dt;
  X.vth += (M - c55 * X.vth) / R.I55 * dt; X.th += X.vth * dt; X.t += dt;
  if (!(Number.isFinite(X.yg) && Number.isFinite(X.th) && Number.isFinite(X.vy) && Number.isFinite(X.vth)) || Math.abs(X.th) > 0.8){ X.yg = R.y0 - Math.sin(R.th0) * zG; X.th = R.th0; X.vy = X.vth = 0; for (let i = 0; i < n; i++) X.h[i] = H.d[i]; }
  X.y = X.yg + Math.sin(X.th) * zG;
  return slam;
}
