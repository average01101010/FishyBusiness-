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
// at home the boat lies at a quay face of the map data that fits her (npcBerths, 07-harbours.js), and goes from there to the way out
// over its first 450 m (and back); without one, off the harbour point as before (berthShift)
function fleetState(i, H){
  const s = fleetState0(i, H), f = FLEET[i], home = {x:f.hp[0], y:f.hp[1]};
  const mates = f.mates || (f.mates = FLEET.map((g, j) => ({key:'f' + j, L:g.L, B:g.B, T:g.T, home:g.home})).filter(g => g.home === f.home));
  const bp = npcBerths('fleet:' + f.home, home, mates)['f' + i];
  if (!bp){ s.p = berthShift(s.p, 'f' + i, false); return s; }
  if (s.st === 'port') return {p:bp.p, hd:bp.hd, st:'port', berth:bp.face};
  const d = dist(s.p, home); if (d < 0.45 && (s.st === 'out' || s.st === 'in')){ const u = d / 0.45; s.p = {x:bp.p.x + (s.p.x - bp.p.x) * u, y:bp.p.y + (s.p.y - bp.p.y) * u}; }
  return s;
}
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
      const Hc = day0 + T + kc * C, wd = (windDir(Hc) - gridGamma(spot) + 180) * Math.PI / 180; let run = (0.35 + 0.075 * windAt(Hc)) * NM * 0.62, end = st0, dd = wd;
      const ok = (a, b) => { for (let q = 1; q <= 8; q++){ const p = {x:a.x + (b.x - a.x) * q / 8, y:a.y + (b.y - a.y) * q / 8}; if (isLandFar(p) || coastDistFar(p) < 0.12) return false; } return true; };   // the core only: the fleet works anywhere
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
// ===== the NPC traffic along the coast (part 5 of the coast-wide plan, 03.10.2026; the user: full traffic along the coast, but only
// within the player's AIS range) =====
// The harbours, boats, grounds and routes come with the tiles' vec packs (tools/map/npc.py, 01c-vec.js t.npc), and where a boat is, is
// a function of the clock alone, as FLEET's: out in the morning from her berth to the harbour's mouth and along the route to one of
// her grounds, jigging there in drifts with the wind, home in the afternoon; in port in a gale (a bigger boat goes out in worse) or on
// a day off. Only the boats within AIS_KM of the boat you follow are worked out (coastNear), and their packs are asked for as she
// goes. They take no fish from the simulation's stock (only FLEET's do, which every player has).
const AIS_KM = 15;
const hodOf = H => { const g = gDate(H); return g.getUTCHours() + g.getUTCMinutes() / 60 + g.getUTCSeconds() / 3600; };
function coastState(b, H, hod = hodOf(H)){
  const i = b.seed || (b.seed = hashStr(b.id) % 1000003);
  const dep = 4 + hash(i * 13 + 5) * 4, e = ((hod - dep) % 24 + 24) % 24, day0 = H - e, dI = Math.floor((day0 + 6) / 24), G = b.h.grounds;
  const moored = b.moored || (b.moored = {p:b.p, hd:b.hd, st:'port'});
  // a day out is at most 17 hours (the weather is not asked at night)
  if (e > 17 || !G.length || hash(dI * 17 + i * 7) < 0.3 || windAt(day0) >= (b.L >= 15 ? 15 : b.L >= 12 ? 13.5 : 12)) return moored;
  const gr = G[Math.floor(hash(dI * 31 + i) * G.length)], R = gr.R || (gr.R = prepRoute(gr.pts.map(q => [q.x, q.y]))), RR = gr.RR || (gr.RR = prepRoute(gr.pts.map(q => [q.x, q.y]).reverse()));
  const cs = ((b.L >= 14 ? 9.8 : 7.8) + hash(i * 3 + 1) * 1.8) * clamp(1 - (hsOpen(day0) - 1.2) * 0.12, 0.65, 1) * NM, hsp = 5 * NM;
  const m0 = R.pts[0], t0 = dist(b.p, m0) / hsp, tr = R.len / cs, T = t0 + tr, fishH = 5 + hash(dI * 7 + i * 3) * 3.5;
  const along = (a, c, u) => ({p:{x:a.x + (c.x - a.x) * u, y:a.y + (c.y - a.y) * u}, hd:Math.atan2(c.x - a.x, -(c.y - a.y))});
  if (e < t0){ const q = along(b.p, m0, e / t0); return {p:q.p, hd:q.hd, st:'out'}; }
  if (e < T){ const a = atRoute(R, (e - t0) * cs); return {p:a.p, hd:a.hd, st:'out'}; }
  // on the ground: over to the boat's own spot, whole casts drifting off it (each cast ends where the next starts), back to the centre
  const spot = coastSpot(gr, dI, i), C = 0.75, nc = Math.max(1, Math.round(fishH / C)), fH = nc * C, tin = Math.max(1e-3, dist(gr.p, spot) / cs);
  if (e < T + tin){ const q = along(gr.p, spot, (e - T) / tin); return {p:q.p, hd:q.hd, st:'out'}; }
  if (e < T + tin + fH){
    const tf = e - T - tin, kc = Math.min(nc - 1, Math.floor(tf / C)), u = tf - kc * C, Hc = day0 + T + tin + kc * C, c = coastCast(b, gr, dI, i, kc, Hc, spot);
    if (u < 0.62){ const q = u / 0.62; return {p:{x:c.A.x + (c.E.x - c.A.x) * q, y:c.A.y + (c.E.y - c.A.y) * q}, hd:c.dir + Math.PI / 2, st:'fishing'}; }
    const nx = kc + 1 < nc ? coastCast(b, gr, dI, i, kc + 1, Hc + C, spot).A : gr.p, q = along(c.E, nx, Math.min(1, (u - 0.62) / 0.13)); return {p:q.p, hd:q.hd, st:'fishing'};
  }
  const eb = e - T - tin - fH;
  if (eb < tr){ const a = atRoute(RR, eb * cs); return {p:a.p, hd:a.hd, st:'in'}; }
  if (eb < tr + t0){ const q = along(m0, b.p, (eb - tr) / t0); return {p:q.p, hd:q.hd, st:'in'}; }
  return moored;
}
// land for the coast's boats: the 25 m mask where its pack is in, else the national core's 200 m (always there)
const coastFine = p => mapSimAt(p) && mapReadyAt(p, 0), coastLand = p => coastFine(p) ? isLand(p) : isLandFar(p);
// a point on land walks back toward the ground's centre (a ground is 20 m deep or more)
function seaward(p, c){ for (let s = 0; s < 4 && coastLand(p); s++) p = {x:p.x + (c.x - p.x) * 0.4, y:p.y + (c.y - p.y) * 0.4}; return coastLand(p) ? {x:c.x, y:c.y} : p; }
// the boat's own spot for the day: 0.3 to 1.2 km off the ground's centre (they spread over the ground instead of stacking on it)
function coastSpot(gr, dI, i){ const a = hash(dI * 53 + i * 19) * 2 * Math.PI, r = 0.3 + hash(dI * 61 + i * 23) * 0.9; return seaward({x:gr.p.x + Math.sin(a) * r, y:gr.p.y - Math.cos(a) * r}, gr.p); }
// one cast: its start A near the spot and the end E of the drift downwind (each boat slants it its own way), turned about, across or
// shortened when the drift would reach the land, else the boat lies still. Kept per boat and cast; asked again once the 25 m mask is in
function coastCast(b, gr, dI, i, kc, Hc, spot){
  const key = (dI * 4096 + kc) * 2 + (coastFine(spot) ? 1 : 0), M = b.cc || (b.cc = new Map());
  let c = M.get(key); if (c) return c;
  if (M.size > 8) M.clear();
  const A = seaward({x:spot.x + (hash(dI * 97 + i * 11 + kc) - 0.5) * 0.3, y:spot.y + (hash(dI * 89 + i * 5 + kc) - 0.5) * 0.3}, gr.p);
  const wd = (windDir(Hc) - gridGamma(gr.p) + 180) * Math.PI / 180 + (hash(i * 41 + 7) - 0.5) * 1.2, run = (0.35 + 0.075 * windAt(Hc)) * NM * 0.62;
  c = {A, E:A, dir:wd};
  out: for (const f of [1, 0.5]) for (const t of [0, Math.PI, Math.PI / 2, -Math.PI / 2]){
    const a = wd + t, E = {x:A.x + Math.sin(a) * run * f, y:A.y - Math.cos(a) * run * f};
    if ([0.33, 0.66, 1].some(u => coastLand({x:A.x + (E.x - A.x) * u, y:A.y + (E.y - A.y) * u}))) continue;
    c = {A, E, dir:a}; break out;
  }
  M.set(key, c); return c;
}
const COASTM = {k:'', v:[]};
function coastNear(H, only){
  const b = S && S.boat; if (!b || !b.pos || !MAPD.man) return [];
  const R = AIS_KM, x = b.pos.x, y = b.pos.y, F = R + 25, k = H + '|' + x.toFixed(2) + ',' + y.toFixed(2) + '|' + VEC.ver;
  if (!only && COASTM.k === k) return COASTM.v;
  vecWant(x - F, y - F, x + F, y + F); vecPrune([b.pos], 120);
  const out = [], hod = hodOf(H), hod1 = hodOf(H - 1 / 60);
  for (const t of vecTilesIn((x - F) * 1000, (y - F) * 1000, (x + F) * 1000, (y + F) * 1000)) for (const h of t.npc || []){
    // a harbour whose berths, routes and grounds all lie beyond the range is passed over (its reach: the farthest of them from its
    // middle, worked out once; a long waterfront is one harbour)
    if (h.reach === undefined){ h.reach = 0.3; for (const bt of h.boats) h.reach = Math.max(h.reach, dist(bt.p, h) + 0.1); for (const g of h.grounds) for (const q of g.pts.concat([g.p])) h.reach = Math.max(h.reach, dist(q, h) + 0.6); }
    if (dist(h, b.pos) - h.reach > R) continue;
    for (const bt of h.boats){
      if (only && only !== bt.id) continue;
      bt.h = h; const A = coastState(bt, H, hod); if (dist(A.p, b.pos) > R) continue;
      const P = A.st === 'port' ? A : coastState(bt, H - 1 / 60, hod1), dx = A.p.x - P.p.x, dy = A.p.y - P.p.y, sog = Math.hypot(dx, dy) / NM * 60;
      out.push({id:bt.id, name:bt.name, type:bt.L >= 14 ? 'kyst' : 'sjark', p:A.p, hd:A.hd, cog:sog > 0.15 ? Math.atan2(dx, -dy) : A.hd, v:Math.round(sog * 10) / 10, st:A.st, coast:true, L:bt.L, B:bt.B, T:bt.T, liv:bt.liv});
    }
  }
  if (!only){ COASTM.k = k; COASTM.v = out; }
  return out;
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
    out.push({id:'f' + i, name:f.n, type:f.L >= 14 ? 'kyst' : 'sjark', p:A.p, hd:A.hd, cog:sog > 0.15 ? Math.atan2(dx, -dy) : A.hd, v:Math.round(sog * 10) / 10, st:A.st, fleet:true, fi:i, L:f.L, B:f.B, liv:i % 4});
  });
  // the coast's boats within AIS range of the boat you follow (part 5)
  if (!only || only[0] === 'c') for (const n of coastNear(H, only)) out.push(n);
  // a boat in a mission: drifting with engine trouble, or on the tow line (09g-turer.js)
  if (!only || only[0] === 't') for (const n of turNpcs()) if (!only || only === n.id) out.push(n);
  // the other players' boats near by (the shared world V3, ui/10h-world.js)
  if (!only || only[0] === 'p') for (const n of peerStates()) if (!only || only === n.id) out.push(n);
  // the rescue boat on her way to you and with you on the tow
  if (!only || only === 'rs'){ const r = rescueAis(H); if (r) out.push(r); }
  return out;
}
// The other players' boats as the server last told them (ui/10h-world.js fills PEERS every 15 s: {id, boat, vtype, x, y, hd, v, st, liv,
// user, fs, at}: the owner's player name and sea time in points, core/09e-fartstid.js),
// carried on along their heading at their speed for up to 30 real seconds since they were heard, so they glide between reports. They
// look like the boat type they are (its length and beam pick the model, view3d.js npcKit) and carry the boat's name on the AIS.
const PEERS = [];
// The other players' sets standing in the sea near this boat (ui/10h-world.js, supabase gear_near): {k (garn, line, teine), a:{x, y}, b:{x, y}}, with
// nothing of the owner (tilbakemelding #35). The chart draws them in grey and the 3D view their buoys.
const PEERGEAR = [];
// another player's boat name goes into the chart's SVG and the AIS card as HTML, so nothing that could make markup is kept (the
// server strips the same, supabase/migrations/20261006020000_toplist.sql)
function peerName(s){ return String(s || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 24) || '–'; }
function peerStates(){
  const out = [], now = Date.now();
  for (const q of PEERS){
    const V = VESSELS[q.vtype] || VESSELS.trebat, dt = Math.min(30, Math.max(0, (now - q.at) / 1000)), moving = q.st === 'sailing' && q.v > 0.2;
    const d = moving ? q.v * NM * dt * GAME_RATE / 3600 : 0, p = {x:q.x + Math.sin(q.hd) * d, y:q.y - Math.cos(q.hd) * d};
    out.push({id:'p' + q.id, name:peerName(q.boat), type:V.len >= 11 ? 'kyst' : 'sjark', p, hd:q.hd, cog:q.hd, v:moving ? q.v : 0, st:q.st === 'fishing' ? 'fishing' : q.st === 'port' ? 'port' : 'out', player:true, vtype:q.vtype, L:V.len, B:V.beam || V.len / 3, liv:String(q.liv || '').slice(0, 160),
      user:q.user ? peerName(q.user).slice(0, 20) : '', fs:Math.max(0, +q.fs || 0)});
  }
  return out;
}

