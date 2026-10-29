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
  return {
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
    _debug:{matp:MATP, nf:NF, foam:FOAM, cld:CLD, cfx:CFX, get fln(){ return FLN.n; }, get flt(){ return [...FLT].map(([k, F]) => ({k, docks:F.docks.length, mods:F.docks.reduce((a, D) => a + D.mods.length, 0), kinds:F.docks.reduce((a, D) => { for (const q of D.mods) a[q.M] = (a[q.M] || 0) + 1; return a; }, {}), tris:F.mesh ? Math.round(F.mesh.n / 3) : 0})); }, get gln(){ return Object.assign({diag:glDiag()}, GLN); }, get kitStat(){ return KST; }, tankPlace(t){ if (!GB) buildGear(); const G = GEO(t), d = G.deck || {y:G.gw, z:2}, sx = G.beam / 2; return potDeck(G, G.hauler || [sx * 0.92, d.y + 1, d.z - 1.3], sx, d, ((GB.px || {}).pot || {}).half || 0.7, t).tank; }, get dk(){ const now = performance.now() / 1000; return {ev:DKEV.map(e => ({kind:e.kind, who:e.who, for:e.for || null, age:+(now - e.t0).toFixed(2), chained:!!e.chained})), deck:DKDECK.length, lay:Object.keys(DKLAY).length, n:Object.assign({}, DKN)}; }, kitPart:(f, nm) => !!kit(f, nm), kitX, get anchl(){ return ANCHAL; }, get anc3(){ return {mode:ANC3.mode, Lg:+ANC3.Lg.toFixed(2), links:ANC3.links, splash:ANC3.splash}; }, jigRail:t => jigRail(t, GEO(t)), get jsms(){ return JSMS; }, lift:LIFT, bv, pota:POTA, get fps(){ return FPS.v; }, get cam(){ return cam; }, trawl(mode, at, hold){ TRAWL.mode = mode || null; TRAWL.t0 = performance.now() / 1000 - (at || 0); TRAWL.hold = hold ? at || 0 : null; return mode; }, seine(mode, at, hold){ SEINE.mode = mode || null; SEINE.t0 = performance.now() / 1000 - (at || 0); SEINE.hold = hold ? at || 0 : null; return mode; }, get seineNow(){ return seineState(performance.now() / 1000); }, get trawlNow(){ const st = trawlState(performance.now() / 1000); return TRAWL.mode ? Object.assign({mode:TRAWL.mode}, st) : null; }, get trk(){ const D = dynTrackView(); if (D) return D; return TRK && {s:TRK.s, v:TRK.v, vc:TRK.vc, end:TRK.end, sIn:TRK.sIn, back:TRK.back, turnL:TRK.turnL, done:TRK.done, stops:TRK.stops.map(q => q.s), P:TRK.P}; }, get peers(){ return npcNow.filter(n => n.player).map(n => ({id:n.id, vtype:n.vtype, t:n.K ? n.K.t : null, glass:!!(n.K && n.K.glass)})); }, get air(){ return airNow.map(a => ({kind:a.kind, w:a.w.map(Math.round)})); }, get airM(){ return !!(AIRM && AIRM.plane); }, get curFov(){ return curFov; }, cam, moundTop, bridgeInto, get statTris(){ return STAT ? STAT.n / 3 : 0; }, get vec(){ return {tiles:[...VEC.tiles.values()].map(t => ({k:t.k, bld:t.bld ? t.bld.n : 0, roads:t.roads.length, bridges:t.bridges.length, piers:t.piers.length, molos:t.molos.length, quays:t.quays.length, ms:Math.round(t.ms)})), statics:[...TST].map(([k, s]) => ({k, tris:s.tris, ms:Math.round(s.ms)})), chunks:CH.size}; }, moundInto, MB, haulModel, get haulA(){ return HAULA; }, gopHands:() => typeof workAssign === 'function' ? workAssign().filter(p => p.st === 'haling').length : 0, kinoNext(){ KINO.shot = null; }, get kino(){ const k = KINO.shot, e = KINO.eye, g = KINO.tgt; if (!k || !e) return null; const t = (performance.now() - T0) / 1000; return {type:k.type, up:e[1] - Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)), free:camFree(g, e), d:Math.hypot(e[0] - bv.x, e[2] - bv.z)}; }, get PLA(){ return PLA; }, get PCA(){ return PCA; }, set noPL(v){ NOPL = !!v; }, get beams(){ return BMN; }, glErr(){ return gl ? gl.getError() : -1; }, mastTop:t => mastTop(geoOf(t)), QUAL, qualTick, TERRW, get TERR(){ return TERR; }, get MIDM(){ return MIDM; }, RO, SSL, WV, WK, ssAt, seaH, waves:(dt, H) => updateWaves(dt, H), get sstVS(){ return SST_VS; }, get seaLvl(){ return seaLvl; }, get seaBasic(){ return !!(PS && PS.basic); }, get seaOne(){ return PSF === PS; }, get seaLite(){ return !!(PS && PS.lite); }, set seaDbg(v){ SEADBG = v; }, get drift(){ let c = 0; for (let i = 0; i < SDN; i++) if (SD.age[i] < SD.life[i]) c++; return c; }, get eye(){ return lastEye; }, camInside, camFree, get camPull(){ return camPull; }, get camLift(){ return camLift; }, get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, BUNKERS, nearestPlant, fkRun, legAt, terrH, terrRaw, unitModel, get UPATCH(){ return UPATCH; }, sitesNow, siteModel, onSite, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; lightsHere(e, 50).forEach(L => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(L, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }, get landMask(){ return LMON ? lcv : null; }, get maskMs(){ return LMMS; }, get coast3(){ return COAST3; }, meshH(x, z){ const M = FINEM && x > FINEM.x0 + 8 && x < FINEM.x0 + FINEM.sx - 8 && z > FINEM.z0 + 8 && z < FINEM.z0 + FINEM.sz - 8 ? FINEM : NEARM; return M ? nearSurf(M, x, z) : NaN; }, seaU(){ if (!PS) return null; gl.useProgram(PS.p); const g = n => PS.u[n] == null ? 'none' : gl.getUniform(PS.p, PS.u[n]); return {ls:g('uLSOn'), land:g('uLandS'), rect:g('uLRect') && Array.from(g('uLRect')), hOn:g('uHOn'), sOn:g('uSOn'), lmon:LMON, gr:!!GRECT, lt:!!LMTEX}; },  get FINEM(){ return FINEM; }, get water(){ return WATER; }, get trees(){ return {n:TREE.n, ext:!!TREE.ext, M:!!TREE.M, P:!!TREE.P, chunks:[...CH.values()].filter(c => c.tr).length}; }, get shore(){ const V = [...SHORE.values()].filter(S => S && S.mesh); return {tiles:SHORE.size, meshes:V.length, cliffs:V.reduce((a, S) => a + (S.cliffs || 0), 0), faces:V.reduce((a, S) => a + (S.faces || 0), 0)}; }, get marina(){ return {near:MAR.near.length, n:MAR.n}; }, get near(){ return {n:NEAR.n, ms:Math.round(NEAR.ms), sq:NEAR.sq.size, M:!!NEAR.M, P:!!NEAR.P}; }, get life(){ return {M:!!LIFE.M, eag:LIFE.nEag, cor:LIFE.nCor, eid:LIFE.nEid, shp:LIFE.nShp, car:LIFE.nCar, lamp:LIFE.nLamp, smoke:LIFE.nSmoke, cliff:LIFE.nCliff, roads:LIFE.cars.length, lamps:LIFE.lamps.length / 3, smk:[...CH.values()].reduce((a, c) => a + (c.smk ? c.smk.length / 3 : 0), 0), whales:!!(WILDM && WILDM.g9)}; }, get glFirst(){ return GLFIRST; }, get wet(){ return {wet:env.wet, snowC:env.snowC, drops:!!PDROP}; }, get vind(){ return {M:!!VD.M, P:!!VD.P, nT:VD.nT, nP:VD.nP, nH:VD.nH, nW:VD.nW, ang:VD.ang, wetT:VD.wetT, wetM:VD.wetM}; }, get seaNP(){ return NP; }, get dpr(){ return canvas ? canvas.width / Math.max(1, canvas.getBoundingClientRect().width) : 0; }}
  };
})();
