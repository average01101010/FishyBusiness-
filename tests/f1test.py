"""F1 of the boat models (docs/planer/grafikk-batmodeller.md): the 3D view starts on WebGL 2 and on WebGL 1 with #gl1 in the address,
the shaders the same on both; your boat is drawn near, middle or far by her length in the drawing's pixels (G3._debug.ownLod), with
the level's thresholds (QUAL.blod) and [0, 0] keeping her near. Picture f1_gl2.png and f1_gl1.png. Prints OK or FEIL."""
from _env import boot, GAME
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for tag, url in (('gl2', GAME), ('gl1', GAME + ',gl1')):
            pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, url)
            await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
            st = await pg.evaluate("({gl2:G3._debug.gl2, fail:G3.failWhy, err:G3._debug.glErr(), basic:G3._debug.seaBasic, one:G3._debug.seaOne})")
            check(st['gl2'] == (tag == 'gl2') and not st['fail'] and st['err'] == 0 and not st['basic'] and not st['one'], 'the view runs on WebGL %s with the full sea' % tag[-1], st)
            await pg.screenshot(path='f1_%s.png' % tag)
            pr = await pg.evaluate("G3._debug.progs()")
            check(all(v == 'ok' for v in pr.values()), 'every shader program compiles and links on WebGL %s, also those made only where their layer is (trees, near field, turbines, lakes, drops, foam)' % tag[-1], {k: v for k, v in pr.items() if v != 'ok'} or len(pr))
            if tag == 'gl2':
                await pg.evaluate("(() => { const b = S.boat; b.type = 'kyst15'; applyVessel(); G3.vesselChanged(); b.status = 'idle'; b.port = null; S.mult = 0; const c = G3._debug.cam; c.helm = false; c.dist = 21; })()")
                tiers = {}
                for d, want in ((21, 2), (90, 1), (400, 0), (21, 2)):
                    await pg.evaluate("G3._debug.cam.dist = %d" % d)
                    try: await pg.wait_for_function("G3._debug.ownLod.tier === %d" % want, timeout=60000)
                    except Exception: pass
                    tiers[d] = await pg.evaluate("G3._debug.ownLod")
                    if d == 400: await pg.screenshot(path='f1_far.png')
                print('tiers:', tiers)
                check([tiers[d]['tier'] for d in (21, 90, 400)] == [2, 1, 0] and tiers[21]['tier'] == 2, 'your boat is near close by, middle further off and far a long way off, and near again when the camera comes back', tiers)
                n = await pg.evaluate("(() => { const t = 'kyst15', liv = null, h2 = G3._debug.pvmHull(t, liv, 2), h1 = G3._debug.pvmHull(t, liv, 1), h0 = G3._debug.pvmHull(t, liv, 0); return [h2.n, h1.n, h0.n, !!glbPart(t, 'lodm')]; })()")
                check(n[0] > n[2] and (n[1] == n[0]) != n[3], 'near is the full model, middle is it too while the model has no middle version, far the simple one', n)
                q = await pg.evaluate("(() => { const Q = G3._debug.QUAL, keep = Q.blod[Q.lvl]; Q.blod[Q.lvl] = [0, 0]; G3._debug.cam.dist = 400; return new Promise(r => setTimeout(() => { const t = G3._debug.ownLod.tier; Q.blod[Q.lvl] = keep; G3._debug.cam.dist = 21; r(t); }, 8000)); })()")
                check(q == 2, 'with the level\'s thresholds at [0, 0] she stays near at every distance', q)
            if tag == 'gl2':
                # ultra by the measured frame time: qualTick fed frame rates by hand (the tests keep the level fixed with #qfix otherwise)
                u = await pg.evaluate("""(() => { const D = G3._debug, Q = D.QUAL, keep = {fix:Q.fix, lvl:Q.lvl, cap:Q.cap, capT:Q.capT, q:S.settings.q3d}, run = (fps, s, t0) => { for (let i = 0; i < s * 10; i++) D.qualTick(0.1, fps, t0 + i * 100); return Q.lvl; };
                  try { localStorage.removeItem('dsb_ultra'); } catch (e){} D.QU.st = null; Q.fix = false; S.settings.q3d = 'auto'; Q.lvl = 2; Q.capT = -1e9; const ui = G3.quality().ultra, r = {ui};
                  r.slow = run(60, 30, 1e6); r.fast = run(90, 21, 2e6); r.held = run(70, 16, 3e6); r.mem = localStorage.getItem('dsb_ultra');
                  r.drop = run(30, 4, 4e6); r.after = run(90, 40, 4.01e6);   // (within two minutes of the step down)
                  localStorage.setItem('dsb_ultra', 'no:a'); D.QU.st = null; Q.lvl = 2; Q.capT = -1e9; r.no = run(95, 40, 6e6);
                  try { localStorage.removeItem('dsb_ultra'); } catch (e){} D.QU.st = null; Q.autoU = false; Q.lvl = 2; r.off = run(95, 40, 8e6); Q.autoU = true;
                  Object.assign(Q, {fix:keep.fix, lvl:keep.lvl, cap:keep.cap, capT:keep.capT}); S.settings.q3d = keep.q; return r; })()""")
                print('ultra:', u)
                check(not u['ui'] or (u['slow'] == 2 and u['fast'] == 3 and u['held'] == 3 and u['mem'] == 'ok:a' and u['drop'] == 2 and u['after'] == 2 and u['no'] == 2 and u['off'] == 2), 'auto tries ultra after 20 s over 80 frames a second, remembers it held, goes back under 45, and not where the device said no or the level has it off', u)
            check(not errs, 'no page errors', errs[:3])
            await pg.close()
        await b.close()


asyncio.run(main())
