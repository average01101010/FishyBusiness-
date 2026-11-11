  // ---------- passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling ----------
  let GB = null;
  function buildGear(){
    const k = (r, g, b, s) => [r, g, b, s == null ? 0.3 : s];
    // blåse: an orange float, a dark pole with a black flag, and the rope going down
    const b = NB(), G = [];
    for (let i = 0; i <= 8; i++){ const la = -Math.PI / 2 + Math.PI * i / 8, row = []; for (let j = 0; j <= 12; j++){ const lo = 2 * Math.PI * j / 12; row.push([Math.cos(la) * Math.cos(lo) * 0.3, 0.16 + Math.sin(la) * 0.28, Math.cos(la) * Math.sin(lo) * 0.3]); } G.push(row); }
    b.grid(G, () => k(0.95, 0.42, 0.1, 0.55)); b.tube([[0, 0.4, 0], [0, 2.7, 0]], 0.024, k(0.12, 0.12, 0.13), 6); b.box(0.22, 2.2, 0, 0.44, 0.3, 0.02, k(0.07, 0.07, 0.08, 0.1));
    b.box(0, 1.6, 0, 0.16, 0.2, 0.16, k(0.75, 0.76, 0.78, 0.8)); b.tube([[0, -0.1, 0], [0.05, -1.4, 0.1]], 0.012, k(0.85, 0.7, 0.2), 5);
    // hauler: a drum on a post; a crab pot: a frame of bars; a net bin and a line tub
    const h = NB(); h.tube([[-0.1, 0, 0], [0.1, 0, 0]], 0.19, k(0.2, 0.22, 0.25, 0.5), 14); h.disc([0.1, 0, 0], [1, 0, 0], 0.19, k(0.3, 0.32, 0.36, 0.5)); h.disc([-0.1, 0, 0], [-1, 0, 0], 0.19, k(0.3, 0.32, 0.36, 0.5)); h.box(-0.02, -0.55, 0, 0.12, 0.45, 0.12, k(0.28, 0.3, 0.33));
    const pt = NB(), X = 0.4, Y = 0.4, Z = 0.3, e = [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]], c = k(0.1, 0.25, 0.14, 0.2);
    for (let i = 0; i < 4; i++){ const a = e[i], q = e[(i + 1) % 4]; pt.tube([a, q], 0.014, c, 4); pt.tube([[a[0], Y, a[2]], [q[0], Y, q[2]]], 0.014, c, 4); pt.tube([a, [a[0], Y, a[2]]], 0.014, c, 4); }
    pt.tube([[-X, Y * 0.5, -Z], [X, Y * 0.5, Z]], 0.008, k(0.2, 0.35, 0.2), 4); pt.tube([[-X, Y * 0.5, Z], [X, Y * 0.5, -Z]], 0.008, k(0.2, 0.35, 0.2), 4);
    const bin = NB(); bin.box(0, 0, 0, 0.9, 0.42, 0.7, k(0.32, 0.4, 0.5, 0.3), k(0.1, 0.12, 0.14, 0.1));
    const tub = NB(); tub.box(0, 0, 0, 0.55, 0.32, 0.55, k(0.2, 0.45, 0.72, 0.4), k(0.4, 0.3, 0.2, 0.1));
    const fl = NB(); fl.tube([[0, 0, 0], [0, 0, 1]], 1, k(0.95, 0.72, 0.15, 0.2), 5);
    const net = NB(); net.tube([[0, 0, 0], [0, 0, 1]], 1, k(0.55, 0.62, 0.6, 0.1), 4);
    const bt = NB(); bt.box(0, 0, 0, 0.035, 0.03, 0.05, k(0.62, 0.42, 0.36, 0.5));
    GB = {buoy:b.mesh(), haul:h.mesh(), pot:pt.mesh(), bin:bin.mesh(), tub:tub.mesh(), float:fl.mesh(), net:net.mesh(), bait:bt.mesh(), dregg:null};
    // the blåse and the grapnel from tools/gear/blaase.py, in place of the drawn float above
    if (typeof glbHas === 'function' && glbHas('gear-marks')){ const up = nm => { const o = glbPart('gear-marks', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; };
      GB.buoy = up('blaase') || GB.buoy; GB.dregg = up('dregg');
      // the ocean marker poles of § 68 at the ends of an autoline set (H2d, 05.11.2026): two flags and two yellow lamps at the west end,
      // one of each at the east end; the lamps' places from the extras (havlys), flashing at night
      GB.havV = up('havstang_v'); GB.havO = up('havstang_o'); const X = (glbLoad('gear-marks') || {}).ex || {}; GB.havL = X.havlys || null; GB.blink = X.blink || 22; }
    // the autoline's snood with its hook, empty and baited (tools/gear/autoline.py), drawn along the line as it comes in
    if (typeof glbHas === 'function' && glbHas('gear-autoline')){ const up = nm => { const o = glbPart('gear-autoline', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; };
      GB.aTom = up('tom'); GB.aEgB = up('egnet_b'); GB.aEgS = up('egnet_s'); }
    // the conical king crab pot (OB16, 09.11.2026: the square one is out of the game), the pot hauler on its davit and the live crab tank
    // from tools/gear/teine.py: the whole pot, the one on top of a stack, one nested under it and the nine under the top one of a full stack
    if (typeof glbHas === 'function' && glbHas('gear-pot')){ const up = nm => { const o = glbPart('gear-pot', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; }, pg = glbLoad('gear-pot');
      GB.davit = up('davit'); GB.davitSh = up('davitskive'); GB.tank = up('krabbekar'); GB.px = Object.assign({}, (pg && pg.ex) || {}, GB.px && GB.px.kon ? {kon:GB.px.kon} : {});
      GB.kk = up('kong'); GB.kktopp = up('kongtopp'); GB.kklag = up('konglag'); GB.kkfull = up('konglagfull'); }
    // the snow crab's gear from tools/gear/snoteine.py (H3d1, 07.11.2026): the conical pot with its escape opening, bait box and mark in
    // place of gear-pot's, the pot hauler and its sheave under the portal, the buoy and the marker buoy at a string's ends
    if (typeof glbHas === 'function' && glbHas('gear-snoteine')){ const up = nm => { const o = glbPart('gear-snoteine', nm); return o ? {pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3} : null; }, sg = glbLoad('gear-snoteine');
      const k = up('kon'); if (k){ GB.kon = k; GB.kontopp = up('kontopp'); GB.konlag = up('konlag'); GB.konlag11 = up('konlag11'); GB.px = Object.assign({}, GB.px || {}, {kon:Object.assign({}, (GB.px || {}).kon || {}, (sg && sg.ex && sg.ex.kon) || {})}); }
      GB.snoHaul = up('haler'); GB.snoSheave = up('haler_skive'); GB.blase = up('blase'); GB.boye = up('boye'); GB.snx = (sg && sg.ex) || {}; }
  }
  // the buoys of every set within sight, bobbing on the waves, flags blowing downwind
  // An autoline set carries the marks of § 68 (H2d, aMarks): the ocean marker poles at its ends (the west end two flags and two lamps,
  // the east end one; the grid's x is east near enough), a pole between each two lenker (no lamps), and a blåse between them at least
  // every nautical mile («vak minst hver nautiske mil på faststående redskap»). e.hav: 'v', 'o' or 'm' (between)
  // ---------- the autoline's marks over the stern (H2d2, 06.11.2026) ----------
  // The line leaves her setting chute in the stern, so it lies where her chute has been: a set's ends a and b are where her middle was,
  // so the marks lie the chute's distance (zc) aft of them along the line. aMarks: the marks of a set of n lenker from a to b, by their
  // distance s along it from A; the grapnel after each pole (dl: it goes over that long after the pole), the end's before it
  const NMI = 1852, ALEN = LINE_KINDS.auto.hooks * LINE_KINDS.auto.kmHook * 1000;   // (a lenke: 5,000 hooks at 1.3 m, 6.5 km)
  function aMarks(a, b, n, zc){
    const L = Math.hypot(b.x - a.x, b.y - a.y) * 1000; if (!(L > 1)) return null; const ux = (b.x - a.x) * 1000 / L, uz = (b.y - a.y) * 1000 / L, w = a.x <= b.x, list = [];
    n = Math.max(1, Math.round(n || L / ALEN)); const A = [a.x * 1000 - ux * zc, a.y * 1000 - uz * zc];
    for (let k = 0; k <= n; k++){ const s = L * k / n, end = k === 0 || k === n;
      list.push({s, id:'p' + k, hav:k === 0 ? (w ? 'v' : 'o') : k === n ? (w ? 'o' : 'v') : 'm', lamp:end, dl:k === n ? 1.4 : 0});
      list.push({s, id:'d' + k, dregg:true, dl:k === n ? 0 : 1.1});
      if (k < n){ const m = Math.ceil(L / n / NMI - 1e-6); for (let i = 1; i < m; i++) list.push({s:s + L / n * i / m, id:'b' + k + '.' + i, vak:true, dl:0}); } }
    return {A, ux, uz, L, n, list};
  }
  // (how far aft of where the simulation has her the slide's end is: the simulation's point is her pivot a third from the bow,
  // 16-motion.js, and the slide is at her stern: 31 m on the autoliner)
  const aZc = G => { const AL = G && G.aline; if (!AL) return 0; const sl = AL.slide || AL.chute, zp = (G.bow || -2.2) + ((G.stern || 3.1) - (G.bow || -2.2)) / 3; return sl[2] - zp; };
  const AMW = new WeakMap(), AMN = new Map();
  function aMarksOf(s, zc, key){ const C = key ? AMN.get(key) : AMW.get(s); if (C && C.a === s.a && C.b === s.b && C.n === s.n && C.zc === zc) return C.M;
    const M = aMarks(s.a, s.b, s.n, zc), E = {a:s.a, b:s.b, n:s.n, zc, M}; if (key){ if (AMN.size > 300) AMN.clear(); AMN.set(key, E); } else AMW.set(s, E); return M; }
  // the set she is laying (or has just laid, until her chute has reached its end): which of its marks are over the side, the ones going
  // now (drops), her chute's lip and how far along the line it is (sC); the hauling port as she hauls one (hP)
  const ALM = {key:null, M:null, out:new Set(), drops:[], C:null, sC:-1e9, t:0, first:false, haul:null, n:0, fix:null};   // fix: a moment of the drops held for pictures (G3._debug.almFix)
  const aAge = (d, t) => (ALM.fix != null ? ALM.fix : t - d.t0) - (d.m.dl || 0);
  function autoMarks(BMrel, eye, t){
    const b = S.boat, g = b.gop, G = GEO(vtype()), AL = G.aline; ALM.C = null; ALM.haul = null;
    if (!AL || !AL.chute || !BMrel || typeof isAuto !== 'function'){ ALM.key = null; ALM.M = null; ALM.drops.length = 0; return; }
    const w = q => { const r = xf(BMrel, q); return [r[0] + eye[0], r[1] + eye[1], r[2] + eye[2]]; }, sl = AL.slide || [AL.chute[0], AL.chute[1] - 0.5, AL.chute[2] + 1];
    ALM.C = w([sl[0], sl[1] + 0.12, sl[2]]);   // (the slide's end, where the line and the marks leave her)
    if (g && g.op === 'haul' && g.auto){ const s = (S.sets || []).find(x => x.id === g.sid); if (s) ALM.haul = {s, fromA:dist(g.a, s.a) <= dist(g.a, s.b), P:w(AL.sill || AL.foot)}; }
    let a = null, bb = null, n = 0, fresh = false;
    if (g && g.op === 'set' && g.auto){ a = g.a; bb = g.b; n = g.n; fresh = g.done === 0 && g.prog < 0.03; ALM.t = t; }
    else if (ALM.key){ const s = (S.sets || []).find(x => x.a === ALM.key && !x.lost); if (s && t - ALM.t < 60){ a = s.a; bb = s.b; n = s.n; } }
    if (!a){ ALM.key = null; ALM.M = null; return; }
    if (ALM.key !== a){ ALM.key = a; ALM.out = new Set(); ALM.M = null; ALM.first = !fresh; ALM.drops.length = 0; }
    if (!ALM.M || ALM.bb !== bb || ALM.n !== n){ ALM.M = aMarks(a, bb, n, aZc(G)); ALM.bb = bb; ALM.n = n; }   // (a set stopped halfway is shorter)
    const M = ALM.M; if (!M) return;
    ALM.sC = (ALM.C[0] - M.A[0]) * M.ux + (ALM.C[2] - M.A[1]) * M.uz;
    for (const m of M.list){ if (ALM.out.has(m.id) || m.s > ALM.sC + 3) continue; ALM.out.add(m.id); if (ALM.first) continue;   // (opened mid-set: the passed ones lie there)
      ALM.drops.push({m, t0:t, W:null}); KST.aDrops = (KST.aDrops || 0) + 1; KST['aDrop_' + (m.vak ? 'vak' : m.dregg ? 'dregg' : 'pole')] = (KST['aDrop_' + (m.vak ? 'vak' : m.dregg ? 'dregg' : 'pole')] || 0) + 1; }
    ALM.first = false;
    if (ALM.fix == null) for (let i = ALM.drops.length - 1; i >= 0; i--) if (aAge(ALM.drops[i], t) > 5) ALM.drops.splice(i, 1);
  }
  const AFLY = {pole:1.0, vak:0.7, dregg:0.9}, ASET = {pole:2.6, vak:1.6, dregg:4.0};   // (s: in the air from the slide; in all, then the mark lies as the others)
  // the marks of the set she lays, that her chute has passed and are not going over now; the hauled set's, that her port has not reached
  function aLive(M, m, t){ if (!ALM.out.has(m.id)) return false; for (const d of ALM.drops) if (d.m === m && aAge(d, t) < ASET[d.m.vak ? 'vak' : d.m.dregg ? 'dregg' : 'pole']) return false; return true; }
  function aMarksPush(L, M, filt){ if (!M) return; for (const m of M.list){ if (m.dregg || (filt && !filt(m))) continue;
    L.push({x:(M.A[0] + M.ux * m.s) / 1000, y:(M.A[1] + M.uz * m.s) / 1000, hav:m.vak ? null : m.hav, lamp:m.lamp}); } }
  function drawGearSea(eye, t, VP, H){
    const L = [], zc = aZc(GEO(vtype())), Hl = ALM.haul;
    for (const s of S.sets || []) if (!s.lost){ if (s.kind === 'line' && typeof isAuto === 'function' && isAuto(s.lk)){
        if (s.a === ALM.key && ALM.M){ aMarksPush(L, ALM.M, m => aLive(ALM.M, m, t)); continue; }
        const M = aMarksOf(s, zc);
        // (hauling it: the marks her hauling port has passed are aboard)
        if (Hl && Hl.s === s && M){ const sP = (Hl.P[0] - M.A[0]) * M.ux + (Hl.P[2] - M.A[1]) * M.uz; aMarksPush(L, M, m => Hl.fromA ? m.s > sP + 2 : m.s < sP - 2); }
        else aMarksPush(L, M); }
      else if (s.kind === 'teine' && s.pot === 'sno'){ L.push({x:s.a.x, y:s.a.y, sno:'blase'}); L.push({x:s.b.x, y:s.b.y, sno:'boye'}); }   // (the snow crab's string: the buoy and the marker buoy, § 66, H3d1)
      else { L.push(s.a); L.push(s.b); } }
    for (const s of PEERGEAR){ L.push(s.a); L.push(s.b); }   // the other players' buoys (tilbakemelding #35)
    // the coast boats' nets, lines and pots, the ocean fleet's autolines with their marks (05-vessels.js, 05d-hav.js)
    for (const s of NPCGEAR){ if (s.hav && s.k === 'line') aMarksPush(L, aMarksOf(s, 0, s.a.x.toFixed(4) + ',' + s.a.y.toFixed(4) + ',' + s.b.x.toFixed(4) + ',' + s.b.y.toFixed(4)));
      else if (s.hav && s.k === 'teine'){ L.push({x:s.a.x, y:s.a.y, sno:'blase'}); L.push({x:s.b.x, y:s.b.y, sno:'boye'}); } else { L.push(s.a); L.push(s.b); } }
    // setting, the first buoy goes over the stern and lies astern of her until she has run clear of it (tilbakemelding #25: «bøya skal
    // ligge på siden eller bak båten når settingen starter»); the autoline's marks go over from her chute (ALM, below)
    const g = S.boat.gop; if (g && g.op === 'set' && g.done >= 0){ if (g.auto && ALM.M) aMarksPush(L, ALM.M, m => aLive(ALM.M, m, t)); else if (!g.auto){ const back = ((GEO(vtype()).stern || 3) + 5) / 1000, d = Math.hypot(bv.x / 1000 - g.a.x, bv.z / 1000 - g.a.y);
      L.push(bv.init && d < back ? {x:(bv.x - Math.sin(bv.head) * back * 1000 + Math.cos(bv.head) * 1.5) / 1000, y:(bv.z + Math.cos(bv.head) * back * 1000 + Math.sin(bv.head) * 1.5) / 1000} : g.a); } }
    if (!L.length && !ALM.drops.length) return; if (!GB) buildGear();
    nSetup(VP); const wd = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG;
    const lamps = [], night = env.night || 0, per = 60 / (GB.blink || 22); let nMarks = 0;
    for (const e of L){ const x = e.x * 1000, z = e.y * 1000, dd = Math.hypot(x - eye[0], z - eye[2]), hv = e.hav && GB.havV ? e.hav : null; if (dd > (hv && e.lamp !== false ? 4600 : 4000)) continue;   // (a lamp is seen 2 nm, § 68)
      const y = seaH(x, z, t) - (hv ? 0.15 : 0.1), sx = (seaH(x + 0.6, z, t) - seaH(x - 0.6, z, t)) / 1.2, sz = (seaH(x, z + 0.6, t) - seaH(x, z - 0.6, t)) / 1.2;
      const M = model(x - eye[0], y - eye[1], z - eye[2], Math.PI / 2 - wd, -sz * 0.9, sx * 0.9);
      if (!hv){ if (dd <= 4000){ const SB = e.sno === 'blase' ? GB.blase : e.sno === 'boye' ? GB.boye : null; drawN(SB || GB.buoy, M); if (SB) KST.snoMarks = (KST.snoMarks || 0) + 1; } continue; }
      if (dd <= 4000){ drawN(hv === 'v' ? GB.havV : GB.havO, M); nMarks++; }
      // the yellow lamps of the ends: 22 flashes a minute (§ 68: 20-25), each pole on its own beat
      if (hv !== 'm' && e.lamp !== false && night > 0.05 && GB.havL && ((t + hash(Math.round(x) * 7 + Math.round(z)) * per) % per) < 0.35) for (const q of GB.havL[hv === 'v' ? 'havstang_v' : 'havstang_o'] || []) lamps.push(xf(M, q)); }
    KST.havPoles = nMarks;
    if (lamps.length){ const n = Math.min(lamps.length, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = lamps[i][0]; PB[i * 3 + 1] = lamps[i][1]; PB[i * 3 + 2] = lamps[i][2]; PA[i] = night; }
      drawPts(n, gl.POINTS, VP, [1, 0.78, 0.18], 320, true); KST.havLamps = n; nSetup(VP); }
    drawAutoDrops(eye, t);
    gl.useProgram(PL.p);
  }
  // the marks going over (ALM.drops): from the slide's end as she runs on, out and down to where they will lie on the line; the pole
  // tipped over the stern rights itself in the water with a wobble, the blåse is thrown, the grapnel follows its pole and goes down on its
  // rope (the end's goes first); then each lies as the others (the static marks above)
  function drawAutoDrops(eye, t){
    if (!ALM.drops.length || !ALM.C || !ALM.M) return; const C = ALM.C, M = ALM.M, yaw = -bv.head; let n = 0;
    const poleAt = {};   // (where each pole is now, for its grapnel's rope)
    for (const d of ALM.drops){ const m = d.m, kind = m.vak ? 'vak' : m.dregg ? 'dregg' : 'pole', e = aAge(d, t); if (e < 0 || e > ASET[kind]) continue;
      if (!d.W){ const s = Math.max(m.s, ALM.sC); d.W = [M.A[0] + M.ux * s, M.A[1] + M.uz * s]; }
      const W = d.W, T1 = AFLY[kind], u = clamp(e / T1, 0, 1), k = u * u * (3 - 2 * u), wy = seaH(W[0], W[1], t);
      const p = [C[0] + (W[0] - C[0]) * k, C[1] + (wy - C[1]) * u + Math.sin(Math.PI * u) * (kind === 'vak' ? 0.9 : 0.35), C[2] + (W[1] - C[2]) * k];
      let pitch = 0, roll = 0;
      // (the pole leaves the slide float first, its top aft over the water and clear of the transom, and rights itself as it lands)
      if (kind === 'pole'){ const r = e - T1; pitch = -(u < 1 ? 1.35 * (1 - k) + 0.6 * k : 0.6 * Math.exp(-2.2 * r) * Math.cos(5 * r)); p[1] -= 0.15 + (u >= 1 ? Math.max(0, 0.4 - r) * 0.6 : 0); poleAt[m.id.slice(1)] = p; }
      else if (kind === 'dregg'){ pitch = e * 3; roll = e * 1.7; if (u >= 1) p[1] = wy - (e - T1) * 1.8; }
      else { roll = Math.sin(e * 9) * 0.3 * (1 - u); p[1] -= u >= 1 ? 0.1 : 0; }
      const Mx = model(p[0] - eye[0], p[1] - eye[1], p[2] - eye[2], yaw + (kind === 'vak' ? e * 4 * (1 - u) : 0), pitch, roll);
      if (kind === 'pole') drawN(m.hav === 'v' ? GB.havV || GB.buoy : GB.havO || GB.buoy, Mx);
      else if (kind === 'vak') drawN(GB.buoy, Mx);
      else if (GB.dregg){ drawN(GB.dregg, Mx);
        // (its rope: up to its pole when the pole is going over too, else back to the slide it pays out from)
        const P = poleAt[m.id.slice(1)] || C; drawN(GB.net, limbM([p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]], [P[0] - eye[0], P[1] - eye[1] + (P === C ? 0 : 0.2), P[2] - eye[2]], 0.012)); }
      n++; }
    KST.aFly = n;
  }
  // the string between the buoys under water (task 3, 03.11.2026): the buoy ropes down to the grapnels, the net (float line, lead line
  // and the meshes between) or the line (with its snoods), and the pots on their rope, along the bottom; for your own sets, the other
  // players' (PEERGEAR) and the coast's and ocean fleet's (NPCGEAR). The sea is drawn opaque, so a point under water is drawn where the
  // eye's ray to it crosses the surface: the same pixel, and the depth of the water there, so boats and land in front still hide it and a
  // wave crest hides it as it would. It fades as the water takes it (to a third at VIS m), with the distance (gone at UNDER_R) and as the
  // eye looks flatter over the sea (the surface reflects). Lines of one pixel, at most four calls a frame, the sea floor read once a set.
  const UNDER = new Map(), UNDER_R = 450, UNDER_DET = 120, VIS = 2.5;   // (seen from a boat, at a slant, through waves: a few metres; Jonas 03.11.2026)
  const UNDERW = new WeakMap();
  let UNDER_NEW = 0;   // (the sets whose sea floor is read this frame: at most six, the rest the next frames, so no frame stalls)
  function underProf(s, kind){
    let P = UNDERW.get(s); if (P && P.ax === s.a.x && P.bx === s.b.x && P.ay === s.a.y && P.by === s.b.y) return P;
    const key = kind + ':' + s.a.x.toFixed(5) + ',' + s.a.y.toFixed(5) + ':' + s.b.x.toFixed(5) + ',' + s.b.y.toFixed(5); P = UNDER.get(key); if (P){ UNDERW.set(s, P); return P; }
    if (UNDER_NEW++ >= 6) return null;
    const A = [s.a.x * 1000, s.a.y * 1000], B = [s.b.x * 1000, s.b.y * 1000], L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(2, Math.min(240, Math.ceil(L / 6)));
    const dep = (x, z) => { try { return clamp(depthF({x:x / 1000, y:z / 1000}), 1.5, 400); } catch (e){ return null; } };
    let pend = false, dmin = 1e9; const pts = [];
    for (let i = 0; i <= n; i++){ const f = i / n, x = A[0] + (B[0] - A[0]) * f, z = A[1] + (B[1] - A[1]) * f, d = dep(x, z); if (d == null) pend = true; const dd = d == null ? 30 : d; pts.push([x, z, dd]); if (dd < dmin) dmin = dd; }
    // the grapnels: off the buoys along the string by half the depth (the buoy rope's slope), at most a fifth of the string each
    const ux = L > 0.1 ? (B[0] - A[0]) / L : 1, uz = L > 0.1 ? (B[1] - A[1]) / L : 0, oa = Math.min(pts[0][2] * 0.5, L * 0.2), ob = Math.min(pts[n][2] * 0.5, L * 0.2);
    P = {A, B, L, pts, dmin, ga:[A[0] + ux * oa, A[1] + uz * oa], gb:[B[0] - ux * ob, B[1] - uz * ob], ux, uz, ax:s.a.x, ay:s.a.y, bx:s.b.x, by:s.b.y};
    if (!pend){ if (UNDER.size > 400) UNDER.clear(); UNDER.set(key, P); UNDERW.set(s, P); }
    return P;
  }
  const UNDER_K = {garn:'garn', line:'line', teine:'teine', teiner:'teine'};
  // the four batches by colour (the ropes and lines, the float line, the meshes and snoods, the pots): x, y, z, alpha per vertex, kept
  const UB = [0, 1, 2, 3].map(() => ({v:new Float32Array(3900 * 4), n:0}));
  let UNDER_MS = 0, UNDER_N = 0;
  function drawGearUnder(VP, eye){
    const t0 = performance.now(); UNDER_N = 0;
    const own = S.sets || []; if (!own.length && !PEERGEAR.length && !NPCGEAR.length) return;
    const E = {x:eye[0] / 1000, y:eye[2] / 1000}, tide = env.tide || 0, ys = tide + 0.06 - eye[1], R = UNDER_R / 1000, deep = VIS * 3;
    if (ys >= -0.3) return;   // (the eye at the surface: nothing to look down into)
    const lite = env.night != null ? 1 - 0.85 * env.night : 1;
    for (const B of UB) B.n = 0; UNDER_NEW = 0;
    // a point (x, the depth below the surface, z) to where the eye sees it on the surface, and how much of it shows; false when not
    const put = (B, x, d, z) => { if (B.n >= 3900) return false; const px = x - eye[0], pz = z - eye[2], py = tide - d - eye[1]; if (py >= ys) return false; const k = ys / py, h = Math.sqrt(px * px + pz * pz);
      const a = Math.exp(-d / VIS) * clamp(1 - (h - UNDER_R * 0.4) / (UNDER_R * 0.6), 0, 1) * clamp(-ys / Math.max(1, h) * 3, 0.15, 1) * lite, o = B.n * 4;
      B.v[o] = px * k; B.v[o + 1] = ys; B.v[o + 2] = pz * k; B.v[o + 3] = a; B.n++; return true; };
    const seg = (B, x0, d0, z0, x1, d1, z1) => { if (d0 > deep && d1 > deep) return; const n0 = B.n; if (!put(B, x0, d0, z0) || !put(B, x1, d1, z1)) B.n = n0; };
    const one = (s, k0) => {
      if (!s || s.lost || !s.a || !s.b || segDist(E, s.a, s.b) > R) return; const kind = UNDER_K[k0] || 'garn', P = underProf(s, kind); if (!P) return; const pts = P.pts, n = pts.length - 1; UNDER_N++;
      // the buoy ropes: from the buoy at the surface down to the grapnel on the bottom (only their top shows)
      const r0 = Math.min(deep, pts[0][2]) / pts[0][2], r1 = Math.min(deep, pts[n][2]) / pts[n][2];
      seg(UB[0], P.A[0], 0.3, P.A[1], P.A[0] + (P.ga[0] - P.A[0]) * r0, Math.min(deep, pts[0][2]), P.A[1] + (P.ga[1] - P.A[1]) * r0);
      seg(UB[0], P.B[0], 0.3, P.B[1], P.B[0] + (P.gb[0] - P.B[0]) * r1, Math.min(deep, pts[n][2]), P.B[1] + (P.gb[1] - P.B[1]) * r1);
      // the string along the bottom, only where the bottom is within sight (most sets lie deeper and end here)
      const top = kind === 'garn' ? 2.6 : 0.5; if (P.dmin - top > deep) return;
      const lo = clamp(Math.min(P.L * 0.2, pts[0][2] * 0.5) / Math.max(1, P.L), 0, 0.5), hi = 1 - clamp(Math.min(P.L * 0.2, pts[n][2] * 0.5) / Math.max(1, P.L), 0, 0.5);
      const at = f => { const q = clamp(f, 0, 1) * n, i = Math.min(n - 1, Math.floor(q)), u = q - i, a = pts[i], b = pts[i + 1]; return [a[0] + (b[0] - a[0]) * u, a[2] + (b[2] - a[2]) * u, a[1] + (b[1] - a[1]) * u]; };
      const m = Math.max(2, Math.min(120, Math.ceil(P.L * (hi - lo) / (8 + segDist(E, s.a, s.b) * 60))));   // (8 m strokes near, 32 m at 400 m)
      const step = kind === 'garn' ? 3 : kind === 'line' ? 2.5 : 22, nx = Math.max(1, Math.min(160, Math.round(P.L * (hi - lo) / step)));
      for (let i = 0; i < m; i++){ const a = at(lo + (hi - lo) * i / m), b = at(lo + (hi - lo) * (i + 1) / m);
        if (kind === 'garn'){ seg(UB[0], a[0], a[1] - 0.2, a[2], b[0], b[1] - 0.2, b[2]); seg(UB[1], a[0], a[1] - 2.6, a[2], b[0], b[1] - 2.6, b[2]); }   // lead line, float line 2.4 m above it
        else seg(UB[0], a[0], a[1] - (kind === 'line' ? 0.5 : 0.1), a[2], b[0], b[1] - (kind === 'line' ? 0.5 : 0.1), b[2]); }
      // the meshes (a stroke every 3 m), the snoods with their hooks (every 2.5 m), the pots (every 22 m), only where they can show
      // (only within UNDER_DET of the eye: further off a stroke every few metres is less than a pixel apart, one grey with the string)
      const ex = eye[0] - P.A[0], ez = eye[2] - P.A[1], tc = (ex * P.ux + ez * P.uz) / Math.max(1, P.L), pp = Math.abs(ex * P.uz - ez * P.ux), w = Math.sqrt(Math.max(0, UNDER_DET * UNDER_DET - pp * pp)) / Math.max(1, P.L);
      if (w <= 0 || UB[2].n >= 3900) return;
      const j0 = Math.max(0, Math.floor((tc - w - lo) / (hi - lo) * nx)), j1 = Math.min(nx, Math.ceil((tc + w - lo) / (hi - lo) * nx));
      for (let j = j0; j <= j1; j++){ const a = at(lo + (hi - lo) * j / nx); if (a[1] - top > deep) continue;
        if (kind === 'garn') seg(UB[2], a[0], a[1] - 0.2, a[2], a[0], a[1] - 2.6, a[2]);
        else if (kind === 'line') seg(UB[2], a[0], a[1] - 0.5, a[2], a[0] + P.uz * 0.3, a[1] - 0.05, a[2] - P.ux * 0.3);
        else put(UB[3], a[0], a[1] - 0.3, a[2]); }
    };
    for (const s of own) one(s, s.kind); for (const s of PEERGEAR) one(s, s.k); for (const s of NPCGEAR) one(s, s.k);
    if (UB.every(B => !B.n)){ UNDER_MS = UNDER_MS * 0.9 + (performance.now() - t0) * 0.1; return; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const COL = [[0.5, 0.58, 0.5], [0.95, 0.8, 0.36], [0.62, 0.78, 0.72], [0.34, 0.5, 0.4]];   // (pale: seen through green water)
    for (let c = 0; c < 4; c++){ const B = UB[c], nV = c === 3 ? B.n : B.n - (B.n & 1); if (!nV) continue;
      for (let i = 0; i < nV; i++){ PB[i * 3] = B.v[i * 4]; PB[i * 3 + 1] = B.v[i * 4 + 1]; PB[i * 3 + 2] = B.v[i * 4 + 2]; PA[i] = B.v[i * 4 + 3] * 0.85; }
      drawPts(nV, c === 3 ? gl.POINTS : gl.LINES, VP, COL[c], c === 3 ? 60 : 1, c === 3); }
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
    UNDER_MS = UNDER_MS * 0.9 + (performance.now() - t0) * 0.1;
  }
  // the work on deck: the hauler turning, the string running over it to the water, pots stacking, the net piling in its bin
  // The haulers from Blender (tools/gear/haler.py, the user's drawings 03.10.2026): the net hauler and the line hauler on a post inside
  // the starboard rail with the arm out over the side. Parts from their own origins: the frame from the post's foot, the sheave and the
  // stripper from their axles (along the boat, so they turn about z); in the extras the path the gear takes over them.
  const HAULM = {}; let HAULA = 0, HAULT = 0, GAFFH = null;   // GAFFH: where the line was at the last frame (the gaff events)
  // setting nets or lines (plan E2): the gear runs from the stack over the stern into the sea astern at the setting speed, the net with
  // its floats and lead line, the line with baited hooks on their snoods; the grapnel goes over first and sinks
  let SETA = 0, SETT = 0, SETG = null, SETT0 = 0;
  // (over: where a boat worked by hand sets it over her rail, OB1: the wooden boat's starboard quarter, snekke23.py skiff.set; the
  // double-ended stern has the rudder and the tiller in the way)
  function drawSetting(BMrel, t, g, G, stack, x0, over){
    const garn = g.kind === 'garn', gw = G.gw || 1, st = G.stern, v = clamp(2.5 * KNV(), 0.6, 4);
    SETA += v * clamp(t - SETT, 0, 0.1); SETT = t; if (SETG !== g){ SETG = g; SETT0 = t; }
    // (OB3, F4 and F20: on a boat with a crew the gear goes over where the one setting stands, deckcrew.js setPlan: through the line
    // setter (in at its mouth, out over the roller) or the net chute when she has the one for the gear, else over the stern at the models'
    // own place or over the rail; the line from the tub that stands by him, or from the first tub in the magazine; the net from its tub)
    const PN = !over && !G.hand && typeof CREW3D !== 'undefined' && CREW3D.on() ? CREW3D.setPlan(g.kind) : null;
    let O = over, path, hand = null;
    if (PN){ const E0 = PN.ov, a = PN.dir, ca = Math.cos(a), sa = Math.sin(a), fr = (lx, ly, lz) => [E0[0] + ca * lx + sa * lz, E0[1] + ly, E0[2] - sa * lx + ca * lz], X = kitX('upg');
      const from = garn ? [stack[0], stack[1] + 0.8, stack[2]] : PN.mag && X.mag ? fr(0, X.mag.top + 0.33, -(X.mag.at[0] + 0.27)) : PN.tub ? [PN.tub[0], PN.tub[1] + 0.33, PN.tub[2]] : [stack[0], stack[1] + 0.35, stack[2]];
      path = [from];
      if (PN.thru === 'linesetter' && X.setter){ path.push(fr(X.setter.mouth[0], X.setter.mouth[1], X.setter.mouth[2]), fr(X.setter.lip[0], X.setter.lip[1] + 0.02, X.setter.lip[2])); }
      else if (PN.thru === 'garnrenne' && X.renne){ path.push(fr(0, 0.07, -X.renne.in), fr(X.renne.lip[0], X.renne.lip[1] + 0.03, X.renne.lip[2])); }
      else path.push(E0.slice());
      // (from there it falls to the sea and lies where it falls as she runs on: aft of her, whichever way it went over)
      const E = path[path.length - 1], lat = [0.1, 0.3, 0.6, 0.9], out = [0.3, 0.6, 0.8, 1.0], aft = [0, 2.0, 8.6, 15.6], ys = [E[1] - 0.15, -0.12, -1.0, -2.6];
      for (let i = 0; i < 4; i++) path.push([E[0] + sa * out[i] + ca * lat[i], ys[i], E[2] + ca * out[i] - sa * lat[i] + aft[i]]);
      if (PN.man){ const m = PN.man; hand = [m[0] + Math.sin(m[3]) * 0.38, m[1] + 1.12, m[2] - Math.cos(m[3]) * 0.38]; }
      KST.setting = {ov:E.map(v => Math.round(v * 100) / 100), thru:PN.thru || null, mag:!!PN.mag, tub:!!PN.tub, man:!!PN.man};
    } else path = O ? [[stack[0], stack[1] + 0.35, stack[2]], [O[0] - 0.05, O[1] + 0.06, O[2]], [O[0] + 0.12, O[1] - 0.02, O[2] + 0.15], [O[0] + 0.5, -0.12, O[2] + 1.6], [O[0] + 0.9, -1.0, O[2] + 8], [O[0] + 1.2, -2.6, O[2] + 15]]
      : [[stack[0], stack[1] + 0.35, stack[2]], [x0, gw + 0.1, st - 0.15], [x0 + 0.1, gw - 0.05, st + 0.15], [x0 + 0.3, -0.12, st + 2.4], [x0 + 0.6, -1.0, st + 9], [x0 + 0.9, -2.6, st + 16]];
    const L = []; let tot = 0; for (let i = 1; i < path.length; i++){ const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); L.push(l); tot += l; }
    const pos = s => { let i = 0; while (i < L.length - 1 && s > L[i]){ s -= L[i]; i++; } const u = clamp(s / L[i], 0, 1), A = path[i], B = path[i + 1]; return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]; };
    for (let i = 1; i < path.length; i++){ drawN(garn ? GB.float : GB.net, chain(BMrel, limbM(path[i - 1], path[i], garn ? 0.012 : 0.006)));
      if (garn) drawN(GB.net, chain(BMrel, limbM([path[i - 1][0], path[i - 1][1] - 0.3, path[i - 1][2]], [path[i][0], path[i][1] - 0.3, path[i][2]], 0.008))); }
    const sp = garn ? 1.0 : 1.4;
    for (let s = SETA % sp; s < tot; s += sp){ const p = pos(s), q = pos(Math.min(tot, s + (garn ? 0.12 : 0.05)));
      if (garn){ drawN(GB.float, chain(BMrel, limbM([p[0], p[1] + 0.04, p[2]], [q[0], q[1] + 0.04, q[2]], 0.035))); drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.3, p[2]], 0.005))); }
      else { drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.22, p[2] + 0.02], 0.004))); drawN(GB.bait, chain(BMrel, M4.T(p[0], p[1] - 0.24, p[2] + 0.02))); } }
    const ta = t - SETT0;
    // (the grapnel first: in the hands of the one setting for a moment, then thrown clear of the stern)
    if (PN && GB.dregg && g.done === 0 && ta < 4.6){ const A = hand || path[path.length - 5], B = path[path.length - 3], u = clamp((ta - 0.6) / 1.4, 0, 1), dn = Math.max(0, ta - 2.0);
      drawN(GB.dregg, chain(BMrel, M4.T(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - 0.1 - A[1]) * u + Math.sin(Math.PI * u) * 0.7 - dn * 0.9, A[2] + (B[2] - A[2]) * u + dn * 0.4), M4.RX(Math.max(0, ta - 0.6) * 2))); }
    else if (GB.dregg && g.done === 0 && ta < 4){ const u = clamp(ta / 1.4, 0, 1), A = path[1], B = O ? [O[0] + 0.6, -0.2, O[2] + 1.8] : [x0 + 0.4, -0.2, st + 2.6], dn = Math.max(0, ta - 1.4);
      drawN(GB.dregg, chain(BMrel, M4.T(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + Math.sin(Math.PI * u) * 0.6 - dn * 0.9, A[2] + (B[2] - A[2]) * u + dn * 0.4), M4.RX(ta * 2))); }
  }
  // the autoline going out (H2d2, 06.11.2026): the baiting machine baits each hook as the line runs out through the setting chute in her
  // stern (anchors.aline.chute) and down the slide (aline.slide, tools/boats/al45.py); it falls to the sea and streams astern in her wake,
  // the snoods with their baited hooks every 1.3 m (squid or saury, as the set was baited, tools/gear/autoline.py), at her speed through
  // the water so it lies where it falls as she runs on (at most what the frame rate shows, else the hooks would be seen to run back).
  // The end lines go first (g.lead): then the rope alone, slower
  let ASETA = 0, ASETT = 0;
  function drawAutoSet(BMrel, t, g, G){
    const AL = G.aline, C = AL.chute, Sl = AL.slide || [C[0], C[1] - 0.5, C[2] + 1], x = C[0], lead = g.lead > 0;
    const v = lead ? Math.min(5, Math.max(1, bv.spd || 0) + 1) : Math.min(Math.max(bv.spd || 0, 1.5), 0.42 * 1.3 * clamp((typeof FPS !== 'undefined' && FPS.v) || 30, 10, 60));
    ASETA += v * clamp(t - ASETT, 0, 0.1); ASETT = t;
    const z = Sl[2], path = [[x, C[1] + 0.42, C[2] - 0.7], [x, C[1] + 0.1, C[2] + 0.05], [x, Sl[1] + 0.06, z], [x + 0.03, Sl[1] - 0.55, z + 0.9], [x + 0.06, -0.05, z + 2.6], [x + 0.12, -0.12, z + 12], [x + 0.25, -0.7, z + 32], [x + 0.4, -2.8, z + 58]];
    const Ls = []; let tot = 0; for (let i = 1; i < path.length; i++){ const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); Ls.push(l); tot += l; }
    const pos = s => { let i = 0; while (i < Ls.length - 1 && s > Ls[i]){ s -= Ls[i]; i++; } const u = clamp(s / Ls[i], 0, 1), A = path[i], B = path[i + 1]; return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]; };
    for (let i = 1; i < path.length; i++) drawN(GB.net, chain(BMrel, limbM(path[i - 1], path[i], lead ? 0.011 : 0.008)));
    const hm = (g.s && g.s.bait === 'saury' ? GB.aEgS : GB.aEgB) || GB.aEgS || GB.aEgB; KST.aSet = 0; if (lead || !hm) return;
    // (on the slide and in the air the snoods hang from the line; in the water they trail aft in the wake)
    for (let s = ASETA % 1.3; s < tot; s += 1.3){ const p = pos(s); if (p[2] < C[2] - 0.05) continue; if (p[1] < -1.0) break;
      const tr = clamp((p[2] - z - 1.5) / 3, 0, 1); drawN(hm, chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RX(-tr * 1.1))); KST.aSet++; }
  }
  // fish in the meshes or on the hooks coming up while hauling (plan E2): as many as the set still holds, the species in proportion
  function haulFish(g){
    const s = (S.sets || []).find(x => x.id === g.sid); if (!s || g.op !== 'haul') return null;
    let kg = 0, nF = 0; const cum = []; for (const sp in s.acc){ if (sp === 'krabbe') continue; const k = s.acc[sp].kg || 0; if (k > 0){ kg += k; nF += s.acc[sp].n || k / 3; cum.push([sp, kg]); } }
    if (kg <= 0) return null;
    // the real fish per hook (per metre of net) on what is left of the string, shown a little thicker so it reads at a glance, and at
    // least one in eight while anything is left (tilbakemelding #30: «flere fisk synes på krokene»)
    const left = Math.max(0.2, (g.n - g.done) - (g.sub || 0) / (g.sl || 1)), unit = g.kind === 'garn' ? 30 : Math.max(10, g.hooksPer || 30);
    return {p:clamp(nF / left / unit * 3, nF >= 1 ? 0.125 : 0, 0.85), sp:r => (cum.find(c => r * kg <= c[1] + 1e-9) || cum[0])[0]};
  }
  // (kind 'auto': the autoline hauler with its hook cleaner, tools/gear/autoline.py, set in the autoliner's hauling port, anchors.aline)
  function haulModel(kind){
    if (kind in HAULM) return HAULM[kind]; HAULM[kind] = null; const type = kind === 'auto' ? 'gear-autoline' : 'haul-' + kind;
    if (typeof glbHas !== 'function' || !glbHas(type)) return null;
    const G = glbLoad(type), ex = (G && G.ex) || {}, mk = nm => { const o = glbPart(type, nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) c[i * 3 + k] = o.c[i * 4 + k]; return {pb:buf(asF32(o.p)), cb:buf(c), n}; };
    if (ex.axle && ex.path) HAULM[kind] = {frame:mk('frame'), sheave:mk('sheave'), stripper:mk('stripper'), ax:ex.axle, st:ex.stripper, r:ex.r, rg:ex.rg || ex.r, path:ex.path};
    return HAULM[kind];
  }
  // who hauls: those on the station «Haling» (13-work.js), and whether you are one of them
  function gopHauls(){ return typeof workAssign === 'function' ? waNow().filter(p => p.st === 'haling') : []; }
  // who stands where, once a frame for the view (workAssign is asked by the deck, the hauler and the skipper's place each frame)
  const WAF = {f:-1, A:null}; function waNow(){ if (WAF.f !== FRAMEN || !WAF.A) { WAF.f = FRAMEN; WAF.A = workAssign(); } return WAF.A; }
  const gopHands = () => gopHauls().length;
  const gopMe = () => { const b = S.boat; return !!(b.gop && b.status === 'fishing' && gopHauls().some(p => !p.c)); };
  // Pots (the user's wish 04.10.2026): each comes up on the rope over the davit's block (by hand over the rail without the pot hauler),
  // swings in onto the deck by the rail, is opened and emptied into the crab tank, baited, shut and stacked aft; setting, it goes from
  // the stack over the side and sinks. The cycle has its own clock, one pot in the time the work takes (gopUnitMin, then the measured
  // time between pots), and starts again when the simulation counts a pot done, so it never runs ahead of the catch.
  const POTA = {g:null, done:-1, t0:0, dur:10, sh:0, st:0, fix:null};   // fix: a phase held for pictures (G3._debug.pota)
  const potDavit = skiff => !skiff && !!(GB && GB.davit) && !!S.equip.teinehaler;
  // where a pot of half width pw stands on deck: the spot by the rail where it is emptied, the tank across from it, the stack aft
  // (ph the pot's height; the stack is two high on the boats under 12 m and three on the larger, max the pots it holds; a model with
  // its own pot places, kit.pots, says where a pot is emptied: on the conveyor under the snow crab vessel's portal)
  function potDeck(G, HP, sx, d, pw, vt, ph){
    // (OB16: the spot aft of where the pot hand stands by the hauler, deckcrew.js places().pot, 0.9 m aft of it: he stands at its
    // forward edge with the hauler forward of him, and it tips over inboard away from him)
    const KS = G.kit && G.kit.pots && G.kit.pots.spot, spot = KS ? KS.slice() : [sx - 0.25 - pw, d.y, HP[2] + 1.3 + pw], cols = Math.max(1, Math.floor((2 * sx - 0.3) / (2 * pw + 0.08)));
    const h = ph || pw * 0.93, layers = ((VESSELS[vt || vtype()] || {}).len || 10) < 12 ? 2 : 3;
    return {spot, cols, max:cols * layers, tank:tankAt(-(sx - 0.5), spot[2], d, vt || vtype()), slot:i => { const L = Math.floor(i / cols), c = i % cols; return [spot[0] - c * (2 * pw + 0.08), d.y + L * (h + 0.01), spot[2] + 2 * pw + 0.3]; }};
  }
  // The pots are conical and nest in stacks (OB16, Jonas 09.11.2026, with a picture: «Denne typen teiner er mer plass-vennelig på alle
  // typer båter»; the square pot is out of the game: «De firkantede teinene kan vi sikkert fjerne fra spillet»). The set a boat works:
  // the snow crab vessel's (VESSELS pot 'sno', tools/gear/snoteine.py) or the coastal fleet's king crab pot (tools/gear/teine.py kong).
  // top: the one on top of a stack, one: a pot on its own, lag: one nested under another, full: those under the top one of a full stack
  function potSet(){ if (!GB) buildGear(); const V = VESSELS[vtype()] || {}, sno = !!(POTS[V.pot] || {}).sno;
    if (sno) return GB.kon && GB.konlag ? {top:GB.kontopp || GB.kon, one:GB.kon, lag:GB.konlag, full:GB.konlag11, X:(GB.px || {}).kon || {}} : null;
    return GB.kk && GB.kklag ? {top:GB.kktopp || GB.kk, one:GB.kk, lag:GB.kklag, full:GB.kkfull, X:(GB.px || {}).kong || {}} : null; }
  // where the stacks stand: the model's places (kit.pots: at [x, y, z, ry] each, h the most to a stack there, spot where a hauled pot is
  // emptied), else, on a model that has none yet, a row aft of the hauler as the old stack stood, four high under 12 m and six over
  function potPlaces(G, d, HP, sx, PS){ const K = G.kit && G.kit.pots; if (K && K.at && K.at.length) return K;
    if (G.hand || !HP) return null; const r = PS.X.r || 0.725, D = potDeck(G, HP, sx, d, r), at = [];
    for (let c = 0; c < D.cols; c++) at.push([D.spot[0] - c * (2 * r + 0.08), d.y, D.spot[2] + 2 * r + 0.3, 0]);
    return {at, h:((VESSELS[vtype()] || {}).len || 10) < 12 ? 4 : 6}; }
  // the most to a stack on a place (its own fifth number, else the places' h, never more than a full stack)
  const stackH = (K, PS, a) => { const full = PS.X.stack || 10; return Math.max(1, Math.min(full, (a && a[4]) || K.h || full)); };
  // the pots nested in stacks on the places, as many as are aboard; a full stack is two meshes (those nested under the top one, and the
  // top one). Returns how many were drawn
  function drawPotStacks(BMrel, K, n, PS){
    const full = PS.X.stack || 10, P = PS.X.pitch || 0.15; let left = Math.max(0, Math.round(n)), drawn = 0;
    for (const a of K.at || []){ if (left <= 0) break; const k = Math.min(stackH(K, PS, a), left), M = chain(BMrel, M4.T(a[0], a[1], a[2]), M4.RY(a[3] || 0)); left -= k; drawn += k;
      if (k === full && PS.full) drawN(PS.full, M); else for (let i = 0; i < k - 1; i++) drawN(PS.lag, chain(M, M4.T(0, i * P, 0)));
      drawN(PS.top, chain(M, M4.T(0, (k - 1) * P, 0))); }
    return drawn;
  }
  // where the pot numbered i (from 0) stands in the stacks: on its stack's place, as high as those under it
  // (more than the places hold: on top of the last stack)
  function stackTop(K, i, d, PS){ const P = PS.X.pitch || 0.15, at = K.at || []; if (!at.length) return [0, d.y, 0];
    for (const a of at){ const h = stackH(K, PS, a); if (i < h) return [a[0], a[1] + i * P, a[2]]; i -= h; }
    const a = at[at.length - 1]; return [a[0], a[1] + (stackH(K, PS, a) - 1) * P, a[2]]; }
  // the pots of the boat's own kind aboard while she is rigged for them and not working them (Jonas' survey 30.10.2026, D5)
  function potsAboard(){ const P = (S.pgear || {}).pots || {}, V = VESSELS[vtype()] || {}; return (V.pot ? P[V.pot] : P.big) || 0; }
  function drawPotsAboard(BMrel, G, d, n){
    if (n <= 0) return 0; const PS = potSet(); if (!PS) return 0;
    const K = potPlaces(G, d, G.hauler, G.beam / 2, PS); return K ? drawPotStacks(BMrel, K, n, PS) : 0;
  }
  // the crab tank across from the hauler stands on clear deck: where a house or a cabin is there (the new speed sjark's hauler stands
  // under the cabin's roof, and the tank went through its wall; Jonas 21.10.2026), the nearest place on the deck map (vessel3d.js
  // deckMap) its footprint fits, keeping to its side; worked out once per boat type and hauler. The map keeps the top floor of each cell,
  // so the deck under a shelter deck reads as the shelter's top (the 15 m coastal boat's work deck): a cell with a floor 1.9 m or more
  // over the tank's is room under a deck. Where the deck itself is all thwarts and boxes (the old wooden boat), the tank stands on a low
  // flat platform instead (up to 0.75 m over the deck). Where the open deck is smaller than the tank (the old wooden boat's well between
  // the thwarts and the engine box, 0.6 by 0.8 m), a smaller tank is drawn, down to 70 %: the fifth number is its scale
  const TANKAT = {};
  function tankAt(x, z, d, vt){
    const key = vt + '|' + x.toFixed(2) + '|' + z.toFixed(2); if (key in TANKAT) return TANKAT[key];
    const M = typeof deckMap === 'function' ? deckMap(vt) : null, T = (GB && GB.px || {}).tank || {half:[0.36, 0.56]};
    if (!M) return TANKAT[key] = [x, d.y, z, true, 1];
    let hx, hz;
    // the height its bottom stands at over the footprint (the highest floor there, the deck's camber), or null where it does not fit
    const fits = (cx, cz, y) => { let top = -1e9; for (let qx = cx - hx; qx <= cx + hx + 1e-6; qx += M.c / 2) for (let qz = cz - hz; qz <= cz + hz + 1e-6; qz += M.c / 2){ const f = M.floorAt(qx, qz);
      if (f > y + 1.9) continue; if (!(Math.abs(f - y) < 0.25)) return null; if (f > top) top = f; } return top > -1e8 ? top : y; };
    // the height it stands at here: on the deck, else on the floor under its middle when that is a low platform
    const standAt = (cx, cz) => { const y = fits(cx, cz, d.y); if (y != null) return y; const f = M.floorAt(cx, cz); return f > d.y + 0.25 && f < d.y + 0.75 ? fits(cx, cz, f) : null; };
    for (const s of [1, 0.85, 0.7]){ hx = T.half[0] * s - 0.05; hz = T.half[1] * s - 0.05;
      const y0 = fits(x, z, d.y); if (y0 != null) return TANKAT[key] = [x, y0, z, true, s];
      let bd = 1e9, best = null;
      for (let dz = -3; dz <= 3.001; dz += 0.1) for (let dx = 0; dx <= 1.5; dx += 0.1){ const cx = x - Math.sign(x) * dx, c0 = dz * dz + 2 * dx * dx; if (c0 >= bd) continue;
        const y = standAt(cx, z + dz); if (y == null) continue; const c = c0 + 8 * (y - d.y) * (y - d.y); if (c < bd){ bd = c; best = [cx, y, z + dz]; } }
      if (best) return TANKAT[key] = [best[0], best[1], best[2], true, s]; }
    return TANKAT[key] = [x, d.y, z, false, 0.7];   // (the fourth: its footprint is all deck; false: no place found)
  }
  function drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg){
    const PS = skiff ? null : potSet(); if (!PS) return;
    const s = g.op === 'haul' ? (S.sets || []).find(x => x.id === g.sid) : g.s, ps = 1, X = GB.px || {}, XP = PS.X, KP = potPlaces(G, d, HP, sx, PS); if (!KP) return;
    // (the snow crab vessel: no davit, the line over the hauler at her side; the coastal boats: over the davit's block)
    const ph = (XP.h || 0.7) * ps, pw = (XP.r || 0.725) * ps, gw = G.gw || d.y + 0.9, D = potDeck(G, HP, sx, d, pw, null, ph), PM = PS.one;
    const base = potsAboard();   // the pots aboard besides those of this set
    if (POTA.g !== g || g.done !== POTA.done){
      if (POTA.g === g && g.done === POTA.done + 1) POTA.dur = clamp(t - POTA.t0, 2, 40);
      else { let m = 1.2; try { m = gopUnitMin(g, S.t / 60, hsAt(S.boat.pos, S.t / 60)); } catch (e){} POTA.dur = clamp(m * 60 / simRate(), 2, 40); }
      POTA.g = g; POTA.done = g.done; POTA.t0 = t; }
    const u = POTA.fix != null ? POTA.fix : clamp((t - POTA.t0) / POTA.dur, 0, 1), sm = v => v * v * (3 - 2 * v), ph01 = (a, b) => sm(clamp((u - a) / (b - a), 0, 1)), lerp = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
    if (G.snok && GB.snoHaul && G.kit && G.kit.pots){ snoWork(BMrel, t, u, g, s, G, d, base, KP, XP, seg, PS); return; }   // (the snow crab vessel's own work, H3d2)
    const DV = potDavit(skiff) && !G.snok, P0 = [sx - 0.2, d.y, HP[2]], blk = DV && X.davit ? [P0[0] + X.davit.block[0], P0[1] + X.davit.block[1], P0[2] + X.davit.block[2]] : [sx + 0.05, gw + 0.05, HP[2]];
    const potM = (p, rz, rx) => chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RZ(rz || 0), M4.RX(rx || 0), M4.S(ps));
    // tipped over its inboard edge of the bottom ring by tip (rad) to be emptied through its laced bottom
    const tipM = (p, tip) => chain(BMrel, M4.T(p[0] - pw, p[1], p[2]), M4.RZ(tip), M4.T(pw, 0, 0), M4.S(ps));
    const RG = XP.ring != null ? XP.ring : 0.45, ring = (p, rz) => [p[0] - Math.sin(rz || 0) * (ph + RG), p[1] + Math.cos(rz || 0) * (ph + RG), p[2]];
    const bridle = p => { const R = ring(p); for (const c of XP.bridle || []) drawN(GB.float, chain(BMrel, limbM([p[0] + c[0] * ps, p[1] + c[1] * ps, p[2] + c[2] * ps], R, 0.006))); };
    // the crabs in the pot now: the set's catch shared over its pots, at most five drawn
    const csp = Object.keys((s && s.acc) || {}).find(k => SPECIES[k] && SPECIES[k].shell && s.acc[k].n > 0) || 'krabbe', crabN = s && s.acc && s.acc[csp] ? Math.min(5, Math.max(SPECIES[csp].npc ? 2 : 0, Math.round(s.acc[csp].n / Math.max(1, s.n)))) : 0;   // (the ocean's crab: at least two seen)
    const crabsIn = (p, left) => { for (let k = 0; k < left; k++) drawN(fishOf(csp), chain(BMrel, M4.T(p[0] + (hash(k * 5 + 1) - 0.5) * pw, p[1] + 0.02, p[2] + (hash(k * 7 + 2) - 0.5) * pw), M4.RY(hash(k * 3) * 6.3), M4.S(0.8 * (0.85 + 0.3 * hash(k * 11))))); };
    // the hauler on its davit: the sheave turns while the rope runs
    const running = g.op === 'haul' ? u < 0.55 : u > 0.55;
    POTA.sh += (running ? 5 : 0) * clamp(t - POTA.st, 0, 0.1); POTA.st = t;
    if (DV){ drawN(GB.davit, chain(BMrel, M4.T(P0[0], P0[1], P0[2]))); if (GB.davitSh && X.davit) drawN(GB.davitSh, chain(BMrel, M4.T(P0[0] + X.davit.sheave[0], P0[1] + X.davit.sheave[1], P0[2] + X.davit.sheave[2]), M4.RZ(-POTA.sh)));
      if (X.davit) seg(blk, [P0[0] + X.davit.sheave[0] + 0.15, P0[1] + X.davit.sheave[1] + 0.12, P0[2]], 0.008, GB.float, 0); }
    // the stack: the pots aboard but the one in hand
    const nS = g.op === 'haul' ? g.done : Math.max(0, g.n - g.done - 1);
    drawPotStacks(BMrel, KP, base + nS, PS);
    if (g.done >= g.n) return;
    const clear = gw + 0.12, out = [blk[0], 0, blk[2]];
    if (g.op === 'haul'){
      // up from the bottom, out of the water to the block, in over the rail, down on deck by it
      let p, rz = 0; const sway = Math.sin(t * 1.3) * 0.08;
      if (u < 0.42) p = [out[0] + sway, -9 + 8.4 * ph01(0, 0.42), out[2] + sway * 0.5];
      else if (u < 0.55) p = [out[0] + sway * (1 - ph01(0.42, 0.55)), -0.6 + (clear + 0.6) * ph01(0.42, 0.55), out[2]];
      else if (u < 0.62) p = [out[0] + (D.spot[0] - out[0]) * ph01(0.55, 0.62), clear, out[2] + (D.spot[2] - out[2]) * ph01(0.55, 0.62)];
      else if (u < 0.66) p = [D.spot[0], clear + (D.spot[1] - clear) * ph01(0.62, 0.66), D.spot[2]];
      else if (u < 0.9) p = D.spot.slice();
      else { const k = ph01(0.9, 1), S2 = stackTop(KP, base + g.done, d, PS); p = lerp(D.spot, S2, k); p[1] += Math.sin(Math.PI * k) * (ph + 0.15); }
      if (u < 0.62){ const R = ring(p); seg(R, blk, 0.008, GB.float, 0); bridle(p); }
      // tipped over on its side, the bottom's lacing opened and the crabs shaken out one by one to the tank (or down the hold), set up
      // again, the bottom laced and the bait jar filled
      const open = ph01(0.66, 0.7) * (1 - ph01(0.8, 0.84)), tk = S.equip.krabbekar ? [D.tank[0], D.tank[1] + ((X.tank || {}).water || 0.58) * (D.tank[4] || 1) + 0.05, D.tank[2]] : [0, d.y + 0.2, d.z];
      let left = crabN; if (u > 0.7) for (let k = 0; k < crabN; k++){ const a = 0.7 + k * 0.13 / Math.max(1, crabN), f = clamp((u - a) / 0.05, 0, 1); if (f <= 0) continue; left--; if (f >= 1) continue;
        const A = [p[0] - pw * 0.9, p[1] + 0.6, p[2]], Q = lerp(A, [tk[0] + (hash(k) - 0.5) * 0.4, tk[1], tk[2] + (hash(k + 3) - 0.5) * 0.6], f); Q[1] += Math.sin(Math.PI * f) * 0.7;
        drawN(fishOf(csp), chain(BMrel, M4.T(Q[0], Q[1], Q[2]), M4.RY(f * 3), M4.RX(0.5), M4.S(0.8))); }
      if (u < 0.9) crabsIn(p, Math.max(0, left));
      drawN(PM, open > 0 ? tipM(p, 1.45 * open) : potM(p, rz));
      if (u > 0.82 && u < 0.86){ const f = (u - 0.82) / 0.04; drawN(GB.bait, chain(BMrel, M4.T(p[0] + 0.3 * (1 - f), p[1] + ph + 0.3 * (1 - f), p[2]), M4.S(3))); }
    } else {
      // from the top of the stack to the rail, over it (tipped outboard) and down to the bottom, drifting aft as the boat goes ahead
      const S0 = stackTop(KP, base + Math.max(0, g.n - g.done - 1), d, PS), rail = [sx - pw * 0.2, clear, D.spot[2]]; let p, rz = 0;
      if (u < 0.35){ const k = ph01(0, 0.35); p = lerp(S0, rail, k); p[1] += Math.sin(Math.PI * k) * 0.3; }
      else if (u < 0.55){ const k = ph01(0.35, 0.55); p = [rail[0] + (pw + 0.5) * k, clear + 0.2 * Math.sin(Math.PI * k) - 0.5 * k * k, rail[2]]; rz = -1.3 * k; }
      else { const k = (u - 0.55) / 0.45; p = [rail[0] + pw + 0.5 + 0.3 * k, clear - 0.5 - (clear + 8.5) * k * k, rail[2] + 3 * k]; rz = -1.3 - 0.3 * k; }
      if (u > 0.35){ seg([sx, gw + 0.05, D.spot[2]], ring(p, rz), 0.008, GB.float, u > 0.55 ? 0.6 : 0.1); }
      if (p[1] > -6) drawN(PM, potM(p, rz));
    }
  }
  // the live crab tank on deck (EQUIP.krabbekar) with the crabs from the hold in it: aboard only while she is rigged for pots (Jonas
  // 21.10.2026: «Om båten ikke er rigget med teiner skal det ikke være noe krabbekar ombord»)
  function drawCrabTank(BMrel, G, d, sx, HP){
    if (!S.equip.krabbekar || (rigOf() !== 'teiner' && !tryLive('krabbekar')) || !GB || !GB.tank) return;   // (or tried on in the shop, M3)
    const pw = ((GB.px || {}).kong || {}).r || 0.725, D = potDeck(G, HP, sx, d, pw), T = (GB.px || {}).tank || {half:[0.36, 0.56], water:0.58};
    const s = D.tank[4] || 1; drawN(GB.tank, chain(BMrel, M4.T(D.tank[0], D.tank[1] + liftY('krabbekar'), D.tank[2]), M4.S(s))); KST.tank = D.tank.slice();
    const kg = S.hold.reduce((a, x) => a + (x.sp === 'krabbe' ? x.kg : 0), 0), n = Math.min(Math.round(14 * s * s), Math.ceil(kg / 4));
    for (let k = 0; k < n; k++) drawN(fishOf('krabbe'), chain(BMrel, M4.T(D.tank[0] + (hash(k * 5 + 7) - 0.5) * T.half[0] * s * 1.5, D.tank[1] + (T.water - 0.04) * s + Math.floor(k / 5) * 0.03, D.tank[2] + (hash(k * 7 + 9) - 0.5) * T.half[1] * s * 1.6), M4.RY(hash(k) * 6.3), M4.S(0.75)));
  }
  // the autoliner's hauling station without the walking crew (deckcrew.js places().port, the same places): the gaffer's and the cleaner
  // hand's places [x, z, heading], the drop and the chute's mouth in the boat's frame
  function autoPort(G){ const AL = G.aline, F = AL.foot, sl = AL.sill || [F[0] + 1, F[1] + 0.75, F[2]], fz = AL.fish ? AL.fish[2] : F[2] + 0.4, hd = (x, z, tx, tz) => Math.atan2(tx - x, -(tz - z));
    const gx = F[0] + 0.55, gz = F[2] + 0.88, tx = F[0] - 0.9, tz = F[2] + 0.82;
    return {gaff:[gx, gz, hd(gx, gz, sl[0], sl[2])], tend:[tx, tz, hd(tx, tz, F[0] - 0.42, F[2])], drop:[F[0] - 0.3, F[1] + 0.05, fz], chute:AL.fish ? [AL.fish[0] + 0.05, F[1] + 0.08, fz] : [F[0] - 2.2, F[1] + 0.08, fz]}; }
  // how far along the autoline hauler's path the hook cleaner's brush is (the path from tools/gear/autoline.py: the sea, the sill roller,
  // the guide, eleven points round the sheave, then the cleaner's slot)
  function aCleanS(HM, L){ if (HM.cl != null) return HM.cl; let s = 0; for (let i = 0; i < Math.min(L.length, 14); i++) s += L[i]; return (HM.cl = s); }
  // the gaffed fish sliding from where it was let fall into the chute's mouth (09-landing-deck.js dkTick fills ASLIDE), 0.9 s each
  function drawAutoSlides(BMrel){ if (!ASLIDE.length || !BMrel) return; const now = performance.now() / 1000; let on = false;
    for (let i = ASLIDE.length - 1; i >= 0; i--){ const f = ASLIDE[i], u = (now - f.t) / 0.9; if (u > 1){ ASLIDE.splice(i, 1); continue; } if (u < 0) continue;
      if (!on){ on = true; if (ASLIDE.VP) nSetup(ASLIDE.VP); } const k = u * u, p = [f.at[0] + (f.to[0] - f.at[0]) * k, f.at[1] + (f.to[1] - f.at[1]) * k, f.at[2] + (f.to[2] - f.at[2]) * k];
      drawN(fishOf(f.sp), chain(BMrel, M4.T(p[0], p[1] + 0.05, p[2]), M4.RY(f.yaw), M4.RZ(Math.PI / 2), M4.S(clamp(0.42 * Math.cbrt(f.kg || 2), 0.28, 1.2)))); KST.aSlid = (KST.aSlid || 0) + (f.seen ? 0 : 1); f.seen = true; } }
  // the hauler bolted on while she is not working her gear (M3): the one tried on or being lifted aboard, else the one for her rig, else
  // whichever she has (a net or line hauler on its post; the pot hauler on its davit when she is rigged for pots). drawGearOp draws it
  // while the gear is worked. The skiff's small hauler stands on its rail place.
  function drawHaulRest(BMrel, G, d, VP){
    const b = S.boat; KST.haul = null; if (b.gop && b.status === 'fishing') return; if (!GB) buildGear();
    // the autoliner: her autoline hauler stands in the hauling port whatever she does (it follows the boat, autoHooks; H2d 05.11.2026)
    if (G.aline && BOAT.autoHooks){ const HM = haulModel('auto'); if (!HM) return; const F = G.aline.foot, at = q => chain(BMrel, M4.T(F[0] + q[0], F[1] + q[1], F[2] + q[2]));
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, at(HM.ax)); drawLit(HM.stripper, at(HM.st)); KST.haul = 'autoline'; return; }
    const eq = S.equip || {}, rig = typeof rigOf === 'function' ? rigOf() : b.rig, own = k => !!eq[k] && equipFits(k, vtype());
    const hot = TRYK && /haler$/.test(TRYK) ? TRYK : HOIST && /haler$/.test(HOIST.k) ? HOIST.k : null;
    const pick = hot || (rig === 'teiner' && own('teinehaler') ? 'teinehaler' : rig === 'line' && own('linehaler') ? 'linehaler' : rig === 'garn' && own('garnhaler') ? 'garnhaler' : own('garnhaler') ? 'garnhaler' : own('linehaler') ? 'linehaler' : null);
    if (!pick) return; const up = liftY(pick);
    // (OB1, U4: a boat worked by hand with a place for the line hauler's foot, SKA.haulFoot, has the line hauler on its post there, as the
    // decked boats have it, where the others have the small drum on the rail)
    if (G.hand && SKA && SKA.haulFoot && pick === 'linehaler'){ const HM = haulModel('line'); if (HM){ const F = SKA.haulFoot, at = q => chain(BMrel, M4.T(F[0] + q[0], F[1] + up + q[1], F[2] + q[2]));
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, at(HM.ax)); drawLit(HM.stripper, at(HM.st)); KST.haul = pick; return; } }
    if (G.hand){ if (pick === 'garnhaler' || !SKA || !SKA.haul) return; nSetup(VP); drawN(GB.haul, chain(BMrel, M4.T(SKA.haul[0], SKA.haul[1] + up, SKA.haul[2]))); KST.haul = pick; return; }
    if (!G.hauler) return; const P0 = [G.beam / 2 - 0.2, d.y + up, G.hauler[2]], X = GB.px || {};
    if (G.kit && G.kit.pots && G.snok && GB.snoHaul){ snoHauler(BMrel, G, VP, 0); KST.haul = 'snokrabbe'; return; }
    if (pick === 'teinehaler'){ if (!GB.davit || G.snok) return; nSetup(VP); drawN(GB.davit, chain(BMrel, M4.T(P0[0], P0[1], P0[2])));
      if (GB.davitSh && X.davit) drawN(GB.davitSh, chain(BMrel, M4.T(P0[0] + X.davit.sheave[0], P0[1] + X.davit.sheave[1], P0[2] + X.davit.sheave[2]))); KST.haul = pick; return; }
    const HM = haulModel(pick === 'garnhaler' ? 'garn' : 'line');
    if (!HM){ nSetup(VP); drawN(GB.haul, chain(BMrel, M4.T(G.hauler[0], G.hauler[1] + up, G.hauler[2]))); KST.haul = pick; return; }
    const at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
    litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, at(HM.ax)); drawLit(HM.stripper, at(HM.st)); KST.haul = pick;
  }
  // ---- the upgrades one can see on deck (OPP5 of docs/planer/oppgraderinger.md, 10.11.2026; tools/deck/oppgr.py) ----
  // Over the stern, at the model's place kit.setter [x, y, z, ry, mag] (the middle of the rail's top at its outer edge, the part's +z out
  // over the sea; mag 0: no room on her deck for the magazine; vessel3d.js KITADD until the models carry the place themselves): the line
  // setter, with its tub magazine from the second tier, or the net chute. One place, so one of them: the one tried on or being lifted
  // aboard, else the one for her rig, else the one she has. Nothing changes what they do (10-gear.js setterX)
  function sternPick(){ const hot = [TRYK, HOIST && HOIST.k].find(k => k === 'linesetter' || k === 'garnrenne'); return hot || sternKit(vtype()); }   // (deckcrew.js sternKit: the gear is set through it, OB3)
  const UPGC = {};
  // the deck under the magazine's legs (a ray down the model, vessel3d.js deckMap): how long the legs are, their top at ly over the place
  function magLegs(vt, G, P, X){ const key = vt + ':leg'; if (key in UPGC) return UPGC[key]; const a = P[3] || 0, lz = X.leg[2], x = P[0] + Math.sin(a) * lz, z = P[2] + Math.cos(a) * lz, y = P[1] + X.leg[1];
    const M = typeof deckMap === 'function' ? deckMap(vt) : null, u = M ? M.hit([x, y - 0.05, z], [x, y - 2.05, z]) : -1; return UPGC[key] = u >= 0 ? 0.05 + u * 2 : Math.max(0.2, y - (G.deck || {y:G.gw}).y); }
  function drawStern(BMrel, G, VP){ KST.stern = null; const P = G.kit && G.kit.setter, k = P ? sternPick() : null; if (!k) return;
    const vt = vtype(), M = chain(BMrel, M4.T(P[0], P[1] + liftY(k), P[2]), M4.RY(P[3] || 0));
    if (k === 'garnrenne'){ const m = kit('upg', 'renne'); if (!m) return; nSetup(VP); drawN(m, M); KST.stern = {k}; return; }
    const m = kit('upg', 'setter'); if (!m) return; nSetup(VP); drawN(m, M); let mag = false;
    if (equipLv('linesetterLv') >= 2 && P[4] !== 0 && !/^(garn|teiner)$/.test((typeof rigOf === 'function' ? rigOf() : S.boat.rig) || '')){   // (the magazine is stowed while she is rigged for nets or pots: their gear stands where it does)
      const mm = kit('upg', 'setter_mag'), ml = kit('upg', 'setter_ben'), X = kitX('upg').mag;
      if (mm && X){ drawN(mm, M); mag = true; if (ml) drawN(ml, chain(M, M4.T(0, X.leg[1], 0), new Float32Array([1,0,0,0, 0,magLegs(vt, G, P, X),0,0, 0,0,1,0, 0,0,0,1]), M4.T(0, -X.leg[1], 0))); } }
    KST.stern = {k, mag}; }
  // The gaff of the tier she has, leaning at the rail by the hauling place while nobody holds it (the gaffer has it in his hands while the
  // gear is hauled): its butt on the deck a step in from the bulwark, its shaft against the rail's inner edge and the hook out over the
  // rail. The rail is read off the model with rays (deckMap): from outside the hauler's side in, the first thing 0.4 to 1.5 m over the
  // deck and where its top ends inboard, 0.45 to 2.4 m aft or forward of the hauler, where the deck inside it is clear
  function gaffRail(vt, G){ const key = vt + ':gaff'; if (key in UPGC) return UPGC[key]; let out = null; const M = typeof deckMap === 'function' ? deckMap(vt) : null, H = G.hauler || (SKA && SKA.haul);
    if (M && H){ const s = H[0] < 0 ? -1 : 1, dy = (G.deck || {y:G.gw}).y, top = dy + 1.6, yAt = (x, z) => { const u = M.hit([x, top, z], [x, top - 2.4, z]); return u < 0 ? null : top - u * 2.4; };
      // (what the kit stands on deck and the model does not have: the bleeding tub, the gutting table, the ice box, the fish tubs and the
      // rig's place; the gaff stands clear of them)
      const W = G.work || null, d0 = G.deck || {y:G.gw, z:2}, ib = typeof iceBoxAt === 'function' ? iceBoxAt(vt) : null, K = G.kit || {};
      const obs = [[W ? W.tub[0] : G.beam / 2 - 0.62, W ? W.tub[2] : d0.z + 0.35], [W ? W.table[0] : -(G.beam / 2 - 0.42), W ? W.table[2] : d0.z]];
      if (ib && ib.at) obs.push([ib.at[0], ib.at[2]]); for (const q of K.tubs || []) obs.push([q[0], q[2]]); for (const q of [K.garn, K.stamps]) if (q && q.at) obs.push([q.at[0], q.at[2]]);
      for (const dz of [0.75, -0.75, 1.15, -1.15, 1.55, -1.55, 1.95, -1.95, 2.4, -2.4, 0.45, -0.45]){ const z = H[2] + dz; let x0 = null, x1 = null, ty = 0;   // (x1: the rail's outer edge found, x0: its inner)
        for (let x = Math.abs(H[0]) + 0.6; x > 0.15; x -= 0.02){ const y = yAt(s * x, z);
          if (x1 == null){ if (y != null && y > dy + 0.4){ x1 = x; ty = y; } continue; }
          if (y == null || y < ty - 0.12){ x0 = x + 0.02; break; } ty = Math.max(ty, y); }
        if (x0 == null || ty > dy + 1.5) continue;
        // (the deck where the butt stands, 0.26 m inside the rail, and nothing standing on it there or between it and the rail)
        const yd = yAt(s * (x0 - 0.26), z), ym = yAt(s * (x0 - 0.13), z); if (yd == null || Math.abs(yd - dy) > 0.25 || ym == null || ym > yd + 0.12) continue;
        if (ty - yd < 0.3) continue;
        // (clear of the kit: 0.9 m along the rail or 1 m across from each thing; on the small open boats nothing is that clear, and the
        // gaff stands where it is clearest)
        const cl = Math.min(...obs.map(q => Math.max(Math.abs(q[1] - z) / 0.9, Math.abs(q[0] - s * (x0 - 0.2)) / 1.0)));
        if (!out || cl > out.cl) out = {s, x:x0, top:ty, deck:yd, z, cl}; if (cl >= 1) break; } }
    return UPGC[key] = out; }
  function drawGaffRest(BMrel, G, VP){ KST.gaff = null; const b = S.boat, vt = vtype(); if (!equipFits('hott', vt) || (b.gop && b.status === 'fishing')) return;
    const lv = equipLv('hott'), nm = lv > 1 ? 'hott' + lv : 'hott', m = gaffKit(true), R = m ? gaffRail(vt, G) : null; if (!R) return;
    const X = kitX('upg'), bl = (X.hott_butt || {})[nm] || 0.25, B = [R.s * (R.x - 0.21), R.deck + 0.02, R.z], T = [R.s * (R.x - 0.018), R.top + 0.018, R.z];
    let n = [T[0] - B[0], T[1] - B[1], T[2] - B[2]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / nl, n[1] / nl, n[2] / nl];
    // (the part's head is its -z and the hook drops to its -y: the head along the shaft, the hook's drop outboard, square to the shaft)
    const k = R.s * n[0]; let o = [R.s - n[0] * k, -n[1] * k, -n[2] * k]; const ol = Math.hypot(o[0], o[1], o[2]) || 1; o = [o[0] / ol, o[1] / ol, o[2] / ol];
    const zc = [-n[0], -n[1], -n[2]], yc = [-o[0], -o[1], -o[2]], xc = [yc[1] * zc[2] - yc[2] * zc[1], yc[2] * zc[0] - yc[0] * zc[2], yc[0] * zc[1] - yc[1] * zc[0]];
    const O = [B[0] + n[0] * bl, B[1] + n[1] * bl, B[2] + n[2] * bl];
    nSetup(VP); drawN(m, chain(BMrel, new Float32Array([xc[0], xc[1], xc[2], 0, yc[0], yc[1], yc[2], 0, zc[0], zc[1], zc[2], 0, O[0], O[1], O[2], 1]))); KST.gaff = {lv, at:[Math.round(O[0] * 100) / 100, Math.round(O[1] * 100) / 100, Math.round(O[2] * 100) / 100]}; }
  function drawUpg(BMrel, G, d, VP){ drawStern(BMrel, G, VP); drawGaffRest(BMrel, G, VP); }
  // the snow crab vessel's pot hauler (tools/gear/snoteine.py haler) on its pedestal at anchors.hauler, its sheave at its axle turned a
  // the line runs (a: the sheave's angle); it is hers from the yard, so it stands whether she is rigged or not (H3d1)
  function snoHauler(BMrel, G, VP, a){ const H = G.hauler, X = (GB.snx || {}).haler || {}, ax = X.axle || [0.1, 0.95, 0];
    if (VP) nSetup(VP); drawN(GB.snoHaul, chain(BMrel, M4.T(H[0], H[1], H[2]))); if (GB.snoSheave) drawN(GB.snoSheave, chain(BMrel, M4.T(H[0] + ax[0], H[1] + ax[1], H[2] + ax[2]), M4.RZ(-a))); }
  // ---- the snow crab vessel's work (H3d2, 08.11.2026; her places are the model's, tools/boats/krabbe50.py anchors.snok and kit.pots,
  // snokrabbe-bygging.md kap. 3). Hauling: the line comes up from the sea over the block on the portal's arm out over the starboard side,
  // round the hauler's sheave and off it to the coil on deck; a pot comes up under the block, is put on the hook and swung in over the
  // bulwark, set down on the sorting table, its bottom untied and the crabs tipped out; the hands sort them (the small ones and the
  // females down the discards' chute over the side, the males down the hole to the factory, or on a live trip into the tub that goes to
  // the tanks), bait it, and it goes aft on the conveyor to the stacks, or on down the chute and out again when the string is reset.
  // Setting: the pots from the stacks onto the conveyor, aft, down the chute and over the stern as she steams ahead, the line between
  // them, the buoy at the string's first end and the marker buoy with the dregg at its last (§ 66). The cycle is POTA's (one pot in the
  // time the work takes, never ahead of the simulation); the pots on the conveyor are those of the cycles before, so the stacks change by
  // one pot a cycle and nothing jumps. None of it is in the model: the pots, the crabs, the line, the buoys and the tub are the gear's
  // parts set on her places (CLAUDE.md). KST.sno says what the frame drew (h3dshot).
  const SNOB = 2.12, SNOS = 3;   // the cycles a hauled pot rides from the table to its stack (or over the stern; 2.12 so the last of them is on its stack as its cycle ends), and a set pot from its stack over the stern
  // the crabs in a snow crab pot as it comes up: what is left of the string's catch (s.acc, lowered as its pots are hauled) shared over
  // the pots still in the sea; at least one when there is any, none when there is none
  const snoCrabN = (s, g) => { const a = s && s.acc && s.acc.snokrabbe; if (!a || !(a.n > 0)) return 0; return Math.max(1, Math.round(a.n / Math.max(1, (s.n || 1) - (g ? g.done : 0)))); };
  function snoCrabs(BMrel, p, n, pr){ for (let k = 0; k < n; k++){ const a = hash(k * 7 + 1) * 6.28, r = pr * 0.5 * Math.sqrt(hash(k * 5 + 2)), hen = k % 3 === 2;
    drawN(fishOf(hen ? 'snokrabbe_h' : 'snokrabbe'), chain(BMrel, M4.T(p[0] + Math.cos(a) * r, p[1] + 0.05 + (k > 4 ? 0.08 : 0), p[2] + Math.sin(a) * r), M4.RY(hash(k * 3) * 6.3), M4.S(hen ? 0.34 : 0.46))); } }
  function snoWork(BMrel, t, u, g, s, G, d, base, KP, XP, seg, PS){
    const N = G.snok, haul = g.op === 'haul', ph = XP.h || 0.6, pr = XP.r || 0.65, RG = XP.ring != null ? XP.ring : 0.3, PM = GB.kon || GB.pot;
    const sm = v => v * v * (3 - 2 * v), k01 = (a, b, v) => sm(clamp((v - a) / (b - a), 0, 1)), lerp = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
    const arc = (A, B, k, h) => { const p = lerp(A, B, k); p[1] += Math.sin(Math.PI * k) * h; return p; };
    const potM = (p, rx, ry) => chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RY(ry || 0), M4.RX(rx || 0));
    const ring = p => [p[0], p[1] + ph + RG, p[2]], onBelt = p => [p[0], p[1] + 0.05, p[2]];
    const ST = KST.sno = {op:g.op, phase:null, line:false, block:false, belt:0, lift:0, chute:0, sea:0, rel:0, keep:0, live:0, buoyA:false, buoyB:false};
    // the places: the block, the hook, the hauler's sheave (where the line comes on and goes off), the table and its spot, the conveyor
    // from the table's end to the chute, the chute's top and its lip over the stern; the hole to the factory and the discards' chute's
    // mouth on the table where the model has them (krabbe50.py: the hole 0.5-1.1 m from the table's after end and 0.12-0.75 m from its
    // inboard edge, the discards' chute 1.9 m from the after end out through the bulwark)
    const blk = N.block, HK = N.hook, H = N.hauler, HX = (GB.snx || {}).haler || {}, sIn = HX.in ? [H[0] + HX.in[0], H[1] + HX.in[1], H[2] + HX.in[2]] : [H[0] + 0.5, H[1] + 1.4, H[2]];
    const sOut = HX.out ? [H[0] + HX.out[0], H[1] + HX.out[1], H[2] + HX.out[2]] : [H[0] - 0.35, H[1] + 0.35, H[2]];
    const TB = N.table, TW = (N.tsize || [1.9, 3.1])[0] / 2, TL = (N.tsize || [1.9, 3.1])[1] / 2, TS = KP.spot || TB;
    const C0 = N.conv[0], C1 = N.conv[1], CH0 = N.chute[0], CH1 = N.chute[1], tilt = Math.atan2(CH0[1] - CH1[1], CH1[2] - CH0[2]);
    const hole = [TB[0] - TW + 0.44, TB[1], TB[2] + TL - 0.8], dch = [TB[0] + TW - 0.08, TB[1], TB[2] + TL - 1.9], dOut = [G.beam / 2 - 0.05, d.y + 0.55, TB[2] + TL - 1.9];
    // her speed through the water (the set pots drift aft as she goes ahead): a metre a second at least
    const vAft = Math.max(1, (S.boat.v || 0) * 0.514);
    // a pot in the sea astern after it left the chute's lip (w: its cycles since)
    const overStern = w => { const tt = w * POTA.dur, k = clamp(tt / 1.2, 0, 1), z = CH1[2] + 0.4 + vAft * tt;
      return k < 1 ? [CH1[0] + 0.1 * k, CH1[1] - (CH1[1] + 0.35) * k * k, z] : [CH1[0] + 0.1, -0.35 - 1.6 * (tt - 1.2), z]; };
    const seaEnd = [CH1[0] + 0.3, -0.3, CH1[2] + 9];   // where the line goes into the sea astern, on to the pots already set
    // a pot's way from the table (or the top of a stack) along the conveyor: to its stack T, or (out) on down the chute and over the
    // stern; q 0-1 over its ride. Returns [p, rx, where]
    const zC = z => clamp(z, Math.min(C0[2], C1[2]), Math.max(C0[2], C1[2]));
    const ride = (q, from, T, out) => {
      const B0 = [C0[0], C0[1], zC(from[2])];
      if (q < 0.1) return [arc(from, B0, k01(0, 0.1, q), 0.35), 0, 'lift'];
      if (out){ if (q < 0.72) return [lerp(B0, C1, (q - 0.1) / 0.62), 0, 'belt'];
        if (q < 0.84){ const k = (q - 0.72) / 0.12; return [lerp(CH0, CH1, k * k), tilt * clamp(k * 3, 0, 1), 'chute']; }
        return [overStern((q - 0.84) * (haul ? SNOB : SNOS)), tilt + 0.6 * (q - 0.84) / 0.16, 'sea']; }
      const B1 = [C0[0], C0[1], zC(T[2])];
      if (q < 0.85) return [lerp(B0, B1, (q - 0.1) / 0.75), 0, 'belt'];
      return [arc(B1, T, k01(0.85, 1, q), 0.45), 0, 'lift']; };
    const count = w => { if (w === 'belt') ST.belt++; else if (w === 'lift') ST.lift++; else if (w === 'chute') ST.chute++; else if (w === 'sea') ST.sea++; };
    // the hauler's sheave turns while the line runs (hauling, until the pot is at the block)
    const running = haul && u < 0.3; POTA.sh += (running ? 5 : 0) * clamp(t - POTA.st, 0, 0.1); POTA.st = t;
    snoHauler(BMrel, G, null, POTA.sh); KST.haul = 'snokrabbe';
    const Lr = (A, B, sag) => seg(A, B, 0.009, GB.float, sag || 0);
    const draw1 = (p, rx, ry) => { if (p[1] > -6.5) drawN(PM, potM(p, rx, ry)); };
    if (haul){
      // the stacks: the pots hauled three cycles ago and before (the two before are on the conveyor); none when they go out again
      const R = !!g.reset; drawPotStacks(BMrel, KP, base + (R ? 0 : Math.max(0, g.done - 2)), PS);
      // the line from the sea over the block, round the sheave and off it down to the coil on deck forward of the table
      const Wsea = [blk[0] + 2.4, -0.3, blk[2] - 3.0], coil = [sOut[0] - 0.5, d.y + 0.08, TB[2] - TL - 0.4];
      ST.line = true; ST.block = true; Lr(blk, sIn, 0.05); Lr(sOut, coil, 0.15);
      for (let k = 0; k < 6; k++){ const a = k * 1.05, c = q => [coil[0] + Math.cos(q) * 0.32, coil[1], coil[2] + Math.sin(q) * 0.32]; drawN(GB.float, chain(BMrel, limbM(c(a), c(a + 1.05), 0.012))); }
      // on a live trip the tub the sorted males go into, forward of the table, for the tanks (snok.rsw)
      const live = typeof snoLive === 'function' && snoLive(), KL = live ? kit('pall', 'kar_levende') : null, TUB = KL ? [TB[0] - TW - 0.35, d.y, TB[2] - TL - 0.9] : null;
      if (TUB){ drawLiveTub(KL, chain(BMrel, M4.T(TUB[0], TUB[1], TUB[2]), M4.RY(Math.PI / 2)), kitX('pall').kar || {}, g.done); TUB[1] += (kitX('pall').kar || {}).water || 0.62; }
      // the hook on its whip from the portal's beam: out at the block for the pot, in over the table with it, back up
      const whip = [HK[0], blk[1] + 0.25, HK[2]];
      if (g.done < g.n){
        const sway = Math.sin(t * 1.3) * 0.08, Pup = [blk[0], blk[1] - 0.35 - ph - RG, blk[2]], Phk = [HK[0], HK[1] - 0.1 - ph - RG, HK[2]];
        let p, rx = 0, hook = HK;
        if (u < 0.3){ ST.phase = 'opp'; const k = k01(0, 0.3, u), D0 = [blk[0] + 4.4, -9, blk[2] - 5.6]; p = lerp(D0, Pup, k); p[0] += sway * (1 - k); p[2] += sway * 0.5 * (1 - k);
          const R0 = ring(p); Lr(R0, blk, 0); Lr([R0[0] + 1.6, R0[1] - 3.2, R0[2] - 2.0], R0, 0.2); }
        else { Lr(Wsea, blk, 0.3);
          if (u < 0.4){ ST.phase = 'krok'; const k = k01(0.3, 0.4, u); p = arc(Pup, Phk, k, 0.15); hook = ring(p); if (k < 0.3) Lr(ring(p), blk, 0); }
          else if (u < 0.5){ ST.phase = 'ned'; p = arc(Phk, TS, k01(0.4, 0.5, u), 0.2); hook = ring(p); }
          else if (u < 0.88){ ST.phase = u < 0.56 ? 'tom' : u < 0.8 ? 'sort' : 'agn'; const k = Math.sin(Math.PI * k01(0.5, 0.56, u)); p = TS.slice(); p[1] += 0.25 * k; rx = -0.5 * k;
            hook = u < 0.53 ? ring(p) : [HK[0], HK[1] + 0.3 * k01(0.53, 0.6, u), HK[2]]; }
          else { ST.phase = 'band'; p = null; hook = [HK[0], HK[1] + 0.3, HK[2]]; } }
        if (u >= 0.3) Lr(whip, hook, 0);
        if (p){ draw1(p, rx); if (u < 0.5) snoCrabs(BMrel, p, Math.min(8, snoCrabN(s, g)), pr); }
        // the crabs out on the table and away to where they go; the bait box filled before the pot goes aft
        if (u >= 0.5 && u < 0.88) snoSort(BMrel, u, s, g, TS, TB, TW, TL, hole, dch, dOut, TUB, ST, k01);
        if (u > 0.8 && u < 0.86 && GB.bait){ const f = (u - 0.8) / 0.06; drawN(GB.bait, chain(BMrel, M4.T(TS[0] - 0.4 * (1 - f), TS[1] + ph + 0.4 * (1 - f), TS[2]), M4.S(3))); }
      }
      // the pots of this cycle and the two before on their way aft from the table: to the stacks, or out again down the chute (reset)
      for (let j = 0; j <= 2; j++){ const q = (j + u - 0.88) / SNOB, n = g.done - j; if (q < 0 || q > 1 || n < 0 || n >= g.n) continue;
        const [p, rx, w] = ride(q, TS, stackTop(KP, base + n, d, PS), R); draw1(p, rx); count(w);
        if (R && w !== 'lift'){ Lr(w === 'belt' ? onBelt(p) : ring(p), p[2] + 4 > seaEnd[2] ? [seaEnd[0], -2.5, p[2] + 4] : seaEnd, w === 'sea' ? 0.6 : 0.2); ST.line = true; } }
    } else {
      // the stacks: the pots not yet lifted onto the conveyor (the next three are on it, in the chute or going over)
      const left = g.n - g.done, pts = []; drawPotStacks(BMrel, KP, base + Math.max(0, left - SNOS), PS);
      for (let j = SNOS - 1; j >= 0; j--){ const q = (u + SNOS - 1 - j) / SNOS, n = g.done + j; if (n > g.n) continue;
        if (n === g.n){   // the string's last end after the last pot: the marker buoy and the dregg, lifted on at the conveyor's head, aft and over
          const [p, rx, w] = ride(q, [C0[0] - 1.2, d.y, (C0[2] + C1[2]) / 2], null, true); ST.buoyB = true;
          const B = GB.boye || GB.blase; if (B && p[1] > -1.5) drawN(B, potM(w === 'sea' ? [p[0], Math.max(p[1], -0.4), p[2]] : p, w === 'sea' ? 0 : Math.PI / 2 - 0.2, 0));
          if (GB.dregg && p[1] > -6.5) drawN(GB.dregg, potM([p[0] + 0.35, p[1] + 0.1, p[2] - 0.6], rx, 0));
          pts.push(w === 'belt' || w === 'lift' ? onBelt(p) : p); continue; }
        const [p, rx, w] = ride(q, stackTop(KP, base + Math.max(0, left - 1 - j), d, PS), null, true); draw1(p, rx, (n % 5) * 0.4); count(w);
        pts.push(w === 'belt' || w === 'lift' ? onBelt(p) : ring(p)); }
      // the line between them and out astern to the pots already set
      const zl = pts.length ? pts[pts.length - 1][2] : 0; pts.push(zl + 4 > seaEnd[2] ? [seaEnd[0], -2.5, zl + 4] : seaEnd); for (let i = 1; i < pts.length; i++) Lr(pts[i - 1], pts[i], i === pts.length - 1 ? 0.5 : 0.08); ST.line = pts.length > 1;
      // the string's first end: the buoy (with the registration mark, § 66) in the sea astern while the first pots go, its line down
      // (drawn until it is far astern, some 30 m and more)
      if (g.done < 8 && GB.blase){ const w = (g.done + u) * POTA.dur, B = [CH1[0] + 0.8, -0.35, CH1[2] + 6 + vAft * w]; ST.buoyA = true;
        drawN(GB.blase, potM(B, Math.sin(t * 1.1) * 0.08, 0)); Lr([B[0], B[1] + 0.1, B[2]], [B[0], -6, B[2] + 2], 0.3); }
      ST.phase = 'set'; }
  }
  // the crabs tipped out on the sorting table (u 0.5-0.56) and sorted away one by one (0.58-0.83): the small ones and the females (the
  // string's own share, g.snoS, 10d-snokrabbe.js landSno) across the table to the discards' chute, down it and over the side; the kept
  // males down the hole to the factory, or on a live trip (the share that went to the tanks) into the tub forward of the table
  function snoSort(BMrel, u, s, g, TS, TB, TW, TL, hole, dch, dOut, TUB, ST, k01){
    const so = g.snoS || {}, rf = so.n ? so.rel / so.n : 0.45, lf = TUB ? (so.kept ? (so.live || 0) / so.kept : 1) : 0, n = Math.min(8, snoCrabN(s, g)), o = g.done * 7;
    const lerp = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
    for (let k = 0; k < n; k++){
      const rel = hash(k * 13 + o + 3) < rf, hen = rel && hash(k * 5 + o + 1) < 0.5, lv = !rel && hash(k * 17 + o) < lf, sc = rel ? 0.36 : 0.48, yaw = hash(k * 3 + o) * 6.3;
      const a = hash(k * 7 + o) * 6.28, r = 0.25 + 0.45 * hash(k * 3 + o * 5);
      const L = [clamp(TS[0] + Math.cos(a) * r, TB[0] - TW + 0.15, TB[0] + TW - 0.15), TB[1] + 0.03, clamp(TS[2] + Math.sin(a) * r, TB[2] - TL + 0.15, TB[2] + TL - 0.15)];
      const a0 = 0.58 + 0.2 * k / n, f = clamp((u - a0) / 0.05, 0, 1); if (f >= 1) continue;
      let p;
      if (f <= 0){ const fl = k01(0.5, 0.56, u); p = lerp([TS[0], TS[1] + 0.35, TS[2]], L, fl); p[1] += Math.sin(Math.PI * fl) * 0.15; }
      else if (rel){ p = f < 0.4 ? lerp(L, dch, f / 0.4) : f < 0.7 ? lerp(dch, dOut, (f - 0.4) / 0.3) : lerp(dOut, [dOut[0] + 0.9, -0.3, dOut[2]], ((f - 0.7) / 0.3) ** 2); }
      else if (lv){ p = lerp(L, TUB, f); p[1] += Math.sin(Math.PI * f) * 0.6; }
      else p = f < 0.7 ? lerp(L, hole, f / 0.7) : [hole[0], hole[1] - 0.6 * (f - 0.7) / 0.3, hole[2]];
      if (rel) ST.rel++; else if (lv) ST.live++; else ST.keep++;
      drawN(fishOf(hen ? 'snokrabbe_h' : 'snokrabbe'), chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RY(yaw + f * 2), M4.S(sc))); }
  }
  function drawGearOp(BMrel, eye, VP, t){
    autoMarks(BMrel, eye, t); ASLIDE.VP = VP; drawAutoSlides(BMrel);   // (the autoline's marks over the stern, and its gaffed fish down the chute, H2d2)
    const b = S.boat, g = b.gop; KST.sno = null; KST.setting = null; if (!g || b.status !== 'fishing') return; if (!GB) buildGear();
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, d = G.deck || {y:gw, z:1}, skiff = !!G.hand;
    // the hauler on the starboard rail just forward of the working deck; gear stacks on the deck aft of it
    // (a boat worked by hand draws her nets over the rail by hand, OB1, valg 21 B: a line hauler she has stands still meanwhile)
    const HP = skiff ? SKA.haul : G.hauler, turning = g.op === 'haul' && !(b.deckStop), DZ = skiff ? 0 : d.z - 0.6, still = skiff && g.kind === 'garn' && !hasHauler('garn');
    nSetup(VP);
    // (the autoline: its own hauler in the hauling port, anchors.aline; no tubs, the line lies on the magazines below deck, H2d)
    const auto = !skiff && !!g.auto && !!G.aline;
    const postH = skiff && !!SKA.haulFoot && g.kind === 'line';   // (OB1, U4: the line hauler on its post on a boat worked by hand)
    const HM = (!skiff || postH) && (g.kind === 'garn' || g.kind === 'line') ? haulModel(auto ? 'auto' : g.kind) : null, setting = g.op === 'set' && (g.kind === 'garn' || g.kind === 'line');
    if (!HM && !(g.kind === 'teine' && (potDavit(skiff) || (!skiff && G.snok && GB.snoHaul && G.kit && G.kit.pots && GB.kon && GB.konlag))) && (!skiff || S.equip.linehaler || S.equip.teinehaler)){
      // (OB1: the line hauler on its post stands still while the nets go by hand, where the boat has it on a post, SKA.haulFoot)
      const HP2 = skiff && !postH && SKA.haulFoot && S.equip.linehaler ? haulModel('line') : null;
      if (HP2){ const F = SKA.haulFoot, at = q => chain(BMrel, M4.T(F[0] + q[0], F[1] + q[1], F[2] + q[2])); litSetup(VP); drawLit(HP2.frame, at([0, 0, 0])); drawLit(HP2.sheave, at(HP2.ax)); drawLit(HP2.stripper, at(HP2.st)); nSetup(VP); }
      else drawN(GB.haul, chain(BMrel, M4.T(HP[0], HP[1], HP[2]), M4.RX(turning && !still ? -t * 3 : 0))); }
    // from the hauler down into the sea, outboard and a little ahead
    const W0 = [sx + (skiff ? 1.6 : 2.6), -0.35, HP[2] - (skiff ? 1.2 : 2.2)], seg = (A, Bp, r, m, sag) => { let prev = A; for (let i = 1; i <= 8; i++){ const u = i / 8, P = [A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u - sag * 4 * u * (1 - u), A[2] + (Bp[2] - A[2]) * u]; drawN(m, chain(BMrel, limbM(prev, P, r))); prev = P; } };
    if (HM){
      // the hauler on its post inside the rail (its foot on deck), the gear from the water up its path, over the sheave and down the
      // tray; the sheave turns with the gear (0.6 m/s while hauling), the stripper the other way; floats on the net, snoods on the line
      // (the autoline's sheave turns at the line's speed, about 2 500 hooks an hour at 1.3 m: 0.9 m/s, on the groove's radius)
      const P0 = auto ? G.aline.foot : postH ? SKA.haulFoot : [sx - 0.2, d.y, HP[2]], v = turning ? (auto ? 0.9 : 0.6) : 0, at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
      HAULA += v * clamp(t - HAULT, 0, 0.1) / (auto ? HM.rg : HM.r); HAULT = t;
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, chain(at(HM.ax), M4.RZ(HAULA))); drawLit(HM.stripper, chain(at(HM.st), M4.RZ(-HAULA * HM.r / (g.kind === 'garn' ? 0.06 : 0.08))));
      nSetup(VP);
      if (setting){ if (auto) drawAutoSet(BMrel, t, g, G); else drawSetting(BMrel, t, g, G, g.kind === 'garn' ? netFrom(G, d, g) : rigAt(G, g.kind, d).at, 0.45, postH && SKA.set); } else {
      const path = HM.path.map(q => [P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]]); path[0] = auto ? [P0[0] + 3.4, -0.3, P0[2] - 3.0] : W0.slice();
      const garn = g.kind === 'garn', rope = garn ? GB.net : GB.float;
      for (let i = 1; i < path.length; i++) seg(path[i - 1], path[i], garn ? 0.03 : 0.006, rope, i === 1 ? 0.25 : 0);
      // along the path by length: floats (net) or snoods with a hook (line) every metre, moving in with the gear
      const L = []; let tot = 0; for (let i = 1; i < path.length; i++){ const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); L.push(l); tot += l; }
      const pos = s => { let i = 0; while (i < L.length - 1 && s > L[i]){ s -= L[i]; i++; } const u = clamp(s / L[i], 0, 1), A = path[i], B = path[i + 1]; return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]; };
      const off = (HAULA * HM.r) % 1, HF = haulFish(g), id0 = Math.floor(HAULA * HM.r);
      // on a longline each fish is taken in with the gaff as the line comes to the rail (sR along the path): an event for the hand at the
      // hauler as it gets there, and no fish drawn on the line past it (the nets' fish are picked out at the tray, as before)
      // With the people walking the deck (deckcrew.js) the fish gaffed and picked are the real catch as the haul brings it aboard (CATCHQ): one
      // at a time, shaken off the hook or let fall from the net on the deck at the drop, where the bleeder takes it up (dkTick)
      const agentsOn = !skiff && typeof CREW3D !== 'undefined' && CREW3D.on(), PLc = agentsOn ? CREW3D.places() : null, nowE = performance.now() / 1000;
      // (the autoliner, H2d2: the gaffer at the port takes each fish in as it comes up to the sill roller, swings it in and lets it fall at
      // the chute, where it slides on into the chute's mouth in the back wall to the bleeding tanks: no bleeder in the station, deckcrew.js)
      const AP = auto ? (PLc && PLc.port) || autoPort(G) : null, dropAt = AP ? AP.drop : PLc ? [PLc.drop[0], d.y, PLc.drop[1]] : null;
      let sR = tot * 0.7; if (auto) sR = Math.max(0.5, L[0] - 0.22); else if (!garn){ for (let s2 = 0; s2 < tot; s2 += 0.1) if (pos(s2)[1] > (G.gw || d.y + 0.9) - 0.45){ sR = s2; break; } }
      if (!garn && !skiff){ const Hn = HAULA * HM.r, gx = AP ? {D:dropAt, wait:12, chute:AP.chute, Wat:pos(Math.max(0, sR - 0.95))} : {D:dropAt, wait:12};
        // (the next one comes in when the last is off the deck: the hauler waits for the bleeder, as the line can be stopped)
        if (agentsOn){ const Q = catchQ(); if (turning && Q.length && nowE - DKF.t > DKDUR.gaff + 0.3 && !dkWaits()){ const f = Q.shift(); dkEvent('gaff', pos(sR), f.sp, f.kg, gx); DKF.t = nowE; } }
        else if (turning && HF && GAFFH != null && Hn > GAFFH && Hn - GAFFH < 2) for (let j = Math.ceil(sR - Hn); j <= Math.ceil(sR - GAFFH) - 1; j++) if (hash(j * 7 + 13) < HF.p) dkEvent('gaff', pos(sR), HF.sp(hash(j * 3 + 1)), 2 + hash(j * 5) * 4, AP ? gx : null);
        GAFFH = Hn; }
      else if (agentsOn && PLc){ const Q = catchQ(), pk = PLc.pick; if (turning && Q.length && nowE - DKF.t > DKDUR.pick + 0.3 && !dkWaits()){ const f = Q.shift();
        dkEvent('pick', [pk[0] + Math.sin(pk[2]) * 0.48, d.y + 1.0, pk[1] - Math.cos(pk[2]) * 0.48], f.sp, f.kg, {D:dropAt, wait:12}); DKF.t = nowE; } }
      // the autoline's snoods every 1.3 m with their hooks (tools/gear/autoline.py), coming in with the line; the ones past the sheave
      // stripped and cleaned, on to the magazine
      // (H2d2: up to the hook cleaner some hooks still carry what is left of the bait; the cleaner's brush takes it off, and the line goes on
      // clean to the magazine, the crumbs falling from the cleaner's box)
      if (auto && GB.aTom){ const sp = 1.3, o2 = (HAULA * HM.rg) % sp, id2 = Math.floor(HAULA * HM.rg / sp), sCl = aCleanS(HM, L), old = GB.aEgB || GB.aTom;
        for (let s = o2, k = 0; s < tot; s += sp, k++){ const p = pos(s), j = k - id2; if (HF && s < sR && hash(j * 7 + 13) < HF.p * 1.3) drawN(fishOf(HF.sp(hash(j * 3 + 1))), chain(BMrel, M4.T(p[0], p[1] - 0.55, p[2]), M4.RX(Math.PI / 2), M4.RZ(hash(j) - 0.5), M4.S(0.5)));
          drawN(s < sCl && hash(j * 11 + 5) < 0.3 ? old : GB.aTom, chain(BMrel, M4.T(p[0], p[1], p[2]))); }
        if (turning && GB.bait){ const c = [P0[0] + HM.st[0], P0[1] + HM.st[1] - 0.12, P0[2] + HM.st[2]];
          for (let i = 0; i < 4; i++){ const q = (t * 1.3 + i / 4) % 1; drawN(GB.bait, chain(BMrel, M4.T(c[0] + (hash(i * 3 + Math.floor(t * 1.3)) - 0.5) * 0.3, c[1] - q * q * 1.1, c[2] + (hash(i * 5 + 1) - 0.5) * 0.25), M4.S(0.6))); } } }
      else for (let s = off, k = 0; s < tot; s += 1, k++){ const p = pos(s), q = pos(Math.min(tot, s + (garn ? 0.12 : 0.05)));
        if (HF && s < sR && hash((k - id0) * 7 + 13) < HF.p) drawN(fishOf(HF.sp(hash((k - id0) * 3 + 1))), chain(BMrel, M4.T(p[0], p[1] - (garn ? 0.3 : 0.4), p[2]), M4.RX(Math.PI / 2), M4.RZ(hash(k - id0) - 0.5), M4.S(garn ? 0.5 : 0.45)));
        if (garn){ drawN(GB.float, chain(BMrel, limbM([p[0], p[1] + 0.05, p[2]], [q[0], q[1] + 0.05, q[2]], 0.035))); if (s < L[0] && Math.floor(s + HAULA * HM.r) % 3 === 0) drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.45, p[2]], 0.01))); }
        else drawN(GB.float, chain(BMrel, limbM(p, [p[0], p[1] - 0.25, p[2] + 0.02], 0.004))); }
      }
      if (g.kind === 'garn') drawNetsOp(BMrel, G, d, g); else if (!auto) drawLineOp(BMrel, G, d, g);
    } else if (g.kind === 'garn'){
      // float line on top, lead line below, and the mesh between them moving with the net
      if (setting) drawSetting(BMrel, t, g, G, netFrom(G, d, g), -0.55, skiff && SKA.set); else {
      // (by hand the net comes in over the rail itself, SKA.rail, OB1)
      const NP = still && SKA.rail ? SKA.rail : HP;
      seg([NP[0], NP[1] + 0.12, NP[2]], [W0[0], W0[1] + 0.3, W0[2]], 0.012, GB.float, 0.15); seg([NP[0], NP[1] - 0.12, NP[2]], W0, 0.01, GB.net, 0.25);
      const ph = (t * (turning ? 0.5 : 0.15)) % 0.125, HF = haulFish(g), id0 = Math.floor(t * (turning ? 0.5 : 0.15) / 0.125);
      for (let u = ph, k = 0; u < 1; u += 0.125, k++){ const A = [NP[0] + (W0[0] - NP[0]) * u, NP[1] + 0.12 + (W0[1] + 0.3 - NP[1] - 0.12) * u - 0.15 * 4 * u * (1 - u), NP[2] + (W0[2] - NP[2]) * u], B2 = [A[0], A[1] - 0.24 - 0.1 * u, A[2]]; drawN(GB.net, chain(BMrel, limbM(A, B2, 0.004)));
        if (HF && u < 0.85 && hash((k - id0) * 7 + 13) < HF.p * 3) drawN(fishOf(HF.sp(hash((k - id0) * 3 + 1))), chain(BMrel, M4.T(B2[0], B2[1] - 0.1, B2[2]), M4.RX(Math.PI / 2), M4.S(0.45))); }
      }
      drawNetsOp(BMrel, G, d, g);
    } else if (g.kind === 'line'){
      const R = rigAt(G, 'line', d); if (setting) drawSetting(BMrel, t, g, G, R.at, -0.55, skiff && SKA.set); else seg(HP, W0, 0.008, GB.float, 0.2);
      drawLineOp(BMrel, G, d, g);
    } else drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg);
    // those on «Haling» in the work chains (the skipper too when it is his job; he then leaves the wheel, gopMe): the first at the
    // hauler taking the gear in, the next clearing it at the end of the tray, a third stacking it aft (the skiff's fisher is drawn with
    // the boat)
    if (!skiff && !(typeof CREW3D !== 'undefined' && CREW3D.on())){ const AQ = g.auto && G.aline ? autoPort(G) : null, n = clamp(gopHands(), 0, AQ ? 2 : 3);
      // (the snow crab vessel, H3d2: hauling, one at the hauler and two sorting at the table's inboard side; setting, one feeding the
      // conveyor from the stacks and one at the chute)
      const SN = G.snok && G.kit && G.kit.pots ? G.snok : null, TW = SN ? (SN.tsize || [1.9])[0] / 2 : 0;
      const spots = AQ ? [[AQ.gaff[0], AQ.gaff[1], 'haul', AQ.gaff[2]], [AQ.tend[0], AQ.tend[1], 'coil', AQ.tend[2]]]
        : SN && g.op === 'haul' ? [[SN.hauler[0] - 0.75, SN.hauler[2] + 0.35, 'haul', Math.PI / 2], [SN.table[0] - TW - 0.4, SN.table[2] - 0.7, 'tend', Math.PI / 2], [SN.table[0] - TW - 0.4, SN.table[2] + 0.7, 'tend', Math.PI / 2]]
        : SN ? [[SN.conv[0][0] - 0.75, (SN.conv[0][2] + SN.conv[1][2]) / 2, 'tend', -Math.PI / 2], [SN.chute[0][0] - 0.85, SN.chute[0][2] - 1.5, 'tend', Math.PI], [SN.table[0] - TW - 0.4, SN.table[2], 'tend', Math.PI / 2]]
        : [[HP[0] - 0.55, HP[2] + 0.2, 'haul', Math.PI / 2], [HP[0] - 1.25, HP[2] + 0.75, 'tend', Math.PI * 0.6], [sx * 0.3 + 0.5, DZ + 0.2, 'tend', Math.PI]];
      for (let k = 0; k < n; k++){ const [x, z, task, a] = spots[k], wl = xf(BMrel, [x, d.y, z]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0, kit:k === 0 && gopMe() ? 'skipper' : null, look:seaLook(k === 0 && gopMe() ? lookMe() : lookCrew(k - (gopMe() ? 1 : 0)))};
        const ev = dkFor('h' + k, [x, d.y, z], task);
        drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + a, task:ev ? ev.kind : task, ev:ev ? dkEv(ev, BMrel, G) : null, walk:false, s:0}, eye, t, 9 + k); }
      dkBloodDraw(VP); }
  }
