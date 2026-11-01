"""The books (Økonomi 2, Ø1, docs/planer/okonomi/02-design.md): every krone in or out goes through book() (core/03-simulation.js), so the
cash, the statement S.ledger, the year's sums S.stats.y and the old totals S.stats.revenue/costs agree to the krone. Three landings with a
hand aboard, ice, a loan and its first instalment, a job cancelled and paid back; a save from before the books keeps this year's figures
as one line each; and the bank's two tabs (the statement, the year's accounts), shot standing and lying."""
from _env import boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
PLAY = r"""(() => {
  const R = {}; S.tut = 0; S.quota = null; S.crew = []; CASHFX.force = false;
  S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); S.cash = 50000; S.loan = S.loanIN = null; txInit(S.t / 60);
  const c0 = S.cash, rv0 = S.stats.revenue, co0 = S.stats.costs, tx0 = S.stats.tax || 0, n0 = (S.ledger || []).length, y = yearH(S.t / 60), Y0 = JSON.parse(JSON.stringify(bookYear()));
  const hand = genCrew(); hand.share = 0.15; S.crew.push(hand);
  const g = 0, land = () => { S.hold = []; S.facc = {}; S.fnext = {}; S.settings.gut = false;
    S.boat.status = 'fishing'; S.boat.pos = {...GROUNDS[g].p}; S.boat.fishUntil = S.t + 300; S.boat.gear = true; S.equip.jukse = 0; S.boat.ice = 150;
    for (let i = 0; i < 300 && S.boat.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); deckMinute(); } S.fsess = {x:GROUNDS[g].p.x, y:GROUNDS[g].p.y};
    S.t += 120; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; S.boat.land = null; sell(); return S.lastSale; };
  const sales = [land(), land(), land()];
  R.sales = sales.map(s => s ? [s.total, s.tk.sum, s.lott] : null);
  // a loan and its first instalment, a job queued and cancelled (paid back), a festival-like prize
  takeLoan(100000, 120); S.t = S.loan.next; hourly();
  R.int = Math.round(S.loan.intPaid || 0);
  book('verft', -2000, 'Prøvejobb', 'Test job'); book('verft', 2000, 'Avbestilt: prøvejobb', 'Cancelled: test job');
  // a pump's litres in a row are one posting
  const nB = S.ledger.length; book('diesel', -100, 'Bunkring', 'Bunkering'); book('diesel', -150, 'Bunkring', 'Bunkering'); R.pumpOne = S.ledger.length === nB + 1 && S.ledger[S.ledger.length - 1].kr === -250;
  const Y = bookYear(), d = k => (Y[k] || 0) - (Y0[k] || 0);
  let inn = 0, ut = 0, tax = 0, bal = 0; for (const k in ACCT){ const v = d(k); if (ACCT[k].s === 'in') inn += v; else if (ACCT[k].s === 'out') ut -= v; else if (ACCT[k].s === 'tax') tax -= v; else bal += v; }
  const led = S.ledger.slice(n0).reduce((a, e) => a + e.kr, 0);
  R.cash = Math.round(S.cash - c0); R.led = led; R.inn = inn; R.rev = Math.round(S.stats.revenue - rv0); R.ut = ut; R.cost = Math.round(S.stats.costs - co0); R.tax = tax; R.tx = Math.round((S.stats.tax || 0) - tx0); R.bal = bal;
  R.sum = inn - ut - tax + bal;
  R.fisk = d('fisk'); R.trekk = d('trekk'); R.mannskap = d('mannskap'); R.laan = d('laan'); R.avdrag = d('avdrag'); R.renter = d('renter'); R.verft = d('verft');
  R.saleTk = sales.reduce((a, s) => a + s.tk.sum, 0); R.saleLott = sales.reduce((a, s) => a + s.lott, 0);
  const last = S.ledger.filter(e => /^Levering/.test(e.no)).pop(); R.landOne = last ? Object.keys(last.p).sort() : null;
  R.balOk = S.ledger[S.ledger.length - 1].bal === Math.round(S.cash);
  // a save from before the books: this tax year's figures so far stand as one line each
  const keep = JSON.stringify(S.stats); S.stats.y = undefined; S.tx.rev0 = S.stats.revenue - 12345; S.tx.cost0 = S.stats.costs - 2345; S.tx.paid = 500;
  const M = bookYear(); R.mig = [M.eldre_inn, M.eldre_ut, M.skatt]; const r2 = bookResult(y); R.migRes = r2.res;
  S.stats = JSON.parse(keep);
  return R; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 800, 'height': 1280}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(PLAY)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(all(r['sales']) and r['fisk'] > 0), 'three landings booked as fish', r['sales'])
        print(ok(r['cash'] == r['led'] == r['sum']), 'the cash moved as the statement and the year\'s sums say, to the krone', (r['cash'], r['led'], r['sum']))
        print(ok(r['inn'] == r['rev'] and r['ut'] == r['cost'] and r['tax'] == r['tx']), 'the old totals (revenue, costs, tax) follow the books', (r['inn'], r['rev'], r['ut'], r['cost'], r['tax'], r['tx']))
        print(ok(-r['trekk'] == r['saleTk'] and -r['mannskap'] == r['saleLott'] and r['saleLott'] > 0), 'the levies and the shares on the notes are the books\' levies and crew', (r['trekk'], r['saleTk'], r['mannskap'], r['saleLott']))
        print(ok(r['laan'] == 100000 and r['renter'] == -r['int'] and r['avdrag'] < 0 and r['verft'] == 0), 'the loan in, the instalment split in interest (a cost) and instalment (not a cost), a job paid back nets to nothing', (r['laan'], r['renter'], r['avdrag'], r['verft']))
        print(ok(r['landOne'] and 'fisk' in r['landOne'] and 'trekk' in r['landOne'] and 'mannskap' in r['landOne'] and r['pumpOne'] and r['balOk']), 'a landing is one posting with its parts; the pump\'s litres add up to one; the statement carries the balance', (r['landOne'], r['pumpOne'], r['balOk']))
        print(ok(r['mig'] == [12345, -2345, -500] and r['migRes'] == 10000), 'a save from before the books keeps this year as one line each', (r['mig'], r['migRes']))
        # the bank's two tabs, standing and lying
        for w, h, tag in ((800, 1280, 'staende'), (1280, 800, 'liggende')):
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate("DOCK.close && DOCK.close(); DOCK.open('bank')"); await pg.wait_for_timeout(400)
            t1 = await pg.evaluate("(document.querySelector('#drawerBody') || document.body).innerText")
            await pg.screenshot(path=os.path.join(OUT, 'boktest_konto_' + tag + '.png'))
            await pg.evaluate("document.querySelector('#drawerBody [data-pa=sub][data-s=regnskap]').click()"); await pg.wait_for_timeout(400)
            t2 = await pg.evaluate("(document.querySelector('#drawerBody') || document.body).innerText")
            await pg.screenshot(path=os.path.join(OUT, 'boktest_regnskap_' + tag + '.png'))
            await pg.evaluate("document.querySelector('#drawerBody [data-pa=sub][data-s=konto]').click()"); await pg.wait_for_timeout(200)
            print(ok('Kontoutskrift' in t1 and 'Levering' in t1 and 'Resultat før skatt' in t2 and 'Fisk levert' in t2 and 'Avdrag på lån' in t2), 'the bank shows the statement and the year\'s accounts (' + tag + ')')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
