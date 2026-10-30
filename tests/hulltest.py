"""Fysikk 3 (core/16c-hull.js): what the blows and the groundings do to the hull, the leak and the bilge pump, the water aboard, the
rescue when the engine room is full, the yard's repair, and the hull insurance (kasko). Jonas 18.10.2026: «kollisjoner og grunnstøting
skal få konsekvens, laget bra og intuitivt».
1. Blows by speed: under 1 knot nothing, 1-3 knots scratches only, from 3 knots damage, a hard blow a leak the pump keeps up with, a
   harder one more than it takes; wood takes more than steel.
2. The leak at sea: the water rises, the log and the alarm say so, the engine room fills, the engine stops and the crew calls the rescue
   boat; the rescue boat's pumps hold it; towed to the yard she is mended there (the first repair free), and the water is gone.
3. Running aground: on rock the hull is damaged and opened, on sand she gets scratches; the log says which.
4. Speed and weight: a damaged hull is slower, the water aboard weighs.
5. The hull insurance at the yard: the premium, the deductible, the claim paid over it, the premium up a quarter after the claim, and the
   monthly premium; the repair job takes the damage off when it is done.
6. The yard's card on the phone (portrait and landscape screenshots), and a second blow while a repair is queued is ordered on its own.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


OUT = os.path.join(os.path.dirname(__file__), 'out')


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut' + ('#no3d' if os.environ.get('KYST_LITE') else ''))
        # 1. blows by speed, on a sjark (fibreglass) and on steel and wood
        r = await pg.evaluate("""(() => { const b = S.boat, R = {}; S.free = {tow:1, rep:1}; b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0;
          const snap = () => ({s:+(b.dmg ? b.dmg.s : 0).toFixed(3), h:+(b.dmg ? b.dmg.h : 0).toFixed(3), A:+(b.dmg ? b.dmg.A : 0).toFixed(1), dmg:b.damage});
          R.r05 = hullHit(0.5, 100, 'kai'); R.s05 = snap();
          hullHit(2, 1e4, 'kai'); R.s2 = snap();
          b.dmg = null; b.damage = 0; hullHit(4, 5e4, 'kai'); R.s4 = snap();
          b.dmg = null; b.damage = 0; hullHit(6, 1e5, 'kai'); R.s6 = snap(); R.q6 = [Math.round(hullLeak()), Math.round(hullPump())];
          b.dmg = null; b.damage = 0; hullHit(8, 2e5, 'kai'); R.s8 = snap(); R.q8 = [Math.round(hullLeak()), Math.round(hullPump())]; R.cost8 = hullCost();
          const mat = t => { b.type = t; applyVessel(); b.dmg = null; hullHit(5, 1e5, 'kai'); return +b.dmg.h.toFixed(3); };
          R.mat = {tre:mat('trebat'), glass:mat('snekke'), steel:mat('kyst21')};
          b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['r05'] is None and r['s05']['s'] == 0, '1a. under a knot the fenders take it: nothing', r['s05'])
        check(r['s2']['s'] > 0 and r['s2']['h'] == 0 and r['s2']['dmg'] == 0, '1b. at 2 knots scratches in the paint, no damage', r['s2'])
        check(r['s4']['h'] > 0 and r['s4']['A'] == 0 and r['s4']['dmg'] == 1, '1c. at 4 knots the hull is damaged, no leak', r['s4'])
        check(r['s6']['A'] > 0 and r['q6'][0] < r['q6'][1], '1d. at 6 knots a leak the bilge pump keeps up with (litres a minute in, out)', [r['s6'], r['q6']])
        check(r['s8']['A'] > r['s6']['A'] and r['q8'][0] > r['q8'][1], '1e. at 8 knots more water comes in than the pump takes', [r['s8'], r['q8'], r['cost8']])
        check(r['mat']['tre'] > r['mat']['glass'] > r['mat']['steel'] > 0, '1f. the same blow does most to wood and least to steel', r['mat'])
        # 2. the leak at sea: the water rises, the engine room fills, the crew calls the rescue boat; towed to the yard and mended there
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {w:[]}; S.free = {}; S.member = false; b.type = 'sjark'; applyVessel(); S.plan = null; S.jobs = [];
          const yd = PORTS.find(q => q.sted === 'verft' && dist(q.p, P(69.5, 17.5)) < 60); const q0 = {x:yd.p.x, y:yd.p.y - 2.5}; let sea = q0;
          for (let k = 0; k < 36 && (isLand(sea) || depthF(sea) < 20); k++){ const a = k / 36 * 2 * Math.PI; sea = {x:yd.p.x + Math.sin(a) * 3, y:yd.p.y - Math.cos(a) * 3}; }
          await mapNeed(sea, 9); b.status = 'idle'; b.port = null; b.pos = {...sea}; b.dmg = null; b.damage = 0; b.tow = null; const m0 = S.log.length;
          hullHit(9, 3e5, 'kai'); R.lim = hullFlood(); R.Q = Math.round(hullLeak()); R.P = Math.round(hullPump());
          let flooded = null, pumped = null, i = 0;
          for (; i < 6000; i++){ step(); if (i % 15 === 0) await new Promise(r => setTimeout(r, 0)); const d = b.dmg || {};
            if (i < 40 || i % 30 === 0) R.w.push([i, Math.round(d.w || 0), b.status, b.tow ? b.tow.ph : null]);
            if (d.flood && flooded == null) flooded = i;
            if (b.tow && (b.tow.ph === 'tow') && pumped == null) pumped = {i, w:Math.round(d.w)};
            if (pumped && pumped.w2 == null && b.tow && i > pumped.i + 20) pumped.w2 = Math.round(d.w);
            if (b.status === 'port') break; }
          R.flooded = flooded; R.pumped = pumped; R.i = i; R.st = b.status; R.port = b.port; R.yard = !!(portById(b.port) && portServices(portById(b.port)).verft);
          R.logs = S.log.slice(m0).map(l => l.no).filter(t => /Vann i båten|Motorrommet|Lensepumpa|lekker/.test(t)).map(t => t.slice(0, 70));
          R.jobs = (S.jobs || []).map(j => [j.kind, j.paid, !!j.dmg]); R.free = !!(S.free && S.free.rep);
          for (let k = 0; k < YARD_H * 60 + 5; k++){ step(); if (k % 30 === 0) await new Promise(r => setTimeout(r, 0)); }
          R.after = {dmg:b.dmg, damage:b.damage, jobs:(S.jobs || []).length}; return R; })()""")
        print(json.dumps({k: v for k, v in r.items() if k != 'w'}, ensure_ascii=False)); print('  water:', r['w'][:12], '...', r['w'][-4:])
        check(r['Q'] > r['P'] and r['flooded'] is not None and any('Vann i båten' in t for t in r['logs']) and any('Motorrommet' in t for t in r['logs']),
              '2a. a 9-knot blow: more in than the pump takes, the log says «Vann i båten», the engine room fills and the crew calls the rescue boat', {'Q': r['Q'], 'P': r['P'], 'flooded at min': r['flooded'], 'logs': r['logs']})
        check(r['pumped'] is not None and r['pumped'].get('w2') is not None and r['pumped']['w2'] < r['pumped']['w'],
              '2b. made fast, the rescue boat\'s pumps take the water down', r['pumped'])
        check(r['st'] == 'port' and r['yard'] and any(j[0] == 'repair' and j[1] == 0 for j in r['jobs']) and r['free'],
              '2c. towed to the yard and mended there, the first repair free', {k: r[k] for k in ('st', 'port', 'yard', 'jobs', 'free')})
        check(r['after']['dmg'] is None and r['after']['damage'] == 0 and r['after']['jobs'] == 0, '2d. the repair done: the hull is whole and the water gone', r['after'])
        # 3. running aground on rock and on sand, along the coast
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {}; b.type = 'sjark'; applyVessel();
          const spots = []; for (const c of [P(69.35, 17.3), P(69.6, 18.0), P(68.2, 14.5), P(60.4, 5.2), P(70.66, 23.7)]){ await mapNeed(c, 9);
            for (let k = 0; k < 400; k++){ const q = {x:c.x + (Math.sin(k * 2.39) * k) * 0.012, y:c.y + (Math.cos(k * 2.39) * k) * 0.012}; let cd = 1; try { cd = coastDist(q); } catch (e){ continue; } if (isLand(q) || cd > 0.05) continue; spots.push({q, rock:bedRock(q)}); } }
          const rock = spots.find(s => s.rock), sand = spots.find(s => !s.rock); R.n = [spots.filter(s => s.rock).length, spots.filter(s => !s.rock).length];
          const go = s => { if (!s) return null; b.dmg = null; b.damage = 0; b.status = 'sailing'; b.v = 6; S.plan = null; const m0 = S.log.length; runAground(s.q); const d = b.dmg || {};
            const o = {s:+(d.s || 0).toFixed(2), h:+(d.h || 0).toFixed(2), A:+(d.A || 0).toFixed(1), dmg:b.damage, log:(S.log.slice(m0).find(l => /Gikk på grunn/.test(l.no)) || {}).no}; b.status = 'idle'; b.dmg = null; b.damage = 0; return o; };
          R.rock = go(rock); R.sand = go(sand); return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['rock'] and r['rock']['h'] > 0.3 and r['rock']['A'] > 0 and 'på fjell' in (r['rock']['log'] or '') and 'lekker' in (r['rock']['log'] or ''),
              '3a. aground on rock at 6 knots: the hull damaged and opened, and the log says «på fjell»', r['rock'])
        check(r['sand'] and r['sand']['s'] > 0 and r['sand']['A'] == 0 and r['sand']['h'] < 0.2 and 'sandbunn' in (r['sand']['log'] or ''),
              '3b. aground on sand at 6 knots: scratches and a little damage to the rudder and propeller, no leak, «på sandbunn»', r['sand'])
        # 4. speed and weight
        r = await pg.evaluate("""(() => { const b = S.boat; b.type = 'sjark'; applyVessel(); b.dmg = null; const v0 = speedCap(0.5), t0 = boatTons();
          b.dmg = {s:0.2, h:0.5, A:0, w:2000}; const v1 = speedCap(0.5), t1 = boatTons(); b.dmg = null; return {v0:+v0.toFixed(2), v1:+v1.toFixed(2), t0:+t0.toFixed(2), t1:+t1.toFixed(2)}; })()""")
        check(r['v1'] < r['v0'] * 0.95 and abs(r['t1'] - r['t0'] - 2.05) < 0.05, '4. a damaged hull is slower, and 2000 litres aboard weigh 2 tonnes', r)
        # 5. the hull insurance at the yard
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {}; b.type = 'sjark'; applyVessel(); S.free = {tow:1, rep:1}; S.jobs = []; b.kasko = null;
          const yd = PORTS.find(q => q.sted === 'verft'); await mapNeed(yd.p, 3); dock(yd.id); S.cash = 1e6; b.dmg = null; b.damage = 0;
          R.prem = kaskoPrem(); R.self = kaskoSelf(); const c0 = S.cash; kaskoSign(); R.signPaid = c0 - S.cash; R.signed = !!b.kasko;
          hullHit(6, 1e5, 'kai'); const B = hullBill(); R.bill = {tot:B.tot, ins:B.ins, you:B.you};
          const c1 = S.cash; R.why = hullOrder(false); R.paid = c1 - S.cash; R.claims = kaskoClaims(); R.prem2 = kaskoPrem();
          for (let k = 0; k < YARD_H * 60 + 5; k++){ step(); if (k % 30 === 0) await new Promise(r => setTimeout(r, 0)); }
          R.after = {dmg:b.dmg, damage:b.damage};
          S.t = b.kasko.next; const c2 = S.cash; kaskoHour(); R.month = c2 - S.cash;
          kaskoEnd(); R.ended = !b.kasko; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['signed'] and r['signPaid'] == r['prem'] and r['self'] >= 5000, '5a. signing at the yard pays the first month\'s premium; the deductible is at least 5 000 kr', r)
        check(r['bill']['ins'] == r['bill']['tot'] - r['self'] and r['paid'] == r['self'] and r['why'] is None, '5b. the insurance pays the repair over the deductible, and you pay the deductible', r['bill'])
        check(r['claims'] == 1 and abs(r['prem2'] - r['prem'] * 1.25) <= 10 and r['month'] == r['prem2'], '5c. after the claim the premium is a quarter up, and that is what the month takes', [r['prem'], r['prem2'], r['month']])
        check(r['after']['dmg'] is None and r['after']['damage'] == 0 and r['ended'], '5d. the job done takes the damage off; the insurance can be cancelled', r['after'])
        # 6. the yard's card on the phone, in portrait and landscape, and a second blow while a repair is queued
        r = await pg.evaluate("""(() => { const b = S.boat; S.jobs = []; b.dmg = null; b.damage = 0; S.cash = 1e6; hullHit(6, 1e5, 'kai');
          PHONE.open('verksted'); const hc = document.getElementById('hullCard'), kc = document.getElementById('kaskoCard'), btn = document.querySelector('[data-pa=hullfix]');
          const R = {hull:hc ? hc.innerText.replace(/\\n/g, ' | ').slice(0, 300) : null, kasko:kc ? kc.innerText.replace(/\\n/g, ' | ').slice(0, 400) : null, btn:!!btn && !btn.disabled};
          return R; })()""")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(OUT, 'hull_yard_land.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(600)
        await pg.evaluate("(() => { const c = document.getElementById('hullCard'); if (c) c.scrollIntoView(); })()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(OUT, 'hull_yard_port.png'))
        r2 = await pg.evaluate("""(() => { const b = S.boat, btn = document.querySelector('[data-pa=hullfix]'); if (btn) btn.click(); const n1 = (S.jobs || []).filter(j => j.kind === 'repair').length;
          hullHit(4, 5e4, 'kai'); const L = hullLeft(); hullOrder(false); const n2 = (S.jobs || []).filter(j => j.kind === 'repair').length; PHONE.show(false); return {n1, n2, left:L && +L.h.toFixed(3)}; })()""")
        print(json.dumps([r, r2], ensure_ascii=False))
        check(r['hull'] and 'Skrammer' in r['hull'] and 'Reparer' in r['hull'] and r['kasko'] and 'Tegn kasko' in r['kasko'] and r['btn'], '6a. the yard\'s card shows the damage, the repair and its price, and the insurance to sign', r)
        check(r2['n1'] == 1 and r2['n2'] == 2 and r2['left'] and r2['left'] > 0, '6b. «Reparer» queues the repair; a second blow while it is queued is ordered on its own, the rest only', r2)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
