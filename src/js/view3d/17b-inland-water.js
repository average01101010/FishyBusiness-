  // ---------- the fresh water: lakes, ponds, rivers, streams and waterfalls (G2 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // From the 'water' entry of the coast's vec packs (tools/map/water.py; older packs have none, and nothing is drawn there): the
  // standing water is flat at its level (the median of Kartverket's ground inside it, which has a lake's surface flat), a river's area
  // and the lines of the rivers and streams lie on the ground, a waterfall is a white fall of water where its point is. A mesh per tile,
  // built when the tile's ground (the view pack) is in, freed with the tile; the lines within WATER_R of the eye only, the streams being
  // a couple of metres wide. In winter the water under the snow line freezes and lies white under the snow.
  const WATER = new Map(), WATER_R = 3500, WATER_W = [2.4, 9, 3];   // the lines' widths: stream, river, canal
  const WATER_VS = 'attribute vec3 aPos;attribute vec3 aT;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vT;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vT=aT;gl_Position=uVP*w;}';
  // vT: x 0 standing water, 1 running; y the distance along a river (m); z how white (a steep reach, a fall)
  const WATER_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform vec3 uZen;uniform vec3 uHor;uniform float uT;uniform float uIce;uniform float uSnowY;uniform vec2 uWind;varying vec3 vW;varying vec3 vT;' + NOISE + AIR +
    'void main(){float d=length(vW);vec3 V=-vW/max(d,0.01);vec2 wq=mod(vW.xz+uEye.xy,4096.0);' +
    // the ripples: two noises drifting with the wind on the lakes, the flow along a river (its across-direction unknown here, so the
    // streaks run with the noise of the distance along it)
    'vec2 fl=vT.x>0.5?vec2(vT.y*0.25-uT*1.6,wq.x*0.05+wq.y*0.05):wq*0.35+uWind*uT*0.6;float r1=ns(fl)-0.5,r2=ns(fl*2.7+11.0+uT*0.3)-0.5;' +
    'float fade=1.0-smoothstep(150.0,1800.0,d);vec3 n=normalize(vec3((r1+0.5*r2)*0.18*fade,1.0,(r2-0.4*r1)*0.18*fade));' +
    'float fr=0.04+0.96*pow(1.0-max(dot(n,V),0.0),5.0);vec3 R=reflect(-V,n);vec3 sky=mix(uHor,uZen,clamp(R.y*1.6,0.0,1.0));' +
    // the water itself: peaty brown-black in a lake (Norwegian lakes are dark), a little greener in a river
    'vec3 deep=vT.x>0.5?vec3(0.08,0.11,0.1):vec3(0.06,0.085,0.09);vec3 c=mix(deep*(uAmb+uSunCol*0.35),sky,clamp(0.1+fr,0.0,1.0)*0.9);' +
    'float sp=pow(max(dot(R,uSun),0.0),180.0);c+=uSunCol*sp*2.0;' +
    'float wh=clamp(vT.z+smoothstep(0.62,0.8,ns(vec2(vT.y*0.35-uT*3.0,wq.y*0.3)))*vT.z*0.5,0.0,1.0);c=mix(c,vec3(0.86,0.9,0.92)*(uAmb+uSunCol*0.8),wh);' +
    // ice and snow on it in winter
    'float ice=uIce*smoothstep(uSnowY-80.0,uSnowY+40.0,vW.y+uEye.z);c=mix(c,vec3(0.9,0.92,0.95)*(uAmb+uSunCol*0.75)*(0.94+0.06*ns(wq*0.2)),ice*(1.0-step(0.5,vT.x)*0.3));' +
    'gl_FragColor=vec4(fin(c,vW),1.0);}';
  let PW = null;
  // the entry of a tile's vec pack, read on the main thread (a few thousand items); null when the pack has none
  function waterData(tx, ty){
    const pk = MAPD.man && MAPD.byTile.get('vec:' + tx + ':' + ty); if (!pk || !pk.buf) return undefined;
    const B = MAPD.man.tile / MAPD.man.block, e = pk.idx.get('water:' + tx * B + ':' + ty * B); if (!e) return null;
    const b = fflate.inflateSync(pk.buf.subarray(e[0], e[0] + e[1])); let p = 0;
    const vi = () => { let v = 0, s = 0, c; do { c = b[p++]; v += (c & 127) * Math.pow(2, s); s += 7; } while (c & 128); return v; }, zi = () => { const v = vi(); return v % 2 ? -(v + 1) / 2 : v / 2; };
    const na = vi(), nl = vi(), nf = vi(), areas = [], lines = [], falls = [];
    for (let a = 0; a < na; a++){
      const kind = vi(), level = zi() / 10, nv = vi(), v = new Float32Array(nv * 2); let x = 0, y = 0;
      for (let i = 0; i < nv; i++){ x += zi(); y += zi(); v[i * 2] = x; v[i * 2 + 1] = y; }
      const nt = vi(), ix = new Uint32Array(nt * 3); for (let i = 0; i < nt * 3; i++) ix[i] = vi();
      areas.push({kind, level, v, ix});
    }
    for (let l = 0; l < nl; l++){ const k = vi(), np = vi(), v = new Float32Array(np * 2); let x = 0, y = 0; for (let i = 0; i < np; i++){ x += zi(); y += zi(); v[i * 2] = x; v[i * 2 + 1] = y; } lines.push({k, v}); }
    for (let f = 0; f < nf; f++) falls.push([zi(), zi()]);
    return {areas, lines, falls};
  }
  function waterMesh(P, A){ const m = {pb:buf(new Float32Array(P)), tb:buf(new Float32Array(A)), n:P.length / 3}; return m; }
  // a tile's lakes and rivers' areas (one mesh), and its lines and falls near the eye (another, built again as the eye moves)
  function waterTile(tx, ty){
    const T = MAPD.man.tile * 1000, ox = tx * T, oz = ty * T, D = waterData(tx, ty); if (D === undefined) return undefined; if (!D) return null;
    const P = [], A = [];
    for (const a of D.areas){
      // standing water never above its shore: the level no higher than the lowest tenth of the ground at its outline (a pond of a
      // cell or two on a slope took the slope's median and lay as a dark plate over the bank, Bergen 28.10.2026)
      let lv = a.level;
      // a pond under 400 m2 is a few corners after the 4 m simplification, a dark plate rather than water (Bergen 28.10.2026): left out
      if (!a.kind){ let ar = 0; for (let i = 0; i < a.ix.length; i += 3){ const p = a.ix[i] * 2, q = a.ix[i + 1] * 2, r = a.ix[i + 2] * 2; ar += Math.abs((a.v[q] - a.v[p]) * (a.v[r + 1] - a.v[p + 1]) - (a.v[r] - a.v[p]) * (a.v[q + 1] - a.v[p + 1])) / 2; } if (ar < 400) continue; }
      if (!a.kind){ const hs = []; for (let j = 0; j < a.v.length; j += 2) hs.push(terrH(ox + a.v[j], oz + a.v[j + 1])); hs.sort((p, q) => p - q); lv = Math.min(lv, hs[Math.floor(hs.length * 0.1)] + 0.3); }
      if (!a.kind){ for (let i = 0; i < a.ix.length; i++){ const j = a.ix[i]; P.push(a.v[j * 2], lv, a.v[j * 2 + 1]); A.push(0, 0, 0); } continue; }
      // a river's area lies on the ground: its triangles split at the longest edge down to 12 m, each point on the ground, so a big
      // triangle on a slope does not cut through it (a dark wedge on an islet at Bergen, 28.10.2026)
      const put = (x, z) => { P.push(x, Math.max(terrH(ox + x, oz + z), 0.2) + 0.2, z); A.push(1, 0, 0); };
      const tri = (x0, z0, x1, z1, x2, z2, d) => {
        const l0 = (x1 - x0) ** 2 + (z1 - z0) ** 2, l1 = (x2 - x1) ** 2 + (z2 - z1) ** 2, l2 = (x0 - x2) ** 2 + (z0 - z2) ** 2, m = Math.max(l0, l1, l2);
        if (m <= 144 || d > 8){ put(x0, z0); put(x1, z1); put(x2, z2); return; }
        if (m === l0){ const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; tri(x0, z0, mx, mz, x2, z2, d + 1); tri(mx, mz, x1, z1, x2, z2, d + 1); }
        else if (m === l1){ const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2; tri(x0, z0, x1, z1, mx, mz, d + 1); tri(x0, z0, mx, mz, x2, z2, d + 1); }
        else { const mx = (x2 + x0) / 2, mz = (z2 + z0) / 2; tri(x0, z0, x1, z1, mx, mz, d + 1); tri(mx, mz, x1, z1, x2, z2, d + 1); }
      };
      for (let i = 0; i < a.ix.length; i += 3){ const p = a.ix[i] * 2, q = a.ix[i + 1] * 2, r = a.ix[i + 2] * 2; tri(a.v[p], a.v[p + 1], a.v[q], a.v[q + 1], a.v[r], a.v[r + 1], 0); }
    }
    return {tx, ty, o:[ox, oz], D, mesh:P.length ? Object.assign(waterMesh(P, A), {o:[ox, oz]}) : null, near:null, nearAt:null};
  }
  // the rivers, streams and falls of a tile within WATER_R of (ex, ez): ribbons on the ground a few metres apart, white where steep
  function waterNear(W, ex, ez){
    const P = [], A = [], [ox, oz] = W.o, R2 = WATER_R * WATER_R;
    for (const L of W.D.lines){
      const w = WATER_W[L.k] || 3, v = L.v; let along = 0;
      let near = false; for (let i = 0; i < v.length && !near; i += 2) near = (ox + v[i] - ex) ** 2 + (oz + v[i + 1] - ez) ** 2 < R2; if (!near) continue;
      for (let i = 2; i < v.length; i += 2){
        const ax = ox + v[i - 2], az = oz + v[i - 1], bx = ox + v[i], bz = oz + v[i + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
        const ux = (bx - ax) / len, uz = (bz - az) / len, px = -uz * w / 2, pz = ux * w / 2, n = Math.max(1, Math.ceil(len / 8));
        for (let q = 0; q < n; q++){
          const s0 = q / n, s1 = (q + 1) / n, x0 = ax + (bx - ax) * s0, z0 = az + (bz - az) * s0, x1 = ax + (bx - ax) * s1, z1 = az + (bz - az) * s1;
          const h0 = terrH(x0, z0), h1 = terrH(x1, z1), wh = clamp((Math.abs(h1 - h0) / (len / n) - 0.18) * 2.5, 0, 1) * (L.k === 1 ? 1 : 0.4), y0 = Math.max(h0, 0.15) + 0.25, y1 = Math.max(h1, 0.15) + 0.25, a0 = along + len * s0, a1 = along + len * s1;
          const c = [[x0 + px, y0, z0 + pz, a0], [x1 + px, y1, z1 + pz, a1], [x1 - px, y1, z1 - pz, a1], [x0 - px, y0, z0 - pz, a0]];
          for (const k of [0, 1, 2, 0, 2, 3]){ P.push(c[k][0] - ox, c[k][1], c[k][2] - oz); A.push(1, c[k][3], wh); }
        }
        along += len;
      }
    }
    // a fall: a white sheet down the steepest way from its point, as high as the ground falls within 25 m
    for (const [fx, fz] of W.D.falls){
      const x = ox + fx, z = oz + fz; if ((x - ex) ** 2 + (z - ez) ** 2 > R2) continue;
      let best = 0, bd = 0; const h = terrH(x, z); for (let k = 0; k < 8; k++){ const a = k * Math.PI / 4, dh = h - terrH(x + Math.cos(a) * 25, z + Math.sin(a) * 25); if (dh > best){ best = dh; bd = a; } }
      if (best < 2) continue;
      const dx = Math.cos(bd), dz = Math.sin(bd), qx = -dz * 3, qz = dx * 3, x1 = x + dx * 25, z1 = z + dz * 25, h1 = h - best;
      const c = [[x + qx, h + 0.3, z + qz], [x1 + qx, h1 + 0.3, z1 + qz], [x1 - qx, h1 + 0.3, z1 - qz], [x - qx, h + 0.3, z - qz]];
      for (const k of [0, 1, 2, 0, 2, 3]){ P.push(c[k][0] - ox, c[k][1], c[k][2] - oz); A.push(1, 0, 1); }
    }
    return P.length ? Object.assign(waterMesh(P, A), {o:[ox, oz]}) : null;
  }
  function freeWater(m){ if (m){ gl.deleteBuffer(m.pb); gl.deleteBuffer(m.tb); } }
  // kept up to date from the frame: the tiles within 14 km of the boat whose vec and view packs are in, a couple built a frame
  let waterT = 0;
  function updateWater(eye){
    if (!MAPD.man || !NEARM) return;
    const now = performance.now(); if (now - waterT < 500) return; waterT = now;
    const T = MAPD.man.tile * 1000, R = 14000, keep = new Set(); let built = 0;
    for (let ty = Math.floor((bv.z - R) / T); ty <= Math.floor((bv.z + R) / T); ty++) for (let tx = Math.floor((bv.x - R) / T); tx <= Math.floor((bv.x + R) / T); tx++){
      const k = tx + ':' + ty; keep.add(k); let W = WATER.get(k);
      if (W === undefined || W === false){
        const vp = MAPD.byTile.get('view:' + k); if (vp && !vp.buf) continue;
        if (built >= 2) continue; W = waterTile(tx, ty); if (W === undefined) continue; built++; WATER.set(k, W || null); if (!W) continue;
      }
      if (!W) continue;
      if (!W.nearAt || Math.hypot(W.nearAt[0] - eye[0], W.nearAt[1] - eye[2]) > WATER_R / 3){ freeWater(W.near); W.near = waterNear(W, eye[0], eye[2]); W.nearAt = [eye[0], eye[2]]; }
    }
    for (const [k, W] of WATER) if (!keep.has(k)){ if (W){ freeWater(W.mesh); freeWater(W.near); } WATER.delete(k); }
  }
  // a pack that came over a tile (its ground): its water is built again on the new heights
  function staleWater(pk){ const k = pk.tile[0] + ':' + pk.tile[1], W = WATER.get(k); if (W){ freeWater(W.mesh); freeWater(W.near); } WATER.delete(k); }
  const WATER0 = /water0/.test(location.hash);   // #water0 in the address: no fresh water drawn (for comparison)
  function drawWater(VP, eye){
    if (!WATER.size || WATER0) return;
    if (!PW){ try { PW = program(WATER_VS, WATER_FS, ['aPos', 'aT'], 'vann'); } catch (e){ console.warn('vann', e.message || e); PW = false; } }
    if (!PW) return;
    gl.useProgram(PW.p); const u = PW.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform1f(u.uT, (performance.now() / 1000) % 1000);
    const wd = env.windDir || [1, 0]; gl.uniform2fv(u.uWind, [wd[0] * 0.2, wd[1] * 0.2]);
    // ice: the water over the snow line (the snow that lies, core snowLineAt) freezes while it is cold; the shader weighs its own height
    gl.uniform1f(u.uIce, snowNow == null || env.temp == null ? 0 : sstep(2, -3, env.temp)); gl.uniform1f(u.uSnowY, snowNow == null ? 9999 : snowNow);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4);
    for (const W of WATER.values()){ if (!W) continue;
      for (const m of [W.mesh, W.near]){ if (!m) continue;
        gl.uniformMatrix4fv(u.uM, false, relM(m)); attr(0, m.pb, 3); attr(1, m.tb, 3); gl.drawArrays(gl.TRIANGLES, 0, m.n); }
    }
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.disableVertexAttribArray(1);
  }
