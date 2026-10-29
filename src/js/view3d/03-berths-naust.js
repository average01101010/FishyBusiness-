  // ---------- The water at the berths the company holds in the coast's harbours (core/07e-havn.js) ----------
  // The packs' quay faces lie on the fine coast, and its bank (COAST3: 2 m over the sea at the line, down 1 in 3) would have the boat on
  // the shore. In front of a held berth the ground goes down to 3 m under mean sea level (her draught and a metre if more), as in front
  // of a designed quay (inHarbourPocket): out to her side and 6 m, along her length and 3 m at each end, and 4 m in under the quay's
  // deck (kai_betong, kai_tre: drawDocks), so the step between the ground's points (4 m in the fine mesh) is under it and not in the
  // water by her side. The held berths are looked at each frame (updateNear); when they change, the meshes round them are made again.
  const BPIT = {k:'', l:[]};
  function berthPits(){
    const st = typeof S !== 'undefined' && S && S.havn; let k = '';
    if (st) for (const id in st.s) if (st.s[id].vid && st.s[id].face) k += id + ',';
    if (k === BPIT.k) return;
    const was = BPIT.l; BPIT.k = k; BPIT.l = [];
    if (st) for (const id in st.s){ const s = st.s[id], f = s.face; if (!s.vid || !f) continue;
      const B = s.B || 3, a1 = s.L / 2 + 1 + 3, w = B + 6, r = Math.hypot(a1, w + 4) + 1, T = (VESSELS[s.vtype] || {}).draft || 1.5;
      BPIT.l.push({x:f.x, z:f.z, ux:f.ux, uz:f.uz, nx:f.nx, nz:f.nz, a1, a0:s.L / 2 + 2, w, d:Math.max(3, T + 1), x0:f.x - r, x1:f.x + r, z0:f.z - r, z1:f.z + r}); }
    // (the ground round the berths that came or went is made again: the terrain chunks within 700 m and the near and fine meshes)
    const moved = was.filter(q => !BPIT.l.some(p => p.x === q.x && p.z === q.z)).concat(BPIT.l.filter(q => !was.some(p => p.x === q.x && p.z === q.z)));
    if (!moved.length) return;
    for (const [kk, c] of CH) if (moved.some(q => Math.hypot(c.x - q.x, c.z - q.z) < 700)){ freeChunk(c); CH.delete(kk); }
    staleMesh('near'); staleMesh('fine');
  }
  // The coast's own boats at their quay berths (05-vessels.js moorHarbour, 4.16b) stood on the same bank: there too the ground goes down,
  // where it stands over -1.2 m under the hull, out to her side and 6 m and along her length and 3 m, and only 1.5 m in from the face
  // (no quay of ours is drawn there). Their places are fixed again only when packs or coast indexes come (MOOR.ver), so the set changes
  // rarely: it is looked at every 30th frame for the harbours within 2.5 km of the boat, and kept in 64 m cells.
  const NPIT = {k:'', l:[], g:new Map(), off:false, n:0};
  function npcPits(){
    if (++NPIT.n % 30 || typeof MOOR === 'undefined' || !VEC.tiles.size) return;
    const R = 2500, ex = bv.x, ez = bv.z, H = []; let k = MOOR.ver + ':';
    for (const tl of vecTilesIn(ex - R, ez - R, ex + R, ez + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - ex, h.y * 1000 - ez) < R){ H.push(h); k += Math.round(h.x * 1000) + ',' + Math.round(h.y * 1000) + ';'; }
    if (k === NPIT.k) return;
    const was = NPIT.l; NPIT.k = k; NPIT.l = []; NPIT.g = new Map(); NPIT.off = true;
    for (const h of H) for (const b of h.boats){ const m = b.moored; if (!m || m.buoy || m.dock || m.none) continue;
      const px = m.p.x * 1000, pz = m.p.y * 1000, sn = Math.sin(m.hd), cs = Math.cos(m.hd), B = b.B || 3, L = b.L || 10, o = B / 2 + 2;
      if (terrRaw(px, pz) < -1.2) continue;
      // (the face on the side with the bank: across her heading, the higher ground)
      const sg = terrRaw(px + cs * o, pz + sn * o) > terrRaw(px - cs * o, pz - sn * o) ? 1 : -1, nx = -sg * cs, nz = -sg * sn, fx = px - nx * (B / 2 + 0.4), fz = pz - nz * (B / 2 + 0.4);
      const a1 = L / 2 + 3, w = B + 6, r = Math.hypot(a1, w + 2) + 1;
      NPIT.l.push({x:fx, z:fz, ux:sn, uz:-cs, nx, nz, a1, a0:L / 2 + 2, w, inl:1.5, d:Math.max(3, (b.T || 1.5) + 1), x0:fx - r, x1:fx + r, z0:fz - r, z1:fz + r}); }
    NPIT.off = false;
    for (const q of NPIT.l) for (let i = Math.floor(q.x0 / 64); i <= Math.floor(q.x1 / 64); i++) for (let j = Math.floor(q.z0 / 64); j <= Math.floor(q.z1 / 64); j++){ const c = i * 65536 + j; let L = NPIT.g.get(c); if (!L) NPIT.g.set(c, L = []); L.push(q); }
    const moved = was.filter(q => !NPIT.l.some(p => p.x === q.x && p.z === q.z)).concat(NPIT.l.filter(q => !was.some(p => p.x === q.x && p.z === q.z)));
    if (!moved.length) return;
    for (const [kk, c] of CH) if (moved.some(q => Math.hypot(c.x - q.x, c.z - q.z) < 700)){ freeChunk(c); CH.delete(kk); }
    staleMesh('near'); staleMesh('fine');
  }
  function berthPit(x, z, h){
    const pit = q => { if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) return false;
      const dx = x - q.x, dz = z - q.z, a = Math.abs(dx * q.ux + dz * q.uz), n = dx * q.nx + dz * q.nz;
      return n <= q.w && (n >= 0 ? a <= q.a1 : n >= -(q.inl || 4) && a <= q.a0); };
    for (const q of BPIT.l) if (pit(q)) return Math.min(h, -q.d);
    if (!NPIT.off){ const L = NPIT.g.get(Math.floor(x / 64) * 65536 + Math.floor(z / 64)); if (L) for (const q of L) if (pit(q)) return Math.min(h, -q.d); }
    return h;
  }
  // ---------- Father's naust and the Finnsnes shop (tools/harbour/naust.py, butikk.py; where: core/07c-naust.js) ----------
  // Each a model set down at a quay face, in its frame: x along the face (s.u), out to sea s.n, y up from mean sea level. The naust
  // brings its own ground, a bank of rock and grass from 3 m out to 16 m in (NBANK, naust.py BANK): the ground under it is cut 0.4 m
  // under that bank (and under its sides, which sink 1.2 m beyond 11 m out from the middle) and goes back to what it was within 8 m.
  // The shop's yard (anchors.apron, from the deck's back to 27.5 m in) is levelled 0.1 m under the deck and goes back within 12 m. The
  // map's houses on their ground go (onSite, in bldOnUnit) and so do the scattered trees. Drawn in full within 900 m, simply to 4 km.
  const NBANK = [[-3.0, -2.9], [0.0, -2.6], [1.5, -1.6], [3.4, -0.45], [5.2, 0.55], [7.4, 1.45], [9.6, 2.1], [12.0, 2.75], [16.0, 3.3]];
  const nbank = y => { if (y <= NBANK[0][0]) return NBANK[0][1]; for (let i = 1; i < NBANK.length; i++) if (y <= NBANK[i][0]){ const [a, va] = NBANK[i - 1], [b, vb] = NBANK[i]; return va + (vb - va) * (y - a) / (b - a); } return NBANK[NBANK.length - 1][1]; };
  const SHOP_APRON = [-19, 19, 9.6, 27.5];
  // the rorbu's bank (rorbu.py BANK, in its anchors): [y inland, height] from 3 m out to 21 m in, its half width x1
  const bankAt = (P, y) => { if (y <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (y <= P[i][0]){ const [a, va] = P[i - 1], [b, vb] = P[i]; return va + (vb - va) * (y - a) / (b - a); } return P[P.length - 1][1]; };
  let RBB;
  const RBANK = () => { if (RBB === undefined){ const M = siteModel('rorbu:r'), b = M && M.A.bank; RBB = b ? {x1:b.x1, y0:b.y0, y1:b.y1, prof:b.prof} : null; } return RBB; };
  let SITES = null, SITEK = '';
  // the rorbuer near the boat, looked up again when she has moved 500 m or one more has been found (at most one new one is worked out
  // in a frame: rorbuSoon)
  const RBNEAR = {x:NaN, z:NaN, ver:-1, l:[], key:''};
  function rorbuNow(){
    if (!(Math.hypot(bv.x - RBNEAR.x, bv.z - RBNEAR.z) < 500) || RBNEAR.ver !== (RORBU.ver || 0) || RBNEAR.pend){
      const r = rorbuSoon({x:bv.x / 1000, y:bv.z / 1000}, 4); RBNEAR.x = bv.x; RBNEAR.z = bv.z; RBNEAR.ver = RORBU.ver || 0; RBNEAR.l = r.l; RBNEAR.pend = r.pend; RBNEAR.key = r.l.map(R => R.id).join(',');
    }
    return RBNEAR.key;
  }
  function sitesNow(){
    const n = typeof naustSite === 'function' ? naustSite() : null, key = (n ? n.o.join(',') : '-') + '|' + rorbuNow();
    if (SITES && SITEK === key) return SITES;
    SITEK = key; SITES = [];
    const sh = shopSite(); if (sh && glbHas('shop')) SITES.push({k:'shop', o:sh.o, u:sh.u, n:[-sh.u[1], sh.u[0]], clear:[[SHOP_APRON[0], SHOP_APRON[2] - 2, SHOP_APRON[1], SHOP_APRON[3]]]});
    // the shop by the naust along the coast (07c-naust.js shopNear): its yard levelled at the ground's own height there (not the deck's),
    // and the model lifted to it; the ground's height is read before the site is in SITES (terrRaw goes through siteTerr)
    const sn = typeof shopNear === 'function' ? shopNear() : null;
    if (sn && glbHas('shop')){ const nn = [-sn.u[1], sn.u[0]], hs = [];
      for (const x of [-15, 0, 15]) for (const y of [12, 19, 26]){ const h = terrRaw(sn.o[0] + sn.u[0] * x - nn[0] * y, sn.o[1] + sn.u[1] * x - nn[1] * y); if (h === h) hs.push(h); }
      if (hs.length === 9){ hs.sort((a, b) => a - b); SITES.push({k:'shop', near:true, o:sn.o, u:sn.u, n:nn, lev:clamp(hs[4], 1.2, 30), clear:[[SHOP_APRON[0], 0, SHOP_APRON[1], SHOP_APRON[3]]]}); }
      else SITEK = '';   // the ground is not in yet: try again next frame
    }
    if (n && glbHas('naust')) SITES.push({k:'naust', o:n.o, u:n.u, n:[-n.u[1], n.u[0]], clear:[[-14, -1, 14, 16]]});
    // the rorbuer within 4 km of the boat (07d-rorbu.js; tools/harbour/rorbu.py), each in its colour; the model's 'clear' is where the
    // map's houses go
    if (glbHas('rorbu')) for (const R of RBNEAR.l){ const o = R.site.o, u = R.site.u, n = [-u[1], u[0]], M = siteModel('rorbu:' + R.v);
      SITES.push({k:'rorbu', v:R.v, id:R.id, o, u, n, clear:[[-15, -1, 15, 21]]});
      // its bollards (the model's anchors, x along the face and z out to sea) take the mooring lines (drawMooring)
      if (M && M.A.bollards) QB[faceKey({x:o[0], z:o[1]})] = M.A.bollards.map(q => ({x:o[0] + u[0] * q[0] + n[0] * q[2], z:o[1] + u[1] * q[0] + n[1] * q[2], a:q[0]})); }
    // a site that came after the ground round it was built: those terrain chunks and the near mesh are made again with its ground
    if (SITEK){ for (const [k, c] of CH) if (SITES.some(q => Math.hypot(c.x - q.o[0], c.z - q.o[1]) < 700)){ freeChunk(c); CH.delete(k); }
      if (NEARM) NEARM.stale = true; }
    return SITES;
  }
  // a point in a site's frame: [x along the face, y inland]
  const siteL = (s, x, z) => { const dx = x - s.o[0], dz = z - s.o[1]; return [dx * s.u[0] + dz * s.u[1], -(dx * s.n[0] + dz * s.n[1])]; };
  function siteTerr(x, z, h){
    const L = SITES || sitesNow(); if (!L.length) return h;
    for (const s of L){
      if (Math.abs(x - s.o[0]) > 70 || Math.abs(z - s.o[1]) > 70) continue;
      const [lx, y] = siteL(s, x, z), ax = Math.abs(lx);
      if (s.k === 'rorbu'){
        const B = RBANK(); if (!B) continue; const d = Math.hypot(Math.max(0, ax - B.x1), Math.max(0, B.y0 - y, y - B.y1)); if (d >= 8) continue;
        const cap = bankAt(B.prof, clamp(y, B.y0, B.y1)) - 0.4 - (ax > B.x1 - 4 ? Math.min(1, (ax - B.x1 + 4) / 4) * 1.2 : 0);
        return h <= cap ? h : cap + (h - cap) * sstep(0, 8, d);
      }
      if (s.k === 'naust'){
        const d = Math.hypot(Math.max(0, ax - 17), Math.max(0, -3 - y, y - 16)); if (d >= 8) continue;
        const cap = nbank(clamp(y, -3, 16)) - 0.4 - (ax > 11 ? Math.min(1, (ax - 11) / 5) * 1.2 : 0);
        return h <= cap ? h : cap + (h - cap) * sstep(0, 8, d);
      }
      const A = SHOP_APRON, d = Math.hypot(Math.max(0, A[0] - lx, lx - A[1]), Math.max(0, A[2] - y, y - A[3])); if (d >= 12) continue;
      if (s.lev !== undefined && y < A[2] - 4) continue;   // by the naust: the shore in front of the yard stays as it is
      const top = s.lev !== undefined ? s.lev : QTOP - 0.1; return top + (h - top) * sstep(0, 12, d);
    }
    return h;
  }
  // on a site's ground, where the map's houses and trees go
  function onSite(x, z){
    for (const s of SITES || sitesNow()){ if (Math.abs(x - s.o[0]) > 60 || Math.abs(z - s.o[1]) > 60) continue; const [lx, y] = siteL(s, x, z);
      for (const r of s.clear) if (lx >= r[0] && lx <= r[2] && y >= r[1] && y <= r[3]) return true; }
    return false;
  }
  // a height layer (the tiles' ground 'view', the far heights 'far') at x, z (m) between the four nearest cells, or NaN where a cell is
  // off the layer or its tile has no pack of that kind or it is not in yet: the edges of the tiles, and before the pack comes, so the
  // view never reads a block that is not there. A tile whose pack is in is remembered.
  // (a number for the key and the last tile kept per kind: the string keys cost more than the lookups they guarded)
  const TIN = new Set(), TLAST = {view:NaN, far:NaN};
  function tileIn(kind, tx, ty){ const k = (kind === 'far' ? 1e7 : 0) + tx * 4096 + ty; if (TLAST[kind] === k || TIN.has(k)){ TLAST[kind] = k; return true; } const pk = MAPD.byTile.get(kind + ':' + tx + ':' + ty); if (pk && pk.buf){ TIN.add(k); TLAST[kind] = k; return true; } return false; }
  function tileH(L, kind, x, z){
    const cm = L.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, ct = Math.round(MAPD.man.tile / L.c);
    if (ix < L.ix0 || iz < L.iy0 || ix + 1 >= L.ix0 + L.nx || iz + 1 >= L.iy0 + L.ny) return NaN;
    const a0 = Math.floor(ix / ct), a1 = Math.floor((ix + 1) / ct), b0 = Math.floor(iz / ct), b1 = Math.floor((iz + 1) / ct);
    if (!tileIn(kind, a0, b0) || (a1 !== a0 && !tileIn(kind, a1, b0)) || (b1 !== b0 && (!tileIn(kind, a0, b1) || !tileIn(kind, a1, b1)))) return NaN;
    return ((rcell(L, ix, iz) * (1 - fx) + rcell(L, ix + 1, iz) * fx) * (1 - fz) + (rcell(L, ix, iz + 1) * (1 - fx) + rcell(L, ix + 1, iz + 1) * fx) * fz) * L.k;
  }
  function terrH(x, z){ return unitTerr(x, z, terrRaw(x, z)); }
  // The ground round a harbour unit (UNITS, 01-world.js), in its frame (lx along the face, lz out to the water): the basin in front is
  // dredged to 6.6 m below mean sea level and rises 1 in 2 outside it; the fill behind the block (U.f) is flat at the deck's height and
  // its sides slope 1 in 1.6 down to the seabed; land higher than the deck beside and behind them is cut down to it and goes back to
  // what it was within UNIT_REACH m, and the low land round them is raised over the highest tide (TIDE_C reaches 1.55 m; the map's land
  // is 0.5 m and up, so it flooded behind the quays, 04.10.2026), as harbour land is built up, going back to what it was within
  // UNIT_LIFT m. The seabed reaches the block's walls' foot (9 m down). Inside the block nothing is drawn (the fine patch has a hole
  // there). h0 is the ground without the unit.
  const UNIT_REACH = 22, UNIT_LIFT = 45, UNIT_FINE = UNIT_LIFT + 20, UNIT_TOP = QTOP - 0.05;
  function unitTerr(x, z, h0){
    if (!harbourNear(x, z)) return h0;
    for (const U of UNITA){
      if (Math.abs(x - U.o[0]) > 160 || Math.abs(z - U.o[1]) > 160) continue;
      const g = ugeo(U), [lx, lz] = unitL(U, x, z), ax = Math.abs(lx), dx = Math.max(0, ax - g.E);
      if (lz >= 0){
        const dO = Math.hypot(Math.max(0, ax - g.basinX), Math.max(0, lz - g.basinZ));
        if (dO < UNIT_REACH){
          let h = Math.min(h0, -g.dredge + 0.5 * dO); if (lz < 6 && dx < 3) h = Math.max(h, g.bot);
          return h + (h0 - h) * sstep(UNIT_REACH - 8, UNIT_REACH, dO);
        }
      }
      const dB = blockOut(lx, lz, g), dF = fillOut(U, lx, lz), dG = Math.min(dB, dF);
      if (!dB) return g.bot;
      if (dG >= UNIT_LIFT) continue;
      if (!dF) return Math.max(UNIT_TOP, Math.min(h0, UNIT_TOP + 0.45 * dB));   // on the fill: flat, or rising with the land behind it
      let h = Math.min(h0, UNIT_TOP + 0.45 * dG); h = h + (h0 - h) * sstep(UNIT_REACH - 8, UNIT_REACH, dG);
      if (h0 < UNIT_TOP) h = Math.max(h, h0 + (UNIT_TOP - h0) * sstep(UNIT_LIFT, UNIT_LIFT - 15, dG) * sstep(-0.5, 0.5, h0));
      h = Math.max(h, UNIT_TOP - 0.62 * dF);
      if (dB < 3) h = Math.max(h, g.bot);
      return h;
    }
    return h0;
  }
  // the coarse terrain sinks out of sight where a unit's fine patch takes over and cuts the ground down (unitPatch draws it)
  function terrCoarse(x, z, dil){
    const h0 = terrRaw(x, z, dil);
    if (!harbourNear(x, z)) return h0;
    for (const U of UNITA){ if (Math.abs(x - U.o[0]) > 160 || Math.abs(z - U.o[1]) > 160) continue;
      const [lx, lz] = unitL(U, x, z), ax = Math.abs(lx), g = ugeo(U);
      const d = lz >= 0 ? Math.min(Math.hypot(Math.max(0, ax - g.basinX), Math.max(0, lz - g.basinZ)), groundOut(U, lx, lz)) : groundOut(U, lx, lz);
      if (d < UNIT_REACH) return -14; }
    return h0;
  }
  // share of forest around a point: bilinear over the 50 m forest cells, softened over the neighbours
  function forestAt(x, z){
    if (!HG) return 0;
    const LF = MAPD.L.forest, cm = LF.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz; let s = 0;
    const ct = Math.round(MAPD.man.tile / LF.c), tx = Math.floor((ix - 1) / ct), tz = Math.floor((iz - 1) / ct);
    // the 4 x 4 cells in one tile (nearly always): its pack is asked once; at a tile's edge, cell by cell
    const one = tx === Math.floor((ix + 2) / ct) && tz === Math.floor((iz + 2) / ct) && mapIn(LF, ix - 1, iz - 1) && mapIn(LF, ix + 2, iz + 2);
    if (one && !tileIn('view', tx, tz)) return 0;
    if (!one && !mapViewIn({x:x / 1000, y:z / 1000})) return 0;
    const F = one ? (c, r) => rcell(LF, c, r) : (c, r) => (!mapIn(LF, c, r) || !tileIn('view', Math.floor(c / ct), Math.floor(r / ct))) ? 0 : rcell(LF, c, r);
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++){ const wx = dx <= 0 ? (dx === 0 ? 1 - fx * 0.5 : 0.5 - fx * 0.5) : (dx === 1 ? 0.5 + fx * 0.5 : fx * 0.5), wz = dz <= 0 ? (dz === 0 ? 1 - fz * 0.5 : 0.5 - fz * 0.5) : (dz === 1 ? 0.5 + fz * 0.5 : fz * 0.5); s += F(ix + dx, iz + dz) * wx * wz; }
    return clamp(s / 2.25, 0, 1);
  }
  // The land cover round a point (the 'cover' layer, G1 of docs/planer/grafikk-natur-og-miljo.md: Overture's detailed land cover from
  // ESA WorldCover with OpenStreetMap's natural areas and land use over it, tools/map/region.py cover; a class per 50 m cell, 1 forest ... 12 shingle): the share of each class among the land cells of the 4 x 4 cells
  // forestAt reads, weighted as it weighs them, into cv at k * 9 (0-255), and ck[k] = 1. Where the layer has no block (a tile from a
  // release before it, outside Norway) or no land cell has a class, ck[k] = 0 and recolor keeps the rules from before.
  const COVN = 12, COVS = 15, COVW = new Float32Array(COVN), COVB = {k:NaN, t:0};   // COVS: a point's bytes in cv, the 12 classes' shares and the satellites' summer colour (G3)
    // the last block check that found them all, kept a second (a mesh asks the same few blocks for every point)
  function coverAt(x, z, cv, ck, k){
    ck[k] = 0; const LC = MAPD.L.cover; if (!HG || !LC) return;
    const cm = LC.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, n = LC.n;
    if (!mapIn(LC, ix - 1, iz - 1) || !mapIn(LC, ix + 2, iz + 2)) return;
    const b0 = Math.floor((ix - 1) / n), b1 = Math.floor((ix + 2) / n), c0 = Math.floor((iz - 1) / n), c1 = Math.floor((iz + 2) / n);
    const bk = ((b0 * 8192 + c0) * 2 + (b1 - b0)) * 2 + (c1 - c0), now = performance.now();
    // only a yes is kept (a second): a no is asked again, since the pack may come in the meantime and the mesh be built again at once
    // (kept, a fine mesh built just after its pack came had no land cover: a lighter square a kilometre wide at Hammerfest, 28.10.2026)
    if (bk !== COVB.k || now - COVB.t > 1000){ for (let by = c0; by <= c1; by++) for (let bx = b0; bx <= b1; bx++) if (!mapHasBlock(LC, bx, by)) return; COVB.k = bk; COVB.t = now; }
    satAt(x, z, cv, k * COVS + 12);
    COVW.fill(0); let s = 0;
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++){
      const v = rcell(LC, ix + dx, iz + dz); if (!v || v > COVN) continue;
      const wx = dx <= 0 ? (dx === 0 ? 1 - fx * 0.5 : 0.5 - fx * 0.5) : (dx === 1 ? 0.5 + fx * 0.5 : fx * 0.5), wz = dz <= 0 ? (dz === 0 ? 1 - fz * 0.5 : 0.5 - fz * 0.5) : (dz === 1 ? 0.5 + fz * 0.5 : fz * 0.5);
      COVW[v - 1] += wx * wz; s += wx * wz;
    }
    if (s < 1e-3) s = coverRing(LC, ix, iz);   // no class in the 4 x 4 cells (nearer the shore than ESA's polygons reach): the nearest ring
    if (s < 1e-3) return;
    for (let c = 0; c < COVN; c++) cv[k * COVS + c] = Math.round(COVW[c] / s * 255);
    ck[k] = 1;
  }
  // the satellites' summer colour at a point (G3: the layers sr, sg, sb, Sentinel-2's median of the clear days from mid June to August,
  // the scenes' own sun taken out, 1-255, 0 where there is none) into cv at o, o + 1, o + 2: the 2 x 2 nearest 50 m cells that have it,
  // weighted bilinearly; 0, 0, 0 where none has it (the sea, outside Norway, a release before the layer). The blocks are the cover's.
  function satAt(x, z, cv, o){
    cv[o] = cv[o + 1] = cv[o + 2] = 0; const R = MAPD.L.sr, G = MAPD.L.sg, B = MAPD.L.sb; if (!R || !G || !B) return;
    const cm = R.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
    if (!mapIn(R, ix, iz) || !mapIn(R, ix + 1, iz + 1) || !covBlk(R, Math.floor(ix / R.n), Math.floor(iz / R.n)) || !covBlk(R, Math.floor((ix + 1) / R.n), Math.floor((iz + 1) / R.n))) return;
    let r = 0, g = 0, b = 0, w = 0;
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++){
      const v = rcell(R, ix + dx, iz + dz); if (!v) continue; const q = (dx ? fx : 1 - fx) * (dz ? fz : 1 - fz) + 1e-4;
      r += v * q; g += rcell(G, ix + dx, iz + dz) * q; b += rcell(B, ix + dx, iz + dz) * q; w += q;
    }
    if (w > 0.05){ cv[o] = Math.max(1, Math.round(r / w)); cv[o + 1] = Math.max(1, Math.round(g / w)); cv[o + 2] = Math.max(1, Math.round(b / w)); }
  }
  // a block of the cover layer that is there, kept a second (positives only, as COVB)
  const COVK = new Map();
  function covBlk(LC, bx, by){ const key = bx * 8192 + by, t = COVK.get(key), now = performance.now(); if (t && now - t < 1000) return true; if (!mapHasBlock(LC, bx, by)) return false; if (COVK.size > 64) COVK.clear(); COVK.set(key, now); return true; }
  // the classes of the nearest ring of cells (2 to 10 cells out, 100-500 m) that has any, counted into COVW; the sum (0 if none). The
  // land within 50-100 m of the shore often has no class (ESA's polygons stop short of OpenStreetMap's coastline), and the old rule
  // there made dark patches and bands where the fells are bare (Hammerfest, 28.10.2026)
  function coverRing(LC, ix, iz){
    const n = LC.n; let s = 0;
    for (let r = 2; r <= 10 && s === 0; r++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx += (dz === -r || dz === r) ? 1 : 2 * r){
      const cx = ix + dx, cz = iz + dz; if (!mapIn(LC, cx, cz) || !covBlk(LC, Math.floor(cx / n), Math.floor(cz / n))) continue;
      const v = rcell(LC, cx, cz); if (v && v <= COVN){ COVW[v - 1]++; s++; }
    }
    return s;
  }
  // the land cover's class at a point (the nearest 50 m cell, 1 forest ... 12 shingle), 0 for land with none, -1 where the layer has no
  // block there (the trees keep their old rule)
  function coverClass(x, z){
    const LC = MAPD.L.cover; if (!HG || !LC) return -1;
    const cm = LC.c * 1000, ix = Math.floor(x / cm), iz = Math.floor(z / cm);
    if (!mapIn(LC, ix, iz) || !mapHasBlock(LC, Math.floor(ix / LC.n), Math.floor(iz / LC.n))) return -1;
    const v = rcell(LC, ix, iz); if (v) return v;
    // land with no class: the most common class of the nearest ring that has any (coverRing)
    COVW.fill(0); if (!coverRing(LC, ix, iz)) return 0; let b = 0; for (let c = 1; c < COVN; c++) if (COVW[c] > COVW[b]) b = c; return b + 1;
  }
  // A mesh is built in three parts so it can be done a few rows a frame (meshTask): the heights row by row, then the normals, the
  // indices and the buffers at once. makeMesh does it all in one go.
  function meshBegin(x0, z0, sx, sz, n, hf){
    const N = n * n;
    return {x0, z0, sx, sz, n, hf:hf || terrH, dx:sx / (n - 1), dz:sz / (n - 1), j:0, pos:new Float32Array(N * 3), h:new Float32Array(N), nz:new Float32Array(N), fo:new Float32Array(N), cv:new Uint8Array(N * COVS), ck:new Uint8Array(N)};
  }
  function meshRows(B, until){
    const {x0, z0, n, dx, dz, hf, pos, h, nz, fo, cv, ck} = B;
    while (B.j < n){
      const j = B.j++;
      for (let i = 0; i < n; i++){
        const k = j * n + i, x = x0 + i * dx, z = z0 + j * dz, y = hf(x, z);
        h[k] = y; pos[k * 3] = i * dx; pos[k * 3 + 1] = y; pos[k * 3 + 2] = j * dz; nz[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z); if (y > 0) coverAt(x, z, cv, ck, k); else ck[k] = 0;   // (the sea has no class: its points would search the rings for nothing)
      }
      if (performance.now() > until) break;
    }
    return B.j >= n;
  }
  function meshEnd(B){
    const {x0, z0, sx, sz, n, dx, dz, pos, h, nz, fo, cv, ck} = B, N = n * n, slope = new Float32Array(N), nor = new Float32Array(N * 3);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, hx = (h[j * n + Math.min(n - 1, i + 1)] - h[j * n + Math.max(0, i - 1)]) / (2 * dx), hz = (h[Math.min(n - 1, j + 1) * n + i] - h[Math.max(0, j - 1) * n + i]) / (2 * dz);
      slope[k] = Math.hypot(hx, hz); const nl = Math.hypot(hx, 1, hz); nor[k * 3] = -hx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -hz / nl;
    }
    const big = N > 65536, idx = big ? new Uint32Array((n - 1) * (n - 1) * 6) : new Uint16Array((n - 1) * (n - 1) * 6); let q = 0;   // 32-bit on ultra (UINT)
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++){ const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    const col = new Float32Array(N * 3), m = {pb:buf(pos), cb:buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), nb:buf(nor), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, i32:big, h, nz, slope, fo, cv, ck, col, mat:new Float32Array(N * 4), x0, z0, sx, sz, pos, nor, gn:n, o:[x0, z0], sh:new Float32Array(N).fill(1)}; m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.mb = buf(m.mat, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.shKey = '';
    recolor(m, snowNow == null ? 0 : snowNow);
    return m;
  }
  function makeMesh(x0, z0, sx, sz, n, hf){ const B = meshBegin(x0, z0, sx, sz, n, hf); meshRows(B, Infinity); return meshEnd(B); }
  function freeMesh(m){ if (m.parts){ m.parts.forEach(freeMesh); return; } gl.deleteBuffer(m.pb); gl.deleteBuffer(m.cb); gl.deleteBuffer(m.ib); if (m.nb) gl.deleteBuffer(m.nb); if (m.sb) gl.deleteBuffer(m.sb); if (m.mb) gl.deleteBuffer(m.mb); if (m.vb) gl.deleteBuffer(m.vb); }
  // the near terrain's own surface at x, z (its triangles over the ground without the units), so a fine patch meets it exactly
  function nearSurf(M, x, z){
    const n = M.gn, d = M.sx / (n - 1), gx = clamp((x - M.x0) / d, 0, n - 1.001), gz = clamp((z - M.z0) / d, 0, n - 1.001), i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
    const X = i * d + M.x0, Z = j * d + M.z0, H = (a, b) => terrRaw(X + a * d, Z + b * d, d);
    return fx + fz <= 1 ? H(0, 0) + (H(1, 0) - H(0, 0)) * fx + (H(0, 1) - H(0, 0)) * fz : H(1, 1) + (H(0, 1) - H(1, 1)) * (1 - fx) + (H(1, 0) - H(1, 1)) * (1 - fz);
  }
  // The fine ground round a harbour unit: a grid in the unit's frame, lined up with the quay's walls (1.6-4 m apart), over the block, its
  // fill and UNIT_FINE m round them, with a hole where the block stands. Its outer part lies on the near terrain's own triangles, so
  // the two meet; the near terrain sinks under it (terrCoarse), and it is drawn with a little offset so it wins where they coincide.
  // The fill and the flat harbour land right by the ground are paved (pv: asphalt and gravel). Rebuilt with the near terrain.
  let UPATCH = [];
  function unitPatch(U, M){
    const UG = ugeo(U), E = UG.E, B = UG.B, F = UNIT_FINE, span = (a, b, k) => Array.from({length:k + 1}, (_, i) => a + (b - a) * i / k);
    let X0 = -E, X1 = E, Z0 = -B; if (U.f) for (let i = 0; i < U.f.length; i += 2){ X0 = Math.min(X0, U.f[i]); X1 = Math.max(X1, U.f[i]); Z0 = Math.min(Z0, U.f[i + 1]); }
    const xs = [...span(X0 - F, X0, 22), ...span(X0, X1, Math.ceil((X1 - X0) / 1.6)).slice(1), ...span(X1, X1 + F, 22).slice(1)];
    const zs = [...span(Z0 - F, Z0, 22), ...(Z0 < -B ? span(Z0, -B, Math.ceil((-B - Z0) / 2.5)).slice(1) : []), ...span(-B, 0, 14).slice(1), ...span(0, UG.basinZ + F, 34).slice(1)];
    const nx = xs.length, nz = zs.length, N = nx * nz, pos = new Float32Array(N * 3), h = new Float32Array(N), nzA = new Float32Array(N), slope = new Float32Array(N), nor = new Float32Array(N * 3), fo = new Float32Array(N), pv = new Float32Array(N), cv = new Uint8Array(N * COVS), ck = new Uint8Array(N);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      const k = j * nx + i, w = unitW(U, xs[i], zs[j]), x = w[0], z = w[1], y = unitTerr(x, z, nearSurf(M, x, z));
      h[k] = y; pos[k * 3] = x - U.o[0]; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z - U.o[1]; nzA[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z); if (y > 0) coverAt(x, z, cv, ck, k); else ck[k] = 0;
      const dF = fillOut(U, xs[i], zs[j]), dG = Math.min(dF, blockOut(xs[i], zs[j], UG));
      pv[k] = dF < 0.5 ? 1 : dG < 14 && Math.abs(y - UNIT_TOP) < 0.25 ? 0.85 * sstep(14, 4, dG) : 0;
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      const k = j * nx + i, i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1);
      const hx = (h[j * nx + i1] - h[j * nx + i0]) / (xs[i1] - xs[i0]), hz = (h[j1 * nx + i] - h[j0 * nx + i]) / (zs[j1] - zs[j0]);
      slope[k] = Math.hypot(hx, hz); const wx = -hx * U.u[0] - hz * U.n[0], wz = -hx * U.u[1] - hz * U.n[1], nl = Math.hypot(wx, 1, wz); nor[k * 3] = wx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = wz / nl;
    }
    const idx = []; for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++){
      if (xs[i] >= -E - 1e-6 && xs[i + 1] <= E + 1e-6 && zs[j] >= -B - 1e-6 && zs[j + 1] <= 1e-6) continue;   // the quay's own block
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
    const col = new Float32Array(N * 3), m = {pb:buf(pos), cb:buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), nb:buf(nor), ib:buf(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER), n:idx.length, h, nz:nzA, slope, fo, cv, ck, pv, col, mat:new Float32Array(N * 4), pos, nor, unit:U.id, o:[U.o[0], U.o[1]], sh:new Float32Array(N).fill(1)};
    m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.mb = buf(m.mat, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.shKey = '';
    recolor(m, snowNow == null ? 0 : snowNow);
    return m;
  }
  function buildPatches(){
    for (const m of UPATCH) freeMesh(m); UPATCH = [];
    if (!NEARM) return;
    const inF = U => FINEM && U.o[0] > FINEM.x0 + 120 && U.o[0] < FINEM.x0 + FINEM.sx - 120 && U.o[1] > FINEM.z0 + 120 && U.o[1] < FINEM.z0 + FINEM.sz - 120;
    for (const U of UNITA) if (U.o[0] > NEARM.x0 + 200 && U.o[0] < NEARM.x0 + NEARM.sx - 200 && U.o[1] > NEARM.z0 + 200 && U.o[1] < NEARM.z0 + NEARM.sz - 200) UPATCH.push(unitPatch(U, inF(U) ? FINEM : NEARM));
  }
  // The far terrain: a window of TERRW.span round the boat (phase K8; it was Senja's square), on a grid of TERRW.snap, built again when
  // the boat is TERRW.move from its middle or new packs have come; the far sea and the wide sea-state map follow it
  const TERRW = {spans:[100000, 100000, 100000, 160000], span:100000, snap:10000, move:20000};
  function buildTerrain(){
    const p = bv.x || bv.z ? {x:bv.x, z:bv.z} : {x:S.boat.pos.x * 1000, z:S.boat.pos.y * 1000}, cx = Math.round(p.x / TERRW.snap) * TERRW.snap, cz = Math.round(p.z / TERRW.snap) * TERRW.snap;
    const old = TERR;
    TERRW.span = TERRW.spans[QUAL.lvl];
    TERR = makeMesh(cx - TERRW.span / 2, cz - TERRW.span / 2, TERRW.span, TERRW.span, QUAL.farN[QUAL.lvl]); TERR.cx = cx; TERR.cz = cz; shSeed(TERR, old); if (old) freeMesh(old);
  }
  // the packs the view needs round the boat: the far heights over the far terrain's window, the tiles' ground (and forest) over the
  // middle terrain's; when they come the meshes over them are built again. Asked at most every 2 s.
  let streamT = -1e9;
  function stream3d(){
    const now = performance.now(); if (now - streamT < 2000) return; streamT = now;
    const x = bv.x / 1000, z = bv.z / 1000, F = TERRW.span / 2000 + 10, V = 14;
    for (const [kind, R] of [['far', F], ['view', V], ['vec', V]]) for (const pk of mapPacksIn(kind, x - R, z - R, x + R, z + R)){
      if (pk.buf || pk.want3d) continue; pk.want3d = true;
      mapLoad(pk).then(() => { pk.want3d = false; if (kind === 'vec') vecTile(pk.tile[0], pk.tile[1]); else staleOver(pk); }, e => { pk.want3d = false; console.error(e); });
    }
    for (const pk of mapPacksIn('vec', x - V, z - V, x + V, z + V)) if (pk.buf) vecTile(pk.tile[0], pk.tile[1]);
    // the fine coast round the camera (01d-coast.js): the ground meets the sea at its line, and the land mask is drawn from it
    for (const pk of mapPacksIn('chart', x - V, z - V, x + V, z + V)){ if (pk.coast || pk.want3d) continue; pk.want3d = true; coastEnsure(pk).then(() => { pk.want3d = false; staleOver(pk); }, e => { pk.want3d = false; console.error(e); }); }
    vecPrune([{x, y:z}, {x:lastEye[0] / 1000, y:lastEye[2] / 1000}]);
    tileStatics(); marksStatics();
  }
