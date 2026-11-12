"""Man overboard in 3D (Ø11.6; view3d/21-rescue-anchor.js drawMob, deckcrew.js the hand who points), run alone (3D):
1. The coastal boat of 21 m (from 15 m the MOB light with its smoke, FOR-2000-06-13-660 § 7-10) lying in a moderate sea off Husøy at
   noon in June: the person in the water in the life jacket, head and shoulders over the sea and one arm waving; the lifebuoy flat on
   the sea a few metres off with its light floating by it and the orange smoke; the empty holder on the rail where the buoy hung; a hand
   on deck turned to her.
2. The autoliner (from 45 m, § 7-5): the rescue boat swung out on the davit and lowered (the cradle empty), then on her way out to the
   person in the water.
Checks what the frames drew (window.MOB3D.st) and that there are no page errors; pictures in tests/out/mobshot_*.png."""
from _env import boot, OUT
import asyncio, os, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


SET = """(async (a) => { const [vt, off] = a, b = S.boat, HP = portById('husoy'); await mapNeed(HP.p, 14); const sp = driftAnchorage('husoy'); await mapNeed(sp, 6);
  S.tut = 0; S.mult = 1; S.t = Math.round((Date.UTC(2027, 5, 18, 12, 0) - EPOCH) / 6e4); acc = 0; WX_FORCE = {w:3, d:250}; MOBF.live = true;
  b.type = vt; applyVessel(); G3.vesselChanged(); S.jobs = []; S.cargo = []; b.gop = null; S.plan = null; S.hold = []; b.anch = null; b.status = 'idle'; b.port = null; b.pos = {x:sp.x, y:sp.y}; b.heading = 2.1; b.v = 0;
  S.mob = null; S.mobs = []; const c1 = genCrew(), c2 = genCrew(); c1.name = 'Stian Nilsen'; c1.sex = 'm'; c2.name = 'Kari Berg'; c2.sex = 'f'; c1.off = c2.off = false; c1.bi = c2.bi = false; S.crew = vt === 'autoliner' ? [] : [c1, c2]; S.me = S.cur;
  const who = vt === 'autoliner' ? {id:'lag-A-dekk3', anon:true, role:'dekk', name:'Dekk 3', sex:'m'} : c1;
  mobStart({p:{c:who, st:'haling'}, w:1}, vt === 'autoliner' ? [{p:{c:who}, w:1}] : [{p:{c:c1}, w:1}, {p:{c:c2, st:'sloy'}, w:1}], {sst:9, dark:false});
  // (the person off the starboard beam, the buoy a few metres from her)
  const M = S.mob, hd = b.heading, gs = gridScale(b.pos), k = off / 1000 * gs; M.x = b.pos.x + Math.cos(hd) * k; M.y = b.pos.y + Math.sin(hd) * k; M.vx = M.vy = 0;
  if (M.buoy){ M.buoy.x = M.x + Math.sin(hd) * 0.006 * gs; M.buoy.y = M.y - Math.cos(hd) * 0.006 * gs; M.buoy.held = false; M.buoy.t = S.t; }
  const c = G3._debug.cam; c.helm = false; c.pitch = 0.12; c.dist = 42; c.yaw = -Math.PI / 2 + 0.25;   // (from the starboard side, out beyond her, towards the boat)
  return {vt, len:VESSELS[vt].len, lsa:VESSELS[vt].lsa, buoy:!!M.buoy, smoke:M.buoy ? M.buoy.smoke : null}; })"""


# the person (and the buoy by her) held at bearing rb (rad from the bow, + to starboard) and d metres from the boat while the picture is
# taken (SwiftShader takes tens of seconds for a frame, and she drifts a few metres a game minute)
PLACE = """(a) => { const [rb, d, bd] = a, M = S.mob, b = S.boat; if (!M) return 0; const gs = gridScale(b.pos), h = b.heading + rb, k = d / 1000 * gs;
  M.x = b.pos.x + Math.sin(h) * k; M.y = b.pos.y - Math.cos(h) * k; M.vx = M.vy = 0;
  if (M.buoy && bd != null){ M.buoy.held = false; M.buoy.x = M.x + Math.sin(h - 1.2) * bd / 1000 * gs; M.buoy.y = M.y - Math.cos(h - 1.2) * bd / 1000 * gs; } return 1; }"""


async def held(pg, a, ms):
    for i in range(int(ms / 400)):
        await pg.evaluate(PLACE, a); await pg.wait_for_timeout(400)


