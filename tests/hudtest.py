"""Folding the boxes on the screen (05.10.2026, ui/04-panels-instruments.js hudFold; Jonas: «Spillere skal kunne trykke minimer på disse,
som gjør slik at bare basisinformasjonen vises på en tynn stripe… Legg også inn muligheten for fjerning av HUD i innstillingene»): the
status box folds to a strip with the time, the status and the money, the little chart to a strip with speed, course and position, both
open again, «Skjul HUD» in the settings takes them away, and it is all kept after a reload. On a phone in portrait. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


BOX = """(() => { const r = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(), cs = getComputedStyle(e);
  return cs.display === 'none' || !q.width ? null : {h:Math.round(q.height), w:Math.round(q.width), top:Math.round(q.top)}; };
  return {hud:r('#hud'), plot:r('#miniPlot'), gps:r('#gps3d'), compass:r('#compass3d'), fold:r('#plotMin'), text:document.getElementById('hud').textContent, gtext:document.getElementById('gps3d').textContent,
    cls:['hudmin', 'plotmin', 'hudoff'].filter(c => document.body.classList.contains(c))}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 412, 'height': 860}, device_scale_factor=2, has_touch=True); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        await pg.evaluate("(() => { if (!document.body.classList.contains('v3d') && typeof G3 !== 'undefined') G3.show(true); S.boat.status = 'idle'; S.boat.port = null; renderHud(); })()"); await pg.wait_for_timeout(800)
        a = await pg.evaluate(BOX)
        # 0. on a phone upright the compass line runs along the top (a canvas between left and right had shrunk to 60 px, iPhone 05.10.2026)
        check(a['compass'] and a['compass']['w'] >= 412 - 80 and a['compass']['top'] < 20, 'on a phone upright the compass line spans the top of the screen', a['compass'])
        # 1. the status box folds to a strip and opens again
        await pg.click('#hud .hmin'); await pg.wait_for_timeout(400); b = await pg.evaluate(BOX)
        check(a['hud'] and b['hud'] and b['hud']['h'] < 40 and b['hud']['h'] < a['hud']['h'] / 3 and ':' in b['text'] and 'kr' in b['text'] and 'hudmin' in b['cls'],
              'the status box folds to a thin strip with the time, the status and the money', {'full': a['hud'], 'strip': b['hud'], 'text': b['text'][:80]})
        await pg.click('#hud .hmin'); await pg.wait_for_timeout(400); c = await pg.evaluate(BOX)
        check(c['hud']['h'] == a['hud']['h'] and 'hudmin' not in c['cls'], 'and opens again with «+»', c['hud'])
        # 2. the little chart folds to a strip with speed, course and position
        await pg.click('#plotMin'); await pg.wait_for_timeout(600); d = await pg.evaluate(BOX)
        check(a['plot'] and not d['plot'] and d['gps'] and d['gps']['h'] < 40 and 'kn' in d['gtext'] and '°' in d['gtext'] and 'plotmin' in d['cls'],
              'the little chart folds to a strip with speed, course and position', {'plot': a['plot'], 'gps': d['gps'], 'text': d['gtext'][:80]})
        # 3. «Skjul HUD» in the settings takes them all away, and it is kept after a reload
        await pg.evaluate("(() => { PHONE.open('innst'); document.querySelector('#phone [data-pa=hudShow][data-v=\"0\"]').click(); PHONE.show(false); })()"); await pg.wait_for_timeout(500)
        e = await pg.evaluate(BOX)
        check(not e['hud'] and not e['plot'] and not e['gps'] and not e['compass'] and not e['fold'] and 'hudoff' in e['cls'], '«Skjul HUD» takes away the status box, the little chart, the GPS strip and the compass', e['cls'])
        await pg.evaluate("save()"); await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && !!S.boat", timeout=90000); await pg.wait_for_timeout(1500)
        f = await pg.evaluate("({off:!!S.settings.hudOff, plotMin:!!S.settings.plotMin, cls:['hudoff', 'plotmin'].filter(c => document.body.classList.contains(c))})")
        check(f['off'] and f['plotMin'] and f['cls'] == ['hudoff', 'plotmin'], 'the choices are kept after a reload', f)
        await pg.evaluate("(() => { PHONE.open('innst'); document.querySelector('#phone [data-pa=hudShow][data-v=\"1\"]').click(); PHONE.show(false); renderHud(); })()"); await pg.wait_for_timeout(500)
        g = await pg.evaluate(BOX)
        check(g['hud'] and 'hudoff' not in g['cls'], '«Vis HUD» brings them back', g['cls'])
        await pg.screenshot(path='hud_strips.png')
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
