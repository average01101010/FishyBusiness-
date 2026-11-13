"""The sea legs (FB4, steg 120, 13.11.2026; deckcrew.js seaLegs and SJOBEIN, view3d/08-plants.js drawWorker, view3d/20-trawl-seine.js
drawDeckCrew): the people on deck stand on the deck as it heels. The checks hold the crew's deck at a known roll and pitch
(SJOBEIN.test, the crew's frame turned that much more than the boat's) and read what drawWorker drew (SJOBEIN.log): each sole within
1 cm of the deck under it, the knee on the high side more bent, the hips to the high side, the torso between plumb and the deck's
normal, the hands of the work where they were without the sea legs, the hand to the rail and the bracing step.

  python3 tests/sjobein.py                 the checks (prints OK or FEIL)
  python3 tests/sjobein.py bilder etter    the pictures only: three boats (small, middle, large by VESSELS' fields) at work and at a
                                           break in three seas, both formats, to docs/okter/2026-11-13-120/<tag>_*.jpg
  python3 tests/sjobein.py par             close in on the smallest boat in a near gale, the sea legs off and then on (naer_*.jpg)
  KYST_SJOBEIN=0 ...                       with #sjobein0 (everything off: the «before»)
"""
from _env import boot, GAME, OUT
import asyncio, json, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'okter', '2026-11-13-120')
OFF = os.environ.get('KYST_SJOBEIN') == '0'
URL = GAME + (',sjobein0' if OFF else '')


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''), flush=True)


# three boats with a hold and people on deck, by their fields: the shortest, the middle one and the longest of the coast's boats
BOATS = "Object.keys(VESSELS).filter(t => VESSELS[t].cls !== 'hav' && VESSELS[t].hold.kind === 'rom').sort((a, b) => VESSELS[a].len - VESSELS[b].len).filter((t, i, A) => i === 0 || i === (A.length >> 1) || i === A.length - 1)"

# the boat on a ground with three hands: hauling line (one hauls, one bleeds, one guts, one packs) or lying idle (the breaks)
SET = """((a) => { const [type, scene, wind, yaw, pitch, dist] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  WX_FORCE = {w:wind, d:250};
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {linehaler:true, garnhaler:true}; S.jobs = []; S.cargo = []; b.gop = null; S.plan = null; S.settings.gut = true; S.settings.ice = true; S.settings.careAuto = false;
  S.pgear = newPGear(); S.sets = []; b.ice = 300; b.fuel = BOAT.fuelCap; b.deckStop = false; S.me = S.cur; S.myJob = null; S.rest = null;
  const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null});
  S.crew = [hand(), hand(), hand()];
  const fish = (kg, gut, iced) => ({sp:'torsk', cls:SPECIES.torsk.ref, kg, n:Math.round(kg / 3), bled:true, iced, hr:Math.floor(S.t / 60), fresh:100, gut, hook:true});
  S.hold = scene === 'pause' ? [] : [fish(220, false, false), fish(12, true, false), fish(30, true, true)];
  b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0;
  if (scene === 'pause'){ b.status = 'idle'; b.fishUntil = null; b.rig = 'line'; }
  else { b.status = 'fishing'; b.fishUntil = S.t + 600; b.rig = 'line'; S.pgear.lines.hyse.n = 4; S.pgear.lines.hyse.baited = 2; b.gop = {op:'haul', kind:'line', n:6, done:2, prog:0.3, sub:0, sl:6, hooksPer:600, a:{x:g.x, y:g.y}, b:{x:g.x + 0.6, y:g.y}, lead:0, kg:0, rel:0, dead:0}; }
  window.CATCHQ = []; clearInterval(window.FEED); if (scene !== 'pause') window.FEED = setInterval(() => { const Q = window.CATCHQ; if (Q.length < 3) Q.push({sp:Math.random() < 0.75 ? 'torsk' : 'hyse', kg:2 + Math.random() * 4, t:performance.now()}); }, 900);
  CREW3D.reset();
  const c = G3._debug.cam; c.helm = false; c.pitch = pitch; c.yaw = yaw; c.dist = dist; })"""

