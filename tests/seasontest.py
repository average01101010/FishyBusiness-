"""The seasons as events and the people on the quay (05.10.2026, core/09c-seasons.js, core/09d-folk.js, ui/06d-season-folk.js), and the
orders from the plants near a home along the coast (core/06b-coastports.js, ordersTick): the skrei comes on the VHF and in Kystposten,
the skrei festival's prize, the Sesong and Folk apps, Edvard on the quay, a regular supplier's price, Solveig's ice. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # 1. the skrei comes: the VHF on its day, Kystposten the same day; the dates differ from year to year
        r = await pg.evaluate("""(() => { S.tut = 0; const e = SEASON_EV[0], y = 2028, d = seasonDoy(e, y), H = Math.round((Date.UTC(y, 0, 1) + d * 864e5 - EPOCH) / 36e5) + 7;
          S.t = H * 60; const m0 = S.msgs.length; seasonDay(H); seasonDay(H + 1); const vhf = S.msgs.slice(m0).filter(m => m.from === 'Kystradio').map(m => m.no);
          const news = newsForDay(Math.floor(H / 24)).map(n => n.h.no), ds = [2027, 2028, 2029, 2030].map(yy => seasonDoy(e, yy));
          return {vhf, news, ds, now:seasonNow(H + 48).id, next:seasonNext(H, 6).map(x => x.no)}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(len(r['vhf']) == 1 and 'Skreien er kommet' in r['vhf'][0] and 'Skreien er her' in r['news'] and len(set(r['ds'])) >= 3 and r['now'] == 'skrei'), 'the skrei comes on its day: once on the VHF and in Kystposten, a different day each year')
        # 2. the skrei festival: your biggest cod against the coast's, the prize on Sunday evening
        f = await pg.evaluate("""(() => { const y = 2028, F = festDays(y), d = new Date(EPOCH + F.H0 * 36e5); S.t = (F.H0 + 10) * 60; S.fest = null; const c0 = S.cash;
          addCatch('torsk', 12.5, 3, true); addCatch('torsk', 41.2, 3, true); addCatch('sei', 50, 3, true); const best = S.fest && S.fest.best;
          S.t = (F.H0 - 30) * 60; addCatch('torsk', 60, 3, true); const before = S.fest.best;
          const m0 = S.msgs.length; seasonDay(F.H1 + 1); const m = S.msgs.slice(m0).map(x => x.from + ': ' + x.no);
          return {sat:d.getUTCDay(), date:d.getUTCDate(), best, before, prize:S.cash - c0, m, board:festBoard(y).slice(0, 3).map(r => r.name + ' ' + r.kg)}; })()""")
        print(json.dumps(f, ensure_ascii=False))
        print(ok(f['sat'] == 6 and 8 <= f['date'] <= 14 and f['best'] == 41.2 and f['before'] == 41.2 and f['prize'] == 15000 and any('vant Skreifestivalen' in x for x in f['m'])), 'the skrei festival on the second weekend of March: the biggest cod in the weekend wins 15 000 kr')
        # 3. the apps: Sesong (now, coming, the calendar) and Folk
        ap = await pg.evaluate("""(() => { const F = festDays(2028); S.t = (F.H0 - 48) * 60; PHONE.open('sesong'); const a = document.querySelector('.ph-appv').innerText, cells = document.querySelectorAll('.sn-grid i').length;
          PHONE.open('salg'); const b = document.querySelector('.ph-appv').innerText; PHONE.show(false); return {a:a.slice(0, 120), cells, fest:a.includes('Skreifestivalen'), parts:a.includes('Kommer') && a.includes('Fiskekalender'), edv:b.includes('Fast kunde')}; })()""")
        print(ok(ap['cells'] == 8 * 12 and ap['fest'] and ap['parts'] and ap['edv']), 'the Sesong app shows the season, the festival, what comes and the fish calendar; Salgslaget shows the regulars\' bonus (the Folk app is Venner since 09.10.2026)', ap['cells'])
        await pg.evaluate("PHONE.open('sesong')"); await pg.wait_for_timeout(300); await pg.screenshot(path='season_app.png'); await pg.evaluate("PHONE.show(false)")
        # 4. Edvard in the home harbour once a day, a regular supplier's price, Solveig's ice
        fk = await pg.evaluate("""(() => { const b = S.boat, q = portById('finnsnes'); b.status = 'port'; b.port = 'finnsnes'; b.pos = {...q.p}; S.folk = null; S.tut = 0;
          const day = Math.floor(S.t / 60 / 24) + 3, H = day * 24 + 9; S.t = H * 60; const m0 = S.msgs.length; folkPort(H); folkPort(H + 1); const first = S.msgs.slice(m0).filter(m => m.from === 'Edvard').map(m => m.no);
          S.t = (H + 24) * 60; folkPort(H + 24); const second = S.msgs.slice(m0).filter(m => m.from === 'Edvard').length;
          const pt = portById('husoy'), p0 = price(pt, 'torsk', H); folkSold('husoy', 2500); const p1 = price(pt, 'torsk', H); folkSold('husoy', 8000);
          const lv = folkLevel(S.folk.plants.husoy.kg), mgr = S.msgs.slice(-3).map(m => m.from).join('|');
          const i0 = PRICE.iceBag * folkIce(); for (let i = 0; i < 15; i++) folkShop(); const i1 = shopIceKr();
          return {first, second, p0, p1, ratio:+(p1 / p0).toFixed(4), lv, mgr, i0, i1}; })()""")
        print(json.dumps(fk, ensure_ascii=False))
        print(ok(len(fk['first']) == 1 and 'Edvard' in fk['first'][0] and fk['second'] == 2), 'Edvard greets you in the home harbour once a day, the first time with who he is')
        print(ok(1.005 <= fk['ratio'] <= 1.0105 and fk['lv'] == 2 and 'mottaket' in fk['mgr']), 'a regular supplier gets 1 % more after 2 t and 2 % after 10 t at that plant', fk['ratio'])
        print(ok(abs(fk['i0'] - 2.0) < 1e-9 and abs(fk['i1'] - 1.8) < 1e-9), 'after 15 purchases Solveig sells the bagged ice 10 % cheaper', fk['i1'])
        # 5. a home along the coast: the orders come from the plants near it, not from Senja
        od = await pg.evaluate("""(() => { const pt = PORTS.find(q => q.coastal && /Båtsfjord|Berlevåg|Vardø/.test(q.name)) || PORTS.find(q => q.coastal); S.home = pt.id; const b = S.boat; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p};
          const O = ordState(); O.offers = []; const ports = new Set(); const H0 = Math.floor(S.t / 60 / 24) * 24; for (let d = 0; d < 20; d++){ O.offers = []; let H = H0 + d * 24; while (gDate(H).getUTCHours() !== 6) H++; S.t = H * 60; ordersTick(H); for (const o of O.offers) ports.add(o.port); }
          const far = [...ports].filter(id => dist(portById(id).p, pt.p) > 60); S.home = undefined; return {home:pt.name, n:ports.size, far, near:[...ports].map(id => portById(id).name).slice(0, 5)}; })()""")
        print(ok(od['n'] >= 1 and not od['far']), 'from a home along the coast, the orders come from plants within 60 km of it', od)
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