const hooks = {};
let S;
function newState(){
  const home = PORTS[0];
  // a new game begins at the world's minute (core/01-world.js), on the seed everyone shares
  return {v:2, frame:'utm33', t:WCLOCK.on ? worldT() : 0, lastReal:Date.now(), mult:1, lang:'no', cash:15000,
    boat:{type:'trebat', pos:{x:home.p.x, y:home.p.y}, heading:0, v:0, fuel:60, ice:0, gear:false, status:'port', port:home.id, prev:null, engineUntil:0, fishUntil:null, engH:0, svcAt:0},
    equip:{vhf:false, ais:false, plotter:false, chirp:false, sonar:false, jukse:0, motor90:false}, crew:[], loan:null, member:false, msgs:[], sales:[], order:null, owned:['trebat'], lic:null, qseed:WCLOCK.on ? WORLD_SEED : Math.floor(Math.random() * 1e9), fm:{n:0, last:-1, kr:0, b:false}, haill:null, haillInv:{haill:0, luksus:0}, pubE:-1e9, target:'mix', streak:null, clothes:{olje:0, varme:0}, orders:null, rep:{}, bors:null, cevt:null, workLog:[], stock:initStock(), marks:[], navrows:[], incidents:[], lore:{}, tattoos:{}, tat:{}, pgear:newPGear(), sets:[], gseq:0, ops:null, company:'', boatName:'', tut:0, jobs:[], prep:{}, tripBuff:null, draftDep:null,
    plan:null, draft:[], draftSpeed:16, trail:[{x:home.p.x, y:home.p.y, port:home.id}],
    settings:{deckFirst:true, autoOn:true, autoW:11, catchByWork:true},
    hold:[], log:[], market:{}, stats:{revenue:0, costs:0, trips:0, kg:0}, lastSale:null, fishPlanH:3, lastIceWarn:-1e9, intro:false};
}
const KEEP_MIN = 60 * 24 * 60;
function log(no, en, k){ if (VTAG && S.fleet && S.fleet.length > 1 && S.boatName){ no = S.boatName + ': ' + no; en = S.boatName + ': ' + en; } S.log.push(k ? {t:S.t, no, en, k} : {t:S.t, no, en}); while (S.log.length > 4000 || (S.log.length && S.log[0].t < S.t - KEEP_MIN)) S.log.shift(); if (hooks.onLog) hooks.onLog(); }
// the deck log: one line every full hour at sea, and a noon observation in port
function navHour(){
  const b = S.boat, H = S.t / 60, hr = gDate(H).getUTCHours();
  if (b.status === 'port' && hr !== 12) return;
  S.navrows.push({t:S.t, port:b.status === 'port' ? b.port : null, st:b.status, hd:Math.round(trueDeg(b.heading, b.pos)) % 360, v:Math.round((b.status === 'sailing' ? b.v : 0) * 10) / 10, x:Math.round(b.pos.x * 1000) / 1000, y:Math.round(b.pos.y * 1000) / 1000, W:Math.round(windAt(H) * 10) / 10, wd:Math.round(windDir(H)), hs:Math.round(hsAt(b.pos, H) * 10) / 10, vis:Math.round(visibility(H))});
  while (S.navrows.length && S.navrows[0].t < S.t - KEEP_MIN) S.navrows.shift();
}
const holdTotal = () => S.hold.reduce((a, x) => a + x.kg, 0);
function nearestPort(p){ let best = null, bd = 1e9; for (const q of PORTS){ const d = dist(p, q.p); if (d < bd){ bd = d; best = q; } } return best; }

