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
      const bp = f.out === undefined && !f.dock ? berthPose(id, s.vtype) : null, o = f.dock ? 0 : bp ? bp.face.out : f.out || 0;
      const B = s.B || 3, T = (VESSELS[s.vtype] || {}).draft || 1.5, d = Math.max(3, T + 1), a1 = s.L / 2 + 1 + 3, w = o + B + 6, tp = d / NPIT.slope, r = Math.hypot(a1 + tp, w + tp) + 1;
      BPIT.l.push({x:f.x, z:f.z, ux:f.ux, uz:f.uz, nx:f.nx, nz:f.nz, a1, o, w, tp, d, x0:f.x - r, x1:f.x + r, z0:f.z - r, z1:f.z + r}); }
    // (the ground round the berths that came or went is made again: the terrain chunks within 700 m and the near and fine meshes)
    const moved = was.filter(q => !BPIT.l.some(p => p.x === q.x && p.z === q.z)).concat(BPIT.l.filter(q => !was.some(p => p.x === q.x && p.z === q.z)));
    if (!moved.length) return;
    for (const [kk, c] of CH) if (moved.some(q => Math.hypot(c.x - q.x, c.z - q.z) < 700)){ freeChunk(c); CH.delete(kk); }
    staleMesh('near'); staleMesh('fine');
  }
  // The coast's own boats at their quay berths (05-vessels.js moorHarbour, 4.16b) and Senja's fleet at theirs (fleetBerth) stood on the
  // same bank: in front of a berth at a quay that stands in 3D (L1: the berth carries its face, moored.face) the ground goes down the
  // same way, where it stands over -1.2 m under the hull, out to her side and 6 m and along her length and 3 m (but see below: since
  // 03.11.2026 only under water, from the front of the quay built out to her). A dock, a buoy or no place digs nothing. The
  // places are fixed again only when packs or coast indexes come (MOOR.ver), so the set changes rarely: it is looked at every 30th
  // frame for the harbours within 2.5 km of the boat, and kept in 64 m cells.
  // Since 03.11.2026 (Jonas: «NPC båtene langs hele kysten ligger ved utgravd landmasse, ikke ekte modellerte kaier»): nothing over the
  // sea is dug any more. The boat lies as far out as the quay is built out over the shore (face.out, quayOut in core/07-harbours.js),
  // and drawDocks draws that quay from the shore out to her; only the sea bed that is under water already (NPIT.wet) goes down, from
  // the quay's front out past her, and it comes up again at NPIT.slope round the edges, so no wall stands anywhere.
  const NPIT = {k:'', l:[], g:new Map(), off:false, n:0, wet:-0.2, slope:0.6};
  function npcPits(){
    if (++NPIT.n % 30 || typeof MOOR === 'undefined' || !VEC.tiles.size) return;
    const R = 2500, ex = bv.x, ez = bv.z, B = []; let k = MOOR.ver + ':';
    for (const tl of vecTilesIn(ex - R, ez - R, ex + R, ez + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - ex, h.y * 1000 - ez) < R){ k += Math.round(h.x * 1000) + ',' + Math.round(h.y * 1000) + ';'; for (const b of h.boats) if (b.moored && b.moored.face) B.push({f:b.moored.face, L:b.L, B:b.B, T:b.T}); }
    if (typeof FLEET !== 'undefined' && typeof fleetBerth === 'function') FLEET.forEach((f, i) => { if (Math.hypot(f.hp[0] * 1000 - ex, f.hp[1] * 1000 - ez) > R + 600) return; const m = fleetBerth(i); if (m && m.face){ B.push({f:m.face, L:f.L, B:f.B, T:f.T}); k += 'f' + i + ':' + Math.round(m.face.x) + ',' + Math.round(m.face.z) + ';'; } });
    if (k === NPIT.k) return;
    const was = NPIT.l; NPIT.k = k; NPIT.l = []; NPIT.g = new Map(); NPIT.off = true;
    for (const q of B){ const f = q.f, B2 = q.B || 3, L = q.L || 10, o = f.out || 0, px = f.x + f.nx * (o + B2 / 2 + 0.4), pz = f.z + f.nz * (o + B2 / 2 + 0.4);
      if (terrRaw(px, pz) < -1.2) continue;
      const d = Math.max(3, (q.T || 1.5) + 1), a1 = L / 2 + 3, w = o + B2 + 6, tp = d / NPIT.slope, r = Math.hypot(a1 + tp, w + tp) + 1;
      NPIT.l.push({x:f.x, z:f.z, ux:f.ux, uz:f.uz, nx:f.nx, nz:f.nz, a1, o, w, tp, d, x0:f.x - r, x1:f.x + r, z0:f.z - r, z1:f.z + r}); }
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
    // (the held berths as the coast's boats, 03.11.2026: only the sea bed under water, from the front of the quay built out to her)
    if (h < NPIT.wet) for (const q of BPIT.l){ if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) continue;
      const dx = x - q.x, dz = z - q.z, a = Math.abs(dx * q.ux + dz * q.uz), n = dx * q.nx + dz * q.nz;
      if (n < q.o) continue; const e = Math.max(0, a - q.a1, n - q.w); if (e >= q.tp) continue; h = Math.min(h, -q.d + e * NPIT.slope); }
    if (!NPIT.off && h < NPIT.wet){ const L = NPIT.g.get(Math.floor(x / 64) * 65536 + Math.floor(z / 64)); if (L) for (const q of L){ if (x < q.x0 || x > q.x1 || z < q.z0 || z > q.z1) continue;
      const dx = x - q.x, dz = z - q.z, a = Math.abs(dx * q.ux + dz * q.uz), n = dx * q.nx + dz * q.nz;
      if (n < q.o) continue;   // under the quay: its wall stands down to 3 m under the sea there
      const e = Math.max(0, a - q.a1, n - q.w); if (e >= q.tp) continue;
      h = Math.min(h, -q.d + e * NPIT.slope); } }
    return h;
  }
  // ---------- Father's naust and the Finnsnes shop (tools/harbour/naust.py, butikk.py; where: core/07c-naust.js) ----------
  // Each a model set down at a quay face, in its frame: x along the face (s.u), out to sea s.n, y up from mean sea level. The naust
  // stands on the map's own ground as it is (Jonas 01.11.2026: its own bank of 1 m squares «ser for jævlig ut», and «modellen må ikke
  // grave ut landmasse ... Den må ligge oppå landmassen»; naust.py has no ground since): nothing is cut, its piles and posts reach down
  // into the ground, and where the map's ground under the quay deck or the floor stands higher than their undersides, the whole model
  // is lifted over it (s.lift, SFOOT: at most 2.5 m). Only the sea bed in front of its quay goes down (NPITW: where the chart has
  // sea; the shore of the map falls 1 in 3 from the coast line, which had the boat dry on the foreshore), as in front of a held berth
  // (BPIT): to her draught and a metre (at least 3 m), 16 m each way along the face and her beam and 8 m out, back within 8 m.
  // The rorbuer the same since the same day (Jonas: «Fiks samme løsning for de andre relevante byggene også»; rorbu.py has no bank):
  // lifted over the map's ground by their quay, cabin and veranda (SFOOT.rorbu), the sea bed down in front of their quay (14 m each way).
  // The shop's yard (anchors.apron, from the deck's back to 27.5 m in) is levelled 0.1 m under the deck and goes back within 12 m. The
  // map's houses on their ground go (onSite, in bldOnUnit) and so do the scattered trees. Drawn in full within 900 m, simply to 4 km.
  const SHOP_APRON = [-19, 19, 9.6, 27.5];
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
    const n = typeof naustSite === 'function' ? naustSite() : null, key = (n ? n.o.join(',') + (siteReady(n.o) ? '' : 'w') : '-') + '|' + rorbuNow() + RBNEAR.l.map(R => siteReady(R.site.o) ? '' : 'w').join('') + '|' + S.boat.type;
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
    // (the pit as deep as the simulation dredges the berth, SITE_DRAFT and half a metre at the lowest tide, below mean sea level: siteDredge,
    // 13.11.2026; a boat up to 15 m lies there whatever she draws)
    const V = VESSELS[S.boat.type] || {}, pit = a => ({d:Math.max(3, (V.draft || 1.5) + 1, SITE_DRAFT + 0.5 + tideZC()), w:Math.max((V.beam || 3) + 8, SITE_POCK.w), a});
    if (n && glbHas('naust')){ const nn = [-n.u[1], n.u[0]];
      SITES.push({k:'naust', o:n.o, u:n.u, n:nn, lift:siteLift(SFOOT.naust, n.o, n.u, nn), pit:pit(16), clear:[[-14, -1, 14, 16]]}); }
    // the rorbuer within 4 km of the boat (07d-rorbu.js; tools/harbour/rorbu.py), each in its colour; the model's 'clear' is where the
    // map's houses go
    if (glbHas('rorbu')) for (const R of RBNEAR.l){ const o = R.site.o, u = R.site.u, n = [-u[1], u[0]], M = siteModel('rorbu:' + R.v);
      SITES.push({k:'rorbu', v:R.v, id:R.id, o, u, n, lift:siteLift(SFOOT.rorbu, o, u, n), pit:pit(14), clear:[[-15, -1, 15, 21]]});
      // its bollards (the model's anchors, x along the face and z out to sea) take the mooring lines (drawMooring)
      if (M && M.A.bollards) QB[faceKey({x:o[0], z:o[1]})] = M.A.bollards.map(q => ({x:o[0] + u[0] * q[0] + n[0] * q[2], z:o[1] + u[1] * q[0] + n[1] * q[2], a:q[0]})); }
    // a site that came after the ground round it was built: those terrain chunks and the near mesh are made again with its ground
    if (SITEK){ for (const [k, c] of CH) if (SITES.some(q => Math.hypot(c.x - q.o[0], c.z - q.o[1]) < 700)){ freeChunk(c); CH.delete(k); }
      if (NEARM) NEARM.stale = true; }
    return SITES;
  }
  // how far a naust or a rorbu must be lifted to stand on the map's ground, 0.1 m clear of it: [x0, x1, y0, y1 inland, the underside]
  // per part. The naust: its quay deck (QTOP - 0.55, naust.py QUAY) and its floor's sills (QTOP - 0.22, NX0..NY1); the rorbu: its quay
  // deck (QTOP - 0.5, rorbu.py QUAY), the cabin's floor beams (FLOOR - 0.58, RX0..RY1) and the veranda's beams (VFLOOR - 0.27, VX0..VYS).
  // Worked out again once the packs of heights round it are in (siteReady is in SITEK; off the tiles with no pack, the far heights)
  const SFOOT = {naust:[[-8.6, 7.6, 0.4, 3.4, QTOP - 0.55], [-5.9, 5.9, 3.4, 9.4, QTOP - 0.22]],
    rorbu:[[-7, 7, 0.4, 3.5, QTOP - 0.5], [-3.25, 3.25, 5.2, 13.2, QTOP + 0.22], [-3.45, 4.75, 3.5, 8.6, QTOP + 0.48]]};
  const siteReady = o => { const T = MAPD.man.tile * 1000; for (const k of ['view', 'far']) for (const dx of [-25, 25]) for (const dz of [-25, 25]){
    const pk = MAPD.byTile.get(k + ':' + Math.floor((o[0] + dx) / T) + ':' + Math.floor((o[1] + dz) / T)); if (pk && !pk.buf) return false; } return true; };
  function siteLift(F, o, u, nn){
    let lift = 0;
    for (const [x0, x1, y0, y1, under] of F) for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 6) for (let y = y0; y <= y1 + 0.01; y += (y1 - y0) / 3){
      const px = o[0] + u[0] * x - nn[0] * y, pz = o[1] + u[1] * x - nn[1] * y;
      lift = Math.max(lift, terrRaw(px, pz) + 0.1 - under);
    }
    return Math.min(lift, 2.5);
  }
  // a point in a site's frame: [x along the face, y inland]
  const siteL = (s, x, z) => { const dx = x - s.o[0], dz = z - s.o[1]; return [dx * s.u[0] + dz * s.u[1], -(dx * s.n[0] + dz * s.n[1])]; };
  function siteTerr(x, z, h){
    const L = SITES || sitesNow(); if (!L.length) return h;
    for (const s of L){
      if (Math.abs(x - s.o[0]) > 70 || Math.abs(z - s.o[1]) > 70) continue;
      const [lx, y] = siteL(s, x, z), ax = Math.abs(lx);
      if (s.pit){   // the naust and the rorbuer: on the map's ground as it is (lifted over it: s.lift); only the sea bed in front of the quay goes down
        if (y >= 0.4 || h >= NPIT.wet) continue; const P = s.pit, d = Math.hypot(Math.max(0, ax - P.a + Math.min(0, y) * 10 / (P.w + 6)), Math.max(0, -P.w - y)); if (d >= 8) continue;
        const cap = y <= -1 ? -P.d : -P.d + (y + 1) * (P.d - 0.5) / 1.4;
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
      // on the block's back and sides (unitPatch has a row of points on its walls) the ground is what lies just outside the wall: the fill
      // and the land at the deck's height, or the seabed where the side stands in the water. It was the walls' foot there, so the ground
      // fell 9-14 m in the last 2 m to the wall, in a sawtooth trench along the land side where the sea showed (Jonas 13.11.2026,
      // Engenes verft: «utgravninger og tagger»)
      if (!dB && (Math.abs(lx) > g.E - 0.01 || lz < -g.B + 0.01) && lz < -0.01){
        const w = unitW(U, lx + (Math.abs(lx) > g.E - 0.01 ? Math.sign(lx) * 0.05 : 0), lz < -g.B + 0.01 ? lz - 0.05 : lz);
        return unitTerr(w[0], w[1], h0);
      }
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
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++){ const wx = dx <= 0 ? (dx === 0 ? 1 - fx * 0.5 : 0.5 - fx * 0.5) : (dx === 1 ? 0.5 + fx * 0.5 : fx * 0.5), wz = dz <= 0 ? (dz === 0 ? 1 - fz * 0.5 : 0.5 - fz * 0.5) : (dz === 1 ? 0.5 + fz * 0.5 : fz * 0.5); s += forestCell(one, LF, ct, ix + dx, iz + dz) * wx * wz; }
    return clamp(s / 2.25, 0, 1);
  }
  // (a function, not a closure made for every point: those were a good part of the garbage while the meshes were built, 05.11.2026)
  function forestCell(one, LF, ct, c, r){ return one ? rcell(LF, c, r) : (!mapIn(LF, c, r) || !tileIn('view', Math.floor(c / ct), Math.floor(r / ct))) ? 0 : rcell(LF, c, r); }
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
    const bk = ((b0 * 8192 + c0) * 2 + (b1 - b0)) * 2 + (c1 - c0), now = MNOW || performance.now();
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
  // the satellites' summer colour at a point (G3: Sentinel-2's median of the clear days from mid June to August, the scenes' own sun
  // taken out, coast.py sat_tile) into cv at o, o + 1, o + 2 as R, G, B 1-255; 0, 0, 0 where there is none (the sea, outside Norway, a
  // release before the layers). Packed as luma sy (50 m, 7 bits) and chroma sco, scg (100 m, 6 bits), each + 1, 0 for none: each read
  // over the nearest 2 x 2 cells that have it, weighted bilinearly, and turned back (G = Y + Cg, R = Y - Cg + Co, B = Y - Cg - Co).
  // (Ø3c: the four blocks a point's cells are in, kept per layer as they were found there, SATQ, with the time as COVB keeps it: a mesh's
  // points ask the same block over and over, and each of the four checks asked the clock and a map)
  const SATQ = new Map();
  function satRead(L, x, z){
    const cm = L.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
    if (!mapIn(L, ix, iz) || !mapIn(L, ix + 1, iz + 1)) return -1;
    const b0 = Math.floor(ix / L.n), b1 = Math.floor((ix + 1) / L.n), c0 = Math.floor(iz / L.n), c1 = Math.floor((iz + 1) / L.n);
    const qk = ((b0 * 8192 + c0) * 2 + (b1 - b0)) * 2 + (c1 - c0), now = MNOW || performance.now(); let Q = SATQ.get(L.id); if (!Q) SATQ.set(L.id, Q = {k:NaN, t:0});
    if (qk !== Q.k || now - Q.t > 1000){
      if (!covBlk(L, b0, c0) || !covBlk(L, b1, c0) || !covBlk(L, b0, c1) || !covBlk(L, b1, c1)) return -1;   // (all four: by a block's corner the cells reach into three)
      Q.k = qk; Q.t = now; }
    let v = 0, w = 0;
    for (let dz = 0; dz <= 1; dz++) for (let dx = 0; dx <= 1; dx++){ const c = rcell(L, ix + dx, iz + dz); if (!c) continue; const q = (dx ? fx : 1 - fx) * (dz ? fz : 1 - fz) + 1e-4; v += (c - 1) * q; w += q; }
    return w > 0.05 ? v / w : -1;
  }
  function satAt(x, z, cv, o){
    cv[o] = cv[o + 1] = cv[o + 2] = 0; const SY = MAPD.L.sy, SO = MAPD.L.sco, SG = MAPD.L.scg; if (!SY || !SO || !SG) return;
    const y = satRead(SY, x, z); if (y < 0) return; const co = satRead(SO, x, z), cg = satRead(SG, x, z); if (co < 0 || cg < 0) return;
    const Y = y * 2 + 1, Co = co * 4 + 2 - 128, Cg = cg * 4 + 2 - 128, t = Y - Cg;
    cv[o] = clamp(Math.round(t + Co), 1, 255); cv[o + 1] = clamp(Math.round(Y + Cg), 1, 255); cv[o + 2] = clamp(Math.round(t - Co), 1, 255);
  }
  // a block of the cover layer that is there, kept a second (positives only, as COVB)
  const COVK = new Map();
  function covBlk(LC, bx, by){ const key = (bx * 8192 + by) * 64 + LC.id, t = COVK.get(key), now = MNOW || performance.now(); if (t && now - t < 1000) return true; if (!mapHasBlock(LC, bx, by)) return false; if (COVK.size > 64) COVK.clear(); COVK.set(key, now); return true; }
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
  // A mesh is built in three parts so it can be done a few milliseconds a frame (meshTask): the heights point by point (meshRows stops
  // within a row when its time is up), then the normals, the indices and the colours (meshEndG, a generator that yields when the
  // frame's slice is spent). makeMesh does it all in one go. (05.11.2026: the end, the colours and a whole row at once were 60-160 ms
  // on a PC at a time, 3-4 times that on a phone.)
  // A time slice for the generators that build in steps: SLEND is when the slice ends; runAll runs one to its end at once.
  let SLEND = Infinity;
  // the clock while meshRows works a row (Ø3c, 09.11.2026): coverAt and covBlk keep a block they found for a second, and asked
  // performance.now() for each point to know it; a row is a few milliseconds, so the row's start does. 0 outside meshRows.
  let MNOW = 0;
  const sliceDue = () => performance.now() > SLEND;
  function runAll(g){ const s = SLEND; SLEND = Infinity; let r; try { while (!(r = g.next()).done); } finally { SLEND = s; } return r.value; }
  // one step of a generator until the slice ends at 'end': its value when it is done, else undefined (J.done tells)
  function sliceRun(J, end){ const s = SLEND; SLEND = end; try { const r = J.g.next(); if (r.done){ J.fin = true; return r.value; } } finally { SLEND = s; } }
  function meshBegin(x0, z0, sx, sz, n, hf){
    const N = n * n;
    return {x0, z0, sx, sz, n, hf:hf || terrH, dx:sx / (n - 1), dz:sz / (n - 1), j:0, i:0, pos:new Float32Array(N * 3), h:new Float32Array(N), nz:new Float32Array(N), fo:new Float32Array(N), cv:new Uint8Array(N * COVS), ck:new Uint8Array(N)};
  }
  function meshRows(B, until){
    const {x0, z0, n, dx, dz, hf, pos, h, nz, fo, cv, ck} = B;
    try {
    while (B.j < n){
      const j = B.j; let i = B.i; MNOW = performance.now();
      for (; i < n; i++){
        const k = j * n + i, x = x0 + i * dx, z = z0 + j * dz, y = hf(x, z);
        h[k] = y; pos[k * 3] = i * dx; pos[k * 3 + 1] = y; pos[k * 3 + 2] = j * dz; nz[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z); if (y > 0) coverAt(x, z, cv, ck, k); else ck[k] = 0;   // (the sea has no class: its points would search the rings for nothing)
        if ((i & 31) === 31 && i + 1 < n && (MNOW = performance.now()) > until){ B.i = i + 1; return false; }   // (a row of the far mesh over land was 10-40 ms)
      }
      B.i = 0; B.j++;
      if (performance.now() > until) break;
    }
    } finally { MNOW = 0; }
    return B.j >= n;
  }
  // the triangles of an n x n grid are the same for every mesh of that size: one index buffer per size, shared (m.ibs; freeMesh keeps it)
  const IDXC = new Map();
  function gridIdx(n){
    let c = IDXC.get(n); if (c && c.gl === gl && gl.isBuffer(c.ib)) return c;   // (a context lost before the view was ready takes its buffers)
    const big = n * n > 65536, idx = big ? new Uint32Array((n - 1) * (n - 1) * 6) : new Uint16Array((n - 1) * (n - 1) * 6); let q = 0;   // 32-bit on ultra (UINT)
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++){ const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    c = {gl, ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, i32:big}; IDXC.set(n, c); return c;
  }
  function* meshEndG(B){
    const {x0, z0, sx, sz, n, dx, dz, pos, h, nz, fo, cv, ck} = B, N = n * n, slope = new Float32Array(N), nor = new Float32Array(N * 3);
    for (let j = 0; j < n; j++){
      for (let i = 0; i < n; i++){
        const k = j * n + i, hx = (h[j * n + Math.min(n - 1, i + 1)] - h[j * n + Math.max(0, i - 1)]) / (2 * dx), hz = (h[Math.min(n - 1, j + 1) * n + i] - h[Math.max(0, j - 1) * n + i]) / (2 * dz);
        slope[k] = Math.hypot(hx, hz); const nl = Math.hypot(hx, 1, hz); nor[k * 3] = -hx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -hz / nl;
      }
      if ((j & 15) === 15 && sliceDue()) yield;
    }
    const I = gridIdx(n);
    const col = new Float32Array(N * 3), m = {pb:null, cb:null, nb:null, ib:I.ib, ibs:true, n:I.n, i32:I.i32, h, nz, slope, fo, cv, ck, col, mat:new Float32Array(N * 4), x0, z0, sx, sz, pos, nor, gn:n, o:[x0, z0], sh:new Float32Array(N).fill(1)}; m.shKey = '';
    // the colours into the arrays a slice at a time (recolorG), then the buffers in one go: the mesh is not drawn before it is done
    yield* recolorG(m, snowNow == null ? 0 : snowNow, false);
    m.pb = buf(pos); m.cb = buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.nb = buf(nor); m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.mb = buf(m.mat, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    if (m.cov) m.vb = buf(m.cov, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    return m;
  }
  function meshEnd(B){ return runAll(meshEndG(B)); }
  function makeMesh(x0, z0, sx, sz, n, hf){ const B = meshBegin(x0, z0, sx, sz, n, hf); meshRows(B, Infinity); return meshEnd(B); }
  function freeMesh(m){ if (m.parts){ m.parts.forEach(freeMesh); return; } m.freed = true; gl.deleteBuffer(m.pb); gl.deleteBuffer(m.cb); if (!m.ibs) gl.deleteBuffer(m.ib); if (m.dry){ gl.deleteBuffer(m.dry.ib); m.dry = null; } if (m.nb) gl.deleteBuffer(m.nb); if (m.sb) gl.deleteBuffer(m.sb); if (m.mb) gl.deleteBuffer(m.mb); if (m.vb) gl.deleteBuffer(m.vb); }
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
