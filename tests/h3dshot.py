"""Havsteget H3d1 (docs/planer/havsteget-h3-snokrabbe.md, 07.11.2026): the Blender model of the snow crab vessel (tools/boats/krabbe50.py)
and the snow crab gear (tools/gear/snoteine.py) in the game, with the whole coast, in both formats (800×1280 and 1280×800):
  1 at sea off Båtsfjord by day: K1 the port bow quarter, K2 the starboard stern quarter, the bridge (the helm's view) and K7 from above
  2 the work on Sentralbanken: a string of conical pots hauled at the hauler under the portal, the pot emptied on the sorting table, the
    stacks on the pot deck, the crew of the watch on deck (the before and after of the hauling station, H3d2 builds the work on it)
  3 K6 at night under way, from the starboard bow, the port bow and astern: the lanterns (the camera's yaw: + is to port,
    - to starboard; the red and the green side light tell them apart in the pictures, 07.11.2026)
  4 at the plant nearest Båtsfjord, alongside: her size against the quay
  5 one of the ocean fleet's snow crab vessels (05d-hav.js, the same model) at 120 m and at 700 m (the far model)
and asks the game whether it draws the Blender model with the anchors the work needs (sulebas-bygging.md kap. 12): the hauler, the
pot chute, the sorting table, the stacks, the hatch with its lid as a part, the crane with its hook (H3d2 animates them).
Pictures in tests/out/h3d_<TAG>_<what>_<format>.png. 3D: run alone.
    TAG=for python3 tests/h3dshot.py         (or TAG=etter; parts: ... 1 3; one format: KYST_FMT=liggende)
Prints OK or FEIL."""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
OUT = os.path.join(ROOT, 'tests', 'out'); TAG = os.environ.get('TAG', 'etter')
SEL = set(sys.argv[1:]); want = lambda k: not SEL or k in SEL
def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:700]) if extra != '' else ''), flush=True)

# the vessel, her permit, her pots, her crew; at sea off Båtsfjord under way (hour UTC)
SET = """async ([hour, la, lo]) => { const b = S.boat, R = {}; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, hour) - EPOCH) / 6e4);
  if (b.type !== 'snokrabbe'){ b.type = 'snokrabbe'; applyVessel(); G3.vesselChanged(); }
  S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'}; freshQuota(); S.boatName = 'Polarbas'; S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; b.land = null; S.hold = [];
  S.pgear = newPGear(); const pg = S.pgear; pg.pots.sno = 1200; pg.kits.n = 40; pg.kits.heavy = 40; baitOf(pg).blekksprut = 20000; b.rig = 'teine';
  if (!S.lag){ S.crew = []; lagOf(); }
  const p = P(la, lo); await mapNeed(p, 8); b.status = 'sailing'; b.port = null; b.v = VESSELS.snokrabbe.vcruise || 11; b.pos = {x:p.x, y:p.y}; b.heading = 1.2; S.me = S.cur;
  b.fuel = BOAT.fuelCap; b.prov = null; provFill();
  S.plan = {wps:[{x:b.pos.x + 9, y:b.pos.y, port:null, fish:0}], idx:0, speed:b.v, returning:false}; S.sets = [];
  // (the pictures show the model: no scrapes from an earlier bump, and the hull not still wet from the jump here, wetTick dries 3.5 cm a second)
  R.dmg = b.dmg ? {s:+(b.dmg.s || 0).toFixed(3), h:+(b.dmg.h || 0).toFixed(3)} : null; b.dmg = null; if (G3._debug.wets) G3._debug.wets.clear(); return R; }"""

ASK = """((t) => { const G = geoOf(t), m = buildVesselModel(t, 2), g = glbLoad(t), K = G && G.kit || {};
  return {glbHas:glbHas(t), glb:!!(m && m.glb), tris:m ? m.o.p.length / 9 : 0, parts:g ? Object.keys(g.parts) : [], name:g && g.ex && g.ex.name,
    anchors:G ? Object.keys(G).sort() : [], kit:Object.keys(K), pots:K.pots ? {kind:K.pots.kind, at:(K.pots.at || []).length, spot:K.pots.spot} : null,
    lights:G && G.lights ? G.lights.map(l => l[2]) : [], snok:G && G.snok ? Object.keys(G.snok) : null, hatch:!!(G && G.hatch), crane:!!(G && G.crane && G.crane.axis),
    zones:Object.keys(glbZones(t)), mast:!!G3._debug.mastTop(t), helmKit:!!(typeof HELM_KIT !== 'undefined' && HELM_KIT[t]), snoteine:glbHas('gear-snoteine')}; })"""

