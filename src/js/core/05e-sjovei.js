// ---------- the rules of the road: who gives way, and the NPCs and Autonav that do (Ø11.1, docs/systemer/sjofart-og-lover.md) ----------
// Sjøveisreglene, FOR-1975-12-01-5 (https://lovdata.no/dokument/SF/forskrift/1975-12-01-5), rules 1-18 and 19 a-c read word for word
// 06.11.2026. The class of a vessel by rule 3 and 18 (colregCls), the situation between two of them by rules 13, 14, 15, 18 and 9 b-c with
// the closest point of approach (colregSit), and what follows (Jonas' choices V2 A and npc-flåten 4 A): the NPCs within about a kilometre
// of the boat you follow give way when they must and hold their course and speed when she must, as a local deviation on the shared
// clock's position that is never kept or sent; Autonav (and the operations plan, which sails by it) gives way for the vessels it must
// and comes back to the route. Only with the game open and running (prinsipp 4): in catchUp nothing gives way and nothing is counted.
// The warning in the strip, the box and the chart plotter comes only when the CPA is under the limit and the time to it a few minutes,
// never in harbour.

// the classes (rule 3): power-driven (b), engaged in fishing (d), not under command (f), restricted in her ability to manoeuvre (g),
// constrained by her draught (h); and those not under way (i): moored or at anchor
const COLREG_RANK = {pow:0, fish:1, ram:2, nuc:2};
// rule 13 b: «mer enn 22,5 grader aktenfor tvers»; rule 14 b: «forut eller nesten forut» (14 c: in doubt it is head-on, so a little wide)
const SJV_ABAFT = 112.5 * Math.PI / 180, SJV_HO = 12 * Math.PI / 180;
// the turn the vessel that gives way makes (rule 8 b: «så stor at den er helt tydelig»; 16: «en markert manøver»), and how far she then
// stands off her track at most (km)
const SJV_TH = 35 * Math.PI / 180, SJV_OFFMAX = 0.6;
const SJV = {
  E:new Map(),      // the NPCs giving way (or holding off): id -> the manoeuvre, laid over npcStates' position
  sits:new Map(),   // the encounters seen: id -> {sit, t, clr, nm} (13 d: once overtaking, till past and clear; the near miss once)
  own:null,         // Autonav's own manoeuvre for the boat you follow
  ownOff:0, ownChk:0,  // its offset off the line now (m, the manoeuvring model's) and the ground looked for ahead of it
  warn:null,        // the warning that stands now
  at:-1, vid:null,  // the last look (game hours) and the vessel it was for
  n:0,              // warnings since the page was opened (measured, tests/colregtest.py)
  ms:0,             // the time the last look took (ms)
  // the warning's window (game minutes to the CPA; 6 game minutes is a minute of real time), the NPCs' and Autonav's reach (km),
  // the near miss (m clear), how long a manoeuvre lasts at most (game hours)
  TW:6, RNPC:1.0, ROWN:1.2, RW:3, NEAR:50, TMAX:0.25
};
const sjvWrap = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
// the CPA under which there is a risk of collision (m): rule 7 a, «Hvis det er noen tvil, skal det regnes med at det er fare»; wider for
// the long ones. Two sjarks 120 m, the coastal ship and a sjark 280 m
function colregLim(La, Lb){ return clamp(100 + 1.5 * Math.max(La || 10, Lb || 10), 120, 400); }

// a vessel's class from what the AIS list knows of her (npcStates): an ocean vessel's comes with her (colregHav, 05d-hav.js); a coast boat
// fishing with her nets, line or pots in the sea is engaged in fishing (gear: her set is in NPCGEAR), one jigging is not (3 d: «omfatter
// ikke … fiskeredskap som ikke begrenser manøvreringsevnen»); a boat in a mission drifting with engine trouble is not under command, and
// the rescue boat with a tow is restricted (3 g vi)
function colregCls(n){
  if (n.cls) return n.cls;
  if (n.st === 'port') return 'moor';
  if (n.st === 'anchor' || n.anch) return 'anch';
  if (n.nuc) return 'nuc';
  if (n.ram || (n.rs && (n.st === 'tow' || n.st === 'hook'))) return 'ram';
  if (n.cbd) return 'cbd';
  if (n.v === 0 && !n.st && (n.type === 'coastal' || n.type === 'ferry')) return 'moor';   // the coastal ship and the ferry at their quay
  if (n.st === 'fishing' && (n.hav || n.gear || n.player)) return 'fish';
  return 'pow';
}
// the ocean fleet's (05d-hav.js havNear): all its gear limits her (trawl, seine, line, pots, nets); the purse seiner and the Danish seiner
// searching for the fish have nothing out yet
function colregHav(s, A){
  if (A.st === 'port') return 'moor';
  if (A.st !== 'fishing') return 'pow';
  if ((s.g === 'not' || s.g === 'snurrevad') && !A.seine) return 'pow';
  return 'fish';
}
// the boat you follow: not under command with the engine stopped or no diesel (3 f); engaged in fishing while she sets or hauls (b.gop:
// nets, line, pots); in tow she is the rescue boat's, and lying at the quay or the anchor she is not under way (3 i)
function colregOwnCls(b){
  if (!b || b.status === 'port' || b.status === 'unmooring' || b.status === 'aground') return 'moor';
  if (b.status === 'tow' || b.status === 'ptow') return 'towed';
  if (b.anch) return 'anch';
  if (b.status === 'engine' || b.status === 'adrift') return 'nuc';
  if (b.gop) return 'fish';
  return 'pow';
}
// what the AIS card says she is doing (N8): the navigational status as the AIS has it
function colregAisSt(n){
  const c = colregCls(n);
  if (c === 'moor' || (n.v === 0 && !n.fleet && !n.coast && !n.hav && !n.player && !n.st)) return ['Fortøyd', 'Moored'];
  return {anch:['Til ankers', 'At anchor'], nuc:['Ikke under kommando', 'Not under command'], ram:['Begrenset manøvreringsevne', 'Restricted manoeuvrability'],
    cbd:['Hemmet av dypgående', 'Constrained by her draught'], fish:['Driver fiske', 'Engaged in fishing']}[c] || ['Underveis med motor', 'Under way using engine'];
}

