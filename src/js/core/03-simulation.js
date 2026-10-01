// ===== fleet: each vessel keeps its own state; the company holds the rest. The simulation steps through the vessels one at a
// time and binds S.boat, S.hold, S.crew and the others to the vessel it is working on, so the rest of the code is unchanged. =====
const VKEYS = ['meal', 'sayT', 'boat', 'plan', 'hold', 'crew', 'equip', 'jobs', 'cevt', 'ops', 'lic', 'quota', 'draft', 'draftSpeed', 'draftDep', 'marks', 'target', 'trail', 'fsess', 'facc', 'fnext', 'fishPlanH', 'workLog', 'clothes', 'tripBuff', 'prep', 'svcTold', 'boatName', 'lastSale', 'restWarn', 'kvRel', 'codWarn', 'lastIceWarn', 'navrows', 'tripOwner', 'pgear'];
function curVessel(){ return S.fleet.find(v => v.id === S.cur) || S.fleet[0]; }
function storeVessel(v){ for (const k of VKEYS) v[k] = S[k]; }
function bindVessel(v){ for (const k of VKEYS) S[k] = v[k]; S.cur = v.id; applyVessel(); }
function ensureFleet(){ if (!S.fleet || !S.fleet.length){ const v = {id:'v1'}; storeVessel(v); S.fleet = [v]; S.cur = 'v1'; } else bindVessel(curVessel()); if (!S.fleet.some(v => v.id === S.me)) S.me = S.cur; }
function withVessel(v, fn){ const c = curVessel(); if (v === c) return fn(); storeVessel(c); bindVessel(v); try { return fn(); } finally { storeVessel(v); bindVessel(c); } }
// log lines written while the fleet loop works on a vessel get its name, once the company has more than one
let VTAG = false;
function onVessel(v, fn){ const was = VTAG; VTAG = true; try { return withVessel(v, fn); } finally { VTAG = was; } }
function eachVessel(fn){ for (const v of S.fleet.slice()) onVessel(v, fn); }
// a vessel's own field; the bound vessel's live values are in S
function vget(v, k){ return v.id === S.cur ? S[k] : v[k]; }
function vesselById(id){ return S.fleet.find(v => v.id === id) || null; }
// ---- fleet rules (deltakerforskriften, J-30-2026): the company can have one vessel in the open group, and none there if it owns a
// vessel in the closed group. In the open group the owner must be aboard as skipper; S.me is the vessel you are aboard. ----
function openVesselId(){ if (S.fleet.some(v => vget(v, 'lic'))) return null; const v = S.fleet.find(x => (VESSELS[vget(x, 'boat').type] || {}).len < 11); return v ? v.id : null; }
// a waypoint where the boat stops: a port, fishing hours, or work with passive gear (set or haul)
function wpStop(w){ return !!(w.port || w.fish > 0 || w.act); }
function meAboard(){ return !S.me || S.me === S.cur; }
// what the bound vessel may land of cod, haddock and saithe: 'lukket' with a closed-group right, 'open' on the open-group vessel when
// the owner was aboard for the trip, otherwise 'none': bycatch only (J-30-2026 § 35)
function access(){ if (S.lic) return 'lukket'; return S.cur === openVesselId() && S.tripOwner !== false ? 'open' : 'none'; }
const BYCATCH = {share:0.1, cod:2000};
function vesselValue(v){ const b = vget(v, 'boat'), eq = vget(v, 'equip') || {}; return Math.round(VESSELS[b.type].price * 0.7 + (eq.motor90 ? EQUIP.motor90.price * 0.5 : 0) + licValue(vget(v, 'lic')) * 0.95); }
// a vessel added to the fleet: default state, in port with 40 % fuel; the bigger boats come with a plotter and VHF
const VNAMES = ['Senjaværing', 'Nordlys', 'Malangen', 'Gisund', 'Havglimt', 'Skreien', 'Fjordbris', 'Straumen', 'Hekkingen', 'Kvitskjær'];
function newVesselObj(type, pid, lic){
  const d = newState(), V = VESSELS[type], p = portById(pid).p, n = Math.max(0, ...S.fleet.map(x => +String(x.id).slice(1) || 0)) + 1, v = {id:'v' + n};
  for (const k of VKEYS) v[k] = d[k];
  Object.assign(v.boat, {type, pos:{x:p.x, y:p.y}, port:pid, fuel:V.fuelCap * 0.4});
  v.trail = [{x:p.x, y:p.y, port:pid}]; v.lic = lic || null;
  for (const k of VESSELS[type].std || []) v.equip[k] = true;
  const used = S.fleet.map(x => vget(x, 'boatName'));
  v.boatName = VNAMES.find(nm => !used.includes(nm)) || 'Båt ' + n;
  S.fleet.push(v); if (!S.owned.includes(type)) S.owned.push(type);
  loreNewBoat(v.boatName);   // the yard lays a coin under the mast
  return v;
}
function applyVessel(){
  const b = S.boat; Object.assign(BOAT, VESSELS[b.type || 'skiff']);
  for (const k in EQUIP) if (EQUIP[k].boost && S.equip && S.equip[k] && equipFits(k, b.type || 'skiff')) Object.assign(BOAT, EQUIP[k].boost);
  b.fuel = Math.min(b.fuel, BOAT.fuelCap); b.ice = Math.min(b.ice, BOAT.iceCap);
}
// fishing effort per person: a rod with one lure until you buy a hand jig (pilk and four fly hooks); an electric jigging
// reel does about twice what a hand jig does, and one person tends up to three reels instead of jigging by hand
const JIG = {rod:0.35, hand:1, machine:2.0, perPerson:3};
function effortOf(people, jk, hand){ return Math.max(0, people - Math.ceil(jk / JIG.perPerson)) * hand + jk * JIG.machine; }
function fishEffort(){
  // the people at the rail: those whose chain has them fishing (as if the boat were jigging where it lies)
  const hand = S.boat && S.boat.gear ? JIG.hand : JIG.rod, F = workTeam('fiske', 'juksa', 'fishing'), people = F.n, jk = Math.min(S.equip ? S.equip.jukse : 0, people * JIG.perPerson);
  if (S.plan && S.plan.ops && !meAboard()){ const sk = opsSkipper(); return effortOf(people, jk, hand) * (sk ? sk.skill : 0.8) * 0.9; }
  return effortOf(people, jk, hand) * F.eff;
}
const GM = {E:1.05, A:1.0, B:0.85, X:0.6, V:0};

