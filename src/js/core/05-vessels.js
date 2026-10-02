// ---------- other vessels (deterministic, so every player sees the same traffic) ----------
const NPC_ROUTES = {"coastal":[[35.025,82.275],[41.875,68.925],[43.025,67.925],[56.525,59.825],[57.425,58.775],[56.275,55.625],[55.575,54.775],[55.725,54.525],[55.625,52.775],[56.275,45.125],[60.325,40.925],[60.725,39.775],[60.475,37.425],[62.125,28.775],[63.025,28.025],[78.375,19.375]],"coastalStop":7,"ferry":[[53.208,23.505],[53.225,23.475],[53.875,22.425],[57.575,12.575],[57.725,12.475],[58.425,12.425],[58.925,12.625],[59.025,12.775]],"sjark":[[[43.811,19.839],[43.825,19.875],[43.825,19.925],[43.825,19.975],[43.825,20.025],[43.725,20.075],[43.575,20.025],[43.175,19.275],[42.125,13.525],[42.925,9.425],[44.05,8.35]],[[36.662,25.316],[37.125,24.975],[37.025,23.075],[32.35,18.65]],[[19.851,39.709],[19.875,39.675],[19.825,39.625],[19.775,39.625],[19.625,39.575],[17.875,39.625],[17.325,40.125],[9.475,39.425],[9.15,39.15]],[[53.208,23.505],[53.275,23.475],[53.325,23.475],[53.375,23.475],[55.325,22.025],[59.65,19.35]]]};
for (const k of ['coastal', 'ferry']) NPC_ROUTES[k] = NPC_ROUTES[k].map(LGa); NPC_ROUTES.sjark = NPC_ROUTES.sjark.map(r => r.map(LGa));   // legacy km into the game's frame
function prepRoute(r){ const pts = r.map(q => ({x:q[0], y:q[1]})), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i])); return {pts, cum, len:cum[cum.length - 1]}; }
function atRoute(R, s){
  s = clamp(s, 0, R.len); let i = 1; while (i < R.pts.length - 1 && R.cum[i] < s) i++;
  const a = R.pts[i - 1], b = R.pts[i], seg = (R.cum[i] - R.cum[i - 1]) || 1, u = clamp((s - R.cum[i - 1]) / seg, 0, 1);
  return {p:{x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u}, hd:Math.atan2(b.x - a.x, -(b.y - a.y))};
}
const NPCR = {coastal:prepRoute(NPC_ROUTES.coastal), coastalRev:prepRoute(NPC_ROUTES.coastal.slice().reverse()), ferry:prepRoute(NPC_ROUTES.ferry), ferryRev:prepRoute(NPC_ROUTES.ferry.slice().reverse()), sjark:NPC_ROUTES.sjark.map(prepRoute), sjarkRev:NPC_ROUTES.sjark.map(r => prepRoute(r.slice().reverse()))};
NPCR.stopS = NPCR.coastal.cum[NPC_ROUTES.coastalStop]; NPCR.stopSRev = NPCR.coastal.len - NPCR.stopS;
const FLEET = [{"n":"Havørn","home":"husoy","hp":[43.838,19.863],"L":10.99,"B":4.2,"T":1.8,"cs":"LK4417","reg":"T-54-BG","own":"Havørn Fiskeri AS","rt":[[[43.838,19.863],[43.825,19.925],[43.825,19.975],[43.812,20.013],[43.788,20.038],[43.763,20.038],[43.738,20.038],[43.713,20.038],[43.675,20.075],[43.475,19.875],[42.071,17.429]],[[43.838,19.863],[43.825,19.925],[43.825,19.975],[43.812,20.013],[43.788,20.038],[43.763,20.038],[43.738,20.038],[43.713,20.038],[43.675,20.075],[43.475,19.875],[43.175,19.275],[42.125,13.525],[42.125,13.375],[42.225,13.325],[44.688,13.463],[44.775,13.525],[45.725,15.175],[47.853,19.464]]]},{"n":"Mefjordingen","home":"senjahopen","hp":[36.662,25.316],"L":14.9,"B":6.0,"T":2.6,"cs":"LM2291","reg":"T-21-BG","own":"Mefjord Kystfiske AS","rt":[[[36.662,25.316],[37.125,24.975],[37.025,23.075],[36.425,22.525],[34.675,21.475],[32.775,20.475],[31.075,20.025],[29.925,19.775],[29.725,19.825],[25.375,24.475],[25.275,24.875],[26.325,28.475],[28.375,30.425],[29.225,30.875],[32.675,31.875],[34.125,31.775],[34.155,31.715]],[[36.662,25.316],[37.125,24.975],[36.875,20.325],[35.657,19.103]]]},{"n":"Grylle","home":"gryllefjord","hp":[19.888,39.688],"L":10.7,"B":3.9,"T":1.6,"cs":"LJ6604","reg":"T-8-TK","own":"Grylle Fiskeri AS","rt":[[[19.888,39.688],[19.888,39.663],[19.863,39.638],[19.825,39.625],[19.775,39.625],[19.625,39.575],[18.875,39.575],[18.575,39.925],[17.362,41.742]],[[19.888,39.688],[19.888,39.663],[19.863,39.638],[19.825,39.625],[19.775,39.625],[19.625,39.575],[17.875,39.625],[17.325,40.125],[14.462,41.561]]]},{"n":"Botnværing","home":"botnhamn","hp":[53.208,23.505],"L":12.2,"B":4.6,"T":2.0,"cs":"LG3308","reg":"T-112-LK","own":"Botnværing AS","rt":[[[53.208,23.505],[53.275,23.475],[53.338,23.463],[53.338,23.438],[53.363,23.413],[53.388,23.438],[53.388,23.488],[53.363,23.513],[53.375,23.475],[53.525,23.625],[51.681,26.334]],[[53.208,23.505],[53.225,23.475],[55.54,21.199]]]},{"n":"Senjaværing","home":"finnsnes","hp":[55.838,54.288],"L":10.99,"B":4.4,"T":1.9,"cs":"LK9052","reg":"T-37-LK","own":"Gisund Sjark AS","rt":[[[55.838,54.288],[55.825,54.325],[55.825,54.375],[55.825,54.425],[55.825,54.475],[55.625,54.725],[55.975,56.625],[57.215,57.878]],[[55.838,54.288],[55.825,54.325],[55.825,54.375],[55.825,54.425],[55.825,54.475],[55.625,54.725],[56.075,57.075],[57.275,58.325],[57.375,58.725],[57.589,60.492]]]},{"n":"Nordstjerna","home":"Torsken","hp":[21.338,42.788],"L":14.5,"B":5.8,"T":2.4,"cs":"LM5170","reg":"T-15-TK","own":"Nordstjerna Fiskeri AS","rt":[[[21.338,42.788],[21.263,42.788],[21.263,42.788],[21.225,42.825],[21.175,42.825],[21.075,42.875],[17.738,43.138]],[[21.338,42.788],[21.263,42.788],[21.263,42.788],[21.225,42.825],[21.175,42.825],[21.075,42.875],[20.025,42.625],[17.919,40.182]]]},{"n":"Kvitholmen","home":"Torsken","hp":[21.338,42.788],"L":9.9,"B":3.6,"T":1.5,"cs":"LJ2788","reg":"T-40-TK","own":"Kvitholmen Fiske AS","rt":[[[21.338,42.788],[21.263,42.788],[21.263,42.788],[21.225,42.825],[21.175,42.825],[21.075,42.875],[17.562,42.972]],[[21.338,42.788],[21.263,42.788],[21.263,42.788],[21.225,42.825],[21.175,42.825],[21.075,42.875],[20.025,42.625],[17.88,40.107]]]},{"n":"Bergsfjord","home":"Skaland","hp":[29.263,30.763],"L":10.4,"B":3.8,"T":1.7,"cs":"LG7741","reg":"T-66-BG","own":"Bergsfjord Sjark AS","rt":[[[29.263,30.763],[29.312,30.763],[29.312,30.788],[29.338,30.812],[29.363,30.788],[29.363,30.763],[29.375,30.775],[29.413,30.763],[29.438,30.788],[29.475,30.825],[32.019,32.066]],[[29.263,30.763],[29.263,30.788],[29.225,30.825],[29.175,30.825],[25.648,29.782]]]},{"n":"Tindvær","home":"Mefjordvær","hp":[34.988,22.288],"L":20.9,"B":7.2,"T":3.4,"cs":"LNQE","reg":"T-3-BG","own":"Tindvær Havfiske AS","rt":[[[34.988,22.288],[35.013,22.288],[35.062,22.238],[35.038,22.213],[35.013,22.213],[35.013,22.213],[35.025,22.175],[36.023,19.454]],[[34.988,22.288],[35.013,22.288],[35.062,22.238],[35.038,22.213],[35.013,22.213],[35.013,22.213],[35.025,22.175],[35.025,21.775],[34.675,21.475],[32.104,19.56]]]},{"n":"Sølvtind","home":"Mefjordvær","hp":[34.988,22.288],"L":10.99,"B":4.3,"T":1.8,"cs":"LK1360","reg":"T-88-BG","own":"Sølvtind Fiskeri AS","rt":[[[34.988,22.288],[34.988,22.263],[35.013,22.288],[35.038,22.263],[35.062,22.288],[35.087,22.263],[36.575,22.575],[38.003,24.042]],[[34.988,22.288],[35.013,22.288],[35.062,22.238],[35.038,22.213],[35.013,22.213],[35.013,22.213],[35.025,22.175],[35.776,19.329]]]},{"n":"Hamnvær","home":"Hamn","hp":[24.213,33.788],"L":9.5,"B":3.5,"T":1.4,"cs":"LJ4029","reg":"T-19-BG","own":"Hamnvær Fiske AS","rt":[[[24.213,33.788],[24.175,33.775],[24.125,33.775],[24.075,33.775],[24.013,33.812],[24.038,33.812],[24.062,33.837],[24.062,33.863],[24.013,33.913],[23.975,33.875],[23.925,33.875],[23.875,33.875],[23.825,33.875],[21.225,33.325],[21.179,33.267]],[[24.213,33.788],[24.175,33.775],[24.125,33.775],[24.075,33.775],[24.013,33.812],[24.038,33.812],[24.062,33.837],[24.062,33.863],[24.013,33.913],[23.975,33.875],[23.925,33.875],[23.875,33.875],[23.825,33.825],[23.825,33.775],[23.825,33.225],[23.838,33.163],[23.838,33.163],[23.875,33.125],[23.913,33.163],[23.938,33.163],[23.963,33.138],[23.963,33.113],[23.925,33.075],[23.963,33.038],[23.925,33.025],[23.925,32.825],[23.925,32.775],[23.975,32.725],[23.975,32.675],[23.975,32.525],[24.025,32.475],[24.038,32.438],[24.075,32.425],[24.138,32.413],[24.163,32.388],[24.138,32.363],[24.138,32.363],[24.125,32.325],[24.163,31.963],[24.163,31.938],[24.138,31.913],[24.113,31.913],[24.075,31.875],[24.025,31.825],[24.025,31.775],[24.025,31.175],[23.975,31.125],[23.925,31.075],[23.925,31.025],[23.925,30.975],[23.975,30.925],[23.975,30.875],[23.975,30.825],[23.975,30.775],[23.975,30.725],[23.975,30.575],[23.975,30.525],[23.975,30.475],[23.975,30.425],[23.975,30.375],[23.975,30.325],[23.975,30.275],[23.975,30.225],[23.229,28.647]]]},{"n":"Vesterfjord","home":"Skrolsvik","hp":[19.662,71.888],"L":12.8,"B":5.0,"T":2.1,"cs":"LM8453","reg":"T-27-TN","own":"Vesterfjord Kystfiske AS","rt":[[[19.662,71.888],[19.675,71.925],[19.525,72.325],[18.988,72.463],[18.825,72.625],[18.312,72.663],[18.288,72.688],[18.225,72.675],[16.363,72.232]],[[19.662,71.888],[19.675,71.925],[19.125,73.325],[18.175,74.625],[18.109,75.476]]]},{"n":"Laukvik","home":"gryllefjord","hp":[19.888,39.688],"L":14.9,"B":6.2,"T":2.7,"cs":"LG5519","reg":"T-61-TK","own":"Laukvik Havfiske AS","rt":[[[19.888,39.688],[19.888,39.663],[19.863,39.638],[19.825,39.625],[19.775,39.625],[19.625,39.575],[18.425,39.575],[16.997,41.025]],[[19.888,39.688],[19.888,39.663],[19.863,39.638],[19.825,39.625],[19.775,39.625],[19.625,39.575],[18.875,39.575],[18.575,39.925],[18.425,40.475],[18.725,41.325],[19.975,42.525],[20.575,42.775],[21.791,43.013]]]},{"n":"Solbris","home":"finnsnes","hp":[55.838,54.288],"L":8.9,"B":3.2,"T":1.3,"cs":"LJ9964","reg":"T-97-LK","own":"Solbris Sjark AS","rt":[[[55.838,54.288],[55.825,54.325],[55.825,54.375],[55.825,54.425],[55.825,54.475],[55.625,54.725],[55.925,56.375],[57.491,57.903]],[[55.838,54.288],[55.825,54.325],[55.825,54.375],[55.825,54.425],[55.825,54.475],[55.625,54.725],[56.075,57.075],[57.275,58.325],[57.375,58.725],[57.401,60.545]]]}];
for (const f of FLEET){ f.hp = LGa(f.hp); f.rt = f.rt.map(r => r.map(LGa)); }   // legacy km into the game's frame
const HOMES = {"finnsnes":[55.838,54.288],"botnhamn":[53.208,23.505],"husoy":[43.838,19.863],"senjahopen":[36.662,25.316],"gryllefjord":[19.888,39.688],"Torsken":[21.338,42.788],"Skaland":[29.263,30.763],"Mefjordv\u00e6r":[34.988,22.288],"Hamn":[24.213,33.788],"Skrolsvik":[19.662,71.888]};
const HOME_NAMES = {finnsnes:'Finnsnes', botnhamn:'Botnhamn', husoy:'Husøy', senjahopen:'Senjahopen', gryllefjord:'Gryllefjord'};
// vessels of 15 m or more may not fish inside the fjord line (høstingsforskriften § 31): keep only their grounds outside it
FLEET.forEach(f => { if (f.L >= 15){ const out = f.rt.filter(r => { const q = r[r.length - 1]; return !insideFjord({x:q[0], y:q[1]}); }); if (out.length) f.rt = out; } });
FLEET.forEach(f => { f.R = f.rt.map(prepRoute); f.RR = f.rt.map(r => prepRoute(r.slice().reverse())); f.homeName = HOME_NAMES[f.home] || f.home; });
// where fleet vessel i is at time H: harbour speed near home, its own cruising speed at sea (slower in big waves),
// and jig fishing on the bank: drift with the wind, then steam back up for a new drift
const DRIFT = new Map();
// every vessel has its own place along the quay, clear of the harbour point where you moor; the offset fades out over 150 m
const BERTHS = {};
function hashStr(t){ let h = 2166136261; for (let k = 0; k < t.length; k++) h = Math.imul(h ^ t.charCodeAt(k), 16777619); return h >>> 0; }
const BERTH_USED = {};
function berthSlot(q, key, big){
  const ck = q.id + '|' + key; if (BERTHS[ck]) return BERTHS[ck];
  const sh = q.shore ? {x:q.shore[0] - q.p.x, y:q.shore[1] - q.p.y} : {x:0, y:1}, l = Math.hypot(sh.x, sh.y) || 1, n = {x:sh.x / l, y:sh.y / l}, a = {x:-n.y, y:n.x};
  const h = hashStr(key), base = big ? 0.07 : 0.03 + 0.016 * (h % 3), s0 = (h >> 3) % 2 ? 1 : -1, used = BERTH_USED[q.id] || (BERTH_USED[q.id] = []);
  const cand = [];
  for (const sc of [1, 0.75, 1.4, 1.9]) for (const sg of [s0, -s0]) cand.push({x:a.x * base * sc * sg, y:a.y * base * sc * sg});
  for (const k of [0, 1, 2, 3]) for (const sg of [s0, -s0]) cand.push({x:-n.x * (0.035 + 0.02 * k) + a.x * 0.018 * sg, y:-n.y * (0.035 + 0.02 * k) + a.y * 0.018 * sg});
  let out = null;
  for (const o of cand){ if (used.some(u => Math.hypot(u.x - o.x, u.y - o.y) < 0.02)) continue;
    if (!isLand({x:q.p.x + o.x, y:q.p.y + o.y}) && !isLand({x:q.p.x + o.x / 2, y:q.p.y + o.y / 2})){ out = o; break; } }
  if (!out) out = {x:-n.x * (0.05 + 0.02 * used.length), y:-n.y * (0.05 + 0.02 * used.length)};
  used.push(out); return BERTHS[ck] = out;
}
function berthShift(p, key, big){
  let best = null, bd = 0.15; for (const q of PORTS){ const d = dist(p, q.p); if (d < bd){ bd = d; best = q; } }
  if (!best) return p; const f = 1 - bd / 0.15, o = berthSlot(best, key, big); return {x:p.x + o.x * f, y:p.y + o.y * f};
}
function fleetState(i, H){ const s = fleetState0(i, H); s.p = berthShift(s.p, 'f' + i, false); return s; }
function fleetState0(i, H){
  const f = FLEET[i], big = f.L >= 14, g = gDate(H), hod = g.getUTCHours() + g.getUTCMinutes() / 60 + g.getUTCSeconds() / 3600;
  const dep = 4.5 + hash(i * 13 + 5) * 2.5, e = ((hod - dep) % 24 + 24) % 24, day0 = H - e, dI = Math.floor((day0 + 6) / 24);
  const k = f.R.length > 1 && hash(dI * 31 + i) < 0.5 ? 1 : 0, R = f.R[k], RR = f.RR[k];
  const moored = () => { const q = f.R[0] ? atRoute(f.R[0], 0) : {p:{x:f.hp[0], y:f.hp[1]}, hd:0}; return {p:q.p, hd:q.hd + Math.PI, st:'port'}; };
  if (!R || hash(dI * 17 + i * 7) < 0.12 || windAt(day0) >= (big ? 15 : f.L >= 12 ? 13.5 : 12)) return moored();
  const cs = ((big ? 9.8 : 7.8) + hash(i * 3 + 1) * 1.8) * clamp(1 - (hsOpen(day0) - 1.2) * 0.12, 0.65, 1) * NM, hsp = 5 * NM;
  const hz = Math.min(0.45, R.len * 0.25), tH = hz / hsp, T = tH + (R.len - hz) / cs, fishH = 5 + hash(dI * 7 + i * 3) * 3.5;
  if (e < T){ const sd = e < tH ? e * hsp : hz + (e - tH) * cs, a = atRoute(R, sd); return {p:a.p, hd:a.hd, st:'out'}; }
  if (e < T + fishH){
    const tf = e - T, C = 0.75, kc = Math.floor(tf / C), u = tf - kc * C, spot = R.pts[R.pts.length - 1];
    const dk = i + '|' + dI + '|' + kc; let D = DRIFT.get(dk);
    if (!D){
      // drift downwind over the bank, but never onto land: try nearby directions, then a shorter drift
      const jx = (hash(dI * 97 + i * 11 + kc) - 0.5) * 0.3, jy = (hash(dI * 89 + i * 5 + kc) - 0.5) * 0.3, st0 = {x:spot.x + jx, y:spot.y + jy};
      const Hc = day0 + T + kc * C, wd = (windDir(Hc) + 180) * Math.PI / 180; let run = (0.35 + 0.075 * windAt(Hc)) * NM * 0.62, end = st0, dd = wd;
      const ok = (a, b) => { for (let q = 1; q <= 8; q++){ const p = {x:a.x + (b.x - a.x) * q / 8, y:a.y + (b.y - a.y) * q / 8}; if (isLand(p) || coastDist(p) < 0.12) return false; } return true; };
      search: for (let tries = 0; tries < 3; tries++, run *= 0.5) for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, Math.PI]){ const a = wd + off, e2 = {x:st0.x + Math.sin(a) * run, y:st0.y - Math.cos(a) * run}; if (ok(st0, e2)){ end = e2; dd = a; break search; } }
      D = {st0, end, dd}; if (DRIFT.size > 3000) DRIFT.clear(); DRIFT.set(dk, D);
    }
    const st0 = D.st0, end = D.end, dd = D.dd;
    if (u < 0.62){ const q = u / 0.62; return {p:{x:st0.x + (end.x - st0.x) * q, y:st0.y + (end.y - st0.y) * q}, hd:dd + Math.PI / 2, st:'fishing'}; }
    const q = (u - 0.62) / 0.13; return {p:{x:end.x + (st0.x - end.x) * q, y:end.y + (st0.y - end.y) * q}, hd:dd + Math.PI, st:'fishing'};
  }
  const eb = e - T - fishH;
  if (eb < T){ const tb = (RR.len - hz) / cs, sd = eb < tb ? eb * cs : RR.len - hz + (eb - tb) * hsp, a = atRoute(RR, sd); return {p:a.p, hd:a.hd, st:'in'}; }
  return moored();
}
function npcStates(H, only){
  const out = [], d = gDate(H), hod = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600, mon = d.getUTCMonth();
  const ago = start => ((hod - start) % 24 + 24) % 24;
  // coastal ship: northbound in the evening, southbound at night, 15 kn, 30 min at the Finnsnes quay
  const v = 15 * NM;
  for (const [R, start, stop, dir] of [[NPCR.coastal, 17.5, NPCR.stopS, 'n'], [NPCR.coastalRev, 2.5, NPCR.stopSRev, 's']]){
    if (only && only !== 'kyst' + dir) continue;
    const e = ago(start), t1 = stop / v; let s;
    if (e < t1) s = e * v; else if (e < t1 + 0.5) s = stop; else s = stop + (e - t1 - 0.5) * v;
    if (s < R.len){ const a = atRoute(R, s); out.push({id:'kyst' + dir, name:'MS Kystpilen', type:'coastal', p:berthShift(a.p, 'kyst', true), hd:a.hd, v:(e >= t1 && e < t1 + 0.5) ? 0 : 15}); }
  }
  // ferry Botnhamn - Brensholmen, summer season only, every 90 min 07-21
  if (mon >= 4 && mon <= 8 && (!only || only === 'ferje')){
    const vf = 12 * NM, tc = NPCR.ferry.len / vf; let a = null, sp = 0;
    if (hod >= 7 && hod < 21.5){ const e = (hod - 7) % 1.5; if (e < tc){ a = atRoute(NPCR.ferry, e * vf); sp = 12; } else if (e < 0.75){ a = atRoute(NPCR.ferry, NPCR.ferry.len); } else if (e < 0.75 + tc){ a = atRoute(NPCR.ferryRev, (e - 0.75) * vf); sp = 12; } }
    if (!a) a = atRoute(NPCR.ferry, 0);
    out.push({id:'ferje', name:'MF Senjasund', type:'ferry', p:berthShift(a.p, 'ferje', true), hd:a.hd, v:sp});
  }
  // the local fleet: out early, fish on their banks, home in the afternoon; bigger boats go out in worse weather
  FLEET.forEach((f, i) => {
    if (only && only !== 'f' + i) return;
    const A = fleetState(i, H), B = fleetState(i, H - 1 / 60), dx = A.p.x - B.p.x, dy = A.p.y - B.p.y, sog = Math.hypot(dx, dy) / NM * 60;
    out.push({id:'f' + i, name:f.n, type:f.L >= 14 ? 'kyst' : 'sjark', p:A.p, hd:A.hd, cog:sog > 0.15 ? Math.atan2(dx, -dy) : A.hd, v:Math.round(sog * 10) / 10, st:A.st, fleet:true, fi:i});
  });
  return out;
}

