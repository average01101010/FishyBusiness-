# The snow crab aboard (H3b of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026), in the built game with the whole coast:
#  - the teams that come with the snow crab vessel (two crews of 22) haul and set again 30 strings on Sentralbanken for two days without
#    you aboard: the deck and factory teams four and four on each watch, the crab sorted, split, cooked and frozen as clusters
#  - the factory: the clusters frozen a day (at most 12 t of product), the hold in the clusters' weight against the round weight
#  - the trip: the provisions for 30 days, the fuel a day, the bait for the pots, the trip card
#  - the landing of the frozen clusters at a plant (pallets), the share by § 20 (35 %) and the crew that stays aboard (five weeks on)
#  - a live trip: the crab into the tanks by its size, a day and a half to the plant, the dead in the tanks, the landing of the live
#    crab in tubs on the extra quota first
#  - the tonnes a day and a trip, frozen and live, against the landing notes, and the share a trip
#  - the UI, standing and lying (800×1280 and 1280×800): the trip card with live or frozen, the hold, the quota, the teams, the work
# LITE (no 3D). Needs the whole coast in tools/map/out/game (python3 tools/map/release.py and game.py).
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = """async () => {
  const R = {}, b = S.boat, H0 = (Date.UTC(2027, 1, 8, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60); S.tut = 0;
  if (S.lic){ try { regFree(S.lic.id); } catch (e){} }
  b.type = 'snokrabbe'; applyVessel(); S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'}; freshQuota(); b.snoMode = 'frys';
  S.pgear = newPGear(); const pg = S.pgear; pg.pots.sno = 1000; pg.kits.n = 40; pg.kits.heavy = 40; baitOf(pg).blekksprut = 20000;
  S.crew = []; S.lag = null; S.cash = Math.max(S.cash, 5e7); const G = lagOf(); R.sh = G.sh.length; R.n = lagN(); R.berths = BOAT.berths;
  const tgt = P(70.63, 29.72), pts = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'snokrabbe')).sort((a, c) => dist(a.p, tgt) - dist(c.p, tgt));
  const pt = pts[0]; R.port = pt.name; R.portId = pt.id; await mapNeed(pt.p, 6);
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.fuel = BOAT.fuelCap; b.prov = 0; b.trip = null; S.hold = []; S.plan = null; b.land = null; S.sets = [];
  const c0 = S.cash; R.provKr = provFill(); R.prov = b.prov; R.cashDrop = Math.round(c0 - S.cash);
  // a point on Sentralbanken at the banks' depth where the rules allow the pots, and 30 strings around it that have stood a week
  let p0 = null; for (let k = 0; k < 300 && !p0; k++){ const q = P(74.8 + 0.2 * Math.sin(k), 34.0 + 0.6 * Math.cos(k * 1.3)); await mapNeed(q, 14); const d = depthF(q);
    if (!isLand(q) && d >= 230 && d <= 340 && !ruBlockMsg({p:q, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'})) p0 = q; }
  R.ll = LL(p0); R.depth = Math.round(depthF(p0)); window.__p = p0;
  const T0 = S.t - 7 * 1440; let n = 0;
  for (let i = 0; i < 30; i++){ const a = {x:p0.x - 6 + 2.4 * (i % 6), y:p0.y - 3 + 1.2 * Math.floor(i / 6)}, e = {x:a.x, y:a.y + 5};
    S.sets.push({id:'k' + i, vid:S.cur, kind:'teine', pot:'sno', n:200, a, b:e, tSet:T0 + i * 60, acc:{}, dead:0, bait:'blekksprut', cond:1, heavy:true, depth:Math.round(depthF(a)), warn:0}); n += 200; }   // (with the heavy anchors a snow crab string gets, startSet)
  const tNow = S.t; for (let h = 0; h < 7 * 24; h++){ S.t = T0 + h * 60; const H = S.t / 60; for (const s of S.sets) if (S.t > s.tSet) soakHour(s, H); } S.t = tNow;
  R.sets = S.sets.length; R.pots = n;
  // out to the bank, you ashore
  b.status = 'idle'; b.port = null; b.pos = {...p0}; b.v = 0; b.heading = Math.PI / 2; b.hove = null; S.me = 'ashore';
  return R; }"""

