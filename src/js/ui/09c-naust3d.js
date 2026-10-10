// ---------- Father's naust in 3D: the trophy wall with the biggest fish of each species (Jonas 09.10.2026) ----------
// «Drømmefisken skal droppes helt. Nå kjører vi kun på største fisk man har fisket, en slags trofevegg med personlige rekorder.» The room
// is a model from Blender (tools/harbour/naustinne.py) with the light baked into its colours, seen from the floor in first person like
// the pub (ui/09b-pub.js, whose model reader, shader and camera this copies): its own small WebGL canvas over the game, the world's 3D
// view holding its frames meanwhile (G3.hold). The fish on the wall are the game's own models (glbLoad('fish') in vessel3d.js), one for
// each species' record (core/09b-records.js), as big as the fish was in proportion; a species not caught yet is a dark place on the
// wall. The upgrades are visible: a leaking roof or a tight one, a cold corner or the wood stove with its flickering fire, a broken
// trestle or Father's workbench, a board with nails or the oak wall with its brass plaques. A tap on an upgrade shows what it is and
// buys it (core/07c-naust.js); a tap on a fish tells when, where, with which boat and gear it was landed.
const NAUST3D = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  let el = null, cv = null, gl = null, P = null, on = false, raf = 0, failed = false, panelKey = null, tLast = 0, flick = 1, drag = null, VP = null, ASP = 1, FY = 1;
  const cam = {yaw:0, pitch:-0.04, fov:1.0};
  // the length of a fish on the wall in metres by how big it was beside what a big one of its species weighs (the model is 1 m long)
  const REFKG = {torsk:14, sei:12, hyse:6, lyr:5, lange:18, brosme:9, uer:5, kveite:70, blakveite:30, krabbe:7};
  const lenOf = (sp, kg) => (sp === 'krabbe' ? 0.5 : 0.4) + (sp === 'krabbe' ? 0.35 : 0.56) * Math.min(1, Math.sqrt(kg / (REFKG[sp] || 10)));

  // ---------- the model, as the pub reads it ----------
  function parse(b64){
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(u8.buffer); if (dv.getUint32(0, true) !== 0x46546C67) return null;
    const jl = dv.getUint32(12, true), J = JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + jl))), bo = 20 + jl + 8, bl = dv.getUint32(20 + jl, true);
    return {J, bin:u8.subarray(bo, bo + bl)};
  }
  const VS = 'attribute vec3 aP;attribute vec4 aC;attribute vec2 aQ;uniform mat4 uVP,uM;uniform float uT,uFl;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aP,1.0);float fl=aQ.x>3.5?1.0:0.0;' +
    'if(fl>0.5){float h=max(w.y-0.2,0.0)*3.0;w.z+=sin(uT*7.0+w.y*23.0)*0.01*h;w.y+=sin(uT*11.0+w.z*17.0)*0.008*h;}' +
    'float f=1.0+aQ.y/255.0*(uFl-1.0);vC=aC.rgb*(fl>0.5?(0.75+0.45*uFl):f);gl_Position=uVP*w;}';
  const FS = 'precision mediump float;varying vec3 vC;uniform float uA;void main(){float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5;gl_FragColor=vec4(vC+n/255.0,uA);}';
  // the fish: the game's colours with a simple light from the lamp over the wall
  const VF = 'attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;uniform mat4 uVP,uM;uniform vec3 uL;uniform float uK;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aP,1.0);vec3 n=normalize((uM*vec4(aN,0.0)).xyz);float d=max(dot(n,uL),0.0);vC=aC*(0.34+0.66*d)*uK*vec3(1.0,0.9,0.76);gl_Position=uVP*w;}';
  function prog(vs, fs){
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, vs === VF ? 'aN' : 'aC'); gl.bindAttribLocation(p, 2, vs === VF ? 'aC' : 'aQ'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++){ const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return {p, u};
  }
  function load(){
    const src = glbData('glb', 'naustinne'); if (!src) return null;
    const G = parse(src); if (!G) return null;
    const {J, bin} = G, ext = gl.getExtension('OES_element_index_uint');
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, bin, gl.STATIC_DRAW);
    const parts = {};
    for (const nd of J.nodes){
      const pr = J.meshes[nd.mesh].primitives[0], A = i => J.accessors[i], BV = a => J.bufferViews[a.bufferView], off = a => (BV(a).byteOffset || 0) + (a.byteOffset || 0);
      const ia = A(pr.indices), big = ia.componentType === 5125; if (big && !ext) return null;
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bin.subarray(off(ia), off(ia) + ia.count * (big ? 4 : 2)), gl.STATIC_DRAW);
      const at = k => { const a = A(pr.attributes[k]); return {off:off(a), stride:BV(a).byteStride || 0, type:a.componentType, norm:!!a.normalized, n:{VEC2:2, VEC3:3, VEC4:4}[a.type]}; };
      parts[nd.name] = {ib, n:ia.count, it:big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, pos:at('POSITION'), col:at('COLOR_0'), q:at('_PAINT'), t:nd.translation || [0, 0, 0], s:nd.scale || [1, 1, 1]};
    }
    return {vb, parts, A:(J.scenes[0].extras || {}).anchors || {}};
  }
  // the fish models of the game into buffers of their own (position, normal, colour; 9 floats a corner)
  function loadFish(){
    const G = typeof glbLoad === 'function' ? glbLoad('fish') : null; if (!G) return {};
    const F = {};
    for (const sp of Object.keys(G.parts)){
      const o = G.parts[sp], n = o.p.length / 3, a = new Float32Array(n * 9);
      for (let i = 0; i < n; i++){ a.set([o.p[i * 3], o.p[i * 3 + 1], o.p[i * 3 + 2], o.n[i * 3], o.n[i * 3 + 1], o.n[i * 3 + 2], o.c[i * 4], o.c[i * 4 + 1], o.c[i * 4 + 2]], i * 9); }
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); F[sp] = {b, n};
    }
    return F;
  }
  // the varnished board Father's cod is mounted on (position, normal, colour like the fish), a box of w × h × d metres round the origin
  function boardBuf(w, h, d){
    const C = [0.21, 0.13, 0.07], Cf = [0.26, 0.17, 0.09], out = [], q = (a, b, c, e, n, col) => { for (const v of [a, b, c, a, c, e]) out.push(v[0], v[1], v[2], n[0], n[1], n[2], col[0], col[1], col[2]); };
    const x = w / 2, y = h / 2, z = d / 2;
    q([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z], [0, 0, 1], Cf); q([-x, -y, -z], [-x, y, -z], [x, y, -z], [x, -y, -z], [0, 0, -1], C);
    q([-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z], [0, 1, 0], C); q([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z], [0, -1, 0], C);
    q([x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z], [1, 0, 0], C); q([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z], [-1, 0, 0], C);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.STATIC_DRAW); return {b, n:out.length / 9};
  }
  // where Father's cod hangs: on the board itself, in the middle above the top row of hooks (over the frame it sat behind the beam)
  const FAR_AT = () => { const w = P.A.wall; return w ? [w[0], w[1] + 0.82, w[2]] : null; };
  function init(){
    if (gl) return true; if (failed) return false;
    if (/no3d/.test(location.hash)){ failed = true; return false; }      // the tests without 3D (KYST_LITE): the page as before
    try {
      gl = cv.getContext('webgl', {antialias:true, alpha:false, powerPreference:'high-performance'}) || cv.getContext('experimental-webgl');
      if (!gl) throw new Error('no webgl');
      const pr = prog(VS, FS), pf = prog(VF, 'precision mediump float;varying vec3 vC;void main(){gl_FragColor=vec4(vC,1.0);}'), M = load(); if (!M) throw new Error('no model');
      P = Object.assign(M, {pr, pf, fish:loadFish()}); P.board = boardBuf(1.18, 0.4, 0.035);
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; P = null; failed = false; });
      return true;
    } catch (e){ failed = true; gl = null; console.warn('naust 3d', e); return false; }
  }

  // ---------- matrices (column-major) ----------
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++){ let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const persp = (fy, a, n, f) => { const t = 1 / Math.tan(fy / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  const basis = () => { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const f = [-sy * cp, sp, -cy * cp], r = [cy, 0, -sy], u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]; return {f, r, u}; };
  function viewM(e){ const {f, r, u} = basis(), d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -d(r, e), -d(u, e), d(f, e), 1]); }
  const TS = (t, s) => new Float32Array([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, t[0], t[1], t[2], 1]);
  const RY = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); };
  const RX = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); };
  const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };
  const fovY = asp => asp >= 1 ? 2 * Math.atan(Math.tan(32 * Math.PI / 180) / asp) * 1.25 : Math.min(1.45, 2 * Math.atan(Math.tan(34 * Math.PI / 180) / asp));

  // ---------- a frame ----------
  function drawPart(pt, M, alpha){
    const p = P.pr; gl.uniformMatrix4fv(p.u.uM, false, M); gl.uniform1f(p.u.uA, alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, P.vb);
    gl.vertexAttribPointer(0, 3, pt.pos.type, pt.pos.norm, pt.pos.stride, pt.pos.off);
    gl.vertexAttribPointer(1, 4, pt.col.type, pt.col.norm, pt.col.stride, pt.col.off);
    gl.vertexAttribPointer(2, 2, pt.q.type, false, pt.q.stride, pt.q.off);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pt.ib); gl.drawElements(gl.TRIANGLES, pt.n, pt.it, 0);
  }
  const part = k => P.parts[k] && drawPart(P.parts[k], TS(P.parts[k].t, P.parts[k].s), 1);
  // where a fish hangs: its record's slot, the middle of the fish a little below the hook, head to the right, its showing side to the room
  function fishM(i, rec){
    const s = P.A.slots[i], len = lenOf(rec.sp, rec.kg), tilt = ((i * 37 + rec.sp.length * 11) % 7 - 3) * 0.012;
    const base = mul(TS([s[0], s[1] - 0.2, s[2] + 0.26], [len, len, len]), RZ(tilt));
    return rec.sp === 'krabbe' ? mul(base, RX(Math.PI / 2)) : mul(base, RY(-Math.PI / 2));
  }
  function frame(now){
    raf = on ? requestAnimationFrame(frame) : 0; if (!on || !gl || document.hidden) return;
    const t = now / 1000, dt = Math.min(0.1, t - (tLast || t)); tLast = t;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); ASP = w / Math.max(1, h); FY = fovY(ASP) * cam.fov;
    const E = P.A.eye || [0, 1.55, -1.3]; VP = mul(persp(FY, ASP, 0.04, 60), viewM(E));
    flick += ((1 + 0.13 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 13.7 + 1.3) + 0.05 * Math.sin(t * 23.1 + 0.4) + (Math.random() - 0.5) * 0.12) - flick) * Math.min(1, dt * 12);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    const p = P.pr; gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uVP, false, VP); gl.uniform1f(p.u.uT, t); gl.uniform1f(p.u.uFl, naustHas('ovn') ? flick : 1);
    for (let i = 0; i < 3; i++) gl.enableVertexAttribArray(i);
    part('room'); part(naustHas('tak') ? 'roofnew' : 'roofold'); part(naustHas('benk') ? 'benk' : 'benkold');
    if (naustHas('ovn')) part('ovn');
    if (naustHas('vegg')) part('vegg');
    // Father's cod on its board, there from the start whatever the wall is like; the player's fish on the wall below
    const F0 = FAR_AT(), fishOn = () => { const f = P.pf; gl.useProgram(f.p); gl.uniformMatrix4fv(f.u.uVP, false, VP); gl.uniform3f(f.u.uL, 0.0, 0.62, 0.78); gl.uniform1f(f.u.uK, 0.96 + 0.05 * flick);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); };
    const fishDraw = (m, M) => { gl.bindBuffer(gl.ARRAY_BUFFER, m.b); gl.uniformMatrix4fv(P.pf.u.uM, false, M);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24); gl.drawArrays(gl.TRIANGLES, 0, m.n); };
    if (F0 && P.fish[FAR_REC.sp]){
      fishOn(); fishDraw(P.board, TS([F0[0], F0[1], F0[2] + 0.07], [1, 1, 1]));
      gl.uniform1f(P.pf.u.uK, 1.3 + 0.06 * flick);   // right under the lamp, the brightest thing on the wall
      const len = lenOf(FAR_REC.sp, FAR_REC.kg); fishDraw(P.fish[FAR_REC.sp], mul(mul(TS([F0[0], F0[1], F0[2] + 0.2], [len, len, len]), RZ(0.05)), RY(-Math.PI / 2)));
      gl.useProgram(p.p); for (let i = 0; i < 3; i++) gl.enableVertexAttribArray(i);
    }
    // the fish on the wall
    if (naustHas('vegg') && P.A.slots){
      const f = P.pf; gl.useProgram(f.p); gl.uniformMatrix4fv(f.u.uVP, false, VP); gl.uniform3f(f.u.uL, 0.0, 0.62, 0.78); gl.uniform1f(f.u.uK, 0.96 + 0.05 * flick);
      gl.disableVertexAttribArray(2); gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
      recList().forEach(({sp, rec}, i) => { const m = P.fish[sp]; if (!rec || !m || !P.A.slots[i]) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, m.b); gl.uniformMatrix4fv(f.u.uM, false, fishM(i, rec));
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
        gl.drawArrays(gl.TRIANGLES, 0, m.n); });
      gl.useProgram(p.p); for (let i = 0; i < 3; i++) gl.enableVertexAttribArray(i);
    }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (P.parts.glass) drawPart(P.parts.glass, TS(P.parts.glass.t, P.parts.glass.s), 0.1);
    gl.depthMask(true); gl.disable(gl.BLEND);
    labels();
    if (now - (frame.chk || 0) > 1000){ frame.chk = now; tick(); }
  }

  // ---------- what can be tapped ----------
  const SPOTS = {far:['Fars torsk', 'Father’s cod'], vegg:['Trofeveggen', 'The trophy wall'], ovn:['Vedovnen', 'The wood stove'], benk:['Arbeidsbenken', 'The workbench'], tak:['Taket', 'The roof'], door:['Gå ut', 'Leave']};
  const dayOf = t => dayStr(t / 60).replace(/^\S+ /, '');
  function project(c){ const x = VP[0] * c[0] + VP[4] * c[1] + VP[8] * c[2] + VP[12], y = VP[1] * c[0] + VP[5] * c[1] + VP[9] * c[2] + VP[13], w = VP[3] * c[0] + VP[7] * c[1] + VP[11] * c[2] + VP[15];
    if (w <= 0.05) return null; return [(x / w * 0.5 + 0.5) * cv.clientWidth, (0.5 - y / w * 0.5) * cv.clientHeight]; }
  function labels(){
    const lay = el.querySelector('.pb-lab'); if (!lay) return;
    const vis = (b, s, show, mid) => { const ok = show && s && s[0] > -40 && s[0] < cv.clientWidth + 40 && s[1] > 30 && s[1] < cv.clientHeight - 20; b.style.display = ok && !panelKey ? '' : 'none'; if (ok) b.style.transform = 'translate(' + Math.round(s[0]) + 'px,' + Math.round(s[1]) + 'px) translate(-50%,' + (mid ? '-50%' : '-100%') + ')'; };
    const list = recList(), up = naustHas('vegg');
    (P.A.slots || []).forEach((s, i) => {
      let b = lay.querySelector('[data-f="' + i + '"]'); if (!b){ b = document.createElement('button'); b.dataset.f = i; lay.appendChild(b); }
      const it = list[i], rec = it && it.rec, key = rec ? rec.sp + rec.kg : (it ? it.sp : '') + '?';
      if (b.dataset.k !== key){ b.dataset.k = key; b.className = rec ? '' : 'nb3-empty'; b.innerHTML = it ? '<b>' + esc(SPECIES[it.sp][S.lang]) + '</b>' + (rec ? '<small>' + esc(fmt(rec.kg, 1)) + ' kg</small>' : '<small>?</small>') : ''; }
      vis(b, project([s[0], s[1] - P.A.plaq, s[2] + 0.12]), !!it && up, true);
    });
    for (const [k, c] of P.A.spots || []){ if (k === 'vegg') continue;
      let b = lay.querySelector('[data-s="' + k + '"]'); if (!b){ b = document.createElement('button'); b.dataset.s = k; b.textContent = L(...SPOTS[k]); lay.appendChild(b); }
      const lift = k === 'door' ? 1.1 : k === 'tak' ? 0.3 : 0.55; vis(b, project([c[0], c[1] + lift, c[2]]), true);
    }
    let fb = lay.querySelector('[data-s="far"]'); if (!fb){ fb = document.createElement('button'); fb.dataset.s = 'far'; fb.innerHTML = '<b>' + esc(L('Fars torsk', 'Father’s cod')) + '</b><small>' + esc(fmt(FAR_REC.kg, 1)) + ' kg</small>'; lay.appendChild(fb); }
    const F0 = FAR_AT(); vis(fb, F0 && project([F0[0], F0[1] + 0.24, F0[2] + 0.12]), true);   // over the fish, so the guide's tip above it leaves the fish in view
    let w = lay.querySelector('[data-s="vegg"]'); if (!w){ w = document.createElement('button'); w.dataset.s = 'vegg'; w.textContent = L('Rekordene', 'The records'); lay.appendChild(w); }
    const wc = P.A.wall; vis(w, wc && project([wc[0] + 1.5, wc[1] + 1.35, wc[2] + 0.2]), true);
  }
  function pick(px, py){
    const x = px / cv.clientWidth * 2 - 1, y = 1 - py / cv.clientHeight * 2, ty = Math.tan(FY / 2), tx = ty * ASP, {f, r, u} = basis();
    const d = [f[0] + r[0] * x * tx + u[0] * y * ty, f[1] + r[1] * x * tx + u[1] * y * ty, f[2] + r[2] * x * tx + u[2] * y * ty], dl = Math.hypot(...d), E = P.A.eye;
    const hit = (c, rad) => { const o = [c[0] - E[0], c[1] - E[1], c[2] - E[2]], t = (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]) / dl, d2 = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - t * t; return t > 0 && d2 < rad * rad ? t : null; };
    let best = null, bt = 1e9;
    if (naustHas('vegg')) (P.A.slots || []).forEach((s, i) => { const t = hit([s[0], s[1] - 0.2, s[2] + 0.2], 0.46); if (t != null && t < bt){ bt = t; best = 'f:' + i; } });
    if (best) return best;
    { const F0 = FAR_AT(), t = F0 && hit([F0[0], F0[1], F0[2] + 0.2], 0.4); if (t != null) return 'far'; }
    for (const [k, c, rad] of P.A.spots || []){ const t = hit(c, rad); if (t != null && t < bt){ bt = t; best = k; } }
    return best;
  }

  // ---------- the panels ----------
  function panel(key, html, title){
    panelKey = key; const pn = el.querySelector('.pb-panel');
    if (!key){ pn.hidden = true; pn.innerHTML = ''; return; }
    pn.innerHTML = '<div class="pb-ph"><b>' + esc(title || L(...(SPOTS[key] || [key, key]))) + '</b><button data-q="x" aria-label="' + L('Lukk', 'Close') + '">✕</button></div><div class="pb-pb">' + html + '</div>';
    pn.hidden = false;
  }
  const btn = (q, label, dis, cls) => '<button data-q="' + q + '"' + (dis ? ' disabled' : '') + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</button>';
  function fishCard(i){
    const it = recList()[i]; if (!it) return;
    const sp = SPECIES[it.sp], r = it.rec;
    if (!r) return panel('f', '<p>' + L('Ingen ' + sp.no.toLowerCase() + ' hos deg ennå. Den første du får, henger her.', 'No ' + sp.en.toLowerCase() + ' of yours yet. The first one you land hangs here.') + '</p>', sp[S.lang]);
    const how = REC_HOW[r.how] ? REC_HOW[r.how][S.lang === 'no' ? 0 : 1] : '';
    panel('f', '<p class="nb3-kg">' + esc(fmt(r.kg, 1)) + ' kg</p><p>' + esc(dayOf(r.t)) + (r.at ? L(' · ved ', ' · near ') + esc(r.at) : '') + '</p><p>' +
      (r.boat ? L('Båten «', 'The boat «') + esc(r.boat) + '»' : '') + (how ? ' · ' + esc(how) : '') + '</p>', sp[S.lang]);
  }
  // Father's cod: the story on its plaque, and the player's own cod beside it once there is one
  function farCard(){
    const mine = recState().torsk, yr = FAR_REC.year, pl = farRecPlace();
    panel('far', '<p class="nb3-kg">' + esc(fmt(FAR_REC.kg, 1)) + ' kg</p><p>' + esc(L('Tatt på juksa ' + (pl ? 'utenfor ' + pl + ' ' : '') + 'i mars ' + yr + ', fra denne båten. Han fikk den stoppet ut og hengte den her, og det er den eneste fisken han noen gang skrøt av.',
      'Taken on the jig ' + (pl ? 'off ' + pl + ' ' : '') + 'in March ' + yr + ', from this boat. He had it stuffed and hung it here, and it is the only fish he ever boasted of.')) + '</p>' +
      (mine ? '<p>' + esc(mine.kg > FAR_REC.kg ? L('Din største: ' + fmt(mine.kg, 1) + ' kg. Du slo ham.', 'Your biggest: ' + fmt(mine.kg, 1) + ' kg. You beat him.') : L('Din største så langt: ' + fmt(mine.kg, 1) + ' kg. Det mangler ' + fmt(FAR_REC.kg - mine.kg, 1) + ' kg.', 'Your biggest so far: ' + fmt(mine.kg, 1) + ' kg. ' + fmt(FAR_REC.kg - mine.kg, 1) + ' kg to go.')) + '</p>'
        : '<p>' + esc(L('Får du en større, henger din ved siden av.', 'Land a bigger one and yours hangs beside it.')) + '</p>'), L('Fars torsk', 'Father’s cod'));
  }
  function recordsCard(){
    const list = recList(), n = list.filter(x => x.rec).length;
    panel('vegg', '<p>' + (naustHas('vegg') ? L('Den største fisken du har fått av hver art henger her.', 'The biggest fish you have landed of each species hangs here.') : L('En bar planke med spiker. Rekordene dine telles likevel fra første fisk, og de henger på veggen når snekkeren har satt den opp.', 'A bare board with nails. Your records count from the first fish all the same, and they hang on the wall once the carpenter has put it up.')) + '</p>' +
      '<table class="nb3-tbl"><tr><td>' + esc(L('Fars torsk', 'Father’s cod')) + '</td><td>' + esc(fmt(FAR_REC.kg, 1)) + ' kg</td><td>' + FAR_REC.year + '</td></tr>' + list.map(({sp, rec}) => '<tr><td>' + esc(SPECIES[sp][S.lang]) + '</td><td>' + (rec ? esc(fmt(rec.kg, 1)) + ' kg' : '?') + '</td><td>' + (rec ? esc(dayOf(rec.t)) : '') + '</td></tr>').join('') + '</table>' +
      '<p class="pb-why">' + n + ' / ' + list.length + '</p>' + (naustHas('vegg') ? '' : upBtn('vegg')), L('Trofeveggen', 'The trophy wall'));
  }
  const upBtn = k => { const U = NAUST_UP.find(x => x.k === k), why = naustHas(k) ? null : naustWhy(k);
    return naustHas(k) ? '<p class="pb-why">✓ ' + L('Gjort', 'Done') + '</p>' : '<div class="pb-bt">' + btn('buy:' + k, esc(L(U.no, U.en)) + ' · ' + kr(U.kr), !!why, 'pri') + '</div>' + (why ? '<p class="pb-why">' + esc(L(why[0], why[1])) + '</p>' : ''); };
  function upCard(k){
    const U = NAUST_UP.find(x => x.k === k); if (!U) return;
    const state = naustHas(k) ? L('Er gjort.', 'It is done.') : '';
    const old = {tak:L('Taket lekker. Det siver og trekker, og himmelen skinner gjennom mellom bordene.', 'The roof leaks. It drips and draughts, and the sky shows between the boards.'),
      ovn:L('Et kaldt hjørne med et sotflekket stykke vegg der en ovn kunne stått.', 'A cold corner with a sooty patch of wall where a stove could stand.'),
      benk:L('To bukker og en skjev planke. Faren din hadde en skikkelig benk her en gang.', 'Two trestles and a warped plank. Your father once had a proper bench here.')}[k];
    panel(k, '<p>' + esc(naustHas(k) ? L(U.d[0], U.d[1]) : (old || '') + ' ' + L(U.d[0], U.d[1])) + ' ' + esc(state) + '</p>' + upBtn(k));
  }
  function openSpot(k){
    if (k === 'door'){ close(); return; }
    if (k.startsWith('f:')) return fishCard(+k.slice(2));
    if (k === 'vegg') return recordsCard();
    if (k === 'far') return farCard();
    if (['tak', 'ovn', 'benk'].includes(k)) upCard(k);
  }
  function buy(k){
    const why = naustBuy(k); if (why){ toast(L(why[0], why[1])); return; }
    save(); if (typeof refreshAll === 'function') refreshAll(); renderTop(); if (panelKey === 'vegg') recordsCard(); else upCard(k);
  }

  // ---------- the top bar, open and close ----------
  const clockStr = H => { const m = Math.floor(((H % 24) + 24) % 24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function renderTop(){
    if (!el) return; const t = el.querySelector('.pb-t'), H = S.t / 60;
    if (t) t.innerHTML = esc(L('Fars naust', 'Father’s boathouse')) + '<small>' + esc(clockStr(H)) + ' · ' + esc(kr(S.cash)) + '</small>';
  }
  // the room's own sounds (core in ui/10e-sound.js room): the stove and the roof as they are set up now
  const sound = () => { if (typeof SND !== 'undefined') SND.room(on, {ovn:naustHas('ovn'), tak:naustHas('tak')}); };
  function tick(){ renderTop(); sound(); if (!NOTEBOOK.atNaust()){ toast(L('Du har lagt fra.', 'You have cast off.')); close(); } }
  function build(){
    el = document.createElement('div'); el.id = 'naust3'; el.hidden = true;
    el.innerHTML = '<canvas></canvas><div class="pb-lab"></div><div class="pb-top"><div class="pb-t"></div><button data-q="list">' + L('Liste', 'List') + '</button><button data-q="out">' + L('Gå ut', 'Leave') + '</button></div>' +
      '<div class="pb-hint">' + L('Dra for å se deg rundt. Trykk på fisken eller det du vil se.', 'Drag to look around. Tap a fish or anything you would like to see.') + '</div><div class="pb-panel" hidden></div>';
    document.getElementById('mapwrap').appendChild(el); cv = el.querySelector('canvas');
    cv.addEventListener('pointerdown', e => { drag = {x:e.clientX, y:e.clientY, yaw:cam.yaw, pitch:cam.pitch, moved:false, id:e.pointerId}; try { cv.setPointerCapture(e.pointerId); } catch (_){} });
    cv.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const k = FY / Math.max(1, cv.clientHeight), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; cam.yaw = drag.yaw + dx * k; cam.pitch = clamp(drag.pitch + dy * k, -1.1, 1.1);
      const hn = el.querySelector('.pb-hint'); if (hn && drag.moved) hn.classList.add('off'); });
    const up = e => { if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null; if (d.moved) return; const r = cv.getBoundingClientRect(), k = pick(e.clientX - r.left, e.clientY - r.top); if (k) openSpot(k); else if (panelKey) panel(null); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.fov = clamp(cam.fov * (e.deltaY > 0 ? 1.06 : 0.94), 0.55, 1.15); }, {passive:false});
    el.addEventListener('click', e => {
      const s = e.target.closest('.pb-lab [data-s]'); if (s){ openSpot(s.dataset.s); return; }
      const f = e.target.closest('.pb-lab [data-f]'); if (f){ openSpot('f:' + f.dataset.f); return; }
      const b = e.target.closest('[data-q]'); if (!b || b.disabled) return; const q = b.dataset.q;
      if (q === 'out') close(); else if (q === 'x') panel(null); else if (q === 'list'){ PHONE.show(true); PHONE.open('naustp'); } else if (q.startsWith('buy:')) buy(q.slice(4));
    });
  }
  function open(){
    if (!NOTEBOOK.atNaust()) return false;
    if (!el) build();
    if (!init()){ PHONE.show(true); PHONE.open('naustp'); return false; }          // no WebGL or no model: the page as before
    on = true; el.hidden = false; document.body.classList.add('in-pub'); panel(null);
    const E = P.A.eye, Lk = P.A.look; if (Lk && E){ cam.yaw = Math.atan2(-(Lk[0] - E[0]), -(Lk[2] - E[2])); cam.pitch = Math.atan2(Lk[1] - E[1], Math.hypot(Lk[0] - E[0], Lk[2] - E[2])); }
    cam.fov = 1;
    if (typeof G3 !== 'undefined' && G3.hold) G3.hold(true);
    renderTop(); tLast = 0; if (!raf) raf = requestAnimationFrame(frame);
    sound(); return true;
  }
  function close(){
    if (!on) return; on = false; sound(); if (el) el.hidden = true; document.body.classList.remove('in-pub'); panel(null);
    if (typeof G3 !== 'undefined' && G3.hold) G3.hold(false);
    if (typeof renderActs === 'function') renderActs();
  }
  // the screen rectangle round Father's cod and its label, for the guide's ring (null until the room has drawn a frame)
  function farRect(){
    if (!on || !P || !VP) return null; const F0 = FAR_AT(); if (!F0) return null; const r = cv.getBoundingClientRect();
    const pts = [[-0.62, -0.22], [0.62, -0.22], [0.62, 0.44], [-0.62, 0.44]].map(([dx, dy]) => project([F0[0] + dx, F0[1] + dy, F0[2] + 0.2])); if (pts.some(q => !q)) return null;
    const xs = pts.map(q => q[0] + r.left), ys = pts.map(q => q[1] + r.top), x0 = Math.min(...xs), y0 = Math.min(...ys);
    return {x:x0, y:y0, w:Math.max(...xs) - x0, h:Math.max(...ys) - y0};
  }
  return {open, close, isOpen:() => on, ready(){ if (!el) build(); return init(); }, farRect, get panel(){ return panelKey; }, openSpot, look(y, p){ cam.yaw = y; cam.pitch = p; }, get anchors(){ return P ? P.A : null; }, get cam(){ return cam; }, project:c => VP ? project(c) : null, lenOf};
})();