// The situation between a (the boat you follow) and b, each {p (grid km), hd and cog (radians on the grid), v (knots), cls, L (m)}; o: prev
// (the situation they were in: 13 d), narrowA, narrowB (she can navigate safely only within a narrow channel), lim (m), gs (gridScale).
// Gives the rule, who gives way ('a', 'b', 'both' or 'none'), the CPA and range (m), the time to the CPA (game minutes; negative when it is
// past), whether there is a risk (the CPA under the limit and still to come), the bearings of each from the other's bow, and the CPA's
// vector (b from a at the CPA, grid km) with the relative velocity (grid km an hour) for the manoeuvre (sjvNeed).
// The order (rule 18: «Unntatt hvor regel 9, 10 og 13 krever noe annet»; 13 a: «Uten omsyn til det som ellers er sagt i … avsnitt I og
// II»): one lying still or drifting under a knot cannot give way (rule 2 b), so the one that moves keeps clear; then overtaking (13), then
// the narrow channel (9 b, c), then the one constrained by her draught (18 d), then the rank (18 a, c), and between two power-driven
// vessels head-on (14) or crossing (15). Two engaged in fishing keep clear of each other as they can (2, 8); two that cannot manoeuvre,
// neither.
function colregSit(a, b, o = {}){
  const gs = o.gs || 1, ka = (a.v || 0) * NM * gs, kb = (b.v || 0) * NM * gs;
  const ca = a.cog != null ? a.cog : a.hd, cb = b.cog != null ? b.cog : b.hd;
  const rx = b.p.x - a.p.x, ry = b.p.y - a.p.y, vx = Math.sin(cb) * kb - Math.sin(ca) * ka, vy = -Math.cos(cb) * kb + Math.cos(ca) * ka;
  const v2 = vx * vx + vy * vy, rv = rx * vx + ry * vy, t = v2 > 1e-9 ? -rv / v2 : 0;
  const cx = rx + vx * t, cy = ry + vy * t, rng = Math.hypot(rx, ry) / gs * 1000, cpa = Math.hypot(cx, cy) / gs * 1000;
  const brg = Math.atan2(rx, -ry), relA = sjvWrap(brg - (a.hd || 0)), relB = sjvWrap(brg + Math.PI - (b.hd || 0)), closing = rv < 0;
  const lim = o.lim || colregLim(a.L, b.L), still = (a.v || 0) < 1 && (b.v || 0) < 1, risk = t > 0 && cpa < lim && !still;   // (two lying still: nothing closes)
  const clsA = a.cls || 'pow', clsB = b.cls || 'pow', ra = COLREG_RANK[clsA] || 0, rb = COLREG_RANK[clsB] || 0;
  let sit, give;
  if ((a.v || 0) < 1 || (b.v || 0) < 1){ sit = '2'; give = (a.v || 0) < 1 && (b.v || 0) < 1 ? 'none' : (a.v || 0) < 1 ? 'b' : 'a'; }
  else if (o.prev === '13a' || (o.prev !== '13b' && closing && Math.abs(relB) > SJV_ABAFT)){ sit = '13a'; give = 'a'; }
  else if (o.prev === '13b' || (closing && Math.abs(relA) > SJV_ABAFT)){ sit = '13b'; give = 'b'; }
  else if (o.narrowB && (a.L < 20 || clsA === 'fish') && clsA !== 'nuc' && clsA !== 'ram'){ sit = '9a'; give = 'a'; }
  else if (o.narrowA && (b.L < 20 || clsB === 'fish') && clsB !== 'nuc' && clsB !== 'ram'){ sit = '9b'; give = 'b'; }
  else if (clsB === 'cbd' && clsA !== 'cbd' && ra < 2){ sit = '18d'; give = 'a'; }
  else if (clsA === 'cbd' && clsB !== 'cbd' && rb < 2){ sit = '18d'; give = 'b'; }
  else if (ra !== rb){ sit = '18'; give = ra < rb ? 'a' : 'b'; }
  else if (ra === 0){
    if (Math.abs(relA) <= SJV_HO && Math.abs(relB) <= SJV_HO){ sit = '14'; give = 'both'; }
    else if (relA > 0 && relA < SJV_ABAFT){ sit = '15'; give = 'a'; }   // the other on her starboard side
    else if (relB > 0 && relB < SJV_ABAFT){ sit = '15'; give = 'b'; }
    else { sit = '14'; give = 'both'; }   // 14 c: in doubt, head-on
  }
  else if (clsA === 'fish'){ sit = '18c'; give = 'both'; }
  else { sit = '18'; give = 'none'; }
  return {sit, give, cpa, rng, tcpa:t * 60, risk, lim, relA, relB, closing, cx, cy, vx, vy, clsA, clsB};
}
// the smallest offset (km, true) to side sg (+1 starboard of heading hd) that opens the CPA of R (colregSit) to want (m), the mover being
// 'b' (an NPC) or 'a' (the boat you follow): the parallel track moves the CPA by the offset's part across the relative motion
function sjvNeed(R, hd, sg, want, mover, gs = 1){
  const w = Math.hypot(R.vx, R.vy) || 1, wx = R.vx / w, wy = R.vy / w;
  for (let k = 0.1; k <= SJV_OFFMAX + 1e-9; k += 0.05){
    let ox = Math.cos(hd) * sg * k * gs, oy = Math.sin(hd) * sg * k * gs; if (mover === 'a'){ ox = -ox; oy = -oy; }
    const d = ox * wx + oy * wy, cx = R.cx + ox - d * wx, cy = R.cy + oy - d * wy;
    if (Math.hypot(cx, cy) / gs * 1000 >= want) return Math.max(0.15, k);
  }
  return null;
}
// the side she turns to: starboard (14 a, 15, and 17 c for the one that stood on), except overtaking and the rank, where the side that
// opens most (13 says nothing of the side)
function sjvSide(R, hd, mover, want, gs){
  if (!(R.sit === '13a' || R.sit === '13b' || R.sit === '18' || R.sit === '18d' || R.sit === '2')) return 1;
  const s = sjvNeed(R, hd, 1, want, mover, gs), p = sjvNeed(R, hd, -1, want, mover, gs);
  return s == null && p != null ? -1 : s != null && p != null && p < s - 0.1 ? -1 : 1;
}