# two days on the bank by the teams: haul the string that has stood longest and set it again at once (the portal's «Trekk og sett ut
# igjen»), round the clock; the catch, the clusters, the fuel, the bait, the provisions and the watch measured over the second day
FISH = """async ([hours]) => {
  const R = {watch:{}}, b = S.boat, pg = S.pgear, tr = tripOf(b); tr.seaM = 0; let k = 0, slow = 0, slowN = 0, d1 = null, hauls = 0;
  const T0 = S.t, T1 = T0 + 24 * 60, T2 = T0 + hours * 60, prodF = () => S.hold.filter(x => x.frozen && !x.rund).reduce((a, x) => a + prodKg(x), 0);
  while (S.t < T2 && k++ < hours * 120){
    if (!b.gop && b.status !== 'port'){
      const old = mySets().filter(s => !s.hauling && S.t - s.tSet >= 3 * 1440).sort((a, c) => a.tSet - c.tSet)[0];
      if (old){ b.pos = {...old.a}; b.status = 'idle'; R.why = startHaul(old.id, true, 0) || R.why; hauls++; }
    }
    if (S.t === T1 && !d1){ d1 = {fuel:b.fuel, bait:baitKg(pg), prov:b.prov, round:holdTotal(), prod:prodF(), tank:tankLoad(), dead:(tr.tankDead || 0)}; }
    if (S.t >= T1 && b.gop && b.gop.op === 'haul'){ slow += haulSlow(b.gop); slowN++; }
    if (S.t % 180 === 0){ const A = workAssign(); R.watch[gDate(S.t / 60).getUTCHours()] = A.filter(q => q.c && q.c.anon).map(q => q.c.name.replace('Fabrikk ', 'F').replace('Dekk ', 'D') + ':' + q.st).join(' '); }
    step(); }
  const d = d1 || {fuel:b.fuel, bait:baitKg(pg), prov:b.prov, round:0, prod:0, tank:0, dead:0};
  R.day2 = {fuelL:Math.round(d.fuel - b.fuel), bait:Math.round(d.bait - baitKg(pg)), prov:+(d.prov - b.prov).toFixed(1), roundKg:Math.round(holdTotal() - d.round), prodKg:Math.round(prodF() - d.prod), tankKg:Math.round(tankLoad() - d.tank)};
  R.tot = {roundKg:Math.round(holdTotal()), prodKg:Math.round(holdLoad()), clusters:Math.round(prodF()), waiting:Math.round(S.hold.filter(x => !x.frozen && !x.tank).reduce((a, x) => a + x.kg, 0)), tank:Math.round(tankLoad()), dead:Math.round(S.hold.filter(x => x.rund).reduce((a, x) => a + x.kg, 0)), tankDead:Math.round(tr.tankDead || 0), meals:(S.meal && S.meal.hist || []).slice(-4)};
  R.slow = slowN ? +(slow / slowN).toFixed(2) : 1; R.hauls = hauls; R.inSea = mySets().length; R.potsAboard = pg.pots.sno; R.potsSea = mySets().reduce((a, s) => a + s.n, 0) + (b.gop ? b.gop.n - b.gop.done : 0);
  R.left = (o => ({prov:+o.prov.toFixed(1), fuel:+o.fuel.toFixed(1), bait:+o.bait.toFixed(1), hold:+o.hold.toFixed(1), tank:o.tank == null ? null : +o.tank.toFixed(1), age:o.tankAge == null ? null : +o.tankAge.toFixed(1), home:o.home && o.home.pt.name, homeD:o.home && +o.home.days.toFixed(2)}))(tripLeft(b));
  R.log = S.log.slice(-8).map(l => l.no).filter(x => /Sortert|Tank|Skift|Turen/.test(x)).join(' | ');
  return R; }"""

