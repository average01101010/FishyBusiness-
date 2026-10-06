"""The freezer trawler, the purse seiner, the autoliner and the snow crab vessel from Blender (06.10.2026; tools/boats/tral60.py, src/data/boat-tral60.b64, view3d.js TRAWL): the detailed model
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
        # the purse seiner and pelagic trawler (tools/boats/not75.py): her model, the seine shot, pursed, hauled and pumped, her trawl
        r = await pg.evaluate("""(() => { const b = S.boat; b.type = 'pelagisk'; applyVessel(); const g = geoOf('pelagisk'), V = VESSELS.pelagisk;
          return {glb:glbHas('pelagisk'), seine:!!(g && g.seine), trawl:!!(g && g.trawl), door:!!glbPart('pelagisk', 'door'), len:V.len, tris:glbPart('pelagisk', 'lod0').p.length / 9}; })()""")
        check(r['glb'] and r['seine'] and r['trawl'] and r['door'], 'the purse seiner\'s GLB is in the page, with the seine\'s places and the trawl\'s doors', r)
        await pg.evaluate("G3._debug.trawl(null); (() => { const c = G3._debug.cam; c.helm = false; c.dist = 150; c.pitch = 0.42; c.yaw = -0.9; })()"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=os.path.join(OUT, 'not_rest.png'))
        async def sat(mode, u, shot):
            await pg.evaluate("G3._debug.seine('%s', %f, true)" % (mode, u)); await pg.wait_for_timeout(2500)
            st = await pg.evaluate("G3._debug.seineNow"); await pg.screenshot(path=os.path.join(OUT, 'not_%s.png' % shot)); return st
        n1 = await sat('shoot', 20, 'shoot'); n2 = await sat('purse', 10, 'purse'); n3 = await sat('haul', 25, 'haul'); n4 = await sat('pump', 8, 'pump')
        check(n1 and n1['mode'] == 'shoot' and 0.3 < n1['k'] < 0.7, 'the seine is shot over the stern, its corks a ring on the sea', n1)
        check(n2 and n2['mode'] == 'purse' and n3 and n3['mode'] == 'haul' and n4 and n4['mode'] == 'pump', 'then pursed, hauled in through the power block, and the fish pumped from the bunt alongside', [n2, n3, n4])
        await pg.evaluate("G3._debug.seine('pump', 19)"); await pg.wait_for_timeout(4000); n5 = await pg.evaluate("G3._debug.seineNow")
        check(n5 is None, 'and then the seine is back in its bin', n5)
        await pg.evaluate("G3._debug.seine(null); G3._debug.trawl('shoot', 30, true)"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=os.path.join(OUT, 'not_trawl.png')); t1 = await pg.evaluate("G3._debug.trawlNow")
        check(t1 and t1['mode'] == 'shoot' and t1['lo'] == 1, 'she shoots the pelagic trawl too, the doors from the stern quarters', t1)
        await pg.evaluate("G3._debug.trawl(null)")
        # the autoliner (tools/boats/al45.py): her model at the drawing's size, and the line coming in through the hauling port
        r = await pg.evaluate("""(() => { const b = S.boat; b.type = 'autoliner'; applyVessel(); const V = VESSELS.autoliner, g = geoOf('autoliner');
          return {glb:glbHas('autoliner'), len:V.len, beam:V.beam, draft:V.draft, hauler:g && g.hauler, tris:glbPart('autoliner', 'lod0').p.length / 9}; })()""")
        check(r['glb'] and r['len'] == 45.4 and r['beam'] == 10.45 and r['hauler'] and r['hauler'][0] > 4, 'the autoliner\'s GLB is in the page at the drawing\'s size, the hauler at the starboard hauling port', r)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 75; c.pitch = 0.2; c.yaw = 0.9; })()"); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=os.path.join(OUT, 'al_rest.png'))
        await pg.evaluate("""(() => { const b = S.boat, g = b.pos; b.status = 'fishing';
          b.gop = {op:'haul', kind:'line', sid:'t', n:6, done:2, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.5, y:g.y}, kg:0, rel:0, dead:0, hooksPer:100};
          const c = G3._debug.cam; c.dist = 30; c.pitch = 0.12; c.yaw = -1.4; })()"""); await pg.wait_for_timeout(4000)
        await pg.screenshot(path=os.path.join(OUT, 'al_haul.png'))
        await pg.evaluate("(() => { const b = S.boat; b.gop = null; b.status = 'idle'; })()")
        # the snow crab vessel (tools/boats/krabbe50.py), at the game's size
        for vt, L, B, shot, cam in (('snokrabbe', 50, 11, 'kr', (80, 0.22, -0.8)),):
            r = await pg.evaluate("""(vt => { const b = S.boat; b.type = vt; applyVessel(); const V = VESSELS[vt], g = geoOf(vt);
              return {glb:glbHas(vt), len:V.len, beam:V.beam, draft:V.draft, hauler:g && g.hauler, tris:glbPart(vt, 'lod0').p.length / 9}; })""", vt)
            check(r['glb'] and r['len'] == L and r['beam'] == B and r['hauler'] and r['hauler'][0] > 2, 'the %s GLB is in the page at the game\'s size, the hauler on the starboard side' % vt, r)
            await pg.evaluate("(c => { const k = G3._debug.cam; k.helm = false; k.dist = c[0]; k.pitch = c[1]; k.yaw = c[2]; })", list(cam)); await pg.wait_for_timeout(4000)
            await pg.screenshot(path=os.path.join(OUT, '%s_rest.png' % shot))
        gl = await pg.evaluate("G3._debug.glErr ? G3._debug.glErr() : 0")
        check(not errs and not gl, 'no page errors and no WebGL errors', {'errors': errs[:3], 'gl': gl})
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
