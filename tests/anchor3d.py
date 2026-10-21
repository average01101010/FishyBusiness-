"""The anchor in 3D (view3d.js drawAnchor, tools/deck/anker.py; Jonas 21.10.2026): every boat with a detailed model has its anchor's
places (geo.bower) and the kit has the anchors and the links; on the 15 m coastal boat (hawse, chain) and the wooden boat (grapnel,
rope) it lies stowed, falls when let go (the splash where it goes in), lies on the bottom with the chain drawn link by link, comes up
under the bow when weighed and goes back to its place, with no page errors. Two pictures: lying to it, and coming up."""
from _env import boot, OUT
import asyncio, os, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

SET = """(async (vt) => { const b = S.boat, HP = portById('husoy'); await mapNeed(HP.p, 14); const sp = driftAnchorage('husoy'); await mapNeed(sp, 6);
  S.tut = 0; S.mult = 1; WX_FORCE = {w:7, d:300}; b.type = vt; applyVessel(); G3.vesselChanged(); S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.plan = null;
  S.hold = []; S.crew = []; b.anch = null; b.drv = null; b.status = 'idle'; b.port = null; b.pos = {x:sp.x, y:sp.y}; b.heading = 2.1; b.v = 0;
  const c = G3._debug.cam; c.helm = false; c.yaw = 3.9; c.pitch = 0.06; c.dist = Math.max(8, VESSELS[vt].len * 0.75); return VESSELS[vt].len; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 900, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        r = await pg.evaluate("""(() => ({types:Object.keys(VESSELS).filter(t => glbHas(t)).map(t => [t, !!(geoOf(t).bower && geoOf(t).bower.fair)]),
          kit:['plog', 'hall', 'link', 'stud'].map(n => G3._debug.kitPart('anchor', n))}))()""")
        miss = [t for t, h in r['types'] if not h]
        print(ok(not miss and all(r['kit'])), 'every detailed boat has its anchor places, and the kit its anchors and links', miss, r['kit'])
        for vt in ('kyst15', 'trebat'):
            await pg.evaluate(SET, vt); await pg.wait_for_timeout(2500)
            seen = {'stow': (await pg.evaluate("G3._debug.anc3"))['mode'] == 'stow'}
            await pg.evaluate("dropAnchor()")
            modes = []
            for k in range(60):
                s = await pg.evaluate("G3._debug.anc3"); modes.append(s['mode'])
                if s['mode'] == 'bottom' and s['links'] > 0: seen['links'] = s['links']
                if s['splash']: seen['splash'] = True
                if s['mode'] == 'bottom' and await pg.evaluate("!!S.boat.anch && S.boat.anch.out >= S.boat.anch.rode"): break
                await pg.wait_for_timeout(500)
            seen['hang'] = 'hang' in modes; seen['bottom'] = modes[-1] == 'bottom'
            if vt == 'kyst15': await pg.screenshot(path=os.path.join(OUT, 'anchor3d_lying.png'))
            await pg.evaluate("weighAnchor()"); up = []
            for k in range(90):
                s = await pg.evaluate("[G3._debug.anc3.mode, !!S.boat.anch]"); up.append(s[0])
                if s[0] == 'hang' and vt == 'kyst15' and 'shot' not in seen: seen['shot'] = True; await pg.screenshot(path=os.path.join(OUT, 'anchor3d_up.png'))
                if not s[1] and s[0] == 'stow': break
                await pg.wait_for_timeout(500)
            seen['upHang'] = 'hang' in up; seen['stowed'] = up[-1] == 'stow'
            # (the wooden boat has rope, its few metres of chain at the anchor are under the water: no links to see there)
            chain = await pg.evaluate("anchorGear(S.boat.type).chain")
            print(ok(seen['stow'] and seen['hang'] and seen['bottom'] and seen.get('splash') and (seen.get('links', 0) > 0 or not chain)), vt, 'stowed, falls with a splash, lies on the bottom with its chain', json.dumps(seen))
            print(ok(seen['upHang'] and seen['stowed']), vt, 'weighed: comes up under the bow and goes back to its place')
        await pg.evaluate("WX_FORCE = null; S.mult = 0.00001")
        print('sidefeil', errs[:3])
        await br.close()
asyncio.run(main())
