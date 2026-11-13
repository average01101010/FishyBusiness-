"""The new people in the boats (steg 125, FB7): the hand boat's own people behind «#folk2» (the skipper and the crewman built in, figBake;
the fisher at the rail drawn skinned with his arms, figLive) and the people on other boats seen from outside (personVB), pictures for the
session and Jonas (not in run.py, as skiffshot.py). python3 tests/folk2boats.py [liggende|staaende] [folk2|gammel]
Pictures tests/out/folk2boats_<what>_<folk2|gammel>_<format>.png. Prints the draw calls of the skinned program a shot, GL and page errors."""
import asyncio, os, sys
from playwright.async_api import async_playwright
from _env import boot, GAME, OUT

SET = """((a) => { const [type, st, yaw, pitch, dist] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); WX_FORCE = {w:1, d:200};
  b.type = type; applyVessel(); G3.vesselChanged(); S.equip.jukse = Math.min(3, VESSELS[type].jukseMax || 1); S.target = 'torsk'; window.jigActive = false; PEERS.length = 0;
  b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.gop = null;
  if (st === 'fishing'){ b.status = 'fishing'; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; }
  else { b.status = 'sailing'; b.v = VESSELS[type].vcruise || 8; S.plan = {wps:[{x:b.pos.x + 9, y:b.pos.y, port:null, fish:0}], idx:0, speed:b.v, returning:false}; }
  const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = yaw; })"""
# other boats abreast of her towards the camera (as flaggshot.py): [type, m towards the camera, m along]
PEER = """((L) => { const b = S.boat, bv = G3._debug.bv, e = G3._debug.eye, dx = e[0] - bv.x, dz = e[2] - bv.z, D = Math.hypot(dx, dz) || 1, u = [dx / D, dz / D], v = [-u[1], u[0]];
  const at = (a, w) => ({x:b.pos.x + (u[0] * a + v[0] * w) / 1000, y:b.pos.y + (u[1] * a + v[1] * w) / 1000}), hd = Math.atan2(v[0], -v[1]); PEERS.length = 0;
  L.forEach(([t, a, w, st], i) => PEERS.push(Object.assign({id:'tp1' + 'abcdefg'[i].repeat(7), boat:'Fjordbris', vtype:t, hd, v:0, st:st || 'fishing', user:'Kari', fs:0, at:Date.now() + 36e5, liv:'h:kobolt;r:hvit'}, at(a, w)))); })"""
SHOTS = [('skiff_fart', ['skiff', 'sailing', 2.2, 0.28, 3.6], None), ('skiff_juksa', ['skiff', 'fishing', 1.4, 0.3, 3.4], None), ('trebat_juksa', ['trebat', 'fishing', 2.0, 0.35, 3.6], None),
         ('andre', ['skiff', 'fishing', 1.5, 0.2, 13], [['sjark', 5, 0], ['skiff', 8, 5], ['trebat', 8, -5]])]
FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}

async def main():
    fmts = [a for a in sys.argv[1:] if a in FMT] or list(FMT); kinds = [a for a in sys.argv[1:] if a in ('folk2', 'gammel')] or ['folk2', 'gammel']
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        for kind in kinds:
            for tag in fmts:
                w, h = FMT[tag]; pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
                await boot(pg, GAME + (',folk2' if kind == 'folk2' else '')); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
                for name, a, peers in SHOTS:
                    await pg.evaluate(SET, a); await pg.wait_for_function("geoOf(%r) && (geoOf(%r).skiff || geoOf(%r).skipperAt)" % (a[0], a[0], a[0]), timeout=120000); await pg.wait_for_timeout(4000)
                    if peers: await pg.evaluate(PEER, peers); await pg.wait_for_timeout(9000)
                    await pg.screenshot(path=os.path.join(OUT, 'folk2boats_%s_%s_%s.png' % (name, kind, tag)), timeout=400000)
                    print(name, kind, tag, 'gl', await pg.evaluate("G3._debug.glErr()"), 'feil', errs[:3], flush=True)
                await pg.close()
        await br.close()
asyncio.run(main())
