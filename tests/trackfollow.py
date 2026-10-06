"""The 3D boat on the route (06.10.2026; view3d.js trkOn/trkStep, core haltPlan, ui renderDyn with livePose). Jonas: «båten strengt må
følge rutestreken som lages i kartplotteren», «ganske nøyaktige kursendringer», «stoppe på nøyaktig den plassen siste endepunkt er …
slakker av og stopper nøyaktig der den skal», Stopp underway not «bråstoppe», and the own boat on the chart updated more often.
1. Senjahopen, from the plant's quay to the rorbu rb129 (tilbakemelding #3: she hung at the plant's quay): out from the quay, along the
   line, in to the rorbu's berth, lines on.
2. Out to sea, then «Stopp» underway: she slacks off gradually and stops where the simulation stops.
3. On to a point at sea: she stops exactly on the last waypoint, without running past it.
4. The chart plotter draws the boat where she is between the simulation's minutes.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, math
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


SAMPLE = """(() => { const D = G3._debug, b = S.boat, T = D.trk;
  return {st:b.status, port:b.port || null, x:D.bv.px, z:D.bv.pz, hd:D.bv.cog, spd:D.bv.spd, sim:[b.pos.x * 1000, b.pos.y * 1000], mo:D.MO.phase,
    trk:T ? {s:T.s, v:T.v, end:T.end, done:T.done, n:T.P.length, P:T.P} : null, t:performance.now()}; })()"""


def seg_dist(P, x, z):
    """distance from (x, z) to the polyline P, and how far along it the nearest point is"""
    best, bs, acc = 1e18, 0, 0
    for i in range(1, len(P)):
        ax, az = P[i - 1]; cx, cz = P[i]; vx, vz = cx - ax, cz - az; l2 = vx * vx + vz * vz or 1
        u = max(0, min(1, ((x - ax) * vx + (z - az) * vz) / l2)); d = math.hypot(x - ax - u * vx, z - az - u * vz)
        if d < best: best, bs = d, acc + u * math.sqrt(l2)
        acc += math.sqrt(l2)
    return best, bs


async def follow(pg, until, n=400, dt=200):
    """samples until until(sample) or n samples; returns the samples"""
    out = []
    for _ in range(n):
        await pg.wait_for_timeout(dt)
        s = await pg.evaluate(SAMPLE); out.append(s)
        if until(s): break
    return out


def along(out):
    """the worst distance off the line she follows, and the worst step backwards along it, over the samples with one line"""
    off, back, P, last = 0, 0, None, None
    for s in out:
        if not s['trk']: continue
        if P is None or s['trk']['P'] != P: P, last = s['trk']['P'], None
        d, a = seg_dist(P, s['x'], s['z']); off = max(off, d)
        if last is not None: back = max(back, last - a)
        last = a
    return off, back


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        # 1. the plant's quay in Senjahopen to the rorbu rb129, the route the chart plotter draws (Autonav)
        r = await pg.evaluate("""(async () => { const b = S.boat; b.status = 'port'; b.port = 'senjahopen'; b.shift = null; b.berth = null; S.plan = null; S.draft = []; S.tut = 0;
          const bp = berthPose('senjahopen', b.type); b.pos = {...portById('senjahopen').p}; b.heading = bp.hd; rorbuSite('rb129'); const R = RBID.get('rb129');
          view.z = Math.max(view.z, 3); setTab('route'); await leiaTo({x:R.p.x, y:R.p.y}); return {n:S.draft.length, last:(S.draft[S.draft.length - 1] || {}).port || null}; })()""")
        await pg.evaluate("G3.show(true)"); await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(2500)
        await pg.evaluate("(() => { doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); })()")
        out = await follow(pg, lambda s: s['st'] == 'port' and s['port'] == 'rb129' and s['mo'] == 'moored' and not s['trk'], n=500)
        end = await pg.evaluate("""(() => { const D = G3._debug, b = S.boat, bp = berthPose('rb129', b.type, 'main') || berthPose('rb129', b.type);
          return {d:Math.hypot(D.bv.px - bp.x * 1000, D.bv.pz - bp.y * 1000), dh:Math.abs(((D.bv.cog - bp.hd) * 180 / Math.PI + 540) % 360 - 180), st:b.status, port:b.port, mo:D.MO.phase}; })()""")
        off, back = along(out)
        first = next((s for s in out if s['trk']), None); x0 = (out[0]['x'], out[0]['z'])
        # by the time the simulation is 150 m out from the harbour point, she is under way out from the quay (measured against the
        # simulation, not the clock: the page here stalls for 10-20 s at a time while SwiftShader draws, and the clock with it)
        s0 = out[0]['sim']; i0 = next((i for i, s in enumerate(out) if math.hypot(s['sim'][0] - s0[0], s['sim'][1] - s0[1]) > 150), None)
        left = out[i0]['trk']['s'] if i0 is not None and out[i0]['trk'] else None
        dock = next((i for i, s in enumerate(out) if s['st'] == 'port' and s['port'] == 'rb129'), None)
        check(r['n'] > 0 and r['last'] == 'rb129' and first is not None, 'Autonav makes a route to the rorbu, and the 3D boat takes it as a line out from the quay', {'wps': r['n'], 'line': first and first['trk']['n']})
        check(left is not None and left > 30, 'she is more than 30 m out from the plant\'s quay along her line when the simulation is 150 m out (#3: she hung there)', {'s': left and round(left, 1)})
        check(off < 3.5 and back < 0.6, 'she keeps to the line all the way, at most 3.5 m off it in the corners, and never goes back along it', {'off': round(off, 2), 'back': round(back, 2)})
        check(end['st'] == 'port' and end['port'] == 'rb129' and end['mo'] == 'moored' and end['d'] < 0.3 and end['dh'] < 3, 'she comes in to the rorbu\'s berth, exactly, and the lines go on', {k: (round(v, 2) if isinstance(v, float) else v) for k, v in end.items()})
        # in at the berth: her line is done (the lines going on after it run on the frames' own clock)
        inb = next((i for i, s in enumerate(out) if dock is not None and i >= dock and not s['trk']), None)
        after = inb is not None and (out[inb]['t'] - out[dock]['t']) / 1000
        check(inb is not None and after < 60, 'she is in at the berth within a minute of the simulation docking', {'after': after and round(after, 1)})
        # 2. out to sea, Stopp underway: slack off, stop where the simulation stops
        sea = await pg.evaluate("""(async () => { const o = portById('rb129').p; let best = null;
          for (let k = 0; k < 24; k++){ const a = k / 24 * 2 * Math.PI, q = {x:o.x + Math.sin(a) * 1.6, y:o.y - Math.cos(a) * 1.6}; if (isLand(q) || depthF(q) < 15) continue; const q2 = {x:o.x + Math.sin(a) * 2.4, y:o.y - Math.cos(a) * 2.4};
            if (!isLand(q2) && depthF(q2) > 15 && legClear(q, q2)){ best = {q, q2}; break; } }
          if (!best) return null; S.draft = []; await leiaTo(best.q); S.draft.push({x:best.q2.x, y:best.q2.y}); return {n:S.draft.length, q2:[best.q2.x * 1000, best.q2.y * 1000]}; })()""")
        if not sea:
            check(False, 'a point at sea 1.6-2.4 km from the rorbu, for the stop and the end of a route')
        else:
            await pg.evaluate("(() => { doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); })()")
            out = await follow(pg, lambda s: s['st'] == 'sailing' and s['trk'] and s['trk']['v'] > 12 and s['trk']['s'] > 250, n=400)
            v0 = out[-1]['trk']['v'] if out[-1]['trk'] else 0
            await pg.evaluate("doAct({dataset:{act:'stop'}, disabled:false})")
            out = await follow(pg, lambda s: s['st'] == 'idle' and not s['trk'], n=300)
            vs = [s['spd'] for s in out]; drops = [(vs[i - 1] - vs[i]) / max(0.2, (out[i]['t'] - out[i - 1]['t']) / 1000) for i in range(1, len(vs))]
            fin = out[-1]; dsim = math.hypot(fin['x'] - fin['sim'][0], fin['z'] - fin['sim'][1])
            logl = await pg.evaluate("S.log.slice(-6).map(l => JSON.stringify(l)).join(' | ')")
            check(v0 > 12 and max(drops or [0]) < max(8, v0 / 3), 'Stopp underway: she slacks off gradually, not all at once', {'v0': round(v0, 1), 'worst m/s per s': round(max(drops or [0]), 1), 'secs': round((out[-1]['t'] - out[0]['t']) / 1000, 1)})
            check(fin['st'] == 'idle' and dsim < 0.5 and 'Stoppet båten' in logl, 'she stops where the simulation stops, and the log says «Stoppet båten»', {'d': round(dsim, 2), 'st': fin['st']})
            # 3. on to the point at sea: exactly on the last waypoint, never past it
            await pg.evaluate("""(async () => { S.draft = [{x:%f / 1000, y:%f / 1000}]; doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); })()""" % tuple(sea['q2']))
            out = await follow(pg, lambda s: s['st'] == 'idle' and not s['trk'] and math.hypot(s['x'] - sea['q2'][0], s['z'] - sea['q2'][1]) < 50, n=500)
            ds = [math.hypot(s['x'] - sea['q2'][0], s['z'] - sea['q2'][1]) for s in out]
            near = [d for d in ds if d < 120]; rise = max([near[i] - near[i - 1] for i in range(1, len(near))] or [0])
            check(ds[-1] < 0.3 and rise < 0.2, 'at the end of the route she stops exactly on the last waypoint, without running past and coming back', {'d': round(ds[-1], 2), 'rise': round(rise, 2)})
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
