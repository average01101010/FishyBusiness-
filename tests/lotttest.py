"""The share settlement (Økonomi 2, Ø2, docs/planer/okonomi/02-design.md; core/04-crew.js OPPG, LOTT) after Norges Fiskarlag's
fiskerioverenskomst and oppgjørsavtaler (from 1.1.2025): the trip counts the fuel burnt, the ice used and the bait set; at the landing the
value less the levies and those common costs is the shared catch, and the crew's part of it is the agreement's table for the fishery, the
length and the men aboard (the jig's by its machines), split in shares: a hand 1, an apprentice 40 % in his first year and half a man in the
table, you aboard 1 (to the cash box), the skipper with you ashore an extra 1/6 share from the company. Old crew on a percentage or a wage
are moved to shares. The landing note and the crew page show it, standing and lying."""
from _env import boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
PLAY = r"""(() => {
  const R = {}; S.tut = 0; S.quota = null; S.crew = []; CASHFX.force = false;
  S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); S.cash = 50000;
  const b = S.boat, hand = genCrew(), appr = genCrew(); hand.attr.erf = 3; hand.attr.sjo = 3; hand.lv = 'erfaren'; appr.attr.erf = 1; appr.attr.sjo = 1; appr.lv = 'lærling'; appr.yrs = 0; hand.share = hand.ask = 1; appr.share = appr.ask = 0.4; S.crew.push(hand, appr);
  // the tables, read off the agreement: nets 2 men under 30 ft, 3 men 40-45 ft; line 4 men 50-55 ft; jig 2 machines 35-40 ft; nets 2.5 men
  // (an apprentice) under 30 ft as the mean of the rows; 1 man takes the nearest row; crab pots +3; ocean 6 men 44-49 m; snow crab
  R.T = [oppgPct(OPPG.garn, 2, 9), oppgPct(OPPG.garn, 3, 12.5), oppgPct(OPPG.line, 4, 15.5), oppgPct(OPPG.juksa, 2, 11), oppgPct(OPPG.garn, 2.5, 9), oppgPct(OPPG.garn, 1, 9),
    Math.round(lottM(2, 9, 'teine') * 1000) / 10, oppgPct(OPPG.hav, 6, 45), oppgPct(OPPG.snokrabbe, 4, 50)];
  // a trip: fuel burnt, ice on the fish, bait set
  b.trip = null; b.fuelKrL = 15; b.fuel = 50; fuelUse(b, 20); R.fuelL = Math.round(tripOf(b).fuelL); R.fuelLeft = b.fuel;
  fuelAdd(b, 30, 30 * 20); R.avg = Math.round(b.fuelKrL * 100) / 100;   // 30 l at 15 and 30 at 20 -> 17.5
  const land = () => { S.hold = []; S.facc = {}; S.fnext = {}; S.settings.gut = false;
    b.status = 'fishing'; b.pos = {...GROUNDS[0].p}; b.fishUntil = S.t + 300; b.gear = true; S.equip.jukse = 0; b.ice = 150;
    for (let i = 0; i < 300 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); deckMinute(); } S.fsess = {x:GROUNDS[0].p.x, y:GROUNDS[0].p.y};
    S.t += 120; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; b.land = null; };
  land(); const fk0 = tripCost(b); R.ice = Math.round(fk0.iceKg); tripOf(b).baitKr += 300;
  const fk = tripCost(b), c0 = S.cash; sell(); const L = S.lastSale;
  R.total = L.total; R.tk = L.tk.sum; R.fk = L.fk.sum; R.fkParts = [L.fk.fuelKr, L.fk.iceKr, L.fk.baitKr]; R.D = L.ls.D; R.n = L.ls.n; R.M2 = L.ls.M; R.tot = L.ls.tot; R.f = L.ls.f; R.wantM = oppgPct(OPPG.juksa, 0, BOAT.len) / 100;
  R.per = L.ls.per.map(p => [p.lots, p.kr]); R.lott = L.lott; R.cash = Math.round(S.cash - c0); R.tripReset = !b.trip || b.trip.fuelL === 0;
  R.wantD = L.total - L.tk.sum - fk.sum; R.wantPot = Math.round(R.wantD * R.wantM);
  R.note = (S.sales[S.sales.length - 1].d || {}).crew;
  // you ashore: the more seasoned hand skippers on 1.5
  S.me = 'nobody'; const Q = lottParty(), Sp = lottSplit(10000); R.skip = Q.P.map(p => [p.c === hand, p.lots, p.sk]); R.skipN = Q.n; R.skX = Q.skX; R.skKr = Sp.per.map(p => p.kr); R.skPot = Sp.pot; R.skTot = Sp.tot; S.me = S.cur;
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
        print(ok(r['T'] == [59.5, 48.5, 54.5, 64.5, 60, 59.5, 62.5, 39.5, 35]), 'the crew\'s percentage as the agreement\'s tables give it (nets, line, jig, an apprentice as half a man, the nearest row, crab pots, ocean, snow crab)', r['T'])
        print(ok(r['fuelL'] == 20 and r['fuelLeft'] == 30 and r['avg'] == 17.5), 'the litres burnt count on the trip, and litres bought keep the tank\'s average price', (r['fuelL'], r['fuelLeft'], r['avg']))
        print(ok(r['ice'] > 0 and r['fkParts'][1] > 0 and r['fkParts'][2] == 300 and r['fk'] == sum(r['fkParts'])), 'ice on the fish and bait set are common costs', (r['ice'], r['fkParts']))
        print(ok(r['D'] == r['wantD'] and r['n'] == 2.5 and r['f'] == 'juksa' and abs(r['M2'] - r['wantM']) < 1e-9 and abs(r['tot'] - 2.4) < 1e-9), 'the shared catch is the value less the levies and the common costs; the jig\'s table without machines; you, a hand and an apprentice (half a man) aboard, 2.4 shares', (r['D'], r['wantD'], r['n'], r['f'], r['M2'], r['tot']))
        per = r['per']
        print(ok(len(per) == 2 and per[0][0] == 1 and per[1][0] == 0.4 and abs(per[0][1] - r['wantPot'] / 2.4) <= 1 and abs(per[1][1] - r['wantPot'] * 0.4 / 2.4) <= 1 and r['lott'] == per[0][1] + per[1][1]),
              'the hand has 1 share, the apprentice in his first year 40 %, and you one that stays in the cash box', (per, r['wantPot'], r['lott']))
        print(ok(r['cash'] == r['total'] - r['tk'] - r['lott'] and r['tripReset']), 'the cash gets the value less the levies and the shares (the common costs were paid before); a new trip starts', (r['cash'], r['total'], r['tk'], r['lott']))
        print(ok(r['note'] and len(r['note'][0]) >= 3), 'the note in the Sales tab keeps the shares and the kroner', r['note'])
        sk_ok = r['skipN'] == 1.5 and any(x[0] and x[1] == 1 and x[2] for x in r['skip']) and not any(not x[0] and x[2] for x in r['skip']) and abs(r['skX'] - 1 / 6) < 1e-9
        print(ok(sk_ok and abs(r['skKr'][0] - r['skPot'] / r['skTot'] * (1 + 1 / 6)) <= 1), 'with you ashore the seasoned hand skippers, with an extra 1/6 share from the company (under 15 m)', (r['skip'], r['skX'], r['skKr'], r['skPot'], r['skTot']))
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
            print(ok('Delingsfangst' in t1 and 'Felleskostnad' in t1 and '0,4 lott' in t1 and 'oppgjørsavtalene' in t1 and 'Lottoppgjøret' in t2 and '1 lott' in t2 and 'hyre' not in t2.lower().replace('søker hyre', '').replace('bestmannshyre', '')), 'the note shows the shared catch and the shares, the crew page the settlement (' + tag + ')')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
