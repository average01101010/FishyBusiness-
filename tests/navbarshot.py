"""The chart plotter's top bar with a route under way, standing and lying, on a phone and a tablet (Jonas 13.10.2026: the bar did not
work on a narrow phone, the readings ran into each other). Prints each field's box and whether its text is cut or spills."""
from _env import boot, OUT
import asyncio, json, os
from playwright.async_api import async_playwright

SET = """async () => { S.equip.plotter = true; S.equip.sonar = S.equip.sonar || false; S.equip.chirp = true;
  const H = PORTS.find(q => /havøysund/i.test(q.name)) || PORTS[0], b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:H.p.x - 3, y:H.p.y + 2};
  S.plan = {wps:[{x:H.p.x - 2, y:H.p.y + 1}, {x:H.p.x - 1, y:H.p.y + 0.5}, {x:H.p.x, y:H.p.y, port:H.id}], idx:0, speed:7, returning:false};
  await mapNeed(b.pos, 4); openPlotter(); }"""
MEASURE = """() => { const bar = document.getElementById('ecdisTop').getBoundingClientRect(), out = {bar:[Math.round(bar.top), Math.round(bar.bottom)], f:[]};
  for (const el of document.querySelectorAll('#ecdisTop .ec-f, #ecdisTop .ec-b')){ const r = el.getBoundingClientRect(); if (!r.width) continue;
    const spill = [...el.querySelectorAll('small,b')].some(t => t.scrollWidth > t.clientWidth + 1 && getComputedStyle(t).textOverflow !== 'ellipsis');
    out.f.push({id:el.id || el.className, x:Math.round(r.left), w:Math.round(r.width), top:Math.round(r.top), bot:Math.round(r.bottom), spill, out:r.bottom > bar.bottom + 1 || r.right > innerWidth + 1}); }
  const m = document.getElementById('map').getBoundingClientRect(); out.map = Math.round(m.top); return out; }"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        for w, h, tag in [(344, 694, 'smal_telefon_staaende'), (430, 932, 'telefon_staaende'), (932, 430, 'telefon_liggende'), (800, 1280, 'staaende'), (1280, 800, 'liggende')]:
            pg = await br.new_page(viewport={'width': w, 'height': h}, has_touch=True, is_mobile=w < 1000); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg); await pg.evaluate(SET); await pg.wait_for_timeout(1500)
            r = await pg.evaluate(MEASURE)
            bad = [f for f in r['f'] if f['spill'] or f['out']]
            print('OK  ' if not bad and r['map'] >= r['bar'][1] - 1 else 'FEIL', tag, json.dumps(r, ensure_ascii=False)[:600], errs[:2], flush=True)
            await pg.screenshot(path=os.path.join(OUT, 'navbar_%s.png' % tag), clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 260)})
            await pg.close()
        await br.close()

asyncio.run(main())
