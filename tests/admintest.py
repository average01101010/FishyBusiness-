"""The admin dashboard (src/admin/index.html → admin/ in the build, docs/lansering.md E) in its demo mode: every tab draws from the
same shape as admin_dashboard() without page errors, and without the cloud's keys it shows made-up numbers and no sign-in; with keys
it asks for the sign-in first. Pictures admin_*.png. Prints OK or FEIL."""
from _env import BASE
import asyncio, json
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
            if t in ('oversikt', 'tid', 'penger'): await pg.screenshot(path='admin_%s.png' % t, full_page=True)
        demo = await pg.evaluate("!!document.querySelector('.demo') && !document.getElementById('login')")
        check(len(tabs) == 16 and all(v > 40 for v in seen.values()), 'every tab of the dashboard draws in the demo', seen)
        # the feedback agent: its report in the Agent tab, and under a feedback its suggestion, which «Bruk forslaget» only fills in
        await pg.click('nav button[data-t="agent"]'); await pg.wait_for_timeout(150); ag = await pg.evaluate("document.querySelector('main').innerText")
        await pg.click('nav button[data-t="tilbake"]'); await pg.wait_for_selector('[data-fbai]', timeout=5000)
        before = await pg.evaluate("document.querySelector('.fbrow [data-fbre]').value"); await pg.click('[data-fbai]')
        after = await pg.evaluate("[document.querySelector('.fbrow [data-fbst]').value, document.querySelector('.fbrow [data-fbre]').value]")
        await pg.screenshot(path='admin_agent.png', full_page=True)
        check('Gibostad' in ag and 'Åpne PR-er' in ag and before == '' and after == ['seen', 'Takk! Vi ser på Autonav ved Gibostad.'],
              'the Agent tab shows the reports, and «Bruk forslaget» fills in the suggested status and reply without saving', {'after': after})
        check(demo, 'without keys (or with ?demo) the numbers are marked made-up and there is no sign-in')
        # with keys: the sign-in comes first, nothing is fetched before it
        await pg.add_init_script("")
        html = (await (await pg.request.get(BASE + 'admin/')).text()).replace('const CFG = ', 'const CFG = {supabaseUrl:"https://sb.test", supabaseAnon:"anon"} || ')
        pg2 = await br.new_page(); reqs = []
        pg2.on('request', lambda r: reqs.append(r.url) if 'sb.test' in r.url else None)
        await pg2.route(BASE + 'admin/x', lambda route: route.fulfill(status=200, content_type='text/html', body=html))
        await pg2.goto(BASE + 'admin/x'); await pg2.wait_for_selector('#login #go', timeout=10000)
        check(not reqs, 'with keys the dashboard asks for the sign-in before it fetches anything', reqs)
        print('errors:', errs[:3]); await br.close()


asyncio.run(main())