const hooks = {};
let S;
function newState(){
  const home = PORTS[0];
  return {v:1, t:0, lastReal:Date.now(), mult:1, lang:'no', cash:15000,
    boat:{type:'skiff', pos:{x:home.p.x, y:home.p.y}, heading:0, v:0, fuel:60, ice:0, gear:false, status:'port', port:home.id, prev:null, engineUntil:0, fishUntil:null, engH:0, svcAt:0},
    equip:{vhf:false, ais:false, plotter:false, chirp:false, sonar:false, jukse:0, motor90:false}, crew:[], loan:null, member:false, msgs:[], sales:[], order:null, owned:['skiff'], lic:null, fm:{n:0, last:-1, kr:0, b:false}, haill:null, pubE:-1e9, target:'mix', streak:null, clothes:{olje:0, varme:0}, orders:null, rep:{}, bors:null, cevt:null, workLog:[], stock:initStock(), marks:[], navrows:[], incidents:[], lore:{}, tattoos:{}, tat:{}, pgear:newPGear(), sets:[], gseq:0, ops:null, company:'', boatName:'', tut:0, jobs:[], prep:{}, tripBuff:null, draftDep:null,
    plan:null, draft:[], draftSpeed:16, trail:[{x:home.p.x, y:home.p.y, port:home.id}],
    settings:{ice:true, deckFirst:true, autoOn:true, autoW:11},
    hold:[], log:[], market:{}, stats:{revenue:0, costs:0, trips:0, kg:0}, lastSale:null, fishPlanH:3, lastIceWarn:-1e9, intro:false};
}
const KEEP_MIN = 60 * 24 * 60;
function log(no, en, k){ if (VTAG && S.fleet && S.fleet.length > 1 && S.boatName){ no = S.boatName + ': ' + no; en = S.boatName + ': ' + en; } S.log.push(k ? {t:S.t, no, en, k} : {t:S.t, no, en}); while (S.log.length > 4000 || (S.log.length && S.log[0].t < S.t - KEEP_MIN)) S.log.shift(); if (hooks.onLog) hooks.onLog(); }
// the deck log: one line every full hour at sea, and a noon observation in port
function navHour(){
  const b = S.boat, H = S.t / 60, hr = gDate(H).getUTCHours();
  if (b.status === 'port' && hr !== 12) return;
  S.navrows.push({t:S.t, port:b.status === 'port' ? b.port : null, st:b.status, hd:Math.round(((b.heading * 180 / Math.PI) % 360 + 360) % 360), v:Math.round((b.status === 'sailing' ? b.v : 0) * 10) / 10, x:Math.round(b.pos.x * 1000) / 1000, y:Math.round(b.pos.y * 1000) / 1000, W:Math.round(windAt(H) * 10) / 10, wd:Math.round(windDir(H)), hs:Math.round(hsAt(b.pos, H) * 10) / 10, vis:Math.round(visibility(H))});
  while (S.navrows.length && S.navrows[0].t < S.t - KEEP_MIN) S.navrows.shift();
}
const holdTotal = () => S.hold.reduce((a, x) => a + x.kg, 0);
function nearestPort(p){ let best = null, bd = 1e9; for (const q of PORTS){ const d = dist(p, q.p); if (d < bd){ bd = d; best = q; } } return best; }

