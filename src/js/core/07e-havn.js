// ===== A berth in the coast's harbours for the player's boats (Jonas 23.10.2026: «Båten burde som oftest ligge til en skikkelig kai
// fremfor å ligge på anker … Vår båt burde også kunne ligge ved disse om det er en ledig plass som passer vår båt, i verste fall skal man
// kunne ligge ved fiskemottak, utstyrsbutikker, verft eller på anker, men anker vil som regel være siste alternativ med mindre man har en
// veldig stor båt»). The harbours are the vec packs' (tools/map/npc.py, the harbours the coast's own boats lie in; 05-vessels.js
// moorHarbour gives those boats their places). A berth for one of the player's boats is a free stretch of a quay face or of a floating
// dock's side there: as long as the boat and two metres, with her draught and half a metre of water at chart datum (the lowest tide),
// clear of the harbour's own boats and docks, the plants', shops', yards', rorbuer's and the naust's places, the company's other boats
// and the berths other players hold (the server keeps who lies where: berth_get and berth_put, supabase/migrations/…_berths.sql).
// A berth is a place of its own, like a rorbu (portById knows it, PORTX in 01-world.js), and is saved with the game (S.havn), so it is
// there before its pack is. It has no services: the trade is at the plants, the shops and the yards (docs/handelssteder.md). The crew
// rest well there only aboard a boat with bunks (Jonas 23.10.2026, B). A day there costs the harbour due by the boat's length
// (HAVN.due: Herøy kommune's rates for working vessels 2026, 190, 380 and 590 kr a started day under 12 m, 12-15 m and over 15 m; the
// guest harbours take about the same, Brosundet in Ålesund 200, 375 and 500 kr).
const HAVN = {r:0.5, molo:3, dockMax:15, due:[[12, 190], [15, 380], [1e9, 590]], margin:0.5, step:2};
const HVH = new Map();   // the harbours seen: id → {id, name, x, y}
const HVS = new Map();   // the berths as places: id → {id, name, p, coast, face, key, hid, vtype, …}
const havnDue = L => HAVN.due.find(d => L < d[0])[1];
// (a function, so the harbours' load can ask before this file has run: 07-harbours.js PIERBOX)
function isBerth(id){ return typeof id === 'string' && id.slice(0, 3) === 'hs:'; }
// the saved berths and harbours (a company's: S.havn = {h:{id:{name, x, y}}, s:{id:{…}}})
function havnStore(){ if (!S.havn) S.havn = {h:{}, s:{}}; return S.havn; }
function havnPlace(id){
  if (!isBerth(id)) return undefined;
  let B = HVS.get(id); if (B) return B;
  const s = S && S.havn && S.havn.s[id]; if (!s) return undefined;
  B = Object.assign({id, havn:true, pier:true, fuel:false, ice:false, mottak:false, pf:1}, s); B.xy = [B.p.x, B.p.y]; B.shore = [B.coast.x, B.coast.y];
  HVS.set(id, B); return B;
}
PORTX = havnPlace;
// the harbour's name: the nearest local name on the chart (a town or a settlement within 1.2 km, a bay or a sound within 1 km, an island
// within 0.7 km; skerries, shoals and lakes left out) + «havn», each harbour its own among its neighbours (the one nearest a name takes
// it first), so the harbours of a town can be told apart (Tromsø, Hungerbukta, Lilleholla); else the place it lies in (the nearest of the
// game's places within a few km) and where from it (Bodø øst havn). No firm's name: CLAUDE.md, the places are named after the place.
const HVN = {lim:[1.2, 1, 0.7], pen:[0, 0.2, 0.4], skip:/skjær|skjer|skjæran|grunnen?$|grunn$|flua$|fluene$|båen$|vatnet$|vatn$|vannet$|tjønna?$|tjernet$/i};
function havnName(p, side){
  let best = null, bd = 1e9, bq = null; const take = (nm, q, lim) => { const d = dist(q, p); if (d < lim && d < bd && nm){ bd = d; best = nm; bq = q; } };
  // (the plants, shops and yards are named after the place and what they are: the place alone)
  const place = nm => String(nm || '').replace(/\s+(utstyrsbutikk|butikk|verft|båtverft|fiskemottak|mottak|fiskebruk)$/i, '');
  for (const q of PORTS) take(place(q.name), q.p, 6);
  if (typeof rorbuIn === 'function') for (const R of rorbuIn(p.x - 4, p.y - 4, p.x + 4, p.y + 4)) take(R.name, R.cand, 4);
  if (typeof chartNamesOf === 'function' && MAPD.core && MAPD.core.buf){ try { for (const q of chartNamesOf(MAPD.core, 'names0', 0.01, 0, 0)) if (q[2] === 0) take(q[4], {x:q[0], y:q[1]}, 8); } catch (e){} }
  if (!best){ const q = nearestPort(p); best = q ? place(q.name) : 'Havna'; bq = q && q.p; }
  // (side: a harbour that shares the place with a nearer one is told by the side of the place it lies on, in true directions)
  if (side && bq && dist(bq, p) > 0.3 && !/(nord|sør|øst|vest|indre|ytre)$/i.test(best)){ const a = trueDeg(Math.atan2(p.x - bq.x, bq.y - p.y), p);
    best += ' ' + ['nord', 'nordøst', 'øst', 'sørøst', 'sør', 'sørvest', 'vest', 'nordvest'][Math.round(a / 45) % 8]; }
  return best + ' havn';
}
const havnFmt = nm => /(havn|havna|havnen|hamn|hamna|hamnen|vågen|vågan)$/i.test(nm) ? nm : nm + ' havn';
// the local name of a pack tile's harbour hi: its neighbours within 2.5 km take part (the one nearest a name takes it first); null when
// none, undefined while a chart pack round them is not loaded
function havnLocal(t, hi){
  const C = t.hvNames || (t.hvNames = []); if (C[hi] !== undefined) return C[hi];
  const hs = t.npc || [], h0 = hs[hi], T = MAPD.man.tile, pairs = [], near = [];
  for (let j = 0; j < hs.length; j++) if (Math.hypot(hs[j].x - h0.x, hs[j].y - h0.y) < 2.5) near.push(j);
  for (const j of near){ const h = hs[j];
    for (const pk of mapPacksIn('chart', h.x - 1, h.y - 1, h.x + 1, h.y + 1)){ if (!pk.buf) return undefined; if (!mapVec(pk, 'names')) continue;
      for (const q of chartNamesOf(pk, 'names', 0.001, pk.tile[0] * T, pk.tile[1] * T)){ const k = q[2]; if (k > 2 || HVN.skip.test(q[4])) continue;
        const d = Math.hypot(q[0] - h.x, q[1] - h.y); if (d < HVN.lim[k]) pairs.push([d + HVN.pen[k], j, q[4]]); } } }
  pairs.sort((x, y) => x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : 1));
  const got = new Map(), used = new Set();
  for (const [, j, nm] of pairs) if (!got.has(j) && !used.has(nm)){ got.set(j, havnFmt(nm)); used.add(nm); }
  return (C[hi] = got.get(hi) || null);
}
// the harbours of the packs within r km of p, nearest first: [{id, name, x, y, h}]
function havnsNear(p, r){
  const out = [];
  for (const t of vecTilesIn((p.x - r) * 1000, (p.y - r) * 1000, (p.x + r) * 1000, (p.y + r) * 1000)) (t.npc || []).forEach((h, hi) => {
    const d = Math.hypot(h.x - p.x, h.y - p.y); if (d > r) return;
    const id = 'hv' + t.tx + '_' + t.ty + '_' + hi; let H = HVH.get(id);
    if (!H){ H = {id, x:h.x, y:h.y, name:(havnStore().h[id] || {}).name || null}; HVH.set(id, H); }
    H.h = h; H.t = t; H.hi = hi; out.push(Object.assign(H, {d}));
  });
  return out.sort((a, c) => a.d - c.d);
}
// (the name is kept once the chart's names were there to give it; until then the place's name stands in)
function havnNm(H){
  if (H.name) return H.name;
  let L; try { L = H.t ? havnLocal(H.t, H.hi) : null; } catch (e){ L = undefined; }
  if (L === undefined) return havnName({x:H.x, y:H.y});
  return (H.name = L || havnName({x:H.x, y:H.y}, true));
}
// the hulls a berth must keep clear of: the harbour's own boats (and those of the harbours round it), the company's other berths, and the
// berths other players hold (HVC, as the server last said); [{p, hd, L, B, buoy}]
const HVC = new Map();   // harbour id → {at (ms), list:[{slot, x, y, hd, len, beam}]}
function havnTaken(H, vid){
  const out = [];
  for (const b of H.h.boats) if (b.moored){ const q = b.moored.buoy, D = b.L * 2 + 2 * MOOR.PEN; out.push(q ? {p:q, hd:b.moored.hd, L:D, B:D, buoy:true} : {p:b.moored.p, hd:b.moored.hd, L:b.L, B:b.B}); }
  for (const o of moorAround(H.h, H.h)) out.push(o);
  const st = havnStore(); for (const id in st.s){ const s = st.s[id]; if (s.vid && s.vid !== vid && s.bp) out.push({p:s.bp, hd:s.hd, L:s.L, B:s.B}); }
  const c = HVC.get(H.id); if (c) for (const q of c.list) out.push({p:{x:q.x, y:q.y}, hd:q.hd, L:q.len, B:q.beam, slot:q.slot});
  return out;
}
// a hull of L x B m with its middle at p (km), heading hd, free of the hulls in `others` and on water deep enough (d m at chart datum)
// (piers: at a quay face the piers, quays on piles and marks must not cross her hull, the face she lies at being 0.4 m off her side; a dock's
// own pontoon is left out, she lies along it)
// (slabs: the packs' piers drawn as solid outlines, 01c-vec.js, which are neither land on the mask nor obstacles: none of her hull on them)
const havnInPoly = (P, x, z) => { let k = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) k = !k; } return k; };
// (molos: the breakwaters, built as rubble mounds: none of her hull inside an outline, nor within HAVN.molo m of one's line)
function havnSlabs(cx, cz, R){ const out = [];
  const add = (P, molo) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of P){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); } const m = molo ? HAVN.molo : 0; out.push({P, x0:x0 - m, x1:x1 + m, z0:z0 - m, z1:z1 + m, molo, closed:P.length > 3 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 1}); };
  for (const t of vecTilesIn(cx - R, cz - R, cx + R, cz + R)){ for (const P of t.slabs || []) add(P, false); for (const P of t.molos || []) add(P, true); }
  return out; }
