  // ---------- cinema (the user's wish 03.10.2026; a director of fourteen shots 01.11.2026) ----------
  // «Kino» lets the camera film the trip by itself, for the game's trailer clips (Jonas 01.11.2026: «det må se bra ut»). A shot lasts
  // 8-20 s and is picked by weight from fourteen kinds, by where she is: near land the landscape shots come up (a high vista over the
  // boat towards the mountains, a crane that rises and opens on them, a pull-back from close on the boat to far out over the fjord, a
  // dolly zoom that draws the land in behind her, a long lens from the side with the land sliding by behind), out at sea the shots
  // round the boat (a drone circling, low along the side at the waterline, a push-in from ahead, a pass-by that pans as she goes,
  // a chase over the wake, straight down from above, a fly-over from bow to stern, and a camera left behind as she sails off). Each
  // shot moves on an eased path, the lens zooms in some (the shore's and the pass-by's follow her size), the horizon stays level, and
  // the low ones shake a little as if held by hand. No kind comes twice within five shots. A shot whose eye would be in the land, or with
  // the land, a building or a boat between it and her, at its start, middle or end, is passed over; one that loses her for a second
  // cuts to the next.
  const KINO = {on:false, shot:null, n:0, eye:null, tgt:null, fov:50, near:0.25, last:[], land:null, log:[]};
  // weight at sea, weight by land, the length (s) and whether she must be under way
  const KSHOT = {
    drone:  {sea:3,   land:2,   dur:[12, 18]}, low:   {sea:3,   land:1.5, dur:[9, 14]},  ahead:  {sea:2.5, land:1.5, dur:[10, 14]},
    pass:   {sea:2,   land:2,   dur:[8, 11], go:1}, shore:{sea:0.3, land:2.5, dur:[11, 16]}, chase:{sea:2,   land:1,   dur:[10, 14]},
    vista:  {sea:0,   land:4,   dur:[14, 20]}, reveal:{sea:0.6, land:3,   dur:[12, 16]}, pullback:{sea:0.8, land:3, dur:[14, 20]},
    vertigo:{sea:0.8, land:2,   dur:[8, 11]},  top:   {sea:1.5, land:1,   dur:[10, 14]}, flyover:{sea:1.5, land:1.5, dur:[10, 13]},
    profile:{sea:1,   land:2.5, dur:[12, 16]}, away:  {sea:1,   land:2,   dur:[10, 14], go:1}};
  const KTYPES = Object.keys(KSHOT);
  const kEase = s => s * s * (3 - 2 * s), kSine = s => 0.5 - 0.5 * Math.cos(Math.PI * clamp(s, 0, 1));
  // where the land is round her: the nearest land in 24 directions out to 3.5 km; its share of the round, the way to it (weighted by
  // nearness and height), the nearest and the highest
  function kinoLand(){
    let sx = 0, sz = 0, n = 0, near = 1e9, hmax = 0;
    for (let a = 0; a < 24; a++){ const A = a / 24 * 6.2832, dx = Math.sin(A), dz = -Math.cos(A);
      for (const d of [250, 500, 900, 1500, 2400, 3500]){ const h = terrH(bv.x + dx * d, bv.z + dz * d); if (h > 2){ const w = (1 + Math.min(h, 400) / 80) * 500 / d; sx += dx * w; sz += dz * w; n++; near = Math.min(near, d); hmax = Math.max(hmax, h); break; } } }
    const l = Math.hypot(sx, sz); return {score:n / 24, l:clamp(n / 24 * 3, 0, 1), dx:l > 1e-6 ? sx / l : Math.sin(bv.head), dz:l > 1e-6 ? sz / l : -Math.cos(bv.head), near, hmax, any:n > 0};
  }
  // nothing of the ground between a and b (the eye and her)
  function kinoSight(a, b){
    for (let i = 1; i <= 12; i++){ const k = i / 13 * 0.94, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, z = a[2] + (b[2] - a[2]) * k; if (terrH(x, z) > y - 0.4) return false; }
    return true;
  }
  // the eye, the aim and the lens (degrees) of shot K at time t, round the boat B (bv, or where she will be); 'fixed' shots stand in the world
  function kinoWant(K, t, B){
    B = B || bv;
    const L = Math.max(5, (VESSELS[vtype()] || {}).len || 6), C = [B.x, B.y + 1.2, B.z], fx = Math.sin(B.head), fz = -Math.cos(B.head), rx = Math.cos(B.head), rz = Math.sin(B.head), s = K.side, u = t - K.t0, p = clamp(u / K.dur, 0, 1), tide = env.tide || 0;
    const sea = (x, z) => Math.max(terrH(x, z), seaH(x, z, t));
    // low: over the waves where it stands (it rides them as a boat would); high: over the still sea and well clear of the ground
    const lo = (x, z, h) => [x, sea(x, z) + h, z], hi = (x, z, h) => [x, Math.max(tide + h, terrH(x, z) + h * 0.6), z];
    const rel = (a, b) => [C[0] + fx * a + rx * b, C[2] + fz * a + rz * b];   // a ahead, b to starboard
    const LD = K.ld || [fx, fz], PD = [-LD[1], LD[0]];                     // the way to the land, and across it
    const shake = (g, amp) => { const d = Math.hypot(g[0] - C[0], g[2] - C[2]) + 20, a = amp * d; return [g[0] + a * (Math.sin(u * 1.31 + K.a0) + 0.5 * Math.sin(u * 2.93)), g[1] + a * 0.7 * (Math.sin(u * 1.07 + 2) + 0.4 * Math.sin(u * 3.7)), g[2] + a * Math.sin(u * 1.71 + 4)]; };
    const ahead = k => [C[0] + fx * k, C[1], C[2] + fz * k];
    switch (K.type){
      case 'drone': { const a = K.a0 + s * (u * 0.05 + 0.02 * u * u / K.dur), R = 45 + L * 3, h = 24 + L + u * 0.6; return [hi(C[0] + Math.sin(a) * R, C[2] - Math.cos(a) * R, h), ahead(L * 0.6), 50 - 6 * kSine(p)]; }
      case 'low': { const q = rel(-L * (0.3 - u * 0.02), s * (L * 0.35 + 5)); return [lo(q[0], q[1], 0.9), shake(ahead(L * 0.4), 0.0025), 55]; }
      case 'ahead': { const d = L * 2.6 + 32 - (L * 0.8 + 16) * kSine(p), q = rel(d, s * 5); return [lo(q[0], q[1], 2.6), C, 45 - 5 * kSine(p)]; }
      // a long lens from the shore: the frame some four boat lengths high wherever she is, creeping in to three
      case 'shore': { const e = [K.px, sea(K.px, K.pz) + 1.8, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, shake(C, 0.0006), clamp(2 * Math.atan((2 - 0.5 * kSine(p)) * L / Math.max(1, d)) / DEG, 5, 40), 1]; }
      // she comes at a camera by the course, low, and goes by close; it pans with her and the lens holds her size
      case 'pass': { const e = [K.px, sea(K.px, K.pz) + 1.6, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, shake(C, 0.0015), clamp(2 * Math.atan(2.6 * L / Math.max(1, d)) / DEG, 20, 62), 1]; }
      // left behind: she sails off into the picture, and the lens follows her out
      case 'away': { const e = [K.px, sea(K.px, K.pz) + 9, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, shake(ahead(L * 0.5), 0.0008), clamp(2 * Math.atan(3.5 * L / Math.max(1, d)) / DEG, 6, 52), 1]; }
      case 'chase': { const q = rel(-(L * 3 + 18), Math.sin(u * 0.35 + K.a0) * 6); return [hi(q[0], q[1], 7 + L * 0.3), ahead(30), 50]; }
      // the vista: high on the sea side of her, looking past her at the land, trucking slowly across it (the near hills slide against the far)
      case 'vista': { const R = clamp(K.near * 0.5 + 200, 250, 700), H = clamp(R * 0.45 + K.hmax * 0.3, 90, 380) * (1.08 - 0.12 * p), w = (p - 0.5) * R * 0.5 * s + R * 0.4 * s;
        return [hi(C[0] - LD[0] * R + PD[0] * w, C[2] - LD[1] * R + PD[1] * w, H), [C[0] + LD[0] * R * 0.6, tide + K.hmax * 0.15, C[2] + LD[1] * R * 0.6], 56]; }
      // the crane: from low behind her it rises and draws back, and the aim lifts from her to the land beyond
      case 'reveal': { const a = Math.atan2(-LD[0], LD[1]) + s * 0.5, q = kSine(p), d = 24 + 51 * q, h = 2.5 + 45.5 * kEase(p), dx = -Math.sin(a), dz = Math.cos(a);
        return [hi(C[0] - dx * d, C[2] - dz * d, h), [C[0] + LD[0] * 200 * q, C[1] + (tide - C[1]) * q, C[2] + LD[1] * 200 * q], 48 + 12 * q]; }
      // the pull-back: from close on her out and up, until she is a speck in the fjord with the land behind her
      case 'pullback': { const q = kSine(p), a = Math.atan2(-LD[0], LD[1]) + s * 0.6, dx = -Math.sin(a), dz = Math.cos(a), R = K.R, d = L * 1.6 + 10 + (R - L * 1.6 - 10) * q, h = 3.5 + R * 0.42 * Math.pow(q, 1.2);
        return [hi(C[0] - dx * d, C[2] - dz * d, h), [C[0] + LD[0] * d * 0.3 * q, C[1], C[2] + LD[1] * d * 0.3 * q], 50]; }
      // the dolly zoom: back away while the lens closes, so she keeps her size and the land behind her swells
      case 'vertigo': { const a = Math.atan2(-LD[0], LD[1]) + s * 0.35, dx = -Math.sin(a), dz = Math.cos(a), D0 = L * 1.8 + 10, d = D0 * (1 + 2.2 * kSine(p));
        return [hi(C[0] - dx * d, C[2] - dz * d, 2.5 + d * 0.04), C, 2 * Math.atan(Math.tan(31 * DEG) * D0 / d) / DEG]; }
      // straight down from above, turning slowly and rising
      case 'top': { const a = K.a0 + u * 0.05 * s, h = 55 + L * 3 + (30 + L) * kSine(p), b = h * 0.22; return [hi(C[0] - Math.sin(a) * b, C[2] + Math.cos(a) * b, h), ahead(L * 0.3), 50]; }
      // the fly-over: from low ahead of her, up over her and down behind, ending as a high chase looking on along her course
      case 'flyover': { const q = kSine(p), q2 = rel((55 + L) - (100 + 2 * L) * q, s * 4 * q); return [hi(q2[0], q2[1], 6 + 16 * q + 14 * Math.sin(Math.PI * q)), ahead(70 * kEase(p)), 55]; }
      // from the side with a long lens, the land behind her sliding by
      case 'profile': { const D = 110 + L * 4, q = rel(D * 0.25 - D * 0.5 * p, s * D); return [lo(q[0], q[1], 3.5), shake(ahead(L * 0.3), 0.0005), clamp(2 * Math.atan(2.2 * L / D) / DEG, 10, 30)]; }
    }
    return [hi(C[0], C[2] + 50, 30), C, 50];
  }
  // the boat as she will be u seconds on along her heading
  const kinoAt = u => ({x:bv.x + Math.sin(bv.head) * (bv.spd || 0) * u, y:bv.y, z:bv.z - Math.cos(bv.head) * (bv.spd || 0) * u, head:bv.head});
  // a shot will do when its eye is clear of the ground (and over water if it is low), and nothing stands between it and her, at its
  // start, middle and end
  function kinoOk(K, t){
    for (const f of [0, 0.5, 1]){
      const B = kinoAt(K.dur * f), [e, g, , fixed] = kinoWant(K, t + K.dur * f, B), C = [B.x, B.y + 1.2, B.z], gr = terrH(e[0], e[2]);
      if (gr > e[1] - 0.5) return false;
      if (!fixed && e[1] - Math.max(gr, env.tide || 0) < 6 && gr > (env.tide || 0) - 0.3) return false;
      if (!kinoSight(e, C)) return false;
      if (!f && (camFree(C, e) < 0.9 || camFree(g, e) < 0.85)) return false;
    }
    return true;
  }
  function kinoMake(type, t, land){
    const n = ++KINO.n, D = KSHOT[type].dur, K = {type, t0:t, dur:D[0] + (D[1] - D[0]) * hash(n * 7 + 3), side:hash(n * 13 + 1) < 0.5 ? -1 : 1, a0:hash(n * 5 + 2) * 6.28, ld:[land.dx, land.dz], near:land.near < 1e8 ? land.near : 2000, hmax:land.hmax};
    const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), L = Math.max(5, (VESSELS[vtype()] || {}).len || 6), v = bv.spd || 0;
    // with the land to one side, the side shots stand on the sea side of her, so the land is behind her
    if (land.any && (type === 'profile' || type === 'low' || type === 'pass')){ const sd = Math.sign(land.dx * rx + land.dz * rz) || 1; K.side = type === 'profile' ? -sd : hash(n * 17) < 0.7 ? -sd : sd; }
    if (type === 'shore'){
      // a point 60-210 m off her course ahead, on the side with land if there is any near; the boat sails past it
      const ah = 90 + Math.max(0, v) * 6; let best = null;
      for (const off of [60, 110, 160, 210]){ for (const sd of [1, -1]){ const x = bv.x + fx * ah + rx * sd * off, z = bv.z + fz * ah + rz * sd * off; if (terrH(x, z) > 1.5){ best = [x, z]; break; } } if (best) break; }
      if (!best) best = [bv.x + fx * ah + rx * K.side * 70, bv.z + fz * ah + rz * K.side * 70];
      K.px = best[0]; K.pz = best[1];
    }
    // she comes by the camera half way through the shot
    if (type === 'pass'){ const A = clamp(v * K.dur * 0.5, 40, 600), o = L * 0.6 + 7; K.px = bv.x + fx * A + rx * K.side * o; K.pz = bv.z + fz * A + rz * K.side * o; }
    if (type === 'away'){ K.px = bv.x - fx * (L * 2 + 18) + rx * K.side * 8; K.pz = bv.z - fz * (L * 2 + 18) + rz * K.side * 8; }
    if (type === 'pullback') K.R = 500 + 400 * hash(n * 11 + 5) * (land.any ? 1 : 0.6);
    return K;
  }
  // the next shot: drawn by weight from the kinds that fit (not one of the last five, landscape shots only with land near), the first that
  // will do; want: a kind asked for (the tests, the trailer's harness), taken if it will do
  function kinoNext(t, want, why){
    const land = KINO.land = kinoLand(), v = bv.spd || 0, set = K => { KINO.log.push([K.type, why || 'end', Math.round(t)]); if (KINO.log.length > 40) KINO.log.shift(); KINO.shot = K; KINO.eye = null; KINO.eyeR = null; KINO.hid = 0; KINO.last.push(K.type); if (KINO.last.length > 5) KINO.last.shift(); };
    const fit = KTYPES.filter(k => (!KSHOT[k].go || v > 3) && (k !== 'vista' || land.any) && (KSHOT[k].sea * (1 - land.l) + KSHOT[k].land * land.l) > 0);
    if (want && fit.includes(want)){ const K = kinoMake(want, t, land); if (kinoOk(K, t)){ set(K); return; } }
    let pool = fit.filter(k => !KINO.last.includes(k)); if (!pool.length) pool = fit.filter(k => k !== KINO.last[KINO.last.length - 1]);
    for (let tries = 0; tries < 8 && pool.length; tries++){
      const w = pool.map(k => KSHOT[k].sea * (1 - land.l) + KSHOT[k].land * land.l), tot = w.reduce((a, b) => a + b, 0); let r = hash(KINO.n * 31 + tries * 7 + 11) * tot, i = 0;
      while (i < pool.length - 1 && r >= w[i]){ r -= w[i]; i++; }
      const K = kinoMake(pool[i], t, land); if (kinoOk(K, t)){ set(K); return; }
      pool.splice(i, 1);
    }
    set({type:'drone', t0:t, dur:12, side:1, a0:hash(KINO.n * 3) * 6.28});
  }
  // The eye and the aim are smoothed in the boat's frame (as offsets from her), so they keep up with her at the screen's speed (six
  // times real: 71 m/s at 23 knots); in the world's frame the filter of 0.7 s left them some 50 m behind her and she ran out of the
  // picture (the user 04.10.2026: «I cinematic-view vises som oftest ikke båten»). The cameras that stand in the world (shore, pass-by,
  // left behind) stand still and only their aim follows. The lens is smoothed too (0.5 s). A shot that loses her behind the land, a
  // building or a boat for a second cuts to the next.
  function kinoCam(t, rdt){
    if (!KINO.shot || t - KINO.shot.t0 > KINO.shot.dur || t < KINO.shot.t0) kinoNext(t, KINO.want, KINO.want ? 'want' : 'end'), KINO.want = null;
    const C = [bv.x, bv.y, bv.z], [e, g, fov, fixed] = kinoWant(KINO.shot, t), k = 1 - Math.exp(-Math.min(0.25, rdt) / 0.7), kf = 1 - Math.exp(-Math.min(0.25, rdt) / 0.5);
    const eW = fixed ? e : [e[0] - C[0], e[1] - C[1], e[2] - C[2]], gR = [g[0] - C[0], g[1] - C[1], g[2] - C[2]];
    if (!KINO.eyeR){ KINO.eyeR = eW.slice(); KINO.tgtR = gR.slice(); KINO.fov = fov; }
    for (let i = 0; i < 3; i++){ KINO.eyeR[i] += (eW[i] - KINO.eyeR[i]) * k; KINO.tgtR[i] += (gR[i] - KINO.tgtR[i]) * k; }
    if (fixed) KINO.eyeR = eW.slice();
    KINO.fov += (fov - KINO.fov) * kf;
    const eye = fixed ? KINO.eyeR.slice() : [KINO.eyeR[0] + C[0], KINO.eyeR[1] + C[1], KINO.eyeR[2] + C[2]], tgt = [KINO.tgtR[0] + C[0], KINO.tgtR[1] + C[1], KINO.tgtR[2] + C[2]];
    const gy = Math.max(terrH(eye[0], eye[2]), seaH(eye[0], eye[2], t)) + 0.6; if (eye[1] < gy) eye[1] = gy;
    const B = [C[0], C[1] + 1.2, C[2]];
    if (camFree(B, eye) < 0.6 || !kinoSight(eye, B)){ KINO.hid = (KINO.hid || 0) + rdt; if (KINO.hid > 1) kinoNext(t, null, (camFree(B, eye) < 0.6 ? 'box' : 'land')); } else KINO.hid = 0;
    // the near plane goes out with a high, far camera (the depth could not tell the sea from the shore a few km off; 23-camera-frame.js)
    const dB = Math.hypot(eye[0] - B[0], eye[1] - B[1], eye[2] - B[2]); KINO.near = clamp(Math.min(dB * 0.3, eye[1] - gy + 0.6) * 0.02, 0.25, 6);
    KINO.eye = eye; KINO.tgt = tgt;
    return {eye:eye.slice(), tgt, fov:KINO.fov};
  }
  // the main thread's time a frame takes (ms, smoothed; the GL commands are queued, so this is the JS side): with the frame rate it tells a
  // phone or a PC held back by the script from one held back by the graphics card (the devices' telemetry, 10f-cloud.js cloudDev)
  let JSMS = 0;
  // held while the pub's own 3D is shown (ui/09b-pub.js): no frames drawn, the loop keeps ticking
  let HOLD = false;
  // the way out of Father's naust at a new game's start (docs/onboarding.md B5, Jonas 09.10.2026): the eye starts on the naust's
  // quay in front of the door, with the boat right there, and glides back and up to its usual place behind her over a few seconds
  let INTRO = null;
  function introStart(sec){
    const n = typeof naustSite === 'function' ? naustSite() : null; if (!n || !n.o) return false;
    const N = [-n.u[1], n.u[0]], x = n.o[0] + N[0] * 2, z = n.o[1] + N[1] * 2;   // N: out to sea (07c-naust.js shoreSpot)
    INTRO = {t0:performance.now(), dur:sec || 5, e0:[x, Math.max(terrH(x, z), 0) + 2.4, z]}; cam.helm = false; return true;
  }
  let j0F = 0;
  // ---------- the picture watched (02.11.2026; Jonas: «Det er viktig at vi fanger opp så mye potensielle feil som oppstår så fort som
  // mulig») ----------
  // What goes wrong in the picture without throwing, sent like the other errors (ui/10f-cloud.js cloudErr: once a session each, with the
  // device), each with the graphics chip, the quality, the sea level and the view:
  // - GL errors: one frame each five seconds asks the driver twice: at the start (what came between the frames) and at one step of the
  //   frame (glChk), the next step each time round, so the step an error comes before is found within a few rounds. Each question waits
  //   for the GPU to finish what it was given, so a question after every step (twelve a frame) held a heavy frame up so long in
  //   SwiftShader that ultratest's screenshot did not come; two are nothing on a phone. On a GPU drawn by the CPU (SwiftShader, which
  //   Chrome also falls back to on a phone whose GPU it blocks; llvmpipe; Microsoft's basic renderer) even one question a round held
  //   ultratest's screenshot up for two minutes, so it is not asked there: that is the weakest device, and a stall costs most on it.
  //   (GFX.force: the test's way to ask all the same.)
  //   A wrong call leaves things out, black or in the wrong colour without stopping anything (the INVALID_OPERATION 1282 the tests
  //   saw after the pennants, which no player could tell us).
  // - NaN: the eye, the boat or the view matrix not a number, and the whole world or the boat is gone from the picture.
  // - The picture: every fifteen seconds nine points of it (a 3 x 3 grid) are read back. In daylight, black twice running, or one
  //   colour three times running in clear weather, is a picture that is not there (night, fog and the transitions are left out).
  // - A canvas of 0 px while the 3D view is on.
  const GFX = {probeAt:0, pixAt:0, black:0, flat:0, nan:false, px:new Uint8Array(4), tags:[], k:0, prev:"starten av rammen", pend:null, pbo:null, buf:null};
  const GLNAME = {1280:'INVALID_ENUM', 1281:'INVALID_VALUE', 1282:'INVALID_OPERATION', 1285:'OUT_OF_MEMORY', 1286:'INVALID_FRAMEBUFFER_OPERATION'};
  function gfxErr(msg, ctx){
    if (typeof cloudErr !== 'function') return;
    let base = {}; try { base = {lvl:QUAL.lvl, sea:seaLvl, gl2:GL2, w:canvas.width, h:canvas.height, view:KINO.on ? 'kino' : SHOW ? 'show' : PAINTV ? 'paint' : cam.helm ? 'helm' : 'cam', vis:env.vis, day:env.day}; } catch (e){}
    cloudErr(msg + ' · ' + GPU, 'view3d gfx', JSON.stringify(Object.assign(base, ctx || {})), 'gfx');
  }
  function glReport(e, tag){ GLPROBE = false; gfxErr('3D GL-feil ' + (GLNAME[e] || e) + ' ' + tag, {code:e, tag}); }
  // the step asked about this round (the steps are learnt from the frame itself, so a new step is asked about too)
  function glProbe(tag){
    if (!GFX.tags.includes(tag)) GFX.tags.push(tag);
    const want = GFX.tags[GFX.k % GFX.tags.length];
    if (tag !== want){ GFX.prev = tag; return; }
    GLPROBE = false; GFX.k++;
    const e = gl.getError(); if (e && e !== gl.CONTEXT_LOST_WEBGL) glReport(e, 'mellom ' + GFX.prev + ' og ' + tag);
  }
  function gfxStart(now){
    GLPROBE = false;
    if (GFX.soft === undefined && GPU) GFX.soft = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(GPU);
    if (GLCHK || (GFX.soft && !GFX.force) || now - GFX.probeAt < 5000 || gl.isContextLost()) return;
    GFX.probeAt = now; GLPROBE = true; GFX.prev = 'starten av rammen';
    const e = gl.getError(); if (e && e !== gl.CONTEXT_LOST_WEBGL) glReport(e, 'mellom rammene');
  }
  // what nine points of the picture say (also for the test): 'black' in daylight, 'flat' in daylight and clear weather, or ''
  function gfxJudge(px, day, vis){
    let mx = 0; const lo = [255, 255, 255], hi = [0, 0, 0];
    for (const p of px) for (let c = 0; c < 3; c++){ const v = p[c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; if (v > mx) mx = v; }
    if (!day) return {k:'', rgb:lo};
    if (mx < 10) return {k:'black', rgb:lo};
    return {k:Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) <= 2 && vis > 10 ? 'flat' : '', rgb:lo};
  }
  function gfxPix(j){
    GFX.black = j.k === 'black' ? GFX.black + 1 : 0; GFX.flat = j.k === 'flat' ? GFX.flat + 1 : 0;
    if (GFX.black === 2) gfxErr('3D svart skjerm på dagtid', {rgb:j.rgb});
    if (GFX.flat === 3) gfxErr('3D bildet er én farge på dagtid', {rgb:j.rgb});
  }
  // (before the camera is placed, from the boat and the camera's own numbers: a NaN there throws in the reads of the map that place
  // it, and the frame never gets to its end; after the frame, from the eye and the view matrix)
  function gfxNaN(eye, VPn){
    if (GFX.nan) return false;
    const fin = a => a.every(v => v === undefined || isFinite(v));
    const boat = fin([bv.x, bv.y, bv.z, bv.head, bv.pitch, bv.roll]), camOk = fin([cam.yaw, cam.pitch, cam.dist, cam.zoom, cam.hy, cam.hp]);
    if (boat && camOk && (!eye || (fin(eye) && fin([VPn[0], VPn[5], VPn[14]])))) return false;
    GFX.nan = true; const r = v => v === undefined ? null : isFinite(v) ? Math.round(v * 100) / 100 : String(v);
    gfxErr('3D NaN i ' + (!boat ? 'egen båt' : 'kameraet'), {eye:eye ? eye.map(r) : null, bv:{x:r(bv.x), y:r(bv.y), z:r(bv.z), head:r(bv.head), pitch:r(bv.pitch), roll:r(bv.roll), v:r(bv.v)},
      cam:{helm:!!cam.helm, dist:r(cam.dist), pitch:r(cam.pitch), yaw:r(cam.yaw), zoom:r(cam.zoom), hy:r(cam.hy), hp:r(cam.hp)}, kino:!!KINO.on});
    return true;
  }
  function gfxEnd(now, eye, VPn, W, Hh){
    if (GLPROBE){ glChk('slutten av rammen'); GLPROBE = false; }
    gfxNaN(eye, VPn);
    if (gl.isContextLost()){ GFX.pend = null; GFX.pbo = null; return; }
    // the nine points are read without waiting for the GPU where it can (WebGL 2): into a buffer, with a fence, and taken out a few frames
    // later when the fence says the GPU is done. A read that waits (readPixels into memory) held the frame until the GPU had drawn it,
    // which on a GPU drawn by the CPU stopped ultratest's screenshot; WebGL 1 reads that way, but not on such a GPU.
    if (GFX.pend){
      const P = GFX.pend, st = gl.clientWaitSync(P.sync, 0, 0);
      if (st === gl.TIMEOUT_EXPIRED && now - P.t < 5000) return;
      if (st === gl.ALREADY_SIGNALED || st === gl.CONDITION_SATISFIED){
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, GFX.pbo); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, GFX.buf); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        const px = []; for (let i = 0; i < 9; i++) px.push([GFX.buf[i * 4], GFX.buf[i * 4 + 1], GFX.buf[i * 4 + 2]]);
        gfxPix(gfxJudge(px, P.day, P.vis));
      }
      gl.deleteSync(P.sync); GFX.pend = null; return;
    }
    // (not on a GPU drawn by the CPU either: there the read into a buffer waits all the same, a frame of seconds that made skytest's
    // clouds jump ahead; GFX.force for the test)
    if (now - GFX.pixAt < 15000 || INTRO || (GFX.soft && !GFX.force)) return;
    GFX.pixAt = now;
    if (!W || !Hh){ gfxErr('3D lerretet er 0 px', {cw:canvas.clientWidth, ch:canvas.clientHeight}); return; }
    const day = env.night < 0.2 && env.day > 0.8, vis = env.vis || 0, at = [];
    for (const gy of [0.2, 0.5, 0.8]) for (const gx of [0.2, 0.5, 0.8]) at.push([Math.floor(W * gx), Math.floor(Hh * gy)]);
    if (GL2 && gl.fenceSync){
      if (!GFX.pbo){ GFX.pbo = gl.createBuffer(); GFX.buf = new Uint8Array(36); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, GFX.pbo); gl.bufferData(gl.PIXEL_PACK_BUFFER, 36, gl.STREAM_READ); }
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, GFX.pbo);
      at.forEach(([x, y], i) => gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, i * 4));
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      GFX.pend = {sync:gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0), t:now, day, vis};
      return;
    }
    const px = at.map(([x, y]) => { gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, GFX.px); return [GFX.px[0], GFX.px[1], GFX.px[2]]; });
    gfxPix(gfxJudge(px, day, vis));
  }
  // The frame's clock (tilbakemelding #106, 01.11.2026: «litt hakkete» in Firefox, 5120 x 1440 at 240 Hz): the browsers give the time in
  // whole milliseconds or a little finer (Firefox, reduced timer precision), so at 4.2 ms a frame the steps read 4 or 5 ms and the
  // world moved by a fifth more or less each frame. FCLK follows the screen's beat instead: the next frame is expected one period on,
  // and the clock is pulled an eighth of the way to what the browser says; a skipped frame counts as whole periods, and a hitch or an uneven frame rate (off by more than 2.5 ms, or 0.6 of a period)
  // takes the browser's time as it is. WALLF (core/01-world.js) is the same moment on Date.now()'s scale, for the boat's pose between
  // the model's steps (dynPose) and the game time between the minutes (currentFrac), while this frame is drawn.
  const FCLK = {r:0, raw:0, p:0, off:0};
  function frameClock(raw){ const C = FCLK, d = raw - C.raw, w = Date.now() - raw;
    C.off = !C.off || Math.abs(w - C.off) > 50 ? w : C.off + (w - C.off) * 0.02;
    if (!C.r || d <= 0 || d > 250){ C.r = C.raw = raw; C.p = 0; return raw; }
    C.raw = raw; if (!C.p){ C.p = d; C.r = raw; return raw; }
    // (a frame the browser skipped is a whole number of periods, k, and leaves the period as it was)
    const k = Math.max(1, Math.round((raw - C.r) / C.p)), pred = C.r + k * C.p, err = raw - pred;
    if (Math.abs(err) < Math.min(C.p * 0.6, 2.5)){ C.r = pred + err * 0.12; if (k === 1) C.p += (d - C.p) * 0.03; } else { C.r = raw; C.p += (d - C.p) * 0.1; }
    return C.r; }
  let FRAMEP = 0;
  function frame(){ const j0 = j0F = performance.now(), EQ0 = S.equip, TE = tryEq(); if (TE) S.equip = TE;
    FRAMEP = /rawclock/.test(location.hash) ? j0 : frameClock(j0); WALLF = /rawclock/.test(location.hash) ? 0 : FRAMEP + FCLK.off;
    try { frame0(); } finally { S.equip = EQ0; WALLF = 0; FRAMEP = 0; }
    JSMS = JSMS ? JSMS * 0.92 + (performance.now() - j0) * 0.08 : performance.now() - j0; }
  let FRAMEN = 0;
  function frame0(){ FRAMEN++;
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden || NO3D || HOLD) return;
    resize(); gfxStart(performance.now());
    // the first frame after the view is shown or let go (lastF 0, view3d/25-controls.js) counts as one frame at 60 a second: measured
    // from the call that started it, it read a fraction of a millisecond, and the frame rate's average (FPS.v) started at thousands
    // and took a minute to come down under SwiftShader (the frame clock's first try, 02.11.2026: FPS.v 200-570 against 18-83)
    if (!lastF) lastF = (FRAMEP || performance.now()) - 1000 / 60;
    const now = FRAMEP || performance.now(), dt = Math.max(0, Math.min(0.1, (now - lastF) / 1000)), rdt = Math.max(1e-3, (now - lastF) / 1000); lastF = now;
    FPS.v = FPS.v ? FPS.v * 0.95 + 0.05 / rdt : 1 / rdt; FRAMEMS = FRAMEMS * 0.8 + Math.min(500, rdt * 1000) * 0.2; if (PROF.on) profBegin(rdt, j0F); if (BENCH.on){ if (BENCH.rec){ BENCH.sum += rdt; BENCH.cnt++; if (rdt > 1 / 50) BENCH.slow++; } } else if (!PROF.on) qualTick(dt, FPS.v, now); qmFrame(rdt, now); if (now - FPS.at > 500){ FPS.at = now; const fe = fpsEl(); if (fe) fe.textContent = Math.round(FPS.v) + ' bilder/s · ' + (1000 / FPS.v).toFixed(1) + ' ms · ' + ['Lav', 'Middels', 'Høy', 'Ultra'][QUAL.lvl]; }
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac, rdt); updateWaves(dt, H); nfStep(); updateWake(); foamStep(dt, t); updateNear(); ssStep(rdt); updateShadows(); updateChunks(CH.size ? 2 : 999);
    gfxNaN(null);
    // camera
    let eye, V, kfov = 0;
    if (KINO.on && !SHOW && !PAINTV){
      const K = kinoCam(t, rdt); eye = K.eye; kfov = K.fov; V = viewDir([K.tgt[0] - eye[0], K.tgt[1] - eye[1], K.tgt[2] - eye[2]]); camFwd = [K.tgt[0] - eye[0], K.tgt[2] - eye[2]];
    } else if (cam.helm && !SHOW && !PAINTV){
      // at the wheel: the eye stands where the helmsman's head is on the hull, and moves with it, so the boat round him stands still
      // in the picture; only the head steadies itself: the view follows the boat's pitch and roll through a filter of 0.3 s, so an
      // uneven frame (the tablet's) does not jerk the horizon (the user: «båten rister voldsomt i bro-visningen», 03.10.2026). The eye
      // was placed by the steadied pitch and heave too, so the rail and the console bobbed against it (the user's video 04.10.2026:
      // «hvor mye båten vibrerer under seiling»); a heave does not move the horizon, which is far off
      const kh = 1 - Math.exp(-Math.min(0.25, rdt) / 0.3); if (cam.sp === undefined || !isFinite(cam.sp)){ cam.sp = bv.pitch; cam.sr = bv.roll; }
      cam.sp += (bv.pitch - cam.sp) * kh; cam.sr += (bv.roll - cam.sr) * kh;
      const Mh = model(bv.x, bv.y, bv.z, -bv.head, cam.sp * 0.7, cam.sr * 0.7);
      // the eye in full precision: model() is a Float32Array, and a translation of a million metres in it is only good to 6 to 12 cm, so the
      // eye jumped in steps while the hull, drawn relative to it, did not: a sawtooth some ten times a second that grew with the speed
      // (the user's video 09.10.2026: «hopper sikkert frem og tilbake flere titalls ganger i sekundet»). Rotate the offset, then add.
      { const o = xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), (GEO(vtype())).eye); eye = [bv.x + o[0], bv.y + o[1], bv.z + o[2]]; }
      const cy = Math.cos(cam.hp), dl = [-Math.sin(cam.hy) * cy, Math.sin(cam.hp), -Math.cos(cam.hy) * cy];
      const f = [Mh[0] * dl[0] + Mh[4] * dl[1] + Mh[8] * dl[2], Mh[1] * dl[0] + Mh[5] * dl[1] + Mh[9] * dl[2], Mh[2] * dl[0] + Mh[6] * dl[1] + Mh[10] * dl[2]];
      V = viewDir(f, [Mh[4], Mh[5], Mh[6]]); camFwd = [f[0], f[2]];
    } else {
      if ((SHOW || PAINTV) && !drag) cam.yaw += dt * 0.12;   // the showroom and the paint shop turn slowly round the boat
      // (cam.at: a point on the deck in the boat's frame to look at instead of her middle, for the tests' close shots of the crew)
      const AT = cam.at && !SHOW ? xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), cam.at) : null;
      const C = SIGNV.look ? SIGNV.look.slice() : SHOW ? [SHOW.x, (env.tide || 0) + 1.3 + Math.min(4, VESSELS[SHOW.t].len * 0.06), SHOW.z] : AT ? [bv.x + AT[0], bv.y + AT[1] + 1.0, bv.z + AT[2]] : [bv.x, bv.y + 1.3, bv.z], yawW = (SHOW ? SHOW.h : bv.head) + cam.yaw, tgt = C;
      if (PAINTV && !SHOW) paintAim(C, yawW);
      const eyeAt = p => { const cp = Math.cos(p), sp = Math.sin(p), e = [C[0] - Math.sin(yawW) * cam.dist * cp, C[1] + cam.dist * sp, C[2] + Math.cos(yawW) * cam.dist * cp];
        const ground = Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)) + 2; if (e[1] < ground) e[1] = ground; return e; };
      // tilt up over a quay or under a bridge rather than diving in close (up quickly, back down slowly) ... as far as straight down
      // over the boat: at low water a boat alongside lies 3 m under the quay's edge, which a lift of 57 degrees did not clear
      let lift = 0, f = camFree(tgt, eyeAt(cam.pitch));
      while (f < 0.98 && f * cam.dist < 12 && cam.pitch + lift < 1.45){ lift += 0.1; f = camFree(tgt, eyeAt(Math.min(1.45, cam.pitch + lift))); }
      camLift += clamp(lift - camLift, -dt * 0.6, dt * 3);
      eye = eyeAt(Math.min(1.45, cam.pitch + camLift));
      // ... and what is still in the way pulls the camera in along the line to the boat, at once; it goes back out gently
      const L = Math.hypot(eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]) || 1, want = clamp(camFree(tgt, eye) - 0.8 / L, Math.min(1, 2 / L), 1);
      camPull = want < camPull ? want : Math.min(want, camPull + dt * 1.5);
      if (camPull < 0.999) eye = [tgt[0] + (eye[0] - tgt[0]) * camPull, tgt[1] + (eye[1] - tgt[1]) * camPull, tgt[2] + (eye[2] - tgt[2]) * camPull];
      if (INTRO){ const k = Math.min(1, (performance.now() - INTRO.t0) / (INTRO.dur * 1000)), s = k * k * (3 - 2 * k); eye = [INTRO.e0[0] + (eye[0] - INTRO.e0[0]) * s, INTRO.e0[1] + (eye[1] - INTRO.e0[1]) * s, INTRO.e0[2] + (eye[2] - INTRO.e0[2]) * s]; if (k >= 1) INTRO = null; }
      V = viewDir([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]); camFwd = [tgt[0] - eye[0], tgt[2] - eye[2]];
    }
    lastEye = eye; EYE = eye; earT = performance.now(); compassDraw(Math.atan2(camFwd[0], -camFwd[1]), {x:eye[0] / 1000, y:eye[2] / 1000});
    if (!RO.on || Math.abs(eye[0] - RO.x) > 40000 || Math.abs(eye[2] - RO.z) > 40000){ RO.x = Math.round(eye[0] / 4096) * 4096; RO.z = Math.round(eye[2] / 4096) * 4096; RO.on = true; }
    const W = canvas.width, Hh = canvas.height, asp = W / Hh, fov = kfov ? kfov * DEG : cam.helm ? 2 * Math.atan(Math.tan(cam.fov * DEG / 2) / (cam.zoom || 1)) : 55 * DEG; curFov = fov;
    { const z = !kfov && cam.helm ? cam.zoom || 1 : 1, on = z > 1.5; if (binoc.hidden === on) binoc.hidden = !on; if (on){ const t = Math.round(z) + '×'; if (binoc.firstChild.textContent !== t) binoc.firstChild.textContent = t; } }
    let cornerD = 0; if (NEARM) for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cornerD = Math.max(cornerD, Math.hypot(NEARM.x0 + qx * NEARM.sx - eye[0], NEARM.z0 + qz * NEARM.sz - eye[2], eye[1]));
    const nearFar = Math.max(3000, cam.dist * 3, cornerD + 300); lightNF = nearFar; const VPf = mul(persp(fov, asp, 25, QUAL.lvl === 3 ? 260000 : 170000), V.m);
    // the near plane moves out with the camera when it is high above the boat (Jonas' video from Båtsfjord 09.10.2026): at 0.25 m the depth
    // could not tell the sea from the shore a few kilometres off (the sea came through the low land in teal stripes); nothing is drawn
    // that near a high camera, and at the boat's own distances (to some 50 m) it stays as it was
    const nearN = kfov ? KINO.near || 0.25 : cam.helm ? 0.25 : clamp(Math.min(cam.dist, eye[1]) * 0.005, 0.25, 15), VPn = mul(persp(fov, asp, nearN, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = Array.from(model(0, 0, 0, -bv.head, bv.pitch, bv.roll)); BMabs[12] = bv.x; BMabs[13] = bv.y; BMabs[14] = bv.z;   // world position in full precision (see the eye above)
    // apparent wind for the flag
    const wdir = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG, wv = env.wind || windAt(H, {x:bv.x / 1000, y:bv.z / 1000}), bms = bv.v * 0.514 * 2;
    const ax = Math.sin(wdir) * wv - Math.sin(bv.head) * bms, az = -Math.cos(wdir) * wv + Math.cos(bv.head) * bms, appW = Math.hypot(ax, az), appB = Math.atan2(ax, -az);
    updateFlag(t, appW);

    PMK('sky'); gl.viewport(0, 0, W, Hh); gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const SKP = PROF.skip; if (SKP.all){ profEnd(); return; }   // the profile's empty frame: what the browser and the screen give with nothing drawn
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.useProgram(PK.p);
    const u = PK.u, tn = Math.tan(fov / 2);
    gl.uniform3fv(u.uF, V.F); gl.uniform3fv(u.uR, V.R); gl.uniform3fv(u.uU, V.U); gl.uniform2fv(u.uTan, [tn * asp, tn]);
    gl.uniform3fv(u.uZen, env.zen); airSet(u); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uSunD, env.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uMoonD, env.moonDir || [0, -1, 0]); gl.uniform1f(u.uMoonA, env.moonA || 0);
    skyFrame(u, Hh, tn, bv); cloudStep(Math.min(30, rdt)); gl.uniform2fv(u.uCloudOff, CLD.off); gl.uniform1f(u.uCloud, env.cloud); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uStars, env.stars); gl.uniform1f(u.uAur, env.aur); gl.uniform1f(u.uDay, env.day); gl.uniform2fv(u.uWindDir, env.windDir);
    gl.disableVertexAttribArray(1); attr(0, SKYQ, 2); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // far pass
    PMK('farT'); glChk('frame'); pickLights(eye, t);
    if (!SKP.terr) drawTerrain(TM, eye, VPf, false); drawWater(VPf, eye); litSetup(VPf); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); drawUnits(eye, VPf, false, 15000); drawSites(eye, VPf, false, 15000); if (NPCM && !SKP.boats) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d < 30000 && !((n.fleet || n.coast) && d < 1500)) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
    PMK('farSea'); glChk('far'); drawVind(VPf, eye, dt, true); glChk('vindF');
    if (!SKP.sea) drawSea(VPf, eye, t, 1); glChk('seaF');
    drawSeaLights(VPf, eye, t, false);
    lifePts(VPf, eye, t, true);
    if (env.night > 0.02){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      if (BLD) drawChunkLights(VPf, eye);
      else if (LIGHTS.length){ const n = Math.min(LIGHTS.length / 3, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = LIGHTS[i * 3] - eye[0]; PB[i * 3 + 1] = LIGHTS[i * 3 + 1] - eye[1]; PB[i * 3 + 2] = LIGHTS[i * 3 + 2] - eye[2]; PA[i] = env.night * 0.9; } drawPts(n, gl.POINTS, VPf, [1, 0.78, 0.42], 5000, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // near pass
    PMK('nearT'); gl.clear(gl.DEPTH_BUFFER_BIT);
    const VT = vtype(), VG = GEO(VT), ncrew = Math.min(crewAboard().length, (VG.crewSpots || []).length); if (VG.hand) useHand(VT);
    if (!SKP.terr) drawTerrain(TM, eye, VPn, true); updateWater(eye); drawWater(VPn, eye); updateShore(eye); drawShore(VPn); litSetup(VPn); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); glChk('nearT'); if (!SKP.trees){ drawTrees(VPn, eye); drawNear(VPn, eye, t); } glChk('trees'); drawVind(VPn, eye, dt, false); glChk('vind'); litSetup(VPn);
    // whoever works the deck leaves their place: alone, the skipper leaves the wheel
    // resting ashore in the naust or a rorbu (15-energy.js; Jonas 05.10.2026: «Ved hvile forsvinner skipperen fra båten») he is not aboard
    // never more people aboard than the crew list (tilbakemelding #24): the crew at the hauler and the one at the table leave their
    // places, and with you ashore one of the crew is at the wheel; with you aboard another of your boats and no crew in this one, nobody
    // is drawn at the wheel (tilbakemelding #102: the skipper sat in the boat while the game said she had no crew)
    PMK('boat'); DECKACT = deckActivity(); const awaySk = (DECKACT.on && DECKACT.me) || gopMe() || (meAboard() && resting()) || (!meAboard() && !crewAboard().length), awayCr = DECKACT.on && DECKACT.crew ? 1 : 0;
    const gHaul = S.boat.gop && !VG.hand ? Math.min(3, gopHands()) - (gopMe() ? 1 : 0) : 0, helmCr = !meAboard() && !awaySk ? 1 : 0;
    // under way the crew are inside (the user: no reason for them to stand on deck all day, 03.10.2026); whoever guts is at the table
    // (drawDeck), and in an open boat they sit where they are. The one at the table leaves their place (a skiff drew them twice).
    // and while the skipper rests ashore the crew are up there too (Jonas 06.10.2026: both sleep in the rorbu)
    // and at the quay in a boat with bunks the crew who still need rest are asleep in them, not on deck (tilbakemelding #65; they rest
    // there as fast as in a rorbu, core/04-crew.js): only the rested ones come up
    const underway = S.boat.status === 'sailing' && !S.boat.gop, ashore = meAboard() && restAshore();   // (in the bunk aboard, #70, the crew stay on deck)
    const inBunks = S.boat.status === 'port' && !VG.open && bunks(S.boat) ? crewAboard().slice(0, ncrew).filter(c => c.fatigue >= 1).length : 0;
    const deckCrew = (underway && !VG.open) || ashore ? 0 : Math.max(0, ncrew - awayCr - Math.max(0, gHaul) - helmCr - inBunks);
    // the people aboard walk the deck (deckcrew.js): the boat is drawn without her fixed figures, and the agents are drawn after her
    const DKON = !VG.hand && typeof CREW3D !== 'undefined' && CREW3D.on();
    if (DKON){ CREW3D.setJig(jigRail(VT, VG)); CREW3D.setRoll(bv.roll); CREW3D.setHelm(!!cam.helm); CREW3D.tick(dt); }
    if (SKP.boats){}
    else if (VG.hand){ drawSkiff(BMrel, VPn, dt, !cam.helm && !awaySk, deckCrew > 0); gl.useProgram(PL.p); }
    // jigging from a boat with a wheelhouse, the skipper leaves the wheel for the rail (the hand-worked boats do the same in drawSkiff),
    // also with crew aboard: he tends the jig while they gut (tilbakemelding #62: on a sjark with two hands he stood in the wheelhouse
    // while one hand looked on); he stays at the wheel only when the crew fill every deck place
    else { const jig = S.boat.status === 'fishing' && !S.boat.gop && !S.boat.deckStop;
      drawVessel(VT, VG, BMrel, VPn, !DKON && !cam.helm && !awaySk, DKON ? 0 : deckCrew, !DKON && jig, hullLiv(S.boat), true); drawJigRail(BMrel, VPn, VT, VG, dt); gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
      if (DKON) drawDeckCrew(BMrel, eye, VPn, t, VG); }
    SAY.a = null;
    if (SAY.c && performance.now() - SAY.t0 < SAYMS){
      // over the head of the one who speaks, at his place on deck (the crew stand at the places in the order of the list); when he is not
      // to be seen (inside under way, at the hauler or the table, or ashore) the line floats over the boat, over her house, so it can be read
      const ag = DKON ? CREW3D.anchorOf(SAY.c.id) : null, ci = crewAboard().findIndex(p => p.id === SAY.c.id), sp = ag ? [ag.x, ag.y, ag.z] : VG.crewSpots && ci >= 0 && ci < deckCrew ? VG.crewSpots[ci] : null, tp = VG.top || [0, 3.4, 0];
      SAY.a = xf(BMrel, sp ? [sp[0], sp[1] + 2.1, sp[2]] : [tp[0], tp[1] + 1.6, tp[2]]);
    }
    if (SHOW){ const y = (env.tide || 0) + (seaH(SHOW.x, SHOW.z, t) - (env.tide || 0)) * 0.8; SHOW.M = model(SHOW.x - eye[0], y - eye[1], SHOW.z - eye[2], -SHOW.h, Math.sin(t * 0.7) * 0.02, Math.sin(t * 0.9) * 0.03); drawVessel(SHOW.t, GEO(SHOW.t), SHOW.M, VPn, true, 2); }
    if (STATN){ nSetup(VPn); drawN(STATN, TM); if (BUNKN) drawN(BUNKN, TM); } if (LIFT.off < 0.05) drawMooring(BMrel, eye, VPn, t); drawRescue(BMrel, eye, VPn, t); drawTowLine(BMrel, VPn); drawAnchor(BMrel, eye, VPn, t); if (PM) drawDeck(BMrel, eye, VPn, t, DECKACT); drawGearOp(BMrel, eye, VPn, t);
    const plant = PM ? nearestPlant(eye) : null; drawUnits(eye, VPn, true, nearFar, plant && plant.id); drawSites(eye, VPn, true, nearFar); drawSigns(eye, VPn);
    const pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null;
    // a hand at the plant says his line: over his head, else over the first hand who is out
    if (SAY.w && plant && plant.id === SAY.w.pid && plant.wpos && performance.now() - SAY.t0 < SAYMS){ const q = plant.wpos[SAY.w.idx] || plant.wpos[Object.keys(plant.wpos)[0]]; if (q) SAY.a = [q.x - eye[0], q.y + 2.1 - eye[1], q.z - eye[2]]; }
    if (SAY.b && performance.now() - SAY.t0 < SAYMS){ const n = (npcNow || []).find(q => q.id === SAY.b); if (n) SAY.a = [n.p.x * 1000 - eye[0], (env.tide || 0) + 7 - eye[1], n.p.y * 1000 - eye[2]]; }
    const bunk = PM ? nearestBunker(eye) : null; if (bunk) bunk.last = drawBunker(bunk, eye, VPn, t, BMrel); gl.useProgram(PL.p);
    PMK('obj'); glChk('boat'); wildSpawn(t); if (!SKP.boats) drawNPC(eye, t, H, VPn); glChk('npc'); drawAir(eye, t, H, VPn); drawGearSea(eye, t, VPn, H); glChk('gear'); drawDocks(eye, t, VPn); drawFloats(eye, t, VPn); glChk('docks'); drawFits(eye, VPn); drawMarinas(eye, t, VPn); glChk('marina'); drawWild(eye, t, dt); glChk('wild'); drawLife(eye, t, VPn); glChk('life'); lifePts(VPn, eye, t, false); glChk('lifePts');

    PMK('nearSea');
    // the ensign in its hours (core/03-simulation.js flagUp; always while the paint shop tries one on); the pennant flies day and night
    gl.disableVertexAttribArray(2);
    if (PAINTPRE || flagUp(S.t / 60, S.boat.pos)){ const pole = xf(BMrel, VG.pole), fl = flagTex(), FM = model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0);
      drawTexQuad(FLAGM, FLAGM.tex, fl.shape === 'vimpel' ? chain(FM, new Float32Array([1.7, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])) : FM, VPn, true, [0, 0.6, 0]); }
    { const pen = S.ach && S.ach.pen ? Math.min(3, S.ach.pen | 0) : 0, mt = pen && mastTop(VG); if (mt){ const P = xf(BMrel, mt); drawTexQuad(FLAGM, penTex(), chain(model(P[0], P[1], P[2], Math.PI / 2 - appB, 0, 0), PEN_S[pen - 1]), VPn, true, [0, 0.6, 0]); } }
    gl.useProgram(PL.p);
    if (SHOW && SHOW.M && GEO(SHOW.t).open && pvm(SHOW.t).cap){ gl.colorMask(false, false, false, false); drawLit(pvm(SHOW.t).cap, SHOW.M); gl.colorMask(true, true, true, true); }
    { const cap = VG.hand ? (SK ? SK.cap : CAPM) : VG.open ? pvm(VT, hullLiv(S.boat)).cap : null; if (cap){ gl.colorMask(false, false, false, false); drawLit(cap, BMrel); gl.colorMask(true, true, true, true); } }
    signOcc(VPn);   // the partners' banners: hidden or not (07-harbour-unit.js, M7)
    glChk('nearObj'); if (!SKP.sea){ drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false); if (!SKP.gear) drawGearUnder(VPn, eye); glChk('gearU'); }
    PMK('fx'); glChk('seaN'); drawBeams(VPn, eye, t); drawWorkCones(VPn, eye, t, BMrel, VG); glChk('cones');
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawAirLights(VPn, t); drawRescueLights(VPn, t); drawSeaLights(VPn, eye, t, true);
    if (VG.hand) drawSkiffGlass(BMrel, VPn); else { const gm = pvm(VT, hullLiv(S.boat)).glass; drawGlass(gm, BMrel, VPn); drawDrops(gm, BMrel, VPn, t); }
    if (SHOW && SHOW.M) drawGlass(pvm(SHOW.t).glass, SHOW.M, VPn);
    drawNPCGlass(VPn);
    if (pr && pr.spray){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(pr.spray, gl.POINTS, VPn, [0.86, 0.93, 1], 30, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (pr && env.night > 0.05){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); pr.lamps.forEach((q, i) => { PB[i * 3] = q[0]; PB[i * 3 + 1] = q[1]; PB[i * 3 + 2] = q[2]; PA[i] = env.night; }); drawPts(pr.lamps.length, gl.POINTS, VPn, [1, 0.9, 0.72], 1400, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    // (by day in restricted visibility too, fainter: rule 20 c, Ø11.2; 22-docks-air.js lanternFog)
    const LFo = lanternFog(), LA = Math.max(env.night, LFo.a);
    if (LA > 0.05){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      // at anchor only the all-round white light shows (no side lights or stern light, which are for a boat under way); the anchor
      // alarm turns it red and makes it flash (06e-anchor.js)
      const b0 = S.boat, anchored = !!b0.anch && b0.status !== 'port', alarm = performance.now() < ANCHAL.until, V0 = VESSELS[vtype()] || {len:8};
      // the lanterns after Sjøveisreglene (vessel3d.js lanterns, 17.10.2026): what she shows follows what she does
      let L3 = lanterns(VG, V0, {port:b0.status === 'port', anch:anchored, v:b0.v || 0, fishing:b0.status === 'fishing' || !!b0.gop, trawl:V0.cls === 'hav' && !(V0.rigs || []).length, aground:b0.status === 'aground', nuc:b0.status === 'engine' || b0.status === 'adrift'}), drawn = L3.length;
      if (anchored && alarm && L3.length) L3 = L3.map(([p, c], i) => i ? [p, c] : [p, (performance.now() / 250) % 2 < 1 ? [1, 0.1, 0.06] : [0.25, 0.02, 0.02]]);   // the anchor alarm turns the light red and flashing (06e-anchor.js)
      ANCHAL.drawn = drawn;
      // the side lights and the stern light shine only in their arcs (vedlegg I 9(a): a side from right ahead to 22.5 degrees abaft the beam
      // on its own side, the stern 67.5 degrees each side of aft); the glow drew them all round, so the green showed from the port bow
      // through the wheelhouse (01.11.2026). The eye is the frame's origin (BMrel is relative to it)
      // (the arcs: 22-docks-air.js lampArc, the same for the other boats since Ø11.2)
      for (const [lp, lc, lk] of L3){ if (!lampArc(BMrel, lp, lk)) continue; const q = xf(BMrel, lp);
        PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = LA; drawPts(1, gl.POINTS, VPn, lc, anchored ? 420 : 260, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    } else ANCHAL.drawn = 0;   // (none lit: by day in clear weather)
    ANCHAL.litA = LA;   // (how strongly the lanterns show: the night, or the fog by day; for the tests)
    updateLabels(VPf, eye, W, Hh);
    gfxEnd(now, eye, VPn, W, Hh);
    if (PROF.on) profEnd();
    if (SNAP) snapTake();
  }
  // a picture of the frame just drawn, for the feedback app (ui/06e-feedback.js): read in the same task as the drawing, while the
  // drawing buffer still holds it (the context keeps no copy, preserveDrawingBuffer is off), at most w px on the long side
  let SNAP = null;
  function snapTake(){
    const s = SNAP; SNAP = null;
    try { const k = Math.min(1, s.w / Math.max(canvas.width, canvas.height)), c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); s.res(c.toDataURL('image/jpeg', 0.85)); } catch (e){ console.error(e); s.res(null); }
  }
  function drawRoute(VP, eye){
    if (!S.plan) return;
    const pts = [[bv.x - eye[0], bv.z - eye[2]]].concat(S.plan.wps.slice(S.plan.idx).map(w => [w.x * 1000 - eye[0], w.y * 1000 - eye[2]]));
    let n = 0;
    for (let i = 0; i < pts.length - 1 && n < 3900; i++){ PB.set([pts[i][0], 2 - eye[1], pts[i][1], pts[i + 1][0], 2 - eye[1], pts[i + 1][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    for (let i = 1; i < pts.length && n < 3900; i++){ PB.set([pts[i][0], -eye[1], pts[i][1], pts[i][0], 30 - eye[1], pts[i][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawPts(n, gl.LINES, VP, [0.88, 0.25, 0.62], 1, false);
    gl.disable(gl.BLEND);
  }
  // spindrift: from a gale (Beaufort 8) the wind tears spray off the crests and drives it low along the sea, more and more into a storm
  const SDN = 400, SD = {x:new Float64Array(SDN), y:new Float32Array(SDN), z:new Float64Array(SDN), vx:new Float32Array(SDN), vy:new Float32Array(SDN), vz:new Float32Array(SDN), age:new Float32Array(SDN).fill(99), life:new Float32Array(SDN).fill(1), n:0, acc:0};
  function driftSpray(VP, eye, dt, t, col){
    const U = env.wind || 0, wd = env.windDir; SD.acc = Math.min(SD.acc + dt * 260 * sstep(17.2, 28.5, U), 60);
    while (SD.acc >= 1){ SD.acc -= 1; const a = Math.random() * 6.2832, r = 8 + Math.random() * 110, x = eye[0] + Math.sin(a) * r, z = eye[2] + Math.cos(a) * r, i = SD.n = (SD.n + 1) % SDN, sp = U * (0.45 + Math.random() * 0.35);
      SD.x[i] = x; SD.z[i] = z; SD.y[i] = seaHFast(x, z, t) + 0.2; SD.vx[i] = wd[0] * sp; SD.vz[i] = wd[1] * sp; SD.vy[i] = 0.6 + Math.random() * 1.6; SD.age[i] = 0; SD.life[i] = 0.8 + Math.random() * 1.2; }
    let n = 0;
    for (let i = 0; i < SDN; i++){ if (SD.age[i] >= SD.life[i]) continue; SD.age[i] += dt; SD.vy[i] -= 2.5 * dt; SD.x[i] += SD.vx[i] * dt; SD.y[i] += SD.vy[i] * dt; SD.z[i] += SD.vz[i] * dt;
      PB[n * 3] = SD.x[i] - eye[0]; PB[n * 3 + 1] = SD.y[i] - eye[1]; PB[n * 3 + 2] = SD.z[i] - eye[2]; PA[n] = Math.sin(Math.PI * Math.min(1, SD.age[i] / SD.life[i])) * 0.45; n++; }
    if (n) drawPts(n, gl.POINTS, VP, col, 90, true);
  }
  // The semi-diesel's black puffs (Jonas 05.10.2026: «svarte små eksos-skyer ut av eksosen hver gang motoren antenner»): one at each
  // firing the sound schedules (SND.FIRES), on the view's own clock when there is no sound; from the exhaust's mouth (the model's
  // anchor exhaust), leaving with some of the boat's way, rising, growing and thinning, carried off with the wind; darker and bigger
  // when the throttle opens. Drawn as soft round points in four sizes by age.
  const SMN = 90, SMK = {x:new Float32Array(SMN), y:new Float32Array(SMN), z:new Float32Array(SMN), vx:new Float32Array(SMN), vy:new Float32Array(SMN), vz:new Float32Array(SMN), age:new Float32Array(SMN).fill(9), life:new Float32Array(SMN), k:new Float32Array(SMN), n:0};
  let smkPh = 0;
  function drawSmoke(VP, eye, BM, dt){
    const VG = GEO(vtype()), b = S.boat, run = ['sailing', 'unmooring', 'fishing', 'idle'].includes(b.status) || !!b.gop;
    if (BOAT.semi && VG.exhaust && run){
      const frac = clamp((b.v || 0) / Math.max(1, BOAT.vmax), 0, 1), now = performance.now(), F = typeof SND !== 'undefined' && SND.FIRES;
      const fwd = (() => { const a = xf(BM, [0, 0, 0]), c = xf(BM, [0, 0, -1]); return [c[0] - a[0], c[2] - a[2]]; })(), sp = (b.v || 0) * 0.514;
      const puff = k => { const p = xf(BM, VG.exhaust), i = SMK.n = (SMK.n + 1) % SMN;
        SMK.x[i] = p[0]; SMK.y[i] = p[1]; SMK.z[i] = p[2]; SMK.vx[i] = fwd[0] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vz[i] = fwd[1] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vy[i] = 0.7 + 0.6 * k + Math.random() * 0.2;
        SMK.age[i] = 0; SMK.life[i] = 2.2 + Math.random() + k * 0.6; SMK.k[i] = k; };
      if (F && F.length){ while (F.length && F[0].at <= now){ const f = F.shift(); if (now - f.at < 400) puff(f.frac); } }
      else { const R = BOAT.rpm || [340, 850]; smkPh += dt / (120 / (R[0] + frac * (R[1] - R[0]))); while (smkPh >= 1){ smkPh -= 1; puff(frac); } }
    }
    // charcoal grey taking the light round it, soft and thinning (Adrian 05.10.2026 on an iPhone: «Kommer noen sånne svarte prikka å hop over
    // skjermen av og til»: they were hard black discs, and tiny black dots from far off), and not drawn beyond 250 m
    const wv = (env.wind || 0) * 0.8, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, dr = Math.min(1, dt * 1.4), col = [0.16 + env.amb[0] * 0.3, 0.16 + env.amb[1] * 0.3, 0.17 + env.amb[2] * 0.3];
    // (Tony 06.11.2026 on an iPhone: the puffs «blinked», and stood as grey discs that should have been see-through. Three things at a low
    // frame rate: a puff was born at its full alpha and size, so each firing popped a disc in, 3–7 a second; its size doubled when it
    // crossed into the next of four age steps; and a puff drifting past the eye, with the camera on the bridge or close astern, grew to the
    // biggest point the GPU draws, a disc over half the screen. Now a puff fades in over its first 12 %, the steps are six and closer,
    // one within 4 m of the eye fades out, and no point is bigger than 320 device pixels)
    const B = [[], [], [], [], [], []], SZ = [320, 540, 800, 1080, 1380, 1700];
    for (let i = 0; i < SMN; i++){
      if (SMK.age[i] >= SMK.life[i]) continue;
      SMK.age[i] += dt; SMK.vx[i] += (wx - SMK.vx[i]) * dr; SMK.vz[i] += (wz - SMK.vz[i]) * dr; SMK.vy[i] *= 1 - Math.min(1, dt * 0.6);
      SMK.x[i] += SMK.vx[i] * dt; SMK.y[i] += SMK.vy[i] * dt; SMK.z[i] += SMK.vz[i] * dt;
      const a = SMK.age[i] / SMK.life[i]; if (Math.hypot(SMK.x[i] - eye[0], SMK.z[i] - eye[2]) < 250) B[Math.min(5, Math.floor(a * 6))].push(i);
    }
    B.forEach((L, q) => {
      let n = 0;
      for (const i of L){ const a = SMK.age[i] / SMK.life[i], dx = SMK.x[i] - eye[0], dy = SMK.y[i] - eye[1], dz = SMK.z[i] - eye[2], de = Math.hypot(dx, dy, dz);
        const near = clamp((de - 1.5) / 2.5, 0, 1), born = Math.min(1, a / 0.12);
        if (near <= 0) continue;
        PB[n * 3] = dx; PB[n * 3 + 1] = dy; PB[n * 3 + 2] = dz; PA[n] = Math.pow(1 - a, 1.6) * (0.3 + 0.22 * SMK.k[i]) * born * near; n++; }
      drawPts(n, gl.POINTS, VP, col, SZ[q], 2, null, 320);
    });
  }
  // Green water and the scuppers (Gemini's review, Jonas 31.10.2026: «Kjør på»): when the sea stands over the deck's edge (a bow that
  // digs into a sea, a roll that puts the rail under), water comes aboard (SCW.w, a rough measure of how much lies on deck) by how far
  // the sea is over the edge, three times as fast over the bulwark's top; it runs off through the scuppers along both sides, faster the
  // more there is, most out of the side that stands highest over the sea, as small jets thrown out and down that fall into the sea and
  // are gone there. Your own boat only (the camera is near her); the hand-worked boats have no scuppers. On «Lav» half as many.
  const SCN = 500, SCW = {w:0, acc:0, n:0, x:new Float64Array(SCN), y:new Float64Array(SCN), z:new Float64Array(SCN), vx:new Float32Array(SCN), vy:new Float32Array(SCN), vz:new Float32Array(SCN), age:new Float32Array(SCN).fill(99), life:new Float32Array(SCN)};
  function scupperWater(VP, eye, BM, dt, t, col){
    const VG = GEO(vtype());
    if (!VG.hand && VG.deck && dt > 0){
      const dy = VG.deck.y, hb = VG.side || (VG.beam || 3) / 2, z0 = VG.bow, z1 = VG.stern, gw = Math.max(VG.gw || 0, dy + 0.3), L = z1 - z0;
      let inflow = 0, hi = [0, 0];
      for (const [sx, fz] of [[-1, 0.1], [1, 0.1], [-1, 0.45], [1, 0.45], [-1, 0.85], [1, 0.85]]){
        const p = xf(BM, [sx * hb * 0.95, dy, z0 + L * fz]), over = seaH(p[0], p[2], t) - p[1];
        if (over > 0) inflow += over * (over > gw - dy ? 3 : 1); hi[sx > 0 ? 1 : 0] += Math.max(0, -over); }
      SCW.w = Math.min(3, SCW.w + inflow * dt * 2.5);
      const out = SCW.w * Math.min(1, dt * 1.2); SCW.w -= out; SCW.acc += out * 260 * (QUAL.lvl >= 2 ? 1 : 0.5);
      const nS = Math.max(3, Math.min(10, Math.round(L / 2.2))), ps = hi[1] + 0.05 > 0 ? (hi[1] + 0.05) / (hi[0] + hi[1] + 0.1) : 0.5;
      const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), way = (bv.spd || 0) * 0.9, O = xf(BM, [0, 0, 0]);
      while (SCW.acc >= 1){ SCW.acc -= 1;
        const sx = Math.random() < ps ? 1 : -1, z = z0 + L * (0.15 + 0.7 * (Math.floor(Math.random() * nS) + 0.5) / nS) + (Math.random() - 0.5) * 0.12;
        const p = xf(BM, [sx * hb * 1.02, dy + 0.04, z]), q = xf(BM, [sx, -0.25, 0]), sp = 0.9 + Math.random() * 1.4, i = SCW.n = (SCW.n + 1) % SCN;
        SCW.x[i] = p[0]; SCW.y[i] = p[1]; SCW.z[i] = p[2]; SCW.vx[i] = (q[0] - O[0]) * sp + fx * way; SCW.vy[i] = (q[1] - O[1]) * sp; SCW.vz[i] = (q[2] - O[2]) * sp + fz * way; SCW.age[i] = 0; SCW.life[i] = 0.9 + Math.random() * 0.5; }
    }
    let n = 0;
    for (let i = 0; i < SCN; i++){
      if (SCW.age[i] >= SCW.life[i]) continue;
      SCW.age[i] += dt; SCW.vy[i] -= 9.8 * dt; SCW.x[i] += SCW.vx[i] * dt; SCW.y[i] += SCW.vy[i] * dt; SCW.z[i] += SCW.vz[i] * dt;
      if (SCW.y[i] < seaHFast(SCW.x[i], SCW.z[i], t)){ SCW.age[i] = 99; continue; }
      PB[n * 3] = SCW.x[i] - eye[0]; PB[n * 3 + 1] = SCW.y[i] - eye[1]; PB[n * 3 + 2] = SCW.z[i] - eye[2]; PA[n] = 0.85 * (1 - 0.6 * SCW.age[i] / SCW.life[i]); n++; }
    if (n) drawPts(n, gl.POINTS, VP, col, 46, 1);
    SCW.drawn = n;
  }
  function drawEffects(VP, eye, BM, dt, t){
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const foamCol = [Math.min(1, env.amb[0] * 1.4 + env.sunCol[0] * 0.8), Math.min(1, env.amb[1] * 1.4 + env.sunCol[1] * 0.8), Math.min(1, env.amb[2] * 1.4 + env.sunCol[2] * 0.8)];
    // wake and spray
    const v = bv.v;
    if (v > 1){
      const VG = GEO(vtype());
      // a trail point for every 1.2 m travelled, stamped with the real clock (independent of frame rate)
      const p = xf(BM, [0, 0, VG.stern]), now = performance.now() / 1000, last = TRAIL[0], moved = last ? Math.hypot(p[0] - last.x, p[2] - last.z) : 99;
      if (moved > 1.2 || (last && now - last.t0 > 0.3)){ wk.odo = (wk.odo || 0) + Math.min(moved, 60); TRAIL.unshift({x:p[0], z:p[2], t0:now, age:0, r:0.45 + Math.random() * 0.55, v, u:wk.odo, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}); if (TRAIL.length > 700) TRAIL.pop(); }
      // spray: when the bow drives down into a sea (how fast it sinks into the water against the surface), thrown out to both sides and up,
      // and carried off with the wind; at planing speed a little all the time in a chop. It leaves the hull where the bow wave does, along
      // the waterline a little aft of the stem, as a fine mist, and keeps most of the boat's way: it fans out beside the bow and falls
      // astern of it (Jonas 21.10.2026, #90: the spray did not look real. Thrown from a point at the stem with no way on, it hung in the
      // air as a trail of round blobs behind the boat)
      const bowP = xf(BM, [0, 0.15, VG.bow]), imm = bowP[1] - seaH(bowP[0], bowP[2], t), sink = wk.imm == null ? 0 : (imm - wk.imm) / Math.max(dt, 1e-3); wk.imm = imm;
      const wv = (env.wind || 0) * 0.35, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, Lb = VG.stern - VG.bow, fx = Math.sin(bv.head), fz = -Math.cos(bv.head), way = (bv.spd || 0) * 0.9;
      if (v > 3 && sink < -0.5 && imm < 0.6) wk.sacc += Math.min(100, -sink * v * 1.25);
      if (WK.Fr > 0.9) wk.sacc += dt * v * WV.hs * 2;
      // the spray sheet on the plane, in calm water too (the reference video Jonas showed 04.11.2026): where the hull meets the water, from
      // 6 % of the length aft of the stem at the hump to 40 % on the plane (WK.pf, as the foam map's spray root), the chine and the spray
      // rails throw a thin sheet flat out to both sides, low, at some third of her speed through the water; it falls within half a second
      // and lies as the white wings in the foam map. A displacement hull has none at any speed (WK.pf 0)
      if ((WK.pf || 0) > 0.05 && v > 3){ const vr = (WK.kn || 0) * 0.5144; wk.pacc = (wk.pacc || 0) + dt * 90 * WK.pf * sstep(3, 10, vr);
        while (wk.pacc >= 1){ wk.pacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, rf = 0.06 + 0.34 * WK.pf + Math.random() * 0.1, p = xf(BM, [side * VG.side * 1.05, 0.05, VG.bow + rf * Lb]), out = Math.min(7, vr * (0.2 + Math.random() * 0.15));
          spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * out + fx * way + wx, 0.4 + Math.random() * 0.9, Math.sin(bv.head) * side * out + fz * way + wz, 0.35 + Math.random() * 0.35, 9.8); } }
      while (wk.sacc >= 1){ wk.sacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, a = 0.08 + Math.random() * 0.22, p = xf(BM, [side * VG.side * (0.45 + a * 1.6), 0.1, VG.bow + a * Lb]), up = 0.9 + Math.random() * (1.4 + Math.min(4, -sink)), out = 1.6 + Math.random() * 2.6;
        spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * out + fx * way + wx, up, Math.sin(bv.head) * side * out + fz * way + wz, 0.6 + Math.random() * 0.7, 9.8); }
      // the rooster tail: a planing outboard throws a plume of water up behind the leg
      if (BOAT.outboard && WK.Fr > 1){ wk.racc = (wk.racc || 0) + dt * 70 * sstep(1, 1.6, WK.Fr);
        while (wk.racc >= 1){ wk.racc -= 1; const p = xf(BM, [(Math.random() - 0.5) * 0.3, 0.1, VG.stern + 0.4]), bk = 2 + Math.random() * 3;
          spawn(p[0], p[1], p[2], -Math.sin(bv.head) * bk + wx, 2.2 + Math.random() * 2.2, Math.cos(bv.head) * bk + wz, 0.6 + Math.random() * 0.4, 9.8); } }
    }
    // wake: the prop wash's bubbles behind the stern (gone in 6 s; the pale band under them went, Jonas 04.10.2026: «kun vise
    // boblepartiklene») and the two Kelvin arms spreading at 19.5 degrees, fading out within 10 s («gradvis forsvinner»), each corner
    // laid on the waves where it lies (one height across an arm hid it under the waves on one side more than the other)
    { const now = performance.now() / 1000; for (const q of TRAIL) q.age = now - (q.t0 || now); }
    while (TRAIL.length && TRAIL[TRAIL.length - 1].age > 11) TRAIL.pop();
    if (TRAIL.length > 1 && WKB && !foamLive()){   // (the foam map draws the trail when it is on: 14-sea.js)
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step, tide = env.tide || 0;
      const seaY = (x, z) => seaHFast(x, z, t) + wakeHFast(x, z) + 0.07;
      const st = xf(BM, [0, 0, (GEO(vtype())).stern]), pts = (v > 1 ? [{x:st[0], z:st[2], age:0, v, u:wk.odo || 0, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}] : []).concat(TRAIL);
      let m = 0; const P = WKB.p, W = WKB.w, Sg = WKB.s, cap = 8900;
      const put = (x, z, y, u, vv, age, kind, str) => { if (m >= cap) return; P[m * 3] = x - eye[0]; P[m * 3 + 1] = y - eye[1]; P[m * 3 + 2] = z - eye[2]; W[m * 4] = u; W[m * 4 + 1] = vv; W[m * 4 + 2] = age; W[m * 4 + 3] = kind; Sg[m] = str; m++; };
      const strip = (A, B) => { // A, B: arrays of 3 across-points [x, z, v] at two stations, with u/age/kind/str
        for (let c = 0; c < 2; c++){ const a0 = A.q[c], a1 = A.q[c + 1], b0 = B.q[c], b1 = B.q[c + 1];
          for (const [q, S2] of [[a0, A], [a1, A], [b1, B], [a0, A], [b1, B], [b0, B]]) put(q[0], q[1], q[3], S2.u, q[2], S2.age, S2.kind, S2.str); } };
      const sections = (kind) => {
        const out = []; let di = 0;
        for (let i = 0; i < pts.length; i++){
          if (pts[i].age > (kind ? 10.3 : 6.3)) break;
          if (i) di += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
          const a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)], c0 = pts[Math.max(0, i - 1)];
          let dx = c0.x - b.x, dz = c0.z - b.z; const l = Math.hypot(dx, dz); if (l < 1e-3){ dx = a.hx; dz = a.hz; } else { dx /= l; dz /= l; }
          const px = -dz, pz = dx, spd = (a.v || v) * 0.5144, str = clamp(spd / 3.6, 0.25, 1);
          if (kind === 0){ const w = 0.55 + Math.min(5, di * 0.028 + a.age * 0.12); out.push({u:a.u, age:a.age, kind:0, str:str * 1.05, q:[[a.x + px * w, a.z + pz * w, -1], [a.x, a.z, 0], [a.x - px * w, a.z - pz * w, 1]]}); }
          else { const L = 1.05 + 0.354 * di, w = 0.4 + di * 0.06, sd = kind === 1 ? 1 : -1, cx = a.x + px * L * sd, cz = a.z + pz * L * sd;
            out.push({u:a.u, age:a.age, kind:1, str:str * clamp(spd / 3, 0.2, 1), q:[[cx + px * w * sd, cz + pz * w * sd, -1], [cx, cz, 0], [cx - px * w * sd, cz - pz * w * sd, 1]]}); }
        }
        return out;
      };
      // the sea height once per point across the wake (each is a corner of up to six triangles)
      for (const kind of [1, 2, 0]){ const sec = sections(kind); for (const S2 of sec) for (const q of S2.q) q.push(seaY(q[0], q[1])); for (let i = 0; i < sec.length - 1; i++) strip(sec[i], sec[i + 1]); }
      if (m){
        gl.useProgram(PRGW.p); const u = PRGW.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform3fv(u.uEye, [eye[0] - RO.x, eye[1], eye[2] - RO.z]); gl.uniform3fv(u.uCol, foamCol); gl.uniform3fv(u.uAer, [0.09, 0.3, 0.31].map((c, k) => c * (env.amb[k] * 1.4 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uArm, [0.1, 0.27, 0.31].map((c, k) => c * (env.amb[k] * 1.8 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u); gl.uniform1f(u.uTime, t);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P.subarray(0, m * 3)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.wb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, W.subarray(0, m * 4)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.sb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Sg.subarray(0, m)); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.drawArrays(gl.TRIANGLES, 0, m); gl.disable(gl.POLYGON_OFFSET_FILL); gl.disableVertexAttribArray(2);
      }
    }
    let n = 0;
    for (let i = 0; i < WN; i++){
      if (wk.age[i] >= wk.life[i]) continue;
      wk.age[i] += dt; wk.vy[i] -= wk.g[i] * dt; wk.x[i] += wk.vx[i] * dt; wk.y[i] += wk.vy[i] * dt; wk.z[i] += wk.vz[i] * dt;
      PB[n * 3] = wk.x[i] - eye[0]; PB[n * 3 + 1] = wk.y[i] - eye[1]; PB[n * 3 + 2] = wk.z[i] - eye[2]; PA[n] = Math.pow(Math.max(0, 1 - wk.age[i] / wk.life[i]), 1.5) * 0.75; n++;
    }
    if (QUAL.lvl) drawPts(n, gl.POINTS, VP, foamCol, 95, 2);   // (soft, as mist: round discs read as blobs)
    scupperWater(VP, eye, BM, dt, t, [foamCol[0] * 0.88, foamCol[1] * 0.95, foamCol[2]]);
    if (QUAL.lvl) driftSpray(VP, eye, dt, t, foamCol);
    drawSmoke(VP, eye, BM, dt);
    // fishing lines
    if (S.boat.status === 'fishing' && SK && (SK.lines || []).length){
      const segs = (SK.lines || []).slice();
      let n = 0;
      for (const [a0, b0] of segs){ if (n > 30) break; const A0 = [a0[0] + eye[0], a0[1] + eye[1], a0[2] + eye[2]], B0 = b0 ? [b0[0] + eye[0], b0[1] + eye[1], b0[2] + eye[2]] : [A0[0], seaH(A0[0], A0[2], t) - 0.2, A0[2]];
        PB.set([A0[0] - eye[0], A0[1] - eye[1], A0[2] - eye[2], B0[0] - eye[0], B0[1] - eye[1], B0[2] - eye[2]], n * 6); PA[n * 2] = PA[n * 2 + 1] = 0.8; n++; }
      if (n) drawPts(n * 2, gl.LINES, VP, [0.12, 0.12, 0.12], 1, false);
    }
    // rain or snow, and sleet between 0.5 and 2 °C (G6: every other particle a flake); on «Lav» half as many
    const pr = env.precip;
    if (pr > 0.04){
      const tp = env.temp, snow = tp < 0.5, sleet = !snow && tp < 2, BX = 26, BY = 16;
      if (!pinit){ for (let i = 0; i < PN; i++){ pp[i * 3] = eye[0] + (Math.random() * 2 - 1) * BX; pp[i * 3 + 1] = eye[1] + (Math.random() * 2 - 1) * BY; pp[i * 3 + 2] = eye[2] + (Math.random() * 2 - 1) * BX; } pinit = true; }
      const cnt = Math.floor(PN * Math.min(1, pr * 1.2) * (QUAL.lvl === 0 ? 0.5 : 1)); let m = 0, mf = 0; const fl = PFL;
      for (let i = 0; i < cnt; i++){
        const flake = snow || (sleet && (i & 1)), f = flake ? 0.8 : 0.9, wx = env.windDir[0] * env.wind * f, wz = env.windDir[1] * env.wind * f, vy = flake ? (snow ? -1.3 : -2.4) : -7.5;
        const jx = flake ? Math.sin(t * 1.3 + i) * 0.6 : 0, jz = flake ? Math.cos(t * 1.1 + i * 1.7) * 0.6 : 0;
        pp[i * 3] += (wx + jx) * dt; pp[i * 3 + 1] += vy * dt; pp[i * 3 + 2] += (wz + jz) * dt;
        for (let a = 0; a < 3; a++){ const e = a === 1 ? BY : BX; let r = pp[i * 3 + a] - eye[a]; if (r > e) pp[i * 3 + a] -= 2 * e; else if (r < -e) pp[i * 3 + a] += 2 * e; }
        const rx = pp[i * 3] - eye[0], ry = pp[i * 3 + 1] - eye[1], rz = pp[i * 3 + 2] - eye[2];
        if (flake){ fl[mf * 3] = rx; fl[mf * 3 + 1] = ry; fl[mf * 3 + 2] = rz; mf++; }
        else { PB.set([rx, ry, rz, rx - wx * 0.05, ry - vy * 0.05, rz - wz * 0.05], m * 3); PA[m] = PA[m + 1] = 0.35; m += 2; }
      }
      const pc = [Math.min(1, env.amb[0] * 2 + env.sunCol[0] * 0.6 + 0.25), Math.min(1, env.amb[1] * 2 + env.sunCol[1] * 0.6 + 0.27), Math.min(1, env.amb[2] * 2 + env.sunCol[2] * 0.6 + 0.3)];
      if (m) drawPts(m, gl.LINES, VP, pc, 95, true);
      if (mf){ PB.set(fl.subarray(0, mf * 3)); for (let i = 0; i < mf; i++) PA[i] = sleet ? 0.7 : 0.85; drawPts(mf, gl.POINTS, VP, pc, sleet ? 80 : 95, true); }
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function updateLabels(VP, eye, W, Hh){
    const r = wrap.getBoundingClientRect(), sx = r.width / W, sy = r.height / Hh;
    // the crew's line over the head of whoever says it
    if (!SAY.el || !SAY.el.isConnected){ SAY.el = document.createElement('div'); SAY.el.className = 'say3d'; labelsEl.appendChild(SAY.el); }
    { const el = SAY.el, age = performance.now() - SAY.t0, a = SAY.a;
      if (!a || age >= SAYMS){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const cw = VP[3] * a[0] + VP[7] * a[1] + VP[11] * a[2] + VP[15];
        if (cw <= 0) el.style.display = 'none';
        else { const cx = VP[0] * a[0] + VP[4] * a[1] + VP[8] * a[2] + VP[12], cy = VP[1] * a[0] + VP[5] * a[1] + VP[9] * a[2] + VP[13];
          if (el.textContent !== SAY.txt) el.textContent = SAY.txt;
          el.style.display = ''; el.style.opacity = Math.min(1, age / 300, (SAYMS - age) / 800).toFixed(2); el.style.left = ((cx / cw * 0.5 + 0.5) * W * sx) + 'px'; el.style.top = ((1 - (cy / cw * 0.5 + 0.5)) * Hh * sy) + 'px'; } } }
    if (!ANCHAL.el || !ANCHAL.el.isConnected){ ANCHAL.el = document.createElement('div'); ANCHAL.el.className = 'anchal'; labelsEl.appendChild(ANCHAL.el); }
    { const el = ANCHAL.el, on = performance.now() < ANCHAL.until;
      if (!on){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const txt = S.lang === 'no' ? (ANCHAL.kind === 'gale' ? '⚓ ANKERALARM · ankeret slepper i kuling' : '⚓ ANKERALARM · ankeret slepper') : (ANCHAL.kind === 'gale' ? '⚓ ANCHOR ALARM · dragging in a gale' : '⚓ ANCHOR ALARM · the anchor is dragging');
        if (el.textContent !== txt) el.textContent = txt; el.style.display = ''; el.classList.toggle('on', (performance.now() / 350) % 2 < 1); } }
  }

