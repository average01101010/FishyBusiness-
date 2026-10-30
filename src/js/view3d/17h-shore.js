  // ---------- the beaches, the shingle and the cliffs by the sea (G10 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // From the 'shore' entry of the coast's vec packs (tools/map/shore.py: OpenStreetMap's sand and shingle within 150 m of the sea; older
  // packs have none, and nothing is drawn): each area draped on the ground, its triangles split down to 6 m so they follow it, a little
  // over it with the polygon offset. Sand pale and warm, darker and wet low down by the water; shingle grey in rounded stones' tones,
  // each point a little lighter or darker. Drawn with the lit program, so snow lies on it and the wet darkens it (G6). A mesh per tile,
  // built when the tile's ground is in and again when it comes anew; within 6 km of the eye. #shore0 in the address: none.
  const SHORE = new Map(), SHORE0 = /shore0/.test(location.hash);
  function shoreData(tx, ty){
    const pk = MAPD.man && MAPD.byTile.get('vec:' + tx + ':' + ty); if (!pk || !pk.buf) return undefined;
    const B = MAPD.man.tile / MAPD.man.block, e = pk.idx.get('shore:' + tx * B + ':' + ty * B); if (!e) return null;
    const b = fflate.inflateSync(pk.buf.subarray(e[0], e[0] + e[1])); let p = 0;
    const vi = () => { let v = 0, s = 0, c; do { c = b[p++]; v += (c & 127) * Math.pow(2, s); s += 7; } while (c & 128); return v; }, zi = () => { const v = vi(); return v % 2 ? -(v + 1) / 2 : v / 2; };
    const na = vi(), areas = [];
    for (let a = 0; a < na; a++){
      const kind = vi(); vi(); const nv = vi(), v = new Float32Array(nv * 2); let x = 0, y = 0;
      for (let i = 0; i < nv; i++){ x += zi(); y += zi(); v[i * 2] = x; v[i * 2 + 1] = y; }
      const nt = vi(), ix = new Uint32Array(nt * 3); for (let i = 0; i < nt * 3; i++) ix[i] = vi();
      areas.push({kind, v, ix});
    }
    // the cliffs (kart-17 on; an older pack ends here)
    const cliffs = [];
    if (p < b.length){ const nc = vi(); for (let c = 0; c < nc; c++){ const np = vi(), v = new Float32Array(np * 2); let x = 0, y = 0; for (let i = 0; i < np; i++){ x += zi(); y += zi(); v[i * 2] = x; v[i * 2 + 1] = y; } cliffs.push(v); } }
    areas.cliffs = cliffs;
    return areas;
  }
  function shoreTile(tx, ty){
    const T = MAPD.man.tile * 1000, ox = tx * T, oz = ty * T, A = shoreData(tx, ty); if (A === undefined) return undefined; if (!A || (!A.length && !(A.cliffs && A.cliffs.length))) return null;
    const m = MB(), SAND = [0.78, 0.73, 0.6], WETS = [0.5, 0.46, 0.38], SHG = [0.55, 0.54, 0.51];
    for (const a of A){
      const col = (x, z, y) => { const h = hash(Math.floor(x) * 0.37 + Math.floor(z) * 0.71), f = 0.9 + 0.2 * h;
        if (a.kind) return SHG.map(c => c * (0.85 + 0.3 * h));
        const w = clamp((1.6 - y) / 1.2, 0, 1); return mix3(SAND, WETS, w * 0.8).map(c => c * f); };
      const tri = (x0, z0, x1, z1, x2, z2, d) => {
        const l0 = (x1 - x0) ** 2 + (z1 - z0) ** 2, l1 = (x2 - x1) ** 2 + (z2 - z1) ** 2, l2 = (x0 - x2) ** 2 + (z0 - z2) ** 2, mx = Math.max(l0, l1, l2);
        if (mx <= 36 || d > 9){
          const P = [[x0, z0], [x1, z1], [x2, z2]].map(([x, z]) => { const y = terrH(ox + x, oz + z); return [x, y, z]; });
          if (P.every(q => q[1] < -1.2)) return;   // under the water even at the ebb
          const c = col(ox + (x0 + x1 + x2) / 3, oz + (z0 + z1 + z2) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3);
          m.tri([ox + P[0][0], Math.max(P[0][1], -1.2) + 0.06, oz + P[0][2]], [ox + P[1][0], Math.max(P[1][1], -1.2) + 0.06, oz + P[1][2]], [ox + P[2][0], Math.max(P[2][1], -1.2) + 0.06, oz + P[2][2]], c); return; }   // (MB's mesh(o) takes the origin off)
        if (mx === l0){ const qx = (x0 + x1) / 2, qz = (z0 + z1) / 2; tri(x0, z0, qx, qz, x2, z2, d + 1); tri(qx, qz, x1, z1, x2, z2, d + 1); }
        else if (mx === l1){ const qx = (x1 + x2) / 2, qz = (z1 + z2) / 2; tri(x0, z0, x1, z1, qx, qz, d + 1); tri(x0, z0, qx, qz, x2, z2, d + 1); }
        else { const qx = (x2 + x0) / 2, qz = (z2 + z0) / 2; tri(x0, z0, x1, z1, qx, qz, d + 1); tri(qx, qz, x1, z1, x2, z2, d + 1); }
      };
      for (let i = 0; i < a.ix.length; i += 3){ const p = a.ix[i] * 2, q = a.ix[i + 1] * 2, r = a.ix[i + 2] * 2; tri(a.v[p], a.v[p + 1], a.v[q], a.v[q + 1], a.v[r], a.v[r + 1], 0); }
    }
    // the cliffs by the sea: a rock face down from the top (1 m to the line's left, OpenStreetMap's cliff falls to its right) to the
    // ground or the low water 12 m out, where it falls 4 m or more, in steps of 4 m; grey rock, darker and wet low down
    let faces = 0, cl = 0;
    for (const v of A.cliffs || []){
      let pv = null; cl++;
      for (let i = 0; i + 1 < v.length; i += 2){ const ax = v[i], az = v[i + 1], bx = v[Math.min(i + 2, v.length - 2)], bz = v[Math.min(i + 3, v.length - 1)], L = Math.hypot(bx - ax, bz - az); if (L < 0.5 && i + 2 < v.length) continue;
        const n = Math.max(1, Math.ceil(L / 4));
        for (let k = 0; k < n || (i + 2 >= v.length && k === 0); k++){ const f = L > 0.5 ? k / n : 0, x = ox + ax + (bx - ax) * f, z = oz + az + (bz - az) * f, ux = L > 0.5 ? (bx - ax) / L : 1, uz = L > 0.5 ? (bz - az) / L : 0, lx = uz, lz = -ux;
          const top = terrH(x + lx, z + lz), foot = Math.max(-1.5, Math.min(terrH(x - lx * 12, z - lz * 12), terrH(x - lx * 6, z - lz * 6))), q = {x, z, top, foot, lx, lz};
          if (pv && pv.top - pv.foot > 4 && top - foot > 4){
            const h = hash(Math.floor(x) * 0.13 + Math.floor(z) * 0.29), R = [0.38, 0.38, 0.36].map(c => c * (0.85 + 0.3 * h)), W = [0.2, 0.19, 0.17];
            const A0 = [pv.x - pv.lx * 0.5, pv.top + 0.3, pv.z - pv.lz * 0.5], B0 = [x - lx * 0.5, top + 0.3, z - lz * 0.5], A1 = [pv.x - pv.lx * 2.5, pv.foot, pv.z - pv.lz * 2.5], B1 = [x - lx * 2.5, foot, z - lz * 2.5];
            const Am = [(A0[0] + A1[0]) / 2 - pv.lx * 0.4, Math.max(pv.foot + 1.6, (A0[1] + A1[1]) / 2), (A0[2] + A1[2]) / 2 - pv.lz * 0.4], Bm = [(B0[0] + B1[0]) / 2 - lx * 0.4, Math.max(foot + 1.6, (B0[1] + B1[1]) / 2), (B0[2] + B1[2]) / 2 - lz * 0.4];
            m.quad(A0, B0, Bm, Am, R); m.quad(Am, Bm, B1, A1, pv.foot < 1.5 ? W : R.map(c => c * 0.85)); faces++;
          }
          pv = q; if (L <= 0.5) break; }
      }
    }
    return m.p.length ? {mesh:m.mesh([ox, oz]), cliffs:cl, faces} : null;
  }
  let shoreT = 0;
  function updateShore(eye){
    if (!MAPD.man || SHORE0) return;
    const now = performance.now(); if (now - shoreT < 700) return; shoreT = now;
    const T = MAPD.man.tile * 1000, R = 6000, keep = new Set(); let built = 0;
    for (let ty = Math.floor((eye[2] - R) / T); ty <= Math.floor((eye[2] + R) / T); ty++) for (let tx = Math.floor((eye[0] - R) / T); tx <= Math.floor((eye[0] + R) / T); tx++){
      const k = tx + ':' + ty; keep.add(k); if (SHORE.has(k)) continue;
      const vp = MAPD.byTile.get('view:' + k); if (!vp || !vp.buf || built >= 1) continue;
      const S = shoreTile(tx, ty); if (S === undefined) continue; built++; SHORE.set(k, S);
    }
    for (const [k, S] of SHORE) if (!keep.has(k)){ if (S && S.mesh) freeMesh(S.mesh); SHORE.delete(k); }
  }
  function staleShore(pk){ const k = pk.tile[0] + ':' + pk.tile[1], S = SHORE.get(k); if (S && S.mesh) freeMesh(S.mesh); SHORE.delete(k); }
  function drawShore(VP){
    if (!SHORE.size || SHORE0) return;
    litSetup(VP); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -3);
    for (const S of SHORE.values()) if (S && S.mesh) drawLit(S.mesh);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
