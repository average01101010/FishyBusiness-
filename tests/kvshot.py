"""screenshots of the coast guard's ships in the game (steg 100, tools/boats/kv.py; for Jonas, not in run.py): the 47 m ship alongside a boat at
the quay (rafted on her port side; the quay is to her starboard), and the 93 m ship lying off the port side of the snow crab vessel at sea
with her RIB alongside the vessel while the inspectors are aboard, and on its way over; in daylight, in both formats. First it asks the game
whether it has the models (glbHas, the parts, the anchors) and what the NPC list says of her (vtype, length and beam), and checks that the
ship's hull and the boat's never meet (her centre's distance across against the two half-beams).
The simulation is held while the pictures are taken (step() stubbed, as tests/h3dshot.py FREEZE): the visit would end, and the RIB move.
    python3 tests/kvshot.py                 (both formats; one: python3 tests/kvshot.py liggende)
SwiftShader takes about two minutes a picture in 1280x800: run it alone, never beside another 3D test or a Blender render."""
import asyncio, os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from _env import boot, HERE
ROOT = os.path.dirname(HERE)
from playwright.async_api import async_playwright
OUT = os.path.join(ROOT, 'tests', 'out')
def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''), flush=True)

FREEZE = """(on) => { if (on && !window.__step0){ window.__step0 = step; step = () => {}; } else if (!on && window.__step0){ step = window.__step0; window.__step0 = null; } }"""
ASK = """((t) => { const g = glbLoad(t), A = g && g.ex.anchors || {};
  return {glbHas:glbHas(t), parts:g ? Object.keys(g.parts) : [], name:g && g.ex.name, len:g && g.ex.len, beam:g && g.ex.beam, inVessels:t in VESSELS,
    lights:(A.lights || []).map(l => l[2]), rib:!!A.rib, kv:!!A.kv}; })"""
# the quay: the boat alongside in her harbour, the coast guard's visit begun now and held
KAI = """async ([t, hour]) => { const b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 5, 12, hour) - EPOCH) / 6e4);
  S.lic = null; if (b.type !== t){ b.type = t; applyVessel(); G3.vesselChanged(); }
  if (b.status !== 'port'){ const pt = PORTS.find(q => q.id === (b.port || S.home)) || PORTS[0]; b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; }
  b.berth = 'main'; S.plan = null; S.crew = []; const K = kvState(); K.visit = {t0:S.t, hav:null}; const q = kvPose(b); K.visit.p = q.p; K.visit.hd = q.hd; K.visit.v = 0;
  if (hooks.onNpcChange) hooks.onNpcChange();
  const n = npcStates(S.t / 60).find(n => n.kv), bp = berthPose(b.port, b.type, 'main'), V = VESSELS[t];
  const across = bp ? ((n.p.x - bp.x) * Math.cos(bp.hd) + (n.p.y - bp.y) * Math.sin(bp.hd)) * 1000 : null;
  return {port:(PORTS.find(q => q.id === b.port) || {}).name, n:n && {vtype:n.vtype, L:n.L, B:n.B, rib:n.rib}, across, clear:across == null ? null : -across - V.beam / 2 - n.B / 2}; }"""
