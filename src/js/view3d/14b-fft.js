  // ---------- the short sea from FFT tiles (Bølgene B1, docs/planer/bolgene.md, 12.11.2026) ----------
  // A worker turns the wind sea shorter than the long waves' cut (some 32 m) into two tiles of real waves (core/03k-hav-fft.js: JONSWAP
  // spread over the directions, thousands of waves each at its own speed), every frame, and they go up as two float textures with their
  // mip levels (units 8 and 9). In B1 only the sea's light reads them: the normals, the glitter and the glow through the crests come from
  // the tiles where waves 4-9 gave them (SEA_FS), so the crests are short and staggered and the stripes and the grid in the glitter go;
  // the sea's shape, the boat in it and the whitecaps are still the Gerstner waves (B2 and B3). The tiles ride in the near field's frame
  // as the short waves do (P - NF.D), so the water passes the hull at her real speed, and run on the waves' clock (t, real seconds), so
  // they never race with the game's 6x. The worker gets the time the frame after next will show (FFT.lat ahead), and its result goes up
  // when it comes; it is never asked again before it has answered, so it never queues. WebGL 2 only (RGBA16F with the levels from the
  // worker, no extension needed); elsewhere, with «#fft0» in the address, or if the worker fails, the sea is as before.
  const FFT = {on:!/fft0/.test(location.hash), ok:false, w:null, busy:false, tex:[null, null, null], have:false, cpu:null, cpuL:-1, st:[[0, 0, 0], [0, 0, 0]], key:'', keyT:-1e9, sentT:0, sentAt:0, lat:0.02, ms:0, up:0, n:0, why:'', bufs:null, A0:1, aniso:null};
  const FFTT = HFFT.tiles;
  function fftWorker(){
    const src = [hfftHash, hfftLgam, hfftPlan, hfft1, hfft2, hfftSpec, hfftFrame, hfftMips].map(f => f.toString()).join('\n') + '\n' +
      'const len = N => { let s = 0; for (let n = N; n >= 1; n >>= 1) s += n * n * 4; return s; };\n' +
      'let T = null, W = null;\n' +
      'onmessage = e => { const D = e.data; try {\n' +
      '  if (D.tiles){ T = D.tiles.map(t => Object.assign({}, t)); W = T.map((t, k) => { const n2 = t.N * t.N; return {plan:hfftPlan(t.N), re1:new Float64Array(n2), im1:new Float64Array(n2), re2:new Float64Array(n2), im2:new Float64Array(n2), re3:k ? null : new Float64Array(n2), im3:k ? null : new Float64Array(n2)}; }); }\n' +
      '  if (D.P) for (const t of T) hfftSpec(t, D.P);\n' +
      '  if (!T || !T[0].S){ postMessage({t:D.t, none:1}); return; }\n' +
      '  const t0 = performance.now(), bufs = D.bufs || T.map(t => new Float32Array(len(t.N)).buffer).concat([new Float32Array(len(T[0].N)).buffer]), st = [];\n' +
      '  for (let k = 0; k < T.length; k++) st.push(hfftFrame(T[k], D.t, new Float32Array(bufs[k]), W[k], k ? null : new Float32Array(bufs[T.length])));\n' +
      '  postMessage({t:D.t, st, bufs, ms:performance.now() - t0}, bufs);\n' +
      '} catch (err){ postMessage({err:String(err && err.message || err)}); } };\n';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = e => fftGot(e.data);
    w.onerror = e => { e.preventDefault && e.preventDefault(); fftOff('arbeider: ' + (e.message || e)); };
    w.postMessage({tiles:FFTT.map(t => ({N:t.N, L:t.L, lo:t.lo, hi:t.hi, seed:t.seed}))});
    return w;
  }
  function fftOff(why){
    FFT.why = why; FFT.on = false; FFT.ok = false; FFT.have = false; try { FFT.w && FFT.w.terminate(); } catch (e){} FFT.w = null;
    for (let k = 0; k < 3; k++) if (FFT.tex[k]){ gl.deleteTexture(FFT.tex[k]); FFT.tex[k] = null; }
    if (typeof cloudErr === 'function') cloudErr('3D FFT-sjø av: ' + why + ' · ' + GPU, 'view3d fft', '');
  }
  function fftInit(){
    if (FFT.ok || !FFT.on) return FFT.ok;
    if (!GL2){ FFT.on = false; FFT.why = 'WebGL 1'; return false; }
    try {
      FFT.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      for (let k = 0; k < 3; k++){ const N = FFTT[k % 2].N, lv = Math.log2(N) + 1, tx = gl.createTexture(); gl.activeTexture(gl.TEXTURE8 + k); gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.texStorage2D(gl.TEXTURE_2D, lv, gl.RGBA16F, N, N);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        if (FFT.aniso) gl.texParameterf(gl.TEXTURE_2D, FFT.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(FFT.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1));
        FFT.tex[k] = tx; }
      gl.activeTexture(gl.TEXTURE0);
      FFT.w = fftWorker(); FFT.ok = true;
    } catch (e){ fftOff(String(e && e.message || e)); }
    return FFT.ok;
  }
  // The spectrum's parameters at the boat, sent again when they have moved enough to see (at most twice a second). One JONSWAP with
  // its peak at the boat's own fetch (WV.Tb), not the Gerstner bands' blend of a young sea (1 km of fetch) and the grown one: weighted
  // by height, the young one's peak at 2-3 m put a third of the sea's energy into waves under 7.5 m, twice Cox and Munk's slopes and a
  // grey, washed-out glitter (first pictures, 12.11.2026). The shader scales the tiles to the local sea's height (fe2 / A0) as before.
  function fftParams(t){
    if (!WV.Tb) return null;
    const dx = Math.sin(WV.dir), dz = -Math.cos(WV.dir), L0 = 9.81 * WV.Tb * WV.Tb / (2 * Math.PI);
    const key = [Math.round(WV.ia * 50), Math.round(WV.Tb * 40), Math.round(WV.dir * 120)].join(',');
    if (key === FFT.key || t - FFT.keyT < 0.5) return null;
    FFT.key = key; FFT.keyT = t; const sp = hfftSp(L0);
    return {dx, dz, so:sp, sy:sp, dv:1, ren:1, ia:WV.ia, wpB:2 * Math.PI / WV.Tb, lc:Math.sqrt(WL[3] * WL[4])};
  }
  function fftGot(D){
    FFT.busy = false;
    if (D.err){ fftOff('arbeider: ' + D.err); return; }
    if (D.none || !FFT.ok) return;
    const now = performance.now(), t1 = performance.now();
    for (let k = 0; k < 3; k++){ const N = FFTT[k % 2].N, a = new Float32Array(D.bufs[k]); gl.activeTexture(gl.TEXTURE8 + k); gl.bindTexture(gl.TEXTURE_2D, FFT.tex[k]);
      let o = 0, lv = 0; for (let n = N; n >= 1; n >>= 1, lv++){ gl.texSubImage2D(gl.TEXTURE_2D, lv, 0, 0, n, n, gl.RGBA, gl.FLOAT, a, o); o += n * n * 4; } }
    gl.activeTexture(gl.TEXTURE0);
    fftKeep(new Float32Array(D.bufs[2])); fftKeepS(D.bufs);
    FFT.bufs = D.bufs; FFT.st = D.st; FFT.have = true; FFT.n++;
    FFT.ms = FFT.ms ? FFT.ms * 0.9 + D.ms * 0.1 : D.ms; FFT.up = FFT.up ? FFT.up * 0.9 + (performance.now() - t1) * 0.1 : performance.now() - t1;
    // how far ahead to ask: the time a request takes to come back, as the waves' clock counts it
    FFT.lat = clamp(FFT.lat * 0.9 + ((now - FFT.sentAt) / 1000) * 0.1, 0.005, 0.25);
  }
  // B2, the sea's shape (12.11.2026): the first tile's displacement and height (unit 10) lift the wave patch in the vertex shader where it
  // can read textures there (SST_VS; the phone keeps waves 4-9's Gerstner shape), at the mip level whose texel is a grid cell (fvLod), so
  // what the grid cannot hold is filtered out, as the Gerstner waves fade under 2.5 cells; seaDisp reads the same two levels from a copy
  // here, so the boat, the buoys and the gear lie in the waves that are drawn. The second tile (7.5-0.8 m) is below the grid: light only.
  const fvLod = () => Math.max(0, Math.log2((2 * HALF / NP) / (FFTT[0].L / FFTT[0].N)));
  function fftKeep(a){
    const N = FFTT[0].N, l0 = Math.min(Math.floor(fvLod()), Math.log2(N) - 1); let o = 0, n = N;
    for (let l = 0; l < l0; l++){ o += n * n * 4; n >>= 1; }
    const len = n * n * 4 + (n >> 1) * (n >> 1) * 4;
    if (!FFT.cpu || FFT.cpu.length !== len) FFT.cpu = new Float32Array(len);
    FFT.cpu.set(a.subarray(o, o + len)); FFT.cpuL = l0;
  }
  // B3: the two tiles' trace and height at level 0 (tr, h per cell), for FOAM.capAt (the spray from the crests that break, sea3d)
  function fftKeepS(bufs){
    if (!FFT.cs) FFT.cs = FFTT.map(T => new Float32Array(T.N * T.N * 2));
    for (let k = 0; k < 2; k++){ const a = new Float32Array(bufs[k]), c = FFT.cs[k], n2 = FFTT[k].N * FFTT[k].N; for (let i = 0; i < n2; i++){ c[i * 2] = a[i * 4 + 2]; c[i * 2 + 1] = a[i * 4 + 3]; } }
  }
  const fftFoam = () => FFT.on && FFT.ok && FFT.have && !!FFT.cs;
  // the sum of both tiles' (tr, h) at a world point, bilinear at level 0 as the shaders read them up close
  const FFT_S = [0, 0];
  function fftTrH(x, z){
    FFT_S[0] = FFT_S[1] = 0;
    for (let k = 0; k < 2; k++){ const n = FFTT[k].N, L = FFTT[k].L, A = FFT.cs[k], qx = x - NF.O[k * 2], qz = z - NF.O[k * 2 + 1];
      let u = ((qx / L) * n - 0.5) % n, v = ((qz / L) * n - 0.5) % n; if (u < 0) u += n; if (v < 0) v += n;
      const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, i1 = (i0 + 1) % n, j1 = (j0 + 1) % n;
      for (let q = 0; q < 2; q++){ const a = A[(j0 * n + i0) * 2 + q], b = A[(j0 * n + i1) * 2 + q], c = A[(j1 * n + i0) * 2 + q], d = A[(j1 * n + i1) * 2 + q];
        FFT_S[q] += (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv; } }
    return FFT_S;
  }
  // is the shape from the tile on (the vertex shader takes it only with textures there, the full sea, and data)
  const fftShape = () => FFT.on && FFT.ok && FFT.have && FFT.cpu && SST_VS && PS && !PS.lite && !PS.basic && !PS.far;
  // the tile's (Dx, Dz, h) at a world point, trilinear between the two kept levels as the GPU samples them (FFT_D)
  const FFT_D = [0, 0, 0];
  function fftAt(x, z){
    const N = FFTT[0].N, L = FFTT[0].L, l0 = FFT.cpuL, f = clamp(fvLod() - l0, 0, 1), qx = x - NF.O[0], qz = z - NF.O[1], A = FFT.cpu;
    FFT_D[0] = FFT_D[1] = FFT_D[2] = 0;
    for (let q = 0; q < 2; q++){ const n = N >> (l0 + q), base = q ? (N >> l0) * (N >> l0) * 4 : 0, w = q ? f : 1 - f; if (w <= 0) continue;
      // (texel centres at (i + 0.5) L / n, as the GPU has them; the tile wraps)
      let u = ((qx / L) * n - 0.5) % n, v = ((qz / L) * n - 0.5) % n; if (u < 0) u += n; if (v < 0) v += n;
      const i0 = Math.floor(u), j0 = Math.floor(v), fu = u - i0, fv = v - j0, i1 = (i0 + 1) % n, j1 = (j0 + 1) % n;
      for (let k = 0; k < 3; k++){ const a = A[base + (j0 * n + i0) * 4 + k], b = A[base + (j0 * n + i1) * 4 + k], c = A[base + (j1 * n + i0) * 4 + k], d = A[base + (j1 * n + i1) * 4 + k];
        FFT_D[k] += w * ((a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv); } }
    return FFT_D;
  }
  // the tiles' amplitude at the boat (A0: the squared Gerstner amplitudes of waves 4-9 for Hs = 1, as the shaders and seaDisp sum them)
  function fftA0(){ let A0 = 0; const dv = WV.loc[2], ren = 1 / Math.sqrt(Math.max(1 - 2 * dv * (1 - dv) * (1 - WV.dot), 0.05));
    for (let i = 4; i < 10; i++){ const c = WV.list[i]; if (!c) continue; const a = (dv * c.wo + (1 - dv) * c.wy) * ren; A0 += a * a; } return Math.max(A0, 1e-8); }
  // (tests only, B4: the tiles at a given world time on this thread, from the last spectrum sent, so two pages can be compared at one instant)
  function fftSyncAt(tw){
    if (!FFT.P) return false;
    const T = FFTT.map(t => Object.assign({}, t)), outs = [];
    for (let k = 0; k < 2; k++){ const n2 = T[k].N * T[k].N, W = {plan:hfftPlan(T[k].N), re1:new Float64Array(n2), im1:new Float64Array(n2), re2:new Float64Array(n2), im2:new Float64Array(n2), re3:new Float64Array(n2), im3:new Float64Array(n2)};
      hfftSpec(T[k], FFT.P); const o = new Float32Array(hfftLen(T[k].N)), d = k ? null : new Float32Array(hfftLen(T[k].N)); FFT.st[k] = hfftFrame(T[k], tw, o, W, d); outs.push(o); if (d) outs.push(d); }
    fftKeep(outs[1]); fftKeepS([outs[0].buffer, outs[2].buffer]); FFT.syncT = tw; return true;
  }
  // every frame (24-cinema.js, after the waves): ask for the tiles at the time they will be shown, if the worker is free
  function fftStep(t){
    if (!FFT.on || !PS || PS.basic || PS.far) return;
    if (!fftInit() || !FFT.w) return;
    if (FFT.busy){ if (performance.now() - FFT.sentAt > 3000) FFT.busy = false; else return; }   // (a lost answer does not stop it)
    const P = fftParams(t), msg = {t:t + WV.dT + FFT.lat, P};   // (B4: the world's clock in real seconds, the same for everyone)
    if (P) FFT.P = P;
    if (FFT.bufs){ msg.bufs = FFT.bufs; FFT.bufs = null; }
    FFT.busy = true; FFT.sentAt = performance.now(); FFT.sentT = t;
    FFT.w.postMessage(msg, msg.bufs || []);
  }
  // the sea program's uniforms: the tiles on units 8 and 9, where each one's lookup starts near the camera (a whole number of tiles, so
  // the coordinates stay small and the mip level never jumps at a seam), the tiles' sizes, on/off and the tiles' amplitude at the boat
  // (A0: the sum of the squared Gerstner amplitudes of waves 4-9 for Hs = 1, as the shader sums them at every pixel, so the tiles scale
  // to the local sea, its height, how grown it is, the shoaling and the stream), and the tiles' statistics for the roughness they lose
  // to the pixel and for the crests' sharpening
  function fftBind(u, eye){
    if (u.uFftP == null) return;
    const on = FFT.on && FFT.ok && FFT.have;
    if (u.uFvP != null) gl.uniform4f(u.uFvP, 0, 0, 0, 1);
    if (!on){ gl.uniform4f(u.uFftP, 0, 0, 0, 1); return; }
    const A0 = fftA0();
    // (B4: each tile lies in the world, less the boat's own offset for it, NF.O; the shader looks it up at P - uNFD - o, so o is that
    // offset in the shader's frame, moved by whole tiles to near the camera)
    const qx = eye[0] - RO.x - NF.D[0], qz = eye[2] - RO.z - NF.D[1], o = FFTT.map((T, k) => { const bx = NF.O[k * 2] - RO.x - NF.D[0], bz = NF.O[k * 2 + 1] - RO.z - NF.D[1];
      return [bx + T.L * Math.round((qx - bx) / T.L), bz + T.L * Math.round((qz - bz) / T.L)]; });
    for (let k = 0; k < 2; k++){ gl.activeTexture(gl.TEXTURE8 + k); gl.bindTexture(gl.TEXTURE_2D, FFT.tex[k]); gl.uniform1i(k ? u.uFft2 : u.uFft1, 8 + k); }
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform4f(u.uFftO, o[0][0], o[0][1], o[1][0], o[1][1]);
    gl.uniform4f(u.uFftP, 1 / FFTT[0].L, 1 / FFTT[1].L, 1, A0);
    if (u.uFvP != null && fftShape()){ gl.activeTexture(gl.TEXTURE10); gl.bindTexture(gl.TEXTURE_2D, FFT.tex[2]); gl.uniform1i(u.uFftD, 10); gl.activeTexture(gl.TEXTURE0);
      gl.uniform4f(u.uFvO, o[0][0], o[0][1], fvLod(), 0); gl.uniform4f(u.uFvP, 1 / FFTT[0].L, 0, 1, A0); gl.uniform4f(u.uFvQ, 0, 0, Math.hypot(FFT.st[0][1], FFT.st[1][1]), 0); }
    const s = FFT.st; gl.uniform4f(u.uFftQ, s[0][0], s[1][0], Math.hypot(s[0][1], s[1][1]), s[0][2] + s[1][2]);
  }