# a string of 200 conical pots on Sentralbanken that has stood a week, hauled now, held at a pot on the table
HAUL = """async () => { const b = S.boat, pg = S.pgear, R = {};
  let p0 = null; for (let k = 0; k < 300 && !p0; k++){ const q = P(74.8 + 0.2 * Math.sin(k), 34.0 + 0.6 * Math.cos(k * 1.3)); await mapNeed(q, 8); const d = depthF(q);
    if (!isLand(q) && d >= 230 && d <= 340 && !ruBlockMsg({p:q, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'})) p0 = q; }
  R.ll = LL(p0); const a = {...p0}, e = {x:a.x, y:a.y + 5};
  S.sets = [{id:'k0', vid:S.cur, kind:'teine', pot:'sno', n:200, a, b:e, tSet:S.t - 7 * 1440, acc:{snokrabbe:{kg:1200, n:2200}}, dead:0, bait:'blekksprut', cond:1, heavy:true, depth:Math.round(depthF(a)), warn:0}];
  b.pos = {...a}; b.status = 'idle'; b.v = 0; b.heading = 0; S.plan = null; b.fuel = BOAT.fuelCap;
  R.why = startHaul('k0', false, 0); const g = b.gop; if (g){ g.done = 40; g.hooksPer = 5e7; } R.gop = !!g; R.n = g && g.n; return R; }"""

# alongside at the plant nearest Båtsfjord that takes her
PORT = """async () => { const b = S.boat, R = {}, T = P(70.633, 29.72); b.gop = null; S.sets = []; b.land = null; S.plan = null;
  const pt = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'snokrabbe')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  await mapNeed(pt.p, 6); R.port = pt.name; b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.berth = 'main'; S.me = null; G3.vesselChanged();
  S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); return R; }"""

# one of the ocean fleet's snow crab vessels at sea now (havState), the player off her at d km, looking at her
NPC = """async ([dkm]) => { const D = havData(), b = S.boat, R = {}; let best = null;
  // (the player in the 15 m coastal boat, so the camera behind her looks past her at the snow crab vessel, not from inside a 50 m hull)
  if (b.type !== 'kyst15'){ b.type = 'kyst15'; applyVessel(); G3.vesselChanged(); }
  for (let dh = 0; dh < 24 * 60 && !best; dh += 6){ const H = S.t / 60 + dh;
    for (const s of D.ships){ if (s.vtype !== 'snokrabbe' || havHeld(s)) continue; const A = havState(s, H, null); if (!A.hidden && A.st !== 'port' && A.p){ best = {s, A, H}; break; } } }
  if (!best) return {none:true};
  S.t = Math.round(best.H * 60); const A = best.A, p = {x:A.p.x + dkm * Math.cos(A.hd), y:A.p.y + dkm * Math.sin(A.hd)};
  await mapNeed(p, 8); b.status = 'idle'; b.v = 0; b.port = null; b.gop = null; S.sets = []; S.plan = null; b.pos = p;
  b.heading = Math.atan2(A.p.x - p.x, -(A.p.y - p.y)); COASTM.k = ''; HAV.k = '';
  R.name = best.s.name; R.st = A.st; R.ships = D.ships.filter(s => s.vtype === 'snokrabbe').length; R.ll = LL(A.p);
  R.near = havNear(S.t / 60).filter(n => n.vtype === 'snokrabbe').map(n => [n.name, +(dist(n.p, b.pos) * 1000).toFixed(0)]); return R; }"""

CAM = """([dist, pitch, yaw, at]) => { const c = G3._debug.cam; c.helm = false; c.dist = dist; c.pitch = pitch; c.yaw = yaw; c.at = at || null; if (G3._debug.wets) G3._debug.wets.clear(); }"""

async def frames(pg, n=3):
    for _ in range(n): await pg.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")

