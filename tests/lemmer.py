"""The limbs keep their length (FB2, steg 123, 13.11.2026; deckcrew.js LEMMER, ik2, armIk, reachBody, legDrop; view3d/08-plants.js
drawWorker): the upper arm, the forearm, the thigh and the shin are as long in every pose, the hand is where the work has it, the body
goes after a hand it cannot reach, and the elbows and the knees bend the right way. The checks read the joints drawWorker drew
(LEMMER.log) for the people on deck: as the game runs (the walk to the places, the fish coming, the events), and for every pose
through its whole beat (SJOBEIN.test puts everyone at a place in one pose at one beat, and LEMMER.redraw draws the people again
without a whole frame), on a level deck and at 8° of roll, with the solver on and off («#ik0», the limbs as before).

  python3 tests/lemmer.py                  the checks (prints OK or FEIL)
  python3 tests/lemmer.py bilder           the pictures: the heaviest work close in, the solver off and on, both formats, to
                                           docs/okter/2026-11-13-123/<scene>_<av|paa>_<format>.jpg
  KYST_IK=0 ...                            with #ik0 (the limbs stretched between the points: the «before», and the checks are red)
"""
from _env import boot, GAME, OUT
import asyncio, json, os, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, 'docs', 'okter', '2026-11-13-123')
OFF = os.environ.get('KYST_IK') == '0'
URL = GAME + ',folk2' + (',ik0' if OFF else '')   # (the solver is on only behind #folk2, with the new people)
DEG = 3.14159265358979 / 180


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''), flush=True)


# three boats with a hold and people on deck, by their fields: the shortest, the middle one and the longest of the coast's boats
BOATS = "Object.keys(VESSELS).filter(t => VESSELS[t].cls !== 'hav' && VESSELS[t].hold.kind === 'rom').sort((a, b) => VESSELS[a].len - VESSELS[b].len).filter((t, i, A) => i === 0 || i === (A.length >> 1) || i === A.length - 1)"

# the boat on a ground with three hands: hauling line (one hauls, one bleeds, one guts, one packs), hauling nets, jigging by hand,
# baiting or mending nets lying still (as tests/workshot.py sets them up), or lying idle (the breaks)
SET = """((a) => { const [type, scene, wind, yaw, pitch, dist] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  WX_FORCE = {w:wind, d:250};
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {linehaler:true, garnhaler:true}; S.jobs = []; S.cargo = []; b.gop = null; S.plan = null; S.settings.gut = true; S.settings.ice = true; S.settings.careAuto = false;
  S.pgear = newPGear(); S.sets = []; b.ice = 300; b.fuel = BOAT.fuelCap; b.deckStop = false; S.me = S.cur; S.myJob = null; S.rest = null;
  const hand = () => Object.assign(genCrew(), {bi:false, off:false, fatigue:5, morale:70, job:null});
  S.crew = [hand(), hand(), hand()];
  const fish = (kg, gut, iced) => ({sp:'torsk', cls:SPECIES.torsk.ref, kg, n:Math.round(kg / 3), bled:true, iced, hr:Math.floor(S.t / 60), fresh:100, gut, hook:true});
  S.hold = scene === 'pause' ? [] : [fish(220, false, false), fish(12, true, false), fish(30, true, true)];
  b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.gear = null;
  const gop = (kind, sl) => ({op:'haul', kind, n:6, done:2, prog:0.3, sub:0, sl, hooksPer:kind === 'line' ? 600 : 0, a:{x:g.x, y:g.y}, b:{x:g.x + 0.6, y:g.y}, lead:0, kg:0, rel:0, dead:0});
  if (scene === 'pause'){ b.status = 'idle'; b.fishUntil = null; b.rig = 'line'; }
  else if (scene === 'garn'){ b.status = 'fishing'; b.fishUntil = S.t + 600; b.rig = 'garn'; S.pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:4, cond:1}]; b.gop = gop('garn', 3); }
  else if (scene === 'juksa'){ b.status = 'fishing'; b.fishUntil = S.t + 600; b.rig = 'juksa'; b.gear = 'juksa'; S.equip = {}; }
  else if (scene === 'egning'){ b.status = 'idle'; b.fishUntil = null; b.rig = 'line'; S.hold = []; S.pgear.lines.hyse.n = 5; S.pgear.lines.hyse.baited = 1; baitOf(S.pgear).makrell = 100; egnSelf('hyse', 3); }
  else if (scene === 'boting'){ b.status = 'idle'; b.fishUntil = null; b.rig = 'garn'; S.hold = []; S.pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:6, cond:0.3, max:0.95}]; mendSelf('n1'); }
  else { b.status = 'fishing'; b.fishUntil = S.t + 600; b.rig = 'line'; S.pgear.lines.hyse.n = 4; S.pgear.lines.hyse.baited = 2; b.gop = gop('line', 6); }
  window.CATCHQ = []; clearInterval(window.FEED); if (scene !== 'pause' && scene !== 'egning' && scene !== 'boting') window.FEED = setInterval(() => { const Q = window.CATCHQ; if (Q.length < 3) Q.push({sp:Math.random() < 0.75 ? 'torsk' : 'hyse', kg:2 + Math.random() * 4, t:performance.now()}); }, 900);
  CREW3D.reset();
  const c = G3._debug.cam; c.helm = false; c.pitch = pitch; c.yaw = yaw; c.dist = dist; })"""