const havnSegD = (px, pz, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1, t = clamp(((px - a[0]) * dx + (pz - a[1]) * dz) / L2, 0, 1); return Math.hypot(px - a[0] - dx * t, pz - a[1] - dz * t); };
function havnOnSlab(S0, x, z){
  if (x < S0.x0 || x > S0.x1 || z < S0.z0 || z > S0.z1) return false;
  if ((!S0.molo || S0.closed) && havnInPoly(S0.P, x, z)) return true;
  if (S0.molo) for (let i = 0; i + 1 < S0.P.length; i++) if (havnSegD(x, z, S0.P[i], S0.P[i + 1]) < HAVN.molo) return true;
  return false;
}
function havnHullFree(p, hd, L, B, d, others, piers, slabs){
  const s = Math.sin(hd), c = Math.cos(hd), hl = L / 2 + 1, hb = B / 2 + 0.5;
  for (const fa of [-1, -0.5, 0, 0.5, 1]) for (const ab of [-1, 0, 1]){ const q = {x:p.x + (s * fa * hl + c * ab * hb) / 1000, y:p.y + (-c * fa * hl + s * ab * hb) / 1000};
    try { if (isLand(q) || (ab === 0 && depthF(q) < d)) return false; } catch (e){ return false; }
    if (slabs){ const x = q.x * 1000, z = q.y * 1000; for (const S0 of slabs) if (havnOnSlab(S0, x, z)) return false; } }
  // (her centre line and both sides, so a pier's corner by the bow or the stern is caught too)
  if (piers) for (const ab of [-1, 0, 1]){ const ox = c * ab * B / 2000, oz = s * ab * B / 2000;
    if (obsSegHit({x:p.x + s * hl / 1000 + ox, y:p.y - c * hl / 1000 + oz}, {x:p.x - s * hl / 1000 + ox, y:p.y + c * hl / 1000 + oz}, 0.15)) return false; }
  if (moorBlocked(p.x * 1000, p.y * 1000, L / 2)) return false;
  for (const o of others){ const dx = (p.x - o.p.x) * 1000, dz = (p.y - o.p.y) * 1000; if (Math.hypot(dx, dz) > (L + o.L) / 2 + 3) continue;
    const os = Math.sin(o.hd), oc = Math.cos(o.hd), al = Math.abs(dx * os - dz * oc), ac = Math.abs(dx * oc + dz * os);
    if (o.buoy || al < (L + o.L) / 2 + 1 && ac < (B + o.B) / 2 + 1) return false; }
  return true;
}
// the free berths in a harbour for a vessel type, nearest the harbour's middle first: [{key, kind, face, bp, hd, d}]. Only once its boats
// have their places (the fine coast in round it); else [].
function havnBerths(H, type, vid, n){
  const h = H.h; if (!h) return [];
  if (!havnMoor(h)) return [];
  const V = VESSELS[type], L = V.len, B = BEAM[type] || V.beam || 3, need = V.draft + HAVN.margin, others = havnTaken(H, vid), out = [], cx = h.x * 1000, cz = h.y * 1000, slabs = havnSlabs(cx, cz, HAVN.r * 1000 + 200);
  // the quay faces within HAVN.r km that are not the players' places (quayFree) and fit her (90 % of the face her length and 2 m, its water her draught and half a metre)
  for (const t of vecTilesIn(cx - HAVN.r * 1000, cz - HAVN.r * 1000, cx + HAVN.r * 1000, cz + HAVN.r * 1000)) for (const f of t.quays){
    if (Math.hypot(f.x - cx, f.z - cz) > HAVN.r * 1000 + f.hl || !quayFree(f) || !quayFit(f, L, V.draft)) continue;
    const lim = f.hl - L / 2 - 1;
    for (let s = 0; s <= lim * 2; s += HAVN.step) for (const a of s ? [s / 2, -s / 2] : [0]){
      if (Math.abs(a) > lim) continue;
      const off = B / 2 + 0.4, p = {x:(f.x + f.ux * a + f.nx * off) / 1000, y:(f.z + f.uz * a + f.nz * off) / 1000}, hd = Math.atan2(f.ux, -f.uz);
      if (!havnHullFree(p, hd, L, B, need, others, true, slabs)) continue;
      out.push({key:H.id + ':q' + f.id + '@' + Math.round(a), kind:'quay', face:{x:f.x + f.ux * a, z:f.z + f.uz * a, ux:f.ux, uz:f.uz, nx:f.nx, nz:f.nz, hl:L / 2 + 1, depth:f.depth == null ? QUAY_DEPTH_UNKNOWN : f.depth, kind:f.kind}, bp:p, hd, d:Math.hypot(p.x * 1000 - cx, p.y * 1000 - cz)});
      s = lim * 2 + 1; break;   // one berth a face: the next face for the next
    }
  }
  // the floating docks' sides, for boats under HAVN.dockMax m: alongside, bow out, as the harbour's own boats lie there
  if (L < HAVN.dockMax) (h.docks || []).forEach((dk, di) => {
    const s1 = dk.s0 + dk.np * FDOCK.PL, hd = Math.atan2(dk.n[0], -dk.n[1]);
    for (const side of [1, -1]) for (let sc = dk.s0 + 1 + L / 2; sc + L / 2 <= s1 + 2; sc += 1){
      const off = side * (FDOCK.PW / 2 + B / 2 + 0.3), p = {x:(dk.o[0] + dk.n[0] * sc + dk.u[0] * off) / 1000, y:(dk.o[1] + dk.n[1] * sc + dk.u[1] * off) / 1000};
      if (!havnHullFree(p, hd, L, B, need, others, false, slabs)) continue;
      const fx = dk.o[0] + dk.n[0] * sc + dk.u[0] * side * FDOCK.PW / 2, fz = dk.o[1] + dk.n[1] * sc + dk.u[1] * side * FDOCK.PW / 2;
      out.push({key:H.id + ':d' + di + (side > 0 ? 'a' : 'b') + '@' + Math.round(sc), kind:'dock', face:{x:fx, z:fz, ux:dk.n[0], uz:dk.n[1], nx:dk.u[0] * side, nz:dk.u[1] * side, hl:L / 2 + 1, depth:Math.round(depthF(p) * 10) / 10, dock:true}, bp:p, hd, d:Math.hypot(p.x * 1000 - cx, p.y * 1000 - cz)});
      break;
    }
  });
  // a proper quay first (Jonas 23.10.2026: «en skikkelig kai»): the quays and the floating docks, then the piers, then a stretch of the
  // harbour's shore (it gets a concrete quay front in 3D, view3d.js drawDocks), each the nearest the harbour's middle
  const rank = b => b.kind === 'dock' ? 0.5 : ({2:0, 0:1, 1:1, 3:2})[b.face.kind] ?? 2;
  return out.sort((a, c) => rank(a) - rank(c) || a.d - c.d).slice(0, n || 99);
}
// the harbour's own boats placed (05-vessels.js moorHarbour), once the fine coast is in round it
function havnMoor(h){ MOOR.ver = VEC.ver * 1000 + COAST.built; const p = {x:h.x, y:h.y}; if (h.moorVer !== MOOR.ver && coastFine(p) && coastIndexAt(p, false)) moorHarbour(h); return h.moorVer === MOOR.ver; }
// a berth as a place: its id from its key (the same for everyone), the harbour point 15 m out from the face (where a route ends and the way
// in starts), the shore 20 m in; saved so it is there before its pack
function havnPlaceOf(H, b, type){
  const id = 'hs:' + hashStr(b.key).toString(36), f = b.face, o = {x:f.x / 1000, y:f.z / 1000};
  const s = {name:havnNm(H), hid:H.id, key:b.key, kind:b.kind, face:f, vtype:type, L:VESSELS[type].len, B:BEAM[type] || VESSELS[type].beam || 3, bp:b.bp, hd:b.hd,
    p:{x:Math.round(f.x + f.nx * 15) / 1000, y:Math.round(f.z + f.nz * 15) / 1000}, coast:{x:o.x - f.nx * 0.02, y:o.y - f.nz * 0.02}};
  const st = havnStore(); st.h[H.id] = {name:H.name || null, x:H.x, y:H.y}; s.t0 = S.t;
  if (!st.s[id]) st.s[id] = s; else Object.assign(st.s[id], s, {vid:st.s[id].vid});
  if (Object.keys(st.s).length > 40) havnPrune(id);
  HVS.delete(id); return havnPlace(id);
}
// the berths looked at but never taken are forgotten after a day, unless a vessel lies there, goes there or has it as her plan's home
function havnPrune(keep){
  const st = havnStore(), used = new Set([keep]);
  for (const v of S.fleet){ const vb = vget(v, 'boat'), vo = vget(v, 'ops'), pl = vget(v, 'plan'), dr = vget(v, 'draft');
    if (vb) used.add(vb.port); if (vo) used.add(vo.home); for (const w of (pl && pl.wps) || []) used.add(w.port); for (const w of dr || []) used.add(w.port); }
  for (const id in st.s){ const s = st.s[id]; if (!s.vid && !used.has(id) && S.t - (s.t0 || 0) > 1440){ delete st.s[id]; HVS.delete(id); } }
}
// the berth's face, as quayFace gives the harbours' (07-harbours.js)
function havnFace(pid){ const B = havnPlace(pid); return B ? B.face : null; }
// the nearest free berth for the bound vessel within r km of p: {H, b, place} or null
function havnFind(p, r, type){
  type = type || S.boat.type; const vid = S.cur;
  for (const H of havnsNear(p, r)){ const L = havnBerths(H, type, vid, 1); if (L.length) return {H, b:L[0], place:havnPlaceOf(H, L[0], type)}; havnAsk(H.id); }
  return null;
}
// a tap in the chart near a harbour (its middle within r km): a free berth there for the bound vessel, as a place, or null (the routes end at it)
function havnTapNear(pt, r){
  for (const H of havnsNear(pt, Math.max(r, 0.15))){ const L = havnBerths(H, S.boat.type, S.cur, 1); havnAsk(H.id); if (L.length) return havnPlaceOf(H, L[0], S.boat.type); }
  return null;
}
// the berths the bound vessel could take in the harbours within r km: one each, [{H, place, kind}] (the plan's Home, the dock's «Fortøy»)
function havnOptions(p, r, type){
  type = type || S.boat.type; const out = [];
  for (const H of havnsNear(p, r)){ havnAsk(H.id); const L = havnBerths(H, type, S.cur, 1); if (L.length) out.push({H, place:havnPlaceOf(H, L[0], type), kind:L[0].kind}); }
  return out;
}
// ---- held: the berth is the vessel's while she lies there, or while it is her plan's home (06d-drift.js o.home)
function havnHold(id){
  const st = havnStore(), s = st.s[id]; if (!s) return false;
  s.vid = S.cur; s.t = S.t; havnPut(id, s); return true;
}
function havnFree(id){
  const st = havnStore(), s = st.s[id]; if (!s || s.vid !== S.cur) return;
  const o = S.ops, b = S.boat; if ((o && o.home === id) || (b.status === 'port' && b.port === id)) return;
  delete s.vid; havnDrop(id);
  // a berth nobody uses is forgotten (one another vessel of the company names is kept)
  if (!S.fleet.some(v => { const vb = vget(v, 'boat'), vo = vget(v, 'ops'); return (vb && vb.port === id) || (vo && vo.home === id); })){ delete st.s[id]; HVS.delete(id); }
}
// the harbour due, a started day at a time: on arrival, and at each day's start while she lies there
function havnMinute(){
  const b = S.boat; if (b.status !== 'port' || !isBerth(b.port)) return;
  const day = Math.floor(S.t / 1440); if (b.hvDay === day) return;
  b.hvDay = day; const B = havnPlace(b.port), kr0 = havnDue(BOAT.len);
  S.cash -= kr0; S.stats.costs += kr0;
  log('Havneavgift i ' + B.name + ': ' + kr(kr0) + ' for døgnet.', 'Harbour due in ' + B.name + ': ' + kr(kr0) + ' for the day.');
}
// the NPC boats keep off the berths held by the company and by the other players (05-vessels.js moorBlocked)
function havnBlocked(x, z, r){
  const st = S && S.havn; if (st) for (const id in st.s){ const s = st.s[id]; if (s.vid && s.bp && Math.hypot(s.bp.x * 1000 - x, s.bp.y * 1000 - z) < r + s.L / 2 + 2) return true; }
  for (const c of HVC.values()) for (const q of c.list) if (Math.hypot(q.x * 1000 - x, q.y * 1000 - z) < r + q.len / 2 + 2) return true;
  return false;
}
// ---- the server (D: «Serveren holder rede på hvem som ligger hvor»): what the others hold in a harbour, asked at most every two minutes;
// a berth taken is claimed, and given up when she leaves it. Without the cloud (a guest offline, the tests) the game keeps to itself.
const HVQ = {busy:new Set()};
function havnCloud(){ return typeof CLOUD !== 'undefined' && CLOUD.on && CLOUD.user && typeof cloudRpc === 'function'; }
function havnAsk(hid){
  if (!havnCloud() || HVQ.busy.has(hid)) return; const c = HVC.get(hid); if (c && Date.now() - c.at < 120e3) return;
  HVQ.busy.add(hid);
  cloudRpc('berth_get', {hid}).then(r => { const list = (Array.isArray(r) ? r : []).filter(q => !q.mine);
    HVC.set(hid, {at:Date.now(), list});
    // the harbour's own boats are placed again if one of them lies where another player's boat does
    const H = HVH.get(hid); if (H && H.h && list.length) H.h.moorVer = -1;
  }).catch(() => HVC.set(hid, {at:Date.now(), list:(HVC.get(hid) || {list:[]}).list})).finally(() => HVQ.busy.delete(hid));
}
function havnPut(id, s){
  if (!havnCloud()) return; const vid = S.cur;
  cloudRpc('berth_put', {slot:s.key, hid:s.hid, vessel:String(vid), x:s.bp.x, y:s.bp.y, hd:s.hd, len:s.L, beam:s.B}).then(r => { if (r !== 'taken') return;
    // someone else holds it: the vessel moves to another free berth in the same harbour, or keeps it where nothing is free
    const v = vesselById(vid); if (v) onVessel(v, () => havnMoved(id));
  }).catch(e => console.warn('berth_put', e));
}
// all the company's held berths again, at the start and every six hours (ui/10f-cloud.js)
function havnRenew(){ if (!havnCloud()) return; const st = havnStore(); for (const id in st.s){ const s = st.s[id], v = s.vid && vesselById(s.vid); if (v) onVessel(v, () => havnPut(id, s)); } }
function havnDrop(id){ const s = havnStore().s[id]; if (s && havnCloud()) cloudRpc('berth_free', {slot:s.key}).catch(() => {}); }
function havnMoved(id){
  const st = havnStore(), s = st.s[id]; if (!s) return; const H = HVH.get(s.hid); HVC.delete(s.hid);
  if (!H || !H.h){ return; }
  delete s.vid; const L = havnBerths(H, S.boat.type, S.cur, 1); if (!L.length) return;
  const B = havnPlaceOf(H, L[0], S.boat.type), b = S.boat, o = S.ops;
  if (b.status === 'port' && b.port === id){ b.port = B.id; b.pos = {x:B.p.x, y:B.p.y}; S.trail = [{x:B.p.x, y:B.p.y, port:B.id}]; }
  if (o && o.home === id) o.home = B.id;
  havnHold(B.id); if (!S.fleet.some(v => vget(v, 'boat').port === id)) delete st.s[id];
  log('Plassen i ' + B.name + ' var tatt av en annen båt. Båten har fått en ny plass i samme havn.', 'The berth in ' + B.name + ' was taken by another boat. The boat has a new berth in the same harbour.');
}
