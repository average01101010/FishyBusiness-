  // ---------- wildlife ----------
  function bodyLoft(m, L, R, prof, col, belly, y0){
    const NS = 12, NA = 8, ring = s => { const r = R * prof(s), z = -L / 2 + s * L; return Array.from({length:NA}, (_, k) => { const a = k / NA * Math.PI * 2; return [Math.sin(a) * r, (y0 || 0) + Math.cos(a) * r * 0.85, z]; }); };
    for (let i = 0; i < NS; i++){ const A = ring(i / NS), B2 = ring((i + 1) / NS); for (let k = 0; k < NA; k++){ const k2 = (k + 1) % NA, lowr = k >= 2 && k <= 5; m.quad(A[k], A[k2], B2[k2], B2[k], lowr && belly ? belly : col); } }
  }
  function buildWild(){
    const W = {};
    let m = MB(); m.box(0, -0.05, 0, 0.12, 0.11, 0.42, [0.95, 0.95, 0.94], 0); m.box(0, -0.02, -0.26, 0.09, 0.09, 0.1, [0.97, 0.97, 0.96], 0); m.box(0, -0.01, -0.33, 0.03, 0.03, 0.06, [0.95, 0.75, 0.2], 0); m.box(0, -0.04, 0.24, 0.14, 0.03, 0.12, [0.85, 0.86, 0.87], 0); W.gull = m.mesh();
    const wing = sx => { const w = MB(), g = [0.62, 0.66, 0.7], k = [0.1, 0.1, 0.1]; w.quad([0.05 * sx, 0, -0.1], [0.5 * sx, 0, -0.05], [0.5 * sx, 0, 0.1], [0.05 * sx, 0, 0.12], g); w.quad([0.5 * sx, 0, -0.05], [0.72 * sx, 0, 0], [0.72 * sx, 0, 0.07], [0.5 * sx, 0, 0.1], k); return w.mesh(); };
    W.wingR = wing(1); W.wingL = wing(-1);
    // the gulls from Blender (tools/wild/maake.py, the user's wish 03.10.2026): a herring gull, and a great black-backed gull from the
    // same parts with the mantle and the upper wing (zone 1) painted black-grey; the wings beat at the shoulder and the wrist
    if (typeof glbHas === 'function' && glbHas('gull')){
      const G = glbLoad('gull'), ex = (G && G.ex) || {}, mk = (nm, zc) => { const o = glbPart('gull', nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++){ const z = zc && o.zone[i] === 1; for (let k = 0; k < 3; k++) c[i * 3 + k] = z ? zc[k] * (o.ao[i] || 1) : o.c[i * 4 + k]; }
        return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
      if (ex.shoulder && ex.wrist){
        W.G = {sh:ex.shoulder, wr:ex.wrist};
        for (const [k, zc] of [['gullG', null], ['gullB', [0.16, 0.17, 0.19]]]) W[k] = {body:mk('body', zc), armR:mk('armR', zc), handR:mk('handR', zc), armL:mk('armL', zc), handL:mk('handL', zc)};
      }
    }
    const prof = s => Math.sin(Math.min(1, s * 1.15) * Math.PI) ** 0.6 * (s > 0.85 ? 1 - (s - 0.85) * 4 : 1) + 0.05;
    m = MB(); bodyLoft(m, 1.7, 0.28, prof, [0.2, 0.22, 0.25], [0.55, 0.57, 0.6]); m.tri([0, 0.2, -0.02], [0, 0.45, 0.14], [0, 0.2, 0.28], [0.18, 0.2, 0.22]); W.porpoise = m.mesh();
    m = MB(); bodyLoft(m, 7, 0.95, prof, [0.05, 0.05, 0.06], [0.92, 0.92, 0.9]); m.tri([0, 0.75, -0.5], [0, 2.4, 0.35], [0, 0.75, 0.6], [0.05, 0.05, 0.06]); m.box(0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); m.box(-0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); W.orca = m.mesh();
    m = MB(); bodyLoft(m, 13, 1.6, prof, [0.13, 0.14, 0.16], [0.4, 0.42, 0.45]); m.tri([0, 1.3, 1.6], [0, 1.75, 2.3], [0, 1.3, 2.7], [0.13, 0.14, 0.16]); W.humpback = m.mesh();
    m = MB(); const d = [0.13, 0.14, 0.16], wht = [0.85, 0.85, 0.83];
    m.tri([0, 0, 0], [-2.3, 0, 1.1], [-0.4, 0, 1.3], wht); m.tri([0, 0, 0], [2.3, 0, 1.1], [0.4, 0, 1.3], wht); m.tri([0, 0.02, 0], [-0.4, 0.02, 1.3], [0.4, 0.02, 1.3], d); m.box(0, -0.3, -1.4, 0.5, 0.6, 2.6, d, 0); W.fluke = m.mesh();
    WILDM = W;
  }
  const GULLS = Array.from({length:6}, (_, i) => ({ph:i * 1.13, r:9 + i * 3.2, w:0.32 + (i % 3) * 0.1, h:6 + (i * 2.3) % 8, dir:i % 2 ? 1 : -1, blk:i % 3 === 1}));
  const WILD = {ev:[], next:8};
  const SPEC = {porpoise:{T:1.3, I:4.5, K:4, v:2.4, sp:4, n:[1, 3], r:0.28}, orca:{T:2.2, I:7, K:4, v:3, sp:9, n:[3, 5], r:0.95}, humpback:{T:3.6, I:14, K:4, v:1.4, sp:14, n:[1, 2], r:1.6}};
  function wildSpawn(t){
    if (t < WILD.next) return; WILD.next = t + 16 + Math.random() * 28;
    if (S.boat.status === 'port' || WV.hs > 1.6) return;
    const p = {x:bv.x / 1000, y:bv.z / 1000}, dd = depthF(p), mo = gDate(S.t / 60).getUTCMonth(), winter = (mo >= 10 || mo <= 1) ? 1 : (mo === 2 || mo === 9) ? 0.35 : 0.08;
    let type = null; const r = Math.random();
    if (dd > 40 && r < 0.4 * winter) type = Math.random() < 0.55 ? 'orca' : 'humpback'; else if (dd > 6 && r < 0.7) type = 'porpoise';
    if (!type) return;
    const a = Math.random() * Math.PI * 2, dm = type === 'porpoise' ? 45 + Math.random() * 90 : 160 + Math.random() * 260, x = bv.x + Math.sin(a) * dm, z = bv.z - Math.cos(a) * dm;
    if (isLand({x:x / 1000, y:z / 1000}) || depthF({x:x / 1000, y:z / 1000}) < 5) return;
    const sp = SPEC[type], n = sp.n[0] + Math.floor(Math.random() * (sp.n[1] - sp.n[0] + 1));
    WILD.ev.push({type, t0:t, x, z, hd:Math.random() * Math.PI * 2, n, blown:{}});
    if (WILD.ev.length > 4) WILD.ev.shift();
  }
  const BLOW = {x:new Float64Array(160), y:new Float64Array(160), z:new Float64Array(160), vx:new Float64Array(160), vy:new Float64Array(160), vz:new Float64Array(160), age:new Float64Array(160).fill(99), life:new Float64Array(160).fill(1), n:0};
  function blow(x, y, z){ for (let i = 0; i < 26; i++){ const k = BLOW.n = (BLOW.n + 1) % 160; BLOW.x[k] = x; BLOW.y[k] = y; BLOW.z[k] = z; BLOW.vx[k] = (Math.random() - 0.5) * 1.2 + env.windDir[0] * 1.5; BLOW.vz[k] = (Math.random() - 0.5) * 1.2 + env.windDir[1] * 1.5; BLOW.vy[k] = 3 + Math.random() * 4.5; BLOW.age[k] = 0; BLOW.life[k] = 1.6 + Math.random() * 1.4; } }
  function drawWild(eye, t, dt, M0){
    if (!WILDM) return;
    const night = env.night > 0.85;
    // gulls follow the boat in daylight
    if (!night && !cam.helm || !night && cam.helm){
      const st = S.boat.status, gut = (DECKACT.on && DECKACT.task === 'gut' && DECKACT.pt) || DKGULL, n = gut ? 6 : st === 'port' ? 3 : st === 'fishing' ? 6 : 4, fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
      for (let i = 0; i < n; i++){
        const g = GULLS[i], ang = t * g.w * g.dir + g.ph, cx = bv.x - fx * 8, cz = bv.z - fz * 8;
        let x = cx + Math.cos(ang) * g.r, z = cz + Math.sin(ang) * g.r, y = bv.y + (st === 'fishing' ? 2.5 + g.h * 0.4 : g.h) + Math.sin(t * 0.7 + g.ph) * 1.2;
        if (gut && i < 4){ const q = (t * 0.22 + i * 0.27) % 1; if (q < 0.35){ const k = Math.sin(q / 0.35 * Math.PI), P0 = gut; x += (P0[0] + Math.cos(i * 2.1) * 1.2 - x) * k; z += (P0[2] + Math.sin(i * 2.1) * 1.2 - z) * k; y += (P0[1] + 0.25 - y) * k; } }
        const vx = -Math.sin(ang) * g.dir, vz = Math.cos(ang) * g.dir, hd = Math.atan2(vx, -vz);
        // a few beats, then a glide (more beats and faster when it goes down for the offal)
        const diving = gut && i < 4, beating = diving || Math.sin(t * 0.5 + g.ph * 3) > 0.35, flap = beating ? Math.sin(t * 9 + g.ph) * 0.6 : 0.1 + Math.sin(t * 1.3 + g.ph) * 0.05;
        const ph = t * (diving ? 21 : 15.7) + g.ph * 7, pw = ph + 0.3 * Math.sin(ph);   // the downstroke quicker than the upstroke
        if (beating) y -= 0.05 * Math.sin(pw);   // the body rises as the wings come down
        const Mb = model(x - eye[0], y - eye[1], z - eye[2], -hd, beating ? 0.04 * Math.cos(pw) : 0, -g.dir * 0.35);
        if (WILDM.G){
          // two in six are great black-backed gulls, a little larger; the beat about 2.5 a second, the hand a little after the arm (the
          // whip of a real wing beat); gliding, the arms raised a little and the hands drooped (a gull's shallow M)
          const K = g.blk ? WILDM.gullB : WILDM.gullG, Ms = g.blk ? mul(Mb, M4.S(1.15)) : Mb, S0 = WILDM.G.sh, W0 = WILDM.G.wr, amp = diving ? 0.7 : 0.55;
          const a1 = beating ? 0.1 + amp * Math.sin(pw) : 0.08 + Math.sin(t * 1.3 + g.ph) * 0.04, a2 = beating ? 0.45 * Math.sin(pw - 0.8) : -0.16 + Math.sin(t * 1.1 + g.ph) * 0.03 + 0.05 * Math.sin(t * 0.37 + g.ph * 2);
          drawLit(K.body, Ms);
          for (const sd of [1, -1]){
            const Ma = chain(Ms, M4.T(S0[0] * sd, S0[1], S0[2]), M4.RZ(a1 * sd)); drawLit(sd > 0 ? K.armR : K.armL, Ma);
            drawLit(sd > 0 ? K.handR : K.handL, chain(Ma, M4.T((W0[0] - S0[0]) * sd, W0[1] - S0[1], W0[2] - S0[2]), M4.RZ(a2 * sd)));
          }
        }
        else { drawLit(WILDM.gull, Mb); drawLit(WILDM.wingR, mul(Mb, model(0, 0, 0, 0, 0, flap))); drawLit(WILDM.wingL, mul(Mb, model(0, 0, 0, 0, 0, -flap))); }
      }
    }
    // porpoises and whales surfacing
    for (let e = WILD.ev.length - 1; e >= 0; e--){
      const ev = WILD.ev[e], sp = SPEC[ev.type], age = t - ev.t0;
      if (age > sp.K * sp.I + (ev.type === 'humpback' ? 8 : 3)){ WILD.ev.splice(e, 1); continue; }
      const dx = Math.sin(ev.hd), dz = -Math.cos(ev.hd), px = -dz, pz = dx;
      for (let j = 0; j < ev.n; j++){
        const off = (j - (ev.n - 1) / 2) * sp.sp, lag = j * 0.7;
        for (let k = 0; k < sp.K; k++){
          const lt = age - k * sp.I - lag, T = sp.T; if (lt < 0 || lt > T + (ev.type === 'humpback' && k === sp.K - 1 ? 4 : 0)) continue;
          const along = sp.v * (age - lag), x = ev.x + dx * along + px * off, z = ev.z + dz * along + pz * off;
          if (Math.hypot(x - eye[0], z - eye[2]) > 2500) continue;
          const key = j * 10 + k;
          if (ev.type === 'humpback' && !ev.blown[key] && lt > 0.1){ ev.blown[key] = 1; blow(x + dx * 4.5, 0.6, z + dz * 4.5); }
          if (ev.type === 'orca' && !ev.blown[key] && lt > 0.3){ ev.blown[key] = 1; blow(x + dx * 2.5, 0.3, z + dz * 2.5); }
          const u = Math.min(1, lt / T), y = -sp.r * 1.25 + Math.sin(Math.PI * u) * (sp.r * 1.3 + 0.12), pitch = Math.cos(Math.PI * u) * 0.35;
          if (u < 1) drawLit(WILDM[ev.type], model(x - eye[0], y - eye[1], z - eye[2], -ev.hd, pitch, 0));
          if (ev.type === 'humpback' && k === sp.K - 1 && lt > T * 0.55){
            const f = Math.min(1, (lt - T * 0.55) / 1.5) * (lt > T + 2.5 ? Math.max(0, 1 - (lt - T - 2.5) / 1.5) : 1);
            drawLit(WILDM.fluke, model(x - dx * 5.5 - eye[0], -2.6 + f * 3.6 - eye[1], z - dz * 5.5 - eye[2], -ev.hd, -1.35 * f, 0));
          }
        }
      }
    }
  }
  function drawBlows(VP, eye, dt){
    let n = 0;
    for (let i = 0; i < 160; i++){
      if (BLOW.age[i] >= BLOW.life[i]) continue;
      BLOW.age[i] += dt; BLOW.vy[i] -= 2.2 * dt; BLOW.x[i] += BLOW.vx[i] * dt; BLOW.y[i] += BLOW.vy[i] * dt; BLOW.z[i] += BLOW.vz[i] * dt;
      PB[n * 3] = BLOW.x[i] - eye[0]; PB[n * 3 + 1] = BLOW.y[i] - eye[1]; PB[n * 3 + 2] = BLOW.z[i] - eye[2]; PA[n] = Math.max(0, 1 - BLOW.age[i] / BLOW.life[i]) * 0.55; n++;
    }
    if (n){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); const c = Math.min(1, env.amb[0] * 1.3 + env.sunCol[0] * 0.8); drawPts(n, gl.POINTS, VP, [c, c, Math.min(1, c * 1.03)], 1600, true); gl.depthMask(true); gl.disable(gl.BLEND); }
  }

  // ---------- other vessels ----------
  function shipHull(m, L, B, D, F, hull, bottom, deck){
    const NS = 14, hw = s => (B / 2) * (s < 0.62 ? 0.94 + 0.06 * s / 0.62 : Math.sqrt(Math.max(0, 1 - ((s - 0.62) / 0.38) ** 2))), zs = s => L / 2 - s * L, fs = s => F + 0.25 * F * s * s;
    const prof = s => { const w = hw(s), f = fs(s), z = zs(s); return [[-w, f, z], [-w * 0.98, 0, z], [-w * 0.8, -D * 0.85, z], [0, -D, z], [w * 0.8, -D * 0.85, z], [w * 0.98, 0, z], [w, f, z]]; };
    const cols = [hull, bottom, bottom, bottom, bottom, hull];
    for (let i = 0; i < NS; i++){ const A = prof(i / NS), B2 = prof((i + 1) / NS); for (let j = 0; j < 6; j++) m.quad(A[j], A[j + 1], B2[j + 1], B2[j], cols[j]); m.quad([-hw(i / NS), fs(i / NS), zs(i / NS)], [hw(i / NS), fs(i / NS), zs(i / NS)], [hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], [-hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], deck); }
    const T = prof(0), c = [0, (F - D) / 2, L / 2]; for (let j = 0; j < 6; j++) m.tri(c, T[j], T[j + 1], hull); m.tri(c, T[6], T[0], hull);
  }
  function windows(m, x0, x1, y, z, h, col, sideX){ for (const sx of [-1, 1]) m.box(sideX * sx, y, (x0 + x1) / 2, 0.08, h, Math.abs(x1 - x0), col, 0); }
  function buildNPC(){
    const N = {}, WHT = [0.92, 0.93, 0.92], DK = [0.1, 0.12, 0.15], RB = [0.5, 0.12, 0.1];
    let m = MB(); shipHull(m, 10.5, 3.8, 1.1, 1.2, [0.88, 0.9, 0.92], RB, [0.62, 0.6, 0.55]);
    m.box(0, 1.2, 1.4, 2.4, 2.0, 2.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 2.35, 0.02, 2.46, 0.6, 0.06, DK, 0); windows(m, 0.2, 2.6, 2.35, 0, 0.6, DK, 1.23);
    m.box(0, 3.2, 0.3, 0.12, 3.2, 0.12, [0.3, 0.3, 0.3], 0); m.box(0, 1.2, -3.2, 1.6, 0.35, 1.2, [0.35, 0.37, 0.4], 0); N.sjark = m.mesh();
    m = MB(); shipHull(m, 52, 13, 2.8, 3.2, [0.12, 0.25, 0.45], RB, [0.4, 0.4, 0.42]);
    m.box(4.8, 3.2, 2, 3.2, 5.5, 34, WHT, 0); windows(m, -12, 16, 6.2, 2, 1.1, DK, 3.25 + 1.6);
    m.box(4.8, 8.7, -6, 5, 3, 6, WHT, 0, [0.3, 0.3, 0.3]); m.box(4.8, 10.2, -9.05, 5.1, 1.1, 0.1, DK, 0);
    m.box(-5.5, 3.2, 0, 1.2, 1.1, 44, [0.85, 0.85, 0.8], 0); m.box(0, 3.3, 0, 8, 0.1, 44, [0.35, 0.35, 0.36], 0); N.ferry = m.mesh();
    m = MB(); shipHull(m, 112, 19, 5.5, 6.5, [0.07, 0.07, 0.08], RB, [0.5, 0.5, 0.5]);
    m.box(0, 6.5, 6, 17.6, 14, 70, WHT, 0, [0.7, 0.72, 0.73]);
    for (let r = 0; r < 4; r++) windows(m, -26, 38, 8 + r * 3.2, 6, 1.1, DK, 8.85);
    m.box(0, 20.5, -24, 14, 3.5, 10, WHT, 0); m.box(0, 22.2, -29.1, 14.2, 1.3, 0.2, DK, 0);
    m.box(0, 20.5, 20, 3.2, 7, 5, [0.1, 0.1, 0.1], 0, [0.1, 0.1, 0.1]); m.box(0, 26.2, 20, 3.3, 1.2, 5.1, [0.7, 0.12, 0.1], 0);
    m.box(0, 20.5, -12, 0.3, 9, 0.3, [0.85, 0.85, 0.85], 0); N.coastal = m.mesh();
    m = MB(); shipHull(m, 16, 5.8, 2.4, 2.0, [0.72, 0.16, 0.12], [0.3, 0.3, 0.32], [0.55, 0.55, 0.52]);
    m.box(0, 2.0, -2.2, 3.6, 2.6, 3.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 3.9, -4.12, 3.66, 0.7, 0.06, DK, 0); windows(m, -4.0, -0.4, 3.9, -2.2, 0.7, DK, 1.83);
    m.box(0, 4.6, -1.2, 0.18, 5.5, 0.18, [0.85, 0.85, 0.85], 0); m.box(0, 2.0, 4.2, 1.2, 2.2, 1.2, [0.85, 0.7, 0.15], 0); m.box(0, 4.1, 5.2, 0.25, 0.25, 2.8, [0.85, 0.7, 0.15], 0.3);
    N.kyst = m.mesh();
    N.lights = {kyst:[[0, 10.2, -1.2, 'w'], [-1.9, 5.3, -2.2, 'r'], [1.9, 5.3, -2.2, 'g'], [0, 2.8, 7.8, 'w']], sjark:[[0, 6.4, 0.3, 'w'], [-1.25, 3.4, 0.2, 'r'], [1.25, 3.4, 0.2, 'g'], [0, 1.6, 5.3, 'w']],
      ferry:[[4.8, 13.5, -6, 'w'], [2, 11, -8, 'r'], [7.6, 11, -8, 'g'], [0, 4, 26, 'w']],
      coastal:[[0, 30, -12, 'w'], [-7.2, 23.5, -26, 'r'], [7.2, 23.5, -26, 'g'], [0, 13, 55, 'w']]};
    N.lightPx = {sjark:260};   // the small boats' lights are smaller
    NPCM = N;
  }
  const NLC = {w:[1, 0.95, 0.85], r:[1, 0.12, 0.1], g:[0.1, 1, 0.35]};
  // the player's vessels other than the skiff: meshes from the vessel kit (vessel3d.js), built the first time each type is shown
  const PVM = {}; let PERS = null;
  // a vessel's buffers by type; your own painted boat (liv, vessel3d.js hullLiv) has buffers of its own, whose colours are uploaded
  // again when the paint changes (the shape is the same), so trying colours in the paint shop builds nothing new
  function pvm(t, liv){
    const key = liv ? t + '|own' : t; let E = PVM[key];
    // a design that cuts the hull (vessel3d.js livGeo) is a new shape: the own buffers are built again
    if (E && liv && E.geoK !== livGeo(liv)){ for (const b of [E.hull.pb, E.hull.nb, E.hull.cb]) gl.deleteBuffer(b); E = PVM[key] = null; }
    if (!E){ const m = liv ? buildVesselModel(t, 1, liv) : vesselModel(t); if (!m) return null;
      const up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3});
      let cap = null; if (m.cap){ const c = MB(); for (const tr of m.cap) c.tri(tr[0], tr[1], tr[2], [0, 0, 0]); cap = c.mesh(); }
      E = PVM[key] = {hull:up(m.o), glass:up(m.glass), cap, livK:livKey(liv), geoK:livGeo(liv)}; }
    if (liv){ const k = livKey(liv); if (E.livK !== k){ E.livK = k; const m = buildVesselModel(t, 1, liv);
      if (m && m.o.c.length === E.hull.n * 4){ gl.bindBuffer(gl.ARRAY_BUFFER, E.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.o.c), gl.STATIC_DRAW); } } }
    return E;
  }
  // the people on the boats seen from outside: the own boat's skipper and crew by their looks, each local boat's by a look from her id (a dozen
  // in all), made once and kept (kind: 'skip' at the wheel, 'skipDeck' on deck, 'crew')
  const PV = {};
  function personMesh(kind, look, key){
    if (PV[key]) return PV[key];
    const ks = Object.keys(PV); if (ks.length > 160){ for (const q of ks){ const m = PV[q]; gl.deleteBuffer(m.pb); gl.deleteBuffer(m.nb); gl.deleteBuffer(m.cb); delete PV[q]; } }
    const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, kind === 'skip' ? [[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]] : null, null, look);
    return PV[key] = {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3};
  }
  const ownPerson = (kind, i) => { const l = kind === 'crew' ? lookCrew(i) : lookMe(); if (!l) return null; const key = 'o|' + kind + '|' + lookKey(l); return PV[key] || personMesh(kind, l, key); };
  // a boat of another player: her skipper's and crew's looks as she sent them (lk, ck); the local boats' from a look made from the id
  const npcPerson = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, key = 'p|' + kind + '|' + code, look = !PV[key] && lookFromKey(code); if (PV[key]) return PV[key]; if (look) return personMesh(kind, look, key); }
    const h = lookHash(String(n.id)) % 12, key = 'n|' + kind + '|' + h; return PV[key] || personMesh(kind, lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea'), key);
  };
  function people(){
    if (PERS) return PERS; const mk = (hands, suit, kit) => { const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, hands, suit, kit); return {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3}; };
    return PERS = {skip:mk([[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]], [0.93, 0.4, 0.1, 0.3], 'skipper'), skipDeck:mk(null, [0.93, 0.4, 0.1, 0.3], 'skipper'), crew:mk(null, [0.95, 0.75, 0.15, 0.3], 'crew')};
  }
