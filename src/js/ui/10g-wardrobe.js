// ===== Garderoben: the player changes how his figure looks (Jonas 10.10.2026) =====
// A full-screen sheet with the figure turning in a small WebGL view of its own (the same parts the game draws: vessel3d.js figureVB on a
// look, core/09i-look.js) and the choices below or beside it: body, skin, hair and hair colour, beard, hat, jacket, trousers, shoes, each with its
// colours. The look is kept in S.look, which the 3D view draws on deck and the crew sees (view3d.js refreshPeople). Touch first: big buttons,
// portrait and landscape. «Ferdig» keeps the look, «Avbryt» throws the changes away.
const WARD = (() => {
  let root = null, cv = null, gl = null, prog = null, buf = null, st = null, raf = 0, ro = null;
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
      case 'top': return sub(L2('Jakke og overdel', 'Jacket')) + '<div class="wd-chips">' + LOOK_TOP.map(h => chip(h[ix], l.tp === h[0], 'data-wd="set" data-k="tp" data-v="' + h[0] + '"')).join('') + '</div>' + sub(L2('Farge', 'Colour')) + colRow(LOOK_COL, LOOK_COL_N, l.tk, 'tk');
      case 'legs': return sub(L2('Buksefarge', 'Trouser colour')) + colRow(LOOK_COL, LOOK_COL_N, l.lg, 'lg');
      case 'shoe': return sub(L2('Sko og støvler', 'Shoes and boots')) + '<div class="wd-chips">' + LOOK_SHOE.map(h => chip(h[ix], l.sh === h[0], 'data-wd="set" data-k="sh" data-v="' + h[0] + '"')).join('') + '</div>'
        + sub(L2('Farge', 'Colour')) + '<div class="wd-sws">' + LOOK_SHOE_COLS.map(i => swatch(LOOK_COL[i], l.sc === i, 'data-wd="set" data-k="sc" data-v="' + i + '"', LOOK_COL_N[i][S.lang === 'no' ? 0 : 1])).join('') + '</div>';
    }
    return '';
  }
  function html(){
    return '<div class="wd-view"><canvas class="wd-cv"></canvas><div class="wd-vb">'
      + '<button data-wd="turn" data-v="-1" aria-label="' + L2('Drei til venstre', 'Turn left') + '">⟲</button><button data-wd="zoom">' + (st.zoom ? L2('Hele figuren', 'Whole figure') : L2('Ansiktet', 'The face')) + '</button><button data-wd="turn" data-v="1" aria-label="' + L2('Drei til høyre', 'Turn right') + '">⟳</button></div></div>'
      + '<div class="wd-side"><div class="wd-top"><b>' + L2('Garderoben', 'Wardrobe') + '</b><span class="wd-sp"></span><button class="wd-x" data-wd="cancel">' + L2('Avbryt', 'Cancel') + '</button><button class="wd-ok" data-wd="done">' + L2('Ferdig', 'Done') + '</button></div>'
      + '<div class="wd-tabs">' + TABS.map(t => '<button class="wd-tab' + (st.tab === t[0] ? ' on' : '') + '" data-wd="tab" data-v="' + t[0] + '">' + t[S.lang === 'no' ? 1 : 2] + '</button>').join('') + '</div>'
      + '<div class="wd-body">' + panel() + '</div>'
      + '<div class="wd-foot"><button data-wd="rand">' + L2('Tilfeldig', 'Random') + '</button><button data-wd="reset">' + L2('Tilbake til start', 'Back to start') + '</button></div></div>';
  }
  // ---- the little renderer ----
  const VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;uniform mat4 uVP;uniform mat3 uR;varying vec3 vN;varying vec4 vC;void main(){vN=uR*aN;vC=aC;gl_Position=uVP*vec4(aP,1.0);}';
  const FS = 'precision mediump float;varying vec3 vN;varying vec4 vC;uniform vec3 uL;void main(){vec3 n=normalize(vN);float d=max(dot(n,uL),0.0);float h=max(dot(n,normalize(uL+vec3(0.0,0.0,1.0))),0.0);'
    + 'vec3 amb=mix(vec3(0.34,0.36,0.40),vec3(0.62,0.66,0.72),n.y*0.5+0.5);vec3 c=vC.rgb*(amb+vec3(1.0,0.96,0.90)*d*0.8)+vec3(1.0)*pow(h,22.0)*vC.a*0.22;gl_FragColor=vec4(pow(c,vec3(0.9)),1.0);}';
  function initGL(){
    try { gl = cv.getContext('webgl', {antialias:true, alpha:true, preserveDrawingBuffer:true}) || cv.getContext('experimental-webgl'); } catch (e){ gl = null; }
    if (!gl) return false;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)){ gl = null; return false; }
    buf = {p:gl.createBuffer(), n:gl.createBuffer(), c:gl.createBuffer(), cnt:0};
    return true;
  }
  function mesh(){
    if (!gl || typeof VB !== 'function' || !glbHas('worker')) return;
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
    const asp = cv.width / Math.max(1, cv.height), face = st.zoom, fov = face ? 0.45 : 0.62, dist = face ? 1.15 : 2.85, ty = face ? 1.56 : 0.86, f = 1 / Math.tan(fov / 2);
    const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
    // the figure faces -z; the camera looks at it from +z; the yaw turns the figure about its up axis
    const R = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    const Mv = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, -ty, -dist, 1]);
    const P = new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, -(100 + 0.1) / (100 - 0.1), -1, 0, 0, -2 * 100 * 0.1 / (100 - 0.1), 0]);
    gl.useProgram(prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uVP'), false, mul(P, Mv)); gl.uniformMatrix3fv(gl.getUniformLocation(prog, 'uR'), false, new Float32Array(R));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uL'), new Float32Array([0.35, 0.55, 0.75]));
    const at = (n, b, k) => { const a = gl.getAttribLocation(prog, n); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, k, gl.FLOAT, false, 0, 0); };
    at('aP', buf.p, 3); at('aN', buf.n, 3); at('aC', buf.c, 4);
    gl.drawArrays(gl.TRIANGLES, 0, buf.cnt);
  }
  const redraw = () => { if (!raf) raf = requestAnimationFrame(draw); };
  function render(keepView){
    if (!root) return;
    if (keepView){ root.querySelector('.wd-body').innerHTML = panel(); root.querySelectorAll('.wd-tab').forEach(b => b.classList.toggle('on', b.dataset.v === st.tab)); root.querySelector('.wd-vb button[data-wd=zoom]').textContent = st.zoom ? L2('Hele figuren', 'Whole figure') : L2('Ansiktet', 'The face'); }
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
    else if (a === 'turn'){ st.yaw += 0.6 * +b.dataset.v; redraw(); }
    else if (a === 'zoom'){ st.zoom = st.zoom ? 0 : 1; render(true); }
    else if (a === 'rand'){ st.look = randomLook(); render(true); }
    else if (a === 'reset'){ st.look = lookDefault(); render(true); }
    else if (a === 'cancel') close();
    else if (a === 'done'){ S.look = lookClean(st.look); try { save(); } catch (x){} if (typeof cloudEv === 'function') cloudEv('look', {k:lookKey(S.look)}); close(); }
  }
  function open(){
    if (root) return; if (typeof closePhone === 'function') try { closePhone(); } catch (e){}
    st = {look:lookClean(S.look || lookDefault()), tab:'hair', yaw:Math.PI - 0.45, zoom:0};      // the figure faces -z: turned half round it faces us
    root = document.createElement('div'); root.id = 'wardrobe'; root.className = 'wd'; document.body.appendChild(root);
    root.addEventListener('click', onClick); render(false);
  }
  function close(){ if (!root) return; if (raf) cancelAnimationFrame(raf); raf = 0; if (ro){ ro.disconnect(); ro = null; } if (gl){ try { gl.getExtension('WEBGL_lose_context') && gl.getExtension('WEBGL_lose_context').loseContext(); } catch (e){} } gl = null; root.remove(); root = null; cv = null; }
  return {open, close, isOpen:() => !!root, look:() => st && st.look, setLook:l => { if (st){ st.look = lookClean(l); render(true); } }};
})();
