"""The three places of trade (Jonas 07.10.2026; core/06c-steder.js, data/steder.json, tools/steder/steder.py): the tackle shops and the yards
along the coast are harbours of their own, with a quay, a unit and a name that is only their town; what each offers (portServices) decides
the dock's buttons and where things can be bought. Checks: the places exist, unique, with quays and no firm's name; coverage (no plant far
from a yard or a shop); services per kind; the dock's buttons at a plant, a shop, a yard, Finnsnes and the naust; fuel at the yard but not at
the shop; gear only in the shop, bait and ice only at the plant; the nearest place helper. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:420]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME); await pg.wait_for_timeout(600)
        J = lambda js: pg.evaluate("JSON.stringify(" + js + ")")
        a = json.loads(await J("""(() => { const S_ = PORTS.filter(q => q.sted && q.coastal), ids = new Set(PORTS.map(q => q.id));
          return {n:S_.length, shops:S_.filter(q => q.sted === 'butikk').length, yards:S_.filter(q => q.sted === 'verft').length, unique:ids.size === PORTS.length,
            faces:S_.every(q => !!COASTQ[q.id] && !!UNITS[q.id]), names:S_.every(q => /(verft|utstyrsbutikk)/.test(q.name)),
            bad:S_.filter(q => /\\b(AS|ASA|Sjømat|Seafood|Fiskeindustri)\\b/i.test(q.name)).map(q => q.name), sample:S_.slice(0, 3).map(q => q.name)}; })()"""))
        check(a['n'] >= 180 and a['shops'] >= 55 and a['yards'] >= 100 and a['unique'] and a['faces'] and a['names'] and not a['bad'], 'the shops and the yards are harbours with a quay, a unit and a name of their town, and no firm\'s name', a)
        # coverage: no plant of the game is far from a yard or a shop
        c = json.loads(await J("""(() => { const pl = PORTS.filter(q => q.mottak), far = k => Math.max(...pl.map(q => placesNear(q.p, k, 1)[0].d)) / NM;
          return {plants:pl.length, yard:Math.round(far('verft')), shop:Math.round(far('butikk')), plant:Math.round(Math.max(...PORTS.filter(q => q.mottak).map(q => placesNear(q.p, 'mottak', 2)[1].d)) / NM)}; })()"""))
        check(c['plants'] >= 150 and c['yard'] <= 26 and c['shop'] <= 36, 'no plant is more than 26 nm from a yard or 36 nm from a shop (the far ones are in the Finnmark fjords, where the villages have no other quay 1.5 km from the plant)', c)
        # services per kind
        s = json.loads(await J("""(() => { const sv = id => portServices(portById(id), 'main'), y = PORTS.find(q => q.sted === 'verft'), b = PORTS.find(q => q.sted === 'butikk');
          return {plant:sv('botnhamn'), finnsnes:sv('finnsnes'), yard:portServices(y, 'main'), shop:portServices(b, 'main'), naust:portServices(portById('botnhamn'), 'naust'), yardFuel:y.fuel, shopFuel:b.fuel, plantIce:portById('botnhamn').ice}; })()"""))
        check(s['plant'] == {'mottak': True, 'butikk': False, 'verft': False, 'bunker': True} and s['finnsnes']['butikk'] and s['finnsnes']['verft'] and not s['finnsnes']['mottak'], 'a plant takes the catch and sells fuel, Finnsnes is the shop and the boat hall', [s['plant'], s['finnsnes']])
        check(s['yard']['verft'] and s['yard']['bunker'] and s['yardFuel'] and s['shop']['butikk'] and not s['shop']['bunker'] and not s['shopFuel'] and s['naust'] == {}, 'a yard has fuel, a shop has none, the naust has nothing', s)
        # the dock's buttons at each place
        d = json.loads(await J("""(() => { const out = {}, b = S.boat; S.tut = 0; b.status = 'port';
          for (const [k, id] of [['plant', 'botnhamn'], ['yard', PORTS.find(q => q.sted === 'verft').id], ['shop', PORTS.find(q => q.sted === 'butikk').id], ['finnsnes', 'finnsnes']]){
            const q = portById(id); b.port = id; b.pos = {x:q.p.x, y:q.p.y}; b.berth = 'main'; DOCK.render(); out[k] = DOCK.items().map(x => x.id); }
          return out; })()"""))
        check(d['plant'] == ['marked', 'bygd', 'beh'] and d['yard'] == ['bygd', 'verft', 'beh'] and d['shop'] == ['butikk', 'bygd', 'beh'] and d['finnsnes'] == ['butikk', 'bygd', 'verft', 'beh'], 'the dock shows Mottak, Butikk and Verft only where they are, and Bygd everywhere', d)
        # the quay of a yard works: a berth, and the fuel
        f = json.loads(await J("""(() => { const y = PORTS.find(q => q.sted === 'verft'), b = S.boat; b.port = y.id; b.status = 'port'; b.berth = 'main'; b.fuel = 5; S.cash = 50000;
          const face = quayFace(y.id, 'main'), bp = berthPose(y.id, b.type || 'skiff', 'main'), bunker = hasBunker(y.id); const ok = startFueling(false);
          return {face:!!face, berth:!!bp, bunker, ok, state:!!b.fueling || !!b.shift}; })()"""))
        check(f['face'] and f['berth'] and f['bunker'] and f['ok'] and f['state'], 'a yard has a quay and a berth, and the boat fills fuel there', f)
        # what is bought where
        g = json.loads(await J("""(() => { const b = S.boat, sh = PORTS.find(q => q.sted === 'butikk'), pl = portById('botnhamn'), y = PORTS.find(q => q.sted === 'verft'); S.equip.garnhaler = true; S.pgear.lines.hyse.n = Math.max(S.pgear.lines.hyse.n, 1); b.status = 'port'; b.berth = 'main'; b.fueling = null; b.shift = null; b.gear = false; S.cash = 100000; S.pgear = S.pgear || newPGear();
          const at = q => { b.port = q.id; b.pos = {x:q.p.x, y:q.p.y}; };
          at(pl); const plantGear = buyGear('net', 156, 1), plantJig = shopBuy('jig', 0, false), plantIce = shopBuy('ice', 50, false), plantBait = buyGear('bait', 'makrell', 10);
          at(sh); const shopGear = buyGear('net', 156, 1), shopJig = shopBuy('jig', 0, false), shopIce = shopBuy('ice', 50, false), shopBait = buyGear('bait', 'makrell', 10);
          at(y); const yardJig = shopBuy('jig', 0, false), yardGear = buyGear('net', 156, 1);
          return {plantGear:!!plantGear, plantJig:!!plantJig, plantIce:!!plantIce, plantBait:!!plantBait, shopGear:!!shopGear, shopJig:!!shopJig, shopIce:!!shopIce, shopBait:!!shopBait, yardJig:!!yardJig, yardGear:!!yardGear}; })()"""))
        check(g == {'plantGear': True, 'plantJig': True, 'plantIce': False, 'plantBait': False, 'shopGear': False, 'shopJig': False, 'shopIce': True, 'shopBait': True, 'yardJig': True, 'yardGear': True}, 'gear and the jig only in the shop; ice and bait only at the plant (true = refused)', g)
        # the nearest place of a kind, from the boat
        n = json.loads(await J("""(() => { S.boat.pos = {...portById('botnhamn').p}; const y = placesNear(S.boat.pos, 'verft', 3), b = placesNear(S.boat.pos, 'butikk', 3), m = placesNear(S.boat.pos, 'mottak', 3);
          return {y:y.map(x => [x.pt.name, Math.round(x.d / NM)]), b:b.map(x => [x.pt.name, Math.round(x.d / NM)]), m:m.map(x => x.pt.name), sorted:y[0].d <= y[1].d && b[0].d <= b[1].d}; })()"""))
        check(n['sorted'] and len(n['y']) == 3 and len(n['b']) == 3 and n['m'][0] == 'Botnhamn', 'the nearest yards, shops and plants from the boat, nearest first', n)
        # the yard's unit is the big one, so that the biggest vessel (the pelagic seiner: 75 m, 15.5 m abeam, 7.5 m draught) lies on its lift: a face of
        # 120 m, the main berth long enough for her, and water under her keel at the lowest tide all along her and at the bunker berth too
        y2 = json.loads(await J("""(() => { const y = PORTS.find(q => q.sted === 'verft'), U = UNITS[y.id], g = ugeo(U), V = VESSELS.pelagisk, sh = PORTS.find(q => q.sted === 'butikk'), gs = ugeo(UNITS[sh.id]);
          const at = kind => { const bp = berthPose(y.id, 'pelagisk', kind), [lx, lz] = unitL(U, bp.x * 1000, bp.y * 1000); let minD = 1e9, ends = [];
            for (let s = -V.len / 2; s <= V.len / 2 + 0.1; s += 5) for (const o of [0.1, 0.5, 0.9]){ const w = unitW(U, lx + s, Math.max(1, lz - V.beam / 2 + V.beam * o)); minD = Math.min(minD, unitDredge({x:w[0] / 1000, y:w[1] / 1000}, 0) - 1.55); }
            return {lx:Math.round(lx), lz:+lz.toFixed(1), bow:Math.round(Math.abs(lx) + V.len / 2), minD:+minD.toFixed(1)}; };
          return {big:U.y === true, E:g.E, B:g.B, shopE:gs.E, hl:quayFace(y.id, 'main').hl, depth:quayFace(y.id, 'main').depth, main:at('main'), bunker:at('bunker'), draft:V.draft, beam:BEAM.pelagisk, fill:U.f.slice(0, 2)}; })()"""))
        check(y2['big'] and y2['E'] == 60 and y2['B'] == 34 and y2['shopE'] == 27.4 and y2['hl'] == 45 and y2['depth'] == 34 and y2['beam'] == 15.5 and y2['main']['bow'] <= 60 and y2['main']['lz'] > 8 and y2['main']['minD'] >= y2['draft'] + 3.0 and y2['bunker']['minD'] >= y2['draft'] + 1,
              'the yard has the big unit (a 120 m face, 34 m deep) and the shop the plants\' one; the 75 m vessel lies on the main berth within the face, a beam out, with a lift\'s depth under her at the lowest tide, and at the bunker berth with her draught clear', y2)
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
