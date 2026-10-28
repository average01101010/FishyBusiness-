  // ---------- environment ----------
  const PAL = [[-18,[0.006,0.012,0.035],[0.02,0.035,0.07]], [-9,[0.02,0.04,0.1],[0.08,0.1,0.18]], [-3,[0.1,0.16,0.33],[0.5,0.4,0.5]], [2,[0.28,0.42,0.7],[0.93,0.68,0.5]], [9,[0.3,0.52,0.8],[0.76,0.83,0.9]], [25,[0.25,0.49,0.82],[0.68,0.8,0.92]]];
  function pal(el){
    if (el <= PAL[0][0]) return [PAL[0][1], PAL[0][2]];
    for (let i = 0; i < PAL.length - 1; i++){ const a = PAL[i], b = PAL[i + 1]; if (el <= b[0]){ const t = (el - a[0]) / (b[0] - a[0]); return [mix3(a[1], b[1], t), mix3(a[2], b[2], t)]; } }
    const L = PAL[PAL.length - 1]; return [L[1], L[2]];
  }
  function computeEnv(H){
    // the sun's and the moon's true azimuths onto the grid the world is drawn on
    const s = sunAt(H), el = s.el, er = el * DEG, gz = gridGamma({x:bv.x / 1000, y:bv.z / 1000}) * DEG, saz = s.az - gz; env.el = el;
    env.sunDir = [Math.cos(er) * Math.sin(saz), Math.sin(er), -Math.cos(er) * Math.cos(saz)];
    const ly = Math.max(env.sunDir[1], 0.25), ll = Math.hypot(env.sunDir[0], ly, env.sunDir[2]); env.lightDir = [env.sunDir[0] / ll, ly / ll, env.sunDir[2] / ll];
    env.cloud = cloudAt(H); env.precip = precipAt(H); env.temp = airTemp(H); env.vis = visibility(H); env.aur = auroraAt(H);
    let [zen, hor] = pal(el); const lum = 0.3 * hor[0] + 0.59 * hor[1] + 0.11 * hor[2], grey = [lum * 0.92, lum * 0.96, lum * 1.02];
    zen = mix3(zen, grey.map(v => v * 0.9), env.cloud * 0.8); hor = mix3(hor, grey, env.cloud * 0.85);
    env.zen = zen; env.hor = hor; env.day = sstep(-6, 6, el);
    const sc = mix3([1, 0.95, 0.88], [1, 0.58, 0.32], sstep(14, 1, el)), si = sstep(-1.5, 5, el) * (1 - 0.72 * env.cloud) * 1.1;
    env.sunCol = sc.map(v => v * si);
    env.amb = [zen[0] * 0.55 + hor[0] * 0.25 + 0.075, zen[1] * 0.55 + hor[1] * 0.25 + 0.095 + env.aur * 0.07, zen[2] * 0.55 + hor[2] * 0.25 + 0.14 + env.aur * 0.03];
    env.gnd = env.amb.map(v => v * 0.6);
    // from a strong gale (Beaufort 9) the spray in the air shortens the view over the sea: about 15 km at force 10, 4 km at 11, 1 km at 12
    // (only in 3D; the game's visibility() is unchanged)
    env.fog = hor; env.fogD = 1.73 / (Math.min(QUAL.lvl === 3 ? env.vis * 1.8 : env.vis, (QUAL.lvl === 3 ? 90 : 50) * Math.exp(-0.325 * Math.max(0, windAt(H) - 20.8))) * 1000);
    // the cloud base on the fells (G5): from about 2 700 m under a broken sky down to 250-300 m under a full grey one, 150 m lower in rain
    // or snow; only a sky over 55 % cloud lays it on the ground at all. Its colour is the overcast horizon's, so the cloud on the fell is the sky's
    env.cbase = 250 + 2500 * Math.pow(1 - env.cloud, 1.5) - 150 * sstep(0.1, 0.6, env.precip || 0); env.cstr = sstep(0.55, 0.85, env.cloud) * 0.92;
    env.ccol = hor;
    env.stars = sstep(-5, -12, el) * (1 - env.cloud); env.spec = sstep(-1, 4, el) * (1 - env.cloud) * 2.2;
    env.night = sstep(3, -5, el);
    // moon: where it is, how full, and the light it gives at night
    const mo = moonAt(H), mr = mo.el * DEG; env.moon = mo; env.moonDir = [Math.cos(mr) * Math.sin(mo.az - gz), Math.sin(mr), -Math.cos(mr) * Math.cos(mo.az - gz)];
    env.moonA = sstep(-1, 2, mo.el) * (1 - 0.6 * env.day);
    const mlight = sstep(0, 8, mo.el) * mo.illum * sstep(-2, -8, el) * (1 - 0.8 * env.cloud);
    if (mlight > 0.02){ const ml = [0.62, 0.7, 0.9].map(v => v * mlight * 0.32); env.sunCol = env.sunCol.map((v, k) => v + ml[k]); env.amb = env.amb.map((v, k) => v + [0.02, 0.025, 0.04][k] * mlight); const my = Math.max(env.moonDir[1], 0.25), mll = Math.hypot(env.moonDir[0], my, env.moonDir[2]); env.lightDir = [env.moonDir[0] / mll, my / mll, env.moonDir[2] / mll]; }
    env.shadowDir = el > -1 ? env.sunDir : mlight > 0.02 ? env.moonDir : null;
    env.tide = tideH(H);
    const sn = Math.round(snowLine(H) / 20) * 20, rk = ruskNow(), gn = grassNow() + rk[0] * 10 + rk[1] * 100; if (sn !== snowNow || gn !== grassAt){ snowNow = sn; grassAt = gn; recolor(TERR, sn); if (NEARM) recolor(NEARM, sn); if (FINEM) recolor(FINEM, sn); for (const m of UPATCH) recolor(m, sn); }
  }


  // ---------- mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off) ----------
  const MO = {key:'', phase:'', t:0, from:null, dur:0, lines:0, len:[0, 0, 0, 0], init:false};
  const LINE_S = 1.2;   // seconds for each line to go on
  let ROPEM = null, FENDM = null;
  function buildMooring(){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.46, 0.33, 0.19, 0.12], 6);   // brown mooring lines (tilbakemelding #22)
    ROPEM = r.mesh(); const f = NB(); f.tube([[0, -0.26, 0], [0, 0.26, 0]], 0.12, [0.93, 0.93, 0.9, 0.35], 10); FENDM = f.mesh(); }
  function berthNow(){
    const b = S.boat; if (!((b.status === 'port' || b.status === 'unmooring') && b.port)) return null;
    const sh = b.shift, kind = sh ? (S.t + currentFrac() < sh.castUntil ? sh.from : sh.to) : berthKind(b);
    return berthPose(b.port, vtype(), kind) || berthPose(b.port, vtype());
  }
  // along a curve from where she was (position and heading F) to the berth, u0 from 0 to 1 at du per second
  function approach(F, bp, u0, du0){
    const X = bp.x * 1000, Z = bp.y * 1000, u = u0 * u0 * (3 - 2 * u0), k = Math.hypot(X - F.x, Z - F.z) * 1.1;
    const P0 = [F.x, F.z], T0 = [Math.sin(F.h) * k, -Math.cos(F.h) * k], P1 = [X, Z], T1 = [bp.fwd.x * k, bp.fwd.z * k];
    const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
    const d00 = 6 * u * u - 6 * u, d10 = 3 * u * u - 4 * u + 1, d01 = -6 * u * u + 6 * u, d11 = 3 * u * u - 2 * u;
    const px = h00 * P0[0] + h10 * T0[0] + h01 * P1[0] + h11 * T1[0], pz = h00 * P0[1] + h10 * T0[1] + h01 * P1[1] + h11 * T1[1];
    const vx = d00 * P0[0] + d10 * T0[0] + d01 * P1[0] + d11 * T1[0], vz = d00 * P0[1] + d10 * T0[1] + d01 * P1[1] + d11 * T1[1];
    bv.spd = Math.hypot(vx, vz) * 6 * u0 * (1 - u0) * du0; bv.yr = 0;
    bv.px = px; bv.pz = pz; if (Math.hypot(vx, vz) > 1e-3) bv.cog = Math.atan2(vx, -vz);
  }
  // a polyline in metres, smoothed (Chaikin, twice) and measured: the ways in to a berth and out of it (core berthPath)
  function pathM(pts){
    let P = pts.map(q => [q.x * 1000, q.y * 1000]);
    for (let it = 0; it < 2; it++){ const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++){ const a = P[i], c = P[i + 1]; Q.push([a[0] * 0.75 + c[0] * 0.25, a[1] * 0.75 + c[1] * 0.25], [a[0] * 0.25 + c[0] * 0.75, a[1] * 0.25 + c[1] * 0.75]); } Q.push(P[P.length - 1]); P = Q; }
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return {P, L, len:L[L.length - 1]};
  }
  function pathAt(M, s){ s = clamp(s, 0, M.len); let i = 1; while (i < M.L.length - 1 && M.L[i] < s) i++; const a = M.P[i - 1], c = M.P[i], f = (s - M.L[i - 1]) / Math.max(1e-6, M.L[i] - M.L[i - 1]); return {x:a[0] + (c[0] - a[0]) * f, z:a[1] + (c[1] - a[1]) * f, h:Math.atan2(c[0] - a[0], -(c[1] - a[1]))}; }
  function lieAlongside(dt, bp){
    bv.spd = 0; bv.yr = 0; bv.px += (bp.x * 1000 - bv.px) * (1 - Math.exp(-dt * 2)); bv.pz += (bp.y * 1000 - bv.pz) * (1 - Math.exp(-dt * 2)); bv.cog += angDiff(bv.cog, bp.hd) * (1 - Math.exp(-dt * 2));
  }
  function moorStep(dt, bp, at = dt){
    const b = S.boat, key = S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0), sp = Math.max(1, S.mult || 1), X = bp.x * 1000, Z = bp.y * 1000;
    // moving to the other quay in the harbour, on the simulation's clock: the lines come in, she goes over, the lines go on
    const sh = b.shift;
    if (sh && b.status === 'port'){
      const gt = S.t + currentFrac(), A = berthPose(b.port, vtype(), sh.from) || bp; MO.key = key; MO.init = true; MO.sh = true;
      if (gt < sh.castUntil){ MO.phase = 'out'; MO.lines = clamp(4 * (sh.castUntil - gt) / CAST_MIN, 0, 4); lieAlongside(dt, A); return; }
      if (gt < sh.arriveAt){ MO.phase = 'in'; MO.lines = 0; MO.len = [0, 0, 0, 0]; const span = sh.arriveAt - sh.castUntil; approach({x:A.x * 1000, z:A.y * 1000, h:A.hd}, bp, clamp((gt - sh.castUntil) / span, 0, 1), GAME_RATE * (S.mult || 1) / 60 / span); return; }
      MO.phase = 'lines'; MO.lines = clamp(4 * (gt - sh.arriveAt) / Math.max(0.1, sh.until - sh.arriveAt), 0, 4); lieAlongside(dt, bp); return;
    }
    if (MO.sh){ MO.sh = false; MO.phase = 'moored'; MO.lines = 4; }   // the move is over: she is made fast
    if (MO.key !== key){
      const d = Math.hypot(bv.px - X, bv.pz - Z); MO.key = key; MO.len = [0, 0, 0, 0];
      if (b.status === 'unmooring' || !MO.init){ MO.phase = 'moored'; MO.lines = 4; }
      else if (d < 3){ MO.phase = 'lines'; MO.t = 0; MO.lines = 0; }   // brought in by the manoeuvring model: the lines go on
      else { MO.phase = 'in'; MO.t = 0; MO.from = {x:bv.px, z:bv.pz, h:bv.cog}; MO.path = pathM(berthPath({x:bv.px / 1000, y:bv.pz / 1000}, bp)); MO.dur = clamp(MO.path.len / 2.2, 6, 45); MO.lines = 0; }
      MO.init = true;
    }
    if (b.status === 'unmooring'){ MO.phase = 'out'; MO.lines = clamp(4 * (b.castUntil - S.t - currentFrac()) / CAST_MIN, 0, 4); MO.dep = {bp, pid:b.port, naust:berthKind(b) === 'naust'}; }
    if (MO.phase === 'in'){
      MO.t += at * sp; const u0 = clamp(MO.t / MO.dur, 0, 1);
      // along the way in (clear of land, piers and the unit's quay), turning to lie along the quay at the end
      if (MO.path){ const u = u0 * u0 * (3 - 2 * u0), q = pathAt(MO.path, u * MO.path.len); bv.px = q.x; bv.pz = q.z; bv.cog += angDiff(bv.cog, u0 > 0.9 ? bp.hd : q.h) * Math.min(1, at * 3); bv.spd = MO.path.len * 6 * u0 * (1 - u0) * sp / MO.dur; bv.yr = 0; }
      else approach(MO.from, bp, u0, sp / MO.dur);
      if (u0 >= 1){ MO.phase = 'lines'; MO.t = 0; bv.cog = bp.hd; }
    } else {
      if (MO.phase === 'lines'){ MO.t += at * sp; MO.lines = Math.min(4, MO.t / LINE_S); if (MO.lines >= 4) MO.phase = 'moored'; }
      // lying alongside: held in place by the lines, the swell moves her a little
      lieAlongside(at, bp);
    }
  }
  // the lines from the boat's cleats to the bollards on the quay, sagging when slack; the tide makes them slack or tight
  function drawMooring(BMrel, eye, VP, t){
    const bp = berthNow(); if (!bp || !ROPEM) return;
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, mid = (G.bow + G.stern) / 2;
    nSetup(VP);
    if (MO.phase !== 'in' || MO.t / MO.dur > 0.55) for (const z of [G.bow * 0.45, mid, G.stern * 0.55]){
      drawN(FENDM, chain(BMrel, M4.T(sx * 0.95 + 0.12, gw - 0.45, z))); drawN(ROPEM, chain(BMrel, limbM([sx * 0.95 + 0.12, gw - 0.2, z], [sx * 0.9, gw, z], 0.012)));
    }
    const bl = QB[faceKey(bp.face)]; if (!bl || !bl.length || MO.lines <= 0) return;
    const X = bp.x * 1000, Z = bp.y * 1000, f = bp.fwd, near = (tx, tz) => bl.reduce((a, q) => Math.hypot(q.x - tx, q.z - tz) < Math.hypot(a.x - tx, a.z - tz) ? q : a, bl[0]);
    const fore = near(X + f.x * (bp.Lb / 2 + 2.5), Z + f.z * (bp.Lb / 2 + 2.5)), aft = near(X - f.x * (bp.Lb / 2 + 2.5), Z - f.z * (bp.Lb / 2 + 2.5));
    const cleat = {bow:[sx * 0.55, gw + 0.05, G.bow + 0.4], mid:[sx * 0.95, gw + 0.05, mid], stern:[sx * 0.8, gw + 0.05, G.stern - 0.35]};
    const LINES = [['mid', aft], ['bow', fore], ['stern', aft], ['mid', fore]];
    for (let i = 0; i < 4; i++){
      const p = clamp(MO.lines - i, 0, 1); if (p <= 0) continue;
      const A = xf(BMrel, cleat[LINES[i][0]]), q = LINES[i][1], Bq = [q.x - eye[0], QTOP + 0.42 - eye[1], q.z - eye[2]];
      const d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]);
      let E = Bq, sag;
      if (p < 1){ E = [A[0] + (Bq[0] - A[0]) * p, A[1] + (Bq[1] - A[1]) * p + Math.sin(Math.PI * p) * 1.4, A[2] + (Bq[2] - A[2]) * p]; sag = 0.6 * (1 - p) + 0.1; MO.len[i] = 0; }
      else { if (!MO.len[i]) MO.len[i] = d * 1.03; const slack = MO.len[i] - d; sag = slack > 0 ? Math.sqrt(3 * d * slack / 8) : 0.01 * d; }
      const dd = Math.hypot(E[0] - A[0], E[1] - A[1], E[2] - A[2]); let prev = A;
      for (let k = 1; k <= 8; k++){ const s2 = k / 8, P = [A[0] + (E[0] - A[0]) * s2, A[1] + (E[1] - A[1]) * s2 - sag * 4 * s2 * (1 - s2) * Math.min(1, dd / Math.max(d, 0.1)), A[2] + (E[2] - A[2]) * s2]; drawN(ROPEM, limbM(prev, P, 0.02)); prev = P; }
    }
  }
