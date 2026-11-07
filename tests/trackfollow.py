"""The 3D boat on the route (06.10.2026; view3d.js trkOn/trkStep, core haltPlan, ui renderDyn with livePose). Jonas: «båten strengt må
følge rutestreken som lages i kartplotteren», «ganske nøyaktige kursendringer», «stoppe på nøyaktig den plassen siste endepunkt er …
slakker av og stopper nøyaktig der den skal», Stopp underway not «bråstoppe», and the own boat on the chart updated more often.
1. Senjahopen, from the plant's quay to the nearest rorbu (tilbakemelding #3: she hung at the plant's quay; the rorbu was rb129 until the
   rorbuer were placed anew 08.10.2026, now the nearest one within 8 km is looked up): out from the quay, along the
   line, in to the rorbu's berth, lines on.
2. Out to sea, then «Stopp» underway: she slacks off gradually and stops where the simulation stops.
3. On to a point at sea: she stops exactly on the last waypoint, without running past it.
1b, 2a. A slow frame between two ticks at the hand-offs to the manoeuvring model (time caught up with the minute step under way, and
   the cast-off) does not run her out along the line for the model to put her back (07.11.2026: 196 and 197 m under a stall of 22 s).
4. The chart plotter draws the boat where she is between the simulation's minutes.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, math
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


SAMPLE = """(() => { const D = G3._debug, b = S.boat, T = D.trk;
  return {st:b.status, port:b.port || null, x:D.bv.px, z:D.bv.pz, hd:D.bv.cog, spd:D.bv.spd, sim:[b.pos.x * 1000, b.pos.y * 1000], mo:D.MO.phase,
    trk:T ? {s:T.s, v:T.v, end:T.end, done:T.done, n:T.P.length, P:T.P} : null, t:performance.now(), mdl:!!dynTrackView(), wall:(b.dyn || {}).wall || 0, u:b.dyn ? Math.abs(b.dyn.u) * simRate() : 0, live:(q => [q.p.x * 1000, q.p.y * 1000])(livePose()), drv:!!b.drv, stop:b.dyn ? [b.dyn.X, b.dyn.Y] : null}; })()"""


def seg_dist(P, x, z):
    """distance from (x, z) to the polyline P, and how far along it the nearest point is"""
    best, bs, acc = 1e18, 0, 0
    for i in range(1, len(P)):
        ax, az = P[i - 1]; cx, cz = P[i]; vx, vz = cx - ax, cz - az; l2 = vx * vx + vz * vz or 1
        u = max(0, min(1, ((x - ax) * vx + (z - az) * vz) / l2)); d = math.hypot(x - ax - u * vx, z - az - u * vz)
        if d < best: best, bs = d, acc + u * math.sqrt(l2)
        acc += math.sqrt(l2)
    return best, bs


DIAG = """(() => { const b = S.boat, d = b.dyn || {}, pl = S.plan, D = G3._debug;
  return {st:b.status, t:S.t, v:+(b.v || 0).toFixed(1), u:+(d.u || 0).toFixed(2), live:dynLive(), on:DYN.on, hold:DYN.hold, debt:+DYN.debt.toFixed(1), ready:simAreaReady(), cl:CATCH_LEFT, tabw:!!TAB.wait, tabh:!!TAB.held,
    replan:!!(pl && pl.replan), idx:pl ? pl.idx : null, n:pl ? pl.wps.length : null, line:!!DYN.line, mo:D.MO.phase, trkv:D.trk ? +D.trk.v.toFixed(1) : null, spd:+D.bv.spd.toFixed(1), log:S.log.slice(-2).map(l => l.no || l.text || '').join(' | ').slice(-100)}; })()"""


# where a point (on-screen metres) lies along the line the manoeuvring model takes her on, and how far off it
ALONG = """(xz) => { const T = DYN.line; if (!T) return null; let best = 1e18, bs = 0, acc = 0;
  for (let i = 1; i < T.P.length; i++){ const a = T.P[i - 1], c = T.P[i], vx = c[0] - a[0], vz = c[1] - a[1], l2 = vx * vx + vz * vz || 1, l = Math.sqrt(l2), u = Math.max(0, Math.min(1, ((xz[0] - a[0]) * vx + (xz[1] - a[1]) * vz) / l2)), d = Math.hypot(xz[0] - a[0] - u * vx, xz[1] - a[1] - u * vz);
    if (d < best){ best = d; bs = acc + u * l; } acc += l; } return [bs, best]; }"""


async def handoff(pg, how):
    """a slow frame at a hand-off to the model: the tick is held (TAB.held), how runs the tick that hands her over (in the page), the
    page stalls 22 s as SwiftShader does, and the frame after it is a real one; then the tick goes on and the model has her. Returns
    how far back along the model's line the 3D boat went from where that frame drew her, and both places along it"""
    st = await pg.evaluate("(() => { TAB.held = true; const r = (" + how + ")(); const t0 = performance.now(); while (performance.now() - t0 < 22000){} return r; })()")
    await pg.wait_for_timeout(500)   # (the frame after the stall)
    f = await pg.evaluate("[G3._debug.bv.px, G3._debug.bv.pz]")
    await pg.evaluate("TAB.held = false")
    for _ in range(40):   # (until the model has her and a frame has drawn her where it puts her: SwiftShader's frames come seconds apart)
        await pg.wait_for_timeout(500)
        if await pg.evaluate("dynLive() && !!DYN.line && Date.now() - S.boat.dyn.wall < 3000"): break
    await pg.wait_for_timeout(4000)
    m = await pg.evaluate("[G3._debug.bv.px, G3._debug.bv.pz]")
    a, b = await pg.evaluate(ALONG, f), await pg.evaluate(ALONG, m)
    return {'st': st, 'back': round(a[0] - b[0], 1) if a and b else None, 'frame': a and [round(a[0], 1), round(a[1], 1)], 'model': b and [round(b[0], 1), round(b[1], 1)]}


