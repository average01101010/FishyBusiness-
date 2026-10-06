"""The climate along the coast (V1 of the weather plan, 06.10.2026; core/03-simulation.js climW/climDiff, src/data/climate.json from
tools/climate/fetch.py): Senja, where the game was calibrated, is exactly as before; the south is milder in winter and wetter, the east
has a colder sea; the weather at the boat follows where she is; nothing is NaN anywhere along the coast. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


PROBE = """(() => { const Hj = (Date.UTC(2027, 0, 15, 12) - EPOCH) / 36e5, Ha = (Date.UTC(2027, 7, 15, 12) - EPOCH) / 36e5;
  const at = (lat, lon) => P(lat, lon), sen = at(69.45, 17.35), fae = at(59.03, 10.53), lin = at(58.0, 7.05), var_ = at(70.37, 31.1);
  const senja = [];
  for (let m = 0; m < 12; m++){ const H = (Date.UTC(2027, m, 15) - EPOCH) / 36e5; senja.push([climDiff('t', H, sen), climDiff('sst', H, sen), climDiff('cloud', H, sen), climRatio('p', H, sen) - 1].map(v => Math.abs(v))); }
  const sMax = Math.max(...senja.flat());
  const dT = airTemp(Hj, fae) - airTemp(Hj, sen), dSea = seaTemp(Ha, var_) - seaTemp(Ha, sen), rP = climRatio('p', Hj, lin);
  // the boat: without p, the weather is where the boat is
  const b = S.boat, p0 = b.pos; b.pos = {...fae}; const here = airTemp(Hj) - airTemp(Hj, fae); b.pos = p0;
  // all along the coast, every 0.5 degree of latitude, the air, sea, rain, cloud and sight are numbers
  let bad = 0, n = 0; for (const q of CLIM.pts) for (const dl of [-0.4, 0, 0.4]){ const p = at(q.lat + dl, q.lon); for (const H of [Hj, Ha]){ n++;
    for (const v of [airTemp(H, p), seaTemp(H, p), precipAt(H, p), cloudAt(H, p), visibility(H, p)]) if (!Number.isFinite(v)) bad++; } }
  return {pts:CLIM.pts.length, ref:CLIM.ref.n, sMax:+sMax.toFixed(6), dT:+dT.toFixed(2), dSea:+dSea.toFixed(2), rP:+rP.toFixed(2), here:+here.toFixed(6), n, bad}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1100, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(PROBE)
        check(r['pts'] == 19 and r['ref'] == 'Senja' and r['sMax'] < 1e-9, 'the 19 points are in, and at Senja the air, sea, cloud and rain are exactly as before in every month', r)
        check(3 < r['dT'] < 6.5 and r['rP'] > 1.4, 'in January Færder is 3-6.5 °C milder than Senja, and Lindesnes gets far more precipitation', r)
        check(-4.5 < r['dSea'] < -1.5, 'in August the sea off Vardø is 1.5-4.5 °C colder than off Senja', r)
        check(r['here'] == 0, 'without a place given, the weather is where the boat is', r)
        check(r['bad'] == 0 and r['n'] > 100, 'along the whole coast the air, sea, rain, cloud and sight are numbers', {'n': r['n'], 'bad': r['bad']})
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