// ---- the manoeuvre laid over the shared course (npc-flåten 4 A): a fixed direction off the track, ramped at the turn's rate, held,
// and back; or, with no room for it (8 e), she slackens off and is behind her course for a while, and makes it up at 1.3 times her
// speed after. Pure in H, so the chart, the 3D view and the instruments, which ask at a slightly different time, all see her the same ----
function sjvOffAt(E, H){
  if (E.slow) return 0;
  const up = Math.min(E.tgt, Math.max(0, H - E.t0) * E.rate);
  if (E.t1 == null || H <= E.t1) return up;
  const o1 = Math.min(E.tgt, Math.max(0, E.t1 - E.t0) * E.rate); return Math.max(0, o1 - (H - E.t1) * E.rate);
}
// +1 turning away, 0 holding the offset, -1 turning back
function sjvPhase(E, H){
  if (E.slow) return 0;
  if (E.t1 != null && H > E.t1) return sjvOffAt(E, H) > 1e-6 ? -1 : 0;
  return (H - E.t0) * E.rate < E.tgt ? 1 : 0;
}
// how far behind her course she is (game hours)
function sjvLagAt(E, H){
  if (!E.slow) return 0;
  const end = E.t1 == null ? H : Math.min(H, E.t1), l1 = Math.max(0, end - E.t0) * (1 - E.f);
  return E.t1 == null || H <= E.t1 ? l1 : Math.max(0, l1 - (H - E.t1) * 0.3);
}
function sjvPose(n, E, H){
  const off = sjvOffAt(E, H), lag = sjvLagAt(E, H);
  if (off <= 1e-6 && lag <= 1e-6) return n;
  let p = n.p, hd = n.hd, cog = n.cog != null ? n.cog : n.hd, v = n.v;
  if (lag > 1e-6){ const q = npcStates(H - lag, n.id)[0]; if (q && q.p){ p = q.p; hd = q.hd; cog = q.cog != null ? q.cog : q.hd; }
    v = n.v * (E.t1 == null || H <= E.t1 ? E.f : 1.3); }
  if (off > 1e-6){ p = {x:p.x + E.nx * off, y:p.y + E.ny * off}; const ph = sjvPhase(E, H); if (ph){ hd = hd + ph * E.side * SJV_TH; cog = hd; v = n.v / Math.cos(SJV_TH); } }
  return Object.assign({}, n, {p, hd, cog, v:Math.round(v * 10) / 10, give:E.why});
}

