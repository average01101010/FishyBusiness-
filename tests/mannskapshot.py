"""The crew's meals and where to rest, on screen (Ø8b M1–M3, 08.11.2026; docs/systemer/folk-om-bord.md 5.19 and 5.19b): in both
formats (800×1280 and 1280×800), without 3D,
  1. a snekke with no bunks at sea under 50 %: one message that the boat has no bunks, with the nearest rorbu and how far (M1),
  2. the same at 25 %: the toast says the nearest rorbu and the distance, not «Gå til kai»,
  3. a breisjark with bunks and crew on watch at 25 %: «Gå ned i køya og hvil»,
  4. the Mannskap page with the crew at sea at 12:10: «lager lunsj 12:30» by the best of three who cook at 2 or less (M2, M3).
Pictures in tests/out/mannskapshot/ (and docs/okter/ by hand). Prints OK or FEIL per check."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import GAME_TUT, OUT, boot

DIR = os.path.join(OUT, 'mannskapshot'); os.makedirs(DIR, exist_ok=True)
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = r"""async ([type, n, kokk]) => {
  const b = S.boat; b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; S.cash = 300000; S.clothes = {olje:8, varme:8};
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const r0 = Math.random; Math.random = mul(7); S.crew = []; for (let i = 0; i < n; i++){ const c = genCrew(); c.bi = false; c.biDays = null; c.known = [true, true]; c.attr.kokk = kokk[i]; S.crew.push(c); } Math.random = r0;
  S.meal = null; S.t = Math.round((Date.UTC(2027, 2, 1, 11, 30) - EPOCH) / 60000);
  const p = portById('husoy').p; await mapNeed(p, MAPD.simR); let q = null;
  for (let k = 1; k < 40 && !q; k++) for (let a = 0; a < 16; a++){ const c = {x:p.x + Math.cos(a / 16 * 6.283) * k * 0.15, y:p.y + Math.sin(a / 16 * 6.283) * k * 0.15}; try { if (!isLand(c) && depthF(c) > 15){ q = c; break; } } catch (e){} }
  S.plan = null; b.status = 'fishing'; b.port = null; b.pos = q; b.v = 0; b.gop = null; b.fishUntil = S.t + 24 * 60; b.deckStop = false; S.rest = null; S.sleep = null;
  S.enWarn = false; S.enNoBunk = 0; if (typeof DOCK !== 'undefined') DOCK.close(); refreshAll();
  return {type, berths:BOAT.berths, crew:S.crew.map(c => [c.name, c.attr.kokk])}; }"""
STEP = r"""n => { if (typeof DYN !== 'undefined') DYN.on = false; try { TAB.held = true; } catch (e){} for (let i = 0; i < n; i++) step(); try { TAB.held = false; lastWall = Date.now(); } catch (e){} refreshAll();
  const el = document.getElementById('toast'); return {toast:el && el.classList.contains('on') ? el.innerText : '', log:S.log.slice(-3).map(e => e.no), e:Math.round(S.energy)}; }"""

async def main():
    out = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        for fmt, (w, h) in (('staaende', (800, 1280)), ('liggende', (1280, 800))):
            pg = await (await br.new_context(viewport={'width': w, 'height': h}, has_touch=True)).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await boot(pg, GAME_TUT + '#notut,no3d'); await pg.evaluate("S.mult = 1; S.settings.autoOn = false")
            # 1 and 2: the snekke, no bunks, alone
            r = await pg.evaluate(SETUP, ['snekke', 0, []]); await pg.evaluate("S.energy = 50.02")
            a = await pg.evaluate(STEP, 2); await pg.wait_for_timeout(300); await pg.screenshot(path=os.path.join(DIR, '%s-uten-koyer-50.png' % fmt))
            b2 = await pg.evaluate(STEP, 30)
            out.append((ok('ingen køyer' in a['toast'] and 'Nærmeste rorbu' in a['toast'] and ' nm unna' in a['toast'] and any('ingen køyer' in x for x in a['log'])),
                        '%s: under 50 %% på en båt uten køyer: én melding om at du må i land, med nærmeste rorbu og avstanden' % fmt, a['toast']))
            out.append((ok(not any('ingen køyer' in x for x in b2['log'][-1:])), '%s: meldingen kommer én gang' % fmt, b2['log']))
            await pg.evaluate("S.energy = 25.02; S.enWarn = false"); c = await pg.evaluate(STEP, 2); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DIR, '%s-uten-koyer-25.png' % fmt))
            out.append((ok('sliten (25 %)' in c['toast'] and 'Nærmeste rorbu' in c['toast'] and 'Gå til kai' not in c['toast']), '%s: ved 25 %% sier toasten nærmeste rorbu og avstanden' % fmt, c['toast']))
            # 3: the breisjark, four bunks, three hands on watch
            r = await pg.evaluate(SETUP, ['breisjark', 3, [2, 1.2, 1.6]]); await pg.evaluate("S.energy = 25.02; S.enWarn = false")
            d = await pg.evaluate(STEP, 2); await pg.wait_for_timeout(300); await pg.screenshot(path=os.path.join(DIR, '%s-koye-25.png' % fmt))
            out.append((ok('Gå ned i køya og hvil' in d['toast']), '%s: på en båt med køyer og vakt sier toasten «Gå ned i køya og hvil»' % fmt, d['toast']))
            # 4: the Mannskap page at 12:10 with the cook at it
            await pg.evaluate("toastClear()"); e = await pg.evaluate(STEP, 38)
            await pg.evaluate("DOCK.open('arbeid')"); await pg.wait_for_timeout(600)
            txt = await pg.evaluate("(document.getElementById('drawerBody') || {}).innerText || ''")
            await pg.screenshot(path=os.path.join(DIR, '%s-mannskap-kokk.png' % fmt))
            cook = await pg.evaluate("(() => { const M = S.meal, c = M && M.cook && crewById(M.cook.id); return c ? [c.name, c.attr.kokk] : null; })()")
            out.append((ok('lager lunsj 12:30' in txt and cook and round(cook[1]) == 2), '%s: Mannskap-siden 12:08: «lager lunsj 12:30», og kokken er den beste av tre under 3' % fmt, [cook, txt[txt.find('Kokk'):txt.find('Kokk') + 60] if 'Kokk' in txt else txt[:200]]))
            await pg.evaluate("DOCK.close()"); f = await pg.evaluate(STEP, 30)
            served = await pg.evaluate("(() => { const L = S.meal && S.meal.last; return L ? {q:L.q, nm:L.nm[0], t:hm(L.t / 60)} : null; })()")
            out.append((ok(served and served['q'] == 2 and served['nm'] == 'lunsj' and served['t'] == '12:30'), '%s: lunsj 12:30, pølser i lompe (2)' % fmt, served))
            out.append((ok(not errs), '%s: ingen sidefeil' % fmt, errs))
        await br.close()
    for c, t, v in out: print(c, t, json.dumps(v, ensure_ascii=False)[:300])

asyncio.run(main())
