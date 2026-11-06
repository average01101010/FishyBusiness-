// ---------- the rules of the road: who gives way, and the NPCs and Autonav that do (Ø11.1, docs/systemer/sjofart-og-lover.md) ----------
// Sjøveisreglene, FOR-1975-12-01-5 (https://lovdata.no/dokument/SF/forskrift/1975-12-01-5), rules 1-18 and 19 a-c read word for word
// 06.11.2026. The class of a vessel by rule 3 and 18 (colregCls), the situation between two of them by rules 13, 14, 15, 18 and 9 b-c with
// the closest point of approach (colregSit), and what follows (Jonas' choices V2 A and npc-flåten 4 A): the NPCs within about a kilometre
// of the boat you follow give way when they must and hold their course and speed when she must, as a local deviation on the shared
// clock's position that is never kept or sent; Autonav (and the operations plan, which sails by it) gives way for the vessels it must
// and comes back to the route. Only with the game open and running (prinsipp 4): in catchUp nothing gives way and nothing is counted.
// The warning in the strip, the box and the chart plotter comes only when the CPA is under the limit and the time to it a few minutes,
// never in harbour.
// Ø11.2 (rules 19 d-e, 20-37, vedlegg I and III and kap. II 53 d read word for word 06.11.2026): the sight (how far a vessel is seen by
// day and by her lanterns at night, sjvSeenKm), restricted visibility and rule 19 for the vessels not in sight (colregSit o.fog, sjvSide),
// a safe speed for Autonav and the minimum steerage speed after a fog signal ahead (sjvCapV, through sjvAuto and sjvSail), the sound
// signals of rules 34 and 35 queued for the sound (SJV.sig, ui/10e-sound.js), and what an NPC's lanterns show (sjvLanternSt).

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
  TW:6, RNPC:1.0, ROWN:1.2, RW:3, NEAR:50, TMAX:0.25,
  // Ø11.2: restricted visibility under 2 nautical miles (km; the rules give no figure, 3 l names fog, snow and heavy rain), and for the
  // vessels not in sight in it (rule 19) the window, the warning's and the manoeuvres' reach and the time to the CPA they start at
  FOG:2 * NM, TWF:10, RWF:5, RNPCF:1.6, ROWNF:1.8, TSF:12,
  vis:50, fog:false, night:false,   // the sight at the last look (km), restricted visibility, dark (the sun 6 degrees under)
  sig:[], sigN:0, sigLog:[],        // the sound signals for the sound to play (ui/10e-sound.js), how many since the page opened, the last 30
  fogT:new Map(), heard:new Map(),  // each vessel's beat for her fog signal; the fog signals heard forward of the beam (19 e): id -> H
  e19:null, cap:0, fogSaid:false, fogLogT:-1e9   // 19 e: the vessel she slows for; the safe speed (m/s, 0 none); the logbook's line
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
// o.fog (Ø11.2): they are not in sight of each other in or near restricted visibility. Then avsnitt II (11-18, overtaking among them) does
// not apply but rule 19 (19 a: «gjelder for fartøy som ikke er i sikte av hverandre»): every vessel that finds a risk «skal … i god tid ta
// forholdsregler» (19 d), so both act; one that cannot manoeuvre (not under command, restricted) leaves it to the other. Rule 9 (avsnitt
// I) still comes first
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
  else if (!o.fog && (o.prev === '13a' || (o.prev !== '13b' && closing && Math.abs(relB) > SJV_ABAFT))){ sit = '13a'; give = 'a'; }
  else if (!o.fog && (o.prev === '13b' || (closing && Math.abs(relA) > SJV_ABAFT))){ sit = '13b'; give = 'b'; }
  else if (o.narrowB && (a.L < 20 || clsA === 'fish') && clsA !== 'nuc' && clsA !== 'ram'){ sit = '9a'; give = 'a'; }
  else if (o.narrowA && (b.L < 20 || clsB === 'fish') && clsB !== 'nuc' && clsB !== 'ram'){ sit = '9b'; give = 'b'; }
  else if (o.fog){ sit = '19'; const ca = clsA !== 'nuc' && clsA !== 'ram', cb = clsB !== 'nuc' && clsB !== 'ram'; give = ca && cb ? 'both' : ca ? 'a' : cb ? 'b' : 'none'; }
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
// opens most (13 says nothing of the side). In restricted visibility (19 d) by where the other is from her bow (sjvSide19)
function sjvSide(R, hd, mover, want, gs){
  if (R.sit === '19'){ const rel = mover === 'a' ? R.relA : R.relB, ov = R.closing && Math.abs(mover === 'a' ? R.relB : R.relA) > SJV_ABAFT, s19 = sjvSide19(rel, ov); if (s19) return s19; }
  else if (!(R.sit === '13a' || R.sit === '13b' || R.sit === '18' || R.sit === '18d' || R.sit === '2')) return 1;
  const s = sjvNeed(R, hd, 1, want, mover, gs), p = sjvNeed(R, hd, -1, want, mover, gs);
  return s == null && p != null ? -1 : s != null && p != null && p < s - 0.1 ? -1 : 1;
}
// 19 d: «Når slik forholdsregel er en kursforandring, skal såvidt mulig følgende unngås: i. en kursforandring til babord for et fartøy som
// er forenom tvers unntatt for et fartøy som blir innhentet, ii. en kursforandring mot et fartøy som er tvers eller aktenfor tvers.» rel:
// the other's bearing from her bow (radians, starboard +); ov: she is overtaking the other. +1 starboard, -1 port, 0 either (the side that
// opens most): forward of the beam to starboard (either when she overtakes it), abeam or abaft away from it
function sjvSide19(rel, ov){ if (Math.abs(rel) < Math.PI / 2) return ov ? 0 : 1; return rel > 0 ? -1 : 1; }

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
// still room on the way she is going (each look, while she stands off her course): her course by the clock 0 to 450 m ahead, laid over
// with the offset she has now, is sea deep enough for her (her draught and a metre) and outside the harbours, every 150 m. Room for the
// way back is in it: at the turn's rate she is back on her course within about 1.4 times the offset along it
function sjvRoomOn(n, E, H){
  const off = sjvOffAt(E, H); if (off < 0.02) return true;
  const kmh = Math.max(2, n.v || 0) * NM, T = (n.T || 2) + 1, tl = typeof tideCD === 'function' ? tideCD(S.t / 60) : 0;
  try {
    for (const s of [0, 0.15, 0.3, 0.45]){
      const q0 = s ? npcStates(H + s / kmh, n.id)[0] : n; if (!q0 || !q0.p) return false;
      const q = {x:q0.p.x + E.nx * off, y:q0.p.y + E.ny * off};
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

// ---- Ø11.2: the sight, the lanterns and the sound signals (pure; sjvEval and the views use them) ----
// the range a lantern must be seen at (rule 22, nautical miles) by her kind (vessel3d.js lanterns' kinds) and the vessel's length (m):
// the masthead light 6 miles from 50 m, 5 from 20 m, 3 from 12 m, else 2 (the all-round white under 12 m too); the sides 3, 2 and under
// 12 m 1; the stern light and the all-round lights 3 from 50 m, else 2; the coast guard's blue light 2 (kap. II, 53 d)
function sjvLampNm(k, L){
  L = L || 10;
  if (k === 'masthead' || k === 'masthead2' || k === 'main') return L >= 50 ? 6 : L >= 20 ? 5 : L >= 12 ? 3 : 2;
  if (k === 'side') return L >= 50 ? 3 : L >= 12 ? 2 : 1;
  if (k === 'kv') return 2;
  return L >= 50 ? 3 : 2;
}
// how far a lantern made for D0 nautical miles is seen in a meteorological visibility of vis km (nautical miles). Vedlegg I 8: «I = 3,43
// x 10^6 x T x D² x K^-D», T «terskelfaktor 2 x 10^-7 lux», K «atmosfærisk transmisjon … 0,8, som tilsvarer en meteorologisk sikt på
// omkring 13 nautiske mil»: the lantern's candela from D0 at K 0.8, then the D that gives it at the K of this visibility (a mile's
// transmission: 0.05, the contrast at the edge of the visibility, to the power of a mile over it; 0.05^(1/13) is 0.79)
function sjvLightNm(D0, vis){
  const I = 0.686 * D0 * D0 * Math.pow(0.8, -D0), K = Math.pow(0.05, NM / Math.max(0.05, vis)), f = D => 0.686 * D * D * Math.pow(K, -D) - I;
  let lo = 0, hi = Math.max(3 * D0, 1); if (f(hi) < 0) return hi;
  for (let i = 0; i < 40; i++){ const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
// how far a vessel of L m is seen (km): by day the visibility; in the dark her lanterns (the main white light's range in it)
function sjvSeenKm(L, vis, dark){ return dark ? sjvLightNm(sjvLampNm('main', L), vis) * NM : vis; }
// how far her whistle is heard (vedlegg III 1 c, nautical miles): 2 from 200 m, 1.5 from 75 m, 1 from 20 m, else 0.5
function sjvHearNm(L){ L = L || 10; return L >= 200 ? 2 : L >= 75 ? 1.5 : L >= 20 ? 1 : 0.5; }
// the fog signal (rule 35) by her class (colregCls; 'towed' the boat you follow on the rescue boat's line) and speed: making way one
// long (a), stopped under way two long (b), not under command, restricted, constrained by her draught or engaged in fishing one long and
// two short (c), towed and manned one long and three short (e), at anchor the bell (g); moored, none. Patterns: L a long blast (4-6 s,
// rule 32 c), S a short (about 1 s, 32 b), 'bell'
function sjvFogPat(c, v, L){
  if (c === 'moor') return null;
  if (c === 'anch') return 'bell';
  if (c === 'towed') return 'LSSS';
  if (c === 'fish' || c === 'nuc' || c === 'ram' || c === 'cbd') return 'LSS';
  return (v || 0) >= 0.5 ? 'L' : 'LL';
}
// the manoeuvring signal (34 a): «et kort støt … Jeg forandrer kurs til styrbord», two to port, three «Jeg bruker maskinkraften akterover»
// (she takes the way off her when there is no room to turn: an assumption, she backs to slow down)
function sjvManPat(side, slow){ return slow ? 'SSS' : side < 0 ? 'SS' : 'S'; }
// what her lanterns show (rules 23-30, lit by vessel3d.js lanterns; view3d/22-docks-air.js drawNPCLights): by her class, so a coast boat
// jigging shows the lights of a power-driven vessel and not the fishing lights (26 e), a trawler towing green over white (26 b), the
// sides and stern only when making way (26, 27: v), the one at the quay none; kv: the coast guard's blue all-round light while she is on
// her inspection (kap. II 53 d: «under kontroll med fiske»); ram: red, white, red (27 b, drawn by the view)
function sjvLanternSt(n){ const c = n.cls || colregCls(n); return {port:c === 'moor', fishing:c === 'fish', trawl:c === 'fish' && !!n.trawl, v:n.v || 0, anch:c === 'anch', nuc:c === 'nuc', ram:c === 'ram', cbd:c === 'cbd', kv:!!n.kv}; }
// the minimum steerage speed (19 e «minste styrefart», knots): a third of her cruising speed, 2 to 4 knots (an assumption)
function sjvMinKn(){ return clamp(0.3 * ((typeof BOAT !== 'undefined' && BOAT.vcruise) || 7), 2, 4); }
// the safe speed in restricted visibility (rules 6 and 19 b, m/s): what she can stop from within half the distance she sees (the old
// rule of thumb; the rules give no figure), from her own stopping distances (16b-dyn.js dynCal, dynVStop); never under the minimum steerage
function sjvSafeMs(dM){
  let v = null; try { v = dynVStop(dynCal(S.boat.type), dM / 2); } catch (e){}
  if (v == null || !isFinite(v)){ const L = (typeof BOAT !== 'undefined' && BOAT.len) || 10, vc = ((typeof BOAT !== 'undefined' && BOAT.vcruise) || 7) * KN_MS; v = vc * Math.sqrt(Math.max(0, dM / 2) / (4 * L)); }
  return Math.max(sjvMinKn() * KN_MS, v);
}
// the visibility (km) and the dark at p (the sun more than 6 degrees under: past the civil twilight)
function sjvVisAt(H, p){ try { const v = visibility(H, p); return isFinite(v) ? v : 50; } catch (e){ return 50; } }
function sjvDark(H, p){ try { return sunAt(H, p).el < -6; } catch (e){ return false; } }
const sjvHash = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
// a sound signal for the sound to play (ui/10e-sound.js takes them from SJV.sig): the pattern, where (grid km), her length, and whether
// it is the boat you follow's own
function sjvSig(id, pat, p, L, own){
  const e = {pat, x:p.x, y:p.y, L:L || 10, own:!!own, id, t:Date.now()};
  SJV.sig.push(e); SJV.sigN++; if (SJV.sig.length > 12) SJV.sig.splice(0, SJV.sig.length - 12);
  SJV.sigLog.push({pat, id, own:!!own, H:S.t / 60}); if (SJV.sigLog.length > 30) SJV.sigLog.splice(0, SJV.sigLog.length - 30);
}
// rule 35 («I eller nær farvann med nedsatt sikt … enten det er dag eller natt»): each vessel within hearing of the boat you follow
// sounds her signal «minst hvert annet minutt» (game minutes: the boats move at the game's pace), on a beat of her own from her id,
// and the boat you follow hers. One heard apparently forward of her beam from a vessel not in sight is kept for 19 e
function sjvFogSigs(H, list, A, gs, vis, dark){
  const sec = H * 3600;
  for (const n of list){
    if (n.hidden || !n.p) continue;
    const L = n.L || 10, pat = sjvFogPat(n.cls || colregCls(n), n.v, L), rng = Math.hypot(n.p.x - A.p.x, n.p.y - A.p.y) / gs * 1000;
    if (!pat || rng > sjvHearNm(L) * NM * 1000){ SJV.fogT.delete(n.id); continue; }
    const h = sjvHash(n.id), per = pat === 'bell' ? 50 + h % 8 : 100 + h % 18, slot = Math.floor((sec + h % per) / per), was = SJV.fogT.get(n.id);
    SJV.fogT.set(n.id, slot); if (was == null || was === slot) continue;
    sjvSig(n.id, pat, n.p, L, false);
    const rel = sjvWrap(Math.atan2(n.p.x - A.p.x, -(n.p.y - A.p.y)) - A.hd);
    if (Math.abs(rel) < Math.PI / 2 && rng > sjvSeenKm(L, vis, dark) * 1000) SJV.heard.set(n.id, H);
  }
  const pat = sjvFogPat(A.cls, A.v, A.L);
  if (pat){ const per = pat === 'bell' ? 55 : 110, slot = Math.floor(sec / per), was = SJV.fogT.get('_own'); SJV.fogT.set('_own', slot); if (was != null && was !== slot) sjvSig('_own', pat, A.p, A.L, true); }
  if (SJV.fogT.size > 400) SJV.fogT.clear(); if (SJV.heard.size > 200) SJV.heard.clear();
}
// the speed Autonav may have now (m/s; 1e9 for none): after a fog signal ahead the minimum steerage, or nothing when she is close (19 e),
// else the safe speed in restricted visibility; only with the game open and running, for the boat the look is for
function sjvCapV(){
  if (!sjvLive() || SJV.vid !== S.cur || !SJV.fog) return 1e9;
  const e = SJV.e19; if (e && !e.off) return e.stop ? 0 : sjvMinKn() * KN_MS;
  return SJV.cap || 1e9;
}

// ---- one look: the encounters round the boat you follow (at most once a game tenth of a minute, a real second) ----
function sjvEval(H, list){
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0, b = S.boat;
  if (SJV.vid !== S.cur){ SJV.E.clear(); SJV.sits.clear(); SJV.own = null; SJV.ownOff = 0; SJV.warn = null; SJV.vid = S.cur; SJV.e19 = null; SJV.heard.clear(); SJV.fogT.clear(); }
  SJV.at = H;
  const A = sjvOwn(), harb = A.cls === 'moor' || A.cls === 'towed' || A.cls === 'anch' || inHarbour(A.p), gsA = gridScale(A.p);
  const auto = !!(S.plan && b.status === 'sailing' && !(typeof helmOn === 'function' && helmOn()) && !S.plan.replan);
  // the sight where she is (Ø11.2): the visibility, the dark, and restricted visibility (with half a kilometre's hysteresis, so it does
  // not blink at the edge)
  const vis = sjvVisAt(H, A.p), dark = sjvDark(H, A.p), fog = SJV.fog = SJV.fog ? vis < SJV.FOG + 0.5 : vis < SJV.FOG; SJV.vis = vis; SJV.night = dark;
  const RWX = fog ? SJV.RWF : SJV.RW;
  const seen = new Set(); let best = null, e19 = null;
  for (const n0 of list){
    if (sjvSkip(n0)) continue;
    if (Math.abs(n0.p.x - A.p.x) > RWX * 1.5 * gsA || Math.abs(n0.p.y - A.p.y) > RWX * 1.5 * gsA) continue;
    const E = SJV.E.get(n0.id), n = E ? sjvPose(n0, E, H) : n0, prev = SJV.sits.get(n0.id);
    const o = {prev:prev && (prev.sit === '13a' || prev.sit === '13b') ? prev.sit : null, gs:gsA};
    // in sight of each other (rule 3 k): within the distance she is seen at, by day and by her lanterns in the dark; not in sight in or near
    // restricted visibility, rule 19 instead of avsnitt II. An encounter that began under 19 stays under it while it lasts (the roles, below)
    const sight = Math.hypot(n.p.x - A.p.x, n.p.y - A.p.y) / gsA * 1000 <= sjvSeenKm(n.L || 10, vis, dark) * 1000;
    if (fog && !sight) o.fog = true;
    let R = colregSit(A, n, o);
    const f19 = R.sit === '19' || !!(prev && prev.sit === '19'), RW = f19 ? SJV.RWF : SJV.RW, TW = f19 ? SJV.TWF : SJV.TW, TS = f19 ? SJV.TSF : 8;
    if (R.rng > RW * 1000 && !E) continue;
    // (the roles stay as they were when the risk began, while the encounter lasts: a manoeuvre that changes the bearings must not make
    // the one that gave way the one to stand on, rule 17 a; 13 d says it outright for overtaking)
    if (prev && prev.give){ R.sit = prev.sit; R.give = prev.give; }
    // the narrow channel only where it matters: a long one near, with a risk
    if (!prev && R.risk && R.rng < 2500 && (n.L >= 40 || A.L >= 40) && R.sit !== '13a' && R.sit !== '13b'){ o.narrowB = sjvNarrow(n, H); o.narrowA = A.L >= 40 && sjvNarrow({id:'_own', p:A.p, hd:A.hd, L:A.L}, H); if (o.narrowA || o.narrowB) R = colregSit(A, n, o); }
    seen.add(n0.id);
    // the encounter: kept while it lasts (13 d), with the least clearance between the hulls for the near miss (about 50 m, Ø11.7)
    const clr = R.rng - ((A.L || 10) + (n.L || 10)) / 4;
    let s = prev; if (!s && R.risk && R.rng < RW * 1000){ s = {sit:R.sit, give:R.give, t:H, clr, nm:false}; SJV.sits.set(n0.id, s); }
    if (s){ s.t = H; s.clr = Math.min(s.clr, clr);
      if (!harb && !s.nm && s.clr < SJV.NEAR && Math.max(A.v || 0, n.v || 0) >= 2){ s.nm = true; sjvNearMiss(n, R, s.clr); }
      if (R.tcpa < 0 && R.rng > 1.5 * R.lim) SJV.sits.delete(n0.id); }
    // the NPC's part: give way within about a kilometre (16), or stand on and act only when it is clear the boat you follow does not
    // (17 a ii, b), never in harbour, and back when it is past and clear
    if (E){
      if (E.t1 == null && (harb || (R.tcpa <= 0 && R.rng > R.lim) || R.rng > 2500 || H - E.t0 > SJV.TMAX)) E.t1 = H;
      // (no room ahead on the offset she stands at: back to her course now. The strip was looked at when she turned, but her course
      // bends after it, and under rule 19 the manoeuvre begins earlier and lasts longer: at Bergen in the stikkprøve 06.11.2026 a coast
      // boat 195 m off her course stood on land for half a minute)
      else if (E.t1 == null && !E.slow && !sjvRoomOn(n0, E, H)) E.t1 = H;
      // (still not enough, with her on the shared course at the full offset: more, as long as there is room)
      else if (E.t1 == null && !E.slow && E.tgt < SJV_OFFMAX - 0.01 && (R.give === 'b' || R.give === 'both')){
        const want = Math.max(1.5 * R.lim, R.lim + 60), Rf = colregSit(A, Object.assign({}, n0, {p:{x:n0.p.x + E.nx * E.tgt, y:n0.p.y + E.ny * E.tgt}}), o);
        if (Rf.tcpa > 0 && Rf.cpa < want){ const k = sjvNeed(Rf, n0.hd, E.side, want, 'b', gsA), t = Math.min(SJV_OFFMAX, E.tgt + (k == null ? 0.15 : k));
          if (t > E.tgt + 0.04 && sjvRoom(n0, E.nx / E.tgt * t, E.ny / E.tgt * t, t)) E.tgt = t; }
      }
      if (E.t1 != null && sjvOffAt(E, H) <= 1e-6 && sjvLagAt(E, H) <= 1e-6) SJV.E.delete(n0.id);
    } else if (!harb && sjvCan(n0) && !inHarbour(n0.p) && R.risk && sjvLive()){
      // (in sight she sounds her manoeuvre, 34 a: one short to starboard, two to port, three when she takes the way off)
      const closeK = (Math.hypot(R.vx, R.vy) / gsA) / 60;   // km a game minute between them
      let M = null;
      if ((R.give === 'b' || R.give === 'both') && R.rng <= (f19 ? SJV.RNPCF : SJV.RNPC) * 1000 && R.tcpa <= TS) M = sjvStart(n0, R, H, 'b', R.sit, false);
      else if (R.give === 'a' && R.rng <= Math.max(350, closeK * 1000) && R.tcpa <= 1.5 && R.cpa < 0.7 * R.lim) M = sjvStart(n0, R, H, 'b', '17', false);
      // 34 d: the one to stand on is in doubt that you give way, «minst fem korte støt med fløyten raskt etter hverandre», once
      else if (R.give === 'a' && sight && s && !s.d5 && !(SJV.own && SJV.own.id === n0.id) && R.rng <= 1500 && R.tcpa <= 2.5 && R.cpa < 0.8 * R.lim){ s.d5 = true; sjvSig(n0.id, 'SSSSS', n.p, n.L, false); }
      if (M){ SJV.E.set(n0.id, M); if (sight) sjvSig(n0.id, sjvManPat(M.side, M.slow), n.p, n.L, false); }
    }
    // Autonav's part: the vessels the boat you follow gives way for (16), within 1.2 km (1.8 under rule 19), sounding it in sight (34 a)
    if (auto && !harb && sjvLive() && (!SJV.own || SJV.own.id === n0.id)){
      const O = SJV.own;
      if (O){ if (O.t1 == null && ((R.tcpa <= 0 && R.rng > R.lim) || R.rng > 2500 || H - O.t0 > SJV.TMAX)) O.t1 = H; }
      else if ((R.give === 'a' || R.give === 'both') && R.risk && R.rng <= (f19 ? SJV.ROWNF : SJV.ROWN) * 1000 && R.tcpa <= TS){ SJV.own = sjvStart(A, R, H, 'a', R.sit, true, n0.id); if (sight) sjvSig('_own', sjvManPat(SJV.own.side, SJV.own.slow), A.p, A.L, true); }
    }
    // 19 e: a fog signal heard apparently forward of her beam from a vessel not in sight, or one forward of the beam she cannot keep out
    // of close quarters with: down to the minimum steerage speed, stopped when she is as close as the limit, «inntil faren for sammenstøt
    // er over» (the risk gone: the CPA open or past)
    if (f19 && fog && !harb && (n.v || 0) >= 1 && Math.abs(R.relA) < Math.PI / 2 && R.tcpa > 0 && R.cpa < 1.3 * R.lim && R.rng <= RW * 1000){
      const heard = SJV.heard.has(n0.id) && H - SJV.heard.get(n0.id) < 0.05;   // (within three game minutes)
      if ((heard || (R.rng < 1000 && R.cpa < 0.5 * R.lim)) && (!e19 || R.tcpa < e19.tcpa)) e19 = {id:n0.id, stop:R.rng < R.lim, tcpa:R.tcpa};
    }
    // the warning: the risk within the window and three kilometres (five under rule 19); the one closest in time
    if (!harb && R.risk && R.tcpa <= TW && R.rng <= RW * 1000 && (R.give !== 'b' || R.rng <= (f19 ? 2500 : 1500)) && (!best || R.tcpa < best.R.tcpa)) best = {n, R};
  }
  // 19 e kept while it holds, at most as long as a manoeuvre (then she goes on at the safe speed)
  if (e19){ const was = SJV.e19; e19.t0 = was && was.id === e19.id ? was.t0 : H; e19.off = H - e19.t0 > SJV.TMAX; }
  SJV.e19 = e19;
  // the fog signals (rule 35), and Autonav's safe speed (6, 19 b) from what she sees: the visibility by day, the lanterns of a small
  // boat in the dark. A line in the logbook when it begins (once in three game hours at most)
  if (fog && sjvLive()) sjvFogSigs(H, list, A, gsA, vis, dark);
  SJV.cap = fog && auto && !harb ? sjvSafeMs(sjvSeenKm(10, vis, dark) * 1000) : 0;
  if (fog && auto && !harb && !SJV.fogSaid && sjvLive()){ SJV.fogSaid = true;
    if (S.t - SJV.fogLogT > 180 && typeof log === 'function'){ SJV.fogLogT = S.t; const k = vis.toFixed(1);
      log('Nedsatt sikt (' + k.replace('.', ',') + ' km). Autonav går i sikker fart og gir tåkesignal.', 'Restricted visibility (' + k + ' km). Autonav keeps a safe speed and sounds the fog signal.', 'nav'); } }
  if (!fog) SJV.fogSaid = false;
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
      if (R.tcpa > -0.2 && (R.cpa < 1.3 * R.lim || (acting && R.tcpa > 0)) && R.rng <= RWX * 1000) best = {n:m, R}; } }
  if (best){ const R = best.R, own = SJV.own && SJV.own.id === best.n.id && SJV.own.t1 == null;
    const close = R.give === 'b' && R.rng < R.lim && R.tcpa < 1 && R.cpa < 0.5 * R.lim && R.sit !== '19';   // 17 b: the one that stands on must act too
    const e = SJV.e19 && !SJV.e19.off && SJV.e19.id === best.n.id ? SJV.e19 : null;   // 19 e for this one: Autonav slows when she sails
    if (!W || W.id !== best.n.id) SJV.n++;
    SJV.warn = {id:best.n.id, name:best.n.name, R, sit:R.sit, give:R.give, cpa:Math.round(R.cpa / 10) * 10, tcpa:R.tcpa, rng:Math.round(R.rng), cls:R.clsB, ownCls:R.clsA, auto:own, close,
      e19:!!e, stop:!!(e && e.stop), pilot:auto, fog,
      sev:close || (e && !auto) || ((R.give === 'a' || R.give === 'both' || R.give === 'none') && !own && !(e && auto)) ? 'r2' : 'r1', H, p:best.n.p, cog:best.n.cog != null ? best.n.cog : best.n.hd, v:best.n.v};
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
// her (looked for once a game second, as far as she needs to stop and 60 m more): then she slackens off instead (8 e). In restricted
// visibility the speed is no more than the safe speed, and the minimum steerage speed after a fog signal ahead (sjvCapV, Ø11.2)
function sjvAuto(d, h, ds, T){
  sjvFresh(true); const O = SJV.own, cap = sjvCapV(); if (!O && Math.abs(SJV.ownOff) < 0.01 && cap >= 1e8) return null;
  const L = BOAT.len || 10, near = ds < Math.max(150, 6 * L) || (T && T.bow);
  let tgt = O && O.t1 == null && !O.slow && !near ? O.side * O.tgt * 1000 : 0;
  if (tgt && (SJV.ownChk -= h) <= 0){ SJV.ownChk = 1;
    const look = Math.max(60, Math.abs(d.u) * 20) / 1000, a = {x:d.X / 1000, y:d.Y / 1000}, q = {x:a.x + Math.sin(d.psi) * look, y:a.y - Math.cos(d.psi) * look};
    let gp = null; try { gp = groundCheck(a, q); } catch (e){ gp = a; } if (gp){ O.slow = true; tgt = 0; } }
  const rate = Math.max(0.5, Math.abs(d.u)) * Math.tan(SJV_TH) * h;
  SJV.ownOff += clamp(tgt - SJV.ownOff, -rate, rate);
  const v = O && O.slow && O.t1 == null && !near ? Math.max(1, 0.4 * ((S.plan && S.plan.speed) || BOAT.vcruise || 6) * KN_MS) : 1e9;
  return {off:SJV.ownOff, v:Math.min(v, cap)};
}
// the minute step (05-vessels.js sail), when the model is not running: she turns 35 degrees off the leg until she stands the offset off it,
// then heads on; back, the leg's own heading takes her to the next waypoint. Not near a stop. True when this moved her. Under the safe
// speed or the minimum steerage speed (sjvCapV, Ø11.2) the minute is that much shorter, with or without a manoeuvre (sjvCreep)
function sjvSail(pl, b, left){
  sjvFresh(false); const O = SJV.own, cap = sjvCapV(), v0 = b.v || 0, f = cap < 1e8 && v0 > 0.1 ? Math.min(1, cap / KN_MS / v0) : 1;
  if (!O || O.t1 != null || S.cur !== SJV.vid || !sjvLive()) return f < 0.999 ? sjvCreep(pl, b, left * f, v0 * f) : false;
  const w = pl.wps[pl.idx]; if (!w) return false; const d = dist(b.pos, w); if (d < 3 * left || (wpStop(w) && d < 0.5)) return f < 0.999 ? sjvCreep(pl, b, left * f, v0 * f) : false;
  const hd0 = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y)), gs = gridScale(b.pos);
  let hd = hd0, L = left * f;
  if (O.slow) L = L * 0.4;
  else if ((O.mo || 0) < O.tgt * gs){ hd = hd0 + O.side * SJV_TH; O.mo = (O.mo || 0) + L * Math.sin(SJV_TH); }
  const to = {x:b.pos.x + Math.sin(hd) * L, y:b.pos.y - Math.cos(hd) * L};
  let gp = null; try { gp = groundCheck(b.pos, to); } catch (e){ gp = to; }
  if (gp){ O.slow = true; return false; }
  b.pos = to; b.heading = hd; if (f < 0.999) b.v = Math.round(v0 * f * 10) / 10; return true;
}
// the minute along the leg at the slower speed (L grid km, v knots): not into a stop's last half kilometre (the harbour's own speed
// takes her there), and ground ahead leaves it to the minute step's own check (the way round). True when this moved her
function sjvCreep(pl, b, L, v){
  const w = pl.wps[pl.idx]; if (!w) return false; const d = dist(b.pos, w); if (wpStop(w) && d < 0.5) return false;
  const hd = d > 1e-6 ? Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y)) : b.heading, to = d <= L ? {x:w.x, y:w.y} : {x:b.pos.x + Math.sin(hd) * L, y:b.pos.y - Math.cos(hd) * L};
  let gp = null; try { gp = groundCheck(b.pos, to); } catch (e){ gp = to; } if (gp) return false;
  b.pos = to; b.heading = hd; b.v = Math.round(v * 10) / 10;
  if (d <= L) arrive(w);
  return true;
}

// ---- the warning's words (the strip, the box and the card, the chart plotter) ----
// how: 'tiny' (the phone upright's strip, 47 vw), 'strip', 'box' (with the name)
function sjvSay(W, how){
  const no = S.lang !== 'en', L = (a, c) => no ? a : c, tiny = how === 'tiny', g = W.give, auto = W.auto;
  const you = auto ? L('Autonav viker', 'Autonav gives way') : tiny ? L('vik', 'give way') : L('du viker', 'give way');
  let t;
  // restricted visibility, not in sight (rule 19): the turn 19 d allows (to starboard for one forward of the beam, away from one abeam or
  // abaft it), or after a fog signal ahead the minimum steerage speed (19 e)
  if (W.sit === '19' && !W.close){
    const R = W.R || {}, rel = R.relA || 0, ov = !!R.closing && Math.abs(R.relB || 0) > SJV_ABAFT, fog = tiny ? L('Tåke', 'Fog') : L('Nedsatt sikt', 'Restricted visibility');
    if (W.e19) t = W.pilot ? (tiny ? L('Tåke: Autonav sakte', 'Fog: Autonav slows') : L('Tåkesignal forut: Autonav går sakte', 'Fog signal ahead: Autonav slows down'))
      : (tiny ? L('Tåkesignal', 'Fog signal') : L('Tåkesignal forut', 'Fog signal ahead')) + ': ' + (W.stop ? L('stopp', 'stop') : tiny ? L('sakte', 'slow') : L('minste styrefart', 'minimum steerage'));
    else if (g === 'b') t = fog + ': ' + L(tiny ? 'de viker' : 'den andre viker', tiny ? 'they act' : 'the other keeps clear');
    else if (g === 'none') t = fog + ': ' + L('hold utkikk', 'keep a lookout');
    else t = fog + ': ' + (auto ? L('Autonav viker', 'Autonav gives way') : ov ? L('hold klar', 'keep clear') : Math.abs(rel) >= Math.PI / 2 && rel > 0 ? L(tiny ? 'vik til BB' : 'vik til babord', tiny ? 'go port' : 'alter to port') : L(tiny ? 'vik til SB' : 'vik til styrbord', tiny ? 'go starboard' : 'alter to starboard'));
    return how === 'box' ? t + ' · ' + String(W.name || '') : t;
  }
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
