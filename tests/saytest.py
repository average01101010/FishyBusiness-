"""The crew's lines on dialect and over their heads (08.10.2026, tilbakemelding #44, core/14-crewlife.js crewDialect, view3d.js say3d): a hand
from the west or the south says the lines in his own words, the Northern Norwegian ones stay as they are, and in 3D the line stands over the
head of whoever says it for ten seconds, then goes. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate("""(() => { const so = PORTS.find(q => { const la = natLL(q.p).lat; return la > 60 && la < 61.5; }), mo = PORTS.find(q => { const la = natLL(q.p).lat; return la > 62.2 && la < 63; }), tr = PORTS.find(q => { const la = natLL(q.p).lat; return la > 63.5 && la < 64.8; });
          const t = 'Æ e ikkje sikker. Kæm har tatt mæ vatn? Ka ska vi gjøre med fesken, korsn går det?';
          const f = q => crewDialect({homePort:q && q.id}, t), nord = crewDialect({homePort:'botnhamn'}, t);
          return {nord, vest:f(so), mor:f(mo), tro:f(tr), same:nord === t}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['same'] and 'eg' in r['mor'].lower() and 'kven' in r['mor'].lower() and 'fisken' in r['mor'] and 'itj' in r['tro'] and 'Æ' in r['tro'] and 'Eg' in r['vest'] and 'korleis' in r['vest']), 'the lines stand in the dialect of where the hand is from: Northern Norwegian as it is, Trøndelag, Møre and the west in their own words')
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(1500)
        s = await pg.evaluate("""(async () => { S.tut = 0; const c = genCrew(); c.name = 'Stian Testesen'; c.homePort = 'botnhamn'; S.crew = [c]; S.sayT = -1e9; S.boat.status = 'port'; const m0 = S.msgs.length;
          const say = crewSay(c, 'chat'); await new Promise(r => setTimeout(r, 800)); const el = document.querySelector('.say3d'), vis = el && el.style.display !== 'none', txt = el ? el.textContent : '';
          return {say, vis, txt, log:S.log.slice(-1)[0].no, msgs:S.msgs.length - m0}; })()""")
        print(json.dumps(s, ensure_ascii=False))
        print(ok(s['say'] and s['vis'] and s['txt'].startswith('Stian: «')), 'in 3D the line stands over his head as «Stian: …»', s['txt'][:50])
        print(ok(s['msgs'] == 0 and 'Stian' in s['log']), 'the line is kept in the deck log, and nothing goes to the messages app')
        await pg.wait_for_timeout(10500)
        h = await pg.evaluate("(() => { const el = document.querySelector('.say3d'); return !el || el.style.display === 'none'; })()")
        print(ok(h), 'and it is gone after ten seconds')
        print('errors:', errs[:3]); await b.close()

asyncio.run(main())
