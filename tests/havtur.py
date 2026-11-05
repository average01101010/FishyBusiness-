# The sea voyages of H1b R8 (docs/planer/havsteget-h1b-rammen.md R8, 05.11.2026): from a harbour on the coast to a ground far out,
# by Autonav, sailed on the shared clock with step() (as lybtest) and without topping up the tank. For each voyage:
#  - the chart: the target is water with a depth, the route has no leg on the ground or into the ice (groundCheck, as autonavtest)
#  - the rules and the zone at the target (ruSea, rulesAt) and that the Russian, British and Faroese zones want their licence
#  - the weather there: the climate point it leans on, the month's mean wind, the air and sea temperature, January against July
#  - the ice: March and September at the target, and that Autonav does not go into it in March
#  - the fuel: which boats have the range for the trip there (the route panel's estimate, estimate() in ui/04-panels-instruments.js),
#    and what the boat really burnt on the way against the estimate
#  - a storm (WX_FORCE): far out a boat lies to and goes on when it eases; near the coast a coastal boat runs for the nearest quay as
#    before; an ocean vessel works on through 20 m/s and lies to over her own limit even near the coast (lieTo, core/05-vessels.js)
# LITE (no 3D). Needs the whole coast in tools/map/out/game and dist-vec (the harbours in Longyearbyen), as lybtest.
import asyncio, json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.path.join(ROOT, 'dist-vec')
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

# from, (lat, lon) of the ground, name, the zone expected there
TRIPS = [
    ('Båtsfjord', 76.0, 35.0, 'Båtsfjord–Sentralbanken', ('sv', 'int', 'no', 'smh')),
    ('Båtsfjord', 69.9, 48.0, 'Båtsfjord–Petsjorahavet', ('ru',)),
    ('Hammerfest', 74.35, 19.6, 'Hammerfest–Bjørnøya', ('sv', 'svt')),
    ('Tromsdalen', 78.25, 15.3, 'Tromsø–Longyearbyen (Isfjorden)', ('svt', 'sv')),
    ('Ålesund', 66.8, -18.5, 'Ålesund–Nord-Island', ('is',)),
    ('Ålesund', 61.9, -6.0, 'Ålesund–Færøyane', ('fo',)),
    ('Måløy', 60.0, 2.6, 'Måløy–Vikingbanken', ('no',)),
    ('Måløy', 61.0, -1.0, 'Måløy–Shetland', ('gb',)),
]
ONLY = [a for a in sys.argv[1:] if not a.startswith('-')]

