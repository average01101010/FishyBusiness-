// ===== SEA: fetch, wind sea, swell =====
// Fetch: how far the wind has blown over open water before it reaches p (km). 'from' is the compass direction the wind comes from.
// Five rays at -30..+30 degrees, effective fetch after Saville (Shore Protection Manual 1984): sum(F cos^2 a) / sum(cos a).
// The rays march by the distance to the shore (coastDist: 100 m grid, about ±0.07 km and up to 8 % long) and stop on the 25 m land mask.
const FETCH = {open:600, edge:15, andoy:{x:-16, y:43.4}, kvaloy:62, cell:0.2, sec:10, max:80000};
const FETCH_A = [-30, -15, 0, 15, 30].map(a => ({a:a * Math.PI / 180, c:Math.cos(a * Math.PI / 180)}));
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
// cached at 200 m cells and 10 degree sectors; a cell whose centre is on land is -1
function fetchCell(ix, iy, k){
  const key = (iy * 512 + ix) * 36 + k; let v = FETCH_C.get(key);
  if (v === undefined){
    const p = {x:(ix + 0.5) * FETCH.cell, y:(iy + 0.5) * FETCH.cell};
    v = isLand(p) ? -1 : fetchAt(p, k * FETCH.sec);
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
  return den > 0 ? num / den : fetchAt(p, k * FETCH.sec);
}
function fetchField(p, from){
  const f = ((from % 360) + 360) % 360 / FETCH.sec, k0 = Math.floor(f), u = f - k0;
  return fetchSector(p, k0 % 36) * (1 - u) + (u > 1e-3 ? fetchSector(p, (k0 + 1) % 36) * u : 0);
}
