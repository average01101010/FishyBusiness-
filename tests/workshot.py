"""The work on deck in 3D, station by station (Jonas 20.10.2026, tilbakemelding #75; deckcrew.js, view3d.js drawDeckCrew, drawWorker): the new
sjark hauling line with the skipper and three hands (one hauls and gaffs, one bleeds, two gut, the fish across the deck from the hauler to
the bleeding tub and the table), a net haul (one hauls, one picks), the crew jigging by hand, a hand boat bleeding at the rail, the coastal
boat's crew baiting tubs at sea, and mending a string of nets over the rail. The real catch is fed in as the game does (CATCHQ). Pictures
work_<scene>_<landscape|portrait>_<n>.png in tests/out. Prints OK or FEIL."""
from _env import boot, OUT
import asyncio, os, sys
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''))


SET = """((a) => { const [type, scene, yaw, pitch, dist] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {linehaler:true, garnhaler:true}; S.jobs = []; S.cargo = []; b.gop = null; S.plan = null; S.settings.gut = true; S.settings.ice = true; S.settings.careAuto = false;
  S.pgear = newPGear(); S.sets = []; b.ice = 300; b.fuel = BOAT.fuelCap; b.deckStop = false; S.me = S.cur; S.myJob = null; S.rest = null;
  const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null});
  S.crew = scene === 'skiff' ? [] : [hand(), hand(), hand()].slice(0, scene === 'garn' ? 3 : 3);
  const fish = (kg, gut, iced) => ({sp:'torsk', cls:SPECIES.torsk.ref, kg, n:Math.round(kg / 3), bled:true, iced, hr:Math.floor(S.t / 60), fresh:100, gut, hook:true});
  S.hold = scene === 'egn' || scene === 'mend' ? [] : scene === 'skiff' ? [fish(8, false, false)] : [fish(220, false, false), fish(12, true, false), fish(30, true, true)];
  b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600;
  if (scene === 'line'){ b.rig = 'line'; S.pgear.lines.hyse.n = 4; S.pgear.lines.hyse.baited = 2; b.gop = {op:'haul', kind:'line', n:6, done:2, prog:0.3, sub:0, sl:6, hooksPer:600, a:{x:g.x, y:g.y}, b:{x:g.x + 0.6, y:g.y}, lead:0, kg:0, rel:0, dead:0}; }
  if (scene === 'garn'){ b.rig = 'garn'; S.pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:4, cond:1}]; b.gop = {op:'haul', kind:'garn', n:6, done:2, prog:0.3, sub:0, sl:3, hooksPer:0, a:{x:g.x, y:g.y}, b:{x:g.x + 0.6, y:g.y}, lead:0, kg:0, rel:0, dead:0}; }
  if (scene === 'jig' || scene === 'skiff'){ b.rig = 'juksa'; b.gear = true; S.target = 'torsk'; window.jigActive = false; if (scene === 'skiff') S.equip.jukse = 2; }
  if (scene === 'egn' || scene === 'mend'){ b.status = 'idle'; b.fishUntil = null; b.rig = scene === 'egn' ? 'line' : 'garn'; const pg = S.pgear;
    if (scene === 'egn'){ pg.lines.hyse.n = 5; pg.lines.hyse.baited = 1; baitOf(pg).makrell = 100; window.EGN = egnSelf('hyse', 3); }
    else { pg.nets = [{id:'n1', mesh:180, ty:'bunn', n:6, cond:0.3, max:0.95}]; window.EGN = mendSelf('n1'); } }
  window.CATCHQ = []; clearInterval(window.FEED); if (scene !== 'egn' && scene !== 'mend') window.FEED = setInterval(() => { const Q = window.CATCHQ; if (Q.length < 3) Q.push({sp:Math.random() < 0.75 ? 'torsk' : 'hyse', kg:2 + Math.random() * 4, t:performance.now()}); }, 900);
  CREW3D.reset();
  const c = G3._debug.cam; c.helm = false; c.pitch = pitch; c.yaw = yaw; c.dist = dist; })"""

STATE = """(() => ({st:CREW3D.agents().map(a => a.st + ':' + a.mode + ':' + a.task), roles:CREW3D.agents().map(a => a.role).filter(Boolean), jobs:(S.jobs || []).map(j => j.kind + ' ' + Math.round(jobDone(j) * 100) + '% left ' + (j.until - S.t)),
  done:(S.jobs || []).map(j => jobDone(j)), egn:window.EGN || null, n:G3._debug.dk.n, bled:(G3._debug.SK && G3._debug.SK.anim && G3._debug.SK.anim.nb) || 0}))()"""

