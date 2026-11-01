  // ---------- the small-boat harbours (G10 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // In OpenStreetMap's marinas (src/data/marina.json, tools/map/marina.py) within 1.5 km, small boats lie moored: bow in at the finger
  // berths along both sides of the floating docks inside (src/data/flyte.json), 3.2 m apart, else on buoys in rows over the water that
  // is deep enough. Four kinds (an open boat with an outboard, a snekke, a motor cruiser, a sailing boat with its mast), each its own
  // colours; four in five berths taken from May to September, one in three in the winter (the rest are on land). Where they lie is
  // decided by the berth's hash, so everyone sees the same. #marina0 in the address: none.
  const MARINA = /*@include(data/marina.json)*/null;
  const MAR = {on:!/marina0/.test(location.hash), M:null, near:[], at:-1e9, O:[1e9, 1e9], n:0};
  function marinaModels(){
    if (MAR.M) return MAR.M;
    const W = [0.93, 0.93, 0.91], RB = [0.55, 0.12, 0.1], DK = [0.12, 0.14, 0.17], M = [];
    const hull = (L, B, D, F, h, b, deck) => { const m = MB(); shipHull(m, L, B, D, F, h, b, deck); return m; };
    // an open boat with an outboard (5 m)
    let m = hull(5, 1.9, 0.45, 0.55, [0.6, 0.64, 0.6], [0.3, 0.32, 0.3], [0.55, 0.5, 0.42]); m.box(0, 0.2, 2.35, 0.4, 0.7, 0.4, [0.12, 0.12, 0.13], 0); m.box(0, 0.3, 0.3, 1.4, 0.1, 0.4, [0.5, 0.45, 0.38], 0); M.push(m.mesh());
    // a snekke (7 m) with its little wheelhouse
    m = hull(7, 2.4, 0.7, 0.75, [0.88, 0.86, 0.8], RB, [0.62, 0.58, 0.5]); m.box(0, 0.75, 0.6, 1.4, 1.2, 1.5, W, 0, [0.25, 0.27, 0.3]); m.box(0, 1.45, 0.05, 1.42, 0.35, 0.05, DK, 0); M.push(m.mesh());
    // a motor cruiser (9 m), white with the dark band of its windows
    m = hull(9, 3, 0.8, 1.0, W, [0.15, 0.2, 0.35], [0.75, 0.72, 0.66]); m.box(0, 1.0, -0.6, 2.4, 1.1, 4.2, W, 0); m.box(0, 1.45, -0.6, 2.44, 0.45, 3.6, DK, 0); m.box(0, 2.1, -0.4, 2.0, 0.1, 2.6, W, 0); M.push(m.mesh());
    // a sailing boat (9 m) with its mast and boom
    m = hull(9, 3, 1.0, 0.9, W, [0.12, 0.12, 0.14], [0.65, 0.58, 0.46]); m.box(0, 0.9, 0.2, 1.9, 0.6, 2.8, W, 0, [0.6, 0.6, 0.6]); m.box(0, 0.9, -0.9, 0.12, 12, 0.12, [0.75, 0.76, 0.78], 0); m.box(0, 2.2, 0.6, 0.1, 0.12, 3.3, [0.75, 0.76, 0.78], 0); m.box(0, 2.3, 0.6, 0.35, 0.35, 3.0, [0.16, 0.22, 0.4], 0); M.push(m.mesh());
    // a mooring buoy
    m = MB(); m.box(0, -0.15, 0, 0.55, 0.5, 0.55, [0.95, 0.45, 0.1], 0); M.buoy = m.mesh();
    return MAR.M = M;
  }
  const marInside = (P, x, z) => { let c = false; for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2){ const xi = P[i], zi = P[i + 1], xj = P[j], zj = P[j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  // the berths of the marinas near the eye: [x, z, heading, kind, buoy]
  function marinaBuild(eye, now){
    MAR.at = now; MAR.O = [eye[0], eye[2]]; const out = [], mo = gDate(S.t / 60).getUTCMonth(), occ = mo >= 4 && mo <= 8 ? 0.8 : 0.33;
    for (const [cx, cz, rel] of MARINA.m){
      if (Math.abs(cx - eye[0]) > 2200 || Math.abs(cz - eye[2]) > 2200) continue;
      const P = rel.map((v, i) => v + (i % 2 ? cz : cx)); let x0 = 1e18, x1 = -1e18, z0 = 1e18, z1 = -1e18;
      for (let i = 0; i < P.length; i += 2){ x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); z0 = Math.min(z0, P[i + 1]); z1 = Math.max(z1, P[i + 1]); }
      const T = MAPD.man ? MAPD.man.tile * 1000 : 50000, docks = flyteTile(Math.floor(cx / T), Math.floor(cz / T)).filter(d => d.mx > x0 - 30 && d.mx < x1 + 30 && d.mz > z0 - 30 && d.mz < z1 + 30);
      let n = 0;
      // along the floating docks: a berth each 3.2 m on both sides, bow in, the boat as long as the finger it lies at
      for (const d of docks) for (const L of d.L){ const p = L.p;
        for (let k = 1; k < p.length; k++){ const [ax, az] = p[k - 1], [bx, bz] = p[k], len = Math.hypot(bx - ax, bz - az); if (len < 4) continue; const ux = (bx - ax) / len, uz = (bz - az) / len;
          for (let s = 2.5; s < len - 1.5; s += 3.2) for (const sd of [1, -1]){ const h = hash(ax * 0.37 + az * 0.71 + s * 13.1 + sd * 7.7); if (h > occ) continue;
            const kind = Math.floor(hash(h * 1e4) * 4), half = [2.5, 3.5, 4.5, 4.5][kind], nx = -uz * sd, nz = ux * sd, o = L.w / 2 + 0.6 + half;
            const x = ax + ux * s + nx * o, z = az + uz * s + nz * o; if (terrRaw(x, z) > -0.8) continue;
            out.push([x, z, Math.atan2(-nx, nz), kind, 0, h]); n++; } } }
      // no docks: buoys in rows over the water inside the marina, 14 m by 10 m
      if (!n) for (let z = z0 + 5; z < z1; z += 14) for (let x = x0 + 5; x < x1; x += 10){
        const h = hash(x * 0.31 + z * 0.17); if (h > occ * 0.9 || !marInside(P, x, z) || terrRaw(x, z) > -1.5 || terrRaw(x + 6, z) > -0.5 || terrRaw(x - 6, z) > -0.5 || terrRaw(x, z + 6) > -0.5 || terrRaw(x, z - 6) > -0.5) continue;
        out.push([x, z, hash(h * 3e4) * 0.6 - 0.3 + windDir(S.t / 60, {x:x / 1000, y:z / 1000}) * DEG, Math.floor(hash(h * 1e4) * 4), 1, h]); }
    }
    MAR.near = out;
  }
  function drawMarinas(eye, t, VP){
    if (!MAR.on || !MARINA || typeof shipHull !== 'function') return;
    const now = performance.now() / 1000;
    if (now - MAR.at > 8 || Math.hypot(eye[0] - MAR.O[0], eye[2] - MAR.O[1]) > 200) marinaBuild(eye, now);
    if (!MAR.near.length){ MAR.n = 0; return; }
    const M = marinaModels(), tide = env.tide || 0; litSetup(VP); let n = 0;
    for (const [x, z, hd, k, buoy, h] of MAR.near){ if (Math.hypot(x - eye[0], z - eye[2]) > 1500 || n > 260) continue;
      const y = tide + (seaH(x, z, t) - tide) * 0.6, rl = Math.sin(t * (0.8 + h) + h * 30) * 0.03, pt = Math.sin(t * (0.6 + h) + h * 17) * 0.015;
      drawLit(M[k], model(x - eye[0], y - eye[1], z - eye[2], -hd, pt, rl)); n++;
      if (buoy){ const bx = x + Math.sin(hd) * ([2.5, 3.5, 4.5, 4.5][k] + 2), bz = z - Math.cos(hd) * ([2.5, 3.5, 4.5, 4.5][k] + 2); drawLit(M.buoy, model(bx - eye[0], seaH(bx, bz, t) - eye[1], bz - eye[2], 0, 0, 0)); } }
    MAR.n = n;
  }
