"""The small errands in the Mannskap app (steg 45a; core/14-crewlife.js errandHour, ui/phone/13-mannskap-bank-meld.js errHtml): in both
formats (800×1280 and 1280×800), without 3D, the boat on the grounds off Husøy and a hand from Husøy who asks to call in at home:
  1. the card with the question in his dialect and «Ja» / «Ikke nå»,
  2. after «Ja» and the boat at the quay in Husøy: the line in his story at the top of the card.
Pictures in tests/out/aerendshot/. Prints OK or FEIL per check."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import GAME_TUT, OUT, boot

DIR = os.path.join(OUT, 'aerendshot'); os.makedirs(DIR, exist_ok=True)
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = r"""() => {
  const b = S.boat, hp = portById('husoy'); b.type = 'breisjark'; applyVessel(); b.status = 'fishing'; b.port = null; b.pos = {x:hp.p.x - 2, y:hp.p.y - 3}; b.v = 0; S.plan = null;
  S.t = Math.round((Date.UTC(2027, 10, 12, 10, 0) - EPOCH) / 60000); S.cevt = null; S.alumni = [];
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const r0 = Math.random; Math.random = mul(5); const A = genCrew(); Math.random = r0;
  Object.assign(A, {bi:false, biDays:null, known:[true, true], off:false, homePort:'husoy', home:'Husøy', hiredT:S.t - 60 * 1440}); delete A.opp; delete A.life;
  S.crew = [A]; crewAvt(A); crewLife(A);
  A.err = {k:'home', port:'husoy', why:ERRAND_WHY.home[0], t0:S.t, ok:false}; A.life.errT = S.t;
  refreshAll(); return A.name; }"""

async def main():
    out = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for fmt, (w, h) in (('staaende', (800, 1280)), ('liggende', (1280, 800))):
            pg = await (await br.new_context(viewport={'width': w, 'height': h}, has_touch=True)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await boot(pg, GAME_TUT + '#notut,no3d'); await pg.evaluate("S.mult = 1; S.settings.autoOn = false")
            nm = await pg.evaluate(SETUP)
            await pg.evaluate("PHONE.open('mannskap')"); await pg.wait_for_timeout(600)
            await pg.evaluate("() => { const e = document.querySelector('.ph-err'); if (e) e.closest('.crewc').scrollIntoView({block:'start'}); }"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DIR, '%s-sporsmal.jpg' % fmt), type='jpeg', quality=60)
            q = await pg.evaluate("[...document.querySelectorAll('.ph-err')].map(e => e.innerText).join(' | ')")
            fit = await pg.evaluate("() => { const e = document.querySelector('.ph-err'); if (!e) return null; const r = e.getBoundingClientRect(), c = e.closest('.crewc').getBoundingClientRect(); return r.left >= c.left - 1 && r.right <= c.right + 1 && [...e.querySelectorAll('button')].every(x => x.scrollWidth <= x.clientWidth + 1); }")
            out.append((ok('Husøy' in q and 'Ja' in q and 'Ikke nå' in q and fit), '%s: spørsmålet og knappene står på kortet, innenfor kortet' % fmt, [q, fit]))
            await pg.click('[data-pa=cerr][data-o=yes]'); await pg.wait_for_timeout(300)
            await pg.evaluate("() => { const b = S.boat, pt = portById('husoy'); b.status = 'port'; b.port = 'husoy'; b.pos = {x:pt.p.x, y:pt.p.y}; errandHour(S.t / 60); refreshAll(); }")
            try: await pg.wait_for_function("() => !document.querySelector('.ph-err') && /Var innom/.test((document.querySelector('.crewc') || {}).innerText || '')", timeout=5000)
            except Exception: pass
            await pg.evaluate("() => { const e = document.querySelector('.crewc'); if (e) e.scrollIntoView({block:'start'}); }"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DIR, '%s-historien.jpg' % fmt), type='jpeg', quality=60)
            card = await pg.evaluate("(document.querySelector('.crewc') || {}).innerText || ''")
            out.append((ok('Var innom hjemme i Husøy' in card and 'Lærer litt raskere til' in card and not await pg.evaluate("!!document.querySelector('.ph-err')")), '%s: etterpå: linja i historien, «Lærer litt raskere», og spørsmålet er borte' % fmt, card[:200]))
            out.append((ok(not errs), '%s: ingen sidefeil' % fmt, errs))
        await br.close()
    for c, t, v in out: print(c, t, json.dumps(v, ensure_ascii=False)[:400])

asyncio.run(main())
