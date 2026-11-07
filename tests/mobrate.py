"""How often a hand goes over the side (Ø11.6, core/14b-sikkerhet.js; a measurement, not a test): the game's own weather hour by hour
through January and July 2027, at four places on open water along the coast (off Senja's outer side, off Bergen, in the Vestfjord off
Bodø, off Hammerfest), for the havsjark (sjark, 10.99 m, a wheelhouse) with one hand hauling at the rail (the most exposed station,
1.6) and for the open plastic snekke with one hand jigging (1.2). Per 100 hours on deck: the falls the risk gives (mobRate), and the near
misses (three for each fall); over all the hours, and over the hours a boat would be out (the sea under her red limit, riskLevel < 2;
over it Autonav turns her for port and the plan lies to). Also the share of the hours with no risk at all (calm). Prints a table."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright

MEASURE = """async (A) => { const [lat, lon, y, m, vt, w] = A, p = P(lat, lon); await mapNeed(p, MAPD.simR);
  const V = VESSELS[vt], r = V.risk, open = (V.fac || {}).house === 'open', H0 = (Date.UTC(y, m, 1) - EPOCH) / 3.6e6, n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate() * 24;
  let all = 0, out = 0, nOut = 0, calm = 0, dark = 0, ice = 0, red = 0;
  for (let h = 0; h < n; h++){ const H = H0 + h, W = windAt(H, p), hs = hsAt(p, H), dk = sunAt(H, p).el < -6, T = airTemp(H, p), sst = seaTemp(H, p), ic = mobIcing(T, W, sst);
    const x = mobSeaX(W, hs, r), k = mobRate(w, {x, dark:dk, ice:ic, gop:w >= 1.6, open}) * 100; all += k; if (k === 0) calm++; if (dk) dark++; if (ic) ice++;
    if (riskLevel(W, hs) < 2){ out += k; nOut++; } else red++; }
  return {land:isLand(p), depth:Math.round(depthF(p)), all:+(all / n).toFixed(3), out:+(out / Math.max(1, nOut)).toFixed(3), calm:Math.round(calm / n * 100), dark:Math.round(dark / n * 100), ice:Math.round(ice / n * 100), red:Math.round(red / n * 100)}; }"""

PLACES = [('Senja, yttersiden', 69.40, 16.90), ('Bergen, utenfor Fedje', 60.78, 4.55), ('Bodø, Vestfjorden', 67.45, 13.90), ('Hammerfest, utenfor Sørøya', 70.75, 22.60)]


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('#no3d' if os.environ.get('KYST_LITE') else ''))
        rows = []
        for name, lat, lon in PLACES:
            for mon, mi in (('januar', 0), ('juli', 6)):
                for vt, w, who in (('sjark', 1.6, 'haler'), ('snekke', 1.2, 'jukser')):
                    r = await pg.evaluate(MEASURE, [lat, lon, 2027, mi, vt, w]); rows.append([name, mon, vt, who, r])
                    print(json.dumps([name, mon, vt, who, r], ensure_ascii=False))
        print('\n| Sted | Måned | Båt, stasjon | Fall per 100 t på dekk, alle timer | Fall per 100 t, timene båten er ute | Nestenulykker per 100 t ute | Stille (ingen risiko) | Mørkt | Ising | Over rød grense |')
        print('|---|---|---|---|---|---|---|---|---|---|')
        for name, mon, vt, who, r in rows:
            print('| %s | %s | %s, %s | %.2f | %.2f | %.2f | %d %% | %d %% | %d %% | %d %% |' % (name, mon, vt, who, r['all'], r['out'], r['out'] * 3, r['calm'], r['dark'], r['ice'], r['red']))
        print('errors:', errs)
        await br.close()

asyncio.run(main())
