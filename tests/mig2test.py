from _env import GAME, ROUTES, boot
# The move to the national frame (phase K4 of the coast plan): a game saved in the legacy frame (v1) is read from its old key, every
# position in it lands within a metre of where it was, the stock goes along, and the v1 save is left as it was.
# The v1 save is made from a v2 game by turning it back (LGI), so the test also holds the two ways of the projection to each other.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
R = json.load(open(ROUTES))['0']
SETUP = """(w) => { S.mult = 0; S.tut = 0; S.settings.autoOn = false; S.t = Math.round((Date.UTC(2028, 2, 10, 6) - EPOCH) / 6e4); S.stock = initStock();
  const wps = w.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === w.length - 1 ? 2 : 0})); S.plan = {wps, idx:0, speed:8}; depart();
  catchUp(2 * 3600e3 / GAME_RATE);
  const g = GROUNDS[2].p; S.marks = (S.marks || []).concat([{x:g.x, y:g.y, n:'Merke'}]); S.draft = [{x:g.x + 1, y:g.y + 1, port:null}];
  S.sets = [{id:'s9', vid:S.cur, kind:'garn', n:10, a:{x:g.x, y:g.y}, b:{x:g.x + 0.4, y:g.y + 0.1}, tSet:S.t - 120, acc:{}, dead:0, lost:null, cond:1}];
  takeStock(GROUNDS[5].p, 300, 'krabbe'); takeStock(GROUNDS[1].p, 4000);
  window.removeEventListener('pagehide', save); save(); return localStorage.getItem(KEY); }"""
# the same save turned back into the legacy frame, as a v1 game would have it
TO_V1 = """(s) => { const o = JSON.parse(s);
  const walk = v => { if (!v || typeof v !== 'object') return; if (typeof v.x === 'number' && typeof v.y === 'number'){ const q = LGI(v); v.x = q.x; v.y = q.y; } for (const k in v) if (k !== 'stock' && k !== 'cstk') walk(v[k]); };
  for (const v of [o].concat(o.fleet || [])) if (v.boat && typeof v.boat.heading === 'number'){ const l = LGI(v.boat.pos); v.boat.heading -= LGrot(l.x, l.y); }
  walk(o);
  const dense = m => { const a = []; for (let i = 0; i < 40 * 42; i++){ const c = i % 40, r = Math.floor(i / 40); a.push(stkGet(m, stockIdx(LG((c + 0.5) * 2, (r + 0.5) * 2)))); } return a; };
  o.stock = dense(o.stock || {}); if (o.cstk) o.cstk = dense(o.cstk); o.v = 1; delete o.frame;
  const v1 = JSON.stringify(o); localStorage.setItem(KEY_V1, v1); localStorage.removeItem(KEY); return v1; }"""
# every point in a save, by its path
PTS = """(s) => { const out = {}; const walk = (v, path) => { if (!v || typeof v !== 'object') return; if (typeof v.x === 'number' && typeof v.y === 'number') out[path] = [v.x, v.y];
  for (const k in v) if (k !== 'stock' && k !== 'cstk') walk(v[k], path + '.' + k); }; const o = JSON.parse(s); walk(o, 'S');
  const hd = (o.fleet || []).map(v => v.boat && v.boat.heading); return {pts:out, hd, stock:o.stock, cstk:o.cstk, v:o.v}; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 900, 'height': 700})).new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        s2 = await pg.evaluate(SETUP, R)
        v1 = await pg.evaluate(TO_V1, s2)
        a = await pg.evaluate(PTS, s2)
        await pg.reload()
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        await pg.evaluate("S.mult = 0; window.removeEventListener('pagehide', save)")
        s3 = await pg.evaluate("(() => { save(); return localStorage.getItem(KEY); })()")
        c = await pg.evaluate(PTS, s3)
        keep = await pg.evaluate("localStorage.getItem(KEY_V1)")
        st = await pg.evaluate("(() => ({at:GROUNDS.map(g => +stockAt(g.p).toFixed(4)), crab:+stockAt(GROUNDS[5].p, 'krabbe').toFixed(4), boat:S.boat.status, port:S.boat.port}))()")
        st0 = await pg.evaluate("""(s) => { const o = JSON.parse(s), keep = [S.stock, S.cstk]; S.stock = o.stock; S.cstk = o.cstk;
          const r = {at:GROUNDS.map(g => +stockAt(g.p).toFixed(4)), crab:+stockAt(GROUNDS[5].p, 'krabbe').toFixed(4)}; S.stock = keep[0]; S.cstk = keep[1]; return r; }""", s2)
        import math
        miss = [k for k in a['pts'] if k not in c['pts']]
        err = max([math.hypot(a['pts'][k][0] - c['pts'][k][0], a['pts'][k][1] - c['pts'][k][1]) * 1000 for k in a['pts'] if k in c['pts']] or [1e9])
        kinds = sorted(set(k.split('.')[3] if k.startswith('S.fleet.') else k.split('.')[1] for k in a['pts']))
        print(json.dumps({'points':len(a['pts']), 'kinds':kinds, 'missing':miss[:8], 'errM':err, 'hd':[a['hd'], c['hd']], 'v':c['v'], 'stock':[st0, st],
                          'cells':[len(a['stock'] or {}), len(c['stock'] or {})]}))
        print(ok(c['v'] == 2 and keep == v1), 'the v1 game is read from its old key and saved as v2; the v1 save is left as it was')
        print(ok(len(a['pts']) >= 20 and not miss and err < 1), 'every position (%d, in %s) lands within a metre of where it was: %.4f m' % (len(a['pts']), ', '.join(kinds), err))
        print(ok(all(abs(x - y) < 1e-6 for x, y in zip(a['hd'], c['hd']) if x is not None)), 'the boat\'s heading turns with the frame')
        print(ok(all(abs(x - y) < 0.03 for x, y in zip(st0['at'], st['at'])) and abs(st0['crab'] - st['crab']) < 0.03), 'the stock (fish and crab) at the grounds is what it was, within the 2 km cells moving: %s' % json.dumps([st0, st]))
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
