  // ---------- the harbour unit (tools/harbour/kaimottak.py): quay, fish plant, crane, forklift, ice silo and bunker station in one ----------
  // Three looks (U.v in UNITS, 01-world.js: a the plant of today, b the old fish plant, c the big plant; tools/harbour/kaimottak.py),
  // each with the same quay, crane, forklift, door and chute in the same places: drawn in full within 900 m and in its simple version
  // further out; a look whose model is not in the page falls back to a.
  // Its moving parts (the crane's slewing column, the boom and its extension, the hook, the forklift and its forks, the roller door
  // and the ice chute) stand at rest in every harbour, and the plant nearest the camera works them (drawPlant).
  const UMOD = {};
  function unitModel(v){
    const k = v && v !== 'a' && glbHas('harbour-' + v) ? v : 'a';
    if (k in UMOD) return UMOD[k];
    const G = k === 'a' ? (glbHas('harbour') ? glbLoad('harbour') : null) : glbLoad('harbour-' + k); if (!G || !G.parts.lod0){ UMOD[k] = false; return false; }
    const P = G.parts, gl0 = P.glass || {p:[], n:[], c:[]}, up = n => P[n] ? upA(P[n]) : null, AL = G.ex.anchors && G.ex.anchors.lift;   // the shop's and the yard's units have none of the plant's moving parts
    return UMOD[k] = {near:upA({p:P.lod0.p.concat(gl0.p), n:P.lod0.n.concat(gl0.n), c:P.lod0.c.concat(gl0.c)}), far:upA(P.lod1), house:up('crane_house'), boom1:up('crane_boom1'), boom2:up('crane_boom2'),
      hook:up('crane_hook'), truck:up('truck'), forks:up('truck_forks'), door:up('door'), chute:up('chute'), lifts:AL ? AL.classes.map(c => up(c.part)) : null, cable:up('yard_cable'), A:G.ex.anchors};
  }
  // the unit's frame: a point [x, y, z] in it, in the world; the model's matrix (eye-relative)
  const unitP = (U, p) => { const w = unitW(U, p[0], p[2]); return [w[0], p[1], w[1]]; };
  const unitMat = (U, eye) => chain(M4.T(U.o[0] - eye[0], -eye[1], U.o[1] - eye[2]), M4.RY(Math.atan2(-U.u[1], U.u[0])));
  // on the unit's ground: the block and its fill (m out round them) or its basin
  function onUnit(x, z, m){ for (const U of UNITA){ const R = U.y ? 200 : 120; if (Math.abs(x - U.o[0]) > R || Math.abs(z - U.o[1]) > R) continue; const [lx, lz] = unitL(U, x, z), ax = Math.abs(lx), g = ugeo(U);
    if (groundOut(U, lx, lz) <= m || (ax <= g.basinX && lz >= 0 && lz <= g.basinZ)) return U; } return null; }
  // The crane's pose {a: the boom's heading in the world, r: the radius from the column, hook: the hook's height} as the column's slew,
  // the boom's angle up (it rises to reach in close and keeps the tip at least 2.6 m over the heel) and how far the extension runs out
  function craneGeo(P, q){
    const C = P.ucrane, L = clamp(Math.hypot(q.r, 2.6), C.L1, C.L1 + C.ext), th = Math.acos(clamp(q.r / L, 0, 1)), Lh = L * Math.cos(th);
    return {th, e:L - C.L1, tip:[P.crane[0] + Math.sin(q.a) * Lh, C.heelY + L * Math.sin(th), P.crane[1] + Math.cos(q.a) * Lh]};
  }
  // the unit's moving parts: the crane at pose q, the forklift st {x, z, h, fl, loads}, the door open by k (0-1), the chute at angle
  // ch (in the unit's frame, 0 = straight out over the berth); what hangs from the hook is drawn by the caller. With the time T the
  // forklift has its driver on the seat: the harbour workers' figure, seated with his hands on the wheel (Jonas 21.10.2026, #86: the
  // driver was boxes in the truck's model)
  function drawUnitParts(P, eye, q, st, k, ch, T){
    const U = P.unit, M = unitModel(U.v), A = M.A, rel = p => [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]], g = craneGeo(P, q);
    const base = rel([P.crane[0], A.crane.base[1], P.crane[1]]), heel = rel([P.crane[0], A.crane.heel[1], P.crane[1]]);
    drawN(M.house, chain(M4.T(base[0], base[1], base[2]), M4.RY(q.a)));
    const BM = chain(M4.T(heel[0], heel[1], heel[2]), M4.RY(q.a), M4.RX(-g.th)); drawN(M.boom1, BM); drawN(M.boom2, chain(BM, M4.T(0, 0, g.e)));
    // the hook's block hangs so its bottom is 0.1 m over the load's top at q.hook (landScene's heights)
    const tip = rel(g.tip), hk = [tip[0], q.hook + 0.62 - eye[1], tip[2]]; drawN(PM.wire, limbM([tip[0], tip[1] - 0.2, tip[2]], hk, 0.012)); drawN(M.hook, chain(M4.T(hk[0], hk[1], hk[2]), M4.RY(q.a)));
    const fy = P.gy([st.x, st.z]), FM = chain(M4.T(st.x - eye[0], fy - eye[1], st.z - eye[2]), M4.RY(-st.h)), lift = 0.05 + st.fl * 0.45;
    drawN(M.truck, FM); drawN(M.forks, chain(FM, M4.T(0, lift, 0))); { let y = 0.17 + lift; for (const L of st.loads || []){ drawN(L.mesh, chain(FM, M4.T(0, y, -1.5))); y += L.h; } }
    if (T != null){ const F = [Math.sin(st.h), -Math.cos(st.h)]; drawWorker(P, {x:st.x - F[0] * 0.5, z:st.z - F[1] * 0.5, h:st.h, task:'drive', seat:1.14, walk:false, s:0}, eye, T, 4); }
    const UM = unitMat(U, eye), D = A.door.top, sk = 1 - 0.94 * k; drawN(M.door, chain(UM, M4.T(D[0], D[1], D[2]), new Float32Array([1,0,0,0, 0,sk,0,0, 0,0,1,0, 0,0,0,1])));
    const S0 = A.silo.axis; drawN(M.chute, chain(UM, M4.T(S0[0], S0[1], S0[2]), M4.RY(ch)));
    return {tip:g.tip, hk};
  }
  // ---------- the yard's ship lift (tools/harbour/steder.py; Jonas 07.10.2026: «dock eller slipvogn som kan tørrlegge alle båtene») ----------
  // At a yard (UNITS v 'y') the boat at the main berth lies over a steel platform that hangs in cables from the winch houses on the kerb.
  // When she has a job on the hull or a repair (the slip: 'hull' and 'repair' in core/06-services.js, the boat is held in port while
  // they run) the platform rises under her keel blocks (a cm or ten under her keel to begin with), lifts her out of the water to the
  // quay's deck, and holds her there until the work is done; then she is let down again. LIFT_S is the real seconds a whole stroke takes. The
  // platform is scaled to the boat: its length (a boat's length and 3 m) and its beam, from the face. While she is up she lies still
  // (the sea does not rock her), and her mooring lines are not drawn. Arriving with the job already running (a saved game) she is up at once.
  const LIFT = {k:0, id:null, off:0, yP:0, ci:0, sx:1, sz:1, U:null}, LIFT_S = 40;
  function liftStep(dt, b){
    const U = b.status === 'port' && b.port ? UNITS[b.port] : null, A = U && U.v === 'y' && berthKind(b) === 'main' ? unitModel(U.v) : null, L = A && A.A.lift;
    if (!L){ const d = -LIFT.off; LIFT.k = 0; LIFT.off = 0; LIFT.id = null; LIFT.U = null; return {off:0, dry:0, d}; }
    const want = (S.jobs || []).some(j => (j.kind === 'hull' || j.kind === 'repair') && j.until != null && j.until > S.t) ? 1 : 0;
    if (LIFT.id !== U.id){ LIFT.id = U.id; LIFT.k = want; LIFT.off = 0; }
    LIFT.k += clamp(want - LIFT.k, -dt / LIFT_S, dt / LIFT_S);
    const V = VESSELS[b.type] || {}, Lb = V.len || 8, Bb = V.beam || 2.5, tide = env.tide || 0, yP0 = tide - (V.draft || 1) - 0.1 - L.block, yLow = yP0 - 0.8, pos = LIFT.k * LIFT.k * (3 - 2 * LIFT.k);
    // the smallest platform that holds her (a length and 3 m, her beam and 1.2 m), scaled to fit; the keel blocks stand on her centre line
    let ci = L.classes.findIndex(c => c.len >= Lb + 3 && c.wid >= Bb + 1.2); if (ci < 0) ci = L.classes.length - 1; const cl = L.classes[ci];
    LIFT.yP = yLow + (L.deck - yLow) * pos; LIFT.ci = ci; LIFT.sx = clamp((Lb + 3) / cl.len, 0.4, 1.25); LIFT.sz = clamp((Bb + 0.36) / (cl.wid - L.edge), 0.4, 1.3); LIFT.U = U;
    const off = Math.max(0, LIFT.yP - yP0 - 0.1), d = off - LIFT.off; LIFT.off = off;
    return {off, dry:clamp(off / 0.8, 0, 1), d};
  }
  function drawYardLift(U, eye, M, UM){
    const L = M.A.lift, pl = M.lifts && M.lifts[LIFT.ci]; if (!L || !pl || LIFT.U !== U) return;
    const sx = LIFT.sx, sz = LIFT.sz;
    drawN(pl, chain(UM, M4.T(L.x, LIFT.yP, L.edge * (1 - sz)), new Float32Array([sx,0,0,0, 0,1,0,0, 0,0,sz,0, 0,0,0,1])));
    const top = L.cable[1], len = top - LIFT.yP, span = L.classes[LIFT.ci].len * sx / 2 - 0.5;
    for (const x of L.winch) if (Math.abs(x - L.x) <= span) drawN(M.cable, chain(UM, M4.T(x, top, L.cable[0]), new Float32Array([1,0,0,0, 0,len,0,0, 0,0,1,0, 0,0,0,1])));
  }
  // the units' quays and buildings: far ones in their simple version; near ones in full with their moving parts at rest, but for the
  // plant that works them (skip)
  function drawUnits(eye, VP, near, far, skip){
    if (!unitModel()) return; nSetup(VP);
    for (const U of UNITA){
      const d = Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]); if (d > far) continue; const M = unitModel(U.v);
      const full = near && d / ZF() < 900 * QUAL.lodK[QUAL.lvl], UM0 = unitMat(U, eye); drawN(full ? M.near : M.far, UM0);
      if (full && U.v === 'y') drawYardLift(U, eye, M, UM0);
      const P = full && U.id !== skip && PLANTS.find(q => q.id === U.id); if (P) drawUnitParts(P, eye, craneIdle(P, 0), fkRest(P), 0, P.chRest);
    }
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the naust and the shop (SITES, by the terrain above)
  const SMOD = {};
  // a site's model; 'rorbu:o' is the rorbu with its cladding (paint zone 1) in ochre, 'rorbu:w' in white, 'rorbu:r' as it is (red)
  const RBCOL = {o:[0.74, 0.5, 0.17], w:[0.86, 0.85, 0.81]};
  // Its own ground takes the snow as the terrain round it does (Jonas 05.10.2026: «Ser jo rart ut at det er grønt gress rundt rorbua, så
  // er det snø overalt ellers»): paint zone 2 (rock above the high-water line, the roof) gets snow where it faces up, zone 3 (grass and
  // heather) too, and its upright tufts go the colour of straw; how much by recolor's rule, the snow line (snowNow) against the height
  // with a little noise, so it lies in patches. Made again when the snow line moves (it moves in steps of 20 m).
  const SNOWC = [0.9, 0.92, 0.95], STRAW = [0.56, 0.5, 0.36];
  function siteSnow(P, snow){
    if (snow == null || !P.zone) return P;
    const c = P.c.slice(); let any = false;
    for (let i = 0; i < P.zone.length; i++){
      const z = P.zone[i]; if (z !== 2 && z !== 3) continue;
      const x = P.p[i * 3], y = P.p[i * 3 + 1], q = P.p[i * 3 + 2], hn = Math.abs(Math.sin(x * 12.9898 + q * 78.233) * 43758.5453) % 1;
      const sn = sstep(snow - 60, snow + 60, y + hn * 90); if (sn < 0.02) continue;
      // grass and heather hold the snow on the steep banks too (only bare rock sheds it), so the bank down to the water is white
      const up = sstep(0.4, 0.8, P.n[i * 3 + 1]), a = P.ao[i], k = sn * (z === 3 ? Math.max(up, 0.85) : up);
      for (let j = 0; j < 3; j++){ let v = c[i * 4 + j]; if (z === 3) v += (STRAW[j] * a - v) * sn * (1 - up) * 0.8; c[i * 4 + j] = v + (SNOWC[j] * a - v) * k; }
      any = true;
    }
    return any ? {p:P.p, n:P.n, c, zone:P.zone, ao:P.ao} : P;
  }
  function siteModel(k){
    const key = k + '|' + snowNow, E = SMOD[k];
    if (E === false) return false; if (E && E.key === key) return E.M;
    const [t, v] = k.split(':'), G = glbHas(t) ? glbLoad(t) : null; if (!G || !G.parts.lod0) return SMOD[k] = false;
    if (E){ freeMesh(E.M.near); freeMesh(E.M.far); }
    const col = RBCOL[v], paint = P => { P = siteSnow(P, snowNow); if (!col || !P.zone) return P; const c = P.c.slice(); for (let i = 0; i < P.zone.length; i++) if (P.zone[i] === 1){ const a = P.ao[i]; c[i * 4] = col[0] * a; c[i * 4 + 1] = col[1] * a; c[i * 4 + 2] = col[2] * a; } return {p:P.p, n:P.n, c}; };
    const P = G.parts, g = P.glass || {p:[], n:[], c:[]}, L0 = paint(P.lod0);
    const M = {near:upA({p:L0.p.concat(g.p), n:L0.n.concat(g.n), c:L0.c.concat(g.c)}), far:upA(P.lod1 ? paint(P.lod1) : L0), A:G.ex.anchors || {}};
    SMOD[k] = {key, M}; return M;
  }
  function drawSites(eye, VP, near, far){
    let set = false;
    for (const s of sitesNow()){
      const d = Math.hypot(s.o[0] - eye[0], s.o[1] - eye[2]); if (d > Math.min(far, 4000)) continue;
      const M = siteModel(s.k === 'rorbu' ? 'rorbu:' + s.v : s.k); if (!M) continue; if (!set){ nSetup(VP); set = true; }
      drawN(near && d / ZF() < 900 * QUAL.lodK[QUAL.lvl] ? M.near : M.far, chain(M4.T(s.o[0] - eye[0], (s.lev !== undefined ? s.lev - (QTOP - 0.1) : 0) - eye[1], s.o[1] - eye[2]), M4.RY(Math.atan2(-s.u[1], s.u[0]))));
    }
    if (set){ gl.disableVertexAttribArray(2); gl.useProgram(PL.p); }
  }
