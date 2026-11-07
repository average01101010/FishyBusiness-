"""A bought boost and the time played in (07.11.2026; core/01-world.js boostT): Skippertak and trim given while the time the game was closed
or a tab slept is still being played in (S.t behind the world's clock) started from the old game time, and the catch-up ate the hours
bought: closed 24 h with the map packs late, a Skippertak (48 h) and a turbo trim (72 h) were gone before the game was live; a tab that
slept 2 h lost 12 of them. Now they start from the world's minute. Four cases, each must end with all the hours bought left.
Scenarios (world clock on, #world on localhost):
  A  boot, catch-up completes synchronously in bootGame, grant 300 ms after SIMREADY (as shopStart -> setTimeout 0 -> RPC)
  B  boot, the sim packs come 2 s late (simAreaReady false until then: the CATCH_LEFT remainder), grant 300 ms after SIMREADY
  C  live tab that slept: S.t behind, TAB.wait (cloudWake) holds tick while shop_pending answers first, then released
KYST_LITE=1 python3 tests/boostklokke.py. Prints OK or FEIL."""
import sys, os, asyncio, json
HERE = os.path.dirname(os.path.abspath(__file__))
from _env import GAME, boot
from playwright.async_api import async_playwright

PATCH_FROM = 'function simAreaReady(){'
PATCH_TO = 'function simAreaReady(){ if (window.__holdUntil && Date.now() < window.__holdUntil) return false;'


def patched(hold):
    body = open(os.path.join(os.environ.get('KYST_DIST') or os.path.join(HERE, '..', 'dist'), 'index.html'), encoding='utf-8').read()
    if hold: assert body.count(PATCH_FROM) == 1; body = body.replace(PATCH_FROM, PATCH_TO)
    return body
async def route_page(pg, hold):
    async def patch(route):
        if not route.request.url.split('#')[0].split('?')[0].endswith('/index.html') or '/admin/' in route.request.url: return await route.continue_()
        await route.fulfill(status=200, content_type='text/html; charset=utf-8', body=patched(hold))
    await pg.route('**/index.html*', patch)

INIT = """(() => {
  window.__holdUntil = %(hold)s ? 1e15 : 0; window.__g = null;
  const iv = setInterval(() => {
    if (typeof SIMREADY === 'undefined' || !SIMREADY) return; clearInterval(iv);
    const md = document.getElementById('modal'), seen = {t:S.t, w:worldT(), left:CATCH_LEFT, awayModal:!md.hidden && /borte|away/i.test(md.innerText), awayMs:Math.round(awayMs / 60000)};
    if (%(hold)s) window.__holdUntil = Date.now() + %(holdMs)d;   // the packs come this much later
    setTimeout(() => {
      if (!%(grant)s) return;
      const at = {t:S.t, w:worldT(), left:CATCH_LEFT};
      shopGive({id:'g1', data:{give:'skip', k:'std'}}); shopGive({id:'g2', data:{give:'trim', k:'turbo', boat:S.cur}});
      window.__g = {seen, at, skip0:skipLeft(), trim0:trimLeft(S.boat), skipUntil:S.skip.until, trimT0:S.boat.trim.t0};
    }, %(delay)d);
  }, 2);
})()"""

STATE = "({t:S.t, w:worldT(), behind:worldT() - S.t, left:CATCH_LEFT, skip:+skipLeft().toFixed(2), trim:+trimLeft(S.boat).toFixed(2), g:window.__g})"


async def prep(br, closed_h):
    ctx = await br.new_context(viewport={'width': 1000, 'height': 760}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, GAME + '#world'); await pg.wait_for_timeout(800)
    # the game closed `closed_h` real hours ago: the save's game time is closed_h * GAME_RATE game hours behind the world
    sv = await pg.evaluate("(m => { TAB.held = true; S.boatName = S.boatName || 'Prove'; S.intro = true; S.skip = null; delete S.boat.trim; applyVessel(); S.t = worldT() - m; save(); window.removeEventListener('pagehide', save); return {saved:load().t, w:worldT()}; })(%d)" % int(closed_h * 60 * 6))
    return ctx, pg, errs


