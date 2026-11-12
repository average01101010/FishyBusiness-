// The FFT tiles of the short sea (core/03k-hav-fft.js, Bølgene B1, 12.11.2026): the transform against a direct sum of the waves, Parseval
// (the field's mean square is the sum of the amplitudes'), the spectrum's energy in the band against JONSWAP's integral over it, a real
// field (the imaginary parts the packing hides are the second field, so a wrong h(-k) would show as a field that differs from the sum),
// the mip levels, and the same tile from the same seed.
export default function (t){
  const K = t.K, {hfftPlan, hfftSpec, hfftFrame, hfftLen} = K;
  // the spectrum constants as specW has them (14-sea.js), for a peak L0
  const WL = [96, 67, 49, 36.5, 27.5, 20.5, 15.3, 11.4, 8.6, 6.4], JW = WL.map(L => Math.sqrt(2 * Math.PI * 9.81 / L));
  const JDW = JW.map((w, i) => ((JW[Math.min(9, i + 1)] - JW[Math.max(0, i - 1)]) / (i === 0 || i === 9 ? 1 : 2)));
  const spec = L0 => { const wp = Math.sqrt(2 * Math.PI * 9.81 / L0), lgs = w => { const sg = w <= wp ? 0.07 : 0.09; return -5 * Math.log(w) - 1.25 * (wp / w) ** 4 + Math.log(3.3) * Math.exp(-((w - wp) ** 2) / (2 * sg * sg * wp * wp)); };
    const lg = JW.map((w, i) => lgs(w) + Math.log(JDW[i])), m = Math.max(...lg), wv = lg.map(v => Math.exp(0.5 * (v - m))), n = Math.sqrt(wv.reduce((a, c) => a + c * c, 0)) * 2.828; return {wp, m, n, lgs}; };
  // hfftSp: the whole spectrum's integral is 1/16 (Hs = 1), also for a young sea whose peak is shorter than specW's shortest band
  for (const L0 of [3, 12, 60, 150]){ const c = K.hfftSp(L0); let I = 0; for (let q = 0; q < 20000; q++){ const w = 0.2 * c.wp + q * 0.002 * c.wp, sg = w <= c.wp ? 0.07 : 0.09;
      I += Math.exp(-5 * Math.log(w) - 1.25 * (c.wp / w) ** 4 + Math.log(3.3) * Math.exp(-((w - c.wp) ** 2) / (2 * sg * sg * c.wp * c.wp)) - c.m) / (2 * c.n * c.n) * 0.002 * c.wp; }
    t.near(I * 16, 1, 0.01, 'the spectrum with its peak at ' + L0 + ' m holds Hs = 1'); }
  const so = spec(60), sy = spec(20), P = {dx:0.6, dz:-0.8, so, sy, dv:0.4, ren:1.1, ia:1.4, wpB:Math.sqrt(2 * Math.PI * 9.81 / 30), lc:31.7};
  // a small tile, so the direct sum is quick
  const T = {N:16, L:30, lo:3, hi:0, seed:7}, S = hfftSpec(T, P), N = T.N, n2 = N * N, dk = 2 * Math.PI / T.L;
  const W = {plan:hfftPlan(N), re1:new Float64Array(n2), im1:new Float64Array(n2), re2:new Float64Array(n2), im2:new Float64Array(n2), re3:new Float64Array(n2), im3:new Float64Array(n2)}, out = new Float32Array(hfftLen(N)), outD = new Float32Array(hfftLen(N));
  const tt = 3.7, st = hfftFrame(T, tt, out, W, outD);
  // the direct sum: h(x) = sum_k htilde(k) e^{ikx}
  const ht = (i, j) => { const c = j * N + i, cm = ((N - j) % N) * N + (N - i) % N, wt = S.w[c] * tt, co = Math.cos(wt), si = Math.sin(wt), a = S.h0r[c], b = S.h0i[c], a2 = S.h0r[cm], b2 = -S.h0i[cm];
    return [a * co - b * si + a2 * co + b2 * si, a * si + b * co + b2 * co - a2 * si]; };
  let worst = 0, imag = 0;
  for (const [px, pz] of [[0, 0], [3, 11], [15, 15], [7, 2], [9, 13]]){
    let h = 0, hi = 0, hx = 0, hz = 0, tr = 0, Dx = 0, Dz = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){ const n = i < N / 2 ? i : i - N, m = j < N / 2 ? j : j - N, kx = n * dk, kz = m * dk, k = Math.hypot(kx, kz);
      const [r, im] = ht(i, j), ph = 2 * Math.PI * (i * px + j * pz) / N, c = Math.cos(ph), s = Math.sin(ph), er = r * c - im * s, ei = r * s + im * c;
      h += er; hi += ei; hx += -kx * ei; hz += -kz * ei; tr += k * er; if (k > 0){ Dx += kx / k * ei; Dz += kz / k * ei; } }
    const o = (pz * N + px) * 4; worst = Math.max(worst, Math.abs(out[o] - hx), Math.abs(out[o + 1] - hz), Math.abs(out[o + 2] - tr), Math.abs(out[o + 3] - h), Math.abs(outD[o] - Dx), Math.abs(outD[o + 1] - Dz), Math.abs(outD[o + 2] - h)); imag = Math.max(imag, Math.abs(hi)); }
  t.ok(imag < 1e-6, 'the field is real (the imaginary part of the direct sum is ' + imag.toExponential(1) + ')');
  t.ok(worst < 2e-5, 'the transform equals the direct sum of the waves for the slopes, the trace, the height and the displacement (worst ' + worst.toExponential(1) + ')');
  // the displacement's sign: for one wave h = A cos(kx), D = A sin(kx), so x - Q D pulls the points toward the crest (Gerstner)
  { const T1 = {N:16, L:16, lo:0.1, hi:100, seed:1, S:{h0r:new Float32Array(256), h0i:new Float32Array(256), w:new Float32Array(256)}}; T1.S.h0r[1] = 0.25; T1.S.h0r[15] = 0.25; T1.S.w[1] = T1.S.w[15] = 0;
    const o1 = new Float32Array(hfftLen(16)), d1 = new Float32Array(hfftLen(16)); hfftFrame(T1, 0, o1, W, d1);
    t.near(d1[4 * 4], Math.sin(2 * Math.PI * 4 / 16), 1e-5, 'one wave h = cos(kx): D = sin(kx), so x - Q D pulls toward the crest'); t.near(o1[3], 1, 1e-5, 'and its height at the crest is 1'); }
  // hfftCapFit: on a smooth normal field of unit spread (the second tile empty, no grain) the fitted threshold is the normal quantile itself
  { const n = 128, o1 = new Float32Array(n * n * 4), o2 = new Float32Array(16 * 16 * 4); let r = 7;
    const rnd = () => { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; return (r + 0.5) / 4294967296; };
    // (a smooth normal field, the sum of 96 long waves of random direction and phase, so reading it between the texels does not narrow it)
    const W = []; for (let q = 0; q < 96; q++){ const ang = rnd() * 6.2831853, kk = 2 * Math.PI * (2 + rnd() * 5) / n; W.push([Math.cos(ang) * kk, Math.sin(ang) * kk, rnd() * 6.2831853]); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){ let v = 0; for (const [kx, kz, p] of W) v += Math.sin(kx * i + kz * j + p); o1[(j * n + i) * 4 + 2] = v / Math.sqrt(48); }
    // the property: the fitted threshold for a share W is the field's own quantile, read between the texels as the shaders read it
    // (worked out here on its own: 200 000 reads at random places, sorted), for W = 5 %, 1 % and 0.2 %
    const c = K.hfftCapFit(o1, n, 1, o2, 16, 0, 0, 40000), rd = []; for (let q = 0; q < 200000; q++){ const u = rnd() * n, w = rnd() * n, i0 = Math.floor(u), j0 = Math.floor(w), fu = u - i0, fw = w - j0, i1 = (i0 + 1) % n, j1 = (j0 + 1) % n, g = (a, b) => o1[(b * n + a) * 4 + 2];
      rd.push((g(i0, j0) * (1 - fu) + g(i1, j0) * fu) * (1 - fw) + (g(i0, j1) * (1 - fu) + g(i1, j1) * fu) * fw); }
    rd.sort((a, b) => a - b);
    const zq = w => { let z = Math.sqrt(-2 * Math.log(w)); return z - (2.515517 + 0.802853 * z + 0.010328 * z * z) / (1 + 1.432788 * z + 0.189269 * z * z + 0.001308 * z * z * z); };
    let worst = 0; for (const W of [0.05, 0.01, 0.002]){ const z = zq(W), th = c[0] + c[1] * z + c[2] * z * z, e = rd[Math.floor(rd.length * (1 - W))]; worst = Math.max(worst, Math.abs(th - e)); }
    t.ok(worst < 0.08, 'the threshold fitted to a field is its own quantile read between the texels, at 5, 1 and 0.2 % (worst ' + worst.toFixed(3) + ')'); }
  // Parseval: the mean of h^2 over the tile is the sum of |htilde|^2
  let sh = 0; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){ const [r, im] = ht(i, j); sh += r * r + im * im; }
  t.near(st[2], sh, sh * 1e-4, 'the mean square height is the sum of the amplitudes squared (Parseval)');
  // the mip levels: level 1's first cell is the mean of level 0's four
  const l1 = n2 * 4; t.near(out[l1 + 3], 0.25 * (out[3] + out[7] + out[N * 4 + 3] + out[N * 4 + 7]), 1e-6, 'the first mip level is the mean of the four cells under it');
  // the same seed gives the same tile
  const S2 = hfftSpec({N:16, L:30, lo:3, hi:0, seed:7}, P); t.ok(S2.h0r.every((v, i) => v === S.h0r[i]), 'the same seed gives the same amplitudes');
  // the energy in the band: the expected variance sum F dk^2 against the integral of S(w) over the band, on a big, fine tile (the
  // discrete ring of wavenumbers is coarse for the longest waves, so within 8 %)
  const TB = {N:256, L:300, lo:2, hi:0, seed:3}, SB = hfftSpec(TB, P), dkB = 2 * Math.PI / TB.L; let ev = 0;
  for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++){ const n = i < 128 ? i : i - 256, m = j < 128 ? j : j - 256, k = Math.hypot(n * dkB, m * dkB), w = Math.sqrt(9.81 * k);
    if (k < 2 * Math.PI / P.lc || k >= 2 * Math.PI / TB.lo) continue;
    const s1 = P.ren * (P.dv * Math.exp(0.5 * (so.lgs(w) - so.m)) / (Math.SQRT2 * so.n) + (1 - P.dv) * Math.exp(0.5 * (sy.lgs(w) - sy.m)) / (Math.SQRT2 * sy.n)); ev += s1 * s1 * (9.81 / (2 * w)) / k * dkB * dkB; }
  // (the directional factor integrates to 1 over the angle, so summed over the ring it drops out; ev is the 1D integral done on the grid)
  let iv = 0; const w0 = Math.sqrt(9.81 * 2 * Math.PI / P.lc), w1 = Math.sqrt(9.81 * 2 * Math.PI / TB.lo);
  for (let q = 0; q < 4000; q++){ const w = w0 + (w1 - w0) * (q + 0.5) / 4000, s1 = P.ren * (P.dv * Math.exp(0.5 * (so.lgs(w) - so.m)) / (Math.SQRT2 * so.n) + (1 - P.dv) * Math.exp(0.5 * (sy.lgs(w) - sy.m)) / (Math.SQRT2 * sy.n)); iv += s1 * s1 * (w1 - w0) / 4000 * 2 * Math.PI; }
  t.near(ev / iv, 1, 0.08, 'the band\'s energy on the grid is JONSWAP\'s integral over the band');
  // and the drawn amplitudes carry that energy: the sum of E|h0|^2 over k and -k, with the spread, against it (random draws: 10 %)
  // (Var h = sum over k of E|htilde|^2 = 2 sum E|h0|^2)
  let ea = 0; for (let c = 0; c < 256 * 256; c++) ea += 2 * (SB.h0r[c] ** 2 + SB.h0i[c] ** 2);
  t.near(ea / (iv / (2 * Math.PI)), 1, 0.1, 'the random amplitudes carry the spectrum\'s energy, spread over the directions');
}