# the steaming home of a live trip: a day and a half lying still (the tanks keep running), the crab dying by and by
WAIT = """async ([hours]) => { const b = S.boat; if (b.gop) gopAbort('dock'); b.status = 'idle'; const t0 = tankLoad(), d0 = tripOf(b).tankDead || 0;
  for (let i = 0; i < hours * 60; i++) step(); return {tank0:Math.round(t0), tank:Math.round(tankLoad()), dead:Math.round((tripOf(b).tankDead || 0) - d0)}; }"""

LAND = """async () => {
  const R = {}, b = S.boat, pt = portById(window.__port); await mapNeed(pt.p, 6);
  if (b.gop) gopAbort('dock');
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.berth = 'main'; S.me = null;
  const q = quotaState(); R.q0 = [Math.round(q.snokrabbe), Math.round(q.snoTq || 0)];
  R.round = Math.round(holdTotal()); R.prodNow = Math.round(holdLoad()); R.tank = Math.round(tankLoad()); const G = lagOf(); R.on0 = G.on;
  R.started = startLanding(false); const L = b.land; R.kind = L && L.kind; R.n = L && L.n; R.np = L && L.np; R.kar = L && L.kar; R.hours = L ? +((L.until - L.t0) / 60).toFixed(1) : null; R.pk = L && L.pk; R.lv = L && L.lv;
  window.__landTxt = typeof landText === 'function' ? landText(false) : '';
  let k = 0; while (b.land && k++ < 3000) step(); R.done = !b.land;
  const ls = S.lastSale || {}; R.total = ls.total; R.lott = ls.lott; R.crew = (ls.ls && ls.ls.per || []).map(x => [x.name, x.lots, x.kr]); R.dl = ls.ls ? [ls.ls.n, +ls.ls.M.toFixed(3), ls.ls.f] : null;
  R.lines = (ls.lines || []).filter(r => r.sp === 'snokrabbe').map(r => [SPECIES.snokrabbe.cls[r.c][2], Math.round(r.kg), r.sum, +(r.sum / Math.max(1, r.gut ? r.kg / SPECIES.snokrabbe.uh : r.kg)).toFixed(1)]);
  R.sno = ls.sno; R.fk = ls.fk; R.D = ls.ls ? [ls.ls.D, ls.ls.pot, ls.ls.tot] : null; R.tk = ls.tk ? ls.tk.sum : null; R.fuelKrL = b.fuelKrL; R.q1 = [Math.round(q.snokrabbe), Math.round(q.snoTq || 0)];
  R.on1 = G.on; R.empty = S.hold.length === 0; R.log = S.log.slice(-6).map(l => l.no).join(' | ');
  return R; }"""


async def shots(pg, tag):
    out = {}
    await pg.evaluate("() => { S.settings.hudFull = false; refreshAll(); PHONE.open('beholdning:boat'); }")
    await pg.wait_for_timeout(500)
    await pg.evaluate("() => { const h = Array.from(document.querySelectorAll('.ph-card h4')).find(e => /^Turen|^The trip/.test(e.textContent)); if (h) h.scrollIntoView({block:'start'}); }")
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(OUT, 'krabbefabrikk-turen-' + tag + '.png'))
    out['turen'] = await pg.evaluate("() => Array.from(document.querySelectorAll('.ph-card')).map(c => c.innerText).filter(t => /^(status|turen)/i.test(t)).join(' || ')")
    await pg.evaluate("() => { PHONE.show(false); PHONE.open('beholdning:last'); }")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'krabbefabrikk-last-' + tag + '.png'))
    out['last'] = await pg.evaluate("() => document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : (document.getElementById('phView') || {}).innerText || ''")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); PHONE.open('arbeid'); }")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'krabbefabrikk-arbeid-' + tag + '.png'))
    out['arbeid'] = await pg.evaluate("() => document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : ''")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); }")
    return out


