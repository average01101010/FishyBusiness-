"""The NPC fleet's ship models in 3D (Ø15 N7, steg 36; tools/ships/, view3d/20-trawl-seine.js drawNPC shipT): each of the six (the car
ferries of 34, 64 and 112 m, the express boat, the passenger ferry, the coastal route's ship) at her quay and under way, by day (June,
12-20) and (liggende) by night (November, 17-22), from the sea some 100-330 m off, in one format a run (NPC_SHOT_FMT liggende 1280x800, npcshot_st.py
staaende 800x1280). Where: a small ferry Hansnes-Reinskard (Troms), a middle one Skarberget-Bognes (Nordland), a big one
Sandvikvåg-Halhjem, the express boats, the passenger ferry Kleppestø-Strandkaien and the coastal ship at Bergen.
Pictures in tests/out/npc3d_<model>_<kai|fart>_<dag|natt>_<format>.png. Checks (OK/FEIL), one a shot: the vessel is drawn with her own
model (G3._debug.ships: t is ship-<model>) at the near level, not the box; at night her windows are lit; then (liggende) the levels by
distance for the coastal ship at Bergen (near within 500 m, the simple one to 1.5 km, the box beyond); no GL errors, no page errors.
Needs the whole coast in the build (python3 tools/map/release.py and game.py, then node build.mjs).
N7's second part (12.11.2026): NPC_SHOT_SET=fisk the coast's fishing boats by their gear (snurrevad, not, tral, teine, autoline: a boat
of the register with that main gear, in the harbour of flaate.json with the most of them, at her berth and under way on a March day
and a November night; needs the vec packs, KYST_VEC=1 node build.mjs), NPC_SHOT_SET=skip the merchant ships (lasteskip, tankskip,
cruiseskip: no traffic until N5, steg 37, so one of each is put into npcStates by the test, lying still and under way off Bergen; needs
their lines in src/index.html, which N5 adds: a build of the test's own until then). npcshot_fisk.py and npcshot_skip.py run them."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

# the crossing of each model: [y (0 car ferry, 1 express boat, 2 passenger ferry), size class (None: any), a quay's name]
KINDS = {'ferje34': [0, 0, 'Hansnes'], 'ferje64': [0, 1, 'Bognes'], 'ferje112': [0, 2, 'Halhjem'], 'hurtig': [1, None, 'Strandkaien'],
         'passasjer': [2, None, 'Kleppestø'], 'kystrute': None}
SETUP = """async ([kind, mode, dark, K]) => { const F = ferjeInit(); WX_FORCE = {w:4, d:200};
  const day = Math.round(((dark ? Date.UTC(2027, 10, 17) : Date.UTC(2027, 5, 16)) - EPOCH) / 6e4);
  let list, Q;
  if (kind === 'kystrute'){ list = H => kystStates(H); Q = F.q.filter(q => q.name.startsWith('Bergen')); }   // (the route's quay at Bergen is «Bergen Jektevik»)
  else { const s = F.s.find(s => (s.y || 0) === K[0] && (K[1] == null || s.k === K[1]) && s.pats.some(P => P.q.some(q => F.q[q].name.startsWith(K[2]))));
    if (!s) return {err:'no crossing'}; list = H => ferjeStates(s, H); Q = [...new Set(s.pats.flatMap(P => P.q))].map(q => F.q[q]); }
  // the first minute from noon (by day) or 17:00 (at night) with one of hers at a quay for the next half hour, or under way 250 m from
  // every quay and for four minutes more (the clock runs on at six times real time while the 3D view settles; a short crossing has no more) (for the coastal ship at Bergen: from 15:00 at the quay, from 20:32 under way, out of Bergen after 20:30)
  const m0 = kind === 'kystrute' ? (mode === 'kai' ? (dark ? 17 * 60 : 15 * 60) : 20 * 60 + 32) : dark ? 17 * 60 : 12 * 60;
  let found = null;
  for (let m = m0; m < m0 + 600 && !found; m++){
    for (const n of list((day + m) / 60)){
      if (kind === 'kystrute' && Q.every(q => dist(q.p, n.p) > (mode === 'kai' ? 0.4 : 5))) continue;
      const later = k => list((day + m + k) / 60).find(q => q.id === n.id);
      if (mode === 'kai' ? n.v === 0 && [5, 10, 20, 30].every(k => { const q = later(k); return q && q.v === 0 && dist(q.p, n.p) < 0.01; })
                         : n.v > 3 && Q.every(q => dist(q.p, n.p) > 0.25) && [2, 4].every(k => { const q = later(k); return q && q.v > 3; })){ found = {n, m}; break; } } }
  if (!found) return {err:'no time'};
  // (under way: where she will be two minutes on, about when the shot is taken; the boat lies still there and the camera turns to her)
  const n0 = found.n, n = mode === 'kai' ? n0 : (list((day + found.m + 2) / 60).find(q => q.id === n0.id) || n0), b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.v = 0;
  const T = day + found.m; S.t = T; S.mult = 0.00001; COASTM.k = ''; await mapNeed(n.p, MAPD.simR);   // (the clock all but held, as anchor3d.py does: an express boat at 35 knots was out of the picture before the camera came round)
  // the boat (the camera's place) off her side, on water: broadside first, then round
  const r = mode === 'kai' ? Math.max(0.11, Math.min(0.33, n.L * 2.6 / 1000)) : Math.max(0.09, Math.min(0.25, n.L * 2 / 1000)); let off = null;
  for (const da of [Math.PI / 2, -Math.PI / 2, 1.2, -1.2, 2.0, -2.0, 0.6, -0.6, 2.6, -2.6, 0, Math.PI]) for (const k of [1, 1.3, 0.8, 1.7]){
    if (off) break; const a = n.hd + da, c = {x:n.p.x + Math.sin(a) * r * k, y:n.p.y - Math.cos(a) * r * k}; if (!isLand(c) && depthF(c) > 3) off = {x:c.x - n.p.x, y:c.y - n.p.y}; }
  if (!off) off = {x:r, y:0};
  b.pos = {x:n.p.x + off.x, y:n.p.y + off.y}; b.heading = Math.atan2(-off.x, off.y); if (!G3.isActive()) G3.show(true);
  return {id:n.id, name:n.name, L:n.L, B:n.B, ex:n.ex || 0, p:n.p, hd:n.hd, v:n.v, t:S.t, T, off, min:found.m}; }"""
# the boat kept at her offset from the vessel (one under way moves on), the camera from astern of the boat at the vessel
# the camera from astern of the boat (which lies still where SETUP put her) turned to where the 3D view draws the vessel (G3._debug.ships
# p: a vessel under way gives way to your boat in your own view, valg 4 A, so she is not quite where the clock has her)
# (under way the clock is held at the minute SETUP chose, T: it runs at six times real time while the 3D view settles, and a ferry at ten
# knots was a kilometre on before the shot)
LOOK = """([id, off, T, L]) => { if (T) S.t = T; const n = npcStates(S.t / 60).find(q => q.id === id && (!L || q.L === L)); if (!n) return null; const d = (G3._debug.ships || []).find(q => q.id === id && (!L || q.L === L)), p = d && d.p ? d.p : n.p, b = S.boat; b.v = 0;
  const c = G3._debug.cam; c.helm = false; c.dist = 55; c.pitch = 0.1; c.yaw = Math.atan2(p.x - b.pos.x, -(p.y - b.pos.y)) - b.heading;
  const s = (G3._debug.ships || []).find(q => q.id === id && (!L || q.L === L)); return {v:n.v, s:s || null, win:G3._debug.winLit, lit:(G3._debug.anchl || {}).npcLit}; }"""

# ---- the coast's fishing boats by their gear (NPC_SHOT_SET=fisk) ----
# kind -> (the register's gear, the lengths the model is drawn for, view3d/20-trawl-seine.js GEARM)
FISK = {'snurrevad': ('snurrevad', 8, 99), 'not': ('not', 8, 99), 'tral': ('tral', 8, 99), 'teine': ('teine', 7, 13), 'autoline': ('line', 13, 99)}
def fisk_harbours(kind):
    """the harbours (tile:ty.hi) of flaate.json with the most boats of the gear in the model's lengths on a berth of their own (an id
    no other boat of the harbour shares), best first"""
    D = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'flaate.json'))); G = D['meta']['gear']; g, a, b = FISK[kind]
    one = lambda v, bi: sum(1 for e in v if e[0] == bi) == 1
    n = [(sum(1 for bi, L, gi in v if G[gi] == g and a <= L < b and one(v, bi)), k) for k, v in D['h'].items()]
    return [k for c, k in sorted(n, reverse=True)[:30] if c]
FSETUP = """async ([kind, mode, dark, key, gear, a, b]) => { const [tk, hi] = key.split('.'), [tx, ty] = tk.split(':').map(Number), TL = MAPD.man.tile; WX_FORCE = {w:3, d:200};
  const day = Math.round(((dark ? Date.UTC(2027, 10, 17) : Date.UTC(2027, 2, 10)) - EPOCH) / 6e4), bt = S.boat; bt.status = 'idle'; bt.port = null; S.plan = null; S.draft = []; bt.v = 0;
  const c0 = {x:(tx + 0.5) * TL, y:(ty + 0.5) * TL}; bt.pos = c0; await mapNeed(c0, MAPD.simR); let t = null;
  for (let i = 0; i < 80 && !t; i++){ t = vecTile(tx, ty); if (!t) await new Promise(r => setTimeout(r, 250)); }
  const h = t && t.npc && t.npc[+hi]; if (!h) return {err:'no harbour ' + key};
  // (not a boat whose right a player holds: npcStates leaves those out, 05-vessels.js heldShare)
  // (and one whose id no other boat of the harbour shares: the test camera, npcLook, follows the first boat of an id)
  const boats = h.boats.filter(q => q.gear === gear && q.L >= a && q.L < b && h.boats.filter(o => o.id === q.id).length === 1 && !(q.lg != null && q.lg < 3 && hash(hashStr(q.id) % 1000003 * 5 + 17) < heldShare(q.lg))); if (!boats.length) return {err:'no boat ' + key};
  for (const q of boats) q.h = h;
  // at her berth: not one with another berth 1-30 m from it (the quay built out to the boat further out is drawn over her, as at tile
  // 25:2 by Vardø; BACKLOG «kaia bygd ut over en annen båtplass»)
  if (mode === 'kai'){ const keep = boats.filter(q => !h.boats.some(o => { const d = dist(o.p, q.p) * 1000; return d > 1 && d < 30; })); if (!keep.length) return {err:'berths too near ' + key}; boats.length = 0; boats.push(...keep); }
  const st = (q, H) => { const A = coastState(q, H, hodOf(H)), B = coastState(q, H - 1 / 60, hodOf(H - 1 / 60)); return {A, v:dist(A.p, B.p) / gridScale(A.p) / NM * 60}; };
  const m0 = dark ? 17 * 60 : mode === 'kai' ? 10 * 60 : 8 * 60, m1 = dark ? m0 + 600 : 17 * 60 + 30; let found = null;   // (by day in daylight: March's sun is up 07-18 along the coast)
  for (let m = m0; m < m1 && !found; m += mode === 'kai' ? 10 : 3) for (const q of boats){ const H = (day + m) / 60, s = st(q, H);
    if (s.A.hidden) continue;
    if (mode === 'kai' ? s.A.st === 'port' && [10, 30].every(k => { const z = st(q, H + k / 60); return z.A.st === 'port' && dist(z.A.p, s.A.p) < 0.01; })
                       : s.v > 3 && dist(s.A.p, h) > 0.4 && [2, 4].every(k => st(q, H + k / 60).v > 3)){ found = {q, m, A:s.A}; break; } }
  if (!found) return {err:'no time'};
  const q = found.q, T = day + found.m, A = mode === 'kai' ? found.A : coastState(q, (T + 2) / 60, hodOf((T + 2) / 60)); S.t = T; S.mult = 0.00001; COASTM.k = ''; await mapNeed(A.p, MAPD.simR);
  const r = mode === 'kai' ? Math.max(0.07, Math.min(0.2, q.L * 6 / 1000)) : Math.max(0.06, Math.min(0.15, q.L * 5 / 1000)); let off = null;
  // a camera place on water with nothing between it and her: no quay's face (a pier or an outer quay hid her at her berth) and no land
  // on the line, tried round her from broadside out, nearer in where it must
  const x = A.p.x * 1000, z = A.p.y * 1000, Q = [];
  for (const tt of vecTilesIn(x - 400, z - 400, x + 400, z + 400)) for (const f of tt.quays || []) Q.push([f.x - f.ux * f.hl, f.z - f.uz * f.hl, f.x + f.ux * f.hl, f.z + f.uz * f.hl]);
  const cross = (ax, az, bx, bz, q) => { const d = (bx - ax) * (q[3] - q[1]) - (bz - az) * (q[2] - q[0]); if (Math.abs(d) < 1e-9) return false;
    const u = ((q[0] - ax) * (q[3] - q[1]) - (q[1] - az) * (q[2] - q[0])) / d, v = ((q[0] - ax) * (bz - az) - (q[1] - az) * (bx - ax)) / d; return u > 0 && u < 1 && v >= 0 && v <= 1; };
  // (from her middle: the face of her own quay is behind her, seen from the water side, and is crossed from the quay's side)
  const clear = c => { const cx = c.x * 1000, cz = c.y * 1000;
    if (Q.some(g => cross(x, z, cx, cz, g))) return false; for (let k = 1; k < 20; k++){ const t = k / 20; if (isLand({x:A.p.x + (c.x - A.p.x) * t, y:A.p.y + (c.y - A.p.y) * t})) return false; } return true; };
  for (const k of [1, 0.7, 0.5, 1.4, 0.35]) for (const da of [Math.PI / 2, -Math.PI / 2, 1.2, -1.2, 2.0, -2.0, 0.8, -0.8, 2.5, -2.5, 0.4, -0.4, 0, Math.PI]){
    if (off) break; const aa = A.hd + da, c = {x:A.p.x + Math.sin(aa) * r * k, y:A.p.y - Math.cos(aa) * r * k}; if (!isLand(c) && depthF(c) > 2 && clear(c)) off = {x:c.x - A.p.x, y:c.y - A.p.y}; }
  for (const da of [Math.PI / 2, -Math.PI / 2, 1.2, -1.2, 2.0, -2.0, 0.6, -0.6, 2.6, -2.6, 0, Math.PI]) for (const k of [1, 1.3, 0.8, 1.7]){
    if (off) break; const aa = A.hd + da, c = {x:A.p.x + Math.sin(aa) * r * k, y:A.p.y - Math.cos(aa) * r * k}; if (!isLand(c) && depthF(c) > 2) off = {x:c.x - A.p.x, y:c.y - A.p.y}; }
  if (!off) off = {x:r, y:0};
  bt.pos = {x:A.p.x + off.x, y:A.p.y + off.y}; bt.heading = Math.atan2(-off.x, off.y); if (!G3.isActive()) G3.show(true);
  return {id:q.id, name:q.name, L:q.L, B:q.B, gear, p:A.p, hd:A.hd, t:S.t, T, off, min:found.m, key, look:Math.atan2(-off.x, off.y) - A.hd}; }"""

# ---- the merchant ships (NPC_SHOT_SET=skip): one put into npcStates by the test, lying still or going at her speed off Bergen ----
SKIP = {'last': ('cargo', 88.0, 14.0, 12), 'tank': ('tanker', 130.0, 21.0, 12), 'cruise': ('cruise', 240.0, 31.0, 15),
        'fritid': ('fritid', 7.6, 2.6, 18), 'seil': ('seil', 10.4, 3.4, 6)}   # (the leisure boats too: N6's traffic, steg 38)
MSETUP = """async ([kind, mode, dark, type, L, B, kn]) => { const F = ferjeInit(); WX_FORCE = {w:3, d:200};
  const day = Math.round(((dark ? Date.UTC(2027, 10, 17) : Date.UTC(2027, 5, 16)) - EPOCH) / 6e4), bt = S.boat; bt.status = 'idle'; bt.port = null; S.plan = null; S.draft = []; bt.v = 0;
  const sk = F.q.find(q => q.name === 'Strandkaien'); S.t = day + (dark ? 18 : 12) * 60; S.mult = 0.00001; await mapNeed(sk.p, MAPD.simR);
  // a place in the fjord off Bergen deep enough, and a heading along which she stays on deep water 1.5 km each way
  let at = null;
  for (const R of [1.2, 1.6, 2.0, 2.6, 3.2]) for (let a0 = 0; a0 < 6.28 && !at; a0 += 0.2){ const c = {x:sk.p.x + Math.sin(a0) * R, y:sk.p.y - Math.cos(a0) * R}; if (isLand(c) || depthF(c) < 20) continue;
    for (let h = 0; h < 6.28 && !at; h += 0.26){ let ok = true; for (let s = -1.5; s <= 1.5 && ok; s += 0.1){ const q = {x:c.x + Math.sin(h) * s, y:c.y - Math.cos(h) * s}; ok = !isLand(q) && depthF(q) > 12; } if (ok) at = {c, h}; } }
  if (!at) return {err:'no water'};
  const H0 = S.t / 60, v = mode === 'kai' ? 0 : kn, id = 'npcshot-' + kind;
  window.__FK = [H => { const s = v * 1.852 * (H - H0) * gridScale(at.c); return {id, name:'Prøveskip', type, L, B, T:6, p:{x:at.c.x + Math.sin(at.h) * s, y:at.c.y - Math.cos(at.h) * s}, hd:at.h, cog:at.h, v, st:v ? 'transit' : 'anchor'}; }];
  if (!window.__npcW){ const o = npcStates; window.__npcW = true; npcStates = function(H, only){ const r = o.apply(this, arguments); return window.__FK && !only ? r.concat(window.__FK.map(f => f(H))) : r; }; }
  const n = window.__FK[0](H0 + 2 / 60), r = Math.max(L < 20 ? 0.05 : 0.12, Math.min(0.45, L * (L < 20 ? 6 : 1.6) / 1000)); let off = null;
  for (const da of [Math.PI / 2, -Math.PI / 2, 1.2, -1.2, 2.0, -2.0]) for (const k of [1, 1.3, 0.8]){ if (off) break; const a = n.hd + da, c = {x:n.p.x + Math.sin(a) * r * k, y:n.p.y - Math.cos(a) * r * k}; if (!isLand(c) && depthF(c) > 3) off = {x:c.x - n.p.x, y:c.y - n.p.y}; }
  if (!off) off = {x:r, y:0};
  bt.pos = {x:n.p.x + off.x, y:n.p.y + off.y}; bt.heading = Math.atan2(-off.x, off.y); if (!G3.isActive()) G3.show(true);
  return {id, name:'Prøveskip (' + type + ')', L, B, p:n.p, hd:n.hd, v, t:S.t, T:S.t, off}; }"""

async def setup(pg, kind, mode, dark):
    if kind in FISK:
        g, a, b = FISK[kind]; r = None
        for key in fisk_harbours(kind):
            r = await pg.evaluate(FSETUP, [kind, mode, dark, key, g, a, b])
            if r and not r.get('err'): return r
        return r
    if kind in SKIP:
        t, L, B, kn = SKIP[kind]; return await pg.evaluate(MSETUP, [kind, mode, dark, t, L, B, kn])
    return await pg.evaluate(SETUP, [kind, mode, dark, KINDS[kind]])

SEEN = """([id, L]) => { const s = (G3._debug.ships || []).find(q => q.id === id && (!L || q.L === L)), n = npcStates(S.t / 60).find(q => q.id === id && (!L || q.L === L)); return {v:n ? n.v : null, s:s || null, win:G3._debug.winLit, lit:(G3._debug.anchl || {}).npcLit}; }"""

async def shot(pg, kind, mode, dark, fmt, R):
    name = f'{kind}_{mode}_{"natt" if dark else "dag"}_{fmt}'
    r = await setup(pg, kind, mode, dark); Lm = r.get('L') if r and kind in FISK else None   # (two boats of the coast can share an id: hers by her length)
    if not r or r.get('err'):
        check(False, f'{name}: fant {kind} {"ved kai" if mode == "kai" else "under fart"}', r); return None
    await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(9000 if mode == 'kai' else 3000)   # (under way: the same place as the shot before, loaded)
    await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
    l = None
    if mode == 'kai' and kind not in FISK:
        for w in (2500, 2500, 600): l = await pg.evaluate(LOOK, [r['id'], r['off'], None, Lm]); await pg.wait_for_timeout(w)
        l = await pg.evaluate(LOOK, [r['id'], r['off'], None, Lm]); await pg.wait_for_timeout(250)
    else:   # under way: the game's own test camera on her (npcLook), off her bow quarter, as she goes
        # (a fishing boat at her berth: from the water side SETUP found clear of quays and land, a little from above, over the quay's edge)
        dm = max(30 if r['L'] < 12 else 45 if kind in FISK else 70, min(280 if kind in KINDS else 420, r['L'] * (3.5 if r['L'] < 12 else 2.2))); pitch, off = (0.3, r['look']) if mode == 'kai' else (0.12, 2.1)   # (a ship within the near level's 500 m)
        for w in (2500, 2500, 2500, 2000): await pg.evaluate("([id, d, pt, o]) => (G3._debug.npcLook || G3.npcLook)(id, d, pt, o)", [r['id'], dm, pitch, off]); await pg.wait_for_timeout(w)
    await pg.screenshot(path=os.path.join(OUT, f'npc3d_{name}.png'), timeout=300000)
    if mode != 'kai' or kind in FISK: l = await pg.evaluate(SEEN, [r['id'], Lm]); await pg.evaluate("(G3._debug.npcLook || G3.npcLook)(null)")   # (read after the shot: the camera takes seconds to come round)
    s = (l or {}).get('s') or {}
    R[name] = dict(r, look=l)
    ok = s.get('t') == 'ship-' + kind and s.get('lod') == 1
    check(ok, f'{name}: {r["name"]} ({r["L"]} × {r["B"]} m) tegnet med sin egen modell ship-{kind} nær (ikke kassa), {s.get("d")} m unna, {s.get("tris")} trekanter (npc3d_{name}.png)', {'t': s.get('t'), 'lod': s.get('lod'), 'v': (l or {}).get('v')})
    if dark and kind not in FISK: check((l or {}).get('win', 0) > 0, f'{name}: vinduene lyser om natta ({(l or {}).get("win")} lys)')
    if dark and mode != 'kai': check((l or {}).get('lit', 0) > 0, f'{name}: lanternene tent om natta ({(l or {}).get("lit")} lys)')
    return r

async def main():
    if not os.path.exists(os.path.join(HERE, '..', 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py, så node build.mjs)'); return
    fmt = os.environ.get('NPC_SHOT_FMT', 'liggende'); vp = {'width': 1280, 'height': 800} if fmt == 'liggende' else {'width': 800, 'height': 1280}
    only = [k for k in os.environ.get('NPC_SHOT_ONLY', '').split(',') if k]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport=vp)).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix')
        R = {}
        SET = os.environ.get('NPC_SHOT_SET', 'ferjer')
        for kind in (FISK if SET == 'fisk' else SKIP if SET == 'skip' else KINDS):
            if only and kind not in only: continue
            for mode in [m for m in ('kai', 'fart') if os.environ.get('NPC_SHOT_MODE', m) == m]:
                nat = os.environ.get('NPC_SHOT_NATT'); natt = SET == 'ferjer' or (nat and (nat == '1' or kind in nat.split(',')))   # (the fishing boats and the merchant ships by night where asked: a shot takes minutes)
                for dark in ((False, True) if fmt == 'liggende' and natt else (False,)): await shot(pg, kind, mode, dark, fmt, R)   # (stående by day only: the night's lights are the same in either format, and the run must end within the hour)
        # the levels by distance (liggende only): the coastal ship at Bergen's quay from 300 m, 1 km and 2.2 km
        if fmt == 'liggende' and SET == 'ferjer' and (not only or 'kystrute' in only):
            r = await pg.evaluate(SETUP, ['kystrute', 'kai', False, None])
            if r and not r.get('err'):
                await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(6000)
                for dist_m, want in ((300, 1), (1000, 0.3), (2200, None)):
                    off = await pg.evaluate("""([id, d]) => { const n = npcStates(S.t / 60).find(q => q.id === id); for (let a = 0; a < 6.28; a += 0.2){ const c = {x:n.p.x + Math.sin(a) * d, y:n.p.y - Math.cos(a) * d}; if (!isLand(c)) return {x:c.x - n.p.x, y:c.y - n.p.y}; } return null; }""", [r['id'], dist_m / 1000])
                    if not off: check(False, f'LOD: vann {dist_m} m fra kystruteskipet'); continue
                    await pg.evaluate("([id, off]) => { const n = npcStates(S.t / 60).find(q => q.id === id), b = S.boat; b.pos = {x:n.p.x + off.x, y:n.p.y + off.y}; b.v = 0; b.heading = Math.atan2(-off.x, off.y); }", [r['id'], off])
                    for w in (4000, 2500): l = await pg.evaluate(LOOK, [r['id'], off, None]); await pg.wait_for_timeout(w)
                    l = await pg.evaluate(LOOK, [r['id'], off, None]); s = (l or {}).get('s') or {}
                    got = s.get('lod') if s.get('t') == 'ship-kystrute' else None
                    check(got == want, f'LOD: kystruteskipet {dist_m} m unna (målt {s.get("d")} m) tegnes {"nær" if want == 1 else "enkel" if want else "som kassa"}', {'t': s.get('t'), 'lod': s.get('lod'), 'tris': s.get('tris')})
        gl = await pg.evaluate("G3._debug.glErr()")
        check(gl == 0, f'{fmt}: ingen GL-feil', gl)
        check(not errs, f'{fmt}: ingen sidefeil', errs[:2])
        print(json.dumps(R))
        await b.close()
asyncio.run(main())
