"""The share settlement (Økonomi 2, Ø2, docs/planer/okonomi/02-design.md; core/04-crew.js LOTT): the trip counts the fuel burnt, the ice
used and the bait set; at the landing the value less the levies and those common costs is the shared catch, and the crew's part of it
by the people aboard (lottM) is split in shares: a hand 1, an apprentice 0.75, the skipper 1.5 with you ashore, you aboard 1 (to the cash
box). Old crew on a percentage or a wage are moved to shares. The landing note and the crew page show it, standing and lying."""
from _env import boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
PLAY = r"""(() => {
  const R = {}; S.tut = 0; S.quota = null; S.crew = []; CASHFX.force = false;
  S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); S.cash = 50000;
  const b = S.boat, hand = genCrew(), appr = genCrew(); hand.attr.erf = 3; hand.attr.sjo = 3; appr.attr.erf = 1; appr.attr.sjo = 1; hand.share = hand.ask = 1; appr.share = appr.ask = 0.75; S.crew.push(hand, appr);
  // the table
  R.M = [1, 2, 3, 4, 6, 8].map(n => lottM(n, 10)); R.Mbig = lottM(6, 40);
  // a trip: fuel burnt, ice on the fish, bait set
  b.trip = null; b.fuelKrL = 15; b.fuel = 50; fuelUse(b, 20); R.fuelL = Math.round(tripOf(b).fuelL); R.fuelLeft = b.fuel;
  fuelAdd(b, 30, 30 * 20); R.avg = Math.round(b.fuelKrL * 100) / 100;   // 30 l at 15 and 30 at 20 -> 17.5
  const land = () => { S.hold = []; S.facc = {}; S.fnext = {}; S.settings.gut = false;
    b.status = 'fishing'; b.pos = {...GROUNDS[0].p}; b.fishUntil = S.t + 300; b.gear = true; S.equip.jukse = 0; b.ice = 150;
    for (let i = 0; i < 300 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); deckMinute(); } S.fsess = {x:GROUNDS[0].p.x, y:GROUNDS[0].p.y};
    S.t += 120; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.land = null; };
  land(); const fk0 = tripCost(b); R.ice = Math.round(fk0.iceKg); tripOf(b).baitKr += 300;
  const fk = tripCost(b), c0 = S.cash; sell(); const L = S.lastSale;
  R.total = L.total; R.tk = L.tk.sum; R.fk = L.fk.sum; R.fkParts = [L.fk.fuelKr, L.fk.iceKr, L.fk.baitKr]; R.D = L.ls.D; R.n = L.ls.n; R.M2 = L.ls.M; R.tot = L.ls.tot;
  R.per = L.ls.per.map(p => [p.lots, p.kr]); R.lott = L.lott; R.cash = Math.round(S.cash - c0); R.tripReset = !b.trip || b.trip.fuelL === 0;
  R.wantD = L.total - L.tk.sum - fk.sum; R.wantPot = Math.round(R.wantD * lottM(3, BOAT.len));
  R.note = (S.sales[S.sales.length - 1].d || {}).crew;
  // you ashore: the more seasoned hand skippers on 1.5
  S.me = 'nobody'; const Q = lottParty(); R.skip = Q.P.map(p => [p.c === hand, p.lots, p.sk]); R.skipN = Q.n; S.me = S.cur;
  // old crew: a percentage and a wage become shares
  const o1 = genCrew(); o1.share = 0.15; o1.ask = 0.18; const o2 = genCrew(); o2.share = 0.1; o2.ask = 0.1; o2.pay = 'hyre'; o2.hyre = 700;
  lotMigrate(o1); lotMigrate(o2); R.mig = [o1.share, o1.ask, o2.share, o2.pay || null, o2.hyre || null];
  // the morale's yardstick scales with the boat
  R.wk = [weekKr(6), weekKr(10.5), weekKr(21)].map(Math.round); R.lw = Math.round(lotWeek(hand));
  return R; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 800, 'height': 1280}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(PLAY)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['M'] == [0.3, 0.3, 0.36, 0.4, 0.44, 0.48] and abs(r['Mbig'] - 0.42) < 1e-9), 'the crew\'s part by the people aboard and the length', (r['M'], r['Mbig']))
        print(ok(r['fuelL'] == 20 and r['fuelLeft'] == 30 and r['avg'] == 17.5), 'the litres burnt count on the trip, and litres bought keep the tank\'s average price', (r['fuelL'], r['fuelLeft'], r['avg']))
        print(ok(r['ice'] > 0 and r['fkParts'][1] > 0 and r['fkParts'][2] == 300 and r['fk'] == sum(r['fkParts'])), 'ice on the fish and bait set are common costs', (r['ice'], r['fkParts']))
        print(ok(r['D'] == r['wantD'] and r['n'] == 3 and abs(r['M2'] - 0.36) < 1e-9 and r['tot'] == 2.75), 'the shared catch is the value less the levies and the common costs; three aboard, 2.75 shares', (r['D'], r['wantD'], r['n'], r['M2'], r['tot']))
        per = r['per']
        print(ok(len(per) == 2 and per[0][0] == 1 and per[1][0] == 0.75 and abs(per[0][1] - r['wantPot'] / 2.75) <= 1 and abs(per[1][1] - r['wantPot'] * 0.75 / 2.75) <= 1 and r['lott'] == per[0][1] + per[1][1]),
              'the hand has 1 share, the apprentice 0.75, and you one that stays in the cash box', (per, r['wantPot'], r['lott']))
        print(ok(r['cash'] == r['total'] - r['tk'] - r['lott'] and r['tripReset']), 'the cash gets the value less the levies and the shares (the common costs were paid before); a new trip starts', (r['cash'], r['total'], r['tk'], r['lott']))
        print(ok(r['note'] and len(r['note'][0]) >= 3), 'the note in the Sales tab keeps the shares and the kroner', r['note'])
        print(ok(r['skipN'] == 2 and any(x[0] and x[1] == 1.5 and x[2] for x in r['skip']) and not any(not x[0] and x[2] for x in r['skip'])), 'with you ashore the seasoned hand skippers on 1.5 shares', r['skip'])
        print(ok(r['mig'] == [1, 1.25, 0.75, None, None]), 'a percentage becomes the nearest quarter share (15 % a whole, 10 % an apprentice\'s 0.75), a wage becomes a share', r['mig'])
        print(ok(r['wk'][0] < r['wk'][1] < r['wk'][2] and r['lw'] > 0), 'the week a share is measured against grows with the boat', (r['wk'], r['lw']))
        # the landing note and the crew page, standing and lying
        for w, h, tag in ((800, 1280, 'staende'), (1280, 800, 'liggende')):
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate("DOCK.close && DOCK.close(); DOCK.open('lever')"); await pg.wait_for_timeout(400)
            t1 = await pg.evaluate("(document.querySelector('#drawerBody') || document.body).innerText")
            await pg.evaluate("const e = [...document.querySelectorAll('#drawerBody tr')].find(x => /Delingsfangst/.test(x.innerText)); if (e) e.scrollIntoView({block:'center'})"); await pg.wait_for_timeout(200)
            await pg.screenshot(path=os.path.join(OUT, 'lotttest_seddel_' + tag + '.png'))
            await pg.evaluate("DOCK.close(); DOCK.open('mannskap')"); await pg.wait_for_timeout(400)
            t2 = await pg.evaluate("(document.querySelector('#drawerBody') || document.body).innerText")
            await pg.screenshot(path=os.path.join(OUT, 'lotttest_mannskap_' + tag + '.png'))
            print(ok('Delingsfangst' in t1 and 'Felleskostnad' in t1 and '0,75 lott' in t1 and 'Lottoppgjøret' in t2 and '1 lott' in t2 and 'hyre' not in t2.lower().replace('søker hyre', '')), 'the note shows the shared catch and the shares, the crew page the settlement (' + tag + ')')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
