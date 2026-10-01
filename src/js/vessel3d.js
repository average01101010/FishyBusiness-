'use strict';
// ===== VESSEL MODELS =====
// The vessels in 3D, built from one spec per type out of a kit of lofted hulls and fittings. Nothing here touches WebGL: the builders
// return arrays that the 3D view uploads, and the market draws its side views from the same specs.
// Boat-local metres: bow towards -z, starboard +x, the waterline at y = 0.
// the geometry builder with normals and gloss in the colour's alpha (view3d.js NB() adds the GL buffers)
function VB(){
  const p = [], n = [], c = [];
  const o = {p, n, c, lod:1,
    v(a, nn, k){ p.push(a[0], a[1], a[2]); n.push(nn[0], nn[1], nn[2]); c.push(k[0], k[1], k[2], k[3] === undefined ? 0.2 : k[3]); },
    tri(a, b, d, k){ const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(nn[0], nn[1], nn[2]) || 1; const q = [nn[0] / l, nn[1] / l, nn[2] / l]; o.v(a, q, k); o.v(b, q, k); o.v(d, q, k); },
    quad(a, b, d, e, k){ o.tri(a, b, d, k); o.tri(a, d, e, k); },
    // a grid of points G[i][j] with smooth normals; colour per cell from kf(i, j)
    grid(G, kf){
      const R = G.length, C = G[0].length, N = [];
      for (let i = 0; i < R; i++){ N.push([]); for (let j = 0; j < C; j++){
        const a = G[Math.min(R - 1, i + 1)][j], b = G[Math.max(0, i - 1)][j], d = G[i][Math.min(C - 1, j + 1)], e = G[i][Math.max(0, j - 1)];
        const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], w = [d[0] - e[0], d[1] - e[1], d[2] - e[2]], nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
        N[i].push([nn[0] / l, nn[1] / l, nn[2] / l]); } }
      for (let i = 0; i < R - 1; i++) for (let j = 0; j < C - 1; j++){ const k = kf(i, j); o.v(G[i][j], N[i][j], k); o.v(G[i + 1][j], N[i + 1][j], k); o.v(G[i + 1][j + 1], N[i + 1][j + 1], k); o.v(G[i][j], N[i][j], k); o.v(G[i + 1][j + 1], N[i + 1][j + 1], k); o.v(G[i][j + 1], N[i][j + 1], k); }
    },
    // a tube along a polyline (stainless rails, handles)
    tube(P, r, k, sides){
      sides = sides || 8; const G = [];
      for (let i = 0; i < P.length; i++){
        const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const tl = Math.hypot(t[0], t[1], t[2]) || 1; t = t.map(x => x / tl);
        let up = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let s = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]; const sl = Math.hypot(s[0], s[1], s[2]); s = s.map(x => x / sl);
        const u = [s[1] * t[2] - s[2] * t[1], s[2] * t[0] - s[0] * t[2], s[0] * t[1] - s[1] * t[0]], row = [];
        for (let j = 0; j <= sides; j++){ const an = j / sides * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an); row.push([P[i][0] + (s[0] * ca + u[0] * sa) * r, P[i][1] + (s[1] * ca + u[1] * sa) * r, P[i][2] + (s[2] * ca + u[2] * sa) * r]); }
        G.push(row);
      }
      o.grid(G, () => k);
      if (r >= 0.03) for (const i of [0, P.length - 1]){ const R = G[i]; for (let j = 0; j < sides; j++) o.tri(P[i], R[j], R[j + 1], k); }
    },
    box(cx, cy, cz, sx, sy, sz, k, kTop){ const x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, y1 = cy + sy;
      o.quad([x0, cy, z1], [x1, cy, z1], [x1, y1, z1], [x0, y1, z1], k); o.quad([x1, cy, z0], [x0, cy, z0], [x0, y1, z0], [x1, y1, z0], k);
      o.quad([x0, cy, z0], [x0, cy, z1], [x0, y1, z1], [x0, y1, z0], k); o.quad([x1, cy, z1], [x1, cy, z0], [x1, y1, z0], [x1, y1, z1], k);
      o.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kTop || k); o.quad([x0, cy, z0], [x1, cy, z0], [x1, cy, z1], [x0, cy, z1], k); },
    // a box with rounded vertical and top edges, lofted along z (cowlings, cushions, pods)
    rbox(cx, cy, cz, w, h, d, r, k, taper){
      taper = taper || 0; const G = [], NZ = Math.max(3, Math.round(10 * o.lod)), NA = Math.max(8, Math.round(20 * o.lod / 4) * 4);
      for (let i = 0; i <= NZ; i++){
        const t = i / NZ, zz = cz - d / 2 + d * t, e = Math.min(1, Math.sin(Math.PI * t) * 1.25), sc = 1 - taper * t, hw = (w / 2) * sc * (0.5 + 0.5 * e), hh = h * (0.55 + 0.45 * e), row = [];
        for (let j = 0; j <= NA; j++){ const an = j / NA * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an), px = Math.sign(ca) * Math.max(0, Math.abs(ca) * (hw) - 0) , py = sa;
          // rounded rectangle via superellipse
          const ex = Math.sign(ca) * Math.pow(Math.abs(ca), 0.35), ey = Math.sign(sa) * Math.pow(Math.abs(sa), 0.35);
          row.push([cx + ex * hw, cy + hh / 2 + ey * hh / 2, zz]); }
        G.push(row);
      }
      o.grid(G, () => k);
      // close both ends
      for (const i of [0, NZ]){ const R = G[i], c = R.slice(0, NA).reduce((a, q) => [a[0] + q[0] / NA, a[1] + q[1] / NA, a[2] + q[2] / NA], [0, 0, 0]); for (let j = 0; j < NA; j++) o.tri(c, R[j], R[j + 1], k); }
    },
    disc(c0, nrm, r, k, seg){ seg = seg || 16; const up = Math.abs(nrm[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let s = [nrm[1] * up[2] - nrm[2] * up[1], nrm[2] * up[0] - nrm[0] * up[2], nrm[0] * up[1] - nrm[1] * up[0]]; const sl = Math.hypot(...s); s = s.map(x => x / sl); const u = [s[1] * nrm[2] - s[2] * nrm[1], s[2] * nrm[0] - s[0] * nrm[2], s[0] * nrm[1] - s[1] * nrm[0]];
      for (let j = 0; j < seg; j++){ const a0 = j / seg * Math.PI * 2, a1 = (j + 1) / seg * Math.PI * 2, P0 = [c0[0] + (s[0] * Math.cos(a0) + u[0] * Math.sin(a0)) * r, c0[1] + (s[1] * Math.cos(a0) + u[1] * Math.sin(a0)) * r, c0[2] + (s[2] * Math.cos(a0) + u[2] * Math.sin(a0)) * r], P1 = [c0[0] + (s[0] * Math.cos(a1) + u[0] * Math.sin(a1)) * r, c0[1] + (s[1] * Math.cos(a1) + u[1] * Math.sin(a1)) * r, c0[2] + (s[2] * Math.cos(a1) + u[2] * Math.sin(a1)) * r]; o.v(c0, nrm, k); o.v(P0, nrm, k); o.v(P1, nrm, k); } },
  };
  return o;
}

