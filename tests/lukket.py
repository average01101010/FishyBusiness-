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


# the plants' quays before tools/steder/lukkflytt.py moved them (x, y km, the normal's angle, the face's length m)
OLDQ = {'M317': [293.549, 1092.274, 3.515, 49.5], 'M2047': [266.419, 1102.859, 5.675, 20.5], 'N581': [725.683, 463.87, 1.038, 43.5], 'T247': [887.994, 298.375, 2.477, 41.0]}
# the unit and the harbour point set down on a face, as 06b-coastports.js sets them (and the caches that hold them dropped)
MOVE = r"""(id, [x, y, a, len]) => { const pt = portById(id), U = UNITS[id], nx = Math.cos(a), nz = Math.sin(a), cx = x * 1000, cz = y * 1000, hl = Math.max(8, len / 2), ux = -nz, uz = nx;
  U.o = [cx, cz]; U.u = [nz, -nx]; U.n = [nx, nz]; COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
  pt.xy = [x, y]; pt.shore = [x, y]; pt.coast = {x:(cx - nx * 30) / 1000, y:(cz - nz * 30) / 1000}; pt.p = {x:Math.round(cx + nx * 15) / 1000, y:Math.round(cz + nz * 15) / 1000};
  HNEAR = null; HCELL.clear(); PCELL = null; QUAYF = null; delete APPROACH[id]; pt.free = undefined; for (const k in BERTHPOSE) delete BERTHPOSE[k]; }"""
NAUST = r"""async ([id, oldQ, newQ]) => { const mv = """ + MOVE + r""", pt = portById(id);
  await mapPreload([pt.p], [['sim', 3], ['chart', 3], ['vec', 2]]);
  mv(id, oldQ); await mapPreload([pt.p], [['sim', 3], ['chart', 3], ['vec', 2]]); const old = naustFind(id);
  mv(id, newQ); const home0 = S.home; S.home = id; S.naust = Object.assign({}, old); let n = naustSite();
  for (let i = 0; i < 120 && S.naust && S.naust.ver !== 3; i++){ await new Promise(r => setTimeout(r, 250)); n = naustSite(); }   // (it asks for the map round the harbour first, as in the game)
  const R = {id, old:!!(old && old.o), oldWay:old && old.o ? naustWayOk(old, id) : null, n:!!(n && n.o), kept:!!(n && old.o && n.o[0] === old.o[0] && n.o[1] === old.o[1]), ver:n && n.ver,
    km:n && n.o ? +(Math.hypot(n.o[0] - pt.p.x * 1000, n.o[1] - pt.p.y * 1000) / 1000).toFixed(2) : null};
  R.way = n && n.o ? naustWayOk(n, id) : false; R.ok = !old.o || (R.n && R.way && R.ver === 3);
  S.home = home0; S.naust = null; return R; }"""

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
            # Father's naust found round a plant's old quay (a save from before the move, ver 3): the boat gets out from the naust the game
            # ends up with, kept where she gets out from it or found again by the new quay (core/07c-naust.js naustSite)
            M = {x['id']: x for x in json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m']}
            nr = []
            for mid, old in OLDQ.items():
                r = await pg.evaluate(NAUST, ['m' + mid, old, M[mid]['q'][:4]]); nr.append(r)
                print('   naust', json.dumps(r, ensure_ascii=False))
            print(ok(all(r.get('ok') for r in nr)), "Father's naust found by a plant's old quay (Ålesund, Fosnavåg, Laukvik, Vengsøy): the boat gets out from the naust she has after the move")
            # a moved place keeps its id (steder.json «was»): saves hold it as the boat's port, home and waypoints
            ids = await pg.evaluate("""() => ['sb262723_1571672', 'sb418023_1523092'].map(id => { const q = portById(id); return q ? [q.id, q.name, +q.p.x.toFixed(3), +q.p.y.toFixed(3)] : null; })""")
            print('kept ids:', ids)
            print(ok(all(ids) and abs(ids[0][2] - 258.152) < 0.05 and abs(ids[1][2] - 417.142) < 0.05), 'the moved shops in Vanse and Søndeled keep the ids saves hold, at their new quays')   # (Vanse moved again 4.6 km to a quay the 21 m coastal vessel gets out from, steg 126, d1c490c8)
            # a save whose harbour is gone (a place moved before its id was kept) starts at the nearest harbour, not with an error
            n0 = len(errs)
            await pg.evaluate("() => { TAB.held = false; const st = S.boat.status, pt = S.boat.port; S.boat.status = 'port'; S.boat.port = 'sb999999_999999'; save(); SAVE_OFF = true; S.boat.status = st; S.boat.port = pt; }")   # (only the save has the harbour that is gone: the page before the reload goes on drawing its own)
            await pg.reload()
            try:
                await pg.wait_for_function("typeof S !== 'undefined' && S.boat && typeof SIMREADY !== 'undefined' && SIMREADY === true", timeout=120000)
                g = await pg.evaluate("() => ({port:S.boat.port, known:!!portById(S.boat.port), st:S.boat.status})")
            except Exception as e: g = {'known': False, 'st': 'did not start: ' + str(e)[:80]}
            print('save with a harbour that is gone:', g, errs[n0:][:2])
            print(ok(g['known'] and g['st'] == 'port' and not errs[n0:]), 'a save whose harbour is gone starts at the nearest harbour, with no page error')
        print('errors:', errs[:4]); await br.close()
asyncio.run(main())