# what each scene must show (the agents' stations and the deck events played since the scene began)
def judge(scene, a, b):
    st = [x.split(':')[0] for x in b['st']]; d = {k: b['n'][k] - a['n'][k] for k in b['n']}
    if scene == 'line': return st.count('haling') == 1 and 'blogg' in st and 'sloy' in st and 'is' in st and d['gaff'] > 0 and d['bleed'] > 0, (b['st'], d)
    if scene == 'garn': return 'plukk' in b['roles'] and d['pick'] > 0, (b['roles'], d)
    if scene == 'jig': return st.count('fiske') >= 2 and d['jigup'] > 0, (b['st'], d)
    if scene == 'skiff': return b['bled'] > a['bled'], b['bled']
    if scene == 'egn': return st.count('egn') >= 2 and b['done'] and b['done'][0] > (a['done'][0] if a['done'] else 0), (b['st'], b['jobs'])
    if scene == 'mend': return st.count('mend') >= 2 and b['done'] and b['done'][0] > (a['done'][0] if a['done'] else 0), (b['st'], b['jobs'])
    return True, ''

WAIT = {'line': "(a) => G3._debug.dk.n.gaff > a.n.gaff && G3._debug.dk.n.bleed > a.n.bleed", 'garn': "(a) => G3._debug.dk.n.pick > a.n.pick", 'jig': "(a) => G3._debug.dk.n.jigup > a.n.jigup",
  'skiff': "(a) => ((G3._debug.SK && G3._debug.SK.anim && G3._debug.SK.anim.nb) || 0) > a.bled", 'egn': "() => true", 'mend': "() => true"}
WHAT = {'line': 'linetrekket: én haler og hugger fisken inn, én bløgger, én sløyer og én pakker og iser; fisken går fra haleren til bløggeren',
  'garn': 'garntrekket: én haler og én plukker fisken ut av garnet', 'jig': 'mannskapet jukser for hånd og drar fisken opp over rekka',
  'skiff': 'i den åpne båten bløgger skipperen fisken ved rekka før den går i karet', 'egn': 'flere egner stampene sammen, og jobben går framover',
  'mend': 'flere bøter garnet over rekka, og jobben går framover'}


async def main():
    only = sys.argv[1:]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        scenes = [('sjarkny', 'line', -0.75, 0.75, 7.5), ('sjarkny', 'garn', -0.75, 0.75, 7.5), ('sjarkny', 'jig', -0.75, 0.75, 8), ('skiff', 'skiff', -1.5, 0.35, 5), ('kyst15', 'egn', 0.15, 0.85, 13), ('kyst15', 'mend', 0.4, 0.9, 12)]
        for vw, vh, tag in [(1280, 800, 'landscape'), (800, 1280, 'portrait')]:
            await pg.set_viewport_size({'width': vw, 'height': vh})
            for t, scene, yaw, pitch, dist in scenes:
                if only and scene not in only: continue
                n0 = await pg.evaluate("G3._debug.kitStat.n")
                await pg.evaluate(SET, [t, scene, yaw, pitch, dist * (1.45 if tag == 'portrait' else 1)])
                await pg.wait_for_function("([t, n0]) => { const K = G3._debug.kitStat; return K.vt === t && K.n >= n0 + 4; }", arg=[t, n0], timeout=120000)
                await pg.wait_for_timeout(1500); a = await pg.evaluate(STATE)
                for k in range(3 if tag == 'landscape' else 1):
                    await pg.screenshot(path=os.path.join(OUT, f'work_{scene}_{tag}_{k}.png')); await pg.wait_for_timeout(1300)
                # (SwiftShader draws a frame a second or so: the hand boat's animation goes by frames, so it is given time)
                if tag == 'landscape':
                    # (a small window draws faster in SwiftShader; the hand boat's animation goes by frames)
                    if scene == 'skiff': await pg.set_viewport_size({'width': 480, 'height': 300})
                    try: await pg.wait_for_function(WAIT[scene], arg=a, timeout=240000)
                    except Exception: pass
                    if scene == 'skiff': await pg.set_viewport_size({'width': vw, 'height': vh})
                b = await pg.evaluate(STATE)
                if tag == 'landscape': ok, why = judge(scene, a, b); check(ok, WHAT[scene], why)
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