PLAN = """async ([an, la, lo]) => {
  const R = {}, A = PORTS.find(p => p.name === an && p.mottak) || PORTS.find(p => p.name.startsWith(an)), B = P(la, lo), H7 = (Date.UTC(2027, 6, 5, 6) - EPOCH) / 36e5;
  R.from = A.name; S.t = Math.round(H7 * 60); S.tut = 0; S.cash = 5e6;
  await mapNeed(B, 4);
  // the chart at the target
  R.land = isLand(B); R.depth = Math.round(depthF(B)); R.ll = LL(B); R.gamma = +gridGamma(B).toFixed(1); R.k = +gridScale(B).toFixed(4);
  R.crowNm = +(kmTrue(A.p, B) / NM).toFixed(0);
  // the zone and the rules
  R.zone = ruSea(B); R.zoneName = ruSeaName(R.zone);
  const rl = rulesAt({p:B, H:H7, len:15}); R.rulesV = rl.v; R.rules = rl.items.map(r => r.k); R.ruleNo = rl.items.slice(0, 4).map(r => r.no.slice(0, 90));
  R.lic = ZLIC.includes(R.zone) ? {needs:true, have:zoneLic(R.zone)} : {needs:false};
  // the weather: the nearest climate points and the mean of the month, January and July
  R.clim = (climW(B) || []).map(([c, w]) => c.n + ' ' + Math.round(w * 100) + '%');
  const mean = (y, m, f) => { let s = 0, n = 0; for (let d = 0; d < 28; d++) for (let h = 0; h < 24; h += 3){ s += f((Date.UTC(y, m, 1 + d, h) - EPOCH) / 36e5); n++; } return +(s / n).toFixed(1); };
  R.wx = {}; for (const [k, m] of [['jan', 0], ['jul', 6]]) R.wx[k] = {wind:mean(2027, m, H => windAt(H, B)), hs:mean(2027, m, H => hsAt(B, H)), air:mean(2027, m, H => airTemp(H, B)), sea:mean(2027, m, H => seaTemp(H, B)),
    gale:(() => { let g = 0, n = 0; for (let d = 0; d < 28; d++) for (let h = 0; h < 24; h += 3){ if (windAt((Date.UTC(2027, m, 1 + d, h) - EPOCH) / 36e5, B) >= 14) g++; n++; } return Math.round(g / n * 100); })()};
  // the ice
  R.ice = {mar:Math.round(seaIceAt(B, (Date.UTC(2027, 2, 15) - EPOCH) / 36e5)), sep:Math.round(seaIceAt(B, (Date.UTC(2027, 8, 15) - EPOCH) / 36e5))};
  // the route in July
  const t0 = performance.now(); let r = null; try { r = await leiaRoute({...A.p}, B, A.id, null); } catch (e){ r = {why:[String(e)]}; }
  R.ms = Math.round(performance.now() - t0);
  if (!r || !r.wps){ R.why = r && r.why ? String(r.why[0]).slice(0, 160) : 'ingen'; return R; }
  R.wps = r.wps; R.nm = +r.nm.toFixed(0);
  let pr = {...A.p}, land = 0, ice = 0; for (const w of r.wps){ await lnetLoad([pr, w]); if (groundCheck(pr, w)) land++; if (seaIceOnLeg(pr, w, H7, VESSELS.kyst15)) ice++; pr = w; } R.badLegs = land; R.iceLegs = ice;
  // the route in March, if the ice is near: Autonav round it or not at all, never into it
  if (R.ice.mar > 5 || /Sentral|Longyear|Bjørn/.test(an + la)){ const H3 = (Date.UTC(2027, 2, 15, 6) - EPOCH) / 36e5, t3 = S.t; S.t = Math.round(H3 * 60);
    let r3 = null; try { r3 = await leiaRoute({...A.p}, B, A.id, null); } catch (e){ r3 = {why:[String(e)]}; }
    if (r3 && r3.wps){ let q = A.p, n = 0; for (const w of r3.wps){ if (seaIceOnLeg(q, w, H3, VESSELS.kyst15)) n++; q = w; } R.mar = {nm:+r3.nm.toFixed(0), iceLegs:n}; }
    else R.mar = {why:r3 && r3.why ? String(r3.why[0]).slice(0, 120) : 'ingen'}; S.t = t3; }
  // the fuel: every boat type, with a full tank, at its cruising speed in the month's mean wind, the route panel's sum
  const keep = S.boat.type; R.fuel = {};
  for (const t of Object.keys(VESSELS)){ S.boat.type = t; applyVessel(); const v = BOAT.vcruise, W = R.wx.jul.wind, need = fuelLph(v, W) * r.nm / v; R.fuel[t] = {cap:BOAT.fuelCap, need:Math.round(need), pct:Math.round(need / BOAT.fuelCap * 100), v}; }
  S.boat.type = keep; applyVessel();
  return R; }"""

