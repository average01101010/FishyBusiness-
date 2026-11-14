# Moves the plants, yards and tackle shops whose berth is shut in by their own quay and fill to a quay face with water out to the sea
# (13.11.2026; a tester on test.detstorebla.no: «Jeg er stuck ved fiskemottaket i ålesund og kan ikke bruke autonav eller andre midler for
# å komme med videre. Gjelder dette flere steder i landet?»; Jonas: «Flytt kaiplassene»). Six harbours lay in pockets where the quay and the
# fill shut the water in (the plants in Ålesund, Fosnavåg, Laukvik and Vengsøy, the shops in Vanse and Søndeled): the game let their way out
# cross the fill (core/07-harbours.js approachPath pt.free), and in 3D the boat sailed through the fill, or (Søndeled) found no way at all.
# The game is the judge, since what shuts a basin is its own isLand (the fine coast, the units' block and fill, the dredged basins): a copy of
# it here missed four of the six. So the built game (dist-vec/, with the whole coast) is asked, over Playwright:
#   1. which harbours have no way in over water (approachPath sets pt.free, or finds nothing);
#   2. for each, the quay faces near it that the places' rules allow (cands: good by tools/steder/steder.py's criteria, as landflytt.py down
#      to a stretch of coast of 8 m and 1.5 m of water; land behind the unit, landflytt.land_gap within GAPOK m; within REACH km, 500 m first,
#      never over 3 km; SPACE km to every other place and YARDS km to the other yards; no bridge and no fixed obstacle in the berth), in
#      that order, are tried in the game: the unit and the harbour point set down there, and the way in searched again. The first with a way
#      over water is taken.
# Only q (the face) of the plants in src/data/mottak.json changes, and the entry in src/data/steder.json. Reads the vector packs
# (tools/map/out/game) and the built game; run it after landflytt.py, and build again after it (a second run finds nothing to move).
# tests/lukket.py checks every harbour along the coast the same way.
# --vei (13.11.2026, steg 126 AS1; Jonas: «Flytt alle»): the harbours the older coastal vessel (kyst21, 21 m, 3.4 m) has no way out from
# at any tide, as tests/allesteder.py finds them (KYST_LUKKET=id or name,...; without it the ports with no route in
# tests/out/allesteder.json): the face is good only when she lies there with her draught under her at the lowest tide and Autonav finds
# her a way from it (leiaRoute, as the test: to one of the three nearest trade places 2-200 km off or open water within 3 km, now or at
# any third hour over the next twelve). Up to 3 km from the old face.
#   KYST_VEC=1 KYST_DIST=dist-vec node build.mjs && python3 tools/steder/lukkflytt.py [--dry] [--vei]
import os, sys, json, math, asyncio
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist-vec')
import numpy as np
import fotavtrykk as F
import mottak
from steder import good, SPACE, YARDS, sted_key, sted_id, move_sted
from landflytt import land_gap, bad, cost, GAPOK, STEDER, MOTTAK, RORBU

REACHES = tuple(float(v) for v in os.environ['KYST_REACH'].split(',')) if os.environ.get('KYST_REACH') else (0.5, 1.0, 1.5, 3.0)   # (KYST_REACH=0.5,1,1.5,3,4.5,6: farther where nothing within 3 km holds, --vei)
NCAND = 30       # faces tried in the game per place, at most
VEI = '--vei' in sys.argv
PER = 10         # (--vei) faces per ring of REACHES
if VEI: NCAND = len(REACHES) * PER

# the harbours with no way in over water, their map round them loaded: [id, name, free or 0 when none was found]
SHUT = r"""async (only) => { const R = [], E = [];
  for (const pt of PORTS.filter(q => q.coastal && UNITS[q.id] && (!only.length || only.includes(q.id)))){
    try { await mapPreload([pt.p], [['sim', 3], ['chart', 3]]); } catch (e){ E.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    delete APPROACH[pt.id]; pt.free = undefined; QUAYF = null;
    let a; try { a = approachPath(pt); } catch (e){ E.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    if (!a.length || pt.free) R.push([pt.id, pt.name, pt.free || 0]); }
  return {R, E}; }"""
# --vei: the places listed (by id or name), as [id, name, 0]
LISTED = r"""async (only) => { const R = [], E = [];
  for (const k of only){ const pt = portById(k) || PORTS.find(q => q.name === k && q.coastal); if (!pt || !UNITS[pt.id]){ E.push([k, 'not a place with a unit']); continue; } R.push([pt.id, pt.name, 0]); }
  return {R, E}; }"""
