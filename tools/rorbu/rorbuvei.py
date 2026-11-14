# Moves the rorbuer the boats they take have no way out from (13.11.2026, steg 126 AS1; Jonas: «Jeg MÅ vite at alle stedene i spillet
# fungerer som de skal og at spillere ikke blir stuck NOEN steder», and «Grense ved 15 m»: a rorbu takes boats up to 15 m). The game
# finds a rorbu's quay near its point (07d-rorbu.js rorbuSite) where the boat gets out by water within 1.2 km (naustWay); tests/allesteder.py
# found 37 where Autonav then found no way on from there for the biggest boat it takes (kyst15, 14.99 m, 3.0 m), at any tide: a fjord
# arm shut by a sill, a bay behind a shoal. For each of those (KYST_RORBU=id,... or the rorbuer with no route in tests/out/allesteder.json)
# the game is asked, over Playwright, about points by the shore in rings round the old one (0.3 to 4.5 km, nearest first; the kind by a plant stands 1.5-4 km from it, rorbuer.py): the rorbu's
# point set there, its quay found as the game finds it, kyst15 put at its berth (on water, her draught under her at the lowest tide)
# and Autonav asked for a way from there as the test asks it (leiaRoute to one of the three nearest trade places 2-200 km off or open
# water within 3 km, now or at any third hour over the next twelve). The first point that holds is written as the rorbu's point in
# src/data/rorbuer.json (the order and so the ids rb<i> stay; a boat moored there moves with it, rorbuSite). A point keeps APART km
# from the plants, the shops, the yards and the other rorbuer (rorbuer.py).
#   KYST_VEC=1 KYST_DIST=dist-vec node build.mjs && python3 tools/rorbu/rorbuvei.py [--dry]
# (in parallel: KYST_RORBU=<a share> ... --dry > log in each process, then python3 tools/rorbu/rorbuvei.py --apply log1 log2 ...)
import os, sys, json, asyncio
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist-vec')
sys.path.insert(0, os.path.join(ROOT, 'tests'))
RORBU = os.path.join(ROOT, 'src', 'data', 'rorbuer.json')
APART = 1.5
# where no point APART km from the others has a way out (a rorbu behind a low bridge, Svolvær: the open water by the town is all within
# 1.5 km of its plant, shop and yard), a second round at APART2
APART2 = 0.8
# KYST_RORBU_FAST=1: each point asks for the way to open water within 3 km and the nearest trade place only, open water first (a way
# that is not found takes 45-50 s a search where the water is shut in, Langvasseid 14.11.2026: three places and five tides were over ten
# minutes a point, and the rings over an hour). A point that holds this way holds the test's way too (it tries those and two more)
FAST = os.environ.get('KYST_RORBU_FAST') == '1'

TRY = r"""async ([id, apart, FAST]) => { const R = RBID.get(id), b = S.boat, c0 = {x:R.cand.x, y:R.cand.y}; TAB.held = true; S.tut = 0;
  if (b.type !== 'kyst15'){ b.type = 'kyst15'; if (!S.owned.includes('kyst15')) S.owned.push('kyst15'); applyVessel(); }
  const V = VESSELS[b.type], tried = [];
  const others = PORTS.map(q => q.p).concat([...RBID.values()].filter(Q => Q.id !== id).map(Q => Q.cand));
  const dests = PORTS.filter(q => !q.havOnly);
  // the way out from the rorbu as it stands (R.site found): {ok, nm, h} or {ok:false, why}
  const wayOut = async () => {
    for (const k in BERTHPOSE) delete BERTHPOSE[k];
    S.plan = null; b.status = 'port'; b.port = id; b.berth = 'main'; b.pos = {x:R.p.x, y:R.p.y}; b.dyn = null;
    const bp = berthPose(id, b.type, 'main'); if (!bp) return {ok:false, why:'no berth'};
    const fx = Math.sin(bp.hd), fz = -Math.cos(bp.hd), sx = Math.cos(bp.hd), sz = Math.sin(bp.hd), X = bp.x * 1000, Z = bp.y * 1000;
    const pts = [[0, 0], [bp.Lb / 2 - 1, 0], [-bp.Lb / 2 + 1, 0], [0, bp.Bb / 2 - 0.3], [0, -bp.Bb / 2 + 0.3]].map(([l, s2]) => ({x:(X + fx * l + sx * s2) / 1000, y:(Z + fz * l + sz * s2) / 1000}));
    if (pts.some(p => isLand(p))) return {ok:false, why:'hull on land'};
    const dmin = Math.min(...pts.map(p => depthF(p))); if (dmin < V.draft) return {ok:false, why:'shallow ' + dmin.toFixed(1)};
    const from = {...(quayPos(b) || b.pos)};
    const cands = dests.filter(q => dist(q.p, from) > 2 && dist(q.p, from) < 200).sort((a, c) => dist(a.p, from) - dist(c.p, from)).slice(0, FAST ? 1 : 3).map(q => ({p:q.p, id:q.id}));
    let open = null; for (let rr = 0.5; rr <= 3 && !open; rr += 0.25) for (let a = 0; a < 6.28; a += 0.26){ const c = {x:from.x + Math.cos(a) * rr, y:from.y + Math.sin(a) * rr}; try { if (!isLand(c) && depthF(c) > 15 && coastDist(c) > 0.3){ open = {p:c, id:null}; break; } } catch (e){} }
    if (open) cands[FAST ? 'unshift' : 'push'](open);
    const T0 = S.t; let last = '';
    try { for (let h = 0; h <= 12; h += 3){ S.t = T0 + h * 60;
      for (const q of cands){ await mapPreload([q.p], [['sim', 3], ['chart', 3]]); let r = null; try { r = await leiaRoute(from, q.p, id, q.id); } catch (e){ r = {why:['error ' + String(e && e.message).slice(0, 60)]}; } if (r && r.wps) return {ok:true, h, nm:+r.nm.toFixed(1)}; last = r && r.why ? r.why[0] : 'none'; } } } finally { S.t = T0; }
    return {ok:false, why:'no way out: ' + last}; };
  const setAt = p => { R.cand = {x:p.x, y:p.y}; R.p = {x:p.x, y:p.y}; R.coast = {x:p.x, y:p.y}; R.xy = [p.x, p.y]; R.shore = [p.x, p.y]; delete R.site; RORBU.ver = (RORBU.ver || 0) + 1; delete APPROACH[id]; R.free = undefined; if (typeof QUAYF !== 'undefined') QUAYF = null; };
  for (const rr of [0.3, 0.6, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]){
    const ring = []; for (let a = 0; a < 6.28; a += 0.2618){ const p = {x:c0.x + Math.cos(a) * rr, y:c0.y + Math.sin(a) * rr}; ring.push(p); }
    for (const p of ring){
      if (others.some(o => dist(o, p) < apart)) continue;
      try { await mapPreload([p], [['sim', 3], ['chart', 3], ['vec', 1.5]]); if (isLand(p) || coastDist(p) > 0.25) continue; } catch (e){ continue; }
      setAt(p); let s = null; try { s = rorbuSite(R); } catch (e){} if (!s){ tried.push([rr, 'no site']); continue; }
      const w = await wayOut(); { const ll = natLL(R.p); tried.push([rr, w.ok ? 'ok' : w.why, +ll.lat.toFixed(4), +ll.lon.toFixed(4)]); }
      if (w.ok){ const ll = natLL(p); return {ok:true, x:+p.x.toFixed(1), y:+p.y.toFixed(1), rr, ll:[+ll.lat.toFixed(4), +ll.lon.toFixed(4)], nm:w.nm, h:w.h, n:tried.length}; }
    }
  }
  setAt(c0); return {ok:false, n:tried.length, last:tried.slice(-4), all:tried}; }"""