// deterministic noise
function hash(n){ n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function h2(a, b){ return hash((Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 1013, 668265263)) + (b | 0)); }
function vn(t, s){ const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return h2(i, s) * (1 - u) + h2(i + 1, s) * u; }
function sstep(a, b, x){ const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function seasonal(arr, H){
  const d = gDate(H), mf = d.getUTCMonth() + (d.getUTCDate() - 1) / 31 - 0.5;
  const i0 = Math.floor(mf), f = mf - i0, i = ((i0 % 12) + 12) % 12;
  return arr[i] * (1 - f) + arr[(i + 1) % 12] * f;
}

// weather: seasonal climate + low-pressure passages
const WIND_MEAN = [9.2,9.0,8.4,7.0,6.0,5.4,5.0,5.4,6.8,7.8,8.6,9.0];
const STORM_P = [0.12,0.11,0.09,0.06,0.03,0.02,0.02,0.03,0.06,0.09,0.11,0.12];
const SWELL = [0.5,0.5,0.45,0.35,0.25,0.2,0.2,0.2,0.3,0.4,0.45,0.5];
function windAt(H){
  const base = seasonal(WIND_MEAN, H);
  const n = 0.55 * vn(H / 30, 11) + 0.30 * vn(H / 9, 23) + 0.15 * vn(H / 3, 37);
  let storm = 0; const k0 = Math.floor(H / 24);
  for (let k = k0 - 2; k <= k0 + 2; k++){
    if (h2(k, 101) < STORM_P[gDate(k * 24).getUTCMonth()]){
      const c = k * 24 + h2(k, 102) * 24, amp = 5 + h2(k, 103) * 9, w = 5 + h2(k, 104) * 7;
      storm += amp * Math.exp(-(((H - c) / w) ** 2));
    }
  }
  return Math.max(0.3, base * (0.1 + 1.8 * n) + storm);
}
function windDir(H){ return ((225 + 400 * (vn(H / 40, 55) - 0.5)) % 360 + 360) % 360; }
function hsOpen(H){ const we = 0.6 * windAt(H) + 0.4 * windAt(H - 3); return 0.15 + 0.021 * we * we + seasonal(SWELL, H) * vn(H / 50, 77); }
function exposure(p){ return 0.2 + 0.8 * gridBilinear(EXPO, GEO_EXPO.nx, GEO_EXPO.ny, GEO_EXPO.c, p) / 255; }
function hsAt(p, H){ return Math.max(0.05, hsOpen(H) * Math.pow(exposure(p), 1.3)); }
function fcErr(H, now, seed){ const ahead = Math.max(0, H - now), issue = Math.floor(now / 6); return (vn(H / 10, seed + issue) - 0.5) * 0.7 * Math.min(1, ahead / 48); }
function fcWind(H, now){ return windAt(H) * (1 + fcErr(H, now, 900)); }
function fcHsOpen(H, now){ return hsOpen(H) * (1 + fcErr(H, now, 5900)); }
const BF = [0.3,1.6,3.4,5.5,8.0,10.8,13.9,17.2,20.8,24.5,28.5,32.7];
function beaufort(W){ let b = 0; while (b < 12 && W >= BF[b]) b++; return b; }
const AIRT = [-2.5,-2.5,-1.5,1.5,5.5,9,12,11.5,8,3.5,0.5,-1.5];
function airTemp(H){ const d = gDate(H), hr = d.getUTCHours() + d.getUTCMinutes() / 60; return seasonal(AIRT, H) + (vn(H / 20, 81) - 0.5) * 6 + 1.5 * Math.sin((hr - 9) / 24 * 2 * Math.PI) - Math.max(0, windAt(H) - 10) * 0.15; }
function precipAt(H){ return clamp((vn(H / 8, 71) - 0.56) * 2.6 + (windAt(H) - 10) / 14, 0, 1); }
function cloudAt(H){ return clamp(0.3 + precipAt(H) * 0.9 + (vn(H / 14, 91) - 0.5) * 1.4, 0, 1); }
function visibility(H){ const p = precipAt(H), snow = airTemp(H) < 1; return clamp(45 - p * (snow ? 42 : 28) - cloudAt(H) * 8, 1.2, 50); }
const RAD = Math.PI / 180, OBS = {lat:69.35 * RAD, lw:-17.6 * RAD}, OBL = 23.4397 * RAD;
const jdays = H => (gDate(H).getTime() - 3600000) / 86400000 + 2440587.5 - 2451545;   // days since J2000 (UTC)
function eqToHor(ra, dec, d){
  const th = RAD * (280.16 + 360.9856235 * d) - OBS.lw, hA = th - ra;
  const alt = Math.asin(Math.sin(OBS.lat) * Math.sin(dec) + Math.cos(OBS.lat) * Math.cos(dec) * Math.cos(hA));
  const az = Math.atan2(Math.sin(hA), Math.cos(hA) * Math.sin(OBS.lat) - Math.tan(dec) * Math.cos(OBS.lat)) + Math.PI;   // from north, clockwise
  return {alt, az};
}
function sunEq(d){
  const M = RAD * (357.5291 + 0.98560028 * d), C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + RAD * 102.9372 + Math.PI;
  return {ra:Math.atan2(Math.sin(L) * Math.cos(OBL), Math.cos(L)), dec:Math.asin(Math.sin(OBL) * Math.sin(L)), dist:149598000};
}
function moonEq(d){
  const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.229350 * d);
  const lon = L + RAD * 6.289 * Math.sin(M), lat = RAD * 5.128 * Math.sin(F);
  return {ra:Math.atan2(Math.sin(lon) * Math.cos(OBL) - Math.tan(lat) * Math.sin(OBL), Math.cos(lon)), dec:Math.asin(Math.sin(lat) * Math.cos(OBL) + Math.cos(lat) * Math.sin(OBL) * Math.sin(lon)), dist:385001 - 20905 * Math.cos(M)};
}
function sunAt(H){ const d = jdays(H), e = sunEq(d), h = eqToHor(e.ra, e.dec, d); return {el:h.alt / RAD + (h.alt > -0.02 ? 0.57 * Math.exp(-h.alt / RAD / 3) : 0), az:h.az}; }
function moonAt(H){
  const d = jdays(H), m = moonEq(d), sn = sunEq(d), h = eqToHor(m.ra, m.dec, d);
  const phi = Math.acos(clamp(Math.sin(sn.dec) * Math.sin(m.dec) + Math.cos(sn.dec) * Math.cos(m.dec) * Math.cos(sn.ra - m.ra), -1, 1));
  const inc = Math.atan2(sn.dist * Math.sin(phi), m.dist - sn.dist * Math.cos(phi));
  const ang = Math.atan2(Math.cos(sn.dec) * Math.sin(sn.ra - m.ra), Math.sin(sn.dec) * Math.cos(m.dec) - Math.cos(sn.dec) * Math.sin(m.dec) * Math.cos(sn.ra - m.ra));
  return {el:h.alt / RAD, az:h.az, illum:(1 + Math.cos(inc)) / 2, waxing:ang < 0};
}
function moonName(mo){ const f = mo.illum; return f < 0.04 ? {no:'Nymåne', en:'New moon'} : f > 0.96 ? {no:'Fullmåne', en:'Full moon'} : f < 0.5 ? (mo.waxing ? {no:'Voksende månesigd', en:'Waxing crescent'} : {no:'Minkende månesigd', en:'Waning crescent'}) : (mo.waxing ? {no:'Voksende måne', en:'Waxing gibbous'} : {no:'Minkende måne', en:'Waning gibbous'}); }
// sunrise and sunset for the day containing H (polar day / polar night when there are none)
function sunTimes(H){
  const d0 = Math.floor((H + 6) / 24) * 24 - 6; let up = null, dn = null, prev = sunAt(d0).el, maxEl = prev, minEl = prev;
  for (let m = 5; m <= 24 * 60; m += 5){ const e = sunAt(d0 + m / 60).el; maxEl = Math.max(maxEl, e); minEl = Math.min(minEl, e); if (prev < -0.83 && e >= -0.83 && up === null) up = d0 + m / 60; if (prev >= -0.83 && e < -0.83 && dn === null) dn = d0 + m / 60; prev = e; }
  return {up, dn, always:minEl > -0.83, never:maxEl < -0.83};
}
// ---------- tide: harmonic prediction (mean sea level reference); real Kartverket series replace it when embedded ----------
const TIDE_ZC = 1.3;   // mean sea level above chart datum
const TIDE_C = [[0.86, 300, 'M2'], [0.31, 345, 'S2'], [0.17, 280, 'N2'], [0.09, 345, 'K2'], [0.08, 180, 'K1'], [0.04, 160, 'O1']];
let TIDE_SERIES = null;   // {t0 (game hours), dt (hours), v: Float32Array metres above MSL}
function tideH(H){
  if (TIDE_SERIES){ const f = (H - TIDE_SERIES.t0) / TIDE_SERIES.dt, i = Math.floor(f); if (i >= 0 && i < TIDE_SERIES.v.length - 1){ const u = f - i; return TIDE_SERIES.v[i] * (1 - u) + TIDE_SERIES.v[i + 1] * u; } }
  const d = jdays(H), Tc = d / 36525, sL = 218.3165 + 481267.8813 * Tc, hL = 280.4661 + 36000.7698 * Tc, pL = 83.3535 + 4069.0137 * Tc;
  const g = gDate(H), T0 = 15 * (g.getUTCHours() - 1 + g.getUTCMinutes() / 60 + g.getUTCSeconds() / 3600), tau = T0 + hL - sL;
  const V = {M2:2 * tau, S2:2 * T0, N2:2 * tau - sL + pL, K2:2 * (T0 + hL), K1:T0 + hL, O1:T0 + hL - 2 * sL};
  let z = 0; for (const [A, gg, n] of TIDE_C) z += A * Math.cos((V[n] - gg) * RAD); return z;
}
const tideCD = H => tideH(H) + TIDE_ZC;   // water level above chart datum: add to charted depths
function tideEvents(H0, hours){
  const out = []; let a = tideH(H0 - 0.1), b = tideH(H0);
  for (let m = 6; m <= hours * 60; m += 6){ const H = H0 + m / 60, c = tideH(H); if ((b - a) * (c - b) <= 0 && b !== a) out.push({t:H - 0.1, h:b, kind:c < b ? 'high' : 'low'}); a = b; b = c; }
  return out;
}
function auroraAt(H){ if (sunAt(H).el > -7) return 0; return clamp((0.5 - cloudAt(H)) / 0.5, 0, 1) * clamp(vn(H / 5, 111) * 1.6 - 0.3, 0, 1); }
function riskLevel(W, hs){ const r = BOAT.risk; if (hs >= r[1] || W >= r[3]) return 2; if (hs >= r[0] || W >= r[2]) return 1; return 0; }

