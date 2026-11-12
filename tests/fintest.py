"""The fine ground along the sea (Ø13 K1, the layer 'fin'): who fetches it. At the start (Finnsnes), with the 3D level chosen by hand:
  Low and Middle   no 'fin' pack is asked of the network and no fine block is unpacked (the phones' memory and start are untouched)
  High             the tile's pack comes, fine blocks are unpacked round the boat, nothing counts in MAPD.miss
  High, «#fin0»    as Low: nothing is asked for
It also prints what each level fetched of the map and holds in memory (the packs by kind, MAPD.bytes, the JS memory), for comparing a
build before and after: KYST_DIST=<dist> python3 tests/fintest.py. A build without the layer (before K1) prints the numbers and says so."""
from _env import BASE, SEED, boot
import asyncio, json, re
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
URL = BASE + 'index.html#ro0' + (',seed=' + SEED if SEED != '0' else '') + '#notut'   # (no «#qfix»: the level is the setting's)

async def one(p, lvl, extra=''):
    b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing', '--enable-precise-memory-info'])
    pg = await b.new_page(viewport={'width': 1280, 'height': 800})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    got = {}   # the map's files that came over the network, by kind: [files, bytes]
    async def seen(r):
        m = re.search(r'/map/([a-z0-9]+)-[^/]*\.wasm$', r.url)
        if m and r.ok:
            try: n = len(await r.body())
            except Exception: n = 0
            k = got.setdefault(m.group(1), [0, 0]); k[0] += 1; k[1] += n
    pg.on('response', lambda r: asyncio.ensure_future(seen(r)))
    # the level is chosen before the first second of 3D (the view draws behind the start screen on 'auto', and 'auto' asks for the
    # fine ground once it has held High for 30 s), and again after the start
    await pg.add_init_script("(() => { const iv = setInterval(() => { try { if (typeof S !== 'undefined' && S && S.settings){ S.settings.q3d = '%s'; } } catch (e){} }, 50); setTimeout(() => clearInterval(iv), 600000); })()" % lvl)
    await boot(pg, URL + extra)
    await pg.evaluate("(lvl) => { S.settings.q3d = lvl; if (!G3.isActive()) G3.show(true); }", lvl)
    await pg.wait_for_function("G3.isActive()", timeout=60000)
    try:
        await pg.wait_for_function("(() => { const D = G3._debug; return D.NEARM && !D.NEARM.stale && D.FINEM && !D.FINEM.stale; })()", timeout=240000)
        await pg.wait_for_timeout(15000)   # the fine pack is asked for within 2 s, comes, and the meshes are built again
        await pg.wait_for_function("(() => { const D = G3._debug; return D.NEARM && !D.NEARM.stale && D.FINEM && !D.FINEM.stale; })()", timeout=240000)
    except Exception as e:
        print('   (venter fortsatt:', lvl, str(e)[:80], ')')
    await pg.wait_for_timeout(5000)
    r = await pg.evaluate("""() => { const L = MAPD.L.fin; let nb = 0, by = 0; if (L) for (const [k, a] of MAPD.blk) if (k % 64 === L.id){ nb++; by += a.byteLength; }
      return {lag:!!L, lvl:G3._debug.qual ? G3._debug.qual() : null, finBlokker:nb, finMB:+(by / 1e6).toFixed(2), mapdMB:+(MAPD.bytes / 1e6).toFixed(1), jsMB:performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
        finPakker:[...MAPD.byTile.values()].filter(pk => pk.kind === 'fin' && pk.buf).length, miss:MAPD.miss, hentet:MAPD.fetched, views:MAPD.packs.filter(pk => pk.kind === 'view').length}; }""")
    r['nett'] = {k: [v[0], round(v[1] / 1e6, 2)] for k, v in sorted(got.items())}; r['nettMB'] = round(sum(v[1] for v in got.values()) / 1e6, 2); r['feil'] = errs[:3]
    await b.close(); return r

async def main():
    async with async_playwright() as p:
        R = {}
        for name, lvl, extra in (('lav', 'low', ''), ('middels', 'mid', ''), ('hoy', 'high', ''), ('hoy_fin0', 'high', '#fin0')):
            R[name] = r = await one(p, lvl, extra); print(name, json.dumps(r, ensure_ascii=False))
        if not R['hoy']['lag']: print('bygget har ikke laget fin (før K1): bare tallene over'); print('sidefeil:', sum((r['feil'] for r in R.values()), [])); return
        for name in ('lav', 'middels', 'hoy_fin0'):
            r = R[name]; print(ok('fin' not in r['nett'] and r['finPakker'] == 0 and r['finBlokker'] == 0), name + ': ingen fin-pakke hentet og ingen fin blokk pakket ut', r['nett'].get('fin'), r['finBlokker'])
        r = R['hoy']; print(ok('fin' in r['nett'] and r['finPakker'] >= 1 and r['finBlokker'] >= 1), 'hoy: fin-pakken kom, og fine blokker er pakket ut rundt båten', r['nett'].get('fin'), r['finBlokker'], 'blokker', r['finMB'], 'MB')
        # (the bound: nine in Senja's build, which has 4 view packs; 16 with the whole coast, where bridges, lakes, lights and the life
        # up to 25 km off read the ground through the layer too: 15 blocks, 19.2 MB, at Finnsnes on the test edition 12.11.2026, and
        # Jonas kept it so until K2 decides High or Ultra only, «A: Behold, K2 avgjør»; docs/planer/kartrelease-o13.md K1)
        lim = 9 if r['views'] <= 4 else 16
        print(ok(r['finBlokker'] <= lim), 'hoy: høyst %d fine blokker i minnet ved starten (%s)' % (lim, 'Senja-bygget' if lim == 9 else 'hele kysten'), r['finBlokker'], r['finMB'], 'MB')
        print(ok(all(x['miss'] == 0 for x in R.values())), 'ingen blokk telt som MAPD.miss', [x['miss'] for x in R.values()])
        same = lambda a, b: {k: v for k, v in a['nett'].items() if k != 'fin'} == {k: v for k, v in b['nett'].items() if k != 'fin'}
        print(ok(same(R['hoy'], R['hoy_fin0'])), 'hoy: de andre pakkene er de samme med og uten laget')
        print('sidefeil:', sum((r['feil'] for r in R.values()), []))

asyncio.run(main())
