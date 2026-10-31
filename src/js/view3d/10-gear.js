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
      GB.buoy = up('blaase') || GB.buoy; GB.dregg = up('dregg'); }
    // the king crab pot, its hatch, the pot hauler on its davit and the live crab tank from tools/gear/teine.py, in place of the drawn pot
    if (typeof glbHas === 'function' && glbHas('gear-pot')){ const up = nm => { const o = glbPart('gear-pot', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; }, pg = glbLoad('gear-pot');
      const pt = up('teine'); if (pt){ GB.pot = pt; GB.potB = true; GB.door = up('teinedor'); GB.davit = up('davit'); GB.davitSh = up('davitskive'); GB.tank = up('krabbekar'); GB.px = (pg && pg.ex) || {};
        GB.kon = up('kon'); GB.kontopp = up('kontopp'); GB.konlag = up('konlag'); GB.konlag11 = up('konlag11'); } }
  }
  // the buoys of every set within sight, bobbing on the waves, flags blowing downwind
  function drawGearSea(eye, t, VP, H){
    const L = []; for (const s of S.sets || []) if (!s.lost){ L.push(s.a); L.push(s.b); }
    for (const s of PEERGEAR){ L.push(s.a); L.push(s.b); }   // the other players' buoys (tilbakemelding #35)
    // setting, the first buoy goes over the stern and lies astern of her until she has run clear of it (tilbakemelding #25: «bøya skal
    // ligge på siden eller bak båten når settingen starter»)
    const g = S.boat.gop; if (g && g.op === 'set' && g.done >= 0){ const back = ((GEO(vtype()).stern || 3) + 5) / 1000, d = Math.hypot(bv.x / 1000 - g.a.x, bv.z / 1000 - g.a.y);
      L.push(bv.init && d < back ? {x:(bv.x - Math.sin(bv.head) * back * 1000 + Math.cos(bv.head) * 1.5) / 1000, y:(bv.z + Math.cos(bv.head) * back * 1000 + Math.sin(bv.head) * 1.5) / 1000} : g.a); }
    if (!L.length) return; if (!GB) buildGear();
    nSetup(VP); const wd = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG;
    for (const e of L){ const x = e.x * 1000, z = e.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) > 4000) continue;
      const y = seaH(x, z, t) - 0.1, sx = (seaH(x + 0.6, z, t) - seaH(x - 0.6, z, t)) / 1.2, sz = (seaH(x, z + 0.6, t) - seaH(x, z - 0.6, t)) / 1.2;
      drawN(GB.buoy, model(x - eye[0], y - eye[1], z - eye[2], Math.PI / 2 - wd, -sz * 0.9, sx * 0.9)); }
    gl.useProgram(PL.p);
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
  function haulModel(kind){
    if (kind in HAULM) return HAULM[kind]; HAULM[kind] = null; const type = 'haul-' + kind;
    if (typeof glbHas !== 'function' || !glbHas(type)) return null;
    const G = glbLoad(type), ex = (G && G.ex) || {}, mk = nm => { const o = glbPart(type, nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) c[i * 3 + k] = o.c[i * 4 + k]; return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
    if (ex.axle && ex.path) HAULM[kind] = {frame:mk('frame'), sheave:mk('sheave'), stripper:mk('stripper'), ax:ex.axle, st:ex.stripper, r:ex.r, path:ex.path};
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
    const base = ((S.pgear || {}).pots || {}).big || 0;   // the pots aboard besides those of this set
    if (POTA.g !== g || g.done !== POTA.done){
      if (POTA.g === g && g.done === POTA.done + 1) POTA.dur = clamp(t - POTA.t0, 2, 40);
      else { let m = 1.2; try { m = gopUnitMin(g, S.t / 60, hsAt(S.boat.pos, S.t / 60)); } catch (e){} POTA.dur = clamp(m * 60 / simRate(), 2, 40); }
      POTA.g = g; POTA.done = g.done; POTA.t0 = t; }
    const u = POTA.fix != null ? POTA.fix : clamp((t - POTA.t0) / POTA.dur, 0, 1), sm = v => v * v * (3 - 2 * v), ph01 = (a, b) => sm(clamp((u - a) / (b - a), 0, 1)), lerp = (A, B, k) => [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
    const DV = potDavit(skiff) && !KP, P0 = [sx - 0.2, d.y, HP[2]], blk = DV && X.davit ? [P0[0] + X.davit.block[0], P0[1] + X.davit.block[1], P0[2] + X.davit.block[2]] : [sx + 0.05, gw + 0.05, HP[2]];
    const potM = (p, rz, rx) => chain(BMrel, M4.T(p[0], p[1], p[2]), M4.RZ(rz || 0), M4.RX(rx || 0), M4.S(ps));
    const RG = XP.ring != null ? XP.ring : 0.45, ring = (p, rz) => [p[0] - Math.sin(rz || 0) * (ph + RG), p[1] + Math.cos(rz || 0) * (ph + RG), p[2]];
    const bridle = p => { const R = ring(p); for (const c of XP.bridle || []) drawN(GB.float, chain(BMrel, limbM([p[0] + c[0] * ps, p[1] + c[1] * ps, p[2] + c[2] * ps], R, 0.006))); };
    // the crabs in the pot now: the set's catch shared over its pots, at most five drawn
    const crabN = s && s.acc && s.acc.krabbe ? Math.min(5, Math.round(s.acc.krabbe.n / Math.max(1, s.n))) : 0;
    const crabsIn = (p, left) => { for (let k = 0; k < left; k++) drawN(fishOf('krabbe'), chain(BMrel, M4.T(p[0] + (hash(k * 5 + 1) - 0.5) * pw, p[1] + 0.02, p[2] + (hash(k * 7 + 2) - 0.5) * pw), M4.RY(hash(k * 3) * 6.3), M4.S(0.8 * (0.85 + 0.3 * hash(k * 11))))); };
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
        drawN(fishOf('krabbe'), chain(BMrel, M4.T(Q[0], Q[1], Q[2]), M4.RY(f * 3), M4.RX(0.5), M4.S(0.8))); }
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
    if (!S.equip.krabbekar || rigOf() !== 'teiner' || !GB || !GB.tank) return;
    const pw = ((GB.px || {}).pot || {}).half || 0.7, D = potDeck(G, HP, sx, d, pw), T = (GB.px || {}).tank || {half:[0.36, 0.56], water:0.58};
    const s = D.tank[4] || 1; drawN(GB.tank, chain(BMrel, M4.T(D.tank[0], D.tank[1], D.tank[2]), M4.S(s))); KST.tank = D.tank.slice();
    const kg = S.hold.reduce((a, x) => a + (x.sp === 'krabbe' ? x.kg : 0), 0), n = Math.min(Math.round(14 * s * s), Math.ceil(kg / 4));
    for (let k = 0; k < n; k++) drawN(fishOf('krabbe'), chain(BMrel, M4.T(D.tank[0] + (hash(k * 5 + 7) - 0.5) * T.half[0] * s * 1.5, D.tank[1] + (T.water - 0.04) * s + Math.floor(k / 5) * 0.03, D.tank[2] + (hash(k * 7 + 9) - 0.5) * T.half[1] * s * 1.6), M4.RY(hash(k) * 6.3), M4.S(0.75)));
  }
  function drawGearOp(BMrel, eye, VP, t){
    const b = S.boat, g = b.gop; if (!g || b.status !== 'fishing') return; if (!GB) buildGear();
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, d = G.deck || {y:gw, z:1}, skiff = !!G.hand;
    // the hauler on the starboard rail just forward of the working deck; gear stacks on the deck aft of it
    const HP = skiff ? SKA.haul : G.hauler, turning = g.op === 'haul' && !(b.deckStop), DZ = skiff ? 0 : d.z - 0.6;
    nSetup(VP);
    const HM = !skiff && (g.kind === 'garn' || g.kind === 'line') ? haulModel(g.kind) : null, setting = g.op === 'set' && (g.kind === 'garn' || g.kind === 'line');
    if (!HM && !(g.kind === 'teine' && potDavit(skiff)) && (!skiff || S.equip.linehaler || S.equip.teinehaler)) drawN(GB.haul, chain(BMrel, M4.T(HP[0], HP[1], HP[2]), M4.RX(turning ? -t * 3 : 0)));
    // from the hauler down into the sea, outboard and a little ahead
    const W0 = [sx + (skiff ? 1.6 : 2.6), -0.35, HP[2] - (skiff ? 1.2 : 2.2)], seg = (A, Bp, r, m, sag) => { let prev = A; for (let i = 1; i <= 8; i++){ const u = i / 8, P = [A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u - sag * 4 * u * (1 - u), A[2] + (Bp[2] - A[2]) * u]; drawN(m, chain(BMrel, limbM(prev, P, r))); prev = P; } };
    if (HM){
      // the hauler on its post inside the rail (its foot on deck), the gear from the water up its path, over the sheave and down the
      // tray; the sheave turns with the gear (0.6 m/s while hauling), the stripper the other way; floats on the net, snoods on the line
      const P0 = [sx - 0.2, d.y, HP[2]], v = turning ? 0.6 : 0, at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
      HAULA += v * clamp(t - HAULT, 0, 0.1) / HM.r; HAULT = t;
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, chain(at(HM.ax), M4.RZ(HAULA))); drawLit(HM.stripper, chain(at(HM.st), M4.RZ(-HAULA * HM.r / (g.kind === 'garn' ? 0.06 : 0.08))));
      nSetup(VP);
      if (setting) drawSetting(BMrel, t, g, G, rigAt(G, g.kind, d).at, 0.45); else {
      const path = HM.path.map(q => [P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]]); path[0] = W0.slice();
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
      const agentsOn = !skiff && typeof CREW3D !== 'undefined' && CREW3D.on(), PLc = agentsOn ? CREW3D.places() : null, dropAt = PLc ? [PLc.drop[0], d.y, PLc.drop[1]] : null, nowE = performance.now() / 1000;
      let sR = tot * 0.7; if (!garn){ for (let s2 = 0; s2 < tot; s2 += 0.1) if (pos(s2)[1] > (G.gw || d.y + 0.9) - 0.45){ sR = s2; break; }
        const Hn = HAULA * HM.r;
        // (the next one comes in when the last is off the deck: the hauler waits for the bleeder, as the line can be stopped)
        if (agentsOn){ const Q = catchQ(); if (turning && Q.length && nowE - DKF.t > DKDUR.gaff + 0.3 && !dkWaits()){ const f = Q.shift(); dkEvent('gaff', pos(sR), f.sp, f.kg, {D:dropAt, wait:12}); DKF.t = nowE; } }
        else if (turning && HF && GAFFH != null && Hn > GAFFH && Hn - GAFFH < 2) for (let j = Math.ceil(sR - Hn); j <= Math.ceil(sR - GAFFH) - 1; j++) if (hash(j * 7 + 13) < HF.p) dkEvent('gaff', pos(sR), HF.sp(hash(j * 3 + 1)), 2 + hash(j * 5) * 4);
        GAFFH = Hn; }
      else if (agentsOn && PLc){ const Q = catchQ(), pk = PLc.pick; if (turning && Q.length && nowE - DKF.t > DKDUR.pick + 0.3 && !dkWaits()){ const f = Q.shift();
        dkEvent('pick', [pk[0] + Math.sin(pk[2]) * 0.48, d.y + 1.0, pk[1] - Math.cos(pk[2]) * 0.48], f.sp, f.kg, {D:dropAt, wait:12}); DKF.t = nowE; } }
      for (let s = off, k = 0; s < tot; s += 1, k++){ const p = pos(s), q = pos(Math.min(tot, s + (garn ? 0.12 : 0.05)));
        if (HF && s < sR && hash((k - id0) * 7 + 13) < HF.p) drawN(fishOf(HF.sp(hash((k - id0) * 3 + 1))), chain(BMrel, M4.T(p[0], p[1] - (garn ? 0.3 : 0.4), p[2]), M4.RX(Math.PI / 2), M4.RZ(hash(k - id0) - 0.5), M4.S(garn ? 0.5 : 0.45)));
        if (garn){ drawN(GB.float, chain(BMrel, limbM([p[0], p[1] + 0.05, p[2]], [q[0], q[1] + 0.05, q[2]], 0.035))); if (s < L[0] && Math.floor(s + HAULA * HM.r) % 3 === 0) drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.45, p[2]], 0.01))); }
        else drawN(GB.float, chain(BMrel, limbM(p, [p[0], p[1] - 0.25, p[2] + 0.02], 0.004))); }
      }
      const R = rigAt(G, g.kind, d), n = g.op === 'haul' ? g.done : g.n - g.done;
      if (g.kind === 'garn') drawNetTub(BMrel, R.at, clamp(n / Math.max(1, g.n), 0, 1), R.ry); else drawLineTubs(BMrel, R.at, n, g.op === 'set' ? n : 0, false, R.ry);
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
    if (!skiff && !(typeof CREW3D !== 'undefined' && CREW3D.on())){ const n = clamp(gopHands(), 0, 3), spots = [[HP[0] - 0.55, HP[2] + 0.2, 'coil', Math.PI / 2], [HP[0] - 1.25, HP[2] + 0.75, 'tend', Math.PI * 0.6], [sx * 0.3 + 0.5, DZ + 0.2, 'tend', Math.PI]];
      for (let k = 0; k < n; k++){ const [x, z, task, a] = spots[k], wl = xf(BMrel, [x, d.y, z]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0, kit:k === 0 && gopMe() ? 'skipper' : null, look:k === 0 && gopMe() ? lookMe() : lookCrew(k - (gopMe() ? 1 : 0))};
        const ev = dkFor('h' + k, [x, d.y, z], task);
        drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + a, task:ev ? ev.kind : task, ev:ev ? dkEv(ev, BMrel, G) : null, walk:false, s:0}, eye, t, 9 + k); }
      dkBloodDraw(VP); }
  }
