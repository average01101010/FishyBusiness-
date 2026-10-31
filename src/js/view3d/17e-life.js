  // ---------- life in the landscape (G9 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // Round the eye, all from where things are (the terrain, the land cover, the roads, the buildings) and the shared clock, so every
  // player sees the same: white-tailed eagles soaring over the high slopes by the sea (more in the north), cormorants on the low rocks
  // at the waterline (some holding their wings out to dry), eiders in flocks close in along the shore, sheep on the grass and heath from
  // May to September, smoke from the chimneys under 5 °C, street lights along the roads in the towns at night, cars on the roads (small
  // cars by day, head and tail lights at night), and the birds of the ten known bird cliffs (src/data/fuglefjell.json). The animals are
  // the Blender models of tools/wild/dyr.py (src/data/dyr.b64), which also take over the porpoise and the whales. Each kind on a grid
  // of its own, decided by the cell's hash and looked for again when the eye has moved 120 m; on «Lav» only the birds of the cliffs,
  // the whales and the lights. #life0 in the address: none of it.
  const FUGL = /*@include(data/fuglefjell.json)*/null;
  const LIFE = {on:!/life0/.test(location.hash), M:null, at:-1e9, O:[1e9, 1e9], eag:[], cor:[], eid:[], shp:[], lamps:[], cars:[], cliff:[], carM:null, nEag:0, nCor:0, nEid:0, nShp:0, nCar:0, nLamp:0, nSmoke:0, nCliff:0};
  const LIFE_K = ['havorn', 'havorn_wR', 'havorn_wL', 'skarv', 'skarv_tork', 'ternM', 'ternF', 'sauK', 'sauM', 'porpoise', 'orca', 'humpback', 'fluke'];
  function lifeModels(){
    if (LIFE.M !== null) return LIFE.M;
    LIFE.M = false; if (typeof glbHas !== 'function' || !glbHas('dyr')) return false;
    const M = {};
    for (const k of LIFE_K){ const o = glbPart('dyr', k); if (!o) return LIFE.M = false;
      const n = o.p.length / 3, c = new Float32Array(n * 3); for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) c[i * 3 + j] = o.c[i * 4 + j];
      M[k] = {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; }
    // the cars: a body and a cabin, in five colours
    M.cars = [[0.75, 0.1, 0.08], [0.85, 0.86, 0.87], [0.12, 0.13, 0.15], [0.2, 0.3, 0.5], [0.55, 0.56, 0.58]].map(k => { const m = MB(); m.box(0, 0.25, 0, 1.75, 0.7, 4.3, k, 0); m.box(0, 0.95, 0.25, 1.6, 0.55, 2.3, [0.13, 0.15, 0.18], 0, k); return m.mesh(); });
    return LIFE.M = M;
  }
  const lifeLat = z => (8050000 - z) / 111200;
  // the land cover class at a point (1 forest, 2 shrub, 3 grass, 4 crop, 5 wetland, 6 moss, 7 barren, 8 snow, 9 urban, 10 sand, 11 scree, 12 shingle; 0 none or not in)
  function lifeCls(x, z){
    const LC = MAPD.L.cover; if (!LC) return 0; const cm = LC.c * 1000, ix = Math.floor(x / cm), iz = Math.floor(z / cm);
    if (!mapIn(LC, ix, iz) || !covBlk(LC, Math.floor(ix / LC.n), Math.floor(iz / LC.n))) return 0; return rcell(LC, ix, iz);
  }
  const lifeSeaBy = (x, z, d) => { for (let k = 0; k < 8; k++){ const a = k * 0.785; if (terrH(x + Math.cos(a) * d, z + Math.sin(a) * d) < -0.3) return true; } return false; };
  const lifeLandBy = (x, z, d) => { for (let k = 0; k < 8; k++){ const a = k * 0.785; if (terrH(x + Math.cos(a) * d, z + Math.sin(a) * d) > 0.3) return true; } return false; };
  const lifeFree = (x, z) => !onUnit(x, z, 12) && !onSite(x, z);
  // the cells of a grid of g metres within R of the eye, each with its hash
  function lifeGrid(eye, g, R, salt, f){
    const i0 = Math.floor((eye[0] - R) / g), i1 = Math.floor((eye[0] + R) / g), j0 = Math.floor((eye[2] - R) / g), j1 = Math.floor((eye[2] + R) / g);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f(i, j, hash(i * 7919 + j * 104729 + salt));
  }
  function lifeBuild(eye, now){
    LIFE.at = now; LIFE.O = [eye[0], eye[2]];
    const mo = gDate(S.t / 60).getUTCMonth(), lo = QUAL.lvl === 0, E = [], C = [], D = [], H = [];
    if (!lo){
      // eagles: in one in two 2 km squares in the north (one in three in Trøndelag, one in seven further south) where the ground rises over
      // 110 m with the sea in the square, circling over the highest point found, sometimes a pair
      lifeGrid(eye, 2000, 5000, 11, (i, j, h) => {
        const lat = lifeLat(j * 2000 + 1000); if (h > (lat > 66 ? 0.5 : lat > 63 ? 0.33 : 0.15)) return;
        let bx = 0, bz = 0, by = -1e9, sea = false;
        for (let k = 0; k < 16; k++){ const x = (i + 0.1 + 0.8 * hash(h * 1e4 + k)) * 2000, z = (j + 0.1 + 0.8 * hash(h * 2e4 + k * 3.1)) * 2000, y = terrH(x, z); if (y < 0) sea = true; if (y > by){ by = y; bx = x; bz = z; } }
        if (!sea || by < 110) return;
        const n = hash(h * 3e4) < 0.4 ? 2 : 1;
        for (let k = 0; k < n; k++) E.push({x:bx, z:bz, y:by + 30 + 50 * hash(h * 4e4 + k), r:140 + 130 * hash(h * 5e4 + k), ph:k * 2.4 + h * 40, dir:hash(h * 6e4) < 0.5 ? 1 : -1});
      });
      // cormorants on the low rocks at the waterline, a few in each of one 60 m cell in thirty
      lifeGrid(eye, 60, 700, 23, (i, j, h) => {
        if (h > 0.035) return; const x = (i + 0.5) * 60, z = (j + 0.5) * 60, y = terrH(x, z);
        if (y < 0.4 || y > 4 || !lifeSeaBy(x, z, 15) || !lifeFree(x, z) || lifeCls(x, z) === 9) return;
        const n = 2 + Math.floor(hash(h * 1e4) * 5);
        for (let k = 0; k < n; k++){ const px = x + (hash(h * 2e4 + k) - 0.5) * 8, pz = z + (hash(h * 3e4 + k) - 0.5) * 8, py = terrH(px, pz); if (py < 0.3) continue;
          C.push({x:px, y:py, z:pz, hd:hash(h * 4e4 + k) * 6.28, dry:hash(h * 5e4 + k) < 0.35}); }
      });
      // eiders in flocks on the water close in to the shore (all the year)
      lifeGrid(eye, 90, 700, 37, (i, j, h) => {
        if (h > 0.05) return; const x = (i + 0.5) * 90, z = (j + 0.5) * 90;
        if (terrH(x, z) > -0.8 || !lifeLandBy(x, z, 40) || !lifeFree(x, z)) return;
        const n = 4 + Math.floor(hash(h * 1e4) * 9);
        for (let k = 0; k < n; k++) D.push({x:x + (hash(h * 2e4 + k) - 0.5) * 14, z:z + (hash(h * 3e4 + k) - 0.5) * 14, hd:hash(h * 4e4) * 6.28 + (hash(h * 5e4 + k) - 0.5) * 0.8, m:hash(h * 6e4 + k) < 0.5, ph:k * 1.7 + h * 9});
      });
      // sheep on the grass, the heath and the fell from May to September
      if (mo >= 4 && mo <= 8) lifeGrid(eye, 80, 900, 53, (i, j, h) => {
        if (h > 0.06) return; const x = (i + 0.5) * 80, z = (j + 0.5) * 80, y = terrH(x, z), cl = lifeCls(x, z);
        if (y < 2 || y > 160 || !(cl === 2 || cl === 3 || cl === 4 || cl === 6) || !lifeFree(x, z)) return;
        const n = 3 + Math.floor(hash(h * 1e4) * 7);
        for (let k = 0; k < n; k++){ const px = x + (hash(h * 2e4 + k) - 0.5) * 30, pz = z + (hash(h * 3e4 + k) - 0.5) * 30, py = terrH(px, pz);
          if (py < 1.5 || Math.abs(terrH(px + 4, pz) - terrH(px - 4, pz)) + Math.abs(terrH(px, pz + 4) - terrH(px, pz - 4)) > 4) continue;
          H.push({x:px, y:py, z:pz, hd:hash(h * 4e4 + k) * 6.28, dk:hash(h * 5e4 + k) < 0.22, ph:k * 2.3 + h * 7}); }
      });
    }
    LIFE.eag = E; LIFE.cor = C; LIFE.eid = D; LIFE.shp = H;
    // the roads within 2.5 km: a street light each 35 m where they run through a town; the cars (6 a km in town, 0.6 on the main roads
    // out of it), each at its own speed and phase along the road, keeping to the right
    const lamps = [], cars = [];
    for (const r of roadsIn(eye[0] - 2500, eye[2] - 2500, eye[0] + 2500, eye[2] + 2500)){
      const xs = r.xs, zs = r.zs, n = xs.length; if (n < 2) continue;
      const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(xs[k] - xs[k - 1], zs[k] - zs[k - 1]));
      const L = cum[n - 1]; if (L < 30) continue;
      let town = 0;
      for (let s = 17; s < L; s += 35){ const p = roadAt(xs, zs, cum, s); if (lifeCls(p[0], p[1]) !== 9) continue; town++; const y = terrH(p[0], p[1]); if (y > 0.5 && lamps.length < 4500) lamps.push(p[0], y + 6.5, p[1]); }
      const urb = town * 35 / L, k = Math.round(L / 1000 * (urb > 0.3 ? 6 : r.c <= 2 ? 0.6 : 0.15) + hash(cum[1] + xs[0]) - 0.5), rh = hash(xs[0] * 3.1 + zs[0]);
      for (let q = 0; q < k && cars.length < 400; q++) cars.push({xs, zs, cum, L, s0:hash(rh * 1e4 + q) * L, v:(r.c <= 2 ? 19 : 12) * (0.75 + 0.5 * hash(rh * 2e4 + q)) * (hash(rh * 3e4 + q) < 0.5 ? 1 : -1), col:Math.floor(hash(rh * 4e4 + q) * 5)});
    }
    LIFE.lamps = lamps; LIFE.cars = cars;
    // the bird cliffs within 7 km: their birds round anchors over the water in front of the cliff, 10-140 m up
    const cl = [];
    if (FUGL) for (const f of FUGL.f){ const q = P(f[1], f[2]), cx = q.x * 1000, cz = q.y * 1000; if (Math.hypot(cx - eye[0], cz - eye[2]) > 7000) continue;
      for (let k = 0, got = 0; k < f[3] * 3 && got < f[3]; k++){ const a = hash(cx + k * 1.3) * 6.28, d = 60 + 380 * hash(cz + k * 2.7), ax = cx + Math.cos(a) * d, az = cz + Math.sin(a) * d;
        if (terrH(ax, az) > -0.5) continue; got++; cl.push({x:ax, z:az, y:10 + 130 * hash(ax + k), r:20 + 70 * hash(az + k), w:(8 + 5 * hash(k * 9.1)) / (20 + 70 * hash(az + k)), ph:k * 0.77, dir:k % 2 ? 1 : -1}); } }
    LIFE.cliff = cl;
  }
  // the point s metres along a road
  function roadAt(xs, zs, cum, s){
    let lo = 0, hi = cum.length - 1; while (hi - lo > 1){ const m = (lo + hi) >> 1; if (cum[m] < s) lo = m; else hi = m; }
    const f = (s - cum[lo]) / Math.max(1e-3, cum[hi] - cum[lo]); return [xs[lo] + (xs[hi] - xs[lo]) * f, zs[lo] + (zs[hi] - zs[lo]) * f, Math.atan2(xs[hi] - xs[lo], -(zs[hi] - zs[lo]))];
  }
  function drawLife(eye, t, VP){
    if (!LIFE.on) return;
    const M = lifeModels(), now = performance.now() / 1000;
    // the porpoise and the whales from Blender (19-wildlife-npc.js draws them)
    if (M && WILDM && !WILDM.g9){ WILDM.porpoise = M.porpoise; WILDM.orca = M.orca; WILDM.humpback = M.humpback; WILDM.fluke = M.fluke; WILDM.g9 = 1; }
    if (now - LIFE.at > 6 || Math.hypot(eye[0] - LIFE.O[0], eye[2] - LIFE.O[1]) > 120) lifeBuild(eye, now);
    const day = env.day > 0.15, night = env.night > 0.3; let ne = 0, nc = 0, nd = 0, nh = 0, ncar = 0;
    if (M){
      litSetup(VP);
      // the eagles soar round, banking a little into the turn, never into the hillside
      if (day) for (const e of LIFE.eag){ const v = 11, a = t * v / e.r * e.dir + e.ph, x = e.x + Math.cos(a) * e.r, z = e.z + Math.sin(a) * e.r;
        if (Math.hypot(x - eye[0], z - eye[2]) > 4000) continue; const y = Math.max(e.y + 6 * Math.sin(t * 0.13 + e.ph), terrH(x, z) + 25);
        const hd = Math.atan2(-Math.sin(a) * e.dir, -Math.cos(a) * e.dir), Mx = model(x - eye[0], y - eye[1], z - eye[2], -hd, 0, -0.15 * e.dir);
        drawLit(M.havorn, Mx); drawLit(M.havorn_wR, Mx); drawLit(M.havorn_wL, Mx); ne++; }
      for (const c of LIFE.cor){ if (Math.hypot(c.x - eye[0], c.z - eye[2]) > 700) continue; drawLit(c.dry ? M.skarv_tork : M.skarv, model(c.x - eye[0], c.y - eye[1], c.z - eye[2], c.hd + 0.3 * Math.sin(t * 0.2 + c.hd), 0, 0)); nc++; }
      // the eiders ride the swell and drift round slowly
      for (const d of LIFE.eid){ const a = t * 0.03 + d.ph, x = d.x + Math.cos(a) * 3, z = d.z + Math.sin(a) * 3; if (Math.hypot(x - eye[0], z - eye[2]) > 700) continue;
        const y = seaH(x, z, t), sx = seaH(x + 0.4, z, t) - seaH(x - 0.4, z, t), sz = seaH(x, z + 0.4, t) - seaH(x, z - 0.4, t);
        drawLit(d.m ? M.ternM : M.ternF, model(x - eye[0], y - 0.04 - eye[1], z - eye[2], -(d.hd + a), -sz, sx)); nd++; }
      // the sheep graze, turning now and then
      for (const h of LIFE.shp){ if (Math.hypot(h.x - eye[0], h.z - eye[2]) > 900) continue; drawLit(h.dk ? M.sauM : M.sauK, model(h.x - eye[0], h.y - eye[1], h.z - eye[2], h.hd + 0.7 * Math.sin(t * 0.04 + h.ph), 0, 0)); nh++; }
      // the cars by day, within 1.5 km
      if (!night) for (const c of LIFE.cars){ let s = (c.s0 + t * c.v) % c.L; if (s < 0) s += c.L; const p = roadAt(c.xs, c.zs, c.cum, s), hd = p[2] + (c.v < 0 ? Math.PI : 0), ox = Math.cos(hd) * 1.8, oz = Math.sin(hd) * 1.8;
        const x = p[0] + ox, z = p[1] + oz; if (Math.hypot(x - eye[0], z - eye[2]) > 1500) continue; const y = terrH(x, z); if (y < 0.3) continue;
        drawLit(M.cars[c.col], model(x - eye[0], y - eye[1], z - eye[2], -hd, 0, 0)); ncar++; }
    }
    gl.enable(gl.BLEND); gl.depthMask(false); let n = 0;
    // the smoke from the chimneys in the cold: puffs rising and drifting with the wind, eight to a chimney, within 1.5 km
    n = 0;
    if ((env.temp || 0) < 5 && QUAL.lvl > 0){
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); const wx = env.windDir[0] * (env.wind || 0), wz = env.windDir[1] * (env.wind || 0), lift = 1.4 / (1 + (env.wind || 0) * 0.15), str = clamp((5 - env.temp) / 10, 0.3, 1);
      for (const c of CH.values()){ const sm = c.smk; if (!sm || Math.abs(c.o[0] + 500 - eye[0]) > 2000 || Math.abs(c.o[1] + 500 - eye[2]) > 2000) continue;
        for (let i = 0; i < sm.length && n < 3600; i += 3){ const dx = sm[i] - eye[0], dz = sm[i + 2] - eye[2]; if (dx * dx + dz * dz > 2.25e6) continue; const hh = hash(sm[i] + sm[i + 2]);
          for (let k = 0; k < 8; k++){ const a = (t / 18 + k / 8 + hh) % 1, s = a * 18; PB[n * 3] = dx + wx * s * 0.7 + Math.sin(s + hh * 9) * 0.4; PB[n * 3 + 1] = sm[i + 1] - eye[1] + lift * Math.pow(s, 0.8) * 2; PB[n * 3 + 2] = dz + wz * s * 0.7 + Math.cos(s + hh * 7) * 0.4; PA[n] = (1 - a) * 0.3 * str; n++; } } }
      const sc = [Math.min(1, env.amb[0] * 1.6 + env.sunCol[0] * 0.5), Math.min(1, env.amb[1] * 1.6 + env.sunCol[1] * 0.5), Math.min(1, env.amb[2] * 1.6 + env.sunCol[2] * 0.5)];
      if (n) drawPts(n, gl.POINTS, VP, sc, 1600, true);
    }
    LIFE.nSmoke = n;
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
    LIFE.nEag = ne; LIFE.nCor = nc; LIFE.nEid = nd; LIFE.nShp = nh; LIFE.nCar = ncar;
  }
  // the lights at night (street lights, the cars' lights) and the birds of the bird cliffs, as points: the far pass draws those beyond the
  // near pass's reach (lightNF), the near pass those within it
  function lifePts(VP, eye, t, far){
    if (!LIFE.on || LIFE.at < 0) return;
    const R2 = lightNF * lightNF, cut = (dx, dz) => { const d2 = dx * dx + dz * dz; return far ? d2 < R2 * 0.64 : d2 > R2; };
    const day = env.day > 0.15, night = env.night > 0.3; let n = 0, ncar = 0; if (!far){ LIFE.nLamp = 0; LIFE.nCliff = 0; }
    gl.enable(gl.BLEND); gl.depthMask(false);
    if (night){
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE); const A = Math.min(1, env.night * 1.2), Lm = LIFE.lamps;
      for (let i = 0; i < Lm.length && n < 4000; i += 3){ const dx = Lm[i] - eye[0], dz = Lm[i + 2] - eye[2]; if (dx * dx + dz * dz > 25e6 || cut(dx, dz)) continue; PB[n * 3] = dx; PB[n * 3 + 1] = Lm[i + 1] - eye[1]; PB[n * 3 + 2] = dz; PA[n] = A * 0.85; n++; }
      if (!far) LIFE.nLamp = n; if (n) drawPts(n, gl.POINTS, VP, [1, 0.86, 0.62], 900, true);
      // the cars' lights: two white ahead, two red behind, within 4 km
      let w = 0, r = 0; const RB = PFL;
      for (const c of LIFE.cars){ let s = (c.s0 + t * c.v) % c.L; if (s < 0) s += c.L; const p = roadAt(c.xs, c.zs, c.cum, s), hd = p[2] + (c.v < 0 ? Math.PI : 0), fx = Math.sin(hd), fz = -Math.cos(hd), rx = Math.cos(hd), rz = Math.sin(hd);
        const x = p[0] + rx * 1.8, z = p[1] + rz * 1.8; if (Math.hypot(x - eye[0], z - eye[2]) > 4000 || cut(x - eye[0], z - eye[2])) continue; const y = terrH(x, z) + 0.7 - eye[1]; if (y + eye[1] < 1) continue;
        for (const sd of [-0.65, 0.65]){ if (w < 1300){ PB[w * 3] = x + fx * 2.1 + rx * sd - eye[0]; PB[w * 3 + 1] = y; PB[w * 3 + 2] = z + fz * 2.1 + rz * sd - eye[2]; PA[w] = A; w++; }
          if (r < 1300){ RB[r * 3] = x - fx * 2.1 + rx * sd - eye[0]; RB[r * 3 + 1] = y; RB[r * 3 + 2] = z - fz * 2.1 + rz * sd - eye[2]; r++; } } ncar += 1; }
      if (!far) LIFE.nCar = ncar;   // (at night the cars are their lights)
      if (w) drawPts(w, gl.POINTS, VP, [1, 0.95, 0.85], 500, true);
      if (r){ PB.set(RB.subarray(0, r * 3)); for (let i = 0; i < r; i++) PA[i] = A * 0.8; drawPts(r, gl.POINTS, VP, LCOL.r, 300, true); }
    }
    // the birds of the bird cliffs: small and white, wheeling in front of the cliff, by day
    n = 0;
    if (day && LIFE.cliff.length){ gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      for (const b of LIFE.cliff){ const a = t * b.w * b.dir + b.ph, x = b.x + Math.cos(a) * b.r, z = b.z + Math.sin(a) * b.r; const dx = x - eye[0], dz = z - eye[2]; if (dx * dx + dz * dz > 49e6 || n >= 4000 || cut(dx, dz)) continue;
        PB[n * 3] = dx; PB[n * 3 + 1] = b.y + 3 * Math.sin(t * 0.5 + b.ph) - eye[1]; PB[n * 3 + 2] = dz; PA[n] = 0.95; n++; }
      if (n) drawPts(n, gl.POINTS, VP, [0.95, 0.95, 0.93], 450, true); }
    if (!far) LIFE.nCliff = n;
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
  }
