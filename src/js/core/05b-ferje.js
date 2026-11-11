// The car ferries along the whole coast (Ø15 N3 of docs/planer/npc-flaaten.md, 11.11.2026; docs/systemer/npc-trafikk.md 4.18). Every
// crossing of data/ferje.json (tools/npc/ferje.py: Entur's national timetable, NLOD; the fairways found in the game's own 25 m mask)
// is sailed as a pure function of the shared clock: the ferries leave when the timetable says, take the crossing's time over the
// leg, lie at the ferry quay between the journeys and through the night, and take no fish. The same clock gives the same ferry at the
// same place for every player, also when nobody is there to see her. Only the crossings within AIS_KM of the boat you follow are worked
// out (ferjeNear, called by npcStates in 05-vessels.js, as coastNear is).
//
// The timetable has departures, not vessels. The journeys of a week are dealt out to as few ferries as can sail them (ferjeChain): a
// journey is taken by the ferry that has lain longest at its quay, and by a new one when none lies there. Each ferry is then a list
// of journeys through the week, and where she is at a minute is the journey she is on or the quay her last one ended at.
//
// No real vessel, owner or operator is in the data or here (Jonas 07.10.2026; choice 2 A 05.11.2026): the ferries' names are put
// together from two lists, by a seed from the crossing's quays, so everybody sees the same name.
//
// Senja's own ferry «MF Senjasund» (Botnhamn - Brensholmen, May to September, every 90 minutes 07-21, 12 knots) is one crossing among
// the others, with the route, the name, the id ('ferje') and the size she has always had.
const FERJE_D = /*@include(data/ferje.json)*/null;
// length, beam and draught (m) by the crossing's size class (ferje.json k: an estimate from the departures a day and the longest leg)
const FERJE_SIZE = [[34.0, 9.6, 2.6], [64.0, 13.4, 3.4], [112.0, 17.5, 4.4]];
// a departure is cancelled when the wind at the quay is this or more (m/s), by the size class: a strong gale stops the small ones,
// a storm the large ones. The ferry then lies where she is till a journey leaves from that quay in weather she sails in.
const FERJE_WIND = [20, 22, 25];
const FERJE_WEEK = 10080;
const FERJE_N1 = ['Stor', 'Lang', 'Ytter', 'Inner', 'Nord', 'Sør', 'Vest', 'Aust', 'Blå', 'Grå', 'Kvit', 'Høg', 'Låg', 'Brei', 'Djup'];
const FERJE_N2 = ['skjæret', 'båen', 'flua', 'straumen', 'leia', 'tangen', 'odden', 'taren', 'dønninga', 'bråttet', 'kavlen', 'fallet', 'røsta', 'drivet', 'draget'];
const FERJE = {s:null, q:[], sum:null};
function ferjeInit(){
  if (FERJE.s) return FERJE;
  const D = FERJE_D || {q:[], l:[], s:[], meta:{}}, legs = new Map();
  FERJE.q = D.q.map(q => ({name:q[0], p:{x:q[1] / 1000, y:q[2] / 1000}})); FERJE.sum = D.meta && D.meta.sumDays || null; FERJE.s = [];
  for (const [a, b, f] of D.l){ const pts = [[f[0] / 1000, f[1] / 1000]]; let x = f[0], y = f[1]; for (let i = 2; i < f.length; i += 2){ x += f[i]; y += f[i + 1]; pts.push([x / 1000, y / 1000]); }
    legs.set(a + '|' + b, prepRoute(pts)); legs.set(b + '|' + a, prepRoute(pts.slice().reverse())); }
  const add = (o, pats) => {
    const s = Object.assign({i:FERJE.s.length, ch:{}, names:{}}, o), z = o.sz || FERJE_SIZE[o.k]; s.L = z[0]; s.B = z[1]; s.T = z[2];
    s.pats = pats.map((P, i) => ({i, q:P.q, tm:P.tm, R:P.R, dur:P.tm[P.tm.length - 1]}));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const P of s.pats) for (const R of P.R) for (const p of R.pts){ x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    s.box = [x0, y0, x1, y1]; s.key = [...new Set(s.pats.flatMap(P => P.q))].map(q => FERJE.q[q].name).join('|'); FERJE.s.push(s); return s;
  };
  for (const e of D.s) add({k:e.k, w:e.w || null, s:e.s || null}, e.p.map(([q, tm]) => ({q, tm, R:q.slice(1).map((b, j) => legs.get(q[j] + '|' + b))})));
  // Senja's ferry: the route laid by hand (NPC_ROUTES.ferry), 90 minutes between the departures from Botnhamn 07:00-20:30 and from
  // Brensholmen 45 minutes after, at 12 knots, in May to September; she lies as she always has (berthShift), with her bow out
  const qa = FERJE.q.push({name:'Botnhamn', p:NPCR.ferry.pts[0]}) - 1, qb = FERJE.q.push({name:'Brensholmen', p:NPCR.ferryRev.pts[0]}) - 1, tc = NPCR.ferry.len / (12 * NM) * 60;
  const day = [[420].concat(Array(9).fill(90)), [465].concat(Array(9).fill(90))];
  add({k:1, sz:[49.9, 12.4, 3.1], id:'ferje', name:'MF Senjasund', m:[4, 8], lg:true, w:{d:[0, 0, 0, 0, 0, 0, 0], t:[day]}, s:null}, [{q:[qa, qb], tm:[tc], R:[NPCR.ferry]}, {q:[qb, qa], tm:[tc], R:[NPCR.ferryRev]}]);
  return FERJE;
}
// the crossing that calls at both quays (by their names), or undefined
function ferjeFind(a, b){ return ferjeInit().s.find(s => { const n = s.key.split('|'); return n.includes(a) && n.includes(b); }); }
// the week's journeys dealt out to ferries: [{tr:[{t0, t1, P}, ...]}, ...], t0 and t1 in minutes after Monday 00:00. The deal is done
// again from where the ferries lay at the week's end till it is the same week after week (four times at most), so a ferry begins
// the week at the quay she ended it at wherever the timetable lets her.
function ferjeChain(s, W){
  const trips = [];
  for (let d = 0; d < 7; d++){ const day = W.t[W.d[d]]; for (const P of s.pats){ let t = 0; for (const dt of day[P.i] || []){ t += dt; trips.push({t0:d * 1440 + t, t1:d * 1440 + t + P.dur, P}); } } }
  trips.sort((a, b) => a.t0 - b.t0 || a.P.i - b.P.i);
  let V = [];
  for (let pass = 0; pass < 4; pass++){
    const was = V.map(v => v.q + ':' + v.free); V = V.map(v => ({q:v.q, free:v.free - FERJE_WEEK, tr:[]}));
    for (const tr of trips){ const q0 = tr.P.q[0]; let b = null; for (const v of V) if (v.q === q0 && v.free <= tr.t0 && (!b || v.free < b.free)) b = v;
      if (!b){ b = {q:q0, free:-1e9, tr:[]}; V.push(b); } b.tr.push(tr); b.free = tr.t1; b.q = tr.P.q[tr.P.q.length - 1]; }
    if (pass && V.length === was.length && V.every((v, i) => v.q + ':' + v.free === was[i])) break;
  }
  V = V.filter(v => v.tr.length);
  // a ferry whose week ends at another quay than it begins at (an odd number of crossings, a round that is not closed) sails over
  // empty ten minutes after her last journey, where a pattern of the crossing goes that way and there is time before Monday's first
  for (const v of V){ const a = v.tr[v.tr.length - 1], b = v.tr[0], q0 = a.P.q[a.P.q.length - 1], q1 = b.P.q[0]; if (q0 === q1) continue;
    const P = s.pats.find(P => P.q[0] === q0 && P.q[P.q.length - 1] === q1) || ferjeHop(s, q0, q1); if (!P || a.t1 + 10 + P.dur > b.t0 + FERJE_WEEK) continue;
    v.tr.push({t0:a.t1 + 10, t1:a.t1 + 10 + P.dur, P, empty:true}); }
  return V;
}
// one leg of the crossing from quay a to b as a pattern of its own (for a ferry sailing over empty), or null
function ferjeHop(s, a, b){
  for (const P of s.pats) for (let j = 0; j < P.R.length; j++){ const dep = j ? P.tm[2 * j - 1] : 0, dur = P.tm[2 * j] - dep;
    if (P.q[j] === a && P.q[j + 1] === b) return {i:-1, q:[a, b], tm:[dur], R:[P.R[j]], dur};
    if (P.q[j] === b && P.q[j + 1] === a) return {i:-1, q:[a, b], tm:[dur], R:[prepRoute(P.R[j].pts.slice().reverse().map(p => [p.x, p.y]))], dur}; }
  return null;
}
// which of a ferry's journeys are sailed in the week that began at hour H0: not one that leaves in a wind over her limit, and not one
// from a quay she is not at because of it. Worked out once per ferry and week.
function ferjeSailed(s, v, H0){
  if (v.H0 === H0) return v.ok;
  const lim = FERJE_WIND[s.k], ok = []; let q = v.tr[0].P.q[0];
  for (const tr of v.tr){ const go = tr.P.q[0] === q && windAt(H0 + tr.t0 / 60, FERJE.q[q].p) < lim; ok.push(go); if (go) q = tr.P.q[tr.P.q.length - 1]; }
  v.H0 = H0; return v.ok = ok;
}
// where a ferry is w minutes into the week: under way on a leg of the journey she is on, or at the quay. The legs are sailed at an
// even speed between the timetable's departure and arrival, from half her length off the one quay to half her length off the other
// (her middle is what is placed), where she lies with her bow in.
function ferjeAt(s, v, w, ok){
  let lo = 0, hi = v.tr.length - 1, k = -1; while (lo <= hi){ const m = (lo + hi) >> 1; if (v.tr[m].t0 <= w){ k = m; lo = m + 1; } else hi = m - 1; }
  while (ok && k >= 0 && !ok[k]) k--;
  let tr, e; if (k < 0){ tr = v.tr[v.tr.length - 1]; e = w + FERJE_WEEK - tr.t0; if (ok && !ok[v.tr.length - 1]){ tr = v.tr[0]; e = -1; } } else { tr = v.tr[k]; e = w - tr.t0; }
  const P = tr.P, T = P.tm, n = P.R.length, off = R => s.lg ? 0 : Math.min(s.L / 2000 + 0.008, R.len * 0.25);
  const lie = (R, end) => { if (s.lg && P.q[end ? n : 0] === s.pats[0].q[0]){ const a = atRoute(s.pats[0].R[0], 0); return {p:a.p, hd:a.hd, v:0, q:P.q[end ? n : 0]}; }
    const a = atRoute(R, end ? R.len - off(R) : off(R)); return {p:a.p, hd:end ? a.hd : a.hd + Math.PI, v:0, q:P.q[end ? n : 0]}; };
  if (e < 0) return lie(P.R[0], false);
  for (let j = 0; j < n; j++){
    const dep = j ? T[2 * j - 1] : 0, arr = T[2 * j], R = P.R[j], o = off(R);
    if (e < dep){ const a = atRoute(P.R[j - 1], P.R[j - 1].len - off(P.R[j - 1])); return {p:a.p, hd:a.hd, v:0, q:P.q[j]}; }
    if (e < arr){ const run = R.len - 2 * o, a = atRoute(R, o + run * (e - dep) / (arr - dep)); return {p:a.p, hd:a.hd, v:Math.round(run / ((arr - dep) / 60) / NM / gridScale(a.p) * 10) / 10}; }
  }
  return lie(P.R[n - 1], true);
}
// the week the clock is in: the minutes since Monday 00:00, the hour that Monday began, the month, and whether it is the summer week's time
function ferjeClock(H){
  const d = gDate(H), w = ((d.getUTCDay() + 6) % 7) * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + d.getUTCMilliseconds() / 60000;
  const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5), sd = FERJE.sum;
  return {w, H0:Math.round((H - w / 60) * 1000) / 1000, mon:d.getUTCMonth(), sum:!!sd && doy >= sd[0] && doy <= sd[1]};
}
function ferjeName(s, vi){
  if (s.name) return s.name; if (s.names[vi]) return s.names[vi];
  const used = new Set(Object.values(s.names)); let h = hashStr(s.key + '|' + vi), nm;
  do { nm = 'MF ' + FERJE_N1[h % FERJE_N1.length] + FERJE_N2[Math.floor(h / FERJE_N1.length) % FERJE_N2.length]; h = (h + 7919) >>> 0; } while (used.has(nm));
  return s.names[vi] = nm;
}
// a crossing's ferries at hour H: [{id, name, type:'ferry', p, hd, v, L, B, T}], as the timetable has them (wx false) or with the
// departures the weather stopped left out (the default). None outside the crossing's months or when it has no week for the season.
function ferjeStates(s, H, wx = true, C = ferjeClock(H), only){
  if (s.m && (C.mon < s.m[0] || C.mon > s.m[1])) return [];
  const sk = C.sum && s.s ? 's' : 'w', W = s[sk]; if (!W) return [];
  const V = s.ch[sk] || (s.ch[sk] = ferjeChain(s, W)), out = [];
  for (let vi = 0; vi < V.length; vi++){
    const id = s.id || 'j' + s.i + '.' + vi; if (only && only !== id) continue;
    const a = ferjeAt(s, V[vi], C.w, wx && !s.lg ? ferjeSailed(s, V[vi], C.H0) : null);
    out.push({id, name:ferjeName(s, vi), type:'ferry', p:s.lg ? berthShift(a.p, 'ferje', true) : a.p, hd:a.hd, v:a.v, L:s.L, B:s.B, T:s.T});
  }
  return out;
}
// the ferries within AIS range of the boat you follow (Senja's own wherever she is, as before: aisShown hides her beyond the range),
// or the one asked for
function ferjeNear(H, only){
  const out = []; if (only && only !== 'ferje' && only[0] !== 'j') return out;
  const F = ferjeInit(), pos = S && S.boat && S.boat.pos, C = ferjeClock(H), R = AIS_KM;
  for (const s of F.s){
    if (only ? (s.id ? only !== s.id : only.indexOf('j' + s.i + '.') !== 0) : !s.lg && (!pos || pos.x < s.box[0] - R || pos.x > s.box[2] + R || pos.y < s.box[1] - R || pos.y > s.box[3] + R)) continue;
    for (const n of ferjeStates(s, H, true, C, only)) if (only || s.lg || dist(n.p, pos) <= R) out.push(n);
  }
  return out;
}
