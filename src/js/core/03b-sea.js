// ===== SEA: fetch, wind sea, swell =====
// Fetch: how far the wind has blown over open water before it reaches p (km). 'from' is the direction the wind comes from on the
// grid (the rays run on the map): the true direction - gridGamma(p).
// Seven rays at -45..+45 degrees, effective fetch after Saville (Shore Protection Manual 1984): sum(F cos^2 a) / sum(cos a).
// The rays run on the national core (phase K6 of the coast plan), the same for every place on the coast: they march by the distance
// to the shore (dc200: 200 m grid, 100 m steps) and stop on the 200 m land. Off the frame (the open Norwegian Sea, the Barents Sea,
// the North Sea) the open sea's fetch is added.
const FETCH = {open:600, cell:0.2, sec:10, max:80000, near:1, fine:1.5};
const FETCH_A = [-45, -30, -15, 0, 15, 30, 45].map(a => ({a:a * Math.PI / 180, c:Math.cos(a * Math.PI / 180)}));
const FETCH_C = new Map();
function fetchRay(x, y, dx, dy){
  let s = 0; const q = {x, y};   // (one point along the ray: an object a step was the most garbage the sea state left, 05.11.2026)
  // the far layers looked up once a ray, and a step's land layer used again for its land (Ø3a, 07.11.2026): what farL, coastDistFar
  // and isLandFar pick for the point, the same layer and the same numbers (fetchRayRef in tests/unit/fetchray.test.mjs is the old way,
  // on the live farL, coastDistFar and isLandFar, so a change in their rule shows there)
  const LA = MAPD.L[FARL.land[0]], LB = MAPD.L[FARL.land[1]], DA = MAPD.L[FARL.dc[0]], DB = MAPD.L[FARL.dc[1]];
  for (let i = 0; i < 3000; i++){
    q.x = x; q.y = y;
    if (x < MAPB.x0 || y < MAPB.y0 || x >= MAPB.x1 || y >= MAPB.y1) return s + FETCH.open;
    const LL = LA && mapCellIn(LA, q) ? LA : LB && mapCellIn(LB, q) ? LB : null; if (!LL) return s + FETCH.open;   // (farL('land'))
    if (s >= FETCH.open) return s;
    const DL = DA && mapCellIn(DA, q) ? DA : DB && mapCellIn(DB, q) ? DB : null, d = DL ? rbil(DL, q) * DCSTEP[DL.name] : 0;   // (coastDistFar)
    let st = 0.1;
    if (d < 0.2){ if (rcell(LL, Math.floor(x / LL.c), Math.floor(y / LL.c)) === 1) return s; } else st = Math.max(0.1, 0.92 * d - 0.15);   // (isLandFar)
    x += dx * st; y += dy * st; s += st;
  }
  return s;
}
// x east, y south (km); a wind from bearing b comes from the direction (sin b, -cos b)
function fetchAt(p, from){
  if (isLandFar(p)) return 0;
  const b = from * Math.PI / 180; let num = 0, den = 0;
  for (const r of FETCH_A){ const a = b + r.a, F = fetchRay(p.x, p.y, Math.sin(a), -Math.cos(a)); num += F * r.c * r.c; den += r.c; }
  return num / den;
}
// cached at 200 m cells and 10 degree sectors as the root of the fetch (the wind sea goes as the root); a cell whose centre is on land is -1
function fetchCell(ix, iy, k){
  const key = gridKey(ix, iy) * 36 + k; let v = FETCH_C.get(key);
  if (v === undefined){
    const p = {x:(ix + 0.5) * FETCH.cell, y:(iy + 0.5) * FETCH.cell};
    v = isLandFar(p) ? -1 : Math.sqrt(fetchAt(p, k * FETCH.sec));
    if (FETCH_C.size >= FETCH.max) FETCH_C.clear();
    FETCH_C.set(key, v);
  }
  return v;
}
// bilinear between the four cell centres (land centres left out), and linear between the two neighbouring sectors, so it never jumps
function fetchSector(p, k){
  const gx = p.x / FETCH.cell - 0.5, gy = p.y / FETCH.cell - 0.5, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  let num = 0, den = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++){
    const v = fetchCell(ix + i, iy + j, k); if (v < 0) continue;
    const w = (i ? fx : 1 - fx) * (j ? fy : 1 - fy) + 1e-6; num += v * w; den += w;
  }
  return den > 0 ? num / den : Math.sqrt(fetchAt(p, k * FETCH.sec));
}
// Near the shore the 200 m core cannot see a harbour's breakwater or a narrow sound (Husøy's harbour lies in a 200 m land cell, and
// the field took the open sea outside for it). Within FETCH.near km of the core's land, where the tile's detail is in, the rays' first
// FETCH.fine km run on the 25 m mask (isLand, the harbour pockets too) and the core's rays go on from there. The detail is always in
// round the boats and the gear in the sea (the simulation's barrier, 01b-mapdata.js), where the simulation asks for the sea, so the
// simulation is the same whatever else is loaded; elsewhere (a view) it takes the field until the pack comes.
function fetchFine(p, from){
  const b = from * Math.PI / 180; let num = 0, den = 0;
  for (const r of FETCH_A){
    const a = b + r.a, dx = Math.sin(a), dy = -Math.cos(a); let x = p.x, y = p.y, s = 0, F = -1;
    while (s < FETCH.fine){ const q = {x, y}; if (isLand(q)){ F = s; break; } const st = Math.max(0.02, 0.9 * coastDist(q) - 0.05); x += dx * st; y += dy * st; s += st; }
    if (F < 0) F = s + fetchRay(x, y, dx, dy);
    num += F * r.c * r.c; den += r.c;
  }
  return num / den;
}
function fetchHere(p, from){ return coastDistFar(p) < FETCH.near && mapSimAt(p) && mapReadyAt(p, 0) ? fetchFine(p, from) : fetchField(p, from); }
function fetchField(p, from){
  const f = ((from % 360) + 360) % 360 / FETCH.sec, k0 = Math.floor(f), u = f - k0;
  const r = fetchSector(p, k0 % 36) * (1 - u) + (u > 1e-3 ? fetchSector(p, (k0 + 1) % 36) * u : 0); return r * r;
}

