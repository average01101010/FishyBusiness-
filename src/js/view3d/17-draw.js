  // ---------- drawing ----------
  function litSetup(VP){
    gl.useProgram(PL.p); const u = PL.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb);
    gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uOver, [0, 0, 0, 0]); plSet(u); if (u.uWet) gl.uniform2f(u.uWet, WETON ? env.wet || 0 : 0, WETON ? env.snowC || 0 : 0);
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
    try { PTS[q] = program(TER_VS, terFS(q), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat', 'aCov'], 'terreng' + q); }
    catch (e){ console.warn('3D ' + 'terreng' + q + ' faller bort · ' + GPU, e); PTS[q] = terProg(q - 1); }
    return PTS[q];
  }
  // The sea bed is not drawn where the sea hides it (Ø3b, 10.11.2026; Jonas' #prof from an Adreno 642L: without the terrain 14 frames a
  // second against 9 at open sea, with no land near). The terrain's grids reach over the whole window, sea bed and all, and every
  // pixel of it was shaded (the dearest terrain shader on the near grids) before the sea, drawn last and opaque, covered it: about
  // half of the triangles of the near grids by a shore, nearly all of them at sea. A grid gets an index buffer of its own with the
  // triangles that reach over a height thr (dryIdx, in the shared buffer's order), made again when thr moves a step:
  //   the far pass (TERR, MIDM) under the flat far sea: thr a quarter to half a metre under the tide;
  //   the near pass (NEARM, FINEM) under the flat sea and the wave patch: lower by the deepest trough the waves can dig and a margin
  //   (three times the significant height of the wind sea, at the most the wind can raise, and of the swell, and 2.75 to 3.75 m),
  //   in whole metres.
  // The picture is the same: the sea covers every pixel a ray from an eye over it meets its plane in (the far ring, the near ring and
  // the patch, 17-draw.js drawSea), so what lies wholly under it is never seen. All of it is drawn as before when the eye is not well
  // over the tide (a camera in a trough), when the profile leaves the sea out, and with #seabed1 in the address.
  const DRYS = {off:/seabed1/.test(location.hash), a16:null, a32:null, n:0, cut:0};
  function dryIdx(m, thr){
    const d = m.dry; if (d && d.thr === thr) return d;
    const n = m.gn, h = m.h, N6 = (n - 1) * (n - 1) * 6, key = m.i32 ? 'a32' : 'a16';
    if (!DRYS[key] || DRYS[key].length < N6) DRYS[key] = m.i32 ? new Uint32Array(N6) : new Uint16Array(N6);
    const I = DRYS[key]; let q = 0;
    // (a height that is not a number keeps its triangles)
    for (let j = 0; j < n - 1; j++){ let a = j * n, c = a + n, wa = h[a] < thr, wc = h[c] < thr;
      for (let i = 0; i < n - 1; i++, a++, c++){ const wb = h[a + 1] < thr, wd = h[c + 1] < thr;
        if (!(wa && wc && wb)){ I[q++] = a; I[q++] = c; I[q++] = a + 1; }
        if (!(wb && wc && wd)){ I[q++] = a + 1; I[q++] = c; I[q++] = c + 1; }
        wa = wb; wc = wd; } }
    if (d) gl.deleteBuffer(d.ib);
    DRYS.n++; DRYS.cut = 1 - q / N6;
    return (m.dry = {ib:buf(I.subarray(0, q), gl.ELEMENT_ARRAY_BUFFER), n:q, thr});
  }
  // the height the grids are cut at now: null draws all of them
  function dryThr(eye, near){
    const tide = env.tide || 0; if (DRYS.off || PROF.skip.sea || !(eye[1] > tide + 1)) return null;
    if (!near) return Math.floor((tide - 0.25) * 4) / 4;
    // (the wind sea at its highest anywhere in the patch: the boat's own may be a harbour's, with open water 300 m off; WV.cap is what
    // the wind can raise at all)
    return Math.floor(tide - 0.75) - Math.ceil(3 * (Math.max(WV.hs || 0, WV.cap || 0) + (WV.swHs || 0)) + 2);
  }
  const MATQ_FIX = (location.hash.match(/mat(\d)/) || [])[1];
  const MATP = {p:[0.5, 0.4, 0.65, 0.6], q:[0.4, 0.6, 2, 0]};   // chosen from the variant sheets 18.10.2026 (matvar.py in the session)   // the material shader's tuning (terFS uMP, uMQ)
  function drawTerrain(TM, eye, VP, near){
    AIRE = [((eye[0] % 4096) + 4096) % 4096, ((eye[2] % 4096) + 4096) % 4096, eye[1]];
    const PQ = terProg(MATQ_FIX !== undefined ? +MATQ_FIX : Math.min(2, QUAL.lvl)) || PT; gl.useProgram(PQ.p); const u = PQ.u; plSet(u);
    if (u.uMP){ gl.uniform4fv(u.uMP, MATP.p); gl.uniform4fv(u.uMQ, MATP.q); }
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform3fv(u.uSand, snowNow == null || snowNow < 5 ? [0.84, 0.86, 0.88] : [0.74, 0.71, 0.6]); if (u.uWet) gl.uniform2f(u.uWet, WETON ? env.wet || 0 : 0, 0); if (u.uExpo){ let e = 0.5; try { e = expoFar({x:bv.x / 1000, y:bv.z / 1000}) / 255; } catch (er){} gl.uniform1f(u.uExpo, e); } gl.uniformMatrix4fv(u.uM, false, TM);
    const thr = dryThr(eye, near || !NEARM);   // (with no near grid yet the far one is drawn in both passes: one height for it, the lower)
    const one = (m, hole, ground) => {
      const D = thr !== null && m.gn && m.h ? dryIdx(m, thr) : null; if (D && !D.n) return;
      gl.uniformMatrix4fv(u.uM, false, relM(m)); gl.uniform3fv(u.uPO, [m.o[0] - RO.x, 0, m.o[1] - RO.z]); gl.uniform4fv(u.uHole, hole || NOHOLE); gl.uniform1f(u.uGOn, ground && GTEX ? 1 : 0); gl.uniform1f(u.uLOn, ground && LMTEX && LMON ? 1 : 0); gl.uniform1f(u.uTideY, Math.min(env.tide || 0, COAST3.top - 0.15)); gl.uniform1f(u.uSwash, clamp(0.5 * (WV.hs + WV.swHs), 0, COAST3.swash));
      if (ground && LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE0); }
      if (LRECT) gl.uniform4fv(u.uGRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]);
      if (ground && GTEX){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX); gl.uniform1i(u.uGround, 0); gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]); }
      attr(0, m.pb, 3); attr(1, m.cb, 3); attr(2, m.nb, 3); attr(3, m.sb, 1); attr(4, m.mb, 4); if (m.vb) attr(5, m.vb, 4); else { gl.disableVertexAttribArray(5); gl.vertexAttrib4f(5, 0, 0, 0, 0); } gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, D ? D.ib : m.ib); gl.drawElements(gl.TRIANGLES, D ? D.n : m.n, m.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    };
    const holeOf = (M, g) => new Float32Array([M.x0 + g - eye[0], M.z0 + g - eye[2], M.x0 + M.sx - g - eye[0], M.z0 + M.sz - g - eye[2]]);
    if (!NEARM) one(TERR);
    else if (near){ one(NEARM, FINEM ? holeOf(FINEM, 6) : null, true); if (FINEM){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1); one(FINEM, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } if (UPATCH.length){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); for (const m of UPATCH) one(m, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } }
    else if (!MIDM) one(TERR, holeOf(NEARM, 45));
    else { one(TERR, holeOf(MIDM, 180)); one(MIDM, holeOf(NEARM, 45)); }
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4); gl.disableVertexAttribArray(5); litSetup(VP);
  }
  // ground layer under the corridor: roads and forest, drawn on a canvas and draped on the terrain
  // The shore layer for the water (STEX) and the near mesh's heights (HTEX) over its square (SRECT) are made a slice a frame (GJOB,
  // groundStep from updateNear: a depth per sea point, 65 536 of them, was 150-300 ms at once on a PC, 05.11.2026); the textures in use
  // stand until the new ones are done, then both go up together with their square, and the land mask is drawn after them.
  let GJOB = null;
  function buildGround(){
    if (!NEARM) return;
    const x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx;
    // the roads on the ground are off (the canvas was a blank 2048 x 2048 uploaded with mipmaps at every rebuild): no ground texture
    GTEX = null;
    GRECT = [x0, z0, 1 / sx, 1 / sx];
    // the shoal texture for the sea by the shore (F4, 14-sea.js, SHOAL in 01-shaders.js): R and G the travel time from the shore,
    // B the depth (depthF), A the land; before, R the land and G how shallow, which no shader read
    const S2 = 256, dok = mapViewReady(x0 / 1000, z0 / 1000, (x0 + sx) / 1000, (z0 + sx) / 1000, () => staleMesh('near'));
    GJOB = {M:NEARM, x0, z0, sx, S2, st:sx / S2, dok, j:0, dat:new Uint8Array(S2 * S2 * 4)}; shoalPrep(GJOB);   // (stepped from the next frame on)
  }
  function maskOr(J, x, z){ try { return rbilM(MAPD.L.mask, x, z); } catch (e){ J.nom = true; return landFracM(x, z); } }
  function groundStep(){
    const J = GJOB; if (!J) return; if (J.M !== NEARM || J.M.freed){ GJOB = null; return; }   // (a newer near mesh starts its own)
    const {x0, z0, sx, S2, st, dok, dat} = J, end = sliceEnd();
    while (J.j < S2){
      const j = J.j++;
      // (a sim tile far out at sea can lack its mask block: «map: mask block 94,18 has no pack» north of Loppa, found by h2dshot
      // 05.11.2026; then the rest of the job takes the land fraction, as where the tile has no sim pack)
      for (let i = 0; i < S2; i++){ const x = x0 + (i + 0.5) * st, z = z0 + (j + 0.5) * st, m = dok ? (mapSimAt({x:x / 1000, y:z / 1000}) && !J.nom ? maskOr(J, x, z) : landFracM(x, z)) : landFracM(x, z), o = (j * S2 + i) * 4, dd = m > 0.5 ? 0 : dok ? depthF({x:x / 1000, y:z / 1000}) : 50; shoalCell(J, j * S2 + i, m > 0.5, dd); dat[o + 3] = Math.round(m * 255); }
      if (J.j < S2 && performance.now() > end) return;
    }
    // the travel time from the shore, a pass at a time (shoalSweep), then into R and G
    if (!shoalSweep(J, end)) return;
    shoalPut(J);
    GJOB = null; TJN.ground++;
    STEX = STEX || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, STEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S2, S2, 0, gl.RGBA, gl.UNSIGNED_BYTE, dat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    SRECT = [x0, z0, 1 / sx, 1 / sx];
    { const M = J.M, n = M.gn, px = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) px[k] = Math.round(clamp((M.h[k] + 8) / 16, 0, 1) * 255);
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
    // the water in front of Father's naust and the rorbuer (siteTerr: s.pit), so a boat at their quays lies in the sea and not on the
    // foreshore's ramp
    for (const s of sitesNow()){ if (!s.pit || !near(s.o[0], s.o[1])) continue; const Q = (a, b) => [s.o[0] + s.u[0] * a + s.n[0] * b, s.o[1] + s.u[1] * a + s.n[1] * b], A = s.pit.a;
      poly([Q(-A, -0.2), Q(A, -0.2), Q(A + 10, s.pit.w + 6), Q(-A - 10, s.pit.w + 6)], -4); }
    for (const U of UNITA){ if (!near(U.o[0], U.o[1])) continue;
      const fl = []; for (let i = 0; i < U.f.length; i += 2) fl.push(unitW(U, U.f[i], U.f[i + 1])); poly(fl, COAST3.top, true);
      const q = ugeo(U); poly([[-q.E, -q.B], [q.E, -q.B], [q.E, 0], [-q.E, 0]].map(([a, b]) => unitW(U, a, b)), COAST3.top, true); }
    LMTEX = LMTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, lcv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
    LMON = true; LMTEXEL = sx / J.size; LRECT = [x0, z0, 1 / sx, 1 / sx]; LMJOB = null; LMMS = J.ms + performance.now() - t0;
  }
  // The sky is not shaded behind the sea (Ø3b, 10.11.2026): the sky is the first thing drawn, over the whole picture, and on a phone
  // held upright the sea then covers most of it. Before the sky, the far sea's whole rectangle at the tide (no hole: the near pass
  // covers its own square with sea) goes into the depth buffer alone, with a near plane of 1 m so it reaches in under the camera
  // (the far pass's own is 25 m), and the sky is drawn with the depth test on: it stands behind that plane out to 20 km. What the far
  // pass draws after it is in front of the plane wherever it is over the water (its depth with a near plane of 25 m is the nearer of
  // the two for anything less than 25 times as far off as the plane), and the sea itself is drawn over every pixel of the plane, in
  // the far pass or the near one. So the picture is the same, and only the sky's pixels behind the sea are saved. Not when the eye is
  // not well over the tide, when the profile leaves the sea out, or with #skymask0 in the address; a driver that will not compile
  // the little program draws the sky as before.
  const MASK_VS = 'attribute vec2 aXZ;uniform mat4 uVP;uniform vec2 uScale;uniform vec3 uOriginRel;void main(){gl_Position=uVP*vec4(uOriginRel+vec3(aXZ.x*uScale.x,0.0,aXZ.y*uScale.y),1.0);}';
  const MASK_FS = 'precision mediump float;void main(){gl_FragColor=vec4(0.0);}';
  const SKYMASK = {off:/skymask0/.test(location.hash), P:null, n:0};
  function skyMask(eye, Vm, fov, asp, farZ){
    const tide = env.tide || 0; if (SKYMASK.off || SKYMASK.P === false || PROF.skip.sea || !FARQ || !(eye[1] > tide + 1)) return false;
    if (!SKYMASK.P){ try { SKYMASK.P = program(MASK_VS, MASK_FS, ['aXZ'], 'sjømaske'); } catch (e){ if (gl.isContextLost()) throw e; console.warn('3D ' + 'sjømaske' + ' faller bort · ' + GPU, e); SKYMASK.P = false; return false; } }
    const u = SKYMASK.P.u, ox = TERR ? TERR.cx : bv.x, oz = TERR ? TERR.cz : bv.z, sc = TERRW.span / 2 + 40000;
    gl.useProgram(SKYMASK.P.p); gl.uniformMatrix4fv(u.uVP, false, mul(persp(fov, asp, 1, farZ), Vm)); gl.uniform2f(u.uScale, sc, sc); gl.uniform3f(u.uOriginRel, ox - eye[0], tide - eye[1], oz - eye[2]);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.colorMask(false, false, false, false);
    gl.disableVertexAttribArray(1); attr(0, FARQ.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FARQ.ib); gl.drawElements(gl.TRIANGLES, FARQ.n, gl.UNSIGNED_SHORT, 0);
    gl.colorMask(true, true, true, true); SKYMASK.n++; return true;
  }
  // the flat sea as a ring: the rectangle R [x0, z0, x1, z1] less the hole Hl where something nearer is drawn, as up to four strips,
  // so no water is shaded twice and the shader never discards (which costs the early depth test on phone and tablet GPUs)
  function seaRing(u, eye, y, R, Hl){
    if (Hl){ Hl = [Math.max(R[0], Hl[0]), Math.max(R[1], Hl[1]), Math.min(R[2], Hl[2]), Math.min(R[3], Hl[3])]; if (Hl[2] <= Hl[0] || Hl[3] <= Hl[1]) Hl = null; }
    // (the side strips reach a little into the ones above and below, 12.11.2026: they met them edge to edge with other vertices along
    // the edge, and the T-junctions left pinholes, dotted lines across the sea from the hole's corners outward that showed the bed, and
    // the wave patch's square from far above, Jonas. The sea is flat here, so the overlap lies in the same plane)
    const m = Hl ? 2 + (R[3] - R[1]) * 1e-5 : 0;
    const strips = Hl ? [[R[0], R[1], R[2], Hl[1]], [R[0], Hl[3], R[2], R[3]], [R[0], Math.max(R[1], Hl[1] - m), Hl[0], Math.min(R[3], Hl[3] + m)], [Hl[2], Math.max(R[1], Hl[1] - m), R[2], Math.min(R[3], Hl[3] + m)]] : [R];
    attr(0, FARQ.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FARQ.ib);
    for (const [a, b, c, d] of strips){
      if (c - a < 0.5 || d - b < 0.5) continue; const ox = (a + c) / 2, oz = (b + d) / 2;
      gl.uniform2fv(u.uScale, [(c - a) / 2, (d - b) / 2]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], y, oz - eye[2]]);
      gl.drawElements(gl.TRIANGLES, FARQ.n, gl.UNSIGNED_SHORT, 0);
    }
  }
  // (where the near pass's sea ends inside the near terrain's square, drawSea: a cell of that grid and 2 m, past its outer row; 60 m
  // left the shallow bed of the near terrain bare in the band, a dark line on the water by an islet)
  const nearIn = () => NEARM ? NEARM.sx / Math.max(1, (NEARM.gn || 256) - 1) + 2 : 2;
  function drawSea(VP, eye, t, far, drop){
    { const np = QUAL.lvl === 3 && UINT ? 300 : 150; if (np !== NP){ NP = np; buildPatch(); } }   // the wave patch: 2 m on ultra
    const P = far && (drop === undefined || !QUAL.lvl) ? PSF : PS; gl.useProgram(P.p); const u = P.u;   // low quality: the far shader right up to the wave patch
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uHalf, HALF); gl.uniform1f(u.uFlat, far ? 1 : 0);
    gl.uniform1f(u.uCell, 2 * HALF / NP); if (u.uInner != null) gl.uniform4f(u.uInner, 0, 0, 1, 0); gl.uniform1f(u.uPx, 2 * Math.tan(curFov / 2) / Math.max(canvas.height, 1)); gl.uniform1f(u.uDbg, SEADBG ? 1 : 0);
    // the local sea: the textures on units 4 and 5 (a 1 x 1 stand-in until they are ready)
    gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform4fv(u.uWk2, WK.u2); gl.uniform4fv(u.uWk3, WK.u3); wakeTU(u, RO.x, RO.z);
    gl.uniform4fv(u.uSea, [WV.C, WV.cap, WV.lnFcap, WV.swHs]); gl.uniform4fv(u.uSea2, [WV.dot, WV.steep, ssBlend(SSL.n), ssBlend(SSL.w)]); gl.uniform4fv(u.uLocal, WV.loc);
    for (const L of [SSL.n, SSL.w]){ gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.on ? L.tex : SSDUMMY); gl.uniform1i(L === SSL.n ? u.uSSTn : u.uSSTw, L.unit); gl.uniform4fv(L === SSL.n ? u.uSSN : u.uSSW, L.on ? [L.rect[0] - RO.x, L.rect[1] - RO.z, 1 / L.rect[2], 1] : [0, 0, 1, 0]); }
    gl.activeTexture(gl.TEXTURE0);
    // the waves' phases and their groups' phases at the render origin (wavePh), so the shaders work near zero
    const {ub, gp, gq} = wavePh(), nfp = new Float32Array(NF.ph);
    gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, ub); gl.uniform1fv(u.uGp, gp); if (u.uFWa){ gl.uniform4fv(u.uFWa, WV.ua); gl.uniform4fv(u.uFWb, ub); gl.uniform1fv(u.uFGp, gp); } plSet(u);
    if (u.uNFp){ gl.uniform1fv(u.uNFp, nfp); gl.uniform1fv(u.uNFg, gq); } if (u.uFNFp){ gl.uniform1fv(u.uFNFp, nfp); gl.uniform1fv(u.uFNFg, gq); } if (u.uNFD) gl.uniform2f(u.uNFD, NF.D[0], NF.D[1]);
    foamBind(u, t);   // the foam map (14-sea.js), in the near pass; and the sea by the shore (F4)
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform3fv(u.uZen, env.zen); airSet(u); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uDeep, [0.035, 0.14, 0.18]); gl.uniform1f(u.uWind, env.seaWind || env.wind); gl.uniform2fv(u.uWindDir, env.windDir); gl.uniform1f(u.uSpec, env.spec);
    gl.uniform1f(u.uLSOn, LMTEX && LMON && LRECT ? 1 : 0); if (LMTEX && LMON && LRECT){ gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLandS, 6); gl.activeTexture(gl.TEXTURE0); gl.uniform4fv(u.uLRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]); }
    fftBind(u, eye);   // the short sea's FFT tiles (14b-fft.js)
    // the near terrain's square from the eye, where the far pass takes over: the near pass's tiles go over into roughness towards it
    if (u.uNearE != null){ if (NEARM){ const NEAR_IN = nearIn(), b = Math.max(150, Math.min(NEARM.sx, NEARM.sz) * 0.08); gl.uniform4f(u.uNearE, NEARM.x0 + NEAR_IN - eye[0], NEARM.z0 + NEAR_IN - eye[2], NEARM.x0 + NEARM.sx - NEAR_IN - eye[0], NEARM.z0 + NEARM.sz - NEAR_IN - eye[2]); gl.uniform1f(u.uNearB, b); }
      else { gl.uniform4f(u.uNearE, -1e7, -1e7, 1e7, 1e7); gl.uniform1f(u.uNearB, 1); } }
    seaShared(u, t);   // the gusts, the cat's paws and the ripples in the shared sea's place and time (B4, 14b-fft.js)
    gl.uniform1f(u.uSOn, STEX ? 1 : 0); gl.uniform1f(u.uHOn, HTEX ? 1 : 0); gl.uniform1f(u.uTideL, env.tide || 0); if (HTEX){ gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.uniform1i(u.uHgt, 3); gl.activeTexture(gl.TEXTURE0); } if (STEX) gl.uniform4fv(u.uSRect, [SRECT[0] - eye[0], SRECT[1] - eye[2], SRECT[2], SRECT[3]]);
    gl.disableVertexAttribArray(1);
    if (far){
      // flat sea: the whole map less the near terrain for the far pass; in the near pass the near terrain's square (or around the camera)
      // less the wave patch around the boat
      const y = -eye[1] - (drop || 0) + (env.tide || 0);
      if (drop === undefined){ const ox = TERR ? TERR.cx : bv.x, oz = TERR ? TERR.cz : bv.z, sc = TERRW.span / 2 + 40000;
        seaRing(u, eye, y, [ox - sc, oz - sc, ox + sc, oz + sc], NEARM ? [NEARM.x0 + 80, NEARM.z0 + 80, NEARM.x0 + NEARM.sx - 80, NEARM.z0 + NEARM.sz - 80] : null); }
      else {
        // (the near pass's sea ends NEAR_IN m inside the near terrain's square and the far pass's goes 80 m in under it, 12.11.2026: it
        // went 20 m out over the far pass's land, where the near pass has no depth, and drew a dark line along the square on the land
        // seen from high up; 2 m inside, a hairline was left where the near terrain's outer row slopes down to its edge)
        let R; const NEAR_IN = nearIn(); if (NEARM) R = [NEARM.x0 + NEAR_IN, NEARM.z0 + NEAR_IN, NEARM.x0 + NEARM.sx - NEAR_IN, NEARM.z0 + NEARM.sz - NEAR_IN];
        else { const ox = Math.round(eye[0] / 100) * 100, oz = Math.round(eye[2] / 100) * 100, sc = far * 1.15; R = [ox - sc, oz - sc, ox + sc, oz + sc]; }
        const st = 2 * HALF / NP, px = Math.round(bv.x / st) * st, pz = Math.round(bv.z / st) * st, hh = HALF * 0.97;
        seaRing(u, eye, y, R, [px - hh, pz - hh, px + hh, pz + hh]);
      }
    } else {
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step;
      gl.uniform2fv(u.uScale, [1, 1]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], -eye[1] + (env.tide || 0), oz - eye[2]]);
      // the fine patch round the boat first (PIN, 14-sea.js), then the grid with its hole, pushed back a little in depth where the two
      // overlap by a cell, so the fine one is the surface seen there and the two never flicker in turn
      // (from 180 m off the patch's cell goes over to the grid's, so at 260 m it is the grid's own surface and is left out with nothing
      // changing on the screen: its corners cost as much as half the grid's, and from there the short waves are a pixel or two; the boat
      // floats on the fine sea either way, seaCell)
      const ed = Math.hypot(eye[0] - bv.x, eye[1] - bv.y, eye[2] - bv.z), cf = sstep(180, 260, ed), pin = PIN_ON() && u.uInner != null && cf < 1;
      if (pin){ gl.uniform4f(u.uInner, lerp(PIN_C, step, cf), PIN.b0, PIN.b1, lerp(0, fvLod(), cf)); if (u.uInB != null) gl.uniform2f(u.uInB, bv.x - ox, bv.z - oz); attr(0, PIN.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PIN.ib); gl.drawElements(gl.TRIANGLES, PIN.n, gl.UNSIGNED_SHORT, 0);
        gl.uniform4f(u.uInner, 0, 0, 1, 0); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 2); }
      attr(0, PATCH.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pin ? PATCH.ibH : PATCH.ib); gl.drawElements(gl.TRIANGLES, pin ? PATCH.nH : PATCH.n, PATCH.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      if (pin){ gl.disable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(0, 0); }
      drawRockFoam(VP, eye, t);   // the skerries' breakers (17i-rocks.js) on the sea just drawn
    }
  }

