// ===== STABILITY: hydrostatics, the boat's motions in a sea, and what they do to the work aboard =====
// Hydrostatics from VESSELS (len, beam, draft, disp). The draft there is the deepest point; the hull's mean draft is what gives a block
// coefficient of at least 0.35. Waterplane Cwp = (1 + 2 Cb) / 3, KB = T (5/6 - Cb / (3 Cwp)) (Normand), BM = Cwp^2 B^2 / (11.75 Cb T) (Murray).
// The centre of gravity: an open boat or a sjark sits low (KG a share of the depth), a larger boat is built to about GM = 0.09 B + 0.3 m;
// the stiffer of the two. Freeboard 0.35 + 0.035 L (at most 2.5 m), and the deck edge goes under at atan(2 f / B).
// Roll period after IMO's weather criterion (IS Code 2008, 2.3): T = 2 C B / sqrt(GM), C = 0.373 + 0.023 B/d - 0.043 L/100 (B/d at most 3.5,
// as the formula was fitted). Heave and pitch: T = 2 pi sqrt(Cb T (1 + 0.8) / (g Cwp)) (the water that moves with the hull, 0.8 of it).
// IMO's minimum for fishing vessels with one deck: GM 0.35 m (IS Code part B, 2.1). Icing is not modelled (Jonas' choice 02.10.2026).
const STAB_W = {potBig:25, net:9, tub:25, kit:6};   // kg aboard per pot (with its rope), net, line tub, jig kit
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
  const gear = (pots.big || 0) * STAB_W.potBig + nets * STAB_W.net + ((lines.hyse || {}).n || 0) * STAB_W.tub + ((lines.bank || {}).n || 0) * STAB_W.tub + ((pg.kits || {}).n || 0) * STAB_W.kit;
  const hold = typeof holdTotal === 'function' ? holdTotal() : 0, deck = typeof deckPending === 'function' ? deckPending() : 0;
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
// once a minute at sea: warn when she becomes rank with gear on deck, rolls in resonance with the sea, or rolls towards the deck edge
function stabTick(H){
  const b = S.boat, Z = motionHere(H, b), s = Z.state, was = b.stab || 0;
  if (s.lvl > was && S.t >= (b.stabAt || 0)){
    const gm = fmt1(Z.St.GM), tr = fmt1(Z.St.Tr), deg = Math.round((Z.M.roll + Z.M.heel) * 180 / Math.PI);
    const T = {gm:['Båten er ' + (s.lvl > 1 ? 'farlig ' : '') + 'rank: GM ' + gm + ' m (IMO krever minst 0,35 m for fiskefartøy). For mye på dekk. Sett ut eller lever redskap.', 'The boat is ' + (s.lvl > 1 ? 'dangerously ' : '') + 'tender: GM ' + gm + ' m (IMO asks at least 0.35 m for fishing vessels). Too much on deck. Set or land gear.'],
      res:['Synkronrulling: sjøen treffer i båtens egen rulleperiode (' + tr + ' s), og hun ruller ' + deg + '°. Endre kurs eller fart.', 'Synchronous rolling: the sea meets her own roll period (' + tr + ' s), and she rolls ' + deg + '°. Change course or speed.'],
      roll:['Kraftig rulling, ' + deg + '°: rekka går mot vannet. Legg baugen mer mot sjøen eller sakk farten.', 'Heavy rolling, ' + deg + '°: the rail goes towards the water. Put the bow more into the sea or slow down.']}[s.why];
    log(T[0], T[1], 'nav'); b.stabAt = S.t + 30;
  }
  b.stab = s.lvl;
}
const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', S.lang === 'no' ? ',' : '.');
