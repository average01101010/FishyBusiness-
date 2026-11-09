# Steg 16 R (09.11.2026): the pictures of «Sløy om bord» on the Fishing tab, «Fangsten» under Levering in the operations plan, and the
# landing note with round haddock and saithe, upright and lying (800x1280, 1280x800), to tests/out/rundshot/ (or docs/okter/<arg>/, as
# the session's pictures were taken: python3 rundshot.py 2026-11-09-r). Prints what it sees.
from _env import GAME, boot, HERE, OUT
import asyncio, json, os, sys
from playwright.async_api import async_playwright
DST = os.path.join(os.path.dirname(HERE), 'docs', 'okter', sys.argv[1]) if len(sys.argv) > 1 else os.path.join(OUT, 'rundshot')
os.makedirs(DST, exist_ok=True)
SALE = """(() => { const b = S.boat; S.t = Math.round((Date.UTC(2028, 1, 10, 7) - EPOCH) / 6e4); S.crew = []; S.quota = null; b.gutAboard = false;
  b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p};
  S.hold = [{sp:'hyse', cls:1, kg:180, n:120, bled:true, iced:true, hr:0, fresh:96, gut:false, hook:true}, {sp:'sei', cls:1, kg:240, n:80, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true},
    {sp:'torsk', cls:1, kg:310, n:90, bled:true, iced:true, hr:0, fresh:97, gut:false, hook:true}];
  const c0 = S.cash; sell(); const ls = S.lastSale; return {cash:Math.round(S.cash - c0), gutKr:ls.gutKr, gutKg:ls.gutKg, ex:ls.ex, lines:ls.lines.map(r => [r.sp, r.gut, Math.round(r.kg), r.sum])}; })()"""
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 800, 'height': 1280})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(SALE); print('salg:', json.dumps(r, ensure_ascii=False))
        for w, h in [(800, 1280), (1280, 800)]:
            await pg.set_viewport_size({'width': w, 'height': h}); tag = '%dx%d' % (w, h)
            # the landing note (Havn tab, portSlip)
            await pg.evaluate("DOCK.open('lever')"); await pg.wait_for_timeout(800)
            await pg.evaluate("(() => { const e = document.querySelector('#drawerBody .slipt'); if (e) e.scrollIntoView({block:'start'}); })()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DST, 'seddel-' + tag + '.png'))
            # the switch on the Fishing tab
            await pg.evaluate("DOCK.close(); DOCK.open('beholdning:last')"); await pg.wait_for_timeout(800)
            await pg.evaluate("(() => { const e = document.querySelector('#drawerBody #setGut'); if (e) e.closest('label').scrollIntoView({block:'center'}); })()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DST, 'ombord-' + tag + '.png'))
            await pg.evaluate("DOCK.close()"); await pg.wait_for_timeout(300)
            # the operations plan, Levering open
            await pg.evaluate("if (!S.ops) PHONE.dact('drift', 'p2-new', {}); PHONE.dact('drift', 'p2-row', {k:'land'}); DOCK.open('drift')"); await pg.wait_for_timeout(800)
            await pg.evaluate("(() => { const e = document.querySelector('[data-pa=\"p2-gut\"]'); if (e) e.scrollIntoView({block:'center'}); })()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(DST, 'driftsplan-' + tag + '.png'))
            await pg.evaluate("PHONE.dact('drift', 'p2-row', {k:'land'}); DOCK.close()"); await pg.wait_for_timeout(300)
        s = await pg.evaluate("""(() => { const R = {}; DOCK.open('beholdning:last'); const e = document.querySelector('#drawerBody #setGut'); R.box = !!e; R.off = e && !e.checked;
          e.checked = true; e.dispatchEvent(new Event('change', {bubbles:true})); R.on = S.boat.gutAboard === undefined && catchGut();
          PHONE.dact('drift', 'p2-gut', {v:'0'}); R.plan = S.boat.gutAboard === false && !catchGut(); PHONE.dact('drift', 'p2-gut', {v:'1'}); R.plan1 = S.boat.gutAboard === undefined;
          return R; })()""")
        ok = lambda c: 'OK  ' if c else 'FEIL'
        print(ok(r['gutKr'] == round(0.3 * 420) and r['gutKg'] == 420 and not r['ex']), 'rund hyse og sei: trekket på seddelen, ingen lever og rogn', r['gutKr'], r['gutKg'])
        print(ok(s['box'] and s['off'] and s['on'] and s['plan'] and s['plan1']), 'bryteren på Fiske-fanen og i driftsplanen setter båtens valg', s)
        print('sidefeil:', errs[:4]); await br.close()
asyncio.run(main())