// ---------- palette (rgb and gloss) ----------
const VC = {
  white:[0.93, 0.94, 0.93, 0.6], cream:[0.92, 0.9, 0.82, 0.55], navy:[0.08, 0.16, 0.3, 0.65], red:[0.7, 0.12, 0.1, 0.55], blue:[0.12, 0.28, 0.52, 0.55],
  green:[0.1, 0.3, 0.2, 0.5], teal:[0.06, 0.32, 0.36, 0.55], black:[0.08, 0.09, 0.1, 0.4], grey:[0.55, 0.58, 0.6, 0.35], yellow:[0.95, 0.74, 0.12, 0.45],
  orange:[0.95, 0.42, 0.08, 0.4], afRed:[0.48, 0.12, 0.1, 0.12], afBlack:[0.1, 0.1, 0.11, 0.12], deck:[0.4, 0.45, 0.42, 0.1], deckRed:[0.5, 0.2, 0.16, 0.1],
  wood:[0.55, 0.4, 0.25, 0.15], teak:[0.6, 0.46, 0.3, 0.2], steel:[0.76, 0.78, 0.8, 0.85], galv:[0.6, 0.62, 0.63, 0.4], dark:[0.13, 0.14, 0.16, 0.3],
  rubber:[0.06, 0.06, 0.07, 0.2], inner:[0.86, 0.87, 0.85, 0.3], glassTint:[0.25, 0.32, 0.38, 0.95], lifeRaft:[0.92, 0.92, 0.9, 0.5], tub:[0.16, 0.42, 0.72, 0.45]
};