SEAS = [('stille', 1), ('bris', 9), ('kuling', 15)]   # m/s: light air, a fresh breeze (8–10.7), a near gale (13.9–17.1)


async def frames(pg, t, n=4, timeout=180000):
    n0 = await pg.evaluate("G3._debug.kitStat.n")
    await pg.wait_for_function("([t, n0, n]) => { const K = G3._debug.kitStat; return K.vt === t && K.n >= n0 + n; }", arg=[t, n0, n], timeout=timeout)


async def shots(pg, tag):
    os.makedirs(SHOTS, exist_ok=True)
    boats = await pg.evaluate(BOATS); print('båter:', boats, flush=True)
    for vw, vh, fmt in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
        await pg.set_viewport_size({'width': vw, 'height': vh})
        for t in boats:
            L = await pg.evaluate("(t) => VESSELS[t].len", t)
            for scene in ['arbeid', 'pause'] if fmt == 'liggende' else ['arbeid']:   # (the breaks in landscape only: 27 pictures, a minute and a half each)
                for sea, wind in SEAS:
                    path = os.path.join(SHOTS, f'{tag}_{t}_{scene}_{sea}_{fmt}.jpg')
                    if os.path.exists(path): continue   # (a run that was stopped goes on where it was)
                    await pg.evaluate(SET, [t, scene, wind, -0.75, 0.6, (3.2 + L * 0.42) * (1.45 if fmt == 'staaende' else 1)])
                    await frames(pg, t, 3); await pg.wait_for_timeout(2500)
                    info = await pg.evaluate("(() => { const v = G3._debug.bv; return {hs:+hsAt(S.boat.pos, Math.floor(S.t / 60)).toFixed(2), roll:+(v.roll * 180 / Math.PI).toFixed(1), pitch:+(v.pitch * 180 / Math.PI).toFixed(1), st:CREW3D.agents().map(a => a.mode + ':' + a.task)}; })()")
                    await pg.screenshot(path=path, type='jpeg', quality=60)
                    print(tag, t, scene, sea, fmt, json.dumps(info), flush=True)


# ---- the checks ----
DEG = 3.14159265358979 / 180


def dot(a, b): return sum(x * y for x, y in zip(a, b))


def own(g, p):
    """A world point in the person's own frame: [ahead, up, right] from where he stands."""
    import math
    d = [p[0] - g['x'], p[1] - g['y'], p[2] - g['z']]; h = g['h']
    return [d[0] * math.sin(h) - d[2] * math.cos(h), d[1], d[0] * math.cos(h) + d[2] * math.sin(h)]


def sole(g, i):
    """How far a sole is from the deck's plane (through the point he stands on, the deck's normal)."""
    f = g['feet'][i]; return abs(dot([f[0] - g['x'], f[1] - g['y'], f[2] - g['z']], g['n']))


async def drawn(pg, t, test, on=True, n=2):
    """What drawWorker drew for the people on deck with the crew's deck held as test says and the sea legs on or off: the last frame."""
    on = on and not OFF   # (KYST_SJOBEIN=0: the whole run with them off, the «before»)
    await pg.evaluate("([test, on]) => { SJOBEIN.test = test; SJOBEIN.on = on; for (const a of CREW3D.agents()) a.sl = null; SJOBEIN.log = null; }", [test, on])
    await frames(pg, t, n)
    await pg.evaluate("SJOBEIN.log = []"); await frames(pg, t, 1)
    L = await pg.evaluate("(() => { const L = SJOBEIN.log; SJOBEIN.log = null; return L; })()")
    last = {}
    for g in L: last[g['idx']] = g
    return [g for g in last.values() if g['n'] and not g.get('npc')]


