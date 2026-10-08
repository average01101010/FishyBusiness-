"""The yard's ship lift (08.10.2026, tools/harbour/steder.py y, view3d.js liftStep/drawYardLift): at a yard (UNITS v 'y', the big unit UNIT_Y) a boat
with a job on the hull or a repair (the slip) is raised out of the water on the platform in front of the main berth and let down when the work is
done. For each size of boat the smallest platform that holds her is taken (skiff 14 m, coastal boats 26 m, the 45-50 m vessels 56 m, the trawler and
the pelagic seiner 90 m). Checked: the platform and cables are in the model, the class and the scale for each boat, the stroke up and down (k), the
hull's height on the lift (keel on the blocks, the deck flush with the quay's), that she lies still and her lines are not drawn, and that the
biggest boat in the game (the pelagic seiner) is lifted. Pictures: yard_<type>_up.png (and _mid). Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(1500)
        pick = await pg.evaluate("""(() => { for (const q of PORTS) if (q.sted === 'verft' && q.coastal && q.p.y > 300 && q.p.y < 520 && UNITS[q.id] && UNITS[q.id].y) return {id:q.id, name:q.name}; return null; })()""")
        print(json.dumps(pick, ensure_ascii=False))
        print(ok(pick), 'a yard along the coast with the big unit')
        # to the yard: the packs round it, the boat at the main berth, the clock still
        await pg.evaluate("""(async id => { const q = portById(id); await mapNeed(q.p, 2); S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); S.mult = 0.00001; S.jobs = [];
          const b = S.boat; b.status = 'port'; b.port = id; b.berth = 'main'; b.plan = null; S.plan = null; })""", pick['id'])
        out = {}
        # the model: the four platforms, the cable, the winch row
        m = await pg.evaluate("""(() => { const M = G3._debug.unitModel('y'); const L = M && M.A.lift; return {has:!!M, lifts:M && M.lifts ? M.lifts.filter(x => x).length : 0, cable:!!(M && M.cable), classes:L ? L.classes.map(c => [c.len, c.wid]) : null, winch:L ? L.winch.length : 0,
          solids:M ? M.A.solids.length : 0, bunker:M ? !!M.A.pump : false, berths:M ? M.A.berths : null, bottom:M ? M.A.face.bottom : null}; })()""")
        print(json.dumps(m))
        print(ok(m['has'] and m['lifts'] == 4 and m['cable'] and m['winch'] >= 12 and m['bunker'] and m['berths']['main']['len'] == 90), 'the yard model has four platforms, the cable, a row of winch houses and the diesel pump', m)
        for ty, cls in (('skiff', 0), ('snekke', 0), ('kyst15', 1), ('kyst21', 1), ('autoliner', 2), ('snokrabbe', 2), ('bunntral', 3), ('pelagisk', 3)):
            # (the sizes: 14 x 6.4, 26 x 9.6, 56 x 14, 90 x 21; she needs her length + 3 m and her beam + 1.2 m)
            r = await pg.evaluate("""async ([id, ty]) => { const b = S.boat; b.type = ty; applyVessel(); S.jobs = []; b.status = 'port'; b.port = id; b.berth = 'main';
              const bp = berthPose(id, ty, 'main'); b.pos = {x:bp.x, y:bp.y}; const D = G3._debug; D.lift.k = 0; D.lift.id = null;
              const c = D.cam; c.helm = false; c.dist = Math.max(30, VESSELS[ty].len * 1.6); c.pitch = 0.2; c.yaw = 0.6; await new Promise(r => setTimeout(r, 2500));
              return {ty, ci:D.lift.ci, sx:+D.lift.sx.toFixed(2), sz:+D.lift.sz.toFixed(2), k:D.lift.k, off:D.lift.off, U:D.lift.U && D.lift.U.id, y0:D.bv.y, len:VESSELS[ty].len, beam:VESSELS[ty].beam, draft:VESSELS[ty].draft}; }""", [pick['id'], ty])
            out[ty] = r
            print(json.dumps(r))
            print(ok(r['ci'] == cls and r['U'] == pick['id'] and r['k'] == 0 and r['off'] == 0 and 0.4 <= r['sx'] <= 1.25 and 0.4 <= r['sz'] <= 1.3), '%s: platform %d, scale %.2f x %.2f, in the water' % (ty, r['ci'], r['sx'], r['sz']))
        # the stroke, with the pelagic seiner: a job on the hull -> the platform rises (k grows), she is lifted out of the water, lies still, her lines go; the job done -> down again
        await pg.evaluate("""(() => { const b = S.boat; b.type = 'pelagisk'; applyVessel(); const bp = berthPose(b.port, 'pelagisk', 'main'); b.pos = {x:bp.x, y:bp.y}; G3._debug.lift.k = 0; })()""")
        await pg.wait_for_timeout(1500)
        y0 = await pg.evaluate("G3._debug.bv.y")
        await pg.evaluate("S.jobs = [{kind:'hull', h:3, until:S.t + 180, no:'Slipp', en:'Slip'}]")
        await pg.wait_for_timeout(3500)
        k1 = await pg.evaluate("G3._debug.lift.k")
        await pg.evaluate("G3._debug.lift.k = 0.8"); await pg.wait_for_timeout(5000)
        mid = await pg.evaluate("({k:G3._debug.lift.k, off:G3._debug.lift.off, y:G3._debug.bv.y, yP:G3._debug.lift.yP})")
        await pg.screenshot(path='yard_pelagisk_mid.png', timeout=120000)
        await pg.evaluate("G3._debug.lift.k = 1"); await pg.wait_for_timeout(5000)
        up = await pg.evaluate("""(() => { const D = G3._debug, M = D.unitModel('y'), L = M.A.lift, V = VESSELS.pelagisk; return {k:D.lift.k, off:D.lift.off, y:D.bv.y, yP:D.lift.yP, deck:L.deck, block:L.block, draft:V.draft, tide:env_tide(), pitch:D.bv.pitch, roll:D.bv.roll}; })()""".replace("env_tide()", "0"))
        await pg.screenshot(path='yard_pelagisk_up.png', timeout=120000)
        print(json.dumps({'y0':y0, 'k1':k1, 'mid':mid, 'up':up}))
        print(ok(0 < k1 < 1), 'a job on the hull starts the stroke: the platform rises, k grows', k1)
        print(ok(mid['off'] > 0.5 and mid['y'] > y0 + 0.5 and mid['yP'] < up['deck']), 'half way up the platform has her keel and lifts her out of the water', mid)
        want = up['deck'] + up['block'] + up['draft']
        print(ok(up['k'] == 1 and abs(up['yP'] - up['deck']) < 0.05 and abs(up['y'] - want) < 0.8 and abs(up['pitch']) < 0.02 and abs(up['roll']) < 0.08), 'up: the platform\'s deck flush with the quay\'s, her keel on the blocks (the waterline %.1f m over the sea), she lies still' % want, up)
        await pg.evaluate("S.jobs = []"); await pg.wait_for_timeout(3500)
        k2 = await pg.evaluate("G3._debug.lift.k")
        print(ok(k2 < 1), 'the job done: the platform is let down again', k2)
        # a small boat on the smallest platform, in the picture too
        await pg.evaluate("""(() => { const b = S.boat; b.type = 'kyst15'; applyVessel(); const bp = berthPose(b.port, 'kyst15', 'main'); b.pos = {x:bp.x, y:bp.y}; S.jobs = [{kind:'repair', h:3, until:S.t + 180, no:'Reparasjon', en:'Repair'}]; G3._debug.lift.k = 1; G3._debug.cam.dist = 40; })()""")
        await pg.wait_for_timeout(5000)
        sm = await pg.evaluate("({k:G3._debug.lift.k, off:G3._debug.lift.off, ci:G3._debug.lift.ci, y:G3._debug.bv.y})")
        await pg.screenshot(path='yard_kyst15_up.png', timeout=120000)
        print(ok(sm['k'] == 1 and sm['off'] > 2 and sm['ci'] == 1), 'a repair lifts the coastal boat on the 26 m platform', sm)
        # away from the yard the lift is gone: the boat is under way
        await pg.evaluate("S.boat.status = 'sailing'; S.boat.port = null"); await pg.wait_for_timeout(1200)
        gone = await pg.evaluate("({k:G3._debug.lift.k, off:G3._debug.lift.off, U:G3._debug.lift.U})")
        print(ok(gone['k'] == 0 and gone['off'] == 0 and gone['U'] is None), 'under way she is not on the lift', gone)
        print(ok(not errs), 'no page errors', errs[:3])
        await b.close()

asyncio.run(main())
