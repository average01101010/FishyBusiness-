  // ---------- the rescue boat (tools/boats/redning.py) and its tow line, where core/05-vessels.js towPose says ----------
  // the tow line to a boat in tow (core/09g-turer.js): from your stern to her bow, a little sag
  let TOWR = null;
  function drawTowLine(BMrel, VP){
    const n = npcNow.find(q => ((q.tur && q.st === 'tow') || q.ptow) && q.M); if (!n) return;
    if (!TOWR){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.95, 0.72, 0.12, 0.2], 6); TOWR = r.mesh(); }
    // the models' bow is at -z, the stern at +z: from your stern to her bow, or (towed by a player) from your bow to her stern
    const G = GEO(vtype()), head = n.ptow === 'head', A = head ? xf(BMrel, [0, (G.gw || 1) + 0.25, (G.bow || -3) + 0.4]) : xf(BMrel, [0, (G.gw || 1) + 0.25, (G.stern || 3) - 0.4]),
      B = head ? xf(n.M, [0, 1.1, (n.L || 8) / 2 - 0.3]) : xf(n.M, [0, 1.1, -(n.L || 8) / 2 + 0.3]);
    const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), sag = 0.012 * d + 0.4;
    nSetup(VP); let prev = A;
    for (let k = 1; k <= 12; k++){ const s = k / 12, P = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - sag * 4 * s * (1 - s), A[2] + (B[2] - A[2]) * s]; drawN(TOWR, limbM(prev, P, 0.03)); prev = P; }
  }
  // ---------- the boat's own anchor (tools/deck/anker.py, core/06e-anchor.js; Jonas 21.10.2026) ----------
  // Stowed in its bow roller or hawse pipe (geo.bower; the spare in the other hawse). Let go, it drops from the fairlead and the rode
  // runs out after it while she falls back; then it lies on the catenary from the fairlead to the bottom, the touchdown nearer the anchor
  // the harder she pulls, and she swings round it with the wind and the current (the core moves her). Weighing, the chain comes in over
  // the roller or into the hawse, she comes up over the anchor, it breaks out and rises dripping to its place. The length out comes from
  // the core's minute (b.anch.out0 to out), the fall on the view's own clock (3 m/s, the payout's pace at the game's rate). The chain
  // link by link from the windlass's gypsy to the fairlead and down to a little under the water, deeper a tube; on the small boats a
  // rope with a few metres of chain at the anchor. An anchor that is gone from the core without being hauled (a dock, a tow, a gale) is
  // reeled in quickly here.
  const ANC3 = {key:null, t0:0, fresh:false, Lg:0, wasUp:false, splash:false, mode:'stow', links:0, A:null, E:null, last:0};
  let ROPEA = null, CHTA = null;
  const aU = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, aX = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // a frame from its z axis and an up hint, scaled, at o (columns x, y, z, origin)
  function frameM(o, z, up, s){ z = aU(z); let x = aX(up, z); if (Math.hypot(x[0], x[1], x[2]) < 1e-4) x = aX([1, 0, 0], z); x = aU(x); const y = aX(z, x); return new Float32Array([x[0] * s, x[1] * s, x[2] * s, 0, y[0] * s, y[1] * s, y[2] * s, 0, z[0] * s, z[1] * s, z[2] * s, 0, o[0], o[1], o[2], 1]); }
  // one mesh drawn many times: the buffers bound once
  function drawMany(m, Ms){ if (!m || !Ms.length) return; attr(0, m.pb, 3); attr(1, m.nb, 3); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); for (const M of Ms){ gl.uniformMatrix4fv(PRGN.u.uM, false, M); gl.drawArrays(gl.TRIANGLES, 0, m.n); } }
  // the anchor's mesh and its scale (the grapnel is the gear kit's, its shank turned onto +z)
  function ancMesh(bw){
    if (bw.kind === 'dregg'){ if (!GB) buildGear(); return GB.dregg ? {m:GB.dregg, pre:M4.RX(-Math.PI / 2), s:1} : null; }
    const m = kit('anchor', bw.kind === 'hall' ? 'hall' : 'plog'); return m ? {m, pre:null, s:bw.kind === 'hall' ? Math.cbrt((bw.kg || 1000) / 1000) : Math.cbrt((bw.kg || 20) / 20)} : null;
  }
  // where it lies stowed, in the boat's frame: its eye, the shank's way to the crown and its upper side
  function ancStow(F, P, bw, L){
    if (bw.stow && bw.stow.eye){ const e = bw.stow.eye, c = bw.stow.crown; return {eye:e, dir:aU([c[0] - e[0], c[1] - e[1], c[2] - e[2]]), up:[0, 1, 0]}; }
    if (P){ const d = aU([F[0] - P[0], F[1] - P[1], F[2] - P[2]]), out = [Math.sign(F[0]) || 1, 0, 0], cr = [F[0] + out[0] * 0.03 * L, F[1], F[2]];
      // the shank up the hawse pipe, the crown at its mouth, the flukes turned up outside against the hull's side (they tilt off the
      // shank towards their -y, here outwards, as much as the pipe leans in)
      return {eye:[cr[0] - d[0] * 0.92 * L, cr[1] - d[1] * 0.92 * L, cr[2] - d[2] * 0.92 * L], dir:d, up:[-out[0], 0, 0]}; }
    const a = 12 * Math.PI / 180;   // in the roller: the shank along it, the eye aft, the fluke hanging over the stem
    return {eye:[F[0], F[1] + 0.03 * L, F[2] + 0.62 * L], dir:[0, -Math.sin(a), -Math.cos(a)], up:[0, Math.cos(a), -Math.sin(a)]};
  }
  // the rode from the bottom to the fairlead: A the anchor's eye, F the fairlead (both relative to the eye of the view), Lr the length
  // out: lying on the bottom from the anchor to the touchdown, then the catenary up to the fairlead; straight when it is taut
  function rodePts(A, F, Lr, n){
    const dx = F[0] - A[0], dz = F[2] - A[2], D = Math.hypot(dx, dz) || 1e-6, ux = dx / D, uz = dz / D, h = Math.max(0.1, F[1] - A[1]);
    const line = (P, Q, k) => Array.from({length:k + 1}, (_, i) => [P[0] + (Q[0] - P[0]) * i / k, P[1] + (Q[1] - P[1]) * i / k, P[2] + (Q[2] - P[2]) * i / k]);
    if (D >= Math.sqrt(Math.max(0, Lr * Lr - h * h)) - 0.05) return line(A, F, n);
    if (D <= Lr - h){ const T = [F[0], A[1], F[2]]; return line(A, T, 2).concat(line(T, F, n).slice(1)); }
    const X = a => { const s = Math.sqrt(h * h + 2 * h * a); return (Lr - s) + a * Math.asinh(s / a); };
    let lo = Math.log(1e-3), hi = Math.log(1e6); for (let i = 0; i < 36; i++){ const m = (lo + hi) / 2; if (X(Math.exp(m)) > D) hi = m; else lo = m; }
    const a = Math.exp((lo + hi) / 2), s = Math.sqrt(h * h + 2 * h * a), Lb = Math.max(0, Lr - s), xs = a * Math.asinh(s / a), T = [A[0] + ux * Lb, A[1], A[2] + uz * Lb], out = [A, T];
    for (let k = 1; k <= n; k++){ const x = xs * k / n; out.push([T[0] + ux * x, A[1] + a * (Math.cosh(x / a) - 1), T[2] + uz * x]); }
    out[out.length - 1] = F.slice(); return out;
  }
  // the links along a polyline from its start (the fairlead) for as far as the water lets them be seen (wy: the water's height), the rest
  // as a tube; on rope the rope down to the last few metres
  function rodeDraw(pts, dm, rope, wy, Lr, CH, M){
    const pitch = 4 * dm, deep = wy - 1.2; let s = 0, k = 0, carry = 0;
    for (let i = 0; i + 1 < pts.length; i++){
      const P = pts[i], Q = pts[i + 1], d = [Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]], l = Math.hypot(d[0], d[1], d[2]); if (l < 1e-6) continue;
      const t = [d[0] / l, d[1] / l, d[2] / l], chainHere = !rope || s > Lr - 10;
      if (rope && !chainHere) drawN(ROPEA, limbM(P, Q, 0.008 + dm * 0.9));
      else if (!CH || (P[1] < deep && Q[1] < deep)) drawN(CHTA, limbM(P, Q, dm * 1.6));
      else {
        // links down to where the segment goes under (a long first segment of the catenary dives from the hawse), a tube on from there
        const xa = P[1] >= deep && Q[1] >= deep ? l : P[1] >= deep ? l * (P[1] - deep) / (P[1] - Q[1]) : 0, xb = P[1] < deep ? l * (deep - P[1]) / (Q[1] - P[1]) : 0;
        const at = x => [P[0] + t[0] * x, P[1] + t[1] * x, P[2] + t[2] * x];
        if (xb > 0) drawN(CHTA, limbM(P, at(xb), dm * 1.6));
        if (xa < l && P[1] >= deep) drawN(CHTA, limbM(at(xa), Q, dm * 1.6));
        const u1 = aU(Math.abs(t[1]) > 0.9 ? aX(t, [1, 0, 0]) : aX(t, [0, 1, 0])), u2 = aX(t, u1), x0 = P[1] >= deep ? 0 : xb, x1 = P[1] >= deep ? xa : l;
        for (let x = x0 + carry; x < x1; x += pitch) M.push(frameM(at(x + pitch / 2), t, k++ % 2 ? u2 : u1, dm));
        carry = (carry - (x1 - x0)) % pitch; if (carry < 0) carry += pitch;
      }
      s += l;
    }
    return k;
  }
  // a splash where the anchor goes in, and drops off it as it comes up (into the spindrift's particles)
  function ancSplash(x, y, z, n, up){ for (let j = 0; j < n; j++){ const i = SD.n = (SD.n + 1) % SDN, a = Math.random() * 6.2832, v = up ? 0.2 + Math.random() * 0.4 : 0.6 + Math.random() * 1.4;
    SD.x[i] = x + Math.sin(a) * 0.1; SD.z[i] = z + Math.cos(a) * 0.1; SD.y[i] = y; SD.vx[i] = Math.sin(a) * v; SD.vz[i] = Math.cos(a) * v; SD.vy[i] = up ? -0.5 : 1.2 + Math.random() * 2.2; SD.age[i] = 0; SD.life[i] = up ? 0.5 : 0.6 + Math.random() * 0.6; } }
  // another boat's anchors, stowed (the near ones, with their glass in)
  function drawNPCAnchor(n, K){
    const bw = K.geo && K.geo.bower; if (!bw || !bw.fair) return; const AM = ancMesh(bw); if (!AM) return; const M = chain(n.M, K.S), L = anchorLen(bw);
    for (const f of [bw, bw.spare]) if (f && f.fair){ const st = ancStow(f.fair, f.pipe, bw, L), Mm = chain(M, frameM(st.eye, st.dir, st.up, AM.s)); drawN(AM.m, AM.pre ? chain(Mm, AM.pre) : Mm); }
  }
  function drawAnchor(BMrel, eye, VP, t){
    const b = S.boat, G = GEO(vtype()), bw = G.bower; if (!bw || !bw.fair || b.land) return;
    const AM = ancMesh(bw); if (!AM) return;
    if (!ROPEA){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.52, 0.40, 0.24, 0.15], 6); ROPEA = r.mesh(); const c = NB(); c.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.15, 0.14, 0.3], 6); CHTA = c.mesh(); }
    nSetup(VP);
    const now = performance.now() / 1000, dt = clamp(now - (ANC3.last || now), 0, 0.2); ANC3.last = now;
    const V = VESSELS[vtype()] || {len:10}, gr = typeof anchorGear === 'function' ? anchorGear(vtype()) : {chain:V.len >= 10, d:8, hf:1}, dm = gr.d / 1000, L = anchorLen(bw);
    const CH = kit('anchor', gr.d >= 30 ? 'stud' : 'link'), Ms = [], rel = q => xf(BMrel, q), draw = M => drawN(AM.m, AM.pre ? chain(M, AM.pre) : M);
    const st = ancStow(bw.fair, bw.pipe, bw, L), Fw = rel(bw.fair), stM = chain(BMrel, frameM(st.eye, st.dir, st.up, AM.s));
    // the spare, stowed in the other hawse
    if (bw.spare && bw.spare.fair){ const s2 = ancStow(bw.spare.fair, bw.spare.pipe, bw, L); draw(chain(BMrel, frameM(s2.eye, s2.dir, s2.up, AM.s))); }
    const a = b.anch && b.status !== 'port' ? b.anch : null, fr = typeof liveFrac === 'function' ? liveFrac() : 0, h = a ? (a.depth || 10) + Math.max(0.3, Fw[1] + eye[1]) : 10;
    let Lr = 0;
    if (a){
      if (ANC3.key !== a.t0){ ANC3.key = a.t0; ANC3.t0 = now; ANC3.fresh = S.t - a.t0 < 3; ANC3.splash = false; }
      const o0 = a.out0 != null ? a.out0 : a.out || 0, Lc = o0 + ((a.out || 0) - o0) * fr, fall = ANC3.fresh ? 3 * (now - ANC3.t0) : 1e9;
      Lr = a.up != null ? Lc : fall < h ? fall : Math.max(h, Lc); ANC3.Lg = Lr; ANC3.wasUp = a.up != null;
    } else if (ANC3.Lg > 0){ ANC3.Lg = Math.max(0, ANC3.Lg - dt * Math.max(3, ANC3.Lg / 4)); Lr = ANC3.Lg; }
    // the chain on deck from the gypsy to the hawse pipe or the roller
    const gy = bw.gypsy && bw.deck !== false ? bw.gypsy : null;
    if (!(Lr > 0.02)){
      ANC3.mode = 'stow'; ANC3.A = null; ANC3.links = 0; draw(stM);
      if (gy && CH){ const to = bw.pipe || st.eye; ANC3.links = rodeDraw([rel(gy), rel(to)], dm, false, 1e9, 10, CH, Ms); drawMany(CH, Ms); }
      return;
    }
    if (gy && CH) rodeDraw([rel(gy), rel(bw.pipe || bw.fair)], dm, false, 1e9, 10, CH, Ms);
    const wy = seaH(Fw[0] + eye[0], Fw[2] + eye[2], t) - eye[1];
    let Aw, M;
    if (a && Lr >= h - 0.05){
      // on the bottom where the core has it, the shank away from the boat, the flukes dug in
      const A = [a.x * 1000 - eye[0], -(a.depth || 10) - eye[1], a.y * 1000 - eye[2]], away = aU([A[0] - Fw[0], 0, A[2] - Fw[2]]);
      Aw = A; M = frameM([A[0], A[1] - 0.12 * L, A[2]], [away[0], -0.14, away[2]], [0, 1, 0], AM.s); ANC3.mode = 'bottom';
    } else {
      // hanging under the fairlead (going down, or coming up), into its place in the roller or the hawse over the last of it
      const E = [Fw[0], Fw[1] - Lr, Fw[2]], fwd = aU(xf(BMrel, [0, 0, -1]).map((v, i) => v - rel([0, 0, 0])[i])), sw = Math.sin(now * 1.3) * 0.08;
      let Mh = frameM(E, [sw, -1, 0], fwd, AM.s); const u = clamp(1 - Lr / (1.2 * L), 0, 1);
      if (u > 0){ const se = rel(st.eye), sd = aU(xf(BMrel, st.dir).map((v, i) => v - rel([0, 0, 0])[i])), su = aU(xf(BMrel, st.up).map((v, i) => v - rel([0, 0, 0])[i])), k = u * u * (3 - 2 * u);
        Mh = frameM([E[0] + (se[0] - E[0]) * k, E[1] + (se[1] - E[1]) * k, E[2] + (se[2] - E[2]) * k], [sw + (sd[0] - sw) * k, -1 + (sd[1] + 1) * k, sd[2] * k], [fwd[0] + (su[0] - fwd[0]) * k, fwd[1] + (su[1] - fwd[1]) * k, fwd[2] + (su[2] - fwd[2]) * k], AM.s); }
      Aw = E; M = Mh; ANC3.mode = 'hang';
      // the splash where it goes in, the drops off it on the way up
      const ay = E[1];
      if (!ANC3.wasUp && a && !ANC3.splash && ay < wy){ ANC3.splash = true; ancSplash(E[0] + eye[0], wy + eye[1], E[2] + eye[2], 26, false); }
      if ((ANC3.wasUp || !a) && ay > wy && ay < wy + 3 && Math.random() < dt * 14) ancSplash(E[0] + eye[0], ay + eye[1] - 0.2, E[2] + eye[2], 1, true);
    }
    draw(M); ANC3.A = Aw;
    const pts = ANC3.mode === 'bottom' ? rodePts(Aw, Fw, Lr, 16).reverse() : [Fw, Aw];
    ANC3.links = rodeDraw(pts, dm, !gr.chain, wy, Lr, CH, Ms); drawMany(CH, Ms);
  }
  let RB = null;
  function buildRescue(){
    if (typeof glbHas !== 'function' || !glbHas('redning')) return;
    const G = glbLoad('redning'), up = nm => { const o = glbPart('redning', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.95, 0.72, 0.12, 0.2], 6);
    RB = {hull:up('hull'), blue:up('blue'), rope:r.mesh(), ex:(G && G.ex) || {}, M:null, q:null};
  }
  function drawRescue(BMrel, eye, VP, t){
    if (!RB) return; RB.M = null; RB.q = null;
    const q = S.boat.status === 'tow' && typeof towPose === 'function' ? towPose(liveFrac()) : null; if (!q || !RB.hull) return;
    const x = q.r.p.x * 1000, z = q.r.p.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) > 12000) return;
    const y = (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.7;
    RB.q = q; RB.M = model(x - eye[0], y - eye[1], z - eye[2], -q.r.hd, Math.sin(t * 0.8 + z) * 0.02, Math.sin(t * 1.0 + x) * 0.03 * (0.3 + WV.hs));
    nSetup(VP); drawN(RB.hull, RB.M); if (RB.blue && Math.floor(t * 2.5) % 2 === 0) drawN(RB.blue, RB.M);
    // the tow line from the hook to your bow: slack while it is made fast, near taut under tow
    if ((q.ph === 'hook' && q.slack < 0.7) || q.ph === 'tow'){
      const G = GEO(vtype()), A = xf(BMrel, [0, (G.gw || 1) + 0.15, G.bow + 0.3]), B = xf(RB.M, RB.ex.tow || [0, 2, 5]);
      const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), sag = q.ph === 'tow' ? 0.01 * d + 0.3 : q.slack * 0.3 * d + 0.5;
      let prev = A; for (let k = 1; k <= 10; k++){ const s = k / 10, P = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - sag * 4 * s * (1 - s), A[2] + (B[2] - A[2]) * s]; drawN(RB.rope, limbM(prev, P, 0.035)); prev = P; }
    }
  }
  function drawRescueLights(VP, t){
    if (!RB || !RB.M || !RB.ex.lights) return;
    const flash = Math.floor(t * 2.5) % 2 === 0, BL = [0.25, 0.45, 1];
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const [lx, ly, lz, c] of RB.ex.lights){ if (c === 'b' ? !flash : env.night < 0.05) continue; const q = xf(RB.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = c === 'b' ? Math.max(0.6, env.night) : env.night; drawPts(1, gl.POINTS, VP, c === 'b' ? BL : NLC[c], c === 'b' ? 900 : 500, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  // ---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------
  // The landing block on the shore at the dock's root, the aluminium gangway hinged on it and resting on the first pontoon with its
  // rollers (steeper at low water), the concrete pontoons riding the tide, the last with its ladder and life ring; the buoys on the swell.
  let DKM = null;
  function buildDocks(){
    DKM = false; if (typeof glbHas !== 'function' || !glbHas('brygge')) return;
    const up = nm => { const o = glbPart('brygge', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    DKM = {kar:up('landkar'), gang:up('landgang'), pon:up('ponton'), end:up('ponton_end'), fin:up('finger'), boye:up('boye'), kaib:up('kai_betong'), ktre:up('kai_tre')};
    if (!DKM.pon || !DKM.gang) DKM = false;
  }
  function drawDocks(eye, t, VP){
    if (typeof MOOR === 'undefined' || !VEC.tiles.size) return;
    const R = 1500, H = [];
    for (const tl of vecTilesIn(eye[0] - R, eye[2] - R, eye[0] + R, eye[2] + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - eye[0], h.y * 1000 - eye[2]) < R + 500) H.push(h);
    if (!H.length) return; if (DKM === null) buildDocks(); if (!DKM) return;
    nSetup(VP); const tide = env.tide || 0;
    // the berths the company holds along a quay face or the shore of a harbour (core/07e-havn.js): a quay front where she lies, in 6 m
    // bays, its top 2.4 m over mean sea level: concrete at a quay (kai_betong: the face at z = 0, the deck back to z = -5), and a timber
    // pier on piles along the shore for a boat under 15 m (kai_tre: 4.2 m wide about z = 0, so its middle 2.3 m in from the face); the
    // piers are drawn already
    if (DKM.kaib && typeof havnStore === 'function'){ const st = havnStore();
      for (const id in st.s){ const s = st.s[id], f = s.face; if (!s.vid || !f || f.dock || !(f.kind === 2 || f.kind === 3) || Math.hypot(f.x - eye[0], f.z - eye[2]) > R) continue;
        let yaw = Math.atan2(-f.uz, f.ux); if (-f.uz * f.nx + f.ux * f.nz < 0) yaw += Math.PI;
        const tre = f.kind === 3 && s.L < 15 && DKM.ktre, M = tre ? DKM.ktre : DKM.kaib, bk = tre ? 2.3 : 0;
        const n = Math.ceil((s.L + 4) / 6); for (let k = 0; k < n; k++){ const a = (k - (n - 1) / 2) * 6; drawN(M, model(f.x + f.ux * a - f.nx * bk - eye[0], -eye[1], f.z + f.uz * a - f.nz * bk - eye[2], yaw, 0, 0)); } } }
    for (const h of H){
      for (const d of h.docks || []){ const [ox, oz] = d.o, [nx, nz] = d.n; if (Math.hypot(ox - eye[0], oz - eye[2]) > R) continue;
        const yaw = Math.atan2(-nz, nx), fl = tide + FDOCK.FB, top = FDOCK.QTOP + 0.16, dh = top - fl, run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
        if (DKM.kar) drawN(DKM.kar, model(ox - eye[0], -eye[1], oz - eye[2], yaw, 0, 0));
        // the pontoons heave a little with the swell where they lie, the whole string as one
        const sm = d.s0 + d.np * FDOCK.PL / 2, wx = ox + nx * sm, wz = oz + nz * sm, y = tide + (seaH(wx, wz, t) - tide) * 0.3;
        for (let k = 0; k < d.np; k++){ const s = d.s0 + FDOCK.PL * (k + 0.5);
          drawN(k === d.np - 1 && DKM.end ? DKM.end : DKM.pon, model(ox + nx * s - eye[0], y - eye[1], oz + nz * s - eye[2], yaw, 0, 0)); }
        drawN(DKM.gang, model(ox - eye[0], top - eye[1], oz - eye[2], yaw, 0, -Math.atan2(dh - (y - tide), run)));
      }
      if (DKM.boye) for (const b of h.boats){ const q = b.moored && b.moored.buoy; if (!q) continue; const x = q.x * 1000, z = q.y * 1000;
        if (Math.hypot(x - eye[0], z - eye[2]) > R) continue;
        const y = seaH(x, z, t), sx = (seaH(x + 0.5, z, t) - seaH(x - 0.5, z, t)), sz = (seaH(x, z + 0.5, t) - seaH(x, z - 0.5, t));
        drawN(DKM.boye, model(x - eye[0], y - eye[1], z - eye[2], 0, -sz * 0.8, sx * 0.8)); }
    }
    gl.useProgram(PL.p);
  }
  // ---------- the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94) ----------
  // (built a dock a step in the tile's statics job, tileStatics: floatJob)
  // Each dock's lines become the harbour's modules: pontoons of 12 m along a line of 1.6 m and wider (scaled along to fit each leg and
  // across to its width), the end pontoon with its ladder and life ring at an open end, fingers of 8 m from the end where they join; at
  // an end with land or a pier within 10 m beyond it, the abutment there and the gangway down onto the dock (one a dock, the nearest).
  // Within FLNEAR of the eye (by the quality level) the modules in sight are drawn (800 to 1 600 triangles each, one draw each; the
  // densest marinas, round Oslo, have some 300 within 350 m); the whole tile as low boxes in one mesh, a little
  // inside the modules so they cover them near. Both ride the tide, the modules heaving a little with the swell. The camera's solids
  // are the decks from below the water to over the rails.
  const FLT = new Map(), FLNEAR = [150, 250, 350, 450];   // by QUAL.lvl
  const distPL = (x, z, p) => { let b = 1e9; for (let i = 0; i + 1 < p.length; i++){ const [ax, az] = p[i], [bx, bz] = p[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9, u = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); b = Math.min(b, Math.hypot(ax + dx * u - x, az + dz * u - z)); } return b; };
  // a module's matrix but for its place: turned to (ux, uz) and scaled sx along, sz across (the place is set as it is drawn)
  const flM = (ux, uz, sx, sz) => new Float32Array([ux * sx, 0, uz * sx, 0, 0, 1, 0, 0, -uz * sz, 0, ux * sz, 0, 0, 0, 0, 1]);
  function floatFree(k){ const F = FLT.get(k); if (F && F.mesh && gl) freeMesh(F.mesh); FLT.delete(k); }
  function floatJob(t, FD, solid){
    const far = MB(), docks = [], DK = [0.42, 0.36, 0.3], SD = [0.6, 0.6, 0.58], P = FDOCK;
    const box = (x, z, ux, uz, w, l) => far.box(x, -0.35, z, w, 0.77, l, SD, Math.atan2(ux, uz), DK);
    // the tile's lines with their boxes: an end within 1.5 m of another line, of this dock or another (OpenStreetMap often has each arm
    // of a dock as a pier of its own), is joined there
    const LS = []; for (const d of FD) for (const L of d.L){ let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (const [x, z] of L.p){ x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } LS.push({L, x0, z0, x1, z1}); }
    const joinedAt = (x, z, self) => LS.some(o => o.L !== self && x > o.x0 - 2 && x < o.x1 + 2 && z > o.z0 - 2 && z < o.z1 + 2 && distPL(x, z, o.L.p) < 1.5);
    const dock = d => {
      const D = {mx:d.mx, mz:d.mz, r:0, mods:[]};
      // the open ends of its pontoon lines, each with how far beyond it land or a pier is (within 10 m): the nearest has the dock's one
      // gangway, one that lies against land (3 m) nothing, the others the end pontoon
      const LP = [], ends = [];
      for (const L of d.L){
        const p = L.p.slice(), n = p.length; if (n < 2) continue;
        const fin = L.w < 1.6, j0 = joinedAt(p[0][0], p[0][1], L), j1 = joinedAt(p[n - 1][0], p[n - 1][1], L);
        if (fin && !j0 && j1) p.reverse();   // a finger from where it joins
        const E = {L, p, fin, e:[null, null]}; LP.push(E); if (fin) continue;
        for (const [k, e, f] of [[0, p[0], p[1]], [1, p[n - 1], p[n - 2]]]){ if (k ? j1 : j0) continue;
          const dx = e[0] - f[0], dz = e[1] - f[1], l = Math.hypot(dx, dz) || 1, ox = dx / l, oz = dz / l; let sd = null;
          for (let s = 1; s <= 10 && sd === null; s++) if (solid(e[0] + ox * s, e[1] + oz * s)) sd = s;
          ends.push({E, k, e, ox, oz, sd}); E.e[k] = 'end'; }
      }
      const g = ends.filter(q => q.sd !== null).sort((a, b) => a.sd - b.sd)[0];
      for (const q of ends){
        if (q === g){ const x = q.e[0] + q.ox * q.sd, z = q.e[1] + q.oz * q.sd; q.E.e[q.k] = 'gang';
          D.mods.push({M:'kar', x, z, m:flM(-q.ox, -q.oz, 1, 1)}, {M:'gang', x, z, ux:-q.ox, uz:-q.oz}); box(x - q.ox * 1.6, z - q.oz * 1.6, q.ox, q.oz, 3.2, 3.2); }
        else if (q.sd !== null && q.sd <= 3) q.E.e[q.k] = null; }
      for (const {L, p, fin, e:[e0, e1]} of LP){
        const n = p.length;
        for (let i = 0; i + 1 < n; i++){
          const [ax, az] = p[i], [bx, bz] = p[i + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
          const ux = (bx - ax) / len, uz = (bz - az) / len;
          D.r = Math.max(D.r, Math.hypot(ax - d.mx, az - d.mz), Math.hypot(bx - d.mx, bz - d.mz));
          camSolid((ax + bx) / 2, (az + bz) / 2, L.w, len, Math.atan2(ux, uz), -1, 1.3, t.k);
          if (fin){ const k = Math.max(1, Math.round(len / 8)), sx = len / (k * 8), sz = clamp(L.w / 0.8, 0.7, 2);
            for (let j = 0; j < k; j++) D.mods.push({M:'fin', x:ax + ux * len * j / k, z:az + uz * len * j / k, m:flM(ux, uz, sx, sz)});
            box((ax + bx) / 2, (az + bz) / 2, ux, uz, L.w * 0.9, len); continue; }
          const k = Math.max(1, Math.round(len / P.PL)), sx = len / (k * P.PL), sz = clamp(L.w / P.PW, 0.7, 1.6);
          for (let j = 0; j < k; j++){ const s = len * (j + 0.5) / k, x = ax + ux * s, z = az + uz * s;
            if (e0 === 'end' && i === 0 && j === 0) D.mods.push({M:'end', x, z, m:flM(-ux, -uz, sx, sz)});
            else if (e1 === 'end' && i === n - 2 && j === k - 1) D.mods.push({M:'end', x, z, m:flM(ux, uz, sx, sz)});
            else D.mods.push({M:'pon', x, z, m:flM(ux, uz, sx, sz)}); }
          box((ax + bx) / 2, (az + bz) / 2, ux, uz, P.PW * sz * 0.92, len);
        }
      }
      if (D.mods.length) docks.push(D);
    };
    // a dock a step of the tile's job (tileStep, a few milliseconds a frame: Bergen's 339 docks were 150 ms in one), the mesh at its end
    return {items:FD.map(d => () => dock(d)), done:() => ({docks, mesh:far.p.length ? far.mesh([t.x0 + 25000, t.z0 + 25000]) : null})};
  }
  const FLN = {n:0};
  function drawFloats(eye, t, VP){
    FLN.n = 0; if (!FLT.size) return; let on = false;
    const tide = env.tide || 0, top = FDOCK.QTOP + 0.16, R = FLNEAR[QUAL.lvl] || 350;
    // in front of the eye and near the picture (clip space, with a margin for a module's size)
    const vis = (x, y, z) => { const w = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (w < -10) return false; const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12]; return Math.abs(cx) <= w * 1.3 + 10; };
    for (const F of FLT.values()) for (const D of F.docks){
      if (Math.hypot(D.mx - eye[0], D.mz - eye[2]) > R + D.r) continue;
      if (!on){ if (DKM === null) buildDocks(); if (!DKM || !DKM.fin) return; nSetup(VP); on = true; }
      const y = tide + (seaH(D.mx, D.mz, t) - tide) * 0.3;
      for (const q of D.mods){
        if (Math.abs(q.x - eye[0]) > R || Math.abs(q.z - eye[2]) > R || !vis(q.x - eye[0], y - eye[1], q.z - eye[2])) continue; FLN.n++;
        if (q.M === 'gang'){ const dh = top - (y + FDOCK.FB), run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
          drawN(DKM.gang, model(q.x - eye[0], top - eye[1], q.z - eye[2], Math.atan2(-q.uz, q.ux), 0, -Math.atan2(dh, run))); continue; }
        const M = q.m; M[12] = q.x - eye[0]; M[13] = (q.M === 'kar' ? 0 : y) - eye[1]; M[14] = q.z - eye[2]; drawN(DKM[q.M], M);
      }
    }
    if (on) gl.useProgram(PL.p);
  }
  // ---------- aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye ----------
  let AIRM = null, airNow = [];
  function buildAir(){
    if (typeof glbHas !== 'function' || !glbHas('air')) return;
    const G = glbLoad('air'), up = nm => { const o = glbPart('air', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    AIRM = {plane:up('plane'), prop:up('prop'), heli:up('heli'), rotor:up('rotor'), trotor:up('trotor'), ex:(G && G.ex) || {}};
  }
  function drawAir(eye, t, H, VP){
    airNow = []; if (!AIRM || !AIRM.plane || typeof airStates !== 'function') return;
    for (const a of airStates(H, {x:eye[0] / 1000, y:eye[2] / 1000}, 15)){
      const x = a.p.x * 1000, z = a.p.y * 1000, y = a.alt;
      a.w = [x, y, z]; a.M = model(x - eye[0], y - eye[1], z - eye[2], -a.hd, a.pitch, 0); airNow.push(a);
    }
    if (!airNow.length) return;
    nSetup(VP); const ex = AIRM.ex;
    for (const a of airNow){
      if (a.kind === 'plane'){ drawN(AIRM.plane, a.M); for (const h of ex.props || []) drawN(AIRM.prop, chain(a.M, M4.T(h[0], h[1], h[2]), M4.RZ(t * 31 + h[0]))); }
      else { const r = ex.rotor || [0, 2.75, 0], tr = ex.trotor || [-0.32, 2.75, 9]; drawN(AIRM.heli, a.M); drawN(AIRM.rotor, chain(a.M, M4.T(r[0], r[1], r[2]), M4.RY(t * 27))); drawN(AIRM.trotor, chain(a.M, M4.T(tr[0], tr[1], tr[2]), M4.RX(t * 70))); }
    }
  }
  // their lights: red to port, green to starboard and white aft at night; the red beacons and the white strobes flash day and night
  function drawAirLights(VP, t){
    if (!airNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    const beac = (t % 1) < 0.12, strobe = (t % 1.3) < 0.06 || ((t % 1.3) > 0.16 && (t % 1.3) < 0.22), BCOL = [1, 0.1, 0.06], SCOL = [1, 1, 1];
    for (const a of airNow){ for (const [lx, ly, lz, c] of (a.kind === 'plane' ? AIRM.ex.planeLights : AIRM.ex.heliLights) || []){
      const fl = c === 'B' || c === 'S'; if (fl ? !(c === 'B' ? beac : strobe) : env.night < 0.05) continue;
      const q = xf(a.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = fl ? Math.max(0.55, env.night) : env.night;
      drawPts(1, gl.POINTS, VP, c === 'B' ? BCOL : c === 'S' ? SCOL : NLC[c], fl ? 2600 : 1400, true); } }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function drawNPCGlass(VP){ for (const n of npcNow) if (n.K && n.K.glass) drawGlass(n.K.glass, chain(n.M, n.K.S), VP); }
  function drawNPCLights(VP){
    if (env.night < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){
      // the same rules as the own boat (vessel3d.js lanterns): fishing red over white, under way the full set, in port nothing
      const stN = {port:n.st === 'port', fishing:n.st === 'fishing', v:n.st === 'fishing' ? 0 : 5, anch:false};
      if (n.K){ const M = chain(n.M, n.K.S), px = n.L < 14 ? 260 : 600; for (const [p, col] of lanterns(n.K.geo, {len:n.L || 8, vmax:10}, stN)){ const q = xf(M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, px, true); } continue; }
      const LG = NPCM.lanG || (NPCM.lanG = {}), GN = LG[n.type] || (LG[n.type] = {lights:(NPCM.lights[n.type] || []).map(([lx, ly, lz, c]) => [[lx, ly, lz], NLC[c]])});
      for (const [p, col] of lanterns(GN, {len:n.L || 20, vmax:12}, stN)){ const q = xf(n.M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, NPCM.lightPx[n.type] || 900, true); } }
    const cs = npcNow.find(n => n.type === 'coastal');
    if (cs){ let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) for (const sx of [-1, 1]){ if (hash(r * 97 + i * 13 + (sx > 0 ? 5 : 0)) < 0.35) continue; const q = xf(cs.M, [sx * 8.95, 8.5 + r * 3.2, -24 + i * 3.4]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } drawPts(k, gl.POINTS, VP, [1, 0.8, 0.5], 420, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  // ---------- the chase camera stays out of solid things ----------
  // Quays and breakwaters, bridge decks and their piers, lighthouses, the plant's silo and crane, and the buildings, as oriented
  // boxes in a 200 m grid (buildings are added a map cell at a time when the camera first comes near). Each frame the line from the
  // boat to the eye is checked: the camera tilts up over what is in the way, and what is still in the way pulls it in along the line.
  const CAMG = new Map(), CAMC = 200, CAMBLD = new Set(); let camStamp = 0, camPull = 1, camLift = 0;
  // a box the way MB.box draws it: centre x, z; size sx across and sz along the heading ry; from y0 up to y1
  function camSolid(x, z, sx, sz, ry, y0, y1, tag){
    const b = {x, z, c:Math.cos(ry), s:Math.sin(ry), hx:sx / 2, hz:sz / 2, y0, y1, m:0, tag}, r = Math.hypot(sx, sz) / 2;
    for (let gx = Math.floor((x - r) / CAMC); gx <= Math.floor((x + r) / CAMC); gx++) for (let gz = Math.floor((z - r) / CAMC); gz <= Math.floor((z + r) / CAMC); gz++){
      const k = gridKey(gx, gz); let a = CAMG.get(k); if (!a) CAMG.set(k, a = []); a.push(b); }
  }
  // the buildings of one 1 km map cell, as tall as buildChunk makes them at most (walls, roof and the rise of the ground)
  const BLD_WALL = {1:6, 3:2.6, 4:2.9, 5:3.1, 6:5.2, 7:2.3, 8:7.5, 11:7, 12:1.8, 13:2.6, 14:2.5, 15:1.2}, BLD_ROOF = {3:[0.22, 2], 5:[0.45, 6], 6:[0.4, 7], 7:[0.3, 2], 11:[0.6, 9]};
  function camBuildings(key){
    if (!CAMBLD.has(key)){ CAMBLD.add(key); if (BLD) camBld(BLD, BLD.cells.get(key)); }
    // a pack's: once its tile is decoded (a tile whose pack is on its way is looked at again)
    const vk = 'v' + key; if (CAMBLD.has(vk)) return;
    const T = MAPD.man ? MAPD.man.tile : 50, tx = Math.floor(gridKeyX(key) / T), ty = Math.floor(gridKeyY(key) / T), t = vecTile(tx, ty);
    if (!t && vecHas(tx, ty)) return;
    CAMBLD.add(vk); if (t && t.bld) camBld(t.bld, vecBldIn(t, key), t.k);
  }
  function camBld(B, idx, tag){
    for (const i of idx || []){
      const x = B.x[i], z = B.z[i], l = B.l[i], w = B.w[i], ty = B.t[i], lv = B.lv[i], ca = Math.cos(B.a[i]), sa = Math.sin(B.a[i]);
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(x + ca * u * l - sa * v * w, z + sa * u * l + ca * v * w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const base = Math.max(lo, 0.3) - 0.5, rise = Math.max(0, hi - base);
      const hg = ty === 1 && lv ? 2.7 * lv + 0.6 : ty === 2 ? (lv || 3) * 3 : ty === 6 && lv ? 3 * lv : ty === 8 && lv ? 4 * lv : ty === 9 || ty === 10 ? (lv || 2) * 3.4 : ty === 0 && lv ? 2.8 * lv : BLD_WALL[ty] || 3.6;
      const flat = ty === 2 || ty === 8 || ty === 9 || ty === 12 || ty === 14 || ty === 15 || (ty === 10 && w >= 14), rp = BLD_ROOF[ty] || [0.38, 6];
      camSolid(x, z, w + 0.8, l + 0.8, Math.PI / 2 - B.a[i], base, base + hg + rise + (flat ? 0.3 : Math.min(w * rp[0], rp[1]) + 0.3), tag);
    }
  }
  // what a tile of the coast's packs put in the camera's way goes with it
  function camDropTag(tag){ for (const [k, a] of CAMG){ const b = a.filter(q => q.tag !== tag); if (b.length !== a.length){ if (b.length) CAMG.set(k, b); else CAMG.delete(k); } } }
  const slab = (p, d, lo, hi, r) => { if (Math.abs(d) < 1e-9) return p >= lo && p <= hi; let a = (lo - p) / d, b = (hi - p) / d; if (a > b){ const q = a; a = b; b = q; } if (a > r[0]) r[0] = a; if (b < r[1]) r[1] = b; return r[0] <= r[1]; };
  // how much of the way from o (the boat) to e (the eye) is clear: 1 when nothing is in the way. Boxes o is inside do not count.
  function camFree(o, e){
    const dx = e[0] - o[0], dy = e[1] - o[1], dz = e[2] - o[2], x0 = Math.min(o[0], e[0]), x1 = Math.max(o[0], e[0]), z0 = Math.min(o[2], e[2]), z1 = Math.max(o[2], e[2]);
    const g0 = Math.floor(x0 / CAMC), g1 = Math.floor(x1 / CAMC), h0 = Math.floor(z0 / CAMC), h1 = Math.floor(z1 / CAMC);
    if ((g1 - g0 + 1) * (h1 - h0 + 1) > 36) return 1;   // far out the camera is high above everything
    for (let kx = Math.floor((x0 - 60) / 1000); kx <= Math.floor((x1 + 60) / 1000); kx++) for (let kz = Math.floor((z0 - 60) / 1000); kz <= Math.floor((z1 + 60) / 1000); kz++) camBuildings(gridKey(kx, kz));
    let best = 1; const st = ++camStamp, r = [0, 0];
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) for (const b of CAMG.get(gridKey(gx, gz)) || []){
      if (b.m === st) continue; b.m = st;
      const px = o[0] - b.x, pz = o[2] - b.z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * b.c - pz * b.s, dx * b.c - dz * b.s, -b.hx, b.hx, r) || !slab(px * b.s + pz * b.c, dx * b.s + dz * b.c, -b.hz, b.hz, r) || !slab(o[1], dy, b.y0, b.y1, r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    // the other boats in sight (npcNow: the coast's, Senja's fleet, the players'), each a box of her length and beam from the waterline to
    // her wheelhouse's roof (the coastal ship and the ferry to their bridges), so the camera does not go into a boat lying alongside
    for (const n of npcNow){ const L = n.L || 9, B = n.B || L / 3, x = n.p.x * 1000, z = n.p.y * 1000, rr = L / 2 + B;
      if (x + rr < x0 || x - rr > x1 || z + rr < z0 || z - rr > z1) continue;
      const big = n.type === 'coastal' || n.type === 'ferry', cs = Math.sin(n.hd || 0), sn = Math.cos(n.hd || 0), px = o[0] - x, pz = o[2] - z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * cs - pz * sn, dx * cs - dz * sn, -L / 2, L / 2, r) || !slab(px * sn + pz * cs, dx * sn + dz * cs, -B / 2, B / 2, r) || !slab(o[1], dy, (env.tide || 0) - 1, (env.tide || 0) + (big ? 18 : Math.min(7, 2 + L * 0.25)), r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    return best;
  }
  // is a point inside something solid (for the tests)
  function camInside(x, y, z){ camBuildings(gridKey(Math.floor(x / 1000), Math.floor(z / 1000))); for (const b of CAMG.get(gridKey(Math.floor(x / CAMC), Math.floor(z / CAMC))) || []){ const px = x - b.x, pz = z - b.z, lx = px * b.c - pz * b.s, lz = px * b.s + pz * b.c; if (Math.abs(lx) <= b.hx && Math.abs(lz) <= b.hz && y >= b.y0 && y <= b.y1) return true; } return false; }
  let lastEye = [0, 0, 0], camFwd = [0, -1], earT = 0;
  // the compass line at the top of the 3D view (the user's wish 02.10.2026): the true bearing the camera looks along, thin ticks every
  // 5 degrees, the quarters and eighths by name and the tens of degrees between them, 70 degrees either way; drawn when it turns
  // The compass line: a strip of the whole round (and 70 degrees more each side) is drawn once per width, pixel ratio and language,
  // and each frame only shows the part round the heading (it was drawn anew with shadows at every 0.2 degrees, 03.10.2026)
  const CMPS = {el:document.getElementById('compass3d'), at:NaN, w:0, strip:null, key:''};
  function compassStrip(W, H, dpr){
    const span = 70, k = W / (2 * span), names = S.lang === 'no' ? ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const c = CMPS.strip || (CMPS.strip = document.createElement('canvas')); c.width = Math.ceil((360 + 2 * span) * k); c.height = H;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, H); g.lineCap = 'round'; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 3 * dpr;
    for (let a = -span; a <= 360 + span; a += 5){
      const x = (a + span) * k, n = ((a % 360) + 360) % 360, main = n % 45 === 0;
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = (main ? 1.6 : 1) * dpr;
      g.beginPath(); g.moveTo(x, H - 2 * dpr); g.lineTo(x, H - (main ? 9 : n % 15 === 0 ? 6 : 4) * dpr); g.stroke();
      if (main || n % 15 === 0){ g.fillStyle = '#fff'; g.font = (main ? '600 ' + Math.round(12 * dpr) : Math.round(9.5 * dpr)) + 'px sans-serif'; g.fillText(main ? names[n / 45] : String(n), x, H - 12 * dpr); }
    }
    return k;
  }
  function compassDraw(az, p){
    const el = CMPS.el; if (!el || !el.clientWidth) return;
    const deg = trueDeg(az, p); if (Math.abs(deg - CMPS.at) < 0.1 && CMPS.w === el.clientWidth) return; CMPS.at = deg; CMPS.w = el.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(el.clientWidth * dpr), H = Math.round(el.clientHeight * dpr); if (el.width !== W) el.width = W; if (el.height !== H) el.height = H;
    const key = W + ',' + H + ',' + dpr + ',' + S.lang; if (key !== CMPS.key){ CMPS.key = key; CMPS.k = compassStrip(W, H, dpr); }
    const span = 70, k = CMPS.k, g = el.getContext('2d');
    g.clearRect(0, 0, W, H); g.drawImage(CMPS.strip, (deg % 360) * k, 0, W, H, 0, 0, W, H);
    // the ends fade out (one gradient over what was drawn)
    g.globalCompositeOperation = 'destination-in'; if (!CMPS.fade || CMPS.fw !== W){ const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.5, '#000'); gr.addColorStop(0.75, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); CMPS.fade = gr; CMPS.fw = W; }
    g.fillStyle = CMPS.fade; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff5aa8'; g.beginPath(); g.moveTo(W / 2 - 4 * dpr, H); g.lineTo(W / 2 + 4 * dpr, H); g.lineTo(W / 2, H - 6 * dpr); g.closePath(); g.fill();
  }

  // ---------- frame ----------
  // «#fps» in the address: the frame rate in a corner, to measure on the tablet
  const FPS = {v:0, at:0, el:null};
  // shown with «#fps» in the address or «Vis bildetakt» in the settings (S.settings.fpsShow)
  function fpsEl(){
    const on = /fps/.test(location.hash) || !!(S.settings && S.settings.fpsShow);
    if (on && !FPS.el){ FPS.el = document.createElement('div'); FPS.el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:12px monospace;color:#fff;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:4px;pointer-events:none'; document.body.appendChild(FPS.el); }
    if (FPS.el) FPS.el.hidden = !on;
    return on ? FPS.el : null;
  }
  // ---------- cinema (the user's wish 03.10.2026) ----------
  // «Kino» lets the camera film the trip by itself: shots of 12-20 s in turn, a drone circling high, low along the side at the waterline,
  // from ahead looking back at the bow, from the shore as she passes (with a long lens), a wide shot of the landscape, and from behind over the wake. The
  // eye and the aim move through a filter of 0.7 s (cut at a new shot), the horizon is level (no roll), and a shot whose eye would be
  // in the land or the sea, or with the land between it and the boat, is passed over for the next.
  const KINO = {on:false, shot:null, n:0, eye:null, tgt:null};
  const KTYPES = ['drone', 'low', 'ahead', 'shore', 'wide', 'chase'];
  function kinoWant(K, t){
    const L = Math.max(5, (VESSELS[vtype()] || {}).len || 6), C = [bv.x, bv.y + 1.2, bv.z], fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), s = K.side, u = t - K.t0;
    const sea = (x, z) => Math.max(terrH(x, z), seaH(x, z, t));
    if (K.type === 'drone'){ const a = K.a0 + u * 0.06 * s, R = 45 + L * 3; const e = [C[0] + Math.sin(a) * R, 0, C[2] - Math.cos(a) * R]; e[1] = sea(e[0], e[2]) + 26 + L; return [e, C, 50]; }
    if (K.type === 'low'){ const e = [C[0] + rx * s * (L * 0.35 + 5) - fx * L * (0.3 - u * 0.012), 0, C[2] + rz * s * (L * 0.35 + 5) - fz * L * (0.3 - u * 0.012)]; e[1] = sea(e[0], e[2]) + 0.9; return [e, [C[0] + fx * L * 0.4, C[1], C[2] + fz * L * 0.4], 55]; }
    if (K.type === 'ahead'){ const e = [C[0] + fx * (L * 2.2 + 22) + rx * s * 5, 0, C[2] + fz * (L * 2.2 + 22) + rz * s * 5]; e[1] = sea(e[0], e[2]) + 2.6; return [e, C, 45]; }
    // from the shore a long lens: the frame about four boat lengths high wherever she is
    if (K.type === 'shore'){ const e = [K.px, sea(K.px, K.pz) + 1.8, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, C, clamp(2 * Math.atan(2 * L / Math.max(1, d)) / DEG, 6, 40)]; }
    if (K.type === 'wide'){ const e = [C[0] - fx * 120 + rx * s * 80, 0, C[2] - fz * 120 + rz * s * 80]; e[1] = sea(e[0], e[2]) + 45; return [e, [C[0] + fx * 60, C[1], C[2] + fz * 60], 55]; }
    const e = [C[0] - fx * (L * 3 + 18), 0, C[2] - fz * (L * 3 + 18)]; e[1] = sea(e[0], e[2]) + 7 + L * 0.3; return [e, [C[0] + fx * 30, C[1], C[2] + fz * 30], 50];
  }
  function kinoNext(t){
    for (let k = 0; k < KTYPES.length; k++){
      const type = KTYPES[(KINO.n++) % KTYPES.length], K = {type, t0:t, dur:12 + 8 * hash(KINO.n * 7 + 3), side:hash(KINO.n * 13 + 1) < 0.5 ? -1 : 1, a0:hash(KINO.n * 5 + 2) * 6.28};
      if (type === 'shore'){
        // a point 60-210 m off her course ahead, on the side with land if there is any near; the boat sails past it
        const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), ahead = 90 + Math.max(0, bv.spd || 0) * 6; let best = null;
        for (const off of [60, 110, 160, 210]){ for (const sd of [1, -1]){ const x = bv.x + fx * ahead + rx * sd * off, z = bv.z + fz * ahead + rz * sd * off; if (terrH(x, z) > 1.5){ best = [x, z]; break; } } if (best) break; }
        if (!best) best = [bv.x + fx * ahead + rx * K.side * 70, bv.z + fz * ahead + rz * K.side * 70];
        K.px = best[0]; K.pz = best[1];
      }
      const [e, g] = kinoWant(K, t);
      if (camFree(g, e) > 0.9){ KINO.shot = K; KINO.eye = e.slice(); KINO.tgt = g.slice(); KINO.eyeR = null; KINO.hid = 0; return; }
    }
    KINO.shot = {type:'drone', t0:t, dur:12, side:1, a0:0}; KINO.eye = null; KINO.eyeR = null; KINO.hid = 0;
  }
  // The eye and the aim are smoothed in the boat's frame (as offsets from her), so they keep up with her at the screen's speed (six
  // times real: 71 m/s at 23 knots); in the world's frame the filter of 0.7 s left them some 50 m behind her and she ran out of the
  // picture (the user 04.10.2026: «I cinematic-view vises som oftest ikke båten»). The shore camera stands still and only its aim
  // follows. A shot that loses her behind the land for a second cuts to the next.
  function kinoCam(t, rdt){
    if (!KINO.shot || t - KINO.shot.t0 > KINO.shot.dur || t < KINO.shot.t0) kinoNext(t);
    const C = [bv.x, bv.y, bv.z], [e, g, fov] = kinoWant(KINO.shot, t), k = 1 - Math.exp(-Math.min(0.25, rdt) / 0.7), fixed = KINO.shot.type === 'shore';
    const eW = fixed ? e : [e[0] - C[0], e[1] - C[1], e[2] - C[2]], gR = [g[0] - C[0], g[1] - C[1], g[2] - C[2]];
    if (!KINO.eyeR){ KINO.eyeR = eW.slice(); KINO.tgtR = gR.slice(); }
    for (let i = 0; i < 3; i++){ KINO.eyeR[i] += (eW[i] - KINO.eyeR[i]) * k; KINO.tgtR[i] += (gR[i] - KINO.tgtR[i]) * k; }
    const eye = fixed ? KINO.eyeR.slice() : [KINO.eyeR[0] + C[0], KINO.eyeR[1] + C[1], KINO.eyeR[2] + C[2]], tgt = [KINO.tgtR[0] + C[0], KINO.tgtR[1] + C[1], KINO.tgtR[2] + C[2]];
    const gy = Math.max(terrH(eye[0], eye[2]), seaH(eye[0], eye[2], t)) + 0.6; if (eye[1] < gy) eye[1] = gy;
    if (camFree([C[0], C[1] + 1.2, C[2]], eye) < 0.6){ KINO.hid = (KINO.hid || 0) + rdt; if (KINO.hid > 1) kinoNext(t); } else KINO.hid = 0;
    KINO.eye = eye; KINO.tgt = tgt;
    return {eye:eye.slice(), tgt, fov};
  }
  // the main thread's time a frame takes (ms, smoothed; the GL commands are queued, so this is the JS side): with the frame rate it tells a
  // phone or a PC held back by the script from one held back by the graphics card (the devices' telemetry, 10f-cloud.js cloudDev)
  let JSMS = 0;
  // held while the pub's own 3D is shown (ui/09b-pub.js): no frames drawn, the loop keeps ticking
  let HOLD = false;
  // the way out of Father's naust at a new game's start (docs/onboarding.md B5, Jonas 09.10.2026): the eye starts on the naust's
  // quay in front of the door, with the boat right there, and glides back and up to its usual place behind her over a few seconds
  let INTRO = null;
  function introStart(sec){
    const n = typeof naustSite === 'function' ? naustSite() : null; if (!n || !n.o) return false;
    const N = [-n.u[1], n.u[0]], x = n.o[0] + N[0] * 2, z = n.o[1] + N[1] * 2;   // N: out to sea (07c-naust.js shoreSpot)
    INTRO = {t0:performance.now(), dur:sec || 5, e0:[x, Math.max(terrH(x, z), 0) + 2.4, z]}; cam.helm = false; return true;
  }
  function frame(){ const j0 = performance.now(); frame0(); JSMS = JSMS ? JSMS * 0.92 + (performance.now() - j0) * 0.08 : performance.now() - j0; }
  let FRAMEN = 0;
  function frame0(){ FRAMEN++;
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden || NO3D || HOLD) return;
    resize();
    const now = performance.now(), dt = Math.min(0.1, (now - lastF) / 1000), rdt = Math.max(1e-3, (now - lastF) / 1000); lastF = now;
    FPS.v = FPS.v ? FPS.v * 0.95 + 0.05 / rdt : 1 / rdt; FRAMEMS = FRAMEMS * 0.8 + Math.min(500, rdt * 1000) * 0.2; qualTick(dt, FPS.v, now); if (now - FPS.at > 500){ FPS.at = now; const fe = fpsEl(); if (fe) fe.textContent = Math.round(FPS.v) + ' bilder/s · ' + (1000 / FPS.v).toFixed(1) + ' ms · ' + ['Lav', 'Middels', 'Høy', 'Ultra'][QUAL.lvl]; }
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac, rdt); updateWaves(dt, H); nfStep(); updateWake(); updateNear(); ssStep(rdt); updateShadows(); updateChunks(CH.size ? 2 : 999);
    // camera
    let eye, V, kfov = 0;
    if (KINO.on && !SHOW && !PAINTV){
      const K = kinoCam(t, rdt); eye = K.eye; kfov = K.fov; V = viewDir([K.tgt[0] - eye[0], K.tgt[1] - eye[1], K.tgt[2] - eye[2]]); camFwd = [K.tgt[0] - eye[0], K.tgt[2] - eye[2]];
    } else if (cam.helm && !SHOW && !PAINTV){
      // at the wheel: the eye stands where the helmsman's head is on the hull, and moves with it, so the boat round him stands still
      // in the picture; only the head steadies itself: the view follows the boat's pitch and roll through a filter of 0.3 s, so an
      // uneven frame (the tablet's) does not jerk the horizon (the user: «båten rister voldsomt i bro-visningen», 03.10.2026). The eye
      // was placed by the steadied pitch and heave too, so the rail and the console bobbed against it (the user's video 04.10.2026:
      // «hvor mye båten vibrerer under seiling»); a heave does not move the horizon, which is far off
      const kh = 1 - Math.exp(-Math.min(0.25, rdt) / 0.3); if (cam.sp === undefined || !isFinite(cam.sp)){ cam.sp = bv.pitch; cam.sr = bv.roll; }
      cam.sp += (bv.pitch - cam.sp) * kh; cam.sr += (bv.roll - cam.sr) * kh;
      const Mh = model(bv.x, bv.y, bv.z, -bv.head, cam.sp * 0.7, cam.sr * 0.7);
      // the eye in full precision: model() is a Float32Array, and a translation of a million metres in it is only good to 6 to 12 cm, so the
      // eye jumped in steps while the hull, drawn relative to it, did not: a sawtooth some ten times a second that grew with the speed
      // (the user's video 09.10.2026: «hopper sikkert frem og tilbake flere titalls ganger i sekundet»). Rotate the offset, then add.
      { const o = xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), (GEO(vtype())).eye); eye = [bv.x + o[0], bv.y + o[1], bv.z + o[2]]; }
      const cy = Math.cos(cam.hp), dl = [-Math.sin(cam.hy) * cy, Math.sin(cam.hp), -Math.cos(cam.hy) * cy];
      const f = [Mh[0] * dl[0] + Mh[4] * dl[1] + Mh[8] * dl[2], Mh[1] * dl[0] + Mh[5] * dl[1] + Mh[9] * dl[2], Mh[2] * dl[0] + Mh[6] * dl[1] + Mh[10] * dl[2]];
      V = viewDir(f, [Mh[4], Mh[5], Mh[6]]); camFwd = [f[0], f[2]];
    } else {
      if ((SHOW || PAINTV) && !drag) cam.yaw += dt * 0.12;   // the showroom and the paint shop turn slowly round the boat
      // (cam.at: a point on the deck in the boat's frame to look at instead of her middle, for the tests' close shots of the crew)
      const AT = cam.at && !SHOW ? xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), cam.at) : null;
      const C = SHOW ? [SHOW.x, (env.tide || 0) + 1.3 + Math.min(4, VESSELS[SHOW.t].len * 0.06), SHOW.z] : AT ? [bv.x + AT[0], bv.y + AT[1] + 1.0, bv.z + AT[2]] : [bv.x, bv.y + 1.3, bv.z], yawW = (SHOW ? SHOW.h : bv.head) + cam.yaw, tgt = C;
      if (PAINTV && !SHOW) paintAim(C, yawW);
      const eyeAt = p => { const cp = Math.cos(p), sp = Math.sin(p), e = [C[0] - Math.sin(yawW) * cam.dist * cp, C[1] + cam.dist * sp, C[2] + Math.cos(yawW) * cam.dist * cp];
        const ground = Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)) + 2; if (e[1] < ground) e[1] = ground; return e; };
      // tilt up over a quay or under a bridge rather than diving in close (up quickly, back down slowly) ... as far as straight down
      // over the boat: at low water a boat alongside lies 3 m under the quay's edge, which a lift of 57 degrees did not clear
      let lift = 0, f = camFree(tgt, eyeAt(cam.pitch));
      while (f < 0.98 && f * cam.dist < 12 && cam.pitch + lift < 1.45){ lift += 0.1; f = camFree(tgt, eyeAt(Math.min(1.45, cam.pitch + lift))); }
      camLift += clamp(lift - camLift, -dt * 0.6, dt * 3);
      eye = eyeAt(Math.min(1.45, cam.pitch + camLift));
      // ... and what is still in the way pulls the camera in along the line to the boat, at once; it goes back out gently
      const L = Math.hypot(eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]) || 1, want = clamp(camFree(tgt, eye) - 0.8 / L, Math.min(1, 2 / L), 1);
      camPull = want < camPull ? want : Math.min(want, camPull + dt * 1.5);
      if (camPull < 0.999) eye = [tgt[0] + (eye[0] - tgt[0]) * camPull, tgt[1] + (eye[1] - tgt[1]) * camPull, tgt[2] + (eye[2] - tgt[2]) * camPull];
      if (INTRO){ const k = Math.min(1, (performance.now() - INTRO.t0) / (INTRO.dur * 1000)), s = k * k * (3 - 2 * k); eye = [INTRO.e0[0] + (eye[0] - INTRO.e0[0]) * s, INTRO.e0[1] + (eye[1] - INTRO.e0[1]) * s, INTRO.e0[2] + (eye[2] - INTRO.e0[2]) * s]; if (k >= 1) INTRO = null; }
      V = viewDir([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]); camFwd = [tgt[0] - eye[0], tgt[2] - eye[2]];
    }
    lastEye = eye; EYE = eye; earT = performance.now(); compassDraw(Math.atan2(camFwd[0], -camFwd[1]), {x:eye[0] / 1000, y:eye[2] / 1000});
    if (!RO.on || Math.abs(eye[0] - RO.x) > 40000 || Math.abs(eye[2] - RO.z) > 40000){ RO.x = Math.round(eye[0] / 4096) * 4096; RO.z = Math.round(eye[2] / 4096) * 4096; RO.on = true; }
    const W = canvas.width, Hh = canvas.height, asp = W / Hh, fov = kfov ? kfov * DEG : cam.helm ? 2 * Math.atan(Math.tan(cam.fov * DEG / 2) / (cam.zoom || 1)) : 55 * DEG; curFov = fov;
    { const z = !kfov && cam.helm ? cam.zoom || 1 : 1, on = z > 1.5; if (binoc.hidden === on) binoc.hidden = !on; if (on){ const t = Math.round(z) + '×'; if (binoc.firstChild.textContent !== t) binoc.firstChild.textContent = t; } }
    let cornerD = 0; if (NEARM) for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cornerD = Math.max(cornerD, Math.hypot(NEARM.x0 + qx * NEARM.sx - eye[0], NEARM.z0 + qz * NEARM.sz - eye[2], eye[1]));
    const nearFar = Math.max(3000, cam.dist * 3, cornerD + 300); lightNF = nearFar; const VPf = mul(persp(fov, asp, 25, QUAL.lvl === 3 ? 260000 : 170000), V.m);
    // the near plane moves out with the camera when it is high above the boat (Jonas' video from Båtsfjord 09.10.2026): at 0.25 m the depth
    // could not tell the sea from the shore a few kilometres off (the sea came through the low land in teal stripes); nothing is drawn
    // that near a high camera, and at the boat's own distances (to some 50 m) it stays as it was
    const nearN = cam.helm || kfov ? 0.25 : clamp(Math.min(cam.dist, eye[1]) * 0.005, 0.25, 15), VPn = mul(persp(fov, asp, nearN, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = Array.from(model(0, 0, 0, -bv.head, bv.pitch, bv.roll)); BMabs[12] = bv.x; BMabs[13] = bv.y; BMabs[14] = bv.z;   // world position in full precision (see the eye above)
    // apparent wind for the flag
    const wdir = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG, wv = env.wind || windAt(H, {x:bv.x / 1000, y:bv.z / 1000}), bms = bv.v * 0.514 * 2;
    const ax = Math.sin(wdir) * wv - Math.sin(bv.head) * bms, az = -Math.cos(wdir) * wv + Math.cos(bv.head) * bms, appW = Math.hypot(ax, az), appB = Math.atan2(ax, -az);
    updateFlag(t, appW);

    gl.viewport(0, 0, W, Hh); gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.useProgram(PK.p);
    const u = PK.u, tn = Math.tan(fov / 2);
    gl.uniform3fv(u.uF, V.F); gl.uniform3fv(u.uR, V.R); gl.uniform3fv(u.uU, V.U); gl.uniform2fv(u.uTan, [tn * asp, tn]);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uSunD, env.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uMoonD, env.moonDir || [0, -1, 0]); gl.uniform1f(u.uMoonA, env.moonA || 0);
    skyFrame(u, Hh, tn, bv); cloudStep(Math.min(30, rdt)); gl.uniform2fv(u.uCloudOff, CLD.off); gl.uniform1f(u.uCloud, env.cloud); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uStars, env.stars); gl.uniform1f(u.uAur, env.aur); gl.uniform1f(u.uDay, env.day); gl.uniform2fv(u.uWindDir, env.windDir);
    gl.disableVertexAttribArray(1); attr(0, SKYQ, 2); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // far pass
    pickLights(eye, t);
    drawTerrain(TM, eye, VPf, false); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); drawUnits(eye, VPf, false, 15000); drawSites(eye, VPf, false, 15000); if (NPCM) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d < 30000 && !((n.fleet || n.coast) && d < 1500)) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
    drawSea(VPf, eye, t, 1);
    drawSeaLights(VPf, eye, t, false);
    if (env.night > 0.02){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      if (BLD) drawChunkLights(VPf, eye);
      else if (LIGHTS.length){ const n = Math.min(LIGHTS.length / 3, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = LIGHTS[i * 3] - eye[0]; PB[i * 3 + 1] = LIGHTS[i * 3 + 1] - eye[1]; PB[i * 3 + 2] = LIGHTS[i * 3 + 2] - eye[2]; PA[i] = env.night * 0.9; } drawPts(n, gl.POINTS, VPf, [1, 0.78, 0.42], 5000, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // near pass
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const VT = vtype(), VG = GEO(VT), ncrew = Math.min(crewAboard().length, (VG.crewSpots || []).length); if (VG.hand) useHand(VT);
    drawTerrain(TM, eye, VPn, true); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM);
    // whoever works the deck leaves their place: alone, the skipper leaves the wheel
    // resting ashore in the naust or a rorbu (15-energy.js; Jonas 05.10.2026: «Ved hvile forsvinner skipperen fra båten») he is not aboard
    // never more people aboard than the crew list (tilbakemelding #24): the crew at the hauler and the one at the table leave their
    // places, and with you ashore one of the crew is at the wheel
    DECKACT = deckActivity(); const awaySk = (DECKACT.on && DECKACT.me) || gopMe() || (meAboard() && resting()), awayCr = DECKACT.on && DECKACT.crew ? 1 : 0;
    const gHaul = S.boat.gop && !VG.hand ? Math.min(3, gopHands()) - (gopMe() ? 1 : 0) : 0, helmCr = !meAboard() && !awaySk ? 1 : 0;
    // under way the crew are inside (the user: no reason for them to stand on deck all day, 03.10.2026); whoever guts is at the table
    // (drawDeck), and in an open boat they sit where they are. The one at the table leaves their place (a skiff drew them twice).
    // and while the skipper rests ashore the crew are up there too (Jonas 06.10.2026: both sleep in the rorbu)
    // and at the quay in a boat with bunks the crew who still need rest are asleep in them, not on deck (tilbakemelding #65; they rest
    // there as fast as in a rorbu, core/04-crew.js): only the rested ones come up
    const underway = S.boat.status === 'sailing' && !S.boat.gop, ashore = meAboard() && restAshore();   // (in the bunk aboard, #70, the crew stay on deck)
    const inBunks = S.boat.status === 'port' && !VG.open && bunks(S.boat) ? crewAboard().slice(0, ncrew).filter(c => c.fatigue >= 1).length : 0;
    const deckCrew = (underway && !VG.open) || ashore ? 0 : Math.max(0, ncrew - awayCr - Math.max(0, gHaul) - helmCr - inBunks);
    // the people aboard walk the deck (deckcrew.js): the boat is drawn without her fixed figures, and the agents are drawn after her
    const DKON = !VG.hand && typeof CREW3D !== 'undefined' && CREW3D.on();
    if (DKON){ CREW3D.setJig(jigRail(VT, VG)); CREW3D.setRoll(bv.roll); CREW3D.setHelm(!!cam.helm); CREW3D.tick(dt); }
    if (VG.hand){ drawSkiff(BMrel, VPn, dt, !cam.helm && !awaySk, deckCrew > 0); gl.useProgram(PL.p); }
    // jigging from a boat with a wheelhouse, the skipper leaves the wheel for the rail (the hand-worked boats do the same in drawSkiff),
    // also with crew aboard: he tends the jig while they gut (tilbakemelding #62: on a sjark with two hands he stood in the wheelhouse
    // while one hand looked on); he stays at the wheel only when the crew fill every deck place
    else { const jig = S.boat.status === 'fishing' && !S.boat.gop && !S.boat.deckStop;
      drawVessel(VT, VG, BMrel, VPn, !DKON && !cam.helm && !awaySk, DKON ? 0 : deckCrew, !DKON && jig, hullLiv(S.boat), true); drawJigRail(BMrel, VPn, VT, VG, dt); gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
      if (DKON) drawDeckCrew(BMrel, eye, VPn, t, VG); }
    SAY.a = null;
    if (SAY.c && performance.now() - SAY.t0 < SAYMS){
      // over the head of the one who speaks, at his place on deck (the crew stand at the places in the order of the list); when he is not
      // to be seen (inside under way, at the hauler or the table, or ashore) the line floats over the boat, over her house, so it can be read
      const ag = DKON ? CREW3D.anchorOf(SAY.c.id) : null, ci = crewAboard().findIndex(p => p.id === SAY.c.id), sp = ag ? [ag.x, ag.y, ag.z] : VG.crewSpots && ci >= 0 && ci < deckCrew ? VG.crewSpots[ci] : null, tp = VG.top || [0, 3.4, 0];
      SAY.a = xf(BMrel, sp ? [sp[0], sp[1] + 2.1, sp[2]] : [tp[0], tp[1] + 1.6, tp[2]]);
    }
    if (SHOW){ const y = (env.tide || 0) + (seaH(SHOW.x, SHOW.z, t) - (env.tide || 0)) * 0.8; SHOW.M = model(SHOW.x - eye[0], y - eye[1], SHOW.z - eye[2], -SHOW.h, Math.sin(t * 0.7) * 0.02, Math.sin(t * 0.9) * 0.03); drawVessel(SHOW.t, GEO(SHOW.t), SHOW.M, VPn, true, 2); }
    if (STATN){ nSetup(VPn); drawN(STATN, TM); if (BUNKN) drawN(BUNKN, TM); } if (LIFT.off < 0.05) drawMooring(BMrel, eye, VPn, t); drawRescue(BMrel, eye, VPn, t); drawTowLine(BMrel, VPn); drawAnchor(BMrel, eye, VPn, t); if (PM) drawDeck(BMrel, eye, VPn, t, DECKACT); drawGearOp(BMrel, eye, VPn, t);
    const plant = PM ? nearestPlant(eye) : null; drawUnits(eye, VPn, true, nearFar, plant && plant.id); drawSites(eye, VPn, true, nearFar);
    const pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null;
    // a hand at the plant says his line: over his head, else over the first hand who is out
    if (SAY.w && plant && plant.id === SAY.w.pid && plant.wpos && performance.now() - SAY.t0 < SAYMS){ const q = plant.wpos[SAY.w.idx] || plant.wpos[Object.keys(plant.wpos)[0]]; if (q) SAY.a = [q.x - eye[0], q.y + 2.1 - eye[1], q.z - eye[2]]; }
    if (SAY.b && performance.now() - SAY.t0 < SAYMS){ const n = (npcNow || []).find(q => q.id === SAY.b); if (n) SAY.a = [n.p.x * 1000 - eye[0], (env.tide || 0) + 7 - eye[1], n.p.y * 1000 - eye[2]]; }
    const bunk = PM ? nearestBunker(eye) : null; if (bunk) bunk.last = drawBunker(bunk, eye, VPn, t, BMrel); gl.useProgram(PL.p);
    wildSpawn(t); drawNPC(eye, t, H, VPn); drawAir(eye, t, H, VPn); drawGearSea(eye, t, VPn, H); drawDocks(eye, t, VPn); drawFloats(eye, t, VPn); drawWild(eye, t, dt);

    // the ensign in its hours (core/03-simulation.js flagUp; always while the paint shop tries one on); the pennant flies day and night
    gl.disableVertexAttribArray(2);
    if (PAINTPRE || flagUp(S.t / 60, S.boat.pos)){ const pole = xf(BMrel, VG.pole), fl = flagTex(), FM = model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0);
      drawTexQuad(FLAGM, FLAGM.tex, fl.shape === 'vimpel' ? chain(FM, new Float32Array([1.7, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])) : FM, VPn, true, [0, 0.6, 0]); }
    { const pen = S.ach && S.ach.pen ? Math.min(3, S.ach.pen | 0) : 0, mt = pen && mastTop(VG); if (mt){ const P = xf(BMrel, mt); drawTexQuad(FLAGM, penTex(), chain(model(P[0], P[1], P[2], Math.PI / 2 - appB, 0, 0), PEN_S[pen - 1]), VPn, true, [0, 0.6, 0]); } }
    gl.useProgram(PL.p);
    if (SHOW && SHOW.M && GEO(SHOW.t).open && pvm(SHOW.t).cap){ gl.colorMask(false, false, false, false); drawLit(pvm(SHOW.t).cap, SHOW.M); gl.colorMask(true, true, true, true); }
    { const cap = VG.hand ? (SK ? SK.cap : CAPM) : VG.open ? pvm(VT, hullLiv(S.boat)).cap : null; if (cap){ gl.colorMask(false, false, false, false); drawLit(cap, BMrel); gl.colorMask(true, true, true, true); } }
    drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false);
    drawBeams(VPn, eye, t);
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawAirLights(VPn, t); drawRescueLights(VPn, t); drawSeaLights(VPn, eye, t, true);
    if (VG.hand) drawSkiffGlass(BMrel, VPn); else drawGlass(pvm(VT, hullLiv(S.boat)).glass, BMrel, VPn);
    if (SHOW && SHOW.M) drawGlass(pvm(SHOW.t).glass, SHOW.M, VPn);
    drawNPCGlass(VPn);
    if (pr && pr.spray){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(pr.spray, gl.POINTS, VPn, [0.86, 0.93, 1], 30, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (pr && env.night > 0.05){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); pr.lamps.forEach((q, i) => { PB[i * 3] = q[0]; PB[i * 3 + 1] = q[1]; PB[i * 3 + 2] = q[2]; PA[i] = env.night; }); drawPts(pr.lamps.length, gl.POINTS, VPn, [1, 0.9, 0.72], 1400, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (env.night > 0.05){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      // at anchor only the all-round white light shows (no side lights or stern light, which are for a boat under way); the anchor
      // alarm turns it red and makes it flash (06e-anchor.js)
      const b0 = S.boat, anchored = !!b0.anch && b0.status !== 'port', alarm = performance.now() < ANCHAL.until, V0 = VESSELS[vtype()] || {len:8};
      // the lanterns after Sjøveisreglene (vessel3d.js lanterns, 17.10.2026): what she shows follows what she does
      let L3 = lanterns(VG, V0, {port:b0.status === 'port', anch:anchored, v:b0.v || 0, fishing:b0.status === 'fishing' || !!b0.gop, trawl:V0.cls === 'hav' && !(V0.rigs || []).length, aground:b0.status === 'aground', nuc:b0.status === 'engine' || b0.status === 'adrift'}), drawn = L3.length;
      if (anchored && alarm && L3.length) L3 = L3.map(([p, c], i) => i ? [p, c] : [p, (performance.now() / 250) % 2 < 1 ? [1, 0.1, 0.06] : [0.25, 0.02, 0.02]]);   // the anchor alarm turns the light red and flashing (06e-anchor.js)
      ANCHAL.drawn = drawn;
      for (const [lp, lc] of L3){ const q = xf(BMrel, lp); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VPn, lc, anchored ? 420 : 260, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    updateLabels(VPf, eye, W, Hh);
    if (SNAP) snapTake();
  }
  // a picture of the frame just drawn, for the feedback app (ui/06e-feedback.js): read in the same task as the drawing, while the
  // drawing buffer still holds it (the context keeps no copy, preserveDrawingBuffer is off), at most w px on the long side
  let SNAP = null;
  function snapTake(){
    const s = SNAP; SNAP = null;
    try { const k = Math.min(1, s.w / Math.max(canvas.width, canvas.height)), c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); s.res(c.toDataURL('image/jpeg', 0.85)); } catch (e){ console.error(e); s.res(null); }
  }
  function drawRoute(VP, eye){
    if (!S.plan) return;
    const pts = [[bv.x - eye[0], bv.z - eye[2]]].concat(S.plan.wps.slice(S.plan.idx).map(w => [w.x * 1000 - eye[0], w.y * 1000 - eye[2]]));
    let n = 0;
    for (let i = 0; i < pts.length - 1 && n < 3900; i++){ PB.set([pts[i][0], 2 - eye[1], pts[i][1], pts[i + 1][0], 2 - eye[1], pts[i + 1][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    for (let i = 1; i < pts.length && n < 3900; i++){ PB.set([pts[i][0], -eye[1], pts[i][1], pts[i][0], 30 - eye[1], pts[i][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawPts(n, gl.LINES, VP, [0.88, 0.25, 0.62], 1, false);
    gl.disable(gl.BLEND);
  }
  // spindrift: from a gale (Beaufort 8) the wind tears spray off the crests and drives it low along the sea, more and more into a storm
  const SDN = 400, SD = {x:new Float64Array(SDN), y:new Float32Array(SDN), z:new Float64Array(SDN), vx:new Float32Array(SDN), vy:new Float32Array(SDN), vz:new Float32Array(SDN), age:new Float32Array(SDN).fill(99), life:new Float32Array(SDN).fill(1), n:0, acc:0};
  function driftSpray(VP, eye, dt, t, col){
    const U = env.wind || 0, wd = env.windDir; SD.acc = Math.min(SD.acc + dt * 260 * sstep(17.2, 28.5, U), 60);
    while (SD.acc >= 1){ SD.acc -= 1; const a = Math.random() * 6.2832, r = 8 + Math.random() * 110, x = eye[0] + Math.sin(a) * r, z = eye[2] + Math.cos(a) * r, i = SD.n = (SD.n + 1) % SDN, sp = U * (0.45 + Math.random() * 0.35);
      SD.x[i] = x; SD.z[i] = z; SD.y[i] = seaHFast(x, z, t) + 0.2; SD.vx[i] = wd[0] * sp; SD.vz[i] = wd[1] * sp; SD.vy[i] = 0.6 + Math.random() * 1.6; SD.age[i] = 0; SD.life[i] = 0.8 + Math.random() * 1.2; }
    let n = 0;
    for (let i = 0; i < SDN; i++){ if (SD.age[i] >= SD.life[i]) continue; SD.age[i] += dt; SD.vy[i] -= 2.5 * dt; SD.x[i] += SD.vx[i] * dt; SD.y[i] += SD.vy[i] * dt; SD.z[i] += SD.vz[i] * dt;
      PB[n * 3] = SD.x[i] - eye[0]; PB[n * 3 + 1] = SD.y[i] - eye[1]; PB[n * 3 + 2] = SD.z[i] - eye[2]; PA[n] = Math.sin(Math.PI * Math.min(1, SD.age[i] / SD.life[i])) * 0.45; n++; }
    if (n) drawPts(n, gl.POINTS, VP, col, 90, true);
  }
  // The semi-diesel's black puffs (Jonas 05.10.2026: «svarte små eksos-skyer ut av eksosen hver gang motoren antenner»): one at each
  // firing the sound schedules (SND.FIRES), on the view's own clock when there is no sound; from the exhaust's mouth (the model's
  // anchor exhaust), leaving with some of the boat's way, rising, growing and thinning, carried off with the wind; darker and bigger
  // when the throttle opens. Drawn as soft round points in four sizes by age.
  const SMN = 90, SMK = {x:new Float32Array(SMN), y:new Float32Array(SMN), z:new Float32Array(SMN), vx:new Float32Array(SMN), vy:new Float32Array(SMN), vz:new Float32Array(SMN), age:new Float32Array(SMN).fill(9), life:new Float32Array(SMN), k:new Float32Array(SMN), n:0};
  let smkPh = 0;
  function drawSmoke(VP, eye, BM, dt){
    const VG = GEO(vtype()), b = S.boat, run = ['sailing', 'unmooring', 'fishing', 'idle'].includes(b.status) || !!b.gop;
    if (BOAT.semi && VG.exhaust && run){
      const frac = clamp((b.v || 0) / Math.max(1, BOAT.vmax), 0, 1), now = performance.now(), F = typeof SND !== 'undefined' && SND.FIRES;
      const fwd = (() => { const a = xf(BM, [0, 0, 0]), c = xf(BM, [0, 0, -1]); return [c[0] - a[0], c[2] - a[2]]; })(), sp = (b.v || 0) * 0.514;
      const puff = k => { const p = xf(BM, VG.exhaust), i = SMK.n = (SMK.n + 1) % SMN;
        SMK.x[i] = p[0]; SMK.y[i] = p[1]; SMK.z[i] = p[2]; SMK.vx[i] = fwd[0] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vz[i] = fwd[1] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vy[i] = 0.7 + 0.6 * k + Math.random() * 0.2;
        SMK.age[i] = 0; SMK.life[i] = 2.2 + Math.random() + k * 0.6; SMK.k[i] = k; };
      if (F && F.length){ while (F.length && F[0].at <= now){ const f = F.shift(); if (now - f.at < 400) puff(f.frac); } }
      else { const R = BOAT.rpm || [340, 850]; smkPh += dt / (120 / (R[0] + frac * (R[1] - R[0]))); while (smkPh >= 1){ smkPh -= 1; puff(frac); } }
    }
    // charcoal grey taking the light round it, soft and thinning (Adrian 05.10.2026 on an iPhone: «Kommer noen sånne svarte prikka å hop over
    // skjermen av og til»: they were hard black discs, and tiny black dots from far off), and not drawn beyond 250 m
    const wv = (env.wind || 0) * 0.8, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, dr = Math.min(1, dt * 1.4), col = [0.16 + env.amb[0] * 0.3, 0.16 + env.amb[1] * 0.3, 0.17 + env.amb[2] * 0.3];
    const B = [[], [], [], []];
    for (let i = 0; i < SMN; i++){
      if (SMK.age[i] >= SMK.life[i]) continue;
      SMK.age[i] += dt; SMK.vx[i] += (wx - SMK.vx[i]) * dr; SMK.vz[i] += (wz - SMK.vz[i]) * dr; SMK.vy[i] *= 1 - Math.min(1, dt * 0.6);
      SMK.x[i] += SMK.vx[i] * dt; SMK.y[i] += SMK.vy[i] * dt; SMK.z[i] += SMK.vz[i] * dt;
      const a = SMK.age[i] / SMK.life[i]; if (Math.hypot(SMK.x[i] - eye[0], SMK.z[i] - eye[2]) < 250) B[Math.min(3, Math.floor(a * 4))].push(i);
    }
    B.forEach((L, q) => {
      let n = 0;
      for (const i of L){ const a = SMK.age[i] / SMK.life[i]; PB[n * 3] = SMK.x[i] - eye[0]; PB[n * 3 + 1] = SMK.y[i] - eye[1]; PB[n * 3 + 2] = SMK.z[i] - eye[2]; PA[n] = Math.pow(1 - a, 1.6) * (0.3 + 0.22 * SMK.k[i]); n++; }
      drawPts(n, gl.POINTS, VP, col, [320, 700, 1150, 1700][q], 2, null, 512);
    });
  }
  function drawEffects(VP, eye, BM, dt, t){
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const foamCol = [Math.min(1, env.amb[0] * 1.4 + env.sunCol[0] * 0.8), Math.min(1, env.amb[1] * 1.4 + env.sunCol[1] * 0.8), Math.min(1, env.amb[2] * 1.4 + env.sunCol[2] * 0.8)];
    // wake and spray
    const v = bv.v;
    if (v > 1){
      const VG = GEO(vtype());
      // a trail point for every 1.2 m travelled, stamped with the real clock (independent of frame rate)
      const p = xf(BM, [0, 0, VG.stern]), now = performance.now() / 1000, last = TRAIL[0], moved = last ? Math.hypot(p[0] - last.x, p[2] - last.z) : 99;
      if (moved > 1.2 || (last && now - last.t0 > 0.3)){ wk.odo = (wk.odo || 0) + Math.min(moved, 60); TRAIL.unshift({x:p[0], z:p[2], t0:now, age:0, r:0.45 + Math.random() * 0.55, v, u:wk.odo, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}); if (TRAIL.length > 700) TRAIL.pop(); }
      // spray: when the bow drives down into a sea (how fast it sinks into the water against the surface), thrown out to both sides and up,
      // and carried off with the wind; at planing speed a little all the time in a chop. It leaves the hull where the bow wave does, along
      // the waterline a little aft of the stem, as a fine mist, and keeps most of the boat's way: it fans out beside the bow and falls
      // astern of it (Jonas 21.10.2026, #90: the spray did not look real. Thrown from a point at the stem with no way on, it hung in the
      // air as a trail of round blobs behind the boat)
      const bowP = xf(BM, [0, 0.15, VG.bow]), imm = bowP[1] - seaH(bowP[0], bowP[2], t), sink = wk.imm == null ? 0 : (imm - wk.imm) / Math.max(dt, 1e-3); wk.imm = imm;
      const wv = (env.wind || 0) * 0.35, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, Lb = VG.stern - VG.bow, fx = Math.sin(bv.head), fz = -Math.cos(bv.head), way = (bv.spd || 0) * 0.9;
      if (v > 3 && sink < -0.5 && imm < 0.6) wk.sacc += Math.min(100, -sink * v * 1.25);
      if (WK.Fr > 0.9) wk.sacc += dt * v * WV.hs * 2;
      while (wk.sacc >= 1){ wk.sacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, a = 0.08 + Math.random() * 0.22, p = xf(BM, [side * VG.side * (0.45 + a * 1.6), 0.1, VG.bow + a * Lb]), up = 0.9 + Math.random() * (1.4 + Math.min(4, -sink)), out = 1.6 + Math.random() * 2.6;
        spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * out + fx * way + wx, up, Math.sin(bv.head) * side * out + fz * way + wz, 0.6 + Math.random() * 0.7, 9.8); }
      // the rooster tail: a planing outboard throws a plume of water up behind the leg
      if (BOAT.outboard && WK.Fr > 1){ wk.racc = (wk.racc || 0) + dt * 70 * sstep(1, 1.6, WK.Fr);
        while (wk.racc >= 1){ wk.racc -= 1; const p = xf(BM, [(Math.random() - 0.5) * 0.3, 0.1, VG.stern + 0.4]), bk = 2 + Math.random() * 3;
          spawn(p[0], p[1], p[2], -Math.sin(bv.head) * bk + wx, 2.2 + Math.random() * 2.2, Math.cos(bv.head) * bk + wz, 0.6 + Math.random() * 0.4, 9.8); } }
    }
    // wake: the prop wash's bubbles behind the stern (gone in 6 s; the pale band under them went, Jonas 04.10.2026: «kun vise
    // boblepartiklene») and the two Kelvin arms spreading at 19.5 degrees, fading out within 10 s («gradvis forsvinner»), each corner
    // laid on the waves where it lies (one height across an arm hid it under the waves on one side more than the other)
    { const now = performance.now() / 1000; for (const q of TRAIL) q.age = now - (q.t0 || now); }
    while (TRAIL.length && TRAIL[TRAIL.length - 1].age > 11) TRAIL.pop();
    if (TRAIL.length > 1 && WKB){
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step, tide = env.tide || 0;
      const seaY = (x, z) => seaHFast(x, z, t) + wakeHFast(x, z) + 0.07;
      const st = xf(BM, [0, 0, (GEO(vtype())).stern]), pts = (v > 1 ? [{x:st[0], z:st[2], age:0, v, u:wk.odo || 0, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}] : []).concat(TRAIL);
      let m = 0; const P = WKB.p, W = WKB.w, Sg = WKB.s, cap = 8900;
      const put = (x, z, y, u, vv, age, kind, str) => { if (m >= cap) return; P[m * 3] = x - eye[0]; P[m * 3 + 1] = y - eye[1]; P[m * 3 + 2] = z - eye[2]; W[m * 4] = u; W[m * 4 + 1] = vv; W[m * 4 + 2] = age; W[m * 4 + 3] = kind; Sg[m] = str; m++; };
      const strip = (A, B) => { // A, B: arrays of 3 across-points [x, z, v] at two stations, with u/age/kind/str
        for (let c = 0; c < 2; c++){ const a0 = A.q[c], a1 = A.q[c + 1], b0 = B.q[c], b1 = B.q[c + 1];
          for (const [q, S2] of [[a0, A], [a1, A], [b1, B], [a0, A], [b1, B], [b0, B]]) put(q[0], q[1], q[3], S2.u, q[2], S2.age, S2.kind, S2.str); } };
      const sections = (kind) => {
        const out = []; let di = 0;
        for (let i = 0; i < pts.length; i++){
          if (pts[i].age > (kind ? 10.3 : 6.3)) break;
          if (i) di += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
          const a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)], c0 = pts[Math.max(0, i - 1)];
          let dx = c0.x - b.x, dz = c0.z - b.z; const l = Math.hypot(dx, dz); if (l < 1e-3){ dx = a.hx; dz = a.hz; } else { dx /= l; dz /= l; }
          const px = -dz, pz = dx, spd = (a.v || v) * 0.5144, str = clamp(spd / 3.6, 0.25, 1);
          if (kind === 0){ const w = 0.55 + Math.min(5, di * 0.028 + a.age * 0.12); out.push({u:a.u, age:a.age, kind:0, str:str * 1.05, q:[[a.x + px * w, a.z + pz * w, -1], [a.x, a.z, 0], [a.x - px * w, a.z - pz * w, 1]]}); }
          else { const L = 1.05 + 0.354 * di, w = 0.4 + di * 0.06, sd = kind === 1 ? 1 : -1, cx = a.x + px * L * sd, cz = a.z + pz * L * sd;
            out.push({u:a.u, age:a.age, kind:1, str:str * clamp(spd / 3, 0.2, 1), q:[[cx + px * w * sd, cz + pz * w * sd, -1], [cx, cz, 0], [cx - px * w * sd, cz - pz * w * sd, 1]]}); }
        }
        return out;
      };
      // the sea height once per point across the wake (each is a corner of up to six triangles)
      for (const kind of [1, 2, 0]){ const sec = sections(kind); for (const S2 of sec) for (const q of S2.q) q.push(seaY(q[0], q[1])); for (let i = 0; i < sec.length - 1; i++) strip(sec[i], sec[i + 1]); }
      if (m){
        gl.useProgram(PRGW.p); const u = PRGW.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform3fv(u.uEye, [eye[0] - RO.x, eye[1], eye[2] - RO.z]); gl.uniform3fv(u.uCol, foamCol); gl.uniform3fv(u.uAer, [0.09, 0.3, 0.31].map((c, k) => c * (env.amb[k] * 1.4 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uArm, [0.1, 0.27, 0.31].map((c, k) => c * (env.amb[k] * 1.8 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uTime, t);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P.subarray(0, m * 3)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.wb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, W.subarray(0, m * 4)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.sb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Sg.subarray(0, m)); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.drawArrays(gl.TRIANGLES, 0, m); gl.disable(gl.POLYGON_OFFSET_FILL); gl.disableVertexAttribArray(2);
      }
    }
    let n = 0;
    for (let i = 0; i < WN; i++){
      if (wk.age[i] >= wk.life[i]) continue;
      wk.age[i] += dt; wk.vy[i] -= wk.g[i] * dt; wk.x[i] += wk.vx[i] * dt; wk.y[i] += wk.vy[i] * dt; wk.z[i] += wk.vz[i] * dt;
      PB[n * 3] = wk.x[i] - eye[0]; PB[n * 3 + 1] = wk.y[i] - eye[1]; PB[n * 3 + 2] = wk.z[i] - eye[2]; PA[n] = Math.pow(Math.max(0, 1 - wk.age[i] / wk.life[i]), 1.5) * 0.75; n++;
    }
    if (QUAL.lvl) drawPts(n, gl.POINTS, VP, foamCol, 95, 2);   // (soft, as mist: round discs read as blobs)
    if (QUAL.lvl) driftSpray(VP, eye, dt, t, foamCol);
    drawSmoke(VP, eye, BM, dt);
    // fishing lines
    if (S.boat.status === 'fishing' && SK && (SK.lines || []).length){
      const segs = (SK.lines || []).slice();
      let n = 0;
      for (const [a0, b0] of segs){ if (n > 30) break; const A0 = [a0[0] + eye[0], a0[1] + eye[1], a0[2] + eye[2]], B0 = b0 ? [b0[0] + eye[0], b0[1] + eye[1], b0[2] + eye[2]] : [A0[0], seaH(A0[0], A0[2], t) - 0.2, A0[2]];
        PB.set([A0[0] - eye[0], A0[1] - eye[1], A0[2] - eye[2], B0[0] - eye[0], B0[1] - eye[1], B0[2] - eye[2]], n * 6); PA[n * 2] = PA[n * 2 + 1] = 0.8; n++; }
      if (n) drawPts(n * 2, gl.LINES, VP, [0.12, 0.12, 0.12], 1, false);
    }
    // rain or snow
    const pr = env.precip;
    if (pr > 0.04){
      const snow = env.temp < 1, BX = 26, BY = 16;
      if (!pinit){ for (let i = 0; i < PN; i++){ pp[i * 3] = eye[0] + (Math.random() * 2 - 1) * BX; pp[i * 3 + 1] = eye[1] + (Math.random() * 2 - 1) * BY; pp[i * 3 + 2] = eye[2] + (Math.random() * 2 - 1) * BX; } pinit = true; }
      const wx = env.windDir[0] * env.wind * (snow ? 0.8 : 0.9), wz = env.windDir[1] * env.wind * (snow ? 0.8 : 0.9), vy = snow ? -1.3 : -7.5;
      const cnt = Math.floor(PN * Math.min(1, pr * 1.2)); let m = 0;
      for (let i = 0; i < cnt; i++){
        const jx = snow ? Math.sin(t * 1.3 + i) * 0.6 : 0, jz = snow ? Math.cos(t * 1.1 + i * 1.7) * 0.6 : 0;
        pp[i * 3] += (wx + jx) * dt; pp[i * 3 + 1] += vy * dt; pp[i * 3 + 2] += (wz + jz) * dt;
        for (let a = 0; a < 3; a++){ const e = a === 1 ? BY : BX; let r = pp[i * 3 + a] - eye[a]; if (r > e) pp[i * 3 + a] -= 2 * e; else if (r < -e) pp[i * 3 + a] += 2 * e; }
        const rx = pp[i * 3] - eye[0], ry = pp[i * 3 + 1] - eye[1], rz = pp[i * 3 + 2] - eye[2];
        if (snow){ PB[m * 3] = rx; PB[m * 3 + 1] = ry; PB[m * 3 + 2] = rz; PA[m] = 0.85; m++; }
        else { PB.set([rx, ry, rz, rx - (wx) * 0.05, ry - vy * 0.05, rz - (wz) * 0.05], m * 3); PA[m] = PA[m + 1] = 0.35; m += 2; }
      }
      const pc = [Math.min(1, env.amb[0] * 2 + env.sunCol[0] * 0.6 + 0.25), Math.min(1, env.amb[1] * 2 + env.sunCol[1] * 0.6 + 0.27), Math.min(1, env.amb[2] * 2 + env.sunCol[2] * 0.6 + 0.3)];
      drawPts(m, snow ? gl.POINTS : gl.LINES, VP, pc, 95, true);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function updateLabels(VP, eye, W, Hh){
    const r = wrap.getBoundingClientRect(), sx = r.width / W, sy = r.height / Hh;
    // the crew's line over the head of whoever says it
    if (!SAY.el || !SAY.el.isConnected){ SAY.el = document.createElement('div'); SAY.el.className = 'say3d'; labelsEl.appendChild(SAY.el); }
    { const el = SAY.el, age = performance.now() - SAY.t0, a = SAY.a;
      if (!a || age >= SAYMS){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const cw = VP[3] * a[0] + VP[7] * a[1] + VP[11] * a[2] + VP[15];
        if (cw <= 0) el.style.display = 'none';
        else { const cx = VP[0] * a[0] + VP[4] * a[1] + VP[8] * a[2] + VP[12], cy = VP[1] * a[0] + VP[5] * a[1] + VP[9] * a[2] + VP[13];
          if (el.textContent !== SAY.txt) el.textContent = SAY.txt;
          el.style.display = ''; el.style.opacity = Math.min(1, age / 300, (SAYMS - age) / 800).toFixed(2); el.style.left = ((cx / cw * 0.5 + 0.5) * W * sx) + 'px'; el.style.top = ((1 - (cy / cw * 0.5 + 0.5)) * Hh * sy) + 'px'; } } }
    if (!ANCHAL.el || !ANCHAL.el.isConnected){ ANCHAL.el = document.createElement('div'); ANCHAL.el.className = 'anchal'; labelsEl.appendChild(ANCHAL.el); }
    { const el = ANCHAL.el, on = performance.now() < ANCHAL.until;
      if (!on){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const txt = S.lang === 'no' ? (ANCHAL.kind === 'gale' ? '⚓ ANKERALARM · ankeret slepper i kuling' : '⚓ ANKERALARM · ankeret slepper') : (ANCHAL.kind === 'gale' ? '⚓ ANCHOR ALARM · dragging in a gale' : '⚓ ANCHOR ALARM · the anchor is dragging');
        if (el.textContent !== txt) el.textContent = txt; el.style.display = ''; el.classList.toggle('on', (performance.now() / 350) % 2 < 1); } }
  }

  // ---------- controls ----------
  const ptr = new Map(); let drag = null, pinch = null;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, {x:e.clientX, y:e.clientY}); if (ptr.size === 1) drag = {x:e.clientX, y:e.clientY}; else if (ptr.size === 2){ const [a, b] = [...ptr.values()]; pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, dist:cam.dist, zoom:cam.zoom}; } });
  canvas.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptr.size === 2 && pinch){ const [a, b] = [...ptr.values()], dd = Math.hypot(a.x - b.x, a.y - b.y) || 1; if (cam.helm) cam.zoom = clamp(pinch.zoom * dd / pinch.d, 1, 8); else cam.dist = clamp(pinch.dist * pinch.d / dd, 7, 8000); }
    // on the bridge a drag down looks down, as a drag to the right looks right (tilbakemelding #40)
    else if (drag && ptr.size === 1){ if (cam.helm){ const z = cam.zoom || 1; cam.hy = clamp(cam.hy - (e.clientX - drag.x) * 0.005 / z, -2.6, 2.6); cam.hp = clamp(cam.hp - (e.clientY - drag.y) * 0.004 / z, -0.6, 0.5); } else { cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * 0.004, 0.02, 1.4); } drag = {x:e.clientX, y:e.clientY}; }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (ptr.size === 1){ const [p] = [...ptr.values()]; drag = {x:p.x, y:p.y}; } else if (!ptr.size) drag = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('dblclick', () => { if (cam.helm){ const G = GEO(vtype()); cam.zoom = 1; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } }); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (cam.helm) cam.zoom = clamp(cam.zoom * Math.exp(-e.deltaY * 0.0015), 1, 8); else cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.0012), 7, 8000); }, {passive:false});

  // the paint shop (ui/10j-paint.js): the camera turns slowly round your own boat, and she sits in the middle of what the drawer leaves
  // free (left of it lying down, above it standing up), so the colour being tried is seen as it is chosen
  let PAINTV = null;
  function paintView(on){
    if (on){ if (PAINTV) return; PAINTV = {was:active, yaw:cam.yaw, pitch:cam.pitch, dist:cam.dist, el:document.getElementById('drawer')};
      const V = VESSELS[vtype()]; cam.pitch = 0.2; cam.dist = Math.max(11, V.len * 1.6); cam.yaw = 1.1; if (!active) show(true, true); }
    else if (PAINTV){ const P = PAINTV; PAINTV = null; cam.yaw = P.yaw; cam.pitch = P.pitch; cam.dist = P.dist; if (!P.was) show(false); }
  }
  function paintAim(C, yawW){
    const el = PAINTV.el; if (!el || el.hidden) return; const r = el.getBoundingClientRect(), W = innerWidth || 1, Hh = innerHeight || 1, tf = Math.tan(27.5 * DEG) * cam.dist;
    if (r.left > W * 0.3){ const k = (W - r.left) / W * tf * (W / Hh); C[0] += Math.cos(yawW) * k; C[2] += Math.sin(yawW) * k; }
    else C[1] -= Math.max(0, Hh - r.top) / Hh * tf;
  }
  // the market's showroom: a vessel type drawn afloat off the harbour you are in, the camera turning round it; null ends it
  let SHOW = null;
  function showroom(type){
    if (!type){ if (SHOW){ const was = SHOW.was; SHOW = null; cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; if (!was) show(false); } if (hooks.onShowroom) hooks.onShowroom(null); return; }
    const V = VESSELS[type]; if (!V || !vesselSpec(type)) return;
    const b = S.boat, pt = (b.port && portById(b.port)) || nearestPort(b.pos), a = approachPath(pt), q = a.length ? [a[0], a[a.length - 1]].sort((u, w) => dist(w, pt.p) - dist(u, pt.p))[0] : b.pos;
    SHOW = {t:type, x:q.x * 1000, z:q.y * 1000, h:Math.atan2(pt.p.x - q.x, -(pt.p.y - q.y)) + 1.2, was:active};
    cam.helm = false; cam.pitch = 0.18; cam.dist = Math.max(13, V.len * 1.7); cam.yaw = 1.1;
    if (!active) show(true);
    if (hooks.onShowroom) hooks.onShowroom(type);
  }
  function show(on, auto){
    if (on && !ready){
      const no3d = () => toast(t('no3d') + (failWhy ? ' (' + failWhy + ')' : ''));
      if (failed){ if (!auto) no3d(); return false; }
      if (!loading){ loading = true; toast(t('loading3d')); init().then(ok => { loading = false; if (ok) show(true, auto); else { if (hooks.on3dFail) hooks.on3dFail(); if (!auto) no3d(); } }); }
      return false;
    }
    active = !!on; canvas.hidden = !active; labelsEl.hidden = !active;
    document.getElementById('map').style.visibility = active ? 'hidden' : 'visible';
    if (active){ bv.init = false; lastF = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
    if (hooks.onView) hooks.onView(active);
    return true;
  }
  return {
    // the quality: with a setting ('auto', 'low', 'mid', 'high') it applies it; returns the level now and the frame rate
    quality(v){ if (v){ S.settings.q3d = v; QUAL.bad = QUAL.good = 0; QUAL.cap = 2; qualSet(); } return {lvl:QUAL.lvl, set:S.settings.q3d || 'auto', fps:FPS.v, ultra:UINT}; },
    show, toggle(){ return show(!active); }, hold(on){ HOLD = !!on; if (!on) lastF = performance.now(); }, isActive:() => active, say:say3d, crewFx:crewFx3d, sayWorker, sayBoat, anchorAlarm:anchorAlarm3d, haltNeed:() => dynLive() ? dynHaltNeed() : active ? trkHaltNeed() : 0, get failWhy(){ return failWhy; },
    // the next frame as a JPEG data URL (or null when no frame comes within 2 s)
    // whether a point (km, and metres above the ground) is in the picture the camera shows now: in front within the picture's width,
    // and no ground between (Kystposten's lighthouse pictures, ui/05f-turer.js)
    seen(xk, yk, hm){ if (!active || NO3D || !canvas) return null; const e = lastEye, x = xk * 1000, z = yk * 1000, y = Math.max(terrH(x, z), 0.2) + (hm || 10), dx = x - e[0], dz = z - e[2], d = Math.hypot(dx, dz) || 1;
      const asp = canvas.width / Math.max(1, canvas.height), half = Math.atan(Math.tan(curFov / 2) * asp), fl = Math.hypot(camFwd[0], camFwd[1]) || 1, ang = Math.acos(Math.max(-1, Math.min(1, (dx * camFwd[0] + dz * camFwd[1]) / (d * fl))));
      let clear = true; for (let i = 1; i < 32 && clear; i++){ const f = i / 32; if (d * (1 - f) < 150) break; if (terrH(e[0] + dx * f, e[2] + dz * f) > e[1] + (y - e[1]) * f + 2) clear = false; }
      return {d:Math.round(d), ang:Math.round(ang * 180 / Math.PI), half:Math.round(half * 180 / Math.PI), front:ang < half * 0.9, clear}; },
    snap(w){ return new Promise(res => { if (!active || NO3D || !canvas){ res(null); return; } if (SNAP) SNAP.res(null); const me = SNAP = {w:w || 1600, res};
      setTimeout(() => { if (SNAP === me){ SNAP = null; res(null); } }, 2000); }); },
    // for the sound (ui/10e-sound.js): the ear is the camera of the last frame drawn (metres; x east, z south; its direction on the
    // level), and where the sounds are: your boat, the crane and the ice chute of the plant she lies at, its pump, and the fleet near by
    ear(){ return active && performance.now() - earT < 2000 ? {x:lastEye[0], y:lastEye[1], z:lastEye[2], fx:camFwd[0], fz:camFwd[1]} : null; },
    sndSrc(){ const b = S.boat, P = b.port ? PLANTS.find(q => q.id === b.port) : null, B = b.port ? BUNKERS.find(q => q.id === b.port) : null;
      const AN = airNow.length ? airNow.reduce((a, c) => Math.hypot(c.w[0] - bv.x, c.w[1], c.w[2] - bv.z) < Math.hypot(a.w[0] - bv.x, a.w[1], a.w[2] - bv.z) ? c : a) : null;
      return {air:AN ? [AN.w[0], AN.w[1], AN.w[2], AN.kind === 'heli'] : null, boat:[bv.x, (bv.y || 0) + 1, bv.z], crane:P ? [P.crane[0], 9, P.crane[1]] : null, chute:P ? [P.drop[0], 4, P.drop[1]] : null, pump:B ? [B.pump[0], 2, B.pump[1]] : null,
        npc:npcNow.map(n => ({x:n.p.x * 1000, z:n.p.y * 1000, v:n.v || 0, st:n.st, big:n.type === 'coastal' || n.type === 'ferry'})).concat(RB && RB.q ? [{x:RB.q.r.p.x * 1000, z:RB.q.r.p.y * 1000, v:RB.q.r.v * 1.4, st:'sailing', big:true}] : [])}; },
    zoom(f){ if (cam.helm) cam.fov = clamp(cam.fov * f, 12, 75); else cam.dist = clamp(cam.dist * f, 7, 8000); }, reset(){ if (cam.helm){ cam.hy = 0; cam.hp = -0.07; cam.fov = 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } },
    vesselChanged(){ bv.init = false; bv.st = null; TRAIL.length = 0; },
    showroom, get showing(){ return SHOW ? SHOW.t : null; }, paintView, get painting(){ return !!PAINTV; },
    roadsReady(){ if (NEARM) buildGround(); for (const c of CH.values()) freeChunk(c); CH.clear(); },
    fineReady(){ if (FINEM){ freeMesh(FINEM); FINEM = null; } if (NEARM){ freeMesh(NEARM); NEARM = null; updateNear(); } },
    fishCam(){ cam.helm = false; cam.dist = 7; cam.pitch = 0.22; cam.yaw = -0.85; },
    // the cinema: on or off (the HUD is the page's: body.kino-clean)
    kino(on){ if (on !== undefined){ KINO.on = !!on; KINO.shot = null; } return KINO.on; }, intro:introStart, introOn:() => !!INTRO, get kinoShot(){ return KINO.shot ? KINO.shot.type : null; },
    isHelm:() => cam.helm, setHelm(on){ const G = GEO(vtype()); cam.helm = !!on; cam.zoom = 1; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; },
    _debug:{matp:MATP, nf:NF, cld:CLD, cfx:CFX, get fln(){ return FLN.n; }, get flt(){ return [...FLT].map(([k, F]) => ({k, docks:F.docks.length, mods:F.docks.reduce((a, D) => a + D.mods.length, 0), kinds:F.docks.reduce((a, D) => { for (const q of D.mods) a[q.M] = (a[q.M] || 0) + 1; return a; }, {}), tris:F.mesh ? Math.round(F.mesh.n / 3) : 0})); }, get gln(){ return Object.assign({diag:glDiag()}, GLN); }, get kitStat(){ return KST; }, tankPlace(t){ if (!GB) buildGear(); const G = GEO(t), d = G.deck || {y:G.gw, z:2}, sx = G.beam / 2; return potDeck(G, G.hauler || [sx * 0.92, d.y + 1, d.z - 1.3], sx, d, ((GB.px || {}).pot || {}).half || 0.7, t).tank; }, get dk(){ const now = performance.now() / 1000; return {ev:DKEV.map(e => ({kind:e.kind, who:e.who, for:e.for || null, age:+(now - e.t0).toFixed(2), chained:!!e.chained})), deck:DKDECK.length, lay:Object.keys(DKLAY).length, n:Object.assign({}, DKN)}; }, kitPart:(f, nm) => !!kit(f, nm), kitX, get anchl(){ return ANCHAL; }, get anc3(){ return {mode:ANC3.mode, Lg:+ANC3.Lg.toFixed(2), links:ANC3.links, splash:ANC3.splash}; }, jigRail:t => jigRail(t, GEO(t)), get jsms(){ return JSMS; }, lift:LIFT, bv, pota:POTA, get fps(){ return FPS.v; }, get cam(){ return cam; }, trawl(mode, at, hold){ TRAWL.mode = mode || null; TRAWL.t0 = performance.now() / 1000 - (at || 0); TRAWL.hold = hold ? at || 0 : null; return mode; }, seine(mode, at, hold){ SEINE.mode = mode || null; SEINE.t0 = performance.now() / 1000 - (at || 0); SEINE.hold = hold ? at || 0 : null; return mode; }, get seineNow(){ return seineState(performance.now() / 1000); }, get trawlNow(){ const st = trawlState(performance.now() / 1000); return TRAWL.mode ? Object.assign({mode:TRAWL.mode}, st) : null; }, get trk(){ const D = dynTrackView(); if (D) return D; return TRK && {s:TRK.s, v:TRK.v, vc:TRK.vc, end:TRK.end, sIn:TRK.sIn, back:TRK.back, turnL:TRK.turnL, done:TRK.done, stops:TRK.stops.map(q => q.s), P:TRK.P}; }, get peers(){ return npcNow.filter(n => n.player).map(n => ({id:n.id, vtype:n.vtype, t:n.K ? n.K.t : null, glass:!!(n.K && n.K.glass)})); }, get air(){ return airNow.map(a => ({kind:a.kind, w:a.w.map(Math.round)})); }, get airM(){ return !!(AIRM && AIRM.plane); }, get curFov(){ return curFov; }, cam, moundTop, bridgeInto, get statTris(){ return STAT ? STAT.n / 3 : 0; }, get vec(){ return {tiles:[...VEC.tiles.values()].map(t => ({k:t.k, bld:t.bld ? t.bld.n : 0, roads:t.roads.length, bridges:t.bridges.length, piers:t.piers.length, molos:t.molos.length, quays:t.quays.length, ms:Math.round(t.ms)})), statics:[...TST].map(([k, s]) => ({k, tris:s.tris, ms:Math.round(s.ms)})), chunks:CH.size}; }, moundInto, MB, haulModel, get haulA(){ return HAULA; }, gopHands:() => typeof workAssign === 'function' ? workAssign().filter(p => p.st === 'haling').length : 0, kinoNext(){ KINO.shot = null; }, get kino(){ const k = KINO.shot, e = KINO.eye, g = KINO.tgt; if (!k || !e) return null; const t = (performance.now() - T0) / 1000; return {type:k.type, up:e[1] - Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)), free:camFree(g, e), d:Math.hypot(e[0] - bv.x, e[2] - bv.z)}; }, get PLA(){ return PLA; }, get PCA(){ return PCA; }, set noPL(v){ NOPL = !!v; }, get beams(){ return BMN; }, glErr(){ return gl ? gl.getError() : -1; }, mastTop:t => mastTop(geoOf(t)), QUAL, qualTick, TERRW, get TERR(){ return TERR; }, get MIDM(){ return MIDM; }, RO, SSL, WV, WK, ssAt, seaH, waves:(dt, H) => updateWaves(dt, H), get sstVS(){ return SST_VS; }, get seaLvl(){ return seaLvl; }, get seaBasic(){ return !!(PS && PS.basic); }, get seaOne(){ return PSF === PS; }, get seaLite(){ return !!(PS && PS.lite); }, set seaDbg(v){ SEADBG = v; }, get drift(){ let c = 0; for (let i = 0; i < SDN; i++) if (SD.age[i] < SD.life[i]) c++; return c; }, get eye(){ return lastEye; }, camInside, camFree, get camPull(){ return camPull; }, get camLift(){ return camLift; }, get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, BUNKERS, nearestPlant, fkRun, legAt, terrH, terrRaw, unitModel, get UPATCH(){ return UPATCH; }, sitesNow, siteModel, onSite, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; lightsHere(e, 50).forEach(L => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(L, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }, get landMask(){ return LMON ? lcv : null; }, get maskMs(){ return LMMS; }, get coast3(){ return COAST3; }, meshH(x, z){ const M = FINEM && x > FINEM.x0 + 8 && x < FINEM.x0 + FINEM.sx - 8 && z > FINEM.z0 + 8 && z < FINEM.z0 + FINEM.sz - 8 ? FINEM : NEARM; return M ? nearSurf(M, x, z) : NaN; }, seaU(){ if (!PS) return null; gl.useProgram(PS.p); const g = n => PS.u[n] == null ? 'none' : gl.getUniform(PS.p, PS.u[n]); return {ls:g('uLSOn'), land:g('uLandS'), rect:g('uLRect') && Array.from(g('uLRect')), hOn:g('uHOn'), sOn:g('uSOn'), lmon:LMON, gr:!!GRECT, lt:!!LMTEX}; },  get FINEM(){ return FINEM; }, get seaNP(){ return NP; }, get dpr(){ return canvas ? canvas.width / Math.max(1, canvas.getBoundingClientRect().width) : 0; }}
  };
})();
