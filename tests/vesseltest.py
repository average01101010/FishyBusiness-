"""The vessels (core/02-species-gear.js VESSELS): every type has the full spec, the numbers hang together, the rules read the fields
and not the type names, and equipment fits by size. Prints OK/FEIL lines."""
import asyncio, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def guard():
    """No code may branch on a vessel type name: `=== 'sjark'` and the like. The keys live in VESSELS and the data tables only."""
    src = open(os.path.join(ROOT, 'src/js/core/02-species-gear.js')).read()
    keys = re.findall(r"^  (\w+):\{name:", src[src.index('const VESSELS'):src.index('const BOAT')], re.M)
    hits = []
    for d in ('src/js/core', 'src/js/ui', 'src/js'):
        for f in sorted(os.listdir(os.path.join(ROOT, d))):
            if not f.endswith('.js'): continue
            for i, line in enumerate(open(os.path.join(ROOT, d, f)), 1):
                for k in keys:
                    if re.search(r"[!=]==\s*'" + k + r"'|'" + k + r"'\s*[!=]==", line): hits.append('%s/%s:%d' % (d, f, i))
    return keys, sorted(set(hits))


async def main():
    keys, hits = guard()
    print('types:', keys)
    print(ok(not hits), 'no code branches on a vessel type name', hits[:8])
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {bad:[]}, need = ['name', 'len', 'beam', 'draft', 'disp', 'holdCap', 'iceCap', 'fuelCap', 'hp', 'engine', 'vmax', 'vcruise', 'accel', 'turnR',
            'planing', 'outboard', 'diesel', 'fuelK', 'risk', 'sea', 'crewMax', 'berths', 'tubCap', 'land', 'std', 'rigs', 'jukseMax', 'gearMax', 'svcH', 'svcCost', 'svcJobH', 'cls', 'price', 'year', 'desc'];
          for (const [k, V] of Object.entries(VESSELS)){
            for (const f of need) if (V[f] == null) R.bad.push(k + ': mangler ' + f);
            // fullness: displacement over length overall × beam × greatest draft × sea water. With the overall figures (not the waterline
            // ones) small boats come out at 0.1–0.3 and big full hulls up to 0.6
            const cb = V.disp / (V.len * V.beam * V.draft * 1.025);
            if (!(cb > 0.1 && cb < 0.6)) R.bad.push(k + ': blokkoeffisient ' + cb.toFixed(2));
            if (!(V.draft < 0.6 * V.beam)) R.bad.push(k + ': dypgående mot bredde');
            if (!(V.beam < V.len / 1.8)) R.bad.push(k + ': bredde mot lengde');
            if (!(V.vcruise <= V.vmax)) R.bad.push(k + ': marsjfart over toppfart');
            if (!(V.holdCap < V.disp * 1000)) R.bad.push(k + ': last over vekten');
            if (!['box', 'tub'].includes(V.land)) R.bad.push(k + ': land');
            if (V.cls !== 'hav' && BEAM[k] !== V.beam) R.bad.push(k + ': BEAM');
          }
          // equipment fits by size: the small electric hauler on small boats, hydraulic haulers and sonar on bigger ones, the 90 hp outboard on outboard boats
          R.fit = Object.fromEntries(Object.keys(VESSELS).map(k => [k, Object.keys(EQUIP).filter(q => equipFits(q, k)).join(',')]));
          // the 90 hp outboard boosts only a boat with an outboard
          const b = S.boat, t0 = b.type; b.type = 'skiff'; S.equip.motor90 = true; applyVessel(); R.boost = [BOAT.vmax, BOAT.fuelK]; S.equip.motor90 = false; applyVessel(); R.plain = [BOAT.vmax, BOAT.fuelK];
          b.type = t0; applyVessel();
          // the old type table values are kept for the four first types
          R.same = ['skiff', 'snekke', 'sjark', 'sjarkny'].map(k => [k, VESSELS[k].tubCap, VESSELS[k].land, VESSELS[k].svcJobH, VESSELS[k].accel]);
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(not r['bad']), 'every vessel type has the full spec and the numbers hang together', r['bad'][:6])
        f = r['fit']
        print(ok('elhaler' in f['skiff'] and 'elhaler' in f['snekke'] and 'elhaler' not in f['sjark'] and 'garnhaler' not in f['skiff'] and 'garnhaler' in f['snekke']
                 and 'sonar' in f['sjark'] and 'sonar' not in f['snekke'] and 'motor90' in f['skiff'] and 'motor90' not in f['snekke']), 'equipment fits by size and engine')
        print(ok(r['boost'] == [30, 1.35] and r['plain'] == [24, 1]), 'the 90 hp outboard gives the skiff 30 kn and a thirstier engine')
        print(ok(r['same'] == [['skiff', 60, 'box', 3, 10], ['snekke', 150, 'box', 5, 3], ['sjark', 300, 'tub', 8, 3], ['sjarkny', 400, 'tub', 10, 10]]), 'the old type tables (tub, landing, yard hours, acceleration) are now fields with the same values')
        # the ladder: prices rise with what you get, the closed-group offers sit on the right boats, the ocean fleet is locked, big boats keep out of the fjords
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat;
          R.ladder = Object.entries(VESSELS).map(([k, V]) => [k, V.len, V.cls, !!V.lock]);
          R.offers = LIC_OFFERS.map(O => [O.id, O.ves, VESSELS[O.ves].len, Math.round((VESSELS[O.ves].price + licValue(O)) / 1000)]);
          // the 8.9 m sjark is in the open group's 8–9.99 m quota group: 5.6 t of cod
          const t0 = b.type; b.type = 'jukesjark'; applyVessel(); R.jukGroup = [lenGroup(), codLimits().max]; b.type = 'kyst21'; applyVessel();
          const inside = GROUNDS.find(g => insideFjord(g.p) && depthF(g.p) > 20).p; b.status = 'fishing'; b.port = null; b.pos = {...inside}; b.gop = null; b.rig = 'juksa'; b.gear = true; b.fishUntil = S.t + 120; S.hold = []; S.crew = [];
          for (let i = 0; i < 60; i++) step(); R.fjord = {kg:Math.round(holdTotal()), warn:S.log.slice(-40).some(e => /fjordlinja/.test(e.no))};
          b.type = t0; applyVessel(); b.status = 'idle'; return R; })()""")
        print('ladder:', json.dumps(r, ensure_ascii=False))
        lens = [x[1] for x in r['ladder'] if x[2] != 'hav']
        print(ok(len(r['ladder']) >= 14 and all(x[3] for x in r['ladder'] if x[2] == 'hav') and not any(x[3] for x in r['ladder'] if x[2] != 'hav')), 'the ladder runs from the open boat to the ocean fleet, and only the ocean fleet is locked')
        print(ok([o[0] for o in r['offers']] == ['u7', 'h7', 'h8', 'h9', 'h10'] and r['offers'][0][3] < r['offers'][-1][3]), 'five closed-group offers by quota length, the cheapest the smallest')
        print(ok(r['jukGroup'][0] == 1 and r['jukGroup'][1] == 5600), 'the 8.9 m sjark fishes in the open group 8–9.99 m with 5.6 t of cod')
        print(ok(r['fjord']['kg'] == 0 and r['fjord']['warn']), 'a 21 m vessel may not jig inside the fjord line')
        # the market: tabs, cards with a side view, the spec sheet, the ocean fleet locked, one open-group boat, in landscape and portrait
        for vw, vh, tag in ((1100, 800, 'liggende'), (800, 1180, 'staende')):
            await pg.set_viewport_size({'width':vw, 'height':vh})
            u = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.fleet = [S.fleet[0]]; bindVessel(S.fleet[0]); b.type = 'skiff'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.order = null; S.cash = 3e5;
              S.sales = S.sales.length >= 3 ? S.sales : [{t:0, total:1}, {t:0, total:1}, {t:0, total:1}];
              const dr = () => document.getElementById('drawerBody'), tap = sel => { const e = dr().querySelector(sel); if (e) e.click(); return !!e; };
              DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])');
              const cards = t => { tap('[data-pa=mktab][data-s=' + t + ']'); return [...dr().querySelectorAll('.vcard')].map(c => [c.dataset.k, c.dataset.o || '', !!c.querySelector('svg polygon')]); };
              R.tabs = {open:cards('open'), lic:cards('lic'), kyst:cards('kyst'), hav:cards('hav')};
              // the sheet of an ocean vessel: every section, and no buy button
              tap('[data-pa=mksel][data-k=bunntral]'); const sh = dr().querySelector('.vsheet'); R.havSecs = [...sh.querySelectorAll('.vsec h5')].map(e => e.textContent); R.havBuy = !!sh.querySelector('[data-pa=buy]'); R.havText = sh.textContent.includes('Bredde') && sh.textContent.includes('Dypgående') && sh.textContent.includes('Vekt');
              tap('[data-pa=mksel]:not([data-k])');
              // an open-group boat: trade-in only before the company owns a closed-group vessel
              tap('[data-pa=mktab][data-s=open]'); tap('[data-pa=mksel][data-k=jukesjark]'); R.fleetBtn = !!dr().querySelector('[data-pa=buy][data-ti="0"]'); R.tiBtn = dr().querySelector('[data-pa=buy][data-ti="1"]'); R.tiOk = !!R.tiBtn && !R.tiBtn.disabled; R.tiBtn = !!R.tiBtn;
              R.small = [...dr().querySelectorAll('button')].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43).map(e => e.textContent.slice(0, 24)); R.overflow = dr().scrollWidth > dr().clientWidth + 1;
              tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=lic]'); tap('[data-pa=mksel][data-k=trebat][data-o=u7]'); R.licSecs = [...dr().querySelectorAll('.vsheet .vsec h5')].map(e => e.textContent);
              R.licBtns = [...dr().querySelectorAll('[data-pa=buylic]')].length;
              return R; })()""")
            await pg.screenshot(path=os.path.join(ROOT, 'tests', 'out', 'market_' + tag + '.png'))
            print(tag, json.dumps(u, ensure_ascii=False)[:900])
            t = u['tabs']
            print(ok(len(t['open']) == 8 and len(t['lic']) == 5 and len(t['kyst']) == 2 and len(t['hav']) == 4 and all(c[2] for v in t.values() for c in v)), tag + ': four tabs with every boat as a card with its side view')
            print(ok(u['havText'] and not u['havBuy'] and len(u['havSecs']) >= 3), tag + ': the ocean vessel has a full spec sheet (length, beam, draft, weight) and no buy button')
            print(ok(u['tiBtn'] and u['tiOk'] and not u['fleetBtn']), tag + ': an open-group boat is bought by trading in, not for the fleet, before the company has a closed-group vessel')
            print(ok('Hjemmel' in u['licSecs'] and u['licBtns'] == 2), tag + ': a boat with a right shows the right and both ways to buy')
            print(ok(not u['overflow'] and not u['small']), tag + ': no sideways scroll and every button at least 44 px', u['small'][:4])
            await pg.evaluate("DOCK.close()")
        # trading the skiff in for the 8.9 m sjark
        r = await pg.evaluate("""(()=>{ S.cash = 9e5; const c0 = S.cash; DOCK.open('fartoy'); const dr = document.getElementById('drawerBody'); const back = dr.querySelector('[data-pa=mksel]:not([data-k])'); if (back) back.click(); dr.querySelector('[data-pa=mktab][data-s=open]').click(); dr.querySelector('[data-pa=mksel][data-k=jukesjark]').click();
          dr.querySelector('[data-pa=buy][data-ti="1"]').click(); const R = {type:S.boat.type, paid:Math.round(c0 - S.cash), fleet:S.fleet.length, open:openVesselId() === S.cur}; DOCK.close(); return R; })()""")
        print('trade-in:', json.dumps(r))
        print(ok(r['type'] == 'jukesjark' and r['paid'] == 750000 - 66500 and r['fleet'] == 1 and r['open']), 'trading the skiff in for the 8.9 m sjark costs the price less the trade-in, and she takes the open-group place')
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
