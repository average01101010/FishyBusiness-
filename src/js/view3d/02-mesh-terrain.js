  // ---------- mesh builder ----------
  function MB(){
    const p = [], c = [];
    const o = {p, c,
      tri(a, b, d, k){ p.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]); for (let i = 0; i < 3; i++) c.push(k[0], k[1], k[2]); },
      quad(a, b, d, e, k){ o.tri(a, b, d, k); o.tri(a, d, e, k); },
      box(cx, cy, cz, sx, sy, sz, k, ry, kTop){
        ry = ry || 0; const cr = Math.cos(ry), sr = Math.sin(ry), hx = sx / 2, hz = sz / 2;
        const Q = (x, y, z) => [cx + x * cr + z * sr, cy + y, cz - x * sr + z * cr];
        const v = [Q(-hx,0,-hz), Q(hx,0,-hz), Q(hx,0,hz), Q(-hx,0,hz), Q(-hx,sy,-hz), Q(hx,sy,-hz), Q(hx,sy,hz), Q(-hx,sy,hz)];
        o.quad(v[0], v[1], v[5], v[4], k); o.quad(v[1], v[2], v[6], v[5], k); o.quad(v[2], v[3], v[7], v[6], k); o.quad(v[3], v[0], v[4], v[7], k);
        o.quad(v[4], v[5], v[6], v[7], kTop || k); o.quad(v[3], v[2], v[1], v[0], k);
      },
      house(cx, cy, cz, w, l, hg, ry, wall, roof, pitch, cap){
        o.box(cx, cy, cz, w, hg, l, wall, ry);
        const cr = Math.cos(ry), sr = Math.sin(ry), Q = (x, y, z) => [cx + x * cr + z * sr, cy + y, cz - x * sr + z * cr];
        const hx = w / 2 + 0.4, hz = l / 2 + 0.4, top = hg + Math.min(w * (pitch || 0.38), cap || 99);
        const a = Q(-hx, hg, -hz), b = Q(hx, hg, -hz), d = Q(hx, hg, hz), e = Q(-hx, hg, hz), r1 = Q(0, top, -hz), r2 = Q(0, top, hz);
        o.quad(a, r1, r2, e, roof); o.quad(r1, b, d, r2, roof); o.tri(a, b, r1, wall); o.tri(e, r2, d, wall);
      },
      // flat rectangle on a wall: centre (x, yc, z), along (ux, uz)
      panel(x, yc, z, ux, uz, w, h, k){
        const hw = w / 2, hh = h / 2;
        o.quad([x - ux * hw, yc - hh, z - uz * hw], [x + ux * hw, yc - hh, z + uz * hw], [x + ux * hw, yc + hh, z + uz * hw], [x - ux * hw, yc + hh, z - uz * hw], k);
      },
      spire(cx, cy, cz, s, hg, k){
        const a = [cx - s, cy, cz - s], b = [cx + s, cy, cz - s], c = [cx + s, cy, cz + s], d = [cx - s, cy, cz + s], t = [cx, cy + hg, cz];
        o.tri(a, b, t, k); o.tri(b, c, t, k); o.tri(c, d, t, k); o.tri(d, a, t, k);
      },
      beam(A, B, r, k){
        const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]), n = d.map(v => v / L);
        const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        let u = [n[1] * up[2] - n[2] * up[1], n[2] * up[0] - n[0] * up[2], n[0] * up[1] - n[1] * up[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / ul);
        const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
        const off = [0, 1, 2].map(i => { const a = i * 2 * Math.PI / 3; return [0, 1, 2].map(j => (u[j] * Math.cos(a) + w[j] * Math.sin(a)) * r); });
        for (let i = 0; i < 3; i++){ const j = (i + 1) % 3; o.quad([A[0] + off[i][0], A[1] + off[i][1], A[2] + off[i][2]], [B[0] + off[i][0], B[1] + off[i][1], B[2] + off[i][2]], [B[0] + off[j][0], B[1] + off[j][1], B[2] + off[j][2]], [A[0] + off[j][0], A[1] + off[j][1], A[2] + off[j][2]], k); }
      },
      // more than MESHMAX triangles go up in parts: one draw over 65 535 triangles stalled SwiftShader for seconds a frame (03.10.2026)
      mesh(o){ const n = p.length / 9; if (n <= MESHMAX) return withOrigin(upload(relTo(p, o), new Float32Array(c)), o);
        const parts = []; for (let a = 0; a < n; a += MESHMAX){ const b = Math.min(n, a + MESHMAX); parts.push(withOrigin(upload(relTo(p.slice(a * 9, b * 9), o), new Float32Array(c.slice(a * 9, b * 9))), o)); } return {parts, n:n * 3, o}; }
    };
    return o;
  }

  // ---------- terrain ----------
  // Senja's snow line by month (m): below the sea in winter, so the snow lies right down to the shore (tilbakemelding #2, #19: green
  // grass along the water by the naust while all else was white). Along the coast it moves with how much warmer or colder the place is
  // than Senja (core/03-simulation.js climDiff), about 150 m a degree (air cools some 0.65 °C per 100 m)
  const SNOWLINE = [-120,-120,-80,150,350,650,900,1000,850,450,120,-80];
  // since V2 of the weather plan the snow lies where it has fallen and not yet melted (core snowLineAt: day by day at every 100 m of
  // height where the boat is); the table is only what is used if that is missing
  const snowLine = H => typeof snowLineAt === 'function' ? snowLineAt(H) : seasonal(SNOWLINE, H) + clamp(typeof climDiff === 'function' ? climDiff('t', H) : 0, -6, 8) * 150;
  // the grass and the birch by the season where the boat is (core seasonAt, V3): 0 straw-coloured to 1 green; the birch bare, in leaf
  // or yellow
  const grassNow = () => typeof seasonAt === 'function' ? Math.round(seasonAt(S.t / 60).grass * 10) / 10 : 1;
  // real ground height (m) at world x/z (m); sea floor is shaped from shore distance and exposure; where a harbour unit stands, its
  // ground (unitTerr)
  // The shore (#61, Jonas 12.10.2026: land missing along the water, a brown line in the sea, the surf beside the land): one profile,
  // keyed to the chart's own coast line (coast2, coastSdIf = signed distance, + on land), decides where the ground meets the sea,
  // for the meshes, the physics, the shore texture the terrain shader cuts by (buildLandMask) and the surf in the sea shader:
  //   on the line and inland the ground is at least COAST3.top (2.0 m: over the highest astronomical tide along the coast, 1.75 m in
  //   East Finnmark, with room for the texture's byte and its blend at the line; the line is about the mean high water, and flat
  //   coastal land of the tiles stood under the sea at high water);
  //   seaward the foreshore falls 1 in 3 (g; 1 in 1.5 for a breakwater's armour, gMole, where the nearest edge is a breakwater's,
  //   COAST.mole, in the texture and the mesh alike) to COAST3.deep, then
  //   the sea bed of the tiles, held under deep (no ground of the 25 m mask stands in water the chart shows).
  // So the waterline is where the tide meets the ramp: on the line at high water, out to (top - tide) / g m at ebb, with the rockweed
  // and the barnacles (recolor, TER_FS) exposed between, and the surf (SEA_FS) on it, wherever the tide stands.
  // dil (m): the meshes' own cell size (terrCoarse, nearSurf; not what the boat and the camera ask). A coarse mesh (12-47 m) is flat at
  // top from the line out to one cell at sea before the ramp, so a triangle across the line never dips under water inside it (the sea
  // bit into the land in teeth of up to half a cell); the texture cuts the rest at the waterline. The fine mesh (4 m) carries the ramp.
  const COAST3 = {top:2.0, g:1 / 3, gMole:1 / 1.5, deep:-2.5, swash:0.8};
  function terrRaw(x, z, dil){
    if (x < MAPB.x0 * 1000 || z < MAPB.y0 * 1000 || x > MAPB.x1 * 1000 || z > MAPB.y1 * 1000) return -40;
    // the tiles' ground (25 m) where they have it and it is in; else the far heights (200 m, phase K8) held to the national core's
    // 200 m land, which the simulation sails by off the tiles (land at least a little above the sea, the sea a little below); else
    // a flat stand-in from that land until the far pack comes
    let h;
    h = HG ? tileH(MAPD.L.hgt, 'view', x, z) : NaN;
    if (h !== h){ const m = rbilM(MAPD.L.land200, x, z); h = HG ? tileH(MAPD.L.far, 'far', x, z) : NaN; if (h !== h) h = m >= 0.5 ? 2 : -4; h = m >= 0.5 ? Math.max(h, 0.3 + (m - 0.5) * 6) : Math.min(h, -0.5 - (0.5 - m) * 8); }
    const fl = dil > 6 ? dil : 0;
    const sd = coastSdIf({x:x / 1000, y:z / 1000}, (COAST3.top - COAST3.deep) / COAST3.g + fl + 2);
    if (sd === sd){
      if (sd >= 0) h = Math.max(h, COAST3.top);
      else { const r = COAST3.top + Math.min(0, sd + fl) * (COAST.mole ? COAST3.gMole : COAST3.g); h = r > COAST3.deep ? r : Math.min(h, COAST3.deep); }
    }
    h = siteTerr(x, z, h);   // Father's naust and the Finnsnes shop (SITES)
    if (BPIT.l.length || (NPIT.l.length && !NPIT.off)) h = berthPit(x, z, h);
    return h > -3 && harbourNear(x, z) && inHarbourPocket({x:x / 1000, y:z / 1000}) ? -3 : h;   // the water in front of a quay (01-world.js)
  }