// ---------- the hull: lofted from stations (s = 0 at the transom or stern post, 1 at the stem) ----------
// H: L, B (beam), T (greatest draft, keel included), F (freeboard at the lowest point of the sheer), fr / ar (sheer rise at the bow /
// stern), rake / srake (stem rake and stern overhang, m), tw (transom half-width at the sheer as a share of the beam; 0 = double-ended),
// smax (station of greatest beam), entry / run (fineness of the bow and the stern), Tc (depth of the hull body; the rest is keel or
// skeg), n (bilge fullness: 2 round, 3 boxy, 1.6 slack), flare, form 'round' or 'chine' (dr / drF: deadrise aft and forward, degrees),
// trise (how far the bottom rises at the transom, 0–1), bulH (bulwark height above the deck), soleY (open boats: the floor), col.
function hullShape(H){
  const L = H.L, B = H.B, T = H.T, Tc = H.Tc || T * 0.7, rake = H.rake || 0, srake = H.srake || 0, Lb = L - rake - Math.max(0, srake);
  const smax = H.smax || 0.45, tw = H.tw || 0, entry = H.entry || 2, run = H.run || 2;
  const hbS = s => {
    let f;
    if (s >= smax){ const u = (s - smax) / (1 - smax); f = Math.pow(Math.max(0, 1 - Math.pow(u, entry)), 0.62); }
    else { const u = (smax - s) / smax; f = tw > 0 ? 1 - (1 - tw) * Math.pow(u, run) : Math.pow(Math.max(0, 1 - Math.pow(u, run)), 0.62); }
    return Math.max(0.025, B / 2 * f);
  };
  const flareAt = s => (H.flare || 0.05) + (H.flareFwd || 0.08) * sstep(0.55, 1, s);
  const hbW = s => Math.max(0.02, hbS(s) * (1 - flareAt(s)));
  const sh = s => H.F + (H.fr || 0) * Math.pow(sstep(0.4, 1, s), 1.6) + (H.ar || 0) * Math.pow(sstep(0.55, 0, s), 2);
  // depth of the hull body at the centreline: the forefoot rises to the stem, the bottom rises at the transom (or to the stern post)
  const kb = s => { let d = Tc;
    d *= 1 - 0.88 * sstep(H.ff || 0.72, 1, s);
    d *= tw > 0 ? 1 - (1 - (H.trise == null ? 0.4 : H.trise)) * sstep(0.4, 0, s) : 1 - 0.85 * sstep(0.32, 0, s);
    return Math.max(0.04, d); };
  const keelD = s => Math.max(0, T - Tc) * sstep(0.04, 0.16, s) * (1 - sstep(0.62, 0.8, s));
  const nAt = s => (H.n || 2.2) * (1 - 0.4 * sstep(0.55, 1, s)) * (tw > 0 ? 1 : 1 - 0.3 * sstep(0.35, 0, s));
  // z of a point at station s and height share hf (0 at the keel, 1 at the sheer): the stem rakes forward and the stern overhangs
  const c0 = -L / 2 + Lb / 2 + rake;
  const zAt = (s, hf) => c0 + Lb / 2 - s * Lb - rake * hf * sstep(0.5, 1, s) + srake * hf * sstep(0.5, 0, s);
  // half-section (x >= 0) as rows of [x, y] from the keel to the sheer
  const section = (s, NJ) => {
    const out = [], k = kb(s), W = hbW(s), Sb = hbS(s), Y = sh(s);
    if (H.form === 'chine'){
      const dr = ((H.dr || 14) + ((H.drF || 36) - (H.dr || 14)) * sstep(0.25, 1, s)) * Math.PI / 180, cx = W * 0.94, cy = Math.min(Y - 0.15, -k + cx * Math.tan(dr) * 0.92);
      const nb = Math.max(3, Math.round(NJ * 0.45)), ns = Math.max(3, NJ - nb);
      for (let j = 0; j <= nb; j++){ const t = j / nb, x = cx * t; out.push([x, -k + (cy + k) * (t * 0.85 + 0.15 * Math.sin(t * Math.PI / 2)), 'b']); }
      for (let j = 1; j <= ns; j++){ const t = j / ns; out.push([cx + (Sb - cx) * Math.pow(t, 0.85), cy + (Y - cy) * t, 's']); }
      return out;
    }
    const nl = Math.max(3, Math.round(NJ * 0.62)), nu = Math.max(2, NJ - nl), nn = nAt(s);
    for (let j = 0; j <= nl; j++){ const ph = j / nl * Math.PI / 2, x = W * Math.pow(Math.sin(ph), 2 / nn), y = -k + k * (1 - Math.pow(Math.cos(ph), 2 / nn)); out.push([x, y]); }
    for (let j = 1; j <= nu; j++){ const t = j / nu; out.push([W + (Sb - W) * Math.pow(t, 1.25), Y * t]); }
    return out;
  };
  // half-breadth of the inside of the hull at height y (for the deck and the bulwarks)
  const xAt = (s, y) => { const sec = section(s, 16); for (let j = 1; j < sec.length; j++){ const a = sec[j - 1], b = sec[j]; if (b[1] >= y){ const t = (y - a[1]) / Math.max(1e-6, b[1] - a[1]); return a[0] + (b[0] - a[0]) * Math.max(0, Math.min(1, t)); } } return hbS(s); };
  const deckY = s => H.soleY != null ? H.soleY : sh(s) - (H.bulH || 0) - (H.fcs && s > H.fcs.s ? -H.fcs.h * sstep(H.fcs.s, H.fcs.s + 0.02, s) : 0);
  // station at a z (inverse of zAt at mid height, close enough for placing fittings)
  const sOf = z => Math.max(0, Math.min(1, (c0 + Lb / 2 - z) / Lb));
  return {H, L, B, hbS, hbW, sh, kb, keelD, zAt, section, xAt, deckY, sOf};
}
// the hull surface, keel, transom, deck and bulwarks into builder o; lod 1 near, lower further away
function hullBuild(o, hs, lod){
  const H = hs.H, col = H.col || {}, NS = Math.max(10, Math.round((H.NS || 40) * lod)), NJ = Math.max(5, Math.round(14 * lod));
  const hullC = col.hull || VC.white, botC = col.bottom || VC.afRed, bootC = col.boot || VC.black, stripeC = col.stripe, sheerY = s => hs.sh(s);
  const rows = []; for (let i = 0; i <= NS; i++){ const s = i / NS, Y = hs.sh(s), k = hs.kb(s); rows.push(hs.section(s, NJ).map(q => [q[0], q[1], hs.zAt(s, (q[1] + k) / Math.max(0.05, Y + k)), q[2]])); }
  const colAt = (y, s) => y < -0.02 ? botC : y < 0.1 ? bootC : (stripeC && y > sheerY(s) - (H.stripeW || 0.14)) ? stripeC : hullC;
  const side = (sg, from, to) => {
    const G = rows.map(r => { const sl = r.slice(from, to + 1).map(q => [sg * q[0], q[1], q[2]]); return sg > 0 ? sl : sl.reverse(); });
    o.grid(G, (i, j) => { const a = G[i][j], b = G[i + 1][j + 1]; return colAt((a[1] + b[1]) / 2, i / NS); });
  };
  if (H.form === 'chine'){ const nb = rows[0].findIndex(q => q[3] === 's') - 1; for (const sg of [1, -1]){ side(sg, 0, nb); side(sg, nb, rows[0].length - 1); } }
  else for (const sg of [1, -1]) side(sg, 0, rows[0].length - 1);
  // transom: a fan over the aft section
  if ((H.tw || 0) > 0){ const r = rows[0], cy = (hs.sh(0) - hs.kb(0)) / 2, c = [0, cy, r[r.length - 1][2] * 0.5 + r[0][2] * 0.5];
    for (const sg of [1, -1]) for (let j = 0; j < r.length - 1; j++){ const a = [sg * r[j][0], r[j][1], r[j][2]], b = [sg * r[j + 1][0], r[j + 1][1], r[j + 1][2]]; const k = colAt((a[1] + b[1]) / 2, 0); if (sg > 0) o.tri(c, b, a, k); else o.tri(c, a, b, k); } }
  // keel or skeg, and a rudder aft
  { const KS = Math.max(6, Math.round(14 * lod)), kw = H.kw || Math.max(0.05, H.B * 0.025), G = [];
    for (let i = 0; i <= KS; i++){ const s = 0.03 + 0.8 * i / KS, d = hs.keelD(s), y0 = -hs.kb(s) + 0.02, z = hs.zAt(s, 0); G.push([[kw, y0, z], [kw, y0 - d, z], [-kw, y0 - d, z], [-kw, y0, z]]); }
    if (H.T - (H.Tc || H.T * 0.7) > 0.08) o.grid(G, () => botC);
    if (!H.noRudder){ const z = hs.zAt(0, 0) - (H.tw ? 0.25 : 0.05), y0 = -hs.kb(0.04) * 0.8, rh = Math.max(0.35, H.T * 0.55); o.box(0, y0 - rh, z, 0.05, rh, Math.max(0.3, H.L * 0.045), botC); }
  }
  // deck (or the floor of an open boat), the inside of the bulwarks, and the rail along the sheer
  { const DS = Math.max(8, Math.round(NS * 0.6)), G = [], IN = [[], []], deckC = col.deck || VC.deck, inC = col.inner || VC.inner;
    for (let i = 0; i <= DS; i++){ const s = 0.005 + 0.985 * i / DS, y = hs.deckY(s), xd = Math.max(0.02, hs.xAt(s, y) - 0.05), z = hs.zAt(s, 0.95), row = [];
      for (let j = 0; j <= 4; j++){ const u = -1 + j / 2; row.push([u * xd, y + 0.03 * (1 - u * u) * (H.soleY != null ? 0 : 1), z]); } G.push(row);
      const Y = hs.sh(s), xs = Math.max(xd, hs.hbS(s) - 0.06); IN[0].push([[xd, y, z], [xs, Y, z]]); IN[1].push([[-xs, Y, z], [-xd, y, z]]); }
    o.grid(G, () => deckC); for (const g of IN) o.grid(g, () => inC);
    if (!H.noRail){ for (const sg of [1, -1]){ const P = []; for (let i = 0; i <= DS; i++){ const s = 0.005 + 0.985 * i / DS; P.push([sg * (hs.hbS(s) - 0.02), hs.sh(s) + 0.02, hs.zAt(s, 1)]); } o.tube(P, H.railR || 0.045, col.rail || VC.dark, Math.max(4, Math.round(6 * lod))); } }
  }
  // a bulbous bow below the waterline (ocean vessels)
  if (H.bulb){ const z = hs.zAt(1, 0) - H.bulb * 0.4; o.rbox(0, -hs.H.Tc * 0.75, z + H.bulb * 0.6, H.bulb * 0.9, H.bulb * 0.9, H.bulb * 2.6, H.bulb * 0.45, botC, 0.35); }
}
// a cap at the height of the sheer over the inside of the hull, drawn into the depth buffer only so the sea is not drawn inside an open hull
function hullCap(hs){
  const out = [], N = 24;
  for (let i = 0; i < N; i++){ const s0 = 0.005 + 0.99 * i / N, s1 = 0.005 + 0.99 * (i + 1) / N, a = [hs.hbS(s0) - 0.03, hs.sh(s0) - 0.02, hs.zAt(s0, 1)], b = [hs.hbS(s1) - 0.03, hs.sh(s1) - 0.02, hs.zAt(s1, 1)];
    out.push([[-a[0], a[1], a[2]], [a[0], a[1], a[2]], [b[0], b[1], b[2]]], [[-a[0], a[1], a[2]], [b[0], b[1], b[2]], [-b[0], b[1], b[2]]]); }
  return out;
}

