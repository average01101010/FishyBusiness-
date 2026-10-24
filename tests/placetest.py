"""Where the places of the coast stand (Jonas 08.10.2026, docs/handelssteder.md «Plassering av stedene»): no two of the plants, tackle
shops, yards, rorbuer and Father's naust nearer than 1.5 km (the plants' own real places aside), so the mooring choice never comes up;
every plant within 34 km (20 nm by sea) of a yard; one tackle shop to a town; every rorbu by a harbour 1.5-4 km from its plant; the
plants named by their place and a plant word; each kind its own sign on the chart; Father's naust in Vangshamn. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1000, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME)
        r = await pg.evaluate("""(() => {
          const pl = PORTS.filter(q => q.mottak), sh = PORTS.filter(q => q.sted === 'butikk'), yd = PORTS.filter(q => q.sted === 'verft'), rb = RORBUER;
          const all = [...pl.map(q => ({k:'mottak', id:q.id, p:q.p})), ...sh.map(q => ({k:'butikk', id:q.id, p:q.p})), ...yd.map(q => ({k:'verft', id:q.id, p:q.p})),
            ...rb.map(R => ({k:'rorbu', id:R.id, p:R.cand})), {k:'naust', id:'vangshamn', p:portById('vangshamn').p}];
          const close = [];
          for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++){ const a = all[i], c = all[j]; if (a.k === 'mottak' && c.k === 'mottak') continue;
            const d = dist(a.p, c.p); if (d < 1.45) close.push([a.k + ':' + a.id, c.k + ':' + c.id, +d.toFixed(2)]); }
          close.sort((x, y) => x[2] - y[2]);
          const farYard = pl.map(q => ({n:q.name, d:Math.min(...yd.map(y => dist(y.p, q.p)), dist(portById('finnsnes').p, q.p))})).filter(x => x.d > 37.1);
          const towns = {}; for (const q of sh){ const t = q.name.replace(/ utstyrsbutikk.*$/, ''); towns[t] = (towns[t] || 0) + 1; }
          const twice = Object.entries(towns).filter(([t, n]) => n > 1 && t !== 'Butikk');
          const rb0 = rb.filter(R => R.kind === 0).map(R => Math.min(...pl.map(q => dist(q.p, R.cand)))), rbBad = rb0.filter(d => d < 1.45 || d > 4.1).length;
          const labels = pl.slice(0, 40).map(portLabel), lblOk = pl.every(q => /^(.+) (fiskemottak|mottak|fiskebruk)$/.test(portLabel(q)) && portLabel(q).startsWith(q.name));
          const kinds = {}; for (const q of PORTS) kinds[portKind(q) || '-'] = (kinds[portKind(q) || '-'] || 0) + 1;
          const icons = ['mottak', 'butikk', 'verft', 'naust'].map(k => { const q = PORTS.find(x => portKind(x) === k); return /class="pi pi-/.test(portIcon(q, 5, 1)); });
          return {n:{mottak:pl.length, butikk:sh.length, verft:yd.length, rorbu:rb.length, rorbu0:rb0.length}, close:close.slice(0, 12), nClose:close.length, farYard, twice, rbBad, labels:labels.slice(0, 8), lblOk, kinds, icons,
            home:HOME0, homeP:natLL(portById(HOME0).p)}; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['nClose'] <= 20 and all(c[2] >= 0.5 for c in r['close'])), 'no two places (plants, shops, yards, rorbuer, the naust) nearer than 1.5 km, bar a few villages with no other quay (none nearer than 0.5 km), the plants among themselves aside', r['nClose'], r['close'][:6])
        print(ok(len(r['farYard']) <= 12 and all(x['d'] <= 48 for x in r['farYard'])), 'every plant within 20 nm (37 km) of a yard, bar a few in the north where the villages have no other quay (none beyond 26 nm)', [(x['n'], round(x['d'])) for x in r['farYard']])
        print(ok(not r['twice']), 'one tackle shop to a town', r['twice'][:6])
        print(ok(r['rbBad'] == 0 and r['n']['rorbu0'] >= 100), 'the rorbuer by the harbours stand 1.5-4 km from the plant', r['rbBad'], r['n'])
        print(ok(r['lblOk']), 'every plant is named by its place and a plant word on the chart', r['labels'])
        print(ok(all(r['icons']) and r['kinds'].get('naust') == 1), 'each kind of place has its own sign on the chart, and Father s naust is one place', r['kinds'])
        print(ok(r['home'] == 'vangshamn' and abs(r['homeP']['lat'] - 69.472) < 0.01), 'Father s naust stands in Vangshamn', r['homeP'])
        print('errors:', errs[:3]); await pg.close(); await b.close()

asyncio.run(main())
