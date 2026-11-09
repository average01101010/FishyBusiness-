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
    drawN(M.truck, FM); drawN(M.forks, chain(FM, M4.T(0, lift, 0))); { let y = 0.17 + lift; for (const L of st.loads || []){ const LM = chain(FM, M4.T(0, y, -1.5)); if (L.draw) L.draw(LM); else drawN(L.mesh, LM); y += L.h; } }
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
  // The measure as IAB's intrinsic in-game guidelines 2.0 (4.4 and 10.6; the rules in ui/10r-sponsor.js SPM): the field counts as seen
  // while it covers at least 1.5 % of the screen, faces the camera within 55°, has half of it inside the screen and half its six cells
  // neither behind a 3D object (signOcc) nor under the UI (SPM.uiOver), in sight (not in fog thicker than the distance, not at night);
  // one viewable impression per placement and session after a second in a row, the seconds added. Nothing is counted while the page is
  // hidden or nobody has touched the game for two minutes (SIGNV.act). signTake() hands the counts over and starts again.
  // (a field on the wall beside the board was tried first: from the boat at the quay, 20-30 m off, it covered well under 0.1 % of the
  // screen, so the partner's sign is a banner on two posts on the apron, 2.5 m in front of the shop, facing the quay: 4 x 2 m, which from
  // a boat at the quay with the camera 15-18 m off covers about 1.5 % of the screen)
  // (it stands at the shop's west end, x -15.4..-11.4: further east the Finnsnes bunker tank, x 0.1..4.7 at y 6.2, stood in front of it)
  // (and high, 2.7-4.6 m over the deck, west of the board with the place's name: lower down, the boat on its trailer at the west end hid half of it)
  const SIGNF = {shop:{x0:-16.2, x1:-12.4, y0:QTOP + 2.7, y1:QTOP + 4.6, z:-(11.5 - 2.5)}, s:{x0:-16.2 - 5, x1:-12.4 - 5, y0:QTOP + 2.7, y1:QTOP + 4.6, z:-(11.5 - 2 - 2.5)}};
  const SIGNV = {pl:SPM.pl, last:0, ui:{}, act:performance.now(), tex:{}, q:{}, seen:0, cur:[], oq:{}};
  ['pointerdown', 'keydown', 'wheel'].forEach(e => addEventListener(e, () => { SIGNV.act = performance.now(); }, {passive:true}));
  // the placement for a place: its own (the port's id), its kind's ('butikk:all', 'mottak:all', 'verft:all'), or everywhere ('all')
  const signSp = (id, kind) => typeof spOf === 'function' ? (spOf('sign', id) || spOf('sign', kind + ':all') || spOf('sign', 'all')) : null;
  // the plant (kaimottak.py: the building x -26..0.5, the silo at x 2.5, the pump at 17.5): high on the plant building's front at its west end (the deck east of the silo had the ice chute and the truck in front); the yard
  // (steder.py y: the berths at x -20 and 30, the hull on blocks at x -57): at the deck's east end, 6 m in
  SIGNF.mottak = {x0:-24.0, x1:-20.2, y0:QTOP + 3.4, y1:QTOP + 5.3, z:-(10.0 - 0.08)}; SIGNF.y = {x0:43.0, x1:46.8, y0:QTOP + 2.0, y1:QTOP + 3.9, z:-6.0};
  // a model's own place for it (anchors.sign = [x0, x1, y0, y1, z] in the game's frame, from the next export of the buildings), else the one here
  const signF = (M, k) => { const A = M && M.A && M.A.sign; return Array.isArray(A) && A.length === 5 ? {x0:A[0], x1:A[1], y0:A[2], y1:A[3], z:A[4]} : SIGNF[k]; };
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
    let u = 0; for (let i = 0; i < 4; i++){ const p = P[i], q = P[(i + 1) % 4]; u += p.x * q.y - q.x * p.y; } const whole = Math.abs(u) / 2 / 4, inside = whole > 0 ? area / whole : 0;   // the share of it inside the screen
    // the field's normal (model +z) in the eye's frame, against the direction from the field to the eye (the origin)
    const nx = M[8], ny = M[9], nz = M[10], nl = Math.hypot(nx, ny, nz) || 1, cxm = (P[0].X + P[2].X) / 2, cym = (P[0].Y + P[2].Y) / 2, czm = (P[0].Z + P[2].Z) / 2, dl = Math.hypot(cxm, cym, czm) || 1;
    const cos = -(nx * cxm + ny * cym + nz * czm) / nl / dl, ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
    return {area, ang, inside, ok:area >= 0.015 && ang < 55 && inside >= 0.5};
  }
  function drawSigns(eye, VP){
    const now = performance.now(), dt = Math.min(SPM.DT, (now - (SIGNV.last || now)) / 1000); SIGNV.last = now;   // at most 0.2 s a frame (IAB 3.2.6; the rule is SPM's, its constant here so the frame time handed over is already the credited one)
    const live = !document.hidden && now - SIGNV.act < 120000, list = [];
    for (const s of sitesNow()) if (s.k === 'shop' && !s.near){ const sp = signSp('finnsnes', 'butikk'); if (sp) list.push({sp, F:signF(siteModel('shop'), 'shop'), key:'shop', M:chain(M4.T(s.o[0] - eye[0], (s.lift || 0) - eye[1], s.o[1] - eye[2]), M4.RY(Math.atan2(-s.u[1], s.u[0]))), o:s.o}); }
    for (const U of UNITA){ if (Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]) > 600) continue; const k = U.v === 's' ? 's' : U.v === 'y' ? 'y' : 'mottak', sp = signSp(U.id, k === 's' ? 'butikk' : k === 'y' ? 'verft' : 'mottak');
      if (sp) list.push({sp, F:signF(unitModel(U.v), k), key:k + (U.v === 's' || U.v === 'y' ? '' : (U.v || 'a')), M:unitMat(U, eye), o:U.o}); }
    SIGNV.seen = 0; SIGNV.cur = []; SIGNV.flags = 0; SIGNV.drawn = list.map(L => L.key); if (!list.length) return;
    const look = new Map();   // per placement: what this frame saw of it
    for (const L of list){
      const F = L.F, key = L.key; if (!SIGNV.q[key]) SIGNV.q[key] = texQuad([F.x0, F.y0, F.z], [F.x1, F.y0, F.z], [F.x1, F.y1, F.z], [F.x0, F.y1, F.z]);
      drawTexQuad(SIGNV.q[key], signTex(L.sp), L.M, VP, true, [0, 0, 1]);
      // the two posts from the deck to the banner's top (in the eye's frame, as the plant's wires are drawn)
      const W = p => [L.M[0] * p[0] + L.M[4] * p[1] + L.M[8] * p[2] + L.M[12], L.M[1] * p[0] + L.M[5] * p[1] + L.M[9] * p[2] + L.M[13], L.M[2] * p[0] + L.M[6] * p[1] + L.M[10] * p[2] + L.M[14]];
      if (PM && PM.wire){ nSetup(VP); for (const x of [F.x0 + 0.2, F.x1 - 0.2]) drawN(PM.wire, limbM(W([x, QTOP, F.z - 0.06]), W([x, F.y1 + 0.05, F.z - 0.06]), 0.05)); }
      // the partner's flag on a pole of its own beside the banner (data.flag): 7 m, the flag 1.8 x 1.2 m from the pole's top
      if (L.sp.data && L.sp.data.flag){ const px = F.x1 + 1.2, top = QTOP + 7.0; if (PM && PM.wire){ nSetup(VP); drawN(PM.wire, limbM(W([px, QTOP, F.z]), W([px, top, F.z]), 0.06)); }
        const fk = 'f' + key; if (!SIGNV.q[fk]) SIGNV.q[fk] = texQuad([px + 0.08, top - 1.25, F.z], [px + 1.88, top - 1.25, F.z], [px + 1.88, top - 0.05, F.z], [px + 0.08, top - 0.05, F.z]);
        drawTexQuad(SIGNV.q[fk], signTex(L.sp), L.M, VP, true, [0, 0, 1]); SIGNV.flags = (SIGNV.flags || 0) + 1; }
      if (Math.hypot(L.o[0] - eye[0], L.o[1] - eye[2]) > 150) continue;
      const ok = L.sp.id + '@' + key + ':' + Math.round(L.o[0]) + ',' + Math.round(L.o[1]); SIGNV.cur.push({id:L.sp.id, ok, F, M:L.M, key});
      // hidden behind something (a boat, the tank, a shed): the occlusion query of the last frames says (signOcc); under the UI (the
      // phone, the drawer, the box, the cards over the picture): signUi, asked only when the rest could count. A cell counts when
      // neither hides it, the banner when three of six do. Without WebGL 2 there is no such query: the banner is undetermined, and
      // never counted as seen. Two banners of one placement in reach in the same frame are one look: the best of them counts (frame below)
      const O = SIGNV.oq[ok], r = signSeen(L.M, F, VP, eye), ui = GL2 && O && r.ok ? signUi(ok, L.M, F, VP, now) : NOUI, cells = O ? O.cell.reduce((a, c, n) => a + (c && !ui[n] ? 1 : 0), 0) : 0, vis = cells >= 3;
      const cm = [(F.x0 + F.x1) / 2, (F.y0 + F.y1) / 2, F.z], dm = Math.hypot(L.M[0] * cm[0] + L.M[4] * cm[1] + L.M[8] * cm[2] + L.M[12], L.M[1] * cm[0] + L.M[5] * cm[1] + L.M[9] * cm[2] + L.M[13], L.M[2] * cm[0] + L.M[6] * cm[1] + L.M[10] * cm[2] + L.M[14]);
      const sight = SPM.sightOk(SPM.fix.vis != null ? SPM.fix.vis : env.vis, dm, SPM.fix.el != null ? SPM.fix.el : env.el);   // (SPM.fix: the tests' fog and night)
      const o = {ok:r.ok, vis, det:!!GL2, sight, live, area:r.area, last:{area:+r.area.toFixed(4), ang:Math.round(r.ang), vis, cells, ui:ui.filter(Boolean).length, sight, d:Math.round(dm), inside:+(r.inside || 0).toFixed(2)}};
      const was = look.get(L.sp.id), good = q => q.ok && q.vis && q.sight;
      if (!was || (good(o) && !good(was)) || (good(o) === good(was) && o.area > was.area)) look.set(L.sp.id, o);
    }
    for (const [id, o] of look){ SPM.frame(id, o, dt); if (o.det && o.ok && o.vis && o.sight && o.live) SIGNV.seen++; }
    gl.useProgram(PL.p);
  }
  // after the boats, the plants and the rest of the near objects are drawn (24-cinema.js): each banner drawn this frame is drawn again
  // without colour inside an occlusion query (WebGL 2: any sample passed), a hair in front of itself; the answer comes a frame or two later
  function signOcc(VP){
    if (!GL2 || !SIGNV.cur.length) return;
    gl.colorMask(false, false, false, false); gl.depthMask(false);
    // six cells (3 x 2), each with a query of its own: the banner counts as unobstructed when at least three of them show (IAB: half its
    // pixels in view); a cell's answer comes a frame or two later
    for (const c of SIGNV.cur){ const O = SIGNV.oq[c.ok] || (SIGNV.oq[c.ok] = {q:[], pend:[], cell:[], vis:false, cells:0});
      const F = c.F, w = (F.x1 - F.x0) / 3, hh = (F.y1 - F.y0) / 2;
      for (let n = 0; n < 6; n++){
        if (O.pend[n]){ if (!gl.getQueryParameter(O.q[n], gl.QUERY_RESULT_AVAILABLE)) continue; O.cell[n] = !!gl.getQueryParameter(O.q[n], gl.QUERY_RESULT); O.pend[n] = false; }
        if (!O.q[n]) O.q[n] = gl.createQuery(); const k = 'o' + c.key + n, cx = F.x0 + (n % 3) * w, cy = F.y0 + Math.floor(n / 3) * hh, z = F.z + 0.03;
        if (!SIGNV.q[k]) SIGNV.q[k] = texQuad([cx + 0.05, cy + 0.05, z], [cx + w - 0.05, cy + 0.05, z], [cx + w - 0.05, cy + hh - 0.05, z], [cx + 0.05, cy + hh - 0.05, z]);
        gl.beginQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, O.q[n]); drawTexQuad(SIGNV.q[k], SIGNV.tex[c.id].t, c.M, VP, false, [0, 0, 1]); gl.endQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE); O.pend[n] = true;
      }
      O.cells = O.cell.filter(Boolean).length; O.vis = O.cells >= 3; }
    gl.depthMask(true); gl.colorMask(true, true, true, true); gl.useProgram(PL.p);
  }
  // which of a banner's six cells (3 x 2, as signOcc's) lie under the UI: the cell's middle on the screen, looked up at most every 0.2 s
  // (elementFromPoint makes the browser lay the page out when it has changed; five times a second for a banner in reach is little)
  const NOUI = [false, false, false, false, false, false];
  function signUi(ok, M, F, VP, now){
    const E = SIGNV.ui[ok] || (SIGNV.ui[ok] = {t:-1e9, hid:[true, true, true, true, true, true]});
    if (now - E.t < 200) return E.hid;
    E.t = now; const cv = gl.canvas, R = cv.getBoundingClientRect(), w = (F.x1 - F.x0) / 3, hh = (F.y1 - F.y0) / 2;
    for (let n = 0; n < 6; n++){
      const p = [F.x0 + (n % 3 + 0.5) * w, F.y0 + (Math.floor(n / 3) + 0.5) * hh, F.z], X = M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12], Y = M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13], Z = M[2] * p[0] + M[6] * p[1] + M[10] * p[2] + M[14];
      const cx = VP[0] * X + VP[4] * Y + VP[8] * Z + VP[12], cy = VP[1] * X + VP[5] * Y + VP[9] * Z + VP[13], cw = VP[3] * X + VP[7] * Y + VP[11] * Z + VP[15];
      if (cw <= 0){ E.hid[n] = true; continue; }
      const sx = R.left + (cx / cw + 1) / 2 * R.width, sy = R.top + (1 - cy / cw) / 2 * R.height;
      E.hid[n] = sx < 0 || sy < 0 || sx >= innerWidth || sy >= innerHeight || SPM.uiOver(sx, sy, cv);
    }
    return E.hid;
  }
  // the counts since the last time, per placement ({pl, imp, re, sec, m, u}), handed over to be sent (ui/10r-sponsor.js SPM.take)
  function signTake(){ return SPM.take(); }