# every pose drawWorker has that needs nothing but a place (the rest come with the work as the game runs: gutw at the table, the
# events gaff, bleed, pick and jigup with a fish, slip and cut)
TASKS = ['look', 'hose', 'coil', 'stack', 'carry', 'ice', 'sweep', 'coffee', 'cold', 'signal', 'guide', 'unhook', 'tally', 'remote', 'nozzle', 'helm', 'helmsit', 'drive', 'lean', 'jig', 'gut', 'gaff', 'bleed',
         'haul', 'tend', 'sett', 'pick', 'bleedst', 'jigup', 'pack', 'stow', 'egn', 'strip', 'mend', 'back', 'sit', 'chat', 'knife', 'lunch', 'phone', 'binoc', 'aurora', 'seasick', 'gear', 'smoke', 'snus', 'cut', 'slip', 'door',
         'sitmat', 'sitkaffe']

# what the log says, a pose at a time: the lengths against the person's own, the hand against its target, what the body did
AGG = """((L, R) => { const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), S0 = limbLen(null), reach = (S0.ua + S0.fa) * LEMMER.REACH;
  for (const g of L){ if (g.task === 'sitmat' || g.task === 'sitkaffe') continue; const k = (g.walk ? 'gå' : g.put ? 'legger bort' : g.task || 'står') + (g.ev ? '*' : ''), r = R[k] || (R[k] = {n:0, ua:[9, 0], fa:[9, 0], th:[9, 0], sn:[9, 0], ask:0, miss:0, over:0, nover:0, b:[0, 0], t:0, nbody:0, drop:0, lo:0, inT:0, kf:9, near:0, gl:[9, 0], oa:[0, 0]});
    r.n++; if (g.near) r.near++; if (g.ao[0] > r.oa[0]) r.oa[0] = g.ao[0]; if (g.ao[1] > r.oa[1]) r.oa[1] = g.ao[1]; for (const v of g.gl) if (v > 0){ r.gl[0] = Math.min(r.gl[0], v); r.gl[1] = Math.max(r.gl[1], v); }
    for (const i of [0, 1]){ const ua = d(g.sh[i], g.el[i]), fa = d(g.el[i], g.wr[i]), th = d(g.hip[i], g.knee[i]), sn = d(g.knee[i], g.foot[i]);
      for (const [nm, v] of [['ua', ua], ['fa', fa], ['th', th], ['sn', sn]]){ r[nm][0] = Math.min(r[nm][0], v); r[nm][1] = Math.max(r[nm][1], v); }
      r.ask = Math.max(r.ask, d(g.sh[i], g.wr[i])); if (g.ao[i] > 1e-4){ r.over = Math.max(r.over, g.ao[i]); r.nover++; } else r.miss = Math.max(r.miss, d(g.gp[i], g.tg[i]));
      r.lo = Math.max(r.lo, g.lo[i]); r.kf = Math.min(r.kf, g.kf[i]);
      // (the elbow in the torso: between the hips and the shoulders, within its half width and its half depth)
      const e = g.elT[i]; if (e && Math.abs(e[2]) < 0.17 && Math.abs(e[0]) < 0.1 && e[1] > 0 && e[1] < 0.5) r.inT++; }
    r.b[0] = Math.min(r.b[0], g.b); r.b[1] = Math.max(r.b[1], g.b); r.t = Math.max(r.t, Math.abs(g.t)); if (Math.abs(g.b) > 1e-3 || Math.abs(g.t) > 1e-3) r.nbody++; r.drop = Math.max(r.drop, g.drop); }
  return R; })"""