async def follow(pg, until, n=400, dt=200, diag=0):
    """samples until until(sample) or n samples; returns the samples (diag: print the simulation's state every so many samples)"""
    out = []
    for i in range(n):
        await pg.wait_for_timeout(dt)
        s = await pg.evaluate(SAMPLE); out.append(s)
        if until(s): break
        if diag and (i + 1) % diag == 0: print('  diag %d:' % (i + 1), json.dumps(await pg.evaluate(DIAG), ensure_ascii=False))
    return out


def dump(name, out):
    """the samples to tests/out/trackfollow-<name>.json (each line once), to look at a red check afterwards without running again"""
    import os; Ps, rows = [], []
    for s in out:
        r = dict(s); T = r.get('trk')
        if T: T = dict(T); k = next((i for i, P in enumerate(Ps) if P == T['P']), None); k = len(Ps) if k is None else k; Ps.append(T['P']) if k == len(Ps) else None; T['P'] = k; r['trk'] = T
        rows.append(r)
    os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'), exist_ok=True)
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'trackfollow-%s.json' % name), 'w') as f: json.dump({'P':Ps, 's':rows}, f)


def along(out):
    """the worst distance off the line she follows, and the worst step backwards along it, over the samples with one line"""
    off, back, P, last = 0, 0, None, None
    for s in out:
        if not s['trk']: continue
        # a new line (a changed route, or the model starting again after time caught up) starts where the simulation is; the 3D boat
        # is there from the next frame, so the first sample on it is not measured
        if P is None or s['trk']['P'] != P: P, last = s['trk']['P'], None; continue
        d, a = seg_dist(P, s['x'], s['z']); off = max(off, d)
        if last is not None: back = max(back, last - a)
        last = a
    return off, back


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 900, 'height': 560}); errs = []   # (smaller: SwiftShader's frames are what the test waits for)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        # 1. the plant's quay in Senjahopen to the nearest rorbu, the route the chart plotter draws (Autonav)
        r = await pg.evaluate("""(async () => { const b = S.boat; b.status = 'port'; b.port = 'senjahopen'; b.shift = null; b.berth = null; S.plan = null; S.draft = []; S.tut = 0;
          const bp = berthPose('senjahopen', b.type); b.pos = {...portById('senjahopen').p}; b.heading = bp.hd; await mapNeed(b.pos, 9); const R = rorbuSites(b.pos, 8)[0]; rorbuSite(R.id);
          view.z = Math.max(view.z, 3); setTab('route'); await leiaTo({x:R.p.x, y:R.p.y}); return {n:S.draft.length, last:(S.draft[S.draft.length - 1] || {}).port || null, rb:R.id, km:+dist(b.pos, R.p).toFixed(2)}; })()""")
        RB = r['rb']; print('rorbu', RB, r['km'], 'km')
        await pg.evaluate("G3.show(true)"); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        import time; T0 = time.time()
        await pg.evaluate("(() => { doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); })()")
        docked = lambda s: s['st'] == 'port' and s['port'] == RB and s['mo'] == 'moored' and not s['trk']
        out = await follow(pg, lambda s: docked(s) or (s['mdl'] and s['trk']['s'] > 900), n=800); k1 = None
        if not docked(out[-1]):
            # 1b. time caught up under way: a stall of more than 100 s (ten game minutes) is played with the kinematic minute step, the
            # model off for that tick (ui tick), and it starts again from where that put her; twelve minutes here, on the long legs
            k1 = await handoff(pg, "() => { DYN.on = false; catchUp(120000); return S.boat.status + ' ' + (DYN.line ? DYN.line.P.length : 0); }")
            out += await follow(pg, docked, n=max(50, 800 - len(out)))
        print('part 1: %d samples in %.0f s' % (len(out), time.time() - T0)); dump('part1', out)
        check(k1 is not None and k1['back'] is not None and k1['back'] < 0.6, 'a slow frame after time caught up with the minute step (the model off for a tick) does not run her past the simulation for the model to put her back', k1)
        end = await pg.evaluate("""(rb) => { const D = G3._debug, b = S.boat, bp = berthPose(rb, b.type, 'main') || berthPose(rb, b.type);
          return {d:Math.hypot(D.bv.px - bp.x * 1000, D.bv.pz - bp.y * 1000), dh:Math.abs(((D.bv.cog - bp.hd) * 180 / Math.PI + 540) % 360 - 180), st:b.status, port:b.port, mo:D.MO.phase}; }""", RB)
        off, back = along(out)
        first = next((s for s in out if s['trk']), None); x0 = (out[0]['x'], out[0]['z'])
        # by the time the simulation is 150 m out from the harbour point, she is under way out from the quay (measured against the
        # simulation, not the clock: the page here stalls for 10-20 s at a time while SwiftShader draws, and the clock with it)
        s0 = x0; i0 = next((i for i, s in enumerate(out) if math.hypot(s['sim'][0] - s0[0], s['sim'][1] - s0[1]) > 150), None)   # (from the berth she lay at: the simulation starts there now)
        left = max(math.hypot(s['x'] - x0[0], s['z'] - x0[1]) for s in out[i0:i0 + 3]) if i0 is not None else None   # (how far the 3D boat has come from the berth, by the next frame or two: a sample can fall between a tick and the frame that draws it)
        dock = next((i for i, s in enumerate(out) if s['st'] == 'port' and s['port'] == RB), None)
        check(r['n'] > 0 and r['last'] == RB and first is not None, 'Autonav makes a route to the rorbu, and the 3D boat takes it as a line out from the quay', {'wps': r['n'], 'line': first and first['trk']['n']})
        check(left is not None and left > 30, 'she is more than 30 m out from the plant\'s quay when the simulation is 150 m out (#3: she hung there)', {'m': left and round(left, 1)})
        check(off < 9 and back < 0.6, 'she keeps to the line all the way, at most 9 m off it in the corners (the model turns on her own radius), and never goes back along it', {'off': round(off, 2), 'back': round(back, 2)})
        check(end['st'] == 'port' and end['port'] == RB and end['mo'] == 'moored' and end['d'] < 0.3 and end['dh'] < 3, 'she comes in to the rorbu\'s berth, exactly, and the lines go on', {k: (round(v, 2) if isinstance(v, float) else v) for k, v in end.items()})
        # in at the berth: her line is done (the lines going on after it run on the frames' own clock)
        inb = next((i for i, s in enumerate(out) if dock is not None and i >= dock and not s['trk']), None)
        after = inb is not None and (out[inb]['t'] - out[dock]['t']) / 1000
        check(inb is not None and after < 60, 'she is in at the berth within a minute of the simulation docking', {'after': after and round(after, 1)})
        # 2. out to sea, Stopp underway: slack off, stop where the simulation stops
        # (in a calm from here: lying still she drifts with the wind (Fysikk 2, core lieDrift), which is dyntest's to measure, and the
        # stops here are the follower's)
        sea = await pg.evaluate("""async (rb) => { WX_FORCE = {w:0.3, d:270}; const o = portById(rb).p; let best = null;
          for (let k = 0; k < 24; k++){ const a = k / 24 * 2 * Math.PI, q = {x:o.x + Math.sin(a) * 1.6, y:o.y - Math.cos(a) * 1.6}; if (isLand(q) || depthF(q) < 15) continue; const q2 = {x:o.x + Math.sin(a) * 2.4, y:o.y - Math.cos(a) * 2.4};
            if (!isLand(q2) && depthF(q2) > 15 && legClear(q, q2)){ best = {q, q2}; break; } }
          if (!best) return null; const toasts = [], T0 = toast; toast = m => { toasts.push(String(m)); T0(m); };   // (what Autonav says when it declines)
          // (Autonav snaps a tap within 22 px of a place to the place; with the chart small beside the 3D view that reached the point at sea
          // from the rorbu, and Autonav said «Du ligger allerede her»: the chart is read as zoomed in for the tap)
          view.px = Math.max(view.px, 100); S.draft = []; await leiaTo(best.q); let tries = 1;
          // (Autonav declines while another search runs or the draft is locked; under SwiftShader's stalls that happened right after docking, and
          // a draft of the far point alone made a route straight into land: she stopped short of it and lay «under way», 19.10.2026)
          while (!S.draft.length && tries < 4){ await new Promise(r => setTimeout(r, 1500)); view.px = Math.max(view.px, 100); S.draft = []; await leiaTo(best.q); tries++; }
          toast = T0; let why = null; if (!S.draft.length){ try { const rr = await leiaRoute({x:S.boat.pos.x, y:S.boat.pos.y}, best.q, rb, null); why = rr && rr.why ? rr.why : rr && rr.wps ? 'ok:' + rr.wps.length : String(rr); } catch (e){ why = 'err:' + e; } }
          const leia = S.draft.length; S.draft.push({x:best.q2.x, y:best.q2.y}); return {n:S.draft.length, leia, tries, busy:LEIA_BUSY, edit:canEditDraft(), toasts:toasts.slice(0, 4), why, q2:[best.q2.x * 1000, best.q2.y * 1000]}; }""", RB)
        if not sea:
            check(False, 'a point at sea 1.6-2.4 km from the rorbu, for the stop and the end of a route')
        else:
            check(sea['leia'] > 0, 'Autonav draws the way out from the rorbu to the point at sea', {k: sea[k] for k in ('n', 'leia', 'tries', 'busy', 'edit', 'toasts', 'why')})
            # 2a. cast off with a slow frame before the model's first tick: the tick is held while she unmoors (the frames run, the lines
            # come off), and the tick that casts her off runs by hand (the model first, as in tick(), then the minute step)
            await pg.evaluate("(() => { doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); TAB.held = true; })()")
            p0 = await pg.evaluate("[G3._debug.bv.px, G3._debug.bv.pz]")
            await pg.wait_for_timeout(6000)
            ho = await handoff(pg, "() => { const b = S.boat, st = b.status; b.castUntil = S.t; dynTick(0.2); step(); return st + '>' + b.status; }")
            check(ho['st'] == 'unmooring>sailing' and ho['back'] is not None and ho['back'] < 0.6, 'a slow frame between the tick that casts her off and the model\'s first tick (22 s here) does not run her out along the line for the model to put her back', ho)
            out = await follow(pg, lambda s: s['st'] == 'sailing' and s['trk'] and s['trk']['v'] > 12 and math.hypot(s['x'] - p0[0], s['z'] - p0[1]) > 250, n=250, diag=40)
            print('part 2 under way: %d samples, %.0f s since the start, last %s' % (len(out), time.time() - T0, {k: out[-1][k] for k in ('st', 'spd')}))
            v0 = out[-1]['trk']['v'] if out[-1]['trk'] else 0
            await pg.evaluate("doAct({dataset:{act:'stop'}, disabled:false})")
            out = await follow(pg, lambda s: s['st'] == 'idle' and not s['trk'], n=300)
            print('part 2 stopped: %d samples, %.0f s since the start' % (len(out), time.time() - T0)); dump('part2', out)
            # (the slack-off is measured over the model's own ticks: its speed at the last tick in each sample (u, on the screen's scale, which
            # is what the 3D boat is given under the model), by that tick's wall time. Under SwiftShader the ticks and the frames come seconds
            # apart: two frames 0.2 s apart on either side of a 4 s tick would show that tick's whole slack-off as a jump, and the 3D boat's own
            # speed (spd, from the last frame) beside the last tick's time showed four ticks' slack-off in one, 07.11.2026: 8.4 for 2.3)
            vs = [s['u'] for s in out]; drops = [(vs[i - 1] - vs[i]) / max(0.2, (out[i]['wall'] - out[i - 1]['wall']) / 1000) for i in range(1, len(vs)) if out[i]['wall'] > out[i - 1]['wall']]
            await pg.wait_for_timeout(4000); fin = await pg.evaluate(SAMPLE); dsim = math.hypot(fin['x'] - fin['live'][0], fin['z'] - fin['live'][1])   # (the frame after the stop: SwiftShader's frames come up to four seconds apart; against the pose the plotter draws, as she drifts once she lies still, Fysikk 2)
            logl = await pg.evaluate("S.log.slice(-6).map(l => JSON.stringify(l)).join(' | ')")
            # (and the model has her on the way down at least once: a «Stopp» that stopped her at once, past the model, has no ticks to measure)
            slack = sum(1 for s in out if s['trk'] and 0.5 < s['u'] < v0 - 0.5)
            check(v0 > 12 and slack > 0 and max(drops or [0]) < max(8, v0 / 3), 'Stopp underway: she slacks off gradually, not all at once' + ('' if drops else ' (ticks too far apart to measure here; dyntest measures it)'), {'v0': round(v0, 1), 'worst m/s per s': round(max(drops or [0]), 1), 'ticks': len(drops), 'slacking': slack, 'secs': round((out[-1]['t'] - out[0]['t']) / 1000, 1)})
            check(fin['st'] == 'idle' and dsim < 0.5 and 'Stoppet båten' in logl, 'she stops where the simulation stops, and the log says «Stoppet båten»', {'d': round(dsim, 2), 'st': fin['st'], 'drifting': fin['drv']})
            # 3. on to the point at sea: exactly on the last waypoint, never past it
            await pg.evaluate("""(async () => { S.draft = [{x:%f / 1000, y:%f / 1000}]; doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); })()""" % tuple(sea['q2']))
            out = await follow(pg, lambda s: s['st'] == 'idle' and not s['trk'] and math.hypot(s['x'] - sea['q2'][0], s['z'] - sea['q2'][1]) < 50, n=700)
            print('part 3: %d samples, %.0f s since the start' % (len(out), time.time() - T0))
            await pg.wait_for_timeout(4000); out.append(await pg.evaluate(SAMPLE))   # (the frame after the stop: SwiftShader's frames come up to four seconds apart)
            ds = [math.hypot(s['x'] - sea['q2'][0], s['z'] - sea['q2'][1]) for s in out]
            near = [d for d in ds if d < 120]; rise = max([near[i] - near[i - 1] for i in range(1, len(near))] or [0])
            # (where the model stopped her, and the 3D boat where the simulation has her: lying still she drifts on from the stop, Fysikk 2,
            # about 0.1 m a game minute in this calm, and the frame after the stop comes some minutes later; 0.36 m on 19.10.2026)
            fin = out[-1]; dstop = math.hypot(fin['stop'][0] - sea['q2'][0], fin['stop'][1] - sea['q2'][1]) if fin['stop'] else 1e9
            d3 = math.hypot(fin['x'] - fin['live'][0], fin['z'] - fin['live'][1])
            check(dstop < 0.3 and d3 < 0.3 and rise < 0.2, 'at the end of the route she stops exactly on the last waypoint, without running past and coming back', {'stop': round(dstop, 2), 'd3d': round(d3, 2), 'd': round(ds[-1], 2), 'rise': round(rise, 2), 'drifting': fin['drv']})
        # 4. the chart plotter: the boat where she is between the minutes (a leg of 0.8 km at sea, or on from wherever she is)
        await pg.evaluate("(() => { if (S.boat.status !== 'sailing'){ const o = S.boat.pos; for (const a of [0, 1.57, 3.14, 4.71]){ const q = {x:o.x + Math.sin(a) * 0.8, y:o.y - Math.cos(a) * 0.8}; if (!isLand(q) && legClear(o, q)){ S.draft = [q]; break; } } doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); } })()")
        await pg.wait_for_timeout(3000)
        await pg.evaluate("G3.show(false)"); await pg.wait_for_timeout(600)
        ch = []
        for _ in range(4):
            ch.append(await pg.evaluate("""(() => { const g = [...document.querySelectorAll('#gDyn path.boat')].pop(), m = g && g.parentNode.getAttribute('transform').match(/translate\\(([-\\d.e]+) ([-\\d.e]+)\\)/);
              return {st:S.boat.status, t:S.t, m:m ? [+m[1], +m[2]] : null, pos:[S.boat.pos.x, S.boat.pos.y]}; })()"""))
            await pg.wait_for_timeout(450)
        moved = sum(1 for i in range(1, len(ch)) if ch[i]['m'] and ch[i - 1]['m'] and ch[i]['m'] != ch[i - 1]['m'] and ch[i]['t'] == ch[i - 1]['t'])
        check(ch[0]['st'] == 'sailing' and moved >= 2, 'the chart plotter moves the boat between the simulation\'s minutes', {'moved': moved, 'st': ch[0]['st']})
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
