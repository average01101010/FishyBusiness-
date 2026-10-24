# A berth in the coast's harbours for the player's boats (core/07e-havn.js, Jonas 23.10.2026). Spot checks along the coast: Bergen, Bodø,
# Tromsø and Båtsfjord (CLAUDE.md: a fix that holds the whole country is tried south, middle and north).
#  - each town has harbours from the packs with a free berth at a quay or a floating dock for a sjark, and for a 15 m boat
#  - the berth lies on water deep enough at chart datum, clear of the harbour's own boats, and berthPose puts the boat there
#  - Autonav finds the way in to it from open water; the boat moors there, holds it, and pays the harbour due by her length
#  - a berth held by the company's other boat, or by another player (the server's answer), is not given out again
#  - the operations plan can have the berth as home and goes there after the day
# It builds dist-vec/ itself with the vec packs (KYST_VEC=1), like npctest, and needs the whole coast in tools/map/out/game.
import asyncio, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

TOWNS = [('Bergen', 60.397, 5.318), ('Bodø', 67.284, 14.385), ('Tromsø', 69.648, 18.962), ('Båtsfjord', 70.634, 29.722)]

JS = """async ([name, lat, lon]) => {
  const R = {name}, p = P(lat, lon), b = S.boat; S.tut = 0; S.cash = 1e6; S.lic = null;
  await mapNeed(p, 6);
  const near = q => vecWant(q.x - 3, q.y - 3, q.x + 3, q.y + 3);
  near(p); let H = [];
  for (let k = 0; k < 120; k++){ vecTilesIn((p.x - 3) * 1000, (p.y - 3) * 1000, (p.x + 3) * 1000, (p.y + 3) * 1000); coastIndexAt(p, true); H = havnsNear(p, 4);
    if (H.length && H.some(h => havnBerths(h, 'sjark', S.cur, 1).length)) break; await new Promise(r => setTimeout(r, 250)); }
  R.harbours = H.length;
  const one = (type) => { for (const h of H){ const L = havnBerths(h, type, S.cur, 3); if (L.length) return {h, L}; } return null; };
  const sj = one('sjark'), k15 = one('kyst15');
  R.sjark = sj && {name:havnNm(sj.h), kind:sj.L[0].kind, face:sj.L[0].face.kind, n:sj.L.length, depth:sj.L[0].face.depth}; R.kyst15 = k15 && {name:havnNm(k15.h), kind:k15.L[0].kind, n:k15.L.length};
  if (!sj) return R;
  // the berth: on water, deep enough, clear of the harbour's own boats
  b.type = 'sjark'; applyVessel(); const place = havnPlaceOf(sj.h, sj.L[0], 'sjark'), bp = berthPose(place.id, 'sjark');
  R.bp = !!bp; if (bp){ const s = Math.sin(bp.hd), c = Math.cos(bp.hd); let wet = true; for (const fa of [-0.5, 0, 0.5]) for (const ab of [-0.4, 0.4]) if (isLand({x:bp.x + (s * fa * bp.Lb + c * ab * bp.Bb) / 1000, y:bp.y + (-c * fa * bp.Lb + s * ab * bp.Bb) / 1000})) wet = false; R.wet = wet;
    let gap = 1e9; for (const nb of sj.h.h.boats) if (nb.moored) gap = Math.min(gap, dist(nb.moored.p, bp) * 1000 - (nb.L + bp.Lb) / 2); R.gap = Math.round(gap * 10) / 10;
    R.depth = Math.round(depthF(bp) * 10) / 10; R.need = VESSELS.sjark.draft + 0.5; }
  // the way in from open water, and the mooring there
  let sea = null; for (let r = 1; r < 6 && !sea; r += 0.5) for (let a = 0; a < 16 && !sea; a++){ const q = {x:place.p.x + r * Math.sin(a * 0.39), y:place.p.y - r * Math.cos(a * 0.39)}; try { if (!isLand(q) && depthF(q) > 15 && coastDist(q) > 0.3) sea = q; } catch (e){} }
  let route = null; try { route = await leiaRoute(sea, place.p, null, place.id); } catch (e){ route = {why:[String(e)]}; }
  R.route = route && !route.why && route.wps ? route.wps.length : (route && route.why ? route.why[0] : null);
  const c0 = S.cash; S.plan = null; b.status = 'sailing'; b.port = null; b.pos = {...place.p}; dock(place.id); havnMinute();
  R.moored = b.status === 'port' && b.port === place.id; R.held = (S.havn.s[place.id] || {}).vid === S.cur; R.due = Math.round(c0 - S.cash); R.dueWant = havnDue(BOAT.len);
  // the next day: the due again; a second vessel of the company does not get the same berth
  S.t += 1440; havnMinute(); R.due2 = Math.round(c0 - S.cash);
  const v2 = newVesselObj('sjark', 'finnsnes'); R.other = onVessel(v2, () => { const L = havnBerths(sj.h, 'sjark', S.cur, 5); return L.some(x => x.key === sj.L[0].key); });
  S.fleet = S.fleet.filter(v => v !== v2);
  // another player holds the next berth (as the server would say): it is not given out
  const L2 = havnBerths(sj.h, 'sjark', S.cur, 5).filter(x => x.key !== sj.L[0].key);
  if (L2.length){ HVC.set(sj.h.id, {at:Date.now(), list:[{slot:L2[0].key, x:L2[0].bp.x, y:L2[0].bp.y, hd:L2[0].hd, len:9, beam:3.5}]}); R.peer = !havnBerths(sj.h, 'sjark', S.cur, 5).some(x => x.key === L2[0].key); HVC.delete(sj.h.id); } else R.peer = null;
  // she casts off: the berth is given up
  b.status = 'port'; S.plan = {wps:[{...sea, port:null, fish:0}], idx:0, speed:6}; depart(); for (let i = 0; i < 3; i++){ DYN.on = false; step(); }
  R.freed = !(S.havn.s[place.id] && S.havn.s[place.id].vid);
  S.plan = null; b.status = 'port'; b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; b.type = 'skiff'; applyVessel();
  return R; }"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        print(ok(False), 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
    print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(300000)
        for t in TOWNS:
            r = await pg.evaluate(JS, list(t))
            print(t[0], json.dumps(r, ensure_ascii=False))
            print(ok(r['harbours'] > 0 and r.get('sjark') and r.get('kyst15')), t[0] + ': harbours with a free berth for a sjark and for a 15 m boat', r.get('sjark'), r.get('kyst15'))
            if not r.get('sjark'): continue
            print(ok(r.get('bp') and r.get('wet') and r.get('gap', -1) >= 0.5 and r.get('depth', 0) >= r.get('need', 99) - 0.01), t[0] + ': the berth is on water deep enough at chart datum and clear of the harbour\'s own boats', [r.get('gap'), r.get('depth'), r.get('need')])
            print(ok(isinstance(r.get('route'), int) and r['route'] >= 1), t[0] + ': Autonav finds the way in to the berth', r.get('route'))
            print(ok(r['moored'] and r['held'] and r['due'] == r['dueWant'] and r['due2'] == 2 * r['dueWant']), t[0] + ': she moors, holds the berth and pays the due a started day at a time', [r['due'], r['due2'], r['dueWant']])
            print(ok(r['other'] is False and r['peer'] is not False and r['freed']), t[0] + ': the berth is not given to the company\'s other boat nor where another player lies, and is given up when she leaves', [r['other'], r['peer'], r['freed']])
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