async def shots2(pg, tag):
    # after the landings: the quota app (the vessel quota and the extra quota) and the landing note in the logbook's sales
    out = {}
    await pg.evaluate("() => { PHONE.show(true); PHONE.open('kvote'); }")
    await pg.wait_for_timeout(500)
    await pg.evaluate("() => { const h = Array.from(document.querySelectorAll('.ph-card h4')).find(e => /Snøkrabbetillatelse|Snow crab permit/.test(e.textContent)); if (h) h.scrollIntoView({block:'start'}); }")
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(OUT, 'krabbefabrikk-kvote-' + tag + '.png'))
    out['kvote'] = await pg.evaluate("() => Array.from(document.querySelectorAll('.ph-card')).map(c => c.innerText).filter(t => /Snøkrabbetillatelse|Snow crab permit/.test(t)).join(' || ')")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); PHONE.open('beholdning:boat'); }")
    await pg.wait_for_timeout(500)
    await pg.evaluate("() => { const h = Array.from(document.querySelectorAll('.ph-card h4')).find(e => /^Turen|^The trip/.test(e.textContent)); if (h) h.scrollIntoView({block:'start'}); }")
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(OUT, 'krabbefabrikk-valg-' + tag + '.png'))
    out['valg'] = await pg.evaluate("() => Array.from(document.querySelectorAll('[data-pa=snomode]')).map(b => b.innerText).join(' / ')")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); }")
    return out


