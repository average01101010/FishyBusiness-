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
  // The marks after IALA region A (Ø13 K3, docs/systemer/sjofart-og-lover.md 9.3): the colours and the topmarks a skipper reads them
  // by. A lateral mark red to port with a can (cylinder) on top, green to starboard with a cone; the cardinals black and yellow in
  // bands after the quadrant with two black cones (north both up, east base to base, south both down, west point to point); isolated
  // danger black with a red band and two black balls; safe water red and white upright stripes and one red ball; a special mark yellow
  // with a yellow cross. The topmarks are a few triangles each (a six-sided cone 12, a ball 8): about 30 a mark where they stand
  const MK_K = [0.07, 0.07, 0.07], MK_Y = [0.95, 0.78, 0.08], MK_R = [0.8, 0.12, 0.08], MK_G = [0.1, 0.55, 0.2], MK_W = [0.93, 0.93, 0.9];
  // a cone (six sides, with its base) from y to y + h, the point up (h > 0) or down (h < 0)
  function coneInto(m, x, y, z, r, h, k){
    const N = 6, tip = [x, y + h, z], A = [];
    for (let j = 0; j <= N; j++){ const a = j / N * Math.PI * 2; A.push([x + Math.cos(a) * r, y, z + Math.sin(a) * r]); }
    for (let j = 0; j < N; j++){ m.tri(A[j], A[j + 1], tip, k); m.tri([x, y, z], A[j + 1], A[j], k); }
  }
  // a low ball: two four-sided pyramids base to base (8 triangles)
  function ballInto(m, x, y, z, r, k){
    const E = [[x + r, y, z], [x, y, z + r], [x - r, y, z], [x, y, z - r]], T = [x, y + r, z], B = [x, y - r, z];
    for (let j = 0; j < 4; j++){ m.tri(E[j], E[(j + 1) % 4], T, k); m.tri(E[(j + 1) % 4], E[j], B, k); }
  }
  // an upright prism of n sides from y0 to y1, side j coloured k(j): the safe water mark's stripes
  function prismInto(m, x, y0, z, r, y1, n, k){
    for (let j = 0; j < n; j++){ const a = j / n * Math.PI * 2, b = (j + 1) / n * Math.PI * 2, c = k(j);
      m.quad([x + Math.cos(a) * r, y0, z + Math.sin(a) * r], [x + Math.cos(b) * r, y0, z + Math.sin(b) * r], [x + Math.cos(b) * r, y1, z + Math.sin(b) * r], [x + Math.cos(a) * r, y1, z + Math.sin(a) * r], c);
      m.tri([x, y1, z], [x + Math.cos(a) * r, y1, z + Math.sin(a) * r], [x + Math.cos(b) * r, y1, z + Math.sin(b) * r], c); }
  }
  // the arrow (viser) on top of a stake: a flat pointer across the rod, its point at the bearing deg (true; the frame's north is turned
  // by gridGamma, sjomerker.py gives sann), so it points to the safe water as the source has it. 4 triangles
  const MK_I = [0.16, 0.15, 0.14];
  function arrowInto(m, x, y, z, deg, k){
    if (m.trace) m.trace.push(m.p.length);
    const a = (deg - (typeof gridGamma === 'function' ? gridGamma({x:x / 1000, y:z / 1000}) : 0)) * Math.PI / 180, ux = Math.sin(a), uz = -Math.cos(a), L = 0.75, w = 0.18, hy = 0.12;
    const lx = -uz, lz = ux, at = (f, s, dy) => [x + ux * f + lx * s, y + dy, z + uz * f + lz * s], tip = at(L, 0, 0);
    // a flat head (two triangles, both faces) and the shaft as a thin upright plate from the tail to the head
    m.tri(at(L * 0.35, w, 0), tip, at(L * 0.35, -w, 0), k); m.tri(at(L * 0.35, -w, 0), tip, at(L * 0.35, w, 0), k);
    m.quad(at(-L * 0.5, 0, -hy), at(L * 0.35, 0, -hy), at(L * 0.35, 0, hy), at(-L * 0.5, 0, hy), k);
  }
  // the reflector figure on a fixed lateral mark: a square (port) or a triangle point up (starboard) on a short stalk, as two crossed
  // plates so it reads from every side (4 or 8 triangles)
  function figInto(m, x, y, z, square, k){
    if (m.trace) m.trace.push(m.p.length);
    const s = 0.28, b = y + 0.15; m.box(x, y, z, 0.08, 0.15, 0.08, MK_K, 0);
    for (const [ux, uz] of [[1, 0], [0, 1]]){
      const P = (u, v) => [x + ux * u, b + v, z + uz * u];
      if (square) m.quad(P(-s, 0), P(s, 0), P(s, 2 * s), P(-s, 2 * s), k);
      else m.tri(P(-s, 0), P(s, 0), P(0, 2 * s), k);
    }
  }
  // a body in horizontal bands, bottom first (a box of w across from y0 to y1)
  function bandsInto(m, x, y0, z, w, y1, ks){ const h = (y1 - y0) / ks.length; ks.forEach((k, i) => m.box(x, y0 + i * h, z, w, h, w, k, 0)); }
  // the topmark over y: two cones for the cardinals, a cylinder or a cone for the laterals, balls, a cross
  const MK_CARD = {north:[MK_Y, MK_K], east:[MK_K, MK_Y, MK_K], south:[MK_K, MK_Y], west:[MK_Y, MK_K, MK_Y]};   // the bands, bottom first (north: black over yellow)
  function topInto(m, x, y, z, s, kind){
    const r = 0.32 * s, h = 0.55 * s, st = 0.08 * s; if (m.trace) m.trace.push(m.p.length);   // (tests/marktest.py: where the topmark starts)
    m.box(x, y, z, st, 0.25 * s, st, MK_K, 0);   // the stalk
    const b = y + 0.25 * s;
    if (kind === 'north'){ coneInto(m, x, b, z, r, h, MK_K); coneInto(m, x, b + h + 0.08 * s, z, r, h, MK_K); }
    else if (kind === 'south'){ coneInto(m, x, b + h, z, r, -h, MK_K); coneInto(m, x, b + 2 * h + 0.08 * s, z, r, -h, MK_K); }
    else if (kind === 'east'){ coneInto(m, x, b + h, z, r, -h, MK_K); coneInto(m, x, b + h + 0.08 * s, z, r, h, MK_K); }
    else if (kind === 'west'){ coneInto(m, x, b, z, r, h, MK_K); coneInto(m, x, b + 2 * h + 0.08 * s, z, r, -h, MK_K); }
    else if (kind === 'port') m.box(x, b, z, 0.5 * s, 0.55 * s, 0.5 * s, MK_R, 0);
    else if (kind === 'starb') coneInto(m, x, b, z, r, h, MK_G);
    else if (kind === 'isol'){ ballInto(m, x, b + r, z, r, MK_K); ballInto(m, x, b + 3 * r + 0.06 * s, z, r, MK_K); }
    else if (kind === 'safe') ballInto(m, x, b + r, z, r, MK_R);
    else if (kind === 'spec'){ const c = b + 0.35 * s, d = 0.3 * s; m.beam([x - d, c - d, z], [x + d, c + d, z], 0.05 * s, MK_Y); m.beam([x - d, c + d, z], [x + d, c - d, z], 0.05 * s, MK_Y); }
  }
  function markInto(m, mk, tag, solid = true){
    const x = mk[0] * 1000, z = mk[1] * 1000, base = Math.max(terrH(x, z), 0.2), ty = mk[2], cat = mk[3];
    if (ty === 'M' && fyrNear(x, z)) return;
    if (terrH(x, z) < 0.5 && markOnBridge(mk)) return;   // hung on a bridge, no post in the water (core/11b-obstacles.js)
    if (ty === 'M'){ if (solid) camSolid(x, z, 3.6, 3.6, 0.3, base, base + 15.4, tag); m.box(x, base, z, 3.4, 11, 3.4, [0.95, 0.95, 0.93], 0.3); m.box(x, base + 11, z, 3.6, 2.2, 3.6, [0.75, 0.1, 0.08], 0.3); m.box(x, base + 13.2, z, 2.2, 2.2, 2.2, [0.9, 0.92, 0.9], 0.3, [0.2, 0.2, 0.22]); }
    else if (ty === 'm' || ty === 'P'){ m.box(x, base, z, 0.9, 4.2, 0.9, [0.94, 0.94, 0.92], 0); m.box(x, base + 4.2, z, 1.1, 0.9, 1.1, [0.8, 0.12, 0.1], 0); }
    // Norway's stakes and beacons that are no IALA mark (D, sjomerker.py): the iron rod (jernstang) with its arrow (viser) towards the
    // navigable water where the data has one (Kystverket, «Fritidsbåt: nyttige tjenester», and SNL «sjømerker»), a ball on some; the towers as cairns, white; the lattice beacons as a thicker dark rod
    else if (ty === 'D'){
      if (cat === 'tower'){ m.box(x, base, z, 1.6, 3.4, 1.6, [0.9, 0.9, 0.87], 0.4, [0.82, 0.82, 0.8]); if (mk[4] != null) arrowInto(m, x, base + 3.4, z, mk[4], MK_W); }
      else { const w = cat === 'lattice' ? 0.7 : 0.18, h = cat === 'lattice' ? 5 : 4.5; m.box(x, base, z, w, h, w, MK_I, 0);
        if (mk[4] != null) arrowInto(m, x, base + h, z, mk[4], MK_I); else if (cat === 'ball') ballInto(m, x, base + h + 0.3, z, 0.3, MK_K); } }
    // a lateral mark without a side in the data (the inland waterways' white ones, a few with no colour): white, no topmark, never red
    // a fixed lateral mark as Kystverket sets them («Retningslinjer for utforming, tekniske krav til og plassering av
    // navigasjonsinnretninger», 2.2, s. 10): white with a red band to port and a green one to starboard, the reflector figure on top a
    // red square to port and a green triangle to starboard (the topmarks, can and cone, are the floating marks')
    else if (ty === 'L'){ const k = cat === 'starb' ? MK_G : cat === 'port' ? MK_R : MK_W; if (k === MK_W) m.box(x, base, z, 0.45, 4, 0.45, MK_W, 0); else { m.box(x, base, z, 0.45, 2.4, 0.45, MK_W, 0); m.box(x, base + 2.4, z, 0.45, 1, 0.45, k, 0); m.box(x, base + 3.4, z, 0.45, 0.6, 0.45, MK_W, 0); }
      if (mk[4] != null) arrowInto(m, x, base + 4, z, mk[4], k); else if (cat === 'port' || cat === 'starb') figInto(m, x, base + 4, z, cat === 'port', k); }
    else if (ty === 'B'){ const k = cat === 'starb' ? MK_G : cat === 'port' ? MK_R : MK_W; m.box(x, -0.6, z, 1.1, 2.1, 1.1, k, 0.5); if (cat === 'port' || cat === 'starb') topInto(m, x, 1.5, z, 1, cat); }
    else if (ty === 'C'){ const ks = MK_CARD[cat] || [MK_Y]; bandsInto(m, x, -0.6, z, 1.1, 1.8, ks); m.box(x, 1.8, z, 0.12, 0.5, 0.12, MK_K, 0); if (MK_CARD[cat]) topInto(m, x, 2.3, z, 1.2, cat); }
    else if (ty === 'S'){ const ks = MK_CARD[cat] || [MK_Y]; bandsInto(m, x, base, z, 0.5, base + 3.5, ks); if (MK_CARD[cat]) topInto(m, x, base + 3.5, z, 1, cat); }
    else if (ty === 'I'){ bandsInto(m, x, -0.6, z, 1.1, 1.8, [MK_K, MK_R, MK_K]); m.box(x, 1.8, z, 0.12, 0.5, 0.12, MK_K, 0); topInto(m, x, 2.3, z, 1.2, 'isol'); }
    else if (ty === 'i'){ bandsInto(m, x, base, z, 0.5, base + 3.5, [MK_K, MK_R, MK_K]); topInto(m, x, base + 3.5, z, 1, 'isol'); }
    else if (ty === 'A'){ prismInto(m, x, -0.6, z, 0.65, 1.6, 8, j => j % 2 ? MK_W : MK_R); m.box(x, 1.6, z, 0.12, 0.5, 0.12, MK_K, 0); topInto(m, x, 2.1, z, 1.2, 'safe'); }
    else if (ty === 'a'){ prismInto(m, x, base, z, 0.3, base + 3.5, 6, j => j % 2 ? MK_W : MK_R); topInto(m, x, base + 3.5, z, 1, 'safe'); }
    // a special mark buoy in its colour (yellow; some white or red ones in the data: moorings, measuring buoys), round where the data says
    // spherical (the bathing places' summer buoys), with the cross on top where it has one
    else if (ty === 'Y'){ const c = cat || 'y', k = c[0] === 'w' ? MK_W : c[0] === 'r' ? MK_R : MK_Y;
      if (c.includes('s')) ballInto(m, x, 0.15, z, 0.65, k); else m.box(x, -0.6, z, 1.1, 2.1, 1.1, k, 0.5);
      if (c.includes('x')) topInto(m, x, c.includes('s') ? 0.75 : 1.5, z, 1, 'spec'); }
    else if (ty === 'y'){ m.box(x, base, z, 0.45, 3.5, 0.45, MK_Y, 0); topInto(m, x, base + 3.5, z, 1, 'spec'); }
    else if (ty === 'K'){ m.box(x, base, z, 1.8, 2.6, 1.8, [0.85, 0.85, 0.83], 0.4, [0.8, 0.8, 0.78]); }
  }
  // the coast's sea marks (01e-marks.js): a mesh a tile, built when its marks and its ground are in
  // Senja's embedded marks (SEAMARKS) a mesh of their own, built again when a tile's data has corrected some of them (01e-marks.js
  // marksSenja; Ø13 K3); before K3 they were part of the quays' mesh (buildStatics), built once
  const MKM = new Map(), MKB = new Set(); let MKV = -1, MKS = -1;
  // a tile's marks built before its bridges came (the vec pack decoded later) are built again when they come, without those on a deck
  VEC.came.push(t => { if (!t.bridges.length || !MKM.has(t.k) || MKB.has(t.k)) return; const old = MKM.get(t.k); if (old) freeMesh(old); MKM.delete(t.k); MKV = -1; });
  function marksStatics(){
    if (STAT && MKS !== MARKS.senja){ const old = MKM.get('senja'); if (old) freeMesh(old); const m = MB(); for (const mk of SEAMARKS.marks) markInto(m, mk, 'mkS', MKS < 0); MKM.set('senja', m.p.length ? m.mesh(mapMid()) : null); MKS = MARKS.senja; }
    if (MKV === MARKS.ver) return; let all = true; const T = MAPD.man ? MAPD.man.tile * 1000 : 50000;
    const Tk = T / 1000, fyrIn = t => typeof FYR !== 'undefined' && FYR ? FYR.filter(f => Math.floor(f[0] / Tk) === t.tx && Math.floor(f[1] / Tk) === t.ty && !inSenja(f[0], f[1])) : [];
    for (const t of MARKS.tiles.values()){
      if (!t || MKM.has(t.k)) continue; const fy = fyrIn(t); if (!t.marks.length && !fy.length) continue;
      const vp = MAPD.byTile.get('view:' + t.k); if (vp && !vp.buf){ all = false; continue; }
      if (VEC.tiles.has(t.k)) MKB.add(t.k); const m = MB(); for (const mk of t.marks) markInto(m, mk, 'mk' + t.k); for (const f of fy) fyrInto(m, f); MKM.set(t.k, m.p.length ? m.mesh([(t.tx + 0.5) * T, (t.ty + 0.5) * T]) : null);
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
    // (Senja's lighthouses, lights, beacons and buoys: marksStatics, a mesh of their own since Ø13 K3)
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
        if (L >= 6 && seaOff(cx, cz, nx, nz, L, ax, az)) fitAdd(tag, {q:1, x:cx - ax * L / 2, z:cz - az * L / 2, ax, az, nx, nz, L});
    } else {
      // a timber pier (one mapped as a line, not floating): the plank deck on piles every 3 m along both sides (and the middle when wide)
      m.box(q.x, QTOP - 0.35, q.z, q.w, 0.35, q.l, [0.3, 0.24, 0.18], q.ang, [0.46, 0.4, 0.32]);
      fitAdd(tag, {q:0, x:q.x, z:q.z, w:q.w, l:q.l, ang:q.ang});
    }
  }
  // the timber pier's piles (the near fittings build them): every 3 m along both sides, and the middle when wide
  function pierPiles(m, q){
    const ux = Math.sin(q.ang), uz = Math.cos(q.ang), vx = Math.cos(q.ang), vz = -Math.sin(q.ang), cols = q.w > 5 ? [-1, 0, 1] : [-1, 1], np = Math.max(2, Math.round(q.l / 3) + 1);
    for (let k = 0; k < np; k++){ const a = -q.l / 2 + 0.4 + (q.l - 0.8) * k / (np - 1);
      for (const c of cols){ const o = c * (q.w / 2 - 0.25); m.box(q.x + ux * a + vx * o, -3, q.z + uz * a + vz * o, 0.3, QTOP - 0.35 + 3, 0.3, k % 2 ? [0.2, 0.17, 0.13] : [0.24, 0.2, 0.15], q.ang); } }
  }
  // G10's fittings are many (a city's quays run for tens of kilometres): the tile only notes where they go (fitAdd, by the tile's
  // tag), and the near fittings (drawFits) build them within FIT_R of the eye, again when it has moved a fifth of that
  const FITS = new Map(), FIT = {m:null, at:[1e9, 1e9], t:0, n:0, ver:0, v:-1}, FIT_R = 700;
  function fitAdd(tag, f){ if (tag === undefined) tag = '_'; let a = FITS.get(tag); if (!a) FITS.set(tag, a = []); a.push(f); FIT.ver++; }   // ('_': Senja's own piers)
  function fitDrop(tag){ if (FITS.delete(tag)) FIT.ver++; }
  function drawFits(eye, VP){
    const now = performance.now();
    if (Math.hypot(eye[0] - FIT.at[0], eye[2] - FIT.at[1]) > FIT_R / 5 || (FIT.v !== FIT.ver && now - FIT.t > 2000)){
      if (FIT.m) freeMesh(FIT.m); FIT.m = null; FIT.at = [eye[0], eye[2]]; FIT.t = now; FIT.v = FIT.ver; const m = MB(); let n = 0;
      for (const a of FITS.values()) for (const f of a){ if (Math.abs(f.x - eye[0]) > FIT_R + 60 || Math.abs(f.z - eye[2]) > FIT_R + 60 || n > 1500) continue;
        if (f.q) quayFit(m, f.x, f.z, f.ax, f.az, f.nx, f.nz, f.L); else pierPiles(m, f); n++; }
      FIT.n = n; if (m.p.length) FIT.m = m.mesh([Math.round(eye[0]), Math.round(eye[2])]);
    }
    if (FIT.m){ litSetup(VP); drawLit(FIT.m); }
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
      if (L >= 6){ for (const sd of [1, -1]){ const nx = -ez * sd, nz = ex * sd; if (seaOff((ax + bx) / 2, (az + bz) / 2, nx, nz, L, ex, ez)){ fitAdd(tag, {q:1, x:ax, z:az, ax:ex, az:ez, nx, nz, L}); break; } } } }
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
