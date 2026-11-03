  // ---------- real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor ----------
  let BLD = null, chunkSnow = -1;
  const CH = new Map();
  // the buildings of a 1 km cell: Senja's embedded ones (BLD) and those of the coast's pack for its tile (01c-vec.js), each with its
  // own arrays; a building's look is hashed from its index and the source's seed (Senja's 0, as before)
  function bldCells(key){
    const out = [], a = BLD && BLD.cells.get(key); if (a) out.push([BLD, a]);
    const T = MAPD.man ? MAPD.man.tile : 50, t = vecTile(Math.floor(gridKeyX(key) / T), Math.floor(gridKeyY(key) / T));
    if (t && t.bld){ const b = vecBldIn(t, key); if (b && b.length) out.push([t.bld, b]); }
    return out;
  }
  // a pack's buildings in a km cell, without those where a harbour unit, a quay strip or a site stands (as Senja's are left out at
  // load): the map's real plant at Kjøllefjord stood over the unit's quay, a wall the boat lay against (06.10.2026). Kept per tile.
  function vecBldIn(t, key){
    const c = t.bldOk || (t.bldOk = new Map()); let r = c.get(key); if (r) return r;
    const b = t.bld.cells.get(key); r = b ? b.filter(i => !bldOnUnit(t.bld, i)) : []; c.set(key, r); return r;
  }
  async function loadBuildings(){
    const el = document.getElementById('bld');
    if (!el || typeof DecompressionStream === 'undefined') return null;
    const n = +el.dataset.n, U = +el.dataset.u, bytes = b64bytes(el.textContent.trim());
    const raw = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const X = new Uint16Array(raw.buffer, 0, n), Y = new Uint16Array(raw.buffer, 2 * n, n), Lq = raw.subarray(4 * n, 5 * n), Wq = raw.subarray(5 * n, 6 * n), Aq = raw.subarray(6 * n, 7 * n), Tq = raw.subarray(7 * n, 8 * n);
    const dec = q => q <= 160 ? q * 0.5 : 80 + (q - 160) * 2;
    const B = {n, x:new Float64Array(n), z:new Float64Array(n), l:new Float32Array(n), w:new Float32Array(n), a:new Float32Array(n), t:new Uint8Array(n), lv:new Uint8Array(n), cells:new Map(), seed:0};
    for (let i = 0; i < n; i++){
      // stored in the legacy frame (metres): into the national frame, turned with it (LGrot, about -gamma)
      const lx = X[i] * U, lz = Y[i] * U, q = LGm([lx, lz]);
      B.x[i] = q[0]; B.z[i] = q[1]; B.l[i] = dec(Lq[i]); B.w[i] = Math.max(1.5, dec(Wq[i])); B.a[i] = Aq[i] / 256 * Math.PI + LGrot(lx / 1000, lz / 1000); B.t[i] = Tq[i] & 15; B.lv[i] = Tq[i] >> 4;
      const k = gridKey(Math.floor(B.x[i] / 1000), Math.floor(B.z[i] / 1000));
      if (bldOnUnit(B, i)) continue;   // a harbour unit stands there
      let c = B.cells.get(k); if (!c) B.cells.set(k, c = []); c.push(i);
    }
    return B;
  }
  // the quays in QUAYS without a harbour unit (Finnsnes, Frovåg): a mapped building on the deck or out over the berth goes, so the boat
  // does not lie inside it (Jonas 05.10.2026); the strip runs 8 m past the face's ends, from 8 m behind the deck out to 30 m over the water
  let QSTRIP = null;
  function onQuayStrip(x, z){
    if (!QSTRIP) QSTRIP = Object.keys(QUAYS).flatMap(pid => UNITS[pid] ? [] : Object.keys(QUAYS[pid]).map(k => quayFace(pid, k))).filter(Boolean);
    for (const f of QSTRIP){ const dx = x - f.x, dz = z - f.z, u = dx * f.ux + dz * f.uz, v = dx * f.nx + dz * f.nz; if (Math.abs(u) <= f.hl + 8 && v >= -(f.depth + 8) && v <= 30) return true; }
    return false;
  }
  function bldOnUnit(B, i){ const ca = Math.cos(B.a[i]), sa = Math.sin(B.a[i]), nu = Math.ceil(B.l[i] / 3), nv = Math.ceil(B.w[i] / 3);
    for (let p = 0; p <= nu; p++) for (let q = 0; q <= nv; q++){ const u = p / nu - 0.5, v = q / nv - 0.5; if (onQuayStrip(B.x[i] + ca * u * B.l[i] - sa * v * B.w[i], B.z[i] + sa * u * B.l[i] + ca * v * B.w[i]) || onSite(B.x[i] + ca * u * B.l[i] - sa * v * B.w[i], B.z[i] + sa * u * B.l[i] + ca * v * B.w[i])) return true; if (onUnit(B.x[i] + ca * u * B.l[i] - sa * v * B.w[i], B.z[i] + sa * u * B.l[i] + ca * v * B.w[i], 3)) return true; } return false; }
  const PAL_HOUSE = [[0.9,0.9,0.87],[0.9,0.9,0.87],[0.62,0.18,0.14],[0.87,0.72,0.35],[0.78,0.52,0.25],[0.72,0.74,0.73],[0.6,0.7,0.78],[0.55,0.62,0.52],[0.9,0.9,0.87]];
  const PAL_CABIN = [[0.33,0.25,0.19],[0.55,0.17,0.13],[0.36,0.3,0.24],[0.78,0.52,0.25],[0.2,0.18,0.16]];
  const PAL_NAUST = [[0.62,0.17,0.13],[0.58,0.16,0.12],[0.55,0.34,0.2],[0.3,0.23,0.18],[0.88,0.88,0.85]];
  const PAL_BARN = [[0.6,0.16,0.12],[0.6,0.16,0.12],[0.6,0.6,0.6],[0.88,0.88,0.85]];
  const PAL_IND = [[0.78,0.8,0.8],[0.55,0.62,0.68],[0.88,0.88,0.86],[0.6,0.68,0.62]];
  const PAL_TOWN = [[0.8,0.8,0.78],[0.9,0.9,0.88],[0.86,0.8,0.62],[0.6,0.3,0.24]];
  const ROOFS = [[0.2,0.21,0.23],[0.14,0.14,0.15],[0.42,0.2,0.15],[0.24,0.25,0.27]], SOD = [0.34,0.4,0.24], SNOW = [0.92,0.94,0.96];
  // type: 0 other, 1 house, 2 apartments, 3 garage, 4 cabin, 5 boathouse, 6 barn, 7 shed, 8 industrial, 9 commercial, 10 civic, 11 church, 12 bunker, 13 greenhouse, 14 service, 15 ruin
  const FRAME = [0.93, 0.93, 0.9], BGLASS = [0.1, 0.13, 0.16], WARM = [1, 0.78, 0.42], DOORS = [[0.3,0.2,0.14],[0.2,0.3,0.24],[0.55,0.15,0.12],[0.9,0.9,0.88],[0.22,0.28,0.4]];
  function buildChunk(key, detail){
    const srcs = bldCells(key), c = {mesh:null, lights:null, nl:0, detail, dm:null, gd:null, gl:null};
    const m = MB(), L = [], SMK = [], snowy = chunkSnow % 10 === 1, D = detail ? MB() : null, GD = detail ? MB() : null, GLm = detail ? MB() : null;
    for (const [B, idx] of srcs) for (const j of idx){
      const i = j + B.seed, x = B.x[j], z = B.z[j], l = B.l[j], w = B.w[j], ty = B.t[j], lv = B.lv[j], ry = Math.PI / 2 - B.a[j], hsh = hash(i * 7 + 3);
      const ca = Math.cos(B.a[j]), sa = Math.sin(B.a[j]);
      let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(x + ca * u * l - sa * v * w, z + sa * u * l + ca * v * w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const base = Math.max(lo, 0.3) - 0.5, rise = Math.max(0, hi - base);
      const pick = arr => arr[Math.floor(hsh * arr.length) % arr.length];
      let wall, roof = pick(ROOFS), hg, gable = true, pitch = 0.38, cap = 6, light = 0;
      switch (ty){
        case 1: wall = pick(PAL_HOUSE); hg = lv ? 2.7 * lv + 0.6 : 4.6 + hsh * 1.4; light = 0.75; break;
        case 2: wall = pick(PAL_TOWN); hg = (lv || 3) * 3; gable = false; light = 0.9; break;
        case 3: wall = pick(PAL_HOUSE); hg = 2.6; pitch = 0.22; cap = 2; break;
        case 4: wall = pick(PAL_CABIN); hg = 2.9; if (hsh > 0.7) roof = SOD; light = 0.15; break;
        case 5: wall = pick(PAL_NAUST); hg = 3.1; pitch = 0.45; break;
        case 6: wall = pick(PAL_BARN); hg = lv ? 3 * lv : 5.2; pitch = 0.4; cap = 7; break;
        case 7: wall = pick(PAL_HOUSE); hg = 2.3; pitch = 0.3; cap = 2; break;
        case 8: wall = pick(PAL_IND); hg = lv ? 4 * lv : 7.5; gable = false; light = 0.3; break;
        case 9: wall = pick(PAL_TOWN); hg = (lv || 2) * 3.4; gable = false; light = 0.8; break;
        case 10: wall = pick(PAL_TOWN); hg = (lv || 2) * 3.4; gable = w < 14; light = 0.6; break;
        case 11: wall = [0.92, 0.92, 0.9]; hg = 7; pitch = 0.6; cap = 9; roof = [0.2, 0.22, 0.25]; light = 0.5; break;
        case 12: wall = [0.55, 0.56, 0.55]; hg = 1.8; gable = false; break;
        case 13: wall = [0.75, 0.85, 0.84]; hg = 2.6; break;
        case 14: wall = [0.6, 0.62, 0.62]; hg = 2.5; gable = false; break;
        case 15: wall = [0.5, 0.48, 0.45]; hg = 1.2; gable = false; break;
        default: wall = pick(PAL_HOUSE); hg = lv ? 2.8 * lv : 3.6; light = 0.3;
      }
      // a chimney on some of the houses and cabins, for the smoke in the cold (G9, 17e-life.js)
      if ((ty === 1 || ty === 4) && hash(i * 13 + 5) < 0.4) SMK.push(x + ca * l * 0.22, base + rise + hg + pitch * w * 0.5 + 0.7, z + sa * l * 0.22);
      if (snowy) roof = mix3(roof, SNOW, 0.85);
      const H = hg + rise;
      if (gable) m.house(x, base, z, w, l, H, ry, wall, roof, pitch, cap); else m.box(x, base, z, w, H, l, wall, ry, roof);
      if (ty === 11){ const e = l / 2 - Math.min(3, l / 4); m.box(x + ca * e, base, z + sa * e, Math.min(4, w * 0.5), H + 6, Math.min(4, w * 0.5), wall, ry); m.spire(x + ca * e, base + H + 6, z + sa * e, Math.min(2.2, w * 0.28), 9, roof); }
      const lit = light && hash(i * 13 + 5) < light;
      if (!detail){ if (lit) L.push(x, base + Math.min(H, 9) * 0.55, z); continue; }
      // ---- details: chimney, windows, doors (only close to the boat)
      const floor = base + rise + 0.45, roofH = gable ? Math.min(w * pitch, cap) : 0;
      if ((ty === 1 || ty === 4) && hash(i * 5 + 1) < 0.75){ const e = (hash(i * 3 + 7) - 0.5) * l * 0.5; m.box(x + ca * e + sa * w * 0.12, base + H, z + sa * e - ca * w * 0.12, 0.7, roofH * 0.75 + 1.1, 0.7, hash(i) < 0.5 ? [0.42, 0.2, 0.16] : [0.32, 0.33, 0.34], ry); }
      const wins = (along, half, nx, nz, ux, uz, rows, ww, wh, gap, doorSlot) => {
        const n = Math.max(1, Math.min(16, Math.floor((along - 1.2) / gap)));
        for (let r = 0; r < rows.length; r++) for (let k = 0; k < n; k++){
          const t = (k + 0.5) / n - 0.5, px = x + nx * (half + 0.05) + ux * t * (along - 1.4), pz = z + nz * (half + 0.05) + uz * t * (along - 1.4);
          if (r === 0 && k === doorSlot){ D.panel(px, floor + 1.05, pz, ux, uz, 1.05, 2.1, DOORS[Math.floor(hash(i * 17) * DOORS.length) % DOORS.length]); continue; }
          D.panel(px, rows[r], pz, ux, uz, ww + 0.26, wh + 0.26, FRAME);
          const g = lit && hash(i * 31 + r * 7 + k) < 0.7 ? GLm : GD;
          g.panel(px + nx * 0.03, rows[r], pz + nz * 0.03, ux, uz, ww, wh, g === GLm ? WARM : BGLASS);
        }
      };
      const flo = H - rise, rowsFor = (per, first) => { const r = []; for (let y = first; y < flo - 0.9 && r.length < 12; y += per) r.push(floor + y); return r; };
      const bx = -sa, bz = ca, dside = hash(i * 19) < 0.5 ? 1 : -1;
      if (ty === 1 || ty === 0 || ty === 4 || ty === 11){
        const cab = ty === 4, ch = ty === 11, rows = ch ? [floor + 2.6] : rowsFor(2.7, 1.25), ww = cab ? 0.9 : ch ? 1.1 : 1.0, wh = cab ? 1.0 : ch ? 2.6 : 1.25;
        wins(l, w / 2, bx * dside, bz * dside, ca, sa, rows, ww, wh, ch ? 3.2 : 2.8, ch ? -1 : 0);
        wins(l, w / 2, -bx * dside, -bz * dside, ca, sa, rows, ww, wh, ch ? 3.2 : 2.8, -1);
        if (!ch){ wins(w, l / 2, ca, sa, bx, bz, rows, ww, wh, 3, -1); wins(w, l / 2, -ca, -sa, bx, bz, rows, ww, wh, 3, -1); }
        if (gable && roofH > 2.2 && !ch){ for (const e of [1, -1]){ D.panel(x + ca * e * (l / 2 + 0.05), base + H + roofH * 0.35, z + sa * e * (l / 2 + 0.05), bx, bz, 1.1, 1.0, FRAME); GD.panel(x + ca * e * (l / 2 + 0.08), base + H + roofH * 0.35, z + sa * e * (l / 2 + 0.08), bx, bz, 0.85, 0.75, BGLASS); } }
      } else if (ty === 2 || ty === 9 || ty === 10){
        const rows = rowsFor(3, 1.5), big = ty === 9;
        for (const sd of [1, -1]){ wins(l, w / 2, bx * sd, bz * sd, ca, sa, rows, big ? 2.2 : 1.4, big ? 1.8 : 1.5, big ? 3.2 : 2.6, sd === dside ? 0 : -1); wins(w, l / 2, ca * sd, sa * sd, bx, bz, rows, 1.4, 1.5, 2.8, -1); }
      } else if (ty === 8){
        for (const sd of [1, -1]) wins(l, w / 2, bx * sd, bz * sd, ca, sa, [base + H - 1.6], 1.8, 0.8, 5, -1);
        const e = dside * (l / 2 + 0.06); D.panel(x + ca * e, floor + 1.9, z + sa * e, bx, bz, Math.min(5, w * 0.5), 3.8, [0.7, 0.72, 0.72]);
      } else if (ty === 3 || ty === 5 || ty === 6){
        const e = dside * (l / 2 + 0.06), dw = ty === 3 ? Math.min(2.6, w * 0.7) : ty === 5 ? Math.min(2.8, w * 0.6) : Math.min(3.6, w * 0.45), dh = ty === 6 ? 3.4 : 2.2;
        D.panel(x + ca * e, base + rise + dh / 2 + 0.1, z + sa * e, bx, bz, dw, dh, ty === 3 ? [0.85, 0.85, 0.83] : mix3(wall, [0.1, 0.08, 0.07], 0.45));
        if (ty === 6) wins(l, w / 2, bx, bz, ca, sa, [floor + 1.6], 0.8, 0.7, 4, -1);
      }
    }
    addTrees(m, key, srcs, snowy, c);
    const o = c.o = [gridKeyX(key) * 1000, gridKeyY(key) * 1000];
    c.mesh = m.p.length ? m.mesh(o) : null;
    const RM = MB(); addRoads(RM, key, snowy); if (RM.p.length) c.rd = RM.mesh(o);
    if (detail){ if (D.p.length) c.dm = D.mesh(o); if (GD.p.length) c.gd = GD.mesh(o); if (GLm.p.length) c.gl = GLm.mesh(o); }
    if (L.length){ c.lights = buf(relTo(L, o)); c.nl = L.length / 3; }
    if (SMK.length) c.smk = SMK;
    return c;
  }
  // trees: birch woods below the tree line with some pine, kept off roads and buildings; colours follow the season
  const treeSeason = () => { if (typeof seasonAt === 'function'){ const st = seasonAt(S.t / 60); return st.leaf < 0.4 ? 0 : st.yel > 0.45 ? 2 : 1; } const mo = gDate(S.t / 60).getUTCMonth(); return mo >= 5 && mo <= 7 ? 1 : mo === 8 ? 2 : 0; };
  function addTrees(m, key, srcs, snowy, c){
    const gz = gridKeyY(key), gx = gridKeyX(key), x0 = gx * 1000, z0 = gz * 1000, occ = new Uint8Array(1600);
    const mark = (x, z, r) => { const cx = Math.floor((x - x0) / 25), cz = Math.floor((z - z0) / 25); for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++){ const i = cx + b, j = cz + a; if (i >= 0 && j >= 0 && i < 40 && j < 40) occ[j * 40 + i] = 1; } };
    for (const [B, idx] of srcs) for (const i of idx) mark(B.x[i], B.z[i], Math.max(B.l[i], B.w[i]) > 30 ? 2 : 1);
    for (const r of roadsIn(x0 - 30, z0 - 30, x0 + 1030, z0 + 1030)){ for (let j = 1; j < r.xs.length; j++){ const L = Math.hypot(r.xs[j] - r.xs[j - 1], r.zs[j] - r.zs[j - 1]), n = Math.ceil(L / 12); for (let q = 0; q <= n; q++) mark(r.xs[j - 1] + (r.xs[j] - r.xs[j - 1]) * q / n, r.zs[j - 1] + (r.zs[j] - r.zs[j - 1]) * q / n, 0); } }
    if (c && treeChunk(c, key, occ, snowy)) return;   // the trees from the map (G4, 17c-trees.js), where it has them
    const ses = treeSeason(), leaf = ses === 1 ? [0.15, 0.29, 0.11] : ses === 2 ? [0.7, 0.48, 0.12] : [0.55, 0.5, 0.47], pine = [0.06, 0.15, 0.08], trunk = [0.78, 0.76, 0.7];
    let count = 0;
    // the 900 places in a stride over the square (397 is prime to 900), so the cap of 260 does not fill the northern rows first
    for (let q = 0; q < 900 && count < 260; q++){
      const sq = q * 397 % 900, j = Math.floor(sq / 30), i = sq % 30, hh = hash((gx * 7919 + gz * 104729) * 900 + j * 30 + i), x = x0 + (i + 0.15 + 0.7 * hash(hh * 1e7 | 0)) * 33.3, z = z0 + (j + 0.15 + 0.7 * hash((hh * 3e7 | 0) + 5)) * 33.3;
      if (occ[Math.floor((z - z0) / 25) * 40 + Math.floor((x - x0) / 25)] || onUnit(x, z, 8) || onSite(x, z)) continue;
      const h = terrH(x, z); if (h < 2.5 || h > 420) continue;
      const sl = Math.hypot(terrH(x + 10, z) - terrH(x - 10, z), terrH(x, z + 10) - terrH(x, z - 10)) / 20; if (sl > 0.75) continue;
      const LF = MAPD.L.forest, fc = Math.floor(x / (LF.c * 1000)), fr = Math.floor(z / (LF.c * 1000)), fo = HG && mapViewIn({x:x / 1000, y:z / 1000}) && mapIn(LF, fc, fr) && rcell(LF, fc, fr) ? 1 : 0;
      // where the land cover is known (G1): the woods where ESA has forest, a few low birches in the heath, the meadow and the town's
      // gardens, none on the bog, the lichen fells, bare rock, the snow or the fields; else the old rule (the forest layer and a noise)
      const cl = coverClass(x, z), CK = [0, 1, 0.07, 0.06, 0.01, 0.015, 0, 0, 0, 0.05, 0, 0, 0];   // (0, land with no class near the shore, keeps the old rule)
      const pr = cl > 0 ? (1 - sstep(260, 420, h)) * (1 - sstep(0.42, 0.75, sl)) * CK[cl] * (cl === 1 ? 1 : sstep(0.4, 0.6, noise2(x / 120, z / 120, 31)))
        : (1 - sstep(210, 330, h)) * (1 - sstep(0.42, 0.75, sl)) * (fo ? 0.95 : 0.5) * sstep(0.36, 0.62, noise2(x / 260, z / 260, 31) * 0.7 + noise2(x / 60, z / 60, 37) * 0.3);
      if (hash((hh * 5e7 | 0) + 11) > pr) continue;
      const th = (cl === 2 ? 0.45 : 1) * (4 + 6 * hash((hh * 9e7 | 0) + 13) * (1 - sstep(120, 320, h) * 0.55)), y = h - 0.3, isPine = hash((hh * 2e7 | 0) + 17) < 0.18, v = 0.88 + 0.24 * hash((hh * 4e7 | 0) + 19);
      if (isPine){
        const col = mix3(snowy ? mix3(pine, SNOW, 0.35) : pine, [0, 0, 0], 0), r = th * 0.24, top = [x, y + th, z], pts = [0, 1, 2, 3, 4].map(k => { const a = k * 1.2566 + hh * 6; return [x + Math.cos(a) * r, y + th * 0.15, z + Math.sin(a) * r]; });
        m.box(x, y, z, 0.3, th * 0.2, 0.3, [0.35, 0.25, 0.18], 0); for (let k = 0; k < 5; k++) m.tri(top, pts[k], pts[(k + 1) % 5], col.map(c => c * v));
      } else {
        const col = (snowy && ses === 0 ? mix3(leaf, SNOW, 0.3) : leaf).map(c => c * v), dk = col.map(c => c * (ses === 0 ? 0.85 : 0.72)), r = th * (ses === 0 ? 0.24 : 0.36), yc = y + th * 0.6, top = [x, y + th, z], bot = [x, y + th * 0.32, z], pts = [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2 + hh * 6; return [x + Math.cos(a) * r, yc, z + Math.sin(a) * r]; });
        m.box(x, y, z, 0.2, th * 0.5, 0.2, trunk, 0); for (let k = 0; k < 4; k++){ m.tri(top, pts[k], pts[(k + 1) % 4], col); m.tri(bot, pts[(k + 1) % 4], pts[k], dk); }
      }
      count++;
    }
  }
  function addRoads(m, key, snowy){
    const gz = gridKeyY(key), gx = gridKeyX(key), x0 = gx * 1000, z0 = gz * 1000, W = [7.5, 6.5, 5.5, 5, 3.6];
    const col = snowy ? [0.5, 0.52, 0.55] : [0.4, 0.42, 0.44], edge = snowy ? [0.62, 0.63, 0.65] : [0.55, 0.54, 0.5];
    for (const r of roadsIn(x0, z0, x0 + 1000, z0 + 1000)){
      const hw = W[r.c] / 2;
      for (let j = 1; j < r.xs.length; j++){
        const ax = r.xs[j - 1], az = r.zs[j - 1], bx2 = r.xs[j], bz2 = r.zs[j], mx = (ax + bx2) / 2, mz = (az + bz2) / 2;
        if (mx < x0 || mx >= x0 + 1000 || mz < z0 || mz >= z0 + 1000) continue;
        if (unitCovers(mx, mz, 6) || onSite(mx, mz)) continue;   // no road through a harbour unit or a rorbu
        const L = Math.hypot(bx2 - ax, bz2 - az); if (L < 0.5) continue;
        const ux = (bx2 - ax) / L, uz = (bz2 - az) / L, px = -uz, pz = ux, n = Math.max(1, Math.ceil(L / 10));
        for (let q = 0; q < n; q++){
          const s0 = q / n, s1 = (q + 1) / n, e0 = q === 0 ? -hw * 0.5 : 0, e1 = q === n - 1 ? hw * 0.5 : 0;
          const x0s = ax + (bx2 - ax) * s0 + ux * e0, z0s = az + (bz2 - az) * s0 + uz * e0, x1s = ax + (bx2 - ax) * s1 + ux * e1, z1s = az + (bz2 - az) * s1 + uz * e1;
          const y0 = Math.max(Math.max(terrH(x0s, z0s), 0.2) + 0.3, moundTop(x0s, z0s) + 0.08), y1 = Math.max(Math.max(terrH(x1s, z1s), 0.2) + 0.3, moundTop(x1s, z1s) + 0.08);
          m.quad([x0s + px * hw, y0, z0s + pz * hw], [x1s + px * hw, y1, z1s + pz * hw], [x1s - px * hw, y1, z1s - pz * hw], [x0s - px * hw, y0, z0s - pz * hw], col);
          if (r.c <= 1) for (const sd of [1, -1]) m.quad([x0s + px * sd * (hw - 0.35), y0 + 0.02, z0s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.35), y1 + 0.02, z1s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.55), y1 + 0.02, z1s + pz * sd * (hw - 0.55)], [x0s + px * sd * (hw - 0.55), y0 + 0.02, z0s + pz * sd * (hw - 0.55)], edge);
        }
      }
    }
  }
  function freeChunk(c){ treeFree(c); const del = mm => { if (mm.parts) mm.parts.forEach(del); else { gl.deleteBuffer(mm.pb); gl.deleteBuffer(mm.cb); } }; for (const mm of [c.rd, c.mesh, c.dm, c.gd, c.gl]) if (mm) del(mm); if (c.lights) gl.deleteBuffer(c.lights); }
  function updateChunks(maxBuilds){
    if (!NEARM) return;
    const sf = (snowNow == null || snowNow < 80 ? 1 : 0) + 10 * treeSeason();
    if (sf !== chunkSnow){ for (const c of CH.values()) freeChunk(c); CH.clear(); chunkSnow = sf; }
    const half = NEARM.sx / 2 - 400, cx = NEARM.cx, cz = NEARM.cz;
    const want = (mx, mz) => Math.hypot(mx - bv.x, mz - bv.z) < QUAL.chunkR[QUAL.lvl] * Math.min(3, ZF());
    for (const [k, c] of CH) if (Math.abs(c.x - cx) > half + 700 || Math.abs(c.z - cz) > half + 700 || (c.mesh && c.detail !== want(c.x, c.z))){ freeChunk(c); CH.delete(k); }
    const cand = [];
    for (let gz = Math.floor((cz - half) / 1000); gz <= Math.floor((cz + half) / 1000); gz++) for (let gx = Math.floor((cx - half) / 1000); gx <= Math.floor((cx + half) / 1000); gx++){
      const k = gridKey(gx, gz); if (CH.has(k)) continue;
      // not before the tile's ground (25 m) is in, as the piers wait for it (tileStatics): on the stand-in heights the houses sank
      const vp = MAPD.byTile.get('view:' + tileOf(k)); if (vp && !vp.buf) continue;
      const mx = gx * 1000 + 500, mz = gz * 1000 + 500; cand.push([Math.hypot(mx - bv.x, mz - bv.z), k, mx, mz]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < Math.min(maxBuilds, cand.length); i++){ const [, k, mx, mz] = cand[i]; const c = buildChunk(k, want(mx, mz)); c.x = mx; c.z = mz; CH.set(k, c); }
  }
  function drawBuildings(TM){
    for (const c of CH.values()) if (c.mesh) drawLit(c.mesh, TM);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-2, -4); for (const c of CH.values()) if (c.rd) drawLit(c.rd, TM);
    gl.polygonOffset(-1, -2); for (const c of CH.values()) if (c.dm) drawLit(c.dm, TM);
    gl.polygonOffset(-2, -4); for (const c of CH.values()) if (c.gd) drawLit(c.gd, TM);
    // lit windows: dark glass by day, warm glow after dark
    const u = PL.u; gl.uniform4fv(u.uOver, [BGLASS[0], BGLASS[1], BGLASS[2], 1 - env.night]); gl.uniform1f(u.uEmis, env.night * 1.6);
    for (const c of CH.values()) if (c.gl) drawLit(c.gl, TM);
    gl.uniform4fv(u.uOver, [0, 0, 0, 0]); gl.uniform1f(u.uEmis, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
  const LCOL = {w:[1, 0.93, 0.78], r:[1, 0.14, 0.1], g:[0.12, 1, 0.42], y:[1, 0.82, 0.2]};
  // a light's rhythm: its period and where in it the light starts (Senja's by their order, as before; the coast's by where they are)
  const lightLP = (L, i) => L.lp || (L.lp = (() => { const per = L[4].reduce((a, v) => a + Math.abs(v), 0) || 1; return {per, ph:hash(i >= 0 ? i * 31 + 7 : Math.floor(L[0] * 1000) * 31 + Math.floor(L[1] * 1000) * 7) * per}; })());
  SEAMARKS.lights.forEach((L, i) => lightLP(L, i));
  const lightsHere = (eye, R) => marksNear('lights', eye[0] / 1000, eye[2] / 1000, R);
  // where a light shines: its height is over the sea (the seamark's focal height), but never less than 4 m over the ground the terrain
  // has there (07.10.2026; before, it was over the ground, and a lighthouse on a hill had its light far over the tower)
  function lightY(L, x, z){ return Math.max(Math.max(terrH(x, z), 0.2) + 4, L[2]); }
  function lightOn(L, t){ const P = lightLP(L, -1); let tm = (t + P.ph) % P.per; for (const v of L[4]){ const d = Math.abs(v); if (tm < d) return v > 0; tm -= d; } return false; }
  function drawSeaLights(VP, eye, t, near){
    if (env.night < 0.05) return;
    const by = {w:[], r:[], g:[], y:[]};
    lightsHere(eye, 50).forEach(L => {
      const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d > L[3] * 1852 * 1.3 + 500 || (near ? d > lightNF : d < lightNF * 0.8)) return;
      if (!lightOn(L, t)) return;
      const brg = trueDeg(Math.atan2(x - eye[0], -(z - eye[2])), {x:L[0], y:L[1]});   // the sectors are true bearings
      const sec = L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1]); if (!sec) return;
      by[sec[2]].push(x - eye[0], lightY(L, x, z) - eye[1], z - eye[2], Math.min(1, env.night * 1.2));
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const k in by){ const a = by[k], n = a.length / 4; if (!n) continue; for (let i = 0; i < n; i++){ PB[i * 3] = a[i * 4]; PB[i * 3 + 1] = a[i * 4 + 1]; PB[i * 3 + 2] = a[i * 4 + 2]; PA[i] = a[i * 4 + 3]; } drawPts(n, gl.POINTS, VP, LCOL[k], near ? 3800 : 8000, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  let lightNF = 3000;
  // ---------- lights that light up round them at night (the user's wish 03.10.2026) ----------
  // Each frame the nearest are picked for the shaders (PLG): the boat's own deck light, the sea lights near by while they shine (a
  // lighthouse further than a beacon), the floodlights over the quays; on «Lav» only two. pickLights fills PLA (x, y, z from the eye,
  // reach) and PCA (colour x strength), plSet uploads them to a program that has them.
  const PLA = new Float32Array(32), PCA = new Float32Array(24), PLC = []; let NOPL = false;
  function pickLights(eye, t){
    PLA.fill(0); PCA.fill(0); PLC.length = 0; PLN = 0; if (NOPL || env.night < 0.05 || !SEAMARKS) return;
    const nt = env.night, cand = PLC, add = (k, x, y, z, R, c, s) => { if (Math.abs(x - eye[0]) > R + 2500 || Math.abs(z - eye[2]) > R + 2500) return; cand.push([k, x, y, z, R, c[0] * s * nt, c[1] * s * nt, c[2] * s * nt]); };
    // your own boat: a work light over the deck at the wheelhouse's top
    add(-1e9, bv.x, bv.y + 3.2, bv.z, 26, [1, 0.94, 0.82], 1.3);
    lightsHere(eye, 5).forEach(L => {
      const x = L[0] * 1000, z = L[1] * 1000; if (Math.abs(x - eye[0]) > 3500 || Math.abs(z - eye[2]) > 3500 || !lightOn(L, t)) return;
      const c = LCOL[(L[5].find(q => q[2] === 'w') || L[5][0] || [0, 0, 'w'])[2]] || LCOL.w, R = L[6] === 'M' || L[3] >= 10 ? 170 : L[3] >= 6 ? 90 : 50;
      add(Math.hypot(x - eye[0], z - eye[2]) - R, x, lightY(L, x, z), z, R, c, 2.4);
    });
    // the local fleet's deck lights while they fish (the cones' lamps, drawWorkCones): the deck and the sea round them lit, from last frame's places
    if (QUAL.lvl > 0 && typeof npcNow !== 'undefined') for (const n of npcNow){ if (!n.K || !n.M || n.st !== 'fishing') continue; const wl = workLights(n.K.t, n.K.geo); if (!wl.length) continue;
      const q = xf(n.M, [wl[0][0][0] * n.K.sv[0], wl[0][0][1] * n.K.sv[1], wl[0][0][2] * n.K.sv[2]]), x = q[0] + eye[0], z = q[2] + eye[2];
      add(Math.hypot(q[0], q[2]) - 30, x, q[1] + eye[1], z, Math.min(40, 12 + (n.L || 10)), WCOL[lookHash('wl' + n.id) % 3], 1.1); }
    // the quays' floodlights, at the berth of each harbour near by
    for (const q of PORTS){
      const x = q.p.x * 1000, z = q.p.y * 1000; if (Math.abs(x - eye[0]) > 2500 || Math.abs(z - eye[2]) > 2500) continue;
      const bp = berthPose(q.id, vtype()), f = bp && bp.face; if (!f) continue;
      add(Math.hypot(f.x - eye[0], f.z - eye[2]) - 45, f.x - f.nx * 4, (env.tide || 0) + 9, f.z - f.nz * 4, 45, [1, 0.84, 0.62], 1.0);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const n = PLN = Math.min(cand.length, QUAL.lvl === 0 ? 2 : QUAL.lvl === 1 ? 4 : 8);
    for (let i = 0; i < n; i++){ const c = cand[i]; PLA[i * 4] = c[1] - eye[0]; PLA[i * 4 + 1] = c[2] - eye[1]; PLA[i * 4 + 2] = c[3] - eye[2]; PLA[i * 4 + 3] = c[4]; PCA[i * 3] = c[5]; PCA[i * 3 + 1] = c[6]; PCA[i * 3 + 2] = c[7]; }
  }
  let PLN = 0;
  function plSet(u){ if (u.uPL){ gl.uniform4fv(u.uPL, PLA); gl.uniform3fv(u.uPC, PCA); gl.uniform1f(u.uNPL, PLN); } }
  // The lighthouses' beams sweeping round at night: the big lights (a lighthouse, or a range of 10 nautical miles or more) turn two
  // beams, once round in the light's period, drawn as crossed fans that fade along their length. (Most Norwegian lights are sector
  // lights that do not turn; this is for the look the user asked for.)
  let PBM = null, BMB = null, BMN = 0; const BMV = new Float32Array(4 * 2 * 6 * 4 * 4);
  function drawBeams(VP, eye, t){
    BMN = 0; if (env.night < 0.1 || !SEAMARKS) return;
    let k = 0; const put = (p, a) => { BMV[k++] = p[0]; BMV[k++] = p[1]; BMV[k++] = p[2]; BMV[k++] = a; };
    lightsHere(eye, 26).forEach(L => {
      if (!(L[6] === 'M' || L[3] >= 10) || k >= BMV.length - 96) return;
      const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d > 25000) return;
      const y = lightY(L, x, z) - eye[1], o = [x - eye[0], y, z - eye[2]], LP = lightLP(L, -1), per = Math.max(6, LP.per * 2), th0 = (t / per + LP.ph) * Math.PI * 2;
      const a0 = 0.32 * env.night * (0.6 + 0.4 * Math.min(1, env.fogD * 2500)), Lb = 1600, w0 = 1.2, w1 = 70;
      for (const th of [th0, th0 + Math.PI]){
        const fx = Math.sin(th), fz = -Math.cos(th), rx = Math.cos(th), rz = Math.sin(th), far = [o[0] + fx * Lb, o[1] - 6, o[2] + fz * Lb];
        // across (flat) and up (standing): two triangles each
        for (const [sx, sy, sz] of [[rx, 0, rz], [0, 1, 0]]){
          const A = [o[0] - sx * w0, o[1] - sy * w0, o[2] - sz * w0], B = [o[0] + sx * w0, o[1] + sy * w0, o[2] + sz * w0], C = [far[0] + sx * w1, far[1] + sy * w1 * 0.5, far[2] + sz * w1], Dd = [far[0] - sx * w1, far[1] - sy * w1 * 0.5, far[2] - sz * w1];
          put(A, a0); put(B, a0); put(C, 0); put(A, a0); put(C, 0); put(Dd, 0);
        }
      }
    });
    BMN = k / 96; if (!k) return;
    if (!PBM) PBM = program('attribute vec3 aPos;attribute float aA;uniform mat4 uVP;varying float vA;void main(){vA=aA;gl_Position=uVP*vec4(aPos,1.0);}',
      'precision mediump float;uniform vec3 uCol;varying float vA;void main(){gl_FragColor=vec4(uCol*vA,1.0);}', ['aPos', 'aA']);
    if (!BMB) BMB = gl.createBuffer();
    gl.useProgram(PBM.p); gl.uniformMatrix4fv(PBM.u.uVP, false, VP); gl.uniform3fv(PBM.u.uCol, [1, 0.93, 0.78]);
    gl.bindBuffer(gl.ARRAY_BUFFER, BMB); gl.bufferData(gl.ARRAY_BUFFER, BMV.subarray(0, k), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, k / 4);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(1);
  }
  // The deck lights' cones in the air at night (Gemini's review, Jonas 31.10.2026: «Kjør på»): a boat that works in the dark lights her
  // deck from the house and the mast, and in mist, rain, snow or spray the light stands as a cone in the air. Each work light is a cone
  // shell (16 sides, 5 rings) from the lamp down to the deck or the sea, drawn adding light, both faces, without writing depth: what
  // the eye sees through the middle of the cone is bright and its edges are thin (|n·v|), it fades along its length from the lamp, and
  // the air in it drifts (noise in the world's frame, folded as AIRE), with falling streaks when it rains or snows. How much it shows is
  // the air's: a little on a clear night, much in fog (visibility), precipitation and spindrift. The lamps: a model's own 'work'
  // lights (tools/boats, geo.lights), else one over the house's aft end aimed at the work deck; an open boat without them and the
  // hand-worked boats have none.
  // Your own boat shows them when she is not under way (a skipper steaming in the dark keeps the deck dark, so the wheelhouse is not
  // blinded), the local fleet when they fish. Colours: sodium yellow, halogen white or cold LED, by the boat. Off on «Lav».
  const WCN = 16, WCR = 5, WCF = 7, WCMAX = 14, WCV = new Float32Array(WCMAX * WCN * WCR * 6 * WCF), WLC = {};
  const WCOL = [[1, 0.7, 0.36], [1, 0.9, 0.74], [0.82, 0.9, 1]];
  const WC_VS = 'attribute vec3 aPos;attribute vec3 aNor;attribute float aS;uniform mat4 uVP;varying vec3 vP;varying vec3 vN;varying float vS;void main(){vP=aPos;vN=aNor;vS=aS;gl_Position=uVP*vec4(aPos,1.0);}';
  const WC_FS = 'precision highp float;uniform vec3 uCol;uniform float uK;uniform float uT;uniform float uFogD;uniform vec3 uEyeM;uniform float uRain;varying vec3 vP;varying vec3 vN;varying float vS;' +
    'float h1(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}' +
    'float n1(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(h1(i),h1(i+vec2(1.0,0.0)),u.x),mix(h1(i+vec2(0.0,1.0)),h1(i+vec2(1.0,1.0)),u.x),u.y);}' +
    'void main(){vec3 v=normalize(-vP);float a=abs(dot(normalize(vN),v));a=a*a*(3.0-2.0*a);' +
    'float I=(1.0-vS)*(1.0-vS)*(0.4+0.6/(1.0+vS*5.0))*smoothstep(0.0,0.06,vS+0.02);' +
    'vec3 w=vP+uEyeM;float m=0.65+0.35*n1(vec2(w.x*0.45+uT*0.35,w.y*0.45-uT*0.2+w.z*0.3))+0.25*n1(vec2(w.z*1.3-uT*0.5,w.x*1.1+w.y*0.9));' +
    'm+=uRain*0.9*smoothstep(0.82,0.97,n1(vec2(w.x*9.0+w.z*7.0,w.y*0.7+uT*7.0)));' +
    'gl_FragColor=vec4(uCol*(a*I*m*uK*exp(-uFogD*length(vP)*0.8)),1.0);}';
  let PWC = null, WCB = null, WCN_ = 0;
  // the work lights of a type in its own frame: [[x, y, z], [dx, dy, dz]] (unit, down), cached per type
  function workLights(type, G){
    if (type in WLC) return WLC[type]; if (!G) return []; if (G.hand){ WLC[type] = []; return []; }
    const L = (G.lights || []).filter(l => l && l[0] && l[2] === 'work').map(l => l[0]), out = [];
    const tg = G.work ? G.work.table : G.deck ? [0, G.deck.y, G.deck.z] : G.hauler || null;
    // a lamp on the compass deck over the bridge is a searchlight, kept dark: it looks ahead to find a buoy or a mooring, and a boat
    // lying still at her work does not burn it. A model that names no deck light gets one on her wheelhouse's roof at the end towards
    // the work deck, aimed at it, if she has a house (not an open boat)
    const sa = G.skipperAt, deckL = sa ? L.filter(p => !(Math.abs(p[2] - sa[2]) < 4 && p[1] > sa[1] + 1.5)) : L;
    if (sa && !deckL.length && !G.open){
      // on the roof: the side lights' height (they stand on the wheelhouse's roof or its wings), towards the work deck from them
      const sl = (G.lights || []).filter(l => l && l[0] && (l[2] === 'port' || l[2] === 'stbd')).map(l => l[0]), ly = sl.length ? Math.max(...sl.map(q => q[1])) + 0.15 : sa[1] + 2.2;
      const lz = sl.length ? sl[0][2] : sa[2], dz = tg ? tg[2] - lz : 3; deckL.push([0, ly, lz + Math.sign(dz || 1) * Math.min(1.6, Math.abs(dz) * 0.4)]); }
    for (const p of deckL){
      const T = tg || [p[0], G.gw || 1, p[2] + 3], dx = T[0] - p[0], dz = T[2] - p[2], hz = Math.hypot(dx, dz), dy = -Math.max(p[1] - (T[1] || 0), 1.3 * hz, 1);
      const l = Math.hypot(dx, dy, dz); out.push([p, [dx / l, dy / l, dz / l]]); }
    return WLC[type] = out;
  }
  function airGlow(){ const vis = env.vis || 30, rain = sstep(0.03, 0.6, env.precip || 0), spray = sstep(13, 24, env.wind || 0); return Math.min(1.7, 0.4 + 0.8 * sstep(25, 1.5, vis) + 0.55 * rain + 0.35 * spray); }
  function drawWorkCones(VP, eye, t, BMrel, VG){
    WCN_ = 0; if (env.night < 0.08 || QUAL.lvl === 0) return;
    const cones = [], wantMe = !VG.hand && S.boat.status !== 'sailing' && S.boat.status !== 'port';
    const add = (M, sv, type, G, col, k) => { for (const [p, d] of workLights(type, G)){ if (cones.length >= WCMAX) return;
      const P = xf(M, [p[0] * sv[0], p[1] * sv[1], p[2] * sv[2]]), Q = xf(M, [(p[0] + d[0]) * sv[0], (p[1] + d[1]) * sv[1], (p[2] + d[2]) * sv[2]]), D = [Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]], dl = Math.hypot(D[0], D[1], D[2]) || 1;
      const Dn = [D[0] / dl, D[1] / dl, D[2] / dl], h = P[1] + eye[1] - (env.tide || 0), deck = (G.deck ? G.deck.y : G.gw || 1) * sv[1], len = Math.min(28, Math.max(2.5, (Math.min(h, h - deck * 0.5) + 0.2) / Math.max(0.35, -Dn[1])));
      cones.push([P, Dn, len, col, k, 0.5]); } };
    if (wantMe) add(BMrel, [1, 1, 1], vtype(), VG, WCOL[(VESSELS[vtype()] || {}).len >= 20 ? 2 : 1], 1);
    for (const n of (typeof npcNow !== 'undefined' ? npcNow : [])){
      if (cones.length >= WCMAX) break; if (!n.K || !n.M || n.st !== 'fishing') continue;
      const d = Math.hypot(n.M[12], n.M[14]); if (d > 900) continue;
      add(n.M, n.K.sv, n.K.t, n.K.geo, WCOL[lookHash('wl' + n.id) % 3], 1 - sstep(500, 900, d)); }
    if (!cones.length) return;
    let k = 0; const put = (x, y, z, nx, ny, nz, s) => { WCV[k++] = x; WCV[k++] = y; WCV[k++] = z; WCV[k++] = nx; WCV[k++] = ny; WCV[k++] = nz; WCV[k++] = s; };
    const ranges = [];
    for (const [P, D, len, col, kk, ang] of cones){
      const k0 = k, u0 = Math.abs(D[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let U = [D[1] * u0[2] - D[2] * u0[1], D[2] * u0[0] - D[0] * u0[2], D[0] * u0[1] - D[1] * u0[0]]; const ul = Math.hypot(U[0], U[1], U[2]); U = U.map(v => v / ul);
      const W = [D[1] * U[2] - D[2] * U[1], D[2] * U[0] - D[0] * U[2], D[0] * U[1] - D[1] * U[0]], cs = Math.cos(ang), sn = Math.sin(ang), tg = Math.tan(ang);
      const pt = (j, i) => { const s = j / WCR, a = i / WCN * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), r = 0.12 + s * len * tg, R = [U[0] * ca + W[0] * sa, U[1] * ca + W[1] * sa, U[2] * ca + W[2] * sa];
        return [P[0] + D[0] * s * len + R[0] * r, P[1] + D[1] * s * len + R[1] * r, P[2] + D[2] * s * len + R[2] * r, R[0] * cs - D[0] * sn, R[1] * cs - D[1] * sn, R[2] * cs - D[2] * sn, s]; };
      for (let j = 0; j < WCR; j++) for (let i = 0; i < WCN; i++){ const a = pt(j, i), b = pt(j, i + 1), c = pt(j + 1, i + 1), e = pt(j + 1, i); put(...a); put(...b); put(...c); put(...a); put(...c); put(...e); }
      ranges.push([k0 / WCF, (k - k0) / WCF, col, kk]);
    }
    WCN_ = cones.length;
    if (!PWC) PWC = program(WC_VS, WC_FS, ['aPos', 'aNor', 'aS'], 'lyskjegle');
    if (!WCB) WCB = gl.createBuffer();
    gl.useProgram(PWC.p); const u = PWC.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uT, t); gl.uniform1f(u.uFogD, env.fogD || 0); gl.uniform3fv(u.uEyeM, [eye[0] % 4096, eye[1], eye[2] % 4096]);
    gl.uniform1f(u.uRain, sstep(0.03, 0.6, env.precip || 0));
    gl.bindBuffer(gl.ARRAY_BUFFER, WCB); gl.bufferData(gl.ARRAY_BUFFER, WCV.subarray(0, k), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, WCF * 4, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, WCF * 4, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, WCF * 4, 24);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false); gl.disable(gl.CULL_FACE);
    const air = airGlow() * env.night * 0.5;
    for (const [first, cnt, col, kk] of ranges){ gl.uniform3fv(u.uCol, col); gl.uniform1f(u.uK, air * kk); gl.drawArrays(gl.TRIANGLES, first, cnt); }
    gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
  }
  function drawChunkLights(VP, eye){
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uPull, 12); gl.uniform3fv(u.uCol, [1, 0.78, 0.42]); gl.uniform1f(u.uSize, 4200 * ZF()); gl.uniform1f(u.uRound, 1);
    gl.disableVertexAttribArray(1); gl.vertexAttrib1f(1, env.night * 0.9);
    for (const c of CH.values()) if (c.lights){ gl.uniform3fv(u.uOff, [c.o[0] - eye[0], -eye[1], c.o[1] - eye[2]]); attr(0, c.lights, 3); gl.drawArrays(gl.POINTS, 0, c.nl); }
  }

