"""The employment agreement in the Mannskap app (Ø11.9, steg 27; core/04-crew.js crewAvt, ui/phone/13-mannskap-bank-meld.js avtHtml):
in both formats (800×1280 and 1280×800), without 3D, with the boat at the quay in Finnsnes and two hands:
  1. one signed on today: position, boat, share, probation to six months on, notice 14 days,
  2. one signed on eight months ago who has given notice (unhappy): probation over, notice one month, «Har sagt opp. Går i land …»
     and the button «Be … bli».
Pictures in tests/out/avtaleshot/. Prints OK or FEIL per check."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import GAME_TUT, OUT, boot

DIR = os.path.join(OUT, 'avtaleshot'); os.makedirs(DIR, exist_ok=True)
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = r"""() => {
  const b = S.boat, pt = portById('finnsnes'); b.type = 'breisjark'; applyVessel(); b.status = 'port'; b.port = 'finnsnes'; b.pos = {x:pt.p.x, y:pt.p.y}; b.v = 0;
  S.t = Math.round((Date.UTC(2027, 10, 12, 9, 0) - EPOCH) / 60000);
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const r0 = Math.random; Math.random = mul(11); const A = genCrew(), B = genCrew(); Math.random = r0;
  for (const c of [A, B]){ c.bi = false; c.biDays = null; c.known = [true, true]; c.off = false; delete c.avt; delete c.opp; }
  A.hiredT = S.t; B.hiredT = Math.round((Date.UTC(2027, 2, 12, 9, 0) - EPOCH) / 60000); B.morale = 18;
  S.crew = [A, B]; crewAvt(A); crewAvt(B); crewNotice(B, 'trivsel'); S.cevt = null;
  refreshAll(); return {a:A.name, b:B.name}; }"""

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
            cards = await pg.evaluate("[...document.querySelectorAll('.ph-avt')].map(e => e.innerText)")
            for i, k in enumerate(('ny', 'oppsagt')):
                await pg.evaluate("i => { const e = document.querySelectorAll('.ph-avt')[i]; if (e) e.closest('.crewc').scrollIntoView({block:'center'}); }", i)
                await pg.wait_for_timeout(300); await pg.screenshot(path=os.path.join(DIR, '%s-avtale-%s.png' % (fmt, k)))
            a = cards[0] if cards else ''; b2 = cards[1] if len(cards) > 1 else ''
            out.append((ok(len(cards) == 2), '%s: avtalen står på kortet til begge' % fmt, len(cards)))
            out.append((ok('Arbeidsavtalen' in a and ('Fisker' in a or 'Lærling' in a) and 'Båt' in a and 'Lott' in a and 'Prøvetid' in a and 'til ' in a and '14 dager' in a),
                        '%s: den nye: stilling, båt, lott, prøvetid til om seks måneder, fristen 14 dager' % fmt, a))
            stay = await pg.evaluate("[...document.querySelectorAll('[data-pa=cstay]')].map(e => e.innerText)")
            out.append((ok('Prøvetid' in b2 and 'over' in b2 and 'én måned' in b2 and 'Har sagt opp' in b2 and len(stay) == 1),
                        '%s: den som har sagt opp: prøvetida over, én måneds frist, dagen hun går i land, og «Be … bli»' % fmt, [b2, stay]))
            out.append((ok(not errs), '%s: ingen sidefeil' % fmt, errs))
        await br.close()
    for c, t, v in out: print(c, t, json.dumps(v, ensure_ascii=False)[:400])

asyncio.run(main())