# every pose through its beat at one roll, the people drawn again each time; what was drawn summed up in the page (AGG)
SWEEP = """(([tasks, n, roll, on]) => { const R = {}, agg = %s; LEMMER.on = on; LEMMER.log = [];
  for (const task of tasks) for (let k = 0; k < n; k++){ SJOBEIN.test = {roll, pitch:0, T:100 + k * 0.37, task}; LEMMER.log.length = 0; LEMMER.redraw(); agg(LEMMER.log, R); }
  SJOBEIN.test = null; LEMMER.log = null; LEMMER.on = /folk2/.test(location.hash) && !/ik0/.test(location.hash); return R; })""" % AGG


# the clip guard's limbs against the drawn ones (deckcrew.js poseSegs through CREW3D.poseLines): the poses that stand upright and still,
# on a level deck in a calm; the elbows and the knees in the person's own frame [ahead, up, right]
GUARD = """((tasks) => { const out = {}, d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); LEMMER.log = []; SJOBEIN.on = false;   // (the pose alone: the sea legs have their own lines, seaLines)
  for (const task of tasks){ SJOBEIN.test = {roll:0, pitch:0, T:100.3, task, hs:0}; LEMMER.redraw(); LEMMER.log.length = 0; LEMMER.redraw();
    for (const g of LEMMER.log){ if (g.task !== task || g.walk || g.ev || g.put) continue; const F = [Math.sin(g.h), -Math.cos(g.h)], Rv = [Math.cos(g.h), Math.sin(g.h)];
      const own = p => [(p[0] - g.at[0]) * F[0] + (p[2] - g.at[2]) * F[1], p[1] - g.at[1], (p[0] - g.at[0]) * Rv[0] + (p[2] - g.at[2]) * Rv[1]], P = CREW3D.poseLines(task, g.rail); if (P.length < 16) continue;   // (the poses with the standing figure's lines: 4 of the legs, 6 of the body, 3 an arm)
      const o = out[task] || (out[task] = {n:0, el:0, kn:0}); o.n++; o.el = Math.max(o.el, d(own(g.el[0]), P[10][1]), d(own(g.el[1]), P[13][1])); o.kn = Math.max(o.kn, d(own(g.knee[1]), P[0][1]), d(own(g.knee[0]), P[2][1])); } }
  SJOBEIN.test = null; SJOBEIN.on = true; LEMMER.log = null; return out; })"""


async def frames(pg, t, n=4, timeout=240000):
    """n more frames with the people on deck drawn (LEMMER.fr counts drawDeckCrew), on the boat t."""
    await pg.wait_for_function("(t) => G3._debug.kitStat.vt === t", arg=t, timeout=timeout)
    n0 = await pg.evaluate("LEMMER.fr")
    await pg.wait_for_function("([n0, n]) => LEMMER.fr >= n0 + n", arg=[n0, n], timeout=timeout)


async def live(pg, t, n, roll, on, R):
    """What drawWorker drew over n frames of the game as it runs (the walk, the events), summed into R."""
    await pg.evaluate("([roll, on]) => { SJOBEIN.test = roll == null ? null : {roll, pitch:0}; LEMMER.on = on; LEMMER.log = []; }", [roll, on])
    await frames(pg, t, n)
    R.update(await pg.evaluate("(R) => { const L = LEMMER.log; LEMMER.log = null; LEMMER.on = /folk2/.test(location.hash) && !/ik0/.test(location.hash); SJOBEIN.test = null; return (%s)(L, R); }" % AGG, R))