def apply(logs):
    """--apply <log>...: the points from earlier --dry runs (their «  rbN  name  {...}» lines) written as one, so the rorbuer can be
    tried in several processes at once"""
    import ast
    D = json.load(open(RORBU)); n = 0
    for f in logs:
        for line in open(f):
            m = line.strip().split(None, 1)
            if not m or not m[0].startswith('rb') or '{' not in line: continue
            r = ast.literal_eval(line[line.index('{'):].strip())
            if r.get('ok'): D['r'][int(m[0][2:])][0] = r['x']; D['r'][int(m[0][2:])][1] = r['y']; n += 1
    D['rorbuvei'] = '%d rorbuer moved to a quay the boats up to 15 m have a way out from by Autonav, tools/rorbu/rorbuvei.py' % (n + int(str(D.get('rorbuvei', '0')).split(' ')[0] or 0))
    json.dump(D, open(RORBU, 'w'), ensure_ascii=False, separators=(',', ':')); print(n, 'moved')

def main():
    if '--apply' in sys.argv: return apply([a for a in sys.argv[1:] if a != '--apply'])
    from _env import GAME, boot
    from playwright.async_api import async_playwright
    D = json.load(open(RORBU))
    ids = [s for s in os.environ.get('KYST_RORBU', '').split(',') if s]
    if not ids:
        R = json.load(open(os.path.join(ROOT, 'tests', 'out', 'allesteder.json')))
        ids = [r['id'] for r in R if r.get('kind') == 'rorbu' and str(r.get('why', '')).startswith(('route', 'no harbour'))]
    print(len(ids), 'rorbuer to move', flush=True)
    async def run():
        async with async_playwright() as p:
            br = await p.chromium.launch(); pg = await (await br.new_context(viewport={'width': 1280, 'height': 800})).new_page()
            await boot(pg, GAME + ('' if 'no3d' in GAME else ',no3d')); out = {}
            for i in ids:
                r = await pg.evaluate(TRY, [i, APART, FAST])
                if not r.get('ok'): r = await pg.evaluate(TRY, [i, APART2, FAST]); r['apart'] = APART2
                out[i] = r; print('  %-6s %-22s %s' % (i, D['r'][int(i[2:])][3], r), flush=True)
            await br.close(); return out
    res = asyncio.run(run())
    moved = [(i, r) for i, r in res.items() if r.get('ok')]
    for i, r in res.items():
        if not r.get('ok'): print('UNSOLVED', i, D['r'][int(i[2:])][3], r)
    if moved and '--dry' not in sys.argv:
        for i, r in moved: D['r'][int(i[2:])][0] = r['x']; D['r'][int(i[2:])][1] = r['y']
        D['rorbuvei'] = '%d rorbuer moved to a quay the boats up to 15 m have a way out from by Autonav, tools/rorbu/rorbuvei.py' % (len(moved) + int(str(D.get('rorbuvei', '0')).split(' ')[0] or 0))
        json.dump(D, open(RORBU, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(moved), 'moved,', len(res) - len(moved), 'unsolved')

if __name__ == '__main__': main()
