"""Father's naust keeps clear of everything (Jonas 09.10.2026, after boats lay through a naust in Tufjord: «Sørg for at det aldri er en
konflikt mellom naustet og andre kaier eller moloer, bygninger eller andre ting»; core/07c-naust.js naustClash): for homes along the whole
coast, the naust is found with the vec packs of its tiles in, and its ground and the water in front of it hold no pier, breakwater, quay
face or NPC boat (and no mapped building where a clean site was to be had). Prints one line per home and OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
HOMES = ['Tufjord', 'Bodø', 'Hammerfest', 'Båtsfjord', 'Ålesund', 'Egersund', 'Vardø', 'Svolvær']


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1000, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        res = []
        for nm in HOMES:
            r = await pg.evaluate("""(async nm => { const pt = PORTS.find(q => q.mottak && !q.rorbu && !q.sted && q.name.indexOf(nm) === 0) || PORTS.find(q => !q.rorbu && !q.sted && q.name.indexOf(nm) === 0); if (!pt) return null;
          S.home = pt.id; S.naust = null; await mapNeed(pt.p, MAPD.simR); const t0 = performance.now(); let n = null;
          // the vec packs round the home in first (a slow test server: waited for), so naustClash has something to see
          const T = MAPD.man.tile * 1000, x = pt.p.x * 1000, z = pt.p.y * 1000, ks = new Set(); for (const dx of [-500, 0, 500]) for (const dz of [-500, 0, 500]) ks.add(Math.floor((x + dx) / T) + ':' + Math.floor((z + dz) / T));
          await Promise.race([Promise.all([...ks].map(k => MAPD.byTile.get('vec:' + k) ? mapLoad(MAPD.byTile.get('vec:' + k)) : null)), new Promise(f => setTimeout(f, 120000))]);
          for (const k of ks) vecTile(+k.split(':')[0], +k.split(':')[1]); await new Promise(f => setTimeout(f, 1500));
          while (performance.now() - t0 < 60000){ n = naustSite(); if (n || (S.naust && S.naust.port === pt.id && S.naust.ver === 2)) break; await new Promise(f => setTimeout(f, 150)); }
          n = S.naust && S.naust.o ? S.naust : null; if (!n) return {name:pt.name, found:false, ms:Math.round(performance.now() - t0)};
          const N = [-n.u[1], n.u[0]], sx = n.o[0] - N[0] * 4, sz = n.o[1] - N[1] * 4;
          // clear of everything the packs hold, buildings too (counted apart)
          const clash = naustClash(sx, sz, n.u[0], n.u[1], N[0], N[1], false), bld = naustClash(sx, sz, n.u[0], n.u[1], N[0], N[1], true);
          const tiles = vecTilesIn(sx - 120, sz - 120, sx + 120, sz + 120).length; return {name:pt.name, found:true, clash, bld, tiles, ver:S.naust.ver, ms:Math.round(performance.now() - t0)}; })(%s)""" % json.dumps(nm))
            if r: res.append(r); print(json.dumps(r, ensure_ascii=False))
        good = [r for r in res if r['found']]
        print(ok(len(good) >= len(res) - 2), 'naustet er funnet for de fleste hjemmene', len(good), '/', len(res))
        print(ok(all(r['clash'] is None for r in good)), 'ingen kai, molo eller NPC-båt i naustets område noe sted', [r['name'] for r in good if r['clash']])
        print('hus i veien (tatt bort som før):', [r['name'] for r in good if r['bld']])
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
