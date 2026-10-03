"""The way to the first closed-group boat, played by a bot with the game's own functions: a new company at Husøy on 1 March with the
skiff, trips on the plan's route out to the ground north of Husøy, the landing at the plant, and the hand jig and the jigging reels
bought when the money is there. Three paces: a trip every third day, every other day, and every day the weather allows (as the
standing plan with you aboard). Prints, week by week, the cash, the net worth, cod against the quota and blad B, and the first day
and trip the entry boat (the right under 7 m, with Innovasjon Norge's top-up) is within reach. A test to be read (LES): the aim is
about 13 trips, a week of ordinary play. The calibration (October 2026): blad B, that is 1 G, comes after 14-16 trips at every
pace, and Innovasjon Norge's top-up of 15 % (5 % equity) puts the entry there too; with 10 % it took 24 trips."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

PLAY = r"""(async ([every, days, hours]) => {
  S.tut = 0; S.settings.autoOn = false; S.settings.autoW = 14; S.stock = initStock(); S.quota = null; S.crew = []; S.ops = null; S.me = S.cur;
  const b = S.boat, HP = portById('husoy'), Y = 2027;
  S.t = Math.round((Date.UTC(Y, 2, 1, 4) - EPOCH) / 6e4); S.cash = 15000; S.sales = []; S.fm = {n:0, last:-1, kr:0, b:false}; S.loan = S.loanIN = null; S.inUsed = false; S.lic = null;
  b.type = 'skiff'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; b.gear = false; b.fuel = BOAT.fuelCap; b.ice = 0; S.hold = []; S.equip.jukse = 0; S.target = 'mix';
  const W = q => ({x:q.x, y:q.y, port:null, fish:0}), rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0].slice(1).map(q => ({x:q[0], y:q[1]})), G = rt[rt.length - 1];
  const route = () => { const w = exitWps(HP, rt[0]).map(W).concat(rt.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === rt.length - 1 ? hours : 0}))); rt.slice(0, -1).reverse().forEach(q => w.push(W(q)));
    entryWps(HP, rt[0]).forEach(q => w.push(W(q))); w.push({x:HP.p.x, y:HP.p.y, port:'husoy', fish:0}); return w; };
  const O = LIC_OFFERS[0], price = VESSELS[O.ves].price + licValue(O), rows = [], first = {};
  const net = () => Math.round(S.cash + S.fleet.reduce((a, v) => a + vesselValue(v), 0) - debt());
  const until = (t, f) => { let n = 0; while (S.t < t && !(f && f())){ step(); n++; } return n; };
  let trips = 0, lastTrip = -99, nextAt = 0;
  for (let d = 0; d < days; d++){
    until(Math.round((Date.UTC(Y, 2, 1 + d, 5) - EPOCH) / 6e4));
    // the player's call: the waves on the ground and the wind over the trip, within what the boat handles safely
    const H = S.t / 60; let wmax = 0, hmax = 0; for (let k = 0; k <= hours + 4; k++){ wmax = Math.max(wmax, windAt(H + k)); hmax = Math.max(hmax, hsAt(G, H + k)); }
    const calm = wmax <= BOAT.risk[2] && hmax <= BOAT.risk[0];
    if (d >= nextAt && calm && b.status === 'port'){
      // shopping in the order of «Neste mål»: the hand jig, then the reels the boat takes
      if (!b.gear && S.cash >= PRICE.gear + 3000){ S.cash -= PRICE.gear; S.stats.costs += PRICE.gear; b.gear = true; }
      while (b.gear && (S.equip.jukse || 0) < (BOAT.jukseMax || 0) && S.cash >= EQUIP.jukse.price + 8000){ S.cash -= EQUIP.jukse.price; S.stats.costs += EQUIP.jukse.price; S.equip.jukse = (S.equip.jukse || 0) + 1; }
      autoRestock(); until(S.t + 240, () => !portBusy(b));
      S.plan = {wps:route(), idx:0, speed:BOAT.vcruise || 16, returning:false, depAt:null, unsafe:[]}; depart();
      until(S.t + 22 * 60, () => b.status === 'port' && !S.plan);
      until(S.t + 300, () => { if (!b.land && !b.shift && holdTotal() > 0.5) startLanding(false); return !b.land && !b.shift && holdTotal() < 0.5; });
      trips++; nextAt = d + every;
    }
    const q = quotaState(), x = deal(price, vesselValue(curVessel()), innOK()), reach = bladB() && x.ok;
    if (bladB() && first.b == null) first.b = {day:d + 1, trips};
    if (reach && first.entry == null) first.entry = {day:d + 1, trips, cash:Math.round(S.cash)};
    for (const sh of [0.05, 0.1, 0.15]) if (bladB() && S.cash >= price * sh - vesselValue(curVessel()) + 5000 && first['eq' + sh] == null) first['eq' + sh] = {day:d + 1, trips};
    if (d % 7 === 6 || d === days - 1) rows.push({day:d + 1, trips, cash:Math.round(S.cash), net:net(), cod:Math.round(q.torsk || 0), codMax:Math.round(codLimitNow(S.t / 60)), fm:[S.fm.n, Math.round(S.fm.kr)], reels:S.equip.jukse, eqNeed:Math.round(x.eqNeed)});
  }
  const kg = S.sales.reduce((a, s) => a + s.kg, 0), kr0 = S.sales.reduce((a, s) => a + s.total, 0);
  return {rows, first, perTrip:{kg:Math.round(kg / Math.max(1, S.sales.length)), kr:Math.round(kr0 / Math.max(1, S.sales.length))}, price, sales:S.sales.length};
})"""

PROFILES = [('en tur hver tredje dag', 3), ('en tur annenhver dag', 2), ('hver dag været tillater (driftsplan med deg om bord)', 1)]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        for name, every in PROFILES:
            pg = await (await br.new_context(viewport={'width':900, 'height':800})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            r = await pg.evaluate(PLAY, [every, 56, 6])
            print('==', name)
            for row in r['rows']: print('  dag %(day)2d: %(trips)2d turer, kasse %(cash)9d, netto %(net)9d, torsk %(cod)5d / %(codMax)5d kg, blad B %(fm)s, juksamaskiner %(reels)d, egenkapital som trengs %(eqNeed)d' % row)
            print('  per tur: %d kg, %d kr; inngangen koster %d kr' % (r['perTrip']['kg'], r['perTrip']['kr'], r['price']))
            f = r['first']; print('  blad B:', f.get('b'), '· inngangen innen rekkevidde:', f.get('entry'))
            print('  til kalibreringen, når egenkapitalen ville holdt med 5 / 10 / 15 % av prisen:', f.get('eq0.05'), '/', f.get('eq0.1'), '/', f.get('eq0.15'))
            await pg.close()
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
