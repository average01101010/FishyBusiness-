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
    if (typeof glbHas === 'function' && glbHas('gear-marks')){ const up = nm => { const o = glbPart('gear-marks', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
      GB.buoy = up('blaase') || GB.buoy; GB.dregg = up('dregg');
      // the ocean marker poles of § 68 at the ends of an autoline set (H2d, 05.11.2026): two flags and two yellow lamps at the west end,
      // one of each at the east end; the lamps' places from the extras (havlys), flashing at night
      GB.havV = up('havstang_v'); GB.havO = up('havstang_o'); const X = (glbLoad('gear-marks') || {}).ex || {}; GB.havL = X.havlys || null; GB.blink = X.blink || 22; }
    // the autoline's snood with its hook, empty and baited (tools/gear/autoline.py), drawn along the line as it comes in
    if (typeof glbHas === 'function' && glbHas('gear-autoline')){ const up = nm => { const o = glbPart('gear-autoline', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
      GB.aTom = up('tom'); GB.aEgB = up('egnet_b'); GB.aEgS = up('egnet_s'); }
    // the king crab pot, its hatch, the pot hauler on its davit and the live crab tank from tools/gear/teine.py, in place of the drawn pot
    if (typeof glbHas === 'function' && glbHas('gear-pot')){ const up = nm => { const o = glbPart('gear-pot', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; }, pg = glbLoad('gear-pot');
      const pt = up('teine'); if (pt){ GB.pot = pt; GB.potB = true; GB.door = up('teinedor'); GB.davit = up('davit'); GB.davitSh = up('davitskive'); GB.tank = up('krabbekar'); GB.px = (pg && pg.ex) || {};
        GB.kon = up('kon'); GB.kontopp = up('kontopp'); GB.konlag = up('konlag'); GB.konlag11 = up('konlag11'); } }
    // the snow crab's gear from tools/gear/snoteine.py (H3d1, 07.11.2026): the conical pot with its escape opening, bait box and mark in
    // place of gear-pot's, the pot hauler and its sheave under the portal, the buoy and the marker buoy at a string's ends
    if (typeof glbHas === 'function' && glbHas('gear-snoteine')){ const up = nm => { const o = glbPart('gear-snoteine', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; }, sg = glbLoad('gear-snoteine');
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
  function drawSetting(BMrel, t, g, G, stack, x0){
    const garn = g.kind === 'garn', gw = G.gw || 1, st = G.stern, v = clamp(2.5 * KNV(), 0.6, 4);
    SETA += v * clamp(t - SETT, 0, 0.1); SETT = t; if (SETG !== g){ SETG = g; SETT0 = t; }
    const path = [[stack[0], stack[1] + 0.35, stack[2]], [x0, gw + 0.1, st - 0.15], [x0 + 0.1, gw - 0.05, st + 0.15], [x0 + 0.3, -0.12, st + 2.4], [x0 + 0.6, -1.0, st + 9], [x0 + 0.9, -2.6, st + 16]];
    const L = []; let tot = 0; for (let i = 1; i < path.length; i++){ const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); L.push(l); tot += l; }
    const pos = s => { let i = 0; while (i < L.length - 1 && s > L[i]){ s -= L[i]; i++; } const u = clamp(s / L[i], 0, 1), A = path[i], B = path[i + 1]; return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]; };
    for (let i = 1; i < path.length; i++){ drawN(garn ? GB.float : GB.net, chain(BMrel, limbM(path[i - 1], path[i], garn ? 0.012 : 0.006)));
      if (garn) drawN(GB.net, chain(BMrel, limbM([path[i - 1][0], path[i - 1][1] - 0.3, path[i - 1][2]], [path[i][0], path[i][1] - 0.3, path[i][2]], 0.008))); }
    const sp = garn ? 1.0 : 1.4;
    for (let s = SETA % sp; s < tot; s += sp){ const p = pos(s), q = pos(Math.min(tot, s + (garn ? 0.12 : 0.05)));
      if (garn){ drawN(GB.float, chain(BMrel, limbM([p[0], p[1] + 0.04, p[2]], [q[0], q[1] + 0.04, q[2]], 0.035))); drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.3, p[2]], 0.005))); }
      else { drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.22, p[2] + 0.02], 0.004))); drawN(GB.bait, chain(BMrel, M4.T(p[0], p[1] - 0.24, p[2] + 0.02))); } }
    const ta = t - SETT0;
    if (GB.dregg && g.done === 0 && ta < 4){ const u = clamp(ta / 1.4, 0, 1), A = path[1], B = [x0 + 0.4, -0.2, st + 2.6], dn = Math.max(0, ta - 1.4);
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
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) c[i * 3 + k] = o.c[i * 4 + k]; return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
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
    const KS = G.kit && G.kit.pots && G.kit.pots.spot, spot = KS ? KS.slice() : [sx - 0.25 - pw, d.y, HP[2] + pw - 0.1], cols = Math.max(1, Math.floor((2 * sx - 0.3) / (2 * pw + 0.08)));
    const h = ph || pw * 0.93, layers = ((VESSELS[vt || vtype()] || {}).len || 10) < 12 ? 2 : 3;
    return {spot, cols, max:cols * layers, tank:tankAt(-(sx - 0.5), spot[2], d, vt || vtype()), slot:i => { const L = Math.floor(i / cols), c = i % cols; return [spot[0] - c * (2 * pw + 0.08), d.y + L * (h + 0.01), spot[2] + 2 * pw + 0.3]; }};
  }
  // the snow crab vessel's conical pots nested in stacks on the model's places (kit.pots.at, tools/boats/krabbe50.py), as many as are
  // aboard; a full stack is two meshes (the eleven nested under the top one, and the top one). Returns how many were drawn
  function drawPotStacks(BMrel, K, n){
    const X = (GB.px || {}).kon || {}, h = X.stack || 12, P = X.pitch || 0.16; let left = Math.max(0, Math.round(n)), drawn = 0;
    for (const a of K.at || []){ if (left <= 0) break; const k = Math.min(h, left), M = chain(BMrel, M4.T(a[0], a[1], a[2]), M4.RY(a[3] || 0)); left -= k; drawn += k;
      if (k === h && GB.konlag11) drawN(GB.konlag11, M); else for (let i = 0; i < k - 1; i++) drawN(GB.konlag, chain(M, M4.T(0, i * P, 0)));
      drawN(GB.kontopp || GB.kon, chain(M, M4.T(0, (k - 1) * P, 0))); }
    return drawn;
  }
  // where the pot numbered i (from 0) stands in the stacks: on its stack's place, as high as those under it
  function stackTop(K, i, d){ const X = (GB.px || {}).kon || {}, h = X.stack || 12, P = X.pitch || 0.16, at = K.at || []; if (!at.length) return [0, d.y, 0];
    const full = i >= at.length * h, a = at[full ? at.length - 1 : Math.floor(i / h)]; return [a[0], a[1] + (full ? h - 1 : i % h) * P, a[2]]; }
  // the pots aboard while she is rigged for them and not working them (Jonas' survey 30.10.2026, D5: they showed only while setting and
  // hauling): the conical ones in their stacks on the model's places, else the square ones stacked by the hauler as they are when hauled
  // the pots of the boat's own kind aboard (the snow crab vessel's conical pots are S.pgear.pots.sno, VESSELS.snokrabbe.pot; H3d1: the
  // stacks on her deck showed none, as only the big square pots were counted)
  function potsAboard(){ const P = (S.pgear || {}).pots || {}, V = VESSELS[vtype()] || {}; return (V.pot ? P[V.pot] : P.big) || 0; }
  function drawPotsAboard(BMrel, G, d, n){
    if (!GB) buildGear(); const K = G.kit && G.kit.pots; if (n <= 0) return 0;
    if (K && GB.kon && GB.konlag) return drawPotStacks(BMrel, K, n);
    if (G.hand || !G.hauler) return 0;
    const XP = (GB.px || {}).pot || {}, pw = GB.potB ? XP.half || 0.7 : 0.4, ph = GB.potB ? XP.h || 0.65 : 0.4, D = potDeck(G, G.hauler, G.beam / 2, d, pw, null, ph), m = Math.min(D.max, n);
    for (let i = 0; i < m; i++){ const q = D.slot(i); drawN(GB.pot, chain(BMrel, M4.T(q[0], q[1], q[2]))); }
    return m;
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
    const s = g.op === 'haul' ? (S.sets || []).find(x => x.id === g.sid) : g.s, ps = 1, X = GB.px || {}, KP = !skiff && G.kit && G.kit.pots && GB.kon && GB.konlag ? G.kit.pots : null, XP = (KP ? X.kon : X.pot) || {};
    // (the snow crab vessel works the conical pot, kit.pots: no hatch, no davit, the line over the hauler at her side)
    const ph = (GB.potB ? XP.h || 0.65 : 0.4) * ps, pw = (GB.potB ? (KP ? XP.r : XP.half) || 0.7 : 0.4) * ps, gw = G.gw || d.y + 0.9, D = potDeck(G, HP, sx, d, pw, null, ph), PM = KP ? GB.kon : GB.pot;
    const base = potsAboard();   // the pots aboard besides those of this set
    if (POTA.g !== g || g.done !== POTA.done){
      if (POTA.g === g && g.done === POTA.done + 1) POTA.dur = clamp(t - POTA.t0, 2, 40);
      else { let m = 1.2; try { m = gopUnitMin(g, S.t / 60, hsAt(S.boat.pos, S.t / 60)); } catch (e){} POTA.dur = clamp(m * 60 / simRate(), 2, 40); }
      POTA.g = g; POTA.done = g.done; POTA.t0 = t; }
    const u = POTA.fix != null ? POTA.fix : clamp((t - POTA.t0) / POTA.dur, 0, 1), sm = v => v * v * (3 - 2 * v), ph01 = (a, b) => sm(clamp((u - a) / (b - a), 0, 1)), lerp = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
    if (KP && G.snok && GB.snoHaul){ snoHauler(BMrel, G, null, POTA.sh); KST.haul = 'snokrabbe'; }
    const DV = potDavit(skiff) && !KP, P0 = [sx - 0.2, d.y, HP[2]], blk = DV && X.davit ? [P0[0] + X.davit.block[0], P0[1] + X.davit.block[1], P0[2] + X.davit.block[2]] : [sx + 0.05, gw + 0.05, HP[2]];
    const potM = (p, rz, rx) => chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RZ(rz || 0), M4.RX(rx || 0), M4.S(ps));
    const RG = XP.ring != null ? XP.ring : 0.45, ring = (p, rz) => [p[0] - Math.sin(rz || 0) * (ph + RG), p[1] + Math.cos(rz || 0) * (ph + RG), p[2]];
    const bridle = p => { const R = ring(p); for (const c of XP.bridle || []) drawN(GB.float, chain(BMrel, limbM([p[0] + c[0] * ps, p[1] + c[1] * ps, p[2] + c[2] * ps], R, 0.006))); };
    // the crabs in the pot now: the set's catch shared over its pots, at most five drawn
    const csp = s && s.acc && s.acc.snokrabbe ? 'snokrabbe' : 'krabbe', crabN = s && s.acc && s.acc[csp] ? Math.min(5, Math.max(csp === 'snokrabbe' ? 2 : 0, Math.round(s.acc[csp].n / Math.max(1, s.n)))) : 0;
    const crabsIn = (p, left) => { for (let k = 0; k < left; k++) drawN(fishOf(csp), chain(BMrel, M4.T(p[0] + (hash(k * 5 + 1) - 0.5) * pw, p[1] + 0.02, p[2] + (hash(k * 7 + 2) - 0.5) * pw), M4.RY(hash(k * 3) * 6.3), M4.S(0.8 * (0.85 + 0.3 * hash(k * 11))))); };
    // the hauler on its davit: the sheave turns while the rope runs
    const running = g.op === 'haul' ? u < 0.55 : u > 0.55;
    POTA.sh += (running ? 5 : 0) * clamp(t - POTA.st, 0, 0.1); POTA.st = t;
    if (DV){ drawN(GB.davit, chain(BMrel, M4.T(P0[0], P0[1], P0[2]))); if (GB.davitSh && X.davit) drawN(GB.davitSh, chain(BMrel, M4.T(P0[0] + X.davit.sheave[0], P0[1] + X.davit.sheave[1], P0[2] + X.davit.sheave[2]), M4.RZ(-POTA.sh)));
      if (X.davit) seg(blk, [P0[0] + X.davit.sheave[0] + 0.15, P0[1] + X.davit.sheave[1] + 0.12, P0[2]], 0.008, GB.float, 0); }
    // the stack: the pots aboard but the one in hand
    const nS = g.op === 'haul' ? g.done : Math.max(0, g.n - g.done - 1);
    if (KP) drawPotStacks(BMrel, KP, base + nS); else for (let i = 0, m = Math.min(D.max, base + nS); i < m; i++) drawN(GB.pot, potM(D.slot(i)));
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
      else { const k = ph01(0.9, 1), S2 = KP ? stackTop(KP, base + g.done, d) : D.slot(base + g.done); p = lerp(D.spot, S2, k); p[1] += Math.sin(Math.PI * k) * (ph + 0.15); }
      if (u < 0.62){ const R = ring(p); seg(R, blk, 0.008, GB.float, 0); bridle(p); }
      // the hatch opens, the crabs go one by one to the tank (or down the hold), the bait box is filled, the hatch shuts
      const open = ph01(0.66, 0.7) * (1 - ph01(0.85, 0.89)), tk = S.equip.krabbekar ? [D.tank[0], D.tank[1] + ((X.tank || {}).water || 0.58) * (D.tank[4] || 1) + 0.05, D.tank[2]] : [0, d.y + 0.2, d.z];
      let left = crabN; if (u > 0.7) for (let k = 0; k < crabN; k++){ const a = 0.7 + k * 0.13 / Math.max(1, crabN), f = clamp((u - a) / 0.05, 0, 1); if (f <= 0) continue; left--; if (f >= 1) continue;
        const A = [p[0], p[1] + ph * 0.5, p[2]], Q = lerp(A, [tk[0] + (hash(k) - 0.5) * 0.4, tk[1], tk[2] + (hash(k + 3) - 0.5) * 0.6], f); Q[1] += Math.sin(Math.PI * f) * 0.7;
        drawN(fishOf(csp), chain(BMrel, M4.T(Q[0], Q[1], Q[2]), M4.RY(f * 3), M4.RX(0.5), M4.S(0.8))); }
      if (u < 0.9) crabsIn(p, Math.max(0, left));
      drawN(PM, potM(p, rz));
      if (!KP && GB.door && XP.hinge) drawN(GB.door, chain(potM(p, rz), M4.T(XP.hinge[0], XP.hinge[1], XP.hinge[2]), M4.RX(-1.9 * open)));
      if (u > 0.82 && u < 0.86){ const f = (u - 0.82) / 0.04; drawN(GB.bait, chain(BMrel, M4.T(p[0] + 0.3 * (1 - f), p[1] + ph + 0.3 * (1 - f), p[2]), M4.S(3))); }
    } else {
      // from the top of the stack to the rail, over it (tipped outboard) and down to the bottom, drifting aft as the boat goes ahead
      const S0 = KP ? stackTop(KP, base + Math.max(0, g.n - g.done - 1), d) : D.slot(base + Math.max(0, g.n - g.done - 1)), rail = [sx - pw * 0.2, clear, D.spot[2]]; let p, rz = 0;
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
    const pw = ((GB.px || {}).pot || {}).half || 0.7, D = potDeck(G, HP, sx, d, pw), T = (GB.px || {}).tank || {half:[0.36, 0.56], water:0.58};
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
    if (G.hand){ if (pick === 'garnhaler' || !SKA || !SKA.haul) return; nSetup(VP); drawN(GB.haul, chain(BMrel, M4.T(SKA.haul[0], SKA.haul[1] + up, SKA.haul[2]))); KST.haul = pick; return; }
    if (!G.hauler) return; const P0 = [G.beam / 2 - 0.2, d.y + up, G.hauler[2]], X = GB.px || {};
    if (G.kit && G.kit.pots && G.snok && GB.snoHaul){ snoHauler(BMrel, G, VP, 0); KST.haul = 'snokrabbe'; return; }
    if (pick === 'teinehaler'){ if (!GB.davit || (G.kit && G.kit.pots)) return; nSetup(VP); drawN(GB.davit, chain(BMrel, M4.T(P0[0], P0[1], P0[2])));
      if (GB.davitSh && X.davit) drawN(GB.davitSh, chain(BMrel, M4.T(P0[0] + X.davit.sheave[0], P0[1] + X.davit.sheave[1], P0[2] + X.davit.sheave[2]))); KST.haul = pick; return; }
    const HM = haulModel(pick === 'garnhaler' ? 'garn' : 'line');
    if (!HM){ nSetup(VP); drawN(GB.haul, chain(BMrel, M4.T(G.hauler[0], G.hauler[1] + up, G.hauler[2]))); KST.haul = pick; return; }
    const at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
    litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, at(HM.ax)); drawLit(HM.stripper, at(HM.st)); KST.haul = pick;
  }
  // the snow crab vessel's pot hauler (tools/gear/snoteine.py haler) on its pedestal at anchors.hauler, its sheave at its axle turned a
  // the line runs (a: the sheave's angle); it is hers from the yard, so it stands whether she is rigged or not (H3d1)
  function snoHauler(BMrel, G, VP, a){ const H = G.hauler, X = (GB.snx || {}).haler || {}, ax = X.axle || [0.1, 0.95, 0];
    if (VP) nSetup(VP); drawN(GB.snoHaul, chain(BMrel, M4.T(H[0], H[1], H[2]))); if (GB.snoSheave) drawN(GB.snoSheave, chain(BMrel, M4.T(H[0] + ax[0], H[1] + ax[1], H[2] + ax[2]), M4.RZ(-a))); }
  function drawGearOp(BMrel, eye, VP, t){
    autoMarks(BMrel, eye, t); ASLIDE.VP = VP; drawAutoSlides(BMrel);   // (the autoline's marks over the stern, and its gaffed fish down the chute, H2d2)
    const b = S.boat, g = b.gop; if (!g || b.status !== 'fishing') return; if (!GB) buildGear();
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, d = G.deck || {y:gw, z:1}, skiff = !!G.hand;
    // the hauler on the starboard rail just forward of the working deck; gear stacks on the deck aft of it
    const HP = skiff ? SKA.haul : G.hauler, turning = g.op === 'haul' && !(b.deckStop), DZ = skiff ? 0 : d.z - 0.6;
    nSetup(VP);
    // (the autoline: its own hauler in the hauling port, anchors.aline; no tubs, the line lies on the magazines below deck, H2d)
    const auto = !skiff && !!g.auto && !!G.aline;
    const HM = !skiff && (g.kind === 'garn' || g.kind === 'line') ? haulModel(auto ? 'auto' : g.kind) : null, setting = g.op === 'set' && (g.kind === 'garn' || g.kind === 'line');
    if (!HM && !(g.kind === 'teine' && potDavit(skiff)) && (!skiff || S.equip.linehaler || S.equip.teinehaler)) drawN(GB.haul, chain(BMrel, M4.T(HP[0], HP[1], HP[2]), M4.RX(turning ? -t * 3 : 0)));
    // from the hauler down into the sea, outboard and a little ahead
    const W0 = [sx + (skiff ? 1.6 : 2.6), -0.35, HP[2] - (skiff ? 1.2 : 2.2)], seg = (A, Bp, r, m, sag) => { let prev = A; for (let i = 1; i <= 8; i++){ const u = i / 8, P = [A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u - sag * 4 * u * (1 - u), A[2] + (Bp[2] - A[2]) * u]; drawN(m, chain(BMrel, limbM(prev, P, r))); prev = P; } };
    if (HM){
      // the hauler on its post inside the rail (its foot on deck), the gear from the water up its path, over the sheave and down the
      // tray; the sheave turns with the gear (0.6 m/s while hauling), the stripper the other way; floats on the net, snoods on the line
      // (the autoline's sheave turns at the line's speed, about 2 500 hooks an hour at 1.3 m: 0.9 m/s, on the groove's radius)
      const P0 = auto ? G.aline.foot : [sx - 0.2, d.y, HP[2]], v = turning ? (auto ? 0.9 : 0.6) : 0, at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
      HAULA += v * clamp(t - HAULT, 0, 0.1) / (auto ? HM.rg : HM.r); HAULT = t;
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, chain(at(HM.ax), M4.RZ(HAULA))); drawLit(HM.stripper, chain(at(HM.st), M4.RZ(-HAULA * HM.r / (g.kind === 'garn' ? 0.06 : 0.08))));
      nSetup(VP);
      if (setting){ if (auto) drawAutoSet(BMrel, t, g, G); else drawSetting(BMrel, t, g, G, rigAt(G, g.kind, d).at, 0.45); } else {
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
      if (!garn){ const Hn = HAULA * HM.r, gx = AP ? {D:dropAt, wait:12, chute:AP.chute, Wat:pos(Math.max(0, sR - 0.95))} : {D:dropAt, wait:12};
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
      const R = rigAt(G, g.kind, d), n = g.op === 'haul' ? g.done : g.n - g.done;
      if (g.kind === 'garn') drawNetTub(BMrel, R.at, clamp(n / Math.max(1, g.n), 0, 1), R.ry); else if (!auto) drawLineTubs(BMrel, R.at, n, g.op === 'set' ? n : 0, false, R.ry);
    } else if (g.kind === 'garn'){
      // float line on top, lead line below, and the mesh between them moving with the net
      if (setting) drawSetting(BMrel, t, g, G, rigAt(G, 'garn', d).at, -0.55); else {
      seg([HP[0], HP[1] + 0.12, HP[2]], [W0[0], W0[1] + 0.3, W0[2]], 0.012, GB.float, 0.15); seg([HP[0], HP[1] - 0.12, HP[2]], W0, 0.01, GB.net, 0.25);
      const ph = (t * (turning ? 0.5 : 0.15)) % 0.125, HF = haulFish(g), id0 = Math.floor(t * (turning ? 0.5 : 0.15) / 0.125);
      for (let u = ph, k = 0; u < 1; u += 0.125, k++){ const A = [HP[0] + (W0[0] - HP[0]) * u, HP[1] + 0.12 + (W0[1] + 0.3 - HP[1] - 0.12) * u - 0.15 * 4 * u * (1 - u), HP[2] + (W0[2] - HP[2]) * u], B2 = [A[0], A[1] - 0.24 - 0.1 * u, A[2]]; drawN(GB.net, chain(BMrel, limbM(A, B2, 0.004)));
        if (HF && u < 0.85 && hash((k - id0) * 7 + 13) < HF.p * 3) drawN(fishOf(HF.sp(hash((k - id0) * 3 + 1))), chain(BMrel, M4.T(B2[0], B2[1] - 0.1, B2[2]), M4.RX(Math.PI / 2), M4.S(0.45))); }
      }
      const n = g.op === 'haul' ? g.done : g.n - g.done, fill = clamp(n / Math.max(1, g.n), 0, 1);
      const R = rigAt(G, 'garn', d); drawNetTub(BMrel, R.at, fill, R.ry);
    } else if (g.kind === 'line'){
      const R = rigAt(G, 'line', d); if (setting) drawSetting(BMrel, t, g, G, R.at, -0.55); else seg(HP, W0, 0.008, GB.float, 0.2);
      const n = g.op === 'haul' ? g.done : g.n - g.done;
      drawLineTubs(BMrel, R.at, n, g.op === 'set' ? n : 0, false, R.ry);
    } else drawPots(BMrel, t, g, G, HP, sx, d, skiff, seg);
    // those on «Haling» in the work chains (the skipper too when it is his job; he then leaves the wheel, gopMe): the first at the
    // hauler taking the gear in, the next clearing it at the end of the tray, a third stacking it aft (the skiff's fisher is drawn with
    // the boat)
    if (!skiff && !(typeof CREW3D !== 'undefined' && CREW3D.on())){ const AQ = g.auto && G.aline ? autoPort(G) : null, n = clamp(gopHands(), 0, AQ ? 2 : 3);
      const spots = AQ ? [[AQ.gaff[0], AQ.gaff[1], 'haul', AQ.gaff[2]], [AQ.tend[0], AQ.tend[1], 'coil', AQ.tend[2]]] : [[HP[0] - 0.55, HP[2] + 0.2, 'haul', Math.PI / 2], [HP[0] - 1.25, HP[2] + 0.75, 'tend', Math.PI * 0.6], [sx * 0.3 + 0.5, DZ + 0.2, 'tend', Math.PI]];
      for (let k = 0; k < n; k++){ const [x, z, task, a] = spots[k], wl = xf(BMrel, [x, d.y, z]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0, kit:k === 0 && gopMe() ? 'skipper' : null, look:seaLook(k === 0 && gopMe() ? lookMe() : lookCrew(k - (gopMe() ? 1 : 0)))};
        const ev = dkFor('h' + k, [x, d.y, z], task);
        drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + a, task:ev ? ev.kind : task, ev:ev ? dkEv(ev, BMrel, G) : null, walk:false, s:0}, eye, t, 9 + k); }
      dkBloodDraw(VP); }
  }