// ---------- fittings ----------
// a wall between two corners at the deck (A, B) up to the matching top corners, with a band of windows: glass goes to the glass builder
function wallWin(o, gb, A0, B0, A1, B1, sill, top, nwin, wallC, frameC, mull){
  const at = (P0, P1, f) => [P0[0] + (P1[0] - P0[0]) * f, P0[1] + (P1[1] - P0[1]) * f, P0[2] + (P1[2] - P0[2]) * f];
  const h = A1[1] - A0[1], fs = sill / h, ft = top / h, a0 = A0, b0 = B0, as = at(A0, A1, fs), bs = at(B0, B1, fs), at_ = at(A0, A1, ft), bt = at(B0, B1, ft);
  o.quad(a0, b0, bs, as, wallC); o.quad(at_, bt, B1, A1, wallC);
  if (!nwin){ o.quad(as, bs, bt, at_, wallC); return; }
  const m = mull || 0.07, L = Math.hypot(B0[0] - A0[0], B0[2] - A0[2]), mf = m / Math.max(0.1, L);
  for (let k = 0; k <= nwin; k++){ const f = k / nwin, f0 = Math.max(0, f - mf / 2), f1 = Math.min(1, f + mf / 2);
    o.quad(at(as, bs, f0), at(as, bs, f1), at(at_, bt, f1), at(at_, bt, f0), frameC);
    if (k < nwin && gb){ const g0 = f1, g1 = (k + 1) / nwin - mf / 2; gb.quad(at(as, bs, g0), at(as, bs, g1), at(at_, bt, g1), at(at_, bt, g0), VC.glassTint); } }
}
// a wheelhouse: footprint at deck height y0 from zf (front) to za (aft), width w, height hgt; rake moves the top of the front wall aft
// (negative: leans forward, as on most northern fishing boats); returns where the helm, the roof and the side lights are
function partHouse(o, gb, p, y0){
  const w = p.w, hw = w / 2, hgt = p.h, zf = p.zf, za = p.za, rk = p.rake || 0, tm = p.tumble == null ? 0.06 : p.tumble, y1 = y0 + hgt, c = p.col || VC.white, fc = p.frame || VC.dark;
  const FL0 = [-hw, y0, zf], FR0 = [hw, y0, zf], AL0 = [-hw, y0, za], AR0 = [hw, y0, za], FL1 = [-hw + tm, y1, zf + rk], FR1 = [hw - tm, y1, zf + rk], AL1 = [-hw + tm, y1, za], AR1 = [hw - tm, y1, za];
  const sill = p.sill || hgt * 0.5, top = hgt - (p.band || 0.18), nw = p.nwin || 3, ns = p.nside || Math.max(1, Math.round((za - zf) / 1.1));
  wallWin(o, gb, FL0, FR0, FL1, FR1, sill, top, nw, c, fc);                        // front
  wallWin(o, gb, FR0, AR0, FR1, AR1, sill, top, ns, c, fc);                        // starboard
  wallWin(o, gb, AR0, AL0, AR1, AL1, p.aftWin ? sill : hgt * 0.98, top, p.aftWin ? 2 : 0, c, fc);   // aft
  wallWin(o, gb, AL0, FL0, AL1, FL1, sill, top, ns, c, fc);                        // port
  // roof with a little overhang and a visor over the front windows
  const rc = p.roof || c, ov = p.over == null ? 0.12 : p.over;
  o.box(0, y1, (zf + rk + za) / 2, w - 2 * tm + 2 * ov, 0.09, za - zf - rk + 2 * ov, rc);
  if (p.visor !== false) o.quad([-hw + tm - ov, y1, zf + rk - ov], [hw - tm + ov, y1, zf + rk - ov], [hw - tm + ov, y1 - 0.06, zf + rk - ov - 0.28], [-hw + tm - ov, y1 - 0.06, zf + rk - ov - 0.28], rc);
  // door aft on the starboard side
  const dz0 = za - Math.min(0.95, (za - zf) * 0.45), dz1 = za - 0.15; o.quad([hw + 0.012, y0 + 0.08, dz0], [hw + 0.012, y0 + 0.08, dz1], [hw - tm * 0.85 + 0.012, y1 - 0.25, dz1], [hw - tm * 0.85 + 0.012, y1 - 0.25, dz0], p.door || VC.grey);
  // inside: console under the front windows, the wheel and a seat
  const hx = p.helmX || 0, zc = zf + Math.max(0, rk) * 0.45 + 0.28;
  o.box(hx, y0, zc, Math.min(w * 0.75, 1.6), 0.95, 0.45, VC.dark, VC.black);
  const wz = zc + 0.32; o.disc([hx, y0 + 1.06, wz], [0, 0.35, 0.94], 0.2, VC.wood, Math.max(8, Math.round(14 * o.lod)));
  o.tube([[hx, y0 + 1.0, wz - 0.02], [hx, y0 + 0.92, zc + 0.15]], 0.025, VC.steel, 6);
  if (o.lod > 0.5) o.rbox(hx, y0 + 0.5, wz + 0.75, 0.48, 0.5, 0.45, 0.1, VC.black);
  return {roofY:y1 + 0.09, zf, za, rk, helm:[hx, y0, wz + 0.42], eye:[hx, y0 + 1.66, wz + 0.4], sideL:[[-hw - 0.04, y1 - 0.22, zf + 0.25], [hw + 0.04, y1 - 0.22, zf + 0.25]], top:[0, y1 + 0.09, (zf + za) / 2]};
}
function partMast(o, p, base){
  const x = p.x || 0, z = p.z, y0 = base, h = p.h || 2.4, sc = VC.steel, out = {};
  o.tube([[x, y0, z], [x, y0 + h, z]], p.r || 0.05, p.col || VC.white, 8);
  o.tube([[x - (p.span || 0.6), y0 + h * 0.72, z], [x + (p.span || 0.6), y0 + h * 0.72, z]], 0.03, p.col || VC.white, 6);
  if (p.radar === 'open'){ o.box(x, y0 + h * 0.5, z - 0.35, 0.22, 0.2, 0.22, VC.dark); o.box(x, y0 + h * 0.5 + 0.2, z - 0.35, p.radarL || 1.8, 0.12, 0.12, VC.white); }
  if (p.radar === 'dome') o.rbox(x, y0 + h * 0.5, z - 0.35, 0.6, 0.24, 0.6, 0.12, VC.white);
  for (const ax of [-0.25, 0.25]) o.tube([[x + ax, y0 + h * 0.72, z], [x + ax * 1.1, y0 + h * 0.72 + 0.9, z]], 0.008, VC.dark, 4);
  out.top = [x, y0 + h + 0.1, z]; return out;
}
function partExhaust(o, p, base){ o.tube([[p.x, base, p.z], [p.x, base + p.h, p.z]], p.r || 0.07, VC.black, 8); }
// stainless rails on stanchions along the sheer, from station s0 to s1
function partRails(o, hs, p){
  for (const sg of [1, -1]){ const P = [], N = 10; for (let i = 0; i <= N; i++){ const s = p.s0 + (p.s1 - p.s0) * i / N, y = hs.sh(s) + (p.h || 0.65); P.push([sg * (hs.hbS(s) - 0.05), y, hs.zAt(s, 1)]); if (i % 2 === 0) o.tube([[sg * (hs.hbS(s) - 0.05), hs.sh(s), hs.zAt(s, 1)], [sg * (hs.hbS(s) - 0.05), y, hs.zAt(s, 1)]], 0.018, VC.steel, 5); }
    o.tube(P, 0.022, VC.steel, 6); }
}
// an A-frame gallows (galge) at the stern
function partGallows(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), x = hs.xAt(s, y) - 0.15, h = p.h || 2.6, c = p.col || VC.yellow;
  for (const sg of [1, -1]) o.tube([[sg * x, y, p.z], [sg * x * 0.55, y + h, p.z - 0.15]], 0.06, c, 8);
  o.tube([[-x * 0.55, y + h, p.z - 0.15], [x * 0.55, y + h, p.z - 0.15]], 0.06, c, 8); o.disc([0, y + h - 0.25, p.z - 0.15], [1, 0, 0], 0.16, VC.dark, 10); }
