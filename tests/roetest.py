"""Roen (UI 2, U2-4; docs/planer/ui-2-staaende.md 4.5, Jonas' V8 A 06.11.2026): when nobody has touched the screen for eight seconds,
under way and otherwise, the buttons fade to faint (Jonas 07.11.2026: «Svake, trykk virker»; a tap on a faint one works at once): the row but its main button (the hero, or the one the plan names for the state: Stopp båten under way) and Om bord, and the camera and Kino with them. The strip, the
little chart and the compass stand, and so do the phone and the deck log's tab. A touch anywhere brings it all back, and a warning
breaks it (a toast, a gale, the rules ✕, a full hold, arrived). Never in the first trip, never while the drawer, the phone or a tip is
open, and never with «ro0» in the address (the other tests' games, tests/_env.py).
In 390×844, 800×1280 and 1280×800 without 3D (the test looks at the buttons, not the picture). Pictures roen_<format>_paa|av.png
in tests/out. Prints OK or FEIL per check, and the page errors last."""
from _env import GAME_RO, GAME_TUT, boot
import asyncio, json, time
from playwright.async_api import async_playwright

URL = GAME_RO + '#notut,no3d'   # the calm on (no ro0), no first trip, no 3D drawn
SIZES = [(390, 844, 'telefon'), (800, 1280, 'nettbrett'), (1280, 800, 'liggende')]


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:500]) if extra != '' else ''), flush=True)


# at sea, still, on the first grounds, in light weather and with nobody aboard to talk (a toast breaks the calm): Jukse (the hero),
# Kast anker and Om bord in the row
SEA = """(() => { const b = S.boat, g = GROUNDS[0].p; S.tut = 0; WX_FORCE = {w:5, d:180}; S.crew = []; S.plan = null; b.status = 'idle'; b.port = null;
  b.pos = {x:g.x, y:g.y}; b.v = 0; b.gop = null; b.fishUntil = null; DOCK.close(); if (PHONE.isOpen()) PHONE.show(false); setBodyView(true); refreshAll(); renderActs(); })()"""
# what is seen: how much of each (its opacity; 0 when it is not on the screen or hidden), and for the buttons whether a tap reaches them
# (the compass takes no taps at all, so that is asked of the buttons only)
STATE = """(() => { const vis = (e, tap) => { if (!e) return 0; const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden' && (!tap || cs.pointerEvents !== 'none') ? Math.round(+cs.opacity * 100) / 100 : 0; }, $ = id => document.getElementById(id);
  const C = typeof DOCK.calm === 'function' ? DOCK.calm() : null;
  const dock = [...document.querySelectorAll('#dock .dk-b')].map(e => ({k:e.dataset.dk, hero:e.classList.contains('hero') || e.classList.contains('stay'), vis:vis(e, true)}));
  return {calm:!!(C && C.on), body:document.body.classList.contains('calm'), C, dock, cam:vis($('camBtn'), true), kino:vis($('kinoBtn'), true), kinoHud:vis($('kinoHud'), true),
    phone:vis($('phoneFab')), book:vis($('logbook')), hud:vis($('hud')), mini:vis($('miniPlot')), compass:vis($('compass3d')), st:S.boat.status}; })()"""
# a full hold as the dock sees it (tests/kartlegging.py K.fill): the hold filled and the deck worked off, with the toasts held back
# until the check is read (a toast breaks the calm too, and a full hold gives one; the check is that the full hold itself does)
FILL = """(() => { window.toastWas = toast; toast = () => {}; let room = capHold() - holdTotal() - 2; while (room > 4){ addCatch('torsk', 4, 2, true); room -= 4; } S.boat.deckStop = false; if (typeof DYN !== 'undefined') DYN.on = false;
  for (let i = 0; i < 600 && deckPending() > 1; i++) step();
  for (let i = 0; i < 40 && holdTotal() < capHold() - 0.3; i++){ addCatch('torsk', 1, 2, true); for (let k = 0; k < 60 && deckPending() > 0.2; k++) step(); }
  refreshAll(); return Math.round(holdTotal()) + '/' + Math.round(capHold()); })()"""


FAINT = lambda v: 0 < v <= 0.3   # faint: there, where it was, and can be tapped, but at a fifth
FULL = lambda v: v >= 0.5         # (a greyed button is .9, a ghost .55)