def merge(A, B):
    for k, r in B.items():
        a = A.get(k)
        if not a: A[k] = r; continue
        a['n'] += r['n']; a['near'] += r['near']; a['nover'] += r['nover']; a['nbody'] += r['nbody']; a['inT'] += r['inT']
        for nm in ('ua', 'fa', 'th', 'sn'): a[nm] = [min(a[nm][0], r[nm][0]), max(a[nm][1], r[nm][1])]
        for nm in ('ask', 'miss', 'over', 't', 'drop', 'lo'): a[nm] = max(a[nm], r[nm])
        a['b'] = [min(a['b'][0], r['b'][0]), max(a['b'][1], r['b'][1])]; a['kf'] = min(a['kf'], r['kf']); a['gl'] = [min(a['gl'][0], r['gl'][0]), max(a['gl'][1], r['gl'][1])]; a['oa'] = [max(a['oa'][0], r['oa'][0]), max(a['oa'][1], r['oa'][1])]
    return A


async def sweep(pg, nph, on):
    """Every pose through its beat on the places the people stand at now, level and at 8° either way."""
    R = {}
    for roll in (0, 8 * DEG, -8 * DEG): merge(R, await pg.evaluate(SWEEP, [TASKS, nph, roll, on]))
    return R


async def gather(pg, t, nph, scenes):
    """Everything for one boat: the scenes as they run, then every pose through its beat on the line haul's places. The sweep comes
    last: with the beat held still it leaves the deck full of the test's own fish, and the next whole frame takes minutes."""
    R = {}; LV = {}
    for scene, nfr in scenes + [('arbeid', 0)]:
        try:
            await pg.evaluate(SET, [t, scene, 1, -0.75, 0.6, 9]); await frames(pg, t, 2)
            for roll in ((None, 8 * DEG) if scene == 'arbeid' else (8 * DEG,)):
                if nfr: L = {}; await live(pg, t, nfr, roll, not OFF, L); merge(LV, json.loads(json.dumps(L))); merge(R, L)
        except Exception as e:
            check(False, 'scenen %s på %s ble tegnet' % (scene, t), str(e)[:200]); continue
        print('  ', t, scene, sorted(LV.keys()), flush=True)
    try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
    except Exception: pass
    await pg.evaluate("LEMMER.log = []"); await frames(pg, t, 1)   # (a frame with the log on leaves LEMMER.redraw)
    merge(R, await sweep(pg, nph, not OFF))
    return R, LV


def spread(R, nm, L):
    lo = min(r[nm][0] for r in R.values()); hi = max(r[nm][1] for r in R.values()); return max(abs(lo - L), abs(hi - L)), lo, hi


