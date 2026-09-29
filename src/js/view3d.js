'use strict';
// ===== 3D VIEW (plain WebGL, no dependencies) =====
const G3 = (() => {
  const wrap = document.getElementById('mapwrap'), canvas = document.getElementById('gl'), labelsEl = document.getElementById('labels');
  let gl = null, ready = false, failed = false, active = false, raf = 0, lastF = 0;
  let PL, PS, PK, PP;
  let TERR, STAT, BOATM, CAPM, RODM, FLAGM, SKYQ, PATCH, FARQ, DYNP, DYNA;
  let HG = null, NEARM = null, MIDM = null, loading = false, LIGHTS = [], snowNow = -1;
  const T0 = performance.now(), DEG = Math.PI / 180;
  const cam = {yaw:0.55, pitch:0.26, dist:21, helm:false, hy:0, hp:-0.07, fov:55};
  const vtype = () => (S.boat.type && PV[S.boat.type]) ? S.boat.type : 'skiff';
  let PERSONM = null, WILDM = null, NPCM = null, CREW2M = null, PT = null, GTEX = null, GRECT = null, STEX = null, SRECT = null, gcv = null, LMTEX = null, lcv = null, HTEX = null;
  // where things sit on each vessel (boat-local metres, bow towards -z)
  const VGEO = {skiff:{pl:2.4, rl:1.0, eye:[0, 1.86, 0.9], hp:-0.3, fov:62, pole:[-0.8, 1.95, 2.42], stern:3.1, bow:-2.2, side:0.75, gw:0.95, deck:{y:0.2, z:2.0}, lights:[[[-0.08, 1.04, -2.7], [1, 0.12, 0.1]], [[0.08, 1.04, -2.7], [0.1, 1, 0.35]], [[-0.8, 1.95, 2.42], [1, 0.95, 0.85]]]}};
  const PV = {};
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
  const LIT_VS = 'attribute vec3 aPos;attribute vec3 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;gl_Position=uVP*w;}';
  const LIT_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;' +
    'uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uEmis;uniform vec4 uHole;uniform vec4 uOver;varying vec3 vW;varying vec3 vC;' +
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(dot(n,vW)>0.0)n=-n;float dif=max(dot(n,uSun),0.0);' +
    'vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 bc=mix(vC,uOver.rgb,uOver.a);vec3 c=bc*(amb+uSunCol*dif)+bc*uEmis;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),1.0);}';
  const TER_VS = 'attribute vec3 aPos;attribute vec3 aCol;attribute vec3 aNor;attribute float aShd;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;vN=aNor;vP=aPos;vS=aShd;gl_Position=uVP*w;}';
  const NOISE = 'float hs(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}' +
    'float ns(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),u.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),u.x),u.y);}';
  const SEA_VS = 'precision highp float;attribute vec2 aXZ;uniform mat4 uVP;uniform vec2 uOrigin;uniform vec3 uOriginRel;uniform float uTime;uniform float uHalf;uniform float uFlat;uniform float uScale;uniform float uCell;' +
    'uniform vec4 uWa[10];uniform vec4 uWb[10];varying vec3 vW;varying vec2 vXZ;varying float vCrest;varying vec3 vN;' +
    'void main(){vec2 lxz=aXZ*uScale;vec2 wxz=uOrigin+lxz;vec3 d=vec3(0.0);' +
    'if(uFlat<0.5){float fade=1.0-smoothstep(0.6,1.0,max(abs(aXZ.x),abs(aXZ.y))/uHalf);for(int i=0;i<10;i++){vec4 a=uWa[i];vec4 b=uWb[i];float att=smoothstep(2.5,5.0,6.2832/(a.z*uCell));float f=a.z*dot(a.xy,wxz)-b.y*uTime+b.z;float c=cos(f);float s=sin(f);' +
    'd.x+=b.x*a.w*a.x*c*att;d.z+=b.x*a.w*a.y*c*att;d.y+=a.w*s*att;}d*=fade;}' +
    'vec3 rel=uOriginRel+vec3(lxz.x,0.0,lxz.y)+d;vW=rel;vXZ=wxz;vCrest=0.0;vN=vec3(0.0,1.0,0.0);gl_Position=uVP*vec4(rel,1.0);}';
  const SEA_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uDeep;' +
    'uniform float uTime;uniform float uWind;uniform vec2 uWindDir;uniform float uFlat;uniform float uSpec;uniform vec4 uWa[10];uniform vec4 uWb[10];uniform sampler2D uShore;uniform sampler2D uLand;uniform sampler2D uHgt;uniform float uHOn;uniform float uTideL;uniform float uHs;uniform vec4 uSRect;uniform float uSOn;uniform vec4 uPHole;uniform float uPx;' +
    'varying vec3 vW;varying vec2 vXZ;varying float vCrest;varying vec3 vN;' + NOISE +
    'void main(){if(uFlat>0.5&&vW.x>uPHole.x&&vW.x<uPHole.z&&vW.z>uPHole.y&&vW.z<uPHole.w)discard;float d=length(vW);vec2 P=vXZ;' +
    // metres covered by one pixel here (grows with distance and grazing angle); a wave shorter than a few pixels is faded out and its slope becomes roughness instead
    'vec3 V=normalize(-vW);float px=d*uPx/max(abs(V.y),0.12);vec2 w=uWindDir;vec2 wp=vec2(-w.y,w.x);' +
    // gusts: slow patches of rougher and calmer water break up any repetition
    'vec2 Q=P+w*uTime*1.2;float gust=0.62+0.2*sin(dot(Q,vec2(0.0021,0.0013)))*sin(dot(Q,vec2(-0.0009,0.0024))+1.3)+0.12*sin(dot(Q,vec2(0.0047,-0.0031))+2.1)+0.08*sin(dot(Q,vec2(0.0019,0.0067))+4.0);' +
    'vec3 N=vec3(0.0,1.0,0.0);float y=0.0;float sa=0.001;float lost=0.0;' +
    'for(int i=0;i<10;i++){vec4 a=uWa[i];vec4 b=uWb[i];float att=smoothstep(2.0,7.0,6.2832/(a.z*px));float f=a.z*dot(a.xy,P)-b.y*uTime+b.z;float c=cos(f);float s=sin(f);' +
    'vec2 gd=vec2(a.y,-a.x);float grp=0.62+0.38*sin(dot(P,a.xy)*a.z*0.083+dot(P,gd)*a.z*0.041-b.y*uTime*0.5+b.w*7.0);float wa=a.z*a.w*grp;' +
    'N.x-=a.x*wa*c*att;N.z-=a.y*wa*c*att;N.y-=b.x*wa*s*att;y+=a.w*grp*s*att;sa+=a.w;lost+=wa*wa*(1.0-att);}' +
    // ripples: eight short waves spread around the wind, analytic slopes (no grid), scaled by wind and gusts
    'float ra=(0.018+0.0032*uWind)*gust;' +
    'for(int j=0;j<8;j++){float fj=float(j);float ang=(fj-3.5)*0.36+sin(fj*2.3)*0.2;vec2 dir=w*cos(ang)+wp*sin(ang);float L=1.1+fj*0.42+fract(fj*0.618)*0.9;float k=6.2832/L;float att=smoothstep(2.0,7.0,L/px);' +
    'float f=k*dot(dir,P)-sqrt(9.81*k+0.074*k*k*k/1025.0)*uTime+fj*1.9;float sl=ra*cos(f);N.x-=dir.x*sl*att;N.z-=dir.y*sl*att;lost+=sl*sl*(1.0-att)*0.5+ra*ra*0.5*(1.0-att);}' +
    'N=normalize(N);float crest=y/sa;float ndv=max(dot(N,V),0.0);float fr=0.02+0.98*pow(1.0-ndv,5.0);vec3 R=reflect(-V,N);R.y=abs(R.y);' +
    'vec3 sky=mix(uHor,uZen,pow(clamp(R.y,0.0,1.0),0.5));' +
    'vec3 body=uDeep*(uAmb*1.7+uSunCol*0.3*max(dot(N,uSun),0.0));' +
    'float sss=pow(max(dot(V,normalize(vec3(-uSun.x,0.3,-uSun.z))),0.0),3.0)*smoothstep(0.05,0.8,crest);body+=vec3(0.02,0.19,0.17)*sss*(uSunCol*0.9+uAmb*0.35);' +
    'vec3 col=mix(body,sky,fr);' +
    // sun glitter: sharp where the surface is resolved, a wider glitter path where the waves have become roughness
    'float rough=clamp(0.0015+lost,0.0015,0.25);float sp=clamp(2.0/rough,8.0,1200.0);float rs=max(dot(R,uSun),0.0);vec3 Hh=normalize(V+uSun);float Fs=0.02+0.98*pow(1.0-max(dot(Hh,V),0.0),5.0);' +
    'vec3 spec=uSunCol*pow(rs,sp)*(sp+2.0)*0.125*Fs*uSpec;col+=spec/(1.0+0.35*max(max(spec.r,spec.g),spec.b));' +
    // whitecaps: only on steep crests in fresh wind, broken up, fading where they can no longer be resolved
    'float lod=1.0-smoothstep(0.35,1.6,px);float wf=smoothstep(6.5,14.0,uWind);float fn=ns(P*0.06+w*uTime*0.1)*0.6+ns(P*0.17-wp*uTime*0.18)*0.4;' +
    'float foam=smoothstep(0.62,0.98,crest*0.8+fn*0.45)*smoothstep(0.45,0.85,fn)*wf*lod*gust;' +
    'vec2 st=vec2(dot(P,w)*0.011,dot(P,wp)*0.2);foam+=smoothstep(0.8,0.96,ns(st+vec2(uTime*0.03,ns(P*0.02)*3.0)))*smoothstep(12.0,20.0,uWind)*0.3*lod;' +
    'col+=vec3(0.045)*wf*(1.0-lod)*smoothstep(0.3,0.9,crest)*gust;' +
    'if(uSOn>0.5&&uHOn>0.5){vec2 su=(vW.xz-uSRect.xy)*uSRect.zw;if(su.x>0.0&&su.y>0.0&&su.x<1.0&&su.y<1.0){float ef=smoothstep(0.0,0.06,min(min(su.x,su.y),min(1.0-su.x,1.0-su.y)));' +
    'float hb=texture2D(uHgt,su*(255.0/256.0)+0.5/256.0).r*16.0-8.0;float dep=uTideL-hb;' +
    'col=mix(col,vec3(0.07,0.33,0.32)*(uAmb*1.5+uSunCol*0.75),(1.0-smoothstep(0.3,5.0,dep))*0.42*(1.0-fr)*ef);' +
    'float bw=0.15+uHs*0.9;float band=(1.0-smoothstep(0.0,bw,dep))*smoothstep(-0.2,0.02,dep);float sw=0.5+0.5*sin(uTime*0.9+dot(P,w)*0.06);' +
    'float ln=ns(P*0.32+vec2(uTime*0.35,-uTime*0.25))*0.6+ns(P*0.95-uTime*0.45)*0.4;' +
    'foam=max(foam,band*smoothstep(0.35,0.72,ln+band*0.2)*(0.3+0.7*clamp(uHs*1.6,0.0,1.0))*(0.7+0.3*sw)*ef);}}' +
    'col=mix(col,min(uAmb*1.3+uSunCol*0.85,vec3(1.0)),clamp(foam,0.0,1.0)*0.85);float fg=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(col,uFog,fg),1.0);}';
  const TER_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform vec4 uHole;' +
    'uniform sampler2D uGround;uniform sampler2D uLand;uniform vec4 uGRect;uniform float uGOn;uniform float uLOn;uniform vec3 uSand;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;' + NOISE +
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec2 wp=mod(vP.xz,4096.0);float d=length(vW);float det=1.0-smoothstep(900.0,5000.0,d);' +
    'float b1=ns(wp*0.045)-0.5;float b2=ns(wp.yx*0.045+13.0)-0.5;float b3=ns(wp*0.011+5.0)-0.5;vec3 n=normalize(vN);float st=1.0-n.y;' +
    'n=normalize(n+vec3(b1*0.5+b3,0.0,b2*0.5-b3*0.6)*(0.2+st*0.7)*det);vec3 c=vC*(0.92+0.16*ns(wp*0.018+2.0));float h=vP.y;vec2 uv=(vW.xz-uGRect.xy)*uGRect.zw;float ins=step(0.0,uv.x)*step(0.0,uv.y)*step(uv.x,1.0)*step(uv.y,1.0);float ef=smoothstep(0.0,0.06,min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y)));' +
    'float sand=(1.0-smoothstep(1.0,3.6,h+b1*1.6))*step(0.05,h);c=mix(c,uSand,sand*0.8);' +
    'if(uGOn>0.5&&ins>0.5){vec4 g=texture2D(uGround,uv);c=mix(c,g.rgb,g.a*ef);}' +
    'float dif=max(dot(n,uSun),0.0)*mix(0.08,1.0,smoothstep(0.15,0.85,vS));vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 col=c*(amb+uSunCol*dif);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(col,uFog,f),1.0);}';
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
      mesh(){ return upload(new Float32Array(p), new Float32Array(c)); }
    };
    return o;
  }

  // ---------- terrain ----------
  const SNOWLINE = [0,0,0,150,350,650,900,1000,850,450,120,0];
  async function loadHeights(){
    const el = document.getElementById('hgt');
    if (!el || typeof DecompressionStream === 'undefined') return null;
    const bytes = b64bytes(el.textContent.trim());
    const buf = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const n = HGRID.nx * HGRID.ny, h = new Int16Array(n), z = new Float32Array(n);
    const nx = HGRID.nx; for (let r = 0; r < HGRID.ny; r++) for (let c = 0; c < nx; c++){ const i = r * nx + c, zz = buf[i] | (buf[n + i] << 8), a = c ? h[i - 1] : 0, b = r ? h[i - nx] : 0, cc = r && c ? h[i - nx - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; h[i] = pr + ((zz >>> 1) ^ -(zz & 1)); const q = Math.abs(h[i]); z[i] = Math.sign(h[i]) * (q < 20 ? q / 2 : 10 + (q - 20) * 2); }
    return z;
  }
  function gridAt(arr, x, z, G){
    G = G || HGRID; const cm = G.c * 1000;
    const gx = clamp(x / cm - 0.5, 0, G.nx - 1.001), gz = clamp(z / cm - 0.5, 0, G.ny - 1.001), ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz, i = iz * G.nx + ix, n = G.nx;
    return (arr[i] * (1 - fx) + arr[i + 1] * fx) * (1 - fz) + (arr[i + n] * (1 - fx) + arr[i + n + 1] * fx) * fz;
  }
  // real ground height (m) at world x/z (m); sea floor is shaped from shore distance and exposure
  function terrH(x, z){
    if (x < 0 || z < 0 || x > MAP_W * 1000 || z > MAP_H * 1000) return -40;
    if (HG) return gridAt(HG, x, z);
    const m = gridAt(MASK, x, z, GRID); return m >= 0.5 ? 2 : -4;
  }
  // share of forest around a point: bilinear over the 50 m forest cells, softened over the neighbours
  function forestAt(x, z){
    const gx = x / 50 - 0.5, gz = z / 50 - 0.5, ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz; let s = 0;
    const F = (c, r) => (c < 0 || r < 0 || c >= 1570 || r >= 1648) ? 0 : FOREST[r * 1570 + c];
    for (let dz = -1; dz <= 2; dz++) for (let dx = -1; dx <= 2; dx++){ const wx = dx <= 0 ? (dx === 0 ? 1 - fx * 0.5 : 0.5 - fx * 0.5) : (dx === 1 ? 0.5 + fx * 0.5 : fx * 0.5), wz = dz <= 0 ? (dz === 0 ? 1 - fz * 0.5 : 0.5 - fz * 0.5) : (dz === 1 ? 0.5 + fz * 0.5 : fz * 0.5); s += F(ix + dx, iz + dz) * wx * wz; }
    return clamp(s / 2.25, 0, 1);
  }
  function makeMesh(x0, z0, sx, sz, n){
    const dx = sx / (n - 1), dz = sz / (n - 1), N = n * n, pos = new Float32Array(N * 3), h = new Float32Array(N), nz = new Float32Array(N), slope = new Float32Array(N), nor = new Float32Array(N * 3), fo = new Float32Array(N);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, x = x0 + i * dx, z = z0 + j * dz, y = terrH(x, z);
      h[k] = y; pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; nz[k] = fbm(x / 600, z / 600, 2, 90); fo[k] = forestAt(x, z);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
      const k = j * n + i, hx = (h[j * n + Math.min(n - 1, i + 1)] - h[j * n + Math.max(0, i - 1)]) / (2 * dx), hz = (h[Math.min(n - 1, j + 1) * n + i] - h[Math.max(0, j - 1) * n + i]) / (2 * dz);
      slope[k] = Math.hypot(hx, hz); const nl = Math.hypot(hx, 1, hz); nor[k * 3] = -hx / nl; nor[k * 3 + 1] = 1 / nl; nor[k * 3 + 2] = -hz / nl;
    }
    const idx = new Uint16Array((n - 1) * (n - 1) * 6); let q = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++){ const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    const col = new Float32Array(N * 3), m = {pb:buf(pos), cb:buf(col, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), nb:buf(nor), ib:buf(idx, gl.ELEMENT_ARRAY_BUFFER), n:idx.length, h, nz, slope, fo, col, x0, z0, sx, sz, pos, nor, gn:n, sh:new Float32Array(N).fill(1)}; m.sb = buf(m.sh, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); m.shKey = '';
    recolor(m, snowNow < 0 ? 0 : snowNow);
    return m;
  }
  function freeMesh(m){ gl.deleteBuffer(m.pb); gl.deleteBuffer(m.cb); gl.deleteBuffer(m.ib); if (m.nb) gl.deleteBuffer(m.nb); if (m.sb) gl.deleteBuffer(m.sb); }
  function buildTerrain(){ TERR = makeMesh(0, 0, MAP_W * 1000, MAP_H * 1000, 255); }
  // sharp terrain in a 6 km corridor around the boat, rebuilt as it moves
  let shT = 0;
  function updateShadows(){
    const d = env.shadowDir, key = d ? d.map(v => v.toFixed(2)).join(',') : 'flat';
    for (const m of [NEARM, MIDM, TERR]){
      if (!m) continue;
      if (m.shKey !== key && !m.shJob && performance.now() - shT > 1500){ m.shJob = {i:0, key, d}; shT = performance.now(); }
      if (!m.shJob) continue;
      const J = m.shJob, N = m.gn * m.gn, end = Math.min(N, J.i + (m === NEARM ? 7000 : 5000));
      if (!J.d || J.d[1] <= 0.005) m.sh.fill(J.d ? 0 : 1, J.i, end);
      else {
        const hl = Math.hypot(J.d[0], J.d[2]) || 1e-6, dx = J.d[0] / hl, dz = J.d[2] / hl, tE = J.d[1] / hl, far = m === TERR ? 25000 : 9000, st0 = m === TERR ? 160 : m === MIDM ? 60 : 25;
        for (let k = J.i; k < end; k++){
          const x = m.pos[k * 3], z = m.pos[k * 3 + 2], y = Math.max(m.pos[k * 3 + 1], 0) + 2; let lit = 1, dd = st0;
          while (dd < far){ const over = terrH(x + dx * dd, z + dz * dd) - (y + dd * tE); if (over > 0){ lit = over > 8 ? 0 : 0.35; if (!lit) break; } dd += st0 + dd * 0.07; }
          m.sh[k] = lit;
        }
      }
      J.i = end; if (J.i >= N){ gl.bindBuffer(gl.ARRAY_BUFFER, m.sb); gl.bufferData(gl.ARRAY_BUFFER, m.sh, gl.DYNAMIC_DRAW); m.shKey = J.key; m.shJob = null; }
      break;   // one mesh per frame
    }
  }
  function updateMid(){
    const span = 22000, snap = 2000, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (MIDM && Math.abs(cx - MIDM.cx) < 3000 && Math.abs(cz - MIDM.cz) < 3000) return;
    if (MIDM) freeMesh(MIDM);
    MIDM = makeMesh(cx - span / 2, cz - span / 2, span, span, 256); MIDM.cx = cx; MIDM.cz = cz;
  }
  function updateNear(){
    updateMid();
    const span = cam.dist > 1200 ? 12000 : 6000, snap = span / 10, cx = Math.round(bv.x / snap) * snap, cz = Math.round(bv.z / snap) * snap;
    if (NEARM && NEARM.sx === span && Math.abs(cx - NEARM.cx) < span / 5 && Math.abs(cz - NEARM.cz) < span / 5) return;
    if (NEARM) freeMesh(NEARM);
    NEARM = makeMesh(cx - span / 2, cz - span / 2, span, span, 256); NEARM.cx = cx; NEARM.cz = cz; buildGround();
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

  // ---------- villages and quays ----------
  function buildStatics(){
    const m = MB(), R = rng(7), WALLS = [[0.62,0.18,0.14],[0.88,0.88,0.84],[0.85,0.68,0.3],[0.76,0.46,0.22],[0.5,0.56,0.6],[0.88,0.88,0.84]], ROOF = [[0.18,0.2,0.22],[0.3,0.2,0.18],[0.22,0.26,0.3]];
    LIGHTS = [];
    // piers, quays and breakwaters from OpenStreetMap, as listed in PIERBOX (the berths use the same boxes)
    for (const q of PIERBOX){
      if (q.bw) m.box(q.x, -3, q.z, q.w, 5.2, q.l, [0.4, 0.41, 0.42], q.ang, [0.5, 0.5, 0.5]);
      else if (q.closed) m.box(q.x, -2.4, q.z, q.w, QTOP + 2.4, q.l, [0.5, 0.49, 0.46], q.ang, [0.6, 0.58, 0.54]);
      else if (q.made) m.box(q.x, -3, q.z, q.w, QTOP + 3, q.l, [0.52, 0.53, 0.5], q.ang, [0.6, 0.6, 0.58]);
      else m.box(q.x, -2.4, q.z, q.w, QTOP + 2.4, q.l, [0.46, 0.42, 0.37], q.ang, [0.56, 0.52, 0.46]);
    }
    // bridges from OpenStreetMap
    for (const br of BRIDGES){
      const cls = br[0], L = br[1], n = (br.length - 4) / 2, X = k => br[4 + k * 2], Z = k => br[5 + k * 2];
      const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(X(k) - X(k - 1), Z(k) - Z(k - 1)));
      const tot = cum[n - 1] || 1, hA = Math.max(terrH(X(0), Z(0)), 1), hB = Math.max(terrH(X(n - 1), Z(n - 1)), 1);
      const clear = L < 60 ? 0 : clamp(tot * 0.036, 6, 42), wdt = [9, 8.5, 7.5, 7, 5][cls] || 7;
      const yAt = s => { const u = s / tot; return hA + (hB - hA) * u + clear * Math.pow(Math.sin(Math.PI * u), 0.55); };
      for (let k = 0; k < n - 1; k++){
        const ax = X(k), az = Z(k), bx2 = X(k + 1), bz2 = Z(k + 1), segL = Math.hypot(bx2 - ax, bz2 - az), steps = Math.max(1, Math.ceil(segL / 18));
        for (let q = 0; q < steps; q++){
          const u0 = q / steps, u1 = (q + 1) / steps, x0 = ax + (bx2 - ax) * u0, z0 = az + (bz2 - az) * u0, x1 = ax + (bx2 - ax) * u1, z1 = az + (bz2 - az) * u1;
          const s0 = cum[k] + segL * u0, s1 = cum[k] + segL * u1, y0 = yAt(s0), y1 = yAt(s1), ym = (y0 + y1) / 2, len = Math.hypot(x1 - x0, z1 - z0) + 0.4, ang = Math.atan2(x1 - x0, z1 - z0), pitch = Math.atan2(y1 - y0, len);
          const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, px = Math.cos(ang), pz = -Math.sin(ang);
          m.box(cx, ym - 1.2, cz, wdt, 1.3, len, [0.64, 0.64, 0.62], ang, [0.42, 0.44, 0.46]);
          for (const sd of [1, -1]) m.box(cx + px * sd * wdt / 2, ym + 0.1, cz + pz * sd * wdt / 2, 0.3, 1.0, len, [0.8, 0.8, 0.78], ang);
          const mid = (s0 + s1) / 2; if (Math.floor(s0 / 70) !== Math.floor(s1 / 70) || (q === 0 && k === 0)){ const gy = terrH(cx, cz); if (ym - 1.2 - gy > 3) m.box(cx, Math.min(gy, 0) - 4, cz, Math.min(wdt * 0.6, 5), ym - 1.2 - (Math.min(gy, 0) - 4), 3, [0.6, 0.6, 0.58], ang); }
        }
      }
    }
    // lighthouses, lights, beacons and buoys
    for (const mk of SEAMARKS.marks){
      const x = mk[0] * 1000, z = mk[1] * 1000, base = Math.max(terrH(x, z), 0.2), ty = mk[2], cat = mk[3];
      if (ty === 'M'){ m.box(x, base, z, 3.4, 11, 3.4, [0.95, 0.95, 0.93], 0.3); m.box(x, base + 11, z, 3.6, 2.2, 3.6, [0.75, 0.1, 0.08], 0.3); m.box(x, base + 13.2, z, 2.2, 2.2, 2.2, [0.9, 0.92, 0.9], 0.3, [0.2, 0.2, 0.22]); }
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
    STAT = m.mesh();
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
    STATN = nb.mesh();
  }
  // ---------- real buildings (OpenStreetMap), streamed in 1 km chunks inside the terrain corridor ----------
  let BLD = null, chunkSnow = -1;
  const CH = new Map();
  async function loadBuildings(){
    const el = document.getElementById('bld');
    if (!el || typeof DecompressionStream === 'undefined') return null;
    const n = +el.dataset.n, U = +el.dataset.u, bytes = b64bytes(el.textContent.trim());
    const raw = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    const X = new Uint16Array(raw.buffer, 0, n), Y = new Uint16Array(raw.buffer, 2 * n, n), Lq = raw.subarray(4 * n, 5 * n), Wq = raw.subarray(5 * n, 6 * n), Aq = raw.subarray(6 * n, 7 * n), Tq = raw.subarray(7 * n, 8 * n);
    const dec = q => q <= 160 ? q * 0.5 : 80 + (q - 160) * 2;
    const B = {n, x:new Float32Array(n), z:new Float32Array(n), l:new Float32Array(n), w:new Float32Array(n), a:new Float32Array(n), t:new Uint8Array(n), lv:new Uint8Array(n), cells:new Map()};
    for (let i = 0; i < n; i++){
      B.x[i] = X[i] * U; B.z[i] = Y[i] * U; B.l[i] = dec(Lq[i]); B.w[i] = Math.max(1.5, dec(Wq[i])); B.a[i] = Aq[i] / 256 * Math.PI; B.t[i] = Tq[i] & 15; B.lv[i] = Tq[i] >> 4;
      const k = Math.floor(B.z[i] / 1000) * 100 + Math.floor(B.x[i] / 1000);
      let c = B.cells.get(k); if (!c) B.cells.set(k, c = []); c.push(i);
    }
    return B;
  }
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
    const idx = BLD.cells.get(key) || [], c = {mesh:null, lights:null, nl:0, detail, dm:null, gd:null, gl:null};
    const m = MB(), L = [], snowy = chunkSnow % 10 === 1, D = detail ? MB() : null, GD = detail ? MB() : null, GLm = detail ? MB() : null;
    for (const i of idx){
      const x = BLD.x[i], z = BLD.z[i], l = BLD.l[i], w = BLD.w[i], ty = BLD.t[i], lv = BLD.lv[i], ry = Math.PI / 2 - BLD.a[i], hsh = hash(i * 7 + 3);
      const ca = Math.cos(BLD.a[i]), sa = Math.sin(BLD.a[i]);
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
    addTrees(m, key, idx, snowy);
    c.mesh = m.p.length ? m.mesh() : null;
    const RM = MB(); addRoads(RM, key, snowy); if (RM.p.length) c.rd = RM.mesh();
    if (detail){ if (D.p.length) c.dm = D.mesh(); if (GD.p.length) c.gd = GD.mesh(); if (GLm.p.length) c.gl = GLm.mesh(); }
    if (L.length){ c.lights = buf(new Float32Array(L)); c.nl = L.length / 3; }
    return c;
  }
  // trees: birch woods below the tree line with some pine, kept off roads and buildings; colours follow the season
  const treeSeason = () => { const mo = gDate(S.t / 60).getUTCMonth(); return mo >= 5 && mo <= 7 ? 1 : mo === 8 ? 2 : 0; };
  function addTrees(m, key, idx, snowy){
    const gz = Math.floor(key / 100), gx = key - gz * 100, x0 = gx * 1000, z0 = gz * 1000, occ = new Uint8Array(1600);
    const mark = (x, z, r) => { const cx = Math.floor((x - x0) / 25), cz = Math.floor((z - z0) / 25); for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++){ const i = cx + b, j = cz + a; if (i >= 0 && j >= 0 && i < 40 && j < 40) occ[j * 40 + i] = 1; } };
    for (const i of idx) mark(BLD.x[i], BLD.z[i], Math.max(BLD.l[i], BLD.w[i]) > 30 ? 2 : 1);
    if (ROADS) for (const r of ROADS){ if (r.bb[2] < x0 - 30 || r.bb[0] > x0 + 1030 || r.bb[3] < z0 - 30 || r.bb[1] > z0 + 1030) continue; for (let j = 1; j < r.xs.length; j++){ const L = Math.hypot(r.xs[j] - r.xs[j - 1], r.zs[j] - r.zs[j - 1]), n = Math.ceil(L / 12); for (let q = 0; q <= n; q++) mark(r.xs[j - 1] + (r.xs[j] - r.xs[j - 1]) * q / n, r.zs[j - 1] + (r.zs[j] - r.zs[j - 1]) * q / n, 0); } }
    const ses = treeSeason(), leaf = ses === 1 ? [0.15, 0.29, 0.11] : ses === 2 ? [0.7, 0.48, 0.12] : [0.55, 0.5, 0.47], pine = [0.06, 0.15, 0.08], trunk = [0.78, 0.76, 0.7];
    let count = 0;
    for (let j = 0; j < 30 && count < 260; j++) for (let i = 0; i < 30 && count < 260; i++){
      const hh = hash((gx * 7919 + gz * 104729) * 900 + j * 30 + i), x = x0 + (i + 0.15 + 0.7 * hash(hh * 1e7 | 0)) * 33.3, z = z0 + (j + 0.15 + 0.7 * hash((hh * 3e7 | 0) + 5)) * 33.3;
      if (occ[Math.floor((z - z0) / 25) * 40 + Math.floor((x - x0) / 25)]) continue;
      const h = terrH(x, z); if (h < 2.5 || h > 330) continue;
      const sl = Math.hypot(terrH(x + 10, z) - terrH(x - 10, z), terrH(x, z + 10) - terrH(x, z - 10)) / 20; if (sl > 0.75) continue;
      const fo = FOREST[Math.floor(z / 50) * 1570 + Math.floor(x / 50)] ? 1 : 0;
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
    if (!ROADS) return;
    const gz = Math.floor(key / 100), gx = key - gz * 100, x0 = gx * 1000, z0 = gz * 1000, W = [7.5, 6.5, 5.5, 5, 3.6];
    const col = snowy ? [0.5, 0.52, 0.55] : [0.4, 0.42, 0.44], edge = snowy ? [0.62, 0.63, 0.65] : [0.55, 0.54, 0.5];
    for (const r of ROADS){
      if (r.bb[2] < x0 || r.bb[0] > x0 + 1000 || r.bb[3] < z0 || r.bb[1] > z0 + 1000) continue;
      const hw = W[r.c] / 2;
      for (let j = 1; j < r.xs.length; j++){
        const ax = r.xs[j - 1], az = r.zs[j - 1], bx2 = r.xs[j], bz2 = r.zs[j], mx = (ax + bx2) / 2, mz = (az + bz2) / 2;
        if (mx < x0 || mx >= x0 + 1000 || mz < z0 || mz >= z0 + 1000) continue;
        const L = Math.hypot(bx2 - ax, bz2 - az); if (L < 0.5) continue;
        const ux = (bx2 - ax) / L, uz = (bz2 - az) / L, px = -uz, pz = ux, n = Math.max(1, Math.ceil(L / 10));
        for (let q = 0; q < n; q++){
          const s0 = q / n, s1 = (q + 1) / n, e0 = q === 0 ? -hw * 0.5 : 0, e1 = q === n - 1 ? hw * 0.5 : 0;
          const x0s = ax + (bx2 - ax) * s0 + ux * e0, z0s = az + (bz2 - az) * s0 + uz * e0, x1s = ax + (bx2 - ax) * s1 + ux * e1, z1s = az + (bz2 - az) * s1 + uz * e1;
          const y0 = Math.max(terrH(x0s, z0s), 0.2) + 0.3, y1 = Math.max(terrH(x1s, z1s), 0.2) + 0.3;
          m.quad([x0s + px * hw, y0, z0s + pz * hw], [x1s + px * hw, y1, z1s + pz * hw], [x1s - px * hw, y1, z1s - pz * hw], [x0s - px * hw, y0, z0s - pz * hw], col);
          if (r.c <= 1) for (const sd of [1, -1]) m.quad([x0s + px * sd * (hw - 0.35), y0 + 0.02, z0s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.35), y1 + 0.02, z1s + pz * sd * (hw - 0.35)], [x1s + px * sd * (hw - 0.55), y1 + 0.02, z1s + pz * sd * (hw - 0.55)], [x0s + px * sd * (hw - 0.55), y0 + 0.02, z0s + pz * sd * (hw - 0.55)], edge);
        }
      }
    }
  }
  function freeChunk(c){ if (c.rd){ gl.deleteBuffer(c.rd.pb); gl.deleteBuffer(c.rd.cb); } for (const mm of [c.mesh, c.dm, c.gd, c.gl]) if (mm){ gl.deleteBuffer(mm.pb); gl.deleteBuffer(mm.cb); } if (c.lights) gl.deleteBuffer(c.lights); }
  function updateChunks(maxBuilds){
    if (!BLD || !NEARM) return;
    const sf = (snowNow < 80 ? 1 : 0) + 10 * treeSeason();
    if (sf !== chunkSnow){ for (const c of CH.values()) freeChunk(c); CH.clear(); chunkSnow = sf; }
    const half = NEARM.sx / 2 - 400, cx = NEARM.cx, cz = NEARM.cz;
    const want = (mx, mz) => Math.hypot(mx - bv.x, mz - bv.z) < 1300;
    for (const [k, c] of CH) if (Math.abs(c.x - cx) > half + 700 || Math.abs(c.z - cz) > half + 700 || (c.mesh && c.detail !== want(c.x, c.z))){ freeChunk(c); CH.delete(k); }
    const cand = [];
    for (let gz = Math.floor((cz - half) / 1000); gz <= Math.floor((cz + half) / 1000); gz++) for (let gx = Math.floor((cx - half) / 1000); gx <= Math.floor((cx + half) / 1000); gx++){
      const k = gz * 100 + gx; if (CH.has(k)) continue;
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
      const brg = ((Math.atan2(x - eye[0], -(z - eye[2])) * 180 / Math.PI) + 360) % 360;
      const sec = L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1]); if (!sec) return;
      by[sec[2]].push(x - eye[0], Math.max(terrH(x, z), 0.2) + L[2] - eye[1], z - eye[2], Math.min(1, env.night * 1.2));
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const k in by){ const a = by[k], n = a.length / 4; if (!n) continue; for (let i = 0; i < n; i++){ PB[i * 3] = a[i * 4]; PB[i * 3 + 1] = a[i * 4 + 1]; PB[i * 3 + 2] = a[i * 4 + 2]; PA[i] = a[i * 4 + 3]; } drawPts(n, gl.POINTS, VP, LCOL[k], near ? 3800 : 8000, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  let lightNF = 3000;
  function drawChunkLights(VP, eye){
    gl.useProgram(PP.p); const u = PP.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uOff, [-eye[0], -eye[1], -eye[2]]); gl.uniform1f(u.uPull, 12); gl.uniform3fv(u.uCol, [1, 0.78, 0.42]); gl.uniform1f(u.uSize, 4200); gl.uniform1f(u.uRound, 1);
    gl.disableVertexAttribArray(1); gl.vertexAttrib1f(1, env.night * 0.9);
    for (const c of CH.values()) if (c.lights){ attr(0, c.lights, 3); gl.drawArrays(gl.POINTS, 0, c.nl); }
  }

  // ---------- fish plants: the plant with its door, sign, ice silo and chute; the quay crane, a forklift and the people on the quay ----------
  // The plant is the OpenStreetMap building nearest the berth (industrial preferred), dressed with what a fish plant has on the quay
  // side; where the map has none, one of ours stands on the nearest dry land. Only the plant nearest the camera is animated.
  const PLANTS = []; let PLANTN = null, PM = null;
  const plantName = pt => { const c = CUSTOMERS.find(x => x.port === pt.id && x.big); return (c ? c.no : 'Mottaket i ' + pt.name).toUpperCase(); };
  function plantLayout(pt){
    const bp = berthPose(pt.id, 'skiff') || berthPose(pt.id, 'sjark'); if (!bp) return null;
    const f = bp.face, u = [f.ux, f.uz], n = [f.nx, f.nz], depth = f.depth || 6, cx = bp.x * 1000, cz = bp.y * 1000;
    const at = (a, o) => [f.x + u[0] * a + n[0] * o, f.z + u[1] * a + n[1] * o];
    const onQuay = p => { const rx = p[0] - f.x, rz = p[1] - f.z, al = rx * u[0] + rz * u[1], of = rx * n[0] + rz * n[1]; return Math.abs(al) <= f.hl + 0.5 && of <= 0.2 && of >= -depth - 0.2; };
    const gy = p => onQuay(p) ? QTOP : Math.max(0.4, terrH(p[0], p[1]));
    const inset = Math.min(2.8, depth / 2), drop = at(bp.a + 1.8, -inset), crane = at(bp.a - 2.6, -Math.min(1.9, depth / 2));
    let bi = -1, bs = 1e9;
    if (BLD) for (let kx = -1; kx <= 1; kx++) for (let kz = -1; kz <= 1; kz++) for (const i of (BLD.cells.get((Math.floor(cz / 1000) + kz) * 100 + Math.floor(cx / 1000) + kx) || [])){
      const ty = BLD.t[i], A = BLD.l[i] * BLD.w[i]; if (A < 250 || (ty !== 8 && ty !== 9 && ty !== 0)) continue;
      const d = Math.hypot(BLD.x[i] - cx, BLD.z[i] - cz); if (d > 220) continue;
      const sc = d - (ty === 8 ? 25 : 0) - 1.2 * Math.sqrt(A); if (sc < bs){ bs = sc; bi = i; }   // near, big, and industrial if it can be
    }
    let B;
    if (bi >= 0){ const ty = BLD.t[bi], lv = BLD.lv[bi]; B = {x:BLD.x[bi], z:BLD.z[bi], l:BLD.l[bi], w:BLD.w[bi], a:BLD.a[bi], H:ty === 8 ? (lv ? 4 * lv : 7.5) : ty === 9 ? (lv || 2) * 3.4 : (lv ? 2.8 * lv : 3.6), osm:true}; }
    else { let q = null; for (let r = 14; r <= 220 && !q; r += 6){ const p = at(bp.a, -depth - r); if (isLand({x:p[0] / 1000, y:p[1] / 1000}) && terrH(p[0], p[1]) < 25) q = at(bp.a, -depth - r - 10); }
      if (!q) return null; B = {x:q[0], z:q[1], l:26, w:16, a:Math.atan2(u[1], u[0]), H:8, osm:false}; }
    const ca = Math.cos(B.a), sa = Math.sin(B.a); let lo = 1e9, hi = -1e9;
    for (const [s1, s2] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]){ const y = terrH(B.x + ca * s1 * B.l - sa * s2 * B.w, B.z + sa * s1 * B.l + ca * s2 * B.w); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    B.base = Math.max(lo, 0.3) - 0.5; B.top = B.base + B.H + Math.max(0, hi - B.base);
    // the wall facing the quay gets the door and the sign
    const walls = [[ca, sa, B.l / 2, B.w], [-ca, -sa, B.l / 2, B.w], [-sa, ca, B.w / 2, B.l], [sa, -ca, B.w / 2, B.l]].map(([nx, nz, off, len]) => ({nx, nz, x:B.x + nx * off, z:B.z + nz * off, len}));
    const wl = walls.reduce((bw, w) => { const dx = drop[0] - w.x, dz = drop[1] - w.z, s = (dx * w.nx + dz * w.nz) / (Math.hypot(dx, dz) || 1); return !bw || s > bw.s ? {...w, s} : bw; }, null);
    const dn = [wl.nx, wl.nz], du = [-wl.nz, wl.nx], door = [wl.x, wl.z], dy = Math.max(B.base + 0.5, gy([wl.x + dn[0] * 2, wl.z + dn[1] * 2]));
    const off = (p, a, o) => [p[0] + du[0] * a + dn[0] * o, p[1] + du[1] * a + dn[1] * o];
    const e1 = off(door, wl.len / 2 - 3, 0), e2 = off(door, -wl.len / 2 + 3, 0), end = Math.hypot(e1[0] - cx, e1[1] - cz) < Math.hypot(e2[0] - cx, e2[1] - cz) ? wl.len / 2 - 3 : -wl.len / 2 + 3;
    // the ice silo stands on the quay aft of the crane, with a short chute out over the berth
    const siloR = clamp(depth / 2 - 0.3, 1.2, 2), lim = f.hl - siloR - 0.5, cA = bp.a - 2.6, dA = bp.a + 1.8;
    const sA = [bp.a - 9.5, bp.a + 9.5].map(a => clamp(a, -lim, lim)).reduce((b, a) => Math.min(Math.abs(a - cA), Math.abs(a - dA)) > Math.min(Math.abs(b - cA), Math.abs(b - dA)) ? a : b);
    const silo = at(sA, -Math.max(siloR + 0.4, Math.min(depth / 2, 3.5))), siloY = gy(silo), chuteB = at(bp.a + (sA > bp.a ? 1.2 : -1.2), 1.3), toB = Math.atan2(chuteB[0] - silo[0], chuteB[1] - silo[1]);
    const P = {id:pt.id, name:plantName(pt), bp, f, u, n, depth, at, gy, drop, crane, B, door, dn, du, dy, wallLen:wl.len, silo, siloY, siloR,
      chuteA:[silo[0] + Math.sin(toB) * siloR * 0.9, siloY + 8.2, silo[1] + Math.cos(toB) * siloR * 0.9], chuteB:[chuteB[0], QTOP + 3.4, chuteB[1]],
      lamps:[at(clamp(bp.a - 9, -f.hl + 1, f.hl - 1), -0.9), at(clamp(bp.a + 9, -f.hl + 1, f.hl - 1), -0.9)], stacks:[off(door, 4.2, 4.5), off(door, -4.2, 4.5)], park:off(door, 7.5, 6.5)};
    P.signW = Math.min(wl.len * 0.7, 16); P.signY = Math.min(B.top - 1.6, dy + 6.2);
    return P;
  }
  function buildPlants(){
    PLANTS.length = 0; const nb = NB();
    const STEEL = [0.74, 0.76, 0.78, 0.55], DOORC = [0.27, 0.3, 0.34, 0.3], BLUE = [0.12, 0.3, 0.55, 0.3], CRANE = [0.95, 0.72, 0.08, 0.4], PALLET = [0.66, 0.53, 0.36, 0.05], POLE = [0.45, 0.47, 0.5, 0.4];
    const BOXC = [[0.18, 0.4, 0.74, 0.25], [0.6, 0.64, 0.67, 0.25]], WALL = [0.82, 0.85, 0.86, 0.1], ROOFC = [0.3, 0.33, 0.36, 0.1], KAR = [0.5, 0.55, 0.6, 0.25];
    for (const pt of PORTS){
      if (!pt.mottak) continue; const P = plantLayout(pt); if (!P) continue; PLANTS.push(P);
      const B = P.B, du = P.du, dn = P.dn;
      if (!B.osm){ const L = [Math.cos(B.a), Math.sin(B.a)], W = [-Math.sin(B.a), Math.cos(B.a)]; obox(nb, [B.x, B.z], L, W, B.l, B.w, B.base, B.H, WALL); obox(nb, [B.x, B.z], L, W, B.l + 0.6, B.w + 0.6, B.base + B.H, 0.35, ROOFC); }
      // door with frame and canopy, the sign board
      const D = (a, o) => [P.door[0] + du[0] * a + dn[0] * o, P.door[1] + du[1] * a + dn[1] * o];
      obox(nb, D(0, 0.06), du, dn, 4.4, 0.12, P.dy - 0.2, 4.4, DOORC); for (const s of [-1, 1]) obox(nb, D(s * 2.3, 0.1), du, dn, 0.22, 0.2, P.dy - 0.2, 4.6, STEEL);
      obox(nb, D(0, 0.8), du, dn, 5.4, 1.6, P.dy + 4.5, 0.15, STEEL); obox(nb, D(0, 0.07), du, dn, P.signW + 0.4, 0.1, P.signY - 0.2, P.signW / 5 + 0.4, BLUE);
      // the ice silo on legs, its ladder and the chute out over the berth
      const [sx, sz] = P.silo, sy = P.siloY;
      const sr = P.siloR, ld = P.u;   // the ladder runs up the side along the quay
      for (const [lx, lz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) nb.tube([[sx + lx * sr * 0.6, sy, sz + lz * sr * 0.6], [sx + lx * sr * 0.6, sy + 3, sz + lz * sr * 0.6]], 0.12, STEEL, 6);
      nb.tube([[sx, sy + 2.8, sz], [sx, sy + 9, sz]], sr, STEEL, 16);
      { const c = [sx, sy + 9 + sr * 0.6, sz]; for (let i = 0; i < 16; i++){ const a0 = i / 16 * Math.PI * 2, a1 = (i + 1) / 16 * Math.PI * 2; nb.tri([sx + Math.cos(a0) * sr, sy + 9, sz + Math.sin(a0) * sr], c, [sx + Math.cos(a1) * sr, sy + 9, sz + Math.sin(a1) * sr], STEEL); } }
      for (const s of [-0.22, 0.22]) nb.tube([[sx + ld[0] * (sr + 0.05) + dn[0] * s, sy + 3, sz + ld[1] * (sr + 0.05) + dn[1] * s], [sx + ld[0] * (sr + 0.05) + dn[0] * s, sy + 9.4, sz + ld[1] * (sr + 0.05) + dn[1] * s]], 0.03, POLE, 4);
      for (let y = sy + 3.3; y < sy + 9.3; y += 0.35) nb.tube([[sx + ld[0] * (sr + 0.05) - dn[0] * 0.22, y, sz + ld[1] * (sr + 0.05) - dn[1] * 0.22], [sx + ld[0] * (sr + 0.05) + dn[0] * 0.22, y, sz + ld[1] * (sr + 0.05) + dn[1] * 0.22]], 0.02, POLE, 4);
      const cA = P.chuteA, cB = P.chuteB; nb.tube([cA, cB], 0.28, STEEL, 10); nb.tube([cB, [cB[0], cB[1] - 0.9, cB[2]]], 0.22, STEEL, 10);
      const mid = [(cA[0] + cB[0]) / 2, (cA[1] + cB[1]) / 2, (cA[2] + cB[2]) / 2], gm = P.gy([mid[0], mid[2]]); if (mid[1] - gm > 4) nb.tube([[mid[0], gm, mid[2]], [mid[0], mid[1] - 0.3, mid[2]]], 0.12, STEEL, 6);
      // crane pedestal, lamp posts
      nb.tube([[P.crane[0], QTOP, P.crane[1]], [P.crane[0], QTOP + 1.1, P.crane[1]]], 0.42, CRANE, 12);
      for (const L of P.lamps){ const y0 = P.gy(L); nb.tube([[L[0], y0, L[1]], [L[0], y0 + 8, L[1]]], 0.09, POLE, 6); obox(nb, [L[0] + P.n[0] * 0.3, L[1] + P.n[1] * 0.3], P.u, P.n, 0.7, 0.5, y0 + 7.8, 0.3, [0.2, 0.22, 0.25, 0.3]); }
      // stacks of fish boxes on pallets and a pair of empty tubs by the door
      P.stacks.forEach((S0, k) => { const y0 = P.gy(S0); for (let j = 0; j < 2; j++){ const c = [S0[0] + du[0] * (j - 0.5) * 1.35, S0[1] + du[1] * (j - 0.5) * 1.35]; obox(nb, c, du, dn, 1.2, 0.8, y0, 0.15, PALLET);
        for (let lay = 0; lay < 4 + ((k + j) % 3); lay++) for (let b = 0; b < 3; b++) obox(nb, [c[0] + du[0] * (b - 1) * 0.4, c[1] + du[1] * (b - 1) * 0.4], du, dn, 0.38, 0.78, y0 + 0.15 + lay * 0.3, 0.28, BOXC[(k + lay) % 2]); } });
      for (let j = 0; j < 2; j++){ const c = D(-7 - j * 1.4, 3); obox(nb, c, du, dn, 1.2, 1.0, P.gy(c), 0.8, KAR); }
    }
    PLANTN = nb.mesh();
  }
  // the moving parts, built once and drawn with a transform; the workers are drawn joint by joint
  function buildPlantParts(){
    const mk = f => { const b = NB(); f(b); return b.mesh(); }, unit = k => mk(b => b.tube([[0, 0, 0], [0, 0, 1]], 1, k, 6));
    const YEL = [0.95, 0.72, 0.08, 0.4], DK = [0.14, 0.15, 0.17, 0.2], VEST = [1, 0.45, 0.06, 0.3], REFL = [0.9, 0.95, 0.9, 0.6], SKIN = [0.86, 0.66, 0.52, 0.1];
    PM = {
      leg:unit([0.16, 0.18, 0.22, 0.1]), arm:unit(VEST), wire:unit([0.1, 0.1, 0.1, 0.3]), broom:unit([0.55, 0.4, 0.25, 0.05]), hose:unit([0.2, 0.55, 0.25, 0.3]),
      boom:mk(b => b.box(0, -0.5, 0.5, 1, 1, 1, YEL)),
      torso:mk(b => { b.box(0, 0, 0, 0.42, 0.56, 0.26, VEST); b.box(0, 0.16, 0, 0.43, 0.06, 0.27, REFL); b.box(0, 0.34, 0, 0.43, 0.06, 0.27, REFL); }),
      head:mk(b => { b.box(0, 0, 0, 0.2, 0.22, 0.22, SKIN); b.box(0, 0.2, 0, 0.26, 0.09, 0.28, [0.95, 0.95, 0.92, 0.5]); b.box(0, 0.19, -0.14, 0.24, 0.03, 0.08, [0.95, 0.95, 0.92, 0.5]); }),
      hand:mk(b => b.box(0, -0.05, 0, 0.09, 0.1, 0.09, [0.9, 0.9, 0.2, 0.2])), boot:mk(b => b.box(0, 0, -0.05, 0.13, 0.12, 0.28, DK)),
      cup:mk(b => b.box(0, 0, 0, 0.08, 0.1, 0.08, [0.95, 0.95, 0.95, 0.4])), fbox:mk(b => b.box(0, 0, 0, 0.78, 0.28, 0.38, [0.18, 0.4, 0.74, 0.25])),
      cab:mk(b => { b.box(0, 0, 0, 1.3, 1.5, 1.3, YEL); b.box(0, 0.6, -0.66, 1.1, 0.7, 0.04, [0.15, 0.2, 0.25, 0.8]); }),
      hook:mk(b => { b.box(0, -0.3, 0, 0.3, 0.45, 0.2, YEL); b.box(0, -0.55, 0, 0.06, 0.25, 0.06, DK); }),
      // forklift: body with counterweight and overhead guard, driver in the seat; forks on a mast that lifts (local forward -z)
      fork:mk(b => { b.box(0, 0.25, 0.2, 1.15, 0.8, 1.9, [0.85, 0.2, 0.12, 0.35]); b.box(0, 0.25, 1.05, 1.15, 1.05, 0.5, [0.2, 0.2, 0.22, 0.2]);
        for (const [x, z] of [[-0.52, -0.55], [0.52, -0.55], [-0.52, 0.8], [0.52, 0.8]]) b.box(x, 1.05, z, 0.07, 1.15, 0.07, DK); b.box(0, 2.2, 0.12, 1.15, 0.06, 1.45, DK);
        for (const [x, z] of [[-0.5, -0.6], [0.5, -0.6], [-0.5, 0.85], [0.5, 0.85]]) b.tube([[x - 0.12, 0.28, z], [x + 0.12, 0.28, z]], 0.28, DK, 10);
        b.box(0, 1.05, 0.35, 0.44, 0.55, 0.3, VEST); b.box(0, 1.6, 0.33, 0.2, 0.22, 0.22, SKIN); b.box(0, 1.8, 0.33, 0.26, 0.09, 0.28, [0.95, 0.95, 0.92, 0.5]); }),
      mast:mk(b => { for (const x of [-0.35, 0.35]) b.box(x, 0, 0, 0.08, 2.3, 0.1, DK); b.box(0, 0.2, -0.08, 0.8, 0.3, 0.06, DK); for (const x of [-0.25, 0.25]) b.box(x, 0, -0.62, 0.1, 0.05, 1.1, DK); }),
      pal:mk(b => { b.box(0, 0, 0, 1.2, 0.14, 0.8, [0.66, 0.53, 0.36, 0.05]); for (let lay = 0; lay < 3; lay++) for (let k = 0; k < 3; k++) b.box((k - 1) * 0.4, 0.14 + lay * 0.29, 0, 0.38, 0.28, 0.78, [0.18, 0.4, 0.74, 0.25]); }),
      // a landing's loads: a pallet with 1 to 9 boxes of fish, or a 460 litre tub with ice on top of the fish
      palN:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(nb => mk(b => { b.box(0, 0, 0, 1.2, 0.14, 0.8, [0.66, 0.53, 0.36, 0.05]); for (let k = 0; k < nb; k++) b.box((k % 3 - 1) * 0.4, 0.14 + Math.floor(k / 3) * 0.29, 0, 0.38, 0.28, 0.78, [0.18, 0.4, 0.74, 0.25]); })),
      tub:mk(b => { b.box(0, 0, 0, 1.2, 0.85, 1.0, [0.2, 0.36, 0.62, 0.25]); b.box(0, 0.84, 0, 1.24, 0.05, 1.04, [0.16, 0.3, 0.52, 0.25]); b.box(0, 0.8, 0, 1.08, 0.06, 0.88, [0.93, 0.96, 0.98, 0.5]); }),
      board:mk(b => b.box(0, 0, 0, 0.24, 0.3, 0.02, [0.92, 0.9, 0.84, 0.1])), remote:mk(b => { b.box(0, 0, 0, 0.22, 0.1, 0.14, [0.95, 0.72, 0.08, 0.4]); b.box(0.06, 0.1, 0, 0.02, 0.12, 0.02, [0.1, 0.1, 0.1, 0.3]); })
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
  function plantRounds(P){
    if (P.rounds) return P.rounds;
    const face = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), bl = QB[faceKey(P.f)] || [], bp = P.bp, f = P.f;
    const bol = (a) => bl.length ? bl.reduce((x, q) => Math.abs(q.a - a) < Math.abs(x.a - a) ? q : x, bl[0]) : {x:P.at(a, -0.6)[0], z:P.at(a, -0.6)[1]};
    const bA = bol(bp.a - 5), bF = bol(bp.a + 5), toW = (q) => [q.x - P.n[0] * 0.7, q.z - P.n[1] * 0.7], seaH = Math.atan2(P.n[0], -P.n[1]);
    const D2 = [P.door[0] + P.dn[0] * 2.4, P.door[1] + P.dn[1] * 2.4], S1 = P.stacks[0], S2 = P.stacks[1], near = (S) => [S[0] + P.dn[0] * 1.1, S[1] + P.dn[1] * 1.1];
    const sw1 = P.at(bp.a - 6, -Math.min(1.6, P.depth / 2)), sw2 = P.at(bp.a + 6, -Math.min(1.6, P.depth / 2)), along = Math.atan2(P.u[0], -P.u[1]);
    return P.rounds = [
      {v:1.1, st:[{p:toW(bA), d:24, task:'coil', h:seaH}, {p:toW(bF), d:20, task:'coil', h:seaH}, {p:P.drop, d:14, task:'look', h:seaH}]},
      {v:1.2, st:[{p:near(S1), d:32, task:'hose', h:face(near(S1), S1), carry:true}, {p:near(S2), d:9, task:'stack', h:face(near(S2), S2)}]},
      {v:0.6, st:[{p:sw1, d:1, task:'sweep', h:along, carry:false}, {p:sw2, d:1, task:'sweep', h:along + Math.PI}], sweep:true},
      {v:1.0, st:[{p:D2, d:45, task:'coffee', h:face(D2, P.drop)}, {p:[D2[0] + P.du[0] * 2, D2[1] + P.du[1] * 2], d:15, task:'look', h:face(D2, P.drop)}]},
      {v:2.2, st:[{p:P.park, d:18, task:'park', h:face(P.park, P.door)}, {p:near(S1), d:6, task:'pick', h:face(near(S1), S1), carry:true}, {p:P.drop, d:6, task:'drop', h:seaH}]}
    ];
  }
  function drawWorker(P, st, eye, T, idx){
    const y = P.gy([st.x, st.z]), h = st.h, F = [Math.sin(h), -Math.cos(h)], R = [Math.cos(h), Math.sin(h)], rel = (x, yy, z) => [x - eye[0], yy - eye[1], z - eye[2]];
    const W = (a, up, r) => rel(st.x + F[0] * a + R[0] * r, y + up, st.z + F[1] * a + R[1] * r);
    const ph = st.walk || st.task === 'sweep' ? (T * 6.5 + idx) : 0, sw = st.walk ? Math.sin(ph) : 0;
    for (const s of [-1, 1]){ const hip = W(0, 0.92, s * 0.11), foot = W(sw * s * 0.28, 0.08 + Math.max(0, Math.cos(ph) * s) * 0.07 * (st.walk ? 1 : 0), s * 0.12), knee = [(hip[0] + foot[0]) / 2 + F[0] * 0.07, (hip[1] + foot[1]) / 2, (hip[2] + foot[2]) / 2 + F[1] * 0.07];
      drawN(PM.leg, limbM(hip, knee, 0.075)); drawN(PM.leg, limbM(knee, foot, 0.065)); drawN(PM.boot, chain(M4.T(foot[0], foot[1] - 0.08, foot[2]), M4.RY(-h))); }
    const bend = st.task === 'hose' || st.task === 'coil' || st.task === 'stack' ? 0.12 : 0;
    const tc = W(bend * 0.4, 1.2, 0); drawN(PM.torso, chain(M4.T(tc[0], tc[1] - 0.28, tc[2]), M4.RY(-h), M4.RX(-bend)));
    const hd = W(bend, 1.6, 0); drawN(PM.head, chain(M4.T(hd[0], hd[1] - 0.1, hd[2]), M4.RY(-h + (st.task === 'look' ? Math.sin(T * 0.4 + idx) * 0.5 : 0))));
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
      default: hands = [W(-sw * 0.15, 0.82, 0.26), W(sw * 0.15, 0.82, -0.26)];
    }
    [0.21, -0.21].forEach((r, i) => { const sh = W(bend * 0.8, 1.42, r), hd2 = hands[i], el = [(sh[0] + hd2[0]) / 2 - F[0] * 0.05 + R[0] * r * 0.25, (sh[1] + hd2[1]) / 2 - 0.08, (sh[2] + hd2[2]) / 2 - F[1] * 0.05 + R[1] * r * 0.25];
      drawN(PM.arm, limbM(sh, el, 0.06)); drawN(PM.arm, limbM(el, hd2, 0.055)); drawN(PM.hand, M4.T(hd2[0], hd2[1], hd2[2])); });
    if (st.task === 'coffee') drawN(PM.cup, M4.T(hands[0][0], hands[0][1] + 0.02, hands[0][2]));
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
  const HOOK_UP = QTOP + 3.9, TIP_Y = QTOP + 6.2;
  const ease = u => u * u * (3 - 2 * u), seg = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
  const loadH = (kind, nb) => kind === 'tub' ? 0.85 : 0.13 + Math.ceil(nb / 3) * 0.29;
  const craneIdle = (P, T) => ({a:Math.atan2(-P.n[0], -P.n[1]) + Math.sin(T * 0.05) * 0.6, r:5.5, hook:QTOP + 3.2});
  const poseTo = (P, x, z, hook) => ({a:Math.atan2(x - P.crane[0], z - P.crane[1]), r:Math.max(1.5, Math.hypot(x - P.crane[0], z - P.crane[1])), hook});
  const poseMix = (A, B, k) => ({a:A.a + angDiff(A.a, B.a) * k, r:A.r + (B.r - A.r) * k, hook:A.hook + (B.hook - A.hook) * k});
  const tipOf = (P, q) => [P.crane[0] + Math.sin(q.a) * q.r, TIP_Y, P.crane[1] + Math.cos(q.a) * q.r];
  // where the loads stand on deck, in the boat's frame (x to starboard, z aft); the first slot is the next to go up
  function deckSlots(kind){
    const G = VGEO[vtype()] || VGEO.skiff, d = G.deck || {y:G.gw, z:(G.stern || 3) * 0.5};
    return kind === 'tub' ? [[0.65, d.y, d.z - 0.55], [-0.65, d.y, d.z - 0.55], [0.65, d.y, d.z + 0.55], [-0.65, d.y, d.z + 0.55]] : [[0, d.y, d.z - 0.45], [0, d.y, d.z + 0.45]];
  }
  // the forklift's run: from where it waits by the drop spot, forward to the loads, back out, over to the door, inside, and back.
  // Its speed is set so a run takes at most two lifts, whatever the distance to the door.
  function fkRun(P){
    if (P.run) return P.run;
    const D = P.drop, E = [P.door[0] + P.dn[0] * 3, P.door[1] + P.dn[1] * 3], I = [P.door[0] - P.dn[0] * 4, P.door[1] - P.dn[1] * 4];
    const dl = Math.hypot(E[0] - D[0], E[1] - D[1]) || 1, u = [(E[0] - D[0]) / dl, (E[1] - D[1]) / dl], Wp = [D[0] + u[0] * 6, D[1] + u[1] * 6], Dp = [D[0] + u[0] * 1.7, D[1] + u[1] * 1.7];
    const hd = (a, c) => Math.atan2(c[0] - a[0], -(c[1] - a[1])), toD = hd(Wp, Dp), len = (a, c) => Math.hypot(c[0] - a[0], c[1] - a[1]);
    const legs = [['go', Wp, Dp, toD], ['pick', Dp, Dp, toD, 0.35], ['go', Dp, Wp, toD], ['go', Wp, E, hd(Wp, E)], ['go', E, I, hd(E, I)], ['drop', I, I, hd(E, I), 0.3], ['go', I, E, hd(I, E)], ['go', E, Wp, hd(E, Wp)]];
    const dist = legs.reduce((s, g) => s + len(g[1], g[2]), 0), vG = Math.max(20, dist / 3.95);   // metres per game minute
    let t = 0; for (const g of legs){ g.t0 = t; g.dur = g[4] || len(g[1], g[2]) / vG; t += g.dur; }
    return P.run = {legs, T:t, Wp, D, E, I, waitH:toD};
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
      const g = R.legs.find(q => t < q.t0 + q.dur) || R.legs[R.legs.length - 1], w = clamp((t - g.t0) / g.dur, 0, 1), gi = R.legs.indexOf(g);
      const loads = [2 * k, 2 * k + 1].filter(j => j < n).map(j => ({mesh:mesh(j), h:hh(j)}));
      fk = {x:g[1][0] + (g[2][0] - g[1][0]) * w, z:g[1][1] + (g[2][1] - g[1][1]) * w, h:g[3], fl:g[0] === 'pick' ? w : g[0] === 'drop' ? 1 - w : gi > 1 && gi < 5 ? 1 : 0, loads:gi >= 1 && gi <= 5 ? loads : []};
      break; }
    // the people: stations and jobs
    const along = (x, z) => (x - P.f.x) * P.u[0] + (z - P.f.z) * P.u[1], aK = along(K[0], K[2]), aD = along(D[0], D[1]), sd = aD >= along(P.crane[0], P.crane[1]) ? 1 : -1;
    const hdg = (p, q) => Math.atan2(q[0] - p[0], -(q[1] - p[1])), seaH = Math.atan2(P.n[0], -P.n[1]), tip = tipOf(P, pose);
    const s0 = P.at(aK, -0.8), s1 = P.at(aD + sd * 1.9, -Math.min(2.8, P.depth / 2)), s2 = [R.E[0] + P.du[0] * 2.6, R.E[1] + P.du[1] * 2.6], s3 = P.at(along(P.crane[0], P.crane[1]) - sd * 1.6, -Math.min(P.depth - 0.8, 3.6));
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
    // crane: a slewing cab on the pedestal, a telescopic boom to a tip above the load, the wire and the hook
    const pose = LS ? LS.pose : craneIdle(P, T), tp = tipOf(P, pose), piv = rel(P.crane[0], QTOP + 2.6, P.crane[1]), tip = rel(tp[0], tp[1], tp[2]), slew = pose.a;
    drawN(PM.cab, chain(M4.T(piv[0], QTOP + 1.1 - eye[1], piv[2]), M4.RY(slew + Math.PI)));
    drawN(PM.boom, limbM(piv, tip, 0.34)); const hk = [tip[0], pose.hook - eye[1], tip[2]]; drawN(PM.wire, limbM(tip, hk, 0.02)); drawN(PM.hook, M4.T(hk[0], hk[1], hk[2]));
    if (LS && LS.hang){ const h = LS.hang.h; drawN(LS.hang.mesh, chain(M4.T(hk[0], hk[1] - 0.1 - h, hk[2]), M4.RY(slew)));
      for (const s of [-1, 1]) drawN(PM.wire, limbM([hk[0], hk[1] - 0.3, hk[2]], [hk[0] + Math.cos(slew) * 0.55 * s, hk[1] - 0.1, hk[2] - Math.sin(slew) * 0.55 * s], 0.012)); }
    if (LS){
      for (const q of LS.deck) drawN(q.mesh, chain(BMrel, M4.T(q.at[0], q.at[1], q.at[2])));
      for (const q of LS.quay){ const c = rel(P.drop[0], q.y, P.drop[1]); drawN(q.mesh, chain(M4.T(c[0], c[1], c[2]), M4.RY(LS.slewD))); }
    }
    // people: the day shift, or one on watch at night; everyone turns out for a landing
    const R = plantRounds(P); P.spray = 0;
    for (let i = 0; i < 4; i++){ if (!onShift && i !== 3) continue; drawWorker(P, follow(P, 'w' + i, LS ? LS.busy[i] : roundAt(R[i], T + i * 17), T, 1.6), eye, T, i); }
    // forklift
    let FK;
    if (LS) FK = LS.fk;
    else { const r = roundAt(R[4], T); FK = {x:r.x, z:r.z, h:r.h, fl:r.task === 'pick' ? Math.min(1, r.s / 3) : r.task === 'drop' ? Math.max(0, 1 - r.s / 3) : r.task === 'carry' ? 1 : 0, loads:r.task === 'carry' || r.task === 'drop' && r.s < 3 || r.task === 'pick' && r.s > 3 ? [{mesh:PM.pal, h:1}] : []}; }
    FK = follow(P, 'fk', {...FK, task:'fk'}, T, 4.5);
    { const dt = P.fkT ? clamp(T - P.fkT, 0, 0.5) : 1; P.fkT = T; P.fkH = P.fkH === undefined || dt >= 0.5 ? FK.h : P.fkH + clamp(angDiff(P.fkH, FK.h), -2.4 * dt, 2.4 * dt); }
    const fy = P.gy([FK.x, FK.z]), FM = chain(M4.T(FK.x - eye[0], fy - eye[1], FK.z - eye[2]), M4.RY(-P.fkH)); drawN(PM.fork, FM); drawN(PM.mast, chain(FM, M4.T(0, 0.12 + FK.fl * 0.5, -1.05)));
    { let y = 0.2 + FK.fl * 0.5; for (const q of FK.loads){ drawN(q.mesh, chain(FM, M4.T(0, y, -1.6))); y += q.h; } }
    // ice down the chute into the boat
    { const b = S.boat, gt = S.t + currentFrac(); if (b.iceUntil > gt && b.status === 'port' && b.port === P.id && BMrel){
      const G = VGEO[vtype()] || VGEO.skiff, dy = xf(BMrel, [0, (G.deck || {y:G.gw}).y, 0])[1] + eye[1], O = [P.chuteB[0], P.chuteB[1] - 0.95, P.chuteB[2]], fall = Math.max(0.5, O[1] - dy);
      let k = P.spray; for (let i = 0; i < 70; i++){ const q = (T * 1.6 + i / 70) % 1, r = 0.12 + 0.1 * q; PB[k * 3] = O[0] + (hash(i) - 0.5) * r - eye[0]; PB[k * 3 + 1] = O[1] - q * q * fall - eye[1]; PB[k * 3 + 2] = O[2] + (hash(i + 31) - 0.5) * r - eye[2]; PA[k] = 0.85; k++; }
      P.spray = k; } }
    // sign
    if (!P.sign){ const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 200; const g = cv.getContext('2d'); g.fillStyle = '#1f4d8c'; g.fillRect(0, 0, 1024, 200); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 110; g.font = '700 ' + fs + 'px Archivo, Arial, sans-serif'; while (g.measureText(P.name).width > 960 && fs > 40){ fs -= 6; g.font = '700 ' + fs + 'px Archivo, Arial, sans-serif'; } g.fillText(P.name, 512, 104); P.sign = {tex:mkTex()}; upTex(P.sign.tex, cv);
      const w2 = P.signW / 2, hS = P.signW / 5.12, c = [P.door[0] + P.dn[0] * 0.14, P.door[1] + P.dn[1] * 0.14], a = [c[0] - P.du[0] * w2, c[1] - P.du[1] * w2], b = [c[0] + P.du[0] * w2, c[1] + P.du[1] * w2];
      P.sign.q = texQuad([b[0], P.signY, b[1]], [a[0], P.signY, a[1]], [a[0], P.signY + hS, a[1]], [b[0], P.signY + hS, b[1]]); }
    drawTexQuad(P.sign.q, P.sign.tex, M4.T(-eye[0], -eye[1], -eye[2]), VP, true, [P.dn[0], 0, P.dn[1]]);
    return {night, spray:P.spray, lamps:P.lamps.map(L => rel(L[0], P.gy(L) + 7.7, L[1]))};
  }
  function nearestPlant(eye){ let best = null, bd = 900; for (const P of PLANTS){ const d = Math.hypot(P.drop[0] - eye[0], P.drop[1] - eye[2]); if (d < bd){ bd = d; best = P; } } return best; }

  // ---------- boat ----------
  const WHITE = [0.9, 0.92, 0.93], NAVY = [0.1, 0.16, 0.3], RED = [0.45, 0.12, 0.1], FLOOR = [0.72, 0.74, 0.74], ORANGE = [0.93, 0.4, 0.1], SKIN = [0.85, 0.65, 0.5], DARK = [0.14, 0.16, 0.18], GREY = [0.62, 0.64, 0.66], GLASS = [0.2, 0.27, 0.32];
  // ======================= the starter boat: a 19 ft centre-console skiff, modelled in detail =======================
  // smooth-shaded lit program with gloss (vertex colour alpha) for curved parts; textured program for screens and decals
  const LITN_VS = 'attribute vec3 aPos;attribute vec3 aNor;attribute vec4 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vN;varying vec4 vC;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vN=(uM*vec4(aNor,0.0)).xyz;vC=aCol;gl_Position=uVP*w;}';
  const LITN_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uAlpha;uniform float uEmis;varying vec3 vW;varying vec3 vN;varying vec4 vC;' +
    'void main(){vec3 n=normalize(vN);vec3 V=normalize(-vW);if(dot(n,V)<0.0)n=-n;float dif=max(dot(n,uSun),0.0);vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);' +
    'float sp=pow(max(dot(reflect(-uSun,n),V),0.0),mix(12.0,90.0,vC.a))*vC.a;float fr=pow(1.0-max(dot(n,V),0.0),4.0)*vC.a*0.35;' +
    'vec3 c=vC.rgb*(amb+uSunCol*dif)+uSunCol*sp*0.55+uAmb*1.2*fr+vC.rgb*uEmis;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),uAlpha);}';
  const TEX_VS = 'attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform mat4 uM;varying vec2 vUV;varying vec3 vW;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vUV=aUV;gl_Position=uVP*w;}';
  const TEX_FS = 'precision mediump float;uniform sampler2D uTex;uniform float uLit;uniform vec3 uN;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;varying vec2 vUV;varying vec3 vW;' +
    'void main(){vec4 t=texture2D(uTex,vUV);if(t.a<0.05)discard;vec3 c=uLit>0.5?t.rgb*(uAmb+uSunCol*max(dot(uN,uSun),0.0)):t.rgb;float d=length(vW);float f=1.0-exp(-uFogD*uFogD*d*d);gl_FragColor=vec4(mix(c,uFog,f),t.a);}';
  let PRGN = null, PRGX = null, SK = null, PRGW = null, WKB = null, CHARM_AT = [0.2, 1.6, 0.1];
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
  // builder with normals and gloss
  function NB(){
    const p = [], n = [], c = [];
    const o = {p, n, c,
      v(a, nn, k){ p.push(a[0], a[1], a[2]); n.push(nn[0], nn[1], nn[2]); c.push(k[0], k[1], k[2], k[3] === undefined ? 0.2 : k[3]); },
      tri(a, b, d, k){ const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(nn[0], nn[1], nn[2]) || 1; const q = [nn[0] / l, nn[1] / l, nn[2] / l]; o.v(a, q, k); o.v(b, q, k); o.v(d, q, k); },
      quad(a, b, d, e, k){ o.tri(a, b, d, k); o.tri(a, d, e, k); },
      // a grid of points G[i][j] with smooth normals; colour per cell from kf(i, j)
      grid(G, kf){
        const R = G.length, C = G[0].length, N = [];
        for (let i = 0; i < R; i++){ N.push([]); for (let j = 0; j < C; j++){
          const a = G[Math.min(R - 1, i + 1)][j], b = G[Math.max(0, i - 1)][j], d = G[i][Math.min(C - 1, j + 1)], e = G[i][Math.max(0, j - 1)];
          const u = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], w = [d[0] - e[0], d[1] - e[1], d[2] - e[2]], nn = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(nn[0], nn[1], nn[2]) || 1;
          N[i].push([nn[0] / l, nn[1] / l, nn[2] / l]); } }
        for (let i = 0; i < R - 1; i++) for (let j = 0; j < C - 1; j++){ const k = kf(i, j); o.v(G[i][j], N[i][j], k); o.v(G[i + 1][j], N[i + 1][j], k); o.v(G[i + 1][j + 1], N[i + 1][j + 1], k); o.v(G[i][j], N[i][j], k); o.v(G[i + 1][j + 1], N[i + 1][j + 1], k); o.v(G[i][j + 1], N[i][j + 1], k); }
      },
      // a tube along a polyline (stainless rails, handles)
      tube(P, r, k, sides){
        sides = sides || 8; const G = [];
        for (let i = 0; i < P.length; i++){
          const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const tl = Math.hypot(t[0], t[1], t[2]) || 1; t = t.map(x => x / tl);
          let up = Math.abs(t[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let s = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]; const sl = Math.hypot(s[0], s[1], s[2]); s = s.map(x => x / sl);
          const u = [s[1] * t[2] - s[2] * t[1], s[2] * t[0] - s[0] * t[2], s[0] * t[1] - s[1] * t[0]], row = [];
          for (let j = 0; j <= sides; j++){ const an = j / sides * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an); row.push([P[i][0] + (s[0] * ca + u[0] * sa) * r, P[i][1] + (s[1] * ca + u[1] * sa) * r, P[i][2] + (s[2] * ca + u[2] * sa) * r]); }
          G.push(row);
        }
        o.grid(G, () => k);
        if (r >= 0.03) for (const i of [0, P.length - 1]){ const R = G[i]; for (let j = 0; j < sides; j++) o.tri(P[i], R[j], R[j + 1], k); }
      },
      box(cx, cy, cz, sx, sy, sz, k, kTop){ const x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, y1 = cy + sy;
        o.quad([x0, cy, z1], [x1, cy, z1], [x1, y1, z1], [x0, y1, z1], k); o.quad([x1, cy, z0], [x0, cy, z0], [x0, y1, z0], [x1, y1, z0], k);
        o.quad([x0, cy, z0], [x0, cy, z1], [x0, y1, z1], [x0, y1, z0], k); o.quad([x1, cy, z1], [x1, cy, z0], [x1, y1, z0], [x1, y1, z1], k);
        o.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], kTop || k); o.quad([x0, cy, z0], [x1, cy, z0], [x1, cy, z1], [x0, cy, z1], k); },
      // a box with rounded vertical and top edges, lofted along z (cowlings, cushions, pods)
      rbox(cx, cy, cz, w, h, d, r, k, taper){
        taper = taper || 0; const G = [], NZ = 10, NA = 20;
        for (let i = 0; i <= NZ; i++){
          const t = i / NZ, zz = cz - d / 2 + d * t, e = Math.min(1, Math.sin(Math.PI * t) * 1.25), sc = 1 - taper * t, hw = (w / 2) * sc * (0.5 + 0.5 * e), hh = h * (0.55 + 0.45 * e), row = [];
          for (let j = 0; j <= NA; j++){ const an = j / NA * Math.PI * 2, ca = Math.cos(an), sa = Math.sin(an), px = Math.sign(ca) * Math.max(0, Math.abs(ca) * (hw) - 0) , py = sa;
            // rounded rectangle via superellipse
            const ex = Math.sign(ca) * Math.pow(Math.abs(ca), 0.35), ey = Math.sign(sa) * Math.pow(Math.abs(sa), 0.35);
            row.push([cx + ex * hw, cy + hh / 2 + ey * hh / 2, zz]); }
          G.push(row);
        }
        o.grid(G, () => k);
        // close both ends
        for (const i of [0, NZ]){ const R = G[i], c = R.slice(0, NA).reduce((a, q) => [a[0] + q[0] / NA, a[1] + q[1] / NA, a[2] + q[2] / NA], [0, 0, 0]); for (let j = 0; j < NA; j++) o.tri(c, R[j], R[j + 1], k); }
      },
      disc(c0, nrm, r, k, seg){ seg = seg || 16; const up = Math.abs(nrm[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]; let s = [nrm[1] * up[2] - nrm[2] * up[1], nrm[2] * up[0] - nrm[0] * up[2], nrm[0] * up[1] - nrm[1] * up[0]]; const sl = Math.hypot(...s); s = s.map(x => x / sl); const u = [s[1] * nrm[2] - s[2] * nrm[1], s[2] * nrm[0] - s[0] * nrm[2], s[0] * nrm[1] - s[1] * nrm[0]];
        for (let j = 0; j < seg; j++){ const a0 = j / seg * Math.PI * 2, a1 = (j + 1) / seg * Math.PI * 2, P0 = [c0[0] + (s[0] * Math.cos(a0) + u[0] * Math.sin(a0)) * r, c0[1] + (s[1] * Math.cos(a0) + u[1] * Math.sin(a0)) * r, c0[2] + (s[2] * Math.cos(a0) + u[2] * Math.sin(a0)) * r], P1 = [c0[0] + (s[0] * Math.cos(a1) + u[0] * Math.sin(a1)) * r, c0[1] + (s[1] * Math.cos(a1) + u[1] * Math.sin(a1)) * r, c0[2] + (s[2] * Math.cos(a1) + u[2] * Math.sin(a1)) * r]; o.v(c0, nrm, k); o.v(P0, nrm, k); o.v(P1, nrm, k); } },
      mesh(){ return {pb:buf(new Float32Array(p)), nb:buf(new Float32Array(n)), cb:buf(new Float32Array(c)), n:p.length / 3}; }
    };
    return o;
  }
  function nSetup(VP){
    gl.useProgram(PRGN.p); const u = PRGN.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uAlpha, 1); gl.uniform1f(u.uEmis, 0);
  }
  function drawN(m, M){ gl.uniformMatrix4fv(PRGN.u.uM, false, M); attr(0, m.pb, 3); attr(1, m.nb, 3); gl.bindBuffer(gl.ARRAY_BUFFER, m.cb); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, m.n); }
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
    const person = (B, x, y, z, seated, hands) => {
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
    const pb = NB(); person(pb, 0, 0.2, 0.8, false, [[-0.12, 1.12, 0.05], [0.16, 1.1, 0.05]]);
    const cb = NB(); person(cb, 0.26, 0.32, 1.16, true, null);
    // the angler at the rail (built facing -z, turned to face starboard when drawn), and the rod (butt at the hands, pointing -z)
    const ab = NB(); person(ab, 0, 0, 0, false, [[-0.1, 1.2, -0.3], [0.1, 1.14, -0.26]]);
    const rb = NB(); rb.tube([[0, 0, 0.35], [0, 0, -0.1]], 0.02, [0.12, 0.1, 0.08, 0.3], 8); rb.tube([[0, 0, -0.1], [0, 0, -2.3]], 0.009, [0.25, 0.32, 0.3, 0.8], 6); rb.rbox(0, -0.07, 0.1, 0.07, 0.08, 0.1, 0.03, [0.15, 0.15, 0.17, 0.6]);
    // the fisher at the rail: body without arms (the arms are drawn live, reaching for rod, reel or line)
    const fb = NB(); person(fb, 0, 0, 0, false, false);
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
    const top = 26, cw = 318, ch = Hc - top - 18, rng = 1.1, sw = 106, sh = Math.round(sw * ch / cw), kpp = 2 * rng / sw, sd = safeDepth();
    plotSmall = plotSmall || document.createElement('canvas'); plotSmall.width = sw; plotSmall.height = sh;
    const sg = plotSmall.getContext('2d'), img = sg.createImageData(sw, sh), d = img.data;
    for (let j = 0; j < sh; j++) for (let i = 0; i < sw; i++){
      const q = {x:p.x + (i + 0.5 - sw / 2) * kpp, y:p.y + (j + 0.5 - sh / 2) * kpp}, o = (j * sw + i) * 4; let c;
      if (q.x < 0 || q.y < 0 || q.x > MAP_W || q.y > MAP_H) c = [60, 66, 70]; else if (isLand(q)) c = [224, 206, 150]; else { const dd = depthF(q); c = dd < Math.min(2, sd / 2) ? [128, 176, 222] : dd < sd ? [165, 202, 234] : dd < 30 ? [236, 243, 248] : [250, 252, 253]; }
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    sg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(plotSmall, 0, top, cw, ch);
    const X = x => (x - p.x) / kpp * (cw / sw), Y = y => top + ch / 2 + (y - p.y) / kpp * (cw / sw);
    g.save(); g.beginPath(); g.rect(0, top, cw, ch); g.clip();
    // route and trail
    if (S.plan){ g.strokeStyle = '#d6336c'; g.lineWidth = 3; g.beginPath(); g.moveTo(X(p.x) + cw / 2, Y(p.y)); for (const w of S.plan.wps.slice(S.plan.idx)) g.lineTo(X(w.x) + cw / 2, Y(w.y)); g.stroke(); }
    // other vessels
    if (Hn - aisCache.t > 0.02 || aisCache.t < 0){ aisCache = {t:Hn, v:npcStates(Hn)}; }
    for (const n of aisCache.v){ const x = X(n.p.x) + cw / 2, y = Y(n.p.y); if (x < -10 || x > cw + 10 || y < top - 10 || y > top + ch + 10) continue; g.save(); g.translate(x, y); g.rotate(n.cog !== undefined ? n.cog : n.hd); g.fillStyle = n.fleet ? '#ff8a65' : '#4c8df0'; g.strokeStyle = '#1b2a33'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -9); g.lineTo(5, 6); g.lineTo(0, 3); g.lineTo(-5, 6); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    // own boat with heading line
    g.save(); g.translate(cw / 2, top + ch / 2); g.rotate(bv.head); g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -60); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 10); g.lineTo(0, 5); g.lineTo(-8, 10); g.closePath(); g.fill(); g.restore();
    g.restore();
    // scale bar
    g.fillStyle = '#123'; g.font = '600 13px system-ui, sans-serif'; g.fillText('0,5 nm', 10, top + ch - 10); g.fillRect(10, top + ch - 26, (0.926 / kpp) * (cw / sw) / 1, 3);
    // echo sounder on the right
    const ec = document.getElementById('echo'), ex = cw + 4, ew = W - ex;
    g.fillStyle = '#021628'; g.fillRect(ex, top, ew, ch); if (ec && ec.width) g.drawImage(ec, ex, top, ew, ch);
    const dep = Math.max(0.8, depthF(p) + tideCD(Hn));
    g.fillStyle = '#fff'; g.font = '700 30px system-ui, sans-serif'; g.fillText(fmt(dep, dep < 100 ? 1 : 0), ex + 8, top + 34); g.font = '600 13px system-ui, sans-serif'; g.fillText('m', ex + 12 + g.measureText(fmt(dep, dep < 100 ? 1 : 0)).width * 2.3, top + 34);
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
    const R = window.ROD ? window.ROD.state() : null, rodOn = R && R.on, fishing = S.boat.status === 'fishing';
    drawN(SK.hull, BMrel); if (showSkipper && !rodOn && !fishing) drawN(SK.skipper, BMrel); if (showCrew) drawN(SK.crew, BMrel);
    SK.rodT += dt; SK.lines = []; SK.tipW = null;
    const T = SK.rodT, A = SK.anim || (SK.anim = {mode:null, st:'jig', t:0, fish:[], fly:[], th:0, mc:[]});
    const kv = S.target === 'kveite' && S.boat.kgear && !kveiteClosed(S.t / 60), mode = rodOn ? 'game' : !fishing ? null : (!kv && S.equip && S.equip.jukse > 0) ? 'machine' : (S.boat.gear || kv) ? 'juksa' : 'rod';
    if (mode !== A.mode){ A.mode = mode; A.st = 'jig'; A.t = 0; A.fish = []; A.fly = []; A.mc = []; }
    // fish reported by the fishing step; stale ones (3D was off) are dropped
    const Q = window.CATCHQ || (window.CATCHQ = []), nowT = performance.now();
    while (Q.length && (nowT - Q[0].t > 15000 || Q.length > 12)) Q.shift();
    if (!mode || mode === 'game') Q.length = 0;
    const airKg = Q.reduce((a, f) => a + f.kg, 0) + A.fish.reduce((a, f) => a + f.kg, 0) + A.fly.reduce((a, f) => a + f.kg, 0) + A.mc.reduce((a, m) => a + (m.fish || []).reduce((c, f) => c + f.kg, 0), 0);
    // the catch in the tub: one fish per ~5 kg, species in proportion to the hold; fish still in the air are not in it yet
    { const all = S.hold.reduce((a, x) => a + x.kg, 0), tot = Math.max(0, all - airKg), n = Math.min(40, Math.ceil(tot / 5)); if (n > 0){ const cum = []; let acc = 0; for (const sp of SP){ acc += S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0); cum.push([sp, acc / all]); }
      for (let i = 0; i < n; i++){ const r = hash(i * 7 + 3), sp = (cum.find(c => r <= c[1] + 1e-9) || cum[0])[0], lay = Math.floor(i / 8), k = i % 8, x = -0.18 + (k % 2) * 0.36 + (hash(i * 3 + 1) - 0.5) * 0.06, z = 1.84 + Math.floor(k / 2) * 0.11;
        drawN(SK.fishM[sp] || SK.fishM.torsk, chain(BMrel, M4.T(x, 0.25 + lay * 0.05, z), M4.RY(Math.PI / 2 + (k % 2 ? Math.PI : 0) + (hash(i * 5) - 0.5) * 0.4), M4.RZ(Math.PI / 2 * (hash(i * 11) > 0.5 ? 1 : -1)), M4.S(0.42 + hash(i * 13) * 0.12))); } } }
    // luck aboard: a charm swinging from the grab rail
    if (S.haill && haillF() > 0){ const CM = chain(BMrel, M4.T(CHARM_AT[0], CHARM_AT[1], CHARM_AT[2]), M4.RZ(Math.sin(T * 1.3) * 0.18), M4.RX(Math.sin(T * 0.9) * 0.12)); drawN(SK.cstr, CM);
      if (S.haill.type === 'luksus') drawN(SK.shoe, CM); else drawN(SK.fishM[S.haill.type === 'kveit' ? 'kveite' : 'torsk'], chain(CM, M4.T(0, -0.17, 0), M4.RX(Math.PI / 2), M4.S(0.16))); }
    const L2R = q => xf(BMrel, q), fsc = kg => clamp(0.42 * Math.cbrt(kg), 0.28, 1.2);
    const hang = (sp, kg, P, w) => drawN(SK.fishM[sp] || SK.fishM.torsk, chain(BMrel, M4.T(P[0], P[1] - fsc(kg) * 0.45, P[2]), M4.RX(Math.PI / 2), M4.RZ(Math.sin(T * 9 + w) * 0.45), M4.S(fsc(kg))));
    const TUB = [0, 0.62, 1.95];
    // fish swung from the rail into the tub
    for (let i = A.fly.length - 1; i >= 0; i--){ const f = A.fly[i]; f.u += dt / 0.75; if (f.u >= 1){ A.fly.splice(i, 1); continue; }
      const u = f.u; hang(f.sp, f.kg, [f.a[0] + (TUB[0] - f.a[0]) * u, f.a[1] + (TUB[1] - f.a[1]) * u + Math.sin(Math.PI * u) * 0.45, f.a[2] + (TUB[2] - f.a[2]) * u], i); }
    if (mode && mode !== 'game'){
      const FP = chain(M4.T(0.52, 0.2, 0.5), M4.RY(-Math.PI / 2)); drawN(SK.fisher, chain(BMrel, FP));
      const shR = xf(FP, [0.21, 1.3, 0]), shL = xf(FP, [-0.21, 1.3, 0]); let hR, hL;
      A.t += dt;
      if (mode === 'rod'){
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
        const C = [1.0, 1.2, 0.32], RL = [C[0] + 0.14, C[1] - 0.05, C[2]], WX = C[0] + 0.3;
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
        const n = Math.min(3, S.equip.jukse), Z = [-0.3, 1.1, 1.6];
        while (A.mc.length < n) A.mc.push({st:'jig', t:0, fish:[]});
        let busy = null;
        for (let k = 0; k < n; k++){ const m = A.mc[k], P = [0.99, 1.08, Z[k]], tip = [P[0] + 0.8, P[1] + 0.62, P[2]]; m.t += dt;
          drawN(SK.mach, chain(BMrel, M4.T(P[0], P[1], P[2])));
          if (m.st === 'jig' && Q.length && (Q.length >= 2 || nowT - Q[0].t > 2000)){ m.fish = Q.splice(0, 3); m.st = 'haul'; m.t = 0; m.d0 = -1.4 - 0.5 * m.fish.length; }
          if (m.st === 'jig'){ const bob = 0.25 * Math.pow(Math.max(0, Math.sin(T * 2.6 + k * 1.7)), 3); SK.lines.push([L2R(tip), L2R([tip[0], -0.3 - bob, tip[2]])]); }
          else { const end = m.d0 + m.t * 1.3; let low = null;
            for (let i = m.fish.length - 1; i >= 0; i--){ const f = m.fish[i], y = end + i * 0.5;
              if (y >= tip[1] - 0.35){ A.fly.push({...f, a:[tip[0] - 0.2, tip[1] - 0.35, tip[2]], u:0}); m.fish.splice(i, 1); busy = tip; continue; }
              const Pf = [tip[0], y, tip[2]]; if (y > -0.2) hang(f.sp, f.kg, Pf, i + k * 3); low = low || Pf; if (y > tip[1] - 1.0) busy = tip; }
            SK.lines.push([L2R(tip), L2R(low || [tip[0], Math.min(tip[1], end), tip[2]])]);
            if (!m.fish.length && m.t > 0.6){ m.st = 'jig'; m.t = 0; } } }
        hR = busy ? [busy[0] - 0.35, busy[1] - 0.45, busy[2] + 0.08] : [0.95, 1.12, 0.62]; hL = busy ? [busy[0] - 0.4, busy[1] - 0.5, busy[2] - 0.08] : [0.95, 1.12, 0.38];
      }
      // arms: shoulder to hand with the elbow bent down and out
      const arm = (Sw, Hw, sd) => { const d = [Hw[0] - Sw[0], Hw[1] - Sw[1], Hw[2] - Sw[2]], Lh = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = d.map(v => v / Lh), seg = 0.31, Lc = Math.min(Lh, 2 * seg * 0.995);
        let bv = [0, -1, sd * 0.5]; const kk = bv[0] * u[0] + bv[1] * u[1] + bv[2] * u[2]; bv = [bv[0] - kk * u[0], bv[1] - kk * u[1], bv[2] - kk * u[2]]; const bl = Math.hypot(bv[0], bv[1], bv[2]) || 1, h = Math.sqrt(Math.max(0, seg * seg - (Lc / 2) ** 2));
        const Hc = [Sw[0] + u[0] * Lc, Sw[1] + u[1] * Lc, Sw[2] + u[2] * Lc], E = [(Sw[0] + Hc[0]) / 2 + bv[0] / bl * h, (Sw[1] + Hc[1]) / 2 + bv[1] / bl * h, (Sw[2] + Hc[2]) / 2 + bv[2] / bl * h];
        drawN(SK.limb, chain(BMrel, limbM(Sw, E, 0.056))); drawN(SK.limb, chain(BMrel, limbM(E, Hc, 0.048))); drawN(SK.hand, chain(BMrel, M4.T(Hc[0], Hc[1], Hc[2]))); };
      arm(shR, hR, 1); arm(shL, hL, -1);
    }
    if (rodOn){
      SK.rodT += dt; const T = SK.rodT, st = R.st;
      let el = 0.3; if (st === 'jig') el = 0.25 + 0.4 * Math.pow(Math.max(0, Math.sin(T * 2.2)), 2); else if (st === 'bite') el = 0.35 + 0.12 * Math.sin(T * 38); else if (st === 'fight') el = 0.75 + 0.14 * Math.sin(T * (R.hold ? 9 : 3)) * (0.4 + R.tens); else if (st === 'land') el = 1.1; else el = 0.2;
      const AM = chain(BMrel, M4.T(0.5, 0.2, 0.5), M4.RY(-Math.PI / 2)), RM = chain(AM, M4.T(0, 1.18, -0.3), M4.RX(el));
      drawN(SK.angler, AM); drawN(SK.rod, RM);
      const tip = xf(RM, [0, 0, -2.3]); SK.tipW = tip;
      if ((st === 'fight' && R.prog > 0.85) || st === 'land'){
        const q = st === 'land' ? clamp(R.phase / 1.4, 0, 1) : 0, sp = R.fish ? R.fish.sp : 'torsk', sc = R.fish ? clamp(0.42 * Math.cbrt(R.fish.kg), 0.3, 1.1) : 0.6;
        const water = xf(BMrel, [2.1, 0, 0.5]), tub = xf(BMrel, [0, 0.6, 1.95]);
        const px = q < 0.5 ? water[0] + (tip[0] - water[0]) * q * 2 * 0.8 : tip[0] + (tub[0] - tip[0]) * (q - 0.5) * 2, py = q < 0.5 ? water[1] + (tip[1] - 0.6 - water[1]) * q * 2 : tip[1] - 0.6 + (tub[1] - tip[1] + 0.6) * (q - 0.5) * 2, pz = q < 0.5 ? water[2] + (tip[2] - water[2]) * q * 2 * 0.8 : tip[2] + (tub[2] - tip[2]) * (q - 0.5) * 2;
        drawN(SK.fishM[sp] || SK.fishM.torsk, chain(M4.T(px, py, pz), M4.RX(Math.PI / 2 - 0.2), M4.RZ(Math.sin(T * 14) * 0.5), M4.S(sc)));
      }
    }
    drawN(SK.wheel, chain(BMrel, M4.T(...SK.wheelAt), M4.RX(-SK.wheelTilt), M4.RZ(SK.wheelA)));
    drawN(SK.lever, chain(BMrel, M4.T(...SK.leverAt), M4.RX(-(0.1 + frac * 0.9))));
    const MM = chain(BMrel, M4.T(...SK.motorAt), M4.RY(-SK.wheelA * 0.1), M4.RX(on ? 0.05 : 0));
    drawN(SK.motor, MM); drawN(SK.prop, chain(MM, M4.T(0, -1.0, 0.54), M4.RZ(SK.propA)));
    gl.disableVertexAttribArray(2);
    // screens and name boards up close
    const near = Math.hypot(BMrel[12], BMrel[13], BMrel[14]) < 45, now = performance.now();
    paintName();
    for (const q of SK.qName) drawTexQuad(q, SK.tName, BMrel, VP, true, [0, 0.2, 0]);
    if (near){
      if (now - SK.tP > 500){ SK.tP = now; paintPlotter(); if (S.equip.vhf) paintVhf(); }
      if (now - SK.tG > 90){ paintGauges((now - SK.tG) / 1000); SK.tG = now; }
      drawTexQuad(SK.qPlot, SK.tPlot, BMrel, VP, false); drawTexQuad(SK.qGauge, SK.tGauge, BMrel, VP, false); if (S.equip.vhf) drawTexQuad(SK.qVhf, SK.tVhf, BMrel, VP, false);
    }
  }
  function drawSkiffGlass(BMrel, VP){
    if (!SK) return; nSetup(VP); gl.uniform1f(PRGN.u.uAlpha, 0.2);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    drawN(SK.glass, BMrel); gl.disableVertexAttribArray(2);
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
  const WL = [96, 67, 49, 36.5, 27.5, 20.5, 15.3, 11.4, 8.6, 6.4], WOFF = [0, -0.46, 0.53, -0.92, 0.27, 0.84, -0.21, 1.12, -0.68, 0.41], WPH = [0, 2.1, 4.4, 1.3, 5.6, 3.2, 0.7, 4.9, 2.6, 5.9];
  const WV = {sets:[{dir:0, w:1}, {dir:0, w:0}], cur:0, hs:0.3, W:5, init:false, list:[], ua:new Float32Array(40), ub:new Float32Array(40)};
  function updateWaves(dt, H){
    const p = {x:bv.x / 1000, y:bv.z / 1000};
    const hsT = hsAt(p, H), WT = windAt(H), dirT = (windDir(H) + 180) * DEG;
    if (!WV.init){ WV.hs = hsT; WV.W = WT; WV.sets[0].dir = dirT; WV.init = true; }
    const k = 1 - Math.exp(-dt / 1.5); WV.hs = lerp(WV.hs, hsT, k); WV.W = lerp(WV.W, WT, k);
    const set = WV.sets[0]; set.dir += angDiff(set.dir, dirT) * Math.min(1, dt / 12); set.w = 1;
    const Hs = Math.max(0.05, WV.hs), Tp = 3.2 * Math.sqrt(Hs) + 1.5, L0 = 9.81 * Tp * Tp / (2 * Math.PI);
    // a broad spectrum around the peak wavelength; short waves keep a little energy so the surface always has texture
    const w = WL.map(L => Math.exp(-(((Math.log(L) - Math.log(L0)) / 0.75) ** 2)) + 0.06 * Math.min(1, L0 / L)), norm = Math.sqrt(w.reduce((a, c) => a + c * c, 0)) * 2.828;
    const steep = 0.25 + 0.45 * sstep(4, 14, WV.W);
    WV.list = [];
    WL.forEach((L, i) => {
      const kk = 2 * Math.PI / L, a = Hs * w[i] / norm, ang = set.dir + WOFF[i] * (0.75 + 0.25 * sstep(3, 12, WV.W));
      const c = {Dx:Math.sin(ang), Dz:-Math.cos(ang), k:kk, a, Q:Math.min(steep / (kk * Math.max(a, 1e-4) * 10), 1), om:Math.sqrt(9.81 * kk), ph:WPH[i]};
      WV.list.push(c);
      WV.ua[i * 4] = c.Dx; WV.ua[i * 4 + 1] = c.Dz; WV.ua[i * 4 + 2] = c.k; WV.ua[i * 4 + 3] = c.a;
      WV.ub[i * 4] = c.Q; WV.ub[i * 4 + 1] = c.om; WV.ub[i * 4 + 2] = c.ph; WV.ub[i * 4 + 3] = i * 0.37;
    });
    env.windDir = [Math.sin(dirT), -Math.cos(dirT)]; env.wind = WV.W;
  }
  function seaH(x, z, t){ let y = env.tide || 0; for (const c of WV.list) y += c.a * Math.sin(c.k * (c.Dx * x + c.Dz * z) - c.om * t + c.ph); return y; }

  // ---------- environment ----------
  const PAL = [[-18,[0.006,0.012,0.035],[0.02,0.035,0.07]], [-9,[0.02,0.04,0.1],[0.08,0.1,0.18]], [-3,[0.1,0.16,0.33],[0.5,0.4,0.5]], [2,[0.28,0.42,0.7],[0.93,0.68,0.5]], [9,[0.3,0.52,0.8],[0.76,0.83,0.9]], [25,[0.25,0.49,0.82],[0.68,0.8,0.92]]];
  function pal(el){
    if (el <= PAL[0][0]) return [PAL[0][1], PAL[0][2]];
    for (let i = 0; i < PAL.length - 1; i++){ const a = PAL[i], b = PAL[i + 1]; if (el <= b[0]){ const t = (el - a[0]) / (b[0] - a[0]); return [mix3(a[1], b[1], t), mix3(a[2], b[2], t)]; } }
    const L = PAL[PAL.length - 1]; return [L[1], L[2]];
  }
  function computeEnv(H){
    const s = sunAt(H), el = s.el, er = el * DEG; env.el = el;
    env.sunDir = [Math.cos(er) * Math.sin(s.az), Math.sin(er), -Math.cos(er) * Math.cos(s.az)];
    const ly = Math.max(env.sunDir[1], 0.25), ll = Math.hypot(env.sunDir[0], ly, env.sunDir[2]); env.lightDir = [env.sunDir[0] / ll, ly / ll, env.sunDir[2] / ll];
    env.cloud = cloudAt(H); env.precip = precipAt(H); env.temp = airTemp(H); env.vis = visibility(H); env.aur = auroraAt(H);
    let [zen, hor] = pal(el); const lum = 0.3 * hor[0] + 0.59 * hor[1] + 0.11 * hor[2], grey = [lum * 0.92, lum * 0.96, lum * 1.02];
    zen = mix3(zen, grey.map(v => v * 0.9), env.cloud * 0.8); hor = mix3(hor, grey, env.cloud * 0.85);
    env.zen = zen; env.hor = hor; env.day = sstep(-6, 6, el);
    const sc = mix3([1, 0.95, 0.88], [1, 0.58, 0.32], sstep(14, 1, el)), si = sstep(-1.5, 5, el) * (1 - 0.72 * env.cloud) * 1.1;
    env.sunCol = sc.map(v => v * si);
    env.amb = [zen[0] * 0.55 + hor[0] * 0.25 + 0.075, zen[1] * 0.55 + hor[1] * 0.25 + 0.095 + env.aur * 0.07, zen[2] * 0.55 + hor[2] * 0.25 + 0.14 + env.aur * 0.03];
    env.gnd = env.amb.map(v => v * 0.6);
    env.fog = hor; env.fogD = 1.73 / (env.vis * 1000);
    env.stars = sstep(-5, -12, el) * (1 - env.cloud); env.spec = sstep(-1, 4, el) * (1 - env.cloud) * 2.2;
    env.night = sstep(3, -5, el);
    // moon: where it is, how full, and the light it gives at night
    const mo = moonAt(H), mr = mo.el * DEG; env.moon = mo; env.moonDir = [Math.cos(mr) * Math.sin(mo.az), Math.sin(mr), -Math.cos(mr) * Math.cos(mo.az)];
    env.moonA = sstep(-1, 2, mo.el) * (1 - 0.6 * env.day);
    const mlight = sstep(0, 8, mo.el) * mo.illum * sstep(-2, -8, el) * (1 - 0.8 * env.cloud);
    if (mlight > 0.02){ const ml = [0.62, 0.7, 0.9].map(v => v * mlight * 0.32); env.sunCol = env.sunCol.map((v, k) => v + ml[k]); env.amb = env.amb.map((v, k) => v + [0.02, 0.025, 0.04][k] * mlight); const my = Math.max(env.moonDir[1], 0.25), mll = Math.hypot(env.moonDir[0], my, env.moonDir[2]); env.lightDir = [env.moonDir[0] / mll, my / mll, env.moonDir[2] / mll]; }
    env.shadowDir = el > -1 ? env.sunDir : mlight > 0.02 ? env.moonDir : null;
    env.tide = tideH(H);
    const sn = Math.round(seasonal(SNOWLINE, H) / 20) * 20; if (sn !== snowNow){ snowNow = sn; recolor(TERR, sn); if (NEARM) recolor(NEARM, sn); }
  }


  // ---------- mooring: in along the quay, then the lines: aft spring first, bow line, stern line, fore spring (and in reverse when casting off) ----------
  const MO = {key:'', phase:'', t:0, from:null, dur:0, lines:0, len:[0, 0, 0, 0], init:false};
  const LINE_S = 1.8;   // seconds for each line to go on
  let ROPEM = null, FENDM = null;
  function buildMooring(){ const r = NB(); r.tube([[0, 0, 0], [0, 0, 1]], 1, [0.2, 0.36, 0.72, 0.15], 6); ROPEM = r.mesh(); const f = NB(); f.tube([[0, -0.26, 0], [0, 0.26, 0]], 0.12, [0.93, 0.93, 0.9, 0.35], 10); FENDM = f.mesh(); }
  function berthNow(){ const b = S.boat; return (b.status === 'port' || b.status === 'unmooring') && b.port ? berthPose(b.port, vtype()) : null; }
  function moorStep(dt, bp){
    const b = S.boat, key = S.cur + '|' + b.port + '|' + vtype() + '|' + (b.moorT || 0), sp = Math.max(1, S.mult || 1), X = bp.x * 1000, Z = bp.y * 1000;
    if (MO.key !== key){
      const d = Math.hypot(bv.px - X, bv.pz - Z); MO.key = key; MO.len = [0, 0, 0, 0];
      if (d < 3 || b.status === 'unmooring' || !MO.init){ MO.phase = 'moored'; MO.lines = 4; }
      else { MO.phase = 'in'; MO.t = 0; MO.from = {x:bv.px, z:bv.pz, h:bv.cog}; MO.dur = clamp(d / 1.3, 8, 40); MO.lines = 0; }
      MO.init = true;
    }
    if (b.status === 'unmooring'){ MO.phase = 'out'; MO.lines = clamp(4 * (b.castUntil - S.t - currentFrac()) / CAST_MIN, 0, 4); }
    if (MO.phase === 'in'){
      MO.t += dt * sp; const u0 = clamp(MO.t / MO.dur, 0, 1), u = u0 * u0 * (3 - 2 * u0), F = MO.from, k = Math.hypot(X - F.x, Z - F.z) * 1.1;
      const P0 = [F.x, F.z], T0 = [Math.sin(F.h) * k, -Math.cos(F.h) * k], P1 = [X, Z], T1 = [bp.fwd.x * k, bp.fwd.z * k];
      const h00 = 2 * u ** 3 - 3 * u * u + 1, h10 = u ** 3 - 2 * u * u + u, h01 = -2 * u ** 3 + 3 * u * u, h11 = u ** 3 - u * u;
      const d00 = 6 * u * u - 6 * u, d10 = 3 * u * u - 4 * u + 1, d01 = -6 * u * u + 6 * u, d11 = 3 * u * u - 2 * u;
      const px = h00 * P0[0] + h10 * T0[0] + h01 * P1[0] + h11 * T1[0], pz = h00 * P0[1] + h10 * T0[1] + h01 * P1[1] + h11 * T1[1];
      const vx = d00 * P0[0] + d10 * T0[0] + d01 * P1[0] + d11 * T1[0], vz = d00 * P0[1] + d10 * T0[1] + d01 * P1[1] + d11 * T1[1];
      const du = 6 * u0 * (1 - u0) / MO.dur * sp; bv.spd = Math.hypot(vx, vz) * du; bv.yr = 0;
      bv.px = px; bv.pz = pz; if (Math.hypot(vx, vz) > 1e-3) bv.cog = Math.atan2(vx, -vz);
      if (u0 >= 1){ MO.phase = 'lines'; MO.t = 0; bv.cog = bp.hd; }
    } else {
      if (MO.phase === 'lines'){ MO.t += dt * sp; MO.lines = Math.min(4, MO.t / LINE_S); if (MO.lines >= 4) MO.phase = 'moored'; }
      // lying alongside: held in place by the lines, the swell moves her a little
      bv.spd = 0; bv.yr = 0; bv.px += (X - bv.px) * (1 - Math.exp(-dt * 2)); bv.pz += (Z - bv.pz) * (1 - Math.exp(-dt * 2)); bv.cog += angDiff(bv.cog, bp.hd) * (1 - Math.exp(-dt * 2));
    }
  }
  // the lines from the boat's cleats to the bollards on the quay, sagging when slack; the tide makes them slack or tight
  function drawMooring(BMrel, eye, VP, t){
    const bp = berthNow(); if (!bp || !ROPEM) return;
    const vt = vtype(), G = VGEO[vt] || VGEO.skiff, gw = G.gw || 1, sx = (BEAM[vt] || 2.4) / 2, mid = (G.bow + G.stern) / 2;
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
  function currentFrac(){ return clamp(acc + (Date.now() - lastWall) / 1000 * GAME_RATE * S.mult / 60, 0, 0.999); }
  function predict(frac){
    const L = livePose(frac), b = S.boat; let hd = L.hd;
    if (b.status === 'port' || b.status === 'unmooring'){ const bp = berthNow(); if (bp) return {p:{x:bp.x, y:bp.y}, hd:bp.hd}; const pt = portById(b.port); hd = Math.atan2(pt.coast.x - pt.p.x, -(pt.coast.y - pt.p.y)); }
    return {p:L.p, hd};
  }
  // the boat in 3D follows the simulated track like a real boat: it speeds up and slows down gradually, turns on an arc,
  // pivots about a point a third of its length from the bow (so the stern swings out), skids a little in turns and banks
  const TURN_R = {skiff:35, snekke:45, sjark:70, sjarkny:80};
  const KNV = () => 1852 / 3600 * GAME_RATE * (S.mult || 1);      // on-screen metres per real second per knot
  function updateBoat(dt, t, frac){
    const b = S.boat, pr = predict(frac), tx = pr.p.x * 1000, tz = pr.p.y * 1000, sailing = b.status === 'sailing' && S.plan, G = VGEO[vtype()] || VGEO.skiff;
    const zp = (G.bow || -2.2) + ((G.stern || 3.1) - (G.bow || -2.2)) / 3;   // pivot point, local z (negative = forward)
    if (!bv.init || Math.hypot(tx - (bv.px || 0), tz - (bv.pz || 0)) > 900){ bv.px = tx; bv.pz = tz; bv.cog = pr.hd; bv.head = pr.hd; bv.spd = sailing ? b.v * KNV() : 0; bv.yr = 0; bv.beta = 0; bv.init = true; TRAIL.length = 0; WV.init = false; }
    else if (dt > 0){
      const bp = berthNow();
      if (bp) moorStep(dt, bp);
      else if (sailing){
        const vs = sailV(S.t / 60) * KNV(), la = livePose(frac + clamp(1.6 * GAME_RATE * (S.mult || 1) / 60, 0.04, 0.6)).p, cx = la.x * 1000, cz = la.y * 1000;
        // steer for a point a little ahead on the track, turning no faster than the turning radius allows
        const want = Math.hypot(cx - bv.px, cz - bv.pz) > 1 ? Math.atan2(cx - bv.px, -(cz - bv.pz)) : pr.hd;
        const wmax = clamp(bv.spd / (TURN_R[vtype()] || 40), 0.6, 1.4), err = angDiff(bv.cog, want), rDes = clamp(err * 2.2, -wmax, wmax);
        bv.yr += (rDes - bv.yr) * (1 - Math.exp(-dt * 3)); bv.cog += bv.yr * dt;
        // speed: keep up with the simulated position, with limits on acceleration and braking
        const fx = Math.sin(bv.cog), fz = -Math.cos(bv.cog), rx = Math.cos(bv.cog), rz = Math.sin(bv.cog), ex = tx - bv.px, ez = tz - bv.pz;
        // always keep some way on while turning (like a boat swinging out from the quay), and catch up without racing
        const vDes = clamp(vs + (ex * fx + ez * fz) * 0.5, vs * (0.25 + 0.3 * Math.max(0, Math.cos(err))), vs * 1.25 + 3), aMax = Math.max(3, vs / 4);
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
    const pl = G.pl, rl = G.rl;
    const hb = seaH(bv.x + fx * pl, bv.z + fz * pl, t), hs = seaH(bv.x - fx * pl, bv.z - fz * pl, t), hp = seaH(bv.x - rx * rl, bv.z - rz * rl, t), hst = seaH(bv.x + rx * rl, bv.z + rz * rl, t);
    const v = b.status === 'sailing' ? bv.spd / KNV() : 0;
    const trim = 0.07 * sstep(9, 17, v) - 0.02 * sstep(3, 9, v) * (1 - sstep(9, 13, v));
    // planing hulls bank into a turn, displacement hulls heel a little outwards
    const bank = (BOAT.planing ? -0.18 : 0.06) * clamp(bv.yr, -1.2, 1.2) * sstep(4, 18, v);
    const tp = Math.atan2(hb - hs, pl * 2) + trim, tr = Math.atan2(hst - hp, rl * 2) + bank, ty = (hb + hs + hp + hst) / 4 + 0.06;
    const k = 1 - Math.exp(-dt * 7);
    bv.pitch = lerp(bv.pitch, tp, k); bv.roll = lerp(bv.roll, tr, k); bv.y = lerp(bv.y, ty, k);
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
    gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uEmis, 0); gl.uniform4fv(u.uOver, [0, 0, 0, 0]);
  }
  const NOHOLE = new Float32Array([1e9, 1e9, -1e9, -1e9]);
  function drawLit(m, M, hole){
    gl.uniformMatrix4fv(PL.u.uM, false, M); gl.uniform4fv(PL.u.uHole, hole || NOHOLE); attr(0, m.pb, 3); attr(1, m.cb, 3);
    if (m.ib){ gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0); } else gl.drawArrays(gl.TRIANGLES, 0, m.n);
  }
  function drawTerrain(TM, eye, VP, near){
    gl.useProgram(PT.p); const u = PT.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uGnd, env.gnd); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uSand, snowNow < 5 ? [0.84, 0.86, 0.88] : [0.74, 0.71, 0.6]); gl.uniformMatrix4fv(u.uM, false, TM);
    const one = (m, hole, ground) => {
      gl.uniform4fv(u.uHole, hole || NOHOLE); gl.uniform1f(u.uGOn, ground && GTEX ? 1 : 0); gl.uniform1f(u.uLOn, ground && LMTEX ? 1 : 0);
      if (ground && LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE0); }
      if (GRECT) gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]);
      if (ground && GTEX){ gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX); gl.uniform1i(u.uGround, 0); gl.uniform4fv(u.uGRect, [GRECT[0] - eye[0], GRECT[1] - eye[2], GRECT[2], GRECT[3]]); }
      attr(0, m.pb, 3); attr(1, m.cb, 3); attr(2, m.nb, 3); attr(3, m.sb, 1); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
    };
    const holeOf = (M, g) => new Float32Array([M.x0 + g - eye[0], M.z0 + g - eye[2], M.x0 + M.sx - g - eye[0], M.z0 + M.sz - g - eye[2]]);
    if (!NEARM) one(TERR);
    else if (near) one(NEARM, null, true);
    else if (!MIDM) one(TERR, holeOf(NEARM, 45));
    else { one(TERR, holeOf(MIDM, 180)); one(MIDM, holeOf(NEARM, 45)); }
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); litSetup(VP);
  }
  // ground layer under the corridor: roads and forest, drawn on a canvas and draped on the terrain
  function buildGround(){
    if (!NEARM) return;
    const size = 2048, x0 = NEARM.x0, z0 = NEARM.z0, sx = NEARM.sx, k = size / sx;
    gcv = gcv || document.createElement('canvas'); gcv.width = gcv.height = size; const g = gcv.getContext('2d'); g.clearRect(0, 0, size, size);
    const snowy = snowNow < 60, c0 = Math.floor(x0 / 50), c1 = Math.ceil((x0 + sx) / 50), r0 = Math.floor(z0 / 50), r1 = Math.ceil((z0 + sx) / 50);
    if (false){
      const W = [7.5, 6.5, 5.5, 5, 3.6]; g.lineCap = g.lineJoin = 'round';
      const inRect = r => !(r.bb[2] < x0 || r.bb[0] > x0 + sx || r.bb[3] < z0 || r.bb[1] > z0 + sx);
      for (const pass of [0, 1]){
        g.strokeStyle = pass ? (snowy ? 'rgba(128,134,140,0.95)' : 'rgba(120,126,130,0.96)') : (snowy ? 'rgba(88,94,100,0.8)' : 'rgba(64,70,72,0.85)');
        for (const r of ROADS){ if (!inRect(r)) continue; g.lineWidth = (W[r.c] + (pass ? 0 : 2.4)) * k; g.beginPath(); g.moveTo((r.xs[0] - x0) * k, (r.zs[0] - z0) * k); for (let j = 1; j < r.xs.length; j++) g.lineTo((r.xs[j] - x0) * k, (r.zs[j] - z0) * k); g.stroke(); }
      }
    }
    GTEX = GTEX || gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, GTEX);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gcv); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    GRECT = [x0, z0, 1 / sx, 1 / sx];
    // shore layer for the water: R = land cover (surf band), G = how shallow
    const S2 = 256, dat = new Uint8Array(S2 * S2 * 4), st = sx / S2;
    for (let j = 0; j < S2; j++) for (let i = 0; i < S2; i++){ const x = x0 + (i + 0.5) * st, z = z0 + (j + 0.5) * st, m = gridAt(MASK, x, z, GRID), o = (j * S2 + i) * 4, dd = m > 0.5 ? 0 : depthF({x:x / 1000, y:z / 1000}); dat[o] = Math.round(m * 255); dat[o + 1] = Math.round(clamp(1 - dd / 14, 0, 1) * 255); dat[o + 3] = 255; }
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
    // shelf: mesh points within ~45 m of the fine coast are lifted just above the water; the shader then cuts the exact outline
    const S = 512, f = size / S, im = g.getImageData(0, 0, size, size).data, cm = new Uint8Array(S * S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++){ let v = 0; for (let b = 0; b < f && !v; b++) for (let a = 0; a < f; a++) if (im[((j * f + b) * size + i * f + a) * 4] > 127){ v = 1; break; } cm[j * S + i] = v; }
    const R = Math.ceil(45 / (sx / S)), tmp = new Uint8Array(S * S), dil = new Uint8Array(S * S);
    for (let j = 0; j < S; j++){ let run = -1e9; for (let i = 0; i < S; i++){ if (cm[j * S + i]) run = i; tmp[j * S + i] = i - run <= R ? 1 : 0; } run = 1e9; for (let i = S - 1; i >= 0; i--){ if (cm[j * S + i]) run = i; if (run - i <= R) tmp[j * S + i] = 1; } }
    for (let i = 0; i < S; i++){ let run = -1e9; for (let j = 0; j < S; j++){ if (tmp[j * S + i]) run = j; dil[j * S + i] = j - run <= R ? 1 : 0; } run = 1e9; for (let j = S - 1; j >= 0; j--){ if (tmp[j * S + i]) run = j; if (run - j <= R) dil[j * S + i] = 1; } }
    const M = NEARM, n = M.gn, dxm = M.sx / (n - 1); let changed = 0;
    for (let jj = 0; jj < n; jj++) for (let ii = 0; ii < n; ii++){
      const kk = jj * n + ii; if (true) continue;
      const si = Math.min(S - 1, Math.floor(ii * dxm / sx * S)), sj = Math.min(S - 1, Math.floor(jj * dxm / sx * S));
      if (!dil[sj * S + si]) continue;
      M.h[kk] = 0.12; M.pos[kk * 3 + 1] = 0.12; M.nor[kk * 3] = 0; M.nor[kk * 3 + 1] = 1; M.nor[kk * 3 + 2] = 0; changed++;
    }
    if (false){ gl.bindBuffer(gl.ARRAY_BUFFER, M.pb); gl.bufferData(gl.ARRAY_BUFFER, M.pos, gl.STATIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, M.nb); gl.bufferData(gl.ARRAY_BUFFER, M.nor, gl.STATIC_DRAW); recolor(M, snowNow < 0 ? 0 : snowNow); }
  }
  function drawSea(VP, eye, t, far, drop){
    gl.useProgram(PS.p); const u = PS.u;
    gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform1f(u.uTime, t); gl.uniform1f(u.uHalf, HALF); gl.uniform1f(u.uFlat, far ? 1 : 0);
    gl.uniform1f(u.uCell, 2 * HALF / NP); gl.uniform1f(u.uPx, 2 * Math.tan(curFov / 2) / Math.max(canvas.height, 1));
    gl.uniform4fv(u.uWa, WV.ua); gl.uniform4fv(u.uWb, WV.ub);
    gl.uniform3fv(u.uSun, env.lightDir); gl.uniform3fv(u.uSunCol, env.sunCol); gl.uniform3fv(u.uAmb, env.amb); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uDeep, [0.035, 0.14, 0.18]); gl.uniform1f(u.uWind, env.wind); gl.uniform2fv(u.uWindDir, env.windDir); gl.uniform1f(u.uSpec, env.spec);
    gl.uniform1f(u.uSOn, STEX ? 1 : 0); gl.uniform1f(u.uHOn, HTEX ? 1 : 0); gl.uniform1f(u.uTideL, env.tide || 0); gl.uniform1f(u.uHs, WV.hs || 0); if (HTEX){ gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, HTEX); gl.uniform1i(u.uHgt, 3); gl.activeTexture(gl.TEXTURE0); } if (STEX){ gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, STEX); gl.uniform1i(u.uShore, 1); if (LMTEX){ gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, LMTEX); gl.uniform1i(u.uLand, 2); gl.activeTexture(gl.TEXTURE1); } gl.uniform4fv(u.uSRect, [SRECT[0] - eye[0], SRECT[1] - eye[2], SRECT[2], SRECT[3]]); gl.activeTexture(gl.TEXTURE0); }
    gl.disableVertexAttribArray(1);
    if (far){
      // flat sea on a subdivided grid: whole map for the far pass, or around the camera (lowered) to hide the sea floor in the near pass
      let ox, oz, sc;
      if (drop === undefined){ ox = MAP_W * 500; oz = MAP_H * 500; sc = Math.max(MAP_W, MAP_H) * 500 + 40000; }
      else if (NEARM){ ox = NEARM.x0 + NEARM.sx / 2; oz = NEARM.z0 + NEARM.sz / 2; sc = NEARM.sx / 2 + 20; }
      else { ox = Math.round(eye[0] / 100) * 100; oz = Math.round(eye[2] / 100) * 100; sc = far * 1.15; }
      if (drop === undefined) gl.uniform4fv(u.uPHole, NOHOLE);
      else { const st = 2 * HALF / NP, px = Math.round(bv.x / st) * st, pz = Math.round(bv.z / st) * st, hh = HALF * 0.97; gl.uniform4fv(u.uPHole, [px - hh - eye[0], pz - hh - eye[2], px + hh - eye[0], pz + hh - eye[2]]); }
      gl.uniform1f(u.uScale, sc); gl.uniform2fv(u.uOrigin, [ox, oz]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], -eye[1] - (drop || 0) + (env.tide || 0), oz - eye[2]]);
      attr(0, FARQ.pb, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FARQ.ib); gl.drawElements(gl.TRIANGLES, FARQ.n, gl.UNSIGNED_SHORT, 0);
    } else {
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step;
      gl.uniform1f(u.uScale, 1); gl.uniform2fv(u.uOrigin, [ox, oz]); gl.uniform3fv(u.uOriginRel, [ox - eye[0], -eye[1] + (env.tide || 0), oz - eye[2]]);
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
      WKB = {p:new Float32Array(9000 * 3), w:new Float32Array(9000 * 4), s:new Float32Array(9000), pb:buf(new Float32Array(9000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), wb:buf(new Float32Array(9000 * 4), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW), sb:buf(new Float32Array(9000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW)}; PS = program(SEA_VS, SEA_FS, ['aXZ']); PK = program(SKY_VS, SKY_FS, ['aP']); PP = program(PT_VS, PT_FS, ['aPos', 'aA']);
      DYNP = buf(new Float32Array(4000 * 3), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW); DYNA = buf(new Float32Array(4000), gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      try { HG = await loadHeights(); } catch (e){ console.error(e); HG = null; }
      try { BLD = await loadBuildings(); } catch (e){ console.error(e); BLD = null; }
      buildTerrain(); buildStatics(); buildBoat(); buildSkiff(); buildFlag(); buildSea(); buildWild(); buildNPC(); buildVessels(); buildHarbourFittings(); buildMooring(); buildPlants(); buildPlantParts();
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; failed = true; show(false); });
      buildLabels();
      ready = true; return true;
    } catch (e){ console.error(e); failed = true; return false; }
  }
  let labelEls = [];
  function buildLabels(){ labelsEl.innerHTML = ''; labelEls = PORTS.map(p => { const d = document.createElement('div'); d.className = 'lbl3d'; d.textContent = p.name; labelsEl.appendChild(d); return d; }); }
  function resize(){
    const r = wrap.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    const prof = s => Math.sin(Math.min(1, s * 1.15) * Math.PI) ** 0.6 * (s > 0.85 ? 1 - (s - 0.85) * 4 : 1) + 0.05;
    m = MB(); bodyLoft(m, 1.7, 0.28, prof, [0.2, 0.22, 0.25], [0.55, 0.57, 0.6]); m.tri([0, 0.2, -0.02], [0, 0.45, 0.14], [0, 0.2, 0.28], [0.18, 0.2, 0.22]); W.porpoise = m.mesh();
    m = MB(); bodyLoft(m, 7, 0.95, prof, [0.05, 0.05, 0.06], [0.92, 0.92, 0.9]); m.tri([0, 0.75, -0.5], [0, 2.4, 0.35], [0, 0.75, 0.6], [0.05, 0.05, 0.06]); m.box(0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); m.box(-0.55, 0.35, -2.4, 0.08, 0.35, 0.7, [0.95, 0.95, 0.93], 0); W.orca = m.mesh();
    m = MB(); bodyLoft(m, 13, 1.6, prof, [0.13, 0.14, 0.16], [0.4, 0.42, 0.45]); m.tri([0, 1.3, 1.6], [0, 1.75, 2.3], [0, 1.3, 2.7], [0.13, 0.14, 0.16]); W.humpback = m.mesh();
    m = MB(); const d = [0.13, 0.14, 0.16], wht = [0.85, 0.85, 0.83];
    m.tri([0, 0, 0], [-2.3, 0, 1.1], [-0.4, 0, 1.3], wht); m.tri([0, 0, 0], [2.3, 0, 1.1], [0.4, 0, 1.3], wht); m.tri([0, 0.02, 0], [-0.4, 0.02, 1.3], [0.4, 0.02, 1.3], d); m.box(0, -0.3, -1.4, 0.5, 0.6, 2.6, d, 0); W.fluke = m.mesh();
    WILDM = W;
  }
  const GULLS = Array.from({length:6}, (_, i) => ({ph:i * 1.13, r:9 + i * 3.2, w:0.32 + (i % 3) * 0.1, h:6 + (i * 2.3) % 8, dir:i % 2 ? 1 : -1}));
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
      const st = S.boat.status, n = st === 'port' ? 3 : st === 'fishing' ? 6 : 4, fx = Math.sin(bv.head), fz = -Math.cos(bv.head);
      for (let i = 0; i < n; i++){
        const g = GULLS[i], ang = t * g.w * g.dir + g.ph, cx = bv.x - fx * 8, cz = bv.z - fz * 8;
        const x = cx + Math.cos(ang) * g.r, z = cz + Math.sin(ang) * g.r, y = bv.y + (st === 'fishing' ? 2.5 + g.h * 0.4 : g.h) + Math.sin(t * 0.7 + g.ph) * 1.2;
        const vx = -Math.sin(ang) * g.dir, vz = Math.cos(ang) * g.dir, hd = Math.atan2(vx, -vz);
        const flap = Math.sin(t * 0.5 + g.ph * 3) > 0.35 ? Math.sin(t * 9 + g.ph) * 0.6 : 0.1 + Math.sin(t * 1.3 + g.ph) * 0.05;
        const Mb = model(x - eye[0], y - eye[1], z - eye[2], -hd, 0, -g.dir * 0.35);
        drawLit(WILDM.gull, Mb); drawLit(WILDM.wingR, mul(Mb, model(0, 0, 0, 0, 0, flap))); drawLit(WILDM.wingL, mul(Mb, model(0, 0, 0, 0, 0, -flap)));
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
    NPCM = N;
  }
  const NLC = {w:[1, 0.95, 0.85], r:[1, 0.12, 0.1], g:[0.1, 1, 0.35]};
  function person(m, x, y, z, suit, ry){ m.box(x, y, z, 0.44, 1.05, 0.32, suit, ry || 0); m.box(x, y + 1.05, z, 0.24, 0.26, 0.24, [0.85, 0.65, 0.5], ry || 0); m.box(x, y + 1.31, z, 0.27, 0.08, 0.27, [0.12, 0.16, 0.3], ry || 0); }
  function buildPlayerVessel(type, o){
    const m = MB(), F = o.F, L = o.L, B = o.B, wz = o.wz, ww = o.ww, wl = o.wl, wh = 2.0, WH = [0.93, 0.94, 0.93];
    shipHull(m, L, B, o.D, F, o.hull, [0.5, 0.12, 0.1], [0.62, 0.6, 0.55]);
    m.box(-B / 2 + 0.05, F, 0, 0.1, 0.35, L * 0.8, o.hull, 0); m.box(B / 2 - 0.05, F, 0, 0.1, 0.35, L * 0.8, o.hull, 0);
    // wheelhouse: low walls, corner posts and roof, open windows so you can see out from the helm
    const x0 = -ww / 2, x1 = ww / 2, z0 = wz - wl / 2, z1 = wz + wl / 2, y0 = F;
    m.box(0, y0, z0, ww, 1.0, 0.08, WH, 0); m.box(0, y0, z1, ww, wh, 0.08, WH, 0); m.box(x0, y0, wz, 0.08, 1.0, wl, WH, 0); m.box(x1, y0, wz, 0.08, 1.0, wl, WH, 0);
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) m.box(px, y0, pz, 0.12, wh, 0.12, WH, 0);
    m.box(0, y0 + wh, wz, ww + 0.25, 0.14, wl + 0.3, [0.35, 0.37, 0.4], 0, [0.3, 0.32, 0.35]);
    m.box(0, y0, z0 + 0.35, ww * 0.7, 0.95, 0.4, [0.3, 0.32, 0.34], 0);
    m.box(0, y0 + wh + 0.14, z0 + 0.2, 0.1, 1.6, 0.1, [0.3, 0.3, 0.3], 0);
    if (o.bin) m.box(0, F, -L * 0.22, B * 0.45, 0.4, L * 0.22, [0.35, 0.37, 0.4], 0);
    const sk = MB(); person(sk, 0, y0, z0 + 0.95, [0.93, 0.4, 0.1]);
    const crew = [0, 1, 2].map(i => { const c = MB(); person(c, (i % 2 ? 1 : -1) * B * 0.28, F, z1 + 0.9 + i * 1.1, [0.95, 0.75, 0.15], i % 2 ? -1.2 : 1.2); return c.mesh(); });
    PV[type] = {hull:m.mesh(), skipper:sk.mesh(), crew};
    VGEO[type] = {gw:F, deck:{y:F, z:(z1 + L / 2) / 2}, pl:L * 0.4, rl:B * 0.38, eye:[0, y0 + 1.62, z0 + 1.1], pole:[-B * 0.3, F + 2.2, L / 2 - 0.35], stern:L / 2 + 0.2, bow:-L * 0.35, side:B * 0.45,
      lights:[[[-ww / 2 - 0.05, y0 + wh - 0.1, z0], [1, 0.12, 0.1]], [[ww / 2 + 0.05, y0 + wh - 0.1, z0], [0.1, 1, 0.35]], [[0, y0 + wh + 1.7, z0 + 0.2], [1, 0.95, 0.85]], [[0, F + 0.6, L / 2], [1, 0.95, 0.85]]]};
  }
  function buildVessels(){
    buildPlayerVessel('snekke', {L:7.9, B:2.7, D:0.9, F:0.9, wz:1.6, ww:1.7, wl:1.7, hull:[0.86, 0.84, 0.76], bin:true});
    buildPlayerVessel('sjark', {L:10.4, B:3.8, D:1.1, F:1.2, wz:1.3, ww:2.4, wl:2.8, hull:[0.9, 0.92, 0.94], bin:true});
    buildPlayerVessel('sjarkny', {L:11, B:4.3, D:1.0, F:1.4, wz:0.4, ww:3.1, wl:3.8, hull:[0.1, 0.22, 0.4], bin:false});
  }
  let npcNow = [];
  function drawNPC(eye, t, H){
    if (!NPCM) return;
    npcNow = npcStates(H).filter(n => Math.hypot(n.p.x * 1000 - eye[0], n.p.y * 1000 - eye[2]) < 16000);
    for (const n of npcNow){
      const x = n.p.x * 1000, z = n.p.y * 1000, big = n.type === 'coastal' || n.type === 'ferry', y = big ? (env.tide || 0) : (env.tide || 0) + (seaH(x, z, t) - (env.tide || 0)) * 0.8, roll = big ? Math.sin(t * 0.4 + x) * 0.01 : Math.sin(t * 1.1 + x) * 0.05 * (0.3 + WV.hs);
      n.M = model(x - eye[0], y - eye[1], z - eye[2], -n.hd, big ? 0 : Math.sin(t * 0.9 + z) * 0.03, roll);
      drawLit(NPCM[n.type], n.M);
    }
  }
  function drawNPCLights(VP){
    if (env.night < 0.05 || !npcNow.length) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
    for (const n of npcNow){ for (const [lx, ly, lz, c] of NPCM.lights[n.type]){ const q = xf(n.M, [lx, ly, lz]); PB[0] = q[0]; PB[1] = q[1]; PB[2] = q[2]; PA[0] = env.night; drawPts(1, gl.POINTS, VP, NLC[c], n.type === 'sjark' ? 260 : 900, true); } }
    const cs = npcNow.find(n => n.type === 'coastal');
    if (cs){ let k = 0; for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) for (const sx of [-1, 1]){ if (hash(r * 97 + i * 13 + (sx > 0 ? 5 : 0)) < 0.35) continue; const q = xf(cs.M, [sx * 8.95, 8.5 + r * 3.2, -24 + i * 3.4]); PB[k * 3] = q[0]; PB[k * 3 + 1] = q[1]; PB[k * 3 + 2] = q[2]; PA[k] = env.night * 0.9; k++; } drawPts(k, gl.POINTS, VP, [1, 0.8, 0.5], 420, true); }
    gl.depthMask(true); gl.disable(gl.BLEND);
  }

  // ---------- frame ----------
  function frame(){
    if (!active){ raf = 0; return; }
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    resize();
    const now = performance.now(), dt = Math.min(0.1, (now - lastF) / 1000); lastF = now;
    const t = (now - T0) / 1000, frac = currentFrac(), H = (S.t + frac) / 60;
    computeEnv(H); updateBoat(dt, t, frac); updateWaves(dt, H); updateNear(); updateShadows(); updateChunks(CH.size ? 2 : 999);
    // camera
    let eye, V;
    if (cam.helm){
      // at the wheel: eye above the helmsman, moving with the boat (damped a little)
      const Mh = model(bv.x, bv.y, bv.z, -bv.head, bv.pitch * 0.7, bv.roll * 0.7);
      eye = xf(Mh, (VGEO[vtype()] || VGEO.skiff).eye);
      const cy = Math.cos(cam.hp), dl = [-Math.sin(cam.hy) * cy, Math.sin(cam.hp), -Math.cos(cam.hy) * cy];
      const f = [Mh[0] * dl[0] + Mh[4] * dl[1] + Mh[8] * dl[2], Mh[1] * dl[0] + Mh[5] * dl[1] + Mh[9] * dl[2], Mh[2] * dl[0] + Mh[6] * dl[1] + Mh[10] * dl[2]];
      V = viewDir(f, [Mh[4], Mh[5], Mh[6]]);
    } else {
      const yawW = bv.head + cam.yaw, cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch), tgt = [bv.x, bv.y + 1.3, bv.z];
      eye = [bv.x - Math.sin(yawW) * cam.dist * cp, bv.y + 1.3 + cam.dist * sp, bv.z + Math.cos(yawW) * cam.dist * cp];
      const ground = Math.max(terrH(eye[0], eye[2]), seaH(eye[0], eye[2], t)) + 2; if (eye[1] < ground) eye[1] = ground;
      V = viewDir([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]);
    }
    const W = canvas.width, Hh = canvas.height, asp = W / Hh, fov = (cam.helm ? cam.fov : 55) * DEG; curFov = fov;
    let cornerD = 0; if (NEARM) for (const [qx, qz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) cornerD = Math.max(cornerD, Math.hypot(NEARM.x0 + qx * NEARM.sx - eye[0], NEARM.z0 + qz * NEARM.sz - eye[2], eye[1]));
    const nearFar = Math.max(3000, cam.dist * 3, cornerD + 300); lightNF = nearFar; const VPf = mul(persp(fov, asp, 25, 170000), V.m), VPn = mul(persp(fov, asp, 0.25, nearFar), V.m);
    const TM = model(-eye[0], -eye[1], -eye[2], 0, 0, 0);
    const BMrel = model(bv.x - eye[0], bv.y - eye[1], bv.z - eye[2], -bv.head, bv.pitch, bv.roll);
    const BMabs = model(bv.x, bv.y, bv.z, -bv.head, bv.pitch, bv.roll);
    // apparent wind for the flag
    const wdir = (windDir(H) + 180) * DEG, wv = env.wind || windAt(H), bms = bv.v * 0.514 * 2;
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
    drawTerrain(TM, eye, VPf, false); drawLit(STAT, TM); drawBuildings(TM); if (NPCM) for (const n of npcStates(H)){ const x = n.p.x * 1000, z = n.p.y * 1000; if (Math.hypot(x - eye[0], z - eye[2]) < 30000) drawLit(NPCM[n.type], model(x - eye[0], (env.tide || 0) - eye[1], z - eye[2], -n.hd, 0, 0)); }
    drawSea(VPf, eye, t, 1);
    drawSeaLights(VPf, eye, t, false);
    if (env.night > 0.02){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false);
      if (BLD) drawChunkLights(VPf, eye);
      else if (LIGHTS.length){ const n = Math.min(LIGHTS.length / 3, 4000); for (let i = 0; i < n; i++){ PB[i * 3] = LIGHTS[i * 3]; PB[i * 3 + 1] = LIGHTS[i * 3 + 1]; PB[i * 3 + 2] = LIGHTS[i * 3 + 2]; PA[i] = env.night * 0.9; } drawPts(n, gl.POINTS, VPf, [1, 0.78, 0.42], 5000, true, [-eye[0], -eye[1], -eye[2]]); }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // near pass
    gl.clear(gl.DEPTH_BUFFER_BIT);
    const VT = vtype(), VG = VGEO[VT] || VGEO.skiff, ncrew = Math.min(S.crew.length, VT === 'skiff' ? 1 : 3);
    drawTerrain(TM, eye, VPn, true); drawLit(STAT, TM); drawBuildings(TM);
    if (VT === 'skiff'){ drawSkiff(BMrel, VPn, dt, !cam.helm, ncrew > 0); gl.useProgram(PL.p); }
    else { const pv = PV[VT]; drawLit(pv.hull, BMrel); if (!cam.helm) drawLit(pv.skipper, BMrel); for (let i = 0; i < ncrew; i++) drawLit(pv.crew[i], BMrel); }
    if (STATN){ nSetup(VPn); drawN(STATN, TM); if (PLANTN) drawN(PLANTN, TM); } drawMooring(BMrel, eye, VPn, t);
    const plant = PM ? nearestPlant(eye) : null, pr = plant ? drawPlant(plant, eye, VPn, t, BMrel) : null; gl.useProgram(PL.p);
    wildSpawn(t); drawNPC(eye, t, H); drawWild(eye, t, dt);

    const pole = xf(BMrel, VG.pole);
    drawLit(FLAGM, model(pole[0], pole[1], pole[2], Math.PI / 2 - appB, 0, 0));
    if (VT === 'skiff'){ gl.colorMask(false, false, false, false); drawLit(SK ? SK.cap : CAPM, BMrel); gl.colorMask(true, true, true, true); }
    drawSea(VPn, eye, t, nearFar, 0);
    drawSea(VPn, eye, t, false);
    if (BLD && env.night > 0.02){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); drawChunkLights(VPn, eye); gl.depthMask(true); gl.disable(gl.BLEND); }
    drawEffects(VPn, eye, BMabs, dt, t); drawBlows(VPn, eye, dt); drawNPCLights(VPn); drawSeaLights(VPn, eye, t, true);
    if (VT === 'skiff') drawSkiffGlass(BMrel, VPn);
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
    const pts = [[bv.x, bv.z]].concat(S.plan.wps.slice(S.plan.idx).map(w => [w.x * 1000, w.y * 1000]));
    let n = 0;
    for (let i = 0; i < pts.length - 1 && n < 3900; i++){ PB.set([pts[i][0], 2, pts[i][1], pts[i + 1][0], 2, pts[i + 1][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    for (let i = 1; i < pts.length && n < 3900; i++){ PB.set([pts[i][0], 0, pts[i][1], pts[i][0], 30, pts[i][1]], n * 3); PA[n] = PA[n + 1] = 0.9; n += 2; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawPts(n, gl.LINES, VP, [0.88, 0.25, 0.62], 1, false, [-eye[0], -eye[1], -eye[2]]);
    gl.disable(gl.BLEND);
  }
  function drawEffects(VP, eye, BM, dt, t){
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const foamCol = [Math.min(1, env.amb[0] * 1.4 + env.sunCol[0] * 0.8), Math.min(1, env.amb[1] * 1.4 + env.sunCol[1] * 0.8), Math.min(1, env.amb[2] * 1.4 + env.sunCol[2] * 0.8)];
    // wake and spray
    const v = bv.v;
    if (v > 1){
      const VG = VGEO[vtype()] || VGEO.skiff;
      // a trail point for every 1.2 m travelled, stamped with the real clock (independent of frame rate)
      const p = xf(BM, [0, 0, VG.stern]), now = performance.now() / 1000, last = TRAIL[0], moved = last ? Math.hypot(p[0] - last.x, p[2] - last.z) : 99;
      if (moved > 1.2 || (last && now - last.t0 > 0.3)){ wk.odo = (wk.odo || 0) + Math.min(moved, 60); TRAIL.unshift({x:p[0], z:p[2], t0:now, age:0, r:0.45 + Math.random() * 0.55, v, u:wk.odo, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}); if (TRAIL.length > 700) TRAIL.pop(); }
      const hs = WV.hs;
      if (v > 5 && hs > 0.25){
        wk.sacc += dt * v * hs * 2.2;
        while (wk.sacc >= 1){ wk.sacc -= 1; const side = Math.random() < 0.5 ? -1 : 1, p = xf(BM, [side * VG.side, 0.2, VG.bow + Math.random()]);
          spawn(p[0], p[1], p[2], Math.cos(bv.head) * side * 2.2 + env.windDir[0] * 3, 1.5 + Math.random() * 2.5 * hs, Math.sin(bv.head) * side * 2.2 + env.windDir[1] * 3, 0.9 + Math.random() * 0.5, 9.8); }
      }
    }
    // wake: foaming prop wash behind the stern and the two Kelvin arms spreading at 19.5 degrees, laid on the waves
    { const now = performance.now() / 1000; for (const q of TRAIL) q.age = now - (q.t0 || now); }
    while (TRAIL.length && TRAIL[TRAIL.length - 1].age > 18) TRAIL.pop();
    if (TRAIL.length > 1 && WKB){
      const step = 2 * HALF / NP, ox = Math.round(bv.x / step) * step, oz = Math.round(bv.z / step) * step, tide = env.tide || 0;
      const seaY = (x, z) => { const f = 1 - sstep(0.6, 1.0, Math.max(Math.abs(x - ox), Math.abs(z - oz)) / HALF); return tide + (seaH(x, z, t) - tide) * f + 0.07; };
      const st = xf(BM, [0, 0, (VGEO[vtype()] || VGEO.skiff).stern]), pts = (v > 1 ? [{x:st[0], z:st[2], age:0, v, u:wk.odo || 0, hx:Math.sin(bv.head), hz:-Math.cos(bv.head)}] : []).concat(TRAIL);
      let m = 0; const P = WKB.p, W = WKB.w, Sg = WKB.s, cap = 8900;
      const put = (x, z, u, vv, age, kind, str) => { if (m >= cap) return; P[m * 3] = x - eye[0]; P[m * 3 + 1] = seaY(x, z) - eye[1]; P[m * 3 + 2] = z - eye[2]; W[m * 4] = u; W[m * 4 + 1] = vv; W[m * 4 + 2] = age; W[m * 4 + 3] = kind; Sg[m] = str; m++; };
      const strip = (A, B) => { // A, B: arrays of 3 across-points [x, z, v] at two stations, with u/age/kind/str
        for (let c = 0; c < 2; c++){ const a0 = A.q[c], a1 = A.q[c + 1], b0 = B.q[c], b1 = B.q[c + 1];
          for (const [q, S2] of [[a0, A], [a1, A], [b1, B], [a0, A], [b1, B], [b0, B]]) put(q[0], q[1], S2.u, q[2], S2.age, S2.kind, S2.str); } };
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
      for (const kind of [1, 2, 0]){ const sec = sections(kind); for (let i = 0; i < sec.length - 1; i++) strip(sec[i], sec[i + 1]); }
      if (m){
        gl.useProgram(PRGW.p); const u = PRGW.u; gl.uniformMatrix4fv(u.uVP, false, VP); gl.uniform3fv(u.uEye, eye); gl.uniform3fv(u.uCol, foamCol); gl.uniform3fv(u.uAer, [0.09, 0.3, 0.31].map((c, k) => c * (env.amb[k] * 1.4 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uArm, [0.1, 0.27, 0.31].map((c, k) => c * (env.amb[k] * 1.8 + env.sunCol[k] * 0.6))); gl.uniform3fv(u.uFog, env.fog); gl.uniform1f(u.uFogD, env.fogD); gl.uniform1f(u.uTime, t);
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
    drawPts(n, gl.POINTS, VP, foamCol, 150, true);
    // fishing lines
    if (S.boat.status === 'fishing' && vtype() === 'skiff' && SK){
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
  canvas.addEventListener('dblclick', () => { if (cam.helm){ const G = VGEO[vtype()] || {}; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } }); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.0012), 7, 8000); }, {passive:false});

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
    show, toggle(){ return show(!active); }, isActive:() => active,
    zoom(f){ if (cam.helm) cam.fov = clamp(cam.fov * f, 12, 75); else cam.dist = clamp(cam.dist * f, 7, 8000); }, reset(){ if (cam.helm){ cam.hy = 0; cam.hp = -0.07; cam.fov = 55; } else { cam.yaw = 0.55; cam.pitch = 0.26; cam.dist = 21; } },
    vesselChanged(){ bv.init = false; TRAIL.length = 0; },
    roadsReady(){ if (NEARM) buildGround(); for (const c of CH.values()) freeChunk(c); CH.clear(); },
    fineReady(){ if (NEARM){ freeMesh(NEARM); NEARM = null; updateNear(); } },
    fishCam(){ cam.helm = false; cam.dist = 7; cam.pitch = 0.22; cam.yaw = -0.85; },
    isHelm:() => cam.helm, setHelm(on){ const G = VGEO[vtype()] || {}; cam.helm = !!on; cam.hy = 0; cam.hp = G.hp !== undefined ? G.hp : -0.07; cam.fov = G.fov || 55; },
    _debug:{get SK(){ return SK; }, get MO(){ return MO; }, PLANTS, nearestPlant, fkRun, deckSlots, stepBoat:(dt, t, f) => updateBoat(dt, t, f), TRAIL, get wk(){ return wk; }, cam, bv, env, WILD, CH, lightsSeen(t){ const e = [bv.x, bv.y, bv.z]; let inR = 0, on = 0, sec = 0; SEAMARKS.lights.forEach((L, i) => { const x = L[0] * 1000, z = L[1] * 1000, d = Math.hypot(x - e[0], z - e[2]); if (d > L[3] * 1852 * 1.3 + 500) return; inR++; if (!lightOn(i, t)) return; on++; const brg = ((Math.atan2(x - e[0], -(z - e[2])) * 180 / Math.PI) + 360) % 360; if (L[5].find(q => q[0] <= q[1] ? brg >= q[0] && brg <= q[1] : brg >= q[0] || brg <= q[1])) sec++; }); return {inR, on, sec}; }, treeTest(key){ const m = MB(); addTrees(m, key, BLD.cells.get(key) || [], false); return m.p.length; }, spawnWild(type, ahead){ const a = ahead !== undefined ? bv.head + cam.yaw + ahead : Math.random() * 6.28, dm = type === 'porpoise' ? 50 : 200; WILD.ev.push({type, t0:(performance.now() - T0) / 1000, x:bv.x + Math.sin(a) * dm, z:bv.z - Math.cos(a) * dm, hd:a + 1.6, n:type === 'humpback' ? 1 : 3, blown:{}}); }, get BLD(){ return BLD; }, CH, get NEARM(){ return NEARM; }}
  };
})();
