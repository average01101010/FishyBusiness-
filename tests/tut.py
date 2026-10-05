"""«Første tur», the guided first trip, played through the way a player would: tap the middle of the ring the guide shows, tap its
button when it has one, and wait while the boat works. Touch goes through CDP; landscape 1293 × 830 and portrait 915 × 1208, with
three reloads on the way. On the way out the «Next» chip, at the grounds what the luck is, the free luxury luck and where it shows;
on the way in a look round: the status box, the deck log, the camera (the bridge and back), the phone's apps, the weather and the
settings (05.10.2026). It opens on Father's letter (tapped open, read, «Ta over») and the boat's name, no company. The game runs
at test pace (S.mult) to save time. Checks: every step comes in order, the guide ends with
"tut":0, the jig and ice were free, the free luxury luck, a full hold at landing, and a login bonus row on the landing note.
Prints OK or FEIL per check and ends with the old summary line {"tut":0, …} and the page errors."""
from _env import GAME_TUT as GAME
import asyncio, json, time
from playwright.async_api import async_playwright

ORDER = ['shop', 'gps', 'route1', 'fish2', 'cast1', 'chip', 'sail', 'luck', 'haill', 'luckhud', 'fish', 'deck', 'full', 'route2', 'cast2',
         'tour', 'hud', 'book', 'cam', 'cam2', 'apps', 'vaer', 'innst', 'land', 'slip', 'goal']
