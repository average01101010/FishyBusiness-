// ===== Ø11.6: man overboard (SK2 the risk, SK3 the event; docs/planer/lover-regler-sikkerhet.md kap. 6, docs/systemer/sjofart-og-lover.md kap. 6) =====
// The risk (SK2): a hand at work on deck may go over the side. Per hour on deck it is next to nothing in calm water and grows with the
// sea against the boat's own limits (BOAT.risk, the riskLevel thresholds: a sea at the boat's red limit is 1), and is higher in the dark,
// in spray icing, while gear is set or hauled over the rail, and on an open boat. A fall happens only with the game open and running,
// on the boat the player follows and is aboard, awake, and able to do something (principle 4 in docs/planer/lover-og-regler.md: the one
// who does not steer never gets consequences she could not influence). Never the skipper (the player is the one who acts), and never
// with her alone aboard: only the crew go over. With the game closed, on another of her boats, or with her asleep, only near misses
// happen, which the crew take themselves; they stand in the log (and so in «Mens du var borte»). Rare (kap. 5.10 of the plan: falls
// overboard are rare per fisher and grave when they happen), and the rate is a game choice that is measured (MOBK.R0).
// The event (SK3): the alarm and «Mann over bord!», the MOB mark set in the plotter (the button), the Williamson turn by hand or
// «Autonav: MOB», the lifebuoy thrown (from 15 m the MOB light with its smoke shows the place), the person up by the ladder aft (FOR-2013-
// 11-22-1404 § 63), the lifting sling, or from 45 m the rescue boat swung out with its davit (FOR-2000-06-13-660 § 7-5). How long the
// person lasts in the water goes by the sea's temperature; the life jacket keeps her up. Nobody dies (V8 A, Jonas 05.11.2026): if the
// boat does not get back in time, the rescue boat or the helicopter takes the person, who is off sick some days and comes back. The
// report after sjøloven § 475 and skipssikkerhetsloven § 47 (read on Lovdata 07.11.2026) the game sends for you, and writes in the log.
// No courses or drills (V11 C). The deck's people come from core/13-work.js workAssign (mobDeck), the minute from core/05-vessels.js risk
// (mobRisk), the sick leave from core/04-crew.js crewTick (mobCrewHour); the screen is ui/10s-mob.js, the 3D view/21-rescue-anchor.js.
// No Math.random here: the dice are a hash of the game's seed, the vessel and the minute (mobRnd), so the seeded tests keep their dice.
const MOBK = {
  R0:1 / 400,          // falls an hour for one person at work on deck, with the sea at the boat's red limit, by day and with no ice (a game choice)
  near:3,              // near misses for every fall: the deck warns before it takes anyone
  x0:0.3,              // under 30 % of the red limit nothing happens (calm water)
  dark:1.5, ice:2, gop:1.3, open:1.5, shelter:0.35,
  gap:24 * 60, nearGap:120,       // game minutes: at most one fall a day on a vessel, one near miss in two hours
  leeP:0.012, leeB:0.03,          // leeway: a person in a life jacket and a lifebuoy, a share of the wind's speed
  reach:0.025, slow:2,            // the ladder and the sling: within 25 m, under 2 knots
  boatReach:0.5, boatSlow:3,      // the rescue boat from 45 m: within 500 m, the ship under 3 knots
  ladder:2, sling:4,              // game minutes to get her up
  mb:{swing:1, lowerH:8, kn:6, pick:1, hoist:1.5},   // the rescue boat: the davit out, the fall (LSA 6.1.2.8: 0.4 + 0.02 H m/s), 6 knots (LSA 5.1.1.3)
  rs:{muster:10, kn:25, way:1.25}, heli:{muster:15, kn:140},
  smoke:15,             // minutes the MOB light's smoke burns (LSA 2.1.3: at least 15)
  hold:0.015            // within 15 m of the lifebuoy she gets hold of it
};
// the stations on deck and how exposed they are (the rail where the gear comes in the most); the wheelhouse, the galley and a break
// inside are not on deck. On a shelter deck or in a factory the gutting and the hauling port are under cover (MOBK.shelter)
const MOBW = {haling:1.6, blogg:1.6, fiske:1.2, sloy:1, is:1, sort:1, egn:0.8, strip:0.8, mend:0.8, stell:0.8, last:1, pause:0.6};
const MOB_IN = {inside:1, sleep:1, shop:1, quay:1};
// the time in the water with a life jacket before exhaustion or unconsciousness, by the sea's temperature (°C, minutes): the usual table
// of cold-water immersion (U.S. Coast Guard), its lower ends (assumed: not read at the source here). The 1-10-1 rule (a minute of cold
// shock, ten of useful movement, an hour before unconsciousness) gives the time she can still climb a ladder (mobAbleMin)
const MOBT = [[-2, 12], [0, 15], [4.5, 30], [10, 60], [15.5, 120], [21, 180], [27, 360]];
// the rescue helicopters: the air force's 330 squadron (Sola, Florø, Ørland, Bodø, Banak, Rygge) and the governor's on Svalbard (assumed
// places and readiness, MOBK.heli); the rescue boats are Redningsselskapet's stations (core/05-vessels.js rescueBases)
const MOBHELI = [['Sola', 58.88, 5.64], ['Florø', 61.58, 5.03], ['Ørland', 63.70, 9.60], ['Bodø', 67.27, 14.37], ['Banak', 70.07, 24.97], ['Rygge', 59.38, 10.79], ['Longyearbyen', 78.25, 15.47]];
let MOBD = {t:-1, vid:null, P:[]};   // who stood where on deck this minute (workAssign → mobDeck)
const MOBF = {fol:null, live:null};  // the vessel the player follows (ui/10s-mob.js sets it between the ticks); live: the tests' handle on mobLive

