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
      drawN(near && d / ZF() < 900 * QUAL.lodK[QUAL.lvl] ? M.near : M.far, chain(M4.T(s.o[0] - eye[0], (s.lev !== undefined ? s.lev - (QTOP - 0.1) : s.lift || 0) - eye[1], s.o[1] - eye[2]), M4.RY(Math.atan2(-s.u[1], s.u[0]))));
    }
    if (set){ gl.disableVertexAttribArray(2); gl.useProgram(PL.p); }
  }
  // ---------- sponsors' signs (M7, docs/planer/butikker-og-sponsorer.md F2 and 4.4) ----------
  // A partner with a written agreement (core/09l-sponsor.js spOf('sign', …)) gets a banner with the logo in front of the shop, on the Finnsnes shop (site 'shop') and on the tackle shops along the coast (harbour unit 's'). The target is
  // the port's id, or 'all'. Its place is in the shop model's frame (tools/harbour/butikk.py: the front at y = SHOP[2] = 11.5, the door at
  // x = -7; steder.py shifts the shop by BX, BY = -5, -2 on the unit). Nothing at sea, in the chart plotter or in the HUD.
  // The measure as IAB's intrinsic in-game guidelines (start values, 4.4): the field counts as seen while it covers at least 1.5 % of the
  // screen and faces the camera within 55°; one view after a second in a row, and the seconds add up. Nothing is counted while the page is
  // hidden or nobody has touched the game for two minutes (SIGNV.idle). SIGNV.take() hands the counts over and starts again.
  // (a field on the wall beside the board was tried first: from the boat at the quay, 20-30 m off, it covered well under 0.1 % of the
  // screen, so the partner's sign is a banner on two posts on the apron, 2.5 m in front of the shop, facing the quay: 4 x 2 m, which from
  // a boat at the quay with the camera 15-18 m off covers about 1.5 % of the screen)
  // (it stands at the shop's west end, x -15.4..-11.4: further east the Finnsnes bunker tank, x 0.1..4.7 at y 6.2, stood in front of it)
  const SIGNF = {shop:{x0:-15.4, x1:-11.4, y0:QTOP + 1.0, y1:QTOP + 3.0, z:-(11.5 - 2.5)}, s:{x0:-15.4 - 5, x1:-11.4 - 5, y0:QTOP + 1.0, y1:QTOP + 3.0, z:-(11.5 - 2 - 2.5)}};
  const SIGNV = {pl:{}, last:0, act:performance.now(), tex:{}, q:{}, seen:0, cur:[], oq:{}};
  ['pointerdown', 'keydown', 'wheel'].forEach(e => addEventListener(e, () => { SIGNV.act = performance.now(); }, {passive:true}));
  const signSp = id => typeof spOf === 'function' ? (spOf('sign', id) || spOf('sign', 'all')) : null;
  function signTex(sp){
    const key = sp.id; if (SIGNV.tex[key]) return SIGNV.tex[key].t;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    const paint = img => { g.fillStyle = '#f4f4f1'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#1d3b5a'; g.lineWidth = 10; g.strokeRect(5, 5, 246, 246);
      if (img){ const k = Math.min(200 / img.width, 200 / img.height); g.drawImage(img, 128 - img.width * k / 2, 128 - img.height * k / 2, img.width * k, img.height * k); }
      else { g.fillStyle = '#1d3b5a'; g.textAlign = 'center'; g.textBaseline = 'middle'; const w = String(sp.sponsor.name).toUpperCase().split(/\s+/); let fs = 46; g.font = 'bold ' + fs + 'px Archivo, sans-serif';
        while (fs > 18 && w.some(x => g.measureText(x).width > 220)){ fs -= 2; g.font = 'bold ' + fs + 'px Archivo, sans-serif'; }
        w.slice(0, 3).forEach((x, i, a) => g.fillText(x, 128, 128 + (i - (a.length - 1) / 2) * fs * 1.1)); }
      const T = SIGNV.tex[key]; if (T) upTex(T.t, cv); };
    const t = mkTex(); SIGNV.tex[key] = {t}; paint(null); upTex(t, cv);
    if (sp.sponsor.logo){ const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { try { paint(im); } catch (e){} }; im.src = sp.sponsor.logo; }
    return t;
  }
  // the screen's share and the angle of a field (M: its model matrix in the eye's frame; F: the field), and whether it counts
  function signSeen(M, F, VP, eye){
    const P = [[F.x0, F.y0, F.z], [F.x1, F.y0, F.z], [F.x1, F.y1, F.z], [F.x0, F.y1, F.z]].map(p => { const X = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], Y = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], Z = M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14];
      const cx = VP[0] * X + VP[4] * Y + VP[8] * Z + VP[12], cy = VP[1] * X + VP[5] * Y + VP[9] * Z + VP[13], cw = VP[3] * X + VP[7] * Y + VP[11] * Z + VP[15]; return {X, Y, Z, x:cx / cw, y:cy / cw, w:cw}; });
    if (P.some(q => q.w <= 0)) return {area:0, ang:90, ok:false};
    let a = 0; for (let i = 0; i < 4; i++){ const p = P[i], q = P[(i + 1) % 4]; const cx = (v => Math.max(-1, Math.min(1, v))); a += cx(p.x) * cx(q.y) - cx(q.x) * cx(p.y); }
    const area = Math.abs(a) / 2 / 4;   // of the screen (NDC is 2 x 2), clipped to it
    // the field's normal (model +z) in the eye's frame, against the direction from the field to the eye (the origin)
    const nx = M[8], ny = M[9], nz = M[10], nl = Math.hypot(nx, ny, nz) || 1, cxm = (P[0].X + P[2].X) / 2, cym = (P[0].Y + P[2].Y) / 2, czm = (P[0].Z + P[2].Z) / 2, dl = Math.hypot(cxm, cym, czm) || 1;
    const cos = -(nx * cxm + ny * cym + nz * czm) / nl / dl, ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
    return {area, ang, ok:area >= 0.015 && ang < 55};
  }
  function drawSigns(eye, VP){
    const now = performance.now(), dt = Math.min(0.5, (now - (SIGNV.last || now)) / 1000); SIGNV.last = now;
    const live = !document.hidden && now - SIGNV.act < 120000, list = [];
    for (const s of sitesNow()) if (s.k === 'shop' && !s.near){ const sp = signSp('finnsnes'); if (sp) list.push({sp, F:SIGNF.shop, M:chain(M4.T(s.o[0] - eye[0], (s.lift || 0) - eye[1], s.o[1] - eye[2]), M4.RY(Math.atan2(-s.u[1], s.u[0]))), o:s.o}); }
    for (const U of UNITA) if (U.v === 's'){ const sp = signSp(U.id); if (sp && Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]) < 600) list.push({sp, F:SIGNF.s, M:unitMat(U, eye), o:U.o}); }
    SIGNV.seen = 0; SIGNV.cur = []; if (!list.length) return;
    for (const L of list){
      const F = L.F, key = L.F === SIGNF.shop ? 'shop' : 's'; if (!SIGNV.q[key]) SIGNV.q[key] = texQuad([F.x0, F.y0, F.z], [F.x1, F.y0, F.z], [F.x1, F.y1, F.z], [F.x0, F.y1, F.z]);
      drawTexQuad(SIGNV.q[key], signTex(L.sp), L.M, VP, true, [0, 0, 1]);
      // the two posts from the deck to the banner's top (in the eye's frame, as the plant's wires are drawn)
      const W = p => [L.M[0] * p[0] + L.M[4] * p[1] + L.M[8] * p[2] + L.M[12], L.M[1] * p[0] + L.M[5] * p[1] + L.M[9] * p[2] + L.M[13], L.M[2] * p[0] + L.M[6] * p[1] + L.M[10] * p[2] + L.M[14]];
      if (PM && PM.wire){ nSetup(VP); for (const x of [F.x0 + 0.2, F.x1 - 0.2]) drawN(PM.wire, limbM(W([x, QTOP, F.z - 0.06]), W([x, F.y1 + 0.05, F.z - 0.06]), 0.05)); }
      if (Math.hypot(L.o[0] - eye[0], L.o[1] - eye[2]) > 150) continue;
      SIGNV.cur.push({id:L.sp.id, F, M:L.M, key});
      // hidden behind something (a boat, the tank, a shed): the occlusion query of the last frames says (signOcc); without WebGL 2 there
      // is no such query, and nothing is counted rather than counting what may be hidden
      const O = SIGNV.oq[L.sp.id], vis = !!(O && O.vis);
      const r = signSeen(L.M, F, VP, eye), C = SIGNV.pl[L.sp.id] || (SIGNV.pl[L.sp.id] = {imp:0, sec:0, run:0, area:0}); r.ok = r.ok && vis; r.vis = vis;
      C.last = {area:+r.area.toFixed(4), ang:Math.round(r.ang), vis:r.vis}; if (r.ok && live){ C.run += dt; C.area = Math.max(C.area, r.area); SIGNV.seen++; if (C.run >= 1){ if (C.run - dt < 1) C.imp++; C.sec += dt; } } else C.run = 0;
    }
    gl.useProgram(PL.p);
  }
  // after the boats, the plants and the rest of the near objects are drawn (24-cinema.js): each banner drawn this frame is drawn again
  // without colour inside an occlusion query (WebGL 2: any sample passed), a hair in front of itself; the answer comes a frame or two later
  function signOcc(VP){
    if (!GL2 || !SIGNV.cur.length) return;
    gl.colorMask(false, false, false, false); gl.depthMask(false);
    for (const c of SIGNV.cur){ const O = SIGNV.oq[c.id] || (SIGNV.oq[c.id] = {q:null, pend:false, vis:false});
      if (O.pend){ if (!gl.getQueryParameter(O.q, gl.QUERY_RESULT_AVAILABLE)) continue; O.vis = !!gl.getQueryParameter(O.q, gl.QUERY_RESULT); O.pend = false; }
      if (!O.q) O.q = gl.createQuery(); const F = c.F, k = 'o' + c.key;
      if (!SIGNV.q[k]) SIGNV.q[k] = texQuad([F.x0 + 0.3, F.y0 + 0.2, F.z + 0.03], [F.x1 - 0.3, F.y0 + 0.2, F.z + 0.03], [F.x1 - 0.3, F.y1 - 0.2, F.z + 0.03], [F.x0 + 0.3, F.y1 - 0.2, F.z + 0.03]);
      gl.beginQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, O.q); drawTexQuad(SIGNV.q[k], SIGNV.tex[c.id].t, c.M, VP, false, [0, 0, 1]); gl.endQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE); O.pend = true; }
    gl.depthMask(true); gl.colorMask(true, true, true, true); gl.useProgram(PL.p);
  }
  // the counts since the last time, per placement ({pl, imp, sec}), handed over to be sent (ui/10r-sponsor.js)
  function signTake(){ const out = []; for (const [pl, C] of Object.entries(SIGNV.pl)) if (C.imp || C.sec >= 1) out.push({pl:+pl, imp:C.imp, sec:Math.round(C.sec)}); for (const C of Object.values(SIGNV.pl)){ C.imp = 0; C.sec = 0; } return out; }
