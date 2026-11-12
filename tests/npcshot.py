"""The NPC fleet's ship models in 3D (Ø15 N7, steg 36; tools/ships/, view3d/20-trawl-seine.js drawNPC shipT): each of the six (the car
ferries of 34, 64 and 112 m, the express boat, the passenger ferry, the coastal route's ship) at her quay and under way, by day (June,
12-20) and (liggende) by night (November, 17-22), from the sea some 100-330 m off, in one format a run (NPC_SHOT_FMT liggende 1280x800, npcshot_st.py
staaende 800x1280). Where: a small ferry Hansnes-Reinskard (Troms), a middle one Skarberget-Bognes (Nordland), a big one
Sandvikvåg-Halhjem, the express boats, the passenger ferry Kleppestø-Strandkaien and the coastal ship at Bergen.
Pictures in tests/out/npc3d_<model>_<kai|fart>_<dag|natt>_<format>.png. Checks (OK/FEIL), one a shot: the vessel is drawn with her own
model (G3._debug.ships: t is ship-<model>) at the near level, not the box; at night her windows are lit; then (liggende) the levels by
distance for the coastal ship at Bergen (near within 500 m, the simple one to 1.5 km, the box beyond); no GL errors, no page errors.
Needs the whole coast in the build (python3 tools/map/release.py and game.py, then node build.mjs)."""
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
  // every quay and for four minutes more (the clock runs on at six times real time while the 3D view settles; a short crossing has no more) (for the coastal ship at Bergen: from 15:00 at the quay, from 20:40 under way)
  const m0 = kind === 'kystrute' ? (mode === 'kai' ? 15 * 60 : 20 * 60 + 40) : dark ? 17 * 60 : 12 * 60;
  let found = null;
  for (let m = m0; m < m0 + 600 && !found; m++){
    for (const n of list((day + m) / 60)){
      if (kind === 'kystrute' && Q.every(q => dist(q.p, n.p) > (mode === 'kai' ? 0.4 : 3))) continue;
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
LOOK = """([id, off, T]) => { if (T) S.t = T; const n = npcStates(S.t / 60).find(q => q.id === id); if (!n) return null; const d = (G3._debug.ships || []).find(q => q.id === id), p = d && d.p ? d.p : n.p, b = S.boat; b.v = 0;
  const c = G3._debug.cam; c.helm = false; c.dist = 55; c.pitch = 0.1; c.yaw = Math.atan2(p.x - b.pos.x, -(p.y - b.pos.y)) - b.heading;
  const s = (G3._debug.ships || []).find(q => q.id === id); return {v:n.v, s:s || null, win:G3._debug.winLit, lit:(G3._debug.anchl || {}).npcLit}; }"""

SEEN = """([id]) => { const s = (G3._debug.ships || []).find(q => q.id === id), n = npcStates(S.t / 60).find(q => q.id === id); return {v:n ? n.v : null, s:s || null, win:G3._debug.winLit, lit:(G3._debug.anchl || {}).npcLit}; }"""

async def shot(pg, kind, mode, dark, fmt, R):
    name = f'{kind}_{mode}_{"natt" if dark else "dag"}_{fmt}'
    r = await pg.evaluate(SETUP, [kind, mode, dark, KINDS[kind]])
    if not r or r.get('err'):
        check(False, f'{name}: fant {kind} {"ved kai" if mode == "kai" else "under fart"}', r); return None
    await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(9000 if mode == 'kai' else 3000)   # (under way: the same place as the shot before, loaded)
    await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
    l = None
    if mode == 'kai':
        for w in (2500, 2500, 600): l = await pg.evaluate(LOOK, [r['id'], r['off'], None]); await pg.wait_for_timeout(w)
        l = await pg.evaluate(LOOK, [r['id'], r['off'], None]); await pg.wait_for_timeout(250)
    else:   # under way: the game's own test camera on her (npcLook), off her bow quarter, as she goes
        dm = max(70, min(280, r['L'] * 2.2))
        for w in (2500, 2500, 2500, 2000): await pg.evaluate("([id, d]) => (G3._debug.npcLook || G3.npcLook)(id, d, 0.12, 2.1)", [r['id'], dm]); await pg.wait_for_timeout(w)
    await pg.screenshot(path=os.path.join(OUT, f'npc3d_{name}.png'), timeout=300000)
    if mode != 'kai': l = await pg.evaluate(SEEN, [r['id']]); await pg.evaluate("(G3._debug.npcLook || G3.npcLook)(null)")   # (read after the shot: the camera takes seconds to come round)
    s = (l or {}).get('s') or {}
    R[name] = dict(r, look=l)
    ok = s.get('t') == 'ship-' + kind and s.get('lod') == 1
    check(ok, f'{name}: {r["name"]} ({r["L"]} × {r["B"]} m) tegnet med sin egen modell ship-{kind} nær (ikke kassa), {s.get("d")} m unna, {s.get("tris")} trekanter (npc3d_{name}.png)', {'t': s.get('t'), 'lod': s.get('lod'), 'v': (l or {}).get('v')})
    if dark: check((l or {}).get('win', 0) > 0, f'{name}: vinduene lyser om natta ({(l or {}).get("win")} lys)')
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
        for kind in KINDS:
            if only and kind not in only: continue
            for mode in [m for m in ('kai', 'fart') if os.environ.get('NPC_SHOT_MODE', m) == m]:
                for dark in ((False, True) if fmt == 'liggende' else (False,)): await shot(pg, kind, mode, dark, fmt, R)   # (stående by day only: the night's lights are the same in either format, and the run must end within the hour)
        # the levels by distance (liggende only): the coastal ship at Bergen's quay from 300 m, 1 km and 2.2 km
        if fmt == 'liggende' and (not only or 'kystrute' in only):
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
