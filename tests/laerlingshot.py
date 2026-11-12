"""The apprentice in the Mannskap app (steg 45b; core/14-crewlife.js laerBors and laerHour, ui/phone/13-mannskap-bank-meld.js laerHtml):
in both formats (800×1280 and 1280×800), without 3D, with ten years at sea and the boat at the quay in Husøy:
  1. the crew exchange with the apprentice marked, his share and no «Forhandle ned»,
  2. after he is hired and a string of nets is set off Husøy: his card with the apprenticeship and the question with three answers.
Pictures in tests/out/laerlingshot/. Prints OK or FEIL per check."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import GAME_TUT, OUT, boot

DIR = os.path.join(OUT, 'laerlingshot'); os.makedirs(DIR, exist_ok=True)
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = r"""() => {
  const b = S.boat, hp = portById('husoy'); b.type = 'breisjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {x:hp.p.x, y:hp.p.y}; b.v = 0; S.plan = null; S.home = 'husoy';
  S.t = Math.round((Date.UTC(2027, 10, 12, 10, 0) - EPOCH) / 60000); S.cevt = null; S.alumni = []; S.crew = []; S.tut = 0;
  S.fs = {p:fsNeed(10) + 1, rest:0, away:0};
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const r0 = Math.random; Math.random = mul(11); S.bors = {pool:[genCrew()], day:Math.floor((S.t / 60 + 6) / 24)}; S.bors.pool[0].until = S.t + 3 * 1440;
  const p0 = LAER.p; LAER.p = 1; const c = laerBors(S.bors); LAER.p = p0; Math.random = r0;
  refreshAll(); return c && c.id; }"""

async def main():
    out = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for fmt, (w, h) in (('staaende', (800, 1280)), ('liggende', (1280, 800))):
            pg = await (await br.new_context(viewport={'width': w, 'height': h}, has_touch=True)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await boot(pg, GAME_TUT + '#notut,no3d'); await pg.evaluate("S.mult = 1; S.settings.autoOn = false")
            cid = await pg.evaluate(SETUP)
            await pg.evaluate("PHONE.open('bors')"); await pg.wait_for_timeout(600)
            await pg.evaluate("() => { const e = document.querySelector('.ph-laerb'); if (e) e.closest('.crewc').scrollIntoView({block:'start'}); }"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DIR, '%s-borsen.jpg' % fmt), type='jpeg', quality=60)
            r = await pg.evaluate("""id => { const e = document.querySelector('.ph-laerb'), card = e && e.closest('.crewc'); return {mark:e ? e.innerText : '', head:card ? card.querySelector('h4').innerText : '', hire:!!document.querySelector('[data-pa=bhire][data-id="' + id + '"]'), neg:!!document.querySelector('[data-pa=bneg][data-id="' + id + '"]')}; }""", cid)
            out.append((ok('Lærling' in r['mark'] and '40 %' in r['mark'] and 'lærling' in r['head'] and r['hire'] and not r['neg']), '%s: børsen viser lærlingen merket, med 40 %% og uten «Forhandle ned»' % fmt, r))
            await pg.click('[data-pa=bhire][data-id="%s"]' % cid); await pg.wait_for_timeout(300)
            await pg.evaluate("""id => { const c = crewById(id), b = S.boat; b.status = 'fishing'; b.port = null; b.pos = {x:b.pos.x - 2, y:b.pos.y - 3}; S.me = S.cur;
              S.sets = [{id:'sl1', vid:S.cur, kind:'garn', n:4, tSet:S.t + 30, a:{x:b.pos.x, y:b.pos.y}, b:{x:b.pos.x + 0.3, y:b.pos.y}, acc:{}, dead:0, lost:null}];
              S.t = Math.floor(S.t / 60) * 60 + 60; window.CREW_SEED = 3; laerHour(S.t / 60); refreshAll(); }""", cid)
            await pg.evaluate("PHONE.open('mannskap')"); await pg.wait_for_timeout(600)
            await pg.evaluate("() => { const e = document.querySelector('.ph-laer'); if (e) e.closest('.crewc').scrollIntoView({block:'start'}); }"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DIR, '%s-sporsmal.jpg' % fmt), type='jpeg', quality=60)
            q = await pg.evaluate("""() => { const e = document.querySelector('.ph-laer'); if (!e) return null; const r = e.getBoundingClientRect(), c = e.closest('.crewc').getBoundingClientRect(), B = [...e.querySelectorAll('button')];
              return {txt:e.innerText, n:B.length, fit:r.left >= c.left - 1 && r.right <= c.right + 1 && B.every(x => x.scrollWidth <= x.clientWidth + 1 && x.getBoundingClientRect().right <= c.right + 1)}; }""")
            out.append((ok(q and q['n'] == 3 and q['fit'] and 'garnet' in q['txt'] and 'dag 1 av 90' in q['txt']), '%s: kortet hans har læretida og spørsmålet om garnet med tre svar, innenfor kortet' % fmt, q))
            out.append((ok(not errs), '%s: ingen sidefeil' % fmt, errs))
        await br.close()
    for c, t, v in out: print(c, t, json.dumps(v, ensure_ascii=False)[:400])

asyncio.run(main())