function step(){
  if (!S.fleet || !S.fleet.length) ensureFleet();
  if (S.t % 60 === 0){ ordersTick(S.t / 60); borsTick(S.t / 60); eachVessel(() => crewTick(S.t / 60)); }
  S.t += 1; const H = S.t / 60;
  energyMinute();
  if (S.t % 60 === 0){ hourly(); eachVessel(navHour); eachVessel(loreHour); }
  if (S.t % 60 === 0) for (const pid in S.market) for (const sp in S.market[pid]) S.market[pid][sp] *= 0.97;
  if (S.t % 60 === 0 && S.stock) stockHour(H);
  if (S.t % 60 === 0) gearHour(H);
  eachVessel(() => vesselStep(H));
}
// one vessel's minute: the catch keeps, the yard works, plans start, and the boat sails or fishes
function vesselStep(H){
  const b = S.boat;
  const clean = S.tripBuff && S.tripBuff.hold ? 0.75 : 1;
  workMinute();
  for (const x of S.hold){ const r = SPECIES[x.sp].live ? 0.4 : x.bled ? (x.iced ? 0.9 : 3.0) : (x.iced ? 2.2 : 6.0); x.fresh = Math.max(0, x.fresh - r * clean / 60); }
  deckMinute();
  // work queue at the yard and on the quay: runs while the boat is in port
  if (S.jobs && S.jobs.length && b.status === 'port'){ const j = jobOk(S.jobs[0]); if (j.until == null) j.until = S.t + j.h * 60; if (S.t >= j.until){ finishJob(j); S.jobs.shift(); if (S.jobs.length) S.jobs[0].until = S.t + S.jobs[0].h * 60; } }
  // the landing note comes when the catch is weighed in; the pump runs and the boat moves along the harbour
  if (b.land && S.t >= b.land.until) finishLanding();
  if (b.status === 'port'){ quayMinute(); shoreTick(); }
  opsStep(H);
  // planned departure
  if (S.plan && S.plan.depAt && S.t >= S.plan.depAt && (b.status === 'port' || b.status === 'idle')){
    const W0 = windAt(H);
    if (portBusy(b)){ S.plan.depAt = portBusy(b) + 1; log('Avgangen venter til arbeidet på kaia er ferdig.', 'Departure waits until the work at the quay is done.'); }
    else if (S.jobs && S.jobs.length && b.status === 'port'){ S.plan.depAt = S.jobs[0].until + 1; log('Avgangen venter til verkstedet er ferdig.', 'Departure waits until the yard is done.'); }
    else if (S.settings.autoOn && W0 > S.settings.autoW && (S.plan.delays || 0) < 12){ S.plan.depAt += 60; S.plan.delays = (S.plan.delays || 0) + 1; log('Avgangen er utsatt en time. Vinden er ' + W0.toFixed(0) + ' m/s.', 'Departure postponed an hour. The wind is ' + W0.toFixed(0) + ' m/s.'); }
    else depart();
  }
  if (b.status === 'unmooring'){ if (S.t >= b.castUntil){ b.status = 'sailing'; b.port = null; } return; }
  if (b.status === 'port') return;
  const W = windAt(H), hs = hsAt(b.pos, H);
  if (['sailing', 'fishing', 'idle'].includes(b.status)) stabTick(H);
  if (b.status === 'engine' && S.t >= b.engineUntil){ b.status = b.prev || 'idle'; b.prev = null; log('Motoren startet igjen.', 'The engine is running again.'); }
  // the first trip waits in port for wind (the departure is put off) but does not turn back once out
  if (b.tutWait && (b.status !== 'idle' || (S.haill && S.haill.type === 'luksus'))){ if (b.status === 'idle'){ b.status = 'fishing'; b.fishUntil = S.t + b.tutWait * 60; log('Haillen er om bord. Starter fiske i ' + b.tutWait + ' t.', 'The luck is aboard. Fishing for ' + b.tutWait + ' h.'); } b.tutWait = null; }
  // you are asleep alone aboard: nobody steers or fishes, and the boat drifts (core/15-energy.js)
  if (sleepAlone() && ['sailing', 'fishing', 'idle'].includes(b.status)){ sleepDrift(H); risk(W, hs); return; }
  if (S.settings.autoOn && W > S.settings.autoW && ['sailing','fishing','idle'].includes(b.status) && !(S.plan && S.plan.returning) && !(S.tut && S.tut.catch)){
    startReturn(true, W);
  }
  if (b.status === 'sailing' || b.status === 'fishing') b.engH = (b.engH || 0) + (b.status === 'sailing' ? 1 : 0.25) / 60;
  if (b.status === 'sailing'){ const p0 = b.pos; sail(H, W, hs); if (meAboard()) tatAdd('nm', dist(p0, b.pos) / NM); }
  else if (b.status === 'fishing') fish(H, W, hs);
  else b.v = 0;
  risk(W, hs);
}
// speed for the coming minute: the boat speeds up and slows down gradually, and keeps to 5 knots within 250 m of a harbour
// (it starts slowing before it gets there)
function sailV(H, hs){
  const b = S.boat, pl = S.plan; if (!pl) return 0;
  let tgt = Math.min(pl.speed, speedCap(hs == null ? hsAt(b.pos, H) : hs)), near = 1e9;
  for (const q of PORTS){ const d = dist(q.p, b.pos); if (d < near) near = d; }
  // brake before the next stop (a harbour or a fishing spot) along the route, not when leaving
  let rem = 0, p0 = b.pos, stop = false; for (let i = pl.idx; i < pl.wps.length; i++){ const w = pl.wps[i]; rem += dist(p0, w); p0 = w; if (wpStop(w)){ stop = true; break; } if (rem > 3) break; }
  if (near < 0.25 || (stop && rem < 0.25 + (b.v || 0) * NM / 60 * 1.1)) tgt = Math.min(tgt, 5);
  const acc = BOAT.accel || 3, prev = b.status === 'sailing' ? (b.v || 0) : 0;
  return tgt > prev ? Math.min(tgt, prev + acc) : Math.max(tgt, prev - acc * 1.5);
}
function sail(H, W, hs){
  const b = S.boat, pl = S.plan;
  if (!pl){ b.status = 'idle'; b.v = 0; return; }
  if (b.fuel <= 0){ b.fuel = 0; b.status = 'adrift'; b.v = 0; log('Tom for drivstoff. Båten driver.', 'Out of fuel. The boat is adrift.'); return; }
  const v = sailV(H, hs); b.v = v;
  let left = v * NM / 60;
  b.fuel = Math.max(0, b.fuel - fuelLph(v, W) / 60);
  while (left > 1e-9 && pl.idx < pl.wps.length){
    const w = pl.wps[pl.idx], d = dist(b.pos, w);
    if (d > 1e-6) b.heading = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y));
    const to = d <= left ? {x:w.x, y:w.y} : {x:b.pos.x + (w.x - b.pos.x) / d * left, y:b.pos.y + (w.y - b.pos.y) / d * left}, gp = groundCheck(b.pos, to);
    if (gp){ runAground(gp); return; }
    if (d <= left){ b.pos = to; left -= d; if (arrive(w)) return; }
    else { b.pos = to; left = 0; }
  }
}
function arrive(w){
  const b = S.boat, pl = S.plan;
  S.trail.push({x:w.x, y:w.y, port:w.port || null});
  if (w.port){ dock(w.port); return true; }
  pl.idx++;
  if (!(w.fish > 0) && pl.idx < pl.wps.length){ const nw = pl.wps[pl.idx], c = Math.round(((Math.atan2(nw.x - w.x, -(nw.y - w.y)) * 180 / Math.PI) + 360) % 360); log('WP' + pl.idx + ' passert. Ny kurs ' + String(c).padStart(3, '0') + '°.', 'WP' + pl.idx + ' passed. New course ' + String(c).padStart(3, '0') + '°.', 'nav'); }
  // work with passive gear at this waypoint: set or haul, then any fishing hours with the jig
  if (w.act){ b.status = 'idle'; const why = w.act.op === 'cycle' ? gearCycle(w, w.fish) : w.act.op === 'haul' ? startHaul(w.act.sid, w.act.reset, w.fish) : startSet(w.act.kind, w.act.spec, w.fish); if (!why) return true; log(why[0], why[0]); if (!(w.fish > 0)) b.status = 'sailing'; }
  if (w.fish > 0 && S.tut && S.tut.v === 2 && !(S.haill && S.haill.type === 'luksus')){ b.status = 'idle'; b.v = 0; b.tutWait = w.fish; log('Fremme på feltet. Venter med fisket til haillen er hentet.', 'Arrived on the grounds. Waiting to fish until the luck is fetched.'); return true; }
  if (w.fish > 0){ b.status = 'fishing'; b.fishUntil = S.t + w.fish * 60; if (rigJig()) log('Fremme på feltet. Starter fiske i ' + w.fish + ' t.', 'Arrived on the grounds. Fishing for ' + w.fish + ' h.'); else log('Fremme. Båten er rigget for ' + rigName(rigOf()).toLowerCase() + ', så den ligger og venter i ' + w.fish + ' t.', 'Arrived. The boat is rigged for ' + rigName(rigOf()).toLowerCase() + ', so it waits for ' + w.fish + ' h.'); return true; }
  if (pl.idx >= pl.wps.length){ S.plan = null; b.status = 'idle'; b.v = 0; log('Fremme ved siste veipunkt. Ligger stille.', 'Reached the last waypoint. Stopped.'); return true; }
  return false;
}
function dock(pid){
  const b = S.boat, port = portById(pid); S.tripBuff = null; if (b.gop) gopAbort('dock');
  b.status = 'port'; b.port = pid; b.v = 0; b.fishUntil = null; b.pos = {x:port.p.x, y:port.p.y}; b.moorT = S.t; b.berth = 'main'; b.shift = b.fueling = b.after = null;
  const wasOps = S.plan && S.plan.ops;
  S.plan = null; S.trail = [{x:port.p.x, y:port.p.y, port:pid}];
  log('Fortøyd i ' + port.name + '.', 'Moored in ' + port.name + '.');
  tatTripEnd(pid);
  // the skipper starts landing and restocks straight away, on this vessel (a deferred call would act on whichever vessel is bound then)
  if (wasOps){ opsLanded(pid); if (typeof refreshAll === 'function') setTimeout(refreshAll, 0); }
}
// What the boat makes of the fish where it is, besides the fish itself: effort (people, jigs, machines, the team), weather and
// sea, cold, hands busy on deck, and the rod. fish() uses it, and so does the heat map's «Her nå» line.
function catchFactors(H, W, hs){
  // fishing feels the boat's motions (03c-stability.js): the wave height given, scaled by how she moves here
  const tb = S.tripBuff || {}, hw = hs * motionHere(H).f, wpen = Math.max(0.15, 1 - Math.max(0, hw - BOAT.risk[0] * 0.5) * 0.4 / (BOAT.risk[0] / 1.0) - Math.max(0, W - 8) * 0.03), eff = fishEffort() * (1 + (tb.jig ? 0.15 : 0) + (tb.reels && S.equip.jukse ? 0.1 : 0));
  // halibut is fished by hand on heavy gear: jigging machines do not help
  // the hands busy on deck are not at the rail: fishEffort counts only those at the Fiske station
  const keff = workTeam('fiske', 'juksa', 'fishing').sum;
  const rod = !!(typeof window !== 'undefined' && window.rodActive), cold = coldPen(H, hs), deck = 1;
  return {eff, keff, wpen, cold, deck, rod, pen:(1 - cold) * deck * (rod ? 0.5 : 1)};
}
function fish(H, W, hs){
  const b = S.boat;
  // working the deck instead of fishing: until the tub is empty, then fish on (or leave the grounds)
  if (b.deckStop){
    if (deckPending() > 0.5 && deckHands() > 0){ if (b.fishUntil != null && !b.deckEnd) b.fishUntil += 1; return; }
    b.deckStop = false; if (b.deckEnd){ const why = b.deckEnd; b.deckEnd = null; endFishing(why); return; }
    log('Ferdig på dekk. Fisker videre.', 'Deck work done. Fishing on.');
  }
  const tot = holdTotal(), done = !b.gop && b.fishUntil != null && S.t >= b.fishUntil, full = !b.gop && tot >= capHold() - 0.01;
  if (done || full){
    // alone, nobody can gut on the way: see to the catch before leaving the grounds
    if (S.settings.deckFirst !== false && handsAboard() < 2 && deckPending() > 0.5){ b.deckStop = true; b.deckEnd = full ? 'full' : 'done'; log('Tar unna fangsten før vi går videre.', 'Seeing to the catch before we move on.'); return; }
    endFishing(full ? 'full' : 'done'); return;
  }
  if (deckPending() >= tubCap()){ b.deckStop = true; log('Bløggekaret er fullt. Stopper fisket for å sløye og ise.', 'The bleeding tub is full. Stopping to gut and ice.'); crewSay(null, 'tubFull'); return; }
  // setting or hauling passive gear takes the place of jigging
  if (b.gop){ gearOpMinute(H, W, hs); return; }
  if (!rigJig()) return;   // rigged for passive gear: the boat has no jig out, and the fishing hours are spent waiting
  // vessels of 15 m or more may not fish inside the fjord line (høstingsforskriften): the boat waits
  if (BOAT.len >= 15 && insideFjord(b.pos)){ if ((S.fjordWarn || -1e9) < S.t - 720){ S.fjordWarn = S.t; log('Fartøy på 15 meter eller mer kan ikke fiske innenfor fjordlinja. Båten venter.', 'Vessels of 15 m or more may not fish inside the fjord line. The boat waits.'); } return; }
  const {eff, keff, wpen, pen, rod} = catchFactors(H, W, hs);
  if (!S.fsess || dist(S.fsess, b.pos) > 0.3) S.fsess = {x:b.pos.x, y:b.pos.y, t0:S.t, kg:0};
  let got = 0;
  if (rod && meAboard()) S.deckMe = (S.deckMe || 0) + 1;   // fishing by hand counts as your own work on deck
  let room = capHold() - tot, dsum = 0, tsum = 0, gotTop = 0;
  S.facc = S.facc || {}; S.fnext = S.fnext || {};
  for (const sp of SP){
    const dn = density(sp, b.pos, H); dsum += dn; tsum += tutBonus(sp, b.pos);
    S.facc[sp] = (S.facc[sp] || 0) + 30 * (S.target === 'kveite' && b.kgear ? keff : eff) * dn * luck(sp) * targetF(sp, H) * wpen * pen * (0.5 + Math.random()) / 60;
    if (!S.fnext[sp]) S.fnext[sp] = sampleFish(sp, b.pos, H);
    while (S.facc[sp] >= S.fnext[sp] && room > 0){
      const w = S.fnext[sp]; S.facc[sp] -= w; S.fnext[sp] = sampleFish(sp, b.pos, H);
      if (w < SPECIES[sp].minKg || (SPECIES[sp].maxKg && w > SPECIES[sp].maxKg) || (sp === 'kveite' && kveiteClosed(H))){ S.stats.released = (S.stats.released || 0) + 1; if (sp === 'kveite' && w >= SPECIES.kveite.minKg && (S.kvRel || -1e9) < S.t - 720){ S.kvRel = S.t; log('Slapp en kveite på ' + fmt(w, 0) + ' kg' + (kveiteClosed(H) ? ' (fredningstid).' : ' (over 200 cm).'), 'Released a ' + fmt(w, 0) + ' kg halibut' + (kveiteClosed(H) ? ' (closed season).' : ' (over 200 cm).')); } continue; }
      const kg = Math.min(w, room); room -= kg; addCatch(sp, kg, clsOf(sp, w), true); got += kg;
      if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp, kg, t:performance.now()}); }
    }
  }
  if (S.tut && S.tut.catch && room > 0){
    const left = Math.max(1, (b.fishUntil != null ? b.fishUntil : S.t) - S.t), want = (capHold() - holdTotal()) / left, mix = [['torsk', 0.72], ['sei', 0.18], ['hyse', 0.1]];
    for (let k = 0; got < want && room > 0.01 && k < 40; k++){
      let r = Math.random(), sp = mix[0][0]; for (const [s2, pw] of mix){ if (r < pw){ sp = s2; break; } r -= pw; }
      const w = sampleFish(sp, b.pos, H); if (w < SPECIES[sp].minKg || (SPECIES[sp].maxKg && w > SPECIES[sp].maxKg)) continue;
      const kg = Math.min(w, room); room -= kg; addCatch(sp, kg, clsOf(sp, w), true); got += kg; gotTop += kg;
      if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp, kg, t:performance.now()}); }
    }
    if (typeof window !== 'undefined') window.TUTTOP = (window.TUTTOP || 0) + gotTop;   // for the tests: how much the guarantee had to add
  }
  // only the stock's own share of the catch is taken from it: not the guide's skrei patch, nor what the guarantee tops up
  takeStock(b.pos, (got - gotTop) * (dsum > 0 ? Math.max(0, (dsum - tsum) / dsum) : 1)); S.fsess.kg += got; if (got > 0) (b.tripGear = b.tripGear || {}).juksa = 1;
  // cod quota: warn once a day when the cod on board already fills what is left
  const q = quotaState(), codHold = S.hold.filter(x => x.sp === 'torsk').reduce((a, x) => a + x.kg, 0);
  if (codHold > 0 && access() !== 'none' && q.torsk + codHold >= codLimitNow(H) && !ffPct(H) && (S.codWarn || -1e9) < S.t - 1440){ S.codWarn = S.t; log('Torskekvoten er full. Torsk du lander nå blir inndratt.', 'The cod quota is full. Cod you land now will be confiscated.'); }
}
function endFishing(why){
  const b = S.boat; b.fishUntil = null; b.deckStop = false; b.deckEnd = null;
  const fs = S.fsess; if (fs && S.t - fs.t0 >= 15){ S.marks.push({x:fs.x, y:fs.y, t:S.t, kgph:Math.round(fs.kg / ((S.t - fs.t0) / 60))}); if (S.marks.length > 80) S.marks.shift(); } S.fsess = null;
  if (b.gopQuiet){ b.gopQuiet = false; if (why === 'full') log('Lasten er full.', 'The hold is full.'); }
  else if (why === 'full') log('Lasten er full.', 'The hold is full.');
  else if (why === 'gear') log('Kan ikke fiske uten juksa.', 'Cannot fish without a jig line.');
  else log('Ferdig med fisket. ' + Math.round(holdTotal()) + ' kg om bord.', 'Finished fishing. ' + Math.round(holdTotal()) + ' kg on board.');
  if (S.plan && S.plan.idx < S.plan.wps.length) b.status = 'sailing';
  else { S.plan = null; b.status = 'idle'; }
}
// the fish is bled as it comes over the rail (a cut and into the bleeding tub, no time lost) and lies in the tub, round and not iced,
// until someone guts and ices it
function addCatch(sp, kg, cls, hook, opt){
  if (cls == null) cls = SPECIES[sp].ref;
  const bled = true, iced = false, gut = false, hr = Math.floor(S.t / 60), start = opt && opt.fresh != null ? opt.fresh : 100; hook = hook !== false;
  let x = S.hold.find(h => h.sp === sp && h.cls === cls && h.bled === bled && h.iced === iced && h.hr === hr && !!h.gut === gut && h.hook === hook);
  if (!x){ x = {sp, cls, kg:0, n:0, bled, iced, hr, fresh:start, gut, hook}; S.hold.push(x); }
  x.n = (x.n || 0) + 1;
  x.fresh = (x.fresh * x.kg + start * kg) / (x.kg + kg); x.kg += kg;
}
// ---- work on deck: gutting and icing take hands and time ----
// About 300 kg an hour per person to gut, wash and sort, and 800 to ice down (guesses: no good source for hand gutting was found).
// Alone you cannot gut while you steer or fish: fishing stops when the bleeding tub is full, or when you ask, and by default the catch
// is seen to before you leave the grounds. With two or more, one steers or fishes while the others work the deck.
const DECK = {gut:5, ice:800 / 60};
const tubCap = () => BOAT.tubCap || 150;
const handsAboard = () => (meAboard() ? 1 : 0) + crewAboard().length;
// the hands at the gutting and icing stations (core/13-work.js): under way one steers, fishing they follow their chains
function deckHands(){ return workAssign().filter(p => p.st === 'sloy' || p.st === 'is').length; }
// what is still to be done: gutting (when the catch is gutted on board) and icing (when there is ice)
// live crab is kept wet in tubs: it is neither gutted nor iced
function deckPending(){ const st = S.settings, icing = st.ice !== false && S.boat.ice > 0.5; return S.hold.reduce((a, x) => a + (!SPECIES[x.sp].live && ((st.gut && !x.gut && !x.iced) || (icing && !x.iced)) ? x.kg : 0), 0); }
function deckEta(hands){
  const st = S.settings, icing = st.ice !== false && S.boat.ice > 0.5, e = hands ? workTeam(['sloy', 'is'], 'sloy').sum : 0; if (!e) return Infinity;
  let m = 0; for (const x of S.hold){ if (SPECIES[x.sp].live) continue; if (st.gut && !x.gut && !x.iced) m += x.kg / DECK.gut; if (icing && !x.iced) m += x.kg / DECK.ice; } return m / e;
}
// move kg of a hold entry into the entry with the new state (gutted, iced), keeping its freshness
function moveKg(x, kg, patch){
  if (kg <= 0.001) return; const y0 = {...x, ...patch}, n = (x.n || 0) * kg / x.kg;
  let y = S.hold.find(h => h !== x && h.sp === y0.sp && h.cls === y0.cls && h.bled === y0.bled && h.iced === y0.iced && h.hr === y0.hr && !!h.gut === !!y0.gut && h.hook === y0.hook);
  if (!y){ y = {...y0, kg:0, n:0}; S.hold.push(y); }
  y.fresh = (y.fresh * y.kg + x.fresh * kg) / (y.kg + kg); y.kg += kg; y.n = (y.n || 0) + n; x.kg -= kg; x.n = (x.n || 0) - n;
  if (x.kg < 0.01) S.hold.splice(S.hold.indexOf(x), 1);
}
// a minute of deck work: gut first, then ice down what is gutted (or, when landing round, what is bled)
function deckMinute(){
  const b = S.boat, st = S.settings; if (!S.hold.length) return;
  const G = workTeam('sloy', 'sloy'), I = workTeam('is', 'is'); if (!G.n && !I.n) return;
  let pm = G.sum, worked = 0;
  if (st.gut) for (const x of S.hold.filter(x => !x.gut && !x.iced && !SPECIES[x.sp].live)){ if (pm <= 0.001) break; const kg = Math.min(x.kg, pm * DECK.gut); moveKg(x, kg, {gut:true}); pm -= kg / DECK.gut; worked += kg; }
  pm += I.sum;   // the gutters ice what they have gutted once the gutting is done
  if (st.ice !== false) for (const x of S.hold.filter(x => !x.iced && (x.gut || !st.gut) && !SPECIES[x.sp].live)){
    if (pm <= 0.001) break; const kg = Math.min(x.kg, pm * DECK.ice, b.ice / 0.3);
    if (kg <= 0.01){ if (S.t - (S.lastIceWarn || -1e9) > 120){ log('Tom for is. Fangsten ises ikke.', 'Out of ice. The catch is not being iced.'); S.lastIceWarn = S.t; } break; }
    moveKg(x, kg, {iced:true}); b.ice -= kg * 0.3; pm -= kg / DECK.ice; worked += kg;
  }
  // your own minutes on deck
  if (worked > 0 && (G.me || I.me)) S.deckMe = (S.deckMe || 0) + 1;
}
function risk(W, hs){
  const b = S.boat; if (b.status === 'port' || (S.tut && S.tut.catch)) return;
  const over = svcOverdue();
  if (over > 0 && b.status === 'sailing' && Math.random() < over * 0.02 / 60 && b.status !== 'engine'){ b.prev = b.status; b.status = 'engine'; b.engineUntil = S.t + 30 + Math.floor(Math.random() * 60); log('Motorstopp. Motoren trenger service.', 'Engine stopped. The engine needs a service.'); return; }
  const lvl = riskLevel(W, hs); if (!lvl) return;
  if (Math.random() >= [0, 0.05, 0.2][lvl] / 60) return;
  const r = Math.random();
  if (r < 0.4){
    const tot = holdTotal();
    if (tot > 5){
      const frac = 0.15 + Math.random() * 0.2;
      S.hold.forEach(x => x.kg *= (1 - frac)); S.hold = S.hold.filter(x => x.kg > 0.05);
      log('Tok inn sjø over ripa. Mistet ' + Math.round(tot * frac) + ' kg fisk.', 'Shipped water over the gunwale. Lost ' + Math.round(tot * frac) + ' kg of fish.'); loreWater();
    } else log('Tok inn sjø, men fikk lenset.', 'Shipped water, but bailed it out.');
  } else if (r < 0.65){
    if (b.status !== 'engine' && b.status !== 'adrift'){
      b.prev = b.status; b.status = 'engine'; b.engineUntil = S.t + 20 + Math.floor(Math.random() * 40);
      log('Motorstopp i grov sjø.', 'Engine failure in rough seas.');
    }
  } else if (r < 0.85){
    if (b.gear && b.status === 'fishing' && !b.gop){ b.gear = false; log('Mistet juksa i sjøen. Du fisker videre med stang.', 'Lost the jig line overboard. You carry on with the rod.'); }
    else log('Kraftig rulling, men ingen skade.', 'Heavy rolling, but no damage.');
  } else {
    if (lvl === 2) rescue(false); else log('Kraftig rulling, men ingen skade.', 'Heavy rolling, but no damage.');
  }
}
function hullRepair(){ const b = S.boat; if (!b.damage) return; b.damage = 0; const cost = Math.round(VESSELS[b.type].price * 0.035); S.cash -= cost; S.stats.costs += cost; queueJob({kind:'repair', h:8, no:'Reparasjon av skroget', en:'Hull repair'}); msg('Verkstedet', 'Skroget har fått skader etter grunnstøtingen. Reparasjonen koster ' + cost + ' kr og tar 8 timer.', 'The hull was damaged when you ran aground. The repair costs NOK ' + cost + ' and takes 8 hours.'); }
function svcOverdue(){ const b = S.boat; return Math.max(0, ((b.engH || 0) - (b.svcAt || 0)) / BOAT.svcH - 1); }
function rescue(keepCatch){
  if (S.boat.gop) gopAbort('return');
  const b = S.boat, port = nearestPort(b.pos), fee = S.member ? 0 : keepCatch ? PRICE.tow : PRICE.rescue;
  S.cash -= fee; S.stats.costs += fee;
  let lost = 0; if (!keepCatch){ lost = Math.round(holdTotal()); S.hold = []; }
  b.prev = null; b.tripBad = true; if (meAboard()) tatAdd('rescued', 1); dock(port.id); hullRepair();
  if (keepCatch) log('Slept inn til ' + port.name + '. Kostnad ' + fee + ' kr.', 'Towed to ' + port.name + '. Cost NOK ' + fee + '.');
  else log('Redningsskøyte slepte båten til ' + port.name + ' i farlig sjø. Kostnad ' + fee + ' kr, mistet ' + lost + ' kg fisk.', 'A rescue boat towed you to ' + port.name + ' in dangerous seas. Cost NOK ' + fee + ', lost ' + lost + ' kg of fish.');
}
