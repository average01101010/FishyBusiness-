  // ---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------
  // The landing block on the shore at the dock's root, the aluminium gangway hinged on it and resting on the first pontoon with its
  // rollers (steeper at low water), the concrete pontoons riding the tide, the last with its ladder and life ring; the buoys on the swell.
  let DKM = null;
  function buildDocks(){
    DKM = false; if (typeof glbHas !== 'function' || !glbHas('brygge')) return;
    const up = nm => { const o = glbPart('brygge', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    DKM = {kar:up('landkar'), gang:up('landgang'), pon:up('ponton'), end:up('ponton_end'), fin:up('finger'), boye:up('boye'), kaib:up('kai_betong'), ktre:up('kai_tre')};
    if (!DKM.pon || !DKM.gang) DKM = false;
  }
  function drawDocks(eye, t, VP){
    if (typeof MOOR === 'undefined' || !VEC.tiles.size) return;
    const R = 1500, H = [];
    for (const tl of vecTilesIn(eye[0] - R, eye[2] - R, eye[0] + R, eye[2] + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - eye[0], h.y * 1000 - eye[2]) < R + 500) H.push(h);
    if (!H.length) return; if (DKM === null) buildDocks(); if (!DKM) return;
    nSetup(VP); const tide = env.tide || 0;
    // the berths the company holds along a quay face or the shore of a harbour (core/07e-havn.js): a quay front where she lies, in 6 m
    // bays, its top 2.4 m over mean sea level: concrete at a quay (kai_betong: the face at z = 0, the deck back to z = -5), and a timber
    // pier on piles along the shore for a boat under 15 m (kai_tre: 4.2 m wide about z = 0, so its middle 2.3 m in from the face); the
    // piers are drawn already
    if (DKM.kaib && typeof havnStore === 'function'){ const st = havnStore();
      for (const id in st.s){ const s = st.s[id], f = s.face; if (!s.vid || !f || f.dock || !(f.kind === 2 || f.kind === 3) || Math.hypot(f.x - eye[0], f.z - eye[2]) > R) continue;
        let yaw = Math.atan2(-f.uz, f.ux); if (-f.uz * f.nx + f.ux * f.nz < 0) yaw += Math.PI;
        const tre = f.kind === 3 && s.L < 15 && DKM.ktre, M = tre ? DKM.ktre : DKM.kaib, bk = tre ? 2.3 : 0;
        const n = Math.ceil((s.L + 4) / 6); for (let k = 0; k < n; k++){ const a = (k - (n - 1) / 2) * 6; drawN(M, model(f.x + f.ux * a - f.nx * bk - eye[0], -eye[1], f.z + f.uz * a - f.nz * bk - eye[2], yaw, 0, 0)); } } }
    for (const h of H){
      for (const d of h.docks || []){ const [ox, oz] = d.o, [nx, nz] = d.n; if (Math.hypot(ox - eye[0], oz - eye[2]) > R) continue;
        const yaw = Math.atan2(-nz, nx), fl = tide + FDOCK.FB, top = FDOCK.QTOP + 0.16, dh = top - fl, run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
        if (DKM.kar) drawN(DKM.kar, model(ox - eye[0], -eye[1], oz - eye[2], yaw, 0, 0));
        // the pontoons heave a little with the swell where they lie, the whole string as one
        const sm = d.s0 + d.np * FDOCK.PL / 2, wx = ox + nx * sm, wz = oz + nz * sm, y = tide + (seaH(wx, wz, t) - tide) * 0.3;
        for (let k = 0; k < d.np; k++){ const s = d.s0 + FDOCK.PL * (k + 0.5);
          drawN(k === d.np - 1 && DKM.end ? DKM.end : DKM.pon, model(ox + nx * s - eye[0], y - eye[1], oz + nz * s - eye[2], yaw, 0, 0)); }
        drawN(DKM.gang, model(ox - eye[0], top - eye[1], oz - eye[2], yaw, 0, -Math.atan2(dh - (y - tide), run)));
      }
      if (DKM.boye) for (const b of h.boats){ const q = b.moored && b.moored.buoy; if (!q) continue; const x = q.x * 1000, z = q.y * 1000;
        if (Math.hypot(x - eye[0], z - eye[2]) > R) continue;
        const y = seaH(x, z, t), sx = (seaH(x + 0.5, z, t) - seaH(x - 0.5, z, t)), sz = (seaH(x, z + 0.5, t) - seaH(x, z - 0.5, t));
        drawN(DKM.boye, model(x - eye[0], y - eye[1], z - eye[2], 0, -sz * 0.8, sx * 0.8)); }
    }
    gl.useProgram(PL.p);
  }
  // ---------- the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94) ----------
  // (built a dock a step in the tile's statics job, tileStatics: floatJob)
  // Each dock's lines become the harbour's modules: pontoons of 12 m along a line of 1.6 m and wider (scaled along to fit each leg and
  // across to its width), the end pontoon with its ladder and life ring at an open end, fingers of 8 m from the end where they join; at
  // an end with land or a pier within 10 m beyond it, the abutment there and the gangway down onto the dock (one a dock, the nearest).
  // Within FLNEAR of the eye (by the quality level) the modules in sight are drawn (800 to 1 600 triangles each, one draw each; the
  // densest marinas, round Oslo, have some 300 within 350 m); the whole tile as low boxes in one mesh, a little
  // inside the modules so they cover them near. Both ride the tide, the modules heaving a little with the swell. The camera's solids
  // are the decks from below the water to over the rails.
  const FLT = new Map(), FLNEAR = [150, 250, 350, 450];   // by QUAL.lvl
  const distPL = (x, z, p) => { let b = 1e9; for (let i = 0; i + 1 < p.length; i++){ const [ax, az] = p[i], [bx, bz] = p[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9, u = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); b = Math.min(b, Math.hypot(ax + dx * u - x, az + dz * u - z)); } return b; };
  // a module's matrix but for its place: turned to (ux, uz) and scaled sx along, sz across (the place is set as it is drawn)
  const flM = (ux, uz, sx, sz) => new Float32Array([ux * sx, 0, uz * sx, 0, 0, 1, 0, 0, -uz * sz, 0, ux * sz, 0, 0, 0, 0, 1]);
  function floatFree(k){ const F = FLT.get(k); if (F && F.mesh && gl) freeMesh(F.mesh); FLT.delete(k); }
  function floatJob(t, FD, solid){
    const far = MB(), docks = [], DK = [0.42, 0.36, 0.3], SD = [0.6, 0.6, 0.58], P = FDOCK;
    const box = (x, z, ux, uz, w, l) => far.box(x, -0.35, z, w, 0.77, l, SD, Math.atan2(ux, uz), DK);
    // the tile's lines with their boxes: an end within 1.5 m of another line, of this dock or another (OpenStreetMap often has each arm
    // of a dock as a pier of its own), is joined there
    const LS = []; for (const d of FD) for (const L of d.L){ let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (const [x, z] of L.p){ x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } LS.push({L, x0, z0, x1, z1}); }
    const joinedAt = (x, z, self) => LS.some(o => o.L !== self && x > o.x0 - 2 && x < o.x1 + 2 && z > o.z0 - 2 && z < o.z1 + 2 && distPL(x, z, o.L.p) < 1.5);
    const dock = d => {
      const D = {mx:d.mx, mz:d.mz, r:0, mods:[]};
      // the open ends of its pontoon lines, each with how far beyond it land or a pier is (within 10 m): the nearest has the dock's one
      // gangway, one that lies against land (3 m) nothing, the others the end pontoon
      const LP = [], ends = [];
      for (const L of d.L){
        const p = L.p.slice(), n = p.length; if (n < 2) continue;
        const fin = L.w < 1.6, j0 = joinedAt(p[0][0], p[0][1], L), j1 = joinedAt(p[n - 1][0], p[n - 1][1], L);
        if (fin && !j0 && j1) p.reverse();   // a finger from where it joins
        const E = {L, p, fin, e:[null, null]}; LP.push(E); if (fin) continue;
        for (const [k, e, f] of [[0, p[0], p[1]], [1, p[n - 1], p[n - 2]]]){ if (k ? j1 : j0) continue;
          const dx = e[0] - f[0], dz = e[1] - f[1], l = Math.hypot(dx, dz) || 1, ox = dx / l, oz = dz / l; let sd = null;
          for (let s = 1; s <= 10 && sd === null; s++) if (solid(e[0] + ox * s, e[1] + oz * s)) sd = s;
          ends.push({E, k, e, ox, oz, sd}); E.e[k] = 'end'; }
      }
      const g = ends.filter(q => q.sd !== null).sort((a, b) => a.sd - b.sd)[0];
      for (const q of ends){
        if (q === g){ const x = q.e[0] + q.ox * q.sd, z = q.e[1] + q.oz * q.sd; q.E.e[q.k] = 'gang';
          D.mods.push({M:'kar', x, z, m:flM(-q.ox, -q.oz, 1, 1)}, {M:'gang', x, z, ux:-q.ox, uz:-q.oz}); box(x - q.ox * 1.6, z - q.oz * 1.6, q.ox, q.oz, 3.2, 3.2); }
        else if (q.sd !== null && q.sd <= 3) q.E.e[q.k] = null; }
      for (const {L, p, fin, e:[e0, e1]} of LP){
        const n = p.length;
        for (let i = 0; i + 1 < n; i++){
          const [ax, az] = p[i], [bx, bz] = p[i + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
          const ux = (bx - ax) / len, uz = (bz - az) / len;
          D.r = Math.max(D.r, Math.hypot(ax - d.mx, az - d.mz), Math.hypot(bx - d.mx, bz - d.mz));
          camSolid((ax + bx) / 2, (az + bz) / 2, L.w, len, Math.atan2(ux, uz), -1, 1.3, t.k);
          if (fin){ const k = Math.max(1, Math.round(len / 8)), sx = len / (k * 8), sz = clamp(L.w / 0.8, 0.7, 2);
            for (let j = 0; j < k; j++) D.mods.push({M:'fin', x:ax + ux * len * j / k, z:az + uz * len * j / k, m:flM(ux, uz, sx, sz)});
            box((ax + bx) / 2, (az + bz) / 2, ux, uz, L.w * 0.9, len); continue; }
          const k = Math.max(1, Math.round(len / P.PL)), sx = len / (k * P.PL), sz = clamp(L.w / P.PW, 0.7, 1.6);
          for (let j = 0; j < k; j++){ const s = len * (j + 0.5) / k, x = ax + ux * s, z = az + uz * s;
            if (e0 === 'end' && i === 0 && j === 0) D.mods.push({M:'end', x, z, m:flM(-ux, -uz, sx, sz)});
            else if (e1 === 'end' && i === n - 2 && j === k - 1) D.mods.push({M:'end', x, z, m:flM(ux, uz, sx, sz)});
            else D.mods.push({M:'pon', x, z, m:flM(ux, uz, sx, sz)}); }
          box((ax + bx) / 2, (az + bz) / 2, ux, uz, P.PW * sz * 0.92, len);
        }
      }
      if (D.mods.length) docks.push(D);
    };
    // a dock a step of the tile's job (tileStep, a few milliseconds a frame: Bergen's 339 docks were 150 ms in one), the mesh at its end
    return {items:FD.map(d => () => dock(d)), done:() => ({docks, mesh:far.p.length ? far.mesh([t.x0 + 25000, t.z0 + 25000]) : null})};
  }
  const FLN = {n:0};
  function drawFloats(eye, t, VP){
    FLN.n = 0; if (!FLT.size) return; let on = false;
    const tide = env.tide || 0, top = FDOCK.QTOP + 0.16, R = FLNEAR[QUAL.lvl] || 350;
    // in front of the eye and near the picture (clip space, with a margin for a module's size)
    const vis = (x, y, z) => { const w = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (w < -10) return false; const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12]; return Math.abs(cx) <= w * 1.3 + 10; };
    for (const F of FLT.values()) for (const D of F.docks){
      if (Math.hypot(D.mx - eye[0], D.mz - eye[2]) > R + D.r) continue;
      if (!on){ if (DKM === null) buildDocks(); if (!DKM || !DKM.fin) return; nSetup(VP); on = true; }
      const y = tide + (seaH(D.mx, D.mz, t) - tide) * 0.3;
      for (const q of D.mods){
        if (Math.abs(q.x - eye[0]) > R || Math.abs(q.z - eye[2]) > R || !vis(q.x - eye[0], y - eye[1], q.z - eye[2])) continue; FLN.n++;
        if (q.M === 'gang'){ const dh = top - (y + FDOCK.FB), run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
          drawN(DKM.gang, model(q.x - eye[0], top - eye[1], q.z - eye[2], Math.atan2(-q.uz, q.ux), 0, -Math.atan2(dh, run))); continue; }
        const M = q.m; M[12] = q.x - eye[0]; M[13] = (q.M === 'kar' ? 0 : y) - eye[1]; M[14] = q.z - eye[2]; drawN(DKM[q.M], M);
      }
    }
    if (on) gl.useProgram(PL.p);
  }
  // ---------- aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye ----------
  let AIRM = null, airNow = [];
  function buildAir(){
    if (typeof glbHas !== 'function' || !glbHas('air')) return;
    const G = glbLoad('air'), up = nm => { const o = glbPart('air', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    AIRM = {plane:up('plane'), prop:up('prop'), heli:up('heli'), rotor:up('rotor'), trotor:up('trotor'), ex:(G && G.ex) || {}};
  }
  function drawAir(eye, t, H, VP){
    airNow = []; if (!AIRM || !AIRM.plane || typeof airStates !== 'function') return;
    for (const a of airStates(H, {x:eye[0] / 1000, y:eye[2] / 1000}, 15)){
      const x = a.p.x * 1000, z = a.p.y * 1000, y = a.alt;
      a.w = [x, y, z]; a.M = model(x - eye[0], y - eye[1], z - eye[2], -a.hd, a.pitch, 0); airNow.push(a);
    }
    if (!airNow.length) return;
    nSetup(VP); const ex = AIRM.ex;
    for (const a of airNow){
      if (a.kind === 'plane'){ drawN(AIRM.plane, a.M); for (const h of ex.props || []) drawN(AIRM.prop, chain(a.M, M4.T(h[0], h[1], h[2]), M4.RZ(t * 31 + h[0]))); }
      else { const r = ex.rotor || [0, 2.75, 0], tr = ex.trotor || [-0.32, 2.75, 9]; drawN(AIRM.heli, a.M); drawN(AIRM.rotor, chain(a.M, M4.T(r[0], r[1], r[2]), M4.RY(t * 27))); drawN(AIRM.trotor, chain(a.M, M4.T(tr[0], tr[1], tr[2]), M4.RX(t * 70))); }
    }
  }
  // their lights: red to port, green to starboard and white aft at night; the red beacons and the white strobes flash day and night
  function drawAirLights(VP, t){
    if (!airNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    const beac = (t % 1) < 0.12, strobe = (t % 1.3) < 0.06 || ((t % 1.3) > 0.16 && (t % 1.3) < 0.22), BCOL = [1, 0.1, 0.06], SCOL = [1, 1, 1];
    for (const a of airNow){ for (const [lx, ly, lz, c] of (a.kind === 'plane' ? AIRM.ex.planeLights : AIRM.ex.heliLights) || []){
      const fl = c === 'B' || c === 'S'; if (fl ? !(c === 'B' ? beac : strobe) : env.night < 0.05) continue;
      const q = xf(a.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = fl ? Math.max(0.55, env.night) : env.night;
      drawPts(1, gl.POINTS, VP, c === 'B' ? BCOL : c === 'S' ? SCOL : NLC[c], fl ? 2600 : 1400, true); } }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function drawNPCGlass(VP){ for (const n of npcNow) if (n.K && n.K.glass) drawGlass(n.K.glass, chain(n.M, n.K.S), VP); }
  function drawNPCLights(VP){
    if (env.night < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){
      // the same rules as the own boat (vessel3d.js lanterns): fishing red over white, under way the full set, in port nothing
      const stN = {port:n.st === 'port', fishing:n.st === 'fishing', v:n.st === 'fishing' ? 0 : 5, anch:false};
      if (n.K){ const M = chain(n.M, n.K.S), px = n.L < 14 ? 260 : 600; for (const [p, col] of lanterns(n.K.geo, {len:n.L || 8, vmax:10}, stN)){ const q = xf(M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, px, true); } continue; }
      const LG = NPCM.lanG || (NPCM.lanG = {}), GN = LG[n.type] || (LG[n.type] = {lights:(NPCM.lights[n.type] || []).map(([lx, ly, lz, c]) => [[lx, ly, lz], NLC[c]])});
      for (const [p, col] of lanterns(GN, {len:n.L || 20, vmax:12}, stN)){ const q = xf(n.M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, NPCM.lightPx[n.type] || 900, true); } }
    const cs = npcNow.find(n => n.type === 'coastal');
    if (cs){ let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) for (const sx of [-1, 1]){ if (hash(r * 97 + i * 13 + (sx > 0 ? 5 : 0)) < 0.35) continue; const q = xf(cs.M, [sx * 8.95, 8.5 + r * 3.2, -24 + i * 3.4]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } drawPts(k, gl.POINTS, VP, [1, 0.8, 0.5], 420, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

