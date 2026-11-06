"""The draft's hazards and the packs along it (core/01-world.js draftHazards, legReady; 11c-leinett.js lnetLoad). Adrian 06.11.2026,
four freezes in one evening (Bodø → Husøy twice, a harbour by Andenes, Engenes): the chart plotter froze the moment the way was in,
and then every start with the draft in the save. draftHazards found a leg whose packs were «not ready» (legReady looked at every pack
in the leg's whole box), waited for lnetLoad (which from 05.11.2026 fetches only 5 km pieces with half a kilometre round the line),
and its .then called routeChanged, which ran draftHazards again on the same leg, still not ready, so the same wait began again, resolved
at once, and the chain of microtasks never gave the thread back. No error, no timer, no beat.

Here with Senja's four sim tiles only: a diagonal draft leg whose box holds a tile the line never comes near (that tile's packs dropped
first). routeChanged is wrapped to count the calls that come back from the wait and to break the chain after eight, so the page can
be read. Before the fix: the chain runs (the count hits the cap within a second). After: routeChanged is called back at most once,
the hazards are marked as failed for that draft, and a reload with the draft in the save boots and answers. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:600])
    if not c: bad.append(msg)

READY = "typeof SIMREADY !== 'undefined' && SIMREADY === true"
# the leg: from tile 16-6 to tile 17-7 by way of 17-6, so that 16-7 lies in the box but off the line; the packs are found from the
# manifest, so the test says so if the layout is not the one it expects
SETUP = """(() => {
  const A = {x:805, y:305}, B = {x:895, y:385}, box = (p, q) => [Math.min(p.x, q.x) - 0.5, Math.min(p.y, q.y) - 0.5, Math.max(p.x, q.x) + 0.5, Math.max(p.y, q.y) + 0.5];
  const inBox = mapPacksIn('sim', ...box(A, B)); const near = new Set();
  const m = Math.max(1, Math.ceil(dist(A, B) / 5));
  for (let u = 0; u < m; u++){ const p = {x:A.x + (B.x - A.x) * u / m, y:A.y + (B.y - A.y) * u / m}, q = {x:A.x + (B.x - A.x) * (u + 1) / m, y:A.y + (B.y - A.y) * (u + 1) / m}; for (const pk of mapPacksIn('sim', ...box(p, q))) near.add(pk.file); }
  const off = inBox.filter(pk => !near.has(pk.file));
  if (!off.length) return {err:'no sim pack in the box off the line', inBox:inBox.map(p => p.file), near:[...near]};
  // (dropped: as a pack not in yet; the chart pack of the same tile too, so legReady of the old kind says not ready for either reason)
  for (const pk of off) mapDrop(pk);
  for (const pk of mapPacksIn('chart', ...box(A, B))){ const t = pk.tile || []; if (off.some(o => (o.tile || [])[0] === t[0] && (o.tile || [])[1] === t[1])) mapDrop(pk); }
  S.tut = 0; S.plan = null; S.boat.status = 'idle'; S.boat.port = null; S.boat.pos = {x:A.x, y:A.y}; S.draft = [{x:B.x, y:B.y, port:null, fish:0}];
  const rc0 = routeChanged; window.__RC = {n:0, back:0, ks:[]}; let depth = 0;
  // the calls that come back from the wait's .then are the ones outside any other call (depth 0); the chain breaks after eight
  routeChanged = function(){ const R = window.__RC; R.n++; if (depth === 0) R.back++; if (R.n > 8){ hzCache.k = 'fail|stopped'; return; } depth++; try { rc0(); } finally { depth--; } R.ks.push(String(hzCache.k).slice(0, 5)); };
  const r0 = legReady(A, B); hzCache.k = '';
  window.__RC.back = -1;   // (the first call is the test's own, not one that came back)
  routeChanged();
  return {off:off.map(p => p.file.slice(0, 10)), readyBefore:r0, k0:String(hzCache.k).slice(0, 5)}; })()"""
AFTER = "(() => { const R = window.__RC; let a = S.boat.pos, ready = true; for (const w of S.draft){ if (!legReady(a, w)) ready = false; a = w; } return {n:R.n, back:R.back, ks:R.ks.slice(0, 12), k:String(hzCache.k).slice(0, 12), ready, draft:S.draft.length}; })()"


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function(READY, timeout=120000)
        s = await pg.evaluate(SETUP)
        check('err' not in s, 'a sim tile lies in the leg\'s box and off the line, and is dropped', s)
        await pg.wait_for_timeout(4000)
        a = await pg.evaluate(AFTER)
        print(json.dumps({'setup': s, 'after': a}, ensure_ascii=False)[:500])
        check(a['back'] <= 1, 'routeChanged comes back from the wait at most once (before the fix the chain ran until the cap of eight)', a)
        check(a['k'].startswith('fail|') or a['ready'], 'the hazards are marked as failed for that draft (or the legs are ready), so nothing waits again', a)
        # the start with the draft in the save: the game must come up and answer
        await pg.evaluate("(() => { routeChanged = (() => {}); save(); })()")
        await pg.reload()
        up = False
        try: await pg.wait_for_function(READY, timeout=60000); up = True
        except Exception: pass
        ans = None
        if up:
            try: ans = await asyncio.wait_for(pg.evaluate("(() => { let a = S.boat.pos, n = 0; for (const w of S.draft){ draftHazards(); n++; a = w; } return {draft:S.draft.length, k:String(hzCache.k).slice(0, 12)}; })()"), 20)
            except Exception: ans = None
        check(up and ans is not None and ans['draft'] == 1, 'a start with the draft in the save comes up and answers within a minute', {'up': up, 'ans': ans})
        check(not errs, 'no page errors', errs[:4])
        await b.close()
    print('røde:', bad if bad else 'ingen')

asyncio.run(main())
