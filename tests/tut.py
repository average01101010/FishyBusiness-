"""«Første tur», the guided first trip, played through the way a player would: tap the middle of the ring the guide shows, tap its
button when it has one, and wait while the boat works. Touch goes through CDP; landscape 1293 × 830 and portrait 915 × 1208, with
three reloads on the way. On the way out the «Next» chip, at the grounds what the luck is, the free luxury luck and where it shows;
on the way in a look round: the status box, the deck log, the camera (the bridge and back), the phone's apps, the weather and the
settings (05.10.2026). It opens on Father's letter (tapped open, read, «Ta over») and the boat's name, no company. The game runs
at test pace (S.mult) to save time. Checks: every step comes in order, the guide ends with
"tut":0, the jig aboard from the start, the first fill of ice on the plant after the landing, the free luxury luck, a full hold at landing, and a login bonus row on the landing note.
Prints OK or FEIL per check and ends with the old summary line {"tut":0, …} and the page errors."""
from _env import GAME_TUT as GAME
import asyncio, json, os, time
from playwright.async_api import async_playwright

# the first trip after the rewrite of 10.10.2026 (docs/onboarding.md): the naust first, the cameras on the way out, the apps on the way
# in, the register, the inventory and a hand on the quay at the plant. fish2 is settled by the two hours the ring's point gets of itself,
# reg by the game running without the cloud, and the cameras by the boat arriving when the test is too slow to tap them
ORDER = ['n1', 'nout', 'intro', 'gps', 'route1', 'cast1', 'sail', 'fish', 'deck', 'full', 'route2', 'cast2', 'land', 'slip', 'reg', 'goal']   # Onboarding 2, O2–O4
SKIPPABLE = ('nout', 'sail', 'full')   # (sail: a small tip that needs no answer, gone when the boat is there)   # (full: the hold may be full by the time the deck step is read)
# the steps read with «Skjønner» while the ring shows what they are about
OK_RING = ('deck', 'chip', 'slip', 'goal', 'hud', 'apps', 'vaer', 'salg', 'regler', 'redning', 'legs', 'beh', 'intro', 'n1')


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the target is worked out afresh (the ring on screen slides there over 0.2 s)
STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, tut:S.tut && S.tut.v ? 'v2' : S.tut, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2, w:q.w}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent,
    tip:$('tip').hidden ? '' : $('tipText').textContent, rod:!!window.jigActive, book:BOOK.isOpen(), st:S.boat.status, hold:Math.round(holdTotal()), busy:LEIA_BUSY, skip:!$('tipSkip').hidden, sleep:!$('sleep').hidden, wake:!$('sleep').hidden && !$('slSkip').hidden && !$('slSkip').disabled, ack:!$('slAck').hidden}; })())"""


async def play(p, W, H, tag):
    ctx = await p.new_context(viewport={'width': W, 'height': H}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
    pg.set_default_timeout(120000)   # a screenshot of the 3D view in SwiftShader can take more than Playwright's 30 s (as boot() in _env.py)
    errs = []
    def perr(e):
        errs.append(str(e)); print('    sidefeil · ' + tag + ' · ' + (getattr(e, 'stack', '') or str(e)).replace('\n', ' | ')[:600], flush=True)   # where it came from
    pg.on('pageerror', perr)
    pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

    async def tap(x, y):
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y, 'id': 0}]}); await asyncio.sleep(0.05)
        await cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []}); await asyncio.sleep(0.25)

    async def tap_el(sel):
        r = await pg.evaluate("s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return {x:q.x + q.width / 2, y:q.y + q.height / 2}; }", sel)
        if r: await tap(r['x'], r['y'])
        return r

    await pg.goto(GAME)
    # Father's letter (ui/08b-letter.js): a tap on the envelope opens it, the letter unfolds, «Ta over» goes on to the boat's name only
    await pg.wait_for_selector('#ltEnv', timeout=90000); await pg.wait_for_timeout(2200); await tap_el('#ltEnv')
    await pg.wait_for_selector('#ltGo.on', timeout=40000); await pg.wait_for_timeout(300); await pg.screenshot(path='letter_%s.png' % tag)
    lt = await pg.evaluate("(() => { const t = document.querySelector('#letter .lt-p2 .lt-txt'), r = document.getElementById('ltPaper').getBoundingClientRect(); return {text:t ? t.innerText : '', flat:document.getElementById('ltPaper').classList.contains('flat'), fits:t.scrollHeight <= t.clientHeight + 2, w:Math.round(r.width), h:Math.round(r.height), font:parseFloat(t.style.fontSize)}; })()")
    # «Hvor står fars naust?» (ui/08c-start.js): the place with most to earn is picked to begin with; the test takes Vangshamn (Father's
    # naust on Senja, landing at Botnhamn) from the list; «Start her» goes on to the boat's name
    await tap_el('#ltGo'); await pg.wait_for_selector('#stGo', state='visible', timeout=20000); await pg.wait_for_timeout(300); await pg.screenshot(path='start_%s.png' % tag)
    sp = await pg.evaluate("(() => { const b = document.getElementById('stGo').getBoundingClientRect(), l = document.getElementById('stAll').getBoundingClientRect(); return {go:b.bottom <= innerHeight + 1 && b.top >= 0, list:(l.height > 60 || document.getElementById('stAll').scrollHeight > 60) && document.querySelectorAll('#stAll > .st-it.rec').length > 0, n:document.querySelectorAll('#startPick .st-it').length}; })()")
    check(sp['go'] and sp['list'] and sp['n'] >= 150, tag + ': the start lists the coast\'s plants, and «Start her» is on the screen', sp)
    await pg.evaluate("document.querySelector('#startPick .st-it[data-id=vangshamn]').click()")
    await tap_el('#stGo'); await pg.wait_for_selector('#obGo', state='visible', timeout=60000)
    co = await pg.evaluate("({co:!!document.getElementById('obCo'), boat:!!document.getElementById('obBoat'), letter:!!document.getElementById('letter'), mark:document.getElementById('modal').innerText.includes(regText(regOf(S.boat)))})")
    check(lt['flat'] and lt['text'].startswith('Til deg som står igjen på kaia') and '– Far' in lt['text'] and lt['fits'] and lt['font'] >= 11, tag + ': the envelope opens with a tap, the letter unfolds whole and readable', {k: lt[k] for k in ('flat', 'fits', 'w', 'h', 'font')})
    check(not co['boat'] and not co['mark'] and not co['co'] and not co['letter'], tag + ': then the boat is taken over without a name, the mark not mentioned (Jonas 10.10.2026), no company', co)
    await pg.wait_for_timeout(400); await tap_el('#obGo'); await pg.wait_for_timeout(600)
    await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(800)
    await pg.evaluate("S.mult = 30; save()")
    seen, reloads, hold_at_land, free, t0, stuck, bonus_row, norm = [], 0, None, {}, time.time(), 0, False, ''
    for it in range(900):
        # the skipper kept rested: the clock runs at 30× here, so a run of 25 real minutes is over twelve game hours at sea and the
        # energy (100 % a day at sea, ENERGY in core/15-energy.js) ran out on the grounds in two runs on 27.10.2026, the boat drifting ashore
        # while he slept; a real first trip takes four or five game hours. The test is of the guide, not of the sleep
        await pg.evaluate("if (!asleep() && S.energy < 60) S.energy = 60")
        s = json.loads(await pg.evaluate(STATE))
        sid = s['id']
        if not seen or seen[-1] != sid:
            seen.append(sid); stuck = -1; print('   ', tag, sid, '·', s['tip'][:70], flush=True)
            # three reloads on the way: at the start, on the way out, and during the landing
            if sid in ('gps', 'fish', 'slip') and reloads < 3:
                if sid == 'gps': free = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, gear:S.boat.gear, ice:S.boat.ice})"))
                await pg.evaluate("save()"); await pg.reload(); await pg.wait_for_timeout(1500); reloads += 1
                await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(600)
                continue
        if sid is None: break
        stuck += 1
        if stuck and stuck % 30 == 0: print('    ', tag, 'still', sid, json.dumps({k: s[k] for k in ('ring', 'ok', 'okText', 'st', 'hold', 'rod')}), (await pg.evaluate("JSON.stringify({open:PHONE.isOpen(), app:PHONE.app, tip:tutStep() && tutTip(tutStep()).el ? tutTip(tutStep()).el.outerHTML.slice(0, 80) : null, wait:S.boat.tutWait, plan:!!S.plan})")), flush=True)
        # asleep (the game clock runs at 30× here, and a slow run in portrait spent the skipper's energy on the grounds, 27.10.2026): the
        # sleep screen lies over the guide; wake up with its own button, as a player would (or acknowledge the bridge watch alarm)
        if s['sleep']:
            if s['ack']: await tap_el('#slAck')
            elif s['wake']: await tap_el('#slSkip')
            await pg.wait_for_timeout(500); continue
        if s['book']:   # the deck log, opened on its step: leaf once and close it
            await pg.wait_for_timeout(600); await pg.evaluate("BOOK.close()"); await pg.wait_for_timeout(300); continue
        if s['rod'] and sid != 'fish':
            await pg.evaluate("JIGG.stop(); renderActs()"); continue
        if sid == 'land' and s['st'] == 'port' and hold_at_land is None: hold_at_land = s['hold']
        # the landing note is read while the guide shows it: it leaves the page a few game hours after the sale, and the rest of the trip takes longer than that at 30×
        if sid == 'slip' and not bonus_row: bonus_row = await pg.evaluate("[...document.querySelectorAll('#drawerBody .slipt td')].some(td => /Innloggingsbonus/.test(td.textContent))")
        if sid == 'slip' and not norm: norm = await pg.evaluate("(document.querySelector('#drawerBody .tutnorm') || {}).textContent || ''")
        if sid in ('route2',) and s['busy']:
            await pg.wait_for_timeout(300); continue
        if s['ok'] and (not s['ring'] or sid in OK_RING) and not (sid == 'slip' and not s['ring'] and s['okText'].startswith('Skjønner')):
            await tap_el('#tipOk'); await pg.wait_for_timeout(400); continue
        if s['ring']:
            await tap(s['ring']['x'], s['ring']['y']); await pg.wait_for_timeout(350 if sid != 'route2' else 700); continue
        await pg.wait_for_timeout(500)
    end = json.loads(await pg.evaluate("JSON.stringify({crew:S.crew.length, tut:S.tut, haill:S.haill && S.haill.type, sale:S.lastSale && {port:S.lastSale.port, total:S.lastSale.total, streak:S.lastSale.streak}, catchFlag:!!(S.tut && S.tut.catch), iceFree:!!S.iceFree, freeIce:tutFree('ice'), ice:S.boat.ice, gear:S.boat.gear, log:S.log.slice(-8).map(e => e.no)})"))
    await pg.evaluate("PHONE.show(false); DOCK.open('lever')"); await pg.wait_for_timeout(600)
    await pg.screenshot(path='tut_' + tag + '.png')
    order = [x for x in seen if x]
    want = [x for x in ORDER if x in order or x not in SKIPPABLE]
    check(order == want, tag + ': alle stegene kom i rekkefølge', order)
    check(end['tut'] == 0 and 'Første tur er fullført' in ' '.join(end['log']), tag + ': veiledningen er fullført', end['log'])
    check(free.get('gear') and free.get('ice', 1) == 0 and free.get('cash') == 15000, tag + ': juksa satt på fra start, og ingen is før første fiske', free)
    check(end['iceFree'] and end['freeIce'] and end['gear'], tag + ': isen er den åpne oppgaven etter første tur: første fylling venter gratis på mottaket (Onboarding 2, O4, V5 A)', {k: end[k] for k in ('ice', 'iceFree', 'freeIce', 'gear')})
    check('i timen' in norm, tag + ': sluttseddelen sier at første tur var ekstra god, og hva fisket her vanligvis gir (O4)', norm[:120])
    check(end['haill'] != 'luksus', tag + ': ingen gratis luksushaill i første tur (Onboarding 2, V1 A: den er gaven ved registrering)', end['haill'])
    check(hold_at_land is not None and hold_at_land >= 174, tag + ': minst halvt lasterom ved levering etter en time på feltet (Onboarding 2, V2 A)', hold_at_land)
    check(end['sale'] and end['sale']['port'] == 'botnhamn' and bonus_row, tag + ': levert i Botnhamn med bonuslinje på sluttseddelen', end['sale'])
    check(reloads == 3, tag + ': tre omlastinger underveis', reloads)
    check(end['crew'] == 0, tag + ': ingen mannskap i første tur; det kommer som drypp (O4)', end['crew'])
    check('nout' in order, tag + ': naustet åpnet seg ved start, og «Gå ut» tok spilleren ned på kaia', [x for x in order if x.startswith('n')])
    print('   ', tag, 'tid', round(time.time() - t0), 's, iterasjoner', it)
    print(json.dumps({'tut': end['tut'], 'tag': tag}))
    await ctx.close()
    return errs


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        # both formats, or one with KYST_TUT_ONE=liggende|staaende (Jonas 27.10.2026: one format when only the logic changed, both
        # when the guide's tips or the buttons they point at move; docs/systemer/testing.md)
        one, errs = os.environ.get('KYST_TUT_ONE', ''), []
        if one != 'staaende': errs += await play(b, 1293, 830, 'liggende')
        if one != 'liggende': errs += await play(b, 915, 1208, 'staaende')
        print(errs)
        await b.close()

asyncio.run(main())
