"""«Første tur» along the whole coast (Onboarding 2, O0/O1, docs/planer/onboarding-2.md): for every place the start list offers
(ui/08c-start.js), in January and in July, the first trip's patch (tutFieldNear): that one is found near the harbour (else the guide
falls back to Gisundet nord on Senja), that it is lawful for a hand jig and cod on that date (rulesAt: the spawning areas south of
62° N 1.1–30.4, the Oslo fjord, the closed fields; and in the Skagerrak, east of Lindesnes, inside the baseline, since outside it
Norwegian vessels may not fish cod: FOR-2022-12-16-2281 § 1, the same each year since), how far out it lies and how long the way out
takes in real minutes (6 knots, GAME_RATE), and how much of the jig's fish there is cod. Needs the whole coast in the build
(tools/map/release.py, tools/map/game.py, node build.mjs). Every fourth place along the coast and the sample places (about 15 minutes);
`--all` takes every place (about an hour: the map is loaded round each). Prints a summary line per month and OK/FEIL lines."""
from _env import GAME, boot
import asyncio, json, os, sys
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
# the coast's sample places (CLAUDE.md: south, west, middle, north, east), printed one by one
# the start place nearest each (Bergen and Hammerfest have no plant in the register, so the nearest one stands for them)
SAMPLE = [['Oslofjorden', 59.2, 10.4], ['Kristiansand', 58.14, 8.0], ['Egersund', 58.45, 5.99], ['Bergen', 60.39, 5.32], ['Ålesund', 62.47, 6.15],
          ['Bodø', 67.28, 14.38], ['Vangshamn', 69.47, 18.01], ['Hammerfest', 70.66, 23.68], ['Båtsfjord', 70.63, 29.72]]
MONTHS = [('januar', 2028, 0, 15), ('juli', 2027, 6, 15)]

# one place at a time (a whole month in one evaluate gave no sign of life and hung once, 27.10.2026)
LIST = """([every, sample]) => { const all = PORTS.filter(q => q.mottak || q.id === HOME0);
  const near = sample.map(([n, la, lo]) => { const p = P(la, lo); let b = null; for (const q of all){ const d = dist(q.p, p); if (!b || d < b.d) b = {d, id:q.id}; } return b.id; });
  return {ids:all.filter((q, i) => i % every === 0 || near.includes(q.id)).map(q => q.id), near}; }"""
JS = """async ([id, y, m, d]) => {
  const H = (Date.UTC(y, m, d, 9) - EPOCH) / 3600000; S.t = H * 60;
  const JIG = ['torsk', 'sei', 'hyse', 'lyr'], pt = portById(id), t0 = performance.now();
  try { await mapNeed(pt.p, 10.5); } catch (e){ return {id, n:pt.name, err:'map ' + e.message}; }
  const tMap = performance.now() - t0;
  let f = null, ms = 0; try { const t1 = performance.now(); f = tutFieldNear(pt, portById(pt.mottak ? pt.id : 'botnhamn')); ms = performance.now() - t1; } catch (e){ return {id, n:pt.name, err:e.message}; }
  const ll = LL(pt.p), r = {id, n:pt.name, lat:+ll.lat.toFixed(2), lon:+ll.lon.toFixed(2), f:!!f, ms:Math.round(ms), map:Math.round(tMap)};
  if (f){
    const fl = LL(f.p), km = dist(f.p, pt.p), mix = f.mix || TUTB.mix, q0 = rulesAt({p:f.p, H, len:7, gear:'juksa', sp:null, hand:true});
    // lawful: the jig may fish there at all, and each species in the patch's mix is allowed there on the date
    const qs = Object.keys(mix).map(sp => rulesAt({p:f.p, H, len:7, gear:'juksa', sp, hand:true})), all = [q0, ...qs];
    const skag = fl.lat < 59.95 && fl.lon > 7.05, inBL = !!(ruBits(f.p) & 1);
    const den = JIG.map(s => { try { return density(s, f.p, H); } catch (e){ return 0; } }), sum = den.reduce((a, b) => a + b, 0);
    Object.assign(r, {km:+km.toFixed(2), min:+(km / 1.852 / 6 * 60 / GAME_RATE).toFixed(1), v:all.some(x => x.v === 'no') ? 'no' : 'ok',
      why:all.flatMap(x => x.items).filter(x => x.v === 'no').map(x => x.k).join(','), skagOut:skag && !inBL && !!mix.torsk, mix,
      cod:sum > 0 ? +(den[0] / sum).toFixed(2) : null, kr:+Object.entries(mix).reduce((a, [sp, w]) => a + w * marketPrice(sp, H), 0).toFixed(1)});
  }
  return r;
}"""

