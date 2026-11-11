# The autoliner's work aboard (H2b of docs/planer/havsteget-h2-autoline.md, 05.11.2026), in the built game with the whole coast:
#  - the teams that come with the vessel (two crews of 14, V3 A) run two days of autoline on a ground off Tromsøflaket without you
#    aboard: the deck and factory teams six and six, the line set and hauled again and again, the catch gutted and frozen
#  - the factory: the product frozen a day (at most 15 t), the hold in product weight against the round weight
#  - the trip: the provisions filled when she casts off, the fuel a day against the profitability survey (about 3,900 l a day at sea),
#    the hook change from the store, the trip card's days
#  - the landing at an ocean plant: the frozen catch on pallets of a tonne, about 10 t an hour, the unfrozen frozen at the quay, the
#    share by § 6 to the crew aboard, and the other crew signing on
#  - the UI, standing and lying (800×1280 and 1280×800): the status gauges, Fartøy › Min båt (the hold and the trip), Mannskap (the teams)
# LITE (no 3D). Needs the whole coast in tools/map/out/game (python3 tools/map/release.py and game.py).
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = """async () => {
  const R = {}, b = S.boat, H0 = (Date.UTC(2027, 2, 9, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60); S.tut = 0;
  b.type = 'autoliner'; applyVessel(); S.lic = {id:'konv', hav:true, kf:3.49, hl:'Konvensjonell havfisketillatelse'}; freshQuota();
  S.pgear = newPGear(); const pg = S.pgear; autoL(pg); careInit(pg); baitOf(pg).saury = 4000; baitOf(pg).blekksprut = 3000; pg.hooks = 30000;
  S.crew = []; S.lag = null; S.cash = Math.max(S.cash, 5e6); const G = lagOf(); R.sh = G.sh.length; R.n = lagN();
  // an ocean plant that takes her, nearest Tromsøflaket
  const tgt = P(70.3, 19.0), pts = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'autoliner')).sort((a, c) => dist(a.p, tgt) - dist(c.p, tgt));
  const pt = pts[0]; R.port = pt.name; R.portId = pt.id; await mapNeed(pt.p, 6);
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.fuel = BOAT.fuelCap; b.prov = 0; b.trip = null; S.hold = []; S.plan = null; b.land = null;
  const c0 = S.cash; R.provKr = provFill(); R.prov = b.prov; R.cashDrop = Math.round(c0 - S.cash);
  // out to a ground on the edge off Tromsøflaket (the NPC autoliners' ground nearest 71° N 17° Ø), you ashore
  const GR = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})), t2 = P(71.0, 17.0), p = GR.sort((a, c) => dist(a, t2) - dist(c, t2))[0];
  await mapNeed(p, 14); R.ll = LL(p); window.__p = p;
  b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; b.heading = Math.PI / 2; b.hove = null; S.me = 'ashore';
  return R; }"""