function step(){
  if (!S.fleet || !S.fleet.length) ensureFleet();
  if (S.t % 60 === 0){ ordersTick(S.t / 60); turHour(); borsTick(S.t / 60); eachVessel(() => { crewTick(S.t / 60); if (!(S.jobs && S.jobs.some(j => j.kind === 'hull' && j.until))) foulHour(S.t / 60); }); }   // (no fouling while she is on the slip)
  S.t += 1; const H = S.t / 60;
  energyMinute();
  turMinute();   // a tow made fast (09g-turer.js)
  if (S.t % 60 === 0){ hourly(); eachVessel(navHour); eachVessel(loreHour); }
  if (S.t % 60 === 0) for (const pid in S.market) for (const sp in S.market[pid]) S.market[pid][sp] *= 0.97;
  if (S.t % 60 === 0 && S.stock) stockHour(H);
  if (S.t % 60 === 0) gearHour(H);
  if (S.t % 60 === 0){ seasonDay(H); pressDay(H); bkNews(H); }   // ... and the Greenland halibut's opening and stop (03d-quota.js)   // the seasons' news and the skrei festival (09c-seasons.js), a record price (09h-press.js)
  folkPort(H);                        // Edvard on the quay in the home harbour (09d-folk.js)
  eachVessel(() => vesselStep(H));
  achMinute();                        // the badges: rough weather, night fishing, players met (09f-merker.js)
  fsMinute();                         // sea time with you aboard (09e-fartstid.js)
}
// one vessel's minute: the catch keeps, the yard works, plans start, and the boat sails or fishes
function vesselStep(H){
  const b = S.boat;
  // a trim that has run its time (core BOOSTS): the speed goes back
  if (b.trim && !trimOn(b)){ const T = BOOSTS[b.trim.k]; delete b.trim; applyVessel(); if (T) log(T.no + ' er gått ut. Toppfarten er tilbake på ' + fmt(BOAT.vmax, 1) + ' knop.', 'The ' + T.en.toLowerCase() + ' has run out. Top speed is back at ' + fmt(BOAT.vmax, 1) + ' knots.'); }
  const clean = S.tripBuff && S.tripBuff.hold ? 0.75 : 1;
  workMinute();
  const kar = S.equip && S.equip.krabbekar;
  for (const x of S.hold){ const r = SPECIES[x.sp].live ? (kar ? 0.4 : 2.5) : x.bled ? (x.iced ? 0.9 : 3.0) : (x.iced ? 2.2 : 6.0); x.fresh = Math.max(0, x.fresh - r * clean / 60); }
  deckMinute();
  // work queue at the yard and on the quay: runs while the boat is in port
  if (S.jobs && S.jobs.length && b.status === 'port'){ let done = null; for (const j of S.jobs){ jobOk(j); if (j.until == null) j.until = S.t + j.h * 60; if (S.t >= j.until) (done = done || []).push(j); }
    if (done){ S.jobs = S.jobs.filter(j => !done.includes(j)); done.forEach(finishJob); } }   // all side by side (06-services.js queueJob)
  // the landing note comes when the catch is weighed in; the pump runs and the boat moves along the harbour
  if (b.land && S.t >= b.land.until) finishLanding();
  if (b.status === 'port'){ quayMinute(); shoreTick(); }
  opsStep(H);
  // planned departure
  if (S.plan && S.plan.depAt && S.t >= S.plan.depAt && (b.status === 'port' || b.status === 'idle')){
    const W0 = windAt(H);
    if (portBusy(b)){ S.plan.depAt = portBusy(b) + 1; log('Avgangen venter til arbeidet på kaia er ferdig.', 'Departure waits until the work at the quay is done.'); }
    else if (S.jobs && S.jobs.length && b.status === 'port'){ S.plan.depAt = (jobsDone() || S.t) + 1; log('Avgangen venter til verkstedet er ferdig.', 'Departure waits until the yard is done.'); }
    else if (S.settings.autoOn && W0 > S.settings.autoW && (S.plan.delays || 0) < 12){ S.plan.depAt += 60; S.plan.delays = (S.plan.delays || 0) + 1; log('Avgangen er utsatt en time. Vinden er ' + W0.toFixed(0) + ' m/s.', 'Departure postponed an hour. The wind is ' + W0.toFixed(0) + ' m/s.'); }
    else depart();
  }
  if (b.status === 'unmooring'){ if (S.t >= b.castUntil){ const pid = b.port, q = quayPos(b), kind = berthKind(b); b.pos = {x:q.x, y:q.y}; b.status = 'sailing'; b.port = null; helmCastDone(pid, kind); } return; }
  if (b.status === 'port'){ if (b.landWait && b.port === b.landWait && mottakOpen(H)){ const pid = b.landWait; b.landWait = null; opsLanded(pid); } return; }
  if (b.status === 'tow'){ towStep(H); return; }        // the rescue boat comes and tows (rescue)
  const W = windAt(H), hs = hsAt(b.pos, H);
  if (['sailing', 'fishing', 'idle'].includes(b.status)) stabTick(H);
  if (b.status === 'engine' && S.t >= b.engineUntil){ b.status = b.prev || 'idle'; b.prev = null; log('Motoren startet igjen.', 'The engine is running again.'); }
  // the first trip waits in port for wind (the departure is put off) but does not turn back once out
  if (b.tutWait && (b.status !== 'idle' || (S.haill && S.haill.type === 'luksus'))){ if (b.status === 'idle'){ b.status = 'fishing'; b.fishUntil = S.t + b.tutWait * 60; log('Haillen er om bord. Starter fiske i ' + b.tutWait + ' t.', 'The luck is aboard. Fishing for ' + b.tutWait + ' h.'); } b.tutWait = null; }
  // you are asleep alone aboard: nobody steers or fishes, and the boat drifts (core/15-energy.js)
  if (sleepAlone() && ['sailing', 'fishing', 'idle'].includes(b.status)){ sleepDrift(H); risk(W, hs); return; }
  // (with the hand on the helm the skipper decides: no turning back by itself, 16-helm.js)
  if (S.settings.autoOn && W > S.settings.autoW && ['sailing','fishing','idle'].includes(b.status) && !(S.plan && S.plan.returning) && !(S.tut && S.tut.catch) && !helmOn()){
    startReturn(true, W);
  }
  if (b.status === 'sailing' || b.status === 'fishing') b.engH = (b.engH || 0) + (b.status === 'sailing' ? 1 : 0.25) / 60;
  if (b.status === 'sailing'){ if (!helmOn()){ const p0 = b.pos; sail(H, W, hs); if (meAboard()) tatAdd('nm', dist(p0, b.pos) / NM); } }   // by hand she moves every tick (helmStep)
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
  // brake before the next stop (a harbour or a fishing spot) or the route's end along the route, not when leaving
  let rem = 0, p0 = b.pos, stop = false; for (let i = pl.idx; i < pl.wps.length; i++){ const w = pl.wps[i]; rem += dist(p0, w); p0 = w; if (wpStop(w) || i === pl.wps.length - 1){ stop = true; break; } if (rem > 3) break; }
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
  obsSail(pl, b);   // round a bridge's pier, a pier or a mark on the leg ahead (11b-obstacles.js)
  while (left > 1e-9 && pl.idx < pl.wps.length){
    const w = pl.wps[pl.idx], d = dist(b.pos, w);
    if (d > 1e-6) b.heading = Math.atan2(w.x - b.pos.x, -(w.y - b.pos.y));
    const to = d <= left ? {x:w.x, y:w.y} : {x:b.pos.x + (w.x - b.pos.x) / d * left, y:b.pos.y + (w.y - b.pos.y) / d * left}, gp = groundCheck(b.pos, to);
    if (gp){ runAground(gp); return; }
    if (d <= left){ b.pos = to; left -= d; if (arrive(w)) return; }
    else { b.pos = to; left = 0; }
  }
}
// «Stopp» under way: the route from here to a point a little ahead on it, far enough to slack off and stop there (about a boat's
// stopping way at the speed she has; Jonas 06.10.2026: not «bråstoppe»). The 3D boat follows it and stops exactly on the point;
// need (km) is how far ahead she needs it to stop gently from where she is on the screen (G3.haltNeed).
function haltPlan(need){
  const b = S.boat, pl = S.plan; if (!pl || b.status !== 'sailing' || pl.idx >= pl.wps.length) return null;
  let left = Math.max(clamp((b.v || 0) * 0.012, 0.03, 0.3), need || 0), p0 = b.pos; const wps = [];
  for (let i = pl.idx; i < pl.wps.length; i++){
    const w = pl.wps[i], d = dist(p0, w);
    if (d >= left || w.port || i === pl.wps.length - 1){ const f = Math.min(1, left / Math.max(d, 1e-9)); wps.push({x:p0.x + (w.x - p0.x) * f, y:p0.y + (w.y - p0.y) * f}); break; }
    wps.push({x:w.x, y:w.y}); left -= d; p0 = w;
  }
  return {wps, idx:0, speed:pl.speed, returning:false, depAt:null, unsafe:[], halt:true};
}
function arrive(w){
  const b = S.boat, pl = S.plan;
  S.trail.push({x:w.x, y:w.y, port:w.port || null});
  if (w.port){ dock(w.port, w.berth); return true; }
  pl.idx++;
  if (!(w.fish > 0) && pl.idx < pl.wps.length){ const nw = pl.wps[pl.idx], c = Math.round(trueDeg(Math.atan2(nw.x - w.x, -(nw.y - w.y)), w)) % 360; log('WP' + pl.idx + ' passert. Ny kurs ' + String(c).padStart(3, '0') + '°.', 'WP' + pl.idx + ' passed. New course ' + String(c).padStart(3, '0') + '°.', 'nav'); }
  // work with passive gear at this waypoint: set or haul, then any fishing hours with the jig
  if (w.act){ b.status = 'idle'; const why = w.act.op === 'cycle' ? gearCycle(w, w.fish) : w.act.op === 'haul' ? startHaul(w.act.sid, w.act.reset, w.fish) : startSet(w.act.kind, w.act.spec, w.fish); if (!why) return true; log(why[0], why[0]); if (!(w.fish > 0)) b.status = 'sailing'; }
  if (w.fish > 0 && S.tut && S.tut.v === 2 && !(S.haill && S.haill.type === 'luksus')){ b.status = 'idle'; b.v = 0; b.tutWait = w.fish; log('Fremme på feltet. Venter med fisket til haillen er hentet.', 'Arrived on the grounds. Waiting to fish until the luck is fetched.'); return true; }
  if (w.fish > 0){ b.status = 'fishing'; b.fishUntil = S.t + w.fish * 60; if (rigJig()) log('Fremme på feltet. Starter fiske i ' + w.fish + ' t.', 'Arrived on the grounds. Fishing for ' + w.fish + ' h.'); else log('Fremme. Båten er rigget for ' + rigName(rigOf()).toLowerCase() + ', så den ligger og venter i ' + w.fish + ' t.', 'Arrived. The boat is rigged for ' + rigName(rigOf()).toLowerCase() + ', so it waits for ' + w.fish + ' h.'); return true; }
  if (pl.idx >= pl.wps.length){ S.plan = null; b.status = 'idle'; b.v = 0; if (pl.halt) log('Stoppet båten.', 'Stopped the boat.'); else log('Fremme ved siste veipunkt. Ligger stille.', 'Reached the last waypoint. Stopped.'); return true; }
  return false;
}
function dock(pid, berth){
  const b = S.boat, port = portById(pid); S.tripBuff = null; if (b.gop) gopAbort('dock');
  if (port.rorbu) rorbuSite(port);   // its berth is found before the boat is put there (07d-rorbu.js)
  b.status = 'port'; b.port = pid; b.v = 0; b.fishUntil = null; b.pos = {x:port.p.x, y:port.p.y}; b.moorT = S.t; b.shift = b.fueling = b.after = null;
  b.berth = berth === 'naust' && quayFace(pid, 'naust') ? 'naust' : 'main';   // a route can end at Father's naust (07c-naust.js)
  const wasOps = S.plan && S.plan.ops;
  S.plan = null; S.trail = [{x:port.p.x, y:port.p.y, port:pid}];
  if (b.berth === 'naust') log('Fortøyd ved naustet i ' + port.name + '.', 'Moored at the boathouse in ' + port.name + '.');
  else if (port.rorbu) log('Fortøyd ved rorbua i ' + port.name + '.', 'Moored at the rorbu in ' + port.name + '.');   // 07d-rorbu.js
  else log('Fortøyd i ' + port.name + '.', 'Moored in ' + port.name + '.');
  tatTripEnd(pid);
  turDock(pid);   // freight picked up or delivered (09g-turer.js)
  // the skipper starts landing and restocks straight away, on this vessel (a deferred call would act on whichever vessel is bound then)
  if (wasOps && !port.rorbu){ opsLanded(pid); if (typeof refreshAll === 'function') setTimeout(refreshAll, 0); }
}
// What the boat makes of the fish where it is, besides the fish itself: effort (people, jigs, machines, the team), weather and
// sea, cold, hands busy on deck, and your own share while you play the jig game. fish() uses it, and so does the heat map's «Her nå» line.
function catchFactors(H, W, hs){
  // fishing feels the boat's motions (03c-stability.js): the wave height given, scaled by how she moves here
  const tb = S.tripBuff || {}, hw = hs * motionHere(H).f, wpen = Math.max(0.15, 1 - Math.max(0, hw - BOAT.risk[0] * 0.5) * 0.4 / (BOAT.risk[0] / 1.0) - Math.max(0, W - 8) * 0.03), eff = fishEffort() * (1 + (tb.jig ? 0.15 : 0) + (tb.reels && S.equip.jukse ? 0.1 : 0));
  // halibut is fished by hand on heavy gear: jigging machines do not help
  // the hands busy on deck are not at the rail: fishEffort counts only those at the Fiske station
  const keff = workTeam('fiske', 'juksa', 'fishing').sum;
  // playing the jig game, your own share comes through your bites (ui/10-rod-acts.js) and is left out here
  const jig = !!(typeof window !== 'undefined' && window.jigActive), share = jig ? jigMeShare() : 0, cold = coldPen(H, hs), deck = 1;
  return {eff, keff, wpen, cold, deck, jig, pen:(1 - cold) * deck * (1 - share)};
}
function fish(H, W, hs){
  const b = S.boat;
  // working the deck instead of fishing: until the tub is empty, then fish on (or leave the grounds)
  if (b.deckStop){
    if (deckPending() > 0.5 && deckHands() > 0){ if (b.fishUntil != null && !b.deckEnd) b.fishUntil += 1; return; }
    b.deckStop = false; if (b.deckEnd){ const why = b.deckEnd; b.deckEnd = null; endFishing(why); return; }
    log('Ferdig på dekk. Fisker videre.', 'Deck work done. Fishing on.'); if (hooks.onDeck && !VTAG) hooks.onDeck('go');
  }
  const tot = holdTotal(), done = !b.gop && b.fishUntil != null && S.t >= b.fishUntil, full = !b.gop && tot >= capHold() - 0.01;
  if (done || full){
    // alone, nobody can gut on the way: see to the catch before leaving the grounds
    if (S.settings.deckFirst !== false && handsAboard() < 2 && deckPending() > 0.5){ b.deckStop = true; b.deckEnd = full ? 'full' : 'done'; log('Tar unna fangsten før vi går videre.', 'Seeing to the catch before we move on.'); return; }
    endFishing(full ? 'full' : 'done'); return;
  }
  if (deckPending() >= tubCap()){ b.deckStop = true; log('Bløggekaret er fullt. Stopper fisket for å sløye og ise.', 'The bleeding tub is full. Stopping to gut and ice.'); crewSay(null, 'tubFull'); if (hooks.onDeck && !VTAG) hooks.onDeck('stop'); return; }
  // setting or hauling passive gear takes the place of jigging
  if (b.gop){ gearOpMinute(H, W, hs); return; }
  if (!rigJig()) return;   // rigged for passive gear: the boat has no jig out, and the fishing hours are spent waiting
  // where the rules stop the boat (03e-rules.js: the fjord lines by length, the baseline zones of J-161-2026 § 32, closed areas): it waits
  { const rq = {p:b.pos, len:BOAT.len, gear:'juksa', sp:S.target === 'kveite' ? 'kveite' : null, hand:!(S.equip && S.equip.jukse > 0)}, rb = (S.ruAt && S.ruAt.t > S.t - 10 && dist(S.ruAt.p, b.pos) < 0.05) ? S.ruAt.m : ruBlockMsg(rq);
    S.ruAt = {t:S.t, p:{x:b.pos.x, y:b.pos.y}, m:rb};
    if (rb){ if ((S.fjordWarn || -1e9) < S.t - 720){ S.fjordWarn = S.t; log(rb + ' Båten venter.', rb + ' The boat waits.'); } return; } }
  const {eff, keff, wpen, pen, jig} = catchFactors(H, W, hs);
  if (!S.fsess || dist(S.fsess, b.pos) > 0.3) S.fsess = {x:b.pos.x, y:b.pos.y, t0:S.t, kg:0};
  let got = 0;
  if (jig && meAboard()) S.deckMe = (S.deckMe || 0) + 1;   // jigging by hand counts as your own work on deck
  let room = capHold() - tot, dsum = 0, tsum = 0, gotTop = 0;
  S.facc = S.facc || {}; S.fnext = S.fnext || {};
  for (const sp of SP){
    const dn = density(sp, b.pos, H); dsum += dn; tsum += tutBonus(sp, b.pos);
    S.facc[sp] = (S.facc[sp] || 0) + 30 * (S.target === 'kveite' && b.kgear ? keff : eff) * dn * luck(sp) * targetF(sp, H) * noteBoost(sp, b.pos) * (SPECIES[sp].jig != null ? SPECIES[sp].jig : 1) * wpen * pen * (0.5 + Math.random()) / 60;   // jig: what the jig takes of a species (the Greenland halibut next to none)
    if (!S.fnext[sp]) S.fnext[sp] = sampleFish(sp, b.pos, H);
    while (S.facc[sp] >= S.fnext[sp] && room > 0){
      const w = S.fnext[sp]; S.facc[sp] -= w; S.fnext[sp] = sampleFish(sp, b.pos, H);
      if (w < SPECIES[sp].minKg || (SPECIES[sp].maxKg && w > SPECIES[sp].maxKg) || (sp === 'kveite' && kveiteClosed(H))){ S.stats.released = (S.stats.released || 0) + 1; if (sp === 'kveite' && w >= SPECIES.kveite.minKg && (S.kvRel || -1e9) < S.t - 720){ S.kvRel = S.t; log('Slapp en kveite på ' + fmt(w, 0) + ' kg' + (kveiteClosed(H) ? ' (fredningstid).' : ' (over 200 cm).'), 'Released a ' + fmt(w, 0) + ' kg halibut' + (kveiteClosed(H) ? ' (closed season).' : ' (over 200 cm).')); } continue; }
      const kg = Math.min(w, room); room -= kg; addCatch(sp, kg, clsOf(sp, w), true); got += kg;
      if (typeof window !== 'undefined'){ const cq = window.CATCHQ || (window.CATCHQ = []); if (cq.length < 30) cq.push({sp, kg, t:performance.now()}); }
    }
  }
  if (!(S.tut && S.tut.catch)) dreamTick(H, b.pos, room);   // Father's marks and the dream fish (09b-dream.js)
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
  festCatch(sp, kg);   // the skrei festival's biggest cod (09c-seasons.js)
  achCatch(sp, cls);   // «Storfisken» (09f-merker.js)
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
function deckPending(){ const cg = catchGut(), icing = catchIce() && S.boat.ice > 0.5; return S.hold.reduce((a, x) => a + (!SPECIES[x.sp].live && ((cg && !x.gut && !x.iced) || (icing && !x.iced)) ? x.kg : 0), 0); }
function deckEta(hands){
  const cg = catchGut(), icing = catchIce() && S.boat.ice > 0.5, e = hands ? workTeam(['sloy', 'is'], 'sloy').sum : 0; if (!e) return Infinity;
  let m = 0; for (const x of S.hold){ if (SPECIES[x.sp].live) continue; if (cg && !x.gut && !x.iced) m += x.kg / DECK.gut; if (icing && !x.iced) m += x.kg / DECK.ice; } return m / e;
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
  const b = S.boat, cg = catchGut(); if (!S.hold.length) return;
  const G = workTeam('sloy', 'sloy'), I = workTeam('is', 'is'); if (!G.n && !I.n) return;
  let pm = G.sum, worked = 0;
  if (cg) for (const x of S.hold.filter(x => !x.gut && !x.iced && !SPECIES[x.sp].live)){ if (pm <= 0.001) break; const kg = Math.min(x.kg, pm * DECK.gut); moveKg(x, kg, {gut:true}); pm -= kg / DECK.gut; worked += kg; }
  pm += I.sum;   // the gutters ice what they have gutted once the gutting is done
  if (catchIce()) for (const x of S.hold.filter(x => !x.iced && (x.gut || !cg) && !SPECIES[x.sp].live)){
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
    if (b.gear && b.status === 'fishing' && !b.gop){ b.gear = false; log('Mistet juksa i sjøen. Uten juksa fisker bare juksamaskinene. Kjøp ny juksa i butikken.', 'Lost the jig line overboard. Without a jig only the reels fish. Buy a new jig in the shop.'); if (typeof window !== 'undefined' && window.JIGG) window.JIGG.stop(); }
    else log('Kraftig rulling, men ingen skade.', 'Heavy rolling, but no damage.');
  } else {
    if (lvl === 2) rescue(false); else log('Kraftig rulling, men ingen skade.', 'Heavy rolling, but no damage.');
  }
}
function hullRepair(){ const b = S.boat; if (!b.damage) return; b.damage = 0; const full = Math.round(VESSELS[b.type].price * 0.035), first = freeFirst('rep'), cost = first ? 0 : full; S.cash -= cost; S.stats.costs += cost; queueJob({kind:'repair', h:8, no:'Reparasjon av skroget', en:'Hull repair'});
  if (first) msg('Verkstedet', 'Skroget har fått skader etter grunnstøtingen. Den første reparasjonen tar vi gratis, den tar 8 timer. Neste gang koster den ' + full + ' kr. Følg dybdene i kartet og hold avstand til skjær og grunner.', 'The hull was damaged when you ran aground. The first repair is on us; it takes 8 hours. Next time it costs NOK ' + full + '. Watch the depths on the chart and keep clear of rocks and shoals.');
  else msg('Verkstedet', 'Skroget har fått skader etter grunnstøtingen. Reparasjonen koster ' + cost + ' kr og tar 8 timer.', 'The hull was damaged when you ran aground. The repair costs NOK ' + cost + ' and takes 8 hours.'); }
function svcOverdue(){ const b = S.boat; return Math.max(0, ((b.engH || 0) - (b.svcAt || 0)) / BOAT.svcH - 1); }
// ---------- the rescue boat (plan E3, 05.10.2026) ----------
// It is called out from the nearest rescue station (the nearest harbour beyond 60 km of one), musters in TOW.muster minutes, comes at 25
// knots by the fairway, makes fast and tows you at 6 knots to the nearest harbour. The catch is kept with a tow and lost in a distress
// call; the cost is paid at the call. The ways are found by leiaRoute while the crew musters (TOWBUSY); a straight line when none is
// found. towPose gives where the rescue boat and your boat are between the minutes for the 3D (tools/boats/redning.py) and livePose.
const TOW = {come:25, tow:6, muster:10, hook:5, line:0.06};
// The rescue stations along the whole coast (Jonas 07.10.2026: «stasjonert på strategiske plasser langs hele kysten slik at redningen
// alltid er relativt nær»): the towns of Redningsselskapet's stations from Hvaler to Kirkenes, about 50–100 km apart along the coast
// (redningsselskapet.no, Stasjoner; the list is the towns, not each station's boats, and to be checked against it). A station sails
// from the game's harbour nearest its town (within 35 km) and goes by that harbour's name; one without a harbour near (the inner
// Oslofjord has no fish plant) is left out, and two by the same harbour are one. Finnsnes and Gryllefjord are Senja's own harbours.
const RSTATIONS = [['Hvaler', 59.06, 11.02], ['Horten', 59.42, 10.48], ['Stavern', 59.00, 10.04], ['Kragerø', 58.87, 9.41], ['Arendal', 58.46, 8.77],
  ['Kristiansand', 58.15, 8.00], ['Farsund', 58.10, 6.80], ['Egersund', 58.45, 5.99], ['Tananger', 58.94, 5.58], ['Skudeneshavn', 59.15, 5.26],
  ['Haugesund', 59.41, 5.27], ['Bømlo', 59.78, 5.20], ['Bergen', 60.39, 5.32], ['Fedje', 60.78, 4.72], ['Florø', 61.60, 5.03], ['Måløy', 61.93, 5.11],
  ['Ålesund', 62.47, 6.15], ['Bud', 62.91, 6.91], ['Kristiansund', 63.11, 7.73], ['Frøya', 63.73, 8.83], ['Rørvik', 64.86, 11.24], ['Brønnøysund', 65.47, 12.21],
  ['Sandnessjøen', 66.02, 12.63], ['Ørnes', 66.87, 13.70], ['Bodø', 67.28, 14.40], ['Værøy', 67.67, 12.69], ['Ballstad', 68.07, 13.54], ['Svolvær', 68.23, 14.57],
  ['Andenes', 69.32, 16.12], ['Harstad', 68.80, 16.54], ['Finnsnes', 'finnsnes'], ['Gryllefjord', 'gryllefjord'], ['Tromsø', 69.65, 18.96],
  ['Skjervøy', 70.03, 20.97], ['Øksfjord', 70.24, 22.35], ['Hammerfest', 70.66, 23.68], ['Havøysund', 70.99, 24.66], ['Honningsvåg', 70.98, 25.97],
  ['Mehamn', 71.04, 27.85], ['Berlevåg', 70.86, 29.09], ['Båtsfjord', 70.63, 29.72], ['Vardø', 70.37, 31.11], ['Kirkenes', 69.73, 30.05]];
let RSBASES = null;
function rescueBases(){
  if (RSBASES) return RSBASES; RSBASES = [];
  for (const [n, a, b] of RSTATIONS){
    let q = typeof a === 'string' ? portById(a) : null;
    if (!q && typeof a === 'number'){ const c = natP(a, b); let bd = 35; for (const pt of PORTS){ const d = dist(pt.p, c); if (d < bd){ bd = d; q = pt; } } }
    if (q && !RSBASES.some(r => r.id === q.id)) RSBASES.push({n:q.name, id:q.id, p:q.p, st:n});
  }
  return RSBASES;
}
function rescueBase(p){
  let best = null;
  for (const r of rescueBases()){ const d = dist(r.p, p); if (!best || d < best.d) best = {n:r.n, id:r.id, p:r.p, d}; }
  if (!best || best.d > 100){ const q = nearestPort(p); best = {n:q.name, id:q.id, p:q.p, d:dist(q.p, p)}; }
  return best;
}
// the rescue boat on the AIS while she is out for you, from the call to the quay (not at her station otherwise)
function rescueAis(H){
  const t = S.boat && S.boat.tow, q = t && towPose(clamp(H * 60 - S.t, 0, 0.999)); if (!q) return null;
  return {id:'rs', name:'Redningsskøyta ' + t.base, type:'rescue', p:q.r.p, hd:q.r.hd, cog:q.r.hd, v:q.r.v, st:t.ph === 'muster' ? 'port' : t.ph, rs:true, base:t.base, to:t.port};
}
function rescue(keepCatch){
  if (S.boat.gop) gopAbort('return');
  // the first is free, with the catch kept (core/09f-merker.js freeFirst; Jonas 07.10.2026: learn without the consequences)
  const first = !S.member && freeFirst('tow'); if (first) keepCatch = true;
  const b = S.boat, port = nearestPort(b.pos), base = rescueBase(b.pos), fee = S.member || first ? 0 : keepCatch ? PRICE.tow : PRICE.rescue;
  if (first) msg('Redningsselskapet', 'Det første slepet er gratis, og fangsten får du beholde. Neste gang koster et slep ' + kr(PRICE.tow) + ', og et nødanrop i farlig sjø ' + kr(PRICE.rescue) + ' og fangsten. Hold øye med dieselen og værmeldingen. Som medlem slipper du å betale.',
    'The first tow is free, and you keep the catch. Next time a tow costs ' + kr(PRICE.tow) + ', and a distress call in dangerous seas ' + kr(PRICE.rescue) + ' and the catch. Keep an eye on the diesel and the forecast. Members pay nothing.');
  S.cash -= fee; S.stats.costs += fee;
  let lost = 0; if (!keepCatch){ lost = Math.round(holdTotal()); S.hold = []; }
  b.prev = null; b.tripBad = true; if (meAboard()){ tatAdd('rescued', 1); checkTattoos(); }
  const t = {ph:'muster', t0:S.t, keep:keepCatch, fee, lost, port:port.id, base:base.n, baseId:base.id, bp:{x:base.p.x, y:base.p.y}, at:{x:b.pos.x, y:b.pos.y}, P1:null, P2:null, r:0, s:0};
  if (b.status === 'port' || b.status === 'unmooring'){ t.port = b.port || port.id; towDone(t); return; }
  if (helmOn()) helmOff();
  S.plan = null; b.v = 0; b.status = 'tow'; b.tow = t;
  pressPut('rescue', {base:base.id, port:port.id, type:b.type});   // Kystposten (09h-press.js)
  towRoutes(b);
  const eta = Math.round(base.d / (TOW.come * NM) * 60) + TOW.muster;
  log('Redningsskøyta går fra ' + base.n + ' og er hos deg om rundt ' + eta + ' min. Den sleper deg til ' + port.name + '.', 'The rescue boat leaves ' + base.n + ' and will be with you in about ' + eta + ' min. It tows you to ' + port.name + '.');
}
const TOWBUSY = new Set(), TOWR = new WeakMap();
const towR = (t, k) => { let r = TOWR.get(t[k]); if (!r){ r = prepRoute(t[k]); TOWR.set(t[k], r); } return r; };
// a point at sea by p: a boat on the rocks is towed off from the nearest water
function towSea(p){
  try { if (!isLand(p)) return p;
    for (let r = 0.025; r <= 0.4; r += 0.025) for (let k = 0; k < 16; k++){ const a = k / 16 * Math.PI * 2, q = {x:p.x + Math.sin(a) * r, y:p.y - Math.cos(a) * r}; if (!isLand(q)) return q; } } catch (e){}
  return p;
}
function towRoutes(b){
  const t = b.tow; if (!t || TOWBUSY.has(t)) return; TOWBUSY.add(t);
  const port = portById(t.port), sea = towSea(t.at), arr = w => w.map(q => [Math.round(q.x * 1e5) / 1e5, Math.round(q.y * 1e5) / 1e5]);
  const way = (a, c, aP, cP) => { let pr; try { pr = leiaRoute(a, c, aP, cP); } catch (e){ pr = Promise.resolve(null); }
    return pr.then(r => r && r.wps && !r.why ? [a].concat(r.wps) : [a, c]).catch(() => [a, c]); };
  Promise.all([way(t.bp, sea, t.baseId, null), way(sea, port.p, null, port.id)]).then(([w1, w2]) => {
    TOWBUSY.delete(t); if (b.tow !== t) return;
    t.P1 = arr(w1); t.P2 = arr(dist(sea, t.at) > 0.002 ? [t.at].concat(w2) : w2);
  });
}
// one minute of the rescue: the crew musters while the ways are found, the boat comes, makes fast, and tows
function towStep(H){
  const b = S.boat, t = b.tow;
  if (!t){ b.status = 'idle'; return; }
  b.v = 0;
  if (!t.P1 || !t.P2){ towRoutes(b); return; }
  const R1 = towR(t, 'P1'), R2 = towR(t, 'P2'), km = k => k * NM / 60, stop = Math.max(0, R1.len - TOW.line);
  if (t.ph === 'muster'){ if (S.t - t.t0 >= TOW.muster){ t.ph = 'come'; t.r = 0; } else return; }
  if (t.ph === 'come'){ t.r = Math.min(stop, t.r + km(TOW.come)); if (t.r >= stop - 1e-9){ t.ph = 'hook'; t.th = S.t; log('Redningsskøyta er fremme og setter slepet.', 'The rescue boat is here and makes the tow fast.'); } return; }
  if (t.ph === 'hook'){ if (S.t - t.th >= TOW.hook){ t.ph = 'tow'; t.s = 0; } return; }
  t.s = Math.min(R2.len, t.s + km(TOW.tow)); const a = atRoute(R2, t.s); b.pos = {x:a.p.x, y:a.p.y}; b.heading = a.hd; b.v = TOW.tow;
  if (R2.len - t.s < 0.02) towDone(t);
}
function towDone(t){
  const b = S.boat, port = portById(t.port); b.tow = null; TOWBUSY.delete(t); dock(port.id); hullRepair();
  if (t.keep) log('Slept inn til ' + port.name + '. Kostnad ' + t.fee + ' kr.', 'Towed to ' + port.name + '. Cost NOK ' + t.fee + '.');
  else log('Redningsskøyta slepte båten til ' + port.name + ' i farlig sjø. Kostnad ' + t.fee + ' kr, mistet ' + t.lost + ' kg fisk.', 'A rescue boat towed you to ' + port.name + ' in dangerous seas. Cost NOK ' + t.fee + ', lost ' + t.lost + ' kg of fish.');
}
// where the rescue boat (r) and the towed boat (b, under tow only) are a fraction of a minute on: {r:{p, hd, v}, b, ph, slack}
function towPose(frac){
  const b = S.boat, t = b && b.tow; if (!t) return null; frac = frac || 0;
  if (!t.P1 || !t.P2) return {r:{p:{x:t.bp.x, y:t.bp.y}, hd:0, v:0}, b:null, ph:t.ph};
  const R1 = towR(t, 'P1'), R2 = towR(t, 'P2'), km = k => k * NM / 60 * frac, stop = Math.max(0, R1.len - TOW.line);
  if (t.ph === 'muster'){ const a = atRoute(R1, 0); return {r:{p:a.p, hd:a.hd, v:0}, b:null, ph:t.ph}; }
  if (t.ph === 'come'){ const a = atRoute(R1, Math.min(stop, t.r + km(TOW.come))); return {r:{p:a.p, hd:a.hd, v:TOW.come}, b:null, ph:t.ph}; }
  if (t.ph === 'hook'){ const u = clamp((S.t - t.th + frac) / TOW.hook, 0, 1), e = u * u * (3 - 2 * u), a = atRoute(R1, stop), c = atRoute(R2, TOW.line), dh = ((c.hd - a.hd + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return {r:{p:{x:a.p.x + (c.p.x - a.p.x) * e, y:a.p.y + (c.p.y - a.p.y) * e}, hd:a.hd + dh * e, v:3}, b:null, ph:t.ph, slack:1 - e}; }
  const s = Math.min(R2.len, t.s + km(TOW.tow)), a = atRoute(R2, s), c = atRoute(R2, s + TOW.line);
  return {r:{p:c.p, hd:c.hd, v:TOW.tow}, b:{p:a.p, hd:a.hd}, ph:t.ph};
}
