"""The sea level the 3D view starts at, learnt from a try that never came back (05.10.2026, view3d.js SEA_TRY): on Windows with Direct3D 11
the full sea has taken the GPU process with it (Intel Iris Xe in Chrome, NVIDIA GTX 980 in Firefox) before the browser said the context was
lost. The level being tried is written down first and cleared when it worked. Since 05.11.2026 (Jonas' Adreno 642L lost the wake: a
second tab's start was taken for a crash) a load that finds it still there tries the same level again, and starts a level down only the
second time in a row; a fresh mark from another page is waited for and not counted; the middle sea on level 1 the same, and its marks
from before ('u2:no') get one more try.
A context lost in play (#218): when the browser gives it back, the game saves and loads the page again, once in ten minutes.
Prints OK or FEIL per check."""
import asyncio, json
from _env import GAME, boot
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 900, 'height': 600}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        SITE = GAME.split('#')[0].rsplit('/', 1)[0] + '/kilder.html'
        KEYS = "['dsb_sea', 'dsb_sea_try', 'dsb_sea_gone', 'dsb_sea_ok', 'dsb_sea_mid', 'dsb_sea_midtry', 'dsb_sea_midgone'].forEach(k => localStorage.removeItem(k))"
        READ = "({sea:localStorage.getItem('dsb_sea'), tryLeft:localStorage.getItem('dsb_sea_try'), gone:localStorage.getItem('dsb_sea_gone'), lvl:G3._debug.seaLvl, mid:!!G3._debug.seaMid, midMark:localStorage.getItem('dsb_sea_mid'), midTry:localStorage.getItem('dsb_sea_midtry'), midGone:localStorage.getItem('dsb_sea_midgone'), why:G3.failWhy || '', t:performance.now()})"
        booted = []
        async def game():   # the first load through the start screen, the later ones straight into the saved game
            if booted: pg.set_default_timeout(120000); await pg.goto(GAME + '#notut')
            else: await boot(pg, GAME + '#notut'); booted.append(1)
        async def load(setup):
            # (the keys set from a page of the site that is not the game, then the game loaded anew: a goto that changes only the hash does not reload)
            await pg.goto(SITE); await pg.evaluate(KEYS); await pg.evaluate(setup); await pg.goto('about:blank')
            await game(); await pg.wait_for_function("typeof G3 !== 'undefined' && G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
            return await pg.evaluate(READ)
        R = {}
        # a try that never came back once (the level the last load was trying, 0, still written down): the same level is tried again
        R['once'] = await load("localStorage.setItem('dsb_sea_try', '0')")
        # the second time in a row: a level down
        R['twice'] = await load("localStorage.setItem('dsb_sea_try', '0:x1:' + (Date.now() - 60000)); localStorage.setItem('dsb_sea_gone', '1')")
        # another tab making its shaders right now (its mark kept fresh until this page is seen waiting for it, then cleared): waited
        # for, and not counted (with one gone before, counting it would have put the sea a level down)
        other = await ctx.new_page(); await other.goto(SITE)   # (not the game: a second game would take the save and reload this one)
        await other.evaluate("window.__go = true; localStorage.setItem('dsb_sea_try', '0:tab2:' + Date.now()); window.__iv = setInterval(() => { if (window.__go) localStorage.setItem('dsb_sea_try', '0:tab2:' + Date.now()); else { localStorage.removeItem('dsb_sea_try'); clearInterval(__iv); } }, 400)")
        await pg.goto(SITE); await pg.evaluate("['dsb_sea', 'dsb_sea_ok', 'dsb_sea_mid', 'dsb_sea_midtry', 'dsb_sea_midgone'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('dsb_sea_gone', '1')")
        await pg.goto('about:blank'); await game(); waited = False
        try: await pg.wait_for_function("typeof G3 !== 'undefined' && G3._debug && G3._debug.seaWait", timeout=120000, polling=200); waited = True
        except Exception as e: print('venter ikke:', str(e)[:120])
        await pg.wait_for_timeout(1500); still = await pg.evaluate("G3._debug.seaWait && !G3.isActive()")
        await other.evaluate("window.__go = false")
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(2000)
        R['other'] = await pg.evaluate(READ); R['other']['waited'] = waited and still; await other.close()
        # the middle sea (level 1): its mark from before 05.11 gives way to one more try; one try that never came back is tried again;
        # the second in a row marks it ('u2:no2') and the old level 1 is drawn
        R['midOld'] = await load("localStorage.setItem('dsb_sea', '1'); localStorage.setItem('dsb_sea_mid', 'u2:no')")
        R['midOnce'] = await load("localStorage.setItem('dsb_sea', '1'); localStorage.setItem('dsb_sea_midtry', '1'); localStorage.setItem('dsb_sea_try', '1')")
        R['midTwice'] = await load("localStorage.setItem('dsb_sea', '1'); localStorage.setItem('dsb_sea_midtry', '1:x1:' + (Date.now() - 60000)); localStorage.setItem('dsb_sea_midgone', '1')")
        R['midNew'] = await load("localStorage.setItem('dsb_sea', '1'); localStorage.setItem('dsb_sea_mid', 'u2:no2')")
        # a normal load: the mark is set while the sea is made and gone when it worked
        R['normal'] = await load("0")
        print(json.dumps(dict(R, errs=errs[:3])))
        o, t, ot = R['once'], R['twice'], R['other']
        print(('OK  ' if o['lvl'] == 0 and o['sea'] is None and o['tryLeft'] is None and o['gone'] is None and not o['why'] else 'FEIL') + ' one try that never came back: the same sea is tried again, and the marks are cleared when it works')
        print(('OK  ' if t['lvl'] == 1 and t['sea'] == '1' and t['tryLeft'] is None and t['gone'] is None and not t['why'] else 'FEIL') + ' the second in a row starts the sea a level down')
        print(('OK  ' if ot['lvl'] == 0 and ot['sea'] is None and ot['tryLeft'] is None and ot['waited'] and not ot['why'] else 'FEIL') + ' another tab making its shaders meanwhile is waited for and not taken for a crash (it had one before: no level down)')
        mo, m1, m2, mn = R['midOld'], R['midOnce'], R['midTwice'], R['midNew']
        print(('OK  ' if mo['lvl'] == 1 and mo['mid'] and mo['midTry'] is None and not mo['why'] else 'FEIL') + ' the middle sea marked off before 05.11 (u2:no) is tried again, and drawn')
        print(('OK  ' if m1['lvl'] == 1 and m1['mid'] and m1['midTry'] is None and m1['midGone'] is None and m1['sea'] == '1' else 'FEIL') + ' one try of the middle sea that never came back: tried again, no level down')
        print(('OK  ' if m2['lvl'] == 1 and not m2['mid'] and m2['midMark'] == 'u2:no2' and m2['midTry'] is None and m2['sea'] == '1' else 'FEIL') + ' the second in a row marks it off (u2:no2), and the old level 1 is drawn')
        print(('OK  ' if not mn['mid'] and mn['lvl'] == 1 else 'FEIL') + ' a middle sea marked off since 05.11 (u2:no2) stays off')
        n = R['normal']
        print(('OK  ' if n['sea'] is None and n['tryLeft'] is None and n['lvl'] == 0 and not n['why'] and not errs else 'FEIL') + ' a normal load leaves no mark and keeps the full sea')
        # a context lost in play and given back: the page loads again with the game saved, and 3D is back; a second loss soon after does not reload
        await pg.evaluate("sessionStorage.removeItem('dsb_gl_reload'); S.cash = 123456; window.__mark = 1; const x = (document.getElementById('gl').getContext('webgl2') || document.getElementById('gl').getContext('webgl')).getExtension('WEBGL_lose_context'); window.__lc = x; x.loseContext()")
        await pg.wait_for_timeout(800)
        lost = await pg.evaluate("({active:G3.isActive(), why:G3.failWhy || ''})")
        await pg.evaluate("window.__lc.restoreContext()")
        await pg.wait_for_function("!window.__mark && typeof G3 !== 'undefined' && G3.isActive()", timeout=90000); await pg.wait_for_timeout(2000)
        c = await pg.evaluate("({cash:S.cash, at:+sessionStorage.getItem('dsb_gl_reload') > 0, why:G3.failWhy || ''})")
        await pg.evaluate("window.__mark2 = 1; const x = (document.getElementById('gl').getContext('webgl2') || document.getElementById('gl').getContext('webgl')).getExtension('WEBGL_lose_context'); x.loseContext(); setTimeout(() => x.restoreContext(), 500)")
        await pg.wait_for_timeout(4000)
        d = await pg.evaluate("({still:!!window.__mark2, toast:(document.getElementById('toast') || {}).textContent || ''})")
        print(json.dumps({'lost': lost, 'back': c, 'again': d}))
        print(('OK  ' if not lost['active'] and c['cash'] == 123456 and c['at'] and not c['why'] and d['still'] else 'FEIL') + ' a context lost in play: the game is saved, the page loads again and 3D is back; a second loss soon after does not reload the page')
        await br.close()
asyncio.run(main())
