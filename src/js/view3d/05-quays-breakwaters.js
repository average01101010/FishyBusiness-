  // ---------- villages and quays ----------
  // the coast's receivers (06b-coastports.js) are built only within 40 km of the boat: their packs are only loaded there
  const nearHere = (x, z, km = 40) => !S || !S.boat ? true : Math.hypot(x / 1000 - S.boat.pos.x, z / 1000 - S.boat.pos.y) < km;
  const portHere = pt => !pt.coastal || nearHere(pt.p.x * 1000, pt.p.y * 1000);
  // a sea mark [x, y (km), type, category] (SEAMARKS, 01-world.js; the coast's in 01e-marks.js): lighthouses, lights, beacons and buoys
  // a lighthouse of the register (core FYR, Kystposten's pictures, 09g-turer.js): a round tower, white with a red band under the
  // gallery, the dark gallery with its rail, the lantern's glass and a red roof. The lantern stands where the light shines (lightY: its
  // height over the sea), so the tower is as tall as that over the ground; the coast's box tower is left out where one stands
  const fyrNear = (x, z) => typeof FYR !== 'undefined' && FYR && FYR.some(f => Math.abs(f[0] * 1000 - x) < 80 && Math.abs(f[1] * 1000 - z) < 80);
  function fyrInto(m, f){
    const x = f[0] * 1000, z = f[1] * 1000, g = Math.max(terrH(x, z), 0.2), Ht = Math.max(2.5, Math.min(40, lightY(f, x, z) - g - 1.45)), N = 16;
    const W = [0.93, 0.92, 0.88], R = [0.72, 0.12, 0.09], D = [0.2, 0.22, 0.23], GL = [0.42, 0.5, 0.5], RF = [0.6, 0.1, 0.08];
    const ring = (r, y) => { const a = []; for (let j = 0; j <= N; j++){ const an = j / N * Math.PI * 2; a.push([x + Math.cos(an) * r, g + y, z + Math.sin(an) * r]); } return a; };
    const band = (r0, y0, r1, y1, k) => { const A = ring(r0, y0), B = ring(r1, y1); for (let j = 0; j < N; j++) m.quad(A[j], A[j + 1], B[j + 1], B[j], k); };
    const cap = (r, y, k) => { const A = ring(r, y), c = [x, g + y, z]; for (let j = 0; j < N; j++) m.tri(c, A[j], A[j + 1], k); };
    const rb = 1.7 + Ht * 0.05, rt = rb * 0.72, rAt = y => rb + (rt - rb) * y / Ht;
    band(rb + 0.25, -2, rb, 0, W); band(rb, 0, rAt(Ht * 0.6), Ht * 0.6, W); band(rAt(Ht * 0.6), Ht * 0.6, rAt(Ht * 0.84), Ht * 0.84, R); band(rAt(Ht * 0.84), Ht * 0.84, rt, Ht, W);
    // the gallery: a dark deck wider than the tower, with a rail
    band(rt, Ht, rt + 0.7, Ht + 0.05, D); band(rt + 0.7, Ht + 0.05, rt + 0.7, Ht + 0.3, D); cap(rt + 0.7, Ht + 0.3, D);
    band(rt + 0.66, Ht + 0.3, rt + 0.66, Ht + 1.25, [0.28, 0.3, 0.31]);
    // the lantern and its roof
    const rl = Math.max(1, rt * 0.62); band(rl, Ht + 0.3, rl, Ht + 0.6, D); band(rl, Ht + 0.6, rl, Ht + 2.3, GL); band(rl, Ht + 2.3, rl + 0.15, Ht + 2.45, D);
    band(rl + 0.15, Ht + 2.45, 0.18, Ht + 3.5, RF); band(0.18, Ht + 3.5, 0.12, Ht + 3.9, D); cap(0.12, Ht + 3.9, D);
  }
  function markInto(m, mk, tag){
    const x = mk[0] * 1000, z = mk[1] * 1000, base = Math.max(terrH(x, z), 0.2), ty = mk[2], cat = mk[3];
    if (ty === 'M' && fyrNear(x, z)) return;
    if (ty === 'M'){ camSolid(x, z, 3.6, 3.6, 0.3, base, base + 15.4, tag); m.box(x, base, z, 3.4, 11, 3.4, [0.95, 0.95, 0.93], 0.3); m.box(x, base + 11, z, 3.6, 2.2, 3.6, [0.75, 0.1, 0.08], 0.3); m.box(x, base + 13.2, z, 2.2, 2.2, 2.2, [0.9, 0.92, 0.9], 0.3, [0.2, 0.2, 0.22]); }
    else if (ty === 'm' || ty === 'P'){ m.box(x, base, z, 0.9, 4.2, 0.9, [0.94, 0.94, 0.92], 0); m.box(x, base + 4.2, z, 1.1, 0.9, 1.1, [0.8, 0.12, 0.1], 0); }
    else if (ty === 'D'){ m.box(x, base, z, 0.5, 4.5, 0.5, [0.08, 0.08, 0.08], 0); m.box(x, base + 2.2, z, 0.56, 0.9, 0.56, [0.75, 0.1, 0.08], 0); }
    else if (ty === 'L'){ m.box(x, base, z, 0.45, 4, 0.45, cat === 'starb' ? [0.1, 0.55, 0.2] : [0.8, 0.12, 0.08], 0); }
    else if (ty === 'B'){ m.box(x, -0.6, z, 1.1, 2.1, 1.1, cat === 'starb' ? [0.1, 0.55, 0.2] : [0.8, 0.12, 0.08], 0.5); }
    else if (ty === 'C'){ m.box(x, -0.6, z, 1.1, 1.1, 1.1, [0.08, 0.08, 0.08], 0.5); m.box(x, 0.5, z, 1.1, 1.1, 1.1, [0.95, 0.8, 0.1], 0.5); }
    else if (ty === 'S'){ m.box(x, base, z, 0.5, 3.5, 0.5, [0.95, 0.8, 0.1], 0); }
    else if (ty === 'K'){ m.box(x, base, z, 1.8, 2.6, 1.8, [0.85, 0.85, 0.83], 0.4, [0.8, 0.8, 0.78]); }
  }
  // the coast's sea marks (01e-marks.js): a mesh a tile, built when its marks and its ground are in
  const MKM = new Map(); let MKV = -1;
  function marksStatics(){
    if (MKV === MARKS.ver) return; let all = true; const T = MAPD.man ? MAPD.man.tile * 1000 : 50000;
    const Tk = T / 1000, fyrIn = t => typeof FYR !== 'undefined' && FYR ? FYR.filter(f => Math.floor(f[0] / Tk) === t.tx && Math.floor(f[1] / Tk) === t.ty && !inSenja(f[0], f[1])) : [];
    for (const t of MARKS.tiles.values()){
      if (!t || MKM.has(t.k)) continue; const fy = fyrIn(t); if (!t.marks.length && !fy.length) continue;
      const vp = MAPD.byTile.get('view:' + t.k); if (vp && !vp.buf){ all = false; continue; }
      const m = MB(); for (const mk of t.marks) markInto(m, mk, 'mk' + t.k); for (const f of fy) fyrInto(m, f); MKM.set(t.k, m.p.length ? m.mesh([(t.tx + 0.5) * T, (t.ty + 0.5) * T]) : null);
    }
    if (all) MKV = MARKS.ver;
  }
  function buildStatics(){
    const m = MB(), R = rng(7), WALLS = [[0.62,0.18,0.14],[0.88,0.88,0.84],[0.85,0.68,0.3],[0.76,0.46,0.22],[0.5,0.56,0.6],[0.88,0.88,0.84]], ROOF = [[0.18,0.2,0.22],[0.3,0.2,0.18],[0.22,0.26,0.3]];
    LIGHTS = [];
    // piers, quays and breakwaters from OpenStreetMap, as listed in PIERBOX (the berths use the same boxes); the breakwaters as rubble
    // mounds, those a harbour unit has not taken
    for (const q of PIERBOX){ if (q.quay && q.quay[0] === 'm' && !nearHere(q.x, q.z)) continue; pierInto(m, q); }
    const bwLeft = new Set(PIERBOX.filter(q => q.bw).map(q => q.src));
    PIERS.forEach((pr, i) => { if (pr[0] === 1 && bwLeft.has(i)) stonesOf(STONES, sm => moundInto(m, Array.from({length:(pr.length - 1) / 2}, (_, k) => [pr[1 + k * 2] * 1000, pr[2 + k * 2] * 1000]), i * 7919 + 13, true, undefined, sm)); });
    // bridges from OpenStreetMap
    for (const br of BRIDGES) if (!bridgeUnderUnit(br, onSite)) bridgeInto(m, br);
    // lighthouses, lights, beacons and buoys
    for (const mk of SEAMARKS.marks) markInto(m, mk);
    if (typeof FYR !== 'undefined' && FYR) for (const f of FYR) if (inSenja(f[0], f[1])) fyrInto(m, f);   // the register's lighthouses in Senja's square
    for (const pt of PORTS){
      if (pt.coastal) continue;
      const px = pt.p.x * 1000, pz = pt.p.y * 1000, cx = pt.coast.x * 1000, cz = pt.coast.y * 1000;
      const dxp = cx - px, dzp = cz - pz, L = Math.hypot(dxp, dzp), ux = dxp / L, uz = dzp / L, ang = Math.atan2(ux, uz);
      // quay from the shore out to the berth
      const bx = cx + ux * 45, bz = cz + uz * 45, bh = Math.max(0, terrH(bx, bz));
      if (BLD) continue;
      if (pt.mottak) m.box(bx, bh - 1, bz, 42, 11, 24, [0.78, 0.82, 0.84], ang + Math.PI / 2, [0.35, 0.42, 0.48]);
      else m.box(bx, bh - 1, bz, 26, 7, 14, [0.66, 0.24, 0.18], ang + Math.PI / 2, [0.25, 0.25, 0.27]);
      const count = pt.home ? 170 : 40, rad = pt.home ? 2600 : 1300;
      let placed = 0;
      for (let tries = 0; tries < count * 25 && placed < count; tries++){
        const a = R() * Math.PI * 2, r = 60 + Math.sqrt(R()) * rad, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        if (!isLand({x:x / 1000, y:z / 1000})) continue;
        const y = terrH(x, z); if (y < 2 || y > 70) continue;
        if (Math.abs(terrH(x + 10, z) - y) > 4 || Math.abs(terrH(x, z + 10) - y) > 4) continue;
        const w = 6 + R() * 4, l = 8 + R() * 5, hg = 4.5 + R() * 2.5;
        m.house(x, y - 1, z, w, l, hg, ang + (R() - 0.5) * 0.5 + (R() < 0.5 ? 0 : Math.PI / 2), WALLS[Math.floor(R() * WALLS.length)], ROOF[Math.floor(R() * ROOF.length)]);
        if (R() < 0.7) LIGHTS.push(x, y + 3, z);
        placed++;
      }
    }
    STAT = m.mesh(mapMid());
  }
  // a pier, a quay's deck or a breakwater's box: its camera solid, and the box itself (a breakwater is drawn by moundInto); tag marks
  // what a tile of the coast's packs built (tileStatics), so it can go with the tile
  function pierInto(m, q, tag){
    if (q.closed && q.src !== undefined && tag !== undefined) return;   // a pack's area pier: slabInto, in its shape
    camSolid(q.x, q.z, q.w, q.l, q.ang, -3, q.bw ? 3.2 : QTOP, tag);
    if (q.bw) return;
    const ux = Math.sin(q.ang), uz = Math.cos(q.ang), vx = Math.cos(q.ang), vz = -Math.sin(q.ang);
    if (q.closed || q.made){
      // G10: the wall in bands, green slime under mean sea level, the dark wet stripe of the tide over it, the concrete (a quay's
      // stone fill a little warmer) up to the deck
      const wall = q.made ? [0.52, 0.53, 0.5] : [0.5, 0.49, 0.46], top = q.made ? [0.6, 0.6, 0.58] : [0.6, 0.58, 0.54], y0 = q.made ? -3 : -2.4;
      m.box(q.x, y0, q.z, q.w, 0.2 - y0, q.l, WALL_SLIME, q.ang); m.box(q.x, 0.2, q.z, q.w, 1.0, q.l, mix3(wall, WALL_WET, 0.6), q.ang); m.box(q.x, 1.2, q.z, q.w, QTOP - 1.2, q.l, wall, q.ang, top);
      // the fittings along each side that has the sea off it
      const hl = q.l / 2, hw = q.w / 2;
      for (const [cx, cz, nx, nz, L, ax, az] of [[q.x + vx * hw, q.z + vz * hw, vx, vz, q.l, ux, uz], [q.x - vx * hw, q.z - vz * hw, -vx, -vz, q.l, -ux, -uz], [q.x + ux * hl, q.z + uz * hl, ux, uz, q.w, -vx, -vz], [q.x - ux * hl, q.z - uz * hl, -ux, -uz, q.w, vx, vz]])
        if (L >= 6 && seaOff(cx, cz, nx, nz, L, ax, az)) quayFit(m, cx - ax * L / 2, cz - az * L / 2, ax, az, nx, nz, L);
    } else {
      // a timber pier (one mapped as a line, not floating): the plank deck on piles every 3 m along both sides (and the middle when wide)
      m.box(q.x, QTOP - 0.35, q.z, q.w, 0.35, q.l, [0.3, 0.24, 0.18], q.ang, [0.46, 0.4, 0.32]);
      const cols = q.w > 5 ? [-1, 0, 1] : [-1, 1], np = Math.max(2, Math.round(q.l / 3) + 1);
      for (let k = 0; k < np; k++){ const a = -q.l / 2 + 0.4 + (q.l - 0.8) * k / (np - 1);
        for (const c of cols){ const o = c * (q.w / 2 - 0.25); m.box(q.x + ux * a + vx * o, -3, q.z + uz * a + vz * o, 0.3, QTOP - 0.35 + 3, 0.3, k % 2 ? [0.2, 0.17, 0.13] : [0.24, 0.2, 0.15], q.ang); } }
    }
  }
  const WALL_SLIME = [0.17, 0.2, 0.14], WALL_WET = [0.22, 0.22, 0.21];
  // is the sea off this side (its middle and its quarters, 3 m out)?
  function seaOff(cx, cz, nx, nz, L, ax, az){ for (const f of [-0.3, 0, 0.3]) if (terrRaw(cx + ax * L * f + nx * 3, cz + az * L * f + nz * 3) > -0.3) return false; return true; }
  // G10: a quay side's fittings from (x, z) along (ax, az) for L m, the sea along (nx, nz): two timber fender beams, tyres each 6 m,
  // bollards each 12 m set back on the deck, a ladder each 35 m down into the water, and the yellow edge
  function quayFit(m, x, z, ax, az, nx, nz, L){
    const ang = Math.atan2(ax, az), at = (s, o) => [x + ax * s + nx * o, z + az * s + nz * o], mid = at(L / 2, 0.12);
    m.box(mid[0], QTOP - 1.45, mid[1], 0.22, 0.3, L, [0.24, 0.18, 0.12], ang); m.box(mid[0], QTOP - 0.65, mid[1], 0.22, 0.28, L, [0.26, 0.2, 0.13], ang);
    const e = at(L / 2, -0.18); m.box(e[0], QTOP, e[1], 0.36, 0.03, L, [0.86, 0.7, 0.12], ang);
    for (let s = 3; s < L - 1; s += 6){ const p = at(s, 0.36); m.box(p[0], QTOP - 1.75, p[1], 0.28, 0.85, 0.85, [0.07, 0.07, 0.08], ang); }
    for (let s = 2.5; s < L - 1; s += 12){ const p = at(s, -0.75); m.box(p[0], QTOP, p[1], 0.36, 0.5, 0.36, [0.14, 0.15, 0.16], ang); m.box(p[0], QTOP + 0.5, p[1], 0.5, 0.08, 0.5, [0.14, 0.15, 0.16], ang); }
    if (L > 10) for (let s = Math.min(17, L / 2); s < L - 2; s += 35){ const G = [0.6, 0.62, 0.64];
      for (const sd of [-0.23, 0.23]){ const p = at(s + sd, 0.1); m.box(p[0], -1.3, p[1], 0.06, QTOP + 2.2, 0.06, G, ang); }
      for (let y = -1.1; y < QTOP; y += 0.3){ const p = at(s, 0.1); m.box(p[0], y, p[1], 0.05, 0.04, 0.46, G, ang); } }
  }
  // a pier mapped as an area, in its shape (its bounding box, as Senja's small ones are drawn, lay over the water at a big quay in
  // Bergen): the deck in strips a metre deep, each cut where the outline crosses its middle, the walls down the outline's edges; the
  // camera's solids in strips 4 m deep
  // cut(x, z): where the deck is left out (a harbour unit's quay or a site over part of it: 09.10.2026 the slab under the tackle shop at
  // Hammerfest was drawn at the quay's own height, in saw teeth through its deck); the runs are cut in 2 m pieces there
  function slabInto(m, pts, tag, cut){
    const n = pts.length; let z0 = 1e18, z1 = -1e18; for (const [, z] of pts){ z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const top = [0.6, 0.58, 0.54], side = [0.5, 0.49, 0.46], runs = (z, f) => { const xs = []; for (let k = 0; k < n - 1; k++){ const az = pts[k][1], bz = pts[k + 1][1]; if ((az > z) !== (bz > z)) xs.push(pts[k][0] + (z - az) * (pts[k + 1][0] - pts[k][0]) / (bz - az)); } xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2){ const a = xs[q], b = xs[q + 1]; if (!cut){ f(a, b); continue; }
        const k = Math.max(1, Math.ceil((b - a) / 2)), d = (b - a) / k; let s0 = null;
        for (let i = 0; i <= k; i++){ const off = i === k || cut(a + (i + 0.5) * d, z); if (off){ if (s0 !== null){ f(a + s0 * d, a + i * d); s0 = null; } } else if (s0 === null) s0 = i; } } };
    for (let z = z0; z < z1; z += 1){ const z2 = Math.min(z1, z + 1); runs((z + z2) / 2, (a, b) => m.quad([a, QTOP, z], [b, QTOP, z], [b, QTOP, z2], [a, QTOP, z2], top)); }
    for (let k = 0; k < n - 1; k++){ const [ax, az] = pts[k], [bx, bz] = pts[k + 1]; if (Math.hypot(bx - ax, bz - az) < 0.2 || (cut && cut((ax + bx) / 2, (az + bz) / 2))) continue; m.quad([ax, -2.4, az], [bx, -2.4, bz], [bx, 0.2, bz], [ax, 0.2, az], WALL_SLIME); m.quad([ax, 0.2, az], [bx, 0.2, bz], [bx, 1.2, bz], [ax, 1.2, az], mix3(side, WALL_WET, 0.6)); m.quad([ax, 1.2, az], [bx, 1.2, bz], [bx, QTOP, bz], [ax, QTOP, az], side);
      // G10: the fittings along an edge with the sea off it (either way round the outline)
      const L = Math.hypot(bx - ax, bz - az), ex = (bx - ax) / L, ez = (bz - az) / L;
      if (L >= 6){ for (const sd of [1, -1]){ const nx = -ez * sd, nz = ex * sd; if (seaOff((ax + bx) / 2, (az + bz) / 2, nx, nz, L, ex, ez)){ quayFit(m, ax, az, ex, ez, nx, nz, L); break; } } } }
    for (let z = z0; z < z1; z += 4){ const z2 = Math.min(z1, z + 4); runs((z + z2) / 2, (a, b) => camSolid((a + b) / 2, (z + z2) / 2, b - a, z2 - z, 0, -3, QTOP, tag)); }
  }
  // a road bridge [class, length, name, type, x, z, ...]: the deck rises from its ends to a clearance by its length (Tromsøbrua, 1046 m,
  // about 38 m; the longest 42 m). The deck is one smooth band over cross-sections every 8 m (it was boxes 18 m long, each level, which
  // climbed like a stair: the user 03.10.2026): the road on top, the edge beams and the railings along its sides, and under it a box
  // girder narrower than the deck, deeper the longer the bridge; a pier every 70 m where the deck is more than 3 m over the ground or
  // the sea. The camera's solids stay boxes every 18 m.
  const BRC = {road:[0.3, 0.31, 0.33], edge:[0.7, 0.7, 0.67], under:[0.5, 0.5, 0.48], rail:[0.82, 0.84, 0.84], pier:[0.62, 0.62, 0.59]};
  function bridgeInto(m, br, tag){
    const cls = br[0], L = br[1], n = (br.length - 4) / 2, X = k => br[4 + k * 2], Z = k => br[5 + k * 2];
    const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(X(k) - X(k - 1), Z(k) - Z(k - 1)));
    const tot = cum[n - 1] || 1, hA = Math.max(terrH(X(0), Z(0)), 1), hB = Math.max(terrH(X(n - 1), Z(n - 1)), 1);
    const clear = L < 60 ? 0 : clamp(tot * 0.036, 6, 42), wdt = [9, 8.5, 7.5, 7, 5][cls] || 7, hw = wdt / 2, gd = clamp(L / 450, 1.1, 2.6), gw = hw * 0.55;
    const yAt = s => { const u = s / tot; return hA + (hB - hA) * u + clear * Math.pow(Math.sin(Math.PI * u), 0.55); };
    // the cross-sections: along each leg every 8 m or less; at a bend the section is turned half way (a mitre)
    const C = [];
    for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), dx = X(k + 1) - ax, dz = Z(k + 1) - az, segL = Math.hypot(dx, dz) || 1e-6, steps = Math.max(1, Math.ceil(segL / 8));
      for (let q = k ? 1 : 0; q <= steps; q++){ const u = q / steps; C.push({x:ax + dx * u, z:az + dz * u, s:cum[k] + segL * u, ux:dx / segL, uz:dz / segL}); }
    }
    for (let i = 1; i < C.length - 1; i++){ const a = C[i - 1], c = C[i + 1]; if (Math.abs(a.ux - c.ux) + Math.abs(a.uz - c.uz) > 1e-6){ const mx = (C[i].ux + c.ux) / 2, mz = (C[i].uz + c.uz) / 2, l = Math.hypot(mx, mz) || 1; C[i].ux = mx / l; C[i].uz = mz / l; } }
    const at = (c, o, dy) => [c.x + c.uz * o, c.y + dy, c.z - c.ux * o];
    for (const c of C) c.y = yAt(c.s);
    for (let i = 0; i < C.length - 1; i++){
      const a = C[i], c = C[i + 1];
      m.quad(at(a, hw, 0), at(a, -hw, 0), at(c, -hw, 0), at(c, hw, 0), BRC.road);
      for (const sd of [1, -1]){
        const o = sd * (hw + 0.15), g = sd * gw;
        m.quad(at(a, o, 0.25), at(c, o, 0.25), at(c, o, -0.55), at(a, o, -0.55), BRC.edge);                  // the edge beam
        m.quad(at(a, sd * (hw - 0.15), 0.25), at(c, sd * (hw - 0.15), 0.25), at(c, o, 0.25), at(a, o, 0.25), BRC.edge);
        m.quad(at(a, o, -0.55), at(c, o, -0.55), at(c, g, -0.55), at(a, g, -0.55), BRC.under);                  // the slab's underside
        m.quad(at(a, g, -0.55), at(c, g, -0.55), at(c, g, -gd), at(a, g, -gd), BRC.edge);                       // the girder's side
        m.quad(at(a, sd * (hw - 0.05), 0.25), at(c, sd * (hw - 0.05), 0.25), at(c, sd * (hw - 0.05), 1.15), at(a, sd * (hw - 0.05), 1.15), BRC.rail);   // the railing
      }
      m.quad(at(a, gw, -gd), at(c, gw, -gd), at(c, -gw, -gd), at(a, -gw, -gd), BRC.under);
    }
    // the camera's solids and the piers, every 18 m and 70 m as before
    for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), bx2 = X(k + 1), bz2 = Z(k + 1), segL = Math.hypot(bx2 - ax, bz2 - az), steps = Math.max(1, Math.ceil(segL / 18));
      for (let q = 0; q < steps; q++){
        const u0 = q / steps, u1 = (q + 1) / steps, x0 = ax + (bx2 - ax) * u0, z0 = az + (bz2 - az) * u0, x1 = ax + (bx2 - ax) * u1, z1 = az + (bz2 - az) * u1;
        const s0 = cum[k] + segL * u0, s1 = cum[k] + segL * u1, ym = (yAt(s0) + yAt(s1)) / 2, len = Math.hypot(x1 - x0, z1 - z0) + 0.4, ang = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        camSolid(cx, cz, wdt + 0.6, len, ang, ym - gd, ym + 1.2, tag);
        if (Math.floor(s0 / 70) !== Math.floor(s1 / 70) || (q === 0 && k === 0)){
          const gy = terrH(cx, cz), top = ym - gd; if (top - gy > 3){ const bot = Math.min(gy, 0) - 4, pw = Math.min(gw * 1.6, 5); m.box(cx, bot, cz, pw, top - bot, 3, BRC.pier, ang); camSolid(cx, cz, pw, 3, ang, bot, top, tag); }
        }
      }
    }
  }
  // ---------- breakwaters (the user's wish 03.10.2026: they shelter the boats at the quays, and should look it) ----------
  // A rubble mound as a height field over the mapped shape: an outline is taken as the waterline, a line as the middle of a mound 16 m
  // wide there. The crest stands about 2.8 m over mean sea level, over the highest tide (TIDE_C), flat and gravelled, for most
  // breakwaters carry a road on top (the user 03.10.2026: Husøy's does; addRoads lays a road over a crest, moundTop); the sides fall
  // 1 : 1.4 to 6 m under, grey above, dark and weedy in the tidal zone, with armour stones loose on them. Any shape: a bend, an L, a
  // round head. The ground it is built from (terrH over it) and a harbour unit (unit) are left.
  // a stone: a box sx by sy by sz (centre of its foot at x, y, z) with its corners pushed in and out by up to a quarter of its size, turned
  // about the vertical and tipped up to 25 degrees, so no two lie alike and none is a block
  function rockInto(m, x, y, z, sx, sy, sz, seed, k){
    const ry = hash(seed) * Math.PI * 2, tx = (hash(seed + 1) - 0.5) * 0.9, tz = (hash(seed + 2) - 0.5) * 0.9, cr = Math.cos(ry), sr = Math.sin(ry), ca = Math.cos(tx), sa = Math.sin(tx), cb = Math.cos(tz), sb = Math.sin(tz);
    const V = [];
    for (let q = 0; q < 8; q++){
      const u = (q & 1 ? 0.5 : -0.5) * sx * (0.75 + 0.5 * hash(seed + 3 + q)), w = (q & 4 ? 0.5 : -0.5) * sz * (0.75 + 0.5 * hash(seed + 11 + q)), h = (q & 2 ? 1 : 0) * sy * (0.7 + 0.6 * hash(seed + 19 + q)) - sy * 0.15;
      const y1 = h * ca - w * sa, w1 = h * sa + w * ca, u1 = u * cb - y1 * sb, y2 = u * sb + y1 * cb;
      V.push([x + u1 * cr + w1 * sr, y + y2, z - u1 * sr + w1 * cr]);
    }
    const d = k.map(c => c * 0.8);
    m.quad(V[0], V[1], V[3], V[2], d); m.quad(V[4], V[6], V[7], V[5], d); m.quad(V[0], V[2], V[6], V[4], d); m.quad(V[1], V[5], V[7], V[3], d);
    m.quad(V[2], V[3], V[7], V[6], k);   // the top; the foot is under the ground
  }
  const MOLO = {g:2, slope:1 / 1.4, crest:2.8, foot:-6, half:8};
  // the crests the roads lie on: each mound's height field under the km cells it covers (tag as camSolid's)
  const MOLOH = new Map();
  function moundTop(x, z){
    const a = MOLOH.get(gridKey(Math.floor(x / 1000), Math.floor(z / 1000))); if (!a) return -1e9; let best = -1e9;
    for (const M of a){
      const fx = (x - M.x0) / M.g, fz = (z - M.z0) / M.g; if (fx < 0 || fz < 0 || fx >= M.nx - 1 || fz >= M.nz - 1) continue;
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, k = j * M.nx + i, H = M.H;
      best = Math.max(best, (H[k] * (1 - u) + H[k + 1] * u) * (1 - w) + (H[k + M.nx] * (1 - u) + H[k + M.nx + 1] * u) * w);
    }
    return best;
  }
  function moundInto(m, pts, seed, unit, tag, sm){
    const n = pts.length; if (n < 2) return 0;
    const closed = n > 3 && Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]) < 1;
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of pts){ x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    const E = MOLO.half + (MOLO.crest - MOLO.foot) / MOLO.slope; x0 -= E; z0 -= E; x1 += E; z1 += E;
    let g = MOLO.g; const area = (x1 - x0) * (z1 - z0); if (area / (g * g) > 90000) g = Math.sqrt(area / 90000);
    const nx = Math.ceil((x1 - x0) / g) + 1, nz = Math.ceil((z1 - z0) / g) + 1, H = new Float32Array(nx * nz);
    // the signed distance to the shape (m; positive inside the outline, or within MOLO.half of the line) on the grid: the outline filled
    // row by row (or the line drawn), then a two-pass chamfer distance (1 and 1.41 cells; a few per cent off, which the rock's noise
    // hides): a 600 m breakwater is a few milliseconds, not the hundreds a distance to every edge from every point took
    const N = nx * nz, IN = new Uint8Array(N);
    if (closed) for (let j = 0; j < nz; j++){
      const z = z0 + j * g, xs = [];
      for (let k = 0; k < n - 1; k++){ const az = pts[k][1], bz = pts[k + 1][1]; if ((az > z) !== (bz > z)) xs.push(pts[k][0] + (z - az) * (pts[k + 1][0] - pts[k][0]) / (bz - az)); }
      xs.sort((p, q) => p - q);
      for (let q = 0; q + 1 < xs.length; q += 2) for (let i = Math.max(0, Math.ceil((xs[q] - x0) / g)); i <= Math.min(nx - 1, Math.floor((xs[q + 1] - x0) / g)); i++) IN[j * nx + i] = 1;
    } else for (let k = 0; k < n - 1; k++){
      const ax = pts[k][0], az = pts[k][1], dx = pts[k + 1][0] - ax, dz = pts[k + 1][1] - az, st = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (g / 2)));
      for (let q = 0; q <= st; q++){ const i = Math.round((ax + dx * q / st - x0) / g), j = Math.round((az + dz * q / st - z0) / g); if (i >= 0 && j >= 0 && i < nx && j < nz) IN[j * nx + i] = 1; }
    }
    const dist = want => {
      const D = new Float32Array(N), d2 = g * Math.SQRT2; for (let i = 0; i < N; i++) D[i] = IN[i] === want ? 0 : 1e9;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){ const a = j * nx + i; let v = D[a]; if (i) v = Math.min(v, D[a - 1] + g); if (j){ v = Math.min(v, D[a - nx] + g); if (i) v = Math.min(v, D[a - nx - 1] + d2); if (i < nx - 1) v = Math.min(v, D[a - nx + 1] + d2); } D[a] = v; }
      for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--){ const a = j * nx + i; let v = D[a]; if (i < nx - 1) v = Math.min(v, D[a + 1] + g); if (j < nz - 1){ v = Math.min(v, D[a + nx] + g); if (i < nx - 1) v = Math.min(v, D[a + nx + 1] + d2); if (i) v = Math.min(v, D[a + nx - 1] + d2); } D[a] = v; }
      return D;
    };
    const Dto = dist(1), Dout = closed ? dist(0) : null;
    const sdAt = a => closed ? (IN[a] ? Dout[a] - g / 2 : -(Dto[a] - g / 2)) : MOLO.half - Dto[a];
    const cr = MOLO.crest + 0.4 * (hash(seed) - 0.5);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      // the crest flat; the slopes rough, the more so the further below it
      const x = x0 + i * g, z = z0 + j * g, a = j * nx + i, h = Math.max(MOLO.foot, Math.min(cr, sdAt(a) * MOLO.slope)), f = clamp((cr - h) / 0.8, 0, 1);
      H[a] = h > -1.5 ? h + f * (0.5 * (noise2(x / 2.4, z / 2.4, 53) - 0.5) + 0.25 * (noise2(x / 0.9, z / 0.9, 59) - 0.5)) : h;
    }
    const rec = {x0, z0, g, nx, nz, H, tag, cells:[]};
    for (let gz = Math.floor(z0 / 1000); gz <= Math.floor((z0 + nz * g) / 1000); gz++) for (let gx = Math.floor(x0 / 1000); gx <= Math.floor((x0 + nx * g) / 1000); gx++){ const k = gridKey(gx, gz); let l = MOLOH.get(k); if (!l) MOLOH.set(k, l = []); l.push(rec); rec.cells.push(k); }
    const ROCK = [0.43, 0.43, 0.41], LICHEN = [0.5, 0.5, 0.42], WET = [0.2, 0.19, 0.16], WEED = [0.23, 0.21, 0.1], DEEP = [0.16, 0.19, 0.17], GRAVEL = [0.53, 0.51, 0.47];
    // the cells to draw: none deeper than 1.6 m (the water hides them), none on the ground it is built from or a harbour unit; the flat
    // crest in one strip a row (the triangles were 135 000 for Senja's breakwaters, and SwiftShader's frames could not keep up)
    let tris = 0;
    for (let j = 0; j < nz - 1; j++){
      let run = -1;
      const flush = i => { if (run < 0) return; const z = z0 + j * g, xa = x0 + run * g, xb = x0 + i * g; m.quad([xa, cr, z], [xb, cr, z], [xb, cr, z + g], [xa, cr, z + g], GRAVEL.map(c => c * (0.94 + 0.08 * hash(seed + j * 13 + run)))); tris += 2; run = -1; };
      for (let i = 0; i < nx - 1; i++){
        const a = j * nx + i, h00 = H[a], h10 = H[a + 1], h01 = H[a + nx], h11 = H[a + nx + 1], hm = (h00 + h10 + h01 + h11) / 4;
        const x = x0 + i * g, z = z0 + j * g, cx = x + g / 2, cz = z + g / 2;
        if (Math.max(h00, h10, h01, h11) < -1.6 || terrH(cx, cz) > hm + 0.3 || (unit && onUnit(cx, cz, 1))){ flush(i); continue; }
        if (Math.min(h00, h10, h01, h11) > cr - 0.02){ if (run < 0) run = i; continue; }
        flush(i);
        const r = hash(seed + j * 7919 + i * 104729), v = 0.82 + 0.3 * r;
        const k = hm > 1.0 ? (r > 0.9 ? LICHEN : ROCK) : hm > -0.5 ? mix3(WET, WEED, hash(seed + j * 31 + i * 17)) : DEEP;
        m.quad([x, h00, z], [x + g, h10, z], [x + g, h11, z + g], [x, h01, z + g], k.map(c => c * v)); tris += 2;
        // armour stones, half sunk and tipped, on the slopes (the crest is the road's)
        if (hm > 0.2 && hm < cr - 0.45 && (i + 2 * j) % 3 === 0 && r < 0.4){
        const b = 0.9 + 1.5 * hash(seed + a * 3 + 1), ox = (hash(seed + a * 7 + 3) - 0.5) * g * 1.4, oz = (hash(seed + a * 11 + 4) - 0.5) * g * 1.4;
        rockInto(sm || m, cx + ox, hm - b * 0.18, cz + oz, b, b * (0.55 + 0.3 * hash(seed + a * 13 + 5)), b * (0.7 + 0.5 * hash(seed + a * 19 + 7)), seed + a * 23, ROCK.map(c => c * (0.72 + 0.36 * hash(seed + a * 17 + 6)))); tris += 10;
        }
      }
      flush(nx - 1);
    }
    return tris;
  }


  // ---------- harbour fittings along the berth faces: tyres hung on chains, a timber fender beam, the yellow edge and bollards ----------
  let STATN = null; const QB = {};
  function obox(nb, c, u, n, len, wid, y0, h, k){   // an oriented box: centre c (x, z), length along u, width along n
    const P = (a, b, y) => [c[0] + u[0] * a + n[0] * b, y, c[1] + u[1] * a + n[1] * b], l = len / 2, w = wid / 2, y1 = y0 + h;
    nb.quad(P(-l, w, y0), P(l, w, y0), P(l, w, y1), P(-l, w, y1), k); nb.quad(P(l, -w, y0), P(-l, -w, y0), P(-l, -w, y1), P(l, -w, y1), k);
    nb.quad(P(-l, -w, y1), P(-l, w, y1), P(l, w, y1), P(l, -w, y1), k); nb.quad(P(-l, -w, y0), P(-l, -w, y1), P(-l, w, y1), P(-l, w, y0), k); nb.quad(P(l, w, y0), P(l, w, y1), P(l, -w, y1), P(l, -w, y0), k);
  }
  const faceKey = f => Math.round(f.x) + ',' + Math.round(f.z);
  function buildHarbourFittings(){
    const nb = NB(), TYRE = [0.07, 0.07, 0.08, 0.05], CHAIN = [0.55, 0.56, 0.58, 0.6], BOLL = [0.12, 0.13, 0.14, 0.4], WOOD = [0.36, 0.26, 0.18, 0.1], YEL = [0.95, 0.78, 0.1, 0.2];
    const done = new Set();
    for (const pt of PORTS) for (const kind of ['main', 'bunker']) for (const ty of Object.keys(BEAM)){
      if (!portHere(pt)) continue; const bp = berthPose(pt.id, ty, kind); if (!bp) continue; const f = bp.face, key = faceKey(f); if (done.has(key)) continue; done.add(key);
      if (f.unit){ const M = unitModel(UNITS[f.unit].v); if (M) QB[key] = M.A.bollards.map(q => { const w = unitW(UNITS[f.unit], q[0], q[2]); return {x:w[0], z:w[1], a:(w[0] - f.x) * f.ux + (w[1] - f.z) * f.uz}; }); continue; }
      const u = [f.ux, f.uz], n = [f.nx, f.nz], a0 = Math.max(-f.hl + 1, bp.a - 30), a1 = Math.min(f.hl - 1, bp.a + 30), am = (a0 + a1) / 2, len = a1 - a0;
      const at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o];
      obox(nb, at(am, 0.1), u, n, len, 0.2, QTOP - 1.5, 0.35, WOOD); obox(nb, at(am, 0.1), u, n, len, 0.2, QTOP - 0.55, 0.3, WOOD);
      obox(nb, at(am, -0.2), u, n, len, 0.4, QTOP, 0.03, YEL);
      for (let a = a0 + 1.3; a < a1 - 0.5; a += 2.6){
        const c = at(a, 0.34), cy = QTOP - 1.05, ring = [];
        for (let i = 0; i <= 12; i++){ const an = i / 12 * Math.PI * 2; ring.push([c[0] + u[0] * Math.cos(an) * 0.4, cy + Math.sin(an) * 0.4, c[1] + u[1] * Math.cos(an) * 0.4]); }
        nb.tube(ring, 0.12, TYRE, 6);
        for (const sd of [-1, 1]){ const top = at(a + sd * 0.35, 0.02); nb.tube([[top[0], QTOP - 0.05, top[1]], [c[0] + u[0] * sd * 0.12, cy + 0.5, c[1] + u[1] * sd * 0.12]], 0.018, CHAIN, 4); }
      }
      const bl = QB[key] = [];
      for (let a = a0 + 2; a < a1; a += 8){
        const c = at(a, -0.55); nb.tube([[c[0], QTOP, c[1]], [c[0], QTOP + 0.45, c[1]]], 0.16, BOLL, 10); nb.tube([[c[0], QTOP + 0.45, c[1]], [c[0], QTOP + 0.52, c[1]]], 0.24, BOLL, 10);
        bl.push({x:c[0], z:c[1], a});
      }
    }
    STATN = nb.mesh(mapMid());
  }