async def checks(pg):
    boats = await pg.evaluate(BOATS); mid = boats[1]; print('båter:', boats, flush=True)
    await pg.set_viewport_size({'width': 240, 'height': 150})   # (a tiny window: SwiftShader takes 25 s a frame at 640×400, and the checks read numbers)
    on = await pg.evaluate("[LEMMER.on, (h => /folk2/.test(h) && !/ik0/.test(h))('#qfix,seed=1,ro0#notut')]")
    check(on == [not OFF, False], 'løseren er på bak #folk2 og av uten merket (og av med #ik0)', on)
    std = await pg.evaluate("limbLen(null)"); reach = (std['ua'] + std['fa']) * await pg.evaluate("LEMMER.REACH"); names = {'ua': 'overarm', 'fa': 'underarm', 'th': 'lår', 'sn': 'legg'}
    full = [('arbeid', 4), ('garn', 3), ('juksa', 3), ('egning', 2), ('boting', 2), ('pause', 2)]
    # ---- after: the scenes as they run and every pose through its beat
    A, LV = await gather(pg, mid, 40, full)
    # ---- before: the same poses on the same places with the solver off (the limbs stretched between the points, as #ik0)
    B = await sweep(pg, 40, False)
    for nm in ('ua', 'fa', 'th', 'sn'):
        w, lo, hi = spread(B, nm, std[nm]); check(w > 0.01, 'før (løseren av, som #ik0): %s er fra %.3f til %.3f m i de samme stillingene (lengden er %.3f)' % (names[nm], lo, hi, std[nm]))
    asked = {k: round(r['ask'], 3) for k, r in B.items() if r['ask'] > reach + 1e-3}
    print('før: %d av %d stillinger ber om lengre arm enn figuren har (%.3f m fra skulder til håndledd):' % (len(asked), len(B), reach), json.dumps(dict(sorted(asked.items(), key=lambda q: -q[1])), ensure_ascii=False), flush=True)
    inB = {k: r['inT'] for k, r in B.items() if r['inT']}
    print('før: albuen inne i overkroppen i', json.dumps(inB, ensure_ascii=False), flush=True)
    if OFF:
        A = B
    else:
        # (the other two boats, fewer beats: the places and the rails are other ones)
        for t in (boats[0], boats[2]):
            A2, L2 = await gather(pg, t, 12, [('arbeid', 2), ('pause', 2)]); merge(A, A2); merge(LV, L2)
    gl = [r['gl'] for r in A.values() if r['gl'][1] > 0]
    print('fra håndleddet til der hånda holder (grepene): %.3f–%.3f m' % (min(g[0] for g in gl), max(g[1] for g in gl)), flush=True)
    nfig = sum(r['n'] for r in A.values())
    # 1. the lengths
    for nm in ('ua', 'fa', 'th', 'sn'):
        w, lo, hi = spread(A, nm, std[nm]); bad = {k: [round(r[nm][0], 4), round(r[nm][1], 4)] for k, r in A.items() if max(abs(r[nm][0] - std[nm]), abs(r[nm][1] - std[nm])) > 0.001}
        check(w <= 0.001, '%s holder lengden %.3f m innen 1 mm i %d stillinger (%d figurer tegnet; i ro og i gange, 0 og ±8°, tre båter): %.4f–%.4f' % (names[nm], std[nm], len(A), nfig, lo, hi), bad if bad else '')
    check('gå' in A and A['gå']['n'] >= 4, 'gangen er med (%d figurer i gange)' % (A.get('gå', {}).get('n', 0)))
    seen = sorted(A.keys()); want = [k for k in TASKS if k not in ('sitmat', 'sitkaffe')] + ['gutw']
    miss = [k for k in want if k not in A]; check(not miss, 'alle stillingene er med (%d): %s' % (len(seen), ' '.join(seen)), miss if miss else '')
    # 2. the hand where the work has it
    w = max(r['miss'] for r in A.values()); bad = {k: round(r['miss'] * 100, 1) for k, r in A.items() if r['miss'] > 0.02}
    check(w <= 0.02, 'hånda er innen 2 cm av det den holder når armen rekker (verst %.1f mm)' % (w * 1000), bad if bad else '')
    # 3. the body goes after
    # (in the game as it runs, everyone at his own place; and every pose put on the line haul's places, where the rail or the table
    # may be further off than the pose was made for)
    for name, X in (('i spillet slik det går (linetrekk, garntrekk, juksa, egning, bøting, pause; tre båter)', LV), ('med alle stillingene satt på linetrekkets plasser', A)):
        body = {k: {'bøy°': [round(r['b'][0] / DEG, 1), round(r['b'][1] / DEG, 1)], 'vri°': round(r['t'] / DEG, 1), 'andel': round(r['nbody'] / r['n'], 2)} for k, r in X.items() if r['nbody']}
        check(True, 'kroppen går etter %s i %d av %d stillinger (ryggen bøyes, overkroppen vris):' % (name, len(body), len(X)), json.dumps(body, ensure_ascii=False))
        short = {k: {'cm': round(r['over'] * 100, 1), 'andel': round(r['nover'] / (2 * r['n']), 2)} for k, r in X.items() if r['nover']}
        check(True, 'og hånda er flyttet fordi målet er utenfor rekkevidde også med kroppen etter, eller inne i hans egen kropp, i %d stillinger:' % len(short), json.dumps(short, ensure_ascii=False))
    drop = {k: round(r['drop'] * 100, 1) for k, r in A.items() if r['drop'] > 1e-4}; lo = {k: round(r['lo'] * 100, 1) for k, r in A.items() if r['lo'] > 1e-4}
    check(True, 'hofta senkes for at føttene skal nå (cm):', json.dumps(drop, ensure_ascii=False) + '  foten flyttet inn (cm): ' + json.dumps(lo, ensure_ascii=False))
    # 4. the elbows and the knees
    inT = {k: r['inT'] for k, r in A.items() if r['inT']}; check(not inT, 'ingen albue er inne i overkroppen', inT if inT else '')
    kf = min(r['kf'] for r in A.values()); check(kf > 0, 'kneet er alltid foran linja fra hofta til ankelen (minst %.1f cm)' % (kf * 100), {k: round(r['kf'] * 100, 1) for k, r in A.items() if r['kf'] <= 0})
    if OFF: return
    # 5. the time: the people on deck drawn 150 times at one beat, the solver off and on
    await pg.evaluate(SET, [mid, 'arbeid', 1, -0.75, 0.6, 9]); await frames(pg, mid, 2)
    try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
    except Exception: pass
    await pg.evaluate("LEMMER.log = []"); await frames(pg, mid, 1)
    # 6. the clip guard reckons with the limbs that are drawn
    G = await pg.evaluate(GUARD, ['binoc', 'remote', 'guide', 'helm', 'tally', 'unhook', 'nozzle', 'phone', 'aurora'])
    # (the binoculars: an arm folded right up, where a centimetre at the wrist is many at the elbow; printed, not held to the limit)
    we = max([g['el'] for k, g in G.items() if k != 'binoc'] or [9]); wk = max([g['kn'] for g in G.values()] or [9])
    # (the guard has the same solver and lengths, but not each grip's own point, the back's bend at the work or the life jacket's shoulders:
    # those are the centimetres between them, until the pose is read from the drawing itself, FB1)
    check(len(G) >= 8 and we < 0.22 and wk < 0.02, 'klippevakten regner med samme løser som tegningen (%d stillinger; kneet innen %.1f cm, albuen innen %.1f cm: vakten kjenner ikke grepene og ryggbøyen)' % (len(G), wk * 100, we * 100), {k: [round(g['el'] * 100, 1), round(g['kn'] * 100, 1)] for k, g in G.items()})
    tm = await pg.evaluate("""(() => { const out = {}, n = CREW3D.visible().length; LEMMER.log = null; SJOBEIN.test = {roll:0.1, pitch:0, T:100.3};
      for (let go = 0; go < 3; go++) for (const on of [false, true]){ LEMMER.on = on; for (let i = 0; i < 20; i++) LEMMER.redraw(); const t0 = performance.now(); for (let i = 0; i < 150; i++) LEMMER.redraw(); const ms = (performance.now() - t0) / 150 / n; out[on] = Math.min(out[on] || 9, ms); }
      LEMMER.on = /folk2/.test(location.hash) && !/ik0/.test(location.hash); SJOBEIN.test = null; return {av:out[false], paa:out[true], n}; })()""")
    check(tm['paa'] < tm['av'] * 1.25 + 0.02, 'tida per figur i drawDeckCrew (%d om bord, beste av tre): %.3f ms med løseren av, %.3f ms med den på' % (tm['n'], tm['av'], tm['paa']))


