"""Autonav between every plant and its nearest plants along the whole coast, and a few of the longest ways (step 3 of the coast-wide
Autonav, Jonas 08.10.2026: «Autonav må fungere 10 av 10 ganger»). Each route is checked the way the simulation sails it: groundCheck
(land every 5 m, the depth) and isLand every 5 m on every leg. Prints one line per pair that fails (no route, or a leg on land or
aground) and a summary; writes tests/out/allpairs-<shard>.json. Exits 1 when any pair fails.
  python3 tests/allpairs.py                 all pairs (an hour or more)
  SHARD=2/4 python3 tests/allpairs.py       the second quarter (.github/workflows/autonav.yml runs four side by side)
  K=3 python3 tests/allpairs.py             the three nearest plants of each (default 3)"""
from _env import GAME, boot, OUT
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright

K = int(os.environ.get('K', '3'))
SH = os.environ.get('SHARD', '1/1'); SI, SN = (int(x) for x in SH.split('/'))

PAIRS = """(k) => { const M = PORTS.filter(p => p.mottak && p.p.x > MAPB.x0 + 1), seen = new Set(), out = [];
  for (const a of M){ const near = M.filter(b => b !== a).map(b => [b, dist(a.p, b.p)]).filter(x => x[1] > 2 && x[1] / NM < 250).sort((x, y) => x[1] - y[1]).slice(0, k);
    for (const [b] of near){ const key = [a.id, b.id].sort().join('|'); if (seen.has(key)) continue; seen.add(key); out.push([a.id, b.id]); } }
  // the longest ways: the south-east to the far north-east, and across the open waters
  const far = (lat, lon) => { const q = P(lat, lon); return M.slice().sort((x, y) => dist(x.p, q) - dist(y.p, q))[0].id; };
  out.push([far(59.9, 10.7), far(69.7, 30.0)], [far(58.1, 7.99), far(70.98, 25.97)], [far(60.39, 5.32), far(68.23, 14.56)], [far(67.28, 14.4), far(70.66, 23.68)]);
  return out; }"""

CHECK = """async ([ai, bi]) => {
  const A = portById(ai), B = portById(bi); S.boat.status = 'port'; S.boat.port = A.id; S.boat.pos = {x:A.p.x, y:A.p.y};
  await mapNeed(A.p, 1);
  const t0 = performance.now(); let r; try { r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); } catch (e){ return {err:String(e && e.stack || e).slice(0, 300)}; }
  const ms = Math.round(performance.now() - t0);
  if (r.why) return {why:r.why[0], ms};
  const bad = []; let p0 = {x:A.p.x, y:A.p.y};
  for (let i = 0; i < r.wps.length; i++){ const w = r.wps[i], L = dist(p0, w);
    await mapNeed({x:(p0.x + w.x) / 2, y:(p0.y + w.y) / 2}, Math.min(40, L / 2 + 0.5));
    let gp = null, land = null; try { gp = groundCheck(p0, w); const n = Math.max(1, Math.ceil(L / 0.005));
      for (let k = 1; k < n; k++){ const q = {x:p0.x + (w.x - p0.x) * k / n, y:p0.y + (w.y - p0.y) * k / n}; if (!inHarbour(q) && isLand(q)){ land = q; break; } } } catch (e){ bad.push({i, err:String(e).slice(0, 120)}); }
    if (gp || land) bad.push({i, gp, land, from:p0, to:w});
    p0 = w; }
  return {n:r.wps.length, nm:+r.nm.toFixed(1), ms, by:r.st.by || 'grid', soft:r.st.soft || 0, bad};
}"""


async def main():
    t0 = time.time()
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(0)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=120000)
        pairs = await pg.evaluate(PAIRS, K)
        mine = [x for i, x in enumerate(pairs) if i % SN == SI - 1]
        res, fail, slow = [], 0, 0
        for ai, bi in mine:
            r = await pg.evaluate(CHECK, [ai, bi]); r['a'], r['b'] = ai, bi; res.append(r)
            bad = r.get('err') or r.get('why') or r.get('bad')
            if bad:
                fail += 1
                print('FEIL %s -> %s: %s' % (ai, bi, json.dumps({k: v for k, v in r.items() if k not in ('a', 'b')}, ensure_ascii=False)[:500]), flush=True)
            if r.get('ms', 0) > 20000: slow += 1
            # the packs and blocks of a long way are let go between pairs (the page would hold the whole coast)
            if len(res) % 25 == 0: await pg.evaluate("(() => { if (MAPD.blk) { MAPD.blk.clear(); MAPD.bytes = 0; } })()")
        await br.close()
    ms = sorted(r.get('ms', 0) for r in res if 'ms' in r)
    summ = {'shard': SH, 'pairs': len(mine), 'fail': fail, 'net': sum(1 for r in res if r.get('by') == 'net'), 'soft': sum(r.get('soft', 0) for r in res),
            'ms_median': ms[len(ms) // 2] if ms else None, 'ms_max': ms[-1] if ms else None, 'slow_over_20s': slow, 'page_errors': errs[:5], 'minutes': round((time.time() - t0) / 60, 1)}
    json.dump({'summary': summ, 'results': res}, open(os.path.join(OUT, 'allpairs-%s.json' % SH.replace('/', 'of')), 'w'), ensure_ascii=False)
    print(('OK  ' if not fail and not errs else 'FEIL') + ' Autonav mellom mottakene langs hele kysten: ' + json.dumps(summ, ensure_ascii=False))
    sys.exit(1 if fail or errs else 0)

asyncio.run(main())
