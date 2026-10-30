  // ---------- controls ----------
  const ptr = new Map(); let drag = null, pinch = null;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, {x:e.clientX, y:e.clientY}); if (ptr.size === 1) drag = {x:e.clientX, y:e.clientY}; else if (ptr.size === 2){ const [a, b] = [...ptr.values()]; pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, dist:cam.dist, zoom:cam.zoom}; } });
  canvas.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptr.size === 2 && pinch){ const [a, b] = [...ptr.values()], dd = Math.hypot(a.x - b.x, a.y - b.y) || 1; if (cam.helm) cam.zoom = clamp(pinch.zoom * dd / pinch.d, 1, 8); else cam.dist = clamp(pinch.dist * pinch.d / dd, 7, 8000); }
    // on the bridge a drag down looks down, as a drag to the right looks right (tilbakemelding #40)
    else if (drag && ptr.size === 1){ if (cam.helm){ const z = cam.zoom || 1; cam.hy = clamp(cam.hy - (e.clientX - drag.x) * 0.005 / z, -2.6, 2.6); cam.hp = clamp(cam.hp - (e.clientY - drag.y) * 0.004 / z, -0.6, 0.5); } else { cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * 0.004, 0.02, 1.4); } drag = {x:e.clientX, y:e.clientY}; }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (ptr.size === 1){ const [p] = [...ptr.values()]; drag = {x:p.x, y:p.y}; } else if (!ptr.size) drag = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('dblclick', () => { if (cam.helm){ const G = GEO(vtype()); cam.zoom = 1; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } }); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); if (cam.helm) cam.zoom = clamp(cam.zoom * Math.exp(-e.deltaY * 0.0015), 1, 8); else cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.0012), 7, 8000); }, {passive:false});

  // the paint shop (ui/10j-paint.js): the camera turns slowly round your own boat, and she sits in the middle of what the drawer leaves
  // free (left of it lying down, above it standing up), so the colour being tried is seen as it is chosen
  let PAINTV = null;
  function paintView(on){
    if (on){ if (PAINTV) return; PAINTV = {was:active, yaw:cam.yaw, pitch:cam.pitch, dist:cam.dist, el:document.getElementById('drawer')};
      const V = VESSELS[vtype()]; cam.pitch = 0.2; cam.dist = Math.max(11, V.len * 1.6); cam.yaw = 1.1; if (!active) show(true, true); }
    else if (PAINTV){ const P = PAINTV; PAINTV = null; cam.yaw = P.yaw; cam.pitch = P.pitch; cam.dist = P.dist; if (!P.was) show(false); }
  }
  function paintAim(C, yawW){
    const el = PAINTV.el; if (!el || el.hidden) return; const r = el.getBoundingClientRect(), W = innerWidth || 1, Hh = innerHeight || 1, tf = Math.tan(27.5 * DEG) * cam.dist;
    if (r.left > W * 0.3){ const k = (W - r.left) / W * tf * (W / Hh); C[0] += Math.cos(yawW) * k; C[2] += Math.sin(yawW) * k; }
    else C[1] -= Math.max(0, Hh - r.top) / Hh * tf;
  }
  // the market's showroom: a vessel type drawn afloat off the harbour you are in, the camera turning round it; null ends it
  let SHOW = null;
  function showroom(type){
    if (!type){ if (SHOW){ const was = SHOW.was; SHOW = null; cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; if (!was) show(false); } if (hooks.onShowroom) hooks.onShowroom(null); return; }
    const V = VESSELS[type]; if (!V || !vesselSpec(type)) return;
    const b = S.boat, pt = (b.port && portById(b.port)) || nearestPort(b.pos), a = approachPath(pt), q = a.length ? [a[0], a[a.length - 1]].sort((u, w) => dist(w, pt.p) - dist(u, pt.p))[0] : b.pos;
    SHOW = {t:type, x:q.x * 1000, z:q.y * 1000, h:Math.atan2(pt.p.x - q.x, -(pt.p.y - q.y)) + 1.2, was:active};
    cam.helm = false; cam.pitch = 0.18; cam.dist = Math.max(13, V.len * 1.7); cam.yaw = 1.1;
    if (!active) show(true);
    if (hooks.onShowroom) hooks.onShowroom(type);
  }
  function show(on, auto){
    if (on && !ready){
      const no3d = () => toast(t('no3d') + (failWhy ? ' (' + failWhy + ')' : ''));
      if (failed){ if (!auto) no3d(); return false; }
      if (!loading){ loading = true; toast(t('loading3d')); init().then(ok => { loading = false; if (ok) show(true, auto); else { if (hooks.on3dFail) hooks.on3dFail(); if (!auto) no3d(); } }); }
      return false;
    }
    active = !!on; canvas.hidden = !active; labelsEl.hidden = !active;
    document.getElementById('map').style.visibility = active ? 'hidden' : 'visible';
    if (active){ bv.init = false; lastF = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
    if (hooks.onView) hooks.onView(active);
    return true;
  }
  // the measuring run (F0): every set-up of k (the model's work over) and n (more boats round her) for 2.5 s to settle and 4 s
  // measured, the camera off her quarter so the group is in view; the table goes on the screen and into window.BENCHR
  async function bench(ks, ns){
    ks = ks || [1, 2, 4, 8]; ns = ns || [0, 5, 10, 20]; const wait = ms => new Promise(r => setTimeout(r, ms)), out = [], c = cam, keep = {yaw:c.yaw, pitch:c.pitch, dist:c.dist, helm:c.helm};
    const el = document.createElement('div'); el.id = 'benchOut'; el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;background:rgba(0,0,0,0.82);color:#fff;font:13px/1.35 monospace;padding:10px 12px;border-radius:8px;max-width:94vw;white-space:pre;pointer-events:auto';
    document.body.appendChild(el); const G = GEO(vtype()) || {}, L = (G.stern || 5) * 2;
    const head = 'Måling F0 · ' + vtype() + ' · ' + (GPU || 'ukjent GPU') + ' · nivå ' + QUAL.lvl + ' · ' + innerWidth + '×' + innerHeight + ' @' + (window.devicePixelRatio || 1) + '\n k  båter   trekanter     ms   bilder/s  over 20 ms\n';
    BENCH.on = true; c.helm = false; c.yaw = 0.7; c.pitch = 0.35; c.dist = Math.max(30, L * 3.2);
    try {
      for (const n of ns) for (const k of ks){
        BENCH.k = k; BENCH.n = n; BENCH.rec = false; el.textContent = head + out.map(r => r.line).join('\n') + '\n… k=' + k + ' n=' + n; await wait(2500);
        BENCH.sum = BENCH.cnt = BENCH.slow = 0; BENCH.rec = true; await wait(4000); BENCH.rec = false;
        const ms = BENCH.cnt ? BENCH.sum * 1000 / BENCH.cnt : 0, r = {k, n, tris:BENCH.tris, ms:Math.round(ms * 10) / 10, fps:Math.round(ms ? 1000 / ms : 0), slow:BENCH.cnt ? Math.round(100 * BENCH.slow / BENCH.cnt) : 0};
        r.line = String(k).padStart(2) + String(n + 1).padStart(7) + String(r.tris).padStart(12) + String(r.ms).padStart(7) + String(r.fps).padStart(10) + String(r.slow + ' %').padStart(11); out.push(r);
      }
    } finally { BENCH.on = false; BENCH.k = 1; BENCH.n = 0; Object.assign(c, keep); }
    el.textContent = head + out.map(r => r.line).join('\n') + '\n\nTa et skjermbilde og send det. Trykk her for å lukke.'; el.onclick = () => el.remove();
    window.BENCHR = {gpu:GPU, lvl:QUAL.lvl, type:vtype(), rows:out.map(({line, ...r}) => r)}; return window.BENCHR;
  }
  if (/bench/.test(location.hash)) (function go(){ if (active && S.boat) setTimeout(() => bench(), 6000); else setTimeout(go, 1000); })();
  // ---------- the profile (#prof, F1) ----------
  // The parts of a frame as PMK marks them in frame0: the updates before drawing (the boat, the waves, the foam texture, the chunks, the
  // camera), the sky, the far pass's land, statics and boats, its wind turbines and sea, the near pass's land, statics, trees and the near
  // field, your boat with her people and deck and the plant she lies at, the other things (the fleet, the air, the gear in the sea, the
  // docks, the wildlife), the flags and the near sea, and the lights, glass and effects last.
  const PSEC = ['upd', 'sky', 'farT', 'farSea', 'nearT', 'boat', 'obj', 'nearSea', 'fx'];
  const PSNAME = {upd:'oppdatering', sky:'himmel', farT:'fjernt land', farSea:'fjern sjø', nearT:'nært land, trær', boat:'egen båt', obj:'flåten, ting', nearSea:'nær sjø', fx:'lys og glass'};
  // the GPU's timer: one TIME_ELAPSED query per part per frame, read some frames later, all dropped when the GPU says the times were
  // disjoint (a power state change); WebGL 2 has it as EXT_disjoint_timer_query_webgl2, WebGL 1 as EXT_disjoint_timer_query
  const PQ = {tried:false, x:null, v2:false, free:[], cur:null, frame:[], pend:[]}, PX1 = new Uint8Array(4);
  function pqInit(){ if (PQ.tried) return PQ.x; PQ.tried = true;
    try { PQ.x = (GL2 && gl.getExtension('EXT_disjoint_timer_query_webgl2')) || null; PQ.v2 = !!PQ.x; if (!PQ.x) PQ.x = gl.getExtension('EXT_disjoint_timer_query') || null; } catch (e){ PQ.x = null; }
    return PQ.x; }
  const pqNew = () => PQ.free.pop() || (PQ.v2 ? gl.createQuery() : PQ.x.createQueryEXT());
  const pqBegin = q => PQ.v2 ? gl.beginQuery(PQ.x.TIME_ELAPSED_EXT, q) : PQ.x.beginQueryEXT(PQ.x.TIME_ELAPSED_EXT, q);
  const pqEnd = () => PQ.v2 ? gl.endQuery(PQ.x.TIME_ELAPSED_EXT) : PQ.x.endQueryEXT(PQ.x.TIME_ELAPSED_EXT);
  const pqReady = q => PQ.v2 ? gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) : PQ.x.getQueryObjectEXT(q, PQ.x.QUERY_RESULT_AVAILABLE_EXT);
  const pqVal = q => PQ.v2 ? gl.getQueryParameter(q, gl.QUERY_RESULT) : PQ.x.getQueryObjectEXT(q, PQ.x.QUERY_RESULT_EXT);
  function pqPoll(){
    const dis = gl.getParameter(PQ.x.GPU_DISJOINT_EXT);
    while (PQ.pend.length){ const F = PQ.pend[0], last = F.q[F.q.length - 1]; if (!dis && last && !pqReady(last[1])) break; PQ.pend.shift();
      if (!dis){ let s = 0; for (const [k, q] of F.q){ const ms = pqVal(q) / 1e6; F.acc.gpu[k] = (F.acc.gpu[k] || 0) + ms; s += ms; } F.acc.gpuN++; F.acc.gpuSum += s; }
      for (const [, q] of F.q) if (dis) PQ.v2 ? gl.deleteQuery(q) : PQ.x.deleteQueryEXT(q); else PQ.free.push(q); }
  }
  const pAcc = () => ({n:0, sum:0, slow:0, js:0, cpu:{}, gpu:{}, gpuN:0, gpuSum:0, wait:0, hist:new Array(8).fill(0), lt:0, ltN:0});
  const PHIST = [9, 12, 15, 18, 22, 28, 36];   // the frame intervals' bins (ms): 144, 120, 90/72, 60, 50, 40, 30 Hz and slower
  // a frame begins (from frame0, with the interval since the last one and when frame() began)
  function profBegin(rdt, j0){ const P = PROF, A = P.acc; P.f0 = j0; P.cur = 'upd'; P.t0 = j0;
    if (P.rec && A){ A.n++; A.sum += rdt; if (rdt > 1 / 50) A.slow++; const ms = rdt * 1000; let b = 0; while (b < PHIST.length && ms >= PHIST[b]) b++; A.hist[b]++; }
    if (PQ.x && A){ PQ.frame = []; const q = pqNew(); pqBegin(q); PQ.frame.push(['upd', q]); PQ.cur = q; } }
  function profMark(k){ const P = PROF, A = P.acc; if (!A || !P.cur) return;
    if (P.sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, PX1);
    const n = performance.now(); if (P.rec) A.cpu[P.cur] = (A.cpu[P.cur] || 0) + n - P.t0; P.cur = k; P.t0 = n;
    if (PQ.x && PQ.cur){ pqEnd(); PQ.cur = null; if (k){ const q = pqNew(); pqBegin(q); PQ.frame.push([k, q]); PQ.cur = q; } } }
  function profEnd(){ const P = PROF, A = P.acc; profMark(null); if (!A) return;
    if (P.wait){ const w0 = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, PX1); if (P.rec) A.wait += performance.now() - w0; }
    if (P.rec) A.js += performance.now() - P.f0;
    if (PQ.x){ if (PQ.frame.length) PQ.pend.push({acc:A, q:PQ.frame}); PQ.frame = []; pqPoll(); } }
  // the run: each set-up 2.5 s to settle and 4 s measured, from where the camera is (put the boat where the frame is slow first); then the
  // parts of the frame live, every half second, until the table is tapped. The rows: the frame interval (ms and frames a second), the
  // share over 20 ms, the main thread's time in the frame (JS), the GPU's (where it has a timer) and the wait for the GPU at the end.
  const PSET = [['som nå', {}], ['tomt bilde', {skip:{all:1}}], ['tetthet 0,75', {dpr:0.75}], ['tetthet 1', {dpr:1}], ['tetthet full', {dpr:9}],
    ['uten terreng', {skip:{terr:1}}], ['uten sjø', {skip:{sea:1}}], ['uten trær/nær', {skip:{trees:1}}], ['uten båter', {skip:{boats:1}}],
    ['vent på GPU', {wait:true}], ['synk per del', {sync:true}]];
  async function prof(sets){
    sets = sets || PSET; const wait = ms => new Promise(r => setTimeout(r, ms)), out = [], P = PROF; let live = null, lt = null;
    const old = document.getElementById('profOut'); if (old) old.remove();
    const el = document.createElement('div'); el.id = 'profOut'; el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;background:rgba(0,0,0,0.84);color:#fff;font:12px/1.3 monospace;padding:10px 12px;border-radius:8px;max-width:96vw;max-height:96vh;overflow:auto;white-space:pre;pointer-events:auto';
    document.body.appendChild(el); pqInit();
    const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
    const head = () => 'Profil F1 · ' + vtype() + ' · ' + (GPU || 'ukjent GPU') + '\nWebGL ' + (GL2 ? 2 : 1) + ' · GPU-tid ' + (PQ.x ? 'ja' : 'nei (nettleseren gir ikke tidtakeren)') + ' · nivå ' + QUAL.lvl + ' · vindu ' + innerWidth + '×' + innerHeight + ' @' + (window.devicePixelRatio || 1) + ' · tegnes ' + canvas.width + '×' + canvas.height + '\n';
    const rowHead = 'oppsett             ms   b/s  >20ms     JS    GPU   vent  tegnes\n';
    const row = (nm, A, px) => { const n = Math.max(1, A.n), ms = A.sum * 1000 / n;
      return nm.padEnd(15) + f1(ms).padStart(7) + String(Math.round(ms ? 1000 / ms : 0)).padStart(6) + (Math.round(100 * A.slow / n) + ' %').padStart(7) + f1(A.js / n).padStart(7) + (A.gpuN ? f1(A.gpuSum / A.gpuN) : '-').padStart(7) + (A.wait ? f1(A.wait / n) : '-').padStart(7) + '  ' + px; };
    const hist = A => 'bildeintervall (ms): ' + ['<9', '9-12', '12-15', '15-18', '18-22', '22-28', '28-36', '>36'].map((b, i) => b + ':' + Math.round(100 * A.hist[i] / Math.max(1, A.n)) + '%').join(' ');
    const secs = (A, S) => 'del               JS ms  GPU ms  synk ms\n' + PSEC.map(k => PSNAME[k].padEnd(16) + f1((A.cpu[k] || 0) / Math.max(1, A.n)).padStart(7) + (A.gpuN ? f1((A.gpu[k] || 0) / A.gpuN) : '-').padStart(8) + (S ? f1((S.cpu[k] || 0) / Math.max(1, S.n)) : '-').padStart(9)).join('\n');
    const longTasks = A => { try { lt = new PerformanceObserver(l => { for (const e of l.getEntries()){ A.ltN++; A.lt += e.duration; } }); lt.observe({type:'longtask'}); } catch (e){ lt = null; } };
    let base = null, syncA = null;
    P.on = true;
    try {
      for (const [nm, o] of sets){
        Object.assign(P, {skip:o.skip || {}, dpr:o.dpr || 0, sync:!!o.sync, wait:!!o.wait, rec:false, acc:pAcc()});
        el.textContent = head() + rowHead + out.map(r => r.line).join('\n') + '\n… ' + nm; await wait(2500);
        const A = P.acc = pAcc(); if (lt) lt.disconnect(); longTasks(A); P.rec = true; await wait(4000); P.rec = false; await wait(150);
        const r = {set:nm, ms:Math.round(A.sum * 10000 / Math.max(1, A.n)) / 10, js:Math.round(A.js * 10 / Math.max(1, A.n)) / 10, gpu:A.gpuN ? Math.round(A.gpuSum * 10 / A.gpuN) / 10 : null, wait:Math.round(A.wait * 10 / Math.max(1, A.n)) / 10, slow:Math.round(100 * A.slow / Math.max(1, A.n)), px:canvas.width + '×' + canvas.height, lt:A.ltN, ltMs:Math.round(A.lt), hist:A.hist.slice()};
        r.line = row(nm, A, r.px); out.push(r); if (!base) base = A; if (o.sync) syncA = A;
      }
    } finally { Object.assign(P, {skip:{}, dpr:0, sync:false, wait:false, rec:false}); if (lt){ lt.disconnect(); lt = null; } }
    // what stays on the screen: the table, the first set-up's intervals and long tasks, and the parts of the frame now, live
    const sum = head() + rowHead + out.map(r => r.line).join('\n') + '\n\n' + (base ? hist(base) + '\nlange oppgaver (over 50 ms) i 4 s: ' + out[0].lt + ', ' + out[0].ltMs + ' ms\n\n' : '');
    window.PROFR = {gpu:GPU, gl:GL2 ? 2 : 1, timer:!!PQ.x, lvl:QUAL.lvl, type:vtype(), dpr:window.devicePixelRatio || 1, rows:out.map(({line, ...r}) => r), secs:base ? Object.fromEntries(PSEC.map(k => [k, {js:Math.round((base.cpu[k] || 0) * 100 / Math.max(1, base.n)) / 100, gpu:base.gpuN ? Math.round((base.gpu[k] || 0) * 100 / base.gpuN) / 100 : null, sync:syncA ? Math.round((syncA.cpu[k] || 0) * 100 / Math.max(1, syncA.n)) / 100 : null}])) : {}};
    let liveA = P.acc = pAcc(); P.rec = true;
    const show = () => { el.textContent = sum + 'Nå (siste 2 s):\n' + secs(liveA, syncA) + '\n' + row('nå', liveA, canvas.width + '×' + canvas.height) + '\n\nTa et skjermbilde og send det. Trykk her for å lukke.'; };
    show(); let tick = 0;
    live = setInterval(() => { if (!document.body.contains(el)){ clearInterval(live); P.on = false; P.acc = null; return; } if (++tick % 4 === 0){ show(); liveA = P.acc = pAcc(); } }, 500);
    el.onclick = () => { clearInterval(live); P.on = false; P.rec = false; P.acc = null; el.remove(); };
    return window.PROFR;
  }
  if (/prof/.test(location.hash)) (function go(){ if (active && S.boat) setTimeout(() => prof(), 6000); else setTimeout(go, 1000); })();
  return {
    bench, prof,
    // the quality: with a setting ('auto', 'low', 'mid', 'high') it applies it; returns the level now and the frame rate
    quality(v){ if (v){ S.settings.q3d = v; QUAL.bad = QUAL.good = 0; QUAL.cap = 2; qualSet(); } return {lvl:QUAL.lvl, set:S.settings.q3d || 'auto', fps:FPS.v, ultra:UINT}; },
    show, toggle(){ return show(!active); }, hold(on){ HOLD = !!on; if (!on) lastF = performance.now(); }, isActive:() => active, say:say3d, crewFx:crewFx3d, sayWorker, sayBoat, anchorAlarm:anchorAlarm3d, haltNeed:() => dynLive() ? dynHaltNeed() : active ? trkHaltNeed() : 0, get failWhy(){ return failWhy; },
    // the next frame as a JPEG data URL (or null when no frame comes within 2 s)
    // whether a point (km, and metres above the ground) is in the picture the camera shows now: in front within the picture's width,
    // and no ground between (Kystposten's lighthouse pictures, ui/05f-turer.js)
    seen(xk, yk, hm){ if (!active || NO3D || !canvas) return null; const e = lastEye, x = xk * 1000, z = yk * 1000, y = Math.max(terrH(x, z), 0.2) + (hm || 10), dx = x - e[0], dz = z - e[2], d = Math.hypot(dx, dz) || 1;
      const asp = canvas.width / Math.max(1, canvas.height), half = Math.atan(Math.tan(curFov / 2) * asp), fl = Math.hypot(camFwd[0], camFwd[1]) || 1, ang = Math.acos(Math.max(-1, Math.min(1, (dx * camFwd[0] + dz * camFwd[1]) / (d * fl))));
      let clear = true; for (let i = 1; i < 32 && clear; i++){ const f = i / 32; if (d * (1 - f) < 150) break; if (terrH(e[0] + dx * f, e[2] + dz * f) > e[1] + (y - e[1]) * f + 2) clear = false; }
      return {d:Math.round(d), ang:Math.round(ang * 180 / Math.PI), half:Math.round(half * 180 / Math.PI), front:ang < half * 0.9, clear}; },
    snap(w){ return new Promise(res => { if (!active || NO3D || !canvas){ res(null); return; } if (SNAP) SNAP.res(null); const me = SNAP = {w:w || 1600, res};
      setTimeout(() => { if (SNAP === me){ SNAP = null; res(null); } }, 2000); }); },
    // for the sound (ui/10e-sound.js): the ear is the camera of the last frame drawn (metres; x east, z south; its direction on the
    // level), and where the sounds are: your boat, the crane and the ice chute of the plant she lies at, its pump, and the fleet near by
    ear(){ return active && performance.now() - earT < 2000 ? {x:lastEye[0], y:lastEye[1], z:lastEye[2], fx:camFwd[0], fz:camFwd[1]} : null; },
    sndSrc(){ const b = S.boat, P = b.port ? PLANTS.find(q => q.id === b.port) : null, B = b.port ? BUNKERS.find(q => q.id === b.port) : null;
      const AN = airNow.length ? airNow.reduce((a, c) => Math.hypot(c.w[0] - bv.x, c.w[1], c.w[2] - bv.z) < Math.hypot(a.w[0] - bv.x, a.w[1], a.w[2] - bv.z) ? c : a) : null;
      return {air:AN ? [AN.w[0], AN.w[1], AN.w[2], AN.kind === 'heli'] : null, boat:[bv.x, (bv.y || 0) + 1, bv.z], crane:P ? [P.crane[0], 9, P.crane[1]] : null, chute:P ? [P.drop[0], 4, P.drop[1]] : null, pump:B ? [B.pump[0], 2, B.pump[1]] : null,
        npc:npcNow.map(n => ({x:n.p.x * 1000, z:n.p.y * 1000, v:n.v || 0, st:n.st, big:n.type === 'coastal' || n.type === 'ferry'})).concat(RB && RB.q ? [{x:RB.q.r.p.x * 1000, z:RB.q.r.p.y * 1000, v:RB.q.r.v * 1.4, st:'sailing', big:true}] : [])}; },
    zoom(f){ if (cam.helm) cam.fov = clamp(cam.fov * f, 12, 75); else cam.dist = clamp(cam.dist * f, 7, 8000); }, reset(){ if (cam.helm){ cam.hy = 0; cam.hp = -0.07; cam.fov = 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } },
    vesselChanged(){ bv.init = false; bv.st = null; TRAIL.length = 0; },
    showroom, get showing(){ return SHOW ? SHOW.t : null; }, paintView, get painting(){ return !!PAINTV; },
    roadsReady(){ if (NEARM) buildGround(); for (const c of CH.values()) freeChunk(c); CH.clear(); },
    fineReady(){ if (FINEM){ freeMesh(FINEM); FINEM = null; } if (NEARM){ freeMesh(NEARM); NEARM = null; updateNear(); } },
    fishCam(){ cam.helm = false; cam.dist = 7; cam.pitch = 0.22; cam.yaw = -0.85; },
    // the cinema: on or off (the HUD is the page's: body.kino-clean)
    kino(on){ if (on !== undefined){ KINO.on = !!on; KINO.shot = null; } return KINO.on; }, intro:introStart, introOn:() => !!INTRO, get kinoShot(){ return KINO.shot ? KINO.shot.type : null; },
    isHelm:() => cam.helm, setHelm(on){ const G = GEO(vtype()); cam.helm = !!on; cam.zoom = 1; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; },
    _debug:{matp:MATP, nf:NF, foam:FOAM, cld:CLD, cfx:CFX, get fln(){ return FLN.n; }, get flt(){ return [...FLT].map(([k, F]) => ({k, docks:F.docks.length, mods:F.docks.reduce((a, D) => a + D.mods.length, 0), kinds:F.docks.reduce((a, D) => { for (const q of D.mods) a[q.M] = (a[q.M] || 0) + 1; return a; }, {}), tris:F.mesh ? Math.round(F.mesh.n / 3) : 0})); }, get gln(){ return Object.assign({diag:glDiag()}, GLN); }, get kitStat(){ return KST; }, tankPlace(t){ if (!GB) buildGear(); const G = GEO(t), d = G.deck || {y:G.gw, z:2}, sx = G.beam / 2; return potDeck(G, G.hauler || [sx * 0.92, d.y + 1, d.z - 1.3], sx, d, ((GB.px || {}).pot || {}).half || 0.7, t).tank; }, get dk(){ const now = performance.now() / 1000; return {ev:DKEV.map(e => ({kind:e.kind, who:e.who, for:e.for || null, age:+(now - e.t0).toFixed(2), chained:!!e.chained})), deck:DKDECK.length, lay:Object.keys(DKLAY).length, n:Object.assign({}, DKN)}; }, kitPart:(f, nm) => !!kit(f, nm), kitX, get anchl(){ return ANCHAL; }, get anc3(){ return {mode:ANC3.mode, Lg:+ANC3.Lg.toFixed(2), links:ANC3.links, splash:ANC3.splash}; }, jigRail:t => jigRail(t, GEO(t)), get jsms(){ return JSMS; }, get gl2(){ return GL2; }, QU, progs(){ const L = {lit:[LIT_VS, LIT_FS], terreng0:[TER_VS, terFS(0)], terreng1:[TER_VS, terFS(1)], terreng2:[TER_VS, terFS(2)], modell:[LITN_VS, LITN_FS], tekstur:[TEX_VS, TEX_FS], kjolvann:[WK_VS, WK_FS],
      sjo:[SEA_VS, SEAF(SEA_FS)], sjoNosst:['#define NOSST\n' + SEA_VS, SEAF(SEA_FS)], sjoFar:['#define NOSST\n' + SEA_VS, SEAF('#define FAR\n' + SEA_FS)], sjoLite:['#define NOSST\n' + SEA_VS_LITE, SEAF('#define FAR\n' + SEA_FS)], enkelSjo:[BASIC_VS, BASIC_FS],
      himmel:[SKY_VS, SKY_FS], punkter:[PT_VS, PT_FS], skumkart:[FOAM_VS, FOAM_FS], draaper:[LITN_VS, DROP_FS], vann:[WATER_VS, WATER_FS], traer:[TREE_VS, TREE_FS], vind:[VD_VS, VD_FS], vindl:[VD_LVS, VD_LFS], naer:[NEAR_VS, NEAR_FS]}, out = {};
      for (const k in L){ try { const P = program(L[k][0], L[k][1], ['a0'], k); gl.deleteProgram(P.p); out[k] = 'ok'; } catch (e){ out[k] = String(e.message || e).slice(0, 200); } } return out; }, get ownLod(){ return {tier:OWNL.tier, px:Math.round(OWNL.px)}; }, pvmHull, lift:LIFT, bv, pota:POTA, get fps(){ return FPS.v; }, get cam(){ return cam; }, trawl(mode, at, hold){ TRAWL.mode = mode || null; TRAWL.t0 = performance.now() / 1000 - (at || 0); TRAWL.hold = hold ? at || 0 : null; return mode; }, seine(mode, at, hold){ SEINE.mode = mode || null; SEINE.t0 = performance.now() / 1000 - (at || 0); SEINE.hold = hold ? at || 0 : null; return mode; }, get seineNow(){ return seineState(performance.now() / 1000); }, get trawlNow(){ const st = trawlState(performance.now() / 1000); return TRAWL.mode ? Object.assign({mode:TRAWL.mode}, st) : null; }, get trk(){ const D = dynTrackView(); if (D) return D; return TRK && {s:TRK.s, v:TRK.v, vc:TRK.vc, end:TRK.end, sIn:TRK.sIn, back:TRK.back, turnL:TRK.turnL, done:TRK.done, stops:TRK.stops.map(q => q.s), P:TRK.P}; }, get peers(){ return npcNow.filter(n => n.player).map(n => ({id:n.id, vtype:n.vtype, t:n.K ? n.K.t : null, glass:!!(n.K && n.K.glass)})); }, get air(){ return airNow.map(a => ({kind:a.kind, w:a.w.map(Math.round)})); }, get airM(){ return !!(AIRM && AIRM.plane); }, get curFov(){ return curFov; }, cam, moundTop, bridgeInto, get statTris(){ return STAT ? STAT.n / 3 : 0; }, get vec(){ return {tiles:[...VEC.tiles.values()].map(t => ({k:t.k, bld:t.bld ? t.bld.n : 0, roads:t.roads.length, bridges:t.bridges.length, piers:t.piers.length, molos:t.molos.length, quays:t.quays.length, ms:Math.round(t.ms)})), statics:[...TST].map(([k, s]) => ({k, tris:s.tris, ms:Math.round(s.ms)})), chunks:CH.size}; }, moundInto, MB, haulModel, get haulA(){ return HAULA; }, gopHands:() => typeof workAssign === 'function' ? workAssign().filter(p => p.st === 'haling').length : 0, kinoNext(){ KINO.shot = null; }, get kino(){ const k = KINO.shot, e = KINO.eye, g = KINO.tgt; if (!k || !e) return null; const t = (performance.now() - T0) / 1000; return {type:k.type, up:e[1] - Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)), free:camFree(g, e), d:Math.hypot(e[0] - bv.x, e[2] - bv.z)}; }, get PLA(){ return PLA; }, get PCA(){ return PCA; }, set noPL(v){ NOPL = !!v; }, get beams(){ return BMN; }, glErr(){ return gl ? gl.getError() : -1; }, mastTop:t => mastTop(geoOf(t)), QUAL, qualTick, TERRW, get TERR(){ return TERR; }, get MIDM(){ return MIDM; }, RO, SSL, WV, WK, ssAt, seaH, waves:(dt, H) => updateWaves(dt, H), get sstVS(){ return SST_VS; }, get seaLvl(){ return seaLvl; }, get seaBasic(){ return !!(PS && PS.basic); }, get seaOne(){ return PSF === PS; }, get seaLite(){ return !!(PS && PS.lite); }, set seaDbg(v){ SEADBG = v; }, get drift(){ let c = 0; for (let i = 0; i < SDN; i++) if (SD.age[i] < SD.life[i]) c++; return c; }, get eye(){ return lastEye; }, camInside, camFree, get camPull(){ return camPull; }, get camLift(){ return camLift; }, get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, BUNKERS, nearestPlant, fkRun, legAt, terrH, terrRaw, unitModel, get UPATCH(){ return UPATCH; }, sitesNow, siteModel, onSite, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; lightsHere(e, 50).forEach(L => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(L, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }, get landMask(){ return LMON ? lcv : null; }, get maskMs(){ return LMMS; }, get coast3(){ return COAST3; }, meshH(x, z){ const M = FINEM && x > FINEM.x0 + 8 && x < FINEM.x0 + FINEM.sx - 8 && z > FINEM.z0 + 8 && z < FINEM.z0 + FINEM.sz - 8 ? FINEM : NEARM; return M ? nearSurf(M, x, z) : NaN; }, seaU(){ if (!PS) return null; gl.useProgram(PS.p); const g = n => PS.u[n] == null ? 'none' : gl.getUniform(PS.p, PS.u[n]); return {ls:g('uLSOn'), land:g('uLandS'), rect:g('uLRect') && Array.from(g('uLRect')), hOn:g('uHOn'), sOn:g('uSOn'), lmon:LMON, gr:!!GRECT, lt:!!LMTEX}; },  get FINEM(){ return FINEM; }, get water(){ return WATER; }, get trees(){ return {n:TREE.n, ext:!!TREE.ext, M:!!TREE.M, P:!!TREE.P, chunks:[...CH.values()].filter(c => c.tr).length}; }, get shore(){ const V = [...SHORE.values()].filter(S => S && S.mesh); return {tiles:SHORE.size, meshes:V.length, cliffs:V.reduce((a, S) => a + (S.cliffs || 0), 0), faces:V.reduce((a, S) => a + (S.faces || 0), 0)}; }, get marina(){ return {near:MAR.near.length, n:MAR.n}; }, get near(){ return {n:NEAR.n, ms:Math.round(NEAR.ms), sq:NEAR.sq.size, M:!!NEAR.M, P:!!NEAR.P}; }, get life(){ return {M:!!LIFE.M, eag:LIFE.nEag, cor:LIFE.nCor, eid:LIFE.nEid, shp:LIFE.nShp, car:LIFE.nCar, lamp:LIFE.nLamp, smoke:LIFE.nSmoke, cliff:LIFE.nCliff, roads:LIFE.cars.length, lamps:LIFE.lamps.length / 3, smk:[...CH.values()].reduce((a, c) => a + (c.smk ? c.smk.length / 3 : 0), 0), whales:!!(WILDM && WILDM.g9)}; }, get glFirst(){ return GLFIRST; }, get wet(){ return {wet:env.wet, snowC:env.snowC, drops:!!PDROP}; }, get vind(){ return {M:!!VD.M, P:!!VD.P, nT:VD.nT, nP:VD.nP, nH:VD.nH, nW:VD.nW, ang:VD.ang, wetT:VD.wetT, wetM:VD.wetM}; }, get seaNP(){ return NP; }, get dpr(){ return canvas ? canvas.width / Math.max(1, canvas.getBoundingClientRect().width) : 0; }}
  };
})();
