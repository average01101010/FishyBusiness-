// ===== STABILITY: hydrostatics, the boat's motions in a sea, and what they do to the work aboard =====
// Hydrostatics from VESSELS (len, beam, draft, disp). The draft there is the deepest point; the hull's mean draft is what gives a block
// coefficient of at least 0.35. Waterplane Cwp = (1 + 2 Cb) / 3, KB = T (5/6 - Cb / (3 Cwp)) (Normand), BM = Cwp^2 B^2 / (11.75 Cb T) (Murray).
// The centre of gravity: an open boat or a sjark sits low (KG a share of the depth), a larger boat is built to about GM = 0.09 B + 0.3 m;
// the stiffer of the two. Freeboard 0.35 + 0.035 L (at most 2.5 m), and the deck edge goes under at atan(2 f / B).
// Roll period after IMO's weather criterion (IS Code 2008, 2.3): T = 2 C B / sqrt(GM), C = 0.373 + 0.023 B/d - 0.043 L/100 (B/d at most 3.5,
// as the formula was fitted). Heave and pitch: T = 2 pi sqrt(Cb T (1 + 0.8) / (g Cwp)) (the water that moves with the hull, 0.8 of it).
// IMO's minimum for fishing vessels with one deck: GM 0.35 m (IS Code part B, 2.1). Icing is not modelled (Jonas' choice 02.10.2026).
const STAB_W = {potBig:48, potSno:16, net:9, tub:25, kit:6};   // kg aboard per pot (with its rope), net, line tub, jig kit (the conical snow crab pot 14.5 kg with its share of the string, H3a; the king crab pot 45 kg with its rope and egg float, OB16)
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
// ---- Where the load stands aboard (OB15, 09.11.2026; docs/planer/om-bord.md kap. 5, S1–S3; Jonas 09.11.2026: «Jeg ønsker jo at båten
// skal fungere så ekte som mulig»). In the 3D model's own frame, metres: x to starboard, z aft, the origin the model's (0.06 m over the
// design waterline). Read off the Blender models' anchors 09.11.2026 (tools/boats/*.py, what vessel3d.js glbLoad gives as ex.anchors):
// bow and stern; the hold's hatch on a decked boat, or the boxes on the floor of an open boat (kit.cargo, hold); the nets (kit.garn) and the line tubs
// (kit.stamps); the tubs on deck where the fish wait for the table and the ice (work.tub); the gutting table (work.table); the hauler; the
// helm (skipperAt); the fisher at the rail of a hand-worked boat (skiff.fisher); the pots on the work deck (deck.z); dy the deck's height.
// A data table, as VESSELS is (no code chooses by the type's name): the core reckons without the models, so the world is the same with the
// 3D view off. When a model's places move (OB5–OB13), this table is read again: tests/unit/trim.test.mjs holds the numbers it was read at.
// A type not here (the ocean vessels, outside the MVP) gets the middle of her hull for all of it and the hauler on the starboard rail.
const STAB_AT = {
  skiff:{bow:-2.2, stern:3.1, dy:0.22, hand:true, hold:[0, -1.7], net:[0.58, 1.5], tub:[0.58, 1.34], deck:[-0.75, 1.08], table:[-0.92, 0.4], haul:[0.86, -0.32], helm:[0, 1.45], fish:[0.45, 0.1], pots:[0, 1.8], rest:[-0.55, 2.05]},
  trebat:{bow:-3.6, stern:3.5, dy:0.04, hand:true, hold:[0, -1.5], net:[0, -1.5], tub:[-0.24, -1.72], deck:[0.52, -0.5], table:[-0.62, -0.35], haul:[0.99, -1.3], helm:[-0.36, 2.28], fish:[0.45, -0.1], pots:[0, 2.2], rest:[-0.45, -0.85]},
  snekke:{bow:-3.95, stern:3.95, dy:0.42, hold:[0, 1.23], net:[-0.68, 1.23], tub:[-0.9, 1.45], deck:[0, 2.2], table:[-1.08, 2.12], haul:[1.22, 1.9], helm:[0.68, 1], pots:[0, 2.55]},
  plastsjark:{bow:-4.725, stern:4.725, dy:0.55, hatch:1.9, net:[-0.5, 3.53], tub:[0.5, 3.53], deck:[1.2, 1.63], table:[-1.45, 0.8], haul:[1.59, 0.98], helm:[0.62, -0.73], pots:[0, 2.53]},
  sjark:{bow:-5, stern:5.5, dy:0.59, hatch:2.1, net:[0.92, 4.05], tub:[0.91, 4.05], deck:[1.38, 1.5], table:[-1.55, 1.7], haul:[1.91, 0.8], helm:[0.48, -1.3], pots:[0, 2.3]},   // (OB8: the nets and the tubs in the starboard gangway aft, the table 0.3 m forward)
  hurtigsjark:{bow:-5.495, stern:5.495, dy:1.21, hatch:3.15, net:[0, 4.8], tub:[-0.95, 0.2], deck:[1.38, 2.44], table:[-1.55, 3.1], haul:[1.84, 1.6], helm:[0.46, -1.68], pots:[0, 3.1]},   // (OB9: the bench aft abreast the hatch, the line tubs forward under the shelter, the deck 5 cm higher on the empty boat's waterline)
  sjarkny:{bow:-5.495, stern:5.495, dy:1.6, hatch:3.9, net:[1.05, 4.95], tub:[0.8, 3.5], deck:[1.8, 0.65], table:[-1.84, 3.25], haul:[2.19, -0.1], helm:[1.12, -1.83], fish:[1.75, 3.25], pots:[0.7, 4.27]},   // (OB10: fish is the middle of her four jigging places; the empty boat's waterline, 0.67 m under the drawing's largest, so the deck stands 1.6 m up; the bench to port abreast the hatch, the line tubs by the hatch aft, the pots in the starboard quarter and on the hatch)
  breisjark:{bow:-5.12, stern:5.58, dy:0.94, hatch:0.48, net:[0.37, 2.43], tub:[0.2, 1.64], deck:[1.45, 0.56], table:[-1.59, 1.53], haul:[1.98, -0.29], helm:[0.55, -1.9], fish:[1.5, 1.63], pots:[-0.35, 4.63]},   // (OB11: the empty boat's waterline, 6 cm under the drawing's, so the deck stands 0.94 m up; the net tub and the line tubs aft of the hatch, the pots' stack on the open aft deck, fish her one jigging place in the open starboard side)
  kyst15:{bow:-7.495, stern:7.495, dy:0.9, hatch:1.8, net:[2.2, 3.5], tub:[2.1, 4.5], deck:[2.35, 0.95], table:[1.24, 2.22], haul:[2.86, 0.2], helm:[1.05, -3.88], pots:[0, 1.3]},
  kyst21:{bow:-10.5, stern:10.5, dy:1.02, hatch:-1.3, net:[0.55, -1.8], tub:[0.33, -2.12], deck:[2.7, -0.4], table:[2.7, -1.75], haul:[3.24, -3.1], helm:[0.5, 2.6], pots:[0, -1.6]}};
