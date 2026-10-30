  // ---------- the near field on land (G8 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // Within NEAR_R[QUAL.lvl] m of the eye (45, 70 and 100 m on Middels, Høy and Ultra; 29.10.2026 60, 90 and 120 m cost a third of a
  // frame more in SwiftShader at Finnsnes' harbour) the ground gets its small things as instances of the Blender models (tools/wild/naer.py,
  // src/data/naer.b64): tufts of grass on the grass and the fields, heather on the heath, the fell and the bog, boulders in the scree and a
  // few on the bare rock, pebbles on the shingle and the sand, and rockweed lying on the foreshore under the high water. Where they go is
  // the land cover (the 'cover' layer) and the ground's own height and slope, cell by cell (NEAR_C m), decided by the cell's hash, so it
  // is the same for everyone; nothing on the roads, the buildings, the harbour units, the sites or under the snow (the stones stay). Built
  // in 32 m squares, three a frame, the nearest first, and all drawn in one instanced call per model; the grass and the heather take the
  // season's colour, everything the wet. Off on «Lav»; #near0 in the address: off.
  const NEAR = {on:!/near0/.test(location.hash), M:null, P:null, sq:new Map(), dirty:true, bufs:null, n:0, ms:0};
  const NEAR_K = ['gress', 'lyng', 'stein0', 'stein1', 'stein2', 'tang'], NEAR_R = [0, 45, 70, 100], NEAR_C = [3, 3.5, 3, 2.5], NEAR_SQ = 32;
  function nearModels(){
    if (NEAR.M !== null) return NEAR.M;
    NEAR.M = false; if (typeof glbHas !== 'function' || !glbHas('naer')) return false;
    const M = {};
    for (const k of NEAR_K){ const q = glbPart('naer', k); if (!q) return NEAR.M = false;
      const n = q.p.length / 3, a = new Float32Array(n * 10);
      for (let i = 0; i < n; i++) a.set([q.p[i * 3], q.p[i * 3 + 1], q.p[i * 3 + 2], q.n[i * 3], q.n[i * 3 + 1], q.n[i * 3 + 2], q.c[i * 4], q.c[i * 4 + 1], q.c[i * 4 + 2], q.zone ? q.zone[i] || 0 : 0], i * 10);
      M[k] = {b:buf(a), n}; }
    return NEAR.M = M;
  }
  const NEAR_VS = 'precision highp float;attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;attribute vec4 aI;attribute vec2 aJ;uniform mat4 uVP;uniform vec3 uO;uniform vec3 uTint;uniform float uT;' +
    'varying vec3 vW;varying vec3 vN;varying vec3 vC;varying float vZ;' +
    'void main(){float c=cos(aJ.x),s=sin(aJ.x);vec3 p=aP*aI.w;p=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);vec3 n=vec3(c*aN.x-s*aN.z,aN.y,s*aN.x+c*aN.z);' +
    // the grass's blades sway a little in the wind, the more the higher up the blade
    'float z=aC.w;if(z>0.5){p.x+=sin(uT*1.7+aI.x*0.7+aI.z*0.3)*0.06*aP.y*aI.w;}' +
    'vC=(z>0.5?aC.rgb*uTint:aC.rgb)*aJ.y;vZ=z;vN=n;vW=p+aI.xyz+uO;gl_Position=uVP*vec4(vW,1.0);}';
  const NEAR_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform float uWet;varying vec3 vW;varying vec3 vN;varying vec3 vC;varying float vZ;' + NOISE + AIR +
    'void main(){vec3 n=normalize(vN);float d=dot(n,uSun);float wl=vZ>0.5?clamp((d+0.4)/1.4,0.0,1.0):max(d,0.0);vec3 c=vC*(1.0-0.28*uWet*(vZ>0.5?0.4:1.0));' +
    'vec3 V=normalize(-vW);vec3 col=c*(uAmb*(0.75+0.25*n.y)+uSunCol*wl)+uSunCol*pow(max(dot(reflect(-uSun,n),V),0.0),40.0)*uWet*0.35*(vZ>0.5?0.2:1.0);' +
    'gl_FragColor=vec4(fin(col,vW),1.0);}';
  // one 32 m square's instances per model (x, y, z from the square's origin, scale; turn, tint)
  function nearSquare(i, j){
    const C = NEAR_C[QUAL.lvl], x0 = i * NEAR_SQ, z0 = j * NEAR_SQ, out = NEAR_K.map(() => []), sn = snowNow == null ? 3000 : snowNow;
    // the roads through the square (nothing on them) and the buildings (the trees' occupancy of the kilometre, 25 m cells, when it is in)
    const rd = roadsIn(x0 - 6, z0 - 6, x0 + NEAR_SQ + 6, z0 + NEAR_SQ + 6), ch = CH.get(gridKey(Math.floor(x0 / 1000), Math.floor(z0 / 1000))), occ = ch && ch.trq ? ch.trq.occ : null;
    const onRoad = (x, z) => { for (const r of rd){ const xs = r.xs, zs = r.zs; for (let k = 1; k < xs.length; k++){ const ax = xs[k - 1], az = zs[k - 1], bx = xs[k] - ax, bz = zs[k] - az, L2 = bx * bx + bz * bz || 1, u = clamp(((x - ax) * bx + (z - az) * bz) / L2, 0, 1); if (Math.hypot(ax + bx * u - x, az + bz * u - z) < 4.5) return true; } } return false; };
    const n = Math.round(NEAR_SQ / C);
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++){
      const h = hash((i * n + a) * 7919 + (j * n + b) * 104729 + 71), x = x0 + (a + 0.15 + 0.7 * hash(h * 1e4)) * C, z = z0 + (b + 0.15 + 0.7 * hash(h * 2e4)) * C;
      const y = terrH(x, z), cl = lifeCls(x, z); let k = -1, sc = 1;
      if (y > -0.4 && y < 1.1){ if ((cl === 0 || cl === 7 || cl === 12) && h < 0.3){ k = 5; sc = 0.7 + 0.5 * hash(h * 3e4); } }
      else if (y >= 1.6){
        const sl = Math.hypot(terrH(x + 1.5, z) - terrH(x - 1.5, z), terrH(x, z + 1.5) - terrH(x, z - 1.5)) / 3, snow = y > sn;
        if (cl === 11){ if (h < 0.5){ k = 2 + Math.floor(hash(h * 4e4) * 3); sc = 0.5 + 1.4 * hash(h * 5e4) ** 1.5; } }
        else if (cl === 12 || cl === 10){ if (h < 0.15){ k = 2 + Math.floor(hash(h * 4e4) * 3); sc = 0.18 + 0.25 * hash(h * 5e4); } }
        else if (cl === 7){ if (h < 0.06){ k = 2 + Math.floor(hash(h * 4e4) * 3); sc = 0.4 + 1.0 * hash(h * 5e4); } }
        else if (!snow && sl < 0.8){
          const g = cl === 3 || cl === 4 ? 0.55 : cl === 1 ? 0.15 : cl === 2 || cl === 6 || cl === 5 ? 0.15 : 0, l = cl === 2 || cl === 6 ? 0.35 : cl === 5 ? 0.25 : cl === 1 ? 0.12 : 0;
          if (h < g){ k = 0; sc = 0.22 + 0.25 * hash(h * 3e4); } else if (h < g + l){ k = 1; sc = 0.35 + 0.35 * hash(h * 3e4); }
        }
        if (k >= 0 && sl > 1.2 && k !== 2 && k !== 3 && k !== 4) k = -1;
      }
      if (k < 0 || cl === 9 || cl === 8 && k < 2) continue;
      if (occ && occ[Math.floor((z - Math.floor(z0 / 1000) * 1000) / 25) * 40 + Math.floor((x - Math.floor(x0 / 1000) * 1000) / 25)]) continue;
      if (onUnit(x, z, 6) || onSite(x, z) || onRoad(x, z)) continue;
      out[k].push(x - x0, y - (k >= 2 && k <= 4 ? 0.25 * sc : 0.02), z - z0, sc, hash(h * 6e4) * 6.2832, 0.82 + 0.36 * hash(h * 7e4));
    }
    return {o:[x0, z0], a:out, lvl:QUAL.lvl};
  }
  function drawNear(VP, eye, t){ const t0 = performance.now(); drawNear0(VP, eye, t); NEAR.ms = NEAR.ms * 0.9 + (performance.now() - t0) * 0.1; }
  function drawNear0(VP, eye, t){
    if (!NEAR.on || QUAL.lvl === 0 || !treeExt() || !nearModels()) return;
    if (!NEAR.P){ try { NEAR.P = program(NEAR_VS, NEAR_FS, ['aP', 'aN', 'aC', 'aI', 'aJ'], 'naer'); } catch (e){ console.warn('naer', e.message || e); NEAR.on = false; return; } }
    const R = NEAR_R[QUAL.lvl], i0 = Math.floor((eye[0] - R) / NEAR_SQ), i1 = Math.floor((eye[0] + R) / NEAR_SQ), j0 = Math.floor((eye[2] - R) / NEAR_SQ), j1 = Math.floor((eye[2] + R) / NEAR_SQ);
    // too high above the ground to see them: nothing
    if (eye[1] - Math.max(0, terrH(eye[0], eye[2])) > R * 1.5) return;
    // the squares in reach: drop the far ones, build the nearest three missing
    const want = [];
    for (const [k, q] of NEAR.sq){ const [x0, z0] = q.o; if (x0 + NEAR_SQ < eye[0] - R - 40 || x0 > eye[0] + R + 40 || z0 + NEAR_SQ < eye[2] - R - 40 || z0 > eye[2] + R + 40 || q.lvl !== QUAL.lvl){ NEAR.sq.delete(k); NEAR.dirty = true; } }
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const k = i * 65536 + j; if (NEAR.sq.has(k)) continue; const d = Math.hypot((i + 0.5) * NEAR_SQ - eye[0], (j + 0.5) * NEAR_SQ - eye[2]); if (d < R + 24) want.push([d, i, j, k]); }
    want.sort((a, b) => a[0] - b[0]);
    for (let q = 0; q < Math.min(3, want.length); q++){ const [, i, j, k] = want[q]; NEAR.sq.set(k, nearSquare(i, j)); NEAR.dirty = true; }
    // all the squares' instances in one buffer per model, from the eye's origin when it was made
    if (NEAR.dirty){ NEAR.dirty = false; NEAR.O = [Math.round(eye[0]), Math.round(eye[2])]; if (NEAR.bufs) for (const b of NEAR.bufs) if (b) gl.deleteBuffer(b.b);
      NEAR.bufs = NEAR_K.map((_, m) => { let len = 0; for (const q of NEAR.sq.values()) len += q.a[m].length; if (!len) return null; const A = new Float32Array(len); let o = 0;
        for (const q of NEAR.sq.values()){ const s = q.a[m], dx = q.o[0] - NEAR.O[0], dz = q.o[1] - NEAR.O[1]; for (let p = 0; p < s.length; p += 6){ A[o] = s[p] + dx; A[o + 1] = s[p + 1]; A[o + 2] = s[p + 2] + dz; A[o + 3] = s[p + 3]; A[o + 4] = s[p + 4]; A[o + 5] = s[p + 5]; o += 6; } }
        return {b:buf(A), n:len / 6}; }); }
    const st = typeof seasonAt === 'function' ? seasonAt(S.t / 60) : {grass:1}, gr = clamp(st.grass == null ? 1 : st.grass, 0, 1), mo = gDate(S.t / 60).getUTCMonth();
    const tints = [mix3([1.35, 1.15, 0.62], [1, 1, 1], gr), mo === 7 || mo === 8 ? [1.35, 0.9, 1.2] : [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
    const P = NEAR.P, u = P.u, X = TREE.ext; gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform1f(u.uWet, WETON ? env.wet || 0 : 0); gl.uniform1f(u.uT, t % 3600); gl.uniform3f(u.uO, NEAR.O[0] - eye[0], -eye[1], NEAR.O[1] - eye[2]);
    let n = 0;
    for (let m = 0; m < NEAR_K.length; m++){ const t2 = NEAR.bufs[m]; if (!t2) continue; const M = NEAR.M[NEAR_K[m]]; gl.uniform3fv(u.uTint, tints[m]);
      gl.bindBuffer(gl.ARRAY_BUFFER, M.b); for (const [a, sz, off] of [[0, 3, 0], [1, 3, 12], [2, 4, 24]]){ gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, 40, off); X.vertexAttribDivisorANGLE(a, 0); }
      gl.bindBuffer(gl.ARRAY_BUFFER, t2.b); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 24, 0); X.vertexAttribDivisorANGLE(3, 1); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 24, 16); X.vertexAttribDivisorANGLE(4, 1);
      X.drawArraysInstancedANGLE(gl.TRIANGLES, 0, M.n, t2.n); n += t2.n; }
    X.vertexAttribDivisorANGLE(3, 0); X.vertexAttribDivisorANGLE(4, 0); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
    NEAR.n = n;
  }