// Wind sea limited by fetch (JONSWAP, Hasselmann et al. 1973), U at 10 m (m/s), F in km:
//   Hs = 0.0016 U sqrt(F/g),  Tp = 0.286 (U/g) (gF/U^2)^(1/3)
// It never grows past the probable height WMO gives for the open sea at each Beaufort force (the WMO Beaufort table, as NOAA and
// the Hong Kong Observatory print it), interpolated between the middle speeds of the forces.
const WMO = {u:[0.1, 0.9, 2.45, 4.4, 6.7, 9.35, 12.3, 15.5, 18.95, 22.6, 26.45, 30.55, 34.5], hs:[0, 0.1, 0.2, 0.6, 1, 2, 3, 4, 5.5, 7, 9, 11.5, 14]};
function hsWMO(U){
  const u = WMO.u, h = WMO.hs; if (U <= u[0]) return 0;
  for (let i = 1; i < u.length; i++) if (U < u[i]) return h[i - 1] + (h[i] - h[i - 1]) * (U - u[i - 1]) / (u[i] - u[i - 1]);
  return h[12] + (U - u[12]) * 0.6;
}
function hsWind(U, F){ return Math.min(hsWMO(U), 0.0016 * U * Math.sqrt(F * 1000 / 9.81)); }
// the fetch (km) at which the wind sea reaches the open-sea height, and the peak period it has there
function fetchCap(U){ return U > 0.3 ? (hsWMO(U) / (0.0016 * U)) ** 2 * 9.81 / 1000 : 0; }
function tpWind(U, F){ const f = Math.min(F, fetchCap(U)) * 1000; return f > 0 ? 0.286 * (U / 9.81) * Math.cbrt(9.81 * f / (U * U)) : 0; }
// the wind the sea has had time to answer: most of now, some of three hours ago
// (kept per hour and 5 km cell: the weather moves along the coast, V4)
let WE_MEMO = {H:NaN, k:null, v:0}, WD_MEMO = {H:NaN, k:null, v:0};
function wdAt(H, p){ const k = wxPlace(p); if (H === WD_MEMO.H && k === WD_MEMO.k && !WX_FORCE) return WD_MEMO.v; const v = windDir(H, p); WD_MEMO = {H, k, v}; return v; }
function weAt(H, p){ const k = wxPlace(p); if (H === WE_MEMO.H && k === WE_MEMO.k && !WX_FORCE) return WE_MEMO.v; const v = 0.6 * windAt(H, p) + 0.4 * windAt(H - 3, p); WE_MEMO = {H, k, v}; return v; }

