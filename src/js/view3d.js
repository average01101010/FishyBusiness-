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
  const LITN_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uAlpha;uniform float uEmis;varying vec3 vW;varying vec3 vN;varying vec4 vC;' + PLG + WEAR_GL +
    'void main(){vec3 n=normalize(vN);vec3 V=normalize(-vW);if(dot(n,V)<0.0)n=-n;float dif=max(dot(n,uSun),0.0);vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 bc=vC.rgb;float gs=vC.a;if(uWear.x+uWear.y>0.0)wearHull(bc,gs);' +
    'float sp=pow(max(dot(reflect(-uSun,n),V),0.0),mix(12.0,90.0,gs))*gs;float fr=pow(1.0-max(dot(n,V),0.0),4.0)*gs*0.35;' +
    'vec3 c=bc*(amb+uSunCol*dif+pLit(vW,n))+uSunCol*sp*0.55+uAmb*1.2*fr+bc*uEmis;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),uAlpha);}';
  const TEX_VS = 'attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform mat4 uM;varying vec2 vUV;varying vec3 vW;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vUV=aUV;gl_Position=uVP*w;}';
  const TEX_FS = 'precision mediump float;uniform sampler2D uTex;uniform float uLit;uniform vec3 uN;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;varying vec2 vUV;varying vec3 vW;' +
    'void main(){vec4 t=texture2D(uTex,vUV);if(t.a<0.05)discard;vec3 c=uLit>0.5?t.rgb*(uAmb+uSunCol*max(dot(uN,uSun),0.0)):t.rgb;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),t.a);}';
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
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uAlpha, 1); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uWear, WEAR0);
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
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
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
  // ---------- the skiff's live instruments ----------
  const M4 = {
    T:(x, y, z) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]),
    RX:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); },
    RY:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); },
    RZ:a => { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); },
    S:k => new Float32Array([k,0,0,0, 0,k,0,0, 0,0,k,0, 0,0,0,1])
  };
  const chain = (...ms) => ms.reduce((a, b) => mul(a, b));
  let plotSmall = null, aisCache = {t:-1, v:[]};
  function engineOn(){ const st = S.boat.status; return st === 'sailing' || st === 'fishing' || st === 'idle' || st === 'returning' || st === 'unmooring' || MO.phase === 'in'; }
  function paintPlotter(){
    const g = SK.cvP.getContext('2d'), W = 512, Hc = 320, b = S.boat, p = {x:bv.x / 1000, y:bv.z / 1000}, Hn = S.t / 60, L = (no, en) => S.lang === 'no' ? no : en;
    g.fillStyle = '#0a1117'; g.fillRect(0, 0, W, Hc);
    // the chart shows ±1.1 km, more when the echo sounder's heat reaches further (CHIRP)
    const ht = typeof heatTier === 'function' ? heatTier() : null, top = 26, cw = 318, ch = Hc - top - 18, rng = Math.max(1.1, ht ? HEAT.tiers[ht].r * 1.05 : 0), sw = 106, sh = Math.round(sw * ch / cw), kpp = 2 * rng / sw, sd = safeDepth();
    plotSmall = plotSmall || document.createElement('canvas'); plotSmall.width = sw; plotSmall.height = sh;
    const sg = plotSmall.getContext('2d'), img = sg.createImageData(sw, sh), d = img.data, dok = mapViewReady(p.x - sw * kpp / 2, p.y - sh * kpp / 2, p.x + sw * kpp / 2, p.y + sh * kpp / 2);
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++){
      const q = {x:p.x + (i + 0.5 - sw / 2) * kpp, y:p.y + (j + 0.5 - sh / 2) * kpp}, o = (j * sw + i) * 4; let c;
      if (q.x < MAPB.x0 || q.y < MAPB.y0 || q.x > MAPB.x1 || q.y > MAPB.y1) c = [60, 66, 70]; else if (isLand(q)) c = [224, 206, 150]; else { const dd = dok ? depthF(q) : 50; c = dd < Math.min(2, sd / 2) ? [128, 176, 222] : dd < sd ? [165, 202, 234] : dd < 30 ? [236, 243, 248] : [250, 252, 253]; }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    sg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(plotSmall, 0, top, cw, ch);
    const X = x => (x - p.x) / kpp * (cw / sw), Y = y => top + ch / 2 + (y - p.y) / kpp * (cw / sw);
    g.save(); g.beginPath(); g.rect(0, top, cw, ch); g.clip();
    // the echo sounder's heat map, the same as on the chart plotter (ui/03c-heat.js)
    if (typeof heatDrawInto === 'function') heatDrawInto(g, p, cw / 2, top + ch / 2, cw / (2 * rng), true);   // without the blur filter (costly on a tablet)
    // route and trail
    if (S.plan){ g.strokeStyle = '#d6336c'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(p.x) + cw / 2, Y(p.y)); for (const w of S.plan.wps.slice(S.plan.idx)) g.lineTo(X(w.x) + cw / 2, Y(w.y)); g.stroke(); }
    // other vessels
    if (Hn - aisCache.t > 0.02 || aisCache.t < 0){ aisCache = {t:Hn, v:npcStates(Hn).filter(aisShown)}; }
    // the other players in gold, larger and ringed, as on the chart (ui/03-map.js)
    for (const n of aisCache.v){ const x = X(n.p.x) + cw / 2, y = Y(n.p.y), k = n.player ? 1.45 : 1; if (x < -10 || x > cw + 10 || y < top - 10 || y > top + ch + 10) continue;
      if (n.player){ g.strokeStyle = 'rgba(242,179,61,.75)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 17, 0, Math.PI * 2); g.stroke(); }
      g.save(); g.translate(x, y); g.rotate(n.cog !== undefined ? n.cog : n.hd); g.fillStyle = n.player ? '#f2b33d' : n.fleet || n.coast ? '#ff8a65' : '#4c8df0'; g.strokeStyle = '#1b2a33'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -9 * k); g.lineTo(5 * k, 6 * k); g.lineTo(0, 3 * k); g.lineTo(-5 * k, 6 * k); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // own boat with heading line
    g.save(); g.translate(cw / 2, top + ch / 2); g.rotate(bv.head); g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -60); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 10); g.lineTo(0, 5); g.lineTo(-8, 10); g.closePath(); g.fill(); g.restore();
    g.restore();
    // scale bar
    g.fillStyle = '#123'; g.font = '600 13px system-ui, sans-serif'; g.fillText('0,5 nm', 10, top + ch - 10); g.fillRect(10, top + ch - 26, (0.926 / kpp) * (cw / sw) / 1, 3);
    // echo sounder on the right
    const ec = document.getElementById('echo'), ex = cw + 4, ew = W - ex;
    g.fillStyle = '#021628'; g.fillRect(ex, top, ew, ch);
    if (INSTR.echoOn()){
      if (ec && ec.width) g.drawImage(ec, ex, top, ew, ch);
      const dep = Math.max(0.8, depthF(p) + tideCD(Hn));
      g.fillStyle = '#fff'; g.font = '700 30px system-ui, sans-serif'; g.fillText(fmt(dep, dep < 100 ? 1 : 0), ex + 8, top + 34); g.font = '600 13px system-ui, sans-serif'; g.fillText('m', ex + 12 + g.measureText(fmt(dep, dep < 100 ? 1 : 0)).width * 2.3, top + 34);
    } else { g.fillStyle = '#5f7d8c'; g.font = '700 16px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(L('EKKOLODD AV', 'SOUNDER OFF'), ex + ew / 2, top + ch / 2); g.textAlign = 'left'; }
    // data bars
    g.fillStyle = '#152029'; g.fillRect(0, 0, W, top); g.fillRect(0, Hc - 18, W, 18);
    g.fillStyle = '#9fe3c6'; g.font = '600 15px ui-monospace, monospace'; const sog = b.status === 'port' ? 0 : b.v;
    g.fillText('SOG ' + fmt(sog, 1) + ' kn', 10, 18);
    g.textAlign = 'right'; g.fillText(hm(Hn), W - 10, 18); g.textAlign = 'left';
    g.fillStyle = '#7fa5b6'; g.font = '12px ui-monospace, monospace'; const ll = LL(p); g.fillText(ll.lat.toFixed(4) + '°N  ' + ll.lon.toFixed(4) + '°E', 10, Hc - 5);
    upTex(SK.tPlot, SK.cvP);
  }
  function dial(g, cx, cy, r, v0, v1, v, a0, a1, ticks, labels, title, redFrom){
    g.fillStyle = '#f4f4f2'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#9aa0a6'; g.lineWidth = r * 0.07; g.beginPath(); g.arc(cx, cy, r * 0.97, 0, Math.PI * 2); g.stroke();
    const ang = t => a0 + (a1 - a0) * t;
    if (redFrom !== undefined){ g.strokeStyle = '#d33'; g.lineWidth = r * 0.08; g.beginPath(); g.arc(cx, cy, r * 0.8, ang((redFrom - v0) / (v1 - v0)), a1); g.stroke(); }
    g.strokeStyle = '#111'; for (let i = 0; i <= ticks; i++){ const a = ang(i / ticks), big = labels && i % (ticks / (labels.length - 1)) === 0; g.lineWidth = big ? r * 0.05 : r * 0.025; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * (big ? 0.68 : 0.76), cy + Math.sin(a) * r * (big ? 0.68 : 0.76)); g.lineTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); g.stroke(); }
    if (labels){ g.fillStyle = '#111'; g.font = '700 ' + Math.round(r * 0.2) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; labels.forEach((l, i) => { const a = ang(i / (labels.length - 1)); g.fillText(l, cx + Math.cos(a) * r * 0.52, cy + Math.sin(a) * r * 0.52); }); }
    g.fillStyle = '#333'; g.font = '600 ' + Math.round(r * 0.13) + 'px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, cx, cy + r * 0.34);
    const a = ang(clamp((v - v0) / (v1 - v0), 0, 1)); g.strokeStyle = '#e8401c'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12); g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); g.stroke();
    g.fillStyle = '#222'; g.beginPath(); g.arc(cx, cy, r * 0.11, 0, Math.PI * 2); g.fill(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }
  function paintGauges(dt){
    const g = SK.cvG.getContext('2d'), W = 512, Hc = 256, b = S.boat, on = engineOn(), N = SK.needle, k = Math.min(1, dt * 3);
    const frac = on ? clamp(b.v / BOAT.vmax, 0, 1) : 0, rpmT = on ? 750 + Math.pow(frac, 0.85) * 5150 + (b.status === 'fishing' ? 150 : 0) : 0;
    N.rpm += (rpmT - N.rpm) * k; N.fuel += (b.fuel / BOAT.fuelCap - N.fuel) * k; N.temp += ((on ? 72 : 8) - N.temp) * Math.min(1, dt * 0.2); N.volt += ((on ? 14.2 : 12.6) - N.volt) * k;
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, '#2b2e32'); bg.addColorStop(1, '#16181b'); g.fillStyle = bg; g.fillRect(0, 0, W, Hc);
    dial(g, 256, 128, 112, 0, 6000, N.rpm, Math.PI * 0.75, Math.PI * 2.25, 30, ['0', '1', '2', '3', '4', '5', '6'], 'RPM x1000', 5500);
    // hour meter in the tachometer
    g.fillStyle = '#9fb49a'; g.fillRect(222, 168, 68, 18); g.fillStyle = '#1b2418'; g.font = '700 14px ui-monospace, monospace'; g.textAlign = 'center'; g.fillText(fmt(b.engH || 0, 1) + 'h', 256, 182); g.textAlign = 'left';
    dial(g, 72, 76, 58, 0, 1, N.fuel, Math.PI * 1.15, Math.PI * 1.85, 8, ['E', '½', 'F'], 'FUEL', undefined);
    dial(g, 72, 196, 50, 40, 120, N.temp, Math.PI * 1.15, Math.PI * 1.85, 8, ['40', '80', '120'], '°C', 105);
    dial(g, 440, 76, 58, -1, 1, on ? -0.2 + frac * 0.5 : -0.9, Math.PI * 1.15, Math.PI * 1.85, 8, ['↓', '', '↑'], 'TRIM', undefined);
    g.fillStyle = '#0d1512'; g.fillRect(398, 150, 86, 40); g.fillStyle = '#ff4a3a'; g.font = '700 26px ui-monospace, monospace'; g.fillText(fmt(N.volt, 1), 405, 180); g.fillStyle = '#aab'; g.font = '11px system-ui, sans-serif'; g.fillText('V', 470, 180);
    const warn = [['OIL', on && b.status !== 'port' ? 0 : 1], ['TEMP', N.temp > 105 ? 1 : 0], ['BATT', on ? 0 : 1]];
    warn.forEach((w, i) => { g.fillStyle = w[1] ? '#e33' : '#3a1414'; g.beginPath(); g.arc(404 + i * 32, 214, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#aab'; g.font = '9px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(w[0], 404 + i * 32, 236); g.textAlign = 'left'; });
    upTex(SK.tGauge, SK.cvG);
  }
  function paintVhf(){
    const g = SK.cvV.getContext('2d'), W = 256, Hc = 140, Hn = S.t / 60;
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, '#ffb24a'); bg.addColorStop(1, '#f08a24'); g.fillStyle = bg; g.fillRect(0, 0, W, Hc);
    g.fillStyle = '#3a1c05'; g.font = '700 16px ui-monospace, monospace'; g.fillText('25W  DSC', 10, 22); g.fillText('G', 10, 118); g.font = '700 17px ui-monospace, monospace'; g.fillText(hm(Hn), 30, 118);
    g.font = '800 78px ui-monospace, monospace'; g.textAlign = 'right'; g.fillText('16', W - 12, 92); g.textAlign = 'left';
    g.font = '600 12px ui-monospace, monospace'; g.fillText(windAt(Hn) >= 13.9 ? (S.lang === 'no' ? 'KULINGVARSEL' : 'GALE WARNING') : 'INT  SQL:2', 10, 44);
    g.fillText('CH ▲  CH ▼', 150, 130);
    upTex(SK.tVhf, SK.cvV);
  }
  // the name on the hull: light on a dark hull, dark on a light one (vessel3d.js hullRGB), so it reads on every boat and every paint
  function paintName(t, liv){
    const nm = S.boatName || 'Havbris', c = hullRGB(t || vtype(), liv !== undefined ? liv : hullLiv(S.boat)), light = isLight(c), key = nm + (light ? '|l' : '|d');
    if (SK.nameKey === key) return; SK.nameKey = key;
    nameCanvas(SK.cvN, nm, light); upTex(SK.tName, SK.cvN);
  }
  // the registration mark: block letters, white on dark paint and black on light (§ 23: white on black or black on white), by the paint
  // under the letters (vessel3d.js markRGB: the hull's, or a stripe's where the mark could find no place off it)
  function markCanvas(cv, txt, light){
    const g = cv.getContext('2d'); g.clearRect(0, 0, 512, 128); g.fillStyle = light ? '#f6f6f2' : '#101215'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 96; g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; while (g.measureText(txt).width > 470 && fs > 30){ fs -= 4; g.font = '800 ' + fs + 'px "Arial Narrow", Arial, sans-serif'; }
    g.fillText(txt, 256, 68);
  }
  const MARKT = {tex:null, cv:null, key:''};
  function markTex(t, liv){
    const txt = regText(regOf(S.boat)), c = markRGB(t || vtype(), liv !== undefined ? liv : hullLiv(S.boat)), light = isLight(c), key = txt + (light ? '|l' : '|d');
    if (!txt) return null; if (MARKT.key !== key){ MARKT.key = key; if (!MARKT.tex){ MARKT.tex = mkTex(); MARKT.cv = document.createElement('canvas'); MARKT.cv.width = 512; MARKT.cv.height = 128; } markCanvas(MARKT.cv, txt, light); upTex(MARKT.tex, MARKT.cv); }
    return MARKT.tex;
  }
  // the company logo: on the own boat the one being tried in the paint shop, else the company's once it is theirs; another player's from
  // her paint code (made ones drawn here, pictures fetched by her id, ui/10h-world.js peerLogo). Textures in a small pool by what they show.
  const LOGOIMG = {}, LTX = new Map(); let LCV = null;
  function imgOf(src){ if (!src) return null; let im = LOGOIMG[src]; if (!im){ im = LOGOIMG[src] = new Image(); im.src = src; } return im; }
  function curLogo(){ return PAINTPRE && PAINTPRE.logo !== undefined ? PAINTPRE.logo : COSOWN('logo') ? S.logo : null; }
  function logoTexOf(L, img){
    if (!L) return null; const ready = L.kind !== 'u' || (img && img.complete && img.naturalWidth); if (!ready) return null;
    const k = L.kind === 'u' ? 'u:' + img.src.length + ':' + img.src.slice(-24) : logoStr(L); let e = LTX.get(k);
    if (!e){ if (LTX.size >= 8){ let old = null; for (const [kk, v] of LTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); LTX.delete(old[0]); }
      if (!LCV){ LCV = document.createElement('canvas'); LCV.width = LCV.height = 256; } logoCanvas(LCV, L, img); e = {tex:mkTex(), cv:null}; upTex(e.tex, LCV); LTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  const LOGOQ = {};
  function logoQ(t){ if (!(t in LOGOQ)){ const st = logoStrips(t); LOGOQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return LOGOQ[t]; }
  function drawLogo(t, M, VP, L, img){ const q = L && logoQ(t), tex = q && logoTexOf(L, img); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  const ownLogo = () => { const L = curLogo(); return [L, L && L.kind === 'u' ? imgOf(L.img) : null]; };
  const MARKQ = {};
  function markQ(t){ if (!(t in MARKQ)){ const st = markStrips(t); MARKQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return MARKQ[t]; }
  function drawMark(t, M, VP, liv){ const q = markQ(t), tex = q && markTex(t, liv); if (!tex) return; gl.disableVertexAttribArray(2); for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]); }
  function nameCanvas(cv, nm, light){
    const g = cv.getContext('2d'); g.clearRect(0, 0, 512, 128); g.fillStyle = light ? '#f3f1e8' : '#14233d'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = light ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.3)'; g.shadowBlur = 3;
    let fs = 78; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; while (g.measureText(nm).width > 480 && fs > 30){ fs -= 4; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; }
    g.fillText(nm, 256, 66); g.shadowBlur = 0;
  }
  const isLight = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] < 0.5;
  // the names of the other boats: a small pool of textures by name and shade (the boats near you change seldom), the oldest let go
  const NTX = new Map(); let NCV = null;
  function nameTex(nm, light, mark){
    const k = (mark ? 'M:' : '') + nm + (light ? '|l' : '|d'); let e = NTX.get(k);
    if (!e){ if (NTX.size >= 14){ let old = null; for (const [kk, v] of NTX) if (!old || v.used < old[1].used) old = [kk, v]; gl.deleteTexture(old[1].tex); NTX.delete(old[0]); }
      if (!NCV){ NCV = document.createElement('canvas'); NCV.width = 512; NCV.height = 128; }
      (mark ? markCanvas : nameCanvas)(NCV, nm, light); e = {tex:mkTex()}; upTex(e.tex, NCV); NTX.set(k, e); }
    e.used = performance.now(); return e.tex;
  }
  // the six nearest boats within 250 m that are drawn near (their glass is in) carry their names on the hull, light or dark by her paint
  function drawNPCNames(kit, VP){
    const near = []; for (const n of kit){ if (!n.name || !n.K || !n.K.glass) continue; n.dd = Math.hypot(n.M[12], n.M[14]); if (n.dd < 250) near.push(n); }
    if (!near.length) return; near.sort((a, b) => a.dd - b.dd); gl.disableVertexAttribArray(2);
    for (const n of near.slice(0, 6)){
      const t = npcType(n), q = nameQ(t); if (!q) continue;
      const lv = n.player ? livParse(n.liv) : LIVERY[(n.liv || 0) % LIVERY.length], c = lv && lv.hull ? lv.hull : hullRGB(t);
      const tex = nameTex(String(n.name).slice(0, 24), isLight(c)), M = chain(n.M, n.K.S);
      for (const s of q) drawTexQuad(s, tex, M, VP, true, [0, 0.2, 0]);
      const mk = n.player && livMark(n.liv), mq = mk && markQ(t); if (mq){ const mt = nameTex(mk, isLight(markRGB(t, lv)), true); for (const s of mq) drawTexQuad(s, mt, M, VP, true, [0, 0.2, 0]); }
      const lg = n.player && logoParse(n.liv); if (lg) drawLogo(t, M, VP, lg, lg.kind === 'u' && typeof peerLogo === 'function' ? peerLogo(String(n.id).slice(1), lg.ver) : null);
      const pn = n.player && livPen(n.liv), mt = pn && mastTop(geoOf(t)); if (mt){ gl.disableVertexAttribArray(2); drawTexQuad(FLAGM, penTex(), chain(M, chain(model(mt[0], mt[1], mt[2], Math.PI / 2, 0, 0), PEN_S[Math.min(3, pn) - 1])), VP, true, [0, 0.6, 0]); }   // the week's pennants
    }
  }
  // the name strips of a type that is not steered by hand (vessel3d.js nameStrips), built once
  const NAMEQ = {};
  function nameQ(t){ if (!(t in NAMEQ)){ const st = nameStrips(t); NAMEQ[t] = st ? st.map(([B, T]) => texStrip(B, T)) : null; } return NAMEQ[t]; }
  // the hand-steered boat's paint (vessel3d.js hullLiv): the hull's colours uploaded again when it changes
  function paintHand(){
    const lv = hullLiv(S.boat), k = livKey(lv); if ((SK.livK || '') === k || !SK.hullT) return; SK.livK = k;
    const part = glbPart(SK.hullT, 'lod0'); if (!part) return;
    const o = lv && DESIGNS.some(q => lv[q]) ? glbDesign(SK.hullT, part, lv) : glbPaint(part, lv);
    if (o.p.length === SK.hull.n * 3){ gl.bindBuffer(gl.ARRAY_BUFFER, SK.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(o.c), gl.STATIC_DRAW); return; }
    // a design that cuts the hull: new buffers for the shape (the old ones go)
    for (const b of [SK.hull.pb, SK.hull.nb, SK.hull.cb]) gl.deleteBuffer(b);
    SK.hull = {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3};
  }
  function limbM(A, B, r){ const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, z = d.map(v => v / L), up = Math.abs(z[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]; const xl = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / xl); const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return new Float32Array([x[0] * r, x[1] * r, x[2] * r, 0, y[0] * r, y[1] * r, y[2] * r, 0, z[0] * L, z[1] * L, z[2] * L, 0, A[0], A[1], A[2], 1]); }
  function drawSkiff(BMrel, VP, dt, showSkipper, showCrew){
    if (!SK) return; const b = S.boat;
    // wheel follows the turn rate, the outboard follows the wheel, the lever follows the speed
    if (SK.headPrev === null) SK.headPrev = bv.head; const rate = angDiff(SK.headPrev, bv.head) / Math.max(dt, 1e-3); SK.headPrev = bv.head;
    SK.wheelA += (clamp(rate * 9, -2.4, 2.4) - SK.wheelA) * Math.min(1, dt * 2.5);
    const on = engineOn(), frac = on ? clamp(b.v / BOAT.vmax, 0, 1) : 0; SK.propA += (on ? 6 + frac * 120 : 0) * dt;
    nSetup(VP);
    const fishing = S.boat.status === 'fishing' && !S.boat.deckStop;   // with all hands on deck, nobody fishes
    refreshPeople(SK); paintHand(); const wr = wearOn(vtype()); drawN(SK.hull, BMrel); if (wr) wearOff(); if (showSkipper && !fishing) drawN(SK.skipper, BMrel); if (showCrew) drawN(SK.crew, BMrel);
    SK.rodT += dt; SK.lines = [];
    const T = SK.rodT, A = SK.anim || (SK.anim = {mode:null, st:'jig', t:0, fish:[], fly:[], th:0, mc:[], bq:[], bl:null});
    const kv = S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60), mode = !fishing ? null : S.boat.gop ? 'gear' : (!kv && S.equip && S.equip.jukse > 0 && !window.jigActive) ? 'machine' : (S.boat.gear || kv) ? 'juksa' : null;
    if (mode !== A.mode){ A.mode = mode; A.st = 'jig'; A.t = 0; A.fish = []; A.fly = []; A.mc = []; A.bq = []; A.bl = null; }
    // fish reported by the fishing step; stale ones (3D was off) are dropped
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now();
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!mode) Q.length = 0;
    const airKg = Q.reduce((a, f) => a + f.kg, 0) + A.fish.reduce((a, f) => a + f.kg, 0) + A.fly.reduce((a, f) => a + f.kg, 0) + A.mc.reduce((a, m) => a + (m.fish || []).reduce((c, f) => c + f.kg, 0), 0);
    // the catch in the tub: one fish per ~5 kg, species in proportion to the hold; fish still in the air are not in it yet
    // (in the kit's 300 l tub where the model has its place, tools/deck/fisk.py; else in the model's own box)
    const KTq = ((GEO(vtype()) || {}).kit || {}).tubs, KTp = KTq && KTq[0], KTm = KTp && kit('fish', 'kar' + (KTp[4] || 300)), tb = KTm ? 0.14 : 0.05;
    KST.htub = 0; if (KTm){ drawN(KTm, chain(BMrel, M4.T(KTp[0], KTp[1], KTp[2]), M4.RY(KTp[3] || 0))); KST.htub = 1; }
    { const all = S.hold.reduce((a, x) => a + x.kg, 0), tot = Math.max(0, all - airKg), n = Math.min(40, Math.ceil(tot / 5)); if (n > 0){ const cum = []; let acc = 0; for (const sp of ALLSP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
      for (let i = 0; i < n; i++){ const r = hash(i * 7 + 3), sp = (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0], rz = M4.RZ(sp === 'krabbe' ? 0 : Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), sc = M4.S((0.42 + hash(i * 13) * 0.12) * (sp === 'krabbe' ? 1.7 : 1));
        // in the kit's tub lengthwise, two across and two along, ten layers to the rim; in the model's own box across it as before
        if (KTm){ const lay = Math.floor(i / 4), k = i % 4; drawN(fishOf(sp), chain(BMrel, M4.T(KTp[0], KTp[1], KTp[2]), M4.RY(KTp[3] || 0), M4.T(-0.14 + (k % 2) * 0.28 + (hash(i * 3 + 1) - 0.5) * 0.04, tb + lay * 0.05, -0.22 + Math.floor(k / 2) * 0.44), M4.RY((k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.3), rz, sc)); continue; }
        const lay = Math.floor(i / 8), k = i % 8, x = SKA.tub[0] - 0.18 + (k % 2) * 0.36 + (hash(i * 3 + 1) - 0.5) * 0.06, z = SKA.tub[2] - 0.16 + Math.floor(k / 2) * 0.11;
        drawN(fishOf(sp), chain(BMrel, M4.T(x, SKA.tub[1] + tb + lay * 0.05, z), M4.RY(Math.PI / 2 + (k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.4), rz, sc)); } } }
    // luck aboard: a charm swinging from the grab rail
    if (S.haill && haillF() > 0){ const CM = chain(BMrel, M4.T(CHARM_AT[0], CHARM_AT[1], CHARM_AT[2]), M4.RZ(Math.sin(T * 1.3) * 0.18), M4.RX(Math.sin(T * 0.9) * 0.12)); drawN(SK.cstr, CM);
      if (S.haill.type === 'luksus') drawN(SK.shoe, CM); else drawN(SK.fishM.torsk, chain(CM, M4.T(0, -0.17, 0), M4.RX(Math.PI / 2), M4.S(0.16))); }
    const L2R = q => xf(BMrel, q), fsc = kg => clamp(0.42 * Math.cbrt(kg), 0.28, 1.2);
    const hang = (sp, kg, P, w) => drawN(fishOf(sp), chain(BMrel, M4.T(P[0], P[1] - fsc(kg) * 0.45, P[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + w) * 0.45), M4.S(fsc(kg))));
    const TUB = [SKA.tub[0], SKA.tub[1] + 0.42, SKA.tub[2] - 0.05], F = SKA.fisher;
    // fish swung from the rail into the tub
    for (let i = A.fly.length - 1; i >= 0; i--){ const f = A.fly[i]; f.u += dt / 0.75; if (f.u >= 1){ A.fly.splice(i, 1); continue; }
      const u = f.u; hang(f.sp, f.kg, [f.a[0] + (TUB[0] - f.a[0]) * u, f.a[1] + (TUB[1] - f.a[1]) * u + Math.sin(Math.PI * u) * 0.45, f.a[2] + (TUB[2] - f.a[2]) * u], i); }
    if (mode){
      const FP = chain(M4.T(F[0], F[1], F[2]), M4.RY(-Math.PI / 2)); drawN(SK.fisher, chain(BMrel, FP));
      const shY = SK.wk ? WK_SH : 1.3, shR = xf(FP, [0.2, shY, 0]), shL = xf(FP, [-0.2, shY, 0]); let hR, hL;
      A.t += dt;
      if (mode === 'gear'){
        const RL = SKA.haul, w = T * 3.2, hauling = S.boat.gop.op === 'haul';
        hR = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w)), RL[2] + 0.12]; hL = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w + Math.PI)), RL[2] - 0.12];
        SK.lines.push([L2R(RL), L2R([RL[0] + 1.4, -0.3, RL[2] - 1.0])]);
        if (hauling && Q.length && (A.t > 0.9) && !A.bl && !A.bq.length){ const f = Q.shift(); A.bq.push({...f, a:[RL[0] - 0.05, RL[1] + 0.1, RL[2]], u:0}); A.t = 0; }
      } else if (mode === 'juksa'){
        // hand jig: the left hand works the line over the roller; on a bite the right hand cranks it up with a fish on the pilk and the fly hooks
        const C = SKA.reel, RL = [C[0] + 0.14, C[1] - 0.05, C[2]], WX = C[0] + 0.3;
        if (A.st === 'jig' && Q.length && (Q.length >= 3 || nowT - Q[0].t > 2500)){ A.fish = Q.splice(0, 5); A.st = 'haul'; A.t = 0; A.d0 = -1.6 - 0.55 * A.fish.length; }
        let jig = 0; if (A.st === 'jig') jig = Math.pow(Math.max(0, Math.sin(T * 2.4)), 3); else A.th += dt * 10;
        drawN(SK.reelF, chain(BMrel, M4.T(C[0], C[1], C[2]))); drawN(SK.reelD, chain(BMrel, M4.T(C[0], C[1], C[2]), M4.RZ(A.th)));
        hR = [C[0] - 0.13 * Math.sin(A.th), C[1] + 0.13 * Math.cos(A.th), C[2] + 0.26];
        hL = A.st === 'jig' ? [RL[0] - 0.02, RL[1] + 0.12 + 0.3 * jig, RL[2] - 0.02] : [RL[0] - 0.05, RL[1] + 0.06, RL[2]];
        const top = [RL[0], RL[1] + 0.04, RL[2]];
        if (A.st === 'jig'){ SK.lines.push([L2R([C[0] + 0.02, C[1] + 0.08, C[2]]), L2R(hL)], [L2R(hL), L2R(top)], [L2R(top), L2R([WX, -0.3, C[2]])]); }
        else {
          const end = A.d0 + A.t * 1.6;       // the pilk comes up at about 1.6 m/s
          SK.lines.push([L2R([C[0] + 0.02, C[1] + 0.08, C[2]]), L2R(top)]);
          let low = null;
          for (let i = A.fish.length - 1; i >= 0; i--){ const f = A.fish[i], y = end + i * 0.55;       // pilk at the end, fly hooks above it
            if (y >= RL[1] - 0.1){ A.bq.push({...f, a:[WX - 0.05, RL[1], C[2]], u:0}); A.fish.splice(i, 1); continue; }
            const P = [WX + 0.04 * Math.sin(T * 3 + i), y, C[2]]; if (y > -0.2) hang(f.sp, f.kg, P, i + 1); low = low || P; }
          SK.lines.push([L2R(top), L2R(low || [WX, Math.min(RL[1], end), C[2]])]);
          if (!A.fish.length && A.t > 0.8){ A.st = 'jig'; A.t = 0; }
        }
      } else {
        // jigging machines on the rail work by themselves; the fisher takes the fish off as they come up
        const n = Math.min(3, S.equip.jukse);
        while (A.mc.length < n) A.mc.push({st:'jig', t:0, fish:[]});
        let busy = null;
        for (let k = 0; k < n; k++){ const m = A.mc[k], P = SKA.mach[k], G = SK.machG, tip = G ? [P[0] + G.x.tip[0], P[1] + G.x.tip[1], P[2] + G.x.tip[2]] : [P[0] + 0.8, P[1] + 0.62, P[2]]; m.t += dt;
          drawN(SK.mach, chain(BMrel, M4.T(P[0], P[1], P[2])));
          // the spool jerks the jig up and down while it fishes and runs the line in fast when fish are on; the sheave follows the line
          if (G){ const was = m.a || 0; m.a = m.st === 'jig' ? 1.6 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3) : was - dt * 9;
            const sp = G.x.spool, sh = G.x.sheave, sa = m.a;
            if (G.spool) drawN(G.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]), M4.RZ(sa)));
            if (G.sheave) drawN(G.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]), M4.RZ(sa * G.x.spoolR / G.x.sheaveR)));
            SK.lines.push([L2R([P[0] + sp[0], P[1] + sp[1] + G.x.spoolR, P[2] + sp[2]]), L2R([P[0] + G.x.lead[0], P[1] + G.x.lead[1], P[2] + G.x.lead[2]])]); }
          if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.4 - 0.5 * m.fish.length; }
          if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
          else { const end = m.d0 + m.t * 1.3; let low = null;
            for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
              if (y >= tip[1] - 0.35){ A.bq.push({...f, a:[tip[0] - 0.2, tip[1] - 0.35, tip[2]], u:0}); m.fish.splice(i, 1); busy = tip; continue; }
              const Pf = [tip[0], y, tip[2]]; if (y > -0.2) hang(f.sp, f.kg, Pf, i + k * 3); low = low || Pf; if (y > tip[1] - 1.0) busy = tip; }
            SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
            if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
        hR = busy ? [busy[0] - 0.35, busy[1] - 0.45, busy[2] + 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] + 0.12]; hL = busy ? [busy[0] - 0.4, busy[1] - 0.5, busy[2] - 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] - 0.12];
      }
      // every fish is bled before it goes in the tub (Jonas 20.10.2026): he takes it in at the rail, holds it up by the head, the knife across the
      // throat and the blood running, and tosses it in the tub; the machines and the line wait meanwhile (one at a time, the next one queued)
      let kDir = null; if (!A.bl && A.bq.length) A.bl = {f:A.bq.shift(), t:0};
      if (A.bl){ const B = A.bl, f = B.f, c = (B.t += dt), ch = [F[0] + 0.36, F[1] + shY - 0.18, F[2] - 0.08], kU = [F[0] + 0.3, F[1] + shY - 0.05, F[2] + 0.2], kD = [F[0] + 0.42, F[1] + shY - 0.24, F[2] - 0.02], ease = u => u * u * (3 - 2 * u), L3 = (P, Q2, u) => [P[0] + (Q2[0] - P[0]) * u, P[1] + (Q2[1] - P[1]) * u, P[2] + (Q2[2] - P[2]) * u];
        if (c < 0.4){ hL = L3(f.a, ch, ease(c / 0.4)); hang(f.sp, f.kg, hL, 2); }
        else if (c < 1.45){ hL = ch; hang(f.sp, f.kg, hL, 2 + Math.sin(c * 7) * 0.1); hR = L3(kU, kD, ease(clamp((c - 0.45) / 0.35, 0, 1)));
          kDir = [0.6, -0.6, -0.4];   // (the knife is drawn in the right hand's grip, below with the arms)
          if (c > 0.75){ const sc = fsc(f.kg), th = xf(BMrel, [ch[0], ch[1] - sc * 0.12, ch[2]]), U = xf(BMrel, TUB); for (let i = 0; i < 10; i++){ const u = ((c - 0.75) * 1.6 + hash(i * 5) * 0.6) % 1; DKBLOOD.push([th[0] + (U[0] - th[0]) * 0.2 * u + (hash(i) - 0.5) * 0.03, th[1] - 0.9 * u * u, th[2] + (U[2] - th[2]) * 0.2 * u + (hash(i + 3) - 0.5) * 0.03]); } } }
        else { A.fly.push({sp:f.sp, kg:f.kg, a:ch, u:0}); A.bl = null; A.nb = (A.nb || 0) + 1; } }   // (nb: bled, for the tests)
      // arms: shoulder to hand with the elbow bent down and out
      const arm = (Sw, Hw, sd, sp) => { const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), seg = 0.31, Lc = Math.min(Lh, 2 * seg * 0.995);
        let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
        const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
        if (SK.wk){ const W = SK.wk, f = [Hc[0] - E[0], Hc[1] - E[1], Hc[2] - E[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1, HT = [Hc[0] + f[0] / fl * WK_S, Hc[1] + f[1] / fl * WK_S, Hc[2] + f[2] / fl * WK_S];
          drawN(W.uarm, chain(BMrel, limbM(Sw, E, WK_S))); drawN(W.farm, chain(BMrel, limbM(E, Hc, WK_S)));
          // the hands in their grips (hender.py): relaxed, the palm in and down; round the knife's handle when it bleeds a fish
          const HM = handMeshes(); if (!HM){ drawN(W.hand, chain(BMrel, limbM(Hc, HT, WK_S))); return Hc; }
          const s2 = sp || {g:'relax', n:[-sd * 0.9, -0.4, 0]}, Fr = handFrame(nrm3(f), s2, sd), gd = (HM.grip[s2.g] || HM.grip.relax)[sd > 0 ? 'R' : 'L'];
          drawN(HM[sd > 0 ? 'R' : 'L'][s2.g] || HM[sd > 0 ? 'R' : 'L'].relax, chain(BMrel, handMtx(Fr, Hc), M4.S(WK_S))); return add3(Hc, mul3(inFrame(Fr, gd.at), WK_S)); }
        drawN(SK.limb, chain(BMrel, limbM(Sw, E, 0.056))); drawN(SK.limb, chain(BMrel, limbM(E, Hc, 0.048))); drawN(SK.hand, chain(BMrel, M4.T(Hc[0], Hc[1], Hc[2]))); return Hc; };
      const gR = arm(shR, hR, 1, kDir ? {g:'grip', a:kDir, tool:true} : null); arm(shL, hL, -1);
      if (kDir && gR){ const kn = kit('fish', 'kniv'); if (kn) drawN(kn, chain(BMrel, toolM(gR, kDir))); }
      if (DKBLOOD.length) dkBloodDraw(VP);
    }
    if (SK.wheelAt){
      drawN(SK.wheel, chain(BMrel, M4.T(...SK.wheelAt), M4.RX(-SK.wheelTilt), M4.RZ(SK.wheelA)));
      drawN(SK.lever, chain(BMrel, M4.T(...SK.leverAt), M4.RX(-(0.1 + frac * 0.9))));
      const MM = chain(BMrel, M4.T(...SK.motorAt), M4.RY(-SK.wheelA * 0.1), M4.RX(on ? 0.05 : 0));
      drawN(SK.motor, MM); drawN(SK.prop, chain(MM, M4.T(...(SK.propAt || [0, -1.0, 0.54])), M4.RZ(SK.propA)));
    } else {
      // an inboard boat with a tiller: the tiller swings about the rudder head as she turns, the propeller turns under the stern
      if (SK.tiller && SK.tillerAt) drawN(SK.tiller, chain(BMrel, M4.T(...SK.tillerAt), M4.RY(SK.wheelA * 0.3)));
      if (SK.prop && SK.propAt) drawN(SK.prop, chain(BMrel, M4.T(...SK.propAt), M4.RZ(SK.propA * 0.35)));
    }
    gl.disableVertexAttribArray(2);
    // screens and name boards up close
    const near = Math.hypot(BMrel[12], BMrel[13], BMrel[14]) < 45, now = performance.now();
    if (!S.unnamed){ paintName(); for (const q of SK.qName) drawTexQuad(q, SK.tName, BMrel, VP, true, [0, 0.2, 0]); }   // an unnamed boat has her mark only
    drawMark(SK.hullT || vtype(), BMrel, VP); drawLogo(SK.hullT || vtype(), BMrel, VP, ...ownLogo());
    if (near && SK.live !== false){
      if (now - SK.tP > 500){ SK.tP = now; paintPlotter(); if (S.equip.vhf) paintVhf(); }
      if (now - SK.tG > 90){ paintGauges((now - SK.tG) / 1000); SK.tG = now; }
      drawTexQuad(SK.qPlot, SK.tPlot, BMrel, VP, false); drawTexQuad(SK.qGauge, SK.tGauge, BMrel, VP, false); if (S.equip.vhf) drawTexQuad(SK.qVhf, SK.tVhf, BMrel, VP, false);
    }
  }
  function drawSkiffGlass(BMrel, VP){ if (SK) drawGlass(SK.glass, BMrel, VP); }
  // the jigging machines on a boat with a wheelhouse (Jonas 13.10.2026: «alle båter utenom havflåten skal ha anledning til å bruke
  // juksamaskin»): up to three on the starboard rail by the working deck, clear of the hauler. Where the rail is, is read off the
  // boat's own model once per type: in a slice across her at each place, the top of the outermost part of her side.
  const JIGR = {}, JIG_Z = {breisjark:[3.5, 4.25, 5.0]};    // where the side is covered forward (her shelter), the open deck aft
  function jigRail(t, G){
    if (t in JIGR) return JIGR[t];
    const m = vesselModel(t), P = m && m.o && m.o.p, out = [];
    if (P && G && G.deck){ const half = (G.beam || 3) / 2, hz = G.hauler ? G.hauler[2] : 1e9, st = G.stern || 4, bw = G.bow != null ? G.bow : -st, dy = G.deck.y;
      // the places to try: out from the middle of the working deck both ways, clear of the hauler and the ends
      const zs = JIG_Z[t] || [...Array(24).keys()].map(k => G.deck.z + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.35).filter(z => Math.abs(z - hz) > 0.6 && z < st - 0.9 && z > bw + 1.5);
      for (const z of zs){ if (out.length >= 3) break; if (out.some(q => Math.abs(q[2] - z) < 0.7)) continue;
        let xm = 0; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 2] - z) < 0.12 && P[i] > xm && P[i] < half + 0.3) xm = P[i];
        if (xm < half * 0.6) continue;
        // the top of her side there, a rail between knee and hip height over the deck
        let ym = -1e9; for (let i = 0; i < P.length; i += 3) if (Math.abs(P[i + 2] - z) < 0.12 && P[i] > xm - 0.18 && P[i + 1] > ym && P[i + 1] < dy + 1.3) ym = P[i + 1];
        if (ym < dy + 0.35) continue;
        out.push([xm - 0.05, ym, z]); }
      out.sort((a, b) => a[2] - b[2]); }
    return (JIGR[t] = out);
  }
  const JA = {mc:[], t:null};
  function drawJigRail(BMrel, VP, t, G, dt){
    if (!SK) return; SK.lines = []; SK.rodT = (SK.rodT || 0) + dt;
    // the machines stay bolted to the rail whatever she does; they run (spool, line, fish) only while she jigs with them
    const b = S.boat, own = S.equip && S.equip.jukse > 0, run = own && b.status === 'fishing' && !b.gop && !window.jigActive && !(S.target === 'kveite' && b.kgear), MG = SK.machG;
    if (!own || !MG){ JA.mc = []; return; }
    nSetup(VP);
    if (JA.t !== t){ JA.t = t; JA.mc = []; }
    const spots = jigRail(t, G), n = Math.min(3, S.equip.jukse, spots.length); if (!n) return;
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now(), T = (SK.rodT || 0), L2R = q => xf(BMrel, q), x = MG.x, sp = x.spool, sh = x.sheave;
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!run){ JA.mc = []; for (let k = 0; k < n; k++){ const P = spots[k]; drawN(MG.body, chain(BMrel, M4.T(P[0], P[1], P[2])));
      if (MG.spool) drawN(MG.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]))); if (MG.sheave) drawN(MG.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]))); } return; }
    while (JA.mc.length < n) JA.mc.push({st:'jig', t:0, fish:[], a:0});
    for (let k = 0; k < n; k++){ const m = JA.mc[k], P = spots[k], tip = [P[0] + x.tip[0], P[1] + x.tip[1], P[2] + x.tip[2]]; m.t += dt;
      drawN(MG.body, chain(BMrel, M4.T(P[0], P[1], P[2])));
      if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.6 - 0.5 * m.fish.length; }
      m.a = m.st === 'jig' ? 1.6 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3) : m.a - dt * 9;
      if (MG.spool) drawN(MG.spool, chain(BMrel, M4.T(P[0] + sp[0], P[1] + sp[1], P[2] + sp[2]), M4.RZ(m.a)));
      if (MG.sheave) drawN(MG.sheave, chain(BMrel, M4.T(P[0] + sh[0], P[1] + sh[1], P[2] + sh[2]), M4.RZ(m.a * x.spoolR / x.sheaveR)));
      SK.lines.push([L2R([P[0] + sp[0], P[1] + sp[1] + x.spoolR, P[2] + sp[2]]), L2R([P[0] + x.lead[0], P[1] + x.lead[1], P[2] + x.lead[2]])]);
      if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
      else { const end = m.d0 + m.t * 1.3; let low = null;
        // the fish come up on the line and are taken in over the rail at the top (onto the deck, where the catch is shown)
        for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
          if (y >= tip[1] - 0.35){ m.fish.splice(i, 1); dkEvent('bleed', tip, f.sp, f.kg); continue; }
          const sc = clamp(0.42 * Math.cbrt(f.kg), 0.28, 1.2), Pf = [tip[0], y, tip[2]];
          if (y > -0.2) drawN(SK.fishM[f.sp] || SK.fishM.torsk, chain(BMrel, M4.T(Pf[0], Pf[1] - sc * 0.45, Pf[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + i + k * 3) * 0.45), M4.S(sc)));
          low = low || Pf; }
        SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
        if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
  }
  function drawGlass(m, BMrel, VP){
    if (!m || !m.n) return; nSetup(VP); gl.uniform1f(PRGN.u.uAlpha, 0.2);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    drawN(m, BMrel); gl.disableVertexAttribArray(2);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.useProgram(PL.p);
  }
  function buildBoat(){
    const m = MB(), cap = MB(), NS = 16, Lh = 5.8;
    const bw = s => s < 0.35 ? 1.0 + 0.1 * s / 0.35 : 1.1 * Math.sqrt(Math.max(0, 1 - ((s - 0.35) / 0.65) ** 2));
    const gy = s => 0.55 + 0.3 * s * s, ky = s => -0.32 + 0.22 * s * s, chy = s => -0.08 + 0.12 * s * s, zs = s => 2.9 - s * Lh;
    const prof = s => { const b = bw(s), g = gy(s), z = zs(s); return [[-b,g,z],[-b * 0.98,g - 0.12,z],[-0.84 * b,chy(s),z],[0,ky(s),z],[0.84 * b,chy(s),z],[b * 0.98,g - 0.12,z],[b,g,z]]; };
    const cols = [NAVY, WHITE, RED, RED, WHITE, NAVY];
    for (let i = 0; i < NS; i++){
      const s0 = i / NS, s1 = (i + 1) / NS, A = prof(s0), B2 = prof(s1);
      for (let j = 0; j < 6; j++) m.quad(A[j], A[j + 1], B2[j + 1], B2[j], cols[j]);
      if (s1 <= 0.87){ const f0 = 0.74 * bw(s0), f1 = 0.74 * bw(s1); m.quad([-f0,0.12,zs(s0)], [f0,0.12,zs(s0)], [f1,0.12,zs(s1)], [-f1,0.12,zs(s1)], FLOOR); }
      if (s0 >= 0.8) m.quad([-bw(s0),gy(s0),zs(s0)], [bw(s0),gy(s0),zs(s0)], [bw(s1),gy(s1),zs(s1)], [-bw(s1),gy(s1),zs(s1)], WHITE);
      cap.quad([-bw(s0),gy(s0) - 0.03,zs(s0)], [bw(s0),gy(s0) - 0.03,zs(s0)], [bw(s1),gy(s1) - 0.03,zs(s1)], [-bw(s1),gy(s1) - 0.03,zs(s1)], WHITE);
    }
    const T = prof(0), c = [0, 0.12, 2.9];
    for (let j = 0; j < 6; j++) m.tri(c, T[j], T[j + 1], WHITE); m.tri(c, T[6], T[0], WHITE);
    m.box(0, 0.12, 0.2, 0.8, 0.95, 0.55, [0.84, 0.86, 0.87], 0);
    m.box(0, 1.07, -0.02, 0.8, 0.3, 0.05, GLASS, 0);
    const c2 = MB(); c2.box(0, 0.64, -1.0, 0.36, 0.14, 0.4, [0.2, 0.24, 0.32], 0); c2.box(0, 0.72, -1.02, 0.4, 0.5, 0.26, [0.95, 0.75, 0.15], 0); c2.box(0, 1.22, -1.02, 0.22, 0.24, 0.22, SKIN, 0); c2.box(0, 1.44, -1.02, 0.25, 0.07, 0.25, [0.6, 0.1, 0.1], 0); CREW2M = c2.mesh();
    const pm = MB(); pm.box(-0.1, 0.2, 0.78, 0.15, 0.8, 0.2, [0.14, 0.17, 0.24], 0); pm.box(0.1, 0.2, 0.78, 0.15, 0.8, 0.2, [0.14, 0.17, 0.24], 0); pm.box(0, 1.0, 0.78, 0.44, 0.58, 0.3, ORANGE, 0); pm.box(-0.2, 1.22, 0.55, 0.09, 0.09, 0.42, ORANGE, 0.05); pm.box(0.2, 1.22, 0.55, 0.09, 0.09, 0.42, ORANGE, -0.05); pm.box(0, 1.58, 0.78, 0.24, 0.26, 0.24, SKIN, 0); pm.box(0, 1.84, 0.78, 0.27, 0.08, 0.27, NAVY, 0); PERSONM = pm.mesh();
    m.box(0, 0.55, 3.08, 0.42, 0.52, 0.55, DARK, 0);
    m.box(0, -0.55, 3.1, 0.14, 1.1, 0.18, [0.28, 0.3, 0.33], 0);
    m.box(-0.78, 0.55, 2.72, 0.04, 1.3, 0.04, GREY, 0);
    BOATM = m.mesh(); CAPM = cap.mesh();
    const r = MB(); r.beam([0.28, 1.25, 0.62], [1.95, 2.0, 0.3], 0.018, DARK); RODM = r.mesh();
  }
  const FW = 22, FH = 16, FLAG_W = 0.6, FLAG_H = 0.44;
  function buildFlag(){
    const col = [];
    for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){
      const blue = i === 7 || i === 8 || j === 7 || j === 8, white = (i >= 6 && i <= 9) || (j >= 6 && j <= 9);
      const k = blue ? [0, 0.13, 0.36] : white ? [0.95, 0.95, 0.95] : [0.73, 0.05, 0.18];
      for (let v = 0; v < 6; v++) col.push(k[0], k[1], k[2]);
    }
    // the picture's coordinates for the cloth (vessel3d.js flagCanvas: the hoist at u = 0, the top of the picture at the top)
    const uv = []; for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){ const u0 = i / FW, u1 = (i + 1) / FW, v0 = 1 - j / FH, v1 = 1 - (j + 1) / FH; uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1); }
    FLAGM = {pb:buf(new Float32Array(FW * FH * 18), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), cb:buf(new Float32Array(col)), ub:buf(new Float32Array(uv)), n:FW * FH * 6, pos:new Float32Array(FW * FH * 18), tex:null, key:''};
  }
  // the ensign the boat flies (Malerverkstedet: the nation and the shape, b.liv.flag; tried on while the paint shop is open)
  function flagTex(){
    const f = flagOf(PAINTPRE || S.boat.liv); let L = null, img = null, lk = '';
    if (f.code === 'LOGO'){ [L, img] = ownLogo(); if (L && (L.kind !== 'u' || (img && img.complete && img.naturalWidth))) lk = L.kind === 'u' ? 'u' + (L.img || '').length : logoStr(L); else f.code = 'NO'; }
    const k = f.code + '|' + f.shape + '|' + lk;
    if (FLAGM.key !== k){ FLAGM.key = k; if (!FLAGM.tex) FLAGM.tex = mkTex(); if (!FLAGM.cv){ FLAGM.cv = document.createElement('canvas'); FLAGM.cv.width = 256; FLAGM.cv.height = 188; }
      let lc = null; if (lk){ lc = document.createElement('canvas'); lc.width = lc.height = 256; logoCanvas(lc, L, img); }
      flagCanvas(FLAGM.cv, f.code, f.shape, lc); upTex(FLAGM.tex, FLAGM.cv); }
    return f;
  }
  // the week's pennants (core/09f-merker.js; Jonas 07.10.2026): the Norwegian pennant at the masthead, longer for each chapter finished,
  // on your own boat and on other players' (their paint code's p:N, vessel3d.js livPen). It flies on the ensign's own waving cloth
  // (FLAGM), drawn long and thin; the cloth's picture is the red tapering pennant with the cross's white and blue running lengthwise
  // to the tip (what is outside is clear and not drawn)
  const PEN_S = [2.8, 3.4, 4].map(sx => new Float32Array([sx, 0, 0, 0, 0, 0.65, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]));   // about 1.7, 2 and 2.4 m by 0.3 m
  let PENT = null;
  function penTex(){
    if (PENT) return PENT;
    const W = 512, H = 256, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    // a band of k times the pennant's height, tapering with it from the hoist to a blunt tip
    const band = (k, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H / 2 * (1 - k)); g.lineTo(W, H / 2 - 12 * k); g.lineTo(W, H / 2 + 12 * k); g.lineTo(0, H / 2 * (1 + k)); g.closePath(); g.fill(); };
    band(1, '#ba0c2f'); band(0.32, '#f4f4f0'); band(0.16, '#00205b');
    // mipmapped, so the thin stripes stay whole at a distance; the clear texels take the red, so the smaller levels get no dark rim
    const im = g.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) if (!d[i + 3]){ d[i] = 186; d[i + 1] = 12; d[i + 2] = 47; }
    PENT = mkTex(); upTex(PENT, im); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); return PENT;
  }
  // the masthead: the highest of the boat's lights (a detailed model's and a kit model's alike) when it is above the ensign's pole.
  // A boat with no mast flies no pennant, only the ensign (Jonas 07.10.2026): the open boats, whose highest light is the stern lantern or
  // the all-round light on a stake by the ensign's pole (within a metre of it); the snekke's all-round light sits on her mast amidships
  function mastTop(G){ if (!G) return null; let top = null;
    for (const L of G.lights || []) if (L && L[0] && L[2] !== 'stern' && L[2] !== 'work' && (!top || L[0][1] > top[1])) top = L[0];
    if (!top || (G.pole && (top[1] <= G.pole[1] || Math.hypot(top[0] - G.pole[0], top[2] - G.pole[2]) < 1.0))) return null;
    return [top[0], top[1] + 0.3, top[2]]; }
  function updateFlag(t, appW){
    const droop = (1 - sstep(1.5, 8, appW)) * 1.25, amp = 0.03 + 0.09 * sstep(2, 16, appW), om = 4 + appW * 1.1;
    const P3 = (u, v) => { const z = amp * (u / FLAG_W) * Math.sin(u * 11 - t * om + v * 3); return [u * Math.cos(droop), v - FLAG_H - u * Math.sin(droop), z]; };
    const a = FLAGM.pos; let k = 0;
    for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++){
      const u0 = i / FW * FLAG_W, u1 = (i + 1) / FW * FLAG_W, v0 = j / FH * FLAG_H, v1 = (j + 1) / FH * FLAG_H;
      const p00 = P3(u0, v0), p10 = P3(u1, v0), p11 = P3(u1, v1), p01 = P3(u0, v1);
      for (const q of [p00, p10, p11, p00, p11, p01]){ a[k++] = q[0]; a[k++] = q[1]; a[k++] = q[2]; }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, FLAGM.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, a);
  }

  // ---------- sea ----------
  const HALF = 300; let NP = 150, curFov = 0.96;   // the wave patch: 600 m, 150 cells a side (4 m), 300 on ultra (2 m)
  function buildPatch(){
    if (PATCH){ gl.deleteBuffer(PATCH.pb); gl.deleteBuffer(PATCH.ib); }
    const v = new Float32Array((NP + 1) * (NP + 1) * 2); let k = 0;
    for (let j = 0; j <= NP; j++) for (let i = 0; i <= NP; i++){ v[k++] = -HALF + i * 2 * HALF / NP; v[k++] = -HALF + j * 2 * HALF / NP; }
    const big = (NP + 1) * (NP + 1) > 65536, idx = big ? new Uint32Array(NP * NP * 6) : new Uint16Array(NP * NP * 6); k = 0;
    for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++){ const a = j * (NP + 1) + i, b = a + 1, c = a + NP + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    PATCH = {pb:buf(v), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, i32:big, np:NP};
  }
  function buildSea(){
    buildPatch(); let k = 0;
    const NG = 48, g = new Float32Array((NG + 1) * (NG + 1) * 2); k = 0;
    for (let j = 0; j <= NG; j++) for (let i = 0; i <= NG; i++){ g[k++] = -1 + 2 * i / NG; g[k++] = -1 + 2 * j / NG; }
    const gi = new Uint16Array(NG * NG * 6); k = 0;
    for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++){ const a = j * (NG + 1) + i, b = a + 1, c = a + NG + 1, d = c + 1; gi[k++] = a; gi[k++] = c; gi[k++] = b; gi[k++] = b; gi[k++] = c; gi[k++] = d; }
    FARQ = {pb:buf(g), ib:buf(gi, gl.ELEMENT_ARRAY_BUFFER), n:gi.length};
    SKYQ = buf(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]));
  }
  // ---------- the waves: wind sea and swell from the sea model (03b-sea.js) ----------
  const WL = [96, 67, 49, 36.5, 27.5, 20.5, 15.3, 11.4, 8.6, 6.4], WOFF = [0, -0.46, 0.53, -0.92, 0.27, 0.84, -0.21, 1.12, -0.68, 0.41], WPH = [0, 2.1, 4.4, 1.3, 5.6, 3.2, 0.7, 4.9, 2.6, 5.9];
  // the swell: three long waves around its peak wavelength (deep water L = 1.56 T^2), from its own direction
  const SWL = [0.8, 1.0, 1.25], SWW = [0.55, 1, 0.6], SWOFF = [-0.14, 0, 0.17], SWPH = [1.7, 4.2, 0.4];
  const WV = {hs:0.3, W:5, dir:0, swHs:0, swDir:0, swTp:10, init:false, list:[], ph:[], kd:[], ua:new Float32Array(52), ub:new Float32Array(52), C:0, cap:0, lnFcap:1, dot:1, steep:0.3, loc:[0.3, 0, 1, 1]};
  // a broad spectrum around the peak wavelength; short waves keep a little energy so the surface always has texture (sum of squares 1/8, so Hs = 1)
  function specW(L0){ const w = WL.map(L => Math.exp(-(((Math.log(L) - Math.log(L0)) / 0.75) ** 2)) + 0.06 * Math.min(1, L0 / L)), n = Math.sqrt(w.reduce((a, c) => a + c * c, 0)) * 2.828; return w.map(v => v / n); }
  function updateWaves(dt, H){
    const p = {x:bv.x / 1000, y:bv.z / 1000}, gT = gridGamma(p), hsT = hsAt(p, H), WT = windAt(H, p), wdT = windDir(H, p) - gT, dirT = (wdT + 180) * DEG, SW = swellOpen(H, p), swDirT = (SW.dir - gT + 180) * DEG;   // the world is drawn on the grid: true directions turn by -gamma
    if (!WV.init){ WV.hs = hsT; WV.W = WT; WV.dir = dirT; WV.swHs = SW.hs; WV.swDir = swDirT; WV.swTp = SW.tp; WV.init = true; }
    // the sea answers the wind over a few seconds (a sudden change, as after skipping time, never snaps the waves)
    const k = 1 - Math.exp(-dt / 4); WV.hs = lerp(WV.hs, hsT, k); WV.W = lerp(WV.W, WT, k); WV.swHs = lerp(WV.swHs, SW.hs, k); WV.swTp = lerp(WV.swTp, SW.tp, k * 0.2);
    WV.dir += angDiff(WV.dir, dirT) * Math.min(1, dt / 12); WV.swDir += angDiff(WV.swDir, swDirT) * Math.min(1, dt / 30);
    // the wind sea grows over the fetch to WMO's open-sea height; its spectrum goes from a young sea (1 km of fetch) to the grown one
    const U = Math.max(0.3, WV.W), Fc = Math.max(1.01, fetchCap(U)), L0 = T => 9.81 * T * T / (2 * Math.PI);
    WV.C = 0.0016 * U * Math.sqrt(1000 / 9.81); WV.cap = hsWMO(U); WV.lnFcap = Math.log(Fc);
    const wo = specW(L0(Math.max(0.5, tpWind(U, Fc)))), wy = specW(L0(Math.max(0.5, tpWind(U, 1))));
    WV.dot = 8 * wo.reduce((a, v, i) => a + v * wy[i], 0); WV.steep = 0.25 + 0.45 * sstep(4, 14, U);
    const f = (((wdT % 360) + 360) % 360) / FETCH.sec; SSK = [Math.floor(f) % 36, (Math.floor(f) + 1) % 36]; SSU = f - Math.floor(f);
    const L = [];
    WL.forEach((Lw, i) => { const kk = 2 * Math.PI / Lw, ang = WV.dir + WOFF[i] * (0.75 + 0.25 * sstep(3, 12, U)); L.push({Dx:Math.sin(ang), Dz:-Math.cos(ang), k:kk, wo:wo[i], wy:wy[i], swell:0, om:Math.sqrt(9.81 * kk), ph0:WPH[i]}); });
    const sn = Math.sqrt(SWW.reduce((a, c) => a + c * c, 0)) * 2.828, Ls = 1.56 * WV.swTp * WV.swTp;
    SWL.forEach((m, j) => { const kk = 2 * Math.PI / (Ls * m), ang = WV.swDir + SWOFF[j]; L.push({Dx:Math.sin(ang), Dz:-Math.cos(ang), k:kk, wo:SWW[j] / sn, wy:SWW[j] / sn, swell:1, om:Math.sqrt(9.81 * kk), ph0:SWPH[j]}); });
    // as a wave turns or lengthens, its phase is held where the boat is, so the sea does not slide past her (the map is 80 km across)
    L.forEach((c, i) => { const kx = c.k * c.Dx, kz = c.k * c.Dz;
      if (WV.kd[i]) WV.ph[i] = ((WV.ph[i] + (WV.kd[i][0] - kx) * bv.x + (WV.kd[i][1] - kz) * bv.z) % 6.2832 + 6.2832) % 6.2832; else WV.ph[i] = c.ph0;
      WV.kd[i] = [kx, kz]; c.ph = WV.ph[i]; WV.ua.set([c.Dx, c.Dz, c.k, c.wo], i * 4); WV.ub.set([c.swell, c.om, c.ph, c.wy], i * 4); });
    WV.list = L;
    // the same at the boat: for the vertex shader on a GPU that cannot read textures there, and until the textures are ready
    const q = hsParts(p, H), rF = Math.sqrt(q.F); WV.loc = [Math.min(WV.cap, WV.C * rF), WV.swHs * swellFactor(p), clamp(2 * Math.log(Math.max(rF, 1)) / WV.lnFcap, 0, 1), rF];
    env.windDir = [Math.sin(dirT), -Math.cos(dirT)]; env.wind = WV.W;
  }

  // ---------- the near field: the short sea rides with the boat ----------
  // The game's clock runs 6x real time, so the boat covers six times the ground a real boat would while the waves move at their real
  // speed; the water then raced past the hull and she skipped the chop (Jonas 19.10.2026: «hva ser best ut?»). The short wind waves
  // (4-9), the ripples and the foam's mottle are therefore carried along with the boat at 1 - 1/rate of her movement over the ground
  // (5/6 at 6x; nothing at real time), as a phase offset per wave (exact, kept within a turn) and a shifted position for the ripples and
  // the foam (wrapped at 64 km, when she is slow). The long waves and the swell stand in the world, so land, buoys and other boats
  // still pass at the game's speed, and what passes the hull passes at her real speed through the water. «#nf0» in the address turns
  // it off, for the comparison.
  const NF = {on:!/nf0/.test(location.hash), ph:new Float32Array(13), gp:new Float32Array(13), D:new Float64Array(2), lx:null, lz:null, R:0};
  function nfStep(){
    const TAU = 2 * Math.PI, dx = NF.lx == null ? 0 : bv.px - NF.lx, dz = NF.lz == null ? 0 : bv.pz - NF.lz; NF.lx = bv.px; NF.lz = bv.pz;
    NF.R = NF.on ? clamp(1 - 1 / (typeof simRate === 'function' ? simRate() : 6), 0, 1) : 0;
    if (!NF.R || Math.hypot(dx, dz) > 300) return;   // off, real time, or a jump (a teleport, a new place): the field stays
    const ex = dx * NF.R, ez = dz * NF.R;
    for (let i = 4; i < 10; i++){ const c = WV.list[i]; if (!c) continue; const a = c.Dx * ex + c.Dz * ez, g = c.Dz * ex - c.Dx * ez;
      NF.ph[i] = (NF.ph[i] + c.k * a) % TAU; NF.gp[i] = (NF.gp[i] + c.k * (0.083 * a + 0.041 * g)) % TAU; }
    NF.D[0] += ex; NF.D[1] += ez;
    for (let k = 0; k < 2; k++) if (Math.abs(NF.D[k]) > 65536 && (bv.spd < 1 || Math.abs(NF.D[k]) > 120000)) NF.D[k] -= Math.sign(NF.D[k]) * 65536;
  }

  // ---------- the boat's own waves (the uniforms of WAKE_GLSL) ----------
  // The regime follows the Froude number Fr = v / sqrt(g L) with the hull's length from VESSELS: below about 0.4 a displacement hull
  // makes transverse and divergent waves and a stern wave that breaks near hull speed; a planing hull (Fr > 1) leaves mostly divergent
  // waves and a flat white wash. v is the boat's real speed (the scene runs faster than real time, the waves are drawn for the real speed).
  const WK = {u0:new Float64Array(4), u1:new Float32Array(4), u2:new Float32Array(4), u3:new Float32Array(4), Fr:0};
  function updateWake(){
    // the boat's speed through the water from the simulation (the drawn speed also catches up on lag, which is not the hull's speed)
    const VG = GEO(vtype()), kn = S.boat.status === 'sailing' ? S.boat.v || 0 : 0, v = kn * 0.5144, Lb = BOAT.len || 6, Fr = v / Math.sqrt(9.81 * Lb); WK.Fr = Fr; WK.kn = kn;
    if (v < 0.8){ WK.u3[3] = 0; return; }
    const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), k0 = 9.81 / (v * v), lam = 2 * Math.PI / k0;
    const A = Math.min(0.6, 0.045 * Lb * sstep(0.12, 0.38, Fr) * (1 - 0.55 * sstep(0.6, 1.5, Fr)));
    // in a turn the straight pattern reaches only as far as it stays within a few metres of the curved track; the foam trail goes on
    const R = bv.spd / Math.max(Math.abs(bv.yr || 0), 1e-3), smax = Math.min(clamp(10 * Lb, 40, 120), Math.sqrt(6 * R) + 8);
    const Ab = Math.min(0.6, 0.12 * v * v / (2 * 9.81)) * sstep(0.1, 0.35, Fr) * (1 - 0.5 * sstep(0.9, 1.6, Fr));
    WK.u0.set([bv.x - fx * VG.stern, bv.z - fz * VG.stern, fx, fz]); WK.u1.set([k0, A, 1 - sstep(0.55, 1.0, Fr), smax]); WK.u2.set([VG.stern - VG.bow, Ab, (VG.beam || 2.4) / 2, Fr]);
    WK.u3.set([sstep(0.28, 0.5, Fr), sstep(0.3, 0.45, Fr) * (1 - sstep(0.9, 1.2, Fr)), sstep(2.5, 5, lam / (2 * HALF / NP)), 1]);
  }
  // the long wake waves as the vertex shader lifts them (for what lies on the water, like the foam trail)
  function wakeHFast(x, z){
    if (WK.u3[3] < 0.5 || WK.u3[2] <= 0) return 0;
    const rx = x - WK.u0[0], rz = z - WK.u0[1], s = -(rx * WK.u0[2] + rz * WK.u0[3]), q = Math.abs(rx * WK.u0[3] - rz * WK.u0[2]), L = WK.u2[0], k = WK.u1[0];
    if (s <= 0 || s > WK.u1[3] || q > s * 0.42 + L * 0.6 + 4) return 0;
    const e = s * 0.3536, a = WK.u1[1] * (1 - sstep(WK.u1[3] * 0.55, WK.u1[3], s)) * sstep(0, 1.2, s);   // as wakeH: no step at the stern
    return (WK.u1[2] * a / Math.sqrt(1 + s / L) * Math.cos(k * s) * (1 - sstep(e * 0.75, e * 1.02, q)) * 0.75 + a * Math.pow(1 + s / L, -0.333) * Math.sin(1.5 * k * (0.816 * s + 0.577 * q)) * Math.exp(-(((q - e) / (0.1 * s + 1.2)) ** 2))) * WK.u3[2];
  }

  // ---------- the sea state over the near terrain and the whole map ----------
  // Two textures, as SEA_STATE reads them: n (32 x 32 over the near terrain) and w (128 x 128 over the map). Each holds the root of the
  // fetch for a 10 degree sector per pixel, worked out a slice per frame and kept per sector, so a turning wind needs only the new sector.
  const SSRT = Math.sqrt(FETCH.open);
  let SSK = [0, 1], SSU = 0;   // the sectors either side of the wind, and the blend between them
  // brect, sec, sw, job: what is being worked out; rect, tex, cpu, k: what is shown. The shown texture stays until the new one is ready,
  // so when the near terrain moves the sea never falls back to the coarse map for a moment (no sudden change in the waves)
  function ssLevel(n, unit){ return {n, unit, brect:null, rect:null, sec:new Map(), sw:null, tex:null, cpu:null, k:[-1, -1], job:null, on:false}; }
  const SSL = {n:ssLevel(32, 4), w:ssLevel(128, 5)};
  function ssRect(L){ return L === SSL.n ? (NEARM ? [NEARM.x0, NEARM.z0, NEARM.sx] : null) : TERR ? [TERR.x0, TERR.z0, TERR.sx] : null; }   // the wide one follows the far terrain
  function ssWork(L, until){
    const R = ssRect(L); if (!R) return;
    let fresh = false; if (!L.brect || L.brect[0] !== R[0] || L.brect[1] !== R[1] || L.brect[2] !== R[2]){ L.brect = R; L.sec.clear(); L.sw = null; L.job = null; fresh = true; }
    const n = L.n, px = R[2] / n, at = i => ({x:(R[0] + (i % n + 0.5) * px) / 1000, y:(R[1] + (Math.floor(i / n) + 0.5) * px) / 1000});
    if (!L.sw){ L.sw = new Uint8Array(n * n); for (let i = 0; i < n * n; i++) L.sw[i] = Math.round(clamp(swellFactor(at(i)), 0, 1) * 255); }
    while (performance.now() < until){
      if (!L.job){ const k = SSK.find(q => !L.sec.has(q)); if (k === undefined) break; L.job = {k, i:0, a:new Uint8Array(n * n)}; }
      const J = L.job, p = at(J.i), r = L === SSL.n ? fetchSector(p, J.k) : Math.sqrt(fetchAt(p, J.k * FETCH.sec));
      J.a[J.i] = Math.round(clamp(r / SSRT, 0, 1) * 255);
      if (++J.i >= n * n){ L.sec.set(J.k, J.a); L.job = null; for (const q of L.sec.keys()) if (L.sec.size > 6 && !SSK.includes(q)) L.sec.delete(q); }
    }
    if (fresh) L.fresh = true;
    if (L.sec.has(SSK[0]) && L.sec.has(SSK[1]) && (L.k[0] !== SSK[0] || L.k[1] !== SSK[1] || L.fresh)){
      const A = L.sec.get(SSK[0]), B = L.sec.get(SSK[1]), px4 = new Uint8Array(n * n * 4);
      for (let i = 0; i < n * n; i++){ px4[i * 4] = A[i]; px4[i * 4 + 1] = B[i]; px4[i * 4 + 2] = L.sw[i]; px4[i * 4 + 3] = 255; }
      L.tex = L.tex || gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.tex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, px4);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
      L.cpu = px4; L.k = [SSK[0], SSK[1]]; L.rect = L.brect; L.fresh = false; L.on = true;
    }
  }
  // a slice per frame, more when frames are slow (so a slow machine is not left waiting for many frames)
  function ssStep(rdt){ const until = performance.now() + clamp(rdt * 60, 1.5, 25); ssWork(SSL.n, until); ssWork(SSL.w, until); }
  // the blend between a texture's two sectors: while a new sector is worked out, hold the one it shares with the old pair
  function ssBlend(L){ return L.k[0] === SSK[0] && L.k[1] === SSK[1] ? SSU : L.k[1] === SSK[0] ? 1 : L.k[0] === SSK[1] ? 0 : SSU; }
  // a texture as the GPU reads it (linear, clamped to the edge), 0-1 per channel
  function ssTex(L, x, z, out){
    const n = L.n, R = L.rect, gx = clamp((x - R[0]) / R[2] * n - 0.5, 0, n - 1), gy = clamp((z - R[1]) / R[2] * n - 0.5, 0, n - 1), i = Math.min(n - 2, Math.floor(gx)), j = Math.min(n - 2, Math.floor(gy)), fx = gx - i, fy = gy - j, T = L.cpu;
    for (let c = 0; c < 3; c++){ const a = (j * n + i) * 4 + c, b = a + n * 4; out[c] = ((T[a] * (1 - fx) + T[a + 4] * fx) * (1 - fy) + (T[b] * (1 - fx) + T[b + 4] * fx) * fy) / 255; }
    return out;
  }
  // the local sea at (x, z), as seaAt in the shaders: wind sea height, swell height, how grown the sea is, the root of the fetch
  const SST_A = [0, 0, 0], SST_B = [0, 0, 0];
  function ssAt(x, z){
    if (!SSL.w.on) return WV.loc;
    const W = ssTex(SSL.w, x, z, SST_A); let r = lerp(W[0], W[1], ssBlend(SSL.w)), sf = W[2];
    const N = SSL.n; if (N.on){ const R = N.rect, ux = (x - R[0]) / R[2], uz = (z - R[1]) / R[2], e = sstep(0, 0.06, Math.min(ux, uz, 1 - ux, 1 - uz)); if (e > 0){ const T = ssTex(N, x, z, SST_B); r = lerp(r, lerp(T[0], T[1], ssBlend(N)), e); sf = lerp(sf, T[2], e); } }
    r *= SSRT; return [Math.min(WV.cap, WV.C * r), WV.swHs * sf, clamp(2 * Math.log(Math.max(r, 1)) / WV.lnFcap, 0, 1), r];
  }
  // the sea's height at (x, z) as the wave patch draws it: the same waves with the local heights, groups, fading and the Gerstner shift
  // undone (two steps back to the rest point that moved there). seaHFast skips the undoing (the wake, which lies across the waves anyway).
  const SEA_D = [0, 0, 0, 0];
  function seaDisp(x, z, t, S, fade){
    let dx = 0, dy = 0, dz = 0, dn = 0; const ren = 1 / Math.sqrt(Math.max(1 - 2 * S[2] * (1 - S[2]) * (1 - WV.dot), 0.05)), cell = 2 * HALF / NP;
    for (let i = 0; i < WV.list.length; i++){
      const c = WV.list[i], att = sstep(2.5, 5, 2 * Math.PI / (c.k * cell)); if (att <= 0) continue;
      const am0 = c.swell ? S[1] * c.wo : S[0] * (S[2] * c.wo + (1 - S[2]) * c.wy) * ren, Q = c.swell ? 0.3 : Math.min(WV.steep / (10 * c.k * am0 + 1e-4), 1);
      const grp = 0.62 + 0.38 * Math.sin((x * c.Dx + z * c.Dz) * c.k * 0.083 + (x * c.Dz - z * c.Dx) * c.k * 0.041 - c.om * t * 0.5 + i * 2.59 - NF.gp[i]);
      const am = am0 * grp * att * fade, f = c.k * (c.Dx * x + c.Dz * z) - c.om * t + c.ph - NF.ph[i], co = Math.cos(f), h = am * Math.sin(f);
      dx += Q * am * c.Dx * co; dz += Q * am * c.Dz * co; dy += h; if (i >= 4 && i < 10) dn += h;
    }
    SEA_D[0] = dx; SEA_D[1] = dy; SEA_D[2] = dz; SEA_D[3] = dn; return SEA_D;   // (dn: the short wind waves that ride with her, the near field)
  }
  function seaFade(x, z){ const st = 2 * HALF / NP, ox = Math.round(bv.x / st) * st, oz = Math.round(bv.z / st) * st; return 1 - sstep(0.6, 1, Math.max(Math.abs(x - ox), Math.abs(z - oz)) / HALF); }
  function seaH(x, z, t){
    const tide = env.tide || 0, fade = seaFade(x, z); if (fade <= 0 || !WV.list.length){ SEA_D[3] = 0; return tide; }
    const S = ssAt(x, z); let px = x, pz = z;
    for (let it = 0; it < 2; it++){ const D = seaDisp(px, pz, t, S, fade); px = x - D[0]; pz = z - D[2]; }
    return tide + seaDisp(px, pz, t, S, fade)[1];
  }
  function seaHFast(x, z, t){ const tide = env.tide || 0, fade = seaFade(x, z); return fade <= 0 || !WV.list.length ? tide : tide + seaDisp(x, z, t, ssAt(x, z), fade)[1]; }

  // ---------- environment ----------
  const PAL = [[-18,[0.006,0.012,0.035],[0.02,0.035,0.07]], [-9,[0.02,0.04,0.1],[0.08,0.1,0.18]], [-3,[0.1,0.16,0.33],[0.5,0.4,0.5]], [2,[0.28,0.42,0.7],[0.93,0.68,0.5]], [9,[0.3,0.52,0.8],[0.76,0.83,0.9]], [25,[0.25,0.49,0.82],[0.68,0.8,0.92]]];
  function pal(el){
    if (el <= PAL[0][0]) return [PAL[0][1], PAL[0][2]];
    for (let i = 0; i < PAL.length - 1; i++){ const a = PAL[i], b = PAL[i + 1]; if (el <= b[0]){ const t = (el - a[0]) / (b[0] - a[0]); return [mix3(a[1], b[1], t), mix3(a[2], b[2], t)]; } }
    const L = PAL[PAL.length - 1]; return [L[1], L[2]];
  }
  function computeEnv(H){
    // the sun's and the moon's true azimuths onto the grid the world is drawn on
    const s = sunAt(H), el = s.el, er = el * DEG, gz = gridGamma({x:bv.x / 1000, y:bv.z / 1000}) * DEG, saz = s.az - gz; env.el = el;
    env.sunDir = [Math.cos(er) * Math.sin(saz), Math.sin(er), -Math.cos(er) * Math.cos(saz)];
    const ly = Math.max(env.sunDir[1], 0.25), ll = Math.hypot(env.sunDir[0], ly, env.sunDir[2]); env.lightDir = [env.sunDir[0] / ll, ly / ll, env.sunDir[2] / ll];
    env.cloud = cloudAt(H); env.precip = precipAt(H); env.temp = airTemp(H); env.vis = visibility(H); env.aur = auroraAt(H);
    let [zen, hor] = pal(el); const lum = 0.3 * hor[0] + 0.59 * hor[1] + 0.11 * hor[2], grey = [lum * 0.92, lum * 0.96, lum * 1.02];
    zen = mix3(zen, grey.map(v => v * 0.9), env.cloud * 0.8); hor = mix3(hor, grey, env.cloud * 0.85);
    env.zen = zen; env.hor = hor; env.day = sstep(-6, 6, el);
    const sc = mix3([1, 0.95, 0.88], [1, 0.58, 0.32], sstep(14, 1, el)), si = sstep(-1.5, 5, el) * (1 - 0.72 * env.cloud) * 1.1;
    env.sunCol = sc.map(v => v * si);
    env.amb = [zen[0] * 0.55 + hor[0] * 0.25 + 0.075, zen[1] * 0.55 + hor[1] * 0.25 + 0.095 + env.aur * 0.07, zen[2] * 0.55 + hor[2] * 0.25 + 0.14 + env.aur * 0.03];
    env.gnd = env.amb.map(v => v * 0.6);
    // from a strong gale (Beaufort 9) the spray in the air shortens the view over the sea: about 15 km at force 10, 4 km at 11, 1 km at 12
    // (only in 3D; the game's visibility() is unchanged)
    env.fog = hor; env.fogD = 1.73 / (Math.min(QUAL.lvl === 3 ? env.vis * 1.8 : env.vis, (QUAL.lvl === 3 ? 90 : 50) * Math.exp(-0.325 * Math.max(0, windAt(H) - 20.8))) * 1000);
    env.stars = sstep(-5, -12, el) * (1 - env.cloud); env.spec = sstep(-1, 4, el) * (1 - env.cloud) * 2.2;
    env.night = sstep(3, -5, el);
    // moon: where it is, how full, and the light it gives at night
    const mo = moonAt(H), mr = mo.el * DEG; env.moon = mo; env.moonDir = [Math.cos(mr) * Math.sin(mo.az - gz), Math.sin(mr), -Math.cos(mr) * Math.cos(mo.az - gz)];
    env.moonA = sstep(-1, 2, mo.el) * (1 - 0.6 * env.day);
    const mlight = sstep(0, 8, mo.el) * mo.illum * sstep(-2, -8, el) * (1 - 0.8 * env.cloud);
    if (mlight > 0.02){ const ml = [0.62, 0.7, 0.9].map(v => v * mlight * 0.32); env.sunCol = env.sunCol.map((v, k) => v + ml[k]); env.amb = env.amb.map((v, k) => v + [0.02, 0.025, 0.04][k] * mlight); const my = Math.max(env.moonDir[1], 0.25), mll = Math.hypot(env.moonDir[0], my, env.moonDir[2]); env.lightDir = [env.moonDir[0] / mll, my / mll, env.moonDir[2] / mll]; }
    env.shadowDir = el > -1 ? env.sunDir : mlight > 0.02 ? env.moonDir : null;
    env.tide = tideH(H);
    const sn = Math.round(snowLine(H) / 20) * 20, gn = grassNow(); if (sn !== snowNow || gn !== grassAt){ snowNow = sn; grassAt = gn; recolor(TERR, sn); if (NEARM) recolor(NEARM, sn); if (FINEM) recolor(FINEM, sn); for (const m of UPATCH) recolor(m, sn); }
  }


  // ---------- mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off) ----------
  const MO = {key:'', phase:'', t:0, from:null, dur:0, lines:0, len:[0, 0, 0, 0], init:false};
  const LINE_S = 1.2;   // seconds for each line to go on
  let ROPEM = null, FENDM = null;
  function buildMooring(){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.46, 0.33, 0.19, 0.12], 6);   // brown mooring lines (tilbakemelding #22)
    ROPEM = r.mesh(); const f = NB(); f.tube([[0, -0.26, 0], [0, 0.26, 0]], 0.12, [0.93, 0.93, 0.9, 0.35], 10); FENDM = f.mesh(); }
  function berthNow(){
    const b = S.boat; if (!((b.status === 'port' || b.status === 'unmooring') && b.port)) return null;
    const sh = b.shift, kind = sh ? (S.t + currentFrac() < sh.castUntil ? sh.from : sh.to) : berthKind(b);
    return berthPose(b.port, vtype(), kind) || berthPose(b.port, vtype());
  }
  // along a curve from where she was (position and heading F) to the berth, u0 from 0 to 1 at du per second
  function approach(F, bp, u0, du0){
    const X = bp.x * 1000, Z = bp.y * 1000, u = u0 * u0 * (3 - 2 * u0), k = Math.hypot(X - F.x, Z - F.z) * 1.1;
    const P0 = [F.x, F.z], T0 = [Math.sin(F.h) * k, -Math.cos(F.h) * k], P1 = [X, Z], T1 = [bp.fwd.x * k, bp.fwd.z * k];
    const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
    const d00 = 6 * u * u - 6 * u, d10 = 3 * u * u - 4 * u + 1, d01 = -6 * u * u + 6 * u, d11 = 3 * u * u - 2 * u;
    const px = h00 * P0[0] + h10 * T0[0] + h01 * P1[0] + h11 * T1[0], pz = h00 * P0[1] + h10 * T0[1] + h01 * P1[1] + h11 * T1[1];
    const vx = d00 * P0[0] + d10 * T0[0] + d01 * P1[0] + d11 * T1[0], vz = d00 * P0[1] + d10 * T0[1] + d01 * P1[1] + d11 * T1[1];
    bv.spd = Math.hypot(vx, vz) * 6 * u0 * (1 - u0) * du0; bv.yr = 0;
    bv.px = px; bv.pz = pz; if (Math.hypot(vx, vz) > 1e-3) bv.cog = Math.atan2(vx, -vz);
  }
  // a polyline in metres, smoothed (Chaikin, twice) and measured: the ways in to a berth and out of it (core berthPath)
  function pathM(pts){
    let P = pts.map(q => [q.x * 1000, q.y * 1000]);
    for (let it = 0; it < 2; it++){ const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++){ const a = P[i], c = P[i + 1]; Q.push([a[0] * 0.75 + c[0] * 0.25, a[1] * 0.75 + c[1] * 0.25], [a[0] * 0.25 + c[0] * 0.75, a[1] * 0.25 + c[1] * 0.75]); } Q.push(P[P.length - 1]); P = Q; }
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return {P, L, len:L[L.length - 1]};
  }
  function pathAt(M, s){ s = clamp(s, 0, M.len); let i = 1; while (i < M.L.length - 1 && M.L[i] < s) i++; const a = M.P[i - 1], c = M.P[i], f = (s - M.L[i - 1]) / Math.max(1e-6, M.L[i] - M.L[i - 1]); return {x:a[0] + (c[0] - a[0]) * f, z:a[1] + (c[1] - a[1]) * f, h:Math.atan2(c[0] - a[0], -(c[1] - a[1]))}; }
  function lieAlongside(dt, bp){
    bv.spd = 0; bv.yr = 0; bv.px += (bp.x * 1000 - bv.px) * (1 - Math.exp(-dt * 2)); bv.pz += (bp.y * 1000 - bv.pz) * (1 - Math.exp(-dt * 2)); bv.cog += angDiff(bv.cog, bp.hd) * (1 - Math.exp(-dt * 2));
  }
  function moorStep(dt, bp, at = dt){
    const b = S.boat, key = S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0), sp = Math.max(1, S.mult || 1), X = bp.x * 1000, Z = bp.y * 1000;
    // moving to the other quay in the harbour, on the simulation's clock: the lines come in, she goes over, the lines go on
    const sh = b.shift;
    if (sh && b.status === 'port'){
      const gt = S.t + currentFrac(), A = berthPose(b.port, vtype(), sh.from) || bp; MO.key = key; MO.init = true; MO.sh = true;
      if (gt < sh.castUntil){ MO.phase = 'out'; MO.lines = clamp(4 * (sh.castUntil - gt) / CAST_MIN, 0, 4); lieAlongside(dt, A); return; }
      if (gt < sh.arriveAt){ MO.phase = 'in'; MO.lines = 0; MO.len = [0, 0, 0, 0]; const span = sh.arriveAt - sh.castUntil; approach({x:A.x * 1000, z:A.y * 1000, h:A.hd}, bp, clamp((gt - sh.castUntil) / span, 0, 1), GAME_RATE * (S.mult || 1) / 60 / span); return; }
      MO.phase = 'lines'; MO.lines = clamp(4 * (gt - sh.arriveAt) / Math.max(0.1, sh.until - sh.arriveAt), 0, 4); lieAlongside(dt, bp); return;
    }
    if (MO.sh){ MO.sh = false; MO.phase = 'moored'; MO.lines = 4; }   // the move is over: she is made fast
    if (MO.key !== key){
      const d = Math.hypot(bv.px - X, bv.pz - Z); MO.key = key; MO.len = [0, 0, 0, 0];
      if (b.status === 'unmooring' || !MO.init){ MO.phase = 'moored'; MO.lines = 4; }
      else if (d < 3){ MO.phase = 'lines'; MO.t = 0; MO.lines = 0; }   // brought in by the manoeuvring model: the lines go on
      else { MO.phase = 'in'; MO.t = 0; MO.from = {x:bv.px, z:bv.pz, h:bv.cog}; MO.path = pathM(berthPath({x:bv.px / 1000, y:bv.pz / 1000}, bp)); MO.dur = clamp(MO.path.len / 2.2, 6, 45); MO.lines = 0; }
      MO.init = true;
    }
    if (b.status === 'unmooring'){ MO.phase = 'out'; MO.lines = clamp(4 * (b.castUntil - S.t - currentFrac()) / CAST_MIN, 0, 4); MO.dep = {bp, pid:b.port, naust:berthKind(b) === 'naust'}; }
    if (MO.phase === 'in'){
      MO.t += at * sp; const u0 = clamp(MO.t / MO.dur, 0, 1);
      // along the way in (clear of land, piers and the unit's quay), turning to lie along the quay at the end
      if (MO.path){ const u = u0 * u0 * (3 - 2 * u0), q = pathAt(MO.path, u * MO.path.len); bv.px = q.x; bv.pz = q.z; bv.cog += angDiff(bv.cog, u0 > 0.9 ? bp.hd : q.h) * Math.min(1, at * 3); bv.spd = MO.path.len * 6 * u0 * (1 - u0) * sp / MO.dur; bv.yr = 0; }
      else approach(MO.from, bp, u0, sp / MO.dur);
      if (u0 >= 1){ MO.phase = 'lines'; MO.t = 0; bv.cog = bp.hd; }
    } else {
      if (MO.phase === 'lines'){ MO.t += at * sp; MO.lines = Math.min(4, MO.t / LINE_S); if (MO.lines >= 4) MO.phase = 'moored'; }
      // lying alongside: held in place by the lines, the swell moves her a little
      lieAlongside(at, bp);
    }
  }
  // the lines from the boat's cleats to the bollards on the quay, sagging when slack; the tide makes them slack or tight
  function drawMooring(BMrel, eye, VP, t){
    const bp = berthNow(); if (!bp || !ROPEM) return;
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, mid = (G.bow + G.stern) / 2;
    nSetup(VP);
    if (MO.phase !== 'in' || MO.t / MO.dur > 0.55) for (const z of [G.bow * 0.45, mid, G.stern * 0.55]){
      drawN(FENDM, chain(BMrel, M4.T(sx * 0.95 + 0.12, gw - 0.45, z))); drawN(ROPEM, chain(BMrel, limbM([sx * 0.95 + 0.12, gw - 0.2, z], [sx * 0.9, gw, z], 0.012)));
    }
    const bl = QB[faceKey(bp.face)]; if (!bl || !bl.length || MO.lines <= 0) return;
    const X = bp.x * 1000, Z = bp.y * 1000, f = bp.fwd, near = (tx, tz) => bl.reduce((a, q) => Math.hypot(q.x - tx, q.z - tz) < Math.hypot(a.x - tx, a.z - tz) ? q : a, bl[0]);
    const fore = near(X + f.x * (bp.Lb / 2 + 2.5), Z + f.z * (bp.Lb / 2 + 2.5)), aft = near(X - f.x * (bp.Lb / 2 + 2.5), Z - f.z * (bp.Lb / 2 + 2.5));
    const cleat = {bow:[sx * 0.55, gw + 0.05, G.bow + 0.4], mid:[sx * 0.95, gw + 0.05, mid], stern:[sx * 0.8, gw + 0.05, G.stern - 0.35]};
    const LINES = [['mid', aft], ['bow', fore], ['stern', aft], ['mid', fore]];
    for (let i = 0; i < 4; i++){
      const p = clamp(MO.lines - i, 0, 1); if (p <= 0) continue;
      const A = xf(BMrel, cleat[LINES[i][0]]), q = LINES[i][1], Bq = [q.x - eye[0], QTOP + 0.42 - eye[1], q.z - eye[2]];
      const d = Math.hypot(Bq[0] - A[0], Bq[1] - A[1], Bq[2] - A[2]);
      let E = Bq, sag;
      if (p < 1){ E = [A[0] + (Bq[0] - A[0]) * p, A[1] + (Bq[1] - A[1]) * p + Math.sin(Math.PI * p) * 1.4, A[2] + (Bq[2] - A[2]) * p]; sag = 0.6 * (1 - p) + 0.1; MO.len[i] = 0; }
      else { if (!MO.len[i]) MO.len[i] = d * 1.03; const slack = MO.len[i] - d; sag = slack > 0 ? Math.sqrt(3 * d * slack / 8) : 0.01 * d; }
      const dd = Math.hypot(E[0] - A[0], E[1] - A[1], E[2] - A[2]); let prev = A;
      for (let k = 1; k <= 8; k++){ const s2 = k / 8, P = [A[0] + (E[0] - A[0]) * s2, A[1] + (E[1] - A[1]) * s2 - sag * 4 * s2 * (1 - s2) * Math.min(1, dd / Math.max(d, 0.1)), A[2] + (E[2] - A[2]) * s2]; drawN(ROPEM, limbM(prev, P, 0.02)); prev = P; }
    }
  }
  // ---------- boat motion ----------
  function currentFrac(){ return clamp(acc + (Date.now() - lastWall) / 1000 * simRate() / 60, 0, 0.999); }
  function predict(frac){
    const L = livePose(frac), b = S.boat; let hd = L.hd;
    if (b.status === 'port' || b.status === 'unmooring'){ const bp = berthNow(); if (bp) return {p:{x:bp.x, y:bp.y}, hd:bp.hd}; const pt = portById(b.port); hd = Math.atan2(pt.coast.x - pt.p.x, -(pt.coast.y - pt.p.y)); }
    return {p:L.p, hd};
  }
  // the boat in 3D follows the simulated track like a real boat: it speeds up and slows down gradually, turns on an arc,
  // pivots about a point a third of its length from the bow (so the stern swings out), skids a little in turns and banks
  const KNV = () => 1852 / 3600 * simRate();      // on-screen metres per real second per knot (real time with the hand on the helm)
  // ---------- along the route (Jonas 06.10.2026: «båten strengt må følge rutestreken som lages i kartplotteren», «Svingingen kan være
  // litt smooth akkurat der båten endrer kurs, men det må være ganske nøyaktige kursendringer», «båten må stoppe på nøyaktig den plassen
  // siste endepunkt er … at den slakker av og stopper nøyaktig der den skal», and «Stopp» underway the same, not all at once) ----------
  // One line in metres: out from the quay she lies at (core berthPath, astern first), the route's waypoints as the chart plotter draws
  // them, and in to the quay where the route ends. She runs along it at the simulation's speed, catching up when she is behind (the
  // simulation starts at the harbour point), not ahead of it, and brakes to stand exactly on every stop she has not been let past: the
  // end, a fishing ground, a set to work. The simulation is on the same line, so the chart, the simulation and the 3D boat agree. The
  // corners are rounded over TRK_R metres either side. A new or changed route starts a new line from where she is, keeping her way.
  // (It replaced a follower that steered for a point ahead with the boat's turning radius: in a narrow harbour it cut the corners, and
  // its own 45 s way out and 60 s way in left her lying at the plant's quay in Senjahopen while the trip to the rorbu was long done.)
  let TRK = null;
  const TRK_R = 6;
  const trkSig = pl => pl.wps.length + ':' + pl.wps.map(w => w.x.toFixed(5) + ',' + w.y.toFixed(5) + (w.port || '')).join(';');
  function trkBuild(pl, dep){
    const vt = vtype(), P = [], wpAt = [];
    const add = (x, z) => { const q = P[P.length - 1]; if (!q || Math.hypot(q[0] - x, q[1] - z) > 0.3) P.push([x, z]); };
    let back = 0, hd0 = null, endBp = null;
    let iOut = 0;
    // (from Father's naust straight out to the route's first point: the harbour point is the plant's, tilbakemelding #20)
    if (dep){ const pt = portById(dep.pid), w0 = pl.wps[pl.idx], from = dep.naust && w0 ? w0 : pt && pt.p; let W = from ? berthPath(from, dep.bp).reverse() : [dep.bp];
      // from the last turn out from the quay straight on to the route when that is clear: the harbour point can lie by the berth
      // (Senjahopen), and going back to it had her back out and then run in past the quay again
      const w1 = pl.wps[pl.idx]; if (W.length > 2 && w1 && berthClear(W[W.length - 2], w1, (dep.bp.Bb || 3) / 2)) W = W.slice(0, -1);
      for (const q of W) add(q.x * 1000, q.y * 1000); hd0 = dep.bp.hd; iOut = P.length - 1;
      if (P.length > 1) back = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]); }   // the first stretch astern, out from the quay
    else add(bv.px, bv.pz);
    // up to the first harbour on it: she docks there and the route is over (core dock)
    let iEnd = pl.wps.length - 1; for (let i = pl.idx; i < pl.wps.length; i++) if (pl.wps[i].port){ iEnd = i; break; }
    for (let i = pl.idx; i <= iEnd; i++){ const w = pl.wps[i]; add(w.x * 1000, w.y * 1000); wpAt[i] = P.length - 1; }
    const last = pl.wps[iEnd];
    // in to the quay she will lie at, the same as berthNow once she is in
    if (last && last.port){ endBp = berthPose(last.port, vt, last.berth === 'naust' && quayFace(last.port, 'naust') ? 'naust' : 'main') || berthPose(last.port, vt);
      if (endBp){ const W = berthPath({x:last.x, y:last.y}, endBp); for (let k = 1; k < W.length; k++) add(W[k].x * 1000, W[k].y * 1000); } }
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    const stops = []; for (let i = pl.idx; i <= iEnd; i++) if (wpStop(pl.wps[i]) && wpAt[i] != null) stops.push({i, s:L[wpAt[i]]});
    // where the way in to the quay begins (slow from there), and how far she turns over once she is clear astern
    const sIn = endBp && wpAt[iEnd] != null ? L[wpAt[iEnd]] : 1e9, turnL = Math.max(10, ((dep && dep.bp.Lb) || 8) * 1.5);
    return {plan:pl, n:pl.wps.length, sig:trkSig(pl), chk:0, P, L, end:L[L.length - 1], stops, s:0, v:0, vc:0, back, turnL, hd0, endBp, sIn, sOut:L[iOut], done:false};
  }
  // the point s metres along the line
  function trkAt(T, s){
    const L = T.L, n = L.length; if (n < 2) return T.P[0]; s = clamp(s, 0, T.end);
    let lo = 1, hi = n - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; }
    const a = T.P[lo - 1], c = T.P[lo], f = (s - L[lo - 1]) / Math.max(1e-6, L[lo] - L[lo - 1]); return [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f];
  }
  // how far along the line a point is, looked for from s0 on (a line that comes back on itself is no trouble)
  function trkProj(T, x, z, s0, back = 30){
    let best = s0, bd = 1e18;
    for (let i = 1; i < T.P.length; i++){
      if (T.L[i] < s0 - back) continue; if (T.L[i - 1] > s0 + 4000) break;
      const a = T.P[i - 1], c = T.P[i], vx = c[0] - a[0], vz = c[1] - a[1], l2 = vx * vx + vz * vz || 1, u = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1);
      const d = (x - a[0] - u * vx) ** 2 + (z - a[1] - u * vz) ** 2; if (d < bd){ bd = d; best = T.L[i - 1] + u * Math.sqrt(l2); }
    }
    return best;
  }
  // under way on a route, or not yet in at the end of the last one; a new or changed route starts a new line
  function trkOn(){
    const b = S.boat, pl = S.plan;
    if (helmOn() || b.status === 'tow' || dynLive() || b.anch){ TRK = null; return false; }   // (at anchor she lies to it until it is up)
    if (b.status === 'sailing' && pl && pl.wps.length > pl.idx){
      if (!TRK || TRK.plan !== pl || TRK.n !== pl.wps.length || ((TRK.chk = (TRK.chk + 1) % 30) === 0 && trkSig(pl) !== TRK.sig)){
        // from the quay she has just cast off from (moorStep's MO.dep), else from where she is
        const d0 = !TRK && MO.dep && Math.hypot(MO.dep.bp.x * 1000 - bv.px, MO.dep.bp.y * 1000 - bv.pz) < 60 ? MO.dep : null, v = TRK ? TRK.v : d0 ? 0 : bv.spd || 0, vc = TRK ? TRK.vc : 0;
        MO.dep = null; TRK = trkBuild(pl, d0); TRK.v = v; TRK.vc = vc;
      }
      return true;
    }
    if (TRK && !TRK.done) return true;
    TRK = null; return false;
  }
  const trkDn = vc => Math.max(1.2, vc / 6);   // how hard she brakes (m/s per s) from the speed she cruises at
  // «Stopp»: how far ahead of the simulation (km, along the route) she needs to stop gently from where she is and the way she has on
  function trkHaltNeed(){
    const T = TRK, b = S.boat; if (!T || T.plan !== S.plan || b.status !== 'sailing') return 0;
    const sSim = trkProj(T, b.pos.x * 1000, b.pos.y * 1000, T.s, 3000), vc = Math.max(T.vc, 3 * KNV());
    return Math.max(0, T.s + T.v * T.v / (2 * trkDn(vc)) + 5 - sSim) / 1000;
  }
  function trkStep(dt, pr){
    const T = TRK, b = S.boat, pl = S.plan, live = pl === T.plan && b.status === 'sailing';
    const vs = live ? sailV(S.t / 60) * KNV() : 0; if (vs > 0.5) T.vc = vs; const vc = Math.max(T.vc, 3 * KNV());
    // where the simulation is on the line: under way she keeps up with it; when it has come in to a quay she runs on to the berth;
    // when it has stopped elsewhere (the end of the route, a ground, a set, Stopp) she runs on to where it stands
    const dock = b.status === 'port' && T.endBp, sT = dock ? T.end : trkProj(T, pr.p.x * 1000, pr.p.y * 1000, Math.max(T.s, T.sOut));
    const aUp = Math.max(1.2, vc / 5), aDn = trkDn(vc);
    // the stop she must not pass: under way the first stop waypoint the simulation has not reached yet, else the end; stopped, where it
    // stands (if she has already run past it, she slows down as gently as she can)
    let sStop = T.end, vDes = vc;
    if (live){ for (const q of T.stops) if (q.i >= pl.idx && q.s >= T.s - 0.5){ sStop = q.s; break; }
      // out from the quay at manoeuvring speed whatever the simulation does (it starts at the harbour point, which can lie by the berth)
      vDes = T.s < T.sOut ? vc : clamp(vs + (sT - T.s) * 0.6, 0, vs * 1.5 + 3 + Math.max(0, sT - T.s - 60) * 0.05); }
    else if (!dock){ if (sT > T.s) sStop = Math.min(T.end, sT); else { vDes = 0; sStop = Math.min(T.end, T.s + T.v * T.v / (2 * aDn) + 0.01); } }
    // slow astern out from the quay and while she turns, and slow on the way in to the quay
    if (T.s < T.back + T.turnL || T.s > T.sIn) vDes = Math.min(vDes, (T.s > T.sIn ? 4 : 3) * KNV());
    // speed: up and down gradually, and never more than she can brake from to stand at the stop
    T.v += clamp(vDes - T.v, -aDn * dt, aUp * dt); T.v = clamp(T.v, 0, Math.sqrt(2 * aDn * Math.max(0, sStop - T.s)));
    T.s = Math.min(T.s + T.v * dt, sStop);
    if (sStop - T.s < 0.05){ T.s = sStop; T.v = 0; }
    // stopped where the simulation is (it takes over from here: the quay's lines, or lying still)
    if (!live && T.v < 0.02 && (T.s >= sStop - 0.05 || vDes === 0)) T.done = true;
    // on the line, the corners rounded; the heading along it (astern out from the quay at first, then turning to the way out)
    // (not near a stop: there she stands exactly on the waypoint)
    let r = Math.min(TRK_R, T.s, T.end - T.s); for (const q of T.stops) r = Math.min(r, Math.abs(q.s - T.s));
    const A = trkAt(T, T.s - r), C = trkAt(T, T.s + r), Q = r > 0.01 ? [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2] : trkAt(T, T.s);
    const rh = Math.max(2, TRK_R), A2 = trkAt(T, T.s - rh), C2 = trkAt(T, T.s + rh);
    let hd = Math.hypot(C2[0] - A2[0], C2[1] - A2[1]) > 0.1 ? Math.atan2(C2[0] - A2[0], -(C2[1] - A2[1])) : bv.cog;
    if (T.back > 0 && T.hd0 != null) hd = T.hd0 + angDiff(T.hd0, hd) * sstep(0, 1, (T.s - T.back) / T.turnL);
    const c0 = bv.cog; bv.px = Q[0]; bv.pz = Q[1]; bv.cog = hd; bv.spd = T.v;
    bv.yr += (clamp(angDiff(c0, hd) / Math.max(dt, 1e-3), -1.5, 1.5) - bv.yr) * (1 - Math.exp(-dt * 6));
    // in at the quay: the lines go on (moorStep takes it from here)
    if (T.done && T.endBp && b.status === 'port'){ MO.key = S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0); MO.init = true; MO.phase = 'lines'; MO.t = 0; MO.lines = 0; MO.len = [0, 0, 0, 0]; }
  }
  // the manoeuvring model has her (core/16b-dyn.js, Fysikk 1): she is drawn where it puts her, a little on from its last tick, with
  // the way and the turn it gives her (the wake, the banking and the skid come from those, as under the follower)
  function dynFollow(dt){
    TRK = null; const q = dynPose(), x = q.x * 1000, z = q.y * 1000, k = 1 - Math.exp(-dt * 10), rate = simRate();
    bv.spd = q.spd * rate; bv.yr += (q.r * rate - bv.yr) * (1 - Math.exp(-dt * 6));
    // the hull's heading is the model's: the skid the common code adds (bv.beta, from the yaw rate) is taken off the course here
    const bt = clamp(bv.yr * 0.14 * sstep(0.5, 6, bv.spd / KNV()), -0.18, 0.18), hd = q.hd - bt;
    if (Math.hypot(x - bv.px, z - bv.pz) > 50){ bv.px = x; bv.pz = z; bv.cog = hd; }
    else { bv.px += (x - bv.px) * k; bv.pz += (z - bv.pz) * k; bv.cog += angDiff(bv.cog, hd) * k; }
  }
  function updateBoat(dt, t, frac, rdt){
    const b = S.boat, pr = predict(frac), tx = pr.p.x * 1000, tz = pr.p.y * 1000, sailing = b.status === 'sailing' && S.plan, G = GEO(vtype());
    const zp = (G.bow || -2.2) + ((G.stern || 3.1) - (G.bow || -2.2)) / 3;   // pivot point, local z (negative = forward)
    if (!bv.init || Math.hypot(tx - (bv.px || 0), tz - (bv.pz || 0)) > 900){ TRK = null; bv.px = tx; bv.pz = tz; bv.cog = pr.hd; bv.head = pr.hd; bv.spd = sailing ? b.v * KNV() : 0; bv.yr = 0; bv.beta = 0; bv.init = true; bv.osc = false; bv.st = null; TRAIL.length = 0; WV.init = false; }
    else if (dt > 0){
      const bp = berthNow();
      // under a route, and until she has come in to where it ends: along the line the chart plotter draws (trkStep)
      // (with the time that has really gone, up to 30 s: a slow frame or a stall must not leave her behind the simulation for good)
      if (dynLive()) dynFollow(Math.min(30, rdt || dt));   // the manoeuvring model has her (core/16b-dyn.js); with the time that has really gone, so a slow frame never leaves her behind
      else if (!bp && dynRest() && !S.plan && !helmOn() && !b.drv && !b.anch) dynFollow(Math.min(30, rdt || dt));   // the model has just stopped her: stand where it left her (until she drifts: core lieDrift)
      else if (trkOn()) trkStep(Math.min(30, rdt || dt), pr);
      else if (bp) moorStep(dt, bp, Math.min(30, rdt || dt));   // (the way in and the lines on the time that has really gone: a slow frame never holds her off the quay)
      else if (helmOn()){
        // by hand (16-helm.js): she is where the simulation puts her every tick, so she follows it closely; the turn (a game second's,
        // so times the rate on the screen) and the way she
        // has come from the helm, so she banks and makes her wake as under a route
        const h = S.helm, k = 1 - Math.exp(-dt * 6);
        bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k; bv.cog += angDiff(bv.cog, pr.hd) * k;
        bv.yr += (h.yaw * simRate() - bv.yr) * (1 - Math.exp(-dt * 3)); bv.spd = Math.abs(h.v) * KNV();
      }
      else if (b.status === 'tow' && b.tow && b.tow.ph === 'tow'){
        // under tow (the rescue boat, core towPose): she keeps close behind the tow line's end, with way on
        const k = 1 - Math.exp(-dt * 6); bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k; bv.cog += angDiff(bv.cog, pr.hd) * (1 - Math.exp(-dt * 2));
        bv.spd = TOW.tow * KNV(); bv.yr *= Math.exp(-dt * 2);
      } else {
        // in port, fishing or drifting: glide to the spot, coast to a stop and swing slowly to the new heading
        // (drifting, core lieDrift: she keeps close to where the drift has her, on the time that has really gone, as under the model,
        // so slow frames never leave her behind the chart and the simulation; she comes there from where the model stopped her)
        bv.spd *= Math.exp(-dt * 1.2); bv.yr *= Math.exp(-dt * 2);
        // (at anchor she swings round it along the minute's move as well: core/06e-anchor.js)
        const sw = b.drv || (b.anch && b.anch.mv), k = sw ? 1 - Math.exp(-Math.min(30, rdt || dt) * 3) : 1 - Math.exp(-dt * 1.5); bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k;
        bv.cog += angDiff(bv.cog, pr.hd) * (1 - Math.exp(-dt * (b.anch ? 2 : 0.7)));
      }
      // the bow points a little into the turn, so the stern skids out
      const kn0 = bv.spd / KNV(), bt = clamp(bv.yr * 0.14 * sstep(0.5, 6, kn0), -0.18, 0.18);
      bv.beta += (bt - bv.beta) * (1 - Math.exp(-dt * 4)); bv.head = bv.cog + bv.beta;
    }
    // the hull is placed so that the track point is its pivot
    bv.x = bv.px + Math.sin(bv.head) * zp; bv.z = bv.pz - Math.cos(bv.head) * zp;
    const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head);
    // The hull answers the sea it floats on as a damped oscillator in heave, pitch and roll, with the natural periods of the boat as loaded
    // (03c-stability.js). The sea is averaged over the waterplane (3 x 3 points), so a long hull rides over short waves and a light boat
    // follows them; a sea that meets her roll period builds the roll up (resonance), and a beam wind heels her.
    if (!bv.st || t - (bv.stT || 0) > 1 || t < (bv.stT || 0)){ bv.st = stabOf(b.type || 'skiff'); bv.stT = t; bv.heel = -windHeel(bv.st, env.wind || 0) * Math.sign(Math.sin((windDir(S.t / 60) * DEG + Math.PI) - bv.head) || 1); }   // to leeward
    const pl = G.pl, rl = G.rl, Ls = Math.max(pl * 2, (G.stern - G.bow) * 0.8 || 0), Bs = Math.max(rl * 2, (G.beam || 2.4) * 0.8);
    // (the short wind waves that ride with her, the near field, apart: she meets those at her real speed, and they go to the hull as
    // they are; the long waves and the swell stand in the world, where she meets them 6 times too often, and only those are smoothed)
    let hm = 0, sl = 0, st = 0, hmN = 0, slN = 0, stN = 0;
    for (const a of [-0.5, 0, 0.5]) for (const c of [-0.5, 0, 0.5]){ const h = seaH(bv.x + fx * a * Ls + rx * c * Bs, bv.z + fz * a * Ls + rz * c * Bs, t), hn = SEA_D[3]; hm += h; sl += h * a; st += h * c; hmN += hn; slN += hn * a; stN += hn * c; }
    hm /= 9; sl /= 1.5 * Ls; st /= 1.5 * Bs; hmN /= 9; slN /= 1.5 * Ls; stN /= 1.5 * Bs;
    const v = b.status === 'sailing' ? bv.spd / KNV() : 0;
    const trim = 0.07 * sstep(9, 17, v) - 0.02 * sstep(3, 9, v) * (1 - sstep(9, 13, v));
    // planing hulls bank into a turn, displacement hulls heel a little outwards
    const bank = (BOAT.planing ? -0.18 : 0.06) * clamp(bv.yr, -1.2, 1.2) * sstep(4, 18, v);
    let tp = Math.atan(sl - slN) + trim, tr = Math.atan(st - stN) + bank + (bv.heel || 0), ty = hm - hmN + 0.06;
    // on the yard's lift she is raised with the platform and lies still: no sea to rock her (liftStep)
    const lf = liftStep(dt, b);
    if (lf.off > 0 || lf.d){ ty = hm * (1 - lf.dry) + (env.tide || 0) * lf.dry + 0.06 + lf.off; tp *= 1 - lf.dry; tr *= 1 - lf.dry; if (bv.osc && lf.d) bv.y += lf.d; if (bv.fy !== undefined && lf.d) bv.fy += lf.d; }
    // Under way the boat on screen runs GAME_RATE x (and the pace) faster than she would through these waves, which move in real time,
    // so she met them several times too often and heaved a metre at half a second in a gale (the user's «rister voldsomt» at the
    // helm, 03.10.2026): the sea she answers is smoothed over a time that grows with that speed
    const tf = 0.45 * sstep(2, 14, bv.spd || 0) + 0.3 * sstep(14, 45, bv.spd || 0);
    if (!bv.osc || tf < 0.02 || bv.fy === undefined){ bv.fy = ty; bv.fp = tp; bv.fr = tr; }
    else { const k = 1 - Math.exp(-dt / tf); bv.fy += (ty - bv.fy) * k; bv.fp += (tp - bv.fp) * k; bv.fr += (tr - bv.fr) * k; ty = bv.fy; tp = bv.fp; tr = bv.fr; }
    ty += hmN; tp += Math.atan(slN); tr += Math.atan(stN);   // (the near field's own, unsmoothed: Fysikk 2, the real encounter)
    if (!bv.osc){ bv.osc = true; bv.vy = bv.vp = bv.vr = 0; bv.y = ty; bv.pitch = tp; bv.roll = tr; }
    // (the roll is damped little lying still, more with way on: the hull's lift damps it, Ikeda; 0.06 of critical at rest to 0.15 at a
    // Froude number of 0.3, so a boat lying beam-on to the sea rolls, tilbakemelding #66)
    const Fn = (b.status === 'sailing' ? (b.v || 0) * 0.5144 : 0) / Math.sqrt(9.81 * Math.max(3, bv.st.L || 6));
    const wz = 2 * Math.PI / Math.max(0.6, bv.st.Tz), wr = 2 * Math.PI / Math.max(0.8, bv.st.Tr), zz = 0.35, zr = 0.06 + 0.09 * sstep(0, 0.3, Fn), n = Math.ceil(dt / 0.02), h = dt / n, lim = Math.min(0.9, bv.st.deckEdge * 1.6);
    for (let i = 0; i < n; i++){
      bv.vy += (wz * wz * (ty - bv.y) - 2 * zz * wz * bv.vy) * h; bv.y += bv.vy * h;
      bv.vp += (wz * wz * (tp - bv.pitch) - 2 * zz * wz * bv.vp) * h; bv.pitch += bv.vp * h;
      bv.vr += (wr * wr * (tr - bv.roll) - 2 * zr * wr * bv.vr) * h; bv.roll = clamp(bv.roll + bv.vr * h, -lim, lim);
    }
    bv.v = v;
  }

  // ---------- particles ----------
  const PN = 900, pp = new Float64Array(PN * 3); let pinit = false;
  const TRAIL = [];
  const WN = 700, wk = {x:new Float64Array(WN), y:new Float64Array(WN), z:new Float64Array(WN), vx:new Float64Array(WN), vy:new Float64Array(WN), vz:new Float64Array(WN), age:new Float64Array(WN).fill(99), life:new Float64Array(WN).fill(1), g:new Float64Array(WN), n:0, acc:0, sacc:0};
  function spawn(x, y, z, vx, vy, vz, life, g){ const i = wk.n = (wk.n + 1) % WN; wk.x[i] = x; wk.y[i] = y; wk.z[i] = z; wk.vx[i] = vx; wk.vy[i] = vy; wk.vz[i] = vz; wk.age[i] = 0; wk.life[i] = life; wk.g[i] = g; }
  const PB = new Float32Array(4000 * 3), PA = new Float32Array(4000);
  function drawPts(n, mode, VP, col, size, round, off, mx){
    if (!n) return;
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uOff, off || [0, 0, 0]); gl.uniform1f(u.uPull, 0); gl.uniform3fv(u.uCol, col); gl.uniform1f(u.uSize, size * ZF()); gl.uniform1f(u.uRound, round === 2 ? 2 : round ? 1 : 0); gl.uniform1f(u.uMax, mx || 48);
    gl.bindBuffer(gl.ARRAY_BUFFER, DYNP); gl.bufferSubData(gl.ARRAY_BUFFER, 0, PB.subarray(0, n * 3)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, DYNA); gl.bufferSubData(gl.ARRAY_BUFFER, 0, PA.subarray(0, n)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(mode, 0, n);
  }

  // ---------- drawing ----------
  function litSetup(VP){
    gl.useProgram(PL.p); const u = PL.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb);
    gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uOver, [0, 0, 0, 0]); plSet(u);
  }
  const NOHOLE = new Float32Array([1e9, 1e9, -1e9, -1e9]);
  function drawLit(m, M, hole){
    if (!m) return;   // a mesh not built yet or an empty one (08.10.2026: «Cannot read properties of undefined (reading 'parts')» every frame, the game stopped)
    if (m.parts){ for (const q of m.parts) drawLit(q, M, hole); return; }
    gl.uniformMatrix4fv(PL.u.uM, false, m.o ? relM(m) : M); gl.uniform4fv(PL.u.uHole, hole || NOHOLE); attr(0, m.pb, 3); attr(1, m.cb, 3);
    if (m.ib){ gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, m.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); } else gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }
  // the terrain program of the quality in use (terFS: MATQ 0 on low, 1 on mid, 2 on high and ultra; #mat0..2 in the address overrides),
  // compiled when first needed; a tier a driver will not compile falls back to the one below
  let PTS = [null, null, null];
  function terProg(q){
    if (PTS[q]) return PTS[q];
    try { PTS[q] = program(TER_VS, terFS(q), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat'], 'terreng' + q); }
    catch (e){ console.warn('terreng' + q, e.message || e); PTS[q] = terProg(q - 1); }
    return PTS[q];
  }
  const MATQ_FIX = (location.hash.match(/mat(\d)/) || [])[1];
  const MATP = {p:[0.5, 0.4, 0.65, 0.6], q:[0.4, 0.6, 2, 0]};   // chosen from the variant sheets 18.10.2026 (matvar.py in the session)   // the material shader's tuning (terFS uMP, uMQ)
  function drawTerrain(TM, eye, VP, near){
    const PQ = terProg(MATQ_FIX !== undefined ? +MATQ_FIX : Math.min(2, QUAL.lvl)) || PT; gl.useProgram(PQ.p); const u = PQ.u; plSet(u);
    if (u.uMP){ gl.uniform4fv(u.uMP, MATP.p); gl.uniform4fv(u.uMQ, MATP.q); }
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uSand, snowNow == null || snowNow < 5 ? [0.84, 0.86, 0.88] : [0.74, 0.71, 0.6]); gl.uniformMatrix4fv(u.uM, false, TM);
    const one = (m, hole, ground) => {
      gl.uniformMatrix4fv(u.uM, false, relM(m)); gl.uniform3fv(u.uPO, [m.o[0] - RO.x, 0, m.o[1] - RO.z]); gl.uniform4fv(u.uHole, hole || NOHOLE); gl.uniform1f(u.uGOn, ground && GTEX ? 1 : 0); gl.uniform1f(u.uLOn, ground && LMTEX && LMON ? 1 : 0); gl.uniform1f(u.uTideY, Math.min(env.tide || 0, COAST3.top - 0.15)); gl.uniform1f(u.uSwash, clamp(0.5 * (WV.hs + WV.swHs), 0, COAST3.swash));
      if (ground && LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE0); }
      if (LRECT) gl.uniform4fv(u.uGRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]);
      if (ground && GTEX){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX); gl.uniform1i(u.uGround, 0); gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]); }
      attr(0, m.pb, 3); attr(1, m.cb, 3); attr(2, m.nb, 3); attr(3, m.sb, 1); attr(4, m.mb, 4); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, m.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    };
    const holeOf = (M, g) => new Float32Array([M.x0 + g - eye[0], M.z0 + g - eye[2], M.x0 + M.sx - g - eye[0], M.z0 + M.sz - g - eye[2]]);
    if (!NEARM) one(TERR);
    else if (near){ one(NEARM, FINEM ? holeOf(FINEM, 6) : null, true); if (FINEM){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -1); one(FINEM, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } if (UPATCH.length){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); for (const m of UPATCH) one(m, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } }
    else if (!MIDM) one(TERR, holeOf(NEARM, 45));
    else { one(TERR, holeOf(MIDM, 180)); one(MIDM, holeOf(NEARM, 45)); }
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4); litSetup(VP);
  }
  // ground layer under the corridor: roads and forest, drawn on a canvas and draped on the terrain
  function buildGround(){
    if (!NEARM) return;
    const size = 2048, x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx;
    // the roads on the ground are off (the canvas was a blank 2048 x 2048 uploaded with mipmaps at every rebuild): no ground texture
    GTEX = null;
    GRECT = [x0, z0, 1 / sx, 1 / sx];
    // shore layer for the water: R = land cover (surf band), G = how shallow
    const S2 = 256, dat = new Uint8Array(S2 * S2 * 4), st = sx / S2, dok = mapViewReady(x0 / 1000, z0 / 1000, (x0 + sx) / 1000, (z0 + sx) / 1000, () => staleMesh('near'));
    for (let j = 0; j < S2; j++) for (let i = 0; i < S2; i++){ const x = x0 + (i + 0.5) * st, z = z0 + (j + 0.5) * st, m = dok ? (mapSimAt({x:x / 1000, y:z / 1000}) ? rbilM(MAPD.L.mask, x, z) : rbilM(MAPD.L.land200, x, z)) : rbilM(MAPD.L.land200, x, z), o = (j * S2 + i) * 4, dd = m > 0.5 ? 0 : dok ? depthF({x:x / 1000, y:z / 1000}) : 50; dat[o] = Math.round(m * 255); dat[o + 1] = Math.round(clamp(1 - dd / 14, 0, 1) * 255); dat[o + 3] = 255; }
    STEX = STEX || gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, STEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S2, S2, 0, gl.RGBA, gl.UNSIGNED_BYTE, dat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    SRECT = [x0, z0, 1 / sx, 1 / sx];
    { const n = NEARM.gn, px = new Uint8Array(n * n); for (let k = 0; k < n * n; k++) px[k] = Math.round(clamp((NEARM.h[k] + 8) / 16, 0, 1) * 255);
      HTEX = HTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, n, n, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, px); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0); }
    buildLandMask();
  }
  // The shore texture over the near terrain (2048 x 2048, 4096 on ultra; 1.5-6 m a texel; LUMINANCE, h = r * 8 - 4 m, no mips):
  // the foreshore's own height by the profile of terrRaw (COAST3), drawn from the chart packs' coast2 with a canvas: the sea black
  // (-4 m), the coast's rings stroked widest first in steps of about half a metre of height, the land's at 1 in 3 and the breakwaters'
  // (class 2 and 3) at 1 in 1.5, all in the order of their height so the nearest shore wins where two meet, and the land filled over
  // them at COAST3.top (1.7 m), so the ramp lies on the sea's side alone. Then the harbour units' basins and the quays' pockets as
  // deep water and their blocks and fills as land a texel wider than they are, so the cut never bites a deck (quay walls are plumb).
  // The terrain shader cuts the ground that stands over the tide where the texture lies under it (uLand, uTideY), and the sea shader
  // puts the surf where the texture meets the tide (uLandS): one waterline, read the same on every GPU (no mip, no bias).
  // Off the tiles with a chart pack (or until it comes) there is no texture, and the ground meets the sea where it is.
  // (Jonas 12.10.2026, #61: the binary mask of before, read from a mip at a distance, cut thin land and the hills behind it, left the
  // surf beside the land and the foreshore's ramp as a brown line in the water.)
  // Drawn a few strokes a frame (lmStep, LMSLICE ms): the coast within a window of the whole coast runs to tens of thousands of points,
  // and 24 strokes of it at once stalled a tablet for a second. The texture in use (LMTEX, LRECT) stands until the new one is done.
  let LMON = false, LMTEXEL = 3, LMMS = 0, LRECT = null, LMJOB = null;   // LMTEXEL: metres per texel; LMMS: the last build's time (ms); LRECT: [x0, z0, 1/sx, 1/sx] of the texture in use
  const LMSLICE = 9, lmByte = h => Math.round(clamp((h + 4) / 8, 0, 1) * 255), lmCol = h => { const b = lmByte(h); return 'rgb(' + b + ',' + b + ',' + b + ')'; };
  function buildLandMask(){
    if (!NEARM) return;
    const t0 = performance.now(), size = Math.min(QUAL.lvl === 3 ? 4096 : 2048, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048), x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx, T = MAPD.man.tile * 1000;
    const pks = mapPacksIn('chart', x0 / 1000, z0 / 1000, (x0 + sx) / 1000, (z0 + sx) / 1000);
    if (!pks.length){ LMON = false; LMJOB = null; return; }
    const wait = pks.filter(pk => !pk.buf); if (wait.length){ Promise.all(wait.map(mapLoad)).then(() => buildLandMask(), e => console.error(e)); return; }
    // the rings within the window and the ramp's reach, per pack
    const W = (COAST3.top + 4) / COAST3.g + 2, paths = [];
    for (const pk of pks){ const ox = pk.tile[0] * T, oz = pk.tile[1] * T, P = chartPathsIn(pk, [x0 - ox - W, z0 - oz - W, x0 + sx - ox + W, z0 + sx - oz + W]); if (P && P.n) paths.push({pk, ox, oz, P}); }
    // the strokes: for each ring class its ramp down from the line, as (height, half width) pairs, drawn deepest first
    const steps = [], sz = 0.5;
    for (const [key, gr] of [['land', COAST3.g], ['mole', COAST3.gMole]]){
      if (!paths.some(q => q.P[key])) continue;
      const Wc = (COAST3.top + 4) / gr, n = Math.ceil(Wc * gr / sz);
      for (let i = 0; i < n; i++){ const w1 = Wc * (1 - i / n), w0 = Wc * (1 - (i + 1) / n); steps.push({key, w:w1, h:COAST3.top - (w1 + w0) / 2 * gr}); }
    }
    steps.sort((a, b) => a.h - b.h);
    lcv = lcv || document.createElement('canvas'); if (lcv.width !== size) lcv.width = lcv.height = size;
    const g = lcv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = lmCol(-4); g.fillRect(0, 0, size, size); g.lineJoin = 'round'; g.lineCap = 'round';
    LMJOB = {g, paths, steps, i:0, x0, z0, sx, k, size, t0, ms:performance.now() - t0};
    lmStep();
  }
  // a slice of the shore texture's drawing; the rest when it is done
  function lmStep(){
    const J = LMJOB; if (!J) return; const t0 = performance.now(), until = t0 + LMSLICE, {g, paths, steps, x0, z0, sx, k} = J;
    const tf = q => g.setTransform(1000 * k, 0, 0, 1000 * k, (q.ox - x0) * k, (q.oz - z0) * k);
    while (J.i < steps.length){
      const st = steps[J.i++]; g.strokeStyle = lmCol(st.h); g.lineWidth = 2 * st.w / 1000;
      for (const q of paths){ const p = q.P[st.key]; if (!p) continue; tf(q); g.stroke(p); }
      if (performance.now() > until){ J.ms += performance.now() - t0; return; }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const near = (x, z) => x > x0 - 300 && x < x0 + sx + 300 && z > z0 - 300 && z < z0 + sx + 300;
    // a fill's own sides fall 1 in 1.6 (unitTerr): its ramp round it, as a breakwater's, under the land's fill (its land side stays land)
    const fp = new Path2D(); let anyF = false;
    for (const U of UNITA){ if (!near(U.o[0], U.o[1]) || !U.f || U.f.length < 6) continue; anyF = true;
      for (let i = 0; i < U.f.length; i += 2){ const [x, z] = unitW(U, U.f[i], U.f[i + 1]); i ? fp.lineTo((x - x0) * k, (z - z0) * k) : fp.moveTo((x - x0) * k, (z - z0) * k); } fp.closePath(); }
    if (anyF) for (const st of steps){ if (st.key !== 'mole') continue; g.strokeStyle = lmCol(st.h); g.lineWidth = 2 * st.w * k; g.stroke(fp); }
    g.fillStyle = lmCol(COAST3.top);
    for (const q of paths){ if (!q.P.all) continue; tf(q); g.fill(q.P.all, 'nonzero'); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const poly = (pts, h, wide) => { g.fillStyle = g.strokeStyle = lmCol(h); g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo((x - x0) * k, (z - z0) * k) : g.moveTo((x - x0) * k, (z - z0) * k)); g.closePath(); g.fill(); if (wide){ g.lineWidth = 2; g.stroke(); } };
    for (const U of UNITA){ if (!near(U.o[0], U.o[1])) continue; const q = ugeo(U);
      poly([[-q.basinX, 0.2], [q.basinX, 0.2], [q.basinX, q.basinZ], [-q.basinX, q.basinZ]].map(([a, b]) => unitW(U, a, b)), -4); }
    for (const f of qPockets()){ if (!near(f.x, f.z)) continue; const s = f.hl + 4, Q = (a, b) => [f.x + f.ux * a + f.nx * b, f.z + f.uz * a + f.nz * b]; poly([Q(-s, 0.2), Q(s, 0.2), Q(s, POCKET), Q(-s, POCKET)], -4); }
    for (const U of UNITA){ if (!near(U.o[0], U.o[1])) continue;
      const fl = []; for (let i = 0; i < U.f.length; i += 2) fl.push(unitW(U, U.f[i], U.f[i + 1])); poly(fl, COAST3.top, true);
      const q = ugeo(U); poly([[-q.E, -q.B], [q.E, -q.B], [q.E, 0], [-q.E, 0]].map(([a, b]) => unitW(U, a, b)), COAST3.top, true); }
    LMTEX = LMTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, lcv);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
    LMON = true; LMTEXEL = sx / J.size; LRECT = [x0, z0, 1 / sx, 1 / sx]; LMJOB = null; LMMS = J.ms + performance.now() - t0;
  }
  // the flat sea as a ring: the rectangle R [x0, z0, x1, z1] less the hole Hl where something nearer is drawn, as up to four strips,
  // so no water is shaded twice and the shader never discards (which costs the early depth test on phone and tablet GPUs)
  function seaRing(u, eye, y, R, Hl){
    if (Hl){ Hl = [Math.max(R[0], Hl[0]), Math.max(R[1], Hl[1]), Math.min(R[2], Hl[2]), Math.min(R[3], Hl[3])]; if (Hl[2] <= Hl[0] || Hl[3] <= Hl[1]) Hl = null; }
    const strips = Hl ? [[R[0], R[1], R[2], Hl[1]], [R[0], Hl[3], R[2], R[3]], [R[0], Hl[1], Hl[0], Hl[3]], [Hl[2], Hl[1], R[2], Hl[3]]] : [R];
    attr(0, FARQ.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FARQ.ib);
    for (const [a, b, c, d] of strips){
      if (c - a < 0.5 || d - b < 0.5) continue; const ox = (a + c) / 2, oz = (b + d) / 2;
      gl.uniform2fv(u.uScale, [(c - a) / 2, (d - b) / 2]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], y, oz - eye[2]]);
      gl.drawElements(gl.TRIANGLES, FARQ.n, gl.UNSIGNED_SHORT, 0);
    }
  }
  function drawSea(VP, eye, t, far, drop){
    { const np = QUAL.lvl === 3 && UINT ? 300 : 150; if (np !== NP){ NP = np; buildPatch(); } }   // the wave patch: 2 m on ultra
    const P = far && (drop === undefined || !QUAL.lvl) ? PSF : PS; gl.useProgram(P.p); const u = P.u;   // low quality: the far shader right up to the wave patch
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uHalf, HALF); gl.uniform1f(u.uFlat, far ? 1 : 0);
    gl.uniform1f(u.uCell, 2 * HALF / NP); gl.uniform1f(u.uPx, 2 * Math.tan(curFov / 2) / Math.max(canvas.height, 1)); gl.uniform1f(u.uDbg, SEADBG ? 1 : 0);
    // the local sea: the textures on units 4 and 5 (a 1 x 1 stand-in until they are ready)
    gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform4fv(u.uWk2, WK.u2); gl.uniform4fv(u.uWk3, WK.u3);
    gl.uniform4fv(u.uSea, [WV.C, WV.cap, WV.lnFcap, WV.swHs]); gl.uniform4fv(u.uSea2, [WV.dot, WV.steep, ssBlend(SSL.n), ssBlend(SSL.w)]); gl.uniform4fv(u.uLocal, WV.loc);
    for (const L of [SSL.n, SSL.w]){ gl.activeTexture(gl.TEXTURE0 + L.unit); gl.bindTexture(gl.TEXTURE_2D, L.on ? L.tex : SSDUMMY); gl.uniform1i(L === SSL.n ? u.uSSTn : u.uSSTw, L.unit); gl.uniform4fv(L === SSL.n ? u.uSSN : u.uSSW, L.on ? [L.rect[0] - RO.x, L.rect[1] - RO.z, 1 / L.rect[2], 1] : [0, 0, 1, 0]); }
    gl.activeTexture(gl.TEXTURE0);
    // the waves' phases and their groups' phases at the render origin (doubles, then wrapped), so the shaders work near zero
    const ub = WV.ub.slice(), gp = new Float32Array(13), TAU = 2 * Math.PI;
    for (let i = 0; i < 13; i++){ const c = WV.list[i]; if (!c) continue; const a = c.Dx * RO.x + c.Dz * RO.z, g = c.Dz * RO.x - c.Dx * RO.z;
      ub[i * 4 + 2] = (c.ph + c.k * a) % TAU; gp[i] = (i * 2.59 + c.k * (0.083 * a + 0.041 * g)) % TAU; }
    gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, ub); gl.uniform1fv(u.uGp, gp); if (u.uFWa){ gl.uniform4fv(u.uFWa, WV.ua); gl.uniform4fv(u.uFWb, ub); gl.uniform1fv(u.uFGp, gp); } plSet(u);
    if (u.uNFp){ gl.uniform1fv(u.uNFp, NF.ph); gl.uniform1fv(u.uNFg, NF.gp); } if (u.uFNFp){ gl.uniform1fv(u.uFNFp, NF.ph); gl.uniform1fv(u.uFNFg, NF.gp); } if (u.uNFD) gl.uniform2f(u.uNFD, NF.D[0], NF.D[1]);
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uDeep, [0.035, 0.14, 0.18]); gl.uniform1f(u.uWind, env.wind); gl.uniform2fv(u.uWindDir, env.windDir); gl.uniform1f(u.uSpec, env.spec);
    gl.uniform1f(u.uLSOn, LMTEX && LMON && LRECT ? 1 : 0); if (LMTEX && LMON && LRECT){ gl.activeTexture(gl.TEXTURE6); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLandS, 6); gl.activeTexture(gl.TEXTURE0); gl.uniform4fv(u.uLRect, [LRECT[0] - eye[0], LRECT[1] - eye[2], LRECT[2], LRECT[3]]); }
    gl.uniform1f(u.uSOn, STEX ? 1 : 0); gl.uniform1f(u.uHOn, HTEX ? 1 : 0); gl.uniform1f(u.uTideL, env.tide || 0); if (HTEX){ gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.uniform1i(u.uHgt, 3); gl.activeTexture(gl.TEXTURE0); } if (STEX) gl.uniform4fv(u.uSRect, [SRECT[0] - eye[0], SRECT[1] - eye[2], SRECT[2], SRECT[3]]);
    gl.disableVertexAttribArray(1);
    if (far){
      // flat sea: the whole map less the near terrain for the far pass; in the near pass the near terrain's square (or around the camera)
      // less the wave patch around the boat
      const y = -eye[1] - (drop || 0) + (env.tide || 0);
      if (drop === undefined){ const ox = TERR ? TERR.cx : bv.x, oz = TERR ? TERR.cz : bv.z, sc = TERRW.span / 2 + 40000;
        seaRing(u, eye, y, [ox - sc, oz - sc, ox + sc, oz + sc], NEARM ? [NEARM.x0, NEARM.z0, NEARM.x0 + NEARM.sx, NEARM.z0 + NEARM.sz] : null); }
      else {
        let R; if (NEARM) R = [NEARM.x0 - 20, NEARM.z0 - 20, NEARM.x0 + NEARM.sx + 20, NEARM.z0 + NEARM.sz + 20];
        else { const ox = Math.round(eye[0] / 100) * 100, oz = Math.round(eye[2] / 100) * 100, sc = far * 1.15; R = [ox - sc, oz - sc, ox + sc, oz + sc]; }
        const st = 2 * HALF / NP, px = Math.round(bv.x / st) * st, pz = Math.round(bv.z / st) * st, hh = HALF * 0.97;
        seaRing(u, eye, y, R, [px - hh, pz - hh, px + hh, pz + hh]);
      }
    } else {
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step;
      gl.uniform2fv(u.uScale, [1, 1]); gl.uniform2fv(u.uOrigin, [ox - RO.x, oz - RO.z]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], -eye[1] + (env.tide || 0), oz - eye[2]]);
      attr(0, PATCH.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PATCH.ib); gl.drawElements(gl.TRIANGLES, PATCH.n, PATCH.i32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    }
  }

  // ---------- setup ----------
  // What stopped the 3D view, shown with the message so a device it fails on tells why (the user's phone 04.10.2026: «3D-visning
  // støttes ikke» with no more to go on): the step and the error, or the shader's log
  let failWhy = '', stage = '', GPU = '', glWatch = false;
  // How heavy a sea this device has managed, kept on the device (dsb_sea): 0 the full sea, 1 the far pass's simpler sea for both passes
  // (no sea-state texture in the vertex shader, four wind waves, no ripples), 2 the flat basic sea. On a PC the shaders are compiled by
  // Direct3D's compiler when they are linked, and the full sea can take it so long that the browser restarts the GPU and the page loses
  // its context (Intel Iris Xe, Chrome on Windows, 05.10.2026: «sjø link: ingen logg», then every later try failed and «WebGL-konteksten
  // ble mistet»). A context lost while the shaders are made sets the next level for the next try (the restored context, or a reload);
  // Intel on Direct3D starts at 1. #sealvl=N in the address forces one (the tests).
  // Every Direct3D 11 so far has lost it on the full sea, whatever the maker (Intel Iris Xe in Chrome, NVIDIA GTX 980 in Firefox,
  // 05.10.2026), so Direct3D starts at 1. And as the driver may take the whole GPU process with it before the browser says the context
  // is lost (Firefox: every compile after it fails with no log, isContextLost still false), the level being tried is written down first
  // (SEA_TRY) and cleared when it has worked: a try that never came back puts the next load a level down.
  const SEA_KEY = 'dsb_sea', SEA_TRY = 'dsb_sea_try'; let seaLvl = 0, seaBumped = false;
  const seaLvlGet = () => { const m = /sealvl=(\d)/.exec(location.hash); if (m) return Math.min(2, +m[1]); let v = 0, t = null;
    try { v = +localStorage.getItem(SEA_KEY) || 0; t = localStorage.getItem(SEA_TRY); } catch (e){}
    if (t !== null && +t + 1 > v){ v = Math.min(2, +t + 1); seaBumped = true; try { localStorage.setItem(SEA_KEY, String(v)); } catch (e){} }
    return Math.min(2, /Direct3D/i.test(GPU) ? Math.max(v, 1) : v); };
  // the sea program that linked on this device when the full one did not, for this version of the sea's shaders (SEA_VER: change it
  // when they change, so every device tries the full sea again); #sealite in the address forces the lite one (the tests)
  const SEA_OK = 'dsb_sea_ok', SEA_VER = 'u1';
  const seaOkGet = () => { if (/sealite/.test(location.hash)) return 'true,true,true'; if (/sealvl=/.test(location.hash)) return null;
    try { const v = localStorage.getItem(SEA_OK) || ''; return v.startsWith(SEA_VER + ':') ? v.slice(SEA_VER.length + 1) : null; } catch (e){ return null; } };
  const seaOkSet = v => { if (/sealvl=|sealite/.test(location.hash)) return; try { if (v) localStorage.setItem(SEA_OK, SEA_VER + ':' + v); else localStorage.removeItem(SEA_OK); } catch (e){} };
  const seaTryMark = on => { if (/sealvl=/.test(location.hash)) return; try { if (on) localStorage.setItem(SEA_TRY, String(seaLvl)); else localStorage.removeItem(SEA_TRY); } catch (e){} };
  // after a compile or link that failed with no word why: a moment for the browser to notice a lost context, before trying the next
  const glSettle = async () => { await new Promise(r => setTimeout(r, 80)); if (gl.isContextLost()) throw new Error('konteksten er mistet'); };
  const opt = (nm, f) => { try { f(); } catch (e){ console.error(nm, e); } };    // a part the view can do without
  async function init(){
    if (ready) return true; if (failed) return false;
    try {
      stage = 'webgl';
      // the settings the view wants, then plainer ones: some PCs (Adrian, 04.10.2026) give no context with antialiasing or the
      // high-performance GPU asked for, and do with neither
      const ctxTry = o => { try { return canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o); } catch (e){ return null; } };
      gl = ctxTry({antialias:true, alpha:false, powerPreference:'high-performance'}) || ctxTry({antialias:false, alpha:false}) || ctxTry({alpha:false, failIfMajorPerformanceCaveat:false}) || ctxTry(undefined);
      // none at all: the browser has 3D off for the page, most often after the driver gave up here once (Chrome keeps it off until it is
      // closed and opened again), or for the machine
      if (!gl) throw new Error(S.lang === 'en' ? 'no WebGL context (the browser has turned 3D off, often after a driver error: close the browser fully and open it again)' : 'ingen WebGL-kontekst (nettleseren har slått av 3D, ofte etter en driverfeil: lukk nettleseren helt og åpne den igjen)');
      { const dbg = gl.getExtension('WEBGL_debug_renderer_info'); GPU = String((dbg && gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '').slice(0, 80); }
      // what lives on the GPU and whether the page was out of sight, for the log when the context is lost in play (#171, a phone that
      // loses it 11-17 minutes in): the buffers and textures made and not deleted, counted where the view makes them (rare calls only)
      if (!gl.__n){ gl.__n = true; GLN.b = 0; GLN.t = 0; GLN.t0 = performance.now();
        const cb = gl.createBuffer.bind(gl), db = gl.deleteBuffer.bind(gl), ct = gl.createTexture.bind(gl), dtx = gl.deleteTexture.bind(gl);
        gl.createBuffer = () => { GLN.b++; return cb(); }; gl.deleteBuffer = x => { if (x) GLN.b--; return db(x); };
        gl.createTexture = () => { GLN.t++; return ct(); }; gl.deleteTexture = x => { if (x) GLN.t--; return dtx(x); };
        document.addEventListener('visibilitychange', () => { if (document.hidden) GLN.hid = Date.now(); else GLN.vis = Date.now(); }); }
      if (!glWatch){
        // a lost context: the view stops; lost before it was ready (a phone short of memory, or a GPU process that restarted), it
        // starts again when the browser gives the context back
        glWatch = true; let wasReady = false;
        canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); wasReady = ready; ready = false; failed = true; show(false);
          if (!wasReady && stage === 'shadere' && seaLvl < 2){ try { localStorage.setItem(SEA_KEY, String(seaLvl + 1)); } catch (e2){}
            failWhy = S.lang === 'en' ? 'the graphics driver gave up while starting. Reload the page and the game tries a simpler sea' : 'grafikkdriveren ga opp under oppstarten. Last siden på nytt, så prøver spillet en enklere sjø';
            if (typeof cloudErr === 'function') cloudErr('3D konteksten mistet i shaderne, sjønivå ' + seaLvl + ' → ' + (seaLvl + 1) + ' · ' + GPU, 'view3d init', ''); }
          else { failWhy = 'WebGL-konteksten ble mistet'; if (wasReady && typeof cloudErr === 'function') cloudErr('3D konteksten mistet under spill · ' + GPU + ' · ' + glDiag(), 'view3d', ''); } });
        // lost in play, every buffer, texture and program is gone with it: the game saves and loads the page again, which builds them
        // anew, at most once in ten minutes (sessionStorage), so a driver that keeps failing does not reload the page over and over
        canvas.addEventListener('webglcontextrestored', () => { if (!wasReady){ failed = false; failWhy = ''; show(true); return; }
          let last = 0; try { last = +sessionStorage.getItem('dsb_gl_reload') || 0; } catch (e){}
          if (Date.now() - last > 600000){ try { sessionStorage.setItem('dsb_gl_reload', String(Date.now())); } catch (e){}
            toast(S.lang === 'en' ? 'The 3D view was lost. The game is saved and loads again …' : '3D-visningen ble borte. Spillet lagres og lastes på nytt …');
            if (typeof save === 'function') save(); setTimeout(() => location.reload(), 1500); return; }
          toast(S.lang === 'en' ? 'The 3D view was lost. Reload the page to get it back.' : '3D-visningen ble borte. Last siden på nytt for å få den tilbake.'); });
      }
      if (gl.isContextLost()){ stage = 'webgl'; throw new Error('konteksten er mistet (venter på at nettleseren gir den tilbake)'); }
      if (!gl.getExtension('OES_standard_derivatives')) throw new Error('mangler OES_standard_derivatives');
      UINT = !!gl.getExtension('OES_element_index_uint'); qualSet();   // 32-bit indices: the ultra level's big meshes
      stage = 'shadere';
      PL = program(LIT_VS, LIT_FS, ['aPos', 'aCol'], 'lit'); PT = program(TER_VS, terFS(0), ['aPos', 'aCol', 'aNor', 'aShd', 'aMat'], 'terreng'); PTS = [PT, null, null]; PRGN = program(LITN_VS, LITN_FS, ['aPos', 'aNor', 'aCol'], 'modell'); PRGX = program(TEX_VS, TEX_FS, ['aPos', 'aUV'], 'tekstur'); PRGW = program(WK_VS, WK_FS, ['aPos', 'aW', 'aS'], 'kjølvann');
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; // the waves read the sea-state texture in the vertex shader where the GPU can (#novtf in the address tries without)
      SST_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 2 && !/novtf/.test(location.hash);
      // The sea is the heaviest program, and a phone's driver may refuse to link it with no word why (Adreno 642L, 05.10.2026: «sjø link:
      // ingen logg fra driveren»): then it tries without the texture in the vertex shader, then with the far pass's simpler waves, and
      // tells the cloud which one it took
      seaLvl = seaLvlGet(); seaTryMark(true);
      if (seaBumped && typeof cloudErr === 'function') cloudErr('3D sjønivå ' + seaLvl + ' etter et forsøk som ikke kom tilbake · ' + GPU, 'view3d init', '');
      // [no texture in the vertex shader, the far pass's waves, the lite vertex shader]; the one that worked on this device last time with
      // these shaders (SEA_OK) is where it starts, so a phone does not link the ones its driver refused at every start
      let seaTry = (seaLvl >= 2 ? [] : seaLvl === 1 ? [[true, true, false], [true, true, true]] : [[!SST_VS, false, false], [true, false, false], [true, true, false], [true, true, true]])
        .filter((t, i, a) => a.findIndex(u => u.join() === t.join()) === i);
      const seaWhy = [], seaOk = seaOkGet(); let seaKnown = false;
      if (seaOk === 'basic') { seaTry = []; seaKnown = true; } else if (seaOk){ const k = seaTry.findIndex(t => t.join() === seaOk); if (k > 0){ seaTry = seaTry.slice(k); seaKnown = true; } }
      PS = null;
      for (const [nosst, far, lite] of seaTry){
        try { PS = program((nosst ? '#define NOSST\n' : '') + (lite ? SEA_VS_LITE : SEA_VS), SEAF((far ? '#define FAR\n' : '') + SEA_FS), ['aXZ'], 'sjø'); SST_VS = !nosst; PS.far = far; PS.lite = lite;
          if (seaWhy.length || seaKnown) seaOkSet([nosst, far, lite].join()); else seaOkSet(null); break; }
        catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); if (/ingen logg/.test(e.message)) await glSettle(); }
      }
      let seaDiag = '';
      if (!PS && seaLvl < 2 && !seaKnown){
        // which half the driver will not take, for the report: the sea's vertex shader with a plain fragment shader, and the other way round
        const tryLink = (vs, fs) => { try { program(vs, fs, ['aXZ'], 'prøve'); return 'ok'; } catch (e){ return 'feil'; } };
        seaDiag = ' · VS alene ' + tryLink('#define NOSST\n' + SEA_VS, 'precision highp float;varying vec3 vW;varying vec2 vXZ;void main(){gl_FragColor=vec4(fract(vW*0.01)+vec3(fract(vXZ*0.01),0.0),1.0);}') +
          ', FS alene ' + tryLink(BASIC_VS, SEAF('#define FAR\n' + SEA_FS));
        try { PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; seaDiag += ', enkel sjø ok'; seaOkSet('basic'); }
        catch (e){ throw new Error(seaWhy.join(' / ') + seaDiag); }
      }
      if (!PS){ PS = program(BASIC_VS, BASIC_FS, ['aXZ'], 'enkel sjø'); PS.basic = true; SST_VS = false; }
      try { PSF = PS.basic || PS.far ? PS : program('#define NOSST\n' + SEA_VS, SEAF('#define FAR\n' + SEA_FS), ['aXZ'], 'sjø langt'); }
      catch (e){ if (gl.isContextLost()) throw e; seaWhy.push(e.message); PSF = PS; }
      await glSettle(); seaTryMark(false);   // the sea came through and the context is still there
      if (seaWhy.length && typeof cloudErr === 'function') cloudErr('3D sjø med reserve (' + (SST_VS ? 'vtf' : 'novtf') + (PSF === PS ? ', én sjø' : '') + (PS.lite ? ', lett' : '') + seaDiag + ') · ' + GPU, 'view3d init', seaWhy.join('\n'));
      SSDUMMY = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, SSDUMMY); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); PK = program(SKY_VS, SKY_FS, ['aP'], 'himmel'); PP = program(PT_VS, PT_FS, ['aPos', 'aA'], 'punkter');
      DYNP = buf(new Float32Array(4000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); DYNA = buf(new Float32Array(4000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      // the ground's heights and the forest (map/, the view packs): until they are in, the land is a flat stand-in
      HG = true;   // the ground comes in packs round the boat as it goes (stream3d); until a pack is in, its land is a stand-in
      stage = 'bygg'; try { BLD = await loadBuildings(); } catch (e){ console.error(e); BLD = null; }
      for (const [nm, f] of [['terreng', buildTerrain], ['kai', buildStatics], ['båt', buildBoat], ['skiff', buildSkiff], ['flagg', buildFlag], ['sjø', buildSea]]){ stage = nm; f(); }
      opt('wild', buildWild); opt('npc', buildNPC); opt('air', buildAir); opt('rescue', buildRescue);
      for (const [nm, f] of [['havn', buildHarbourFittings], ['fortøying', buildMooring], ['mottak', buildPlants], ['folk', buildPlantParts], ['bunkers', buildBunkers]]){ stage = nm; f(); }
      buildLabels();
      ready = true; return true;
    } catch (e){
      console.error(e); failed = true; failWhy = stage + ': ' + String(e && e.message || e).replace(/\s+/g, ' ').slice(0, 160) + (GPU ? ' · ' + GPU : '');
      // to the cloud's error log with the GPU and its limits, so a phone it fails on can be looked into
      if (typeof cloudErr === 'function'){ let lim = ''; try { lim = ['MAX_FRAGMENT_UNIFORM_VECTORS', 'MAX_VERTEX_UNIFORM_VECTORS', 'MAX_VARYING_VECTORS', 'MAX_VERTEX_TEXTURE_IMAGE_UNITS'].map(k => k.replace('MAX_', '').toLowerCase() + '=' + gl.getParameter(gl[k])).join(' '); } catch (e2){} cloudErr('3D ' + failWhy, 'view3d init', lim + '\n' + String(e && e.stack || '')); }
      return false;
    }
  }
  // the crew's words over their heads (Jonas 08.10.2026, tilbakemelding #44: «kommentarer fra mannskap burde komme opp som flytende tekst
  // over hodet ... La gjerne også kommentaren henge 10 sekunder»): the line stands over the one who says it for SAYMS, fading in and out
  // the anchor alarm on screen (G3.anchorAlarm, from hooks.onAnchorAlarm): a red banner for a few seconds, and the masthead light flashing red
  const ANCHAL = {until:0, kind:'', el:null, drawn:0};
  function anchorAlarm3d(kind){ ANCHAL.until = performance.now() + 9000; ANCHAL.kind = kind; }
  const SAYMS = 10000, SAY = {c:null, w:null, b:null, txt:'', t0:0, a:null, el:null};
  // another player's boat says a hail (ui/10n-hail.js): over her, followed as she moves
  function sayBoat(id, txt){ if (!active) return false; SAY.c = SAY.w = null; SAY.b = id; SAY.txt = txt; SAY.t0 = performance.now(); return true; }
  // a hand at the plant (core/09d-folk.js plantSay): over his head when the plant is the one near the eye, else false (the caller toasts it)
  function sayWorker(pid, idx, nm, no, en){ if (!active) return false; const P = PLANTS.find(q => q.id === pid); if (!P) return false; SAY.c = SAY.b = null; SAY.w = {pid, idx}; SAY.txt = nm + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  // a moment on deck for a crew member at his place (14-crewlife.js crewSlip through hooks.onCrewFx): 'slip' (a fish over the side, at the
  // rail nearest him) or 'cut' (the hand shaken; the tape after is drawn from c.cut)
  const CFX = new Map();
  function crewFx3d(c, kind, o){ if (!active || !c || typeof CREW3D === 'undefined' || !CREW3D.on()) return false; const a = CREW3D.anchorOf(c.id); if (!a || a.mode !== 'at') return false;
    CFX.set(a.id, {kind, t0:performance.now() / 1000, sp:(o && o.sp) || 'torsk', kg:(o && o.kg) || 3, rail:kind === 'slip' ? CREW3D.railNear(a) : null}); DKN[kind] = (DKN[kind] || 0) + 1; return true; }
  function say3d(c, no, en){ if (!active || !c) return false; SAY.w = SAY.b = null; SAY.c = c; SAY.txt = c.name.split(' ')[0] + ': «' + (S.lang === 'no' ? no : en) + '»'; SAY.t0 = performance.now(); return true; }
  let labelEls = [];
  // (the harbours' names floating over the 3D view are gone, Jonas 13.10.2026: «Fjernes teksten for stedsnavn som flyter i luften»; the
  // layer stays for the crew's lines and the anchor alarm)
  function buildLabels(){ labelsEl.innerHTML = ''; labelEls = []; }
  function resize(){
    const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, QUAL.dpr[QUAL.lvl]);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h){ canvas.width = w; canvas.height = h; }
  }

  // ---------- wildlife ----------
  function bodyLoft(m, L, R, prof, col, belly, y0){
    const NS = 12, NA = 8, ring = s => { const r = R * prof(s), z = -L / 2 + s * L; return Array.from({length:NA}, (_, k) => { const a = k / NA * Math.PI * 2; return [Math.sin(a) * r, (y0 || 0) + Math.cos(a) * r * 0.85, z]; }); };
    for (let i = 0; i < NS; i++){ const A = ring(i / NS), B2 = ring((i + 1) / NS); for (let k = 0; k < NA; k++){ const k2 = (k + 1) % NA, lowr = k >= 2 && k <= 5; m.quad(A[k], A[k2], B2[k2], B2[k], lowr && belly ? belly : col); } }
  }
  function buildWild(){
    const W = {};
    let m = MB(); m.box(0, -0.05, 0, 0.12, 0.11, 0.42, [0.95, 0.95, 0.94], 0); m.box(0, -0.02, -0.26, 0.09, 0.09, 0.1, [0.97, 0.97, 0.96], 0); m.box(0, -0.01, -0.33, 0.03, 0.03, 0.06, [0.95, 0.75, 0.2], 0); m.box(0, -0.04, 0.24, 0.14, 0.03, 0.12, [0.85, 0.86, 0.87], 0); W.gull = m.mesh();
    const wing = sx => { const w = MB(), g = [0.62, 0.66, 0.7], k = [0.1, 0.1, 0.1]; w.quad([0.05 * sx, 0, -0.1], [0.5 * sx, 0, -0.05], [0.5 * sx, 0, 0.1], [0.05 * sx, 0, 0.12], g); w.quad([0.5 * sx, 0, -0.05], [0.72 * sx, 0, 0], [0.72 * sx, 0, 0.07], [0.5 * sx, 0, 0.1], k); return w.mesh(); };
    W.wingR = wing(1); W.wingL = wing(-1);
    // the gulls from Blender (tools/wild/maake.py, the user's wish 03.10.2026): a herring gull, and a great black-backed gull from the
    // same parts with the mantle and the upper wing (zone 1) painted black-grey; the wings beat at the shoulder and the wrist
    if (typeof glbHas === 'function' && glbHas('gull')){
      const G = glbLoad('gull'), ex = (G && G.ex) || {}, mk = (nm, zc) => { const o = glbPart('gull', nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
        for (let i = 0; i < n; i++){ const z = zc && o.zone[i] === 1; for (let k = 0; k < 3; k++) c[i * 3 + k] = z ? zc[k] * (o.ao[i] || 1) : o.c[i * 4 + k]; }
        return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
      if (ex.shoulder && ex.wrist){
        W.G = {sh:ex.shoulder, wr:ex.wrist};
        for (const [k, zc] of [['gullG', null], ['gullB', [0.16, 0.17, 0.19]]]) W[k] = {body:mk('body', zc), armR:mk('armR', zc), handR:mk('handR', zc), armL:mk('armL', zc), handL:mk('handL', zc)};
      }
    }
    const prof = s => Math.sin(Math.min(1, s * 1.15) * Math.PI) ** 0.6 * (s > 0.85 ? 1 - (s - 0.85) * 4 : 1) + 0.05;
    m = MB(); bodyLoft(m, 1.7, 0.28, prof, [0.2, 0.22, 0.25], [0.55, 0.57, 0.6]); m.tri([0, 0.2, -0.02], [0, 0.45, 0.14], [0, 0.2, 0.28], [0.18, 0.2, 0.22]); W.porpoise = m.mesh();
    m = MB(); bodyLoft(m, 7, 0.95, prof, [0.05, 0.05, 0.06], [0.92, 0.92, 0.9]); m.tri([0, 0.75, -0.5], [0, 2.4, 0.35], [0, 0.75, 0.6], [0.05, 0.05, 0.06]); m.box(0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); m.box(-0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); W.orca = m.mesh();
    m = MB(); bodyLoft(m, 13, 1.6, prof, [0.13, 0.14, 0.16], [0.4, 0.42, 0.45]); m.tri([0, 1.3, 1.6], [0, 1.75, 2.3], [0, 1.3, 2.7], [0.13, 0.14, 0.16]); W.humpback = m.mesh();
    m = MB(); const d = [0.13, 0.14, 0.16], wht = [0.85, 0.85, 0.83];
    m.tri([0, 0, 0], [-2.3, 0, 1.1], [-0.4, 0, 1.3], wht); m.tri([0, 0, 0], [2.3, 0, 1.1], [0.4, 0, 1.3], wht); m.tri([0, 0.02, 0], [-0.4, 0.02, 1.3], [0.4, 0.02, 1.3], d); m.box(0, -0.3, -1.4, 0.5, 0.6, 2.6, d, 0); W.fluke = m.mesh();
    WILDM = W;
  }
  const GULLS = Array.from({length:6}, (_, i) => ({ph:i * 1.13, r:9 + i * 3.2, w:0.32 + (i % 3) * 0.1, h:6 + (i * 2.3) % 8, dir:i % 2 ? 1 : -1, blk:i % 3 === 1}));
  const WILD = {ev:[], next:8};
  const SPEC = {porpoise:{T:1.3, I:4.5, K:4, v:2.4, sp:4, n:[1, 3], r:0.28}, orca:{T:2.2, I:7, K:4, v:3, sp:9, n:[3, 5], r:0.95}, humpback:{T:3.6, I:14, K:4, v:1.4, sp:14, n:[1, 2], r:1.6}};
  function wildSpawn(t){
    if (t < WILD.next) return; WILD.next = t + 16 + Math.random() * 28;
    if (S.boat.status === 'port' || WV.hs > 1.6) return;
    const p = {x:bv.x / 1000, y:bv.z / 1000}, dd = depthF(p), mo = gDate(S.t / 60).getUTCMonth(), winter = (mo >= 10 || mo <= 1) ? 1 : (mo === 2 || mo === 9) ? 0.35 : 0.08;
    let type = null; const r = Math.random();
    if (dd > 40 && r < 0.4 * winter) type = Math.random() < 0.55 ? 'orca' : 'humpback'; else if (dd > 6 && r < 0.7) type = 'porpoise';
    if (!type) return;
    const a = Math.random() * Math.PI * 2, dm = type === 'porpoise' ? 45 + Math.random() * 90 : 160 + Math.random() * 260, x = bv.x + Math.sin(a) * dm, z = bv.z - Math.cos(a) * dm;
    if (isLand({x:x / 1000, y:z / 1000}) || depthF({x:x / 1000, y:z / 1000}) < 5) return;
    const sp = SPEC[type], n = sp.n[0] + Math.floor(Math.random() * (sp.n[1] - sp.n[0] + 1));
    WILD.ev.push({type, t0:t, x, z, hd:Math.random() * Math.PI * 2, n, blown:{}});
    if (WILD.ev.length > 4) WILD.ev.shift();
  }
  const BLOW = {x:new Float64Array(160), y:new Float64Array(160), z:new Float64Array(160), vx:new Float64Array(160), vy:new Float64Array(160), vz:new Float64Array(160), age:new Float64Array(160).fill(99), life:new Float64Array(160).fill(1), n:0};
  function blow(x, y, z){ for (let i = 0; i < 26; i++){ const k = BLOW.n = (BLOW.n + 1) % 160; BLOW.x[k] = x; BLOW.y[k] = y; BLOW.z[k] = z; BLOW.vx[k] = (Math.random() - 0.5) * 1.2 + env.windDir[0] * 1.5; BLOW.vz[k] = (Math.random() - 0.5) * 1.2 + env.windDir[1] * 1.5; BLOW.vy[k] = 3 + Math.random() * 4.5; BLOW.age[k] = 0; BLOW.life[k] = 1.6 + Math.random() * 1.4; } }
  function drawWild(eye, t, dt, M0){
    if (!WILDM) return;
    const night = env.night > 0.85;
    // gulls follow the boat in daylight
    if (!night && !cam.helm || !night && cam.helm){
      const st = S.boat.status, gut = (DECKACT.on && DECKACT.task === 'gut' && DECKACT.pt) || DKGULL, n = gut ? 6 : st === 'port' ? 3 : st === 'fishing' ? 6 : 4, fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
      for (let i = 0; i < n; i++){
        const g = GULLS[i], ang = t * g.w * g.dir + g.ph, cx = bv.x - fx * 8, cz = bv.z - fz * 8;
        let x = cx + Math.cos(ang) * g.r, z = cz + Math.sin(ang) * g.r, y = bv.y + (st === 'fishing' ? 2.5 + g.h * 0.4 : g.h) + Math.sin(t * 0.7 + g.ph) * 1.2;
        if (gut && i < 4){ const q = (t * 0.22 + i * 0.27) % 1; if (q < 0.35){ const k = Math.sin(q / 0.35 * Math.PI), P0 = gut; x += (P0[0] + Math.cos(i * 2.1) * 1.2 - x) * k; z += (P0[2] + Math.sin(i * 2.1) * 1.2 - z) * k; y += (P0[1] + 0.25 - y) * k; } }
        const vx = -Math.sin(ang) * g.dir, vz = Math.cos(ang) * g.dir, hd = Math.atan2(vx, -vz);
        // a few beats, then a glide (more beats and faster when it goes down for the offal)
        const diving = gut && i < 4, beating = diving || Math.sin(t * 0.5 + g.ph * 3) > 0.35, flap = beating ? Math.sin(t * 9 + g.ph) * 0.6 : 0.1 + Math.sin(t * 1.3 + g.ph) * 0.05;
        const ph = t * (diving ? 21 : 15.7) + g.ph * 7, pw = ph + 0.3 * Math.sin(ph);   // the downstroke quicker than the upstroke
        if (beating) y -= 0.05 * Math.sin(pw);   // the body rises as the wings come down
        const Mb = model(x - eye[0], y - eye[1], z - eye[2], -hd, beating ? 0.04 * Math.cos(pw) : 0, -g.dir * 0.35);
        if (WILDM.G){
          // two in six are great black-backed gulls, a little larger; the beat about 2.5 a second, the hand a little after the arm (the
          // whip of a real wing beat); gliding, the arms raised a little and the hands drooped (a gull's shallow M)
          const K = g.blk ? WILDM.gullB : WILDM.gullG, Ms = g.blk ? mul(Mb, M4.S(1.15)) : Mb, S0 = WILDM.G.sh, W0 = WILDM.G.wr, amp = diving ? 0.7 : 0.55;
          const a1 = beating ? 0.1 + amp * Math.sin(pw) : 0.08 + Math.sin(t * 1.3 + g.ph) * 0.04, a2 = beating ? 0.45 * Math.sin(pw - 0.8) : -0.16 + Math.sin(t * 1.1 + g.ph) * 0.03 + 0.05 * Math.sin(t * 0.37 + g.ph * 2);
          drawLit(K.body, Ms);
          for (const sd of [1, -1]){
            const Ma = chain(Ms, M4.T(S0[0] * sd, S0[1], S0[2]), M4.RZ(a1 * sd)); drawLit(sd > 0 ? K.armR : K.armL, Ma);
            drawLit(sd > 0 ? K.handR : K.handL, chain(Ma, M4.T((W0[0] - S0[0]) * sd, W0[1] - S0[1], W0[2] - S0[2]), M4.RZ(a2 * sd)));
          }
        }
        else { drawLit(WILDM.gull, Mb); drawLit(WILDM.wingR, mul(Mb, model(0, 0, 0, 0, 0, flap))); drawLit(WILDM.wingL, mul(Mb, model(0, 0, 0, 0, 0, -flap))); }
      }
    }
    // porpoises and whales surfacing
    for (let e = WILD.ev.length - 1; e >= 0; e--){
      const ev = WILD.ev[e], sp = SPEC[ev.type], age = t - ev.t0;
      if (age > sp.K * sp.I + (ev.type === 'humpback' ? 8 : 3)){ WILD.ev.splice(e, 1); continue; }
      const dx = Math.sin(ev.hd), dz = -Math.cos(ev.hd), px = -dz, pz = dx;
      for (let j = 0; j < ev.n; j++){
        const off = (j - (ev.n - 1) / 2) * sp.sp, lag = j * 0.7;
        for (let k = 0; k < sp.K; k++){
          const lt = age - k * sp.I - lag, T = sp.T; if (lt < 0 || lt > T + (ev.type === 'humpback' && k === sp.K - 1 ? 4 : 0)) continue;
          const along = sp.v * (age - lag), x = ev.x + dx * along + px * off, z = ev.z + dz * along + pz * off;
          if (Math.hypot(x - eye[0], z - eye[2]) > 2500) continue;
          const key = j * 10 + k;
          if (ev.type === 'humpback' && !ev.blown[key] && lt > 0.1){ ev.blown[key] = 1; blow(x + dx * 4.5, 0.6, z + dz * 4.5); }
          if (ev.type === 'orca' && !ev.blown[key] && lt > 0.3){ ev.blown[key] = 1; blow(x + dx * 2.5, 0.3, z + dz * 2.5); }
          const u = Math.min(1, lt / T), y = -sp.r * 1.25 + Math.sin(Math.PI * u) * (sp.r * 1.3 + 0.12), pitch = Math.cos(Math.PI * u) * 0.35;
          if (u < 1) drawLit(WILDM[ev.type], model(x - eye[0], y - eye[1], z - eye[2], -ev.hd, pitch, 0));
          if (ev.type === 'humpback' && k === sp.K - 1 && lt > T * 0.55){
            const f = Math.min(1, (lt - T * 0.55) / 1.5) * (lt > T + 2.5 ? Math.max(0, 1 - (lt - T - 2.5) / 1.5) : 1);
            drawLit(WILDM.fluke, model(x - dx * 5.5 - eye[0], -2.6 + f * 3.6 - eye[1], z - dz * 5.5 - eye[2], -ev.hd, -1.35 * f, 0));
          }
        }
      }
    }
  }
  function drawBlows(VP, eye, dt){
    let n = 0;
    for (let i = 0; i < 160; i++){
      if (BLOW.age[i] >= BLOW.life[i]) continue;
      BLOW.age[i] += dt; BLOW.vy[i] -= 2.2 * dt; BLOW.x[i] += BLOW.vx[i] * dt; BLOW.y[i] += BLOW.vy[i] * dt; BLOW.z[i] += BLOW.vz[i] * dt;
      PB[n * 3] = BLOW.x[i] - eye[0]; PB[n * 3 + 1] = BLOW.y[i] - eye[1]; PB[n * 3 + 2] = BLOW.z[i] - eye[2]; PA[n] = Math.max(0, 1 - BLOW.age[i] / BLOW.life[i]) * 0.55; n++;
    }
    if (n){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); const c = Math.min(1, env.amb[0] * 1.3 + env.sunCol[0] * 0.8); drawPts(n, gl.POINTS, VP, [c, c, Math.min(1, c * 1.03)], 1600, true); gl.depthMask(true); gl.disable(gl.BLEND); }
  }

  // ---------- other vessels ----------
  function shipHull(m, L, B, D, F, hull, bottom, deck){
    const NS = 14, hw = s => (B / 2) * (s < 0.62 ? 0.94 + 0.06 * s / 0.62 : Math.sqrt(Math.max(0, 1 - ((s - 0.62) / 0.38) ** 2))), zs = s => L / 2 - s * L, fs = s => F + 0.25 * F * s * s;
    const prof = s => { const w = hw(s), f = fs(s), z = zs(s); return [[-w, f, z], [-w * 0.98, 0, z], [-w * 0.8, -D * 0.85, z], [0, -D, z], [w * 0.8, -D * 0.85, z], [w * 0.98, 0, z], [w, f, z]]; };
    const cols = [hull, bottom, bottom, bottom, bottom, hull];
    for (let i = 0; i < NS; i++){ const A = prof(i / NS), B2 = prof((i + 1) / NS); for (let j = 0; j < 6; j++) m.quad(A[j], A[j + 1], B2[j + 1], B2[j], cols[j]); m.quad([-hw(i / NS), fs(i / NS), zs(i / NS)], [hw(i / NS), fs(i / NS), zs(i / NS)], [hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], [-hw((i + 1) / NS), fs((i + 1) / NS), zs((i + 1) / NS)], deck); }
    const T = prof(0), c = [0, (F - D) / 2, L / 2]; for (let j = 0; j < 6; j++) m.tri(c, T[j], T[j + 1], hull); m.tri(c, T[6], T[0], hull);
  }
  function windows(m, x0, x1, y, z, h, col, sideX){ for (const sx of [-1, 1]) m.box(sideX * sx, y, (x0 + x1) / 2, 0.08, h, Math.abs(x1 - x0), col, 0); }
  function buildNPC(){
    const N = {}, WHT = [0.92, 0.93, 0.92], DK = [0.1, 0.12, 0.15], RB = [0.5, 0.12, 0.1];
    let m = MB(); shipHull(m, 10.5, 3.8, 1.1, 1.2, [0.88, 0.9, 0.92], RB, [0.62, 0.6, 0.55]);
    m.box(0, 1.2, 1.4, 2.4, 2.0, 2.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 2.35, 0.02, 2.46, 0.6, 0.06, DK, 0); windows(m, 0.2, 2.6, 2.35, 0, 0.6, DK, 1.23);
    m.box(0, 3.2, 0.3, 0.12, 3.2, 0.12, [0.3, 0.3, 0.3], 0); m.box(0, 1.2, -3.2, 1.6, 0.35, 1.2, [0.35, 0.37, 0.4], 0); N.sjark = m.mesh();
    m = MB(); shipHull(m, 52, 13, 2.8, 3.2, [0.12, 0.25, 0.45], RB, [0.4, 0.4, 0.42]);
    m.box(4.8, 3.2, 2, 3.2, 5.5, 34, WHT, 0); windows(m, -12, 16, 6.2, 2, 1.1, DK, 3.25 + 1.6);
    m.box(4.8, 8.7, -6, 5, 3, 6, WHT, 0, [0.3, 0.3, 0.3]); m.box(4.8, 10.2, -9.05, 5.1, 1.1, 0.1, DK, 0);
    m.box(-5.5, 3.2, 0, 1.2, 1.1, 44, [0.85, 0.85, 0.8], 0); m.box(0, 3.3, 0, 8, 0.1, 44, [0.35, 0.35, 0.36], 0); N.ferry = m.mesh();
    m = MB(); shipHull(m, 112, 19, 5.5, 6.5, [0.07, 0.07, 0.08], RB, [0.5, 0.5, 0.5]);
    m.box(0, 6.5, 6, 17.6, 14, 70, WHT, 0, [0.7, 0.72, 0.73]);
    for (let r = 0; r < 4; r++) windows(m, -26, 38, 8 + r * 3.2, 6, 1.1, DK, 8.85);
    m.box(0, 20.5, -24, 14, 3.5, 10, WHT, 0); m.box(0, 22.2, -29.1, 14.2, 1.3, 0.2, DK, 0);
    m.box(0, 20.5, 20, 3.2, 7, 5, [0.1, 0.1, 0.1], 0, [0.1, 0.1, 0.1]); m.box(0, 26.2, 20, 3.3, 1.2, 5.1, [0.7, 0.12, 0.1], 0);
    m.box(0, 20.5, -12, 0.3, 9, 0.3, [0.85, 0.85, 0.85], 0); N.coastal = m.mesh();
    m = MB(); shipHull(m, 16, 5.8, 2.4, 2.0, [0.72, 0.16, 0.12], [0.3, 0.3, 0.32], [0.55, 0.55, 0.52]);
    m.box(0, 2.0, -2.2, 3.6, 2.6, 3.8, WHT, 0, [0.3, 0.32, 0.35]); m.box(0, 3.9, -4.12, 3.66, 0.7, 0.06, DK, 0); windows(m, -4.0, -0.4, 3.9, -2.2, 0.7, DK, 1.83);
    m.box(0, 4.6, -1.2, 0.18, 5.5, 0.18, [0.85, 0.85, 0.85], 0); m.box(0, 2.0, 4.2, 1.2, 2.2, 1.2, [0.85, 0.7, 0.15], 0); m.box(0, 4.1, 5.2, 0.25, 0.25, 2.8, [0.85, 0.7, 0.15], 0.3);
    N.kyst = m.mesh();
    N.lights = {kyst:[[0, 10.2, -1.2, 'w'], [-1.9, 5.3, -2.2, 'r'], [1.9, 5.3, -2.2, 'g'], [0, 2.8, 7.8, 'w']], sjark:[[0, 6.4, 0.3, 'w'], [-1.25, 3.4, 0.2, 'r'], [1.25, 3.4, 0.2, 'g'], [0, 1.6, 5.3, 'w']],
      ferry:[[4.8, 13.5, -6, 'w'], [2, 11, -8, 'r'], [7.6, 11, -8, 'g'], [0, 4, 26, 'w']],
      coastal:[[0, 30, -12, 'w'], [-7.2, 23.5, -26, 'r'], [7.2, 23.5, -26, 'g'], [0, 13, 55, 'w']]};
    N.lightPx = {sjark:260};   // the small boats' lights are smaller
    NPCM = N;
  }
  const NLC = {w:[1, 0.95, 0.85], r:[1, 0.12, 0.1], g:[0.1, 1, 0.35]};
  // the player's vessels other than the skiff: meshes from the vessel kit (vessel3d.js), built the first time each type is shown
  const PVM = {}; let PERS = null;
  // a vessel's buffers by type; your own painted boat (liv, vessel3d.js hullLiv) has buffers of its own, whose colours are uploaded
  // again when the paint changes (the shape is the same), so trying colours in the paint shop builds nothing new
  function pvm(t, liv){
    const key = liv ? t + '|own' : t; let E = PVM[key];
    // a design that cuts the hull (vessel3d.js livGeo) is a new shape: the own buffers are built again
    if (E && liv && E.geoK !== livGeo(liv)){ for (const b of [E.hull.pb, E.hull.nb, E.hull.cb]) gl.deleteBuffer(b); E = PVM[key] = null; }
    if (!E){ const m = liv ? buildVesselModel(t, 1, liv) : vesselModel(t); if (!m) return null;
      const up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3});
      let cap = null; if (m.cap){ const c = MB(); for (const tr of m.cap) c.tri(tr[0], tr[1], tr[2], [0, 0, 0]); cap = c.mesh(); }
      E = PVM[key] = {hull:up(m.o), glass:up(m.glass), cap, livK:livKey(liv), geoK:livGeo(liv)}; }
    if (liv){ const k = livKey(liv); if (E.livK !== k){ E.livK = k; const m = buildVesselModel(t, 1, liv);
      if (m && m.o.c.length === E.hull.n * 4){ gl.bindBuffer(gl.ARRAY_BUFFER, E.hull.cb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.o.c), gl.STATIC_DRAW); } } }
    return E;
  }
  // the people on the boats seen from outside: the own boat's skipper and crew by their looks, each local boat's by a look from her id (a dozen
  // in all), made once and kept (kind: 'skip' at the wheel, 'skipDeck' on deck, 'crew')
  const PV = {};
  function personMesh(kind, look, key){
    if (PV[key]) return PV[key];
    const ks = Object.keys(PV); if (ks.length > 160){ for (const q of ks){ const m = PV[q]; gl.deleteBuffer(m.pb); gl.deleteBuffer(m.nb); gl.deleteBuffer(m.cb); delete PV[q]; } }
    const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, kind === 'skip' ? [[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]] : null, null, look);
    return PV[key] = {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3};
  }
  const ownPerson = (kind, i) => { const l = kind === 'crew' ? lookCrew(i) : lookMe(); if (!l) return null; const key = 'o|' + kind + '|' + lookKey(l); return PV[key] || personMesh(kind, l, key); };
  // a boat of another player: her skipper's and crew's looks as she sent them (lk, ck); the local boats' from a look made from the id
  const npcPerson = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, key = 'p|' + kind + '|' + code, look = !PV[key] && lookFromKey(code); if (PV[key]) return PV[key]; if (look) return personMesh(kind, look, key); }
    const h = lookHash(String(n.id)) % 12, key = 'n|' + kind + '|' + h; return PV[key] || personMesh(kind, lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea'), key);
  };
  function people(){
    if (PERS) return PERS; const mk = (hands, suit, kit) => { const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, hands, suit, kit); return {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3}; };
    return PERS = {skip:mk([[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]], [0.93, 0.4, 0.1, 0.3], 'skipper'), skipDeck:mk(null, [0.93, 0.4, 0.1, 0.3], 'skipper'), crew:mk(null, [0.95, 0.75, 0.15, 0.3], 'crew')};
  }
  // ---------- the trawl (tools/boats/tral60.py; Jonas 06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved
  // tråling. Lag også animasjoner for utsett, og opptak av trål»): the doors hang in the gallows either side of the stern ramp and the
  // net lies on its drum. Shooting pays the net out down the ramp, codend first, lowers the doors into the sea and runs them out astern
  // on the warps; towing leaves the warps running from the blocks down into the sea; hauling brings the doors up into the gallows and
  // the net in, the codend full of fish last, up the ramp. The game does not trawl yet (that comes with the ocean step); until then
  // G3._debug.trawl('shoot' | 'tow' | 'haul') plays it, for the tests. Times in real seconds. ----------
  const TRAWL = {mode:null, t0:0, hold:null}, TRM = {}, SHOOT_S = 46, HAUL_S = 50;
  function trawlKit(t){
    if (t in TRM) return TRM[t];
    const door = upA(glbPart(t, 'door')); if (!door) return TRM[t] = null;
    const w = NB(); w.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.17, 0.18, 0.6], 6);
    const n = NB(); n.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.30, 0.20, 0.1], 8);
    return TRM[t] = {door, roll:upA(glbPart(t, 'netroll')), cod:upA(glbPart(t, 'codend')), warp:w.mesh(), net:n.mesh()};
  }
  // a frame at A whose z runs along the unit d, its y as near up as it goes
  function alongM(A, d){
    const up = Math.abs(d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0]; let x = [up[1] * d[2] - up[2] * d[1], up[2] * d[0] - up[0] * d[2], up[0] * d[1] - up[1] * d[0]];
    const l = Math.hypot(x[0], x[1], x[2]) || 1; x = x.map(v => v / l); const y = [d[1] * x[2] - d[2] * x[1], d[2] * x[0] - d[0] * x[2], d[0] * x[1] - d[1] * x[0]];
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, d[0], d[1], d[2], 0, A[0], A[1], A[2], 1]);
  }
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  // where things stand at a moment: the doors lowered (lo) and run out (ro), the net paid out (net), the codend along its way (cod)
  function trawlState(now){
    const u = TRAWL.hold != null ? TRAWL.hold : now - TRAWL.t0;
    if (TRAWL.mode === 'shoot' && u > SHOOT_S){ TRAWL.mode = 'tow'; TRAWL.t0 = now; }
    if (TRAWL.mode === 'haul' && u > HAUL_S + 4) TRAWL.mode = null;
    if (TRAWL.mode === 'shoot') return {lo:sstep(12, 22, u), ro:sstep(22, SHOOT_S, u), net:sstep(0, 16, u), cod:sstep(0, 16, u), full:false};
    if (TRAWL.mode === 'tow') return {lo:1, ro:1, net:1, cod:1, full:false, tow:true};
    if (TRAWL.mode === 'haul') return {lo:1 - sstep(20, 30, u), ro:1 - sstep(0, 22, u), net:1 - sstep(30, HAUL_S, u), cod:u > HAUL_S + 2 ? -1 : 1 - 0.85 * sstep(28, HAUL_S, u), full:true};
    return {lo:0, ro:0, net:0, cod:-1, full:false};
  }
  function drawTrawl(t, A, BMrel, now){
    const K = trawlKit(t); if (!K) return;
    const st = trawlState(now), at = (p, M) => drawN(p, chain(BMrel, M));
    // the net's way: off the drum, down the ramp, into the sea astern and away down; the codend's place on it by stages
    const W = [[A.drum[0], A.drum[1] - 0.9, A.drum[2] + 1.0], [A.rampTop[0], A.rampTop[1] + 0.3, A.rampTop[2]], [A.rampFoot[0], A.rampFoot[1] + 0.2, A.rampFoot[2]],
      [A.rampFoot[0], -1.5, A.rampFoot[2] + 9], [A.rampFoot[0], -12, A.rampFoot[2] + 60]], WT = [0, 0.15, 0.5, 0.7, 1];
    const way = p => { let i = 1; while (i < WT.length - 1 && WT[i] < p) i++; const k = clamp((p - WT[i - 1]) / (WT[i] - WT[i - 1]), 0, 1); return {p:lerp3(W[i - 1], W[i], k), i}; };
    if (K.roll) at(K.roll, chain(M4.T(A.drum[0], A.drum[1], A.drum[2]), new Float32Array([1, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1 - 0.62 * st.net, 0, 0, 0, 0, 1])));
    if (st.cod >= 0 && K.cod){
      const c = way(st.cod), c2 = way(Math.min(1, st.cod + 0.01)).p, d = [c2[0] - c.p[0], c2[1] - c.p[1], c2[2] - c.p[2]], dl = Math.hypot(d[0], d[1], d[2]);
      const dir = dl > 1e-4 ? d.map(v => v / dl) : [0, 0, 1], sw = st.full ? 1 : 0.55;
      at(K.cod, chain(alongM(c.p, dir), new Float32Array([sw, 0, 0, 0, 0, sw, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])));
      // the net from the drum to the codend
      let prev = W[0]; for (let i = 1; i < c.i; i++){ at(K.net, limbM(prev, W[i], 0.32)); prev = W[i]; } at(K.net, limbM(prev, c.p, 0.32));
    }
    for (const sg of [-1, 1]){
      const S0 = [sg * Math.abs(A.door[0]), A.door[1], A.door[2]], Wn = [sg * Math.abs(A.winch[0]), A.winch[1] + 0.7, A.winch[2]];
      at(K.warp, limbM(Wn, [S0[0], S0[1] + 0.55, S0[2] + 0.2], 0.025));            // from the winch to the block
      const D0 = [S0[0], S0[1] - 0.7, S0[2]];
      const D = [D0[0] + sg * (0.9 * st.lo + 7 * st.ro), D0[1] - (D0[1] + 0.4) * st.lo - 16 * st.ro, D0[2] + 3 * st.lo + 58 * st.ro];
      if (st.tow){ D[0] += Math.sin(now * 0.4 + sg) * 0.8; D[1] = -22; D[2] = D0[2] + 70; }
      at(K.warp, limbM([S0[0], S0[1] - 0.5, S0[2]], D, 0.025));
      if (!st.tow && st.ro < 0.35) at(K.door, chain(M4.T(D[0], D[1], D[2]), M4.RY((sg > 0 ? Math.PI : 0) - Math.PI / 2 * st.lo)));
    }
  }
  // ---------- the purse seine (tools/boats/not75.py; Jonas 06.10.2026: «Denne kan både bruke ringnot og trål og trenger dermed
  // animasjoner for begge deler»): shooting pays the seine out over the stern roller from the bin, its corks a ring on the sea round the
  // school from the stern to the starboard side; pursing hauls the purse line in through the davit's blocks; hauling brings the net in
  // through the power block and down into the bin, the ring closing in to the starboard side; then the bunt alongside, the fish
  // boiling in it and the pump's hose in. Not used by the game yet (the ocean step); G3._debug.seine(mode) plays it. Real seconds. ----------
  const SEINE = {mode:null, t0:0, hold:null}, SEINE_S = {shoot:40, purse:25, haul:45, pump:20}, SEINE_NEXT = {shoot:'purse', purse:'haul', haul:'pump', pump:null};
  function seineState(now){
    if (!SEINE.mode) return null;
    let u = SEINE.hold != null ? SEINE.hold : now - SEINE.t0;
    while (SEINE.mode && SEINE.hold == null && u > SEINE_S[SEINE.mode]){ SEINE.t0 += SEINE_S[SEINE.mode]; u -= SEINE_S[SEINE.mode]; SEINE.mode = SEINE_NEXT[SEINE.mode]; }
    return SEINE.mode ? {mode:SEINE.mode, k:clamp(u / SEINE_S[SEINE.mode], 0, 1), u} : null;
  }
  function drawSeine(t, A, BMrel, VP, now){
    const st = seineState(now); if (!st) return;
    const K = trawlKit(t); if (!K) return;
    const at = (p, M) => drawN(p, chain(BMrel, M)), R0 = 62, Rb = 9;
    // the ring in the boat's level frame (x to starboard, z aft): through the stern and the starboard side amidships, the long way round
    const S = [A.stern[0], 0, A.stern[2]], P = [A.side[0] + 1.5, 0, A.side[2]], M = [(S[0] + P[0]) / 2, 0, (S[2] + P[2]) / 2], dx = P[0] - S[0], dz = P[2] - S[2], d = Math.hypot(dx, dz);
    let nx = dz / d, nz = -dx / d; if (nx < 0){ nx = -nx; nz = -nz; }
    const h = Math.sqrt(Math.max(1, R0 * R0 - d * d / 4)), C0 = [M[0] + nx * h, 0, M[2] + nz * h];
    // the ring now: shooting it grows from the stern; hauling it shrinks to the bunt, always through the side point
    let R = R0, Cn = C0, f = 1, from = S;
    if (st.mode === 'shoot') f = sstep(0, 1, st.k);
    if (st.mode === 'haul' || st.mode === 'pump'){
      const k = st.mode === 'pump' ? 1 : sstep(0, 1, st.k), dl = Math.hypot(C0[0] - P[0], C0[2] - P[2]); R = R0 + (Rb - R0) * k;
      Cn = [P[0] + (C0[0] - P[0]) / dl * R, 0, P[2] + (C0[2] - P[2]) / dl * R]; from = P;
    }
    const aS = Math.atan2(from[2] - Cn[2], from[0] - Cn[0]), aP = Math.atan2(P[2] - Cn[2], P[0] - Cn[0]);
    let sweep = st.mode === 'shoot' || st.mode === 'purse' ? ((aP - aS) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) : 2 * Math.PI - 0.12;
    if (st.mode === 'shoot' || st.mode === 'purse'){ const mid = aS + sweep / 2, mx = Cn[0] + Math.cos(mid) * R, mz = Cn[2] + Math.sin(mid) * R; if (Math.hypot(mx - M[0], mz - M[2]) < R) sweep -= 2 * Math.PI; }
    // the net over the stern roller, the purse line, the net in through the power block, the pump hose
    if (st.mode === 'shoot'){ at(K.net, limbM(A.bin, A.stern, 0.3)); at(K.net, limbM(A.stern, [S[0], -0.5, S[2] + 1.5], 0.3)); }
    if (st.mode === 'purse') at(K.warp, limbM(A.purse, [A.purse[0] + 4, -10, A.purse[2]], 0.035));
    if (st.mode === 'haul'){ at(K.net, limbM([P[0] + 0.5, -0.3, P[2]], A.block, 0.35)); at(K.net, limbM(A.block, A.bin, 0.35)); }
    if (st.mode === 'pump') at(K.warp, limbM(A.block, [Cn[0], -0.8, Cn[2]], 0.18));
    // the corks (and the fish in the bunt) as points on the sea, in the boat's level frame
    const ex = [BMrel[0], BMrel[2]], el = Math.hypot(ex[0], ex[1]) || 1, ux = ex[0] / el, uz = ex[1] / el, T0 = [BMrel[12], BMrel[13], BMrel[14]];
    const W = (x, y, z) => [T0[0] + ux * x - uz * z, T0[1] + y, T0[2] + uz * x + ux * z];
    let n = 0; const L = Math.abs(sweep) * R * f, N = Math.min(600, Math.max(2, Math.round(L / 2.4)));
    for (let i = 0; i <= N; i++){ const a = aS + sweep * f * i / N, q = W(Cn[0] + Math.cos(a) * R, 0.12, Cn[2] + Math.sin(a) * R); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 1; n++; }
    drawPts(n, gl.POINTS, VP, [0.96, 0.46, 0.10], 520, true);
    if (st.mode === 'pump' || (st.mode === 'haul' && st.k > 0.75)){
      n = 0; for (let i = 0; i < 160; i++){ const a = hash(i) * 6.283, r = Math.sqrt(hash(i + 999)) * (R - 1.2), b = Math.abs(Math.sin(now * (3 + hash(i + 7) * 4) + i));
        const q = W(Cn[0] + Math.cos(a) * r, 0.05 + 0.35 * b, Cn[2] + Math.sin(a) * r); PB[n * 3] = q[0]; PB[n * 3 + 1] = q[1]; PB[n * 3 + 2] = q[2]; PA[n] = 0.5 + 0.5 * b; n++; }
      drawPts(n, gl.POINTS, VP, [0.82, 0.86, 0.9], 300, true);
    }
    nSetup(VP);
  }
  // onDeck: the skipper jigs himself, so he stands at the first deck place the crew leave free (at the wheel when there is none)
  // the people aboard where the agents have them (deckcrew.js): walking, at their work, or at the wheel inside the house; in the bridge
  // view nobody is drawn at the wheel, where the eye is (the skipper, or a hand who has the helm)
  function drawDeckCrew(BMrel, eye, VP, t, G){
    nSetup(VP); let idx = 20; if (!GB) buildGear();
    const b = S.boat, d = G.deck || {y:G.gw, z:0}, gw = G.gw || d.y + 0.9, railH = clamp(gw - d.y, 0.6, 1.1), now = performance.now() / 1000, DW = deckWork(G), ST = CREW3D._st, V = VESSELS[vtype()] || {}, K = G.kit || {};
    dkTick(); DKGULL = null;
    const rel = q => xf(BMrel, q), A = CREW3D.visible();
    // jigging by hand without machines: the real catch (CATCHQ) comes up on the lines of those at the rail, one fish at a time each
    const machines = S.equip && S.equip.jukse > 0 && !(S.target === 'kveite' && b.kgear) && SK && SK.machG;
    if (b.status === 'fishing' && !b.gop && !b.deckStop && !machines && !window.jigActive){ const Q = catchQ();
      for (const a of A){ if (!Q.length) break; if (a.st !== 'fiske' || a.mode !== 'at' || now - (DKF.jig[a.id] || 0) < 2.4 || DKEV.some(e => (e.who === a.id || e.for === a.id) && now - e.t0 < DKDUR[e.kind] + 0.3)) continue;
        const f = Q.shift(), F0 = [Math.sin(a.h), -Math.cos(a.h)], rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; DKF.jig[a.id] = now;
        dkEvent('jigup', rl, f.sp, f.kg, {for:a.id, wait:8, Wat:[rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]}); } }
    // the fish lying on the deck where they were shaken off the hook or let fall from the net, until the bleeder takes them up
    if (SK && SK.fishM) for (const f of DKDECK) drawN(fishOf(f.sp), chain(BMrel, M4.T(f.at[0], f.at[1] + 0.05, f.at[2]), M4.RY(f.yaw), M4.RZ(Math.PI / 2), M4.S(clamp(0.42 * Math.cbrt(f.kg || 2), 0.28, 1.2))));
    // where the gutted fish go: the packer's crate on his right (a hold boat), else the open boat's tub nearest him (kit.tubs)
    const pk = A.find(a => a.st === 'is' && a.mode === 'at'), tubs = V.hold && V.hold.kind === 'dekk' ? K.tubs : null;
    const crateOf = a => { const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)];
      if (tubs && tubs.length){ let best = tubs[0], bd = 1e9; for (const q of tubs){ const dd = Math.hypot(q[0] - a.x, q[2] - a.z); if (dd < bd){ bd = dd; best = q; } } return {p:[best[0], best[1], best[2]], top:(best[4] || 460) > 300 ? 0.62 : 0.55, tub:true}; }
      return {p:[a.x + F0[0] * 0.58, a.y, a.z + F0[1] * 0.58], top:0.28, tub:false}; };
    const pkC = pk ? crateOf(pk) : null, held = spHold(x => !x.gut && !x.iced), packed = spHold(x => x.iced), table = rel(DW.table), tubTop = rel(dkTub(G)), offal = rel(DW.offal);
    for (const a of A){ if (cam.helm && (a.me || a.mode === 'helm')) continue;
      // (a place stood off its cell: leaning back, the back at the rail, deckcrew.js idlePlace)
      const go = CREW3D.walkOff(a);
      const lp = a.mode === 'helm' && G.skipperAt ? [G.skipperAt[0], G.skipperAt[1], G.skipperAt[2]] : [a.x + go[0], a.y, a.z + go[1]], wl = xf(BMrel, lp), wy = wl[1] + eye[1];
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look:a.me ? lookMe() : a.c ? lookOf(a.c) : lookCrew(0)};
      const ev = a.mode === 'at' ? dkFor(a.id, lp, a.task) : null;   // a fish to bleed or to gaff in at his place
      // a helm made for sitting (the model's eye low over the place, as under the snekke's hard top) is steered from the seat
      const sat = a.mode === 'helm' && G.eye && G.skipperAt && G.eye[1] - G.skipperAt[1] < 1.4;
      const st = {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + (a.mode === 'helm' ? 0 : a.h + (a.sqA || 0) * Math.PI / 2), task:ev ? ev.kind : sat ? 'helmsit' : a.task, seat:sat ? Math.max(0.2, G.eye[1] - G.skipperAt[1] - 0.95) : 0, ev:ev ? dkEv(ev, BMrel, G) : null, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0};
      const F0 = [Math.sin(a.h), -Math.cos(a.h)], R0 = [Math.cos(a.h), Math.sin(a.h)], sg = a.x >= 0 ? 1 : -1;
      const g0 = CREW3D.holds(a), ef = a.ef == null ? 1 : a.ef, ta = a.tk != null ? a.tk : t;   // (the place still held; each one's own beat, deckcrew.js a.tk)
      st.age = a.c ? a.c.age : 45; st.deck = true; st.rail = a.mode === 'at' && g0 ? g0.rail || null : null; if (a.task === 'smoke' && b.status === 'sailing') st.lean = false;
      st.slump = clamp((0.96 - ef) * 1.6, 0, 0.35); st.tape = !!(a.c && a.c.cut && S.t < a.c.cut); if (a.put) st.put = {task:a.put.task, u:clamp(a.putU || 0, 0, 1)};
      // a moment (G3.crewFx, 14-crewlife.js crewSlip): a fish slips over the side, the knife slips and a hand is cut
      const fx = CFX.get(a.id);
      if (fx){ const age = now - fx.t0, dur = fx.kind === 'slip' ? 2.6 : 2.4;
        if (age > dur || a.mode !== 'at' || ev) CFX.delete(a.id);
        else { st.task = fx.kind; st.fx = true; if (fx.kind === 'cut') st.cutU = age / dur;
          else { st.slipU = age / dur; st.slip = fx; const r = fx.rail;
            if (r){ st.Rl = rel([a.x + r.F[0] * r.d, a.y + r.y, a.z + r.F[1] * r.d]); st.Wt = rel([a.x + r.F[0] * (r.d + 0.9), -0.1, a.z + r.F[1] * (r.d + 0.9)]);
              let dh = Math.atan2(r.F[0], -r.F[1]) - a.h; while (dh > Math.PI) dh -= 2 * Math.PI; while (dh < -Math.PI) dh += 2 * Math.PI;
              st.h += dh * ease(Math.min(1, age / 0.3)) * (1 - ease(Math.max(0, (age / dur - 0.8) / 0.2))); } } } }
      if (a.mode === 'at' && !ev && !st.fx){
        // gutting at the table: the fish from the bleeding tub, the guts over the rail, the gutted fish to the packer
        if (a.task === 'gut'){ st.task = 'gutw'; st.Tb = table; st.Ub = tubTop; st.Of = offal; const n = Math.floor((ta + idx * 1.7) / 5.6); st.gsp = held(hash(n * 3 + idx)); st.gkg = 2 + hash(n * 5) * 3;
          if (pkC){ st.Cr = rel(pkC.p); st.crTop = pkC.top; st.packId = pk.id; } }
        else if (a.task === 'pack'){ const C = crateOf(a); st.Cr = rel(C.p); st.crTop = C.top; st.crTub = C.tub; st.fill = ST.crateFill || 0; st.csp = i => packed(hash(i * 7 + 1)); const L = DKLAY[a.id]; st.lay = L ? now - L.t : -1;
          // the ice bin on the side away from the gutter
          const gt = A.find(q => q.st === 'sloy' && q !== a); st.binR = gt && (gt.x - a.x) * R0[0] + (gt.z - a.z) * R0[1] < 0 ? 0.55 : -0.55; }
        else if (a.task === 'egn' || a.task === 'strip'){ const PLs = CREW3D.places() || {tubs:[]}, T0 = PLs.tubs[(a.goal && a.goal.tub || 0) % 8]; if (T0) st.Tu = rel([T0[0], (PLs.tubY != null ? PLs.tubY : a.y) + 0.38, T0[1]]); st.Bk = rel([a.x + R0[0] * 0.38 - F0[0] * 0.12, a.y, a.z + R0[1] * 0.38 - F0[1] * 0.12]);
          st.Of = rel([sg * ((G.beam || 3) / 2 + 1.4), -0.1, a.z]); if (a.task === 'strip' && ((t + idx * 3.1) % 25) < 2.2) DKGULL = [st.Of[0] + eye[0], (env.tide || 0), st.Of[2] + eye[2]]; }
        else if (a.task === 'mend') st.Nt = rel([a.x + F0[0] * 0.42, a.y + railH - 0.02, a.z + F0[1] * 0.42]);
        else if (a.task === 'jig' && !machines){ const rl = [a.x + F0[0] * 0.45, a.y + railH + 0.06, a.z + F0[1] * 0.45]; st.Rl = rel(rl); st.Wt = rel([rl[0] + F0[0] * 0.5, -0.8, rl[2] + F0[1] * 0.5]); } }
      if (a.sub && a.sub.carry === 'crate'){ st.crate = true; st.csp = i => packed(hash(i * 7 + 1)); if (a.mode === 'at') st.s = ST.clk - (a.sub.done - (a.sub.hold || 2)); }
      drawWorker(P, st, eye, ta, idx++); }
    dkBloodDraw(VP);
    if (HELM_KIT[vtype()] && G.skipperAt && cam.dist < 80) drawHelmKit(BMrel, eye, G);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the species of the fish in the hold that pass a test, by weight: r in 0..1 to a species (the fish in hand are the real catch's)
  function spHold(f){ let all = 0; const cum = []; for (const x of S.hold || []){ if (!f(x) || (SPECIES[x.sp] || {}).live) continue; all += x.kg; cum.push([x.sp, all]); } return r => { if (!cum.length) return 'torsk'; const v = r * all; for (const c of cum) if (v <= c[1]) return c[0]; return cum[cum.length - 1][0]; }; }
  // the gutting table's work point (its top in the middle) and where the guts go: over the rail on the table's side into the water
  // (down the bench's chute), in the boat's frame; as drawDeck places them
  function deckWork(G){
    const vt = vtype(), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), tz = W ? W.table[2] : d.z;
    const own = !!(W && W.own), V = VESSELS[vt], big = !!(V && V.len >= 10), KB = own ? null : kit('fish', big ? 'benk' : 'bord'), XF = kitX('fish'), tSide = tx < 0 ? 1 : -1, kTop = XF[big ? 'benk_top' : 'bord_top'];
    const topY = own && W.top != null ? W.top + 0.02 : KB && kTop != null ? d.y + kTop + 0.02 : d.y + 0.885, kDrop = KB && XF[big ? 'benk_drop' : 'bord_drop'];
    const dropP = kDrop ? [tx + tSide * kDrop[2], d.y + Math.max(0.6, kDrop[1]), tz - tSide * kDrop[0]] : [tx - tSide * 0.15, d.y + 1.0, tz];
    return {table:[tx, topY, tz], drop:dropP, offal:[dropP[0] - tSide * 2.6, -0.1, dropP[2]], tSide};
  }
  // a simple wheel and a chair at the helm, in the boat's frame, for the models whose wheelhouse is bare inside (vessel3d.js HELM_KIT)
  function drawHelmKit(BMrel, eye, G){
    const h = bv.head, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], A = G.skipperAt, at = (a, up, r) => { const w = xf(BMrel, [A[0] + r, A[1] + up, A[2] - a]); return [w[0], w[1], w[2]]; };
    const c = at(0.42, 1.08, 0), ax = [F[0] * 0.9, 0.45, F[1] * 0.9], al = Math.hypot(ax[0], ax[1], ax[2]), a = ax.map(v => v / al);   // the wheel's axis, tilted back towards the one steering
    const u = R, v = [a[1] * u[2] - a[2] * u[1], a[2] * u[0] - a[0] * u[2], a[0] * u[1] - a[1] * u[0]], rim = [];
    for (let i = 0; i < 12; i++){ const th = i / 12 * Math.PI * 2; rim.push([c[0] + (u[0] * Math.cos(th) + v[0] * Math.sin(th)) * 0.2, c[1] + (u[1] * Math.cos(th) + v[1] * Math.sin(th)) * 0.2, c[2] + (u[2] * Math.cos(th) + v[2] * Math.sin(th)) * 0.2]); }
    for (let i = 0; i < 12; i++){ drawN(PM.wire, limbM(rim[i], rim[(i + 1) % 12], 0.016)); if (i % 2 === 0) drawN(PM.wire, limbM(c, rim[i], 0.011)); }
    drawN(PM.wire, limbM(c, at(0.62, 0.98, 0), 0.025));   // the column down to the console
    const sp = at(-0.42, 0.75, 0); drawN(PM.seat, chain(M4.T(sp[0], sp[1], sp[2]), M4.RY(-h))); drawN(PM.wire, limbM(at(-0.42, 0.02, 0), sp, 0.03));
  }
  function drawVessel(t, G, BMrel, VP, skipper, ncrew, onDeck, liv, named){
    const m = pvm(t, liv); if (!m) return; const P = people(); nSetup(VP); const wr = named && wearOn(t); drawN(m.hull, BMrel); if (wr) wearOff();
    const ds = onDeck && G.crewSpots && ncrew < G.crewSpots.length ? G.crewSpots[ncrew] : null;
    if (skipper && ds) drawN((named && ownPerson('skipDeck')) || P.skipDeck, chain(BMrel, M4.T(ds[0], ds[1], ds[2]), M4.RY(ds[3] || 0)));
    else if (skipper) drawN((named && ownPerson('skip')) || P.skip, chain(BMrel, M4.T(G.skipperAt[0], G.skipperAt[1], G.skipperAt[2])));
    for (let i = 0; i < ncrew && i < G.crewSpots.length; i++){ const c = G.crewSpots[i]; drawN((named && ownPerson('crew', i)) || P.crew, chain(BMrel, M4.T(c[0], c[1], c[2]), M4.RY(c[3] || 0))); }
    if (G.trawl) drawTrawl(t, G.trawl, BMrel, performance.now() / 1000);
    if (G.seine) drawSeine(t, G.seine, BMrel, VP, performance.now() / 1000);
    gl.disableVertexAttribArray(2);
    if (named && SK){ const q = !S.unnamed && nameQ(t); if (q){ paintName(t, liv); for (const s of q) drawTexQuad(s, SK.tName, BMrel, VP, true, [0, 0.2, 0]); } drawMark(t, BMrel, VP, liv); drawLogo(t, BMrel, VP, ...ownLogo()); }
    gl.useProgram(PL.p);
  }
  // the local fleet near you: the kit model nearest each boat (vessel3d.js npcKit), scaled to her length and beam, at lod 1 within
  // 300 m and lod 0.3 within 1.5 km (a detailed GLB model gives its near and simple versions), with the skipper in the wheelhouse and hands on deck when she fishes; further out the box models
  const NKM = {};
  // a detailed model from tools/boats is near only within 150 m: many of the local fleet share it, and a tablet draws them all
  // a fishing NPC's model by her length and beam (FLEET's, and the coast's from tools/map/npc.py): the buffers by model, lod and livery,
  // the scale by boat
  // another player's boat is her own type's model (Jonas 05.10.2026: a friend in the same old wooden boat showed as a white box boat)
  const npcType = n => n.player && SPEC3D[n.vtype] ? n.vtype : npcKit(n.L, n.B);
  const NKN = {}; function npcNear(n){ const k = n.player ? 'p|' + n.vtype : n.L + '|' + n.B; if (!(k in NKN)) NKN[k] = glbHas(npcType(n)) ? 150 : 300; return NKN[k]; }
  const NKB = {};
  function npcMesh(n, lod){
    const kk = n.id + '|' + lod + '|' + (n.player ? n.vtype + '|' + n.liv : ''); if (kk in NKM) return NKM[kk];   // a player's repaint is a new key
    const t = npcType(n), liv = n.liv || 0, k = t + '|' + lod + '|' + liv;
    if (!(k in NKB)){ const m = npcModel(t, lod, liv), up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}); NKB[k] = m ? {t, hull:up(m.o), glass:lod >= 1 ? up(m.glass) : null, geo:m.geo} : null; }
    const B = NKB[k]; if (!B) return NKM[kk] = null;
    const V = VESSELS[t], sx = n.B / V.beam, sz = n.L / V.len, sy = (sx + sz) / 2;
    return NKM[kk] = Object.assign({}, B, {sv:[sx, sy, sz], S:new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])});
  }
  let npcNow = [];
  function drawNPC(eye, t, H, VP){
    if (!NPCM) return;
    npcNow = npcStates(H).filter(n => !n.rs && Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000);   // the rescue boat has her own model (RB)
    const kit = [];
    for (const n of npcNow){
      // a boat on your tow line (core/09g-turer.js): placed astern of your boat as the view shows her, 30 m of line from your stern
      // to her bow, so she follows smoothly between the simulation's minutes
      if (n.tur && n.st === 'tow' && bv.init){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; }
      // towing between players (ui/10o-ptow.js): the player's boat in your tow astern of you, or the one towing you ahead, on the same 30 m of line
      n.ptow = null;
      if (n.player && bv.init && S.ptowH && S.ptowH.st === 'tow' && n.id === S.ptowH.pid){ const back = (GEO(vtype()).stern || 3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x - Math.sin(bv.head) * back) / 1000, y:(bv.z + Math.cos(bv.head) * back) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'tail'; }
      else if (n.player && bv.init && S.ptow && S.ptow.st === 'tow' && n.id === S.ptow.pid){ const fwd = -(GEO(vtype()).bow || -3) + 30 + (n.L || 8) / 2; n.p = {x:(bv.x + Math.sin(bv.head) * fwd) / 1000, y:(bv.z - Math.cos(bv.head) * fwd) / 1000}; n.hd = n.cog = bv.head; n.ptow = 'head'; }
      const x = n.p.x * 1000, z = n.p.y * 1000, big = n.type === 'coastal' || n.type === 'ferry', y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = big ? Math.sin(t * 0.4 + x) * 0.01 : Math.sin(t * 1.1 + x) * 0.05 * (0.3 + WV.hs);
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -n.hd, big ? 0 : Math.sin(t * 0.9 + z) * 0.03, roll);
      const d = Math.hypot(x - eye[0], z - eye[2]); n.K = (n.fleet || n.coast || n.player) && d / ZF() < 1500 * QUAL.lodK[QUAL.lvl] ? npcMesh(n, d / ZF() < npcNear(n) * QUAL.lodK[QUAL.lvl] ? 1 : 0.3) : null;
      if (n.K) kit.push(n); else drawLit(NPCM[n.type], n.M);
    }
    if (!kit.length) return;
    const P = people(); nSetup(VP);
    for (const n of kit){ const K = n.K, G = K.geo, at = (p, r) => chain(n.M, M4.T(p[0] * K.sv[0], p[1] * K.sv[1], p[2] * K.sv[2]), M4.RY(r || 0));
      drawN(K.hull, chain(n.M, K.S));
      if (!K.glass) continue;
      drawNPCAnchor(n, K);   // her anchors stowed in their roller or hawse, as on your own boat
      if (npcCrewDraw(n, K, eye, t)) continue;   // her people walk her deck like yours (deckcrew.js crewSim)
      if (n.st !== 'port') drawN(npcPerson('skip', n), at(G.skipperAt));
      if (n.st === 'fishing') for (let i = 0; i < 2 && i < G.crewSpots.length; i++) drawN(npcPerson('crew', {id:String(n.id) + i, player:n.player, lk:n.lk, ck:n.ck}, i), at(G.crewSpots[i], G.crewSpots[i][3]));
    }
    drawNPCNames(kit, VP);
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the agents of another boat within the near LOD (deckcrew.js crewSim, one per boat, dropped when she has been out of sight a
  // minute): the same walking people as on your own boat, in her model's frame scaled to her size; false when her model has no deck map
  const NCREW = new Map();
  function npcCrewDraw(n, K, eye, t){
    if (typeof crewSim !== 'function' || !K.geo || K.geo.hand) return false;
    const type = K.t; let E = NCREW.get(n.id);
    if (!E || E.type !== type){ const st = {n}; E = {type, st, t:0, sim:crewSim({type:() => type, ctx:G => npcCrewCtx(st.n, G), seed:1 + (lookHash(String(n.id)) % 1000)})}; NCREW.set(n.id, E); }
    E.st.n = n; const gap = t - E.t; E.t = t; const sim = E.sim; if (!sim.on()) return false;
    if (gap > 5) sim._st.lastSim = null;   // out of sight a while: everyone straight to their place
    sim.tick(Math.min(0.1, Math.max(0, gap)));
    const G = K.geo, sv = K.sv, h0 = n.hd; let idx = 40 + (lookHash(String(n.id)) % 50);
    for (const a of sim.visible()){
      const lp = a.mode === 'helm' && G.skipperAt ? G.skipperAt : [a.x, a.y, a.z], wl = xf(n.M, [lp[0] * sv[0], lp[1] * sv[1], lp[2] * sv[2]]), wy = wl[1] + eye[1];
      const look = npcLook(a.me ? 'skip' : 'crew', n, a.c ? (a.c.id.endsWith('1') ? 1 : 0) : 0);
      const P = {gy:() => wy, bare:true, spray:0, kit:a.me ? 'skipper' : null, look};
      drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:h0 + (a.mode === 'helm' ? 0 : a.h), task:a.task, walk:a.mode === 'walk', blend:a.mode === 'walk' ? 0 : a.blend, peek:true, s:0}, eye, t, idx++); }
    if (NCREW.size > 24) for (const [id, e] of NCREW) if (t - e.t > 60) NCREW.delete(id);
    return true;
  }
  // the look of a person on another boat: a player's as she sent it (lk, ck), a local boat's from its id (as npcPerson)
  const npcLook = (kind, n, i) => {
    if (n.lk){ const code = kind === 'crew' ? String(n.ck || '').split(';')[i || 0] : n.lk, l = code && lookFromKey(code); if (l) return l; }
    const h = lookHash(String(n.id)) % 12; return lookFromSeed('npc' + kind + h, kind === 'crew' && h % 5 === 0 ? 'f' : 'm', 24 + (h * 5) % 40, 'sea');
  };
  // ---------- the rescue boat (tools/boats/redning.py) and its tow line, where core/05-vessels.js towPose says ----------
  // the tow line to a boat in tow (core/09g-turer.js): from your stern to her bow, a little sag
  let TOWR = null;
  function drawTowLine(BMrel, VP){
    const n = npcNow.find(q => ((q.tur && q.st === 'tow') || q.ptow) && q.M); if (!n) return;
    if (!TOWR){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.95, 0.72, 0.12, 0.2], 6); TOWR = r.mesh(); }
    // the models' bow is at -z, the stern at +z: from your stern to her bow, or (towed by a player) from your bow to her stern
    const G = GEO(vtype()), head = n.ptow === 'head', A = head ? xf(BMrel, [0, (G.gw || 1) + 0.25, (G.bow || -3) + 0.4]) : xf(BMrel, [0, (G.gw || 1) + 0.25, (G.stern || 3) - 0.4]),
      B = head ? xf(n.M, [0, 1.1, (n.L || 8) / 2 - 0.3]) : xf(n.M, [0, 1.1, -(n.L || 8) / 2 + 0.3]);
    const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), sag = 0.012 * d + 0.4;
    nSetup(VP); let prev = A;
    for (let k = 1; k <= 12; k++){ const s = k / 12, P = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - sag * 4 * s * (1 - s), A[2] + (B[2] - A[2]) * s]; drawN(TOWR, limbM(prev, P, 0.03)); prev = P; }
  }
  // ---------- the boat's own anchor (tools/deck/anker.py, core/06e-anchor.js; Jonas 21.10.2026) ----------
  // Stowed in its bow roller or hawse pipe (geo.bower; the spare in the other hawse). Let go, it drops from the fairlead and the rode
  // runs out after it while she falls back; then it lies on the catenary from the fairlead to the bottom, the touchdown nearer the anchor
  // the harder she pulls, and she swings round it with the wind and the current (the core moves her). Weighing, the chain comes in over
  // the roller or into the hawse, she comes up over the anchor, it breaks out and rises dripping to its place. The length out comes from
  // the core's minute (b.anch.out0 to out), the fall on the view's own clock (3 m/s, the payout's pace at the game's rate). The chain
  // link by link from the windlass's gypsy to the fairlead and down to a little under the water, deeper a tube; on the small boats a
  // rope with a few metres of chain at the anchor. An anchor that is gone from the core without being hauled (a dock, a tow, a gale) is
  // reeled in quickly here.
  const ANC3 = {key:null, t0:0, fresh:false, Lg:0, wasUp:false, splash:false, mode:'stow', links:0, A:null, E:null, last:0};
  let ROPEA = null, CHTA = null;
  const aU = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, aX = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // a frame from its z axis and an up hint, scaled, at o (columns x, y, z, origin)
  function frameM(o, z, up, s){ z = aU(z); let x = aX(up, z); if (Math.hypot(x[0], x[1], x[2]) < 1e-4) x = aX([1, 0, 0], z); x = aU(x); const y = aX(z, x); return new Float32Array([x[0] * s, x[1] * s, x[2] * s, 0, y[0] * s, y[1] * s, y[2] * s, 0, z[0] * s, z[1] * s, z[2] * s, 0, o[0], o[1], o[2], 1]); }
  // one mesh drawn many times: the buffers bound once
  function drawMany(m, Ms){ if (!m || !Ms.length) return; attr(0, m.pb, 3); attr(1, m.nb, 3); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); for (const M of Ms){ gl.uniformMatrix4fv(PRGN.u.uM, false, M); gl.drawArrays(gl.TRIANGLES, 0, m.n); } }
  // the anchor's mesh and its scale (the grapnel is the gear kit's, its shank turned onto +z)
  function ancMesh(bw){
    if (bw.kind === 'dregg'){ if (!GB) buildGear(); return GB.dregg ? {m:GB.dregg, pre:M4.RX(-Math.PI / 2), s:1} : null; }
    const m = kit('anchor', bw.kind === 'hall' ? 'hall' : 'plog'); return m ? {m, pre:null, s:bw.kind === 'hall' ? Math.cbrt((bw.kg || 1000) / 1000) : Math.cbrt((bw.kg || 20) / 20)} : null;
  }
  // where it lies stowed, in the boat's frame: its eye, the shank's way to the crown and its upper side
  function ancStow(F, P, bw, L){
    if (bw.stow && bw.stow.eye){ const e = bw.stow.eye, c = bw.stow.crown; return {eye:e, dir:aU([c[0] - e[0], c[1] - e[1], c[2] - e[2]]), up:[0, 1, 0]}; }
    if (P){ const d = aU([F[0] - P[0], F[1] - P[1], F[2] - P[2]]), out = [Math.sign(F[0]) || 1, 0, 0], cr = [F[0] + out[0] * 0.03 * L, F[1], F[2]];
      // the shank up the hawse pipe, the crown at its mouth, the flukes turned up outside against the hull's side (they tilt off the
      // shank towards their -y, here outwards, as much as the pipe leans in)
      return {eye:[cr[0] - d[0] * 0.92 * L, cr[1] - d[1] * 0.92 * L, cr[2] - d[2] * 0.92 * L], dir:d, up:[-out[0], 0, 0]}; }
    const a = 12 * Math.PI / 180;   // in the roller: the shank along it, the eye aft, the fluke hanging over the stem
    return {eye:[F[0], F[1] + 0.03 * L, F[2] + 0.62 * L], dir:[0, -Math.sin(a), -Math.cos(a)], up:[0, Math.cos(a), -Math.sin(a)]};
  }
  // the rode from the bottom to the fairlead: A the anchor's eye, F the fairlead (both relative to the eye of the view), Lr the length
  // out: lying on the bottom from the anchor to the touchdown, then the catenary up to the fairlead; straight when it is taut
  function rodePts(A, F, Lr, n){
    const dx = F[0] - A[0], dz = F[2] - A[2], D = Math.hypot(dx, dz) || 1e-6, ux = dx / D, uz = dz / D, h = Math.max(0.1, F[1] - A[1]);
    const line = (P, Q, k) => Array.from({length:k + 1}, (_, i) => [P[0] + (Q[0] - P[0]) * i / k, P[1] + (Q[1] - P[1]) * i / k, P[2] + (Q[2] - P[2]) * i / k]);
    if (D >= Math.sqrt(Math.max(0, Lr * Lr - h * h)) - 0.05) return line(A, F, n);
    if (D <= Lr - h){ const T = [F[0], A[1], F[2]]; return line(A, T, 2).concat(line(T, F, n).slice(1)); }
    const X = a => { const s = Math.sqrt(h * h + 2 * h * a); return (Lr - s) + a * Math.asinh(s / a); };
    let lo = Math.log(1e-3), hi = Math.log(1e6); for (let i = 0; i < 36; i++){ const m = (lo + hi) / 2; if (X(Math.exp(m)) > D) hi = m; else lo = m; }
    const a = Math.exp((lo + hi) / 2), s = Math.sqrt(h * h + 2 * h * a), Lb = Math.max(0, Lr - s), xs = a * Math.asinh(s / a), T = [A[0] + ux * Lb, A[1], A[2] + uz * Lb], out = [A, T];
    for (let k = 1; k <= n; k++){ const x = xs * k / n; out.push([T[0] + ux * x, A[1] + a * (Math.cosh(x / a) - 1), T[2] + uz * x]); }
    out[out.length - 1] = F.slice(); return out;
  }
  // the links along a polyline from its start (the fairlead) for as far as the water lets them be seen (wy: the water's height), the rest
  // as a tube; on rope the rope down to the last few metres
  function rodeDraw(pts, dm, rope, wy, Lr, CH, M){
    const pitch = 4 * dm, deep = wy - 1.2; let s = 0, k = 0, carry = 0;
    for (let i = 0; i + 1 < pts.length; i++){
      const P = pts[i], Q = pts[i + 1], d = [Q[0] - P[0], Q[1] - P[1], Q[2] - P[2]], l = Math.hypot(d[0], d[1], d[2]); if (l < 1e-6) continue;
      const t = [d[0] / l, d[1] / l, d[2] / l], chainHere = !rope || s > Lr - 10;
      if (rope && !chainHere) drawN(ROPEA, limbM(P, Q, 0.008 + dm * 0.9));
      else if (!CH || (P[1] < deep && Q[1] < deep)) drawN(CHTA, limbM(P, Q, dm * 1.6));
      else {
        // links down to where the segment goes under (a long first segment of the catenary dives from the hawse), a tube on from there
        const xa = P[1] >= deep && Q[1] >= deep ? l : P[1] >= deep ? l * (P[1] - deep) / (P[1] - Q[1]) : 0, xb = P[1] < deep ? l * (deep - P[1]) / (Q[1] - P[1]) : 0;
        const at = x => [P[0] + t[0] * x, P[1] + t[1] * x, P[2] + t[2] * x];
        if (xb > 0) drawN(CHTA, limbM(P, at(xb), dm * 1.6));
        if (xa < l && P[1] >= deep) drawN(CHTA, limbM(at(xa), Q, dm * 1.6));
        const u1 = aU(Math.abs(t[1]) > 0.9 ? aX(t, [1, 0, 0]) : aX(t, [0, 1, 0])), u2 = aX(t, u1), x0 = P[1] >= deep ? 0 : xb, x1 = P[1] >= deep ? xa : l;
        for (let x = x0 + carry; x < x1; x += pitch) M.push(frameM(at(x + pitch / 2), t, k++ % 2 ? u2 : u1, dm));
        carry = (carry - (x1 - x0)) % pitch; if (carry < 0) carry += pitch;
      }
      s += l;
    }
    return k;
  }
  // a splash where the anchor goes in, and drops off it as it comes up (into the spindrift's particles)
  function ancSplash(x, y, z, n, up){ for (let j = 0; j < n; j++){ const i = SD.n = (SD.n + 1) % SDN, a = Math.random() * 6.2832, v = up ? 0.2 + Math.random() * 0.4 : 0.6 + Math.random() * 1.4;
    SD.x[i] = x + Math.sin(a) * 0.1; SD.z[i] = z + Math.cos(a) * 0.1; SD.y[i] = y; SD.vx[i] = Math.sin(a) * v; SD.vz[i] = Math.cos(a) * v; SD.vy[i] = up ? -0.5 : 1.2 + Math.random() * 2.2; SD.age[i] = 0; SD.life[i] = up ? 0.5 : 0.6 + Math.random() * 0.6; } }
  // another boat's anchors, stowed (the near ones, with their glass in)
  function drawNPCAnchor(n, K){
    const bw = K.geo && K.geo.bower; if (!bw || !bw.fair) return; const AM = ancMesh(bw); if (!AM) return; const M = chain(n.M, K.S), L = anchorLen(bw);
    for (const f of [bw, bw.spare]) if (f && f.fair){ const st = ancStow(f.fair, f.pipe, bw, L), Mm = chain(M, frameM(st.eye, st.dir, st.up, AM.s)); drawN(AM.m, AM.pre ? chain(Mm, AM.pre) : Mm); }
  }
  function drawAnchor(BMrel, eye, VP, t){
    const b = S.boat, G = GEO(vtype()), bw = G.bower; if (!bw || !bw.fair || b.land) return;
    const AM = ancMesh(bw); if (!AM) return;
    if (!ROPEA){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.52, 0.40, 0.24, 0.15], 6); ROPEA = r.mesh(); const c = NB(); c.tube([[0, 0, 0], [0, 0, 1]], 1, [0.16, 0.15, 0.14, 0.3], 6); CHTA = c.mesh(); }
    nSetup(VP);
    const now = performance.now() / 1000, dt = clamp(now - (ANC3.last || now), 0, 0.2); ANC3.last = now;
    const V = VESSELS[vtype()] || {len:10}, gr = typeof anchorGear === 'function' ? anchorGear(vtype()) : {chain:V.len >= 10, d:8, hf:1}, dm = gr.d / 1000, L = anchorLen(bw);
    const CH = kit('anchor', gr.d >= 30 ? 'stud' : 'link'), Ms = [], rel = q => xf(BMrel, q), draw = M => drawN(AM.m, AM.pre ? chain(M, AM.pre) : M);
    const st = ancStow(bw.fair, bw.pipe, bw, L), Fw = rel(bw.fair), stM = chain(BMrel, frameM(st.eye, st.dir, st.up, AM.s));
    // the spare, stowed in the other hawse
    if (bw.spare && bw.spare.fair){ const s2 = ancStow(bw.spare.fair, bw.spare.pipe, bw, L); draw(chain(BMrel, frameM(s2.eye, s2.dir, s2.up, AM.s))); }
    const a = b.anch && b.status !== 'port' ? b.anch : null, fr = typeof liveFrac === 'function' ? liveFrac() : 0, h = a ? (a.depth || 10) + Math.max(0.3, Fw[1] + eye[1]) : 10;
    let Lr = 0;
    if (a){
      if (ANC3.key !== a.t0){ ANC3.key = a.t0; ANC3.t0 = now; ANC3.fresh = S.t - a.t0 < 3; ANC3.splash = false; }
      const o0 = a.out0 != null ? a.out0 : a.out || 0, Lc = o0 + ((a.out || 0) - o0) * fr, fall = ANC3.fresh ? 3 * (now - ANC3.t0) : 1e9;
      Lr = a.up != null ? Lc : fall < h ? fall : Math.max(h, Lc); ANC3.Lg = Lr; ANC3.wasUp = a.up != null;
    } else if (ANC3.Lg > 0){ ANC3.Lg = Math.max(0, ANC3.Lg - dt * Math.max(3, ANC3.Lg / 4)); Lr = ANC3.Lg; }
    // the chain on deck from the gypsy to the hawse pipe or the roller
    const gy = bw.gypsy && bw.deck !== false ? bw.gypsy : null;
    if (!(Lr > 0.02)){
      ANC3.mode = 'stow'; ANC3.A = null; ANC3.links = 0; draw(stM);
      if (gy && CH){ const to = bw.pipe || st.eye; ANC3.links = rodeDraw([rel(gy), rel(to)], dm, false, 1e9, 10, CH, Ms); drawMany(CH, Ms); }
      return;
    }
    if (gy && CH) rodeDraw([rel(gy), rel(bw.pipe || bw.fair)], dm, false, 1e9, 10, CH, Ms);
    const wy = seaH(Fw[0] + eye[0], Fw[2] + eye[2], t) - eye[1];
    let Aw, M;
    if (a && Lr >= h - 0.05){
      // on the bottom where the core has it, the shank away from the boat, the flukes dug in
      const A = [a.x * 1000 - eye[0], -(a.depth || 10) - eye[1], a.y * 1000 - eye[2]], away = aU([A[0] - Fw[0], 0, A[2] - Fw[2]]);
      Aw = A; M = frameM([A[0], A[1] - 0.12 * L, A[2]], [away[0], -0.14, away[2]], [0, 1, 0], AM.s); ANC3.mode = 'bottom';
    } else {
      // hanging under the fairlead (going down, or coming up), into its place in the roller or the hawse over the last of it
      const E = [Fw[0], Fw[1] - Lr, Fw[2]], fwd = aU(xf(BMrel, [0, 0, -1]).map((v, i) => v - rel([0, 0, 0])[i])), sw = Math.sin(now * 1.3) * 0.08;
      let Mh = frameM(E, [sw, -1, 0], fwd, AM.s); const u = clamp(1 - Lr / (1.2 * L), 0, 1);
      if (u > 0){ const se = rel(st.eye), sd = aU(xf(BMrel, st.dir).map((v, i) => v - rel([0, 0, 0])[i])), su = aU(xf(BMrel, st.up).map((v, i) => v - rel([0, 0, 0])[i])), k = u * u * (3 - 2 * u);
        Mh = frameM([E[0] + (se[0] - E[0]) * k, E[1] + (se[1] - E[1]) * k, E[2] + (se[2] - E[2]) * k], [sw + (sd[0] - sw) * k, -1 + (sd[1] + 1) * k, sd[2] * k], [fwd[0] + (su[0] - fwd[0]) * k, fwd[1] + (su[1] - fwd[1]) * k, fwd[2] + (su[2] - fwd[2]) * k], AM.s); }
      Aw = E; M = Mh; ANC3.mode = 'hang';
      // the splash where it goes in, the drops off it on the way up
      const ay = E[1];
      if (!ANC3.wasUp && a && !ANC3.splash && ay < wy){ ANC3.splash = true; ancSplash(E[0] + eye[0], wy + eye[1], E[2] + eye[2], 26, false); }
      if ((ANC3.wasUp || !a) && ay > wy && ay < wy + 3 && Math.random() < dt * 14) ancSplash(E[0] + eye[0], ay + eye[1] - 0.2, E[2] + eye[2], 1, true);
    }
    draw(M); ANC3.A = Aw;
    const pts = ANC3.mode === 'bottom' ? rodePts(Aw, Fw, Lr, 16).reverse() : [Fw, Aw];
    ANC3.links = rodeDraw(pts, dm, !gr.chain, wy, Lr, CH, Ms); drawMany(CH, Ms);
  }
  let RB = null;
  function buildRescue(){
    if (typeof glbHas !== 'function' || !glbHas('redning')) return;
    const G = glbLoad('redning'), up = nm => { const o = glbPart('redning', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.95, 0.72, 0.12, 0.2], 6);
    RB = {hull:up('hull'), blue:up('blue'), rope:r.mesh(), ex:(G && G.ex) || {}, M:null, q:null};
  }
  function drawRescue(BMrel, eye, VP, t){
    if (!RB) return; RB.M = null; RB.q = null;
    const q = S.boat.status === 'tow' && typeof towPose === 'function' ? towPose(liveFrac()) : null; if (!q || !RB.hull) return;
    const x = q.r.p.x * 1000, z = q.r.p.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) > 12000) return;
    const y = (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.7;
    RB.q = q; RB.M = model(x - eye[0], y - eye[1], z - eye[2], -q.r.hd, Math.sin(t * 0.8 + z) * 0.02, Math.sin(t * 1.0 + x) * 0.03 * (0.3 + WV.hs));
    nSetup(VP); drawN(RB.hull, RB.M); if (RB.blue && Math.floor(t * 2.5) % 2 === 0) drawN(RB.blue, RB.M);
    // the tow line from the hook to your bow: slack while it is made fast, near taut under tow
    if ((q.ph === 'hook' && q.slack < 0.7) || q.ph === 'tow'){
      const G = GEO(vtype()), A = xf(BMrel, [0, (G.gw || 1) + 0.15, G.bow + 0.3]), B = xf(RB.M, RB.ex.tow || [0, 2, 5]);
      const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), sag = q.ph === 'tow' ? 0.01 * d + 0.3 : q.slack * 0.3 * d + 0.5;
      let prev = A; for (let k = 1; k <= 10; k++){ const s = k / 10, P = [A[0] + (B[0] - A[0]) * s, A[1] + (B[1] - A[1]) * s - sag * 4 * s * (1 - s), A[2] + (B[2] - A[2]) * s]; drawN(RB.rope, limbM(prev, P, 0.035)); prev = P; }
    }
  }
  function drawRescueLights(VP, t){
    if (!RB || !RB.M || !RB.ex.lights) return;
    const flash = Math.floor(t * 2.5) % 2 === 0, BL = [0.25, 0.45, 1];
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const [lx, ly, lz, c] of RB.ex.lights){ if (c === 'b' ? !flash : env.night < 0.05) continue; const q = xf(RB.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = c === 'b' ? Math.max(0.6, env.night) : env.night; drawPts(1, gl.POINTS, VP, c === 'b' ? BL : NLC[c], c === 'b' ? 900 : 500, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  // ---------- the coast harbours' floating docks and mooring buoys (core/05-vessels.js moorHarbour, tools/harbour/brygge.py) ----------
  // The landing block on the shore at the dock's root, the aluminium gangway hinged on it and resting on the first pontoon with its
  // rollers (steeper at low water), the concrete pontoons riding the tide, the last with its ladder and life ring; the buoys on the swell.
  let DKM = null;
  function buildDocks(){
    DKM = false; if (typeof glbHas !== 'function' || !glbHas('brygge')) return;
    const up = nm => { const o = glbPart('brygge', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    DKM = {kar:up('landkar'), gang:up('landgang'), pon:up('ponton'), end:up('ponton_end'), fin:up('finger'), boye:up('boye'), kaib:up('kai_betong'), ktre:up('kai_tre')};
    if (!DKM.pon || !DKM.gang) DKM = false;
  }
  function drawDocks(eye, t, VP){
    if (typeof MOOR === 'undefined' || !VEC.tiles.size) return;
    const R = 1500, H = [];
    for (const tl of vecTilesIn(eye[0] - R, eye[2] - R, eye[0] + R, eye[2] + R)) for (const h of tl.npc || []) if (h.moorVer === MOOR.ver && Math.hypot(h.x * 1000 - eye[0], h.y * 1000 - eye[2]) < R + 500) H.push(h);
    if (!H.length) return; if (DKM === null) buildDocks(); if (!DKM) return;
    nSetup(VP); const tide = env.tide || 0;
    // the berths the company holds along a quay face or the shore of a harbour (core/07e-havn.js): a quay front where she lies, in 6 m
    // bays, its top 2.4 m over mean sea level: concrete at a quay (kai_betong: the face at z = 0, the deck back to z = -5), and a timber
    // pier on piles along the shore for a boat under 15 m (kai_tre: 4.2 m wide about z = 0, so its middle 2.3 m in from the face); the
    // piers are drawn already
    if (DKM.kaib && typeof havnStore === 'function'){ const st = havnStore();
      for (const id in st.s){ const s = st.s[id], f = s.face; if (!s.vid || !f || f.dock || !(f.kind === 2 || f.kind === 3) || Math.hypot(f.x - eye[0], f.z - eye[2]) > R) continue;
        let yaw = Math.atan2(-f.uz, f.ux); if (-f.uz * f.nx + f.ux * f.nz < 0) yaw += Math.PI;
        const tre = f.kind === 3 && s.L < 15 && DKM.ktre, M = tre ? DKM.ktre : DKM.kaib, bk = tre ? 2.3 : 0;
        const n = Math.ceil((s.L + 4) / 6); for (let k = 0; k < n; k++){ const a = (k - (n - 1) / 2) * 6; drawN(M, model(f.x + f.ux * a - f.nx * bk - eye[0], -eye[1], f.z + f.uz * a - f.nz * bk - eye[2], yaw, 0, 0)); } } }
    for (const h of H){
      for (const d of h.docks || []){ const [ox, oz] = d.o, [nx, nz] = d.n; if (Math.hypot(ox - eye[0], oz - eye[2]) > R) continue;
        const yaw = Math.atan2(-nz, nx), fl = tide + FDOCK.FB, top = FDOCK.QTOP + 0.16, dh = top - fl, run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
        if (DKM.kar) drawN(DKM.kar, model(ox - eye[0], -eye[1], oz - eye[2], yaw, 0, 0));
        // the pontoons heave a little with the swell where they lie, the whole string as one
        const sm = d.s0 + d.np * FDOCK.PL / 2, wx = ox + nx * sm, wz = oz + nz * sm, y = tide + (seaH(wx, wz, t) - tide) * 0.3;
        for (let k = 0; k < d.np; k++){ const s = d.s0 + FDOCK.PL * (k + 0.5);
          drawN(k === d.np - 1 && DKM.end ? DKM.end : DKM.pon, model(ox + nx * s - eye[0], y - eye[1], oz + nz * s - eye[2], yaw, 0, 0)); }
        drawN(DKM.gang, model(ox - eye[0], top - eye[1], oz - eye[2], yaw, 0, -Math.atan2(dh - (y - tide), run)));
      }
      if (DKM.boye) for (const b of h.boats){ const q = b.moored && b.moored.buoy; if (!q) continue; const x = q.x * 1000, z = q.y * 1000;
        if (Math.hypot(x - eye[0], z - eye[2]) > R) continue;
        const y = seaH(x, z, t), sx = (seaH(x + 0.5, z, t) - seaH(x - 0.5, z, t)), sz = (seaH(x, z + 0.5, t) - seaH(x, z - 0.5, t));
        drawN(DKM.boye, model(x - eye[0], y - eye[1], z - eye[2], 0, -sz * 0.8, sx * 0.8)); }
    }
    gl.useProgram(PL.p);
  }
  // ---------- the floating docks among the packs' piers (01c-vec.js flyteTile, tools/harbour/brygge.py; tilbakemelding #94) ----------
  // (built a dock a step in the tile's statics job, tileStatics: floatJob)
  // Each dock's lines become the harbour's modules: pontoons of 12 m along a line of 1.6 m and wider (scaled along to fit each leg and
  // across to its width), the end pontoon with its ladder and life ring at an open end, fingers of 8 m from the end where they join; at
  // an end with land or a pier within 10 m beyond it, the abutment there and the gangway down onto the dock (one a dock, the nearest).
  // Within FLNEAR of the eye (by the quality level) the modules in sight are drawn (800 to 1 600 triangles each, one draw each; the
  // densest marinas, round Oslo, have some 300 within 350 m); the whole tile as low boxes in one mesh, a little
  // inside the modules so they cover them near. Both ride the tide, the modules heaving a little with the swell. The camera's solids
  // are the decks from below the water to over the rails.
  const FLT = new Map(), FLNEAR = [150, 250, 350, 450];   // by QUAL.lvl
  const distPL = (x, z, p) => { let b = 1e9; for (let i = 0; i + 1 < p.length; i++){ const [ax, az] = p[i], [bx, bz] = p[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1e-9, u = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); b = Math.min(b, Math.hypot(ax + dx * u - x, az + dz * u - z)); } return b; };
  // a module's matrix but for its place: turned to (ux, uz) and scaled sx along, sz across (the place is set as it is drawn)
  const flM = (ux, uz, sx, sz) => new Float32Array([ux * sx, 0, uz * sx, 0, 0, 1, 0, 0, -uz * sz, 0, ux * sz, 0, 0, 0, 0, 1]);
  function floatFree(k){ const F = FLT.get(k); if (F && F.mesh && gl) freeMesh(F.mesh); FLT.delete(k); }
  function floatJob(t, FD, solid){
    const far = MB(), docks = [], DK = [0.42, 0.36, 0.3], SD = [0.6, 0.6, 0.58], P = FDOCK;
    const box = (x, z, ux, uz, w, l) => far.box(x, -0.35, z, w, 0.77, l, SD, Math.atan2(ux, uz), DK);
    // the tile's lines with their boxes: an end within 1.5 m of another line, of this dock or another (OpenStreetMap often has each arm
    // of a dock as a pier of its own), is joined there
    const LS = []; for (const d of FD) for (const L of d.L){ let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (const [x, z] of L.p){ x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); } LS.push({L, x0, z0, x1, z1}); }
    const joinedAt = (x, z, self) => LS.some(o => o.L !== self && x > o.x0 - 2 && x < o.x1 + 2 && z > o.z0 - 2 && z < o.z1 + 2 && distPL(x, z, o.L.p) < 1.5);
    const dock = d => {
      const D = {mx:d.mx, mz:d.mz, r:0, mods:[]};
      // the open ends of its pontoon lines, each with how far beyond it land or a pier is (within 10 m): the nearest has the dock's one
      // gangway, one that lies against land (3 m) nothing, the others the end pontoon
      const LP = [], ends = [];
      for (const L of d.L){
        const p = L.p.slice(), n = p.length; if (n < 2) continue;
        const fin = L.w < 1.6, j0 = joinedAt(p[0][0], p[0][1], L), j1 = joinedAt(p[n - 1][0], p[n - 1][1], L);
        if (fin && !j0 && j1) p.reverse();   // a finger from where it joins
        const E = {L, p, fin, e:[null, null]}; LP.push(E); if (fin) continue;
        for (const [k, e, f] of [[0, p[0], p[1]], [1, p[n - 1], p[n - 2]]]){ if (k ? j1 : j0) continue;
          const dx = e[0] - f[0], dz = e[1] - f[1], l = Math.hypot(dx, dz) || 1, ox = dx / l, oz = dz / l; let sd = null;
          for (let s = 1; s <= 10 && sd === null; s++) if (solid(e[0] + ox * s, e[1] + oz * s)) sd = s;
          ends.push({E, k, e, ox, oz, sd}); E.e[k] = 'end'; }
      }
      const g = ends.filter(q => q.sd !== null).sort((a, b) => a.sd - b.sd)[0];
      for (const q of ends){
        if (q === g){ const x = q.e[0] + q.ox * q.sd, z = q.e[1] + q.oz * q.sd; q.E.e[q.k] = 'gang';
          D.mods.push({M:'kar', x, z, m:flM(-q.ox, -q.oz, 1, 1)}, {M:'gang', x, z, ux:-q.ox, uz:-q.oz}); box(x - q.ox * 1.6, z - q.oz * 1.6, q.ox, q.oz, 3.2, 3.2); }
        else if (q.sd !== null && q.sd <= 3) q.E.e[q.k] = null; }
      for (const {L, p, fin, e:[e0, e1]} of LP){
        const n = p.length;
        for (let i = 0; i + 1 < n; i++){
          const [ax, az] = p[i], [bx, bz] = p[i + 1], len = Math.hypot(bx - ax, bz - az); if (len < 0.5) continue;
          const ux = (bx - ax) / len, uz = (bz - az) / len;
          D.r = Math.max(D.r, Math.hypot(ax - d.mx, az - d.mz), Math.hypot(bx - d.mx, bz - d.mz));
          camSolid((ax + bx) / 2, (az + bz) / 2, L.w, len, Math.atan2(ux, uz), -1, 1.3, t.k);
          if (fin){ const k = Math.max(1, Math.round(len / 8)), sx = len / (k * 8), sz = clamp(L.w / 0.8, 0.7, 2);
            for (let j = 0; j < k; j++) D.mods.push({M:'fin', x:ax + ux * len * j / k, z:az + uz * len * j / k, m:flM(ux, uz, sx, sz)});
            box((ax + bx) / 2, (az + bz) / 2, ux, uz, L.w * 0.9, len); continue; }
          const k = Math.max(1, Math.round(len / P.PL)), sx = len / (k * P.PL), sz = clamp(L.w / P.PW, 0.7, 1.6);
          for (let j = 0; j < k; j++){ const s = len * (j + 0.5) / k, x = ax + ux * s, z = az + uz * s;
            if (e0 === 'end' && i === 0 && j === 0) D.mods.push({M:'end', x, z, m:flM(-ux, -uz, sx, sz)});
            else if (e1 === 'end' && i === n - 2 && j === k - 1) D.mods.push({M:'end', x, z, m:flM(ux, uz, sx, sz)});
            else D.mods.push({M:'pon', x, z, m:flM(ux, uz, sx, sz)}); }
          box((ax + bx) / 2, (az + bz) / 2, ux, uz, P.PW * sz * 0.92, len);
        }
      }
      if (D.mods.length) docks.push(D);
    };
    // a dock a step of the tile's job (tileStep, a few milliseconds a frame: Bergen's 339 docks were 150 ms in one), the mesh at its end
    return {items:FD.map(d => () => dock(d)), done:() => ({docks, mesh:far.p.length ? far.mesh([t.x0 + 25000, t.z0 + 25000]) : null})};
  }
  const FLN = {n:0};
  function drawFloats(eye, t, VP){
    FLN.n = 0; if (!FLT.size) return; let on = false;
    const tide = env.tide || 0, top = FDOCK.QTOP + 0.16, R = FLNEAR[QUAL.lvl] || 350;
    // in front of the eye and near the picture (clip space, with a margin for a module's size)
    const vis = (x, y, z) => { const w = VP[3] * x + VP[7] * y + VP[11] * z + VP[15]; if (w < -10) return false; const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12]; return Math.abs(cx) <= w * 1.3 + 10; };
    for (const F of FLT.values()) for (const D of F.docks){
      if (Math.hypot(D.mx - eye[0], D.mz - eye[2]) > R + D.r) continue;
      if (!on){ if (DKM === null) buildDocks(); if (!DKM || !DKM.fin) return; nSetup(VP); on = true; }
      const y = tide + (seaH(D.mx, D.mz, t) - tide) * 0.3;
      for (const q of D.mods){
        if (Math.abs(q.x - eye[0]) > R || Math.abs(q.z - eye[2]) > R || !vis(q.x - eye[0], y - eye[1], q.z - eye[2])) continue; FLN.n++;
        if (q.M === 'gang'){ const dh = top - (y + FDOCK.FB), run = Math.sqrt(Math.max(1, FDOCK.GL * FDOCK.GL - dh * dh));
          drawN(DKM.gang, model(q.x - eye[0], top - eye[1], q.z - eye[2], Math.atan2(-q.uz, q.ux), 0, -Math.atan2(dh, run))); continue; }
        const M = q.m; M[12] = q.x - eye[0]; M[13] = (q.M === 'kar' ? 0 : y) - eye[1]; M[14] = q.z - eye[2]; drawN(DKM[q.M], M);
      }
    }
    if (on) gl.useProgram(PL.p);
  }
  // ---------- aircraft (tools/air/fly.py) where core/05c-air.js airStates puts them, within about 15 km of the eye ----------
  let AIRM = null, airNow = [];
  function buildAir(){
    if (typeof glbHas !== 'function' || !glbHas('air')) return;
    const G = glbLoad('air'), up = nm => { const o = glbPart('air', nm); return o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null; };
    AIRM = {plane:up('plane'), prop:up('prop'), heli:up('heli'), rotor:up('rotor'), trotor:up('trotor'), ex:(G && G.ex) || {}};
  }
  function drawAir(eye, t, H, VP){
    airNow = []; if (!AIRM || !AIRM.plane || typeof airStates !== 'function') return;
    for (const a of airStates(H, {x:eye[0] / 1000, y:eye[2] / 1000}, 15)){
      const x = a.p.x * 1000, z = a.p.y * 1000, y = a.alt;
      a.w = [x, y, z]; a.M = model(x - eye[0], y - eye[1], z - eye[2], -a.hd, a.pitch, 0); airNow.push(a);
    }
    if (!airNow.length) return;
    nSetup(VP); const ex = AIRM.ex;
    for (const a of airNow){
      if (a.kind === 'plane'){ drawN(AIRM.plane, a.M); for (const h of ex.props || []) drawN(AIRM.prop, chain(a.M, M4.T(h[0], h[1], h[2]), M4.RZ(t * 31 + h[0]))); }
      else { const r = ex.rotor || [0, 2.75, 0], tr = ex.trotor || [-0.32, 2.75, 9]; drawN(AIRM.heli, a.M); drawN(AIRM.rotor, chain(a.M, M4.T(r[0], r[1], r[2]), M4.RY(t * 27))); drawN(AIRM.trotor, chain(a.M, M4.T(tr[0], tr[1], tr[2]), M4.RX(t * 70))); }
    }
  }
  // their lights: red to port, green to starboard and white aft at night; the red beacons and the white strobes flash day and night
  function drawAirLights(VP, t){
    if (!airNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    const beac = (t % 1) < 0.12, strobe = (t % 1.3) < 0.06 || ((t % 1.3) > 0.16 && (t % 1.3) < 0.22), BCOL = [1, 0.1, 0.06], SCOL = [1, 1, 1];
    for (const a of airNow){ for (const [lx, ly, lz, c] of (a.kind === 'plane' ? AIRM.ex.planeLights : AIRM.ex.heliLights) || []){
      const fl = c === 'B' || c === 'S'; if (fl ? !(c === 'B' ? beac : strobe) : env.night < 0.05) continue;
      const q = xf(a.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = fl ? Math.max(0.55, env.night) : env.night;
      drawPts(1, gl.POINTS, VP, c === 'B' ? BCOL : c === 'S' ? SCOL : NLC[c], fl ? 2600 : 1400, true); } }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function drawNPCGlass(VP){ for (const n of npcNow) if (n.K && n.K.glass) drawGlass(n.K.glass, chain(n.M, n.K.S), VP); }
  function drawNPCLights(VP){
    if (env.night < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){
      // the same rules as the own boat (vessel3d.js lanterns): fishing red over white, under way the full set, in port nothing
      const stN = {port:n.st === 'port', fishing:n.st === 'fishing', v:n.st === 'fishing' ? 0 : 5, anch:false};
      if (n.K){ const M = chain(n.M, n.K.S), px = n.L < 14 ? 260 : 600; for (const [p, col] of lanterns(n.K.geo, {len:n.L || 8, vmax:10}, stN)){ const q = xf(M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, px, true); } continue; }
      const LG = NPCM.lanG || (NPCM.lanG = {}), GN = LG[n.type] || (LG[n.type] = {lights:(NPCM.lights[n.type] || []).map(([lx, ly, lz, c]) => [[lx, ly, lz], NLC[c]])});
      for (const [p, col] of lanterns(GN, {len:n.L || 20, vmax:12}, stN)){ const q = xf(n.M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, NPCM.lightPx[n.type] || 900, true); } }
    const cs = npcNow.find(n => n.type === 'coastal');
    if (cs){ let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) for (const sx of [-1, 1]){ if (hash(r * 97 + i * 13 + (sx > 0 ? 5 : 0)) < 0.35) continue; const q = xf(cs.M, [sx * 8.95, 8.5 + r * 3.2, -24 + i * 3.4]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } drawPts(k, gl.POINTS, VP, [1, 0.8, 0.5], 420, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  // ---------- the chase camera stays out of solid things ----------
  // Quays and breakwaters, bridge decks and their piers, lighthouses, the plant's silo and crane, and the buildings, as oriented
  // boxes in a 200 m grid (buildings are added a map cell at a time when the camera first comes near). Each frame the line from the
  // boat to the eye is checked: the camera tilts up over what is in the way, and what is still in the way pulls it in along the line.
  const CAMG = new Map(), CAMC = 200, CAMBLD = new Set(); let camStamp = 0, camPull = 1, camLift = 0;
  // a box the way MB.box draws it: centre x, z; size sx across and sz along the heading ry; from y0 up to y1
  function camSolid(x, z, sx, sz, ry, y0, y1, tag){
    const b = {x, z, c:Math.cos(ry), s:Math.sin(ry), hx:sx / 2, hz:sz / 2, y0, y1, m:0, tag}, r = Math.hypot(sx, sz) / 2;
    for (let gx = Math.floor((x - r) / CAMC); gx <= Math.floor((x + r) / CAMC); gx++) for (let gz = Math.floor((z - r) / CAMC); gz <= Math.floor((z + r) / CAMC); gz++){
      const k = gridKey(gx, gz); let a = CAMG.get(k); if (!a) CAMG.set(k, a = []); a.push(b); }
  }
  // the buildings of one 1 km map cell, as tall as buildChunk makes them at most (walls, roof and the rise of the ground)
  const BLD_WALL = {1:6, 3:2.6, 4:2.9, 5:3.1, 6:5.2, 7:2.3, 8:7.5, 11:7, 12:1.8, 13:2.6, 14:2.5, 15:1.2}, BLD_ROOF = {3:[0.22, 2], 5:[0.45, 6], 6:[0.4, 7], 7:[0.3, 2], 11:[0.6, 9]};
  function camBuildings(key){
    if (!CAMBLD.has(key)){ CAMBLD.add(key); if (BLD) camBld(BLD, BLD.cells.get(key)); }
    // a pack's: once its tile is decoded (a tile whose pack is on its way is looked at again)
    const vk = 'v' + key; if (CAMBLD.has(vk)) return;
    const T = MAPD.man ? MAPD.man.tile : 50, tx = Math.floor(gridKeyX(key) / T), ty = Math.floor(gridKeyY(key) / T), t = vecTile(tx, ty);
    if (!t && vecHas(tx, ty)) return;
    CAMBLD.add(vk); if (t && t.bld) camBld(t.bld, vecBldIn(t, key), t.k);
  }
  function camBld(B, idx, tag){
    for (const i of idx || []){
      const x = B.x[i], z = B.z[i], l = B.l[i], w = B.w[i], ty = B.t[i], lv = B.lv[i], ca = Math.cos(B.a[i]), sa = Math.sin(B.a[i]);
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(x + ca * u * l - sa * v * w, z + sa * u * l + ca * v * w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const base = Math.max(lo, 0.3) - 0.5, rise = Math.max(0, hi - base);
      const hg = ty === 1 && lv ? 2.7 * lv + 0.6 : ty === 2 ? (lv || 3) * 3 : ty === 6 && lv ? 3 * lv : ty === 8 && lv ? 4 * lv : ty === 9 || ty === 10 ? (lv || 2) * 3.4 : ty === 0 && lv ? 2.8 * lv : BLD_WALL[ty] || 3.6;
      const flat = ty === 2 || ty === 8 || ty === 9 || ty === 12 || ty === 14 || ty === 15 || (ty === 10 && w >= 14), rp = BLD_ROOF[ty] || [0.38, 6];
      camSolid(x, z, w + 0.8, l + 0.8, Math.PI / 2 - B.a[i], base, base + hg + rise + (flat ? 0.3 : Math.min(w * rp[0], rp[1]) + 0.3), tag);
    }
  }
  // what a tile of the coast's packs put in the camera's way goes with it
  function camDropTag(tag){ for (const [k, a] of CAMG){ const b = a.filter(q => q.tag !== tag); if (b.length !== a.length){ if (b.length) CAMG.set(k, b); else CAMG.delete(k); } } }
  const slab = (p, d, lo, hi, r) => { if (Math.abs(d) < 1e-9) return p >= lo && p <= hi; let a = (lo - p) / d, b = (hi - p) / d; if (a > b){ const q = a; a = b; b = q; } if (a > r[0]) r[0] = a; if (b < r[1]) r[1] = b; return r[0] <= r[1]; };
  // how much of the way from o (the boat) to e (the eye) is clear: 1 when nothing is in the way. Boxes o is inside do not count.
  function camFree(o, e){
    const dx = e[0] - o[0], dy = e[1] - o[1], dz = e[2] - o[2], x0 = Math.min(o[0], e[0]), x1 = Math.max(o[0], e[0]), z0 = Math.min(o[2], e[2]), z1 = Math.max(o[2], e[2]);
    const g0 = Math.floor(x0 / CAMC), g1 = Math.floor(x1 / CAMC), h0 = Math.floor(z0 / CAMC), h1 = Math.floor(z1 / CAMC);
    if ((g1 - g0 + 1) * (h1 - h0 + 1) > 36) return 1;   // far out the camera is high above everything
    for (let kx = Math.floor((x0 - 60) / 1000); kx <= Math.floor((x1 + 60) / 1000); kx++) for (let kz = Math.floor((z0 - 60) / 1000); kz <= Math.floor((z1 + 60) / 1000); kz++) camBuildings(gridKey(kx, kz));
    let best = 1; const st = ++camStamp, r = [0, 0];
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) for (const b of CAMG.get(gridKey(gx, gz)) || []){
      if (b.m === st) continue; b.m = st;
      const px = o[0] - b.x, pz = o[2] - b.z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * b.c - pz * b.s, dx * b.c - dz * b.s, -b.hx, b.hx, r) || !slab(px * b.s + pz * b.c, dx * b.s + dz * b.c, -b.hz, b.hz, r) || !slab(o[1], dy, b.y0, b.y1, r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    // the other boats in sight (npcNow: the coast's, Senja's fleet, the players'), each a box of her length and beam from the waterline to
    // her wheelhouse's roof (the coastal ship and the ferry to their bridges), so the camera does not go into a boat lying alongside
    for (const n of npcNow){ const L = n.L || 9, B = n.B || L / 3, x = n.p.x * 1000, z = n.p.y * 1000, rr = L / 2 + B;
      if (x + rr < x0 || x - rr > x1 || z + rr < z0 || z - rr > z1) continue;
      const big = n.type === 'coastal' || n.type === 'ferry', cs = Math.sin(n.hd || 0), sn = Math.cos(n.hd || 0), px = o[0] - x, pz = o[2] - z; r[0] = -Infinity; r[1] = Infinity;
      if (!slab(px * cs - pz * sn, dx * cs - dz * sn, -L / 2, L / 2, r) || !slab(px * sn + pz * cs, dx * sn + dz * cs, -B / 2, B / 2, r) || !slab(o[1], dy, (env.tide || 0) - 1, (env.tide || 0) + (big ? 18 : Math.min(7, 2 + L * 0.25)), r)) continue;
      if (r[0] >= 0 && r[0] < best) best = r[0];
    }
    return best;
  }
  // is a point inside something solid (for the tests)
  function camInside(x, y, z){ camBuildings(gridKey(Math.floor(x / 1000), Math.floor(z / 1000))); for (const b of CAMG.get(gridKey(Math.floor(x / CAMC), Math.floor(z / CAMC))) || []){ const px = x - b.x, pz = z - b.z, lx = px * b.c - pz * b.s, lz = px * b.s + pz * b.c; if (Math.abs(lx) <= b.hx && Math.abs(lz) <= b.hz && y >= b.y0 && y <= b.y1) return true; } return false; }
  let lastEye = [0, 0, 0], camFwd = [0, -1], earT = 0;
  // the compass line at the top of the 3D view (the user's wish 02.10.2026): the true bearing the camera looks along, thin ticks every
  // 5 degrees, the quarters and eighths by name and the tens of degrees between them, 70 degrees either way; drawn when it turns
  // The compass line: a strip of the whole round (and 70 degrees more each side) is drawn once per width, pixel ratio and language,
  // and each frame only shows the part round the heading (it was drawn anew with shadows at every 0.2 degrees, 03.10.2026)
  const CMPS = {el:document.getElementById('compass3d'), at:NaN, w:0, strip:null, key:''};
  function compassStrip(W, H, dpr){
    const span = 70, k = W / (2 * span), names = S.lang === 'no' ? ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const c = CMPS.strip || (CMPS.strip = document.createElement('canvas')); c.width = Math.ceil((360 + 2 * span) * k); c.height = H;
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, H); g.lineCap = 'round'; g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 3 * dpr;
    for (let a = -span; a <= 360 + span; a += 5){
      const x = (a + span) * k, n = ((a % 360) + 360) % 360, main = n % 45 === 0;
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = (main ? 1.6 : 1) * dpr;
      g.beginPath(); g.moveTo(x, H - 2 * dpr); g.lineTo(x, H - (main ? 9 : n % 15 === 0 ? 6 : 4) * dpr); g.stroke();
      if (main || n % 15 === 0){ g.fillStyle = '#fff'; g.font = (main ? '600 ' + Math.round(12 * dpr) : Math.round(9.5 * dpr)) + 'px sans-serif'; g.fillText(main ? names[n / 45] : String(n), x, H - 12 * dpr); }
    }
    return k;
  }
  function compassDraw(az, p){
    const el = CMPS.el; if (!el || !el.clientWidth) return;
    const deg = trueDeg(az, p); if (Math.abs(deg - CMPS.at) < 0.1 && CMPS.w === el.clientWidth) return; CMPS.at = deg; CMPS.w = el.clientWidth;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(el.clientWidth * dpr), H = Math.round(el.clientHeight * dpr); if (el.width !== W) el.width = W; if (el.height !== H) el.height = H;
    const key = W + ',' + H + ',' + dpr + ',' + S.lang; if (key !== CMPS.key){ CMPS.key = key; CMPS.k = compassStrip(W, H, dpr); }
    const span = 70, k = CMPS.k, g = el.getContext('2d');
    g.clearRect(0, 0, W, H); g.drawImage(CMPS.strip, (deg % 360) * k, 0, W, H, 0, 0, W, H);
    // the ends fade out (one gradient over what was drawn)
    g.globalCompositeOperation = 'destination-in'; if (!CMPS.fade || CMPS.fw !== W){ const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.25, 'rgba(0,0,0,0.75)'); gr.addColorStop(0.5, '#000'); gr.addColorStop(0.75, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); CMPS.fade = gr; CMPS.fw = W; }
    g.fillStyle = CMPS.fade; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#ff5aa8'; g.beginPath(); g.moveTo(W / 2 - 4 * dpr, H); g.lineTo(W / 2 + 4 * dpr, H); g.lineTo(W / 2, H - 6 * dpr); g.closePath(); g.fill();
  }

  // ---------- frame ----------
  // «#fps» in the address: the frame rate in a corner, to measure on the tablet
  const FPS = {v:0, at:0, el:null};
  // shown with «#fps» in the address or «Vis bildetakt» in the settings (S.settings.fpsShow)
  function fpsEl(){
    const on = /fps/.test(location.hash) || !!(S.settings && S.settings.fpsShow);
    if (on && !FPS.el){ FPS.el = document.createElement('div'); FPS.el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:12px monospace;color:#fff;background:rgba(0,0,0,.55);padding:2px 6px;border-radius:4px;pointer-events:none'; document.body.appendChild(FPS.el); }
    if (FPS.el) FPS.el.hidden = !on;
    return on ? FPS.el : null;
  }
  // ---------- cinema (the user's wish 03.10.2026) ----------
  // «Kino» lets the camera film the trip by itself: shots of 12-20 s in turn, a drone circling high, low along the side at the waterline,
  // from ahead looking back at the bow, from the shore as she passes (with a long lens), a wide shot of the landscape, and from behind over the wake. The
  // eye and the aim move through a filter of 0.7 s (cut at a new shot), the horizon is level (no roll), and a shot whose eye would be
  // in the land or the sea, or with the land between it and the boat, is passed over for the next.
  const KINO = {on:false, shot:null, n:0, eye:null, tgt:null};
  const KTYPES = ['drone', 'low', 'ahead', 'shore', 'wide', 'chase'];
  function kinoWant(K, t){
    const L = Math.max(5, (VESSELS[vtype()] || {}).len || 6), C = [bv.x, bv.y + 1.2, bv.z], fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), s = K.side, u = t - K.t0;
    const sea = (x, z) => Math.max(terrH(x, z), seaH(x, z, t));
    if (K.type === 'drone'){ const a = K.a0 + u * 0.06 * s, R = 45 + L * 3; const e = [C[0] + Math.sin(a) * R, 0, C[2] - Math.cos(a) * R]; e[1] = sea(e[0], e[2]) + 26 + L; return [e, C, 50]; }
    if (K.type === 'low'){ const e = [C[0] + rx * s * (L * 0.35 + 5) - fx * L * (0.3 - u * 0.012), 0, C[2] + rz * s * (L * 0.35 + 5) - fz * L * (0.3 - u * 0.012)]; e[1] = sea(e[0], e[2]) + 0.9; return [e, [C[0] + fx * L * 0.4, C[1], C[2] + fz * L * 0.4], 55]; }
    if (K.type === 'ahead'){ const e = [C[0] + fx * (L * 2.2 + 22) + rx * s * 5, 0, C[2] + fz * (L * 2.2 + 22) + rz * s * 5]; e[1] = sea(e[0], e[2]) + 2.6; return [e, C, 45]; }
    // from the shore a long lens: the frame about four boat lengths high wherever she is
    if (K.type === 'shore'){ const e = [K.px, sea(K.px, K.pz) + 1.8, K.pz], d = Math.hypot(C[0] - e[0], C[2] - e[2]); return [e, C, clamp(2 * Math.atan(2 * L / Math.max(1, d)) / DEG, 6, 40)]; }
    if (K.type === 'wide'){ const e = [C[0] - fx * 120 + rx * s * 80, 0, C[2] - fz * 120 + rz * s * 80]; e[1] = sea(e[0], e[2]) + 45; return [e, [C[0] + fx * 60, C[1], C[2] + fz * 60], 55]; }
    const e = [C[0] - fx * (L * 3 + 18), 0, C[2] - fz * (L * 3 + 18)]; e[1] = sea(e[0], e[2]) + 7 + L * 0.3; return [e, [C[0] + fx * 30, C[1], C[2] + fz * 30], 50];
  }
  function kinoNext(t){
    for (let k = 0; k < KTYPES.length; k++){
      const type = KTYPES[(KINO.n++) % KTYPES.length], K = {type, t0:t, dur:12 + 8 * hash(KINO.n * 7 + 3), side:hash(KINO.n * 13 + 1) < 0.5 ? -1 : 1, a0:hash(KINO.n * 5 + 2) * 6.28};
      if (type === 'shore'){
        // a point 60-210 m off her course ahead, on the side with land if there is any near; the boat sails past it
        const fx = Math.sin(bv.head), fz = -Math.cos(bv.head), rx = Math.cos(bv.head), rz = Math.sin(bv.head), ahead = 90 + Math.max(0, bv.spd || 0) * 6; let best = null;
        for (const off of [60, 110, 160, 210]){ for (const sd of [1, -1]){ const x = bv.x + fx * ahead + rx * sd * off, z = bv.z + fz * ahead + rz * sd * off; if (terrH(x, z) > 1.5){ best = [x, z]; break; } } if (best) break; }
        if (!best) best = [bv.x + fx * ahead + rx * K.side * 70, bv.z + fz * ahead + rz * K.side * 70];
        K.px = best[0]; K.pz = best[1];
      }
      const [e, g] = kinoWant(K, t);
      if (camFree(g, e) > 0.9){ KINO.shot = K; KINO.eye = e.slice(); KINO.tgt = g.slice(); KINO.eyeR = null; KINO.hid = 0; return; }
    }
    KINO.shot = {type:'drone', t0:t, dur:12, side:1, a0:0}; KINO.eye = null; KINO.eyeR = null; KINO.hid = 0;
  }
  // The eye and the aim are smoothed in the boat's frame (as offsets from her), so they keep up with her at the screen's speed (six
  // times real: 71 m/s at 23 knots); in the world's frame the filter of 0.7 s left them some 50 m behind her and she ran out of the
  // picture (the user 04.10.2026: «I cinematic-view vises som oftest ikke båten»). The shore camera stands still and only its aim
  // follows. A shot that loses her behind the land for a second cuts to the next.
  function kinoCam(t, rdt){
    if (!KINO.shot || t - KINO.shot.t0 > KINO.shot.dur || t < KINO.shot.t0) kinoNext(t);
    const C = [bv.x, bv.y, bv.z], [e, g, fov] = kinoWant(KINO.shot, t), k = 1 - Math.exp(-Math.min(0.25, rdt) / 0.7), fixed = KINO.shot.type === 'shore';
    const eW = fixed ? e : [e[0] - C[0], e[1] - C[1], e[2] - C[2]], gR = [g[0] - C[0], g[1] - C[1], g[2] - C[2]];
    if (!KINO.eyeR){ KINO.eyeR = eW.slice(); KINO.tgtR = gR.slice(); }
    for (let i = 0; i < 3; i++){ KINO.eyeR[i] += (eW[i] - KINO.eyeR[i]) * k; KINO.tgtR[i] += (gR[i] - KINO.tgtR[i]) * k; }
    const eye = fixed ? KINO.eyeR.slice() : [KINO.eyeR[0] + C[0], KINO.eyeR[1] + C[1], KINO.eyeR[2] + C[2]], tgt = [KINO.tgtR[0] + C[0], KINO.tgtR[1] + C[1], KINO.tgtR[2] + C[2]];
    const gy = Math.max(terrH(eye[0], eye[2]), seaH(eye[0], eye[2], t)) + 0.6; if (eye[1] < gy) eye[1] = gy;
    if (camFree([C[0], C[1] + 1.2, C[2]], eye) < 0.6){ KINO.hid = (KINO.hid || 0) + rdt; if (KINO.hid > 1) kinoNext(t); } else KINO.hid = 0;
    KINO.eye = eye; KINO.tgt = tgt;
    return {eye:eye.slice(), tgt, fov};
  }
  // the main thread's time a frame takes (ms, smoothed; the GL commands are queued, so this is the JS side): with the frame rate it tells a
  // phone or a PC held back by the script from one held back by the graphics card (the devices' telemetry, 10f-cloud.js cloudDev)
  let JSMS = 0;
  // held while the pub's own 3D is shown (ui/09b-pub.js): no frames drawn, the loop keeps ticking
  let HOLD = false;
  // the way out of Father's naust at a new game's start (docs/onboarding.md B5, Jonas 09.10.2026): the eye starts on the naust's
  // quay in front of the door, with the boat right there, and glides back and up to its usual place behind her over a few seconds
  let INTRO = null;
  function introStart(sec){
    const n = typeof naustSite === 'function' ? naustSite() : null; if (!n || !n.o) return false;
    const N = [-n.u[1], n.u[0]], x = n.o[0] + N[0] * 2, z = n.o[1] + N[1] * 2;   // N: out to sea (07c-naust.js shoreSpot)
    INTRO = {t0:performance.now(), dur:sec || 5, e0:[x, Math.max(terrH(x, z), 0) + 2.4, z]}; cam.helm = false; return true;
  }
  function frame(){ const j0 = performance.now(); frame0(); JSMS = JSMS ? JSMS * 0.92 + (performance.now() - j0) * 0.08 : performance.now() - j0; }
  let FRAMEN = 0;
  function frame0(){ FRAMEN++;
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden || NO3D || HOLD) return;
    resize();
    const now = performance.now(), dt = Math.min(0.1, (now - lastF) / 1000), rdt = Math.max(1e-3, (now - lastF) / 1000); lastF = now;
    FPS.v = FPS.v ? FPS.v * 0.95 + 0.05 / rdt : 1 / rdt; FRAMEMS = FRAMEMS * 0.8 + Math.min(500, rdt * 1000) * 0.2; qualTick(dt, FPS.v, now); if (now - FPS.at > 500){ FPS.at = now; const fe = fpsEl(); if (fe) fe.textContent = Math.round(FPS.v) + ' bilder/s · ' + (1000 / FPS.v).toFixed(1) + ' ms · ' + ['Lav', 'Middels', 'Høy', 'Ultra'][QUAL.lvl]; }
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac, rdt); updateWaves(dt, H); nfStep(); updateWake(); updateNear(); ssStep(rdt); updateShadows(); updateChunks(CH.size ? 2 : 999);
    // camera
    let eye, V, kfov = 0;
    if (KINO.on && !SHOW && !PAINTV){
      const K = kinoCam(t, rdt); eye = K.eye; kfov = K.fov; V = viewDir([K.tgt[0] - eye[0], K.tgt[1] - eye[1], K.tgt[2] - eye[2]]); camFwd = [K.tgt[0] - eye[0], K.tgt[2] - eye[2]];
    } else if (cam.helm && !SHOW && !PAINTV){
      // at the wheel: the eye stands where the helmsman's head is on the hull, and moves with it, so the boat round him stands still
      // in the picture; only the head steadies itself: the view follows the boat's pitch and roll through a filter of 0.3 s, so an
      // uneven frame (the tablet's) does not jerk the horizon (the user: «båten rister voldsomt i bro-visningen», 03.10.2026). The eye
      // was placed by the steadied pitch and heave too, so the rail and the console bobbed against it (the user's video 04.10.2026:
      // «hvor mye båten vibrerer under seiling»); a heave does not move the horizon, which is far off
      const kh = 1 - Math.exp(-Math.min(0.25, rdt) / 0.3); if (cam.sp === undefined || !isFinite(cam.sp)){ cam.sp = bv.pitch; cam.sr = bv.roll; }
      cam.sp += (bv.pitch - cam.sp) * kh; cam.sr += (bv.roll - cam.sr) * kh;
      const Mh = model(bv.x, bv.y, bv.z, -bv.head, cam.sp * 0.7, cam.sr * 0.7);
      // the eye in full precision: model() is a Float32Array, and a translation of a million metres in it is only good to 6 to 12 cm, so the
      // eye jumped in steps while the hull, drawn relative to it, did not: a sawtooth some ten times a second that grew with the speed
      // (the user's video 09.10.2026: «hopper sikkert frem og tilbake flere titalls ganger i sekundet»). Rotate the offset, then add.
      { const o = xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), (GEO(vtype())).eye); eye = [bv.x + o[0], bv.y + o[1], bv.z + o[2]]; }
      const cy = Math.cos(cam.hp), dl = [-Math.sin(cam.hy) * cy, Math.sin(cam.hp), -Math.cos(cam.hy) * cy];
      const f = [Mh[0] * dl[0] + Mh[4] * dl[1] + Mh[8] * dl[2], Mh[1] * dl[0] + Mh[5] * dl[1] + Mh[9] * dl[2], Mh[2] * dl[0] + Mh[6] * dl[1] + Mh[10] * dl[2]];
      V = viewDir(f, [Mh[4], Mh[5], Mh[6]]); camFwd = [f[0], f[2]];
    } else {
      if ((SHOW || PAINTV) && !drag) cam.yaw += dt * 0.12;   // the showroom and the paint shop turn slowly round the boat
      // (cam.at: a point on the deck in the boat's frame to look at instead of her middle, for the tests' close shots of the crew)
      const AT = cam.at && !SHOW ? xf(model(0, 0, 0, -bv.head, bv.pitch, bv.roll), cam.at) : null;
      const C = SHOW ? [SHOW.x, (env.tide || 0) + 1.3 + Math.min(4, VESSELS[SHOW.t].len * 0.06), SHOW.z] : AT ? [bv.x + AT[0], bv.y + AT[1] + 1.0, bv.z + AT[2]] : [bv.x, bv.y + 1.3, bv.z], yawW = (SHOW ? SHOW.h : bv.head) + cam.yaw, tgt = C;
      if (PAINTV && !SHOW) paintAim(C, yawW);
      const eyeAt = p => { const cp = Math.cos(p), sp = Math.sin(p), e = [C[0] - Math.sin(yawW) * cam.dist * cp, C[1] + cam.dist * sp, C[2] + Math.cos(yawW) * cam.dist * cp];
        const ground = Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)) + 2; if (e[1] < ground) e[1] = ground; return e; };
      // tilt up over a quay or under a bridge rather than diving in close (up quickly, back down slowly) ... as far as straight down
      // over the boat: at low water a boat alongside lies 3 m under the quay's edge, which a lift of 57 degrees did not clear
      let lift = 0, f = camFree(tgt, eyeAt(cam.pitch));
      while (f < 0.98 && f * cam.dist < 12 && cam.pitch + lift < 1.45){ lift += 0.1; f = camFree(tgt, eyeAt(Math.min(1.45, cam.pitch + lift))); }
      camLift += clamp(lift - camLift, -dt * 0.6, dt * 3);
      eye = eyeAt(Math.min(1.45, cam.pitch + camLift));
      // ... and what is still in the way pulls the camera in along the line to the boat, at once; it goes back out gently
      const L = Math.hypot(eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]) || 1, want = clamp(camFree(tgt, eye) - 0.8 / L, Math.min(1, 2 / L), 1);
      camPull = want < camPull ? want : Math.min(want, camPull + dt * 1.5);
      if (camPull < 0.999) eye = [tgt[0] + (eye[0] - tgt[0]) * camPull, tgt[1] + (eye[1] - tgt[1]) * camPull, tgt[2] + (eye[2] - tgt[2]) * camPull];
      if (INTRO){ const k = Math.min(1, (performance.now() - INTRO.t0) / (INTRO.dur * 1000)), s = k * k * (3 - 2 * k); eye = [INTRO.e0[0] + (eye[0] - INTRO.e0[0]) * s, INTRO.e0[1] + (eye[1] - INTRO.e0[1]) * s, INTRO.e0[2] + (eye[2] - INTRO.e0[2]) * s]; if (k >= 1) INTRO = null; }
      V = viewDir([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]); camFwd = [tgt[0] - eye[0], tgt[2] - eye[2]];
    }
    lastEye = eye; EYE = eye; earT = performance.now(); compassDraw(Math.atan2(camFwd[0], -camFwd[1]), {x:eye[0] / 1000, y:eye[2] / 1000});
    if (!RO.on || Math.abs(eye[0] - RO.x) > 40000 || Math.abs(eye[2] - RO.z) > 40000){ RO.x = Math.round(eye[0] / 4096) * 4096; RO.z = Math.round(eye[2] / 4096) * 4096; RO.on = true; }
    const W = canvas.width, Hh = canvas.height, asp = W / Hh, fov = kfov ? kfov * DEG : cam.helm ? 2 * Math.atan(Math.tan(cam.fov * DEG / 2) / (cam.zoom || 1)) : 55 * DEG; curFov = fov;
    { const z = !kfov && cam.helm ? cam.zoom || 1 : 1, on = z > 1.5; if (binoc.hidden === on) binoc.hidden = !on; if (on){ const t = Math.round(z) + '×'; if (binoc.firstChild.textContent !== t) binoc.firstChild.textContent = t; } }
    let cornerD = 0; if (NEARM) for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cornerD = Math.max(cornerD, Math.hypot(NEARM.x0 + qx * NEARM.sx - eye[0], NEARM.z0 + qz * NEARM.sz - eye[2], eye[1]));
    const nearFar = Math.max(3000, cam.dist * 3, cornerD + 300); lightNF = nearFar; const VPf = mul(persp(fov, asp, 25, QUAL.lvl === 3 ? 260000 : 170000), V.m);
    // the near plane moves out with the camera when it is high above the boat (Jonas' video from Båtsfjord 09.10.2026): at 0.25 m the depth
    // could not tell the sea from the shore a few kilometres off (the sea came through the low land in teal stripes); nothing is drawn
    // that near a high camera, and at the boat's own distances (to some 50 m) it stays as it was
    const nearN = cam.helm || kfov ? 0.25 : clamp(Math.min(cam.dist, eye[1]) * 0.005, 0.25, 15), VPn = mul(persp(fov, asp, nearN, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = Array.from(model(0, 0, 0, -bv.head, bv.pitch, bv.roll)); BMabs[12] = bv.x; BMabs[13] = bv.y; BMabs[14] = bv.z;   // world position in full precision (see the eye above)
    // apparent wind for the flag
    const wdir = (windDir(H, {x:bv.x / 1000, y:bv.z / 1000}) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG, wv = env.wind || windAt(H, {x:bv.x / 1000, y:bv.z / 1000}), bms = bv.v * 0.514 * 2;
    const ax = Math.sin(wdir) * wv - Math.sin(bv.head) * bms, az = -Math.cos(wdir) * wv + Math.cos(bv.head) * bms, appW = Math.hypot(ax, az), appB = Math.atan2(ax, -az);
    updateFlag(t, appW);

    gl.viewport(0, 0, W, Hh); gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.useProgram(PK.p);
    const u = PK.u, tn = Math.tan(fov / 2);
    gl.uniform3fv(u.uF, V.F); gl.uniform3fv(u.uR, V.R); gl.uniform3fv(u.uU, V.U); gl.uniform2fv(u.uTan, [tn * asp, tn]);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uSunD, env.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uMoonD, env.moonDir || [0, -1, 0]); gl.uniform1f(u.uMoonA, env.moonA || 0);
    skyFrame(u, Hh, tn, bv); cloudStep(Math.min(30, rdt)); gl.uniform2fv(u.uCloudOff, CLD.off); gl.uniform1f(u.uCloud, env.cloud); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uStars, env.stars); gl.uniform1f(u.uAur, env.aur); gl.uniform1f(u.uDay, env.day); gl.uniform2fv(u.uWindDir, env.windDir);
    gl.disableVertexAttribArray(1); attr(0, SKYQ, 2); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // far pass
    pickLights(eye, t);
    drawTerrain(TM, eye, VPf, false); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); drawUnits(eye, VPf, false, 15000); drawSites(eye, VPf, false, 15000); if (NPCM) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d < 30000 && !((n.fleet || n.coast) && d < 1500)) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
    drawSea(VPf, eye, t, 1);
    drawSeaLights(VPf, eye, t, false);
    if (env.night > 0.02){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      if (BLD) drawChunkLights(VPf, eye);
      else if (LIGHTS.length){ const n = Math.min(LIGHTS.length / 3, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = LIGHTS[i * 3] - eye[0]; PB[i * 3 + 1] = LIGHTS[i * 3 + 1] - eye[1]; PB[i * 3 + 2] = LIGHTS[i * 3 + 2] - eye[2]; PA[i] = env.night * 0.9; } drawPts(n, gl.POINTS, VPf, [1, 0.78, 0.42], 5000, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // near pass
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const VT = vtype(), VG = GEO(VT), ncrew = Math.min(crewAboard().length, (VG.crewSpots || []).length); if (VG.hand) useHand(VT);
    drawTerrain(TM, eye, VPn, true); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM);
    // whoever works the deck leaves their place: alone, the skipper leaves the wheel
    // resting ashore in the naust or a rorbu (15-energy.js; Jonas 05.10.2026: «Ved hvile forsvinner skipperen fra båten») he is not aboard
    // never more people aboard than the crew list (tilbakemelding #24): the crew at the hauler and the one at the table leave their
    // places, and with you ashore one of the crew is at the wheel
    DECKACT = deckActivity(); const awaySk = (DECKACT.on && DECKACT.me) || gopMe() || (meAboard() && resting()), awayCr = DECKACT.on && DECKACT.crew ? 1 : 0;
    const gHaul = S.boat.gop && !VG.hand ? Math.min(3, gopHands()) - (gopMe() ? 1 : 0) : 0, helmCr = !meAboard() && !awaySk ? 1 : 0;
    // under way the crew are inside (the user: no reason for them to stand on deck all day, 03.10.2026); whoever guts is at the table
    // (drawDeck), and in an open boat they sit where they are. The one at the table leaves their place (a skiff drew them twice).
    // and while the skipper rests ashore the crew are up there too (Jonas 06.10.2026: both sleep in the rorbu)
    // and at the quay in a boat with bunks the crew who still need rest are asleep in them, not on deck (tilbakemelding #65; they rest
    // there as fast as in a rorbu, core/04-crew.js): only the rested ones come up
    const underway = S.boat.status === 'sailing' && !S.boat.gop, ashore = meAboard() && restAshore();   // (in the bunk aboard, #70, the crew stay on deck)
    const inBunks = S.boat.status === 'port' && !VG.open && bunks(S.boat) ? crewAboard().slice(0, ncrew).filter(c => c.fatigue >= 1).length : 0;
    const deckCrew = (underway && !VG.open) || ashore ? 0 : Math.max(0, ncrew - awayCr - Math.max(0, gHaul) - helmCr - inBunks);
    // the people aboard walk the deck (deckcrew.js): the boat is drawn without her fixed figures, and the agents are drawn after her
    const DKON = !VG.hand && typeof CREW3D !== 'undefined' && CREW3D.on();
    if (DKON){ CREW3D.setJig(jigRail(VT, VG)); CREW3D.setRoll(bv.roll); CREW3D.setHelm(!!cam.helm); CREW3D.tick(dt); }
    if (VG.hand){ drawSkiff(BMrel, VPn, dt, !cam.helm && !awaySk, deckCrew > 0); gl.useProgram(PL.p); }
    // jigging from a boat with a wheelhouse, the skipper leaves the wheel for the rail (the hand-worked boats do the same in drawSkiff),
    // also with crew aboard: he tends the jig while they gut (tilbakemelding #62: on a sjark with two hands he stood in the wheelhouse
    // while one hand looked on); he stays at the wheel only when the crew fill every deck place
    else { const jig = S.boat.status === 'fishing' && !S.boat.gop && !S.boat.deckStop;
      drawVessel(VT, VG, BMrel, VPn, !DKON && !cam.helm && !awaySk, DKON ? 0 : deckCrew, !DKON && jig, hullLiv(S.boat), true); drawJigRail(BMrel, VPn, VT, VG, dt); gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
      if (DKON) drawDeckCrew(BMrel, eye, VPn, t, VG); }
    SAY.a = null;
    if (SAY.c && performance.now() - SAY.t0 < SAYMS){
      // over the head of the one who speaks, at his place on deck (the crew stand at the places in the order of the list); when he is not
      // to be seen (inside under way, at the hauler or the table, or ashore) the line floats over the boat, over her house, so it can be read
      const ag = DKON ? CREW3D.anchorOf(SAY.c.id) : null, ci = crewAboard().findIndex(p => p.id === SAY.c.id), sp = ag ? [ag.x, ag.y, ag.z] : VG.crewSpots && ci >= 0 && ci < deckCrew ? VG.crewSpots[ci] : null, tp = VG.top || [0, 3.4, 0];
      SAY.a = xf(BMrel, sp ? [sp[0], sp[1] + 2.1, sp[2]] : [tp[0], tp[1] + 1.6, tp[2]]);
    }
    if (SHOW){ const y = (env.tide || 0) + (seaH(SHOW.x, SHOW.z, t) - (env.tide || 0)) * 0.8; SHOW.M = model(SHOW.x - eye[0], y - eye[1], SHOW.z - eye[2], -SHOW.h, Math.sin(t * 0.7) * 0.02, Math.sin(t * 0.9) * 0.03); drawVessel(SHOW.t, GEO(SHOW.t), SHOW.M, VPn, true, 2); }
    if (STATN){ nSetup(VPn); drawN(STATN, TM); if (BUNKN) drawN(BUNKN, TM); } if (LIFT.off < 0.05) drawMooring(BMrel, eye, VPn, t); drawRescue(BMrel, eye, VPn, t); drawTowLine(BMrel, VPn); drawAnchor(BMrel, eye, VPn, t); if (PM) drawDeck(BMrel, eye, VPn, t, DECKACT); drawGearOp(BMrel, eye, VPn, t);
    const plant = PM ? nearestPlant(eye) : null; drawUnits(eye, VPn, true, nearFar, plant && plant.id); drawSites(eye, VPn, true, nearFar);
    const pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null;
    // a hand at the plant says his line: over his head, else over the first hand who is out
    if (SAY.w && plant && plant.id === SAY.w.pid && plant.wpos && performance.now() - SAY.t0 < SAYMS){ const q = plant.wpos[SAY.w.idx] || plant.wpos[Object.keys(plant.wpos)[0]]; if (q) SAY.a = [q.x - eye[0], q.y + 2.1 - eye[1], q.z - eye[2]]; }
    if (SAY.b && performance.now() - SAY.t0 < SAYMS){ const n = (npcNow || []).find(q => q.id === SAY.b); if (n) SAY.a = [n.p.x * 1000 - eye[0], (env.tide || 0) + 7 - eye[1], n.p.y * 1000 - eye[2]]; }
    const bunk = PM ? nearestBunker(eye) : null; if (bunk) bunk.last = drawBunker(bunk, eye, VPn, t, BMrel); gl.useProgram(PL.p);
    wildSpawn(t); drawNPC(eye, t, H, VPn); drawAir(eye, t, H, VPn); drawGearSea(eye, t, VPn, H); drawDocks(eye, t, VPn); drawFloats(eye, t, VPn); drawWild(eye, t, dt);

    // the ensign in its hours (core/03-simulation.js flagUp; always while the paint shop tries one on); the pennant flies day and night
    gl.disableVertexAttribArray(2);
    if (PAINTPRE || flagUp(S.t / 60, S.boat.pos)){ const pole = xf(BMrel, VG.pole), fl = flagTex(), FM = model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0);
      drawTexQuad(FLAGM, FLAGM.tex, fl.shape === 'vimpel' ? chain(FM, new Float32Array([1.7, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])) : FM, VPn, true, [0, 0.6, 0]); }
    { const pen = S.ach && S.ach.pen ? Math.min(3, S.ach.pen | 0) : 0, mt = pen && mastTop(VG); if (mt){ const P = xf(BMrel, mt); drawTexQuad(FLAGM, penTex(), chain(model(P[0], P[1], P[2], Math.PI / 2 - appB, 0, 0), PEN_S[pen - 1]), VPn, true, [0, 0.6, 0]); } }
    gl.useProgram(PL.p);
    if (SHOW && SHOW.M && GEO(SHOW.t).open && pvm(SHOW.t).cap){ gl.colorMask(false, false, false, false); drawLit(pvm(SHOW.t).cap, SHOW.M); gl.colorMask(true, true, true, true); }
    { const cap = VG.hand ? (SK ? SK.cap : CAPM) : VG.open ? pvm(VT, hullLiv(S.boat)).cap : null; if (cap){ gl.colorMask(false, false, false, false); drawLit(cap, BMrel); gl.colorMask(true, true, true, true); } }
    drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false);
    drawBeams(VPn, eye, t);
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawAirLights(VPn, t); drawRescueLights(VPn, t); drawSeaLights(VPn, eye, t, true);
    if (VG.hand) drawSkiffGlass(BMrel, VPn); else drawGlass(pvm(VT, hullLiv(S.boat)).glass, BMrel, VPn);
    if (SHOW && SHOW.M) drawGlass(pvm(SHOW.t).glass, SHOW.M, VPn);
    drawNPCGlass(VPn);
    if (pr && pr.spray){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(pr.spray, gl.POINTS, VPn, [0.86, 0.93, 1], 30, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (pr && env.night > 0.05){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); pr.lamps.forEach((q, i) => { PB[i * 3] = q[0]; PB[i * 3 + 1] = q[1]; PB[i * 3 + 2] = q[2]; PA[i] = env.night; }); drawPts(pr.lamps.length, gl.POINTS, VPn, [1, 0.9, 0.72], 1400, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (env.night > 0.05){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      // at anchor only the all-round white light shows (no side lights or stern light, which are for a boat under way); the anchor
      // alarm turns it red and makes it flash (06e-anchor.js)
      const b0 = S.boat, anchored = !!b0.anch && b0.status !== 'port', alarm = performance.now() < ANCHAL.until, V0 = VESSELS[vtype()] || {len:8};
      // the lanterns after Sjøveisreglene (vessel3d.js lanterns, 17.10.2026): what she shows follows what she does
      let L3 = lanterns(VG, V0, {port:b0.status === 'port', anch:anchored, v:b0.v || 0, fishing:b0.status === 'fishing' || !!b0.gop, trawl:V0.cls === 'hav' && !(V0.rigs || []).length, aground:b0.status === 'aground', nuc:b0.status === 'engine' || b0.status === 'adrift'}), drawn = L3.length;
      if (anchored && alarm && L3.length) L3 = L3.map(([p, c], i) => i ? [p, c] : [p, (performance.now() / 250) % 2 < 1 ? [1, 0.1, 0.06] : [0.25, 0.02, 0.02]]);   // the anchor alarm turns the light red and flashing (06e-anchor.js)
      ANCHAL.drawn = drawn;
      for (const [lp, lc] of L3){ const q = xf(BMrel, lp); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VPn, lc, anchored ? 420 : 260, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    updateLabels(VPf, eye, W, Hh);
    if (SNAP) snapTake();
  }
  // a picture of the frame just drawn, for the feedback app (ui/06e-feedback.js): read in the same task as the drawing, while the
  // drawing buffer still holds it (the context keeps no copy, preserveDrawingBuffer is off), at most w px on the long side
  let SNAP = null;
  function snapTake(){
    const s = SNAP; SNAP = null;
    try { const k = Math.min(1, s.w / Math.max(canvas.width, canvas.height)), c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); s.res(c.toDataURL('image/jpeg', 0.85)); } catch (e){ console.error(e); s.res(null); }
  }
  function drawRoute(VP, eye){
    if (!S.plan) return;
    const pts = [[bv.x - eye[0], bv.z - eye[2]]].concat(S.plan.wps.slice(S.plan.idx).map(w => [w.x * 1000 - eye[0], w.y * 1000 - eye[2]]));
    let n = 0;
    for (let i = 0; i < pts.length - 1 && n < 3900; i++){ PB.set([pts[i][0], 2 - eye[1], pts[i][1], pts[i + 1][0], 2 - eye[1], pts[i + 1][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    for (let i = 1; i < pts.length && n < 3900; i++){ PB.set([pts[i][0], -eye[1], pts[i][1], pts[i][0], 30 - eye[1], pts[i][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawPts(n, gl.LINES, VP, [0.88, 0.25, 0.62], 1, false);
    gl.disable(gl.BLEND);
  }
  // spindrift: from a gale (Beaufort 8) the wind tears spray off the crests and drives it low along the sea, more and more into a storm
  const SDN = 400, SD = {x:new Float64Array(SDN), y:new Float32Array(SDN), z:new Float64Array(SDN), vx:new Float32Array(SDN), vy:new Float32Array(SDN), vz:new Float32Array(SDN), age:new Float32Array(SDN).fill(99), life:new Float32Array(SDN).fill(1), n:0, acc:0};
  function driftSpray(VP, eye, dt, t, col){
    const U = env.wind || 0, wd = env.windDir; SD.acc = Math.min(SD.acc + dt * 260 * sstep(17.2, 28.5, U), 60);
    while (SD.acc >= 1){ SD.acc -= 1; const a = Math.random() * 6.2832, r = 8 + Math.random() * 110, x = eye[0] + Math.sin(a) * r, z = eye[2] + Math.cos(a) * r, i = SD.n = (SD.n + 1) % SDN, sp = U * (0.45 + Math.random() * 0.35);
      SD.x[i] = x; SD.z[i] = z; SD.y[i] = seaHFast(x, z, t) + 0.2; SD.vx[i] = wd[0] * sp; SD.vz[i] = wd[1] * sp; SD.vy[i] = 0.6 + Math.random() * 1.6; SD.age[i] = 0; SD.life[i] = 0.8 + Math.random() * 1.2; }
    let n = 0;
    for (let i = 0; i < SDN; i++){ if (SD.age[i] >= SD.life[i]) continue; SD.age[i] += dt; SD.vy[i] -= 2.5 * dt; SD.x[i] += SD.vx[i] * dt; SD.y[i] += SD.vy[i] * dt; SD.z[i] += SD.vz[i] * dt;
      PB[n * 3] = SD.x[i] - eye[0]; PB[n * 3 + 1] = SD.y[i] - eye[1]; PB[n * 3 + 2] = SD.z[i] - eye[2]; PA[n] = Math.sin(Math.PI * Math.min(1, SD.age[i] / SD.life[i])) * 0.45; n++; }
    if (n) drawPts(n, gl.POINTS, VP, col, 90, true);
  }
  // The semi-diesel's black puffs (Jonas 05.10.2026: «svarte små eksos-skyer ut av eksosen hver gang motoren antenner»): one at each
  // firing the sound schedules (SND.FIRES), on the view's own clock when there is no sound; from the exhaust's mouth (the model's
  // anchor exhaust), leaving with some of the boat's way, rising, growing and thinning, carried off with the wind; darker and bigger
  // when the throttle opens. Drawn as soft round points in four sizes by age.
  const SMN = 90, SMK = {x:new Float32Array(SMN), y:new Float32Array(SMN), z:new Float32Array(SMN), vx:new Float32Array(SMN), vy:new Float32Array(SMN), vz:new Float32Array(SMN), age:new Float32Array(SMN).fill(9), life:new Float32Array(SMN), k:new Float32Array(SMN), n:0};
  let smkPh = 0;
  function drawSmoke(VP, eye, BM, dt){
    const VG = GEO(vtype()), b = S.boat, run = ['sailing', 'unmooring', 'fishing', 'idle'].includes(b.status) || !!b.gop;
    if (BOAT.semi && VG.exhaust && run){
      const frac = clamp((b.v || 0) / Math.max(1, BOAT.vmax), 0, 1), now = performance.now(), F = typeof SND !== 'undefined' && SND.FIRES;
      const fwd = (() => { const a = xf(BM, [0, 0, 0]), c = xf(BM, [0, 0, -1]); return [c[0] - a[0], c[2] - a[2]]; })(), sp = (b.v || 0) * 0.514;
      const puff = k => { const p = xf(BM, VG.exhaust), i = SMK.n = (SMK.n + 1) % SMN;
        SMK.x[i] = p[0]; SMK.y[i] = p[1]; SMK.z[i] = p[2]; SMK.vx[i] = fwd[0] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vz[i] = fwd[1] * sp * 0.6 + (Math.random() - 0.5) * 0.2; SMK.vy[i] = 0.7 + 0.6 * k + Math.random() * 0.2;
        SMK.age[i] = 0; SMK.life[i] = 2.2 + Math.random() + k * 0.6; SMK.k[i] = k; };
      if (F && F.length){ while (F.length && F[0].at <= now){ const f = F.shift(); if (now - f.at < 400) puff(f.frac); } }
      else { const R = BOAT.rpm || [340, 850]; smkPh += dt / (120 / (R[0] + frac * (R[1] - R[0]))); while (smkPh >= 1){ smkPh -= 1; puff(frac); } }
    }
    // charcoal grey taking the light round it, soft and thinning (Adrian 05.10.2026 on an iPhone: «Kommer noen sånne svarte prikka å hop over
    // skjermen av og til»: they were hard black discs, and tiny black dots from far off), and not drawn beyond 250 m
    const wv = (env.wind || 0) * 0.8, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, dr = Math.min(1, dt * 1.4), col = [0.16 + env.amb[0] * 0.3, 0.16 + env.amb[1] * 0.3, 0.17 + env.amb[2] * 0.3];
    const B = [[], [], [], []];
    for (let i = 0; i < SMN; i++){
      if (SMK.age[i] >= SMK.life[i]) continue;
      SMK.age[i] += dt; SMK.vx[i] += (wx - SMK.vx[i]) * dr; SMK.vz[i] += (wz - SMK.vz[i]) * dr; SMK.vy[i] *= 1 - Math.min(1, dt * 0.6);
      SMK.x[i] += SMK.vx[i] * dt; SMK.y[i] += SMK.vy[i] * dt; SMK.z[i] += SMK.vz[i] * dt;
      const a = SMK.age[i] / SMK.life[i]; if (Math.hypot(SMK.x[i] - eye[0], SMK.z[i] - eye[2]) < 250) B[Math.min(3, Math.floor(a * 4))].push(i);
    }
    B.forEach((L, q) => {
      let n = 0;
      for (const i of L){ const a = SMK.age[i] / SMK.life[i]; PB[n * 3] = SMK.x[i] - eye[0]; PB[n * 3 + 1] = SMK.y[i] - eye[1]; PB[n * 3 + 2] = SMK.z[i] - eye[2]; PA[n] = Math.pow(1 - a, 1.6) * (0.3 + 0.22 * SMK.k[i]); n++; }
      drawPts(n, gl.POINTS, VP, col, [320, 700, 1150, 1700][q], 2, null, 512);
    });
  }
  function drawEffects(VP, eye, BM, dt, t){
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const foamCol = [Math.min(1, env.amb[0] * 1.4 + env.sunCol[0] * 0.8), Math.min(1, env.amb[1] * 1.4 + env.sunCol[1] * 0.8), Math.min(1, env.amb[2] * 1.4 + env.sunCol[2] * 0.8)];
    // wake and spray
    const v = bv.v;
    if (v > 1){
      const VG = GEO(vtype());
      // a trail point for every 1.2 m travelled, stamped with the real clock (independent of frame rate)
      const p = xf(BM, [0, 0, VG.stern]), now = performance.now() / 1000, last = TRAIL[0], moved = last ? Math.hypot(p[0] - last.x, p[2] - last.z) : 99;
      if (moved > 1.2 || (last && now - last.t0 > 0.3)){ wk.odo = (wk.odo || 0) + Math.min(moved, 60); TRAIL.unshift({x:p[0], z:p[2], t0:now, age:0, r:0.45 + Math.random() * 0.55, v, u:wk.odo, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}); if (TRAIL.length > 700) TRAIL.pop(); }
      // spray: when the bow drives down into a sea (how fast it sinks into the water against the surface), thrown out to both sides and up,
      // and carried off with the wind; at planing speed a little all the time in a chop. It leaves the hull where the bow wave does, along
      // the waterline a little aft of the stem, as a fine mist, and keeps most of the boat's way: it fans out beside the bow and falls
      // astern of it (Jonas 21.10.2026, #90: the spray did not look real. Thrown from a point at the stem with no way on, it hung in the
      // air as a trail of round blobs behind the boat)
      const bowP = xf(BM, [0, 0.15, VG.bow]), imm = bowP[1] - seaH(bowP[0], bowP[2], t), sink = wk.imm == null ? 0 : (imm - wk.imm) / Math.max(dt, 1e-3); wk.imm = imm;
      const wv = (env.wind || 0) * 0.35, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv, Lb = VG.stern - VG.bow, fx = Math.sin(bv.head), fz = -Math.cos(bv.head), way = (bv.spd || 0) * 0.9;
      if (v > 3 && sink < -0.5 && imm < 0.6) wk.sacc += Math.min(100, -sink * v * 1.25);
      if (WK.Fr > 0.9) wk.sacc += dt * v * WV.hs * 2;
      while (wk.sacc >= 1){ wk.sacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, a = 0.08 + Math.random() * 0.22, p = xf(BM, [side * VG.side * (0.45 + a * 1.6), 0.1, VG.bow + a * Lb]), up = 0.9 + Math.random() * (1.4 + Math.min(4, -sink)), out = 1.6 + Math.random() * 2.6;
        spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * out + fx * way + wx, up, Math.sin(bv.head) * side * out + fz * way + wz, 0.6 + Math.random() * 0.7, 9.8); }
      // the rooster tail: a planing outboard throws a plume of water up behind the leg
      if (BOAT.outboard && WK.Fr > 1){ wk.racc = (wk.racc || 0) + dt * 70 * sstep(1, 1.6, WK.Fr);
        while (wk.racc >= 1){ wk.racc -= 1; const p = xf(BM, [(Math.random() - 0.5) * 0.3, 0.1, VG.stern + 0.4]), bk = 2 + Math.random() * 3;
          spawn(p[0], p[1], p[2], -Math.sin(bv.head) * bk + wx, 2.2 + Math.random() * 2.2, Math.cos(bv.head) * bk + wz, 0.6 + Math.random() * 0.4, 9.8); } }
    }
    // wake: the prop wash's bubbles behind the stern (gone in 6 s; the pale band under them went, Jonas 04.10.2026: «kun vise
    // boblepartiklene») and the two Kelvin arms spreading at 19.5 degrees, fading out within 10 s («gradvis forsvinner»), each corner
    // laid on the waves where it lies (one height across an arm hid it under the waves on one side more than the other)
    { const now = performance.now() / 1000; for (const q of TRAIL) q.age = now - (q.t0 || now); }
    while (TRAIL.length && TRAIL[TRAIL.length - 1].age > 11) TRAIL.pop();
    if (TRAIL.length > 1 && WKB){
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step, tide = env.tide || 0;
      const seaY = (x, z) => seaHFast(x, z, t) + wakeHFast(x, z) + 0.07;
      const st = xf(BM, [0, 0, (GEO(vtype())).stern]), pts = (v > 1 ? [{x:st[0], z:st[2], age:0, v, u:wk.odo || 0, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}] : []).concat(TRAIL);
      let m = 0; const P = WKB.p, W = WKB.w, Sg = WKB.s, cap = 8900;
      const put = (x, z, y, u, vv, age, kind, str) => { if (m >= cap) return; P[m * 3] = x - eye[0]; P[m * 3 + 1] = y - eye[1]; P[m * 3 + 2] = z - eye[2]; W[m * 4] = u; W[m * 4 + 1] = vv; W[m * 4 + 2] = age; W[m * 4 + 3] = kind; Sg[m] = str; m++; };
      const strip = (A, B) => { // A, B: arrays of 3 across-points [x, z, v] at two stations, with u/age/kind/str
        for (let c = 0; c < 2; c++){ const a0 = A.q[c], a1 = A.q[c + 1], b0 = B.q[c], b1 = B.q[c + 1];
          for (const [q, S2] of [[a0, A], [a1, A], [b1, B], [a0, A], [b1, B], [b0, B]]) put(q[0], q[1], q[3], S2.u, q[2], S2.age, S2.kind, S2.str); } };
      const sections = (kind) => {
        const out = []; let di = 0;
        for (let i = 0; i < pts.length; i++){
          if (pts[i].age > (kind ? 10.3 : 6.3)) break;
          if (i) di += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
          const a = pts[i], b = pts[Math.min(pts.length - 1, i + 1)], c0 = pts[Math.max(0, i - 1)];
          let dx = c0.x - b.x, dz = c0.z - b.z; const l = Math.hypot(dx, dz); if (l < 1e-3){ dx = a.hx; dz = a.hz; } else { dx /= l; dz /= l; }
          const px = -dz, pz = dx, spd = (a.v || v) * 0.5144, str = clamp(spd / 3.6, 0.25, 1);
          if (kind === 0){ const w = 0.55 + Math.min(5, di * 0.028 + a.age * 0.12); out.push({u:a.u, age:a.age, kind:0, str:str * 1.05, q:[[a.x + px * w, a.z + pz * w, -1], [a.x, a.z, 0], [a.x - px * w, a.z - pz * w, 1]]}); }
          else { const L = 1.05 + 0.354 * di, w = 0.4 + di * 0.06, sd = kind === 1 ? 1 : -1, cx = a.x + px * L * sd, cz = a.z + pz * L * sd;
            out.push({u:a.u, age:a.age, kind:1, str:str * clamp(spd / 3, 0.2, 1), q:[[cx + px * w * sd, cz + pz * w * sd, -1], [cx, cz, 0], [cx - px * w * sd, cz - pz * w * sd, 1]]}); }
        }
        return out;
      };
      // the sea height once per point across the wake (each is a corner of up to six triangles)
      for (const kind of [1, 2, 0]){ const sec = sections(kind); for (const S2 of sec) for (const q of S2.q) q.push(seaY(q[0], q[1])); for (let i = 0; i < sec.length - 1; i++) strip(sec[i], sec[i + 1]); }
      if (m){
        gl.useProgram(PRGW.p); const u = PRGW.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform4fv(u.uWk0, [WK.u0[0] - RO.x, WK.u0[1] - RO.z, WK.u0[2], WK.u0[3]]); gl.uniform4fv(u.uWk1, WK.u1); gl.uniform3fv(u.uEye, [eye[0] - RO.x, eye[1], eye[2] - RO.z]); gl.uniform3fv(u.uCol, foamCol); gl.uniform3fv(u.uAer, [0.09, 0.3, 0.31].map((c, k) => c * (env.amb[k] * 1.4 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uArm, [0.1, 0.27, 0.31].map((c, k) => c * (env.amb[k] * 1.8 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uTime, t);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.pb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, P.subarray(0, m * 3)); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.wb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, W.subarray(0, m * 4)); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, WKB.sb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, Sg.subarray(0, m)); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
        gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); gl.drawArrays(gl.TRIANGLES, 0, m); gl.disable(gl.POLYGON_OFFSET_FILL); gl.disableVertexAttribArray(2);
      }
    }
    let n = 0;
    for (let i = 0; i < WN; i++){
      if (wk.age[i] >= wk.life[i]) continue;
      wk.age[i] += dt; wk.vy[i] -= wk.g[i] * dt; wk.x[i] += wk.vx[i] * dt; wk.y[i] += wk.vy[i] * dt; wk.z[i] += wk.vz[i] * dt;
      PB[n * 3] = wk.x[i] - eye[0]; PB[n * 3 + 1] = wk.y[i] - eye[1]; PB[n * 3 + 2] = wk.z[i] - eye[2]; PA[n] = Math.pow(Math.max(0, 1 - wk.age[i] / wk.life[i]), 1.5) * 0.75; n++;
    }
    if (QUAL.lvl) drawPts(n, gl.POINTS, VP, foamCol, 95, 2);   // (soft, as mist: round discs read as blobs)
    if (QUAL.lvl) driftSpray(VP, eye, dt, t, foamCol);
    drawSmoke(VP, eye, BM, dt);
    // fishing lines
    if (S.boat.status === 'fishing' && SK && (SK.lines || []).length){
      const segs = (SK.lines || []).slice();
      let n = 0;
      for (const [a0, b0] of segs){ if (n > 30) break; const A0 = [a0[0] + eye[0], a0[1] + eye[1], a0[2] + eye[2]], B0 = b0 ? [b0[0] + eye[0], b0[1] + eye[1], b0[2] + eye[2]] : [A0[0], seaH(A0[0], A0[2], t) - 0.2, A0[2]];
        PB.set([A0[0] - eye[0], A0[1] - eye[1], A0[2] - eye[2], B0[0] - eye[0], B0[1] - eye[1], B0[2] - eye[2]], n * 6); PA[n * 2] = PA[n * 2 + 1] = 0.8; n++; }
      if (n) drawPts(n * 2, gl.LINES, VP, [0.12, 0.12, 0.12], 1, false);
    }
    // rain or snow
    const pr = env.precip;
    if (pr > 0.04){
      const snow = env.temp < 1, BX = 26, BY = 16;
      if (!pinit){ for (let i = 0; i < PN; i++){ pp[i * 3] = eye[0] + (Math.random() * 2 - 1) * BX; pp[i * 3 + 1] = eye[1] + (Math.random() * 2 - 1) * BY; pp[i * 3 + 2] = eye[2] + (Math.random() * 2 - 1) * BX; } pinit = true; }
      const wx = env.windDir[0] * env.wind * (snow ? 0.8 : 0.9), wz = env.windDir[1] * env.wind * (snow ? 0.8 : 0.9), vy = snow ? -1.3 : -7.5;
      const cnt = Math.floor(PN * Math.min(1, pr * 1.2)); let m = 0;
      for (let i = 0; i < cnt; i++){
        const jx = snow ? Math.sin(t * 1.3 + i) * 0.6 : 0, jz = snow ? Math.cos(t * 1.1 + i * 1.7) * 0.6 : 0;
        pp[i * 3] += (wx + jx) * dt; pp[i * 3 + 1] += vy * dt; pp[i * 3 + 2] += (wz + jz) * dt;
        for (let a = 0; a < 3; a++){ const e = a === 1 ? BY : BX; let r = pp[i * 3 + a] - eye[a]; if (r > e) pp[i * 3 + a] -= 2 * e; else if (r < -e) pp[i * 3 + a] += 2 * e; }
        const rx = pp[i * 3] - eye[0], ry = pp[i * 3 + 1] - eye[1], rz = pp[i * 3 + 2] - eye[2];
        if (snow){ PB[m * 3] = rx; PB[m * 3 + 1] = ry; PB[m * 3 + 2] = rz; PA[m] = 0.85; m++; }
        else { PB.set([rx, ry, rz, rx - (wx) * 0.05, ry - vy * 0.05, rz - (wz) * 0.05], m * 3); PA[m] = PA[m + 1] = 0.35; m += 2; }
      }
      const pc = [Math.min(1, env.amb[0] * 2 + env.sunCol[0] * 0.6 + 0.25), Math.min(1, env.amb[1] * 2 + env.sunCol[1] * 0.6 + 0.27), Math.min(1, env.amb[2] * 2 + env.sunCol[2] * 0.6 + 0.3)];
      drawPts(m, snow ? gl.POINTS : gl.LINES, VP, pc, 95, true);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  function updateLabels(VP, eye, W, Hh){
    const r = wrap.getBoundingClientRect(), sx = r.width / W, sy = r.height / Hh;
    // the crew's line over the head of whoever says it
    if (!SAY.el || !SAY.el.isConnected){ SAY.el = document.createElement('div'); SAY.el.className = 'say3d'; labelsEl.appendChild(SAY.el); }
    { const el = SAY.el, age = performance.now() - SAY.t0, a = SAY.a;
      if (!a || age >= SAYMS){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const cw = VP[3] * a[0] + VP[7] * a[1] + VP[11] * a[2] + VP[15];
        if (cw <= 0) el.style.display = 'none';
        else { const cx = VP[0] * a[0] + VP[4] * a[1] + VP[8] * a[2] + VP[12], cy = VP[1] * a[0] + VP[5] * a[1] + VP[9] * a[2] + VP[13];
          if (el.textContent !== SAY.txt) el.textContent = SAY.txt;
          el.style.display = ''; el.style.opacity = Math.min(1, age / 300, (SAYMS - age) / 800).toFixed(2); el.style.left = ((cx / cw * 0.5 + 0.5) * W * sx) + 'px'; el.style.top = ((1 - (cy / cw * 0.5 + 0.5)) * Hh * sy) + 'px'; } } }
    if (!ANCHAL.el || !ANCHAL.el.isConnected){ ANCHAL.el = document.createElement('div'); ANCHAL.el.className = 'anchal'; labelsEl.appendChild(ANCHAL.el); }
    { const el = ANCHAL.el, on = performance.now() < ANCHAL.until;
      if (!on){ if (el.style.display !== 'none') el.style.display = 'none'; }
      else { const txt = S.lang === 'no' ? (ANCHAL.kind === 'gale' ? '⚓ ANKERALARM · ankeret slepper i kuling' : '⚓ ANKERALARM · ankeret slepper') : (ANCHAL.kind === 'gale' ? '⚓ ANCHOR ALARM · dragging in a gale' : '⚓ ANCHOR ALARM · the anchor is dragging');
        if (el.textContent !== txt) el.textContent = txt; el.style.display = ''; el.classList.toggle('on', (performance.now() / 350) % 2 < 1); } }
  }

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
    _debug:{matp:MATP, nf:NF, cld:CLD, cfx:CFX, get fln(){ return FLN.n; }, get flt(){ return [...FLT].map(([k, F]) => ({k, docks:F.docks.length, mods:F.docks.reduce((a, D) => a + D.mods.length, 0), kinds:F.docks.reduce((a, D) => { for (const q of D.mods) a[q.M] = (a[q.M] || 0) + 1; return a; }, {}), tris:F.mesh ? Math.round(F.mesh.n / 3) : 0})); }, get gln(){ return Object.assign({diag:glDiag()}, GLN); }, get kitStat(){ return KST; }, tankPlace(t){ if (!GB) buildGear(); const G = GEO(t), d = G.deck || {y:G.gw, z:2}, sx = G.beam / 2; return potDeck(G, G.hauler || [sx * 0.92, d.y + 1, d.z - 1.3], sx, d, ((GB.px || {}).pot || {}).half || 0.7, t).tank; }, get dk(){ const now = performance.now() / 1000; return {ev:DKEV.map(e => ({kind:e.kind, who:e.who, for:e.for || null, age:+(now - e.t0).toFixed(2), chained:!!e.chained})), deck:DKDECK.length, lay:Object.keys(DKLAY).length, n:Object.assign({}, DKN)}; }, kitPart:(f, nm) => !!kit(f, nm), kitX, get anchl(){ return ANCHAL; }, get anc3(){ return {mode:ANC3.mode, Lg:+ANC3.Lg.toFixed(2), links:ANC3.links, splash:ANC3.splash}; }, jigRail:t => jigRail(t, GEO(t)), get jsms(){ return JSMS; }, lift:LIFT, bv, pota:POTA, get fps(){ return FPS.v; }, get cam(){ return cam; }, trawl(mode, at, hold){ TRAWL.mode = mode || null; TRAWL.t0 = performance.now() / 1000 - (at || 0); TRAWL.hold = hold ? at || 0 : null; return mode; }, seine(mode, at, hold){ SEINE.mode = mode || null; SEINE.t0 = performance.now() / 1000 - (at || 0); SEINE.hold = hold ? at || 0 : null; return mode; }, get seineNow(){ return seineState(performance.now() / 1000); }, get trawlNow(){ const st = trawlState(performance.now() / 1000); return TRAWL.mode ? Object.assign({mode:TRAWL.mode}, st) : null; }, get trk(){ const D = dynTrackView(); if (D) return D; return TRK && {s:TRK.s, v:TRK.v, vc:TRK.vc, end:TRK.end, sIn:TRK.sIn, back:TRK.back, turnL:TRK.turnL, done:TRK.done, stops:TRK.stops.map(q => q.s), P:TRK.P}; }, get peers(){ return npcNow.filter(n => n.player).map(n => ({id:n.id, vtype:n.vtype, t:n.K ? n.K.t : null, glass:!!(n.K && n.K.glass)})); }, get air(){ return airNow.map(a => ({kind:a.kind, w:a.w.map(Math.round)})); }, get airM(){ return !!(AIRM && AIRM.plane); }, get curFov(){ return curFov; }, cam, moundTop, bridgeInto, get statTris(){ return STAT ? STAT.n / 3 : 0; }, get vec(){ return {tiles:[...VEC.tiles.values()].map(t => ({k:t.k, bld:t.bld ? t.bld.n : 0, roads:t.roads.length, bridges:t.bridges.length, piers:t.piers.length, molos:t.molos.length, quays:t.quays.length, ms:Math.round(t.ms)})), statics:[...TST].map(([k, s]) => ({k, tris:s.tris, ms:Math.round(s.ms)})), chunks:CH.size}; }, moundInto, MB, haulModel, get haulA(){ return HAULA; }, gopHands:() => typeof workAssign === 'function' ? workAssign().filter(p => p.st === 'haling').length : 0, kinoNext(){ KINO.shot = null; }, get kino(){ const k = KINO.shot, e = KINO.eye, g = KINO.tgt; if (!k || !e) return null; const t = (performance.now() - T0) / 1000; return {type:k.type, up:e[1] - Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)), free:camFree(g, e), d:Math.hypot(e[0] - bv.x, e[2] - bv.z)}; }, get PLA(){ return PLA; }, get PCA(){ return PCA; }, set noPL(v){ NOPL = !!v; }, get beams(){ return BMN; }, glErr(){ return gl ? gl.getError() : -1; }, mastTop:t => mastTop(geoOf(t)), QUAL, qualTick, TERRW, get TERR(){ return TERR; }, get MIDM(){ return MIDM; }, RO, SSL, WV, WK, ssAt, seaH, waves:(dt, H) => updateWaves(dt, H), get sstVS(){ return SST_VS; }, get seaLvl(){ return seaLvl; }, get seaBasic(){ return !!(PS && PS.basic); }, get seaOne(){ return PSF === PS; }, get seaLite(){ return !!(PS && PS.lite); }, set seaDbg(v){ SEADBG = v; }, get drift(){ let c = 0; for (let i = 0; i < SDN; i++) if (SD.age[i] < SD.life[i]) c++; return c; }, get eye(){ return lastEye; }, camInside, camFree, get camPull(){ return camPull; }, get camLift(){ return camLift; }, get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, BUNKERS, nearestPlant, fkRun, legAt, terrH, terrRaw, unitModel, get UPATCH(){ return UPATCH; }, sitesNow, siteModel, onSite, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; lightsHere(e, 50).forEach(L => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(L, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }, get landMask(){ return LMON ? lcv : null; }, get maskMs(){ return LMMS; }, get coast3(){ return COAST3; }, meshH(x, z){ const M = FINEM && x > FINEM.x0 + 8 && x < FINEM.x0 + FINEM.sx - 8 && z > FINEM.z0 + 8 && z < FINEM.z0 + FINEM.sz - 8 ? FINEM : NEARM; return M ? nearSurf(M, x, z) : NaN; }, seaU(){ if (!PS) return null; gl.useProgram(PS.p); const g = n => PS.u[n] == null ? 'none' : gl.getUniform(PS.p, PS.u[n]); return {ls:g('uLSOn'), land:g('uLandS'), rect:g('uLRect') && Array.from(g('uLRect')), hOn:g('uHOn'), sOn:g('uSOn'), lmon:LMON, gr:!!GRECT, lt:!!LMTEX}; },  get FINEM(){ return FINEM; }, get seaNP(){ return NP; }, get dpr(){ return canvas ? canvas.width / Math.max(1, canvas.getBoundingClientRect().width) : 0; }}
  };
})();
