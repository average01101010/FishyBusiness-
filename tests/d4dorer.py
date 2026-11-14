"""D4, the merges (docs/planer/design-ombygging.md, Jonas 13.11.2026): one page a thing, many doors in, and nothing is gone. Every action
that had a place before can still be done from one: buy gear, re-rig, land the catch, hire, dismiss, make an operations plan, have gear
mended, sell gear back, read the accounts, read the reputation. The pages that went (Rigg, Lasterom, Redskap with «Kjøp», Service as a
page of its own, Ansatte in Bygd) are no button anywhere, and their old doors land on the new place. In the phone upright (390 x 844,
where most play), and lying on a tablet. Prints OK or FEIL per check."""
from _env import boot
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the action, how its page is opened, and what must stand on it
ACTS = [
    ('kjøpe redskap', "DOCK.open('fiske')", "#drawerBody [data-pa=grbuy], #drawerBody [data-pa=shop]"),
    ('kjøpe og montere utstyr', "DOCK.open('utstyrb')", "#drawerBody [data-pa=equip]"),
    ('rigge om', "DOCK.open('beholdning:gear')", "#drawerBody .rigc [data-pa=rig]"),
    ('se lasta', "DOCK.open('beholdning:last')", "#drawerBody .ph-panel"),
    ('levere fangsten', "DOCK.open('lever')", "#drawerBody .ph-panel"),
    ('ansette', "DOCK.open(DOCK.items('bygd').find(x => x.id === 'mannskap').page)", "#drawerBody [data-pa=bhire], #drawerBody [data-pa=bneg]"),
    ('si opp', "DOCK.open('beholdning:crew'); document.querySelector('#drawerBody [data-pa=open][data-a=mannskap]').click()", "#drawerBody [data-pa=cfire]"),
    ('lage driftsplan', "DOCK.open('beholdning:crew'); document.querySelector('#drawerBody .dr-line [data-pa=open][data-a=drift]').click()", "#drawerBody .dr-page"),
    ('reparere redskap i butikken', "DOCK.open('service')", "#drawerBody [data-pa=carelr][data-m=shop]"),
    ('selge redskap tilbake', "DOCK.open('service')", "#drawerBody [data-pa=caresell]"),
    ('se regnskapet', "DOCK.open('bank'); PHONE.dact('bank', 'sub', {s:'regnskap'}); DOCK.redraw()", "#drawerBody .acc3"),
    ('se omdømmet', "DOCK.open('oppdrag')", "#drawerBody .ph-card h4"),
]


