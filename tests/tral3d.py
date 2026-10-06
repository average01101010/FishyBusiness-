"""The freezer trawler from Blender (06.10.2026; tools/boats/tral60.py, src/data/boat-tral60.b64, view3d.js TRAWL): the detailed model
replaces the kit for bunntral, at the drawing's size (60.3 x 12.5 m); the doors hang in the gallows and the net lies on its drum;
G3._debug.trawl plays shooting (the net down the ramp, the doors into the sea and out astern), towing and hauling (the doors back
in the gallows, the codend up the ramp). The game does not trawl yet (the ocean step), so this is the only place it plays.
Prints OK or FEIL per check; pictures to tests/out/tral_*.png."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        r = await pg.evaluate("""(() => { const b = S.boat, f = tutField().p; S.tut = 0; S.plan = null; b.type = 'bunntral'; applyVessel(); b.status = 'idle'; b.port = null;
          b.pos = {x:f.x, y:f.y}; b.heading = 0.6; S.t = Math.round((Date.UTC(2027, 5, 20, 11) - EPOCH) / 6e4);
          const g = geoOf('bunntral'), V = VESSELS.bunntral;
          return {glb:glbHas('bunntral'), trawl:!!(g && g.trawl), door:!!glbPart('bunntral', 'door'), cod:!!glbPart('bunntral', 'codend'), roll:!!glbPart('bunntral', 'netroll'),
            len:V.len, beam:V.beam, draft:V.draft, name:V.name.no, tris:glbPart('bunntral', 'lod0').p.length / 9}; })()""")
        check(r['glb'] and r['trawl'] and r['door'] and r['cod'] and r['roll'], 'the trawler\'s GLB is in the page, with the doors, the codend, the net on the drum and where they go', r)
        check(r['len'] == 60.3 and r['beam'] == 12.5 and r['name'].startswith('Frysetråler 60 m'), 'the game has the drawing\'s size: 60.3 x 12.5 m, «Frysetråler 60 m»', {k: r[k] for k in ('len', 'beam', 'draft', 'name')})
        await pg.evaluate("G3.show(true)"); await pg.wait_for_function("G3.isActive()", timeout=90000)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 62; c.pitch = 0.24; c.yaw = -0.45; })()")
        await pg.wait_for_timeout(6000)
        await pg.screenshot(path=os.path.join(OUT, 'tral_rest.png'))
        # each moment held on the animation's own clock (G3._debug.trawl(mode, seconds in, hold)): the page here stalls for seconds at a
        # time, so a clock running on would have the picture show a later moment than the one checked
        async def at(mode, u, shot):
            await pg.evaluate("G3._debug.trawl('%s', %f, true)" % (mode, u)); await pg.wait_for_timeout(2500)
            st = await pg.evaluate("G3._debug.trawlNow"); await pg.screenshot(path=os.path.join(OUT, 'tral_%s.png' % shot)); return st
        s1 = await at('shoot', 8, 'shoot_net'); s2 = await at('shoot', 17, 'shoot_doors'); s3 = await at('tow', 0, 'tow')
        check(s1 and s1['mode'] == 'shoot' and 0.2 < s1['net'] < 1 and s1['lo'] == 0, 'shooting: first the net pays out down the ramp, the doors still in the gallows', s1)
        check(s2 and s2['mode'] == 'shoot' and 0.3 < s2['lo'] < 0.9 and s2['ro'] == 0, 'then the doors are lowered into the sea', s2)
        check(s3 and s3['mode'] == 'tow' and s3['lo'] == 1 and s3['ro'] == 1, 'then she tows: the warps run from the blocks into the sea', s3)
        h1 = await at('haul', 24, 'haul_doors'); h2 = await at('haul', 40, 'haul_codend')
        check(h1 and h1['mode'] == 'haul' and h1['ro'] == 0 and 0.2 < h1['lo'] < 0.9, 'hauling: the doors come in on the warps and up into the gallows', h1)
        check(h2 and h2['mode'] == 'haul' and h2['full'] and h2['lo'] == 0 and 0 <= h2['cod'] < 0.7, 'then the net comes in and the codend, full, up the ramp', h2)
        # and run on to the end by itself
        await pg.evaluate("G3._debug.trawl('haul', 53)"); await pg.wait_for_timeout(4000); h3 = await pg.evaluate("G3._debug.trawlNow")
        check(h3 is None, 'and then all is as before: the doors in the gallows, the net on the drum', h3)
        gl = await pg.evaluate("G3._debug.glErr ? G3._debug.glErr() : 0")
        check(not errs and not gl, 'no page errors and no WebGL errors', {'errors': errs[:3], 'gl': gl})
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
