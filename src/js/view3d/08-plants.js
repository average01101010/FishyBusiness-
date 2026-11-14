  // ---------- fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay ----------
  const PLANTS = []; let PM = null;
  function plantLayout(pt){
    const U = UNITS[pt.id], M = U && unitModel(U.v), bp = berthPose(pt.id, 'skiff'); if (!U || !M || !bp) return null;
    const A = M.A, f = bp.face, u = [f.ux, f.uz], n = [f.nx, f.nz], at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o], W = p => unitW(U, p[0], p[2]);
    const onQuay = p => { const [lx, lz] = unitL(U, p[0], p[1]), g = ugeo(U); return Math.abs(lx) <= g.E + 0.1 && lz <= 0.1 && lz >= -g.B - 0.1; };
    const gy = p => onQuay(p) ? QTOP : Math.max(0.4, terrH(p[0], p[1]));
    const P = {id:pt.id, unit:U, bp, f, u, n, depth:ugeo(U).B, at, gy, onQuay, drop:W(A.drop), crane:W(A.crane.base), door:W(A.door.top), dn:n, du:u, dy:QTOP,
      ucrane:{L1:A.crane.boom1, ext:A.crane.ext, heelY:A.crane.heel[1]}, lamps:A.lamps.map(q => { const w = W(q); return [w[0], w[1], q[1]]; }), stacks:A.stacks.map(W), park:W(A.truck.wait),
      ws:Object.fromEntries(Object.entries(A.workers).map(([k, q]) => [k, W(q)])), chRest:Math.PI / 2};
    return P;
  }
  function buildPlants(){
    PLANTS.length = 0;
    const ry = U => Math.atan2(U.n[0], U.n[1]);
    for (const pt of PORTS){
      if (!pt.mottak || pt.coastal) continue; const P = plantLayout(pt); if (!P) continue; PLANTS.push(P);
      // the camera stays out of the quay's block, the plant, the silo and the tank
      for (const [cx, cz, sx, sz, y0, y1] of unitModel(P.unit.v).A.solids){ const c = unitW(P.unit, cx, cz); camSolid(c[0], c[1], sx, sz, ry(P.unit), y0, y1); }
    }
  }
  // the moving parts, built once and drawn with a transform; the workers are drawn joint by joint
  function buildPlantParts(){
    const mk = f => { const b = NB(); f(b); return b.mesh(); }, unit = k => mk(b => b.tube([[0, 0, 0], [0, 0, 1]], 1, k, 6));
    const DK = [0.14, 0.15, 0.17, 0.2], VEST = [1, 0.45, 0.06, 0.3], REFL = [0.9, 0.95, 0.9, 0.6], SKIN = [0.86, 0.66, 0.52, 0.1];
    PM = {W:glbHas('worker') ? {hw:wkMeshes('hw'), crew:wkMeshes('crew'), skipper:wkMeshes('skipper')} : null,
      leg:unit([0.16, 0.18, 0.22, 0.1]), arm:unit(VEST), wire:unit([0.1, 0.1, 0.1, 0.3]), fhose:unit([0.06, 0.06, 0.07, 0.35]), broom:unit([0.55, 0.4, 0.25, 0.05]), hose:unit([0.2, 0.55, 0.25, 0.3]),
      torso:mk(b => { b.box(0, 0, 0, 0.42, 0.56, 0.26, VEST); b.box(0, 0.16, 0, 0.43, 0.06, 0.27, REFL); b.box(0, 0.34, 0, 0.43, 0.06, 0.27, REFL); }),
      head:mk(b => { b.box(0, 0, 0, 0.2, 0.22, 0.22, SKIN); b.box(0, 0.2, 0, 0.26, 0.09, 0.28, [0.95, 0.95, 0.92, 0.5]); b.box(0, 0.19, -0.14, 0.24, 0.03, 0.08, [0.95, 0.95, 0.92, 0.5]); }),
      hand:mk(b => b.box(0, -0.05, 0, 0.09, 0.1, 0.09, [0.9, 0.9, 0.2, 0.2])), boot:mk(b => b.box(0, 0, -0.05, 0.13, 0.12, 0.28, DK)),
      cup:mk(b => b.box(0, 0, 0, 0.08, 0.1, 0.08, [0.95, 0.95, 0.95, 0.4])), fbox:mk(b => b.box(0, 0, 0, 0.78, 0.28, 0.38, [0.18, 0.4, 0.74, 0.25])),
      // a landing's loads: a pallet with 1 to 9 boxes of fish, or a 460 litre tub with ice on top of the fish
      palN:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(nb => mk(b => { b.box(0, 0, 0, 1.2, 0.14, 0.8, [0.66, 0.53, 0.36, 0.05]); for (let k = 0; k < nb; k++) b.box((k % 3 - 1) * 0.4, 0.14 + Math.floor(k / 3) * 0.29, 0, 0.38, 0.28, 0.78, [0.18, 0.4, 0.74, 0.25]); })),
      // a freezer vessel's pallet of frozen fish (H2b, 05.11.2026; the Blender pallet with cartons and film comes in H2d): about a tonne in
      // cartons of about 23 kg (0.6 × 0.4 × 0.16 m), four to a layer and eleven layers on a 1.2 × 0.8 m pallet, the cartons a shade
      // apart layer by layer, wrapped in film at the top
      palF:mk(b => { b.box(0, 0, 0, 1.2, 0.14, 0.8, [0.66, 0.53, 0.36, 0.05]); for (let l = 0; l < 11; l++){ const c = l % 2 ? [0.71, 0.6, 0.45, 0.05] : [0.68, 0.56, 0.41, 0.05];
        for (let k = 0; k < 4; k++) b.box((k % 2 - 0.5) * 0.6, 0.14 + l * 0.16, (Math.floor(k / 2) - 0.5) * 0.4, 0.59, 0.155, 0.39, c); } b.box(0, 1.82, 0, 1.21, 0.06, 0.81, [0.88, 0.9, 0.92, 0.6]); }),
      tub:mk(b => { b.box(0, 0, 0, 1.2, 0.85, 1.0, [0.2, 0.36, 0.62, 0.25]); b.box(0, 0.84, 0, 1.24, 0.05, 1.04, [0.16, 0.3, 0.52, 0.25]); b.box(0, 0.8, 0, 1.08, 0.06, 0.88, [0.93, 0.96, 0.98, 0.5]); }),
      board:mk(b => b.box(0, 0, 0, 0.24, 0.3, 0.02, [0.92, 0.9, 0.84, 0.1])),
      needle:mk(b => { b.box(0, 0, -0.09, 0.024, 0.006, 0.18, [0.55, 0.78, 0.42, 0.3]); b.box(0, 0.004, -0.06, 0.014, 0.008, 0.08, [0.92, 0.9, 0.8, 0.1]); }),   // a netting needle with its twine (bøtenål)
      seat:mk(b => { b.box(0, 0, 0, 0.46, 0.07, 0.44, [0.16, 0.17, 0.19, 0.3]); b.box(0, 0.07, 0.2, 0.46, 0.5, 0.06, [0.16, 0.17, 0.19, 0.3]); }),   // the helm chair (drawHelmKit)
      // icing on deck (tilbakemelding #24): an aluminium ice shovel, a scoop of ice, the insulated ice bin and a box of fish to ice
      shovel:mk(b => { b.box(0, 0, 0, 0.26, 0.015, 0.3, [0.74, 0.77, 0.8, 0.7]); b.box(0, 0.015, -0.14, 0.26, 0.06, 0.015, [0.74, 0.77, 0.8, 0.7]); b.box(-0.125, 0.015, 0, 0.015, 0.05, 0.28, [0.74, 0.77, 0.8, 0.7]); b.box(0.125, 0.015, 0, 0.015, 0.05, 0.28, [0.74, 0.77, 0.8, 0.7]); }),
      icebit:mk(b => b.box(0, 0, 0, 0.035, 0.03, 0.035, [0.95, 0.98, 1, 0.6])),
      scoop:mk(b => { b.box(0, 0, 0, 0.2, 0.05, 0.2, [0.93, 0.96, 0.99, 0.6]); b.box(0.03, 0.04, -0.02, 0.12, 0.03, 0.12, [0.96, 0.98, 1, 0.6]); }),
      icebin:mk(b => { b.box(0, 0, 0, 0.62, 0.48, 0.48, [0.93, 0.93, 0.9, 0.2]); b.box(0, 0.47, 0, 0.56, 0.03, 0.42, [0.9, 0.95, 0.99, 0.6]); b.box(0.05, 0.49, 0.02, 0.36, 0.03, 0.28, [0.96, 0.98, 1, 0.6]); }),
      icebox:mk(b => { b.box(0, 0, 0, 0.78, 0.28, 0.38, [0.18, 0.4, 0.74, 0.25]); b.box(0, 0.27, 0, 0.72, 0.012, 0.32, [0.55, 0.57, 0.5, 0.4]); b.box(0, 0.282, 0, 0.66, 0.012, 0.28, [0.92, 0.96, 0.99, 0.6]); }),
      // on deck: the bleeding tub with its bloody water, the gutting table, a cod in the hand, a gob of offal, a bare head
      btub:mk(b => { b.box(0, 0, 0, 0.95, 0.55, 0.7, [0.2, 0.38, 0.62, 0.25]); b.box(0, 0.47, 0, 0.87, 0.04, 0.62, [0.32, 0.08, 0.07, 0.6]); }),
      gtable:mk(b => { b.box(0, 0.82, 0, 0.5, 0.05, 0.95, [0.72, 0.74, 0.76, 0.6]); for (const [x, z] of [[-0.2, -0.42], [0.2, -0.42], [-0.2, 0.42], [0.2, 0.42]]) b.box(x, 0, z, 0.04, 0.82, 0.04, [0.6, 0.62, 0.64, 0.5]); }),
      fish:mk(b => { b.box(0, 0, 0, 0.1, 0.09, 0.42, [0.5, 0.52, 0.44, 0.4]); b.box(0, 0.005, 0.25, 0.02, 0.1, 0.1, [0.45, 0.46, 0.4, 0.3]); }),
      slo:mk(b => b.box(0, 0, 0, 0.12, 0.06, 0.09, [0.45, 0.12, 0.1, 0.5])),
      headB:mk(b => { b.box(0, 0, 0, 0.2, 0.22, 0.22, SKIN); b.box(0, 0.2, 0, 0.23, 0.06, 0.24, [0.85, 0.25, 0.15, 0.1]); }), remote:mk(b => { b.box(0, 0, 0, 0.22, 0.1, 0.14, [0.95, 0.72, 0.08, 0.4]); b.box(0.06, 0.1, 0, 0.02, 0.12, 0.02, [0.1, 0.1, 0.1, 0.3]); })
    };
  }
  // a looping round of stations: stand a while doing the task, then walk to the next (speed in m/s)
  function roundAt(R, T){
    if (!R.seg){ let tot = 0; R.seg = R.st.map((a, i) => { const b = R.st[(i + 1) % R.st.length], wd = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]) / (R.v || 1.2), s = [tot, a.d, wd, a, b]; tot += a.d + wd; return s; }); R.tot = tot; }
    const tt = ((T % R.tot) + R.tot) % R.tot;
    for (const [t0, d, wd, a, b] of R.seg){
      if (tt < t0 + d) return {x:a.p[0], z:a.p[1], h:a.h, task:a.task, walk:false, s:tt - t0, a};
      if (tt < t0 + d + wd){ const k = (tt - t0 - d) / wd; return {x:a.p[0] + (b.p[0] - a.p[0]) * k, z:a.p[1] + (b.p[1] - a.p[1]) * k, h:Math.atan2(b.p[0] - a.p[0], -(b.p[1] - a.p[1])), task:a.carry ? 'carry' : R.sweep ? 'sweep' : 'walk', walk:true, s:tt - t0 - d, a, k}; }
    }
    return {x:R.st[0].p[0], z:R.st[0].p[1], h:0, task:'stand', walk:false, s:0};
  }
  // the day's rounds at the quay: coiling at the bollards, hosing and stacking by the pallets, sweeping, coffee on the bench; the
  // forklift stands at its spot (the places are the unit's, clear of the forklift's route)
  function plantRounds(P){
    if (P.rounds) return P.rounds;
    const R = unitModel(P.unit.v).A.rounds, W = q => unitW(P.unit, q[0], q[2]), face = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), along = Math.atan2(P.u[0], -P.u[1]);
    const c = R.coil.map(W), h = R.hose.map(W), sw = R.sweep.map(W), cf = R.coffee.map(W);
    return P.rounds = [
      {v:1.1, st:[{p:c[0], d:24, task:'coil', h:seaH}, {p:c[1], d:20, task:'coil', h:seaH}, {p:c[2], d:14, task:'look', h:seaH}]},
      {v:1.2, st:[{p:h[0], d:32, task:'hose', h:face(h[0], P.stacks[0]), carry:true}, {p:h[1], d:9, task:'stack', h:face(h[1], P.stacks[0])}]},
      {v:0.6, st:[{p:sw[0], d:1, task:'sweep', h:along, carry:false}, {p:sw[1], d:1, task:'sweep', h:along + Math.PI}], sweep:true},
      {v:1.0, st:[{p:cf[0], d:45, task:'coffee', h:seaH}, {p:cf[1], d:15, task:'look', h:seaH}]}
    ];
  }
  // how low a pose goes, [dip, bend]: the old ones only bend the back a little; reaching into a crate or a tub on the deck, picking a fish
  // up off it or bending over a line tub takes the knees too (drawWorker)
  const DKLAY = {};   // the packer's crate got a gutted fish at t (the gutter's throw, drawWorker 'gutw'), by the packer's id
  // where a man is in his work's round: the clock and his own number (each a little after the one before him). The tests ask for a
  // moment itself (SJOBEIN.test.t: the sip at its top, the broom at its end), so one picture shows it; tests/folk2poses.py MOMENT
  const tOf = (T, idx) => SJOBEIN.test && SJOBEIN.test.t != null ? SJOBEIN.test.t : T + idx * 1.7;
  // (the seconds he has been lowering the box, st.s; the tests' moment when they ask for the pose)
  const stowS = st => st.s || (SJOBEIN.test && SJOBEIN.test.task === 'stow' && SJOBEIN.test.t) || 0;
  function workLow(st, T, idx){
    const k = st.task, e = st.ev, c = e ? e.k : 99;
    if (st.seated) return [0, 0.2, 1];   // (the packed lunch on an upturned tub, OB14)
    if (k === 'cold') return [0.04 * Math.max(0, Math.sin(T * 5.2 + idx)), 0.1];   // (hunched, and a little on the knees with the beat)
    // (the new people lift with the knees, Jonas 14.11.2026 with a picture of a box lifted from the floor: the hips come down for the
    // box low and up with it; lowering it into the hold the same; carrying it he leans a little back against its weight)
    if (LEMMER.on && k === 'stack') return [HOLDT.box.squat * (1 - (Math.sin((tOf(T, idx)) * 1.4) + 1) / 2), 0.1];
    if (LEMMER.on && k === 'stow'){ const u = Math.min(1, Math.max(0, stowS(st) / 1.6)); return [HOLDT.box.squat * u * u * (3 - 2 * u), 0.1]; }
    if (LEMMER.on && k === 'carry' && st.crate !== false) return [0, -HOLDT.box.lean];
    if (k === 'hose' || k === 'coil' || k === 'stack' || k === 'gut' || k === 'haul') return [0, 0.12];
    if (k === 'ice') return [0, 0.22];
    if (k === 'lean') return [0, 0.1];
    if (k === 'pick' || k === 'tend') return [0.05, 0.22];
    if (k === 'bleed' && e && e.deck){ const u = c < 0.25 ? c / 0.25 : c < 0.6 ? 1 : c < 1.0 ? 1 - (c - 0.6) / 0.4 : 0; return [0.62 * u, 0.12 + 0.42 * u]; }   // down to the fish on the deck and up with it
    if (k === 'bleedst') return [0, 0.14];
    if (k === 'gutw'){ const s = (tOf(T, idx)) % 5.6, u = s < 0.9 ? Math.sin(s / 0.9 * Math.PI / 2) : s < 1.4 ? 1 - (s - 0.9) / 0.5 : 0; return [0.12 * u, 0.14 + 0.24 * u]; }
    if (k === 'pack'){ const L = st.lay; if (L != null && L >= 0 && L < 1.5){ const u = Math.sin(Math.min(1, L / 1.5) * Math.PI); return [0.4 * u, 0.22 + 0.3 * u]; } return [0, 0.22]; }
    if (k === 'egn' || k === 'strip') return [0, 0.3, 1];   // (sitting on an upturned bin at the tub)
    if (k === 'helmsit' || k === 'drive') return [0, 0.05, 1];   // (on the helm seat, where the boat is steered sitting, or the forklift's seat)
    if (k === 'mend') return [0, 0.16];
    if (k === 'stow'){ const u = clamp((st.s || 0) / 1.2, 0, 1); return [0.55 * Math.sin(u * Math.PI / 2), 0.5 * Math.sin(u * Math.PI / 2)]; }
    // the breaks (core/13-work.js idleAssign): leaning back on the rail, sitting on an upturned tub, over the rail seasick, bent over the gear
    if (k === 'back') return [0, -0.1];
    if (k === 'sit') return [0, 0.24, 1];
    if (k === 'seasick') return [0.06, 0.55 + 0.05 * Math.max(0, Math.sin(T * 1.3 + idx)) ** 6];
    if (k === 'gear') return [0.1, 0.32];
    if (k === 'knife' || k === 'phone' || k === 'lunch' || k === 'snus') return [0, 0.06];
    if (k === 'aurora') return [0, -0.05];
    return [0, 0];
  }
  // the ice shovel's round (2.6 s: into the ice, the swing over, the tip, and back) in the frame of his place as it is headed (st.h, not
  // turned at the work): the blade's socket a ahead, r to his right and up over the deck (y: the deck under him; null: no heights), the
  // tip and whether there is ice on it. Icing by hand has the bin on his left and the box on his right; the packer has the ice box
  // where it stands on deck (st.Bin, its ice's top; drawIceBox), else the bin at his side (st.binR), and the crate or the tub (st.Cr)
  function shovelPath(st, eye, T, idx, y){
    const F = [Math.sin(st.h), -Math.cos(st.h)], R = [Math.cos(st.h), Math.sin(st.h)], ease = u => u * u * (3 - 2 * u);
    const c = ((tOf(T, idx)) % 2.6) / 2.6, sw0 = c < 0.3 ? 0 : c < 0.55 ? ease((c - 0.3) / 0.25) : c < 0.75 ? 1 : 1 - ease((c - 0.75) / 0.25), lo = c < 0.3 ? Math.sin(c / 0.3 * Math.PI) : 0;
    const tip = c >= 0.55 && c < 0.75 ? Math.sin((c - 0.55) / 0.2 * Math.PI) : 0, full = c >= 0.22 && c < 0.62;
    if (st.task === 'ice') return {a:0.55, r:-0.5 + sw0 * 1.0, up:0.62 - lo * 0.12 + Math.sin(sw0 * Math.PI) * 0.3, tip, full, c};
    const Cr = st.Cr, dx = Cr ? Cr[0] + eye[0] - st.x : 0, dz = Cr ? Cr[2] + eye[2] - st.z : 0, aT = Cr ? clamp(dx * F[0] + dz * F[1], 0.3, 0.85) : 0.3, rT = Cr ? clamp(dx * R[0] + dz * R[1], -0.8, 0.8) : 0.62;
    const Bn = st.Bin, bx = Bn ? Bn[0] + eye[0] - st.x : 0, bz = Bn ? Bn[2] + eye[2] - st.z : 0, rB = Bn ? clamp(bx * R[0] + bz * R[1], -1.0, 1.0) : st.binR || -0.5, aB = Bn ? clamp(bx * F[0] + bz * F[1], 0.15, 0.9) : 0.4;
    const r = rB + sw0 * (rT - rB), a = aB + sw0 * (aT - aB); if (y == null) return {a, r, up:0, tip, full, c};
    const hB = Bn ? Bn[1] + eye[1] - y : 0.5, hT = Math.max(0.62, (st.crTop || 0.28) + (Cr ? Cr[1] + eye[1] - y : 0) + 0.12);
    return {a, r, up:(hB + 0.17) + sw0 * (hT - hB - 0.17) - lo * 0.15 + Math.sin(sw0 * Math.PI) * 0.25, tip, full, c};
  }
  // he turns from his place towards what he reaches for: the gutter to the bleeding tub for the next fish, the bleeder to the tub as he
  // throws, the packer to the crate at his side (the place and its heading stay; the body turns on the feet)
  function workTurn(st, eye, T, idx){
    const to = q => { if (!q) return 0; let d = Math.atan2(q[0] + eye[0] - st.x, -(q[2] + eye[2] - st.z)) - st.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d) < 0.35 ? 0 : clamp(d, -1.3, 1.3); };
    const ez = u => u * u * (3 - 2 * u);
    if (st.task === 'hose' && st.deck && !st.walk) return 0.4 * Math.sin(T * 0.8 + idx);   // (the jet over the deck from side to side, deckcrew.js WASH_SW)
    if (st.task === 'gutw' && st.Ub){ const s = (tOf(T, idx)) % 5.6, w = s < 0.4 ? ez(s / 0.4) : s < 0.95 ? 1 : s < 1.4 ? 1 - ez((s - 0.95) / 0.45) : 0; return w ? to(st.Ub) * w : 0; }
    if (st.task === 'bleed' && st.ev && st.ev.deck){ const c = st.ev.k, w = c < 1.7 ? 0 : c < 2.05 ? ez((c - 1.7) / 0.35) : c < 2.5 ? 1 : c < 2.9 ? 1 - ez((c - 2.5) / 0.4) : 0; return w ? to(st.ev.U) * w : 0; }
    if (st.task === 'pack' && st.Cr && st.lay != null && st.lay >= 0 && st.lay < 1.5) return to(st.Cr) * 0.6 * Math.sin(st.lay / 1.5 * Math.PI);
    // (the new people: with the shovel he turns on his feet after the blade, so the stiff shovel is before him from the ice to the box)
    if (LEMMER.on && (st.task === 'pack' || st.task === 'ice')){ const p = shovelPath(st, eye, T, idx, null), k = st.task === 'pack' && st.lay != null && st.lay >= 1.5 ? Math.min(1, (st.lay - 1.5) / 0.4) : 1;
      return clamp(Math.atan2(p.r, p.a) * HOLDT.shaft.turn[0] - HOLDT.shaft.turn[1], -1.2, 1.2) * k; }
    return 0;
  }
  // the ice shovel in the hands (tools/deck/fisk.py spade, spade_skaft, spade_is; the old block where the kit is not in the page): the
  // shaft from the grip G to the blade at B, the blade along it, tipped by tip, with a scoop of ice on it while full; as it tips, lumps of
  // ice (isbit) fall from it onto the heap in the box or tub at box (eye-relative, its base; top: the heap's height over it)
  function drawShovel(G, B, tip, full, c, box, top){
    // (the new people: the shovel is stiff, and the blade is at its length from the hand that holds the D grip, where that hand came out)
    if (LEMMER.on && HOLDT.shaft.len) B = add3(G, mul3(nrm3(sub3(B, G)), HOLDT.shaft.len));
    const SP = kit('fish', 'spade'), SH = kit('fish', 'spade_skaft'), SI = kit('fish', 'spade_is'), BIT = kit('fish', 'isbit'), dx = B[0] - G[0], dz = B[2] - G[2], yaw = Math.atan2(dx, -dz);
    const BM = chain(M4.T(B[0], B[1], B[2]), M4.RY(-yaw), M4.RZ(tip * 1.1));
    if (SP && SH){ drawN(SH, shaftM(G, B)); drawN(SP, BM); if (full && SI) drawN(SI, BM); }
    else { drawN(PM.broom, limbM(G, B, 0.018)); drawN(PM.shovel, BM); if (full) drawN(PM.scoop, chain(BM, M4.T(0, 0.01, 0))); }
    if (tip > 0.05) for (let i = 0; i < 10; i++){ const q = (c - 0.55) / 0.2 * 1.4 - hash(i) * 0.4; if (q < 0 || q > 1) continue;
      const P0 = [B[0] + (box[0] - B[0]) * q * 0.4 + (hash(i + 3) - 0.5) * 0.16, B[1] - q * q * Math.max(0, B[1] - box[1] - top), B[2] + (box[2] - B[2]) * q * 0.4 + (hash(i + 9) - 0.5) * 0.16];
      if (BIT) drawN(BIT, chain(M4.T(P0[0], P0[1], P0[2]), M4.RY(hash(i * 7) * 6.28 + q * 3), M4.S(0.55))); else drawN(PM.icebit, M4.T(P0[0], P0[1], P0[2])); }
  }
  // ---- the cold on the people on deck (OB14, F14): when the cold and the wet cost (13-work.js idleEnv().cold over CHILL), the hood of
  // an oilskin or a parka is up, and a bare head under another jacket has a knitted cap on. The hood is built here (the figure's parts
  // have only the parka's rolled one): a cowl round the head open to the face, in the jacket's own colour, fitted to the head part.
  // (HOODK: the hood of a look's meshes, so a frame looks nothing up)
  const HOODM = new Map(), HOODK = new WeakMap(), COLDL = new Map(); let HEADBB = null, CHILLT = {t:-1, on:false};
  function deckChill(){ if (CHILLT.t === S.t) return CHILLT.on; let on = false; try { on = typeof idleEnv === 'function' && typeof CHILL !== 'undefined' && S.boat.status !== 'port' && idleEnv().cold > CHILL; } catch (e) { /* a block not loaded */ } CHILLT = {t:S.t, on}; return on; }
  function hoodOf(col){
    const key = col.slice(0, 3).map(v => Math.round(v * 255)).join('.'); let m = HOODM.get(key); if (m) return m;
    if (!HEADBB){ const o = glbPart('worker', 'head'); if (!o) return null; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < o.p.length; i += 3) for (let a = 0; a < 3; a++){ lo[a] = Math.min(lo[a], o.p[i + a]); hi[a] = Math.max(hi[a], o.p[i + a]); } HEADBB = [lo, hi]; }
    const [lo, hi] = HEADBB, c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2 + 0.01, (lo[2] + hi[2]) / 2 + 0.012], r = [(hi[0] - lo[0]) / 2 * 1.16 + 0.014, (hi[1] - lo[1]) / 2 * 1.1 + 0.014, (hi[2] - lo[2]) / 2 * 1.12 + 0.014];
    // (from the back of the head round to the rim, which stands forward over the brow and back under the chin)
    const b = NB(), G = [], k = [col[0] * 0.92, col[1] * 0.92, col[2] * 0.92, col[3] == null ? 0.3 : col[3]];
    for (let i = 0; i <= 7; i++){ const row = []; for (let j = 0; j <= 16; j++){ const be = j / 16 * Math.PI * 2, top = Math.sin(be), am = (1.82 + 0.22 * top) * i / 7, sa = Math.sin(am);
      row.push([c[0] + r[0] * sa * Math.cos(be), c[1] + r[1] * sa * top - (top < 0 ? 0.03 * sa * -top : 0), c[2] + r[2] * Math.cos(am)]); } G.push(row); }
    b.grid(G, () => k); m = b.mesh(); HOODM.set(key, m); return m; }   // (one per jacket colour, a dozen at most: kept)
  const HOODTOP = {oilskin:1, parka:1}, HOODHAT = {none:1, beanie:1}, HOODOFF = {bun:1, pony:1, braid:1, long:1};   // (a peak or a brim keeps the hood down; a bun, a tail or long hair is inside it)
  // (a look for the cold: the same, with a knitted cap on a bare head; kept by the look's key)
  function coldLook(l){ if (!l || typeof l !== 'object' || HOODTOP[l.tp] || (l.ht && l.ht !== 'none')) return l; const key = lookSig(l); let o = COLDL.get(key); if (!o){ o = Object.assign({}, l, {ht:'beanie'}); if (COLDL.size > 60) COLDL.clear(); COLDL.set(key, o); } return o; }
  // ---- the sea legs in the drawing (FB4, steg 120; deckcrew.js seaLegs and SJOBEIN): for someone on a deck at sea (st.sea: whose
  // sea legs, seaSet; st.dn: the deck's normal in the world) the deck's slopes his way and its height go to seaLegs, and drawWorker
  // puts the feet, the knees, the hips, the torso and the head where it says. The hands of the work stay where the work is.
  const SEAIN = {sr:0, sf:0, y:0, hs:0, dt:0, walk:false, room:null, rail:null, hand:null, stepOk:null};
  // (who has a hand free for the rail: -1 either, 1 the left only (the cup in the right); whose hands are his body's own and go with
  // it as it leans: 1 the right, 2 the left, 3 both; the rest hold the work, which stays where it is)
  const SEAGRAB = {look:-1, aurora:-1, chat:-1, coffee:1}, SEAHANDS = {back:3, chat:3, phone:3, coffee:3, lunch:3, binoc:3, aurora:3, cold:3, knife:3, snus:3, smoke:1, cut:3, bleedst:3, carry:3, tally:3, remote:3};
  // whose sea legs (a deckcrew agent a of the boat's crewSim sim) on a deck whose frame is M (hers in the eye's frame); null with the sea legs off
  function seaSet(sim, a, M){
    if (!SJOBEIN.on || !sim.seaRoom) return null; let q = a.slQ; if (!q) q = a.slQ = {sim, a, ok:(dr, da) => a.mode === 'at' && sim.seaStepOk(a, dr, da)};   // (a foot is put out only at a place on deck, where it is tried against the model)
    return q; }
  function deckN(M){ const l = Math.hypot(M[4], M[5], M[6]) || 1; return [M[4] / l, M[5] / l, M[6] / l]; }
  function seaNow(st, h, y){
    const q = st.sea, n = st.dn, a = q.a, s = a.sl || (a.sl = seaState()), I = SEAIN, now = performance.now() / 1000, c = Math.cos(h), sn = Math.sin(h);
    if (!n || n[1] < 0.3) return null;
    I.sr = -(n[0] * c + n[2] * sn) / n[1]; I.sf = -(n[0] * sn - n[2] * c) / n[1]; I.y = y; I.hs = SJOBEIN.test && SJOBEIN.test.hs != null ? SJOBEIN.test.hs : (CREW3D._st.sea && CREW3D._st.sea.hs) || 0; I.dt = s.tp == null ? undefined : now - s.tp; s.tp = now;
    I.walk = !!st.walk; I.room = q.sim.seaRoom(a) || SEAROOM;
    // (turned at his work, workTurn, the room is not where it was measured: the least of it all round, and no step)
    if (Math.abs(h - st.h) > 0.3){ const R0 = I.room; if (!R0.min){ const m = Math.min(R0.r[0], R0.r[1], R0.f[0], R0.f[1]), w = Math.min(R0.w[0], R0.w[1]); R0.min = {r:[m, m], f:[m, m], w:[w, w], nostep:true}; } I.room = R0.min; }
    const g = st.walk || st.put || st.crate || st.ev || st.fx || st.blend < 1 ? undefined : st.task == null ? -1 : SEAGRAB[st.task];
    I.rail = g === undefined ? null : q.sim.seaRail(a); I.hand = g === 1 ? 1 : null; I.stepOk = q.ok;
    return seaLegs(s, I); }
  // a boot flat on the deck: turned his way and tipped to the deck's normal n
  function bootM(foot, h, n){
    const f = [Math.sin(h), 0, -Math.cos(h)], d = f[0] * n[0] + f[2] * n[2], z = [-(f[0] - d * n[0]), d * n[1], -(f[2] - d * n[2])], zl = Math.hypot(z[0], z[1], z[2]) || 1; z[0] /= zl; z[1] /= zl; z[2] /= zl;
    const x = [n[1] * z[2] - n[2] * z[1], n[2] * z[0] - n[0] * z[2], n[0] * z[1] - n[1] * z[0]];
    return new Float32Array([x[0], x[1], x[2], 0, n[0], n[1], n[2], 0, z[0], z[1], z[2], 0, foot[0] - n[0] * 0.08, foot[1] - n[1] * 0.08, foot[2] - n[2] * 0.08, 1]); }
  // a turn about a level axis that tips «up» by lr to the right and lf ahead of someone heading h (rad): the torso's lean
  function leanM(h, lr, lf){
    const dx = Math.cos(h) * lr + Math.sin(h) * lf, dz = Math.sin(h) * lr - Math.cos(h) * lf, th = Math.hypot(dx, dz); if (th < 1e-6) return null;
    const kx = dz / th, kz = -dx / th, c = Math.cos(th), sn = Math.sin(th), v = 1 - c;
    return new Float32Array([c + kx * kx * v, kz * sn, kx * kz * v, 0, -kz * sn, c, kx * sn, 0, kx * kz * v, -kx * sn, c + kz * kz * v, 0, 0, 0, 0, 1]); }
  // (the tests, tests/folk2deck.py «ting»: with LEMMER.things set, every thing drawn with a worker is kept with its place, and the
  // worker's body as it was drawn (LEMMER.bodies), so what he holds and what stands by him can be tried against people: thingClip)
  function drawWorker(P, st, eye, T, idx){
    if (!LEMMER.things) return drawWorker0(P, st, eye, T, idx);
    const d0 = drawN; drawN = (m, M) => { if (m && !m.fig2 && !m.wear && M) LEMMER.things.push({i:idx, m, M:new Float32Array(M), eye:[eye[0], eye[1], eye[2]]}); d0(m, M); };
    try { return drawWorker0(P, st, eye, T, idx); } finally { drawN = d0; }
  }
  function drawWorker0(P, st, eye, T, idx){
    // (OB14: seated with the lunch or the cup; deckcrew.js matPlace)
    if (st.task === 'sitmat' || st.task === 'sitkaffe'){ st.seated = true; st.task = st.task === 'sitmat' ? 'lunch' : 'coffee'; }
    const chill = !!st.deck && !!P.look && typeof P.look === 'object' && deckChill(), hooded = chill && HOODTOP[P.look.tp] && HOODHAT[P.look.ht || 'none'];
    if (chill && !hooded) P.look = coldLook(P.look);
    const y = P.gy([st.x, st.z]), h = st.h + workTurn(st, eye, T, idx); (P.wpos || (P.wpos = {}))[idx] = {x:st.x, y, z:st.z};   // where he stands, for his words (sayWorker)
    const F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], rel = (x, yy, z) => [x - eye[0], yy - eye[1], z - eye[2]];
    const W = (a, up, r) => rel(st.x + F[0] * a + R[0] * r, y + up, st.z + F[1] * a + R[1] * r);
    // (W0: from his place as it is headed, not turned at the work: what stands on the deck by him, and the shovel's round)
    const F0 = [Math.sin(st.h), -Math.cos(st.h)], R0 = [Math.cos(st.h), Math.sin(st.h)], W0 = (a, up, r) => rel(st.x + F0[0] * a + R0[0] * r, y + up, st.z + F0[1] * a + R0[1] * r);
    const ph = st.walk || st.task === 'sweep' ? (T * 6.5 + idx) : 0, sw = st.walk ? Math.sin(ph) : 0;
    // the detailed figure (tools/harbour/arbeider.py): the harbour workers in blue coveralls and hard hats, the crew on deck in oilskins
    const lk = P.look || (!P.kit && !P.bare && P.id != null ? lookQuay(P.id, idx) : null);      // the people on a plant's quay each have their own look too (core/09i-look.js lookQuay)
    const K = PM.W && (lk ? lookMesh(lk) : PM.W[P.kit || (P.bare ? 'crew' : 'hw')]);      // P.look: the one who does the work, by his look (the skipper's or a crew member's); P.kit: the old kits
    // (the new people, FB7: the look's whole figure as one skinned mesh, posed from the joints found below; null without #folk2)
    const FG = PRGS && K ? figOf(K) : null;
    // how low the work takes him (workLow): dip lowers the hips, the back and the head with the knees going forward, bend tips the back over
    const LB = workLow(st, T, idx), bk = st.blend == null ? 1 : st.blend, sit = LB[2] ? bk : 0, sh = st.seat || 0.5, dip = LB[0] * bk, dy = -dip * 0.42 - sit * (0.94 - sh);
    // (sitting, LB[2]: on a low seat, the thighs out level and the shins down to the deck; the seat is drawn with the props)
    // the sea legs (seaNow): SE what the sea asks of him, hy0 the hips' way up or down, ox/oz their shift in the world and lx/lz the
    // torso's lean per metre over them; up3 moves a point of the upper body at height hh with it
    // (the hips are over the feet along SE.sq: plumb, or along the deck's normal where there is no room to stand upright)
    const SE = st.sea && !sit && !LB[2] ? seaNow(st, h, y) : null, hH = 0.92 + dy, hS = SE ? hH + SE.hipY : hH, hy0 = SE ? hS * SE.sqU - hH : 0, hR = SE ? SE.hipR + hS * SE.sqR : 0, hF = SE ? SE.hipF + hS * SE.sqF : 0;
    // (the upper body turns about the hips with the torso's lean, lth towards [ldx, ldz], and goes with the hips: up3 moves a point of it)
    const ox = SE ? R[0] * hR + F[0] * hF : 0, oz = SE ? R[1] * hR + F[1] * hF : 0, lth = SE ? Math.hypot(SE.leanR, SE.leanF) : 0, ldx = lth > 1e-9 ? (R[0] * SE.leanR + F[0] * SE.leanF) / lth : 0, ldz = lth > 1e-9 ? (R[1] * SE.leanR + F[1] * SE.leanF) / lth : 0;
    const lcs = Math.cos(lth), lsn = Math.sin(lth), bend0 = LB[1] * bk + (st.slump || 0) * 0.45, Pv = SE ? W(bend0 * 0.4, hH, 0) : null;
    const up3 = SE ? q => { const vx = q[0] - Pv[0], u = q[1] - Pv[1], vz = q[2] - Pv[2], a = vx * ldx + vz * ldz, a2 = a * lcs + u * lsn; q[0] += ox + (a2 - a) * ldx; q[1] = Pv[1] + hy0 - a * lsn + u * lcs; q[2] += oz + (a2 - a) * ldz; return q; } : q => q;
    const LG = SJOBEIN.log && st.dn ? {idx, npc:!st.deck, task:st.task, walk:!!st.walk, ev:!!(st.ev || st.fx), on:!!SE, x:st.x, y, z:st.z, h, n:st.dn || null, feet:[], hips:[], kf:[]} : null;
    let hands, seaH = SEAHANDS[st.task] || 0;
    const t = tOf(T, idx);
    // (near, the hands are drawn in their grips, the pose's points being where they hold: a hanging hand's grip is below its wrist)
    const HMS = K ? handMeshes() : null, near = !!HMS && Math.hypot(...W(0, 1.2, 0)) < 10, GRIP = FG ? FG.grip : HMS ? HMS.grip : null;   // (where each grip holds: the new body's own, extras.grips)
    const ease = u => u * u * (3 - 2 * u), lerp3 = (A, B, u) => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u], norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    // (the new figure's face, FB7: where a hand goes to its mouth or its eyes, from the head's own mesh (figpose.js figHead) over the
    // hips as he stands or sits and bends; off the hand's point from it [ahead, up, to the hand's side] (deckcrew.js HOLDT). The old
    // figure keeps the heights its poses had, old. faceH: the hands that are at the face, which come down with the hips)
    // (toFace: low the hand's point away from the face and k how far up it is, 0 to 1. The point is found again in the torso's own
    // frame once the back's bend is known, FQ and holdClear)
    let faceH = 0; const FH = FG && FG.head && LEMMER.on ? FG.head : null, FQ = [null, null];
    // (the shovel's hands [the lower, the upper]. The new people: the shovel is stiff, HOLDT.shaft: from the blade's socket towards where
    // the upper hand would be by his hip, st.shP, its length to the D grip, and the lower hand a fixed way down it; holdClear turns it
    // about the blade until it is clear of him. The old figure: the upper fist before him and the shaft stretched from it)
    const shovelAt = (B, P0) => { const S = HOLDT.shaft, u = nrm3(sub3(P0, B)), G = add3(B, mul3(u, S.len)); return [sub3(G, mul3(u, S.low)), G]; };
    const shovelHands = r => { if (LEMMER.on){ const S = HOLDT.shaft; st.shP = W(S.hip[0], hH + S.hip[1], S.hip[2]); return shovelAt(st.blade, st.shP); }
      const G = W(0.08, 1.02, r * 0.35), B = st.blade; return [[G[0] + (B[0] - G[0]) * 0.5, G[1] + (B[1] - G[1]) * 0.5, G[2] + (B[2] - G[2]) * 0.5], G]; };
    const toFace = (i, low, what, off, k, old) => { if (!FH) return low ? lerp3(low, old, k) : old; faceH |= i + 1; const p = FH[what], sd = i ? -1 : 1, l = [FG.hj[0] - p[2] + off[0], FG.hj[1] + p[1] + off[1], off[2] * sd];
      FQ[i] = {low, l, k}; const A = W(l[0] + FG.hj[1] * Math.sin(bend0), hH + l[1] * Math.cos(bend0), l[2]); return low ? lerp3(low, A, k) : A; };
    switch (st.task){
      case 'hose': hands = [W(0.45, 1.15, 0.12), W(0.3, 1.1, -0.1)]; break;
      case 'coil': { const a = t * 3; hands = [W(0.35 + Math.cos(a) * 0.12, 1.05 + Math.sin(a) * 0.15, 0.12), W(0.3, 1.0, -0.15)]; break; }
      // (FB7, Jonas 13.11.2026 «Sørg for at objekter ikke kan clippe inn i menneskene»: the fish box is 78 cm long and was carried end on,
      // 11 cm into his belly. With the new people it is carried across him by its ends, the hands 82 cm apart, 19 cm clear of him)
      case 'stack': { const k = (Math.sin(t * 1.4) + 1) / 2, cw = LEMMER.on; const bg = HOLDT.box.grip; hands = cw ? [W(0.36, 0.56 + k * 0.5, bg[0]), W(0.36, 0.56 + k * 0.5, -bg[0])] :   /* (from the knees to the chest, the hips down for it: workLow) */ [W(0.35, 0.7 + k * 0.6, 0.2), W(0.35, 0.7 + k * 0.6, -0.2)]; break; }
      case 'carry': hands = LEMMER.on ? [W(0.36, 1.02, HOLDT.box.grip[0]), W(0.36, 1.02, -HOLDT.box.grip[0])] : [W(0.3, 1.0, 0.2), W(0.3, 1.0, -0.2)]; break;
      // icing: the shovel goes into the ice bin on his left, swings over to the box of fish on his right and tips the ice over the fish
      case 'ice': { const p = shovelPath(st, eye, T, idx, y); st.blade = W0(p.a, p.up, p.r); st.tip = p.tip; st.full = p.full; st.c = p.c; hands = shovelHands(p.r); break; }
      case 'sweep': { const k = Math.sin(t * 2.2) * 0.25; hands = [W(0.25 + k * 0.3, 1.0, 0.1 + k), W(0.35 + k * 0.3, 0.8, -0.05 + k)];
        // (the new people: the broom has its line from the upper hand to its head on the deck, and the lower hand holds on that line; Jonas' clips 14.11.2026, where the lower hand slid beside the shaft)
        if (LEMMER.on) hands[1] = lerp3(hands[0], W(0.25 + k * 0.3 + 0.55, 0.108, 0.1 + k), HOLDT.broom.low); break; }
      case 'coffee': { const k = Math.max(0, Math.sin(t * 0.5)) ** 8; st.sip = k; hands = st.seated ? [toFace(0, W(0.3, sh + 0.22, 0.12), 'mouth', HOLDT.cup.sip, k, W(0.2, sh + 0.64, 0.04)), W(0.34, sh + 0.2, -0.1)] : [toFace(0, W(0.28, 1.05, 0.14), 'mouth', HOLDT.cup.sip, k, W(0.18, 1.5, 0.04)), W(0.05, 0.85, -0.25)]; break; }
      // the cold (OB14, F14): the arms beaten round the chest and flung out again a few times, then the hands rubbed before the chest
      // and breathed into, over and over
      case 'cold': { const c = t % 8.4, beat = c < 3.4 ? ease(Math.min(1, c / 0.3)) * (1 - ease(clamp((c - 3.1) / 0.3, 0, 1))) : 0, sw2 = 0.5 + 0.5 * Math.sin(c * 6.6 - 1.2);
        const rub = Math.sin(t * 11) * 0.035, up = c > 5.6 && c < 7.2 ? Math.sin((c - 5.6) / 1.6 * Math.PI) : 0;
        const bl = HOLDT.blow.at, A0 = FH ? [0, 1].map(i => toFace(i, W(0.28 + (i ? -rub : rub), 1.24, i ? -0.035 : 0.035), 'mouth', [bl[0] + (i ? -rub : rub), bl[1], bl[2]], up, null)) : [W(0.28 + rub, 1.24 + up * 0.22, 0.035), W(0.28 - rub, 1.24 + up * 0.22, -0.035)], B0 = [lerp3(W(0.14, 1.22, 0.56), W(0.2, 1.36, -0.14), sw2), lerp3(W(0.14, 1.22, -0.56), W(0.2, 1.36, 0.14), sw2)];
        hands = [lerp3(A0[0], B0[0], beat), lerp3(A0[1], B0[1], beat)]; if (beat > 0) FQ[0] = FQ[1] = null; break; }
      // at a landing: hand signals to the crane driver, reaching for a load coming down, unhooking it, counting, and the radio remote
      case 'signal': { const k = Math.sin(t * 3.2); hands = [LEMMER.on ? W(0.2 + k * 0.06, 1.72, 0.3 + k * 0.1) : W(0.2 + k * 0.06, 1.72, 0.32 + k * 0.12), W(0.25, 0.95, -0.22)]; break; }   // (FB2: the wave 4 cm narrower, the elbow under the hand)
      case 'guide': hands = [W(0.42, 1.62, 0.22), W(0.42, 1.62, -0.22)]; break;
      case 'unhook': hands = [LEMMER.on ? W(0.36, 1.87, 0.1) : W(0.38, 1.9, 0.08), W(0.35, 1.3, -0.18)]; break;   // (FB2: the ring 3 cm lower and 2 cm nearer, where the arm reaches it)
      case 'tally': { const k = Math.max(0, Math.sin(t * 0.9)) * 0.04; hands = [W(0.3, 1.12, 0.1), W(0.28 + k, 1.08, -0.12)]; break; }
      case 'remote': hands = [W(0.3, 1.05, 0.11), W(0.3, 1.05, -0.11)]; break;
      case 'nozzle': hands = [W(0.42, 0.85, 0.06), W(0.36, 0.98, -0.12)]; break;
      // gutting at the table: the knife hand works along the belly, every few seconds the offal goes over the rail
      // the agents' places (deckcrew.js): hands on the wheel, forearms on the rail, the jig worked up and down
      case 'helm': hands = [W(0.3, 1.1, 0.17), W(0.3, 1.1, -0.17)]; break;
      case 'helmsit': hands = [W(0.4, sh + 0.42, 0.16), W(0.4, sh + 0.42, -0.16)]; break;
      case 'drive': hands = [W(0.56, sh + 0.26, 0.12), W(0.58, sh + 0.2, -0.1)]; break;
      case 'lean': { const r = st.rail; hands = r ? [W(r[0] + 0.02, r[1] + 0.04, 0.2), W(r[0] + 0.02, r[1] + 0.04, -0.2)] : [W(0.4, 1.02, 0.2), W(0.4, 1.02, -0.2)]; break; }
      case 'jig': { const k = Math.pow(Math.max(0, Math.sin(t * 2.6)), 3), r = st.rail; hands = r ? [W(r[0] + 0.02, r[1] + 0.05 + k * 0.35, 0.16), W(r[0] - 0.02, r[1] + 0.01, -0.16)] : [W(0.34, 0.95 + k * 0.35, 0.16), W(0.3, 0.9, -0.16)]; break; }
      case 'gut': { const c = (T % 3) / 3, thr = c > 0.7 && c < 0.85 ? Math.sin((c - 0.7) / 0.15 * Math.PI) : 0; hands = [W(0.42 + thr * 0.25, 0.95 + thr * 0.35, 0.16 + Math.sin(T * 7) * 0.07 * (1 - thr)), W(0.42, 0.9, -0.1)]; break; }
      // the gaff (linehøtt) at the hauler (the event: dkFor, seconds st.ev.k): out over the rail and down to the fish on the line, a
      // jerk as it bites, up and in over the rail with the fish hanging on it, shaken off into the bleeding tub, back to the ready
      case 'gaff': { const e = st.ev, c = e ? e.k : 99, ready = W(0.55, 1.75, 0.18); let tip = ready; st.gaffFish = false; st.gaffDrop = -1;
        if (e && c < DKDUR.gaff){ const up = [e.R[0], e.R[1] + 0.55, e.R[2]], U = [e.U[0], e.U[1] + 0.55, e.U[2]];
          if (c < 0.5) tip = lerp3(ready, e.W, ease(c / 0.5));
          else if (c < 0.65) tip = [e.W[0], e.W[1] - 0.06 * Math.sin((c - 0.5) / 0.15 * Math.PI), e.W[2]];
          else if (c < 1.35){ const u = ease((c - 0.65) / 0.7); tip = lerp3(lerp3(e.W, up, u), lerp3(up, U, u), u); }
          else if (c < 1.7) tip = [U[0], U[1] + Math.sin((c - 1.35) / 0.35 * Math.PI * 4) * 0.05, U[2]];
          else tip = lerp3(U, ready, ease(Math.min(1, (c - 1.7) / 0.7)));
          st.gaffFish = c >= 0.5 && c < 1.45; st.gaffDrop = c >= 1.45 && c < 1.75 ? (c - 1.45) / 0.3 : -1; }
        // (the new people: the shaft passes before his belly, the back hand there and the fore hand ahead of him, not through the
        // chest; holdClear puts the hands at the gaff's own grips, deckcrew.js HOLDT.gaff)
        const ch = FH ? W(0.36, 1.0, 0.04) : W(0.15, 1.25, 0), n0 = norm3([tip[0] - ch[0], tip[1] - ch[1], tip[2] - ch[2]]); let g = [tip[0] - n0[0] * 0.66, tip[1] - n0[1] * 0.66, tip[2] - n0[2] * 0.66];
        const gd = Math.hypot(g[0] - ch[0], g[1] - ch[1], g[2] - ch[2]); const gm = FH ? HOLDT.gaff.far : 0.55; if (gd > gm) g = lerp3(ch, g, gm / gd);
        const n = norm3([tip[0] - g[0], tip[1] - g[1], tip[2] - g[2]]); st.gaff = {g, n, tip:[g[0] + n[0] * 0.66, g[1] + n[1] * 0.66, g[2] + n[2] * 0.66]};
        hands = [g, [g[0] - n[0] * 0.38, g[1] - n[1] * 0.38, g[2] - n[2] * 0.38]]; break; }
      // bleeding a jigged fish (the event st.ev): he takes it off at the rail, lifts it by the head, cuts the throat with the knife (the
      // blood runs), swings and tosses it into the bleeding tub, and goes back to the jig
      case 'bleed': { const e = st.ev, c = e ? e.k : 99, jl = W(0.3, 0.9, -0.16), jr = W(0.34, 0.95, 0.16), chest = W(0.42, 1.08, -0.04), kUp = W(0.38, 1.2, 0.2), kDn = W(0.48, 1.0, -0.12);
        let L = jl, Rh = jr; st.held = null; st.knife = false; st.toss = null; st.blood = -1;
        if (e && c < DKDUR.bleed){ const R = [e.R[0], e.R[1] + 0.1, e.R[2]], U = [e.U[0], e.U[1] + 0.3, e.U[2]], sw = [chest[0] + (U[0] - chest[0]) * 0.35, chest[1] + 0.15, chest[2] + (U[2] - chest[2]) * 0.35];
          if (c < 0.5){ L = lerp3(jl, R, ease(c / 0.5)); if (c > 0.3) st.held = L; }
          else if (c < 1.0){ L = lerp3(R, chest, ease((c - 0.5) / 0.5)); st.held = L; }
          else if (c < 1.8){ L = chest; st.held = L; st.knife = true; Rh = lerp3(kUp, kDn, ease(clamp((c - 1.1) / 0.3, 0, 1))); if (c > 1.25) st.blood = (c - 1.25) / 0.6; }
          else if (c < 2.2){ const u = ease((c - 1.8) / 0.4); L = lerp3(chest, sw, u); Rh = lerp3(kDn, jr, u); st.knife = c < 2.0; if (c < 2.05) st.held = L; }
          else { const u = ease(Math.min(1, (c - 2.2) / 0.8)); L = lerp3(sw, jl, u); }
          if (c >= 2.05 && c < 2.45) st.toss = {from:sw, to:U, u:(c - 2.05) / 0.4}; }
        hands = [Rh, L]; break; }
      // ---- the work on deck, step by step (Jonas 20.10.2026: «Alle deler av arbeidsprosessene må ha egne animasjoner»); the places the
      // hands go to (the table, the bleeding tub, the crate, the rail) come from drawDeckCrew as points in the eye's frame (st.Tb, st.Ub ...)
      // at the line hauler between the fish: a hand on the hauler's lever, the other guiding the line in over the sheave
      case 'haul': { const k = Math.sin(t * 1.6) * 0.03, r = st.rail, ra = r ? (LEMMER.on ? Math.min(r[0], 0.5) : r[0]) : 0;   // (FB2: no further ahead than he reaches bent over, where the hauler stands far in from his place)
        hands = r ? [W(ra + 0.08, r[1] + 0.1 + k, 0.2), W(ra + 0.12, r[1] + 0.24 - k, -0.06)] : [W(0.42, 1.08 + k, 0.2), W(0.52, 1.22 - k, -0.06)]; break; }
      // the pot hand and the crab sorter: hands at the work in front, low
      case 'tend': { const k = Math.sin(t * 2.2); hands = [W(0.45 + k * 0.05, 0.8 + Math.max(0, k) * 0.12, 0.16), W(0.45 - k * 0.05, 0.8 + Math.max(0, -k) * 0.12, -0.16)]; break; }
      // setting the line or the nets (OB3, F4): the hands on the gear just inside where it goes over, paying it out hand over hand
      case 'sett': { const k = Math.sin(t * 2.8), r = st.rail || [0.45, 1.05]; hands = [W(r[0] - 0.08 + Math.max(0, k) * 0.16, r[1] + 0.04 + Math.abs(k) * 0.03, 0.13), W(r[0] - 0.08 + Math.max(0, -k) * 0.16, r[1] + 0.04 + Math.abs(k) * 0.03, -0.13)]; break; }
      // the net off the hauler: the hands at the meshes; a fish (the event) is worked out of them, held up and let fall to the deck
      case 'pick': { const e = st.ev, c = e ? e.k : 99, i0 = Math.sin(t * 2.4), pr = st.rail, idle = pr ? [W(pr[0] + 0.06, pr[1] + 0.05 + i0 * 0.05, 0.14), W(pr[0] + 0.06, pr[1] + 0.03 - i0 * 0.05, -0.14)] : [W(0.48, 1.02 + i0 * 0.05, 0.14), W(0.48, 1.0 - i0 * 0.05, -0.14)]; st.held = null; st.fall = null;
        if (e && c < DKDUR.pick){ const Rt = e.R, aR = [Rt[0] + R[0] * 0.09, Rt[1], Rt[2] + R[1] * 0.09], aL = [Rt[0] - R[0] * 0.09, Rt[1] + 0.05, Rt[2] - R[1] * 0.09], back = [W(0.36, 1.0, 0.12), W(0.36, 1.02, -0.12)];
          if (c < 0.4){ const u = ease(c / 0.4); hands = [lerp3(idle[0], aR, u), lerp3(idle[1], aL, u)]; }
          else if (c < 1.6){ const w = Math.sin((c - 0.4) * 11) * 0.04; hands = [[aR[0], aR[1] + w, aR[2]], [aL[0], aL[1] - w, aL[2]]]; st.held = [Rt[0], Rt[1] - 0.04, Rt[2]]; }
          else if (c < 2.0){ const u = ease((c - 1.6) / 0.4); hands = [lerp3(aR, back[0], u), lerp3(aL, back[1], u)]; const m = [(hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]) - 0.06, (hands[0][2] + hands[1][2]) / 2];
            if (c < 1.8) st.held = m; else st.fall = {A:m, B:e.D || W(0.5, 0.05, 0), u:(c - 1.8) / 0.2}; }
          else { const u = ease((c - 2.0) / 0.4); hands = [lerp3(back[0], idle[0], u), lerp3(back[1], idle[1], u)]; } }
        else hands = idle; break; }
      // the bleeder between the fish: the knife in the right hand, ready
      case 'bleedst': { const k = Math.sin(t * 0.7) * 0.02; hands = [W(0.3, 0.92 + k, 0.2), W(0.28, 0.95 - k, -0.18)]; break; }
      // jigging by hand: the line comes up hand over hand at the rail with the fish on it (the event), and is lifted in over the rail
      case 'jigup': { const e = st.ev, c = e ? e.k : 99, Rl = e ? e.R : W(0.5, 1.0, 0), Wt = e ? e.W : W(0.9, -0.5, 0); st.held = null;
        if (e && c < 1.6){ const k = (c * 2.6) % 1, up = 0.85 + 0.42 * Math.sin(k * Math.PI); hands = [W(0.4, k < 0.5 ? up : 1.27 - (up - 0.85), 0.08), W(0.38, k < 0.5 ? 1.27 - (up - 0.85) : up, -0.08)];
          // (the fish pulls the line to the sides on its way up, less as it comes to the rail, and splashes as it breaks the surface)
          const u = clamp(c / 1.5, 0, 1), fw = (e.kg || 2) * 2.7 + e.t0 % 7, tg = tug(t, fw, 0.16 * (1 - u * u)), H0 = lerp3(Wt, [Rl[0], Rl[1] - 0.15, Rl[2]], u * u);
          st.held = [H0[0] + tg[0], H0[1], H0[2] + tg[1]]; st.line = [hands[1], Rl, st.held];
          if (!e.spl && u > 0.06){ e.spl = true; fishSplash(st.held, e.kg, 12); } else if (u < 0.35 && flapK(t, fw) > 0.85 && t - (e.slT || 0) > 0.7){ e.slT = t; fishSplash(st.held, e.kg, 4); } }   // (at most one in 0.7 s, whatever the frame rate)
        else { const u = e ? ease(clamp((c - 1.6) / 0.6, 0, 1)) : 1, chest = W(0.4, 1.1, -0.05); hands = [W(0.36, 1.0, 0.16), lerp3([Rl[0], Rl[1] + 0.05, Rl[2]], chest, u)]; if (e) st.held = [hands[1][0], hands[1][1] - 0.04, hands[1][2]]; }
        break; }
      // packing and icing (by the bleeding tub): a gutted fish just landed in the box before him (st.lay, s since) is laid straight with both
      // hands; between them ice is shovelled over the fish from the bin at his side (st.binR, away from the gutter), into the box (or the
      // open boat's tub, st.Cr)
      case 'pack': { const L = st.lay, Cr = st.Cr || W(0.15, 0, 0.62), cr = [Cr[0], Cr[1] + (st.crTop || 0.28), Cr[2]]; st.blade = null; st.tip = 0;
        if (L != null && L >= 0 && L < 1.5){ const u = Math.sin(Math.min(1, L / 1.5) * Math.PI), k = Math.sin(L * 9) * 0.03;
          hands = [[cr[0] + R[0] * 0.13 + F[0] * k, cr[1] + 0.06 + 0.2 * (1 - u), cr[2] + R[1] * 0.13 + F[1] * k], [cr[0] - R[0] * 0.13, cr[1] + 0.06 + 0.2 * (1 - u), cr[2] - R[1] * 0.13]]; break; }
        const p = shovelPath(st, eye, T, idx, y); st.blade = W0(p.a, p.up, p.r); st.tip = p.tip; st.full = p.full; st.c = p.c; hands = shovelHands(p.r); break; }
      // a full box of fish carried to the hatch and lowered into the hold (st.s: seconds there; 2.2 in all)
      case 'stow': { const u = clamp(stowS(st) / 1.6, 0, 1); if (LEMMER.on){ const B = HOLDT.box, e = ease(u), a = 0.36 + (B.stow[0] - 0.36) * e, hy = 1.02 + (B.stow[1] - 1.02) * e; hands = [W(a, hy, B.grip[0]), W(a, hy, -B.grip[0])]; break; }   /* (the new people: from where he carried it, against his belly, down to the hatch) */
        hands = [W(0.42, 0.95 - 0.5 * ease(u), 0.22), W(0.42, 0.95 - 0.5 * ease(u), -0.22)]; break; }
      // baiting the line (Jonas 20.10.2026: «Egning av liner må også ha animasjoner»): a hook from the tub's rim, a bit of bait from the
      // bucket at his right, on the hook, and the baited hook laid down in the tub; stripping takes the old bait off into the bucket and
      // now and then throws the bucket's bits over the rail (st.Tu the tub, st.Bk the bucket, st.Of over the rail)
      case 'egn': case 'strip': { const Tu = st.Tu || W(0.55, 0.38, 0), Bk = st.Bk || W(0.25, 0.3, 0.42), egn = st.task === 'egn', cyc = egn ? 2.4 : 2.0, c = ((T + idx * 0.9) % cyc) / cyc;
        const rim = [Tu[0] - F[0] * 0.2 - R[0] * 0.08, Tu[1] + 0.02, Tu[2] - F[1] * 0.2 - R[1] * 0.08], mid = W(0.32, 0.72, 0.02), inT = [Tu[0], Tu[1] - 0.08, Tu[2]], bk = [Bk[0], Bk[1] + 0.26, Bk[2]];
        st.bait = null; st.old = null; st.hook = null; st.flick = null; st.bucket = null; st.spill = -1;
        // the bucket's bits over the rail, every 25 s or so while stripping (the gulls come for them)
        const dump = !egn && st.Of && ((T + idx * 3.1) % 25) < 2.2;
        if (dump){ const u = ((T + idx * 3.1) % 25) / 2.2, sw1 = Math.sin(Math.min(1, u * 1.6) * Math.PI / 2), lift = [Bk[0] * (1 - sw1) + (st.Of[0] * 0.25 + Bk[0] * 0.75) * sw1, Bk[1] + 0.35 + 0.5 * sw1, Bk[2] * (1 - sw1) + (st.Of[2] * 0.25 + Bk[2] * 0.75) * sw1];
          hands = [[lift[0] + R[0] * 0.08, lift[1] + 0.1, lift[2] + R[1] * 0.08], [lift[0] - R[0] * 0.08, lift[1] - 0.05, lift[2] - R[1] * 0.08]]; st.bucket = lift; st.spill = u > 0.55 ? (u - 0.55) / 0.45 : -1; break; }
        if (c < 0.22){ const u = ease(c / 0.22); hands = [lerp3(mid, egn ? bk : mid, u * 0.2), lerp3(mid, rim, u)]; }
        else if (c < 0.45){ const u = ease((c - 0.22) / 0.23); hands = [lerp3(mid, egn ? bk : W(0.34, 0.75, 0.14), u), lerp3(rim, W(0.3, 0.74, -0.06), u)]; st.hook = hands[1]; if (egn && u > 0.8) st.bait = hands[0]; if (!egn) st.old = hands[1]; }
        else if (c < 0.7){ const u = ease((c - 0.45) / 0.25), pr = W(0.3, 0.75, 0.03); hands = [lerp3(egn ? bk : W(0.34, 0.75, 0.14), egn ? pr : [bk[0], bk[1] + 0.12, bk[2]], u), W(0.3, 0.74, -0.06)]; st.hook = hands[1];
          if (egn) st.bait = hands[0]; else if (u < 0.35) st.old = hands[0]; else st.flick = {A:W(0.34, 0.75, 0.14), B:bk, u:(u - 0.35) / 0.65}; }
        else if (c < 0.9){ const u = ease((c - 0.7) / 0.2); hands = [lerp3(egn ? W(0.3, 0.75, 0.03) : [bk[0], bk[1] + 0.12, bk[2]], mid, u), lerp3(W(0.3, 0.74, -0.06), inT, u)]; st.hook = hands[1]; if (egn) st.bait = hands[1]; }
        else { const u = ease((c - 0.9) / 0.1); hands = [mid, lerp3(inT, mid, u)]; }
        break; }
      // mending the nets over the rail (Jonas 20.10.2026: «bøting av garn, det må også ha en animasjon»): the left hand holds the torn mesh,
      // the right ties the new knots with the netting needle, round and through, and pulls each one tight
      case 'mend': { const Nt = st.Nt || W(0.42, 1.0, 0), k = (T * 1.2 + idx) % 1, pull = k > 0.8 ? Math.sin((k - 0.8) / 0.2 * Math.PI) : 0, a = k * Math.PI * 2 * 3;
        hands = [[Nt[0] + R[0] * (0.08 + Math.cos(a) * 0.04 * (1 - pull)) - F[0] * pull * 0.18, Nt[1] + Math.sin(a) * 0.04 * (1 - pull) + pull * 0.06, Nt[2] + R[1] * (0.08 + Math.cos(a) * 0.04 * (1 - pull)) - F[1] * pull * 0.18], [Nt[0] - R[0] * 0.1, Nt[1] + 0.02, Nt[2] - R[1] * 0.1]];
        st.needle = {at:hands[0], dir:[F[0] * 0.6 + R[0] * 0.3, 0.55, F[1] * 0.6 + R[1] * 0.3]}; break; }
      // gutting at the table as the trade does it (Jonas 23.10.2026, his video of a cod gutted slowly to show it): a fish out of the
      // bleeding tub (st.Ub) and held head up against the table's edge, the belly opened from the vent up to the throat, the cut at the
      // throat and the gills, the guts pulled out and over the rail (st.Of; the gulls come for them), the fish laid on the table (st.Tb),
      // the head cut off at a slant behind the gill cover and over the side, the belly scraped clean, and the fish on to the packer's
      // crate (st.Cr), else to the end of the table; 5.6 s a fish (about the simulation's 5 kg a minute at the game's pace)
      case 'gutw': { const Gs = ((tOf(T, idx)) % 5.6), Tb = st.Tb || W(0.5, 0.88, 0), sh = W(0.1, 1.3 + dy, 0),   /* (no table given, a pose asked for in the tests: one before him) */
        Ub = st.Ub ? lerp3(sh, st.Ub, Math.min(1, (LEMMER.on ? 0.5 : 0.68) / Math.max(0.01, Math.hypot(st.Ub[0] - sh[0], st.Ub[1] - sh[1], st.Ub[2] - sh[2])))) : W(0.45, 0.6, 0.5);
        const sc = st.gsc || 0.46, fH = [Tb[0] - R[0] * 0.2, Tb[1] + 0.05, Tb[2] - R[1] * 0.2], fT = [Tb[0] + R[0] * 0.2, Tb[1] + 0.05, Tb[2] + R[1] * 0.2], mid = lerp3(fH, fT, 0.5), rest = [W(0.36, 0.98, 0.18), W(0.36, 0.96, -0.12)], lo = [Ub[0], Ub[1] - 0.14, Ub[2]];
        const end = st.Cr ? [st.Cr[0], st.Cr[1] + (st.crTop || 0.3), st.Cr[2]] : [Tb[0] + F[0] * 0.05 + R[0] * 0.55, Tb[1] + 0.05, Tb[2] + F[1] * 0.05 + R[1] * 0.55];
        // the head held at the table's near edge, the fish hanging from it; the vent and the throat on its belly, towards him
        const E = [Tb[0] - F[0] * 0.16, Tb[1] + 0.9 * sc, Tb[2] - F[1] * 0.16], up = (P, d) => [P[0] - F[0] * 0.035, P[1] - d, P[2] - F[1] * 0.035], vent = up(E, 0.55 * sc), throat = up(E, 0.13 * sc);
        const cutAt = [mid[0] - R[0] * 0.35 * sc, mid[1], mid[2] - R[1] * 0.35 * sc];   // (behind the gill cover: 0.35 of the fish from its middle)
        st.gf = null; st.slo = null; st.gt = null; st.knife = Gs >= 1.2 && Gs < 5.0; st.kdir = null; st.cut = Gs >= 4.05; st.hd = null;
        if (Gs < 0.8){ const u = ease(Gs / 0.8); hands = [rest[0], lerp3(rest[1], lo, Math.sin(u * Math.PI / 2))]; if (Gs > 0.6) st.gf = {at:hands[1], hang:true}; }
        else if (Gs < 1.3){ const u = ease((Gs - 0.8) / 0.5); hands = [lerp3(rest[0], vent, u * 0.8), lerp3(lo, E, u)]; st.gf = {at:hands[1], hang:true}; }
        // the belly opened from the vent up to the throat
        else if (Gs < 2.0){ const u = ease((Gs - 1.3) / 0.7); hands = [lerp3(vent, throat, u), E]; st.gf = {at:E, hang:true}; st.kdir = [F[0] * 0.6, 0.55, F[1] * 0.6]; }
        // the cut at the throat and across the gills, a few strokes
        else if (Gs < 2.5){ const k = Math.sin((Gs - 2.0) * 22) * 0.03; hands = [[throat[0] + R[0] * k, throat[1] + 0.01, throat[2] + R[1] * k], E]; st.gf = {at:E, hang:true}; st.kdir = [F[0] * 0.5 - R[0] * 0.4, 0.2, F[1] * 0.5 - R[1] * 0.4]; }
        // the guts pulled out and down, and thrown over the rail
        else if (Gs < 2.95){ const u = ease((Gs - 2.5) / 0.45), g0 = up(E, 0.3 * sc), g1 = [g0[0] - F[0] * 0.18, g0[1] - 0.12, g0[2] - F[1] * 0.18]; hands = [lerp3(g0, g1, u), E]; st.gf = {at:E, hang:true}; st.slo = {at:hands[0]}; }
        else if (Gs < 3.35){ const u = ease((Gs - 2.95) / 0.4), g1 = up(E, 0.42 * sc), twk = st.Of ? (LEMMER.on ? Math.min(0.3, 0.5 / Math.max(0.01, Math.hypot(st.Of[0] - sh[0], st.Of[2] - sh[2]))) : 0.3) : 0, tw = st.Of ? [sh[0] + (st.Of[0] - sh[0]) * twk, sh[1] + 0.05, sh[2] + (st.Of[2] - sh[2]) * twk] : W(0.3, 1.12, 0.32);   // (FB2: the throw ends where the arm reaches, half a metre out at most)
          hands = [lerp3([g1[0] - F[0] * 0.18, g1[1] - 0.06, g1[2] - F[1] * 0.18], tw, u), E]; st.gf = {at:E, hang:true}; if (Gs < 3.15) st.slo = {at:hands[0]}; }
        // the fish laid on the table
        else if (Gs < 3.7){ const u = ease((Gs - 3.35) / 0.35); hands = [lerp3(W(0.34, 1.05, 0.2), [mid[0] + R[0] * 0.1, mid[1] + 0.05, mid[2] + R[1] * 0.1], u), lerp3(E, [fH[0] + R[0] * 0.04, fH[1] + 0.05, fH[2] + R[1] * 0.04], u)];
          if (u < 0.5) st.gf = {at:lerp3(E, mid, u * 2), hang:u < 0.25}; else st.gf = {at:mid}; }
        // the head off behind the gill cover, at a slant: two strokes down
        else if (Gs < 4.2){ const k = Math.abs(Math.sin((Gs - 3.7) / 0.5 * Math.PI * 2)); hands = [[cutAt[0], cutAt[1] + 0.1 - k * 0.1, cutAt[2]], [mid[0] + R[0] * 0.08, mid[1] + 0.05, mid[2] + R[1] * 0.08]]; st.gf = {at:mid}; st.kdir = [-F[0] * 0.3 + R[0] * 0.25, -0.9, -F[1] * 0.3 + R[1] * 0.25]; if (st.cut) st.hd = {at:cutAt, spin:0}; }
        // the head over the side, the belly scraped clean with the knife's back
        else if (Gs < 4.55){ const u = ease((Gs - 4.2) / 0.35); hands = [lerp3(cutAt, W(0.3, 1.15, 0.3), u), [mid[0] + R[0] * 0.08, mid[1] + 0.05, mid[2] + R[1] * 0.08]]; st.gf = {at:mid};
          const O = st.Of || W(1.6, -0.2, 0.3), A0 = [cutAt[0], cutAt[1] + 0.03, cutAt[2]], v = (Gs - 4.2) / 0.6; st.hd = {at:[A0[0] + (O[0] - A0[0]) * v, A0[1] + 0.6 * 4 * v * (1 - v) - (A0[1] - O[1]) * v * v, A0[2] + (O[2] - A0[2]) * v], spin:v * 5}; }
        else if (Gs < 5.0){ const k = Math.sin((Gs - 4.55) * 26), kx = lerp3(fH, fT, 0.42 + k * 0.14); hands = [[kx[0] - F[0] * 0.03, kx[1] + 0.03, kx[2] - F[1] * 0.03], [fT[0] - R[0] * 0.05, fT[1] + 0.05, fT[2] - R[1] * 0.05]]; st.gf = {at:mid}; st.kdir = [F[0] * 0.2 + R[0] * 0.8, -0.3, F[1] * 0.2 + R[1] * 0.8];
          if (Gs < 4.8 && st.Of){ const O = st.Of, A0 = [cutAt[0], cutAt[1] + 0.03, cutAt[2]], v = (Gs - 4.2) / 0.6; st.hd = {at:[A0[0] + (O[0] - A0[0]) * v, A0[1] + 0.6 * 4 * v * (1 - v) - (A0[1] - O[1]) * v * v, A0[2] + (O[2] - A0[2]) * v], spin:v * 5}; } }
        // the fish on to the crate, and back for the next
        else { const u = ease((Gs - 5.0) / 0.6); hands = [lerp3([mid[0] + R[0] * 0.08, mid[1] + 0.05, mid[2] + R[1] * 0.08], rest[0], u), lerp3([mid[0] - R[0] * 0.12, mid[1] + 0.05, mid[2] - R[1] * 0.12], rest[1], u)];
          st.gt = {A:mid, B:end, u:clamp(u * 1.4, 0, 1)}; }
        // the guts in flight: out of the hand at the throw, over the rail and down to the water
        if (Gs >= 3.15 && Gs < 4.3 && st.Of){ const u = (Gs - 3.15) / 1.15, A0 = [sh[0] + (st.Of[0] - sh[0]) * 0.3, sh[1] + 0.05, sh[2] + (st.Of[2] - sh[2]) * 0.3]; st.slo = {at:[A0[0] + (st.Of[0] - A0[0]) * u, A0[1] + 0.5 * 4 * u * (1 - u) * (1 - u) - (A0[1] - st.Of[1]) * u * u, A0[2] + (st.Of[2] - A0[2]) * u]}; }
        // the fish is in the crate: the packer lays it straight (DKLAY, once a fish)
        if (st.packId && Gs >= 5.3){ const n = Math.floor((tOf(T, idx)) / 5.6), q = DKLAY[st.packId]; if (!q || q.n !== n + idx * 1e4){ DKLAY[st.packId] = {t:performance.now() / 1000, n:n + idx * 1e4}; } }
        break; }
      // ---- the breaks (Jonas 23.10.2026: «Husk at vi må ha animasjoner for alle handlinger og aktiviteter»; core/13-work.js idleAssign)
      // back to the rail: the arms crossed, or the elbows back on the rail
      case 'back': hands = [W(0.17, 1.18, -0.07), W(0.17, 1.16, 0.07)]; break;
      // on an upturned tub, the elbows on the knees and the hands together
      case 'sit': hands = [W(0.36, sh + 0.2, 0.05), W(0.36, sh + 0.18, -0.05)]; break;
      // talking: one tells it with a hand now and then, the other listens with the arms crossed
      case 'chat': { const k = Math.pow(Math.max(0, Math.sin(t * 1.1)), 2); hands = idx % 2 === 0 ? [W(0.22 + k * 0.12, 0.98 + k * 0.32, 0.2), W(0.04, 0.92, -0.22)] : [W(0.17, 1.18, -0.07), W(0.17, 1.16, 0.07)]; break; }
      // the knife along the honing steel, one side and then the other (the steel in the left hand, its tip up and out)
      case 'knife': { const S0 = W(0.3, 1.02, -0.06), sd = norm3([F[0] * 0.35 + R[0] * 0.25, 0.9, F[1] * 0.35 + R[1] * 0.25]), c = (t * 1.4) % 1, side = Math.floor(t * 1.4) % 2 ? 1 : -1, u = ease(c), al = 0.06 + u * 0.2;
        const kp = [S0[0] + sd[0] * al + R[0] * side * 0.025, S0[1] + sd[1] * al, S0[2] + sd[2] * al + R[1] * side * 0.025]; hands = [[kp[0] + R[0] * 0.13, kp[1] - 0.02, kp[2] + R[1] * 0.13], S0]; st.steel = {at:S0, dir:sd}; break; }
      // a packed lunch: the paper in the left hand, a slice to the mouth now and then
      case 'lunch': { const k = Math.pow(Math.max(0, Math.sin(t * 0.55)), 6); hands = st.seated ? [toFace(0, W(0.32, sh + 0.22, 0.08), 'mouth', HOLDT.food.bite, k, W(0.2, sh + 0.62, 0.03)), W(0.34, sh + 0.2, -0.1)] : [toFace(0, W(0.3, 1.08, 0.08), 'mouth', HOLDT.food.bite, k, W(0.13, 1.5, 0.03)), W(0.3, 1.03, -0.1)]; break; }
      // the phone held in both hands at the chest, a thumb at work
      case 'phone': { const k = Math.sin(t * 3.1) * 0.006; hands = [W(0.26, 1.13 + k, 0.035), W(0.26, 1.12, -0.035)]; break; }
      // the binoculars up at the eyes
      case 'binoc': { const o = [HOLDT.kikk.eye, -HOLDT.kikk.low, HOLDT.kikk.wide]; hands = [toFace(0, null, 'eye', o, 1, W(0.15, 1.56, 0.07)), toFace(1, null, 'eye', o, 1, W(0.15, 1.56, -0.07))]; break; }
      // the hands in the pockets, the head up at the sky
      case 'aurora': hands = [W(0.0, 0.93, 0.19), W(0.0, 0.93, -0.19)]; break;
      // over the rail, holding on
      case 'seasick': { const r = st.rail || [0.42, 0.96]; hands = [W(r[0] + 0.02, r[1] + 0.04, 0.24), W(r[0] + 0.02, r[1] + 0.04, -0.24)]; break; }
      // going over the gear: the hands at it, low, turning it over
      case 'gear': { const k = Math.sin(t * 1.3); hands = [W(0.45 + k * 0.04, 0.72 + Math.max(0, k) * 0.1, 0.15), W(0.45 - k * 0.04, 0.72 + Math.max(0, -k) * 0.1, -0.15)]; break; }
      // a smoke: the cigarette to the mouth every few seconds, the other hand on the rail (facing out) or in a pocket (aft, under way)
      case 'smoke': { const k = Math.pow(Math.max(0, Math.sin(t * 0.8)), 10); hands = [toFace(0, W(0.24, 1.02, 0.17), 'mouth', HOLDT.smoke.at, k, W(0.13, 1.52, 0.02)), st.lean === false || !st.rail ? W(0.0, 0.93, -0.19) : W(st.rail[0] + 0.02, st.rail[1] + 0.04, -0.2)]; st.puff = k; break; }
      // snus: the can out of the pocket, a portion under the lip, the can back; then the hands on the rail
      case 'snus': { const c = (t % 24) / 24; if (c < 0.28){ const u = ease(Math.min(1, c / 0.1)); hands = [lerp3(W(0.0, 0.95, 0.19), W(0.26, 1.13, 0.02), u), W(0.26, 1.1, -0.04)]; st.can = true; }
        else if (c < 0.4){ const u = Math.sin((c - 0.28) / 0.12 * Math.PI); hands = [toFace(0, W(0.26, 1.13, 0.02), 'mouth', HOLDT.snus.at, u, W(0.12, 1.47, 0.03)), W(0.26, 1.1, -0.04)]; st.can = true; }
        else { const r = st.rail; hands = r ? [W(r[0] + 0.02, r[1] + 0.04, 0.2), W(r[0] + 0.02, r[1] + 0.04, -0.2)] : [W(0.0, 0.95, 0.19), W(0.0, 0.95, -0.19)]; } break; }
      // a cut hand (14-crewlife.js crewSlip): the left hand up before him and shaken, the knife held away low in the right
      case 'cut': { const u = st.cutU || 0, up = ease(Math.min(1, u / 0.12)) * (1 - ease(Math.max(0, (u - 0.85) / 0.15))), sh = u > 0.12 ? Math.sin(u * 46) * 0.05 * (1 - u) : 0;
        hands = [W(0.22, 0.92, 0.3), lerp3(W(0.35, 1.0, -0.12), W(0.3, 1.22 + sh, -0.04 + sh * 0.5), up)]; break; }
      // a fish that slips: he grabs after it toward the rail (st.Rl), and a hand to his cap after
      case 'slip': { const u = st.slipU || 0, mid = W(0.32, 1.05, 0), R2 = st.Rl || W(0.7, 1.0, 0), L2 = lerp3(mid, [R2[0], R2[1] + 0.05, R2[2]], 0.75);
        const g = u < 0.16 ? 0 : u < 0.36 ? ease((u - 0.16) / 0.2) : u < 0.58 ? 1 : 1 - ease((u - 0.58) / 0.3);
        hands = [lerp3(W(0.32, 1.05, 0.09), [L2[0] + R[0] * 0.08, L2[1], L2[2] + R[1] * 0.08], g), lerp3(W(0.32, 1.05, -0.09), [L2[0] - R[0] * 0.08, L2[1], L2[2] - R[1] * 0.08], g)];
        if (u > 0.62){ const c = ease(Math.min(1, (u - 0.62) / 0.14)) * (1 - ease(Math.max(0, (u - 0.88) / 0.12))); hands[0] = lerp3(hands[0], W(0.06, 1.72, 0.1), c); } break; }
      // at the door: a hand out to it before going in
      case 'door': hands = [W(0.38, 1.05, 0.16), W(0.0, 0.82, -0.22)]; break;
      default: { const hy = near ? 0.76 : 0.82; hands = [W(-sw * 0.15, hy, 0.26), W(sw * 0.15, hy, -0.26)]; seaH = 3; }
    }
    // the sea legs: the hands that are his body's own go with it as it leans; a free hand takes the rail when she rolls (SE.grab), on
    // its top as in «lean», where the deck has it now
    let seaG = -1;
    if (SE){ if (!st.ev && !st.fx) for (const i of [0, 1]) if (seaH & (i + 1)) up3(hands[i]);
      if (SE.grab > 0 && SE.rail){ const rl = SE.rail, i = SE.gh, ra = rl[0], rr = rl[1] || (i ? -0.2 : 0.2); hands[i] = lerp3(hands[i], W(ra, rl[2] + 0.04 + ra * SE.sf + rr * SE.sr, rr), SE.grab); if (SE.grab > 0.6) seaG = i; } }
    // the break's thing put away before the walk to work (deckcrew.js a.put): the last of it (a sip, a draw), the hand to the pocket
    // (the binoculars to the chest, the butt over the side) and it is gone (st.gone), then the hands down
    if (st.put){ const u = st.put.u, ph = st.put.task, hy = near ? 0.76 : 0.82, fin = u < 0.35 ? Math.sin(u / 0.35 * Math.PI) : 0, go = ease(clamp((u - 0.35) / 0.4, 0, 1)), back = ease(clamp((u - 0.8) / 0.2, 0, 1));
      if (ph === 'coffee' || ph === 'smoke') hands[0] = lerp3(hands[0], W(0.13, 1.5, 0.03), fin);
      const dest = i => ph === 'binoc' ? W(0.14, 1.3, i ? -0.06 : 0.06) : ph === 'phone' ? (i ? W(0.1, 1.0, 0.1) : W(0.05, 0.98, 0.2)) : ph === 'smoke' ? W(0.5, 1.05, 0.28) : i ? W(0.02, 0.98, -0.21) : W(0.02, 0.98, 0.21);
      for (const i of ph === 'phone' || ph === 'binoc' ? [0, 1] : ph === 'lunch' || ph === 'snus' ? [1] : [0]) hands[i] = lerp3(hands[i], dest(i), go);
      if (back > 0){ const rest = [W(0, hy, 0.26), W(0, hy, -0.26)]; for (const i of [0, 1]) hands[i] = lerp3(hands[i], rest[i], back); }
      st.gone = u >= 0.78; }
    // ---- the legs, the torso, the head and the arms (FB2, steg 123; deckcrew.js LEMMER, ik2, armIk, reachBody, legDrop): the hands
    // and the feet are where the work has them, and the joints are found from them with the limbs' own lengths. IK off («#ik0»): the
    // knee and the elbow at the middle pushed out, the limbs stretched between the points, as before.
    const IK = LEMMER.on, LL = limbLen(FG ? FG.sex : st), back = st.task === 'back' && !st.walk, LEG = [null, null];
    for (const s of [-1, 1]){ const fi = s < 0 ? 0 : 1;
      // (back to the rail with the legs crossed: the feet a little out, the right one over in front of the left)
      let fa = back ? (s > 0 ? 0.3 : 0.2) : sw * s * 0.28, fr = back ? (s > 0 ? -0.05 : -0.13) : s * 0.12, fup = 0.08 + (back ? 0 : Math.max(0, Math.cos(ph) * s) * 0.07 * (st.walk ? 1 : 0)), kf = back ? 0.05 : 0.07 + dip * 0.34;
      let hip = W((back ? 0.05 : dip * 0.06) + hF, 0.92 + dy + hy0 + (SE ? s * 0.11 * SE.pelv : 0), s * 0.11 + hR), foot;
      if (SE){ const d0 = Math.hypot(0.84 + dy - (fup - 0.08), (back ? 0.05 : dip * 0.06) - fa, s * 0.11 - fr);   // (the leg's length without the sea)
        if (!back){ fa += SE.fa[fi]; fr = SE.fr[fi]; fup += SE.lift[fi]; }
        foot = W(fa, fup + fa * SE.sf + fr * SE.sr, fr); kf = Math.max(0.02, kf + seaKnee(d0, Math.hypot(hip[0] - foot[0], hip[1] - foot[1], hip[2] - foot[2]))); }
      else foot = W(fa, fup, fr);
      let knee = [(hip[0] + foot[0]) / 2 + F[0] * kf, (hip[1] + foot[1]) / 2 + (back ? 0.02 : dip * 0.05), (hip[2] + foot[2]) / 2 + F[1] * kf];
      // (sitting, LB[2]: on a low seat, the thighs out level and the shins down to the deck; the seat is drawn with the props)
      if (sit){ hip = W(-0.04, sh, s * 0.12); knee = W(0.38, sh + 0.02, s * 0.15); foot = W(0.44, sh - 0.42, s * 0.17); }
      LEG[fi] = {hip, knee, foot, kf, over:0}; }
    // (the hips come down until both feet are within the legs' reach: the stride, the feet out leaning back, a foot put out to brace;
    // the knees from the solver, ahead (up and ahead seated), and a foot still out of reach is moved in)
    let drop = 0;
    if (IK){ if (!sit){ drop = legDrop([LEG[0].hip, LEG[1].hip], [LEG[0].foot, LEG[1].foot], LL); if (drop > 0) for (const g of LEG) g.hip[1] -= drop; }
      const kp = sit ? [F[0] * 0.3, 1, F[1] * 0.3] : [F[0] * LEMMER.KNEE[0], LEMMER.KNEE[1], F[1] * LEMMER.KNEE[0]];
      for (const g of LEG){ const o = ik2(g.hip, g.foot, LL.th, LL.sn, kp); g.knee = o.j; g.foot = o.e; g.over = o.over; g.kf = (o.j[0] - (g.hip[0] + o.e[0]) / 2) * F[0] + (o.j[2] - (g.hip[2] + o.e[2]) / 2) * F[1]; }
      // (the hands that are his body's own come down with it)
      if (drop > 0) for (const i of [0, 1]) if ((seaH | faceH) & (i + 1)) hands[i][1] -= drop; }
    for (const g of LEG){ const hip = g.hip, knee = g.knee, foot = g.foot;
      if (LG){ LG.feet.push([foot[0] + eye[0], foot[1] - 0.08 + eye[1], foot[2] + eye[2]]); LG.hips.push([hip[0] + eye[0], hip[1] + eye[1], hip[2] + eye[2]]); LG.kf.push(g.kf); }
      // (on a deck at sea the boot is flat on the deck; its sole is 8 cm under the ankle along the deck's normal)
      const BT = g.BT = SE && st.dn ? bootM([foot[0] + st.dn[0] * 0.08, foot[1] - 0.08 + st.dn[1] * 0.08, foot[2] + st.dn[2] * 0.08], h, st.dn) : chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h));
      if (FG){ if (!(SE && st.dn)) g.BT = null; continue; }
      if (K){ drawN(K.thigh, limbM(hip, knee, 1)); drawN(K.shin, limbM(knee, foot, 1)); drawN(K.boot, BT); continue; }
      drawN(PM.leg, limbM(hip, knee, 0.075)); drawN(PM.leg, limbM(knee, foot, 0.065)); drawN(PM.boot, BT); }
    const bend = bend0, dyq = dy - drop;   // (and stoop)
    const LM = SE ? leanM(h, SE.leanR, SE.leanF) : null, tc = W(bend * 0.4, 1.2 + dyq, 0); if (SE){ tc[0] += ox; tc[1] += hy0; tc[2] += oz; }
    // the hands (tools/harbour/hender.py; Jonas 23.10.2026: «Det er også viktig hvordan objekter holdes med hendene for realismen»):
    // each in the grip its work takes, the palm turned the way the work turns it; the pose's point is where the hand holds (its grip),
    // the wrist is found back from it, and what the hand holds is drawn in the grip (GP, GA). Far off (and on the old figure) the one-piece
    // glove at the wrist as before.
    const HS = near ? handSpecs(st, F, R, hands) : null, GP = [hands[0], hands[1]], GA = [null, null];
    if (HS && seaG >= 0) HS[seaG] = {g:'flat', n:[0, -1, 0]};   // (the hand on the rail, flat on its top)
    const vsh = !FG && K && K.vest ? VEST_SH : null;   // (the shoulder under the life jacket, vessel3d.js VEST_SH)
    // the hips' frame (ahead, up and to his right; with the sea's lean) and the torso's in it: a point of the torso [ahead, up, right]
    // from the hips is bent bT over and turned tw (deckcrew.js torsoPt), as the torso's own matrix TM
    const pv = [tc[0], tc[1] - 0.28, tc[2]], HA = [F[0], 0, F[1]], HU = [0, 1, 0], HR = [R[0], 0, R[1]];
    if (LM) for (const v of [HA, HU, HR]){ const x = v[0], yy = v[1], z = v[2]; v[0] = LM[0] * x + LM[4] * yy + LM[8] * z; v[1] = LM[1] * x + LM[5] * yy + LM[9] * z; v[2] = LM[2] * x + LM[6] * yy + LM[10] * z; }
    const toH = q => { const x = q[0] - pv[0], yy = q[1] - pv[1], z = q[2] - pv[2]; return [x * HA[0] + yy * HA[1] + z * HA[2], x * HU[0] + yy * HU[1] + z * HU[2], x * HR[0] + yy * HR[1] + z * HR[2]]; };
    const ofH = l => [pv[0] + HA[0] * l[0] + HU[0] * l[1] + HR[0] * l[2], pv[1] + HA[1] * l[0] + HU[1] * l[1] + HR[1] * l[2], pv[2] + HA[2] * l[0] + HU[2] * l[1] + HR[2] * l[2]];
    const SHL = [0, 1].map(i => [FG ? FG.len.shA : 0, LEMMER.SH[0] - (vsh ? vsh[1] : 0), (i ? -1 : 1) * (LEMMER.SH[1] + (vsh ? vsh[0] : 0))]), reach = (LL.ua + LL.fa) * LEMMER.REACH;
    // (the wrist a hand's grip asks for, with the forearm as it comes from the shoulder s and the elbow el)
    // (the wrist for a hand pointing z: back from the grip's point in the hand's frame Fr; far off, the one-piece glove: a hand's
    // length back along it)
    const wristFor = (i, z) => { if (!near) return [sub3(hands[i], mul3(z, LEMMER.HAND)), null]; const sp = HS[i], gd = (GRIP[sp.g] || GRIP.relax)[i ? 'L' : 'R'], Fr = handFrame(z, sp, i ? -1 : 1); return [sub3(hands[i], inFrame(Fr, gd.at)), Fr]; };
    // (the way a hand points: along the forearm, from the elbow el to the wrist wr. A grip round a handle or flat on something turns
    // the hand square to it, and with the forearm along the handle there is no such way to find in it: then along the line from the
    // shoulder s, as the hand lay before)
    const handDir = (i, s, el, wr) => { const f = nrm3(sub3(wr, el)); if (!near) return f; const sp = HS[i], ax = sp.a ? nrm3(sp.a) : sp.g === 'flat' && sp.n ? nrm3(sp.n) : null; if (!ax) return f;
      const k = dot3(f, ax), c = Math.sqrt(Math.max(0, 1 - k * k)), u = clamp((c - 0.3) / 0.45, 0, 1), mu = u * u * (3 - 2 * u); if (mu >= 1) return f; const g = nrm3(sub3(wr, s)); return nrm3(add3(mul3(f, mu), mul3(g, 1 - mu))); };
    // the body goes after the hands: the wrists as they would be from where the shoulders are now, and how much further the back
    // must bend and the torso turn for the arms to reach them (reachBody)
    // ---- what he holds close is put clear of his own trunk before the hands are solved, and the hands are where the thing has its
    // grips (rules 10 and 7 of «Arkitekturen for bevegelsen»; Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe inn i
    // menneskene»; deckcrew.js HOLDT). The trunk is its profile on the mesh that is drawn (FG.prof), in the torso's frame as it is bent
    // b and turned t2. A thing is moved straight ahead of him by what it lacks; a shaft is turned about its far end.
    const holdClear = IK && FG && FG.prof && !st.gone ? (b, t2) => {
      const PF = FG.prof, H = HOLDT, inT = q => torsoInv(toH(q), b, t2), AH = sub3(ofH(torsoPt([1, 0, 0], b, t2)), ofH(torsoPt([0, 0, 0], b, t2)));
      // (m a point lacks of being clear: rad its thing's half depth there, sp how far to either side and up and down the thing reaches)
      const lack = (q, rad, sp, gap) => { const l = inT(q); if (l[0] < -0.03 && l[0] < -figProfAt(PF, l[1], l[2], true)) return 0; let f = 0;   /* (behind his back: not his front's matter) */ for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++){ const v = figProfAt(PF, l[1] + k * sp, l[2] + j * sp); if (v > f) f = v; } return f > 0 ? Math.max(0, f + (gap == null ? H.GAP : gap) + rad - l[0]) : 0; };
      // (and of being clear of his legs, the thighs and the shins as rounded rods from the joints the legs were solved to: [m, the way out])
      const legOut = (q, rad) => { let best = null; for (const g of LEG) for (const [a, b2, r] of [[g.hip, g.knee, H.LEG[0]], [g.knee, g.foot, H.LEG[1]]]){ const ab = sub3(b2, a), t = clamp(dot3(sub3(q, a), ab) / (dot3(ab, ab) || 1e-9), 0, 1), v = sub3(q, add3(a, mul3(ab, t))), l = Math.hypot(v[0], v[1], v[2]), d = r + rad + H.GAP - l;
        if (d > 0 && (!best || d > best[0])) best = [d, l > 1e-6 ? mul3(v, 1 / l) : [HA[0], HA[1], HA[2]]]; } return best; };
      const mv = (q, d) => { q[0] += AH[0] * d; q[1] += AH[1] * d; q[2] += AH[2] * d; }, mid = () => [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2, (hands[0][2] + hands[1][2]) / 2];
      // (a hand at the face: where the face is with the back bent as it is now)
      for (const i of [0, 1]) if (FQ[i]){ const q = FQ[i], A = ofH(torsoPt(q.l, b, 0)); hands[i] = q.low ? lerp3([q.low[0], q.low[1] - drop, q.low[2]], A, q.k) : A; }
      switch (st.task){
        // (the fish box across him: its near side over its height and its length)
        case 'carry': case 'stack': case 'stow': { const c = mid(), B = H.box; let d = 0;
          for (const u of [B.lo, (B.lo + B.hi) / 2, B.hi]) for (const r of [-1, -0.5, 0, 0.5, 1]) d = Math.max(d, lack([c[0] - HA[0] * B.grip[1] + HR[0] * r * B.half, c[1] + u, c[2] - HA[2] * B.grip[1] + HR[2] * r * B.half], B.depth, 0.03, B.gap));
          if (d > 0){ if (st.task !== 'carry') d = Math.min(d, B.most); mv(hands[0], d); mv(hands[1], d); } break; }   // (no further than his arms hold it: he does not chase it with his back)
        // (the shovel: the fist at the shaft's upper end and the shaft down from it; the blade is where the ice is)
        case 'pack': case 'ice': { if (!st.blade || !st.shP) break; const B = st.blade, S = H.shaft; { const d = lack(B, H.blade.r, 0.08); if (d > 0) mv(B, d); }
          // (the blade keeps out of the room his legs have: its socket is moved straight out from under his hips)
          { const l = toH(B), Lg = H.blade.legs, v = (l[0] / Lg[0]) ** 2 + (l[2] / Lg[1]) ** 2; if (l[1] < 0.05 && l[0] > -0.1 && v < 1){ const k = 1 / Math.sqrt(Math.max(v, 0.04)) - 1, da = l[0] * k, ds = l[2] * k; B[0] += HA[0] * da + HR[0] * ds; B[1] += HA[1] * da + HR[1] * ds; B[2] += HA[2] * da + HR[2] * ds; } }
          // (the stiff shovel is turned about the blade: where its upper hand would be is moved out until the fists and the shaft are clear)
          const P0 = st.shP.slice(); let hs = shovelAt(B, P0);
          for (let n = 0; n < 7; n++){ const G = hs[1], u = nrm3(sub3(B, G)); let d = Math.max(lack(G, H.FIST, 0.02), lack(hs[0], H.FIST, 0.02)), any = d > 0;
            for (const s of S.at) d = Math.max(d, lack(add3(G, mul3(u, s)), S.r, 0.01)); if (d > 0){ any = true; mv(P0, d); }
            // (and off his thighs: the shaft is pushed the way out of the leg, by the lever from the blade)
            for (const s of [S.low, S.len * 0.5, S.len * 0.68, S.len * 0.85]){ const o = legOut(add3(G, mul3(u, s)), s === S.low ? H.FIST : S.r); if (!o) continue; any = true; const k = o[0] * Math.min(4, S.len / (S.len - s)); P0[0] += o[1][0] * k; P0[1] += o[1][1] * k; P0[2] += o[1][2] * k; }
            if (!any) break; hs = shovelAt(B, P0); }
          hands[0] = hs[0]; hands[1] = hs[1]; break; }
        // (the gutter's fish, hanging from his left hand on its way from the tub and held at the table's edge: it and the hand that
        // works on it are moved out until it is clear of his belly and his thighs)
        case 'gutw': { if (!st.gf) break; if (!st.gf.hang){ const d = lack(st.gf.at, H.fish.r * 1.4, 0.06); if (d > 0) mv(st.gf.at, d); break; }   /* (lying, on its way to the table: carried round him) */
          const Fi = H.fish, sc = st.gsc || 0.46, len = 0.9 * sc, rad = Fi.r * sc / 0.46, A = st.gf.at; let d = 0;
          for (const s of Fi.at){ const q = [A[0], A[1] - len * s, A[2]]; d = Math.max(d, lack(q, rad, 0.03)); const o = legOut(q, rad); if (o) d = Math.max(d, o[0]); }
          if (d > 0){ mv(A, d); if (A !== hands[1]) mv(hands[1], d); if (st.knife || st.slo) mv(hands[0], d); } break; }
        // (the gaff: turned about its tip until its hands and its butt are clear)
        case 'gaff': { if (!st.gaff) break; const Gf = H.gaff, tip = st.gaff.tip; let g = st.gaff.g.slice(), n = st.gaff.n;
          for (let it = 0; it < 3; it++){ let d = 0; for (const [s, r] of [[Gf.grip[0], H.FIST], [(Gf.grip[0] + Gf.grip[1]) / 2, Gf.r], [Gf.grip[1], H.FIST], [Gf.butt, Gf.r]]) d = Math.max(d, lack(sub3(tip, mul3(n, s)), r, 0.02) * Gf.org / s);
            if (d <= 0) break; mv(g, d); n = nrm3(sub3(tip, g)); g = sub3(tip, mul3(n, Gf.org)); }
          st.gaff = {g, n, tip}; hands[0] = sub3(tip, mul3(n, Gf.grip[1])); hands[1] = sub3(tip, mul3(n, Gf.grip[0])); break; }   // (the right hand the back one, by the hip)
        case 'coffee': { const d = lack(hands[0], H.cup.r, 0.03); if (d > 0) mv(hands[0], d); break; }
        case 'lunch': for (const q of hands){ const d = lack(q, H.food.r, 0.03); if (d > 0) mv(q, d); } break;
        case 'smoke': { const d = lack(hands[0], H.FIST, 0.02); if (d > 0) mv(hands[0], d); break; }
        case 'phone': case 'binoc': case 'tally': case 'remote': { const d = lack(mid(), (H[st.task] || H.phone).r, 0.04); if (d > 0){ mv(hands[0], d); mv(hands[1], d); } break; }
      }
      // (and a hand's own point is never in the trunk: laid on it at the nearest)
      for (const q of hands){ const l = inT(q); if (Math.abs(l[2]) > 0.65 * (PF.half[Math.floor((l[1] - PF.lo) / PF.dy)] || 0)) continue;   // (a hand by his side is the elbow's and the wrist's own matter, armIk)
        const d = lack(q, H.HAND, 0, 0); if (d > 0) mv(q, d); }
      // (nor its wrist, which is a hand's length back from the point towards the shoulder: the hand is moved out until the wrist is
      // clear, so the arm is solved to a point it can hold and what the hand holds is where the hand is)
      for (const i of [0, 1]) for (let n = 0; n < 3; n++){ const q = hands[i], s0 = ofH(torsoPt(SHL[i], b, t2)), w = wristFor(i, nrm3(sub3(q, s0)))[0], l = inT(w);
        const d = lack(w, LEMMER.WRIST, 0.02, 0.02); if (d <= 0 || (PF.half[Math.floor((l[1] - PF.lo) / PF.dy)] || 0) + LEMMER.WRIST - Math.abs(l[2]) < d) break; mv(q, d); }   // (nearer out to his side than ahead: the arm's own matter, armIk)
    } : null;
    let bT = bend, tw = 0, RB = null;
    if (IK) for (let ps = 0; ps < (holdClear ? 2 : 1); ps++){ if (holdClear) holdClear(bT, tw);
      const w0 = [0, 1].map(i => { const s0 = ofH(torsoPt(SHL[i], bend, 0)); return toH(wristFor(i, nrm3(sub3(hands[i], s0)))[0]); });
      // (the new people: a hand that reaches across him turns the torso after it first, the shoulder ahead, and the reach is found from there)
      let twX = 0; if (FG) for (const i of [0, 1]){ const x = -w0[i][2] * (i ? -1 : 1) - LEMMER.CROSS[0]; if (x > 0 && w0[i][0] > -0.25) twX += (i ? 1 : -1) * x * LEMMER.CROSS[1]; }
      twX = clamp(twX, -LEMMER.TWIST, LEMMER.TWIST);
      RB = reachBody(SHL, twX ? w0.map(q => torsoInv(q, 0, twX)) : w0, reach, bend); bT = bend + RB.b; tw = clamp(twX + RB.t, -LEMMER.TWIST, LEMMER.TWIST); }
    const TA = torsoPt([1, 0, 0], bT, tw), TU = torsoPt([0, 1, 0], bT, tw), TR = torsoPt([0, 0, 1], bT, tw), wv = l => [HA[0] * l[0] + HU[0] * l[1] + HR[0] * l[2], HA[1] * l[0] + HU[1] * l[1] + HR[1] * l[2], HA[2] * l[0] + HU[2] * l[1] + HR[2] * l[2]];
    const XA = wv(TA), XU = wv(TU), XR = wv(TR), toT = q => { const x = q[0] - pv[0], yy = q[1] - pv[1], z = q[2] - pv[2]; return [x * XA[0] + yy * XA[1] + z * XA[2], x * XU[0] + yy * XU[1] + z * XU[2], x * XR[0] + yy * XR[1] + z * XR[2]]; };
    const ofT = l => [pv[0] + XA[0] * l[0] + XU[0] * l[1] + XR[0] * l[2], pv[1] + XA[1] * l[0] + XU[1] * l[1] + XR[1] * l[2], pv[2] + XA[2] * l[0] + XU[2] * l[1] + XR[2] * l[2]];
    // (the torso's mesh: x to his right, y up along the spine, z back)
    const TM = new Float32Array([XR[0], XR[1], XR[2], 0, XU[0], XU[1], XU[2], 0, -XA[0], -XA[1], -XA[2], 0, pv[0], pv[1], pv[2], 1]); if (!FG) drawN(K ? K.torso : PM.torso, TM);
    if (!FG && K && K.vest) drawN(K.vest, TM);   // the life jacket over the jacket, on deck at sea (vessel3d.js vestKit, Ø11.5)
    // the head: looking about when idle, and at you when you bring the camera close in front of him (deckcrew agents, st.peek)
    let hy = st.task === 'look' ? Math.sin(T * 0.4 + idx) * 0.5 : 0;
    if (st.peek && !(LEMMER.on && (HOLDT.eyes[st.task] || (st.sip || 0) > 0.2 || (st.task === 'smoke' && st.puff > 0.2)))){ const ex = eye[0] - st.x, ez = eye[2] - st.z, d = Math.hypot(ex, ez); if (d < 7){ let dh = Math.atan2(ex, -ez) - h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; if (Math.abs(dh) < 1.3) hy = -dh * 0.85 * Math.min(1, (7 - d) / 2); } }
    // the head's pitch by what he does (down at the phone, the knife, over the rail; up at the northern lights), and a slow turn talking or
    // scanning with the binoculars
    if (st.task !== 'coffee') st.sip = 0;
    const HP = {sweep:LEMMER.on ? -0.3 : 0, cold:-0.16, phone:-0.5, knife:-0.4, seasick:-0.6, lunch:-0.12, gear:-0.35, sit:-0.12, snus:-0.08, aurora:0.6, binoc:0.04, cut:-0.5, slip:-0.25};
    // (the tired look down, st.slump)
    const hp = (HP[st.task] || 0) - (st.slump || 0) * 0.5; if (st.task === 'chat') hy += Math.sin(T * 0.7 + idx) * 0.12; if (st.task === 'aurora') hy += Math.sin(T * 0.15 + idx) * 0.4; if (st.task === 'binoc') hy += Math.sin(T * 0.22 + idx) * 0.25;
    // (the head goes with the back when it bends further for a hand; it does not turn with the torso)
    let hd = up3(W(bend, 1.6 + dyq, 0)); if (RB && RB.b){ const l = toH(hd), c = Math.cos(RB.b), sn = Math.sin(RB.b); hd = ofH([l[0] * c + l[1] * sn, -l[0] * sn + l[1] * c, l[2]]); }
    const HM = chain(M4.T(hd[0], hd[1] - 0.1, hd[2]), M4.RY(-h + hy), M4.RX(hp));
    if (FG){} else if (K){ drawN(K.head, HM); for (const m of [hooded && HOODOFF[lk.hs] ? null : K.hair, K.beard, K.hat]) if (m) drawN(m, HM); if (hooded){ let HD = HOODK.get(K); if (HD === undefined){ const kc = wkKitOf(lk); HD = kc && kc.top ? hoodOf(kc.top) : null; if (HD) HD.wear = true; HOODK.set(K, HD); } if (HD) drawN(HD, HM); } } else drawN(P.bare ? PM.headB : PM.head, HM);
    const LQ = LEMMER.log ? {idx, task:st.task || null, walk:!!st.walk, ev:!!(st.ev || st.fx), put:!!st.put, deck:!!st.deck, sea:!!SE, sit:!!sit, near, on:IK, L:LL, at:[st.x - eye[0], y - eye[1], st.z - eye[2]], h, rail:st.rail || null, b:RB ? RB.b : 0, t:RB ? RB.t : 0, drop, hip:LEG.map(g => g.hip.slice()), knee:LEG.map(g => g.knee.slice()), foot:LEG.map(g => g.foot.slice()), kf:LEG.map(g => g.kf), lo:LEG.map(g => g.over),
      sh:[], el:[], wr:[], elT:[], tg:[hands[0].slice(), hands[1].slice()], gp:[], ao:[0, 0], ov:[null, null], T, gl:[0, 0], wrT:[null, null]} : null;
    const AO = [0, 0], ARM = [null, null];   // (m each hand is short of its point: the arm at its reach, with the body gone after it)
    LEMMER.prof = IK && FG ? FG.prof : null;   // (the wrists keep clear of this figure's own trunk, armIk)
    [0.21, -0.21].forEach((r, i) => { const sd = i ? -1 : 1; let sh, el, wr, Fr = null, zh = null;
      if (IK){ sh = ofT(SHL[i]); const cl = vsh ? vsh[2] : 0; let z = nrm3(sub3(hands[i], sh)), o = null, wf;
        // (the hand turned towards where the forearm comes from, a few rounds; then the wrist from the hand as it is turned and the
        // elbow from the wrist, so the grip is at its point whenever the arm reaches)
        for (let n = 0; n < 4; n++){ wf = wristFor(i, z); o = armIk(SHL[i], toT(wf[0]), sd, LL, o, cl); if (n === 3 || o.over > 0) break; const z2 = handDir(i, sh, ofT(o.j), ofT(o.e)), dz = sub3(z2, z); if (Math.abs(dz[0]) + Math.abs(dz[1]) + Math.abs(dz[2]) < 0.01) break;
          z = nrm3(add3(z, mul3(dz, 0.8))); wf = null; }
        if (!wf){ wf = wristFor(i, z); o = armIk(SHL[i], toT(wf[0]), sd, LL, o, cl); }
        el = ofT(o.j); wr = ofT(o.e); Fr = wf[1]; zh = z; AO[i] = Math.hypot(o.over, o.near, o.push); if (LQ){ LQ.ao[i] = AO[i]; LQ.ov[i] = [o.over, o.near, o.push].concat(o.push > 0 && o.dbg ? o.dbg : []); LQ.elT.push(o.j.slice()); LQ.wrT[i] = o.e.slice(); } }
      else { sh = up3(vsh ? W(bend * 0.8, 1.42 + dy - vsh[1], r + Math.sign(r) * vsh[0]) : W(bend * 0.8, 1.42 + dy, r)); const eo = r * 0.25 + (vsh ? Math.sign(r) * vsh[2] : 0), elOf = q => [(sh[0] + q[0]) / 2 - F[0] * 0.05 + R[0] * eo, (sh[1] + q[1]) / 2 - 0.08, (sh[2] + q[2]) / 2 - F[1] * 0.05 + R[1] * eo];
        if (near){ const gd = (GRIP[HS[i].g] || GRIP.relax)[i ? 'L' : 'R']; Fr = handFrame(nrm3(sub3(hands[i], elOf(hands[i]))), HS[i], sd); wr = sub3(hands[i], inFrame(Fr, gd.at)); el = elOf(wr); } else { wr = hands[i]; el = elOf(wr); }
        if (LQ) LQ.elT.push(toT(el)); }
      if (LQ){ LQ.sh.push(sh.slice()); LQ.el.push(el.slice()); LQ.wr.push(wr.slice()); }
      ARM[i] = {sh, el, wr, Fr:null};
      if (near){ const sn = i ? 'L' : 'R', sp = HS[i], gd = (GRIP[sp.g] || GRIP.relax)[sn];
        if (!IK) Fr = handFrame(nrm3(sub3(wr, el)), sp, sd);
        ARM[i].Fr = Fr; if (!FG){ drawN(K.uarm, limbM(sh, el, 1)); drawN(K.farm, limbM(el, wr, 1)); drawN(HMS[sn][sp.g] || HMS[sn].relax, handMtx(Fr, wr)); }
        if (i && st.tape && HMS.tape) drawN(HMS.tape, handMtx(Fr, wr));   // (a cut hand taped, the four hours it is slow)
        if (i && HMS.steel && steelGlove(st, !!P.bare)){ const sm = HMS.steel[sp.g] || HMS.steel.relax; if (sm){ drawN(sm, chain(handMtx(Fr, wr), M4.S(1.07))); DKN.glove = (DKN.glove || 0) + 1; } }   // (the steel glove, OPP5)
        GP[i] = add3(wr, inFrame(Fr, gd.at)); GA[i] = inFrame(Fr, gd.ax); if (LQ) LQ.gl[i] = Math.hypot(gd.at[0], gd.at[1], gd.at[2]); return; }
      if (IK) GP[i] = add3(wr, mul3(zh, LEMMER.HAND));   // (where the far hand holds: along the way its wrist was found from)
      if (FG) return;
      if (K){ const f = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1;
        drawN(K.uarm, limbM(sh, el, 1)); drawN(K.farm, limbM(el, wr, 1)); drawN(HMS ? HMS.lo : K.hand, limbM(wr, [wr[0] + f[0] / fl, wr[1] + f[1] / fl, wr[2] + f[2] / fl], 1)); return; }
      drawN(PM.arm, limbM(sh, el, 0.06)); drawN(PM.arm, limbM(el, wr, 0.055)); drawN(PM.hand, M4.T(wr[0], wr[1], wr[2])); });
    LEMMER.prof = null;
    // ---- the new figure (FB7): the joints above in his own frame (x to his right, y up, z back, from where he stands), turned into
    // the skeleton's turns (figpose.js figFromJoints) and drawn skinned, one draw call (two or three with a small palette). The arms
    // and the legs are solved again there from the skeleton's own shoulders and hips, so what the hands hold is moved to where the
    // wrists came out (a few mm when the arm reaches), and the tests get the joints as they were drawn.
    if (FG){ const O = rel(st.x, y, st.z), tf = v => [v[0] * R[0] + v[2] * R[1], v[1], -(v[0] * F[0] + v[2] * F[1])], tp = q => tf([q[0] - O[0], q[1] - O[1], q[2] - O[2]]), fw = l => [O[0] + R[0] * l[0] - F[0] * l[2], O[1] + l[1], O[2] + R[1] * l[0] - F[1] * l[2]];
      const arm = i => { const a = ARM[i]; return {el:tp(a.el), wr:tp(a.wr), sh:tp(a.sh), hand:a.Fr ? figHandTurn(FG.H0[i], tf(a.Fr[0]), tf(a.Fr[1]), tf(a.Fr[2])) : null}; };
      const leg = g => ({knee:tp(g.knee), foot:tp(g.foot), footR:g.BT ? figCols(tf([g.BT[0], g.BT[1], g.BT[2]]), tf([g.BT[4], g.BT[5], g.BT[6]]), tf([g.BT[8], g.BT[9], g.BT[10]])) : null});
      const J = {pelvis:tp(pv), hipsR:figCols(tf(HR), tf(HU), tf([-HA[0], -HA[1], -HA[2]])), chestR:figCols(tf(XR), tf(XU), tf([-XA[0], -XA[1], -XA[2]])), headR:figMul3(figRot([0, 1, 0], hy * 180 / Math.PI), figRot([1, 0, 0], hp * 180 / Math.PI)),
        arms:{R:arm(0), L:arm(1)}, legs:{L:leg(LEG[0]), R:leg(LEG[1])}};
      const o = figFromJoints(FG.sk, J); for (const i of [0, 1]) figGrip(FG.ex, FG.sex, near && HS[i] ? HS[i].g : 'relax', o.local, i ? 'L' : 'R');
      const PZ = figPose(FG.sk, o.local, o.root), UM = chain(M4.T(O[0], O[1], O[2]), M4.RY(-h));
      if (!LEMMER.dry) drawFig(FG, PZ.M, UM);
      // (the hood up in the cold: the old file's part, on the new head; its frame is from the old neck, 7.5 cm under the head's joint)
      if (hooded && !LEMMER.dry){ let HD = HOODK.get(K); if (HD === undefined){ const kc = wkKitOf(lk); HD = kc && kc.top ? hoodOf(kc.top) : null; if (HD) HD.wear = true; HOODK.set(K, HD); }
        if (HD){ const b = FG.sk.ix.head, Rh = PZ.R[b], hj = [PZ.J[b * 3], PZ.J[b * 3 + 1] - 0.075, PZ.J[b * 3 + 2]]; drawN(HD, chain(UM, new Float32Array([Rh[0], Rh[3], Rh[6], 0, Rh[1], Rh[4], Rh[7], 0, Rh[2], Rh[5], Rh[8], 0, hj[0], hj[1], hj[2], 1]))); } }
      [0, 1].forEach(i => { const sd = i ? 'L' : 'R', w = fw(o.out.wr[sd]), d = sub3(w, ARM[i].wr); GP[i] = add3(GP[i], d); AO[i] = Math.max(AO[i], Math.hypot(d[0], d[1], d[2]) > 0.002 ? Math.hypot(d[0], d[1], d[2]) : 0);
        if (LQ){ LQ.fo = LQ.fo || [0, 0]; LQ.fo[i] = Math.hypot(d[0], d[1], d[2]); LQ.ao[i] = AO[i]; LQ.sh[i] = fw(o.out.sh[sd]); LQ.el[i] = fw(o.out.el[sd]); LQ.wr[i] = w; LQ.elT[i] = toT(LQ.el[i]); } });
      if (LEMMER.bodies){ const jw = n => { const b = FG.sk.ix[n]; return fw([PZ.J[b * 3], PZ.J[b * 3 + 1], PZ.J[b * 3 + 2]]).map((v, k) => v + eye[k]); }, B = {i:idx, task:st.task || (st.walk ? 'gå' : 'står'), walk:!!st.walk, sit:!!sit, J:{}, P:FG.prof, sk:FG.sk, hd:null};
        if (FG.head){ const hb = FG.sk.ix.head, Rh = PZ.R[hb], fv = l => [R[0] * l[0] - F[0] * l[2], l[1], R[1] * l[0] - F[1] * l[2]]; B.hd = {H:FG.head, O:jw('head'), ax:[0, 1, 2].map(j => fv([Rh[j], Rh[3 + j], Rh[6 + j]]))}; }
        for (const n of ['hips', 'spine3', 'neck', 'head', 'uarm_R', 'farm_R', 'uarm_L', 'farm_L', 'thigh_R', 'shin_R', 'foot_R', 'thigh_L', 'shin_L', 'foot_L']) B.J[n] = jw(n); LEMMER.bodies.push(B); }
      if (LQ){ LQ.fig = 1; LQ.hip = [fw(o.out.hip.L), fw(o.out.hip.R)]; LQ.knee = [fw(o.out.knee.L), fw(o.out.knee.R)]; LQ.foot = [fw(o.out.foot.L), fw(o.out.foot.R)]; } }
    if (LQ){ LQ.gp = [GP[0].slice(), GP[1].slice()]; LEMMER.log.push(LQ); }
    // (a hand that did not reach its point: what it holds is drawn where the hand is)
    for (const i of [0, 1]) if (AO[i] > 0){ hands[i][0] = GP[i][0]; hands[i][1] = GP[i][1]; hands[i][2] = GP[i][2]; }
    // (the tests: what was drawn, in the world; tests/sjobein.py)
    if (LG){ const wd = q => [q[0] + eye[0], q[1] + eye[1], q[2] + eye[2]]; LG.hands = [wd(GP[0]), wd(GP[1])]; LG.head = wd(hd); LG.hipc = wd(tc); LG.id = st.sea ? st.sea.a.id : null;
      LG.se = SE ? {sr:SE.sr, sf:SE.sf, k:SE.k, hipR:SE.hipR, hipF:SE.hipF, hipY:SE.hipY, leanR:SE.leanR, leanF:SE.leanF, grab:SE.grab, gh:SE.gh, step:SE.step, stFoot:SE.stFoot, fr:SE.fr.slice(), kneeDeg:SE.kneeDeg.slice()} : null; SJOBEIN.log.push(LG); }
    // the break's things in the hands (tools/deck/pause.py), where the page has them; the old cup otherwise
    const pz = nm => kit('pause', nm), atH = (q, ...m) => chain(M4.T(q[0], q[1], q[2]), M4.RY(-h), ...m);
    if (st.task === 'coffee' && !st.gone){ const K = pz('krus'), FL = pz('termos'); if (K && FH){ const u = clamp(((st.sip || 0) - HOLDT.cup.from) / (1 - HOLDT.cup.from), 0, 1); drawN(K, atH(GP[0], M4.RX(HOLDT.cup.tip * u * u * (3 - 2 * u)), M4.T(0, -0.045, 0), M4.RY(-1.2))); }   // (tipped to the mouth with the sip, about the hand that holds it; Jonas 14.11.2026: «folkene roterer ikke objekter som feks kaffekoppen»)
      else if (K) drawN(K, atH([GP[0][0], GP[0][1] - 0.045, GP[0][2]], M4.RY(-1.2))); else drawN(PM.cup, M4.T(hands[0][0], hands[0][1] + 0.02, hands[0][2]));
      if (FL){ const q = st.seated ? W(0.1, 0, -0.36) : W(0.12, 0, -0.32); drawN(FL, atH([q[0], y - eye[1] + 0.01, q[2]])); } }
    if (st.task === 'knife' && st.steel){ const B = pz('bryne'); if (B) drawN(B, toolM(GP[1], st.steel.dir)); }
    if (st.task === 'lunch' && !st.gone){ const M = pz('mat'); if (M) drawN(M, atH(GP[1], M4.RX(0.35), M4.S(0.75))); }
    if (st.task === 'phone' && !st.gone){ const P2 = pz((st.age || 40) >= 62 ? 'tlf2' : 'tlf'); if (P2){ const c = [(GP[0][0] + GP[1][0]) / 2, (GP[0][1] + GP[1][1]) / 2 + 0.01, (GP[0][2] + GP[1][2]) / 2]; drawN(P2, atH(c, M4.RX(0.95))); } }
    if (st.task === 'binoc' && !st.gone){ const B = pz('kikk'); if (B){ const c = st.put ? [(GP[0][0] + GP[1][0]) / 2, (GP[0][1] + GP[1][1]) / 2 + 0.01, (GP[0][2] + GP[1][2]) / 2] : FH ? [(GP[0][0] + GP[1][0]) / 2, (GP[0][1] + GP[1][1]) / 2 + HOLDT.kikk.low, (GP[0][2] + GP[1][2]) / 2] : up3(W(0.13, 1.57, 0)); drawN(B, atH(c, M4.RY(-hy))); } }
    if (st.task === 'smoke' && !st.gone){ const C = pz('sig'); if (C){ const u = FH ? st.puff || 0 : 0; drawN(C, atH(GP[0], M4.RY(0.6 - 0.5 * u), M4.RX(0.25 - 0.2 * u))); }   // (the new people: its end turned to the lips with the draw)
      // a breath of smoke after each draw, drifting off with the wind of the deck (DKSMOKE: the view's grey points)
      if (st.puff < 0.05){ const ph = (t * 0.8) % (Math.PI * 2) / (Math.PI * 2), m0 = up3(W(0.2, 1.52, 0.02)); if (ph > 0.55 && ph < 0.95) for (let i = 0; i < 14; i++){ const u = clamp((ph - 0.55) / 0.4 - hash(i + idx) * 0.3, 0, 1); if (u <= 0) continue;
        DKSMOKE.push([m0[0] + F[0] * u * 0.45 + (hash(i * 3) - 0.5) * 0.12 * u, m0[1] + u * 0.3 + (hash(i * 7) - 0.5) * 0.04, m0[2] + F[1] * u * 0.45 + (hash(i * 5) - 0.5) * 0.12 * u, 0.35 * (1 - u)]); } } }
    if (st.task === 'sit' || st.seated){ const sb = W(-0.06, 0, 0); drawN(PM.icebin, chain(M4.T(sb[0], y - eye[1] - 0.02, sb[2]), M4.RY(-h), M4.S(0.8, 0.98, 0.8))); }
    if (st.task === 'snus' && st.can && !st.gone){ const C = pz('snus'); if (C) drawN(C, atH([GP[1][0], GP[1][1] + 0.01, GP[1][2]])); }
    // the knife in the gutting hand, the gaff and the fish on it, the fish held up by the head and the toss into the tub (tools/deck/fisk.py)
    const kn = knifeKit(!!P.bare), fishAt = (P, sp, kg, rz, rx) => { const sc = clamp(0.42 * Math.cbrt(kg || 2), 0.28, 1.2); drawN(fishOf(sp || 'torsk'), chain(M4.T(P[0], P[1] - sc * 0.45, P[2]), M4.RX(Math.PI / 2 + (rx || 0)), M4.RZ(rz || 0), M4.S(sc))); };
    // (a fish not yet bled kicks in the hand and on the gaff, flap in 09-landing-deck.js; k the life left in it)
    const live = (P, e, k) => { const Fl = flap(T, (e.kg || 2) * 2.7 + idx, k, e.sp, e.kg); bendOn(Fl); fishAt(P, e.sp, e.kg, Fl[0], Fl[1]); bendOff(); };
    if (kn && (st.task === 'gut' || (st.task === 'bleed' && st.knife))) drawN(kn, toolM(GP[0], st.kd || [F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]));
    // (sharpening: the knife in the right hand, its blade drawn across the steel)
    if (kn && st.task === 'knife') drawN(kn, toolM(GP[0], st.kd || [-R[0], 0.15, -R[1]]));
    if (kn && st.task === 'cut') drawN(kn, toolM(GP[0], st.kd || [F[0] * 0.2, -1, F[1] * 0.2]));
    // (the fish out of his hands, over the rail in an arc and into the sea with a splash)
    if (st.task === 'slip' && st.slip && st.Rl && st.Wt){ const f = st.slip, u = st.slipU || 0, A0 = W(0.38, 1.05, 0), E = st.Wt;
      if (u < 0.2) live(A0, f);
      else if (u < 0.6){ const v = (u - 0.2) / 0.4, hz = Math.hypot(E[0] - A0[0], E[2] - A0[2]) || 1, vr = clamp(Math.hypot(st.Rl[0] - A0[0], st.Rl[2] - A0[2]) / hz, 0.15, 0.85);
        const arc = Math.max(0.3, (st.Rl[1] + 0.3 - (A0[1] + (E[1] - A0[1]) * vr)) / (4 * vr * (1 - vr)));
        fishAt([A0[0] + (E[0] - A0[0]) * v, A0[1] + (E[1] - A0[1]) * v + arc * 4 * v * (1 - v), A0[2] + (E[2] - A0[2]) * v], f.sp, f.kg, v * 9); }
      else if (!f.splashed){ f.splashed = true; ancSplash(E[0] + eye[0], E[1] + eye[1], E[2] + eye[2], 22, false); DKN.splash = (DKN.splash || 0) + 1; } }   // (the splash where it meets the sea; counted for the tests, oppshot)
    if (st.task === 'gaff' && st.gaff){ const hm = gaffKit(!!P.bare); if (hm) drawN(hm, toolM(st.gaff.g, st.gaff.n)); else drawN(PM.broom, limbM(hands[1], st.gaff.tip, 0.018));
      const e = st.ev; if (e && st.gaffFish) live(st.gaff.tip, e);
      if (e && st.gaffDrop >= 0){ const u = st.gaffDrop, A = st.gaff.tip; const Fl = flap(T, (e.kg || 2) * 2.7 + idx, 1, e.sp, e.kg); bendOn(Fl); fishAt([A[0] + (e.U[0] - A[0]) * u, A[1] + (e.U[1] + 0.15 - A[1]) * u * u, A[2] + (e.U[2] - A[2]) * u], e.sp, e.kg, u * 2 + Fl[0], Fl[1]); bendOff(); } }
    if (st.task === 'bleed' && st.ev){ const e = st.ev; if (st.held) live(st.held, e, e.k < 1.25 ? 1 : clamp(1 - (e.k - 1.25) / 0.45, 0, 1));   // (alive until the cut at 1.25 s, dead by the swing to the tub)
      if (st.toss){ const u = st.toss.u, A = st.toss.from, B = st.toss.to, arc = 0.45 + 0.18 * Math.hypot(B[0] - A[0], B[2] - A[2]); fishAt([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + arc * 4 * u * (1 - u), A[2] + (B[2] - A[2]) * u], e.sp, e.kg, u * 3.5); }
      // the blood from the cut throat, a few drops falling toward the tub
      if (st.blood >= 0 && st.held){ const sc = clamp(0.42 * Math.cbrt(e.kg || 2), 0.28, 1.2), th = [st.held[0], st.held[1] - sc * 0.12, st.held[2]];
        for (let i = 0; i < 10; i++){ const u = (st.blood * 1.6 + hash(i * 5 + idx) * 0.6) % 1, dx = (e.U[0] - th[0]) * 0.25 * u, dz = (e.U[2] - th[2]) * 0.25 * u;
          DKBLOOD.push([th[0] + dx + (hash(i) - 0.5) * 0.03, th[1] - 1.1 * u * u, th[2] + dz + (hash(i + 3) - 0.5) * 0.03]); } } }
    if (st.task === 'gut'){ const c = [(hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]) - 0.02, (hands[0][2] + hands[1][2]) / 2]; if (SK && SK.fishM) drawN(fishOf('torsk'), chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2), M4.RZ(Math.PI / 2), M4.S(0.46))); else drawN(PM.fish, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2))); }
    // ---- the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the
    // ice, the bucket and the bait, the netting needle, the jig line
    const lie = (P, sp, sc, yaw) => { if (SK && SK.fishM) drawN(fishOf(sp || 'torsk'), chain(M4.T(P[0], P[1], P[2]), M4.RY(yaw), M4.RZ(Math.PI / 2), M4.S(sc))); }, fishy = !!(SK && SK.fishM);
    if ((st.task === 'pick' || st.task === 'jigup') && st.ev && fishy){ const e = st.ev; if (st.held) live(st.held, e);
      if (st.fall){ const u = clamp(st.fall.u, 0, 1), A0 = st.fall.A, B0 = st.fall.B; bendOn(flap(T, (e.kg || 2) * 2.7 + idx, 1, e.sp, e.kg)); lie([A0[0] + (B0[0] - A0[0]) * u, A0[1] + (B0[1] + 0.05 - A0[1]) * u * u, A0[2] + (B0[2] - A0[2]) * u], e.sp, clamp(0.42 * Math.cbrt(e.kg || 2), 0.28, 1.2), -h + u * 1.5); bendOff(); } }
    if (st.line) for (let i = 0; i + 1 < st.line.length; i++) drawN(PM.wire, limbM(st.line[i], st.line[i + 1], 0.004));
    // (the line is in the hand that jerks it, runs through the hand at the rail and out over it; Jonas 14.11.2026: «Feil hånd napper i
    // snøret»: it was drawn from the still hand only)
    if (st.task === 'jig' && st.Rl && !st.ev){ drawN(PM.wire, limbM(GP[0], GP[1], 0.004)); drawN(PM.wire, limbM(GP[1], st.Rl, 0.004)); drawN(PM.wire, limbM(st.Rl, st.Wt || [st.Rl[0], st.Rl[1] - 2, st.Rl[2]], 0.004)); }
    if (kn && st.task === 'bleedst') drawN(kn, toolM(GP[0], st.kd || [F[0] * 0.5 - R[0] * 0.2, -0.75, F[1] * 0.5 - R[1] * 0.2]));
    if (st.task === 'gutw'){ const sp = st.gsp || 'torsk', sc = st.gsc || 0.46, yaw = Math.PI / 2 - h, HD = kit('pause', 'hode');
      // (on the table the fish lies across him, its head to his left where the head is cut; cut, it is drawn a little shorter at the head
      // and the head is its own piece, tools/deck/pause.py)
      const lieCut = (P, y0) => { if (!fishy) return; if (!st.cut || !HD){ lie(P, sp, sc, y0); return; } drawN(fishOf(sp), chain(M4.T(P[0], P[1], P[2]), M4.RY(y0), M4.RZ(Math.PI / 2), M4.S(sc), M4.T(0, 0, 0.075), M4.S(1, 1, 0.85))); };
      if (kn && st.knife) drawN(kn, toolM(GP[0], st.kd || st.kdir || [F[0] * 0.3 - R[0] * 0.6, -0.55, F[1] * 0.3 - R[1] * 0.6]));
      if (st.gf){ if (st.gf.hang){ if (fishy) fishAt(st.gf.at, sp, st.gkg || 3, Math.sin(T * 6) * 0.08); } else lieCut(st.gf.at, yaw); }
      if (st.slo) drawN(PM.slo, M4.T(st.slo.at[0], st.slo.at[1], st.slo.at[2]));
      if (HD && st.hd) drawN(HD, chain(M4.T(st.hd.at[0], st.hd.at[1], st.hd.at[2]), M4.RY(yaw + st.hd.spin), M4.RZ(Math.PI / 2 + st.hd.spin * 0.7), M4.S(sc)));
      if (st.gt){ const u = st.gt.u, A0 = st.gt.A, B0 = st.gt.B; lieCut([A0[0] + (B0[0] - A0[0]) * u, A0[1] + (B0[1] - A0[1]) * u + 0.3 * 4 * u * (1 - u), A0[2] + (B0[2] - A0[2]) * u], yaw + u * 0.6); } }
    if (st.task === 'pack'){ if (!st.Bin){ const bin = W0(0.15, 0, (st.binR || -0.5) * (LEMMER.on ? 1.3 : 1.15));   /* (the new people turn towards it: it stands clear of the thigh) */ drawN(PM.icebin, chain(M4.T(bin[0], bin[1], bin[2]), M4.RY(-st.h))); }
      // the crate on his right with the fish packed in it so far, in layers of three (st.fill); on an open boat the fish go in her tub
      if (!st.crTub){ const C = st.Cr || W(0.58, 0, 0), CM = chain(M4.T(C[0], C[1], C[2]), M4.RY(-st.h)); drawN(PM.fbox, CM); const n = fishy ? Math.round((st.fill || 0) * 9) : 0;
        for (let i = 0; i < n; i++) drawN(fishOf(st.csp ? st.csp(i) : 'torsk'), chain(CM, M4.T(-0.24 + (i % 3) * 0.24, 0.07 + Math.floor(i / 3) * 0.06, (hash(i * 5) - 0.5) * 0.06), M4.RY(Math.PI / 2 + (i % 2 ? Math.PI : 0)), M4.RZ(Math.PI / 2), M4.S(0.4)));
        if (n > 0) drawN(PM.icebit, chain(CM, M4.T(0, 0.1 + Math.floor((n - 1) / 3) * 0.06, 0), M4.S(14, 1.2, 7))); }
      if (st.blade) drawShovel(hands[1], st.blade, st.tip, st.full, st.c, st.Cr || W0(0.15, 0, 0.62), st.crTub ? st.crTop : 0.3); }
    // the full box in his arms on the way to the hatch, and lowered into the hold there
    if ((st.task === 'carry' && st.crate) || st.task === 'stow'){ const s2 = stowS(st), down = st.task === 'stow' ? clamp((s2 - 1.3) / 0.8, 0, 1) : 0;
      if (s2 < 2.15 || st.task === 'carry'){ const bg = HOLDT.box.grip, bo = LEMMER.on ? [-F[0] * bg[1], bg[2], -F[1] * bg[1]] : [0, -0.12, 0], c = [(hands[0][0] + hands[1][0]) / 2 + bo[0], (hands[0][1] + hands[1][1]) / 2 + bo[1] - down * 0.8, (hands[0][2] + hands[1][2]) / 2 + bo[2]], CM = chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + (LEMMER.on ? 0 : Math.PI / 2)));
        drawN(PM.fbox, CM); for (let i = 0; i < (fishy ? 9 : 0); i++) drawN(fishOf(st.csp ? st.csp(i) : 'torsk'), chain(CM, M4.T(-0.24 + (i % 3) * 0.24, 0.07 + Math.floor(i / 3) * 0.06, 0), M4.RY(Math.PI / 2 + (i % 2 ? Math.PI : 0)), M4.RZ(Math.PI / 2), M4.S(0.4)));
        drawN(PM.icebit, chain(CM, M4.T(0, 0.22, 0), M4.S(14, 1.2, 7))); } }
    // the bucket by the line tub: bait in it for baiting, the old bait going into it (and over the rail) when stripping; he sits on an upturned bin
    if (st.task === 'egn' || st.task === 'strip'){ const BK = kit('fish', 'botte'), Bk = st.bucket || st.Bk, sb = W(-0.06, 0, 0); drawN(PM.icebin, chain(M4.T(sb[0], sb[1] - 0.02, sb[2]), M4.RY(-h), M4.S(0.8, 0.98, 0.8)));
      if (Bk){ const BM = chain(M4.T(Bk[0], Bk[1], Bk[2]), M4.RY(-h)); if (BK) drawN(BK, BM); else drawN(PM.cup, chain(BM, M4.S(3)));
        if (GB && GB.bait) for (let i = 0; i < 6; i++) drawN(GB.bait, chain(BM, M4.T((hash(i * 3 + idx) - 0.5) * 0.14, 0.16 + hash(i * 7) * 0.03, (hash(i * 5 + idx) - 0.5) * 0.14), M4.RY(hash(i) * 6), M4.S(1.6))); }
      if (GB && GB.bait){ for (const q of [st.bait, st.old]) if (q) drawN(GB.bait, chain(M4.T(q[0], q[1] - 0.02, q[2]), M4.S(1.6)));
        if (st.flick){ const u = clamp(st.flick.u, 0, 1), A0 = st.flick.A, B0 = st.flick.B; drawN(GB.bait, chain(M4.T(A0[0] + (B0[0] - A0[0]) * u, A0[1] + (B0[1] - A0[1]) * u + 0.15 * 4 * u * (1 - u), A0[2] + (B0[2] - A0[2]) * u), M4.S(1.6))); }
        if (st.spill >= 0 && st.Of && Bk){ for (let i = 0; i < 8; i++){ const u = clamp(st.spill * 1.3 - hash(i * 11) * 0.3, 0, 1); if (u <= 0) continue; const T0 = [Bk[0], Bk[1] + 0.2, Bk[2]];
          drawN(GB.bait, chain(M4.T(T0[0] + (st.Of[0] - T0[0]) * u + (hash(i) - 0.5) * 0.3 * u, T0[1] + 0.6 * 4 * u * (1 - u) - (T0[1] - st.Of[1]) * u * u, T0[2] + (st.Of[2] - T0[2]) * u + (hash(i + 4) - 0.5) * 0.3 * u), M4.S(1.6))); } } }
      if (st.hook) drawN(PM.wire, limbM(st.hook, [st.hook[0] + F[0] * 0.03, st.hook[1] - 0.03, st.hook[2] + F[1] * 0.03], 0.003)); }
    if (st.task === 'mend' && st.needle && PM.needle) drawN(PM.needle, toolM(st.needle.at, st.needle.dir));
    if (st.task === 'tally' || st.task === 'remote'){ const c = [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2, (hands[0][2] + hands[1][2]) / 2]; drawN(st.task === 'tally' ? PM.board : PM.remote, chain(M4.T(c[0], c[1] - 0.05, c[2]), M4.RY(-h), M4.RX(st.task === 'tally' ? -0.5 : 0))); }
    if (st.task === 'ice'){ const bin = W0(0.15, 0, -0.62), box = W0(0.15, 0, 0.62); drawN(PM.icebin, chain(M4.T(bin[0], bin[1], bin[2]), M4.RY(-st.h))); drawN(PM.icebox, chain(M4.T(box[0], box[1], box[2]), M4.RY(-st.h)));
      drawShovel(hands[1], st.blade, st.tip, st.full, st.c, box, 0.3); }
    if (st.task === 'carry' || st.task === 'stack'){ const bg = HOLDT.box.grip, bo = LEMMER.on ? [-F[0] * bg[1], bg[2], -F[1] * bg[1]] : [0, -0.1, 0], c = [(hands[0][0] + hands[1][0]) / 2 + bo[0], (hands[0][1] + hands[1][1]) / 2 + bo[1], (hands[0][2] + hands[1][2]) / 2 + bo[2]]; drawN(PM.fbox, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + (LEMMER.on ? 0 : Math.PI / 2)))); }
    if (st.task === 'sweep'){ const top = hands[0], KH = pz('kosthode'), foot = [top[0] + F[0] * 0.55, y - eye[1] + (KH ? 0.108 : 0.02), top[2] + F[1] * 0.55]; drawN(PM.broom, limbM(top, foot, 0.02));
      if (KH) drawN(KH, chain(M4.T(foot[0], foot[1], foot[2]), M4.RY(-h))); else drawN(PM.fbox, chain(M4.T(foot[0], foot[1], foot[2]), M4.RY(-h), M4.S(0.5))); }
    if (st.task === 'hose'){ const nz = hands[0], RL = st.deck ? pz('spole') : null; if (RL){ const q = W(0.12, 0, 0.62); drawN(RL, atH([q[0], y - eye[1], q[2]], M4.RY(Math.PI / 2))); }
      drawN(PM.hose, limbM(RL ? W(0.12, 0.3, 0.5) : W(-0.4, 0.05, 0.4), nz, 0.025));
      if (st.deck) for (let i = 0; i < 24; i++){ const q = ((t * 1.3 + i / 24) % 1), d = q * 1.4; DKWATER.push([nz[0] + F[0] * d + (hash(i) - 0.5) * 0.15 * q, nz[1] + d * 0.2 - q * q * 1.2, nz[2] + F[1] * d + (hash(i + 7) - 0.5) * 0.15 * q]); }
      // (where the jet lands the deck is wet and the water runs out over it: kept in the boat's frame, 09-landing-deck.js dkWet)
      if (st.deck && st.bp && !st.walk) dkWet(st.bp, h - bv.head);
      let k = 0; for (let i = 0; i < 40; i++){ const q = ((t * 1.3 + i / 40) % 1), d = q * 1.6; PB[k * 3] = nz[0] + F[0] * d + (hash(i) - 0.5) * 0.15 * q; PB[k * 3 + 1] = nz[1] + d * 0.25 - q * q * 1.3; PB[k * 3 + 2] = nz[2] + F[1] * d + (hash(i + 7) - 0.5) * 0.15 * q; PA[k] = 0.7 * (1 - q); k++; }
      P.spray = k; } 
  }