// the game open and running at its pace (the manoeuvring model ticks: 16b-dyn.js DYN.on, false while the time away is caught up)
// (asked before the UI's files have run, CATCH_LEFT is not there yet: not live)
function sjvLive(){ try { return typeof DYN !== 'undefined' && DYN.on && simRate() <= 60 && !(typeof CATCH_LEFT !== 'undefined' && CATCH_LEFT > 0); } catch (e){ return false; } }
// the boat you follow as the rules see her
function sjvOwn(){
  const b = S.boat, cls = colregOwnCls(b);
  let p = b.pos, hd = b.heading || 0, cog = hd, v = b.status === 'sailing' ? (b.v || 0) : 0;
  if (typeof dynLive === 'function' && dynLive()){ const q = dynPose(); p = {x:q.x, y:q.y}; hd = q.hd; cog = q.cog; v = q.spd / KN_MS; }
  else if (b.status !== 'sailing' && b.drv && b.drv.t >= S.t - 1){ const k = Math.hypot(b.drv.x, b.drv.y); if (k > 1e-6){ v = k / gridScale(b.pos) * 60 / NM; cog = Math.atan2(b.drv.x, -b.drv.y); } }
  return {p, hd, cog, v, cls, L:BOAT.len || 10, T:BOAT.draft || 1.5, B:BOAT.beam || 3};
}
// the NPCs that can give way: under way under power on their own course, not another player, the rescue boat, the coast guard
// alongside, a boat in a mission (09g-turer.js) or one lying still
const sjvCan = n => !n.player && !n.rs && !n.kv && String(n.id)[0] !== 't' && !n.hidden && (n.cls === 'pow' || n.cls === 'cbd') && n.v >= 2 && n.st !== 'port';
// left out of the warnings: the coast guard alongside for her inspection, the rescue boat, the boat you are towing or helping, the
// moored, the anchored and the hidden
const sjvSkip = n => n.rs || n.kv || String(n.id)[0] === 't' || n.hidden || n.cls === 'moor' || n.cls === 'anch';
// she can navigate safely only within a narrow channel (9 b): a vessel of 40 m or more where the sea across her is under 1.2 km, with
// land within 0.9 km on both sides (sampled every 50 m; the coarse land where the fine is not in). Kept a minute
const SJV_NAR = new Map();
function sjvNarrow(n, H){
  if (!(n.L >= 40)) return false;
  const k = SJV_NAR.get(n.id); if (k && Math.abs(H - k.t) < 1 / 60) return k.v;
  const gs = gridScale(n.p), nx = Math.cos(n.hd), ny = Math.sin(n.hd), side = sg => { for (let d = 0.05; d <= 0.9; d += 0.05){ const q = {x:n.p.x + nx * sg * d * gs, y:n.p.y + ny * sg * d * gs}; let l; try { l = isLand(q); } catch (e){ l = isLandFar(q); } if (l) return d; } return 9; };
  const s = side(1), p = side(-1), v = s + p < 1.2;
  if (SJV_NAR.size > 200) SJV_NAR.clear(); SJV_NAR.set(n.id, {t:H, v}); return v;
}
// room for an NPC's manoeuvre: the strip from her track out to the offset, 0.6 km ahead, is sea deep enough for her (her draught and a
// metre), every 50 m across and 100 m along; a block of the map that is not in counts as no room
function sjvRoom(n, nx, ny, k){
  const gs = gridScale(n.p), dx = Math.sin(n.hd) * gs, dy = -Math.cos(n.hd) * gs, T = (n.T || 2) + 1, tl = typeof tideCD === 'function' ? tideCD(S.t / 60) : 0;
  try {
    for (let s = 0; s <= 0.6 + 1e-9; s += 0.1) for (let o = 0.05; o <= k + 1e-9; o += 0.05){
      const q = {x:n.p.x + dx * s + nx * o, y:n.p.y + dy * s + ny * o};
      if (inHarbour(q) || isLand(q) || depthF(q) + tl < T) return false;
    }
  } catch (e){ return false; }
  return true;
}
// and for the boat you follow: her own ground check (her draught, the land, the skerries) from where she is out to the offset and on
function sjvRoomOwn(a, nx, ny, k){
  const gs = gridScale(a.p), dx = Math.sin(a.hd) * gs, dy = -Math.cos(a.hd) * gs, w = Math.tan(SJV_TH);
  try {
    const q1 = {x:a.p.x + dx * k / w + nx * k, y:a.p.y + dy * k / w + ny * k}, q2 = {x:q1.x + dx * 0.4, y:q1.y + dy * 0.4};
    return !groundCheck(a.p, q1) && !groundCheck(q1, q2) && !inHarbour(q1);
  } catch (e){ return false; }
}
// a manoeuvre starts: the turn's rate is her speed across at 35 degrees (grid km an hour), the direction fixed as she turns
function sjvStart(n, R, H, mover, why, own, id){
  const gs = gridScale(n.p), want = Math.max(1.5 * R.lim, R.lim + 60);
  const side = sjvSide(R, n.hd, mover, want, gs);
  let k = sjvNeed(R, n.hd, side, want, mover, gs); if (k == null) k = SJV_OFFMAX;
  k = Math.min(SJV_OFFMAX, k * 1.3);
  const nx = Math.cos(n.hd) * side * gs, ny = Math.sin(n.hd) * side * gs, rate = Math.max(2, n.v) * NM * Math.tan(SJV_TH);
  let room = own ? sjvRoomOwn(n, nx, ny, k) : sjvRoom(n, nx, ny, k);
  if (!room && k > 0.2){ k = Math.max(0.15, k / 2); room = own ? sjvRoomOwn(n, nx, ny, k) : sjvRoom(n, nx, ny, k); }
  return {id:id || n.id, side, nx, ny, tgt:k, rate, t0:H, t1:null, why, slow:!room, f:0.35, v:n.v};
}

