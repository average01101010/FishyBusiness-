  // ---------- the trees (G4 of docs/planer/grafikk-natur-og-miljo.md) ----------
  // Where the map has the trees layer (tools/trees/trees.py, coast.py trees_tile: per 50 m cell how much is under trees, how tall they
  // are and whether they carry needles), a chunk's trees are instances of the Blender models (tools/wild/trees.py: spruce, pine and
  // birch, each in two levels of detail, one metre tall from the ground) instead of the old cones: as many per cell as its cover says,
  // as tall as the canopy map says, each turned its own way and a little lighter or darker. Drawn with ANGLE_instanced_arrays, one call
  // per species and level per chunk; the near chunks (TREE_LOD0[QUAL.lvl] m) get the detailed models. Without the extension or the
  // layer (an older release, outside Norway) the old trees stay (06-buildings-lights.js addTrees). #trees0 in the address: the old trees.
  const TREE = {ext:null, tried:false, M:null, P:null, on:!/trees0/.test(location.hash), n:0};
  const TREEK = ['spruce', 'pine', 'birch'], TREE_LOD0 = [0, 220, 320, 450], TREE_DENS = [3, 5, 8, 12], TREE_R = [700, 1200, 1800, 2500];
  // per quality level: the detailed models' reach (m), trees per full 50 m cell, and how far trees are planted at all (beyond, the
  // satellites' colour shows the wood; 29.10.2026: planted in every chunk in sight, some 700, the trees took minutes a frame in the tests)
  function treeExt(){ if (!TREE.tried){ TREE.tried = true; try { TREE.ext = gl.getExtension('ANGLE_instanced_arrays'); } catch (e){ TREE.ext = null; } } return TREE.ext; }
  // the models as buffers: position, normal, colour and paint zone (1 the needles or leaves, 2 the birch's twigs) per vertex
  function treeModels(){
    if (TREE.M !== null) return TREE.M;
    TREE.M = false; const M = {};
    for (const k of TREEK) for (const l of [0, 1]){
      const q = glbPart('trees', k + l); if (!q) return TREE.M = false;
      const n = q.p.length / 3, a = new Float32Array(n * 10);
      for (let i = 0; i < n; i++){ a.set([q.p[i * 3], q.p[i * 3 + 1], q.p[i * 3 + 2], q.n[i * 3], q.n[i * 3 + 1], q.n[i * 3 + 2], q.c[i * 4], q.c[i * 4 + 1], q.c[i * 4 + 2], q.zone ? q.zone[i] || 0 : 0], i * 10); }
      M[k + l] = {b:buf(a), n};
    }
    return TREE.M = M;
  }
  const TREE_VS = 'precision highp float;attribute vec3 aP;attribute vec3 aN;attribute vec4 aC;attribute vec4 aI;attribute vec2 aJ;uniform mat4 uVP;uniform vec3 uO;uniform vec3 uLeaf;uniform float uBare;uniform float uBirch;' +
    'varying vec3 vW;varying vec3 vN;varying vec3 vC;varying float vZ;' +
    'void main(){float c=cos(aJ.x),s=sin(aJ.x);vec3 p=aP*aI.w;p=vec3(c*p.x-s*p.z,p.y,s*p.x+c*p.z);vec3 n=vec3(c*aN.x-s*aN.z,aN.y,s*aN.x+c*aN.z);' +
    // a birch is bare in winter: its leaves fold away, its twigs show; in summer the twigs are hidden inside the crown
    'float z=aC.w;float hide=uBirch>0.5?(z>0.5&&z<1.5?uBare:(z>1.5?1.0-uBare:0.0)):(z>1.5?1.0:0.0);if(hide>0.5)p=vec3(0.0,-0.01,0.0);' +
    'vec3 col=z>0.5&&z<1.5?aC.rgb*uLeaf:aC.rgb;vC=col*aJ.y;vZ=z;vN=n;vW=p+aI.xyz+uO;gl_Position=uVP*vec4(vW,1.0);}';
  const TREE_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform float uSnow;varying vec3 vW;varying vec3 vN;varying vec3 vC;varying float vZ;' + NOISE + AIR +
    'void main(){vec3 n=normalize(vN);float d=dot(n,uSun);' +
    // foliage lets light through: a wrapped diffuse for the needles and leaves, plain for the bark
    'float wl=vZ>0.5?clamp((d+0.35)/1.35,0.0,1.0):max(d,0.0);vec3 c=vC*(uAmb*(0.75+0.25*n.y)+uSunCol*wl);' +
    // snow lies on the upward faces of the crowns in winter
    'c=mix(c,vec3(0.9,0.92,0.95)*(uAmb+uSunCol*max(d,0.0)*0.8),uSnow*smoothstep(0.35,0.8,n.y)*(vZ>0.5?1.0:0.4));' +
    'gl_FragColor=vec4(fin(c,vW),1.0);}';
  // the species of a cell with trees: needles are spruce in the south below 450 m and on good ground (tall), pine else; leaves are birch
  function treeSpecies(needle, x, z, y, h, r){
    if (!needle) return 2;
    const lat = (8050000 - z) / 111200;   // (near enough: the frame's y is 8 050 km less the UTM northing)
    const spr = (lat < 64.5 ? 0.8 : lat < 66.3 ? 0.55 : 0.12) * (y < 450 ? 1 : 0.3) * (h > 9 ? 1 : 0.6);
    return r < spr ? 0 : 1;
  }
  // a chunk's trees from the layer (addTrees calls it): returns false where the layer has no block here (the old trees then); else the
  // chunk keeps what is needed and drawTrees plants it when the eye comes within TREE_R (one chunk a frame), and clears it again further off
  function treeChunk(c, key, occ, snowy){
    const L = MAPD.L.trees; if (!L || !TREE.on || !treeExt() || !treeModels()) return false;
    const gx = gridKeyX(key), gz = gridKeyY(key), x0 = gx * 1000, z0 = gz * 1000, cm = L.c * 1000, n = Math.round(1000 / cm);
    const ix0 = Math.floor(x0 / cm), iz0 = Math.floor(z0 / cm);
    if (!mapIn(L, ix0, iz0) || !mapIn(L, ix0 + n - 1, iz0 + n - 1)) return false;
    for (const [bx, by] of [[ix0, iz0], [ix0 + n - 1, iz0], [ix0, iz0 + n - 1], [ix0 + n - 1, iz0 + n - 1]]) if (!mapHasBlock(L, Math.floor(bx / L.n), Math.floor(by / L.n))) return false;
    c.trq = {key, occ}; c.tr = null; c.trN = 0; return true;
  }
  function treePlant(c){
    const L = MAPD.L.trees, {key, occ} = c.trq, gx = gridKeyX(key), gz = gridKeyY(key), x0 = gx * 1000, z0 = gz * 1000, cm = L.c * 1000, n = Math.round(1000 / cm);
    const ix0 = Math.floor(x0 / cm), iz0 = Math.floor(z0 / cm);
    const D = TREE_DENS[QUAL.lvl], out = [[], [], []]; c.trD = D;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const v = rcell(L, ix0 + i, iz0 + j); if (!v) continue;
      const cov = (v & 15) / 15, hc = (v >> 4) & 7, needle = v >> 7, base = hash((gx * 7919 + gz * 104729) * 1600 + j * n + i), k = Math.floor(cov * D + base);
      for (let t = 0; t < k; t++){
        const h1 = hash(base * 1e6 + t * 13.1), h2 = hash(base * 3e6 + t * 7.7), x = x0 + (i + 0.1 + 0.8 * h1) * cm, zz = z0 + (j + 0.1 + 0.8 * h2) * cm;
        const oc = occ[Math.floor((zz - z0) / 25) * 40 + Math.floor((x - x0) / 25)]; if (oc || onUnit(x, zz, 8) || onSite(x, zz)) continue;
        const y = terrH(x, zz); if (y < 1.5) continue;
        const sl = Math.hypot(terrH(x + 6, zz) - terrH(x - 6, zz), terrH(x, zz + 6) - terrH(x, zz - 6)) / 12; if (sl > 0.95) continue;
        const H = Math.max(1.8, (hc === 0 ? 3 : 2 + hc * 4) * (0.72 + 0.56 * hash(base * 5e6 + t * 3.3))), sp = treeSpecies(needle, x, zz, y, H, hash(base * 7e6 + t * 1.9));
        out[sp].push(x - x0, y - 0.15, zz - z0, H, hash(base * 9e6 + t * 5.3) * 6.2832, 0.84 + 0.32 * hash(base * 2e6 + t * 8.1));
      }
    }
    c.tr = out.map(a => a.length ? {b:buf(new Float32Array(a)), n:a.length / 6} : null); c.trN = out.reduce((s, a) => s + a.length / 6, 0);
  }
  function treeFree(c){ if (c.tr) for (const t of c.tr) if (t) gl.deleteBuffer(t.b); c.tr = null; c.trN = 0; }
  // the season's colours: the birch's leaves from spring green to summer to autumn yellow, bare in winter; snow on the crowns
  function treeSeasonU(){
    const st = typeof seasonAt === 'function' ? seasonAt(S.t / 60) : {leaf:1, yel:0}, leaf = clamp(st.leaf == null ? 1 : st.leaf, 0, 1), yel = clamp(st.yel || 0, 0, 1);
    return {birch:mix3(mix3([1.2, 1.15, 0.8], [1, 1, 1], leaf), [2.7, 1.45, 0.75], yel), bare:leaf < 0.25 ? 1 : 0, snow:snowNow != null && snowNow < 80 ? 0.85 : 0};
  }
  function drawTrees(VP, eye){
    if (!TREE.ext || !TREE.M) return;
    if (!TREE.P){ try { TREE.P = program(TREE_VS, TREE_FS, ['aP', 'aN', 'aC', 'aI', 'aJ'], 'traer'); } catch (e){ console.warn('traer', e.message || e); TREE.P = false; TREE.on = false; } }
    if (!TREE.P) return;
    const P = TREE.P, u = P.u, X = TREE.ext, se = treeSeasonU(); gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.uniform1f(u.uSnow, se.snow); gl.uniform1f(u.uBare, se.bare);
    const R0 = TREE_LOD0[QUAL.lvl], RT = TREE_R[QUAL.lvl]; let drawn = 0, best = null, bd = 1e9;
    for (const c of CH.values()){
      if (!c.trq) continue; const d = Math.hypot(c.o[0] + 500 - eye[0], c.o[1] + 500 - eye[2]);
      if (c.tr && (d > RT + 1500 || c.trD !== TREE_DENS[QUAL.lvl])) treeFree(c);
      if (!c.tr && d < RT + 700 && d < bd){ bd = d; best = c; }
      if (!c.tr || d > RT + 700) continue; const lod = d < R0 + 500 ? 0 : 1;
      gl.uniform3f(u.uO, c.o[0] - eye[0], -eye[1], c.o[1] - eye[2]);   // the view is from the eye (V.m has no move), as fin's fog wants
      for (let s = 0; s < 3; s++){ const t = c.tr[s]; if (!t) continue; const m = TREE.M[TREEK[s] + lod];
        gl.uniform1f(u.uBirch, s === 2 ? 1 : 0); gl.uniform3fv(u.uLeaf, s === 2 ? se.birch : [1, 1, 1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.b); for (const [a, sz, off] of [[0, 3, 0], [1, 3, 12], [2, 4, 24]]){ gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, sz, gl.FLOAT, false, 40, off); X.vertexAttribDivisorANGLE(a, 0); }
        gl.bindBuffer(gl.ARRAY_BUFFER, t.b); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 24, 0); X.vertexAttribDivisorANGLE(3, 1); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 24, 16); X.vertexAttribDivisorANGLE(4, 1);
        X.drawArraysInstancedANGLE(gl.TRIANGLES, 0, m.n, t.n); drawn += t.n;
      }
    }
    X.vertexAttribDivisorANGLE(3, 0); X.vertexAttribDivisorANGLE(4, 0); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
    TREE.n = drawn; if (best) treePlant(best);   // the nearest chunk still bare, one a frame (drawn from the next)
  }
