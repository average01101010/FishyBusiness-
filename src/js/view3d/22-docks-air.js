  // ---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------
  // The landing block on the shore at the dock's root, the aluminium gangway hinged on it and resting on the first pontoon with its
  // rollers (steeper at low water), the concrete pontoons riding the tide, the last with its ladder and life ring; the buoys on the swell.
  let DKM = null;
  function buildDocks(){
    DKM = false; if (typeof glbHas !== 'function' || !glbHas('brygge')) return;
    const up = nm => { const o = glbPart('brygge', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; };
    DKM = {kar:up('landkar'), gang:up('landgang'), pon:up('ponton'), end:up('ponton_end'), fin:up('finger'), boye:up('boye'), kaib:up('kai_betong'), ktre:up('kai_tre')};
    if (!DKM.pon || !DKM.gang) DKM = false; else DKM.fill = quayFill();
  }
  // the fill behind a quay built out over the shore (core/07-harbours.js quayOut): a unit box, x -0.5..0.5 along the face, y 0..1 up,
  // z -1..0 in towards the land, in kai_betong's own concrete (its deck and its wall, read from the model), scaled to the bays' length,
  // from 3 m under mean sea level to the deck and from the back of the quay's deck in onto the shore
  function quayFill(){
    const o = glbPart('brygge', 'kai_betong'); let top = [0.56, 0.56, 0.54, 0.2], side = [0.5, 0.5, 0.48, 0.2], ty = -1e9;
    if (o) for (let i = 0; i < o.p.length / 3; i++){ const c = [o.c[i * 4], o.c[i * 4 + 1], o.c[i * 4 + 2], o.c[i * 4 + 3]], y = o.p[i * 3 + 1];
      if (o.n[i * 3 + 1] > 0.9 && y < 2.45 && y > ty && o.p[i * 3 + 2] < -1){ ty = y; top = c; }
      if (Math.abs(o.n[i * 3]) > 0.9 && Math.abs(o.p[i * 3]) > 2.95 && y > 0.6 && y < 2.0) side = c; }
    const B = VB(), q = (a, b, c, d, k) => B.quad(a, b, c, d, k);
    q([-0.5, 1, 0], [0.5, 1, 0], [0.5, 1, -1], [-0.5, 1, -1], top);
    q([-0.5, 0, -1], [0.5, 0, -1], [0.5, 1, -1], [-0.5, 1, -1], side); q([0.5, 0, 0], [-0.5, 0, 0], [-0.5, 1, 0], [0.5, 1, 0], side);
    q([-0.5, 0, 0], [-0.5, 0, -1], [-0.5, 1, -1], [-0.5, 1, 0], side); q([0.5, 0, -1], [0.5, 0, 0], [0.5, 1, 0], [0.5, 1, -1], side);
    return upA(B);
  }
  function drawDocks(eye, t, VP){
    if (typeof MOOR === 'undefined') return;
    const R = 1500, H = [];
    for (const tl of vecTilesIn(eye[0] - R, eye[2] - R, eye[0] + R, eye[2] + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - eye[0], h.y * 1000 - eye[2]) < R + 500) H.push(h);
    if (DKM === null) buildDocks(); if (!DKM) return;   // (on with no harbour of the coast's boats near: the player's quays below)
    nSetup(VP); const tide = env.tide || 0;
    // the berths the company holds along a quay face or the shore of a harbour (core/07e-havn.js): a quay front where she lies, in 6 m
    // bays, its top 2.4 m over mean sea level: concrete at a quay (kai_betong: the face at z = 0, the deck back to z = -5), and a timber
    // pier on piles along the shore for a boat under 15 m (kai_tre: 4.2 m wide about z = 0, so its middle 2.3 m in from the face); the
    // piers are drawn already
    // (quayMod: n bays of 6 m along the face about the berth's middle, their front f.out out from the face where the quay is built out
    // over the 3D shore (quayOut, 03.11.2026), and behind the quay's deck the fill in onto the shore (3 m in from a coast face, 1.5 m in
    // under a pier's or a quay's own deck, kinds 0 and 2, which are drawn a centimetre lower there so their decks do not fight). A timber
    // pier for a boat under 15 m by the shore when one bay of it reaches the land; else concrete.)
    // The naust's and a rorbu's own pile quay (f.tre) is met by timber: rows of kai_tre side by side from her out to it.
    const quayMod = (f, L) => { let yaw = Math.atan2(-f.uz, f.ux); if (-f.uz * f.nx + f.ux * f.nz < 0) yaw += Math.PI;
      const out = f.out || 0, inl = f.kind === 3 ? 3 : f.tre ? 0.5 : 1.5, y0 = f.kind === 3 ? 0 : -0.012;
      const tre = DKM.ktre && (f.tre || f.kind === 3 && L < 15 && out <= 2.2), M = tre ? DKM.ktre : DKM.kaib, n = Math.ceil((L + 4) / 6);
      const rows = tre ? Math.max(1, Math.ceil((out + inl) / 4.2)) : 1;
      for (let r = 0; r < rows; r++){ const bk = (tre ? 2.3 + 4.2 * r : 0) - out;
        for (let k = 0; k < n; k++){ const a = (k - (n - 1) / 2) * 6; drawN(M, model(f.x + f.ux * a - f.nx * bk - eye[0], y0 - eye[1], f.z + f.uz * a - f.nz * bk - eye[2], yaw, 0, 0)); } }
      const D = out + inl - 5; if (tre || D <= 0.05 || !DKM.fill) return;
      const sx = n * 6, sy = FDOCK.QTOP + 3;   // (M4.S is uniform: the box is scaled on its own axes here)
      drawN(DKM.fill, chain(model(f.x + f.nx * (out - 5) - eye[0], y0 - 3 - eye[1], f.z + f.nz * (out - 5) - eye[2], yaw, 0, 0), new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,D,0, 0,0,0,1]))); };
    // (a berth of the harbour's own boats with a quay of the game's: at a fish plant's coast face, or built out over the shore)
    const ownQuay = f => f && !f.dock && (f.mod || (f.out || 0) > 0.3);
    if (DKM.kaib && typeof havnStore === 'function'){ const st = havnStore();
      for (const id in st.s){ const s = st.s[id], f = s.face; if (!s.vid || !f || f.dock || !(f.kind === 2 || f.kind === 3 || (f.out || 0) > 0.3) || Math.hypot(f.x - eye[0], f.z - eye[2]) > R) continue;
        const bp = f.out === undefined && typeof berthPose === 'function' ? berthPose(id, s.vtype) : null; quayMod(bp ? Object.assign({}, f, {out:bp.face.out}) : f, s.L); } }
    // where the boat lies at a harbour's quay, the naust or a rorbu with the quay built out to her over the shore (berthPose face.out;
    // the held berths are above)
    if (DKM.kaib && typeof berthNow === 'function'){ const bp = berthNow(), f = bp && bp.face; if (f && !f.unit && (f.out || 0) > 0.3 && !(typeof isBerth === 'function' && isBerth(S.boat.port)) && Math.hypot(f.x - eye[0], f.z - eye[2]) <= R) quayMod(f, bp.Lb); }
    // the harbours' own boats and Senja's fleet where the game sets a quay along the berth (a fish plant's quay mapped as the coastline
    // alone: 07-harbours.js quayReal, face.mod; L1, choice 1)
    if (DKM.kaib){
      for (const h of H) for (const b of h.boats){ const f = b.moored && b.moored.face; if (ownQuay(f) && Math.hypot(f.x - eye[0], f.z - eye[2]) <= R) quayMod(f, b.L); }
      if (typeof FLEET !== 'undefined' && typeof fleetBerth === 'function') FLEET.forEach((f, i) => { if (Math.hypot(f.hp[0] * 1000 - eye[0], f.hp[1] * 1000 - eye[2]) > R + 600) return; const m = fleetBerth(i); if (m && ownQuay(m.face)) quayMod(m.face, f.L); });
    }
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
    const G = glbLoad('air'), up = nm => { const o = glbPart('air', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; };
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
  // ---- the lanterns in thick weather (Ø11.2; sjøveisreglene rule 20 c and vedlegg I, read 06.11.2026) ----
  // By day in restricted visibility they are lit too (20 c: «skal hvis de føres, også vises fra soloppgang til solnedgang under nedsatt
  // sikt»), fainter than at night; and far off in it a lantern fades out at the range it is seen at in this visibility (vedlegg I 8,
  // core/05e-sjovei.js sjvLightNm), blended in with the fog so in clear weather they stand as before. The visibility is the one the view
  // draws (env.fogD: the fog reaches 18 % there)
  const LRC = {vis:-1, m:{}};
  function lanternFog(){ const vis = 1.73 / Math.max(1e-7, env.fogD || 1e-7) / 1000; return {vis, a:clamp((SJV.FOG - vis) / 2.5, 0, 0.6), w:sstep(SJV.FOG * 1.6, SJV.FOG, vis)}; }
  function lampFade(d, kind, L, LF){
    if (LF.w <= 0) return 1;
    if (Math.abs(LF.vis - LRC.vis) > 0.02){ LRC.vis = LF.vis; LRC.m = {}; }
    const D0 = sjvLampNm(kind, L), R = LRC.m[D0] || (LRC.m[D0] = sjvLightNm(D0, LF.vis) * NM * 1000);
    return 1 - LF.w + LF.w * clamp((R - d) / (0.3 * R), 0, 1);
  }
  // a side light or the stern light only within its arc (rule 21: the sides «fra rett forover til 22,5 grader aktenfor tvers», the stern
  // «67,5 grader på hver side av fartøyet fra rett akterover»; vedlegg I 9 a). M is the boat's frame relative to the eye (her bow to -z, her
  // starboard to +x); lp the light in it. The glow drew them all round, so the green showed from the port bow through the wheelhouse
  function lampArc(M, lp, lk){
    if (lk !== 'side' && lk !== 'stern') return true;
    const q = xf(M, lp), f = xf(M, [lp[0], lp[1], lp[2] - 1]), r = xf(M, [lp[0] + 1, lp[1], lp[2]]);
    const fw = -((f[0] - q[0]) * q[0] + (f[1] - q[1]) * q[1] + (f[2] - q[2]) * q[2]), sb = -((r[0] - q[0]) * q[0] + (r[1] - q[1]) * q[1] + (r[2] - q[2]) * q[2]);
    const ang = Math.atan2(Math.abs(sb), fw) * 180 / Math.PI;
    if (lk === 'side' && (ang > 112.5 || (lp[0] < 0 ? sb > 0.05 : sb < -0.05) && ang > 1)) return false;
    if (lk === 'stern' && ang < 180 - 67.5) return false;
    return true;
  }
  // the lights over the rest that the view adds to vessel3d.js lanterns: restricted in her ability to manoeuvre red, white, red (27 b i),
  // constrained by her draught three reds (28), and the coast guard's blue all-round light on her highest masthead while she is on her
  // inspection (kap. II 53 d: «en blå lanterne … på høyeste mastetopp … ubrutt, blått lys i 360 grader»), over the highest of her lights
  const KV_BLUE = [0.18, 0.4, 1];
  function lampsMore(L3, st, len){
    if (!L3.length || !(st.ram || st.cbd || st.kv)) return L3;
    const top = L3.reduce((a, l) => l[0][1] > a[0][1] ? l : a, L3[0])[0], sp = len >= 20 ? 2 : 1, out = L3.slice(), up = k => [top[0], top[1] + k, top[2]];
    if (st.ram){ out.push([up(sp), LANT_C.r, 'ram'], [up(2 * sp), LANT_C.w, 'ram'], [up(3 * sp), LANT_C.r, 'ram']); }
    else if (st.cbd){ out.push([up(sp), LANT_C.r, 'cbd'], [up(2 * sp), LANT_C.r, 'cbd'], [up(3 * sp), LANT_C.r, 'cbd']); }
    if (st.kv) out.push([up(st.ram || st.cbd ? 3 * sp + 0.8 : 0.8), KV_BLUE, 'kv']);
    return out;
  }
  function drawNPCLights(VP){
    const LF = lanternFog(), A0 = Math.max(env.night, LF.a); ANCHAL.npcLit = 0; ANCHAL.kvLit = 0; ANCHAL.winLit = 0;   // (what was lit, for the tests: G3._debug.anchl)
    if (A0 < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){
      // the same rules as the own boat (vessel3d.js lanterns), from what she is doing (N8, Ø11.2; 05e-sjovei.js sjvLanternSt): her class
      // and her real speed, so a boat jigging shows the lights of one under way, a trawler towing green over white, one at anchor the
      // anchor light, one not under command two reds; at the quay none
      const stN = sjvLanternSt(n), len = n.L || (n.K ? 8 : 20);
      const M = n.K ? (n.rev ? chain(n.M, n.K.S, M4.RY(Math.PI)) : chain(n.M, n.K.S)) : n.M, px = n.K ? (n.K.geo && n.K.geo.ship ? 900 : n.L < 14 ? 260 : 600) : NPCM.lightPx[n.type] || 900;
      const G = n.K ? n.K.geo : (() => { const LG = NPCM.lanG || (NPCM.lanG = {}); return LG[n.type] || (LG[n.type] = {lights:(NPCM.lights[n.type] || (SHIPTY[n.type] && NPCM.lights.ferry) || []).map(([lx, ly, lz, c]) => [[lx, ly, lz], NLC[c]])}); })();
      for (const [p, col, lk] of lampsMore(lanterns(G, {len, vmax:n.K ? 10 : 12}, stN), stN, len)){
        if (!lampArc(M, p, lk)) continue;
        const q = xf(M, p), a = A0 * lampFade(Math.hypot(q[0], q[1], q[2]), lk === 'side' || lk === 'stern' || lk === 'kv' ? lk : lk === 'masthead' || lk === 'masthead2' ? 'masthead' : 'allround', len, LF);
        if (a < 0.01) continue;
        ANCHAL.npcLit++; if (lk === 'kv') ANCHAL.kvLit++;
        PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = a; drawPts(1, gl.POINTS, VP, col, px, true); } }
    // the lit windows of the ships at night: a ship model's own (its GLB's anchors.win, the windows' middles, tools/ships/), every one on
    // a ferry and some two in three on the coastal ship (the cabins' curtains; fixed per window; a model's anchors.winLit, the share lit,
    // where it has one: the merchant ships' and the cruise ship's); the old box's rows on a coastal ship drawn as the box (beyond 1.5 km)
    if (env.night > 0.05) for (const n of npcNow){
      if (!SHIPTY[n.type]) continue; const W = n.K && n.K.geo && n.K.geo.win;
      let k = 0;
      if (W){ const M = chain(n.M, n.K.S), dark = n.K.geo.winLit != null ? 1 - n.K.geo.winLit : n.type === 'coastal' ? 0.35 : 0;
        for (let i = 0; i < W.length && k < 4000; i++){ if (dark && hash(i * 13 + 7) < dark) continue; const q = xf(M, W[i]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } }
      else if (n.type === 'coastal'){ for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) for (const sx of [-1, 1]){ if (hash(r * 97 + i * 13 + (sx > 0 ? 5 : 0)) < 0.35) continue; const q = xf(n.M, [sx * 8.95, 8.5 + r * 3.2, -24 + i * 3.4]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } }
      if (k){ ANCHAL.winLit += k; drawPts(k, gl.POINTS, VP, [1, 0.8, 0.5], W ? 300 : 420, true); } }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

