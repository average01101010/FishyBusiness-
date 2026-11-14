"""The deck log's tabs (ui/06-logbook.js, ui/06b-book-tabs.js): Dagbok, Sesonger, Hendelser, Utstyr and Salg down the left edge,
with real data: two landings through sell() (one with crew, an order and a login bonus), an old landing without a note, a line set
and hauled through the game's own steps, and the season and price events. Lying and standing, with touch. Prints OK or FEIL per check
and screenshots to tests/out/book_*.png."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SETUP = """(() => {
  const b = S.boat, run = n => { for (let i = 0; i < n; i++) step(); }, R = {};
  S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 9, 12, 8) - EPOCH) / 6e4);
  // an old landing from before the notes came into the book
  S.sales.push({t:S.t - 3 * 1440, v:S.cur, port:'botnhamn', kg:120, total:3000, sp:[['torsk', 100], ['sei', 20]]});
  // a line set and hauled on the grounds, through the game's own steps
  const f = tutField().p; b.status = 'idle'; b.port = null; b.pos = {x:f.x, y:f.y}; b.v = 0; S.plan = null;
  S.pgear.lines.hyse.n = 1; S.pgear.lines.hyse.baited = 1; S.pgear.kits.n = 2; S.crew = S.crew || []; S.boat.rig = 'line';
  let why = null; for (const h of [0, 1.6, 3.1, 4.7]){ why = startSet('line', {lk:'hyse', n:1}, 0, h); if (!why) break; }
  R.setWhy = why; for (let i = 0; i < 200 && b.gop; i++) step();
  const s = S.sets[S.sets.length - 1]; R.set = !!s; S.t += 14 * 60; b.status = 'idle'; b.pos = {x:s.a.x, y:s.a.y};
  R.haulWhy = startHaul(s.id, false, 0); for (let i = 0; i < 2000 && b.gop; i++) step();
  R.gear = (S.gearLog || []).map(e => ({id:e.id, tSet:e.tSet, tHaul:e.tHaul, kg:e.kg}));
  // a landing at Botnhamn with a crew member aboard, an order for the plant and the login bonus
  const q = portById('botnhamn'); b.status = 'port'; b.port = 'botnhamn'; b.pos = {...q.p}; b.berth = 'main'; b.shift = b.fueling = b.land = b.after = null; S.plan = null;
  S.crew = [crewUpgrade({id:'bk1', name:'Ola Nordmann', age:30, lv:'erfaren', lvEn:'experienced', skill:1, share:0.16})]; S.crew[0].bi = false; S.crew[0].off = false;   // full-time, so aboard whatever the weekday
  const O = ordState(); O.active = [{id:99, cust:CUSTOMERS[0].id, port:'botnhamn', sp:'torsk', kg:50, left:50, q:'B', prem:0.2, bonus:1500, offerUntil:S.t, due:S.t + 1440, days:2}];
  S.streak.pct = 5;
  S.hold = [{sp:'torsk', cls:1, kg:182.4, n:40, bled:true, iced:true, hr:0, fresh:90, gut:true}, {sp:'torsk', cls:2, kg:61.2, n:22, bled:true, iced:true, hr:0, fresh:70, gut:false},
    {sp:'hyse', cls:1, kg:41.1, n:30, bled:true, iced:true, hr:0, fresh:90, gut:false}, {sp:'sei', cls:1, kg:57.7, n:20, bled:true, iced:true, hr:0, fresh:50, gut:true}];
  const c0 = S.cash; sell(); R.cash = S.cash - c0;
  R.sale = S.sales[S.sales.length - 1]; R.orderLog = S.log.some(e => /Oppdrag levert/.test(e.no));
  save(); return R; })()"""


async def run(p, w, h, tag):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))

    async def tap_el(sel):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if not r: print('     (finner ikke ' + sel + ')'); return None
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': r['x'], 'y': r['y'], 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)
        return r

    await boot(pg)
    print('--', tag, w, 'x', h)
    R = json.loads(await pg.evaluate("JSON.stringify(" + SETUP + ")"))
    if tag == 'liggende':
        check(R['set'] and not R['setWhy'] and not R['haulWhy'], 'en line er satt og trukket med spillets egne steg', {k: R[k] for k in ('setWhy', 'haulWhy')})
        g = R['gear'][-1] if R['gear'] else {}
        check(g.get('tHaul') and g.get('kg') is not None, 'redskapsloggen har tid satt, tid trukket og fangst', g)
        d = R['sale'].get('d') or {}
        ex = sum(v[1] for v in (d.get('ex') or {}).values())
        fish = sum(l[5] for l in d.get('ln', []))
        calc = fish - d['conf'][1] - d['conf'][3] - d['roe'] - d.get('gf', 0) + d.get('ved', 0) + d['st'][1] + d['ord'] + ex
        check(d and calc == R['sale']['total'], 'sluttseddelen i salget summerer seg: fisk + bonus − inndratt − sløying + vederlag = total', [calc, R['sale']['total']])
        check(d and R['cash'] == R['sale']['total'] - sum(d.get('tk') or []) - d['lott'] - d['fine'], 'kassa fikk netto: total − trekk − lott − gebyr', [R['cash'], R['sale']['total'], d.get('tk'), d.get('lott')])
        check(all(len(l) == 7 and l[6] > 0 for l in d.get('ln', [])), 'linjene har antall fisk', d.get('ln'))
        check(R['orderLog'], 'et levert oppdrag står i Drift')

    # open the book: five tabs, Dagbok first
    await tap_el('#logbook'); await pg.wait_for_timeout(500)
    tabs = await pg.evaluate("[...document.querySelectorAll('#bkTabs .bk-tab')].map(x => x.dataset.t)")
    check(tabs == ['dag', 'salg'] and await pg.evaluate("BOOK.tab") == 'dag', 'boka har bare fanene Dagbok og Salg, og åpner i Dagbok', tabs)
    await pg.screenshot(path='book_dag_' + tag + '.png')

    # (D4, Jonas 13.11.2026: the tabs Sesonger, Hendelser and Utstyr are gone from the book; it keeps Dagbok and Salg)
    small = json.loads(await pg.evaluate("""JSON.stringify((() => { const m = []; for (const e of document.querySelectorAll('#book *')){ if (!e.getClientRects().length) continue; if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const f = parseFloat(getComputedStyle(e).fontSize); if (f < 12 && !e.matches('.bk-nw')) m.push(e.tagName + '.' + e.className + ' ' + f); } return [...new Set(m)]; })())"""))
    check(not small, 'Dagbok: ingen tekst i boka under 12 px', small)
    await tap_el('#bkTabs [data-t=salg]'); await pg.wait_for_timeout(400)
    small = json.loads(await pg.evaluate("""JSON.stringify((() => { const m = []; for (const e of document.querySelectorAll('#book *')){ if (!e.getClientRects().length) continue; if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; const f = parseFloat(getComputedStyle(e).fontSize); if (f < 12 && !e.matches('.bk-nw')) m.push(e.tagName + '.' + e.className + ' ' + f); } return [...new Set(m)]; })())"""))
    check(not small, 'Salg: ingen tekst i boka under 12 px', small)

    # Salg: the newest landing note, its net, and the old landing without lines
    await tap_el('#bkTabs [data-t=salg]'); await pg.wait_for_timeout(400)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const x = S.sales[S.sales.length - 1], html = document.getElementById('bkStage').innerHTML + document.getElementById('bkStage').textContent, pages = bookTabPages('salg');
      return {tab:BOOK.tab, idx:BOOK.idx, pages:BOOK.pages, net:html.includes(kr(x.total - (x.d.tk || []).reduce((a, v) => a + v, 0) - x.d.lott - x.d.fine)), crew:html.includes('Ola Nordmann'), fish:html.includes('bk-fish'), old:pages.some(p => /før sluttsedlene kom i boka/.test(p))}; })())"""))
    check(r['tab'] == 'salg' and r['idx'] == r['pages'] - 1 and r['net'] and r['crew'] and r['fish'] and r['old'], 'Salg: fanen åpner på nyeste sluttseddel med fisketegning, lott per mann og netto; den gamle landingen vises uten linjer', r)
    await pg.screenshot(path='book_salg_' + tag + '.png')
    # paging stays within the tab
    await tap_el('#book [data-bk=prev]'); await pg.wait_for_timeout(600)
    r = json.loads(await pg.evaluate("JSON.stringify({tab:BOOK.tab, idx:BOOK.idx, pages:BOOK.pages})"))
    check(r['tab'] == 'salg' and r['idx'] == max(0, r['pages'] - 2), 'blaing holder seg innenfor fanen', r)
    await tap_el('#bkTabs [data-t=dag]'); await pg.wait_for_timeout(400)
    if tag == 'staende': await tap_el('#book [data-bk=next]'); await pg.wait_for_timeout(600)   # one page at a time: Drift follows Navigasjon
    check(await pg.evaluate("BOOK.tab === 'dag' && /Oppdrag levert/.test(document.getElementById('bkStage').textContent)"), 'Dagbok: linja om det leverte oppdraget står i Drift')
    await tap_el('#book .bk-ctrl [data-bk=close]'); await pg.wait_for_timeout(500)

    if tag == 'liggende':
        # an order taken in the village shows in the phone's order list, with its deadline
        r = json.loads(await pg.evaluate("""JSON.stringify((() => { const O = ordState(); O.active = []; O.offers = [{id:501, cust:CUSTOMERS[1].id, port:'botnhamn', sp:'hyse', kg:40, left:40, q:'A', prem:0.25, bonus:1200, offerUntil:S.t + 600, days:2}];
          DOCK.open('oppdrag'); const b = document.querySelector('#drawerBody [data-pa=ordtake]'); if (b) b.click(); DOCK.close();
          PHONE.open('ordl'); PHONE.dact('ordl', 'sub', {s:'best'}); PHONE.render(); const t = document.getElementById('phView').innerText; PHONE.show(false);   // the orders' tab (Turer is first)
          return {active:O.active.length, name:t.includes(CUSTOMERS[1].no), deadline:/Frist/.test(t), earlier:/Tidligere/.test(t)}; })())"""))
        check(r['active'] == 1 and r['name'] and r['deadline'] and r['earlier'], 'et oppdrag tatt i Bygd står i oppdragslista på telefonen med frist, og de tidligere under', r)
        # the papers (Jonas 09.10.2026: the Sjømann app is gone): the permit and the business in Rederi, blad B in Kvote
        # (Økonomi 2, Ø1: the Company app also opens with crew aboard, so the papers are read without crew and with one vessel)
        await pg.evaluate("window._crew = S.crew; S.crew = []; PHONE.open('kvote')"); await pg.wait_for_timeout(300)
        t2 = await pg.evaluate("document.getElementById('phView').innerText")
        await pg.evaluate("S.form = 'AS'; PHONE.open('rederi')"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.getElementById('phView').innerText")
        await pg.evaluate("PHONE.open('kvote')"); await pg.wait_for_timeout(300)
        t3 = await pg.evaluate("(S.form = undefined, document.getElementById('phView').innerText)")
        await pg.evaluate("S.crew = window._crew")
        check('blad B' in t2 and 'Ervervstillatelse' in t2 and 'Foretaket' in t2 and 'Foretaket' in t and 'Aksjeselskap' in t and 'Ervervstillatelse' in t3 and 'Foretaket' not in t3 and 'Helseerklæring' not in t + t2,
              'papirene står i Kvote; med rederiet stiftet står foretaket som AS i Rederi og ikke lenger i Kvote, og de oppdiktede sertifikatene er borte', [x in y for x, y in [('blad B', t2), ('Ervervstillatelse', t2), ('Foretaket', t2), ('Foretaket', t), ('Aksjeselskap', t), ('Ervervstillatelse', t3), ('Foretaket', t3)]])
        await pg.screenshot(path='book_papirer.png')
        # a landing note in the phone opens the same note in the book
        await pg.evaluate("PHONE.open('salg')"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#phone [data-pa=sub][data-s=land]').click()"); await pg.wait_for_timeout(300)
        r = json.loads(await pg.evaluate("JSON.stringify((() => { const i = S.sales.length - 1; document.querySelector('#phone [data-pa=book][data-i=\"' + i + '\"]').click(); return {tab:BOOK.tab, idx:BOOK.idx, want:BOOK.pages > 0 ? (window.innerWidth >= 760 ? Math.floor(i / 2) : i) : -1, phone:PHONE.isOpen()}; })())"))
        check(r['tab'] == 'salg' and r['idx'] == r['want'] and not r['phone'], 'sluttseddelen i Salgslaget åpner samme sluttseddel i dekksdagboka', r)
    check(errs == [], 'ingen sidefeil', errs)
    await b.close()


async def main():
    async with async_playwright() as p:
        await run(p, 1280, 800, 'liggende')
        await run(p, 800, 1280, 'staende')

asyncio.run(main())
