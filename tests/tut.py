"""«Første tur», the guided first trip, played through the way a player would: tap the middle of the ring the guide shows, tap its
button when it has one, and wait while the boat works. Touch goes through CDP; landscape 1293 × 830 and portrait 915 × 1208, with
three reloads on the way. The game runs at test pace (S.mult) to save time. Checks: every step comes in order, the guide ends with
"tut":0, the jig and ice were free, the free luxury luck, a full hold at landing, and a login bonus row on the landing note.
Prints OK or FEIL per check and ends with the old summary line {"tut":0, …} and the page errors."""
from _env import GAME_TUT as GAME
import asyncio, json, time
from playwright.async_api import async_playwright

ORDER = ['shop', 'gps', 'route1', 'fish2', 'cast1', 'haill', 'fish', 'deck', 'full', 'route2', 'cast2', 'chip', 'land', 'slip', 'goal']


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


# the target is worked out afresh (the ring on screen slides there over 0.2 s)
STATE = """JSON.stringify((() => { const st = tutOn() ? tutStep() : null, q = st && !$('tutRing').hidden ? tutRect(tutTip(st)).R : null;
  return {id:st ? st.id : null, tut:S.tut && S.tut.v ? 'v2' : S.tut, ring:q && {x:q.x + q.w / 2, y:q.y + q.h / 2, w:q.w}, ok:!$('tipOk').hidden && !$('tip').hidden, okText:$('tipOk').textContent,
    tip:$('tip').hidden ? '' : $('tipText').textContent, rod:!!window.rodActive, st:S.boat.status, hold:Math.round(holdTotal()), busy:LEIA_BUSY, skip:!$('tipSkip').hidden}; })())"""


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

    await pg.goto(GAME); await pg.wait_for_timeout(1200); await tap_el('#obGo'); await pg.wait_for_timeout(600)
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
        if s['rod'] and sid != 'fish':
            await pg.evaluate("ROD.stop(); renderActs()"); continue
        if sid == 'land' and s['st'] == 'port' and hold_at_land is None: hold_at_land = s['hold']
        if sid in ('route2',) and s['busy']:
            await pg.wait_for_timeout(300); continue
        if s['ok'] and (not s['ring'] or sid in ('deck', 'chip', 'slip', 'goal')) and not (sid == 'slip' and not s['ring'] and s['okText'].startswith('Skjønner')):
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