FMT = [f for f in (('liggende', 1280, 800), ('staaende', 800, 1280)) if os.environ.get('KYST_FMT', f[0]) == f[0]]
async def shots(pg, name, pre=None, tmo=400000):
    for tag, w, h in FMT:
        await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(2500)
        if pre: await pg.evaluate(pre)
        await frames(pg, 5)
        try: await pg.screenshot(path=os.path.join(OUT, 'h3d_%s_%s_%s.png' % (TAG, name, tag)), timeout=tmo)
        except Exception as e: print('  (bildet', name, tag, 'gikk ut på tid i SwiftShader:', str(e).split(chr(10))[0][:100] + ')', flush=True)
    await pg.set_viewport_size({'width': 1280, 'height': 800})

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e) + (' @ ' + ' < '.join(l.strip() for l in e.stack.split('\n')[1:4]) if e.stack else '')))
        await boot(pg); await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
        await pg.evaluate(SET, [11, 70.78, 30.1]); await pg.wait_for_function("geoOf('snokrabbe') && geoOf('snokrabbe').skipperAt", timeout=120000)
        m = await pg.evaluate(ASK, 'snokrabbe'); print('  modellen:', json.dumps(m, ensure_ascii=False), flush=True)
        check(m['glbHas'] and m['glb'] and 'hauler' in m['anchors'] and m['hatch'] and m['crane'] and not m['helmKit'],
              'Blender-modellen tegnes, med haleren, luka og kranen som ankre og eget styrepult (ikke HELM_KIT)', {k: m[k] for k in ('glbHas', 'tris', 'hatch', 'crane', 'helmKit')})
        sn = m['snok'] or []
        check(all(k in sn for k in ('hauler', 'chute', 'table', 'conv', 'hook')) and m['pots'] and m['pots']['at'] >= 20 and m['pots']['kind'] == 'kon',
              'ankrene H3d2 trenger: haleren, renna, sorteringsbordet, transportbåndet, kroken og stablene (kit.pots.at)', {'snok': m['snok'], 'pots': m['pots']})
        check(all(k in m['kit'] for k in ('mob', 'raft', 'buoys')) and m['snoteine'], 'MOB-båten, flåtene og bøyene på modellens egne plasser, og snøkrabbeteina fra Blender', {'kit': m['kit'], 'snoteine': m['snoteine']})
        check(sorted(m['lights']) == sorted(['masthead', 'masthead2', 'port', 'stbd', 'stern', 'fishR', 'fishW']) or {'masthead', 'masthead2', 'port', 'stbd', 'stern'} <= set(m['lights']),
              'lanternene: to toppløp, sidelysene og akterlyset (FOR-1975-12-01-5 vedlegg I)', m['lights'])
        if want('1'):
            await pg.evaluate(CAM, [62, 0.13, 2.5]); await pg.wait_for_timeout(5000); await shots(pg, 'ute')
            await pg.evaluate(CAM, [58, 0.22, -0.7]); await pg.wait_for_timeout(3000); await shots(pg, 'akter')
            await pg.evaluate("G3.setHelm(true)"); await pg.wait_for_timeout(4000); await shots(pg, 'bro'); await pg.evaluate("G3.setHelm(false)")
            await pg.evaluate(CAM, [70, 0.95, 1.9]); await pg.wait_for_timeout(4000); await shots(pg, 'ovenfra')
        if want('2'):
            r = await pg.evaluate(HAUL); print('  draget:', r, flush=True)
            await pg.evaluate("G3._debug.pota.fix = 0.75")
            await pg.evaluate(CAM, [26, 0.45, -2.2]); await pg.wait_for_timeout(5000)
            await shots(pg, 'drag')
            await pg.evaluate(CAM, [36, 0.75, 0.6]); await pg.wait_for_timeout(3000); await shots(pg, 'teinedekk')
            st = await pg.evaluate("({hands:G3._debug.gopHands(), kit:G3._debug.kitStat})")
            check(r.get('why') is None and r.get('gop'), 'en lenke på 200 teiner trekkes på Sentralbanken', {'r': r, 'hender': st['hands']})
            await pg.evaluate("G3._debug.pota.fix = null")
            await pg.evaluate(SET, [11, 70.78, 30.1])
        if want('3'):
            for nm, yaw in (('natt_sb', -2.5), ('natt_bb', 2.5), ('natt_akter', 0.0)):
                await pg.evaluate(SET, [22, 70.78, 30.1]); await pg.evaluate(CAM, [62, 0.07, yaw]); await pg.wait_for_timeout(5000)
                await shots(pg, nm)
            await pg.evaluate(SET, [11, 70.78, 30.1])
        if want('4'):
            r = await pg.evaluate(PORT); print('  havna:', r, flush=True); await pg.wait_for_timeout(6000)
            await pg.evaluate(CAM, [70, 0.3, 2.3]); await pg.wait_for_timeout(4000); await shots(pg, 'havn', None, 300000)
            await pg.evaluate(SET, [11, 70.78, 30.1])
        if want('5'):
            r = await pg.evaluate(NPC, [0.12]); print('  havflåten:', r, flush=True); await pg.wait_for_timeout(6000)
            check(not r.get('none') and r.get('ships', 0) >= 17, 'havflåtens snøkrabbefartøy (samme modell) er ute', r)
            if not r.get('none'):
                # (the camera's target cam.at moved ahead in your boat's frame, so your own boat is behind the camera, not in front of
                # the vessel: 40 m off her for the near one, and from just ahead of you for the far one at 700 m)
                await pg.evaluate(CAM, [40, 0.12, 0.6, [0, 4, -120]]); await pg.wait_for_timeout(4000); await shots(pg, 'flate_naer')
                await pg.evaluate(NPC, [0.7]); await pg.wait_for_timeout(5000); await pg.evaluate(CAM, [50, 0.06, 0.0, [0, 4, -60]]); await pg.wait_for_timeout(3000); await shots(pg, 'flate_fjern')
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        print('sidefeil:', list(dict.fromkeys(errs))[:5], flush=True)
        await br.close()

asyncio.run(main())
