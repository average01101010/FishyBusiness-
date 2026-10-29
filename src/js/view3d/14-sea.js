  // ---------- sea ----------
  const HALF = 300; let NP = 150, curFov = 0.96;   // the wave patch: 600 m, 150 cells a side (4 m), 300 on ultra (2 m)
  function buildPatch(){
    if (PATCH){ gl.deleteBuffer(PATCH.pb); gl.deleteBuffer(PATCH.ib); }
    const v = new Float32Array((NP + 1) * (NP + 1) * 2); let k = 0;
    for (let j = 0; j <= NP; j++) for (let i = 0; i <= NP; i++){ v[k++] = -HALF + i * 2 * HALF / NP; v[k++] = -HALF + j * 2 * HALF / NP; }
    const big = (NP + 1) * (NP + 1) > 65536, idx = big ? new Uint32Array(NP * NP * 6) : new Uint16Array(NP * NP * 6); k = 0;
    for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++){ const a = j * (NP + 1) + i, b = a + 1, c = a + NP + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    PATCH = {pb:buf(v), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, i32:big, np:NP};
  }
  function buildSea(){
    buildPatch(); let k = 0;
    const NG = 48, g = new Float32Array((NG + 1) * (NG + 1) * 2); k = 0;
    for (let j = 0; j <= NG; j++) for (let i = 0; i <= NG; i++){ g[k++] = -1 + 2 * i / NG; g[k++] = -1 + 2 * j / NG; }
    const gi = new Uint16Array(NG * NG * 6); k = 0;
    for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++){ const a = j * (NG + 1) + i, b = a + 1, c = a + NG + 1, d = c + 1; gi[k++] = a; gi[k++] = c; gi[k++] = b; gi[k++] = b; gi[k++] = c; gi[k++] = d; }
    FARQ = {pb:buf(g), ib:buf(gi, gl.ELEMENT_ARRAY_BUFFER), n:gi.length};
    SKYQ = buf(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]));
    foamInit();
  }
  // ---------- the waves: wind sea and swell from the sea model (03b-sea.js) ----------
  const WL = [96, 67, 49, 36.5, 27.5, 20.5, 15.3, 11.4, 8.6, 6.4], WOFF = [0, -0.46, 0.53, -0.92, 0.27, 0.84, -0.21, 1.12, -0.68, 0.41], WPH = [0, 2.1, 4.4, 1.3, 5.6, 3.2, 0.7, 4.9, 2.6, 5.9];
  // the swell: three long waves around its peak wavelength (deep water L = 1.56 T^2), from its own direction
  const SWL = [0.8, 1.0, 1.25], SWW = [0.55, 1, 0.6], SWOFF = [-0.14, 0, 0.17], SWPH = [1.7, 4.2, 0.4];
  const WV = {hs:0.3, W:5, dir:0, swHs:0, swDir:0, swTp:10, init:false, list:[], ph:[], kd:[], ua:new Float32Array(52), ub:new Float32Array(52), C:0, cap:0, lnFcap:1, dot:1, steep:0.3, loc:[0.3, 0, 1, 1]};
  // a broad spectrum around the peak wavelength; short waves keep a little energy so the surface always has texture (sum of squares 1/8, so Hs = 1)
  function specW(L0){ const w = WL.map(L => Math.exp(-(((Math.log(L) - Math.log(L0)) / 0.75) ** 2)) + 0.06 * Math.min(1, L0 / L)), n = Math.sqrt(w.reduce((a, c) => a + c * c, 0)) * 2.828; return w.map(v => v / n); }
  function updateWaves(dt, H){
    const p = {x:bv.x / 1000, y:bv.z / 1000}, gT = gridGamma(p), hsT = hsAt(p, H), WT = windAt(H, p), wdT = windDir(H, p) - gT, dirT = (wdT + 180) * DEG, SW = swellOpen(H, p), swDirT = (SW.dir - gT + 180) * DEG;   // the world is drawn on the grid: true directions turn by -gamma
    if (!WV.init){ WV.hs = hsT; WV.W = WT; WV.dir = dirT; WV.swHs = SW.hs; WV.swDir = swDirT; WV.swTp = SW.tp; WV.init = true; }
    // the sea answers the wind over a few seconds (a sudden change, as after skipping time, never snaps the waves)
    const k = 1 - Math.exp(-dt / 4); WV.hs = lerp(WV.hs, hsT, k); WV.W = lerp(WV.W, WT, k); WV.swHs = lerp(WV.swHs, SW.hs, k); WV.swTp = lerp(WV.swTp, SW.tp, k * 0.2);
    WV.dir += angDiff(WV.dir, dirT) * Math.min(1, dt / 12); WV.swDir += angDiff(WV.swDir, swDirT) * Math.min(1, dt / 30);
    // the wind sea grows over the fetch to WMO's open-sea height; its spectrum goes from a young sea (1 km of fetch) to the grown one
    const U = Math.max(0.3, WV.W), Fc = Math.max(1.01, fetchCap(U)), L0 = T => 9.81 * T * T / (2 * Math.PI);
    WV.C = 0.0016 * U * Math.sqrt(1000 / 9.81); WV.cap = hsWMO(U); WV.lnFcap = Math.log(Fc);
    const wo = specW(L0(Math.max(0.5, tpWind(U, Fc)))), wy = specW(L0(Math.max(0.5, tpWind(U, 1))));
    WV.dot = 8 * wo.reduce((a, v, i) => a + v * wy[i], 0); WV.steep = 0.25 + 0.45 * sstep(4, 14, U);
    const f = (((wdT % 360) + 360) % 360) / FETCH.sec; SSK = [Math.floor(f) % 36, (Math.floor(f) + 1) % 36]; SSU = f - Math.floor(f);
    const L = [];
    WL.forEach((Lw, i) => { const kk = 2 * Math.PI / Lw, ang = WV.dir + WOFF[i] * (0.75 + 0.25 * sstep(3, 12, U)); L.push({Dx:Math.sin(ang), Dz:-Math.cos(ang), k:kk, wo:wo[i], wy:wy[i], swell:0, om:Math.sqrt(9.81 * kk), ph0:WPH[i]}); });
    const sn = Math.sqrt(SWW.reduce((a, c) => a + c * c, 0)) * 2.828, Ls = 1.56 * WV.swTp * WV.swTp;
    SWL.forEach((m, j) => { const kk = 2 * Math.PI / (Ls * m), ang = WV.swDir + SWOFF[j]; L.push({Dx:Math.sin(ang), Dz:-Math.cos(ang), k:kk, wo:SWW[j] / sn, wy:SWW[j] / sn, swell:1, om:Math.sqrt(9.81 * kk), ph0:SWPH[j]}); });
    // as a wave turns or lengthens, its phase is held where the boat is, so the sea does not slide past her (the map is 80 km across)
    L.forEach((c, i) => { const kx = c.k * c.Dx, kz = c.k * c.Dz;
      if (WV.kd[i]) WV.ph[i] = ((WV.ph[i] + (WV.kd[i][0] - kx) * bv.x + (WV.kd[i][1] - kz) * bv.z) % 6.2832 + 6.2832) % 6.2832; else WV.ph[i] = c.ph0;
      WV.kd[i] = [kx, kz]; c.ph = WV.ph[i]; WV.ua.set([c.Dx, c.Dz, c.k, c.wo], i * 4); WV.ub.set([c.swell, c.om, c.ph, c.wy], i * 4); });
    WV.list = L;
    // the same at the boat: for the vertex shader on a GPU that cannot read textures there, and until the textures are ready
    const q = hsParts(p, H), rF = Math.sqrt(q.F); WV.loc = [Math.min(WV.cap, WV.C * rF), WV.swHs * swellFactor(p), clamp(2 * Math.log(Math.max(rF, 1)) / WV.lnFcap, 0, 1), rF];
    env.windDir = [Math.sin(dirT), -Math.cos(dirT)]; env.wind = WV.W;
  }

  // ---------- the near field: the short sea rides with the boat ----------
  // The game's clock runs 6x real time, so the boat covers six times the ground a real boat would while the waves move at their real
  // speed; the water then raced past the hull and she skipped the chop (Jonas 19.10.2026: «hva ser best ut?»). The short wind waves
  // (4-9), the ripples and the foam's mottle are therefore carried along with the boat at 1 - 1/rate of her movement over the ground
  // (5/6 at 6x; nothing at real time), as a phase offset per wave (exact, kept within a turn) and a shifted position for the ripples and
  // the foam (wrapped at 64 km, when she is slow). The long waves and the swell stand in the world, so land, buoys and other boats
  // still pass at the game's speed, and what passes the hull passes at her real speed through the water. «#nf0» in the address turns
  // it off, for the comparison.
  const NF = {on:!/nf0/.test(location.hash), ph:new Float32Array(13), gp:new Float32Array(13), D:new Float64Array(2), lx:null, lz:null, R:0};
  function nfStep(){
    const TAU = 2 * Math.PI, dx = NF.lx == null ? 0 : bv.px - NF.lx, dz = NF.lz == null ? 0 : bv.pz - NF.lz; NF.lx = bv.px; NF.lz = bv.pz;
    NF.R = NF.on ? clamp(1 - 1 / (typeof simRate === 'function' ? simRate() : 6), 0, 1) : 0;
    if (!NF.R || Math.hypot(dx, dz) > 300) return;   // off, real time, or a jump (a teleport, a new place): the field stays
    const ex = dx * NF.R, ez = dz * NF.R;
    for (let i = 4; i < 10; i++){ const c = WV.list[i]; if (!c) continue; const a = c.Dx * ex + c.Dz * ez, g = c.Dz * ex - c.Dx * ez;
      NF.ph[i] = (NF.ph[i] + c.k * a) % TAU; NF.gp[i] = (NF.gp[i] + c.k * (0.083 * a + 0.041 * g)) % TAU; }
    NF.D[0] += ex; NF.D[1] += ez;
    for (let k = 0; k < 2; k++) if (Math.abs(NF.D[k]) > 65536 && (bv.spd < 1 || Math.abs(NF.D[k]) > 120000)) NF.D[k] -= Math.sign(NF.D[k]) * 65536;
  }

  // ---------- the boat's own waves (the uniforms of WAKE_GLSL) ----------
  // The regime follows the Froude number Fr = v / sqrt(g L) with the hull's length from VESSELS: below about 0.4 a displacement hull
  // makes transverse and divergent waves and a stern wave that breaks near hull speed; a planing hull (Fr > 1) leaves mostly divergent
  // waves and a flat white wash. v is the boat's real speed (the scene runs faster than real time, the waves are drawn for the real speed).
  const WK = {u0:new Float64Array(4), u1:new Float32Array(4), u2:new Float32Array(4), u3:new Float32Array(4), Fr:0, T:new Float64Array(14), S:new Float32Array(2), H:[], astern:false};
  // the source's track (WAKE_GLSL uWkT): where the pattern's source (the stern going ahead, the bow going astern) has been, a point each
  // 1.5 m it moves over the ground, and from it the seven points ds apart along the way back (straight on past its end)
  function wakeTrack(x, z, fx, fz, ds){
    const H = WK.H, last = H[H.length - 1];
    if (!last || Math.hypot(x - last[0], z - last[1]) > 300 || WK.flip){ H.length = 0; H.push([x, z]); WK.flip = false; }
    else if (Math.hypot(x - last[0], z - last[1]) > 1.5){ H.push([x, z]); if (H.length > 400) H.splice(0, H.length - 400); }
    let k = H.length - 1, px = x, pz = z, acc = 0;
    for (let j = 0; j < 7; j++){
      let need = ds;
      while (need > 0){
        const q = k >= 0 ? H[k] : null;
        if (!q){ px -= fx * need; pz -= fz * need; need = 0; break; }   // past the track's end: straight on back
        const d = Math.hypot(q[0] - px, q[1] - pz);
        if (d >= need){ px += (q[0] - px) * need / d; pz += (q[1] - pz) * need / d; need = 0; } else { px = q[0]; pz = q[1]; need -= d; k--; }
      }
      WK.T[j * 2] = px; WK.T[j * 2 + 1] = pz; acc += ds;
    }
    WK.S[0] = ds; WK.S[1] = 1;
  }
  // the track's points for a shader whose frame is the world less (ox, oz)
  const WKT4 = new Float32Array(16);
  function wakeTU(u, ox, oz){ if (u.uWkT == null) return; for (let j = 0; j < 7; j++){ WKT4[j * 2] = WK.T[j * 2] - ox; WKT4[j * 2 + 1] = WK.T[j * 2 + 1] - oz; } WKT4[14] = WKT4[12]; WKT4[15] = WKT4[13]; gl.uniform4fv(u.uWkT, WKT4); gl.uniform2fv(u.uWkS, WK.S); }
  function updateWake(){
    // the boat's speed through the water from the simulation (the drawn speed also catches up on lag, which is not the hull's speed)
    // (under the manoeuvring model, by hand: its speed through the water, ahead or astern)
    const VG = GEO(vtype()), kn = typeof dynLive === 'function' && dynLive() ? Math.abs(S.boat.dyn.u || 0) / 0.5144 : S.boat.status === 'sailing' ? Math.abs(S.boat.v || 0) : 0, v = kn * 0.5144, Lb = BOAT.len || 6, Fr = v / Math.sqrt(9.81 * Lb); WK.Fr = Fr; WK.kn = kn;
    if (v < 0.8){ WK.u3[3] = 0; return; }
    const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), k0 = 9.81 / (v * v), lam = 2 * Math.PI / k0;
    const A = Math.min(0.6, 0.045 * Lb * sstep(0.12, 0.38, Fr) * (1 - 0.55 * sstep(0.6, 1.5, Fr)));
    // in a turn the straight pattern reaches only as far as it stays within a few metres of the curved track; the foam trail goes on
    const R = bv.spd / Math.max(Math.abs(bv.yr || 0), 1e-3), smax = Math.min(clamp(10 * Lb, 40, 120), Math.sqrt(6 * R) + 8);
    const Ab = Math.min(0.6, 0.12 * v * v / (2 * 9.81)) * sstep(0.1, 0.35, Fr) * (1 - 0.5 * sstep(0.9, 1.6, Fr));
    // going astern (the way over the ground against the heading) the pattern comes off the bow and lies ahead of her, along the way she backed
    // (from her own way over the ground between frames: under the manoeuvring model the course is drawn as the heading)
    const lp = WK.lp || [bv.x, bv.z], mx = bv.x - lp[0], mz = bv.z - lp[1]; WK.lp = [bv.x, bv.z];
    const mv = Math.hypot(mx, mz); if (mv > 0.02 && mv < 50) WK.ad = (WK.ad || 0) * 0.8 + ((mx * fx + mz * fz) / mv) * 0.2;
    const ast = (WK.ad || 0) < -0.3; if (ast !== WK.astern){ WK.astern = ast; WK.flip = true; }
    const ux = ast ? -fx : fx, uz = ast ? -fz : fz, sx0 = ast ? bv.x - fx * VG.bow : bv.x - fx * VG.stern, sz0 = ast ? bv.z - fz * VG.bow : bv.z - fz * VG.stern;
    WK.u0.set([sx0, sz0, ux, uz]); WK.u1.set([k0, A, 1 - sstep(0.55, 1.0, Fr), smax]); WK.u2.set([VG.stern - VG.bow, Ab, (VG.beam || 2.4) / 2, Fr]);
    wakeTrack(sx0, sz0, ux, uz, Math.max(2, (smax + 10) / 7));
    WK.u3.set([sstep(0.28, 0.5, Fr), sstep(0.3, 0.45, Fr) * (1 - sstep(0.9, 1.2, Fr)), sstep(2.5, 5, lam / (2 * HALF / NP)), 1]);
  }
  // the long wake waves as the vertex shader lifts them (for what lies on the water, like the foam trail)
  function wakeHFast(x, z){
    if (WK.u3[3] < 0.5 || WK.u3[2] <= 0) return 0;
    const rx = x - WK.u0[0], rz = z - WK.u0[1], s = -(rx * WK.u0[2] + rz * WK.u0[3]), q = Math.abs(rx * WK.u0[3] - rz * WK.u0[2]), L = WK.u2[0], k = WK.u1[0];
    if (s <= 0 || s > WK.u1[3] || q > s * 0.42 + L * 0.6 + 4) return 0;
    const e = s * 0.3536, a = WK.u1[1] * (1 - sstep(WK.u1[3] * 0.55, WK.u1[3], s)) * sstep(0, 1.2, s);   // as wakeH: no step at the stern
    return (WK.u1[2] * a / Math.sqrt(1 + s / L) * Math.cos(k * s) * (1 - sstep(e * 0.75, e * 1.02, q)) * 0.75 + a * Math.pow(1 + s / L, -0.333) * Math.sin(1.5 * k * (0.816 * s + 0.577 * q)) * Math.exp(-(((q - e) / (0.1 * s + 1.2)) ** 2))) * WK.u3[2];
  }


  // ---------- the foam map: the foam the boat and the sea leave in the water (Fysikk 4, F1, 27.10.2026) ----------
  // The sea's foam used to be only what each frame made: the crests over the threshold and the wake breaking by the hull, and the trail
  // two thin strips (TRAIL, 24-cinema.js). In the water foam stays: the wash a hull leaves is white for tens of seconds and hundreds of
  // metres, and a crest's foam lies and streaks downwind (the chillboats videos Jonas showed 27.10.2026, docs/planer/fysikk-4-sjo-og-skrog.md).
  // So a map of it: two textures (ping-pong) of FOAM.N texels over FOAM.M metres round the boat in the water's frame (Pb = P - NF.D, the
  // frame the short sea and the foam's mottle ride in, 5.20b; so the wake is left behind at her real speed through the water, not the
  // screen's 6x). Every frame foamStep draws the old map into the new one shifted by the whole texels the window has moved (nothing blurs,
  // 8 bits hold it), rolls the birth windows, and FOAM_FS adds the foam made this frame; the sea shader reads it (foamBind, unit 7) and
  // ages it as exp(-age / tau). «#foam0» in the address turns it off (the sea as before, for the comparison); it is off too on the lite
  // and the basic sea, on the low quality (the far shader draws the near sea there), and when no framebuffer can be made.
  const FOAM = {on:!/foam0/.test(location.hash), ok:false, N:0, M:600, tex:[null, null], fb:[null, null], r:0, ox:0, oz:0, t0:[0, 0], win:[160, 32], tau:[14, 3.5], now:[0, 0], prog:null, pB:null, fresh:true, why:'', ms:0, sh:[0, 0], n:0, G:[0, 0], C:[0, 0], gs:[0, 0], cur:{x:0, y:0}, curT:-1e9};
  const foamLive = () => FOAM.on && FOAM.ok;
  const foamSize = () => QUAL.lvl >= 2 ? 1024 : 512;
  function foamFree(){ for (let k = 0; k < 2; k++){ if (FOAM.fb[k]) gl.deleteFramebuffer(FOAM.fb[k]); if (FOAM.tex[k]) gl.deleteTexture(FOAM.tex[k]); FOAM.fb[k] = FOAM.tex[k] = null; } FOAM.ok = false; }
  function foamInit(){
    foamFree(); if (!FOAM.on || !PS || PS.basic || PS.lite) return;
    try {
      if (!FOAM.prog) FOAM.prog = program(FOAM_VS, FOAM_FS, ['aXZ'], 'skumkart');
      const N = foamSize();
      for (let k = 0; k < 2; k++){
        const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
        const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        FOAM.tex[k] = tx; FOAM.fb[k] = fb; if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('rammebuffer ' + st);
      }
      FOAM.N = N; FOAM.ok = true; FOAM.fresh = true; FOAM.r = 0;
    } catch (e){ foamFree(); FOAM.why = String(e && e.message || e); FOAM.on = false; if (typeof cloudErr === 'function') cloudErr('3D skumkart av: ' + FOAM.why + ' · ' + GPU, 'view3d foam', ''); }
  }
  // the waves' phases and their groups' phases at the render origin (doubles, then wrapped), so the shaders work near zero
  function wavePh(){
    const ub = WV.ub.slice(), gp = new Float32Array(13), TAU = 2 * Math.PI;
    for (let i = 0; i < 13; i++){ const c = WV.list[i]; if (!c) continue; const a = c.Dx * RO.x + c.Dz * RO.z, g = c.Dz * RO.x - c.Dx * RO.z;
      ub[i * 4 + 2] = (c.ph + c.k * a) % TAU; gp[i] = (i * 2.59 + c.k * (0.083 * a + 0.041 * g)) % TAU; }
    return {ub, gp};
  }
  // one frame of the map: the window after the boat, the birth windows rolled, the old map shifted in and this frame's foam added
  function foamStep(dt, t){
    if (!FOAM.on) return; if (FOAM.ok && foamSize() !== FOAM.N) foamInit(); if (!FOAM.ok || !WV.list.length) return;
    const t1 = performance.now(), N = FOAM.N, M = FOAM.M, px = M / N, Dx = NF.D[0], Dz = NF.D[1];
    // the window: the boat's place in the water's frame, the map's origin snapped to whole texels round it (a jump or the first frame clears it)
    const qx = bv.x - Dx, qz = bv.z - Dz, tx = qx - M / 2, tz = qz - M / 2;
    let sx = Math.round((tx - FOAM.ox) / px), sz = Math.round((tz - FOAM.oz) / px);
    if (FOAM.fresh || Math.abs(sx) >= N || Math.abs(sz) >= N){ FOAM.ox = tx; FOAM.oz = tz; sx = sz = N; FOAM.fresh = false; FOAM.pB = null; FOAM.t0[0] = FOAM.t0[1] = t; FOAM.G[0] = Dx; FOAM.G[1] = Dz; FOAM.C[0] = FOAM.C[1] = 0; }
    else { FOAM.ox += sx * px; FOAM.oz += sz * px; }
    // the wake's foam (r, g) lies still in the water where the boat made it, not in the near field's frame (it slid with the boat's way,
    // straight through a breakwater when she turned into a harbour, Jonas 29.10.2026): its frame is the map's plus G, kept within half a
    // texel of the near field's D by shifting its content by whole texels (gs) each frame; the water itself drifts with the current
    // (curAt, the tide's stream and the wind's drift, along the shore near land), at the game's rate. FOAM_FS drops what drifts onto land.
    if (t - FOAM.curT > 0.5 && typeof curAt === 'function'){ try { FOAM.cur = curAt({x:bv.x / 1000, y:bv.z / 1000}, S.t / 60); } catch (e){ FOAM.cur = {x:0, y:0}; } FOAM.curT = t; }
    const rate = typeof simRate === 'function' ? simRate() : 6, cdx = (FOAM.cur.x || 0) * dt * rate, cdz = (FOAM.cur.y || 0) * dt * rate;
    FOAM.C[0] += cdx; FOAM.C[1] += cdz;
    for (let k = 0; k < 2; k++){ const d = (k ? Dz : Dx) - FOAM.G[k]; if (Math.abs(d) > 30000) FOAM.G[k] += Math.round(d / 65536) * 65536; }   // (nfStep folds D by 65 536 m)
    const gsx = Math.round((Dx - FOAM.G[0] - cdx) / px), gsz = Math.round((Dz - FOAM.G[1] - cdz) / px);
    FOAM.G[0] += gsx * px + cdx; FOAM.G[1] += gsz * px + cdz; FOAM.gs[0] = gsx; FOAM.gs[1] = gsz;
    // the birth windows roll on: by 128/255 of the window each time the frame's time passes 0.95 of it (a long frame may need several
    // rolls; the foam born before the rolled t0 is dropped, which only an age past half the window is); the clock set back clears
    const reb = [0, 0];
    for (let k = 0; k < 2; k++){ let f = (t - FOAM.t0[k]) / FOAM.win[k], n = 0; while (f > 0.95 && n < 4){ FOAM.t0[k] += FOAM.win[k] * 128 / 255; f = (t - FOAM.t0[k]) / FOAM.win[k]; n++; }
      if (f > 0.95 || f < 0){ reb[k] = 1; FOAM.t0[k] = t; f = 0; } else reb[k] = n * 128 / 255; FOAM.now[k] = f; }
    // the hull this frame and last, in the map's metres (the way she came since the last frame is swept; after a jump, just here)
    const VG = GEO(vtype()), fx = Math.sin(bv.head), fz = -Math.cos(bv.head), pb = FOAM.pB && Math.hypot(FOAM.pB[0] - qx, FOAM.pB[1] - qz) < 300 ? FOAM.pB : [qx, qz, fx, fz];
    const w = 1 - FOAM.r, P = FOAM.prog, u = P.u;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FOAM.fb[w]); gl.viewport(0, 0, N, N); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.useProgram(P.p);
    gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, FOAM.tex[FOAM.r]); gl.uniform1i(u.uPrev, 7);
    for (const L of [SSL.n, SSL.w]){ gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.on ? L.tex : SSDUMMY); gl.uniform1i(L === SSL.n ? u.uSSTn : u.uSSTw, L.unit); gl.uniform4fv(L === SSL.n ? u.uSSN : u.uSSW, L.on ? [L.rect[0] - RO.x, L.rect[1] - RO.z, 1 / L.rect[2], 1] : [0, 0, 1, 0]); }
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(u.uShift, sx, sz); gl.uniform2f(u.uShiftG, sx === N ? 0 : gsx, sz === N ? 0 : gsz); gl.uniform2f(u.uFoamG, Dx - FOAM.G[0], Dz - FOAM.G[1]); gl.uniform1f(u.uN, N); gl.uniform2f(u.uRebase, reb[0], reb[1]);
    // the land the wake's foam may not lie on: the shore texture (buildLandMask, the foreshore's height), as the sea shader reads it
    const lon = !!(LMTEX && LMON && LRECT); gl.uniform1f(u.uLSOn, lon ? 1 : 0); gl.uniform1f(u.uTideL, env.tide || 0);
    // (the sampler is always on unit 6, a stand-in when the shore is not in: left on unit 0 it read the map being drawn, GL error 1282)
    gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, lon ? LMTEX : SSDUMMY); gl.uniform1i(u.uLandS, 6); gl.activeTexture(gl.TEXTURE0);
    if (lon) gl.uniform4fv(u.uLRect, [LRECT[0] - RO.x, LRECT[1] - RO.z, LRECT[2], LRECT[3]]);
    gl.uniform4fv(u.uFoamRect, [FOAM.ox - RO.x, FOAM.oz - RO.z, 1 / M, M]); gl.uniform4fv(u.uFoamT, [FOAM.now[0], FOAM.win[0], FOAM.tau[0], 0]); gl.uniform4fv(u.uFoamTc, [FOAM.now[1], FOAM.win[1], FOAM.tau[1], 0]);
    gl.uniform1f(u.uTime, t); gl.uniform2f(u.uNFD, Dx, Dz); gl.uniform1f(u.uWind, env.wind || 0); gl.uniform2fv(u.uWindDir, env.windDir || [0, 1]);
    gl.uniform4fv(u.uSea, [WV.C, WV.cap, WV.lnFcap, WV.swHs]); gl.uniform4fv(u.uSea2, [WV.dot, WV.steep, ssBlend(SSL.n), ssBlend(SSL.w)]); gl.uniform4fv(u.uLocal, WV.loc);
    const ph = wavePh(); gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, ph.ub); gl.uniform1fv(u.uGp, ph.gp); gl.uniform1fv(u.uNFp, NF.ph); gl.uniform1fv(u.uNFg, NF.gp);
    gl.uniform4fv(u.uWk0, [WK.u0[0] - Dx - FOAM.ox, WK.u0[1] - Dz - FOAM.oz, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform4fv(u.uWk2, WK.u2); gl.uniform4fv(u.uWk3, WK.u3); wakeTU(u, Dx + FOAM.ox, Dz + FOAM.oz);
    gl.uniform4f(u.uFB, pb[0] - FOAM.ox, pb[1] - FOAM.oz, qx - FOAM.ox, qz - FOAM.oz); gl.uniform4f(u.uFH, pb[2], pb[3], fx, fz);
    gl.uniform4f(u.uHull, (VG.stern - VG.bow) || 6, (VG.beam || 2.4) / 2, -(VG.bow || -2.2), VG.stern || 3.1); gl.uniform4f(u.uFSp, (WK.kn || 0) * 0.5144, WK.Fr || 0, BOAT.planing ? 1 : 0, dt);
    attr(0, SKYQ, 2); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); FOAM.r = w; FOAM.pB = [qx, qz, fx, fz]; FOAM.ms = FOAM.ms * 0.9 + (performance.now() - t1) * 0.1; FOAM.sh = [sx, sz]; FOAM.n++;
    if (FOAM.log && FOAM.log.length < 400){   // (a trace for the tests: G3._debug.foam.log = []; counts the foam in a 64 x 64 block round the boat and its distinct births)
      const i = Math.max(0, Math.min(N - 64, Math.floor((qx - FOAM.ox) / px) - 32)), j = Math.max(0, Math.min(N - 64, Math.floor((qz - FOAM.oz) / px) - 32)), b4 = new Uint8Array(64 * 64 * 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, FOAM.fb[FOAM.r]); gl.readPixels(i, j, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, b4); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      let cnt = 0; const g = new Set(); for (let k = 0; k < 64 * 64; k++) if (b4[k * 4] > 64){ cnt++; g.add(Math.round(b4[k * 4 + 1] / b4[k * 4] * 255)); }
      FOAM.log.push([+t.toFixed(2), sx, sz, +reb[0].toFixed(3), +FOAM.now[0].toFixed(3), cnt, g.size, Math.min(...g), Math.max(...g)]); }
  }
  // the sea shader reads the map (unit 7) where it is on
  function foamBind(u){
    if (u.uFoamOn == null) return; const on = foamLive(); gl.uniform1f(u.uFoamOn, on ? 1 : 0); if (!on) return;
    gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, FOAM.tex[FOAM.r]); gl.uniform1i(u.uFoam, 7); gl.activeTexture(gl.TEXTURE0);
    gl.uniform4fv(u.uFoamRect, [FOAM.ox - RO.x, FOAM.oz - RO.z, 1 / FOAM.M, FOAM.M]); gl.uniform4fv(u.uFoamT, [FOAM.now[0], FOAM.win[0], FOAM.tau[0], 0]); gl.uniform4fv(u.uFoamTc, [FOAM.now[1], FOAM.win[1], FOAM.tau[1], 0]);
    gl.uniform2f(u.uFoamG, NF.D[0] - FOAM.G[0], NF.D[1] - FOAM.G[1]); gl.uniform2f(u.uFoamW, NF.D[0] - FOAM.C[0], NF.D[1] - FOAM.C[1]);
  }

  // ---------- the sea state over the near terrain and the whole map ----------
  // Two textures, as SEA_STATE reads them: n (32 x 32 over the near terrain) and w (128 x 128 over the map). Each holds the root of the
  // fetch for a 10 degree sector per pixel, worked out a slice per frame and kept per sector, so a turning wind needs only the new sector.
  const SSRT = Math.sqrt(FETCH.open);
  let SSK = [0, 1], SSU = 0;   // the sectors either side of the wind, and the blend between them
  // brect, sec, sw, job: what is being worked out; rect, tex, cpu, k: what is shown. The shown texture stays until the new one is ready,
  // so when the near terrain moves the sea never falls back to the coarse map for a moment (no sudden change in the waves)
  function ssLevel(n, unit){ return {n, unit, brect:null, rect:null, sec:new Map(), sw:null, tex:null, cpu:null, k:[-1, -1], job:null, on:false}; }
  const SSL = {n:ssLevel(32, 4), w:ssLevel(128, 5)};
  function ssRect(L){ return L === SSL.n ? (NEARM ? [NEARM.x0, NEARM.z0, NEARM.sx] : null) : TERR ? [TERR.x0, TERR.z0, TERR.sx] : null; }   // the wide one follows the far terrain
  function ssWork(L, until){
    const R = ssRect(L); if (!R) return;
    let fresh = false; if (!L.brect || L.brect[0] !== R[0] || L.brect[1] !== R[1] || L.brect[2] !== R[2]){ L.brect = R; L.sec.clear(); L.sw = null; L.job = null; fresh = true; }
    const n = L.n, px = R[2] / n, at = i => ({x:(R[0] + (i % n + 0.5) * px) / 1000, y:(R[1] + (Math.floor(i / n) + 0.5) * px) / 1000});
    if (!L.sw){ L.sw = new Uint8Array(n * n); for (let i = 0; i < n * n; i++) L.sw[i] = Math.round(clamp(swellFactor(at(i)), 0, 1) * 255); }
    while (performance.now() < until){
      if (!L.job){ const k = SSK.find(q => !L.sec.has(q)); if (k === undefined) break; L.job = {k, i:0, a:new Uint8Array(n * n)}; }
      const J = L.job, p = at(J.i), r = L === SSL.n ? fetchSector(p, J.k) : Math.sqrt(fetchAt(p, J.k * FETCH.sec));
      J.a[J.i] = Math.round(clamp(r / SSRT, 0, 1) * 255);
      if (++J.i >= n * n){ L.sec.set(J.k, J.a); L.job = null; for (const q of L.sec.keys()) if (L.sec.size > 6 && !SSK.includes(q)) L.sec.delete(q); }
    }
    if (fresh) L.fresh = true;
    if (L.sec.has(SSK[0]) && L.sec.has(SSK[1]) && (L.k[0] !== SSK[0] || L.k[1] !== SSK[1] || L.fresh)){
      const A = L.sec.get(SSK[0]), B = L.sec.get(SSK[1]), px4 = new Uint8Array(n * n * 4);
      for (let i = 0; i < n * n; i++){ px4[i * 4] = A[i]; px4[i * 4 + 1] = B[i]; px4[i * 4 + 2] = L.sw[i]; px4[i * 4 + 3] = 255; }
      L.tex = L.tex || gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.tex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, px4);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
      L.cpu = px4; L.k = [SSK[0], SSK[1]]; L.rect = L.brect; L.fresh = false; L.on = true;
    }
  }
  // a slice per frame, more when frames are slow (so a slow machine is not left waiting for many frames)
  function ssStep(rdt){ const until = performance.now() + clamp(rdt * 60, 1.5, 25); ssWork(SSL.n, until); ssWork(SSL.w, until); }
  // the blend between a texture's two sectors: while a new sector is worked out, hold the one it shares with the old pair
  function ssBlend(L){ return L.k[0] === SSK[0] && L.k[1] === SSK[1] ? SSU : L.k[1] === SSK[0] ? 1 : L.k[0] === SSK[1] ? 0 : SSU; }
  // a texture as the GPU reads it (linear, clamped to the edge), 0-1 per channel
  function ssTex(L, x, z, out){
    const n = L.n, R = L.rect, gx = clamp((x - R[0]) / R[2] * n - 0.5, 0, n - 1), gy = clamp((z - R[1]) / R[2] * n - 0.5, 0, n - 1), i = Math.min(n - 2, Math.floor(gx)), j = Math.min(n - 2, Math.floor(gy)), fx = gx - i, fy = gy - j, T = L.cpu;
    for (let c = 0; c < 3; c++){ const a = (j * n + i) * 4 + c, b = a + n * 4; out[c] = ((T[a] * (1 - fx) + T[a + 4] * fx) * (1 - fy) + (T[b] * (1 - fx) + T[b + 4] * fx) * fy) / 255; }
    return out;
  }
  // the local sea at (x, z), as seaAt in the shaders: wind sea height, swell height, how grown the sea is, the root of the fetch
  const SST_A = [0, 0, 0], SST_B = [0, 0, 0];
  function ssAt(x, z){
    if (!SSL.w.on) return WV.loc;
    const W = ssTex(SSL.w, x, z, SST_A); let r = lerp(W[0], W[1], ssBlend(SSL.w)), sf = W[2];
    const N = SSL.n; if (N.on){ const R = N.rect, ux = (x - R[0]) / R[2], uz = (z - R[1]) / R[2], e = sstep(0, 0.06, Math.min(ux, uz, 1 - ux, 1 - uz)); if (e > 0){ const T = ssTex(N, x, z, SST_B); r = lerp(r, lerp(T[0], T[1], ssBlend(N)), e); sf = lerp(sf, T[2], e); } }
    r *= SSRT; return [Math.min(WV.cap, WV.C * r), WV.swHs * sf, clamp(2 * Math.log(Math.max(r, 1)) / WV.lnFcap, 0, 1), r];
  }
  // the sea's height at (x, z) as the wave patch draws it: the same waves with the local heights, groups, fading and the Gerstner shift
  // undone (two steps back to the rest point that moved there). seaHFast skips the undoing (the wake, which lies across the waves anyway).
  const SEA_D = [0, 0, 0, 0];
  function seaDisp(x, z, t, S, fade){
    let dx = 0, dy = 0, dz = 0, dn = 0; const ren = 1 / Math.sqrt(Math.max(1 - 2 * S[2] * (1 - S[2]) * (1 - WV.dot), 0.05)), cell = 2 * HALF / NP;
    for (let i = 0; i < WV.list.length; i++){
      const c = WV.list[i], att = sstep(2.5, 5, 2 * Math.PI / (c.k * cell)); if (att <= 0) continue;
      const am0 = c.swell ? S[1] * c.wo : S[0] * (S[2] * c.wo + (1 - S[2]) * c.wy) * ren, Q = c.swell ? 0.3 : Math.min(WV.steep / (10 * c.k * am0 + 1e-4), 1);
      const grp = 0.62 + 0.38 * Math.sin((x * c.Dx + z * c.Dz) * c.k * 0.083 + (x * c.Dz - z * c.Dx) * c.k * 0.041 - c.om * t * 0.5 + i * 2.59 - NF.gp[i]);
      const am = am0 * grp * att * fade, f = c.k * (c.Dx * x + c.Dz * z) - c.om * t + c.ph - NF.ph[i], co = Math.cos(f), h = am * Math.sin(f);
      dx += Q * am * c.Dx * co; dz += Q * am * c.Dz * co; dy += h; if (i >= 4 && i < 10) dn += h;
    }
    SEA_D[0] = dx; SEA_D[1] = dy; SEA_D[2] = dz; SEA_D[3] = dn; return SEA_D;   // (dn: the short wind waves that ride with her, the near field)
  }
  function seaFade(x, z){ const st = 2 * HALF / NP, ox = Math.round(bv.x / st) * st, oz = Math.round(bv.z / st) * st; return 1 - sstep(0.6, 1, Math.max(Math.abs(x - ox), Math.abs(z - oz)) / HALF); }
  function seaH(x, z, t){
    const tide = env.tide || 0, fade = seaFade(x, z); if (fade <= 0 || !WV.list.length){ SEA_D[3] = 0; return tide; }
    const S = ssAt(x, z); let px = x, pz = z;
    for (let it = 0; it < 2; it++){ const D = seaDisp(px, pz, t, S, fade); px = x - D[0]; pz = z - D[2]; }
    return tide + seaDisp(px, pz, t, S, fade)[1];
  }
  function seaHFast(x, z, t){ const tide = env.tide || 0, fade = seaFade(x, z); return fade <= 0 || !WV.list.length ? tide : tide + seaDisp(x, z, t, ssAt(x, z), fade)[1]; }