// ---- one look: the encounters round the boat you follow (at most once a game tenth of a minute, a real second) ----
function sjvEval(H, list){
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0, b = S.boat;
  if (SJV.vid !== S.cur){ SJV.E.clear(); SJV.sits.clear(); SJV.own = null; SJV.ownOff = 0; SJV.warn = null; SJV.vid = S.cur; }
  SJV.at = H;
  const A = sjvOwn(), harb = A.cls === 'moor' || A.cls === 'towed' || A.cls === 'anch' || inHarbour(A.p), gsA = gridScale(A.p);
  const auto = !!(S.plan && b.status === 'sailing' && !(typeof helmOn === 'function' && helmOn()) && !S.plan.replan);
  const seen = new Set(); let best = null;
  for (const n0 of list){
    if (sjvSkip(n0)) continue;
    if (Math.abs(n0.p.x - A.p.x) > SJV.RW * 1.5 * gsA || Math.abs(n0.p.y - A.p.y) > SJV.RW * 1.5 * gsA) continue;
    const E = SJV.E.get(n0.id), n = E ? sjvPose(n0, E, H) : n0, prev = SJV.sits.get(n0.id);
    const o = {prev:prev && (prev.sit === '13a' || prev.sit === '13b') ? prev.sit : null, gs:gsA};
    let R = colregSit(A, n, o);
    if (R.rng > SJV.RW * 1000 && !E) continue;
    // (the roles stay as they were when the risk began, while the encounter lasts: a manoeuvre that changes the bearings must not make
    // the one that gave way the one to stand on, rule 17 a; 13 d says it outright for overtaking)
    if (prev && prev.give){ R.sit = prev.sit; R.give = prev.give; }
    // the narrow channel only where it matters: a long one near, with a risk
    if (!prev && R.risk && R.rng < 2500 && (n.L >= 40 || A.L >= 40) && R.sit !== '13a' && R.sit !== '13b'){ o.narrowB = sjvNarrow(n, H); o.narrowA = A.L >= 40 && sjvNarrow({id:'_own', p:A.p, hd:A.hd, L:A.L}, H); if (o.narrowA || o.narrowB) R = colregSit(A, n, o); }
    seen.add(n0.id);
    // the encounter: kept while it lasts (13 d), with the least clearance between the hulls for the near miss (about 50 m, Ø11.7)
    const clr = R.rng - ((A.L || 10) + (n.L || 10)) / 4;
    let s = prev; if (!s && R.risk && R.rng < SJV.RW * 1000){ s = {sit:R.sit, give:R.give, t:H, clr, nm:false}; SJV.sits.set(n0.id, s); }
    if (s){ s.t = H; s.clr = Math.min(s.clr, clr);
      if (!harb && !s.nm && s.clr < SJV.NEAR && Math.max(A.v || 0, n.v || 0) >= 2){ s.nm = true; sjvNearMiss(n, R, s.clr); }
      if (R.tcpa < 0 && R.rng > 1.5 * R.lim) SJV.sits.delete(n0.id); }
    // the NPC's part: give way within about a kilometre (16), or stand on and act only when it is clear the boat you follow does not
    // (17 a ii, b), never in harbour, and back when it is past and clear
    if (E){
      if (E.t1 == null && (harb || (R.tcpa <= 0 && R.rng > R.lim) || R.rng > 2500 || H - E.t0 > SJV.TMAX)) E.t1 = H;
      // (still not enough, with her on the shared course at the full offset: more, as long as there is room)
      else if (E.t1 == null && !E.slow && E.tgt < SJV_OFFMAX - 0.01 && (R.give === 'b' || R.give === 'both')){
        const want = Math.max(1.5 * R.lim, R.lim + 60), Rf = colregSit(A, Object.assign({}, n0, {p:{x:n0.p.x + E.nx * E.tgt, y:n0.p.y + E.ny * E.tgt}}), o);
        if (Rf.tcpa > 0 && Rf.cpa < want){ const k = sjvNeed(Rf, n0.hd, E.side, want, 'b', gsA), t = Math.min(SJV_OFFMAX, E.tgt + (k == null ? 0.15 : k));
          if (t > E.tgt + 0.04 && sjvRoom(n0, E.nx / E.tgt * t, E.ny / E.tgt * t, t)) E.tgt = t; }
      }
      if (E.t1 != null && sjvOffAt(E, H) <= 1e-6 && sjvLagAt(E, H) <= 1e-6) SJV.E.delete(n0.id);
    } else if (!harb && sjvCan(n0) && !inHarbour(n0.p) && R.risk && sjvLive()){
      const closeK = (Math.hypot(R.vx, R.vy) / gsA) / 60;   // km a game minute between them
      if ((R.give === 'b' || R.give === 'both') && R.rng <= SJV.RNPC * 1000 && R.tcpa <= 8) SJV.E.set(n0.id, sjvStart(n0, R, H, 'b', R.sit, false));
      else if (R.give === 'a' && R.rng <= Math.max(350, closeK * 1000) && R.tcpa <= 1.5 && R.cpa < 0.7 * R.lim) SJV.E.set(n0.id, sjvStart(n0, R, H, 'b', '17', false));
    }
    // Autonav's part: the vessels the boat you follow gives way for (16), within 1.2 km
    if (auto && !harb && sjvLive() && (!SJV.own || SJV.own.id === n0.id)){
      const O = SJV.own;
      if (O){ if (O.t1 == null && ((R.tcpa <= 0 && R.rng > R.lim) || R.rng > 2500 || H - O.t0 > SJV.TMAX)) O.t1 = H; }
      else if ((R.give === 'a' || R.give === 'both') && R.risk && R.rng <= SJV.ROWN * 1000 && R.tcpa <= 8) SJV.own = sjvStart(A, R, H, 'a', R.sit, true, n0.id);
    }
    // the warning: the risk within the window and three kilometres; the one closest in time
    if (!harb && R.risk && R.tcpa <= SJV.TW && R.rng <= SJV.RW * 1000 && (R.give !== 'b' || R.rng <= 1500) && (!best || R.tcpa < best.R.tcpa)) best = {n, R};
  }
  for (const id of SJV.E.keys()) if (!seen.has(id)){ const E = SJV.E.get(id); if (E.t1 == null) E.t1 = H; if (H - E.t1 > 0.1) SJV.E.delete(id); }
  for (const [id, s] of SJV.sits) if (!seen.has(id) && H - s.t > 0.05) SJV.sits.delete(id);
  if (SJV.own && (!auto || harb || (!seen.has(SJV.own.id) && SJV.own.t1 == null))) SJV.own.t1 = SJV.own.t1 == null ? H : SJV.own.t1;
  if (SJV.own && SJV.own.t1 != null && Math.abs(SJV.ownOff) < 1) SJV.own = null;   // (back on the line: the next may start)
  // (the one warned for stays while its CPA is not clearly open, so it does not blink, and while she or Autonav gives way for the other
  // till they are past: the player sees why the boat turns, or why the other does)
  const W = SJV.warn;
  if (W && !best){ const n = list.find(q => q.id === W.id), E = n && SJV.E.get(n.id), m = n && (E ? sjvPose(n, E, H) : n), s = SJV.sits.get(W.id);
    if (m && !harb){ const R = colregSit(A, m, {prev:W.R.sit === '13a' || W.R.sit === '13b' ? W.R.sit : null, gs:gsA}); if (s && s.give){ R.sit = s.sit; R.give = s.give; }
      const acting = (E && E.t1 == null) || (SJV.own && SJV.own.id === W.id && SJV.own.t1 == null);
      if (R.tcpa > -0.2 && (R.cpa < 1.3 * R.lim || (acting && R.tcpa > 0)) && R.rng <= SJV.RW * 1000) best = {n:m, R}; } }
  if (best){ const R = best.R, own = SJV.own && SJV.own.id === best.n.id && SJV.own.t1 == null;
    const close = R.give === 'b' && R.rng < R.lim && R.tcpa < 1 && R.cpa < 0.5 * R.lim;   // 17 b: the one that stands on must act too
    if (!W || W.id !== best.n.id) SJV.n++;
    SJV.warn = {id:best.n.id, name:best.n.name, R, sit:R.sit, give:R.give, cpa:Math.round(R.cpa / 10) * 10, tcpa:R.tcpa, rng:Math.round(R.rng), cls:R.clsB, ownCls:R.clsA, auto:own, close,
      sev:close || ((R.give === 'a' || R.give === 'both' || R.give === 'none') && !own) ? 'r2' : 'r1', H, p:best.n.p, cog:best.n.cog != null ? best.n.cog : best.n.hd, v:best.n.v};
  } else SJV.warn = null;
  SJV.ms = t0 ? performance.now() - t0 : 0;
}
// a passing under about 50 m clear (Ø11.7 shows them): kept with the game, 40 at most
function sjvNearMiss(n, R, clr){
  if (!S.nearMiss) S.nearMiss = [];
  S.nearMiss.push({t:S.t, x:Math.round(S.boat.pos.x * 1000) / 1000, y:Math.round(S.boat.pos.y * 1000) / 1000, vid:S.cur, name:String(n.name || ''), m:Math.max(0, Math.round(clr)), sit:R.sit, give:R.give});
  if (S.nearMiss.length > 40) S.nearMiss.splice(0, S.nearMiss.length - 40);
}

