"""The tax as in life (Økonomi 2, Ø4, docs/planer/okonomi/02-design.md; core/03-simulation.js TAX, taxTick, txClose): three years played
day by day with a steady income. A sole proprietor (ENK) pays the advance in four terms 15 March, June, September and December of the
year itself and gets the settlement 20 June the year after; the company founded 1 July 2029 takes the profit from then, pays its advance
15 February and 15 April the year after and gets the settlement 20 October. A notice comes a week before each payment; the tax account
takes the set-aside and pays first; a loss is carried forward; the shielding lowers the personal income only."""
from _env import boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
PLAY = r"""(() => {
  const R = {}, H0 = (Date.UTC(2028, 0, 1) - EPOCH) / 36e5, pays = [], warns = [];
  S.tut = 0; S.form = undefined; S.company = null; S.saldo = {}; S.taxCarry = {ENK:0, AS:0}; S.txY = {}; S.taxLast = null; S.bank = null; S.cash = 2e6; S.loan = S.loanIN = null; S.crew = [];
  S.t = H0 * 60; txInit(H0, 0); const sal0 = depBase();
  const pay0 = taxPay; taxPay = (kr0, no, en) => { pays.push([gDate(S.t / 60).toISOString().slice(0, 10), Math.round(kr0), no]); return pay0(kr0, no, en); };
  const msg0 = msg; msg = (from, no, en) => { if (from === 'Skatteetaten' && /forfaller/.test(no)) warns.push(gDate(S.t / 60).toISOString().slice(0, 10)); return msg0(from, no, en); };
  const yr = {}; let fromAcct = 0;
  const end = (Date.UTC(2030, 10, 1) - EPOCH) / 36e5;
  for (let H = H0; H < end; H += 24){
    S.t = H * 60; const d = gDate(H), y = d.getUTCFullYear(), doy = Math.floor((d - Date.UTC(y, 0, 1)) / 864e5);
    if (d.getUTCMonth() === 6 && d.getUTCDate() === 1 && y === 2029){ R.enkBefore = Math.round(txProfit(H)); foundAS(); R.asT = S.tx.enk; }
    const sk0 = S.bank ? S.bank.skatt : 0;
    taxTick(H); bankDay(H);
    if (S.bank && S.bank.skatt < sk0 - 0.5) fromAcct += sk0 - S.bank.skatt;
    if (S.tx.y === y && doy < 140 && S.tx.days[S.tx.days.length - 1] !== Math.floor(H / 24)) S.tx.days.push(Math.floor(H / 24));
    if (d.getUTCDay() === 1){ book('fisk', 30000, 'Levering', 'Landing'); book('diesel', -5000, 'Bunkring', 'Bunkering'); bankAfterIncome(25000); }
    if (d.getUTCMonth() === 11 && d.getUTCDate() === 31) yr[y] = {P:Math.round(txProfit(H + 23.99)), adv:Math.round(S.tx.adv), paid:Math.round(S.tx.paid)};
  }
  R.pays = pays; R.warns = warns; R.yr = yr; R.txY = JSON.parse(JSON.stringify(S.txY)); R.fromAcct = Math.round(fromAcct); R.skatt = Math.round(S.bank.skatt); R.owed = taxOwed();
  R.sal = [sal0, depBase()]; R.taxLast = S.taxLast;
  // the units: the loss carried, the shielding on the personal income only
  const a = taxOf(500000, 'ENK', 140, 0, 200000), b0 = taxOf(500000, 'ENK', 140, 0, 0), c = taxOf(500000, 'ENK', 140, 100000, 0);
  R.carry = [a.carry, a.sum < b0.sum, c.alm === b0.alm, c.tryg < b0.tryg, c.trinn < b0.trinn];
  // a year with a loss carries it
  S.form = undefined; S.taxCarry = {ENK:0, AS:0}; S.t = ((Date.UTC(2031, 0, 1) - EPOCH) / 36e5) * 60; S.tx = {y:2030, rev0:S.stats.revenue + 100000, cost0:S.stats.costs, f0:0, paid:0, adv:0, days:[], enk:null}; txClose(S.t / 60);
  R.loss = [Math.round(taxCarry().ENK), S.txY[2030].enk.R.sum];
  // a company that paid the quarterly advance before the terms (CapteinAdrian 28.10.2026): it counts in what is owed, at the close and in
  // the terms the year after, so the year's tax is paid once
  S.form = 'AS'; S.taxCarry = {ENK:0, AS:0}; S.txY = {}; S.bank = null; S.cash = 5e6; const pays2 = [];
  taxPay = (kr0, no, en) => { pays2.push([gDate(S.t / 60).toISOString().slice(0, 10), Math.round(kr0), no]); return pay0(kr0, no, en); };
  S.t = ((Date.UTC(2032, 6, 15) - EPOCH) / 36e5) * 60; S.tx = {y:2032, rev0:S.stats.revenue - 2000000, cost0:S.stats.costs, paid:300000, days:[]};
  R.owedOld = [taxOwed(), Math.round(txNow().as.sum)];
  for (let H = S.t / 60; H < (Date.UTC(2033, 10, 1) - EPOCH) / 36e5; H += 24){ S.t = H * 60; taxTick(H); bankDay(H); }
  const A = S.txY[2032].as; R.as2 = {sum:A.R.sum, paid:A.paid, settled:A.settled}; R.pays2 = pays2;
  taxPay = pay0; msg = msg0; return R; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 800, 'height': 1280}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(PLAY)
        print(json.dumps(r, ensure_ascii=False)[:3000])
        P = r['pays']; on = lambda pre, nm: [x for x in P if x[0].startswith(pre) and nm in x[2]]
        t28 = on('2028', 'Forskuddsskatt 2028'); d28 = [x[0] for x in t28]
        print(ok(d28 == ['2028-03-15', '2028-06-15', '2028-09-15', '2028-12-15'] and all(x[1] > 0 for x in t28)), 'ENK: four terms on the 15th of March, June, September and December of the year itself', t28)
        Y8 = r['txY'].get('2028', {}).get('enk')
        s29 = on('2029-06-20', 'Skatteoppgjøret 2028')
        print(ok(Y8 and abs(sum(x[1] for x in t28) - Y8['paid']) <= 1 and s29 and s29[0][1] == Y8['R']['sum'] - Y8['paid']), 'the settlement for 2028 comes 20 June 2029 with what the advance did not cover', (Y8 and [Y8['R']['sum'], Y8['paid']], s29))
        print(ok(Y8 and Y8['P'] == r['yr']['2028']['P'] and Y8['R']['fd'] > 0 and Y8['R']['skj'] > 0), 'the year closed at its profit, with the fisherman\'s deduction (140 days) and the shielding', Y8 and (Y8['P'], Y8['R']))
        print(ok(r['yr']['2029']['adv'] > 0 and r['asT'] and r['asT']['P'] == r['enkBefore']), 'the company founded 1 July 2029: the half year before is the sole proprietor\'s', (r['asT'], r['enkBefore']))
        Y9 = r['txY'].get('2029', {})
        print(ok(Y9.get('enk') and Y9.get('as') and Y9['as']['R']['sum'] == round(Y9['as']['P'] * 0.22)), 'the year 2029 has two taxpayers: the sole proprietorship and the company at 22 %', (Y9.get('enk', {}).get('P'), Y9.get('as', {}).get('P')))
        a30 = on('2030', 'selskapet 2029'); d30 = [x[0] for x in a30]
        print(ok(d30[:2] == ['2030-02-15', '2030-04-15'] and '2030-10-20' in d30 and abs(a30[0][1] - Y9['as']['R']['sum'] / 2) <= 1), 'the company pays its advance 15 February and 15 April the year after and is settled 20 October', a30)
        print(ok(not [x for x in P if x[0].startswith('2030') and 'Forskuddsskatt 2030' in x[2]]), 'no sole proprietor\'s terms in 2030, the whole year is the company\'s')
        print(ok('2028-03-08' in r['warns'] and '2030-02-08' in r['warns']), 'Skatteetaten tells a week before each payment', r['warns'][:6])
        print(ok(r['fromAcct'] > 0 and r['skatt'] >= 0 and r['owed'] >= 0), 'the tax is paid from the tax account first', (r['fromAcct'], r['skatt'], r['owed']))
        print(ok(r['sal'][1] < r['sal'][0] * 0.86 ** 2 + 1), 'the vessels\' tax values are written down 14 % a year', r['sal'])
        print(ok(r['carry'] == [200000, True, True, True, True]), 'a loss carried lowers the tax; the shielding lowers the social security and the bracket tax, not the 22 %', r['carry'])
        print(ok(r['loss'][0] > 0 and r['loss'][1] == 0), 'a year with a loss is carried forward', r['loss'])
        A2 = r['as2']; P2 = r['pays2']; tot2 = 300000 + sum(x[1] for x in P2)
        print(ok(r['owedOld'][0] == r['owedOld'][1] - 300000 and A2['paid'] >= 300000 and A2['settled'] and abs(tot2 - A2['sum']) <= 2 and all(x[1] <= A2['sum'] - 300000 + 1 for x in P2)),
              'a company\'s advance paid before the terms counts: it is owed less, closed as paid, and the terms and the settlement take only the rest', (r['owedOld'], A2, P2))
        # the bank's tax card, standing and lying
        for w, h, tag in ((800, 1280, 'staende'), (1280, 800, 'liggende')):
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate("S.form = undefined; S.t = ((Date.UTC(2031, 2, 2) - EPOCH) / 36e5) * 60; DOCK.close && DOCK.close(); DOCK.open('bank')"); await pg.wait_for_timeout(400)
            await pg.evaluate("const e = [...document.querySelectorAll('#drawerBody h4')].find(x => /^Skatt /.test(x.innerText)); if (e) e.scrollIntoView({block:'start'})"); await pg.wait_for_timeout(200)
            t = await pg.evaluate("(document.querySelector('#drawerBody') || document.body).innerText")
            await pg.screenshot(path=os.path.join(OUT, 'skattetest_' + tag + '.png'))
            print(ok('NESTE BETALINGER' in t.upper() and 'ENK ELLER AS' in t.upper() and 'Skattekonto' in t), 'the bank shows the tax card with the payments ahead (' + tag + ')')
        print('errors:', errs[:3]); await b.close()
asyncio.run(main())