SAIL = """async ([an, wps, type]) => {
  const R = {}, b = S.boat, A = PORTS.find(p => p.name === an && p.mottak) || PORTS.find(p => p.name.startsWith(an));
  b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; b.status = 'port'; b.port = A.id; b.pos = {...A.p}; S.lic = null;
  const v = BOAT.vcruise, W = windAt(S.t / 60), km = wps.reduce((a, w, i) => a + kmTrue(i ? wps[i - 1] : b.pos, w), 0);
  R.type = type; R.est = Math.round(fuelLph(v, W) * km / NM / v); R.cap = BOAT.fuelCap; R.v = v;
  S.plan = {wps:wps.map(w => ({...w, port:null, fish:0})), idx:0, speed:v}; depart();
  const T0 = S.t, f0 = b.fuel; let n = 0, empty = null, lastTarget = wps[wps.length - 1]; R.events = [];
  while (n < 30000){
    if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r => setTimeout(r, 50)); continue; }
    DYN.on = false; step(); n++;
    if (b.fuel <= 0 && !empty){ empty = {h:Math.round((S.t - T0) / 60), ll:LL(b.pos), left:+(kmTrue(b.pos, lastTarget) / NM).toFixed(0)}; break; }
    if (n % 200 === 0) await new Promise(r => setTimeout(r, 0));
    if (!S.plan && b.status !== 'sailing'){
      if (S.shelter || sailWaiting()){ for (let k = 0; k < 200 && (S.shelter || sailWaiting()) && !S.plan; k++) await new Promise(r => setTimeout(r, 150)); }
      if (!S.plan) break; }
    if (S.plan && S.plan.returning && !R.shelter){ const q = S.plan.wps[S.plan.wps.length - 1]; R.shelter = {h:Math.round((S.t - T0) / 60), at:LL(b.pos), to:(portById(q.port) || {}).name, nm:+(kmTrue(b.pos, q) / NM).toFixed(0), w:+windAt(S.t / 60).toFixed(1)}; }
  }
  R.h = +((S.t - T0) / 60).toFixed(1); R.used = Math.round(f0 - b.fuel); R.left = Math.round(b.fuel); R.status = b.status; R.port = (portById(b.port) || {}).name || null;
  R.empty = empty; R.atEnd = +(kmTrue(b.pos, lastTarget) / NM).toFixed(1);
  R.log = S.log.slice(-5).map(l => (l.no || l[1] || String(l)).slice(0, 140));
  return R; }"""