// the coastal ship's and the ferry's length, beam and draught (m), as their AIS card has them (03-map.js aisInfo)
const SJV_SIZE = {coastal:[121.8, 21.0, 4.9], ferry:[49.9, 12.4, 3.1]};
// npcStates' one call (05-vessels.js): the classes, a look now and then, and the NPCs that give way where they are now. A track or a
// single boat asked for (only) is the shared course as the clock has it
function colregNpc(H, out, only){
  if (only || !S || !S.boat || !S.boat.pos) return out;
  const gear = new Set(); for (const g of NPCGEAR) gear.add(g.id);
  for (const n of out) if (!n.cls){ if (n.L == null && (n.type === 'coastal' || n.type === 'ferry')){ const q = SJV_SIZE[n.type]; n.L = q[0]; n.B = q[1]; n.T = q[2]; }
    if (n.coast && !n.kv && n.st === 'fishing' && gear.has(n.id)) n.gear = true; n.cls = colregCls(n); }
  const live = sjvLive();
  if (live && (H - SJV.at >= 0.0015 || H < SJV.at - 0.01)) sjvEval(H, out);
  else if (!live && (SJV.E.size || SJV.warn || SJV.own)){ SJV.E.clear(); SJV.own = null; SJV.ownOff = 0; SJV.warn = null; }
  if (!SJV.E.size){ if (SJV.warn) sjvTrack(out); return out; }
  const res = out.map(n => { const E = SJV.E.get(n.id); return E ? sjvPose(n, E, H) : n; });
  if (SJV.warn) sjvTrack(res);
  return res;
}
// where the one warned for is in the list just made (the chart and the little chart draw her ring there)
function sjvTrack(list){ const W = SJV.warn, n = list.find(q => q.id === W.id); if (n){ W.p = n.p; W.cog = n.cog != null ? n.cog : n.hd; W.v = n.v; } }

