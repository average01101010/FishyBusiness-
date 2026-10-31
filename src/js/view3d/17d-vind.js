  // ---------- the wind turbines and the power lines over the sea (G7 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // The turbines (src/data/vind.json t, tools/vind/vind.py: OpenStreetMap's, with their hub and rotor) within 14 km are instances of
  // the Blender turbine (src/data/vind.b64, tools/vind/models.py): the tower scaled by the hub, the nacelle and the blades by the
  // rotor, all turned into the wind where the boat is, the blades turning as real ones do (the tip at eight times the wind from 3 m/s
  // up to 80 m/s, still above 25 m/s, when they are feathered), with the obstacle light on the nacelle at night (red; flashing on the
  // ones over 150 m to the tip). The spans (vind.json s) within 4 km get a mast at each end (a steel portal for 66 kV and up, a
  // wooden H-pole under) and three wires hanging between them, never under 30 m over the sea at the middle. One instanced call per
  // part. #vind0 in the address: none of it.
  const VD = {on:!/vind0/.test(location.hash), P:null, LP:null, M:null, ib:null, nT:0, nM:0, at:-1e9, ang:0, ys:new Map(), wires:null, nW:0, lit:[]};
  const VD_R = 14000, VD_RS = 4000, VD_CLEAR = 30;
  function vindModels(){
    if (VD.M !== null) return VD.M;
    VD.M = false; const M = {};
    for (const k of ['tower', 'nacelle', 'blades', 'portal', 'hpole']){
      const q = glbPart('vind', k); if (!q) return VD.M = false;
      const n = q.p.length / 3, a = new Float32Array(n * 9);
      for (let i = 0; i < n; i++) a.set([q.p[i * 3], q.p[i * 3 + 1], q.p[i * 3 + 2], q.n[i * 3], q.n[i * 3 + 1], q.n[i * 3 + 2], q.c[i * 4], q.c[i * 4 + 1], q.c[i * 4 + 2]], i * 9);
      M[k] = {b:buf(a), n};
    }
    return VD.M = M;
  }
  // uMode 0 the tower (scaled by the hub, aI.w), 1 the nacelle and 2 the blades (scaled by the rotor, aJ.z, at the hub's height; the
  // blades spun by aJ.y + uSpin / radius), 3 a mast (aI.w high, aJ.z wide); all turned by aJ.x (and the wind's uYaw for a turbine)
  const VD_VS = 'precision highp float;attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;attribute vec4 aI;attribute vec4 aJ;uniform mat4 uVP;uniform vec3 uO;uniform float uMode;uniform float uYaw;uniform float uSpin;' +
    'varying vec3 vW;varying vec3 vN;varying vec3 vC;' +
    'void main(){vec3 p=aP;vec3 n=aN;float yaw=aJ.x+(uMode<2.5?uYaw:0.0);' +
    'if(uMode<0.5)p*=aI.w;else if(uMode<2.5){if(uMode>1.5){float a=aJ.y+uSpin/(0.5*aJ.z);float c=cos(a),s=sin(a);p=vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);n=vec3(c*n.x-s*n.y,s*n.x+c*n.y,n.z);}p*=aJ.z;p.y+=aI.w;}' +
    'else p*=vec3(aJ.z,aI.w,aJ.z);' +
    'float c=cos(yaw),s=sin(yaw);p=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);n=vec3(c*n.x-s*n.z,n.y,s*n.x+c*n.z);' +
    'vC=aC;vN=n;vW=p+aI.xyz+uO;gl_Position=uVP*vec4(vW,1.0);}';
  const VD_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;varying vec3 vW;varying vec3 vN;varying vec3 vC;' + NOISE + AIR +
    'void main(){vec3 n=normalize(vN);float d=max(dot(n,uSun),0.0);vec3 v=normalize(-vW);vec3 h=normalize(uSun+v);float sp=pow(max(dot(n,h),0.0),24.0)*0.25*d;' +
    'vec3 c=vC*(uAmb*(0.7+0.3*n.y)+uSunCol*d)+uSunCol*sp;gl_FragColor=vec4(fin(c,vW),1.0);}';
  const VD_LVS = 'precision highp float;attribute vec3 aP;uniform mat4 uVP;uniform vec3 uO;varying vec3 vW;void main(){vW=aP+uO;gl_Position=uVP*vec4(vW,1.0);}';
  const VD_LFS = 'precision highp float;uniform vec3 uCol;uniform vec3 uFog;uniform float uFogD;varying vec3 vW;' + NOISE + AIR + 'void main(){gl_FragColor=vec4(fin(uCol,vW),1.0);}';
  // the ground under a turbine or a mast, kept a while (the ground's blocks come in as the boat goes; looked at again every 20 s)
  function vdGround(x, z, now){
    const k = x * 4096 + z, q = VD.ys.get(k); if (q && now - q.t < 20) return q.y;
    const y = terrH(x, z); VD.ys.set(k, {y, t:now}); return y;
  }
  // a span's masts: the portal 22 m (32 m at 200 kV and up), the pole 11 m, both raised so the wires' lowest point is VD_CLEAR over the
  // sea; the sag is 3 % of the span (at least 1 %, less when the masts are low)
  function vdSpan(s, now){
    const [x1, z1, x2, z2, kv] = s, L = Math.hypot(x2 - x1, z2 - z1), big = kv >= 60, H0 = big ? (kv >= 200 ? 32 : 22) : 11;
    const g1 = Math.max(0, vdGround(x1, z1, now)), g2 = Math.max(0, vdGround(x2, z2, now));
    const yw = big ? 0.9 : 0.95, top = Math.min(g1, g2) + H0 * yw, sag = clamp(top - VD_CLEAR, 0.01 * L, 0.03 * L), lift = Math.max(0, VD_CLEAR + sag - top) / yw;
    return {L, big, H1:H0 + lift, H2:H0 + lift, g1, g2, sag, yaw:Math.atan2(x2 - x1, -(z2 - z1)), W:big ? Math.min(H0, 32) : 11, yw};
  }
  // the instances near the eye, rebuilt twice a second: turbines (x, y, z, hub; yaw, phase, rotor, 0), masts (x, y, z, height; yaw, 0, width, 0)
  // and the wires as line segments from the eye's origin O
  function vdBuild(eye, now){
    VD.at = now; VD.O = [eye[0], eye[2]];
    const T = [], Mp = [], Mh = [], W = [], lit = []; VD.wetT = VD.wetM = 0;
    for (const t of VIND.t){ const dx = t[0] - eye[0], dz = t[1] - eye[2]; if (Math.abs(dx) > VD_R || Math.abs(dz) > VD_R || dx * dx + dz * dz > VD_R * VD_R) continue;
      const y0 = vdGround(t[0], t[1], now), y = Math.max(0, y0), h = hash(t[0] * 7.1 + t[1] * 3.3);   // (one in the sea stands from its surface)
      if (y0 < 0) VD.wetT++; T.push(dx, y, dz, t[2], (h - 0.5) * 0.12, h * 6.283, t[3], 0); lit.push([dx, y + t[2] + 0.034 * t[3], dz, t[2] + t[3] / 2 > 150]); }
    for (const s of VIND.s){ const mx = (s[0] + s[2]) / 2 - eye[0], mz = (s[1] + s[3]) / 2 - eye[2]; if (Math.abs(mx) > VD_RS + 2500 || Math.abs(mz) > VD_RS + 2500) continue;
      const S = vdSpan(s, now), A = S.big ? Mp : Mh; if (vdGround(s[0], s[1], now) < 0) VD.wetM++; if (vdGround(s[2], s[3], now) < 0) VD.wetM++;
      A.push(s[0] - eye[0], S.g1, s[1] - eye[2], S.H1, S.yaw, 0, S.W, 0, s[2] - eye[0], S.g2, s[3] - eye[2], S.H2, S.yaw, 0, S.W, 0);
      // the three wires from the cross-arms' insulators (portal: x -0.38, 0, 0.38 at y 0.9; pole: -0.2, 0, 0.2 at 0.95, both x the width)
      const ux = Math.cos(S.yaw), uz = Math.sin(S.yaw), ph = S.big ? [-0.38, 0, 0.38] : [-0.2, 0, 0.2], N = Math.max(8, Math.min(40, Math.round(S.L / 40)));
      for (const o of ph){ const ax = s[0] - eye[0] + ux * o * S.W, az = s[1] - eye[2] + uz * o * S.W, bx = s[2] - eye[0] + ux * o * S.W, bz = s[3] - eye[2] + uz * o * S.W, ay = S.g1 + S.H1 * S.yw, by = S.g2 + S.H2 * S.yw;
        for (let k = 0; k < N; k++){ for (const f of [k / N, (k + 1) / N]) W.push(ax + (bx - ax) * f, ay + (by - ay) * f - 4 * S.sag * f * (1 - f), az + (bz - az) * f); } }
    }
    const up = (old, a) => { if (old) gl.deleteBuffer(old); return a.length ? buf(new Float32Array(a)) : null; };
    VD.tb = up(VD.tb, T); VD.nT = T.length / 8; VD.pb = up(VD.pb, Mp); VD.nP = Mp.length / 8; VD.hb = up(VD.hb, Mh); VD.nH = Mh.length / 8; VD.wb = up(VD.wb, W); VD.nW = W.length / 3; VD.lit = lit;
    if (VD.ys.size > 6000) VD.ys.clear();
  }
  // the blades' tip speed in this wind (m/s): eight times the wind from cut-in at 3 m/s to the rated 80 m/s, nothing over 25 m/s
  const vdTip = w => w < 3 || w > 25 ? 0 : Math.min(80, 8 * w);
  function drawVind(VP, eye, dt, far){
    if (!VD.on || !VIND || !treeExt() || !vindModels()) return;
    const now = performance.now() / 1000;
    if (!far){ if (now - VD.at > 0.5 || Math.hypot(eye[0] - VD.O[0], eye[2] - VD.O[1]) > 300) vdBuild(eye, now); }
    else if (VD.at < 0) vdBuild(eye, now);
    if (!VD.P){ try { VD.P = program(VD_VS, VD_FS, ['aP', 'aN', 'aC', 'aI', 'aJ'], 'vind'); VD.LP = program(VD_LVS, VD_LFS, ['aP'], 'vindl'); } catch (e){ console.warn('vind', e.message || e); VD.on = false; return; } }
    const p = {x:eye[0] / 1000, y:eye[2] / 1000}, w = env.wind != null ? env.wind : windAt(S.t / 60, p), wd = (windDir(S.t / 60, p) - gridGamma(p) + 180) * DEG;
    if (!far) VD.ang += vdTip(w) * Math.min(dt || 0, 0.1);
    const X = TREE.ext, P = VD.P, u = P.u, O = [VD.O[0] - eye[0], -eye[1], VD.O[1] - eye[2]];
    gl.useProgram(P.p); gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uO, O); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform1f(u.uYaw, wd); gl.uniform1f(u.uSpin, VD.ang % 1e5);
    const one = (m, ib, n, mode) => { if (!ib || !n) return; gl.uniform1f(u.uMode, mode);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.b); for (const [a, sz, off] of [[0, 3, 0], [1, 3, 12], [2, 3, 24]]){ gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, 36, off); X.vertexAttribDivisorANGLE(a, 0); }
      gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, 0); X.vertexAttribDivisorANGLE(3, 1); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, 16); X.vertexAttribDivisorANGLE(4, 1);
      X.drawArraysInstancedANGLE(gl.TRIANGLES, 0, m.n, n); };
    one(VD.M.tower, VD.tb, VD.nT, 0); one(VD.M.nacelle, VD.tb, VD.nT, 1); one(VD.M.blades, VD.tb, VD.nT, 2);
    one(VD.M.portal, VD.pb, VD.nP, 3); one(VD.M.hpole, VD.hb, VD.nH, 3);
    X.vertexAttribDivisorANGLE(3, 0); X.vertexAttribDivisorANGLE(4, 0); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
    if (VD.wb && VD.nW){ const L = VD.LP; gl.useProgram(L.p); gl.uniformMatrix4fv(L.u.uVP, false, VP); gl.uniform3fv(L.u.uO, O); gl.uniform3fv(L.u.uFog, env.fog); gl.uniform1f(L.u.uFogD, env.fogD); airSet(L.u);
      gl.uniform3fv(L.u.uCol, [0.16, 0.17, 0.18].map((v, i) => v + env.amb[i] * 0.25)); gl.disableVertexAttribArray(1); attr(0, VD.wb, 3); gl.drawArrays(gl.LINES, 0, VD.nW); }
    // the obstacle lights at night: fixed red, the tall ones flashing together (a second in two)
    if (env.night > 0.05 && VD.lit.length){ let n = 0; const fl = (now % 2) < 1;
      for (const q of VD.lit){ if (q[3] && !fl) continue; if (n >= 4000) break; PB[n * 3] = q[0] + O[0]; PB[n * 3 + 1] = q[1] + O[1]; PB[n * 3 + 2] = q[2] + O[2]; PA[n] = Math.min(1, env.night * 1.2); n++; }
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawPts(n, gl.POINTS, VP, LCOL.r, far ? 6000 : 3800, true); gl.depthMask(true); gl.disable(gl.BLEND); }
  }
