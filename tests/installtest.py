"""Put the game on the home screen (ui/10p-install.js, Jonas 11.10.2026): on an iPhone the steps with «Del» and «Legg til på Hjem-skjerm» (in the
card in Settings and in the card after the first landing), on Android the browser's own install dialog when it offers one, nothing when the
game already runs as the app. Pictures of Settings upright and on its side go to tests/out/install_*.png."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
AND = 'Mozilla/5.0 (Linux; Android 14; SM-A526B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
OUT = __file__.rsplit('/', 1)[0] + '/out/'
bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False)[:300])
    if not c: bad.append(msg)

async def new(br, ua, w=390, h=844, init=''):
    ctx = await br.new_context(user_agent=ua, viewport={'width': w, 'height': h}, has_touch=True, is_mobile=True); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.add_init_script("document.addEventListener('DOMContentLoaded', () => { if (!document.querySelector('link[rel=manifest]')) { const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l); } });" + init)
    await boot(pg); return ctx, pg, errs

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # iPhone: steps in Settings and in the card after the first landing
        ctx, pg, errs = await new(br, IOS)
        r = await pg.evaluate("(() => { S.tut = 0; PHONE.open('innst'); const t = document.getElementById('phView').innerText; PHONE.show(false); return {can:INSTALL.can(), t}; })()")
        check(r['can'] and 'Hjem-skjerm' in r['t'] and 'Del' in r['t'], 'iPhone: Settings has the card with Share and Add to Home Screen', r)
        await pg.evaluate("localStorage.removeItem('dsb_install'); S.tut = 0; S.landN = 1; S.regAsk = 1; INSTALL.ask('test')")
        m = await pg.evaluate("(() => { const m = document.getElementById('modal'); return {open:!m.hidden, t:m.innerText}; })()")
        check(m['open'] and 'Legg til på Hjem-skjerm' in m['t'] and 'Senere' in m['t'], 'iPhone: the card after the first landing says how, with «Senere»', m)
        await pg.screenshot(path=OUT + 'install_ios_stående.png')
        await pg.evaluate("document.getElementById('modal').hidden = true")
        # the card is not there in the app
        await pg.evaluate("window.matchMedia = q => ({matches:/standalone/.test(q), addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}})")
        check(await pg.evaluate("!INSTALL.can() && INSTALL.card() === ''"), 'as the app on the home screen nothing is recommended')
        check(errs == [], 'sidefeil iPhone', errs); await ctx.close()
        # landscape tablet
        ctx, pg, errs = await new(br, IOS, 1280, 800)
        await pg.evaluate("S.tut = 0; PHONE.open('innst')"); await pg.wait_for_timeout(500)
        await pg.screenshot(path=OUT + 'install_ios_liggende.png'); await ctx.close()
        # Android: the browser's install dialog
        ctx, pg, errs = await new(br, AND)
        await pg.evaluate("(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = 1; }; e.userChoice = Promise.resolve({outcome:'accepted'}); dispatchEvent(e); })()")
        r = await pg.evaluate("(() => { S.tut = 0; PHONE.open('innst'); const b = document.querySelector('#phView [data-pa=installGo]'); const has = !!b; if (b) b.click(); PHONE.show(false); return {has}; })()")
        await pg.wait_for_timeout(300)
        check(r['has'] and await pg.evaluate("window.__prompted === 1"), 'Android: the card has an install button that opens the browser\'s own dialog', r)
        await pg.screenshot(path=OUT + 'install_android.png')
        check(errs == [], 'sidefeil Android', errs); await ctx.close(); await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