# --vei: the older coastal vessel at the place just set down: her hull on water with her draught under it at the lowest tide, and a way
# out by Autonav over the next twelve hours (as tests/allesteder.py ALS.go without the sailing)
WAYOUT = r"""async (id) => { const pt = portById(id), b = S.boat; TAB.held = true; S.tut = 0;
  if (b.type !== 'kyst21'){ b.type = 'kyst21'; if (!S.owned.includes('kyst21')) S.owned.push('kyst21'); applyVessel(); }
  for (const k in BERTHPOSE) delete BERTHPOSE[k];
  S.plan = null; b.status = 'port'; b.port = id; b.berth = 'main'; b.pos = {x:pt.p.x, y:pt.p.y}; b.dyn = null;
  const V = VESSELS[b.type], bp = berthPose(id, b.type, 'main'); if (!bp) return {ok:false, why:'no berth for her'};
  const fx = Math.sin(bp.hd), fz = -Math.cos(bp.hd), sx = Math.cos(bp.hd), sz = Math.sin(bp.hd), X = bp.x * 1000, Z = bp.y * 1000;
  const pts = [[0, 0], [bp.Lb / 2 - 1, 0], [-bp.Lb / 2 + 1, 0], [0, bp.Bb / 2 - 0.3], [0, -bp.Bb / 2 + 0.3]].map(([l, s2]) => ({x:(X + fx * l + sx * s2) / 1000, y:(Z + fz * l + sz * s2) / 1000}));
  if (pts.some(p => isLand(p))) return {ok:false, why:'hull on land'};
  const dmin = Math.min(...pts.map(p => depthF(p))); if (dmin < V.draft) return {ok:false, why:'shallow at the berth ' + dmin.toFixed(1)};
  const from = {...(quayPos(b) || b.pos)};
  const cands = PORTS.filter(q => !q.havOnly && q.id !== id && dist(q.p, from) > 2 && dist(q.p, from) < 200).sort((a, c) => dist(a.p, from) - dist(c.p, from)).slice(0, 3).map(q => ({p:q.p, id:q.id}));
  let open = null; for (let rr = 0.5; rr <= 3 && !open; rr += 0.25) for (let a = 0; a < 6.28; a += 0.26){ const c = {x:from.x + Math.cos(a) * rr, y:from.y + Math.sin(a) * rr}; try { if (!isLand(c) && depthF(c) > 15 && coastDist(c) > 0.3){ open = {p:c, id:null}; break; } } catch (e){} }
  if (open) cands.push(open);
  const T0 = S.t; let r = null;
  try { for (let h = 0; h <= 12; h += 3){ S.t = T0 + h * 60;
    for (const q of cands){ await mapPreload([q.p], [['sim', 3], ['chart', 3]]); try { r = await leiaRoute(from, q.p, id, q.id); } catch (e){ r = null; } if (r && r.wps) return {ok:true, h, nm:+r.nm.toFixed(1)}; } } } finally { S.t = T0; }
  return {ok:false, why:'no way out'}; }"""
# the place set down on the face x, y (km), a (the normal's angle), as 06b-coastports.js and 06c-steder.js set it, and its way in searched
TRY = r"""async ([id, x, y, a, len]) => { const pt = portById(id), U = UNITS[id], nx = Math.cos(a), nz = Math.sin(a), cx = x * 1000, cz = y * 1000;
  const hl = Math.max(8, len / 2), ux = -nz, uz = nx;
  U.o = [cx, cz]; U.u = [nz, -nx]; U.n = [nx, nz];
  COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
  pt.xy = [x, y]; pt.shore = [x, y]; pt.coast = {x:(cx - nx * 30) / 1000, y:(cz - nz * 30) / 1000}; pt.p = {x:Math.round(cx + nx * 15) / 1000, y:Math.round(cz + nz * 15) / 1000};
  HNEAR = null; HCELL.clear(); PCELL = null; QUAYF = null; delete APPROACH[id]; pt.free = undefined;
  try { await mapPreload([pt.p], [['sim', 3], ['chart', 3]]); } catch (e){ return {err:String(e && e.message).slice(0, 80)}; }
  let w; try { w = approachPath(pt); } catch (e){ return {err:String(e && e.message).slice(0, 80)}; }
  return {ok:!!w.length && !pt.free, n:w.length, free:pt.free || 0}; }"""

