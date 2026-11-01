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
  function workLow(st, T, idx){
    const k = st.task, e = st.ev, c = e ? e.k : 99;
    if (k === 'hose' || k === 'coil' || k === 'stack' || k === 'gut' || k === 'haul') return [0, 0.12];
    if (k === 'ice') return [0, 0.22];
    if (k === 'lean') return [0, 0.1];
    if (k === 'pick' || k === 'tend') return [0.05, 0.22];
    if (k === 'bleed' && e && e.deck){ const u = c < 0.25 ? c / 0.25 : c < 0.6 ? 1 : c < 1.0 ? 1 - (c - 0.6) / 0.4 : 0; return [0.62 * u, 0.12 + 0.42 * u]; }   // down to the fish on the deck and up with it
    if (k === 'bleedst') return [0, 0.14];
    if (k === 'gutw'){ const s = (T + idx * 1.7) % 5.6, u = s < 0.9 ? Math.sin(s / 0.9 * Math.PI / 2) : s < 1.4 ? 1 - (s - 0.9) / 0.5 : 0; return [0.12 * u, 0.14 + 0.24 * u]; }
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
  // he turns from his place towards what he reaches for: the gutter to the bleeding tub for the next fish, the bleeder to the tub as he
  // throws, the packer to the crate at his side (the place and its heading stay; the body turns on the feet)
  function workTurn(st, eye, T, idx){
    const to = q => { if (!q) return 0; let d = Math.atan2(q[0] + eye[0] - st.x, -(q[2] + eye[2] - st.z)) - st.h; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d) < 0.35 ? 0 : clamp(d, -1.3, 1.3); };
    const ez = u => u * u * (3 - 2 * u);
    if (st.task === 'gutw' && st.Ub){ const s = (T + idx * 1.7) % 5.6, w = s < 0.4 ? ez(s / 0.4) : s < 0.95 ? 1 : s < 1.4 ? 1 - ez((s - 0.95) / 0.45) : 0; return w ? to(st.Ub) * w : 0; }
    if (st.task === 'bleed' && st.ev && st.ev.deck){ const c = st.ev.k, w = c < 1.7 ? 0 : c < 2.05 ? ez((c - 1.7) / 0.35) : c < 2.5 ? 1 : c < 2.9 ? 1 - ez((c - 2.5) / 0.4) : 0; return w ? to(st.ev.U) * w : 0; }
    if (st.task === 'pack' && st.Cr && st.lay != null && st.lay >= 0 && st.lay < 1.5) return to(st.Cr) * 0.6 * Math.sin(st.lay / 1.5 * Math.PI);
    return 0;
  }
  function drawWorker(P, st, eye, T, idx){
    const y = P.gy([st.x, st.z]), h = st.h + workTurn(st, eye, T, idx); (P.wpos || (P.wpos = {}))[idx] = {x:st.x, y, z:st.z};   // where he stands, for his words (sayWorker)
    const F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], rel = (x, yy, z) => [x - eye[0], yy - eye[1], z - eye[2]];
    const W = (a, up, r) => rel(st.x + F[0] * a + R[0] * r, y + up, st.z + F[1] * a + R[1] * r);
    const ph = st.walk || st.task === 'sweep' ? (T * 6.5 + idx) : 0, sw = st.walk ? Math.sin(ph) : 0;
    // the detailed figure (tools/harbour/arbeider.py): the harbour workers in blue coveralls and hard hats, the crew on deck in oilskins
    const lk = P.look || (!P.kit && !P.bare && P.id != null ? lookQuay(P.id, idx) : null);      // the people on a plant's quay each have their own look too (core/09i-look.js lookQuay)
    const K = PM.W && (lk ? lookMesh(lk) : PM.W[P.kit || (P.bare ? 'crew' : 'hw')]);      // P.look: the one who does the work, by his look (the skipper's or a crew member's); P.kit: the old kits
    // how low the work takes him (workLow): dip lowers the hips, the back and the head with the knees going forward, bend tips the back over
    const LB = workLow(st, T, idx), bk = st.blend == null ? 1 : st.blend, sit = LB[2] ? bk : 0, sh = st.seat || 0.5, dip = LB[0] * bk, dy = -dip * 0.42 - sit * (0.94 - sh);
    // (sitting, LB[2]: on a low seat, the thighs out level and the shins down to the deck; the seat is drawn with the props)
    for (const s of [-1, 1]){ let hip = W(dip * 0.06, 0.92 + dy, s * 0.11), foot = W(sw * s * 0.28, 0.08 + Math.max(0, Math.cos(ph) * s) * 0.07 * (st.walk ? 1 : 0), s * 0.12), kf = 0.07 + dip * 0.34, knee = [(hip[0] + foot[0]) / 2 + F[0] * kf, (hip[1] + foot[1]) / 2 + dip * 0.05, (hip[2] + foot[2]) / 2 + F[1] * kf];
      if (sit){ hip = W(-0.04, sh, s * 0.12); knee = W(0.38, sh + 0.02, s * 0.15); foot = W(0.44, sh - 0.42, s * 0.17); }
      // back to the rail with the legs crossed: the feet a little out, the right one over in front of the left
      if (st.task === 'back' && !st.walk){ hip = W(0.05, 0.92 + dy, s * 0.11); foot = s > 0 ? W(0.3, 0.08, -0.05) : W(0.2, 0.08, -0.13); knee = [(hip[0] + foot[0]) / 2 + F[0] * 0.05, (hip[1] + foot[1]) / 2 + 0.02, (hip[2] + foot[2]) / 2 + F[1] * 0.05]; }
      if (K){ drawN(K.thigh, limbM(hip, knee, 1)); drawN(K.shin, limbM(knee, foot, 1)); drawN(K.boot, chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h))); continue; }
      drawN(PM.leg, limbM(hip, knee, 0.075)); drawN(PM.leg, limbM(knee, foot, 0.065)); drawN(PM.boot, chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h))); }
    const bend = LB[1] * bk + (st.slump || 0) * 0.45;   // (and stoop)
    const tc = W(bend * 0.4, 1.2 + dy, 0); drawN(K ? K.torso : PM.torso, chain(M4.T(tc[0], tc[1] - 0.28, tc[2]), M4.RY(-h), M4.RX(-bend)));
    // the head: looking about when idle, and at you when you bring the camera close in front of him (deckcrew agents, st.peek)
    let hy = st.task === 'look' ? Math.sin(T * 0.4 + idx) * 0.5 : 0;
    if (st.peek){ const ex = eye[0] - st.x, ez = eye[2] - st.z, d = Math.hypot(ex, ez); if (d < 7){ let dh = Math.atan2(ex, -ez) - h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI; if (Math.abs(dh) < 1.3) hy = -dh * 0.85 * Math.min(1, (7 - d) / 2); } }
    // the head's pitch by what he does (down at the phone, the knife, over the rail; up at the northern lights), and a slow turn talking or
    // scanning with the binoculars
    const HP = {phone:-0.5, knife:-0.4, seasick:-0.6, lunch:-0.12, gear:-0.35, sit:-0.12, snus:-0.08, aurora:0.6, binoc:0.04, cut:-0.5, slip:-0.25};
    // (the tired look down, st.slump)
    const hp = (HP[st.task] || 0) - (st.slump || 0) * 0.5; if (st.task === 'chat') hy += Math.sin(T * 0.7 + idx) * 0.12; if (st.task === 'aurora') hy += Math.sin(T * 0.15 + idx) * 0.4; if (st.task === 'binoc') hy += Math.sin(T * 0.22 + idx) * 0.25;
    const hd = W(bend, 1.6 + dy, 0), HM = chain(M4.T(hd[0], hd[1] - 0.1, hd[2]), M4.RY(-h + hy), M4.RX(hp));
    if (K){ drawN(K.head, HM); for (const m of [K.hair, K.beard, K.hat]) if (m) drawN(m, HM); } else drawN(P.bare ? PM.headB : PM.head, HM);
    let hands;
    const t = T + idx * 1.7;
    // (near, the hands are drawn in their grips, the pose's points being where they hold: a hanging hand's grip is below its wrist)
    const HMS = K ? handMeshes() : null, near = !!HMS && Math.hypot(...W(0, 1.2, 0)) < 10;
    const ease = u => u * u * (3 - 2 * u), lerp3 = (A, B, u) => [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u], norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    switch (st.task){
      case 'hose': hands = [W(0.45, 1.15, 0.12), W(0.3, 1.1, -0.1)]; break;
      case 'coil': { const a = t * 3; hands = [W(0.35 + Math.cos(a) * 0.12, 1.05 + Math.sin(a) * 0.15, 0.12), W(0.3, 1.0, -0.15)]; break; }
      case 'stack': { const k = (Math.sin(t * 1.4) + 1) / 2; hands = [W(0.35, 0.7 + k * 0.6, 0.2), W(0.35, 0.7 + k * 0.6, -0.2)]; break; }
      case 'carry': hands = [W(0.3, 1.0, 0.2), W(0.3, 1.0, -0.2)]; break;
      // icing: the shovel goes into the ice bin on his left, swings over to the box of fish on his right and tips the ice over the fish
      case 'ice': { const c = ((T + idx * 1.7) % 2.6) / 2.6, e = u => u * u * (3 - 2 * u), sw0 = c < 0.3 ? 0 : c < 0.55 ? e((c - 0.3) / 0.25) : c < 0.75 ? 1 : 1 - e((c - 0.75) / 0.25);
        const lo = c < 0.3 ? Math.sin(c / 0.3 * Math.PI) : 0, r = -0.5 + sw0 * 1.0, up = 0.62 - lo * 0.12 + Math.sin(sw0 * Math.PI) * 0.3;
        st.blade = W(0.55, up, r); st.tip = c >= 0.55 && c < 0.75 ? Math.sin((c - 0.55) / 0.2 * Math.PI) : 0; st.full = c >= 0.22 && c < 0.62; st.c = c;
        const G = W(0.08, 1.02, r * 0.35); hands = [[G[0] + (st.blade[0] - G[0]) * 0.5, G[1] + (st.blade[1] - G[1]) * 0.5, G[2] + (st.blade[2] - G[2]) * 0.5], G]; break; }
      case 'sweep': { const k = Math.sin(t * 2.2) * 0.25; hands = [W(0.25 + k * 0.3, 1.0, 0.1 + k), W(0.35 + k * 0.3, 0.8, -0.05 + k)]; break; }
      case 'coffee': { const k = Math.max(0, Math.sin(t * 0.5)) ** 8; hands = [W(0.18 + (1 - k) * 0.1, 1.05 + k * 0.45, 0.14 - k * 0.1), W(0.05, 0.85, -0.25)]; break; }
      // at a landing: hand signals to the crane driver, reaching for a load coming down, unhooking it, counting, and the radio remote
      case 'signal': { const k = Math.sin(t * 3.2); hands = [W(0.2 + k * 0.06, 1.72, 0.32 + k * 0.12), W(0.25, 0.95, -0.22)]; break; }
      case 'guide': hands = [W(0.42, 1.62, 0.22), W(0.42, 1.62, -0.22)]; break;
      case 'unhook': hands = [W(0.38, 1.9, 0.08), W(0.35, 1.3, -0.18)]; break;
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
        const ch = W(0.15, 1.25, 0), n0 = norm3([tip[0] - ch[0], tip[1] - ch[1], tip[2] - ch[2]]); let g = [tip[0] - n0[0] * 0.66, tip[1] - n0[1] * 0.66, tip[2] - n0[2] * 0.66];
        const gd = Math.hypot(g[0] - ch[0], g[1] - ch[1], g[2] - ch[2]); if (gd > 0.55) g = lerp3(ch, g, 0.55 / gd);
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
      case 'haul': { const k = Math.sin(t * 1.6) * 0.03, r = st.rail; hands = r ? [W(r[0] + 0.08, r[1] + 0.1 + k, 0.2), W(r[0] + 0.12, r[1] + 0.24 - k, -0.06)] : [W(0.42, 1.08 + k, 0.2), W(0.52, 1.22 - k, -0.06)]; break; }
      // the pot hand and the crab sorter: hands at the work in front, low
      case 'tend': { const k = Math.sin(t * 2.2); hands = [W(0.45 + k * 0.05, 0.8 + Math.max(0, k) * 0.12, 0.16), W(0.45 - k * 0.05, 0.8 + Math.max(0, -k) * 0.12, -0.16)]; break; }
      // the net off the hauler: the hands at the meshes; a fish (the event) is worked out of them, held up and let fall to the deck
      case 'pick': { const e = st.ev, c = e ? e.k : 99, i0 = Math.sin(t * 2.4), pr = st.rail, idle = pr ? [W(pr[0] + 0.06, pr[1] + 0.05 + i0 * 0.05, 0.14), W(pr[0] + 0.06, pr[1] + 0.03 - i0 * 0.05, -0.14)] : [W(0.48, 1.02 + i0 * 0.05, 0.14), W(0.48, 1.0 - i0 * 0.05, -0.14)]; st.held = null; st.fall = null;
        if (e && c < DKDUR.pick){ const Rt = e.R, aR = [Rt[0] + R[0] * 0.09, Rt[1], Rt[2] + R[1] * 0.09], aL = [Rt[0] - R[0] * 0.09, Rt[1] + 0.05, Rt[2] - R[1] * 0.09], back = [W(0.36, 1.0, 0.12), W(0.36, 1.02, -0.12)];
          if (c < 0.4){ const u = ease(c / 0.4); hands = [lerp3(idle[0], aR, u), lerp3(idle[1], aL, u)]; }
          else if (c < 1.6){ const w = Math.sin((c - 0.4) * 11) * 0.04; hands = [[aR[0], aR[1] + w, aR[2]], [aL[0], aL[1] - w, aL[2]]]; st.held = [Rt[0], Rt[1] - 0.04, Rt[2]]; st.hrz = Math.sin(c * 9) * 0.45; }
          else if (c < 2.0){ const u = ease((c - 1.6) / 0.4); hands = [lerp3(aR, back[0], u), lerp3(aL, back[1], u)]; const m = [(hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]) - 0.06, (hands[0][2] + hands[1][2]) / 2];
            if (c < 1.8) st.held = m; else st.fall = {A:m, B:e.D || W(0.5, 0.05, 0), u:(c - 1.8) / 0.2}; }
          else { const u = ease((c - 2.0) / 0.4); hands = [lerp3(back[0], idle[0], u), lerp3(back[1], idle[1], u)]; } }
        else hands = idle; break; }
      // the bleeder between the fish: the knife in the right hand, ready
      case 'bleedst': { const k = Math.sin(t * 0.7) * 0.02; hands = [W(0.3, 0.92 + k, 0.2), W(0.28, 0.95 - k, -0.18)]; break; }
      // jigging by hand: the line comes up hand over hand at the rail with the fish on it (the event), and is lifted in over the rail
      case 'jigup': { const e = st.ev, c = e ? e.k : 99, Rl = e ? e.R : W(0.5, 1.0, 0), Wt = e ? e.W : W(0.9, -0.5, 0); st.held = null;
        if (e && c < 1.6){ const k = (c * 2.6) % 1, up = 0.85 + 0.42 * Math.sin(k * Math.PI); hands = [W(0.4, k < 0.5 ? up : 1.27 - (up - 0.85), 0.08), W(0.38, k < 0.5 ? 1.27 - (up - 0.85) : up, -0.08)];
          const u = clamp(c / 1.5, 0, 1); st.held = lerp3(Wt, [Rl[0], Rl[1] - 0.15, Rl[2]], u * u); st.line = [hands[1], Rl, st.held]; }
        else { const u = e ? ease(clamp((c - 1.6) / 0.6, 0, 1)) : 1, chest = W(0.4, 1.1, -0.05); hands = [W(0.36, 1.0, 0.16), lerp3([Rl[0], Rl[1] + 0.05, Rl[2]], chest, u)]; if (e) st.held = [hands[1][0], hands[1][1] - 0.04, hands[1][2]]; }
        break; }
      // packing and icing (by the bleeding tub): a gutted fish just landed in the box before him (st.lay, s since) is laid straight with both
      // hands; between them ice is shovelled over the fish from the bin at his side (st.binR, away from the gutter), into the box (or the
      // open boat's tub, st.Cr)
      case 'pack': { const L = st.lay, Cr = st.Cr || W(0.15, 0, 0.62), cr = [Cr[0], Cr[1] + (st.crTop || 0.28), Cr[2]]; st.blade = null; st.tip = 0;
        if (L != null && L >= 0 && L < 1.5){ const u = Math.sin(Math.min(1, L / 1.5) * Math.PI), k = Math.sin(L * 9) * 0.03;
          hands = [[cr[0] + R[0] * 0.13 + F[0] * k, cr[1] + 0.06 + 0.2 * (1 - u), cr[2] + R[1] * 0.13 + F[1] * k], [cr[0] - R[0] * 0.13, cr[1] + 0.06 + 0.2 * (1 - u), cr[2] - R[1] * 0.13]]; break; }
        const dx = Cr[0] + eye[0] - st.x, dz = Cr[2] + eye[2] - st.z, aT = clamp(dx * F[0] + dz * F[1], 0.3, 0.85), rT = clamp(dx * R[0] + dz * R[1], -0.8, 0.8), rB = st.binR || -0.5;
        const c = ((T + idx * 1.7) % 2.6) / 2.6, sw0 = c < 0.3 ? 0 : c < 0.55 ? ease((c - 0.3) / 0.25) : c < 0.75 ? 1 : 1 - ease((c - 0.75) / 0.25);
        const lo = c < 0.3 ? Math.sin(c / 0.3 * Math.PI) : 0, r = rB + sw0 * (rT - rB), a = 0.4 + sw0 * (aT - 0.4), up = 0.62 - lo * 0.12 + Math.sin(sw0 * Math.PI) * 0.3;
        st.blade = W(a, up, r); st.tip = c >= 0.55 && c < 0.75 ? Math.sin((c - 0.55) / 0.2 * Math.PI) : 0; st.full = c >= 0.22 && c < 0.62; st.c = c;
        const G = W(0.08, 1.02, r * 0.35); hands = [[G[0] + (st.blade[0] - G[0]) * 0.5, G[1] + (st.blade[1] - G[1]) * 0.5, G[2] + (st.blade[2] - G[2]) * 0.5], G]; break; }
      // a full box of fish carried to the hatch and lowered into the hold (st.s: seconds there; 2.2 in all)
      case 'stow': { const u = clamp((st.s || 0) / 1.6, 0, 1); hands = [W(0.42, 0.95 - 0.5 * ease(u), 0.22), W(0.42, 0.95 - 0.5 * ease(u), -0.22)]; break; }
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
      case 'gutw': { const Gs = ((T + idx * 1.7) % 5.6), Tb = st.Tb, sh = W(0.1, 1.3 + dy, 0), Ub = st.Ub ? lerp3(sh, st.Ub, Math.min(1, 0.68 / Math.max(0.01, Math.hypot(st.Ub[0] - sh[0], st.Ub[1] - sh[1], st.Ub[2] - sh[2])))) : W(0.45, 0.6, 0.5);
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
        else if (Gs < 3.35){ const u = ease((Gs - 2.95) / 0.4), g1 = up(E, 0.42 * sc), tw = st.Of ? [sh[0] + (st.Of[0] - sh[0]) * 0.3, sh[1] + 0.05, sh[2] + (st.Of[2] - sh[2]) * 0.3] : W(0.3, 1.12, 0.32);
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
        if (st.packId && Gs >= 5.3){ const n = Math.floor((T + idx * 1.7) / 5.6), q = DKLAY[st.packId]; if (!q || q.n !== n + idx * 1e4){ DKLAY[st.packId] = {t:performance.now() / 1000, n:n + idx * 1e4}; } }
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
      case 'lunch': { const k = Math.pow(Math.max(0, Math.sin(t * 0.55)), 6); hands = [lerp3(W(0.3, 1.08, 0.08), W(0.13, 1.5, 0.03), k), W(0.3, 1.03, -0.1)]; break; }
      // the phone held in both hands at the chest, a thumb at work
      case 'phone': { const k = Math.sin(t * 3.1) * 0.006; hands = [W(0.26, 1.13 + k, 0.035), W(0.26, 1.12, -0.035)]; break; }
      // the binoculars up at the eyes
      case 'binoc': hands = [W(0.15, 1.56, 0.07), W(0.15, 1.56, -0.07)]; break;
      // the hands in the pockets, the head up at the sky
      case 'aurora': hands = [W(0.0, 0.93, 0.19), W(0.0, 0.93, -0.19)]; break;
      // over the rail, holding on
      case 'seasick': { const r = st.rail || [0.42, 0.96]; hands = [W(r[0] + 0.02, r[1] + 0.04, 0.24), W(r[0] + 0.02, r[1] + 0.04, -0.24)]; break; }
      // going over the gear: the hands at it, low, turning it over
      case 'gear': { const k = Math.sin(t * 1.3); hands = [W(0.45 + k * 0.04, 0.72 + Math.max(0, k) * 0.1, 0.15), W(0.45 - k * 0.04, 0.72 + Math.max(0, -k) * 0.1, -0.15)]; break; }
      // a smoke: the cigarette to the mouth every few seconds, the other hand on the rail (facing out) or in a pocket (aft, under way)
      case 'smoke': { const k = Math.pow(Math.max(0, Math.sin(t * 0.8)), 10); hands = [lerp3(W(0.24, 1.02, 0.17), W(0.13, 1.52, 0.02), k), st.lean === false || !st.rail ? W(0.0, 0.93, -0.19) : W(st.rail[0] + 0.02, st.rail[1] + 0.04, -0.2)]; st.puff = k; break; }
      // snus: the can out of the pocket, a portion under the lip, the can back; then the hands on the rail
      case 'snus': { const c = (t % 24) / 24; if (c < 0.28){ const u = ease(Math.min(1, c / 0.1)); hands = [lerp3(W(0.0, 0.95, 0.19), W(0.26, 1.13, 0.02), u), W(0.26, 1.1, -0.04)]; st.can = true; }
        else if (c < 0.4){ const u = Math.sin((c - 0.28) / 0.12 * Math.PI); hands = [lerp3(W(0.26, 1.13, 0.02), W(0.12, 1.47, 0.03), u), W(0.26, 1.1, -0.04)]; st.can = true; }
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
      default: { const hy = near ? 0.76 : 0.82; hands = [W(-sw * 0.15, hy, 0.26), W(sw * 0.15, hy, -0.26)]; }
    }
    // the break's thing put away before the walk to work (deckcrew.js a.put): the last of it (a sip, a draw), the hand to the pocket
    // (the binoculars to the chest, the butt over the side) and it is gone (st.gone), then the hands down
    if (st.put){ const u = st.put.u, ph = st.put.task, hy = near ? 0.76 : 0.82, fin = u < 0.35 ? Math.sin(u / 0.35 * Math.PI) : 0, go = ease(clamp((u - 0.35) / 0.4, 0, 1)), back = ease(clamp((u - 0.8) / 0.2, 0, 1));
      if (ph === 'coffee' || ph === 'smoke') hands[0] = lerp3(hands[0], W(0.13, 1.5, 0.03), fin);
      const dest = i => ph === 'binoc' ? W(0.14, 1.3, i ? -0.06 : 0.06) : ph === 'phone' ? (i ? W(0.1, 1.0, 0.1) : W(0.05, 0.98, 0.2)) : ph === 'smoke' ? W(0.5, 1.05, 0.28) : i ? W(0.02, 0.98, -0.21) : W(0.02, 0.98, 0.21);
      for (const i of ph === 'phone' || ph === 'binoc' ? [0, 1] : ph === 'lunch' || ph === 'snus' ? [1] : [0]) hands[i] = lerp3(hands[i], dest(i), go);
      if (back > 0){ const rest = [W(0, hy, 0.26), W(0, hy, -0.26)]; for (const i of [0, 1]) hands[i] = lerp3(hands[i], rest[i], back); }
      st.gone = u >= 0.78; }
    // the hands (tools/harbour/hender.py; Jonas 23.10.2026: «Det er også viktig hvordan objekter holdes med hendene for realismen»):
    // each in the grip its work takes, the palm turned the way the work turns it; the pose's point is where the hand holds (its grip),
    // the wrist is found back from it, and what the hand holds is drawn in the grip (GP, GA). Far off (and on the old figure) the one-piece
    // glove at the wrist as before.
    const HS = near ? handSpecs(st, F, R, hands) : null, GP = [hands[0], hands[1]], GA = [null, null];
    [0.21, -0.21].forEach((r, i) => { const sh = W(bend * 0.8, 1.42 + dy, r), elOf = q => [(sh[0] + q[0]) / 2 - F[0] * 0.05 + R[0] * r * 0.25, (sh[1] + q[1]) / 2 - 0.08, (sh[2] + q[2]) / 2 - F[1] * 0.05 + R[1] * r * 0.25];
      if (near){ const sd = i ? 'L' : 'R', sp = HS[i], gd = (HMS.grip[sp.g] || HMS.grip.relax)[sd], tg = hands[i];
        let Fr = handFrame(nrm3(sub3(tg, elOf(tg))), sp, i ? -1 : 1); const wr = sub3(tg, inFrame(Fr, gd.at)), el = elOf(wr);
        Fr = handFrame(nrm3(sub3(wr, el)), sp, i ? -1 : 1);
        drawN(K.uarm, limbM(sh, el, 1)); drawN(K.farm, limbM(el, wr, 1)); drawN(HMS[sd][sp.g] || HMS[sd].relax, handMtx(Fr, wr));
        if (i && st.tape && HMS.tape) drawN(HMS.tape, handMtx(Fr, wr));   // (a cut hand taped, the four hours it is slow)
        GP[i] = add3(wr, inFrame(Fr, gd.at)); GA[i] = inFrame(Fr, gd.ax); return; }
      const hd2 = hands[i], el = elOf(hd2);
      if (K){ const f = [hd2[0] - el[0], hd2[1] - el[1], hd2[2] - el[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1;
        drawN(K.uarm, limbM(sh, el, 1)); drawN(K.farm, limbM(el, hd2, 1)); drawN(HMS ? HMS.lo : K.hand, limbM(hd2, [hd2[0] + f[0] / fl, hd2[1] + f[1] / fl, hd2[2] + f[2] / fl], 1)); return; }
      drawN(PM.arm, limbM(sh, el, 0.06)); drawN(PM.arm, limbM(el, hd2, 0.055)); drawN(PM.hand, M4.T(hd2[0], hd2[1], hd2[2])); });
    // the break's things in the hands (tools/deck/pause.py), where the page has them; the old cup otherwise
    const pz = nm => kit('pause', nm), atH = (q, ...m) => chain(M4.T(q[0], q[1], q[2]), M4.RY(-h), ...m);
    if (st.task === 'coffee' && !st.gone){ const K = pz('krus'), FL = pz('termos'); if (K) drawN(K, atH([GP[0][0], GP[0][1] - 0.045, GP[0][2]], M4.RY(-1.2))); else drawN(PM.cup, M4.T(hands[0][0], hands[0][1] + 0.02, hands[0][2]));
      if (FL){ const q = W(0.12, 0, -0.32); drawN(FL, atH([q[0], y - eye[1] + 0.01, q[2]])); } }
    if (st.task === 'knife' && st.steel){ const B = pz('bryne'); if (B) drawN(B, toolM(GP[1], st.steel.dir)); }
    if (st.task === 'lunch' && !st.gone){ const M = pz('mat'); if (M) drawN(M, atH(GP[1], M4.RX(0.35), M4.S(0.75))); }
    if (st.task === 'phone' && !st.gone){ const P2 = pz((st.age || 40) >= 62 ? 'tlf2' : 'tlf'); if (P2){ const c = [(GP[0][0] + GP[1][0]) / 2, (GP[0][1] + GP[1][1]) / 2 + 0.01, (GP[0][2] + GP[1][2]) / 2]; drawN(P2, atH(c, M4.RX(0.95))); } }
    if (st.task === 'binoc' && !st.gone){ const B = pz('kikk'); if (B){ const c = st.put ? [(GP[0][0] + GP[1][0]) / 2, (GP[0][1] + GP[1][1]) / 2 + 0.01, (GP[0][2] + GP[1][2]) / 2] : W(0.13, 1.57, 0); drawN(B, atH(c, M4.RY(-hy))); } }
    if (st.task === 'smoke' && !st.gone){ const C = pz('sig'); if (C) drawN(C, atH(GP[0], M4.RY(0.6), M4.RX(0.25)));
      // a breath of smoke after each draw, drifting off with the wind of the deck (DKSMOKE: the view's grey points)
      if (st.puff < 0.05){ const ph = (t * 0.8) % (Math.PI * 2) / (Math.PI * 2), m0 = W(0.2, 1.52, 0.02); if (ph > 0.55 && ph < 0.95) for (let i = 0; i < 14; i++){ const u = clamp((ph - 0.55) / 0.4 - hash(i + idx) * 0.3, 0, 1); if (u <= 0) continue;
        DKSMOKE.push([m0[0] + F[0] * u * 0.45 + (hash(i * 3) - 0.5) * 0.12 * u, m0[1] + u * 0.3 + (hash(i * 7) - 0.5) * 0.04, m0[2] + F[1] * u * 0.45 + (hash(i * 5) - 0.5) * 0.12 * u, 0.35 * (1 - u)]); } } }
    if (st.task === 'sit'){ const sb = W(-0.06, 0, 0); drawN(PM.icebin, chain(M4.T(sb[0], y - eye[1] - 0.02, sb[2]), M4.RY(-h), M4.S(0.8, 0.98, 0.8))); }
    if (st.task === 'snus' && st.can && !st.gone){ const C = pz('snus'); if (C) drawN(C, atH([GP[1][0], GP[1][1] + 0.01, GP[1][2]])); }
    // the knife in the gutting hand, the gaff and the fish on it, the fish held up by the head and the toss into the tub (tools/deck/fisk.py)
    const kn = kit('fish', 'kniv'), fishAt = (P, sp, kg, rz) => { const sc = clamp(0.42 * Math.cbrt(kg || 2), 0.28, 1.2); drawN(fishOf(sp || 'torsk'), chain(M4.T(P[0], P[1] - sc * 0.45, P[2]), M4.RX(Math.PI / 2), M4.RZ(rz || 0), M4.S(sc))); };
    if (kn && (st.task === 'gut' || (st.task === 'bleed' && st.knife))) drawN(kn, toolM(GP[0], st.kd || [F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]));
    // (sharpening: the knife in the right hand, its blade drawn across the steel)
    if (kn && st.task === 'knife') drawN(kn, toolM(GP[0], st.kd || [-R[0], 0.15, -R[1]]));
    if (kn && st.task === 'cut') drawN(kn, toolM(GP[0], st.kd || [F[0] * 0.2, -1, F[1] * 0.2]));
    // (the fish out of his hands, over the rail in an arc and into the sea with a splash)
    if (st.task === 'slip' && st.slip && st.Rl && st.Wt){ const f = st.slip, u = st.slipU || 0, A0 = W(0.38, 1.05, 0), E = st.Wt;
      if (u < 0.2) fishAt(A0, f.sp, f.kg, Math.sin(T * 9) * 0.3);
      else if (u < 0.6){ const v = (u - 0.2) / 0.4, hz = Math.hypot(E[0] - A0[0], E[2] - A0[2]) || 1, vr = clamp(Math.hypot(st.Rl[0] - A0[0], st.Rl[2] - A0[2]) / hz, 0.15, 0.85);
        const arc = Math.max(0.3, (st.Rl[1] + 0.3 - (A0[1] + (E[1] - A0[1]) * vr)) / (4 * vr * (1 - vr)));
        fishAt([A0[0] + (E[0] - A0[0]) * v, A0[1] + (E[1] - A0[1]) * v + arc * 4 * v * (1 - v), A0[2] + (E[2] - A0[2]) * v], f.sp, f.kg, v * 9); }
      else if (!f.splashed){ f.splashed = true; ancSplash(E[0] + eye[0], E[1] + eye[1], E[2] + eye[2], 22, false); } }
    if (st.task === 'gaff' && st.gaff){ const hm = kit('fish', 'hott'); if (hm) drawN(hm, toolM(st.gaff.g, st.gaff.n)); else drawN(PM.broom, limbM(hands[1], st.gaff.tip, 0.018));
      const e = st.ev; if (e && st.gaffFish) fishAt(st.gaff.tip, e.sp, e.kg, Math.sin(T * 9) * 0.4);
      if (e && st.gaffDrop >= 0){ const u = st.gaffDrop, A = st.gaff.tip; fishAt([A[0] + (e.U[0] - A[0]) * u, A[1] + (e.U[1] + 0.15 - A[1]) * u * u, A[2] + (e.U[2] - A[2]) * u], e.sp, e.kg, u * 2); } }
    if (st.task === 'bleed' && st.ev){ const e = st.ev; if (st.held) fishAt(st.held, e.sp, e.kg, Math.sin(T * 7) * 0.15 * (st.knife ? 0.3 : 1));
      if (st.toss){ const u = st.toss.u, A = st.toss.from, B = st.toss.to, arc = 0.45 + 0.18 * Math.hypot(B[0] - A[0], B[2] - A[2]); fishAt([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + arc * 4 * u * (1 - u), A[2] + (B[2] - A[2]) * u], e.sp, e.kg, u * 3.5); }
      // the blood from the cut throat, a few drops falling toward the tub
      if (st.blood >= 0 && st.held){ const sc = clamp(0.42 * Math.cbrt(e.kg || 2), 0.28, 1.2), th = [st.held[0], st.held[1] - sc * 0.12, st.held[2]];
        for (let i = 0; i < 10; i++){ const u = (st.blood * 1.6 + hash(i * 5 + idx) * 0.6) % 1, dx = (e.U[0] - th[0]) * 0.25 * u, dz = (e.U[2] - th[2]) * 0.25 * u;
          DKBLOOD.push([th[0] + dx + (hash(i) - 0.5) * 0.03, th[1] - 1.1 * u * u, th[2] + dz + (hash(i + 3) - 0.5) * 0.03]); } } }
    if (st.task === 'gut'){ const c = [(hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]) - 0.02, (hands[0][2] + hands[1][2]) / 2]; if (SK && SK.fishM) drawN(fishOf('torsk'), chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2), M4.RZ(Math.PI / 2), M4.S(0.46))); else drawN(PM.fish, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2))); }
    // ---- the props of the deck work (the poses above): the fish in the hands and on the table, the guts over the rail, the crate and the
    // ice, the bucket and the bait, the netting needle, the jig line
    const lie = (P, sp, sc, yaw) => { if (SK && SK.fishM) drawN(fishOf(sp || 'torsk'), chain(M4.T(P[0], P[1], P[2]), M4.RY(yaw), M4.RZ(Math.PI / 2), M4.S(sc))); }, fishy = !!(SK && SK.fishM);
    if ((st.task === 'pick' || st.task === 'jigup') && st.ev && fishy){ const e = st.ev; if (st.held) fishAt(st.held, e.sp, e.kg, st.hrz != null ? st.hrz : Math.sin(T * 7) * 0.25);
      if (st.fall){ const u = clamp(st.fall.u, 0, 1), A0 = st.fall.A, B0 = st.fall.B; lie([A0[0] + (B0[0] - A0[0]) * u, A0[1] + (B0[1] + 0.05 - A0[1]) * u * u, A0[2] + (B0[2] - A0[2]) * u], e.sp, clamp(0.42 * Math.cbrt(e.kg || 2), 0.28, 1.2), -h + u * 1.5); } }
    if (st.line) for (let i = 0; i + 1 < st.line.length; i++) drawN(PM.wire, limbM(st.line[i], st.line[i + 1], 0.004));
    if (st.task === 'jig' && st.Rl && !st.ev){ drawN(PM.wire, limbM(GP[1], st.Rl, 0.004)); drawN(PM.wire, limbM(st.Rl, st.Wt || [st.Rl[0], st.Rl[1] - 2, st.Rl[2]], 0.004)); }
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
    if (st.task === 'pack'){ const bin = W(0.15, 0, (st.binR || -0.5) * 1.15); drawN(PM.icebin, chain(M4.T(bin[0], bin[1], bin[2]), M4.RY(-h)));
      // the crate on his right with the fish packed in it so far, in layers of three (st.fill); on an open boat the fish go in her tub
      if (!st.crTub){ const C = st.Cr || W(0.58, 0, 0), CM = chain(M4.T(C[0], C[1], C[2]), M4.RY(-st.h)); drawN(PM.fbox, CM); const n = fishy ? Math.round((st.fill || 0) * 9) : 0;
        for (let i = 0; i < n; i++) drawN(fishOf(st.csp ? st.csp(i) : 'torsk'), chain(CM, M4.T(-0.24 + (i % 3) * 0.24, 0.07 + Math.floor(i / 3) * 0.06, (hash(i * 5) - 0.5) * 0.06), M4.RY(Math.PI / 2 + (i % 2 ? Math.PI : 0)), M4.RZ(Math.PI / 2), M4.S(0.4)));
        if (n > 0) drawN(PM.icebit, chain(CM, M4.T(0, 0.1 + Math.floor((n - 1) / 3) * 0.06, 0), M4.S(14, 1.2, 7))); }
      if (st.blade){ const G = hands[1], B = st.blade, dx = B[0] - G[0], dz = B[2] - G[2], yaw = Math.atan2(dx, -dz); drawN(PM.broom, limbM(G, B, 0.018));
        const BM = chain(M4.T(B[0], B[1], B[2]), M4.RY(-yaw), M4.RZ(st.tip * 1.1)); drawN(PM.shovel, BM); if (st.full) drawN(PM.scoop, chain(BM, M4.T(0, 0.01, 0)));
        const box = st.Cr || W(0.15, 0, 0.62);
        if (st.tip > 0.05) for (let i = 0; i < 10; i++){ const q = (st.c - 0.55) / 0.2 * 1.4 - hash(i) * 0.4; if (q < 0 || q > 1) continue;
          drawN(PM.icebit, M4.T(B[0] + (box[0] - B[0]) * q * 0.4 + (hash(i + 3) - 0.5) * 0.18, B[1] - q * q * Math.max(0, B[1] - box[1] - 0.3), B[2] + (box[2] - B[2]) * q * 0.4 + (hash(i + 9) - 0.5) * 0.18)); } } }
    // the full box in his arms on the way to the hatch, and lowered into the hold there
    if ((st.task === 'carry' && st.crate) || st.task === 'stow'){ const s2 = st.s || 0, down = st.task === 'stow' ? clamp((s2 - 1.3) / 0.8, 0, 1) : 0;
      if (s2 < 2.15 || st.task === 'carry'){ const c = [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2 - 0.12 - down * 0.8, (hands[0][2] + hands[1][2]) / 2], CM = chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2));
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
    if (st.task === 'ice'){ const G = hands[1], B = st.blade, dx = B[0] - G[0], dz = B[2] - G[2], yaw = Math.atan2(dx, -dz);
      drawN(PM.broom, limbM(G, B, 0.018));
      const BM = chain(M4.T(B[0], B[1], B[2]), M4.RY(-yaw), M4.RZ(st.tip * 1.1)); drawN(PM.shovel, BM); if (st.full) drawN(PM.scoop, chain(BM, M4.T(0, 0.01, 0)));
      const bin = W(0.15, 0, -0.62), box = W(0.15, 0, 0.62); drawN(PM.icebin, chain(M4.T(bin[0], bin[1], bin[2]), M4.RY(-h))); drawN(PM.icebox, chain(M4.T(box[0], box[1], box[2]), M4.RY(-h)));
      // the ice falls from the shovel into the box as it tips
      if (st.tip > 0.05) for (let i = 0; i < 10; i++){ const q = (st.c - 0.55) / 0.2 * 1.4 - hash(i) * 0.4; if (q < 0 || q > 1) continue;
        drawN(PM.icebit, M4.T(B[0] + (box[0] - B[0]) * q * 0.4 + (hash(i + 3) - 0.5) * 0.18, B[1] - q * q * Math.max(0, B[1] - box[1] - 0.3), B[2] + (box[2] - B[2]) * q * 0.4 + (hash(i + 9) - 0.5) * 0.18)); } }
    if (st.task === 'carry' || st.task === 'stack'){ const c = [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2 - 0.1, (hands[0][2] + hands[1][2]) / 2]; drawN(PM.fbox, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2))); }
    if (st.task === 'sweep'){ const top = hands[0], KH = pz('kosthode'), foot = [top[0] + F[0] * 0.55, y - eye[1] + (KH ? 0.108 : 0.02), top[2] + F[1] * 0.55]; drawN(PM.broom, limbM(top, foot, 0.02));
      if (KH) drawN(KH, chain(M4.T(foot[0], foot[1], foot[2]), M4.RY(-h))); else drawN(PM.fbox, chain(M4.T(foot[0], foot[1], foot[2]), M4.RY(-h), M4.S(0.5))); }
    if (st.task === 'hose'){ const nz = hands[0], RL = st.deck ? pz('spole') : null; if (RL){ const q = W(0.12, 0, 0.62); drawN(RL, atH([q[0], y - eye[1], q[2]], M4.RY(Math.PI / 2))); }
      drawN(PM.hose, limbM(RL ? W(0.12, 0.3, 0.5) : W(-0.4, 0.05, 0.4), nz, 0.025));
      if (st.deck) for (let i = 0; i < 24; i++){ const q = ((t * 1.3 + i / 24) % 1), d = q * 1.4; DKWATER.push([nz[0] + F[0] * d + (hash(i) - 0.5) * 0.15 * q, nz[1] + d * 0.2 - q * q * 1.2, nz[2] + F[1] * d + (hash(i + 7) - 0.5) * 0.15 * q]); }
      let k = 0; for (let i = 0; i < 40; i++){ const q = ((t * 1.3 + i / 40) % 1), d = q * 1.6; PB[k * 3] = nz[0] + F[0] * d + (hash(i) - 0.5) * 0.15 * q; PB[k * 3 + 1] = nz[1] + d * 0.25 - q * q * 1.3; PB[k * 3 + 2] = nz[2] + F[1] * d + (hash(i + 7) - 0.5) * 0.15 * q; PA[k] = 0.7 * (1 - q); k++; }
      P.spray = k; } 
  }