// Swell from the Norwegian Sea, from the west-north-west: a seasonal ground swell, and what the lows leave behind, which dies away
// over a day (only the sea a wind from the west half raised runs in towards the coast). It fades into the fjords and sounds with the
// openness to the ocean (EXPO, the same map exposure() is made from). The ground swell is set so the outer grounds keep the year's mean
// wave height they had before the fetch (Jonas' choice 02.10.2026).
const SWELL = [1.25,1.25,1.1,0.85,0.65,0.5,0.45,0.5,0.75,0.95,1.1,1.25];
const SWELL_K = [6, 12, 18, 24, 36];
let SW_MEMO = {H:NaN, k:null, v:null};
function swellOpen(H, p){
  const K = wxPlace(p), Hl = H - K.dt; if (H === SW_MEMO.H && K === SW_MEMO.k && !WX_FORCE) return SW_MEMO.v;
  const base = seasonal(SWELL, Hl) * (0.1 + 1.8 * vn(Hl / 50, 77));
  let rem = 0;
  for (const k of SWELL_K){ const d = windDir(H - k, p) * Math.PI / 180, west = Math.max(0, -Math.sin(d)); rem = Math.max(rem, hsWMO(weAt(H - k, p)) * Math.exp(-k / 24) * west); }
  const hs = Math.hypot(base, rem);
  const v = {hs, dir:300 + 50 * (vn(Hl / 60, 313) - 0.5), tp:clamp(8.5 + 1.1 * hs, 9, 14)};
  SW_MEMO = {H, k:K, v}; return v;
}
function swellFactor(p){ return Math.pow(expoFar(p) / 255, 1.5); }
// the sea at p: wind sea w and swell sw (significant heights, m), the wind sea's peak period and fetch, and where each comes from
function hsParts(p, H){
  const U = weAt(H, p), d = wdAt(H, p), F = fetchHere(p, d - gridGamma(p)), S = swellOpen(H, p);
  return {w:hsWind(U, F), sw:S.hs * swellFactor(p), tp:tpWind(U, F), F, U, dir:d, swDir:S.dir, swTp:S.tp};
}
let HS_MEMO = {x:NaN, y:NaN, H:NaN, v:0};
function hsAt(p, H){
  if (p.x === HS_MEMO.x && p.y === HS_MEMO.y && H === HS_MEMO.H && !WX_FORCE) return HS_MEMO.v;
  const q = hsParts(p, H), v = Math.max(0.05, Math.hypot(q.w, q.sw));
  HS_MEMO = {x:p.x, y:p.y, H, v}; return v;
}
function hsOpen(H, p){ return Math.max(0.05, Math.hypot(hsWMO(weAt(H, p)), swellOpen(H, p).hs)); }
// forecasts: the forecast wind (with its error) through the same sea; the swell forecast has its own error
function fcHsOpen(H, now, p){ return hsOpen(H, p) * (1 + fcErr(H, now, 5900)); }
function hsAtFc(p, H, now){
  const U = 0.6 * fcWind(H, now, p) + 0.4 * fcWind(H - 3, now, p), F = fetchHere(p, windDir(H, p) - gridGamma(p));
  return Math.max(0.05, Math.hypot(hsWind(U, F), swellOpen(H, p).hs * (1 + fcErr(H, now, 5900)) * swellFactor(p)));
}
// the sea state number by the significant wave height (the Douglas scale, WMO code 3700: 0 glassy ... 9 phenomenal)
const SEA_CODE = [0.05, 0.1, 0.5, 1.25, 2.5, 4, 6, 9, 14];
function seaState(hs){ let c = 0; while (c < 9 && hs >= SEA_CODE[c]) c++; return c; }
// the sea where you are, for the weather texts: wind sea and swell with where they come from, the state, and whether the wind sea is
// krapp (short and steep, as a young sea in a fjord: its height over its peak wavelength above 1/25)
function seaHere(p, H){
  const q = hsParts(p, H), hs = Math.max(0.05, Math.hypot(q.w, q.sw)), Lp = 1.56 * q.tp * q.tp;
  let cur = null; try { cur = seaCur(p, H, q); } catch (e){}   // (the wind sea against the stream, F8b)
  return {hs, w:q.w, sw:q.sw, dir:q.dir, swDir:q.swDir, swTp:q.swTp, code:seaState(hs), krapp:q.w >= 0.4 && q.w >= q.sw && Lp > 0 && q.w / Lp > 0.04, cur};
}
// ---- waves on a current (Ø9 F8b, docs/planer/fysikk-4-sjo-og-skrog.md F8) ----
// A wave that runs on to a current keeps its frequency as the ground sees it, om, and its wavenumber follows (om - k U)^2 = g k (deep
// water; U the current along the way the wave travels, negative against it). The phase speed through the water is then
// c = c0 (1 + sqrt(1 + 4 U / c0)) / 2 (c0 = g / om) and k = g / c^2: shorter against the stream, longer with it. The height follows the
// wave action (Longuet-Higgins and Stewart 1961): H / H0 = sqrt(c0 cg0 / (c (cg + U))) = c0 / sqrt(c (c + 2 U)), so a sea against the
// stream is shorter and higher (steep, breaking), with it longer and lower. At U = -c0 / 4 the wave is blocked (its energy cannot get
// up against the stream) and the formula goes to infinity: held at CURW.max (2.5, the plan's cap), where the sea breaks instead.
// The boat feels the stream without the wind's drift (curAt's sx, sy), and none of it under 0.2 knots (all of it from 0.3): the tide's
// own stream along the open coast is under that, so nothing changes there (curEff).
const CURW = {max:2.5, dead:0.2 * 1852 / 3600, full:0.3 * 1852 / 3600, krapp:1852 / 3600, w:0.2};
function curWave(om, U){
  const c0 = 9.81 / om; if (!(om > 0) || !(Math.abs(U) > 1e-3)) return {kf:1, af:1, c:c0, blocked:false};
  const x = 1 + 4 * U / c0; if (x <= 0) return {kf:4, af:CURW.max, c:c0 / 2, blocked:true};
  const c = c0 * 0.5 * (1 + Math.sqrt(x)); return {kf:(c0 / c) ** 2, af:Math.min(CURW.max, c0 / Math.sqrt(c * (c + 2 * U))), c, blocked:false};
}
// the stream a vessel and the waves feel, of what curAt gives: m/s east and south on the grid, and its speed (CURW.off: none, for the
// tests' comparison with still water; the game never sets it)
// (tx, ty: the part that turns with the tide, the sounds' stream and the tide's own, with the same dead band of its own: what carries a
// boat lying still, lieDrift. The coastal current runs one way, and a boat left lying a week would be 100 km down the coast.)
function curEff(c){
  const band = m => CURW.off ? 0 : m > CURW.dead ? clamp((m - CURW.dead) / (CURW.full - CURW.dead), 0, 1) : 0;
  const m = Math.hypot(c.sx, c.sy), f = band(m), tx0 = c.tx == null ? c.sx : c.tx, ty0 = c.ty == null ? c.sy : c.ty, ft = band(Math.hypot(tx0, ty0));
  return {x:c.sx * f, y:c.sy * f, m:m * f, tx:tx0 * ft, ty:ty0 * ft};
}
// the stream along the way a sea travels that comes from the true bearing from (degrees) where the grid is turned g: + with it
function curAlong(C, from, g){ const a = (from - g + 180) * Math.PI / 180; return C.x * Math.sin(a) - C.y * Math.cos(a); }
// the stream at p for the weather's words: its speed (knots), where it sets (true degrees), how much higher the wind sea stands in
// it, and krapp: the wind sea (at least CURW.w m of it) runs against a stream of over a knot
function seaCur(p, H, q){
  if (typeof curAt !== 'function') return null; const C = curEff(curAt(p, H)); if (!(C.m > 0)) return {kn:0, to:0, af:1, krapp:false};
  const g = gridGamma(p), U = curAlong(C, q.dir, g), cw = q.tp > 0.3 ? curWave(2 * Math.PI / q.tp, U) : {af:1};
  return {kn:C.m * 3600 / 1852, to:((Math.atan2(C.x, -C.y) * 180 / Math.PI + g) % 360 + 360) % 360, af:cw.af, against:-U * 3600 / 1852, krapp:q.w >= CURW.w && U <= -CURW.krapp};
}
// How much of the sea's speed loss she takes, by where the sea comes from (Fysikk 2, 19.10.2026): Kwon's direction factors for the
// involuntary speed loss in wind and waves (Y. J. Kwon, «Speed loss due to added resistance in wind and waves», The Naval
// Architect, March 2008), at force 6: 1 in a head sea, 0.79 on the bow, 0.45 abeam, 0.14 from astern. A small boat eases down in a
// steep following sea to keep from broaching, so from astern she keeps a third of the loss here. The wind sea and the swell count by
// their energy; rel is the angle between the bow and where the sea comes from (0 a head sea).
const SEA_DIRF = [[0, 1], [30, 0.97], [60, 0.78], [90, 0.55], [120, 0.44], [150, 0.37], [180, 0.35]];
function seaDirOf(rel){
  const a = Math.min(180, Math.abs(rel) * 180 / Math.PI);
  for (let i = 1; i < SEA_DIRF.length; i++) if (a <= SEA_DIRF[i][0]){ const [a0, f0] = SEA_DIRF[i - 1], [a1, f1] = SEA_DIRF[i]; return f0 + (f1 - f0) * (a - a0) / (a1 - a0); }
  return SEA_DIRF[SEA_DIRF.length - 1][1];
}
// the sea's parts near p (kept per 100 m and game hour: the model asks every tick)
let SEAP_MEMO = {k:'', v:null};
function seaPartsNear(p, H){ const k = H + '|' + Math.round(p.x * 10) + '|' + Math.round(p.y * 10); if (SEAP_MEMO.k === k && !WX_FORCE) return SEAP_MEMO.v; const v = hsParts(p, H); SEAP_MEMO = {k, v}; return v; }
// the share of the loss on the heading head (grid, radians, clockwise from north)
function seaDirF(p, H, head){
  const q = seaPartsNear(p, H), g = gridGamma(p), e = q.w * q.w + q.sw * q.sw; if (!(e > 1e-4) || !isFinite(head)) return 1;
  const rel = from => { let d = ((from - g) * Math.PI / 180 - head) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
  return (q.w * q.w * seaDirOf(rel(q.dir)) + q.sw * q.sw * seaDirOf(rel(q.swDir))) / e;
}
// ---- The breaking sea, brottsjøen (Ø9 F7, docs/planer/fysikk-4-sjo-og-skrog.md F7; Jonas 27.10.2026 6A: «at båten skal fungere så ekte
// som mulig», and 13.11.2026 on what it does: «Bare varsel og skrekk»: the crew warns, and they get a fright; the boat is not damaged and
// nothing goes over the side) ----
// A rare extreme wave in a rough sea: where the significant height is over BRT.hs (3 m) and either the wind sea and the swell cross at
// more than BRT.cross (60 degrees, both at least BRT.sysMin high), or the wind sea runs against a stream of more than BRT.curKn knots
// (F8b; its height as the stream raises it, seaCur's af). A group of waves about 2 Hs high (a crest to trough of twice the significant
// height: the definition of a freak wave in a Rayleigh sea, where a single wave that high comes once in e^8, about 3 000 waves:
// Longuet-Higgins 1952) builds, runs through at the group speed and dies away, and some of them break (BRT.B, the share that breaks as a
// brottsjø, is assumed: no source gives it for a sea state).
// The same for everyone (CLAUDE.md: one world, one clock): the coast is cut in BRT.cell km cells, and each cell and game minute has a
// number from a fixed hash; where it falls under the rate the sea at the cell's point gives, a group is born there at that minute, at a
// point in the cell the hash gives, running the way that sea runs. Nothing but the place, the time and the weather goes in, so two players
// in the same place see the same group, and a boat out while the game is closed meets it in the minute step as she would have (catchUp).
// The waves move in real seconds (as the shared sea in 3D does, B4: the world's clock in seconds), BRT.rs real seconds a game minute,
// so the rate at a point is the share of the waves passing it in real time: 1 / Tz a second (Tz = Tp / 1.29 for JONSWAP, gamma 3.3).
// A cell's rate is the point's times the cell's area over the area one group sweeps (its width, twice BRT.sw wavelengths, times the
// way it runs while it is at least half its height, the width where it is at least half its height, 2 x BRT.half x BRT.sw
// wavelengths): that is where a boat would meet it. BRT.rmax holds a cell's rate (a short sea's groups are small, so its cells' rates are
// high: 0.07 a minute at Tp 4 s); the hash is read first, and the sea is asked only under it.
const BRT = {cell:2, hs:3, cross:60, curKn:2, sysMin:1, B:0.25, life:14, sa:1.2, sw:2.5, half:Math.sqrt(Math.log(2)), lead:30, rs:60 / GAME_RATE, rmax:0.12, look:30, lee:0.5, seed:0x5eab7e};
function brtHash(ix, iy, t, k){
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1) ^ Math.imul(t | 0, 0x9e3779b1) ^ Math.imul((k | 0) + 1, 0x85ebca6b) ^ BRT.seed;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296;
}
// the sea at p at game hour H that can raise one: null, or the two systems, the height and why (kryss: crossing, strom: against the stream)
// (the sea from the national layers only, fetchField and not fetchHere: the 25 m detail is in only where a boat has loaded it, and the
// rule must give the same for every player whatever they have loaded; the kontroll 13.11.2026)
function brottSea(p, H){
  const U = weAt(H, p), d = wdAt(H, p), F = fetchField(p, d - gridGamma(p)), S = swellOpen(H, p);
  return {w:hsWind(U, F), sw:S.hs * swellFactor(p), tp:tpWind(U, F), F, U, dir:d, swDir:S.dir, swTp:S.tp};
}
function brottCond(p, H){
  if (isLandFar(p)) return null;
  const q = brottSea(p, H); if (!(Math.hypot(q.w * CURW.max, q.sw) >= BRT.hs)) return null;   // (too low even with the most a stream lifts it)
  let af = 1, against = 0;
  try { const c = seaCur(p, H, q); if (c){ af = c.af || 1; against = c.against || 0; } } catch (e){}
  const w = q.w * af, hs = Math.hypot(w, q.sw); if (!(hs >= BRT.hs)) return null;
  const cross = Math.abs(((q.dir - q.swDir) % 360 + 540) % 360 - 180);
  const crossing = w >= BRT.sysMin && q.sw >= BRT.sysMin && cross > BRT.cross, stream = w >= BRT.sysMin && against > BRT.curKn;
  if (!crossing && !stream) return null;
  return {hs, w, sw:q.sw, dir:q.dir, swDir:q.swDir, tp:q.tp, swTp:q.swTp, why:crossing ? 'kryss' : 'strom'};
}
// the group born in cell (ix, iy) at game minute t, or null. cond: the sea's rule (brottCond; a test gives its own)
// (kept per cell and minute with the game's own rule: brottNear asks for each one every minute it may be on the water, and the minute
// step and the view both ask)
const BRT_MEMO = new Map();
function brottEvent(ix, iy, t, cond){
  const u = brtHash(ix, iy, t, 0); if (u >= BRT.rmax) return null;   // (most cells and minutes stop here, before the sea is asked)
  if (cond) return brottMake(ix, iy, t, u, cond);
  const k = ix + ',' + iy + ',' + t; if (BRT_MEMO.has(k) && !WX_FORCE) return BRT_MEMO.get(k);
  const e = brottMake(ix, iy, t, u, brottCond); if (BRT_MEMO.size > 20000) BRT_MEMO.clear(); BRT_MEMO.set(k, e); return e;
}
function brottMake(ix, iy, t, u, cond){
  const c = {x:(ix + brtHash(ix, iy, t, 1)) * BRT.cell, y:(iy + brtHash(ix, iy, t, 2)) * BRT.cell}, C = cond(c, t / 60); if (!C) return null;
  const wind = C.why === 'strom' || brtHash(ix, iy, t, 3) < C.w * C.w / (C.w * C.w + C.sw * C.sw);   // (crossing: the system by its energy)
  const tp = Math.max(3, wind ? C.tp : C.swTp), L = 9.81 * tp * tp / (2 * Math.PI), cg = 9.81 * tp / (4 * Math.PI), life = BRT.life * tp, sw = BRT.sw * L;
  const area = 2 * BRT.half * sw * cg * life * 2 / 3 / 1e6, lam = BRT.rs / (tp / 1.29) * Math.exp(-8) * BRT.B, rate = Math.min(BRT.rmax, lam * BRT.cell * BRT.cell / area);
  if (u >= rate) return null;
  const from = wind ? C.dir : C.swDir, a = (from - gridGamma(c) + 180) * Math.PI / 180;   // (the way it runs, on the grid)
  return {id:ix + ':' + iy + ':' + t, t, x:c.x, y:c.y, dx:Math.sin(a), dy:-Math.cos(a), from, hs:C.hs, tp, L, cg, life, sa:BRT.sa * L, sw, sys:wind ? 'w' : 'sw', why:C.why};
}
// the groups that may be on the water near p at game time T (minutes, with its fraction): the nine cells round p, born in the last BRT.look
// game minutes (a group lives BRT.life periods, 14 x 16 s at the longest, 22 game minutes)
function brottNear(p, T, cond){
  const ix = Math.floor(p.x / BRT.cell), iy = Math.floor(p.y / BRT.cell), out = [], t1 = Math.floor(T);
  for (let t = t1 - BRT.look; t <= t1; t++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++){
    const e = brottEvent(ix + i, iy + j, t, cond); if (e && (T - t) * BRT.rs <= e.life) out.push(e); }
  return out;
}
// where p stands to the group at game time T: d, metres ahead of the group's middle along its way (negative: it has passed), x across,
// tau the real seconds since it was born, f its height (0 to 1, a sine over its life) now, and fp when its middle reaches p (or reached
// it: the warning and the hit judge by the same height)
function brottRel(e, p, T){
  const ax = (p.x - e.x) * 1000, ay = (p.y - e.y) * 1000, tau = (T - e.t) * BRT.rs, s = -e.cg * e.life / 2 + e.cg * tau;
  const d = ax * e.dx + ay * e.dy - s, fa = u => u >= 0 && u <= e.life ? Math.sin(Math.PI * u / e.life) : 0;
  return {d, x:-ax * e.dy + ay * e.dx, tau, s, f:fa(tau), fp:fa(tau + d / e.cg)};
}
// where it comes from against her bow: forut (within 45 degrees of the bow), babord, styrbord or akter (abaft the beam's 135)
function brottSide(e, head){
  let r = (Math.atan2(-e.dx, e.dy) - head) % (2 * Math.PI); if (r > Math.PI) r -= 2 * Math.PI; if (r < -Math.PI) r += 2 * Math.PI;
  // (atan2(-dx, dy): the bearing on the grid the group comes from, clockwise from north, as head is)
  const a = Math.abs(r) * 180 / Math.PI; return a <= 45 ? 'forut' : a >= 135 ? 'akter' : r > 0 ? 'styrbord' : 'babord';
}
// one game minute of the vessel in the minute step (16c-hull.js hullMinute calls it, also while the time away is played in): the crew
// warns when a group is coming at her within BRT.lead real seconds and will be at least half its height when it reaches her, and when its
// middle passes her (within the width where it is half its height or more), it has hit her: the crew gets a fright by how she took it
// (crewBrott, 14-crewlife.js). Nothing on the hull and nothing lost (Jonas 13.11.2026). Both are judged on her way through the minute,
// from where she was to where she is (she moves in game time, the group in the sea's real seconds: six times as fast over the ground as
// the waves), and only where the sea at her is at least BRT.lee of the group's (not in a lee). b.brt: the last groups warned of and that
// hit, and where she was.
function brottMinute(cond){
  const b = S.boat; if (!b || !b.pos || b.status === 'port' || b.hopHold){ if (b && b.brt) b.brt.p = null; return null; }
  const T = S.t, H = T / 60, B = b.brt || (b.brt = {w:[], h:[], p:null}); let hit = null;
  if (!Array.isArray(B.w)) B.w = B.w ? [B.w] : []; if (!Array.isArray(B.h)) B.h = B.h ? [B.h] : [];
  const p0 = B.p && Math.hypot(B.p.x - b.pos.x, B.p.y - b.pos.y) < 2 ? B.p : b.pos; B.p = {x:b.pos.x, y:b.pos.y};   // (where she was a minute ago: she moves too)
  const G = brottNear(b.pos, T, cond); if (!G.length) return null;
  // (in the lee, where the sea at her is under BRT.lee of the group's, it does not reach her: a bay, behind a holm)
  let hsHere = null; const here = () => hsHere == null ? (hsHere = (() => { try { const q = brottSea(b.pos, H); return Math.hypot(q.w, q.sw); } catch (e){ return 0; } })()) : hsHere;
  for (const e of G){
    const r0 = brottRel(e, p0, T - 1), r1 = brottRel(e, b.pos, T); if (Math.abs(r1.x) > e.sw * 0.83 && Math.abs(r0.x) > e.sw * 0.83) continue;
    // the closing speed: the group's way and hers along it this minute (at the least the group's own)
    const dd = Math.max(r0.d - r1.d, e.cg * BRT.rs), fa = u => u >= 0 && u <= e.life ? Math.sin(Math.PI * u / e.life) : 0;
    const head = boatHead(H, b).head, side = brottSide(e, head);
    if (!B.w.includes(e.id) && !B.h.includes(e.id) && r1.d > 0 && r1.d <= dd * (BRT.lead / BRT.rs + 1) && Math.abs(r1.x) <= e.sw * 0.83 && fa(r1.tau + r1.d / dd * BRT.rs) >= 0.5 && here() >= BRT.lee * e.hs){
      B.w.push(e.id); if (B.w.length > 6) B.w.shift(); if (typeof crewBrott === 'function') crewBrott('warn', side); }
    if (!B.h.includes(e.id) && r0.d > 0 && r1.d <= 0){
      const k = r0.d / (r0.d - r1.d), x = r0.x + (r1.x - r0.x) * k;   // (where and when its middle crossed her track)
      if (Math.abs(x) > e.sw * 0.83 || fa(r0.tau + k * BRT.rs) < 0.5 || here() < BRT.lee * e.hs) continue;
      B.h.push(e.id); if (B.h.length > 6) B.h.shift(); hit = {e, side};
      S.incidents = S.incidents || []; S.incidents.push({t:T, k:'brott', boat:S.boatName || 'Havbris', side, hs:+e.hs.toFixed(1), why:e.why}); if (S.incidents.length > 60) S.incidents.shift();
      if (typeof crewBrott === 'function') crewBrott('hit', side);
    }
  }
  return hit;
}