# at sea west of Senja: the snow crab vessel working, the 93 m ship's visit min minutes in (30: the RIB alongside; 5: on its way)
HAV = """async ([hour, min]) => { const b = S.boat; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, hour) - EPOCH) / 6e4);
  if (b.type !== 'snokrabbe'){ b.type = 'snokrabbe'; applyVessel(); G3.vesselChanged(); }
  S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'}; S.crew = []; S.plan = null; b.gop = null; S.sets = [];
  const p = P(69.62, 16.35); if (typeof mapNeed === 'function') await mapNeed(p, 8); b.status = 'idle'; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; b.heading = 0.6;
  const K = kvState(); K.visit = {t0:S.t - min, hav:true}; const q = kvPose(b); K.visit.p = q.p; K.visit.hd = q.hd; K.visit.v = 0;
  if (hooks.onNpcChange) hooks.onNpcChange();
  const n = npcStates(S.t / 60).find(n => n.kv), d = Math.hypot(n.p.x - b.pos.x, n.p.y - b.pos.y) * 1000;
  return {n:n && {vtype:n.vtype, L:n.L, B:n.B, rib:n.rib}, d, clear:d - VESSELS.snokrabbe.beam / 2 - n.B / 2, rib:kvRib(min), land:isLand(p)}; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        FMT = {'liggende': (1280, 800), 'staaende': (800, 1280)}
        shot = lambda nm, f: os.path.join(OUT, 'kv_' + nm + '_' + f + '.png')
        for f in (sys.argv[1:] or list(FMT)):
            w, h = FMT[f]; print(f, 'start', flush=True)
            pg = await br.new_page(viewport={'width': w, 'height': h}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.set_default_timeout(400000)
            await boot(pg); await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(3000)
            if f == 'liggende':
                for t in ('kv47', 'kv90'):
                    a = await pg.evaluate(ASK, t); print('model', t, json.dumps(a, ensure_ascii=False), flush=True)
                    check(a['glbHas'] and 'lod0' in a['parts'] and 'lod1' in a['parts'] and not a['inVessels'] and a['kv'], t + ': modellen er i siden, med nær- og fjernversjon, og ikke en type i VESSELS (kan ikke kjøpes)', a)
                    want = ['masthead', 'port', 'stbd', 'stern'] + (['masthead2'] if t == 'kv90' else [])
                    check(all(k in a['lights'] for k in want) and (t != 'kv90' or ('rib' in a['parts'] and a['rib'])), t + ': lanternene etter vedlegg I' + (' og lettbåten som egen del' if t == 'kv90' else ''), a['lights'])
            # (the camera's yaw: positive to the boat's port quarter, negative to her starboard; G3._debug.cam)
            # the quay: the 47 m ship rafted on the boat's port side
            r = await pg.evaluate(KAI, ['sjark', 11]); print('kai', json.dumps(r, ensure_ascii=False), flush=True); await pg.evaluate(FREEZE, True)
            check(r['n'] and r['n']['vtype'] == 'kv47' and r['n']['L'] == 47.2 and not r['n']['rib'], 'ved kai: det lille skipet, uten lettbåt', r['n'])
            check(r['across'] is not None and r['across'] < 0 and r['clear'] >= 1.0, 'ved kai: om babord (kaia er om styrbord) og aldri i båten', [r['across'], r['clear']])
            await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 62; c.pitch = 0.32; c.yaw = 0.55; })()"); await pg.wait_for_timeout(9000)
            await pg.screenshot(path=shot('kai', f), timeout=400000)
            await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 44; c.pitch = 0.22; c.yaw = 2.3; })()"); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=shot('kai-nar', f), timeout=400000)
            await pg.evaluate(FREEZE, False)
            # at sea: the 93 m ship off the snow crab vessel's port side, the RIB alongside the vessel (30 minutes in), then on its way (5)
            r = await pg.evaluate(HAV, [11, 30]); print('hav', json.dumps(r, ensure_ascii=False), flush=True); await pg.evaluate(FREEZE, True)
            check(r['n'] and r['n']['vtype'] == 'kv90' and r['n']['rib'] and r['rib']['ph'] == 'side', 'til havs: det store skipet, lettbåten langs fartøyet', [r['n'], r['rib']])
            check(r['clear'] >= 30 and 150 <= r['d'] <= 260, 'til havs: av babord, %d m mellom sentrene, aldri i fartøyet' % round(r['d']), [r['d'], r['clear']])
            await pg.evaluate("(() => { const c = G3._debug.cam; c.helm = false; c.dist = 170; c.pitch = 0.42; c.yaw = -0.35; })()"); await pg.wait_for_timeout(12000)
            await pg.screenshot(path=shot('hav', f), timeout=400000)
            await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 48; c.pitch = 0.30; c.yaw = 0.95; })()"); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=shot('hav-rib', f), timeout=400000)
            await pg.evaluate(FREEZE, False)
            r = await pg.evaluate(HAV, [11, 5]); await pg.evaluate(FREEZE, True)
            check(r['rib']['ph'] == 'ut', 'lettbåten på vei over etter fem minutter', r['rib'])
            await pg.evaluate("(() => { const c = G3._debug.cam; c.dist = 170; c.pitch = 0.42; c.yaw = -0.35; })()"); await pg.wait_for_timeout(9000)
            await pg.screenshot(path=shot('hav-ut', f), timeout=400000)
            await pg.evaluate(FREEZE, False)
            print(f, 'sidefeil', errs[:3], flush=True)
            await pg.close()
        await br.close()
asyncio.run(main())
