"""The breaking sea in 3D (Ø9 F7, view3d/14-sea.js brvStep, BR_GR in 01-shaders.js): a group given by hand (WV.brott.fix, the shape the
core's brottEvent gives) coming at the boat in a rough sea off Senja, in a fresh gale. Measured: the sea's height (seaH, what the hull
rides on) along the group's way through it: the highest crest and the deepest trough within a wavelength of its middle, against 2 Hs,
and the highest crest at the same points at the same moment without it; and nothing drawn with the group gone. Pictures in both formats (tests/out/brott_<format>_<view>.png, _uten without the group): from the side
across the group's way, from above, and from the wheelhouse. No GL errors, no page errors."""
import asyncio, json, os, math
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

# the group: its middle 70 m before the boat on its way, half way through its life (at its highest), coming from the west-south-west
GROUP = """(ahead) => { const D = G3._debug, b = S.boat, tp = 9, L = 9.81 * tp * tp / (2 * Math.PI), cg = 9.81 * tp / (4 * Math.PI), life = 14 * tp,
  a = (250 - gridGamma(b.pos) + 180) * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), T = S.t + 0.5, t0 = T - life / 2 / BRT.rs;
  const e = {id:'hand', t:t0, x:b.pos.x - dx * ahead / 1000, y:b.pos.y - dy * ahead / 1000, dx, dy, from:250, hs:D.wv.hs ? Math.hypot(D.wv.hs, D.wv.swHs || 0) : 4, tp, L, cg, life, sa:1.2 * L, sw:2.5 * L, sys:'w', why:'kryss'};
  D.wv.brott.fix = e; return {L, cg, life, hs:e.hs}; }"""
# the sea's height along the group's way, 300 m each side of its middle, with the group and (the same points, the same moment) without it
PROFILE = """() => { const D = G3._debug, B = D.wv.brott; if (!B.e) return null; const tw = Date.now() / 1000, f0 = B.f, P = [];
  for (let s = -300; s <= 300; s += 2) P.push([s, B.c[0] + B.D[0] * (B.s + s), B.c[1] + B.D[1] * (B.s + s)]);
  const on = P.map(([s, x, z]) => [s, D.seaHW(x, z, tw) - (D.env.tide || 0)]); B.f = 0; const off = P.map(([s, x, z]) => [s, D.seaHW(x, z, tw) - (D.env.tide || 0)]); B.f = f0;
  return {f:B.f, G:B.G, A:B.A, i:B.i, prof:on, off}; }"""

OFF = "() => { const B = G3._debug.wv.brott; B.fix = null; B.list = []; B.t = performance.now() / 1000 + 1e6; }"
SIDE = """() => { const D = G3._debug, B = D.wv.brott, e = B.fix; G3.film(null); if (!e) return; const bv = D.bv;
  G3.film({eye:[bv.x - e.dy * 160, (D.env.tide || 0) + 22, bv.z + e.dx * 160], tgt:[bv.x, (D.env.tide || 0) + 2, bv.z], fov:50}); }"""

async def run_format(pg, w, h, tag, R):
    await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(3000)
    for view, cam in [('side', None), ('ovenfra', "c.helm = false; c.dist = 420; c.pitch = 0.9; c.yaw = 0.4;"), ('bro', "c.helm = true;")]:
        for med in ([True, False] if view != 'bro' else [True]):
            await pg.evaluate("() => { G3._debug.wv.brott.t = -9; }"); await pg.evaluate(GROUP, 40)
            if cam: await pg.evaluate("() => { G3.film(null); const c = G3._debug.cam; " + cam + " }")
            else: await pg.evaluate(SIDE)
            if not med: await pg.evaluate(OFF)
            await pg.wait_for_timeout(5000)
            await pg.screenshot(path=os.path.join(OUT, 'brott_%s_%s%s.png' % (tag, view, '' if med else '_uten')), timeout=300000)
    await pg.evaluate("() => { G3.film(null); G3._debug.wv.brott.t = -9; }")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # open sea north-west of Senja, a westerly gale over a day so the sea has grown, the boat lying still
        await pg.evaluate("""async () => { window.cloudAt = () => 0.2; window.precipAt = () => 0; WX_FORCE = {w:19, d:250};
          const q = P(69.62, 16.62); await mapNeed(q, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = [];
          b.pos = {x:q.x, y:q.y}; b.heading = 1.2; b.v = 0; S.t = Math.round((Date.UTC(2027, 9, 12, 0) + 12 * 3.6e6 - EPOCH) / 6e4); if (!G3.isActive()) G3.show(true); }""")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(15000)
        await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
        R = {}
        R['sea'] = await pg.evaluate("(() => { const W = G3._debug.wv; return {hs:W.hs, sw:W.swHs, W:W.W}; })()")
        R['group'] = await pg.evaluate(GROUP, 0)
        await pg.wait_for_timeout(4000)
        pr = await pg.evaluate(PROFILE)
        R['gl0'] = await pg.evaluate("G3._debug.glErr()")
        hs = math.hypot(R['sea']['hs'], R['sea']['sw'] or 0)
        if pr:
            L = R['group']['L']; inside = max(v for s, v in pr['prof'] if abs(s) < 1.2 * L); lo_in = min(v for s, v in pr['prof'] if abs(s) < 1.2 * L)
            outside = max(v for s, v in pr['off'] if abs(s) < 1.2 * L)
            R['prof'] = {'f':pr['f'], 'G':pr['G'], 'A':pr['A'], 'i':pr['i'], 'crest_in':inside, 'trough_in':lo_in, 'crest_out':outside}
        # gone: no group
        await pg.evaluate(OFF); await pg.wait_for_timeout(3000)
        R['off'] = await pg.evaluate("(() => { const B = G3._debug.wv.brott; return {f:B.f, e:!!B.e}; })()")
        await pg.evaluate("() => { G3._debug.wv.brott.t = -9; }")
        print(json.dumps(R))
        await run_format(pg, 1280, 800, 'liggende', R)
        await run_format(pg, 800, 1280, 'staaende', R)
        R['gl'] = await pg.evaluate("G3._debug.glErr()")
        P_ = R.get('prof') or {}
        check(P_ and P_['f'] > 0.95, 'the group is on the water at its full height', P_.get('f'))
        # (about 2 Hs, held where the carrier would break: amplitude 0.42 / k, so a 96 m wave stops at 12.8 m from crest to trough)
        want = 0.8 * 2 * min(hs, P_['A']) if P_ else 1e9
        check(P_ and P_['crest_in'] - P_['trough_in'] > want, 'inside the group: crest to trough about twice the significant height, or as steep as the wave can stand (over %.1f m; Hs %.1f m)' % (want, hs), P_ and (round(P_['crest_in'], 2), round(P_['trough_in'], 2)))
        check(P_ and P_['crest_in'] > 1.4 * P_['crest_out'], 'the crest with the group well over the highest crest at the same place without it', P_ and (round(P_['crest_in'], 2), round(P_['crest_out'], 2)))
        check(R['off']['f'] == 0 and not R['off']['e'], 'no group: nothing drawn', R['off'])
        check(R['gl'] == 0, 'no GL errors', R['gl'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
if __name__ == "__main__": asyncio.run(main())
