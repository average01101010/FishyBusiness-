'use strict';
// ===== 3D VIEW (plain WebGL, no dependencies) =====
const G3 = (() => {
  const wrap = document.getElementById('mapwrap'), canvas = document.getElementById('gl'), labelsEl = document.getElementById('labels');
  let gl = null, ready = false, failed = false, active = false, raf = 0, lastF = 0;
  let PL, PS, PSF, PK, PP, SST_VS = false, SSDUMMY = null, SEADBG = false;
  let TERR, STAT, BOATM, CAPM, RODM, FLAGM, SKYQ, PATCH, FARQ, DYNP, DYNA;
  const GLN = {b:0, t:0, t0:0, hid:0, vis:0};   // the GPU's buffers and textures alive, when the view began, when the page was last hidden and shown
  const glDiag = () => { const now = Date.now(), m = performance.memory;
    return (document.hidden ? 'skjult' : 'synlig') + (GLN.hid ? ', sist skjult for ' + Math.round((now - GLN.hid) / 1000) + ' s siden' + (GLN.vis > GLN.hid ? ' i ' + Math.round((GLN.vis - GLN.hid) / 1000) + ' s' : '') : ', ikke skjult') +
      ', 3D i ' + Math.round((performance.now() - GLN.t0) / 60000) + ' min, buffere ' + GLN.b + ', teksturer ' + GLN.t + ', nivå ' + QUAL.lvl + ', biter ' + CH.size + (m ? ', JS ' + Math.round(m.usedJSHeapSize / 1048576) + ' MB' : ''); };
  let HG = null, NEARM = null, MIDM = null, FINEM = null, loading = false, LIGHTS = [], snowNow = null, grassAt = null;   // the snow line in use (m; below 0 in winter), null before the first frame
  // Quality (phase K8 of the coast plan): 0 low, 1 medium, 2 high, 3 ultra (Jonas 05.10.2026: «en ultra grafikk setting ... finne ut
  // hvor grensa ligger for flagship-modeller»; only when chosen, never by auto, and only where 32-bit indices are there: UINT).
  // 'auto' (the setting S.settings.q3d) steps down a level when the
  // frames have been slower than 28 a second for 4 s, and up when faster than 50 for 12 s, but not back up to a level it left within
  // the last two minutes. «#qfix» in the address (the tests) keeps it at high. Per level: the drawing's pixels (dpr), the near
  // terrain's reach, the terrain's shadows, the full sea shader beyond the wave patch, and the spray in the air.
  // Ultra: the screen's own pixels (up to 3 a CSS pixel), the near terrain 9-18 km at 384 points a side (256 below) with a land mask
  // of 4096 (2048), the fine ground 2.7 m apart, the middle terrain denser, the far terrain 160 km wide at 511 points (100 km at 255),
  // the camera's far plane at 260 km (170) and the clearest air 90 km (50), the sea's wave patch 2 m apart (4 m below), buildings and
  // trees out to 2.2 km (1.3 km), the plants, the naust and the boats in full 1.8 times further out, and the meshes and the shadows
  // given twice the time a frame.
  // the measuring run for the boat models (docs/planer/grafikk-batmodeller.md F0, 30.10.2026): your boat drawn k times over (the same
  // outline, k times the vertex work, as a k times finer model would give) and n more of her round about at today's detail, as the other
  // boats in a harbour (Jonas 30.10.2026: the NPC boats need not have the detail of the boats players steer); the frame
  // times of each set-up are summed in the frame loop (24-cinema.js) and the run (G3.bench, 25-controls.js) shows them in a table
  const BENCH = {on:false, k:1, n:0, rec:false, sum:0, cnt:0, slow:0, tris:0};
  const QUAL = {lvl:2, bad:0, good:0, cap:2, capT:0, fix:/qfix/.test(location.hash), dpr:[1, 1.25, 1.5, 3], near:[[3000, 6000], [6000, 12000], [6000, 12000], [9000, 18000]],
    nearN:[256, 256, 256, 384], midN:[256, 256, 256, 384], farN:[255, 255, 255, 511], chunkR:[1300, 1300, 1300, 2200], lodK:[1, 1, 1, 1.8]};
  let UINT = false;
  function qualSet(){ const v = S.settings.q3d || 'auto'; if (QUAL.fix) QUAL.lvl = 2; else if (v !== 'auto') QUAL.lvl = v === 'ultra' && !UINT && gl ? 2 : {low:0, mid:1, high:2, ultra:3}[v]; return v; }
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
  const cam = {yaw:0.55, pitch:0.26, dist:21, helm:false, hy:0, hp:-0.07, fov:55, zoom:1};
  // the binoculars in the bridge view (two fingers apart, the user's list 04.10.2026): the zoom, 1 to 8; what is drawn in detail
  // goes by the distance it looks to be at (distance / zoom), and the point lights grow with it
  const ZF = () => cam.helm ? cam.zoom || 1 : 1;
  const binoc = document.createElement('div'); binoc.id = 'binoc'; binoc.hidden = true; binoc.innerHTML = '<span></span>'; wrap.appendChild(binoc);
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

