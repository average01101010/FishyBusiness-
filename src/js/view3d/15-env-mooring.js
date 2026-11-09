  // ---------- environment ----------
  const PAL = [[-18,[0.006,0.012,0.035],[0.02,0.035,0.07]], [-9,[0.02,0.04,0.1],[0.08,0.1,0.18]], [-3,[0.1,0.16,0.33],[0.5,0.4,0.5]], [2,[0.28,0.42,0.7],[0.93,0.68,0.5]], [9,[0.3,0.52,0.8],[0.76,0.83,0.9]], [25,[0.25,0.49,0.82],[0.68,0.8,0.92]]];
  function pal(el){
    if (el <= PAL[0][0]) return [PAL[0][1], PAL[0][2]];
    for (let i = 0; i < PAL.length - 1; i++){ const a = PAL[i], b = PAL[i + 1]; if (el <= b[0]){ const t = (el - a[0]) / (b[0] - a[0]); return [mix3(a[1], b[1], t), mix3(a[2], b[2], t)]; } }
    const L = PAL[PAL.length - 1]; return [L[1], L[2]];
  }
  // How wet the ground is and how much fresh snow lies on what is built (G6), from the shared clock as everything else is: the rain of the
  // last three hours, each ten minutes' as much as it rained (sleet and snow less) and dried out over about an hour and a half (the wind
  // dries faster); the snow that fell under 0 °C in the last 12 hours, going in mild weather. Worked out again each game minute.
  const WETQ = {m:-1, wet:0, fresh:0};
  function wetSet(H){
    const m = Math.floor(H * 60);
    if (m !== WETQ.m){ WETQ.m = m; let w = 0, f = 0;
      for (let k = 0; k <= 18; k++){ const h = H - k / 6, pr = precipAt(h), tp = airTemp(h); if (pr < 0.04) continue;
        const dry = Math.exp(-k / 6 / (1.5 / (1 + Math.max(0, windAt(h) - 6) / 10)));
        w = Math.max(w, Math.min(1, pr * 1.8) * (tp > 1 ? 1 : 0.5) * dry); }
      for (let k = 0; k <= 24; k++){ const h = H - k / 2, pr = precipAt(h); if (pr < 0.08 || airTemp(h) > 0.5) continue; f = Math.max(f, Math.min(1, pr * 2) * Math.exp(-k / 2 / 10)); }
      WETQ.wet = w; WETQ.fresh = f * (env.temp > 2 ? 0.2 : 1); }
    env.wet = WETQ.wet;
    // the snow on quays, breakwaters and roofs: the shore's (the snow line under the sea), or the fresh fall
    env.snowC = Math.max(snowNow == null ? 0 : clamp(1 - snowNow / 60, 0, 1) * 0.6, WETQ.fresh * 0.95);   // (the old snow on a quay or a road is cleared and trodden; the fresh fall lies white)
  }
  const CDR = {t:0, d:[0, 0, 1700, 2900]};   // the drift of the cloud on the fells (two layers, m), see computeEnv
  function computeEnv(H){
    // the sun's and the moon's true azimuths onto the grid the world is drawn on
    const s = sunAt(H), el = s.el, er = el * DEG, gz = gridGamma({x:bv.x / 1000, y:bv.z / 1000}) * DEG, saz = s.az - gz; env.el = el;
    env.sunDir = [Math.cos(er) * Math.sin(saz), Math.sin(er), -Math.cos(er) * Math.cos(saz)];
    const ly = Math.max(env.sunDir[1], 0.25), ll = Math.hypot(env.sunDir[0], ly, env.sunDir[2]); env.lightDir = [env.sunDir[0] / ll, ly / ll, env.sunDir[2] / ll];
    env.cloud = cloudAt(H); env.precip = precipAt(H); env.temp = airTemp(H); env.vis = visibility(H); env.aur = auroraAt(H);
    wetSet(H);
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
    // the layer's thickness (02.11.2026): about 450 m in a sky just grey enough to lay it on the fells, to some 1 500 m under a full
    // overcast, so in a thin layer the highest tops stand above it, as they do on the coast
    env.cthick = 450 + 1100 * sstep(0.7, 1, env.cloud);
    env.ccol = hor.map(v => v * 0.86);
    // the cloud on the fells drifts downwind, gathered frame by frame in real seconds (as the sky's clouds, cloudStep): two layers, one at
    // a fifth of the wind and one slower and veered 30 degrees, so its edge changes shape slowly. (Before 02.11.2026 it was the shared
    // clock's hours times the wind now: a change of the wind of a hundredth of a m/s moved the cloud hundreds of metres, and on the fells
    // it boiled from frame to frame with the camera still. Jonas' video.) The noise repeats at 4096 m, so the wrap is seamless.
    { const now = performance.now(), dt = CDR.t ? Math.min(0.25, Math.max(0, (now - CDR.t) / 1000)) : 0; CDR.t = now;
      const wd = env.windDir || [1, 0], w = clamp(env.wind != null ? env.wind : windAt(H), 0, 30), ra = (0.3 + 0.2 * w) * dt, rb = (0.2 + 0.12 * w) * dt, c = 0.866, sn = 0.5;
      CDR.d[0] -= wd[0] * ra; CDR.d[1] -= wd[1] * ra; CDR.d[2] -= (wd[0] * c - wd[1] * sn) * rb; CDR.d[3] -= (wd[1] * c + wd[0] * sn) * rb;
      for (let i = 0; i < 4; i++) CDR.d[i] = ((CDR.d[i] % 4096) + 4096) % 4096;
      env.cdrift = CDR.d; }
    env.stars = sstep(-5, -12, el) * (1 - env.cloud); env.spec = sstep(-1, 4, el) * (1 - env.cloud) * 2.2;
    env.night = sstep(3, -5, el);
    // moon: where it is, how full, and the light it gives at night
    const mo = moonAt(H), mr = mo.el * DEG; env.moon = mo; env.moonDir = [Math.cos(mr) * Math.sin(mo.az - gz), Math.sin(mr), -Math.cos(mr) * Math.cos(mo.az - gz)];
    env.moonA = sstep(-1, 2, mo.el) * (1 - 0.6 * env.day);
    const mlight = sstep(0, 8, mo.el) * mo.illum * sstep(-2, -8, el) * (1 - 0.8 * env.cloud);
    if (mlight > 0.02){ const ml = [0.62, 0.7, 0.9].map(v => v * mlight * 0.32); env.sunCol = env.sunCol.map((v, k) => v + ml[k]); env.amb = env.amb.map((v, k) => v + [0.02, 0.025, 0.04][k] * mlight); const my = Math.max(env.moonDir[1], 0.25), mll = Math.hypot(env.moonDir[0], my, env.moonDir[2]); env.lightDir = [env.moonDir[0] / mll, my / mll, env.moonDir[2] / mll]; }
    env.shadowDir = el > -1 ? env.sunDir : mlight > 0.02 ? env.moonDir : null;
    env.tide = tideH(H);
    const sn = Math.round(snowLine(H) / 20) * 20, rk = ruskNow(), gn = grassNow() + rk[0] * 10 + rk[1] * 100; if (sn !== snowNow || gn !== grassAt){ snowNow = sn; grassAt = gn; recolorAll(sn); }   // (a slice a frame: 04-vec-packs.js)
  }


  // ---------- mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off) ----------
  // (OB2, Jonas 09.11.2026, docs/planer/om-bord.md F1: the lines do not fly by themselves. The fenders are hung out by the hands on the
  // way in, on the side to the quay; each line goes on when its hand stands at its cleat, thrown from there to the bollard; casting off
  // they come in again, and the fenders and the coiled lines are taken in on her way out. The hands are the station 'fort' of the core
  // (13-work.js), walked to their places by deckcrew.js; without them (the hand-worked boats, no deck crew) it goes on a timer as before)
  const MO = {key:'', phase:'', t:0, from:null, dur:0, lines:0, len:[0, 0, 0, 0], init:false, fend:[0, 0, 0], fwait:[0, 0, 0], lwait:0, coil:0, cwait:0, side:1, vp:null, rt:0};
  const LINE_S = 1.6, LINE_WAIT = 8, FEND_S = 0.9, FEND_WAIT = 6;   // seconds for a line to be thrown and made fast; how long one waits for its hand; the same for a fender
  const LINE_CL = ['mid', 'bow', 'stern', 'mid'];   // the cleat of each line, in the order they go on: aft spring, bow line, stern line, fore spring
  const moorHandsN = () => typeof CREW3D !== 'undefined' && CREW3D.on() ? CREW3D.moorHands() : 0;
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
      const gt = S.t + currentFrac(), A = berthPose(b.port, vtype(), sh.from) || bp; if (!MO.init) MO.fend = [1, 1, 1]; MO.key = key; MO.init = true; MO.sh = true;
      if (gt < sh.castUntil){ MO.phase = 'out'; MO.lines = clamp(4 * (sh.castUntil - gt) / CAST_MIN, 0, 4); lieAlongside(dt, A); return; }
      if (gt < sh.arriveAt){ MO.phase = 'in'; MO.lines = 0; MO.len = [0, 0, 0, 0]; const span = sh.arriveAt - sh.castUntil; approach({x:A.x * 1000, z:A.y * 1000, h:A.hd}, bp, clamp((gt - sh.castUntil) / span, 0, 1), GAME_RATE * (S.mult || 1) / 60 / span); return; }
      MO.phase = 'lines'; MO.lines = clamp(4 * (gt - sh.arriveAt) / Math.max(0.1, sh.until - sh.arriveAt), 0, 4); lieAlongside(dt, bp); return;
    }
    if (MO.sh){ MO.sh = false; MO.phase = 'moored'; MO.lines = 4; }   // the move is over: she is made fast
    if (MO.key !== key){
      const d = Math.hypot(bv.px - X, bv.pz - Z); MO.key = key; MO.len = [0, 0, 0, 0];
      if (b.status === 'unmooring' || !MO.init){ MO.phase = 'moored'; MO.lines = 4; MO.fend = [1, 1, 1]; }
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
      if (MO.phase === 'lines'){ MO.t += at * sp; const i = Math.min(3, Math.floor(MO.lines)), hn = moorHandsN();
        // (the next line goes when its hand is at its cleat, or after a while without: a hand who cannot get there)
        if (!hn || CREW3D.moorMan().has('c:' + LINE_CL[i]) || (MO.lwait += at * sp) > LINE_WAIT){ MO.lines = Math.min(4, MO.lines + at * sp / LINE_S); if (Math.floor(MO.lines) > i) MO.lwait = 0; }
        if (MO.lines >= 4){ MO.phase = 'moored'; MO.lwait = 0; } }
      // lying alongside: held in place by the lines, the swell moves her a little
      lieAlongside(at, bp);
    }
  }
  // ---- where the work with the lines and the fenders is in the view, every frame (OB2): the spell as the view has it ('prep' and 'in' the
  // fenders out on the way in, 'lines', 'out', 'stow' the fenders and the lines in on the way out, null lying made fast or at sea), the
  // fenders hung out or taken in as their hand gets to them, and what is left told to the deck crew (deckcrew.js setMoor)
  function moorView(){
    const b = S.boat, mp = typeof moorPhase === 'function' ? moorPhase(b) : null;
    if (b.status === 'port' || b.status === 'unmooring'){
      if (b.status === 'unmooring' || MO.phase === 'out') return 'out';
      if (MO.key !== S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0)) return MO.init ? 'in' : null;   // (a new arrival the view has not taken in yet: on her way in to the berth)
      return MO.phase === 'in' || MO.phase === 'lines' ? MO.phase : null; }
    if (mp === 'prep' || mp === 'stow') return mp;
    return MO.fend.some(f => f > 0) || MO.coil < 1 && MO.vp === 'stow' ? 'stow' : null;   // (still taking them in)
  }
  function moorTick(bp){
    const now = performance.now() / 1000, dt = MO.rt ? clamp(now - MO.rt, 0, 0.5) * Math.max(1, S.mult || 1) : 0; MO.rt = now;
    const b = S.boat; if (b.status !== 'port' && b.status !== 'unmooring') MO.lines = 0;   // (at sea all the lines are in)
    const vp = moorView(), out = vp === 'prep' || vp === 'in' || vp === 'lines' || vp === 'out' || (vp == null && (b.status === 'port' || b.status === 'unmooring'));
    if (bp) MO.side = bp.side || 1;
    if (vp !== MO.vp){ if (vp === 'stow') MO.coil = 0; MO.vp = vp; MO.cwait = 0; }
    const hn = moorHandsN(), man = hn ? CREW3D.moorMan() : null, ord = out ? [1, 2, 0] : [2, 1, 0];
    // each fender as its hand gets to it (without hands, one after the other); out on the way in and lying, in on the way out
    let first = true;
    for (const k of ord){ const f = MO.fend[k], tg = out ? 1 : 0; if (f === tg){ MO.fwait[k] = 0; continue; }
      if (hn ? man.has('f' + k) || (MO.fwait[k] += dt) > FEND_WAIT : first) MO.fend[k] = clamp(f + (tg - f > 0 ? 1 : -1) * dt / FEND_S, 0, 1);
      first = false; }
    // the lines coiled and stowed once the fenders are in
    if (vp === 'stow' && !MO.fend.some(f => f > 0) && MO.coil < 1 && (!hn || man.has('coil') || (MO.cwait += dt) > FEND_WAIT)) MO.coil = Math.min(1, MO.coil + dt / 4);
    if (vp === 'stow' && !MO.fend.some(f => f > 0) && MO.coil >= 1) MO.vp = null;
    // what is left, in order, for the hands
    if (typeof CREW3D === 'undefined' || !CREW3D.on()) return;
    const need = [];
    if (vp === 'prep' || vp === 'in'){ for (const k of [1, 2, 0]) if (MO.fend[k] < 1) need.push('f' + k); need.push('c:mid', 'c:bow'); }
    else if (vp === 'lines'){ for (let i = Math.min(3, Math.floor(MO.lines)); i < 4; i++) need.push('c:' + LINE_CL[i]); }
    else if (vp === 'out'){ for (let i = Math.min(3, Math.ceil(MO.lines) - 1); i >= 0; i--) need.push('c:' + LINE_CL[i]); }
    else if (vp === 'stow'){ for (const k of [2, 1, 0]) if (MO.fend[k] > 0) need.push('f' + k); if (MO.coil < 1) need.push('coil'); }
    CREW3D.setMoor({phase:vp, side:MO.side, need});
  }
  // a coiled line hanging inside the rail at its cleat (on the way in until it is thrown, and once it is in until it is stowed)
  function drawCoil(BMrel, P, sd){
    const c = [P[0] - sd * 0.12, P[1] - 0.24, P[2]], R = 0.15; let prev = null;
    for (let k = 0; k <= 10; k++){ const a = k / 10 * Math.PI * 2, Q = xf(BMrel, [c[0], c[1] + Math.cos(a) * R, c[2] + Math.sin(a) * R]); if (prev) drawN(ROPEM, limbM(prev, Q, 0.022)); prev = Q; }
  }
  // the lines from the boat's cleats to the bollards on the quay, sagging when slack; the tide makes them slack or tight
  function drawMooring(BMrel, eye, VP, t){
    if (!ROPEM) return; const bp = berthNow(); moorTick(bp);
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, sd = MO.side || 1, Sp = moorSpots(G, sd), vp = MO.vp;
    const coils = vp === 'prep' || vp === 'in' || vp === 'lines' || vp === 'out' || (vp === 'stow' && MO.coil < 1);
    if (!bp && !coils && !MO.fend.some(f => f > 0)) return;
    nSetup(VP);
    // the fenders: lifted over the rail and lowered on their lines to hang over the side, or taken in again
    for (let k = 0; k < 3; k++){ const f = MO.fend[k]; if (f <= 0.02) continue; const H = Sp.fend[k], u = f * f * (3 - 2 * f), I = [sd * sx * 0.6, gw + 0.12, H[2]];
      const P = [I[0] + (H[0] - I[0]) * u, I[1] + (H[1] - I[1]) * u, H[2]];
      drawN(FENDM, chain(BMrel, M4.T(P[0], P[1], P[2]))); drawN(ROPEM, chain(BMrel, limbM([P[0], P[1] + 0.25, P[2]], [sd * sx * 0.9, gw, P[2]], 0.012))); }
    if (coils) for (let i = 0; i < 4; i++) if (MO.lines - i <= 0){ const C = Sp.cleat[LINE_CL[i]]; drawCoil(BMrel, i === 3 ? [C[0], C[1], C[2] - 0.38] : C, sd); }
    if (!bp) return;
    const bl = QB[faceKey(bp.face)]; if (!bl || !bl.length || MO.lines <= 0) return;
    const X = bp.x * 1000, Z = bp.y * 1000, f = bp.fwd, near = (tx, tz) => bl.reduce((a, q) => Math.hypot(q.x - tx, q.z - tz) < Math.hypot(a.x - tx, a.z - tz) ? q : a, bl[0]);
    const fore = near(X + f.x * (bp.Lb / 2 + 2.5), Z + f.z * (bp.Lb / 2 + 2.5)), aft = near(X - f.x * (bp.Lb / 2 + 2.5), Z - f.z * (bp.Lb / 2 + 2.5));
    const cleat = Sp.cleat, LINES = [['mid', aft], ['bow', fore], ['stern', aft], ['mid', fore]];
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
