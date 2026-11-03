"""Ukas fangst (core/09n-ukas.js, ui/05i-ukas.js; docs/planer/oppdrag-2.md U1): a week with landings gets its card on Sunday evening,
once, with the kilos, the best day, the biggest fish, the catch, the plants and the new dots on Kystkartet; the Sesong app has the week
so far and the button to the card; «Del som bilde» makes a picture. Screenshots in both formats (uke-*.png). Prints OK or FEIL."""
from _env import GAME, OUT, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def ok(c):
    return 'OK  ' if c else 'FEIL'

SETUP = """(() => {
  window.__ukeOn = true; S.boatName = 'Havbris';
  const H = S.t / 60, w = weekOf(H), m0 = w * 168 * 60, pl = kkPlants();
  S.sales = (S.sales || []).filter(x => x.t < m0 - 7 * 1440).concat([
    {t:m0 + 1440 + 600, v:S.cur, kg:420, total:9800, port:pl[1].id, sp:[['torsk', 380], ['hyse', 40]]},
    {t:m0 + 3 * 1440 + 500, v:S.cur, kg:610, total:13100, port:pl[2].id, sp:[['torsk', 450], ['sei', 160]]},
    {t:m0 + 3 * 1440 + 900, v:S.cur, kg:150, total:2900, port:pl[1].id, sp:[['sei', 150]]}]);
  S.uke = {big:{w, sp:'torsk', kg:8.4}, seen:w - 1};
  const before = ukeDue();
  S.t = (ukeAt(w) + 0.2) * 60;
  return {w, before, due:ukeDue()}; })()"""

TICK = """(async () => { ukeTick(); await new Promise(r => setTimeout(r, 300)); const m = document.getElementById('modal'), t = m.innerText;
  const r = {open:!m.hidden && !!document.getElementById('ukeCard'), kg:/1,2 tonn/.test(t) && /levert/.test(t), best:/Beste dag/.test(t) && /torsdag/.test(t), big:/Største fisk/.test(t) && /8,4 kg/.test(t),
    catchL:/torsk 830 kg/.test(t), plants:/Levert til/.test(t), seen:S.uke.seen, share:!!document.getElementById('ukeShare'), txt:t.slice(0, 400)};
  return r; })()"""

AGAIN = """(async () => { document.getElementById('modal').hidden = true; ukeTick(); await new Promise(r => setTimeout(r, 200)); return document.getElementById('modal').hidden; })()"""

PIC = """(async () => { const cv = ukeCanvas(S.uke.seen); const u = cv.toDataURL('image/png'); return {w:cv.width, h:cv.height, len:u.length, url:u}; })()"""

SESONG = """(async () => { document.getElementById('modal').hidden = true; PHONE.show(true); PHONE.open('sesong'); PHONE.render(); await new Promise(r => setTimeout(r, 200));
  const v = document.getElementById('phView'), t = v.innerText; return {card:/Ukas fangst/.test(t) && /Så langt denne uka/.test(t), btn:!!v.querySelector('[data-pa=ukecard]')}; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 800, 'height': 1280})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        s = await pg.evaluate(SETUP)
        print(json.dumps(s))
        print(ok(s['before'] is None and s['due'] == s['w']), 'no card before Sunday 18:00; the week\'s card due from then')
        t = await pg.evaluate(TICK)
        print(json.dumps(t, ensure_ascii=False)[:700])
        print(ok(t['open'] and t['kg'] and t['best'] and t['big'] and t['catchL'] and t['plants'] and t['seen'] == s['w'] and t['share']),
              'the card comes by itself: 1,2 tonnes, the best day Thursday, the biggest fish 8,4 kg, the catch, the plants, and the share button')
        await pg.screenshot(path=os.path.join(OUT, 'uke-staaende.png'))
        await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(OUT, 'uke-liggende.png'))
        a = await pg.evaluate(AGAIN)
        print(ok(a), 'shown once: the next tick shows nothing')
        pic = await pg.evaluate(PIC)
        print(ok(pic['w'] == 1080 and pic['h'] == 1350 and pic['len'] > 20000), 'the picture to share is drawn (1080 x 1350)', {'len': pic['len']})
        import base64
        open(os.path.join(OUT, 'uke-bilde.png'), 'wb').write(base64.b64decode(pic['url'].split(',', 1)[1]))
        se = await pg.evaluate(SESONG)
        print(ok(se['card'] and se['btn']), 'the Sesong app: the week so far and the button to the card', se)
        await pg.screenshot(path=os.path.join(OUT, 'uke-sesong-liggende.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.evaluate("PHONE.render()"); await pg.wait_for_timeout(250)
        await pg.screenshot(path=os.path.join(OUT, 'uke-sesong-staaende.png'))
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
