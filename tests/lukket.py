"""No harbour shut in by its own quay and fill (13.11.2026; a tester on test.detstorebla.no: «Jeg er stuck ved fiskemottaket i ålesund og
kan ikke bruke autonav eller andre midler for å komme med videre. Gjelder dette flere steder i landet?»). Six harbours along the coast
lay in pockets where the quay and the fill shut the water in (the plants in Ålesund, Fosnavåg, Laukvik and Vengsøy, the tackle shops
in Vanse and Søndeled), and their way out crossed land (core/07-harbours.js approachPath pt.free). The places were moved to a quay
face with water out to the sea (tools/steder/lukkflytt.py, Jonas 13.11.2026: «Flytt kaiplassene»).
For every harbour along the coast, its map round it loaded: the way in is found over water alone (pt.free not set) and is not empty.
Needs the whole coast (tools/map/release.py, tools/map/game.py, node build.mjs). LITE. Prints OK or FEIL, and the harbours that fail
with their place (lukket: name lat lon free).
KYST_LUKKET=id,id limits it to those harbours."""
import asyncio, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from _env import GAME, boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

CHECK = r"""async (only) => {
  const R = {n:0, sealed:[], none:[], err:[]};
  for (const pt of PORTS.filter(q => !only.length || only.includes(q.id))){
    try { await mapPreload([pt.p], [['sim', 3], ['chart', 3]]); }
    catch (e){ R.err.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    delete APPROACH[pt.id]; pt.free = undefined;
    let a; try { a = approachPath(pt); } catch (e){ R.err.push([pt.id, String(e && e.message).slice(0, 80)]); continue; }
    R.n++; const ll = natLL(pt.p), at = [pt.id, pt.name, +ll.lat.toFixed(4), +ll.lon.toFixed(4)];
    if (!a.length) R.none.push(at); else if (pt.free) R.sealed.push(at.concat([pt.free]));
  }
  return R; }"""


async def main():
    if not os.path.isdir(os.path.join(ROOT, 'tools', 'map', 'out', 'game')):
        print('FEIL the whole coast is not in the build (tools/map/release.py, tools/map/game.py, node build.mjs)'); return
    only = [s for s in os.environ.get('KYST_LUKKET', '').split(',') if s]
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await (await br.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('' if 'no3d' in GAME else ',no3d'))
        r = await pg.evaluate(CHECK, only)
        for s in r['sealed']: print('lukket:', json.dumps(s, ensure_ascii=False))
        for s in r['none']: print('ingen vei:', json.dumps(s, ensure_ascii=False))
        print('harbours checked:', r['n'], '| not loaded or failed:', r['err'][:5])
        print(ok(r['n'] >= (len(only) if only else 300) and not r['err']), 'every harbour along the coast checked with its map loaded (%d)' % r['n'])
        print(ok(not r['sealed']), 'no harbour shut in by its quay and fill: the way out goes over water (%d shut in)' % len(r['sealed']))
        print(ok(not r['none']), 'every harbour has a way in (%d without)' % len(r['none']))
        if not only:
            # a moved place keeps its id (steder.json «was»): saves hold it as the boat's port, home and waypoints
            ids = await pg.evaluate("""() => ['sb262723_1571672', 'sb418023_1523092'].map(id => { const q = portById(id); return q ? [q.id, q.name, +q.p.x.toFixed(3), +q.p.y.toFixed(3)] : null; })""")
            print('kept ids:', ids)
            print(ok(all(ids) and abs(ids[0][2] - 262.667) < 0.05 and abs(ids[1][2] - 417.142) < 0.05), 'the moved shops in Vanse and Søndeled keep the ids saves hold, at their new quays')
            # a save whose harbour is gone (a place moved before its id was kept) starts at the nearest harbour, not with an error
            n0 = len(errs)
            await pg.evaluate("() => { TAB.held = false; S.boat.status = 'port'; S.boat.port = 'sb999999_999999'; save(); }")
            await pg.reload()
            try:
                await pg.wait_for_function("typeof S !== 'undefined' && S.boat && typeof SIMREADY !== 'undefined' && SIMREADY === true", timeout=120000)
                g = await pg.evaluate("() => ({port:S.boat.port, known:!!portById(S.boat.port), st:S.boat.status})")
            except Exception as e: g = {'known': False, 'st': 'did not start: ' + str(e)[:80]}
            print('save with a harbour that is gone:', g, errs[n0:][:2])
            print(ok(g['known'] and g['st'] == 'port' and not errs[n0:]), 'a save whose harbour is gone starts at the nearest harbour, with no page error')
        print('errors:', errs[:4]); await br.close()
asyncio.run(main())
