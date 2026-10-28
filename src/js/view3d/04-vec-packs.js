  // ---------- the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters ----------
  // When a tile comes in (decoded in the worker), the 1 km chunks on it are built again with its buildings and roads. Its bridges, piers
  // and breakwaters go into a mesh of its own once its heights are in (a deck must start from the real ground), a few at a time in each
  // frame's spare milliseconds (tileStep; Tromsø's tile was half a second at once). All of it goes when the tile is let go (vecPrune).
  const TST = new Map(); let TJOB = null;
  const tileOf = key => { const T = MAPD.man ? MAPD.man.tile : 50; return Math.floor(gridKeyX(key) / T) + ':' + Math.floor(gridKeyY(key) / T); };
  VEC.came.push(t => { for (const [k, c] of CH) if (tileOf(k) === t.k){ freeChunk(c); CH.delete(k); } });
  function tileStatics(){
    if (TJOB) return;
    for (const t of VEC.tiles.values()){
      if (TST.has(t.k)) continue;
      const vp = MAPD.byTile.get('view:' + t.k); if (vp && !vp.buf) continue;
      // the pack's piers and slabs under a harbour unit or a rorbu/naust site are left out (a pier through the quay at Engenes, Lauksletta)
      // and breakwaters that reach onto a unit's ground or into its basin go too, as do piers that reach into the basin (tilbakemelding #45,
      // #46, #50); a slab only partly under the quay keeps the rest (slabInto's cut)
      const under = (x, z) => unitCovers(x, z, 3) || onSite(x, z), slabUnder = pts => { let cx = 0, cz = 0; for (const [x, z] of pts){ if (under(x, z)) return true; cx += x; cz += z; } return under(cx / pts.length, cz / pts.length); };
      const UN = UNITA.filter(U => U.o[0] > t.x0 - 300 && U.o[0] < t.x0 + MAPD.man.tile * 1000 + 300 && U.o[1] > t.z0 - 300 && U.o[1] < t.z0 + MAPD.man.tile * 1000 + 300);
      const onU = (x, z) => UN.some(U => { const [lx, lz] = unitL(U, x, z), g = ugeo(U); return groundOut(U, lx, lz) <= 2 || (Math.abs(lx) <= g.basinX && lz >= 0 && lz <= g.basinZ); });
      const lineOnU = pts => { for (let k = 0; k < pts.length; k++){ const [ax, az] = pts[k], [bx, bz] = pts[Math.min(k + 1, pts.length - 1)], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 3)); for (let s = 0; s <= n; s++) if (onU(ax + (bx - ax) * s / n, az + (bz - az) * s / n)) return true; } return false; };
      const boxOnU = q => { const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang); for (let s = -1; s <= 1; s += 0.25) for (const k of [-1, 0, 1]) if (onU(q.x + ax * s * q.l / 2 + nx * k * q.w / 2, q.z + az * s * q.l / 2 + nz * k * q.w / 2)) return true; return false; };
      const molos = t.molos.map((pts, i) => [pts, i]).filter(([pts]) => !UN.length || !lineOnU(pts));
      // the floating docks among the piers (01c-vec.js flyteTile, by the pier's middle) are built of pontoons, not as piers (floatJob)
      const FD = flyteTile(t.tx, t.ty).filter(d => !under(d.mx, d.mz)), FK = new Set(FD.map(d => Math.round(d.mx) + ':' + Math.round(d.mz)));
      const isF = (x, z) => { if (!FK.size) return false; const rx = Math.round(x), rz = Math.round(z); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (FK.has((rx + a) + ':' + (rz + b))) return true; return false; };
      const slabF = pts => { let cx = 0, cz = 0; for (const [x, z] of pts){ cx += x; cz += z; } return isF(cx / pts.length, cz / pts.length); };
      const piers = t.piers.filter(q => !(q.fm && isF(q.fm[0], q.fm[1])));
      const inBox = (q, x, z) => { const dx = x - q.x, dz = z - q.z, sa = Math.sin(q.ang), ca = Math.cos(q.ang); return Math.abs(dx * sa + dz * ca) <= q.l / 2 && Math.abs(dx * ca - dz * sa) <= q.w / 2; };
      floatFree(t.k); let FJ = null;
      if (FD.length){ const PG = new Map(), pk = (x, z) => Math.floor(x / 100) + ':' + Math.floor(z / 100);   // the fixed piers in 100 m cells
        for (const q of piers) if (!q.bw){ const r = Math.hypot(q.w, q.l) / 2; for (let gx = Math.floor((q.x - r) / 100); gx <= Math.floor((q.x + r) / 100); gx++) for (let gz = Math.floor((q.z - r) / 100); gz <= Math.floor((q.z + r) / 100); gz++){ const k = gx + ':' + gz; let a = PG.get(k); if (!a) PG.set(k, a = []); a.push(q); } }
        FJ = floatJob(t, FD, (x, z) => (PG.get(pk(x, z)) || []).some(q => inBox(q, x, z)) || terrRaw(x, z) > 0.4); }
      const items = [...piers.filter(q => !under(q.x, q.z) && !(UN.length && boxOnU(q))).map(q => m => pierInto(m, q, t.k)), ...t.slabs.filter(pts => !slabUnder(pts) && !slabF(pts)).map(pts => m => slabInto(m, pts, t.k, pts.some(([x, z]) => harbourNear(x, z)) ? (x, z) => unitCovers(x, z, 1) || onSite(x, z) : null)), ...molos.map(([pts, i]) => m => stonesOf(TJOB.stones, sm => moundInto(m, pts, (t.tx * 31 + t.ty) * 7919 + i * 104729, false, t.k, sm))), ...t.bridges.filter(br => !bridgeUnderUnit(br, onSite)).map(br => m => bridgeInto(m, br, t.k))];
      if (FJ) items.push(...FJ.items);
      TJOB = {t, m:MB(), items, i:0, ms:0, stones:[], FJ}; return;
    }
  }
  function tileStep(){
    const J = TJOB; if (!J) return;
    if (!VEC.tiles.has(J.t.k)){ TJOB = null; return; }   // let go meanwhile
    const t0 = performance.now(), end = t0 + MESHMS[QUAL.lvl];
    while (J.i < J.items.length && performance.now() < end) J.items[J.i++](J.m);
    J.ms += performance.now() - t0;
    if (J.i < J.items.length) return;
    const m = J.m, t = J.t; TJOB = null;
    TST.set(t.k, {mesh:m.p.length ? m.mesh([t.x0 + 25000, t.z0 + 25000]) : null, stones:J.stones, ms:J.ms, tris:m.p.length / 9});
    if (J.FJ) FLT.set(t.k, J.FJ.done());
    // the roads on its breakwaters' crests: the chunks under them built again
    for (const [k, l] of MOLOH) if (CH.has(k) && l.some(M => M.tag === t.k)){ freeChunk(CH.get(k)); CH.delete(k); }
  }
  VEC.drop.push(t => {
    const s = TST.get(t.k); if (s && gl){ if (s.mesh) freeMesh(s.mesh); for (const q of s.stones) freeMesh(q.mesh); } TST.delete(t.k); floatFree(t.k);
    if (TJOB && TJOB.t === t && gl) for (const q of TJOB.stones) freeMesh(q.mesh); if (TJOB && TJOB.t === t) TJOB = null; camDropTag(t.k);
    for (const [k, l] of MOLOH){ const b = l.filter(M => M.tag !== t.k); if (b.length) MOLOH.set(k, b); else MOLOH.delete(k); }
    for (const k of [...CAMBLD]) if (typeof k === 'string' && tileOf(+k.slice(1)) === t.k) CAMBLD.delete(k);
    for (const [k, c] of CH) if (tileOf(k) === t.k){ freeChunk(c); CH.delete(k); }
  });
  function drawTileStatics(TM, eye){ drawStones(STONES, TM, eye); for (const s of TST.values()){ if (s.mesh) drawLit(s.mesh, TM); drawStones(s.stones, TM, eye); } for (const mm of MKM.values()) if (mm) drawLit(mm, TM);
    const tide = env.tide || 0; for (const F of FLT.values()) if (F.mesh){ if (F.mesh.parts) for (const q of F.mesh.parts) q.oy = tide; F.mesh.oy = tide; drawLit(F.mesh, TM); } }
  // One terrain mesh is rebuilt at a time, a few rows a frame (MESHMS ms; the near, middle and far meshes were each built in one
  // frame, all three whenever a pack came anywhere, 03.10.2026): the old mesh is drawn until the new one is done. A mesh that does not
  // cover the boat at all (a jump, the first build) is built at once.
  let MJOB = null;
  const MESHMS = [3, 4, 5, 9];
  function meshTask(kind, cur, x0, z0, span, n, hf, done){
    const covers = cur && bv.x > cur.x0 && bv.x < cur.x0 + cur.sx && bv.z > cur.z0 && bv.z < cur.z0 + cur.sz;
    if (!covers){ if (MJOB && MJOB.kind === kind) MJOB = null; done(makeMesh(x0, z0, span, span, n, hf), false); return; }
    if (MJOB && MJOB.kind === kind && MJOB.B.x0 === x0 && MJOB.B.z0 === z0 && MJOB.B.sx === span) return;   // on its way
    // one on its way that will still have the boat well inside is let finish (started again at every new spot of a moving boat it
    // never finished, and the mesh then jumped kilometres at once when she left the old one, and the sea map with it)
    if (MJOB && MJOB.kind === kind){ const B = MJOB.B, m = span * 0.2; if (B.sx === span && bv.x > B.x0 + m && bv.x < B.x0 + span - m && bv.z > B.z0 + m && bv.z < B.z0 + span - m) return; }
    if (MJOB && MJOB.kind !== kind) return;   // another mesh is being built: this one waits its turn
    MJOB = {kind, B:meshBegin(x0, z0, span, span, n, hf), done, dirty:false};
  }
  let FRAMEMS = 16;
  function meshStep(){
    const J = MJOB; if (!J) return;
    // a share of the frame: when the frames are slow anyway the mesh keeps pace with the boat (at most 30 % of a frame, 60 ms)
    if (!meshRows(J.B, performance.now() + Math.max(MESHMS[QUAL.lvl], Math.min(60, 0.3 * FRAMEMS)))) return;
    MJOB = null; J.done(meshEnd(J.B), J.dirty);
  }
  // a pack has come: the meshes over its tile are built again (one being built over it goes again when it is done)
  function staleMesh(kind){ const m = kind === 'near' ? NEARM : kind === 'fine' ? FINEM : kind === 'mid' ? MIDM : TERR; if (m) m.stale = true; if (MJOB && MJOB.kind === kind) MJOB.dirty = true; }
  function staleOver(pk){
    const T = MAPD.man.tile * 1000, x0 = pk.tile[0] * T, z0 = pk.tile[1] * T;
    for (const [m, kind] of [[NEARM, 'near'], [FINEM, 'fine'], [MIDM, 'mid'], [TERR, 'far']]){
      if (MJOB && MJOB.kind === kind){ const B = MJOB.B; if (B.x0 < x0 + T && B.x0 + B.sx > x0 && B.z0 < z0 + T && B.z0 + B.sz > z0) MJOB.dirty = true; }
      if (m && m.x0 < x0 + T && m.x0 + m.sx > x0 && m.z0 < z0 + T && m.z0 + m.sz > z0) m.stale = true;
    }
    // the buildings over the tile stood on the heights there were before: they are built again on the new ground (the houses
    // stood in the snow, sunk into the ground they were built over)
    const tk = pk.tile[0] + ':' + pk.tile[1];
    for (const [k, c] of CH) if (tileOf(k) === tk){ freeChunk(c); CH.delete(k); }
  }
  function updateFar(){
    if (TERR && !TERR.stale && TERR.sx === TERRW.spans[QUAL.lvl] && TERR.gn === QUAL.farN[QUAL.lvl] && Math.abs(bv.x - TERR.cx) < TERRW.move && Math.abs(bv.z - TERR.cz) < TERRW.move) return;
    TERRW.span = TERRW.spans[QUAL.lvl];
    const cx = Math.round(bv.x / TERRW.snap) * TERRW.snap, cz = Math.round(bv.z / TERRW.snap) * TERRW.snap;
    meshTask('far', TERR && TERR.sx === TERRW.span && TERR.gn === QUAL.farN[QUAL.lvl] ? TERR : null, cx - TERRW.span / 2, cz - TERRW.span / 2, TERRW.span, QUAL.farN[QUAL.lvl], null, (M, dirty) => { const old = TERR; TERR = M; TERR.cx = cx; TERR.cz = cz; TERR.stale = dirty; shSeed(TERR, old); if (old) freeMesh(old); });
  }
  // sharp terrain in a 6 km corridor around the boat, rebuilt as it moves. The shadows are marched towards the sun in time slices
  // (SHMS ms a frame: 7 000 points a frame stalled the user's tablet for a third of a second, 03.10.2026): the fine ground near the
  // point, farther out the middle and far meshes' own heights, which are already in memory; ground under the sea is not marched.
  let shT = 0;
  const SHMS = [2, 3, 4, 8];
  function meshH(m, x, z){
    const n = m.gn, d = m.sx / (n - 1), gx = (x - m.x0) / d, gz = (z - m.z0) / d; if (!(gx >= 0 && gz >= 0 && gx < n - 1 && gz < n - 1)) return NaN;
    const i = gx | 0, j = gz | 0, fx = gx - i, fz = gz - j, h = m.h, k = j * n + i;
    return (h[k] * (1 - fx) + h[k + 1] * fx) * (1 - fz) + (h[k + n] * (1 - fx) + h[k + n + 1] * fx) * fz;
  }
  function shadeH(x, z, dd){ if (dd < 400) return terrH(x, z); let h = MIDM && !MIDM.stale ? meshH(MIDM, x, z) : NaN; if (h !== h && TERR) h = meshH(TERR, x, z); return h === h ? h : terrH(x, z); }
  // a new mesh starts with the shadows of the one it replaces where they overlap, so they do not flash while they are worked out
  function shSeed(m, old){
    if (!old || !old.sh || typeof old.x0 !== 'number' || old.gn === undefined) return;
    const n = m.gn, d = m.sx / (n - 1), on = old.gn, od = old.sx / (on - 1);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const gx = (m.x0 + i * d - old.x0) / od, gz = (m.z0 + j * d - old.z0) / od; if (!(gx >= 0 && gz >= 0 && gx <= on - 1 && gz <= on - 1)) continue;
      m.sh[j * n + i] = old.sh[Math.round(gz) * on + Math.round(gx)];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.sb); gl.bufferData(gl.ARRAY_BUFFER, m.sh, gl.DYNAMIC_DRAW);
  }
  function updateShadows(){
    // the sun's direction in steps of 0.03 (it moved 0.01 every 20 s of play at 6x time, and each step started all the meshes again)
    const d = QUAL.lvl ? env.shadowDir : null, key = d ? d.map(v => (Math.round(v / 0.03) * 0.03).toFixed(2)).join(',') : 'flat';   // no shadows on low quality
    const until = performance.now() + SHMS[QUAL.lvl];
    for (const m of [NEARM, FINEM, ...UPATCH, MIDM, TERR]){
      if (!m) continue;
      if (m.shKey !== key && !m.shJob && performance.now() - shT > 1500){ m.shJob = {i:0, key, d}; shT = performance.now(); }
      if (!m.shJob) continue;
      const J = m.shJob, N = m.h.length;
      if (!J.d || J.d[1] <= 0.005){ m.sh.fill(J.d ? 0 : 1, J.i, N); J.i = N; }
      else {
        const hl = Math.hypot(J.d[0], J.d[2]) || 1e-6, dx = J.d[0] / hl, dz = J.d[2] / hl, tE = J.d[1] / hl, far = m === TERR ? 25000 : 9000, st0 = m === TERR ? 160 : m === MIDM ? 60 : 25;
        let k = J.i;
        while (k < N){
          const end = Math.min(N, k + 24);
          for (; k < end; k++){
            const y0 = m.pos[k * 3 + 1]; if (y0 < -1){ m.sh[k] = 1; continue; }
            const x = m.o[0] + m.pos[k * 3], z = m.o[1] + m.pos[k * 3 + 2], y = Math.max(y0, 0) + 2; let lit = 1, dd = st0;
            while (dd < far){ const over = shadeH(x + dx * dd, z + dz * dd, dd) - (y + dd * tE); if (over > 0){ lit = over > 8 ? 0 : 0.35; if (!lit) break; } dd += st0 + dd * 0.07; }
            m.sh[k] = lit;
          }
          if (performance.now() > until) break;
        }
        J.i = k;
      }
      if (J.i >= N){ gl.bindBuffer(gl.ARRAY_BUFFER, m.sb); gl.bufferData(gl.ARRAY_BUFFER, m.sh, gl.DYNAMIC_DRAW); m.shKey = J.key; m.shJob = null; }
      break;   // one mesh per frame
    }
  }
  function updateMid(){
    const span = 22000, snap = 2000, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (MIDM && !MIDM.stale && MIDM.gn === QUAL.midN[QUAL.lvl] && Math.abs(cx - MIDM.cx) < 3000 && Math.abs(cz - MIDM.cz) < 3000) return;
    meshTask('mid', MIDM && MIDM.gn === QUAL.midN[QUAL.lvl] ? MIDM : null, cx - span / 2, cz - span / 2, span, QUAL.midN[QUAL.lvl], null, (M, dirty) => { const old = MIDM; MIDM = M; MIDM.cx = cx; MIDM.cz = cz; MIDM.stale = dirty; shSeed(MIDM, old); if (old) freeMesh(old); });
  }
  function updateNear(){
    berthPits(); npcPits(); stream3d(); nearWanted(); fineWanted(); updateMid(); updateFar(); meshStep(); tileStep(); if (LMJOB) lmStep();   // the near mesh first when more than one is due
  }
  function nearWanted(){
    const span = QUAL.near[QUAL.lvl][cam.dist > 1200 ? 1 : 0], snap = span / 10, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    const nn = QUAL.nearN[QUAL.lvl];
    if (NEARM && !NEARM.stale && NEARM.sx === span && NEARM.gn === nn && Math.abs(cx - NEARM.cx) < span / 5 && Math.abs(cz - NEARM.cz) < span / 5) return;
    meshTask('near', NEARM && NEARM.sx === span && NEARM.gn === nn ? NEARM : null, cx - span / 2, cz - span / 2, span, nn, (x, z) => terrCoarse(x, z, span / (nn - 1)), (M, dirty) => { const old = NEARM; NEARM = M; NEARM.cx = cx; NEARM.cz = cz; NEARM.stale = dirty; shSeed(NEARM, old); if (old) freeMesh(old); buildPatches(); buildGround(); });
  }
  // The fine ground round the boat (04.10.2026, the user: the 3D world is to follow the vector coast, so breakwaters, harbours and quays
  // come out right): about 4 m between the points over a kilometre, where the near mesh has 12-47 m, so a breakwater 8 m wide or a skerry
  // gets its shape from the fine coast (terrRaw); the near mesh has a hole under it. Built like the others, a few rows a frame.
  const FINEW = {span:[768, 1024, 1024, 1024], n:[192, 256, 256, 384]};
  function fineWanted(){
    if (!NEARM) return;
    const span = FINEW.span[QUAL.lvl], n = FINEW.n[QUAL.lvl], snap = span / 8, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (FINEM && !FINEM.stale && FINEM.sx === span && FINEM.gn === n && Math.abs(cx - FINEM.cx) < span / 5 && Math.abs(cz - FINEM.cz) < span / 5) return;
    meshTask('fine', FINEM && FINEM.sx === span && FINEM.gn === n ? FINEM : null, cx - span / 2, cz - span / 2, span, n, (x, z) => terrCoarse(x, z, span / (n - 1)), (M, dirty) => { const old = FINEM; FINEM = M; FINEM.cx = cx; FINEM.cz = cz; FINEM.stale = dirty; shSeed(FINEM, old); if (old) freeMesh(old); if (snowNow != null) recolor(FINEM, snowNow); buildPatches(); });
  }
  const WEED = [0.27, 0.24, 0.13], WEED2 = [0.22, 0.2, 0.12], BARN = [0.66, 0.66, 0.62];   // rockweed and barnacles in the tidal zone
  // the land cover's own ground (G1, coverAt): the heaths of crowberry, heather and dwarf birch (ESA's 'shrub', most of the fells along
  // the coast), the lichen and the sparse grass of the high ground ('moss'), the bogs, the fields, bare rock and gravel, and the town's
  // ground; each from its straw colour (late autumn to spring) to its summer one by grassNow
  const COVC = {heath:[[0.43, 0.36, 0.27], [0.33, 0.37, 0.22]], lichen:[[0.6, 0.59, 0.51], [0.55, 0.56, 0.44]], bog:[[0.6, 0.5, 0.31], [0.45, 0.47, 0.25]],
    field:[[0.52, 0.45, 0.32], [0.37, 0.46, 0.23]], meadow:[[0.55, 0.5, 0.34], [0.38, 0.47, 0.25]], gravel:[0.46, 0.45, 0.42], town:[0.42, 0.43, 0.38],
    sand:[0.76, 0.73, 0.62], scree:[0.52, 0.51, 0.48], shingle:[0.56, 0.55, 0.51]};
  function recolor(m, snow){
    const {slope, nz, col, h, fo, mat, cv, ck} = m;
    if (cv && !m.vb){ m.cov = new Float32Array(h.length * 4); m.vb = buf(m.cov, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); }
    const cov = m.cov, gs = grassNow(), cc = k => mix3(COVC[k][0], COVC[k][1], gs), [ry, rl] = ruskNow();
    // ruska: the heath's bilberry, crowberry and dwarf birch red-brown, the bog's sedge rust, the birch woods yellow while the leaves hang
    const heath = mix3(cc('heath'), [0.5, 0.26, 0.15], ry * 0.85), lichen = cc('lichen'), bogc = mix3(cc('bog'), [0.6, 0.42, 0.22], ry * 0.6), field = cc('field'), meadow = cc('meadow');
    const gr = grassNow(), grass = mix3([0.5, 0.46, 0.33], [0.36, 0.43, 0.28], gr), birch = mix3([0.33, 0.3, 0.26], [0.25, 0.33, 0.22], gr), shore = [0.5, 0.49, 0.44], bed = [0.3, 0.3, 0.27];
    const woodC = mix3(birch, [0.52, 0.44, 0.14], ry * rl * 0.8);   // the birch woods yellow in ruska while the leaves hang
    // the classes' colours in the cover layer's order (03-berths-naust.js coverAt), flat, so the sum per point allocates nothing
    const FR = new Float32Array(12);
    const CP = [woodC, heath, meadow, field, bogc, lichen, COVC.gravel, lichen, mix3(COVC.town, meadow, 0.5), COVC.sand, COVC.scree, COVC.shingle], PT = new Float32Array(36);
    for (let k = 0; k < 12; k++){ PT[k * 3] = CP[k][0]; PT[k * 3 + 1] = CP[k][1]; PT[k * 3 + 2] = CP[k][2]; }
    const asph = [0.3, 0.31, 0.32], gravel = [0.47, 0.45, 0.41], pv = m.pv;   // a harbour unit's fill and the flat land by it (unitPatch)
    // the rock (0.33, 0.35, 0.37) and the snow (0.9, 0.92, 0.95) are laid on in the fragment shader (terFS) by the weights in mat, so their
    // edges can be sharpened per pixel; the colour here is the ground under them
    for (let i = 0; i < h.length; i++){
      const y = h[i], n = nz[i]; let c, R = 0, wood = 0, sn = 0, p = 0;
      if (y < 0) c = bed;
      else {
        const alt = y < 280 ? 1 : sstep(420, 280, y);   // bare rock above the vegetation
        c = mix3(grass, birch, n);
        if (y < 3.5) c = mix3(shore, c, y / 3.5);
        // the tidal zone along the whole coast, as under Father's naust (Jonas 07.10.2026: «det ser litt dumt ut når den eneste plassen det
        // er tang og rur i verden er rundt stolpene til naustet»): rockweed up to about the high water, a pale band of barnacles above it
        const tw = 1 - sstep(0.9, 1.5, y), tb = sstep(0.9, 1.4, y) * (1 - sstep(1.7, 2.3, y));
        if (tw > 0 || tb > 0){ c = mix3(c, mix3(WEED, WEED2, sstep(0.4, 0.7, n)), tw * (1 - sstep(0.5, 0.85, slope[i]) * 0.5)); c = mix3(c, BARN, tb * 0.55); }
        // birch woods below the tree line stay dark through the snow; steep faces show bare rock
        const rs = sstep(0.32, 0.7, slope[i]); wood = Math.max(y < 320 ? sstep(0.42, 0.62, n) * sstep(320, 200, y) : 0, fo ? fo[i] * sstep(420, 260, y) * 0.9 : 0) * (1 - rs);
        R = 1 - alt * (1 - rs * 0.75);
        let gl0 = 0;
        if (cv){
          // a point without the land cover (nearer the shore than ESA's polygons reach, or a tile without the layer) gets a likely mix in
          // the same style: the old rule's wood as forest, heath under the fells and lichen fell over them; a mesh with both styles
          // stretched a corner's colour over its coarse triangles (a light wedge at Hammerfest, 28.10.2026)
          let src = cv, o = i * 12;
          if (!ck[i]){ const Fw = Math.max(y < 320 ? sstep(0.42, 0.62, n) * sstep(320, 200, y) : 0, fo ? fo[i] * sstep(420, 260, y) * 0.9 : 0), hi = sstep(250, 500, y);
            FR.fill(0); FR[0] = Fw * 255; FR[1] = (1 - Fw) * (1 - hi) * 255; FR[5] = (1 - Fw) * hi * 255; src = FR; o = 0; }
          // the land cover where it is known: the ground's colour from the classes' shares, the wood from the forest (and a little from the
          // heaths' dwarf birch), the rock from bare ground and the lichen fells besides the steepness and the height (the summits are
          // stonier than ESA's 10 m classes show: the heath on Senja's tops reads as green to the top otherwise)
          const F = src[o] / 255, SH = src[o + 1] / 255, GR = src[o + 2] / 255, CR = src[o + 3] / 255, WE = src[o + 4] / 255, MO = src[o + 5] / 255, BA = src[o + 6] / 255, SN = src[o + 7] / 255, UR = src[o + 8] / 255, SA = src[o + 9] / 255, SC = src[o + 10] / 255, SG = src[o + 11] / 255;
          let r = 0, g = 0, b = 0; for (let k = 0; k < 12; k++){ const w = src[o + k]; if (w){ r += w * PT[k * 3]; g += w * PT[k * 3 + 1]; b += w * PT[k * 3 + 2]; } }
          const v = (0.93 + 0.14 * n) / 255, cg = [r * v, g * v, b * v];   // (a town's ground is half gardens: its colour in CP)
          c = y < 3.5 ? mix3(shore, cg, y / 3.5) : cg;
          if (tw > 0 || tb > 0){ c = mix3(c, mix3(WEED, WEED2, sstep(0.4, 0.7, n)), tw * (1 - sstep(0.5, 0.85, slope[i]) * 0.5)); c = mix3(c, BARN, tb * 0.55); }
          wood = (F * 0.95 + SH * 0.12) * sstep(440, 260, y) * (1 - rs);
          R = Math.max(R, BA * 0.95, MO * 0.45, SC * 0.85, SG * 0.5);   // the rock above the vegetation (280-420 m) and on the steep faces as before
          gl0 = SN * sstep(120, 220, y);   // snow fields and glaciers that lie through the summer (ESA's 'snow', seen in August)
          if (cov){ cov[i * 4] = WE; cov[i * 4 + 1] = CR; cov[i * 4 + 2] = SH; cov[i * 4 + 3] = 1 + MO; }
        } else if (cov){ cov[i * 4] = cov[i * 4 + 1] = cov[i * 4 + 2] = cov[i * 4 + 3] = 0; }
        p = pv ? pv[i] : 0; sn = Math.max(sstep(snow - 60, snow + 60, y + n * 90) * (1 - rs * 0.85) * (1 - wood * 0.55), gl0 * (1 - rs * 0.6)) * (1 - p * 0.6) * sstep(1.5, 2.3, y);   // no snow where the tide comes
        R *= 1 - p;
        c = mix3(c, birch, wood * 0.6);
        if (p) c = mix3(c, mix3(asph, gravel, sstep(0.4, 0.75, n) * 0.7 + (1 - p) * 0.3), p);
      }
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
      mat[i * 4] = R; mat[i * 4 + 1] = wood; mat[i * 4 + 2] = sn; mat[i * 4 + 3] = p;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.mb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, mat);
    if (m.vb){ gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, cov); }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col);
  }

  // ---------- the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  // pixel; the faces' normals come from the pixels' derivatives, and thousands of stones too small to see stalled SwiftShader for seconds
  // a frame, 03.10.2026) ----------
  const STONES = [], STONE_R = 1500;
  function stonesOf(list, build){
    const sm = MB(); build(sm); if (!sm.p.length) return;
    let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (let i = 0; i < sm.p.length; i += 3){ x0 = Math.min(x0, sm.p[i]); z0 = Math.min(z0, sm.p[i + 2]); x1 = Math.max(x1, sm.p[i]); z1 = Math.max(z1, sm.p[i + 2]); }
    list.push({mesh:sm.mesh([(x0 + x1) / 2, (z0 + z1) / 2]), x0, z0, x1, z1});
  }
  function drawStones(list, TM, eye){
    for (const q of list){ const dx = Math.max(q.x0 - eye[0], 0, eye[0] - q.x1), dz = Math.max(q.z0 - eye[2], 0, eye[2] - q.z1); if (dx * dx + dz * dz < STONE_R * STONE_R) drawLit(q.mesh, TM); }
  }
