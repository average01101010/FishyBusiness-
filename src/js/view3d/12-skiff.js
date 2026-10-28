  // ---------- boat ----------
  const WHITE = [0.9, 0.92, 0.93], NAVY = [0.1, 0.16, 0.3], RED = [0.45, 0.12, 0.1], FLOOR = [0.72, 0.74, 0.74], ORANGE = [0.93, 0.4, 0.1], SKIN = [0.85, 0.65, 0.5], DARK = [0.14, 0.16, 0.18], GREY = [0.62, 0.64, 0.66], GLASS = [0.2, 0.27, 0.32];
  // ======================= the starter boat: a 19 ft centre-console skiff, modelled in detail =======================
  // smooth-shaded lit program with gloss (vertex colour alpha) for curved parts; textured program for screens and decals
  const LITN_VS = 'attribute vec3 aPos;attribute vec3 aNor;attribute vec4 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vN;varying vec4 vC;varying vec3 vP;varying vec3 vNm;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vN=(uM*vec4(aNor,0.0)).xyz;vC=aCol;vP=aPos;vNm=aNor;gl_Position=uVP*w;}';
  // The wear on your own hull (Fysikk 3, core/16c-hull.js): uWear = (scratches, damage, the gunwale's height over the waterline, half
  // the length), zero for everything else. In the boat's own metres (the waterline at y = 0, the bow to -z), on the sides: scratches are
  // thin streaks along her in the upper topsides, at the rubbing strake and fender height where a quay is met, and down the stem, where
  // the paint is scraped to the primer (light on a dark hull, grey on a light one) and the gloss is gone; damage is dark, dented
  // blotches with rust-brown in them from the waterline up, most forward.
  const WEAR_GL = 'uniform vec4 uWear;varying vec3 vP;varying vec3 vNm;float wh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float wn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(wh(i),wh(i+vec2(1.0,0.0)),f.x),mix(wh(i+vec2(0.0,1.0)),wh(i+vec2(1.0,1.0)),f.x),f.y);}' +
    'void wearHull(inout vec3 bc,inout float gs){vec3 nm=normalize(vNm);float sd=smoothstep(0.5,0.8,length(nm.xz)),top=uWear.z;if(sd<=0.0||vP.y<-0.05||vP.y>top*1.06)return;' +
    'float bow=clamp(-vP.z/uWear.w,0.0,1.0),aft=clamp(vP.z/uWear.w,0.0,1.0),stem=smoothstep(0.75,0.95,bow);' +
    'float band=max(smoothstep(0.3*top,0.5*top,vP.y)*(1.0-smoothstep(0.97*top,1.05*top,vP.y)),stem*smoothstep(0.0,0.15,vP.y)),zone=0.4+0.6*max(smoothstep(0.25,0.8,bow),0.75*smoothstep(0.45,0.9,aft));' +
    'float st=wn(vec2(vP.z*0.9+vP.x*0.2,vP.y*30.0+wn(vec2(vP.z*0.4,vP.x))*6.0)),br=wn(vec2(vP.z*2.6+3.1,vP.y*4.0+vP.x)),pt=wn(vec2(vP.z*0.2+7.3,vP.y*1.4+vP.x*0.4));' +
    'float s=clamp(uWear.x*sd*band*zone*smoothstep(0.76-0.15*uWear.x,0.82-0.15*uWear.x,st)*smoothstep(0.35,0.6,br)*smoothstep(0.2,0.5,pt+0.4*uWear.x)*1.8,0.0,1.0);' +
    'float lum=dot(bc,vec3(0.3,0.59,0.11));bc=mix(bc,lum>0.55?vec3(0.4,0.39,0.37):mix(min(bc*1.6+0.08,vec3(1.0)),vec3(0.6,0.58,0.54),0.4),s*0.75);gs*=1.0-0.8*s;' +
    'float db=smoothstep(0.0,0.12,vP.y)*(1.0-smoothstep(0.9*top,1.02*top,vP.y)),dz=wn(vec2(vP.z*0.8+2.1,vP.y*2.6+vP.x*0.3)),rs=wn(vec2(vP.z*3.0,vP.y*9.0));' +
    'float dm=clamp(uWear.y*sd*db*(0.35+0.65*smoothstep(0.2,0.8,bow))*smoothstep(0.5,0.68,dz+0.3*uWear.y)*1.6,0.0,1.0);' +
    'bc=mix(bc,mix(bc*0.35,vec3(0.32,0.16,0.07),0.45*smoothstep(0.4,0.8,rs)),dm*0.9);gs*=1.0-0.85*dm;}';
  const LITN_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uAlpha;uniform float uEmis;varying vec3 vW;varying vec3 vN;varying vec4 vC;' + PLG + AIR + WEAR_GL +
    'void main(){vec3 n=normalize(vN);vec3 V=normalize(-vW);if(dot(n,V)<0.0)n=-n;float dif=max(dot(n,uSun),0.0);vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 bc=vC.rgb;float gs=vC.a;if(uWear.x+uWear.y>0.0)wearHull(bc,gs);' +
    'float sp=pow(max(dot(reflect(-uSun,n),V),0.0),mix(12.0,90.0,gs))*gs;float fr=pow(1.0-max(dot(n,V),0.0),4.0)*gs*0.35;' +
    'vec3 c=bc*(amb+uSunCol*dif+pLit(vW,n))+uSunCol*sp*0.55+uAmb*1.2*fr+bc*uEmis;gl_FragColor=vec4(fin(c,vW),uAlpha);}';
  const TEX_VS = 'attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform mat4 uM;varying vec2 vUV;varying vec3 vW;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vUV=aUV;gl_Position=uVP*w;}';
  const TEX_FS = 'precision mediump float;uniform sampler2D uTex;uniform float uLit;uniform vec3 uN;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;varying vec2 vUV;varying vec3 vW;' + AIR +
    'void main(){vec4 t=texture2D(uTex,vUV);if(t.a<0.05)discard;vec3 c=uLit>0.5?t.rgb*(uAmb+uSunCol*max(dot(uN,uSun),0.0)):t.rgb;gl_FragColor=vec4(fin(c,vW),t.a);}';
  let PRGN = null, PRGX = null, SK = null, PRGW = null, WKB = null, CHARM_AT = [0.2, 1.6, 0.1];
  const fishOf = sp => SK.fishM[sp] || SK.fishM.torsk;      // a species' fish mesh (tools/fish), 1 m long
  // the places on the starter boat that the live parts and the people use, in its frame; a detailed model (GLB) brings its own
  const SKA = {sole:0.2, tub:[0, 0.2, 2.0], fisher:[0.52, 0.2, 0.5], haul:[0.98, 1.02, 0.3], reel:[1.0, 1.2, 0.32], mach:[[0.99, 1.08, -0.3], [0.99, 1.08, 1.1], [0.99, 1.08, 1.6]],
    stack:[0.1, 0.2, 1.2], filler:[0.8, 0.95, 2.3]};
  const WK_VS = 'attribute vec3 aPos;attribute vec4 aW;attribute float aS;uniform mat4 uVP;varying vec4 vW4;varying float vS;varying vec3 vP;void main(){vW4=aW;vS=aS;vP=aPos;gl_Position=uVP*vec4(aPos,1.0);}';
  // The Kelvin arms' crests stand still behind the boat, where the sea's own divergent waves are (wakeH: 1.5 k0 (0.816 s + 0.577 q)
  // from the stern, uWk0 and uWk1), and the foam breaks up in the water's own place. Tied to the trail's points they ran back along the
  // arms as fast as the boat goes on screen, GAME_RATE times her speed through the waves (Jonas 21.10.2026, #90: the stern waves out to
  // the side went far too fast for the boat's speed)
  const WK_FS = 'precision highp float;uniform vec3 uCol;uniform vec3 uAer;uniform vec3 uArm;uniform vec3 uEye;uniform vec3 uFog;uniform float uFogD;uniform float uTime;uniform vec4 uWk0;uniform vec4 uWk1;varying vec4 vW4;varying float vS;varying vec3 vP;' + NOISE +
    'void main(){float u=vW4.x;float v=vW4.y;float age=vW4.z;float foam=0.0;float aer=0.0;' +
    'vec2 P=vP.xz+uEye.xz;' +
    'if(vW4.w<0.5){float e=ns(P*0.33+age*0.12)*0.6+ns(P*0.95-age*0.3)*0.4;float prof=1.0-smoothstep(0.2+0.35*e,1.0,abs(v)*(0.8+0.35*e));' +
    'float f=ns(P*0.55+vec2(age*0.35,0.0))*0.5+ns(P*1.45-vec2(0.0,age*0.7))*0.3+ns(P*3.7+age*0.9)*0.2;' +
    'float cover=clamp(1.0-age*0.16,0.0,1.0);float th=1.0-cover*0.55;' +
    'foam=smoothstep(th,th+0.1,f*(0.4+0.6*prof))*prof*(0.55+0.45*f)*cover;}' +
    'else{float prof=1.0-smoothstep(0.1,1.0,abs(v));vec2 r=P-uWk0.xy;float sb=max(-dot(r,uWk0.zw),0.0);float qb=abs(r.x*uWk0.w-r.y*uWk0.z);float cr=pow(max(sin(1.5*uWk1.x*(0.816*sb+0.577*qb)),0.0),3.0);float n=ns(P*0.45+vec2(age*0.05,0.0));' +
    'foam=cr*prof*smoothstep(0.4,0.8,n)*smoothstep(3.5,0.5,age)*0.85;aer=(cr*0.8+0.3)*prof*exp(-age*0.15)*(1.0-smoothstep(4.0,10.0,age))*0.62;}' +
    'foam*=vS;aer*=vS;float d=length(vP);float fg=1.0-exp(-uFogD*uFogD*d*d);' +
    'float al=clamp(max(foam,aer),0.0,0.95);vec3 base=vW4.w<0.5?uAer:uArm;vec3 c=mix(base,uCol,clamp(foam/max(al,0.001),0.0,1.0));gl_FragColor=vec4(mix(c,uFog,fg),al*(1.0-fg));}';
  // builder with normals and gloss: the geometry is VB() (vessel3d.js), this adds the GL buffers
  function NB(){ const o = VB(); o.mesh = g => withOrigin({pb:buf(relTo(o.p, g)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}, g); return o; }
  // arrays {p, n, c} as a mesh to draw
  const upA = o => o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null;
  // the figure's parts for one kit (vessel3d.js wkPart), to pose joint by joint
  const wkMeshes = kit => { const g = n => n ? upA(wkPart(n, kit)) : null, K = wkKitOf(kit);
    return {torso:g(K.torso), head:g('head'), hat:g(K.hat), hair:g(K.hairP), beard:g(K.beard), uarm:g('uarm'), farm:g('farm'), thigh:g('thigh'), shin:g('shin'), boot:g(K.shoe || 'boot'), hand:g('hand')}; };
  // the meshes of a look, kept by its key (the last 40 looks; the buffers of the one that goes are freed)
  const LOOKM = new Map();
  function lookMesh(look){
    const key = lookKit(look).key; let m = LOOKM.get(key);
    if (m){ LOOKM.delete(key); LOOKM.set(key, m); return m; }
    m = wkMeshes(look); LOOKM.set(key, m);
    if (LOOKM.size > 40){ const k0 = LOOKM.keys().next().value, o = LOOKM.get(k0); LOOKM.delete(k0); for (const q in o){ const x = o[q]; if (x && x.pb){ gl.deleteBuffer(x.pb); gl.deleteBuffer(x.nb); gl.deleteBuffer(x.cb); } } }
    return m;
  }
  function nSetup(VP){
    gl.useProgram(PRGN.p); const u = PRGN.u; plSet(u);
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u); gl.uniform1f(u.uAlpha, 1); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uWear, WEAR0);
  }
  // your own hull's wear for the next draws (core/16c-hull.js b.dmg), and back to none
  const WEAR0 = new Float32Array([0, 0, 1, 1]);
  function wearOn(t){ const d = S.boat && S.boat.dmg; if (!d || !(d.s > 0.004 || d.h > 0.004) || !PRGN.u.uWear) return false; const h = hullOf(t), G = GEO(t); gl.uniform4fv(PRGN.u.uWear, [Math.min(1, d.s), Math.min(1, d.h), (G && G.gw) || h.f + 0.15, h.L / 2]); return true; }
  function wearOff(){ if (PRGN.u.uWear) gl.uniform4fv(PRGN.u.uWear, WEAR0); }
  function drawN(m, M){ gl.uniformMatrix4fv(PRGN.u.uM, false, m.o ? relM(m) : M); attr(0, m.pb, 3); attr(1, m.nb, 3); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, m.n); }
  // a decal strip following a curved surface: bottom and top point rows, texture u runs along the rows
  function texStrip(Pb, Pt){ const p = [], uv = [], n = Pb.length - 1; for (let i = 0; i < n; i++){ const u0 = i / n, u1 = (i + 1) / n; p.push(...Pb[i], ...Pb[i + 1], ...Pt[i + 1], ...Pb[i], ...Pt[i + 1], ...Pt[i]); uv.push(u0, 1, u1, 1, u1, 0, u0, 1, u1, 0, u0, 0); } return {pb:buf(new Float32Array(p)), ub:buf(new Float32Array(uv)), n:p.length / 3}; }
  function texQuad(P0, P1, P2, P3){ const p = new Float32Array([...P0, ...P1, ...P2, ...P0, ...P2, ...P3]), uv = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]); return {pb:buf(p), ub:buf(uv), n:6}; }
  function mkTex(){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
  function upTex(t, cv){ gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); }
  function drawTexQuad(q, tex, M, VP, lit, nrm){
    gl.useProgram(PRGX.p); const u = PRGX.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniformMatrix4fv(u.uM, false, M); gl.uniform1f(u.uLit, lit ? 1 : 0); gl.uniform3fv(u.uN, nrm || [0, 1, 0]);
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); airSet(u);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(u.uTex, 0);
    attr(0, q.pb, 3); attr(1, q.ub, 2); gl.drawArrays(gl.TRIANGLES, 0, q.n || 6);
  }

  // ---------- the open boats worked by hand: one kit per type ----------
  // buildSkiff makes the skiff's kit (SK, SKA, CHARM_AT). Another type with a model and hand anchors (the old wooden boat,
  // tools/boats/snekke23.py) gets its own from it: its hull, glass, lid, propeller and tiller, name boards, the skipper (seated at the
  // tiller where it has one) and the crew, and its places; an inboard boat has no wheel, lever or outboard. useHand swaps the kit in.
  let PERSON = null; const HANDK = {cur:null};
  // the figures on the own boat (the skipper at the wheel, the crewman on the seat, the fisher at the rail and the fisher's arms) are built
  // once per boat kit with the look the skipper and the first hand have; when either changes (the wardrobe, a new hand) they are built again
  const peopleSig = () => lookKey(lookMe()) + '|' + (lookCrew(0) ? lookKey(lookCrew(0)) : '');
  function refreshPeople(K){
    if (!K || !K.pp || !PERSON) return; const sig = peopleSig(); if (K.pSig === sig) return; K.pSig = sig;
    // (the old buffers are left: boat kits made from each other share them, and a look changes rarely)
    const free = () => {};
    const build = (a, look) => { const b = NB(); PERSON(b, a[0], a[1], a[2], a[3], a[4], look); return b.mesh(); };
    const me = lookMe(), c0 = lookCrew(0) || 'crew';
    if (K.pp.skipper){ free(K.skipper); K.skipper = build(K.pp.skipper, me); }
    if (K.pp.crew){ free(K.crew); K.crew = build(K.pp.crew, c0); }
    if (K.pp.fisher){ free(K.fisher); K.fisher = build(K.pp.fisher, me); }
    if (glbHas('worker')){ if (K.wk) for (const q in K.wk) free(K.wk[q]); K.wk = wkMeshes(me); }
  }
  function useHand(t){
    if (HANDK.cur === t || !SK) return;
    if (!HANDK.skiff) HANDK.skiff = {SK, SKA:Object.assign({}, SKA), CHARM:CHARM_AT};
    if (!HANDK[t]) HANDK[t] = handKit(t) || HANDK.skiff;
    const k = HANDK[t]; SK = k.SK; for (const q of Object.keys(SKA)) delete SKA[q]; Object.assign(SKA, k.SKA); CHARM_AT = k.CHARM; HANDK.cur = t;
  }
  function handKit(t){
    if (!glbHas(t) || !PERSON) return null;      // (the skiff's own kit is in HANDK already, under its name)
    const G = geoOf(t), A = G && G.skiff; if (!A) return null;
    const up = o => o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null;
    const K = Object.assign({}, HANDK.skiff.SK, {wheelA:0, propA:0, headPrev:null, live:false});
    K.hull = up(glbPart(t, 'lod0')); K.hullT = t; K.livK = ''; K.glass = up(glbPart(t, 'glass')); K.prop = up(glbPart(t, 'prop')); K.tiller = up(glbPart(t, 'tiller')); K.cap = null;
    const cp = glbPart(t, 'cap'); if (cp){ const c = MB(); for (let i = 0; i < cp.p.length; i += 9) c.tri([cp.p[i], cp.p[i + 1], cp.p[i + 2]], [cp.p[i + 3], cp.p[i + 4], cp.p[i + 5]], [cp.p[i + 6], cp.p[i + 7], cp.p[i + 8]], [1, 1, 1]); K.cap = c.mesh(); }
    K.propAt = A.prop; K.inboard = !!A.inboard; K.tillerAt = A.tiller ? A.tiller.post : null;
    K.wheelAt = A.wheel || null; K.wheelTilt = A.wheelTilt || 0; K.leverAt = A.lever || null; K.motorAt = A.motor || null;
    if (!A.wheel){ K.wheel = null; K.lever = null; K.motor = null; }
    K.qName = A.names ? A.names.map(([B, T]) => texStrip(B, T)) : [];
    const g = A.tiller && A.tiller.grip, sk = A.skipper;
    // at a tiller: seated beside it, the right hand on its grip, the left on his knee
    const hands = g ? [[sk[0] - 0.12, sk[1] + 0.56, sk[2] - 0.34], [g[0] - 0.03, g[1] + 0.03, g[2]]] : A.wheel ? [[A.wheel[0] - 0.14, A.wheel[1] + 0.14, A.wheel[2] + 0.05], [A.wheel[0] + 0.14, A.wheel[1] + 0.12, A.wheel[2] + 0.05]] : null;
    const ps = NB(); PERSON(ps, sk[0], sk[1], sk[2], !!A.sit, hands, lookMe()); K.skipper = ps.mesh();
    const pc = NB(); PERSON(pc, A.seat[0], A.seat[1], A.seat[2], true, null, lookCrew(0) || 'crew'); K.crew = pc.mesh();
    K.pp = {skipper:[sk[0], sk[1], sk[2], !!A.sit, hands], crew:[A.seat[0], A.seat[1], A.seat[2], true, null], fisher:[0, 0, 0, false, false]}; K.pSig = peopleSig(); K.wk = wkMeshes(lookMe());
    { const fb = NB(); PERSON(fb, 0, 0, 0, false, false, lookMe()); K.fisher = fb.mesh(); }
    const KA = Object.assign({}, HANDK.skiff.SKA); for (const k of ['sole', 'tub', 'fisher', 'haul', 'reel', 'mach', 'stack', 'filler']) if (A[k]) KA[k] = A[k];
    return {SK:K, SKA:KA, CHARM:A.charm || HANDK.skiff.CHARM};
  }
  function buildSkiff(){
    const L = 5.8, NS = 36;
    const CREAM = [0.94, 0.925, 0.86, 0.75], LINER = [0.9, 0.885, 0.82, 0.45], SOLE = [0.82, 0.815, 0.77, 0.12], NAVYB = [0.1, 0.14, 0.22, 0.55], RUB = [0.08, 0.09, 0.11, 0.3];
    const STEEL = [0.78, 0.8, 0.83, 1.0], CUSH = [0.95, 0.95, 0.93, 0.35], ENG = [0.2, 0.21, 0.23, 0.6], ENG2 = [0.12, 0.13, 0.14, 0.45], BLACK = [0.05, 0.05, 0.06, 0.4], GREYD = [0.25, 0.26, 0.28, 0.4];
    const zs = s => L / 2 - s * L;
    const bs = s => s < 0.5 ? 1.08 - 0.04 * s : 1.06 * Math.pow(Math.max(0, 1 - ((s - 0.5) / 0.5) ** 2), 0.62);
    const ys = s => 0.64 + 0.36 * Math.pow(s, 2.4);
    const bc = s => Math.min(bs(s) * 0.9, s < 0.5 ? 0.93 : 0.93 * Math.pow(Math.max(0, 1 - ((s - 0.5) / 0.5) ** 2), 0.8));
    const yc = s => -0.02 + 0.3 * Math.pow(s, 2.2), yk = s => -0.36 + 0.1 * s + 0.62 * Math.pow(s, 3.2);
    const m = NB(), cap = MB();
    // hull surfaces, each side a smooth grid; hard edges at chine and sheer
    for (const sg of [-1, 1]){
      const Bot = [], Top = [];
      for (let i = 0; i <= NS; i++){
        const s = Math.min(i / NS, 0.999), z = zs(s), rb = [], rt = [];
        for (let j = 0; j <= 6; j++){ const t = j / 6; rb.push([sg * bc(s) * t, yk(s) + (yc(s) - yk(s)) * Math.pow(t, 0.92), z]); }
        const x0 = bc(s) + 0.05 * (1 - s), y0 = yc(s) + 0.012;
        for (let j = 0; j <= 6; j++){ const t = j / 6; rt.push([sg * (x0 + (bs(s) - x0) * Math.pow(t, 0.8)), y0 + (ys(s) - y0) * t, z]); }
        Bot.push(sg < 0 ? rb.slice().reverse() : rb); Top.push(sg < 0 ? rt.slice().reverse() : rt);
        // spray rail: the little ledge at the chine
        if (i < NS){ const s1 = Math.min((i + 1) / NS, 0.999); m.quad([sg * bc(s), yc(s), z], [sg * bc(s1), yc(s1), zs(s1)], [sg * (bc(s1) + 0.05 * (1 - s1)), yc(s1) + 0.012, zs(s1)], [sg * (bc(s) + 0.05 * (1 - s)), yc(s) + 0.012, z], NAVYB); }
      }
      m.grid(Bot, () => NAVYB); m.grid(Top, () => CREAM);
      // rub rail along the sheer
      const rail = []; for (let i = 0; i <= NS; i++){ const s = Math.min(i / NS, 0.995); rail.push([sg * (bs(s) + 0.012), ys(s) - 0.03, zs(s)]); } m.tube(rail, 0.03, RUB, 6);
      // gunwale top and the inside liner down to the sole
      for (let i = 0; i < NS; i++){
        const s0 = i / NS, s1 = (i + 1) / NS; if (s0 > 0.93) break;
        const o0 = sg * bs(s0), o1 = sg * bs(s1), in0 = sg * Math.max(0.05, bs(s0) - 0.11), in1 = sg * Math.max(0.05, bs(s1) - 0.11);
        m.quad([o0, ys(s0), zs(s0)], [o1, ys(s1), zs(s1)], [in1, ys(s1) - 0.01, zs(s1)], [in0, ys(s0) - 0.01, zs(s0)], CREAM);
        if (s1 <= 0.74){ const b0 = sg * Math.max(0.05, bs(s0) - 0.15), b1 = sg * Math.max(0.05, bs(s1) - 0.15); m.quad([in0, ys(s0) - 0.01, zs(s0)], [in1, ys(s1) - 0.01, zs(s1)], [b1, 0.2, zs(s1)], [b0, 0.2, zs(s0)], LINER); }
        else { const dk = 0.52, b0 = sg * Math.max(0.03, bs(s0) - 0.13), b1 = sg * Math.max(0.03, bs(s1) - 0.13); m.quad([in0, ys(s0) - 0.01, zs(s0)], [in1, ys(s1) - 0.01, zs(s1)], [b1, dk, zs(s1)], [b0, dk, zs(s0)], LINER); }
        cap.quad([o0, ys(s0) - 0.03, zs(s0)], [o1, ys(s1) - 0.03, zs(s1)], [0, ys(s1) - 0.03, zs(s1)], [0, ys(s0) - 0.03, zs(s0)], [1, 1, 1]);
      }
    }
    // stem: join the two sides at the very bow, bottom and topsides, and run the rub rail round it
    { const s = 0.999, z = zs(s), x0 = bc(s) + 0.05 * (1 - s), y0 = yc(s) + 0.012, B = [], T = [];
      for (let j = 0; j <= 6; j++){ const t = j / 6; B.push([bc(s) * t, yk(s) + (yc(s) - yk(s)) * Math.pow(t, 0.92)]); T.push([x0 + (bs(s) - x0) * Math.pow(t, 0.8), y0 + (ys(s) - y0) * t]); }
      for (let j = 0; j < 6; j++){ m.quad([-B[j][0], B[j][1], z], [B[j][0], B[j][1], z], [B[j + 1][0], B[j + 1][1], z], [-B[j + 1][0], B[j + 1][1], z], NAVYB); m.quad([-T[j][0], T[j][1], z], [T[j][0], T[j][1], z], [T[j + 1][0], T[j + 1][1], z], [-T[j + 1][0], T[j + 1][1], z], CREAM); }
      m.quad([-B[6][0], B[6][1], z], [B[6][0], B[6][1], z], [T[0][0], T[0][1], z], [-T[0][0], T[0][1], z], NAVYB);
      m.tube([[-(bs(0.99) + 0.012), ys(0.99) - 0.03, zs(0.99)], [0, ys(0.999) - 0.03, zs(0.999) - 0.02], [bs(0.99) + 0.012, ys(0.99) - 0.03, zs(0.99)]], 0.03, RUB, 6);
      m.tube([[0, yk(0.97), zs(0.97) + 0.01], [0, ys(0.999) - 0.05, zs(0.999) - 0.012]], 0.018, [0.75, 0.77, 0.8, 0.9], 6); }
    // bow tip closes the gunwale
    { const s0 = 0.93; m.tri([-(bs(s0)), ys(s0), zs(s0)], [bs(s0), ys(s0), zs(s0)], [0, ys(0.999), zs(0.999)], CREAM); cap.tri([-(bs(s0)), ys(s0) - 0.03, zs(s0)], [bs(s0), ys(s0) - 0.03, zs(s0)], [0, ys(0.999) - 0.03, zs(0.999)], [1, 1, 1]); }
    // cockpit sole and the raised casting deck forward with an anchor locker
    for (let i = 0; i < NS; i++){ const s0 = i / NS, s1 = (i + 1) / NS; if (s1 > 0.74) break; const w0 = Math.max(0.05, bs(s0) - 0.15), w1 = Math.max(0.05, bs(s1) - 0.15); m.quad([-w0, 0.2, zs(s0)], [w0, 0.2, zs(s0)], [w1, 0.2, zs(s1)], [-w1, 0.2, zs(s1)], SOLE); }
    { const s0 = 0.74 - 0.74 % (1 / NS) + 1 / NS * 0; const sA = Math.floor(0.74 * NS) / NS, wA = bs(sA) - 0.13; m.quad([-wA, 0.2, zs(sA)], [wA, 0.2, zs(sA)], [wA, 0.52, zs(sA)], [-wA, 0.52, zs(sA)], LINER);
      for (let i = Math.floor(0.74 * NS); i < NS; i++){ const s0 = i / NS, s1 = Math.min((i + 1) / NS, 0.93); if (s0 >= 0.93) break; const w0 = Math.max(0.03, bs(s0) - 0.13), w1 = Math.max(0.03, bs(s1) - 0.13); m.quad([-w0, 0.52, zs(s0)], [w0, 0.52, zs(s0)], [w1, 0.52, zs(s1)], [-w1, 0.52, zs(s1)], SOLE); }
      const hz = zs(0.84); m.box(0, 0.52, hz, 0.46, 0.012, 0.4, [0.8, 0.79, 0.74, 0.3]); m.box(0.18, 0.532, hz + 0.16, 0.06, 0.012, 0.03, STEEL); }
    // transom with the outboard notch, and the splash well inside
    { const T = [], s = 0, z = zs(0) + 0.001; T.push([0, yk(s), z]); for (let j = 1; j <= 6; j++) T.push([bc(s) * j / 6, yk(s) + (yc(s) - yk(s)) * Math.pow(j / 6, 0.92), z]); T.push([bs(s), ys(s), z], [0.38, ys(s), z], [0.34, 0.4, z], [0, 0.4, z]);
      for (const sg of [-1, 1]) for (let j = 0; j < T.length - 1; j++) m.tri([0, 0.1, z], [sg * T[j][0], T[j][1], z], [sg * T[j + 1][0], T[j + 1][1], z], CREAM);
      m.box(0, 0.2, zs(0) - 0.28, 1.9, 0.36, 0.5, LINER, CREAM); m.box(0, 0.2, zs(0) - 0.12, 0.66, 0.2, 0.2, SOLE); }
    // centre console: rounded front, sloped back with the wheel, dash with instruments, windscreen with a stainless frame
    const cz = -0.25, zb = 0.08, zf = -0.62, yT = 1.12;
    { const G = []; for (let i = 0; i <= 8; i++){ const y = 0.2 + (yT - 0.2) * i / 8, row = [], back = zb - 0.14 * i / 8;
        for (let j = 0; j <= 16; j++){ const a = j / 16 * Math.PI; row.push([Math.cos(a) * 0.37, y, Math.min(back, cz - Math.sin(a) * 0.37 * 1.0 + 0.0) - (Math.sin(a) > 0.99 ? 0 : 0)]); }
        const front = row.map(p => [p[0], p[1], Math.min(p[2], back)]); G.push(front); }
      m.grid(G, () => CREAM);
      // back face (sloping), top (dash)
      m.quad([-0.37, 0.2, zb], [0.37, 0.2, zb], [0.37, yT, zb - 0.14], [-0.37, yT, zb - 0.14], CREAM);
      const dashT = [];
      for (let j = 0; j <= 16; j++){ const a = j / 16 * Math.PI; dashT.push([Math.cos(a) * 0.37, yT, Math.min(zb - 0.14, cz - Math.sin(a) * 0.37)]); }
      for (let j = 0; j < 16; j++) m.tri([0, yT + 0.001, cz], dashT[j + 1], dashT[j], [0.84, 0.83, 0.78, 0.2]);
      m.quad([-0.37, yT + 0.001, cz], [0.37, yT + 0.001, cz], [0.37, yT + 0.001, zb - 0.14], [-0.37, yT + 0.001, zb - 0.14], [0.84, 0.83, 0.78, 0.2]);
      m.quad([-0.37, 0.2, zb], [-0.37, yT, zb - 0.14], [-0.37, yT, cz], [-0.37, 0.2, cz], CREAM); m.quad([0.37, yT, zb - 0.14], [0.37, 0.2, zb], [0.37, 0.2, cz], [0.37, yT, cz], CREAM);
      // storage door outline on the back
      m.box(0, 0.32, zb + 0.004, 0.44, 0.42, 0.01, [0.87, 0.86, 0.8, 0.4]); m.box(0.16, 0.52, zb + 0.012, 0.08, 0.02, 0.012, STEEL);
      // compass
      m.box(0.05, yT, cz - 0.3, 0.12, 0.03, 0.12, BLACK); m.disc([0.05, yT + 0.08, cz - 0.3], [0, 1, 0], 0.055, [0.12, 0.12, 0.14, 0.9]);
    }
    // instrument pods on the dash, angled towards the helmsman
    const podA = -0.72, podZ = zb - 0.2, podY = yT + 0.01;
    const podFace = (x, w, h) => {
      const n = [0, Math.sin(-podA), Math.cos(podA)], uy = [0, Math.cos(podA), Math.sin(podA)], c = [x, podY + 0.06 + h / 2 * uy[1], podZ + h / 2 * uy[2]];
      const P = (a, b, off) => [c[0] + a, c[1] + uy[1] * b + n[1] * off, c[2] + uy[2] * b + n[2] * off], e = 0.018;
      const F = [P(-w / 2 - e, -h / 2 - e, 0.03), P(w / 2 + e, -h / 2 - e, 0.03), P(w / 2 + e, h / 2 + e, 0.03), P(-w / 2 - e, h / 2 + e, 0.03)], B = [P(-w / 2 - e, -h / 2 - e, -0.03), P(w / 2 + e, -h / 2 - e, -0.03), P(w / 2 + e, h / 2 + e, -0.03), P(-w / 2 - e, h / 2 + e, -0.03)];
      m.quad(F[0], F[1], F[2], F[3], BLACK); m.quad(B[1], B[0], B[3], B[2], BLACK); for (let k = 0; k < 4; k++){ const k2 = (k + 1) % 4; m.quad(B[k], B[k2], F[k2], F[k], BLACK); }
      m.box(x, podY - 0.01, c[2] - n[2] * 0.03 + 0.01, w * 0.5, 0.07, 0.05, BLACK);
      return [P(-w / 2, -h / 2, 0.032), P(w / 2, -h / 2, 0.032), P(w / 2, h / 2, 0.032), P(-w / 2, h / 2, 0.032)]; };
    const scrPlot = podFace(-0.19, 0.25, 0.16), scrGauge = podFace(0.1, 0.22, 0.11), scrVhf = podFace(0.3, 0.12, 0.065);
    // windscreen frame and grab rail
    { const top = yT + 0.46, zw0 = cz - 0.33, zw1 = cz - 0.15;
      m.tube([[-0.44, yT, zw0 + 0.05], [-0.42, top, zw1 + 0.06], [0.42, top, zw1 + 0.06], [0.44, yT, zw0 + 0.05]], 0.012, STEEL);
      m.tube([[-0.36, top, zw1 + 0.08], [-0.34, top + 0.04, zw1 + 0.22], [0.34, top + 0.04, zw1 + 0.22], [0.36, top, zw1 + 0.08]], 0.011, STEEL); CHARM_AT = [0.2, top + 0.03, zw1 + 0.22]; }
    // fish tub on the aft deck
    { const tz = 2.02, W = 0.84, D = 0.52, Hh = 0.34, y0 = 0.2, TUB = [0.34, 0.45, 0.55, 0.3];
      m.box(0, y0, tz, W, 0.03, D, TUB); m.box(0, y0, tz - D / 2 + 0.015, W, Hh, 0.03, TUB); m.box(0, y0, tz + D / 2 - 0.015, W, Hh, 0.03, TUB); m.box(-W / 2 + 0.015, y0, tz, 0.03, Hh, D, TUB); m.box(W / 2 - 0.015, y0, tz, 0.03, Hh, D, TUB); }
    // leaning post with two bucket seats, and the front cooler seat
    { const sz0 = 1.2; m.box(0, 0.2, sz0, 0.96, 0.46, 0.55, CREAM, [0.9, 0.89, 0.83, 0.5]);
      for (const x of [-0.24, 0.24]){ m.rbox(x, 0.66, sz0 - 0.02, 0.42, 0.1, 0.44, 0.04, CUSH); m.rbox(x, 0.72, sz0 + 0.22, 0.4, 0.42, 0.09, 0.05, CUSH); m.box(x, 0.66, sz0 + 0.24, 0.06, 0.08, 0.04, STEEL); }
      m.box(0, 0.2, -1.02, 0.7, 0.4, 0.44, CREAM); m.rbox(0, 0.6, -1.02, 0.68, 0.08, 0.42, 0.04, CUSH); }
    // stainless rails: bow pulpit, side grab rails, stern rails, cleats
    { for (const sg of [-1, 1]){
        const bow = []; for (let s = 0.68; s <= 0.985; s += 0.035) bow.push([sg * Math.max(0.02, bs(s) - 0.05), ys(s) + 0.3, zs(s)]); bow.push([0, ys(0.99) + 0.3, zs(0.99) + 0.02]); m.tube(bow, 0.013, STEEL);
        for (const s of [0.7, 0.8, 0.9]) m.tube([[sg * (bs(s) - 0.05), ys(s), zs(s)], [sg * (bs(s) - 0.05), ys(s) + 0.3, zs(s)]], 0.011, STEEL);
        const side = [[sg * (bs(0.36) - 0.05), ys(0.36), zs(0.36)], [sg * (bs(0.38) - 0.05), ys(0.38) + 0.16, zs(0.38)], [sg * (bs(0.58) - 0.05), ys(0.58) + 0.16, zs(0.58)], [sg * (bs(0.6) - 0.05), ys(0.6), zs(0.6)]]; m.tube(side, 0.012, STEEL);
        const st = [[sg * (bs(0.02) - 0.05), ys(0.02), zs(0.02)], [sg * (bs(0.03) - 0.05), ys(0.03) + 0.2, zs(0.03)], [sg * (bs(0.16) - 0.05), ys(0.16) + 0.2, zs(0.16)], [sg * (bs(0.17) - 0.05), ys(0.17), zs(0.17)]]; m.tube(st, 0.012, STEEL);
        for (const s of [0.08, 0.66]) { m.box(sg * (bs(s) - 0.06), ys(s), zs(s), 0.04, 0.03, 0.16, STEEL); }
      }
      m.box(0, ys(0.95), zs(0.95), 0.05, 0.035, 0.14, STEEL);
      // navigation lights on the bow and the stern light pole
      m.box(-0.08, ys(0.965) + 0.03, zs(0.965), 0.07, 0.05, 0.05, [0.9, 0.12, 0.1, 0.8]); m.box(0.08, ys(0.965) + 0.03, zs(0.965), 0.07, 0.05, 0.05, [0.1, 0.8, 0.3, 0.8]);
      m.tube([[-0.8, ys(0.08), 2.42], [-0.8, 1.9, 2.42]], 0.016, STEEL); m.box(-0.8, 1.88, 2.42, 0.06, 0.06, 0.06, [0.95, 0.95, 0.9, 0.9]);
    }
    m.box(0.4, 0.8, cz + 0.02, 0.06, 0.16, 0.18, GREYD); m.box(0.44, 0.83, cz + 0.02, 0.02, 0.06, 0.05, [0.8, 0.1, 0.1, 0.5]);
    const hull = m.mesh();
    // windscreen glass (drawn translucent)
    const gl2 = NB(); { const top = yT + 0.46, zw0 = cz - 0.33, zw1 = cz - 0.15; gl2.quad([-0.43, yT + 0.01, zw0 + 0.05], [0.43, yT + 0.01, zw0 + 0.05], [0.41, top - 0.01, zw1 + 0.06], [-0.41, top - 0.01, zw1 + 0.06], [0.55, 0.68, 0.72, 1]); }
    // steering wheel (drawn with its own rotation), in wheel-local coordinates: axis along +z
    const wh = NB(); { const R = 0.19, rim = []; for (let a = 0; a <= 32; a++){ const an = a / 32 * Math.PI * 2; rim.push([Math.cos(an) * R, Math.sin(an) * R, 0]); } wh.tube(rim, 0.018, BLACK, 8);
      for (let k = 0; k < 5; k++){ const an = Math.PI / 2 + k / 5 * Math.PI * 2; wh.tube([[Math.cos(an) * 0.04, Math.sin(an) * 0.04, 0.03], [Math.cos(an) * (R - 0.012), Math.sin(an) * (R - 0.012), 0]], 0.007, STEEL, 6); }
      wh.rbox(0, -0.035, 0.02, 0.09, 0.07, 0.07, 0.03, BLACK); wh.tube([[0, 0, -0.02], [0, 0, -0.16]], 0.022, GREYD); }
    // throttle lever (side mount on the console), pivot at origin, lever along +y
    const lv = NB(); { lv.tube([[0, 0, 0], [0, 0.17, 0.02]], 0.012, [0.3, 0.31, 0.33, 0.5]); lv.rbox(0, 0.16, 0.02, 0.05, 0.06, 0.06, 0.02, [0.3, 0.31, 0.33, 0.5]); }
    const lvBox = [0.43, 0.9, cz + 0.02];
    // outboard: pivot at the transom notch, engine-local coordinates (aft = +z)
    const ob = NB(); {
      ob.box(0, -0.1, 0.06, 0.22, 0.42, 0.12, ENG2);
      ob.rbox(0, 0.28, 0.33, 0.4, 0.46, 0.54, 0.1, ENG, 0.18);
      ob.box(0, 0.5, 0.33, 0.26, 0.02, 0.34, [0.3, 0.32, 0.35, 0.8]);
      ob.rbox(0, -0.86, 0.3, 0.2, 1.17, 0.34, 0.06, ENG2, 0.25);
      ob.box(0, -0.86, 0.3, 0.36, 0.015, 0.42, ENG2);
      ob.tube([[0, -1.0, 0.12], [0, -1.0, 0.5]], 0.075, ENG2, 10);
      ob.box(0, -1.22, 0.36, 0.02, 0.22, 0.16, ENG2);
      ob.tube([[0.09, 0.1, 0.02], [0.2, 0.2, -0.3]], 0.015, BLACK, 6); ob.tube([[0.12, 0.05, 0.02], [0.22, 0.1, -0.35]], 0.013, BLACK, 6);
    }
    const prop = NB(); { for (let k = 0; k < 3; k++){ const an = k / 3 * Math.PI * 2, c = Math.cos(an), s = Math.sin(an), c2 = Math.cos(an + 0.9), s2 = Math.sin(an + 0.9);
        prop.quad([c * 0.03, s * 0.03, 0], [c * 0.15, s * 0.15, 0.03], [c2 * 0.16, s2 * 0.16, -0.01], [c2 * 0.03, s2 * 0.03, -0.02], [0.72, 0.74, 0.77, 0.9]); }
      prop.tube([[0, 0, -0.04], [0, 0, 0.04]], 0.03, [0.6, 0.62, 0.64, 0.8], 8); }
    // name boards on both bows
    const hx = (s, y) => { const x0 = bc(s) + 0.05 * (1 - s), y0 = yc(s) + 0.012, t = clamp((y - y0) / (ys(s) - y0), 0, 1); return x0 + (bs(s) - x0) * Math.pow(t, 0.8) + 0.012; };
    const NP = (sg, s, dy) => { const y = ys(s) - dy; return [sg * hx(s, y), y, zs(s)]; }, sa = 0.7, sb = 0.84;
    const strip = (sg, from, to) => { const B = [], T = []; for (let k = 0; k <= 12; k++){ const s = from + (to - from) * k / 12, f = (s - sa) / (sb - sa); B.push(NP(sg, s, 0.31 + 0.02 * f)); T.push(NP(sg, s, 0.13 + 0.02 * f)); } return texStrip(B, T); };
    const nq = [strip(-1, sb, sa), strip(1, sa, sb)];
    // the skipper at the wheel and a crewman on the cooler seat, with rounded shapes
    const person = PERSON = (B, x, y, z, seated, hands, kit) => {
      if (glbHas('worker')) return figureVB(B, x, y, z, seated, hands, kit);      // the detailed figure: the skipper in his cap, the crew in oilskins
      const JAC = [0.14, 0.26, 0.58, 0.25], VEST = [0.86, 0.16, 0.12, 0.35], TRS = [0.1, 0.12, 0.17, 0.2], SKN = [0.93, 0.74, 0.6, 0.25], HAT = [0.12, 0.16, 0.3, 0.15], BOOT = [0.06, 0.06, 0.07, 0.3];
      const hip = y + (seated ? 0.46 : 0.82);
      for (const sd of [-1, 1]){
        const knee = seated ? [x + sd * 0.1, hip + 0.02, z - 0.4] : [x + sd * 0.1, y + 0.44, z - 0.03], foot = seated ? [x + sd * 0.11, y + 0.08, z - 0.44] : [x + sd * 0.11, y + 0.08, z + 0.01];
        B.tube([[x + sd * 0.1, hip, z], knee, foot], 0.07, TRS, 8); B.rbox(foot[0], y, foot[2] - 0.05, 0.12, 0.1, 0.26, 0.04, BOOT);
      }
      B.rbox(x, hip - 0.05, z, 0.4, 0.62, 0.26, 0.1, JAC); B.rbox(x, hip + 0.03, z, 0.44, 0.46, 0.3, 0.1, VEST);
      const sh = hip + 0.52;
      if (hands !== false) for (const sd of [-1, 1]){ const hd = hands ? hands[sd < 0 ? 0 : 1] : [x + sd * 0.17, hip + 0.12, z - 0.34], el = [x + sd * 0.23, (sh + hd[1]) / 2 - 0.08, (z + hd[2]) / 2 + 0.06];
        B.tube([[x + sd * 0.21, sh - 0.04, z], el, hd], 0.052, JAC, 8); B.rbox(hd[0], hd[1] - 0.04, hd[2], 0.08, 0.08, 0.1, 0.035, SKN); }
      B.rbox(x, sh - 0.03, z, 0.13, 0.1, 0.13, 0.05, SKN); B.rbox(x, sh + 0.05, z, 0.22, 0.26, 0.24, 0.1, SKN); B.rbox(x, sh + 0.23, z, 0.235, 0.13, 0.25, 0.1, HAT);
    };
    const pb = NB(); person(pb, 0, 0.2, 0.8, false, [[-0.12, 1.12, 0.05], [0.16, 1.1, 0.05]], lookMe());
    const cb = NB(); person(cb, 0.26, 0.32, 1.16, true, null, lookCrew(0) || 'crew');
    // the fisher at the rail: body without arms (the arms are drawn live, reaching for rod, reel or line)
    const fb = NB(); person(fb, 0, 0, 0, false, false, lookMe());
    const lb = NB(); lb.tube([[0, 0, 0], [0, 0, 1]], 1, [0.14, 0.26, 0.58, 0.25], 10);
    const hb = NB(); hb.rbox(0, -0.04, 0, 0.085, 0.085, 0.1, 0.035, [0.93, 0.74, 0.6, 0.25]);
    // hand jig reel (juksavinde) on the gunwale: a fixed frame with a roller, and a drum with crank turning about the fore-aft axis
    const WOOD = [0.5, 0.33, 0.17, 0.3], STL = [0.74, 0.76, 0.78, 0.9], BLK = [0.08, 0.08, 0.09, 0.3];
    const jf = NB(); jf.rbox(0.02, -0.19, 0, 0.16, 0.05, 0.34, 0.02, WOOD); jf.box(0, -0.15, -0.14, 0.05, 0.16, 0.03, WOOD); jf.box(0, -0.15, 0.14, 0.05, 0.16, 0.03, WOOD); jf.tube([[0.14, -0.05, -0.07], [0.14, -0.05, 0.07]], 0.025, STL, 8);
    const jd = NB(); jd.tube([[0, 0, -0.1], [0, 0, 0.1]], 0.085, [0.62, 0.45, 0.26, 0.3], 14); jd.tube([[0, 0, -0.12], [0, 0, -0.1]], 0.12, WOOD, 16); jd.tube([[0, 0, 0.1], [0, 0, 0.12]], 0.12, WOOD, 16);
    jd.tube([[0, 0, 0.12], [0, 0, 0.17]], 0.016, STL, 8); jd.tube([[0, 0, 0.17], [0, 0.13, 0.17]], 0.013, STL, 6); jd.tube([[0, 0.13, 0.17], [0, 0.13, 0.26]], 0.02, BLK, 8);
    // luck charms: a string, a golden horseshoe for luxury luck (the others use a small fish)
    const cs = NB(); cs.tube([[0, 0, 0], [0, -0.1, 0]], 0.004, [0.1, 0.1, 0.1, 0.2], 5);
    const hs = NB(), HP = []; for (let i = 0; i <= 12; i++){ const a = -Math.PI * 0.85 + i / 12 * Math.PI * 1.7; HP.push([Math.sin(a) * 0.045, -0.15 - Math.cos(a) * 0.045, 0]); } hs.tube(HP, 0.009, [0.86, 0.68, 0.2, 0.95], 6);
    // electric jigging machine on the rail with its rod out over the side
    const mm = NB(); mm.rbox(0, 0, 0, 0.26, 0.26, 0.36, 0.05, [0.86, 0.87, 0.88, 0.6]); mm.rbox(0, -0.04, 0, 0.3, 0.05, 0.4, 0.02, [0.2, 0.22, 0.25, 0.4]); mm.tube([[0.14, 0.13, 0], [0.2, 0.13, 0]], 0.1, [0.25, 0.27, 0.3, 0.6], 12);
    mm.tube([[0.1, 0.2, 0], [0.8, 0.62, 0]], 0.018, [0.18, 0.2, 0.22, 0.7], 8); mm.tube([[0.78, 0.61, 0], [0.82, 0.63, 0]], 0.03, STL, 8);
    // the machine from tools/gear/juksamaskin.py in place of the drawn one: the body, the spool and the block's sheave, which turn
    let machG = null; if (typeof glbHas === 'function' && glbHas('gear-jig')){ const up = nm => { const o = glbPart('gear-jig', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; }, jg = glbLoad('gear-jig'), x = (jg && jg.ex) || {};
      const body = up('maskin'); if (body && x.tip) machG = {body, spool:up('spole'), sheave:up('skive'), x}; }
    // one fish, 1 m long along -z (head forward), coloured per species: back, belly
    const FC = {torsk:[[0.36, 0.33, 0.2, 0.5], [0.9, 0.88, 0.8, 0.5]], sei:[[0.2, 0.25, 0.24, 0.6], [0.72, 0.74, 0.74, 0.6]], hyse:[[0.28, 0.3, 0.33, 0.6], [0.85, 0.86, 0.88, 0.7]], lange:[[0.42, 0.36, 0.26, 0.5], [0.8, 0.76, 0.66, 0.5]], brosme:[[0.45, 0.33, 0.2, 0.5], [0.72, 0.6, 0.45, 0.5]], lyr:[[0.33, 0.32, 0.2, 0.55], [0.82, 0.8, 0.7, 0.6]], uer:[[0.72, 0.22, 0.14, 0.6], [0.92, 0.55, 0.42, 0.6]], kveite:[[0.26, 0.25, 0.2, 0.4], [0.94, 0.94, 0.92, 0.6]], blakveite:[[0.17, 0.16, 0.15, 0.4], [0.33, 0.31, 0.29, 0.5]]};
    const fishM = {}; for (const sp in FC){ const f = NB(), [back, belly] = FC[sp], G = [], NZ = 12, NA = 12;
      for (let i = 0; i <= NZ; i++){ const t = i / NZ, z = -0.5 + t, r = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.8) * 0.09 * (sp === 'lange' ? 0.7 : 1), row = []; for (let j = 0; j <= NA; j++){ const a = j / NA * Math.PI * 2; row.push([Math.cos(a) * r * 0.75, Math.sin(a) * r, z]); } G.push(row); }
      f.grid(G, (i, j) => (j < NA / 2 ? back : belly));
      f.tri([0, 0, 0.47], [0, 0.11, 0.6], [0, -0.11, 0.6], back); f.tri([0, 0.07, -0.15], [0, 0.15, 0.05], [0, 0.07, 0.1], back);
      if (sp === 'hyse') f.box(0.068, 0.005, 0.0, 0.004, 0.012, 0.7, [0.05, 0.05, 0.06, 0.3]);
      fishM[sp] = f.mesh(); }
    // the catch from tools/fish (fisk.py): one part per species and the king crab, 1 m long with the head at -z, in place of the
    // procedural fish above (which stand in when the data is missing)
    if (typeof glbHas === 'function' && glbHas('fish')) for (const sp of [...Object.keys(FC), 'krabbe']){ const o = glbPart('fish', sp);
      if (o) fishM[sp] = {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}; }

    const cvP = document.createElement('canvas'); cvP.width = 512; cvP.height = 320;
    const cvG = document.createElement('canvas'); cvG.width = 512; cvG.height = 256;
    const cvV = document.createElement('canvas'); cvV.width = 256; cvV.height = 140;
    const cvN = document.createElement('canvas'); cvN.width = 512; cvN.height = 128;
    SK = {hull, glass:gl2.mesh(), wheel:wh.mesh(), lever:lv.mesh(), motor:ob.mesh(), prop:prop.mesh(), cap:cap.mesh(),
      qPlot:texQuad(...scrPlot), qGauge:texQuad(...scrGauge), qVhf:texQuad(...scrVhf), qName:nq,
      skipper:pb.mesh(), crew:cb.mesh(), fishM, rodT:0, fisher:fb.mesh(), cstr:cs.mesh(), shoe:hs.mesh(), limb:lb.mesh(), hand:hb.mesh(), reelF:jf.mesh(), reelD:jd.mesh(), mach:machG ? machG.body : mm.mesh(), machG, anim:null, lines:[], tPlot:mkTex(), tGauge:mkTex(), tVhf:mkTex(), tName:mkTex(), cvP, cvG, cvV, cvN, nameKey:'',
      wheelAt:[0.02, 0.98, zb - 0.075], wheelTilt:0.42, leverAt:lvBox, motorAt:[0, 0.5, zs(0) + 0.02],
      needle:{rpm:0, fuel:0, temp:8, volt:12.6}, wheelA:0, headPrev:null, propA:0, tP:0, tG:0};
    SK.pp = {skipper:[0, 0.2, 0.8, false, [[-0.12, 1.12, 0.05], [0.16, 1.1, 0.05]]], crew:[0.26, 0.32, 1.16, true, null], fisher:[0, 0, 0, false, false]};
    if (glbHas('worker')) SK.wk = wkMeshes(lookMe());      // the fisher's arms, drawn live
    // the detailed model from tools/boats (skiff59.py): hull, glass, the lid, the outboard and its propeller from the GLB, and the places
    // from its anchors; the console's screens are part of the model and not live
    const GK = glbHas('skiff') ? geoOf('skiff') : null, A = GK && GK.skiff;
    if (A){
      const up = o => o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null;
      SK.hull = up(glbPart('skiff', 'lod0')) || SK.hull; SK.hullT = 'skiff'; SK.glass = up(glbPart('skiff', 'glass')) || SK.glass;
      SK.motor = up(glbPart('skiff', 'outboard')) || SK.motor; SK.prop = up(glbPart('skiff', 'prop')) || SK.prop; SK.propAt = A.prop;
      const cp = glbPart('skiff', 'cap'); if (cp){ const c = MB(); for (let i = 0; i < cp.p.length; i += 9) c.tri([cp.p[i], cp.p[i + 1], cp.p[i + 2]], [cp.p[i + 3], cp.p[i + 4], cp.p[i + 5]], [cp.p[i + 6], cp.p[i + 7], cp.p[i + 8]], [1, 1, 1]); SK.cap = c.mesh(); }
      SK.wheelAt = A.wheel; SK.wheelTilt = A.wheelTilt; SK.leverAt = A.lever; SK.motorAt = A.motor; SK.live = false;
      if (A.names) SK.qName = A.names.map(([B, T]) => texStrip(B, T));
      const w = A.wheel, ps = NB(); person(ps, A.skipper[0], A.skipper[1], A.skipper[2], false, [[w[0] - 0.14, w[1] + 0.14, w[2] + 0.05], [w[0] + 0.14, w[1] + 0.12, w[2] + 0.05]], lookMe()); SK.skipper = ps.mesh();
      const pc = NB(); person(pc, A.seat[0], A.seat[1], A.seat[2], true, null, lookCrew(0) || 'crew'); SK.crew = pc.mesh();
      SK.pp = {skipper:[A.skipper[0], A.skipper[1], A.skipper[2], false, [[w[0] - 0.14, w[1] + 0.14, w[2] + 0.05], [w[0] + 0.14, w[1] + 0.12, w[2] + 0.05]]], crew:[A.seat[0], A.seat[1], A.seat[2], true, null], fisher:[0, 0, 0, false, false]};
      for (const k of ['sole', 'tub', 'fisher', 'haul', 'reel', 'mach', 'stack', 'filler']) if (A[k]) SKA[k] = A[k];
      CHARM_AT = A.charm || CHARM_AT;
    }
  }
