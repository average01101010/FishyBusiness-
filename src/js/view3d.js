  // ---------- drawing ----------
  function litSetup(VP){
    gl.useProgram(PL.p); const u = PL.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb);
    gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uOver, [0, 0, 0, 0]); plSet(u);
  }
  const NOHOLE = new Float32Array([1e9, 1e9, -1e9, -1e9]);
  function drawLit(m, M, hole){
    if (!m) return;   // a mesh not built yet or an empty one (08.10.2026: «Cannot read properties of undefined (reading 'parts')» every frame, the game stopped)
    if (m.parts){ for (const q of m.parts) drawLit(q, M, hole); return; }
    gl.uniformMatrix4fv(PL.u.uM, false, m.o ? relM(m) : M); gl.uniform4fv(PL.u.uHole, hole || NOHOLE); attr(0, m.pb, 3); attr(1, m.cb, 3);
    if (m.ib){ gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, m.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); } else gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }
  // the terrain program of the quality in use (terFS: MATQ 0 on low, 1 on mid, 2 on high and ultra; #mat0..2 in the address overrides),
  // compiled when first needed; a tier a driver will not compile falls back to the one below
  let PTS = [null, null, null];
  function terProg(q){
    if (PTS[q]) return PTS[q];
    try { PTS[q] = program(TER_VS, terFS(q), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat'], 'terreng' + q); }
    catch (e){ console.warn('terreng' + q, e.message || e); PTS[q] = terProg(q - 1); }
    return PTS[q];
  }
  const MATQ_FIX = (location.hash.match(/mat(\d)/) || [])[1];
  const MATP = {p:[0.5, 0.4, 0.65, 0.6], q:[0.4, 0.6, 2, 0]};   // chosen from the variant sheets 18.10.2026 (matvar.py in the session)   // the material shader's tuning (terFS uMP, uMQ)
  function drawTerrain(TM, eye, VP, near){
    const PQ = terProg(MATQ_FIX !== undefined ? +MATQ_FIX : Math.min(2, QUAL.lvl)) || PT; gl.useProgram(PQ.p); const u = PQ.u; plSet(u);
    if (u.uMP){ gl.uniform4fv(u.uMP, MATP.p); gl.uniform4fv(u.uMQ, MATP.q); }
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uSand, snowNow == null || snowNow < 5 ? [0.84, 0.86, 0.88] : [0.74, 0.71, 0.6]); gl.uniformMatrix4fv(u.uM, false, TM);
    const one = (m, hole, ground) => {
      gl.uniformMatrix4fv(u.uM, false, relM(m)); gl.uniform3fv(u.uPO, [m.o[0] - RO.x, 0, m.o[1] - RO.z]); gl.uniform4fv(u.uHole, hole || NOHOLE); gl.uniform1f(u.uGOn, ground && GTEX ? 1 : 0); gl.uniform1f(u.uLOn, ground && LMTEX && LMON ? 1 : 0); gl.uniform1f(u.uTideY, Math.min(env.tide || 0, COAST3.top - 0.15)); gl.uniform1f(u.uSwash, clamp(0.5 * (WV.hs + WV.swHs), 0, COAST3.swash));
      if (ground && LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE0); }
      if (LRECT) gl.uniform4fv(u.uGRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]);
      if (ground && GTEX){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX); gl.uniform1i(u.uGround, 0); gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]); }
      attr(0, m.pb, 3); attr(1, m.cb, 3); attr(2, m.nb, 3); attr(3, m.sb, 1); attr(4, m.mb, 4); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, m.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    };
    const holeOf = (M, g) => new Float32Array([M.x0 + g - eye[0], M.z0 + g - eye[2], M.x0 + M.sx - g - eye[0], M.z0 + M.sz - g - eye[2]]);
    if (!NEARM) one(TERR);
    else if (near){ one(NEARM, FINEM ? holeOf(FINEM, 6) : null, true); if (FINEM){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1); one(FINEM, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } if (UPATCH.length){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); for (const m of UPATCH) one(m, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } }
    else if (!MIDM) one(TERR, holeOf(NEARM, 45));
    else { one(TERR, holeOf(MIDM, 180)); one(MIDM, holeOf(NEARM, 45)); }
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4); litSetup(VP);
  }
  // ground layer under the corridor: roads and forest, drawn on a canvas and draped on the terrain
  function buildGround(){
    if (!NEARM) return;
    const size = 2048, x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx;
    // the roads on the ground are off (the canvas was a blank 2048 x 2048 uploaded with mipmaps at every rebuild): no ground texture
    GTEX = null;
    GRECT = [x0, z0, 1 / sx, 1 / sx];
    // shore layer for the water: R = land cover (surf band), G = how shallow
    const S2 = 256, dat = new Uint8Array(S2 * S2 * 4), st = sx / S2, dok = mapViewReady(x0 / 1000, z0 / 1000, (x0 + sx) / 1000, (z0 + sx) / 1000, () => staleMesh('near'));
    for (let j = 0; j < S2; j++) for (let i = 0; i < S2; i++){ const x = x0 + (i + 0.5) * st, z = z0 + (j + 0.5) * st, m = dok ? (mapSimAt({x:x / 1000, y:z / 1000}) ? rbilM(MAPD.L.mask, x, z) : rbilM(MAPD.L.land200, x, z)) : rbilM(MAPD.L.land200, x, z), o = (j * S2 + i) * 4, dd = m > 0.5 ? 0 : dok ? depthF({x:x / 1000, y:z / 1000}) : 50; dat[o] = Math.round(m * 255); dat[o + 1] = Math.round(clamp(1 - dd / 14, 0, 1) * 255); dat[o + 3] = 255; }
    STEX = STEX || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, STEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S2, S2, 0, gl.RGBA, gl.UNSIGNED_BYTE, dat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    SRECT = [x0, z0, 1 / sx, 1 / sx];
    { const n = NEARM.gn, px = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) px[k] = Math.round(clamp((NEARM.h[k] + 8) / 16, 0, 1) * 255);
      HTEX = HTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, n, n, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, px); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0); }
    buildLandMask();
  }
  // The shore texture over the near terrain (2048 x 2048, 4096 on ultra; 1.5-6 m a texel; LUMINANCE, h = r * 8 - 4 m, no mips):
  // the foreshore's own height by the profile of terrRaw (COAST3), drawn from the chart packs' coast2 with a canvas: the sea black
  // (-4 m), the coast's rings stroked widest first in steps of about half a metre of height, the land's at 1 in 3 and the breakwaters'
  // (class 2 and 3) at 1 in 1.5, all in the order of their height so the nearest shore wins where two meet, and the land filled over
  // them at COAST3.top (1.7 m), so the ramp lies on the sea's side alone. Then the harbour units' basins and the quays' pockets as
  // deep water and their blocks and fills as land a texel wider than they are, so the cut never bites a deck (quay walls are plumb).
  // The terrain shader cuts the ground that stands over the tide where the texture lies under it (uLand, uTideY), and the sea shader
  // puts the surf where the texture meets the tide (uLandS): one waterline, read the same on every GPU (no mip, no bias).
  // Off the tiles with a chart pack (or until it comes) there is no texture, and the ground meets the sea where it is.
  // (Jonas 12.10.2026, #61: the binary mask of before, read from a mip at a distance, cut thin land and the hills behind it, left the
  // surf beside the land and the foreshore's ramp as a brown line in the water.)
  // Drawn a few strokes a frame (lmStep, LMSLICE ms): the coast within a window of the whole coast runs to tens of thousands of points,
  // and 24 strokes of it at once stalled a tablet for a second. The texture in use (LMTEX, LRECT) stands until the new one is done.
  let LMON = false, LMTEXEL = 3, LMMS = 0, LRECT = null, LMJOB = null;   // LMTEXEL: metres per texel; LMMS: the last build's time (ms); LRECT: [x0, z0, 1/sx, 1/sx] of the texture in use
  const LMSLICE = 9, lmByte = h => Math.round(clamp((h + 4) / 8, 0, 1) * 255), lmCol = h => { const b = lmByte(h); return 'rgb(' + b + ',' + b + ',' + b + ')'; };
  function buildLandMask(){
    if (!NEARM) return;
    const t0 = performance.now(), size = Math.min(QUAL.lvl === 3 ? 4096 : 2048, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048), x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx, T = MAPD.man.tile * 1000;
    const pks = mapPacksIn('chart', x0 / 1000, z0 / 1000, (x0 + sx) / 1000, (z0 + sx) / 1000);
    if (!pks.length){ LMON = false; LMJOB = null; return; }
    const wait = pks.filter(pk => !pk.buf); if (wait.length){ Promise.all(wait.map(mapLoad)).then(() => buildLandMask(), e => console.error(e)); return; }
    // the rings within the window and the ramp's reach, per pack
    const W = (COAST3.top + 4) / COAST3.g + 2, paths = [];
    for (const pk of pks){ const ox = pk.tile[0] * T, oz = pk.tile[1] * T, P = chartPathsIn(pk, [x0 - ox - W, z0 - oz - W, x0 + sx - ox + W, z0 + sx - oz + W]); if (P && P.n) paths.push({pk, ox, oz, P}); }
    // the strokes: for each ring class its ramp down from the line, as (height, half width) pairs, drawn deepest first
    const steps = [], sz = 0.5;
    for (const [key, gr] of [['land', COAST3.g], ['mole', COAST3.gMole]]){
      if (!paths.some(q => q.P[key])) continue;
      const Wc = (COAST3.top + 4) / gr, n = Math.ceil(Wc * gr / sz);
      for (let i = 0; i < n; i++){ const w1 = Wc * (1 - i / n), w0 = Wc * (1 - (i + 1) / n); steps.push({key, w:w1, h:COAST3.top - (w1 + w0) / 2 * gr}); }
    }
    steps.sort((a, b) => a.h - b.h);
    lcv = lcv || document.createElement('canvas'); if (lcv.width !== size) lcv.width = lcv.height = size;
    const g = lcv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = lmCol(-4); g.fillRect(0, 0, size, size); g.lineJoin = 'round'; g.lineCap = 'round';
    LMJOB = {g, paths, steps, i:0, x0, z0, sx, k, size, t0, ms:performance.now() - t0};
    lmStep();
  }
  // a slice of the shore texture's drawing; the rest when it is done
  function lmStep(){
    const J = LMJOB; if (!J) return; const t0 = performance.now(), until = t0 + LMSLICE, {g, paths, steps, x0, z0, sx, k} = J;
    const tf = q => g.setTransform(1000 * k, 0, 0, 1000 * k, (q.ox - x0) * k, (q.oz - z0) * k);
    while (J.i < steps.length){
      const st = steps[J.i++]; g.strokeStyle = lmCol(st.h); g.lineWidth = 2 * st.w / 1000;
      for (const q of paths){ const p = q.P[st.key]; if (!p) continue; tf(q); g.stroke(p); }
      if (performance.now() > until){ J.ms += performance.now() - t0; return; }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const near = (x, z) => x > x0 - 300 && x < x0 + sx + 300 && z > z0 - 300 && z < z0 + sx + 300;
    // a fill's own sides fall 1 in 1.6 (unitTerr): its ramp round it, as a breakwater's, under the land's fill (its land side stays land)
    const fp = new Path2D(); let anyF = false;
    for (const U of UNITA){ if (!near(U.o[0], U.o[1]) || !U.f || U.f.length < 6) continue; anyF = true;
      for (let i = 0; i < U.f.length; i += 2){ const [x, z] = unitW(U, U.f[i], U.f[i + 1]); i ? fp.lineTo((x - x0) * k, (z - z0) * k) : fp.moveTo((x - x0) * k, (z - z0) * k); } fp.closePath(); }
    if (anyF) for (const st of steps){ if (st.key !== 'mole') continue; g.strokeStyle = lmCol(st.h); g.lineWidth = 2 * st.w * k; g.stroke(fp); }
    g.fillStyle = lmCol(COAST3.top);
    for (const q of paths){ if (!q.P.all) continue; tf(q); g.fill(q.P.all, 'nonzero'); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const poly = (pts, h, wide) => { g.fillStyle = g.strokeStyle = lmCol(h); g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo((x - x0) * k, (z - z0) * k) : g.moveTo((x - x0) * k, (z - z0) * k)); g.closePath(); g.fill(); if (wide){ g.lineWidth = 2; g.stroke(); } };
    for (const U of UNITA){ if (!near(U.o[0], U.o[1])) continue; const q = ugeo(U);
      poly([[-q.basinX, 0.2], [q.basinX, 0.2], [q.basinX, q.basinZ], [-q.basinX, q.basinZ]].map(([a, b]) => unitW(U, a, b)), -4); }
    for (const f of qPockets()){ if (!near(f.x, f.z)) continue; const s = f.hl + 4, Q = (a, b) => [f.x + f.ux * a + f.nx * b, f.z + f.uz * a + f.nz * b]; poly([Q(-s, 0.2), Q(s, 0.2), Q(s, POCKET), Q(-s, POCKET)], -4); }
    for (const U of UNITA){ if (!near(U.o[0], U.o[1])) continue;
      const fl = []; for (let i = 0; i < U.f.length; i += 2) fl.push(unitW(U, U.f[i], U.f[i + 1])); poly(fl, COAST3.top, true);
      const q = ugeo(U); poly([[-q.E, -q.B], [q.E, -q.B], [q.E, 0], [-q.E, 0]].map(([a, b]) => unitW(U, a, b)), COAST3.top, true); }
    LMTEX = LMTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, lcv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
    LMON = true; LMTEXEL = sx / J.size; LRECT = [x0, z0, 1 / sx, 1 / sx]; LMJOB = null; LMMS = J.ms + performance.now() - t0;
  }
  // the flat sea as a ring: the rectangle R [x0, z0, x1, z1] less the hole Hl where something nearer is drawn, as up to four strips,
  // so no water is shaded twice and the shader never discards (which costs the early depth test on phone and tablet GPUs)
  function seaRing(u, eye, y, R, Hl){
    if (Hl){ Hl = [Math.max(R[0], Hl[0]), Math.max(R[1], Hl[1]), Math.min(R[2], Hl[2]), Math.min(R[3], Hl[3])]; if (Hl[2] <= Hl[0] || Hl[3] <= Hl[1]) Hl = null; }
    const strips = Hl ? [[R[0], R[1], R[2], Hl[1]], [R[0], Hl[3], R[2], R[3]], [R[0], Hl[1], Hl[0], Hl[3]], [Hl[2], Hl[1], R[2], Hl[3]]] : [R];
    attr(0, FARQ.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FARQ.ib);
    for (const [a, b, c, d] of strips){
      if (c - a < 0.5 || d - b < 0.5) continue; const ox = (a + c) / 2, oz = (b + d) / 2;
      gl.uniform2fv(u.uScale, [(c - a) / 2, (d - b) / 2]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], y, oz - eye[2]]);
      gl.drawElements(gl.TRIANGLES, FARQ.n, gl.UNSIGNED_SHORT, 0);
    }
  }
  function drawSea(VP, eye, t, far, drop){
    { const np = QUAL.lvl === 3 && UINT ? 300 : 150; if (np !== NP){ NP = np; buildPatch(); } }   // the wave patch: 2 m on ultra
    const P = far && (drop === undefined || !QUAL.lvl) ? PSF : PS; gl.useProgram(P.p); const u = P.u;   // low quality: the far shader right up to the wave patch
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uHalf, HALF); gl.uniform1f(u.uFlat, far ? 1 : 0);
    gl.uniform1f(u.uCell, 2 * HALF / NP); gl.uniform1f(u.uPx, 2 * Math.tan(curFov / 2) / Math.max(canvas.height, 1)); gl.uniform1f(u.uDbg, SEADBG ? 1 : 0);
    // the local sea: the textures on units 4 and 5 (a 1 x 1 stand-in until they are ready)
    gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform4fv(u.uWk2, WK.u2); gl.uniform4fv(u.uWk3, WK.u3);
    gl.uniform4fv(u.uSea, [WV.C, WV.cap, WV.lnFcap, WV.swHs]); gl.uniform4fv(u.uSea2, [WV.dot, WV.steep, ssBlend(SSL.n), ssBlend(SSL.w)]); gl.uniform4fv(u.uLocal, WV.loc);
    for (const L of [SSL.n, SSL.w]){ gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.on ? L.tex : SSDUMMY); gl.uniform1i(L === SSL.n ? u.uSSTn : u.uSSTw, L.unit); gl.uniform4fv(L === SSL.n ? u.uSSN : u.uSSW, L.on ? [L.rect[0] - RO.x, L.rect[1] - RO.z, 1 / L.rect[2], 1] : [0, 0, 1, 0]); }
    gl.activeTexture(gl.TEXTURE0);
    // the waves' phases and their groups' phases at the render origin (doubles, then wrapped), so the shaders work near zero
    const ub = WV.ub.slice(), gp = new Float32Array(13), TAU = 2 * Math.PI;
    for (let i = 0; i < 13; i++){ const c = WV.list[i]; if (!c) continue; const a = c.Dx * RO.x + c.Dz * RO.z, g = c.Dz * RO.x - c.Dx * RO.z;
      ub[i * 4 + 2] = (c.ph + c.k * a) % TAU; gp[i] = (i * 2.59 + c.k * (0.083 * a + 0.041 * g)) % TAU; }
    gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, ub); gl.uniform1fv(u.uGp, gp); if (u.uFWa){ gl.uniform4fv(u.uFWa, WV.ua); gl.uniform4fv(u.uFWb, ub); gl.uniform1fv(u.uFGp, gp); } plSet(u);
    if (u.uNFp){ gl.uniform1fv(u.uNFp, NF.ph); gl.uniform1fv(u.uNFg, NF.gp); } if (u.uFNFp){ gl.uniform1fv(u.uFNFp, NF.ph); gl.uniform1fv(u.uFNFg, NF.gp); } if (u.uNFD) gl.uniform2f(u.uNFD, NF.D[0], NF.D[1]);
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uDeep, [0.035, 0.14, 0.18]); gl.uniform1f(u.uWind, env.wind); gl.uniform2fv(u.uWindDir, env.windDir); gl.uniform1f(u.uSpec, env.spec);
    gl.uniform1f(u.uLSOn, LMTEX && LMON && LRECT ? 1 : 0); if (LMTEX && LMON && LRECT){ gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLandS, 6); gl.activeTexture(gl.TEXTURE0); gl.uniform4fv(u.uLRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]); }
    gl.uniform1f(u.uSOn, STEX ? 1 : 0); gl.uniform1f(u.uHOn, HTEX ? 1 : 0); gl.uniform1f(u.uTideL, env.tide || 0); if (HTEX){ gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.uniform1i(u.uHgt, 3); gl.activeTexture(gl.TEXTURE0); } if (STEX) gl.uniform4fv(u.uSRect, [SRECT[0] - eye[0], SRECT[1] - eye[2], SRECT[2], SRECT[3]]);
    gl.disableVertexAttribArray(1);
    if (far){
      // flat sea: the whole map less the near terrain for the far pass; in the near pass the near terrain's square (or around the camera)
      // less the wave patch around the boat
      const y = -eye[1] - (drop || 0) + (env.tide || 0);
      if (drop === undefined){ const ox = TERR ? TERR.cx : bv.x, oz = TERR ? TERR.cz : bv.z, sc = TERRW.span / 2 + 40000;
        seaRing(u, eye, y, [ox - sc, oz - sc, ox + sc, oz + sc], NEARM ? [NEARM.x0, NEARM.z0, NEARM.x0 + NEARM.sx, NEARM.z0 + NEARM.sz] : null); }
      else {
        let R; if (NEARM) R = [NEARM.x0 - 20, NEARM.z0 - 20, NEARM.x0 + NEARM.sx + 20, NEARM.z0 + NEARM.sz + 20];
        else { const ox = Math.round(eye[0] / 100) * 100, oz = Math.round(eye[2] / 100) * 100, sc = far * 1.15; R = [ox - sc, oz - sc, ox + sc, oz + sc]; }
        const st = 2 * HALF / NP, px = Math.round(bv.x / st) * st, pz = Math.round(bv.z / st) * st, hh = HALF * 0.97;
        seaRing(u, eye, y, R, [px - hh, pz - hh, px + hh, pz + hh]);
      }
    } else {
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step;
      gl.uniform2fv(u.uScale, [1, 1]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], -eye[1] + (env.tide || 0), oz - eye[2]]);
      attr(0, PATCH.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PATCH.ib); gl.drawElements(gl.TRIANGLES, PATCH.n, PATCH.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    }
  }

  // ---------- setup ----------
  // What stopped the 3D view, shown with the message so a device it fails on tells why (the user's phone 04.10.2026: «3D-visning
  // støttes ikke» with no more to go on): the step and the error, or the shader's log
  let failWhy = '', stage = '', GPU = '', glWatch = false;
  // How heavy a sea this device has managed, kept on the device (dsb_sea): 0 the full sea, 1 the far pass's simpler sea for both passes
  // (no sea-state texture in the vertex shader, four wind waves, no ripples), 2 the flat basic sea. On a PC the shaders are compiled by
  // Direct3D's compiler when they are linked, and the full sea can take it so long that the browser restarts the GPU and the page loses
  // its context (Intel Iris Xe, Chrome on Windows, 05.10.2026: «sjø link: ingen logg», then every later try failed and «WebGL-konteksten
  // ble mistet»). A context lost while the shaders are made sets the next level for the next try (the restored context, or a reload);
  // Intel on Direct3D starts at 1. #sealvl=N in the address forces one (the tests).
  // Every Direct3D 11 so far has lost it on the full sea, whatever the maker (Intel Iris Xe in Chrome, NVIDIA GTX 980 in Firefox,
  // 05.10.2026), so Direct3D starts at 1. And as the driver may take the whole GPU process with it before the browser says the context
  // is lost (Firefox: every compile after it fails with no log, isContextLost still false), the level being tried is written down first
  // (SEA_TRY) and cleared when it has worked: a try that never came back puts the next load a level down.
  const SEA_KEY = 'dsb_sea', SEA_TRY = 'dsb_sea_try'; let seaLvl = 0, seaBumped = false;
  const seaLvlGet = () => { const m = /sealvl=(\d)/.exec(location.hash); if (m) return Math.min(2, +m[1]); let v = 0, t = null;
    try { v = +localStorage.getItem(SEA_KEY) || 0; t = localStorage.getItem(SEA_TRY); } catch (e){}
    if (t !== null && +t + 1 > v){ v = Math.min(2, +t + 1); seaBumped = true; try { localStorage.setItem(SEA_KEY, String(v)); } catch (e){} }
    return Math.min(2, /Direct3D/i.test(GPU) ? Math.max(v, 1) : v); };
  // the sea program that linked on this device when the full one did not, for this version of the sea's shaders (SEA_VER: change it
  // when they change, so every device tries the full sea again); #sealite in the address forces the lite one (the tests)
  const SEA_OK = 'dsb_sea_ok', SEA_VER = 'u1';
  const seaOkGet = () => { if (/sealite/.test(location.hash)) return 'true,true,true'; if (/sealvl=/.test(location.hash)) return null;
    try { const v = localStorage.getItem(SEA_OK) || ''; return v.startsWith(SEA_VER + ':') ? v.slice(SEA_VER.length + 1) : null; } catch (e){ return null; } };
  const seaOkSet = v => { if (/sealvl=|sealite/.test(location.hash)) return; try { if (v) localStorage.setItem(SEA_OK, SEA_VER + ':' + v); else localStorage.removeItem(SEA_OK); } catch (e){} };
  const seaTryMark = on => { if (/sealvl=/.test(location.hash)) return; try { if (on) localStorage.setItem(SEA_TRY, String(seaLvl)); else localStorage.removeItem(SEA_TRY); } catch (e){} };
  // after a compile or link that failed with no word why: a moment for the browser to notice a lost context, before trying the next
  const glSettle = async () => { await new Promise(r => setTimeout(r, 80)); if (gl.isContextLost()) throw new Error('konteksten er mistet'); };
  const opt = (nm, f) => { try { f(); } catch (e){ console.error(nm, e); } };    // a part the view can do without
  async function init(){
    if (ready) return true; if (failed) return false;
    try {
      stage = 'webgl';
      // the settings the view wants, then plainer ones: some PCs (Adrian, 04.10.2026) give no context with antialiasing or the
      // high-performance GPU asked for, and do with neither
      const ctxTry = o => { try { return canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o); } catch (e){ return null; } };
      gl = ctxTry({antialias:true, alpha:false, powerPreference:'high-performance'}) || ctxTry({antialias:false, alpha:false}) || ctxTry({alpha:false, failIfMajorPerformanceCaveat:false}) || ctxTry(undefined);
      // none at all: the browser has 3D off for the page, most often after the driver gave up here once (Chrome keeps it off until it is
      // closed and opened again), or for the machine
      if (!gl) throw new Error(S.lang === 'en' ? 'no WebGL context (the browser has turned 3D off, often after a driver error: close the browser fully and open it again)' : 'ingen WebGL-kontekst (nettleseren har slått av 3D, ofte etter en driverfeil: lukk nettleseren helt og åpne den igjen)');
      { const dbg = gl.getExtension('WEBGL_debug_renderer_info'); GPU = String((dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '').slice(0, 80); }
      // what lives on the GPU and whether the page was out of sight, for the log when the context is lost in play (#171, a phone that
      // loses it 11-17 minutes in): the buffers and textures made and not deleted, counted where the view makes them (rare calls only)
      if (!gl.__n){ gl.__n = true; GLN.b = 0; GLN.t = 0; GLN.t0 = performance.now();
        const cb = gl.createBuffer.bind(gl), db = gl.deleteBuffer.bind(gl), ct = gl.createTexture.bind(gl), dtx = gl.deleteTexture.bind(gl);
        gl.createBuffer = () => { GLN.b++; return cb(); }; gl.deleteBuffer = x => { if (x) GLN.b--; return db(x); };
        gl.createTexture = () => { GLN.t++; return ct(); }; gl.deleteTexture = x => { if (x) GLN.t--; return dtx(x); };
        document.addEventListener('visibilitychange', () => { if (document.hidden) GLN.hid = Date.now(); else GLN.vis = Date.now(); }); }
      if (!glWatch){
        // a lost context: the view stops; lost before it was ready (a phone short of memory, or a GPU process that restarted), it
        // starts again when the browser gives the context back
        glWatch = true; let wasReady = false;
        canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); wasReady = ready; ready = false; failed = true; show(false);
          if (!wasReady && stage === 'shadere' && seaLvl < 2){ try { localStorage.setItem(SEA_KEY, String(seaLvl + 1)); } catch (e2){}
            failWhy = S.lang === 'en' ? 'the graphics driver gave up while starting. Reload the page and the game tries a simpler sea' : 'grafikkdriveren ga opp under oppstarten. Last siden på nytt, så prøver spillet en enklere sjø';
            if (typeof cloudErr === 'function') cloudErr('3D konteksten mistet i shaderne, sjønivå ' + seaLvl + ' → ' + (seaLvl + 1) + ' · ' + GPU, 'view3d init', ''); }
          else { failWhy = 'WebGL-konteksten ble mistet'; if (wasReady && typeof cloudErr === 'function') cloudErr('3D konteksten mistet under spill · ' + GPU + ' · ' + glDiag(), 'view3d', ''); } });
        // lost in play, every buffer, texture and program is gone with it: the game saves and loads the page again, which builds them
        // anew, at most once in ten minutes (sessionStorage), so a driver that keeps failing does not reload the page over and over
        canvas.addEventListener('webglcontextrestored', () => { if (!wasReady){ failed = false; failWhy = ''; show(true); return; }
          let last = 0; try { last = +sessionStorage.getItem('dsb_gl_reload') || 0; } catch (e){}
          if (Date.now() - last > 600000){ try { sessionStorage.setItem('dsb_gl_reload', String(Date.now())); } catch (e){}
            toast(S.lang === 'en' ? 'The 3D view was lost. The game is saved and loads again …' : '3D-visningen ble borte. Spillet lagres og lastes på nytt …');
            if (typeof save === 'function') save(); setTimeout(() => location.reload(), 1500); return; }
          toast(S.lang === 'en' ? 'The 3D view was lost. Reload the page to get it back.' : '3D-visningen ble borte. Last siden på nytt for å få den tilbake.'); });
      }
      if (gl.isContextLost()){ stage = 'webgl'; throw new Error('konteksten er mistet (venter på at nettleseren gir den tilbake)'); }
      if (!gl.getExtension('OES_standard_derivatives')) throw new Error('mangler OES_standard_derivatives');
      UINT = !!gl.getExtension('OES_element_index_uint'); qualSet();   // 32-bit indices: the ultra level's big meshes
      stage = 'shadere';
      PL = program(LIT_VS, LIT_FS, ['aPos', 'aCol'], 'lit'); PT = program(TER_VS, terFS(0), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat'], 'terreng'); PTS = [PT, null, null]; PRGN = program(LITN_VS, LITN_FS, ['aPos', 'aNor', 'aCol'], 'modell'); PRGX = program(TEX_VS, TEX_FS, ['aPos', 'aUV'], 'tekstur'); PRGW = program(WK_VS, WK_FS, ['aPos', 'aW', 'aS'], 'kjølvann');
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; // the waves read the sea-state texture in the vertex shader where the GPU can (#novtf in the address tries without)
      SST_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 2 && !/novtf/.test(location.hash);
      // The sea is the heaviest program, and a phone's driver may refuse to link it with no word why (Adreno 642L, 05.10.2026: «sjø link:
      // ingen logg fra driveren»): then it tries without the texture in the vertex shader, then with the far pass's simpler waves, and
      // tells the cloud which one it took
      seaLvl = seaLvlGet(); seaTryMark(true);
      if (seaBumped && typeof cloudErr === 'function') cloudErr('3D sjønivå ' + seaLvl + ' etter et forsøk som ikke kom tilbake · ' + GPU, 'view3d init', '');
      // [no texture in the vertex shader, the far pass's waves, the lite vertex shader]; the one that worked on this device last time with
      // these shaders (SEA_OK) is where it starts, so a phone does not link the ones its driver refused at every start
      let seaTry = (seaLvl >= 2 ? [] : seaLvl === 1 ? [[true, true, false], [true, true, true]] : [[!SST_VS, false, false], [true, false, false], [true, true, false], [true, true, true]])
        .filter((t, i, a) => a.findIndex(u => u.join() === t.join()) === i);
      const seaWhy = [], seaOk = seaOkGet(); let seaKnown = false;
      if (seaOk === 'basic') { seaTry = []; seaKnown = true; } else if (seaOk){ const k = seaTry.findIndex(t => t.join() === seaOk); if (k > 0){ seaTry = seaTry.slice(k); seaKnown = true; } }
      PS = null;
      for (const [nosst, far, lite] of seaTry){
        try { PS = program((nosst ? '#define NOSST\n' : '') + (lite ? SEA_VS_LITE : SEA_VS), SEAF((far ? '#define FAR\n' : '') + SEA_FS), ['aXZ'], 'sjø'); SST_VS = !nosst; PS.far = far; PS.lite = lite;
          if (seaWhy.length || seaKnown) seaOkSet([nosst, far, lite].join()); else seaOkSet(null); break; }
        catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); if (/ingen logg/.test(e.message)) await glSettle(); }
      }
      let seaDiag = '';
      if (!PS && seaLvl < 2 && !seaKnown){
        // which half the driver will not take, for the report: the sea's vertex shader with a plain fragment shader, and the other way round
        const tryLink = (vs, fs) => { try { program(vs, fs, ['aXZ'], 'prøve'); return 'ok'; } catch (e){ return 'feil'; } };
        seaDiag = ' · VS alene ' + tryLink('#define NOSST\n' + SEA_VS, 'precision highp float;varying vec3 vW;varying vec2 vXZ;void main(){gl_FragColor=vec4(fract(vW*0.01)+vec3(fract(vXZ*0.01),0.0),1.0);}') +
          ', FS alene ' + tryLink(BASIC_VS, SEAF('#define FAR\n' + SEA_FS));
        try { PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; seaDiag += ', enkel sjø ok'; seaOkSet('basic'); }
        catch (e){ throw new Error(seaWhy.join(' / ') + seaDiag); }
      }
      if (!PS){ PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; }
      try { PSF = PS.basic || PS.far ? PS : program('#define NOSST\n' + SEA_VS, SEAF('#define FAR\n' + SEA_FS), ['aXZ'], 'sjø langt'); }
      catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); PSF = PS; }
      await glSettle(); seaTryMark(false);   // the sea came through and the context is still there
      if (seaWhy.length && typeof cloudErr === 'function') cloudErr('3D sjø med reserve (' + (SST_VS ? 'vtf' : 'novtf') + (PSF === PS ? ', én sjø' : '') + (PS.lite ? ', lett' : '') + seaDiag + ') · ' + GPU, 'view3d init', seaWhy.join('\n'));
      SSDUMMY = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, SSDUMMY); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); PK = program(SKY_VS, SKY_FS, ['aP'], 'himmel'); PP = program(PT_VS, PT_FS, ['aPos', 'aA'], 'punkter');
      DYNP = buf(new Float32Array(4000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); DYNA = buf(new Float32Array(4000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      // the ground's heights and the forest (map/, the view packs): until they are in, the land is a flat stand-in
      HG = true;   // the ground comes in packs round the boat as it goes (stream3d); until a pack is in, its land is a stand-in
      stage = 'bygg'; try { BLD = await loadBuildings(); } catch (e){ console.error(e); BLD = null; }
      for (const [nm, f] of [['terreng', buildTerrain], ['kai', buildStatics], ['båt', buildBoat], ['skiff', buildSkiff], ['flagg', buildFlag], ['sjø', buildSea]]){ stage = nm; f(); }
      opt('wild', buildWild); opt('npc', buildNPC); opt('air', buildAir); opt('rescue', buildRescue);
      for (const [nm, f] of [['havn', buildHarbourFittings], ['fortøying', buildMooring], ['mottak', buildPlants], ['folk', buildPlantParts], ['bunkers', buildBunkers]]){ stage = nm; f(); }
      buildLabels();
      ready = true; return true;
    } catch (e){
      console.error(e); failed = true; failWhy = stage + ': ' + String(e && e.message || e).replace(/\s+/g, ' ').slice(0, 160) + (GPU ? ' · ' + GPU : '');
      // to the cloud's error log with the GPU and its limits, so a phone it fails on can be looked into
      if (typeof cloudErr === 'function'){ let lim = ''; try { lim = ['MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS'].map(k => k.replace('MAX_', '').toLowerCase() + '=' + gl.getParameter(gl[k])).join(' '); } catch (e2){} cloudErr('3D ' + failWhy, 'view3d init', lim + '\n' + String(e && e.stack || '')); }
      return false;
    }
  }
  // the crew's words over their heads (Jonas 08.10.2026, tilbakemelding #44: «kommentarer fra mannskap burde komme opp som flytende tekst
  // over hodet ... La gjerne også kommentaren henge 10 sekunder»): the line stands over the one who says it for SAYMS, fading in and out
  // the anchor alarm on screen (G3.anchorAlarm, from hooks.onAnchorAlarm): a red banner for a few seconds, and the masthead light flashing red
  const ANCHAL = {until:0, kind:'', el:null, drawn:0};
  function anchorAlarm3d(kind){ ANCHAL.until = performance.now() + 9000; ANCHAL.kind = kind; }
  const SAYMS = 10000, SAY = {c:null, w:null, b:null, txt:'', t0:0, a:null, el:null};
  // another player's boat says a hail (ui/10n-hail.js): over her, followed as she moves
  function sayBoat(id, txt){ if (!active) return false; SAY.c = SAY.w = null; SAY.b = id; SAY.txt = txt; SAY.t0 = performance.now(); return true; }
  // a hand at the plant (core/09d-folk.js plantSay): over his head when the plant is the one near the eye, else false (the caller toasts it)
  function sayWorker(pid, idx, nm, no, en){ if (!active) return false; const P = PLANTS.find(q => q.id === pid); if (!P) return false; SAY.c = SAY.b = null; SAY.w = {pid, idx}; SAY.txt = nm + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  // a moment on deck for a crew member at his place (14-crewlife.js crewSlip through hooks.onCrewFx): 'slip' (a fish over the side, at the
  // rail nearest him) or 'cut' (the hand shaken; the tape after is drawn from c.cut)
  const CFX = new Map();
  function crewFx3d(c, kind, o){ if (!active || !c || typeof CREW3D === 'undefined' || !CREW3D.on()) return false; const a = CREW3D.anchorOf(c.id); if (!a || a.mode !== 'at') return false;
    CFX.set(a.id, {kind, t0:performance.now() / 1000, sp:(o && o.sp) || 'torsk', kg:(o && o.kg) || 3, rail:kind === 'slip' ? CREW3D.railNear(a) : null}); DKN[kind] = (DKN[kind] || 0) + 1; return true; }
  function say3d(c, no, en){ if (!active || !c) return false; SAY.w = SAY.b = null; SAY.c = c; SAY.txt = c.name.split(' ')[0] + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  let labelEls = [];
  // (the harbours' names floating over the 3D view are gone, Jonas 13.10.2026: «Fjernes teksten for stedsnavn som flyter i luften»; the
  // layer stays for the crew's lines and the anchor alarm)
  function buildLabels(){ labelsEl.innerHTML = ''; labelEls = []; }
  function resize(){
    const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, QUAL.dpr[QUAL.lvl]);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  }

  // ---------- wildlife ----------
  function bodyLoft(m, L, R, prof, col, belly, y0){
    const NS = 12, NA = 8, ring = s => { const r = R * prof(s), z = -L / 2 + s * L; return Array.from({length:NA}, (_, k) => { const a = k / NA * Math.PI * 2; return [Math.sin(a) * r, (y0 || 0) + Math.cos(a) * r * 0.85, z]; }); };
    for (let i = 0; i < NS; i++){ const A = ring(i / NS), B2 = ring((i + 1) / NS); for (let k = 0; k < NA; k++){ const k2 = (k + 1) % NA, lowr = k >= 2 && k <= 5; m.quad(A[k], A[k2], B2[k2], B2[k], lowr && belly ? belly : col); } }
  }
  function buildWild(){
    const W = {};
    let m = MB(); m.box(0, -0.05, 0, 0.12, 0.11, 0.42, [0.95, 0.95, 0.94], 0); m.box(0, -0.02, -0.26, 0.09, 0.09, 0.1, [0.97, 0.97, 0.96], 0); m.box(0, -0.01, -0.33, 0.03, 0.03, 0.06, [0.95, 0.75, 0.2], 0); m.box(0, -0.04, 0.24, 0.14, 0.03, 0.12, [0.85, 0.86, 0.87], 0); W.gull = m.mesh();
    const wing = sx => { const w = MB(), g = [0.62, 0.66, 0.7], k = [0.1, 0.1, 0.1]; w.quad([0.05 * sx, 0, -0.1], [0.5 * sx, 0, -0.05], [0.5 * sx, 0, 0.1], [0.05 * sx, 0, 0.12], g); w.quad([0.5 * sx, 0, -0.05], [0.72 * sx, 0, 0], [0.72 * sx, 0, 0.07], [0.5 * sx, 0, 0.1], k); return w.mesh(); };
    W.wingR = wing(1); W.wingL = wing(-1);
    // the gulls from Blender (tools/wild/maake.py, the user's wish 03.10.2026): a herring gull, and a great black-backed gull from the
    // same parts with the mantle and the upper wing (zone 1) painted black-grey; the wings beat at the shoulder and the wrist
    if (typeof glbHas === 'function' && glbHas('gull')){
      const G = glbLoad('gull'), ex = (G && G.ex) || {}, mk = (nm, zc) => { const o = glbPart('gull', nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++){ const z = zc && o.zone[i] === 1; for (let k = 0; k < 3; k++) c[i * 3 + k] = z ? zc[k] * (o.ao[i] || 1) : o.c[i * 4 + k]; }
        return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
      if (ex.shoulder && ex.wrist){
        W.G = {sh:ex.shoulder, wr:ex.wrist};
        for (const [k, zc] of [['gullG', null], ['gullB', [0.16, 0.17, 0.19]]]) W[k] = {body:mk('body', zc), armR:mk('armR', zc), handR:mk('handR', zc), armL:mk('armL', zc), handL:mk('handL', zc)};
      }
    }
    const prof = s => Math.sin(Math.min(1, s * 1.15) * Math.PI) ** 0.6 * (s > 0.85 ? 1 - (s - 0.85) * 4 : 1) + 0.05;
    m = MB(); bodyLoft(m, 1.7, 0.28, prof, [0.2, 0.22, 0.25], [0.55, 0.57, 0.6]); m.tri([0, 0.2, -0.02], [0, 0.45, 0.14], [0, 0.2, 0.28], [0.18, 0.2, 0.22]); W.porpoise = m.mesh();
    m = MB(); bodyLoft(m, 7, 0.95, prof, [0.05, 0.05, 0.06], [0.92, 0.92, 0.9]); m.tri([0, 0.75, -0.5], [0, 2.4, 0.35], [0, 0.75, 0.6], [0.05, 0.05, 0.06]); m.box(0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); m.box(-0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); W.orca = m.mesh();
    m = MB(); bodyLoft(m, 13, 1.6, prof, [0.13, 0.14, 0.16], [0.4, 0.42, 0.45]); m.tri([0, 1.3, 1.6], [0, 1.75, 2.3], [0, 1.3, 2.7], [0.13, 0.14, 0.16]); W.humpback = m.mesh();
    m = MB(); const d = [0.13, 0.14, 0.16], wht = [0.85, 0.85, 0.83];
    m.tri([0, 0, 0], [-2.3, 0, 1.1], [-0.4, 0, 1.3], wht); m.tri([0, 0, 0], [2.3, 0, 1.1], [0.4, 0, 1.3], wht); m.tri([0, 0.02, 0], [-0.4, 0.02, 1.3], [0.4, 0.02, 1.3], d); m.box(0, -0.3, -1.4, 0.5, 0.6, 2.6, d, 0); W.fluke = m.mesh();
    WILDM = W;
  }
  const GULLS = Array.from({length:6}, (_, i) => ({ph:i * 1.13, r:9 + i * 3.2, w:0.32 + (i % 3) * 0.1, h:6 + (i * 2.3) % 8, dir:i % 2 ? 1 : -1, blk:i % 3 === 1}));
  const WILD = {ev:[], next:8};
  const SPEC = {porpoise:{T:1.3, I:4.5, K:4, v:2.4, sp:4, n:[1, 3], r:0.28}, orca:{T:2.2, I:7, K:4, v:3, sp:9, n:[3, 5], r:0.95}, humpback:{T:3.6, I:14, K:4, v:1.4, sp:14, n:[1, 2], r:1.6}};
  function wildSpawn(t){
    if (t < WILD.next) return; WILD.next = t + 16 + Math.random() * 28;
    if (S.boat.status === 'port' || WV.hs > 1.6) return;
    const p = {x:bv.x / 1000, y:bv.z / 1000}, dd = depthF(p), mo = gDate(S.t / 60).getUTCMonth(), winter = (mo >= 10 || mo <= 1) ? 1 : (mo === 2 || mo === 9) ? 0.35 : 0.08;
    let type = null; const r = Math.random();
    if (dd > 40 && r < 0.4 * winter) type = Math.random() < 0.55 ? 'orca' : 'humpback'; else if (dd > 6 && r < 0.7) type = 'porpoise';
    if (!type) return;
    const a = Math.random() * Math.PI * 2, dm = type === 'porpoise' ? 45 + Math.random() * 90 : 160 + Math.random() * 260, x = bv.x + Math.sin(a) * dm, z = bv.z - Math.cos(a) * dm;
    if (isLand({x:x / 1000, y:z / 1000}) || depthF({x:x / 1000, y:z / 1000}) < 5) return;
    const sp = SPEC[type], n = sp.n[0] + Math.floor(Math.random() * (sp.n[1] - sp.n[0] + 1));
    WILD.ev.push({type, t0:t, x, z, hd:Math.random() * Math.PI * 2, n, blown:{}});
    if (WILD.ev.length > 4) WILD.ev.shift();
  }
  const BLOW = {x:new Float64Array(160), y:new Float64Array(160), z:new Float64Array(160), vx:new Float64Array(160), vy:new Float64Array(160), vz:new Float64Array(160), age:new Float64Array(160).fill(99), life:new Float64Array(160).fill(1), n:0};
  function blow(x, y, z){ for (let i = 0; i < 26; i++){ const k = BLOW.n = (BLOW.n + 1) % 160; BLOW.x[k] = x; BLOW.y[k] = y; BLOW.z[k] = z; BLOW.vx[k] = (Math.random() - 0.5) * 1.2 + env.windDir[0] * 1.5; BLOW.vz[k] = (Math.random() - 0.5) * 1.2 + env.windDir[1] * 1.5; BLOW.vy[k] = 3 + Math.random() * 4.5; BLOW.age[k] = 0; BLOW.life[k] = 1.6 + Math.random() * 1.4; } }
  function drawWild(eye, t, dt, M0){
    if (!WILDM) return;
    const night = env.night > 0.85;
    // gulls follow the boat in daylight
    if (!night && !cam.helm || !night && cam.helm){
      const st = S.boat.status, gut = (DECKACT.on && DECKACT.task === 'gut' && DECKACT.pt) || DKGULL, n = gut ? 6 : st === 'port' ? 3 : st === 'fishing' ? 6 : 4, fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
      for (let i = 0; i < n; i++){
        const g = GULLS[i], ang = t * g.w * g.dir + g.ph, cx = bv.x - fx * 8, cz = bv.z - fz * 8;
        let x = cx + Math.cos(ang) * g.r, z = cz + Math.sin(ang) * g.r, y = bv.y + (st === 'fishing' ? 2.5 + g.h * 0.4 : g.h) + Math.sin(t * 0.7 + g.ph) * 1.2;
        if (gut && i < 4){ const q = (t * 0.22 + i * 0.27) % 1; if (q < 0.35){ const k = Math.sin(q / 0.35 * Math.PI), P0 = gut; x += (P0[0] + Math.cos(i * 2.1) * 1.2 - x) * k; z += (P0[2] + Math.sin(i * 2.1) * 1.2 - z) * k; y += (P0[1] + 0.25 - y) * k; } }
        const vx = -Math.sin(ang) * g.dir, vz = Math.cos(ang) * g.dir, hd = Math.atan2(vx, -vz);
        // a few beats, then a glide (more beats and faster when it goes down for the offal)
        const diving = gut && i < 4, beating = diving || Math.sin(t * 0.5 + g.ph * 3) > 0.35, flap = beating ? Math.sin(t * 9 + g.ph) * 0.6 : 0.1 + Math.sin(t * 1.3 + g.ph) * 0.05;
        const ph = t * (diving ? 21 : 15.7) + g.ph * 7, pw = ph + 0.3 * Math.sin(ph);   // the downstroke quicker than the upstroke
        if (beating) y -= 0.05 * Math.sin(pw);   // the body rises as the wings come down
        const Mb = model(x - eye[0], y - eye[1], z - eye[2], -hd, beating ? 0.04 * Math.cos(pw) : 0, -g.dir * 0.35);
        if (WILDM.G){
          // two in six are great black-backed gulls, a little larger; the beat about 2.5 a second, the hand a little after the arm (the
          // whip of a real wing beat); gliding, the arms raised a little and the hands drooped (a gull's shallow M)
          const K = g.blk ? WILDM.gullB : WILDM.gullG, Ms = g.blk ? mul(Mb, M4.S(1.15)) : Mb, S0 = WILDM.G.sh, W0 = WILDM.G.wr, amp = diving ? 0.7 : 0.55;
          const a1 = beating ? 0.1 + amp * Math.sin(pw) : 0.08 + Math.sin(t * 1.3 + g.ph) * 0.04, a2 = beating ? 0.45 * Math.sin(pw - 0.8) : -0.16 + Math.sin(t * 1.1 + g.ph) * 0.03 + 0.05 * Math.sin(t * 0.37 + g.ph * 2);
          drawLit(K.body, Ms);
          for (const sd of [1, -1]){
            const Ma = chain(Ms, M4.T(S0[0] * sd, S0[1], S0[2]), M4.RZ(a1 * sd)); drawLit(sd > 0 ? K.armR : K.armL, Ma);
            drawLit(sd > 0 ? K.handR : K.handL, chain(Ma, M4.T((W0[0] - S0[0]) * sd, W0[1] - S0[1], W0[2] - S0[2]), M4.RZ(a2 * sd)));
          }
        }
        else { drawLit(WILDM.gull, Mb); drawLit(WILDM.wingR, mul(Mb, model(0, 0, 0, 0, 0, flap))); drawLit(WILDM.wingL, mul(Mb, model(0, 0, 0, 0, 0, -flap))); }
      }
    }
    // porpoises and whales surfacing
    for (let e = WILD.ev.length - 1; e >= 0; e--){
      const ev = WILD.ev[e], sp = SPEC[ev.type], age = t - ev.t0;
      if (age > sp.K * sp.I + (ev.type === 'humpback' ? 8 : 3)){ WILD.ev.splice(e, 1); continue; }
      const dx = Math.sin(ev.hd), dz = -Math.cos(ev.hd), px = -dz, pz = dx;
      for (let j = 0; j < ev.n; j++){
        const off = (j - (ev.n - 1) / 2) * sp.sp, lag = j * 0.7;
        for (let k = 0; k < sp.K; k++){
          const lt = age - k * sp.I - lag, T = sp.T; if (lt < 0 || lt > T + (ev.type === 'humpback' && k === sp.K - 1 ? 4 : 0)) continue;
          const along = sp.v * (age - lag), x = ev.x + dx * along + px * off, z = ev.z + dz * along + pz * off;
          if (Math.hypot(x - eye[0], z - eye[2]) > 2500) continue;
          const key = j * 10 + k;
          if (ev.type === 'humpback' && !ev.blown[key] && lt > 0.1){ ev.blown[key] = 1; blow(x + dx * 4.5, 0.6, z + dz * 4.5); }
          if (ev.type === 'orca' && !ev.blown[key] && lt > 0.3){ ev.blown[key] = 1; blow(x + dx * 2.5, 0.3, z + dz * 2.5); }
          const u = Math.min(1, lt / T), y = -sp.r * 1.25 + Math.sin(Math.PI * u) * (sp.r * 1.3 + 0.12), pitch = Math.cos(Math.PI * u) * 0.35;
          if (u < 1) drawLit(WILDM[ev.type], model(x - eye[0], y - eye[1], z - eye[2], -ev.hd, pitch, 0));
          if (ev.type === 'humpback' && k === sp.K - 1 && lt > T * 0.55){
            const f = Math.min(1, (lt - T * 0.55) / 1.5) * (lt > T + 2.5 ? Math.max(0, 1 - (lt - T - 2.5) / 1.5) : 1);
            drawLit(WILDM.fluke, model(x - dx * 5.5 - eye[0], -2.6 + f * 3.6 - eye[1], z - dz * 5.5 - eye[2], -ev.hd, -1.35 * f, 0));
          }
        }
      }
    }
  }
  function drawBlows(VP, eye, dt){
    let n = 0;
    for (let i = 0; i < 160; i++){
      if (BLOW.age[i] >= BLOW.life[i]) continue;
      BLOW.age[i] += dt; BLOW.vy[i] -= 2.2 * dt; BLOW.x[i] += BLOW.vx[i] * dt; BLOW.y[i] += BLOW.vy[i] * dt; BLOW.z[i] += BLOW.vz[i] * dt;
      PB[n * 3] = BLOW.x[i] - eye[0]; PB[n * 3 + 1] = BLOW.y[i] - eye[1]; PB[n * 3 + 2] = BLOW.z[i] - eye[2]; PA[n] = Math.max(0, 1 - BLOW.age[i] / BLOW.life[i]) * 0.55; n++;
    }
    if (n){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); const c = Math.min(1, env.amb[0] * 1.3 + env.sunCol[0] * 0.8); drawPts(n, gl.POINTS, VP, [c, c, Math.min(1, c * 1.03)], 1600, true); gl.depthMask(true); gl.disable(gl.BLEND); }
  }

  // ---------- other vessels ----------
  function shipHull(m, L, B, D, F, hull, bottom, deck){
    const NS = 14, hw = s => (B / 2) * (s < 0.62 ? 0.94 + 0.06 * s / 0.62 : Math.sqrt(Math.max(0, 1 - ((s - 0.62) / 0.38) ** 2))), zs = s => L / 2 - s * L, fs = s => F + 0.25 * F * s * s;
    const prof = s => { const w = hw(s), f = fs(s), z = zs(s); return [[-w, f, z], [-w * 0.98, 0, z], [-w * 0.8, -D * 0.85, z], [0, -D, z], [w * 0.8, -D * 0.85, z], [w * 0.98, 0, z], [w, f, z]]; };
    const cols = [hull, bottom, bottom, bottom, bottom, hull];
    for (let i = 0; i < NS; i++){ const A = prof(i / NS), B2 = prof((i + 1) / NS); for (let j = 0; j < 6; j++) m.quad(A[j], A[j + 1], B2[j + 1], B2[j], cols[j]); m.quad([-hw(i / NS), fs(i / NS), zs(i / NS)], [hw(i / NS), fs(i / NS), zs(i / NS)], [hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], [-hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], deck); }
    const T = prof(0), c = [0, (F - D) / 2, L / 2]; for (let j = 0; j < 6; j++) m.tri(c, T[j], T[j + 1], hull); m.tri(c, T[6], T[0], hull);
  }
  function windows(m, x0, x1, y, z, h, col, sideX){ for (const sx of [-1, 1]) m.box(sideX * sx, y, (x0 + x1) / 2, 0.08, h, Math.abs(x1 - x0), col, 0); }
  function buildNPC(){
    const N = {}, WHT = [0.92, 0.93, 0.92], DK = [0.1, 0.12, 0.15], RB = [0.5, 0.12, 0.1];
    let m = MB(); shipHull(m, 10.5, 3.8, 1.1, 1.2, [0.88, 0.9, 0.92], RB, [0.62, 0.6, 0.55]);
    m.box(0, 1.2, 1.4, 2.4, 2.0, 2.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 2.35, 0.02, 2.46, 0.6, 0.06, DK, 0); windows(m, 0.2, 2.6, 2.35, 0, 0.6, DK, 1.23);
    m.box(0, 3.2, 0.3, 0.12, 3.2, 0.12, [0.3, 0.3, 0.3], 0); m.box(0, 1.2, -3.2, 1.6, 0.35, 1.2, [0.35, 0.37, 0.4], 0); N.sjark = m.mesh();
    m = MB(); shipHull(m, 52, 13, 2.8, 3.2, [0.12, 0.25, 0.45], RB, [0.4, 0.4, 0.42]);
    m.box(4.8, 3.2, 2, 3.2, 5.5, 34, WHT, 0); windows(m, -12, 16, 6.2, 2, 1.1, DK, 3.25 + 1.6);
    m.box(4.8, 8.7, -6, 5, 3, 6, WHT, 0, [0.3, 0.3, 0.3]); m.box(4.8, 10.2, -9.05, 5.1, 1.1, 0.1, DK, 0);
    m.box(-5.5, 3.2, 0, 1.2, 1.1, 44, [0.85, 0.85, 0.8], 0); m.box(0, 3.3, 0, 8, 0.1, 44, [0.35, 0.35, 0.36], 0); N.ferry = m.mesh();
    m = MB(); shipHull(m, 112, 19, 5.5, 6.5, [0.07, 0.07, 0.08], RB, [0.5, 0.5, 0.5]);
    m.box(0, 6.5, 6, 17.6, 14, 70, WHT, 0, [0.7, 0.72, 0.73]);
    for (let r = 0; r < 4; r++) windows(m, -26, 38, 8 + r * 3.2, 6, 1.1, DK, 8.85);
    m.box(0, 20.5, -24, 14, 3.5, 10, WHT, 0); m.box(0, 22.2, -29.1, 14.2, 1.3, 0.2, DK, 0);
    m.box(0, 20.5, 20, 3.2, 7, 5, [0.1, 0.1, 0.1], 0, [0.1, 0.1, 0.1]); m.box(0, 26.2, 20, 3.3, 1.2, 5.1, [0.7, 0.12, 0.1], 0);
    m.box(0, 20.5, -12, 0.3, 9, 0.3, [0.85, 0.85, 0.85], 0); N.coastal = m.mesh();
    m = MB(); shipHull(m, 16, 5.8, 2.4, 2.0, [0.72, 0.16, 0.12], [0.3, 0.3, 0.32], [0.55, 0.55, 0.52]);
    m.box(0, 2.0, -2.2, 3.6, 2.6, 3.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 3.9, -4.12, 3.66, 0.7, 0.06, DK, 0); windows(m, -4.0, -0.4, 3.9, -2.2, 0.7, DK, 1.83);
    m.box(0, 4.6, -1.2, 0.18, 5.5, 0.18, [0.85, 0.85, 0.85], 0); m.box(0, 2.0, 4.2, 1.2, 2.2, 1.2, [0.85, 0.7, 0.15], 0); m.box(0, 4.1, 5.2, 0.25, 0.25, 2.8, [0.85, 0.7, 0.15], 0.3);
    N.kyst = m.mesh();
    N.lights = {kyst:[[0, 10.2, -1.2, 'w'], [-1.9, 5.3, -2.2, 'r'], [1.9, 5.3, -2.2, 'g'], [0, 2.8, 7.8, 'w']], sjark:[[0, 6.4, 0.3, 'w'], [-1.25, 3.4, 0.2, 'r'], [1.25, 3.4, 0.2, 'g'], [0, 1.6, 5.3, 'w']],
      ferry:[[4.8, 13.5, -6, 'w'], [2, 11, -8, 'r'], [7.6, 11, -8, 'g'], [0, 4, 26, 'w']],
      coastal:[[0, 30, -12, 'w'], [-7.2, 23.5, -26, 'r'], [7.2, 23.5, -26, 'g'], [0, 13, 55, 'w']]};
    N.lightPx = {sjark:260};   // the small boats' lights are smaller
    NPCM = N;
  }
  const NLC = {w:[1, 0.95, 0.85], r:[1, 0.12, 0.1], g:[0.1, 1, 0.35]};
  // the player's vessels other than the skiff: meshes from the vessel kit (vessel3d.js), built the first time each type is shown
  const PVM = {}; let PERS = null;
  // a vessel's buffers by type; your own painted boat (liv, vessel3d.js hullLiv) has buffers of its own, whose colours are uploaded
  // again when the paint changes (the shape is the same), so trying colours in the paint shop builds nothing new
  function pvm(t, liv){
    const key = liv ? t + '|own' : t; let E = PVM[key];
    // a design that cuts the hull (vessel3d.js livGeo) is a new shape: the own buffers are built again
    if (E && liv && E.geoK !== livGeo(liv)){ for (const b of [E.hull.pb, E.hull.nb, E.hull.cb]) gl.deleteBuffer(b); E = PVM[key] = null; }
    if (!E){ const m = liv ? buildVesselModel(t, 1, liv) : vesselModel(t); if (!m) return null;
      const up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3});
      let cap = null; if (m.cap){ const c = MB(); for (const tr of m.cap) c.tri(tr[0], tr[1], tr[2], [0, 0, 0]); cap = c.mesh(); }
      E = PVM[key] = {hull:up(m.o), glass:up(m.glass), cap, livK:livKey(liv), geoK:livGeo(liv)}; }
    if (liv){ const k = livKey(liv); if (E.livK !== k){ E.livK = k; const m = buildVesselModel(t, 1, liv);
      if (m && m.o.c.length === E.hull.n * 4){ gl.bindBuffer(gl.ARRAY_BUFFER, E.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.o.c), gl.STATIC_DRAW); } } }
    return E;
  }
  // the people on the boats seen from outside: the own boat's skipper and crew by their looks, each local boat's by a look from her id (a dozen
  // in all), made once and kept (kind: 'skip' at the wheel, 'skipDeck' on deck, 'crew')
  const PV = {};
  function personMesh(kind, look, key){
    if (PV[key]) return PV[key];
    const ks = Object.keys(PV); if (ks.length > 160){ for (const q of ks){ const m = PV[q]; gl.deleteBuffer(m.pb); gl.deleteBuffer(m.nb); gl.deleteBuffer(m.cb); delete PV[q]; } }
    const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, kind === 'skip' ? [[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]] : null, null, look);
    return PV[key] = {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3};
  }
  const ownPerson = (kind, i) => { const l = kind === 'crew' ? lookCrew(i) : lookMe(); if (!l) return null; const key = 'o|' + kind + '|' + lookKey(l); return PV[key] || personMesh(kind, l, key); };
  // a boat of another player: her skipper's and crew's looks as she sent them (lk, ck); the local boats' from a look made from the id
  const npcPerson = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, key = 'p|' + kind + '|' + code, look = !PV[key] && lookFromKey(code); if (PV[key]) return PV[key]; if (look) return personMesh(kind, look, key); }
    const h = lookHash(String(n.id)) % 12, key = 'n|' + kind + '|' + h; return PV[key] || personMesh(kind, lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea'), key);
  };
  function people(){
    if (PERS) return PERS; const mk = (hands, suit, kit) => { const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, hands, suit, kit); return {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3}; };
    return PERS = {skip:mk([[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]], [0.93, 0.4, 0.1, 0.3], 'skipper'), skipDeck:mk(null, [0.93, 0.4, 0.1, 0.3], 'skipper'), crew:mk(null, [0.95, 0.75, 0.15, 0.3], 'crew')};
  }
  // ---------- the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  // tråling. Lag også animasjoner for utsett, og opptak av trål»): the doors hang in the gallows either side of the stern ramp and the
  // net lies on its drum. Shooting pays the net out down the ramp, codend first, lowers the doors into the sea and runs them out astern
  // on the warps; towing leaves the warps running from the blocks down into the sea; hauling brings the doors up into the gallows and
  // the net in, the codend full of fish last, up the ramp. The game does not trawl yet (that comes with the ocean step); until then
  // G3._debug.trawl('shoot' | 'tow' | 'haul') plays it, for the tests. Times in real seconds. ----------
  const TRAWL = {mode:null, t0:0, hold:null}, TRM = {}, SHOOT_S = 46, HAUL_S = 50;
  function trawlKit(t){
    if (t in TRM) return TRM[t];
    const door = upA(glbPart(t, 'door')); if (!door) return TRM[t] = null;
    const w = NB(); w.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.17, 0.18, 0.6], 6);
    const n = NB(); n.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.30, 0.20, 0.1], 8);
    return TRM[t] = {door, roll:upA(glbPart(t, 'netroll')), cod:upA(glbPart(t, 'codend')), warp:w.mesh(), net:n.mesh()};
  }
  // a frame at A whose z runs along the unit d, its y as near up as it goes
  function alongM(A, d){
    const up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]; let x = [up[1] * d[2] - up[2] * d[1], up[2] * d[0] - up[0] * d[2], up[0] * d[1] - up[1] * d[0]];
    const l = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / l); const y = [d[1] * x[2] - d[2] * x[1], d[2] * x[0] - d[0] * x[2], d[0] * x[1] - d[1] * x[0]];
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, d[0], d[1], d[2], 0, A[0], A[1], A[2], 1]);
  }
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // where things stand at a moment: the doors lowered (lo) and run out (ro), the net paid out (net), the codend along its way (cod)
  function trawlState(now){
    const u = TRAWL.hold != null ? TRAWL.hold : now - TRAWL.t0;
    if (TRAWL.mode === 'shoot' && u > SHOOT_S){ TRAWL.mode = 'tow'; TRAWL.t0 = now; }
    if (TRAWL.mode === 'haul' && u > HAUL_S + 4) TRAWL.mode = null;
    if (TRAWL.mode === 'shoot') return {lo:sstep(12, 22, u), ro:sstep(22, SHOOT_S, u), net:sstep(0, 16, u), cod:sstep(0, 16, u), full:false};
    if (TRAWL.mode === 'tow') return {lo:1, ro:1, net:1, cod:1, full:false, tow:true};
    if (TRAWL.mode === 'haul') return {lo:1 - sstep(20, 30, u), ro:1 - sstep(0, 22, u), net:1 - sstep(30, HAUL_S, u), cod:u > HAUL_S + 2 ? -1 : 1 - 0.85 * sstep(28, HAUL_S, u), full:true};
    return {lo:0, ro:0, net:0, cod:-1, full:false};
  }
  function drawTrawl(t, A, BMrel, now){
    const K = trawlKit(t); if (!K) return;
    const st = trawlState(now), at = (p, M) => drawN(p, chain(BMrel, M));
    // the net's way: off the drum, down the ramp, into the sea astern and away down; the codend's place on it by stages
    const W = [[A.drum[0], A.drum[1] - 0.9, A.drum[2] + 1.0], [A.rampTop[0], A.rampTop[1] + 0.3, A.rampTop[2]], [A.rampFoot[0], A.rampFoot[1] + 0.2, A.rampFoot[2]],
      [A.rampFoot[0], -1.5, A.rampFoot[2] + 9], [A.rampFoot[0], -12, A.rampFoot[2] + 60]], WT = [0, 0.15, 0.5, 0.7, 1];
    const way = p => { let i = 1; while (i < WT.length - 1 && WT[i] < p) i++; const k = clamp((p - WT[i - 1]) / (WT[i] - WT[i - 1]), 0, 1); return {p:lerp3(W[i - 1], W[i], k), i}; };
    if (K.roll) at(K.roll, chain(M4.T(A.drum[0], A.drum[1], A.drum[2]), new Float32Array([1, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1])));
    if (st.cod >= 0 && K.cod){
      const c = way(st.cod), c2 = way(Math.min(1, st.cod + 0.01)).p, d = [c2[0] - c.p[0], c2[1] - c.p[1], c2[2] - c.p[2]], dl = Math.hypot(d[0], d[1], d[2]);
      const dir = dl > 1e-4 ? d.map(v => v / dl) : [0, 0, 1], sw = st.full ? 1 : 0.55;
      at(K.cod, chain(alongM(c.p, dir), new Float32Array([sw, 0, 0, 0, 0, sw, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])));
      // the net from the drum to the codend
      let prev = W[0]; for (let i = 1; i < c.i; i++){ at(K.net, limbM(prev, W[i], 0.32)); prev = W[i]; } at(K.net, limbM(prev, c.p, 0.32));
    }
    for (const sg of [-1, 1]){
      const S0 = [sg * Math.abs(A.door[0]), A.door[1], A.door[2]], Wn = [sg * Math.abs(A.winch[0]), A.winch[1] + 0.7, A.winch[2]];
      at(K.warp, limbM(Wn, [S0[0], S0[1] + 0.55, S0[2] + 0.2], 0.025));            // from the winch to the block
      const D0 = [S0[0], S0[1] - 0.7, S0[2]];
      const D = [D0[0] + sg * (0.9 * st.lo + 7 * st.ro), D0[1] - (D0[1] + 0.4) * st.lo - 16 * st.ro, D0[2] + 3 * st.lo + 58 * st.ro];
      if (st.tow){ D[0] += Math.sin(now * 0.4 + sg) * 0.8; D[1] = -22; D[2] = D0[2] + 70; }
      at(K.warp, limbM([S0[0], S0[1] - 0.5, S0[2]], D, 0.025));
      if (!st.tow && st.ro < 0.35) at(K.door, chain(M4.T(D[0], D[1], D[2]), M4.RY((sg > 0 ? Math.PI : 0) - Math.PI / 2 * st.lo)));
    }
  }
  // ---------- the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  // animasjoner for begge deler»): shooting pays the seine out over the stern roller from the bin, its corks a ring on the sea round the
  // school from the stern to the starboard side; pursing hauls the purse line in through the davit's blocks; hauling brings the net in
  // through the power block and down into the bin, the ring closing in to the starboard side; then the bunt alongside, the fish
  // boiling in it and the pump's hose in. Not used by the game yet (the ocean step); G3._debug.seine(mode) plays it. Real seconds. ----------
  const SEINE = {mode:null, t0:0, hold:null}, SEINE_S = {shoot:40, purse:25, haul:45, pump:20}, SEINE_NEXT = {shoot:'purse', purse:'haul', haul:'pump', pump:null};
  function seineState(now){
    if (!SEINE.mode) return null;
    let u = SEINE.hold != null ? SEINE.hold : now - SEINE.t0;
    while (SEINE.mode && SEINE.hold == null && u > SEINE_S[SEINE.mode]){ SEINE.t0 += SEINE_S[SEINE.mode]; u -= SEINE_S[SEINE.mode]; SEINE.mode = SEINE_NEXT[SEINE.mode]; }
    return SEINE.mode ? {mode:SEINE.mode, k:clamp(u / SEINE_S[SEINE.mode], 0, 1), u} : null;
  }
  function drawSeine(t, A, BMrel, VP, now){
    const st = seineState(now); if (!st) return;
    const K = trawlKit(t); if (!K) return;
    const at = (p, M) => drawN(p, chain(BMrel, M)), R0 = 62, Rb = 9;
    // the ring in the boat's level frame (x to starboard, z aft): through the stern and the starboard side amidships, the long way round
    const S = [A.stern[0], 0, A.stern[2]], P = [A.side[0] + 1.5, 0, A.side[2]], M = [(S[0] + P[0]) / 2, 0, (S[2] + P[2]) / 2], dx = P[0] - S[0], dz = P[2] - S[2], d = Math.hypot(dx, dz);
    let nx = dz / d, nz = -dx / d; if (nx < 0){ nx = -nx; nz = -nz; }
    const h = Math.sqrt(Math.max(1, R0 * R0 - d * d / 4)), C0 = [M[0] + nx * h, 0, M[2] + nz * h];
    // the ring now: shooting it grows from the stern; hauling it shrinks to the bunt, always through the side point
    let R = R0, Cn = C0, f = 1, from = S;
    if (st.mode === 'shoot') f = sstep(0, 1, st.k);
    if (st.mode === 'haul' || st.mode === 'pump'){
      const k = st.mode === 'pump' ? 1 : sstep(0, 1, st.k), dl = Math.hypot(C0[0] - P[0], C0[2] - P[2]); R = R0 + (Rb - R0) * k;
      Cn = [P[0] + (C0[0] - P[0]) / dl * R, 0, P[2] + (C0[2] - P[2]) / dl * R]; from = P;
    }
    const aS = Math.atan2(from[2] - Cn[2], from[0] - Cn[0]), aP = Math.atan2(P[2] - Cn[2], P[0] - Cn[0]);
    let sweep = st.mode === 'shoot' || st.mode === 'purse' ? ((aP - aS) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) : 2 * Math.PI - 0.12;
    if (st.mode === 'shoot' || st.mode === 'purse'){ const mid = aS + sweep / 2, mx = Cn[0] + Math.cos(mid) * R, mz = Cn[2] + Math.sin(mid) * R; if (Math.hypot(mx - M[0], mz - M[2]) < R) sweep -= 2 * Math.PI; }
    // the net over the stern roller, the purse line, the net in through the power block, the pump hose
    if (st.mode === 'shoot'){ at(K.net, limbM(A.bin, A.stern, 0.3)); at(K.net, limbM(A.stern, [S[0], -0.5, S[2] + 1.5], 0.3)); }
    if (st.mode === 'purse') at(K.warp, limbM(A.purse, [A.purse[0] + 4, -10, A.purse[2]], 0.035));
    if (st.mode === 'haul'){ at(K.net, limbM([P[0] + 0.5, -0.3, P[2]], A.block, 0.35)); at(K.net, limbM(A.block, A.bin, 0.35)); }
    if (st.mode === 'pump') at(K.warp, limbM(A.block, [Cn[0], -0.8, Cn[2]], 0.18));
    // the corks (and the fish in the bunt) as points on the sea, in the boat's level frame
    const ex = [BMrel[0], BMrel[2]], el = Math.hypot(ex[0], ex[1]) || 1, ux = ex[0] / el, uz = ex[1] / el, T0 = [BMrel[12], BMrel[13], BMrel[14]];
    const W = (x, y, z) => [T0[0] + ux * x - uz * z, T0[1] + y, T0[2] + uz * x + ux * z];
    let n = 0; const L = Math.abs(sweep) * R * f, N = Math.min(600, Math.max(2, Math.round(L / 2.4)));
    for (let i = 0; i <= N; i++){ const a = aS + sweep * f * i / N, q = W(Cn[0] + Math.cos(a) * R, 0.12, Cn[2] + Math.sin(a) * R); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 1; n++; }
    drawPts(n, gl.POINTS, VP, [0.96, 0.46, 0.10], 520, true);
    if (st.mode === 'pump' || (st.mode === 'haul' && st.k > 0.75)){
      n = 0; for (let i = 0; i < 160; i++){ const a = hash(i) * 6.283, r = Math.sqrt(hash(i + 999)) * (R - 1.2), b = Math.abs(Math.sin(now * (3 + hash(i + 7) * 4) + i));
        const q = W(Cn[0] + Math.cos(a) * r, 0.05 + 0.35 * b, Cn[2] + Math.sin(a) * r); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 0.5 + 0.5 * b; n++; }
      drawPts(n, gl.POINTS, VP, [0.82, 0.86, 0.9], 300, true);
    }
    nSetup(VP);
  }
  // onDeck: the skipper jigs himself, so he stands at the first deck place the crew leave free (at the wheel when there is none)
  // the people aboard where the agents have them (deckcrew.js): walking, at their work, or at the wheel inside the house; in the bridge
  // view nobody is drawn at the wheel, where the eye is (the skipper, or a hand who has the helm)
  function drawDeckCrew(BMrel, eye, VP, t, G){
    nSetup(VP); let idx = 20; if (!GB) buildGear();
    const b = S.boat, d = G.deck || {y:G.gw, z:0}, gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), now = performance.now() / 1000, DW = deckWork(G), ST = CREW3D._st, V = VESSELS[vtype()] || {}, K = G.kit || {};
    dkTick(); DKGULL = null;
    const rel = q => xf(BMrel, q), A = CREW3D.visible();
    // jigging by hand without machines: the real catch (CATCHQ) comes up on the lines of those at the rail, one fish at a time each
    const machines = S.equip && S.equip.jukse > 0 && !(S.target === 'kveite' && b.kgear) && SK && SK.machG;
    if (b.status === 'fishing' && !b.gop && !b.deckStop && !machines && !window.jigActive){ const Q = catchQ();
      for (const a of A){ if (!Q.length) break; if (a.st !== 'fiske' || a.mode !== 'at' || now - (DKF.jig[a.id] || 0) < 2.4 || DKEV.some(e => (e.who === a.id || e.for === a.id) && now - e.t0 < DKDUR[e.kind] + 0.3)) continue;
        const f = Q.shift(), F0 = [Math.sin(a.h), -Math.cos(a.h)], rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; DKF.jig[a.id] = now;
        dkEvent('jigup', rl, f.sp, f.kg, {for:a.id, wait:8, Wat:[rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]}); } }
    // the fish lying on the deck where they were shaken off the hook or let fall from the net, until the bleeder takes them up
    if (SK && SK.fishM) for (const f of DKDECK) drawN(fishOf(f.sp), chain(BMrel, M4.T(f.at[0], f.at[1] + 0.05, f.at[2]), M4.RY(f.yaw), M4.RZ(Math.PI / 2), M4.S(clamp(0.42 * Math.cbrt(f.kg || 2), 0.28, 1.2))));
    // where the gutted fish go: the packer's crate on his right (a hold boat), else the open boat's tub nearest him (kit.tubs)
    const pk = A.find(a => a.st === 'is' && a.mode === 'at'), tubs = V.hold && V.hold.kind === 'dekk' ? K.tubs : null;
    const crateOf = a => { const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)];
      if (tubs && tubs.length){ let best = tubs[0], bd = 1e9; for (const q of tubs){ const dd = Math.hypot(q[0] - a.x, q[2] - a.z); if (dd < bd){ bd = dd; best = q; } } return {p:[best[0], best[1], best[2]], top:(best[4] || 460) > 300 ? 0.62 : 0.55, tub:true}; }
      return {p:[a.x + F0[0] * 0.58, a.y, a.z + F0[1] * 0.58], top:0.28, tub:false}; };
    const pkC = pk ? crateOf(pk) : null, held = spHold(x => !x.gut && !x.iced), packed = spHold(x => x.iced), table = rel(DW.table), tubTop = rel(dkTub(G)), offal = rel(DW.offal);
    for (const a of A){ if (cam.helm && (a.me || a.mode === 'helm')) continue;
      // (a place stood off its cell: leaning back, the back at the rail, deckcrew.js idlePlace)
      const go = CREW3D.walkOff(a);
      const lp = a.mode === 'helm' && G.skipperAt ? [G.skipperAt[0], G.skipperAt[1], G.skipperAt[2]] : [a.x + go[0], a.y, a.z + go[1]], wl = xf(BMrel, lp), wy = wl[1] + eye[1];
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look:a.me ? lookMe() : a.c ? lookOf(a.c) : lookCrew(0)};
      const ev = a.mode === 'at' ? dkFor(a.id, lp, a.task) : null;   // a fish to bleed or to gaff in at his place
      // a helm made for sitting (the model's eye low over the place, as under the snekke's hard top) is steered from the seat
      const sat = a.mode === 'helm' && G.eye && G.skipperAt && G.eye[1] - G.skipperAt[1] < 1.4;
      const st = {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + (a.mode === 'helm' ? 0 : a.h + (a.sqA || 0) * Math.PI / 2), task:ev ? ev.kind : sat ? 'helmsit' : a.task, seat:sat ? Math.max(0.2, G.eye[1] - G.skipperAt[1] - 0.95) : 0, ev:ev ? dkEv(ev, BMrel, G) : null, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0};
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], sg = a.x >= 0 ? 1 : -1;
      const g0 = CREW3D.holds(a), ef = a.ef == null ? 1 : a.ef, ta = a.tk != null ? a.tk : t;   // (the place still held; each one's own beat, deckcrew.js a.tk)
      st.age = a.c ? a.c.age : 45; st.deck = true; st.rail = a.mode === 'at' && g0 ? g0.rail || null : null; if (a.task === 'smoke' && b.status === 'sailing') st.lean = false;
      st.slump = clamp((0.96 - ef) * 1.6, 0, 0.35); st.tape = !!(a.c && a.c.cut && S.t < a.c.cut); if (a.put) st.put = {task:a.put.task, u:clamp(a.putU || 0, 0, 1)};
      // a moment (G3.crewFx, 14-crewlife.js crewSlip): a fish slips over the side, the knife slips and a hand is cut
      const fx = CFX.get(a.id);
      if (fx){ const age = now - fx.t0, dur = fx.kind === 'slip' ? 2.6 : 2.4;
        if (age > dur || a.mode !== 'at' || ev) CFX.delete(a.id);
        else { st.task = fx.kind; st.fx = true; if (fx.kind === 'cut') st.cutU = age / dur;
          else { st.slipU = age / dur; st.slip = fx; const r = fx.rail;
            if (r){ st.Rl = rel([a.x + r.F[0] * r.d, a.y + r.y, a.z + r.F[1] * r.d]); st.Wt = rel([a.x + r.F[0] * (r.d + 0.9), -0.1, a.z + r.F[1] * (r.d + 0.9)]);
              let dh = Math.atan2(r.F[0], -r.F[1]) - a.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
              st.h += dh * ease(Math.min(1, age / 0.3)) * (1 - ease(Math.max(0, (age / dur - 0.8) / 0.2))); } } } }
      if (a.mode === 'at' && !ev && !st.fx){
        // gutting at the table: the fish from the bleeding tub, the guts over the rail, the gutted fish to the packer
        if (a.task === 'gut'){ st.task = 'gutw'; st.Tb = table; st.Ub = tubTop; st.Of = offal; const n = Math.floor((ta + idx * 1.7) / 5.6); st.gsp = held(hash(n * 3 + idx)); st.gkg = 2 + hash(n * 5) * 3;
          if (pkC){ st.Cr = rel(pkC.p); st.crTop = pkC.top; st.packId = pk.id; } }
        else if (a.task === 'pack'){ const C = crateOf(a); st.Cr = rel(C.p); st.crTop = C.top; st.crTub = C.tub; st.fill = ST.crateFill || 0; st.csp = i => packed(hash(i * 7 + 1)); const L = DKLAY[a.id]; st.lay = L ? now - L.t : -1;
          // the ice bin on the side away from the gutter
          const gt = A.find(q => q.st === 'sloy' && q !== a); st.binR = gt && (gt.x - a.x) * R0[0] + (gt.z - a.z) * R0[1] < 0 ? 0.55 : -0.55; }
        else if (a.task === 'egn' || a.task === 'strip'){ const PLs = CREW3D.places() || {tubs:[]}, T0 = PLs.tubs[(a.goal && a.goal.tub || 0) % 8]; if (T0) st.Tu = rel([T0[0], (PLs.tubY != null ? PLs.tubY : a.y) + 0.38, T0[1]]); st.Bk = rel([a.x + R0[0] * 0.38 - F0[0] * 0.12, a.y, a.z + R0[1] * 0.38 - F0[1] * 0.12]);
          st.Of = rel([sg * ((G.beam || 3) / 2 + 1.4), -0.1, a.z]); if (a.task === 'strip' && ((t + idx * 3.1) % 25) < 2.2) DKGULL = [st.Of[0] + eye[0], (env.tide || 0), st.Of[2] + eye[2]]; }
        else if (a.task === 'mend') st.Nt = rel([a.x + F0[0] * 0.42, a.y + railH - 0.02, a.z + F0[1] * 0.42]);
        else if (a.task === 'jig' && !machines){ const rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; st.Rl = rel(rl); st.Wt = rel([rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]); } }
      if (a.sub && a.sub.carry === 'crate'){ st.crate = true; st.csp = i => packed(hash(i * 7 + 1)); if (a.mode === 'at') st.s = ST.clk - (a.sub.done - (a.sub.hold || 2)); }
      drawWorker(P, st, eye, ta, idx++); }
    dkBloodDraw(VP);
    if (HELM_KIT[vtype()] && G.skipperAt && cam.dist < 80) drawHelmKit(BMrel, eye, G);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the species of the fish in the hold that pass a test, by weight: r in 0..1 to a species (the fish in hand are the real catch's)
  function spHold(f){ let all = 0; const cum = []; for (const x of S.hold || []){ if (!f(x) || (SPECIES[x.sp] || {}).live) continue; all += x.kg; cum.push([x.sp, all]); } return r => { if (!cum.length) return 'torsk'; const v = r * all; for (const c of cum) if (v <= c[1]) return c[0]; return cum[cum.length - 1][0]; }; }
  // the gutting table's work point (its top in the middle) and where the guts go: over the rail on the table's side into the water
  // (down the bench's chute), in the boat's frame; as drawDeck places them
  function deckWork(G){
    const vt = vtype(), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), tz = W ? W.table[2] : d.z;
    const own = !!(W && W.own), V = VESSELS[vt], big = !!(V && V.len >= 10), KB = own ? null : kit('fish', big ? 'benk' : 'bord'), XF = kitX('fish'), tSide = tx < 0 ? 1 : -1, kTop = XF[big ? 'benk_top' : 'bord_top'];
    const topY = own && W.top != null ? W.top + 0.02 : KB && kTop != null ? d.y + kTop + 0.02 : d.y + 0.885, kDrop = KB && XF[big ? 'benk_drop' : 'bord_drop'];
    const dropP = kDrop ? [tx + tSide * kDrop[2], d.y + Math.max(0.6, kDrop[1]), tz - tSide * kDrop[0]] : [tx - tSide * 0.15, d.y + 1.0, tz];
    return {table:[tx, topY, tz], drop:dropP, offal:[dropP[0] - tSide * 2.6, -0.1, dropP[2]], tSide};
  }
  // a simple wheel and a chair at the helm, in the boat's frame, for the models whose wheelhouse is bare inside (vessel3d.js HELM_KIT)
  function drawHelmKit(BMrel, eye, G){
    const h = bv.head, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], A = G.skipperAt, at = (a, up, r) => { const w = xf(BMrel, [A[0] + r, A[1] + up, A[2] - a]); return [w[0], w[1], w[2]]; };
    const c = at(0.42, 1.08, 0), ax = [F[0] * 0.9, 0.45, F[1] * 0.9], al = Math.hypot(ax[0], ax[1], ax[2]), a = ax.map(v => v / al);   // the wheel's axis, tilted back towards the one steering
    const u = R, v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]], rim = [];
    for (let i = 0; i < 12; i++){ const th = i / 12 * Math.PI * 2; rim.push([c[0] + (u[0] * Math.cos(th) + v[0] * Math.sin(th)) * 0.2, c[1] + (u[1] * Math.cos(th) + v[1] * Math.sin(th)) * 0.2, c[2] + (u[2] * Math.cos(th) + v[2] * Math.sin(th)) * 0.2]); }
    for (let i = 0; i < 12; i++){ drawN(PM.wire, limbM(rim[i], rim[(i + 1) % 12], 0.016)); if (i % 2 === 0) drawN(PM.wire, limbM(c, rim[i], 0.011)); }
    drawN(PM.wire, limbM(c, at(0.62, 0.98, 0), 0.025));   // the column down to the console
    const sp = at(-0.42, 0.75, 0); drawN(PM.seat, chain(M4.T(sp[0], sp[1], sp[2]), M4.RY(-h))); drawN(PM.wire, limbM(at(-0.42, 0.02, 0), sp, 0.03));
  }
  function drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named){
    const m = pvm(t, liv); if (!m) return; const P = people(); nSetup(VP); const wr = named && wearOn(t); drawN(m.hull, BMrel); if (wr) wearOff();
    const ds = onDeck && G.crewSpots && ncrew < G.crewSpots.length ? G.crewSpots[ncrew] : null;
    if (skipper && ds) drawN((named && ownPerson('skipDeck')) || P.skipDeck, chain(BMrel, M4.T(ds[0], ds[1], ds[2]), M4.RY(ds[3] || 0)));
    else if (skipper) drawN((named && ownPerson('skip')) || P.skip, chain(BMrel, M4.T(G.skipperAt[0], G.skipperAt[1], G.skipperAt[2])));
    for (let i = 0; i < ncrew && i < G.crewSpots.length; i++){ const c = G.crewSpots[i]; drawN((named && ownPerson('crew', i)) || P.crew, chain(BMrel, M4.T(c[0], c[1], c[2]), M4.RY(c[3] || 0))); }
    if (G.trawl) drawTrawl(t, G.trawl, BMrel, performance.now() / 1000);
    if (G.seine) drawSeine(t, G.seine, BMrel, VP, performance.now() / 1000);
    gl.disableVertexAttribArray(2);
    if (named && SK){ const q = !S.unnamed && nameQ(t); if (q){ paintName(t, liv); for (const s of q) drawTexQuad(s, SK.tName, BMrel, VP, true, [0, 0.2, 0]); } drawMark(t, BMrel, VP, liv); drawLogo(t, BMrel, VP, ...ownLogo()); }
    gl.useProgram(PL.p);
  }
  // the local fleet near you: the kit model nearest each boat (vessel3d.js npcKit), scaled to her length and beam, at lod 1 within
  // 300 m and lod 0.3 within 1.5 km (a detailed GLB model gives its near and simple versions), with the skipper in the wheelhouse and hands on deck when she fishes; further out the box models
  const NKM = {};
  // a detailed model from tools/boats is near only within 150 m: many of the local fleet share it, and a tablet draws them all
  // a fishing NPC's model by her length and beam (FLEET's, and the coast's from tools/map/npc.py): the buffers by model, lod and livery,
  // the scale by boat
  // another player's boat is her own type's model (Jonas 05.10.2026: a friend in the same old wooden boat showed as a white box boat)
  const npcType = n => n.player && SPEC3D[n.vtype] ? n.vtype : npcKit(n.L, n.B);
  const NKN = {}; function npcNear(n){ const k = n.player ? 'p|' + n.vtype : n.L + '|' + n.B; if (!(k in NKN)) NKN[k] = glbHas(npcType(n)) ? 150 : 300; return NKN[k]; }
  const NKB = {};
  function npcMesh(n, lod){
    const kk = n.id + '|' + lod + '|' + (n.player ? n.vtype + '|' + n.liv : ''); if (kk in NKM) return NKM[kk];   // a player's repaint is a new key
    const t = npcType(n), liv = n.liv || 0, k = t + '|' + lod + '|' + liv;
    if (!(k in NKB)){ const m = npcModel(t, lod, liv), up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}); NKB[k] = m ? {t, hull:up(m.o), glass:lod >= 1 ? up(m.glass) : null, geo:m.geo} : null; }
    const B = NKB[k]; if (!B) return NKM[kk] = null;
    const V = VESSELS[t], sx = n.B / V.beam, sz = n.L / V.len, sy = (sx + sz) / 2;
    return NKM[kk] = Object.assign({}, B, {sv:[sx, sy, sz], S:new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])});
  }
  let npcNow = [];
  function drawNPC(eye, t, H, VP){
    if (!NPCM) return;
    npcNow = npcStates(H).filter(n => !n.rs && Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000);   // the rescue boat has her own model (RB)
    const kit = [];
    for (const n of npcNow){
      // a boat on your tow line (core/09g-turer.js): placed astern of your boat as the view shows her, 30 m of line from your stern
      // to her bow, so she follows smoothly between the simulation's minutes
      if (n.tur && n.st === 'tow' && bv.init){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; }
      // towing between players (ui/10o-ptow.js): the player's boat in your tow astern of you, or the one towing you ahead, on the same 30 m of line
      n.ptow = null;
      if (n.player && bv.init && S.ptowH && S.ptowH.st === 'tow' && n.id === S.ptowH.pid){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'tail'; }
      else if (n.player && bv.init && S.ptow && S.ptow.st === 'tow' && n.id === S.ptow.pid){ const fwd = -(GEO(vtype()).bow || -3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x + Math.sin(bv.head) * fwd) / 1000, y:(bv.z - Math.cos(bv.head) * fwd) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'head'; }
      const x = n.p.x * 1000, z = n.p.y * 1000, big = n.type === 'coastal' || n.type === 'ferry', y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = big ? Math.sin(t * 0.4 + x) * 0.01 : Math.sin(t * 1.1 + x) * 0.05 * (0.3 + WV.hs);
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -n.hd, big ? 0 : Math.sin(t * 0.9 + z) * 0.03, roll);
      const d = Math.hypot(x - eye[0], z - eye[2]); n.K = (n.fleet || n.coast || n.player) && d / ZF() < 1500 * QUAL.lodK[QUAL.lvl] ? npcMesh(n, d / ZF() < npcNear(n) * QUAL.lodK[QUAL.lvl] ? 1 : 0.3) : null;
      if (n.K) kit.push(n); else drawLit(NPCM[n.type], n.M);
    }
    if (!kit.length) return;
    const P = people(); nSetup(VP);
    for (const n of kit){ const K = n.K, G = K.geo, at = (p, r) => chain(n.M, M4.T(p[0] * K.sv[0], p[1] * K.sv[1], p[2] * K.sv[2]), M4.RY(r || 0));
      drawN(K.hull, chain(n.M, K.S));
      if (!K.glass) continue;
      drawNPCAnchor(n, K);   // her anchors stowed in their roller or hawse, as on your own boat
      if (npcCrewDraw(n, K, eye, t)) continue;   // her people walk her deck like yours (deckcrew.js crewSim)
      if (n.st !== 'port') drawN(npcPerson('skip', n), at(G.skipperAt));
      if (n.st === 'fishing') for (let i = 0; i < 2 && i < G.crewSpots.length; i++) drawN(npcPerson('crew', {id:String(n.id) + i, player:n.player, lk:n.lk, ck:n.ck}, i), at(G.crewSpots[i], G.crewSpots[i][3]));
    }
    drawNPCNames(kit, VP);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the agents of another boat within the near LOD (deckcrew.js crewSim, one per boat, dropped when she has been out of sight a
  // minute): the same walking people as on your own boat, in her model's frame scaled to her size; false when her model has no deck map
  const NCREW = new Map();
  function npcCrewDraw(n, K, eye, t){
    if (typeof crewSim !== 'function' || !K.geo || K.geo.hand) return false;
    const type = K.t; let E = NCREW.get(n.id);
    if (!E || E.type !== type){ const st = {n}; E = {type, st, t:0, sim:crewSim({type:() => type, ctx:G => npcCrewCtx(st.n, G), seed:1 + (lookHash(String(n.id)) % 1000)})}; NCREW.set(n.id, E); }
    E.st.n = n; const gap = t - E.t; E.t = t; const sim = E.sim; if (!sim.on()) return false;
    if (gap > 5) sim._st.lastSim = null;   // out of sight a while: everyone straight to their place
    sim.tick(Math.min(0.1, Math.max(0, gap)));
    const G = K.geo, sv = K.sv, h0 = n.hd; let idx = 40 + (lookHash(String(n.id)) % 50);
    for (const a of sim.visible()){
      const lp = a.mode === 'helm' && G.skipperAt ? G.skipperAt : [a.x, a.y, a.z], wl = xf(n.M, [lp[0] * sv[0], lp[1] * sv[1], lp[2] * sv[2]]), wy = wl[1] + eye[1];
      const look = npcLook(a.me ? 'skip' : 'crew', n, a.c ? (a.c.id.endsWith('1') ? 1 : 0) : 0);
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look};
      drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:h0 + (a.mode === 'helm' ? 0 : a.h), task:a.task, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0}, eye, t, idx++); }
    if (NCREW.size > 24) for (const [id, e] of NCREW) if (t - e.t > 60) NCREW.delete(id);
    return true;
  }
  // the look of a person on another boat: a player's as she sent it (lk, ck), a local boat's from its id (as npcPerson)
  const npcLook = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, l = code && lookFromKey(code); if (l) return l; }
    const h = lookHash(String(n.id)) % 12; return lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea');
  };
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
