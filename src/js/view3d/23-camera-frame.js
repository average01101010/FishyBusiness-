  // ---------- the chase camera stays out of solid things ----------
  // Quays and breakwaters, bridge decks and their piers, lighthouses, the plant's silo and crane, and the buildings, as oriented
  // boxes in a 200 m grid (buildings are added a map cell at a time when the camera first comes near). Each frame the line from the
  // boat to the eye is checked: the camera tilts up over what is in the way, and what is still in the way pulls it in along the line.
  const CAMG = new Map(), CAMC = 200, CAMBLD = new Set(); let camStamp = 0, camPull = 1, camLift = 0;
  // a box the way MB.box draws it: centre x, z; size sx across and sz along the heading ry; from y0 up to y1
  function camSolid(x, z, sx, sz, ry, y0, y1, tag){
    const b = {x, z, c:Math.cos(ry), s:Math.sin(ry), hx:sx / 2, hz:sz / 2, y0, y1, m:0, tag}, r = Math.hypot(sx, sz) / 2;
    for (let gx = Math.floor((x - r) / CAMC); gx <= Math.floor((x + r) / CAMC); gx++) for (let gz = Math.floor((z - r) / CAMC); gz <= Math.floor((z + r) / CAMC); gz++){
      const k = gridKey(gx, gz); let a = CAMG.get(k); if (!a) CAMG.set(k, a = []); a.push(b); }
  }
  // the buildings of one 1 km map cell, as tall as buildChunk makes them at most (walls, roof and the rise of the ground)
  const BLD_WALL = {1:6, 3:2.6, 4:2.9, 5:3.1, 6:5.2, 7:2.3, 8:7.5, 11:7, 12:1.8, 13:2.6, 14:2.5, 15:1.2}, BLD_ROOF = {3:[0.22, 2], 5:[0.45, 6], 6:[0.4, 7], 7:[0.3, 2], 11:[0.6, 9]};
  function camBuildings(key){
    if (!CAMBLD.has(key)){ CAMBLD.add(key); if (BLD) camBld(BLD, BLD.cells.get(key)); }
    // a pack's: once its tile is decoded (a tile whose pack is on its way is looked at again)
    const vk = 'v' + key; if (CAMBLD.has(vk)) return;
    const T = MAPD.man ? MAPD.man.tile : 50, tx = Math.floor(gridKeyX(key) / T), ty = Math.floor(gridKeyY(key) / T), t = vecTile(tx, ty);
    if (!t && vecHas(tx, ty)) return;
    CAMBLD.add(vk); if (t && t.bld) camBld(t.bld, vecBldIn(t, key), t.k);
  }
  function camBld(B, idx, tag){
    for (const i of idx || []){
      const x = B.x[i], z = B.z[i], l = B.l[i], w = B.w[i], ty = B.t[i], lv = B.lv[i], ca = Math.cos(B.a[i]), sa = Math.sin(B.a[i]);
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(x + ca * u * l - sa * v * w, z + sa * u * l + ca * v * w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const base = Math.max(lo, 0.3) - 0.5, rise = Math.max(0, hi - base);
      const hg = ty === 1 && lv ? 2.7 * lv + 0.6 : ty === 2 ? (lv || 3) * 3 : ty === 6 && lv ? 3 * lv : ty === 8 && lv ? 4 * lv : ty === 9 || ty === 10 ? (lv || 2) * 3.4 : ty === 0 && lv ? 2.8 * lv : BLD_WALL[ty] || 3.6;
      const flat = ty === 2 || ty === 8 || ty === 9 || ty === 12 || ty === 14 || ty === 15 || (ty === 10 && w >= 14), rp = BLD_ROOF[ty] || [0.38, 6];
      camSolid(x, z, w + 0.8, l + 0.8, Math.PI / 2 - B.a[i], base, base + hg + rise + (flat ? 0.3 : Math.min(w * rp[0], rp[1]) + 0.3), tag);
    }
  }
  // what a tile of the coast's packs put in the camera's way goes with it
  function camDropTag(tag){ for (const [k, a] of CAMG){ const b = a.filter(q => q.tag !== tag); if (b.length !== a.length){ if (b.length) CAMG.set(k, b); else CAMG.delete(k); } } }
  const slab = (p, d, lo, hi, r) => { if (Math.abs(d) < 1e-9) return p >= lo && p <= hi; let a = (lo - p) / d, b = (hi - p) / d; if (a > b){ const q = a; a = b; b = q; } if (a > r[0]) r[0] = a; if (b < r[1]) r[1] = b; return r[0] <= r[1]; };
  // how much of the way from o (the boat) to e (the eye) is clear: 1 when nothing is in the way. Boxes o is inside do not count.
  function camFree(o, e){
    const dx = e[0] - o[0], dy = e[1] - o[1], dz = e[2] - o[2], x0 = Math.min(o[0], e[0]), x1 = Math.max(o[0], e[0]), z0 = Math.min(o[2], e[2]), z1 = Math.max(o[2], e[2]);
    const g0 = Math.floor(x0 / CAMC), g1 = Math.floor(x1 / CAMC), h0 = Math.floor(z0 / CAMC), h1 = Math.floor(z1 / CAMC);
    if ((g1 - g0 + 1) * (h1 - h0 + 1) > 36) return 1;   // far out the camera is high above everything
    for (let kx = Math.floor((x0 - 60) / 1000); kx <= Math.floor((x1 + 60) / 1000); kx++) for (let kz = Math.floor((z0 - 60) / 1000); kz <= Math.floor((z1 + 60) / 1000); kz++) camBuildings(gridKey(kx, kz));
    let best = 1; const st = ++camStamp, r = [0, 0];
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) for (const b of CAMG.get(gridKey(gx, gz)) || []){
      if (b.m === st) continue; b.m = st;
      const px = o[0] - b.x, pz = o[2] - b.z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * b.c - pz * b.s, dx * b.c - dz * b.s, -b.hx, b.hx, r) || !slab(px * b.s + pz * b.c, dx * b.s + dz * b.c, -b.hz, b.hz, r) || !slab(o[1], dy, b.y0, b.y1, r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    // the other boats in sight (npcNow: the coast's, Senja's fleet, the players'), each a box of her length and beam from the waterline to
    // her wheelhouse's roof (the coastal ship and the ferry to their bridges), so the camera does not go into a boat lying alongside
    for (const n of npcNow){ const L = n.L || 9, B = n.B || L / 3, x = n.p.x * 1000, z = n.p.y * 1000, rr = L / 2 + B;
      if (x + rr < x0 || x - rr > x1 || z + rr < z0 || z - rr > z1) continue;
      const big = n.type === 'coastal' || n.type === 'ferry', cs = Math.sin(n.hd || 0), sn = Math.cos(n.hd || 0), px = o[0] - x, pz = o[2] - z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * cs - pz * sn, dx * cs - dz * sn, -L / 2, L / 2, r) || !slab(px * sn + pz * cs, dx * sn + dz * cs, -B / 2, B / 2, r) || !slab(o[1], dy, (env.tide || 0) - 1, (env.tide || 0) + (big ? 18 : Math.min(7, 2 + L * 0.25)), r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    return best;
  }
  // is a point inside something solid (for the tests)
  function camInside(x, y, z){ camBuildings(gridKey(Math.floor(x / 1000), Math.floor(z / 1000))); for (const b of CAMG.get(gridKey(Math.floor(x / CAMC), Math.floor(z / CAMC))) || []){ const px = x - b.x, pz = z - b.z, lx = px * b.c - pz * b.s, lz = px * b.s + pz * b.c; if (Math.abs(lx) <= b.hx && Math.abs(lz) <= b.hz && y >= b.y0 && y <= b.y1) return true; } return false; }
  let lastEye = [0, 0, 0], camFwd = [0, -1], earT = 0;
  // the compass line at the top of the 3D view (the user's wish 02.10.2026): the true bearing the camera looks along, thin ticks every
  // 5 degrees, the quarters and eighths by name and the tens of degrees between them, 70 degrees either way; drawn when it turns
  // The compass line: a strip of the whole round (and 70 degrees more each side) is drawn once per width, pixel ratio and language,
  // and each frame only shows the part round the heading (it was drawn anew with shadows at every 0.2 degrees, 03.10.2026)
  const CMPS = {el:document.getElementById('compass3d'), at:NaN, w:0, strip:null, key:''};
  function compassStrip(W, H, dpr){
    const span = 70, k = W / (2 * span), names = S.lang === 'no' ? ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const c = CMPS.strip || (CMPS.strip = document.createElement('canvas')); c.width = Math.ceil((360 + 2 * span) * k); c.height = H;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, H); g.lineCap = 'round'; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 3 * dpr;
    for (let a = -span; a <= 360 + span; a += 5){
      const x = (a + span) * k, n = ((a % 360) + 360) % 360, main = n % 45 === 0;
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = (main ? 1.6 : 1) * dpr;
      g.beginPath(); g.moveTo(x, H - 2 * dpr); g.lineTo(x, H - (main ? 9 : n % 15 === 0 ? 6 : 4) * dpr); g.stroke();
      if (main || n % 15 === 0){ g.fillStyle = '#fff'; g.font = (main ? '600 ' + Math.round(12 * dpr) : Math.round(9.5 * dpr)) + 'px sans-serif'; g.fillText(main ? names[n / 45] : String(n), x, H - 12 * dpr); }
    }
    return k;
  }
  function compassDraw(az, p){
    const el = CMPS.el; if (!el || !el.clientWidth) return;
    const deg = trueDeg(az, p); if (Math.abs(deg - CMPS.at) < 0.1 && CMPS.w === el.clientWidth) return; CMPS.at = deg; CMPS.w = el.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(el.clientWidth * dpr), H = Math.round(el.clientHeight * dpr); if (el.width !== W) el.width = W; if (el.height !== H) el.height = H;
    const key = W + ',' + H + ',' + dpr + ',' + S.lang; if (key !== CMPS.key){ CMPS.key = key; CMPS.k = compassStrip(W, H, dpr); }
    const span = 70, k = CMPS.k, g = el.getContext('2d');
    g.clearRect(0, 0, W, H); g.drawImage(CMPS.strip, (deg % 360) * k, 0, W, H, 0, 0, W, H);
    // the ends fade out (one gradient over what was drawn)
    g.globalCompositeOperation = 'destination-in'; if (!CMPS.fade || CMPS.fw !== W){ const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.5, '#000'); gr.addColorStop(0.75, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); CMPS.fade = gr; CMPS.fw = W; }
    g.fillStyle = CMPS.fade; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff5aa8'; g.beginPath(); g.moveTo(W / 2 - 4 * dpr, H); g.lineTo(W / 2 + 4 * dpr, H); g.lineTo(W / 2, H - 6 * dpr); g.closePath(); g.fill();
  }

  // ---------- frame ----------
  // «#fps» in the address: the frame rate in a corner, to measure on the tablet
  const FPS = {v:0, at:0, el:null};
  // shown with «#fps» in the address or «Vis bildetakt» in the settings (S.settings.fpsShow)
  function fpsEl(){
    const on = /fps/.test(location.hash) || !!(S.settings && S.settings.fpsShow);
    if (on && !FPS.el){ FPS.el = document.createElement('div'); FPS.el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:12px monospace;color:#fff;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:4px;pointer-events:none'; document.body.appendChild(FPS.el); }
    if (FPS.el) FPS.el.hidden = !on;
    return on ? FPS.el : null;
  }
