"""Autonav never puts the boat on land (tilbakemeldinger #47 and #48, 08.10.2026: a boat on Autonav from Vannareid to Honningsvåg
ran aground; the route went on 200 m cells and a raw step between two of them crossed land).
1. Asleep alone on a route the autopilot holds the course (core/05-vessels.js): the boat goes on, no drift.
2. Drifting asleep toward the land she stops short and lies there (core/15-energy.js sleepDrift), never aground.
3. Shallow water on a leg the route called safe: she stops short and Autonav finds a way round or stops her (sailReplan); on a leg the
   player drew through it and cast off on anyway (pl.unsafe) she grounds as before.
4. A mission's deadline stands still while she is aground, and the time a grounding cost is given back once (core/09g-turer.js).
5. A tap in water too shallow for the boat is moved out to deeper water (ui/03b-route.js deepNear), and the route finder refuses a
   shallow end.
6. National routes (Vannareid–Honningsvåg both ways, Skjervøy–Hammerfest, Tromsø–Vannareid) go on 100 m cells, and every leg is
   checked the way the simulation sails it (groundCheck, isLand at 5 m): none grounds.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SLEEP_ROUTE = """(() => { const R = {}, b = S.boat, g = GROUNDS[2].p; S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.crew = []; S.sleep = null; S.plan = null;
  b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; b.fuel = 60;
  const tgt = [5, 4, 3].flatMap(r => [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({x:g.x + r * Math.cos(k * Math.PI / 4), y:g.y + r * Math.sin(k * Math.PI / 4)}))).find(q => legClear(g, q) && !legHazard(g, q, safeDepth()).unsafe);
  if (!tgt) return {err:'no clear leg'};
  S.plan = {wps:[{x:tgt.x, y:tgt.y, port:null, fish:0, leia:true}], idx:0, speed:6, returning:false, depAt:null, unsafe:[false]}; b.status = 'sailing'; b.drift = 0;
  S.energy = 0.001; step(); R.asleep = asleep(); R.alone = !!(S.sleep && S.sleep.alone); const d0 = dist(b.pos, tgt);
  // a quarter of an hour under way asleep (the target is 3-5 km off: not reached yet)
  for (let i = 0; i < 12 && S.plan; i++) step();
  R.closer = +(d0 - dist(b.pos, tgt)).toFixed(2); R.st = b.status; R.held = !!(S.sleep && S.sleep.held); R.drift = b.drift || 0; R.plan = !!S.plan;
  S.sleep = null; S.energy = 100; S.plan = null; b.status = 'idle'; return R; })()"""

DRIFT = """(() => { const R = {}, b = S.boat, g = GROUNDS[2].p; S.plan = null; S.crew = []; S.me = S.cur;
  // a sea point 60-150 m off the land near the ground, and the direction the land lies in from it
  let p0 = null, land = null;
  for (let r = 0.3; r < 6 && !p0; r += 0.1) for (let k = 0; k < 24 && !p0; k++){ const a = k * Math.PI / 12, q = {x:g.x + Math.sin(a) * r, y:g.y - Math.cos(a) * r};
    if (isLand(q) || inHarbour(q)) continue; const cd = coastDist(q); if (cd < 0.06 || cd > 0.15) continue;
    for (let j = 0; j < 32; j++){ const h = j * Math.PI / 16, t = {x:q.x + Math.sin(h) * 0.25, y:q.y - Math.cos(h) * 0.25}; if (isLand(t)){ p0 = q; land = h * 180 / Math.PI; break; } } }
  if (!p0) return {err:'no shore point'};
  b.status = 'idle'; b.port = null; b.pos = {...p0}; b.drift = 0;
  const wd0 = windDir; windDir = () => ((land - 180 + gridGamma(p0)) % 360 + 360) % 360;   // the wind blows her onto the land
  S.sleep = {t0:S.t, until:S.t + 480, v:S.cur, alone:true};
  const H = S.t / 60; let n = 0; for (; n < 90; n++){ sleepDrift(H); if (b.status === 'aground') break; }
  windDir = wd0;
  R.st = b.status; R.land = isLand(b.pos); R.held = !!S.sleep.held; R.moved = +dist(p0, b.pos).toFixed(3); R.cd = +coastDist(b.pos).toFixed(3);
  S.sleep = null; return R; })()"""

# a shoal for a 3 m draught near the ground, and a deep point 400 m off with a clear line through the shoal and 100 m past it
SHOAL = """(() => { const g = GROUNDS[2].p, tl = tideCD(S.t / 60); BOAT.draft = 3; S.settings.safeDepth = 5; hzCache.k = ''; hzLegs.clear();
  // (the simulation grounds at depth + tide below the draught: the shoal is sought with the tide of the hour)
  for (let r = 0.3; r < 12; r += 0.1) for (let k = 0; k < 36; k++){ const a = k * Math.PI / 18, z = {x:g.x + Math.sin(a) * r, y:g.y - Math.cos(a) * r};
    try { if (!mapSimAt(z) || !mapReadyAt(z, 0) || isLand(z) || inHarbour(z) || depthF(z) + tl >= 2.4 || depthF(z) < 0.9) continue; } catch (e){ continue; }
    for (let j = 0; j < 16; j++){ const h = j * Math.PI / 8, p = {x:z.x + Math.sin(h) * 0.3, y:z.y - Math.cos(h) * 0.3}, q = {x:z.x - Math.sin(h) * 0.08, y:z.y + Math.cos(h) * 0.08};
      try { if (isLand(p) || inHarbour(p) || depthF(p) + tl < 5 || !clearLine(p, q) || rocksNear(p, q, 0.03)) continue;
        // the shoal is the first shallow water along the line, at least 100 m in
        let ok = true; for (let u = 0.02; u < 0.1; u += 0.02){ const s = {x:p.x + (q.x - p.x) * u / 0.38, y:p.y + (q.y - p.y) * u / 0.38}; if (depthF(s) + tl < 3.6){ ok = false; break; } }
        if (ok) return {z, p, q, dz:+depthF(z).toFixed(1), dp:+depthF(p).toFixed(1), fake:false}; } catch (e){} } }
  // no such shoal near the ground: a draught deeper than the water there makes every leg shallow (the stop branch of the net)
  const p = {...g}, q = [0, 1, 2, 3, 4, 5, 6, 7].map(k => ({x:g.x + 2 * Math.cos(k * Math.PI / 4), y:g.y + 2 * Math.sin(k * Math.PI / 4)})).find(t => legClear(g, t));
  if (!q) return null; BOAT.draft = Math.ceil(depthF(g) + depthF(q)) + 8; S.settings.safeDepth = BOAT.draft + 2; hzCache.k = ''; hzLegs.clear();
  return {z:q, p, q, dz:+depthF(q).toFixed(1), dp:+depthF(p).toFixed(1), fake:true}; })()"""

NET = """(([p, q, unsafe]) => { const R = {}, b = S.boat; S.plan = null; S.sleep = null; S.crew = []; S.energy = 100; S.draft = [];
  b.status = 'idle'; b.port = null; b.pos = {x:p.x, y:p.y}; b.damage = 0; b.fuel = 60; const l0 = S.log.length;
  S.plan = {wps:[{x:q.x, y:q.y, port:null, fish:0, leia:!unsafe}], idx:0, speed:6, returning:false, depAt:null, unsafe:[unsafe]}; b.status = 'sailing';
  for (let i = 0; i < 12 && b.status === 'sailing' && !(S.plan && S.plan.replan); i++) step();
  R.st = b.status; R.replan = !!(S.plan && S.plan.replan); R.v = b.v; R.cd = +dist(b.pos, q).toFixed(3); R.log = S.log.slice(l0).map(l => l.no).join(' | ');
  R.depthHere = +depthF(b.pos).toFixed(1); return R; })"""

AFTER = """(() => { const b = S.boat, R = {st:b.st, plan:!!S.plan, replan:!!(S.plan && S.plan.replan), wps:S.plan ? S.plan.wps.length : 0, draft:S.draft.length, st:b.status, toast:$('toast').textContent, log:S.log.slice(-3).map(l => l.no).join(' | ')};
  S.plan = null; b.status = 'idle'; S.draft = []; return R; })()"""

DEADLINE = """(() => { const R = {}, b = S.boat, T = turState(); T.act = []; T.credit = 1; S.jobs = [];
  const m = {id:9901, k:'frakt', cls:'kort', to:'botnhamn', from:'finnsnes', kg:10, what:['kasser', 'boxes'], t0:S.t - 200, due:S.t + 1000, hTot:20, vid:S.cur, stage:'go', nm:5, h:1, pay:500};
  S.plan = null; b.tow = null; if (typeof helmOff === 'function') helmOff();
  T.act.push(m); const d0 = m.due; let n = 0; for (let i = 0; i < 10; i++){ b.status = 'aground'; b.port = null; step(); n++; } R.stuck = m.due - d0; R.n = n;
  b.status = 'idle'; const d1 = m.due; for (let i = 0; i < 10; i++) step(); R.free = m.due - d1;
  // once: the time lost to a grounding after the mission was taken (an incident 120 minutes ago)
  T.credit = 0; S.incidents = [{t:S.t - 120, k:'aground', boat:'x', no:'', en:''}]; const d2 = m.due; step(); R.credit = m.due - d2; R.flag = T.credit;
  T.act = []; S.incidents = []; return R; })()"""

ROUTE = """async ([an, bn]) => {
  const find = n => PORTS.find(p => p.name === n) || PORTS.find(p => p.name.startsWith(n));
  const A = find(an), B = find(bn); if (!A || !B) return {err:'no port ' + (A ? bn : an)};
  S.boat.status = 'port'; S.boat.port = A.id; S.boat.pos = {x:A.p.x, y:A.p.y}; S.plan = null;
  const t0 = performance.now(); let r; try { r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); } catch (e){ return {err:String(e && e.stack || e).slice(0, 300)}; }
  if (r.why) return {why:r.why[0], ms:Math.round(performance.now() - t0)};
  const bad = []; let p0 = {x:A.p.x, y:A.p.y};
  for (let i = 0; i < r.wps.length; i++){ const w = r.wps[i], L = dist(p0, w);
    await Promise.all([p0, w, {x:(p0.x + w.x) / 2, y:(p0.y + w.y) / 2}].map(q => mapNeed(q, 0.5)));
    let gp = null, land = null; try { gp = groundCheck(p0, w); const n = Math.max(1, Math.ceil(L / 0.005));
      for (let k = 1; k < n; k++){ const q = {x:p0.x + (w.x - p0.x) * k / n, y:p0.y + (w.y - p0.y) * k / n}; if (!inHarbour(q) && isLand(q)){ land = q; break; } } } catch (e){ bad.push({i, err:String(e).slice(0, 120)}); }
    if (gp || land) bad.push({i, gp, land, from:p0, to:w});
    p0 = w; }
  return {n:r.wps.length, nm:+r.nm.toFixed(1), ms:Math.round(performance.now() - t0), cell:r.st.cell, maxSlice:+r.st.maxSlice.toFixed(1), mended:r.st.mended || 0, bad};
}"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1200, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.boat.status === 'port'", timeout=90000)
        pg.set_default_timeout(600000)
        J = lambda js, *a: pg.evaluate(js, *a)
        # 1. asleep alone on a route: the autopilot holds the course
        r = await J(SLEEP_ROUTE)
        check(not r.get('err') and r['asleep'] and r['alone'] and r['closer'] > 1.5 and r['st'] != 'aground' and not r['held'] and (r['drift'] == 0 or not r['plan']), '1. sovner du alene på en rute, holder autopiloten kursen og båten går videre', r)
        # 2. drifting asleep toward the land: she stops short, never aground
        r = await J(DRIFT)
        check(not r.get('err') and r['st'] != 'aground' and not r['land'] and r['held'] and r['cd'] > 0, '2. driver båten mot land i søvne, stopper den før fjæra og går aldri på grunn', r)
        # 3. shallow water on a leg the route called safe: stop short and find a way round; the player's own unsafe leg grounds as before
        sh = await J(SHOAL)
        check(bool(sh), '3a. en grunne for dypgangen finnes nær feltet' + (' (laget: dypgang større enn vannet)' if sh and sh.get('fake') else ''), sh)
        if sh:
            r = await J(NET, [sh['p'], sh['q'], False])
            check(r['st'] == 'sailing' and r['replan'] and r['v'] == 0 and 'Grunt vann forut' in r['log'] and (sh['fake'] or r['depthHere'] >= 3), '3b. grunt vann forut på en trygg etappe: båten stopper før grunna, og Autonav leter etter en vei rundt', r)
            await pg.wait_for_function("!S.plan || !S.plan.replan", timeout=60000)
            a = await J(AFTER)
            check(a['st'] != 'aground' and ((a['plan'] and a['wps'] > 1) or (not a['plan'] and a['draft'] >= 1 and 'ingen trygg vei' in a['log'])), '3c. så går den rundt, eller ligger stille med resten av ruta i kladden; aldri på grunn', a)
            r = await J(NET, [sh['p'], sh['q'], True])
            check(r['st'] == 'aground' and not r['replan'], '3d. en etappe spilleren selv tegnet gjennom grunna og kastet loss på, grunnstøter som før', r)
            await J("(() => { const b = S.boat; b.status = 'idle'; b.damage = 0; S.plan = null; S.draft = []; })()")
        # 4. the deadline stands still while aground, and the time lost is given back once
        r = await J(DEADLINE)
        check(r['stuck'] == 10 and r['free'] == 0 and 118 <= r['credit'] <= 124 and r['flag'] == 1, '4. fristen står stille på grunn, går ellers, og tiden en grunnstøting kostet gis tilbake én gang', r)
        # 5. a tap in shallow water goes out to deeper water; the route finder refuses a shallow end
        if sh and not sh['fake']:
            r = await J("""(([z, p]) => { const d = deepNear(z, 0.5); return {moved:!!d && d !== z, dd:d ? +depthF(d).toFixed(1) : null, far:d ? +dist(d, z).toFixed(3) : null, sd:safeDepth()}; })""", [sh['z'], sh['p']])
            check(r['moved'] and r['dd'] >= r['sd'] + 1 and r['far'] <= 0.5, '5a. et trykk på grunt vann flyttes ut til dypt nok vann innen 500 m', r)
        if sh:
            r = await J("""(async ([z, p]) => { const r = await leiaRoute(p, z, null, null); return {why:r.why ? r.why[0] : null}; })""", [sh['z'], sh['p']])
            check(r['why'] and ('grunt' in r['why'] or sh['fake']), '5b. ruteplanleggeren nekter et mål på grunt vann', r)
        await J("(() => { applyVessel(); delete S.settings.safeDepth; hzCache.k = ''; hzLegs.clear(); })()")
        # 6. national routes: 100 m cells, every leg as the boat sails it
        for a, b in [('Vannareid', 'Honningsvåg'), ('Honningsvåg', 'Vannareid'), ('Skjervøy', 'Hammerfest'), ('Tromsø', 'Vannareid')]:
            r = await J(ROUTE, [a, b])
            ok = not r.get('err') and not r.get('why') and r['bad'] == [] and r['cell'] == 0.1 and r['n'] <= max(40, r['nm'] * 1.852 / 2)
            check(ok, '6. Autonav %s → %s: 100 m-celler, ingen etappe grunnstøter' % (a, b), {k: v for k, v in r.items() if k != 'bad'} if ok else r)
        # 7. «Sitter båten fast?» in the Redning app (tilbakemelding #49): from the plant in Vannareid after a tow, out on safe water
        r = await J("""(async () => { const pt = portById('mT155'), b = S.boat; await mapNeed(pt.p, 3); S.plan = null; S.unstuckAt = 0; dock('mT155'); b.damage = 1; hullRepair();
          PHONE.open('redning'); const btn = document.querySelector('[data-pa=unstuck]'); const R = {btn:!!btn && !btn.disabled}; if (btn) btn.click();
          R.st = b.status; R.port = b.port; R.d = Math.round(dist(b.pos, pt.p) * 1000); R.land = isLand(b.pos); R.depth = +depthF(b.pos).toFixed(1); R.cd = +coastDist(b.pos).toFixed(2);
          PHONE.open('redning'); const b2 = document.querySelector('[data-pa=unstuck]'); R.again = !!(b2 && b2.disabled); PHONE.show(false); return R; })()""")
        check(r['btn'] and r['st'] == 'idle' and r['port'] is None and not r['land'] and r['depth'] >= 4 and r['cd'] >= 0.2 and r['d'] < 2000 and r['again'], '7. «Flytt båten ut på trygt vann» legger båten utenfor Vannareid på dypt vann, og knappen hviler etterpå', r)
        print('sidefeil', errs[:5])
        await br.close()


asyncio.run(main())
