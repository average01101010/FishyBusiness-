// ===== Garderoben: the player changes how his figure looks (Jonas 10.10.2026) =====
// A full-screen sheet with the figure turning in a small WebGL view of its own (the same parts the game draws: vessel3d.js figureVB on a
// look, core/09i-look.js) and the choices below or beside it: body, skin, hair and hair colour, beard, hat, jacket, trousers, shoes, each with its
// colours. The look is kept in S.look, which the 3D view draws on deck and the crew sees (view3d.js refreshPeople). Touch first: big buttons,
// portrait and landscape. «Ferdig» keeps the look, «Avbryt» throws the changes away.
const WARD = (() => {
  let root = null, cv = null, gl = null, prog = null, buf = null, st = null, raf = 0, ro = null;
  // Folk 2 (FB6, steg 124), behind #folk2 in the address: the new skinned figure (vessel3d.js figMesh from folk2.b64) stands beside
  // today's, in the same look, so the two can be compared before the new one goes on deck. N2 holds its program, its draw calls and
  // what was measured (the palette, the triangles, the milliseconds of its last draw). Without #folk2 nothing here is touched.
  const N2 = {on:false, prog:null, pal:0, maxV:0, draws:[], tris:0, sex:'m', ms:0, wait:0, loc:null};
  // the poses the new figure can be seen in: the model's own rest pose, the standing pose the game holds, a grip in each hand (the
  // right closed round a shaft, the left a pinch), and the far poses the weights were checked in (figpose.js figPoses)
  const POSES2 = [['stå', 'Stående', 'Standing'], ['hvile', 'Hvile', 'Rest pose'], ['grep', 'Grep', 'Grips'], ['gange', 'Gange', 'Stride'], ['sittende', 'Sittende', 'Seated'], ['vridd', 'Vridd', 'Twisted'],
    ['armene opp', 'Armene opp', 'Arms up'], ['dyp knebøy', 'Knebøy', 'Squat'], ['bøyd over rekka', 'Over rekka', 'Over the rail']];
  const L2 = (no, en) => S.lang === 'no' ? no : en;
  const css = c => 'rgb(' + c.slice(0, 3).map(v => Math.round(Math.pow(v, 1 / 1.0) * 255)).join(',') + ')';
  const TABS = [['body', 'Kropp', 'Body'], ['skin', 'Hud', 'Skin'], ['hair', 'Hår', 'Hair'], ['beard', 'Skjegg', 'Beard'], ['hat', 'Hatt', 'Hat'], ['top', 'Jakke', 'Jacket'], ['legs', 'Bukser', 'Trousers'], ['shoe', 'Sko', 'Shoes']];
  const swatch = (c, on, data, title) => '<button class="wd-sw' + (on ? ' on' : '') + '" style="background:' + css(c) + '" ' + data + ' title="' + title + '" aria-label="' + title + '"></button>';
  const chip = (txt, on, data) => '<button class="wd-chip' + (on ? ' on' : '') + '" ' + data + '>' + txt + '</button>';
  const colRow = (palette, names, cur, key, extra) => '<div class="wd-sws">' + (extra || '') + palette.map((c, i) => swatch(c, cur === i, 'data-wd="set" data-k="' + key + '" data-v="' + i + '"', names[i][S.lang === 'no' ? 0 : 1])).join('') + '</div>';
  // ---- the right-hand side: what the current tab offers ----
  function panel(){
    const l = st.look, no = S.lang === 'no', ix = no ? 1 : 2;
    const sub = (t) => '<div class="wd-sub">' + t + '</div>';
    switch (st.tab){
      case 'body': return sub(L2('Kropp', 'Body')) + '<div class="wd-chips">' + chip(L2('Mann', 'Man'), l.b === 'm', 'data-wd="set" data-k="b" data-v="m"') + chip(L2('Kvinne', 'Woman'), l.b === 'f', 'data-wd="set" data-k="b" data-v="f"') + '</div>';
      case 'skin': return sub(L2('Hudfarge', 'Skin tone')) + colRow(LOOK_SKIN, LOOK_SKIN_N, l.s, 's');
      case 'hair': return sub(L2('Frisyre', 'Hairstyle')) + '<div class="wd-chips">' + LOOK_HAIR.map(h => chip(h[ix], l.hs === h[0], 'data-wd="set" data-k="hs" data-v="' + h[0] + '"')).join('') + '</div>'
        + sub(L2('Hårfarge', 'Hair colour')) + colRow(LOOK_HAIR_C, LOOK_HAIR_CN, l.hc, 'hc');
      case 'beard': return l.b === 'f' ? '<div class="wd-note">' + L2('Skjegg og bart er for menn.', 'Beards and moustaches are for men.') + '</div>'
        : sub(L2('Skjegg og bart', 'Beard and moustache')) + '<div class="wd-chips">' + LOOK_BEARD.map(h => chip(h[ix], l.bd === h[0], 'data-wd="set" data-k="bd" data-v="' + h[0] + '"')).join('') + '</div>'
          + sub(L2('Farge (som håret)', 'Colour (as the hair)')) + colRow(LOOK_HAIR_C, LOOK_HAIR_CN, l.hc, 'hc');
      case 'hat': return sub(L2('Hodeplagg', 'Headwear')) + '<div class="wd-chips">' + LOOK_HAT.map(h => chip(h[ix], l.ht === h[0], 'data-wd="set" data-k="ht" data-v="' + h[0] + '"')).join('') + '</div>'
        + (l.ht === 'none' ? '' : sub(L2('Farge', 'Colour')) + colRow(LOOK_COL, LOOK_COL_N, l.hk, 'hk', '<button class="wd-chip small' + (l.hk == null ? ' on' : '') + '" data-wd="set" data-k="hk" data-v="-">' + L2('Som den er', 'As it comes') + '</button>'));
      case 'top': return sub(L2('Jakke og overdel', 'Jacket')) + '<div class="wd-chips">' + LOOK_TOP.map(h => chip(h[ix], l.tp === h[0], 'data-wd="set" data-k="tp" data-v="' + h[0] + '"')).join('') + '</div>' + sub(L2('Farge', 'Colour')) + colRow(LOOK_COL, LOOK_COL_N, l.tk, 'tk') + spTop(l);
      case 'legs': return sub(L2('Buksefarge', 'Trouser colour')) + colRow(LOOK_COL, LOOK_COL_N, l.lg, 'lg');
      case 'shoe': return sub(L2('Sko og støvler', 'Shoes and boots')) + '<div class="wd-chips">' + LOOK_SHOE.map(h => chip(h[ix], l.sh === h[0], 'data-wd="set" data-k="sh" data-v="' + h[0] + '"')).join('') + '</div>'
        + sub(L2('Farge', 'Colour')) + '<div class="wd-sws">' + LOOK_SHOE_COLS.map(i => swatch(LOOK_COL[i], l.sc === i, 'data-wd="set" data-k="sc" data-v="' + i + '"', LOOK_COL_N[i][S.lang === 'no' ? 0 : 1])).join('') + '</div>';
    }
    return '';
  }
  // a partner's garment (M8, F5; docs/planer/butikker-og-sponsorer.md): free to wear, marked, one of the shapes and colours there are
  function spTop(l){
    const P = typeof spOf === 'function' ? spOf('look', 'top') : null, D = P && P.data; if (!D || !LOOK_TOP.some(x => x[0] === D.tp) || !(D.tk >= 0 && D.tk < LOOK_COL.length)) return '';
    const sub = t => '<div class="wd-sub">' + t + '</div>', on = l.tp === D.tp && l.tk === D.tk, esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
    return sub(L2('Fra en samarbeidspartner', 'From a partner')) + '<div class="wd-chips">' + chip(esc(D.name || P.sponsor.name) + ' · ' + L2('gratis', 'free'), on, 'data-wd="sptop"') + '</div>' +
      '<div class="wd-note"><span class="ic-sp-tag">' + L2('Samarbeid', 'Partnership') + '</span> ' + L2('levert av ', 'supplied by ') + esc(P.sponsor.name) + '. ' + L2('Bare utseende: den virker som de andre.', 'Looks only: it works as the others do.') + '</div>';
  }
  function html(){
    return '<div class="wd-view"><canvas class="wd-cv"></canvas><div class="wd-vb">'
      + '<button data-wd="turn" data-v="-1" aria-label="' + L2('Drei til venstre', 'Turn left') + '">⟲</button><button data-wd="zoom">' + (st.zoom ? L2('Hele figuren', 'Whole figure') : L2('Ansiktet', 'The face')) + '</button><button data-wd="turn" data-v="1" aria-label="' + L2('Drei til høyre', 'Turn right') + '">⟳</button>'
      + (N2.on ? '<button data-wd="pose2">' + pose2Txt() + '</button><button data-wd="bare2">' + bare2Txt() + '</button>' : '') + '</div>'
      + (N2.on ? '<div class="wd-n2" style="position:absolute;left:0;right:0;top:8px;display:flex;justify-content:space-around;pointer-events:none;font-weight:600;text-shadow:0 1px 3px #000"><span>' + L2('I dag', 'Today') + '</span><span>' + L2('Ny', 'New') + '</span></div>'
        + '<div class="wd-n2i" style="position:absolute;left:8px;right:8px;bottom:60px;text-align:center;pointer-events:none;font-size:12px;opacity:.8;text-shadow:0 1px 2px #000"></div>' : '') + '</div>'
      + '<div class="wd-side"><div class="wd-top"><b>' + L2('Garderoben', 'Wardrobe') + '</b><span class="wd-sp"></span><button class="wd-x" data-wd="cancel">' + L2('Avbryt', 'Cancel') + '</button><button class="wd-ok" data-wd="done">' + L2('Ferdig', 'Done') + '</button></div>'
      + '<div class="wd-tabs">' + TABS.map(t => '<button class="wd-tab' + (st.tab === t[0] ? ' on' : '') + '" data-wd="tab" data-v="' + t[0] + '">' + t[S.lang === 'no' ? 1 : 2] + '</button>').join('') + '</div>'
      + '<div class="wd-body">' + panel() + '</div>'
      + '<div class="wd-foot"><button data-wd="rand">' + L2('Tilfeldig', 'Random') + '</button><button data-wd="reset">' + L2('Tilbake til start', 'Back to start') + '</button></div></div>';
  }
  const pose2Txt = () => { const q = POSES2.find(x => x[0] === st.pose2) || POSES2[0]; return L2('Stilling: ', 'Pose: ') + q[S.lang === 'no' ? 1 : 2]; };
  const bare2Txt = () => st.bare2 ? L2('Uten hansker', 'No gloves') : L2('Med hansker', 'Gloves');
  // ---- the little renderer ----
  const VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uVP;uniform mat3 uR;varying vec3 vN;varying vec4 vC;void main(){vN=uR*aN;vC=aC;gl_Position=uVP*vec4(aP,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec4 vC;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);float h=max(dot(n,normalize(uL+vec3(0.0,0.0,1.0))),0.0);'
    + 'vec3 amb=mix(vec3(0.34,0.36,0.40),vec3(0.62,0.66,0.72),n.y*0.5+0.5);vec3 c=vC.rgb*(amb+vec3(1.0,0.96,0.90)*d*0.8)+vec3(1.0)*pow(h,22.0)*vC.a*0.22;gl_FragColor=vec4(pow(c,vec3(0.9)),1.0);}';
  // the new figure's vertex shader: the same light, the corners bent by their bones first (figpose.js figGL)
  const VS2 = nb => figGL(nb) + 'attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uVP;uniform mat3 uR;varying vec3 vN;varying vec4 vC;void main(){vN=uR*figN(aN);vC=aC;gl_Position=uVP*vec4(figP(aP),1.0);}';
  function initGL2(){
    N2.prog = null; N2.draws = []; if (!N2.on || !gl) return;
    // how many bones a draw call may carry here: all 58 need 174 vertex uniform vectors and the two matrices; WebGL 1 promises 128
    N2.maxV = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128; const m = /folk2pal=(\d+)/.exec(location.hash); N2.pal = m ? Math.max(12, Math.min(FIG_BONES, +m[1])) : figPalette(N2.maxV, 16);
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS2(N2.pal))); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    ['aP', 'aN', 'aC', 'aJ', 'aW'].forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)){ console.error('garderobe 3d, ny figur: ' + ((gl.getProgramInfoLog(p) || '').trim() || 'ingen logg fra driveren')); return; }
    N2.prog = p; N2.loc = {uVP:gl.getUniformLocation(p, 'uVP'), uR:gl.getUniformLocation(p, 'uR'), uL:gl.getUniformLocation(p, 'uL'), uB:gl.getUniformLocation(p, 'uB')};
  }
  function mesh2(){
    for (const d of N2.draws) for (const k of ['pb', 'nb', 'cb', 'jb', 'wb']) gl.deleteBuffer(d[k]);
    N2.draws = []; N2.tris = 0; if (!N2.prog) return;
    if (!glbHas('folk2')){ if (!N2.wait) N2.wait = setTimeout(() => { N2.wait = 0; if (root && gl){ mesh2(); redraw(); } }, 700); return; }   // (the file comes in the background behind the start: bootDataLate)
    const M = figMesh(st.look, {bare:!!st.bare2}); if (!M) return; N2.sex = M.sex; N2.tris = M.cnt / 3;
    const up = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW); return b; };
    for (const D of figDraws(M, N2.pal)) N2.draws.push({pb:up(D.p), nb:up(D.n), cb:up(D.c), jb:up(D.j), wb:up(D.w), cnt:D.cnt, bones:D.bones});
  }
  // the bones' matrices of the pose chosen, for the body the look has
  function pose2(){
    const sk = figSkelOf(N2.sex), P = figPoses(sk), X = glbLoad('folk2').ex; let q = P[st.pose2], L;
    if (st.pose2 === 'grep'){ L = figArms(sk, {}, 16, 48, 58); figGrip(X, N2.sex, 'grip', L, 'R'); figGrip(X, N2.sex, 'pinch', L, 'L'); q = {local:L, root:[0, 0, 0]}; }
    if (!q) q = P['stå'];
    return figPose(sk, q.local, q.root, {ground:true}).M;
  }
  function initGL(){
    try { gl = cv.getContext('webgl', {antialias:true, alpha:true, preserveDrawingBuffer:true}) || cv.getContext('experimental-webgl'); } catch (e){ gl = null; }
    if (!gl){ console.error('garderobe 3d: ingen WebGL'); return false; }   // (the error trap sends it: the wardrobe shows no figure then)
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){ console.error('garderobe 3d: ' + ((gl.getProgramInfoLog(prog) || '').trim() || (gl.isContextLost() ? 'konteksten er mistet' : 'ingen logg fra driveren'))); gl = null; return false; }
    buf = {p:gl.createBuffer(), n:gl.createBuffer(), c:gl.createBuffer(), cnt:0};
    initGL2();
    return true;
  }
  function mesh(){
    if (!gl || typeof VB !== 'function' || !glbHas('worker')) return;
    if (N2.on) mesh2();
    const B = VB(); figureVB(B, 0, 0, 0, false, null, st.look);
    const up = (b, a) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); };
    up(buf.p, B.p); up(buf.n, B.n); up(buf.c, B.c); buf.cnt = B.p.length / 3;
  }
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3]; return o; };
  function draw(){
    raf = 0; if (!root || !gl || !buf.cnt) return;
    const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    const asp = cv.width / Math.max(1, cv.height), face = st.zoom, fov = face ? 0.45 : 0.62, f = 1 / Math.tan(fov / 2);
    // with the new figure beside today's (#folk2) the two stand apart, and the camera backs off until both are in view, with room
    // for the names over the heads, and for the line of numbers and the five buttons under the feet
    const two = N2.on && N2.draws.length > 0, off = two ? (face ? 0.19 : 0.48) : 0, wide = two ? (face ? 0.84 : 2.1) : 0, dist = Math.max(face ? 1.15 : two ? 3.75 : 2.85, wide / (2 * Math.tan(fov / 2) * asp));
    const ty = face ? 1.56 : two ? 0.80 : 0.86;
    const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
    // the figure faces -z; the camera looks at it from +z; the yaw turns the figure about its up axis
    const R = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const Mv = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, -off, -ty, -dist, 1]);
    const P = new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, -(100 + 0.1) / (100 - 0.1), -1, 0, 0, -2 * 100 * 0.1 / (100 - 0.1), 0]);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uVP'), false, mul(P, Mv)); gl.uniformMatrix3fv(gl.getUniformLocation(prog, 'uR'), false, new Float32Array(R));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uL'), new Float32Array([0.35, 0.55, 0.75]));
    const at = (n, b, k) => { const a = gl.getAttribLocation(prog, n); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, k, gl.FLOAT, false, 0, 0); };
    at('aP', buf.p, 3); at('aN', buf.n, 3); at('aC', buf.c, 4);
    gl.drawArrays(gl.TRIANGLES, 0, buf.cnt);
    if (two) draw2(P, R, cy, sy, off, ty, dist);
  }
  // the new figure, to the right of today's: the same camera, turn and light; at the size the old one has on board (WK_S), so the two
  // are compared at one height. Timed with the driver made to finish (a pixel read back), for the line over the figures.
  function draw2(P, R, cy, sy, off, ty, dist){
    const s = WK_S, Mv = new Float32Array([cy * s, 0, -sy * s, 0, 0, s, 0, 0, sy * s, 0, cy * s, 0, off, -ty, -dist, 1]), u = N2.loc, M = pose2(), px = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now();          // (what was drawn before is done: the time is the new figure's)
    gl.useProgram(N2.prog); gl.uniformMatrix4fv(u.uVP, false, mul(P, Mv)); gl.uniformMatrix3fv(u.uR, false, new Float32Array(R)); gl.uniform3fv(u.uL, new Float32Array([0.35, 0.55, 0.75]));
    const at = (i, b, k, type, norm) => { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, k, type, norm, 0, 0); };
    for (const d of N2.draws){
      gl.uniform4fv(u.uB, figPal(M, d.bones));
      at(0, d.pb, 3, gl.FLOAT, false); at(1, d.nb, 3, gl.FLOAT, false); at(2, d.cb, 4, gl.FLOAT, false); at(3, d.jb, 4, gl.UNSIGNED_BYTE, false); at(4, d.wb, 4, gl.UNSIGNED_BYTE, true);
      gl.drawArrays(gl.TRIANGLES, 0, d.cnt);
    }
    gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); N2.ms = performance.now() - t0;
    const el = root.querySelector('.wd-n2i'); if (el) el.textContent = L2('Ny figur: ', 'New figure: ') + N2.tris + L2(' trekanter, ', ' triangles, ') + N2.draws.length + L2(' tegnekall, ', ' draw calls, ') + N2.pal + L2(' bein per kall (enheten har ', ' bones a call (the device has ')
      + N2.maxV + L2(' vektorer), ', ' vectors), ') + N2.ms.toFixed(1) + ' ms';
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  function render(keepView){
    if (!root) return;
    if (keepView){ root.querySelector('.wd-body').innerHTML = panel(); root.querySelectorAll('.wd-tab').forEach(b => b.classList.toggle('on', b.dataset.v === st.tab)); root.querySelector('.wd-vb button[data-wd=zoom]').textContent = st.zoom ? L2('Hele figuren', 'Whole figure') : L2('Ansiktet', 'The face');
      if (N2.on){ root.querySelector('.wd-vb button[data-wd=pose2]').textContent = pose2Txt(); root.querySelector('.wd-vb button[data-wd=bare2]').textContent = bare2Txt(); } }
    else root.innerHTML = html();
    if (!keepView){ cv = root.querySelector('.wd-cv'); if (initGL()){ bindCv(); } else root.querySelector('.wd-view').insertAdjacentHTML('beforeend', '<div class="wd-note">' + L2('3D støttes ikke her. Valgene virker likevel.', '3D is not supported here. The choices still work.') + '</div>'); }
    mesh(); redraw();
  }
  function bindCv(){
    let down = null;
    cv.addEventListener('pointerdown', e => { down = {x:e.clientX, y:st.yaw}; try { cv.setPointerCapture(e.pointerId); } catch (x){} });
    cv.addEventListener('pointermove', e => { if (down){ st.yaw = down.y + (e.clientX - down.x) * 0.012; redraw(); } });
    const up = () => { down = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    if (window.ResizeObserver){ ro = new ResizeObserver(redraw); ro.observe(cv); }
  }
  function set(k, v){
    const l = st.look;
    if (k === 'hk' || k === 'tk' || k === 'lg' || k === 'sc' || k === 'hc' || k === 's') l[k] = v === '-' ? null : +v; else l[k] = v;
    if (k === 'b' && v === 'f') l.bd = 'none';
    st.look = lookClean(l); render(true);
  }
  function randomLook(){
    const f = Math.random() < 0.5, L = lookFromSeed('r' + Math.random(), f ? 'f' : 'm', 25 + Math.floor(Math.random() * 40), 'sea'); return L;
  }
  function onClick(e){
    const b = e.target.closest('[data-wd]'); if (!b || !root) return; const a = b.dataset.wd;
    if (a === 'tab'){ st.tab = b.dataset.v; render(true); }
    else if (a === 'set') set(b.dataset.k, b.dataset.v);
    else if (a === 'sptop'){ const P = spOf('look', 'top'); if (P){ st.look.tp = P.data.tp; st.look.tk = +P.data.tk; st.look = lookClean(st.look); render(true); if (typeof cloudEv === 'function') cloudEv('sp_look', {pl:P.id}); } }
    else if (a === 'turn'){ st.yaw += 0.6 * +b.dataset.v; redraw(); }
    else if (a === 'zoom'){ st.zoom = st.zoom ? 0 : 1; render(true); }
    else if (a === 'pose2'){ const i = POSES2.findIndex(x => x[0] === st.pose2); st.pose2 = POSES2[(i + 1) % POSES2.length][0]; b.textContent = pose2Txt(); redraw(); }
    else if (a === 'bare2'){ st.bare2 = st.bare2 ? 0 : 1; render(true); }
    else if (a === 'rand'){ st.look = randomLook(); render(true); }
    else if (a === 'reset'){ st.look = lookDefault(); render(true); }
    else if (a === 'cancel') close();
    else if (a === 'done'){ S.look = lookClean(st.look); try { save(); } catch (x){} if (typeof cloudEv === 'function') cloudEv('look', {k:lookKey(S.look)}); close(); }
  }
  function open(){
    if (root) return; if (typeof closePhone === 'function') try { closePhone(); } catch (e){}
    N2.on = typeof FOLK2 !== 'undefined' && FOLK2;
    st = {look:lookClean(S.look || lookDefault()), tab:'hair', yaw:Math.PI - 0.45, zoom:0, pose2:'stå', bare2:0};      // the figure faces -z: turned half round it faces us
    root = document.createElement('div'); root.id = 'wardrobe'; root.className = 'wd'; document.body.appendChild(root);
    root.addEventListener('click', onClick); render(false);
  }
  function close(){ if (!root) return; if (raf) cancelAnimationFrame(raf); raf = 0; if (N2.wait){ clearTimeout(N2.wait); N2.wait = 0; } N2.draws = []; N2.prog = null; if (ro){ ro.disconnect(); ro = null; } if (gl){ try { gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch (e){} } gl = null; root.remove(); root = null; cv = null; }
  return {open, close, isOpen:() => !!root, look:() => st && st.look, setLook:l => { if (st){ st.look = lookClean(l); render(true); } },
    // (Folk 2, for the tests and the pictures: the new figure's numbers, and its pose and gloves set by name)
    folk2:() => N2.on ? {pal:N2.pal, maxV:N2.maxV, draws:N2.draws.length, tris:N2.tris, sex:N2.sex, ms:N2.ms, prog:!!N2.prog, pose:st && st.pose2, bare:st && st.bare2} : null,
    setFolk2:(pose, bare) => { if (st && N2.on){ if (pose) st.pose2 = pose; if (bare != null) st.bare2 = bare ? 1 : 0; render(true); } }};
})();
