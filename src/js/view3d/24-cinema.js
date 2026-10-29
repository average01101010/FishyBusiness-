  // ---------- cinema (the user's wish 03.10.2026) ----------
  // «Kino» lets the camera film the trip by itself: shots of 12-20 s in turn, a drone circling high, low along the side at the waterline,
  // from ahead looking back at the bow, from the shore as she passes (with a long lens), a wide shot of the landscape, and from behind over the wake. The
  // eye and the aim move through a filter of 0.7 s (cut at a new shot), the horizon is level (no roll), and a shot whose eye would be
  // in the land or the sea, or with the land between it and the boat, is passed over for the next.
  const KINO = {on:false, shot:null, n:0, eye:null, tgt:null};
  const KTYPES = ['drone', 'low', 'ahead', 'shore', 'wide', 'chase'];
  function kinoWant(K, t){
    const L = Math.max(5, (VESSELS[vtype()] || {}).len || 6), C = [bv.x, bv.y + 1.2, bv.z], fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), s = K.side, u = t - K.t0;
    const sea = (x, z) => Math.max(terrH(x, z), seaH(x, z, t));
    if (K.type === 'drone'){ const a = K.a0 + u * 0.06 * s, R = 45 + L * 3; const e = [C[0] + Math.sin(a) * R, 0, C[2] - Math.cos(a) * R]; e[1] = sea(e[0], e[2]) + 26 + L; return [e, C, 50]; }
    if (K.type === 'low'){ const e = [C[0] + rx * s * (L * 0.35 + 5) - fx * L * (0.3 - u * 0.012), 0, C[2] + rz * s * (L * 0.35 + 5) - fz * L * (0.3 - u * 0.012)]; e[1] = sea(e[0], e[2]) + 0.9; return [e, [C[0] + fx * L * 0.4, C[1], C[2] + fz * L * 0.4], 55]; }
    if (K.type === 'ahead'){ const e = [C[0] + fx * (L * 2.2 + 22) + rx * s * 5, 0, C[2] + fz * (L * 2.2 + 22) + rz * s * 5]; e[1] = sea(e[0], e[2]) + 2.6; return [e, C, 45]; }
    // from the shore a long lens: the frame about four boat lengths high wherever she is
    if (K.type === 'shore'){ const e = [K.px, sea(K.px, K.pz) + 1.8, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, C, clamp(2 * Math.atan(2 * L / Math.max(1, d)) / DEG, 6, 40)]; }
    if (K.type === 'wide'){ const e = [C[0] - fx * 120 + rx * s * 80, 0, C[2] - fz * 120 + rz * s * 80]; e[1] = sea(e[0], e[2]) + 45; return [e, [C[0] + fx * 60, C[1], C[2] + fz * 60], 55]; }
    const e = [C[0] - fx * (L * 3 + 18), 0, C[2] - fz * (L * 3 + 18)]; e[1] = sea(e[0], e[2]) + 7 + L * 0.3; return [e, [C[0] + fx * 30, C[1], C[2] + fz * 30], 50];
  }
  function kinoNext(t){
    for (let k = 0; k < KTYPES.length; k++){
      const type = KTYPES[(KINO.n++) % KTYPES.length], K = {type, t0:t, dur:12 + 8 * hash(KINO.n * 7 + 3), side:hash(KINO.n * 13 + 1) < 0.5 ? -1 : 1, a0:hash(KINO.n * 5 + 2) * 6.28};
      if (type === 'shore'){
        // a point 60-210 m off her course ahead, on the side with land if there is any near; the boat sails past it
        const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), ahead = 90 + Math.max(0, bv.spd || 0) * 6; let best = null;
        for (const off of [60, 110, 160, 210]){ for (const sd of [1, -1]){ const x = bv.x + fx * ahead + rx * sd * off, z = bv.z + fz * ahead + rz * sd * off; if (terrH(x, z) > 1.5){ best = [x, z]; break; } } if (best) break; }
        if (!best) best = [bv.x + fx * ahead + rx * K.side * 70, bv.z + fz * ahead + rz * K.side * 70];
        K.px = best[0]; K.pz = best[1];
      }
      const [e, g] = kinoWant(K, t);
      if (camFree(g, e) > 0.9){ KINO.shot = K; KINO.eye = e.slice(); KINO.tgt = g.slice(); KINO.eyeR = null; KINO.hid = 0; return; }
    }
    KINO.shot = {type:'drone', t0:t, dur:12, side:1, a0:0}; KINO.eye = null; KINO.eyeR = null; KINO.hid = 0;
  }
  // The eye and the aim are smoothed in the boat's frame (as offsets from her), so they keep up with her at the screen's speed (six
  // times real: 71 m/s at 23 knots); in the world's frame the filter of 0.7 s left them some 50 m behind her and she ran out of the
  // picture (the user 04.10.2026: «I cinematic-view vises som oftest ikke båten»). The shore camera stands still and only its aim
  // follows. A shot that loses her behind the land for a second cuts to the next.
  function kinoCam(t, rdt){
    if (!KINO.shot || t - KINO.shot.t0 > KINO.shot.dur || t < KINO.shot.t0) kinoNext(t);
    const C = [bv.x, bv.y, bv.z], [e, g, fov] = kinoWant(KINO.shot, t), k = 1 - Math.exp(-Math.min(0.25, rdt) / 0.7), fixed = KINO.shot.type === 'shore';
    const eW = fixed ? e : [e[0] - C[0], e[1] - C[1], e[2] - C[2]], gR = [g[0] - C[0], g[1] - C[1], g[2] - C[2]];
    if (!KINO.eyeR){ KINO.eyeR = eW.slice(); KINO.tgtR = gR.slice(); }
    for (let i = 0; i < 3; i++){ KINO.eyeR[i] += (eW[i] - KINO.eyeR[i]) * k; KINO.tgtR[i] += (gR[i] - KINO.tgtR[i]) * k; }
    const eye = fixed ? KINO.eyeR.slice() : [KINO.eyeR[0] + C[0], KINO.eyeR[1] + C[1], KINO.eyeR[2] + C[2]], tgt = [KINO.tgtR[0] + C[0], KINO.tgtR[1] + C[1], KINO.tgtR[2] + C[2]];
    const gy = Math.max(terrH(eye[0], eye[2]), seaH(eye[0], eye[2], t)) + 0.6; if (eye[1] < gy) eye[1] = gy;
    if (camFree([C[0], C[1] + 1.2, C[2]], eye) < 0.6){ KINO.hid = (KINO.hid || 0) + rdt; if (KINO.hid > 1) kinoNext(t); } else KINO.hid = 0;
    KINO.eye = eye; KINO.tgt = tgt;
    return {eye:eye.slice(), tgt, fov};
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
  function frame(){ const j0 = performance.now(); frame0(); JSMS = JSMS ? JSMS * 0.92 + (performance.now() - j0) * 0.08 : performance.now() - j0; }
  let FRAMEN = 0;
  function frame0(){ FRAMEN++;
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden || NO3D || HOLD) return;
    resize();
    const now = performance.now(), dt = Math.min(0.1, (now - lastF) / 1000), rdt = Math.max(1e-3, (now - lastF) / 1000); lastF = now;
    FPS.v = FPS.v ? FPS.v * 0.95 + 0.05 / rdt : 1 / rdt; FRAMEMS = FRAMEMS * 0.8 + Math.min(500, rdt * 1000) * 0.2; qualTick(dt, FPS.v, now); if (now - FPS.at > 500){ FPS.at = now; const fe = fpsEl(); if (fe) fe.textContent = Math.round(FPS.v) + ' bilder/s · ' + (1000 / FPS.v).toFixed(1) + ' ms · ' + ['Lav', 'Middels', 'Høy', 'Ultra'][QUAL.lvl]; }
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac, rdt); updateWaves(dt, H); nfStep(); updateWake(); foamStep(dt, t); updateNear(); ssStep(rdt); updateShadows(); updateChunks(CH.size ? 2 : 999);
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
      const C = SHOW ? [SHOW.x, (env.tide || 0) + 1.3 + Math.min(4, VESSELS[SHOW.t].len * 0.06), SHOW.z] : AT ? [bv.x + AT[0], bv.y + AT[1] + 1.0, bv.z + AT[2]] : [bv.x, bv.y + 1.3, bv.z], yawW = (SHOW ? SHOW.h : bv.head) + cam.yaw, tgt = C;
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
    const nearN = cam.helm || kfov ? 0.25 : clamp(Math.min(cam.dist, eye[1]) * 0.005, 0.25, 15), VPn = mul(persp(fov, asp, nearN, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = Array.from(model(0, 0, 0, -bv.head, bv.pitch, bv.roll)); BMabs[12] = bv.x; BMabs[13] = bv.y; BMabs[14] = bv.z;   // world position in full precision (see the eye above)
    // apparent wind for the flag
    const wdir = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG, wv = env.wind || windAt(H, {x:bv.x / 1000, y:bv.z / 1000}), bms = bv.v * 0.514 * 2;
    const ax = Math.sin(wdir) * wv - Math.sin(bv.head) * bms, az = -Math.cos(wdir) * wv + Math.cos(bv.head) * bms, appW = Math.hypot(ax, az), appB = Math.atan2(ax, -az);
    updateFlag(t, appW);

    gl.viewport(0, 0, W, Hh); gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
    glChk('frame'); pickLights(eye, t);
    drawTerrain(TM, eye, VPf, false); drawWater(VPf, eye); litSetup(VPf); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); drawUnits(eye, VPf, false, 15000); drawSites(eye, VPf, false, 15000); if (NPCM) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d < 30000 && !((n.fleet || n.coast) && d < 1500)) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
    glChk('far'); drawVind(VPf, eye, dt, true); glChk('vindF');
    drawSea(VPf, eye, t, 1); glChk('seaF');
    drawSeaLights(VPf, eye, t, false);
    lifePts(VPf, eye, t, true);
    if (env.night > 0.02){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      if (BLD) drawChunkLights(VPf, eye);
      else if (LIGHTS.length){ const n = Math.min(LIGHTS.length / 3, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = LIGHTS[i * 3] - eye[0]; PB[i * 3 + 1] = LIGHTS[i * 3 + 1] - eye[1]; PB[i * 3 + 2] = LIGHTS[i * 3 + 2] - eye[2]; PA[i] = env.night * 0.9; } drawPts(n, gl.POINTS, VPf, [1, 0.78, 0.42], 5000, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // near pass
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const VT = vtype(), VG = GEO(VT), ncrew = Math.min(crewAboard().length, (VG.crewSpots || []).length); if (VG.hand) useHand(VT);
    drawTerrain(TM, eye, VPn, true); updateWater(eye); drawWater(VPn, eye); litSetup(VPn); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); glChk('nearT'); drawTrees(VPn, eye); drawNear(VPn, eye, t); glChk('trees'); drawVind(VPn, eye, dt, false); glChk('vind'); litSetup(VPn);
    // whoever works the deck leaves their place: alone, the skipper leaves the wheel
    // resting ashore in the naust or a rorbu (15-energy.js; Jonas 05.10.2026: «Ved hvile forsvinner skipperen fra båten») he is not aboard
    // never more people aboard than the crew list (tilbakemelding #24): the crew at the hauler and the one at the table leave their
    // places, and with you ashore one of the crew is at the wheel
    DECKACT = deckActivity(); const awaySk = (DECKACT.on && DECKACT.me) || gopMe() || (meAboard() && resting()), awayCr = DECKACT.on && DECKACT.crew ? 1 : 0;
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
    if (VG.hand){ drawSkiff(BMrel, VPn, dt, !cam.helm && !awaySk, deckCrew > 0); gl.useProgram(PL.p); }
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
    const plant = PM ? nearestPlant(eye) : null; drawUnits(eye, VPn, true, nearFar, plant && plant.id); drawSites(eye, VPn, true, nearFar);
    const pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null;
    // a hand at the plant says his line: over his head, else over the first hand who is out
    if (SAY.w && plant && plant.id === SAY.w.pid && plant.wpos && performance.now() - SAY.t0 < SAYMS){ const q = plant.wpos[SAY.w.idx] || plant.wpos[Object.keys(plant.wpos)[0]]; if (q) SAY.a = [q.x - eye[0], q.y + 2.1 - eye[1], q.z - eye[2]]; }
    if (SAY.b && performance.now() - SAY.t0 < SAYMS){ const n = (npcNow || []).find(q => q.id === SAY.b); if (n) SAY.a = [n.p.x * 1000 - eye[0], (env.tide || 0) + 7 - eye[1], n.p.y * 1000 - eye[2]]; }
    const bunk = PM ? nearestBunker(eye) : null; if (bunk) bunk.last = drawBunker(bunk, eye, VPn, t, BMrel); gl.useProgram(PL.p);
    wildSpawn(t); drawNPC(eye, t, H, VPn); drawAir(eye, t, H, VPn); drawGearSea(eye, t, VPn, H); drawDocks(eye, t, VPn); drawFloats(eye, t, VPn); drawMarinas(eye, t, VPn); drawWild(eye, t, dt); drawLife(eye, t, VPn); lifePts(VPn, eye, t, false);

    // the ensign in its hours (core/03-simulation.js flagUp; always while the paint shop tries one on); the pennant flies day and night
    gl.disableVertexAttribArray(2);
    if (PAINTPRE || flagUp(S.t / 60, S.boat.pos)){ const pole = xf(BMrel, VG.pole), fl = flagTex(), FM = model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0);
      drawTexQuad(FLAGM, FLAGM.tex, fl.shape === 'vimpel' ? chain(FM, new Float32Array([1.7, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])) : FM, VPn, true, [0, 0.6, 0]); }
    { const pen = S.ach && S.ach.pen ? Math.min(3, S.ach.pen | 0) : 0, mt = pen && mastTop(VG); if (mt){ const P = xf(BMrel, mt); drawTexQuad(FLAGM, penTex(), chain(model(P[0], P[1], P[2], Math.PI / 2 - appB, 0, 0), PEN_S[pen - 1]), VPn, true, [0, 0.6, 0]); } }
    gl.useProgram(PL.p);
    if (SHOW && SHOW.M && GEO(SHOW.t).open && pvm(SHOW.t).cap){ gl.colorMask(false, false, false, false); drawLit(pvm(SHOW.t).cap, SHOW.M); gl.colorMask(true, true, true, true); }
    { const cap = VG.hand ? (SK ? SK.cap : CAPM) : VG.open ? pvm(VT, hullLiv(S.boat)).cap : null; if (cap){ gl.colorMask(false, false, false, false); drawLit(cap, BMrel); gl.colorMask(true, true, true, true); } }
    glChk('nearObj'); drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false);
    glChk('seaN'); drawBeams(VPn, eye, t);
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawAirLights(VPn, t); drawRescueLights(VPn, t); drawSeaLights(VPn, eye, t, true);
    if (VG.hand) drawSkiffGlass(BMrel, VPn); else { const gm = pvm(VT, hullLiv(S.boat)).glass; drawGlass(gm, BMrel, VPn); drawDrops(gm, BMrel, VPn, t); }
    if (SHOW && SHOW.M) drawGlass(pvm(SHOW.t).glass, SHOW.M, VPn);
    drawNPCGlass(VPn);
    if (pr && pr.spray){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(pr.spray, gl.POINTS, VPn, [0.86, 0.93, 1], 30, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (pr && env.night > 0.05){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); pr.lamps.forEach((q, i) => { PB[i * 3] = q[0]; PB[i * 3 + 1] = q[1]; PB[i * 3 + 2] = q[2]; PA[i] = env.night; }); drawPts(pr.lamps.length, gl.POINTS, VPn, [1, 0.9, 0.72], 1400, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (env.night > 0.05){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      // at anchor only the all-round white light shows (no side lights or stern light, which are for a boat under way); the anchor
      // alarm turns it red and makes it flash (06e-anchor.js)
      const b0 = S.boat, anchored = !!b0.anch && b0.status !== 'port', alarm = performance.now() < ANCHAL.until, V0 = VESSELS[vtype()] || {len:8};
      // the lanterns after Sjøveisreglene (vessel3d.js lanterns, 17.10.2026): what she shows follows what she does
      let L3 = lanterns(VG, V0, {port:b0.status === 'port', anch:anchored, v:b0.v || 0, fishing:b0.status === 'fishing' || !!b0.gop, trawl:V0.cls === 'hav' && !(V0.rigs || []).length, aground:b0.status === 'aground', nuc:b0.status === 'engine' || b0.status === 'adrift'}), drawn = L3.length;
      if (anchored && alarm && L3.length) L3 = L3.map(([p, c], i) => i ? [p, c] : [p, (performance.now() / 250) % 2 < 1 ? [1, 0.1, 0.06] : [0.25, 0.02, 0.02]]);   // the anchor alarm turns the light red and flashing (06e-anchor.js)
      ANCHAL.drawn = drawn;
      for (const [lp, lc] of L3){ const q = xf(BMrel, lp); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VPn, lc, anchored ? 420 : 260, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    updateLabels(VPf, eye, W, Hh);
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
    const B = [[], [], [], []];
    for (let i = 0; i < SMN; i++){
      if (SMK.age[i] >= SMK.life[i]) continue;
      SMK.age[i] += dt; SMK.vx[i] += (wx - SMK.vx[i]) * dr; SMK.vz[i] += (wz - SMK.vz[i]) * dr; SMK.vy[i] *= 1 - Math.min(1, dt * 0.6);
      SMK.x[i] += SMK.vx[i] * dt; SMK.y[i] += SMK.vy[i] * dt; SMK.z[i] += SMK.vz[i] * dt;
      const a = SMK.age[i] / SMK.life[i]; if (Math.hypot(SMK.x[i] - eye[0], SMK.z[i] - eye[2]) < 250) B[Math.min(3, Math.floor(a * 4))].push(i);
    }
    B.forEach((L, q) => {
      let n = 0;
      for (const i of L){ const a = SMK.age[i] / SMK.life[i]; PB[n * 3] = SMK.x[i] - eye[0]; PB[n * 3 + 1] = SMK.y[i] - eye[1]; PB[n * 3 + 2] = SMK.z[i] - eye[2]; PA[n] = Math.pow(1 - a, 1.6) * (0.3 + 0.22 * SMK.k[i]); n++; }
      drawPts(n, gl.POINTS, VP, col, [320, 700, 1150, 1700][q], 2, null, 512);
    });
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

