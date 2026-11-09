  // ---------- boat motion ----------
  function currentFrac(){ return clamp(acc + (wallNow() - lastWall) / 1000 * simRate() / 60, 0, 0.999); }
  function predict(frac){
    const L = livePose(frac), b = S.boat; let hd = L.hd;
    if (b.status === 'port' || b.status === 'unmooring'){ const bp = berthNow(); if (bp) return {p:{x:bp.x, y:bp.y}, hd:bp.hd}; const pt = portById(b.port); hd = Math.atan2(pt.coast.x - pt.p.x, -(pt.coast.y - pt.p.y)); }
    return {p:L.p, hd};
  }
  // the boat in 3D follows the simulated track like a real boat: it speeds up and slows down gradually, turns on an arc,
  // pivots about a point a third of its length from the bow (so the stern swings out), skids a little in turns and banks
  const KNV = () => 1852 / 3600 * simRate();      // on-screen metres per real second per knot (real time with the hand on the helm)
  // ---------- along the route (Jonas 06.10.2026: «båten strengt må følge rutestreken som lages i kartplotteren», «Svingingen kan være
  // litt smooth akkurat der båten endrer kurs, men det må være ganske nøyaktige kursendringer», «båten må stoppe på nøyaktig den plassen
  // siste endepunkt er … at den slakker av og stopper nøyaktig der den skal», and «Stopp» underway the same, not all at once) ----------
  // One line in metres: out from the quay she lies at (core berthPath, astern first), the route's waypoints as the chart plotter draws
  // them, and in to the quay where the route ends. She runs along it at the simulation's speed, catching up when she is behind (the
  // simulation starts at the harbour point), not ahead of it, and brakes to stand exactly on every stop she has not been let past: the
  // end, a fishing ground, a set to work. The simulation is on the same line, so the chart, the simulation and the 3D boat agree. The
  // corners are rounded over TRK_R metres either side. A new or changed route starts a new line from where she is, keeping her way.
  // (It replaced a follower that steered for a point ahead with the boat's turning radius: in a narrow harbour it cut the corners, and
  // its own 45 s way out and 60 s way in left her lying at the plant's quay in Senjahopen while the trip to the rorbu was long done.)
  let TRK = null;
  const TRK_R = 6;
  const trkSig = pl => pl.wps.length + ':' + pl.wps.map(w => w.x.toFixed(5) + ',' + w.y.toFixed(5) + (w.port || '')).join(';');
  function trkBuild(pl, dep){
    const vt = vtype(), P = [], wpAt = [];
    const add = (x, z) => { const q = P[P.length - 1]; if (!q || Math.hypot(q[0] - x, q[1] - z) > 0.3) P.push([x, z]); };
    let back = 0, hd0 = null, endBp = null;
    let iOut = 0;
    // (from Father's naust straight out to the route's first point: the harbour point is the plant's, tilbakemelding #20)
    if (dep){ const pt = portById(dep.pid), w0 = pl.wps[pl.idx], from = dep.naust && w0 ? w0 : pt && pt.p; let W = from ? berthPath(from, dep.bp).reverse() : [dep.bp];
      // from the last turn out from the quay straight on to the route when that is clear: the harbour point can lie by the berth
      // (Senjahopen), and going back to it had her back out and then run in past the quay again
      const w1 = pl.wps[pl.idx]; if (W.length > 2 && w1 && berthClear(W[W.length - 2], w1, (dep.bp.Bb || 3) / 2)) W = W.slice(0, -1);
      for (const q of W) add(q.x * 1000, q.y * 1000); hd0 = dep.bp.hd; iOut = P.length - 1;
      if (P.length > 1) back = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]); }   // the first stretch astern, out from the quay
    else add(bv.px, bv.pz);
    // up to the first harbour on it: she docks there and the route is over (core dock)
    let iEnd = pl.wps.length - 1; for (let i = pl.idx; i < pl.wps.length; i++) if (pl.wps[i].port){ iEnd = i; break; }
    for (let i = pl.idx; i <= iEnd; i++){ const w = pl.wps[i]; add(w.x * 1000, w.y * 1000); wpAt[i] = P.length - 1; }
    const last = pl.wps[iEnd];
    // in to the quay she will lie at, the same as berthNow once she is in
    if (last && last.port){ endBp = berthPose(last.port, vt, last.berth === 'naust' && quayFace(last.port, 'naust') ? 'naust' : 'main') || berthPose(last.port, vt);
      if (endBp){ const W = berthPath({x:last.x, y:last.y}, endBp); for (let k = 1; k < W.length; k++) add(W[k].x * 1000, W[k].y * 1000); } }
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const stops = []; for (let i = pl.idx; i <= iEnd; i++) if (wpStop(pl.wps[i]) && wpAt[i] != null) stops.push({i, s:L[wpAt[i]]});
    // where the way in to the quay begins (slow from there), and how far she turns over once she is clear astern
    const sIn = endBp && wpAt[iEnd] != null ? L[wpAt[iEnd]] : 1e9, turnL = Math.max(10, ((dep && dep.bp.Lb) || 8) * 1.5);
    return {plan:pl, n:pl.wps.length, sig:trkSig(pl), chk:0, P, L, end:L[L.length - 1], stops, s:0, v:0, vc:0, back, turnL, hd0, endBp, sIn, sOut:L[iOut], done:false};
  }
  // the point s metres along the line
  function trkAt(T, s){
    const L = T.L, n = L.length; if (n < 2) return T.P[0]; s = clamp(s, 0, T.end);
    let lo = 1, hi = n - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; }
    const a = T.P[lo - 1], c = T.P[lo], f = (s - L[lo - 1]) / Math.max(1e-6, L[lo] - L[lo - 1]); return [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f];
  }
  // how far along the line a point is, looked for from s0 on (a line that comes back on itself is no trouble)
  function trkProj(T, x, z, s0, back = 30){
    let best = s0, bd = 1e18;
    for (let i = 1; i < T.P.length; i++){
      if (T.L[i] < s0 - back) continue; if (T.L[i - 1] > s0 + 4000) break;
      const a = T.P[i - 1], c = T.P[i], vx = c[0] - a[0], vz = c[1] - a[1], l2 = vx * vx + vz * vz || 1, u = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1);
      const d = (x - a[0] - u * vx) ** 2 + (z - a[1] - u * vz) ** 2; if (d < bd){ bd = d; best = T.L[i - 1] + u * Math.sqrt(l2); }
    }
    return best;
  }
  // under way on a route, or not yet in at the end of the last one; a new or changed route starts a new line
  function trkOn(){
    const b = S.boat, pl = S.plan;
    if (helmOn() || b.status === 'tow' || dynLive() || b.anch){ TRK = null; return false; }   // (at anchor she lies to it until it is up)
    if (b.status === 'sailing' && pl && pl.wps.length > pl.idx){
      if (!TRK || TRK.plan !== pl || TRK.n !== pl.wps.length || ((TRK.chk = (TRK.chk + 1) % 30) === 0 && trkSig(pl) !== TRK.sig)){
        // from the quay she has just cast off from (moorStep's MO.dep), else from where she is
        const d0 = !TRK && MO.dep && Math.hypot(MO.dep.bp.x * 1000 - bv.px, MO.dep.bp.y * 1000 - bv.pz) < 60 ? MO.dep : null, v = TRK ? TRK.v : d0 ? 0 : bv.spd || 0, vc = TRK ? TRK.vc : 0;
        MO.dep = null; TRK = trkBuild(pl, d0); TRK.v = v; TRK.vc = vc;
      }
      return true;
    }
    if (TRK && !TRK.done) return true;
    TRK = null; return false;
  }
  const trkDn = vc => Math.max(1.2, vc / 6);   // how hard she brakes (m/s per s) from the speed she cruises at
  // «Stopp»: how far ahead of the simulation (km, along the route) she needs to stop gently from where she is and the way she has on
  function trkHaltNeed(){
    const T = TRK, b = S.boat; if (!T || T.plan !== S.plan || b.status !== 'sailing') return 0;
    const sSim = trkProj(T, b.pos.x * 1000, b.pos.y * 1000, T.s, 3000), vc = Math.max(T.vc, 3 * KNV());
    return Math.max(0, T.s + T.v * T.v / (2 * trkDn(vc)) + 5 - sSim) / 1000;
  }
  function trkStep(dt, pr){
    const T = TRK, b = S.boat, pl = S.plan, live = pl === T.plan && b.status === 'sailing';
    const vs = live ? sailV(S.t / 60) * KNV() : 0; if (vs > 0.5) T.vc = vs; const vc = Math.max(T.vc, 3 * KNV());
    // where the simulation is on the line: under way she keeps up with it; when it has come in to a quay she runs on to the berth;
    // when it has stopped elsewhere (the end of the route, a ground, a set, Stopp) she runs on to where it stands
    const dock = b.status === 'port' && T.endBp, sT = dock ? T.end : trkProj(T, pr.p.x * 1000, pr.p.y * 1000, Math.max(T.s, T.sOut));
    const aUp = Math.max(1.2, vc / 5), aDn = trkDn(vc);
    // the stop she must not pass: under way the first stop waypoint the simulation has not reached yet, else the end; stopped, where it
    // stands (if she has already run past it, she slows down as gently as she can)
    let sStop = T.end, vDes = vc;
    if (live){ for (const q of T.stops) if (q.i >= pl.idx && q.s >= T.s - 0.5){ sStop = q.s; break; }
      // out from the quay at manoeuvring speed whatever the simulation does (it starts at the harbour point, which can lie by the berth)
      vDes = T.s < T.sOut ? vc : clamp(vs + (sT - T.s) * 0.6, 0, vs * 1.5 + 3 + Math.max(0, sT - T.s - 60) * 0.05); }
    else if (!dock){ if (sT > T.s) sStop = Math.min(T.end, sT); else { vDes = 0; sStop = Math.min(T.end, T.s + T.v * T.v / (2 * aDn) + 0.01); } }
    // slow astern out from the quay and while she turns, and slow on the way in to the quay
    if (T.s < T.back + T.turnL || T.s > T.sIn) vDes = Math.min(vDes, (T.s > T.sIn ? 4 : 3) * KNV());
    // speed: up and down gradually, and never more than she can brake from to stand at the stop
    T.v += clamp(vDes - T.v, -aDn * dt, aUp * dt); T.v = clamp(T.v, 0, Math.sqrt(2 * aDn * Math.max(0, sStop - T.s)));
    const s0 = T.s; T.s = Math.min(T.s + T.v * dt, sStop);
    // under way never ahead of the simulation (out from the quay excepted: it starts at the harbour point), never back: one slow frame
    // (up to 30 s under SwiftShader) took her far past it with the way she had
    if (live && T.s > Math.max(sT, T.sOut)){ T.s = Math.max(s0, sT, T.sOut); T.v = Math.min(T.v, vs); }
    if (sStop - T.s < 0.05){ T.s = sStop; T.v = 0; }
    // stopped where the simulation is (it takes over from here: the quay's lines, or lying still)
    if (!live && T.v < 0.02 && (T.s >= sStop - 0.05 || vDes === 0)) T.done = true;
    // on the line, the corners rounded; the heading along it (astern out from the quay at first, then turning to the way out)
    // (not near a stop: there she stands exactly on the waypoint)
    let r = Math.min(TRK_R, T.s, T.end - T.s); for (const q of T.stops) r = Math.min(r, Math.abs(q.s - T.s));
    const A = trkAt(T, T.s - r), C = trkAt(T, T.s + r), Q = r > 0.01 ? [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2] : trkAt(T, T.s);
    const rh = Math.max(2, TRK_R), A2 = trkAt(T, T.s - rh), C2 = trkAt(T, T.s + rh);
    let hd = Math.hypot(C2[0] - A2[0], C2[1] - A2[1]) > 0.1 ? Math.atan2(C2[0] - A2[0], -(C2[1] - A2[1])) : bv.cog;
    if (T.back > 0 && T.hd0 != null) hd = T.hd0 + angDiff(T.hd0, hd) * sstep(0, 1, (T.s - T.back) / T.turnL);
    const c0 = bv.cog; bv.px = Q[0]; bv.pz = Q[1]; bv.cog = hd; bv.spd = T.v;
    bv.yr += (clamp(angDiff(c0, hd) / Math.max(dt, 1e-3), -1.5, 1.5) - bv.yr) * (1 - Math.exp(-dt * 6));
    // in at the quay: the lines go on (moorStep takes it from here)
    if (T.done && T.endBp && b.status === 'port'){ MO.key = S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0); MO.init = true; MO.phase = 'lines'; MO.t = 0; MO.lines = 0; MO.len = [0, 0, 0, 0]; }
  }
  // the manoeuvring model takes her on its next tick: under way on a route, with the simulation's data in and the world at its own pace
  // (core dynCan without DYN.on, which is off only for a tick that caught time up with the kinematic minute step; the model starts again
  // from where that put her). Until then she stands where she is: the follower, run in the frame between with all the time it took (up
  // to 30 s under SwiftShader), went 200 m out along the line from the quay she had just cast off from, and the model then took her
  // back from there (trackfollow, 07.11.2026)
  function dynSoon(){ const b = S.boat, pl = S.plan; return typeof SIMREADY !== 'undefined' && SIMREADY && simRate() <= 12 && b.status === 'sailing' && !b.anch && !helmOn() && !!pl && pl.wps.length > pl.idx; }
  // the manoeuvring model has her (core/16b-dyn.js, Fysikk 1): she is drawn where it puts her, a little on from its last tick, with
  // the way and the turn it gives her (the wake, the banking and the skid come from those, as under the follower)
  function dynFollow(dt){
    TRK = null; const q = dynPose(), x = q.x * 1000, z = q.y * 1000, k = 1 - Math.exp(-dt * 10), rate = simRate();
    bv.spd = q.spd * rate; bv.yr += (q.r * rate - bv.yr) * (1 - Math.exp(-dt * 6));
    // the hull's heading is the model's: the skid the common code adds (bv.beta, from the yaw rate) is taken off the course here
    const bt = clamp(bv.yr * 0.14 * sstep(0.5, 6, bv.spd / KNV()), -0.18, 0.18), hd = q.hd - bt;
    if (Math.hypot(x - bv.px, z - bv.pz) > 50){ bv.px = x; bv.pz = z; bv.cog = hd; }
    else { bv.px += (x - bv.px) * k; bv.pz += (z - bv.pz) * k; bv.cog += angDiff(bv.cog, hd) * k; }
  }
  function updateBoat(dt, t, frac, rdt){
    // (when the model takes her on its next tick, where the simulation has her is where it starts her, not the minute step's way on
    // from there: after time caught up, the jump over 900 m below put her up to a minute's way ahead of it, 177 m at 7 knots)
    const b = S.boat, pr = predict(dynSoon() && !dynLive() ? 0 : frac), tx = pr.p.x * 1000, tz = pr.p.y * 1000, sailing = b.status === 'sailing' && S.plan, G = GEO(vtype());
    const zp = (G.bow || -2.2) + ((G.stern || 3.1) - (G.bow || -2.2)) / 3;   // pivot point, local z (negative = forward)
    if (!bv.init || Math.hypot(tx - (bv.px || 0), tz - (bv.pz || 0)) > 900){ TRK = null; bv.px = tx; bv.pz = tz; bv.cog = pr.hd; bv.head = pr.hd; bv.spd = sailing ? b.v * KNV() : 0; bv.yr = 0; bv.beta = 0; bv.init = true; bv.osc = false; bv.st = null; TRAIL.length = 0; WV.init = false; }
    else if (dt > 0){
      const bp = berthNow();
      // under a route, and until she has come in to where it ends: along the line the chart plotter draws (trkStep)
      // (with the time that has really gone, up to 30 s: a slow frame or a stall must not leave her behind the simulation for good)
      if (dynLive()) dynFollow(Math.min(30, rdt || dt));   // the manoeuvring model has her (core/16b-dyn.js); with the time that has really gone, so a slow frame never leaves her behind
      else if (!bp && dynRest() && !S.plan && !helmOn() && !b.drv && !b.anch) dynFollow(Math.min(30, rdt || dt));   // the model has just stopped her: stand where it left her (until she drifts: core lieDrift)
      else if (dynSoon()){ TRK = null; bv.spd *= Math.exp(-dt * 1.2); bv.yr *= Math.exp(-dt * 2); }   // the model takes her on its next tick: she stands where she is till then
      else if (trkOn()) trkStep(Math.min(30, rdt || dt), pr);
      else if (bp) moorStep(dt, bp, Math.min(30, rdt || dt));   // (the way in and the lines on the time that has really gone: a slow frame never holds her off the quay)
      else if (helmOn()){
        // by hand (16-helm.js): she is where the simulation puts her every tick, so she follows it closely; the turn (a game second's,
        // so times the rate on the screen) and the way she
        // has come from the helm, so she banks and makes her wake as under a route
        const h = S.helm, k = 1 - Math.exp(-dt * 6);
        bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k; bv.cog += angDiff(bv.cog, pr.hd) * k;
        bv.yr += (h.yaw * simRate() - bv.yr) * (1 - Math.exp(-dt * 3)); bv.spd = Math.abs(h.v) * KNV();
      }
      else if (b.status === 'tow' && b.tow && b.tow.ph === 'tow'){
        // under tow (the rescue boat, core towPose): she keeps close behind the tow line's end, with way on
        const k = 1 - Math.exp(-dt * 6); bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k; bv.cog += angDiff(bv.cog, pr.hd) * (1 - Math.exp(-dt * 2));
        bv.spd = TOW.tow * KNV(); bv.yr *= Math.exp(-dt * 2);
      } else {
        // in port, fishing or drifting: glide to the spot, coast to a stop and swing slowly to the new heading
        // (drifting, core lieDrift: she keeps close to where the drift has her, on the time that has really gone, as under the model,
        // so slow frames never leave her behind the chart and the simulation; she comes there from where the model stopped her)
        bv.spd *= Math.exp(-dt * 1.2); bv.yr *= Math.exp(-dt * 2);
        // (setting or hauling, she has way on along the string: the minute's move, core/10-gear.js)
        const gm = b.gop && b.gop.mv && b.gop.mv.t === S.t ? b.gop.mv : null; if (gm) bv.spd = Math.hypot(gm.x, gm.y) * 1000 * simRate() / 60;
        // (at anchor she swings round it along the minute's move as well: core/06e-anchor.js)
        const sw = b.drv || (b.anch && b.anch.mv) || gm, k = sw ? 1 - Math.exp(-Math.min(30, rdt || dt) * 3) : 1 - Math.exp(-dt * 1.5); bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k;
        bv.cog += angDiff(bv.cog, pr.hd) * (1 - Math.exp(-dt * (b.anch ? 2 : 0.7)));
      }
      // the bow points a little into the turn, so the stern skids out
      const kn0 = bv.spd / KNV(), bt = clamp(bv.yr * 0.14 * sstep(0.5, 6, kn0), -0.18, 0.18);
      bv.beta += (bt - bv.beta) * (1 - Math.exp(-dt * 4)); bv.head = bv.cog + bv.beta;
    }
    // the hull is placed so that the track point is its pivot
    bv.x = bv.px + Math.sin(bv.head) * zp; bv.z = bv.pz - Math.cos(bv.head) * zp;
    const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head);
    // The hull answers the sea it floats on, with the natural periods of the boat as loaded (03c-stability.js). Heave and pitch come from
    // the buoyancy of her sections (Fysikk 4 F2, hullMove below); roll is a damped oscillator to the sea's slope across her, as before, so
    // a sea that meets her roll period builds the roll up (resonance), and a beam wind heels her. «#hull0» in the address, and the yard's
    // lift, give heave and pitch as before: the sea averaged over the waterplane (3 x 3 points), followed as damped oscillators.
    // (and the load's own list and trim, OB15: the core reckons them from where the load, the pull in the hauler and the people stand,
    // stabOf; a positive list is to starboard, which is a negative roll here. The trim goes to the sections' rest, hullMove)
    if (!bv.st || t - (bv.stT || 0) > 1 || t < (bv.stT || 0)){ bv.st = stabOf(b.type || 'skiff'); bv.stT = t; bv.heel = -windHeel(bv.st, env.wind || 0) * Math.sign(Math.sin((windDir(S.t / 60) * DEG + Math.PI) - bv.head) || 1); bv.list = -(bv.st.list || 0); }   // to leeward
    const pl = G.pl, rl = G.rl, Ls = Math.max(pl * 2, (G.stern - G.bow) * 0.8 || 0), Bs = Math.max(rl * 2, (G.beam || 2.4) * 0.8);
    // on the yard's lift she is raised with the platform and lies still: no sea to rock her (liftStep)
    const lf = liftStep(dt, b), lifted = lf.off > 0 || !!lf.d, force = HSEA.on && !lifted;
    // Under way the boat on screen runs GAME_RATE x (and the pace) faster than she would through these waves, which move in real time,
    // so she met them several times too often and heaved a metre at half a second in a gale (the user's «rister voldsomt» at the
    // helm, 03.10.2026): the sea she answers is smoothed over a time that grows with that speed
    const tf = 0.45 * sstep(2, 14, bv.spd || 0) + 0.3 * sstep(14, 45, bv.spd || 0);
    // (the short wind waves that ride with her, the near field, apart: she meets those at her real speed, and they go to the hull as
    // they are; the long waves and the swell stand in the world, where she meets them 6 times too often, and only those are smoothed)
    let hm = 0, sl = 0, st = 0, hmN = 0, slN = 0, stN = 0;
    if (force){ const q = hullSea(G, Bs, t, tf, dt); hm = q.hm; st = q.st; stN = q.stN; }
    else {
      for (const a of [-0.5, 0, 0.5]) for (const c of [-0.5, 0, 0.5]){ const h = seaH(bv.x + fx * a * Ls + rx * c * Bs, bv.z + fz * a * Ls + rz * c * Bs, t), hn = SEA_D[3]; hm += h; sl += h * a; st += h * c; hmN += hn; slN += hn * a; stN += hn * c; }
      hm /= 9; sl /= 1.5 * Ls; st /= 1.5 * Bs; hmN /= 9; slN /= 1.5 * Ls; stN /= 1.5 * Bs;
    }
    const v = b.status === 'sailing' ? bv.spd / KNV() : 0;
    // trim and lift from the Froude number (14-sea.js updateWake: WK.Fr, WK.pf), not from the knots, since a 5 m skiff and a 60 m
    // trawler in 12 knots are not alike: a planing hull climbs her own bow wave to some 6 degrees at the hump (Fr 0.5-0.7), then comes
    // up on the plane, lifts and settles to some 3 degrees with the forebody dry (the reference video 04.11.2026); a displacement hull
    // squats, the stern down and the bow up a degree, near her hull speed (Fr 0.35-0.45). (With the sections, hullStep reckons it: her own
    // wave along her and the planing lift.)
    const Fr = WK.Fr || 0, Lb = (G.stern - G.bow) || 6;
    const trim = force ? 0 : BOAT.planing ? 0.1 * sstep(0.25, 0.6, Fr) - 0.045 * sstep(0.7, 1.3, Fr) : 0.018 * sstep(0.2, 0.45, Fr);
    const lift = force ? 0 : BOAT.planing ? 0.015 * Lb * (WK.pf || 0) : -0.004 * Lb * sstep(0.3, 0.45, Fr);
    // planing hulls bank into a turn, displacement hulls heel a little outwards
    const bank = (BOAT.planing ? -0.18 : 0.06) * clamp(bv.yr, -1.2, 1.2) * sstep(4, 18, v);
    let tp = Math.atan(sl - slN) + trim + (force ? 0 : bv.st.trim || 0), tr = Math.atan(st - stN) + bank + (bv.heel || 0) + (bv.list || 0), ty = hm - hmN + 0.06 + lift;
    if (lifted){ ty = hm * (1 - lf.dry) + (env.tide || 0) * lf.dry + 0.06 + lf.off; tp *= 1 - lf.dry; tr *= 1 - lf.dry; if (bv.osc && lf.d) bv.y += lf.d; if (bv.fy !== undefined && lf.d) bv.fy += lf.d; }
    if (!bv.osc || tf < 0.02 || bv.fy === undefined){ bv.fy = ty; bv.fp = tp; bv.fr = tr; }
    else { const k = 1 - Math.exp(-dt / tf); bv.fy += (ty - bv.fy) * k; bv.fp += (tp - bv.fp) * k; bv.fr += (tr - bv.fr) * k; ty = bv.fy; tp = bv.fp; tr = bv.fr; }
    ty += hmN; tp += Math.atan(slN); tr += Math.atan(stN);   // (the near field's own, unsmoothed: Fysikk 2, the real encounter)
    if (!bv.osc){ bv.osc = true; bv.vy = bv.vp = bv.vr = 0; bv.y = ty; bv.pitch = tp; bv.roll = tr; HSEA.ok = false; }
    // (the roll is damped little lying still, more with way on: the hull's lift damps it, Ikeda; 0.06 of critical at rest to 0.15 at a
    // Froude number of 0.3, so a boat lying beam-on to the sea rolls, tilbakemelding #66)
    const Fn = (b.status === 'sailing' ? (b.v || 0) * 0.5144 : 0) / Math.sqrt(9.81 * Math.max(3, bv.st.L || 6));
    const wz = 2 * Math.PI / Math.max(0.6, bv.st.Tz), wr = 2 * Math.PI / Math.max(0.8, bv.st.Tr), zz = 0.35, zr = 0.06 + 0.09 * sstep(0, 0.3, Fn), n = Math.ceil(dt / 0.02), h = dt / n, lim = Math.min(0.9, bv.st.deckEdge * 1.6);
    for (let i = 0; i < n; i++){
      if (!force){
        bv.vy += (wz * wz * (ty - bv.y) - 2 * zz * wz * bv.vy) * h; bv.y += bv.vy * h;
        bv.vp += (wz * wz * (tp - bv.pitch) - 2 * zz * wz * bv.vp) * h; bv.pitch += bv.vp * h;
      }
      bv.vr += (wr * wr * (tr - bv.roll) - 2 * zr * wr * bv.vr) * h; bv.roll = clamp(bv.roll + bv.vr * h, -lim, lim);
    }
    if (force) hullMove(dt, b);
    else HSEA.ok = false;
    bv.v = v;
  }
  // ---------- the hull in the sea: buoyancy per section (Fysikk 4 F2, 07.11.2026; docs/planer/fysikk-4-sjo-og-skrog.md, Jonas' choice 2B) ----------
  // Heave and pitch are reckoned from forces (core/03c-stability.js hullSections, hullRest, hullStep), not by following the surface: the hull
  // is cut in nine sections along her waterline (her own ends in GEO), and the sea is read at each, across her at three points. The short
  // sea that rides with her (the near field, 5.20b) goes in as it is, the long sea and the swell smoothed as before (she meets those 6 times
  // too often); each is taken down with the section's depth as its pressure is (Froude-Krylov as Smith's effect, e^(-k d) per wave from
  // the waves' own list, amplitude-weighted), so a 6 m chop lifts a sjark less than its height says and the swell lifts her fully. The bow
  // buries when a section is wholly under, the stern lifts in a following sea, a planing hull rises on her lift. When a bow section comes
  // down into the sea faster than 0.2 sqrt(g L) (about 2 m/s for the sjark) she slams: spray from the bow (24-cinema.js drawEffects), and
  // the slams are counted in S.incidents with no consequence (that is F7, choice 9A). «#hull0» in the address: as before (hidden, as #nf0).
  const HSEA = {on:!/hull0/.test(location.hash), ok:false, H:null, R:null, X:null, eta:new Float64Array(HS_N), etaP:new Float64Array(HS_N), deta:new Float64Array(HS_N), far:new Float64Array(HS_N),
    fN:new Float64Array(HS_N), fF:new Float64Array(HS_N), fk:'', slam:{t:-9, s:0}, n:0, ms:0};
  const HS_ACROSS = [-0.5, 0, 0.5];
  // a wave's height in the list as the sea draws it, before the local scale (the wind sea's two spectra halved, the swell's)
  const waveA = c => c.swell ? WV.swHs * c.wo : WV.hs * (c.wo + c.wy) / 2;
  bv.hsea = HSEA;
  // the sea at her sections (absolute heights), the slope across her for the roll, and the mean for a start
  function hullSea(G, Bs, t, tf, dt){
    const H = HSEA.H = hullSections(vtype(), G.bow, G.stern), tide = env.tide || 0, fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), t0 = performance.now();
    // Smith's effect per section: the pressure of a wave of number k at the depth of the section's centre, e^(-k zc), weighted by the waves'
    // heights, for the short sea (the near field's waves, under 30 m) and the long sea and swell apart (again only when the hull, the
    // wave list or the heights have changed: the heights drift with a time constant of 4 s)
    const fk = H.key + '|' + WV.list.length + '|' + (WV.list[0] && WV.list[0].k) + '|' + WV.hs.toFixed(2) + '|' + WV.swHs.toFixed(2);
    if (fk !== HSEA.fk){ HSEA.fk = fk; let aN = 0, aF = 0; const L = WV.list; for (const c of L){ const a = waveA(c); if (!c.swell && c.k > 0.21) aN += a; else aF += a; }
      for (let i = 0; i < H.n; i++){ let sN = 0, sF = 0; const z = H.zc[i]; for (const c of L){ const e = waveA(c) * Math.exp(-c.k * z); if (!c.swell && c.k > 0.21) sN += e; else sF += e; }
        HSEA.fN[i] = aN > 0 ? sN / aN : 1; HSEA.fF[i] = aF > 0 ? sF / aF : 1; } }
    const k = HSEA.ok && tf >= 0.02 ? 1 - Math.exp(-dt / tf) : 1;
    let hm = 0, st = 0, stN = 0;
    for (let i = 0; i < H.n; i++){
      const zl = H.z[i], x0 = bv.x - fx * zl, z0 = bv.z - fz * zl; let far = 0, nr = 0, hl = 0, hr = 0, nl = 0, nrr = 0;
      for (const c of HS_ACROSS){ const hh = seaH(x0 + rx * c * Bs, z0 + rz * c * Bs, t), hn = SEA_D[3]; far += hh - hn; nr += hn; if (c < 0){ hl = hh; nl = hn; } else if (c > 0){ hr = hh; nrr = hn; } }
      far /= 3; nr /= 3; HSEA.far[i] += (far - HSEA.far[i]) * k;
      HSEA.eta[i] = (HSEA.far[i] - tide) * HSEA.fF[i] + nr * HSEA.fN[i];   // (over the still water)
      hm += far + nr; st += hr - hl; stN += nrr - nl;
    }
    HSEA.ms = HSEA.ms * 0.9 + (performance.now() - t0) * 0.1;
    return {hm:hm / H.n, st:st / (H.n * Bs), stN:stN / (H.n * Bs)};
  }
  // heave and pitch from the sections' buoyancy, in steps of at most 0.02 s; she starts where the old following had her
  function hullMove(dt, b){
    const H = HSEA.H, tide = env.tide || 0;
    // (what is aboard, on the hull drawn; trimmed by the load's centre of gravity off the level one, stabOf dzG, when the hull drawn is her
    // own type's: the drawn hull's ends are the model's, the core's from STAB_AT, and the offset carries over where the frames differ a little)
    const D = hullOf(H.type).disp + Math.max(0, bv.st.D - hullOf(b.type || H.type).disp), R = hullRest(H, D, H.type === b.type && bv.st.dzG ? hullRest(H, D).zG + bv.st.dzG : undefined);
    if (!HSEA.ok || !HSEA.X || HSEA.X.key !== H.key){
      const X = HSEA.X = hullX(R); X.key = H.key; X.th = bv.pitch || 0; X.y = (bv.y || tide + R.y0) - tide; X.yg = X.y - Math.sin(X.th) * R.zG; X.vy = 0; X.vth = 0;
      for (let i = 0; i < H.n; i++){ X.h[i] = H.d[i]; HSEA.etaP[i] = HSEA.eta[i]; } HSEA.ok = true;
    }
    const X = HSEA.X;
    // (a new load moves her centre of gravity: she is where she was, and turns about the new one from here)
    if (HSEA.R && HSEA.R !== R) X.yg = X.y - Math.sin(X.th) * R.zG; HSEA.R = R; for (let i = 0; i < H.n; i++){ HSEA.deta[i] = dt > 0 ? (HSEA.eta[i] - HSEA.etaP[i]) / dt : 0; HSEA.etaP[i] = HSEA.eta[i]; }
    const o = {V:(WK.kn || 0) * 0.5144, Fr:WK.Fr || 0, planing:H.planing}, n = Math.ceil(dt / 0.02), h = dt / Math.max(1, n); let slam = 0;
    for (let i = 0; i < n; i++) slam = Math.max(slam, hullStep(H, R, X, HSEA.eta, HSEA.deta, h, o));
    bv.y = tide + X.y; bv.pitch = X.th; bv.vy = X.vy; bv.vp = X.vth;
    if (slam > 0){ HSEA.slam = {t:performance.now() / 1000, s:slam}; HSEA.n++; slamLog(slam * hullSlamV(H)); }
  }
  // the slams in S.incidents, with no consequence yet (F7): one entry while they go on (a new one after half an hour of game time without),
  // (counted only where the 3D view draws her: F7 must reckon them in the core, so a screen that is off makes no difference to the world)
  // the count and the hardest, and never more than ten such entries, so they do not push the groundings and the knocks out of the sixty
  function slamLog(v){
    const I = S.incidents = S.incidents || [], vr = Math.round(v * 10) / 10; let e = null;
    for (let i = I.length - 1; i >= 0; i--) if (I[i].k === 'slam'){ e = I[i]; break; }
    if (e && S.t - (e.t1 || e.t) < 30){ e.n = (e.n || 1) + 1; e.t1 = S.t; e.v = Math.max(e.v || 0, vr); return; }
    I.push({t:S.t, t1:S.t, k:'slam', boat:S.boatName || 'Havbris', n:1, v:vr});
    if (I.filter(x => x.k === 'slam').length > 10) I.splice(I.findIndex(x => x.k === 'slam'), 1);
    if (I.length > 60) I.shift();
  }

  // ---------- particles ----------
  const PN = 900, pp = new Float64Array(PN * 3), PFL = new Float32Array(PN * 3); let pinit = false;
  const TRAIL = [];
  const WN = 700, wk = {x:new Float64Array(WN), y:new Float64Array(WN), z:new Float64Array(WN), vx:new Float64Array(WN), vy:new Float64Array(WN), vz:new Float64Array(WN), age:new Float64Array(WN).fill(99), life:new Float64Array(WN).fill(1), g:new Float64Array(WN), n:0, acc:0, sacc:0};
  function spawn(x, y, z, vx, vy, vz, life, g){ const i = wk.n = (wk.n + 1) % WN; wk.x[i] = x; wk.y[i] = y; wk.z[i] = z; wk.vx[i] = vx; wk.vy[i] = vy; wk.vz[i] = vz; wk.age[i] = 0; wk.life[i] = life; wk.g[i] = g; }
  const PB = new Float32Array(4000 * 3), PA = new Float32Array(4000);
  function drawPts(n, mode, VP, col, size, round, off, mx){
    if (!n) return;
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uOff, off || [0, 0, 0]); gl.uniform1f(u.uPull, 0); gl.uniform3fv(u.uCol, col); gl.uniform1f(u.uSize, size * ZF()); gl.uniform1f(u.uRound, round === 2 ? 2 : round ? 1 : 0); gl.uniform1f(u.uMax, mx || 48);
    gl.bindBuffer(gl.ARRAY_BUFFER, DYNP); gl.bufferSubData(gl.ARRAY_BUFFER, 0, PB.subarray(0, n * 3)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, DYNA); gl.bufferSubData(gl.ARRAY_BUFFER, 0, PA.subarray(0, n)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(mode, 0, n);
  }

