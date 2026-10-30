"""The registration mark (vessel3d.js markStrips, Jonas 21.10.2026 «A»): on every boat with a detailed model it stands where nothing
stands proud of the hull under it on either side, clear of the anchor in its roller or hawse (geo.bower), on one even paint, and its
letters take their colour from that paint (light on dark, dark on light). The 15 m coastal boat's hawse once hid a part of it, and on the
snekke and the plastic sjark it stood on the dark stripe."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(() => { const out = {};
  for (const t of Object.keys(VESSELS)){ if (!glbHas(t)) continue; const st = markStrips(t); if (!st){ out[t] = null; continue; }
    const P = st.map(s => stripPaint(t, s)), c = markRGB(t), lum = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2], g = geoOf(t), bw = g.bower;
    const z = st[0][0].map(p => p[2]), y = st[0][0].map(p => p[1]).concat(st[0][1].map(p => p[1]));
    const near = bw && bw.fair ? Math.min(...st.flatMap(([B, T]) => B.concat(T).map(p => Math.hypot(p[0] - bw.fair[0], p[1] - bw.fair[1], p[2] - bw.fair[2])))) : 99;
    out[t] = {proud:[stripProud(t, st[0]), stripProud(t, st[1])], even:P.map(p => p && +p.even.toFixed(2)), zone1:P.map(p => p && +p.zone1.toFixed(2)), under:P[0] && +(0.3 * P[0].rgb[0] + 0.59 * P[0].rgb[1] + 0.11 * P[0].rgb[2]).toFixed(2), text:+lum.toFixed(2),
      fromStem:+(Math.min(...z) - g.bow).toFixed(2), y:[+Math.min(...y).toFixed(2), +Math.max(...y).toFixed(2)], anchor:+near.toFixed(2), bower:!!bw}; }
  return out; })()"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(JS)
        for t, v in r.items():
            if v is None: print('FEIL', t, 'har ikke noe merke'); continue
            clear = v['proud'] == [0, 0] and all(e is not None and e >= 0.9 for e in v['even'])
            # dark letters on light paint and light on dark (markCanvas: the text is light when the colour under it is dark)
            contrast = v['under'] is None or (v['under'] < 0.5) == (v['text'] < 0.5) or v['zone1'][0] >= 0.6
            print(ok(clear and contrast and (not v['bower'] or v['anchor'] > 0.3)), t, json.dumps(v))
        print('sidefeil', errs[:3])
        await br.close()
asyncio.run(main())