// line or net hauler on the starboard rail, a davit with block for the pots
function partHauler(o, hs, p){ const s = hs.sOf(p.z), y = hs.sh(s), x = hs.hbS(s) - 0.15, c = p.col || VC.orange;
  o.tube([[x - 0.2, hs.deckY(s), p.z], [x - 0.2, y + 0.35, p.z]], 0.07, VC.galv, 8);
  if (p.kind === 'garn'){ o.tube([[x - 0.45, y + 0.5, p.z], [x + 0.15, y + 0.5, p.z]], 0.22, c, 14); o.disc([x - 0.45, y + 0.5, p.z], [-1, 0, 0], 0.3, c, 14); o.disc([x + 0.15, y + 0.5, p.z], [1, 0, 0], 0.3, c, 14); }
  else { o.disc([x - 0.08, y + 0.48, p.z], [0.9, 0.3, 0], 0.26, c, 16); o.tube([[x - 0.14, y + 0.46, p.z], [x - 0.02, y + 0.5, p.z]], 0.27, c, 16); o.tube([[x + 0.12, y + 0.08, p.z - 0.25], [x + 0.12, y + 0.08, p.z + 0.25]], 0.05, VC.steel, 8); }
}
function partDavit(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), x = hs.hbS(s) - 0.2, h = p.h || 2.2;
  o.tube([[x, y, p.z], [x, y + h, p.z], [x + 0.9, y + h + 0.15, p.z]], 0.06, p.col || VC.yellow, 8); o.disc([x + 0.9, y + h, p.z], [0, 0, 1], 0.12, VC.dark, 10); }
