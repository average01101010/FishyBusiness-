"""The orders (bestillinger), the cold and the clothes. Rewritten in Ø2 (05.11.2026): the phone's «Bestillinger» tab in Salgslaget is
gone (the orders are missions now, taken under Bygd, Oppdrag in the dock), so the order is taken there, as booktest.py does. The
clothes are bought in the equipment shop's page in the dock (utstyrb), as itemcardtest.py does."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright


def check(c, what, data=None):
    print(('OK   ' if c else 'FEIL ') + what + ('' if c or data is None else '  ' + json.dumps(data, ensure_ascii=False)[:400]), flush=True)


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        J = lambda js: pg.evaluate('JSON.stringify(' + js + ')')
        # the cold in February: the wind chill, and the clothes that take the penalty off
        r = json.loads(await J("""(() => { const R = {}; S.tut = 0; S.boat.status = 'port';
          const H = (Date.UTC(2028, 1, 15, 8) - EPOCH) / 36e5; S.t = Math.round(H * 60); R.eff = Math.round(effTemp(H)); R.air = Math.round(airTemp(H));
          S.clothes = {olje:0, varme:0}; R.none = coldPen(H, 1.0); S.clothes = {olje:1, varme:0}; R.olje = coldPen(H, 1.0); S.clothes = {olje:1, varme:1}; R.both = coldPen(H, 1.0);
          return R; })()"""))
        check(r['eff'] <= r['air'], 'den effektive temperaturen i februar er ikke over lufttemperaturen', r)
        check(r['none'] >= r['olje'] >= r['both'] and r['none'] > r['both'], 'oljehyre og varmedress tar kulda av fisket, varmedressen mest', r)
        # an order offered in the morning: one or two a day, at most three
        r = json.loads(await J("""(() => { S.orders = null; S.rep = {}; S.t = Math.round((Date.UTC(2028, 2, 10, 6) - EPOCH) / 6e4); ordersTick(S.t / 60); ordersTick(S.t / 60 + 24);
          return ordState().offers.map(o => ({cust:o.cust, sp:o.sp, kg:o.kg, q:o.q, port:o.port, days:o.days})); })()"""))
        check(1 <= len(r) <= 3 and all(o['kg'] >= 10 for o in r), 'om morgenen kommer det bestillinger, høyst tre', r)
        # take it in the dock (Bygd, Oppdrag) as a player does
        r = json.loads(await J("""(() => { const O = ordState(), o = O.offers[0]; if (!o) return {none:true};
          DOCK.open('oppdrag'); const btn = document.querySelector('#drawerBody [data-pa=ordtake][data-id="' + o.id + '"]'); if (btn) btn.click(); DOCK.close();
          return {btn:!!btn, active:O.active.length, due:O.active[0] ? O.active[0].due - S.t : null}; })()"""))
        check(r.get('btn') and r['active'] == 1 and r['due'] and r['due'] > 0, 'bestillingen tas under Bygd, Oppdrag og får en frist', r)
        # land matching fish at its plant: the premium on the price, and the customer likes you better
        r = json.loads(await J("""(() => { const o = ordState().active[0]; if (!o) return {none:true};
          S.boat.status = 'port'; S.boat.port = o.port; S.boat.pos = {...portById(o.port).p}; S.crew = []; S.quota = null;
          S.hold = [{sp:o.sp, cls:SPECIES[o.sp].ref, kg:o.kg + 40, n:20, bled:true, iced:true, hr:0, fresh:(o.q === 'E' ? 95 : 80), gut:false, hook:true}];
          const c0 = S.cash, r0 = repOf(o.cust); sell(); const ls = S.lastSale;
          return {cash:Math.round(S.cash - c0), ord:ls && ls.ord, repBefore:r0, repAfter:repOf(o.cust), active:ordState().active.length}; })()"""))
        check(r.get('cash', 0) > 0 and r['ord'] and r['repAfter'] > r['repBefore'] and r['active'] == 0, 'fisken levert ved mottaket fyller bestillingen, gir betalt og bedre ry hos kunden', r)
        # a missed deadline: the order goes and the customer thinks less of you
        r = json.loads(await J("""(() => { const O = ordState(); O.offers = []; const c = CUSTOMERS[1];
          const o = {id:++O.seq, cust:c.id, port:S.boat.port, sp:'hyse', kg:40, left:40, q:'A', prem:0.25, bonus:1200, offerUntil:S.t, days:1, due:S.t + 60};
          O.active.push(o); const r0 = repOf(o.cust); S.t += 120; ordersTick(S.t / 60); return {repBefore:r0, repAfter:repOf(o.cust), active:O.active.length, done:O.done[0] && O.done[0].ok}; })()"""))
        check(r['active'] == 0 and r['done'] is False and r['repAfter'] < r['repBefore'], 'en bestilling som ikke leveres i tide, går ut og koster ry', r)
        # clothes in the equipment shop, in the dock
        await pg.evaluate("S.cash = 20000; S.clothes = {olje:0, varme:0}; DOCK.open('utstyrb')"); await pg.wait_for_timeout(300)
        r = json.loads(await J("""(() => { const btn = document.querySelector('#drawerBody [data-pa=cloth][data-k=varme]'), c0 = S.cash; if (btn) btn.click();
          return {btn:!!btn, clothes:S.clothes, paid:c0 - S.cash, price:CLOTHES.varme.price}; })()"""))
        check(r['btn'] and r['clothes'].get('varme') == 1 and r['paid'] == r['price'], 'en varmedress kjøpt i utstyrsbutikken er betalt og om bord', r)
        await pg.screenshot(path='tests/out/ordtest_klaer.png')
        await pg.evaluate("DOCK.close()")
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