async def main():
    if not os.path.isdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'tools', 'map', 'out', 'game')):
        print('FEIL the whole coast is not in the build (tools/map/release.py, tools/map/game.py, node build.mjs)'); return
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        # how rulesAt answers (its shape is read, not assumed)
        shape = await pg.evaluate("(() => { const r = rulesAt({p:S.boat.pos, gear:'juksa', sp:'torsk', hand:true}); return Object.keys(r); })()")
        print('rulesAt keys:', shape)
        # the game's own loop held (TAB.held, as routetest does): the test moves the clock to January and July, and the loop would
        # otherwise play the whole jump forward (the first version hung on it, 27.10.2026)
        await pg.evaluate("TAB.held = true")
        for name, y, m, d in MONTHS:
            L = await pg.evaluate(LIST, [1 if '--all' in sys.argv else 4, SAMPLE]); ids, near = L['ids'], L['near']; rows = []
            for k, pid in enumerate(ids):
                try: rows.append(await asyncio.wait_for(pg.evaluate(JS, [pid, y, m, d]), 120))
                except Exception as e: rows.append({'id': pid, 'n': pid, 'err': 'timeout or error: ' + str(e)[:80]})
                if k % 10 == 0: print(f'  {name} {k + 1}/{len(ids)}', rows[-1].get('n'), rows[-1].get('map'), 'ms map', flush=True)
            errd = [r for r in rows if r.get('err')]
            found = [r for r in rows if r.get('f')]
            nof = [r['n'] for r in rows if not r.get('f') and not r.get('err')]
            bad = [r for r in found if r.get('v') == 'no' or r.get('skagOut')]
            far = [r for r in found if r['km'] > 2.5]
            mins = sorted(r['min'] for r in found)
            med = mins[len(mins) // 2] if mins else None
            codlow = [r for r in found if r.get('cod') is not None and r['cod'] < 0.3]
            slow = sorted(r.get('ms', 0) for r in rows)
            krs = sorted(r['kr'] for r in found if r.get('kr') is not None)
            print(f'{name}: {len(rows)} places, field found at {len(found)}, none at {len(nof)}, errors {len(errd)}; unlawful {len(bad)}; '
                  f'over 2.5 km out {len(far)}; way out median {med} real min, longest {mins[-1] if mins else None}; cod under 30 % of the jig fish at {len(codlow)}; the search takes median {slow[len(slow) // 2]} ms, longest {slow[-1]} ms; the mix is worth median {krs[len(krs) // 2] if krs else None} kr/kg, lowest {krs[0] if krs else None}')
            for (s, _, _), sid in zip(SAMPLE, near):
                r = next((x for x in rows if x['id'] == sid), None)
                print('  ', s + ':', json.dumps(r, ensure_ascii=False))
            print(ok(not nof), name + ': a patch is found near every start (else the ring is at Gisundet nord on Senja)', nof[:12])
            print(ok(not bad), name + ': every patch is lawful for a hand jig and cod on the date', [(r['n'], r['why'] or 'skagerrak-out') for r in bad][:12])
            # within 2.5 km where the sea and the rules allow it: nine in ten, none over 10 km (in January the spawning areas south of 62° N
            # and Rogaland's open sea push a few further out)
            print(ok(len(far) <= len(found) // 10 and all(r['km'] <= 10 for r in found)), name + ': nine in ten patches within 2.5 km, so the first bite comes within minutes, and none over 10 km', [(r['n'], r['km']) for r in far][:12])
            print(ok(slow and slow[-1] < 1500), name + ': the search is quick enough for the start screen (under 1.5 s at the slowest place)', slow[-3:])
            print(ok(not errd), name + ': no errors', [(r['n'], r['err']) for r in errd][:5])
        print('errors:', errs[:3])
        await b.close()

asyncio.run(main())
