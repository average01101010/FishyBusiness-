  // ---------- shaders ----------
  // Lights that light up round them at night (the user's wish 03.10.2026): up to 8 near ones (pickLights), relative to the eye like vW,
  // with their reach in w; each lights a surface by a smooth fall-off to nothing at its reach, more where it faces the light
  const PLG = '\n#define NPL 8\nuniform vec4 uPL[NPL];uniform vec3 uPC[NPL];uniform float uNPL;' +
    'vec3 pLit(vec3 p,vec3 n){vec3 s=vec3(0.0);for(int i=0;i<NPL;i++){if(float(i)>=uNPL)break;float R=uPL[i].w;if(R<=0.0)continue;vec3 L=uPL[i].xyz-p;float r2=dot(L,L);float a=max(0.0,1.0-r2/(R*R));' +
    'if(a<=0.0)continue;s+=uPC[i]*a*a*(0.2+0.8*max(dot(n,L*inversesqrt(r2+0.01)),0.0));}return s;}';
  // The air and the light's shoulder (G5 of docs/planer/grafikk-natur-og-miljo.md), the end of every lit fragment shader: fin(c, v) for
  // the colour c of a point at v from the eye. The haze as before has the visibility's density (uFogD) and the horizon's colour (uFog),
  // but the extinction is per channel, the blue more than the red, so the far fells go blue and lose their contrast before they fade into
  // the sky (Rayleigh), and towards the sun the haze is lit warm with the sky's own glow round the sun (Mie, uAirMie = the sky shader's
  // term), so the land meets the horizon in the same colour. tone() keeps every value under 0.8 as it is and bends those above it softly
  // towards white instead of clipping (the snow, the foam and the sunlit hulls keep their shading); a filmic curve with a toe was not
  // taken: it darkens the night and the shadows that were tuned without it. uAirOn 0 (a program not set, or #air0) is the old haze.
  // The cloud on the fells is here too (uCB: the base in m and how much; uCC its colour; uEye the eye's x and z modulo 4096 and its
  // height), with one ragged edge for everything (the noise of the world's x and z, as the terrain's own wp), so the trees, the houses and
  // the boats on a fell go into the cloud with the ground under them (with a smooth edge of their own the trees stood dark in it)
  const AIR = 'uniform vec3 uAirSun;uniform vec3 uAirMie;uniform float uAirOn;uniform vec3 uCB;uniform vec3 uCC;uniform vec3 uEye;uniform vec2 uCD;' +
    'float aH(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}' +
    'float aN(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.0-2.0*f);return mix(mix(aH(i),aH(i+vec2(1.0,0.0)),u.x),mix(aH(i+vec2(0.0,1.0)),aH(i+vec2(1.0,1.0)),u.x),u.y);}' +
    'vec3 tone(vec3 c){vec3 e=max(c-0.8,0.0);return min(c,vec3(0.8))+0.2*(1.0-exp(-e/0.2));}' +
    'vec3 fin(vec3 c,vec3 v){float d=length(v);float k=uFogD*d;k*=k;if(uAirOn<0.5)return mix(c,uFog,1.0-exp(-k));' +
    // (29.10.2026, Jonas' picture from Finnsnes: the cloud read as snow, white and in fingers down the fall line, standing still): the
    // edge only from noise of 300-700 m, which drifts with the wind (uCD, m), a wide soft edge thin at its foot, and the cloud a little
    // darker than the sky
    'if(uCB.y>0.0){vec2 wq=mod(v.xz+uEye.xy+uCD,4096.0);float e=(aN(wq/700.0+31.0)-0.5)*170.0+(aN(wq/300.0+7.0)-0.5)*70.0;float k2=smoothstep(uCB.x-90.0,uCB.x+260.0,v.y+uEye.z+e);c=mix(c,uCC,k2*k2*(3.0-2.0*k2)*uCB.y);}' +
    'vec3 T=exp(-k*vec3(0.8,0.95,1.2));float mu=max(dot(v/max(d,1.0),uAirSun),0.0);vec3 s=uFog+uAirMie*pow(mu,12.0);return tone(c*T+s*(1.0-T));}';
  const LIT_VS = 'attribute vec3 aPos;attribute vec3 aCol;uniform mat4 uVP;uniform mat4 uM;varying vec3 vW;varying vec3 vC;' +
    'void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;gl_Position=uVP*w;}';
  const LIT_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;' +
    'uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform float uEmis;uniform vec4 uHole;uniform vec4 uOver;uniform vec2 uWet;varying vec3 vW;varying vec3 vC;' + PLG + AIR +
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec3 n=normalize(cross(dFdx(vW),dFdy(vW)));if(dot(n,vW)>0.0)n=-n;float dif=max(dot(n,uSun),0.0);' +
    'vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 bc=mix(vC,uOver.rgb,uOver.a);' +
    // G6: snow on the faces that look up (uWet.y, env.snowC), and in the wet (uWet.x, env.wet) the rest darker with a sheen of the sun
    // and the sky, most on the flat (a quay's deck, a roof, a road on a bridge)
    'float up=smoothstep(0.55,0.9,n.y);bc=mix(bc,vec3(0.88,0.9,0.93),uWet.y*up*0.92);float wf=uWet.x*(1.0-uWet.y*up);bc*=1.0-0.3*wf;' +
    'vec3 V=normalize(-vW);float wsp=pow(max(dot(reflect(-uSun,n),V),0.0),60.0)*wf*(0.25+0.75*up);float wfr=pow(1.0-max(dot(n,V),0.0),4.0)*wf*0.35*up;' +
    'vec3 c=bc*(amb+uSunCol*dif+pLit(vW,n))+bc*uEmis+uSunCol*wsp*0.7+uAmb*wfr;gl_FragColor=vec4(fin(c,vW),1.0);}';
  const TER_VS = 'attribute vec3 aPos;attribute vec3 aCol;attribute vec3 aNor;attribute float aShd;attribute vec4 aMat;attribute vec4 aCov;uniform mat4 uVP;uniform mat4 uM;uniform vec3 uPO;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;varying vec4 vM;varying vec4 vV;void main(){vec4 w=uM*vec4(aPos,1.0);vW=w.xyz;vC=aCol;vN=aNor;vP=aPos+uPO;vS=aShd;vM=aMat;vV=aCov;gl_Position=uVP*w;}';
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
  // Both rise from nothing over the first 1.2 m behind the stern: starting at full height they made a step across the stern, drawn as a
  // white line on the water at the transom (feedback 08.10.2026).
  // The pattern follows the way the boat came (Jonas 29.10.2026: «Se på propellbølgene til båten slik at disse svinger på lik linje som
  // skummet bak båten»): uWkT the source's track behind it, seven points uWkS.x metres apart along it (the stern going ahead, the bow
  // going astern), and s, q are measured along that track and off it (the nearest of its pieces) instead of along a straight line;
  // the first piece reaches on forward (the bow wave), the last on back. uWkS.y 0: a straight line, as before. Written out with fixed
  // indices (no loop over a uniform array: Adreno 642L, Direct3D 11).
  const WAKE_GLSL = 'uniform vec4 uWk0;uniform vec4 uWk1;uniform vec4 uWk2;uniform vec4 uWk3;uniform vec4 uWkT[4];uniform vec2 uWkS;' +
    'float wakeH(vec2 P,float bow){if(uWk3.w<0.5)return 0.0;vec2 r=P-uWk0.xy;float s=-dot(r,uWk0.zw);float q=abs(r.x*uWk0.w-r.y*uWk0.z);float L=uWk2.x;' +
    'if(uWkS.y>0.5&&dot(r,r)<pow(uWk1.w+L+20.0,2.0)){float bd=1e9;' + '{vec2 A=uWk0.xy;vec2 B=uWkT[0].xy;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=min(t,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=0.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[0].xy;vec2 B=uWkT[0].zw;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=clamp(t,0.0,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=1.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[0].zw;vec2 B=uWkT[1].xy;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=clamp(t,0.0,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=2.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[1].xy;vec2 B=uWkT[1].zw;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=clamp(t,0.0,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=3.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[1].zw;vec2 B=uWkT[2].xy;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=clamp(t,0.0,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=4.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[2].xy;vec2 B=uWkT[2].zw;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=clamp(t,0.0,1.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=5.0*uWkS.x+t*l;q=d;}}{vec2 A=uWkT[2].zw;vec2 B=uWkT[3].xy;vec2 ab=B-A;float l=max(length(ab),1e-3);float t=dot(P-A,ab)/(l*l);t=max(t,0.0);float d=length(P-A-ab*t);if(d<bd){bd=d;s=6.0*uWkS.x+t*l;q=d;}}' + '}' +
    'if(s<-L-2.0||s>uWk1.w||q>max(s,0.0)*0.42+L*0.6+4.0)return 0.0;float h=0.0;' +
    'if(s>0.0){float e=s*0.3536;float far=1.0-smoothstep(uWk1.w*0.55,uWk1.w,s);float a=uWk1.y*far*smoothstep(0.0,1.2,s);' +
    'h+=uWk1.z*a*inversesqrt(1.0+s/L)*cos(uWk1.x*s)*(1.0-smoothstep(e*0.75,e*1.02,q))*0.75;' +
    'h+=a*pow(1.0+s/L,-0.333)*sin(1.5*uWk1.x*(0.816*s+0.577*q))*exp(-pow((q-e)/(0.1*s+1.2),2.0));}' +
    'if(bow>0.5){float u=s+L;if(u>-0.5&&u<L*1.5){float lw=0.2+max(u,0.0)*0.466;h+=uWk2.y*exp(-pow((q-lw)/(0.35+max(u,0.0)*0.06),2.0))*exp(-max(u,0.0)/(0.6*L))*smoothstep(-0.5,0.3,u);}}' +
    'return h;}';
  // 13 waves: 0-9 the wind sea (longest first), 10-12 the swell. The loops over them are written out with fixed indices, here and in the
  // fragment shader: a phone's driver (Adreno 642L) and Direct3D 11's compiler would link no sea program, and the vertex shader alone
  // failed with no word why (05.10.2026); it was the only one in the game indexing uniform arrays in a loop. The waves are the same.
  // lite: the four longest wind waves and the swell, with no wake in the geometry, the last try before the flat sea.
  // The near field (Jonas 19.10.2026, the balance between the game's 6x clock and the sea's real time): the short wind waves (4-9,
  // 6-28 m) and the ripples ride with the boat at 5/6 of her speed over the ground (nfStep), so the water passes the hull at her real
  // speed through it, while the long waves (0-3) and the swell stand in the world. The frame shift is a phase offset per wave (uNFp,
  // and uNFg for its group), zero for the long ones; the ripples and the foam's mottle take the shifted position P-uNFD.
  const SEA_VS_WAVE = i => '{vec4 a=uWa[' + i + '];vec4 b=uWb[' + i + '];float att=smoothstep(2.5,5.0,6.2832/(a.z*uCell));float am=ampOf(a,b,S);float Q=steepOf(a,b,am);am*=grpOf(wxz,a,b,uGp[' + i + ']-uNFg[' + i + '])*att;' +
    'float f=a.z*dot(a.xy,wxz)-b.y*uTime+b.z-uNFp[' + i + '];float c=cos(f);d.x+=Q*am*a.x*c;d.z+=Q*am*a.y*c;d.y+=am*sin(f);}';
  const seaVS = lite => 'precision highp float;attribute vec2 aXZ;uniform mat4 uVP;uniform vec2 uOrigin;uniform vec3 uOriginRel;uniform float uTime;uniform float uHalf;uniform float uFlat;uniform vec2 uScale;uniform float uCell;' +
    'uniform vec4 uWa[13];uniform vec4 uWb[13];uniform float uNFp[13];uniform float uNFg[13];varying vec3 vW;varying vec2 vXZ;' + SEA_STATE + (lite ? '' : WAKE_GLSL) +
    'void main(){vec2 lxz=aXZ*uScale;vec2 wxz=uOrigin+lxz;vec3 d=vec3(0.0);' +
    'if(uFlat<0.5){float fade=1.0-smoothstep(0.6,1.0,max(abs(aXZ.x),abs(aXZ.y))/uHalf);vec4 S=seaAt(wxz);' +
    (lite ? [0, 1, 2, 3, 10, 11, 12] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map(SEA_VS_WAVE).join('') + 'd*=fade;' + (lite ? '' : 'd.y+=wakeH(wxz,0.0)*uWk3.z;') + '}' +
    'vec3 rel=uOriginRel+vec3(lxz.x,0.0,lxz.y)+d;vW=rel;vXZ=wxz;gl_Position=uVP*vec4(rel,1.0);}';
  const SEA_VS = seaVS(false), SEA_VS_LITE = seaVS(true);
  // one wave's slope, height and lost roughness in the fragment shader (W: whether it counts for the wind sea's crests)
  const SEA_WAVE = (W, i) => '{vec4 a=uWa[' + i + '];vec4 b=uWb[' + i + '];float att=smoothstep(2.0,7.0,6.2832/(a.z*px));float am=ampOf(a,b,S);float gr=grpOf(P,a,b,uGp[' + i + ']-uNFg[' + i + ']);float Q=steepOf(a,b,am);' +
    'float f=a.z*dot(a.xy,P)-b.y*uTime+b.z-uNFp[' + i + '];float c=cos(f);float s=sin(f);float wa=a.z*am*gr;N.x-=a.x*wa*c*att;N.z-=a.y*wa*c*att;N.y-=Q*wa*s*att;lost+=wa*wa*(1.0-att);' + (W ? 'y+=am*gr*s*att;sa+=am*am*0.228;' : '') + '}';
  // The fragment shader reads the waves from copies of its own (uFWa, uFWb, uFGp): the same uniform array in both stages is the only
  // thing the sea has that no other program has, and the one guess left for the phone that would link none of its variants
  // (Adreno 642L, 05.10.2026). drawSea sets both.
  const SEAF = f => f.replace(/\buWa\b/g, 'uFWa').replace(/\buWb\b/g, 'uFWb').replace(/\buGp\b/g, 'uFGp').replace(/\buNFp\b/g, 'uFNFp').replace(/\buNFg\b/g, 'uFNFg');
  // ---------- the foam map (Fysikk 4, F1): the foam the boat and the sea leave in the water ----------
  // One texture that follows the boat in the near field's frame (Pb = P - uNFD, the water the short sea and the foam's mottle ride
  // in): each texel holds the wake's foam (amount, birth times the amount) in r and g and the whitecaps' in b and a; the birth is kept
  // times the amount so the sea shader's bilinear read of a thin trail never mixes a birth with an empty neighbour's zero. The map is only
  // ever copied, texel for texel, by the whole texels the window has moved (foamStep), so nothing blurs and 8 bits hold it; the age
  // is reckoned when it is drawn, and the foam fades as exp(-age / tau). A birth is a share of a window from the map's t0 (the wake's
  // and the caps' each their own, uFoamT and uFoamTc); when a window rolls (uRebase, 128/255 of it, so a birth stays a whole texel
  // value) the foam born before the new t0 is dropped. Foam is made here, a frame at a time, where it is made in the water: the wash
  // along the hull and the bow wave (the hull swept along the way she came since the last frame, so a slow frame leaves no gap), the
  // water the transom leaves and the screw churns, the stern wave breaking along the Kelvin arms (wakeH, as the sea shader breaks it)
  // and the whitecaps the sea shader sets (the same crest, noise and threshold).
  // The fetch the wind has had over the water just here (Jonas 29.10.2026: white blobs of whitecaps inside a harbour): the sea state
  // knows the fetch on a grid of some 190 m, so a basin behind a breakwater took the open sea's. Six looks upwind in the shore texture
  // (30-960 m, the first land ends it) give the root of the fetch (km) where the shore is in; the lesser of the two is the fetch.
  const FETCHG = 'float fetchW(vec2 P,vec2 up,float sw){if(uLSOn<0.5)return sw;float f=-1.0;' +
    [30, 60, 120, 240, 480, 960].map(d => '{vec2 lu=(P+up*' + d.toFixed(1) + '-uLRect.xy)*uLRect.zw;if(f<0.0){if(lu.x<0.0||lu.y<0.0||lu.x>1.0||lu.y>1.0)f=9.0;else if(texture2D(uLandS,lu).r*8.0-4.0>uTideL)f=' + (d / 1000).toFixed(3) + ';}}').join('') +
    'return f<0.0||f>8.0?sw:min(sw,sqrt(f));}';
  const FOAM_VS = 'attribute vec2 aXZ;varying vec2 vUV;void main(){vUV=aXZ*0.5+0.5;gl_Position=vec4(aXZ,0.0,1.0);}';
  const FOAM_FS = 'precision highp float;uniform sampler2D uPrev;uniform vec2 uShift;uniform vec2 uShiftG;uniform vec2 uFoamG;uniform sampler2D uLandS;uniform vec4 uLRect;uniform float uLSOn;uniform float uTideL;uniform float uN;uniform vec2 uRebase;uniform vec4 uFoamRect;uniform vec4 uFoamT;uniform vec4 uFoamTc;uniform float uTime;uniform vec2 uNFD;uniform float uWind;uniform vec2 uWindDir;' +
    'uniform vec4 uWa[13];uniform vec4 uWb[13];uniform float uNFp[13];uniform float uNFg[13];uniform vec4 uFB;uniform vec4 uFH;uniform vec4 uHull;uniform vec4 uFSp;varying vec2 vUV;' + NOISE + SEA_STATE + WAKE_GLSL + FETCHG +
    // the hull's half width a metres forward of her origin: full in the body, drawn in over the forebody to the stem, a little to the transom
    'float hullW(float a){float hb=uHull.y;if(a>0.0){float t=clamp(a/uHull.z,0.0,1.0);return hb*sqrt(max(1.0-pow(t,2.6),0.0));}float t=clamp(-a/uHull.w,0.0,1.0);return hb*(1.0-0.25*t*t);}' +
    'void main(){' +
    // this texel in the map's own metres, in the sea shader's frame P (from the render origin) and the water's Pb
    'vec2 M=vUV*uFoamRect.w;vec2 P=M+uFoamRect.xy+uNFD;vec2 Pb=M+uFoamRect.xy;' +
    // what was here last frame, moved by whole texels (nothing from outside the old map)
    // (the wake's foam, r and g, by its own whole texels besides: it lies still in the water, uShiftG and uFoamG, foamStep)
    'vec2 su=(gl_FragCoord.xy+uShift)/uN;vec4 old=(su.x>=0.0&&su.y>=0.0&&su.x<=1.0&&su.y<=1.0)?texture2D(uPrev,su):vec4(0.0);' +
    'vec2 sg=(gl_FragCoord.xy+uShift+uShiftG)/uN;old.rg=(sg.x>=0.0&&sg.y>=0.0&&sg.x<=1.0&&sg.y<=1.0)?texture2D(uPrev,sg).rg:vec2(0.0);vec2 Mg=M-uFoamG;' +
    'float aw=old.r;float bw=(aw>0.002?old.g/aw:0.0)-uRebase.x;float ac=old.b;float bc=(ac>0.002?old.a/ac:0.0)-uRebase.y;if(bw<0.0){aw=0.0;bw=0.0;}if(bc<0.0){ac=0.0;bc=0.0;}' +
    'float dw=aw*exp(-max(uFoamT.x-bw,0.0)*uFoamT.y/uFoamT.z);float dc=ac*exp(-max(uFoamTc.x-bc,0.0)*uFoamTc.y/uFoamTc.z);' +
    'float iw=0.0;float ic=0.0;' +
    // --- the boat's own foam, when she has way on ---
    'if(uWk3.w>0.5){' +
    // the hull swept along the way she came this frame: the nearest point of that way, with her heading there
    'vec2 B0=uFB.xy;vec2 B1=uFB.zw;vec2 dB=B1-B0;float l2=max(dot(dB,dB),1e-4);float tt=clamp(dot(Mg-B0,dB)/l2,0.0,1.0);vec2 C=mix(B0,B1,tt);vec2 f=normalize(mix(uFH.xy,uFH.zw,tt));vec2 rt=vec2(-f.y,f.x);' +
    'vec2 r=Mg-C;float a=dot(r,f);float q=abs(dot(r,rt));float v=uFSp.x;float Fr=uFSp.y;float pl=uFSp.z;float w=hullW(a);float st=-uHull.w;float bo=uHull.z;' +
    // the wash along the side: a band outside the hull from the stem aft, widening aft as the bow wave runs out, thickest where the bow
    // wave breaks on the shoulder; a planing hull throws it further out; the water under the after body is churned too
    'float clump=0.6+0.4*ns(Pb*0.55+vec2(2.0,5.0));' +
    'if(a>st-1.0&&a<bo+1.5){float al=clamp((bo-a)/(bo-st),0.0,1.0);float wo=w+0.15+al*(0.3+0.1*v+pl*(0.4+0.08*v));float wd=0.35+0.05*v+al*0.4+pl*0.4;' +
    'float band=exp(-pow(max(q-wo,0.0)/wd,2.0));float str=smoothstep(1.2,3.5,v)*(0.5+0.5*smoothstep(0.0,0.3,al))*(1.0-0.3*smoothstep(0.6,1.0,al));' +
    'float inside=step(q,w)*smoothstep(0.0,0.4,al)*0.5;iw=max(iw,max(band*str,inside)*clump);}' +
    // the water the transom leaves and the screw churns: a band behind the stern, a beam wide, going on with her way
    'if(a<st+0.5&&a>st-6.0){float back=st+0.5-a;float wb=(hullW(st)+0.15+0.3+0.1*v+pl*(0.4+0.08*v))*(1.0+0.03*back)*(0.85+0.3*ns(Pb*0.45+vec2(4.0,9.0)));float band=1.0-smoothstep(wb*0.75,wb*1.1,q);float core=1.0-smoothstep(wb*0.2,wb*0.5,q);iw=max(iw,(0.7*band+0.3*core)*clump*smoothstep(1.0,3.0,v)*(0.85+0.15*smoothstep(0.6,1.0,Fr)));}' +
    // the stern wave breaking along the Kelvin arms and the bow wave, as the sea shader breaks them (uWk0 is given in the map's metres)
    'float wh=wakeH(Mg,1.0);if(wh>0.0){vec2 rr=Mg-uWk0.xy;float s=-dot(rr,uWk0.zw);float br=ns(Pb*1.4+vec2(uTime*1.3,0.0))*0.5+0.5;float lam=6.2832/uWk1.x;' +
    'float arm=uWk3.y*smoothstep(0.45,0.9,wh/max(uWk1.y,0.02))*(1.0-smoothstep(0.0,lam,s))*step(0.0,s)*br;' +
    'float bow=uWk3.x*smoothstep(0.35,0.85,wh/max(uWk2.y,0.02))*step(-uWk2.x-0.5,s)*step(s,0.2)*br;iw=max(iw,max(arm,bow)*0.9);}' +
    '}' +
    // --- the whitecaps, as the sea shader finds them: the crest in standard deviations plus the mottle, over Monahan's threshold ---
    'if(uWind>6.0){vec4 S=seaAt(P);float px=uFoamRect.w/uN;vec3 N=vec3(0.0,1.0,0.0);float y=0.0;float sa=1e-6;float lost=0.0;vec2 w2=uWindDir;vec2 wp=vec2(-w2.y,w2.x);' +
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => SEA_WAVE(true, i)).join('') +
    'float crest=y*inversesqrt(sa);float dw2=smoothstep(0.45,1.73,fetchW(P,-w2,S.w));float Wc=clamp(3.84e-6*pow(max(uWind,0.3),3.41)*dw2,1e-5,0.5);' +
    'vec2 cq=vec2(dot(Pb,w2),dot(Pb,wp));float fn=ns(cq*vec2(0.3,0.12)+vec2(uTime*0.25,0.0))*0.6+ns(cq*vec2(0.7,0.3)-vec2(uTime*0.4,uTime*0.1))*0.4;' +
    'float zt=sqrt(-2.0*log(Wc));zt-=(2.515517+0.802853*zt+0.010328*zt*zt)/(1.0+1.432788*zt+0.189269*zt*zt+0.001308*zt*zt*zt);float th=0.228+0.293*zt-0.016*zt*zt;' +
    'float fv=crest*0.25+fn*0.45;ic=smoothstep(th+0.02,th+0.09,fv);}' +
    // new foam over what is left of the old: born now
    'if(iw>dw){aw=iw;bw=uFoamT.x;}if(ic>dc){ac=ic;bc=uFoamTc.x;}' +
    // none of the wake's foam on land (what the water carries onto a breakwater or a shore is gone)
    'if(uLSOn>0.5){vec2 lu=(P-uFoamG-uLRect.xy)*uLRect.zw;if(lu.x>0.0&&lu.y>0.0&&lu.x<1.0&&lu.y<1.0&&texture2D(uLandS,lu).r*8.0-4.0>uTideL-0.1){aw=0.0;bw=0.0;}}' +
    'gl_FragColor=vec4(aw,bw*aw,ac,bc*ac);}';
  // the last resort when no sea program links: a flat sea with a little ripple, the sky in it and the sun's glitter
  const BASIC_VS = 'precision highp float;attribute vec2 aXZ;uniform mat4 uVP;uniform vec2 uOrigin;uniform vec3 uOriginRel;uniform vec2 uScale;varying vec3 vW;varying vec2 vXZ;' +
    'void main(){vec2 lxz=aXZ*uScale;vec3 rel=uOriginRel+vec3(lxz.x,0.0,lxz.y);vW=rel;vXZ=uOrigin+lxz;gl_Position=uVP*vec4(rel,1.0);}';
  const BASIC_FS = 'precision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uDeep;uniform float uTime;varying vec3 vW;varying vec2 vXZ;' +
    AIR + 'void main(){float d=length(vW);vec3 V=normalize(-vW);vec2 p=vXZ;' +
    'vec3 N=normalize(vec3(0.05*sin(p.x*0.35+uTime*1.1)+0.03*sin(p.y*0.52-uTime*0.9)+0.02*sin((p.x+p.y)*1.7+uTime*2.3),1.0,0.05*cos(p.y*0.31+uTime*1.3)+0.03*cos(p.x*0.47+uTime*0.7)+0.02*cos((p.x-p.y)*1.9-uTime*2.1)));' +
    'float fr=0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);vec3 R=reflect(-V,N);vec3 sky=mix(uHor,uZen,clamp(R.y*1.5,0.0,1.0));' +
    'vec3 body=uDeep*(uAmb*1.7+uSunCol*0.3*max(dot(N,uSun),0.0));vec3 col=mix(body,sky,fr)+uSunCol*pow(max(dot(R,uSun),0.0),220.0)*0.9;' +
    'gl_FragColor=vec4(fin(col,vW),1.0);}';
  // FAR (the far pass beyond the near terrain): the four longest wind waves and the swell, the rest of the wind sea only as roughness, no ripples
  const SEA_FS = '#extension GL_OES_standard_derivatives : enable\nprecision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uFog;uniform float uFogD;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uDeep;' +
    'uniform float uTime;uniform float uWind;uniform vec2 uWindDir;uniform float uFlat;uniform float uSpec;uniform vec4 uWa[13];uniform vec4 uWb[13];uniform float uNFp[13];uniform float uNFg[13];uniform vec2 uNFD;uniform sampler2D uHgt;uniform float uHOn;uniform sampler2D uLandS;uniform vec4 uLRect;uniform float uLSOn;uniform float uTideL;uniform vec4 uSRect;uniform float uSOn;uniform float uPx;uniform float uDbg;uniform sampler2D uFoam;uniform vec4 uFoamRect;uniform vec4 uFoamT;uniform vec4 uFoamTc;uniform float uFoamOn;uniform vec2 uFoamG;uniform vec2 uFoamW;' + PLG +
    'varying vec3 vW;varying vec2 vXZ;' + NOISE + SEA_STATE + WAKE_GLSL + FETCHG +
    AIR + 'void main(){float d=length(vW);vec2 P=vXZ;vec4 S=seaAt(P);' +
    // metres covered by one pixel here (grows with distance and grazing angle); a wave shorter than a few pixels is faded out and its slope becomes roughness instead
    'vec3 V=normalize(-vW);float px=d*uPx/max(abs(V.y),0.12);vec2 w=uWindDir;vec2 wp=vec2(-w.y,w.x);' +
    // gusts: slow patches of rougher and calmer water break up any repetition
    'vec2 Q=P+w*uTime*1.2;float gust=0.62+0.2*sin(dot(Q,vec2(0.0021,0.0013)))*sin(dot(Q,vec2(-0.0009,0.0024))+1.3)+0.12*sin(dot(Q,vec2(0.0047,-0.0031))+2.1)+0.08*sin(dot(Q,vec2(0.0019,0.0067))+4.0);' +
    // y and sa: the wind sea's height here and its variance, so the crest is in standard deviations whatever the spectrum
    'vec3 N=vec3(0.0,1.0,0.0);float y=0.0;float sa=1e-6;float lost=0.0;' +
    [0, 1, 2, 3].map(i => SEA_WAVE(true, i)).join('') +
    '\n#ifdef FAR\n' + [4, 5, 6, 7, 8, 9].map(i => '{vec4 a=uWa[' + i + '];vec4 b=uWb[' + i + '];float wa=a.z*ampOf(a,b,S);lost+=wa*wa*0.456;}').join('') +
    '\n#else\n' + [4, 5, 6, 7, 8, 9].map(i => SEA_WAVE(true, i)).join('') + '\n#endif\n' +
    [10, 11, 12].map(i => SEA_WAVE(false, i)).join('') +
    // ripples: eight short waves spread around the wind, analytic slopes (no grid), scaled by wind and gusts; in light air (Beaufort 0-1)
    // only in patches, the cat's paws, and glassy between them; near calm they are a third as steep as they were, since a mirror-like
    // sea shows every slope in its reflections and the sub-second ripples looked like the water shivering (the user, 03.10.2026)
    'float paw=mix(smoothstep(0.45,0.75,ns(P*0.013+w*uTime*0.5)),1.0,smoothstep(1.6,4.0,uWind));float ra=(0.0015+0.0042*min(uWind,2.0)+0.0034*max(uWind-2.0,0.0))*gust*paw;\n#ifdef FAR\nlost+=ra*ra*6.0;\n#else\n' +
    'for(int j=0;j<8;j++){float fj=float(j);float ang=(fj-3.5)*0.36+sin(fj*2.3)*0.2;vec2 dir=w*cos(ang)+wp*sin(ang);float L=1.1+fj*0.42+fract(fj*0.618)*0.9;float k=6.2832/L;float att=smoothstep(2.0,7.0,L/px);' +
    'float f=k*dot(dir,P-uNFD)-sqrt(9.81*k+0.074*k*k*k/1025.0)*uTime+fj*1.9;float sl=ra*cos(f);N.x-=dir.x*sl*att;N.z-=dir.y*sl*att;lost+=sl*sl*(1.0-att)*0.5+ra*ra*0.5*(1.0-att);}\n#endif\n' +
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
    'vec3 fc=min(uAmb*1.3+uSunCol*0.85,vec3(1.0));float lod=1.0-smoothstep(0.35,1.6,px);float dw=smoothstep(0.45,1.73,fetchW(P,-w,S.w));' +
    'float Wc=clamp(3.84e-6*pow(max(uWind,0.3),3.41)*dw,1e-5,0.5);vec2 Pb=P-uNFD;vec2 cq=vec2(dot(Pb,w),dot(Pb,wp));float fn=ns(cq*vec2(0.3,0.12)+vec2(uTime*0.25,0.0))*0.6+ns(cq*vec2(0.7,0.3)-vec2(uTime*0.4,uTime*0.1))*0.4;' +
    'float zt=sqrt(-2.0*log(Wc));zt-=(2.515517+0.802853*zt+0.010328*zt*zt)/(1.0+1.432788*zt+0.189269*zt*zt+0.001308*zt*zt*zt);float th=0.228+0.293*zt-0.016*zt*zt;' +
    // The edge is as wide as the pixel (fwidth), so it never steps or crawls, with a thin soft rim of older foam outside it; the mottle
    // inside fades to its mean before it gets smaller than a couple of pixels.
    'float fv=crest*0.25+fn*0.45;float aa=max(0.03,1.2*fwidth(fv));float core=smoothstep(th-aa,th+aa,fv);float mo=1.0-smoothstep(0.12,0.45,px);' +
    'float foam=(core+0.22*smoothstep(th-0.12-aa,th,fv)*(1.0-core))*lod*mix(0.78,0.55+0.45*ns(cq*vec2(1.7,0.9)+vec2(uTime*0.6,0.0)),mo);' +
    // streaks of foam along the wind from a near gale (Beaufort 7), denser in a gale and storm
    'vec2 st=vec2(dot(Pb,w)*0.011,dot(Pb,wp)*0.2);float sv=ns(st+vec2(uTime*0.03,ns(Pb*0.02)*3.0));float sq=max(0.08,1.2*fwidth(sv));foam+=smoothstep(0.88-sq,0.88+sq,sv)*smoothstep(13.9,20.8,uWind)*(0.35+0.4*smoothstep(20.8,28.5,uWind))*lod*dw;' +
    'col=mix(col,fc,Wc*(1.0-lod)*0.9+0.3*smoothstep(24.5,32.7,uWind)*dw);' +
    '\n#ifndef FAR\nif(uFlat<0.5&&uWk3.w>0.5&&wh>0.0){vec2 r=P-uWk0.xy;float s=-dot(r,uWk0.zw);float br=ns(Pb*1.4+vec2(uTime*1.3,0.0))*0.5+0.5;' +
    'foam=max(foam,uWk3.x*smoothstep(0.35,0.85,wh/max(uWk2.y,0.02))*step(-uWk2.x-0.5,s)*step(s,0.2)*br);' +
    'foam=max(foam,uWk3.y*smoothstep(0.45,0.9,wh/max(uWk1.y,0.02))*(1.0-smoothstep(0.0,6.2832/uWk1.x,s))*step(0.0,s)*br);}\n#endif\n' +
    // the foam map (14-sea.js foamStep): the foam the boat and the sea have left in the water, aged here. The wake's is dense by the hull
    // and breaks up into bubbles and streaks as it thins (noise that lies still in the water, Pb); the whitecaps' is what the crests left,
    // drawn out along the wind. The water under thin foam is milky with bubbles.
    '\n#ifndef FAR\nif(uFoamOn>0.5){vec2 fu=(Pb-uFoamRect.xy)*uFoamRect.z;if(fu.x>0.0&&fu.y>0.0&&fu.x<1.0&&fu.y<1.0){vec4 m=texture2D(uFoam,fu);m.rg=texture2D(uFoam,fu+uFoamG*uFoamRect.z).rg;vec2 Pw=Pb+uFoamW;' +
    'float b0=m.r>0.002?m.g/m.r:0.0;float c0=m.b>0.002?m.a/m.b:0.0;float aw=m.r*exp(-max(uFoamT.x-b0,0.0)*uFoamT.y/uFoamT.z);float ac=m.b*exp(-max(uFoamTc.x-c0,0.0)*uFoamTc.y/uFoamTc.z);' +
    'float n1=ns(Pw*1.1+vec2(3.1,7.7));float n2=ns(Pw*2.9+vec2(1.3,9.2));float n3=ns(vec2(dot(Pb,w)*0.16,dot(Pb,wp)*1.2)+vec2(5.0,2.0));float n4=ns(Pw*0.4+vec2(8.0,1.0));' +
    'float dens=aw*(0.55+0.45*n4)*(0.6+0.4*n1);float fw=smoothstep(0.06,0.45,dens*(0.75+0.25*n2))*(0.6+0.4*min(aw*1.5,1.0))*lod;' +
    'float agc=max(uFoamTc.x-c0,0.0)*uFoamTc.y;float acv=ac*smoothstep(0.2,1.2,agc);float fcp=smoothstep(0.55,0.9,acv*(0.25+0.75*n3)*(0.6+0.4*n2))*lod*0.6;' +
    'foam=max(foam,max(fw,fcp));col=mix(col,fc*0.6+col*0.4,clamp(aw*0.35,0.0,0.4)*lod);}}\n#endif\n' +
    // shallows and surf, the surf from the sea that reaches this shore
    'if(uSOn>0.5&&uHOn>0.5){vec2 su=(vW.xz-uSRect.xy)*uSRect.zw;if(su.x>0.0&&su.y>0.0&&su.x<1.0&&su.y<1.0){float ef=smoothstep(0.0,0.06,min(min(su.x,su.y),min(1.0-su.x,1.0-su.y)));' +
    'float hb=texture2D(uHgt,su*(255.0/256.0)+0.5/256.0).r*16.0-8.0;float dep=uTideL-hb;float hl=length(S.xy);' +
    // where the shore texture is in (buildLandMask), the water's depth over the foreshore comes from it: the surf lies on the waterline
    // of the tide, on the coast's own line at high water and out on the foreshore at ebb; beyond the foreshore the heights as before,
    // except the coarse mesh's own shelf by the line (its bed over 1 m), which is no shoal: 3 m deep there; nor is the shallow the 23 m
    // cells make where one of them is on land (a cell across the line blends the land's height with the bed, and the surf and the
    // turquoise lay in a band 30-60 m off every shore, Jonas 28.10.2026)
    'if(uLSOn>0.5){vec2 lu=(vW.xz-uLRect.xy)*uLRect.zw;if(lu.x>0.0&&lu.y>0.0&&lu.x<1.0&&lu.y<1.0){float hs=texture2D(uLandS,lu).r*8.0-4.0;' +
    // (29.10.2026, Jonas' pictures from Bleik: the 5 m by the line made a dark ring a coarse cell wide round every islet and breakwater,
    // stepped like the cells, and the coarse shallows beyond it a pale ring): the shore texture knows the depth to 4 m, so where it is
    // in, the depth is its own down to 4 m and at least 4 m beyond, the coarse heights only deeper than that; the turquoise then fades
    // out smoothly from the foreshore with no edge of the coarse cells
    'dep=mix(max(dep,4.0),uTideL-hs,smoothstep(-3.95,-3.0,hs));}}' +
    'col=mix(col,vec3(0.07,0.33,0.32)*(uAmb*1.5+uSunCol*0.75),(1.0-smoothstep(0.3,5.0,dep))*0.42*(1.0-fr)*ef);' +
    'float bw=0.3+hl*1.4;float band=(1.0-smoothstep(0.0,bw,dep))*smoothstep(-0.2,0.02,dep);float sw=0.5+0.5*sin(uTime*0.9+dot(P,w)*0.06);' +
    'float ln=ns(P*0.32+vec2(uTime*0.35,-uTime*0.25))*0.6+ns(P*0.95-uTime*0.45)*0.4;' +
    'foam=max(foam,band*smoothstep(0.35,0.72,ln+band*0.2)*(0.3+0.7*clamp(hl*1.6,0.0,1.0))*(0.7+0.3*sw)*ef);}}' +
    'if(uDbg>0.5){gl_FragColor=vec4(vec3(clamp(foam,0.0,1.0)),1.0);return;}' +
    'col=mix(col,fc,clamp(foam,0.0,1.0)*0.85);gl_FragColor=vec4(fin(col,vW),1.0);}';
  const terFS = q => '#extension GL_OES_standard_derivatives : enable\n#define MATQ ' + q + '\nprecision highp float;uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmb;uniform vec3 uGnd;uniform vec3 uFog;uniform float uFogD;uniform vec4 uHole;' +
    'uniform sampler2D uGround;uniform sampler2D uLand;uniform vec4 uGRect;uniform float uGOn;uniform float uLOn;uniform float uTideY;uniform float uSwash;uniform vec3 uSand;uniform vec2 uWet;uniform float uExpo;varying vec3 vW;varying vec3 vC;varying vec3 vN;varying vec3 vP;varying float vS;varying vec4 vM;varying vec4 vV;uniform vec4 uMP;uniform vec4 uMQ;' + NOISE + PLG + AIR +
    // the ground near the water is cut where the shore texture (buildLandMask: the foreshore's own height, h = r * 8 - 4) lies under
    // the tide, so the waterline is the coast's own line at high water and the foreshore's at ebb, whatever the mesh's cells
    'void main(){if(vW.x>uHole.x&&vW.x<uHole.z&&vW.z>uHole.y&&vW.z<uHole.w)discard;vec2 luv=(vW.xz-uGRect.xy)*uGRect.zw;' +
    'if(uLOn>0.5&&vP.y>uTideY-3.5&&vP.y<uTideY+4.0&&luv.x>0.0&&luv.y>0.0&&luv.x<1.0&&luv.y<1.0&&texture2D(uLand,luv).r*8.0-4.0<uTideY-uSwash)discard;vec2 wp=mod(vP.xz,4096.0);float d=length(vW);float det=1.0-smoothstep(900.0,5000.0,d);' +
        // the ground's own surface (Jonas 18.10.2026: terrain first, and smooth on every device): the vertex colour is the vegetation, and
    // vM carries the weights of rock, wood, snow and a harbour's fill from recolor. MATQ 0 blends them plainly (the low quality, as before);
    // MATQ 1 sharpens the rock and snow edges with noise and drifts the tone over hundreds of metres so no two hillsides match; MATQ 2 adds
    // the close detail inside about a kilometre: the rock's joints and lichen over three projections (so a cliff is not smeared from above),
    // the grass in tufts, heather on the drier slopes, bog on the flat low ground, pebbles where the rock breaks up
    'float b1=ns(wp*0.045)-0.5;float b2=ns(wp.yx*0.045+13.0)-0.5;float b3=ns(wp*0.011+5.0)-0.5;vec3 n=normalize(vN);float st=1.0-n.y;float h=vP.y;' +
    'float R=vM.x;float S=vM.z;vec3 c=vC*(0.92+0.16*ns(wp*0.018+2.0));vec3 rc=vec3(0.33,0.35,0.37);vec3 sc=vec3(0.9,0.92,0.95);' +
    '\n#if MATQ>0\n' +
    'vec2 wq=mod(vP.xz,16384.0);float mv=ns(wq/512.0+0.5)-0.5;float mv2=ns(wq/128.0+9.5)-0.5;c*=(1.0+mv*0.14+mv2*0.07)*vec3(1.0+mv2*0.06,1.0,1.0-mv2*0.06);' +
        // Rock where the ground steepens, without the camouflage (Jonas 18.10.2026: «Hva er greia med disse mønstrene?»): a threshold on
    // 20-60 m noise turned an even 50/50 slope into spots. So there is no pattern at that scale at all: broad zones of about 160 m
    // (stretched down the fall line) shift the rock weight softly, the geometry's own steepness adds to it, and only inside a kilometre
    // comes a fine pattern of slabs and tussocks (1.5-4 m, read as texture); on the steep faces thin ledges of turf along the contours.
    // uMP: zone amplitude, ledge amplitude, fine amplitude, steepness gain. uMQ: the fine pattern's threshold width, the snow's warp, the
    // stretch down the fall line, unused. MATP in JS, G3._debug.matp
    'vec2 dd=n.xz;float dl=length(dd);dd=dl>0.02?dd/dl:vec2(1.0,0.0);vec2 sl=vec2(dot(wp,vec2(-dd.y,dd.x)),dot(wp,dd)/uMQ.z);' +
    'float det1=1.0-smoothstep(200.0,700.0,d);float zone=ns(sl/160.0+41.0)-0.5;float steep=smoothstep(0.45,0.72,st);' +
    'float Rg=R+zone*uMP.x+(st*1.1-0.5)*uMP.w;' +
    // the two fine noises (4 m and 1.4 m) serve the slabs, the tufts and the lichen alike (one evaluation each; Jonas 18.10.2026 felt the
    // frames stutter along the shore, where this tier fills the screen)
    'float fine=0.0,f1=0.0,f2=0.0;if(det1>0.0){f1=ns(wp*0.25+21.0)-0.5;f2=ns(wp*0.7+3.0)-0.5;fine=(f1+0.5*f2)*uMP.z*det1;}' +
    'float ledge=(ns(vec2(sl.x/40.0,h/6.0)+17.0)-0.5)*uMP.y*steep*det;' +
    'R=clamp(smoothstep(0.5-uMQ.x,0.5+uMQ.x,Rg+fine-max(ledge,0.0)*2.0)*step(2.5,h)*(1.0-vM.w)+R*(1.0-step(2.5,h)),0.0,1.0);' +
    'float sw=(ns(wp/36.0+27.0)-0.5)+0.5*(ns(wp/11.0+8.0)-0.5);S=smoothstep(0.3,0.7,S+sw*uMQ.y*det)*(1.0-smoothstep(0.5,0.8,st)*0.8);sc*=0.97+0.06*ns(wp*0.3);rc*=0.9+0.2*(mv2+0.5)+0.2*zone;' +
    '\n#if MATQ>1\n' +
    // one noise per projection gives both the joints (where it crosses its middle) and the blocks' tone (its value), 3 m blocks
    'if(det1>0.0){vec3 c0=c,r0=rc;vec3 aw=abs(n);aw=aw*aw*aw*aw;aw/=aw.x+aw.y+aw.z;' +
    'vec2 px=vec2(mod(vP.z,4096.0),mod(vP.y,4096.0)),pz=vec2(mod(vP.x,4096.0),mod(vP.y,4096.0));' +
    'float ny=ns(wp*0.35),nx=ns(px*0.35+3.0),nz=ns(pz*0.35+6.0);float j=aw.y*abs(ny-0.5)+aw.x*abs(nx-0.5)+aw.z*abs(nz-0.5);float crack=1.0-smoothstep(0.0,0.035,j);' +
    'float blk=aw.y*ny+aw.x*nx+aw.z*nz;float lic=smoothstep(0.06,0.22,f1)*(1.0-smoothstep(0.4,0.7,st))*step(6.0,h);' +
    'float peb=hs(floor(wp*1.5));rc=rc*(0.86+0.28*blk)*(1.0-crack*0.45)*(1.0+(peb-0.5)*1.2*R*(1.0-R));rc=mix(rc,vec3(0.56,0.58,0.46),lic*0.5);' +
    'float tf=(f1+0.5)+(f2+0.5)*0.5;float heath=smoothstep(0.5,0.75,ns(wp/16.0+5.0))*smoothstep(0.05,0.2,st)*(1.0-vM.y);' +
    'float bog=smoothstep(0.58,0.78,ns(wp/64.0+11.0))*(1.0-smoothstep(0.03,0.1,st))*smoothstep(70.0,20.0,h)*step(4.0,h)*(1.0-vM.y);' +
    // where the land cover is known (vV: the bog's, the field's and the heath's shares, and 1 + the lichen fell's; 0 where unknown, G1):
    // the heather where the heath is and not by a noise on any slope, the bog where the bog is (with its dark pools and sedge tussocks)
    // and not on every flat low patch, the lichen's pale carpet broken by stones, and the tram lines of a field, turned per field
    'float kn=step(0.5,vV.w);float mo=max(vV.w-1.0,0.0);' +
    'heath=mix(heath,smoothstep(0.38,0.72,ns(wp/16.0+5.0))*vV.z*(1.0-vM.y),kn);' +
    'float wet=smoothstep(0.15,0.65,vV.x)*(1.0-smoothstep(0.1,0.28,st));bog=mix(bog,wet*(0.75+0.25*smoothstep(0.3,0.7,ns(wp/24.0+11.0))),kn);' +
    'c*=1.0+(tf-0.75)*(0.24-vM.y*0.12);c=mix(c,c*vec3(0.92,0.78,0.86),heath*0.6);c=mix(c,vec3(0.4,0.37,0.2)*(0.9+0.2*tf),bog*0.55);' +
    'float pool=kn*smoothstep(0.66,0.72,ns(wp/14.0+3.0)+f2*0.12)*smoothstep(0.55,0.9,vV.x)*(1.0-smoothstep(0.04,0.1,st));c=mix(c,vec3(0.07,0.08,0.08),pool*0.85);' +
    'c=mix(c,vec3(0.72,0.72,0.62)*(0.85+0.3*f2),kn*mo*smoothstep(0.42,0.6,ns(wp*0.3+7.0))*0.55);' +
    'vec2 fc=floor(wp/90.0);float fa=hs(fc)*3.1416;vec2 fd=vec2(cos(fa),sin(fa));float tram=abs(fract(dot(wp,fd)/18.0)-0.5);' +
    'c*=1.0-kn*smoothstep(0.2,0.6,vV.y)*(0.06*(0.5+0.5*sin(dot(wp,fd)*2.0944))+0.07*(1.0-smoothstep(0.01,0.03,tram)));' +
    'c=mix(c0,c,det1);rc=mix(r0,rc,det1);}' +
    '\n#endif\n' +
    'n=normalize(n+vec3(b1*0.5+b3,0.0,b2*0.5-b3*0.6)*(0.2+st*0.7)*det*(1.0+R*0.8)*(1.0-S*0.7));' +
    '\n#else\n' +
    'n=normalize(n+vec3(b1*0.5+b3,0.0,b2*0.5-b3*0.6)*(0.2+st*0.7)*det);' +
    '\n#endif\n' +
    'c=mix(c,rc,R);c=mix(c,sc,S);vec2 uv=(vW.xz-uGRect.xy)*uGRect.zw;float ins=step(0.0,uv.x)*step(0.0,uv.y)*step(uv.x,1.0)*step(uv.y,1.0);float ef=smoothstep(0.0,0.06,min(min(uv.x,uv.y),min(1.0-uv.x,1.0-uv.y)));' +
