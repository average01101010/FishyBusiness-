"""Sea time (core/09e-fartstid.js) and the report on opening (ui/08-actions.js showAway; Jonas 07.10.2026): the curve 1e6 · (N/40)^2.8
with stars past forty; a played game gets its sea time from what it did; an hour at sea with you aboard counts whole, double while
rested, a quarter while away; a landing by the square root of its value; the report counts up what was landed, fills the bar (a new
year shows), has tiles for the landings, the best landing and the rest, and says nothing after a short absence with nothing landed;
the phone's home shows the years and days. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        c = await pg.evaluate("""(() => ({n1:fsNeed(1), n10:fsNeed(10), n20:fsNeed(20), n40:fsNeed(40), mid:fsOf((fsNeed(12) + fsNeed(13)) / 2), star:fsOf(fsNeed(40) + 2.5 * (fsNeed(40) - fsNeed(39))),
          txt:fsText(fsNeed(12) + 0.5 * (fsNeed(13) - fsNeed(12)), true)}))()""")
        check(round(c['n1']) == 33 and round(c['n10']) == 20617 and round(c['n20']) == 143587 and round(c['n40']) == 1000000 and c['mid']['y'] == 12 and c['mid']['d'] == 182
              and c['star']['y'] == 42 and c['star']['star'] == 2 and c['txt'] == '12 år og 182 døgn fartstid',
              'the curve: 33 points to the first year, 20 617 to the tenth, 1 000 000 to the fortieth; years and days read right, and the years go on as stars past forty', c)
        s = await pg.evaluate("""(() => { const keep = JSON.stringify(S.fs || null); delete S.fs; S.tat = Object.assign({}, S.tat, {nm:600}); S.stats.trips = 20; S.stats.revenue = 400000;
          const p = fsState().p, o = fsOf(p); S.fs = JSON.parse(keep) || {p:0, rest:0, away:0}; return {p, y:o.y}; })()""")
        check(15000 < s['p'] < 18000 and 8 <= s['y'] <= 10, 'a game that has been played gets its sea time from what it did (600 nm, 20 trips, 400 000 kr: about nine years)', s)
        a = await pg.evaluate("""(() => { const b = S.boat, F = fsState(); b.status = 'sailing'; S.me = null; F.p = 5000; F.rest = 0; FS_AWAY = false;
          const r = {}; let p0 = F.p; for (let i = 0; i < 60; i++) fsMinute(); r.active = F.p - p0;
          F.rest = 120; p0 = F.p; for (let i = 0; i < 60; i++) fsMinute(); r.rested = F.p - p0; r.restLeft = F.rest;
          FS_AWAY = true; p0 = F.p; for (let i = 0; i < 60; i++) fsMinute(); r.away = F.p - p0; r.restAway = F.rest; FS_AWAY = false;
          b.status = 'port'; p0 = F.p; for (let i = 0; i < 60; i++) fsMinute(); r.port = F.p - p0;
          F.rest = 0; p0 = F.p; fsLand(10000); r.land = F.p - p0; FS_AWAY = true; p0 = F.p; fsLand(10000); r.landAway = F.p - p0; FS_AWAY = false;
          F.rest = 0; fsRested(4 * 3.6e6); r.rest4h = F.rest; fsRested(40 * 3.6e6); r.restCap = F.rest; return r; })()""")
        check(abs(a['active'] - 80) < 0.01 and abs(a['rested'] - 160) < 0.01 and a['restLeft'] == 60 and abs(a['away'] - 20) < 0.01 and a['restAway'] == 60 and a['port'] == 0
              and abs(a['land'] - 300) < 0.01 and abs(a['landAway'] - 75) < 0.01 and a['rest4h'] == 480 and a['restCap'] == 18 * 60,
              'an hour at sea aboard gives 80, double while rested (the rest is used at sea only), a quarter away, nothing in port; a 10 000 kr landing gives 300 (75 away); four hours away give eight hours of rest, at most eighteen', a)
        # the report: a time away with a landing and a new year
        r = await pg.evaluate("""(async () => { const F = fsState(); F.p = fsNeed(13) - 40; F.rest = 0; document.getElementById('modal').hidden = true;
          awayStart(600, 4 * 3.6e6); S.stats.revenue += 48300; S.stats.kg += 350; S.sales.push({t:S.t + 1, v:S.cur, port:S.boat.port || PORTS[0].id, kg:350, total:48300, sp:[]}); fsAdd(400, false);
          log('Leverte 350 kg.', 'Landed 350 kg.'); awayEnd(); await new Promise(r => setTimeout(r, 2600));
          const m = document.getElementById('modal'), q = s => m.querySelector(s);
          return {shown:!m.hidden, num:(q('#awNum') || {}).textContent, yr:(q('#awYr') || {}).textContent, up:!!q('.aw-up'), tiles:[...m.querySelectorAll('.aw-t')].map(x => x.innerText.replace(/\\n/g, ' ')),
            bar:parseFloat((q('#awBar') || {style:{}}).style.width), btn:(q('[data-close]') || {}).textContent, away:FS_AWAY, rest:Math.round(F.rest / 60)}; })()""")
        r = json.loads(json.dumps(r).replace('\\u00a0', ' ').replace('\\u202f', ' '))
        check(r['shown'] and r['num'] == '+48 300 kr' and r['up'] and r['yr'] == '13 år fartstid' and '350 kg' in r['tiles'][0] and '48 300 kr' in r['tiles'][1] and r['tiles'][2].startswith('8 t')
              and r['bar'] < 50 and r['btn'] == 'Til sjøs!' and r['away'] is False,
              'the report counts up what was landed, fills the bar to a new year, and shows the landing, the best landing and eight hours rested', r)
        q = await pg.evaluate("""(() => { const m = document.getElementById('modal'); m.hidden = true; S.t += 2; awayStart(20, 120000); awayEnd(); return {shown:!m.hidden}; })()""")
        check(not q['shown'], 'a short absence with nothing landed and no new year shows no report', q)
        h = await pg.evaluate("""(() => { PHONE.show(true); PHONE.open('home'); const t = document.getElementById('phView').innerText; PHONE.open('merker'); PHONE.dact('merker', 'sub', {s:'merker'}); PHONE.render(); const s = document.getElementById('phView').innerText; PHONE.show(false); return {home:t, sjo:s.slice(0, 300)}; })()""")
        check('år og' in h['home'] and 'døgn fartstid' in h['home'] and 'Fartstid tjenes om bord' in h['sjo'], "the phone's home shows the years and days, and the Merker app explains how sea time is earned", h['home'][:200])
        check(errs == [], 'sidefeil', errs)
        await br.close()

asyncio.run(main())