def calm_ok(s, some=True):
    """In the calm: the main button (the hero, or .stay: the plan's main button the row does not draw as the hero, 4.3) and Om bord stand,
    the rest of the row (some: there is a rest), the camera and Kino are faint; the instruments, the phone and the tab stand."""
    rest = [x for x in s['dock'] if not x['hero'] and x['k'] != 'beh']
    keep = [x for x in s['dock'] if x['hero'] or x['k'] == 'beh']
    return (s['calm'] and s['body'] and (rest or not some) and all(FAINT(x['vis']) for x in rest) and keep and all(FULL(x['vis']) for x in keep) and FAINT(s['cam']) and FAINT(s['kino'])
            and FULL(s['phone']) and FULL(s['book']) and FULL(s['hud']) and FULL(s['mini']) and FULL(s['compass']))


def awake_ok(s):
    return not s['calm'] and not s['body'] and s['dock'] and all(FULL(x['vis']) for x in s['dock']) and FULL(s['cam']) and FULL(s['kino'])


def short(s):
    return {'calm': s['calm'], 'C': s['C'], 'dock': ' '.join(x['k'] + ('*' if x['hero'] else '') + '(' + str(x['vis']) + ')' for x in s['dock']),
            'cam': s['cam'], 'kino': s['kino'], 'phone': s['phone'], 'book': s['book'], 'hud': s['hud'], 'mini': s['mini'], 'compass': s['compass'], 'st': s['st']}


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        errs = []
        for W, H, tag in SIZES:
            ctx = await br.new_context(viewport={'width': W, 'height': H}, has_touch=True, is_mobile=W < 900)
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
            pg.on('pageerror', lambda e: errs.append(str(e)))

            async def tap(x=None, y=None):   # a touch on the 3D view, through CDP as a finger would (tut.py)
                x = W / 2 if x is None else x; y = H / 2 if y is None else y
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})

            async def state():
                return await pg.evaluate(STATE)

            async def calm_now(age=9):   # the idle time put back so the next round of the calm's clock comes in (DOCK.calm(s))
                await pg.evaluate("s => DOCK.calm && DOCK.calm(s)", age)
                try: await pg.wait_for_function("DOCK.calm && DOCK.calm().on", timeout=3000)
                except Exception: pass
                await pg.wait_for_timeout(800)   # the slide (styles.css body.calm)
                return await state()

            await boot(pg, URL); await pg.evaluate(SEA); await pg.wait_for_timeout(800)
            # 1. eight seconds: not at five and a half, by nine and a half
            await tap(); t0 = time.time(); await pg.wait_for_timeout(5500)
            s = await state()
            check(not s['calm'] and awake_ok(s), tag + ': 5,5 s etter et trykk står knappene', short(s))
            try: await pg.wait_for_function("DOCK.calm && DOCK.calm().on", timeout=6000)
            except Exception: pass
            dt = time.time() - t0; await pg.wait_for_timeout(900)
            s = await state()
            check(calm_ok(s) and 7.9 <= dt <= 9.6, tag + ': etter åtte sekunder uten trykk blir knappene svake der de står (hovedknappen og Om bord står, Kamera og Kino blir svake), instrumentene, Telefon og dagbokfanen står', dict(short(s), sek=round(dt, 1)))
            await pg.screenshot(path='roen_%s_paa.png' % tag)
            # 2. a touch anywhere brings them back
            await tap(W * 0.6, H * 0.45); await pg.wait_for_timeout(900)
            s = await state()
            check(awake_ok(s), tag + ': et trykk hvor som helst henter alt tilbake', short(s))
            await pg.screenshot(path='roen_%s_av.png' % tag)
            if tag != 'telefon':
                await ctx.close(); continue
            # a tap on a faint button works at once (Jonas 07.11.2026, «Svake, trykk virker»): the camera to the bridge, and the calm broken
            s0 = await calm_now(); h0 = await pg.evaluate("G3.isHelm()")
            r = await pg.evaluate("(() => { const q = document.getElementById('camBtn').getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; })()")
            await tap(r['x'], r['y']); await pg.wait_for_timeout(900)
            s = await state(); h1 = await pg.evaluate("G3.isHelm()")
            check(s0['calm'] and FAINT(s0['cam']) and not s['calm'] and h1 != h0 and awake_ok(s), tag + ': et trykk på det svake Kamera virker med en gang (broa), og henter resten fram', {'før': [s0['calm'], s0['cam']], 'bro': [h0, h1], 'nå': short(s)})
            await pg.evaluate("v => { G3.setHelm(v); kinoUi(); updateMapButtons(); }", h0)
            # 3. a warning breaks the calm: a toast, a full hold, a gale, the rules ✕, and arrived (the boat no longer under way)
            async def breaks(what, js, why):
                s0 = await calm_now()
                await pg.evaluate(js); await pg.wait_for_timeout(1300)
                s = await state()
                check(s0['calm'] and not s['calm'] and awake_ok(s) and (s['C'] or {}).get('why') == why, tag + ': ' + what + ' bryter roen', {'før': s0['calm'], 'nå': short(s)})
            await breaks('en melding (toast)', "toast('Prøve')", 'toast')
            await breaks('full last', FILL, 'full')
            await pg.evaluate("toast = window.toastWas; S.hold = []; refreshAll()")
            await breaks('kuling', "WX_FORCE = {w:17, d:180}", 'gale')
            await pg.evaluate("WX_FORCE = {w:5, d:180}")
            await breaks('regler ✕', "window.ruNowWas = ruNow; ruNow = () => ({v:'no', items:[]})", 'rules')
            await pg.evaluate("ruNow = window.ruNowWas")
            # under way: the calm comes, Stopp båten goes and Om bord stands; arrived breaks it
            await pg.evaluate("(() => { const p = portById('botnhamn').p, b = S.boat; S.plan = {wps:[{x:p.x, y:p.y, port:'botnhamn'}], idx:0, speed:8}; b.status = 'sailing'; b.v = 8; refreshAll(); })()")
            s = await calm_now()
            check(calm_ok(s, some=False) and s['st'] == 'sailing' and [x['k'] for x in s['dock'] if FULL(x['vis'])] == ['stop', 'beh'], tag + ': under seiling: roen kommer, Stopp båten (hovedknappen underveis, planens 4.3) og Om bord står, Kamera og Kino blir svake', short(s))
            await pg.screenshot(path='roen_seiling.png')
            await pg.evaluate("(() => { const b = S.boat; S.plan = null; b.status = 'idle'; b.v = 0; refreshAll(); })()"); await pg.wait_for_timeout(1300)
            s = await state()
            check(not s['calm'] and (s['C'] or {}).get('why') == 'arrived', tag + ': framme bryter roen', short(s))
            # 4. Kino on: its «Skjul» goes with the camera and Kino, and comes back with them
            await pg.evaluate("G3.kino(true); kinoUi()")
            s = await calm_now()
            s1 = None
            await tap(); await pg.wait_for_timeout(900); s1 = await state()
            check(s['calm'] and FAINT(s['kino']) and FAINT(s['kinoHud']) and FULL(s1['kino']) and FULL(s1['kinoHud']), tag + ': med Kino på blir også «Skjul» svak, og kommer tilbake med Kino', {'roen': short(s), 'trykk': short(s1), 'skjul': [s['kinoHud'], s1['kinoHud']]})
            await pg.evaluate("G3.kino(false); kinoUi()")
            # 5. not while something is open: the drawer and the phone; and the eight seconds begin when it closes
            for what, op, cl in (('skuffen (Om bord)', "DOCK.open('beholdning')", "DOCK.close()"), ('telefonen', "PHONE.show(true)", "PHONE.show(false)")):
                await pg.evaluate(op); await pg.wait_for_timeout(300)
                s = await calm_now()
                await pg.evaluate(cl); await pg.wait_for_timeout(4000)
                s1 = await state()
                check(not s['calm'] and (s['C'] or {}).get('block') and not s1['calm'], tag + ': ingen ro mens ' + what + ' er åpen, og de åtte sekundene begynner når den lukkes', {'åpen': (s['C'] or {}).get('block'), 'lukket 4 s': s1['calm']})
            await ctx.close()

        # 6. a tip from the handbook (07c-handbook.js, ',hb' asks for them) holds the calm off; «Skjønner» lets it come
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, URL + ',hb'); await pg.evaluate(SEA)
        a = await pg.evaluate("(() => { S.hb = null; S.landN = 1; S.tut = 0; hbState(); tutUpdate(); return !document.getElementById('tip').hidden; })()")
        await pg.evaluate("DOCK.calm && DOCK.calm(9)"); await pg.wait_for_timeout(1500)
        s = await pg.evaluate(STATE)
        await pg.evaluate("document.getElementById('tipOk').click()"); await pg.wait_for_timeout(300); await pg.evaluate("DOCK.calm && DOCK.calm(9)")
        try: await pg.wait_for_function("DOCK.calm && DOCK.calm().on", timeout=3000)
        except Exception: pass
        s1 = await pg.evaluate(STATE)
        check(a and not s['calm'] and (s['C'] or {}).get('block') == 'tip' and s1['calm'], 'telefon: et tips holder roen unna, og den kommer når tipset er lest', {'tips': a, 'med': (s['C'] or {}), 'etter': s1['calm']})
        await ctx.close()

        # 7. «ro0» in the address: the calm never comes (the other tests' games)
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME_TUT + '#notut,no3d'); await pg.evaluate(SEA); await pg.evaluate("DOCK.calm && DOCK.calm(9)"); await pg.wait_for_timeout(1500)
        s = await pg.evaluate(STATE)
        check(not s['calm'] and (s['C'] or {}).get('block') == 'ro0' and awake_ok(s), 'telefon: med «ro0» i adressen kommer roen aldri', short(s))
        await ctx.close()

        # 8. never in the first trip (tutOn): the letter, the start and «Ta over» as a player, then ten seconds without a touch
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.set_default_timeout(120000)

        async def tap_el(sel):
            r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
            if r:
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': r['x'], 'y': r['y'], 'id': 0}]}); await asyncio.sleep(0.05)
                await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)
            return r
        await pg.goto(GAME_RO + '#no3d')
        await pg.wait_for_selector('#ltEnv', timeout=90000); await pg.wait_for_timeout(2200); await tap_el('#ltEnv')
        await pg.wait_for_selector('#ltGo.on', timeout=40000); await pg.wait_for_timeout(300); await tap_el('#ltGo')
        await pg.wait_for_selector('#stGo', state='visible', timeout=20000); await pg.evaluate("document.querySelector('#startPick .st-it[data-id=vangshamn]').click()")
        await tap_el('#stGo'); await pg.wait_for_selector('#obGo', state='visible', timeout=60000); await pg.wait_for_timeout(400); await tap_el('#obGo')
        await pg.wait_for_function("tutOn()", timeout=60000); t0 = time.time()
        await pg.wait_for_timeout(10000)
        s = await pg.evaluate(STATE); tut = await pg.evaluate("tutOn() ? tutStep().id : null")
        # the same idle time told to the calm's clock, with the tip of the step put away: still nothing while the first trip is on
        await pg.evaluate("document.getElementById('tip').hidden = true; if (DOCK.calm) DOCK.calm(30)"); await pg.wait_for_timeout(1500)
        s1 = await pg.evaluate(STATE)
        check(tut and not s['calm'] and not s1['calm'] and (s1['C'] or {}).get('block') == 'tut', 'telefon: ingen ro i første tur, heller ikke uten tipset', {'steg': tut, 'sek': round(time.time() - t0), 'før': (s['C'] or {}), 'uten tips': (s1['C'] or {})})
        # and the first trip was what held it: done, the calm comes (with the handbook quiet, as for an old hand: its first drip comes
        # right after the first trip, and a tip holds the calm off, part 6)
        await pg.evaluate("S.tut = 0; S.hb = null; S.landN = 5; hbState(); refreshAll(); document.getElementById('tip').hidden = true; if (DOCK.calm) DOCK.calm(9)")
        try: await pg.wait_for_function("DOCK.calm && DOCK.calm().on", timeout=3000)
        except Exception: pass
        s2 = await pg.evaluate(STATE)
        check(s2['calm'], 'telefon: når første tur er over, kommer roen', (s2['C'] or {}))
        await ctx.close()
        await br.close()
        print('sidefeil:', json.dumps(errs, ensure_ascii=False))

asyncio.run(main())
