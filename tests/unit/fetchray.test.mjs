// fetchRay (core/03b-sea.js) with the far layers looked up once a ray (Ø3a, 07.11.2026) against the old way, written out here as it was
// (farL, coastDistFar and isLandFar at every step): the same fetch to the last bit over many rays on a stub of the core, in the old frame
// (the fine 200 m layers) and outside it (the coarse 1 km ones), across land and the frame's edge, and without the coarse layers.
export default function (t){
  const K = t.K, {MAPB, farL, coastDistFar, isLandFar, fetchRay, newState} = K;
  K.set('S', newState());
  const FETCH = K.get('FETCH'), MAPD = K.get('MAPD'), keep = Object.assign({}, MAPD.L);
  const fetchRayRef = (x, y, dx, dy) => {
    let s = 0; const q = {x, y};
    for (let i = 0; i < 3000; i++){
      q.x = x; q.y = y;
      if (x < MAPB.x0 || y < MAPB.y0 || x >= MAPB.x1 || y >= MAPB.y1 || !farL('land', q)) return s + FETCH.open;
      if (s >= FETCH.open) return s;
      const d = coastDistFar(q);
      let st = 0.1;
      if (d < 0.2){ if (isLandFar(q)) return s; } else st = Math.max(0.1, 0.92 * d - 0.15);
      x += dx * st; y += dy * st; s += st;
    }
    return s;
  };
  // the stub (as rammen.test.mjs): one cell a block, its value from the layer's function at the cell's middle; islands of land, and the
  // distance to them in the distance layers' own steps
  const isl = [[820, 330, 25], [760, 420, 40], [880, 260, 12], [600, 600, 60], [800, -600, 80], [1500, 300, 90], [-300, 900, 120]];
  const land = (x, y) => isl.some(([a, b, r]) => Math.hypot(x - a, y - b) < r) ? 1 : 0, dist = (x, y) => Math.max(0, Math.min(...isl.map(([a, b, r]) => Math.hypot(x - a, y - b) - r)));
  const mk = (name, c, x0, y0, x1, y1, fn) => ({name, c, ix0:Math.round(x0 / c), iy0:Math.round(y0 / c), nx:Math.round((x1 - x0) / c), ny:Math.round((y1 - y0) / c), n:1, k:1, bx:NaN, by:NaN, ox:NaN, oy:NaN, b:null, fn});
  const L200 = mk('land200', 0.2, 0, 0, 1450, 1750, land), D200 = mk('dc200', 0.2, 0, 0, 1450, 1750, (x, y) => Math.min(255, Math.round(dist(x, y) / 0.1)));
  const L1k = mk('land1k', 1, MAPB.x0, MAPB.y0, MAPB.x1, MAPB.y1, land), D1k = mk('dc1k', 1, MAPB.x0, MAPB.y0, MAPB.x1, MAPB.y1, (x, y) => Math.min(255, Math.round(dist(x, y) / 0.5)));
  K.set('mapBlock', (L, bx, by) => [L.fn((bx + 0.5) * L.c, (by + 0.5) * L.c)]);
  const put = Ls => { for (const k in MAPD.L) delete MAPD.L[k]; for (const L of Ls) MAPD.L[L.name] = L; };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const run = (what, n, box) => {
    let bad = 0, worst = 0, short = 0, open = 0;
    for (let k = 0; k < n; k++){
      const x = box[0] + rnd() * (box[2] - box[0]), y = box[1] + rnd() * (box[3] - box[1]), a = rnd() * 2 * Math.PI, dx = Math.sin(a), dy = -Math.cos(a);
      const A = fetchRay(x, y, dx, dy), B = fetchRayRef(x, y, dx, dy);
      if (A !== B){ bad++; worst = Math.max(worst, Math.abs(A - B)); }
      if (B < 50) short++; if (B >= FETCH.open) open++;
    }
    t.ok(bad === 0 && short >= n / 100 && open > n / 20, what + ': fetchRay gir samme strøklengde som den gamle måten i ' + n + ' stråler (' + bad + ' ulike, størst ' + worst + '; ' + short + ' korte, ' + open + ' åpne)');
  };
  put([L200, D200, L1k, D1k]);
  run('i den gamle rammen', 400, [550, 200, 950, 700]);
  run('ut av den gamle rammen og over kanten av hele', 300, [-900, -1100, 2400, 1700]);
  put([L200, D200]);
  run('uten de grove lagene', 200, [550, 200, 950, 700]);
  for (const k in MAPD.L) delete MAPD.L[k]; Object.assign(MAPD.L, keep);
}
