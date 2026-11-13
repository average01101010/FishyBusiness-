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
#   KYST_VEC=1 KYST_DIST=dist-vec node build.mjs && python3 tools/steder/lukkflytt.py [--dry]
import os, sys, json, math, asyncio
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'mottak')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist-vec')
import numpy as np
import fotavtrykk as F
import mottak
from steder import good, SPACE, YARDS, sted_key, sted_id, move_sted
from landflytt import land_gap, bad, cost, GAPOK, STEDER, MOTTAK, RORBU

REACHES = (0.5, 1.0, 1.5, 3.0)
NCAND = 30       # faces tried in the game per place, at most

# the harbours with no way in over water, their map round them loaded: [id, name, free or 0 when none was found]
SHUT = r"""async (only) => { const R = [], E = [];
  for (const pt of PORTS.filter(q => q.coastal && UNITS[q.id] && (!only.length || only.includes(q.id)))){
    try { await mapPreload([pt.p], [['sim', 3], ['chart', 3]]); } catch (e){ E.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    delete APPROACH[pt.id]; pt.free = undefined; QUAYF = null;
    let a; try { a = approachPath(pt); } catch (e){ E.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    if (!a.length || pt.free) R.push([pt.id, pt.name, pt.free || 0]); }
  return {R, E}; }"""
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
    shut = asyncio.run(game(lambda pg: pg.evaluate(SHUT, only)))
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
                if r.get('ok'): res[pid] = (j, km); taken.append((float(X[j]), float(Y[j]))); break
            else: res[pid] = None
        return res
    res = asyncio.run(game(trial)) if work else {}
    moved = []; report = []
    for pid, name, ref, u, cs in work:
        if not res.get(pid): report.append((pid, name, 'no face with a way out over water within 3 km (%d tried)' % len(cs))); continue
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
        S['meta']['lukkflytt'] = '%d places moved out of basins shut in by their own quay and fill (%d plants, %d yards/shops), tools/steder/lukkflytt.py' % (len(moved), nm, ns)
        M['meta']['lukkflytt'] = '%d plants moved out of basins shut in by their own quay and fill, tools/steder/lukkflytt.py' % nm
        S['r'].sort(key=lambda o: (o[0], o[1]))
        json.dump(M, open(MOTTAK, 'w'), ensure_ascii=False, separators=(',', ':')); json.dump(S, open(STEDER, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(len(moved), 'moved,', len(report), 'unsolved')

if __name__ == '__main__': main()