'float sand=(1.0-smoothstep(1.2,2.1,h+b1*0.8))*step(0.05,h);c=mix(c,uSand,sand*0.7);' +
    // the tidal zone along the whole coast: rockweed up to about the high water and a pale band of barnacles above it, never under
    // snow (Jonas 07.10.2026: «det ser litt dumt ut når den eneste plassen det er tang og rur i verden er rundt stolpene til naustet»)
    // G10: by the exposure to the open sea (uExpo, the core's expo where the boat is): in a sheltered fjord the rockweed grows thick
    // and a little higher, on an open coast it is thinner and the barnacles' pale band climbs with the splash
    'float wtop=mix(1.65,1.25,uExpo),btop=mix(1.85,2.7,uExpo);' +
    'float wd=(1.0-smoothstep(wtop-0.6,wtop,h+b2*0.6))*step(-0.6,h);c=mix(c,mix(vec3(0.22,0.19,0.1),vec3(0.32,0.28,0.14),ns(wp*0.35)),wd*mix(0.95,0.75,uExpo));' +
    'float br=smoothstep(wtop-0.5,wtop-0.05,h+b2*0.6)*(1.0-smoothstep(btop-0.55,btop,h+b1*0.8));c=mix(c,vec3(0.7,0.7,0.66),br*mix(0.4,0.65,uExpo));' +
    'if(uGOn>0.5&&ins>0.5){vec4 g=texture2D(uGround,uv);c=mix(c,g.rgb,g.a*ef);}' +
    // G6: wet ground (uWet.x, env.wet) is darker, the rock and the foreshore most and the grass least, not under snow, with the sun's
    // sheen on it
    'float wf=uWet.x*(1.0-S)*(0.3+0.7*max(R,1.0-smoothstep(1.0,2.5,h)));c*=1.0-0.3*wf;' +
    'float dif=max(dot(n,uSun),0.0)*mix(0.08,1.0,smoothstep(0.15,0.85,vS));vec3 amb=mix(uGnd,uAmb,n.y*0.5+0.5);vec3 col=c*(amb+uSunCol*dif+pLit(vW,n));' +
    'vec3 V=normalize(-vW);col+=uSunCol*pow(max(dot(reflect(-uSun,n),V),0.0),40.0)*wf*0.45*smoothstep(0.15,0.85,vS)*(1.0-smoothstep(300.0,1500.0,d));' +
    'gl_FragColor=vec4(fin(col,vW),1.0);}';
  const SKY_VS = 'attribute vec2 aP;varying vec2 vP;void main(){vP=aP;gl_Position=vec4(aP,0.9999,1.0);}';
  const SKY_FS = 'precision highp float;uniform vec3 uF;uniform vec3 uR;uniform vec3 uU;uniform vec2 uTan;uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uSunD;uniform vec3 uSunCol;' +
    'uniform vec3 uCX;uniform vec3 uCY;uniform vec3 uCP;uniform float uPx;uniform float uCloud;uniform vec2 uCloudOff;uniform float uTime;uniform float uStars;uniform float uAur;uniform float uDay;uniform vec2 uWindDir;uniform vec3 uMoonD;uniform float uMoonA;uniform float uAirOn;varying vec2 vP;' + NOISE +
    'float cq5(vec2 p){p=mod(p,289.0);vec2 i=floor(p),f=p-i;vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);vec2 j=mod(i+1.0,289.0);return mix(mix(hs(i),hs(vec2(j.x,i.y)),u.x),mix(hs(vec2(i.x,j.y)),hs(j),u.x),u.y);}' +
    'float cfbm(vec2 p){const mat2 R=mat2(0.8,-0.6,0.6,0.8);float a=cq5(p)*0.6;p=R*p*2.3+5.2;a+=cq5(p)*0.3;p=R*p*2.2+1.7;return a+cq5(p)*0.1;}' +
    'vec3 tone(vec3 c){vec3 e=max(c-0.8,0.0);return min(c,vec3(0.8))+0.2*(1.0-exp(-e/0.2));}' +
    // the aurora's line across the sky plane: wide arcs, S-folds, small ripples and a tighter curl that wanders along it
    // lod fades the small folds and the curl where the samples along the ray stand too far apart to follow them (low in the sky)
    'float aFold(float x,float fk,float T,float lod){float xc=5.0*sin(T*0.007+fk*5.0);float q=x-xc;' +
    'return 1.1*sin(x*0.16+T*0.012+fk*2.1)+0.55*sin(x*0.37-T*0.02+fk*4.7)+lod*(0.3*sin(x*0.9+T*0.05+fk)+0.9*exp(-q*q*0.12)*sin(q*1.6))+0.6*(ns(vec2(x*0.22-T*0.015,fk*7.0))-0.5);}' +
    'void main(){vec3 d=normalize(uF+vP.x*uTan.x*uR+vP.y*uTan.y*uU);float h=clamp(d.y,0.0,1.0);vec3 col=mix(uHor,uZen,pow(h,0.55));' +
    'float sd=max(dot(d,uSunD),0.0);col+=uSunCol*(pow(sd,12.0)*0.35+smoothstep(0.9993,0.99965,sd)*2.5)*(1.0-uCloud*0.9);' +
    // the sky's light by the sun (G5, with the air on): a broad warm glow low over the horizon towards the sun, the sky a little deeper
    // blue away from it, and at sunrise and sunset the earth's shadow (dark blue) low opposite the sun with the pink belt over it
    'if(uAirOn>0.5){float cl=1.0-uCloud*0.85;col+=uSunCol*pow(sd,4.0)*0.14*(1.0-h)*cl;col*=1.0-0.07*(1.0-sd)*h*cl;' +
    'vec2 sh=normalize(uSunD.xz+vec2(1e-4,0.0));float anti=max(-dot(normalize(d.xz+vec2(1e-4,0.0)),sh),0.0);float tw=exp(-pow(uSunD.y/0.07,2.0))*cl*anti*anti;' +
    'col=mix(col,col*vec3(0.62,0.66,0.85),tw*(1.0-smoothstep(0.0,0.06,h))*0.7);col+=vec3(0.22,0.1,0.13)*tw*smoothstep(0.03,0.08,h)*(1.0-smoothstep(0.1,0.24,h));}' +
    // the night sky (Jonas 09.10.2026: «litt mer realistisk og spektakulær ... Litt som i spillet skyrim»): the stars and the Milky Way
    // stand where they are on the real sky and turn round the pole star with the sidereal time (uCX/uCY/uCP: the equator's RA 0h and
    // 6h and the pole, from the boat's latitude and longitude). Stars are round points a pixel or two wide (uPx), many faint and few bright,
    // white with blue and orange ones, twinkling more low in the sky; the northern Milky Way (Cassiopeia, Cygnus) a band with dark dust
    // lanes and faint coloured clouds; and a faint green airglow along the horizon
    'if(uStars>0.01&&d.y>-0.02){vec3 s=vec3(dot(d,uCX),dot(d,uCY),dot(d,uCP));float hz=smoothstep(-0.02,0.1,d.y);' +
    'vec3 G=vec3(-0.868,-0.198,0.456),C=vec3(-0.055,-0.873,-0.484);float gb=dot(s,G),gl=dot(s,C)*0.5+0.5;' +
    'float mwn=ns(s.xy*5.0+s.z*3.1)*0.55+ns(s.yz*11.0+s.x*2.3)*0.3+ns(s.zx*23.0)*0.15;' +
    'float band=exp(-gb*gb/(0.03+0.02*mwn))*(0.45+0.55*gl);float dust=exp(-pow(gb-0.035*(mwn-0.5),2.0)/0.0016)*smoothstep(0.35,0.7,mwn);' +
    'float mw=band*(0.35+0.9*mwn)*(1.0-0.75*dust);' +
    'vec3 mwc=mix(vec3(0.42,0.48,0.72),vec3(0.75,0.62,0.55),gl)+vec3(0.25,0.05,0.3)*smoothstep(0.55,0.85,ns(s.xy*3.0+7.0))+vec3(0.0,0.12,0.22)*smoothstep(0.55,0.85,ns(s.yz*3.4+2.0));' +
    'col+=mwc*mw*0.12*uStars*hz;' +
    'vec3 a=abs(s);vec3 fc;vec2 uv;if(a.x>a.y&&a.x>a.z){uv=s.yz/a.x;fc=vec3(sign(s.x),0.0,0.0);}else if(a.y>a.z){uv=s.xz/a.y;fc=vec3(0.0,sign(s.y),0.0);}else{uv=s.xy/a.z;fc=vec3(0.0,0.0,sign(s.z));}' +
    'vec3 st=vec3(0.0);for(int L=0;L<2;L++){float sc=L==0?70.0:210.0;vec2 pp=uv*sc;vec2 cl=floor(pp);vec2 fr=pp-cl;' +
    'vec3 r3=fract(vec3(cl.xyx+fc.xyz*17.0+float(L)*31.0)*vec3(0.1031,0.1030,0.0973));r3+=dot(r3,r3.yzx+33.33);r3=fract((r3.xxy+r3.yzz)*r3.zyx);' +
    'float m=L==0?smoothstep(0.965,1.0,r3.z)*smoothstep(0.965,1.0,r3.z)*2.4:smoothstep(0.87,1.0,r3.z)*(0.22+0.9*mw);' +
    'if(m>0.02){vec2 sp=0.2+0.6*r3.xy;float dd=length(fr-sp)/sc;float rr=uPx*(0.75+0.9*min(m,2.0));' +
    'float tw=1.0+(0.35+0.4*(1.0-hz))*sin(uTime*(3.0+r3.x*5.0)+r3.y*60.0)*step(0.3,m);' +
    'vec3 sc3=mix(vec3(0.72,0.82,1.0),vec3(1.0,0.82,0.6),smoothstep(0.35,1.0,r3.x));if(r3.y<0.12)sc3=vec3(0.65,0.75,1.0);' +
    'st+=sc3*m*tw*exp(-dd*dd/(rr*rr));}}' +
    'col+=st*uStars*hz*0.85;' +
    'col+=vec3(0.012,0.04,0.022)*uStars*exp(-pow((d.y-0.07)/0.07,2.0));}' +
    'if(uMoonA>0.01){float md=dot(d,uMoonD);float R=0.0095;if(md>cos(R*1.6)){vec3 up=abs(uMoonD.y)>0.99?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);vec3 rx=normalize(cross(up,uMoonD));vec3 ry=cross(uMoonD,rx);vec2 q=vec2(dot(d-uMoonD*md,rx),dot(d-uMoonD*md,ry))/R;float r2=dot(q,q);' +
    'if(r2<1.0){vec3 n=normalize(q.x*rx+q.y*ry-sqrt(1.0-r2)*uMoonD);float lit=smoothstep(-0.05,0.08,dot(n,uSunD));float mare=0.82+0.18*ns(q*3.0+7.0);col=mix(col,vec3(0.93,0.93,0.88)*mare*(0.06+0.94*lit),uMoonA*(1.0-uCloud*0.85));}' +
    'else col+=vec3(0.55,0.6,0.7)*uMoonA*0.06*exp(-(r2-1.0)*0.6)*(1.0-uCloud);}}' +
    // the aurora (Jonas' list 04.10.2026, «realistiske draperier med stråler»; tilbakemelding #56, 09.10.2026: «Ser bare ut som et langt
    // teppe som henger på himmelen i en rett linje»): each curtain is a sheet standing on a line across the sky plane (x along the magnetic
    // east-west, 12° from the grid, y north), and the line bends: wide arcs, S-folds and a tighter curl that wanders (aFold), so no curtain
    // runs straight. A ray is followed up through the curtains' heights (its track on the plane is a straight line from the eye) in nine
    // steps and lights the sheet wherever it crosses the bent line, so a fold seen from the side shows twice, as real ones do. The sheet is
    // brightest seen edge on (by the bent line's own normal), its lower edge undulates, and it comes and goes in pieces along its length,
    // so the arcs end in the sky instead of running from horizon to horizon. Rays stand along the field lines and shimmer; green
    // (557.7 nm oxygen) from the lower edge, red (630 nm) high up, a purple fringe under a strong one. Stronger activity brings the
    // curtains south, overhead (core auroraAt: activity, darkness, clouds and how far north the boat is).
    'if(uAur>0.01&&d.y>0.004){vec2 E=vec2(0.978,0.208),N=vec2(-E.y,E.x);vec2 g=d.xz/max(d.y,0.004);float gE=dot(g,E),gN=dot(g,N),T=uTime;vec3 acc=vec3(0.0);' +
    // the sheets have a soft thickness, at least as wide as the step along the ray on the plane (no gaps, no hard outlines however the
    // sheet is seen; Jonas 09.10.2026: «bra i noen vinkler, men helt jævlig i andre ... litt mer blurry»). Each sample adds the glow of the
    // sheet's own depth there, scaled so a sheet crossed square on gives the same light at any thickness, and more the longer the ray runs
    // inside it (edge on), which the soft sheet limits by itself
    'float gl=length(g),stp=0.22,dd=gl*stp,w=max(0.14,dd*0.75),lod=1.0-smoothstep(0.35,1.1,dd);' +
    'for(int k=0;k<3;k++){float fk=float(k);float c0=-2.6-fk*1.1+uAur*1.9+0.35*sin(T*0.011+fk*2.3);' +
    'for(int i=0;i<12;i++){float alt=0.9+float(i)*stp;float u=alt*gE;float F=gN*alt-c0-aFold(u,fk,T,lod);' +
    'if(abs(F)<w*2.3){float lo=1.0+0.2*(ns(vec2(u*0.55+T*0.02,fk*3.0+5.0))-0.5)*2.0;' +
    'float hp=smoothstep(lo-0.2,lo+0.06,alt)*(exp(-(alt-lo)*1.5)+0.16*smoothstep(lo+0.6,lo+1.6,alt)*(1.0-smoothstep(2.6,3.3,alt)));' +
    'if(hp>0.003){float seg=smoothstep(0.2,0.55,ns(vec2(u*0.11+fk*11.0,T*0.004+fk)));' +
    'float r=ns(vec2(u*3.2+T*0.22+fk*13.0,fk))*0.7+ns(vec2(u*8.0-T*0.4,fk+3.0))*0.3;r=0.3+0.95*r*r;' +
    'float pulse=0.6+0.4*ns(vec2(u*0.35+T*0.09,fk*5.0+T*0.025));' +
    'vec3 hc=mix(vec3(0.16,1.0,0.48),vec3(0.75,0.16,0.42),smoothstep(lo+0.6,lo+1.6,alt))+vec3(0.45,0.0,0.55)*uAur*(1.0-smoothstep(lo-0.1,lo+0.1,alt));' +
    'float den=exp(-F*F/(w*w))*dd/w;acc+=hc*hp*r*pulse*seg*den*(1.0-fk*0.3)*0.5;}}}}' +
    'acc=acc/(1.0+0.35*max(acc.g,max(acc.r,acc.b)));' +
    'col+=acc*uAur*0.6*smoothstep(0.0,0.06,d.y)+vec3(0.03,0.16,0.08)*uAur*smoothstep(0.0,0.35,d.y)*(1.0-smoothstep(0.35,0.9,d.y))*0.35;}' +
    // the clouds' noise (30.10.2026, Jonas' pictures at sea: flat blocks with straight edges in the clouds on the tablet): the sample
    // runs to thousands (the drift's offset), where a GPU's hash loses its precision and neighbouring cells come out alike; so the
    // noise repeats every 289 cells and works on small numbers only, eases its cells with the quintic (no creases for the light's
    // difference to show), and each octave is turned against the last so their cells never line up
    'if(d.y>0.0){vec2 cp=d.xz/(d.y+0.08)*1.2+uCloudOff+160.0;float c=cfbm(cp);float cov=smoothstep(1.0-uCloud-0.05,1.0-uCloud+0.35,c);' +
    'vec3 cc=mix(uHor*0.85,vec3(0.9,0.92,0.95),0.35*uDay)*(0.3+0.7*uDay);' +
    // the clouds lit by the sun (G5, with the air on): the side of a cloud towards the sun is lit in the sun's colour (the density a step
    // towards the sun against here), a thick cloud's underside is dark, and the thin edges near the sun shine (the silver lining). Under a
    // full grey sky it stays the old flat grey
    'if(uAirOn>0.5){vec2 sv=normalize(uSunD.xz+vec2(1e-4,0.0))*0.18;vec2 cq=cp+sv;float c2=cfbm(cq);' +
    'float li=clamp(0.55+(c-c2)*3.0,0.0,1.0)*smoothstep(-0.05,0.15,uSunD.y+0.1);float thick=smoothstep(0.35,1.0,cov)*smoothstep(0.3,0.9,uCloud);' +
    'vec3 lc=mix(uHor*0.55+uZen*0.15,uSunCol*0.95+uZen*0.25,li)*(1.0-0.3*thick);lc+=uSunCol*pow(sd,8.0)*cov*(1.0-cov)*2.2;' +
    'cc=mix(lc,cc,smoothstep(0.75,0.98,uCloud));}' +
    'col=mix(col,cc,cov*smoothstep(0.0,0.12,d.y)*0.95);}' +
    'gl_FragColor=vec4(uAirOn>0.5?tone(col):col,1.0);}';
  const PT_VS = 'attribute vec3 aPos;attribute float aA;uniform mat4 uVP;uniform vec3 uOff;uniform float uSize;uniform float uPull;uniform float uMax;varying float vA;' +
    'void main(){vA=aA;vec3 r=aPos+uOff;r-=normalize(r+vec3(0.0,0.0,1e-4))*min(length(r)*0.5,uPull);vec4 p=uVP*vec4(r,1.0);gl_Position=p;gl_PointSize=clamp(uSize/max(p.w,0.1),1.0,uMax);}';
  const PT_FS = 'precision mediump float;uniform vec3 uCol;uniform float uRound;varying float vA;' +
    'void main(){float a=vA;if(uRound>0.5){vec2 c=gl_PointCoord-0.5;float r=dot(c,c);if(r>0.25)discard;a*=uRound>1.5?exp(-r*14.0)*(1.0-r*4.0):1.0-r*4.0;}gl_FragColor=vec4(uCol,a);}';

  // The clouds drift in real time, as the waves do (the world's 6x would make them a time-lapse): with the wind at their height, 1.5 times
  // the wind at the sea (over the sea the surface wind is some two-thirds of the wind above the friction layer) and veered 15 degrees
  // from it (the surface wind backs across the isobars towards the low), at least 2 m/s, over a deck at 1 500 m. The sky shader takes the
  // cloud plane at 1.2 units a unit of height, so a cloud moving v m/s moves 1.2 v / 1500 units a second; the offset is gathered frame by
  // frame and taken off the sample (the pattern then moves downwind), so a turn or a change of the wind never makes the sky jump.
  // (Before 19.10.2026 the offset was the wind's direction times the time since the start: the clouds drifted upwind at a fixed pace,
  // and a few degrees of veer moved the whole sky.)
  const CLD = {off:new Float32Array([0, 0]), veer:15 * Math.PI / 180, h:1500};
  function cloudStep(dt){
    const w = env.windDir || [0, -1], U = clamp(1.5 * (env.wind || 0), 2, 40), r = 1.2 * U / CLD.h * dt, c = Math.cos(CLD.veer), s = Math.sin(CLD.veer);
    CLD.off[0] -= (w[0] * c - w[1] * s) * r; CLD.off[1] -= (w[1] * c + w[0] * s) * r;
    for (let i = 0; i < 2; i++) if (Math.abs(CLD.off[i]) > 4096) CLD.off[i] -= Math.sign(CLD.off[i]) * 4096;   // (after days of play: a single jump)
  }
  // the celestial frame for the night sky: the pole at the boat's latitude, turned by the local sidereal time (GMST from the game's date)
  function skyFrame(u, Hh, tn, bv){
    const ll = natLL({x:bv.x / 1000, y:bv.z / 1000}), f = ll.lat * DEG, jd = (EPOCH + S.t * 6e4) / 864e5 + 2440587.5;
    const th = 2 * Math.PI * (0.779057273264 + 1.00273781191135448 * (jd - 2451545)) + ll.lon * DEG;
    const sf = Math.sin(f), cf = Math.cos(f), M = [0, cf, sf], E = [1, 0, 0], ct = Math.cos(th), st = Math.sin(th);
    gl.uniform3fv(u.uCX, [ct * M[0] - st * E[0], ct * M[1], ct * M[2]]); gl.uniform3fv(u.uCY, [st * M[0] + ct * E[0], st * M[1], st * M[2]]);
    gl.uniform3fv(u.uCP, [0, sf, -cf]); gl.uniform1f(u.uPx, 2 * tn / Math.max(Hh, 1));
  }
  // A fragment shader asks for highp only where the device has it (some phones' GPUs have mediump only there); a shader that fails
  // says which one, and whether the context was lost, since a lost context fails every compile with no log (the user's phone
  // 05.10.2026: «shadere: Error», nothing more)
  const FS_HP = '\n#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const glWhy = (log, nm) => nm + ': ' + (gl.isContextLost() ? 'konteksten er mistet' : (log && log.trim()) || 'ingen logg fra driveren');
  function compile(type, src, nm){
    if (type === gl.FRAGMENT_SHADER) src = src.replace('precision highp float;', FS_HP);
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(glWhy(gl.getShaderInfoLog(s), nm + (type === gl.VERTEX_SHADER ? ' VS' : ' FS')));
    return s;
  }
  function program(vs, fs, attrs, nm = '?'){
    const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, vs, nm)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs, nm));
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(glWhy(gl.getProgramInfoLog(p), nm + ' link'));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++){ const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return {p, u};
  }
  function buf(data, target, usage){ const b = gl.createBuffer(); target = target || gl.ARRAY_BUFFER; gl.bindBuffer(target, b); gl.bufferData(target, data, usage || gl.STATIC_DRAW); return b; }
  // the air's uniforms for a program that has them (AIR); the sky's glow round the sun as the sky shader draws it (pow 12 x 0.35, less
  // under cloud), so the haze towards the sun meets it
  const AIRON = /air0/.test(location.hash) ? 0 : 1;
  let AIRE = [0, 0, 0];   // the eye's x and z modulo 4096 and its height, set by drawTerrain each frame (the terrain's wp folds the same way)
  function airSet(u, terr){
    if (u.uAirOn) gl.uniform1f(u.uAirOn, AIRON);
    if (u.uCB){ gl.uniform3fv(u.uCB, [env.cbase || 3000, env.cstr || 0, 0]); gl.uniform3fv(u.uCC, env.ccol || env.fog); gl.uniform3fv(u.uEye, AIRE); if (u.uCD) gl.uniform2fv(u.uCD, env.cdrift || [0, 0]); }
    if (u.uAirSun){ gl.uniform3fv(u.uAirSun, env.sunDir || [0, 1, 0]); const k = 0.35 * (1 - 0.9 * (env.cloud || 0)); gl.uniform3fv(u.uAirMie, (env.sunCol || [0, 0, 0]).map(v => v * k)); }
  }
  function attr(loc, b, size){ gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); }
  // World meshes keep their vertices relative to their own origin m.o ([x, z], metres), so Float32 holds them to the millimetre
  // anywhere in the country; the model matrix carries the origin less the eye, worked out in doubles (relM). The shaders get the
  // world from the render origin RO (a multiple of 4096 m near the eye), for the wave phases, the noise and the texture tiling.
  const relTo = (p, o) => { const P = new Float32Array(p); if (o) for (let i = 0; i < P.length; i += 3){ P[i] = p[i] - o[0]; P[i + 2] = p[i + 2] - o[1]; } return P; };
  const withOrigin = (m, o) => { if (o) m.o = o; return m; }, MESHMAX = 60000;
  const RO = {x:0, z:0, on:false}; let EYE = [0, 0, 0];
  const WETON = !/wet0/.test(location.hash);
  // #glchk in the address: the first GL error and the drawing step it came after (G3._debug.glFirst), for the tests
  const GLCHK = /glchk/.test(location.hash); let GLFIRST = '';
  const glChk = tag => { if (!GLCHK || GLFIRST) return; const e = gl.getError(); if (e) GLFIRST = tag + ':' + e; };   // G6's wet and snow on what is built and on the ground (#wet0 in the address: off)
  const relM = m => model(m.o[0] - EYE[0], (m.oy || 0) - EYE[1], m.o[1] - EYE[2], 0, 0, 0);   // oy: a mesh riding the tide (floatJob)
  const mapMid = () => [(HOME.x0 + HOME.x1) * 500, (HOME.y0 + HOME.y1) * 500];
  function upload(pos, col, idx){ const m = {pb:buf(pos), cb:buf(col), n:idx ? idx.length : pos.length / 3}; if (idx) m.ib = buf(idx, gl.ELEMENT_ARRAY_BUFFER); return m; }