const STAB_PC = new Map();
function stabPlaces(type){
  let A = STAB_PC.get(type); if (A) return A;
  const h = hullOf(type), T = STAB_AT[type] || {}, mid = [0, 0];
  A = Object.assign({bow:-h.L / 2, stern:h.L / 2, dy:0.5, hold:mid, net:mid, tub:mid, deck:mid, table:mid, haul:[h.B * 0.45, 0], helm:mid, pots:mid}, T);
  // (the hatch is only the opening: the hold runs under the deck from it towards the middle, where the hull is fullest, so its centre is
  // taken halfway between the hatch and the middle of her length; the models have no hold to measure, CLAUDE.md. Assumed, om-bord.md kap. 5)
  if (T.hatch != null) A.hold = [0, (T.hatch + (A.bow + A.stern) / 2) / 2];
  if (!A.fish) A.fish = [A.haul[0] * 0.7, A.pots[1]];   // at the rail on the hauler's side, at the work deck (the jigging machines there)
  if (!A.rest) A.rest = [0, A.helm[1]];                  // off the deck: in the wheelhouse or the cabin, about the middle line
  STAB_PC.set(type, A); return A;
}
// where a person stands for a station of the work (core/13-work.js workAssign: c.st, S.mySt): the helm, the hauler (a step inboard of
// it, as deckcrew.js places the one hauling; in a hand-worked boat at the rail where the fisher sits), the rail with the jig, the table, the tubs (bleeding, icing, sorting), else off the deck
const stabSpot = (A, st) => st === 'ror' ? A.helm : st === 'haling' ? (A.hand ? A.fish : [A.haul[0] * 0.7, A.haul[1]]) : st === 'fiske' ? A.fish : st === 'sloy' ? A.table : st === 'is' || st === 'blogg' || st === 'sort' ? A.deck : A.rest;
const STAB_P = 90;   // kg a person, in oilskins and boots
// The pull of the gear in the hauler, kg, straight down at its sheave: the gear coming up off the bottom (its weight in the water, the
// rope's from the depth, and the catch on the piece in the sheave), as much as the boat can take on her rail: 35 kg a tonne of the boat
// (the skiff 35 kg by hand, the trebåt 67, the snekke 105, a sjark the gear's own). Guessed, not measured (om-bord.md kap. 5): a line
// 50 kg, a net 100, a pot string 70 (the conical snow crab pots 60), 0.6 kg a metre of depth, and half the catch of a piece.
const STAB_PULL = {line:50, garn:100, teine:70};
function stabPull(b = S.boat){
  const g = b && b.gop; if (!g || g.op !== 'haul') return 0;
  const s = (S.sets || []).find(x => x.id === g.sid), depth = Math.min(300, Math.max(0, (s && s.depth) || 30));   // (the set's depth, as the haul's end lines have it)
  const fish = g.done > 0 ? (g.kg || 0) / g.done * 0.5 : 0;
  return Math.min((g.sno ? 60 : STAB_PULL[g.kind] || 50) + 0.6 * depth + fish, 35 * hullOf(b.type).disp);
}
// what is aboard: the catch low in the hold (on the floor of an open boat), tubs waiting on deck, gear on deck (and which), the water in
// the hull, the people at their stations, and the pull in the hauler
function stabLoad(b = S.boat){
  const pg = S.pgear || {}, pots = pg.pots || {}, lines = pg.lines || {}, nets = (pg.nets || []).reduce((a, n) => a + n.n, 0);
  const gp = {pot:(pots.big || 0) * STAB_W.potBig + (pots.sno || 0) * STAB_W.potSno, net:nets * STAB_W.net, tub:((lines.hyse || {}).n || 0) * STAB_W.tub + ((lines.bank || {}).n || 0) * STAB_W.tub, kit:((pg.kits || {}).n || 0) * STAB_W.kit};
  const gear = gp.pot + gp.net + gp.tub + gp.kit, water = typeof hullWaterKg === 'function' ? hullWaterKg(b) : 0, deck = typeof deckPending === 'function' ? deckPending() : 0;
  // (holdLoad has the fish waiting on deck too: before 09.11.2026 they were counted twice, in the hold and on deck)
  const hold = Math.max(0, (typeof holdLoad === 'function' ? holdLoad() : 0) - deck) + water;
  const crew = []; if (typeof meAboard === 'function' && meAboard()) crew.push(S.mySt || 'ror');
  if (typeof crewAboard === 'function') for (const c of crewAboard(null, true)) crew.push(c.sleepW ? null : c.st || null);   // (the watch below in the bunks weighs too)
  return {hold, deck, gear, gp, water, crew, pull:stabPull(b)};
}
// the boat as loaded: draft, metacentric height, roll, heave and pitch periods, the deck edge angle; with the load's places, the trim
// (bow up, rad: her centre of gravity forward or aft of where the hull's own lies, the sections finding where she floats, hullRest) and
// the list (to starboard, rad: the load's moment across her over the displacement times GM, the small-angle heel)
function stabOf(type = S.boat.type, load = stabLoad()){
  const h = hullOf(type), A = stabPlaces(type), crew = load.crew || [], wc = crew.length * STAB_P / 1000, pull = (load.pull || 0) / 1000;
  const w = (load.hold + load.deck + load.gear) / 1000 + wc + pull, D = h.disp + w;
  // the sides flare, so the waterplane grows as she settles and BM falls slower than 1/displacement (KM stays about the same)
  const T = h.T + w / (1.025 * h.Awp), KB = h.KB * T / h.T, BM = h.BM * Math.pow(h.disp / D, 0.4);
  // gear stacked on deck: its middle 0.8 m up; a person's weight 0.9 m over the deck they stand on; the pull at the hauler's sheave
  const KG = (h.disp * h.KG + load.hold / 1000 * (h.decked ? 0.4 : 0.3) * h.Dp + (load.deck + load.gear) / 1000 * (h.Dp + 0.8) + wc * (h.T + 0.06 + A.dy + 0.9) + pull * (h.Dp + 0.35)) / D;
  const GM = KB + BM - KG, f = Math.max(0.1, h.f - (T - h.T)), C = 0.373 + 0.023 * Math.min(3.5, h.B / T) - 0.043 * h.L / 100, deckEdge = Math.atan(2 * f / h.B);
  // the moments of the load about the middle line (x) and along her (z), kg m: the fish in the hold, the water in the hull where she is
  // deepest (her own centre, no moment), the tubs on deck, the gear at its places (all at the pots' place when not split), the people at
  // their stations, and the pull at the hauler
  const gp = load.gp || {pot:load.gear}, fish = Math.max(0, load.hold - (load.water || 0)), P = [[fish, A.hold], [load.deck, A.deck], [gp.pot || 0, A.pots], [gp.net || 0, A.net], [gp.tub || 0, A.tub], [gp.kit || 0, A.fish], [load.pull || 0, A.haul]];
  for (const st of crew) P.push([STAB_P, stabSpot(A, st)]);
  let mx = 0, mz = 0, wm = 0; for (const [kg, at] of P){ if (!(kg > 0)) continue; mx += kg * at[0]; mz += kg * at[1]; wm += kg; }
  const list = clamp(Math.atan(mx / (D * 1000 * Math.max(GM, 0.04))), -deckEdge, deckEdge);
  // the trim: the hull's own centre of gravity is where she floats level with nothing aboard (as before), the load's at its places, and
  // what has no place (the water in the hull, gear not split) as a level layer: where it would sink her without trimming her (the centre
  // of buoyancy at D, less the hull's share). dzG is the load's centre forward or aft of that level one, for the 3D hull drawn (hullMove),
  // whose sections may end a little differently.
  const H = hullSections(type, A.bow, A.stern), z0 = hullRest(H, h.disp).zG, zL = hullRest(H, D).zG, wk = w * 1000;
  const zLay = wk > 0 ? (D * zL - h.disp * z0) * 1000 / wk : z0, zG = wk > 0 ? (h.disp * 1000 * z0 + mz + (wk - wm) * zLay) / (D * 1000) : z0;
  const trim = Math.abs(zG - zL) >= 5e-4 ? hullRest(H, D, zG).th0 : 0;
  return {GM, KG, T, f, D, Tr:2 * C * h.B / Math.sqrt(Math.max(GM, 0.04)), Tz:2 * Math.PI * Math.sqrt(h.Cb * T * 1.8 / (9.81 * h.Cwp)), deckEdge, L:h.L, B:h.B, decked:h.decked, list, trim, zG, dzG:zG - zL};
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
  // (the heel: the wind's, and the list from the load across her, OB15; which side the wind is on is not reckoned here, so they add)
  return {roll:Math.min(0.9, Math.sqrt(r2)), heel:windHeel(St, windAt(H, p)) + Math.abs(St.list || 0), av:Math.sqrt(a2), res, GM:St.GM, Tr:St.Tr, deckEdge:St.deckEdge};
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
  const {kn, head} = boatHead(H, b), L = stabLoad(b), k = b.type + '|' + b.pos.x + '|' + b.pos.y + '|' + H + '|' + kn + '|' + head + '|' + L.hold + '|' + L.deck + '|' + L.gear + '|' + L.pull + '|' + L.crew.join(',') + '|' + L.gp.pot + '|' + L.gp.net + '|' + L.gp.tub;
  if (MW_MEMO.k === k && !WX_FORCE) return MW_MEMO.v;
  const St = stabOf(b.type, L), M = motionAt(b.pos, H, head, kn, St), R = motionAt(b.pos, H, (windDir(H, b.pos) - gridGamma(b.pos) + 90) * Math.PI / 180, 0, stabOf(b.type, {hold:0, deck:0, gear:0, crew:L.crew.map(() => null)}));   // (the same people aboard, off the deck: they are not the load)
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
// With zG (the load's centre of gravity along her, OB15) she trims until her centre of buoyancy is under it: the keel's depth at each
// section as hullStep has it at rest, (0.06 + d) cos th - yg + sin th (z - zG), and the height yg and trim th found together (Newton).
function hullRest(H, D, zW){
  const key = Math.round(D * 100) + (zW == null ? '' : '|' + Math.round(zW * 1000)); let R = H.rest.get(key); if (R) return R;
  if (zW != null){ const L0 = hullRest(H, D); if (Math.abs(zW - L0.zG) < 5e-4){ H.rest.set(key, L0); return L0; } return hullTrimmed(H, D, zW, L0, key); }
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
// (the trimmed rest: from the level one, Newton on the force and the moment about zG; the trim held within 0.3 rad, and a section with
// its deck under gives no stiffness, as in hullStep. The stiffness and masses are taken where she lies.)
function hullTrimmed(H, D, zG, L0, key){
  const n = H.n, dx = H.dx, m = L0.m, k = dx * HS_RHO, hk = (i, yg, th) => (0.06 + H.d[i]) * Math.cos(th) - yg + Math.sin(th) * (H.z[i] - zG);
  let yg = L0.y0, th = 0; const fM = Math.max(...H.f), dM = Math.max(...H.d);
  for (let it = 0; it < 60; it++){
    let F = -m, M = 0, Fy = 0, Ft = 0, My = 0, Mt = 0;
    for (let i = 0; i < n; i++){
      const h = hk(i, yg, th), a = secArea(H, i, h) * k, b = secBreadth(H, i, h) * k, z = H.z[i] - zG, dt = -(0.06 + H.d[i]) * Math.sin(th) + Math.cos(th) * z;
      F += a; M += z * a; Fy -= b; Ft += b * dt; My -= z * b; Mt += z * b * dt;
    }
    if (Math.abs(F) < m * 1e-7 && Math.abs(M) < m * H.L * 1e-7) break;
    const det = Fy * Mt - Ft * My; if (!(Math.abs(det) > 1e-12)) break;
    const dy = (F * Mt - Ft * M) / det, dth = (Fy * M - F * My) / det;
    yg = clamp(yg - clamp(dy, -0.2, 0.2), L0.y0 - fM, L0.y0 + dM); th = clamp(th - clamp(dth, -0.05, 0.05), -0.3, 0.3);
  }
  let w = 0, wz = 0; const b = []; for (let i = 0; i < n; i++){ const h = Math.min(hk(i, yg, th), H.d[i] + 0.95 * H.f[i]); b.push(secBreadth(H, i, h)); w += b[i]; wz += b[i] * H.z[i]; }
  let IG = 0; for (let i = 0; i < n; i++) IG += b[i] * ((H.z[i] - zG) ** 2 + dx * dx / 12);
  const K33 = HS_RHO * HS_G * Math.max(w, 1e-3 * H.Awp / dx) * dx, K55 = HS_RHO * HS_G * Math.max(IG, 1e-3 * H.Awp / dx * H.kyy * H.kyy) * dx;
  const R = {D, m, s:0.06 - yg, y0:yg + Math.sin(th) * zG, th0:th, zG, zF:w > 0 ? wz / w : zG, K33, K55, m33:L0.m33, I55:L0.I55};
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
      const tau = clamp((X.th - (X.vy - (zcp - zG) * X.vth) / V) * 180 / Math.PI + 1, 0, 12), CL0 = Math.pow(tau, 1.1) * 0.012 * Math.sqrt(lam);
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