// ---- Autonav ----
// the look kept fresh for Autonav when no view asks for the vessels (the 3D view and the chart plotter ask every frame; the phone over a
// paused view, or a test without either, does not): from her own steps, for the boat you follow only (the manoeuvring model has only
// her; the minute step only once a look has been made for this vessel), at the same pace as the views'
function sjvFresh(model){
  if (!sjvLive() || (SJV.vid !== S.cur && !(model && SJV.vid == null))) return;
  const H = (S.t + (typeof liveFrac === 'function' ? liveFrac() : 0)) / 60;
  if (H - SJV.at >= 0.0015 || H < SJV.at - 0.01) npcStates(H);
}
// the manoeuvring model's autopilot (16b-dyn.js dynAuto), each step h (game s): the offset off the line it steers for (m, starboard +) and
// the speed it may have (m/s). The offset follows the manoeuvre at her speed across at 35 degrees, and goes back to the line when it is
// over, near a stop (six lengths, at least 150 m), when she backs or turns off the shore (T.bow), or when the ground is close ahead of
// her (looked for once a game second, as far as she needs to stop and 60 m more): then she slackens off instead (8 e)
function sjvAuto(d, h, ds, T){
  sjvFresh(true); const O = SJV.own; if (!O && Math.abs(SJV.ownOff) < 0.01) return null;
  const L = BOAT.len || 10, near = ds < Math.max(150, 6 * L) || (T && T.bow);
  let tgt = O && O.t1 == null && !O.slow && !near ? O.side * O.tgt * 1000 : 0;
  if (tgt && (SJV.ownChk -= h) <= 0){ SJV.ownChk = 1;
    const look = Math.max(60, Math.abs(d.u) * 20) / 1000, a = {x:d.X / 1000, y:d.Y / 1000}, q = {x:a.x + Math.sin(d.psi) * look, y:a.y - Math.cos(d.psi) * look};
    let gp = null; try { gp = groundCheck(a, q); } catch (e){ gp = a; } if (gp){ O.slow = true; tgt = 0; } }
  const rate = Math.max(0.5, Math.abs(d.u)) * Math.tan(SJV_TH) * h;
  SJV.ownOff += clamp(tgt - SJV.ownOff, -rate, rate);
  const v = O && O.slow && O.t1 == null && !near ? Math.max(1, 0.4 * ((S.plan && S.plan.speed) || BOAT.vcruise || 6) * KN_MS) : 1e9;
  return {off:SJV.ownOff, v};
}
// the minute step (05-vessels.js sail), when the model is not running: she turns 35 degrees off the leg until she stands the offset off it,
// then heads on; back, the leg's own heading takes her to the next waypoint. Not near a stop. True when this moved her
function sjvSail(pl, b, left){
  sjvFresh(false); const O = SJV.own; if (!O || O.t1 != null || S.cur !== SJV.vid || !sjvLive()) return false;
  const w = pl.wps[pl.idx]; if (!w) return false; const d = dist(b.pos, w); if (d < 3 * left || (wpStop(w) && d < 0.5)) return false;
  const hd0 = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y)), gs = gridScale(b.pos);
  let hd = hd0, L = left;
  if (O.slow) L = left * 0.4;
  else if ((O.mo || 0) < O.tgt * gs){ hd = hd0 + O.side * SJV_TH; O.mo = (O.mo || 0) + left * Math.sin(SJV_TH); }
  const to = {x:b.pos.x + Math.sin(hd) * L, y:b.pos.y - Math.cos(hd) * L};
  let gp = null; try { gp = groundCheck(b.pos, to); } catch (e){ gp = to; }
  if (gp){ O.slow = true; return false; }
  b.pos = to; b.heading = hd; return true;
}

