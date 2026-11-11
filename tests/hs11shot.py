"""screenshots of the new speed sjark (sjarkny, tools/boats/hs11.py) in the game, in both formats (for Jonas; not in run.py): under way from the
outside (K1, the starboard bow quarter), from the helm, the cockpit from above while she fishes with two hands aboard and the catch
in the tubs, and at night under way (K6: the lanterns). First it asks the game whether it draws the Blender model for the type and
not the old kit model (glbHas, buildVesselModel(..).glb, the anchors), as sulebas-bygging.md kap. 12 says to.
    TAG=for python3 tests/hs11shot.py          (or TAG=etter; one format: ... liggende)"""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
SET = """((a) => { const [t, scene, hour] = a, b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, hour) - EPOCH) / 6e4);
  b.type = t; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.hold = []; S.pgear = newPGear(); b.rig = 'juksa';
  if (scene === 'dekk'){ const g = GROUNDS[0].p; S.crew = [Object.assign(genCrew(), {bi:false, off:false}), Object.assign(genCrew(), {bi:false, off:false})];
    b.rig = 'line'; S.pgear.lines.bank.n = 6; S.pgear.lines.bank.baited = 4; if (equipFits('linehaler', t)) S.equip.linehaler = true;
    S.hold = [{sp:'torsk', kg:260, gut:true, iced:true}, {sp:'torsk', kg:40, gut:false, iced:false}, {sp:'hyse', kg:30, gut:true, iced:true}];
    b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; return; }
  S.crew = [];
  b.status = 'sailing'; b.port = null; b.v = VESSELS[t].vcruise || 8; const p = P(69.532, 17.926); b.pos = {x:p.x, y:p.y}; b.heading = 1.2;
  S.plan = {wps:[{x:b.pos.x + 9, y:b.pos.y, port:null, fish:0}], idx:0, speed:b.v, returning:false}; })"""
ASK = """((t) => { const G = geoOf(t), m = buildVesselModel(t, 2), g = glbLoad(t);
  return {glbHas:glbHas(t), glb:!!(m && m.glb), tris:m ? m.o.p.length / 9 : 0, parts:g ? Object.keys(g.parts) : [], name:g && g.ex.name,
    anchors:G ? Object.keys(G).sort() : [], eye:G && G.eye, kit:G && G.kit ? Object.keys(G.kit) : [], lights:G && G.lights ? G.lights.map(l => l[2]) : [],
    zones:Object.keys(glbZones(t)), mast:!!G3._debug.mastTop(t)}; })"""
OUT = os.path.join(ROOT, 'tests', 'out')
TYPE = 'sjarkny'
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}; tag = os.environ.get('TAG', '')
        shot = lambda nm, f: os.path.join(OUT, 'hs11_' + tag + '_' + nm + '_' + f + '.png')
        for f in (sys.argv[1:] or list(FMT)):
            w, h = FMT[f]; print(f, 'start', flush=True)
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            await pg.evaluate(SET, [TYPE, 'ute', 11]); await pg.wait_for_function("geoOf('sjarkny') && geoOf('sjarkny').skipperAt", timeout=120000)
            if f == 'liggende': print('model', json.dumps(await pg.evaluate(ASK, TYPE)), flush=True)
            # K1: the starboard bow quarter, a little above the water
            await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 14; c.pitch = 0.16; c.yaw = 2.5; })()"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path=shot('ute', f), timeout=400000)
            # K2: the port stern quarter, higher, into the cockpit
            await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 11; c.pitch = 0.34; c.yaw = -0.7; })()"); await pg.wait_for_timeout(4000)
            await pg.screenshot(path=shot('akter', f), timeout=400000)
            await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(4000)
            await pg.screenshot(path=shot('bro', f), timeout=400000)
            await pg.evaluate("G3.setHelm(false)")
            # the work at sea: fishing on the ground, two hands, line rig, the catch
            await pg.evaluate(SET, [TYPE, 'dekk', 11]); await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 8.5; c.pitch = 0.62; c.yaw = 0.9; })()"); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=shot('dekk', f), timeout=400000)
            # K6: K1 at night, from further off so the whole mast is in the picture and the white all-round light over it shows (OB10
            # round 3: at 13 m the picture cut the mast, and the judge could not see the white)
            await pg.evaluate(SET, [TYPE, 'ute', 22]); await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 22; c.pitch = 0.12; c.yaw = 2.5; })()"); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=shot('natt', f), timeout=400000)
            # K6 from the port bow too: the red and the white, the green screened off
            await pg.evaluate("(() => { const c = G3._debug.cam; c.yaw = -2.5; })()"); await pg.wait_for_timeout(4000)
            await pg.screenshot(path=shot('nattbb', f), timeout=400000)
            # K7: from above by day in port-like stillness (the deck and the roofs seen from a drone, M14)
            await pg.evaluate(SET, [TYPE, 'ute', 11]); await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 16; c.pitch = 0.95; c.yaw = 1.9; })()"); await pg.wait_for_timeout(5000)
            await pg.screenshot(path=shot('ovenfra', f), timeout=400000)
            print(f, 'errors', errs, flush=True)
            await pg.close()
        await br.close()
asyncio.run(main())
