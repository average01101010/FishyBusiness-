"""The echo sounder's species picker (tilbakemelding #41, 07.10.2026): the CHIRP and the sonar show each species on its own, the sum of all
is what it was, the chip on the chart cycles through them, and the settings list them. Light and without 3D (the long check of the heat
map is heattest.py). Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(async () => { const R = {}, E = P(69.30, 15.90); const q = {x:E.x + Math.sin(5.2) * 28, y:E.y - Math.cos(5.2) * 28}; try { await mapNeed(q, 2); } catch (e){}
          const H = (Date.UTC(2028, 5, 10, 8) - EPOCH) / 3.6e6; const v = heatSample(q, H), sum = 30 * SP.reduce((a, sp) => a + density(sp, q, H), 0);
          R.len = v.length; R.sum = +heatValue(v, 'all').toFixed(4); R.want = +sum.toFixed(4);
          R.each = HEAT.sp.map(sp => [sp, +heatValue(v, sp).toFixed(3), +(30 * density(sp, q, H)).toFixed(3)]);
          // the picker: one chip click after the other goes through every species and back to all
          S.equip.chirp = true; S.equip.sonar = false; S.settings.echo = true; S.settings.heatSp = 'all'; const seen = ['all'];
          for (let i = 0; i < HEAT.sp.length + 1; i++){ const nx = heatSpecies() === 'all' ? HEAT.sp[0] : HEAT.sp[HEAT.sp.indexOf(heatSpecies()) + 1] || 'all'; S.settings.heatSp = nx; seen.push(heatSpecies()); }
          R.seen = seen; const h = echoSettings(); R.btn = (h.match(/data-act="hsp"/g) || []).length; R.cap = HEAT.sp.every(sp => h.includes('data-s="' + sp + '"'));
          S.equip.sonar = true; S.settings.sonar = true; S.settings.heatSp = 'brosme'; R.sonar = heatSpecies(); const t0 = HEATC.tier; HEATC.tier = 'sonar'; S.boat.status = 'idle'; R.note = heatReadout().replace(/<[^>]+>/g, ''); HEATC.tier = t0; S.settings.heatSp = 'all'; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['len'] == 11 and abs(r['sum'] - r['want']) < 1e-3 and all(abs(a - b) < 1e-3 for _, a, b in r['each'])), 'the sounder samples each species on its own and the sum of all is as before', (r['sum'], r['want']))
        print(ok(r['seen'] == ['all', 'torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'blakveite', 'krabbe', 'all']), 'the chip on the chart goes through all species and back to all', r['seen'])
        print(ok(r['btn'] == 11 and r['cap'] and r['sonar'] == 'brosme' and 'rosme' in r['note']), 'the settings list every species, and the sonar says where the tusk schools are heading', (r['btn'], r['note']))
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
