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
        calc = fish - d['conf'][1] - d['conf'][3] - d['roe'] + d['st'][1] + d['ord'] + ex
        check(d and calc == R['sale']['total'], 'sluttseddelen i salget summerer seg: fisk + bonus − inndratt = total', [calc, R['sale']['total']])
        check(d and R['cash'] == R['sale']['total'] - sum(d.get('tk') or []) - d['lott'] - d['fine'], 'kassa fikk netto: total − trekk − lott − gebyr', [R['cash'], R['sale']['total'], d.get('tk'), d.get('lott')])
        check(all(len(l) == 7 and l[6] > 0 for l in d.get('ln', [])), 'linjene har antall fisk', d.get('ln'))
        check(R['orderLog'], 'et levert oppdrag står i Drift')

    # open the book: five tabs, Dagbok first
    await tap_el('#logbook'); await pg.wait_for_timeout(500)
    tabs = await pg.evaluate("[...document.querySelectorAll('#bkTabs .bk-tab')].map(x => x.dataset.t)")
    check(tabs == ['dag', 'ses', 'hen', 'uts', 'salg'] and await pg.evaluate("BOOK.tab") == 'dag', 'boka har fanene Dagbok, Sesonger, Hendelser, Utstyr og Salg, og åpner i Dagbok', tabs)
    await pg.screenshot(path='book_dag_' + tag + '.png')

    # Sesonger: this year, the halibut closure that ended in April crossed out
    await tap_el('#bkTabs [data-t=ses]'); await pg.wait_for_timeout(400)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const all = bookTabPages('ses').join(''), d = document.createElement('div'); d.innerHTML = all;
      const es = [...d.querySelectorAll('.bk-e')], k = es.find(e => /Kveita er fredet/.test(e.textContent)), skrei = es.find(e => /Skreisesongen/.test(e.textContent)), crab = es.find(e => /Krabbesesongen/.test(e.textContent));
      return {tab:BOOK.tab, n:es.length, kveiteX:!!k && k.classList.contains('over'), skreiX:!!skrei && skrei.classList.contains('over'), crabNow:!!crab && crab.classList.contains('now'), price:es.filter(e => /pris på/.test(e.textContent)).length}; })())"""))
    check(r['tab'] == 'ses' and r['kveiteX'] and r['skreiX'] and r['crabNow'] and r['price'] >= 3, 'Sesonger: kveitefredningen og skreisesongen er krysset ut i oktober, krabbesesongen gjelder nå, og prissesongene står der', r)
    await pg.screenshot(path='book_ses_' + tag + '.png')

    # Hendelser: one entry per week and species that moved 8 % or more, with the same percent as the price model
    await tap_el('#bkTabs [data-t=hen]'); await pg.wait_for_timeout(400)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const H = S.t / 60, w0 = weekOfH(H); let n = 0, ex = null;
      for (let w = w0 - 4; w <= w0; w++) for (const sp of SP){ const dv = weekDev(sp, w * 168 - 6 + 1) * 100; if (Math.abs(dv) >= 8){ n++; if (sp === 'torsk' || !ex) ex = {sp, pct:pctS(dv)}; } }
      const ev = bookEvents(), wk = ev.filter(e => /etterspørsel/.test(e.t[0])), html = bookTabPages('hen').join('');
      return {tab:BOOK.tab, want:n, got:wk.length, ex, shown:!!ex && html.includes(ex.pct)}; })())"""))
    check(r['tab'] == 'hen' and r['want'] == r['got'] and (r['ex'] is None or r['shown']), 'Hendelser: én hendelse per uke og art som flyttet seg 8 % eller mer, med samme prosent som prismodellen', r)
    await pg.screenshot(path='book_hen_' + tag + '.png')

    # Utstyr: the hauled line with its hours as tally marks and its catch
    await tap_el('#bkTabs [data-t=uts]'); await pg.wait_for_timeout(400)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const e = S.gearLog[S.gearLog.length - 1], html = document.getElementById('bkStage').innerHTML + document.getElementById('bkStage').textContent;
      return {tab:BOOK.tab, tally:html.includes('bk-tl'), kg:html.includes(fmt(e.kg, 0) + ' kg'), hauled:html.includes(hm(e.tHaul / 60))}; })())"""))
    check(r['tab'] == 'uts' and r['tally'] and r['kg'] and r['hauled'], 'Utstyr: lina står med ståtid som tellestreker, tid trukket og fangst i kg', r)
    await pg.screenshot(path='book_uts_' + tag + '.png')

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
          PHONE.open('ordl'); const t = document.getElementById('phView').innerText; PHONE.show(false);
          return {active:O.active.length, name:t.includes(CUSTOMERS[1].no), deadline:/Frist/.test(t), earlier:/Tidligere/.test(t)}; })())"""))
        check(r['active'] == 1 and r['name'] and r['deadline'] and r['earlier'], 'et oppdrag tatt i Bygd står i oppdragslista på telefonen med frist, og de tidligere under', r)
        # the papers in the Seaman app
        await pg.evaluate("PHONE.open('sjomann')"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#phone [data-pa=sub][data-s=papir]').click()"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.getElementById('phView').innerText")
        check('Helseerklæring for arbeidstakere på skip' in t and 'Sikkerhetsopplæring' in t and 'Fiskeskipper klasse C' in t, 'Sjømann har fanen Papirer med helseerklæring og sertifikater')
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
