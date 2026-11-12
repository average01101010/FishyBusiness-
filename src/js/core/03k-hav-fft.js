// ---------- the short sea as a wave field: FFT tiles (Bølgene B1, docs/planer/bolgene.md, 12.11.2026) ----------
// The wind sea shorter than some 30 m was six Gerstner trains (waves 4-9 of 14-sea.js), each a plane wave with one direction and one
// phase, so the crests ran straight across the sea and drew stripes and a grid in the sun's glitter (Jonas' videos 09.-12.11.2026).
// Here it is a field of thousands of waves instead, as films and ocean simulators make it (Tessendorf 2001, «Simulating Ocean Water»):
// on a square tile of N x N cells, every wavenumber k = 2 pi (n, m) / L in the band gets a random complex amplitude from a fixed seed,
// scaled by the spectrum there, and runs at its own speed (deep water, w = sqrt(g k)); an inverse 2D FFT sums them into the field.
// The spectrum is the one the Gerstner bands are cut from (JONSWAP, Hasselmann et al. 1973, normalised as specW in 14-sea.js, so Hs = 1
// and the shaders scale it to the local sea), spread over the directions by Hasselmann et al. 1980 (cos^2s of half the angle, as
// spreadSd), so the field is short-crested: each crest a few wavelengths long, staggered, and no two places alike.
// Two tiles of incommensurate size share the band (HFFT.tiles): the first from the long waves' cut down to 7.5 m, the second from 7.5 m
// to 0.8 m, so they never repeat together. Each frame gives four fields per tile from two complex transforms (two real fields packed as
// the real and imaginary part of one): the slopes dh/dx and dh/dz, the trace of the horizontal displacement's derivative (the crests'
// sharpening, as the Gerstner Q: the normal is (-hx, 1 - Q tr, -hz)) and the height. Then the mip levels, box-filtered (the slopes'
// mean is the mean surface's slope). The functions are pure and self-contained, so the worker in view3d/14b-fft.js runs them as text
// (as core/01c-vec.js does) and tests/unit/hfft.test.mjs checks them against a direct sum in Node.
const HFFT = {g:9.81, tiles:[{N:128, L:173, lo:7.5, hi:0, seed:1}, {N:64, L:24.7, lo:0.8, hi:7.5, seed:2}]};
// a hash of an integer to (0, 1], for the fixed random amplitudes (the same on every device: the shared sea, B4)
function hfftHash(i){
  let x = (i ^ 0x9e3779b9) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0; x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (((x ^ (x >>> 16)) >>> 0) + 1) / 4294967297;
}
// ln Gamma(x) for x > 0 (Lanczos, g = 7), for the spread's normalisation
function hfftLgam(x){
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - hfftLgam(1 - x);
  x -= 1; let a = c[0]; const t = x + 7.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
// The constants of one JONSWAP spectrum with its peak at wavelength L0: S(w) = exp(lgS(w) - m) / (2 n^2), normalised over the whole
// spectrum so its integral is 1/16 (Hs = 1). Not over specW's ten bands (14-sea.js): a young sea's peak can lie shorter than the shortest
// band (6.4 m), and normalised over the bands it put the whole sea in the tail they catch, a field a hundred times too high (12.11.2026).
function hfftSp(L0){
  const wp = Math.sqrt(2 * Math.PI * 9.81 / L0), lgS = w => { const sg = w <= wp ? 0.07 : 0.09; return -5 * Math.log(w) - 1.25 * Math.pow(wp / w, 4) + Math.log(3.3) * Math.exp(-((w - wp) * (w - wp)) / (2 * sg * sg * wp * wp)); };
  const m = lgS(wp); let I = 0; const w0 = 0.3 * wp, w1 = 30 * wp, n = 6000, dw = (w1 - w0) / n;
  for (let i = 0; i < n; i++) I += Math.exp(lgS(w0 + (i + 0.5) * dw) - m) * dw;
  return {wp, m, n:Math.sqrt(8 * I)};
}
// one 1D transform's plan: the bit reversal and the twiddles (e^{+i 2 pi j / N}: the inverse transform, unnormalised, h(x) = sum h(k) e^{ikx})
function hfftPlan(N){
  const rev = new Uint16Array(N), c = new Float64Array(N / 2), s = new Float64Array(N / 2); let b = 0; while ((1 << b) < N) b++;
  for (let i = 0; i < N; i++){ let r = 0; for (let j = 0; j < b; j++) if (i & (1 << j)) r |= 1 << (b - 1 - j); rev[i] = r; }
  for (let j = 0; j < N / 2; j++){ c[j] = Math.cos(2 * Math.PI * j / N); s[j] = Math.sin(2 * Math.PI * j / N); }
  return {N, rev, c, s, tr:new Float64Array(N), ti:new Float64Array(N)};
}
// in place on re/im from offset o with stride st (a row: st 1, a column: st N)
function hfft1(p, re, im, o, st){
  const N = p.N, tr = p.tr, ti = p.ti;
  for (let i = 0; i < N; i++){ const r = p.rev[i]; tr[i] = re[o + r * st]; ti[i] = im[o + r * st]; }
  for (let size = 2; size <= N; size <<= 1){ const h = size >> 1, step = N / size;
    for (let i = 0; i < N; i += size) for (let j = 0, k = 0; j < h; j++, k += step){
      const a = i + j, b = a + h, wr = p.c[k], wi = p.s[k], xr = tr[b] * wr - ti[b] * wi, xi = tr[b] * wi + ti[b] * wr;
      tr[b] = tr[a] - xr; ti[b] = ti[a] - xi; tr[a] += xr; ti[a] += xi; } }
  for (let i = 0; i < N; i++){ re[o + i * st] = tr[i]; im[o + i * st] = ti[i]; }
}
function hfft2(p, re, im){ const N = p.N; for (let j = 0; j < N; j++) hfft1(p, re, im, j * N, 1); for (let i = 0; i < N; i++) hfft1(p, re, im, i, N); }
// The spectrum on a tile. P: the wind's direction (dx, dz, unit), the two spectra the sea is blended from (young and grown, each its
// peak frequency wp and specW's log maximum m and norm n), how grown the sea is at the boat (dv) and the renormalisation of the blend
// (ren), the inverse wave age (ia) and the peak at the boat (wpB) for the spread, and the long waves' cut (lc, m: the tile's band ends
// there unless it has its own hi). S(w) = exp(lgS(w) - m) / (2 n^2) is specW's: its bands' a^2 = 2 S(w) dw, Hs = 1.
// Returns the tile's state: per cell the amplitude h0 (re, im) and the frequency w, cell by cell in the transform's order.
function hfftSpec(T, P){
  const N = T.N, dk = 2 * Math.PI / T.L, g = 9.81, kLo = 2 * Math.PI / (T.hi || P.lc), kHi = 2 * Math.PI / T.lo, n2 = N * N;
  const S = T.S || (T.S = {h0r:new Float32Array(n2), h0i:new Float32Array(n2), w:new Float32Array(n2)});
  const lgS = (w, sp) => { const sg = w <= sp.wp ? 0.07 : 0.09; return -5 * Math.log(w) - 1.25 * Math.pow(sp.wp / w, 4) + Math.log(3.3) * Math.exp(-((w - sp.wp) * (w - sp.wp)) / (2 * sg * sg * sp.wp * sp.wp)) - sp.m; };
  const ia = Math.min(4, Math.max(0.6, P.ia)), zc = {};
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
    const n = i < N / 2 ? i : i - N, m = j < N / 2 ? j : j - N, kx = n * dk, kz = m * dk, k = Math.hypot(kx, kz), c = j * N + i;
    // (nothing on the Nyquist row and column: there k and -k are the same cell, and i k h would not be the transform of a real field)
    if (k < kLo || k >= kHi || i === N / 2 || j === N / 2){ S.h0r[c] = S.h0i[c] = 0; S.w[c] = Math.sqrt(g * Math.max(k, 1e-6)); continue; }
    const w = Math.sqrt(g * k), so = Math.exp(0.5 * lgS(w, P.so)) / (Math.SQRT2 * P.so.n), sy = Math.exp(0.5 * lgS(w, P.sy)) / (Math.SQRT2 * P.sy.n);
    const A = P.ren * (P.dv * so + (1 - P.dv) * sy), S1 = A * A;   // S(w), the blend of the two as the Gerstner bands blend their amplitudes
    const f = w / P.wpB, s = f < 1.05 ? 6.97 * Math.pow(f, 4.06) : 9.77 * Math.pow(f, -2.33 - 1.45 * (ia - 1.17)), sq = Math.round(s * 200);
    // D(theta) = cos^2s(theta/2) / Z(s), Z = 2 sqrt(pi) Gamma(s + 1/2) / Gamma(s + 1) (memoised on s to 0.005)
    const Z = zc[sq] || (zc[sq] = 2 * Math.sqrt(Math.PI) * Math.exp(hfftLgam(sq / 200 + 0.5) - hfftLgam(sq / 200 + 1)));
    const ct = Math.max(-1, Math.min(1, (kx * P.dx + kz * P.dz) / k)), D = Math.pow(Math.max(0, (1 + ct) / 2), sq / 200) / Z;   // cos^2s(t/2) = ((1 + cos t) / 2)^s
    // F(kx, kz) = S(w) D(theta) dw/dk / k; E|h0|^2 = F dk^2 / 2 (each k and -k carry half), so with two normals of variance 1, a = sqrt(F) dk / 2
    const F = S1 * D * (g / (2 * w)) / k, a = Math.sqrt(F) * dk / 2;
    const u1 = hfftHash(c * 4 + T.seed * 1000003), u2 = hfftHash(c * 4 + 1 + T.seed * 1000003), u3 = hfftHash(c * 4 + 2 + T.seed * 1000003), u4 = hfftHash(c * 4 + 3 + T.seed * 1000003);
    S.h0r[c] = a * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); S.h0i[c] = a * Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4); S.w[c] = w;
  }
  return S;
}
// One frame of a tile at time t (s): out (Float32Array, RGBA per cell, then the mip levels down to 1 x 1) gets the slopes hx and hz,
// the trace tr of the displacement's derivative and the height h; returns [mean square slope (hx^2 + hz^2), rms of tr, mean h^2].
// W: the work arrays (re1, im1, re2, im2: Float64Array(N^2)) and the plan, kept between frames. outD (B2, the sea's shape), when given
// with W.re3 and W.im3: the horizontal displacement D = -i k/|k| h (the surface is drawn at x - Q D, so a crest sharpens as in a
// Gerstner wave) and the height again, RGBA (Dx, Dz, h, 0) with its levels, for the vertex shader and seaH.
function hfftFrame(T, t, out, W, outD){
  const N = T.N, dk = 2 * Math.PI / T.L, S = T.S, n2 = N * N, re1 = W.re1, im1 = W.im1, re2 = W.re2, im2 = W.im2;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
    const c = j * N + i, ni = (N - i) % N, nj = (N - j) % N, cm = nj * N + ni;
    const n = i < N / 2 ? i : i - N, m = j < N / 2 ? j : j - N, kx = n * dk, kz = m * dk, k = Math.hypot(kx, kz);
    const wt = -S.w[c] * t, co = Math.cos(wt), si = Math.sin(wt), a = S.h0r[c], b = S.h0i[c], a2 = S.h0r[cm], b2 = -S.h0i[cm];
    // h(k, t) = h0(k) e^{-iwt} + conj(h0(-k)) e^{iwt}, so the field is real and h0(k) e^{i(kx - wt)} travels along k, downwind as the
    // spectrum lies (12.11.2026: with e^{+iwt} the tiles' waves travelled into the wind, Jonas' «se hvilken vei sjøen går»)
    const hr = a * co - b * si + a2 * co + b2 * si, hi = a * si + b * co + b2 * co - a2 * si;
    // (i kx h) + i (i kz h) and (k h) + i h
    re1[c] = -kx * hi - kz * hr; im1[c] = kx * hr - kz * hi; re2[c] = k * hr - hi; im2[c] = k * hi + hr;
    // (-i kx/k h) + i (-i kz/k h)
    if (outD){ const ik = k > 0 ? 1 / k : 0; W.re3[c] = (kx * hi + kz * hr) * ik; W.im3[c] = (kz * hi - kx * hr) * ik; }
  }
  hfft2(W.plan, re1, im1); hfft2(W.plan, re2, im2);
  if (outD){ hfft2(W.plan, W.re3, W.im3); for (let c = 0; c < n2; c++){ const o = c * 4; outD[o] = W.re3[c]; outD[o + 1] = W.im3[c]; outD[o + 2] = im2[c]; outD[o + 3] = 0; } hfftMips(outD, N); }
  let ms = 0, mt = 0, mh = 0;
  for (let c = 0; c < n2; c++){ const o = c * 4, hx = re1[c], hz = im1[c], tr = re2[c], h = im2[c];
    out[o] = hx; out[o + 1] = hz; out[o + 2] = tr; out[o + 3] = h; ms += hx * hx + hz * hz; mt += tr * tr; mh += h * h; }
  hfftMips(out, N);
  return [ms / n2, Math.sqrt(mt / n2), mh / n2];
}
// B3 (12.11.2026, sea3d): where the crests break, the sum of both tiles' trace in standard deviations (and a little grain) is compared with a
// threshold for the share W of Monahan's cover. One tile is one draw of the sea, and its own distribution strays from the normal one out
// in the tail where the threshold lies (0.7 to 1.3 times the cover at 12-25 m/s with the normal quantile). So the threshold is fitted
// to this frame's tiles: n sums of each tile read at a random place (they never line up, being incommensurate) plus the grain's spread
// (gs), sorted, read at nine shares and fitted as th = a + b z + c z^2 against the normal quantile z of the share. Returns [a, b, c].
function hfftCapFit(o1, n1, s1, o2, n2, s2, gs, n){
  const sd = Math.max(Math.hypot(s1, s2), 1e-9), v = new Float32Array(n); let r = 12345;
  const rnd = () => { r = (Math.imul(r, 1103515245) + 12345) >>> 0; return (r + 0.5) / 4294967296; };
  // (read as the shaders and fftTrH read them, bilinear between the texels at a random place: the shortest waves, two or three texels
  // long, lose much of their spread to that, so read at the texels the threshold was a third too high)
  const bil = (o, N) => { const u = rnd() * N, w = rnd() * N, i0 = Math.floor(u), j0 = Math.floor(w), fu = u - i0, fw = w - j0, i1 = (i0 + 1) % N, j1 = (j0 + 1) % N;
    return (o[(j0 * N + i0) * 4 + 2] * (1 - fu) + o[(j0 * N + i1) * 4 + 2] * fu) * (1 - fw) + (o[(j1 * N + i0) * 4 + 2] * (1 - fu) + o[(j1 * N + i1) * 4 + 2] * fu) * fw; };
  for (let i = 0; i < n; i++){ const a = bil(o1, n1), b = bil(o2, n2), g = Math.sqrt(-2 * Math.log(rnd())) * Math.cos(6.2831853 * rnd()); v[i] = (a + b) / sd + g * gs; }
  v.sort();
  const W = [0.3, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001], zq = w => { let z = Math.sqrt(-2 * Math.log(w)); return z - (2.515517 + 0.802853 * z + 0.010328 * z * z) / (1 + 1.432788 * z + 0.189269 * z * z + 0.001308 * z * z * z); };
  let S0 = 0, S1 = 0, S2 = 0, S3 = 0, S4 = 0, T0 = 0, T1 = 0, T2 = 0;
  for (const w of W){ const z = zq(w), y = v[Math.min(n - 1, Math.floor(n * (1 - w)))]; S0++; S1 += z; S2 += z * z; S3 += z * z * z; S4 += z * z * z * z; T0 += y; T1 += y * z; T2 += y * z * z; }
  // (least squares by the normal equations, 3 x 3, Cramer)
  const det = (a, b, c, d, e, f, g, h, k) => a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g), D = det(S0, S1, S2, S1, S2, S3, S2, S3, S4);
  if (!(Math.abs(D) > 1e-12)) return [0, 1, 0];
  return [det(T0, S1, S2, T1, S2, S3, T2, S3, S4) / D, det(S0, T0, S2, S1, T1, S3, S2, T2, S4) / D, det(S0, S1, T0, S1, S2, T1, S2, S3, T2) / D];
}
// the mip levels after level 0 in the same array, each the mean of the four cells under it (the tile wraps, so the levels do too)
function hfftMips(out, N){
  let src = 0, n = N;
  while (n > 1){ const h = n >> 1, dst = src + n * n * 4;
    for (let j = 0; j < h; j++) for (let i = 0; i < h; i++) for (let q = 0; q < 4; q++){
      const a = src + ((2 * j) * n + 2 * i) * 4 + q, b = a + 4, c = a + n * 4, d = c + 4; out[dst + (j * h + i) * 4 + q] = 0.25 * (out[a] + out[b] + out[c] + out[d]); }
    src = dst; n = h; }
}
// the floats a tile's levels take
const hfftLen = N => { let s = 0; for (let n = N; n >= 1; n >>= 1) s += n * n * 4; return s; };
