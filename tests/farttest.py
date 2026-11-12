"""The fairway (Ø11.8, core/05e-sjovei.js; docs/systemer/sjofart-og-lover.md kap. 9): the speed limits and the cardinal marks, without 3D.
The fixed limit in the harbours (V4 A, src/data/fart.json) and Kystverket's areas (fart-r): the lookup at a harbour, off it and in
Bergen, Stavanger and Tromsø, the chart plotter with no line, ring or sign, Autonav through a harbour's water without stopping there (the manoeuvring model: at her cruising speed
outside, down to the limit inside), the minute step's speed (sailV, as with the game closed), and by hand at full speed through the same
water: the strip's third line says «Fartsgrense», and the passage is a line in the log and a row in the Sikkerhet card, once. Then a
north cardinal mark passed close on its south side by hand: «Feil side av merket», the log and the card; passed on its north side: nothing.
And an iron stake whose arrow (viser) points north (steg 107): passed on its south side by hand, the same; on its north side, or on
Autonav, nothing. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# a calm summer day, and a straight way through a harbour's water that does not go to the harbour: a chord of the limit's circle 250 m
# off the harbour point, a kilometre and a half to each side, clear of the ground, of other harbours' water outside it and of the land
CHORD = """async (ids) => { S.t = Math.round((Date.UTC(2027, 5, 15, 11, 0) - EPOCH) / 6e4); WX_FORCE = {w:3, d:200}; const hv = FART_D.havn;
  for (const id of ids || ['husoy', 'botnhamn', 'senjahopen', 'finnsnes'].concat(PORTS.map(q => q.id))){ const pt = PORTS.find(q => q.id === id); if (!pt) continue; await mapNeed(pt.p, MAPD.simR);
    const gs = gridScale(pt.p), r = hv.r * gs;
    for (let a = 0; a < 360; a += 15){ const th = a * Math.PI / 180, ux = Math.sin(th), uy = -Math.cos(th), ox = -uy * 0.25 * gs, oy = ux * 0.25 * gs;
      const st = {x:pt.p.x + ox - ux * 1.5 * gs, y:pt.p.y + oy - uy * 1.5 * gs}, end = {x:pt.p.x + ox + ux * 1.5 * gs, y:pt.p.y + oy + uy * 1.5 * gs};
      if (isLand(st) || isLand(end) || groundCheck(st, end) || fartAt(st, S.t / 60) || fartAt(end, S.t / 60)) continue;
      // (and real water the whole way, three metres or more: in a harbour's pocket groundCheck does not look, but the hand on the helm meets the ground)
      let other = false; for (let k = 0; k <= 300; k++){ const q = {x:st.x + (end.x - st.x) * k / 300, y:st.y + (end.y - st.y) * k / 300}, f = fartAt(q, S.t / 60); if ((f && f.id !== 'h' + pt.id) || isLand(q) || !(depthF(q) > 3)) other = true; }
      if (other) continue;
      return {id:pt.id, name:pt.name, p:pt.p, st, end, hd:th, r, gs}; } }
  return null; }"""
PLACE = """([C, v]) => { acc = 0; const b = S.boat; b.port = null; b.anch = null; b.hove = null; b.gop = null; b.pos = {x:C.st.x, y:C.st.y}; b.heading = C.hd; b.v = v; b.status = 'sailing'; b.dyn = null; DYN.line = null; DYN.dep = null;
  S.plan = null; S.trail = []; if (S.helm) S.helm.on = false; FART.over = null; FART.done = null; FART.w = null; SJV.at = -1; return 1; }"""
# one sample: where she is against the harbour point (true m), her speed over the ground, the limit there, the warning and the strip
SAMPLE = """(C) => { const live = dynLive(), q = live ? dynPose() : null, p = q ? {x:q.x, y:q.y} : S.boat.pos, v = q ? q.sog / KN_MS : S.boat.v, f = fartAt(p, S.t / 60), w = farvWarn();
  const nx = document.querySelector('#hud .st.nx');
  return {d:Math.round(dist(p, C.p) / C.gs * 1000), v:+v.toFixed(2), kn:f ? f.kn : 0, w:w ? w.k : '', l3:nx ? nx.textContent : '', hud:(document.getElementById('hud') || {}).textContent || '', st:S.boat.status, live,
    xte:Math.round(((p.x - C.st.x) * Math.cos(C.hd) + (p.y - C.st.y) * Math.sin(C.hd)) / C.gs * 1000), hd:Math.round((q ? q.hd : S.boat.heading) * 180 / Math.PI), past:(p.x - C.end.x) * Math.sin(C.hd) - (p.y - C.end.y) * Math.cos(C.hd) > -0.2 * C.gs, n:FART.rows, cap:+(sjvCapV() < 1e8 ? sjvCapV() / KN_MS : 0).toFixed(1)}; }"""


# the hand on the wheel: the rudder towards a point 150 m on along the line (the wind and the stream set her off it else)
STEER = """(C) => { if (!helmOn()) return; const q = dynLive() ? dynPose() : {x:S.boat.pos.x, y:S.boat.pos.y, hd:S.boat.heading}, ux = Math.sin(C.hd), uy = -Math.cos(C.hd), s = (q.x - C.st.x) * ux + (q.y - C.st.y) * uy + 0.15 * C.gs;
  const tx = C.st.x + ux * s, ty = C.st.y + uy * s; let e = Math.atan2(tx - q.x, -(ty - q.y)) - q.hd; e = Math.atan2(Math.sin(e), Math.cos(e)); S.helm.thr = 1; S.helm.rud = Math.max(-1, Math.min(1, e * 3)); }"""


async def sail(pg, C, secs, hand=False):
    out = []
    for _ in range(secs * 2):
        if hand: await pg.evaluate(STEER, C)
        s = await pg.evaluate(SAMPLE, C); out.append(s)
        if s['past'] or s['st'] != 'sailing': break
        await pg.wait_for_timeout(500)
    return out


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)

        # 1. the lookup
        L = await pg.evaluate("""() => { const pt = PORTS.find(q => q.id === 'husoy'), H = S.t / 60; return {d:FART_D, at:fartAt({x:pt.p.x, y:pt.p.y}, H), off:fartAt({x:pt.p.x, y:pt.p.y - 3}, H), all:PORTS.filter(q => !fartAt({x:q.p.x, y:q.p.y}, H)).length, n:PORTS.length}; }""")
        check(L['d']['havn']['kn'] == 5 and L['at'] and L['at']['kn'] == 5 and L['at']['k'] == 'havn' and L['off'] is None, 'fartsgrensa: 5 knop i havna (Husøy), ingen tre kilometer til havs', (L['at'], L['off']))
        check(L['all'] == 0 and L['n'] > 100, 'alle havnene langs kysten har grensa', (L['n'], L['all']))

        # 2. Kystverket's areas (fart-r, fetched late as the models) and the chart plotter: no line, no ring, no sign anywhere (Jonas
        # 12.11.2026: «Jeg hater den ringen i kartet da», and «enig» to no line for the areas either)
        await pg.wait_for_function("fartRuns() !== null", timeout=120000)
        G = await pg.evaluate("""() => { const H = (Date.UTC(2027, 10, 10, 12) - EPOCH) / 3.6e6, f = (la, lo) => fartAt(P(la, lo), H), tr = PORTS.find(q => /^Tromsø/.test(q.name));
          return {n:(fartRuns() || []).length, bergen:f(60.3968, 5.3205), stavanger:f(58.9735, 5.7290), tromso:fartAt({x:tr.p.x, y:tr.p.y}, H)}; }""")
        check(G['n'] >= 70 and G['bergen'] and G['bergen']['kn'] == 5 and G['bergen']['k'] == 'omr' and G['stavanger'] and G['stavanger']['kn'] == 8 and G['tromso'] and G['tromso']['k'] == 'havn',
              'Kystverkets områder er lastet: Vågen i Bergen 5 knop, Stavanger havnebasseng 8, Tromsø havnas 5', G)
        await pg.evaluate("() => { S.settings.plotter = false; openPlotter(); renderBase(); }")
        await pg.wait_for_function("document.body.classList.contains('vplot')", timeout=60000)
        seen = []
        for la, lo, hh in ((60.3968, 5.3205, 3), (59.05, 10.40, 12), (0, 0, 3)):
            await pg.evaluate("async ([la, lo, hh]) => { const c = la ? P(la, lo) : PORTS.find(q => q.id === 'husoy').p; await mapNeed(c, 2); view.cx = c.x; view.cy = c.y; view.z = MAP_H / hh; applyView(); renderStatic(); }", [la, lo, hh])
            await pg.wait_for_timeout(600)
            seen.append(await pg.evaluate("() => document.querySelectorAll('.fart-o, .fart-s, .fart-h').length + (typeof fartSvg === 'function' ? 100 : 0)"))
        check(seen == [0, 0, 0], 'kartplotteren tegner ingen linje, ring eller skilt for fartsgrensene (Bergen, Færder, Husøy)', seen)
        await pg.evaluate("() => { if (typeof closePlotter === 'function') closePlotter(); else document.body.classList.remove('vplot'); }")

        C = await pg.evaluate(CHORD, None)
        check(bool(C), 'en rett vei gjennom en havns vann uten å gå til havna er funnet', C and C['name'])
        if not C: print('sidefeil', errs); await b.close(); return
        R = C['r'] / C['gs'] * 1000   # the limit's radius in true metres

        # 3. Autonav through: at her cruising speed outside, at the limit well inside (she slows before the edge, so 60 m in is enough)
        vc = await pg.evaluate("Math.min(BOAT.vcruise || 6, 8)")
        await pg.evaluate(PLACE, [C, vc])
        await pg.evaluate("([C, v]) => { S.plan = {wps:[{x:C.end.x, y:C.end.y, port:null, fish:0}], idx:0, speed:v, returning:false, unsafe:[false]}; }", [C, vc])
        A = await sail(pg, C, 150)
        outs = [s['v'] for s in A if s['d'] > R + 250 and s['live']]; ins = [s for s in A if s['d'] < R - 60 and s['live']]
        check(vc > 5.5 and len(outs) > 3 and max(outs) > 5.6, 'Autonav utenfor grensa: marsjfarten', {'vc': vc, 'max': max(outs) if outs else None, 'n': len(outs)})
        check(len(ins) > 3 and max(s['v'] for s in ins) <= 5.25, 'Autonav inne i havnas vann: ikke over 5 knop', {'max': max(s['v'] for s in ins) if ins else None, 'min': min(s['v'] for s in ins) if ins else None, 'n': len(ins)})
        check(all(not s['w'] for s in A) and A[-1]['n'] == 0, 'på Autonav kommer det ikke noe varsel og ingen rad', [s['w'] for s in A if s['w']][:3])
        after = [s['v'] for s in A if s['d'] > R + 150 and A.index(s) > len(A) // 2]
        check(len(after) > 0 and max(after) > 5.5, 'ute av havnas vann igjen går hun opp i marsjfart', max(after) if after else None)

        # 4. the minute step (the game closed, or the model off): sailV in the harbour's water and outside it
        M = await pg.evaluate("""(C) => { const b = S.boat, keep = {pos:b.pos, v:b.v, st:b.status, plan:S.plan}; b.status = 'sailing'; S.plan = {wps:[{x:C.end.x, y:C.end.y, port:null, fish:0}], idx:0, speed:BOAT.vcruise, returning:false, unsafe:[false]};
          const at = k => { b.pos = {x:C.st.x + (C.end.x - C.st.x) * k, y:C.st.y + (C.end.y - C.st.y) * k}; b.v = BOAT.vcruise; let v = 0; for (let i = 0; i < 6; i++){ v = sailV(S.t / 60, 0.2); b.v = v; } return v; };
          const r = {out:at(0.05), mid:at(0.5), vc:BOAT.vcruise}; b.pos = keep.pos; b.v = keep.v; b.status = keep.st; S.plan = keep.plan; return r; }""", C)
        check(M['mid'] <= 5 and M['out'] > 5.5, 'minuttsteget (sailV): 5 knop i havnas vann, marsjfart utenfor', M)

        # 4b. the minute step in one of Kystverket's 5-knot areas, away from the harbours: inside, she is at the limit; 100 m west of its
        # edge, heading east into it, she is down to it before she comes in (fartLegKn); the time away is played the same way
        K5 = await pg.evaluate("""async () => { const D = FART_D, RR = fartRuns(), H = S.t / 60, b = S.boat, keep = {pos:b.pos, v:b.v, st:b.status, plan:S.plan, hd:b.heading};
          const far = q => PORTS.every(pt => dist(pt.p, q) > 1.5);
          for (let i = 0; i < D.omr.length; i++){ const a = D.omr[i]; if (a.kn !== 5 || a.s) continue; const T = RR[i];
            for (let y = 0; y < a.H; y += 7) for (let k = T.row[y]; k < T.row[y + 1]; k++){ const x0 = T.run[k * 2], x1 = T.run[k * 2 + 1]; if (x1 - x0 < 15) continue;
              const cy = (a.y0 + y + 0.5) * D.R / 1000, inP = {x:(a.x0 + (x0 + x1) / 2) * D.R / 1000, y:cy}, edge = {x:(a.x0 + x0) * D.R / 1000, y:cy}, out = {x:edge.x - 0.1, y:cy};
              if (!far(inP) || !far(out)) continue; await mapNeed(inP, 0); if (isLand(inP) || isLand(out) || fartAt(out, H)) continue;
              const v = p => { b.pos = {x:p.x, y:p.y}; b.v = BOAT.vcruise; b.status = 'sailing'; S.plan = {wps:[{x:p.x + 1, y:p.y, port:null, fish:0}], idx:0, speed:BOAT.vcruise, returning:false, unsafe:[false]}; let r = 0; for (let n = 0; n < 4; n++){ r = sailV(H, 0.2); b.v = r; } return r; };
              const r = {name:a.n, inside:v(inP), before:v(out), open:(() => { b.pos = {x:out.x - 1.5, y:cy}; return fartAt(b.pos, H); })(), vc:BOAT.vcruise};
              b.pos = keep.pos; b.v = keep.v; b.status = keep.st; S.plan = keep.plan; b.heading = keep.hd; return r; } }
          b.pos = keep.pos; b.v = keep.v; b.status = keep.st; S.plan = keep.plan; return null; }""")
        check(bool(K5) and K5['vc'] > 5.5 and K5['inside'] <= 5 and K5['before'] <= 5, 'minuttsteget i et av Kystverkets 5-knopsområder: 5 inne, og nede i 5 alt 100 m før kanten', K5)

        # 5. by hand at full speed through the same water: the strip says so, and the passage is written once
        n0 = await pg.evaluate("() => ({t:S.t, mobs:(S.farv || []).length})")   # (the log is trimmed by age: its lines are found by their time)
        await pg.evaluate(PLACE, [C, 6])
        ok = await pg.evaluate("() => { S.settings.manual = true; const t = helmTake(); S.helm.thr = 1; S.helm.rud = 0; return [t, helmOn()]; }")
        Hd = await sail(pg, C, 150, True)
        ins = [s for s in Hd if s['d'] < R - 60]; fast = [s for s in ins if s['v'] > 5.6]
        check(ok[1] and len(fast) > 3, 'for hånd med full gass går hun over grensa inne i havnas vann', {'helm': ok, 'max': max((s['v'] for s in ins), default=None), 'n': len(fast)})
        check(any(s['w'] == 'fart' for s in fast) and any('Fartsgrense 5' in s['l3'] or 'Fartsgrense 5' in s['hud'] for s in fast), 'stripa sier «Fartsgrense 5 …» mens hun er over', next((s['l3'] for s in fast if s['w'] == 'fart'), None))
        # (the look is a real second apart: the words may stand that long after the edge)
        check(all(s['w'] != 'fart' for s in Hd if s['d'] > R + 40), 'utenfor havnas vann er det ikke noe varsel', [(s['d'], s['w']) for s in Hd if s['d'] > R + 40 and s['w']][:4])
        W = await pg.evaluate("""(n0) => { const lg = S.log.filter(l => l.t >= n0.t && /fartsgrensa/.test(l.no)), mb = (S.farv || []).slice(n0.mobs).filter(r => r.k === 'fart'), rows = mobSafeRows(25).filter(r => r.k === 'fart');
          return {log:lg.map(l => l.no), en:lg.map(l => l.en), mobs:mb, rows:rows.map(r => [r.what[0], r.learn[2]]), n:FART.rows}; }""", n0)
        check(len(W['log']) == 1 and 'der fartsgrensa er 5 knop' in W['log'][0] and C['name'] in W['log'][0], 'én linje i dagboka om passeringen, med havna', W['log'])
        check(len(W['mobs']) == 1 and W['mobs'][0]['kn'] == 5 and W['mobs'][0]['v'] > 6 and len(W['rows']) >= 1 and '§ 2' in W['rows'][0][1], 'én rad i Sikkerhet-kortet med farten, grensa og kilden', (W['mobs'], W['rows'][:1]))
        cash = await pg.evaluate("S.cash")

        # 6. a north cardinal mark in open water, passed 80 m south of it by hand (the wrong side), then 80 m north of it
        K = await pg.evaluate("""async (C) => { const gs = C.gs, g = gridGamma(C.st) * Math.PI / 180; let m = null;
          for (let a = 0; a < 360 && !m; a += 20) for (const k of [3, 4, 5]){ const q = {x:C.p.x + Math.sin(a * Math.PI / 180) * k * gs, y:C.p.y - Math.cos(a * Math.PI / 180) * k * gs}; await mapNeed(q, MAPD.simR);
            const w = {x:q.x - 0.8 * gs, y:q.y}, e = {x:q.x + 0.8 * gs, y:q.y}; let free = !isLand(q) && !fartAt(q, S.t / 60) && !groundCheck({x:w.x, y:w.y - 0.15}, {x:e.x, y:e.y - 0.15}) && !groundCheck({x:w.x, y:w.y + 0.15}, {x:e.x, y:e.y + 0.15});
            if (free && !marksNear('marks', q.x, q.y, 1).some(mk => (mk[2] === 'C' || mk[2] === 'S') && dist({x:mk[0], y:mk[1]}, q) < 0.6)){ m = q; break; } }
          if (!m) return null; SEAMARKS.marks.push([m.x, m.y, 'C', 'north']); MARKS.near.clear();
          // (true east from the mark: the bearing 90 degrees less the convergence; south of it is +90 on from that)
          const E = Math.PI / 2 - g, ex = Math.sin(E), ey = -Math.cos(E), sx = -ey, sy = ex;   // (sx, sy: true south in the grid, y down)
          const leg = o => ({p:m, gs, hd:E, st:{x:m.x - ex * 0.6 * gs + sx * o * gs, y:m.y - ey * 0.6 * gs + sy * o * gs}, end:{x:m.x + ex * 0.6 * gs + sx * o * gs, y:m.y + ey * 0.6 * gs + sy * o * gs}});
          return {m, south:leg(0.08), north:leg(-0.08)}; }""", C)
        check(bool(K), 'et nordmerke er satt ut i åpent vann', K and K['m'])
        if K:
            for side, want in (('south', True), ('north', False)):
                n1 = await pg.evaluate("() => ({t:S.t, mobs:(S.farv || []).length, n:FART.nMk})")
                await pg.evaluate(PLACE, [K[side], 6])
                await pg.evaluate("() => { FART.mk.clear(); helmTake(); S.helm.thr = 1; S.helm.rud = 0; }")
                T = await sail(pg, K[side], 90, True)
                near = [s for s in T if s['d'] < 150]
                X = await pg.evaluate("(n1) => ({log:S.log.filter(l => l.t >= n1.t && /merke på feil side/.test(l.no)).map(l => l.no), mobs:(S.farv || []).slice(n1.mobs).filter(r => r.k === 'merke').length, n:FART.nMk - n1.n})", n1)
                if want:
                    check(len(near) > 2 and any(s['w'] == 'merke' for s in near) and any('Feil side av merket' in s['l3'] or 'feil side av merket' in s['hud'] for s in near), 'sør for nordmerket: stripa sier «feil side av merket»', next((s['l3'] for s in near if s['w'] == 'merke'), [s['d'] for s in T][:8]))
                    check(len(X['log']) == 1 and 'nordmerke' in X['log'][0] and X['mobs'] == 1, 'én linje i dagboka og én rad i Sikkerhet-kortet', X)
                else:
                    check(len(near) > 2 and all(s['w'] != 'merke' for s in T) and X['n'] == 0 and not X['log'], 'nord for nordmerket: ikke noe varsel og ingen rad', X)
        # 7. an iron stake with its arrow (viser) pointing true north, in open water away from the cardinal mark (steg 107): passed
        # 80 m south of it by hand (the side the arrow points away from: the bearing from the stake to her more than 90 degrees from the
        # arrow's), «Feil side av merket», one line in the log and one row in the card; 80 m north of it, nothing; on Autonav on the wrong
        # side, nothing
        D = await pg.evaluate("""async ([C, K]) => { const gs = C.gs, g = gridGamma(C.st) * Math.PI / 180, cm = K && K.m; let m = null;
          for (let a = 10; a < 370 && !m; a += 20) for (const k of [3, 4, 5, 6]){ const q = {x:C.p.x + Math.sin(a * Math.PI / 180) * k * gs, y:C.p.y - Math.cos(a * Math.PI / 180) * k * gs}; await mapNeed(q, MAPD.simR);
            if (cm && dist(q, cm) < 1.6 * gs) continue;
            const w = {x:q.x - 0.8 * gs, y:q.y}, e = {x:q.x + 0.8 * gs, y:q.y}; let free = !isLand(q) && !fartAt(q, S.t / 60) && !groundCheck({x:w.x, y:w.y - 0.15}, {x:e.x, y:e.y - 0.15}) && !groundCheck({x:w.x, y:w.y + 0.15}, {x:e.x, y:e.y + 0.15});
            if (free && !marksNear('marks', q.x, q.y, 1).some(mk => (mk[2] === 'C' || mk[2] === 'S' || typeof mk[4] === 'number') && dist({x:mk[0], y:mk[1]}, q) < 0.8)){ m = q; break; } }
          if (!m) return null; SEAMARKS.marks.push([m.x, m.y, 'D', '', 0]); MARKS.near.clear();
          const E = Math.PI / 2 - g, ex = Math.sin(E), ey = -Math.cos(E), sx = -ey, sy = ex;
          const leg = o => ({p:m, gs, hd:E, st:{x:m.x - ex * 0.6 * gs + sx * o * gs, y:m.y - ey * 0.6 * gs + sy * o * gs}, end:{x:m.x + ex * 0.6 * gs + sx * o * gs, y:m.y + ey * 0.6 * gs + sy * o * gs}});
          return {m, south:leg(0.08), north:leg(-0.08)}; }""", [C, K])
        check(bool(D), 'en stake med viser mot nord er satt ut i åpent vann', D and D['m'])
        if D:
            for side, how, want in (('south', 'hand', True), ('north', 'hand', False), ('south', 'auto', False)):
                n1 = await pg.evaluate("() => ({t:S.t, mobs:(S.farv || []).length, n:FART.nMk})")
                await pg.evaluate(PLACE, [D[side], 6])
                if how == 'hand':
                    await pg.evaluate("() => { FART.mk.clear(); helmTake(); S.helm.thr = 1; S.helm.rud = 0; }")
                else:
                    await pg.evaluate("(C) => { FART.mk.clear(); S.plan = {wps:[{x:C.end.x, y:C.end.y, port:null, fish:0}], idx:0, speed:6, returning:false, unsafe:[false]}; }", D[side])
                T = await sail(pg, D[side], 90, how == 'hand')
                near = [s for s in T if s['d'] < 150]
                X = await pg.evaluate("(n1) => ({log:S.log.filter(l => l.t >= n1.t && /på feil side/.test(l.no)).map(l => l.no), rows:mobSafeRows(25).filter(r => r.t >= n1.t && r.k === 'stake').map(r => [r.what[0], r.learn[2]]), mobs:(S.farv || []).slice(n1.mobs).filter(r => r.k === 'stake').length, n:FART.nMk - n1.n})", n1)
                if want:
                    check(len(near) > 2 and any(s['w'] == 'stake' for s in near) and any('Feil side av merket' in s['l3'] or 'feil side av merket' in s['hud'] for s in near), 'sør for staken med viser mot nord: stripa sier «feil side av merket»', next((s['l3'] for s in near if s['w'] == 'stake'), [(s['d'], s['w']) for s in T][:8]))
                    check(len(X['log']) == 1 and 'stake' in X['log'][0] and 'nord' in X['log'][0] and X['mobs'] == 1 and len(X['rows']) == 1 and 'Kystverket' in X['rows'][0][1], 'én linje i dagboka og én rad i Sikkerhet-kortet, med kilden', X)
                elif how == 'hand':
                    check(len(near) > 2 and all(s['w'] not in ('stake', 'merke') for s in T) and X['n'] == 0 and not X['log'], 'nord for staken (der viseren peker): ikke noe varsel og ingen rad', X)
                else:
                    check(len(near) > 2 and all(not s['w'] for s in T) and X['n'] == 0 and not X['log'], 'på Autonav sør for staken: ikke noe varsel og ingen rad', ([(s['d'], s['w']) for s in T if s['w']][:4], X))
        cash2 = await pg.evaluate("S.cash")
        check(cash == cash2, 'ingen bot: kassa er urørt (V1 A)', (cash, cash2))
        print('sidefeil', errs)
        await b.close()

if __name__ == '__main__': asyncio.run(main())