async def run(p, vw, vh, tag):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': vw, 'height': vh})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await boot(pg)
    print('--- %s %dx%d' % (tag, vw, vh))
    J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
    # in port at a place with shop, plant and yard; a line hauler, a worn line and a hand aboard, so there is something to rig, mend, sell and dismiss
    await pg.evaluate("""(() => { const b = S.boat; b.status = 'port'; S.cash = 900000; S.jobs = []; S.equip.linehaler = true; applyVessel(); S.pgear = newPGear();
      buyGear('stamp', 'hyse', 4); buyGear('hooks', 500, 1); const L0 = S.pgear.lines.hyse; L0.cond = 0.5; L0.miss = 0.1;
      S.crew = [Object.assign(genCrew(), {bi:false, off:false})]; renderActs(); })()""")
    miss = []
    for name, op, sel in ACTS:
        await pg.evaluate("DOCK.close()"); await pg.evaluate("(() => { " + op + "; })()"); await pg.wait_for_timeout(350)
        r = json.loads(await J("(() => { const d = document.getElementById('drawerBody'), e = d.querySelector(%r.replace(/#drawerBody /g, '')); return {has:!!e, page:DOCK.page, sw:d.scrollWidth, cw:d.clientWidth}; })()" % sel))
        if not r['has'] or r['sw'] > r['cw'] + 1: miss.append([name, r])
    check(not miss, tag + ': hver handling kan gjøres fra ett sted, og siden holder seg innenfor skuffen (' + str(len(ACTS)) + ' handlinger)', miss)
    txt = await pg.evaluate("(() => { DOCK.close(); DOCK.open('oppdrag'); return document.getElementById('drawerBody').textContent; })()")
    check('Omdømme' in txt and txt.index('Omdømme') > txt.index('Nye bestillinger'), tag + ': omdømmet står i Bestillinger, under de nye bestillingene')
    # the reputation stands last, also with earlier orders; an active order has its deadline with the time left; a new order is taken in
    # port only (the phone's tab shows the new orders at sea too, where they could not be taken before)
    r = json.loads(await J("""(() => { const O = ordState(); O.done = [{cust:CUSTOMERS[0].id, kg:50, sp:'torsk', ok:true}]; O.active = [{id:701, cust:CUSTOMERS[1].id, port:S.boat.port, sp:'hyse', kg:40, left:40, q:'A', prem:0.2, bonus:900, due:S.t + 200, days:1}];
      O.offers = [{id:702, cust:CUSTOMERS[1].id, port:S.boat.port, sp:'sei', kg:60, left:60, q:'A', prem:0.2, bonus:900, offerUntil:S.t + 600, days:2}];
      DOCK.close(); DOCK.open('oppdrag'); const d = document.getElementById('drawerBody'), t = d.textContent, R = {last:t.indexOf('Omdømme') > t.indexOf('Tidligere') && t.indexOf('Tidligere') > 0, due:/i ekte tid/.test(t) && !!d.querySelector('.r2'), inPort:!!d.querySelector('[data-pa=ordtake]:not(:disabled)')};
      S.boat.status = 'idle'; DOCK.redraw(); const b = d.querySelector('[data-pa=ordtake]'); R.sea = !!b && b.disabled && !!b.dataset.why; const n = O.active.length; PHONE.dact('oppdrag', 'ordtake', {id:'702'}); R.taken = O.active.length - n;
      S.boat.status = 'port'; O.active = []; O.offers = []; O.done = []; DOCK.redraw(); return R; })()"""))
    check(r['last'] and r['due'] and r['inPort'] and r['sea'] and r['taken'] == 0, tag + ': omdømmet står sist (etter «Tidligere»), fristen har tida igjen i rødt når den er nær, og en bestilling tas bare i havn', r)

    # one Oppdrag page behind every door: the same three tabs from Bygd, from the plant and from the phone
    tabs = json.loads(await J("""(() => { const T = () => [...document.querySelectorAll('#drawerBody .ph-sub button, #phView .ph-sub button')].filter(e => e.getClientRects().length).map(e => e.textContent), r = {};
      DOCK.close(); DOCK.open('oppdrag'); r.dock = T(); r.bygd = DOCK.items('bygd').some(x => x.page === 'oppdrag'); r.mottak = DOCK.items('marked').some(x => x.page === 'oppdrag');
      DOCK.close(); PHONE.show(true); PHONE.open('ordl'); r.phone = T(); PHONE.show(false); return r; })()"""))
    want = ['Turer', 'Bestillinger', 'Kappløp']
    check(tabs['dock'] == want and tabs['phone'] == want and tabs['bygd'] and tabs['mottak'], tag + ': Oppdrag er én side med Turer, Bestillinger og Kappløp fra Bygd, mottaket og telefonen', tabs)

    # what went is no button, and the old doors land on the new place
    r = json.loads(await J("""(() => { const all = ['marked', 'butikk', 'bygd', 'verft'].flatMap(m => DOCK.items(m)).concat(DOCK.items()).filter(Boolean), gone = all.filter(x => ['rigg', 'last', 'redskap', 'service', 'mannskap'].includes(String(x.page || '').split(':')[0])).map(x => x.id);
      const to = {}; for (const a of ['rigg', 'last', 'redskap']){ DOCK.close(); PHONE.open(a); to[a] = [DOCK.page, (document.querySelector('#drawerBody .ph-sub button.on') || {}).textContent]; }
      DOCK.close(); DOCK.open('beholdning'); const ob = [...document.querySelectorAll('#drawerBody .ph-sub button')].map(e => e.textContent);
      DOCK.open('fiske'); const shop = [...document.querySelectorAll('#drawerTabs button')].map(e => e.textContent);
      DOCK.open('beholdning:gear'); const links = document.querySelectorAll('#drawerBody [data-a=fiske], #drawerBody [data-a=utstyrb]').length;
      BOOK.open(); const bk = [...document.querySelectorAll('#bkTabs [data-t]')].map(e => e.dataset.t); document.querySelector('#book .bk-ctrl [data-bk=close]').click();
      return {gone, to, ob, shop, links, bk}; })()"""))
    check(not r['gone'], tag + ': ingen knapp åpner Rigg, Lasterom, Redskap, Service eller Ansatte som egne sider', r['gone'])
    check(r['to'] == {'rigg': ['beholdning', 'Redskap'], 'last': ['beholdning', 'Last'], 'redskap': ['beholdning', 'Redskap']}, tag + ': de gamle dørene lander på fanen i Om bord', r['to'])
    check(r['ob'] == ['Redskap', 'Last', 'Mannskap og drift', 'Båten'] and r['shop'] == ['Redskap', 'Elektronikk og haler', 'Service'] and r['links'] == 0 and r['bk'] == ['dag', 'salg'],
          tag + ': Om bord har Redskap, Last, Mannskap og drift, Båten; butikken har Service som tredje fane; ingen lenke til butikken fra Redskap; boka har Dagbok og Salg', r)
    check(not errs, tag + ': sidefeil', errs)
    await b.close()


async def main():
    async with async_playwright() as p:
        if os.environ.get('KYST_TUT_ONE') != 'liggende': await run(p, 390, 844, 'telefon')
        if os.environ.get('KYST_TUT_ONE') != 'staaende': await run(p, 1280, 800, 'liggende')

asyncio.run(main())
