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
  // ---------- man overboard (Ø11.6, core/14b-sikkerhet.js): the person in the water, the lifebuoy with its light and its smoke, and the
  // rescue boat swung out on its davit, lowered, run out to her and back, and hoisted in (from 45 m). The thrown buoy leaves its bracket
  // empty and the rescue boat its cradle: for the frame, drawSafety (09-landing-deck.js) gets the boat's kit with that buoy's place sunk
  // out of sight and without the rescue boat (MOB3.G, put back in drawRescueLights once the deck is drawn), and this draws the empty
  // holder, the cradle and the davit. The hand who keeps the person in sight and points is in deckcrew.js (MOBUI.spot).
  // The phases of the rescue boat (core mobLift: lift.ph, in game minutes): the davit out (t0 to swing, the boat lifted off its cradle
  // first), the fall paid out to the sea (to low; LSA 6.1.2.8), out to the person at 6 knots (to there), the person in (to tp), back (to
  // back), hoisted and swung in (to t1).
  const MOB3 = {G:null, K:null, eye:null, p:null, light:null, sm:{x:new Float32Array(160), y:new Float32Array(160), z:new Float32Array(160), age:new Float32Array(160).fill(99), n:0}, smT:0, look:null, lookK:'', st:{person:0, buoy:0, light:0, smoke:0, boat:null, holder:0}};
  if (typeof window !== 'undefined') window.MOB3D = MOB3;   // (the tests: what the last frame drew)
  function mobKitBack(){ if (MOB3.G){ MOB3.G.kit = MOB3.K; MOB3.G = MOB3.K = null; } }
  const mobEase = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
  function mobLook(M){
    if (MOB3.lookK === M.id && MOB3.look) return MOB3.look;
    let l = null; try { const c = !M.anon && typeof crewById === 'function' ? crewById(M.cid) : null; l = c ? lookOf(c) : lookFromSeed(String(M.cid), M.sex || 'm', 30, 'sea'); } catch (e){ l = null; }
    MOB3.look = l ? lookVest(l) : null; MOB3.lookK = M.id; return MOB3.look;
  }
  function drawMob(BMrel, eye, VP, t){
    mobKitBack(); MOB3.eye = eye; MOB3.p = MOB3.light = null; const ST = MOB3.st; ST.person = ST.buoy = ST.light = ST.holder = 0; ST.boat = null;
    const M = S.mob; if (!M || M.vid !== S.cur || typeof mobAt !== 'function') return;
    const f = liveFrac(), tg = S.t + f, vt = vtype(), G = GEO(vt), K = G.kit, L = (VESSELS[vt] || {}).lsa, LF = M.lift;
    const boatOut = !!(LF && LF.how === 'boat' && LF.ph && L && L.mob && K && K.mob);
    nSetup(VP);
    // the deck this frame: the thrown buoy's place and the rescue boat out of drawSafety; the empty holder drawn here
    if (K && (M.buoy || boatOut)){ const k2 = Object.assign({}, K);
      if (M.buoy && K.buoys && K.buoys[0]){ const q = K.buoys[0]; k2.buoys = K.buoys.slice(); k2.buoys[0] = [q[0], q[1] - 500, q[2], q[3]];
        const H = kit('safe', 'boyeholder'); if (H){ drawN(H, chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0))); ST.holder = 1; } }
      if (boatOut) k2.mob = null;
      MOB3.G = G; MOB3.K = K; G.kit = k2; }
    const sea = (x, z) => (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8;
    // the person: head and shoulders over the sea in the life jacket, facing the boat, one arm waving; gone into the rescue boat at tp
    const p = mobAt(f), px = p.x * 1000, pz = p.y * 1000, me = (typeof livePose === 'function' ? livePose(f).p : S.boat.pos);
    if (M.st === 'water' && Math.hypot(px - eye[0], pz - eye[2]) < 4000){ const sy = sea(px, pz), lk = mobLook(M), h = Math.atan2(me.x * 1000 - px, -(me.y * 1000 - pz));
      if (typeof drawWorker === 'function') drawWorker({gy:() => sy - 1.4, bare:true, spray:0, kit:null, look:lk}, {x:px, z:pz, h, task:'signal', walk:false, s:0}, eye, t, 11);
      nSetup(VP); MOB3.p = [px - eye[0], sy - eye[1], pz - eye[2]]; ST.person = 1; }
    // the lifebuoy: flat on the sea (the ring stands in x-y in its model), round her when she holds it; its light floating upright by it
    const B = M.buoy;
    if (B){ const held = B.held && M.st === 'water', bx = held ? px : B.x * 1000, bz = held ? pz : B.y * 1000;
      if (Math.hypot(bx - eye[0], bz - eye[2]) < 4000){ const by = sea(bx, bz), R = kit('safe', 'livboye'), LT = kit('safe', 'boyelys');
        if (R && !(M.st !== 'water' && B.held)){ drawN(R, chain(model(bx - eye[0], by - 0.03 - eye[1], bz - eye[2], 0.4, 0, 0), M4.RX(Math.PI / 2))); ST.buoy = 1; }
        const lx = bx + 0.62, lz = bz + 0.2, ly = sea(lx, lz);
        if (LT){ drawN(LT, chain(model(lx - eye[0], ly - 0.12 - eye[1], lz - eye[2], 0, Math.sin(t * 1.3) * 0.15, Math.sin(t * 1.1) * 0.15), M4.RX(Math.PI))); ST.light = 1; }
        MOB3.light = [lx - eye[0], ly + 0.2 - eye[1], lz - eye[2], B.smoke && tg - B.t < MOBK.smoke ? 1 : 0]; } }
    // the rescue boat from 45 m: the cradle stays, the davit's arm slews out and back, the boat hangs from the hook, rides the sea out to
    // her and back
    if (boatOut){ const q = K.mob, XM = kitX('mob'), Mc = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)), ba = XM.boat_at || [0, 0.45, 0], MBs = chain(Mc, M4.T(ba[0], ba[1], ba[2]));
      const V0 = kit('mob', 'mob_vugge'); if (V0) drawN(V0, Mc);
      const s = q[4] || 1, dz = q[5] || 0, da = XM.davit_at || [1.75, 0, 0.4], MD = s < 0 ? chain(Mc, M4.T(-da[0], da[1], da[2] + dz), M4.RY(Math.PI)) : chain(Mc, M4.T(da[0], da[1], da[2] + dz));
      const a0 = dz ? Math.atan2(-dz * s, XM.reach || 1.75) : 0, ph = LF.ph, back = ph.back, t1 = LF.t1, mid = back + (t1 - back) / 2;
      const sw = tg < ph.swing ? mobEase((tg - LF.t0 - 0.15) / Math.max(0.01, ph.swing - LF.t0 - 0.15)) : tg < mid ? 1 : 1 - mobEase((tg - mid) / Math.max(0.01, t1 - mid));
      const MA = chain(MD, M4.RY(a0 + Math.PI * sw)), MAs = chain(MD, M4.RY(a0)), ha = XM.hook_at || [-1.75, 3.174, 0], hd = XM.head_at || [-1.75, 3.474, 0];
      const ring = XM.ring || [0, 1.5, -2], hookS = xf(chain(MAs, M4.T(ha[0], ha[1], ha[2])), [0, 0, 0]), ringS = xf(MBs, ring), hookN = xf(chain(MA, M4.T(ha[0], ha[1], ha[2])), [0, 0, 0]);
      const lift0 = tg < ph.swing ? 0.3 * mobEase((tg - LF.t0) / 0.15) : 0.3;   // (off the cradle first)
      // where the boat's origin would hang now, and where it floats under the davit
      const hang = xf(MBs, [0, 0, 0]); hang[0] += hookN[0] - hookS[0]; hang[1] += hookN[1] - hookS[1] + lift0; hang[2] += hookN[2] - hookS[2];
      const wy = sea(hang[0] + eye[0], hang[2] + eye[2]) - 0.3 - eye[1], drop = hang[1] - wy;
      let O = hang, yaw = null, inWater = false;
      const pp = [px - eye[0], 0, pz - eye[2]], dirx = pp[0] - hang[0], dirz = pp[2] - hang[2], dl = Math.hypot(dirx, dirz) || 1, by = [pp[0] - dirx / dl * 2.2, 0, pp[2] - dirz / dl * 2.2];
      const at = u => { const x = hang[0] + (by[0] - hang[0]) * u, z = hang[2] + (by[2] - hang[2]) * u; return [x, sea(x + eye[0], z + eye[2]) - 0.3 - eye[1], z]; };
      let phase;
      if (tg < ph.swing){ phase = 'swing'; }
      else if (tg < ph.low){ phase = 'lower'; O = [hang[0], hang[1] - drop * mobEase((tg - ph.swing) / Math.max(0.01, ph.low - ph.swing)), hang[2]]; }
      else if (tg < ph.there){ phase = 'out'; O = at(mobEase((tg - ph.low) / Math.max(0.01, ph.there - ph.low))); yaw = Math.atan2(dirx, -dirz); inWater = true; }
      else if (tg < LF.tp){ phase = 'pick'; O = at(1); yaw = Math.atan2(dirx, -dirz); inWater = true; }
      else if (tg < back){ phase = 'back'; O = at(1 - mobEase((tg - LF.tp) / Math.max(0.01, back - LF.tp))); yaw = Math.atan2(-dirx, dirz); inWater = true; }
      else if (tg < mid){ phase = 'hoist'; O = [hang[0], wy + drop * mobEase((tg - back) / Math.max(0.01, mid - back)), hang[2]]; }
      else phase = 'in';
      // the boat: hanging she keeps the ship's heading (the painters), in the water she points where she goes and rides the sea
      const o0 = xf(MBs, [0, 0, 0]), MBn = yaw == null ? chain(M4.T(O[0] - o0[0], O[1] - o0[1], O[2] - o0[2]), MBs)
        : model(O[0], O[1], O[2], -yaw, Math.sin(t * 1.4) * 0.05, Math.sin(t * 1.1) * 0.08);
      for (const nm of ['mob_boat', 'mob_sling']){ const m = kit('mob', nm); if (m) drawN(m, MBn); }
      // the davit, the arm, the hook (down with the boat while she hangs, up again while she is away) and the fall
      const DV = kit('mob', 'mob_davit'), AR = kit('mob', 'mob_arm'), HK = kit('mob', 'mob_hook'), FL = kit('mob', 'mob_fall'); if (DV) drawN(DV, MD); if (AR) drawN(AR, MA);
      const down = inWater ? 0 : hang[1] - O[1], MH = chain(M4.T(0, -down, 0), MA, M4.T(ha[0], ha[1], ha[2]));
      if (HK) drawN(HK, MH); if (FL) drawN(FL, limbM(xf(MA, hd), xf(MH, [0, 0, 0]), 1));
      ST.boat = phase; }
  }
  // the lights and the smoke (drawRescueLights, after the deck: the kit is put back first): the buoy's light by night, flashing; the
  // MOB light's orange smoke by day and night while it burns (15 min), rising and drifting off with the wind
  function drawMobLights(VP, t){
    mobKitBack(); const Q = MOB3.light, eye = MOB3.eye, SM = MOB3.sm, now = performance.now() / 1000, dt = Math.min(0.1, Math.max(0, now - (MOB3.smT || now))); MOB3.smT = now; MOB3.st.smoke = 0;
    if (Q && Q[3] && eye){ const k = SM.n = (SM.n + Math.floor(dt * 20 + 0.5)) % 160; for (let j = 0; j < Math.max(1, Math.floor(dt * 20 + 0.5)); j++){ const i = (k + j) % 160; SM.x[i] = Q[0] + eye[0] + (Math.random() - 0.5) * 0.2; SM.y[i] = Q[1] + eye[1]; SM.z[i] = Q[2] + eye[2] + (Math.random() - 0.5) * 0.2; SM.age[i] = 0; } }
    let n = 0; if (eye){ const wv = (env.wind || 0) * 0.7, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv;
      for (let i = 0; i < 160; i++){ if (SM.age[i] >= 6) continue; SM.age[i] += dt; SM.x[i] += wx * dt; SM.z[i] += wz * dt; SM.y[i] += (0.9 - SM.age[i] * 0.12) * dt;
        const a = SM.age[i] / 6; PB[n * 3] = SM.x[i] - eye[0]; PB[n * 3 + 1] = SM.y[i] - eye[1]; PB[n * 3 + 2] = SM.z[i] - eye[2]; PA[n] = Math.pow(1 - a, 1.4) * 0.55 * Math.min(1, SM.age[i] / 0.3); n++; } }
    if (n){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(n, gl.POINTS, VP, [1.0, 0.45, 0.12], 1100, 2, null, 180); gl.depthMask(true); gl.disable(gl.BLEND); MOB3.st.smoke = n; }
    if (Q && env.night > 0.05 && Math.floor(t * 1.1) % 2 === 0){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); PB[0] = Q[0]; PB[1] = Q[1] + 0.15; PB[2] = Q[2]; PA[0] = Math.max(0.6, env.night); drawPts(1, gl.POINTS, VP, [1, 0.97, 0.85], 700, true); gl.depthMask(true); gl.disable(gl.BLEND); }
  }
  let RB = null;
  function buildRescue(){
    if (typeof glbHas !== 'function' || !glbHas('redning')) return;
    const G = glbLoad('redning'), up = nm => { const o = glbPart('redning', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.95, 0.72, 0.12, 0.2], 6);
    RB = {hull:up('hull'), blue:up('blue'), rope:r.mesh(), ex:(G && G.ex) || {}, M:null, q:null};
  }
  function drawRescue(BMrel, eye, VP, t){
    drawMob(BMrel, eye, VP, t);   // man overboard (Ø11.6)
    if (!RB) return; RB.M = null; RB.q = null;
    const q = S.boat.status === 'tow' && typeof towPose === 'function' ? towPose(liveFrac()) : null; if (!q || !RB.hull) return;
    const x = q.r.p.x * 1000, z = q.r.p.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) > 12000) return;
    const y = (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.7;
    RB.q = q; RB.M = model(x - eye[0], y - eye[1], z - eye[2], -q.r.hd, Math.sin(t * 0.8 + 1.3) * 0.02, Math.sin(t * 1.0) * 0.03 * (0.3 + WV.hs));   // (a fixed phase: her place in metres made her shudder under way)
    nSetup(VP); drawN(RB.hull, RB.M); if (RB.blue && Math.floor(t * 2.5) % 2 === 0) drawN(RB.blue, RB.M);
    // the tow line from the hook to your bow: slack while it is made fast, near taut under tow
    if ((q.ph === 'hook' && q.slack < 0.7) || q.ph === 'tow'){
      const G = GEO(vtype()), A = xf(BMrel, [0, (G.gw || 1) + 0.15, G.bow + 0.3]), B = xf(RB.M, RB.ex.tow || [0, 2, 5]);
      const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), sag = q.ph === 'tow' ? 0.01 * d + 0.3 : q.slack * 0.3 * d + 0.5;
      let prev = A; for (let k = 1; k <= 10; k++){ const s = k / 10, P = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - sag * 4 * s * (1 - s), A[2] + (B[2] - A[2]) * s]; drawN(RB.rope, limbM(prev, P, 0.035)); prev = P; }
    }
  }
  function drawRescueLights(VP, t){
    drawMobLights(VP, t);   // man overboard (Ø11.6): the kit back, the buoy's light and the smoke
    if (!RB || !RB.M || !RB.ex.lights) return;
    const flash = Math.floor(t * 2.5) % 2 === 0, BL = [0.25, 0.45, 1];
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const [lx, ly, lz, c] of RB.ex.lights){ if (c === 'b' ? !flash : env.night < 0.05) continue; const q = xf(RB.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = c === 'b' ? Math.max(0.6, env.night) : env.night; drawPts(1, gl.POINTS, VP, c === 'b' ? BL : NLC[c], c === 'b' ? 900 : 500, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