def ref_of(pid, M, S):
    if pid.startswith('m'): return ('m', pid[1:])
    for i, r in enumerate(S['r']):
        if pid == sted_id(r, S): return ('s', i)
    return None

def cands(u, ref, pts, Q, S):
    """the quay faces the places' rules allow for unit u, in the order to try them: [(j, km from the old face)]"""
    X, Y, A, Ln, D, K = Q; x0, y0 = u.o[0] / 1000, u.o[1] / 1000
    nn = min(math.hypot(x0 - a, y0 - b) for a, b, r in pts if r != ref)
    yd_nn = min([math.hypot(x0 - a, y0 - b) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1] + [1e9]) if u.kind == 'verft' else None
    out = []; taken = set()
    for reach in REACHES:
        d = np.hypot(X - x0, Y - y0); near = np.nonzero(d < reach)[0]; near = near[np.argsort(d[near])]
        n0 = len(out)   # (--vei: at most PER faces from each ring, so the far ones are tried too: a shoal across the whole bay shuts in every face near the old one, Flekkerøy)
        for sp, tier in ((SPACE, 0), (max(0.6, min(SPACE, nn)), 0), (max(0.6, min(SPACE, nn)), 1), (max(0.6, min(SPACE, nn)), 2), (max(0.6, min(SPACE, nn)), 3), (max(0.6, min(SPACE, nn)), 4), (0.6, 3), (0.6, 4)):
            bucket = []; seen = 0
            for j in near:
                j = int(j)
                if j in taken: continue
                fx, fy = float(X[j]), float(Y[j])
                if math.hypot(fx - x0, fy - y0) < 0.03: continue   # the old face, or one beside it in the same basin
                if not (good(Q, j, False) or (tier >= 1 and good(Q, j, True)) or (tier >= 2 and good(Q, j, 2)) or (tier >= 3 and Ln[j] >= 15 and D[j] >= 2.5) or (tier >= 4 and Ln[j] >= 8 and D[j] >= 1.5)): continue
                if any(math.hypot(fx - a, fy - b) < sp for a, b, r in pts if r != ref): continue
                if u.kind == 'verft' and any(math.hypot(fx - a, fy - b) < min(YARDS, yd_nn) for a, b, r in pts if r[0] == 's' and r != ref and S['r'][r[1]][5] == 1): continue
                seen += 1
                nu = F.make_unit('x', u.kind, fx, fy, float(A[j]))
                try: g2 = land_gap(nu)
                except F.Missing: continue
                if g2 > GAPOK: continue
                r2 = F.measure(nu, F.Env(nu.o[0], nu.o[1], 150))
                if bad(r2): continue
                bucket.append((cost(r2) + 20 * math.hypot(fx - x0, fy - y0), j, math.hypot(fx - x0, fy - y0)))
                if len(bucket) >= 8 or seen > 80: break
            for c in sorted(bucket): out.append((c[1], c[2])); taken.add(c[1])
            if len(out) >= NCAND: return out[:NCAND]
            if VEI and len(out) - n0 >= PER: break
    return out

async def game(work):
    sys.path.insert(0, os.path.join(ROOT, 'tests'))
    from _env import GAME, boot
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await (await br.new_context(viewport={'width': 1280, 'height': 800})).new_page()
        await boot(pg, GAME + ('' if 'no3d' in GAME else ',no3d'))
        r = await work(pg); await br.close(); return r

