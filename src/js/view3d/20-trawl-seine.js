  // ---------- the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  // tråling. Lag også animasjoner for utsett, og opptak av trål»): the doors hang in the gallows either side of the stern ramp and the
  // net lies on its drum. Shooting pays the net out down the ramp, codend first, lowers the doors into the sea and runs them out astern
  // on the warps; towing leaves the warps running from the blocks down into the sea; hauling brings the doors up into the gallows and
  // the net in, the codend full of fish last, up the ramp. The game does not trawl yet (that comes with the ocean step); until then
  // G3._debug.trawl('shoot' | 'tow' | 'haul') plays it, for the tests. Times in real seconds. ----------
  const TRAWL = {mode:null, t0:0, hold:null}, TRM = {}, SHOOT_S = 46, HAUL_S = 50;
  function trawlKit(t){
    if (t in TRM) return TRM[t];
    const door = upA(glbPart(t, 'door')); if (!door) return TRM[t] = null;
    const w = NB(); w.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.17, 0.18, 0.6], 6);
    const n = NB(); n.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.30, 0.20, 0.1], 8);
    return TRM[t] = {door, roll:upA(glbPart(t, 'netroll')), cod:upA(glbPart(t, 'codend')), warp:w.mesh(), net:n.mesh()};
  }
  // a frame at A whose z runs along the unit d, its y as near up as it goes
  function alongM(A, d){
    const up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]; let x = [up[1] * d[2] - up[2] * d[1], up[2] * d[0] - up[0] * d[2], up[0] * d[1] - up[1] * d[0]];
    const l = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / l); const y = [d[1] * x[2] - d[2] * x[1], d[2] * x[0] - d[0] * x[2], d[0] * x[1] - d[1] * x[0]];
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, d[0], d[1], d[2], 0, A[0], A[1], A[2], 1]);
  }
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // where things stand at a moment: the doors lowered (lo) and run out (ro), the net paid out (net), the codend along its way (cod)
  function trawlState(now){
    const u = TRAWL.hold != null ? TRAWL.hold : now - TRAWL.t0;
    if (TRAWL.mode === 'shoot' && u > SHOOT_S){ TRAWL.mode = 'tow'; TRAWL.t0 = now; }
    if (TRAWL.mode === 'haul' && u > HAUL_S + 4) TRAWL.mode = null;
    if (TRAWL.mode === 'shoot') return {lo:sstep(12, 22, u), ro:sstep(22, SHOOT_S, u), net:sstep(0, 16, u), cod:sstep(0, 16, u), full:false};
    if (TRAWL.mode === 'tow') return {lo:1, ro:1, net:1, cod:1, full:false, tow:true};
    if (TRAWL.mode === 'haul') return {lo:1 - sstep(20, 30, u), ro:1 - sstep(0, 22, u), net:1 - sstep(30, HAUL_S, u), cod:u > HAUL_S + 2 ? -1 : 1 - 0.85 * sstep(28, HAUL_S, u), full:true};
    return {lo:0, ro:0, net:0, cod:-1, full:false};
  }
  function drawTrawl(t, A, BMrel, now){
    const K = trawlKit(t); if (!K) return;
    const st = trawlState(now), at = (p, M) => drawN(p, chain(BMrel, M));
    // the net's way: off the drum, down the ramp, into the sea astern and away down; the codend's place on it by stages
    const W = [[A.drum[0], A.drum[1] - 0.9, A.drum[2] + 1.0], [A.rampTop[0], A.rampTop[1] + 0.3, A.rampTop[2]], [A.rampFoot[0], A.rampFoot[1] + 0.2, A.rampFoot[2]],
      [A.rampFoot[0], -1.5, A.rampFoot[2] + 9], [A.rampFoot[0], -12, A.rampFoot[2] + 60]], WT = [0, 0.15, 0.5, 0.7, 1];
    const way = p => { let i = 1; while (i < WT.length - 1 && WT[i] < p) i++; const k = clamp((p - WT[i - 1]) / (WT[i] - WT[i - 1]), 0, 1); return {p:lerp3(W[i - 1], W[i], k), i}; };
    if (K.roll) at(K.roll, chain(M4.T(A.drum[0], A.drum[1], A.drum[2]), new Float32Array([1, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1])));
    if (st.cod >= 0 && K.cod){
      const c = way(st.cod), c2 = way(Math.min(1, st.cod + 0.01)).p, d = [c2[0] - c.p[0], c2[1] - c.p[1], c2[2] - c.p[2]], dl = Math.hypot(d[0], d[1], d[2]);
      const dir = dl > 1e-4 ? d.map(v => v / dl) : [0, 0, 1], sw = st.full ? 1 : 0.55;
      at(K.cod, chain(alongM(c.p, dir), new Float32Array([sw, 0, 0, 0, 0, sw, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])));
      // the net from the drum to the codend
      let prev = W[0]; for (let i = 1; i < c.i; i++){ at(K.net, limbM(prev, W[i], 0.32)); prev = W[i]; } at(K.net, limbM(prev, c.p, 0.32));
    }
    for (const sg of [-1, 1]){
      const S0 = [sg * Math.abs(A.door[0]), A.door[1], A.door[2]], Wn = [sg * Math.abs(A.winch[0]), A.winch[1] + 0.7, A.winch[2]];
      at(K.warp, limbM(Wn, [S0[0], S0[1] + 0.55, S0[2] + 0.2], 0.025));            // from the winch to the block
      const D0 = [S0[0], S0[1] - 0.7, S0[2]];
      const D = [D0[0] + sg * (0.9 * st.lo + 7 * st.ro), D0[1] - (D0[1] + 0.4) * st.lo - 16 * st.ro, D0[2] + 3 * st.lo + 58 * st.ro];
      if (st.tow){ D[0] += Math.sin(now * 0.4 + sg) * 0.8; D[1] = -22; D[2] = D0[2] + 70; }
      at(K.warp, limbM([S0[0], S0[1] - 0.5, S0[2]], D, 0.025));
      if (!st.tow && st.ro < 0.35) at(K.door, chain(M4.T(D[0], D[1], D[2]), M4.RY((sg > 0 ? Math.PI : 0) - Math.PI / 2 * st.lo)));
    }
  }
  // ---------- the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  // animasjoner for begge deler»): shooting pays the seine out over the stern roller from the bin, its corks a ring on the sea round the
  // school from the stern to the starboard side; pursing hauls the purse line in through the davit's blocks; hauling brings the net in
  // through the power block and down into the bin, the ring closing in to the starboard side; then the bunt alongside, the fish
  // boiling in it and the pump's hose in. Not used by the game yet (the ocean step); G3._debug.seine(mode) plays it. Real seconds. ----------
  const SEINE = {mode:null, t0:0, hold:null}, SEINE_S = {shoot:40, purse:25, haul:45, pump:20}, SEINE_NEXT = {shoot:'purse', purse:'haul', haul:'pump', pump:null};
  function seineState(now){
    if (!SEINE.mode) return null;
    let u = SEINE.hold != null ? SEINE.hold : now - SEINE.t0;
    while (SEINE.mode && SEINE.hold == null && u > SEINE_S[SEINE.mode]){ SEINE.t0 += SEINE_S[SEINE.mode]; u -= SEINE_S[SEINE.mode]; SEINE.mode = SEINE_NEXT[SEINE.mode]; }
    return SEINE.mode ? {mode:SEINE.mode, k:clamp(u / SEINE_S[SEINE.mode], 0, 1), u} : null;
  }
  function drawSeine(t, A, BMrel, VP, now){
    const st = seineState(now); if (!st) return;
    const K = trawlKit(t); if (!K) return;
    const at = (p, M) => drawN(p, chain(BMrel, M)), R0 = 62, Rb = 9;
    // the ring in the boat's level frame (x to starboard, z aft): through the stern and the starboard side amidships, the long way round
    const S = [A.stern[0], 0, A.stern[2]], P = [A.side[0] + 1.5, 0, A.side[2]], M = [(S[0] + P[0]) / 2, 0, (S[2] + P[2]) / 2], dx = P[0] - S[0], dz = P[2] - S[2], d = Math.hypot(dx, dz);
    let nx = dz / d, nz = -dx / d; if (nx < 0){ nx = -nx; nz = -nz; }
    const h = Math.sqrt(Math.max(1, R0 * R0 - d * d / 4)), C0 = [M[0] + nx * h, 0, M[2] + nz * h];
    // the ring now: shooting it grows from the stern; hauling it shrinks to the bunt, always through the side point
    let R = R0, Cn = C0, f = 1, from = S;
    if (st.mode === 'shoot') f = sstep(0, 1, st.k);
    if (st.mode === 'haul' || st.mode === 'pump'){
      const k = st.mode === 'pump' ? 1 : sstep(0, 1, st.k), dl = Math.hypot(C0[0] - P[0], C0[2] - P[2]); R = R0 + (Rb - R0) * k;
      Cn = [P[0] + (C0[0] - P[0]) / dl * R, 0, P[2] + (C0[2] - P[2]) / dl * R]; from = P;
    }
    const aS = Math.atan2(from[2] - Cn[2], from[0] - Cn[0]), aP = Math.atan2(P[2] - Cn[2], P[0] - Cn[0]);
    let sweep = st.mode === 'shoot' || st.mode === 'purse' ? ((aP - aS) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) : 2 * Math.PI - 0.12;
    if (st.mode === 'shoot' || st.mode === 'purse'){ const mid = aS + sweep / 2, mx = Cn[0] + Math.cos(mid) * R, mz = Cn[2] + Math.sin(mid) * R; if (Math.hypot(mx - M[0], mz - M[2]) < R) sweep -= 2 * Math.PI; }
    // the net over the stern roller, the purse line, the net in through the power block, the pump hose
    if (st.mode === 'shoot'){ at(K.net, limbM(A.bin, A.stern, 0.3)); at(K.net, limbM(A.stern, [S[0], -0.5, S[2] + 1.5], 0.3)); }
    if (st.mode === 'purse') at(K.warp, limbM(A.purse, [A.purse[0] + 4, -10, A.purse[2]], 0.035));
    if (st.mode === 'haul'){ at(K.net, limbM([P[0] + 0.5, -0.3, P[2]], A.block, 0.35)); at(K.net, limbM(A.block, A.bin, 0.35)); }
    if (st.mode === 'pump') at(K.warp, limbM(A.block, [Cn[0], -0.8, Cn[2]], 0.18));
    // the corks (and the fish in the bunt) as points on the sea, in the boat's level frame
    const ex = [BMrel[0], BMrel[2]], el = Math.hypot(ex[0], ex[1]) || 1, ux = ex[0] / el, uz = ex[1] / el, T0 = [BMrel[12], BMrel[13], BMrel[14]];
    const W = (x, y, z) => [T0[0] + ux * x - uz * z, T0[1] + y, T0[2] + uz * x + ux * z];
    let n = 0; const L = Math.abs(sweep) * R * f, N = Math.min(600, Math.max(2, Math.round(L / 2.4)));
    for (let i = 0; i <= N; i++){ const a = aS + sweep * f * i / N, q = W(Cn[0] + Math.cos(a) * R, 0.12, Cn[2] + Math.sin(a) * R); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 1; n++; }
    drawPts(n, gl.POINTS, VP, [0.96, 0.46, 0.10], 520, true);
    if (st.mode === 'pump' || (st.mode === 'haul' && st.k > 0.75)){
      n = 0; for (let i = 0; i < 160; i++){ const a = hash(i) * 6.283, r = Math.sqrt(hash(i + 999)) * (R - 1.2), b = Math.abs(Math.sin(now * (3 + hash(i + 7) * 4) + i));
        const q = W(Cn[0] + Math.cos(a) * r, 0.05 + 0.35 * b, Cn[2] + Math.sin(a) * r); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 0.5 + 0.5 * b; n++; }
      drawPts(n, gl.POINTS, VP, [0.82, 0.86, 0.9], 300, true);
    }
    nSetup(VP);
  }
  // onDeck: the skipper jigs himself, so he stands at the first deck place the crew leave free (at the wheel when there is none)
  // the people aboard where the agents have them (deckcrew.js): walking, at their work, or at the wheel inside the house; in the bridge
  // view nobody is drawn at the wheel, where the eye is (the skipper, or a hand who has the helm)
  function drawDeckCrew(BMrel, eye, VP, t, G){
    nSetup(VP); let idx = 20; if (!GB) buildGear();
    const b = S.boat, d = G.deck || {y:G.gw, z:0}, gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), now = performance.now() / 1000, DW = deckWork(G), ST = CREW3D._st, V = VESSELS[vtype()] || {}, K = G.kit || {};
    dkTick(); DKGULL = null;
    const rel = q => xf(BMrel, q), A = CREW3D.visible();
    // jigging by hand without machines: the real catch (CATCHQ) comes up on the lines of those at the rail, one fish at a time each
    const machines = S.equip && S.equip.jukse > 0 && !(S.target === 'kveite' && b.kgear) && SK && SK.machG;
    if (b.status === 'fishing' && !b.gop && !b.deckStop && !machines && !window.jigActive){ const Q = catchQ();
      for (const a of A){ if (!Q.length) break; if (a.st !== 'fiske' || a.mode !== 'at' || now - (DKF.jig[a.id] || 0) < 2.4 || DKEV.some(e => (e.who === a.id || e.for === a.id) && now - e.t0 < DKDUR[e.kind] + 0.3)) continue;
        const f = Q.shift(), F0 = [Math.sin(a.h), -Math.cos(a.h)], rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; DKF.jig[a.id] = now;
        dkEvent('jigup', rl, f.sp, f.kg, {for:a.id, wait:8, Wat:[rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]}); } }
    // the fish lying on the deck where they were shaken off the hook or let fall from the net, until the bleeder takes them up
    if (SK && SK.fishM) for (const f of DKDECK) drawN(fishOf(f.sp), chain(BMrel, M4.T(f.at[0], f.at[1] + 0.05, f.at[2]), M4.RY(f.yaw), M4.RZ(Math.PI / 2), M4.S(clamp(0.42 * Math.cbrt(f.kg || 2), 0.28, 1.2))));
    // where the gutted fish go: the packer's crate on his right (a hold boat), else the open boat's tub nearest him (kit.tubs)
    const pk = A.find(a => a.st === 'is' && a.mode === 'at'), tubs = V.hold && V.hold.kind === 'dekk' ? K.tubs : null;
    const crateOf = a => { const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)];
      if (tubs && tubs.length){ let best = tubs[0], bd = 1e9; for (const q of tubs){ const dd = Math.hypot(q[0] - a.x, q[2] - a.z); if (dd < bd){ bd = dd; best = q; } } return {p:[best[0], best[1], best[2]], top:(best[4] || 460) > 300 ? 0.62 : 0.55, tub:true}; }
      return {p:[a.x + F0[0] * 0.58, a.y, a.z + F0[1] * 0.58], top:0.28, tub:false}; };
    const pkC = pk ? crateOf(pk) : null, held = spHold(x => !x.gut && !x.iced), packed = spHold(x => x.iced), table = rel(DW.table), tubTop = rel(dkTub(G)), offal = rel(DW.offal);
    for (const a of A){ if (cam.helm && (a.me || a.mode === 'helm')) continue;
      // (a place stood off its cell: leaning back, the back at the rail, deckcrew.js idlePlace)
      const go = CREW3D.walkOff(a);
      const lp = a.mode === 'helm' && G.skipperAt ? [G.skipperAt[0], G.skipperAt[1], G.skipperAt[2]] : [a.x + go[0], a.y, a.z + go[1]], wl = xf(BMrel, lp), wy = wl[1] + eye[1];
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look:a.me ? lookMe() : a.c ? lookOf(a.c) : lookCrew(0)};
      const ev = a.mode === 'at' ? dkFor(a.id, lp, a.task) : null;   // a fish to bleed or to gaff in at his place
      // a helm made for sitting (the model's eye low over the place, as under the snekke's hard top) is steered from the seat
      const sat = a.mode === 'helm' && G.eye && G.skipperAt && G.eye[1] - G.skipperAt[1] < 1.4;
      const st = {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + (a.mode === 'helm' ? 0 : a.h + (a.sqA || 0) * Math.PI / 2), task:ev ? ev.kind : sat ? 'helmsit' : a.task, seat:sat ? Math.max(0.2, G.eye[1] - G.skipperAt[1] - 0.95) : 0, ev:ev ? dkEv(ev, BMrel, G) : null, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0};
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], sg = a.x >= 0 ? 1 : -1;
      const g0 = CREW3D.holds(a), ef = a.ef == null ? 1 : a.ef, ta = a.tk != null ? a.tk : t;   // (the place still held; each one's own beat, deckcrew.js a.tk)
      st.age = a.c ? a.c.age : 45; st.deck = true; st.rail = a.mode === 'at' && g0 ? g0.rail || null : null; if (a.task === 'smoke' && b.status === 'sailing') st.lean = false;
      st.slump = clamp((0.96 - ef) * 1.6, 0, 0.35); st.tape = !!(a.c && a.c.cut && S.t < a.c.cut); if (a.put) st.put = {task:a.put.task, u:clamp(a.putU || 0, 0, 1)};
      // a moment (G3.crewFx, 14-crewlife.js crewSlip): a fish slips over the side, the knife slips and a hand is cut
      const fx = CFX.get(a.id);
      if (fx){ const age = now - fx.t0, dur = fx.kind === 'slip' ? 2.6 : 2.4;
        if (age > dur || a.mode !== 'at' || ev) CFX.delete(a.id);
        else { st.task = fx.kind; st.fx = true; if (fx.kind === 'cut') st.cutU = age / dur;
          else { st.slipU = age / dur; st.slip = fx; const r = fx.rail;
            if (r){ st.Rl = rel([a.x + r.F[0] * r.d, a.y + r.y, a.z + r.F[1] * r.d]); st.Wt = rel([a.x + r.F[0] * (r.d + 0.9), -0.1, a.z + r.F[1] * (r.d + 0.9)]);
              let dh = Math.atan2(r.F[0], -r.F[1]) - a.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
              st.h += dh * ease(Math.min(1, age / 0.3)) * (1 - ease(Math.max(0, (age / dur - 0.8) / 0.2))); } } } }
      if (a.mode === 'at' && !ev && !st.fx){
        // gutting at the table: the fish from the bleeding tub, the guts over the rail, the gutted fish to the packer
        if (a.task === 'gut'){ st.task = 'gutw'; st.Tb = table; st.Ub = tubTop; st.Of = offal; const n = Math.floor((ta + idx * 1.7) / 5.6); st.gsp = held(hash(n * 3 + idx)); st.gkg = 2 + hash(n * 5) * 3;
          if (pkC){ st.Cr = rel(pkC.p); st.crTop = pkC.top; st.packId = pk.id; } }
        else if (a.task === 'pack'){ const C = crateOf(a); st.Cr = rel(C.p); st.crTop = C.top; st.crTub = C.tub; st.fill = ST.crateFill || 0; st.csp = i => packed(hash(i * 7 + 1)); const L = DKLAY[a.id]; st.lay = L ? now - L.t : -1;
          // the ice bin on the side away from the gutter
          const gt = A.find(q => q.st === 'sloy' && q !== a); st.binR = gt && (gt.x - a.x) * R0[0] + (gt.z - a.z) * R0[1] < 0 ? 0.55 : -0.55; }
        else if (a.task === 'egn' || a.task === 'strip'){ const PLs = CREW3D.places() || {tubs:[]}, T0 = PLs.tubs[(a.goal && a.goal.tub || 0) % 8]; if (T0) st.Tu = rel([T0[0], (PLs.tubY != null ? PLs.tubY : a.y) + 0.38, T0[1]]); st.Bk = rel([a.x + R0[0] * 0.38 - F0[0] * 0.12, a.y, a.z + R0[1] * 0.38 - F0[1] * 0.12]);
          st.Of = rel([sg * ((G.beam || 3) / 2 + 1.4), -0.1, a.z]); if (a.task === 'strip' && ((t + idx * 3.1) % 25) < 2.2) DKGULL = [st.Of[0] + eye[0], (env.tide || 0), st.Of[2] + eye[2]]; }
        else if (a.task === 'mend') st.Nt = rel([a.x + F0[0] * 0.42, a.y + railH - 0.02, a.z + F0[1] * 0.42]);
        else if (a.task === 'jig' && !machines){ const rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; st.Rl = rel(rl); st.Wt = rel([rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]); } }
      if (a.sub && a.sub.carry === 'crate'){ st.crate = true; st.csp = i => packed(hash(i * 7 + 1)); if (a.mode === 'at') st.s = ST.clk - (a.sub.done - (a.sub.hold || 2)); }
      drawWorker(P, st, eye, ta, idx++); }
    dkBloodDraw(VP);
    if (HELM_KIT[vtype()] && G.skipperAt && cam.dist < 80) drawHelmKit(BMrel, eye, G);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the species of the fish in the hold that pass a test, by weight: r in 0..1 to a species (the fish in hand are the real catch's)
  function spHold(f){ let all = 0; const cum = []; for (const x of S.hold || []){ if (!f(x) || (SPECIES[x.sp] || {}).live) continue; all += x.kg; cum.push([x.sp, all]); } return r => { if (!cum.length) return 'torsk'; const v = r * all; for (const c of cum) if (v <= c[1]) return c[0]; return cum[cum.length - 1][0]; }; }
  // the gutting table's work point (its top in the middle) and where the guts go: over the rail on the table's side into the water
  // (down the bench's chute), in the boat's frame; as drawDeck places them
  function deckWork(G){
    const vt = vtype(), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), tz = W ? W.table[2] : d.z;
    const own = !!(W && W.own), V = VESSELS[vt], big = !!(V && V.len >= 10), KB = own ? null : kit('fish', big ? 'benk' : 'bord'), XF = kitX('fish'), tSide = tx < 0 ? 1 : -1, kTop = XF[big ? 'benk_top' : 'bord_top'];
    const topY = own && W.top != null ? W.top + 0.02 : KB && kTop != null ? d.y + kTop + 0.02 : d.y + 0.885, kDrop = KB && XF[big ? 'benk_drop' : 'bord_drop'];
    const dropP = kDrop ? [tx + tSide * kDrop[2], d.y + Math.max(0.6, kDrop[1]), tz - tSide * kDrop[0]] : [tx - tSide * 0.15, d.y + 1.0, tz];
    return {table:[tx, topY, tz], drop:dropP, offal:[dropP[0] - tSide * 2.6, -0.1, dropP[2]], tSide};
  }
  // a simple wheel and a chair at the helm, in the boat's frame, for the models whose wheelhouse is bare inside (vessel3d.js HELM_KIT)
  function drawHelmKit(BMrel, eye, G){
    const h = bv.head, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], A = G.skipperAt, at = (a, up, r) => { const w = xf(BMrel, [A[0] + r, A[1] + up, A[2] - a]); return [w[0], w[1], w[2]]; };
    const c = at(0.42, 1.08, 0), ax = [F[0] * 0.9, 0.45, F[1] * 0.9], al = Math.hypot(ax[0], ax[1], ax[2]), a = ax.map(v => v / al);   // the wheel's axis, tilted back towards the one steering
    const u = R, v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]], rim = [];
    for (let i = 0; i < 12; i++){ const th = i / 12 * Math.PI * 2; rim.push([c[0] + (u[0] * Math.cos(th) + v[0] * Math.sin(th)) * 0.2, c[1] + (u[1] * Math.cos(th) + v[1] * Math.sin(th)) * 0.2, c[2] + (u[2] * Math.cos(th) + v[2] * Math.sin(th)) * 0.2]); }
    for (let i = 0; i < 12; i++){ drawN(PM.wire, limbM(rim[i], rim[(i + 1) % 12], 0.016)); if (i % 2 === 0) drawN(PM.wire, limbM(c, rim[i], 0.011)); }
    drawN(PM.wire, limbM(c, at(0.62, 0.98, 0), 0.025));   // the column down to the console
    const sp = at(-0.42, 0.75, 0); drawN(PM.seat, chain(M4.T(sp[0], sp[1], sp[2]), M4.RY(-h))); drawN(PM.wire, limbM(at(-0.42, 0.02, 0), sp, 0.03));
  }
  function drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named){
    const m = pvm(t, liv); if (!m) return; const P = people(); nSetup(VP); const wr = named && wearOn(t); drawN(named && !BENCH.on ? pvmHull(t, liv, ownTier(t, BMrel)) || m.hull : m.hull, BMrel); if (wr) wearOff();
    if (named && BENCH.on){ for (let j = 1; j < BENCH.k; j++) drawN(m.hull, BMrel);
      for (let i = 0; i < BENCH.n; i++){ const M = chain(BMrel, M4.T(((i % 4) - 1.5) * ((G.beam || 4) + 3), 0, (Math.floor(i / 4) + 1) * ((G.stern || 5) * 2 + 6))); drawN(m.hull, M); }
      BENCH.tris = Math.round(m.hull.n / 3) * (BENCH.k + BENCH.n); }
    const ds = onDeck && G.crewSpots && ncrew < G.crewSpots.length ? G.crewSpots[ncrew] : null;
    if (skipper && ds) drawN((named && ownPerson('skipDeck')) || P.skipDeck, chain(BMrel, M4.T(ds[0], ds[1], ds[2]), M4.RY(ds[3] || 0)));
    else if (skipper) drawN((named && ownPerson('skip')) || P.skip, chain(BMrel, M4.T(G.skipperAt[0], G.skipperAt[1], G.skipperAt[2])));
    for (let i = 0; i < ncrew && i < G.crewSpots.length; i++){ const c = G.crewSpots[i]; drawN((named && ownPerson('crew', i)) || P.crew, chain(BMrel, M4.T(c[0], c[1], c[2]), M4.RY(c[3] || 0))); }
    if (G.trawl) drawTrawl(t, G.trawl, BMrel, performance.now() / 1000);
    if (G.seine) drawSeine(t, G.seine, BMrel, VP, performance.now() / 1000);
    gl.disableVertexAttribArray(2);
    if (named && SK){ const q = !S.unnamed && nameQ(t); if (q){ paintName(t, liv); for (const s of q) drawTexQuad(s, SK.tName, BMrel, VP, true, [0, 0.2, 0]); } drawMark(t, BMrel, VP, liv); drawLogo(t, BMrel, VP, ...ownLogo()); }
    gl.useProgram(PL.p);
  }
  // the local fleet near you: the kit model nearest each boat (vessel3d.js npcKit), scaled to her length and beam, at lod 1 within
  // 300 m and lod 0.3 within 1.5 km (a detailed GLB model gives its near and simple versions), with the skipper in the wheelhouse and hands on deck when she fishes; further out the box models
  const NKM = {};
  // a detailed model from tools/boats is near only within 150 m: many of the local fleet share it, and a tablet draws them all
  // a fishing NPC's model by her length and beam (FLEET's, and the coast's from tools/map/npc.py): the buffers by model, lod and livery,
  // the scale by boat
  // another player's boat is her own type's model (Jonas 05.10.2026: a friend in the same old wooden boat showed as a white box boat)
  const npcType = n => n.player && SPEC3D[n.vtype] ? n.vtype : npcKit(n.L, n.B);
  const NKN = {}; function npcNear(n){ const k = n.player ? 'p|' + n.vtype : n.L + '|' + n.B; if (!(k in NKN)) NKN[k] = glbHas(npcType(n)) ? 150 : 300; return NKN[k]; }
  const NKB = {};
  function npcMesh(n, lod){
    const kk = n.id + '|' + lod + '|' + (n.player ? n.vtype + '|' + n.liv : ''); if (kk in NKM) return NKM[kk];   // a player's repaint is a new key
    const t = npcType(n), liv = n.liv || 0, k = t + '|' + lod + '|' + liv;
    if (!(k in NKB)){ const m = npcModel(t, lod, liv), up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}); NKB[k] = m ? {t, hull:up(m.o), glass:lod >= 1 ? up(m.glass) : null, geo:m.geo} : null; }
    const B = NKB[k]; if (!B) return NKM[kk] = null;
    const V = VESSELS[t], sx = n.B / V.beam, sz = n.L / V.len, sy = (sx + sz) / 2;
    return NKM[kk] = Object.assign({}, B, {sv:[sx, sy, sz], S:new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])});
  }
  let npcNow = [];
  function drawNPC(eye, t, H, VP){
    if (!NPCM) return;
    npcNow = npcStates(H).filter(n => !n.rs && Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000);   // the rescue boat has her own model (RB)
    const kit = [];
    for (const n of npcNow){
      // a boat on your tow line (core/09g-turer.js): placed astern of your boat as the view shows her, 30 m of line from your stern
      // to her bow, so she follows smoothly between the simulation's minutes
      if (n.tur && n.st === 'tow' && bv.init){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; }
      // towing between players (ui/10o-ptow.js): the player's boat in your tow astern of you, or the one towing you ahead, on the same 30 m of line
      n.ptow = null;
      if (n.player && bv.init && S.ptowH && S.ptowH.st === 'tow' && n.id === S.ptowH.pid){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'tail'; }
      else if (n.player && bv.init && S.ptow && S.ptow.st === 'tow' && n.id === S.ptow.pid){ const fwd = -(GEO(vtype()).bow || -3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x + Math.sin(bv.head) * fwd) / 1000, y:(bv.z - Math.cos(bv.head) * fwd) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'head'; }
      const x = n.p.x * 1000, z = n.p.y * 1000, big = n.type === 'coastal' || n.type === 'ferry', y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = big ? Math.sin(t * 0.4 + x) * 0.01 : Math.sin(t * 1.1 + x) * 0.05 * (0.3 + WV.hs);
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -n.hd, big ? 0 : Math.sin(t * 0.9 + z) * 0.03, roll);
      const d = Math.hypot(x - eye[0], z - eye[2]); n.K = (n.fleet || n.coast || n.player) && d / ZF() < 1500 * QUAL.lodK[QUAL.lvl] ? npcMesh(n, d / ZF() < npcNear(n) * QUAL.lodK[QUAL.lvl] ? 1 : 0.3) : null;
      if (n.K) kit.push(n); else drawLit(NPCM[n.type], n.M);
    }
    if (!kit.length) return;
    const P = people(); nSetup(VP);
    for (const n of kit){ const K = n.K, G = K.geo, at = (p, r) => chain(n.M, M4.T(p[0] * K.sv[0], p[1] * K.sv[1], p[2] * K.sv[2]), M4.RY(r || 0));
      drawN(K.hull, chain(n.M, K.S));
      if (!K.glass) continue;
      drawNPCAnchor(n, K);   // her anchors stowed in their roller or hawse, as on your own boat
      if (npcCrewDraw(n, K, eye, t)) continue;   // her people walk her deck like yours (deckcrew.js crewSim)
      if (n.st !== 'port') drawN(npcPerson('skip', n), at(G.skipperAt));
      if (n.st === 'fishing') for (let i = 0; i < 2 && i < G.crewSpots.length; i++) drawN(npcPerson('crew', {id:String(n.id) + i, player:n.player, lk:n.lk, ck:n.ck}, i), at(G.crewSpots[i], G.crewSpots[i][3]));
    }
    drawNPCNames(kit, VP);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the agents of another boat within the near LOD (deckcrew.js crewSim, one per boat, dropped when she has been out of sight a
  // minute): the same walking people as on your own boat, in her model's frame scaled to her size; false when her model has no deck map
  const NCREW = new Map();
  function npcCrewDraw(n, K, eye, t){
    if (typeof crewSim !== 'function' || !K.geo || K.geo.hand) return false;
    const type = K.t; let E = NCREW.get(n.id);
    if (!E || E.type !== type){ const st = {n}; E = {type, st, t:0, sim:crewSim({type:() => type, ctx:G => npcCrewCtx(st.n, G), seed:1 + (lookHash(String(n.id)) % 1000)})}; NCREW.set(n.id, E); }
    E.st.n = n; const gap = t - E.t; E.t = t; const sim = E.sim; if (!sim.on()) return false;
    if (gap > 5) sim._st.lastSim = null;   // out of sight a while: everyone straight to their place
    sim.tick(Math.min(0.1, Math.max(0, gap)));
    const G = K.geo, sv = K.sv, h0 = n.hd; let idx = 40 + (lookHash(String(n.id)) % 50);
    for (const a of sim.visible()){
      const lp = a.mode === 'helm' && G.skipperAt ? G.skipperAt : [a.x, a.y, a.z], wl = xf(n.M, [lp[0] * sv[0], lp[1] * sv[1], lp[2] * sv[2]]), wy = wl[1] + eye[1];
      const look = npcLook(a.me ? 'skip' : 'crew', n, a.c ? (a.c.id.endsWith('1') ? 1 : 0) : 0);
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look};
      drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:h0 + (a.mode === 'helm' ? 0 : a.h), task:a.task, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0}, eye, t, idx++); }
    if (NCREW.size > 24) for (const [id, e] of NCREW) if (t - e.t > 60) NCREW.delete(id);
    return true;
  }
  // the look of a person on another boat: a player's as she sent it (lk, ck), a local boat's from its id (as npcPerson)
  const npcLook = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, l = code && lookFromKey(code); if (l) return l; }
    const h = lookHash(String(n.id)) % 12; return lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea');
  };
