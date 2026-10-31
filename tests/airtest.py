from _env import GAME, boot
# Aircraft over the coast (plan E4, 05.10.2026): the timetable (each route a few times a day each way between 06 and 22), the profile
# (on the ground at both ends, cruising between, climbing out and coming in on about 3 degrees), the places on the line, and the models
# from tools/air/fly.py.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width':900, 'height':900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(() => {
          const R = {}, L = airLegs(), d = 900, tos = P(...AIRFIELDS.ENTC), sen = P(69.35, 17.6);
          R.legs = L.length; R.kinds = [L.filter(l => l.kind === 'plane').length, L.filter(l => l.kind === 'heli').length];
          // a day of departures: the counts, and all of them between 06 and 22
          const deps = L.map(l => airDeps(l, d)); R.perLeg = deps.every((ds, i) => ds.length === L[i].n); R.window = deps.flat().every(h => h - d * 24 >= 6 && h - d * 24 <= 22);
          // the profile of one flight Tromsø–Bodø: low at the ends, cruising between, and on the line
          const l = L.find(x => x.kind === 'plane' && dist(x.a, tos) < 1 && dist(x.b, P(...AIRFIELDS.ENBO)) < 1), dep = airDeps(l, d)[0];
          const at = u => airStates(dep + u * l.dur, {x:l.a.x + (l.b.x - l.a.x) * u, y:l.a.y + (l.b.y - l.a.y) * u}, 1).find(a => a.kind === 'plane' && Math.abs(a.hd - l.hd) < 1e-6);
          const prof = [0.002, 0.05, 0.5, 0.95, 0.998].map(u => { const a = at(u); return a ? {alt:Math.round(a.alt), pitch:+a.pitch.toFixed(3)} : null; });
          R.prof = prof; R.cruise = Math.round(l.alt); R.durMin = Math.round(l.dur * 60); R.km = Math.round(l.d);
          // over a day near Tromsø and over Senja: how many pass within 15 km, and none in the night
          const count = (p0, h0, h1) => { const ids = new Set(); for (let h = h0; h < h1; h += 1 / 60) for (const a of airStates(h, p0, 15)) ids.add(a.kind + a.id); return ids.size; };
          R.tos = count(tos, d * 24, d * 24 + 24); R.senja = count(sen, d * 24, d * 24 + 24); R.night = count(tos, d * 24 + 0.5, d * 24 + 5.5);
          R.same = JSON.stringify(airStates(d * 24 + 12.3, tos, 15)) === JSON.stringify(airStates(d * 24 + 12.3, tos, 15));
          // the models
          const bb = nm => { const o = glbPart('air', nm); if (!o) return null; const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; for (let i = 0; i < o.p.length; i += 3) for (let k = 0; k < 3; k++){ lo[k] = Math.min(lo[k], o.p[i + k]); hi[k] = Math.max(hi[k], o.p[i + k]); } return [0, 1, 2].map(k => +(hi[k] - lo[k]).toFixed(1)); };
          R.models = {plane:bb('plane'), prop:bb('prop'), heli:bb('heli'), rotor:bb('rotor'), trotor:bb('trotor')};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['legs'] == 2 * 53 and r['perLeg'] and r['window']), 'every route both ways, its flights a day, all between 06 and 22', r['legs'], r['kinds'])
        pr = r['prof']
        print(ok(all(pr) and pr[0]['alt'] <= 60 and pr[-1]['alt'] <= 60 and pr[2]['alt'] == r['cruise'] and pr[1]['pitch'] > 0 and pr[3]['pitch'] < 0 and pr[2]['pitch'] == 0),
              'Tromsø–Bodø: low at both ends, climbing out, cruising at %d m, coming in' % r['cruise'], pr, r['km'], 'km', r['durMin'], 'min')
        print(ok(r['tos'] >= 20 and r['senja'] >= 2 and r['night'] == 0 and r['same']), 'many pass Tromsø in a day, some over Senja, none at night, and the same each time', r['tos'], r['senja'], r['night'])
        m = r['models']
        print(ok(m['plane'] and 24 <= m['plane'][0] <= 27 and 21 <= m['plane'][2] <= 24 and 2.6 <= m['prop'][0] <= 4.2 and 12 <= m['rotor'][0] <= 14.5 and 2.4 <= m['trotor'][1] <= 3.0),
              'the turboprop 26 m across and 22 m long with 4 m propellers, the helicopter with a 14 m rotor', m)
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