// fish tubs on deck, a stack of pots, a liferaft canister on the roof
function partTubs(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s); for (let i = 0; i < (p.n || 2); i++) o.rbox((i % 2 ? -1 : 1) * Math.min(0.7, hs.xAt(s, y) * 0.45), y, p.z + Math.floor(i / 2) * 1.0, 0.85, 0.55, 0.85, 0.06, p.col || VC.tub); }
function partPots(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), xs = hs.xAt(s, y) * 0.5, rows = p.rows || 2, cols = p.cols || 3, lay = p.lay || 2;
  for (let l = 0; l < lay; l++) for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++){ const x = -xs + (2 * xs) * (k + 0.5) / cols, z = p.z + r * 0.75, yy = y + l * 0.42;
    o.box(x, yy, z, 0.68, 0.4, 0.68, p.col || [0.15, 0.25, 0.2, 0.15]); } }
function partRaft(o, p, base){ o.tube([[p.x - 0.45, base + 0.22, p.z], [p.x + 0.45, base + 0.22, p.z]], 0.22, VC.lifeRaft, 10); o.box(p.x, base, p.z, 0.9, 0.06, 0.5, VC.galv); }
function partFenders(o, hs, p){ for (const s of p.at || [0.25, 0.5, 0.75]) for (const sg of [1, -1]){ const y = hs.sh(s) - 0.25, x = sg * (hs.hbS(s) + 0.12), z = hs.zAt(s, 0.9); o.tube([[x, y - 0.45, z], [x, y, z]], 0.11, VC.blue, 8); } }
// an engine box (motorkasse) and thwarts in an open boat
function partEngineBox(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s); o.rbox(0, y, p.z, p.w || 0.8, p.h || 0.6, p.l || 1.0, 0.06, p.col || VC.teak); }
function partThwart(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s) + (p.h || 0.38), x = hs.xAt(s, y) - 0.04; o.box(0, y, p.z, 2 * x, 0.05, 0.28, p.col || VC.wood); }
// a superstructure deck with windows (ocean vessels and the bigger coastal boats)
function partBlock(o, gb, p, y0){ const hw = p.w / 2, A0 = [-hw, y0, p.zf], B0 = [hw, y0, p.zf], C0 = [hw, y0, p.za], D0 = [-hw, y0, p.za], y1 = y0 + p.h, up = q => [q[0], y1, q[2]], c = p.col || VC.white, fc = p.frame || VC.dark;
  const nw = p.nwin || 0, ns = p.nside || 0, sill = p.h * 0.45, top = p.h - 0.25;
  wallWin(o, gb, A0, B0, up(A0), up(B0), sill, top, nw, c, fc); wallWin(o, gb, B0, C0, up(B0), up(C0), sill, top, ns, c, fc);
  wallWin(o, gb, C0, D0, up(C0), up(D0), sill, top, 0, c, fc); wallWin(o, gb, D0, A0, up(D0), up(A0), sill, top, ns, c, fc);
  o.box(0, y1, (p.zf + p.za) / 2, p.w + 0.2, 0.1, p.za - p.zf + 0.2, p.roof || c); return y1 + 0.1; }
function partFunnel(o, p, base){ o.rbox(p.x || 0, base, p.z, p.w || 1.2, p.h || 2.5, p.l || 1.8, 0.25, p.col || VC.navy, 0.15); o.box(p.x || 0, base + (p.h || 2.5) - 0.05, p.z, (p.w || 1.2) * 0.85, 0.12, (p.l || 1.8) * 0.85, VC.black); }
function partGantry(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), x = hs.xAt(s, y) - 0.3, h = p.h || 6, c = p.col || VC.yellow;
  for (const sg of [1, -1]) o.box(sg * x, y, p.z, 0.45, h, 0.45, c); o.box(0, y + h - 0.5, p.z, 2 * x + 0.45, 0.5, 0.5, c);
  for (const sg of [1, -1]) o.disc([sg * x * 0.6, y + h - 0.7, p.z + 0.26], [0, 0, 1], 0.35, VC.dark, 12); }
function partRamp(o, hs, p){ const z0 = hs.zAt(0, 1), y0 = 0.15, z1 = z0 - p.l, y1 = hs.deckY(hs.sOf(z1)); o.quad([-p.w / 2, y0, z0], [p.w / 2, y0, z0], [p.w / 2, y1, z1], [-p.w / 2, y1, z1], VC.dark); }
function partDoors(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s); for (const sg of [1, -1]){ const x = sg * (hs.hbS(s) + 0.05); o.box(x, y - 0.4, p.z, 0.2, 2.2, 3.2, VC.orange); } }
function partCrane(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), x = p.x || 0, h = p.h || 3; o.tube([[x, y, p.z], [x, y + h, p.z]], 0.25, p.col || VC.yellow, 10); o.tube([[x, y + h, p.z], [x + (p.reach || 4) * 0.7, y + h + (p.reach || 4) * 0.6, p.z + (p.dz || 0)]], 0.16, p.col || VC.yellow, 8); }
function partBlockP(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s); o.tube([[0, y, p.z], [0, y + p.h, p.z - p.l]], 0.14, VC.yellow, 8); o.tube([[-0.5, y + p.h, p.z - p.l], [0.5, y + p.h, p.z - p.l]], 0.45, VC.dark, 14); }
function partNetBin(o, hs, p){ const s = hs.sOf(p.z), y = hs.deckY(s), x = hs.xAt(s, y) - 0.4; o.box(0, y, p.z, 2 * x, p.h || 1.6, p.l || 6, [0.22, 0.24, 0.26, 0.15]); o.box(0, y + (p.h || 1.6), p.z, 2 * x - 0.4, 0.4, (p.l || 6) - 0.4, [0.1, 0.2, 0.35, 0.1]); }