// boat
function fuelLph(v, W){ const base = BOAT.planing ? 1.0 + 0.03 * v * v + 3 * Math.exp(-(((v - BOAT.vmax * 0.42) / 3) ** 2)) : 1 + 0.1 * v * v + (v > BOAT.vmax * 0.9 ? (v - BOAT.vmax * 0.9) * 6 : 0); return base * BOAT.fuelK * (1 + 0.015 * W); }
function speedCap(hs){ return BOAT.vmax * clamp(1 - (hs - 0.3) * BOAT.sea, 0.2, 1); }

// fish
function noise2(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, c) => hash(Math.imul(a, 374761393) ^ Math.imul(c + s * 7919, 668265263));
  return (h(ix, iy) * (1 - ux) + h(ix + 1, iy) * ux) * (1 - uy) + (h(ix, iy + 1) * (1 - ux) + h(ix + 1, iy + 1) * ux) * uy;
}
// steepness of the sea floor (metres per 100 m): fish gather along bank edges and slopes
function slopeAt(p){ const e = 0.1, a = depthF({x:p.x + e, y:p.y}), b = depthF({x:p.x - e, y:p.y}), c = depthF({x:p.x, y:p.y + e}), d = depthF({x:p.x, y:p.y - e}); return Math.hypot(a - b, c - d) / 2; }
// Good spots nobody talks about: patches of better fishing on a 3.5 km pattern that drift. Two fields overlap at any time, each
// sliding its own way at 0.7–1.7 km a day and fading in and out over 240 hours, so the fish move along instead of jumping every
// five days. The blend is scaled back to the spread of one field, so the mean stays where it was.
const HOT = {T:120, v:0.05, cell:3.5};   // hours, km an hour, km
function hotField(sp, p, H, k){
  const si = ALLSP.indexOf(sp), a = 2 * Math.PI * h2(k, 700 + si), v = HOT.v * (0.6 + 0.8 * h2(k, 720 + si)), tt = H - k * HOT.T;
  return noise2((p.x - Math.sin(a) * v * tt) / HOT.cell, (p.y + Math.cos(a) * v * tt) / HOT.cell, 20 + si + 97 * k);
}
function hotspot(sp, p, H){
  const f = H / HOT.T, k = Math.floor(f), u = sstep(0, 1, f - k), a = hotField(sp, p, H, k), b = hotField(sp, p, H, k + 1);
  const n = clamp(0.5 + ((a - 0.5) * (1 - u) + (b - 0.5) * u) / Math.hypot(1 - u, u), 0, 1); return 0.3 + 1.5 * n * n;
}
// Schools: a finer pattern (400 m) that swims 0.5–1 km an hour on each species' own heading. It averages 1, so it moves the bite
// about within half an hour without changing the catch over a day. The sonar shows it.
const SCHOOL = {cell:0.4, amp:0.3};
function school(sp, p, H){
  const si = ALLSP.indexOf(sp), a = 2 * Math.PI * h2(si, 740), v = 0.5 + 0.5 * h2(si, 741);
  return 1 - SCHOOL.amp / 2 + SCHOOL.amp * noise2((p.x - Math.sin(a) * v * H) / SCHOOL.cell, (p.y + Math.cos(a) * v * H) / SCHOOL.cell, 60 + si);
}
// where a species' schools are heading (radians, map north up), for the sonar
function schoolHeading(sp){ return 2 * Math.PI * h2(ALLSP.indexOf(sp), 740); }
// The coastal-cod fjord line (høstingsforskriften vedlegg 4), traced from Fiskeridirektoratet's map: Andøya – Skrolsvik – Gryllefjord – Hekkingen – Sommarøy – Kvaløya.
// Vessels of 15 m or more may not fish inside it; seine is banned inside; at most 5000 hooks on line and 80 nets for cod.
const FJORD = [[-21.8,67.2],[10.1,67.1],[12.6,39.2],[37.4,14.5],[50.6,14.0],[59.6,-1.0],[62.1,-3.2],[63.3,-4.4],[82.5,-23.1]].map(q => ({x:q[0], y:q[1]}));
const FJORD_POLY = FJORD.concat([{x:140, y:-23.1}, {x:140, y:140}, {x:-21.8, y:140}]);
function insideFjord(p){ let c = false; for (let i = 0, j = FJORD_POLY.length - 1; i < FJORD_POLY.length; j = i++){ const a = FJORD_POLY[i], b = FJORD_POLY[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
// Fiskeridirektoratet's statistical locations (approximate: nearest representative point)
const FIELDS = [['05-25', 6, 45], ['05-29', 14, 8], ['05-30', 44, 8], ['05-31', 72, 4], ['05-40', 58, 36], ['05-41', 42, 68], ['05-42', 12, 80]];
function fieldCode(p){ if (!insideFjord(p) && p.x < 16) return p.y < 30 ? '05-29' : '05-25'; let best = FIELDS[0], bd = 1e9; for (const f of FIELDS){ if (!insideFjord(p) && (f[0] === '05-40' || f[0] === '05-41')) continue; const d = Math.hypot(p.x - f[1], p.y - f[2]); if (d < bd){ bd = d; best = f; } } return best[0]; }
// where the spawning cod gathers: exposed banks 40–250 m outside the fjords, and the known grounds
function skreiSpot(p, d = depthF(p), E = exposure(p)){
  let v = sstep(0.15, 0.6, E) * sstep(30, 60, d) * (1 - sstep(220, 320, d));
  for (const g of GROUNDS.slice(0, 3)){ const dd = dist(p, g.p); v += 0.6 * Math.exp(-((dd / (g.r * 1.3)) ** 2)); }
  return clamp(v, 0, 1.2) * (insideFjord(p) ? 0.35 : 1);
}
function gauss(u1, u2){ return Math.sqrt(-2 * Math.log(Math.max(1e-9, u1))) * Math.cos(2 * Math.PI * u2); }
// one fish's round weight (kg): cod mixes resident coastal cod with larger spawning cod in the season
function sampleFish(sp, p, H){
  const s = SPECIES[sp]; let sz = s.size;
  if (sp === 'torsk'){ const k = seasonal(s.av, H), sk = seasonal(s.skrei, H) * skreiSpot(p); if (Math.random() < sk / (k + sk + 1e-9)) sz = s.skreiSize; }
  return Math.round(sz[0] * Math.exp(sz[1] * gauss(Math.random(), Math.random())) * 100) / 100;
}
function clsOf(sp, kg){ const c = SPECIES[sp].cls; for (let i = 0; i < c.length; i++) if (kg >= c[i][0]) return i; return c.length - 1; }
// directed fishing for redfish is only allowed with jigs in June–August for boats under 15 m; otherwise only as bycatch
// halibut is closed north of 62° N from 20 December to 20 April (høstingsforskriften § 39); live halibut must be released
function kveiteClosed(H){ const g = gDate(H), m = g.getUTCMonth(), d = g.getUTCDate(); return (m === 11 && d >= 20) || m < 3 || (m === 3 && d <= 20); }
// fishing for halibut: big pilk and heavy line; halibut takes it far more often, other fish rarely, and it bites best around slack tide
function targetF(sp, H){
  if (S.target !== 'kveite' || !S.boat.kgear || kveiteClosed(H)) return 1;
  if (sp !== 'kveite') return 0.2;
  const cur = Math.abs(tideH(H + 0.5) - tideH(H - 0.5)); return 9 * (1.4 - 0.8 * clamp(cur / 0.35, 0, 1));
}
function uerOpen(H){ const m = gDate(H).getUTCMonth(); return m >= 5 && m <= 7; }
// How much fish of a species there is at a point and hour: 30 × density is kg an hour for one person with a hand jig.
// It is split in three so the echo-sounder heat map can share the work between species: what the place gives (denPlace, once
// per point), what the hour gives (denTime, once per hour), and the species' own sum (denSp). density() gives the same numbers.
function denPlace(p){
  if (isLand(p)) return null;
  const d = depthF(p), E = exposure(p);
  return {p, d, E, edge:sstep(1.5, 12, slopeAt(p)), gd:GROUNDS.map(g => dist(p, g.p)), skr:-1};
}
const DENT = {H:NaN, T:null};
function denTime(H){
  if (DENT.H === H) return DENT.T;
  const T = {uerOpen:uerOpen(H)};
  for (const sp of ALLSP){ const s = SPECIES[sp]; T[sp] = {av:seasonal(s.av, H), skrei:sp === 'torsk' ? seasonal(s.skrei, H) : 0}; }
  DENT.H = H; DENT.T = T; return T;
}
function denSp(sp, q, H, T){
  const s = SPECIES[sp], p = q.p;
  let v = s.base * (s.prod + (1 - s.prod) * q.E) * (0.6 + 0.4 * q.edge) * hotspot(sp, p, H) * 0.95;
  // the named grounds are known for a reason
  for (let i = 0; i < GROUNDS.length; i++){ const g = GROUNDS[i], dd = q.gd[i]; if (dd > g.r * 3) continue; v += (g.sp[sp] || 0) * Math.exp(-((dd / g.r) ** 2)) * 0.45; }
  const day = 0.75 + 0.5 * vn(H / 24 + p.x * 0.05, 300 + ALLSP.indexOf(sp));
  let av = T[sp].av;
  if (sp === 'torsk'){ if (q.skr < 0) q.skr = skreiSpot(p, q.d, q.E); av += T[sp].skrei * q.skr; }
  if (sp === 'uer' && !T.uerOpen) av *= 0.15;
  if (s.shell) v *= crabArea(p); else v *= school(sp, p, H);
  return 1.6 * s.k * v * day * av * depthFactor(sp, q.d) * stockAt(p, sp) + tutBonus(sp, p);   // k: calibration to 2025 catches per boat in Lofoten–Tromsø
}
function density(sp, p, H){ const q = denPlace(p); return q ? denSp(sp, q, H, denTime(H)) : 0; }
// The first trip's guaranteed catch is a real patch of skrei on the guide's ground while the guarantee lasts, so the heat map and
// the echo sounder show what the boat gets. It comes on top of the stock and is not fished down; the species mix is the mix the
// guarantee tops up with. Full strength within half the ring's radius, a tenth at its edge.
const TUT_FIELD = 4;   // Gisundet nord
const TUTB = {peak:5.2, mix:{torsk:0.72, sei:0.18, hyse:0.1}};
function tutBonus(sp, p){
  const m = TUTB.mix[sp]; if (!m || !(S && S.tut && S.tut.catch)) return 0;
  const g = GROUNDS[TUT_FIELD], d = dist(p, g.p), x = Math.max(0, d - g.r * 0.5) / (g.r * 0.33);
  return TUTB.peak * m * Math.exp(-x * x);
}
// local stock of fish in 2 x 2 km cells (1 = untouched): fishing takes it down, it recovers over weeks. The value at a point is read
// between the four nearest cell centres, and a catch is taken from the same four cells by the same weights, so the stock has
// no hard 2 km edges and what the heat map shows is what is taken.
const STK = {c:2, nx:Math.ceil(MAP_W / 2), ny:Math.ceil(MAP_H / 2), K:2600};
function stockIdx(p){ return Math.floor(clamp(p.y, 0, MAP_H - 0.001) / STK.c) * STK.nx + Math.floor(clamp(p.x, 0, MAP_W - 0.001) / STK.c); }
// the four cells around a point and their weights, the same arithmetic as gridBilinear
function stockW(p){
  const gx = clamp(p.x / STK.c - 0.5, 0, STK.nx - 1.001), gy = clamp(p.y / STK.c - 0.5, 0, STK.ny - 1.001), ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, i = iy * STK.nx + ix;
  return [[i, (1 - fx) * (1 - fy)], [i + 1, fx * (1 - fy)], [i + STK.nx, (1 - fx) * fy], [i + STK.nx + 1, fx * fy]];
}
// Shellfish have their own layer (S.cstk), made when the first pot is hauled. It stays one value per cell: pots stand still for
// days and work the cell as a patch, the heat map does not show crab, and the pot calibration rests on it.
function stockAt(p, sp){
  if (sp && SPECIES[sp].shell) return S && S.cstk ? S.cstk[stockIdx(p)] : 1;
  return S && S.stock ? gridBilinear(S.stock, STK.nx, STK.ny, STK.c, p) : 1;
}
function takeStock(p, kg, sp){
  if (sp && SPECIES[sp].shell){ if (!S.cstk) S.cstk = new Array(STK.nx * STK.ny).fill(1); const i = stockIdx(p); S.cstk[i] = Math.max(0.1, S.cstk[i] - kg / (STK.K * 0.25)); return; }
  if (!S.stock) return; for (const [i, w] of stockW(p)) S.stock[i] = Math.max(0.12, S.stock[i] - kg * w / STK.K);
}
function initStock(){
  const a = new Array(STK.nx * STK.ny).fill(1);
  // the famous grounds are already worked by the local fleet when the game starts
  for (const g of GROUNDS.slice(0, 4)) for (let r = 0; r < STK.ny; r++) for (let c = 0; c < STK.nx; c++){ const d = Math.hypot((c + 0.5) * STK.c - g.p.x, (r + 0.5) * STK.c - g.p.y); if (d < g.r * 1.2) a[r * STK.nx + c] = Math.min(a[r * STK.nx + c], 0.55 + 0.35 * d / (g.r * 1.2)); }
  return a;
}
function stockHour(H){
  const s = S.stock, n = STK.nx, m = STK.ny, nx = s.slice();
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++){
    const i = r * n + c, nb = (s[r * n + Math.max(0, c - 1)] + s[r * n + Math.min(n - 1, c + 1)] + s[Math.max(0, r - 1) * n + c] + s[Math.min(m - 1, r + 1) * n + c]) / 4;
    // regrowth has a smallest step, so a cell comes all the way back to 1 (rounding used to stop it at 0.876)
    const g = s[i] < 1 ? Math.max((1 - s[i]) * 0.004, 0.0001) : 0;
    nx[i] = Math.round(Math.min(1, s[i] + g + (nb - s[i]) * 0.01) * 1e4) / 1e4;
  }
  S.stock = nx;
  // crab comes back more slowly, and does not wander far
  if (S.cstk) S.cstk = S.cstk.map(v => v < 1 ? Math.round(Math.min(1, v + Math.max((1 - v) * 0.0015, 0.0001)) * 1e4) / 1e4 : v);
  // the local fleet works the known grounds on fishable days
  for (const q of npcStates(H)) if (q.fleet && q.st === 'fishing') takeStock(q.p, 18);
  const hr = gDate(H).getUTCHours();
  if (hr >= 6 && hr < 15 && windAt(H) < 12) for (const g of GROUNDS.slice(0, 3)) for (let k = 0; k < 5; k++){ const a = k * 1.26 + H * 0.07, q = {x:g.p.x + Math.cos(a) * g.r * 0.45 * (k ? 1 : 0), y:g.p.y + Math.sin(a) * g.r * 0.45 * (k ? 1 : 0)}; if (!isLand(q)) takeStock(q, 12); }
}
// preferred depth (m) and spread per species: cod and saithe on the banks, haddock deeper, ling and tusk deep
const DPREF = Object.fromEntries(ALLSP.map(sp => [sp, SPECIES[sp].dep]));
function depthFactor(sp, d){ const q = DPREF[sp]; return 0.3 + 0.7 * Math.exp(-((Math.log(Math.max(d, 2) / q[0]) / q[1]) ** 2)); }
const SST = [3.6,3.1,3.2,3.9,5.6,8.2,10.8,11.4,9.8,7.8,6.0,4.6];
function depthF(p){ if (isLand(p)) return 0; if (DEPTH) return Math.max(0.8, gridBilinear(DEPTH, GEO_DEPTH.nx, GEO_DEPTH.ny, GEO_DEPTH.c, p)); return depthModel(p); }
function depthAt(p){ return Math.round(depthF(p)); }
function depthModel(p){ return (2 + (13 + 220 * Math.pow(exposure(p), 1.6) + 25 * vn(p.x / 4 + p.y / 7, 5)) * Math.pow(sstep(0, 1.5, coastDist(p)), 0.6)); }
function grade(f){ return f >= 85 ? 'E' : f >= 65 ? 'A' : f >= 40 ? 'B' : f >= 15 ? 'X' : 'V'; }
// days with few boats out give slightly higher prices; 2025 showed almost no link between local volume and price, so the effect is small
function supplyFactor(H){
  const H0 = Math.floor(H / 24) * 24 + 1; let good = 0, n = 0;
  for (let k = 3; k <= 39; k += 3){ const Hk = H0 - k, hr = gDate(Hk).getUTCHours(); if (hr < 5 || hr > 20) continue; n++; if (windAt(Hk) < 11) good++; }
  return 1.03 - 0.06 * (n ? good / n : 1);
}
// weekly price movement per species (set each Monday), pulled back towards the seasonal level: dev = 0.7 × last week + noise
const WDC = {};
function weekOfH(H){ return Math.floor((H + 6) / 168); }
function weekDev(sp, H){
  const w = weekOfH(H), key = sp + w; if (WDC[key] != null) return WDC[key];
  const i = ALLSP.indexOf(sp), sg = SPECIES[sp].sig; let dv = 0;
  for (let k = w - 16; k <= w; k++) dv = 0.7 * dv + sg * gauss(h2(k * 13 + i * 7 + 5000, 811), h2(k * 17 + i * 3 + 5000, 812));
  return WDC[key] = clamp(dv, -0.25, 0.25);
}
function marketPrice(sp, H){ return seasonal(SPECIES[sp].pm, H) * (1 + weekDev(sp, H)); }
// price per kg round weight for one size class at one buyer; the minimum price (with the hook-caught premium) is the floor
function clsPrice(port, sp, c, H, hook){
  const s = SPECIES[sp], cl = s.cls[c], ref = s.cls[s.ref];
  const sat = (S && S.market && S.market[port.id] && S.market[port.id][sp]) || 0;
  const mk = marketPrice(sp, H) * port.pf * supplyFactor(H) * (cl[1] / ref[1]) * Math.max(0.9, 1 - sat / 40000);
  return Math.round(Math.max(cl[1] * (hook !== false && cl[3] ? cl[3] : 1), mk) * 100) / 100;
}
function price(port, sp, H){ return clsPrice(port, sp, SPECIES[sp].ref, H, true); }
function avgPrice(sp, H, days){ let s = 0, n = 0; for (let d = 0; d < days; d++) for (const q of PORTS) if (q.mottak){ s += price(q, sp, H - d * 24); n++; } return s / n; }
// ---------- quotas: open group (åpen gruppe) north of 62° N, J-30-2026 ----------
const QUOTA = {cod:[[8, 4000, 3000], [10, 5600, 4200], [1e9, 6400, 4800]], hyseG:[4000, 5600, 6400], seiG:5000};
function doyH(H){ const g = gDate(H); return Math.floor((g - Date.UTC(g.getUTCFullYear(), 0, 1)) / 864e5); }
function yearH(H){ return gDate(H).getUTCFullYear(); }
function quotaState(){ const y = yearH(S.t / 60); if (!S.quota || S.quota.y !== y) S.quota = {y, torsk:0, hyse:0, sei:0, ffW:-1, ffTot:0, ffCod:0, conf:0, confKr:0, byCod:0}; return S.quota; }
// vessels with a participation right in the closed group, J-30-2026 §§ 16, 18, 19 (hyse and saithe for largest length under 11 m);
// quota priced at about NOK 225 per kg of cod (estimate from Riksrevisjonen's 2017 level and the cod price since)
// Vessels for sale with a closed-group right (deltakeradgang), by quota length (hjemmelslengde), with J-30-2026's figures: cod as a
// fixed vessel quota, haddock and saithe as [maximum, guaranteed] kg. The price is the boat plus the cod quota at KPK kr a kg. KPK is
// an estimate: Hepsøfjord (10.98 m, two quota sets) sold for 17.5 million in 2025, about 270 kr/kg; Riksrevisjonen put a 9 m right at
// 1.8 million in 2017, when the quotas were far bigger. To be checked against the quota brokers.
const KPK = 260;
const LIC_OFFERS = [
  {id:'u7', ves:'trebat', hl:'under 7 m', cod:9562, hyse:[91198, 4343], sei:[163515, 5275], kpk:KPK, no:'Gammel tresnekke med hjemmel under 7 m', en:'Old wooden snekke with a right under 7 m'},
  {id:'h7', ves:'snekke', hl:'7–7,9 m', cod:11301, hyse:[106700, 5100], sei:[191200, 6200], kpk:KPK, no:'Plastsnekke med hjemmel 7–7,9 m', en:'Fibreglass snekke with a right of 7–7.9 m'},
  {id:'h8', ves:'jukesjark', hl:'8–8,9 m', cod:13434, hyse:[127000, 6000], sei:[227800, 7300], kpk:KPK, no:'Plastsjark med hjemmel 8–8,9 m', en:'Fibreglass sjark with a right of 8–8.9 m'},
  {id:'h9', ves:'sjark', hl:'9–9,9 m', cod:16437, hyse:[157100, 7500], sei:[281800, 9100], kpk:KPK, no:'Sjark 34 fot med hjemmel 9–9,9 m', en:'34 ft sjark with a right of 9–9.9 m'},
  {id:'h10', ves:'hurtigsjark', hl:'10–10,9 m', cod:17780, hyse:[167727, 7987], sei:[300754, 9702], kpk:KPK, no:'Hurtigsjark med hjemmel 10–10,9 m', en:'Speed sjark with a right of 10–10.9 m'}
];
function licValue(l){ return l ? Math.round(l.cod * l.kpk) : 0; }
function lenGroup(){ const L = BOAT.len || 5.8; return L < 8 ? 0 : L < 10 ? 1 : 2; }
function codLimits(){ if (S.lic) return {max:S.lic.cod, guar:S.lic.cod}; const g = QUOTA.cod[lenGroup()]; return {max:g[1], guar:g[2]}; }
// the open group's maximum-quota fishing is stopped when the group quota is estimated fished: 15 May in 2025, 16 April in 2026
function codStopDoy(y){ return y === 2025 ? 134 : y === 2026 ? 105 : 98 + Math.floor(h2(y, 901) * 42); }
function codOpen(H){ return !!S.lic || doyH(H) < codStopDoy(yearH(H)); }
function codLimitNow(H){ const l = codLimits(); return codOpen(H) ? l.max : l.guar; }
// fresh-fish scheme: from 29 June, cod up to a share of the week's fresh landings comes on top of the quota
function ffPct(H){ const y = yearH(H), d = doyH(H), day = (m, dd) => Math.floor((Date.UTC(y, m - 1, dd) - Date.UTC(y, 0, 1)) / 864e5);
  return d < day(6, 29) ? 0 : d < day(9, 15) ? 0.2 : d < day(10, 13) ? 0.3 : d < day(12, 15) ? 0.4 : 0.1; }
// ---- haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub. ----
const HAILL = {
  kveit:{no:'Kveithaill', en:'Halibut luck', nok:19, d:{no:'Tre ganger så stor sjanse for kveite når du fisker etter kveite, og litt mer kveite ved vanlig fiske.', en:'Three times the chance of halibut when you fish for halibut, and a little more halibut in ordinary fishing.'}},
  haill:{no:'Haill', en:'Luck', nok:29, d:{no:'10 % bedre fiskelykke på alle arter.', en:'10% better luck on all species.'}},
  luksus:{no:'Luksushaill', en:'Luxury luck', nok:59, d:{no:'20 % bedre fiskelykke på alle arter og 35 % bedre på torsk og skrei.', en:'20% better luck on all species and 35% better on cod and skrei.'}}
};
function haillF(){ const h = S.haill; if (!h) return 0; const d = (S.t - h.t0) / 1440; return d < 2 ? 1 : d >= 7 ? 0 : 1 - (d - 2) / 5; }
function luck(sp){ const h = S.haill, f = haillF(); if (!h || f <= 0) return 1;
  if (h.type === 'kveit') return sp !== 'kveite' ? 1 : S.target === 'kveite' ? 1 + 2 * f : 1 + 0.5 * f;
  if (h.type === 'haill') return 1 + 0.1 * f;
  return 1 + (sp === 'torsk' ? 0.35 : 0.2) * f; }
function giveHaill(type, how){ S.haill = {type, t0:S.t, how}; log('Ny ' + HAILL[type].no.toLowerCase() + ' om bord.', 'New ' + HAILL[type].en.toLowerCase() + ' aboard.'); }
// the pub: one round per evening between 15:00 and 03:00, NOK 1000
const PUB_COST = 1000;
const PUB_WHEEL = [['tom', 18], ['kveit', 18], ['tom', 17], ['rykte', 20], ['haill', 7.5], ['tom', 18], ['luksus', 1.5]];
// game hour 0 is 06:00 on the clock (EPOCH), so an evening that opens at 15:00 starts at game hour 9 + 24·n
const EPOCH_HR = new Date(EPOCH).getUTCHours();
function pubEvening(H){ return Math.floor((H + EPOCH_HR - 15) / 24); }
function pubOpen(H){ const hr = gDate(H).getUTCHours(); return hr >= 15 || hr < 3; }
// the hold (borrowed deck tubs from «Kaffe på kaia» are gone since 01.10.2026)
function capHold(){ return BOAT.holdCap; }
// ---- the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
// you stay away takes three off, never below zero. No ceiling for now (decided 30.09.2026); change STREAK to add one. ----
const STREAK = {step:1, decay:3, max:Infinity};
function streakState(){ return S.streak || (S.streak = {last:null, pct:0, days:0, best:0}); }
function streakPct(){ return streakState().pct; }
function streakTouch(){
  const st = streakState(), today = dayKey(); if (st.last === today) return null;
  const gap = st.last ? dayNum(today) - dayNum(st.last) : 1; if (gap <= 0) return null;   // the clock went back: nothing happens
  const before = st.pct, lost = Math.min(before, STREAK.decay * (gap - 1));
  st.pct = Math.min(STREAK.max, before - lost + STREAK.step); st.days++; st.best = Math.max(st.best, st.pct); st.last = today;
  const r = {before, lost, pct:st.pct, missed:gap - 1};
  if (r.missed > 0 && lost > 0) log('Innloggingsbonus: du var borte ' + r.missed + (r.missed > 1 ? ' dager' : ' dag') + ', og bonusen falt ' + lost + ' %. Dagens innlogging gir 1 %, så nå er den ' + st.pct + ' %.',
    'Login bonus: you were away ' + r.missed + ' day' + (r.missed > 1 ? 's' : '') + ' and the bonus fell ' + lost + ' %. Today\'s login adds 1 %, so it is now ' + st.pct + ' %.');
  else log('Innloggingsbonus: ' + st.pct + ' % ekstra på fiskeprisen.', 'Login bonus: ' + st.pct + ' % extra on the fish price.');
  return r;
}
// ---- cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
// oilskins keep you dry, a thermal suit keeps you warm, and everyone aboard needs their own ----
const CLOTHES = {olje:{no:'Oljehyre', en:'Oilskins', price:1290, d:{no:'Jakke og bukse som holder deg tørr i regn og sjøsprøyt.', en:'Jacket and trousers that keep you dry in rain and spray.'}},
                 varme:{no:'Varmedress', en:'Thermal suit', price:3490, d:{no:'Flytedress som holder deg varm i kulde og vind.', en:'Flotation suit that keeps you warm in cold and wind.'}}};
function effTemp(H){ const T = airTemp(H), v = windAt(H) * 3.6; return (T > 10 || v < 4.8) ? T : 13.12 + 0.6215 * T - 11.37 * Math.pow(v, 0.16) + 0.3965 * T * Math.pow(v, 0.16); }
function coldPen(H, hs){
  const cold = clamp((5 - effTemp(H)) / 25, 0, 1), wet = Math.max(precipAt(H), sstep(0.6, 1.8, hs == null ? hsAt(S.boat.pos, H) : hs));
  const people = 1 + (S.crew ? S.crew.length : 0), c = S.clothes || {}, o = Math.min(1, (c.olje || 0) / people), w = Math.min(1, (c.varme || 0) / people);
  const pen = (kc, kw) => Math.min(0.5, 0.35 * cold * kc + 0.15 * wet * kw);
  return pen(1, 1) * (1 - o) * (1 - w) + pen(0.85, 0.2) * o * (1 - w) + pen(0.3, 0.6) * w * (1 - o) + pen(0.25, 0.15) * o * w;
}
// ---- orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer ----
const CUSTOMERS = [
  {id:'mh', no:'Mottaket på Husøy', port:'husoy', sp:['torsk', 'sei', 'hyse'], big:true, q:'A'},
  {id:'ms', no:'Mottaket i Senjahopen', port:'senjahopen', sp:['sei', 'torsk', 'hyse'], big:true, q:'A'},
  {id:'mg', no:'Mottaket i Gryllefjord', port:'gryllefjord', sp:['torsk', 'sei', 'lange', 'brosme'], big:true, q:'B'},
  {id:'mb', no:'Mottaket i Botnhamn', port:'botnhamn', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'},
  {id:'fb', no:'Fiskebutikken på Finnsnes', port:'botnhamn', sp:['hyse', 'torsk', 'lyr'], big:false, q:'E'},
  {id:'ht', no:'Hotellet på Finnsnes', port:'botnhamn', sp:['lyr', 'kveite', 'torsk'], big:false, q:'E'},
  {id:'rs', no:'Restauranten i Senjahopen', port:'senjahopen', sp:['kveite', 'lyr', 'uer'], big:false, q:'E'},
  {id:'mso', no:'Mottaket på Sommarøy', port:'sommaroy', sp:['torsk', 'sei', 'hyse'], big:true, q:'A'},
  {id:'mbr', no:'Mottaket i Brensholmen', port:'brensholmen', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'},
  {id:'mto', no:'Mottaket i Torsken', port:'torsken', sp:['torsk', 'sei', 'lange', 'brosme'], big:true, q:'B'},
  {id:'mfr', no:'Mottaket i Frovåg', port:'frovag', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'}
];
const QN = {E:{no:'Ekstra', en:'Extra'}, A:{no:'A eller bedre', en:'A or better'}, B:{no:'B eller bedre', en:'B or better'}};
function gradeOk(g, q){ return q === 'E' ? g === 'E' : q === 'A' ? (g === 'E' || g === 'A') : (g === 'E' || g === 'A' || g === 'B'); }
function ordState(){ return S.orders || (S.orders = {offers:[], active:[], done:[], seq:0}); }
function repOf(id){ return (S.rep && S.rep[id] != null) ? S.rep[id] : 50; }
function spCatchable(sp, H){ if (sp === 'kveite' && kveiteClosed(H)) return false; if (sp === 'uer' && !uerOpen(H)) return false; if (sp === 'kveite' && !S.boat.kgear) return false;
  const s = SPECIES[sp]; let a = seasonal(s.av, H); if (sp === 'torsk') a += seasonal(s.skrei, H); return a >= 0.6; }
function ordersTick(H){
  const O = ordState();
  // deadlines: offers you did not take, and orders you did not deliver
  O.offers = O.offers.filter(o => o.offerUntil > S.t);
  for (const o of O.active.slice()) if (o.due <= S.t){ O.active.splice(O.active.indexOf(o), 1); const c = CUSTOMERS.find(x => x.id === o.cust);
    O.done.unshift({...o, t:S.t, ok:false}); O.done = O.done.slice(0, 20);
    log('Oppdraget for ' + c.no + ' ble ikke levert i tide: ' + fmt(o.left, 0) + ' av ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' mangler.', 'The order for ' + c.no + ' was not delivered in time: ' + fmt(o.left, 0) + ' of ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' missing.');
    S.rep[o.cust] = clamp(repOf(o.cust) - 10, 0, 100); msg(c.no, 'Bestillingen på ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' kom ikke i tide. Vi får ta det neste gang.', 'The order for ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' did not arrive in time. Maybe next time.'); }
  // new offers in the morning: one or two a day, at most three open
  if (gDate(H).getUTCHours() !== 6 || O.offers.length >= 3) return;
  const n = 1 + (h2(Math.floor(H / 24), 1301) < 0.4 ? 1 : 0);
  for (let k = 0; k < n && O.offers.length < 3; k++){
    const pool = CUSTOMERS.map(c => ({c, w:(0.5 + repOf(c.id) / 100) * (c.sp.some(sp => spCatchable(sp, H)) ? 1 : 0)})).filter(x => x.w > 0); if (!pool.length) return;
    let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), c = pool[0].c; for (const x of pool){ r -= x.w; if (r <= 0){ c = x.c; break; } }
    const sps = c.sp.filter(sp => spCatchable(sp, H) && (sp !== 'torsk' || codRoom(H) > 150)); if (!sps.length) continue;
    const sp = sps[Math.floor(Math.random() * sps.length)], cap = capHold();
    let kg = c.big ? Math.round(clamp(cap * (0.4 + Math.random() * 0.5), 100, 800) / 10) * 10 : Math.round((20 + Math.random() * 60) / 5) * 5;
    if (sp === 'kveite') kg = 20 + Math.round(Math.random() * 3) * 10;
    const rf = 0.8 + repOf(c.id) / 250, prem = Math.round((c.big ? 0.1 + Math.random() * 0.1 : 0.2 + Math.random() * 0.2) * rf * 100) / 100;
    O.offers.push({id:++O.seq, cust:c.id, port:c.port, sp, kg, left:kg, q:c.q, prem, bonus:Math.round((c.big ? 1500 + Math.random() * 1500 : 1000 + Math.random() * 1000) * rf / 100) * 100, offerUntil:S.t + 1440, days:c.big ? 3 : 2});
  }
}