async def frames(pg, n=3):
    # (n frames the game has drawn, then 1.5 s for the motion: two requestAnimationFrame in a row put at least one whole frame of the
    # game's own loop, view3d/24-cinema.js, between the call and the reading. Before, a counter here went up on every poll, not on
    # every frame, so this waited 1.5 s only, and when SwiftShader took longer for a frame, check 3 read the frame before S.mob was
    # cleared: red on plan/2026-11-12-88 once, 12.11.2026, green on the same build run again)
    for i in range(n):
        await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
        await pg.wait_for_timeout(1500)


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        # ---- 1. the coastal boat of 21 m ----
        r = await pg.evaluate(SET, ['kyst21', 16]); print('1 setup:', json.dumps(r, ensure_ascii=False))
        A1 = [1.5708, 12, 3]
        await held(pg, A1, 6000)
        st = await pg.evaluate("Object.assign({}, window.MOB3D.st)")
        print('1:', json.dumps(st))
        check(st['person'] == 1, '1a. personen i sjøen er tegnet', st)
        check(st['buoy'] == 1 and st['light'] == 1, '1b. livbøya flat på sjøen og lyset ved den', st)
        check(st['holder'] == 1, '1c. den tomme holderen på rekka der bøya hang', st)
        check(st['smoke'] > 0, '1d. røyken fra MOB-lyset (fra 15 m)', st)
        await pg.evaluate(PLACE, A1); await pg.screenshot(path=os.path.join(OUT, 'mobshot_kyst21.png'))
        await pg.evaluate("(() => { const c = G3._debug.cam; c.yaw = -Math.PI / 2 + 0.1; c.pitch = 0.1; c.dist = 27; })()"); await held(pg, A1, 4000)
        await pg.evaluate(PLACE, A1); await pg.screenshot(path=os.path.join(OUT, 'mobshot_kyst21_naer.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await held(pg, A1, 4000)
        await pg.evaluate(PLACE, A1); await pg.screenshot(path=os.path.join(OUT, 'mobshot_kyst21_port.png'))
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # ---- 2. the autoliner: the rescue boat swung out, lowered, and out to the person ----
        r = await pg.evaluate(SET, ['autoliner', 70]); print('2 setup:', json.dumps(r, ensure_ascii=False))
        A2 = [-1.4, 40, None]; await pg.evaluate(PLACE, A2)   # (on the port side for the davit's picture, out of its way)
        r = await pg.evaluate("""(() => { const why = mobLift('boat', S.boat.pos, 0), L = S.mob.lift; return {why, ph:L && L.ph, t0:L && L.t0, tp:L && L.tp, t1:L && L.t1, S:S.t}; })()""")
        print('2 lift:', json.dumps(r))
        check(not r['why'] and r['ph'], '2a. MOB-båten settes ut', r)
        # (the phases held long enough for the pictures: the lowering, then the way out)
        await pg.evaluate("(() => { const L = S.mob.lift, t = S.t + liveFrac(); L.t0 = t - 1.2; L.ph = {swing:t - 0.2, low:t + 30, there:t + 60}; L.tp = t + 70; L.ph.back = t + 80; L.t1 = t + 90; })()")
        await held(pg, A2, 4000); st = await pg.evaluate("Object.assign({}, window.MOB3D.st)"); print('2 lower:', json.dumps(st))
        check(st['boat'] == 'lower', '2b. davitet svingt ut og MOB-båten på vei ned', st)
        await pg.evaluate("(() => { const c = G3._debug.cam; c.yaw = -Math.PI / 2 - 0.5; c.pitch = 0.22; c.dist = 48; })()"); await held(pg, A2, 4000)
        await pg.evaluate(PLACE, A2); await pg.screenshot(path=os.path.join(OUT, 'mobshot_autoliner_davit.png'))
        A2 = [1.3, 40, None]
        await pg.evaluate("(() => { const L = S.mob.lift, t = S.t + liveFrac(); L.ph.low = t - 20; L.ph.there = t + 12; L.tp = t + 40; L.ph.back = t + 50; L.t1 = t + 60; })()")
        await pg.evaluate("(() => { const c = G3._debug.cam; c.yaw = -Math.PI / 2 + 0.3; c.pitch = 0.18; c.dist = 110; })()"); await held(pg, A2, 4000); st = await pg.evaluate("Object.assign({}, window.MOB3D.st)"); print('2 out:', json.dumps(st))
        check(st['boat'] == 'out' and st['person'] == 1, '2c. MOB-båten på vei ut til personen i sjøen', st)
        await pg.evaluate(PLACE, A2); await pg.screenshot(path=os.path.join(OUT, 'mobshot_autoliner_ut.png'))
        await pg.evaluate("(() => { S.mob = null; MOBF.live = null; WX_FORCE = null; })()"); await frames(pg, 1)
        st = await pg.evaluate("Object.assign({}, window.MOB3D.st)")
        check(st['person'] == 0 and st['boat'] is None, '3. etterpå: ingenting igjen, og båten i vugga (drawSafety)', st)
        print('errors:', errs)
        await br.close()

asyncio.run(main())
