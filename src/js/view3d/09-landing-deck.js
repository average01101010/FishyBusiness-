  // ---------- landing the catch ----------
  // The crane lifts the boxes (on pallets) or the tubs from the deck to the quay, the forklift takes two loads at a time into the
  // plant, and the people on the quay have their jobs: one signals at the edge, one takes the loads, one counts at the door and the
  // crane driver works the radio remote. It all follows the simulation's landing timeline (LANDING, game minutes), so the last load
  // is ashore when the landing note comes.
  const HOOK_UP = QTOP + 3.9;
  const ease = u => u * u * (3 - 2 * u), seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
  const loadH = (kind, nb) => kind === 'tub' ? 0.85 : 0.13 + Math.ceil(nb / 3) * 0.29;
  const craneIdle = (P, T) => ({a:Math.atan2(P.u[0], P.u[1]) + Math.sin(T * 0.05) * 0.25, r:5.5, hook:QTOP + 3.2});
  // the forklift at rest: at its spot east of the drop spot, forks towards it
  const fkRest = P => { const R = fkRun(P); return {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]}; };
  const poseTo = (P, x, z, hook) => ({a:Math.atan2(x - P.crane[0], z - P.crane[1]), r:Math.max(1.5, Math.hypot(x - P.crane[0], z - P.crane[1])), hook});
  const poseMix = (A, B, k) => ({a:A.a + angDiff(A.a, B.a) * k, r:A.r + (B.r - A.r) * k, hook:A.hook + (B.hook - A.hook) * k});
  const tipOf = (P, q) => craneGeo(P, q).tip;
  // where the loads stand on deck, in the boat's frame (x to starboard, z aft); the first slot is the next to go up
  function deckSlots(kind){
    const G = GEO(vtype()), d = G.deck || {y:G.gw, z:(G.stern || 3) * 0.5};
    return kind === 'tub' ? [[0.65, d.y, d.z - 0.55], [-0.65, d.y, d.z - 0.55], [0.65, d.y, d.z + 0.55], [-0.65, d.y, d.z + 0.55]] : [[0, d.y, d.z - 0.45], [0, d.y, d.z + 0.45]];
  }
  // the forklift's run on the unit's route: from its spot east of the drop spot forward to the loads, lift, on round a quarter turn to
  // the door's line and in through the door, set down, and back the same way in reverse. The route keeps the truck's corners well
  // inside the deck (unittest.py checks it). Its speed is set so a run takes at most two lifts.
  function fkRun(P){
    if (P.run) return P.run;
    const T = unitModel(P.unit.v).A.truck, W = q => unitW(P.unit, q[0], q[2]), c = T.arc, r = T.r;
    const arc = []; for (let k = 0; k <= 8; k++){ const a = Math.PI / 2 * k / 8; arc.push(W([c[0] - r * Math.sin(a), 0, c[2] + r * Math.cos(a)])); }
    const wait = W(T.wait), pick = W(T.pick), inn = W(T.in), inPath = [pick, ...arc, inn], outPath = [...inPath].reverse().concat([wait]);
    const hd = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])), plen = pts => pts.reduce((s, q, i) => i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0, 0);
    const legs = [{kind:'go', pts:[wait, pick], rev:false}, {kind:'pick', pts:[pick], h:hd(wait, pick), dur:0.35}, {kind:'go', pts:inPath, rev:false},
      {kind:'drop', pts:[inn], h:hd(arc[8], inn), dur:0.3}, {kind:'go', pts:outPath, rev:true}];
    for (const g of legs) g.len = plen(g.pts);
    const dist = legs.reduce((s, g) => s + g.len, 0), vG = Math.max(20, dist / 3.95);   // metres per game minute
    let t = 0; for (const g of legs){ g.t0 = t; g.dur = g.dur || g.len / vG; t += g.dur; }
    return P.run = {legs, T:t, Wp:wait, waitH:hd(wait, pick), inn};
  }
  // where a leg of the run puts the truck at w (0-1): moving off and pulling up gently, facing the way it drives (or the other way
  // when it reverses)
  function legAt(g, w){
    if (g.kind !== 'go'){ const q = g.pts[0]; return {x:q[0], z:q[1], h:g.h}; }
    let s = ease(w) * g.len;
    for (let i = 1; i < g.pts.length; i++){ const a = g.pts[i - 1], b = g.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s > L && i < g.pts.length - 1){ s -= L; continue; }
      const k = L ? clamp(s / L, 0, 1) : 0, dx = b[0] - a[0], dz = b[1] - a[1]; return {x:a[0] + dx * k, z:a[1] + dz * k, h:g.rev ? Math.atan2(-dx, dz) : Math.atan2(dx, -dz)}; }
    const q = g.pts[g.pts.length - 1]; return {x:q[0], z:q[1], h:0};
  }
  // everything a landing shows at game minute gt: the crane's pose and what hangs from it, the loads on deck and on the quay,
  // the forklift, and where the people stand and what they do. null when this plant is not landing the boat you are on.
  function landScene(P, T, BMrel, eye){
    const b = S.boat, L = b.land; if (!L || L.pid !== P.id || b.status !== 'port' || b.port !== P.id || !BMrel) return null;
    const Lg = LANDING, pr = Lg.prep, lf = Lg.lift, n = L.lifts, e = S.t + currentFrac() - L.t0, hk = Lg.hooked;
    const nb = j => L.kind === 'tub' ? 1 : Math.min(Lg.perLift, L.n - Lg.perLift * j), hh = j => loadH(L.kind, nb(j)), mesh = j => L.kind === 'tub' ? PM.tub : PM.palN[nb(j)];
    const slots = deckSlots(L.kind), wpos = q => { const r = xf(BMrel, q); return [r[0] + eye[0], r[1] + eye[1], r[2] + eye[2]]; }, K = wpos(slots[0]), D = P.drop;
    const pd = poseTo(P, D[0], D[1], HOOK_UP), pk = poseTo(P, K[0], K[2], HOOK_UP), idle = craneIdle(P, T), tR = j => pr + (j + hk) * lf;
    let pose, hang = null, i = -1, u = 0;
    if (e < pr) pose = poseMix(idle, pk, ease(seg(e, 0, pr)));   // straight over to the first load
    else if (e < pr + n * lf){
      i = Math.min(n - 1, Math.floor((e - pr) / lf)); u = (e - pr) / lf - i;
      const yk = K[1] + hh(i) + 0.1, yd = QTOP + (i % 2 ? hh(i - 1) : 0) + hh(i) + 0.1;
      if (u < 0.18) pose = i === 0 ? pk : poseMix(pd, pk, ease(seg(u, 0, 0.18)));
      else if (u < 0.32) pose = {...pk, hook:HOOK_UP + (yk - HOOK_UP) * ease(seg(u, 0.18, 0.32))};
      else if (u < 0.42) pose = {...pk, hook:yk};
      else if (u < 0.56) pose = {...pk, hook:yk + (HOOK_UP - yk) * ease(seg(u, 0.42, 0.56))};
      else if (u < 0.74) pose = poseMix(pk, pd, ease(seg(u, 0.56, 0.74)));
      else if (u < hk) pose = {...pd, hook:HOOK_UP + (yd - HOOK_UP) * ease(seg(u, 0.74, hk))};
      else if (u < 0.93) pose = {...pd, hook:yd};
      else pose = {...pd, hook:yd + (HOOK_UP - yd) * ease(seg(u, 0.93, 1))};
      if (u >= 0.37 && u < hk) hang = {mesh:mesh(i), h:hh(i)};
    } else pose = poseMix(pd, idle, ease(seg(e, pr + n * lf, pr + n * lf + 1.5)));
    // on deck: the loads not yet hooked on, as many as there are slots (the rest are below in the hold)
    const onHook = clamp(Math.floor((e - pr) / lf - 0.37) + 1, 0, n), deck = [];
    for (let s = 0; s < slots.length && onHook + s < n; s++) deck.push({mesh:mesh(onHook + s), at:slots[s]});
    // the forklift takes lifts 2k and 2k+1 on run k, after the second is down; loads wait on the quay until it picks them up
    const R = fkRun(P), runs = Math.ceil(n / 2), start = k => tR(Math.min(2 * k + 1, n - 1)) + 0.1, pickAt = k => start(k) + R.legs[1].t0;
    const quay = []; let fk = {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]};
    for (let j = 0; j < n; j++){ const k = j >> 1; if (e >= tR(j) && e < pickAt(k)) quay.push({mesh:mesh(j), y:QTOP + (j % 2 ? hh(j - 1) : 0)}); }
    for (let k = runs - 1; k >= 0; k--){ const t = e - start(k); if (t < 0) continue; if (t >= R.T) break;
      const g = R.legs.find(q => t < q.t0 + q.dur) || R.legs[R.legs.length - 1], w = clamp((t - g.t0) / g.dur, 0, 1), gi = R.legs.indexOf(g), q = legAt(g, w);
      const loads = [2 * k, 2 * k + 1].filter(j => j < n).map(j => ({mesh:mesh(j), h:hh(j)}));
      fk = {x:q.x, z:q.z, h:q.h, fl:g.kind === 'pick' ? w : g.kind === 'drop' ? 1 - w : gi === 2 ? 1 : 0, loads:gi >= 1 && gi <= 3 ? loads : []};
      break; }
    // the people: stations and jobs
    const hdg = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), tip = tipOf(P, pose);
    // at the unit's stations, clear of the forklift's route: one signals at the edge, one takes the loads, one counts by the door, one
    // works the crane's remote
    const s0 = P.ws.signal, s1 = P.ws.receive, s2 = P.ws.tally, s3 = P.ws.remote;
    const moving = i >= 0 && (u < 0.18 || (u >= 0.42 && u < 0.74)), recv = i >= 0 && u >= 0.74 && u < hk ? 'guide' : i >= 0 && u >= hk && u < 0.93 ? 'unhook' : 'look';
    const busy = [{x:s0[0], z:s0[1], h:seaH, task:moving ? 'signal' : 'look'}, {x:s1[0], z:s1[1], h:hdg(s1, D), task:recv}, {x:s2[0], z:s2[1], h:hdg(s2, D), task:'tally'}, {x:s3[0], z:s3[1], h:hdg(s3, [tip[0], tip[2]]), task:'remote'}].map(q => ({...q, walk:false, s:0}));
    return {e, i, u, pose, hang, deck, quay, fk, busy, K, slewD:Math.atan2(D[0] - P.crane[0], D[1] - P.crane[1])};
  }
  // walking over when a job moves: a person or the forklift that has to be somewhere else walks (drives) there instead of jumping
  function follow(P, key, st, T, v){
    const m = P.fol || (P.fol = {}), w = m[key];
    if (!w || T - w.T > 1.5 || T < w.T){ m[key] = {x:st.x, z:st.z, T, go:false}; return st; }
    const dt = T - w.T, dx = st.x - w.x, dz = st.z - w.z, d = Math.hypot(dx, dz); w.T = T;
    if (d > 3) w.go = true;
    if (!w.go || d < v * dt + 0.05){ w.x = st.x; w.z = st.z; w.go = false; return st; }
    w.x += dx / d * v * dt; w.z += dz / d * v * dt; return {...st, x:w.x, z:w.z, h:Math.atan2(dx, -dz), task:st.fl !== undefined ? st.task : 'walk', walk:true, s:0};
  }
  function drawPlant(P, eye, VP, T, BMrel){
    nSetup(VP);
    const rel = (x, y, z) => [x - eye[0], y - eye[1], z - eye[2]], night = env.night > 0.3, hr = gDate(S.t / 60).getUTCHours(), LS = landScene(P, T, BMrel, eye), onShift = !!LS || (hr >= 6 && hr < 22);
    P.scene = LS;
    const dt = P.pT ? clamp(T - P.pT, 0, 0.5) : 0; P.pT = T;
    const pose = LS ? LS.pose : craneIdle(P, T), FK = LS ? LS.fk : fkRest(P), U = P.unit, A = unitModel(U.v).A;
    // the roller door (on a sensor) rolls up as the forklift turns in towards it, is open before the forks reach it, and rolls down
    // as it backs out
    const [, fz] = unitL(U, FK.x, FK.z), pz = A.truck.pick[2], az = A.truck.arc[2]; P.doorK = ease(clamp((pz - fz) / (pz - az), 0, 1));
    // the ice chute swings out over the boat's hold while ice runs, and back along the quay after
    const b = S.boat, gt = S.t + currentFrac(), icing = b.iceUntil > gt && b.status === 'port' && b.port === P.id && BMrel, ax = A.silo.axis;
    let chW = P.chRest;
    if (icing){ const c = xf(BMrel, [0, 0, 0]), C = [c[0] + eye[0], c[2] + eye[2]], fw = [Math.sin(bv.head), -Math.cos(bv.head)], Lb = (VESSELS[vtype()] || {len:6}).len, sw = unitW(U, ax[0], ax[2]);
      const k = clamp((sw[0] - C[0]) * fw[0] + (sw[1] - C[1]) * fw[1], -Lb / 3, Lb / 3), [tx, tz] = unitL(U, C[0] + fw[0] * k, C[1] + fw[1] * k); chW = Math.atan2(tx - ax[0], tz - ax[2]); }
    P.chA = P.chA === undefined ? P.chRest : P.chA + clamp(angDiff(P.chA, chW), -0.35 * dt, 0.35 * dt);
    const r = drawUnitParts(P, eye, pose, FK, P.doorK, P.chA, LS ? T : null);   // (the driver is on the forklift while it works a landing)
    if (LS && LS.hang){ const h = LS.hang.h, t = rel(r.tip[0], pose.hook - 0.1 - h, r.tip[2]); drawN(LS.hang.mesh, chain(M4.T(t[0], t[1], t[2]), M4.RY(pose.a))); }
    if (LS){
      for (const q of LS.deck) drawN(q.mesh, chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2])));
      for (const q of LS.quay){ const c = rel(P.drop[0], q.y, P.drop[1]); drawN(q.mesh, chain(M4.T(c[0], c[1], c[2]), M4.RY(LS.slewD))); }
    }
    // people: the day shift, or one on watch at night; everyone turns out for a landing
    const R = plantRounds(P); P.spray = 0;
    for (let i = 0; i < 4; i++){ if (!onShift && i !== 3) continue; drawWorker(P, follow(P, 'w' + i, LS ? LS.busy[i] : roundAt(R[i], T + i * 17), T, 1.6), eye, T, i); }
    // ice from the chute's spout down into the boat
    if (icing && Math.abs(angDiff(P.chA, chW)) < 0.15){
      const G = GEO(vtype()), dy = xf(BMrel, [0, (G.deck || {y:G.gw}).y, 0])[1] + eye[1], L = A.silo.chute, O = unitP(U, [ax[0] + Math.sin(P.chA) * L, ax[1] + A.silo.spout, ax[2] + Math.cos(P.chA) * L]), fall = Math.max(0.5, O[1] - dy);
      let k = P.spray; for (let i = 0; i < 70; i++){ const q = (T * 1.6 + i / 70) % 1, rr = 0.12 + 0.1 * q; PB[k * 3] = O[0] + (hash(i) - 0.5) * rr - eye[0]; PB[k * 3 + 1] = O[1] - q * q * fall - eye[1]; PB[k * 3 + 2] = O[2] + (hash(i + 31) - 0.5) * rr - eye[2]; PA[k] = 0.85; k++; }
      P.spray = k; }
    return {night, spray:P.spray, lamps:P.lamps.map(L => rel(L[0], L[2] - 0.12, L[1]))};
  }
  // the coast's plants (06b-coastports.js) are laid out when the eye comes within 1.5 km and their ground is in (the berths read it)
  const PLANT_TRIED = new Set();
  function plantsCoast(eye){
    for (const U of UNITA){
      if (!U.coastal || U.sted || PLANT_TRIED.has(U.id) || Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]) > 1500) continue;
      const pt = portById(U.id); if (!pt || !mapReadyAt(pt.p, 0.3)) continue; PLANT_TRIED.add(U.id);
      try { const P = plantLayout(pt); if (!P) continue; PLANTS.push(P); const ry = Math.atan2(U.n[0], U.n[1]);
        for (const [cx, cz, sx, sz, y0, y1] of unitModel(U.v).A.solids){ const c = unitW(U, cx, cz); camSolid(c[0], c[1], sx, sz, ry, y0, y1); } } catch (e){ console.error(e); }
    }
  }
  function nearestPlant(eye){ plantsCoast(eye); let best = null, bd = 900; for (const P of PLANTS){ const d = Math.hypot(P.drop[0] - eye[0], P.drop[1] - eye[2]); if (d < bd){ bd = d; best = P; } } return best; }

  // ---------- work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there ----------
  let DECKACT = {on:false}, DKGULL = null;   // DKGULL: where the old bait goes over the rail from the stripping (world), for the gulls
  function deckActivity(){
    const b = S.boat; if (!b || b.land || typeof deckHands !== 'function' || !S.hold || !S.hold.length) return {on:false};
    if (!waNow().some(p => p.st === 'sloy' || p.st === 'is') || deckPending() < 0.5) return {on:false};
    // who stands on the deck work (13-work.js workAssign): the skipper when alone or when the work chains put him there, and one of the crew
    // at the tub when they are on it too (tilbakemelding #42: with both on «Sløying» the skipper was left at the wheel while the one hand
    // gutted alone)
    const alone = handsAboard() === 1, WA = !alone && typeof workAssign === 'function' ? waNow().filter(p => p.st === 'sloy' || p.st === 'is') : [];
    return {on:true, alone, me:alone || WA.some(p => !p.c), crew:WA.some(p => p.c), task:catchGut() && S.hold.some(x => !x.gut && !x.iced) ? 'gut' : 'ice'};
  }
  // ---------- the deck kit (the user's wish 19.10.2026, tools/deck/*.py): the fish tubs, the gaff and the knife, the gutting table and
  // bench, the line tubs and the net in its tub, the crates, each a part of its own GLB (src/data/deck-*.b64) drawn like the fish; a part
  // the page does not have leaves the old block in its place ----------
  const KITF = {fish:'deck-fish', rig:'deck-rig', crane:'deck-crane', safe:'deck-safety', anchor:'deck-anchor', pause:'deck-pause'}, KITM = {}, KITX = {};
  function kit(f, nm){ const k = f + ':' + nm; if (k in KITM) return KITM[k]; let m = null; const t = KITF[f];
    if (typeof glbHas === 'function' && glbHas(t)){ const o = glbPart(t, nm); if (o) m = {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}; }
    return KITM[k] = m; }
  function kitX(f){ if (f in KITX) return KITX[f]; const t = KITF[f], G = typeof glbHas === 'function' && glbHas(t) ? glbLoad(t) : null; return KITX[f] = (G && G.ex) || {}; }
  // a rigid tool held at A with its head (the part's -z) along dir
  // ---- the hands in their grips (tools/harbour/hender.py): the meshes once for all the figures (the glove is the same on every look),
  // and where each grip holds its thing (the worker GLB's extras 'hands': per grip and side, the point and the axis in the hand's frame) ----
  let HANDM = null;
  function handMeshes(){
    if (HANDM !== null) return HANDM; const g = n => { const o = wkPart(n, 'crew'); return o ? upA(o) : null; }, GR = ['relax', 'flat', 'grip', 'hold', 'pinch', 'hook'];
    const Rm = {}, Lm = {}; for (const k of GR){ Rm[k] = g('hR_' + k); Lm[k] = g('hL_' + k); }
    const ex = (glbLoad('worker') || {}).ex || {};
    return HANDM = Rm.relax && Lm.relax && ex.hands ? {R:Rm, L:Lm, lo:g('hand_lo') || g('hand'), tape:g('tape_L'), grip:ex.hands} : false;
  }
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  // a hand's frame [x, y, z]: the fingers along z, the palm toward y, x = y × z (the thumb at +x on the right hand, -x on the left).
  // Holding a handle (sp.a, its axis) the fist closes across it: x along the handle, the thumb toward a tool's head (sp.tool) or the
  // palm toward sp.n; otherwise the palm turned toward sp.n, the wrist bending to lay a flat hand flat
  function handFrame(z0, sp, side){
    if (sp.a){ const a = nrm3(sp.a), z = nrm3(sub3(z0, mul3(a, dot3(z0, a)))); let x = a, y = crs3(z, a);
      if (sp.tool ? side < 0 : sp.n && dot3(y, sp.n) < 0){ x = mul3(a, -1); y = mul3(y, -1); } return [x, y, z]; }
    const n = nrm3(sp.n), z = nrm3(sub3(z0, mul3(n, dot3(z0, n) * (sp.g === 'flat' ? 1 : 0.6)))), y = nrm3(sub3(n, mul3(z, dot3(n, z))));
    return [crs3(y, z), y, z]; }
  const inFrame = (Fr, v) => [Fr[0][0] * v[0] + Fr[1][0] * v[1] + Fr[2][0] * v[2], Fr[0][1] * v[0] + Fr[1][1] * v[1] + Fr[2][1] * v[2], Fr[0][2] * v[0] + Fr[1][2] * v[1] + Fr[2][2] * v[2]];
  const handMtx = (Fr, o) => new Float32Array([Fr[0][0], Fr[0][1], Fr[0][2], 0, Fr[1][0], Fr[1][1], Fr[1][2], 0, Fr[2][0], Fr[2][1], Fr[2][2], 0, o[0], o[1], o[2], 1]);
  // what each hand does in each pose: the grip, the way the palm faces (n) or the axis held (a), as directions in the figure's frame
  // (forward, up, right); the knife's way (st.kd) is set here for the props after
  function handSpecs(st, F, R, hands){
    const D = (a, u, r) => [F[0] * a + R[0] * r, u, F[1] * a + R[1] * r], IN = s => D(0.15, -0.35, -s), dn = D(0, -1, 0), up = D(0, 1, 0);
    const rel = (g, n) => ({g, n}), both = (g, n) => [rel(g, n || IN(1)), rel(g, n || IN(-1))], across = () => sub3(hands[0], hands[1]);
    const knife = d => { st.kd = d; return {g:'grip', a:d, tool:true}; };
    if (st.gone) return both('relax');
    switch (st.task){
      case 'cut': return [knife(D(0.2, -1, 0.2)), rel('relax', D(-1, 0.3, 0))];
      case 'slip': return [rel('flat', D(1, -0.5, 0)), rel('flat', D(1, -0.5, 0))];
      case 'door': return [{g:'grip', a:up, n:D(0, 0, -1)}, rel('relax', IN(-1))];
      case 'lean': return [rel('flat', dn), rel('flat', dn)];
      case 'seasick': return [{g:'grip', a:D(0, 0, 1), n:D(0.4, -1, 0)}, {g:'grip', a:D(0, 0, 1), n:D(0.4, -1, 0)}];
      case 'jig': return [rel('hook', D(0, -0.6, -1)), rel('pinch', dn)];
      case 'haul': return [{g:'grip', a:D(0.3, 1, 0), n:IN(1)}, {g:'grip', a:D(0.3, 1, 0), n:IN(-1)}];
      case 'helm': case 'helmsit': case 'drive': return [{g:'grip', a:up, n:D(0.3, 0, -1)}, {g:'grip', a:up, n:D(0.3, 0, 1)}];
      case 'coffee': return [{g:'hold', a:up, n:IN(1)}, rel('relax', IN(-1))];
      case 'phone': return [rel('hold', D(-0.2, 0.6, -1)), rel('hold', D(-0.2, 0.6, 1))];
      case 'binoc': return [rel('hold', D(0, 0, -1)), rel('hold', D(0, 0, 1))];
      case 'smoke': return [rel('pinch', D(-0.5, -0.2, -0.8)), st.lean === false || !st.rail ? rel('relax', IN(-1)) : rel('flat', dn)];
      case 'snus': return [rel('pinch', D(-0.4, 0, -0.9)), rel('hold', up)];
      case 'lunch': return [rel('pinch', D(-0.4, 0, -0.9)), rel('hold', up)];
      case 'sit': return both('relax', dn);
      case 'back': case 'worry': return [rel('relax', D(-1, 0, 0)), rel('relax', D(-1, 0, 0))];
      case 'chat': return hands[0][1] > hands[1][1] + 0.1 ? [rel('relax', D(0.3, 0.8, -0.5)), rel('relax', IN(-1))] : [rel('relax', D(-1, 0, 0)), rel('relax', D(-1, 0, 0))];
      case 'gear': case 'tend': case 'pack': return both('hold', dn);
      case 'knife': return [knife(D(0, 0.15, -1)), {g:'grip', a:st.steel ? st.steel.dir : up, tool:true}];
      case 'sweep': case 'hose': case 'ice': { const a = across(); return [{g:'grip', a, n:IN(1)}, {g:'grip', a, n:IN(-1)}]; }
      case 'coil': return [{g:'hook', a:D(0, 0, 1), n:D(0, -0.5, -1)}, rel('hold', up)];
      case 'stack': case 'carry': case 'stow': return [{g:'hook', a:D(1, 0, 0), n:IN(1)}, {g:'hook', a:D(1, 0, 0), n:IN(-1)}];
      case 'gut': return [knife([F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]), rel('hook', dn)];
      case 'bleedst': return [knife([F[0] * 0.5 - R[0] * 0.2, -0.75, F[1] * 0.5 - R[1] * 0.2]), rel('relax', IN(-1))];
      case 'bleed': return [st.knife ? knife([F[0] * 0.7 - R[0] * 0.35, -0.55, F[1] * 0.7 - R[1] * 0.35]) : rel('hook', dn), rel('hook', D(0, -0.6, 1))];
      case 'gutw': return [st.knife ? knife(st.kdir || [F[0] * 0.3 - R[0] * 0.6, -0.55, F[1] * 0.3 - R[1] * 0.6]) : rel('hold', dn), st.gf && st.gf.hang ? rel('hook', D(0, -0.6, 1)) : rel('flat', dn)];
      case 'gaff': return st.gaff ? [{g:'grip', a:st.gaff.n, n:IN(1)}, {g:'grip', a:st.gaff.n, n:IN(-1)}] : both('relax');
      case 'pick': return [rel('pinch', IN(1)), rel('hook', D(0, -0.5, 1))];
      case 'jigup': return [rel('hook', dn), {g:'grip', a:up, n:IN(-1)}];
      case 'egn': case 'strip': case 'tally': return [rel('pinch', IN(1)), rel('hold', up)];
      case 'mend': return [rel('pinch', IN(1)), rel('hook', D(0, -0.5, 1))];
      case 'signal': return [rel('relax', D(1, 0, 0)), rel('relax', IN(-1))];
      case 'guide': return [rel('flat', D(1, 0, 0)), rel('flat', D(1, 0, 0))];
      case 'unhook': return [{g:'grip', a:up, n:IN(1)}, rel('relax', IN(-1))];
      case 'remote': return [rel('hold', D(-0.3, 0.6, -1)), rel('hold', D(-0.3, 0.6, 1))];
      case 'nozzle': return [{g:'grip', a:D(1, -0.5, 0), n:IN(1)}, {g:'grip', a:D(1, -0.5, 0), n:IN(-1)}];
      case 'aurora': return both('relax');
      default: return both('relax');
    }
  }
  function toolM(A, dir){ const l = Math.hypot(dir[0], dir[1], dir[2]) || 1; return limbM(A, [A[0] - dir[0] / l, A[1] - dir[1] / l, A[2] - dir[2] / l], 1); }
  // the catch coming aboard: a jigged fish is taken off at the rail, bled with the knife and tossed into the bleeding tub ('bleed'); on a
  // longline the hand at the hauler takes each fish in over the rail with the gaff and shakes it off into the tub ('gaff'). Each fish is
  // an event at its place on the rail (boat frame); the nearest hand at work there plays it (drawWorker), so the fish he handles is the
  // one that came up. DKBLOOD: the drops of the cut, drawn as points after the people.
  const DKEV = [], DKDUR = {bleed:3.0, gaff:2.4, pick:2.4, jigup:2.2}, DKDROP = {gaff:1.75, pick:2.0}, DKBLOOD = [], DKWATER = [], DKSMOKE = [], DKDECK = [], DKF = {t:0, jig:{}}, DKN = {gaff:0, pick:0, jigup:0, bleed:0};   // DKN: the events played (the tests)
  // (o: the rest of it: D where it is let fall on the deck, for the one meant to take it, wait how long it may wait for him, t0 a later start)
  function dkEvent(kind, at, sp, kg, o){ const now = performance.now() / 1000; while (DKEV.length && (DKEV.length > 12 || now - DKEV[0].t0 > (DKEV[0].wait || DKDUR[DKEV[0].kind]) + 4)) DKEV.shift(); const e = {kind, at:at.slice(), sp, kg, t0:now, who:null}; if (o) Object.assign(e, o); DKEV.push(e); return e; }
  // which events a hand at his work plays (the agents' tasks, deckcrew.js): the hauler gaffs the fish in, the one at the net picks them out,
  // the jigger hauls them up by hand, the bleeder bleeds; each bleeds his own fish when nobody else is there to do it
  const DKPLAY = {jig:['bleed', 'jigup'], coil:['gaff'], haul:['gaff', 'bleed'], pick:['pick', 'bleed'], bleedst:['bleed']};
  // the event for a hand standing at boat-frame point p doing task (one given to him, else the nearest of its kinds within 3 m; once
  // taken it stays his, and one that waited for him starts when he takes it)
  function dkFor(who, p, task){ const now = performance.now() / 1000, kinds = DKPLAY[task]; if (!kinds) return null;
    let best = null, bd = 3;
    for (const e of DKEV){ if (!kinds.includes(e.kind)) continue; const age = now - e.t0; if (age < 0) continue; if (e.who === who){ if (age <= DKDUR[e.kind]) return e; continue; }
      if (e.who != null || (e.for != null && e.for !== who) || age > (e.wait || DKDUR[e.kind])) continue;
      const d = e.for === who ? -1 : Math.hypot(e.at[0] - p[0], e.at[2] - p[2]); if (d < bd){ bd = d; best = e; } }   // (his own first)
    if (best && !DKEV.some(e => e.who === who && now >= e.t0 && now - e.t0 < DKDUR[e.kind])){ best.who = who; if (best.wait) best.t0 = now; DKN[best.kind]++; return best; } return null; }
  // an event as the hand sees it (eye-relative points): the rail where it came in (or the deck where it lies), the fish down by the hull
  // or in the water, and where it goes (the deck where the hauler shakes it off, else the bleeding tub)
  function dkEv(e, BMrel, G){ const sg = e.at[0] >= 0 ? 1 : -1; return {k:performance.now() / 1000 - e.t0, sp:e.sp, kg:e.kg, deck:!!e.deckF, R:xf(BMrel, e.deckF ? [e.at[0], e.at[1] - 0.06, e.at[2]] : e.at), W:xf(BMrel, e.Wat || [e.at[0] + sg * 0.6, e.at[1] - 1.15, e.at[2]]), U:xf(BMrel, e.D || dkTub(G)), D:e.D ? xf(BMrel, e.D) : null}; }
  // the real catch as it comes aboard (window.CATCHQ: the fishing step, the haul's slices, the rod), the stale left out
  function catchQ(){ const Q = window.CATCHQ || (window.CATCHQ = []), now = performance.now(); while (Q.length && (now - Q[0].t > 15000 || Q.length > 12)) Q.shift(); return Q; }
  // the fish across the deck (deckcrew.js places): when a gaff or a pick lets it fall at the drop, it lies there until the bleeder takes it
  // up (else the one who brought it in, who is then the bleeder); a hand-jigged fish is bled by the one who jigged it
  // a fish still waiting to be taken in or bled (the next one comes when it has been; one nobody took in time is let go)
  const dkWaits = () => { const now = performance.now() / 1000; return DKDECK.length > 0 || DKEV.some(e => e.who == null && (e.kind === 'gaff' || e.kind === 'pick' || (e.kind === 'bleed' && e.deckF)) && now - e.t0 <= (e.wait || DKDUR[e.kind])); };
  function dkTick(){
    const now = performance.now() / 1000;
    for (let i = DKEV.length - 1; i >= 0; i--){ const e = DKEV[i]; if (now - e.t0 > (e.who == null ? e.wait || DKDUR[e.kind] : DKDUR[e.kind]) + 4) DKEV.splice(i, 1); }
    for (const e of DKEV){ if (e.who == null || e.chained) continue; const age = now - e.t0;
      if ((e.kind === 'gaff' || e.kind === 'pick') && e.D && age >= DKDROP[e.kind]){ e.chained = true;
        const bl = CREW3D.visible().find(a => a.st === 'blogg' && a.mode === 'at'), f = {at:e.D.slice(), sp:e.sp, kg:e.kg, t:now, yaw:hash(Math.floor(now * 7)) * 6.28};
        DKDECK.push(f); dkEvent('bleed', e.D, e.sp, e.kg, {for:bl ? bl.id : e.who, deckF:f, wait:20, t0:now + (bl ? 0.3 : 0.6)}); }
      else if (e.kind === 'jigup' && age >= DKDUR.jigup){ e.chained = true; dkEvent('bleed', e.at, e.sp, e.kg, {for:e.who, wait:12}); }
      else if (e.kind === 'bleed' && e.deckF && age >= 0.3){ e.chained = true; const i = DKDECK.indexOf(e.deckF); if (i >= 0) DKDECK.splice(i, 1); } }
    for (let i = DKDECK.length - 1; i >= 0; i--) if (now - DKDECK[i].t > 24) DKDECK.splice(i, 1);
  }
  function dkBloodDraw(VP){
    // the blood of the bleeding, the water of the deck hose and the smoke of a cigarette (drawWorker), as points after the people
    const pts = (L, col, sz) => { if (!L.length) return; let n = 0; for (const q of L){ if (n >= 300) break; PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = q[3] == null ? 1 : q[3]; n++; } L.length = 0; drawPts(n, gl.POINTS, VP, col, sz, true); };
    if (!DKBLOOD.length && !DKWATER.length && !DKSMOKE.length) return;
    pts(DKBLOOD, [0.42, 0.02, 0.03], 60); pts(DKWATER, [0.8, 0.88, 0.95], 70); pts(DKSMOKE, [0.78, 0.78, 0.76], 34); nSetup(VP); }
  // the gear as it lies on deck (the user's wish 19.10.2026, tools/deck/rigg.py): the nets heaped in a 1000 l tub as high as the share
  // of them aboard; the line coiled in its tubs, side by side, the hooks hung on the rim while it is baited; the old box and tubs where
  // the kit is not in the page
  // where the rig's tubs stand: the model's places (kit.garn, kit.stamps), the hand boats' stack, or by the rail aft
  function rigAt(G, kind, d){ const K = G.kit && G.kit[kind === 'garn' ? 'garn' : 'stamps']; if (K) return {at:K.at, ry:K.ry || 0};
    const sx = G.beam / 2, DZ = d.z - 0.6; return G.hand && SKA.stack ? {at:[SKA.stack[0] + (kind === 'garn' ? 0.1 : 0), d.y, SKA.stack[2]], ry:0} : {at:[sx * (kind === 'garn' ? 0.3 : 0.25), d.y, DZ], ry:0}; }
  // the nets in a blue 460 l tub (tools/deck/rigg.py): the heap sinks as the nets go out and rises as they come in, mounded over the rim
  // when it is full, with the bights of net hanging over the rim then (garn_kant, not scaled)
  function drawNetTub(BMrel, at, fill, ry){ const T = kit('fish', 'kar460b') || kit('fish', 'kar460'), N = kit('rig', 'garn'), NK = kit('rig', 'garn_kant'), M = chain(BMrel, M4.T(at[0], at[1], at[2]), M4.RY(ry || 0));
    if (T && N){ drawN(T, M); if (fill > 0.02) drawN(N, chain(M, M4.S(1, 0.25 + 0.75 * fill, 1))); if (NK && fill > 0.95) drawN(NK, M); return; }
    drawN(GB.bin, chain(M, M4.S(1, 0.3 + 0.7 * fill, 1))); }
  // the line tubs (tools/deck/rigg.py): two across and up to four along from the place, each with its coil, the baited ones with the hooks
  // hung round the rim
  // fill: what each tub has on its rim while the crew work them (1 the hooks all baited, 0 none, between the baited hooks one by one)
  function drawLineTubs(BMrel, at, n, baited, green, ry, fill){ const T = kit('rig', 'stamp'), Lr = kit('rig', green ? 'line_g' : 'line_r'), K = kit('rig', 'kroker'), M0 = chain(BMrel, M4.T(at[0], at[1], at[2]), M4.RY(ry || 0));
    const nMax = (VESSELS[vtype()] || {len:10}).len < 8 ? 4 : 8, HX = (kitX('rig').hooks) || {n:30, r:0.2238, y:0.38, a0:-75, a1:75};   // (four fit between the thwarts of the small open boats)
    for (let i = 0; i < Math.min(nMax, n); i++){
      if (!T){ drawN(GB.tub, chain(M0, M4.T(-(i % 2) * 0.6, Math.floor(i / 2) * 0.33, (Math.floor(i / 2) % 2) * 0.1))); continue; }
      const M = chain(M0, M4.T((i % 2) * 0.52, 0, Math.floor(i / 2) * 0.5), M4.RY(hash(i * 3 + 1) * 6.28)), f = fill && fill[i] != null ? fill[i] : i < baited ? 1 : 0; drawN(T, M); if (Lr) drawN(Lr, M);
      if (K && f >= 0.999) drawN(K, M);
      else if (f > 0 && GB.bait){ const m = Math.round(f * HX.n); if (!BITM.length) for (let j = 0; j < HX.n; j++){ const a = (HX.a0 + (HX.a1 - HX.a0) * j / Math.max(1, HX.n - 1)) * DEG; BITM.push(chain(M4.T(Math.cos(a) * HX.r, HX.y + 0.012, -Math.sin(a) * HX.r), M4.RY(a), M4.S(1.3))); }
        for (let j = 0; j < m && j < BITM.length; j++) drawN(GB.bait, chain(M, BITM[j])); } } }
  const BITM = [];   // the baited hooks on a tub's rim, in the tub's frame (made once)
  // the tubs of a crew job on the line (baiting or stripping) as the job has come: the ones in work in front of those doing them (a batch at a
  // time, one to each), then the ones done, then those waiting
  function jobTubs(j){ const jn = Math.max(1, j.n || 1), X = (typeof jobDone === 'function' ? jobDone(j) : 0) * jn, k = Math.max(1, Math.min(jn, CREW3D.agents().filter(a => a.jw === j && a.mode === 'at').length)), bd = Math.min(jn, Math.floor(X / k) * k), cur = Math.min(k, jn - bd), fr = X / k - Math.floor(X / k), F = [];
    for (let i = 0; i < cur; i++) F.push(fr); for (let i = 0; i < bd; i++) F.push(1); while (F.length < jn) F.push(0); return j.kind === 'strip' ? F.map(v => 1 - v) : F; }
  // a string of nets being mended: spread from its tub over the rail before each one mending, the floats along the rail and the meshes
  // hanging down outside, with the netting needle at work (drawWorker 'mend')
  function drawMendNet(BMrel, G, d, R){
    const gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), top = [R.at[0], R.at[1] + 0.7, R.at[2]], seg = (A, B, r, m) => drawN(m, chain(BMrel, limbM(A, B, r)));
    for (const a of CREW3D.agents()){ if (a.st !== 'mend' || a.mode !== 'at') continue;
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], rp = [a.x + F0[0] * 0.5, a.y + railH + 0.02, a.z + F0[1] * 0.5], P = (u, dn, out) => [rp[0] + R0[0] * u + F0[0] * out, rp[1] - dn, rp[2] + R0[1] * u + F0[1] * out];
      // from the tub to the rail, then the floats along the rail and the meshes over it, down the outside
      for (const u of [-0.45, 0, 0.45]) seg([top[0] + R0[0] * u * 0.4, top[1], top[2] + R0[1] * u * 0.4], P(u, 0, -0.05), 0.006, GB.net);
      seg(P(-0.65, 0, 0.02), P(0.65, 0, 0.02), 0.012, GB.float);
      for (let k = 0; k <= 12; k++){ const u = -0.6 + k * 0.1; seg(P(u, 0, 0.02), P(u + (k % 2 ? 0.02 : -0.02), 0.45, 0.1), 0.007, GB.net); seg(P(u + (k % 2 ? 0.02 : -0.02), 0.45, 0.1), P(u, 0.85, 0.16), 0.007, GB.net); }
      for (const dn of [0.22, 0.45, 0.66]) seg(P(-0.6, dn, 0.02 + dn * 0.17), P(0.6, dn, 0.02 + dn * 0.17), 0.007, GB.net);
      seg(P(-0.62, 0.86, 0.16), P(0.62, 0.86, 0.16), 0.009, GB.net); }
  }
  // the gear aboard when the boat is rigged for it and not working it: the nets left aboard, the line tubs aboard (core/10-gear.js)
  // (and the crew's jobs on it, core/13-work.js: the tubs being baited or stripped stay on deck and show the job's progress, the nets being
  // mended stay in their tub and are spread over the rail where they are mended; Jonas 20.10.2026)
  function drawRigRest(BMrel, G, d){
    const b = S.boat, rig = typeof rigOf === 'function' ? rigOf() : b.rig, sx = G.beam / 2, DZ = d.z - 0.6, K = G.kit || {};
    KST.pots = 0; if (b.gop && b.status === 'fishing') return; if (!GB) buildGear();
    if (rig === 'teiner') KST.pots = drawPotsAboard(BMrel, G, d, ((S.pgear || {}).pots || {}).big || 0);
    const J = (S.jobs || []).filter(j => !j.shop), EJ = J.filter(j => j.kind === 'egn' || j.kind === 'strip'), MJ = J.find(j => j.kind === 'mend'), pg = S.pgear || {};
    if (rig === 'garn' || MJ){ const mend = MJ ? (pg.shore || []).find(x => x.kind === 'mendself' && x.lenke && x.lenke.id === MJ.nid) : null, aboard = (pg.nets || []).reduce((a, l) => a + (l.n || 1), 0) + (mend ? mend.lenke.n || 1 : 0);
      const out = (typeof mySets === 'function' ? mySets() : []).filter(x => x.kind === 'garn').reduce((a, x) => a + (x.n || 0), 0), R = rigAt(G, 'garn', d);
      if (aboard + out > 0) drawNetTub(BMrel, R.at, aboard / (aboard + out), R.ry); if (MJ) drawMendNet(BMrel, G, d, R); }
    if (rig === 'line' || EJ.length){ const L = pg.lines || {}, n = rig === 'line' ? (L.hyse ? L.hyse.n : 0) + (L.bank ? L.bank.n : 0) : 0, bt = rig === 'line' ? (L.hyse ? L.hyse.baited : 0) + (L.bank ? L.bank.baited : 0) : 0;
      // the job's tubs first (they are off the line aboard while it runs, pg.shore 'egnself' and 'stripself', 10-gear.js), then the rest
      const fill = []; for (const j of EJ) fill.push(...jobTubs(j)); for (let i = 0; i < n; i++) fill.push(i < bt ? 1 : 0);
      const R = rigAt(G, 'line', d); if (fill.length) drawLineTubs(BMrel, R.at, fill.length, 0, false, R.ry, fill); }
  }
  // ---- the kit on the model's places (G.kit, from the boat's model; tools/deck): the life-saving gear the rules ask for (V.lsa,
  // 02-species-gear.js lsaOf), the radar that is bought, the freight on deck in crates and the crane. Nothing is drawn where the
  // model has no places or the kit is not in the page.
  const RAFTSZ = c => c <= 4 ? 4 : c <= 6 ? 6 : 12, RADS = {a:0, t:0}, BOYEQ = {}, BOYET = {k:'', top:null, bot:null, cv:null};
  const KST = {raft:0, buoys:0, text:0, radar:0, cargo:0, crane:null, tubs:0, htub:0, pots:0, vt:null, n:0};   // what the last frame drew of the kit, for which boat, and how many frames (the tests read it)
  // the buoy's lettering: the boat's name over the ring and her home port under it, in black block capitals (§ 43)
  function boyeCanvas(txt){
    // (1024 × 116: the strip's own shape on the ring, 0.57 m of arc by 0.065 m, so the letters are not stretched)
    const cv = BOYET.cv || (BOYET.cv = document.createElement('canvas')); cv.width = 1024; cv.height = 116; const g = cv.getContext('2d'); g.clearRect(0, 0, 1024, 116);
    g.fillStyle = '#121212'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 88; const f = () => { g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; }; f();
    while (g.measureText(txt).width > 960 && fs > 24){ fs -= 4; f(); } g.fillText(txt, 512, 62); return cv;
  }
  function boyeTex(){
    const nm = String(S.boatName || '').toUpperCase().slice(0, 22), hp = portById(S.home || HOME0), pn = hp ? String(hp.name).toUpperCase().slice(0, 22) : '', k = nm + '|' + pn; if (!nm) return null;
    if (BOYET.k !== k){ BOYET.k = k; if (!BOYET.top){ BOYET.top = mkTex(); BOYET.bot = mkTex(); } upTex(BOYET.top, boyeCanvas(nm)); upTex(BOYET.bot, boyeCanvas(pn)); }
    return BOYET;
  }
  function boyeQ(){ if (!('q' in BOYEQ)){ const X = kitX('safe'), mk = st => st && st.length > 1 ? texStrip(st.map(p => p[0]), st.map(p => p[1])) : null; BOYEQ.q = [mk(X.boye_strip_top), mk(X.boye_strip_bot)]; } return BOYEQ.q; }
  function drawSafety(BMrel, G, VP, t){
    const K = G.kit; if (!K) return; const V = VESSELS[vtype()], L = V && V.lsa, X = kitX('safe'), b = S.boat, eq = S.equip || {};
    // the raft in its cradle with the hydrostatic release, the smallest size for everyone aboard (§ 38)
    if (L && L.rafts && K.raft){ const z = RAFTSZ(L.cap), R = kit('safe', 'flate' + z), C = kit('safe', 'vugge' + z), fa = (X.flate_at || {})[z] || [0, 0.07, 0];
      for (const q of K.raft.slice(0, L.rafts)){ const M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)); if (C) drawN(C, M); if (R){ drawN(R, chain(M, M4.T(fa[0], fa[1], fa[2]))); KST.raft++; } } }
    // the buoys on their brackets, the first with the light and the line (§ 43: half with a light, one or two with 30 m of line)
    const BM = [];
    if (L && K.buoys){ const H = kit('safe', 'boyeholder'), B = kit('safe', 'livboye'), LT = kit('safe', 'boyelys'), LN = kit('safe', 'boyeline'), at = X.boye_at || [0, -0.3, 0.05];
      K.buoys.slice(0, L.buoys).forEach((q, i) => { const M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)), MB = chain(M, M4.T(at[0], at[1], at[2]));
        if (H) drawN(H, M); if (B){ drawN(B, MB); BM.push(MB); KST.buoys++; } if (LT && i < L.lights) drawN(LT, chain(M, M4.T(0.42, 0.04, 0))); if (LN && i < L.lines) drawN(LN, chain(M, M4.T(-0.44, 0, 0))); }); }
    // the radar that is bought: a dome on the roof or in the mast, or the open array on the mast that turns at 24 rpm while she is out
    // (where the model gives both the same place, the open array stands there when she has both)
    const on = b.status !== 'port' && !b.land; if (on) RADS.a = (RADS.a + Math.max(0, Math.min(0.2, t - RADS.t)) * 2.5) % (Math.PI * 2); RADS.t = t;
    const shared = K.radar && K.radarA && Math.hypot(K.radar[0] - K.radarA[0], K.radar[1] - K.radarA[1], K.radar[2] - K.radarA[2]) < 0.4;
    if (K.radar && eq.radar && !(shared && eq.radarA)){ const D = kit('safe', 'radome'); if (D){ drawN(D, chain(BMrel, M4.T(K.radar[0], K.radar[1], K.radar[2]))); KST.radar = 1; } }
    if (K.radarA && eq.radarA){ const P = kit('safe', 'radar_ped'), A = kit('safe', 'radar_bar4'), ba = X.bar_at || [0, 0.38, 0], M = chain(BMrel, M4.T(K.radarA[0], K.radarA[1], K.radarA[2]));
      if (P) drawN(P, M); if (A){ drawN(A, chain(M, M4.T(ba[0], ba[1], ba[2]), M4.RY(RADS.a))); KST.radar = 2; } }
    if (BM.length){ const T = boyeTex(), q = boyeQ(); if (T && q[0]){ gl.disableVertexAttribArray(2); for (const M of BM){ drawTexQuad(q[0], T.top, M, VP, true, [0, 0.2, 0]); if (q[1]) drawTexQuad(q[1], T.bot, M, VP, true, [0, 0.2, 0]); KST.text++; } nSetup(VP); } }
  }
  // the freight on deck (S.cargo up to the boat's deckCargo, the deck first: 09g-turer.js): a pallet with a wooden crate for each 250 kg at
  // the model's cargo places, then a small crate on top of each
  function cargoUnits(G){ const K = G.kit; if (!K || !K.cargo || !K.cargo.length || typeof cargoKg !== 'function') return 0; const kg = Math.min(cargoKg(), BOAT.deckCargo || 0); return kg > 0 ? Math.min(K.cargo.length * 2, Math.ceil(kg / 250)) : 0; }
  function drawCargo(BMrel, G, hide){
    const K = G.kit, n = cargoUnits(G) - (hide || 0); if (n <= 0) return; KST.cargo = n; const P = kit('rig', 'pall'), C = kit('rig', 'kasse'), CS = kit('rig', 'kasse_s'), m = K.cargo.length;
    for (let i = 0; i < n; i++){ const q = K.cargo[i % m], M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0));
      if (i < m){ if (P) drawN(P, M); if (C) drawN(C, chain(M, M4.T(0, 0.144, 0))); } else if (CS) drawN(CS, chain(M, M4.T(0, 0.944, 0), M4.RY((hash(i * 5) - 0.5) * 0.3))); }
  }
  // the knuckle-boom crane (V.crane tonnes; tools/deck/kran.py): base, slewing column, main and outer boom, two telescopes, the two
  // cylinders between their eyes and the hook on its wire. Folded at sea; at the quay, while freight goes on or off (a 'last' job,
  // 09g-turer.js cargoJob), it unfolds and works a 40 s round: over a cargo place, the hook down and up, swing out over the quay
  // (starboard, where she lies), down and up, and back; the crate rides the hook from the quay (loading) or to it (landing). Every
  // joint moves at its own rate, so it folds and unfolds as a real one does.
  const CRN = {p:null, t:0};
  // a pose from the model (ext is each telescope's slide, e both together; wire the hook's drop under the tip) and the fold limit: with
  // the main boom low the outer one may not close so far that it goes through the column (a2_min, [a1, lowest a2])
  const crPose = (X, k) => { const p = X[k] || {}; return {sl:0, a1:p.a1 || 0, a2:p.a2 || 0, e:2 * (p.ext || 0), w:p.wire || 0.12}; };
  const crA2min = (X, a1) => { const T = X.a2_min; if (!T || !T.length) return -Math.PI; if (a1 <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (a1 <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (a1 - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; };
  function crFrames(X, Q, BMrel, p){
    const s = Q.s || 1, ca = X.col_at || [0, 0.35, 0], b1 = X.b1_at || [0, 1.0, 0], b2 = X.b2_at || [0, 0, -2.4], ea = X.ext_at || [0, 0, -1.6], e2a = X.ext2_at || [0, 0, -0.3], half = p.e / 2;
    const M0 = chain(BMrel, M4.T(Q.at[0], Q.at[1], Q.at[2]), M4.RY(Q.ry || 0), M4.S(s)), MC = chain(M0, M4.T(ca[0], ca[1], ca[2]), M4.RY(p.sl)), M1 = chain(MC, M4.T(b1[0], b1[1], b1[2]), M4.RX(p.a1));
    const M2 = chain(M1, M4.T(b2[0], b2[1], b2[2]), M4.RX(p.a2)), E1 = chain(M2, M4.T(ea[0], ea[1], ea[2] - half)), E2 = chain(E1, M4.T(e2a[0], e2a[1], e2a[2] - half));
    // the knuckle link (a rocker on the main boom and a push link to the outer boom's heel): its angles against the knuckle's, from the
    // model's table (klink: [a2, l1, l2]), so the outer boom folds right back along the main one as a real crane's does
    const lk = crLink(X, p.a2), L1 = lk && X.q1 ? chain(M1, M4.T(X.q1[0], X.q1[1], X.q1[2]), M4.RX(lk[0])) : null, L2 = lk && X.q2 ? chain(M2, M4.T(X.q2[0], X.q2[1], X.q2[2]), M4.RX(lk[1])) : null;
    return {s, M0, MC, M1, M2, E1, E2, L1, L2, tip:xf(E2, X.tip || [0, 0, -1.8])};
  }
  function crLink(X, a2){ const T = X.klink; if (!T || !T.length) return null; if (a2 <= T[0][0]) return [T[0][1], T[0][2]];
    for (let i = 1; i < T.length; i++) if (a2 <= T[i][0]){ const u = (a2 - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return [T[i - 1][1] + (T[i][1] - T[i - 1][1]) * u, T[i - 1][2] + (T[i][2] - T[i - 1][2]) * u]; }
    const L = T[T.length - 1]; return [L[1], L[2]]; }
  function drawCrane(BMrel, G, VP, t, d){
    const K = G.kit, V = VESSELS[vtype()]; if (!K || !K.crane || !V || !(V.crane > 0)) return;
    const X = kitX('crane'), mB = kit('crane', 'base'), mC = kit('crane', 'col'), m1 = kit('crane', 'b1'), m2 = kit('crane', 'b2'); if (!mB || !mC || !m1 || !m2) return;
    const Q = K.crane, b = S.boat, dt = Math.max(0, Math.min(0.2, t - CRN.t)); CRN.t = t;
    const job = b.status === 'port' && !b.land && S.jobs && S.jobs.find(j => j.kind === 'last' && j.until != null && j.until > S.t), loading = job && /^Lasting/.test(job.no || '');
    // parked on its rest where the boat has room for one under the parked boom (the model's rest_at, from the foot), else folded up tight
    // as cranes are packed on boats and lorries (Jonas 20.10.2026, with a photo)
    const restW = Q.rest && X.park && X.rest_at ? [Q.at[0] + (Math.sin(Q.ry || 0) * X.rest_at[2]) * (Q.s || 1), Q.at[1], Q.at[2] + Math.cos(Q.ry || 0) * X.rest_at[2] * (Q.s || 1)] : null;
    const parked = !!(restW && Math.hypot(restW[0] - Q.rest[0], restW[2] - Q.rest[2]) < 0.6);
    const stow = crPose(X, parked ? 'park' : 'stow'), work = crPose(X, 'work'), emax = 2 * (X.ext_max || 1.5);
    let tgt = stow, ph = -1, u = 0, at = null;
    if (job){
      // where the hook must go: a cargo place, or 2.5 m out over the quay on the starboard side, level with the crane
      const cp = K.cargo && K.cargo.length ? K.cargo[(Math.floor(t / 40)) % Math.min(K.cargo.length, Math.max(1, cargoUnits(G)))] : [Q.at[0] - 1.2, d.y, Q.at[2] + 2], qy = (G.gw || d.y + 0.9) + 0.6;
      u = (t % 40) / 40; ph = u < 0.2 ? 0 : u < 0.3 ? 1 : u < 0.4 ? 2 : u < 0.65 ? 3 : u < 0.75 ? 4 : u < 0.85 ? 5 : 6;
      at = ph <= 2 || ph === 6 ? [cp[0], cp[1] + 0.95, cp[2]] : [G.beam / 2 + 2.5, qy, Q.at[2]];
      // the slew to the point and the telescopes out to its distance (the tip moves along the outer boom as they slide)
      const dx = at[0] - Q.at[0], dz = at[2] - Q.at[2], sl = Math.atan2(-dx, -dz) - (Q.ry || 0), D = Math.hypot(dx, dz) / (Q.s || 1);
      const r0 = Math.hypot(...[0, 2].map(i => crFrames(X, Q, M4.T(0, 0, 0), {sl:0, a1:work.a1, a2:work.a2, e:0}).tip[i] - Q.at[i])) / (Q.s || 1);
      const r1 = Math.hypot(...[0, 2].map(i => crFrames(X, Q, M4.T(0, 0, 0), {sl:0, a1:work.a1, a2:work.a2, e:emax}).tip[i] - Q.at[i])) / (Q.s || 1);
      tgt = {sl, a1:work.a1, a2:work.a2, e:clamp(r1 > r0 + 1e-3 ? (D - r0) / (r1 - r0) * emax : 0, 0, emax)};
    }
    const p = CRN.p || (CRN.p = Object.assign({}, stow)), go = (k, to, r) => { const v = to - p[k], w = k === 'sl' ? Math.atan2(Math.sin(v), Math.cos(v)) : v; p[k] += Math.sign(w) * Math.min(Math.abs(w), r * dt); }, step = (k, r) => go(k, tgt[k], r);
    // the knuckle opens and closes with the main boom held up at the model's fold_a1, and the main boom goes down to the stow with the
    // knuckle shut (the drawings' transport position: the main boom lowered forward from the column, the outer boom folded back under it)
    const fa = !parked && X.fold_a1 != null ? X.fold_a1 : null, knuckle = r => { if (p.a1 < fa - 0.01) go('a1', fa, 0.25); else step('a2', r); };
    // folding: the telescopes in first, then the slew home, then the booms; unfolding the other way round (the makers' manual)
    const folding = tgt === stow;
    if (folding){ step('e', 0.45); if (p.e < 0.05){ step('sl', 0.3); if (Math.abs(Math.atan2(Math.sin(p.sl - tgt.sl), Math.cos(p.sl - tgt.sl))) < 0.05){
      if (fa == null){ step('a2', 0.35); step('a1', 0.25); } else if (Math.abs(p.a2 - tgt.a2) > 0.02) knuckle(0.35); else { step('a2', 0.35); step('a1', 0.25); } } } }
    else if (fa == null){ step('a1', 0.25); step('a2', 0.35); if (Math.abs(p.a2 - tgt.a2) < 0.3){ step('sl', 0.3); step('e', 0.45); } }
    else if (Math.abs(p.a2 - tgt.a2) > 0.02) knuckle(0.35);
    else { step('a2', 0.35); step('a1', 0.25); if (Math.abs(p.a1 - tgt.a1) < 0.3){ step('sl', 0.3); step('e', 0.45); } }
    p.a2 = Math.max(p.a2, crA2min(X, p.a1));
    const F = crFrames(X, Q, BMrel, p), S1 = M4.S(F.s); KST.crane = {sl:p.sl, a1:p.a1, a2:p.a2, e:p.e, job:!!job, tip:F.tip.slice()};
    drawN(mB, F.M0); drawN(mC, F.MC); drawN(m1, F.M1); drawN(m2, F.M2);
    const e1 = kit('crane', 'ext1'), e2 = kit('crane', 'ext2'), k1 = kit('crane', 'link1'), k2 = kit('crane', 'link2'); if (e1) drawN(e1, F.E1); if (e2) drawN(e2, F.E2);
    if (k1 && F.L1) drawN(k1, F.L1); if (k2 && F.L2) drawN(k2, F.L2);
    // the cylinders between their eyes: the barrel from its base eye, the rod from the far eye back into it
    for (const [nb, nr, fa, ka, fb, kb] of [['cyl1b', 'cyl1r', F.MC, 'c1_a', F.M1, 'c1_b'], ['cyl2b', 'cyl2r', F.M1, 'c2_a', X.c2_b_in === 'link1' ? F.L1 : F.M2, 'c2_b']]){
      const cb = kit('crane', nb), cr = kit('crane', nr); if (!cb || !cr || !fb || !X[ka] || !X[kb]) continue; const A = xf(fa, X[ka]), B = xf(fb, X[kb]), v = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
      drawN(cb, chain(toolM(A, v), S1)); drawN(cr, chain(toolM(B, v), S1)); }
    // the hook on its wire: short and made fast at sea, paid out to the deck or the quay in the round
    const H = kit('crane', 'hook'), tip = F.tip, near = !job || Math.hypot(p.sl - tgt.sl, p.e - tgt.e) > 0.15;
    let hy = tip[1] - (near ? stow.w : work.w * 0.3) * F.s;
    if (job && !near && at){ const goal = xf(BMrel, at)[1] + 0.35 * F.s, wv = ph === 1 || ph === 4 ? Math.sin(((ph === 1 ? u - 0.2 : u - 0.65) / 0.1) * Math.PI) : 0; const h0 = tip[1] - work.w * 0.3 * F.s; hy = h0 - (h0 - goal) * wv; }
    const at0 = (y) => { const m = F.MC.slice(); m[12] = tip[0]; m[13] = y; m[14] = tip[2]; return m; };   // (the column's turn and the boat's heading, at a point)
    drawN(PM.wire, limbM([tip[0], tip[1], tip[2]], [tip[0], hy, tip[2]], 0.012)); if (H) drawN(H, at0(hy));
    // the crate on the hook: from the quay to the deck when loading, from the deck to the quay when landing
    const carry = job && !near && (loading ? u >= 0.7 || u < 0.25 : u >= 0.25 && u < 0.7), C = kit('rig', 'kasse');
    if (carry && C){ const hl = (X.hook_h || 0.35) * F.s; drawN(C, chain(at0(hy - hl - 0.8), M4.S(1 / F.s))); }
    // the boom rest stands where the parked crane's outer boom comes down (the model's rest_at, from the crane's foot)
    if (parked){ const R = kit('crane', 'rest'); if (R) drawN(R, chain(F.M0, M4.T(X.rest_at[0], X.rest_at[1], X.rest_at[2]))); }
    return carry;
  }
  // the bleeding tub's top in the boat frame (where the fish are tossed)
  function dkTub(G){ const W = G.work || null, d = G.deck || {y:G.gw, z:2}, Bm = G.beam; return [W ? W.tub[0] : Bm / 2 - 0.62, d.y + 0.62, W ? W.tub[2] : d.z + 0.35]; }
  function drawDeck(BMrel, eye, VP, t, DK){
    const vt = vtype(), G = GEO(vt), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, b = S.boat; DK.pt = null;
    if (b.land || b.status === 'aground') return;
    nSetup(VP);
    // where they stand: by the beam on the after deck, or where a detailed model says (the starter boat has a seat and a bench aft)
    const W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), ux = W ? W.tub[0] : Bm / 2 - 0.62, tz = W ? W.table[2] : d.z, uz = W ? W.tub[2] : d.z + 0.35;
    // a model with its own gutting table (work.own, the old wooden boat's across the gunwale) has it drawn already, the fish on its top;
    // else the kit's table: the plastic one on the small boats, the steel bench with its chute from 10 m (tools/deck/fisk.py)
    const own = !!(W && W.own), V = VESSELS[vt], big = !!(V && V.len >= 10), KT = kit('fish', 'kar300'), KW = kit('fish', 'vann'), KB = own ? null : kit('fish', big ? 'benk' : 'bord'), XF = kitX('fish');
    const tSide = tx < 0 ? 1 : -1, kTop = XF[big ? 'benk_top' : 'bord_top'], topY = own && W.top != null ? W.top + 0.02 : KB && kTop != null ? d.y + kTop + 0.02 : d.y + 0.885;
    const potRig = b.rig === 'teiner' && !(typeof deckPending === 'function' && deckPending() > 0.5);
    KST.tank = null; if (!G.hand){ if (!GB) buildGear(); drawCrabTank(BMrel, G, d, Bm / 2, G.hauler || [Bm / 2 * 0.92, d.y + 1, d.z - 1.3]); nSetup(VP); }
    drawRigRest(BMrel, G, d);
    KST.raft = KST.buoys = KST.text = KST.radar = KST.cargo = KST.tubs = 0; KST.crane = null; KST.vt = vt; KST.n++;
    drawSafety(BMrel, G, VP, t); const lifted = drawCrane(BMrel, G, VP, t, d); drawCargo(BMrel, G, lifted ? 1 : 0);
    if (!potRig){
      // the bleeding tub: a 300 l fish tub with the bloody water at its level (the old box where the kit is not in the page)
      if (KT){ const TM = chain(BMrel, M4.T(ux, d.y, uz), M4.S(W && W.s || 1)); drawN(KT, TM); if (KW) drawN(KW, chain(TM, M4.T(0, 0.44, 0), M4.S(0.58, 1, 0.94))); }
      else drawN(PM.btub, chain(BMrel, M4.T(ux, d.y, uz), M4.S(W && W.s || 1)));
      // the table by the rail, its long side along the boat and the worker's side inboard
      if (!own){ if (KB) drawN(KB, chain(BMrel, M4.T(tx, d.y, tz), M4.RY(tSide * Math.PI / 2))); else drawN(PM.gtable, chain(BMrel, M4.T(tx, d.y, tz))); } }
    // an open boat without a hold keeps the catch in 460 l tubs on deck (the model's places, kit.tubs): the gutted and iced fish fill
    // them in turn, in layers of six under the crushed ice (lengthwise in the tub, three across and two along, heads both ways)
    if (V && V.hold && V.hold.kind === 'dekk' && G.kit && G.kit.tubs && G.kit.tubs.length && !G.hand){ const IS = kit('fish', 'is'), tubs = G.kit.tubs, vol = tubs.reduce((a, q) => a + (q[4] || 460), 0);
      const kgIn = S.hold.filter(x => x.gut || x.iced).reduce((a, x) => a + x.kg, 0), all = Math.max(1e-6, S.hold.reduce((a, x) => a + x.kg, 0));
      const cum = []; let acc = 0; for (const sp of ALLSP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); } const pick = r => (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0];
      let before = 0; tubs.forEach((q, ti) => { const sz = q[4] || 460, T = kit('fish', 'kar' + sz), per = (V.holdCap || 450) * sz / vol, M = chain(BMrel, M4.T(q[0], q[1], q[2]), M4.RY(q[3] || 0)), f = clamp((kgIn - before) / per, 0, 1); before += per; if (T){ drawN(T, M); KST.tubs++; } if (f <= 0 || !SK || !SK.fishM) return;
        const layers = Math.ceil(f * 6); for (let L = 0; L < layers; L++) for (let k = 0; k < 6; k++){ const i = ti * 40 + L * 6 + k, sp = pick(hash(i * 7 + 5));
          drawN(fishOf(sp), chain(M, M4.T(-0.25 + (k % 3) * 0.25 + (hash(i * 3) - 0.5) * 0.05, 0.16 + L * 0.085, -0.24 + Math.floor(k / 3) * 0.48), M4.RY((k % 2 ? Math.PI : 0) + (hash(i * 9) - 0.5) * 0.3), M4.RZ(Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), M4.S(0.46 + hash(i * 13) * 0.08))); }
        if (IS) drawN(IS, chain(M, M4.T(0, 0.16 + layers * 0.085, 0), M4.S(0.86, 1, 1.05))); }); }
    // the catch on deck (tools/fish): the round fish waiting for the knife lie in the bleeding tub (their species, about one for every 6 kg),
    // the gutted ones waiting for the icer at the end of the gutting table, and one on the table when nobody guts
    { const wait = x => !x.gut && !x.iced && !(SPECIES[x.sp] || {}).live, all = S.hold.reduce((a, x) => a + (wait(x) ? x.kg : 0), 0), n = Math.min(10, Math.ceil(all / 6)), ts = W && W.s || 1;
      const gd = S.hold.reduce((a, x) => a + (x.gut && !x.iced ? x.kg : 0), 0), ng = SK && SK.fishM && !potRig ? Math.min(3, Math.ceil(gd / 4)) : 0;
      for (let i = 0; i < ng; i++) drawN(fishOf(S.hold.find(x => x.gut && !x.iced).sp), chain(BMrel, M4.T(tx, topY, tz + (own ? 0.38 : 0.45) * (tz > d.z ? -1 : 1)), M4.T(0, i * 0.045, (hash(i * 3) - 0.5) * 0.12), M4.RY(0.15 + (i % 2) * Math.PI), M4.RZ(Math.PI / 2), M4.S(0.46)));
      if (n > 0 && SK && SK.fishM && !potRig){ const cum = []; let acc = 0; for (const sp of ALLSP){ acc += S.hold.filter(x => x.sp === sp && wait(x)).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
        const pick = r => (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0];
        for (let i = 0; i < n; i++){ const sp = pick(hash(i * 7 + 5)), z = ((i % 3) - 1) * 0.2, lay = Math.floor(i / 3);
          drawN(fishOf(sp), chain(BMrel, M4.T(ux, d.y, uz), M4.S(ts), M4.T((hash(i * 3) - 0.5) * 0.12, (KT ? 0.47 : 0.5) + lay * 0.05, z), M4.RY(Math.PI / 2 + (i % 2 ? Math.PI : 0) + (hash(i * 9) - 0.5) * 0.3), M4.RZ(sp === 'krabbe' ? 0 : Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), M4.S((0.48 + hash(i * 13) * 0.1) * (sp === 'krabbe' ? 1.7 : 1)))); }
        if (!DK.on) drawN(fishOf(pick(0.3)), chain(BMrel, M4.T(tx, topY, tz + (own ? 0 : 0.25)), M4.RY(0.2), M4.RZ(Math.PI / 2), M4.S(0.5))); } }
    if (!DK.on) return;
    const agents = !G.hand && typeof CREW3D !== 'undefined' && CREW3D.on();   // (the agents walk to the table and the tub themselves, deckcrew.js)
    const wl = xf(BMrel, [tx + 0.62, d.y, tz]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0, kit:DK.me ? 'skipper' : null, look:DK.me ? lookMe() : lookCrew(0)}, head = bv.head - Math.PI / 2;
    if (!agents) drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:head, task:DK.task === 'gut' ? 'gut' : 'ice', walk:false, s:0}, eye, t, 7);
    // the skipper and a hand both on the deck work: the hand stands inboard of the bleeding tub, facing it
    if (!agents && DK.me && DK.crew && !DK.alone){ const w2 = xf(BMrel, [ux + (ux > tx ? -0.62 : 0.62), d.y, uz]), y2 = w2[1] + eye[1];
      drawWorker({gy:() => y2, bare:true, spray:0, kit:null, look:lookCrew(0)}, {x:w2[0] + eye[0], z:w2[2] + eye[2], h:bv.head + (ux > tx ? 1 : -1) * Math.PI / 2, task:DK.task === 'gut' ? 'gut' : 'ice', walk:false, s:0}, eye, t, 8); }
    // the offal goes over the rail on the table's side into the water (down the bench's chute), where the gulls come down for it
    const kDrop = KB && XF[big ? 'benk_drop' : 'bord_drop'], dropP = kDrop ? [tx + tSide * kDrop[2], d.y + Math.max(0.6, kDrop[1]), tz - tSide * kDrop[0]] : [tx - tSide * 0.15, d.y + 1.0, tz];
    const out = [-tSide * Math.cos(bv.head), -tSide * Math.sin(bv.head)], a = xf(BMrel, dropP), wat = (env.tide || 0) - eye[1];
    DK.pt = [a[0] + eye[0] + out[0] * 2.6, (env.tide || 0), a[2] + eye[2] + out[1] * 2.6];
    if (DK.task === 'gut' && !agents){ const c = (t % 3) / 3; if (c > 0.76){ const k = (c - 0.76) / 0.24; drawN(PM.slo, M4.T(a[0] + out[0] * 2.6 * k, a[1] + 1.2 * k * (1 - k) * 2 - (a[1] - wat) * k * k, a[2] + out[1] * 2.6 * k)); } }
  }
