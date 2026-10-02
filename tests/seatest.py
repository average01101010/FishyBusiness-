from _env import GAME, boot
# The sea (03b-sea.js): fetch up-wind over open water, so the lee is calm and the open sea is not; exposure() (fish and depth) unchanged.
# The wind sea grows with the fetch to WMO's height for the open sea, the swell comes from the ocean, and the wind veers as the lows pass.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
EXPO_SUM = 19066.9774   # exposure() summed over a grid before the sea model: fish and depth use it, so it must not move (but for the
# resampling into the national frame in phase K4 of the coast plan, which moved it by 0.007 %)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{
          const R = {}, D = [0, 45, 90, 135, 180, 225, 270, 315], r1 = v => Math.round(v * 10) / 10;
          let s = 0; for (let x = 0.2; x < 78; x += 0.37) for (let y = 0.2; y < 82; y += 0.41) s += exposure(LG(x, y)); R.expo = Math.round(s * 1e4) / 1e4;
          R.rose = {}; for (const g of GROUNDS) R.rose[g.name.no] = D.map(d => r1(fetchAt(g.p, d)));
          for (const q of PORTS) R.rose[q.id] = D.map(d => r1(fetchAt(q.p, d)));
          // smooth: the cached field over a full turn in 1 degree steps, and against fetchAt
          // (the root of the fetch, which the wind sea goes as, steps no more per degree than a tenth of the step between two 10 degree sectors)
          const g0 = GROUNDS[0].p, rf = d => Math.sqrt(fetchField(g0, d)); let jump = 0, prev = rf(0), dev = 0, sec = 0;
          for (let k = 0; k < 36; k++) sec = Math.max(sec, Math.abs(rf((k + 1) * 10) - rf(k * 10)));
          for (let d = 1; d <= 360; d++){ const v = rf(d); jump = Math.max(jump, Math.abs(v - prev)); prev = v; }
          // (the field blends neighbouring sectors, so it is held to the rays within ±10 degrees, as a real wind wanders)
          for (const g of GROUNDS) for (let d = 0; d < 360; d += 15){ const a = [-10, -5, 0, 5, 10].map(e => Math.sqrt(Math.max(1, fetchAt(g.p, d + e)))), f = Math.sqrt(Math.max(1, fetchField(g.p, d)));
            dev = Math.max(dev, f / Math.max(...a) - 1, Math.min(...a) / f - 1); }
          R.jump = r1(jump / (sec / 10)); R.dev = r1(dev * 100);
          let t0 = performance.now(); for (let i = 0; i < 2000; i++) fetchAt(LG(Math.random() * 78, Math.random() * 82), Math.random() * 360); R.usRay = r1((performance.now() - t0) / 2000 * 1000);
          t0 = performance.now(); for (let i = 0; i < 10000; i++) fetchField(LG(40 + Math.random(), 10 + Math.random()), 200 + Math.random() * 20); R.usWarm0 = r1((performance.now() - t0) / 10000 * 1000);
          t0 = performance.now(); for (let i = 0; i < 10000; i++) fetchField(LG(40 + Math.random(), 10 + Math.random()), 200 + Math.random() * 20); R.usWarm = r1((performance.now() - t0) / 10000 * 1000);
          // the wind is the same as before the sea model (only its direction turns with the lows)
          let ws = 0; for (let h = 0; h < 8760 * 2; h += 0.7) ws += windAt(h); R.windSum = Math.round(ws * 1000) / 1000;
          // a low veers the wind clockwise as it passes: from south ahead of it towards north-west behind
          const H0 = (Date.UTC(2028, 0, 1) - EPOCH) / 3.6e6, seen = new Set(), turns = [];
          for (let h = 0; h < 8760; h += 12) for (const st of stormsNear(H0 + h)){ if (st.amp < 10 || seen.has(st.c)) continue; seen.add(st.c);
            const a = windDir(st.c - 0.8 * st.w), b = windDir(st.c + 0.8 * st.w); turns.push(((b - a + 540) % 360) - 180); }
          R.veer = {n:turns.length, cw:turns.filter(t => t > 30).length, mean:Math.round(turns.reduce((x, y) => x + y, 0) / turns.length)};
          // open sea: the wind sea on a long fetch is WMO's probable height at the middle of each force
          R.wmo = [[4.4, 0.6], [6.7, 1], [9.35, 2], [12.3, 3], [15.5, 4], [18.95, 5.5], [22.6, 7], [26.45, 9]].map(([u, h]) => Math.round(hsWind(u, 600) / h * 100) / 100);
          // lee and windward at 11 m/s: the open grounds with the wind from the north, then from the south (behind Senja)
          const at = (p, d) => { WX_FORCE = {w:11, d}; const v = hsParts(p, S.t / 60); WX_FORCE = null; return {w:r1(v.w * 10) / 10, sw:r1(v.sw * 10) / 10, F:r1(v.F), tp:r1(v.tp)}; };
          R.lee = {}; for (const g of GROUNDS.slice(0, 3)) R.lee[g.name.no] = {N:at(g.p, 0), S:at(g.p, 180)};
          const kn = P(69 + 30.7 / 60, 17 + 54.9 / 60); R.knekk = {N:at(kn, 0), S:at(kn, 180)};
          // smooth from the harbour out to the open sea (Husøy to the ground north of it, 100 m steps), and over a full turn of the wind
          const q = portById('husoy').p, gp = GROUNDS[0].p; let line = [], pl = null, step = 0;
          WX_FORCE = {w:11, d:330}; for (let i = 0; i <= 120; i++){ const t = i / 120, p = {x:q.x + (gp.x - q.x) * t, y:q.y + (gp.y - q.y) * t}; if (isLand(p)) { pl = null; continue; } const v = hsAt(p, S.t / 60); if (pl != null) step = Math.max(step, Math.abs(v - pl)); pl = v; if (i % 12 === 0) line.push(r1(v * 10) / 10); }
          R.line = line; R.lineStep = Math.round(step * 100) / 100;
          let turn = 0, pv = null; for (let d = 0; d <= 360; d += 2){ WX_FORCE = {w:11, d}; const v = hsAt(gp, S.t / 60); if (pv != null) turn = Math.max(turn, Math.abs(v - pv)); pv = v; } WX_FORCE = null; R.turnStep = Math.round(turn * 100) / 100;
          // what it costs: a sailing boat's hsAt (new position every call) and the same spot again
          let t1 = performance.now(); for (let i = 0; i < 20000; i++) hsAt(LG(40 + i * 0.0002, 10 + i * 0.0001), S.t / 60 + i / 60); R.usHs = r1((performance.now() - t1) / 20000 * 1000);
          const pp = LG(41, 11); t1 = performance.now(); for (let i = 0; i < 20000; i++) hsAt(pp, S.t / 60); R.usHsSame = Math.round((performance.now() - t1) / 20000 * 1000 * 100) / 100;
          // the sea state by height (Douglas), krapp in the lee's young sea, and the texts in the Vær panel and the phone
          R.codes = [0.02, 0.07, 0.3, 1, 2, 3, 5, 7, 10, 15].map(seaState);
          const g1 = GROUNDS[0].p; WX_FORCE = {w:11, d:180}; R.krappLee = seaHere(g1, S.t / 60).krapp; WX_FORCE = {w:11, d:0}; R.krappOpen = seaHere(g1, S.t / 60).krapp;
          S.boat.pos = {...g1}; S.boat.status = 'idle'; S.boat.port = null; const pw = panelWx(); R.panel = /Sjøgang her/.test(pw) && pw.includes(BFS.no[beaufort(11)].replace(/^./, c => c.toLowerCase())) && /Vindsjø · dønning/.test(pw);
          PHONE.open('vaer'); const ph = document.getElementById('phView').textContent; R.phone = /Vindsjø/.test(ph) && /Dønning/.test(ph) && ph.includes(BFS.no[beaufort(11)]);
          WX_FORCE = null; R.texts = [BFS.no.length, BFS.en.length, SEAN.no.length, SEAN.en.length];
          return R; })()""")
        await pg.screenshot(path='seatest_phone.png'); await pg.evaluate("PHONE.show(false)")
        for k, v in r['rose'].items(): print('  ', k.ljust(22), v)
        print(json.dumps({k: v for k, v in r.items() if k != 'rose'}))
        R = r['rose']
        print(ok(abs(r['expo'] - EXPO_SUM) < 2e-4 * EXPO_SUM), 'exposure() is unchanged (within 0.02 %, the resampling into the national frame), so the fish and the depths are too')
        print(ok(all(min(R[g][0], R[g][7]) > 200 and R[g][4] < 30 for g in ['Havet nord for Husøy', 'Utenfor Mefjorden', 'Vest av Gryllefjord'])), 'the outer grounds have the open sea to the north and north-west and the land in the lee to the south')
        print(ok(all(max(R[q]) < 5 for q in ['husoy', 'senjahopen', 'sommaroy', 'botnhamn'])), 'the harbours have under 5 km of fetch from every side')
        print(ok(all(max(R[g]) < 15 for g in ['Gisundet nord', 'Solbergfjorden', 'Malangsgapet'])), 'the fjord grounds have short fetches')
        print(ok(r['jump'] <= 1.05 and r['dev'] < 15), 'the cached field turns smoothly with the wind, and its wave height is within 15 % of what the rays give within 10 degrees at the grounds')
        L = r['lee']
        print(ok(abs(r['windSum'] - 192722.469) < 1e-2), 'the wind speed is the same as before the sea model')
        print(ok(r['veer']['n'] >= 5 and r['veer']['cw'] >= 0.7 * r['veer']['n']), 'the wind veers clockwise as a low passes (most lows over 10 m/s in 2028)')
        print(ok(all(0.95 <= v <= 1.05 for v in r['wmo'])), 'the wind sea on the open sea is WMO\'s probable height for each Beaufort force')
        print(ok(all(L[g]['N']['w'] > 2.2 and L[g]['S']['w'] < 0.8 * L[g]['N']['w'] for g in L)), 'at 11 m/s the outer grounds have a full wind sea from the north and less in the lee of Senja from the south')
        print(ok(r['knekk']['S']['w'] < 0.4 and r['knekk']['N']['w'] < 1.0), 'outside Botnhamn (the knekk spot) the sea is short both ways: the fjord is narrow (fishing there needs its own rule)')
        print(ok(r['line'][0] < 0.3 and min(r['line'][1:]) > 2.2 and r['turnStep'] < 0.25), 'NNW 11 m/s: calm inside Husøy harbour, the full sea just outside its mouth (the land ends there), and smooth as the wind turns')
        print(json.dumps({k: r[k] for k in ['codes', 'krappLee', 'krappOpen', 'panel', 'phone', 'texts']}))
        print(ok(r['codes'] == [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 'the sea state follows the Douglas scale (havblikk to ekstremt opprørt hav)')
        print(ok(r['krappLee'] and not r['krappOpen']), 'the short young sea in the lee is krapp, the grown open sea is not')
        print(ok(r['panel'] and r['phone'] and r['texts'] == [13, 13, 10, 10]), 'the Vær panel and the weather app show the sea state, wind sea and swell, and what the sea looks like at this force')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
