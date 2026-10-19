"""The manoeuvring model (core/16b-dyn.js, Fysikk 1, Jonas 18.10.2026): every vessel's calibration against what boats do (time to
speed, the turning circle at full rudder between 1.2 and 2.5 lengths, the tactical diameter and advance against IMO's 5 and 4.5
lengths, the way she needs to stop), then the autopilot live on a short route at sea west of Senja (she keeps the line, turns the
corner on her own radius, passes the waypoints, stands exactly on the end, and the minute step does not move her a second time), and
the helm by hand on the same model. KYST_LITE=1 python3 tests/dyntest.py. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, math
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


def seg_dist(P, x, y):
    best = 1e18
    for i in range(1, len(P)):
        ax, ay = P[i - 1]; cx, cy = P[i]; vx, vy = cx - ax, cy - ay; l2 = vx * vx + vy * vy or 1
        u = max(0, min(1, ((x - ax) * vx + (y - ay) * vy) / l2)); best = min(best, math.hypot(x - ax - u * vx, y - ay - u * vy))
    return best


ST = "(() => { const b = S.boat, d = b.dyn || {}; return {pt:performance.now(), st:b.status, x:b.pos.x * 1000, y:b.pos.y * 1000, hd:b.heading, v:b.v, t:S.t, idx:S.plan ? S.plan.idx : null, u:d.u, sv:d.v, r:d.r, dl:d.dl, live:dynLive(), rate:simRate()}; })()"


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        # 1. the calibration of every vessel
        cal = await pg.evaluate("""() => Object.keys(VESSELS).map(k => { const c = dynCal(k), V = c.V, L = V.len, t = c.turn, kn = 1 / KN_MS;
          return {k, L, t90:+c.acc.t90.toFixed(0), ueq:+(c.acc.ueq * kn).toFixed(1), vmax:V.vmax, RL:+(t.R / L).toFixed(2), advL:+(t.adv / L).toFixed(1), tdL:+(t.td / L).toFixed(1),
            T:+t.T.toFixed(1), K:+t.K.toFixed(3), stopL:+(dynStopDist(c, V.vcruise * KN_MS) / L).toFixed(1), Kp:+c.Kp.toFixed(2), Kd:+c.Kd0.toFixed(1), rs:+c.P.rs.toFixed(2)}; })""")
        print('  båt            L     t90  ueq/vmax   R/L  adv/L  td/L    T      K  stopp/L   Kp    Kd   ror')
        for c in cal:
            print(f"  {c['k']:12s} {c['L']:5.1f} {c['t90']:5d}s {c['ueq']:5.1f}/{c['vmax']:<5.1f} {c['RL']:5.2f} {c['advL']:6.1f} {c['tdL']:5.1f} {c['T']:5.1f} {c['K']:6.3f} {c['stopL']:7.1f} {c['Kp']:5.2f} {c['Kd']:5.1f} {c['rs']:5.2f}")
        bad = [c['k'] for c in cal if not (1.0 <= c['RL'] <= 2.7)]
        check(not bad, 'every vessel turns at full rudder on a radius between 1.0 and 2.7 lengths', bad)
        bad = [c['k'] for c in cal if c['tdL'] > 7.5 or c['advL'] > 7]
        check(not bad, 'the tactical diameter is under 7.5 lengths and the advance under 7 (IMO asks 5 and 4.5 of ships over 100 m; the planing boats and the big ones run wide into the turn)', bad)
        bad = [c['k'] for c in cal if c['ueq'] < 0.95 * c['vmax'] or c['ueq'] > 1.05 * c['vmax']]
        check(not bad, 'full throttle settles at the vessel\'s top speed', bad)
        bad = [c['k'] for c in cal if c['t90'] > (120 if c['L'] < 15 else 360)]
        check(not bad, 'she is up to 90 % of top speed within two minutes (six for the big ones)', bad)
        bad = [c['k'] for c in cal if c['stopL'] > 12]
        check(not bad, 'she stops gently from cruising speed within 12 lengths', bad)
        # 2. live: a route with a right-angle corner on open water west of Senja, the old wooden boat
        r = await pg.evaluate("""async () => { S.tut = 0; const b = S.boat, c0 = P(69.30, 16.70); await mapNeed(c0, 9);
          const open = c => { for (let r = 0.3; r <= 1.6; r += 0.3) for (let k = 0; k < 12; k++){ const a = k / 12 * 2 * Math.PI; if (isLand({x:c.x + Math.sin(a) * r, y:c.y - Math.cos(a) * r})) return false; } return !isLand(c); };
          let c = null; for (let r = 0; r <= 8 && !c; r += 0.5) for (let k = 0; k < 16 && !c; k++){ const a = k / 16 * 2 * Math.PI, q = {x:c0.x + Math.sin(a) * r, y:c0.y - Math.cos(a) * r}; if (open(q)) c = q; }
          if (!c) return null;
          b.status = 'idle'; b.port = null; b.pos = {x:c.x, y:c.y}; b.heading = 0; b.v = 0; b.dyn = null; S.plan = null; S.helm = null; S.draft = [];
          S.t = Math.round((Date.UTC(2027, 6, 15, 12) - EPOCH) / 6e4); WX_FORCE = {w:4, d:80};
          const A = {x:c.x, y:c.y - 0.5}, B = {x:c.x + 0.5, y:c.y - 0.5}, C = {x:c.x + 0.5, y:c.y - 0.9};
          S.draft = [A, B, C].map(q => ({x:q.x, y:q.y, port:null, fish:0})); S.draftSpeed = 6;
          doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click();
          return {st:b.status, type:b.type, line:[[c.x * 1000, c.y * 1000], [A.x * 1000, A.y * 1000], [B.x * 1000, B.y * 1000], [C.x * 1000, C.y * 1000]], cap:speedCap(hsAt(b.pos, S.t / 60))}; }""")
        if not r or r['st'] != 'sailing':
            check(False, 'a route from open water west of Senja is under way', r)
        else:
            P = r['line']; out = []; t0 = None
            for _ in range(900):
                await pg.wait_for_timeout(250)
                s = await pg.evaluate(ST); out.append(s)
                if s['st'] != 'sailing': break
            fin = out[-1]; end = P[-1]
            lives = [s for s in out if s['live']]
            vmax = max(s['v'] for s in out); cap = min(6, r['cap'])
            check(fin['st'] == 'idle' and math.hypot(fin['x'] - end[0], fin['y'] - end[1]) < 0.5, 'she sails the route and stands exactly on the last waypoint', {'st': fin['st'], 'd': round(math.hypot(fin['x'] - end[0], fin['y'] - end[1]), 2), 'samples': len(out), 'gmin': fin['t'] - out[0]['t']})
            check(len(lives) > len(out) * 0.8 and out[0]['rate'] == 6, 'the model has her all the way, on the shared clock', {'live': len(lives), 'n': len(out), 'rate': out[0]['rate']})
            check(vmax > 0.8 * cap and vmax <= cap * 1.05 + 0.2, 'she comes up to the route\'s speed (the sea\'s cap) and not over it', {'vmax': round(vmax, 2), 'cap': round(cap, 2)})
            # the line: off it by at most a few lengths in the corners, under 2 m on the straights
            cornerR = cal[[c['k'] for c in cal].index(r['type'])]['RL'] * cal[[c['k'] for c in cal].index(r['type'])]['L']
            offs = [seg_dist(P, s['x'], s['y']) for s in out]
            far = [o for s, o in zip(out, offs) if all(math.hypot(s['x'] - q[0], s['y'] - q[1]) > 3 * cornerR for q in P[1:3])]
            check(max(offs) < 0.6 * cornerR + 2 and (not far or max(far) < 2.5), 'she keeps to the line: within 0.6 radius + 2 m in the corners, 2.5 m on the straights', {'off': round(max(offs), 2), 'straight': round(max(far), 2) if far else None, 'R': round(cornerR, 1)})
            ds = [math.hypot(s['x'] - end[0], s['y'] - end[1]) for s in out]; near = [d for d in ds if d < 60]
            rise = max([near[i] - near[i - 1] for i in range(1, len(near))] or [0])
            check(rise < 0.3, 'she never runs past the end and comes back', {'rise': round(rise, 2)})
            drop = max([(out[i - 1]['v'] - out[i]['v']) / max(0.25, (out[i]['pt'] - out[i - 1]['pt']) / 1000) for i in range(1, len(out))] or [0])
            check(drop < 1.5, 'she slacks off gradually into the corner and the stop (at most 1.5 knots a real second, 0.13 m/s2 in game time)', {'worst kn/s': round(drop, 2)})
            # the minute step books but does not move her: the way she went matches her speed over the time
            dist = sum(math.hypot(out[i]['x'] - out[i - 1]['x'], out[i]['y'] - out[i - 1]['y']) for i in range(1, len(out)))
            gmin = fin['t'] - out[0]['t']; vmean = sum(s['v'] for s in out) / len(out) * 1852 / 60
            check(gmin > 0 and 0.75 < dist / max(1, vmean * gmin) < 1.25, 'the distance she went matches her speed over the game minutes (no second move by the minute step)', {'m': round(dist), 'expected': round(vmean * gmin), 'gmin': gmin})
            logl = await pg.evaluate("S.log.slice(-8).map(l => l.no || l.text || JSON.stringify(l)).join(' | ')")
            check('WP1 passert' in logl and 'WP2 passert' in logl, 'the waypoints are passed and logged', logl[-160:])
            nan = [s for s in out if any(isinstance(s[k], float) and math.isnan(s[k]) for k in ('x', 'y', 'hd', 'v'))]
            check(not nan, 'no NaN in the state', len(nan))
        # 2b. a planing hull on the same route at harbour speed, 6 knots (19.10.2026: with the cruising gains and slowing to 2 knots into
        # the corner the new 11 m sjark ran 70 m past it; now the gains go with the speed and she keeps a third of cruising speed in it)
        if r:
            q = await pg.evaluate("""async (c0) => { const b = S.boat, c = {x:c0[0] / 1000, y:c0[1] / 1000}; b.type = 'sjarkny'; applyVessel(); b.status = 'idle'; b.v = 0; b.dyn = null; S.plan = null; S.helm = null; b.pos = {x:c.x, y:c.y}; b.heading = 0;
              const A = {x:c.x, y:c.y - 0.5}, B = {x:c.x + 0.5, y:c.y - 0.5}, C = {x:c.x + 0.5, y:c.y - 0.9}; if ([A, B, C].some(isLand)) return null;
              S.draft = [A, B, C].map(q => ({x:q.x, y:q.y, port:null, fish:0})); S.draftSpeed = 6; doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click();
              return {st:b.status, line:[[c.x * 1000, c.y * 1000], [A.x * 1000, A.y * 1000], [B.x * 1000, B.y * 1000], [C.x * 1000, C.y * 1000]]}; }""", r['line'][0])
            if q and q['st'] == 'sailing':
                P2 = q['line']; out2 = []
                for _ in range(900):
                    await pg.wait_for_timeout(250); s = await pg.evaluate(ST); out2.append(s)
                    if s['st'] != 'sailing': break
                R2 = cal[[c['k'] for c in cal].index('sjarkny')]['RL'] * cal[[c['k'] for c in cal].index('sjarkny')]['L']
                offs2 = [seg_dist(P2, s['x'], s['y']) for s in out2]
                check(out2[-1]['st'] == 'idle' and max(offs2) < R2 + 4, 'the new 11 m sjark (planing) at 6 knots keeps to the line within a radius and 4 m through the corners, and stands on the end', {'off': round(max(offs2), 1), 'R': round(R2, 1), 'st': out2[-1]['st'], 'end': round(math.hypot(out2[-1]['x'] - P2[-1][0], out2[-1]['y'] - P2[-1][1]), 2)})
            else:
                check(False, 'a route for the planing hull is under way', q)
            await pg.evaluate("(() => { const b = S.boat; b.type = 'trebat'; applyVessel(); b.status = 'idle'; S.plan = null; b.dyn = null; })()")
        # 3. by hand on the same model: full ahead gathers way, the rudder turns her, neutral loses it
        h = await pg.evaluate("""() => { S.settings.manual = true; const b = S.boat; b.status = 'idle'; S.plan = null; helmTake(); S.helm.thr = 1; S.helm.rud = 0; return {on:helmOn(), v:S.helm.v}; }""")
        await pg.wait_for_timeout(8000)
        s1 = await pg.evaluate(ST)
        await pg.evaluate("S.helm.rud = 1"); await pg.wait_for_timeout(3000); s2 = await pg.evaluate(ST)
        await pg.evaluate("S.helm.rud = 0; S.helm.thr = 0"); await pg.wait_for_timeout(5000); s3 = await pg.evaluate(ST)
        turn = math.degrees((s2['hd'] - s1['hd'] + math.pi) % (2 * math.pi) - math.pi)
        check(h['on'] and s1['v'] > 2 and s1['live'], 'by hand: full ahead gathers way on the model', {'kn': round(s1['v'], 1), 'live': s1['live']})
        check(turn > 15 and abs(s2['sv']) > 0.02, 'the rudder hard over turns her to starboard with a drift angle', {'deg': round(turn, 1), 'sway': round(s2['sv'], 2), 'r': round(s2['r'], 3)})
        check(s3['v'] < s1['v'] - 0.8, 'neutral: she loses way', {'kn': [round(s1['v'], 1), round(s3['v'], 1)]})
        # 4. the wind and the sea (Fysikk 2): the model's own functions on open water W of Senja, a strong wind from the west
        e = await pg.evaluate("""() => { const c0 = P(69.30, 16.70), H = S.t / 60; WX_FORCE = {w:14, d:270}; SEAP_MEMO = {k:'', v:null};
          const out = {}, kn = 1 / KN_MS, g = gridGamma(c0) * Math.PI / 180, from = (270 - gridGamma(c0)) * Math.PI / 180;
          const at = (type, f) => { const cal = dynCal(type), b = {pos:{x:c0.x, y:c0.y}, type}; return f(cal, b); };
          // the speed she can hold, into the sea, across it and before it (the sea from the west: heading west is into it)
          out.cap = at('sjark', (cal, b) => [0, 90, 180].map(rel => { const d = dynZero(); d.psi = from + rel * Math.PI / 180; const E = dynEnv(b, d, cal, H, 1); return +(E.cap * kn).toFixed(2); }));
          out.capK = +(speedCap(hsAt(c0, H)) ).toFixed(2);
          // drifting with nothing on, lying across the wind: how fast, which way, and does she stay across
          const drift = type => at(type, (cal, b) => { const d = dynZero(); d.psi = from + Math.PI / 2; let E = null;
            for (let t = 0; t < 240; t += DYN_H){ if (!E || Math.abs(t % 1) < 1e-6) E = dynEnv(b, d, cal, H, 1); dynInt(cal.P, d, 0, 0, DYN_H, E.capF, E); dynMove(d, DYN_H); }
            const sp = Math.hypot(d.X, d.Y) / 240, to = Math.atan2(d.X, -d.Y); return {pct:+(100 * sp / 14).toFixed(1), off:+(Math.abs(dynAng(to, from + Math.PI)) * 180 / Math.PI).toFixed(0), hd:+(Math.abs(Math.sin(dynAng(from, d.psi)))).toFixed(2)}; });
          out.drift = {trebat:drift('trebat'), sjark:drift('sjark'), bunntral:drift('bunntral')};
          // the screw's walk: half astern from rest, calm, no rudder
          WX_FORCE = {w:0.3, d:270}; SEAP_MEMO = {k:'', v:null};
          out.walk = at('sjark', (cal, b) => { const d = dynZero(); let E = null; for (let t = 0; t < 20; t += DYN_H){ if (!E || Math.abs(t % 1) < 1e-6) E = dynEnv(b, d, cal, H, 1); dynInt(cal.P, d, -0.5, 0, DYN_H, E.capF, E); dynMove(d, DYN_H); } return +(d.psi * 180 / Math.PI).toFixed(1); });
          // the propeller out of the water: the old wooden boat into a gale's sea, the big trawler in the same
          WX_FORCE = {w:20, d:270}; SEAP_MEMO = {k:'', v:null};
          out.prop = ['trebat', 'bunntral'].map(type => at(type, (cal, b) => { const d = dynZero(); d.psi = from; d.u = 2; const E = dynEnv(b, d, cal, H, 1); return {type, out:+(100 * E.Pem).toFixed(1), kT:+E.kT.toFixed(2), hs:+E.hs.toFixed(1)}; }));
          WX_FORCE = null; SEAP_MEMO = {k:'', v:null}; return out; }""")
        cp = e['cap']
        check(cp[0] < cp[1] < cp[2] and abs(cp[0] - e['capK']) < 0.15, 'the sea slows her most into it and least before it (Kwon\'s direction factors); into it the cap is the old one', {'kn into/across/before': cp, 'speedCap': e['capK']})
        dr = e['drift']
        check(all(1.5 <= v['pct'] <= 7 and v['off'] < 25 and v['hd'] > 0.6 for v in dr.values()), 'with no way on she drifts downwind at 1.5-7 % of the wind (a 15 m fishing vessel drifted at 4.0 % in the US Coast Guard\'s field test) and lies across it, within 40 degrees', dr)
        check(e['walk'] > 2, 'half astern the screw walks the stern to port: the bow goes to starboard', {'deg in 20 s': e['walk']})
        pr = {q['type']: q for q in e['prop']}
        check(pr['trebat']['out'] > 3 and pr['trebat']['kT'] < 0.99 and pr['bunntral']['out'] < 0.5, 'in a gale\'s sea the small boat\'s propeller comes out of the water now and then (less thrust); the trawler\'s does not', e['prop'])
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