SIM = """(([secs, x, z]) => { const D = G3._debug, bv = D.bv, dt = 1 / 60, st = [seaState(), seaState()], rec = {roll:[], pitch:[], y:[], hip:[], lean:[], hipR:[]}, c = Math.cos, s = Math.sin;
  let t = performance.now() / 1000;
  for (let i = 0; i < secs * 60; i++){ t += dt; D.stepBoat(dt, t, 0);
    // (the deck point [x, deck, z] in the world, and the deck's normal, as view3d/00-head.js model() turns her; no yaw)
    const cp = c(bv.pitch), sp = s(bv.pitch), cr = c(bv.roll), sr = s(bv.roll), n = [-sr, cp * cr, sp * cr], y = bv.y + cp * sr * x - sp * z;
    for (const k of [0, 1]){ const h = k * Math.PI / 2, o = seaLegs(st[k], {sr:-(n[0] * c(h) + n[2] * s(h)) / n[1], sf:-(n[0] * s(h) - n[2] * c(h)) / n[1], y, hs:CREW3D._st.sea ? CREW3D._st.sea.hs : 0, dt:i ? dt : undefined});
      if (k === 0){ rec.roll.push(bv.roll); rec.pitch.push(bv.pitch); rec.y.push(y); rec.hip.push(y + o.hipY); rec.lean.push(o.leanR); rec.hipR.push(o.hipR); } } }
  const acc = A => { let q = 0; for (let i = 1; i + 1 < A.length; i++){ const a = (A[i + 1] - 2 * A[i] + A[i - 1]) / (dt * dt); q += a * a; } return Math.sqrt(q / (A.length - 2)); }, step = A => { let m = 0; for (let i = 1; i < A.length; i++) m = Math.max(m, Math.abs(A[i] - A[i - 1])); return m; };
  const tilt = rec.roll.map((r, i) => Math.atan(Math.hypot(Math.tan(r), Math.tan(rec.pitch[i])))), over = v => tilt.filter(a => a > v).length / tilt.length;
  return {hs:CREW3D._st.sea ? CREW3D._st.sea.hs : null, rollMax:Math.max(...rec.roll.map(Math.abs)) * 180 / Math.PI, pitchMax:Math.max(...rec.pitch.map(Math.abs)) * 180 / Math.PI, heave:(Math.max(...rec.y) - Math.min(...rec.y)) / 2,
    accDeck:acc(rec.y), accHip:acc(rec.hip), stepLean:step(rec.lean) * 180 / Math.PI, stepHipR:step(rec.hipR) * 1000, stepHipY:step(rec.hip.map((h, i) => h - rec.y[i])) * 1000, overGrab:over(SJOBEIN.GRAB), overStep:over(SJOBEIN.STEP)}; })"""


