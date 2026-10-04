'use strict';
// ===== 3D VIEW (plain WebGL, no dependencies) =====
const G3 = (() => {
  const wrap = document.getElementById('mapwrap'), canvas = document.getElementById('gl'), labelsEl = document.getElementById('labels');
  let gl = null, ready = false, failed = false, active = false, raf = 0, lastF = 0;
  let PL, PS, PSF, PK, PP, SST_VS = false, SSDUMMY = null, SEADBG = false;
  let TERR, STAT, BOATM, CAPM, RODM, FLAGM, SKYQ, PATCH, FARQ, DYNP, DYNA;
  let HG = null, NEARM = null, MIDM = null, loading = false, LIGHTS = [], snowNow = -1;
  // Quality (phase K8 of the coast plan): 0 low, 1 medium, 2 high. 'auto' (the setting S.settings.q3d) steps down a level when the
  // frames have been slower than 28 a second for 4 s, and up when faster than 50 for 12 s, but not back up to a level it left within
  // the last two minutes. «#qfix» in the address (the tests) keeps it at high. Per level: the drawing's pixels (dpr), the near
  // terrain's reach, the terrain's shadows, the full sea shader beyond the wave patch, and the spray in the air.
  const QUAL = {lvl:2, bad:0, good:0, cap:2, capT:0, fix:/qfix/.test(location.hash), dpr:[1, 1.25, 1.5], near:[[3000, 6000], [6000, 12000], [6000, 12000]]};
  function qualSet(){ const v = S.settings.q3d || 'auto'; if (QUAL.fix) QUAL.lvl = 2; else if (v !== 'auto') QUAL.lvl = {low:0, mid:1, high:2}[v]; return v; }
  // one frame's step of the automatic quality (dt s, fps the frame rate); returns the level
  function qualTick(dt, fps, now){
    if (qualSet() !== 'auto' || QUAL.fix || !fps) return QUAL.lvl;
    // down after 4 s under 28 frames a second; up again after 8 s over 40, but not within 30 s of a step down (it went up after 12 s
    // over 50 and not within two minutes, which on the tablet never came, 03.10.2026)
    if (now - QUAL.capT > 30000) QUAL.cap = 2;
    if (fps < 28){ QUAL.bad += dt; QUAL.good = 0; if (QUAL.bad > 4 && QUAL.lvl > 0){ QUAL.cap = QUAL.lvl - 1; QUAL.capT = now; QUAL.lvl--; QUAL.bad = 0; } }
    else if (fps > 40){ QUAL.good += dt; QUAL.bad = 0; if (QUAL.good > 8){ if (QUAL.lvl < QUAL.cap) QUAL.lvl++; QUAL.good = 0; } }
    else QUAL.bad = QUAL.good = 0;
    return QUAL.lvl;
  }
  const T0 = performance.now(), DEG = Math.PI / 180;
  // «#no3d» in the address (the tests that do not look at 3D): everything runs as before, but no frame is drawn
  const NO3D = /no3d/.test(location.hash);
  const cam = {yaw:0.55, pitch:0.26, dist:21, helm:false, hy:0, hp:-0.07, fov:55};
  // the bound vessel's type when it has a model (vessel3d.js), else the skiff; GEO(t) is where things sit on it
  const vtype = () => (S.boat.type && VESSELS[S.boat.type] && (VGEO[S.boat.type] || vesselSpec(S.boat.type))) ? S.boat.type : 'skiff';
  const GEO = t => VGEO[t] || (VGEO[t] = geoOf(t)) || VGEO.skiff;
  let PERSONM = null, WILDM = null, NPCM = null, CREW2M = null, PT = null, GTEX = null, GRECT = null, STEX = null, SRECT = null, gcv = null, LMTEX = null, lcv = null, HTEX = null;
  // where things sit on each vessel (boat-local metres, bow towards -z)
  const VGEO = {skiff:{hand:true, open:true, beam:2.2, crewSpots:[[0.26, 0.32, 1.16, 0]], pl:2.4, rl:1.0, eye:[0, 1.86, 0.9], hp:-0.3, fov:62, pole:[-0.8, 1.95, 2.42], stern:3.1, bow:-2.2, side:0.75, gw:0.95, deck:{y:0.2, z:2.0}, lights:[[[-0.08, 1.04, -2.7], [1, 0.12, 0.1]], [[0.08, 1.04, -2.7], [0.1, 1, 0.35]], [[-0.8, 1.95, 2.42], [1, 0.95, 0.85]]]}};
  if (glbHas('skiff')){ const g = geoOf('skiff'); if (g && g.hand) VGEO.skiff = g; }      // the detailed starter boat (tools/boats/skiff59.py) brings its own places
  const bv = {x:0, y:0, z:0, head:0, pitch:0, roll:0, init:false};
  const env = {};
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const angDiff = (a, b) => ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

  // ---------- math ----------
  function persp(fovy, asp, n, f){ const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f); return new Float32Array([t / asp,0,0,0, 0,t,0,0, 0,0,(f + n) * nf,-1, 0,0,2 * f * n * nf,0]); }
  function viewDir(f, up){
    const l = Math.hypot(f[0], f[1], f[2]), zx = -f[0] / l, zy = -f[1] / l, zz = -f[2] / l;
    up = up || [0, 1, 0];
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; const lx = Math.hypot(xx, xy, xz) || 1; xx /= lx; xy /= lx; xz /= lx;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return {m:new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, 0,0,0,1]), R:[xx,xy,xz], U:[yx,yy,yz], F:[-zx,-zy,-zz]};
  }
  function mul(a, b){ const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function model(px, py, pz, yaw, pitch, roll){
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    return new Float32Array([cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr, 0,
      -cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr, 0,
      sy * cp, -sp, cy * cp, 0, px, py, pz, 1]);
  }
  const xf = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];

  // ---------- noise ----------
  function vn2(x, y, s){
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash(Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(s, 1274126177));
    return (h(ix, iy) * (1 - ux) + h(ix + 1, iy) * ux) * (1 - uy) + (h(ix, iy + 1) * (1 - ux) + h(ix + 1, iy + 1) * ux) * uy;
  }
  function fbm(x, y, o, s){ let v = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < o; i++){ v += a * vn2(x * f, y * f, s + i); t += a; a *= 0.5; f *= 2.03; } return v / t; }
  function ridged(x, y){ let v = 0, a = 0.5, f = 1, t = 0; for (let i = 0; i < 4; i++){ const n = 1 - Math.abs(2 * vn2(x * f, y * f, 40 + i) - 1); v += a * n * n; t += a; a *= 0.5; f *= 2.1; } return v / t; }
  function rng(seed){ return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---------- shaders ----------
  // Lights that light up round them at night (the user's wish 03.10.2026): up to 8 near ones (pickLights), relative to the eye like vW,
  // with their reach in w; each lights a surface by a smooth fall-off to nothing at its reach, more where it faces the light
  const PLG = '\n#define NPL 8\nuniform vec4 uPL[NPL];uniform vec3 uPC[NPL];uniform float uNPL;' +
    'vec3 pLit(vec3 p,vec3 n){vec3 s=vec3(0.0);for(int i=0;i<NPL;i++){if(float(i)>=uNPL)break;float R=uPL[i].w;if(R<=0.0)continue;vec3 L=uPL[i].xyz-p;float r2=dot(L,L);float a=max(0.0,1.0-r2/(R*R));' +
    'if(a<=0.0)continue;s+=uPC[i]*a*a*(0.2+0.8*max(dot(n,L*inversesqrt(r2+0.01)),0.0));}return s;}';
  const LIT_VS = 'attribute vec3 aPos;attribute vec3 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;gl_Position=uVP*w;}';
  const LIT_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;' +
    'uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uEmis;uniform vec4 uHole;uniform vec4 uOver;varying vec3 vW;varying vec3 vC;' + PLG +
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(dot(n,vW)>0.0)n=-n;float dif=max(dot(n,uSun),0.0);' +
    'vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 bc=mix(vC,uOver.rgb,uOver.a);vec3 c=bc*(amb+uSunCol*dif+pLit(vW,n))+bc*uEmis;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),1.0);}';
  const TER_VS = 'attribute vec3 aPos;attribute vec3 aCol;attribute vec3 aNor;attribute float aShd;uniform mat4 uVP;uniform mat4 uM;uniform vec3 uPO;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;vN=aNor;vP=aPos+uPO;vS=aShd;gl_Position=uVP*w;}';
  const NOISE = 'float hs(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),u.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),u.x),u.y);}';
  // The local sea (03b-sea.js) from the sea-state textures, n (32 x 32 over the near terrain) and w (128 x 128 over the whole map): R and G hold
  // the root of the fetch for the 10 degree sectors either side of the wind (blended by uSea2.z and .w), B how much of the ocean swell gets in.
  // uSea: wind-sea height per root-km of fetch (JONSWAP), WMO's open-sea height, the log of the fetch (km) where the sea is fully grown, the
  // open swell's height. uSea2: the overlap of the young and the grown wind-sea spectrum, the steepness, the sector blends. uLocal: the same
  // at the boat, for when there is no texture (NOSST: the far pass's vertices, and phones with no texture lookups in the vertex shader).
  // seaAt gives: the wind sea's height, the swell's height, how grown the sea is (0 young, 1 the open sea's spectrum), the root of the fetch.
  const SEA_STATE = 'uniform vec4 uSea;uniform vec4 uSea2;uniform vec4 uSSN;uniform vec4 uSSW;uniform vec4 uLocal;uniform float uGp[13];' +
    '\n#ifdef NOSST\nvec4 seaAt(vec2 P){return uLocal;}\n#else\nuniform sampler2D uSSTn;uniform sampler2D uSSTw;' +
    'vec4 seaAt(vec2 P){vec2 un=(P-uSSN.xy)*uSSN.z;vec2 uw=(P-uSSW.xy)*uSSW.z;vec4 tw=texture2D(uSSTw,uw);vec4 tn=texture2D(uSSTn,un);float r=mix(tw.r,tw.g,uSea2.w);float sf=tw.b;' +
    'float e=uSSN.w*smoothstep(0.0,0.06,min(min(un.x,un.y),min(1.0-un.x,1.0-un.y)));r=mix(r,mix(tn.r,tn.g,uSea2.z),e);sf=mix(sf,tn.b,e);r*=24.495;' +
    'vec4 L=vec4(min(uSea.y,uSea.x*r),uSea.w*sf,clamp(2.0*log(max(r,1.0))/uSea.z,0.0,1.0),r);return uSSW.w>0.5?L:uLocal;}\n#endif\n' +
    // a wave's amplitude here (the wind sea between its young and its grown spectrum, or the swell), and the slow wave groups
    'float ampOf(vec4 a,vec4 b,vec4 S){float dv=S.z;return b.x>0.5?S.y*a.w:S.x*(dv*a.w+(1.0-dv)*b.w)*inversesqrt(max(1.0-2.0*dv*(1.0-dv)*(1.0-uSea2.x),0.05));}' +
    'float grpOf(vec2 P,vec4 a,vec4 b,float gp){vec2 gd=vec2(a.y,-a.x);return 0.62+0.38*sin(dot(P,a.xy)*a.z*0.083+dot(P,gd)*a.z*0.041-b.y*uTime*0.5+gp);}' +
    // Gerstner steepness: the wind sea's crests sharpen with the wind; the swell is long and round
    'float steepOf(vec4 a,vec4 b,float am){return b.x>0.5?0.3:min(uSea2.y/(10.0*a.z*am+1e-4),1.0);}';
  // The boat's own waves (Kelvin, the 19.47 degree wedge). uWk0: the stern (x, z) and the heading (x, z); uWk1: k0 = g / v^2 (the transverse
  // wavelength is 2 pi v^2 / g), the wake's height, the share of transverse waves (they fade as the hull starts to plane), how far back
  // it reaches; uWk2: the hull's length, the bow wave's height, half the beam, the Froude number; uWk3: the bow and stern waves breaking,
  // the share drawn as geometry (only waves long enough for the 4 m grid), on. s: metres behind the stern, q: metres to the side.
  // Transverse waves fill the wedge and decay as 1/sqrt(s); the divergent waves (wave fronts at 35 degrees to the course, k = 1.5 k0) ride
  // the cusp lines and decay as s^-1/3; the bow wave climbs the stem and runs aft along each side at 25 degrees.
  const WAKE_GLSL = 'uniform vec4 uWk0;uniform vec4 uWk1;uniform vec4 uWk2;uniform vec4 uWk3;' +
    'float wakeH(vec2 P,float bow){if(uWk3.w<0.5)return 0.0;vec2 r=P-uWk0.xy;float s=-dot(r,uWk0.zw);float q=abs(r.x*uWk0.w-r.y*uWk0.z);float L=uWk2.x;' +
    'if(s<-L-2.0||s>uWk1.w||q>max(s,0.0)*0.42+L*0.6+4.0)return 0.0;float h=0.0;' +
    'if(s>0.0){float e=s*0.3536;float far=1.0-smoothstep(uWk1.w*0.55,uWk1.w,s);float a=uWk1.y*far;' +
    'h+=uWk1.z*a*inversesqrt(1.0+s/L)*cos(uWk1.x*s)*(1.0-smoothstep(e*0.75,e*1.02,q))*0.75;' +
    'h+=a*pow(1.0+s/L,-0.333)*sin(1.5*uWk1.x*(0.816*s+0.577*q))*exp(-pow((q-e)/(0.1*s+1.2),2.0));}' +
    'if(bow>0.5){float u=s+L;if(u>-0.5&&u<L*1.5){float lw=0.2+max(u,0.0)*0.466;h+=uWk2.y*exp(-pow((q-lw)/(0.35+max(u,0.0)*0.06),2.0))*exp(-max(u,0.0)/(0.6*L))*smoothstep(-0.5,0.3,u);}}' +
    'return h;}';
  // 13 waves: 0-9 the wind sea (longest first), 10-12 the swell
  const SEA_VS = 'precision highp float;attribute vec2 aXZ;uniform mat4 uVP;uniform vec2 uOrigin;uniform vec3 uOriginRel;uniform float uTime;uniform float uHalf;uniform float uFlat;uniform vec2 uScale;uniform float uCell;' +
    'uniform vec4 uWa[13];uniform vec4 uWb[13];varying vec3 vW;varying vec2 vXZ;' + SEA_STATE + WAKE_GLSL +
    'void main(){vec2 lxz=aXZ*uScale;vec2 wxz=uOrigin+lxz;vec3 d=vec3(0.0);' +
    'if(uFlat<0.5){float fade=1.0-smoothstep(0.6,1.0,max(abs(aXZ.x),abs(aXZ.y))/uHalf);vec4 S=seaAt(wxz);' +
    'for(int i=0;i<13;i++){vec4 a=uWa[i];vec4 b=uWb[i];float att=smoothstep(2.5,5.0,6.2832/(a.z*uCell));float am=ampOf(a,b,S);float Q=steepOf(a,b,am);am*=grpOf(wxz,a,b,uGp[i])*att;' +
    'float f=a.z*dot(a.xy,wxz)-b.y*uTime+b.z;float c=cos(f);d.x+=Q*am*a.x*c;d.z+=Q*am*a.y*c;d.y+=am*sin(f);}d*=fade;d.y+=wakeH(wxz,0.0)*uWk3.z;}' +
    'vec3 rel=uOriginRel+vec3(lxz.x,0.0,lxz.y)+d;vW=rel;vXZ=wxz;gl_Position=uVP*vec4(rel,1.0);}';
  // one wave's slope, height and lost roughness in the fragment shader (W: whether it counts for the wind sea's crests)
  const SEA_WAVE = W => '{vec4 a=uWa[i];vec4 b=uWb[i];float att=smoothstep(2.0,7.0,6.2832/(a.z*px));float am=ampOf(a,b,S);float gr=grpOf(P,a,b,uGp[i]);float Q=steepOf(a,b,am);' +
    'float f=a.z*dot(a.xy,P)-b.y*uTime+b.z;float c=cos(f);float s=sin(f);float wa=a.z*am*gr;N.x-=a.x*wa*c*att;N.z-=a.y*wa*c*att;N.y-=Q*wa*s*att;lost+=wa*wa*(1.0-att);' + (W ? 'y+=am*gr*s*att;sa+=am*am*0.228;' : '') + '}';
  // FAR (the far pass beyond the near terrain): the four longest wind waves and the swell, the rest of the wind sea only as roughness, no ripples
  const SEA_FS = '#extension GL_OES_standard_derivatives : enable\n#ifdef FAR\n#define NWIND 4\n#else\n#define NWIND 10\n#endif\nprecision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uDeep;' +
    'uniform float uTime;uniform float uWind;uniform vec2 uWindDir;uniform float uFlat;uniform float uSpec;uniform vec4 uWa[13];uniform vec4 uWb[13];uniform sampler2D uHgt;uniform float uHOn;uniform float uTideL;uniform vec4 uSRect;uniform float uSOn;uniform float uPx;uniform float uDbg;' + PLG +
    'varying vec3 vW;varying vec2 vXZ;' + NOISE + SEA_STATE + WAKE_GLSL +
    'void main(){float d=length(vW);vec2 P=vXZ;vec4 S=seaAt(P);' +
    // metres covered by one pixel here (grows with distance and grazing angle); a wave shorter than a few pixels is faded out and its slope becomes roughness instead
    'vec3 V=normalize(-vW);float px=d*uPx/max(abs(V.y),0.12);vec2 w=uWindDir;vec2 wp=vec2(-w.y,w.x);' +
    // gusts: slow patches of rougher and calmer water break up any repetition
    'vec2 Q=P+w*uTime*1.2;float gust=0.62+0.2*sin(dot(Q,vec2(0.0021,0.0013)))*sin(dot(Q,vec2(-0.0009,0.0024))+1.3)+0.12*sin(dot(Q,vec2(0.0047,-0.0031))+2.1)+0.08*sin(dot(Q,vec2(0.0019,0.0067))+4.0);' +
    // y and sa: the wind sea's height here and its variance, so the crest is in standard deviations whatever the spectrum
    'vec3 N=vec3(0.0,1.0,0.0);float y=0.0;float sa=1e-6;float lost=0.0;' +
    'for(int i=0;i<NWIND;i++)' + SEA_WAVE(true) +
    '\n#ifdef FAR\nfor(int i=4;i<10;i++){vec4 a=uWa[i];vec4 b=uWb[i];float wa=a.z*ampOf(a,b,S);lost+=wa*wa*0.456;}\n#endif\n' +
    'for(int i=10;i<13;i++)' + SEA_WAVE(false) +
    // ripples: eight short waves spread around the wind, analytic slopes (no grid), scaled by wind and gusts; in light air (Beaufort 0-1)
    // only in patches, the cat's paws, and glassy between them; near calm they are a third as steep as they were, since a mirror-like
    // sea shows every slope in its reflections and the sub-second ripples looked like the water shivering (the user, 03.10.2026)
    'float paw=mix(smoothstep(0.45,0.75,ns(P*0.013+w*uTime*0.5)),1.0,smoothstep(1.6,4.0,uWind));float ra=(0.0015+0.0042*min(uWind,2.0)+0.0034*max(uWind-2.0,0.0))*gust*paw;\n#ifdef FAR\nlost+=ra*ra*6.0;\n#else\n' +
    'for(int j=0;j<8;j++){float fj=float(j);float ang=(fj-3.5)*0.36+sin(fj*2.3)*0.2;vec2 dir=w*cos(ang)+wp*sin(ang);float L=1.1+fj*0.42+fract(fj*0.618)*0.9;float k=6.2832/L;float att=smoothstep(2.0,7.0,L/px);' +
    'float f=k*dot(dir,P)-sqrt(9.81*k+0.074*k*k*k/1025.0)*uTime+fj*1.9;float sl=ra*cos(f);N.x-=dir.x*sl*att;N.z-=dir.y*sl*att;lost+=sl*sl*(1.0-att)*0.5+ra*ra*0.5*(1.0-att);}\n#endif\n' +
    // the boat's own waves: their slopes (the short ones too, as shading), and the bow wave and the stern wave breaking white when steep
    'float wh=0.0;\n#ifndef FAR\nif(uFlat<0.5&&uWk3.w>0.5){wh=wakeH(P,1.0);float wx=wakeH(P+vec2(0.2,0.0),1.0);float wz=wakeH(P+vec2(0.0,0.2),1.0);float wl=smoothstep(1.0,4.0,6.2832/(uWk1.x*px));N.x-=(wx-wh)*5.0*wl;N.z-=(wz-wh)*5.0*wl;}\n#endif\n' +
    'N=normalize(N);float crest=y*inversesqrt(sa);float ndv=max(dot(N,V),0.0);float fr=0.02+0.98*pow(1.0-ndv,5.0);vec3 R=reflect(-V,N);R.y=abs(R.y);' +
    'vec3 sky=mix(uHor,uZen,pow(clamp(R.y,0.0,1.0),0.5));' +
    'vec3 body=uDeep*(uAmb*1.7+uSunCol*0.3*max(dot(N,uSun),0.0));' +
    'float sss=pow(max(dot(V,normalize(vec3(-uSun.x,0.3,-uSun.z))),0.0),3.0)*smoothstep(0.05,0.8,crest*0.25);body+=vec3(0.02,0.19,0.17)*sss*(uSunCol*0.9+uAmb*0.35);' +
    'vec3 col=mix(body,sky,fr);' +
    // sun glitter: sharp where the surface is resolved, a wider glitter path where the waves have become roughness
    'float rough=clamp(0.0015+lost,0.0015,0.25);float sp=clamp(2.0/rough,8.0,1200.0);float rs=max(dot(R,uSun),0.0);vec3 Hh=normalize(V+uSun);float Fs=0.02+0.98*pow(1.0-max(dot(Hh,V),0.0),5.0);' +
    'vec3 spec=uSunCol*pow(rs,sp)*(sp+2.0)*0.125*Fs*uSpec;col+=spec/(1.0+0.35*max(max(spec.r,spec.g),spec.b));' +
    // the lights at night: their glitter on the waves (the same roughness as the sun's), out to three times their reach, and a sheen
    '\n#ifndef FAR\nfloat spl=min(sp,240.0);for(int i=0;i<NPL;i++){if(float(i)>=uNPL)break;float Rl=uPL[i].w;if(Rl<=0.0)continue;vec3 Ll=uPL[i].xyz-vW;float r2=dot(Ll,Ll);vec3 Ln=Ll*inversesqrt(r2+0.01);' +
    'float ar=1.0/(1.0+r2/(Rl*Rl));float an=max(0.0,1.0-r2/(Rl*Rl));col+=uPC[i]*(pow(max(dot(R,Ln),0.0),spl)*(spl+2.0)*0.03*Fs*ar*(1.0-step(Rl*Rl*9.0,r2))+an*an*0.06);}\n#endif\n' +
    // whitecaps: the share of the sea that is white is Monahan and O'Muircheartaigh's (1980) W = 3.84e-6 U^3.41, where the sea has had
    // 0.2-3 km of fetch to break (dw). They sit on the highest crests, broken into patches a few metres long across the wind (the threshold is fitted to the measured spread of crest
    // and noise, through the normal quantile of that share),
    // and where they are too small to see they whiten the sea by their share instead.
    'vec3 fc=min(uAmb*1.3+uSunCol*0.85,vec3(1.0));float lod=1.0-smoothstep(0.35,1.6,px);float dw=smoothstep(0.45,1.73,S.w);' +
    'float Wc=clamp(3.84e-6*pow(max(uWind,0.3),3.41)*dw,1e-5,0.5);vec2 cq=vec2(dot(P,w),dot(P,wp));float fn=ns(cq*vec2(0.3,0.12)+vec2(uTime*0.25,0.0))*0.6+ns(cq*vec2(0.7,0.3)-vec2(uTime*0.4,uTime*0.1))*0.4;' +
    'float zt=sqrt(-2.0*log(Wc));zt-=(2.515517+0.802853*zt+0.010328*zt*zt)/(1.0+1.432788*zt+0.189269*zt*zt+0.001308*zt*zt*zt);float th=0.228+0.293*zt-0.016*zt*zt;' +
    // The edge is as wide as the pixel (fwidth), so it never steps or crawls, with a thin soft rim of older foam outside it; the mottle
    // inside fades to its mean before it gets smaller than a couple of pixels.
    'float fv=crest*0.25+fn*0.45;float aa=max(0.03,1.2*fwidth(fv));float core=smoothstep(th-aa,th+aa,fv);float mo=1.0-smoothstep(0.12,0.45,px);' +
    'float foam=(core+0.22*smoothstep(th-0.12-aa,th,fv)*(1.0-core))*lod*mix(0.78,0.55+0.45*ns(cq*vec2(1.7,0.9)+vec2(uTime*0.6,0.0)),mo);' +
    // streaks of foam along the wind from a near gale (Beaufort 7), denser in a gale and storm
    'vec2 st=vec2(dot(P,w)*0.011,dot(P,wp)*0.2);float sv=ns(st+vec2(uTime*0.03,ns(P*0.02)*3.0));float sq=max(0.08,1.2*fwidth(sv));foam+=smoothstep(0.88-sq,0.88+sq,sv)*smoothstep(13.9,20.8,uWind)*(0.35+0.4*smoothstep(20.8,28.5,uWind))*lod*dw;' +
    'col=mix(col,fc,Wc*(1.0-lod)*0.9+0.3*smoothstep(24.5,32.7,uWind)*dw);' +
    '\n#ifndef FAR\nif(uFlat<0.5&&uWk3.w>0.5&&wh>0.0){vec2 r=P-uWk0.xy;float s=-dot(r,uWk0.zw);float br=ns(P*1.4+vec2(uTime*1.3,0.0))*0.5+0.5;' +
    'foam=max(foam,uWk3.x*smoothstep(0.35,0.85,wh/max(uWk2.y,0.02))*step(-uWk2.x-0.5,s)*step(s,0.2)*br);' +
    'foam=max(foam,uWk3.y*smoothstep(0.45,0.9,wh/max(uWk1.y,0.02))*(1.0-smoothstep(0.0,6.2832/uWk1.x,s))*step(0.0,s)*br);}\n#endif\n' +
    // shallows and surf, the surf from the sea that reaches this shore
    'if(uSOn>0.5&&uHOn>0.5){vec2 su=(vW.xz-uSRect.xy)*uSRect.zw;if(su.x>0.0&&su.y>0.0&&su.x<1.0&&su.y<1.0){float ef=smoothstep(0.0,0.06,min(min(su.x,su.y),min(1.0-su.x,1.0-su.y)));' +
    'float hb=texture2D(uHgt,su*(255.0/256.0)+0.5/256.0).r*16.0-8.0;float dep=uTideL-hb;float hl=length(S.xy);' +
    'col=mix(col,vec3(0.07,0.33,0.32)*(uAmb*1.5+uSunCol*0.75),(1.0-smoothstep(0.3,5.0,dep))*0.42*(1.0-fr)*ef);' +
    'float bw=0.15+hl*0.9;float band=(1.0-smoothstep(0.0,bw,dep))*smoothstep(-0.2,0.02,dep);float sw=0.5+0.5*sin(uTime*0.9+dot(P,w)*0.06);' +
    'float ln=ns(P*0.32+vec2(uTime*0.35,-uTime*0.25))*0.6+ns(P*0.95-uTime*0.45)*0.4;' +
    'foam=max(foam,band*smoothstep(0.35,0.72,ln+band*0.2)*(0.3+0.7*clamp(hl*1.6,0.0,1.0))*(0.7+0.3*sw)*ef);}}' +
    'if(uDbg>0.5){gl_FragColor=vec4(vec3(clamp(foam,0.0,1.0)),1.0);return;}' +
    'col=mix(col,fc,clamp(foam,0.0,1.0)*0.85);float fg=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(col,uFog,fg),1.0);}';
  const TER_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform vec4 uHole;' +
    'uniform sampler2D uGround;uniform sampler2D uLand;uniform vec4 uGRect;uniform float uGOn;uniform float uLOn;uniform vec3 uSand;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;' + NOISE + PLG +
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec2 wp=mod(vP.xz,4096.0);float d=length(vW);float det=1.0-smoothstep(900.0,5000.0,d);' +
    'float b1=ns(wp*0.045)-0.5;float b2=ns(wp.yx*0.045+13.0)-0.5;float b3=ns(wp*0.011+5.0)-0.5;vec3 n=normalize(vN);float st=1.0-n.y;' +
    'n=normalize(n+vec3(b1*0.5+b3,0.0,b2*0.5-b3*0.6)*(0.2+st*0.7)*det);vec3 c=vC*(0.92+0.16*ns(wp*0.018+2.0));float h=vP.y;vec2 uv=(vW.xz-uGRect.xy)*uGRect.zw;float ins=step(0.0,uv.x)*step(0.0,uv.y)*step(uv.x,1.0)*step(uv.y,1.0);float ef=smoothstep(0.0,0.06,min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y)));' +
    'float sand=(1.0-smoothstep(1.0,3.6,h+b1*1.6))*step(0.05,h);c=mix(c,uSand,sand*0.8);' +
    'if(uGOn>0.5&&ins>0.5){vec4 g=texture2D(uGround,uv);c=mix(c,g.rgb,g.a*ef);}' +
    'float dif=max(dot(n,uSun),0.0)*mix(0.08,1.0,smoothstep(0.15,0.85,vS));vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 col=c*(amb+uSunCol*dif+pLit(vW,n));float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(col,uFog,f),1.0);}';
  const SKY_VS = 'attribute vec2 aP;varying vec2 vP;void main(){vP=aP;gl_Position=vec4(aP,0.9999,1.0);}';
  const SKY_FS = 'precision highp float;uniform vec3 uF;uniform vec3 uR;uniform vec3 uU;uniform vec2 uTan;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uSunD;uniform vec3 uSunCol;' +
    'uniform float uCloud;uniform float uTime;uniform float uStars;uniform float uAur;uniform float uDay;uniform vec2 uWindDir;uniform vec3 uMoonD;uniform float uMoonA;varying vec2 vP;' + NOISE +
    'void main(){vec3 d=normalize(uF+vP.x*uTan.x*uR+vP.y*uTan.y*uU);float h=clamp(d.y,0.0,1.0);vec3 col=mix(uHor,uZen,pow(h,0.55));' +
    'float sd=max(dot(d,uSunD),0.0);col+=uSunCol*(pow(sd,12.0)*0.35+smoothstep(0.9993,0.99965,sd)*2.5)*(1.0-uCloud*0.9);' +
    'if(uStars>0.01&&d.y>0.0){vec3 q=floor(d*420.0);vec3 r3=fract(mod(q,1024.0)*0.1031);r3+=dot(r3,r3.yzx+33.33);float s=fract((r3.x+r3.y)*r3.z);col+=vec3(step(0.9972,s))*uStars*(0.4+0.6*fract(s*97.0));}' +
    'if(uMoonA>0.01){float md=dot(d,uMoonD);float R=0.0095;if(md>cos(R*1.6)){vec3 up=abs(uMoonD.y)>0.99?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);vec3 rx=normalize(cross(up,uMoonD));vec3 ry=cross(uMoonD,rx);vec2 q=vec2(dot(d-uMoonD*md,rx),dot(d-uMoonD*md,ry))/R;float r2=dot(q,q);' +
    'if(r2<1.0){vec3 n=normalize(q.x*rx+q.y*ry-sqrt(1.0-r2)*uMoonD);float lit=smoothstep(-0.05,0.08,dot(n,uSunD));float mare=0.82+0.18*ns(q*3.0+7.0);col=mix(col,vec3(0.93,0.93,0.88)*mare*(0.06+0.94*lit),uMoonA*(1.0-uCloud*0.85));}' +
    'else col+=vec3(0.55,0.6,0.7)*uMoonA*0.06*exp(-(r2-1.0)*0.6)*(1.0-uCloud);}}' +
    'if(uAur>0.01&&d.y>0.02){vec2 sp=d.xz/(d.y+0.2)+32.0;float band=ns(vec2(sp.x*0.7+uTime*0.02,sp.y*0.22));float cur=ns(vec2(sp.x*5.0+band*4.0+uTime*0.08,0.5));' +
    'float a=smoothstep(0.32,0.8,band)*(0.35+0.65*cur)*smoothstep(0.02,0.14,d.y)*(1.0-smoothstep(0.4,0.9,d.y));col+=mix(vec3(0.1,0.95,0.45),vec3(0.6,0.2,0.75),smoothstep(0.18,0.65,d.y))*a*uAur*1.7;}' +
    'if(d.y>0.0){vec2 cp=d.xz/(d.y+0.08)*1.2+mod(uWindDir*uTime*0.004,64.0)+160.0;float c=ns(cp)*0.6+ns(cp*2.3)*0.3+ns(cp*5.1)*0.1;float cov=smoothstep(1.0-uCloud-0.05,1.0-uCloud+0.35,c);' +
    'vec3 cc=mix(uHor*0.85,vec3(0.9,0.92,0.95),0.35*uDay)*(0.3+0.7*uDay);col=mix(col,cc,cov*smoothstep(0.0,0.12,d.y)*0.95);}' +
    'gl_FragColor=vec4(col,1.0);}';
  const PT_VS = 'attribute vec3 aPos;attribute float aA;uniform mat4 uVP;uniform vec3 uOff;uniform float uSize;uniform float uPull;varying float vA;' +
    'void main(){vA=aA;vec3 r=aPos+uOff;r-=normalize(r+vec3(0.0,0.0,1e-4))*min(length(r)*0.5,uPull);vec4 p=uVP*vec4(r,1.0);gl_Position=p;gl_PointSize=clamp(uSize/max(p.w,0.1),1.0,48.0);}';
  const PT_FS = 'precision mediump float;uniform vec3 uCol;uniform float uRound;varying float vA;' +
    'void main(){float a=vA;if(uRound>0.5){vec2 c=gl_PointCoord-0.5;float r=dot(c,c);if(r>0.25)discard;a*=1.0-r*4.0;}gl_FragColor=vec4(uCol,a);}';

  function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function program(vs, fs, attrs){
    const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++){ const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return {p, u};
  }
  function buf(data, target, usage){ const b = gl.createBuffer(); target = target || gl.ARRAY_BUFFER; gl.bindBuffer(target, b); gl.bufferData(target, data, usage || gl.STATIC_DRAW); return b; }
  function attr(loc, b, size){ gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
  // World meshes keep their vertices relative to their own origin m.o ([x, z], metres), so Float32 holds them to the millimetre
  // anywhere in the country; the model matrix carries the origin less the eye, worked out in doubles (relM). The shaders get the
  // world from the render origin RO (a multiple of 4096 m near the eye), for the wave phases, the noise and the texture tiling.
  const relTo = (p, o) => { const P = new Float32Array(p); if (o) for (let i = 0; i < P.length; i += 3){ P[i] = p[i] - o[0]; P[i + 2] = p[i + 2] - o[1]; } return P; };
  const withOrigin = (m, o) => { if (o) m.o = o; return m; }, MESHMAX = 60000;
  const RO = {x:0, z:0, on:false}; let EYE = [0, 0, 0];
  const relM = m => model(m.o[0] - EYE[0], -EYE[1], m.o[1] - EYE[2], 0, 0, 0);
  const mapMid = () => [(HOME.x0 + HOME.x1) * 500, (HOME.y0 + HOME.y1) * 500];
  function upload(pos, col, idx){ const m = {pb:buf(pos), cb:buf(col), n:idx ? idx.length : pos.length / 3}; if (idx) m.ib = buf(idx, gl.ELEMENT_ARRAY_BUFFER); return m; }

  // ---------- mesh builder ----------
  function MB(){
    const p = [], c = [];
    const o = {p, c,
      tri(a, b, d, k){ p.push(a[0], a[1], a[2], b[0], b[1], b[2], d[0], d[1], d[2]); for (let i = 0; i < 3; i++) c.push(k[0], k[1], k[2]); },
      quad(a, b, d, e, k){ o.tri(a, b, d, k); o.tri(a, d, e, k); },
      box(cx, cy, cz, sx, sy, sz, k, ry, kTop){
        ry = ry || 0; const cr = Math.cos(ry), sr = Math.sin(ry), hx = sx / 2, hz = sz / 2;
        const Q = (x, y, z) => [cx + x * cr + z * sr, cy + y, cz - x * sr + z * cr];
        const v = [Q(-hx,0,-hz), Q(hx,0,-hz), Q(hx,0,hz), Q(-hx,0,hz), Q(-hx,sy,-hz), Q(hx,sy,-hz), Q(hx,sy,hz), Q(-hx,sy,hz)];
        o.quad(v[0], v[1], v[5], v[4], k); o.quad(v[1], v[2], v[6], v[5], k); o.quad(v[2], v[3], v[7], v[6], k); o.quad(v[3], v[0], v[4], v[7], k);
        o.quad(v[4], v[5], v[6], v[7], kTop || k); o.quad(v[3], v[2], v[1], v[0], k);
      },
      house(cx, cy, cz, w, l, hg, ry, wall, roof, pitch, cap){
        o.box(cx, cy, cz, w, hg, l, wall, ry);
        const cr = Math.cos(ry), sr = Math.sin(ry), Q = (x, y, z) => [cx + x * cr + z * sr, cy + y, cz - x * sr + z * cr];
        const hx = w / 2 + 0.4, hz = l / 2 + 0.4, top = hg + Math.min(w * (pitch || 0.38), cap || 99);
        const a = Q(-hx, hg, -hz), b = Q(hx, hg, -hz), d = Q(hx, hg, hz), e = Q(-hx, hg, hz), r1 = Q(0, top, -hz), r2 = Q(0, top, hz);
        o.quad(a, r1, r2, e, roof); o.quad(r1, b, d, r2, roof); o.tri(a, b, r1, wall); o.tri(e, r2, d, wall);
      },
      // flat rectangle on a wall: centre (x, yc, z), along (ux, uz)
      panel(x, yc, z, ux, uz, w, h, k){
        const hw = w / 2, hh = h / 2;
        o.quad([x - ux * hw, yc - hh, z - uz * hw], [x + ux * hw, yc - hh, z + uz * hw], [x + ux * hw, yc + hh, z + uz * hw], [x - ux * hw, yc + hh, z - uz * hw], k);
      },
      spire(cx, cy, cz, s, hg, k){
        const a = [cx - s, cy, cz - s], b = [cx + s, cy, cz - s], c = [cx + s, cy, cz + s], d = [cx - s, cy, cz + s], t = [cx, cy + hg, cz];
        o.tri(a, b, t, k); o.tri(b, c, t, k); o.tri(c, d, t, k); o.tri(d, a, t, k);
      },
      beam(A, B, r, k){
        const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], L = Math.hypot(d[0], d[1], d[2]), n = d.map(v => v / L);
        const up = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        let u = [n[1] * up[2] - n[2] * up[1], n[2] * up[0] - n[0] * up[2], n[0] * up[1] - n[1] * up[0]]; const ul = Math.hypot(u[0], u[1], u[2]); u = u.map(v => v / ul);
        const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
        const off = [0, 1, 2].map(i => { const a = i * 2 * Math.PI / 3; return [0, 1, 2].map(j => (u[j] * Math.cos(a) + w[j] * Math.sin(a)) * r); });
        for (let i = 0; i < 3; i++){ const j = (i + 1) % 3; o.quad([A[0] + off[i][0], A[1] + off[i][1], A[2] + off[i][2]], [B[0] + off[i][0], B[1] + off[i][1], B[2] + off[i][2]], [B[0] + off[j][0], B[1] + off[j][1], B[2] + off[j][2]], [A[0] + off[j][0], A[1] + off[j][1], A[2] + off[j][2]], k); }
      },
      // more than MESHMAX triangles go up in parts: one draw over 65 535 triangles stalled SwiftShader for seconds a frame (03.10.2026)
      mesh(o){ const n = p.length / 9; if (n <= MESHMAX) return withOrigin(upload(relTo(p, o), new Float32Array(c)), o);
        const parts = []; for (let a = 0; a < n; a += MESHMAX){ const b = Math.min(n, a + MESHMAX); parts.push(withOrigin(upload(relTo(p.slice(a * 9, b * 9), o), new Float32Array(c.slice(a * 9, b * 9))), o)); } return {parts, n:n * 3, o}; }
    };
    return o;
  }

  // ---------- terrain ----------
  const SNOWLINE = [0,0,0,150,350,650,900,1000,850,450,120,0];
  // real ground height (m) at world x/z (m); sea floor is shaped from shore distance and exposure; where a harbour unit stands, its
  // ground (unitTerr)
  function terrRaw(x, z){
    if (x < MAPB.x0 * 1000 || z < MAPB.y0 * 1000 || x > MAPB.x1 * 1000 || z > MAPB.y1 * 1000) return -40;
    // the tiles' ground (25 m) where they have it and it is in; else the far heights (200 m, phase K8) held to the national core's
    // 200 m land, which the simulation sails by off the tiles (land at least a little above the sea, the sea a little below); else
    // a flat stand-in from that land until the far pack comes
    let h;
    h = HG ? tileH(MAPD.L.hgt, 'view', x, z) : NaN;
    if (h !== h){ const m = rbilM(MAPD.L.land200, x, z); h = HG ? tileH(MAPD.L.far, 'far', x, z) : NaN; if (h !== h) h = m >= 0.5 ? 2 : -4; h = m >= 0.5 ? Math.max(h, 0.3 + (m - 0.5) * 6) : Math.min(h, -0.5 - (0.5 - m) * 8); }
    return h > -3 && harbourNear(x, z) && inHarbourPocket({x:x / 1000, y:z / 1000}) ? -3 : h;   // the water in front of a quay (01-world.js)
  }
  // a height layer (the tiles' ground 'view', the far heights 'far') at x, z (m) between the four nearest cells, or NaN where a cell is
  // off the layer or its tile has no pack of that kind or it is not in yet: the edges of the tiles, and before the pack comes, so the
  // view never reads a block that is not there. A tile whose pack is in is remembered.
  // (a number for the key and the last tile kept per kind: the string keys cost more than the lookups they guarded)
  const TIN = new Set(), TLAST = {view:NaN, far:NaN};
  function tileIn(kind, tx, ty){ const k = (kind === 'far' ? 1e7 : 0) + tx * 4096 + ty; if (TLAST[kind] === k || TIN.has(k)){ TLAST[kind] = k; return true; } const pk = MAPD.byTile.get(kind + ':' + tx + ':' + ty); if (pk && pk.buf){ TIN.add(k); TLAST[kind] = k; return true; } return false; }
  function tileH(L, kind, x, z){
    const cm = L.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, ct = Math.round(MAPD.man.tile / L.c);
    if (ix < L.ix0 || iz < L.iy0 || ix + 1 >= L.ix0 + L.nx || iz + 1 >= L.iy0 + L.ny) return NaN;
    const a0 = Math.floor(ix / ct), a1 = Math.floor((ix + 1) / ct), b0 = Math.floor(iz / ct), b1 = Math.floor((iz + 1) / ct);
    if (!tileIn(kind, a0, b0) || (a1 !== a0 && !tileIn(kind, a1, b0)) || (b1 !== b0 && (!tileIn(kind, a0, b1) || !tileIn(kind, a1, b1)))) return NaN;
    return ((rcell(L, ix, iz) * (1 - fx) + rcell(L, ix + 1, iz) * fx) * (1 - fz) + (rcell(L, ix, iz + 1) * (1 - fx) + rcell(L, ix + 1, iz + 1) * fx) * fz) * L.k;
  }
  function terrH(x, z){ return unitTerr(x, z, terrRaw(x, z)); }
  // The ground round a harbour unit (UNITS, 01-world.js), in its frame (lx along the face, lz out to the water): the basin in front is
  // dredged to 6.6 m below mean sea level and rises 1 in 2 outside it; beside and behind the quay land higher than the deck is cut down
  // to it and goes back to what it was within UNIT_REACH m (nothing is filled, so nothing sticks out into the water); the seabed reaches
  // the walls' foot (9 m down). Inside
  // the block nothing is drawn (the fine patch has a hole there). h0 is the ground without the unit.
  const UNIT_REACH = 22, UNIT_FINE = UNIT_REACH + 50;
  function unitTerr(x, z, h0){
    if (!harbourNear(x, z)) return h0;
    for (const U of UNITA){
      if (Math.abs(x - U.o[0]) > 140 || Math.abs(z - U.o[1]) > 140) continue;
      const [lx, lz] = unitL(U, x, z), ax = Math.abs(lx), dx = Math.max(0, ax - UNIT.E), dzB = Math.max(0, -UNIT.B - lz);
      if (lz >= 0){
        const dO = Math.hypot(Math.max(0, ax - UNIT.basinX), Math.max(0, lz - UNIT.basinZ)); if (dO >= UNIT_REACH) continue;
        let h = Math.min(h0, -UNIT.dredge + 0.5 * dO); if (lz < 6 && dx < 3) h = Math.max(h, UNIT.bot);
        return h + (h0 - h) * sstep(UNIT_REACH - 8, UNIT_REACH, dO);
      }
      if (!dx && !dzB) return UNIT.bot;
      const d = Math.hypot(dx, dzB); if (d >= UNIT_REACH) continue;
      let h = h0;
      h = Math.min(h0, QTOP - 0.1 + 0.45 * d);
      if (d < 3) h = Math.max(h, UNIT.bot);
      return h + (h0 - h) * sstep(UNIT_REACH - 8, UNIT_REACH, d);
    }
    return h0;
  }
  // the coarse terrain sinks out of sight where a unit's fine patch takes over (unitPatch draws it)
  function terrCoarse(x, z){
    const h0 = terrRaw(x, z);
    if (!harbourNear(x, z)) return h0;
    for (const U of UNITA){ if (Math.abs(x - U.o[0]) > 140 || Math.abs(z - U.o[1]) > 140) continue;
      const [lx, lz] = unitL(U, x, z), ax = Math.abs(lx);
      const d = lz >= 0 ? Math.hypot(Math.max(0, ax - UNIT.basinX), Math.max(0, lz - UNIT.basinZ)) : Math.hypot(Math.max(0, ax - UNIT.E), Math.max(0, -UNIT.B - lz));
      if (d < UNIT_REACH) return -14; }
    return h0;
  }
  // share of forest around a point: bilinear over the 50 m forest cells, softened over the neighbours
  function forestAt(x, z){
    if (!HG) return 0;
    const LF = MAPD.L.forest, cm = LF.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz; let s = 0;
    const ct = Math.round(MAPD.man.tile / LF.c), tx = Math.floor((ix - 1) / ct), tz = Math.floor((iz - 1) / ct);
    // the 4 x 4 cells in one tile (nearly always): its pack is asked once; at a tile's edge, cell by cell
    const one = tx === Math.floor((ix + 2) / ct) && tz === Math.floor((iz + 2) / ct) && mapIn(LF, ix - 1, iz - 1) && mapIn(LF, ix + 2, iz + 2);
    if (one && !tileIn('view', tx, tz)) return 0;
    if (!one && !mapViewIn({x:x / 1000, y:z / 1000})) return 0;
    const F = one ? (c, r) => rcell(LF, c, r) : (c, r) => (!mapIn(LF, c, r) || !tileIn('view', Math.floor(c / ct), Math.floor(r / ct))) ? 0 : rcell(LF, c, r);
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++){ const wx = dx <= 0 ? (dx === 0 ? 1 - fx * 0.5 : 0.5 - fx * 0.5) : (dx === 1 ? 0.5 + fx * 0.5 : fx * 0.5), wz = dz <= 0 ? (dz === 0 ? 1 - fz * 0.5 : 0.5 - fz * 0.5) : (dz === 1 ? 0.5 + fz * 0.5 : fz * 0.5); s += F(ix + dx, iz + dz) * wx * wz; }
    return clamp(s / 2.25, 0, 1);
  }
  // A mesh is built in three parts so it can be done a few rows a frame (meshTask): the heights row by row, then the normals, the
  // indices and the buffers at once. makeMesh does it all in one go.
  function meshBegin(x0, z0, sx, sz, n, hf){
    const N = n * n;
    return {x0, z0, sx, sz, n, hf:hf || terrH, dx:sx / (n - 1), dz:sz / (n - 1), j:0, pos:new Float32Array(N * 3), h:new Float32Array(N), nz:new Float32Array(N), fo:new Float32Array(N)};
  }
  function meshRows(B, until){
    const {x0, z0, n, dx, dz, hf, pos, h, nz, fo} = B;
    while (B.j < n){
      const j = B.j++;
      for (let i = 0; i < n; i++){
        const k = j * n + i, x = x0 + i * dx, z = z0 + j * dz, y = hf(x, z);
        h[k] = y; pos[k * 3] = i * dx; pos[k * 3 + 1] = y; pos[k * 3 + 2] = j * dz; nz[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z);
      }
      if (performance.now() > until) break;
    }
    return B.j >= n;
  }
  function meshEnd(B){
    const {x0, z0, sx, sz, n, dx, dz, pos, h, nz, fo} = B, N = n * n, slope = new Float32Array(N), nor = new Float32Array(N * 3);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, hx = (h[j * n + Math.min(n - 1, i + 1)] - h[j * n + Math.max(0, i - 1)]) / (2 * dx), hz = (h[Math.min(n - 1, j + 1) * n + i] - h[Math.max(0, j - 1) * n + i]) / (2 * dz);
      slope[k] = Math.hypot(hx, hz); const nl = Math.hypot(hx, 1, hz); nor[k * 3] = -hx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -hz / nl;
    }
    const idx = new Uint16Array((n - 1) * (n - 1) * 6); let q = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++){ const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    const col = new Float32Array(N * 3), m = {pb:buf(pos), cb:buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), nb:buf(nor), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, h, nz, slope, fo, col, x0, z0, sx, sz, pos, nor, gn:n, o:[x0, z0], sh:new Float32Array(N).fill(1)}; m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.shKey = '';
    recolor(m, snowNow < 0 ? 0 : snowNow);
    return m;
  }
  function makeMesh(x0, z0, sx, sz, n, hf){ const B = meshBegin(x0, z0, sx, sz, n, hf); meshRows(B, Infinity); return meshEnd(B); }
  function freeMesh(m){ if (m.parts){ m.parts.forEach(freeMesh); return; } gl.deleteBuffer(m.pb); gl.deleteBuffer(m.cb); gl.deleteBuffer(m.ib); if (m.nb) gl.deleteBuffer(m.nb); if (m.sb) gl.deleteBuffer(m.sb); }
  // the near terrain's own surface at x, z (its triangles over the ground without the units), so a fine patch meets it exactly
  function nearSurf(M, x, z){
    const n = M.gn, d = M.sx / (n - 1), gx = clamp((x - M.x0) / d, 0, n - 1.001), gz = clamp((z - M.z0) / d, 0, n - 1.001), i = Math.floor(gx), j = Math.floor(gz), fx = gx - i, fz = gz - j;
    const X = i * d + M.x0, Z = j * d + M.z0, H = (a, b) => terrRaw(X + a * d, Z + b * d);
    return fx + fz <= 1 ? H(0, 0) + (H(1, 0) - H(0, 0)) * fx + (H(0, 1) - H(0, 0)) * fz : H(1, 1) + (H(0, 1) - H(1, 1)) * (1 - fx) + (H(1, 0) - H(1, 1)) * (1 - fz);
  }
  // The fine ground round a harbour unit: a grid in the unit's frame, lined up with the quay's walls (1.6-4 m apart), with a hole
  // where the block stands. Its outer part lies on the near terrain's own triangles, so the two meet; the near terrain sinks under it
  // (terrCoarse), and it is drawn with a little offset so it wins where they coincide. Rebuilt with the near terrain.
  let UPATCH = [];
  function unitPatch(U, M){
    const E = UNIT.E, B = UNIT.B, F = UNIT_FINE, span = (a, b, k) => Array.from({length:k + 1}, (_, i) => a + (b - a) * i / k);
    const xs = [...span(-E - F, -E, 18), ...span(-E, E, 34).slice(1), ...span(E, E + F, 18).slice(1)], zs = [...span(-B - F, -B, 22), ...span(-B, 0, 14).slice(1), ...span(0, UNIT.basinZ + F, 34).slice(1)];
    const n = xs.length, N = n * n, pos = new Float32Array(N * 3), h = new Float32Array(N), nzA = new Float32Array(N), slope = new Float32Array(N), nor = new Float32Array(N * 3), fo = new Float32Array(N);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, w = unitW(U, xs[i], zs[j]), x = w[0], z = w[1], y = unitTerr(x, z, nearSurf(M, x, z));
      h[k] = y; pos[k * 3] = x - U.o[0]; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z - U.o[1]; nzA[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(n - 1, j + 1);
      const hx = (h[j * n + i1] - h[j * n + i0]) / (xs[i1] - xs[i0]), hz = (h[j1 * n + i] - h[j0 * n + i]) / (zs[j1] - zs[j0]);
      slope[k] = Math.hypot(hx, hz); const wx = -hx * U.u[0] - hz * U.n[0], wz = -hx * U.u[1] - hz * U.n[1], nl = Math.hypot(wx, 1, wz); nor[k * 3] = wx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = wz / nl;
    }
    const idx = []; for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++){
      if (xs[i] >= -E - 1e-6 && xs[i + 1] <= E + 1e-6 && zs[j] >= -B - 1e-6 && zs[j + 1] <= 1e-6) continue;   // the quay's own block
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, b, b, c, d); }
    const col = new Float32Array(N * 3), m = {pb:buf(pos), cb:buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), nb:buf(nor), ib:buf(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER), n:idx.length, h, nz:nzA, slope, fo, col, pos, nor, gn:n, unit:U.id, o:[U.o[0], U.o[1]], sh:new Float32Array(N).fill(1)};
    m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.shKey = '';
    recolor(m, snowNow < 0 ? 0 : snowNow);
    return m;
  }
  function buildPatches(){
    for (const m of UPATCH) freeMesh(m); UPATCH = [];
    if (!NEARM) return;
    for (const U of UNITA) if (U.o[0] > NEARM.x0 + 200 && U.o[0] < NEARM.x0 + NEARM.sx - 200 && U.o[1] > NEARM.z0 + 200 && U.o[1] < NEARM.z0 + NEARM.sz - 200) UPATCH.push(unitPatch(U, NEARM));
  }
  // The far terrain: a window of TERRW.span round the boat (phase K8; it was Senja's square), on a grid of TERRW.snap, built again when
  // the boat is TERRW.move from its middle or new packs have come; the far sea and the wide sea-state map follow it
  const TERRW = {span:100000, snap:10000, move:20000};
  function buildTerrain(){
    const p = bv.x || bv.z ? {x:bv.x, z:bv.z} : {x:S.boat.pos.x * 1000, z:S.boat.pos.y * 1000}, cx = Math.round(p.x / TERRW.snap) * TERRW.snap, cz = Math.round(p.z / TERRW.snap) * TERRW.snap;
    const old = TERR;
    TERR = makeMesh(cx - TERRW.span / 2, cz - TERRW.span / 2, TERRW.span, TERRW.span, 255); TERR.cx = cx; TERR.cz = cz; shSeed(TERR, old); if (old) freeMesh(old);
  }
  // the packs the view needs round the boat: the far heights over the far terrain's window, the tiles' ground (and forest) over the
  // middle terrain's; when they come the meshes over them are built again. Asked at most every 2 s.
  let streamT = -1e9;
  function stream3d(){
    const now = performance.now(); if (now - streamT < 2000) return; streamT = now;
    const x = bv.x / 1000, z = bv.z / 1000, F = TERRW.span / 2000 + 10, V = 14;
    for (const [kind, R] of [['far', F], ['view', V], ['vec', V]]) for (const pk of mapPacksIn(kind, x - R, z - R, x + R, z + R)){
      if (pk.buf || pk.want3d) continue; pk.want3d = true;
      mapLoad(pk).then(() => { pk.want3d = false; if (kind === 'vec') vecTile(pk.tile[0], pk.tile[1]); else staleOver(pk); }, e => { pk.want3d = false; console.error(e); });
    }
    for (const pk of mapPacksIn('vec', x - V, z - V, x + V, z + V)) if (pk.buf) vecTile(pk.tile[0], pk.tile[1]);
    vecPrune([{x, y:z}, {x:lastEye[0] / 1000, y:lastEye[2] / 1000}]);
    tileStatics();
  }
  // ---------- the coast's packs (01c-vec.js, part 4 of the coast-wide plan): buildings, roads, bridges, piers and breakwaters ----------
  // When a tile comes in (decoded in the worker), the 1 km chunks on it are built again with its buildings and roads. Its bridges, piers
  // and breakwaters go into a mesh of its own once its heights are in (a deck must start from the real ground), a few at a time in each
  // frame's spare milliseconds (tileStep; Tromsø's tile was half a second at once). All of it goes when the tile is let go (vecPrune).
  const TST = new Map(); let TJOB = null;
  const tileOf = key => { const T = MAPD.man ? MAPD.man.tile : 50; return Math.floor(gridKeyX(key) / T) + ':' + Math.floor(gridKeyY(key) / T); };
  VEC.came.push(t => { for (const [k, c] of CH) if (tileOf(k) === t.k){ freeChunk(c); CH.delete(k); } });
  function tileStatics(){
    if (TJOB) return;
    for (const t of VEC.tiles.values()){
      if (TST.has(t.k)) continue;
      const vp = MAPD.byTile.get('view:' + t.k); if (vp && !vp.buf) continue;
      const items = [...t.piers.map(q => m => pierInto(m, q, t.k)), ...t.slabs.map(pts => m => slabInto(m, pts, t.k)), ...t.molos.map((pts, i) => m => stonesOf(TJOB.stones, sm => moundInto(m, pts, (t.tx * 31 + t.ty) * 7919 + i * 104729, false, t.k, sm))), ...t.bridges.map(br => m => bridgeInto(m, br, t.k))];
      TJOB = {t, m:MB(), items, i:0, ms:0, stones:[]}; return;
    }
  }
  function tileStep(){
    const J = TJOB; if (!J) return;
    if (!VEC.tiles.has(J.t.k)){ TJOB = null; return; }   // let go meanwhile
    const t0 = performance.now(), end = t0 + MESHMS[QUAL.lvl];
    while (J.i < J.items.length && performance.now() < end) J.items[J.i++](J.m);
    J.ms += performance.now() - t0;
    if (J.i < J.items.length) return;
    const m = J.m, t = J.t; TJOB = null;
    TST.set(t.k, {mesh:m.p.length ? m.mesh([t.x0 + 25000, t.z0 + 25000]) : null, stones:J.stones, ms:J.ms, tris:m.p.length / 9});
    // the roads on its breakwaters' crests: the chunks under them built again
    for (const [k, l] of MOLOH) if (CH.has(k) && l.some(M => M.tag === t.k)){ freeChunk(CH.get(k)); CH.delete(k); }
  }
  VEC.drop.push(t => {
    const s = TST.get(t.k); if (s && gl){ if (s.mesh) freeMesh(s.mesh); for (const q of s.stones) freeMesh(q.mesh); } TST.delete(t.k);
    if (TJOB && TJOB.t === t && gl) for (const q of TJOB.stones) freeMesh(q.mesh); if (TJOB && TJOB.t === t) TJOB = null; camDropTag(t.k);
    for (const [k, l] of MOLOH){ const b = l.filter(M => M.tag !== t.k); if (b.length) MOLOH.set(k, b); else MOLOH.delete(k); }
    for (const k of [...CAMBLD]) if (typeof k === 'string' && tileOf(+k.slice(1)) === t.k) CAMBLD.delete(k);
    for (const [k, c] of CH) if (tileOf(k) === t.k){ freeChunk(c); CH.delete(k); }
  });
  function drawTileStatics(TM, eye){ drawStones(STONES, TM, eye); for (const s of TST.values()){ if (s.mesh) drawLit(s.mesh, TM); drawStones(s.stones, TM, eye); } }
  // One terrain mesh is rebuilt at a time, a few rows a frame (MESHMS ms; the near, middle and far meshes were each built in one
  // frame, all three whenever a pack came anywhere, 03.10.2026): the old mesh is drawn until the new one is done. A mesh that does not
  // cover the boat at all (a jump, the first build) is built at once.
  let MJOB = null;
  const MESHMS = [3, 4, 5];
  function meshTask(kind, cur, x0, z0, span, n, hf, done){
    const covers = cur && bv.x > cur.x0 && bv.x < cur.x0 + cur.sx && bv.z > cur.z0 && bv.z < cur.z0 + cur.sz;
    if (!covers){ if (MJOB && MJOB.kind === kind) MJOB = null; done(makeMesh(x0, z0, span, span, n, hf), false); return; }
    if (MJOB && MJOB.kind === kind && MJOB.B.x0 === x0 && MJOB.B.z0 === z0 && MJOB.B.sx === span) return;   // on its way
    // one on its way that will still have the boat well inside is let finish (started again at every new spot of a moving boat it
    // never finished, and the mesh then jumped kilometres at once when she left the old one, and the sea map with it)
    if (MJOB && MJOB.kind === kind){ const B = MJOB.B, m = span * 0.2; if (B.sx === span && bv.x > B.x0 + m && bv.x < B.x0 + span - m && bv.z > B.z0 + m && bv.z < B.z0 + span - m) return; }
    if (MJOB && MJOB.kind !== kind) return;   // another mesh is being built: this one waits its turn
    MJOB = {kind, B:meshBegin(x0, z0, span, span, n, hf), done, dirty:false};
  }
  let FRAMEMS = 16;
  function meshStep(){
    const J = MJOB; if (!J) return;
    // a share of the frame: when the frames are slow anyway the mesh keeps pace with the boat (at most 30 % of a frame, 60 ms)
    if (!meshRows(J.B, performance.now() + Math.max(MESHMS[QUAL.lvl], Math.min(60, 0.3 * FRAMEMS)))) return;
    MJOB = null; J.done(meshEnd(J.B), J.dirty);
  }
  // a pack has come: the meshes over its tile are built again (one being built over it goes again when it is done)
  function staleMesh(kind){ const m = kind === 'near' ? NEARM : kind === 'mid' ? MIDM : TERR; if (m) m.stale = true; if (MJOB && MJOB.kind === kind) MJOB.dirty = true; }
  function staleOver(pk){
    const T = MAPD.man.tile * 1000, x0 = pk.tile[0] * T, z0 = pk.tile[1] * T;
    for (const [m, kind] of [[NEARM, 'near'], [MIDM, 'mid'], [TERR, 'far']]){
      if (MJOB && MJOB.kind === kind){ const B = MJOB.B; if (B.x0 < x0 + T && B.x0 + B.sx > x0 && B.z0 < z0 + T && B.z0 + B.sz > z0) MJOB.dirty = true; }
      if (m && m.x0 < x0 + T && m.x0 + m.sx > x0 && m.z0 < z0 + T && m.z0 + m.sz > z0) m.stale = true;
    }
  }
  function updateFar(){
    if (TERR && !TERR.stale && Math.abs(bv.x - TERR.cx) < TERRW.move && Math.abs(bv.z - TERR.cz) < TERRW.move) return;
    const cx = Math.round(bv.x / TERRW.snap) * TERRW.snap, cz = Math.round(bv.z / TERRW.snap) * TERRW.snap;
    meshTask('far', TERR, cx - TERRW.span / 2, cz - TERRW.span / 2, TERRW.span, 255, null, (M, dirty) => { const old = TERR; TERR = M; TERR.cx = cx; TERR.cz = cz; TERR.stale = dirty; shSeed(TERR, old); if (old) freeMesh(old); });
  }
  // sharp terrain in a 6 km corridor around the boat, rebuilt as it moves. The shadows are marched towards the sun in time slices
  // (SHMS ms a frame: 7 000 points a frame stalled the user's tablet for a third of a second, 03.10.2026): the fine ground near the
  // point, farther out the middle and far meshes' own heights, which are already in memory; ground under the sea is not marched.
  let shT = 0;
  const SHMS = [2, 3, 4];
  function meshH(m, x, z){
    const n = m.gn, d = m.sx / (n - 1), gx = (x - m.x0) / d, gz = (z - m.z0) / d; if (!(gx >= 0 && gz >= 0 && gx < n - 1 && gz < n - 1)) return NaN;
    const i = gx | 0, j = gz | 0, fx = gx - i, fz = gz - j, h = m.h, k = j * n + i;
    return (h[k] * (1 - fx) + h[k + 1] * fx) * (1 - fz) + (h[k + n] * (1 - fx) + h[k + n + 1] * fx) * fz;
  }
  function shadeH(x, z, dd){ if (dd < 400) return terrH(x, z); let h = MIDM && !MIDM.stale ? meshH(MIDM, x, z) : NaN; if (h !== h && TERR) h = meshH(TERR, x, z); return h === h ? h : terrH(x, z); }
  // a new mesh starts with the shadows of the one it replaces where they overlap, so they do not flash while they are worked out
  function shSeed(m, old){
    if (!old || !old.sh || typeof old.x0 !== 'number' || old.gn === undefined) return;
    const n = m.gn, d = m.sx / (n - 1), on = old.gn, od = old.sx / (on - 1);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const gx = (m.x0 + i * d - old.x0) / od, gz = (m.z0 + j * d - old.z0) / od; if (!(gx >= 0 && gz >= 0 && gx <= on - 1 && gz <= on - 1)) continue;
      m.sh[j * n + i] = old.sh[Math.round(gz) * on + Math.round(gx)];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.sb); gl.bufferData(gl.ARRAY_BUFFER, m.sh, gl.DYNAMIC_DRAW);
  }
  function updateShadows(){
    // the sun's direction in steps of 0.03 (it moved 0.01 every 20 s of play at 6x time, and each step started all the meshes again)
    const d = QUAL.lvl ? env.shadowDir : null, key = d ? d.map(v => (Math.round(v / 0.03) * 0.03).toFixed(2)).join(',') : 'flat';   // no shadows on low quality
    const until = performance.now() + SHMS[QUAL.lvl];
    for (const m of [NEARM, ...UPATCH, MIDM, TERR]){
      if (!m) continue;
      if (m.shKey !== key && !m.shJob && performance.now() - shT > 1500){ m.shJob = {i:0, key, d}; shT = performance.now(); }
      if (!m.shJob) continue;
      const J = m.shJob, N = m.gn * m.gn;
      if (!J.d || J.d[1] <= 0.005){ m.sh.fill(J.d ? 0 : 1, J.i, N); J.i = N; }
      else {
        const hl = Math.hypot(J.d[0], J.d[2]) || 1e-6, dx = J.d[0] / hl, dz = J.d[2] / hl, tE = J.d[1] / hl, far = m === TERR ? 25000 : 9000, st0 = m === TERR ? 160 : m === MIDM ? 60 : 25;
        let k = J.i;
        while (k < N){
          const end = Math.min(N, k + 24);
          for (; k < end; k++){
            const y0 = m.pos[k * 3 + 1]; if (y0 < -1){ m.sh[k] = 1; continue; }
            const x = m.o[0] + m.pos[k * 3], z = m.o[1] + m.pos[k * 3 + 2], y = Math.max(y0, 0) + 2; let lit = 1, dd = st0;
            while (dd < far){ const over = shadeH(x + dx * dd, z + dz * dd, dd) - (y + dd * tE); if (over > 0){ lit = over > 8 ? 0 : 0.35; if (!lit) break; } dd += st0 + dd * 0.07; }
            m.sh[k] = lit;
          }
          if (performance.now() > until) break;
        }
        J.i = k;
      }
      if (J.i >= N){ gl.bindBuffer(gl.ARRAY_BUFFER, m.sb); gl.bufferData(gl.ARRAY_BUFFER, m.sh, gl.DYNAMIC_DRAW); m.shKey = J.key; m.shJob = null; }
      break;   // one mesh per frame
    }
  }
  function updateMid(){
    const span = 22000, snap = 2000, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (MIDM && !MIDM.stale && Math.abs(cx - MIDM.cx) < 3000 && Math.abs(cz - MIDM.cz) < 3000) return;
    meshTask('mid', MIDM, cx - span / 2, cz - span / 2, span, 256, null, (M, dirty) => { const old = MIDM; MIDM = M; MIDM.cx = cx; MIDM.cz = cz; MIDM.stale = dirty; shSeed(MIDM, old); if (old) freeMesh(old); });
  }
  function updateNear(){
    stream3d(); nearWanted(); updateMid(); updateFar(); meshStep(); tileStep();   // the near mesh first when more than one is due
  }
  function nearWanted(){
    const span = QUAL.near[QUAL.lvl][cam.dist > 1200 ? 1 : 0], snap = span / 10, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (NEARM && !NEARM.stale && NEARM.sx === span && Math.abs(cx - NEARM.cx) < span / 5 && Math.abs(cz - NEARM.cz) < span / 5) return;
    meshTask('near', NEARM && NEARM.sx === span ? NEARM : null, cx - span / 2, cz - span / 2, span, 256, terrCoarse, (M, dirty) => { const old = NEARM; NEARM = M; NEARM.cx = cx; NEARM.cz = cz; NEARM.stale = dirty; shSeed(NEARM, old); if (old) freeMesh(old); buildPatches(); buildGround(); });
  }
  function recolor(m, snow){
    const {slope, nz, col, h, fo} = m;
    const grass = [0.36, 0.43, 0.28], birch = [0.25, 0.33, 0.22], rock = [0.33, 0.35, 0.37], snowC = [0.9, 0.92, 0.95], shore = [0.5, 0.49, 0.44], bed = [0.3, 0.3, 0.27];
    for (let i = 0; i < h.length; i++){
      const y = h[i], n = nz[i]; let c;
      if (y < 0) c = bed;
      else {
        c = mix3(rock, mix3(grass, birch, n), y < 280 ? 1 : sstep(420, 280, y));
        if (y < 6) c = mix3(shore, c, y / 6);
        // birch woods below the tree line stay dark through the snow; steep faces show bare rock
        const rs = sstep(0.32, 0.7, slope[i]), wood = Math.max(y < 320 ? sstep(0.42, 0.62, n) * sstep(320, 200, y) : 0, fo ? fo[i] * sstep(420, 260, y) * 0.9 : 0) * (1 - rs);
        const sn = sstep(snow - 60, snow + 60, y + n * 90) * (1 - rs * 0.85) * (1 - wood * 0.55);
        c = mix3(mix3(c, rock, rs * 0.75), birch, wood * 0.6);
        c = mix3(c, snowC, sn);
      }
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, col);
  }

  // ---------- the breakwaters' armour stones: a mesh a breakwater, drawn only within STONE_R of the eye (beyond it a stone is less than a
  // pixel; the faces' normals come from the pixels' derivatives, and thousands of stones too small to see stalled SwiftShader for seconds
  // a frame, 03.10.2026) ----------
  const STONES = [], STONE_R = 1500;
  function stonesOf(list, build){
    const sm = MB(); build(sm); if (!sm.p.length) return;
    let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (let i = 0; i < sm.p.length; i += 3){ x0 = Math.min(x0, sm.p[i]); z0 = Math.min(z0, sm.p[i + 2]); x1 = Math.max(x1, sm.p[i]); z1 = Math.max(z1, sm.p[i + 2]); }
    list.push({mesh:sm.mesh([(x0 + x1) / 2, (z0 + z1) / 2]), x0, z0, x1, z1});
  }
  function drawStones(list, TM, eye){
    for (const q of list){ const dx = Math.max(q.x0 - eye[0], 0, eye[0] - q.x1), dz = Math.max(q.z0 - eye[2], 0, eye[2] - q.z1); if (dx * dx + dz * dz < STONE_R * STONE_R) drawLit(q.mesh, TM); }
  }
  // ---------- villages and quays ----------
  function buildStatics(){
    const m = MB(), R = rng(7), WALLS = [[0.62,0.18,0.14],[0.88,0.88,0.84],[0.85,0.68,0.3],[0.76,0.46,0.22],[0.5,0.56,0.6],[0.88,0.88,0.84]], ROOF = [[0.18,0.2,0.22],[0.3,0.2,0.18],[0.22,0.26,0.3]];
    LIGHTS = [];
    // piers, quays and breakwaters from OpenStreetMap, as listed in PIERBOX (the berths use the same boxes); the breakwaters as rubble
    // mounds, those a harbour unit has not taken
    for (const q of PIERBOX) pierInto(m, q);
    const bwLeft = new Set(PIERBOX.filter(q => q.bw).map(q => q.src));
    PIERS.forEach((pr, i) => { if (pr[0] === 1 && bwLeft.has(i)) stonesOf(STONES, sm => moundInto(m, Array.from({length:(pr.length - 1) / 2}, (_, k) => [pr[1 + k * 2] * 1000, pr[2 + k * 2] * 1000]), i * 7919 + 13, true, undefined, sm)); });
    // bridges from OpenStreetMap
    for (const br of BRIDGES) bridgeInto(m, br);
    // lighthouses, lights, beacons and buoys
    for (const mk of SEAMARKS.marks){
      const x = mk[0] * 1000, z = mk[1] * 1000, base = Math.max(terrH(x, z), 0.2), ty = mk[2], cat = mk[3];
      if (ty === 'M'){ camSolid(x, z, 3.6, 3.6, 0.3, base, base + 15.4); m.box(x, base, z, 3.4, 11, 3.4, [0.95, 0.95, 0.93], 0.3); m.box(x, base + 11, z, 3.6, 2.2, 3.6, [0.75, 0.1, 0.08], 0.3); m.box(x, base + 13.2, z, 2.2, 2.2, 2.2, [0.9, 0.92, 0.9], 0.3, [0.2, 0.2, 0.22]); }
      else if (ty === 'm' || ty === 'P'){ m.box(x, base, z, 0.9, 4.2, 0.9, [0.94, 0.94, 0.92], 0); m.box(x, base + 4.2, z, 1.1, 0.9, 1.1, [0.8, 0.12, 0.1], 0); }
      else if (ty === 'D'){ m.box(x, base, z, 0.5, 4.5, 0.5, [0.08, 0.08, 0.08], 0); m.box(x, base + 2.2, z, 0.56, 0.9, 0.56, [0.75, 0.1, 0.08], 0); }
      else if (ty === 'L'){ m.box(x, base, z, 0.45, 4, 0.45, cat === 'starb' ? [0.1, 0.55, 0.2] : [0.8, 0.12, 0.08], 0); }
      else if (ty === 'B'){ m.box(x, -0.6, z, 1.1, 2.1, 1.1, cat === 'starb' ? [0.1, 0.55, 0.2] : [0.8, 0.12, 0.08], 0.5); }
      else if (ty === 'C'){ m.box(x, -0.6, z, 1.1, 1.1, 1.1, [0.08, 0.08, 0.08], 0.5); m.box(x, 0.5, z, 1.1, 1.1, 1.1, [0.95, 0.8, 0.1], 0.5); }
      else if (ty === 'S'){ m.box(x, base, z, 0.5, 3.5, 0.5, [0.95, 0.8, 0.1], 0); }
      else if (ty === 'K'){ m.box(x, base, z, 1.8, 2.6, 1.8, [0.85, 0.85, 0.83], 0.4, [0.8, 0.8, 0.78]); }
    }
    for (const pt of PORTS){
      const px = pt.p.x * 1000, pz = pt.p.y * 1000, cx = pt.coast.x * 1000, cz = pt.coast.y * 1000;
      const dxp = cx - px, dzp = cz - pz, L = Math.hypot(dxp, dzp), ux = dxp / L, uz = dzp / L, ang = Math.atan2(ux, uz);
      // quay from the shore out to the berth
      const bx = cx + ux * 45, bz = cz + uz * 45, bh = Math.max(0, terrH(bx, bz));
      if (BLD) continue;
      if (pt.mottak) m.box(bx, bh - 1, bz, 42, 11, 24, [0.78, 0.82, 0.84], ang + Math.PI / 2, [0.35, 0.42, 0.48]);
      else m.box(bx, bh - 1, bz, 26, 7, 14, [0.66, 0.24, 0.18], ang + Math.PI / 2, [0.25, 0.25, 0.27]);
      const count = pt.home ? 170 : 40, rad = pt.home ? 2600 : 1300;
      let placed = 0;
      for (let tries = 0; tries < count * 25 && placed < count; tries++){
        const a = R() * Math.PI * 2, r = 60 + Math.sqrt(R()) * rad, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        if (!isLand({x:x / 1000, y:z / 1000})) continue;
        const y = terrH(x, z); if (y < 2 || y > 70) continue;
        if (Math.abs(terrH(x + 10, z) - y) > 4 || Math.abs(terrH(x, z + 10) - y) > 4) continue;
        const w = 6 + R() * 4, l = 8 + R() * 5, hg = 4.5 + R() * 2.5;
        m.house(x, y - 1, z, w, l, hg, ang + (R() - 0.5) * 0.5 + (R() < 0.5 ? 0 : Math.PI / 2), WALLS[Math.floor(R() * WALLS.length)], ROOF[Math.floor(R() * ROOF.length)]);
        if (R() < 0.7) LIGHTS.push(x, y + 3, z);
        placed++;
      }
    }
    STAT = m.mesh(mapMid());
  }
  // a pier, a quay's deck or a breakwater's box: its camera solid, and the box itself (a breakwater is drawn by moundInto); tag marks
  // what a tile of the coast's packs built (tileStatics), so it can go with the tile
  function pierInto(m, q, tag){
    if (q.closed && q.src !== undefined && tag !== undefined) return;   // a pack's area pier: slabInto, in its shape
    camSolid(q.x, q.z, q.w, q.l, q.ang, -3, q.bw ? 3.2 : QTOP, tag);
    if (q.bw) return;
    if (q.closed) m.box(q.x, -2.4, q.z, q.w, QTOP + 2.4, q.l, [0.5, 0.49, 0.46], q.ang, [0.6, 0.58, 0.54]);
    else if (q.made) m.box(q.x, -3, q.z, q.w, QTOP + 3, q.l, [0.52, 0.53, 0.5], q.ang, [0.6, 0.6, 0.58]);
    else m.box(q.x, -2.4, q.z, q.w, QTOP + 2.4, q.l, [0.46, 0.42, 0.37], q.ang, [0.56, 0.52, 0.46]);
  }
  // a pier mapped as an area, in its shape (its bounding box, as Senja's small ones are drawn, lay over the water at a big quay in
  // Bergen): the deck in strips a metre deep, each cut where the outline crosses its middle, the walls down the outline's edges; the
  // camera's solids in strips 4 m deep
  function slabInto(m, pts, tag){
    const n = pts.length; let z0 = 1e18, z1 = -1e18; for (const [, z] of pts){ z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const top = [0.6, 0.58, 0.54], side = [0.5, 0.49, 0.46], runs = (z, f) => { const xs = []; for (let k = 0; k < n - 1; k++){ const az = pts[k][1], bz = pts[k + 1][1]; if ((az > z) !== (bz > z)) xs.push(pts[k][0] + (z - az) * (pts[k + 1][0] - pts[k][0]) / (bz - az)); } xs.sort((a, b) => a - b); for (let q = 0; q + 1 < xs.length; q += 2) f(xs[q], xs[q + 1]); };
    for (let z = z0; z < z1; z += 1){ const z2 = Math.min(z1, z + 1); runs((z + z2) / 2, (a, b) => m.quad([a, QTOP, z], [b, QTOP, z], [b, QTOP, z2], [a, QTOP, z2], top)); }
    for (let k = 0; k < n - 1; k++){ const [ax, az] = pts[k], [bx, bz] = pts[k + 1]; if (Math.hypot(bx - ax, bz - az) < 0.2) continue; m.quad([ax, -2.4, az], [bx, -2.4, bz], [bx, QTOP, bz], [ax, QTOP, az], side); }
    for (let z = z0; z < z1; z += 4){ const z2 = Math.min(z1, z + 4); runs((z + z2) / 2, (a, b) => camSolid((a + b) / 2, (z + z2) / 2, b - a, z2 - z, 0, -3, QTOP, tag)); }
  }
  // a road bridge [class, length, name, type, x, z, ...]: the deck rises from its ends to a clearance by its length (Tromsøbrua, 1046 m,
  // about 38 m; the longest 42 m). The deck is one smooth band over cross-sections every 8 m (it was boxes 18 m long, each level, which
  // climbed like a stair: the user 03.10.2026): the road on top, the edge beams and the railings along its sides, and under it a box
  // girder narrower than the deck, deeper the longer the bridge; a pier every 70 m where the deck is more than 3 m over the ground or
  // the sea. The camera's solids stay boxes every 18 m.
  const BRC = {road:[0.3, 0.31, 0.33], edge:[0.7, 0.7, 0.67], under:[0.5, 0.5, 0.48], rail:[0.82, 0.84, 0.84], pier:[0.62, 0.62, 0.59]};
  function bridgeInto(m, br, tag){
    const cls = br[0], L = br[1], n = (br.length - 4) / 2, X = k => br[4 + k * 2], Z = k => br[5 + k * 2];
    const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(X(k) - X(k - 1), Z(k) - Z(k - 1)));
    const tot = cum[n - 1] || 1, hA = Math.max(terrH(X(0), Z(0)), 1), hB = Math.max(terrH(X(n - 1), Z(n - 1)), 1);
    const clear = L < 60 ? 0 : clamp(tot * 0.036, 6, 42), wdt = [9, 8.5, 7.5, 7, 5][cls] || 7, hw = wdt / 2, gd = clamp(L / 450, 1.1, 2.6), gw = hw * 0.55;
    const yAt = s => { const u = s / tot; return hA + (hB - hA) * u + clear * Math.pow(Math.sin(Math.PI * u), 0.55); };
    // the cross-sections: along each leg every 8 m or less; at a bend the section is turned half way (a mitre)
    const C = [];
    for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), dx = X(k + 1) - ax, dz = Z(k + 1) - az, segL = Math.hypot(dx, dz) || 1e-6, steps = Math.max(1, Math.ceil(segL / 8));
      for (let q = k ? 1 : 0; q <= steps; q++){ const u = q / steps; C.push({x:ax + dx * u, z:az + dz * u, s:cum[k] + segL * u, ux:dx / segL, uz:dz / segL}); }
    }
    for (let i = 1; i < C.length - 1; i++){ const a = C[i - 1], c = C[i + 1]; if (Math.abs(a.ux - c.ux) + Math.abs(a.uz - c.uz) > 1e-6){ const mx = (C[i].ux + c.ux) / 2, mz = (C[i].uz + c.uz) / 2, l = Math.hypot(mx, mz) || 1; C[i].ux = mx / l; C[i].uz = mz / l; } }
    const at = (c, o, dy) => [c.x + c.uz * o, c.y + dy, c.z - c.ux * o];
    for (const c of C) c.y = yAt(c.s);
    for (let i = 0; i < C.length - 1; i++){
      const a = C[i], c = C[i + 1];
      m.quad(at(a, hw, 0), at(a, -hw, 0), at(c, -hw, 0), at(c, hw, 0), BRC.road);
      for (const sd of [1, -1]){
        const o = sd * (hw + 0.15), g = sd * gw;
        m.quad(at(a, o, 0.25), at(c, o, 0.25), at(c, o, -0.55), at(a, o, -0.55), BRC.edge);                  // the edge beam
        m.quad(at(a, sd * (hw - 0.15), 0.25), at(c, sd * (hw - 0.15), 0.25), at(c, o, 0.25), at(a, o, 0.25), BRC.edge);
        m.quad(at(a, o, -0.55), at(c, o, -0.55), at(c, g, -0.55), at(a, g, -0.55), BRC.under);                  // the slab's underside
        m.quad(at(a, g, -0.55), at(c, g, -0.55), at(c, g, -gd), at(a, g, -gd), BRC.edge);                       // the girder's side
        m.quad(at(a, sd * (hw - 0.05), 0.25), at(c, sd * (hw - 0.05), 0.25), at(c, sd * (hw - 0.05), 1.15), at(a, sd * (hw - 0.05), 1.15), BRC.rail);   // the railing
      }
      m.quad(at(a, gw, -gd), at(c, gw, -gd), at(c, -gw, -gd), at(a, -gw, -gd), BRC.under);
    }
    // the camera's solids and the piers, every 18 m and 70 m as before
    for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), bx2 = X(k + 1), bz2 = Z(k + 1), segL = Math.hypot(bx2 - ax, bz2 - az), steps = Math.max(1, Math.ceil(segL / 18));
      for (let q = 0; q < steps; q++){
        const u0 = q / steps, u1 = (q + 1) / steps, x0 = ax + (bx2 - ax) * u0, z0 = az + (bz2 - az) * u0, x1 = ax + (bx2 - ax) * u1, z1 = az + (bz2 - az) * u1;
        const s0 = cum[k] + segL * u0, s1 = cum[k] + segL * u1, ym = (yAt(s0) + yAt(s1)) / 2, len = Math.hypot(x1 - x0, z1 - z0) + 0.4, ang = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        camSolid(cx, cz, wdt + 0.6, len, ang, ym - gd, ym + 1.2, tag);
        if (Math.floor(s0 / 70) !== Math.floor(s1 / 70) || (q === 0 && k === 0)){
          const gy = terrH(cx, cz), top = ym - gd; if (top - gy > 3){ const bot = Math.min(gy, 0) - 4, pw = Math.min(gw * 1.6, 5); m.box(cx, bot, cz, pw, top - bot, 3, BRC.pier, ang); camSolid(cx, cz, pw, 3, ang, bot, top, tag); }
        }
      }
    }
  }
  // ---------- breakwaters (the user's wish 03.10.2026: they shelter the boats at the quays, and should look it) ----------
  // A rubble mound as a height field over the mapped shape: an outline is taken as the waterline, a line as the middle of a mound 16 m
  // wide there. The crest stands about 2.8 m over mean sea level, over the highest tide (TIDE_C), flat and gravelled, for most
  // breakwaters carry a road on top (the user 03.10.2026: Husøy's does; addRoads lays a road over a crest, moundTop); the sides fall
  // 1 : 1.4 to 6 m under, grey above, dark and weedy in the tidal zone, with armour stones loose on them. Any shape: a bend, an L, a
  // round head. The ground it is built from (terrH over it) and a harbour unit (unit) are left.
  // a stone: a box sx by sy by sz (centre of its foot at x, y, z) with its corners pushed in and out by up to a quarter of its size, turned
  // about the vertical and tipped up to 25 degrees, so no two lie alike and none is a block
  function rockInto(m, x, y, z, sx, sy, sz, seed, k){
    const ry = hash(seed) * Math.PI * 2, tx = (hash(seed + 1) - 0.5) * 0.9, tz = (hash(seed + 2) - 0.5) * 0.9, cr = Math.cos(ry), sr = Math.sin(ry), ca = Math.cos(tx), sa = Math.sin(tx), cb = Math.cos(tz), sb = Math.sin(tz);
    const V = [];
    for (let q = 0; q < 8; q++){
      const u = (q & 1 ? 0.5 : -0.5) * sx * (0.75 + 0.5 * hash(seed + 3 + q)), w = (q & 4 ? 0.5 : -0.5) * sz * (0.75 + 0.5 * hash(seed + 11 + q)), h = (q & 2 ? 1 : 0) * sy * (0.7 + 0.6 * hash(seed + 19 + q)) - sy * 0.15;
      const y1 = h * ca - w * sa, w1 = h * sa + w * ca, u1 = u * cb - y1 * sb, y2 = u * sb + y1 * cb;
      V.push([x + u1 * cr + w1 * sr, y + y2, z - u1 * sr + w1 * cr]);
    }
    const d = k.map(c => c * 0.8);
    m.quad(V[0], V[1], V[3], V[2], d); m.quad(V[4], V[6], V[7], V[5], d); m.quad(V[0], V[2], V[6], V[4], d); m.quad(V[1], V[5], V[7], V[3], d);
    m.quad(V[2], V[3], V[7], V[6], k);   // the top; the foot is under the ground
  }
  const MOLO = {g:2, slope:1 / 1.4, crest:2.8, foot:-6, half:8};
  // the crests the roads lie on: each mound's height field under the km cells it covers (tag as camSolid's)
  const MOLOH = new Map();
  function moundTop(x, z){
    const a = MOLOH.get(gridKey(Math.floor(x / 1000), Math.floor(z / 1000))); if (!a) return -1e9; let best = -1e9;
    for (const M of a){
      const fx = (x - M.x0) / M.g, fz = (z - M.z0) / M.g; if (fx < 0 || fz < 0 || fx >= M.nx - 1 || fz >= M.nz - 1) continue;
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, w = fz - j, k = j * M.nx + i, H = M.H;
      best = Math.max(best, (H[k] * (1 - u) + H[k + 1] * u) * (1 - w) + (H[k + M.nx] * (1 - u) + H[k + M.nx + 1] * u) * w);
    }
    return best;
  }
  function moundInto(m, pts, seed, unit, tag, sm){
    const n = pts.length; if (n < 2) return 0;
    const closed = n > 3 && Math.hypot(pts[0][0] - pts[n - 1][0], pts[0][1] - pts[n - 1][1]) < 1;
    let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const [x, z] of pts){ x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
    const E = MOLO.half + (MOLO.crest - MOLO.foot) / MOLO.slope; x0 -= E; z0 -= E; x1 += E; z1 += E;
    let g = MOLO.g; const area = (x1 - x0) * (z1 - z0); if (area / (g * g) > 90000) g = Math.sqrt(area / 90000);
    const nx = Math.ceil((x1 - x0) / g) + 1, nz = Math.ceil((z1 - z0) / g) + 1, H = new Float32Array(nx * nz);
    // the signed distance to the shape (m; positive inside the outline, or within MOLO.half of the line) on the grid: the outline filled
    // row by row (or the line drawn), then a two-pass chamfer distance (1 and 1.41 cells; a few per cent off, which the rock's noise
    // hides): a 600 m breakwater is a few milliseconds, not the hundreds a distance to every edge from every point took
    const N = nx * nz, IN = new Uint8Array(N);
    if (closed) for (let j = 0; j < nz; j++){
      const z = z0 + j * g, xs = [];
      for (let k = 0; k < n - 1; k++){ const az = pts[k][1], bz = pts[k + 1][1]; if ((az > z) !== (bz > z)) xs.push(pts[k][0] + (z - az) * (pts[k + 1][0] - pts[k][0]) / (bz - az)); }
      xs.sort((p, q) => p - q);
      for (let q = 0; q + 1 < xs.length; q += 2) for (let i = Math.max(0, Math.ceil((xs[q] - x0) / g)); i <= Math.min(nx - 1, Math.floor((xs[q + 1] - x0) / g)); i++) IN[j * nx + i] = 1;
    } else for (let k = 0; k < n - 1; k++){
      const ax = pts[k][0], az = pts[k][1], dx = pts[k + 1][0] - ax, dz = pts[k + 1][1] - az, st = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (g / 2)));
      for (let q = 0; q <= st; q++){ const i = Math.round((ax + dx * q / st - x0) / g), j = Math.round((az + dz * q / st - z0) / g); if (i >= 0 && j >= 0 && i < nx && j < nz) IN[j * nx + i] = 1; }
    }
    const dist = want => {
      const D = new Float32Array(N), d2 = g * Math.SQRT2; for (let i = 0; i < N; i++) D[i] = IN[i] === want ? 0 : 1e9;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){ const a = j * nx + i; let v = D[a]; if (i) v = Math.min(v, D[a - 1] + g); if (j){ v = Math.min(v, D[a - nx] + g); if (i) v = Math.min(v, D[a - nx - 1] + d2); if (i < nx - 1) v = Math.min(v, D[a - nx + 1] + d2); } D[a] = v; }
      for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--){ const a = j * nx + i; let v = D[a]; if (i < nx - 1) v = Math.min(v, D[a + 1] + g); if (j < nz - 1){ v = Math.min(v, D[a + nx] + g); if (i < nx - 1) v = Math.min(v, D[a + nx + 1] + d2); if (i) v = Math.min(v, D[a + nx - 1] + d2); } D[a] = v; }
      return D;
    };
    const Dto = dist(1), Dout = closed ? dist(0) : null;
    const sdAt = a => closed ? (IN[a] ? Dout[a] - g / 2 : -(Dto[a] - g / 2)) : MOLO.half - Dto[a];
    const cr = MOLO.crest + 0.4 * (hash(seed) - 0.5);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++){
      // the crest flat; the slopes rough, the more so the further below it
      const x = x0 + i * g, z = z0 + j * g, a = j * nx + i, h = Math.max(MOLO.foot, Math.min(cr, sdAt(a) * MOLO.slope)), f = clamp((cr - h) / 0.8, 0, 1);
      H[a] = h > -1.5 ? h + f * (0.5 * (noise2(x / 2.4, z / 2.4, 53) - 0.5) + 0.25 * (noise2(x / 0.9, z / 0.9, 59) - 0.5)) : h;
    }
    const rec = {x0, z0, g, nx, nz, H, tag, cells:[]};
    for (let gz = Math.floor(z0 / 1000); gz <= Math.floor((z0 + nz * g) / 1000); gz++) for (let gx = Math.floor(x0 / 1000); gx <= Math.floor((x0 + nx * g) / 1000); gx++){ const k = gridKey(gx, gz); let l = MOLOH.get(k); if (!l) MOLOH.set(k, l = []); l.push(rec); rec.cells.push(k); }
    const ROCK = [0.43, 0.43, 0.41], LICHEN = [0.5, 0.5, 0.42], WET = [0.2, 0.19, 0.16], WEED = [0.23, 0.21, 0.1], DEEP = [0.16, 0.19, 0.17], GRAVEL = [0.53, 0.51, 0.47];
    // the cells to draw: none deeper than 1.6 m (the water hides them), none on the ground it is built from or a harbour unit; the flat
    // crest in one strip a row (the triangles were 135 000 for Senja's breakwaters, and SwiftShader's frames could not keep up)
    let tris = 0;
    for (let j = 0; j < nz - 1; j++){
      let run = -1;
      const flush = i => { if (run < 0) return; const z = z0 + j * g, xa = x0 + run * g, xb = x0 + i * g; m.quad([xa, cr, z], [xb, cr, z], [xb, cr, z + g], [xa, cr, z + g], GRAVEL.map(c => c * (0.94 + 0.08 * hash(seed + j * 13 + run)))); tris += 2; run = -1; };
      for (let i = 0; i < nx - 1; i++){
        const a = j * nx + i, h00 = H[a], h10 = H[a + 1], h01 = H[a + nx], h11 = H[a + nx + 1], hm = (h00 + h10 + h01 + h11) / 4;
        const x = x0 + i * g, z = z0 + j * g, cx = x + g / 2, cz = z + g / 2;
        if (Math.max(h00, h10, h01, h11) < -1.6 || terrH(cx, cz) > hm + 0.3 || (unit && onUnit(cx, cz, 1))){ flush(i); continue; }
        if (Math.min(h00, h10, h01, h11) > cr - 0.02){ if (run < 0) run = i; continue; }
        flush(i);
        const r = hash(seed + j * 7919 + i * 104729), v = 0.82 + 0.3 * r;
        const k = hm > 1.0 ? (r > 0.9 ? LICHEN : ROCK) : hm > -0.5 ? mix3(WET, WEED, hash(seed + j * 31 + i * 17)) : DEEP;
        m.quad([x, h00, z], [x + g, h10, z], [x + g, h11, z + g], [x, h01, z + g], k.map(c => c * v)); tris += 2;
        // armour stones, half sunk and tipped, on the slopes (the crest is the road's)
        if (hm > 0.2 && hm < cr - 0.45 && (i + 2 * j) % 3 === 0 && r < 0.4){
        const b = 0.9 + 1.5 * hash(seed + a * 3 + 1), ox = (hash(seed + a * 7 + 3) - 0.5) * g * 1.4, oz = (hash(seed + a * 11 + 4) - 0.5) * g * 1.4;
        rockInto(sm || m, cx + ox, hm - b * 0.18, cz + oz, b, b * (0.55 + 0.3 * hash(seed + a * 13 + 5)), b * (0.7 + 0.5 * hash(seed + a * 19 + 7)), seed + a * 23, ROCK.map(c => c * (0.72 + 0.36 * hash(seed + a * 17 + 6)))); tris += 10;
        }
      }
      flush(nx - 1);
    }
    return tris;
  }


  // ---------- harbour fittings along the berth faces: tyres hung on chains, a timber fender beam, the yellow edge and bollards ----------
  let STATN = null; const QB = {};
  function obox(nb, c, u, n, len, wid, y0, h, k){   // an oriented box: centre c (x, z), length along u, width along n
    const P = (a, b, y) => [c[0] + u[0] * a + n[0] * b, y, c[1] + u[1] * a + n[1] * b], l = len / 2, w = wid / 2, y1 = y0 + h;
    nb.quad(P(-l, w, y0), P(l, w, y0), P(l, w, y1), P(-l, w, y1), k); nb.quad(P(l, -w, y0), P(-l, -w, y0), P(-l, -w, y1), P(l, -w, y1), k);
    nb.quad(P(-l, -w, y1), P(-l, w, y1), P(l, w, y1), P(l, -w, y1), k); nb.quad(P(-l, -w, y0), P(-l, -w, y1), P(-l, w, y1), P(-l, w, y0), k); nb.quad(P(l, w, y0), P(l, w, y1), P(l, -w, y1), P(l, -w, y0), k);
  }
  const faceKey = f => Math.round(f.x) + ',' + Math.round(f.z);
  function buildHarbourFittings(){
    const nb = NB(), TYRE = [0.07, 0.07, 0.08, 0.05], CHAIN = [0.55, 0.56, 0.58, 0.6], BOLL = [0.12, 0.13, 0.14, 0.4], WOOD = [0.36, 0.26, 0.18, 0.1], YEL = [0.95, 0.78, 0.1, 0.2];
    const done = new Set();
    for (const pt of PORTS) for (const kind of ['main', 'bunker']) for (const ty of Object.keys(BEAM)){
      const bp = berthPose(pt.id, ty, kind); if (!bp) continue; const f = bp.face, key = faceKey(f); if (done.has(key)) continue; done.add(key);
      if (f.unit){ const M = unitModel(); if (M) QB[key] = M.A.bollards.map(q => { const w = unitW(UNITS[f.unit], q[0], q[2]); return {x:w[0], z:w[1], a:(w[0] - f.x) * f.ux + (w[1] - f.z) * f.uz}; }); continue; }
      const u = [f.ux, f.uz], n = [f.nx, f.nz], a0 = Math.max(-f.hl + 1, bp.a - 30), a1 = Math.min(f.hl - 1, bp.a + 30), am = (a0 + a1) / 2, len = a1 - a0;
      const at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o];
      obox(nb, at(am, 0.1), u, n, len, 0.2, QTOP - 1.5, 0.35, WOOD); obox(nb, at(am, 0.1), u, n, len, 0.2, QTOP - 0.55, 0.3, WOOD);
      obox(nb, at(am, -0.2), u, n, len, 0.4, QTOP, 0.03, YEL);
      for (let a = a0 + 1.3; a < a1 - 0.5; a += 2.6){
        const c = at(a, 0.34), cy = QTOP - 1.05, ring = [];
        for (let i = 0; i <= 12; i++){ const an = i / 12 * Math.PI * 2; ring.push([c[0] + u[0] * Math.cos(an) * 0.4, cy + Math.sin(an) * 0.4, c[1] + u[1] * Math.cos(an) * 0.4]); }
        nb.tube(ring, 0.12, TYRE, 6);
        for (const sd of [-1, 1]){ const top = at(a + sd * 0.35, 0.02); nb.tube([[top[0], QTOP - 0.05, top[1]], [c[0] + u[0] * sd * 0.12, cy + 0.5, c[1] + u[1] * sd * 0.12]], 0.018, CHAIN, 4); }
      }
      const bl = QB[key] = [];
      for (let a = a0 + 2; a < a1; a += 8){
        const c = at(a, -0.55); nb.tube([[c[0], QTOP, c[1]], [c[0], QTOP + 0.45, c[1]]], 0.16, BOLL, 10); nb.tube([[c[0], QTOP + 0.45, c[1]], [c[0], QTOP + 0.52, c[1]]], 0.24, BOLL, 10);
        bl.push({x:c[0], z:c[1], a});
      }
    }
    STATN = nb.mesh(mapMid());
  }
  // ---------- real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor ----------
  let BLD = null, chunkSnow = -1;
  const CH = new Map();
  // the buildings of a 1 km cell: Senja's embedded ones (BLD) and those of the coast's pack for its tile (01c-vec.js), each with its
  // own arrays; a building's look is hashed from its index and the source's seed (Senja's 0, as before)
  function bldCells(key){
    const out = [], a = BLD && BLD.cells.get(key); if (a) out.push([BLD, a]);
    const T = MAPD.man ? MAPD.man.tile : 50, t = vecTile(Math.floor(gridKeyX(key) / T), Math.floor(gridKeyY(key) / T));
    if (t && t.bld){ const b = t.bld.cells.get(key); if (b) out.push([t.bld, b]); }
    return out;
  }
  async function loadBuildings(){
    const el = document.getElementById('bld');
    if (!el || typeof DecompressionStream === 'undefined') return null;
    const n = +el.dataset.n, U = +el.dataset.u, bytes = b64bytes(el.textContent.trim());
    const raw = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const X = new Uint16Array(raw.buffer, 0, n), Y = new Uint16Array(raw.buffer, 2 * n, n), Lq = raw.subarray(4 * n, 5 * n), Wq = raw.subarray(5 * n, 6 * n), Aq = raw.subarray(6 * n, 7 * n), Tq = raw.subarray(7 * n, 8 * n);
    const dec = q => q <= 160 ? q * 0.5 : 80 + (q - 160) * 2;
    const B = {n, x:new Float64Array(n), z:new Float64Array(n), l:new Float32Array(n), w:new Float32Array(n), a:new Float32Array(n), t:new Uint8Array(n), lv:new Uint8Array(n), cells:new Map(), seed:0};
    for (let i = 0; i < n; i++){
      // stored in the legacy frame (metres): into the national frame, turned with it (LGrot, about -gamma)
      const lx = X[i] * U, lz = Y[i] * U, q = LGm([lx, lz]);
      B.x[i] = q[0]; B.z[i] = q[1]; B.l[i] = dec(Lq[i]); B.w[i] = Math.max(1.5, dec(Wq[i])); B.a[i] = Aq[i] / 256 * Math.PI + LGrot(lx / 1000, lz / 1000); B.t[i] = Tq[i] & 15; B.lv[i] = Tq[i] >> 4;
      const k = gridKey(Math.floor(B.x[i] / 1000), Math.floor(B.z[i] / 1000));
      if (bldOnUnit(B, i)) continue;   // a harbour unit stands there
      let c = B.cells.get(k); if (!c) B.cells.set(k, c = []); c.push(i);
    }
    return B;
  }
  function bldOnUnit(B, i){ const ca = Math.cos(B.a[i]), sa = Math.sin(B.a[i]), nu = Math.ceil(B.l[i] / 3), nv = Math.ceil(B.w[i] / 3);
    for (let p = 0; p <= nu; p++) for (let q = 0; q <= nv; q++){ const u = p / nu - 0.5, v = q / nv - 0.5; if (onUnit(B.x[i] + ca * u * B.l[i] - sa * v * B.w[i], B.z[i] + sa * u * B.l[i] + ca * v * B.w[i], 3)) return true; } return false; }
  const PAL_HOUSE = [[0.9,0.9,0.87],[0.9,0.9,0.87],[0.62,0.18,0.14],[0.87,0.72,0.35],[0.78,0.52,0.25],[0.72,0.74,0.73],[0.6,0.7,0.78],[0.55,0.62,0.52],[0.9,0.9,0.87]];
  const PAL_CABIN = [[0.33,0.25,0.19],[0.55,0.17,0.13],[0.36,0.3,0.24],[0.78,0.52,0.25],[0.2,0.18,0.16]];
  const PAL_NAUST = [[0.62,0.17,0.13],[0.58,0.16,0.12],[0.55,0.34,0.2],[0.3,0.23,0.18],[0.88,0.88,0.85]];
  const PAL_BARN = [[0.6,0.16,0.12],[0.6,0.16,0.12],[0.6,0.6,0.6],[0.88,0.88,0.85]];
  const PAL_IND = [[0.78,0.8,0.8],[0.55,0.62,0.68],[0.88,0.88,0.86],[0.6,0.68,0.62]];
  const PAL_TOWN = [[0.8,0.8,0.78],[0.9,0.9,0.88],[0.86,0.8,0.62],[0.6,0.3,0.24]];
  const ROOFS = [[0.2,0.21,0.23],[0.14,0.14,0.15],[0.42,0.2,0.15],[0.24,0.25,0.27]], SOD = [0.34,0.4,0.24], SNOW = [0.92,0.94,0.96];
  // type: 0 other, 1 house, 2 apartments, 3 garage, 4 cabin, 5 boathouse, 6 barn, 7 shed, 8 industrial, 9 commercial, 10 civic, 11 church, 12 bunker, 13 greenhouse, 14 service, 15 ruin
  const FRAME = [0.93, 0.93, 0.9], BGLASS = [0.1, 0.13, 0.16], WARM = [1, 0.78, 0.42], DOORS = [[0.3,0.2,0.14],[0.2,0.3,0.24],[0.55,0.15,0.12],[0.9,0.9,0.88],[0.22,0.28,0.4]];
  function buildChunk(key, detail){
    const srcs = bldCells(key), c = {mesh:null, lights:null, nl:0, detail, dm:null, gd:null, gl:null};
    const m = MB(), L = [], snowy = chunkSnow % 10 === 1, D = detail ? MB() : null, GD = detail ? MB() : null, GLm = detail ? MB() : null;
    for (const [B, idx] of srcs) for (const j of idx){
      const i = j + B.seed, x = B.x[j], z = B.z[j], l = B.l[j], w = B.w[j], ty = B.t[j], lv = B.lv[j], ry = Math.PI / 2 - B.a[j], hsh = hash(i * 7 + 3);
      const ca = Math.cos(B.a[j]), sa = Math.sin(B.a[j]);
      let lo = 1e9, hi = -1e9;
      for (const [u, v] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(x + ca * u * l - sa * v * w, z + sa * u * l + ca * v * w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      const base = Math.max(lo, 0.3) - 0.5, rise = Math.max(0, hi - base);
      const pick = arr => arr[Math.floor(hsh * arr.length) % arr.length];
      let wall, roof = pick(ROOFS), hg, gable = true, pitch = 0.38, cap = 6, light = 0;
      switch (ty){
        case 1: wall = pick(PAL_HOUSE); hg = lv ? 2.7 * lv + 0.6 : 4.6 + hsh * 1.4; light = 0.75; break;
        case 2: wall = pick(PAL_TOWN); hg = (lv || 3) * 3; gable = false; light = 0.9; break;
        case 3: wall = pick(PAL_HOUSE); hg = 2.6; pitch = 0.22; cap = 2; break;
        case 4: wall = pick(PAL_CABIN); hg = 2.9; if (hsh > 0.7) roof = SOD; light = 0.15; break;
        case 5: wall = pick(PAL_NAUST); hg = 3.1; pitch = 0.45; break;
        case 6: wall = pick(PAL_BARN); hg = lv ? 3 * lv : 5.2; pitch = 0.4; cap = 7; break;
        case 7: wall = pick(PAL_HOUSE); hg = 2.3; pitch = 0.3; cap = 2; break;
        case 8: wall = pick(PAL_IND); hg = lv ? 4 * lv : 7.5; gable = false; light = 0.3; break;
        case 9: wall = pick(PAL_TOWN); hg = (lv || 2) * 3.4; gable = false; light = 0.8; break;
        case 10: wall = pick(PAL_TOWN); hg = (lv || 2) * 3.4; gable = w < 14; light = 0.6; break;
        case 11: wall = [0.92, 0.92, 0.9]; hg = 7; pitch = 0.6; cap = 9; roof = [0.2, 0.22, 0.25]; light = 0.5; break;
        case 12: wall = [0.55, 0.56, 0.55]; hg = 1.8; gable = false; break;
        case 13: wall = [0.75, 0.85, 0.84]; hg = 2.6; break;
        case 14: wall = [0.6, 0.62, 0.62]; hg = 2.5; gable = false; break;
        case 15: wall = [0.5, 0.48, 0.45]; hg = 1.2; gable = false; break;
        default: wall = pick(PAL_HOUSE); hg = lv ? 2.8 * lv : 3.6; light = 0.3;
      }
      if (snowy) roof = mix3(roof, SNOW, 0.85);
      const H = hg + rise;
      if (gable) m.house(x, base, z, w, l, H, ry, wall, roof, pitch, cap); else m.box(x, base, z, w, H, l, wall, ry, roof);
      if (ty === 11){ const e = l / 2 - Math.min(3, l / 4); m.box(x + ca * e, base, z + sa * e, Math.min(4, w * 0.5), H + 6, Math.min(4, w * 0.5), wall, ry); m.spire(x + ca * e, base + H + 6, z + sa * e, Math.min(2.2, w * 0.28), 9, roof); }
      const lit = light && hash(i * 13 + 5) < light;
      if (!detail){ if (lit) L.push(x, base + Math.min(H, 9) * 0.55, z); continue; }
      // ---- details: chimney, windows, doors (only close to the boat)
      const floor = base + rise + 0.45, roofH = gable ? Math.min(w * pitch, cap) : 0;
      if ((ty === 1 || ty === 4) && hash(i * 5 + 1) < 0.75){ const e = (hash(i * 3 + 7) - 0.5) * l * 0.5; m.box(x + ca * e + sa * w * 0.12, base + H, z + sa * e - ca * w * 0.12, 0.7, roofH * 0.75 + 1.1, 0.7, hash(i) < 0.5 ? [0.42, 0.2, 0.16] : [0.32, 0.33, 0.34], ry); }
      const wins = (along, half, nx, nz, ux, uz, rows, ww, wh, gap, doorSlot) => {
        const n = Math.max(1, Math.min(16, Math.floor((along - 1.2) / gap)));
        for (let r = 0; r < rows.length; r++) for (let k = 0; k < n; k++){
          const t = (k + 0.5) / n - 0.5, px = x + nx * (half + 0.05) + ux * t * (along - 1.4), pz = z + nz * (half + 0.05) + uz * t * (along - 1.4);
          if (r === 0 && k === doorSlot){ D.panel(px, floor + 1.05, pz, ux, uz, 1.05, 2.1, DOORS[Math.floor(hash(i * 17) * DOORS.length) % DOORS.length]); continue; }
          D.panel(px, rows[r], pz, ux, uz, ww + 0.26, wh + 0.26, FRAME);
          const g = lit && hash(i * 31 + r * 7 + k) < 0.7 ? GLm : GD;
          g.panel(px + nx * 0.03, rows[r], pz + nz * 0.03, ux, uz, ww, wh, g === GLm ? WARM : BGLASS);
        }
      };
      const flo = H - rise, rowsFor = (per, first) => { const r = []; for (let y = first; y < flo - 0.9 && r.length < 12; y += per) r.push(floor + y); return r; };
      const bx = -sa, bz = ca, dside = hash(i * 19) < 0.5 ? 1 : -1;
      if (ty === 1 || ty === 0 || ty === 4 || ty === 11){
        const cab = ty === 4, ch = ty === 11, rows = ch ? [floor + 2.6] : rowsFor(2.7, 1.25), ww = cab ? 0.9 : ch ? 1.1 : 1.0, wh = cab ? 1.0 : ch ? 2.6 : 1.25;
        wins(l, w / 2, bx * dside, bz * dside, ca, sa, rows, ww, wh, ch ? 3.2 : 2.8, ch ? -1 : 0);
        wins(l, w / 2, -bx * dside, -bz * dside, ca, sa, rows, ww, wh, ch ? 3.2 : 2.8, -1);
        if (!ch){ wins(w, l / 2, ca, sa, bx, bz, rows, ww, wh, 3, -1); wins(w, l / 2, -ca, -sa, bx, bz, rows, ww, wh, 3, -1); }
        if (gable && roofH > 2.2 && !ch){ for (const e of [1, -1]){ D.panel(x + ca * e * (l / 2 + 0.05), base + H + roofH * 0.35, z + sa * e * (l / 2 + 0.05), bx, bz, 1.1, 1.0, FRAME); GD.panel(x + ca * e * (l / 2 + 0.08), base + H + roofH * 0.35, z + sa * e * (l / 2 + 0.08), bx, bz, 0.85, 0.75, BGLASS); } }
      } else if (ty === 2 || ty === 9 || ty === 10){
        const rows = rowsFor(3, 1.5), big = ty === 9;
        for (const sd of [1, -1]){ wins(l, w / 2, bx * sd, bz * sd, ca, sa, rows, big ? 2.2 : 1.4, big ? 1.8 : 1.5, big ? 3.2 : 2.6, sd === dside ? 0 : -1); wins(w, l / 2, ca * sd, sa * sd, bx, bz, rows, 1.4, 1.5, 2.8, -1); }
      } else if (ty === 8){
        for (const sd of [1, -1]) wins(l, w / 2, bx * sd, bz * sd, ca, sa, [base + H - 1.6], 1.8, 0.8, 5, -1);
        const e = dside * (l / 2 + 0.06); D.panel(x + ca * e, floor + 1.9, z + sa * e, bx, bz, Math.min(5, w * 0.5), 3.8, [0.7, 0.72, 0.72]);
      } else if (ty === 3 || ty === 5 || ty === 6){
        const e = dside * (l / 2 + 0.06), dw = ty === 3 ? Math.min(2.6, w * 0.7) : ty === 5 ? Math.min(2.8, w * 0.6) : Math.min(3.6, w * 0.45), dh = ty === 6 ? 3.4 : 2.2;
        D.panel(x + ca * e, base + rise + dh / 2 + 0.1, z + sa * e, bx, bz, dw, dh, ty === 3 ? [0.85, 0.85, 0.83] : mix3(wall, [0.1, 0.08, 0.07], 0.45));
        if (ty === 6) wins(l, w / 2, bx, bz, ca, sa, [floor + 1.6], 0.8, 0.7, 4, -1);
      }
    }
    addTrees(m, key, srcs, snowy);
    const o = c.o = [gridKeyX(key) * 1000, gridKeyY(key) * 1000];
    c.mesh = m.p.length ? m.mesh(o) : null;
    const RM = MB(); addRoads(RM, key, snowy); if (RM.p.length) c.rd = RM.mesh(o);
    if (detail){ if (D.p.length) c.dm = D.mesh(o); if (GD.p.length) c.gd = GD.mesh(o); if (GLm.p.length) c.gl = GLm.mesh(o); }
    if (L.length){ c.lights = buf(relTo(L, o)); c.nl = L.length / 3; }
    return c;
  }
  // trees: birch woods below the tree line with some pine, kept off roads and buildings; colours follow the season
  const treeSeason = () => { const mo = gDate(S.t / 60).getUTCMonth(); return mo >= 5 && mo <= 7 ? 1 : mo === 8 ? 2 : 0; };
  function addTrees(m, key, srcs, snowy){
    const gz = gridKeyY(key), gx = gridKeyX(key), x0 = gx * 1000, z0 = gz * 1000, occ = new Uint8Array(1600);
    const mark = (x, z, r) => { const cx = Math.floor((x - x0) / 25), cz = Math.floor((z - z0) / 25); for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++){ const i = cx + b, j = cz + a; if (i >= 0 && j >= 0 && i < 40 && j < 40) occ[j * 40 + i] = 1; } };
    for (const [B, idx] of srcs) for (const i of idx) mark(B.x[i], B.z[i], Math.max(B.l[i], B.w[i]) > 30 ? 2 : 1);
    for (const r of roadsIn(x0 - 30, z0 - 30, x0 + 1030, z0 + 1030)){ for (let j = 1; j < r.xs.length; j++){ const L = Math.hypot(r.xs[j] - r.xs[j - 1], r.zs[j] - r.zs[j - 1]), n = Math.ceil(L / 12); for (let q = 0; q <= n; q++) mark(r.xs[j - 1] + (r.xs[j] - r.xs[j - 1]) * q / n, r.zs[j - 1] + (r.zs[j] - r.zs[j - 1]) * q / n, 0); } }
    const ses = treeSeason(), leaf = ses === 1 ? [0.15, 0.29, 0.11] : ses === 2 ? [0.7, 0.48, 0.12] : [0.55, 0.5, 0.47], pine = [0.06, 0.15, 0.08], trunk = [0.78, 0.76, 0.7];
    let count = 0;
    for (let j = 0; j < 30 && count < 260; j++) for (let i = 0; i < 30 && count < 260; i++){
      const hh = hash((gx * 7919 + gz * 104729) * 900 + j * 30 + i), x = x0 + (i + 0.15 + 0.7 * hash(hh * 1e7 | 0)) * 33.3, z = z0 + (j + 0.15 + 0.7 * hash((hh * 3e7 | 0) + 5)) * 33.3;
      if (occ[Math.floor((z - z0) / 25) * 40 + Math.floor((x - x0) / 25)] || onUnit(x, z, 8)) continue;
      const h = terrH(x, z); if (h < 2.5 || h > 330) continue;
      const sl = Math.hypot(terrH(x + 10, z) - terrH(x - 10, z), terrH(x, z + 10) - terrH(x, z - 10)) / 20; if (sl > 0.75) continue;
      const LF = MAPD.L.forest, fc = Math.floor(x / (LF.c * 1000)), fr = Math.floor(z / (LF.c * 1000)), fo = HG && mapViewIn({x:x / 1000, y:z / 1000}) && mapIn(LF, fc, fr) && rcell(LF, fc, fr) ? 1 : 0;
      const pr = (1 - sstep(210, 330, h)) * (1 - sstep(0.42, 0.75, sl)) * (fo ? 0.95 : 0.5) * sstep(0.36, 0.62, noise2(x / 260, z / 260, 31) * 0.7 + noise2(x / 60, z / 60, 37) * 0.3);
      if (hash((hh * 5e7 | 0) + 11) > pr) continue;
      const th = 4 + 6 * hash((hh * 9e7 | 0) + 13) * (1 - sstep(120, 320, h) * 0.55), y = h - 0.3, isPine = hash((hh * 2e7 | 0) + 17) < 0.18, v = 0.88 + 0.24 * hash((hh * 4e7 | 0) + 19);
      if (isPine){
        const col = mix3(snowy ? mix3(pine, SNOW, 0.35) : pine, [0, 0, 0], 0), r = th * 0.24, top = [x, y + th, z], pts = [0, 1, 2, 3, 4].map(k => { const a = k * 1.2566 + hh * 6; return [x + Math.cos(a) * r, y + th * 0.15, z + Math.sin(a) * r]; });
        m.box(x, y, z, 0.3, th * 0.2, 0.3, [0.35, 0.25, 0.18], 0); for (let k = 0; k < 5; k++) m.tri(top, pts[k], pts[(k + 1) % 5], col.map(c => c * v));
      } else {
        const col = (snowy && ses === 0 ? mix3(leaf, SNOW, 0.3) : leaf).map(c => c * v), dk = col.map(c => c * (ses === 0 ? 0.85 : 0.72)), r = th * (ses === 0 ? 0.24 : 0.36), yc = y + th * 0.6, top = [x, y + th, z], bot = [x, y + th * 0.32, z], pts = [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2 + hh * 6; return [x + Math.cos(a) * r, yc, z + Math.sin(a) * r]; });
        m.box(x, y, z, 0.2, th * 0.5, 0.2, trunk, 0); for (let k = 0; k < 4; k++){ m.tri(top, pts[k], pts[(k + 1) % 4], col); m.tri(bot, pts[(k + 1) % 4], pts[k], dk); }
      }
      count++;
    }
  }
  function addRoads(m, key, snowy){
    const gz = gridKeyY(key), gx = gridKeyX(key), x0 = gx * 1000, z0 = gz * 1000, W = [7.5, 6.5, 5.5, 5, 3.6];
    const col = snowy ? [0.5, 0.52, 0.55] : [0.4, 0.42, 0.44], edge = snowy ? [0.62, 0.63, 0.65] : [0.55, 0.54, 0.5];
    for (const r of roadsIn(x0, z0, x0 + 1000, z0 + 1000)){
      const hw = W[r.c] / 2;
      for (let j = 1; j < r.xs.length; j++){
        const ax = r.xs[j - 1], az = r.zs[j - 1], bx2 = r.xs[j], bz2 = r.zs[j], mx = (ax + bx2) / 2, mz = (az + bz2) / 2;
        if (mx < x0 || mx >= x0 + 1000 || mz < z0 || mz >= z0 + 1000) continue;
        const L = Math.hypot(bx2 - ax, bz2 - az); if (L < 0.5) continue;
        const ux = (bx2 - ax) / L, uz = (bz2 - az) / L, px = -uz, pz = ux, n = Math.max(1, Math.ceil(L / 10));
        for (let q = 0; q < n; q++){
          const s0 = q / n, s1 = (q + 1) / n, e0 = q === 0 ? -hw * 0.5 : 0, e1 = q === n - 1 ? hw * 0.5 : 0;
          const x0s = ax + (bx2 - ax) * s0 + ux * e0, z0s = az + (bz2 - az) * s0 + uz * e0, x1s = ax + (bx2 - ax) * s1 + ux * e1, z1s = az + (bz2 - az) * s1 + uz * e1;
          const y0 = Math.max(Math.max(terrH(x0s, z0s), 0.2) + 0.3, moundTop(x0s, z0s) + 0.08), y1 = Math.max(Math.max(terrH(x1s, z1s), 0.2) + 0.3, moundTop(x1s, z1s) + 0.08);
          m.quad([x0s + px * hw, y0, z0s + pz * hw], [x1s + px * hw, y1, z1s + pz * hw], [x1s - px * hw, y1, z1s - pz * hw], [x0s - px * hw, y0, z0s - pz * hw], col);
          if (r.c <= 1) for (const sd of [1, -1]) m.quad([x0s + px * sd * (hw - 0.35), y0 + 0.02, z0s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.35), y1 + 0.02, z1s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.55), y1 + 0.02, z1s + pz * sd * (hw - 0.55)], [x0s + px * sd * (hw - 0.55), y0 + 0.02, z0s + pz * sd * (hw - 0.55)], edge);
        }
      }
    }
  }
  function freeChunk(c){ const del = mm => { if (mm.parts) mm.parts.forEach(del); else { gl.deleteBuffer(mm.pb); gl.deleteBuffer(mm.cb); } }; for (const mm of [c.rd, c.mesh, c.dm, c.gd, c.gl]) if (mm) del(mm); if (c.lights) gl.deleteBuffer(c.lights); }
  function updateChunks(maxBuilds){
    if (!NEARM) return;
    const sf = (snowNow < 80 ? 1 : 0) + 10 * treeSeason();
    if (sf !== chunkSnow){ for (const c of CH.values()) freeChunk(c); CH.clear(); chunkSnow = sf; }
    const half = NEARM.sx / 2 - 400, cx = NEARM.cx, cz = NEARM.cz;
    const want = (mx, mz) => Math.hypot(mx - bv.x, mz - bv.z) < 1300;
    for (const [k, c] of CH) if (Math.abs(c.x - cx) > half + 700 || Math.abs(c.z - cz) > half + 700 || (c.mesh && c.detail !== want(c.x, c.z))){ freeChunk(c); CH.delete(k); }
    const cand = [];
    for (let gz = Math.floor((cz - half) / 1000); gz <= Math.floor((cz + half) / 1000); gz++) for (let gx = Math.floor((cx - half) / 1000); gx <= Math.floor((cx + half) / 1000); gx++){
      const k = gridKey(gx, gz); if (CH.has(k)) continue;
      const mx = gx * 1000 + 500, mz = gz * 1000 + 500; cand.push([Math.hypot(mx - bv.x, mz - bv.z), k, mx, mz]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < Math.min(maxBuilds, cand.length); i++){ const [, k, mx, mz] = cand[i]; const c = buildChunk(k, want(mx, mz)); c.x = mx; c.z = mz; CH.set(k, c); }
  }
  function drawBuildings(TM){
    for (const c of CH.values()) if (c.mesh) drawLit(c.mesh, TM);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-2, -4); for (const c of CH.values()) if (c.rd) drawLit(c.rd, TM);
    gl.polygonOffset(-1, -2); for (const c of CH.values()) if (c.dm) drawLit(c.dm, TM);
    gl.polygonOffset(-2, -4); for (const c of CH.values()) if (c.gd) drawLit(c.gd, TM);
    // lit windows: dark glass by day, warm glow after dark
    const u = PL.u; gl.uniform4fv(u.uOver, [BGLASS[0], BGLASS[1], BGLASS[2], 1 - env.night]); gl.uniform1f(u.uEmis, env.night * 1.6);
    for (const c of CH.values()) if (c.gl) drawLit(c.gl, TM);
    gl.uniform4fv(u.uOver, [0, 0, 0, 0]); gl.uniform1f(u.uEmis, 0);
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }
  const LCOL = {w:[1, 0.93, 0.78], r:[1, 0.14, 0.1], g:[0.12, 1, 0.42], y:[1, 0.82, 0.2]};
  const LPER = SEAMARKS.lights.map((L, i) => { const per = L[4].reduce((a, v) => a + Math.abs(v), 0) || 1; return {per, ph:hash(i * 31 + 7) * per}; });
  function lightOn(i, t){ const L = SEAMARKS.lights[i], P = LPER[i]; let tm = (t + P.ph) % P.per; for (const v of L[4]){ const d = Math.abs(v); if (tm < d) return v > 0; tm -= d; } return false; }
  function drawSeaLights(VP, eye, t, near){
    if (env.night < 0.05) return;
    const by = {w:[], r:[], g:[], y:[]};
    SEAMARKS.lights.forEach((L, i) => {
      const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d > L[3] * 1852 * 1.3 + 500 || (near ? d > lightNF : d < lightNF * 0.8)) return;
      if (!lightOn(i, t)) return;
      const brg = trueDeg(Math.atan2(x - eye[0], -(z - eye[2])), {x:L[0], y:L[1]});   // the sectors are true bearings
      const sec = L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1]); if (!sec) return;
      by[sec[2]].push(x - eye[0], Math.max(terrH(x, z), 0.2) + L[2] - eye[1], z - eye[2], Math.min(1, env.night * 1.2));
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const k in by){ const a = by[k], n = a.length / 4; if (!n) continue; for (let i = 0; i < n; i++){ PB[i * 3] = a[i * 4]; PB[i * 3 + 1] = a[i * 4 + 1]; PB[i * 3 + 2] = a[i * 4 + 2]; PA[i] = a[i * 4 + 3]; } drawPts(n, gl.POINTS, VP, LCOL[k], near ? 3800 : 8000, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  let lightNF = 3000;
  // ---------- lights that light up round them at night (the user's wish 03.10.2026) ----------
  // Each frame the nearest are picked for the shaders (PLG): the boat's own deck light, the sea lights near by while they shine (a
  // lighthouse further than a beacon), the floodlights over the quays; on «Lav» only two. pickLights fills PLA (x, y, z from the eye,
  // reach) and PCA (colour x strength), plSet uploads them to a program that has them.
  const PLA = new Float32Array(32), PCA = new Float32Array(24), PLC = []; let NOPL = false;
  function pickLights(eye, t){
    PLA.fill(0); PCA.fill(0); PLC.length = 0; PLN = 0; if (NOPL || env.night < 0.05 || !SEAMARKS) return;
    const nt = env.night, cand = PLC, add = (k, x, y, z, R, c, s) => { if (Math.abs(x - eye[0]) > R + 2500 || Math.abs(z - eye[2]) > R + 2500) return; cand.push([k, x, y, z, R, c[0] * s * nt, c[1] * s * nt, c[2] * s * nt]); };
    // your own boat: a work light over the deck at the wheelhouse's top
    add(-1e9, bv.x, bv.y + 3.2, bv.z, 26, [1, 0.94, 0.82], 1.3);
    SEAMARKS.lights.forEach((L, i) => {
      const x = L[0] * 1000, z = L[1] * 1000; if (Math.abs(x - eye[0]) > 3500 || Math.abs(z - eye[2]) > 3500 || !lightOn(i, t)) return;
      const c = LCOL[(L[5].find(q => q[2] === 'w') || L[5][0] || [0, 0, 'w'])[2]] || LCOL.w, R = L[6] === 'M' || L[3] >= 10 ? 170 : L[3] >= 6 ? 90 : 50;
      add(Math.hypot(x - eye[0], z - eye[2]) - R, x, Math.max(terrH(x, z), 0.2) + L[2], z, R, c, 2.4);
    });
    // the quays' floodlights, at the berth of each harbour near by
    for (const q of PORTS){
      const x = q.p.x * 1000, z = q.p.y * 1000; if (Math.abs(x - eye[0]) > 2500 || Math.abs(z - eye[2]) > 2500) continue;
      const bp = berthPose(q.id, vtype()), f = bp && bp.face; if (!f) continue;
      add(Math.hypot(f.x - eye[0], f.z - eye[2]) - 45, f.x - f.nx * 4, (env.tide || 0) + 9, f.z - f.nz * 4, 45, [1, 0.84, 0.62], 1.0);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const n = PLN = Math.min(cand.length, QUAL.lvl === 0 ? 2 : QUAL.lvl === 1 ? 4 : 8);
    for (let i = 0; i < n; i++){ const c = cand[i]; PLA[i * 4] = c[1] - eye[0]; PLA[i * 4 + 1] = c[2] - eye[1]; PLA[i * 4 + 2] = c[3] - eye[2]; PLA[i * 4 + 3] = c[4]; PCA[i * 3] = c[5]; PCA[i * 3 + 1] = c[6]; PCA[i * 3 + 2] = c[7]; }
  }
  let PLN = 0;
  function plSet(u){ if (u.uPL){ gl.uniform4fv(u.uPL, PLA); gl.uniform3fv(u.uPC, PCA); gl.uniform1f(u.uNPL, PLN); } }
  // The lighthouses' beams sweeping round at night: the big lights (a lighthouse, or a range of 10 nautical miles or more) turn two
  // beams, once round in the light's period, drawn as crossed fans that fade along their length. (Most Norwegian lights are sector
  // lights that do not turn; this is for the look the user asked for.)
  let PBM = null, BMB = null, BMN = 0; const BMV = new Float32Array(4 * 2 * 6 * 4 * 4);
  function drawBeams(VP, eye, t){
    BMN = 0; if (env.night < 0.1 || !SEAMARKS) return;
    let k = 0; const put = (p, a) => { BMV[k++] = p[0]; BMV[k++] = p[1]; BMV[k++] = p[2]; BMV[k++] = a; };
    SEAMARKS.lights.forEach((L, i) => {
      if (!(L[6] === 'M' || L[3] >= 10) || k >= BMV.length - 96) return;
      const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d > 25000) return;
      const y = Math.max(terrH(x, z), 0.2) + L[2] - eye[1], o = [x - eye[0], y, z - eye[2]], per = Math.max(6, LPER[i].per * 2), th0 = (t / per + LPER[i].ph) * Math.PI * 2;
      const a0 = 0.32 * env.night * (0.6 + 0.4 * Math.min(1, env.fogD * 2500)), Lb = 1600, w0 = 1.2, w1 = 70;
      for (const th of [th0, th0 + Math.PI]){
        const fx = Math.sin(th), fz = -Math.cos(th), rx = Math.cos(th), rz = Math.sin(th), far = [o[0] + fx * Lb, o[1] - 6, o[2] + fz * Lb];
        // across (flat) and up (standing): two triangles each
        for (const [sx, sy, sz] of [[rx, 0, rz], [0, 1, 0]]){
          const A = [o[0] - sx * w0, o[1] - sy * w0, o[2] - sz * w0], B = [o[0] + sx * w0, o[1] + sy * w0, o[2] + sz * w0], C = [far[0] + sx * w1, far[1] + sy * w1 * 0.5, far[2] + sz * w1], Dd = [far[0] - sx * w1, far[1] - sy * w1 * 0.5, far[2] - sz * w1];
          put(A, a0); put(B, a0); put(C, 0); put(A, a0); put(C, 0); put(Dd, 0);
        }
      }
    });
    BMN = k / 96; if (!k) return;
    if (!PBM) PBM = program('attribute vec3 aPos;attribute float aA;uniform mat4 uVP;varying float vA;void main(){vA=aA;gl_Position=uVP*vec4(aPos,1.0);}',
      'precision mediump float;uniform vec3 uCol;varying float vA;void main(){gl_FragColor=vec4(uCol*vA,1.0);}', ['aPos', 'aA']);
    if (!BMB) BMB = gl.createBuffer();
    gl.useProgram(PBM.p); gl.uniformMatrix4fv(PBM.u.uVP, false, VP); gl.uniform3fv(PBM.u.uCol, [1, 0.93, 0.78]);
    gl.bindBuffer(gl.ARRAY_BUFFER, BMB); gl.bufferData(gl.ARRAY_BUFFER, BMV.subarray(0, k), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, k / 4);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.disableVertexAttribArray(1);
  }
  function drawChunkLights(VP, eye){
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uPull, 12); gl.uniform3fv(u.uCol, [1, 0.78, 0.42]); gl.uniform1f(u.uSize, 4200); gl.uniform1f(u.uRound, 1);
    gl.disableVertexAttribArray(1); gl.vertexAttrib1f(1, env.night * 0.9);
    for (const c of CH.values()) if (c.lights){ gl.uniform3fv(u.uOff, [c.o[0] - eye[0], -eye[1], c.o[1] - eye[2]]); attr(0, c.lights, 3); gl.drawArrays(gl.POINTS, 0, c.nl); }
  }

  // ---------- the harbour unit (tools/harbour/kaimottak.py): quay, fish plant, crane, forklift, ice silo and bunker station in one ----------
  // One model for every harbour with a plant (UNITS, 01-world.js): drawn in full within 900 m and in its simple version further out.
  // Its moving parts (the crane's slewing column, the boom and its extension, the hook, the forklift and its forks, the roller door
  // and the ice chute) stand at rest in every harbour, and the plant nearest the camera works them (drawPlant).
  let UMOD = null;
  function unitModel(){
    if (UMOD !== null) return UMOD;
    const G = glbHas('harbour') ? glbLoad('harbour') : null; if (!G || !G.parts.lod0){ UMOD = false; return UMOD; }
    const P = G.parts, gl0 = P.glass || {p:[], n:[], c:[]};
    UMOD = {near:upA({p:P.lod0.p.concat(gl0.p), n:P.lod0.n.concat(gl0.n), c:P.lod0.c.concat(gl0.c)}), far:upA(P.lod1), house:upA(P.crane_house), boom1:upA(P.crane_boom1), boom2:upA(P.crane_boom2),
      hook:upA(P.crane_hook), truck:upA(P.truck), forks:upA(P.truck_forks), door:upA(P.door), chute:upA(P.chute), A:G.ex.anchors};
    return UMOD;
  }
  // the unit's frame: a point [x, y, z] in it, in the world; the model's matrix (eye-relative)
  const unitP = (U, p) => { const w = unitW(U, p[0], p[2]); return [w[0], p[1], w[1]]; };
  const unitMat = (U, eye) => chain(M4.T(U.o[0] - eye[0], -eye[1], U.o[1] - eye[2]), M4.RY(Math.atan2(-U.u[1], U.u[0])));
  // on the unit's ground: the block (m out round it) or its basin
  function onUnit(x, z, m){ for (const U of UNITA){ if (Math.abs(x - U.o[0]) > 120 || Math.abs(z - U.o[1]) > 120) continue; const [lx, lz] = unitL(U, x, z), ax = Math.abs(lx);
    if ((ax <= UNIT.E + m && lz <= m && lz >= -UNIT.B - m) || (ax <= UNIT.basinX && lz >= 0 && lz <= UNIT.basinZ)) return U; } return null; }
  // The crane's pose {a: the boom's heading in the world, r: the radius from the column, hook: the hook's height} as the column's slew,
  // the boom's angle up (it rises to reach in close and keeps the tip at least 2.6 m over the heel) and how far the extension runs out
  function craneGeo(P, q){
    const C = P.ucrane, L = clamp(Math.hypot(q.r, 2.6), C.L1, C.L1 + C.ext), th = Math.acos(clamp(q.r / L, 0, 1)), Lh = L * Math.cos(th);
    return {th, e:L - C.L1, tip:[P.crane[0] + Math.sin(q.a) * Lh, C.heelY + L * Math.sin(th), P.crane[1] + Math.cos(q.a) * Lh]};
  }
  // the unit's moving parts: the crane at pose q, the forklift st {x, z, h, fl, loads}, the door open by k (0-1), the chute at angle
  // ch (in the unit's frame, 0 = straight out over the berth); what hangs from the hook is drawn by the caller
  function drawUnitParts(P, eye, q, st, k, ch){
    const M = unitModel(), U = P.unit, A = M.A, rel = p => [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]], g = craneGeo(P, q);
    const base = rel([P.crane[0], A.crane.base[1], P.crane[1]]), heel = rel([P.crane[0], A.crane.heel[1], P.crane[1]]);
    drawN(M.house, chain(M4.T(base[0], base[1], base[2]), M4.RY(q.a)));
    const BM = chain(M4.T(heel[0], heel[1], heel[2]), M4.RY(q.a), M4.RX(-g.th)); drawN(M.boom1, BM); drawN(M.boom2, chain(BM, M4.T(0, 0, g.e)));
    // the hook's block hangs so its bottom is 0.1 m over the load's top at q.hook (landScene's heights)
    const tip = rel(g.tip), hk = [tip[0], q.hook + 0.62 - eye[1], tip[2]]; drawN(PM.wire, limbM([tip[0], tip[1] - 0.2, tip[2]], hk, 0.012)); drawN(M.hook, chain(M4.T(hk[0], hk[1], hk[2]), M4.RY(q.a)));
    const fy = P.gy([st.x, st.z]), FM = chain(M4.T(st.x - eye[0], fy - eye[1], st.z - eye[2]), M4.RY(-st.h)), lift = 0.05 + st.fl * 0.45;
    drawN(M.truck, FM); drawN(M.forks, chain(FM, M4.T(0, lift, 0))); { let y = 0.17 + lift; for (const L of st.loads || []){ drawN(L.mesh, chain(FM, M4.T(0, y, -1.5))); y += L.h; } }
    const UM = unitMat(U, eye), D = A.door.top, sk = 1 - 0.94 * k; drawN(M.door, chain(UM, M4.T(D[0], D[1], D[2]), new Float32Array([1,0,0,0, 0,sk,0,0, 0,0,1,0, 0,0,0,1])));
    const S0 = A.silo.axis; drawN(M.chute, chain(UM, M4.T(S0[0], S0[1], S0[2]), M4.RY(ch)));
    return {tip:g.tip, hk};
  }
  // the units' quays and buildings: far ones in their simple version; near ones in full with their moving parts at rest, but for the
  // plant that works them (skip)
  function drawUnits(eye, VP, near, far, skip){
    const M = unitModel(); if (!M) return; nSetup(VP);
    for (const U of UNITA){
      const d = Math.hypot(U.o[0] - eye[0], U.o[1] - eye[2]); if (d > far) continue;
      const full = near && d < 900; drawN(full ? M.near : M.far, unitMat(U, eye));
      const P = full && U.id !== skip && PLANTS.find(q => q.id === U.id); if (P) drawUnitParts(P, eye, craneIdle(P, 0), fkRest(P), 0, P.chRest);
    }
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // ---------- fish plants: the harbour unit's crane, forklift, door and chute at work, and the people on the quay ----------
  const PLANTS = []; let PM = null;
  function plantLayout(pt){
    const U = UNITS[pt.id], M = unitModel(), bp = berthPose(pt.id, 'skiff'); if (!U || !M || !bp) return null;
    const A = M.A, f = bp.face, u = [f.ux, f.uz], n = [f.nx, f.nz], at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o], W = p => unitW(U, p[0], p[2]);
    const onQuay = p => { const [lx, lz] = unitL(U, p[0], p[1]); return Math.abs(lx) <= UNIT.E + 0.1 && lz <= 0.1 && lz >= -UNIT.B - 0.1; };
    const gy = p => onQuay(p) ? QTOP : Math.max(0.4, terrH(p[0], p[1]));
    const P = {id:pt.id, unit:U, bp, f, u, n, depth:UNIT.B, at, gy, onQuay, drop:W(A.drop), crane:W(A.crane.base), door:W(A.door.top), dn:n, du:u, dy:QTOP,
      ucrane:{L1:A.crane.boom1, ext:A.crane.ext, heelY:A.crane.heel[1]}, lamps:A.lamps.map(q => { const w = W(q); return [w[0], w[1], q[1]]; }), stacks:A.stacks.map(W), park:W(A.truck.wait),
      ws:Object.fromEntries(Object.entries(A.workers).map(([k, q]) => [k, W(q)])), chRest:Math.PI / 2};
    return P;
  }
  function buildPlants(){
    PLANTS.length = 0;
    const M = unitModel(), ry = U => Math.atan2(U.n[0], U.n[1]);
    for (const pt of PORTS){
      if (!pt.mottak) continue; const P = plantLayout(pt); if (!P) continue; PLANTS.push(P);
      // the camera stays out of the quay's block, the plant, the silo and the tank
      for (const [cx, cz, sx, sz, y0, y1] of M.A.solids){ const c = unitW(P.unit, cx, cz); camSolid(c[0], c[1], sx, sz, ry(P.unit), y0, y1); }
    }
  }
  // the moving parts, built once and drawn with a transform; the workers are drawn joint by joint
  function buildPlantParts(){
    const mk = f => { const b = NB(); f(b); return b.mesh(); }, unit = k => mk(b => b.tube([[0, 0, 0], [0, 0, 1]], 1, k, 6));
    const DK = [0.14, 0.15, 0.17, 0.2], VEST = [1, 0.45, 0.06, 0.3], REFL = [0.9, 0.95, 0.9, 0.6], SKIN = [0.86, 0.66, 0.52, 0.1];
    PM = {W:glbHas('worker') ? {hw:wkMeshes('hw'), crew:wkMeshes('crew')} : null,
      leg:unit([0.16, 0.18, 0.22, 0.1]), arm:unit(VEST), wire:unit([0.1, 0.1, 0.1, 0.3]), fhose:unit([0.06, 0.06, 0.07, 0.35]), broom:unit([0.55, 0.4, 0.25, 0.05]), hose:unit([0.2, 0.55, 0.25, 0.3]),
      torso:mk(b => { b.box(0, 0, 0, 0.42, 0.56, 0.26, VEST); b.box(0, 0.16, 0, 0.43, 0.06, 0.27, REFL); b.box(0, 0.34, 0, 0.43, 0.06, 0.27, REFL); }),
      head:mk(b => { b.box(0, 0, 0, 0.2, 0.22, 0.22, SKIN); b.box(0, 0.2, 0, 0.26, 0.09, 0.28, [0.95, 0.95, 0.92, 0.5]); b.box(0, 0.19, -0.14, 0.24, 0.03, 0.08, [0.95, 0.95, 0.92, 0.5]); }),
      hand:mk(b => b.box(0, -0.05, 0, 0.09, 0.1, 0.09, [0.9, 0.9, 0.2, 0.2])), boot:mk(b => b.box(0, 0, -0.05, 0.13, 0.12, 0.28, DK)),
      cup:mk(b => b.box(0, 0, 0, 0.08, 0.1, 0.08, [0.95, 0.95, 0.95, 0.4])), fbox:mk(b => b.box(0, 0, 0, 0.78, 0.28, 0.38, [0.18, 0.4, 0.74, 0.25])),
      // a landing's loads: a pallet with 1 to 9 boxes of fish, or a 460 litre tub with ice on top of the fish
      palN:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(nb => mk(b => { b.box(0, 0, 0, 1.2, 0.14, 0.8, [0.66, 0.53, 0.36, 0.05]); for (let k = 0; k < nb; k++) b.box((k % 3 - 1) * 0.4, 0.14 + Math.floor(k / 3) * 0.29, 0, 0.38, 0.28, 0.78, [0.18, 0.4, 0.74, 0.25]); })),
      tub:mk(b => { b.box(0, 0, 0, 1.2, 0.85, 1.0, [0.2, 0.36, 0.62, 0.25]); b.box(0, 0.84, 0, 1.24, 0.05, 1.04, [0.16, 0.3, 0.52, 0.25]); b.box(0, 0.8, 0, 1.08, 0.06, 0.88, [0.93, 0.96, 0.98, 0.5]); }),
      board:mk(b => b.box(0, 0, 0, 0.24, 0.3, 0.02, [0.92, 0.9, 0.84, 0.1])),
      // on deck: the bleeding tub with its bloody water, the gutting table, a cod in the hand, a gob of offal, a bare head
      btub:mk(b => { b.box(0, 0, 0, 0.95, 0.55, 0.7, [0.2, 0.38, 0.62, 0.25]); b.box(0, 0.47, 0, 0.87, 0.04, 0.62, [0.32, 0.08, 0.07, 0.6]); for (let k = 0; k < 4; k++) b.box((k % 2 - 0.5) * 0.4, 0.5, (k >> 1) * 0.3 - 0.15, 0.1, 0.06, 0.34, [0.5, 0.52, 0.45, 0.4]); }),
      gtable:mk(b => { b.box(0, 0.82, 0, 0.5, 0.05, 0.95, [0.72, 0.74, 0.76, 0.6]); for (const [x, z] of [[-0.2, -0.42], [0.2, -0.42], [-0.2, 0.42], [0.2, 0.42]]) b.box(x, 0, z, 0.04, 0.82, 0.04, [0.6, 0.62, 0.64, 0.5]); b.box(0, 0.87, 0.3, 0.1, 0.06, 0.3, [0.52, 0.55, 0.45, 0.4]); }),
      fish:mk(b => { b.box(0, 0, 0, 0.1, 0.09, 0.42, [0.5, 0.52, 0.44, 0.4]); b.box(0, 0.005, 0.25, 0.02, 0.1, 0.1, [0.45, 0.46, 0.4, 0.3]); }),
      slo:mk(b => b.box(0, 0, 0, 0.12, 0.06, 0.09, [0.45, 0.12, 0.1, 0.5])),
      headB:mk(b => { b.box(0, 0, 0, 0.2, 0.22, 0.22, SKIN); b.box(0, 0.2, 0, 0.23, 0.06, 0.24, [0.85, 0.25, 0.15, 0.1]); }), remote:mk(b => { b.box(0, 0, 0, 0.22, 0.1, 0.14, [0.95, 0.72, 0.08, 0.4]); b.box(0.06, 0.1, 0, 0.02, 0.12, 0.02, [0.1, 0.1, 0.1, 0.3]); })
    };
  }
  // a looping round of stations: stand a while doing the task, then walk to the next (speed in m/s)
  function roundAt(R, T){
    if (!R.seg){ let tot = 0; R.seg = R.st.map((a, i) => { const b = R.st[(i + 1) % R.st.length], wd = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1]) / (R.v || 1.2), s = [tot, a.d, wd, a, b]; tot += a.d + wd; return s; }); R.tot = tot; }
    const tt = ((T % R.tot) + R.tot) % R.tot;
    for (const [t0, d, wd, a, b] of R.seg){
      if (tt < t0 + d) return {x:a.p[0], z:a.p[1], h:a.h, task:a.task, walk:false, s:tt - t0, a};
      if (tt < t0 + d + wd){ const k = (tt - t0 - d) / wd; return {x:a.p[0] + (b.p[0] - a.p[0]) * k, z:a.p[1] + (b.p[1] - a.p[1]) * k, h:Math.atan2(b.p[0] - a.p[0], -(b.p[1] - a.p[1])), task:a.carry ? 'carry' : R.sweep ? 'sweep' : 'walk', walk:true, s:tt - t0 - d, a, k}; }
    }
    return {x:R.st[0].p[0], z:R.st[0].p[1], h:0, task:'stand', walk:false, s:0};
  }
  // the day's rounds at the quay: coiling at the bollards, hosing and stacking by the pallets, sweeping, coffee on the bench; the
  // forklift stands at its spot (the places are the unit's, clear of the forklift's route)
  function plantRounds(P){
    if (P.rounds) return P.rounds;
    const R = unitModel().A.rounds, W = q => unitW(P.unit, q[0], q[2]), face = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), along = Math.atan2(P.u[0], -P.u[1]);
    const c = R.coil.map(W), h = R.hose.map(W), sw = R.sweep.map(W), cf = R.coffee.map(W);
    return P.rounds = [
      {v:1.1, st:[{p:c[0], d:24, task:'coil', h:seaH}, {p:c[1], d:20, task:'coil', h:seaH}, {p:c[2], d:14, task:'look', h:seaH}]},
      {v:1.2, st:[{p:h[0], d:32, task:'hose', h:face(h[0], P.stacks[0]), carry:true}, {p:h[1], d:9, task:'stack', h:face(h[1], P.stacks[0])}]},
      {v:0.6, st:[{p:sw[0], d:1, task:'sweep', h:along, carry:false}, {p:sw[1], d:1, task:'sweep', h:along + Math.PI}], sweep:true},
      {v:1.0, st:[{p:cf[0], d:45, task:'coffee', h:seaH}, {p:cf[1], d:15, task:'look', h:seaH}]}
    ];
  }
  function drawWorker(P, st, eye, T, idx){
    const y = P.gy([st.x, st.z]), h = st.h, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], rel = (x, yy, z) => [x - eye[0], yy - eye[1], z - eye[2]];
    const W = (a, up, r) => rel(st.x + F[0] * a + R[0] * r, y + up, st.z + F[1] * a + R[1] * r);
    const ph = st.walk || st.task === 'sweep' ? (T * 6.5 + idx) : 0, sw = st.walk ? Math.sin(ph) : 0;
    // the detailed figure (tools/harbour/arbeider.py): the harbour workers in blue coveralls and hard hats, the crew on deck in oilskins
    const K = PM.W && PM.W[P.bare ? 'crew' : 'hw'];
    for (const s of [-1, 1]){ const hip = W(0, 0.92, s * 0.11), foot = W(sw * s * 0.28, 0.08 + Math.max(0, Math.cos(ph) * s) * 0.07 * (st.walk ? 1 : 0), s * 0.12), knee = [(hip[0] + foot[0]) / 2 + F[0] * 0.07, (hip[1] + foot[1]) / 2, (hip[2] + foot[2]) / 2 + F[1] * 0.07];
      if (K){ drawN(K.thigh, limbM(hip, knee, 1)); drawN(K.shin, limbM(knee, foot, 1)); drawN(K.boot, chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h))); continue; }
      drawN(PM.leg, limbM(hip, knee, 0.075)); drawN(PM.leg, limbM(knee, foot, 0.065)); drawN(PM.boot, chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h))); }
    const bend = st.task === 'hose' || st.task === 'coil' || st.task === 'stack' || st.task === 'gut' ? 0.12 : 0;
    const tc = W(bend * 0.4, 1.2, 0); drawN(K ? K.torso : PM.torso, chain(M4.T(tc[0], tc[1] - 0.28, tc[2]), M4.RY(-h), M4.RX(-bend)));
    const hd = W(bend, 1.6, 0), HM = chain(M4.T(hd[0], hd[1] - 0.1, hd[2]), M4.RY(-h + (st.task === 'look' ? Math.sin(T * 0.4 + idx) * 0.5 : 0)));
    if (K){ drawN(K.head, HM); drawN(K.hat, HM); } else drawN(P.bare ? PM.headB : PM.head, HM);
    let hands;
    const t = T + idx * 1.7;
    switch (st.task){
      case 'hose': hands = [W(0.45, 1.15, 0.12), W(0.3, 1.1, -0.1)]; break;
      case 'coil': { const a = t * 3; hands = [W(0.35 + Math.cos(a) * 0.12, 1.05 + Math.sin(a) * 0.15, 0.12), W(0.3, 1.0, -0.15)]; break; }
      case 'stack': { const k = (Math.sin(t * 1.4) + 1) / 2; hands = [W(0.35, 0.7 + k * 0.6, 0.2), W(0.35, 0.7 + k * 0.6, -0.2)]; break; }
      case 'carry': hands = [W(0.3, 1.0, 0.2), W(0.3, 1.0, -0.2)]; break;
      case 'sweep': { const k = Math.sin(t * 2.2) * 0.25; hands = [W(0.25 + k * 0.3, 1.0, 0.1 + k), W(0.35 + k * 0.3, 0.8, -0.05 + k)]; break; }
      case 'coffee': { const k = Math.max(0, Math.sin(t * 0.5)) ** 8; hands = [W(0.18 + (1 - k) * 0.1, 1.05 + k * 0.45, 0.14 - k * 0.1), W(0.05, 0.85, -0.25)]; break; }
      // at a landing: hand signals to the crane driver, reaching for a load coming down, unhooking it, counting, and the radio remote
      case 'signal': { const k = Math.sin(t * 3.2); hands = [W(0.2 + k * 0.06, 1.72, 0.32 + k * 0.12), W(0.25, 0.95, -0.22)]; break; }
      case 'guide': hands = [W(0.42, 1.62, 0.22), W(0.42, 1.62, -0.22)]; break;
      case 'unhook': hands = [W(0.38, 1.9, 0.08), W(0.35, 1.3, -0.18)]; break;
      case 'tally': { const k = Math.max(0, Math.sin(t * 0.9)) * 0.04; hands = [W(0.3, 1.12, 0.1), W(0.28 + k, 1.08, -0.12)]; break; }
      case 'remote': hands = [W(0.3, 1.05, 0.11), W(0.3, 1.05, -0.11)]; break;
      case 'nozzle': hands = [W(0.42, 0.85, 0.06), W(0.36, 0.98, -0.12)]; break;
      // gutting at the table: the knife hand works along the belly, every few seconds the offal goes over the rail
      case 'gut': { const c = (T % 3) / 3, thr = c > 0.7 && c < 0.85 ? Math.sin((c - 0.7) / 0.15 * Math.PI) : 0; hands = [W(0.42 + thr * 0.25, 0.95 + thr * 0.35, 0.16 + Math.sin(T * 7) * 0.07 * (1 - thr)), W(0.42, 0.9, -0.1)]; break; }
      default: hands = [W(-sw * 0.15, 0.82, 0.26), W(sw * 0.15, 0.82, -0.26)];
    }
    [0.21, -0.21].forEach((r, i) => { const sh = W(bend * 0.8, 1.42, r), hd2 = hands[i], el = [(sh[0] + hd2[0]) / 2 - F[0] * 0.05 + R[0] * r * 0.25, (sh[1] + hd2[1]) / 2 - 0.08, (sh[2] + hd2[2]) / 2 - F[1] * 0.05 + R[1] * r * 0.25];
      if (K){ const f = [hd2[0] - el[0], hd2[1] - el[1], hd2[2] - el[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1;
        drawN(K.uarm, limbM(sh, el, 1)); drawN(K.farm, limbM(el, hd2, 1)); drawN(K.hand, limbM(hd2, [hd2[0] + f[0] / fl, hd2[1] + f[1] / fl, hd2[2] + f[2] / fl], 1)); return; }
      drawN(PM.arm, limbM(sh, el, 0.06)); drawN(PM.arm, limbM(el, hd2, 0.055)); drawN(PM.hand, M4.T(hd2[0], hd2[1], hd2[2])); });
    if (st.task === 'coffee') drawN(PM.cup, M4.T(hands[0][0], hands[0][1] + 0.02, hands[0][2]));
    if (st.task === 'gut'){ const c = [(hands[0][0] + hands[1][0]) / 2, Math.min(hands[0][1], hands[1][1]) - 0.02, (hands[0][2] + hands[1][2]) / 2]; drawN(PM.fish, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2))); }
    if (st.task === 'tally' || st.task === 'remote'){ const c = [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2, (hands[0][2] + hands[1][2]) / 2]; drawN(st.task === 'tally' ? PM.board : PM.remote, chain(M4.T(c[0], c[1] - 0.05, c[2]), M4.RY(-h), M4.RX(st.task === 'tally' ? -0.5 : 0))); }
    if (st.task === 'carry' || st.task === 'stack'){ const c = [(hands[0][0] + hands[1][0]) / 2, (hands[0][1] + hands[1][1]) / 2 - 0.1, (hands[0][2] + hands[1][2]) / 2]; drawN(PM.fbox, chain(M4.T(c[0], c[1], c[2]), M4.RY(-h + Math.PI / 2))); }
    if (st.task === 'sweep'){ const top = hands[0], foot = [top[0] + F[0] * 0.55, y - eye[1] + 0.02, top[2] + F[1] * 0.55]; drawN(PM.broom, limbM(top, foot, 0.02)); drawN(PM.fbox, chain(M4.T(foot[0], foot[1], foot[2]), M4.RY(-h), M4.S(0.5))); }
    if (st.task === 'hose'){ const nz = hands[0]; drawN(PM.hose, limbM(W(-0.4, 0.05, 0.4), nz, 0.025));
      let k = 0; for (let i = 0; i < 40; i++){ const q = ((t * 1.3 + i / 40) % 1), d = q * 1.6; PB[k * 3] = nz[0] + F[0] * d + (hash(i) - 0.5) * 0.15 * q; PB[k * 3 + 1] = nz[1] + d * 0.25 - q * q * 1.3; PB[k * 3 + 2] = nz[2] + F[1] * d + (hash(i + 7) - 0.5) * 0.15 * q; PA[k] = 0.7 * (1 - q); k++; }
      P.spray = k; } 
  }
  // ---------- landing the catch ----------
  // The crane lifts the boxes (on pallets) or the tubs from the deck to the quay, the forklift takes two loads at a time into the
  // plant, and the people on the quay have their jobs: one signals at the edge, one takes the loads, one counts at the door and the
  // crane driver works the radio remote. It all follows the simulation's landing timeline (LANDING, game minutes), so the last load
  // is ashore when the landing note comes.
  const HOOK_UP = QTOP + 3.9;
  const ease = u => u * u * (3 - 2 * u), seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
  const loadH = (kind, nb) => kind === 'tub' ? 0.85 : 0.13 + Math.ceil(nb / 3) * 0.29;
  const craneIdle = (P, T) => ({a:Math.atan2(P.u[0], P.u[1]) + Math.sin(T * 0.05) * 0.25, r:5.5, hook:QTOP + 3.2});
  // the forklift at rest: at its spot east of the drop spot, forks towards it
  const fkRest = P => { const R = fkRun(P); return {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]}; };
  const poseTo = (P, x, z, hook) => ({a:Math.atan2(x - P.crane[0], z - P.crane[1]), r:Math.max(1.5, Math.hypot(x - P.crane[0], z - P.crane[1])), hook});
  const poseMix = (A, B, k) => ({a:A.a + angDiff(A.a, B.a) * k, r:A.r + (B.r - A.r) * k, hook:A.hook + (B.hook - A.hook) * k});
  const tipOf = (P, q) => craneGeo(P, q).tip;
  // where the loads stand on deck, in the boat's frame (x to starboard, z aft); the first slot is the next to go up
  function deckSlots(kind){
    const G = GEO(vtype()), d = G.deck || {y:G.gw, z:(G.stern || 3) * 0.5};
    return kind === 'tub' ? [[0.65, d.y, d.z - 0.55], [-0.65, d.y, d.z - 0.55], [0.65, d.y, d.z + 0.55], [-0.65, d.y, d.z + 0.55]] : [[0, d.y, d.z - 0.45], [0, d.y, d.z + 0.45]];
  }
  // the forklift's run on the unit's route: from its spot east of the drop spot forward to the loads, lift, on round a quarter turn to
  // the door's line and in through the door, set down, and back the same way in reverse. The route keeps the truck's corners well
  // inside the deck (unittest.py checks it). Its speed is set so a run takes at most two lifts.
  function fkRun(P){
    if (P.run) return P.run;
    const T = unitModel().A.truck, W = q => unitW(P.unit, q[0], q[2]), c = T.arc, r = T.r;
    const arc = []; for (let k = 0; k <= 8; k++){ const a = Math.PI / 2 * k / 8; arc.push(W([c[0] - r * Math.sin(a), 0, c[2] + r * Math.cos(a)])); }
    const wait = W(T.wait), pick = W(T.pick), inn = W(T.in), inPath = [pick, ...arc, inn], outPath = [...inPath].reverse().concat([wait]);
    const hd = (a, b) => Math.atan2(b[0] - a[0], -(b[1] - a[1])), plen = pts => pts.reduce((s, q, i) => i ? s + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0, 0);
    const legs = [{kind:'go', pts:[wait, pick], rev:false}, {kind:'pick', pts:[pick], h:hd(wait, pick), dur:0.35}, {kind:'go', pts:inPath, rev:false},
      {kind:'drop', pts:[inn], h:hd(arc[8], inn), dur:0.3}, {kind:'go', pts:outPath, rev:true}];
    for (const g of legs) g.len = plen(g.pts);
    const dist = legs.reduce((s, g) => s + g.len, 0), vG = Math.max(20, dist / 3.95);   // metres per game minute
    let t = 0; for (const g of legs){ g.t0 = t; g.dur = g.dur || g.len / vG; t += g.dur; }
    return P.run = {legs, T:t, Wp:wait, waitH:hd(wait, pick), inn};
  }
  // where a leg of the run puts the truck at w (0-1): moving off and pulling up gently, facing the way it drives (or the other way
  // when it reverses)
  function legAt(g, w){
    if (g.kind !== 'go'){ const q = g.pts[0]; return {x:q[0], z:q[1], h:g.h}; }
    let s = ease(w) * g.len;
    for (let i = 1; i < g.pts.length; i++){ const a = g.pts[i - 1], b = g.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s > L && i < g.pts.length - 1){ s -= L; continue; }
      const k = L ? clamp(s / L, 0, 1) : 0, dx = b[0] - a[0], dz = b[1] - a[1]; return {x:a[0] + dx * k, z:a[1] + dz * k, h:g.rev ? Math.atan2(-dx, dz) : Math.atan2(dx, -dz)}; }
    const q = g.pts[g.pts.length - 1]; return {x:q[0], z:q[1], h:0};
  }
  // everything a landing shows at game minute gt: the crane's pose and what hangs from it, the loads on deck and on the quay,
  // the forklift, and where the people stand and what they do. null when this plant is not landing the boat you are on.
  function landScene(P, T, BMrel, eye){
    const b = S.boat, L = b.land; if (!L || L.pid !== P.id || b.status !== 'port' || b.port !== P.id || !BMrel) return null;
    const Lg = LANDING, pr = Lg.prep, lf = Lg.lift, n = L.lifts, e = S.t + currentFrac() - L.t0, hk = Lg.hooked;
    const nb = j => L.kind === 'tub' ? 1 : Math.min(Lg.perLift, L.n - Lg.perLift * j), hh = j => loadH(L.kind, nb(j)), mesh = j => L.kind === 'tub' ? PM.tub : PM.palN[nb(j)];
    const slots = deckSlots(L.kind), wpos = q => { const r = xf(BMrel, q); return [r[0] + eye[0], r[1] + eye[1], r[2] + eye[2]]; }, K = wpos(slots[0]), D = P.drop;
    const pd = poseTo(P, D[0], D[1], HOOK_UP), pk = poseTo(P, K[0], K[2], HOOK_UP), idle = craneIdle(P, T), tR = j => pr + (j + hk) * lf;
    let pose, hang = null, i = -1, u = 0;
    if (e < pr) pose = poseMix(idle, pd, ease(seg(e, 1.5, 3.5)));
    else if (e < pr + n * lf){
      i = Math.min(n - 1, Math.floor((e - pr) / lf)); u = (e - pr) / lf - i;
      const yk = K[1] + hh(i) + 0.1, yd = QTOP + (i % 2 ? hh(i - 1) : 0) + hh(i) + 0.1;
      if (u < 0.18) pose = poseMix(pd, pk, ease(seg(u, 0, 0.18)));
      else if (u < 0.32) pose = {...pk, hook:HOOK_UP + (yk - HOOK_UP) * ease(seg(u, 0.18, 0.32))};
      else if (u < 0.42) pose = {...pk, hook:yk};
      else if (u < 0.56) pose = {...pk, hook:yk + (HOOK_UP - yk) * ease(seg(u, 0.42, 0.56))};
      else if (u < 0.74) pose = poseMix(pk, pd, ease(seg(u, 0.56, 0.74)));
      else if (u < hk) pose = {...pd, hook:HOOK_UP + (yd - HOOK_UP) * ease(seg(u, 0.74, hk))};
      else if (u < 0.93) pose = {...pd, hook:yd};
      else pose = {...pd, hook:yd + (HOOK_UP - yd) * ease(seg(u, 0.93, 1))};
      if (u >= 0.37 && u < hk) hang = {mesh:mesh(i), h:hh(i)};
    } else pose = poseMix(pd, idle, ease(seg(e, pr + n * lf, pr + n * lf + 1.5)));
    // on deck: the loads not yet hooked on, as many as there are slots (the rest are below in the hold)
    const onHook = clamp(Math.floor((e - pr) / lf - 0.37) + 1, 0, n), deck = [];
    for (let s = 0; s < slots.length && onHook + s < n; s++) deck.push({mesh:mesh(onHook + s), at:slots[s]});
    // the forklift takes lifts 2k and 2k+1 on run k, after the second is down; loads wait on the quay until it picks them up
    const R = fkRun(P), runs = Math.ceil(n / 2), start = k => tR(Math.min(2 * k + 1, n - 1)) + 0.1, pickAt = k => start(k) + R.legs[1].t0;
    const quay = []; let fk = {x:R.Wp[0], z:R.Wp[1], h:R.waitH, fl:0, loads:[]};
    for (let j = 0; j < n; j++){ const k = j >> 1; if (e >= tR(j) && e < pickAt(k)) quay.push({mesh:mesh(j), y:QTOP + (j % 2 ? hh(j - 1) : 0)}); }
    for (let k = runs - 1; k >= 0; k--){ const t = e - start(k); if (t < 0) continue; if (t >= R.T) break;
      const g = R.legs.find(q => t < q.t0 + q.dur) || R.legs[R.legs.length - 1], w = clamp((t - g.t0) / g.dur, 0, 1), gi = R.legs.indexOf(g), q = legAt(g, w);
      const loads = [2 * k, 2 * k + 1].filter(j => j < n).map(j => ({mesh:mesh(j), h:hh(j)}));
      fk = {x:q.x, z:q.z, h:q.h, fl:g.kind === 'pick' ? w : g.kind === 'drop' ? 1 - w : gi === 2 ? 1 : 0, loads:gi >= 1 && gi <= 3 ? loads : []};
      break; }
    // the people: stations and jobs
    const hdg = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), tip = tipOf(P, pose);
    // at the unit's stations, clear of the forklift's route: one signals at the edge, one takes the loads, one counts by the door, one
    // works the crane's remote
    const s0 = P.ws.signal, s1 = P.ws.receive, s2 = P.ws.tally, s3 = P.ws.remote;
    const moving = i >= 0 && (u < 0.18 || (u >= 0.42 && u < 0.74)), recv = i >= 0 && u >= 0.74 && u < hk ? 'guide' : i >= 0 && u >= hk && u < 0.93 ? 'unhook' : 'look';
    const busy = [{x:s0[0], z:s0[1], h:seaH, task:moving ? 'signal' : 'look'}, {x:s1[0], z:s1[1], h:hdg(s1, D), task:recv}, {x:s2[0], z:s2[1], h:hdg(s2, D), task:'tally'}, {x:s3[0], z:s3[1], h:hdg(s3, [tip[0], tip[2]]), task:'remote'}].map(q => ({...q, walk:false, s:0}));
    return {e, i, u, pose, hang, deck, quay, fk, busy, K, slewD:Math.atan2(D[0] - P.crane[0], D[1] - P.crane[1])};
  }
  // walking over when a job moves: a person or the forklift that has to be somewhere else walks (drives) there instead of jumping
  function follow(P, key, st, T, v){
    const m = P.fol || (P.fol = {}), w = m[key];
    if (!w || T - w.T > 1.5 || T < w.T){ m[key] = {x:st.x, z:st.z, T, go:false}; return st; }
    const dt = T - w.T, dx = st.x - w.x, dz = st.z - w.z, d = Math.hypot(dx, dz); w.T = T;
    if (d > 3) w.go = true;
    if (!w.go || d < v * dt + 0.05){ w.x = st.x; w.z = st.z; w.go = false; return st; }
    w.x += dx / d * v * dt; w.z += dz / d * v * dt; return {...st, x:w.x, z:w.z, h:Math.atan2(dx, -dz), task:st.fl !== undefined ? st.task : 'walk', walk:true, s:0};
  }
  function drawPlant(P, eye, VP, T, BMrel){
    nSetup(VP);
    const rel = (x, y, z) => [x - eye[0], y - eye[1], z - eye[2]], night = env.night > 0.3, hr = gDate(S.t / 60).getUTCHours(), LS = landScene(P, T, BMrel, eye), onShift = !!LS || (hr >= 6 && hr < 22);
    P.scene = LS;
    const dt = P.pT ? clamp(T - P.pT, 0, 0.5) : 0; P.pT = T;
    const pose = LS ? LS.pose : craneIdle(P, T), FK = LS ? LS.fk : fkRest(P), U = P.unit, A = unitModel().A;
    // the roller door (on a sensor) rolls up as the forklift turns in towards it, is open before the forks reach it, and rolls down
    // as it backs out
    const [, fz] = unitL(U, FK.x, FK.z), pz = A.truck.pick[2], az = A.truck.arc[2]; P.doorK = ease(clamp((pz - fz) / (pz - az), 0, 1));
    // the ice chute swings out over the boat's hold while ice runs, and back along the quay after
    const b = S.boat, gt = S.t + currentFrac(), icing = b.iceUntil > gt && b.status === 'port' && b.port === P.id && BMrel, ax = A.silo.axis;
    let chW = P.chRest;
    if (icing){ const c = xf(BMrel, [0, 0, 0]), C = [c[0] + eye[0], c[2] + eye[2]], fw = [Math.sin(bv.head), -Math.cos(bv.head)], Lb = (VESSELS[vtype()] || {len:6}).len, sw = unitW(U, ax[0], ax[2]);
      const k = clamp((sw[0] - C[0]) * fw[0] + (sw[1] - C[1]) * fw[1], -Lb / 3, Lb / 3), [tx, tz] = unitL(U, C[0] + fw[0] * k, C[1] + fw[1] * k); chW = Math.atan2(tx - ax[0], tz - ax[2]); }
    P.chA = P.chA === undefined ? P.chRest : P.chA + clamp(angDiff(P.chA, chW), -0.35 * dt, 0.35 * dt);
    const r = drawUnitParts(P, eye, pose, FK, P.doorK, P.chA);
    if (LS && LS.hang){ const h = LS.hang.h, t = rel(r.tip[0], pose.hook - 0.1 - h, r.tip[2]); drawN(LS.hang.mesh, chain(M4.T(t[0], t[1], t[2]), M4.RY(pose.a))); }
    if (LS){
      for (const q of LS.deck) drawN(q.mesh, chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2])));
      for (const q of LS.quay){ const c = rel(P.drop[0], q.y, P.drop[1]); drawN(q.mesh, chain(M4.T(c[0], c[1], c[2]), M4.RY(LS.slewD))); }
    }
    // people: the day shift, or one on watch at night; everyone turns out for a landing
    const R = plantRounds(P); P.spray = 0;
    for (let i = 0; i < 4; i++){ if (!onShift && i !== 3) continue; drawWorker(P, follow(P, 'w' + i, LS ? LS.busy[i] : roundAt(R[i], T + i * 17), T, 1.6), eye, T, i); }
    // ice from the chute's spout down into the boat
    if (icing && Math.abs(angDiff(P.chA, chW)) < 0.15){
      const G = GEO(vtype()), dy = xf(BMrel, [0, (G.deck || {y:G.gw}).y, 0])[1] + eye[1], L = A.silo.chute, O = unitP(U, [ax[0] + Math.sin(P.chA) * L, ax[1] + A.silo.spout, ax[2] + Math.cos(P.chA) * L]), fall = Math.max(0.5, O[1] - dy);
      let k = P.spray; for (let i = 0; i < 70; i++){ const q = (T * 1.6 + i / 70) % 1, rr = 0.12 + 0.1 * q; PB[k * 3] = O[0] + (hash(i) - 0.5) * rr - eye[0]; PB[k * 3 + 1] = O[1] - q * q * fall - eye[1]; PB[k * 3 + 2] = O[2] + (hash(i + 31) - 0.5) * rr - eye[2]; PA[k] = 0.85; k++; }
      P.spray = k; }
    return {night, spray:P.spray, lamps:P.lamps.map(L => rel(L[0], L[2] - 0.12, L[1]))};
  }
  function nearestPlant(eye){ let best = null, bd = 900; for (const P of PLANTS){ const d = Math.hypot(P.drop[0] - eye[0], P.drop[1] - eye[2]); if (d < bd){ bd = d; best = P; } } return best; }

  // ---------- work on deck: the bleeding tub and the gutting table on the after deck; whoever works the deck guts or ices there ----------
  let DECKACT = {on:false};
  function deckActivity(){
    const b = S.boat; if (!b || b.land || typeof deckHands !== 'function' || !S.hold || !S.hold.length) return {on:false};
    if (deckHands() < 1 || deckPending() < 0.5) return {on:false};
    return {on:true, alone:handsAboard() === 1, task:catchGut() && S.hold.some(x => !x.gut && !x.iced) ? 'gut' : 'ice'};
  }
  function drawDeck(BMrel, eye, VP, t, DK){
    const vt = vtype(), G = GEO(vt), d = G.deck || {y:G.gw, z:2}, Bm = G.beam, b = S.boat; DK.pt = null;
    if (b.land || b.status === 'aground') return;
    nSetup(VP);
    // where they stand: by the beam on the after deck, or where a detailed model says (the starter boat has a seat and a bench aft)
    const W = G.work || null, tx = W ? W.table[0] : -(Bm / 2 - 0.42), ux = W ? W.tub[0] : Bm / 2 - 0.62, tz = W ? W.table[2] : d.z, uz = W ? W.tub[2] : d.z + 0.35;
    drawN(PM.btub, chain(BMrel, M4.T(ux, d.y, uz), M4.S(W && W.s || 1))); drawN(PM.gtable, chain(BMrel, M4.T(tx, d.y, tz)));
    if (!DK.on) return;
    const wl = xf(BMrel, [tx + 0.62, d.y, tz]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0}, head = bv.head - Math.PI / 2;
    drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:head, task:DK.task === 'gut' ? 'gut' : 'stack', walk:false, s:0}, eye, t, 7);
    // the offal goes over the port rail into the water, where the gulls come down for it
    const out = [-Math.cos(bv.head), -Math.sin(bv.head)], a = xf(BMrel, [tx - 0.15, d.y + 1.0, tz]), wat = (env.tide || 0) - eye[1];
    DK.pt = [a[0] + eye[0] + out[0] * 2.6, (env.tide || 0), a[2] + eye[2] + out[1] * 2.6];
    if (DK.task === 'gut'){ const c = (t % 3) / 3; if (c > 0.76){ const k = (c - 0.76) / 0.24; drawN(PM.slo, M4.T(a[0] + out[0] * 2.6 * k, a[1] + 1.2 * k * (1 - k) * 2 - (a[1] - wat) * k * k, a[2] + out[1] * 2.6 * k)); } }
  }
  // ---------- passive gear: buoys at both ends of every set, and the work over the rail when setting and hauling ----------
  let GB = null;
  function buildGear(){
    const k = (r, g, b, s) => [r, g, b, s == null ? 0.3 : s];
    // blåse: an orange float, a dark pole with a black flag, and the rope going down
    const b = NB(), G = [];
    for (let i = 0; i <= 8; i++){ const la = -Math.PI / 2 + Math.PI * i / 8, row = []; for (let j = 0; j <= 12; j++){ const lo = 2 * Math.PI * j / 12; row.push([Math.cos(la) * Math.cos(lo) * 0.3, 0.16 + Math.sin(la) * 0.28, Math.cos(la) * Math.sin(lo) * 0.3]); } G.push(row); }
    b.grid(G, () => k(0.95, 0.42, 0.1, 0.55)); b.tube([[0, 0.4, 0], [0, 2.7, 0]], 0.024, k(0.12, 0.12, 0.13), 6); b.box(0.22, 2.2, 0, 0.44, 0.3, 0.02, k(0.07, 0.07, 0.08, 0.1));
    b.box(0, 1.6, 0, 0.16, 0.2, 0.16, k(0.75, 0.76, 0.78, 0.8)); b.tube([[0, -0.1, 0], [0.05, -1.4, 0.1]], 0.012, k(0.85, 0.7, 0.2), 5);
    // hauler: a drum on a post; a crab pot: a frame of bars; a net bin and a line tub
    const h = NB(); h.tube([[-0.1, 0, 0], [0.1, 0, 0]], 0.19, k(0.2, 0.22, 0.25, 0.5), 14); h.disc([0.1, 0, 0], [1, 0, 0], 0.19, k(0.3, 0.32, 0.36, 0.5)); h.disc([-0.1, 0, 0], [-1, 0, 0], 0.19, k(0.3, 0.32, 0.36, 0.5)); h.box(-0.02, -0.55, 0, 0.12, 0.45, 0.12, k(0.28, 0.3, 0.33));
    const pt = NB(), X = 0.4, Y = 0.4, Z = 0.3, e = [[-X, 0, -Z], [X, 0, -Z], [X, 0, Z], [-X, 0, Z]], c = k(0.1, 0.25, 0.14, 0.2);
    for (let i = 0; i < 4; i++){ const a = e[i], q = e[(i + 1) % 4]; pt.tube([a, q], 0.014, c, 4); pt.tube([[a[0], Y, a[2]], [q[0], Y, q[2]]], 0.014, c, 4); pt.tube([a, [a[0], Y, a[2]]], 0.014, c, 4); }
    pt.tube([[-X, Y * 0.5, -Z], [X, Y * 0.5, Z]], 0.008, k(0.2, 0.35, 0.2), 4); pt.tube([[-X, Y * 0.5, Z], [X, Y * 0.5, -Z]], 0.008, k(0.2, 0.35, 0.2), 4);
    const bin = NB(); bin.box(0, 0, 0, 0.9, 0.42, 0.7, k(0.32, 0.4, 0.5, 0.3), k(0.1, 0.12, 0.14, 0.1));
    const tub = NB(); tub.box(0, 0, 0, 0.55, 0.32, 0.55, k(0.2, 0.45, 0.72, 0.4), k(0.4, 0.3, 0.2, 0.1));
    const fl = NB(); fl.tube([[0, 0, 0], [0, 0, 1]], 1, k(0.95, 0.72, 0.15, 0.2), 5);
    const net = NB(); net.tube([[0, 0, 0], [0, 0, 1]], 1, k(0.55, 0.62, 0.6, 0.1), 4);
    GB = {buoy:b.mesh(), haul:h.mesh(), pot:pt.mesh(), bin:bin.mesh(), tub:tub.mesh(), float:fl.mesh(), net:net.mesh()};
  }
  // the buoys of every set within sight, bobbing on the waves, flags blowing downwind
  function drawGearSea(eye, t, VP, H){
    const L = []; for (const s of S.sets || []) if (!s.lost){ L.push(s.a); L.push(s.b); }
    const g = S.boat.gop; if (g && g.op === 'set' && g.done >= 0) L.push(g.a);
    if (!L.length) return; if (!GB) buildGear();
    nSetup(VP); const wd = (windDir(H) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG;
    for (const e of L){ const x = e.x * 1000, z = e.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) > 4000) continue;
      const y = seaH(x, z, t) - 0.1, sx = (seaH(x + 0.6, z, t) - seaH(x - 0.6, z, t)) / 1.2, sz = (seaH(x, z + 0.6, t) - seaH(x, z - 0.6, t)) / 1.2;
      drawN(GB.buoy, model(x - eye[0], y - eye[1], z - eye[2], Math.PI / 2 - wd, -sz * 0.9, sx * 0.9)); }
    gl.useProgram(PL.p);
  }
  // the work on deck: the hauler turning, the string running over it to the water, pots stacking, the net piling in its bin
  // The haulers from Blender (tools/gear/haler.py, the user's drawings 03.10.2026): the net hauler and the line hauler on a post inside
  // the starboard rail with the arm out over the side. Parts from their own origins: the frame from the post's foot, the sheave and the
  // stripper from their axles (along the boat, so they turn about z); in the extras the path the gear takes over them.
  const HAULM = {}; let HAULA = 0, HAULT = 0;
  function haulModel(kind){
    if (kind in HAULM) return HAULM[kind]; HAULM[kind] = null; const type = 'haul-' + kind;
    if (typeof glbHas !== 'function' || !glbHas(type)) return null;
    const G = glbLoad(type), ex = (G && G.ex) || {}, mk = nm => { const o = glbPart(type, nm); if (!o) return null; const n = o.p.length / 3, c = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) c[i * 3 + k] = o.c[i * 4 + k]; return {pb:buf(new Float32Array(o.p)), cb:buf(c), n}; };
    if (ex.axle && ex.path) HAULM[kind] = {frame:mk('frame'), sheave:mk('sheave'), stripper:mk('stripper'), ax:ex.axle, st:ex.stripper, r:ex.r, path:ex.path};
    return HAULM[kind];
  }
  // who hauls: those on the station «Haling» (13-work.js), and whether you are one of them
  function gopHauls(){ return typeof workAssign === 'function' ? workAssign().filter(p => p.st === 'haling') : []; }
  const gopHands = () => gopHauls().length;
  const gopMe = () => { const b = S.boat; return !!(b.gop && b.status === 'fishing' && gopHauls().some(p => !p.c)); };
  function drawGearOp(BMrel, eye, VP, t){
    const b = S.boat, g = b.gop; if (!g || b.status !== 'fishing') return; if (!GB) buildGear();
    const vt = vtype(), G = GEO(vt), gw = G.gw || 1, sx = G.beam / 2, d = G.deck || {y:gw, z:1}, skiff = !!G.hand;
    // the hauler on the starboard rail just forward of the working deck; gear stacks on the deck aft of it
    const HP = skiff ? SKA.haul : G.hauler, turning = g.op === 'haul' && !(b.deckStop), DZ = skiff ? 0 : d.z - 0.6;
    nSetup(VP);
    const HM = !skiff && (g.kind === 'garn' || g.kind === 'line') ? haulModel(g.kind) : null;
    if (!HM && (!skiff || S.equip.elhaler)) drawN(GB.haul, chain(BMrel, M4.T(HP[0], HP[1], HP[2]), M4.RX(turning ? -t * 3 : 0)));
    // from the hauler down into the sea, outboard and a little ahead
    const W0 = [sx + (skiff ? 1.6 : 2.6), -0.35, HP[2] - (skiff ? 1.2 : 2.2)], seg = (A, Bp, r, m, sag) => { let prev = A; for (let i = 1; i <= 8; i++){ const u = i / 8, P = [A[0] + (Bp[0] - A[0]) * u, A[1] + (Bp[1] - A[1]) * u - sag * 4 * u * (1 - u), A[2] + (Bp[2] - A[2]) * u]; drawN(m, chain(BMrel, limbM(prev, P, r))); prev = P; } };
    if (HM){
      // the hauler on its post inside the rail (its foot on deck), the gear from the water up its path, over the sheave and down the
      // tray; the sheave turns with the gear (0.6 m/s while hauling), the stripper the other way; floats on the net, snoods on the line
      const P0 = [sx - 0.2, d.y, HP[2]], v = turning ? 0.6 : 0, at = q => chain(BMrel, M4.T(P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]));
      HAULA += v * clamp(t - HAULT, 0, 0.1) / HM.r; HAULT = t;
      litSetup(VP); drawLit(HM.frame, at([0, 0, 0])); drawLit(HM.sheave, chain(at(HM.ax), M4.RZ(HAULA))); drawLit(HM.stripper, chain(at(HM.st), M4.RZ(-HAULA * HM.r / (g.kind === 'garn' ? 0.06 : 0.08))));
      nSetup(VP);
      const path = HM.path.map(q => [P0[0] + q[0], P0[1] + q[1], P0[2] + q[2]]); path[0] = W0.slice();
      const garn = g.kind === 'garn', rope = garn ? GB.net : GB.float;
      for (let i = 1; i < path.length; i++) seg(path[i - 1], path[i], garn ? 0.03 : 0.006, rope, i === 1 ? 0.25 : 0);
      // along the path by length: floats (net) or snoods with a hook (line) every metre, moving in with the gear
      const L = []; let tot = 0; for (let i = 1; i < path.length; i++){ const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]); L.push(l); tot += l; }
      const pos = s => { let i = 0; while (i < L.length - 1 && s > L[i]){ s -= L[i]; i++; } const u = clamp(s / L[i], 0, 1), A = path[i], B = path[i + 1]; return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u]; };
      const off = (HAULA * HM.r) % 1;
      for (let s = off; s < tot; s += 1){ const p = pos(s), q = pos(Math.min(tot, s + (garn ? 0.12 : 0.05)));
        if (garn){ drawN(GB.float, chain(BMrel, limbM([p[0], p[1] + 0.05, p[2]], [q[0], q[1] + 0.05, q[2]], 0.035))); if (s < L[0] && Math.floor(s + HAULA * HM.r) % 3 === 0) drawN(GB.net, chain(BMrel, limbM(p, [p[0], p[1] - 0.45, p[2]], 0.01))); }
        else drawN(GB.float, chain(BMrel, limbM(p, [p[0], p[1] - 0.25, p[2] + 0.02], 0.004))); }
      if (garn){ const n = g.op === 'haul' ? g.done : g.n - g.done, fill = clamp(n / Math.max(1, g.n), 0, 1); drawN(GB.bin, chain(BMrel, M4.T(sx * 0.3, d.y, DZ), M4.S(1, 0.3 + 0.7 * fill, 1))); }
      else { const n = g.op === 'haul' ? g.done : g.n - g.done; for (let i = 0; i < Math.min(6, n); i++) drawN(GB.tub, chain(BMrel, M4.T(sx * 0.25 - (i % 2) * 0.6, d.y + Math.floor(i / 2) * 0.33, DZ + (Math.floor(i / 2) % 2) * 0.1))); }
    } else if (g.kind === 'garn'){
      // float line on top, lead line below, and the mesh between them moving with the net
      seg([HP[0], HP[1] + 0.12, HP[2]], [W0[0], W0[1] + 0.3, W0[2]], 0.012, GB.float, 0.15); seg([HP[0], HP[1] - 0.12, HP[2]], W0, 0.01, GB.net, 0.25);
      const ph = (t * (turning ? 0.5 : 0.15)) % 0.125;
      for (let u = ph; u < 1; u += 0.125){ const A = [HP[0] + (W0[0] - HP[0]) * u, HP[1] + 0.12 + (W0[1] + 0.3 - HP[1] - 0.12) * u - 0.15 * 4 * u * (1 - u), HP[2] + (W0[2] - HP[2]) * u], B2 = [A[0], A[1] - 0.24 - 0.1 * u, A[2]]; drawN(GB.net, chain(BMrel, limbM(A, B2, 0.004))); }
      const n = g.op === 'haul' ? g.done : g.n - g.done, fill = clamp(n / Math.max(1, g.n), 0, 1);
      drawN(GB.bin, chain(BMrel, M4.T(skiff ? SKA.stack[0] + 0.1 : sx * 0.3, d.y, skiff ? SKA.stack[2] : DZ), M4.S(1, 0.3 + 0.7 * fill, 1)));
    } else if (g.kind === 'line'){
      seg(HP, W0, 0.008, GB.float, 0.2);
      const n = g.op === 'haul' ? g.done : g.n - g.done;
      for (let i = 0; i < Math.min(6, n); i++) drawN(GB.tub, chain(BMrel, M4.T((skiff ? SKA.stack[0] : sx * 0.25) - (i % 2) * 0.6, d.y + Math.floor(i / 2) * 0.33, (skiff ? SKA.stack[2] : DZ) + (Math.floor(i / 2) % 2) * 0.1)));
    } else {
      seg(HP, W0, 0.012, GB.float, 0.2);
      const n = Math.min(12, g.op === 'haul' ? g.done : g.n - g.done);
      for (let i = 0; i < n; i++) drawN(GB.pot, chain(BMrel, M4.T((skiff ? SKA.stack[0] : sx * 0.35) - (i % 2) * 0.85, d.y + Math.floor(i / 4) * 0.42, (skiff ? SKA.stack[2] + 0.1 : DZ) + (Math.floor(i / 2) % 2) * 0.65)));
      // the next pot on its way up from the bottom (hauling) or over the side (setting)
      const u = clamp(g.prog, 0, 1), up = g.op === 'haul' ? u : 1 - u, P = [W0[0] + (HP[0] - W0[0]) * up, -1.5 + (HP[1] + 0.2 + 1.5) * up, W0[2] + (HP[2] - W0[2]) * up];
      if (P[1] > -1) drawN(GB.pot, chain(BMrel, M4.T(P[0], P[1] - 0.2, P[2])));
    }
    // those on «Haling» in the work chains (the skipper too when it is his job; he then leaves the wheel, gopMe): the first at the
    // hauler taking the gear in, the next clearing it at the end of the tray, a third stacking it aft (the skiff's fisher is drawn with
    // the boat)
    if (!skiff){ const n = clamp(gopHands(), 1, 3), spots = [[HP[0] - 0.55, HP[2] + 0.2, 'coil', Math.PI / 2], [HP[0] - 1.25, HP[2] + 0.75, 'stack', Math.PI * 0.6], [sx * 0.3 + 0.5, DZ + 0.2, 'stack', Math.PI]];
      for (let k = 0; k < n; k++){ const [x, z, task, a] = spots[k], wl = xf(BMrel, [x, d.y, z]), wy = wl[1] + eye[1], P = {gy:() => wy, bare:true, spray:0};
        drawWorker(P, {x:wl[0] + eye[0], z:wl[2] + eye[2], h:bv.head + a, task, walk:false, s:0}, eye, t, 9 + k); } }
  }
  // ---------- bunker quays: a tank in its bund, the pump with its meter and hose reel, the sign; someone from the boat holds the nozzle ----------
  const BUNKERS = []; let BUNKN = null;
  function buildBunkers(){
    BUNKERS.length = 0; const nb = NB();
    const TANK = [0.9, 0.91, 0.9, 0.35], RED = [0.78, 0.12, 0.1, 0.35], CONC = [0.62, 0.62, 0.6, 0.05], DK = [0.14, 0.15, 0.16, 0.3], STEEL = [0.7, 0.72, 0.74, 0.5], POLE = [0.45, 0.47, 0.5, 0.4];
    for (const pt of PORTS){
      if (!pt.fuel) continue; const kind = hasBunker(pt.id) ? 'bunker' : 'main', bp = berthPose(pt.id, 'skiff', kind); if (!bp) continue;
      const f = bp.face, u = [f.ux, f.uz], n = [f.nx, f.nz], at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o], depth = f.depth || 6;
      const pa = clamp(bp.a + 2.4, -f.hl + 1, f.hl - 1), B = {id:pt.id, kind, bp, f, u, n, at, pa, pump:at(pa, -1.5), gy:() => QTOP, spray:0};
      B.outlet = at(pa, -1.15); B.sign = at(clamp(bp.a - 3.5, -f.hl + 0.5, f.hl - 0.5), -0.9);
      // a harbour unit has its own pump, hose reel, tank and sign: only the meter and the hose are drawn
      const U = UNITS[pt.id], M = U && unitModel();
      if (M){ const W = q => unitW(U, q[0], q[2]); B.unit = true; B.pump = W(M.A.pump); B.outlet = W(M.A.reel); B.meterAt = W(M.A.meter); B.meterY = M.A.meter[1]; BUNKERS.push(B); continue; }
      // the pump: cabinet with a red top, the hose reel on its side
      obox(nb, B.pump, u, n, 0.8, 0.55, QTOP, 1.55, TANK); obox(nb, B.pump, u, n, 0.86, 0.6, QTOP + 1.55, 0.14, RED);
      const rc = at(pa + 0.62, -1.5); nb.tube([[rc[0] - u[0] * 0.12, QTOP + 0.9, rc[1] - u[1] * 0.12], [rc[0] + u[0] * 0.12, QTOP + 0.9, rc[1] + u[1] * 0.12]], 0.36, DK, 14);
      nb.disc([rc[0] + u[0] * 0.13, QTOP + 0.9, rc[1] + u[1] * 0.13], [u[0], 0, u[1]], 0.38, STEEL, 14); nb.disc([rc[0] - u[0] * 0.13, QTOP + 0.9, rc[1] - u[1] * 0.13], [-u[0], 0, -u[1]], 0.38, STEEL, 14);
      // the tank lies along the quay on two saddles inside a low concrete bund
      const tc = at(pa, -Math.min(depth - 2.2, 6.2)), T = (a, y) => [tc[0] + u[0] * a, y, tc[1] + u[1] * a], ty = QTOP + 1.45;
      nb.tube([T(-2.3, ty), T(2.3, ty)], 1.05, TANK, 18); nb.disc(T(2.3, ty), [u[0], 0, u[1]], 1.05, TANK, 18); nb.disc(T(-2.3, ty), [-u[0], 0, -u[1]], 1.05, TANK, 18);
      nb.tube([T(-0.6, ty), T(0.6, ty)], 1.07, RED, 18);
      for (const a of [-1.5, 1.5]) obox(nb, [tc[0] + u[0] * a, tc[1] + u[1] * a], u, n, 0.3, 1.6, QTOP, 0.55, DK);
      for (const [a, o, l, w] of [[0, 1.6, 6.2, 0.2], [0, -1.6, 6.2, 0.2], [3.1, 0, 0.2, 3.4], [-3.1, 0, 0.2, 3.4]]) obox(nb, [tc[0] + u[0] * a + n[0] * o, tc[1] + u[1] * a + n[1] * o], u, n, l, w, QTOP, 0.45, CONC);
      const vent = T(1.8, ty + 1.0); nb.tube([[vent[0], ty + 0.9, vent[2]], [vent[0], ty + 1.7, vent[2]]], 0.05, STEEL, 6);
      // sign post
      nb.tube([[B.sign[0], QTOP, B.sign[1]], [B.sign[0], QTOP + 3.1, B.sign[1]]], 0.07, POLE, 6);
      BUNKERS.push(B);
    }
    BUNKN = nb.mesh(mapMid());
  }
  function nearestBunker(eye){ let best = null, bd = 600; for (const B of BUNKERS){ const d = Math.hypot(B.pump[0] - eye[0], B.pump[1] - eye[2]); if (d < bd){ bd = d; best = B; } } return best; }
  function drawBunker(B, eye, VP, T, BMrel){
    nSetup(VP);
    const b = S.boat, f = b.fueling, here = f && b.status === 'port' && b.port === B.id && berthKind(b) === B.kind && BMrel, gt = S.t + currentFrac();
    const rel = (x, y, z) => [x - eye[0], y - eye[1], z - eye[2]], seaH = Math.atan2(B.n[0], -B.n[1]);
    let shown = 0;
    if (here){
      // the filler on the starboard side (the quay side), and whoever holds the nozzle standing at the edge above it
      const vt = vtype(), G = GEO(vt), fl = G.hand ? SKA.filler : G.filler;
      const Fr = xf(BMrel, fl), Fw = [Fr[0] + eye[0], Fr[1] + eye[1], Fr[2] + eye[2]], al = (Fw[0] - B.f.x) * B.u[0] + (Fw[2] - B.f.z) * B.u[1], edge = B.at(al, -0.7);
      const active = gt >= f.t0 + 0.4 && gt < f.until - 0.4, st = active ? {x:edge[0], z:edge[1], h:seaH, task:'nozzle', walk:false, s:0} : {x:B.pump[0] + B.n[0] * 0.8, z:B.pump[1] + B.n[1] * 0.8, h:seaH + Math.PI, task:'look', walk:false, s:0};
      const w = follow(B, 'p', st, T, 1.4); drawWorker(B, w, eye, T, 5);
      if (active && Math.hypot(w.x - edge[0], w.z - edge[1]) < 0.4){
        const F = [Math.sin(seaH), -Math.cos(seaH)], hand = rel(edge[0] + F[0] * 0.42, QTOP + 0.85, edge[1] + F[1] * 0.42), o = rel(B.outlet[0], QTOP + 1.0, B.outlet[1]);
        const sag = (A, C, s, n0) => { let p0 = A; for (let k = 1; k <= n0; k++){ const q = k / n0, P = [A[0] + (C[0] - A[0]) * q, A[1] + (C[1] - A[1]) * q - s * 4 * q * (1 - q), A[2] + (C[2] - A[2]) * q]; drawN(PM.fhose, limbM(p0, P, 0.028)); p0 = P; } };
        sag(o, hand, 0.35, 8); sag(hand, Fr, 0.12, 5);
        if (gt >= f.pumpAt) shown = Math.min(f.liters, (gt - f.pumpAt) * f.lpm);
      }
    }
    // the meter on the pump, and the sign
    const v = Math.round(shown);
    if (!B.meter){ B.cv = document.createElement('canvas'); B.cv.width = 256; B.cv.height = 128; B.meter = {tex:mkTex(), v:-1};
      const du = [-B.n[1], B.n[0]], c = B.unit ? [B.meterAt[0] + B.n[0] * 0.005, B.meterAt[1] + B.n[1] * 0.005] : B.at(B.pa, -1.5 + 0.28), w2 = 0.26, a = [c[0] - du[0] * w2, c[1] - du[1] * w2], d = [c[0] + du[0] * w2, c[1] + du[1] * w2];   // read from the water side
      const my = B.unit ? B.meterY - 0.13 : QTOP + 1.05; B.meter.q = texQuad([d[0], my, d[1]], [a[0], my, a[1]], [a[0], my + 0.26, a[1]], [d[0], my + 0.26, d[1]]);
      const sv = document.createElement('canvas'); sv.width = 512; sv.height = 256; const g = sv.getContext('2d'); g.fillStyle = '#c21f19'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 118px Archivo, Arial, sans-serif'; g.fillText('BUNKERS', 256, 104); g.font = '600 52px Archivo, Arial, sans-serif'; g.fillText('DIESEL · BENSIN', 256, 200); B.signT = mkTex(); upTex(B.signT, sv);
      const s0 = [B.sign[0] + B.n[0] * 0.09, B.sign[1] + B.n[1] * 0.09], sw = 0.9, sa = [s0[0] - du[0] * sw, s0[1] - du[1] * sw], sb = [s0[0] + du[0] * sw, s0[1] + du[1] * sw];
      B.signQ = texQuad([sb[0], QTOP + 2.2, sb[1]], [sa[0], QTOP + 2.2, sa[1]], [sa[0], QTOP + 3.1, sa[1]], [sb[0], QTOP + 3.1, sb[1]]); }
    if (B.meter.v !== v){ B.meter.v = v; const g = B.cv.getContext('2d'); g.fillStyle = '#10161a'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#7dff9a'; g.font = '700 72px monospace'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(String(v), 200, 66); g.font = '600 34px monospace'; g.fillText('L', 244, 76); upTex(B.meter.tex, B.cv); }
    const TMx = M4.T(-eye[0], -eye[1], -eye[2]);
    drawTexQuad(B.meter.q, B.meter.tex, TMx, VP, false, [B.n[0], 0, B.n[1]]); if (!B.unit) drawTexQuad(B.signQ, B.signT, TMx, VP, true, [B.n[0], 0, B.n[1]]);
    return {liters:v, here:!!here};
  }

  // ---------- boat ----------
  const WHITE = [0.9, 0.92, 0.93], NAVY = [0.1, 0.16, 0.3], RED = [0.45, 0.12, 0.1], FLOOR = [0.72, 0.74, 0.74], ORANGE = [0.93, 0.4, 0.1], SKIN = [0.85, 0.65, 0.5], DARK = [0.14, 0.16, 0.18], GREY = [0.62, 0.64, 0.66], GLASS = [0.2, 0.27, 0.32];
  // ======================= the starter boat: a 19 ft centre-console skiff, modelled in detail =======================
  // smooth-shaded lit program with gloss (vertex colour alpha) for curved parts; textured program for screens and decals
  const LITN_VS = 'attribute vec3 aPos;attribute vec3 aNor;attribute vec4 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vN;varying vec4 vC;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vN=(uM*vec4(aNor,0.0)).xyz;vC=aCol;gl_Position=uVP*w;}';
  const LITN_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uAlpha;uniform float uEmis;varying vec3 vW;varying vec3 vN;varying vec4 vC;' + PLG +
    'void main(){vec3 n=normalize(vN);vec3 V=normalize(-vW);if(dot(n,V)<0.0)n=-n;float dif=max(dot(n,uSun),0.0);vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);' +
    'float sp=pow(max(dot(reflect(-uSun,n),V),0.0),mix(12.0,90.0,vC.a))*vC.a;float fr=pow(1.0-max(dot(n,V),0.0),4.0)*vC.a*0.35;' +
    'vec3 c=vC.rgb*(amb+uSunCol*dif+pLit(vW,n))+uSunCol*sp*0.55+uAmb*1.2*fr+vC.rgb*uEmis;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),uAlpha);}';
  const TEX_VS = 'attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform mat4 uM;varying vec2 vUV;varying vec3 vW;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vUV=aUV;gl_Position=uVP*w;}';
  const TEX_FS = 'precision mediump float;uniform sampler2D uTex;uniform float uLit;uniform vec3 uN;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;varying vec2 vUV;varying vec3 vW;' +
    'void main(){vec4 t=texture2D(uTex,vUV);if(t.a<0.05)discard;vec3 c=uLit>0.5?t.rgb*(uAmb+uSunCol*max(dot(uN,uSun),0.0)):t.rgb;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),t.a);}';
  let PRGN = null, PRGX = null, SK = null, PRGW = null, WKB = null, CHARM_AT = [0.2, 1.6, 0.1];
  // the places on the starter boat that the live parts and the people use, in its frame; a detailed model (GLB) brings its own
  const SKA = {sole:0.2, tub:[0, 0.2, 2.0], fisher:[0.52, 0.2, 0.5], haul:[0.98, 1.02, 0.3], reel:[1.0, 1.2, 0.32], mach:[[0.99, 1.08, -0.3], [0.99, 1.08, 1.1], [0.99, 1.08, 1.6]],
    stack:[0.1, 0.2, 1.2], filler:[0.8, 0.95, 2.3]};
  const WK_VS = 'attribute vec3 aPos;attribute vec4 aW;attribute float aS;uniform mat4 uVP;varying vec4 vW4;varying float vS;varying vec3 vP;void main(){vW4=aW;vS=aS;vP=aPos;gl_Position=uVP*vec4(aPos,1.0);}';
  const WK_FS = 'precision highp float;uniform vec3 uCol;uniform vec3 uAer;uniform vec3 uArm;uniform vec3 uEye;uniform vec3 uFog;uniform float uFogD;uniform float uTime;varying vec4 vW4;varying float vS;varying vec3 vP;' + NOISE +
    'void main(){float u=vW4.x;float v=vW4.y;float age=vW4.z;float foam=0.0;float aer=0.0;' +
    'vec2 P=vP.xz+uEye.xz;' +
    'if(vW4.w<0.5){float e=ns(P*0.33+age*0.12)*0.6+ns(P*0.95-age*0.3)*0.4;float prof=1.0-smoothstep(0.2+0.35*e,1.0,abs(v)*(0.8+0.35*e));' +
    'float f=ns(P*0.55+vec2(age*0.35,0.0))*0.5+ns(P*1.45-vec2(0.0,age*0.7))*0.3+ns(P*3.7+age*0.9)*0.2;' +
    'float cover=clamp(1.0-age*0.11,0.0,1.0);float th=1.0-cover*0.95;' +
    'foam=smoothstep(th,th+0.14,f*(0.35+0.65*prof)+prof*0.25*cover)*prof*(0.62+0.38*f);' +
    'aer=prof*exp(-age*0.08)*0.34*(0.7+0.3*f);}' +
    'else{float prof=1.0-smoothstep(0.1,1.0,abs(v));float sl=u*0.85+v*2.0;float cr=pow(max(sin(sl*2.2+age*0.9),0.0),3.0);float n=ns(vec2(u*0.5,v*3.5+age*0.4));' +
    'foam=cr*prof*smoothstep(0.4,0.8,n)*smoothstep(3.5,0.5,age)*0.85;aer=(cr*0.8+0.3)*prof*exp(-age*0.065)*0.62;}' +
    'foam*=vS;aer*=vS;float d=length(vP);float fg=1.0-exp(-uFogD*uFogD*d*d);' +
    'float al=clamp(max(foam,aer),0.0,0.95);vec3 base=vW4.w<0.5?uAer:uArm;vec3 c=mix(base,uCol,clamp(foam/max(al,0.001),0.0,1.0));gl_FragColor=vec4(mix(c,uFog,fg),al*(1.0-fg));}';
  // builder with normals and gloss: the geometry is VB() (vessel3d.js), this adds the GL buffers
  function NB(){ const o = VB(); o.mesh = g => withOrigin({pb:buf(relTo(o.p, g)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}, g); return o; }
  // arrays {p, n, c} as a mesh to draw
  const upA = o => o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null;
  // the figure's parts for one kit (vessel3d.js wkPart), to pose joint by joint
  const wkMeshes = kit => { const g = n => upA(wkPart(n, kit)), K = WKIT[kit]; return {torso:g(K.torso), head:g('head'), hat:g(K.hat), uarm:g('uarm'), farm:g('farm'), thigh:g('thigh'), shin:g('shin'), boot:g('boot'), hand:g('hand')}; };
  function nSetup(VP){
    gl.useProgram(PRGN.p); const u = PRGN.u; plSet(u);
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uAlpha, 1); gl.uniform1f(u.uEmis, 0);
  }
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
    const person = (B, x, y, z, seated, hands, kit) => {
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
    const pb = NB(); person(pb, 0, 0.2, 0.8, false, [[-0.12, 1.12, 0.05], [0.16, 1.1, 0.05]], 'skipper');
    const cb = NB(); person(cb, 0.26, 0.32, 1.16, true, null, 'crew');
    // the angler at the rail (built facing -z, turned to face starboard when drawn), and the rod (butt at the hands, pointing -z)
    const ab = NB(); person(ab, 0, 0, 0, false, [[-0.1, 1.2, -0.3], [0.1, 1.14, -0.26]], 'skipper');
    const rb = NB(); rb.tube([[0, 0, 0.35], [0, 0, -0.1]], 0.02, [0.12, 0.1, 0.08, 0.3], 8); rb.tube([[0, 0, -0.1], [0, 0, -2.3]], 0.009, [0.25, 0.32, 0.3, 0.8], 6); rb.rbox(0, -0.07, 0.1, 0.07, 0.08, 0.1, 0.03, [0.15, 0.15, 0.17, 0.6]);
    // the fisher at the rail: body without arms (the arms are drawn live, reaching for rod, reel or line)
    const fb = NB(); person(fb, 0, 0, 0, false, false, 'skipper');
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
    // one fish, 1 m long along -z (head forward), coloured per species: back, belly
    const FC = {torsk:[[0.36, 0.33, 0.2, 0.5], [0.9, 0.88, 0.8, 0.5]], sei:[[0.2, 0.25, 0.24, 0.6], [0.72, 0.74, 0.74, 0.6]], hyse:[[0.28, 0.3, 0.33, 0.6], [0.85, 0.86, 0.88, 0.7]], lange:[[0.42, 0.36, 0.26, 0.5], [0.8, 0.76, 0.66, 0.5]], brosme:[[0.45, 0.33, 0.2, 0.5], [0.72, 0.6, 0.45, 0.5]], lyr:[[0.33, 0.32, 0.2, 0.55], [0.82, 0.8, 0.7, 0.6]], uer:[[0.72, 0.22, 0.14, 0.6], [0.92, 0.55, 0.42, 0.6]], kveite:[[0.26, 0.25, 0.2, 0.4], [0.94, 0.94, 0.92, 0.6]]};
    const fishM = {}; for (const sp in FC){ const f = NB(), [back, belly] = FC[sp], G = [], NZ = 12, NA = 12;
      for (let i = 0; i <= NZ; i++){ const t = i / NZ, z = -0.5 + t, r = Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.8) * 0.09 * (sp === 'lange' ? 0.7 : 1), row = []; for (let j = 0; j <= NA; j++){ const a = j / NA * Math.PI * 2; row.push([Math.cos(a) * r * 0.75, Math.sin(a) * r, z]); } G.push(row); }
      f.grid(G, (i, j) => (j < NA / 2 ? back : belly));
      f.tri([0, 0, 0.47], [0, 0.11, 0.6], [0, -0.11, 0.6], back); f.tri([0, 0.07, -0.15], [0, 0.15, 0.05], [0, 0.07, 0.1], back);
      if (sp === 'hyse') f.box(0.068, 0.005, 0.0, 0.004, 0.012, 0.7, [0.05, 0.05, 0.06, 0.3]);
      fishM[sp] = f.mesh(); }

    const cvP = document.createElement('canvas'); cvP.width = 512; cvP.height = 320;
    const cvG = document.createElement('canvas'); cvG.width = 512; cvG.height = 256;
    const cvV = document.createElement('canvas'); cvV.width = 256; cvV.height = 140;
    const cvN = document.createElement('canvas'); cvN.width = 512; cvN.height = 128;
    SK = {hull, glass:gl2.mesh(), wheel:wh.mesh(), lever:lv.mesh(), motor:ob.mesh(), prop:prop.mesh(), cap:cap.mesh(),
      qPlot:texQuad(...scrPlot), qGauge:texQuad(...scrGauge), qVhf:texQuad(...scrVhf), qName:nq,
      skipper:pb.mesh(), crew:cb.mesh(), angler:ab.mesh(), rod:rb.mesh(), fishM, tipW:null, rodT:0, fisher:fb.mesh(), cstr:cs.mesh(), shoe:hs.mesh(), limb:lb.mesh(), hand:hb.mesh(), reelF:jf.mesh(), reelD:jd.mesh(), mach:mm.mesh(), anim:null, lines:[], tPlot:mkTex(), tGauge:mkTex(), tVhf:mkTex(), tName:mkTex(), cvP, cvG, cvV, cvN, nameKey:'',
      wheelAt:[0.02, 0.98, zb - 0.075], wheelTilt:0.42, leverAt:lvBox, motorAt:[0, 0.5, zs(0) + 0.02],
      needle:{rpm:0, fuel:0, temp:8, volt:12.6}, wheelA:0, headPrev:null, propA:0, tP:0, tG:0};
    if (glbHas('worker')) SK.wk = wkMeshes('skipper');      // the fisher's arms, drawn live
    // the detailed model from tools/boats (skiff59.py): hull, glass, the lid, the outboard and its propeller from the GLB, and the places
    // from its anchors; the console's screens are part of the model and not live
    const GK = glbHas('skiff') ? geoOf('skiff') : null, A = GK && GK.skiff;
    if (A){
      const up = o => o ? {pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3} : null;
      SK.hull = up(glbPart('skiff', 'lod0')) || SK.hull; SK.glass = up(glbPart('skiff', 'glass')) || SK.glass;
      SK.motor = up(glbPart('skiff', 'outboard')) || SK.motor; SK.prop = up(glbPart('skiff', 'prop')) || SK.prop; SK.propAt = A.prop;
      const cp = glbPart('skiff', 'cap'); if (cp){ const c = MB(); for (let i = 0; i < cp.p.length; i += 9) c.tri([cp.p[i], cp.p[i + 1], cp.p[i + 2]], [cp.p[i + 3], cp.p[i + 4], cp.p[i + 5]], [cp.p[i + 6], cp.p[i + 7], cp.p[i + 8]], [1, 1, 1]); SK.cap = c.mesh(); }
      SK.wheelAt = A.wheel; SK.wheelTilt = A.wheelTilt; SK.leverAt = A.lever; SK.motorAt = A.motor; SK.live = false;
      if (A.names) SK.qName = A.names.map(([B, T]) => texStrip(B, T));
      const w = A.wheel, ps = NB(); person(ps, A.skipper[0], A.skipper[1], A.skipper[2], false, [[w[0] - 0.14, w[1] + 0.14, w[2] + 0.05], [w[0] + 0.14, w[1] + 0.12, w[2] + 0.05]], 'skipper'); SK.skipper = ps.mesh();
      const pc = NB(); person(pc, A.seat[0], A.seat[1], A.seat[2], true, null, 'crew'); SK.crew = pc.mesh();
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
    if (Hn - aisCache.t > 0.02 || aisCache.t < 0){ aisCache = {t:Hn, v:npcStates(Hn)}; }
    for (const n of aisCache.v){ const x = X(n.p.x) + cw / 2, y = Y(n.p.y); if (x < -10 || x > cw + 10 || y < top - 10 || y > top + ch + 10) continue; g.save(); g.translate(x, y); g.rotate(n.cog !== undefined ? n.cog : n.hd); g.fillStyle = n.fleet || n.coast ? '#ff8a65' : '#4c8df0'; g.strokeStyle = '#1b2a33'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -9); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
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
    g.fillText('SOG ' + fmt(sog, 1) + ' kn   COG ' + String(Math.round(((bv.head * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0') + '°', 10, 18);
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
  function paintName(){
    const nm = S.boatName || 'Havbris'; if (SK.nameKey === nm) return; SK.nameKey = nm;
    const g = SK.cvN.getContext('2d'); g.clearRect(0, 0, 512, 128); g.fillStyle = '#14233d'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 78; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; while (g.measureText(nm).width > 480 && fs > 30){ fs -= 4; g.font = 'italic 700 ' + fs + 'px Georgia, serif'; }
    g.fillText(nm, 256, 66); upTex(SK.tName, SK.cvN);
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
    const R = window.ROD ? window.ROD.state() : null, rodOn = R && R.on, fishing = S.boat.status === 'fishing' && !S.boat.deckStop;   // with all hands on deck, nobody fishes
    drawN(SK.hull, BMrel); if (showSkipper && !rodOn && !fishing) drawN(SK.skipper, BMrel); if (showCrew) drawN(SK.crew, BMrel);
    SK.rodT += dt; SK.lines = []; SK.tipW = null;
    const T = SK.rodT, A = SK.anim || (SK.anim = {mode:null, st:'jig', t:0, fish:[], fly:[], th:0, mc:[]});
    const kv = S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60), mode = rodOn ? 'game' : !fishing ? null : S.boat.gop ? 'gear' : (!kv && S.equip && S.equip.jukse > 0) ? 'machine' : (S.boat.gear || kv) ? 'juksa' : 'rod';
    if (mode !== A.mode){ A.mode = mode; A.st = 'jig'; A.t = 0; A.fish = []; A.fly = []; A.mc = []; }
    // fish reported by the fishing step; stale ones (3D was off) are dropped
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now();
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!mode || mode === 'game') Q.length = 0;
    const airKg = Q.reduce((a, f) => a + f.kg, 0) + A.fish.reduce((a, f) => a + f.kg, 0) + A.fly.reduce((a, f) => a + f.kg, 0) + A.mc.reduce((a, m) => a + (m.fish || []).reduce((c, f) => c + f.kg, 0), 0);
    // the catch in the tub: one fish per ~5 kg, species in proportion to the hold; fish still in the air are not in it yet
    { const all = S.hold.reduce((a, x) => a + x.kg, 0), tot = Math.max(0, all - airKg), n = Math.min(40, Math.ceil(tot / 5)); if (n > 0){ const cum = []; let acc = 0; for (const sp of SP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
      for (let i = 0; i < n; i++){ const r = hash(i * 7 + 3), sp = (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0], lay = Math.floor(i / 8), k = i % 8, x = SKA.tub[0] - 0.18 + (k % 2) * 0.36 + (hash(i * 3 + 1) - 0.5) * 0.06, z = SKA.tub[2] - 0.16 + Math.floor(k / 2) * 0.11;
        drawN(SK.fishM[sp] || SK.fishM.torsk, chain(BMrel, M4.T(x, SKA.tub[1] + 0.05 + lay * 0.05, z), M4.RY(Math.PI / 2 + (k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.4), M4.RZ(Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), M4.S(0.42 + hash(i * 13) * 0.12))); } } }
    // luck aboard: a charm swinging from the grab rail
    if (S.haill && haillF() > 0){ const CM = chain(BMrel, M4.T(CHARM_AT[0], CHARM_AT[1], CHARM_AT[2]), M4.RZ(Math.sin(T * 1.3) * 0.18), M4.RX(Math.sin(T * 0.9) * 0.12)); drawN(SK.cstr, CM);
      if (S.haill.type === 'luksus') drawN(SK.shoe, CM); else drawN(SK.fishM[S.haill.type === 'kveit' ? 'kveite' : 'torsk'], chain(CM, M4.T(0, -0.17, 0), M4.RX(Math.PI / 2), M4.S(0.16))); }
    const L2R = q => xf(BMrel, q), fsc = kg => clamp(0.42 * Math.cbrt(kg), 0.28, 1.2);
    const hang = (sp, kg, P, w) => drawN(SK.fishM[sp] || SK.fishM.torsk, chain(BMrel, M4.T(P[0], P[1] - fsc(kg) * 0.45, P[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + w) * 0.45), M4.S(fsc(kg))));
    const TUB = [SKA.tub[0], SKA.tub[1] + 0.42, SKA.tub[2] - 0.05], F = SKA.fisher;
    // fish swung from the rail into the tub
    for (let i = A.fly.length - 1; i >= 0; i--){ const f = A.fly[i]; f.u += dt / 0.75; if (f.u >= 1){ A.fly.splice(i, 1); continue; }
      const u = f.u; hang(f.sp, f.kg, [f.a[0] + (TUB[0] - f.a[0]) * u, f.a[1] + (TUB[1] - f.a[1]) * u + Math.sin(Math.PI * u) * 0.45, f.a[2] + (TUB[2] - f.a[2]) * u], i); }
    if (mode && mode !== 'game'){
      const FP = chain(M4.T(F[0], F[1], F[2]), M4.RY(-Math.PI / 2)); drawN(SK.fisher, chain(BMrel, FP));
      const shY = SK.wk ? WK_SH : 1.3, shR = xf(FP, [0.2, shY, 0]), shL = xf(FP, [-0.2, shY, 0]); let hR, hL;
      A.t += dt;
      if (mode === 'gear'){
        const RL = SKA.haul, w = T * 3.2, hauling = S.boat.gop.op === 'haul';
        hR = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w)), RL[2] + 0.12]; hL = [RL[0] - 0.02, RL[1] + 0.05 + 0.22 * Math.max(0, Math.sin(w + Math.PI)), RL[2] - 0.12];
        SK.lines.push([L2R(RL), L2R([RL[0] + 1.4, -0.3, RL[2] - 1.0])]);
        if (hauling && Q.length && (A.t > 0.9)){ const f = Q.shift(); A.fly.push({...f, a:[RL[0] - 0.05, RL[1] + 0.1, RL[2]], u:0}); A.t = 0; }
      } else if (mode === 'rod'){
        // one lure: jig until a fish takes it, lift it to the tip and swing it in
        if (A.st === 'jig' && Q.length){ A.fish = [Q.shift()]; A.st = 'haul'; A.t = 0; }
        let el = 0.25 + 0.4 * Math.pow(Math.max(0, Math.sin(T * 2.2)), 2), q = 0;
        if (A.st === 'haul'){ q = Math.min(1, A.t / 1.4); el = 0.45 + 0.6 * q + 0.05 * Math.sin(T * 14); }
        const RM = chain(FP, M4.T(0, 1.18, -0.3), M4.RX(el)); drawN(SK.rod, chain(BMrel, RM));
        const tip = xf(RM, [0, 0, -2.3]); hR = xf(RM, [0, 0, 0.26]); hL = xf(RM, [0, 0, -0.12]);
        if (A.st === 'haul' && A.fish.length){ const f = A.fish[0], hk = [tip[0], -0.6 + (tip[1] - 0.25 + 0.6) * q, tip[2]]; if (hk[1] > -0.2) hang(f.sp, f.kg, hk, 0); SK.lines.push([L2R(tip), L2R(hk)]);
          if (A.t > 1.55){ A.fly.push({...f, a:hk, u:0}); A.fish = []; A.st = 'jig'; } }
        else SK.lines.push([L2R(tip), L2R([tip[0], -0.3, tip[2]])]);
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
            if (y >= RL[1] - 0.1){ A.fly.push({...f, a:[WX - 0.05, RL[1], C[2]], u:0}); A.fish.splice(i, 1); continue; }
            const P = [WX + 0.04 * Math.sin(T * 3 + i), y, C[2]]; if (y > -0.2) hang(f.sp, f.kg, P, i + 1); low = low || P; }
          SK.lines.push([L2R(top), L2R(low || [WX, Math.min(RL[1], end), C[2]])]);
          if (!A.fish.length && A.t > 0.8){ A.st = 'jig'; A.t = 0; }
        }
      } else {
        // jigging machines on the rail work by themselves; the fisher takes the fish off as they come up
        const n = Math.min(3, S.equip.jukse);
        while (A.mc.length < n) A.mc.push({st:'jig', t:0, fish:[]});
        let busy = null;
        for (let k = 0; k < n; k++){ const m = A.mc[k], P = SKA.mach[k], tip = [P[0] + 0.8, P[1] + 0.62, P[2]]; m.t += dt;
          drawN(SK.mach, chain(BMrel, M4.T(P[0], P[1], P[2])));
          if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.4 - 0.5 * m.fish.length; }
          if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
          else { const end = m.d0 + m.t * 1.3; let low = null;
            for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
              if (y >= tip[1] - 0.35){ A.fly.push({...f, a:[tip[0] - 0.2, tip[1] - 0.35, tip[2]], u:0}); m.fish.splice(i, 1); busy = tip; continue; }
              const Pf = [tip[0], y, tip[2]]; if (y > -0.2) hang(f.sp, f.kg, Pf, i + k * 3); low = low || Pf; if (y > tip[1] - 1.0) busy = tip; }
            SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
            if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
        hR = busy ? [busy[0] - 0.35, busy[1] - 0.45, busy[2] + 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] + 0.12]; hL = busy ? [busy[0] - 0.4, busy[1] - 0.5, busy[2] - 0.08] : [F[0] + 0.43, F[1] + 0.92, F[2] - 0.12];
      }
      // arms: shoulder to hand with the elbow bent down and out
      const arm = (Sw, Hw, sd) => { const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), seg = 0.31, Lc = Math.min(Lh, 2 * seg * 0.995);
        let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
        const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
        if (SK.wk){ const W = SK.wk, f = [Hc[0] - E[0], Hc[1] - E[1], Hc[2] - E[2]], fl = Math.hypot(f[0], f[1], f[2]) || 1, HT = [Hc[0] + f[0] / fl * WK_S, Hc[1] + f[1] / fl * WK_S, Hc[2] + f[2] / fl * WK_S];
          drawN(W.uarm, chain(BMrel, limbM(Sw, E, WK_S))); drawN(W.farm, chain(BMrel, limbM(E, Hc, WK_S))); drawN(W.hand, chain(BMrel, limbM(Hc, HT, WK_S))); return; }
        drawN(SK.limb, chain(BMrel, limbM(Sw, E, 0.056))); drawN(SK.limb, chain(BMrel, limbM(E, Hc, 0.048))); drawN(SK.hand, chain(BMrel, M4.T(Hc[0], Hc[1], Hc[2]))); };
      arm(shR, hR, 1); arm(shL, hL, -1);
    }
    if (rodOn){
      SK.rodT += dt; const T = SK.rodT, st = R.st;
      let el = 0.3; if (st === 'jig') el = 0.25 + 0.4 * Math.pow(Math.max(0, Math.sin(T * 2.2)), 2); else if (st === 'bite') el = 0.35 + 0.12 * Math.sin(T * 38); else if (st === 'fight') el = 0.75 + 0.14 * Math.sin(T * (R.hold ? 9 : 3)) * (0.4 + R.tens); else if (st === 'land') el = 1.1; else el = 0.2;
      const AM = chain(BMrel, M4.T(F[0] - 0.02, F[1], F[2]), M4.RY(-Math.PI / 2)), RM = chain(AM, M4.T(0, 1.18, -0.3), M4.RX(el));
      drawN(SK.angler, AM); drawN(SK.rod, RM);
      const tip = xf(RM, [0, 0, -2.3]); SK.tipW = tip;
      if ((st === 'fight' && R.prog > 0.85) || st === 'land'){
        const q = st === 'land' ? clamp(R.phase / 1.4, 0, 1) : 0, sp = R.fish ? R.fish.sp : 'torsk', sc = R.fish ? clamp(0.42 * Math.cbrt(R.fish.kg), 0.3, 1.1) : 0.6;
        const water = xf(BMrel, [F[0] + 1.58, 0, F[2]]), tub = xf(BMrel, [TUB[0], TUB[1] - 0.02, TUB[2]]);
        const px = q < 0.5 ? water[0] + (tip[0] - water[0]) * q * 2 * 0.8 : tip[0] + (tub[0] - tip[0]) * (q - 0.5) * 2, py = q < 0.5 ? water[1] + (tip[1] - 0.6 - water[1]) * q * 2 : tip[1] - 0.6 + (tub[1] - tip[1] + 0.6) * (q - 0.5) * 2, pz = q < 0.5 ? water[2] + (tip[2] - water[2]) * q * 2 * 0.8 : tip[2] + (tub[2] - tip[2]) * (q - 0.5) * 2;
        drawN(SK.fishM[sp] || SK.fishM.torsk, chain(M4.T(px, py, pz), M4.RX(Math.PI / 2 - 0.2), M4.RZ(Math.sin(T * 14) * 0.5), M4.S(sc)));
      }
    }
    drawN(SK.wheel, chain(BMrel, M4.T(...SK.wheelAt), M4.RX(-SK.wheelTilt), M4.RZ(SK.wheelA)));
    drawN(SK.lever, chain(BMrel, M4.T(...SK.leverAt), M4.RX(-(0.1 + frac * 0.9))));
    const MM = chain(BMrel, M4.T(...SK.motorAt), M4.RY(-SK.wheelA * 0.1), M4.RX(on ? 0.05 : 0));
    drawN(SK.motor, MM); drawN(SK.prop, chain(MM, M4.T(...(SK.propAt || [0, -1.0, 0.54])), M4.RZ(SK.propA)));
    gl.disableVertexAttribArray(2);
    // screens and name boards up close
    const near = Math.hypot(BMrel[12], BMrel[13], BMrel[14]) < 45, now = performance.now();
    paintName();
    for (const q of SK.qName) drawTexQuad(q, SK.tName, BMrel, VP, true, [0, 0.2, 0]);
    if (near && SK.live !== false){
      if (now - SK.tP > 500){ SK.tP = now; paintPlotter(); if (S.equip.vhf) paintVhf(); }
      if (now - SK.tG > 90){ paintGauges((now - SK.tG) / 1000); SK.tG = now; }
      drawTexQuad(SK.qPlot, SK.tPlot, BMrel, VP, false); drawTexQuad(SK.qGauge, SK.tGauge, BMrel, VP, false); if (S.equip.vhf) drawTexQuad(SK.qVhf, SK.tVhf, BMrel, VP, false);
    }
  }
  function drawSkiffGlass(BMrel, VP){ if (SK) drawGlass(SK.glass, BMrel, VP); }
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
    FLAGM = {pb:buf(new Float32Array(FW * FH * 18), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), cb:buf(new Float32Array(col)), n:FW * FH * 6, pos:new Float32Array(FW * FH * 18)};
  }
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
  const HALF = 300, NP = 150; let curFov = 0.96;
  function buildSea(){
    const v = new Float32Array((NP + 1) * (NP + 1) * 2); let k = 0;
    for (let j = 0; j <= NP; j++) for (let i = 0; i <= NP; i++){ v[k++] = -HALF + i * 2 * HALF / NP; v[k++] = -HALF + j * 2 * HALF / NP; }
    const idx = new Uint16Array(NP * NP * 6); k = 0;
    for (let j = 0; j < NP; j++) for (let i = 0; i < NP; i++){ const a = j * (NP + 1) + i, b = a + 1, c = a + NP + 1, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    PATCH = {pb:buf(v), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length};
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
    const p = {x:bv.x / 1000, y:bv.z / 1000}, gT = gridGamma(p), hsT = hsAt(p, H), WT = windAt(H), wdT = windDir(H) - gT, dirT = (wdT + 180) * DEG, SW = swellOpen(H), swDirT = (SW.dir - gT + 180) * DEG;   // the world is drawn on the grid: true directions turn by -gamma
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
    const e = s * 0.3536, a = WK.u1[1] * (1 - sstep(WK.u1[3] * 0.55, WK.u1[3], s));
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
  const SEA_D = [0, 0, 0];
  function seaDisp(x, z, t, S, fade){
    let dx = 0, dy = 0, dz = 0; const ren = 1 / Math.sqrt(Math.max(1 - 2 * S[2] * (1 - S[2]) * (1 - WV.dot), 0.05)), cell = 2 * HALF / NP;
    for (let i = 0; i < WV.list.length; i++){
      const c = WV.list[i], att = sstep(2.5, 5, 2 * Math.PI / (c.k * cell)); if (att <= 0) continue;
      const am0 = c.swell ? S[1] * c.wo : S[0] * (S[2] * c.wo + (1 - S[2]) * c.wy) * ren, Q = c.swell ? 0.3 : Math.min(WV.steep / (10 * c.k * am0 + 1e-4), 1);
      const grp = 0.62 + 0.38 * Math.sin((x * c.Dx + z * c.Dz) * c.k * 0.083 + (x * c.Dz - z * c.Dx) * c.k * 0.041 - c.om * t * 0.5 + i * 2.59);
      const am = am0 * grp * att * fade, f = c.k * (c.Dx * x + c.Dz * z) - c.om * t + c.ph, co = Math.cos(f);
      dx += Q * am * c.Dx * co; dz += Q * am * c.Dz * co; dy += am * Math.sin(f);
    }
    SEA_D[0] = dx; SEA_D[1] = dy; SEA_D[2] = dz; return SEA_D;
  }
  function seaFade(x, z){ const st = 2 * HALF / NP, ox = Math.round(bv.x / st) * st, oz = Math.round(bv.z / st) * st; return 1 - sstep(0.6, 1, Math.max(Math.abs(x - ox), Math.abs(z - oz)) / HALF); }
  function seaH(x, z, t){
    const tide = env.tide || 0, fade = seaFade(x, z); if (fade <= 0 || !WV.list.length) return tide;
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
    env.fog = hor; env.fogD = 1.73 / (Math.min(env.vis, 50 * Math.exp(-0.325 * Math.max(0, windAt(H) - 20.8))) * 1000);
    env.stars = sstep(-5, -12, el) * (1 - env.cloud); env.spec = sstep(-1, 4, el) * (1 - env.cloud) * 2.2;
    env.night = sstep(3, -5, el);
    // moon: where it is, how full, and the light it gives at night
    const mo = moonAt(H), mr = mo.el * DEG; env.moon = mo; env.moonDir = [Math.cos(mr) * Math.sin(mo.az - gz), Math.sin(mr), -Math.cos(mr) * Math.cos(mo.az - gz)];
    env.moonA = sstep(-1, 2, mo.el) * (1 - 0.6 * env.day);
    const mlight = sstep(0, 8, mo.el) * mo.illum * sstep(-2, -8, el) * (1 - 0.8 * env.cloud);
    if (mlight > 0.02){ const ml = [0.62, 0.7, 0.9].map(v => v * mlight * 0.32); env.sunCol = env.sunCol.map((v, k) => v + ml[k]); env.amb = env.amb.map((v, k) => v + [0.02, 0.025, 0.04][k] * mlight); const my = Math.max(env.moonDir[1], 0.25), mll = Math.hypot(env.moonDir[0], my, env.moonDir[2]); env.lightDir = [env.moonDir[0] / mll, my / mll, env.moonDir[2] / mll]; }
    env.shadowDir = el > -1 ? env.sunDir : mlight > 0.02 ? env.moonDir : null;
    env.tide = tideH(H);
    const sn = Math.round(seasonal(SNOWLINE, H) / 20) * 20; if (sn !== snowNow){ snowNow = sn; recolor(TERR, sn); if (NEARM) recolor(NEARM, sn); for (const m of UPATCH) recolor(m, sn); }
  }


  // ---------- mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off) ----------
  const MO = {key:'', phase:'', t:0, from:null, dur:0, lines:0, len:[0, 0, 0, 0], init:false};
  const LINE_S = 1.8;   // seconds for each line to go on
  let ROPEM = null, FENDM = null;
  function buildMooring(){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.2, 0.36, 0.72, 0.15], 6); ROPEM = r.mesh(); const f = NB(); f.tube([[0, -0.26, 0], [0, 0.26, 0]], 0.12, [0.93, 0.93, 0.9, 0.35], 10); FENDM = f.mesh(); }
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
  function lieAlongside(dt, bp){
    bv.spd = 0; bv.yr = 0; bv.px += (bp.x * 1000 - bv.px) * (1 - Math.exp(-dt * 2)); bv.pz += (bp.y * 1000 - bv.pz) * (1 - Math.exp(-dt * 2)); bv.cog += angDiff(bv.cog, bp.hd) * (1 - Math.exp(-dt * 2));
  }
  function moorStep(dt, bp){
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
      if (d < 3 || b.status === 'unmooring' || !MO.init){ MO.phase = 'moored'; MO.lines = 4; }
      else { MO.phase = 'in'; MO.t = 0; MO.from = {x:bv.px, z:bv.pz, h:bv.cog}; MO.dur = clamp(d / 1.3, 8, 40); MO.lines = 0; }
      MO.init = true;
    }
    if (b.status === 'unmooring'){ MO.phase = 'out'; MO.lines = clamp(4 * (b.castUntil - S.t - currentFrac()) / CAST_MIN, 0, 4); }
    if (MO.phase === 'in'){
      MO.t += dt * sp; const u0 = clamp(MO.t / MO.dur, 0, 1);
      approach(MO.from, bp, u0, sp / MO.dur);
      if (u0 >= 1){ MO.phase = 'lines'; MO.t = 0; bv.cog = bp.hd; }
    } else {
      if (MO.phase === 'lines'){ MO.t += dt * sp; MO.lines = Math.min(4, MO.t / LINE_S); if (MO.lines >= 4) MO.phase = 'moored'; }
      // lying alongside: held in place by the lines, the swell moves her a little
      lieAlongside(dt, bp);
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
  function updateBoat(dt, t, frac){
    const b = S.boat, pr = predict(frac), tx = pr.p.x * 1000, tz = pr.p.y * 1000, sailing = b.status === 'sailing' && S.plan, G = GEO(vtype());
    const zp = (G.bow || -2.2) + ((G.stern || 3.1) - (G.bow || -2.2)) / 3;   // pivot point, local z (negative = forward)
    if (!bv.init || Math.hypot(tx - (bv.px || 0), tz - (bv.pz || 0)) > 900){ bv.px = tx; bv.pz = tz; bv.cog = pr.hd; bv.head = pr.hd; bv.spd = sailing ? b.v * KNV() : 0; bv.yr = 0; bv.beta = 0; bv.init = true; bv.osc = false; bv.st = null; TRAIL.length = 0; WV.init = false; }
    else if (dt > 0){
      const bp = berthNow();
      if (bp) moorStep(dt, bp);
      else if (helmOn()){
        // by hand (16-helm.js): she is where the simulation puts her every tick, so she follows it closely; the turn (a game second's,
        // so times the rate on the screen) and the way she
        // has come from the helm, so she banks and makes her wake as under a route
        const h = S.helm, k = 1 - Math.exp(-dt * 6);
        bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k; bv.cog += angDiff(bv.cog, pr.hd) * k;
        bv.yr += (h.yaw * simRate() - bv.yr) * (1 - Math.exp(-dt * 3)); bv.spd = Math.abs(h.v) * KNV();
      }
      else if (sailing){
        const vs = sailV(S.t / 60) * KNV(), la = livePose(frac + clamp(1.6 * GAME_RATE * (S.mult || 1) / 60, 0.04, 0.6)).p, cx = la.x * 1000, cz = la.y * 1000;
        // the next stop or the route's end: when the point ahead has reached it, she comes in to it and stops there instead of keeping
        // way on past it and circling back (the user's test 04.10.2026: she spun round the last waypoint until the next tick)
        const pl = S.plan; let endW = null;
        if (pl) for (let i = pl.idx; i < pl.wps.length; i++){ const w = pl.wps[i]; if (wpStop(w) || i === pl.wps.length - 1){ endW = w; break; } }
        const arriving = !!endW && Math.hypot(cx - endW.x * 1000, cz - endW.y * 1000) < 1, ax = arriving ? endW.x * 1000 - bv.px : 0, az = arriving ? endW.y * 1000 - bv.pz : 0, dEnd = Math.hypot(ax, az);
        const f0x = Math.sin(bv.cog), f0z = -Math.cos(bv.cog), past = arriving && (dEnd < 3 || ax * f0x + az * f0z < 0);
        // steer for a point a little ahead on the track, turning no faster than the turning radius allows
        const want = past ? bv.cog : Math.hypot(cx - bv.px, cz - bv.pz) > 1 ? Math.atan2(cx - bv.px, -(cz - bv.pz)) : pr.hd;
        const wmax = clamp(bv.spd / ((VESSELS[vtype()] || {}).turnR || 40), 0.6, 1.4), err = angDiff(bv.cog, want), rDes = clamp(err * 2.2, -wmax, wmax);
        bv.yr += (rDes - bv.yr) * (1 - Math.exp(-dt * 3)); bv.cog += bv.yr * dt;
        // speed: keep up with the simulated position, with limits on acceleration and braking
        const fx = Math.sin(bv.cog), fz = -Math.cos(bv.cog), rx = Math.cos(bv.cog), rz = Math.sin(bv.cog), ex = tx - bv.px, ez = tz - bv.pz;
        // always keep some way on while turning (like a boat swinging out from the quay), and catch up without racing; coming in to the end,
        // slow down with the distance left and stop at it
        const vDes = past ? 0 : arriving ? Math.min(vs, Math.max(0, dEnd - 1) * 0.8) : clamp(vs + (ex * fx + ez * fz) * 0.5, vs * (0.25 + 0.3 * Math.max(0, Math.cos(err))), vs * 1.25 + 3), aMax = Math.max(3, vs / 4);
        bv.spd += clamp(vDes - bv.spd, -aMax * 1.4 * dt, aMax * dt);
        bv.px += fx * bv.spd * dt; bv.pz += fz * bv.spd * dt;
      } else {
        // in port, fishing or drifting: glide to the spot, coast to a stop and swing slowly to the new heading
        bv.spd *= Math.exp(-dt * 1.2); bv.yr *= Math.exp(-dt * 2);
        const k = 1 - Math.exp(-dt * 1.5); bv.px += (tx - bv.px) * k; bv.pz += (tz - bv.pz) * k;
        bv.cog += angDiff(bv.cog, pr.hd) * (1 - Math.exp(-dt * 0.7));
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
    let hm = 0, sl = 0, st = 0;
    for (const a of [-0.5, 0, 0.5]) for (const c of [-0.5, 0, 0.5]){ const h = seaH(bv.x + fx * a * Ls + rx * c * Bs, bv.z + fz * a * Ls + rz * c * Bs, t); hm += h; sl += h * a; st += h * c; }
    hm /= 9; sl /= 1.5 * Ls; st /= 1.5 * Bs;
    const v = b.status === 'sailing' ? bv.spd / KNV() : 0;
    const trim = 0.07 * sstep(9, 17, v) - 0.02 * sstep(3, 9, v) * (1 - sstep(9, 13, v));
    // planing hulls bank into a turn, displacement hulls heel a little outwards
    const bank = (BOAT.planing ? -0.18 : 0.06) * clamp(bv.yr, -1.2, 1.2) * sstep(4, 18, v);
    let tp = Math.atan(sl) + trim, tr = Math.atan(st) + bank + (bv.heel || 0), ty = hm + 0.06;
    // Under way the boat on screen runs GAME_RATE x (and the pace) faster than she would through these waves, which move in real time,
    // so she met them several times too often and heaved a metre at half a second in a gale (the user's «rister voldsomt» at the
    // helm, 03.10.2026): the sea she answers is smoothed over a time that grows with that speed
    const tf = 0.45 * sstep(2, 14, bv.spd || 0) + 0.3 * sstep(14, 45, bv.spd || 0);
    if (!bv.osc || tf < 0.02 || bv.fy === undefined){ bv.fy = ty; bv.fp = tp; bv.fr = tr; }
    else { const k = 1 - Math.exp(-dt / tf); bv.fy += (ty - bv.fy) * k; bv.fp += (tp - bv.fp) * k; bv.fr += (tr - bv.fr) * k; ty = bv.fy; tp = bv.fp; tr = bv.fr; }
    if (!bv.osc){ bv.osc = true; bv.vy = bv.vp = bv.vr = 0; bv.y = ty; bv.pitch = tp; bv.roll = tr; }
    const wz = 2 * Math.PI / Math.max(0.6, bv.st.Tz), wr = 2 * Math.PI / Math.max(0.8, bv.st.Tr), zz = 0.35, zr = 0.08, n = Math.ceil(dt / 0.02), h = dt / n, lim = Math.min(0.9, bv.st.deckEdge * 1.6);
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
  const WN = 260, wk = {x:new Float64Array(WN), y:new Float64Array(WN), z:new Float64Array(WN), vx:new Float64Array(WN), vy:new Float64Array(WN), vz:new Float64Array(WN), age:new Float64Array(WN).fill(99), life:new Float64Array(WN).fill(1), g:new Float64Array(WN), n:0, acc:0, sacc:0};
  function spawn(x, y, z, vx, vy, vz, life, g){ const i = wk.n = (wk.n + 1) % WN; wk.x[i] = x; wk.y[i] = y; wk.z[i] = z; wk.vx[i] = vx; wk.vy[i] = vy; wk.vz[i] = vz; wk.age[i] = 0; wk.life[i] = life; wk.g[i] = g; }
  const PB = new Float32Array(4000 * 3), PA = new Float32Array(4000);
  function drawPts(n, mode, VP, col, size, round, off){
    if (!n) return;
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uOff, off || [0, 0, 0]); gl.uniform1f(u.uPull, 0); gl.uniform3fv(u.uCol, col); gl.uniform1f(u.uSize, size); gl.uniform1f(u.uRound, round ? 1 : 0);
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
    if (m.parts){ for (const q of m.parts) drawLit(q, M, hole); return; }
    gl.uniformMatrix4fv(PL.u.uM, false, m.o ? relM(m) : M); gl.uniform4fv(PL.u.uHole, hole || NOHOLE); attr(0, m.pb, 3); attr(1, m.cb, 3);
    if (m.ib){ gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0); } else gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }
  function drawTerrain(TM, eye, VP, near){
    gl.useProgram(PT.p); const u = PT.u; plSet(u);
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uSand, snowNow < 5 ? [0.84, 0.86, 0.88] : [0.74, 0.71, 0.6]); gl.uniformMatrix4fv(u.uM, false, TM);
    const one = (m, hole, ground) => {
      gl.uniformMatrix4fv(u.uM, false, relM(m)); gl.uniform3fv(u.uPO, [m.o[0] - RO.x, 0, m.o[1] - RO.z]); gl.uniform4fv(u.uHole, hole || NOHOLE); gl.uniform1f(u.uGOn, ground && GTEX ? 1 : 0); gl.uniform1f(u.uLOn, ground && LMTEX ? 1 : 0);
      if (ground && LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE0); }
      if (GRECT) gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]);
      if (ground && GTEX){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX); gl.uniform1i(u.uGround, 0); gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]); }
      attr(0, m.pb, 3); attr(1, m.cb, 3); attr(2, m.nb, 3); attr(3, m.sb, 1); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
    };
    const holeOf = (M, g) => new Float32Array([M.x0 + g - eye[0], M.z0 + g - eye[2], M.x0 + M.sx - g - eye[0], M.z0 + M.sz - g - eye[2]]);
    if (!NEARM) one(TERR);
    else if (near){ one(NEARM, null, true); if (UPATCH.length){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2); for (const m of UPATCH) one(m, null, true); gl.disable(gl.POLYGON_OFFSET_FILL); } }
    else if (!MIDM) one(TERR, holeOf(NEARM, 45));
    else { one(TERR, holeOf(MIDM, 180)); one(MIDM, holeOf(NEARM, 45)); }
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); litSetup(VP);
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
  function buildLandMask(){
    if (!FINE || !NEARM) return;
    const size = 2048, x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx;
    lcv = lcv || document.createElement('canvas'); lcv.width = lcv.height = size; const g = lcv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, size, size); g.fillStyle = '#fff'; g.beginPath();
    for (const q of FINE){ if (q.bb[2] < x0 || q.bb[0] > x0 + sx || q.bb[3] < z0 || q.bb[1] > z0 + sx) continue; g.moveTo((q.xs[0] - x0) * k, (q.zs[0] - z0) * k); for (let j = 1; j < q.xs.length; j++) g.lineTo((q.xs[j] - x0) * k, (q.zs[j] - z0) * k); g.closePath(); }
    g.fill('evenodd');
    LMTEX = LMTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, lcv); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.activeTexture(gl.TEXTURE0);
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
    gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, ub); gl.uniform1fv(u.uGp, gp); plSet(u);
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uDeep, [0.035, 0.14, 0.18]); gl.uniform1f(u.uWind, env.wind); gl.uniform2fv(u.uWindDir, env.windDir); gl.uniform1f(u.uSpec, env.spec);
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
      attr(0, PATCH.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, PATCH.ib); gl.drawElements(gl.TRIANGLES, PATCH.n, gl.UNSIGNED_SHORT, 0);
    }
  }

  // ---------- setup ----------
  async function init(){
    if (ready) return true; if (failed) return false;
    try {
      gl = canvas.getContext('webgl', {antialias:true, alpha:false, powerPreference:'high-performance'}) || canvas.getContext('experimental-webgl');
      if (!gl || !gl.getExtension('OES_standard_derivatives')) throw new Error('webgl');
      PL = program(LIT_VS, LIT_FS, ['aPos', 'aCol']); PT = program(TER_VS, TER_FS, ['aPos', 'aCol', 'aNor', 'aShd']); PRGN = program(LITN_VS, LITN_FS, ['aPos', 'aNor', 'aCol']); PRGX = program(TEX_VS, TEX_FS, ['aPos', 'aUV']); PRGW = program(WK_VS, WK_FS, ['aPos', 'aW', 'aS']);
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; // the waves read the sea-state texture in the vertex shader where the GPU can (#novtf in the address tries without)
      SST_VS = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) >= 2 && !/novtf/.test(location.hash);
      PS = program((SST_VS ? '' : '#define NOSST\n') + SEA_VS, SEA_FS, ['aXZ']); PSF = program('#define NOSST\n' + SEA_VS, '#define FAR\n' + SEA_FS, ['aXZ']);
      SSDUMMY = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, SSDUMMY); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])); PK = program(SKY_VS, SKY_FS, ['aP']); PP = program(PT_VS, PT_FS, ['aPos', 'aA']);
      DYNP = buf(new Float32Array(4000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); DYNA = buf(new Float32Array(4000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      // the ground's heights and the forest (map/, the view packs): until they are in, the land is a flat stand-in
      HG = true;   // the ground comes in packs round the boat as it goes (stream3d); until a pack is in, its land is a stand-in
      try { BLD = await loadBuildings(); } catch (e){ console.error(e); BLD = null; }
      buildTerrain(); buildStatics(); buildBoat(); buildSkiff(); buildFlag(); buildSea(); buildWild(); buildNPC(); buildHarbourFittings(); buildMooring(); buildPlants(); buildPlantParts(); buildBunkers();
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; failed = true; show(false); });
      buildLabels();
      ready = true; return true;
    } catch (e){ console.error(e); failed = true; return false; }
  }
  let labelEls = [];
  function buildLabels(){ labelsEl.innerHTML = ''; labelEls = PORTS.map(p => { const d = document.createElement('div'); d.className = 'lbl3d'; d.textContent = p.name; labelsEl.appendChild(d); return d; }); }
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
      const st = S.boat.status, gut = DECKACT.on && DECKACT.task === 'gut' && DECKACT.pt, n = gut ? 6 : st === 'port' ? 3 : st === 'fishing' ? 6 : 4, fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
      for (let i = 0; i < n; i++){
        const g = GULLS[i], ang = t * g.w * g.dir + g.ph, cx = bv.x - fx * 8, cz = bv.z - fz * 8;
        let x = cx + Math.cos(ang) * g.r, z = cz + Math.sin(ang) * g.r, y = bv.y + (st === 'fishing' ? 2.5 + g.h * 0.4 : g.h) + Math.sin(t * 0.7 + g.ph) * 1.2;
        if (gut && i < 4){ const q = (t * 0.22 + i * 0.27) % 1; if (q < 0.35){ const k = Math.sin(q / 0.35 * Math.PI), P0 = DECKACT.pt; x += (P0[0] + Math.cos(i * 2.1) * 1.2 - x) * k; z += (P0[2] + Math.sin(i * 2.1) * 1.2 - z) * k; y += (P0[1] + 0.25 - y) * k; } }
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
  function pvm(t){
    if (PVM[t]) return PVM[t]; const m = vesselModel(t); if (!m) return null;
    const up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3});
    let cap = null; if (m.cap){ const c = MB(); for (const tr of m.cap) c.tri(tr[0], tr[1], tr[2], [0, 0, 0]); cap = c.mesh(); }
    return PVM[t] = {hull:up(m.o), glass:up(m.glass), cap};
  }
  function people(){
    if (PERS) return PERS; const mk = (hands, suit, kit) => { const b = VB(); b.lod = 0.6; personVB(b, 0, 0, 0, false, hands, suit, kit); return {pb:buf(new Float32Array(b.p)), nb:buf(new Float32Array(b.n)), cb:buf(new Float32Array(b.c)), n:b.p.length / 3}; };
    return PERS = {skip:mk([[-0.16, 1.08, -0.42], [0.16, 1.08, -0.42]], [0.93, 0.4, 0.1, 0.3], 'skipper'), crew:mk(null, [0.95, 0.75, 0.15, 0.3], 'crew')};
  }
  function drawVessel(t, G, BMrel, VP, skipper, ncrew){
    const m = pvm(t); if (!m) return; const P = people(); nSetup(VP); drawN(m.hull, BMrel);
    if (skipper) drawN(P.skip, chain(BMrel, M4.T(G.skipperAt[0], G.skipperAt[1], G.skipperAt[2])));
    for (let i = 0; i < ncrew && i < G.crewSpots.length; i++){ const c = G.crewSpots[i]; drawN(P.crew, chain(BMrel, M4.T(c[0], c[1], c[2]), M4.RY(c[3] || 0))); }
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  // the local fleet near you: the kit model nearest each boat (vessel3d.js npcKit), scaled to her length and beam, at lod 1 within
  // 300 m and lod 0.3 within 1.5 km (a detailed GLB model gives its near and simple versions), with the skipper in the wheelhouse and hands on deck when she fishes; further out the box models
  const NKM = {};
  // a detailed model from tools/boats is near only within 150 m: many of the local fleet share it, and a tablet draws them all
  // a fishing NPC's model by her length and beam (FLEET's, and the coast's from tools/map/npc.py): the buffers by model, lod and livery,
  // the scale by boat
  const NKN = {}; function npcNear(n){ const k = n.L + '|' + n.B; if (!(k in NKN)) NKN[k] = glbHas(npcKit(n.L, n.B)) ? 150 : 300; return NKN[k]; }
  const NKB = {};
  function npcMesh(n, lod){
    const kk = n.id + '|' + lod; if (kk in NKM) return NKM[kk];
    const t = npcKit(n.L, n.B), liv = n.liv || 0, k = t + '|' + lod + '|' + liv;
    if (!(k in NKB)){ const m = npcModel(t, lod, liv), up = o => ({pb:buf(new Float32Array(o.p)), nb:buf(new Float32Array(o.n)), cb:buf(new Float32Array(o.c)), n:o.p.length / 3}); NKB[k] = m ? {t, hull:up(m.o), glass:lod >= 1 ? up(m.glass) : null, geo:m.geo} : null; }
    const B = NKB[k]; if (!B) return NKM[kk] = null;
    const V = VESSELS[t], sx = n.B / V.beam, sz = n.L / V.len, sy = (sx + sz) / 2;
    return NKM[kk] = Object.assign({}, B, {sv:[sx, sy, sz], S:new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1])});
  }
  let npcNow = [];
  function drawNPC(eye, t, H, VP){
    if (!NPCM) return;
    npcNow = npcStates(H).filter(n => Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000);
    const kit = [];
    for (const n of npcNow){
      const x = n.p.x * 1000, z = n.p.y * 1000, big = n.type === 'coastal' || n.type === 'ferry', y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = big ? Math.sin(t * 0.4 + x) * 0.01 : Math.sin(t * 1.1 + x) * 0.05 * (0.3 + WV.hs);
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -n.hd, big ? 0 : Math.sin(t * 0.9 + z) * 0.03, roll);
      const d = Math.hypot(x - eye[0], z - eye[2]); n.K = (n.fleet || n.coast) && d < 1500 ? npcMesh(n, d < npcNear(n) ? 1 : 0.3) : null;
      if (n.K) kit.push(n); else drawLit(NPCM[n.type], n.M);
    }
    if (!kit.length) return;
    const P = people(); nSetup(VP);
    for (const n of kit){ const K = n.K, G = K.geo, at = (p, r) => chain(n.M, M4.T(p[0] * K.sv[0], p[1] * K.sv[1], p[2] * K.sv[2]), M4.RY(r || 0));
      drawN(K.hull, chain(n.M, K.S));
      if (!K.glass) continue;
      if (n.st !== 'port') drawN(P.skip, at(G.skipperAt));
      if (n.st === 'fishing') for (let i = 0; i < 2 && i < G.crewSpots.length; i++) drawN(P.crew, at(G.crewSpots[i], G.crewSpots[i][3]));
    }
    gl.disableVertexAttribArray(2); gl.useProgram(PL.p);
  }
  function drawNPCGlass(VP){ for (const n of npcNow) if (n.K && n.K.glass) drawGlass(n.K.glass, chain(n.M, n.K.S), VP); }
  function drawNPCLights(VP){
    if (env.night < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){
      if (n.K){ const M = chain(n.M, n.K.S), px = n.L < 14 ? 260 : 600; for (const [p, col] of n.K.geo.lights){ const q = xf(M, p); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, col, px, true); } continue; }
      for (const [lx, ly, lz, c] of NPCM.lights[n.type]){ const q = xf(n.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, NLC[c], NPCM.lightPx[n.type] || 900, true); } }
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
    CAMBLD.add(vk); if (t && t.bld) camBld(t.bld, t.bld.cells.get(key), t.k);
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
    if (K.type === 'wide'){ const e = [C[0] - fx * 220 + rx * s * 140, 0, C[2] - fz * 220 + rz * s * 140]; e[1] = sea(e[0], e[2]) + 70; return [e, [C[0] + fx * 260, C[1], C[2] + fz * 260], 60]; }
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
      if (camFree(g, e) > 0.9){ KINO.shot = K; KINO.eye = e.slice(); KINO.tgt = g.slice(); return; }
    }
    KINO.shot = {type:'drone', t0:t, dur:12, side:1, a0:0}; KINO.eye = null;
  }
  function kinoCam(t, rdt){
    if (!KINO.shot || t - KINO.shot.t0 > KINO.shot.dur || t < KINO.shot.t0) kinoNext(t);
    const [e, g, fov] = kinoWant(KINO.shot, t), k = 1 - Math.exp(-Math.min(0.25, rdt) / 0.7);
    if (!KINO.eye){ KINO.eye = e.slice(); KINO.tgt = g.slice(); }
    for (let i = 0; i < 3; i++){ KINO.eye[i] += (e[i] - KINO.eye[i]) * k; KINO.tgt[i] += (g[i] - KINO.tgt[i]) * k; }
    const gy = Math.max(terrH(KINO.eye[0], KINO.eye[2]), seaH(KINO.eye[0], KINO.eye[2], t)) + 0.6; if (KINO.eye[1] < gy) KINO.eye[1] = gy;
    return {eye:KINO.eye.slice(), tgt:KINO.tgt, fov};
  }
  function frame(){
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden || NO3D) return;
    resize();
    const now = performance.now(), dt = Math.min(0.1, (now - lastF) / 1000), rdt = Math.max(1e-3, (now - lastF) / 1000); lastF = now;
    FPS.v = FPS.v ? FPS.v * 0.95 + 0.05 / rdt : 1 / rdt; FRAMEMS = FRAMEMS * 0.8 + Math.min(500, rdt * 1000) * 0.2; qualTick(dt, FPS.v, now); if (now - FPS.at > 500){ FPS.at = now; const fe = fpsEl(); if (fe) fe.textContent = Math.round(FPS.v) + ' bilder/s · ' + (1000 / FPS.v).toFixed(1) + ' ms · ' + ['Lav', 'Middels', 'Høy'][QUAL.lvl]; }
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac); updateWaves(dt, H); updateWake(); updateNear(); ssStep(rdt); updateShadows(); updateChunks(CH.size ? 2 : 999);
    // camera
    let eye, V, kfov = 0;
    if (KINO.on && !SHOW){
      const K = kinoCam(t, rdt); eye = K.eye; kfov = K.fov; V = viewDir([K.tgt[0] - eye[0], K.tgt[1] - eye[1], K.tgt[2] - eye[2]]); camFwd = [K.tgt[0] - eye[0], K.tgt[2] - eye[2]];
    } else if (cam.helm && !SHOW){
      // at the wheel: eye above the helmsman, moving with the boat (damped a little)
      // the helmsman's head steadies itself: the view follows the boat's pitch and roll through a filter of 0.3 s, so an uneven frame
      // (the tablet's) does not jerk the horizon (the user: «båten rister voldsomt i bro-visningen», 03.10.2026)
      const kh = 1 - Math.exp(-Math.min(0.25, rdt) / 0.3); if (cam.sp === undefined || !isFinite(cam.sp)){ cam.sp = bv.pitch; cam.sr = bv.roll; }
      cam.sp += (bv.pitch - cam.sp) * kh; cam.sr += (bv.roll - cam.sr) * kh; if (cam.sy === undefined || !isFinite(cam.sy)) cam.sy = bv.y; cam.sy += (bv.y - cam.sy) * kh;
      const Mh = model(bv.x, cam.sy, bv.z, -bv.head, cam.sp * 0.7, cam.sr * 0.7);
      eye = xf(Mh, (GEO(vtype())).eye);
      const cy = Math.cos(cam.hp), dl = [-Math.sin(cam.hy) * cy, Math.sin(cam.hp), -Math.cos(cam.hy) * cy];
      const f = [Mh[0] * dl[0] + Mh[4] * dl[1] + Mh[8] * dl[2], Mh[1] * dl[0] + Mh[5] * dl[1] + Mh[9] * dl[2], Mh[2] * dl[0] + Mh[6] * dl[1] + Mh[10] * dl[2]];
      V = viewDir(f, [Mh[4], Mh[5], Mh[6]]); camFwd = [f[0], f[2]];
    } else {
      if (SHOW && !drag) cam.yaw += dt * 0.12;   // the showroom turns slowly round the boat
      const C = SHOW ? [SHOW.x, (env.tide || 0) + 1.3 + Math.min(4, VESSELS[SHOW.t].len * 0.06), SHOW.z] : [bv.x, bv.y + 1.3, bv.z], yawW = (SHOW ? SHOW.h : bv.head) + cam.yaw, tgt = C;
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
      V = viewDir([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]); camFwd = [tgt[0] - eye[0], tgt[2] - eye[2]];
    }
    lastEye = eye; EYE = eye; earT = performance.now(); compassDraw(Math.atan2(camFwd[0], -camFwd[1]), {x:eye[0] / 1000, y:eye[2] / 1000});
    if (!RO.on || Math.abs(eye[0] - RO.x) > 40000 || Math.abs(eye[2] - RO.z) > 40000){ RO.x = Math.round(eye[0] / 4096) * 4096; RO.z = Math.round(eye[2] / 4096) * 4096; RO.on = true; }
    const W = canvas.width, Hh = canvas.height, asp = W / Hh, fov = (kfov || (cam.helm ? cam.fov : 55)) * DEG; curFov = fov;
    let cornerD = 0; if (NEARM) for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cornerD = Math.max(cornerD, Math.hypot(NEARM.x0 + qx * NEARM.sx - eye[0], NEARM.z0 + qz * NEARM.sz - eye[2], eye[1]));
    const nearFar = Math.max(3000, cam.dist * 3, cornerD + 300); lightNF = nearFar; const VPf = mul(persp(fov, asp, 25, 170000), V.m), VPn = mul(persp(fov, asp, 0.25, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = model(bv.x, bv.y, bv.z, -bv.head, bv.pitch, bv.roll);
    // apparent wind for the flag
    const wdir = (windDir(H) - gridGamma({x:bv.x / 1000, y:bv.z / 1000}) + 180) * DEG, wv = env.wind || windAt(H), bms = bv.v * 0.514 * 2;
    const ax = Math.sin(wdir) * wv - Math.sin(bv.head) * bms, az = -Math.cos(wdir) * wv + Math.cos(bv.head) * bms, appW = Math.hypot(ax, az), appB = Math.atan2(ax, -az);
    updateFlag(t, appW);

    gl.viewport(0, 0, W, Hh); gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    // sky
    gl.disable(gl.DEPTH_TEST); gl.useProgram(PK.p);
    const u = PK.u, tn = Math.tan(fov / 2);
    gl.uniform3fv(u.uF, V.F); gl.uniform3fv(u.uR, V.R); gl.uniform3fv(u.uU, V.U); gl.uniform2fv(u.uTan, [tn * asp, tn]);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uSunD, env.sunDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uMoonD, env.moonDir || [0, -1, 0]); gl.uniform1f(u.uMoonA, env.moonA || 0);
    gl.uniform1f(u.uCloud, env.cloud); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uStars, env.stars); gl.uniform1f(u.uAur, env.aur); gl.uniform1f(u.uDay, env.day); gl.uniform2fv(u.uWindDir, env.windDir);
    gl.disableVertexAttribArray(1); attr(0, SKYQ, 2); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // far pass
    pickLights(eye, t);
    drawTerrain(TM, eye, VPf, false); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM); drawUnits(eye, VPf, false, 15000); if (NPCM) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000, d = Math.hypot(x - eye[0], z - eye[2]); if (d < 30000 && !((n.fleet || n.coast) && d < 1500)) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
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
    const VT = vtype(), VG = GEO(VT), ncrew = Math.min(crewAboard().length, (VG.crewSpots || []).length);
    drawTerrain(TM, eye, VPn, true); drawLit(STAT, TM); drawTileStatics(TM, eye); drawBuildings(TM);
    // whoever works the deck leaves their place: alone, the skipper leaves the wheel
    DECKACT = deckActivity(); const awaySk = (DECKACT.on && DECKACT.alone) || gopMe(), awayCr = DECKACT.on && !DECKACT.alone ? 1 : 0;
    // under way the crew are inside (the user: no reason for them to stand on deck all day, 03.10.2026); whoever guts is at the table
    // (drawDeck), and in an open boat they sit where they are. The one at the table leaves their place (a skiff drew them twice).
    const underway = S.boat.status === 'sailing' && !S.boat.gop, deckCrew = underway && !VG.open ? 0 : Math.max(0, ncrew - awayCr);
    if (VG.hand){ drawSkiff(BMrel, VPn, dt, !cam.helm && !awaySk, deckCrew > 0); gl.useProgram(PL.p); }
    else drawVessel(VT, VG, BMrel, VPn, !cam.helm && !awaySk, deckCrew);
    if (SHOW){ const y = (env.tide || 0) + (seaH(SHOW.x, SHOW.z, t) - (env.tide || 0)) * 0.8; SHOW.M = model(SHOW.x - eye[0], y - eye[1], SHOW.z - eye[2], -SHOW.h, Math.sin(t * 0.7) * 0.02, Math.sin(t * 0.9) * 0.03); drawVessel(SHOW.t, GEO(SHOW.t), SHOW.M, VPn, true, 2); }
    if (STATN){ nSetup(VPn); drawN(STATN, TM); if (BUNKN) drawN(BUNKN, TM); } drawMooring(BMrel, eye, VPn, t); if (PM) drawDeck(BMrel, eye, VPn, t, DECKACT); drawGearOp(BMrel, eye, VPn, t);
    const plant = PM ? nearestPlant(eye) : null; drawUnits(eye, VPn, true, nearFar, plant && plant.id);
    const pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null, bunk = PM ? nearestBunker(eye) : null; if (bunk) bunk.last = drawBunker(bunk, eye, VPn, t, BMrel); gl.useProgram(PL.p);
    wildSpawn(t); drawNPC(eye, t, H, VPn); drawGearSea(eye, t, VPn, H); drawWild(eye, t, dt);

    const pole = xf(BMrel, VG.pole);
    drawLit(FLAGM, model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0));
    if (SHOW && SHOW.M && GEO(SHOW.t).open && pvm(SHOW.t).cap){ gl.colorMask(false, false, false, false); drawLit(pvm(SHOW.t).cap, SHOW.M); gl.colorMask(true, true, true, true); }
    { const cap = VG.hand ? (SK ? SK.cap : CAPM) : VG.open ? pvm(VT).cap : null; if (cap){ gl.colorMask(false, false, false, false); drawLit(cap, BMrel); gl.colorMask(true, true, true, true); } }
    drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false);
    drawBeams(VPn, eye, t);
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawSeaLights(VPn, eye, t, true);
    if (VG.hand) drawSkiffGlass(BMrel, VPn); else drawGlass(pvm(VT).glass, BMrel, VPn);
    if (SHOW && SHOW.M) drawGlass(pvm(SHOW.t).glass, SHOW.M, VPn);
    drawNPCGlass(VPn);
    if (pr && pr.spray){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); drawPts(pr.spray, gl.POINTS, VPn, [0.86, 0.93, 1], 30, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (pr && env.night > 0.05){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); pr.lamps.forEach((q, i) => { PB[i * 3] = q[0]; PB[i * 3 + 1] = q[1]; PB[i * 3 + 2] = q[2]; PA[i] = env.night; }); drawPts(pr.lamps.length, gl.POINTS, VPn, [1, 0.9, 0.72], 1400, true); gl.depthMask(true); gl.disable(gl.BLEND); }
    if (env.night > 0.05){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      const L3 = VG.lights;
      for (const [lp, lc] of L3){ const q = xf(BMrel, lp); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VPn, lc, 260, true); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    updateLabels(VPf, eye, W, Hh);
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
      // and carried off with the wind; at planing speed a little all the time in a chop
      const bowP = xf(BM, [0, 0.15, VG.bow]), imm = bowP[1] - seaH(bowP[0], bowP[2], t), sink = wk.imm == null ? 0 : (imm - wk.imm) / Math.max(dt, 1e-3); wk.imm = imm;
      const wv = (env.wind || 0) * 0.35, wx = env.windDir[0] * wv, wz = env.windDir[1] * wv;
      if (v > 3 && sink < -0.5 && imm < 0.6) wk.sacc += Math.min(40, -sink * v * 0.5);
      if (WK.Fr > 0.9) wk.sacc += dt * v * WV.hs * 0.8;
      while (wk.sacc >= 1){ wk.sacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, p = xf(BM, [side * VG.side, 0.2, VG.bow + Math.random() * 1.2]), up = 1.2 + Math.random() * (1.5 + Math.min(4, -sink));
        spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * (1.5 + Math.random() * 1.5) + wx, up, Math.sin(bv.head) * side * (1.5 + Math.random() * 1.5) + wz, 0.8 + Math.random() * 0.6, 9.8); }
      // the rooster tail: a planing outboard throws a plume of water up behind the leg
      if (BOAT.outboard && WK.Fr > 1){ wk.racc = (wk.racc || 0) + dt * 70 * sstep(1, 1.6, WK.Fr);
        while (wk.racc >= 1){ wk.racc -= 1; const p = xf(BM, [(Math.random() - 0.5) * 0.3, 0.1, VG.stern + 0.4]), bk = 2 + Math.random() * 3;
          spawn(p[0], p[1], p[2], -Math.sin(bv.head) * bk + wx, 2.2 + Math.random() * 2.2, Math.cos(bv.head) * bk + wz, 0.6 + Math.random() * 0.4, 9.8); } }
    }
    // wake: foaming prop wash behind the stern and the two Kelvin arms spreading at 19.5 degrees, laid on the waves
    { const now = performance.now() / 1000; for (const q of TRAIL) q.age = now - (q.t0 || now); }
    while (TRAIL.length && TRAIL[TRAIL.length - 1].age > 18) TRAIL.pop();
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
      for (const kind of [1, 2, 0]){ const sec = sections(kind); for (const S2 of sec){ const y = seaY(S2.q[1][0], S2.q[1][1]); for (const q of S2.q) q.push(y); } for (let i = 0; i < sec.length - 1; i++) strip(sec[i], sec[i + 1]); }
      if (m){
        gl.useProgram(PRGW.p); const u = PRGW.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uEye, [eye[0] - RO.x, eye[1], eye[2] - RO.z]); gl.uniform3fv(u.uCol, foamCol); gl.uniform3fv(u.uAer, [0.09, 0.3, 0.31].map((c, k) => c * (env.amb[k] * 1.4 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uArm, [0.1, 0.27, 0.31].map((c, k) => c * (env.amb[k] * 1.8 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uTime, t);
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
    if (QUAL.lvl) drawPts(n, gl.POINTS, VP, foamCol, 150, true);
    if (QUAL.lvl) driftSpray(VP, eye, dt, t, foamCol);
    // fishing lines
    if (S.boat.status === 'fishing' && GEO(vtype()).hand && SK){
      const segs = (SK.lines || []).slice(); if (SK.tipW) segs.push([SK.tipW, null]);
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
    PORTS.forEach((p, i) => {
      const x = p.coast.x * 1000 - eye[0], y = Math.max(0, terrH(p.coast.x * 1000, p.coast.y * 1000)) + 35 - eye[1], z = p.coast.y * 1000 - eye[2];
      const cx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12], cy = VP[1] * x + VP[5] * y + VP[9] * z + VP[13], cw = VP[3] * x + VP[7] * y + VP[11] * z + VP[15];
      const d = Math.hypot(x, z), el = labelEls[i];
      if (cw <= 0 || d > 14000){ el.style.display = 'none'; return; }
      const ly = (1 - (cy / cw * 0.5 + 0.5)) * Hh * sy; if (ly < 70){ el.style.display = 'none'; return; }
      el.style.display = ''; el.style.opacity = (1 - 0.65 * sstep(5000, 14000, d)).toFixed(2); el.style.left = ((cx / cw * 0.5 + 0.5) * W * sx) + 'px'; el.style.top = ((1 - (cy / cw * 0.5 + 0.5)) * Hh * sy) + 'px';
    });
  }

  // ---------- controls ----------
  const ptr = new Map(); let drag = null, pinch = null;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, {x:e.clientX, y:e.clientY}); if (ptr.size === 1) drag = {x:e.clientX, y:e.clientY}; else if (ptr.size === 2){ const [a, b] = [...ptr.values()]; pinch = {d:Math.hypot(a.x - b.x, a.y - b.y) || 1, dist:cam.dist}; } });
  canvas.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if (ptr.size === 2 && pinch){ const [a, b] = [...ptr.values()]; cam.dist = clamp(pinch.dist * pinch.d / (Math.hypot(a.x - b.x, a.y - b.y) || 1), 7, 8000); }
    else if (drag && ptr.size === 1){ if (cam.helm){ cam.hy = clamp(cam.hy - (e.clientX - drag.x) * 0.005, -2.6, 2.6); cam.hp = clamp(cam.hp + (e.clientY - drag.y) * 0.004, -0.6, 0.5); } else { cam.yaw -= (e.clientX - drag.x) * 0.006; cam.pitch = clamp(cam.pitch + (e.clientY - drag.y) * 0.004, 0.02, 1.4); } drag = {x:e.clientX, y:e.clientY}; }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null; if (ptr.size === 1){ const [p] = [...ptr.values()]; drag = {x:p.x, y:p.y}; } else if (!ptr.size) drag = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('dblclick', () => { if (cam.helm){ const G = GEO(vtype()); cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } }); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.0012), 7, 8000); }, {passive:false});

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
      if (failed){ if (!auto) toast(t('no3d')); return false; }
      if (!loading){ loading = true; toast(t('loading3d')); init().then(ok => { loading = false; if (ok) show(true, auto); else { if (hooks.on3dFail) hooks.on3dFail(); if (!auto) toast(t('no3d')); } }); }
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
    quality(v){ if (v){ S.settings.q3d = v; QUAL.bad = QUAL.good = 0; QUAL.cap = 2; qualSet(); } return {lvl:QUAL.lvl, set:S.settings.q3d || 'auto', fps:FPS.v}; },
    show, toggle(){ return show(!active); }, isActive:() => active,
    // for the sound (ui/10e-sound.js): the ear is the camera of the last frame drawn (metres; x east, z south; its direction on the
    // level), and where the sounds are: your boat, the crane and the ice chute of the plant she lies at, its pump, and the fleet near by
    ear(){ return active && performance.now() - earT < 2000 ? {x:lastEye[0], y:lastEye[1], z:lastEye[2], fx:camFwd[0], fz:camFwd[1]} : null; },
    sndSrc(){ const b = S.boat, P = b.port ? PLANTS.find(q => q.id === b.port) : null, B = b.port ? BUNKERS.find(q => q.id === b.port) : null;
      return {boat:[bv.x, (bv.y || 0) + 1, bv.z], crane:P ? [P.crane[0], 9, P.crane[1]] : null, chute:P ? [P.drop[0], 4, P.drop[1]] : null, pump:B ? [B.pump[0], 2, B.pump[1]] : null,
        npc:npcNow.map(n => ({x:n.p.x * 1000, z:n.p.y * 1000, v:n.v || 0, st:n.st, big:n.type === 'coastal' || n.type === 'ferry'}))}; },
    zoom(f){ if (cam.helm) cam.fov = clamp(cam.fov * f, 12, 75); else cam.dist = clamp(cam.dist * f, 7, 8000); }, reset(){ if (cam.helm){ cam.hy = 0; cam.hp = -0.07; cam.fov = 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } },
    vesselChanged(){ bv.init = false; bv.st = null; TRAIL.length = 0; },
    showroom, get showing(){ return SHOW ? SHOW.t : null; },
    roadsReady(){ if (NEARM) buildGround(); for (const c of CH.values()) freeChunk(c); CH.clear(); },
    fineReady(){ if (NEARM){ freeMesh(NEARM); NEARM = null; updateNear(); } },
    fishCam(){ cam.helm = false; cam.dist = 7; cam.pitch = 0.22; cam.yaw = -0.85; },
    // the cinema: on or off (the HUD is the page's: body.kino-clean)
    kino(on){ if (on !== undefined){ KINO.on = !!on; KINO.shot = null; } return KINO.on; }, get kinoShot(){ return KINO.shot ? KINO.shot.type : null; },
    isHelm:() => cam.helm, setHelm(on){ const G = GEO(vtype()); cam.helm = !!on; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; },
    _debug:{get fps(){ return FPS.v; }, cam, moundTop, bridgeInto, get statTris(){ return STAT ? STAT.n / 3 : 0; }, get vec(){ return {tiles:[...VEC.tiles.values()].map(t => ({k:t.k, bld:t.bld ? t.bld.n : 0, roads:t.roads.length, bridges:t.bridges.length, piers:t.piers.length, molos:t.molos.length, quays:t.quays.length, ms:Math.round(t.ms)})), statics:[...TST].map(([k, s]) => ({k, tris:s.tris, ms:Math.round(s.ms)})), chunks:CH.size}; }, moundInto, MB, haulModel, get haulA(){ return HAULA; }, gopHands, kinoNext(){ KINO.shot = null; }, get kino(){ const k = KINO.shot, e = KINO.eye, g = KINO.tgt; if (!k || !e) return null; const t = (performance.now() - T0) / 1000; return {type:k.type, up:e[1] - Math.max(terrH(e[0], e[2]), seaH(e[0], e[2], t)), free:camFree(g, e), d:Math.hypot(e[0] - bv.x, e[2] - bv.z)}; }, get PLA(){ return PLA; }, get PCA(){ return PCA; }, set noPL(v){ NOPL = !!v; }, get beams(){ return BMN; }, glErr(){ return gl ? gl.getError() : -1; }, QUAL, qualTick, TERRW, get TERR(){ return TERR; }, get MIDM(){ return MIDM; }, RO, SSL, WV, WK, ssAt, seaH, waves:(dt, H) => updateWaves(dt, H), get sstVS(){ return SST_VS; }, set seaDbg(v){ SEADBG = v; }, get drift(){ let c = 0; for (let i = 0; i < SDN; i++) if (SD.age[i] < SD.life[i]) c++; return c; }, get eye(){ return lastEye; }, camInside, camFree, get camPull(){ return camPull; }, get camLift(){ return camLift; }, get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, BUNKERS, nearestPlant, fkRun, legAt, terrH, unitModel, get UPATCH(){ return UPATCH; }, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; SEAMARKS.lights.forEach((L, i) => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(i, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }}
  };
})();