# the steps read with «Skjønner» while the ring shows what they are about
OK_RING = ('deck', 'chip', 'slip', 'goal', 'luckhud', 'hud', 'apps', 'vaer', 'innst')


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the target is worked out afresh (the ring on screen slides there over 0.2 s)
STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, tut:S.tut && S.tut.v ? 'v2' : S.tut, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2, w:q.w}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent,
    tip:$('tip').hidden ? '' : $('tipText').textContent, rod:!!window.jigActive, book:BOOK.isOpen(), st:S.boat.status, hold:Math.round(holdTotal()), busy:LEIA_BUSY, skip:!$('tipSkip').hidden}; })())"""


async def play(p, W, H, tag):
    ctx = await p.new_context(viewport={'width': W, 'height': H}, has_touch=True)
    pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
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
    # «Hvor står fars naust?» (ui/08c-start.js): Finnsnes is picked to begin with; «Start her» goes on to the boat's name
    await tap_el('#ltGo'); await pg.wait_for_selector('#stGo', state='visible', timeout=20000); await pg.wait_for_timeout(300); await pg.screenshot(path='start_%s.png' % tag)
    sp = await pg.evaluate("(() => { const b = document.getElementById('stGo').getBoundingClientRect(), l = document.querySelector('#startPick .st-list').getBoundingClientRect(); return {go:b.bottom <= innerHeight + 1 && b.top >= 0, list:l.height > 60, n:document.querySelectorAll('#startPick .st-it').length}; })()")
    check(sp['go'] and sp['list'] and sp['n'] >= 150, tag + ': the start lists the coast\'s plants, and «Start her» is on the screen', sp)
    await tap_el('#stGo'); await pg.wait_for_selector('#obGo', state='visible', timeout=60000)
    co = await pg.evaluate("({co:!!document.getElementById('obCo'), boat:!!document.getElementById('obBoat'), letter:!!document.getElementById('letter')})")
    check(lt['flat'] and lt['text'].startswith('Til deg som står igjen på kaia') and '– Far' in lt['text'] and lt['fits'] and lt['font'] >= 11, tag + ': the envelope opens with a tap, the letter unfolds whole and readable', {k: lt[k] for k in ('flat', 'fits', 'w', 'h', 'font')})
    check(co['boat'] and not co['co'] and not co['letter'], tag + ': then only the boat is named, no company', co)
    await pg.wait_for_timeout(400); await tap_el('#obGo'); await pg.wait_for_timeout(600)
    await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(800)
    await pg.evaluate("S.mult = 30; save()")
    seen, reloads, hold_at_land, free, t0, stuck = [], 0, None, {}, time.time(), 0
    for it in range(900):
        s = json.loads(await pg.evaluate(STATE))
        sid = s['id']
        if not seen or seen[-1] != sid:
            seen.append(sid); stuck = -1; print('   ', tag, sid, '·', s['tip'][:70], flush=True)
            # three reloads on the way: after the shop, on the way out, and during the landing
            if sid in ('gps', 'haill', 'slip') and reloads < 3:
                if sid == 'gps': free = json.loads(await pg.evaluate("JSON.stringify({cash:S.cash, gear:S.boat.gear, ice:S.boat.ice})"))
                await pg.evaluate("save()"); await pg.reload(); await pg.wait_for_timeout(1500); reloads += 1
                await pg.wait_for_function("G3.isActive() || document.body.classList.contains('vplot')", timeout=90000); await pg.wait_for_timeout(600)
                continue
        if sid is None: break
        stuck += 1
        if stuck and stuck % 30 == 0: print('    ', tag, 'still', sid, json.dumps({k: s[k] for k in ('ring', 'ok', 'okText', 'st', 'hold', 'rod')}), (await pg.evaluate("JSON.stringify({open:PHONE.isOpen(), app:PHONE.app, tip:tutStep() && tutTip(tutStep()).el ? tutTip(tutStep()).el.outerHTML.slice(0, 80) : null, wait:S.boat.tutWait, plan:!!S.plan})")), flush=True)
        if s['book']:   # the deck log, opened on its step: leaf once and close it
            await pg.wait_for_timeout(600); await pg.evaluate("BOOK.close()"); await pg.wait_for_timeout(300); continue
        if s['rod'] and sid != 'fish':
            await pg.evaluate("JIGG.stop(); renderActs()"); continue
        if sid == 'land' and s['st'] == 'port' and hold_at_land is None: hold_at_land = s['hold']
        if sid in ('route2',) and s['busy']:
            await pg.wait_for_timeout(300); continue
        if s['ok'] and (not s['ring'] or sid in OK_RING) and not (sid == 'slip' and not s['ring'] and s['okText'].startswith('Skjønner')):
            await tap_el('#tipOk'); await pg.wait_for_timeout(400); continue
        if s['ring']:
            await tap(s['ring']['x'], s['ring']['y']); await pg.wait_for_timeout(350 if sid != 'route2' else 700); continue
        await pg.wait_for_timeout(500)
    end = json.loads(await pg.evaluate("JSON.stringify({tut:S.tut, haill:S.haill && S.haill.type, sale:S.lastSale && {port:S.lastSale.port, total:S.lastSale.total, streak:S.lastSale.streak}, catchFlag:!!(S.tut && S.tut.catch), log:S.log.slice(-3).map(e => e.no)})"))
    await pg.evaluate("PHONE.show(false); DOCK.open('lever')"); await pg.wait_for_timeout(600)
    bonus_row = await pg.evaluate("[...document.querySelectorAll('#drawerBody .slipt td')].some(td => /Innloggingsbonus/.test(td.textContent))")
    await pg.screenshot(path='tut_' + tag + '.png')
    order = [x for x in seen if x]
    check(order == ORDER, tag + ': alle stegene kom i rekkefølge', order)
    check(end['tut'] == 0 and 'Første tur er fullført' in ' '.join(end['log']), tag + ': veiledningen er fullført', end['log'])
    check(free.get('gear') and free.get('ice', 0) >= 149 and free.get('cash') == 15000, tag + ': juksa og 150 kg is var gratis', free)
    check(end['haill'] == 'luksus', tag + ': gratis luksushaill om bord')
    check(hold_at_land is not None and hold_at_land >= 349, tag + ': full last ved levering', hold_at_land)
    check(end['sale'] and end['sale']['port'] == 'botnhamn' and bonus_row, tag + ': levert i Botnhamn med bonuslinje på sluttseddelen', end['sale'])
    check(reloads == 3, tag + ': tre omlastinger underveis', reloads)
    print('   ', tag, 'tid', round(time.time() - t0), 's, iterasjoner', it)
    print(json.dumps({'tut': end['tut'], 'tag': tag}))
    await ctx.close()
    return errs


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = await play(b, 1293, 830, 'liggende')
        errs += await play(b, 915, 1208, 'staaende')
        print(errs)
        await b.close()

asyncio.run(main())
