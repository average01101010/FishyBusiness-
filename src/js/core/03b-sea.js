// ===== SEA: fetch, wind sea, swell =====
// Fetch: how far the wind has blown over open water before it reaches p (km). 'from' is the compass direction the wind comes from.
// Seven rays at -45..+45 degrees, effective fetch after Saville (Shore Protection Manual 1984): sum(F cos^2 a) / sum(cos a).
// The rays march by the distance to the shore (coastDist: 100 m grid, about ±0.07 km and up to 8 % long) and stop on the 25 m land mask.
const FETCH = {open:600, edge:15, andoy:{x:-16, y:43.4}, kvaloy:62, cell:0.2, sec:10, max:80000};
const FETCH_A = [-45, -30, -15, 0, 15, 30, 45].map(a => ({a:a * Math.PI / 180, c:Math.cos(a * Math.PI / 180)}));
const FETCH_C = new Map();
// beyond the map edge: the open Norwegian Sea north and north-west, Andøya across Andfjorden to the west, fjords and islands south and east
function offMapFetch(x, y, dx, dy){
  if (y < 0) return x < FETCH.kvaloy || dx < -0.4 * -dy ? FETCH.open : FETCH.edge;
  if (x < 0){
    if (dx >= 0) return FETCH.edge;
    const t = (FETCH.andoy.x - x) / dx, yA = y + dy * t;
    return dy < 0 && yA < FETCH.andoy.y ? FETCH.open : Math.min(30, t);
  }
  return FETCH.edge;
}
function fetchRay(x, y, dx, dy){
  let s = 0;
  for (let i = 0; i < 3000; i++){
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return s + offMapFetch(x, y, dx, dy);
    const d = coastDist({x, y});
    let st = 0.025;
    if (d < 0.1){ if (isLand({x, y})) return s; } else st = Math.max(0.025, 0.92 * d - 0.07);
    x += dx * st; y += dy * st; s += st;
  }
  return s;
}
// x east, y south (km); a wind from bearing b comes from the direction (sin b, -cos b)
function fetchAt(p, from){
  if (isLand(p)) return 0;
  const b = from * Math.PI / 180; let num = 0, den = 0;
  for (const r of FETCH_A){ const a = b + r.a, F = fetchRay(p.x, p.y, Math.sin(a), -Math.cos(a)); num += F * r.c * r.c; den += r.c; }
  return num / den;
}
// cached at 200 m cells and 10 degree sectors as the root of the fetch (the wind sea goes as the root); a cell whose centre is on land is -1
function fetchCell(ix, iy, k){
  const key = GK(ix, iy) * 36 + k; let v = FETCH_C.get(key);
  if (v === undefined){
    const p = {x:(ix + 0.5) * FETCH.cell, y:(iy + 0.5) * FETCH.cell};
    v = isLand(p) ? -1 : Math.sqrt(fetchAt(p, k * FETCH.sec));
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
let WE_MEMO = {H:NaN, v:0}, WD_MEMO = {H:NaN, v:0};
function wdAt(H){ if (H === WD_MEMO.H && !WX_FORCE) return WD_MEMO.v; const v = windDir(H); WD_MEMO = {H, v}; return v; }
function weAt(H){ if (H === WE_MEMO.H && !WX_FORCE) return WE_MEMO.v; const v = 0.6 * windAt(H) + 0.4 * windAt(H - 3); WE_MEMO = {H, v}; return v; }

// Swell from the Norwegian Sea, from the west-north-west: a seasonal ground swell, and what the lows leave behind, which dies away
// over a day (only the sea a wind from the west half raised runs in towards the coast). It fades into the fjords and sounds with the
// openness to the ocean (EXPO, the same map exposure() is made from). The ground swell is set so the outer grounds keep the year's mean
// wave height they had before the fetch (Jonas' choice 02.10.2026).
const SWELL = [1.25,1.25,1.1,0.85,0.65,0.5,0.45,0.5,0.75,0.95,1.1,1.25];
const SWELL_K = [6, 12, 18, 24, 36];
let SW_MEMO = {H:NaN, v:null};
function swellOpen(H){
  if (H === SW_MEMO.H && !WX_FORCE) return SW_MEMO.v;
  const base = seasonal(SWELL, H) * (0.1 + 1.8 * vn(H / 50, 77));
  let rem = 0;
  for (const k of SWELL_K){ const d = windDir(H - k) * Math.PI / 180, west = Math.max(0, -Math.sin(d)); rem = Math.max(rem, hsWMO(weAt(H - k)) * Math.exp(-k / 24) * west); }
  const hs = Math.hypot(base, rem);
  const v = {hs, dir:300 + 50 * (vn(H / 60, 313) - 0.5), tp:clamp(8.5 + 1.1 * hs, 9, 14)};
  SW_MEMO = {H, v}; return v;
}
function swellFactor(p){ return Math.pow(gridBilinear(EXPO, GEO_EXPO.nx, GEO_EXPO.ny, GEO_EXPO.c, p) / 255, 1.5); }
// the sea at p: wind sea w and swell sw (significant heights, m), the wind sea's peak period and fetch, and where each comes from
function hsParts(p, H){
  const U = weAt(H), d = wdAt(H), F = fetchField(p, d), S = swellOpen(H);
  return {w:hsWind(U, F), sw:S.hs * swellFactor(p), tp:tpWind(U, F), F, U, dir:d, swDir:S.dir, swTp:S.tp};
}
let HS_MEMO = {x:NaN, y:NaN, H:NaN, v:0};
function hsAt(p, H){
  if (p.x === HS_MEMO.x && p.y === HS_MEMO.y && H === HS_MEMO.H && !WX_FORCE) return HS_MEMO.v;
  const q = hsParts(p, H), v = Math.max(0.05, Math.hypot(q.w, q.sw));
  HS_MEMO = {x:p.x, y:p.y, H, v}; return v;
}
function hsOpen(H){ return Math.max(0.05, Math.hypot(hsWMO(weAt(H)), swellOpen(H).hs)); }
// forecasts: the forecast wind (with its error) through the same sea; the swell forecast has its own error
function fcHsOpen(H, now){ return hsOpen(H) * (1 + fcErr(H, now, 5900)); }
function hsAtFc(p, H, now){
  const U = 0.6 * fcWind(H, now) + 0.4 * fcWind(H - 3, now), F = fetchField(p, windDir(H));
  return Math.max(0.05, Math.hypot(hsWind(U, F), swellOpen(H).hs * (1 + fcErr(H, now, 5900)) * swellFactor(p)));
}
// the sea state number by the significant wave height (the Douglas scale, WMO code 3700: 0 glassy ... 9 phenomenal)
const SEA_CODE = [0.05, 0.1, 0.5, 1.25, 2.5, 4, 6, 9, 14];
function seaState(hs){ let c = 0; while (c < 9 && hs >= SEA_CODE[c]) c++; return c; }
// the sea where you are, for the weather texts: wind sea and swell with where they come from, the state, and whether the wind sea is
// krapp (short and steep, as a young sea in a fjord: its height over its peak wavelength above 1/25)
function seaHere(p, H){
  const q = hsParts(p, H), hs = Math.max(0.05, Math.hypot(q.w, q.sw)), Lp = 1.56 * q.tp * q.tp;
  return {hs, w:q.w, sw:q.sw, dir:q.dir, swDir:q.swDir, swTp:q.swTp, code:seaState(hs), krapp:q.w >= 0.4 && q.w >= q.sw && Lp > 0 && q.w / Lp > 0.04};
}