# two days of autoline by the teams: set two lenker at a time until all eight are out, haul the oldest when it has stood six hours and
# set it again at once; the hold, the fuel, the hooks, the provisions and the watch measured over the second day
FISH = """async () => {
  const R = {watch:{}, at:{}}, b = S.boat, pg = S.pgear, p0 = window.__p, tr = tripOf(b), h0 = pg.hooks; tr.seaM = 0; b.autoBank = 0; let k = 0, slow = 0, slowN = 0, d1 = null;
  const T0 = S.t, T1 = T0 + 24 * 60, T2 = T0 + 48 * 60;
  while (S.t < T2 && k++ < 4000){
    if (!b.gop && b.status !== 'port'){
      const sets = mySets(), L = autoL(pg), old = sets.filter(s => !s.hauling && S.t - s.tSet >= 6 * 60).sort((a, c) => a.tSet - c.tSet)[0];
      if (old){ b.pos = {...old.a}; b.status = 'idle'; startHaul(old.id, true, 0); }
      else if (L.n >= 2){ const i = sets.length; b.pos = {x:p0.x + 0.9 * (i % 4), y:p0.y + 1.2 * Math.floor(i / 4)}; b.heading = Math.PI / 2; b.status = 'idle';
        const ch = setChoices().find(c => c.spec && c.spec.lk === 'auto' && c.n === 2); if (ch) R.why = startSet('line', ch.spec, 0, Math.PI / 2); }
    }
    if (S.t === T1 && !d1){ d1 = {t:S.t, fuel:b.fuel, hooks:pg.hooks, prov:b.prov, round:holdTotal(), prod:S.hold.filter(x => x.frozen).reduce((a, x) => a + prodKg(x), 0), seaM:tr.seaM}; }
    if (S.t >= T1 && b.gop && b.gop.op === 'haul'){ slow += haulSlow(b.gop); slowN++; }
    if (S.t % 180 === 0){ const A = workAssign(); R.watch[gDate(S.t / 60).getUTCHours()] = A.filter(q => q.c && q.c.anon).map(q => q.c.name + ':' + q.st).join(', '); }
    step(); }
  const prod = S.hold.filter(x => x.frozen).reduce((a, x) => a + prodKg(x), 0);
  R.day2 = {fuelL:Math.round(d1.fuel - b.fuel), hooks:d1.hooks - pg.hooks, hooks2:h0 - pg.hooks + Math.round(b.autoBank || 0), prov:+(d1.prov - b.prov).toFixed(1), roundKg:Math.round(holdTotal() - d1.round), prodKg:Math.round(prod - d1.prod)};
  R.tot = {roundKg:Math.round(holdTotal()), prodKg:Math.round(holdLoad()), frozenKg:Math.round(prod), unfrozen:Math.round(S.hold.filter(x => !x.frozen).reduce((a, x) => a + x.kg, 0)), meals:(S.meal && S.meal.hist || []).slice(-4)};
  R.slow = slowN ? +(slow / slowN).toFixed(2) : 1; R.sets = mySets().length; R.lenkerAboard = autoL(pg).n; R.line = {cond:autoL(pg).cond, miss:autoL(pg).miss, bent:autoL(pg).bent};
  R.left = (o => ({prov:+o.prov.toFixed(1), fuel:+o.fuel.toFixed(1), bait:+o.bait.toFixed(1), hooks:+o.hooks.toFixed(1), hold:+o.hold.toFixed(1), home:o.home && o.home.pt.name}))(tripLeft(b));
  R.why = R.why || null; R.log = S.log.slice(-6).map(l => l.no).join(' | ');
  return R; }"""

LAND = """async () => {
  const R = {}, b = S.boat, pt = portById(window.__port); await mapNeed(pt.p, 6);
  // she comes in with the gear aboard (the lenker in the sea taken up) and some fish still unfrozen in the tub
  if (b.gop) gopAbort('dock'); for (const s of mySets()){ S.sets.splice(S.sets.indexOf(s), 1); autoL().n += s.n; }
  S.hold.push({sp:'torsk', kg:1200, n:400, cls:0, fresh:90, gut:false, iced:false, bled:true, hr:0, hook:true});
  b.status = 'port'; b.port = pt.id; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0; b.berth = 'main'; S.me = null;
  R.round = Math.round(holdTotal()); R.prodNow = Math.round(holdLoad()); const G = lagOf(); R.on0 = G.on;
  R.started = startLanding(false); const L = b.land; R.kind = L && L.kind; R.n = L && L.n; R.hours = L ? +((L.until - L.t0) / 60).toFixed(1) : null; R.pk = L && L.pk;
  window.__landTxt = typeof landText === 'function' ? landText(false) : '';
  let k = 0; while (b.land && k++ < 3000) step(); R.done = !b.land;
  const ls = S.lastSale || {}; R.total = ls.total; R.lott = ls.lott; R.crew = (ls.ls && ls.ls.per || []).map(q => [q.name, q.lots, q.kr]); R.dl = ls.ls ? [ls.ls.n, +ls.ls.M.toFixed(3)] : null;
  R.on1 = G.on; R.skill = G.sh.map(x => x.skill); R.frozenAll = S.hold.length === 0; R.log = S.log.slice(-5).map(l => l.no).join(' | ');
  return R; }"""