// ---- the warning's words (the strip, the box and the card, the chart plotter) ----
// how: 'tiny' (the phone upright's strip, 47 vw), 'strip', 'box' (with the name)
function sjvSay(W, how){
  const no = S.lang !== 'en', L = (a, c) => no ? a : c, tiny = how === 'tiny', g = W.give, auto = W.auto;
  const you = auto ? L('Autonav viker', 'Autonav gives way') : tiny ? L('vik', 'give way') : L('du viker', 'give way');
  let t;
  if (tiny && auto && !W.close) return L('Autonav viker', 'Autonav gives way');   // (the strip is narrow: the CPA beside it says the rest)
  if (W.close) t = L('For nær: gjør noe nå', 'Too close: act now');
  else if (g === 'a' || (g === 'both' && auto)){
    const cw = W.cls === 'fish' ? L('Fiskefartøy', 'Fishing vessel') : W.cls === 'nuc' ? L(tiny ? 'Ute av kontroll' : 'Ikke under kommando', 'Not under command') : W.cls === 'ram' ? L(tiny ? 'Kan ikke vike' : 'Begrenset manøvreringsevne', tiny ? 'Cannot give way' : 'Restricted manoeuvrability') : '';
    const what = (W.sit === '2' || W.sit === '18') && cw ? cw : {'15':L(tiny ? 'Fra styrbord' : 'Kryssende fra styrbord', tiny ? 'From starboard' : 'Crossing from starboard'), '14':L('Møtende', 'Head-on'), '13a':L(tiny ? 'Innhenter' : 'Du innhenter', tiny ? 'Overtaking' : 'You are overtaking'),
      '9a':L('Trang lei', 'Narrow channel'), '18d':L(tiny ? 'Dypgående' : 'Hemmet av dypgående', tiny ? 'Deep draught' : 'Constrained by draught'), '2':L('Ligger stille', 'Lying still')}[W.sit]
      || cw || L('Fare for sammenstøt', 'Risk of collision');
    const act = W.sit === '9a' || W.sit === '18d' ? (auto ? you : L('gå av veien', 'keep out of the way')) : W.sit === '13a' ? (auto ? you : L('hold klar', 'keep clear')) : W.sit === '14' && !auto ? L(tiny ? 'vik til SB' : 'vik til styrbord', tiny ? 'go starboard' : 'alter to starboard') : W.sit === '2' && !auto && !cw ? L('gå klar', 'keep clear') : you;
    t = what + ': ' + act;
  }
  else if (g === 'both') t = W.sit === '18c' ? L('Begge fisker: hold avstand', 'Both fishing: keep apart') : L(tiny ? 'Møtende: vik til SB' : 'Møtende: begge viker til styrbord', tiny ? 'Head-on: go starboard' : 'Head-on: both alter to starboard');
  else if (g === 'b'){
    const hold = tiny ? L('hold kurs', 'stand on') : L('hold kurs og fart', 'keep course and speed');
    const ow = W.ownCls === 'fish' ? L(tiny ? 'Du fisker: de viker' : 'Du fisker: den andre viker', tiny ? 'Fishing: they give way' : 'You are fishing: the other gives way') : W.ownCls === 'nuc' ? L(tiny ? 'Ute av kontroll' : 'Ikke under kommando: de andre viker', tiny ? 'Not under command' : 'Not under command: the others keep clear') : '';
    t = (W.sit === '2' || W.sit === '18') && ow ? ow : {'15':L(tiny ? 'Fra babord' : 'Kryssende fra babord', tiny ? 'From port' : 'Crossing from port') + ': ' + hold, '13b':L('Innhentes', 'Being overtaken') + ': ' + hold, '9b':L('Trang lei: den andre viker', 'Narrow channel: the other keeps clear'),
      '18d':L('Den andre viker', 'The other keeps clear'), '2':L(tiny ? 'Du ligger stille' : 'Du ligger stille: den andre viker', tiny ? 'Lying still' : 'You lie still: the other keeps clear')}[W.sit]
      || ow || L('Den andre viker', 'The other gives way');
  }
  else t = L('Fare for sammenstøt', 'Risk of collision');
  return how === 'box' ? t + ' · ' + String(W.name || '') : t;
}
// the time to the CPA in real time, as the strip says the next event («om 40 s», «om 1 min»)
function sjvWhen(W){ const s = Math.max(0, Math.round(W.tcpa * 60 / GAME_RATE)), no = S.lang !== 'en'; return s < 60 ? (no ? 'om ' : 'in ') + s + ' s' : (no ? 'om ' : 'in ') + Math.round(s / 60) + ' min'; }
// the warning now, while the game runs (none in the time away)
function sjvWarn(){ return sjvLive() && S.boat && S.boat.status !== 'port' ? SJV.warn : null; }
