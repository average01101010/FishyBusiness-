"""The start loads the map along the plan and the draft, not only round their points (ui/11-boot.js bootMapLoad, 07.11.2026; Adrian
05.11.2026: «mask block … is not loaded», and the page loaded again for it). A route from Bodø to Husøy (341 km, legs up to 84 km)
is saved once as the plan she sails and once as the draft in the chart plotter, and each is started in a fresh browser (no packs
kept): the start's own check of the plan (legClear in bootGame) and the chart's drawing of the draft (renderDyn) read the whole leg.
Before: the middle of a long leg lay in a pack the start never asked for, the read threw, and the page loaded itself again with that
pack (dsb_needpk), more than once. After: one load, nothing remembered for a second, and every leg ready (legReady: the packs the
route finder fetches along it). Needs the whole coast in the build (tools/map/out/game or KYST_MAP), as lybtest and K9. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, time
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:600])
    if not c: bad.append(msg)

READY = "typeof SIMREADY !== 'undefined' && SIMREADY === true"
# the route as the chart plotter makes it (ui/03b-route.js leiaTo), from a sjark in port at Bodø
ROUTE = """async () => { const q = portById('mN905'), h = portById('husoy'), b = S.boat; if (!q || !h) return {err:'no Bodø or Husøy'};
  S.tut = 0; S.me = S.cur; b.type = 'sjark'; S.owned = ['sjark']; b.status = 'port'; b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; S.plan = null; S.draft = []; applyVessel();
  await mapNeed(q.p, MAPD.simR); const r = await leiaRoute({x:q.p.x, y:q.p.y}, h.p, q.id, h.id); if (r.why) return {err:r.why[0]};
  const wps = r.wps.map((w, i) => i === r.wps.length - 1 ? {x:h.p.x, y:h.p.y, port:h.id, fish:0} : {x:w.x, y:w.y, port:null, fish:0, leia:true});
  let a = b.pos, mx = 0; for (const w of wps){ mx = Math.max(mx, dist(a, w)); a = w; }
  return {wps, n:wps.length, maxLeg:+mx.toFixed(1), km:+(r.nm * NM).toFixed(0)}; }"""
# the same way, as the plan under way (just cast off) or as the draft in port
AS_PLAN = """wps => { const b = S.boat; S.draft = []; S.plan = {wps, idx:0, speed:6, returning:false, depAt:null, unsafe:wps.map(() => false)}; b.status = 'sailing'; b.port = null; b.v = 0; save(); return localStorage.getItem(KEY); }"""
AS_DRAFT = """wps => { const b = S.boat, q = portById('mN905'); S.plan = null; b.status = 'port'; b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; S.draft = wps.map(w => ({...w})); save(); return localStorage.getItem(KEY); }"""
STATE = """which => { const b = S.boat, L = which === 'plan' ? (S.plan ? S.plan.wps.slice(S.plan.idx) : []) : S.draft; let a = b.pos, n = 0, ready = 0;
  for (const w of L){ n++; if (legReady(a, w)) ready++; a = w; }
  let late = []; try { late = JSON.parse(sessionStorage.getItem('dsb_needpk') || '[]'); } catch (e){}
  return {legs:n, ready, late, loads:+sessionStorage.getItem('kk_loads'), plan:!!S.plan, draft:S.draft.length, st:b.status, packs:MAPD.packs.filter(p => p.buf).length}; }"""


async def fresh(br, save, which):
    """A browser that has never seen the game (no packs kept), with the save put in place before the page's first script."""
    ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); errs = []
    await ctx.add_init_script("""(s => { if (!localStorage.getItem('kystfiske_v2')) localStorage.setItem('kystfiske_v2', s);
      sessionStorage.setItem('kk_loads', String((+sessionStorage.getItem('kk_loads') || 0) + 1)); })(""" + json.dumps(save) + ")")
    pg = await ctx.new_page(); pg.set_default_timeout(180000); pg.on('pageerror', lambda e: errs.append(str(e)))
    t0 = time.time(); await pg.goto(GAME)
    up = False
    for _ in range(10):   # (the page may load itself again on the way: that is what is counted)
        try: await pg.wait_for_function(READY, timeout=60000); up = True; break
        except Exception: await pg.wait_for_timeout(1000)
    s = await pg.evaluate(STATE, which) if up else {}
    s['up'] = up; s['s'] = round(time.time() - t0, 1)
    await ctx.close()
    return s, errs


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function(READY, timeout=120000)
        if not await pg.evaluate("MAPD.byTile.has('sim:14:11') || MAPD.packs.filter(p => p.kind === 'sim').length > 20"):
            print('FEIL hele kysten i bygget (tools/map/out/game eller KYST_MAP; python3 tools/map/release.py og game.py)'); await br.close(); return
        r = await pg.evaluate(ROUTE)
        check('wps' in r and r['maxLeg'] > 30, 'a route Bodø → Husøy as the chart plotter makes it, with long legs', {k: v for k, v in r.items() if k != 'wps'})
        if 'wps' not in r: await br.close(); return
        print(json.dumps({k: v for k, v in r.items() if k != 'wps'}))
        save_plan = await pg.evaluate(AS_PLAN, r['wps']); save_draft = await pg.evaluate(AS_DRAFT, r['wps'])
        await ctx.close()
        for which, save in (('plan', save_plan), ('draft', save_draft)):
            s, e = await fresh(br, save, which)
            print(which, json.dumps(s, ensure_ascii=False)[:400])
            check(s.get('up') and s.get('loads') == 1 and not s.get('late'), 'the start with the route as the ' + which + ' comes up in one load (no pack missing on the way, nothing loaded again)', s)
            check(s.get('legs', 0) > 0 and s.get('ready') == s.get('legs'), 'every leg of the ' + which + ' is ready when the game is up (the packs along it are in)', s)
            errs += e
        check(not errs, 'no page errors', errs[:4])
        await br.close()
    print('røde:', bad if bad else 'ingen')

asyncio.run(main())
