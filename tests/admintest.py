"""The admin dashboard (src/admin/index.html → admin/ in the build, docs/lansering.md E) in its demo mode: every tab draws from the
same shape as admin_dashboard() without page errors, and without the cloud's keys it shows made-up numbers and no sign-in; with keys
it asks for the sign-in first. Pictures admin_*.png. Prints OK or FEIL."""
from _env import BASE
import re, asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)[:300]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1100, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(BASE + 'admin/?demo'); await pg.wait_for_selector('nav button', timeout=20000)
        tabs = await pg.evaluate("[...document.querySelectorAll('nav button')].map(b => b.dataset.t)")
        seen = {}
        for t in tabs:
            await pg.click('nav button[data-t="%s"]' % t); await pg.wait_for_timeout(150)
            seen[t] = await pg.evaluate("document.querySelector('main').innerText.length")
            if t in ('oversikt', 'tid', 'penger', 'mediekort'): await pg.wait_for_timeout(300 if t == 'mediekort' else 0); await pg.screenshot(path='admin_%s.png' % t, full_page=True)
        demo = await pg.evaluate("!!document.querySelector('.demo') && !document.getElementById('login')")
        check(len(tabs) == 19 and all(v > 40 for v in seen.values()), 'every tab of the dashboard draws in the demo', seen)
        # the feedback agent: its report in the Agent tab, and under a feedback its suggestion, which «Bruk forslaget» only fills in
        await pg.click('nav button[data-t="agent"]'); await pg.wait_for_timeout(150); ag = await pg.evaluate("document.querySelector('main').innerText")
        await pg.click('nav button[data-t="tilbake"]'); await pg.wait_for_selector('[data-fbai]', timeout=5000)
        before = await pg.evaluate("document.querySelector('.fbrow [data-fbre]').value"); await pg.click('[data-fbai]')
        after = await pg.evaluate("[document.querySelector('.fbrow [data-fbst]').value, document.querySelector('.fbrow [data-fbre]').value]")
        await pg.screenshot(path='admin_agent.png', full_page=True)
        check('Gibostad' in ag and 'Åpne PR-er' in ag and before == '' and after == ['seen', 'Takk! Vi ser på Autonav ved Gibostad.'],
              'the Agent tab shows the reports, and «Bruk forslaget» fills in the suggested status and reply without saving', {'after': after})
        check(demo, 'without keys (or with ?demo) the numbers are marked made-up and there is no sign-in')
        # the funnel's upgrades (OPP4, 20261107160000_funnel_tier.sql): the share who bought a tier within day 7, of those who have had
        # seven days, and the column per week
        await pg.click('nav button[data-t="trakt"]'); await pg.wait_for_timeout(200)
        tr = await pg.evaluate("""(() => { const m = document.querySelector('main'), k = [...m.querySelectorAll('.kpi')].find(e => /Kjøpt trinn innen dag 7/.test(e.textContent));
          return {kpi:k ? k.innerText.replace(/\s+/g, ' ') : null, col:[...m.querySelectorAll('th')].some(e => e.textContent === 'Trinn ≤ dag 7')}; })()""")
        await pg.screenshot(path='admin_trakt.png', full_page=True)
        check(tr['kpi'] and re.search(r'\d+ %', tr['kpi']) and 'som har hatt sju dager' in tr['kpi'] and tr['col'], 'the funnel shows the share with a tier bought within day 7, and a column per week', tr)
        # the sponsors' report after IAB 2.0 (steg 66): the three buckets, the shares, the distribution, the median and mean viewable
        # time, and the CSV with the same columns; pictures in both formats
        await pg.click('nav button[data-t="sponsorer"]'); await pg.wait_for_timeout(300)
        sp = await pg.evaluate("""(() => { const m = document.querySelector('main'), th = [...m.querySelectorAll('.sptw th')].map(e => e.textContent), k = [...m.querySelectorAll('.kpi')].map(e => e.innerText.replace(/\\s+/g, ' '));
          let csv = null; const U = URL.createObjectURL; URL.createObjectURL = b => { b.text().then(t => { window.__csv = t; }); return 'blob:x'; };
          const a0 = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function(){}; document.getElementById('spCsv').click(); HTMLAnchorElement.prototype.click = a0; URL.createObjectURL = U;
          return {th, k, bars:m.querySelectorAll('.spbk').length, wide:document.documentElement.scrollWidth > innerWidth}; })()""")
        await pg.wait_for_timeout(200); csv = await pg.evaluate("window.__csv || ''")
        await pg.screenshot(path='admin_sponsorer_liggende.png', full_page=True)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(300)
        sp2 = await pg.evaluate("({wide:document.documentElement.scrollWidth > innerWidth})")
        await pg.screenshot(path='admin_sponsorer_staaende.png', full_page=True)
        await pg.set_viewport_size({'width': 1100, 'height': 900})
        need = ['Gjengitt', 'Synlige', 'Ikke synlige', 'Ubestemte', 'Fordelingen', 'Målt andel', 'Synlig andel', 'Gjensyn', 'Median synlig tid (s)', 'Snitt synlig tid (s)']
        head = csv.lstrip('\ufeff').split('\n')[0].split(';')
        check(all(n in sp['th'] for n in need) and sp['bars'] == 2 and any('Målt andel' in x for x in sp['k']) and any('Synlig andel' in x for x in sp['k'])
              and all(c in head for c in ('rendered', 'imp', 'nonview', 'undet', 'measured', 'viewable', 're', 'med', 'mean')) and not sp['wide'] and not sp2['wide'],
              'Sponsorer-fanen viser de tre bøttene, målt og synlig andel, fordelingen og median og snitt synlig tid, og CSV-en har kolonnene (IAB 3.2.10.2)', {'th': sp['th'], 'csv': head, 'wide': [sp['wide'], sp2['wide']]})
        # the marks (HS5, 20261110150000_cheat_flags.sql): the tab with the public id, what, how much over and when; a boat's name with
        # markup is shown as text; «La stå» and «Fjern merket» change the row, the switch turns; and the economy's numbers say whose they are
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.click('nav button[data-t="juks"]'); await pg.wait_for_selector('.jkrow', timeout=5000)
        jk = lambda: pg.evaluate("""(() => { const m = document.querySelector('main'), rows = [...m.querySelectorAll('.jkrow')].map(r => r.innerText.replace(/\\s+/g, ' '));
          return {rows, th:[...m.querySelectorAll('th')].map(e => e.textContent), tag:!!m.querySelector('.jkrow i'), keep:m.querySelectorAll('[data-jkkeep]').length, clr:m.querySelectorAll('[data-jkclr]').length,
                  sw:document.getElementById('jkSw').textContent, kpi:[...m.querySelectorAll('.kpi')].map(e => e.innerText.replace(/\\s+/g, ' ')), wide:document.documentElement.scrollWidth > innerWidth}; })()""")
        j0 = await jk(); await pg.screenshot(path='admin_juks_liggende.png', full_page=True)
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(200); j0s = await jk(); await pg.screenshot(path='admin_juks_staaende.png', full_page=True)
        await pg.click('[data-jkkeep]'); await pg.wait_for_timeout(150); j1 = await jk()
        await pg.click('[data-jkclr]'); await pg.wait_for_timeout(150); j2 = await jk()
        pg.once('dialog', lambda d: asyncio.ensure_future(d.accept())); await pg.click('#jkSw'); await pg.wait_for_timeout(200); j3 = await jk()
        await pg.screenshot(path='admin_juks_paa.png', full_page=True)
        await pg.click('nav button[data-t="okonomi"]'); await pg.wait_for_timeout(200); ok_ = await pg.evaluate("document.querySelector('main').innerText")
        await pg.set_viewport_size({'width': 1100, 'height': 900})
        check(len(j0['rows']) == 3 and all(h in j0['th'] for h in ('Konto', 'Hva', 'Over', 'Sist')) and 'a1b2c3d4e5' in j0['rows'][0] and '1 085 000 kr' in j0['rows'][0].replace(' ', ' ') and 'Kronene' in j0['rows'][0]
              and not j0['tag'] and '<i>Storfangst</i>' in j0['rows'][1] and j0['keep'] == 1 and j0['clr'] == 2 and 'Slå på' in j0['sw'] and not j0['wide'] and not j0s['wide'],
              'the Juks tab lists the marks by the public id with what, how much over and when, a name with markup is text, and it fits both formats', {'rows': j0['rows'], 'keep': j0['keep'], 'clr': j0['clr'], 'wide': [j0['wide'], j0s['wide']]})
        check(j1['keep'] == 0 and 'Står, sett' in j1['rows'][0] and j1['clr'] == 2 and j2['clr'] == 1 and 'Fjernet' in j2['rows'][0] and 'Slå av' in j3['sw'] and any('På' in k for k in j3['kpi']),
              '«La stå» marks the row as seen, «Fjern merket» takes the mark away, and the switch turns after a question', {'keep': j1['keep'], 'clr': [j1['clr'], j2['clr']], 'sw': j3['sw'], 'kpi': j3['kpi']})
        check('Meldt av spillet' in ok_ and ok_.count('meldt av spillet') >= 2, "the economy's numbers are marked as reported by the game")
        # with keys: the sign-in comes first, nothing is fetched before it
        await pg.add_init_script("")
        raw = await (await pg.request.get(BASE + 'admin/')).text()
        # the page's own CSP (build.mjs, Ø6 funn 15): only its script by its hash, only Supabase; the copy below changes the script, so
        # it goes without it
        csp = re.search(r'<meta http-equiv="Content-Security-Policy" content="([^"]*)">', raw)
        check(csp and "script-src 'sha256-" in csp.group(1) and "default-src 'none'" in csp.group(1) and 'unsafe-inline' not in csp.group(1).split('style-src')[0] and not errs,
              'the admin page has a strict CSP (its own script by hash, nothing else runs) and draws under it', csp.group(1)[:120] if csp else None)
        html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>', '', raw).replace('const CFG = ', 'const CFG = {supabaseUrl:"https://sb.test", supabaseAnon:"anon"} || ')
        pg2 = await br.new_page(); reqs = []
        pg2.on('request', lambda r: reqs.append(r.url) if 'sb.test' in r.url else None)
        await pg2.route(BASE + 'admin/x', lambda route: route.fulfill(status=200, content_type='text/html', body=html))
        await pg2.goto(BASE + 'admin/x'); await pg2.wait_for_selector('#login #go', timeout=10000)
        check(not reqs, 'with keys the dashboard asks for the sign-in before it fetches anything', reqs)
        print('errors:', errs[:3]); await br.close()


asyncio.run(main())