async def boot_case(br, name, closed_h, hold, delay=300, hold_ms=2000):
    ctx, pg, errs = await prep(br, closed_h)
    if hold: await route_page(pg, hold)
    await pg.add_init_script(INIT % {'hold': 'true' if hold else 'false', 'holdMs': hold_ms, 'grant': 'true', 'delay': delay})
    await pg.reload()
    try: await pg.wait_for_function("window.__g", timeout=40000)
    except Exception as e:
        print('FEIL ' + name + ': kjøpet kom ikke fram i testen', await pg.evaluate("({sr:typeof SIMREADY !== 'undefined' && SIMREADY, h:window.__holdUntil, t:typeof S !== 'undefined' && S && S.t, w:worldT()})"), errs[:3], flush=True); await ctx.close(); return
    await pg.wait_for_function("CATCH_LEFT === 0 && worldT() - S.t <= 2", timeout=120000)
    await pg.wait_for_timeout(500)
    s = await pg.evaluate(STATE)
    check(abs(s['skip'] - 48) < 0.1 and abs(s['trim'] - 72) < 0.1 and not errs, f'{name}, lukket {closed_h} t: Skippertak og trim har alle timene igjen når spillet er i gang', {'skip': s['skip'], 'trim': s['trim'], 'bak ved kjøpet': s['g']['at']['w'] - s['g']['at']['t'], 'sidefeil': errs[:2]})
    await ctx.close()


async def sleep_case(br, name, slept_h, wait_ms=600):
    ctx = await br.new_context(viewport={'width': 1000, 'height': 760}); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg, GAME + '#world'); await pg.wait_for_timeout(1500)
    await pg.evaluate("document.getElementById('modal').hidden = true; S.skip = null; delete S.boat.trim; applyVessel()")
    # the tab slept slept_h real hours (no ticks); on wake cloudWake holds tick (TAB.wait) until save_beat answers, and the
    # visibilitychange shopClaim's shop_pending answers first: the grant is given at the old S.t
    g = await pg.evaluate("""(m => { TAB.wait = true; S.t = worldT() - m; const at = {t:S.t, w:worldT(), left:CATCH_LEFT};
      shopGive({id:'g1', data:{give:'skip', k:'std'}}); shopGive({id:'g2', data:{give:'trim', k:'turbo', boat:S.cur}});
      window.__g = {at, skip0:skipLeft(), trim0:trimLeft(S.boat)}; return window.__g; })(%d)""" % int(slept_h * 360))
    await pg.wait_for_timeout(wait_ms)
    await pg.evaluate("TAB.wait = false")   # save_beat answered
    await pg.wait_for_function("CATCH_LEFT === 0 && worldT() - S.t <= 2", timeout=120000)
    await pg.wait_for_timeout(500)
    s = await pg.evaluate(STATE)
    check(abs(s['skip'] - 48) < 0.1 and abs(s['trim'] - 72) < 0.1 and not errs, f'{name}, sov {slept_h} t: Skippertak og trim har alle timene igjen når spillet er i gang', {'skip': s['skip'], 'trim': s['trim'], 'sidefeil': errs[:2]})
    await ctx.close()


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''), flush=True)


async def main():
    which = sys.argv[1:] or ['A', 'B24', 'B4', 'C']
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        for w in which:
            if w == 'A': await boot_case(br, 'A boot, no remainder', 24, False)
            elif w == 'A0': await boot_case(br, 'A boot, no remainder, grant at once', 24, False, delay=0)
            elif w == 'B24': await boot_case(br, 'B boot, packs 2 s late', 24, True)
            elif w == 'B4': await boot_case(br, 'B boot, packs 2 s late', 4, True)
            elif w == 'C': await sleep_case(br, 'C tab slept, shop_pending before save_beat', 2)
            elif w == 'C8': await sleep_case(br, 'C tab slept, shop_pending before save_beat', 8)
        print('sidefeil: []')
        await br.close()

asyncio.run(main())
