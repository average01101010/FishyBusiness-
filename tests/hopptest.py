"""Hopp over resten av ruta, the core (HO1, steg 104; docs/planer/hopp.md, Jonas 12.11.2026). On Senja, from the start harbour to a
harbour 8-30 km away on an Autonav route, with fish in the hold and you aboard:
  1. sailed: the route played as catchUp plays it (playMinutes) until she is at the quay; the diesel, the fish's freshness, your energy,
     the minutes, the sea time (S.fs.p) and the miles (S.tat.nm) before and after
  2. hopped: the same start (the clock put back), hopGo(): she is at the same quay at once, and the diesel, the freshness and the energy
     are within 5 % of the sailing; the sea time and the miles are unchanged, and the game minutes the hop counted are close to the
     sailing's
  3. the trim: with a turbo trim on, the hop takes the minutes it would have run off it (Jonas: «som om båten seilte»)
  4. refused, nothing changed: too little diesel, and the weather over the boat's risk (WX_FORCE); paid (hopGo(true)) it goes anyway
  5. no page errors
The comparisons run in still weather (WX_FORCE 3 m/s), the same for the sailing and the hop; in weather over the boat's risk the
hop is refused, and that is checked in 4.
KYST_LITE=1 python3 tests/hopptest.py. Prints OK or FEIL lines. KYST_HOPP_FRA=<havn> starts from that harbour instead
(the spot check along the coast; the build must have the whole coast)."""
import asyncio, json, os
from _env import boot
from playwright.async_api import async_playwright

FAIL = []
def check(ok, what, info=None):
    print(('OK ' if ok else 'FEIL ') + what + ('' if info is None else ' ' + json.dumps(info, ensure_ascii=False)[:600]))
    if not ok: FAIL.append(what)

SETUP = """async (fra) => {
  const b = S.boat;
  // the spot check along the coast (/stikkprove): KYST_HOPP_FRA names the harbour to start from (the build must have the whole coast)
  if (fra){ const F = PORTS.find(p => p.name === fra) || PORTS.find(p => p.name.startsWith(fra)); if (!F) return {err:'no harbour ' + fra};
    await mapNeed(F.p, 4); b.status = 'port'; b.port = F.id; b.pos = {x:F.p.x, y:F.p.y}; S.plan = null; }
  const A = portById(b.port) || PORTS.find(p => dist(p.p, b.pos) < 1);
  const B = PORTS.filter(p => p.id !== A.id && !p.naust && dist(p.p, A.p) > 8 && dist(p.p, A.p) < 30).sort((p, q) => dist(p.p, A.p) - dist(q.p, A.p))[0];
  if (!B) return {err:'no harbour 8-30 km from ' + A.name};
  const r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id, B.id); if (r.why) return {err:r.why[0]};
  for (const w of r.wps) await mapNeed(w, 1);
  window.__H = {A:A.id, B:B.id, wps:r.wps.map(w => Object.assign({}, w)), t0:S.t};
  // one hand aboard, the same in every run (genCrew draws at random)
  window.__C = JSON.stringify(Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]}));
  return {A:A.name, B:B.name, n:r.wps.length, nm:+r.nm.toFixed(1)};
}"""
# the same start each time: the clock, the boat out of the harbour on the route, the tank, the hold, you aboard and awake
START = """(o) => { const trim = o && o.trim, crew = o && o.crew, fishAt = o && o.fishAt;
  const b = S.boat, H = window.__H, A = portById(H.A);
  S.t = H.t0; S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.sleep = null; S.energy = 90; S.skip = null; WX_FORCE = {w:3, d:180};   // still weather: the comparison is the hop's, the weather's refusal is checked in 4
  if (S.turer) S.turer.act = [];
  b.status = 'sailing'; b.port = null; b.pos = {x:A.p.x, y:A.p.y}; b.v = 0; b.anch = null; b.hove = null; b.damage = 0;
  delete b.trim; if (trim) b.trim = {k:'turbo', t0:S.t, until:S.t + trim}; applyVessel();
  S.crew = crew ? [JSON.parse(window.__C)] : []; S.trail = [];
  b.fuel = BOAT.fuelCap;   // (a tank over the boat's own is cut to it by applyVessel, as a trim running out calls it)
  S.hold = []; addCatch('torsk', 120, null, false); addCatch('sei', 40, null, false);
  for (const x of S.hold){ x.fresh = 92; x.iced = false; x.gut = false; }
  S.plan = {wps:H.wps.map(w => Object.assign({}, w)), idx:0, speed:BOAT.vcruise || BOAT.vmax * 0.8, returning:false, depAt:null, unsafe:H.wps.map(() => false)};
  S.plan.wps[S.plan.wps.length - 1].port = H.B;
  if (fishAt) S.plan.wps[fishAt].fish = 1;   // a fishing stop on the way: the hop goes there, not to the harbour
  return {fuel:b.fuel, kg:S.hold.reduce((a, x) => a + x.kg, 0), speed:S.plan.speed, trim:!!(b.trim && trimOn(b))};
}"""
STATE = """() => { const b = S.boat, kg = S.hold.reduce((a, x) => a + x.kg, 0);
  return {st:b.status, port:b.port, t:S.t, fuel:b.fuel, fresh:kg ? S.hold.reduce((a, x) => a + x.kg * x.fresh, 0) / kg : null, kg,
    energy:S.energy, fs:(S.fs && S.fs.p) || 0, nm:(S.tat && S.tat.nm) || 0, engH:b.engH || 0, trimUntil:b.trim ? trimUntil(b) : null,
    ice:b.ice || 0, fat:(S.crew || []).reduce((a, c) => a + (c.fatigue || 0), 0), gut:kg ? S.hold.filter(x => x.gut).reduce((a, x) => a + x.kg, 0) / kg : null,
    trail:(S.trail || []).length, vmax:BOAT.vmax, speed:S.plan ? S.plan.speed : null}; }"""
