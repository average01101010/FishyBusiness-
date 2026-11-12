  // ---------- the skerries (Ø13 K4, docs/planer/kartrelease-o13.md; the rest of G10, 11.11.2026) ----------
  // The 98 000 rocks of the sea charts (OpenStreetMap's seamark:type=rock in each tile's chart pack, 01e-marks.js, and Senja's own in
  // SEAMARKS) ground the boat, turn Autonav and stand on the chart plotter, but nothing drew them in 3D: she could run onto a rock that
  // was not there to see. Here each rock within reach is a low, rounded rock in the sea, with the foreshore's own colours: rockweed low
  // down and thick in shelter, the barnacles' pale band over it, bare and pale rock on an open coast (the tones and the exposure rule
  // of terFS's tidal zone). A rock stands still and the sea moves: its top lies between the low and the high water of its own place
  // (the tide's own amplitude there, tidePlace), so it is dry at the ebb and awash at the flood, and the sea's own depth test covers
  // it. Its shape is a pure function of its position (rockShape: no random number but the ones seeded by the position), so every
  // player sees the same rock. It is never wider than what grounds her: the foot, 2.4 m under mean sea level, reaches at most some
  // 10 m from the point (groundCheck, 01-world.js: within 12 m of the leg), and a rock in a harbour's water is not drawn (no grounding
  // there either). The data say only where a rock is, not how high: the height and the size are the game's.
  //   The meshes: one per 1 km cell (the cells rocksIn keeps), built a slice a frame as the shore's, so the draw calls follow the
  // cells in reach and not the rocks. By QUAL: the reach (500, 900, 1400, 2000 m) and the detail of each rock (ROCK_SEG); a cell
  // over a kilometre off has the least detail whatever the quality (105 600 triangles for 600 rocks on high where they lie thickest,
  // before that), and is built anew when the eye comes near.
  //   The breakers: where there is a sea, white water where the sea stands shallow over a rock, in a ring round one that is dry and
  // over the whole of one that is awash, more the higher the local sea (ssAt), none in a calm. One buffer filled each frame with a
  // 7 x 7 patch per rock (ROCK_FOAM by QUAL, none on low), lying on the sea: for the nearest within 180 m and inside the wave patch (ROCK_WAVE) on the
  // waves' own heights (seaH) at the sea mesh's own points, for the others flat, at the water's height at the rock inside the wave patch
  // and on the tide outside it. The foam's pattern is in the rock's own frame, so it never jumps as the eye moves. One draw call. #rocks0 in the address: no rocks and no breakers.
  const ROCK0 = /rocks0/.test(location.hash);
  const ROCK_R = [500, 900, 1400, 2000], ROCK_SEG = [[3, 8], [4, 12], [6, 16], [8, 22]], ROCK_FOAM = [0, 24, 64, 128], ROCK_WAVE = [0, 3, 6, 10], ROCK_WR = 180, ROCK_G = 7, ROCK_FR = 800, ROCK_FOOT = -2.4;
  const ROCKS = {cells:new Map(), job:null, want:[], t:0, lvl:-1, ver:-1, foam:[], P:null, vb:null, ib:null, va:null, vn:0, fdrawn:0, waved:0, drawn:0, ms:0, fms:0, built:0, fail:0, off:false};
  // the spring tide's amplitude at p (M2 + S2, m; at least 0.35, so a rock on the Skagerrak, where the tide is a hand's breadth, still stands up)
  const rockAmp = p => { const C = tidePlace(p).C; return Math.max(0.35, C[0][0] + C[1][0]); };
  // a rock's shape from its position alone (km): the seed, the half axes of its foot (m) and their turn, the top over mean sea level,
  // the power of its dome, a second lower hump for two in five, the wobble of its outline and the exposure there (0 sheltered, 1 open)
  function rockShape(qx, qy){
    const seed = (Math.imul(Math.round(qx * 1e4), 73856093) ^ Math.imul(Math.round(qy * 1e4), 19349663)) | 0, r = rng(seed), p = {x:qx, y:qy};
    const ex = clamp((exposure(p) - 0.2) / 0.8, 0, 1);   // (no stand-in when the data are not in: the cell is tried again, so the shape is the same for all)
    const A = rockAmp(p), a = 3.6 + 5.2 * r() * r(), b = a * (0.5 + 0.38 * r()), th = r() * Math.PI, top = A * (-0.1 + 0.85 * r()), pw = 2.1 + 1.3 * r();
    const two = r() < 0.4, ph = r() * 2 * Math.PI, h2 = 0.2 + 0.35 * r(), w = [r() * 6.283, r() * 6.283, r() * 6.283], wa = [0.07 + 0.05 * r(), 0.05 * r(), 0.035 * r()];
    return {seed, x:qx * 1000, z:qy * 1000, a, b, th, top, pw, D:top - ROCK_FOOT, A, ex, two, ph, h2, w, wa};
  }
  // the outline's wobble at an angle (0.83-1.17), and the rock's height at (ang, s): s 0 the middle, 1 the foot
  const rockEdge = (S, ang) => 1 + S.wa[0] * Math.sin(2 * ang + S.w[0]) + S.wa[1] * Math.sin(3 * ang + S.w[1]) + S.wa[2] * Math.sin(5 * ang + S.w[2]);
  function rockPoint(S, ang, s, out){
    const e = rockEdge(S, ang), u = Math.cos(ang) * S.a * e * s, v = Math.sin(ang) * S.b * e * s, ct = Math.cos(S.th), st = Math.sin(S.th), x = S.x + u * ct - v * st, z = S.z + u * st + v * ct;
    let y = S.top - S.D * Math.pow(s, S.pw * (1 + 0.3 * Math.sin(ang + S.w[2])));   // (one side steeper than the other)
    if (S.two){ const cu = Math.cos(S.ph) * S.a * 0.42, cv = Math.sin(S.ph) * S.b * 0.42, d = Math.hypot(u - cu, v - cv) / (S.b * 0.5); y = Math.max(y, S.top - S.h2 - S.D * d * d * 0.8); }
    // the lumps of the rock, the same for everyone (the noise's seed is the rock's), none at the foot
    const lump = (fbm(x * 0.4, z * 0.4, 3, S.seed & 1023) - 0.5) * 0.9 + (vn2(x * 1.1, z * 1.1, 78) - 0.5) * 0.3 + (vn2(x * 2.3, z * 2.3, 77) - 0.5) * 0.12;
    y += lump * (1 - s * s * s); if (s >= 1) y = ROCK_FOOT;
    out[0] = x; out[1] = y; out[2] = z; return out;
  }
  // the colour at a height over mean sea level: kelp and wet rock low down, rockweed up to about the mean level (thick and higher in
  // shelter, thin on an open coast), the barnacles' pale band over it (higher with the splash), then the rock itself, paler in the open
  const ROCK_C = {kelp:[0.11, 0.1, 0.07], wet:[0.19, 0.19, 0.19], w0:[0.22, 0.19, 0.1], w1:[0.32, 0.28, 0.14], barn:[0.7, 0.7, 0.66], rock:[0.33, 0.35, 0.37], pale:[0.52, 0.52, 0.5]};
  function rockCol(S, x, y, z, out){
    const n = vn2(x * 0.9, z * 0.9, 31), n2 = vn2(x * 2.6, z * 2.6, 32), A = S.A, ex = S.ex, wtop = A * lerp(0.42, 0.12, ex) + (n - 0.5) * 0.3, btop = A * lerp(0.75, 1.25, ex) + 0.15 + (n2 - 0.5) * 0.25;
    let c = mix3(ROCK_C.rock, ROCK_C.pale, ex * 0.8).map(v => v * (0.86 + 0.28 * n2));
    const br = sstep(wtop - 0.3, wtop + 0.05, y) * (1 - sstep(btop - 0.35, btop, y)); c = mix3(c, ROCK_C.barn, br * lerp(0.4, 0.7, ex));
    const wd = (1 - sstep(wtop - 0.25, wtop + 0.1, y)) * lerp(0.95, 0.5, ex) * lerp(0.55 + 0.45 * sstep(0.2, 0.45, n2), sstep(0.25, 0.6, n) * 0.6 + 0.4, ex), wc = mix3(ROCK_C.w0, ROCK_C.w1, vn2(x * 1.9, z * 1.9, 33));   // (in patches, more so in the open)
    c = mix3(mix3(c, ROCK_C.wet, 1 - sstep(wtop - 0.2, wtop + 0.5, y)), wc, wd);
    c = mix3(c, ROCK_C.kelp, (1 - sstep(-A - 0.3, -A * 0.55, y)) * 0.85);
    out[0] = c[0]; out[1] = c[1]; out[2] = c[2]; return out;
  }
  // well inside a harbour's water (the point and 15 m to each side): no boat grounds there (groundCheck leaves out a boat in a harbour),
  // so none is drawn; one on the harbour's edge can ground a boat just outside, and stands
  const rockInHarbour = p => inHarbour(p) && inHarbour({x:p.x + 0.015, y:p.y}) && inHarbour({x:p.x - 0.015, y:p.y}) && inHarbour({x:p.x, y:p.y + 0.015}) && inHarbour({x:p.x, y:p.y - 0.015});
  // a cell's rocks: those of rocksIn (Senja's and the coast's) in the 1 km cell, not in a harbour's water and not under the ground
  function* rockCell(gx, gy, lvl){
    const L = rocksIn(gx, gy, gx + 0.999999, gy + 0.999999).filter(q => Math.floor(q[0]) === gx && Math.floor(q[1]) === gy); if (!L.length) return null;
    const m = MB(), list = [], [K, N] = ROCK_SEG[lvl], P = [], C = [], row = (N + 1) * 3;
    for (const q of L){
      const p = {x:q[0], y:q[1]}; if (rockInHarbour(p)) continue;
      const S = rockShape(q[0], q[1]); if (terrH(S.x, S.z) > S.top - 0.25) continue;   // the ground is over it: on the foreshore or the land
      // the points ring by ring (the middle first), each with its colour; then the fan round the middle and the bands
      const o = [0, 0, 0], k = [0, 0, 0]; P.length = 0; C.length = 0;
      rockPoint(S, 0, 0, o); rockCol(S, o[0], o[1], o[2], k); const mid = [o[0], o[1], o[2]], midC = [k[0], k[1], k[2]];
      for (let i = 1; i <= K; i++) for (let j = 0; j <= N; j++){ const s = i / K; rockPoint(S, (j % N) / N * 2 * Math.PI, s, o); rockCol(S, o[0], o[1], o[2], k); P.push(o[0], o[1], o[2]); C.push(k[0], k[1], k[2]); }
      const put = (a, b, d) => { for (const v of [a, b, d]){ if (v < 0){ m.p.push(mid[0], mid[1], mid[2]); m.c.push(midC[0], midC[1], midC[2]); } else { m.p.push(P[v], P[v + 1], P[v + 2]); m.c.push(C[v], C[v + 1], C[v + 2]); } } };
      for (let j = 0; j < N; j++) put(-1, (j + 1) * 3, j * 3);
      for (let i = 0; i < K - 1; i++) for (let j = 0; j < N; j++){ const a = i * row + j * 3, b = a + 3, d = a + row, e = d + 3; put(a, b, e); put(a, e, d); }
      list.push(S); if (sliceDue()) yield;
    }
    return list.length ? {mesh:m.mesh([gx * 1000 + 500, gy * 1000 + 500]), list, n:list.length, tris:m.p.length / 9} : null;
  }
  // the cells in reach looked over every 0.7 s: one cell's mesh on its way at a time, the far ones freed; and the rocks the breakers lie on
  function updateRocks(eye){
    if (ROCKS.job){ const J = ROCKS.job; let S;
      // a cell that could not be built (its ground or the tide's table not in yet) is tried again three seconds on; the first is told
      try { S = sliceRun(J, sliceEnd()); } catch (e){ ROCKS.job = null; ROCKS.want.length = 0; ROCKS.t = performance.now() + 2300; if (!ROCKS.fail++) console.warn('3D skjær: en celle venter', e); return; }
      if (J.fin){ ROCKS.job = null; ROCKS.built++;
        if (J.lvl === QUAL.lvl && J.ver === MARKS.ver){ const old = ROCKS.cells.get(J.k); if (old && old.mesh) freeMesh(old.mesh); if (S) S.far = J.far; ROCKS.cells.set(J.k, S || null); }   // (the old mesh stood until the new one was done)
        else if (S && S.mesh) freeMesh(S.mesh); } }
    const now = performance.now(), lvl = QUAL.lvl;
    if (now - ROCKS.t < 700){   // between the looks: the next cell waiting, as soon as the last is done
      if (!ROCKS.job && ROCKS.want.length && lvl === ROCKS.lvl && MARKS.ver === ROCKS.ver){ const [, gx, gy, k, far, re] = ROCKS.want.shift(); if (re || !ROCKS.cells.has(k)) ROCKS.job = {k, lvl, far, ver:MARKS.ver, g:rockCell(gx, gy, far ? 0 : lvl)}; }
      return; }
    ROCKS.t = now;
    if (lvl !== ROCKS.lvl || MARKS.ver !== ROCKS.ver){ for (const S of ROCKS.cells.values()) if (S && S.mesh) freeMesh(S.mesh); ROCKS.cells.clear(); ROCKS.lvl = lvl; ROCKS.ver = MARKS.ver; }   // (a tile's marks came, or the quality changed: anew)
    const R = ROCK_R[lvl], keep = new Set(), want = [], T = MAPD.man ? MAPD.man.tile : 50;
    for (let gy = Math.floor((eye[2] - R) / 1000); gy <= Math.floor((eye[2] + R) / 1000); gy++) for (let gx = Math.floor((eye[0] - R) / 1000); gx <= Math.floor((eye[0] + R) / 1000); gx++){
      const k = gx + ':' + gy, dc = Math.hypot(gx * 1000 + 500 - eye[0], gy * 1000 + 500 - eye[2]); if (dc > R + 720) continue;   // (as drawRocks: the square's corners are out of reach)
      // a cell far off is built with the least detail (a rock there is a few pixels), and anew when the eye comes near: far over
      // 1050 m, near again under 750 m, so a cell on the line is not built over and over
      const C0 = ROCKS.cells.get(k), far = lvl > 0 && dc > (C0 && C0.far ? 750 : 1050);
      keep.add(k); if (ROCKS.cells.has(k)){ if (C0 && C0.far !== far) want.push([dc, gx, gy, k, far, true]); continue; }
      if (MAPD.man){ const vp = MAPD.byTile.get('view:' + Math.floor(gx / T) + ':' + Math.floor(gy / T)); if (!vp || !vp.buf) continue; }   // (the ground is not in yet)
      if (!rocksIn(gx, gy, gx + 0.999999, gy + 0.999999).length){ ROCKS.cells.set(k, null); continue; }   // (none there: no job)
      want.push([dc, gx, gy, k, far, false]);
    }
    want.sort((a, b) => a[0] - b[0]); ROCKS.want = want;
    if (!ROCKS.job && want.length){ const [, gx, gy, k, far] = want.shift(); ROCKS.job = {k, lvl, far, ver:MARKS.ver, g:rockCell(gx, gy, far ? 0 : lvl)}; }
    for (const [k, S] of ROCKS.cells) if (!keep.has(k)){ if (S && S.mesh) freeMesh(S.mesh); ROCKS.cells.delete(k); }
    // the breakers' rocks: the nearest within ROCK_FR, each with the local sea's height where it lies
    const F = ROCKS.foam; F.length = 0; const nf = ROCK_FOAM[lvl];
    if (nf){ for (const S of ROCKS.cells.values()) if (S) for (const q of S.list){ const d = Math.hypot(q.x - eye[0], q.z - eye[2]); if (d < ROCK_FR){ q.d = d; F.push(q); } }
      F.sort((a, b) => a.d - b.d); if (F.length > nf) F.length = nf;
      for (const q of F){ let hs = 0; try { const s = ssAt(q.x, q.z); hs = Math.hypot(s[0], s[1]); } catch (e){ hs = WV.hs || 0; } q.hs = hs; } }
  }
  // the rocks, in the near pass with the shore (24-cinema.js), before the sea (whose depth test covers what is under it)
  function drawRocks(VP, eye){
    if (ROCK0 || ROCKS.off) return; const t0 = performance.now();
    try { updateRocks(eye); } catch (e){ ROCKS.off = true; console.warn('3D skjær faller bort', e); if (typeof cloudErr === 'function') cloudErr('3D skjær av: ' + String(e && e.message || e), 'view3d rocks', ''); return; }
    let n = 0, on = false; const R = ROCK_R[QUAL.lvl] + 720;
    for (const [k, S] of ROCKS.cells){ if (!S || !S.mesh) continue; if (Math.hypot(S.mesh.o[0] - eye[0], S.mesh.o[1] - eye[2]) > R) continue; if (!on){ litSetup(VP); if (PL.u.uWet) gl.uniform2f(PL.u.uWet, WETON ? env.wet || 0 : 0, 0); on = true; } drawLit(S.mesh); n += S.n; }   // (no snow where the tide comes, as on the foreshore)
    if (on && PL.u.uWet) gl.uniform2f(PL.u.uWet, WETON ? env.wet || 0 : 0, WETON ? env.snowC || 0 : 0);
    ROCKS.drawn = n; ROCKS.ms = ROCKS.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  // the breakers: white water where the sea stands shallow over the rock. vL: the place in the rock's own frame (1 at the foot), so the
  // rock's height under the water is -D s^pw under its top; vQ: the water over the top (m), D, pw, the local sea's height (m);
  // vS: the rock's own phase, whether the patch lies flat (then the surge is the shader's own, slow and small), and the place in
  // metres from the rock, which the foam's pattern is drawn in
  const ROCKF_VS = 'attribute vec3 aPos;attribute vec4 aL;attribute vec4 aQ;attribute vec4 aS;uniform mat4 uVP;varying vec3 vW;varying vec4 vL;varying vec4 vQ;varying vec4 vS;' +
    'void main(){vW=aPos;vL=aL;vQ=aQ;vS=aS;gl_Position=uVP*vec4(aPos,1.0);}';
  const ROCKF_FS = 'precision highp float;uniform vec3 uLit;uniform vec3 uFog;uniform float uFogD;uniform float uT;varying vec3 vW;varying vec4 vL;varying vec4 vQ;varying vec4 vS;' + AIR + NOISE +
    'void main(){float s=length(vL.xy),E=vQ.w;' +
    'float d=vQ.x+vS.y*0.28*E*sin(uT*0.85+vS.x)+vQ.y*pow(s,vQ.z);' +   // the water's depth over the rock here
    'float wd=0.2+0.8*E;' +
    'float band=smoothstep(-0.06-0.25*E,0.03,d)*(1.0-smoothstep(wd*0.45,wd,d));' +   // the white water on the rock's shallow shoulder
    'float halo=(1.0-smoothstep(wd,wd*3.5+0.6,d))*smoothstep(-0.3,0.05,d);' +   // and the streaks it leaves round it
    'vec2 wp=vS.zw+vec2(vS.x*7.0,vS.x*3.0);float n=ns(wp*1.3+vec2(uT*0.11,-uT*0.07))*0.6+ns(wp*3.7-vec2(uT*0.19,uT*0.13))*0.4;' +
    'float wash=0.72+0.28*sin(uT*1.25+vS.x*1.7);' +
    'float a=clamp(band*(0.65+0.7*n)*wash+halo*smoothstep(0.34,0.64,n)*0.78,0.0,1.0)*smoothstep(0.1,0.5,E)*0.97;' +
    'a*=1.0-smoothstep(0.8,1.0,max(abs(vL.z),abs(vL.w)));' +   // (out to nothing at the patch's edge)
    'if(a<0.01)discard;gl_FragColor=vec4(fin(vec3(0.92,0.95,0.96)*uLit,vW),a);}';
  function drawRockFoam(VP, eye, t){
    if (ROCK0 || ROCKS.off || !ROCKS.foam.length || ROCKS.P === false) return; const F = ROCKS.foam;
    if (!ROCKS.P){ try { ROCKS.P = program(ROCKF_VS, ROCKF_FS, ['aPos', 'aL', 'aQ', 'aS'], 'skjaerskum'); } catch (e){ if (gl.isContextLost()) throw e; console.warn('3D ' + 'skjaerskum' + ' faller bort · ' + GPU, e); ROCKS.P = false; return; } }
    const t0 = performance.now(), W = 15, G = ROCK_G, GV = G * G, tide = env.tide || 0, nw = ROCK_WAVE[QUAL.lvl], st = 2 * HALF / NP, sw = Math.max(st, 4);
    if (!ROCKS.va || ROCKS.vn < F.length){ const n = Math.max(F.length, 24), Q = G - 1; ROCKS.vn = n; ROCKS.va = new Float32Array(n * GV * W);
      const I = new Uint16Array(n * Q * Q * 6); for (let r = 0; r < n; r++) for (let j = 0; j < Q; j++) for (let i = 0; i < Q; i++){ const a = r * GV + j * G + i, o = (r * Q * Q + j * Q + i) * 6; I[o] = a; I[o + 1] = a + G; I[o + 2] = a + 1; I[o + 3] = a + 1; I[o + 4] = a + G; I[o + 5] = a + G + 1; }
      if (ROCKS.vb) gl.deleteBuffer(ROCKS.vb); if (ROCKS.ib) gl.deleteBuffer(ROCKS.ib); ROCKS.vb = buf(ROCKS.va, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); ROCKS.ib = buf(I, gl.ELEMENT_ARRAY_BUFFER); }
    const A = ROCKS.va; let n = 0, waved = 0; SEA_OUTER = true;   // (the grid's surface: its points are the grid's, 14-sea.js seaCell)
    try { for (const q of F){
      if (!(q.hs > 0.1) || tide - q.top > 0.2 + 1.1 * q.hs) continue;   // a calm, or too deep under the water to break
      // on the waves (the nearest, inside the wave patch): the points are the sea mesh's own (every sw m from the patch's origin, which
      // is a whole number of cells), so the patch lies in the drawn surface; else flat on the tide, round the rock
      const ct = Math.cos(q.th), sn = Math.sin(q.th), wave = waved < nw && q.hs > 0.25 && q.d < ROCK_WR && seaFade(q.x, q.z) > 0.99; if (wave) waved++;
      const R = wave ? sw * (G - 1) / 2 : q.a * 1.5 + 3, sp = 2 * R / (G - 1), cx = wave ? Math.round(q.x / sw) * sw : q.x, cz = wave ? Math.round(q.z / sw) * sw : q.z;
      const y0 = wave ? 0 : seaFade(q.x, q.z) > 0 ? seaHFast(q.x, q.z, t) : tide;
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++){
        const x = cx - R + i * sp, z = cz - R + j * sp, y = (wave ? seaH(x, z, t) : y0) + 0.03, o = (n * GV + j * G + i) * W, lx = x - q.x, lz = z - q.z;
        A[o] = x - eye[0]; A[o + 1] = y - eye[1]; A[o + 2] = z - eye[2];
        A[o + 3] = (lx * ct + lz * sn) / q.a; A[o + 4] = (-lx * sn + lz * ct) / q.b; A[o + 5] = (x - cx) / R; A[o + 6] = (z - cz) / R;
        A[o + 7] = y - 0.03 - q.top; A[o + 8] = q.D; A[o + 9] = q.pw; A[o + 10] = Math.min(q.hs, 3);
        A[o + 11] = (q.seed & 1023) / 1023 * 6.283; A[o + 12] = wave ? 0 : 1; A[o + 13] = lx; A[o + 14] = lz;
      }
      n++;
    } } finally { SEA_OUTER = false; }
    ROCKS.fdrawn = n; ROCKS.waved = waved; if (!n) return;
    const P = ROCKS.P, u = P.u; gl.useProgram(P.p); gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uT, t % 4096);
    const sy = Math.max(env.lightDir[1], 0), lit = [0, 1, 2].map(k => Math.min(1.2, env.amb[k] * 1.2 + env.sunCol[k] * (0.35 + 0.65 * sy)));
    gl.uniform3fv(u.uLit, lit); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.bindBuffer(gl.ARRAY_BUFFER, ROCKS.vb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, A.subarray(0, n * GV * W));
    const st4 = W * 4; for (const [loc, size, off] of [[0, 3, 0], [1, 4, 3], [2, 4, 7], [3, 4, 11]]){ gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, st4, off * 4); }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ROCKS.ib); gl.drawElements(gl.TRIANGLES, n * (G - 1) * (G - 1) * 6, gl.UNSIGNED_SHORT, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthMask(true); gl.disable(gl.BLEND); for (let k = 1; k < 4; k++) gl.disableVertexAttribArray(k);
    ROCKS.fms = ROCKS.fms * 0.9 + (performance.now() - t0) * 0.1;
  }
  // what the tests ask (G3._debug.rocks): the cells, the rocks in them and drawn, the triangles, the breakers, and the nearest rock
  function rocksInfo(ax, az){
    const C = [...ROCKS.cells.values()].filter(S => S && S.mesh); let near = null;
    for (const S of C) for (const q of S.list){ const d = Math.hypot(q.x - bv.x, q.z - bv.z); if (!near || d < near.d) near = {d:+d.toFixed(1), top:+q.top.toFixed(2), a:+q.a.toFixed(1), b:+q.b.toFixed(1), ex:+q.ex.toFixed(2), hs:q.hs === undefined ? null : +q.hs.toFixed(2), x:q.x, z:q.z}; }
    let at = null; if (ax !== undefined){ at = false; for (const S of C) for (const q of S.list) if (Math.hypot(q.x - ax, q.z - az) < 1) at = true; }   // (is the rock at this point drawn?)
    return {at, off:ROCK0 || ROCKS.off, cells:ROCKS.cells.size, meshes:C.length, rocks:C.reduce((a, S) => a + S.n, 0), tris:C.reduce((a, S) => a + S.tris, 0), drawn:ROCKS.drawn, foam:ROCKS.foam.length, fdrawn:ROCKS.fdrawn, job:!!ROCKS.job, built:ROCKS.built, ms:+ROCKS.ms.toFixed(3), fms:+ROCKS.fms.toFixed(3), waved:ROCKS.waved, tide:+(env.tide || 0).toFixed(2), near, foamL:ROCKS.foam.slice(0, 6).map(q => [Math.round(q.x - bv.x), Math.round(q.z - bv.z), +q.top.toFixed(2), +(q.hs || 0).toFixed(2), +q.a.toFixed(1)])};
  }