def main():
    Q = mottak.quay_faces(F.GAME); X, Y, A, Ln, D, K = Q
    M = json.load(open(MOTTAK)); S = json.load(open(STEDER)); RB = json.load(open(RORBU))['r']
    hx, hy = F.LG(57.395, 27.563)
    pts = [(x['q'][0], x['q'][1], ('m', x['id'])) for x in M['m'] if x.get('q')] + [(r[0], r[1], ('s', i)) for i, r in enumerate(S['r'])]
    pts += [(r[0], r[1], ('r', i)) for i, r in enumerate(RB)] + [(56.058, 53.575, ('f', 0)), (hx, hy, ('n', 0))]
    only = [s for s in os.environ.get('KYST_LUKKET', '').split(',') if s]
    if VEI and not only:
        R = json.load(open(os.path.join(ROOT, 'tests', 'out', 'allesteder.json')))
        only = [r['id'] for r in R if r.get('kind') == 'port' and str(r.get('why', '')).startswith(('route', 'no harbour'))]
    shut = asyncio.run(game(lambda pg: pg.evaluate(LISTED if VEI else SHUT, only)))
    if shut['E']: print('not checked:', shut['E'])
    for s in shut['R']: print('shut in', s)
    places = {(u.ref): u for u in F.load_places()[0] if hasattr(u, 'ref')}
    work = []
    for pid, name, free in shut['R']:
        ref = ref_of(pid, M, S); u = places.get(ref)
        if not u: print('UNKNOWN', pid, name); continue
        cs = cands(u, ref, pts, Q, S); print('  %-22s %d faces to try' % (name, len(cs)), flush=True)
        work.append((pid, name, ref, u, cs))
    async def trial(pg):
        res = {}; taken = []   # (the places moved in this run keep SPACE km to one another too; 0.6 km where a village has no other quay)
        for pid, name, ref, u, cs in work:
            for j, km in cs:
                if any(math.hypot(float(X[j]) - a, float(Y[j]) - b) < 0.6 for a, b in taken): continue
                r = await pg.evaluate(TRY, [pid, float(X[j]), float(Y[j]), float(A[j]), float(Ln[j])])
                if r.get('ok') and VEI: r = await pg.evaluate(WAYOUT, pid); print('    %-22s %4d m: %s' % (name, round(km * 1000), r), flush=True)
                if r.get('ok'): res[pid] = (j, km); taken.append((float(X[j]), float(Y[j]))); break
            else: res[pid] = None
        return res
    res = asyncio.run(game(trial)) if work else {}
    moved = []; report = []
    for pid, name, ref, u, cs in work:
        if not res.get(pid): report.append((pid, name, 'no face with a way out %s within %g km (%d tried)' % ('for the older coastal vessel' if VEI else 'over water', REACHES[-1], len(cs)))); continue
        j, km = res[pid]; new = [round(float(X[j]), 4), round(float(Y[j]), 4), round(float(A[j]), 3), round(float(Ln[j]), 1), round(float(D[j]), 2), int(K[j])]
        pts = [(new[0], new[1], r) if r == ref else (a, b, r) for a, b, r in pts]
        moved.append((ref, u.kind, name, round(km * 1000), new))
    for r in report: print('UNSOLVED', r)
    for ref, kind, name, m, new in moved:
        print('moved %-7s %-14s %-24s %5d m  -> (%.4f, %.4f)' % (kind, ref[1], name, m, new[0], new[1]))
    if moved and '--dry' not in sys.argv:
        for ref, kind, name, m, new in moved:
            if ref[0] == 'm':
                x = next(e for e in M['m'] if e['id'] == ref[1]); p = x['p']; x['q'] = new + [round(math.hypot(new[0] - p[0], new[1] - p[1]) * 1000)]
            else: move_sted(S, ref[1], new)
        nm = sum(1 for r in moved if r[0][0] == 'm'); ns = len(moved) - nm
        if VEI:
            n0 = int(str(S['meta'].get('utflytt', '0')).split(' ')[0] or 0)   # (one run after another adds up)
            S['meta']['utflytt'] = '%d places moved to a quay the older coastal vessel (21 m, 3.4 m) gets out from (Jonas 13.11.2026: «Flytt alle»), tools/steder/lukkflytt.py --vei' % (len(moved) + n0)
            if any(r[0][0] == 'm' for r in moved): M['meta']['utflytt'] = '%d plants moved to a quay the older coastal vessel gets out from, tools/steder/lukkflytt.py --vei' % sum(1 for r in moved if r[0][0] == 'm')
            S['r'].sort(key=lambda o: (o[0], o[1]))
            json.dump(M, open(MOTTAK, 'w'), ensure_ascii=False, separators=(',', ':')); json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
            print(len(moved), 'moved,', len(report), 'unsolved'); return
        S['meta']['lukkflytt'] = '%d places moved out of basins shut in by their own quay and fill (%d plants, %d yards/shops), tools/steder/lukkflytt.py' % (len(moved), nm, ns)
        M['meta']['lukkflytt'] = '%d plants moved out of basins shut in by their own quay and fill, tools/steder/lukkflytt.py' % nm
        S['r'].sort(key=lambda o: (o[0], o[1]))
        json.dump(M, open(MOTTAK, 'w'), ensure_ascii=False, separators=(',', ':')); json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(moved), 'moved,', len(report), 'unsolved')

if __name__ == '__main__': main()