// ---- pure: the sea, the rate, the time in the water, the sight ----
// the sea against the boat's own limits: 1 at the red limit (riskLevel 2) of the waves or the wind, whichever is nearer
function mobSeaX(W, hs, r){ r = r || [1.5, 2.5, 12, 16]; return Math.max((hs || 0) / r[1], (W || 0) / r[3]); }
// the share of the rate from the sea: nothing under x0, a square up to 1 at the red limit, and on over it
function mobSeaF(x){ return x <= MOBK.x0 ? 0 : Math.pow((x - MOBK.x0) / (1 - MOBK.x0), 2); }
// spray icing: the air under the sea water's freezing point (about -2 °C) in a wind of 9 m/s and more, over a sea under 8 °C (Overland's
// predictor in outline; assumed)
function mobIcing(T, W, sst){ return T <= -2 && W >= 9 && sst < 8; }
// the falls an hour for exposure w (the sum of the deck's weights) and the boat's state o {x, dark, ice, gop, open}
function mobRate(w, o){ return w * MOBK.R0 * mobSeaF(o.x) * (o.dark ? MOBK.dark : 1) * (o.ice ? MOBK.ice : 1) * (o.gop ? MOBK.gop : 1) * (o.open ? MOBK.open : 1); }
function mobLimMin(T){ const A = MOBT; if (T <= A[0][0]) return A[0][1]; for (let i = 1; i < A.length; i++) if (T <= A[i][0]){ const [a, va] = A[i - 1], [b, vb] = A[i]; return Math.round(va + (vb - va) * (T - a) / (b - a)); } return A[A.length - 1][1]; }
function mobAbleMin(T){ return Math.round(clamp(mobLimMin(T) / 3, 8, 40)); }
// how far off she is seen (km): the head and the vest's collar (less in a sea), the orange ring with its light by night (2 cd, about
// a mile), the orange smoke by day; a searchlight (12 m and up, § 89) shows a little more by night; never past the visibility
function mobSightKm(o){
  const sea = 1 / (1 + 1.2 * Math.max(0, o.hs || 0)), lamp = !!o.lamp;
  let d = o.dark ? (lamp ? 0.2 : 0.04) : 0.4 * sea;
  if (o.buoy) d = Math.max(d, o.dark ? (o.light ? 1.8 : lamp ? 0.25 : 0.05) : 0.8 * sea);
  if (o.smoke && !o.dark) d = Math.max(d, 2.0);
  return Math.min(d, o.vis != null ? o.vis : 50);
}
// the leeway (km a minute, in the grid) at p: downwind, a share k of the wind's speed
function mobLee(H, p, k){
  let W = 0, dir = 0; try { W = windAt(H, p); dir = (windDir(H, p) - gridGamma(p) + 180) * Math.PI / 180; } catch (e){ return {x:0, y:0}; }
  const v = W * k * 60 / 1000 * gridScale(p); return {x:Math.sin(dir) * v, y:-Math.cos(dir) * v};
}
const mobHm = H => { const d = gDate(H); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
const mobLL = p => { const q = natLL(p), f = (v, a, b) => { const A = Math.abs(v), d = Math.floor(A), m = (A - d) * 60; return d + '°' + m.toFixed(1).padStart(4, '0') + "' " + (v >= 0 ? a : b); }; return f(q.lat, 'N', 'S') + ' ' + f(q.lon, 'Ø', 'V'); };
const mobLLen = p => mobLL(p).replace(/Ø$/, 'E').replace(/V$/, 'W');
// the dice: a hash of the game's seed, the vessel and the minute (no Math.random, so the seeded tests keep their dice)
function mobRnd(k){ return hashStr(String((S.ach && S.ach.seed) || 7) + '|' + S.cur + '|' + S.t + '|mob|' + k) / 4294967296; }

// ---- who is on deck (core/13-work.js workAssign, every call; the minute's own call, as undefined, is kept) ----
// the person in the water and the hands of an ocean vessel's teams off sick are not aboard
function mobDeck(P, as){
  const M = S.mob && S.mob.vid === S.cur ? S.mob : null, off = (S.mobOff || []).filter(o => o.vid === S.cur && S.t < o.until);
  if (M || off.length) for (let i = P.length - 1; i >= 0; i--){ const c = P[i].c; if (!c) continue; if ((M && c.id === M.cid) || off.some(o => o.id === c.id)) P.splice(i, 1); }
  if (as == null) MOBD = {t:S.t, vid:S.cur, P};
}
// a person's exposure on deck this minute (0: not on deck, or the skipper)
function mobWeight(p){
  const c = p.c; if (!c || (c.anon && c.role === 'bro')) return 0;
  const F = BOAT.fac || {}, st = p.st; let w = MOBW[st] || 0;
  if (st === 'ror') w = F.house === 'open' ? 0.4 : 0;
  if (st === 'pause') w = p.idle === 'seasick' ? 1.5 : MOB_IN[p.idle] || !p.idle ? 0 : MOBW.pause;
  if ((st === 'sloy' || st === 'is' || st === 'sort') && ((c.anon && c.role === 'fabrikk') || (typeof snoVessel === 'function' && snoVessel()) || (typeof holdFreezes === 'function' && holdFreezes()))) w = 0;   // the factory, inside
  if (F.shelter && (st === 'sloy' || st === 'is' || st === 'haling' || st === 'blogg')) w *= MOBK.shelter;
  return w;
}
function mobOnDeck(){
  const P = MOBD.t === S.t && MOBD.vid === S.cur ? MOBD.P : (typeof workAssign === 'function' ? workAssign() : []);
  return P.map(p => ({p, w:mobWeight(p)})).filter(q => q.w > 0);
}
// the boat's state for the rate where she is
function mobState(H, W, hs){
  const b = S.boat, p = b.pos; let dark = false, T = 5, sst = 5, hw = hs;
  try { dark = sunAt(H, p).el < -6; T = airTemp(H, p); sst = seaTemp(H, p); hw = typeof hsWork === 'function' ? hsWork(p, H) : hs; } catch (e){ /* a block not loaded */ }
  const F = BOAT.fac || {};
  return {x:mobSeaX(W, hw, BOAT.risk), dark, ice:mobIcing(T, W, sst), gop:!!b.gop, open:F.house === 'open', T, sst};
}

// ---- when the game is open, on the boat she follows, and she can do something ----
function mobLive(){ if (MOBF.live != null) return !!MOBF.live; try { return typeof DYN !== 'undefined' && DYN.on && simRate() <= 60 && !(typeof CATCH_LEFT !== 'undefined' && CATCH_LEFT > 0); } catch (e){ return false; } }
const mobFollowed = () => MOBF.fol == null ? S.cur === S.me : MOBF.fol === S.cur;
function mobCan(){
  const b = S.boat;
  return mobLive() && mobFollowed() && meAboard() && !asleep() && !(typeof resting === 'function' && resting()) && ['sailing', 'fishing', 'idle'].includes(b.status)
    && !(typeof tutOn === 'function' && tutOn()) && !S.tut && !S.mob;
}
const mobRecent = (k, gap) => (S.mobs || []).some(r => r.vid === S.cur && r.k === k && S.t - r.t < gap);

// ---- the minute (core/05-vessels.js risk): the event going on, or the dice ----
function mobRisk(W, hs){
  const b = S.boat; if (S.mob && S.mob.vid === S.cur){ mobStep(W, hs); return; }
  if (!['sailing', 'fishing', 'idle', 'engine', 'adrift'].includes(b.status) || S.tut) return;
  const on = mobOnDeck(); if (!on.length) return;
  const H = S.t / 60, o = mobState(H, W, hs), w = on.reduce((a, q) => a + q.w, 0), rate = mobRate(w, o); if (!(rate > 0)) return;
  if (mobRnd('ev') >= rate * (1 + MOBK.near) / 60) return;
  let r = mobRnd('who') * w, who = on[0]; for (const q of on){ r -= q.w; if (r <= 0){ who = q; break; } }
  if (mobCan() && mobRnd('fall') < 1 / (1 + MOBK.near) && !mobRecent('mob', MOBK.gap)) mobStart(who, on, o);
  else if (!mobRecent('near', MOBK.nearGap)) mobNear(who, on, o);
}
// a near miss: the crew take it themselves (and the log keeps it, for «Mens du var borte» and Ø11.7's Sikkerhet card)
const MOBNEAR = [
  ['{n} skled på dekket i sjøen og fikk tak i rekka. Ingen gikk over bord.', '{n} slipped on deck in the sea and caught the rail. Nobody went over.'],
  ['En sjø over ripa tok beina under {n}, men {n} holdt seg fast.', 'A sea over the rail took {n}\'s feet away, but {n} held on.'],
  ['{n} mistet balansen ved rekka og ble tatt i jakka av {m}.', '{n} lost balance at the rail and was caught by the jacket by {m}.']];
function mobNear(q, on, o){
  const c = q.p.c, mate = on.find(x => x.p.c && x.p.c !== c), k = Math.floor(mobRnd('nt') * MOBNEAR.length) % MOBNEAR.length, T = MOBNEAR[mate ? k : k % 2];
  const n = c.name, m = mate ? mate.p.c.name : '';
  log('Nestenulykke: ' + T[0].replace(/\{n\}/g, n).replace('{m}', m), 'Near miss: ' + T[1].replace(/\{n\}/g, n).replace('{m}', m), 'nav');
  mobRec({k:'near', name:n, why:o.dark ? 'dark' : o.ice ? 'ice' : o.gop ? 'gear' : 'sea'});
}
function mobRec(r){ const L = S.mobs || (S.mobs = []), b = S.boat; L.push(Object.assign({t:S.t, vid:S.cur, x:Math.round(b.pos.x * 1000) / 1000, y:Math.round(b.pos.y * 1000) / 1000}, r)); if (L.length > 40) L.splice(0, L.length - 40); }

// ---- the rescue: the rescue boat from the nearest station, or the helicopter when it is there sooner ----
function mobRescue(p){
  let best = null;
  try { for (const r of rescueBases()){ const km = kmTrue(p, r.p), min = MOBK.rs.muster + km * MOBK.rs.way / (MOBK.rs.kn * NM) * 60; if (!best || min < best.min) best = {k:'rs', n:r.st || r.n, org:r.org, min, km}; } } catch (e){ /* no stations in the data */ }
  for (const [n, la, lo] of MOBHELI){ const km = kmTrue(p, natP(la, lo)), min = MOBK.heli.muster + km / (MOBK.heli.kn * NM) * 60; if (!best || min < best.min) best = {k:'heli', n, org:'330', min, km}; }
  if (!best) best = {k:'rs', n:'', org:'rs', min:60, km:0};
  best.min = Math.round(best.min); best.eta = S.t + best.min; return best;
}
const mobWhoR = (R, en) => R.k === 'heli' ? (en ? 'the rescue helicopter from ' : 'redningshelikopteret fra ') + R.n : R.org === 'kv' ? (en ? 'the Coast Guard ship' : 'Kystvaktskipet') : (en ? 'the rescue boat from ' : 'redningsskøyta fra ') + R.n;
const mobHim = (M, en) => en ? (M.sex === 'f' ? 'her' : 'him') : (M.sex === 'f' ? 'henne' : 'ham');
const mobHe = (M, en) => en ? (M.sex === 'f' ? 'she' : 'he') : (M.sex === 'f' ? 'hun' : 'han');

// ---- the fall ----
function mobStart(q, on, o){
  const b = S.boat, H = S.t / 60, c = q.p.c, T = Math.round(o.sst * 10) / 10, side = mobRnd('side') < 0.5 ? 1 : -1, hd = b.heading || 0;
  const off = ((BOAT.beam || 3) / 2 + 0.6) / 1000 * gridScale(b.pos), px = b.pos.x + Math.cos(hd) * side * off, py = b.pos.y + Math.sin(hd) * side * off, L = mobLee(H, {x:px, y:py}, MOBK.leeP);
  const M = S.mob = {id:'m' + S.t, vid:S.cur, cid:c.id, name:c.name, anon:!!c.anon, sex:c.sex || 'm', t0:S.t, x:px, y:py, vx:L.x, vy:L.y, side, h0:hd, T, lim:mobLimMin(T), able:mobAbleMin(T),
    mark:null, buoy:null, lift:null, seen:true, st:'water', fx:px, fy:py, resc:mobRescue(b.pos), dark:o.dark};
  const sd = side > 0 ? ['om styrbord', 'over the starboard side'] : ['om babord', 'over the port side'];
  log('Mann over bord! ' + c.name + ' gikk over bord ' + sd[0] + ' kl. ' + mobHm(H) + '. Sjøen holder ' + T.toFixed(1).replace('.', ',') + ' °C. Vesten holder ' + mobHim(M) + ' oppe.',
    'Man overboard! ' + c.name + ' went over ' + sd[1] + ' at ' + mobHm(H) + '. The sea is ' + T.toFixed(1) + ' °C. The life jacket keeps ' + mobHim(M, true) + ' up.', 'nav');
  // a hand on deck who saw it throws the lifebuoy at once (it lands by the person, who swims to it while she can)
  const mate = on.find(x => x.p.c && x.p.c !== c);
  if (mate){ const bo = 0.008 * gridScale(b.pos); M.buoy = {x:px + Math.cos(hd + 2) * bo, y:py + Math.sin(hd + 2) * bo, t:S.t, by:mate.p.c.name, held:false, light:true, smoke:!!(BOAT.lsa && BOAT.lsa.smoke)};
    log(mate.p.c.name + ' kastet livbøya etter ' + mobHim(M) + (M.buoy.smoke ? ', og MOB-lyset røyker.' : '.'), mate.p.c.name + ' threw the lifebuoy after ' + mobHim(M, true) + (M.buoy.smoke ? ', and the MOB light is smoking.' : '.'), 'nav'); }
  mobVhf(M);
  mobRec({k:'mob', name:c.name, T, lim:M.lim, resc:M.resc.k});
  if (hooks.onMob) hooks.onMob('start', M);
}
// the distress call on channel 16 (the game sends it for you, as it does the report after), and the coast radio's answer with the rescue
function mobVhf(M){
  const b = S.boat, nm = '«' + (S.boatName || 'Havbris') + '»', cs = typeof callOf === 'function' ? callOf(b) : null, R = M.resc, min = Math.max(1, R.min);
  const ask = ['MAYDAY, MAYDAY, MAYDAY. Dette er ' + nm + (cs ? ', ' + cs : '') + '. Mann over bord i posisjon ' + mobLL(b.pos) + '. Én person i sjøen med redningsvest. Vi snur og tar ' + mobHim(M) + ' opp.',
    'MAYDAY, MAYDAY, MAYDAY. This is ' + nm + (cs ? ', ' + cs : '') + '. Man overboard in position ' + mobLLen(b.pos) + '. One person in the water in a life jacket. We are turning to pick ' + mobHim(M, true) + ' up.'];
  const ans = ['Kystradioen: ' + nm + ', mottatt. Hovedredningssentralen har varslet ' + mobWhoR(R) + ', som er hos dere om rundt ' + min + ' minutter.',
    'The coast radio: ' + nm + ', received. The rescue coordination centre has called out ' + mobWhoR(R, true) + ', with you in about ' + min + ' minutes.'];
  const L = S.radio || (S.radio = []); L.push({t:S.t, from:'VHF 16', no:ask[0], en:ask[1]}, {t:S.t, from:'VHF 16', no:ans[0], en:ans[1]}); if (L.length > 40) L.splice(0, L.length - 40);
  log('VHF 16: ' + ask[0], 'VHF 16: ' + ask[1], 'nav'); log('VHF 16: ' + ans[0], 'VHF 16: ' + ans[1], 'nav');
}

// ---- where she is, and what is seen (live: at fraction f of the minute) ----
function mobAt(f){ const M = S.mob; if (!M) return null; if (M.st !== 'water') return {x:M.x, y:M.y}; f = f || 0; return {x:M.x + M.vx * f, y:M.y + M.vy * f}; }
function mobSightOf(p, buoyOnly){
  const M = S.mob, b = S.boat, H = S.t / 60; let dark = !!M.dark, hs = 0, vis = 50;
  try { dark = sunAt(H, p).el < -6; hs = hsAt(p, H); vis = visibility(H, p); } catch (e){ /* a block not loaded */ }
  const B = M.buoy, near = !!(B && (buoyOnly || B.held)), smoke = near && B.smoke && S.t - B.t < MOBK.smoke;
  return mobSightKm({dark, hs, vis, buoy:near, light:near && B.light, smoke, lamp:(BOAT.len || 0) >= 12});
}
// seen from the boat: the person (and the buoy she holds), or the buoy on its own
function mobSeen(pos){ const M = S.mob; if (!M || M.st !== 'water') return {p:false, b:false}; const b = pos || S.boat.pos, p = mobAt(0);
  return {p:kmTrue(b, p) <= mobSightOf(p), b:!!M.buoy && kmTrue(b, M.buoy) <= mobSightOf(M.buoy, true)}; }

// ---- the player's actions (ui/10s-mob.js): the MOB mark, the lifebuoy, Autonav: MOB, the lift ----
function mobMark(pos){
  const M = S.mob; if (!M || M.mark) return null; const p = mobAt(0), d = Math.round(kmTrue(pos, p) * 1000);
  M.mark = {x:pos.x, y:pos.y, t:S.t};
  log('MOB-merket satt i plotteren kl. ' + mobHm(S.t / 60) + ', ' + d + ' m fra ' + M.name + '.', 'The MOB mark set in the plotter at ' + mobHm(S.t / 60) + ', ' + d + ' m from ' + M.name + '.', 'nav');
  return M.mark;
}
function mobThrow(pos){
  const M = S.mob; if (!M || M.buoy || M.st !== 'water') return null; const p = mobAt(0), d = kmTrue(pos, p);
  M.buoy = {x:pos.x, y:pos.y, t:S.t, by:'me', held:d < MOBK.hold && S.t - M.t0 < M.able, light:true, smoke:!!(BOAT.lsa && BOAT.lsa.smoke)};
  log('Du kastet livbøya' + (M.buoy.held ? ', og ' + M.name + ' fikk tak i den.' : ', ' + Math.round(d * 1000) + ' m fra ' + M.name + '.') + (M.buoy.smoke ? ' MOB-lyset røyker.' : ''),
    'You threw the lifebuoy' + (M.buoy.held ? ', and ' + M.name + ' got hold of it.' : ', ' + Math.round(d * 1000) + ' m from ' + M.name + '.') + (M.buoy.smoke ? ' The MOB light is smoking.' : ''), 'nav');
  return M.buoy;
}
// where Autonav goes: the person when she is seen (where she will be when the boat is there), else the buoy when it is seen, else the mark
function mobTarget(){
  const M = S.mob, b = S.boat; if (!M || M.st !== 'water') return null; const s = mobSeen(), p = mobAt(0);
  if (s.p){ const eta = kmTrue(b.pos, p) / (Math.max(3, Math.min(BOAT.vcruise || 6, 8)) * NM) * 60; return {x:p.x + M.vx * eta, y:p.y + M.vy * eta, k:'p'}; }
  if (s.b) return {x:M.buoy.x, y:M.buoy.y, k:'b'};
  return M.mark ? {x:M.mark.x, y:M.mark.y, k:'m'} : null;
}
// the way back: the Williamson turn while she still runs away from the place (60° to the side she fell, then hard over to the other
// side round to the reciprocal course, back on her own track), then up to 15 m short of the target. The legs are checked for land and
// shallows; with one that is not clear, null with why (the screen then asks Autonav for its own way there)
function mobRoute(){
  const M = S.mob, b = S.boat; if (!M) return null;
  if (!M.mark) mobMark({x:b.pos.x, y:b.pos.y});
  const tgt = mobTarget(); if (!tgt) return null;
  const gs = gridScale(b.pos), R = Math.max(30, (BOAT.turnR || 40) * 1.6) / 1000 * gs, hd = b.heading || 0, f = {x:Math.sin(hd), y:-Math.cos(hd)}, s = M.side || 1, r = {x:Math.cos(hd) * s, y:Math.sin(hd) * s};
  let rel = Math.atan2(tgt.x - b.pos.x, -(tgt.y - b.pos.y)) - hd; while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
  const P = b.pos, at = (u, v) => ({x:P.x + f.x * u * R + r.x * v * R, y:P.y + f.y * u * R + r.y * v * R}), wps = [];
  const turn = Math.abs(rel) > 1.6 && b.status === 'sailing' && (b.v || 0) > 2 && kmTrue(P, tgt) < 2;
  if (turn) wps.push(at(0.866, 0.5), at(2.232, 0.866), at(2.598, -0.5), at(1.732, -1));
  const last = wps.length ? wps[wps.length - 1] : P, d = dist(last, tgt), stop = d > 0.02 ? {x:tgt.x - (tgt.x - last.x) * 0.015 * gs / d, y:tgt.y - (tgt.y - last.y) * 0.015 * gs / d} : {x:tgt.x, y:tgt.y};
  wps.push(stop);
  const why = {why:['Williamson-svingen går over land eller grunt her.', 'The Williamson turn crosses land or shallows here.'], to:stop};
  try { let a = P; for (const w of wps){ if (isLand(w) || groundCheck(a, w)) return why; a = w; } } catch (e){ return why; }   // (the chart not loaded there: Autonav finds its own way)
  return {wps:wps.map((w, i) => ({x:w.x, y:w.y, port:null, fish:0, auto:i < wps.length - 1})), kind:turn ? 'williamson' : 'direct', to:stop};
}
// the ways to get her up from where the boat is (km, knots): the ladder aft (§ 63, under 15 m, while she can climb), the lifting sling
// (under 45 m), the rescue boat (from 45 m); each with what stands in the way
function mobLiftOpts(pos, kn){
  const M = S.mob; if (!M || M.st !== 'water' || M.lift) return [];
  const L = BOAT.len || 0, d = kmTrue(pos || S.boat.pos, mobAt(0)), v = Math.abs(kn == null ? S.boat.v || 0 : kn), tIn = S.t - M.t0, out = [];
  const far = (r, sl) => d > r ? ['For langt unna, ' + Math.round(d * 1000) + ' m.', 'Too far off, ' + Math.round(d * 1000) + ' m.'] : v > sl ? ['Stopp båten først, ' + v.toFixed(1).replace('.', ',') + ' knop.', 'Stop the boat first, ' + v.toFixed(1) + ' knots.'] : null;
  if (BOAT.lsa && BOAT.lsa.mob) out.push({how:'boat', why:far(MOBK.boatReach, MOBK.boatSlow)});
  else {
    if (L < 15) out.push({how:'ladder', why:tIn >= M.able ? [M.name + ' orker ikke å klatre lenger.', M.name + ' cannot climb any more.'] : far(MOBK.reach, MOBK.slow)});
    out.push({how:'sling', why:far(MOBK.reach, MOBK.slow)});
  }
  return out;
}
function mobLift(how, pos, kn){
  const M = S.mob, o = mobLiftOpts(pos, kn).find(q => q.how === how); if (!o) return ['Det går ikke nå.', 'Not possible now.']; if (o.why) return o.why;
  const t0 = S.t; let tp, t1, ph = null;
  if (how === 'boat'){ const d = kmTrue(pos || S.boat.pos, mobAt(0)), go = d / (MOBK.mb.kn * NM) * 60, low = MOBK.mb.lowerH / (0.4 + 0.02 * MOBK.mb.lowerH) / 60;
    ph = {swing:t0 + MOBK.mb.swing, low:t0 + MOBK.mb.swing + low, there:t0 + MOBK.mb.swing + low + go}; tp = ph.there + MOBK.mb.pick; ph.back = tp + go; t1 = ph.back + MOBK.mb.hoist; }
  else tp = t1 = t0 + (how === 'ladder' ? MOBK.ladder : MOBK.sling);
  M.lift = {how, t0, tp:Math.ceil(tp), t1:Math.ceil(t1), ph, d:Math.round(kmTrue(pos || S.boat.pos, mobAt(0)) * 1000)};
  const T = {ladder:['Opp med leideren akter: ' + M.name + ' blir halt inntil og klatrer opp (§ 63).', 'Up the ladder aft: ' + M.name + ' is pulled alongside and climbs up (§ 63).'],
    sling:['Løftestroppen ut: ' + M.name + ' får den rundt seg og blir heist om bord.', 'The lifting sling out: ' + M.name + ' gets it round and is hoisted aboard.'],
    boat:['MOB-båten svinges ut med davitet og fires på sjøen.', 'The rescue boat is swung out on the davit and lowered to the sea.']}[how];
  log(T[0], T[1], 'nav'); return null;
}
// the lift holds while the boat stays by (the rescue boat's ship within its reach)
function mobLiftHolds(){
  const M = S.mob, L = M.lift, b = S.boat, d = kmTrue(b.pos, mobAt(0)), v = Math.abs(b.v || 0);
  if (L.how === 'boat') return M.st !== 'water' || S.t >= L.ph.low || (d <= MOBK.boatReach * 1.2 && v <= MOBK.boatSlow + 1);
  return d <= MOBK.reach * 1.6 && v <= MOBK.slow + 1;
}

// ---- the minute of the event ----
function mobStep(){
  const M = S.mob, H = S.t / 60;
  if (!mobLive() || !mobFollowed() || !meAboard()){ mobAway(); return; }
  if (M.st === 'water'){ const L = mobLee(H, M, MOBK.leeP); M.vx = L.x; M.vy = L.y; M.x += L.x; M.y += L.y; }
  const B = M.buoy;
  if (B){ if (B.held){ B.x = M.x; B.y = M.y; } else { const L = mobLee(H, B, MOBK.leeB); B.x += L.x; B.y += L.y;
    if (M.st === 'water' && kmTrue(B, M) < MOBK.hold && S.t - M.t0 < M.able){ B.held = true; log(M.name + ' fikk tak i livbøya.', M.name + ' got hold of the lifebuoy.', 'nav'); } } }
  const s = mobSeen(); M.seen = s.p; M.seenB = s.b;
  if (M.lift){ const L = M.lift;
    if (!mobLiftHolds()){ M.lift = null; log('Båten drev fra ' + M.name + '. Kom inntil igjen.', 'The boat drifted off ' + M.name + '. Come alongside again.', 'nav'); }
    else { if (M.st === 'water' && S.t >= L.tp){ M.st = 'up'; M.tUp = S.t; if (L.how === 'boat') log('MOB-båten har ' + M.name + ' om bord og går tilbake.', 'The rescue boat has ' + M.name + ' aboard and is going back.', 'nav'); }
      if (S.t >= L.t1){ mobEnd(M.tUp - M.t0 > M.lim ? 'late' : 'own', L.how); return; } } }
  if (!M.lift && M.st === 'water' && S.t >= M.resc.eta){ mobEnd('rescue'); return; }
  if (!M.limSaid && M.st === 'water' && S.t - M.t0 >= M.lim){ M.limSaid = true;
    log(M.name + ' har vært i sjøen i ' + M.lim + ' minutter og er sterkt nedkjølt. Vesten holder ' + mobHim(M) + ' oppe.', M.name + ' has been in the water for ' + M.lim + ' minutes and is badly chilled. The life jacket keeps ' + mobHim(M, true) + ' up.', 'nav'); }
  if (!M.ableSaid && M.st === 'water' && S.t - M.t0 >= M.able && !(BOAT.lsa && BOAT.lsa.mob) && (BOAT.len || 0) < 15){ M.ableSaid = true;
    log(M.name + ' orker ikke å klatre lenger. Ta ' + mobHim(M) + ' opp med løftestroppen.', M.name + ' cannot climb any more. Take ' + mobHim(M, true) + ' up with the lifting sling.', 'nav'); }
}
// with the game closed or the boat left to itself (principle 4): the crew take her round themselves and get the person up by the ladder or
// the sling in about twelve minutes from the fall; past the limit the rescue takes her
function mobAway(){
  const M = S.mob; if (!M) return; const up = Math.max(S.t, M.t0 + 12);
  if (up - M.t0 <= M.lim){ M.st = 'up'; M.tUp = up; mobEnd('crew', (BOAT.lsa && BOAT.lsa.mob) ? 'boat' : (BOAT.len || 0) < 15 ? 'ladder' : 'sling'); }
  else mobEnd('rescue');
}

// ---- the end: who got her up, the sick leave (V8 A), the report after § 475 and § 47, the badge ----
function mobEnd(out, how){
  const M = S.mob, b = S.boat; if (!M) return; S.mob = null;
  const tUp = out === 'rescue' ? Math.max(S.t, M.resc.eta) : M.tUp || S.t, tIn = Math.max(1, Math.round(tUp - M.t0)), late = tIn > M.lim, R = M.resc;
  const days = (out === 'own' || out === 'crew') && !late ? 0 : late ? 3 + Math.floor(mobRnd('sick') * 3) : 1 + Math.floor(mobRnd('sick') * 2);
  const he = mobHe(M), heE = mobHe(M, true), N = M.name, HOW = {ladder:['med leideren akter', 'up the ladder aft'], sling:['med løftestroppen', 'with the lifting sling'], boat:['med MOB-båten', 'with the rescue boat']}[how] || ['', ''];
  let no, en;
  if (out === 'own' && !late){ no = N + ' er oppe etter ' + tIn + ' minutter i sjøen, ' + HOW[0] + '. Kald og våt, men i orden. ' + he[0].toUpperCase() + he.slice(1) + ' skifter og varmer seg.';
    en = N + ' is up after ' + tIn + ' minutes in the water, ' + HOW[1] + '. Cold and wet, but all right. ' + heE[0].toUpperCase() + heE.slice(1) + ' changes and warms up.'; }
  else if (out === 'crew' && !late){ no = 'Mannskapet snudde båten og fikk ' + N + ' opp ' + HOW[0] + ' etter ' + tIn + ' minutter. Kald og våt, men i orden.'; en = 'The crew turned the boat and got ' + N + ' up ' + HOW[1] + ' after ' + tIn + ' minutes. Cold and wet, but all right.'; }
  else if (out === 'rescue'){ no = mobWhoR(R)[0].toUpperCase() + mobWhoR(R).slice(1) + ' tok ' + N + ' opp etter ' + tIn + ' minutter og bringer ' + mobHim(M) + ' til sykehuset. ' + N + ' er sykmeldt i ' + days + (days === 1 ? ' dag' : ' dager') + ' og kommer om bord igjen når båten ligger i havn etter det.';
    en = mobWhoR(R, true)[0].toUpperCase() + mobWhoR(R, true).slice(1) + ' took ' + N + ' up after ' + tIn + ' minutes and takes ' + mobHim(M, true) + ' to hospital. ' + N + ' is off sick for ' + days + (days === 1 ? ' day' : ' days') + ' and comes back aboard when the boat lies in port after that.'; }
  else { no = N + ' er oppe ' + HOW[0] + ' etter ' + tIn + ' minutter, men er sterkt nedkjølt. ' + (R.k === 'heli' ? 'Helikopteret' : 'Redningsskøyta') + ' henter ' + mobHim(M) + ' til sykehuset. ' + N + ' er sykmeldt i ' + days + ' dager.';
    en = N + ' is up ' + HOW[1] + ' after ' + tIn + ' minutes, but badly chilled. ' + (R.k === 'heli' ? 'The helicopter' : 'The rescue boat') + ' takes ' + mobHim(M, true) + ' to hospital. ' + N + ' is off sick for ' + days + ' days.'; }
  log(no, en, 'nav');
  if (out === 'own' || out === 'crew'){ const L = S.radio || (S.radio = []), nm = '«' + (S.boatName || 'Havbris') + '»';
    const a = ['Kystradioen: ' + nm + ', mottatt, personen er oppe. ' + mobWhoR(R)[0].toUpperCase() + mobWhoR(R).slice(1) + ' snur.', 'The coast radio: ' + nm + ', received, the person is up. ' + mobWhoR(R, true)[0].toUpperCase() + mobWhoR(R, true).slice(1) + ' turns back.'];
    if (!late) { L.push({t:S.t, from:'VHF 16', no:a[0], en:a[1]}); if (L.length > 40) L.shift(); log('VHF 16: ' + a[0], 'VHF 16: ' + a[1], 'nav'); } }
  // the person: off sick ashore (a hand of the crew: c.off, and back aboard at a quay after the days, mobCrewHour; one of an ocean
  // vessel's teams: kept off the deck the days), or tired and cold
  const c = !M.anon && typeof crewById === 'function' ? withVesselId(M.vid, () => crewById(M.cid)) : null;
  if (days > 0){ if (c){ c.off = true; c.offUntil = S.t + days * 1440; c.mobOff = 1; if (typeof lifeStory === 'function') withVesselId(M.vid, () => lifeStory(c, 'Gikk over bord og var sykmeldt i ' + days + (days === 1 ? ' dag.' : ' dager.'), 'Went overboard and was off sick ' + days + (days === 1 ? ' day.' : ' days.'))); }
    else if (M.anon){ const L = S.mobOff || (S.mobOff = []); L.push({vid:M.vid, id:M.cid, until:S.t + days * 1440}); while (L.length > 20) L.shift(); } }
  else if (c){ c.fatigue = Math.max(c.fatigue || 0, 90); if (typeof lifeStory === 'function') withVesselId(M.vid, () => lifeStory(c, 'Gikk over bord og ble tatt opp etter ' + tIn + ' minutter.', 'Went overboard and was picked up after ' + tIn + ' minutes.')); }
  const rep = mobReport(M, tIn, out, how, days); log(rep[0], rep[1], 'nav');
  const rec = (S.mobs || []).find(r => r.k === 'mob' && r.vid === M.vid && r.t === M.t0); const res = {out, how:how || null, min:tIn, late, days, by:out === 'rescue' ? R.k : null, mark:!!M.mark, buoy:M.buoy ? M.buoy.by : null};
  if (rec) Object.assign(rec, res); else mobRec(Object.assign({k:'mob', name:N}, res));
  if (out === 'own' && !late && typeof achAdd === 'function'){ achAdd('mob'); if (typeof achCheck === 'function') achCheck(); }
  if (hooks.onMob) hooks.onMob('end', Object.assign({name:N}, res));
}
// the bound vessel's crew is S.crew; another vessel's is in the fleet (the event ends on the vessel it began on)
function withVesselId(vid, fn){ const v = S.fleet && typeof vesselById === 'function' ? vesselById(vid) : null; return !v || vid === S.cur ? fn() : onVessel(v, fn); }
// the report the game sends for you (sjøloven § 475 første ledd: «Skipsføreren, den driftsansvarlige eller rederiet skal straks gi den
// myndighet Kongen bestemmer, melding om sjøulykke»; skipssikkerhetsloven § 47 annet ledd: melding og rapport ved skade eller sykdom hos
// den som arbeider om bord, og for arbeids- og skipsulykker etter reglene i medhold av sjøloven § 475). The authority is taken to be the
// Norwegian Maritime Authority (Sjøfartsdirektoratet); the regulation on reporting is not read here, and that a fall overboard with no
// harm is reported is assumed
function mobReport(M, tIn, out, how, days){
  const nm = '«' + (S.boatName || 'Havbris') + '»', at = mobHm(M.t0 / 60), hurt = days > 0;
  return ['Melding sendt til Sjøfartsdirektoratet for deg (sjøloven § 475 og skipssikkerhetsloven § 47): mann over bord fra ' + nm + ' kl. ' + at + ', ' + M.name + ', ' + tIn + ' minutter i sjøen' + (hurt ? ', sykmeldt i ' + days + (days === 1 ? ' dag' : ' dager') : ', ingen skade') + '.',
    'Report sent to the Norwegian Maritime Authority for you (the Maritime Code § 475 and the Ship Safety Act § 47): man overboard from ' + nm + ' at ' + at + ', ' + M.name + ', ' + tIn + ' minutes in the water' + (hurt ? ', off sick ' + days + (days === 1 ? ' day' : ' days') : ', no harm') + '.'];
}
// every hour on each vessel (core/04-crew.js crewTick): a hand off sick after a fall comes back aboard only at a quay (from hospital),
// so the day she is due at sea is put off an hour at a time; the teams' sick leave runs out; an event left behind is ended
function mobCrewHour(){
  const b = S.boat;
  for (const c of S.crew || []) if (c.mobOff){ if (!c.off){ delete c.mobOff; continue; } if (c.offUntil && S.t >= c.offUntil - 60 && b.status !== 'port') c.offUntil = S.t + 61; }
  if (S.mobOff && S.mobOff.length) S.mobOff = S.mobOff.filter(o => S.t < o.until);
  if (S.mob && S.mob.vid === S.cur && (b.status === 'port' || b.status === 'tow' || S.t - S.mob.t0 > 6 * 60)) mobAway();
}