# sailed as catchUp sails it (ui/08-actions.js): the manoeuvring model off, the minute step; a way round shallow water found by Autonav
# is waited for, as playMinutes does with the game closed (sailWaiting)
SAIL = """async () => { for (let i = 0; i < 4000 && S.boat.status === 'sailing'; i++){ DYN.on = false; playMinutes(1, true); while (sailWaiting()) await new Promise(r => setTimeout(r, 30)); } return S.boat.status; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY && S.boat.status === 'port'", timeout=90000)
        pg.set_default_timeout(600000)
        J = lambda js, *a: pg.evaluate(js, *a)
        s = await J(SETUP, os.environ.get('KYST_HOPP_FRA') or None)
        check(not s.get('err'), 'en Autonav-rute mellom to havner på Senja', s)
        if s.get('err'): print(errs); await br.close(); return
        # 1. sailed with the clock
        await J(START, {}); a0 = await J(STATE)
        st = await J(SAIL); a1 = await J(STATE)
        check(st == 'port', '1. seilt med tida: ved kaia i ' + s['B'] + ' etter ' + str(a1['t'] - a0['t']) + ' spillminutter', {'st': st, 'port': a1['port']})
        sail = {'min': a1['t'] - a0['t'], 'fuel': a0['fuel'] - a1['fuel'], 'fresh': a1['fresh'], 'energy': a1['energy'], 'fs': a1['fs'] - a0['fs'], 'nm': a1['nm'] - a0['nm'], 'engH': a1['engH'] - a0['engH']}
        # 2. hopped from the same start
        await J(START, {}); h0 = await J(STATE)
        q = await J("async () => { const q = await hopGo(); return {why:q.why, min:q.min, real:q.real, kr:q.kr, fuel:q.fuel}; }")
        h1 = await J(STATE)
        hop = {'min': q.get('min'), 'kr': q.get('kr'), 'fuel': h0['fuel'] - h1['fuel'], 'fresh': h1['fresh'], 'energy': h1['energy'], 'fs': h1['fs'] - h0['fs'], 'nm': h1['nm'] - h0['nm'], 'engH': h1['engH'] - h0['engH'], 'clock': h1['t'] - h0['t']}
        print('SEILT ' + json.dumps(sail)); print('HOPPET ' + json.dumps(hop))
        near = lambda x, y, f=0.05: abs(x - y) <= f * max(abs(y), 1e-9)
        check(not q.get('why') and h1['st'] == 'port' and h1['port'] == a1['port'], '2a. hoppet: ved den samme kaia med en gang, og klokka sto stille (' + str(hop['clock']) + ' min)', {'why': q.get('why'), 'st': h1['st']})
        check(hop['clock'] == 0, '2b. verdens klokke flyttet seg ikke')
        check(near(hop['min'], sail['min'], 0.10), '2c. hoppet regnet ' + str(hop['min']) + ' spillminutter, seilingen tok ' + str(sail['min']) + ' (innenfor 10 %)')
        check(near(hop['fuel'], sail['fuel']), '2d. dieselen: hoppet ' + str(round(hop['fuel'], 2)) + ' l, seilingen ' + str(round(sail['fuel'], 2)) + ' l (innenfor 5 %)')
        check(near(100 - hop['fresh'], 100 - sail['fresh']), '2e. fisken eldet like mye: ferskhet ' + str(round(hop['fresh'], 2)) + ' mot ' + str(round(sail['fresh'], 2)) + ' (tapet innenfor 5 %)')
        check(near(90 - hop['energy'], 90 - sail['energy']), '2f. energien din: ' + str(round(hop['energy'], 2)) + ' % mot ' + str(round(sail['energy'], 2)) + ' % (tapet innenfor 5 %)')
        check(near(hop['engH'], sail['engH']), '2g. motortimene: ' + str(round(hop['engH'], 3)) + ' mot ' + str(round(sail['engH'], 3)))
        check(hop['fs'] == 0 and hop['nm'] == 0 and sail['nm'] > 0, '2h. ingen fartstid og ingen distanse for hoppet (seilingen ga ' + str(round(sail['fs'])) + ' poeng og ' + str(round(sail['nm'], 1)) + ' nm)')
        check(isinstance(q.get('kr'), int) and q['kr'] >= 5, '2i. prisen: ' + str(q.get('kr')) + ' kr for ' + str(round(q.get('real') or 0, 1)) + ' ekte minutter')
        # 3. the trim is used for the minutes it would have run
        await J(START, {'trim': 72 * 60}); t0 = await J(STATE)
        q3 = await J("async () => { const q = await hopGo(); return {why:q.why, min:q.min, trimMin:q.trimMin}; }")
        t1 = await J(STATE)
        check(not q3.get('why') and q3['trimMin'] > 0 and t0['trimUntil'] - t1['trimUntil'] == q3['trimMin'] and q3['min'] < hop['min'],
              '3. med turbotrim: kortere tur (' + str(q3.get('min')) + ' mot ' + str(hop['min']) + ' min), og trimmen er ' + str(q3.get('trimMin')) + ' min kortere etterpå', q3)
        # 3b. a trim that runs out on the way (40 game minutes left): the hop as the sailing, and the dry run puts the trim back
        await J(START, {'trim': 40}); u0 = await J(STATE); await J(SAIL); u1 = await J(STATE)
        await J(START, {'trim': 40}); v0 = await J(STATE)
        dq = await J("() => { const q = hopQuote(); return {min:q.min, trimMin:q.trimMin, vmax:BOAT.vmax, speed:S.plan.speed, on:!!trimOn(S.boat)}; }")
        check(dq['vmax'] == v0['vmax'] and dq['speed'] == v0['speed'] and dq['on'], '3b. tørrkjøringen setter trimmen, toppfarten og rutas fart tilbake', dq)
        q4 = await J("async () => { const q = await hopGo(); return {why:q.why, min:q.min, trimMin:q.trimMin}; }"); v1 = await J(STATE)
        tu, tv = u1['t'] - u0['t'], q4.get('min') or 0
        check(not q4.get('why') and q4['trimMin'] == 40 and near(tv, tu, 0.10) and near(v0['fuel'] - v1['fuel'], u0['fuel'] - u1['fuel']),
              '3c. trimmen går ut underveis: hoppet ' + str(tv) + ' min og ' + str(round(v0['fuel'] - v1['fuel'], 2)) + ' l, seilingen ' + str(tu) + ' min og ' + str(round(u0['fuel'] - u1['fuel'], 2)) + ' l', q4)
        # 3d. one hand aboard: the crew's fatigue and the gutting as the sailing (crewTick counts whole hours, so within one hour's fatigue)
        await J(START, {'crew': True}); c0 = await J(STATE); await J(SAIL); c1 = await J(STATE)
        await J(START, {'crew': True}); d0 = await J(STATE); await J("async () => { await hopGo(); }"); d1 = await J(STATE)
        hourF = await J("() => { const c = JSON.parse(window.__C); return crewSeaFat(c, false, 1, false); }")
        print('MANNSKAP seilt ' + json.dumps({'fat': c1['fat'] - c0['fat'], 'gut': c1['gut'], 'ice': c1['ice'], 'fresh': c1['fresh']}) + ' hoppet ' + json.dumps({'fat': d1['fat'] - d0['fat'], 'gut': d1['gut'], 'ice': d1['ice'], 'fresh': d1['fresh']}))
        check(abs((d1['fat'] - d0['fat']) - (c1['fat'] - c0['fat'])) <= hourF + 1e-6, '3d. mannskapets slitasje: hoppet ' + str(round(d1['fat'] - d0['fat'], 2)) + ', seilingen ' + str(round(c1['fat'] - c0['fat'], 2)) + ' (innenfor en times slitasje, ' + str(round(hourF, 2)) + ')')
        check(abs((d1['gut'] or 0) - (c1['gut'] or 0)) <= 0.05 and near(100 - d1['fresh'], 100 - c1['fresh'], 0.10) and abs(d1['ice'] - c1['ice']) <= 0.05 * max(1, c1['ice']),
              '3e. sløyingen, ferskheten og isen med en hånd om bord: sløyd ' + str(round(d1['gut'] or 0, 3)) + ' mot ' + str(round(c1['gut'] or 0, 3)) + ', is ' + str(round(d1['ice'], 1)) + ' mot ' + str(round(c1['ice'], 1)))
        # 3f. a fishing stop on the way: the hop goes there, fishing, and the points passed are in the track (the way home reads it)
        mid = await J("() => Math.floor(window.__H.wps.length / 2)")
        await J(START, {'fishAt': mid}); f0 = await J(STATE)
        q5 = await J("async () => { const q = await hopGo(); return {why:q.why, stop:q.stop}; }"); f1 = await J(STATE)
        check(not q5.get('why') and f1['st'] == 'fishing' and f1['trail'] - f0['trail'] == q5['stop'] + 1, '3f. til fiskeplassen midt på ruta: fisker der, og sporet har de ' + str(f1['trail'] - f0['trail']) + ' punktene båten passerte', {'q': q5, 'st': f1['st'], 'trail': f1['trail']})
        # 4. refused, nothing changed; paid, it goes
        await J(START, {})
        r = await J("() => { S.boat.fuel = 0.2; const p0 = JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx, S.t]); const q = hopQuote(); return {why:q.why && q.why[0], same:p0 === JSON.stringify([S.boat.pos, S.boat.fuel, S.plan.idx, S.t])}; }")
        check(bool(r['why']) and 'diesel' in r['why'] and r['same'], '4a. for lite diesel: ' + str(r['why']), r)
        await J(START, {})
        r = await J("() => { WX_FORCE = {w:30, d:200}; const p0 = JSON.stringify([S.boat.pos, S.plan.idx]); const q = hopQuote(); const out = {why:q.why && q.why[0], same:p0 === JSON.stringify([S.boat.pos, S.plan.idx])}; return out; }")
        check(bool(r['why']) and 'Været' in r['why'] and r['same'], '4b. hardt vær på veien: ' + str(r['why']), r)
        r = await J("() => { WX_FORCE = {w:6, d:200}; S.settings.autoOn = true; S.settings.autoW = 4; const q = hopQuote(); const out = {why:q.why && q.why[0], risk:riskLevel(6, hsAt(S.boat.pos, S.t / 60))}; S.settings.autoOn = false; WX_FORCE = {w:30, d:200}; return out; }")
        check(bool(r['why']) and 'Været' in r['why'] and r['risk'] == 0, '4b2. over grensa for Autonav (4 m/s satt, 6 m/s på veien, under båtens risiko): ' + str(r['why']), r)
        r = await J("async () => { const q = await hopGo(true); const out = {why:q.why, st:S.boat.status, port:S.boat.port}; WX_FORCE = null; return out; }")
        check(not r.get('why') and r['st'] == 'port', '4c. betalt (hopGo(true)) går hoppet uansett været', r)
        check(not errs, '5. ingen sidefeil', errs[:3])
        await br.close()
    print('FEIL: ' + str(len(FAIL)) if FAIL else 'Alle OK')

asyncio.run(main())