def lines(l):
    return ', '.join('%s %s kg %s kr (%s kr/kg)' % tuple(r) for r in (l['lines'] or []))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width':1280, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        s = await pg.evaluate(SETUP)
        await pg.evaluate("(id) => { window.__port = id; }", s['portId'])
        print(ok(s['sh'] == 2 and s['n'] == 22 and s['berths'] >= 23), 'to skift à %d følger snøkrabbefartøyet, %d køyer' % (s['n'], s['berths']))
        print(ok(s['prov'] == 690 and s['provKr'] == 172500 and s['cashDrop'] == 172500), 'proviant ved avgang fra %s: %s manndøgn (30 døgn til 23) for %s kr' % (s['port'], s['prov'], s['provKr']))
        print('   feltet på Sentralbanken: %s, %d m; %d lenker (%d teiner) har stått en uke' % (s['ll'], s['depth'], s['sets'], s['pots']))
        f = await pg.evaluate(FISH, [48])
        d = f['day2']
        print(ok(not f.get('why') and f['hauls'] >= 10 and f['inSea'] >= 28), 'lagene trekker og setter ut igjen uten deg om bord: %d lenker trukket på to døgn (%d teiner i døgnet), %d i sjøen, %d teiner i sjøen og %d om bord' % (f['hauls'], f['hauls'] * 100, f['inSea'], f['potsSea'], f['potsAboard']))
        print(ok(4000 <= d['roundKg'] <= 18000), 'andre døgn: %.1f t rund vekt fanget og beholdt (sedlene: 4,7–6,5 t per døgn mellom landingene, H3a: 8,4 t per fiskedøgn på Sentralbanken i februar)' % (d['roundKg'] / 1000))
        print(ok(0 < d['prodKg'] <= 12100), 'fabrikken: %.1f t klør fryst andre døgn (høyst 12 t)' % (d['prodKg'] / 1000))
        t = f['tot']
        print(ok(abs(t['prodKg'] - (t['clusters'] + t['waiting'] + t['dead'])) < 3 and t['prodKg'] < t['roundKg'] and t['tank'] == 0), 'lasten: %s kg i rommet (klør %s, venter i fabrikken %s, død rund %s) mot %s kg rund vekt' % (t['prodKg'], t['clusters'], t['waiting'], t['dead'], t['roundKg']))
        print(ok(4500 <= d['fuelL'] <= 8000), 'drivstoff andre døgn: %d l (antatt om lag 5 800 på et fiskedøgn)' % d['fuelL'])
        print(ok(400 <= d['bait'] <= 1000), 'agnet: %d kg akkar andre døgn (et halvt kilo per teine)' % d['bait'])
        print(ok(abs(d['prov'] - 22) < 0.2), 'provianten: %s manndøgn spist andre døgn (22 om bord uten deg)' % d['prov'])
        print(ok(all(v for v in f['watch'].values()) and len(set(f['watch'].values())) >= 2 and all('F' in v for v in f['watch'].values())), 'vaktene skifter, fabrikklaget på hver vakt: %s' % json.dumps(f['watch'], ensure_ascii=False)[:500])
        print(ok(t['meals'] and all(q == 4 for q in t['meals'])), 'kokken: måltidene %s' % t['meals'])
        print(ok(f['left']['prov'] > 25 and f['left']['bait'] > 10 and f['left']['hold'] > 30 and f['left']['home']), 'turen rekker: %s' % json.dumps(f['left'], ensure_ascii=False))
        print('   draget i snitt %s av farten (haulSlow) andre døgn; %s' % (f['slow'], f['log'][:300]))
        perDayF = d['roundKg'] / 1000
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            u = await shots(pg, tag)
            print(ok('Turen' in u['turen'] and 'Fryste klør' in u['turen'] and 'Levende krabbe' in u['turen'] and 'Agn' in u['turen'] and 'Tankene' in u['turen']), 'Fartøy › Min båt: turen med valget levende eller fryst, agnet og tankene (%s)' % tag)
            print(ok('klør, fryst' in u['last'] and 'Tankene' in u['last']), 'Om bord › Lasterom: snøkrabben som klør og tankene (%s)' % tag)
            print(ok('Deling' in u['arbeid'] or 'Koking' in u['arbeid'] or 'Deler krabben' in u['arbeid'] or 'Koker' in u['arbeid']), 'Mannskap: fabrikken deler og koker (%s): %s' % (tag, u['arbeid'][:200].replace('\n', ' ')))
        await pg.set_viewport_size({'width':1280, 'height':800})
        l = await pg.evaluate(LAND)
        txt = await pg.evaluate("() => window.__landTxt")
        print(ok(l['started'] and l['kind'] == 'pall' and l['np'] == -(-l['pk'] // 1000) and not l['kar']), 'lossingen av klør i %s: %.1f t klør (%.1f t rund vekt) på %s paller' % (s['port'], l['pk'] / 1000, l['round'] / 1000, l['np']))
        print(ok(l['done'] and l['empty'] and l['total'] and l['total'] > 0), 'sluttseddelen: %s kr; %s' % (l['total'], lines(l)))
        print(ok(l['dl'] and l['dl'][0] == 23 and abs(l['dl'][1] - 0.35) < 0.001 and l['dl'][2] == 'snokrabbe' and l['crew'] and l['crew'][0][1] == 22), '§ 20 med deg om bord: %s mann, %s; lotten til skiftet %s' % (l['dl'] and l['dl'][0], l['dl'] and l['dl'][1], l['crew']))
        print(ok(l['on0'] == l['on1']), 'skiftet blir om bord: det har ikke gått fem uker (%s)' % l['log'][:200])
        print(ok(l['q1'][0] - l['q0'][0] == l['round'] and l['q1'][1] == l['q0'][1]), 'kvoten: %s kg på fartøykvoten, ingen på tilleggskvoten' % (l['q1'][0] - l['q0'][0]))
        fz = l
        # a live trip: the crab into the tanks, a day and a half to the plant, landed in tubs
        live = await pg.evaluate("""async () => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {...window.__p}; S.me = 'ashore'; b.prov = 0; provFill(); const ch = snoSetMode('lev'); return {ch, live:snoLive()}; }""")
        print(ok(live['ch'] and live['live']), 'turen er for levende krabbe')
        f2 = await pg.evaluate(FISH, [48])
        d2 = f2['day2']; t2 = f2['tot']
        print(ok(t2['tank'] > 5000 and t2['tank'] <= 40000 and d2['tankKg'] > 2000), 'to døgn: %.1f t levende i tankene (%.1f t andre døgn), %.1f t klør, %s kg død rund' % (t2['tank'] / 1000, d2['tankKg'] / 1000, t2['clusters'] / 1000, t2['dead']))
        print(ok(f2['left']['tank'] is not None and f2['left']['age'] is not None), 'turkortet: tankene rekker %s døgn til, eldste krabbe %s døgn' % (f2['left']['tank'], f2['left']['age']))
        w = await pg.evaluate(WAIT, [36])
        print(ok(w['dead'] > 0 and w['tank'] < w['tank0']), 'halvannet døgn til mottaket: %s kg døde i tankene, %s kg levende igjen' % (w['dead'], w['tank']))
        l2 = await pg.evaluate(LAND)
        sh = (l2['round'] - l2['tank']) and None
        deadSh = f2['tot']['tankDead'] + w['dead']
        print(ok(l2['started'] and l2['kar'] and l2['kar'] == -(-l2['lv'] // 400)), 'lossingen av levende krabbe: %.1f t i %s kar og %.1f t klør på %s paller, %s timer' % (l2['lv'] / 1000, l2['kar'], (l2['pk'] or 0) / 1000, l2['np'], l2['hours']))
        print(ok(l2['done'] and l2['sno'] and abs(l2['sno']['tq'] - l2['lv']) < 0.005 * l2['lv'] and abs(l2['q1'][1] - l2['q0'][1] - l2['sno']['tq']) < 2), 'tilleggskvoten: %.1f t levende på den, %.1f t på fartøykvoten' % (l2['sno']['tq'] / 1000, l2['sno']['ord'] / 1000))
        print(ok(any(r[0].startswith('Levende') for r in l2['lines']) and any(r[0] == 'Død snøkrabbe' and r[3] <= 1.01 for r in l2['lines'])), 'sluttseddelen: %s' % lines(l2))
        deadPct = 100 * deadSh / max(1, deadSh + l2['lv'])
        print(ok(0.2 <= deadPct <= 6), 'død i tankene på turen: %.1f %% (sedlene 2026: 2,9 %%; denne turen er kortere enn ni døgn)' % deadPct)
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            u = await shots2(pg, tag)
            print(ok('Tilleggskvote' in u['kvote'] and 'Fartøykvote' in u['kvote'] and 'Torsk' not in u['kvote']), 'Kvote › Mine kvoter: fartøykvoten og tilleggskvoten for snøkrabbe (%s): %s' % (tag, u['kvote'][:220].replace('\n', ' ')))
            print(ok('Levende krabbe ✓' in u['valg']), 'valget står på levende (%s): %s' % (tag, u['valg']))
        # the tonnes a day and a trip against the notes, and the share a trip (worked out from the two days and the landings)
        home = f['left']['homeD'] or 1.0
        fishD = 20 - 2 * home - 1
        tripF = perDayF * fishD
        print('== tonn og lott mot sedlene')
        print('   fryst: %.1f t rund vekt per fiskedøgn, %.1f t klør; en tur på 20 døgn (%.1f døgn gange hver vei, ett døgn lossing) gir om lag %.0f t rund vekt (sedlene 2024–2026: median 99–123 t per landing, 4,7–6,5 t per døgn mellom landingene)' % (perDayF, d['prodKg'] / 1000, home, tripF))
        lottDay = (fz['lott'] or 0) / 2
        print('   lotten for to døgn med klør: %s kr til skiftet (%s kr per mann); en tur på 20 døgn: om lag %.0f kr per mann' % (fz['lott'], fz['crew'] and fz['crew'][0][2] // 22, lottDay * fishD / 22))
        perDayL = (t2['tank'] + f2['tot']['tankDead']) / 1000 / 2
        tripL = min(40, perDayL * 6)
        print('   levende: %.1f t i tankene per fiskedøgn; tankene (40 t) fulle etter %.1f fiskedøgn; en tur på 8–9 døgn gir om lag %.0f t (sedlene 2026: median 32 t per landing, 9 døgn mellom)' % (perDayL, 40 / max(0.1, perDayL), tripL))
        print('   lotten for den levende landingen: %s kr til skiftet' % l2['lott'])
        print('   turkostnadene (fk) og delingsfangsten: klør %s, D %s, trekk %s; levende %s, D %s, trekk %s; tankens dieselpris %s' % (fz['fk'], fz['D'], fz['tk'], l2['fk'], l2['D'], l2['tk'], l2['fuelKrL']))
        print('sidefeil', errs[:5])
        await br.close()

asyncio.run(main())
