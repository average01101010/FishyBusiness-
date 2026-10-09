// ---------- the pub in 3D: a stool at the bar, seen in first person (Jonas 08.10.2026) ----------
// «Spilleren trykker på pub og blir dermed sendt inn i puben hvor man sitter ved bardisken i first-person-view. Man skal kunne spinne
// hjulet som tidligere.» The room is a model from Blender (tools/harbour/pub.py) with the light baked into its colours, the same in every
// bygd with the place's name on the board over the bar. Its own small WebGL canvas over the game (the world's 3D view holds its frames
// meanwhile, G3.hold): look round with a finger, tap what you want. The wheel on the wall turns in 3D on the same draw as before
// (PUBW.draw: one round an evening, game money only); the bartender has the evening's talk and a round for your crew; the notice board
// has Kystposten, the week's best and the trips; the crew looking for a berth sit at the round table; the fiskarlag's long table, the
// week's quiz on the chalkboard, the players in the harbour tonight with greetings (preset only), stories by the fire.
const PUB3 = (() => {
  const L = (no, en) => S.lang === 'no' ? no : en, esc = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
  let el = null, cv = null, gl = null, P = null, on = false, raf = 0, failed = false;
  const cam = {yaw:0, pitch:-0.06, fov:1.0}, WH = {a:0, from:0, to:0, t0:0, dur:4.2, busy:false, done:null};
  let panelKey = null, tLast = 0, flick = 1, drag = null;

  // ---------- the model: the GLB as it is (positions as 16-bit, colours as bytes), straight into the GPU ----------
  function parse(b64){
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(u8.buffer); if (dv.getUint32(0, true) !== 0x46546C67) return null;
    const jl = dv.getUint32(12, true), J = JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + jl))), bo = 20 + jl + 8, bl = dv.getUint32(20 + jl, true);
    return {J, bin:u8.subarray(bo, bo + bl)};
  }
  const VS = 'attribute vec3 aP;attribute vec4 aC;attribute vec2 aQ;uniform mat4 uVP,uM;uniform float uT,uFl;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aP,1.0);float fl=aQ.x>3.5?1.0:0.0;' +
    // the flames sway (zone 4), more towards their tips
    'if(fl>0.5){float h=max(w.y-0.16,0.0)*3.0;w.x+=sin(uT*7.0+w.z*23.0)*0.012*h;w.z+=cos(uT*6.1+w.x*31.0)*0.012*h;w.y+=sin(uT*11.0+w.z*17.0)*0.01*h;}' +
    // the fire's share of the light (_PAINT[1]) follows its flicker
    'float f=1.0+aQ.y/255.0*(uFl-1.0);vC=aC.rgb*(fl>0.5?(0.75+0.45*uFl):f);gl_Position=uVP*w;}';
  const FS = 'precision mediump float;varying vec3 vC;uniform float uA;' +
    'void main(){float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5;gl_FragColor=vec4(vC+n/255.0,uA);}';
  const VT = 'attribute vec3 aP;attribute vec2 aU;uniform mat4 uVP;varying vec2 vU;void main(){vU=aU;gl_Position=uVP*vec4(aP,1.0);}';
  const FT = 'precision mediump float;varying vec2 vU;uniform sampler2D uTex;uniform float uK;void main(){vec4 c=texture2D(uTex,vU);gl_FragColor=vec4(c.rgb*uK,c.a);}';
  function prog(vs, fs){
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++){ const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return {p, u};
  }
  function load(){
    const src = glbData('glb', 'pub'); if (!src) return null;
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
      parts[nd.name] = {ib, n:ia.count, it:big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, pos:at('POSITION'), col:at('COLOR_0'), q:at('_PAINT'), t:nd.translation || [0, 0, 0], s:nd.scale || [1, 1, 1], alpha:J.materials[pr.material].alphaMode === 'BLEND'};
    }
    return {vb, parts, A:(J.scenes[0].extras || {}).anchors || {}};
  }
  // the board over the bar: the place's name painted on a canvas
  function signTex(name){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const x = c.getContext('2d');
    x.clearRect(0, 0, 1024, 256); x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#e9cf8a'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 6; x.shadowOffsetY = 3;
    let fs = 128; x.font = '700 ' + fs + 'px Georgia, "Times New Roman", serif'; const t = String(name).toUpperCase();
    while (x.measureText(t).width > 940 && fs > 40){ fs -= 6; x.font = '700 ' + fs + 'px Georgia, "Times New Roman", serif'; }
    x.fillText(t, 512, 136);
    x.font = 'italic 600 40px Georgia, serif'; x.fillStyle = '#c9b178'; x.shadowBlur = 0; x.fillText('— ' + L('puben', 'the pub') + ' —', 512, 34);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    return tex;
  }
  function signQuad(A){
    const q = A.sign; if (!q) return null; const p = [...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], uv = [0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0];
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(p), gl.STATIC_DRAW);
    const u = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, u); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    return {b, u};
  }
  function init(){
    if (gl) return true; if (failed) return false;
    if (/no3d/.test(location.hash)){ failed = true; return false; }      // the tests without 3D (KYST_LITE) get the wheel as before
    try {
      gl = cv.getContext('webgl', {antialias:true, alpha:false, powerPreference:'high-performance'}) || cv.getContext('experimental-webgl');
      if (!gl) throw new Error('no webgl');
      const pr = prog(VS, FS), pt = prog(VT, FT), M = load(); if (!M) throw new Error('no model');
      P = Object.assign(M, {pr, pt, sq:signQuad(M.A), stex:null, sname:''});
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; P = null; failed = false; });
      return true;
    } catch (e){ failed = true; gl = null; console.warn('pub 3d', e); return false; }
  }

  // ---------- matrices (column-major) ----------
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++){ let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const persp = (fy, a, n, f) => { const t = 1 / Math.tan(fy / 2); return new Float32Array([t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  const basis = () => { const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const f = [-sy * cp, sp, -cy * cp], r = [cy, 0, -sy], u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]; return {f, r, u}; };
  function viewM(e){ const {f, r, u} = basis(), d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return new Float32Array([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -d(r, e), -d(u, e), d(f, e), 1]); }
  const TS = (t, s) => new Float32Array([s[0], 0, 0, 0, 0, s[1], 0, 0, 0, 0, s[2], 0, t[0], t[1], t[2], 1]);
  const RZ = a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); };
  // the field of view: about 64° across in landscape, taller in portrait so the bar still fits
  const fovY = asp => asp >= 1 ? 2 * Math.atan(Math.tan(32 * Math.PI / 180) / asp) * 1.25 : Math.min(1.45, 2 * Math.atan(Math.tan(34 * Math.PI / 180) / asp));

  // ---------- a frame ----------
  let VP = null, ASP = 1, FY = 1;
  function drawPart(pt, M, alpha){
    const p = P.pr; gl.uniformMatrix4fv(p.u.uM, false, M); gl.uniform1f(p.u.uA, alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER, P.vb);
    gl.vertexAttribPointer(0, 3, pt.pos.type, pt.pos.norm, pt.pos.stride, pt.pos.off);
    gl.vertexAttribPointer(1, 4, pt.col.type, pt.col.norm, pt.col.stride, pt.col.off);
    gl.vertexAttribPointer(2, 2, pt.q.type, false, pt.q.stride, pt.q.off);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pt.ib); gl.drawElements(gl.TRIANGLES, pt.n, pt.it, 0);
  }
  function frame(now){
    raf = on ? requestAnimationFrame(frame) : 0; if (!on || !gl || document.hidden) return;
    const t = now / 1000, dt = Math.min(0.1, t - (tLast || t)); tLast = t;
    // the canvas at the screen's size (at most 2 pixels a point)
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h); ASP = w / Math.max(1, h); FY = fovY(ASP) * cam.fov;
    const E = P.A.eye || [0, 1.5, -5.3]; VP = mul(persp(FY, ASP, 0.04, 90), viewM(E));
    // the fire flickers: a few beating waves and a drifting noise
    flick += ((1 + 0.13 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 13.7 + 1.3) + 0.05 * Math.sin(t * 23.1 + 0.4) + (Math.random() - 0.5) * 0.12) - flick) * Math.min(1, dt * 12);
    // the wheel: easing out to where the draw put it
    if (WH.busy){ const k = Math.min(1, (t - WH.t0) / WH.dur), e = 1 - Math.pow(1 - k, 3.6); WH.a = WH.from + (WH.to - WH.from) * e;
      if (k >= 1){ WH.busy = false; WH.a = WH.to % (2 * Math.PI); const d = WH.done; WH.done = null; if (d) d(); } }
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    const p = P.pr; gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uVP, false, VP); gl.uniform1f(p.u.uT, t); gl.uniform1f(p.u.uFl, flick);
    for (let i = 0; i < 3; i++) gl.enableVertexAttribArray(i);
    const R = P.parts.room, W = P.parts.wheel, Gp = P.parts.glass;
    drawPart(R, TS(R.t, R.s), 1);
    if (W){ const c = P.A.wheel.c; drawPart(W, mul(mul(TS(c, [1, 1, 1]), RZ(-WH.a)), TS(W.t, W.s)), 1); }
    // the name board, then the glass
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    if (Gp) drawPart(Gp, TS(Gp.t, Gp.s), 0.1);
    gl.disableVertexAttribArray(2);
    const nm = placeName(); if (P.sq && nm){ if (P.sname !== nm){ if (P.stex) gl.deleteTexture(P.stex); P.stex = signTex(nm); P.sname = nm; }
      const q = P.pt; gl.useProgram(q.p); gl.uniformMatrix4fv(q.u.uVP, false, VP); gl.uniform1f(q.u.uK, 0.55 + 0.1 * flick);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.stex); gl.uniform1i(q.u.uTex, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, P.sq.b); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, P.sq.u); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6); }
    gl.depthMask(true); gl.disable(gl.BLEND);
    labels();
    if (now - (frame.chk || 0) > 1000){ frame.chk = now; tick(); }
  }
  const placeName = () => { const pt = portById(S.boat.port); return pt ? String(pt.place || pt.name || '').replace(/\s+(fiskemottak|mottak|fiskebruk)$/i, '') : ''; };

  // ---------- what can be tapped ----------
  const SPOTS = {wheel:['Lykkehjulet', 'The wheel'], bartender:['Bartenderen', 'The bartender'], board:['Oppslagstavla', 'Notice board'], crew:['Ledige folk', 'Hands for hire'],
    lag:['Fiskarlaget', 'The fishing club'], quiz:['Ukas quiz', 'This week\'s quiz'], cards:['Kortspillerne', 'The card players'], fire:['Peisen', 'The fireplace'], door:['Gå ut', 'Leave']};
  function project(c){ const x = VP[0] * c[0] + VP[4] * c[1] + VP[8] * c[2] + VP[12], y = VP[1] * c[0] + VP[5] * c[1] + VP[9] * c[2] + VP[13], w = VP[3] * c[0] + VP[7] * c[1] + VP[11] * c[2] + VP[15];
    if (w <= 0.05) return null; return [(x / w * 0.5 + 0.5) * cv.clientWidth, (0.5 - y / w * 0.5) * cv.clientHeight]; }
  function labels(){
    const lay = el.querySelector('.pb-lab'); if (!lay) return;
    for (const [k, c, r] of P.A.spots || []){
      let b = lay.querySelector('[data-s="' + k + '"]');
      if (!b){ b = document.createElement('button'); b.dataset.s = k; b.textContent = L(...SPOTS[k] || [k, k]); lay.appendChild(b); }
      const lift = k === 'wheel' ? r + 0.12 : k === 'bartender' ? 0.55 : k === 'door' ? 1.3 : k === 'board' ? 0.55 : k === 'quiz' ? 0.5 : 0.2;
      const s = project([c[0], c[1] + lift, c[2]]), vis = s && s[0] > -40 && s[0] < cv.clientWidth + 40 && s[1] > 30 && s[1] < cv.clientHeight - 20;
      b.style.display = vis && !panelKey ? '' : 'none'; if (vis) b.style.transform = 'translate(' + Math.round(s[0]) + 'px,' + Math.round(s[1]) + 'px) translate(-50%,-100%)';
    }
  }
  function pick(px, py){
    const x = px / cv.clientWidth * 2 - 1, y = 1 - py / cv.clientHeight * 2, ty = Math.tan(FY / 2), tx = ty * ASP, {f, r, u} = basis();
    const d = [f[0] + r[0] * x * tx + u[0] * y * ty, f[1] + r[1] * x * tx + u[1] * y * ty, f[2] + r[2] * x * tx + u[2] * y * ty], dl = Math.hypot(...d), E = P.A.eye;
    let best = null, bt = 1e9;
    for (const [k, c, rad] of P.A.spots || []){
      const o = [c[0] - E[0], c[1] - E[1], c[2] - E[2]], t = (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]) / dl, d2 = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - t * t;
      if (t > 0 && d2 < rad * rad && t < bt){ bt = t; best = k; }
    }
    return best;
  }

  // ---------- the panels ----------
  function panel(key, html){
    panelKey = key; const pn = el.querySelector('.pb-panel');
    if (!key){ pn.hidden = true; pn.innerHTML = ''; return; }
    pn.innerHTML = '<div class="pb-ph"><b>' + esc(L(...(SPOTS[key] || PANEL_T[key] || [key, key]))) + '</b><button data-q="x" aria-label="' + L('Lukk', 'Close') + '">✕</button></div><div class="pb-pb">' + html + '</div>';
    pn.hidden = false;
  }
  const PANEL_T = {who:['I kveld', 'Tonight']};
  const H_ = () => S.t / 60;
  const ev = () => pubEvening(H_());
  function openSpot(k){
    if (k === 'door'){ close(); return; }
    const f = PANELS[k]; if (f){ f(); if (k !== 'who' && k !== 'wheel') turnTo(k, 0.2); }
  }
  const btn = (q, label, dis, cls) => '<button data-q="' + q + '"' + (dis ? ' disabled' : '') + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</button>';
  const PANELS = {
    wheel(){
      const H = H_(), why = PUBW.why(H), last = S.pubLast && S.pubLast.e === ev() && S.pubE === ev() ? S.pubLast.m : '';
      panel('wheel', '<p>' + (WH.busy ? L('Hjulet snurrer …', 'The wheel is spinning …') : last ? esc(last) : ((t => t ? L(t[0], t[1]) + ' ' : '')(seasonTalk(H)) + L('Spander en runde og hør hva folk har å si. Kanskje går du hjem med haill.', 'Buy a round and hear what people say. Maybe you go home with some luck.'))) + '</p>' +
        '<div class="pb-bt">' + btn('spin', L('Spander en runde', 'Buy a round') + ' · ' + kr(PUBW.cost()), !!why || WH.busy, 'pri') + '</div>' +
        (why && !WH.busy ? '<p class="pb-why">' + esc(why) + '</p>' : '') + '<p class="pb-odds">' + esc(PUBW.odds()) + '</p>');
    },
    bartender(){ panel('bartender', barHtml()); },
    board(){ panel('board', boardHtml()); },
    crew(){ panel('crew', crewHtml()); },
    lag(){ panel('lag', PUBSOC.lagHtml()); PUBSOC.lagFetch(() => { if (panelKey === 'lag') PANELS.lag(); }); },
    quiz(){ panel('quiz', PUBSOC.quizHtml()); },
    cards(){ const st = lorePub(); panel('cards', '<p>' + esc(st ? st[S.lang === 'no' ? 0 : 1] : L('De er midt i en runde og vil ikke forstyrres.', 'They are in the middle of a hand and will not be disturbed.')) + '</p><p class="pb-why">' + L('Den ene ser opp: «Sett dæ ned en anna kveld, så ska du få være med.»', 'One of them looks up: «Sit down another evening, and you can join in.»') + '</p>'); },
    fire(){ const st = lorePub(); panel('fire', '<p>' + L('Du varmer hendene ved peisen. ', 'You warm your hands at the fire. ') + (st ? esc(st[S.lang === 'no' ? 0 : 1]) : '') + '</p>'); },
    who(){ panel('who', PUBSOC.whoHtml()); PUBSOC.greetFetch(() => { if (panelKey === 'who') PANELS.who(); }); }
  };
  function spin(){
    if (WH.busy) return; const d = PUBW.draw(); if (!d){ PANELS.wheel(); return; }
    const A = (P.A.wheel && P.A.wheel.segs) || [], g = A.find(s => s[0] === d.seg.k && Math.abs(s[1] - d.seg.s0) < 0.5) || [d.seg.k, d.seg.s0, d.seg.s1];
    const at = g[1] + (g[2] - g[1]) * (0.2 + 0.6 * Math.random()), cur = WH.a % (2 * Math.PI), aim = (360 - at) * Math.PI / 180;
    WH.from = cur; WH.to = cur + 5 * 2 * Math.PI + (((aim - cur) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); WH.t0 = performance.now() / 1000; WH.busy = true;
    WH.done = () => { if (panelKey === 'wheel') PANELS.wheel(); if (typeof renderHud === 'function') renderHud(); if (typeof renderActs === 'function') renderActs(); };
    // look at the wheel while it turns, a little low so it stands above the panel
    turnTo('wheel', 0.2);
    PANELS.wheel(); renderTop();
  }
  // the camera turns smoothly to a spot
  function turnTo(k, low){
    const s = (P.A.spots || []).find(q => q[0] === k); if (!s) return; const E = P.A.eye, dx = s[1][0] - E[0], dy = s[1][1] - E[1], dz = s[1][2] - E[2];
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz)) - (low || 0); let dyaw = ((yaw - cam.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const y0 = cam.yaw, p0 = cam.pitch, t0 = performance.now();
    const step = () => { const k2 = Math.min(1, (performance.now() - t0) / 700), e = k2 * k2 * (3 - 2 * k2); cam.yaw = y0 + dyaw * e; cam.pitch = p0 + (pitch - p0) * e; if (k2 < 1 && on) requestAnimationFrame(step); };
    step();
  }

  // ---------- the bartender: the evening's talk in the place's dialect, and a round for the crew ----------
  const TALK = [
    ['Dem betale godt for %s på %s i dag, %k kiloen, har æ hørt.', 'They pay well for %s at %s today, %k a kilo, I hear.'],
    ['Han som va her i går, sa at %s gikk for %k på %s. Ikke verst, det.', 'The fellow here yesterday said %s went for %k at %s. Not bad.']];
  function barTip(){
    const pt = portById(S.boat.port), H = H_(); if (!pt) return null;
    let best = null;
    for (const q of PORTS){ if (!q.mottak || dist(q.p, pt.p) > 45) continue;
      for (const sp of ['torsk', 'sei', 'hyse', 'kveite', 'lange', 'brosme']){ if (!SPECIES[sp]) continue; let v; try { v = price(q, sp, H); } catch (e){ continue; }
        const rel = v / (SPECIES[sp].ref || v); if (!best || rel > best.rel) best = {q, sp, v, rel}; } }
    if (!best) return null;
    const i = (ev() + S.boat.port.length) % TALK.length, dial = dialectAt(pt.p), nm = best.q.name, sp = SPECIES[best.sp];
    const no = TALK[i][0].replace('%s', sp.no.toLowerCase()).replace('%s', nm).replace('%k', kr(best.v)).replace('%s', nm), en = TALK[i][1].replace('%s', sp.en.toLowerCase()).replace('%s', nm).replace('%k', kr(best.v)).replace('%s', nm);
    return S.lang === 'no' ? dialectText(dial, no) : en;
  }
  const ROUND_PP = 120;
  const crewHere = () => (S.crew || []).filter(c => !c.off);
  function barHtml(){
    const pt = portById(S.boat.port), dial = pt ? dialectAt(pt.p) : null, H = H_(), st = seasonTalk(H), tip = barTip(), cr = crewHere(), cost = ROUND_PP * cr.length, had = S.crewRoundE === ev();
    const hello = S.lang === 'no' ? dialectText(dial, ['Kva ska det være i kveld?', 'Sett dæ, du. Kaffe eller øl?', 'Dæven, er det dæ igjen? Velkommen!'][ev() % 3]) : ['What will it be tonight?', 'Have a seat. Coffee or beer?', 'Well, look who it is. Welcome!'][ev() % 3];
    return '<p class="pb-say">«' + esc(hello) + '»</p>' + (tip ? '<p>«' + esc(tip) + '»</p>' : '') + (st ? '<p>' + esc(L(st[0], st[1])) + '</p>' : '') +
      (cr.length ? '<div class="pb-bt">' + btn('round', L('Spander en runde på mannskapet', 'Buy your crew a round') + ' · ' + kr(cost), had || S.cash < cost, 'pri') + '</div><p class="pb-why">' +
        (had ? L('Mannskapet har fått sin runde i kveld.', 'The crew have had their round tonight.') : S.cash < cost ? L('Du har ikke nok penger til en runde.', 'You do not have enough money for a round.') : L('En øl på deg løfter stemningen om bord, og de husker det en stund.', 'A beer on you lifts the mood aboard, and they remember it for a while.')) + '</p>'
        : '<p class="pb-why">' + L('Har du mannskap, kan du spandere en runde på dem her.', 'With a crew, you can buy them a round here.') + '</p>') + kjentHtml();
  }
  // ---------- the old hand at the bar with the echo sounder's news (tilbakemelding #58; Jonas 09.10.2026: «i puben 1 gang per spilldøgn») ----------
  // For game money, once a game day: he names the best place within 10 km of the harbour for the species you ask about, and how the others
  // stand there. The place is the sea's own (the same density the fish come from), so the reward still comes from the sea; it is a chart
  // mark until the day is out.
  const KJENT_COST = 2500, KJENT_SP = ['torsk', 'sei', 'hyse', 'kveite'], KJENT_R = 10;
  const gameDay = () => Math.floor(H_() / 24);
  function kjentFind(sp){
    const pt = portById(S.boat.port), H = H_(); if (!pt) return null;
    const pts = [];
    for (let dy = -KJENT_R; dy <= KJENT_R; dy += 0.8) for (let dx = -KJENT_R; dx <= KJENT_R; dx += 0.8){
      if (dx * dx + dy * dy > KJENT_R * KJENT_R) continue; const p = {x:pt.p.x + dx, y:pt.p.y + dy};
      try { if (isLand(p)) continue; const d = depthF(p); if (d < 8 || d > 400) continue; const v = {}; for (const k of KJENT_SP) v[k] = density(k, p, H); pts.push({p, v}); } catch (e){ /* a block not loaded: leave it */ }
    }
    if (!pts.length) return null;
    const max = {}; for (const k of KJENT_SP) max[k] = Math.max(1e-9, ...pts.map(q => q.v[k]));
    const best = pts.reduce((a, q) => q.v[sp] > a.v[sp] ? q : a, pts[0]);
    const lvl = k => { const r = best.v[k] / max[k]; return r > 0.75 ? 3 : r > 0.45 ? 2 : r > 0.15 ? 1 : 0; };
    return {p:best.p, sp, lv:Object.fromEntries(KJENT_SP.map(k => [k, lvl(k)])), place:nearestPlace(best.p)};
  }
  const LVL = [['nesten ingenting', 'next to nothing'], ['litt', 'a little'], ['bra', 'good'], ['mye', 'plenty']];
  function kjentHtml(){
    const K = S.kjent && S.kjent.d === gameDay() ? S.kjent : null, can = !K && S.cash >= KJENT_COST;
    if (K){ const sp = SPECIES[K.sp];
      return '<div class="pb-card"><h5>' + L('Kjentmannen ved disken', 'The old hand at the bar') + '</h5><p>«' + esc(L('Æ var ute med loddet i dag. ' + sp.no + ' står ' + LVL[K.lv[K.sp]][0] + ' ' + K.place.no + '.', 'I was out with the sounder today. ' + sp.en + ': ' + LVL[K.lv[K.sp]][1] + ', ' + K.place.en + '.')) + '»</p><p>' +
        KJENT_SP.filter(k => k !== K.sp).map(k => esc(L(SPECIES[k].no + ': ' + LVL[K.lv[k]][0], SPECIES[k].en + ': ' + LVL[K.lv[k]][1]))).join(' · ') + '</p><p class="pb-why">' + L('Plassen står som et merke i kartet resten av dagen. Ny rapport i morgen.', 'The place is a mark on the chart for the rest of the day. A new report tomorrow.') + '</p></div>'; }
    return '<div class="pb-card"><h5>' + L('Kjentmannen ved disken', 'The old hand at the bar') + '</h5><p>' + L('Han med skipperlua har vært ute med ekkoloddet. For ' + kr(KJENT_COST) + ' forteller han hvor det står best innen ' + KJENT_R + ' km, og hva annet som står der.', 'The man in the skipper\'s cap has been out with his echo sounder. For ' + kr(KJENT_COST) + ' he tells you where it stands best within ' + KJENT_R + ' km, and what else is there.') + '</p>' +
      '<div class="pb-bt">' + KJENT_SP.map(k => btn('kjent:' + k, esc(L(SPECIES[k].no, SPECIES[k].en)), !can)).join('') + '</div>' + (S.cash < KJENT_COST ? '<p class="pb-why">' + L('Du har ikke nok penger.', 'You do not have enough money.') + '</p>' : '') + '</div>';
  }
  function kjentBuy(sp){
    if (!KJENT_SP.includes(sp) || (S.kjent && S.kjent.d === gameDay()) || S.cash < KJENT_COST) return;
    const r = kjentFind(sp); if (!r){ toast(L('Kjentmannen har ikke vært ute her i dag.', 'The old hand has not been out round here today.')); return; }
    S.cash -= KJENT_COST; S.stats.costs += KJENT_COST;
    const until = (gameDay() + 1) * 1440;
    S.kjent = {d:gameDay(), sp, lv:r.lv, place:r.place, x:r.p.x, y:r.p.y};
    // his place as a chart mark until the day is out (the chart leaves out marks whose time has run)
    S.pins = (S.pins || []).filter(q => !q.kjent); const id = (S.pinN = (S.pinN || 0) + 1);
    S.pins.push({id, x:Math.round(r.p.x * 1000) / 1000, y:Math.round(r.p.y * 1000) / 1000, name:L('Kjentmann: ', 'Old hand: ') + L(SPECIES[sp].no, SPECIES[sp].en).toLowerCase(), t:S.t, kjent:true, until});
    msg('Puben', 'Kjentmannen: ' + SPECIES[sp].no + ' står ' + LVL[r.lv[sp]][0] + ' ' + r.place.no + '. Merket ligger i kartet resten av dagen.', 'The old hand: ' + SPECIES[sp].en + ', ' + LVL[r.lv[sp]][1] + ', ' + r.place.en + '. The mark is on the chart for the rest of the day.');
    save(); PANELS.bartender(); renderTop(); if (typeof scheduleStatic === 'function') scheduleStatic();
  }
  function crewRound(){
    const cr = crewHere(), cost = ROUND_PP * cr.length; if (!cr.length || S.crewRoundE === ev() || S.cash < cost) return;
    S.cash -= cost; S.stats.costs += cost; S.crewRoundE = ev();
    for (const c of cr){ c.morale = clamp((c.morale || 50) + (c.traits && c.traits.includes('olglad') ? 12 : 8), 0, 100); }
    msg('Puben', L('Du spanderte en runde på mannskapet. Stemningen steg.', 'You bought the crew a round. The mood rose.'), 'You bought the crew a round. The mood rose.');
    save(); PANELS.bartender(); renderTop(); if (typeof renderHud === 'function') renderHud();
  }

  // ---------- the notice board: Kystposten, the week's best, the trips ----------
  function boardHtml(){
    const h = [], H = H_(), w = weekOf(H), grp = S.lic ? 'lukket' : 'open', T = typeof worldTop === 'function' ? worldTop(w, grp) : null;
    const top = T && T.data && T.data.rows ? T.data.rows.slice(0, 3) : null;
    h.push('<div class="pb-card"><h5>Kystposten</h5><p>' + L('Avisa henger på tavla med siste nytt fra kysten: landinger, nye båter, redninger og rekordpriser.', 'The paper hangs on the board with the latest from the coast: landings, new boats, rescues and record prices.') + '</p>' + btn('o:post', L('Les Kystposten', 'Read Kystposten')) + '</div>');
    h.push('<div class="pb-card"><h5>' + L('Ukas beste fiskere', 'This week\'s best fishers') + '</h5>' + (top && top.length ? '<ol>' + top.map(r => '<li>' + esc(r.me ? (S.boatName || L('Deg', 'You')) : peerName(r.boat)) + (r.user && !r.me ? ' <small>' + esc(peerName(r.user)) + '</small>' : '') + ' · ' + fmt(r.kg, 0) + ' kg</li>').join('') + '</ol>'
      : '<p>' + (T ? L('Ingen har landet ennå denne uka.', 'No one has landed yet this week.') : L('Topplista vises når du er logget inn.', 'The leaderboard shows when you are signed in.')) + '</p>') + btn('o:salg', L('Se topplista', 'See the leaderboard')) + '</div>');
    const tn = typeof turState === 'function' ? turState().board.filter(m => m.until > S.t).length : 0;
    h.push('<div class="pb-card"><h5>' + L('Turoppdrag', 'Trip jobs') + '</h5><p>' + (tn ? L(tn + (tn === 1 ? ' lapp' : ' lapper') + ' med turoppdrag henger oppe.', tn + (tn === 1 ? ' note' : ' notes') + ' with trip jobs are pinned up.') : L('Ingen nye turoppdrag akkurat nå.', 'No new trip jobs just now.')) + '</p>' + btn('o:ordl', L('Se oppdragene', 'See the jobs')) + '</div>');
    return h.join('');
  }
  // ---------- the round table: the hands looking for a berth (the crew exchange) ----------
  function crewHtml(){
    const B = S.bors, n = B && B.pool ? B.pool.length : 0, room = (S.crew || []).length < (BOAT.crewMax || 0);
    return '<p>' + (n ? L(n + (n === 1 ? ' fisker sitter' : ' fiskere sitter') + ' ved bordet og ser etter hyre.', n + (n === 1 ? ' fisher sits' : ' fishers sit') + ' at the table looking for a berth.') : L('Ingen ser etter hyre i kveld.', 'No one is looking for a berth tonight.')) +
      ' ' + (room ? '' : L('Båten din har ikke plass til flere nå.', 'Your boat has no room for more now.')) + '</p><div class="pb-bt">' + btn('o:bors', L('Snakk med dem', 'Talk to them'), false, 'pri') + '</div>';
  }

  // ---------- the top bar ----------
  function renderTop(){
    if (!el) return; const t = el.querySelector('.pb-t'), H = H_();
    if (t) t.innerHTML = esc(L('Puben i ', 'The pub in ') + (placeName() || '')) + '<small>' + esc(clockStr(H)) + ' · ' + esc(kr(S.cash)) + '</small>';
    const w = el.querySelector('[data-q="who"]'); if (w){ const n = PUBSOC.here().length; w.textContent = '👥 ' + (n ? L(n + ' her i kveld', n + ' here tonight') : L('I kveld', 'Tonight')); }
  }
  const clockStr = H => { const m = Math.floor(((H % 24) + 24) % 24 * 60); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  // once a second: the clock, and out at closing time or if the boat is gone
  function tick(){
    renderTop();
    if (S.boat.status !== 'port' || !pubOpen(H_())){ toast(L('Bartenderen roper siste runde. Puben stenger.', 'The bartender calls last orders. The pub closes.')); close(); }
  }

  // ---------- open and close ----------
  function build(){
    el = document.createElement('div'); el.id = 'pub3'; el.hidden = true;
    el.innerHTML = '<canvas></canvas><div class="pb-lab"></div><div class="pb-top"><div class="pb-t"></div><button data-q="who">👥</button><button data-q="out">' + L('Gå ut', 'Leave') + '</button></div>' +
      '<div class="pb-hint">' + L('Dra for å se deg rundt. Trykk på det du vil.', 'Drag to look around. Tap what you like.') + '</div><div class="pb-panel" hidden></div>';
    document.getElementById('mapwrap').appendChild(el); cv = el.querySelector('canvas');
    // look round with a finger or the mouse; a short tap picks
    cv.addEventListener('pointerdown', e => { drag = {x:e.clientX, y:e.clientY, yaw:cam.yaw, pitch:cam.pitch, moved:false, id:e.pointerId}; try { cv.setPointerCapture(e.pointerId); } catch (_){} });
    cv.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const k = FY / Math.max(1, cv.clientHeight), dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; cam.yaw = drag.yaw + dx * k; cam.pitch = clamp(drag.pitch + dy * k, -1.1, 0.9);
      const hn = el.querySelector('.pb-hint'); if (hn && drag.moved) hn.classList.add('off'); });
    const up = e => { if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null; if (d.moved) return; const r = cv.getBoundingClientRect(), k = pick(e.clientX - r.left, e.clientY - r.top); if (k) openSpot(k); else if (panelKey) panel(null); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; });
    cv.addEventListener('wheel', e => { e.preventDefault(); cam.fov = clamp(cam.fov * (e.deltaY > 0 ? 1.06 : 0.94), 0.55, 1.15); }, {passive:false});
    el.addEventListener('click', e => {
      const s = e.target.closest('.pb-lab [data-s]'); if (s){ openSpot(s.dataset.s); return; }
      const b = e.target.closest('[data-q]'); if (!b || b.disabled) return; const q = b.dataset.q;
      if (q === 'out') close(); else if (q === 'x') panel(null); else if (q === 'who') PANELS.who(); else if (q === 'spin') spin(); else if (q === 'round') crewRound(); else if (q.startsWith('kjent:')) kjentBuy(q.slice(6));
      else if (q.startsWith('o:')){ const a = q.slice(2); if (PHONE.DRAWER && PHONE.DRAWER.has(a)) PHONE.open(a); else { PHONE.show(true); PHONE.open(a); } }
      else if (PUBSOC.act(q, b)){ if (panelKey && PANELS[panelKey]) PANELS[panelKey](); renderTop(); }
    });
  }
  function open(){
    if (!el) build();
    if (!init()){ PUBW.open(); return; }          // no WebGL or no model: the wheel as before
    on = true; el.hidden = false; document.body.classList.add('in-pub'); panel(null);
    const E = P.A.eye, Lk = P.A.look; if (Lk && E){ cam.yaw = Math.atan2(-(Lk[0] - E[0]), -(Lk[2] - E[2])); cam.pitch = Math.atan2(Lk[1] - E[1], Math.hypot(Lk[0] - E[0], Lk[2] - E[2])); }
    // start turned a little towards the wheel, so both it and the bartender are in sight
    cam.yaw -= 0.18; cam.fov = 1;
    if (typeof G3 !== 'undefined' && G3.hold) G3.hold(true);
    S.pubVisit = (S.pubVisit || 0) + 1; renderTop(); PUBSOC.enter();
    tLast = 0; if (!raf) raf = requestAnimationFrame(frame);
  }
  function close(){
    if (!on) return; on = false; if (el) el.hidden = true; document.body.classList.remove('in-pub'); panel(null);
    if (typeof G3 !== 'undefined' && G3.hold) G3.hold(false);
    if (typeof renderActs === 'function') renderActs();
  }
  return {open, close, isOpen:() => on, get panel(){ return panelKey; }, openSpot, spin, get wheelA(){ return WH.a; }, get busy(){ return WH.busy; }, look(y, p){ cam.yaw = y; cam.pitch = p; },
    get anchors(){ return P ? P.A : null; }, kjentFind, get cam(){ return cam; }, project:c => VP ? project(c) : null};
})();
