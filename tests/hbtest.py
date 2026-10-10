"""Håndboka (docs/onboarding.md 3–4, 10.10.2026): after the first trip the tips of chapters 2–6 drip one at a time when their moment
comes, in the guide's box without the dimmed layer; «Jeg kan dette» puts the chapter to rest; the app lists every tip by chapter with
a dot by the unseen, the search filters, and «Vis meg» closes the phone and shows the tip pointing; an old hand (five landings) gets
no drips; nothing drips during the first trip. Prints OK or FEIL per check, and the page errors last."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        for W, H, tag in [(1280, 800, 'liggende'), (800, 1280, 'staaende')]:
            ctx = await br.new_context(viewport={'width': W, 'height': H}); pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME); await pg.wait_for_timeout(600)
            # 1. an old hand gets no drips: five landings when the book arrives
            a = await pg.evaluate("(() => { S.hb = null; S.landN = 5; const H = hbState(); return {skip:Object.keys(H.skip).length, ready:hbReady()}; })()")
            check(a['skip'] == 5 and a['ready'] == 0, tag + ': five landings when the book arrives: every chapter at rest, nothing ready', a)
            # 2. a new skipper after the first trip: the first drip comes (the fish guide, at sea or in port), no dimmed layer, with both buttons
            b = await pg.evaluate("(() => { S.hb = null; S.landN = 1; S.tut = 0; hbState(); tutUpdate(); const t = document.getElementById('tip'); return {hid:t.hidden, txt:document.getElementById('tipText').textContent.slice(0, 40), cur:S.hb.cur, dim:document.getElementById('tutDim').hidden, ok:document.getElementById('tipOk').hidden, alt:document.getElementById('tipAlt').textContent, ready:hbReady()}; })()")
            check(not b['hid'] and b['cur'] and b['dim'] and not b['ok'] and b['alt'] == 'Jeg kan dette' and b['ready'] >= 1, tag + ': after the first trip the first tip drips, without the dimmed layer, with «Skjønner» and «Jeg kan dette»', b)
            # 3. «Skjønner» marks it seen and the next one waits its turn (the gap)
            c = await pg.evaluate("(() => { const cur = S.hb.cur; document.getElementById('tipOk').click(); return {seen:!!S.hb.seen[cur], next:S.hb.cur, hid:document.getElementById('tip').hidden}; })()")
            check(c['seen'] and not c['next'] and c['hid'], tag + ': «Skjønner» marks the tip seen, and the next waits', c)
            # 4. the gap over: the next drips; «Jeg kan dette» puts its chapter to rest and nothing of that chapter comes again
            d = await pg.evaluate("(() => { S.hb.at = 0; tutUpdate(); const cur = S.hb.cur, ch = HB.find(t => t.id === cur).ch; document.getElementById('tipAlt').click(); S.hb.at = 0; tutUpdate(); return {cur, ch, skip:!!S.hb.skip[ch], after:S.hb.cur, afterCh:S.hb.cur ? HB.find(t => t.id === S.hb.cur).ch : null}; })()")
            check(d['cur'] and d['skip'] and d['afterCh'] != d['ch'], tag + ': «Jeg kan dette» puts the chapter to rest, and the next drip is from another chapter or none', d)
            # 5. nothing drips in the first trip
            e = await pg.evaluate("(() => { S.hb = {seen:{}, skip:{}, cur:null, at:0}; S.tut = {v:2, m:{}, catch:true, pAt:Date.now()}; tutUpdate(); const id = tutStep() && tutStep().id; const r = {cur:S.hb.cur, step:id}; S.tut = 0; return r; })()")
            check(not e['cur'], tag + ': nothing drips during the first trip', e)
            # 6. the app: chapters with counts, a dot by the unseen, the search filters, «Vis meg» closes the phone and points
            await pg.evaluate("(() => { S.hb = {seen:{guide:1}, skip:{}, cur:null, at:Date.now()}; PHONE.show(true); PHONE.open('handbok'); })()"); await pg.wait_for_timeout(400)
            f = await pg.evaluate("(() => { const v = document.getElementById('phView'); return {ch:v.querySelectorAll('.hb-ch').length, tips:v.querySelectorAll('.hb-t').length, dots:v.querySelectorAll('.hb-dot').length, seen:v.querySelectorAll('.hb-t.seen').length, q:!!v.querySelector('#hbQ')}; })()")
            check(f['ch'] == 5 and f['tips'] == len(json.loads(await pg.evaluate("JSON.stringify(HB.map(t => t.id))"))) and f['dots'] == f['tips'] - 1 and f['seen'] == 1 and f['q'], tag + ': the app lists five chapters, every tip, a dot by the unseen and the search field', f)
            await pg.fill('#hbQ', 'diesel'); await pg.wait_for_timeout(200)
            g = await pg.evaluate("(() => { const v = document.getElementById('phView'); return {tips:v.querySelectorAll('.hb-t').length, first:(v.querySelector('.hb-t h4') || {}).textContent}; })()")
            check(g['tips'] == 1 and g['first'] == 'Diesel', tag + ': the search narrows the list to the tip that matches', g)
            await pg.fill('#hbQ', ''); await pg.wait_for_timeout(200)
            await pg.evaluate("document.querySelector('#phView [data-pa=hbshow][data-id=guide]').click()"); await pg.wait_for_timeout(500)
            h = await pg.evaluate("(() => ({open:PHONE.isOpen(), hid:document.getElementById('tip').hidden, txt:document.getElementById('tipText').textContent.slice(0, 30), ring:!document.getElementById('tutRing').hidden, cur:S.hb.cur}))()")
            check(not h['open'] and not h['hid'] and h['cur'] == 'guide' and h['ring'], tag + ': «Vis meg» closes the phone and the tip points at the phone button', h)
            await pg.screenshot(path='hb_' + tag + '.png')
            await pg.evaluate("document.getElementById('tipOk').click()"); await pg.wait_for_timeout(200)
            await pg.evaluate("(() => { PHONE.show(true); PHONE.open('handbok'); })()"); await pg.wait_for_timeout(400)
            await pg.screenshot(path='hb_app_' + tag + '.png')
            print(json.dumps(errs[:5]))
            await ctx.close()
        await br.close()

asyncio.run(main())
