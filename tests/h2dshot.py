"""Havsteget H2d1 (docs/planer/havsteget-h2-autoline.md, 05.11.2026): the Blender models of the autoline operation in the game, with the whole
coast, on the autoliners' ground north of Loppa (the one tests/havplantest.py uses) and at the ocean plant nearest Tromsøflaket.
  1 at sea: the autoline hauler (tools/gear/autoline.py) stands in the open hauling port (tools/boats/al45.py), the hatch shut
  2 hauling: the line comes in through the port over the hauler's sheave, which turns, with its snoods and hooks every 1.3 m
  3 the ends of the set: the ocean marker poles of § 68 (two flags at the west end, one at the east), and their yellow lamps at night
  4 the landing on pallets: the hatch open, the Blender pallet (tools/deck/pall.py) on the pallet fork on the plant's crane
Pictures in both formats (h2d_<what>_liggende.png, _staaende.png). 3D: run alone. Needs tools/map/out/game (release.py and game.py).
Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, sys
from playwright.async_api import async_playwright

SEL = set(sys.argv[1:]); want = lambda k: not SEL or k in SEL
def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

SETUP = """async (hour) => {
  const R = {}, b = S.boat; S.t = Math.round((Date.UTC(2027, 2, 9, hour) - EPOCH) / 6e4); S.tut = 0; S.mult = 0;
  b.type = 'autoliner'; applyVessel(); G3.vesselChanged(); S.lic = {id:'konv', hav:true, kf:3.49, hl:'Konvensjonell havfisketillatelse'}; freshQuota();
  S.pgear = newPGear(); const pg = S.pgear; autoL(pg); careInit(pg); baitOf(pg).saury = 4000; baitOf(pg).blekksprut = 3000; pg.hooks = 30000;
  S.crew = []; S.lag = null; lagOf(); S.plan = null; S.ops = null; S.sets = []; S.hold = []; b.land = null; b.gop = null; b.hove = null; b.anch = null;
  // the NPC autoliners' ground nearest 71° N 17° Ø, north of Loppa (as havplantest)
  const GR = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})), t2 = P(71.0, 17.0), p = GR.sort((a, c) => dist(a, t2) - dist(c, t2))[0];
  await mapNeed(p, 14); R.ll = LL(p); window.__p = p;
  b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; b.heading = Math.PI / 2; S.me = S.cur;
  b.fuel = BOAT.fuelCap; b.prov = null; provFill();   // (without diesel the freezers stop, the deck fills and the haul stops, deckStop)
  return R; }"""

# a haul under way: the second of four lenker coming in through the port, with fish on the line
HAUL = """() => { const b = S.boat, p = window.__p, q = {x:p.x + 6, y:p.y};
  S.sets = [{id:'t', vid:S.cur, kind:'line', lk:'auto', n:4, hooks:20000, a:{...p}, b:q, tSet:S.t - 8 * 60, depth:300, acc:{torsk:{kg:900, n:300}, hyse:{kg:400, n:250}, brosme:{kg:300, n:120}}, dead:0, lost:null}];
  b.status = 'fishing'; b.fishUntil = S.t + 600; b.deckStop = false; b.fuel = BOAT.fuelCap; S.hold = [];
  b.gop = {op:'haul', kind:'line', sid:'t', n:4, done:1, prog:0.4, auto:true, a:{...p}, b:q, kg:0, rel:0, dead:0, hooksPer:5000, sub:0, sl:20, soak:8, fishAfter:0};
  return {gop:!!b.gop}; }"""

# the ends of two autoline sets near her: one with its west end 70 m off her starboard side, one with its east end there
POLES = """() => { const b = S.boat, p = b.pos; b.gop = null; b.status = 'idle'; b.fishUntil = null; b.v = 0; b.heading = Math.PI / 2;
  // (she heads east: the west end 35 m astern of her and the east end 35 m ahead, both 15 m to port, so they show past her ends from
  // starboard; laid out from where she is just before each picture, since she drifts while the clock runs)
  const e1 = {x:p.x - 0.035, y:p.y - 0.015}, e2 = {x:p.x + 0.035, y:p.y - 0.015};
  S.sets = [{id:'w', vid:S.cur, kind:'line', lk:'auto', n:2, hooks:10000, a:e1, b:{x:e1.x + 13, y:e1.y}, tSet:S.t - 60, depth:300, acc:{}, dead:0, lost:null},
            {id:'o', vid:S.cur, kind:'line', lk:'auto', n:2, hooks:10000, a:{x:e2.x - 13, y:e2.y}, b:e2, tSet:S.t - 60, depth:300, acc:{}, dead:0, lost:null}];
  return S.sets.map(s => [s.a.x <= s.b.x ? 'a vest' : 'a øst']); }"""

# a landing on pallets at the ocean plant nearest Tromsøflaket, held with a pallet on the fork in the air
LAND = """async () => { const R = {}, b = S.boat; b.gop = null; S.sets = [];
  const tgt = P(70.3, 19.0), pt = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'autoliner')).sort((a, c) => dist(a.p, tgt) - dist(c.p, tgt))[0];
  await mapNeed(pt.p, 6); R.port = pt.name;
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.berth = 'main'; S.me = null; G3.vesselChanged();
  S.hold.push({sp:'torsk', kg:30000, n:9000, cls:0, fresh:100, gut:true, iced:true, frozen:true, bled:true, hr:0, hook:true});
  R.started = startLanding(false); const L = b.land; R.kind = L && L.kind; R.lifts = L && L.lifts;
  if (L){ S.t = Math.floor(L.t0 + landLiftT(L, 2) + 0.6 * liftMin(L)); window.__L = L; }
  return R; }"""

# the landing's clock back to a pallet on the fork in the air (the third lift), before each picture
HOLD = """() => { const L = window.__L; if (L && S.boat.land === L) S.t = Math.floor(L.t0 + landLiftT(L, 2) + 0.6 * liftMin(L)); }"""

CAM = """([dist, pitch, yaw]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = yaw; }"""

async def frames(pg, n=3):
    """wait for n frames drawn (SwiftShader can take a second or more for one)"""
    for _ in range(n): await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")

async def shots(pg, name, pre=None):
    for tag, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
        # (SwiftShader takes seconds to draw again after the canvas changes size: wait for the 3D view's own frames, not a fixed time)
        await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(3000)
        if pre: await pg.evaluate(pre)
        await frames(pg, 6)
        await pg.screenshot(path=f'h2d_{name}_{tag}.png')
    await pg.set_viewport_size({'width': 1280, 'height': 800})

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e) + (' @ ' + ' < '.join(l.strip() for l in e.stack.split('\n')[1:4]) if e.stack else '')))
        await boot(pg)
        await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
        R = await pg.evaluate(SETUP, 11); print('  feltet:', R)
        await pg.wait_for_timeout(4000); await frames(pg, 4)
        if want('1'):
            await pg.evaluate(CAM, [16, 0.12, -1.45]); await pg.wait_for_timeout(2500); await frames(pg, 4)
            st = await pg.evaluate("({haul:G3._debug.kitStat.haul, hatch:!!glbPart('autoliner', 'hatch'), aline:(() => { const G = geoOf('autoliner'); return !!(G && G.aline); })(), auto:!!glbHas('gear-autoline')})")
            await shots(pg, 'ute')
            check(st['haul'] == 'autoline' and st['hatch'] and st['aline'] and st['auto'], 'autolinehaleren står i haleporten (ankeret aline), og luka har lokket som egen del', st)
        if want('2'):
            await pg.evaluate(HAUL); await pg.evaluate(CAM, [13, 0.08, -1.5]); await pg.wait_for_timeout(2500)
            a0 = await pg.evaluate("G3._debug.haulA")
            try: await pg.wait_for_function("a => G3._debug.haulA > a + 0.05", arg=a0, timeout=30000)
            except Exception: pass
            a1 = await pg.evaluate("G3._debug.haulA")
            m = await pg.evaluate("(() => { const M = G3._debug.haulModel('auto'); return M ? {r:M.r, rg:M.rg, n:M.path.length, parts:[!!M.frame, !!M.sheave, !!M.stripper]} : null; })()")
            await shots(pg, 'drag')
            check(m and all(m['parts']) and a1 > a0, 'draget: lina inn gjennom haleporten over autolinehalerens skive, som går rundt', (m, round(a0, 2), round(a1, 2)))
            await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 11; c.pitch = 0.04; c.yaw = -1.52; })()"); await pg.wait_for_timeout(2500); await frames(pg, 3)
            await pg.screenshot(path='h2d_drag_naer.png')
        if want('3'):
            ends = await pg.evaluate(POLES); await pg.evaluate(CAM, [70, 0.22, -1.45]); await pg.wait_for_timeout(3000); await frames(pg, 4)
            hv = await pg.evaluate("({marks:(glbLoad('gear-marks') || {}).ex || {}})")
            await shots(pg, 'stenger', POLES)
            lv = (hv['marks'].get('havlys') or {})
            check(len(lv.get('havstang_v', [])) == 2 and len(lv.get('havstang_o', [])) == 1 and hv['marks'].get('blink') == 22, 'bøyestengene etter § 68: to lys i vest og ett i øst, 22 blink i minuttet', (ends, lv))
            await pg.evaluate("(() => { S.t = Math.round((Date.UTC(2027, 2, 9, 23) - EPOCH) / 6e4); })()"); await pg.wait_for_timeout(4000)
            n = 0
            for _ in range(12):
                await frames(pg, 2); n = max(n, await pg.evaluate("G3._debug.kitStat.havLamps || 0"))
                if n >= 1: break
            await pg.evaluate(POLES); await frames(pg, 2); await pg.screenshot(path='h2d_stenger_natt.png')
            night = await pg.evaluate("G3._debug.env.night")
            check(n >= 1, 'om natta blinker de gule lysene på stengene', {'lys': n, 'natt': round(night, 2)})
            await pg.evaluate("(() => { S.t = Math.round((Date.UTC(2027, 2, 9, 11) - EPOCH) / 6e4); })()")
        if want('4'):
            L = await pg.evaluate(LAND); print('  lossingen:', L)
            await pg.wait_for_timeout(6000); await pg.evaluate(CAM, [32, 1.25, 1.6])   # (nearly straight down over her port side: the lid opens to port, the quay's buildings would pull the eye in on starboard); await pg.wait_for_timeout(3000); await frames(pg, 4)
            st = await pg.evaluate("({k:G3._debug.hatchK(), fork:G3._debug.kitPart('pall', 'gaffel'), full:G3._debug.kitPart('pall', 'pall_full'), scene:(() => { const P = G3._debug.PLANTS.find(q => q.scene); return P ? {hang:!!P.scene.hang, deck:P.scene.deck.length, quay:P.scene.quay.length} : null; })()})")
            await shots(pg, 'lossing', HOLD)
            check(L.get('kind') == 'pall' and st['k'] > 0.9 and st['fork'] and st['full'] and st['scene'] and st['scene']['hang'], 'lossingen: luka er åpen, pallen fra Blender henger i pallegaffelen på kranen', st)
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('sidefeil:', list(dict.fromkeys(errs))[:5])
        await b.close()

asyncio.run(main())
