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
// Ø11.3 (sjøloven kap. 8, §§ 161-164, read on Lovdata 06.11.2026): the contact between the hulls, the sea marks and the buoys (sjvTouch
// from 16b-dyn.js dynContact, sjvSweep from the look), the fault from the looks before the blow (sjvFault), the payment (sjvSettle),
// § 164 on the VHF and in the log (sjvVhf), and the NPC standing by after (sjvStandBy). At the end of the file.

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
  TW:6, RNPC:1.0, ROWN:1.2, RW:3, NEAR:50, TMAX:0.25, RLEAD:2.4,
  // in a harbour: the way off her for a vessel under way closing within HARB m and HARBT game minutes of the CPA (sjvEval)
  HARB:600, HARBT:3, harbNo:new Map(),   // (harbNo: a vessel she has waited a whole manoeuvre's time for, not waited for again within as long: id -> H)   // (RLEAD: how far off a manoeuvre begins by sjvLead at most, under the 2.5 km a manoeuvre ends at)
  // Ø11.2: restricted visibility under 2 nautical miles (km; the rules give no figure, 3 l names fog, snow and heavy rain), and for the
  // vessels not in sight in it (rule 19) the window, the warning's and the manoeuvres' reach and the time to the CPA they start at
  FOG:2 * NM, TWF:10, RWF:5, RNPCF:1.6, ROWNF:1.8, TSF:12,
  vis:50, fog:false, night:false,   // the sight at the last look (km), restricted visibility, dark (the sun 6 degrees under)
  sig:[], sigN:0, sigLog:[],        // the sound signals for the sound to play (ui/10e-sound.js), how many since the page opened, the last 30
  fogT:new Map(), heard:new Map(),  // each vessel's beat for her fog signal; the fog signals heard forward of the beam (19 e): id -> H
  e19:null, cap:0, fogSaid:false, fogLogT:-1e9,  // 19 e: the vessel she slows for; the safe speed (m/s, 0 none); the logbook's line
  // Ø11.3: the looks at each vessel near in the last game minutes (id -> [look], the fault is read from them), the last look's poses for
  // the sweep (id -> {H, ax, ay, ahd, bx, by, bhd}), the collisions going on (id -> {t, kn, rec}), the fixed things and buoys touched
  // (key -> H), the vessels near the manoeuvring model's steps (tl) and their clock (tc), how long an NPC stands by after a collision
  // (game hours), the minute of the last collision (the minute step holds her that minute), and how many since the page was opened
  trail:new Map(), lp:new Map(), clash:new Map(), fix:new Map(), tl:null, tc:{wall:0, H0:-1, k:0}, STAND:0.05, stopT:null, nClash:0
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
  if (E.p0) return E.off0 > 0 ? Math.max(0, E.off0 - Math.max(0, H - E.t1) * E.rate0) : 0;   // (standing by, Ø11.3: the offset she had, back after)
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
  // (standing by after a collision, Ø11.3: where she was at the blow, as the whole list had her, till the stand-by ends; after it she is
  // behind her course by the time she stood, and makes it up as after slackening off)
  if (E.p0){
    if (H <= E.t1) return Object.assign({}, n, {p:E.p0, hd:E.hd0, cog:E.hd0, v:0, give:E.why, hd0:E.hd0});
    const lag = sjvLagAt(E, H), off = sjvOffAt(E, H); let p = n.p, hd = n.hd, cog = n.cog != null ? n.cog : n.hd;
    if (lag > 1e-6){ const q = npcStates(H - lag, n.id)[0]; if (q && q.p){ p = q.p; hd = q.hd; cog = q.cog != null ? q.cog : q.hd; } }
    if (off > 1e-6) p = {x:p.x + E.nx * off, y:p.y + E.ny * off};
    return Object.assign({}, n, {p, hd, cog, v:Math.round((n.v || 0) * (lag > 1e-6 ? 1.3 : 1) * 10) / 10, give:E.why, hd0:hd});
  }
  const off = sjvOffAt(E, H), lag = sjvLagAt(E, H);
  if (off <= 1e-6 && lag <= 1e-6) return n;
  let p = n.p, hd = n.hd, cog = n.cog != null ? n.cog : n.hd, v = n.v;
  if (lag > 1e-6){ const q = npcStates(H - lag, n.id)[0]; if (q && q.p){ p = q.p; hd = q.hd; cog = q.cog != null ? q.cog : q.hd; }
    v = n.v * (E.t1 == null || H <= E.t1 ? E.f : 1.3); }
  if (off > 1e-6){ p = {x:p.x + E.nx * off, y:p.y + E.ny * off}; const ph = sjvPhase(E, H); if (ph){ hd = hd + ph * E.side * SJV_TH; cog = hd; v = n.v / Math.cos(SJV_TH); } }
  return Object.assign({}, n, {p, hd, cog, v:Math.round(v * 10) / 10, give:E.why, hd0:n.hd});   // (hd0: her course on the shared clock, Ø11.3)
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
// the way back is clear (rule 8 d: «En manøver for å unngå sammenstøt med et annet fartøy skal utføres slik at dette passeres på trygg
// avstand. Manøvrens effektivitet skal kontrolleres omhyggelig inntil det annet fartøy er endelig passert og klaret.», FOR-1975-12-01-5,
// lovdata.no …/KAPITTEL_1-2-6, read 12.11.2026). M is the one going back: her own course ({x, y} grid km, cog radians, v knots) with the
// offset off it now (ox, oy: the grid km one km of it moves her; off km) closing at rate (km an hour); Q the other ({p, cog or hd, v})
// on her course and speed.
// Both carried on in steps of 3 game seconds until the offset is gone and two minutes more: true when they are never nearer than
// lim (m) and a margin (SJV_BACK: the turn back is not instant, and the pass came out at the limit itself, 196-199 m with lim 190). The time to the CPA turning past nothing while she stands off proves nothing: on the turn back her own course may still lead
// into the other (TB1, 12.11.2026: a trawler at 12 knots giving way by rule 15 turned back with the CPA at 450 m off her course and
// passed 47 m from the boat on Autonav)
const SJV_BACK = 1.15;
function sjvBackClear(M, Q, lim, gs){
  const kA = (M.v || 0) * NM * gs, kB = (Q.v || 0) * NM * gs, off0 = Math.abs(M.off || 0), sg = (M.off || 0) < 0 ? -1 : 1, rate = Math.max(1e-3, M.rate || 0);
  const T = off0 / rate + 2 / 60, st = 0.05 / 60, lm = lim * SJV_BACK;   // (every 3 game seconds: some 30 m at 18 knots between them)
  for (let tt = 0; tt <= T + 1e-9; tt += st){
    const o = sg * Math.max(0, off0 - rate * tt);
    const ax = M.x + Math.sin(M.cog) * kA * tt + M.ox * o, ay = M.y - Math.cos(M.cog) * kA * tt + M.oy * o;
    const qc = Q.cog != null ? Q.cog : Q.hd, bx = Q.p.x + Math.sin(qc) * kB * tt, by = Q.p.y - Math.cos(qc) * kB * tt;
    if (Math.hypot(ax - bx, ay - by) / gs * 1000 < lm) return false;
  }
  return true;
}
// how early a manoeuvre must begin (game minutes to the CPA) for the one giving way at v knots to stand off as far as she needs (sjvStart:
// 1.5 times the limit) at the turn's rate, twice that and a minute (rule 8 a: «i god tid»; 16: «så tidlig som mulig»). The reach in km
// (SJV.RNPC, ROWN) is enough between two boats at sjark speeds; it begins by the time within 2.4 km (SJV.RLEAD: a manoeuvre ends beyond
// 2.5 km, and one begun further off ended, began again and sounded its signal each look); against a ship at 12 knots it was not (TB1, 12.11.2026: Autonav at 6
// knots began at 1.2 km with under 3 minutes left, stood 300 of 600 m off, and passed 86-170 m from a trawler, the limit 190 m)
function sjvLead(R, v){ const want = Math.max(1.5 * R.lim, R.lim + 60) / 1000, rate = Math.max(2, v || 0) * NM * Math.tan(SJV_TH); return 2 * want / rate * 60 + 1; }
// the way back for an NPC (n0 as the clock has her, n as she is shown): her own course with the offset she stands at; slackened off, from
// where she is at the 1.3 times her speed she makes the time up at
function sjvBackNpc(n0, n, E, H){
  const c0 = n0.cog != null ? n0.cog : n0.hd;
  if (E.slow || E.p0) return {x:n.p.x, y:n.p.y, cog:n.cog != null ? n.cog : n.hd, v:(n0.v || 0) * (sjvLagAt(E, H) > 1e-6 ? 1.3 : 1), ox:0, oy:0, off:0, rate:1};
  return {x:n0.p.x, y:n0.p.y, cog:c0, v:n0.v || 0, ox:E.nx, oy:E.ny, off:sjvOffAt(E, H), rate:E.rate};
}
// and for Autonav: the line (her heading when the manoeuvre began, from its direction across) with the offset she has off it now (the
// manoeuvring model's, or the minute step's way across)
function sjvBackOwn(A, O){
  const sx = O.nx * O.side, sy = O.ny * O.side, gs = Math.hypot(sx, sy) || 1, hd = Math.atan2(sy, sx);
  const off = O.slow ? 0 : typeof dynLive === 'function' && dynLive() ? SJV.ownOff / 1000 : O.side * (O.mo || 0) / gs;
  return {x:A.p.x - sx * off, y:A.p.y - sy * off, cog:hd, v:A.v || 0, ox:sx, oy:sy, off, rate:O.rate};
}
// a manoeuvre starts: the turn's rate is her speed across at 35 degrees (grid km an hour), the direction fixed as she turns
function sjvStart(n, R, H, mover, why, own, id){
  const gs = gridScale(n.p), want = Math.max(1.5 * R.lim, R.lim + 60);
  const side = sjvSide(R, n.hd, mover, want, gs);
  // (no offset within reach opens the CPA enough: for Autonav the speed too, 8 e «Om nødvendig … slakke farten». A ship at 12 knots
  // crossing ahead of a boat at 6 moves along the offset; with the way off her she passes ahead. TB1, 12.11.2026)
  let k = sjvNeed(R, n.hd, side, want, mover, gs); const ease = !!own && k == null; if (k == null) k = SJV_OFFMAX;
  k = Math.min(SJV_OFFMAX, k * 1.3);
  const nx = Math.cos(n.hd) * side * gs, ny = Math.sin(n.hd) * side * gs, rate = Math.max(2, n.v) * NM * Math.tan(SJV_TH);
  let room = own ? sjvRoomOwn(n, nx, ny, k) : sjvRoom(n, nx, ny, k);
  if (!room && k > 0.2){ k = Math.max(0.15, k / 2); room = own ? sjvRoomOwn(n, nx, ny, k) : sjvRoom(n, nx, ny, k); }
  return {id:id || n.id, side, nx, ny, tgt:k, rate, t0:H, t1:null, why, slow:!room, ease, f:0.35, v:n.v};
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
  let v = null; try { v = dynVStop(dynCalOf(S.boat), dM / 2); } catch (e){}
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
function sjvFogCapV(){
  if (!sjvLive() || SJV.vid !== S.cur || !SJV.fog) return 1e9;
  const e = SJV.e19; if (e && !e.off) return e.stop ? 0 : sjvMinKn() * KN_MS;
  return SJV.cap || 1e9;
}
// (and for the manoeuvring model's autopilot the speed limit where she is and just ahead, Ø11.8; the minute step has the limit in
// sailV, with the game closed too, so sjvSail asks for the fog's cap alone)
function sjvCapV(){ return Math.min(sjvFogCapV(), fartCapMs()); }

// ---- one look: the encounters round the boat you follow (at most once a game tenth of a minute, a real second) ----
function sjvEval(H, list){
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0, b = S.boat;
  if (SJV.vid !== S.cur){ SJV.E.clear(); SJV.sits.clear(); SJV.own = null; SJV.ownOff = 0; SJV.warn = null; SJV.vid = S.cur; SJV.e19 = null; SJV.heard.clear(); SJV.fogT.clear(); SJV.trail.clear(); SJV.lp.clear(); SJV.clash.clear(); }
  SJV.at = H;
  farvLook(H);   // (the speed limit and the cardinal marks, Ø11.8, at the end of the file)
  const A = sjvOwn(), harb = A.cls === 'moor' || A.cls === 'towed' || A.cls === 'anch' || inHarbour(A.p), gsA = gridScale(A.p);
  const auto = !!(S.plan && b.status === 'sailing' && !(typeof helmOn === 'function' && helmOn()) && !S.plan.replan);
  // the sight where she is (Ø11.2): the visibility, the dark, and restricted visibility (with half a kilometre's hysteresis, so it does
  // not blink at the edge)
  const vis = sjvVisAt(H, A.p), dark = sjvDark(H, A.p), fog = SJV.fog = SJV.fog ? vis < SJV.FOG + 0.5 : vis < SJV.FOG; SJV.vis = vis; SJV.night = dark;
  const RWX = fog ? SJV.RWF : SJV.RW;
  // (Ø11.3: how far she sees and the safe speed for her, kept in the trail the fault is read from; and the sweep for a collision while
  // the manoeuvring model does not have her: lying still, fishing or drifting at sea, or the minute step along the leg)
  const seenM = sjvSeenKm(10, vis, dark) * 1000, safeA = fog ? sjvSafeMs(seenM) : 0, sweep = !harb && sjvLive() && !(typeof dynLive === 'function' && dynLive());
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
    // (Ø11.3: the look, for the fault if they meet: the roles that stand, the CPA, the sight, and how each of them goes)
    if (R.rng < 3000) sjvTrailAdd(n0.id, {H, sit:R.sit, give:R.give, risk:R.risk, tcpa:R.tcpa, cpa:R.cpa, rng:R.rng, lim:R.lim, fog:f19, relA:R.relA, relB:R.relB, gs:gsA, safeA, seen:seenM,
      a:{x:A.p.x, y:A.p.y, hd:A.hd, cog:A.cog, v:A.v || 0, cls:A.cls, L:A.L}, b:{x:n.p.x, y:n.p.y, hd:n.hd, hd0:n.player ? null : n.hd0 != null ? n.hd0 : n.hd, cog:n.cog != null ? n.cog : n.hd, v:n.v || 0, cls:n.cls || R.clsB, L:n.L || 10}});
    // the encounter: kept while it lasts (13 d), with the least clearance between the hulls for the near miss (about 50 m, Ø11.7)
    const clr = R.rng - ((A.L || 10) + (n.L || 10)) / 4;
    let s = prev; if (!s && R.risk && R.rng < RW * 1000){ s = {sit:R.sit, give:R.give, t:H, clr, nm:false}; SJV.sits.set(n0.id, s); }
    if (s){ s.t = H; s.clr = Math.min(s.clr, clr);
      if (!harb && !s.nm && s.clr < SJV.NEAR && Math.max(A.v || 0, n.v || 0) >= 2){ s.nm = true; sjvNearMiss(n, R, s.clr); }
      if (R.tcpa < 0 && R.rng > 1.5 * R.lim) SJV.sits.delete(n0.id); }
    // the NPC's part: give way within about a kilometre (16), or stand on and act only when it is clear the boat you follow does not
    // (17 a ii, b), never in harbour, and back when it is past and clear
    if (E){
      // (past and clear, 8 d: the CPA behind and the range over the limit, and her way back to her own course clear of the other)
      if (E.t1 == null && (harb || (R.tcpa <= 0 && R.rng > R.lim && sjvBackClear(sjvBackNpc(n0, n, E, H), A, R.lim, gsA)) || R.rng > 2500 || H - E.t0 > SJV.TMAX)) E.t1 = H;
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
      if (E.t1 != null && H > E.t1 && sjvOffAt(E, H) <= 1e-6 && sjvLagAt(E, H) <= 1e-6) SJV.E.delete(n0.id);   // (a stand-by after a collision has its end set when it begins)
    } else if (!harb && sjvCan(n0) && !inHarbour(n0.p) && R.risk && sjvLive()){
      // (in sight she sounds her manoeuvre, 34 a: one short to starboard, two to port, three when she takes the way off)
      const closeK = (Math.hypot(R.vx, R.vy) / gsA) / 60;   // km a game minute between them
      let M = null;
      if ((R.give === 'b' || R.give === 'both') && (R.rng <= (f19 ? SJV.RNPCF : SJV.RNPC) * 1000 || (R.tcpa <= sjvLead(R, n0.v) && R.rng <= SJV.RLEAD * 1000)) && R.tcpa <= TS) M = sjvStart(n0, R, H, 'b', R.sit, false);
      else if (R.give === 'a' && R.rng <= Math.max(350, closeK * 1000) && R.tcpa <= 1.5 && R.cpa < 0.7 * R.lim) M = sjvStart(n0, R, H, 'b', '17', false);
      // 34 d: the one to stand on is in doubt that you give way, «minst fem korte støt med fløyten raskt etter hverandre», once
      else if (R.give === 'a' && sight && s && !s.d5 && !(SJV.own && SJV.own.id === n0.id) && R.rng <= 1500 && R.tcpa <= 2.5 && R.cpa < 0.8 * R.lim){ s.d5 = true; sjvSig(n0.id, 'SSSSS', n.p, n.L, false); }
      if (M){ SJV.E.set(n0.id, M); if (sight) sjvSig(n0.id, sjvManPat(M.side, M.slow), n.p, n.L, false); }
    }
    // Autonav's part: the vessels the boat you follow gives way for (16), within 1.2 km (1.8 under rule 19), sounding it in sight (34 a)
    // (in a harbour, where no one turns for another, the way off her instead for a vessel under way closing on her, rule 8 e «Om nødvendig
    // … slakke farten eller stoppe»: a ferry on her way in to her quay ran into the coastal vessel at Sørarnøy, 14.11.2026, the quay across
    // the way in to the plant; tests/allesteder.py, steg 126. Held till the CPA is past and open, the other lies still, or she is far)
    if (auto && harb && A.cls === 'pow' && sjvLive() && (!SJV.own || SJV.own.id === n0.id)){
      const O = SJV.own;
      // (stopped only where lying still opens the CPA past the limit: where the other is bound for the very water she is in, she keeps her
      // slow way on through it instead of lying in her way)
      const stopOk = () => R.rng < 2 * R.lim && colregSit(Object.assign({}, A, {v:0}), n, o).cpa >= R.lim;
      if (O){ O.stop = stopOk(); if (O.t1 == null && (!O.harb || (R.tcpa <= 0 && R.rng > R.lim) || (n.v || 0) < 1 || R.rng > SJV.HARB * 2 || H - O.t0 > SJV.TMAX)){ O.t1 = H; if (O.harb && H - O.t0 > SJV.TMAX) SJV.harbNo.set(n0.id, H); } }
      else if (R.risk && (n.v || 0) >= 2 && R.tcpa > 0 && R.tcpa <= SJV.HARBT && R.rng <= SJV.HARB && R.cpa < R.lim && !(SJV.harbNo.has(n0.id) && H - SJV.harbNo.get(n0.id) < SJV.TMAX))
        SJV.own = {id:n0.id, side:1, nx:0, ny:0, tgt:0, rate:1, t0:H, t1:null, why:'harb', slow:true, harb:true, stop:stopOk(), v:A.v};
    }
    if (auto && !harb && sjvLive() && (!SJV.own || SJV.own.id === n0.id)){
      const O = SJV.own;
      if (O){ if (O.t1 == null && ((R.tcpa <= 0 && R.rng > R.lim && sjvBackClear(sjvBackOwn(A, O), n, R.lim, gsA)) || R.rng > 2500 || H - O.t0 > SJV.TMAX)) O.t1 = H; }
      else if ((R.give === 'a' || R.give === 'both') && R.risk && (R.rng <= (f19 ? SJV.ROWNF : SJV.ROWN) * 1000 || (R.tcpa <= sjvLead(R, A.v) && R.rng <= SJV.RLEAD * 1000)) && R.tcpa <= TS){ SJV.own = sjvStart(A, R, H, 'a', R.sit, true, n0.id); if (sight) sjvSig('_own', sjvManPat(SJV.own.side, SJV.own.slow), A.p, A.L, true); }
    }
    // 19 e: a fog signal heard apparently forward of her beam from a vessel not in sight, or one forward of the beam she cannot keep out
    // of close quarters with: down to the minimum steerage speed, stopped when she is as close as the limit, «inntil faren for sammenstøt
    // er over» (the risk gone: the CPA open or past)
    if (f19 && fog && !harb && (n.v || 0) >= 1 && Math.abs(R.relA) < Math.PI / 2 && R.tcpa > 0 && R.cpa < 1.3 * R.lim && R.rng <= RW * 1000){
      const heard = SJV.heard.has(n0.id) && H - SJV.heard.get(n0.id) < 0.05;   // (within three game minutes)
      if ((heard || (R.rng < 1000 && R.cpa < 0.5 * R.lim)) && (!e19 || R.tcpa < e19.tcpa)) e19 = {id:n0.id, stop:R.rng < R.lim, tcpa:R.tcpa};
    }
    // the warning: the risk within the window and three kilometres (five under rule 19); the one closest in time
    if ((!harb || (SJV.own && SJV.own.harb && SJV.own.id === n0.id && SJV.own.t1 == null)) && R.risk && R.tcpa <= TW && R.rng <= RW * 1000 && (R.give !== 'b' || R.rng <= (f19 ? 2500 : 1500)) && (!best || R.tcpa < best.R.tcpa)) best = {n, R};
    // Ø11.3: did they touch since the last look (when the manoeuvring model has her, its steps look: sjvTouch)
    if (R.rng < 600) sjvSweep(n, A, H, gsA, sweep);
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
  for (const [id, T] of SJV.trail) if (!seen.has(id) && (!T.length || H - T[T.length - 1].H > 0.1)) SJV.trail.delete(id);
  for (const [id, q] of SJV.lp) if (!seen.has(id) && H - q.H > 0.1) SJV.lp.delete(id);
  for (const [id, c] of SJV.clash) if (H - c.t > 0.25 || H < c.t - 0.01) SJV.clash.delete(id);
  if (SJV.own && (!auto || (harb && !SJV.own.harb) || (!harb && SJV.own.harb) || (!seen.has(SJV.own.id) && SJV.own.t1 == null))) SJV.own.t1 = SJV.own.t1 == null ? H : SJV.own.t1;
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

// npcStates' one call (05-vessels.js): the classes, a look now and then, and the NPCs that give way where they are now. A track or a
// single boat asked for (only) is the shared course as the clock has it
function colregNpc(H, out, only){
  if (only || !S || !S.boat || !S.boat.pos) return out;
  const gear = new Set(); for (const g of NPCGEAR) gear.add(g.id);
  for (const n of out) if (!n.cls){   // (the coastal route's ships and the ferries carry their own length, beam and draught, 05b-ferje.js)
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
  // (in a harbour: the way off her, near a stop too; stopped while the other is within two limits, sjvEval)
  if (O && O.harb && O.t1 == null){ SJV.ownOff += clamp(-SJV.ownOff, -0.5 * h, 0.5 * h); return {off:SJV.ownOff, v:Math.min(O.stop ? 0 : 1, cap)}; }
  let tgt = O && O.t1 == null && !O.slow && !near ? O.side * O.tgt * 1000 : 0;
  if (tgt && (SJV.ownChk -= h) <= 0){ SJV.ownChk = 1;
    const look = Math.max(60, Math.abs(d.u) * 20) / 1000, a = {x:d.X / 1000, y:d.Y / 1000}, q = {x:a.x + Math.sin(d.psi) * look, y:a.y - Math.cos(d.psi) * look};
    let gp = null; try { gp = groundCheck(a, q); } catch (e){ gp = a; } if (gp){ O.slow = true; tgt = 0; } }
  const rate = Math.max(0.5, Math.abs(d.u)) * Math.tan(SJV_TH) * h;
  SJV.ownOff += clamp(tgt - SJV.ownOff, -rate, rate);
  const v = O && (O.slow || O.ease) && O.t1 == null && !near ? Math.max(1, 0.4 * ((S.plan && S.plan.speed) || BOAT.vcruise || 6) * KN_MS) : 1e9;
  return {off:SJV.ownOff, v:Math.min(v, cap)};
}
// the minute step (05-vessels.js sail), when the model is not running: she turns 35 degrees off the leg until she stands the offset off it,
// then heads on; back, the leg's own heading takes her to the next waypoint. Not near a stop. True when this moved her. Under the safe
// speed or the minimum steerage speed (sjvCapV, Ø11.2) the minute is that much shorter, with or without a manoeuvre (sjvCreep)
function sjvSail(pl, b, left){
  sjvFresh(false);
  if (SJV.stopT != null && SJV.stopT === S.t && SJV.vid === S.cur){ b.v = 0; return true; }   // (a collision in the look just made, Ø11.3: she lies where it left her this minute)
  const O = SJV.own, cap = sjvFogCapV(), v0 = b.v || 0, f = cap < 1e8 && v0 > 0.1 ? Math.min(1, cap / KN_MS / v0) : 1;
  // (in a harbour, sjvEval: the way off her, 1 m/s, or she lies still this minute)
  if (O && O.harb && O.t1 == null && S.cur === SJV.vid && sjvLive()){ if (O.stop){ b.v = 0; return true; } const g = Math.min(f, 1 / KN_MS / Math.max(v0, 0.1)); return g < 0.999 ? sjvCreep(pl, b, left * g, v0 * g) : false; }
  if (!O || O.t1 != null || O.harb || S.cur !== SJV.vid || !sjvLive()) return f < 0.999 ? sjvCreep(pl, b, left * f, v0 * f) : false;
  const w = pl.wps[pl.idx]; if (!w) return false; const d = dist(b.pos, w); if (d < 3 * left || (wpStop(w) && d < 0.5)) return f < 0.999 ? sjvCreep(pl, b, left * f, v0 * f) : false;
  const hd0 = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y)), gs = gridScale(b.pos);
  let hd = hd0, L = left * f;
  if (O.slow) L = L * 0.4;
  else { if (O.ease) L = L * 0.4;   // (the offset and the way off her both, TB1)
    if ((O.mo || 0) < O.tgt * gs){ hd = hd0 + O.side * SJV_TH; O.mo = (O.mo || 0) + L * Math.sin(SJV_TH); } }
  const to = {x:b.pos.x + Math.sin(hd) * L, y:b.pos.y - Math.cos(hd) * L};
  let gp = null; try { gp = groundCheck(b.pos, to); } catch (e){ gp = to; }
  if (gp){ O.slow = true; return false; }
  const k = O.slow || O.ease ? 0.4 : 1;   // (the speed the rules read is the one she goes: sail sets it again each minute)
  b.pos = to; b.heading = hd; if (f * k < 0.999) b.v = Math.round(v0 * f * k * 10) / 10; return true;
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

// ---------- Ø11.3: collisions (sjøloven kap. 8, LOV-1994-06-24-39 §§ 161-164, read on Lovdata 06.11.2026) ----------
// § 161: one at fault «skal den skyldige erstatte skaden»; both at fault, each by the faults on each side, and «deles skaden likt» when
// no ratio can be fixed; for personal injury jointly (no one is hurt in the game); the fifth ledd weighs «om det var tid til overlegninger
// eller ikke». § 162: an accident, or no fault shown on either side, «bærer hvert skip sin skade». § 163 (damage by a manoeuvre without
// contact, as a wash) is not built. § 164: the masters help each other as far as possible and needed, and each gives the other «sitt
// eget skips navn og hjemsted», where she comes from and where she is bound; the game does it for you, on the VHF and in the log.
// The hulls are convex pentagons of their length and beam (the stem, the shoulders, the quarters), the boat you follow's and every
// vessel's in npcStates' whole list (the one the 3D view and the chart plotter draw); the sea marks, the bridges' piers and the wind
// turbines in the sea are circles (11b-obstacles.js HIND), and the buoys of the gear in the sea points (NPCGEAR). They are looked at in
// each step of the manoeuvring model (sjvTouch from 16b-dyn.js dynContact: by hand and on Autonav), and at each look while the model
// does not have her (sjvSweep from sjvEval: lying still, fishing or drifting at sea, and the minute step along the leg through sjvSail).
// Only with the game open and running (sjvLive, prinsipp 4), never in catchUp. Under a knot the fenders take it.
// - The blow: an impulse from the other's hull as for a quay (16b-dyn.js dynContact), with her mass; each hull's damage by the speed a
//   quay would give the same blow (sjvKnEq: a sjark against the coastal ship is a quay, the coastal ship against a sjark is not); yours
//   by hullHit (16c-hull.js), the other's by sjvOtherCost. Another player's boat is never damaged: she gets a message (ui/10n-hail.js).
// - The fault from the looks of the game minutes before the blow, not the last half minute (sjvFault).
// - The payment (sjvSettle): your share of her damage (the hull insurance pays over the deductible, a claim as for the yard's repair,
//   and the premium goes up as it does), and her share of what your damage costs you.
// - The NPC stands by where she is for three game minutes (sjvStandBy: a local stop on the shared clock, never kept or sent).
const SJV_HULL = [[0.5, 0], [0.3, 0.5], [-0.47, 0.5], [-0.47, -0.5], [0.3, -0.5]];   // fractions of L forward and B to starboard
const SJV_DELIB = 0.5 / 60, SJV_TRAIL = 8 / 60;   // the last half game minute (five real seconds), and the trail kept (game hours: from about where the
// NPCs and Autonav begin to give way, TCPA 8 game minutes)
// what a vessel is worth by her length (kr, second-hand fishing vessels and passenger ships, rough: between them by the logarithm)
const SJV_VAL = [[6, 1e5], [10, 1.2e6], [15, 1.2e7], [21, 2e7], [40, 9e7], [60, 1.5e8], [80, 2.5e8], [125, 9e8]];
// a hull's corners (metres on the grid: x east, z south) with her centre at (X, Z) and heading psi, in dynContact's frame (DYN_HULL)
function sjvHullPts(X, Z, psi, L, B){
  const s = Math.sin(psi), c = Math.cos(psi);
  return SJV_HULL.map(([f, g]) => { const xc = f * L, yc = g * B; return [X + xc * s + yc * c, Z - xc * c + yc * s]; });
}
function sjvInPoly(P, x, z){
  let sg = 0;
  for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length], cr = (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]); if (Math.abs(cr) < 1e-9) continue; const s = cr > 0 ? 1 : -1; if (sg && s !== sg) return false; sg = s; }
  return true;
}
// two convex polygons by their separating axes: the least overlap d (m), the way out of B for A (ox east, oz south) and the point of
// contact (the corners of each inside the other, or the deepest of each); null when they are apart
function sjvSat(A, B){
  let best = null;
  for (const P of [A, B]) for (let i = 0; i < P.length; i++){
    const p = P[i], q = P[(i + 1) % P.length]; let nx = q[1] - p[1], nz = p[0] - q[0]; const l = Math.hypot(nx, nz); if (!(l > 1e-9)) continue; nx /= l; nz /= l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const v of A){ const d = v[0] * nx + v[1] * nz; if (d < a0) a0 = d; if (d > a1) a1 = d; }
    for (const v of B){ const d = v[0] * nx + v[1] * nz; if (d < b0) b0 = d; if (d > b1) b1 = d; }
    const o1 = a1 - b0, o2 = b1 - a0, o = Math.min(o1, o2); if (o <= 0) return null;
    if (!best || o < best.d) best = {d:o, ox:o1 < o2 ? -nx : nx, oz:o1 < o2 ? -nz : nz};
  }
  if (!best) return null;
  let sx = 0, sz = 0, k = 0;
  for (const v of A) if (sjvInPoly(B, v[0], v[1])){ sx += v[0]; sz += v[1]; k++; }
  for (const v of B) if (sjvInPoly(A, v[0], v[1])){ sx += v[0]; sz += v[1]; k++; }
  if (!k){ let ma = null, mb = null;
    for (const v of A){ const d = v[0] * best.ox + v[1] * best.oz; if (!ma || d < ma.d) ma = {d, v}; }
    for (const v of B){ const d = v[0] * best.ox + v[1] * best.oz; if (!mb || d > mb.d) mb = {d, v}; }
    sx = ma.v[0] + mb.v[0]; sz = ma.v[1] + mb.v[1]; k = 2; }
  best.x = sx / k; best.z = sz / k; return best;
}
// a circle (a mark, a pier, a turbine's foot: centre cx, cz, radius r) against a convex polygon A: as sjvSat
function sjvSatC(A, cx, cz, r){
  let best = null; const inside = sjvInPoly(A, cx, cz);
  for (let i = 0; i < A.length; i++){ const p = A[i], q = A[(i + 1) % A.length], dx = q[0] - p[0], dz = q[1] - p[1], u = clamp(((cx - p[0]) * dx + (cz - p[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1), x = p[0] + dx * u, z = p[1] + dz * u, d = Math.hypot(x - cx, z - cz);
    if (!best || d < best.d) best = {d, x, z}; }
  if (!inside && best.d >= r) return null;
  const ux = (best.x - cx) / (best.d || 1), uz = (best.z - cz) / (best.d || 1);
  return inside ? {d:best.d + r, ox:-ux, oz:-uz, x:cx, z:cz} : {d:r - best.d, ox:ux, oz:uz, x:best.x, z:best.z};
}
// the masses (kg): hers from her length, beam and draught (a block coefficient of a half), yours from the vessel's displacement
function sjvMass(n){ const L = n.L || 10, B = n.B || L / 3, T = n.T || Math.max(0.8, 0.09 * L); return Math.max(300, 0.5 * 1025 * L * B * T); }
function sjvOwnMass(b = S.boat){ const V = VESSELS[b.type] || {}; return Math.max(300, (V.disp || 1) * 1000); }
// the speed of the blow each hull takes as a quay would give it (knots): the whole blow on the one with the other's share of the mass
// (the light one takes nearly all of it, the heavy one little; two alike each the closing speed over the square root of two)
function sjvKnEq(kn, mA, mB){ const f = mB / (mA + mB); return [kn * Math.sqrt(f), kn * Math.sqrt(1 - f)]; }
// what a vessel is worth, and her hull's material (the ocean fleet, the ships and the boats from 15 m steel, the smaller fibreglass)
function sjvValue(L){
  const T = SJV_VAL; if (!(L > T[0][0])) return T[0][1];
  for (let i = 1; i < T.length; i++) if (L <= T[i][0]){ const [l0, v0] = T[i - 1], [l1, v1] = T[i], f = (L - l0) / (l1 - l0); return Math.round(Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * f) / 1000) * 1000; }
  return T[T.length - 1][1];
}
function sjvMatOf(n){ if (n.vtype && VESSELS[n.vtype]) return hullMatF(n.vtype); return n.hav || (n.L || 10) >= 15 || n.type === 'coastal' || n.type === 'ferry' ? HULL.mat['stål'] : 1; }
// the other vessel's damage by the blow she takes (kn as a quay would give it), as hullHit has it for yours (16c-hull.js), and what it
// costs at a yard: the paint over a patch by her length, the hull by her worth, and the hole; never more than half her worth
function sjvOtherCost(kn, L, mat, P){
  const r = {ds:0, dh:0, dA:0, kr:0}; if (!(kn >= HULL.fend)) return r;
  r.ds = Math.min(1, 0.1 + 0.08 * Math.min(kn, 6));
  if (kn >= HULL.scr) r.dh = Math.min(1, mat * 0.08 * Math.pow(kn - 2, 1.4));
  const thr = HULL.leak / mat; if (kn >= thr) r.dA = 3 * L / 10 * (kn - thr + 1) ** 2;
  r.kr = Math.round(Math.min(0.5 * P, 3000 + 800 * L * r.ds + (r.dh > 0 ? 3000 + P * 0.08 * r.dh : 0) + (r.dA > 0 ? 2000 + P * 0.005 : 0)) / 100) * 100;
  return r;
}
// what the repair of a blow's damage (hullCost of it) comes to for you at the yard: nothing when it is the first repair of the hull (on
// the house, hullBill), the deductible at most with the hull insurance, else all of it
function sjvOwnLoss(b, c){
  if (!c || !(c.tot > 0)) return 0;
  if ((c.str > 0 || c.eng > 0) && !(S.free && S.free.rep)) return 0;
  return b.kasko ? Math.min(c.tot, kaskoSelf(b)) : c.tot;
}
// the least distance ahead (m) of two on straight courses ({x, y} grid km, cog radians on the grid, v knots; gs the grid's scale)
function sjvCpa(a, b, gs){
  const ka = (a.v || 0) * NM * gs, kb = (b.v || 0) * NM * gs, rx = b.x - a.x, ry = b.y - a.y, vx = Math.sin(b.cog) * kb - Math.sin(a.cog) * ka, vy = -Math.cos(b.cog) * kb + Math.cos(a.cog) * ka;
  const v2 = vx * vx + vy * vy, t = v2 > 1e-12 ? Math.max(0, -(rx * vx + ry * vy) / v2) : 0;
  return Math.hypot(rx + vx * t, ry + vy * t) / gs * 1000;
}
function sjvTrailAdd(id, e){ let T = SJV.trail.get(id); if (!T) SJV.trail.set(id, T = []); T.push(e); while (T.length && e.H - T[0].H > SJV_TRAIL) T.shift(); if (T.length > 120) T.splice(0, T.length - 120); }

// The fault (§§ 161, 162) from the trail T of looks before the blow (oldest first, as sjvEval keeps them: {H, sit, give, risk, tcpa, cpa,
// lim, fog, relA, relB, gs, safeA, seen, a, b}, a and b {x, y, hd, cog, v, cls, L}) and the two as they were at the blow (X {H, gs, fog, a,
// b}). The looks of the last half game minute do not count (§ 161 fifth ledd: no time to deliberate). Points for each fault:
// - the one to give way (16; both in 14, 18 c and 19) with no markert manøver in good time (at the last look before the last half minute
//   her own changes of course and speed since the risk began, against her course and speed then by dead reckoning, the other as she
//   went, had opened the CPA by a fifth of the limit, or taken off 40 % of her speed):
//   3; one that did and still met the other (too little, too late): 1
// - the one to stand on (17 a i) that changed course or speed by much while there were more than three game minutes to the CPA (after
//   that 17 a ii allows it, and 17 b asks it): 2
// - a turn to port for a vessel forward of the beam (14 a both to starboard, 19 d i): 1; the one to stand on for one on her port side (17 c): 2
// - in restricted visibility (19): over a safe speed (6, 19 b: yours from your stopping distances, hers when she is seen at under eight
//   of her lengths), and not down to the minimum steerage speed at close quarters with a vessel forward of the beam (19 e): 1 each
// - not under command or restricted (3 f, g): none, she could do nothing; lying still or drifting under a knot: none (2 b)
// - a vessel moored or at anchor: all on the one under way; both still or drifting: none
// - no risk seen in good time: the one that turned into the other in the last game minute, 3 (8, 2 a); else the rules at the blow
// No points: § 162. Else § 161, the shares by the points (whole per cent), at least a fifth to each with a fault
function sjvFault(T, X){
  const gs = X.gs || 1, Hb = X.H, why = {a:[], b:[]}, pts = {a:0, b:0}, add = (k, p, w) => { pts[k] += p; why[k].push(w); };
  const cant = c => c === 'nuc' || c === 'ram', still = c => c === 'moor' || c === 'anch', ca = X.a.cls, cb = X.b.cls, va = X.a.v || 0, vb = X.b.v || 0;
  const res = sit => { const s = pts.a + pts.b; if (!s) return {law:'162', fa:0, fb:0, why, sit, pts};
    let fa = Math.round(pts.a / s * 100) / 100; if (pts.a > 0 && pts.b > 0) fa = clamp(fa, 0.2, 0.8); return {law:'161', fa, fb:Math.round((1 - fa) * 100) / 100, why, sit, pts}; };
  if (still(cb)){ if (!cant(ca) && !still(ca) && va >= 0.5) add('a', 3, 'fast'); return res('fast'); }
  if (still(ca)){ if (!cant(cb) && vb >= 0.5) add('b', 3, 'fast'); return res('fast'); }
  if (va < 1 && vb < 1) return res('2');
  const early = T.filter(e => e.H <= Hb - SJV_DELIB && Hb - e.H <= SJV_TRAIL), r0 = early.findIndex(e => e.risk);
  if (r0 < 0){
    // no risk seen in good time: the one that turned into the other in the last game minute; with neither, the rules at the blow
    const hdOf = (k, q) => k === 'b' && q.hd0 != null ? sjvWrap(q.hd - q.hd0) : q.hd, base = T.find(e => Hb - e.H <= 1 / 60);
    const turn = k => base ? Math.abs(sjvWrap(hdOf(k, X[k]) - hdOf(k, base[k]))) * 180 / Math.PI : 0, ta = turn('a'), tb = turn('b');
    if (ta >= 20 && tb < 10 && !cant(ca)){ add('a', 3, 'sving'); return res('sving'); }
    if (tb >= 20 && ta < 10 && !cant(cb)){ add('b', 3, 'sving'); return res('sving'); }
    const R = colregSit({p:{x:X.a.x, y:X.a.y}, hd:X.a.hd, cog:X.a.cog, v:va, cls:ca, L:X.a.L}, {p:{x:X.b.x, y:X.b.y}, hd:X.b.hd, cog:X.b.cog, v:vb, cls:cb, L:X.b.L}, {gs, fog:!!X.fog});
    for (const k of ['a', 'b']) if ((R.give === k || R.give === 'both') && !cant(X[k].cls) && (X[k].v || 0) >= 1) add(k, 3, 'gw:' + R.sit);
    return res(R.sit);
  }
  const E0 = early[r0], last = early[early.length - 1], sit = last.sit, give = last.give, ev = early.slice(r0);
  // (an NPC's own change of course is her deviation from her course on the shared clock (hd0, kept by sjvPose): following the bends of her
  // route is keeping her course, found in the stikkprøve at Tromsø 07.11.2026, where a bend to port counted as 17 c)
  const own = (k, e) => k === 'b' && e.b.hd0 != null ? sjvWrap(e.b.hd - e.b.hd0) : e[k].hd;
  for (const k of ['a', 'b']){
    const o = k === 'a' ? 'b' : 'a', rel = k === 'a' ? E0.relA : E0.relB;   // (the other's bearing from her bow when the risk began)
    if (cant(E0[k].cls) || cant(X[k].cls)) continue;
    const gw = give === k || give === 'both', so = give === o;
    // (overtaking the other, 19 d i allows a turn to port: she is more than 22.5 degrees abaft the other's beam)
    const over = Math.abs(k === 'a' ? E0.relB : E0.relA) > SJV_ABAFT;
    let opened = false, slowed = false, worse = false, port = false, oCh = null, kTurn = null, prevE = null;
    for (const e of ev){
      // (when the other first changed her course, and when she last turned: one that turns after the other has, follows her)
      if (oCh == null && Math.abs(sjvWrap(own(o, e) - own(o, E0))) >= 10 * Math.PI / 180) oCh = e.H;
      if (prevE && Math.abs(sjvWrap(own(k, e) - own(k, prevE))) >= 3 * Math.PI / 180) kTurn = e.H; prevE = e;
      const dh = sjvWrap(own(k, e) - own(k, E0)) * 180 / Math.PI, dv = (E0[k].v || 0) > 0.5 ? 1 - (e[k].v || 0) / E0[k].v : 0;
      // what her own change did to the CPA: where and how she goes now against where she would be on the course and speed she had when the
      // risk began (by dead reckoning from there), the other as she really goes (so one that follows the other's turn towards her has not
      // given way, hulltest 7a)
      const dt = e.H - E0.H, dr = q => { const kk = (q.v || 0) * NM * gs * dt; return {x:q.x + Math.sin(q.cog) * kk, y:q.y - Math.cos(q.cog) * kk, cog:q.cog, v:q.v}; }, was = dr(E0[k]), kept = dr(E0[o]);
      const pair = (x, y) => k === 'a' ? sjvCpa(x, y, gs) : sjvCpa(y, x, gs), m = Math.max(30, 0.2 * (e.lim || 120));
      const now = pair(e[k], e[o]), then = pair(was, e[o]);   // (the other as she really went)
      // (and against the other on the course and speed she had, as 17 a i lets the one to give way count on: her own turn to port must not
      // make a good manoeuvre look like none; but one that kept turning after the other had changed her course and brought the CPA down
      // where the old course would have gone clear, steered at her)
      const nowK = pair(e[k], kept), thenK = pair(was, kept), steered = oCh != null && kTurn != null && kTurn > oCh && then - now >= m && then >= 0.5 * (e.lim || 120);
      // (the give-way's manoeuvre by what it does at the last look before the last half minute: one look where a lag in her turn opened it
      // for a moment is not a manoeuvre)
      if (e === last){ opened = (now - then >= m || nowK - thenK >= m) && !steered; slowed = dv >= 0.4; }
      // (the one to stand on: a change of course or speed that brought them closer, while the other still had time to act; following the
      // bend of her course is keeping it, and a change that opened the CPA hurt no one)
      if ((Math.abs(dh) >= 15 || Math.abs(dv) >= 0.4) && e.tcpa > 3 && then - now >= m) worse = true;
      if (dh <= -15 && Math.abs(rel) < Math.PI / 2 && ((sit === '14' && gw) || (so && rel < 0) || (sit === '19' && !over))) port = true;
    }
    if (gw){ if (opened || slowed) add(k, 1, 'sent'); else add(k, 3, 'gw:' + sit); }
    else if (so && worse) add(k, 2, 'so');
    if (port) add(k, so ? 2 : 1, 'port');   // (17 c for the one to stand on weighs as a change in good time: it meets the other's turn to starboard)
    // restricted visibility (rule 19): the safe speed, and 19 e at close quarters with one forward of the beam
    const fogE = ev.filter(e => e.fog);
    if (fogE.length){
      if (fogE.some(e => k === 'a' ? e.safeA > 0 && (e.a.v || 0) * KN_MS > e.safeA * 1.05 : e.seen > 0 && e.seen < 8 * (e.b.L || 10) && (e.b.v || 0) >= 2)) add(k, 1, 'fart');
      const close = fogE.filter(e => Math.abs(k === 'a' ? e.relA : e.relB) < Math.PI / 2 && e.rng < 1000 && e.cpa < 0.5 * e.lim), minK = k === 'a' ? sjvMinKn() : clamp(0.3 * (E0.b.v || 7), 2, 4);
      if (close.length && (close[close.length - 1][k].v || 0) > 1.3 * minK) add(k, 1, '19e');
    }
  }
  return res(sit);
}
// the fault in words (the log): who, how much, and why, by the rules
function sjvFaultWord(w, no){
  const L = (a, c) => no ? a : c, r = w.split(':')[1];
  const rule = {'15':L('regel 15 (kryssende)', 'rule 15 (crossing)'), '14':L('regel 14 (møtende)', 'rule 14 (head-on)'), '13a':L('regel 13 (innhenting)', 'rule 13 (overtaking)'), '13b':L('regel 13 (innhenting)', 'rule 13 (overtaking)'),
    '9a':L('regel 9 (trang lei)', 'rule 9 (narrow channel)'), '9b':L('regel 9 (trang lei)', 'rule 9 (narrow channel)'), '18':L('regel 18', 'rule 18'), '18c':L('regel 18', 'rule 18'), '18d':L('regel 18', 'rule 18'),
    '19':L('regel 19 (nedsatt sikt)', 'rule 19 (restricted visibility)'), '2':L('regel 2 (den andre lå stille)', 'rule 2 (the other lay still)')}[r] || L('reglene', 'the rules');
  if (w.startsWith('gw')) return L('hadde vikeplikt etter ' + rule + ' og holdt ikke av veien', 'had to keep out of the way under ' + rule + ' and did not');
  return {sent:L('vek for sent eller for lite (regel 8 og 16)', 'gave way too late or too little (rules 8 and 16)'), so:L('skulle holde kurs og fart, men la om i god tid før (regel 17 a)', 'was to keep her course and speed but altered in good time before (rule 17 a)'),
    port:L('svingte til babord (regel 14, 17 c og 19 d)', 'turned to port (rules 14, 17 c and 19 d)'), fart:L('gikk for fort for sikten (regel 6 og 19 b)', 'went too fast for the sight (rules 6 and 19 b)'),
    '19e':L('satte ikke ned farten da dere kom nær hverandre i tåka (regel 19 e)', 'did not slow down at close quarters in the fog (rule 19 e)'), sving:L('svingte rett mot den andre (regel 8)', 'turned straight into the other (rule 8)'),
    fast:L('gikk på et fartøy som lå fortøyd eller til ankers', 'ran into a vessel moored or at anchor')}[w] || w;
}
function sjvFaultSay(F, name, lang){
  const no = lang !== 'en', L = (a, c) => no ? a : c, nm = '«' + name + '»', pc = x => Math.round(x * 100) + ' %', ws = k => F.why[k].map(w => sjvFaultWord(w, no)).join(L(' og ', ' and '));
  if (F.law === '162') return F.sit === 'fast' || F.sit === '2' ? L('Sjøloven § 162: ingen av dere kunne gjøre noe, så hver bærer sin skade.', 'Maritime Code § 162: neither of you could do anything, so each bears her own damage.')
    : L('Sjøloven § 162: ingen feil på noen av sidene, så hver bærer sin skade.', 'Maritime Code § 162: no fault on either side, so each bears her own damage.');
  if (F.fa >= 1) return L('Skylda etter sjøloven § 161 er din: du ', 'Under the Maritime Code § 161 the fault is yours: you ') + ws('a') + '.';
  if (F.fb >= 1) return L('Skylda etter sjøloven § 161 er hos ' + nm + ': hun ', 'Under the Maritime Code § 161 the fault is ' + nm + "'s: she ") + ws('b') + '.';
  if (F.fa === 0.5) return L('Skylda etter sjøloven § 161 deles likt: du ', 'Under the Maritime Code § 161 the fault is shared equally: you ') + ws('a') + L(', og ' + nm + ' ', ', and ' + nm + ' ') + ws('b') + '.';
  return L('Skylda etter sjøloven § 161: du ' + pc(F.fa) + ', ' + nm + ' ' + pc(F.fb) + '. Du ', 'The fault under the Maritime Code § 161: you ' + pc(F.fa) + ', ' + nm + ' ' + pc(F.fb) + '. You ') + ws('a') + L(', og hun ', ', and she ') + ws('b') + '.';
}
// the payment (§ 161): your share of her damage (kr), the hull insurance paying over its deductible with a claim as for a repair (the
// premium up a quarter for a year, 16c-hull.js kaskoPrem), and her share of what your own damage costs you (c: hullCost of the blow)
function sjvSettle(b, F, c, oth, name){
  const R = {owe:0, ins:0, you:0, got:0}; if (!F || F.law !== '161') return R;
  R.owe = Math.round(F.fa * (oth || 0) / 100) * 100;
  if (R.owe > 0){
    if (b.kasko){ R.you = Math.min(R.owe, kaskoSelf(b)); R.ins = R.owe - R.you; if (R.ins > 0) b.kasko.claims = (b.kasko.claims || []).concat([S.t]); } else R.you = R.owe;
    book('forsikring', -R.you, 'Erstatning til «' + name + '» (sjøloven § 161)', 'Damages to «' + name + '» (Maritime Code § 161)');
  }
  R.got = Math.round(F.fb * sjvOwnLoss(b, c) / 100) * 100;
  if (R.got > 0) book('annet', R.got, 'Erstatning fra «' + name + '» (sjøloven § 161)', 'Damages from «' + name + '» (Maritime Code § 161)');
  return R;
}
function sjvPaySay(M, F, name, lang){
  const no = lang !== 'en', L = (a, c) => no ? a : c, nm = '«' + name + '»', out = [], kr = x => sjvKr(x, no);
  if (M.owe > 0) out.push(L('Du erstatter ' + Math.round(F.fa * 100) + ' % av skaden på ' + nm + ', ' + kr(M.owe), 'You pay ' + Math.round(F.fa * 100) + ' % of the damage to ' + nm + ', ' + kr(M.owe))
    + (M.ins > 0 ? L('; kaskoen betaler ' + kr(M.ins) + ', og du betaler egenandelen, ' + kr(M.you) + '.', '; the hull insurance pays ' + kr(M.ins) + ', and you pay the deductible, ' + kr(M.you) + '.') : '.'));
  if (M.got > 0) out.push(L('Rederiet til ' + nm + ' betaler deg ' + kr(M.got) + ' for din del av skaden på båten.', nm + "'s owners pay you " + kr(M.got) + ' towards the damage to your boat.'));
  return out.join(' ');
}
// kr as the UI writes it (ui/02-format-state.js kr), in the language asked for (the log keeps both)
function sjvKr(x, no){ const t = new Intl.NumberFormat(no ? 'nb-NO' : 'en-GB', {maximumFractionDigits:0}).format(Math.round(x)); return no ? t + ' kr' : 'NOK ' + t; }
// where she comes from (the last cast off in the log) and where she is bound (the next harbour on the route, or the grounds)
function sjvFrom(){
  for (let i = S.log.length - 1, n = 0; i >= 0 && n < 600; i--, n++){ const m = /Kastet loss fra (.+?)\.$/.exec(S.log[i].no || ''); if (m) return m[1]; }
  const q = nearestPort(S.boat.pos); return q ? q.name : '';
}
function sjvTo(){
  const pl = S.plan; if (!pl || !pl.wps) return null;
  for (let i = pl.idx || 0; i < pl.wps.length; i++){ const w = pl.wps[i]; if (w.port && portById(w.port)) return portById(w.port).name; if (w.fish) return S.lang === 'en' ? 'the grounds' : 'feltet'; }
  return null;
}
// § 164 on the VHF (channel 16), heard and kept as the coast radio is (S.radio: the deck log's day; on the screen for 15 seconds): the
// boat you follow's name, call sign and home port, where she comes from and is bound, and whether they need help; the NPC's answer
function sjvVhf(n, rec){
  const b = S.boat, nm = '«' + (S.boatName || 'Havbris') + '»', cs = typeof callOf === 'function' ? callOf(b) : null, hp = portById(S.home || HOME0), from = sjvFrom(), to = sjvTo(), them = '«' + n.name + '»';
  const me = (no, en) => nm + (cs ? ', ' + cs : '') + (hp ? (no ? ', hjemsted ' : ', home port ') + hp.name : '') + (from ? (no ? ', på vei fra ' : ', bound from ') + from : '') + (to ? (from ? (no ? ' til ' : ' for ') : (no ? ', på vei til ' : ', bound for ')) + to : '');
  const ask = [them + ', ' + them + ', dette er ' + me(true) + '. Vi har kollidert med dere. Er alle om bord i orden? Trenger dere hjelp?',
    them + ', ' + them + ', this is ' + me(false) + '. We have collided with you. Is everyone aboard all right? Do you need help?'];
  const leak = rec.othA > 0, ans = [them + ': ' + (leak ? 'Vi tar inn litt vann, men lensepumpa holder unna.' : 'Alle i orden her.') + ' Ingen er skadet, vi klarer oss. Vi blir liggende litt og ser over skroget.',
    them + ': ' + (leak ? 'We are taking a little water, but the bilge pump keeps up.' : 'All well here.') + ' No one is hurt, we can manage. We will lie here a while and look over the hull.'];
  const R = S.radio || (S.radio = []); R.push({t:S.t, from:'VHF 16', no:ask[0], en:ask[1]}, {t:S.t, from:'VHF 16', no:ans[0], en:ans[1]}); if (R.length > 40) R.splice(0, R.length - 40);
  rec.vhf = ask[0]; rec.vhfEn = ask[1];
  if (typeof toast === 'function') toast('📻 VHF 16: ' + (S.lang === 'en' ? ask[1] + ' — ' + ans[1] : ask[0] + ' — ' + ans[0]), 15000);
}
// the NPC stands by where she is (§ 164; npc-flåten 4 A: laid over the shared course here only), three game minutes, and is behind her
// course by that time after (as after slackening off: she makes it up at 1.3 times her speed). Not another player's boat, the rescue
// boat, the coast guard alongside or a boat in a mission
function sjvStandBy(n, H){
  if (n.player || n.rs || n.kv || n.tur || String(n.id)[0] === 't' || !n.p) return;
  // (one giving way off her course stands by where she is, offset and all, and after it goes back to her course at her turn's rate while
  // she makes up the time: no jump; one already behind her course stays as far behind)
  const E0 = SJV.E.get(n.id), lag0 = E0 ? sjvLagAt(E0, H) : 0, off0 = E0 ? sjvOffAt(E0, H) : 0;
  SJV.E.set(n.id, {id:n.id, side:E0 ? E0.side : 0, nx:E0 ? E0.nx : 0, ny:E0 ? E0.ny : 0, tgt:0, rate:0, off0, rate0:E0 ? (E0.rate0 || E0.rate || 0) : 0,
    t0:H - lag0, t1:H + SJV.STAND, why:'164', slow:true, f:0, v:n.v, p0:{x:n.p.x, y:n.p.y}, hd0:n.hd});
}
// a collision with vessel n (the pose at the blow) at kn knots closing, E the energy (J), pre: the boat you follow just before the blow
// ({p, hd, cog, v}). A collision goes on while they touch again within the stand-by: then only a harder blow adds to the damage. Returns
// what was done (also kept in S.clashes, the last 40, for Ø11.7's card)
function sjvBlow(n, kn, E, H, pre){
  const b = S.boat, peer = !!n.player, no = S.lang !== 'en', L = (a, c) => no ? a : c, gs = gridScale(b.pos), C0 = SJV.clash.get(n.id);
  if (!(kn >= HULL.fend)) return null;
  const mA = sjvOwnMass(b), mB = sjvMass(n), [kA, kB] = sjvKnEq(kn, mA, mB), knT = (Math.round(kn * 10) / 10).toFixed(1);
  if (C0 && H - C0.t < SJV.STAND + 1 / 60 && H >= C0.t - 0.01){ C0.t = H; if (kn < C0.kn + 0.5) return null; C0.kn = kn;
    const say = hullSay(hullHit(kA, E, 'båt', b));
    log('Nytt støt mot «' + n.name + '», ' + knT.replace('.', ',') + ' knop.' + (say ? say.no : ''), 'Another blow against «' + n.name + '», ' + knT + ' knots.' + (say ? say.en : ''), 'nav');
    return C0.rec; }
  const r = hullHit(kA, E, 'båt', b), say = hullSay(r), c = r ? hullCost(b, {s:r.ds, h:r.dh, A:r.dA}) : {scr:0, str:0, eng:0, tot:0};
  const A = sjvOwn(), X = {H, gs, fog:SJV.fog && Math.hypot(n.p.x - A.p.x, n.p.y - A.p.y) / gs * 1000 > sjvSeenKm(n.L || 10, SJV.vis, SJV.night) * 1000,
    a:{x:pre.p.x, y:pre.p.y, hd:pre.hd, cog:pre.cog != null ? pre.cog : pre.hd, v:pre.v, cls:A.cls, L:A.L}, b:{x:n.p.x, y:n.p.y, hd:n.hd, hd0:n.player ? null : n.hd0 != null ? n.hd0 : n.hd, cog:n.cog != null ? n.cog : n.hd, v:n.v || 0, cls:n.cls || colregCls(n), L:n.L || 10}};
  const F = peer ? null : sjvFault(SJV.trail.get(n.id) || [], X), O = peer ? {kr:0, dh:0, dA:0} : sjvOtherCost(kB, n.L || 10, sjvMatOf(n), sjvValue(n.L || 10)), M = peer ? {owe:0, ins:0, you:0, got:0} : sjvSettle(b, F, c, O.kr, n.name);
  const rec = {t:S.t, x:Math.round(b.pos.x * 1000) / 1000, y:Math.round(b.pos.y * 1000) / 1000, vid:S.cur, id:String(n.id), name:String(n.name || ''), kn:+kn.toFixed(1), kA:+kA.toFixed(1), kB:+kB.toFixed(1), peer,
    sit:F ? F.sit : null, law:F ? F.law : null, fa:F ? F.fa : 0, fb:F ? F.fb : 0, why:F ? F.why : null, own:c.tot, oth:O.kr, othA:O.dA, owe:M.owe, ins:M.ins, you:M.you, got:M.got};
  SJV.clash.set(n.id, {t:H, kn, rec}); SJV.nClash++; SJV.stopT = S.t;
  (S.clashes || (S.clashes = [])).push(rec); if (S.clashes.length > 40) S.clashes.splice(0, S.clashes.length - 40);
  // the log (the deck log's navigation page): the blow and what it did, the fault and the payment, § 164
  const them = '«' + n.name + '»', hers = peer ? [' ' + them + ' er en annen spillers båt og tar ikke skade.', ' ' + them + ' is another player\'s boat and takes no damage.']
    : O.dA > 0 ? [' ' + them + ' er slått inn.', ' ' + them + ' is stove in.'] : O.dh > 0 ? [' ' + them + ' fikk skader i skroget.', ' ' + them + ' has damage to her hull.'] : O.kr > 0 ? [' ' + them + ' fikk skrammer.', ' ' + them + ' got scratches.']
    : [' ' + them + ' tok ikke skade.', ' ' + them + ' took no damage.'];   // (her blow under a knot as a quay would give it: the heavy one, hulltest 7a on the merged build)
  const head = [(kn >= HULL.scr ? 'Sammenstøt med ' : 'Smell i ') + them + ', ' + knT.replace('.', ',') + ' knop.' + (say ? say.no : '') + hers[0], (kn >= HULL.scr ? 'A collision with ' : 'A knock against ') + them + ', ' + knT + ' knots.' + (say ? say.en : '') + hers[1]];
  log(head[0], head[1], 'nav');
  if (F){ log(sjvFaultSay(F, n.name, 'no') + (M.owe || M.got ? ' ' + sjvPaySay(M, F, n.name, 'no') : ''), sjvFaultSay(F, n.name, 'en') + (M.owe || M.got ? ' ' + sjvPaySay(M, F, n.name, 'en') : ''), 'nav'); }
  if (!peer) sjvVhf(n, rec);
  else { log('Du ropte opp «' + n.name + '» og spurte om de trenger hjelp (sjøloven § 164).', 'You called «' + n.name + '» and asked if they need help (Maritime Code § 164).', 'nav');
    if (typeof toast === 'function') toast(no ? head[0] : head[1], 9000); }
  if (!peer) sjvStandBy(n, H);
  if (typeof toast === 'function' && !peer) toast(no ? head[0] : head[1]);
  if (hooks.onClash) try { hooks.onClash(n, rec); } catch (e){}
  return rec;
}

// ---- the manoeuvring model's steps (16b-dyn.js dynContact, by hand and on Autonav) ----
// the time of a step (game hours): the first step of a tick at the views' time (the tick is every 200 ms; the model's pose there is where
// the views draw her), each step after it DYN_H on
function sjvClock(){
  const w = Date.now(), c = SJV.tc, H0 = (S.t + (typeof liveFrac === 'function' ? liveFrac() : 0)) / 60;
  if (w - c.wall > 30 || Math.abs(H0 - c.H0) > 1e-4){ c.H0 = H0; c.k = 0; }   // (a new tick: 200 ms on, a third of a game second or more; within one the views' time barely moves)
  c.wall = w; c.k++; return c.H0 + (c.k - 1) * DYN_H / 3600;
}
// the vessels, the fixed things and the buoys near her (within 300 m), from npcStates' whole list every two game seconds, each vessel
// with her velocity on the grid (m/s, x east, z south) to carry her on between
function sjvNear(H, X, Z){
  const T = SJV.tl, b = S.boat;
  if (T && T.vid === S.cur && Math.abs(H - T.H) < 2 / 3600 && Math.hypot(X - T.X, Z - T.Z) < 100) return T;
  const gs = gridScale(b.pos), list = npcStates(H), v = [], help = helmOn(), tow = [S.ptow && S.ptow.pid, S.ptowH && S.ptowH.pid];
  for (const n of list){
    if (!n.p || n.hidden || n.rs || n.kv || (n.tur && n.st === 'tow') || tow.includes(n.id)) continue;
    const cls = n.cls || colregCls(n); if ((cls === 'moor' || cls === 'anch') && !help) continue;   // (at the quay only by hand: Autonav's way in is the harbour's)
    const x = n.p.x * 1000, z = n.p.y * 1000; if (Math.hypot(x - X, z - Z) > 300 + (n.L || 10)) continue;
    const c = n.cog != null ? n.cog : n.hd, ms = (n.v || 0) * KN_MS * gs;
    v.push({n, x, z, ve:Math.sin(c) * ms, vz:-Math.cos(c) * ms, hd:n.hd || 0, L:n.L || 10, B:n.B || (n.L || 10) / 3, m:sjvMass(n)});
  }
  const f = []; try { if (typeof obsIndex === 'function'){ const idx = obsIndex(), C = HIND.C; for (let j = Math.floor((Z - 300) / C); j <= Math.floor((Z + 300) / C); j++) for (let i = Math.floor((X - 300) / C); i <= Math.floor((X + 300) / C); i++)
    for (const o of idx.get(i * 1048576 + j) || []) if (o.t === 0 && (o.why === 'mark' || o.why === 'turbine' || o.B) && !f.includes(o) && Math.hypot(o.x - X, o.z - Z) < 300) f.push(o); } } catch (e){}
  const g = []; for (const s of NPCGEAR) for (const [k, p] of [['a', s.a], ['b', s.b]]) if (p && Math.hypot(p.x * 1000 - X, p.y * 1000 - Z) < 300) g.push({key:s.id + ':' + k, x:p.x * 1000, z:p.y * 1000, name:s.name});
  return SJV.tl = {vid:S.cur, H, X, Z, v, f, g};
}
// the impulse from a hull (or a fixed thing: m2 0, no velocity) at the contact I (sjvSat) on the model's state d: put out of it, the speed
// into it turned back with a fifth (fenders and rubbing strakes take the rest), as dynContact does for a quay. The blow's speed (knots)
// and energy (J), or null when they were already parting
function sjvImpulse(d, P, I, ve, vz, m2, gs){
  const sn = Math.sin(d.psi), c = Math.cos(d.psi), e = I.ox, nN = -I.oz, rx = I.x - d.X, rz = I.z - d.Y, xc = rx * sn - rz * c, yc = rx * c + rz * sn;
  const nu = e * sn + nN * c, nv = e * c - nN * sn, fu = ve * sn - vz * c, fv = ve * c + vz * sn;
  const vpu = d.u - d.r * yc - fu, vpv = d.v + d.r * xc - fv, vn = vpu * nu + vpv * nv, arm = xc * nv - yc * nu;
  d.X += I.ox * (I.d + 0.02); d.Y += I.oz * (I.d + 0.02);
  if (vn >= 0) return null;
  const den = nu * nu / P.mx + nv * nv / P.my + arm * arm / P.Iz + (m2 > 0 ? 1 / m2 : 0), J = -(1 + 0.2) * vn / den;
  d.u += J * nu / P.mx; d.v += J * nv / P.my; d.r += J * arm / P.Iz;
  return {kn:-vn / KN_MS / (gs || 1), E:0.5 * vn * vn / den};
}
// one step of the model (16b-dyn.js dynContact's one call): the other vessels, then the marks, piers and turbines, then the buoys
function sjvTouch(b, d, P){
  if (b !== S.boat || !sjvLive() || b.status !== 'sailing' || b.anch) return null;
  sjvFresh(true);   // (a look now and then also by hand with no view asking: the trail the fault is read from)
  const H = sjvClock(), T = sjvNear(H, d.X, d.Y), gs = gridScale(b.pos), A = sjvHullPts(d.X, d.Y, d.psi, P.L, P.B), dt = (H - T.H) * 3600;
  let out = null;
  for (const q of T.v){
    const x = q.x + q.ve * dt, z = q.z + q.vz * dt; if (Math.hypot(x - d.X, z - d.Y) > (P.L + q.L) * 0.6 + 2) continue;
    const I = sjvSat(A, sjvHullPts(x, z, q.hd, q.L, q.B)); if (!I) continue;
    const cog = Math.abs(d.u) > 0.3 ? d.psi + Math.atan2(d.v, Math.abs(d.u)) : d.psi, pre = {p:{x:d.X / 1000, y:d.Y / 1000}, hd:d.psi, cog, v:Math.hypot(d.u, d.v) / KN_MS};
    const im = sjvImpulse(d, P, I, q.ve, q.vz, q.m, gs); if (!im) continue;
    out = sjvBlow(Object.assign({}, q.n, {p:{x:x / 1000, y:z / 1000}}), im.kn, im.E, H, pre) || out;
  }
  for (const o of T.f){
    if (Math.hypot(o.x - d.X, o.z - d.Y) > P.L * 0.6 + o.r + 2) continue;
    const I = sjvSatC(A, o.x, o.z, o.r); if (!I) continue;
    const im = sjvImpulse(d, P, I, 0, 0, 0, gs); if (!im || !(im.kn >= HULL.fend)) continue;
    const last = SJV.fix.get('o' + o.id); if (last && H - last.t < 1 / 60 && im.kn < last.kn + 0.5) continue; SJV.fix.set('o' + o.id, {t:H, kn:im.kn});
    const what = o.why === 'turbine' ? ['vindturbinen', 'the wind turbine'] : o.B ? ['brupilaren', "the bridge's pier"] : ['sjømerket', 'the sea mark'], k = (Math.round(im.kn * 10) / 10).toFixed(1), say = hullSay(hullHit(im.kn, im.E, 'merke', b));
    const no = (im.kn >= HULL.scr ? 'Hardt støt mot ' : 'Smell i ') + what[0] + ', ' + k.replace('.', ',') + ' knop.' + (say ? say.no : ''), en = (im.kn >= HULL.scr ? 'A hard blow against ' : 'A knock against ') + what[1] + ', ' + k + ' knots.' + (say ? say.en : '');
    log(no, en, 'nav'); if (typeof toast === 'function') toast(S.lang === 'en' ? en : no);
    b.hits = (b.hits || []).concat([{t:S.t, E:Math.round(im.E), kn:+im.kn.toFixed(1), k:'merke'}]).slice(-20);
  }
  // the buoys of the gear in the sea: run over at speed, said once (they are soft: no damage)
  if (Math.abs(d.u) >= 1.5 * KN_MS) for (const q of T.g){
    if (Math.abs(q.x - d.X) > P.L || Math.abs(q.z - d.Y) > P.L || !sjvInPoly(A, q.x, q.z)) continue;
    const last = SJV.fix.get(q.key); if (last && H - last.t < 0.2) continue; SJV.fix.set(q.key, {t:H, kn:0});
    log('Kjørte over blåsa til «' + q.name + '». Pass deg for redskap i sjøen.', 'Ran over «' + q.name + '»\'s buoy. Mind the gear in the sea.', 'nav');
    if (typeof toast === 'function') toast(S.lang === 'en' ? 'Ran over «' + q.name + '»\'s buoy.' : 'Kjørte over blåsa til «' + q.name + '».');
  }
  if (SJV.fix.size > 300) SJV.fix.clear();
  return out;
}

// ---- the look's sweep (sjvEval), when the model does not have her ----
// the hulls from the last look to this one in steps of about a metre and a half of their relative motion; a touch puts her out of it
// (and, on the minute step, holds her there that minute: sjvSail), with the blow from their velocities. The poses are kept for the next look
function sjvSweep(n, A, H, gs, on){
  const b = S.boat, own = b.status === 'sailing' && typeof livePose === 'function' ? livePose(clamp(H * 60 - S.t, 0, 0.999)) : null, ap = own && own.p ? own.p : A.p, ahd = own && own.hd != null ? own.hd : A.hd;
  const lp = SJV.lp.get(n.id), now = {H, ax:ap.x, ay:ap.y, ahd, bx:n.p.x, by:n.p.y, bhd:n.hd || 0};
  SJV.lp.set(n.id, now);
  if (!on || !lp || !(H > lp.H) || H - lp.H > 1.5 / 60 || b.status === 'port' || b.anch || n.rs || n.kv || n.hidden || String(n.id)[0] === 't') return null;
  const La = A.L || 10, Ba = A.B || La / 3, Lb = n.L || 10, Bb = n.B || Lb / 3, m = 1000;
  const rx0 = (lp.bx - lp.ax) * m, ry0 = (lp.by - lp.ay) * m, rx1 = (now.bx - now.ax) * m, ry1 = (now.by - now.ay) * m, dx = rx1 - rx0, dy = ry1 - ry0, d2 = dx * dx + dy * dy;
  const u = d2 > 1e-9 ? clamp(-(rx0 * dx + ry0 * dy) / d2, 0, 1) : 0;
  if (Math.hypot(rx0 + dx * u, ry0 + dy * u) > (La + Lb) * 0.6 + 2) return null;
  const N = clamp(Math.ceil(Math.sqrt(d2) / 1.5), 1, 80), lerpA = (a0, a1, f) => a0 + sjvWrap(a1 - a0) * f;
  for (let i = 1; i <= N; i++){
    const f = i / N, ax = (lp.ax + (now.ax - lp.ax) * f) * m, ay = (lp.ay + (now.ay - lp.ay) * f) * m, bx = (lp.bx + (now.bx - lp.bx) * f) * m, by = (lp.by + (now.by - lp.by) * f) * m;
    const I = sjvSat(sjvHullPts(ax, ay, lerpA(lp.ahd, now.ahd, f), La, Ba), sjvHullPts(bx, by, lerpA(lp.bhd, now.bhd, f), Lb, Bb)); if (!I) continue;
    const dtS = (H - lp.H) * 3600, vax = (now.ax - lp.ax) * m / dtS, vay = (now.ay - lp.ay) * m / dtS, vbx = (now.bx - lp.bx) * m / dtS, vby = (now.by - lp.by) * m / dtS;
    const vn = (vax - vbx) * I.ox + (vay - vby) * I.oz, Hf = lp.H + (H - lp.H) * f;
    // put out of her where they touched (the boat you follow: the other is on her clock)
    b.pos = {x:(ax + I.ox * (I.d + 0.5)) / m, y:(ay + I.oz * (I.d + 0.5)) / m}; SJV.lp.set(n.id, Object.assign(now, {ax:b.pos.x, ay:b.pos.y}));
    if (b.status === 'sailing') b.v = 0;
    if (!(vn < 0)) return null;
    const mA = sjvOwnMass(b), mB = sjvMass(n), meff = mA * mB / (mA + mB), ca = Math.hypot(now.ax - lp.ax, now.ay - lp.ay) > 1e-7 ? Math.atan2(now.ax - lp.ax, -(now.ay - lp.ay)) : ahd;
    const pre = {p:{x:ax / m, y:ay / m}, hd:lerpA(lp.ahd, now.ahd, f), cog:ca, v:Math.hypot(vax, vay) / KN_MS / gs};
    return sjvBlow(Object.assign({}, n, {p:{x:bx / m, y:by / m}}), -vn / KN_MS / gs, 0.5 * meff * vn * vn, Hf, pre);
  }
  return null;
}

// ---- Ø11.8: the fairway: the speed limits and the cardinal marks (docs/systemer/sjofart-og-lover.md kap. 9) ----
// The speed limits (src/data/fart.json and fart-r.b64, tools/fart/fart.py). The state's limits for commercial vessels: Kystverket's
// layer of FOR-2021-12-16-3622 (74 areas, NLOD 2.0, fetched 12.11.2026), each rasterised at 20 m as runs per row (fart-r, a data element
// the build takes out of the page and the page fetches late, as the models; until it has come there are no areas). Where an area holds
// (in its period), its limit is the one, also when it is higher than the harbour's; where none does, Jonas' choice V4 A (28.10.2026):
// 5 knots within half a kilometre of every harbour point (PORTS). Jonas 12.11.2026, «enig med ditt forslag» to both: the regulation's
// areas where they are and the harbour's 5 knots where it says nothing, and no line in the chart («Jeg hater den ringen i kartet da»).
// Autonav holds the limit (sjvCapV for the manoeuvring model, 05-vessels.js sailV for the minute step, so with the game closed too: the
// shared clock); by hand the strip says so when she is over, and a passage well over it is a line in the log and a row in the Sikkerhet
// card (V1 A: no fines). The cardinal marks (IALA region A): by hand, close by a cardinal mark on the side it warns of, the strip says
// «Du går på feil side av merket». The lateral marks are not judged: the direction of buoyage is not in the data.
const FART_D = /*@include(data/fart.json)*/null;
const FART = {R:null, cell:null, n:-1, last:null,   // the areas' runs (null not read yet, false never), the harbours by 1 km cell, the last answer
  w:null,                   // what the strip says now: {k:'fart', kn, v, name} or {k:'merke', cat}
  over:null, done:null,     // over the limit now: {id (vessel|zone), H1 (a knot over since), peak}; the visit already written (vessel|zone)
  mk:new Map(),             // the cardinal marks said: 'x,y' -> H
  rows:0, nMk:0,            // rows written since the page was opened (tests/farttest.py)
  TOL:0.5, REC:1, HOLD:30 / 3600,   // over by this much (knots) the strip says so; by this much for this long (game hours) it is written
  MKR:0.2, MKV:2};          // a cardinal mark's reach (true km) and the least speed (knots)
// the date at H as month * 100 + day (501 is 1 May), as the areas' periods are
function fartMd(H){ try { const d = gDate(H); return (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); } catch (e){ return 0; } }
// in the period [from, to] (month * 100 + day, over the new year when from > to; none: the whole year)
function fartInSeason(s, md){ if (!s || !md) return true; return s[0] <= s[1] ? md >= s[0] && md <= s[1] : md >= s[0] || md <= s[1]; }
// the runs from their bytes: per area a row index (H + 1) into a flat list of [start, end) cells; false when they do not match fart.json
function fartRunsFrom(b){
  const D = FART_D; if (!D || !D.omr || !b || (D.sb && b.length !== D.sb)) return false;
  let o = 0; const rd = () => { let v = 0, m = 1, c; do { c = b[o++]; v += (c & 127) * m; m *= 128; } while (c & 128); return v; };
  if (rd() !== D.omr.length) return false;
  const out = [];
  for (const a of D.omr){ const row = new Uint32Array(a.H + 1), run = []; let k = 0;
    for (let y = 0; y < a.H; y++){ row[y] = k; const n = rd(); let x = 0; for (let q = 0; q < n; q++){ x += rd(); const e = x + rd(); run.push(x, e); x = e; k++; } }
    row[a.H] = k; out.push({row, run:Int32Array.from(run)}); }
  return o === b.length ? out : false;
}
function fartRuns(){
  if (FART.R !== null) return FART.R;
  let b = null;
  if (typeof DATAB !== 'undefined' && DATAB.has('fart-r')) b = DATAB.get('fart-r');
  else if (typeof document !== 'undefined'){ const el = document.getElementById('fart-r'); if (el && !(el.dataset && el.dataset.src) && el.textContent.trim()) b = b64bytes(el.textContent.trim()); }
  if (!b){ if (typeof MODELS !== 'undefined' && MODELS.failed && MODELS.failed.includes('fart-r')) FART.R = false; return FART.R === false ? false : null; }
  FART.R = fartRunsFrom(b) || false; FART.last = null; if (typeof DATAB !== 'undefined') DATAB.delete('fart-r');
  return FART.R;
}
// in area i at cell (cx, cy) (game metres / R)
function fartInArea(i, cx, cy){
  const a = FART_D.omr[i], x = cx - a.x0, y = cy - a.y0; if (x < 0 || y < 0 || x >= a.W || y >= a.H) return false;
  const T = FART.R[i], r = T.run; for (let k = T.row[y], e = T.row[y + 1]; k < e; k++){ if (x < r[k * 2]) return false; if (x < r[k * 2 + 1]) return true; } return false;
}
// the speed limit at p (grid km) at H (game hours): {kn, name, k:'omr'|'havn', id}, or null where there is none. The lowest of the areas
// p is inside in their periods, else the harbour's fixed limit within its radius (true metres: the radius over the grid's scale)
function fartAt(p, H){
  const R = fartRuns(), np = typeof PORTS !== 'undefined' ? PORTS.length : 0, L = FART.last;
  if (L && L.x === p.x && L.y === p.y && L.np === np && L.R === R && Math.abs(L.H - H) < 1) return L.f;
  let f = null;
  if (R){ const D = FART_D, cx = Math.floor(p.x * 1000 / D.R), cy = Math.floor(p.y * 1000 / D.R), md = fartMd(H);
    for (let i = 0; i < D.omr.length; i++){ const a = D.omr[i]; if (cx < a.x0 || cy < a.y0 || cx >= a.x0 + a.W || cy >= a.y0 + a.H || !fartInSeason(a.s, md) || !fartInArea(i, cx, cy)) continue;
      if (!f || a.kn < f.kn) f = {kn:a.kn, name:a.n, k:'omr', id:'o' + i}; } }
  const hv = FART_D && FART_D.havn;
  if (!f && hv && typeof PORTS !== 'undefined'){
    if (!FART.cell || FART.n !== PORTS.length){ FART.cell = new Map(); FART.n = PORTS.length;
      for (const pt of PORTS) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++){ const k = (Math.floor(pt.p.x) + a) * 65536 + Math.floor(pt.p.y) + b; let l = FART.cell.get(k); if (!l) FART.cell.set(k, l = []); l.push(pt); } }
    const l = FART.cell.get(Math.floor(p.x) * 65536 + Math.floor(p.y));
    if (l){ const r = hv.r * gridScale(p); let bd = r; for (const pt of l){ const d = dist(p, pt.p); if (d < bd){ bd = d; f = {kn:hv.kn, name:pt.name || '', k:'havn', id:'h' + pt.id}; } } }
  }
  FART.last = {x:p.x, y:p.y, H, f, np, R}; return f;
}
const fartKn = (p, H) => { const f = fartAt(p, H); return f ? f.kn : 1e9; };
// the lowest limit along the route from p over L grid km (the minute step's way: the legs from the waypoint she is going to), at the
// start and every 50 m (1e9 for none)
function fartLegKn(pl, p, L, H){
  let kn = fartKn(p, H), q = p, left = Math.max(0, L), i = pl ? pl.idx : 0;
  while (left > 1e-6 && pl && i < pl.wps.length){ const w = pl.wps[i], d = dist(q, w), s = Math.min(d, left), n = Math.max(1, Math.ceil(s / 0.05));
    for (let k = 1; k <= n; k++){ const u = d > 1e-9 ? s * k / n / d : 0; kn = Math.min(kn, fartKn({x:q.x + (w.x - q.x) * u, y:q.y + (w.y - q.y) * u}, H)); }
    left -= s; if (s < d) break; q = w; i++; }
  return kn;
}
// Autonav's speed under the limit (m/s, 1e9 for none): where she is and where she will be in twenty seconds (at least 60 m ahead), so
// she is down to it when she comes in, not after
function fartCapMs(){
  try {
    if (!S.boat || !FART_D || S.mob) return 1e9; const H = S.t / 60;   // (none while someone is in the water: «Autonav: MOB» goes as fast as she can)
    if (typeof dynLive === 'function' && dynLive()){ const q = dynPose(), a = Math.max(60, q.spd * 20) / 1000 * gridScale(q), kn = Math.min(fartKn({x:q.x, y:q.y}, H), fartKn({x:q.x + Math.sin(q.hd) * a, y:q.y - Math.cos(q.hd) * a}, H)); return kn < 1e8 ? kn * KN_MS : 1e9; }
    const kn = fartKn(S.boat.pos, H); return kn < 1e8 ? kn * KN_MS : 1e9;
  } catch (e){ return 1e9; }
}
// a cardinal mark's safe side, as the bearing from the mark (true, radians): north of a north mark, and so on
const FARV_CARD = {north:0, east:Math.PI / 2, south:Math.PI, west:-Math.PI / 2};
// on the wrong side of a cardinal mark: within reach of it, in the quarter opposite its name (the bearing from the mark to her within
// 45 degrees of the side it warns of). p and mk in grid km, the bearing made true with the grid's convergence. The mark, or null
function farvWrongSide(p, marks){
  const gs = gridScale(p), g = gridGamma(p) * Math.PI / 180; let best = null, bd = FART.MKR * gs;
  for (const mk of marks){ if ((mk[2] !== 'C' && mk[2] !== 'S') || FARV_CARD[mk[3]] == null) continue;
    const dx = p.x - mk[0], dy = p.y - mk[1], d = Math.hypot(dx, dy); if (d >= bd || d < 1e-6) continue;
    if (Math.abs(sjvWrap(Math.atan2(dx, -dy) + g - FARV_CARD[mk[3]] - Math.PI)) < Math.PI / 4){ bd = d; best = mk; } }
  return best;
}
// one look (from sjvEval, a real second apart): only with the game open and the skipper steering herself (prinsipp 4; Autonav holds
// the limit and finds its own way by the depths), under way. The strip's words while it lasts; a passage over the limit by a knot for
// thirty game seconds is written once a visit, a cardinal mark once a game hour
function farvLook(H){
  FART.w = null;
  try {
    const b = S.boat; if (!sjvLive() || !b || b.status !== 'sailing' || (S.plan && !(typeof helmOn === 'function' && helmOn()))){ FART.over = null; return; }
    const live = typeof dynLive === 'function' && dynLive(), q = live ? dynPose() : null, p = q ? {x:q.x, y:q.y} : b.pos, v = q ? q.sog / KN_MS : (b.v || 0);
    const f = fartAt(p, H), vz = f ? S.cur + '|' + f.id : null;
    if (FART.done && FART.done !== vz) FART.done = null;   // (out of that harbour's water, or another boat: the next visit is a new one)
    if (f && v > f.kn + (FART.over ? 0.2 : FART.TOL)){
      FART.w = {k:'fart', kn:f.kn, v, name:f.name, hk:f.k};
      const o = FART.over && FART.over.id === vz ? FART.over : (FART.over = {id:vz, H1:null, peak:0});
      // (a knot over, held: the clock starts when she goes a knot over and stops when she is under that again)
      if (v > f.kn + FART.REC){ if (o.H1 == null){ o.H1 = H; o.peak = 0; } if (v > o.peak) o.peak = v; } else o.H1 = null;
      if (FART.done !== vz && o.H1 != null && H - o.H1 >= FART.HOLD){ FART.done = vz; FART.rows++;
        const no = fmtC(o.peak, 1), wh = f.name ? ' (' + f.name + ')' : '';
        log('Gikk ' + no + ' knop der fartsgrensa er ' + f.kn + ' knop' + wh + '.', 'Made ' + no + ' knots where the speed limit is ' + f.kn + ' knots' + wh + '.');
        farvRec({k:'fart', kn:f.kn, v:Math.round(o.peak * 10) / 10, name:f.name || ''}); }
    } else FART.over = null;
    if (!FART.w && v >= FART.MKV && typeof marksNear === 'function'){
      const mk = farvWrongSide(p, marksNear('marks', p.x, p.y, 0.5));
      if (mk){ FART.w = {k:'merke', cat:mk[3]}; const key = mk[0] + ',' + mk[1], was = FART.mk.get(key);
        if (was == null || H - was > 1){ if (FART.mk.size > 200) FART.mk.clear(); FART.mk.set(key, H); FART.nMk++;
          const W = FARV_WORD[mk[3]];
          log('Passerte et ' + W[0] + 'merke på feil side. Det er trygt ' + W[0] + ' for merket.', 'Passed ' + W[2] + ' cardinal mark on the wrong side. The safe water is ' + W[1] + ' of it.');
          farvRec({k:'merke', cat:mk[3]}); } }
    }
  } catch (e){ FART.w = null; }
}
// the rows for the Sikkerhet card (14b-sikkerhet.js mobSafeRows), in a list of their own (S.farv, at most 20): they are not man
// overboard, and must not push the real ones out of S.mobs
function farvRec(r){ const L = S.farv || (S.farv = []), b = S.boat; L.push(Object.assign({t:S.t, vid:S.cur, x:Math.round(b.pos.x * 1000) / 1000, y:Math.round(b.pos.y * 1000) / 1000}, r)); if (L.length > 20) L.splice(0, L.length - 20); }
const FARV_WORD = {north:['nord', 'north', 'a north'], east:['øst', 'east', 'an east'], south:['sør', 'south', 'a south'], west:['vest', 'west', 'a west']};
// what the strip, the box and the card say (after the rules of the road's own warning): {sev, k, ...} or null
function farvWarn(){ return sjvLive() && S.boat && S.boat.status !== 'port' ? FART.w : null; }
function farvSay(w, how){
  const no = S.lang !== 'en', tiny = how === 'tiny';
  if (w.k === 'fart') return tiny ? (no ? 'Fartsgrense ' + w.kn + ' kn' : 'Speed limit ' + w.kn + ' kn')
    : (no ? 'Fartsgrense ' + w.kn + ' knop: du går ' + fmtC(w.v, 1) : 'Speed limit ' + w.kn + ' knots: you make ' + fmtC(w.v, 1));
  const W = FARV_WORD[w.cat] || FARV_WORD.north;
  return tiny ? (no ? 'Feil side av merket' : 'Wrong side of the mark') : (no ? 'Du går på feil side av merket: hold ' + W[0] + ' for det' : 'You are on the wrong side of the mark: keep ' + W[1] + ' of it');
}