async def checks(pg):
    import math
    boats = await pg.evaluate(BOATS); t = boats[1]; print('båter:', boats, 'sjekkene på', t, flush=True)
    await pg.set_viewport_size({'width': 640, 'height': 400})   # (a small window: SwiftShader draws it faster, and the checks read numbers)
    cam = [-0.75, 0.6, 9]
    await pg.evaluate(SET, [t, 'arbeid', 1] + cam); await frames(pg, t, 3)
    await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
    await pg.evaluate("clearInterval(window.FEED); window.CATCHQ = []")
    # 1. the feet on the deck
    worst = {}; nfig = 0
    for roll, pitch in [(0, 0), (8, 0), (15, 0), (-8, 0), (-15, 0), (0, 5), (8, 5), (-15, -5)]:
        L = await drawn(pg, t, {'roll': roll * DEG, 'pitch': pitch * DEG, 'T': 100.3})
        st = [g for g in L if not g['walk']]; nfig = max(nfig, len(st))
        worst[(roll, pitch)] = max([sole(g, i) for g in st for i in (0, 1)] or [9])
    w = max(worst.values())
    check(w < 0.01 and nfig >= 3, 'hver fot er innen 1 cm av dekket ved 0, 8 og 15° rulling og 0 og 5° stamping (%d figurer, verst %.1f mm)' % (nfig, w * 1000), {('%d/%d' % k): round(v * 1000, 1) for k, v in worst.items()})
    # (and against the model itself, not the plane the sea legs reckoned with: the deck is flat in her frame, so the deck under each
    # foot is the model's own surface there; CREW3D.seaFeet)
    ft = []
    for roll, pitch in [(0, 0), (8, 0), (15, 0), (-15, -5)]:
        await drawn(pg, t, {'roll': roll * DEG, 'pitch': pitch * DEG, 'T': 100.3})
        ft += [f for f in (await pg.evaluate("CREW3D.seaFeet()") or []) if not f['lift']]
    miss = [f for f in ft if f['dy'] is None]; off2 = max([abs(f['dy']) for f in ft if f['dy'] is not None] or [9])
    check(len(ft) >= 8 and not miss and off2 < 0.01, 'og hver fot står på modellens eget dekk, ikke bare på planet (%d føtter, verst %.1f mm)' % (len(ft), off2 * 1000), {'uten dekk under': len(miss), 'verst': round(off2 * 1000, 1)})
    # (and the drawn body answers the same numbers: the head over the hips is 0.68 m along the way the torso leans, leanR/leanF from
    # the hips' own line, which is what the clip guard reckons with; so the guard's geometry is the one that is drawn)
    bad = []; base = {}; nb = 0
    for roll, pitch in [(0, 0), (15, 0), (-15, 0), (0, 5), (12, -4)]:
        for g in await drawn(pg, t, {'roll': roll * DEG, 'pitch': pitch * DEG, 'T': 100.3, 'task': 'look', 'hs': 0}):
            e = g['se']
            if not e or g['walk']: continue
            hc = [(g['hips'][0][k] + g['hips'][1][k]) / 2 for k in (0, 1, 2)]; v = [g['head'][k] - hc[k] for k in (0, 1, 2)]
            F = [math.sin(g['h']), 0, -math.cos(g['h'])]; R = [math.cos(g['h']), 0, math.sin(g['h'])]; got = [dot(v, F), v[1], dot(v, R)]
            if roll == 0 and pitch == 0: base[g['idx']] = got; continue
            v0 = base.get(g['idx'])
            if not v0: continue
            # (the head over the hips on a level deck, turned by the lean about the hips: towards [dF, dR] by th)
            th = math.hypot(e['leanR'], e['leanF']); dR = e['leanR'] / th if th > 1e-9 else 0; dF = e['leanF'] / th if th > 1e-9 else 0
            a = v0[0] * dF + v0[2] * dR; pp = -v0[0] * dR + v0[2] * dF; a2 = a * math.cos(th) + v0[1] * math.sin(th); u2 = -a * math.sin(th) + v0[1] * math.cos(th)
            want = [a2 * dF - pp * dR, u2, a2 * dR + pp * dF]; d = math.dist(want, got); nb += 1
            if d > 0.01: bad.append({'roll': roll, 'pitch': pitch, 'avvik_mm': round(d * 1000, 1), 'lean': round(math.degrees(th), 1)})
    check(nb >= 8 and not bad, 'den tegnede kroppen svarer til tallene vakten regner med: hodet over hofta er dreid med leningen, innen 1 cm (%d stillinger ved ±15° og stamping)' % nb, bad[:3])
    L0 = await drawn(pg, t, {'roll': 8 * DEG, 'pitch': 0, 'T': 100.3}, on=False)
    w0 = max([sole(g, i) for g in L0 if not g['walk'] for i in (0, 1)] or [0])
    check(w0 > 0.012, 'med sjøbeina av (som før) står føttene %.1f mm feil ved 8° rulling' % (w0 * 1000))

    # 3. the hands of the work where they were (the same frame time, the sea legs on and off), at 8° of roll; the net haul for «pick»
    seen = {}
    async def hands(bt, scene, want):
        if scene == 'garn':
            await pg.evaluate("""(() => { const b = S.boat, g = GROUNDS[0].p; b.rig = 'garn'; S.pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:4, cond:1}]; b.gop = {op:'haul', kind:'garn', n:6, done:2, prog:0.3, sub:0, sl:3, hooksPer:0, a:{x:g.x, y:g.y}, b:{x:g.x + 0.6, y:g.y}, lead:0, kg:0, rel:0, dead:0}; CREW3D.reset(); })()""")
            await frames(pg, bt, 3)
        # (the same frame time with the sea legs on and off; the stations change and the fish come, so a few goes at it)
        for go in range(6):
            if all(k in seen for k in want): break
            try: await pg.wait_for_function("(w) => CREW3D.agents().some(a => a.mode === 'at' && w.includes(a.task === 'gut' ? 'gutw' : a.task))", arg=[k for k in want if k not in seen], timeout=90000)
            except Exception: pass
            sign = 1 if go % 2 == 0 else -1
            A = await drawn(pg, bt, {'roll': sign * 8 * DEG, 'pitch': 0, 'T': 100.3}); B = await drawn(pg, bt, {'roll': sign * 8 * DEG, 'pitch': 0, 'T': 100.3}, on=False)
            bi = {g['idx']: g for g in B}
            for g in A:
                o = bi.get(g['idx'])
                if not o or g['walk'] or g['ev'] or o['ev'] or g['task'] != o['task'] or g['task'] not in want: continue
                seen[g['task']] = max(seen.get(g['task'], 0), max(math.dist(own(g, g['hands'][i]), own(o, o['hands'][i])) for i in (0, 1)))
    await hands(t, 'line', ('haul', 'gutw', 'pack')); await hands(t, 'garn', ('pick',))
    for bt in boats:   # (a station not manned on this boat in the time given: the other boats)
        if all(k in seen for k in ('haul', 'gutw', 'pack')) or bt == t: continue
        await pg.evaluate(SET, [bt, 'arbeid', 1] + cam); await frames(pg, bt, 3); await pg.evaluate("clearInterval(window.FEED); window.CATCHQ = []"); await hands(bt, 'line', ('haul', 'gutw', 'pack'))
    await pg.evaluate(SET, [t, 'arbeid', 1] + cam); await frames(pg, t, 3)
    for k in ('haul', 'gutw', 'pick', 'pack'):
        check(k in seen and seen[k] < 0.01, 'hendene i «%s» er innen 1 cm av der de var uten sjøbeina, ved 8° rulling' % k, ('%.1f mm' % (seen[k] * 1000)) if k in seen else 'ikke sett')

    # 2. the body answers the sea: everyone in one plain pose at the places of the breaks, at 8° either way
    await pg.evaluate(SET, [t, 'pause', 1] + cam); await frames(pg, t, 3)
    await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 2", timeout=240000)
    rows = []; free = 0; okb = True
    for sign in (1, -1):
        L = await drawn(pg, t, {'roll': sign * 8 * DEG, 'pitch': 0, 'T': 100.3, 'task': 'look'})
        rm = await pg.evaluate("CREW3D.seaClip()")
        for g in L:
            e = g['se']
            if not e or g['walk']: continue
            # (the slope along the way it is steepest for him; with all the room that way he stands upright with the sea legs)
            side = abs(e['sr']) >= abs(e['sf']); sl = e['sr'] if side else e['sf']; hip = e['hipR'] if side else e['hipF']; lean = e['leanR'] if side else e['leanF']; nrm = -math.atan(sl)
            hi = 1 if e['sr'] > 0 else 0; kn = g['kf'][hi] - g['kf'][1 - hi]
            up = hip * sl > 0 and lean * nrm > 0 and abs(lean) < abs(nrm)
            row = {'task': g['task'], 'helning': round(math.degrees(math.atan(sl)), 1), 'langs': 'tvers' if side else 'langs', 'hofte_cm': round(hip * 100, 1), 'overkropp': round(math.degrees(lean), 1), 'normal': round(math.degrees(nrm), 1), 'kne_hoy_minus_lav_cm': round(kn * 100, 1), 'oppreist': up}
            rows.append(row)
            if up and abs(sl) > 0.1:
                free += 1
                if side and not kn > 0.01: okb = False
            # (never past the deck's normal the other way, with or without room)
            if lean * nrm < -1e-6 or abs(lean) > abs(nrm) + 1e-6: okb = False
    for r in rows: print('OK   stillingen ved 8°:' if r['oppreist'] or r['hofte_cm'] == 0 else 'FEIL stillingen ved 8°:', json.dumps(r, ensure_ascii=False), flush=True)
    check(okb and free >= 2, 'ved 8° rulling: hofta mot den høye siden, kneet der mer bøyd, overkroppen mellom loddrett og dekkets normal (%d av %d stillinger har rom til å stå oppreist; resten står vinkelrett på dekket inntil det de står ved)' % (free, len(rows)))

    # 4. the rail and the bracing step: at 10° a free hand is on the rail's top, at 13° a foot is out, at 2° both are back
    L = await drawn(pg, t, {'roll': 10 * DEG, 'pitch': 0, 'T': 100.3, 'task': 'look'}, n=3)
    rails = await pg.evaluate("CREW3D.agents().filter(a => a.mode === 'at').map(a => ({id:a.id, rail:CREW3D.seaRail(a)}))")
    rl = {r['id']: r['rail'] for r in rails}; grabs = []
    for g in L:
        e = g['se']
        if not e or e['grab'] < 0.99 or not rl.get(g['id']): continue
        r = rl[g['id']]; i = e['gh']; rr = r[1] or (-0.2 if i else 0.2); want = [r[0], r[2] + 0.04 + r[0] * e['sf'] + rr * e['sr'], rr]
        grabs.append(math.dist(own(g, g['hands'][i]), want))
    check(grabs and max(grabs) < 0.05, 'ved 10° rulling tar den som står ledig, rekka med én hånd, og hånda ligger på rekkas topp (%d hender, lengst unna %.1f cm)' % (len(grabs), (max(grabs) if grabs else 0) * 100), {'med rekke innen rekkevidde': sum(1 for v in rl.values() if v)})
    check(all(g['se']['step'] == 0 for g in L if g['se']), 'ved 10° tas ikke støttesteget')
    L = await drawn(pg, t, {'roll': 13 * DEG, 'pitch': 0, 'T': 100.3, 'task': 'look'}, n=3)
    stp = [g for g in L if g['se'] and g['se']['step'] > 0.99]
    check(len(stp) >= 1 and all(sole(g, i) < 0.01 for g in stp for i in (0, 1)), 'ved 13° rulling setter han en fot ut til støtte, og den står på dekket (%d av %d)' % (len(stp), len(L)), [round(abs(g['se']['fr'][g['se']['stFoot']]) * 100) for g in stp])
    await pg.evaluate("SJOBEIN.test = {roll:2 * Math.PI / 180, pitch:0, T:100.3, task:'look'}"); await frames(pg, t, 3); await pg.wait_for_timeout(4000); await frames(pg, t, 3)
    await pg.evaluate("SJOBEIN.log = []"); await frames(pg, t, 1); L = await pg.evaluate("(() => { const L = SJOBEIN.log; SJOBEIN.log = null; return L; })()")
    check(L and all(g['se']['grab'] == 0 and g['se']['step'] == 0 for g in L if g['se']), 'når hun har lagt seg (2°), slipper han rekka og tar foten inn')
    # (the gait is as it was: slower over 0.14 rad, stopped over 0.21; deckcrew.js tick, untouched)
    src = open(os.path.join(ROOT, 'src', 'js', 'deckcrew.js'), encoding='utf-8').read()
    check('spd = WALK * (roll > 0.21 ? 0 : roll > 0.14 ? 0.65 : 1)' in src, 'gangen er som før: saktere over 0,14 rad og stopp over 0,21')

    # 3b. no limb through anything with the sea legs at their furthest (±15°): the people at their places now, and every break at every rail place
    clip = await pg.evaluate("CREW3D.seaClip()"); scan = await pg.evaluate("CREW3D.seaScan()")
    check(clip is not None and all(c['n'] == 0 for c in clip), 'ingen på plassen sin går gjennom noe i ytterstillingene for sjøbeina (±15°)', [c for c in (clip or []) if c['n']])
    check(scan and all(v[0] == v[1] for v in scan.values()), 'ingen pause på noen rekkeplass går gjennom noe i ytterstillingene (±15°)', scan)

    # 2b. wider in a sea: the stance with the deck level, the sea's height held at 0 and at 2 m (SJOBEIN.test.hs; the sea's own height
    # comes from the view each frame, checked in 2c)
    La = await drawn(pg, t, {'roll': 0, 'pitch': 0, 'T': 100.3, 'task': 'look', 'hs': 0}, n=3); Lb = await drawn(pg, t, {'roll': 0, 'pitch': 0, 'T': 100.3, 'task': 'look', 'hs': 2}, n=3)
    wid = lambda L: max([abs(own(g, g['feet'][1])[2] - own(g, g['feet'][0])[2]) for g in L if g['se'] and not g['walk']] or [0])
    wa, wb = wid(La), wid(Lb)
    check(abs(wa - 0.24) < 0.005 and wb > wa + 0.05, 'føttene står bredere i sjø: %.1f cm ved Hs 2 m mot %.1f cm i stille sjø' % (wb * 100, wa * 100))

    # 2c. the boat's own motion in a near gale, a minute of it at 60 steps a second: the hips' acceleration against the deck's, how
    # smooth the lean and the hips are from step to step (no shiver), and how much of the time she is over the limits
    await pg.evaluate("SJOBEIN.test = null")
    for bt in boats:
        await pg.evaluate(SET, [bt, 'pause', 15] + cam); await frames(pg, bt, 3)
        try: await pg.wait_for_function("CREW3D._st.sea && CREW3D._st.sea.hs > 2", timeout=240000)
        except Exception: pass
        r = await pg.evaluate(SIM, [60, 1.0, 1.0])
        print('    %s i kuling: Hs %.1f m, rulling opptil %.1f°, stamping %.1f°, hiv ±%.2f m; over rekkegrensen %.0f %% av tida, over støttesteget %.0f %%' % (bt, r['hs'], r['rollMax'], r['pitchMax'], r['heave'], r['overGrab'] * 100, r['overStep'] * 100), flush=True)
        check(r['accHip'] < r['accDeck'], '%s: hofta akselererer mindre opp og ned enn dekket (%.2f mot %.2f m/s², %.0f %%)' % (bt, r['accHip'], r['accDeck'], 100 * r['accHip'] / max(1e-9, r['accDeck'])))
        check(r['hs'] > 2 and r['stepLean'] < 0.25 and r['stepHipR'] < 6 and r['stepHipY'] < 4, '%s: ingen dirring: fra ett bilde til neste (1/60 s) endrer leningen seg høyst %.2f°, hofta %.1f mm til siden og %.1f mm opp og ned' % (bt, r['stepLean'], r['stepHipR'], r['stepHipY']))

    # 6. the people on another boat close by have them too: your boat put 35 m from one that is fishing, her people's soles on her deck
    await pg.evaluate("WX_FORCE = {w:6, d:250}")   # (in a gale the others are in port)
    cands = await pg.evaluate("npcStates(S.t / 60).filter(n => n.p && n.st !== 'port' && VESSELS[n.type] && !VESSELS[n.type].hand).sort((a, b) => (b.st === 'fishing') - (a.st === 'fishing')).slice(0, 4).map(n => ({id:n.id, type:n.type, st:n.st, L:n.L || 0}))")
    npc = []; near = None
    for c in cands:
        near = c
        ok = await pg.evaluate("""(c) => { const n = npcStates(S.t / 60).find(q => q.id === c.id && (q.L || 0) === c.L); if (!n) return false; const b = S.boat;
          b.status = 'idle'; b.gop = null; b.pos = {x:n.p.x + 0.03, y:n.p.y}; b.v = 0; G3._debug.bv.init = false; const cm = G3._debug.cam; cm.yaw = 1.57; cm.pitch = 0.3; cm.dist = 30; return true; }""", c)
        if not ok: continue
        await frames(pg, t, 5)
        for k in range(5):
            # (she moves: your boat is put beside her again each time)
            await pg.evaluate("(c) => { const n = npcStates(S.t / 60).find(q => q.id === c.id && (q.L || 0) === c.L); if (n){ S.boat.pos = {x:n.p.x + 0.03, y:n.p.y}; } SJOBEIN.log = []; }", c); await frames(pg, t, 1); L = await pg.evaluate("(() => { const L = SJOBEIN.log; SJOBEIN.log = null; return L; })()")
            npc += [g for g in L if g.get('npc') and g['n'] and not g['walk'] and g['on']]
        if npc: break
    wn = max([sole(g, i) for g in npc for i in (0, 1)] or [9]); tl = max([math.degrees(math.acos(min(1, g['n'][1]))) for g in npc] or [0])
    check(near is not None and npc and wn < 0.01, 'folkene på en annen båt tett ved står på dekket sitt (%d stillinger, verst %.1f mm, dekket opptil %.1f° skrått)' % (len(npc), wn * 1000, tl), near)

    # 5. the switch, and the time drawDeckCrew takes a figure with the sea legs off and on (the same frames' work but for them)
    await pg.evaluate(SET, [t, 'arbeid', 9] + cam); await frames(pg, t, 3)
    tm = {}
    for rnd in range(3):
        for on in (False, True):
            await pg.evaluate("(on) => { SJOBEIN.on = on; SJOBEIN.test = {prof:{ms:0, n:0, f:0}}; }", on); await frames(pg, t, 8)
            pr = await pg.evaluate("SJOBEIN.test.prof"); tm.setdefault(on, []).append(pr['ms'] / max(1, pr['n']))
    await pg.evaluate("SJOBEIN.test = null; SJOBEIN.on = true")
    med = lambda A: sorted(A)[len(A) // 2]
    print('    drawDeckCrew per figur (JS, median av 3 × 8 bilder): av %.3f ms, på %.3f ms' % (med(tm[False]), med(tm[True])), tm, flush=True)
    check(med(tm[True]) < med(tm[False]) + 0.15, 'sjøbeina koster under 0,15 ms per figur i drawDeckCrew (%.3f mot %.3f ms)' % (med(tm[True]), med(tm[False])))
    off = await pg.evaluate("/sjobein0/.test(location.hash)")
    check(off == OFF and (await pg.evaluate("typeof SJOBEIN.LEAN === 'number' && typeof SJOBEIN.GRAB === 'number'")), '«#sjobein0» i adressen slår sjøbeina av, og tallene står ett sted (SJOBEIN i deckcrew.js)')


async def pairs(pg):
    """Close in on the deck of the smallest boat at work in a near gale: the same scene with the sea legs off and then on, both formats."""
    os.makedirs(SHOTS, exist_ok=True)
    t = (await pg.evaluate(BOATS))[0]
    for vw, vh, fmt in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
        await pg.set_viewport_size({'width': vw, 'height': vh})
        for scene in ('arbeid', 'pause'):
            await pg.evaluate(SET, [t, scene, 15, -0.9, 0.32, 5.2 * (1.35 if fmt == 'staaende' else 1)]); await frames(pg, t, 3); await pg.wait_for_timeout(2500)
            for tag, on in (('av', False), ('paa', True)):
                await pg.evaluate("(on) => { SJOBEIN.on = on; }", on); await frames(pg, t, 2)
                info = await pg.evaluate("(() => { const v = G3._debug.bv; return {roll:+(v.roll * 180 / Math.PI).toFixed(1), pitch:+(v.pitch * 180 / Math.PI).toFixed(1), st:CREW3D.agents().map(a => a.mode + ':' + a.task)}; })()")
                await pg.screenshot(path=os.path.join(SHOTS, f'naer_{scene}_{tag}_{fmt}.jpg'), type='jpeg', quality=60)
                print('nær', scene, tag, fmt, json.dumps(info), flush=True)
    await pg.evaluate("SJOBEIN.on = true")


async def main():
    args = sys.argv[1:]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, URL)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        if args and args[0] == 'bilder':
            await shots(pg, args[1] if len(args) > 1 else 'etter')
        elif args and args[0] == 'par':
            await pairs(pg)
        else:
            await checks(pg)
            gerr = await pg.evaluate("G3._debug.glErr()"); check(gerr == 0, 'ingen GL-feil', gerr)
        check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