STORM = """async ([type, la, lo, wHi]) => {
  const R = {}, b = S.boat, p = P(la, lo); await mapNeed(p, 4); S.sleep = null; S.energy = 100; S.drowsy = false;   // (awake and rested: asleep alone she drifts, 15-energy.js sleepDrift)
  S.settings.autoOn = true; S.settings.autoW = 11; S.settings.autoTo = 'near';
  b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; b.status = 'idle'; b.port = null; b.pos = {...p}; b.hove = null; b.v = 0;
  // a route 60 km to the west, out to sea, at cruising speed
  const to = {x:p.x - 60, y:p.y}; S.plan = {wps:[{x:to.x, y:to.y, port:null, fish:0}], idx:0, speed:BOAT.vcruise}; b.status = 'sailing';
  const run = async n => { for (let i = 0; i < n; i++){ if (!simAreaReady()){ await mapNeed(b.pos, 4); i--; continue; } DYN.on = false; step(); if (i % 100 === 0) await new Promise(r => setTimeout(r, 0)); } };
  WX_FORCE = {w:6, d:240}; await run(5);
  WX_FORCE = {w:wHi, d:240}; const p0 = {...b.pos}, f0 = b.fuel; await run(120);
  for (let k = 0; k < 100 && (S.shelter || sailWaiting()); k++) await new Promise(r => setTimeout(r, 150));
  R.hove = !!b.hove; R.status = b.status; R.returning = !!(S.plan && S.plan.returning); R.to = S.plan && S.plan.returning ? (portById(S.plan.wps[S.plan.wps.length - 1].port) || {}).name : null;
  R.moved = +(dist(p0, b.pos) * 1000).toFixed(0); R.log = S.log.slice(-5).map(l => [l.t, (l.no || String(l)).slice(0, 80)]); R.t = S.t; R.burnt = Math.round(f0 - b.fuel); R.text = statusText(); R.lim = windLim(); R.hs = +hsAt(b.pos, S.t / 60).toFixed(1); R.seaLim = seaLim();
  if (b.hove){ WX_FORCE = {w:7, d:240}; await run(90); R.after = {status:b.status, plan:!!S.plan, hove:!!b.hove, log:S.log.slice(-1).map(l => l.no || l)[0]}; }
  WX_FORCE = null; S.plan = null; b.hove = null; b.status = 'idle';
  return R; }"""

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        print('FEIL hele kysten mangler i tools/map/out/game (release.py og game.py)'); return
    if not os.environ.get('KYST_VEC_BUILT'):
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800}); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(1800000)
        for an, la, lo, name, zones in TRIPS:
            if ONLY and not any(o.lower() in name.lower() for o in ONLY): continue
            r = await pg.evaluate(PLAN, [an, la, lo]); wps = r.pop('wps', None)
            print('plan', name, json.dumps(r, ensure_ascii=False))
            print(ok(not r['land'] and r['depth'] > 5), name + ': målet er sjø med dybde', [r['depth'], r['ll']])
            print(ok(r['zone'] in zones), name + ': sonen der', [r['zone'], r['zoneName']])
            print(ok(not r['lic']['needs'] or not r['lic']['have']), name + ': lisens trengs der det skal (uten lisens i lagringen)', r['lic'])
            print(ok(len(r['clim']) > 0 and r['wx']['jan']['wind'] > r['wx']['jul']['wind']), name + ': været lener seg på klimapunktene, vinteren hardere enn sommeren', [r['clim'], r['wx']])
            print(ok(wps and r['badLegs'] == 0 and r['iceLegs'] == 0), name + ': Autonav i juli, ingen etappe over land eller inn i isen', [r.get('nm'), r.get('crowNm'), r.get('ms'), r.get('why')])
            if 'mar' in r: print(ok('why' in r['mar'] or r['mar']['iceLegs'] == 0), name + ': i mars rundt isen eller ikke i det hele tatt', [r['ice'], r['mar']])
            if not wps: continue
            reach = [t for t, f in r['fuel'].items() if f['pct'] <= 100]
            print('drivstoff', name, 'rekker (≤100 % av tanken):', reach, '| kyst15', r['fuel'].get('kyst15'), '| kyst21', r['fuel'].get('kyst21'), '| sjark', r['fuel'].get('sjark'))
            for t in (('kyst15', 'kyst21') if '-all' in sys.argv else ('kyst15',)):
                s = await pg.evaluate(SAIL, [an, wps, t]); print('seilas', name, json.dumps(s, ensure_ascii=False))
                arrived = s['atEnd'] < 1.0
                print(ok(arrived or s.get('shelter')), name + ' med ' + t + ': fram, eller til nærmeste kai i kuling', [s['h'], s['atEnd'], s.get('shelter'), s.get('port')])
                print(ok(not s['empty'] or r['fuel'][t]['pct'] > 100), name + ' med ' + t + ': tanken holder der overslaget sier den gjør det', [s['used'], s['est'], s['cap'], s['empty']])
                if arrived and not s.get('shelter'): print(ok(s['used'] <= s['est'] * 1.25), name + ' med ' + t + ': brukt mot overslaget i rutepanelet (høyst 25 % over)', [s['used'], s['est']])
        if not ONLY or 'storm' in ONLY:
            r = await pg.evaluate(STORM, ['kyst15', 66.0, -12.0, 20]); print('uvær kyst15 langt ute', json.dumps(r, ensure_ascii=False))
            print(ok(r['hove'] and r['moved'] < 50 and r['burnt'] > 0 and 'bi' in r['text']), 'kyst15 langt ute i 20 m/s: ligger bi (holder stedet, bruker diesel), løper ikke hundrevis av nm til kai', [r['moved'], r['burnt'], r['text']])
            print(ok(r.get('after') and r['after']['status'] == 'sailing' and r['after']['plan'] and not r['after']['hove']), 'kyst15: fortsetter ruta når det har løyet en time', r.get('after'))
            r = await pg.evaluate(STORM, ['kyst15', 62.55, 5.6, 16]); print('uvær kyst15 ved kysten', json.dumps(r, ensure_ascii=False))
            print(ok(not r['hove'] and r['returning']), 'kyst15 ved kysten i 16 m/s (over 11 i innstillingen): til nærmeste kai som før', [r['to'], r['status']])
            r = await pg.evaluate(STORM, ['snokrabbe', 62.55, 5.6, 20]); print('uvær havfartøy 20 m/s', json.dumps(r, ensure_ascii=False))
            print(ok(not r['hove'] and not r['returning'] and r['status'] == 'sailing' and r['moved'] > 1000), 'havfartøyet går videre i 20 m/s (grensen er dens egen)', [r['lim'], r['status'], r['moved']])
            r = await pg.evaluate(STORM, ['snokrabbe', 62.55, 5.6, 28]); print('uvær havfartøy 28 m/s', json.dumps(r, ensure_ascii=False))
            print(ok(r['hove'] and not r['returning']), 'havfartøyet ligger bi i 28 m/s også nær kysten, og går ikke i havn', [r['lim'], r['text']])
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