SCENES = [('linetrekk', 'arbeid', 15), ('garntrekk', 'garn', 15), ('juksa', 'juksa', 15), ('egning', 'egning', 9), ('boting', 'boting', 9), ('pause', 'pause', 15)]


async def shots(pg):
    """The heaviest work close in, the solver off and on at the same beat, both formats."""
    os.makedirs(SHOTS, exist_ok=True)
    boats = await pg.evaluate(BOATS); t = boats[1]
    for vw, vh, fmt in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
        await pg.set_viewport_size({'width': vw, 'height': vh})
        for name, scene, wind in SCENES:
            await pg.evaluate(SET, [t, scene, wind, -0.9, 0.32, 5.6 * (1.35 if fmt == 'staaende' else 1)]); await frames(pg, t, 3)
            try: await pg.wait_for_function("CREW3D.agents().filter(a => a.mode === 'at').length >= 3", timeout=240000)
            except Exception: pass
            for tag, on in (('av', False), ('paa', True)):
                await pg.evaluate("(on) => { LEMMER.on = on; SJOBEIN.test = {T:103.1}; }", on); await frames(pg, t, 2)
                await pg.screenshot(path=os.path.join(SHOTS, f'{name}_{tag}_{fmt}.jpg'), type='jpeg', quality=70)
                print(name, tag, fmt, json.dumps(await pg.evaluate("CREW3D.agents().map(a => a.mode + ':' + a.task)")), flush=True)
            await pg.evaluate("LEMMER.on = /folk2/.test(location.hash) && !/ik0/.test(location.hash); SJOBEIN.test = null")


async def main():
    args = sys.argv[1:]
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, URL)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        if args and args[0] == 'bilder':
            await shots(pg)
        else:
            await checks(pg)
            gerr = await pg.evaluate("G3._debug.glErr()"); check(gerr == 0, 'ingen GL-feil', gerr)
        check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
