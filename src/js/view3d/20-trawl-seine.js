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
    return TRM[t] = Object.assign({door, roll:upA(glbPart(t, 'netroll')), cod:upA(glbPart(t, 'codend'))}, ropeKit());
  }
  // the warp and the net as unit tubes (limbM stretches them), for every model: a ship without trawl doors still shoots a seine
  let ROPE = null;
  function ropeKit(){
    if (ROPE) return ROPE;
    const w = NB(); w.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.17, 0.18, 0.6], 6);
    const n = NB(); n.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.30, 0.20, 0.1], 8);
    return ROPE = {warp:w.mesh(), net:n.mesh()};
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
  function drawTrawl(t, A, BMrel, now, stO){
    const K = trawlKit(t); if (!K) return;
    const st = stO || trawlState(now), at = (p, M) => drawN(p, chain(BMrel, M));
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
  // stO: a stage given from outside instead of the debug player's ({m, k, R, purse}: the ocean fleet's seiners, 05d-hav.js havFish,
  // by the clock). Their ring has its centre R metres to starboard abeam, as the ship circles the school with it there; the corks
  // shot so far lie on her own way behind her, so the ring drawn in her frame stays put on the sea while she goes round. A Danish
  // seine (purse false) lays warps, not corks: a rope floating on the sea, the bunt without the pump.
  function drawSeine(t, A, BMrel, VP, now, stO){
    const st = stO ? {mode:stO.m, k:stO.k} : seineState(now); if (!st) return;
    const K = ropeKit(), purse = !stO || stO.purse !== false;
    const at = (p, M) => drawN(p, chain(BMrel, M)), R0 = stO ? stO.R : 62, Rb = stO ? Math.min(9, R0 * 0.2) : 9;
    // the ring in the boat's level frame (x to starboard, z aft): through the stern and the starboard side amidships, the long way round
    const S = [A.stern[0], 0, A.stern[2]], P = [A.side[0] + 1.5, 0, A.side[2]], M = [(S[0] + P[0]) / 2, 0, (S[2] + P[2]) / 2], dx = P[0] - S[0], dz = P[2] - S[2], d = Math.hypot(dx, dz);
    let nx = dz / d, nz = -dx / d; if (nx < 0){ nx = -nx; nz = -nz; }
    const h = Math.sqrt(Math.max(1, R0 * R0 - d * d / 4)), C0 = stO ? [R0, 0, 0] : [M[0] + nx * h, 0, M[2] + nz * h];
    // the ring now: shooting it grows from the stern; hauling it shrinks to the bunt, always through the side point
    let R = R0, Cn = C0, f = 1, from = S;
    if (st.mode === 'shoot') f = sstep(0, 1, st.k);
    if (st.mode === 'haul' || st.mode === 'pump'){
      const k = st.mode === 'pump' ? 1 : sstep(0, 1, st.k), dl = Math.hypot(C0[0] - P[0], C0[2] - P[2]); R = R0 + (Rb - R0) * k;
      Cn = [P[0] + (C0[0] - P[0]) / dl * R, 0, P[2] + (C0[2] - P[2]) / dl * R]; from = P;
    }
    const aS = Math.atan2(from[2] - Cn[2], from[0] - Cn[0]), aP = Math.atan2(P[2] - Cn[2], P[0] - Cn[0]);
    let sweep = st.mode === 'shoot' || st.mode === 'purse' ? ((aP - aS) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) : 2 * Math.PI - 0.12;
    if (stO && (st.mode === 'shoot' || st.mode === 'purse')) sweep = -(2 * Math.PI - 0.12);   // back along her own way round
    else if (st.mode === 'shoot' || st.mode === 'purse'){ const mid = aS + sweep / 2, mx = Cn[0] + Math.cos(mid) * R, mz = Cn[2] + Math.sin(mid) * R; if (Math.hypot(mx - M[0], mz - M[2]) < R) sweep -= 2 * Math.PI; }
    // the net over the stern roller, the purse line, the net in through the power block, the pump hose
    if (st.mode === 'shoot'){ at(K.net, limbM(A.bin, A.stern, 0.3)); at(K.net, limbM(A.stern, [S[0], -0.5, S[2] + 1.5], 0.3)); }
    if (st.mode === 'purse') at(K.warp, limbM(A.purse, [A.purse[0] + 4, -10, A.purse[2]], 0.035));
    if (st.mode === 'haul' && purse){ at(K.net, limbM([P[0] + 0.5, -0.3, P[2]], A.block, 0.35)); at(K.net, limbM(A.block, A.bin, 0.35)); }
    if (st.mode === 'haul' && !purse) for (const z of [-3, 3]) at(K.warp, limbM([A.side[0], A.purse[1], A.side[2] + z], [P[0] + 3, -6, P[2] + z * 4], 0.04));   // the warps in over the side
    if (st.mode === 'pump') at(K.warp, limbM(A.block, [Cn[0], -0.8, Cn[2]], 0.18));
    // the corks (and the fish in the bunt) as points on the sea, in the boat's level frame
    const ex = [BMrel[0], BMrel[2]], el = Math.hypot(ex[0], ex[1]) || 1, ux = ex[0] / el, uz = ex[1] / el, T0 = [BMrel[12], BMrel[13], BMrel[14]];
    const W = (x, y, z) => [T0[0] + ux * x - uz * z, T0[1] + y, T0[2] + uz * x + ux * z];
    let n = 0; const L = Math.abs(sweep) * R * f, N = Math.min(600, Math.max(2, Math.round(L / 2.4)));
    for (let i = 0; i <= N; i++){ const a = aS + sweep * f * i / N, q = W(Cn[0] + Math.cos(a) * R, 0.12, Cn[2] + Math.sin(a) * R); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 1; n++; }
    drawPts(n, gl.POINTS, VP, purse ? [0.96, 0.46, 0.10] : [0.66, 0.6, 0.46], purse ? 520 : 340, true);
    if (purse && (st.mode === 'pump' || (st.mode === 'haul' && st.k > 0.75))){
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
    // (the tests hold the crew's deck at a roll and a pitch of their own, where the boat is and heading her way, hold everyone's beat
    // still (T), put everyone at a place in one pose (task), and take the time of this function: SJOBEIN.test, tests/sjobein.py)
    const SJT = SJOBEIN.test, sjp0 = SJT && SJT.prof ? performance.now() : 0;
    // (the tests go through the people again with another pose or beat without a whole frame: LEMMER.redraw, tests/lemmer.py. Nothing
    // is drawn then, the joints are only reckoned and logged: thousands of figures a second were minutes of work for a software GPU)
    LEMMER.fr++; if (LEMMER.log && !LEMMER.dry){ const B0 = BMrel; LEMMER.redraw = () => { const d0 = drawN; LEMMER.dry = true; drawN = () => {}; try { drawDeckCrew(B0, eye, VP, t, G); } finally { drawN = d0; LEMMER.dry = false; } };
      // (and drawn for real n times with the driver made to finish, for the time a figure costs: tests/folk2deck.py. ms a figure)
      LEMMER.bench = n => { const px = new Uint8Array(4), lg = LEMMER.log; LEMMER.log = null; gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now(); try { for (let i = 0; i < n; i++) drawDeckCrew(B0, eye, VP, t, G); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } finally { LEMMER.log = lg; } return (performance.now() - t0) / n / Math.max(1, CREW3D.visible().length); }; }
    if (SJT && SJT.roll != null) BMrel = model(BMrel[12], BMrel[13], BMrel[14], -bv.head, SJT.pitch || 0, SJT.roll || 0);
    const DN = deckN(BMrel);   // (the deck's normal in the world, for the sea legs: view3d/08-plants.js seaNow)
    const b = S.boat, d = G.deck || {y:G.gw, z:0}, gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), now = performance.now() / 1000, DW = deckWork(G), ST = CREW3D._st, V = VESSELS[vtype()] || {}, K = G.kit || {};
    dkTick(); DKGULL = null; DKBM = BMrel;   // (the boat's frame for the wet deck, 09-landing-deck.js dkWetPts)
    const rel = q => xf(BMrel, q), A = CREW3D.visible();
    // jigging by hand without machines: the real catch (CATCHQ) comes up on the lines of those at the rail, one fish at a time each
    const machines = S.equip && S.equip.jukse > 0 && !(S.target === 'kveite' && b.kgear) && SK && SK.machG;
    if (b.status === 'fishing' && !b.gop && !b.deckStop && !machines && !window.jigActive){ const Q = catchQ();
      for (const a of A){ if (!Q.length) break; if (a.st !== 'fiske' || a.mode !== 'at' || now - (DKF.jig[a.id] || 0) < 2.4 || DKEV.some(e => (e.who === a.id || e.for === a.id) && now - e.t0 < DKDUR[e.kind] + 0.3)) continue;
        const f = Q.shift(), F0 = [Math.sin(a.h), -Math.cos(a.h)], rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; DKF.jig[a.id] = now;
        dkEvent('jigup', rl, f.sp, f.kg, {for:a.id, wait:8, Wat:[rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]}); } }
    // the fish lying on the deck where they were shaken off the hook or let fall from the net, until the bleeder takes them up
    // (not yet bled, it flaps on the deck: on its side the bend slaps the tail up and down, in bursts, flap in 09-landing-deck.js)
    if (SK && SK.fishM){ const tf = performance.now() / 1000; for (const f of DKDECK){ const Fl = flap(tf, (f.kg || 2) * 2.7 + f.yaw * 3, 0.6, f.sp, f.kg); bendOn(Fl);
      drawN(fishOf(f.sp), chain(BMrel, M4.T(f.at[0], f.at[1] + 0.05, f.at[2]), M4.RY(f.yaw + Fl[0] * 0.5), M4.RZ(Math.PI / 2), M4.S(clamp(0.42 * Math.cbrt(f.kg || 2), 0.28, 1.2)))); } bendOff(); }
    // where the gutted fish go: the packer's crate on his right (a hold boat), else the open boat's tub nearest him (kit.tubs)
    const pk = A.find(a => a.st === 'is' && a.mode === 'at'), tubs = V.kar ? karPlaces(vtype()) : null;
    // (an open boat: the tub being filled now, the fish landing on its heap, core/07f-kar.js)
    const crateOf = a => { const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)];
      if (tubs && tubs.length){ const ti = karFilling(vtype()), q = tubs[ti]; return {p:q.at.slice(), top:karTop(vtype(), ti), tub:true}; }
      return {p:[a.x + F0[0] * 0.58, a.y, a.z + F0[1] * 0.58], top:0.28, tub:false}; };
    const pkC = pk ? crateOf(pk) : null, held = spHold(x => !x.gut && !x.iced), packed = spHold(x => x.iced), table = rel(DW.table), tubTop = rel(dkTub(G)), offal = rel(DW.offal);
    for (const a of A){ if (cam.helm && (a.me || a.mode === 'helm')) continue;
      // (a place stood off its cell: leaning back, the back at the rail, deckcrew.js idlePlace)
      const go = CREW3D.walkOff(a);
      const lp = a.mode === 'helm' && G.skipperAt ? [G.skipperAt[0], G.skipperAt[1], G.skipperAt[2]] : [a.x + go[0], a.y, a.z + go[1]], wl = xf(BMrel, lp), wy = wl[1] + eye[1];
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look:seaLook(a.me ? lookMe() : a.c ? lookOf(a.c) : lookCrew(0), a.mode === 'helm')};
      // (the tests: the last event of a kind played again by the one whose work it is, at the moment asked for, SJOBEIN.test.ev and .t)
      // (the new people: the fish comes in at the first hauler's place, and the gaff's sweep and where the fish is let fall are laid
      // out from there, deckcrew.js places; the second hauler does not gaff across him)
      const evK = LEMMER.on && a.task === 'haul' && a.slot > 0 && A.some(q => q !== a && q.task === 'haul' && q.slot === 0 && q.mode === 'at') ? 'haul2' : a.task;   /* (alone at the hauler, the second gaffs as before: else no fish came aboard) */
      const evT = SJT && SJT.ev && DKLAST[SJT.ev] && a.mode === 'at' && (DKPLAY[evK] || [])[0] === SJT.ev ? DKLAST[SJT.ev] : null;
      const ev = evT || (a.mode === 'at' ? dkFor(a.id, lp, evK) : null);   // a fish to bleed or to gaff in at his place
      // a helm made for sitting (the model's eye low over the place, as under the snekke's hard top) is steered from the seat
      const sat = a.mode === 'helm' && G.eye && G.skipperAt && G.eye[1] - G.skipperAt[1] < 1.4;
      const st = {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + (a.mode === 'helm' ? 0 : a.h + (a.sqA || 0) * Math.PI / 2), task:ev ? ev.kind : sat ? 'helmsit' : a.task, seat:sat ? Math.max(0.2, G.eye[1] - G.skipperAt[1] - 0.95) : 0, ev:ev ? dkEv(ev, BMrel, G) : null, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0};
      if (evT && SJT.t != null) st.ev.k = SJT.t;
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], sg = a.x >= 0 ? 1 : -1;
      const g0 = CREW3D.holds(a), ef = a.ef == null ? 1 : a.ef, ta = SJT && SJT.T != null ? SJT.T : a.tk != null ? a.tk : t;   // (the place still held; each one's own beat, deckcrew.js a.tk)
      st.age = a.c ? a.c.age : 45; st.deck = true; st.bp = lp; st.dn = DN; st.sea = b.status === 'port' && !SJT ? null : seaSet(CREW3D, a, BMrel); if (SJT && SJT.task && a.mode === 'at' && !ev) st.task = SJT.task; st.rail = a.mode === 'at' && g0 ? g0.rail || null : null; if (a.task === 'smoke' && b.status === 'sailing') st.lean = false;
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
        if (a.task === 'gut'){ st.task = 'gutw'; st.Tb = table;
          // (the new people, steg 125: a second gutter stands 0.55 to 0.7 m along the table from the first and worked at the table's middle all the
          // same: his hands 37 cm short of it, his knife and his fish in the first man. Each has the part of the table that is before him,
          // as far along it as the table goes (the plastic table 1.15 m, the steel bench from 10 m 1.60: HOLDT.table); one who stands past
          // its end guts the fish in his hands, standing free ('gut'))
          if (LEMMER.on){ const Tq = HOLDT.table, lat = (DW.table[0] - a.x) * R0[0] + (DW.table[2] - a.z) * R0[1], lim = (V.len || 0) >= 10 ? Tq.benk : Tq.bord, sft = clamp(lat, -lim, lim);
            if (Math.abs(lat - sft) > Tq.off){ st.task = 'gut'; st.Tb = null; } else if (Math.abs(sft) > 0.02) st.Tb = rel([DW.table[0] - R0[0] * sft, DW.table[1], DW.table[2] - R0[1] * sft]); }
          st.Ub = tubTop; st.Of = offal; const n = Math.floor((ta + idx * 1.7) / 5.6); st.gsp = held(hash(n * 3 + idx)); st.gkg = 2 + hash(n * 5) * 3;
          if (pkC){ st.Cr = rel(pkC.p); st.crTop = pkC.top; st.packId = pk.id; }
          // no packer on an open boat: he throws the gutted fish into the fish tub being filled himself (Jonas 04.11.2026)
          else if (tubs && tubs.length){ const ti = karFilling(vtype()); st.Cr = rel(tubs[ti].at); st.crTop = karTop(vtype(), ti); } }
        else if (a.task === 'pack'){ const C = crateOf(a); st.Cr = rel(C.p); st.crTop = C.top; st.crTub = C.tub; st.fill = ST.crateFill || 0; st.csp = i => packed(hash(i * 7 + 1)); const L = DKLAY[a.id]; st.lay = SJT && SJT.lay != null ? SJT.lay : L ? now - L.t : -1;   /* (the tests ask for the moment of the laying too, SJOBEIN.test.lay: tests/folk2maal.py) */
          // the ice bin on the side away from the gutter
          const gt = A.find(q => q.st === 'sloy' && q !== a); st.binR = gt && (gt.x - a.x) * R0[0] + (gt.z - a.z) * R0[1] < 0 ? 0.55 : -0.55;
          // the ice from the ice box that stands on deck (its ice's top), when it is within his reach
          const IB = iceBoxTop(vtype()); st.Bin = IB && Math.hypot(IB[0] - a.x, IB[2] - a.z) < 1.35 ? rel(IB) : null; }
        else if (a.task === 'egn' || a.task === 'strip'){ const PLs = CREW3D.places() || {tubs:[]}, T0 = PLs.tubs[(a.goal && a.goal.tub || 0) % 8]; if (T0) st.Tu = rel([T0[0], (PLs.tubY != null ? PLs.tubY : a.y) + 0.38, T0[1]]); { const Eg = LEMMER.on ? HOLDT.egn.at : [-0.12, 0, 0.38]; st.Bk = rel([a.x + R0[0] * Eg[2] + F0[0] * Eg[0], a.y + Eg[1], a.z + R0[1] * Eg[2] + F0[1] * Eg[0]]); }   /* (the new people: the bucket on an upturned box by his right knee, where his hand reaches it; on the deck behind his seat it was 31 cm out of his reach) */
          st.Of = rel([sg * ((G.beam || 3) / 2 + 1.4), -0.1, a.z]); if (a.task === 'strip' && ((t + idx * 3.1) % 25) < 2.2) DKGULL = [st.Of[0] + eye[0], (env.tide || 0), st.Of[2] + eye[2]]; }
        else if (a.task === 'mend') st.Nt = rel([a.x + F0[0] * 0.42, a.y + railH - 0.02, a.z + F0[1] * 0.42]);
        else if (a.task === 'jig' && !machines){ const rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; st.Rl = rel(rl); st.Wt = rel([rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]); } }
      if (a.sub && a.sub.carry === 'crate'){ st.crate = true; st.csp = i => packed(hash(i * 7 + 1)); if (a.mode === 'at') st.s = ST.clk - (a.sub.done - (a.sub.hold || 2)); }
      // (alone in the white room: only the one the eye is on, the others out of the way; Jonas 14.11.2026: «Du har også lov å fjerne
      // de andre fra mannskapet om de er i veien på bildene». The count goes on, so his beat is the same with and without them)
      if (cam.solo && cam.whoId != null && a.id !== cam.whoId){ idx++; continue; }
      drawWorker(P, st, eye, ta, idx++); }
    if (sjp0){ SJT.prof.ms += performance.now() - sjp0; SJT.prof.n += A.length; SJT.prof.f++; }
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
  // a riding sail the model carries as two parts of its own ('sail' set, 'sailf' furled on its boom; the havsjark, 01.11.2026): set at
  // sea, furled in port and in the yard's showroom (M5: no boat lies at the quay with her sail up)
  const SAILM = {};
  function sailOf(t){ if (!(t in SAILM)) SAILM[t] = typeof glbHas === 'function' && glbHas(t) && glbPart(t, 'sail') ? {set:upA(glbPart(t, 'sail')), furl:upA(glbPart(t, 'sailf'))} : null; return SAILM[t]; }
  function drawSail(t, M, set){ const sl = sailOf(t); if (!sl) return; const m = set ? sl.set : sl.furl; if (m) drawN(m, M); }
  // a cargo hatch's lid the model carries as its own part ('hatch', the autoliner, tools/boats/al45.py, H2d 05.11.2026): from its hinge
  // (anchors.hatch.hinge), turned about the boat's length up to anchors.hatch.open; k 0 shut, 1 open
  const HATCHM = {};
  function drawHatch(t, G, M, k){ if (!(t in HATCHM)) HATCHM[t] = typeof glbHas === 'function' && glbHas(t) && glbPart(t, 'hatch') ? upA(glbPart(t, 'hatch')) : null;
    const h = HATCHM[t], H = G && G.hatch; if (!h || !H || !H.hinge) return; drawN(h, chain(M, M4.T(H.hinge[0], H.hinge[1], H.hinge[2]), M4.RZ((H.open || 1.8) * (k || 0)))); }
  // a vessel's own deck crane as parts of its own (H2d2, 06.11.2026: the autoliner's forward crane, anchors.crane, tools/boats/al45.py
  // crane_parts): the slewing head turned about the column, the boom from its heel pin luffed as the pose asks ({a, el, hook}: the
  // slew about the slewing axis in the boat's frame, the boom's elevation, the hook's height; 09-landing-deck.js shipAim), and the hook block on its wire under the
  // tip. Without a pose the boom lies parked in its rest, the block hanging a metre under the tip. Returns the tip (boat frame)
  const SCRM = {}, SHIPCR = {pose:null, f:-9, tip:null};   // SHIPCR.pose: the landing's (09-landing-deck.js landScene), the frame before
  function shipCraneOf(t){ if (!(t in SCRM)) SCRM[t] = typeof glbHas === 'function' && glbHas(t) && glbPart(t, 'crane_boom') ? {head:upA(glbPart(t, 'crane_head')), boom:upA(glbPart(t, 'crane_boom')), block:upA(glbPart(t, 'crane_block'))} : null; return SCRM[t]; }
  function shipCraneAim(C, pose){
    const ax = C.axis, hl = C.heel, L = C.len, hy = hl[1] - ax[1], ho = Math.hypot(hl[0] - ax[0], hl[2] - ax[2]);
    let dx, dz, el; if (!pose){ const v = [C.park[0] - hl[0], C.park[1] - hl[1], C.park[2] - hl[2]], h = Math.hypot(v[0], v[2]) || 1; dx = v[0] / h; dz = v[2] / h; el = Math.atan2(v[1], h); }
    else { dx = Math.sin(pose.a); dz = Math.cos(pose.a); el = pose.el; }
    const c = Math.cos(el), s = Math.sin(el), H = [ax[0] + dx * ho, ax[1] + hy, ax[2] + dz * ho];
    return {dx, dz, c, s, heel:H, tip:[H[0] + dx * c * L, H[1] + s * L, H[2] + dz * c * L]};
  }
  function drawShipCrane(t, G, M, pose){
    const K = shipCraneOf(t), C = G && G.crane; if (!K || !C || !C.axis) return null; const A = shipCraneAim(C, pose), {dx, dz, c, s} = A, ax = C.axis;
    // (the head's -z, its boom's way, to the boom's heading; the boom's -z along the boom, its y square to it, its x across)
    drawN(K.head, chain(M, new Float32Array([-dz, 0, dx, 0, 0, 1, 0, 0, -dx, 0, -dz, 0, ax[0], ax[1], ax[2], 1])));
    drawN(K.boom, chain(M, new Float32Array([-dz, 0, dx, 0, -dx * s, c, -dz * s, 0, -dx * c, -s, -dz * c, 0, A.heel[0], A.heel[1], A.heel[2], 1])));
    const hk = pose ? pose.hook : A.tip[1] - (C.hang || 1); if (!GB) buildGear();
    drawN(GB.net, chain(M, limbM([A.tip[0], A.tip[1] - 0.15, A.tip[2]], [A.tip[0], hk, A.tip[2]], 0.012)));   // (the wire)
    drawN(K.block, chain(M, M4.T(A.tip[0], hk, A.tip[2]), M4.RY(Math.atan2(dx, dz))));
    return A.tip;
  }
  function drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named){
    const m = pvm(t, liv); if (!m) return; const P = people(); nSetup(VP); const wr = named && wearOn(t), lf = named && !BENCH.on && lifeOn('me', BMrel, null, t, HL.meAge, wr, bv.spd, G); drawN(named && !BENCH.on ? pvmHull(t, liv, ownTier(t, BMrel)) || m.hull : m.hull, BMrel); if (lf) lifeOff(); else if (wr) wearOff();
    drawSail(t, BMrel, named && S.boat && S.boat.status !== 'port'); drawHatch(t, G, BMrel, named ? hatchOpenK() : 0);
    { const tip = drawShipCrane(t, G, BMrel, named && FRAMEN - SHIPCR.f <= 2 ? SHIPCR.pose : null); if (named) SHIPCR.tip = tip; }   // (the landing's pose from the frame before)
    if (named && BENCH.on){ for (let j = 1; j < BENCH.k; j++) drawN(m.hull, BMrel);
      for (let i = 0; i < BENCH.n; i++){ const M = chain(BMrel, M4.T(((i % 4) - 1.5) * ((G.beam || 4) + 3), 0, (Math.floor(i / 4) + 1) * ((G.stern || 5) * 2 + 6))); drawN(m.hull, M); }
      BENCH.tris = Math.round(m.hull.n / 3) * (BENCH.k + BENCH.n); }
    const ds = onDeck && G.crewSpots && ncrew < G.crewSpots.length ? G.crewSpots[ncrew] : null;
    if (skipper && ds) drawN((named && ownPerson('skipDeck')) || P.skipDeck, chain(BMrel, M4.T(ds[0], ds[1], ds[2]), M4.RY(ds[3] || 0)));
    else if (skipper && G.skipperAt) drawN((named && ownPerson('skip')) || P.skip, chain(BMrel, M4.T(G.skipperAt[0], G.skipperAt[1], G.skipperAt[2])));
    for (let i = 0; i < ncrew && i < G.crewSpots.length; i++){ const c = G.crewSpots[i]; drawN((named && ownPerson('crew', i)) || P.crew, chain(BMrel, M4.T(c[0], c[1], c[2]), M4.RY(c[3] || 0))); }
    if (G.trawl) drawTrawl(t, G.trawl, BMrel, performance.now() / 1000);
    if (G.seine) drawSeine(t, G.seine, BMrel, VP, performance.now() / 1000);
    gl.disableVertexAttribArray(2);
    if (named && SK){ if (!S.unnamed) drawNames(t, BMrel, VP, liv, S.boatName, ownPort()); drawMark(t, BMrel, VP, liv); drawCall(t, BMrel, VP, liv); drawLogo(t, BMrel, VP, ...hullLogo()); }
    gl.useProgram(PL.p);
  }
  // the local fleet near you: the kit model nearest each boat (vessel3d.js npcKit), scaled to her length and beam, at lod 1 within
  // 300 m and lod 0.3 within 1.5 km (a detailed GLB model gives its near and simple versions), with the skipper in the wheelhouse and hands on deck when she fishes; further out the box models
  const NKM = {};
  // a detailed model from tools/boats is near only within 150 m: many of the local fleet share it, and a tablet draws them all
  // a fishing NPC's model by her length and beam (FLEET's, and the coast's from tools/map/npc.py): the buffers by model, lod and livery,
  // the scale by boat
  // another player's boat is her own type's model (Jonas 05.10.2026: a friend in the same old wooden boat showed as a white box boat)
  // the coast guard's ship (steg 100, tools/boats/kv.py) is her own model too, kv47 or kv90 (kvNpcs' vtype), not in VESSELS: she cannot be
  // bought; until her model is in she is the kit's boat of her size, as before. She is drawn near out to 500 m (there is only one of her,
  // her near model is 28-36 thousand triangles, and the 93 m ship lies 180 m off the vessel she inspects)
  // the ferries, the express boats, the passenger ferries and the coastal route's ships (Ø15 N7, steg 36, tools/ships/) are their own
  // models, chosen by the vessel's fields and never her name: a car ferry by her length, the size class nearest it (34, 64 and 112 m,
  // core/05b-ferje.js FERJE_SIZE; the bounds the geometric means between them, so Senja's 49.9 m ferry is the 64 m one), an express boat (ex 1) the catamaran, a passenger ferry (ex 2) the monohull, a coastal ship (type 'coastal') the route's
  // ship; each scaled to her own length and beam as the fleet is (npcMesh). Near (the GLB's lod0) within 500 m, the simple version (lod1)
  // out to 1.5 km, the old boxes (19-wildlife-npc.js N.ferry, N.coastal) beyond, and the boxes too until the models are in
  // the merchant ships (N5's traffic, steg 37; the models from the second part of N7) by their type: cargo, tanker, cruise. Their
  // models are in tools/ships/ and src/data/ship-last, ship-tank, ship-cruise; the page has them once N5 adds their lines to
  // src/index.html, and until then (glbHas false) they are the scaled ferry box like a ferry beyond 1.5 km
  const SHIPM = {coastal:'ship-kystrute', cargo:'ship-last', tanker:'ship-tank', cruise:'ship-cruise'};
  const SHIPTY = {ferry:1, coastal:1, cargo:1, tanker:1, cruise:1};   // (the types drawn as ships: steady in the sea, the box scaled to them)
  const shipT = n => { if (!SHIPTY[n.type]) return null;
    const t = SHIPM[n.type] || (n.ex === 1 ? 'ship-hurtig' : n.ex === 2 ? 'ship-passasjer' : !(n.L > 0) ? null : n.L < 46.6 ? 'ship-ferje34' : n.L < 84.7 ? 'ship-ferje64' : 'ship-ferje112');
    return t && glbHas(t) ? t : null; };
  // the coast's fishing boats by their main gear (N7's second part, 12.11.2026): the register's gear of each boat (flaate.json, the boat
  // npcStates read; read here by her id, as npcStates' entry does not carry it), and the model that shows that gear where there is one
  // for her length (tools/ships/: snurrevad, not, tral, teine, autoline); the net, jig and short line boats, and every boat whose gear
  // has no model, are the player's boat nearest her length and beam as before (npcKit). By the vessel's fields, never her name.
  const NGEAR = new Map();
  function npcGear(n){
    if (n.mainGear) return n.mainGear; if (!n.coast || typeof VEC === 'undefined') return null;   // (npcStates carries it, core/05-vessels.js; the lookup below for an entry without it)
    const k = n.id + '|' + n.L, c = NGEAR.get(k); if (c !== undefined) return c;
    // (two boats can share a berth and so its id, flaate.json's «shared»: the one of her length; two of the same length on one berth get
    // the first one's gear, a picture's error only. A boat that is not the register's (a trip's, the coast guard's) has none, kept so)
    const m = /^c(-?\d+):(-?\d+)\.(\d+)\./.exec(String(n.id)), keep = g => { if (NGEAR.size > 4000) NGEAR.clear(); NGEAR.set(k, g); return g; };
    if (!m) return keep(null);
    const t = VEC.tiles.get(m[1] + ':' + m[2]); if (!t) return null;   // (the tile not in yet: asked again)
    const h = t.npc && t.npc[+m[3]], b = h && h.boats && (h.boats.find(q => q.id === n.id && q.L === n.L) || h.boats.find(q => q.id === n.id));
    return keep(b ? b.gear || null : null);
  }
  const GEARM = [['snurrevad', 'ship-snurrevad', 8, 99], ['not', 'ship-not', 8, 99], ['tral', 'ship-tral', 8, 99], ['teine', 'ship-teine', 7, 13], ['line', 'ship-autoline', 13, 99]];
  function npcGearT(n){ if (!n.coast || n.player) return null; if (n._gT !== undefined) return n._gT;   // (once per boat's entry: asked several times a frame)
    const g = npcGear(n); if (!g) return null; let r = null;
    for (const [k, t, a, b] of GEARM) if (g === k && n.L >= a && n.L < b){ r = glbHas(t) ? t : null; break; }
    return n._gT = r; }
  // the summer's leisure boats (N6's traffic, steg 38; the models from N7's second part): a motor boat and a sailing boat by their type,
  // drawn as the fleet is (the kit's list: the sailing boat's sails set at sea and furled in port, drawSail); the page has them once N6
  // adds their lines to src/index.html
  const LEISM = {fritid:'ship-fritid', seil:'ship-seil'};
  const leisT = n => LEISM[n.type] && glbHas(LEISM[n.type]) ? LEISM[n.type] : null;
  const npcType = n => (n.player || n.hav) && SPEC3D[n.vtype] ? n.vtype : n.kv && n.vtype && glbHas(n.vtype) ? n.vtype : shipT(n) || npcGearT(n) || leisT(n) || npcKit(n.L, n.B);   // the ocean fleet (05d-hav.js) as their own kind too
  const NKN = {}; function npcNear(n){ if (!n.player && shipT(n)) return 500; if (npcGearT(n) || leisT(n)) return 300; const k = n.player ? 'p|' + n.vtype : n.kv ? 'kv' : n.L + '|' + n.B; if (!(k in NKN)) NKN[k] = n.kv ? 500 : glbHas(npcType(n)) ? 150 : 300; return NKN[k]; }   // (a gear model is some 4 000 triangles: near within 300 m as the kit's own)
  const NKB = {};
  // a model's buffers by type, lod and livery (npcMesh and npcWarm). Another player's by her paint only (TP1, steg 108: vessel3d.js
  // livPaint; her flag, mark and logo are drawn over it), so boats painted alike share them, and one with nothing painted shares the
  // local fleet's unpainted model (0). The painted ones (NKBP.n) are held up to NKBP.cap: past it, the one longest out of use (not drawn
  // for NKBP.idle s) is let go, its buffers deleted and its model (vessel3d.js NPCMOD) with it; never one still in use, so every boat
  // in view keeps her paint. NKBP counts what is made, let go and sent to the GPU (G3._debug.npcBufs)
  const spX = liv => typeof liv === 'string' && typeof spPaintIn === 'function' && spPaintIn(liv) ? '|x' : '';   // (a partner's design found in the list or not: steg 44, as vessel3d.js npcModel)
  const NKBP = {n:0, cap:12, idle:20, made:0, dropped:0, bytes:0, up:0};   // (bytes: the painted models alive; up: all the painted ever sent)
  const LPM = new Map(), nkbLiv = liv => { if (typeof liv !== 'string') return liv; let v = LPM.get(liv); if (v === undefined){ if (LPM.size > 256) LPM.clear(); v = livPaint(liv) || 0; LPM.set(liv, v); } return v; };
  const nkbKey = (t, lod, liv) => { const lp = nkbLiv(liv); return t + '|' + lod + '|' + lp + spX(lp); };
  function npcKB(t, lod, liv){ const lp = nkbLiv(liv), k = nkbKey(t, lod, liv);
    if (!(k in NKB)){ const G = VESSELS[t] ? null : glbLoad(t), m = VESSELS[t] ? npcModel(t, lod, lp) : glbModel(t, lod, G && G.ex.anchors && G.ex.anchors.liv && typeof lp === 'number' && LIVERY[lp % LIVERY.length] ? {hull:LIVERY[lp % LIVERY.length].hull} : null), up = o => ({pb:buf(asF32(o.p)), nb:buf(asF32(o.n)), cb:buf(asF32(o.c)), n:o.p.length / 3}); NKB[k] = m ? {t, lod, hull:up(m.o), glass:lod >= 1 && !(m.geo && m.geo.ship) ? up(m.glass) : null, geo:m.geo} : null;   // (a ship's windows are in her hull: no glass drawn)
      const B = NKB[k]; if (B && typeof lp === 'string'){ const by = (B.hull.n + (B.glass ? B.glass.n : 0)) * 36; B.peer = {k, mk:npcModelKey(t, lod, lp), by, used:performance.now()}; NKBP.n++; NKBP.made++; NKBP.bytes += by; NKBP.up += by; nkbCap(); } }   // (36: position, normal and colour, three floats each)
    const B = NKB[k]; if (B && B.peer) B.peer.used = performance.now(); return B; }
  function nkbCap(){
    while (NKBP.n > NKBP.cap){ let old = null; const now = performance.now();
      for (const kk in NKB){ const B = NKB[kk]; if (B && B.peer && now - B.peer.used > NKBP.idle * 1000 && (!old || B.peer.used < old.peer.used)) old = B; }
      if (!old) return;
      for (const kk in NKM) if (NKM[kk] && NKM[kk].hull === old.hull) delete NKM[kk];   // (the boats' own views of it)
      for (const q of [old.hull, old.glass]) if (q) for (const b of [q.pb, q.nb, q.cb]) gl.deleteBuffer(b);
      delete NKB[old.peer.k]; npcModelDrop(old.peer.mk); NKBP.n--; NKBP.dropped++; NKBP.bytes -= old.peer.by; }
  }
  function npcMesh(n, lod){
    const kk = n.id + '|' + (n.coast ? n.L + '|' : '') + lod + '|' + (n.player ? n.vtype + '|' + n.liv + spX(n.liv) : n.kv ? npcType(n) : SHIPTY[n.type] || LEISM[n.type] ? npcType(n) + '|' + n.L + '|' + n.B : n.coast ? npcGearT(n) || '' : ''); if (kk in NKM){ const e = NKM[kk]; if (e && e.peer) e.peer.used = performance.now(); return e; }   // (a painted model in use is not let go, nkbCap)   // (a coast boat's gear model once it is read in)   // a player's repaint is a new key (and the coast guard's other ship)
    const t = npcType(n), B = npcKB(t, lod, n.liv || 0); if (!B) return NKM[kk] = null;
    const V = VESSELS[t] || (GLBM[t] && GLBM[t].ex) || {len:n.L, beam:n.B}, sx = n.B / V.beam, sz = n.L / V.len, sy = (sx + sz) / 2;
    return NKM[kk] = Object.assign({}, B, {sv:[sx, sy, sz], S:new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])});
  }
  let npcNow = [];
  // The local fleet's models made before they are seen (Ø3c, 09.11.2026): the first time a type came within 1.5 km it was read and
  // built in that frame, 25-171 ms with the CPU throttled 4x (the Blender models; 3d-verden.md 4.11o). From 4 s after the start, the
  // boats within 5 km whose model at the level they are first drawn at (0.3) is not made, and then those within 1.5 km at the near
  // level, are made one step at a time when the browser is idle (requestIdleCallback; within a second where it never is): the model
  // read from its bytes (glbLoad) in one step, built and sent to the GPU in the next, so no frame has both, and no type is built in the
  // frame it comes into view. The same models and buffers as npcMesh makes (npcKB), only sooner. NWARM.n counts the steps (the tests).
  const NWARM = {t0:0, busy:false, n:0};
  function npcWarm(eye){
    if (NWARM.busy || !ready) return; const now = performance.now(); if (!NWARM.t0) NWARM.t0 = now; if (now - NWARM.t0 < 4000) return;
    let best = null, bd = Infinity;
    for (const n of npcNow){ if (!(n.fleet || n.coast || n.player || n.hav || shipT(n) || leisT(n))) continue; const d = Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) / ZF();
      for (const [lod, r] of [[0.3, 5000], [1, 1500]]){ if (d > r || d + (lod === 1 ? 5000 : 0) >= bd) continue; const t = npcType(n);
        if (nkbKey(t, lod, n.liv || 0) in NKB) continue;
        if (typeof nkbLiv(n.liv || 0) === 'string' && NKBP.n >= NKBP.cap) continue;   // (a painted model is made ahead only under the cap, so the cap never lets go of what this makes again)
        best = {t, lod, liv:n.liv || 0}; bd = d + (lod === 1 ? 5000 : 0); } }
    if (!best) return;
    NWARM.busy = true; const idle = window.requestIdleCallback || (f => setTimeout(f, 50));
    idle(() => { try { if (!ready) return; NWARM.n++;
      if (glbHas(best.t) && !(best.t in GLBM)){ glbLoad(best.t); return; }   // the read, one step
      npcKB(best.t, best.lod, best.liv); } catch (e){ console.error(e); } finally { NWARM.busy = false; } }, {timeout:1000});
  }
  // the seine's places on a model (its own from the GLB, not75.py; else made from the hull's: the stern, the starboard side amidships,
  // the hauler or power block, as on the 38 m seiner, ringnot38.py, which has none of its own)
  const SANCH = new WeakMap();
  function seineAnch(G){
    if (G.seine) return G.seine; let A = SANCH.get(G); if (A) return A;
    const gw = G.gw != null ? G.gw : 2, hb = typeof G.side === 'number' ? G.side : (G.beam || 8) / 2, z0 = G.deck && G.deck.z != null ? G.deck.z : 0, bl = Array.isArray(G.hauler) ? G.hauler : [hb - 1, gw + 6, z0];
    A = {stern:[0, gw, G.stern || 15], side:[hb, 0, z0], block:bl, bin:[hb - 2.5, gw + 0.5, bl[2] + 2], purse:[hb, gw + 1.5, z0 - 3]}; SANCH.set(G, A); return A;
  }
  const NPCTOW = {lo:1, ro:1, net:1, cod:1, full:false, tow:true};
  // the other boats' clock: the simulation's minute and the time since, not held at 0.999 of the minute as currentFrac is (the minute
  // is stepped by the 200 ms tick, so the boats stood still for up to a fifth of a second every ten seconds), and never back by a hair
  // (the tick's step and the world's clock agree to the millisecond, not better); a real jump (a catch-up, a new game) is taken as it is
  const NPCK = {H:-1};
  function npcClock(Hf){
    const f = clamp(acc + (Date.now() - lastWall) / 1000 * simRate() / 60, 0, 3), H = (S.t + f) / 60;
    if (!isFinite(H)) return Hf;
    NPCK.H = H < NPCK.H && NPCK.H - H < 0.5 / 60 ? NPCK.H : H; return NPCK.H;
  }
  // the heading each boat is drawn with turns to her own over about half a second, so she does not snap round at a corner of her route
  // or between a drift and the run back up (core/05-vessels.js fleetState, coastState); where she is stays exact
  const NPCH = new Map();
  function npcHead(n, t){
    const E = NPCH.get(n.id), h = n.hd;
    if (!E || t - E.t > 1 || t < E.t){ NPCH.set(n.id, {hd:h, t}); return h; }
    const d = angDiff(E.hd, h), k = 1 - Math.exp(-(t - E.t) / 0.45);
    E.hd = Math.abs(d) > 2.6 ? h : E.hd + d * k; E.t = t;   // (turned about where she lies: at once)
    if (NPCH.size > 400) for (const [id, e] of NPCH) if (t - e.t > 30) NPCH.delete(id);
    return E.hd;
  }
  // the boats of the coast, the local fleet, the coastal ship and the ferry move like boats (Jonas 03.11.2026: «NPC-båter også må oppføre
  // seg realistiske»): where the clock puts them (core/05-vessels.js) is a line with corners and a speed that is there at once; drawn,
  // each boat's velocity follows that line's over NPCV_T s, so she gathers way and loses it gradually and turns on an arc (a few tens of
  // metres at the screen's pace) instead of on the spot, and is pulled back onto her place over NPCP_T s, so she never strays from it
  // (more than NPCF_SNAP m, a new boat or one out of sight a while: put there). She heads where she goes once she has way on (a drifting
  // boat lies as the clock has her), and heels out of a turn. The chart and the AIS keep the exact place.
  const NPCF = new Map(), NPCV_T = 0.6, NPCP_T = 2, NPCF_SNAP = 80;
  function npcFollow(n, t){
    const X = n.p.x * 1000, Z = n.p.y * 1000; let E = NPCF.get(n.id);
    const dt = E ? t - E.t : 0;
    if (!E || dt > 1 || dt < 0 || Math.hypot(X - E.x, Z - E.z) > NPCF_SNAP){ E = {x:X, z:Z, vx:0, vz:0, px:X, pz:Z, t, w:0}; NPCF.set(n.id, E); if (NPCF.size > 400) for (const [id, e] of NPCF) if (t - e.t > 30) NPCF.delete(id); return E; }
    if (dt < 1e-4) return E;
    const tvx = (X - E.px) / dt, tvz = (Z - E.pz) / dt, kv = 1 - Math.exp(-dt / NPCV_T), kp = 1 - Math.exp(-dt / NPCP_T);
    const h0 = Math.atan2(E.vx, -E.vz), s0 = Math.hypot(E.vx, E.vz);
    E.vx += (tvx - E.vx) * kv; E.vz += (tvz - E.vz) * kv;
    E.x += E.vx * dt; E.z += E.vz * dt; E.x += (X - E.x) * kp; E.z += (Z - E.z) * kp;
    const s1 = Math.hypot(E.vx, E.vz); E.w = s0 > 1 && s1 > 1 ? angDiff(h0, Math.atan2(E.vx, -E.vz)) / dt : 0;   // her turn rate (rad/s)
    E.px = X; E.pz = Z; E.t = t; return E;
  }
  // A car ferry is double-ended (Ø15 N7, steg 36: tools/ships/ferje34.py, lukketferje.py): she does not turn at the quay. The clock
  // (core/05b-ferje.js ferjeAt) has her lie with her bow in and turns her heading half round when she leaves; a ferry model is the same
  // at both ends but not on both sides (the small one's saloon to one side, the middle one's funnel), so drawn by that heading her saloon
  // jumped across at every departure (found by the step's check). Each car ferry keeps whether she is drawn the other way round: the
  // clock's heading turning more than 150° at once flips it, and her model is drawn turned half round, so she goes on with her other end
  // first and nothing moves; her lanterns are turned back to the way she goes (drawNPCLights, n.rev). The boxes beyond 1.5 km as before.
  const NPCREV = new Map();
  function npcRev(n){
    const E = NPCREV.get(n.id), h = n.hd; if (!E){ NPCREV.set(n.id, {h, rev:false}); return false; }
    if (Math.abs(angDiff(E.h, h)) > 2.6) E.rev = !E.rev; E.h = h;
    if (NPCREV.size > 800) NPCREV.clear();
    return E.rev;
  }
  // a boat's own phase for her rocking (0 to 2π, fixed by her id)
  const NPHS = new Map();
  const NPCFS = new Map();   // the ferry box's scale by length and beam (drawNPC)
  function npcPhase(id){ let p = NPHS.get(id); if (p == null){ p = (lookHash(String(id)) % 6283) / 1000; if (NPHS.size > 2000) NPHS.clear(); NPHS.set(id, p); } return p; }
  // the coast guard's ship on her inspection (core/09j-kystvakt.js kvNpcs, steg 100): her model, the skipper on her bridge and two hands
  // on deck, and at sea her RIB (the GLB's part 'rib', V2 A) through kvRib's stages over the game's minutes: lowered from the starboard
  // davit to the water under it, across to the vessel, alongside its port side while the inspectors are aboard, back, hoisted in
  const KVRB = {};   // the RIB's buffers by the ship's type
  function kvDraw(n, eye, t){
    const K = n.K, G = K.geo || {}, M = chain(n.M, K.S), sv = K.sv || [1, 1, 1], at = (p, r) => chain(n.M, M4.T(p[0] * sv[0], p[1] * sv[1], p[2] * sv[2]), M4.RY(r || 0));   // (the people placed, not scaled: the kit's boat in her place is stretched to her size)
    drawN(K.hull, M);
    if (!K.glass) return;
    if (G.skipperAt) drawN(npcPerson('skip', n), at(G.skipperAt));
    (G.crewSpots || []).slice(0, 2).forEach((c, i) => drawN(npcPerson('crew', {id:'kv' + i}, i), at(c, c[3])));
    if (n.rib && G.rib) kvRibDraw(n, G.rib, G, M, eye, t);
  }
  function kvRibDraw(n, R, G, M, eye, t){
    if (!(n.vtype in KVRB)){ const o = typeof glbPart === 'function' ? glbPart(n.vtype, 'rib') : null; KVRB[n.vtype] = o ? upA(o) : null; }
    const RB = KVRB[n.vtype]; if (!RB) return;
    const st = kvRib(S.t + (typeof currentFrac === 'function' ? currentFrac() : 0) - n.rib.t0), sm = u => u * u * (3 - 2 * u);
    const wy = (x, z) => (typeof seaH === 'function' ? seaH(x + eye[0], z + eye[2], t) : (env.tide || 0)) - eye[1];
    const C = xf(M, R.at), W0 = xf(M, [(G.side || 8) + (R.B || 3) / 2 + 1.2, 0, R.at[2]]), W = [W0[0], wy(W0[0], W0[2]), W0[2]];
    // alongside the vessel's port side, as the 3D view has her (bv), her half-beam and a little water between
    const hb = (GEO(vtype()).beam || (VESSELS[vtype()] || {}).beam || 4) / 2 + (R.B || 3) / 2 + 0.6, sx = Math.cos(bv.head), sz = Math.sin(bv.head);
    const T0 = [bv.x - sx * hb - eye[0], 0, bv.z - sz * hb - eye[2]], T = [T0[0], wy(T0[0], T0[2]), T0[2]];
    const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    let p = C, hd = n.hd, water = false;
    if (st.ph === 'ned' || st.ph === 'opp'){ const u = st.ph === 'ned' ? st.f : 1 - st.f, top = [W[0], C[1], W[2]]; p = u < 0.4 ? lerp(C, top, sm(u / 0.4)) : lerp(top, W, sm((u - 0.4) / 0.6)); }
    else if (st.ph === 'ut' || st.ph === 'inn'){ const u = sm(st.f), a = st.ph === 'ut' ? W : T, b = st.ph === 'ut' ? T : W; p = lerp(a, b, u); p[1] = wy(p[0], p[2]); water = true;
      hd = Math.atan2(b[0] - a[0], -(b[2] - a[2])); if (st.f > 0.85) hd += angDiff(hd, st.ph === 'ut' ? bv.head : n.hd) * (st.f - 0.85) / 0.15; }
    else if (st.ph === 'side'){ p = T; hd = bv.head; water = true; }
    const roll = water ? Math.sin(t * 1.3 + 0.7) * 0.04 * (0.3 + WV.hs) : 0, pitch = water ? Math.sin(t * 1.1) * 0.03 * (0.3 + WV.hs) : 0;
    const Mr = model(p[0], p[1], p[2], -hd, pitch, roll); drawN(RB, Mr);
    if (st.ph !== 'davit' && R.cox){ const c = R.cox; drawN(npcPerson('skip', {id:'kvrib'}), chain(Mr, M4.T(c[0], c[1], c[2])));
      // the two inspectors on the jockey seats going over and back; alongside they are aboard the vessel
      if (st.ph !== 'side') for (const [i, dx] of [[0, -0.45], [1, 0.45]]) drawN(npcPerson('crew', {id:'kvi' + i}, i), chain(Mr, M4.T(dx, c[1], c[2] + 0.9))); }
  }
  // the other boats of this frame, worked out once (Ø3b, 10.11.2026): the far pass (24-cinema.js) and drawNPC each asked npcStates,
  // the dearest of the frame's own JavaScript in a harbour (1.5 of 9.8 ms a frame on a PC at Tromsø, each time), the far pass by the
  // frame's clock and drawNPC by the boats' own (npcClock), so a boat both passes drew stood in two places while the minute was held.
  // Now both draw her where the boats' clock has her.
  const NPCFR = {f:-1, H:0, v:[]};
  function npcFrame(H){ if (NPCFR.f !== FRAMEN){ NPCFR.f = FRAMEN; NPCFR.H = npcClock(H); NPCFR.v = npcStates(NPCFR.H); } return NPCFR; }
  function drawNPC(eye, t, H, VP){
    if (!NPCM) return;
    { const F = npcFrame(H); H = F.H;
    npcNow = F.v.filter(n => !n.rs && Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000); }   // the rescue boat has her own model (RB)
    const kit = [], kvl = [], shl = [];
    // (a test camera following a boat of the fleet, G3.npcLook: aimed at her and from astern of her as she goes)
    if (SIGNV.npc){ const f = npcNow.find(q => q.id === SIGNV.npc.id); if (f){ SIGNV.look = [f.p.x * 1000, (env.tide || 0) + 3, f.p.y * 1000]; cam.yaw = f.hd + SIGNV.npc.off - bv.head; } }
    for (const n of npcNow){
      // a boat on your tow line (core/09g-turer.js): placed astern of your boat as the view shows her, 30 m of line from your stern
      // to her bow, so she follows smoothly between the simulation's minutes
      if (n.tur && n.st === 'tow' && bv.init){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; }
      // towing between players (ui/10o-ptow.js): the player's boat in your tow astern of you, or the one towing you ahead, on the same 30 m of line
      n.ptow = null;
      if (n.player && bv.init && S.ptowH && S.ptowH.st === 'tow' && n.id === S.ptowH.pid){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'tail'; }
      else if (n.player && bv.init && S.ptow && S.ptow.st === 'tow' && n.id === S.ptow.pid){ const fwd = -(GEO(vtype()).bow || -3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x + Math.sin(bv.head) * fwd) / 1000, y:(bv.z - Math.cos(bv.head) * fwd) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'head'; }
      const rv = n.type === 'ferry' && !n.ex && !n.player ? npcRev(n) : false;   // (the clock's own heading, before the drawing's turns)
      let heel = 0;
      if (!n.player && !n.ptow && !(n.tur && n.st === 'tow')){
        const F = npcFollow(n, t), sp = Math.hypot(F.vx, F.vz), k = clamp((sp - 1) / 2, 0, 1);   // (m/s on the screen)
        n.p = {x:F.x / 1000, y:F.z / 1000};
        if (k > 0) n.hd = n.hd + angDiff(n.hd, Math.atan2(F.vx, -F.vz)) * k;
        heel = clamp(-F.w * sp * 0.012, -0.12, 0.12) * (SHIPTY[n.type] ? 0.3 : 1);
      }
      if (!n.ptow && !(n.tur && n.st === 'tow')) n.hd = npcHead(n, t);
      // (the rocking's phase is the boat's own, from her id: it was her place in metres, so a boat under way at the game's pace, tens of
      // metres a second on the screen, pitched and rolled several times a second, a shudder; Jonas' video 03.11.2026)
      const x = n.p.x * 1000, z = n.p.y * 1000, ph = npcPhase(n.id), big = SHIPTY[n.type] || n.kv, y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = heel + (big ? Math.sin(t * 0.4 + ph) * 0.01 : Math.sin(t * 1.1 + ph) * 0.05 * (0.3 + WV.hs));
      const d = Math.hypot(x - eye[0], z - eye[2]); n.K = (n.fleet || n.coast || n.player || n.hav || shipT(n) || leisT(n)) && d / ZF() < 1500 * QUAL.lodK[QUAL.lvl] ? npcMesh(n, d / ZF() < npcNear(n) * QUAL.lodK[QUAL.lvl] ? 1 : 0.3) : null;
      n.rev = !!(rv && n.K);   // a double-ended ferry's model drawn the other way round (npcRev), her heel with it
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -(n.hd + (n.rev ? Math.PI : 0)), big ? 0 : Math.sin(t * 0.9 + ph * 1.7) * 0.03, n.rev ? -roll : roll);
      // beyond the ship models' 1.5 km (or before they are in) a ferry, an express boat or a passenger ferry is the one ferry box (N.ferry,
      // 52 × 13 m) scaled to her own length and beam (N4, 12.11.2026: a passenger ferry of 20 m drawn 52 m long stuck 8 m into the quay);
      // her lanterns go with it (they are placed by n.M)
      // (a merchant ship, N5, the same until she has a box of her own)
      // (and a leisure boat, N6, the sjark box, 10.5 × 3.8 m, scaled to her the same way)
      if (!n.K && (n.type === 'ferry' || (SHIPTY[n.type] && !NPCM[n.type]) || LEISM[n.type]) && n.L){ const sb = LEISM[n.type] ? [3.8, 10.5] : [13, 52], k = NPCFS.get(n.L * 100 + n.B + (LEISM[n.type] ? 0.5 : 0)) || (() => { const sx = n.B / sb[0], sz = n.L / sb[1], sy = clamp((sx + sz) / 2, 0.5, 1.5), S = new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]); NPCFS.set(n.L * 100 + n.B + (LEISM[n.type] ? 0.5 : 0), S); return S; })(); n.M = chain(n.M, k); }
      if (n.K) (n.kv ? kvl : n.K.geo && n.K.geo.ship ? shl : kit).push(n); else drawLit(NPCM[n.type] || (SHIPTY[n.type] ? NPCM.ferry : NPCM.sjark), n.M);
    }
    npcWarm(eye);
    if (!kit.length && !kvl.length && !shl.length) return;
    const P = people(); nSetup(VP);
    for (const n of kvl) kvDraw(n, eye, t);
    for (const n of shl) drawN(n.K.hull, chain(n.M, n.K.S));   // a ship: her hull and house (the windows are in it, no crew drawn)
    for (const n of kit){ const K = n.K, G = K.geo, at = (p, r) => chain(n.M, M4.T(p[0] * K.sv[0], p[1] * K.sv[1], p[2] * K.sv[2]), M4.RY(r || 0));
      const lf = lifeOn(n.id, n.M, K.sv, K.t, npcAge(n), false, n.st === 'fishing' || n.st === 'port' ? 0 : 4, G); drawN(K.hull, chain(n.M, K.S)); if (lf) lifeOff(); drawSail(K.t, chain(n.M, K.S), n.st !== 'port'); drawHatch(K.t, G, chain(n.M, K.S), 0); drawShipCrane(K.t, G, chain(n.M, K.S), null);
      // an ocean trawler towing (05d-hav.js): her trawl out astern as yours is when towing
      if (n.trawl && G && G.trawl) drawTrawl(K.t, G.trawl, chain(n.M, K.S), performance.now() / 1000, NPCTOW);
      // a purse seiner or Danish seiner setting or hauling (05d-hav.js havFish): her seine on the sea by the clock's stage
      if (n.seine && G) drawSeine(K.t, seineAnch(G), chain(n.M, K.S), VP, performance.now() / 1000, n.seine);
      if (!K.glass) continue;
      drawNPCAnchor(n, K);   // her anchors stowed in their roller or hawse, as on your own boat
      if (npcCrewDraw(n, K, eye, t)) continue;   // her people walk her deck like yours (deckcrew.js crewSim)
      if (n.st !== 'port') drawN(npcPerson('skip', n), at(G.skipperAt));
      if (n.st === 'fishing') for (let i = 0; i < 2 && i < G.crewSpots.length; i++) drawN(npcPerson('crew', {id:String(n.id) + i, player:n.player, lk:n.lk, ck:n.ck}, i), at(G.crewSpots[i], G.crewSpots[i][3]));
    }
    drawNPCNames(kit, VP); drawPeerFlags(kit, VP, t, H);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the agents of another boat within the near LOD (deckcrew.js crewSim, one per boat, dropped when she has been out of sight a
  // minute): the same walking people as on your own boat, in her model's frame scaled to her size; false when her model has no deck map
  const NCREW = new Map();
  function npcCrewDraw(n, K, eye, t){
    if (typeof crewSim !== 'function' || !K.geo || K.geo.hand) return false;
    const type = K.t, nk = n.coast ? n.id + '|' + n.L : n.id; let E = NCREW.get(nk);   // (two of the coast's boats can share an id: hers by her length too)
    if (!E || E.type !== type){ const st = {n}; E = {type, st, t:0, sim:crewSim({type:() => type, ctx:G => npcCrewCtx(st.n, G), seed:1 + (lookHash(String(n.id)) % 1000)})}; NCREW.set(nk, E); }
    E.st.n = n; const gap = t - E.t; E.t = t; const sim = E.sim; if (!sim.on()) return false;
    if (gap > 5) sim._st.lastSim = null;   // out of sight a while: everyone straight to their place
    sim.tick(Math.min(0.1, Math.max(0, gap)));
    const G = K.geo, sv = K.sv, h0 = n.hd, DN = deckN(n.M); let idx = 40 + (lookHash(String(n.id)) % 50);
    for (const a of sim.visible()){
      const lp = a.mode === 'helm' && G.skipperAt ? G.skipperAt : [a.x, a.y, a.z], wl = xf(n.M, [lp[0] * sv[0], lp[1] * sv[1], lp[2] * sv[2]]), wy = wl[1] + eye[1];
      const look = npcLook(a.me ? 'skip' : 'crew', n, a.c ? (a.c.id.endsWith('1') ? 1 : 0) : 0);
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look};
      // (her people have the sea legs too where she rolls in the drawing, FB4: n.M is her frame with her roll and pitch)
      drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:h0 + (a.mode === 'helm' ? 0 : a.h), task:a.task, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0, dn:DN, sea:n.st === 'port' ? null : seaSet(sim, a, n.M)}, eye, t, idx++); }
    if (NCREW.size > 24) for (const [id, e] of NCREW) if (t - e.t > 60) NCREW.delete(id);
    return true;
  }
  // the look of a person on another boat: a player's as she sent it (lk, ck), a local boat's from its id (as npcPerson)
  const npcLook = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, l = code && lookFromKey(code); if (l) return l; }
    const h = lookHash(String(n.id)) % 12; return lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea');
  };