// ---------- one spec per type: the hull and the fittings. The skiff is hand-built in view3d.js ----------
const SPEC3D = {
  snekke:{hull:{form:'round', F:0.72, fr:0.34, ar:0.24, rake:0.45, srake:0.4, tw:0, smax:0.5, entry:2.0, run:1.8, Tc:0.62, n:2.0, flare:0.06, soleY:0.32, bulH:0, NS:36,
      col:{hull:VC.cream, stripe:VC.green, bottom:VC.afRed, boot:VC.green, deck:VC.wood, inner:VC.cream, rail:VC.teak}, stripeW:0.12, railR:0.05},
    open:true, parts:[['house', {zf:-1.15, za:0.55, w:1.55, h:1.62, rake:0.25, sill:0.82, nwin:2, nside:1, col:VC.white, roof:VC.green, deckY:0.32}], ['mast', {z:0.3, h:1.4, radar:'dome', on:'house'}],
      ['engine', {z:1.3, w:0.7, l:0.9, h:0.5}], ['tubs', {z:2.4, n:2}], ['fenders', {at:[0.35, 0.6]}]],
    work:{z:2.3}, crew:[[0.55, 2.2, -1.7], [-0.55, 2.8, 1.6]]},
  sjark:{hull:{form:'round', F:0.95, fr:0.55, ar:0.22, rake:0.95, srake:0.3, tw:0.68, smax:0.46, entry:2.2, run:2.2, Tc:1.0, n:2.4, flare:0.08, trise:0.2, bulH:0.55, NS:40,
      col:{hull:VC.white, stripe:VC.red, bottom:VC.afRed, boot:VC.black, deck:VC.deck, inner:VC.inner, rail:VC.red}, stripeW:0.16},
    parts:[['house', {zf:1.15, za:3.75, w:2.3, h:1.95, rake:-0.18, sill:1.0, nwin:3, nside:2, col:VC.white, roof:VC.red}], ['mast', {z:3.1, h:2.4, radar:'open', radarL:1.4, on:'house'}],
      ['exhaust', {x:0.75, z:3.6, h:2.5}], ['raft', {x:-0.55, z:2.6, on:'house'}], ['hauler', {z:-0.3, kind:'line'}], ['gallows', {z:4.75, h:2.4}],
      ['rails', {s0:0.84, s1:0.99, h:0.6}], ['tubs', {z:-1.4, n:2}], ['fenders', {at:[0.3, 0.55, 0.75]}]],
    work:{z:-0.9}, crew:[[0.7, -0.6, -1.5], [-0.7, -1.4, 1.6], [0, 0.2, 3.14]]},
  sjarkny:{hull:{form:'chine', F:1.2, fr:0.45, ar:0.08, rake:0.85, srake:-0.12, tw:0.94, smax:0.56, entry:1.9, run:1.4, Tc:0.85, dr:15, drF:40, flare:0.1, flareFwd:0.12, trise:0.85, bulH:0.6, NS:40,
      col:{hull:VC.navy, stripe:VC.white, bottom:VC.afRed, boot:VC.white, deck:VC.deck, inner:VC.inner, rail:VC.white}, stripeW:0.1, noRudder:false},
    parts:[['house', {zf:-2.7, za:0.5, w:3.3, h:2.1, rake:0.45, sill:1.0, nwin:3, nside:2, col:VC.white, roof:VC.white, frame:VC.black}], ['mast', {z:0.0, h:1.8, radar:'open', radarL:1.8, on:'house'}],
      ['raft', {x:-0.9, z:-0.6, on:'house'}], ['hauler', {z:1.4, kind:'line'}], ['gallows', {z:5.15, h:2.6, col:VC.white}], ['rails', {s0:0.82, s1:0.99, h:0.7}], ['tubs', {z:2.6, n:4}], ['fenders', {at:[0.3, 0.5, 0.7]}]],
    work:{z:2.9}, crew:[[0.9, 2.2, -1.6], [-0.9, 3.4, 1.6], [0.2, 4.2, 3.14]]}
};
// a model for a type: the hull with its fittings (near: lod 1), the glass, the depth cap for open hulls, and where things are
const VMODEL = {};
function vesselSpec(type){ return SPEC3D[type] || null; }
function buildVesselModel(type, lod){
  lod = lod || 1; const V = VESSELS[type], sp = vesselSpec(type); if (!V || !sp) return null;
  const H = Object.assign({L:V.len, B:V.beam, T:V.draft}, sp.hull), hs = hullShape(H), o = VB(), gb = VB(); o.lod = lod; gb.lod = lod;
  hullBuild(o, hs, lod);
  let house = null, roofY = null; const anch = {};
  for (const [kind, p] of sp.parts){
    const base = p.on === 'house' && house ? house.roofY : null;
    if (kind === 'house'){ const y0 = p.deckY != null ? p.deckY : hs.deckY(hs.sOf((p.zf + p.za) / 2)); house = partHouse(o, gb, p, y0); roofY = house.roofY; }
    else if (kind === 'mast'){ anch.mast = partMast(o, p, base != null ? base : hs.deckY(hs.sOf(p.z))); }
    else if (kind === 'exhaust') partExhaust(o, p, base != null ? base : hs.deckY(hs.sOf(p.z)));
    else if (kind === 'raft') partRaft(o, p, base != null ? base : hs.deckY(hs.sOf(p.z)));
    else if (kind === 'rails') partRails(o, hs, p);
    else if (kind === 'gallows') partGallows(o, hs, p);
    else if (kind === 'hauler'){ partHauler(o, hs, p); anch.hauler = [hs.hbS(hs.sOf(p.z)) - 0.15, hs.sh(hs.sOf(p.z)) + 0.35, p.z]; }
    else if (kind === 'davit') partDavit(o, hs, p);
    else if (kind === 'tubs') partTubs(o, hs, p);
    else if (kind === 'pots') partPots(o, hs, p);
    else if (kind === 'fenders') partFenders(o, hs, p);
    else if (kind === 'engine') partEngineBox(o, hs, p);
    else if (kind === 'thwart') partThwart(o, hs, p);
    else if (kind === 'block'){ const top = partBlock(o, gb, p, p.y0 != null ? p.y0 : (base != null ? base : hs.deckY(hs.sOf((p.zf + p.za) / 2)))); if (p.bridge) house = {roofY:top, helm:[0, top - p.h - 0.1, p.zf + 0.9], eye:[0, top - p.h + 1.56, p.zf + 0.8], sideL:[[-p.w / 2 - 0.05, top - 0.4, p.zf + 0.3], [p.w / 2 + 0.05, top - 0.4, p.zf + 0.3]], zf:p.zf, za:p.za}; anch.top = top; }
    else if (kind === 'funnel') partFunnel(o, p, base != null ? base : (anch.top || hs.deckY(hs.sOf(p.z))));
    else if (kind === 'gantry') partGantry(o, hs, p);
    else if (kind === 'ramp') partRamp(o, hs, p);
    else if (kind === 'doors') partDoors(o, hs, p);
    else if (kind === 'crane') partCrane(o, hs, p);
    else if (kind === 'pblock') partBlockP(o, hs, p);
    else if (kind === 'netbin') partNetBin(o, hs, p);
  }
  const geo = vesselGeo(type, hs, sp, house, anch);
  return {o, glass:gb, cap:sp.open ? hullCap(hs) : null, geo, hs};
}
// where things sit on the boat for the 3D view (what view3d.js calls VGEO): helm and eye, deck work area, lights, flag, hauler, crew
function vesselGeo(type, hs, sp, house, anch){
  const V = VESSELS[type], L = V.len, B = V.beam, wz = sp.work ? sp.work.z : 0, ws = hs.sOf(wz), dY = hs.deckY(ws), gw = hs.sh(ws);
  const lights = [];
  if (house){ lights.push([house.sideL[0], [1, 0.12, 0.1]], [house.sideL[1], [0.1, 1, 0.35]]); }
  if (anch.mast) lights.push([anch.mast.top, [1, 0.95, 0.85]]);
  lights.push([[0, hs.sh(0.02) + 0.6, hs.zAt(0.02, 1)], [1, 0.95, 0.85]]);
  const sx = B / 2;
  return {gw, deck:{y:dY, z:wz}, pl:L * 0.4, rl:B * 0.38, eye:house ? house.eye : [0, dY + 1.62, L * 0.3], hp:-0.07, fov:55,
    pole:[-hs.hbS(0.03) * 0.6, hs.sh(0.03) + 1.4, hs.zAt(0.03, 1) - 0.2], stern:L / 2 + 0.2, bow:hs.zAt(0.92, 1), side:B * 0.45, lights, open:!!sp.open,
    skipperAt:house ? house.helm : [0, dY, L * 0.3], crewSpots:(sp.crew || []).map(c => [c[0], dY, c[1], c[2]]),
    hauler:anch.hauler || [sx * 0.92, gw + 0.35, wz - 1.3], filler:[sx * 0.85, gw + 0.15, hs.zAt(0.3, 1)], beam:B, hand:false};
}
function vesselModel(type){ if (!(type in VMODEL)) VMODEL[type] = buildVesselModel(type, 1); return VMODEL[type]; }
function geoOf(type){ const m = vesselModel(type); return m ? m.geo : null; }
// a person in oilskins, built facing -z (as the skiff's crew): standing or seated, hands where given (or down by the sides)
function personVB(B, x, y, z, seated, hands, suit){
  const JAC = suit || [0.95, 0.62, 0.1, 0.3], VEST = [0.86, 0.16, 0.12, 0.35], TRS = [0.1, 0.12, 0.17, 0.2], SKN = [0.93, 0.74, 0.6, 0.25], HAT = [0.12, 0.16, 0.3, 0.15], BOOT = [0.06, 0.06, 0.07, 0.3];
  const hip = y + (seated ? 0.46 : 0.82);
  for (const sd of [-1, 1]){ const knee = seated ? [x + sd * 0.1, hip + 0.02, z - 0.4] : [x + sd * 0.1, y + 0.44, z - 0.03], foot = seated ? [x + sd * 0.11, y + 0.08, z - 0.44] : [x + sd * 0.11, y + 0.08, z + 0.01];
    B.tube([[x + sd * 0.1, hip, z], knee, foot], 0.07, TRS, 6); B.rbox(foot[0], y, foot[2] - 0.05, 0.12, 0.1, 0.26, 0.04, BOOT); }
  B.rbox(x, hip - 0.05, z, 0.4, 0.62, 0.26, 0.1, JAC); B.rbox(x, hip + 0.03, z, 0.44, 0.46, 0.3, 0.1, VEST);
  const sh = hip + 0.52;
  for (const sd of [-1, 1]){ const hd = hands ? hands[sd < 0 ? 0 : 1] : [x + sd * 0.24, hip - 0.02, z + 0.02], el = [x + sd * 0.25, (sh + hd[1]) / 2 - 0.04, (z + hd[2]) / 2 + 0.04];
    B.tube([[x + sd * 0.21, sh - 0.04, z], el, hd], 0.052, JAC, 6); B.rbox(hd[0], hd[1] - 0.04, hd[2], 0.08, 0.08, 0.1, 0.035, SKN); }
  B.rbox(x, sh - 0.03, z, 0.13, 0.1, 0.13, 0.05, SKN); B.rbox(x, sh + 0.05, z, 0.22, 0.26, 0.24, 0.1, SKN); B.rbox(x, sh + 0.23, z, 0.235, 0.13, 0.25, 0.1, HAT);
}
