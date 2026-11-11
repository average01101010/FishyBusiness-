"""The stream in the manoeuvring, the drift and the route's time (Ø9 F8b, core/16b-dyn.js, steg 42): at three places along the coast (the
stikkprøve: Saltstraumen at Bodø, a sound at Bergen and one at Hammerfest) a sjark lying still is carried with the stream, the minute
step takes her through faster with it and slower against it than in still water (CURW.off), and the route's time (curLegH) says the
same; in Saltstraumen at the springs the manoeuvring model sails her through with the stream live, the GPS showing her speed over the
ground; and where the stream is under 0.2 knots a passage is the same to the last digit with and without it.
Needs the whole coast in dist/. KYST_LITE=1 python3 tests/stromtest.py. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, os, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
from playwright.async_api import async_playwright
sys.stdout.reconfigure(line_buffering=True)


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


PLACES = [('Bodø (Saltstraumen)', 67.2335, 14.623, 2), ('Bergen', 60.40, 5.29, 80), ('Hammerfest', 70.66, 23.68, 120)]
# the strongest sound within R km of the place, the hour of its strongest flood in fifteen days of March 2027 (springs), a clear line
# through it along its axis and a place in it clear of the land to lie in
SITE = """async ([la, lo, R]) => {
  const c0 = P(la, lo), KN = 3600 / 1852, H0 = Math.round((Date.UTC(2027, 2, 1, 0) - EPOCH) / 6e4) / 60, cand = [];
  // (a sound a sjark can sail: 100 m wide and 4 m deep or more; the strongest first, and the first with a clear line and a place to lie)
  for (const s of STROM.s){ const d = Math.hypot(s.x - c0.x, s.y - c0.y); if (d > R || s.w < 100 || s.d < 4) continue; cand.push([CUR.max * Math.tanh(s.A * 1e6 * CUR.ref / 3600 / (s.w * s.d) / CUR.max), s]); }
  cand.sort((a, b) => b[0] - a[0]); let out = null, tried = 0;
  for (const [, q] of cand.slice(0, 12)){ tried++; const at = {x:q.x, y:q.y}; try { await mapNeed(at, 9); } catch (e){ continue; }
    let Hf = H0, best = 0; for (let h = 0; h < 15 * 24; h += 0.25){ const c = curAt(at, H0 + h); if (c.snd > best){ best = c.snd; Hf = H0 + h; } }
    let line = null; for (const r of [1.5, 1, 0.7, 0.5, 0.3]){ const A = {x:q.x - q.ax * r, y:q.y - q.ay * r}, B = {x:q.x + q.ax * r, y:q.y + q.ay * r}; let hit = true; try { hit = isLand(A) || isLand(B) || !!groundCheck(A, B) || !!groundCheck(B, A); } catch (e){} if (!hit){ line = {A, B, r}; break; } }
    let lie = null; for (const s of [0.15, -0.15, 0.3, -0.3, 0.5, -0.5, 0.8, -0.8]){ const p = {x:q.x + q.ax * s, y:q.y + q.ay * s}; let okp = false;
      try { const C = curEff(curAt(p, Hf)), to = {x:p.x + C.x * 0.06, y:p.y + C.y * 0.06}; okp = !isLand(p) && coastDist(p) > 0.09 && C.m > 0.5 && !isLand(to) && !groundCheck(p, to) && coastDist(to) > 0.07; } catch (e){} if (okp){ lie = p; break; } }
    const r = {q:{x:q.x, y:q.y, ax:q.ax, ay:q.ay, w:q.w, d:q.d}, km:+Math.hypot(q.x - c0.x, q.y - c0.y).toFixed(1), Hf, kn:+(best * KN).toFixed(2), line, lie, ll:LL(at), tried, of:cand.length};
    if (!out) out = r; if (line && lie){ out = r; break; } }
  return out; }"""
PREP = """() => { S.tut = 0; const b = S.boat; b.type = 'sjark'; applyVessel(); b.status = 'idle'; b.v = 0; b.port = null; b.anch = null; b.gop = null; S.plan = null; S.helm = null; b.dyn = null; b.drv = null; b.driftHome = null; b.fuel = Math.max(b.fuel || 0, 400);
  WX_FORCE = {w:0.5, d:200}; return {type:b.type, vc:BOAT.vcruise, vmax:BOAT.vmax}; }"""
# lying still in the stream: six minute steps, the way she went against what the stream gives
DRIFT = """([p, Hf]) => { const b = S.boat; CURW.off = false; DYN.b = null; S.plan = null; S.helm = null; b.status = 'idle'; b.v = 0; b.port = null; b.anch = null; b.drv = null; b.driftHome = null; b.pos = {x:p.x, y:p.y}; S.t = Math.round(Hf * 60);
  const C = curEff(curAt(p, Hf)), p0 = {x:b.pos.x, y:b.pos.y}; let sog = 0, n = 0;
  for (let i = 0; i < 6; i++){ step(); const g = dynSog(b); if (g.kn > sog) sog = g.kn; if (b.drv) n++; }
  const dx = (b.pos.x - p0.x) * 1000, dy = (b.pos.y - p0.y) * 1000, m = Math.hypot(dx, dy);
  return {m:+m.toFixed(0), want:+(C.m * 60 * 5).toFixed(0), kn:+(C.m * 3600 / 1852).toFixed(2), sog:+sog.toFixed(2), along:+((dx * C.x + dy * C.y) / (m * C.m || 1)).toFixed(3), st:b.status, moved:n}; }"""
# the minute step through the sound from A to B, starting ten game minutes before the stream's top: the minutes it takes, the lowest
# and the highest speed over the ground, with the stream on or off (still water)
KIN = """([A, B, Hf, off]) => { const b = S.boat; CURW.off = !!off; CURLEG.clear(); DYN.b = null; S.plan = null; S.helm = null; b.dyn = null; b.drv = null; b.status = 'idle'; b.v = 0; b.port = null; b.anch = null; b.pos = {x:A.x, y:A.y}; b.heading = Math.atan2(B.x - A.x, -(B.y - A.y)); S.t = Math.round(Hf * 60) - 6;
  S.draft = [{x:B.x, y:B.y, port:null, fish:0}]; S.draftSpeed = BOAT.vcruise; const est = estimate().hours * 60;
  doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click();
  if (b.status !== 'sailing'){ CURW.off = false; return {st:b.status, why:'no start'}; }
  const t0 = S.t; let lo = 99, hi = 0, n = 0;
  while (b.status === 'sailing' && S.plan && n < 900){ DYN.b = null; step(); n++; if (b.status === 'sailing' && n > 2){ const s = dynSog(b).kn; lo = Math.min(lo, s); hi = Math.max(hi, s); } }
  const out = {st:b.status, min:S.t - t0, est:+est.toFixed(1), lo:+lo.toFixed(1), hi:+hi.toFixed(1), end:+(dist(b.pos, B) * 1000).toFixed(0), x:b.pos.x, y:b.pos.y}; CURW.off = false; S.plan = null; b.status = 'idle'; return out; }"""
ST = "(() => { const b = S.boat, g = dynSog(b), el = document.getElementById('ecSog'), q = dynLive() ? dynPose() : null; return {st:b.status, t:S.t, v:b.v, sog:g.kn, cog:g.cog, hd:b.heading, live:dynLive(), x:b.pos.x, y:b.pos.y, gps:el ? el.textContent : '', cm:DYN.env ? DYN.env.cm : 0}; })()"


async def live(pg, A, B, Hf, cap):
    r = await pg.evaluate("""([A, B, Hf]) => { const b = S.boat; CURW.off = false; S.plan = null; S.helm = null; b.dyn = null; b.drv = null; b.status = 'idle'; b.v = 0; b.port = null; b.anch = null; b.pos = {x:A.x, y:A.y}; b.heading = Math.atan2(B.x - A.x, -(B.y - A.y)); S.t = Math.round(Hf * 60) - 6;
      S.draft = [{x:B.x, y:B.y, port:null, fish:0}]; S.draftSpeed = BOAT.vcruise; doAct({dataset:{act:'start'}, disabled:false}); const g = document.getElementById('ruGo'); if (g) g.click(); return {st:b.status, t:S.t}; }""", [A, B, Hf])
    out = []
    if r['st'] != 'sailing': return r, out
    for _ in range(int(cap / 0.5)):
        await pg.wait_for_timeout(500)
        s = await pg.evaluate(ST); out.append(s)
        if s['st'] != 'sailing': break
    return r, out


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut')
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=90000)
        coast = await pg.evaluate("STROM.s.length > 200 && !!MAPD.core")
        v = await pg.evaluate(PREP); print('  båten:', v)
        salt = None
        for name, la, lo, R in PLACES:
            s = await pg.evaluate(SITE, [la, lo, R])
            if not s: check(False, name + ': a sound within %d km' % R); continue
            print('--', name, {k: s[k] for k in ('km', 'kn', 'll', 'tried', 'of')}, 'bredde', s['q']['w'], 'm, dybde', s['q']['d'], 'm, linje', s['line'] and s['line']['r'], 'km')
            check(s['kn'] >= 0.5, name + ': the sound runs at half a knot or more at the springs', s['kn'])
            if s['lie']:
                d = await pg.evaluate(DRIFT, [s['lie'], s['Hf']])
                # (in a narrow sound the engine holds her off the land after a few minutes, LIE.land: the way she went is the minutes she drifted)
                check(d['moved'] >= 2 and d['along'] > 0.9 and d['m'] >= 0.6 * d['want'] / 5 * (d['moved'] - 1) and d['m'] <= 1.5 * d['want'], name + ': lying still she is carried with the stream', d)
                check(abs(d['sog'] - d['kn']) < max(0.5, 0.4 * d['kn']), name + ': the GPS shows her drift as speed over the ground', {'sog': d['sog'], 'stream': d['kn']})
            else: check(False, name + ': a place in the stream clear of the land')
            if s['line']:
                A, B = s['line']['A'], s['line']['B']
                w = await pg.evaluate(KIN, [A, B, s['Hf'], False]); a = await pg.evaluate(KIN, [B, A, s['Hf'], False]); st = await pg.evaluate(KIN, [A, B, s['Hf'], True])
                print('   med strømmen', w); print('   mot strømmen', a); print('   stille vann ', st)
                okk = all(x.get('st') in ('idle', 'fishing') and x.get('end', 9e9) < 30 for x in (w, a, st))
                check(okk, name + ': the minute step takes her through, with it, against it and in still water', [x.get('st') for x in (w, a, st)])
                if okk:
                    check(w['min'] <= st['min'] <= a['min'] and a['min'] > w['min'], name + ': faster with the stream and slower against it than in still water (minutes)', {'with': w['min'], 'still': st['min'], 'against': a['min']})
                    check(w['hi'] > st['hi'] + 0.3 * s['kn'] and a['lo'] < st['lo'] - 0.3 * s['kn'], name + ': the speed over the ground has the stream in it', {'with_hi': w['hi'], 'still': st['hi'], 'against_lo': a['lo']})
                    # (the estimate has no getting under way and no slowing for the stop, with or without a stream: what the stream adds or takes is compared)
                    de, ds = a['est'] - st['est'], a['min'] - st['min']
                    check(w['est'] <= st['est'] <= a['est'] and abs(de - ds) <= max(1.5, 0.5 * ds), name + ': the route\'s time has the stream in it (what it adds against her: estimate against sailed, minutes)', {'with': [w['est'], w['min']], 'against': [a['est'], a['min']], 'still': [st['est'], st['min']]})
            else: check(False, name + ': a clear line through the sound')
            if salt is None: salt = s
        # where the stream is under 0.2 knots nothing changes: a passage with it and without it is the same to the last digit
        # (the clock stopped, and the search at the hour of the passage, so the tide under her is the one the passage has)
        await pg.evaluate(PREP)
        z = await pg.evaluate("""async () => { const KN = 3600 / 1852, H = Math.round((Date.UTC(2027, 2, 8, 9) - EPOCH) / 6e4) / 60; let best = null; S.mult = 0.00001; S.plan = null; S.boat.status = 'idle'; S.t = Math.round(H * 60);
          for (const [la, lo] of [[69.30, 16.70], [69.45, 17.2], [69.2, 17.6], [67.0, 13.0], [60.2, 5.1], [69.35, 17.05], [69.5, 18.0]]){ const c = P(la, lo); try { await mapNeed(c, 9); } catch (e){ continue; }
            for (let r = 0; r <= 6; r += 0.5) for (let k = 0; k < 12; k++){ const a = k / 12 * 2 * Math.PI, A = {x:c.x + Math.sin(a) * r, y:c.y - Math.cos(a) * r}, B = {x:A.x + 1.5, y:A.y}; let okp = false, mx = 0;
              try { okp = !isLand(A) && !isLand(B) && !groundCheck(A, B, 1.5) && coastDist(A) > 0.2; if (okp) for (let f = 0; f <= 1; f += 0.05) if (coastDist({x:A.x + 1.5 * f, y:A.y}) < 0.15) okp = false; if (okp) for (let f = 0; f <= 1; f += 0.1){ const q = curAt({x:A.x + 1.5 * f, y:A.y}, H); mx = Math.max(mx, Math.hypot(q.sx, q.sy)); } } catch (e){ okp = false; }
              if (okp && mx > 0.01 && mx < 0.19 / KN){ best = {A, B, H, raw:+(mx * KN).toFixed(3), ll:LL(A)}; break; } } if (best) break; if (best) break; }
          return best; }""")
        if not z: check(False, 'a place with a stream under 0.2 knots to compare at')
        else:
            on = await pg.evaluate(KIN, [z['A'], z['B'], z['H'], False]); off = await pg.evaluate(KIN, [z['A'], z['B'], z['H'], True])
            check(on.get('min') == off.get('min') and on.get('x') == off.get('x') and on.get('y') == off.get('y') and on.get('est') == off.get('est'), 'under 0.2 knots (%.2f kn here) the passage is the same with the stream and without, to the last digit' % z['raw'], {'on': on, 'off': off, 'at': z['ll']})
        await pg.evaluate("S.mult = 1; S.plan = null; S.boat.status = 'idle'")
        # Saltstraumen live: the manoeuvring model with the stream, on the shared clock
        if salt and salt['line']:
            A, B = salt['line']['A'], salt['line']['B']
            print('   live ...'); r, out = await live(pg, A, B, salt['Hf'], 150)
            if not out: check(False, 'Saltstraumen live: under way', r)
            else:
                lives = [s for s in out if s['live']]; fin = out[-1]; top = max(out, key=lambda s: s['sog'])
                check(len(lives) > 0.7 * len(out), 'Saltstraumen live: the model has her', {'live': len(lives), 'n': len(out)})
                check(fin['st'] != 'aground' and fin['st'] != 'sailing', 'Saltstraumen live with the stream: she is through and stands on the point', {'st': fin['st'], 'gmin': fin['t'] - r['t'], 'kinematic': None})
                check(top['sog'] > top['v'] + 0.4 * salt['kn'], 'Saltstraumen live: over the ground she goes faster than through the water, by the stream', {'sog': round(top['sog'], 1), 'log': round(top['v'], 1), 'stream': round(top['cm'] * 3600 / 1852, 1), 'gps': top['gps']})
                print('   live med strømmen: %d spillminutter, toppfart over grunn %.1f kn (gjennom vannet %.1f kn)' % (fin['t'] - r['t'], top['sog'], top['v']))
        check(coast, 'the whole coast is in the build (else the places are not there)')
        # the pictures: the boat in Saltstraumen with the stream, the chart plotter with SOG (and COG when she is set off), both formats
        if salt and salt['line']:
            for tag, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
                pg2 = await br.new_page(viewport={'width': w, 'height': h}); pg2.on('pageerror', lambda e: errs.append(str(e)))
                await boot(pg2, GAME + '#notut'); await pg2.evaluate(PREP)
                await pg2.evaluate("async ([la, lo]) => { await mapNeed(P(la, lo), 9); S.settings.plotter = false; openPlotter(); }", [67.2335, 14.623])
                await pg2.evaluate("(q) => { view.cx = q.x; view.cy = q.y; view.z = MAP_H / 4; applyView(); try { CURARR.k = ''; scheduleStatic(); renderStatic(); renderDyn(); } catch (e){} }", salt['q']); await pg2.wait_for_timeout(6000)
                A, B = salt['line']['A'], salt['line']['B']
                # (the line a little across the stream, so she heads up into it and the course over the ground shows)
                B2 = {'x': B['x'] + 0.35 * salt['q']['ay'], 'y': B['y'] - 0.35 * salt['q']['ax']}
                ok2 = await pg2.evaluate("([A, B]) => { try { return !isLand(B) && !groundCheck(A, B); } catch (e){ return false; } }", [A, B2])
                r, out = await live(pg2, A, B2 if ok2 else B, salt['Hf'], 4)
                top = None
                for _ in range(120):
                    await pg2.wait_for_timeout(500); s2 = await pg2.evaluate(ST)
                    if s2['st'] != 'sailing': break
                    if s2['sog'] > s2['v'] + 3: top = s2; break
                await pg2.screenshot(path=os.path.join(OUT, 'stromtest_plotter_%s.png' % tag))
                check(top is not None and 'kn' in top['gps'], 'the chart plotter shows the speed over the ground in Saltstraumen (%s)' % tag, top and {'gps': top['gps'], 'sog': round(top['sog'], 1), 'log': round(top['v'], 1), 'cog': 'COG' in top['gps']})
                # COG: lying still across the stream she drifts another way than her bow points, and the plotter says so under the speed
                cg = await pg2.evaluate("""([p, Hf]) => { const b = S.boat; S.plan = null; b.status = 'idle'; b.v = 0; b.dyn = null; b.pos = {x:p.x, y:p.y}; S.t = Math.round(Hf * 60); const C = curBoat(b, S.t / 60); b.heading = Math.atan2(C.x, -C.y) + Math.PI / 2; b.drv = {x:C.x * 0.06, y:C.y * 0.06, t:S.t, st:'idle'};
                  INSTR.show(); const g = dynSog(b); return {gps:document.getElementById('ecSog').textContent, hdg:document.getElementById('ecHdg').textContent, kn:+g.kn.toFixed(1), cog:Math.round(trueDeg(g.cog, b.pos)) % 360}; }""", [salt['lie'] or salt['line']['A'], salt['Hf']])
                await pg2.screenshot(path=os.path.join(OUT, 'stromtest_cog_%s.png' % tag))
                check('COG' in cg['gps'] and ('%03d' % cg['cog']) in cg['gps'], 'the chart plotter shows COG under the speed when she is set across her heading (%s)' % tag, cg)
                await pg2.close()
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
