"""The sea marks along the whole coast (05.10.2026, core/01e-marks.js; tools/map/sjomerker.py, in the chart packs' 'marks' entry):
round Tromsø the chart pack's marks are read with its coast (lights with sectors and a rhythm, beacons and buoys, rocks), none inside
Senja's square (the embedded SEAMARKS stay there), the rocks count for running aground and for Autonav (rocksIn), the marks for the
routes' obstacles (11b-obstacles.js), and the chart plotter draws them. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        r = await pg.evaluate("""(async () => { const P0 = P(69.6489, 18.9561); await mapNeed(P0, 6);
          const T = MAPD.man.tile, k = Math.floor(P0.x / T) + ':' + Math.floor(P0.y / T), t = MARKS.tiles.get(k), all = [...MARKS.tiles.values()].filter(Boolean);
          const L = marksNear('lights', P0.x, P0.y, 30), M = marksNear('marks', P0.x, P0.y, 30), rk = rocksIn(P0.x - 15, P0.y - 15, P0.x + 15, P0.y + 15);
          const inS = all.some(t => t.lights.concat(t.marks, t.rocks).some(q => inSenja(q[0], q[1])));
          const sect = L.filter(q => q[5].length > 1).length, rhythm = L.every(q => Array.isArray(q[4]) && q[4].length && q[4].some(v => v > 0));
          return {tile:k, has:!!t, lights:t ? t.lights.length : 0, marks:t ? t.marks.length : 0, rocks:t ? t.rocks.length : 0, near:{L:L.length, M:M.length, rk:rk.length}, types:[...new Set(M.map(q => q[2]))].join(''), inS, sect, rhythm}; })()""")
        check(r['has'] and r['lights'] > 10 and r['marks'] > 10, 'round Tromsø the chart pack\'s sea marks are read with its coast', r)
        check(r['sect'] > 0 and r['rhythm'], 'the lights have sectors and a rhythm the 3D view can flash', {'sect': r['sect']})
        check(not r['inS'], 'none of the coast\'s marks lie inside Senja\'s square (the embedded ones stay there)')
        check(r['rocks'] == 0 or r['near']['rk'] > 0, 'the coast\'s rocks are in rocksIn (running aground, Autonav)', r['near'])
        # the routes' obstacles take the coast's marks
        r = await pg.evaluate("""(() => { obsIndex(); const n = HIND.list.filter(o => o.why === 'mark').length; return {n, senja:SEAMARKS.marks.length}; })()""")
        check(r['n'] > r['senja'], 'the routes\' obstacles take the coast\'s marks too', r)
        # the chart plotter draws them round Tromsø
        r = await pg.evaluate("""(async () => { openPlotter(); const P0 = P(69.6489, 18.9561); view.cx = P0.x; view.cy = P0.y; view.z = MAP_H / 6; applyView(); scheduleStatic(); renderDyn();
          await new Promise(r => setTimeout(r, 1500)); const s = document.querySelector('#mapsvg') || document.querySelector('svg'); return {lights:document.querySelectorAll('.lightsym').length}; })()""")
        check(r['lights'] > 5, 'the chart plotter draws the coast\'s lights round Tromsø', r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