async def shots(pg, tag):
    out = {}
    # upright the status is the strip since UI 2 (U2-1, 06.11.2026), and the whole box with the gauges is the card a tap on the strip opens
    await pg.evaluate("() => { S.settings.hudFull = true; refreshAll(); if (document.body.classList.contains('hudstrip') && typeof hudCardOpen === 'function') hudCardOpen(true); }")
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=os.path.join(OUT, 'fabrikk-hud-' + tag + '.png'))
    out['hud'] = await pg.evaluate("() => (document.querySelector('.gauges') || {}).innerText + ' | ' + Array.from(document.querySelectorAll('.hfull .row')).map(r => r.innerText).join(' / ')")
    await pg.evaluate("() => { if (typeof hudCardOpen === 'function') hudCardOpen(false); S.settings.hudFull = false; refreshAll(); PHONE.open('beholdning:boat'); }")
    await pg.wait_for_timeout(500)
    await pg.evaluate("() => { const h = Array.from(document.querySelectorAll('.ph-card h4')).find(e => /^Turen|^The trip/.test(e.textContent)); if (h) h.scrollIntoView({block:'center'}); }")
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(OUT, 'fabrikk-fartoy-' + tag + '.png'))
    out['fartoy'] = await pg.evaluate("() => Array.from(document.querySelectorAll('.ph-card')).map(c => c.innerText).filter(t => /^(status|turen)/i.test(t)).join(' || ')")
    await pg.evaluate("() => { PHONE.show(false); PHONE.open('mannskap'); }")
    await pg.wait_for_timeout(500)
    await pg.evaluate("() => { const h = Array.from(document.querySelectorAll('.ph-card h4')).find(e => /^Lagene|^The teams/.test(e.textContent)); if (h) h.scrollIntoView({block:'center'}); }")
    await pg.wait_for_timeout(300)
    await pg.screenshot(path=os.path.join(OUT, 'fabrikk-mannskap-' + tag + '.png'))
    out['mannskap'] = await pg.evaluate("() => document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : ''")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); PHONE.open('arbeid'); }")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'fabrikk-arbeid-' + tag + '.png'))
    out['arbeid'] = await pg.evaluate("() => document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : ''")
    await pg.evaluate("() => { PHONE.show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); }")
    return out


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width':1280, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        s = await pg.evaluate(SETUP)
        await pg.evaluate("(id) => { window.__port = id; }", s['portId'])
        print(ok(s['sh'] == 2 and s['n'] == 14), 'to skift à %d følger autolineren' % s['n'])
        print(ok(s['prov'] == 900 and s['provKr'] == 225000 and s['cashDrop'] == 225000), 'proviant ved avgang fra %s: %s manndøgn for %s kr' % (s['port'], s['prov'], s['provKr']))
        f = await pg.evaluate(FISH)
        d = f['day2']
        print(ok(f['why'] is None and f['sets'] >= 3), 'lagene setter og drar autolina uten deg om bord (%d lenker i sjøen, %d om bord)' % (f['sets'] * 2, f['lenkerAboard']))
        print(ok(4000 <= d['roundKg'] <= 20000), 'andre døgn: %d kg rund vekt fanget' % d['roundKg'])
        print(ok(0 < d['prodKg'] <= 15100), 'fryseriet: %d kg produkt fryst andre døgn (høyst 15 000)' % d['prodKg'])
        print(ok(abs(f['tot']['prodKg'] - (f['tot']['frozenKg'] + f['tot']['unfrozen'])) < 2 and f['tot']['prodKg'] < f['tot']['roundKg']), 'lasten: %s kg produkt mot %s kg rund vekt' % (f['tot']['prodKg'], f['tot']['roundKg']))
        print(ok(2800 <= d['fuelL'] <= 5000), 'drivstoff andre døgn: %d l (lønnsomhetsundersøkelsen: om lag 3 900 l per døgn på sjøen)' % d['fuelL'])
        print(ok(3900 <= d['hooks2'] <= 4050), 'krokbyttet: %d kroker på to døgn med det som venter på neste lenke inn (5 %% av 40 000 i døgnet; %d det andre døgnet)' % (d['hooks2'], d['hooks']))
        print(ok(abs(d['prov'] - 14) < 0.2), 'provianten: %s manndøgn spist andre døgn (14 om bord uten deg)' % d['prov'])
        print(ok(f['line']['cond'] > 0.7 and f['line']['miss'] + f['line']['bent'] < 0.02), 'lina etter to døgn: %s' % json.dumps(f['line']))
        print(ok(all(v for v in f['watch'].values()) and len(set(f['watch'].values())) >= 2), 'vaktene skifter: %s' % json.dumps(f['watch'], ensure_ascii=False)[:400])
        print(ok(f['tot']['meals'] and all(q == 4 for q in f['tot']['meals'])), 'kokken: måltidene %s' % f['tot']['meals'])
        print(ok(f['left']['prov'] > 50 and f['left']['bait'] > 3 and f['left']['hold'] > 30 and f['left']['home']), 'turen rekker: %s' % json.dumps(f['left'], ensure_ascii=False))
        print('   draget i snitt %s av farten (haulSlow) andre døgn; %s' % (f['slow'], f['log'][:300]))
        # the UI at sea, both formats
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            u = await shots(pg, tag)
            print(ok(' t' in u['hud'] and 'produkt' in u['hud'] and 'Rund vekt' in u['hud']), 'status: lasten i tonn produkt og rund vekt (%s): %s' % (tag, u['hud'][:160].replace('\n', ' ')))
            print(ok('produkt' in u['fartoy'] and 'Turen' in u['fartoy'] and 'Proviant' in u['fartoy'] and 'Kroker' in u['fartoy']), 'Fartøy › Min båt viser lasten og turen (%s)' % tag)
            print(ok('skift A' in u['mannskap'] and 'vakt' in u['mannskap'] and 'Mannskapsbørsen' not in u['mannskap'] and 'Ingen mannskap' not in u['mannskap']), 'Mannskap viser lagene og ikke børsen (%s)' % tag)
            print(ok(('Dekk ' in u['arbeid'] or 'Fabrikk ' in u['arbeid']) and 'skift A' in u['arbeid']), 'Arbeid: lagene på dekk og kortet (%s): %s' % (tag, u['arbeid'][:160].replace('\n', ' ')))
        await pg.set_viewport_size({'width':1280, 'height':800})
        l = await pg.evaluate(LAND)
        txt = await pg.evaluate("() => window.__landTxt")
        print(ok(l['started'] and l['kind'] == 'pall' and l['n'] == -(-l['pk'] // 1000)), 'lossingen i %s: %s t produkt (%s t rund vekt) på %s paller' % (s['port'], round(l['pk'] / 1000, 1), round(l['round'] / 1000, 1), l['n']))
        print(ok(l['hours'] and abs(l['hours'] - (l['n'] * 6 + 6) / 60) < 1.5), 'lossingen tar %s timer (om lag 10 t i timen, eller frysingen ved kaia): %s' % (l['hours'], txt))
        print(ok(l['done'] and l['frozenAll'] and l['total'] and l['total'] > 0), 'sluttseddelen kom: %s kr' % l['total'])
        print(ok(l['dl'] and l['dl'][0] == 15 and abs(l['dl'][1] - 0.475) < 0.001 and l['crew'] and l['crew'][0][1] == 14), '§ 6 med deg om bord ved levering: %s mann, %s; lotten til skiftet %s' % (l['dl'] and l['dl'][0], l['dl'] and l['dl'][1], l['crew']))
        print(ok(l['on0'] == 0 and l['on1'] == 1 and l['skill'][0] > 3), 'skift A gikk i land og skift B mønstret på (ferdighet %s)' % l['skill'])
        print('   ' + l['log'][:400])
        print('sidefeil', errs[:5])
        await br.close()

asyncio.run(main())
