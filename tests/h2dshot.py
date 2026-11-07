"""Havsteget H2d1 (docs/planer/havsteget-h2-autoline.md, 05.11.2026): the Blender models of the autoline operation in the game, with the whole
coast, on the autoliners' ground north of Loppa (the one tests/havplantest.py uses) and at the ocean plant nearest Tromsøflaket.
  1 at sea: the autoline hauler (tools/gear/autoline.py) stands in the open hauling port (tools/boats/al45.py), the hatch shut
  2 hauling: the line comes in through the port over the hauler's sheave, which turns, with its snoods and hooks every 1.3 m
  3 the ends of the set: the ocean marker poles of § 68 (two flags at the west end, one at the east), and their yellow lamps at night
  4 the landing on pallets: the hatch open, the Blender pallet (tools/deck/pall.py) on the pallet fork on the plant's crane
Havsteget H2d2 (06.11.2026), the animations:
  5 the setting: the pole and the grapnel go over the stern down the slide from the setting chute (anchors.aline.chute, .slide), the line
    with its baited hooks streams astern, and a new pole goes over between the lenker
  6 the haul at the port: the gaffer at the port takes the fish in one at a time and lets them fall at the fish chute, where they slide
    into its mouth in the back wall; the deck hand on the bleeding at the hook cleaner; the rest of the watch and those on a break inside
    (deckcrew.js places().port)
  7 the landing from the hold: her own forward crane (anchors.crane) takes the pallets up from the hold through the hatch on the pallet
    fork and sets them on the quay abreast of it for the forklift; the landing gang in the hatch, by it (signalling, guiding) and in the
    crane driver's cage, the plant's gang on the quay as before (the plant's crane idle: it could not reach the hatch)
Havsteget H2e (06.11.2026), the spot checks along the coast:
  8 the landing with her own crane at the plants that take her nearest Båtsfjord, Tromsø, Ålesund and Bergen (the ones tests/havtur.py
    lands at): the pallet set down on the plant's quay (P.onQuay), within the boom's reach, and the forklift taking it; pictures in both
    formats. Before H2e only Vannareid had been looked at. Run the towns alone with: python3 tests/h2dshot.py 8 [town ...]
Pictures in both formats (h2d_<what>_liggende.png, _staaende.png). 3D: run alone. Needs tools/map/out/game (release.py and game.py).
Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, sys
from playwright.async_api import async_playwright

TOWNS = [('Båtsfjord', 70.633, 29.72), ('Tromsø', 69.649, 18.96), ('Ålesund', 62.472, 6.155), ('Bergen', 60.393, 5.312)]
SEL = set(a for a in sys.argv[1:] if not any(a.lower() == t[0].lower() for t in TOWNS)); want = lambda k: not SEL or k in SEL
TOWNSEL = [t for t in TOWNS if any(a.lower() == t[0].lower() for a in sys.argv[1:])] or TOWNS
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

# a landing on pallets at the plant nearest a town that takes her (as tests/havtur.py), the boat at her berth there
LANDT = """async ([la, lo]) => { const R = {}, b = S.boat, T = P(la, lo); b.gop = null; S.sets = []; b.land = null; b.fueling = null; b.shift = null;
  const pt = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'autoliner')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  await mapNeed(pt.p, 6); R.port = pt.name; R.id = pt.id;
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.berth = 'main'; S.me = null; G3.vesselChanged();
  S.t = Math.round((Date.UTC(2027, 2, 9, 11) - EPOCH) / 6e4); S.hold = [{sp:'torsk', kg:30000, n:9000, cls:0, fresh:100, gut:true, iced:true, frozen:true, bled:true, hr:0, hook:true}];
  R.started = startLanding(false); const L = b.land; R.kind = L && L.kind; R.lifts = L && L.lifts; window.__L = L;
  const bp = berthPose(pt.id, 'autoliner'); R.berth = bp ? {side:bp.side, face:!!bp.face} : null;
  return R; }"""

# the scene at a held moment of the third lift: her crane, the set-down spot on the quay (the plant's quay block?) and the forklift
QSCENE = """(() => { const P = G3._debug.PLANTS.find(q => q.scene), S0 = P && P.scene; if (!S0) return null; const C = geoOf('autoliner').crane, D = S0.D;
  return {ship:!!S0.ship, hang:!!S0.hang, quay:S0.quay.length, D:D && D.map(v => +v.toFixed(1)), onQuay:!!(D && P.onQuay(D)), tip:G3._debug.shipCr.tip, len:C.len,
    fk:S0.fk ? {x:+S0.fk.x.toFixed(1), z:+S0.fk.z.toFixed(1), on:P.onQuay([S0.fk.x, S0.fk.z])} : null, u:+S0.u.toFixed(2)}; })()"""

# the landing's clock back to a pallet on the fork in the air (the third lift), before each picture
HOLD = """() => { const L = window.__L; if (L && S.boat.land === L) S.t = Math.floor(L.t0 + landLiftT(L, 2) + 0.6 * liftMin(L)); }"""

# the setting (H2d2): two lenker of autoline baited with saury, set eastwards from where she is; the end lines first (lead), as on the ground
SET = """() => { const b = S.boat, p = window.__p; S.sets = []; b.gop = null; b.status = 'idle'; b.v = 0; b.heading = Math.PI / 2; b.pos = {...p}; b.land = null;
  b.fuel = BOAT.fuelCap; const pg = S.pgear; autoL(pg); baitOf(pg).saury = 4000;
  const why = startSet('line', {lk:'auto', n:2, bait:'saury'}, 0, Math.PI / 2); const g = b.gop;
  // (held where it is while the pictures are taken: the clock runs on at six times real time and a lenke would be set in under five
  // minutes; with this many hooks to the lenke the line hardly moves on, and JUNC puts her where the test wants her)
  if (g) g.hooksPer = 5e7;
  return {why, gop:!!g, lead:g && g.lead, auto:g && g.auto, n:g && g.n, bait:g && g.s && g.s.bait}; }"""

# the setting at a point along it in lenker (0.965: a little before the end of the first, 1.006: just over it, where the pole between the
# lenker goes over)
JUNC = """(at) => { const b = S.boat, g = b.gop; if (!g) return null; g.lead = 0; g.done = Math.floor(at); g.prog = at - g.done; g.sub = 0; const f = (g.done + g.prog) / g.n;
  b.pos = {x:g.a.x + (g.b.x - g.a.x) * f, y:g.a.y + (g.b.y - g.a.y) * f}; g.mv = null; return +f.toFixed(4); }"""

# a fish for the gaffer, as the haul's slices bring them aboard (window.CATCHQ)
FISH = """(n) => { const Q = window.CATCHQ || (window.CATCHQ = []); for (let i = 0; i < n; i++) Q.push({sp:['torsk', 'hyse', 'brosme'][i % 3], kg:3 + i, t:performance.now()}); return Q.length; }"""

# who of the watch is where in the hauling station (the agents of deckcrew.js)
CREW = """() => { const P = CREW3D.places(), A = CREW3D.visible().filter(a => !(a.goal && a.goal.inside)).map(a => ({st:a.st, role:a.role, task:a.goal && a.goal.task, x:+a.x.toFixed(2), z:+a.z.toFixed(2), mode:a.mode}));
  const all = CREW3D.agents().map(a => ({st:a.st, inside:!!(a.goal && a.goal.inside), mode:a.mode})); return {port:!!(P && P.port), vis:A, all}; }"""

# the landing held at the fork down in the hold under the hatch (u 0.38 of the third lift), and at the pallet coming up through it (0.49)
HOLDU = """(u) => G3._debug.landFix(u == null ? null : 2, u)"""   # (the third lift held at u, the scene's own clock; null lets it run)

CAM = """([dist, pitch, yaw, at]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = yaw; c.at = at || null; }"""

async def frames(pg, n=3):
    """wait for n frames drawn (SwiftShader can take a second or more for one)"""
    for _ in range(n): await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")

async def shots(pg, name, pre=None, tmo=None):
    for tag, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
        # (SwiftShader takes seconds to draw again after the canvas changes size: wait for the 3D view's own frames, not a fixed time)
        await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(3000)
        if pre: await pg.evaluate(pre)
        await frames(pg, 6)
        # (at a plant a frame can take minutes in SwiftShader: kaishot gives its pictures five)
        await pg.screenshot(path=f'h2d_{name}_{tag}.png', **({'timeout': tmo} if tmo else {}))
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
        if want('5'):
            R5 = await pg.evaluate(SET); print('  settingen:', R5)
            await pg.evaluate(CAM, [20, 0.28, -0.75, [3.4, 0.5, 27.0]]); await pg.wait_for_timeout(1500)
            # (held the moment both have gone over, in the same call: SwiftShader's frames are slow, and a drop is done in a few seconds)
            HOLD1 = "(() => { const k = G3._debug.kitStat; if ((k.aDrop_pole || 0) >= 1 && (k.aDrop_dregg || 0) >= 1){ G3._debug.almFix(0.55); return true; } return false; })()"
            for _ in range(20):
                await frames(pg, 1)
                if await pg.evaluate(HOLD1): break
            st = await pg.evaluate("Object.assign({}, G3._debug.kitStat, {alm:G3._debug.alm})")
            await shots(pg, 'setting_stang')
            await pg.evaluate("G3._debug.almFix(1.85)"); await frames(pg, 3); await pg.screenshot(path='h2d_setting_dregg.png')
            check(R5.get('why') is None and R5.get('auto') and st.get('aDrop_pole', 0) >= 1 and st.get('aDrop_dregg', 0) >= 1 and st['alm']['on'] and st['alm']['drops'] >= 2,
                  'settingen: bøyestanga og dreggen går over hekken nedover slisken', {k: st.get(k) for k in ('aDrop_pole', 'aDrop_dregg', 'aDrop_vak', 'aFly', 'alm')})
            await pg.evaluate("G3._debug.almFix(null)")
            await pg.evaluate("(() => { S.boat.gop.lead = 0; })()"); await pg.evaluate(CAM, [18, 0.22, -0.9, [3.4, 0.3, 30.0]]); await pg.wait_for_timeout(2500); await frames(pg, 4)
            hk = await pg.evaluate("G3._debug.kitStat.aSet || 0")
            await shots(pg, 'setting_line')
            check(hk >= 8, 'settingen: lina med egnede kroker går ut fra slisken og akterover i kjølvannet', {'kroker': hk})
            await pg.evaluate(SET); f = await pg.evaluate(JUNC, 0.965); await frames(pg, 4); await pg.evaluate("G3._debug.almReset()"); await frames(pg, 3)
            p0 = await pg.evaluate("G3._debug.kitStat.aDrop_pole || 0"); a0 = await pg.evaluate("G3._debug.alm")
            f = await pg.evaluate(JUNC, 1.006)   # (her middle 39 m past the end of the first lenke: her slide is just over it)
            p1 = p0
            for _ in range(30):
                await frames(pg, 1); p1 = await pg.evaluate("(p0) => { const n = G3._debug.kitStat.aDrop_pole || 0; if (n > p0) G3._debug.almFix(0.5); return n; }", p0)
                if p1 > p0: break
            a1 = await pg.evaluate("G3._debug.alm")
            await frames(pg, 3); await pg.screenshot(path='h2d_setting_mellomstang.png'); await pg.evaluate("G3._debug.almFix(null)")
            check(p1 > p0 and a1['out'] > a0['out'], 'settingen: ny bøyestang over hekken mellom lenkene', {'stenger': [p0, p1], 'ute': [a0['out'], a1['out']], 'sC': a1['sC'], 'L': a1['L']})
            await pg.evaluate("(() => { const b = S.boat; b.gop = null; b.status = 'idle'; S.sets = []; })()"); await pg.evaluate(CAM, [16, 0.12, -1.45])
        if want('6'):
            await pg.evaluate(HAUL); await pg.evaluate("(() => { S.boat.gop.prog = 0.1; })()"); await pg.wait_for_timeout(3000)
            await pg.evaluate(CAM, [7.5, 0.1, -1.6, [4.6, 1.9, -1.2]]); await pg.wait_for_timeout(2500)
            cr = await pg.evaluate(CREW)
            g0 = await pg.evaluate("G3._debug.dk.n.gaff"); s0 = await pg.evaluate("G3._debug.kitStat.aSlid || 0")
            await pg.evaluate(FISH, 4)
            g1, s1 = g0, s0
            for _ in range(40):
                await frames(pg, 1); g1 = await pg.evaluate("G3._debug.dk.n.gaff"); s1 = await pg.evaluate("G3._debug.kitStat.aSlid || 0")
                if g1 > g0 and s1 > s0: break
            await shots(pg, 'drag_porten', FISH.replace('(n) =>', '() =>').replace('i < n', 'i < 1'))
            # (those on their way in through the doorway are not counted: their goal is inside)
            gaffer = [a for a in cr['vis'] if a['task'] == 'haul' and a['st'] == 'haling']; tender = [a for a in cr['vis'] if a['task'] == 'coil' and a['st'] == 'blogg']
            check(cr['port'] and len(gaffer) == 1 and len(tender) == 1 and len(cr['vis']) == 2,
                  'draget: én gaffer ved porten og én ved krokrenseren i haleplassen, resten av vakta inne', cr)
            check(g1 > g0 and s1 > s0, 'draget: fisken gaffes inn én og én ved porten og sklir inn i fiskerenna', {'gaff': [g0, g1], 'renna': [s0, s1]})
            await pg.evaluate("(() => { const b = S.boat; b.gop = null; b.status = 'idle'; S.sets = []; })()"); await pg.evaluate(CAM, [16, 0.12, -1.45])
        if want('7'):
            # (a landing of her own still going on from part 4, else a new one: parts 5 and 6 take her out to the ground)
            if not await pg.evaluate("!!(S.boat.land && S.boat.status === 'port' && window.__L === S.boat.land)"):
                L = await pg.evaluate(LAND); print('  lossingen:', L); await pg.wait_for_timeout(6000)
            # (from high over her starboard quarter, down into the hatch: the lid opens to port and would hide the opening from that side)
            # (from over the water on her port side: the plant's silo stands between the quay and her; high, to see down into the hatch)
            await pg.evaluate(CAM, [16, 1.1, 1.35, [-1.6, 6.0, -0.9]]); await pg.evaluate(HOLDU, 0.38); await pg.wait_for_timeout(3000); await frames(pg, 3)
            # (her own forward crane lands the pallets, H2d2: its hook's height in her frame; the plant's crane stands idle)
            scene = """(() => { const P = G3._debug.PLANTS.find(q => q.scene), S0 = P && P.scene; return S0 ? {ship:!!S0.ship, hang:!!S0.hang, u:+S0.u.toFixed(2), hook:S0.spose ? +S0.spose.hook.toFixed(2) : null, deckN:S0.deck.length, gang:G3._debug.landHatch, cr:G3._debug.shipCr} : null; })()"""
            down = await pg.evaluate(scene)
            await pg.evaluate(HOLDU, 0.49); await frames(pg, 3); up = await pg.evaluate(scene)
            dk = await pg.evaluate("(() => { const G = geoOf('autoliner'); return {deck:G.hatch.deck}; })()")
            # (the hook's level in her frame: down in the hold it is below her weather deck, as the pallet comes up it is over it)
            check(down and up and down['ship'] and down['cr']['parts'] and down['cr']['tip'] and not down['hang'] and up['hang'] and down['hook'] < dk['deck'] < up['hook'] and down['gang'] and len(down['gang']) == 4,
                  'lossingen: båtens egen kran tar pallene opp fra rommet gjennom luka på gaffelen, lossegjengen i luka, ved den og i kranførerens bur', {'nede': down, 'oppe': up, 'dekk': dk})
            # (the pictures last: SwiftShader can take minutes for a frame at a plant, and a picture that times out is not a fault in the game)
            try:
                # (all from high over her port side, close: with the plant's quay and buildings in the picture SwiftShader timed out)
                await pg.evaluate(CAM, [16, 0.95, 1.35, [-1.0, 7.5, -0.9]]); await pg.evaluate(HOLDU, 0.49); await shots(pg, 'lossing_luka')
                await pg.evaluate(CAM, [16, 1.1, 1.35, [-1.6, 6.0, -0.9]])
                await pg.evaluate(HOLDU, 0.38); await frames(pg, 3); await pg.screenshot(path='h2d_lossing_rommet.png')
                await pg.evaluate(CAM, [18, 1.0, 1.2, [5.0, 5.0, -4.0]]); await pg.evaluate(HOLDU, 0.8); await frames(pg, 3); await pg.screenshot(path='h2d_lossing_kaia.png')
            except Exception as e: print('  (bildet av lossingen gikk ut på tid i SwiftShader:', str(e).split(chr(10))[0][:120] + ')')
            await pg.evaluate(HOLDU, None)
        if want('8'):
            for town, la, lo in TOWNSEL:
                L = await pg.evaluate(LANDT, [la, lo]); print('  lossingen ved', town + ':', L); await pg.wait_for_timeout(6000); await frames(pg, 3)
                # (the pallet on the fork over the quay, about to be set down: u 0.7 of the third lift; then set down, 0.8)
                await pg.evaluate(CAM, [22, 0.9, 1.2, [4.0, 5.0, -4.0]]); await pg.evaluate(HOLDU, 0.7); await frames(pg, 4); over = await pg.evaluate(QSCENE)
                await pg.evaluate(HOLDU, 0.8); await frames(pg, 4); down = await pg.evaluate(QSCENE)
                check(L.get('started') and L.get('kind') == 'pall' and down and down['ship'] and down['onQuay'] and over and over['hang'],
                      'lossingen ved ' + L.get('port', town) + ' (' + town + '): båtens egen kran setter pallen på mottakets kai', {'over': over, 'nede': down, 'kai': L.get('berth')})
                try:
                    # (from high over the quay at her crane, looking down at the pallet going ashore: the fewer buildings, the quicker the frame)
                    await pg.evaluate(CAM, [18, 1.25, -1.4, [5.0, 5.0, -4.0]])
                    await shots(pg, 'kran_' + town.lower().replace('ø', 'o').replace('å', 'a'), "G3._debug.landFix(2, 0.75)", 300000)
                except Exception as e: print('  (bildet ved', town, 'gikk ut på tid i SwiftShader:', str(e).split(chr(10))[0][:120] + ')')
                await pg.evaluate(HOLDU, None)
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('sidefeil:', list(dict.fromkeys(errs))[:5])
        await b.close()

asyncio.run(main())
