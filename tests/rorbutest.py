"""The rorbuer along the coast (05.10.2026, core/07d-rorbu.js, core/15-energy.js; Jonas: «Man skal ikke kunne hvile i en åpen båt, da
må man enten seile hjem til naustet sitt eller ta inn på en rorbu. Rorbua må være billig. Energi skal kunne lade opp fra 0-100% på 6
timer in-game ved hvile på rorbuer», «Ved hvile forsvinner skipperen fra båten»): the places (src/data/rorbuer.json, by the fishing
harbours and on sheltered shore between), a rorbu's stretch of shore found by Gryllefjord and between, Autonav there and moored at its
quay, the dock's buttons (rest, no market), a night for 150 kr and full in six hours, the next night paid, aboard again when she leaves,
no rest in an open boat at a plant's quay, the chart's houses, and a save at the rorbu loaded again. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        # 1. the places
        r = await pg.evaluate("""(() => ({n:RORBUER.length, h:RORBUER.filter(R => R.kind === 0).length, named:RORBUER.filter(R => R.name !== 'Rorbua').length,
          looks:[...new Set(RORBUER.map(R => R.v))].sort().join(''), port:!!portById(RORBUER[0].id), inPorts:PORTS.some(q => q.rorbu)}))()""")
        check(r['n'] > 450 and r['h'] > 150 and r['named'] > r['n'] * 0.95 and r['looks'] == 'orw' and r['port'] and not r['inPorts'],
              'the rorbuer along the coast: one by each fishing harbour and more between, named, in three colours, known to portById but not harbours', r)
        # 2. their stretches of shore by Gryllefjord, and between
        r = await pg.evaluate("""(async () => { const g = portById('gryllefjord'), out = {};
          for (const kind of [0, 1]){ const e = rorbuNear(g.p, 40).find(e => e.R.kind === kind); if (!e){ out[kind] = null; continue; } const R = e.R; await mapNeed(R.cand, 2);
            const s = rorbuSite(R); if (!s){ out[kind] = {id:R.id, site:null}; continue; } const N = [-s.u[1], s.u[0]], at = (k) => isLand({x:(s.o[0] + N[0] * k) / 1000, y:(s.o[1] + N[1] * k) / 1000});
            out[kind] = {id:R.id, name:R.name, d:Math.round(dist(R.p, R.cand) * 1000), water:!at(8) && !at(20), land:at(-RORBU.out - 6) && at(-RORBU.out - 14), unit:unitNear(s.o[0], s.o[1], 110), face:!!quayFace(R.id, 'main'), bp:!!berthPose(R.id, S.boat.type, 'main')}; }
          return out; })()""")
        ok = all(r.get(k) and r[k].get('site', 1) and r[k]['water'] and r[k]['land'] and not r[k]['unit'] and r[k]['face'] and r[k]['bp'] for k in ('0', '1'))
        check(ok, 'by Gryllefjord and on the shore between the rorbu has its quay on a straight shore: water in front, land behind, clear of the plant', r)
        rid = r['0']['id'] if r.get('0') else None
        # 3. Autonav from the harbour to the rorbu, and moored at its quay
        r = await pg.evaluate("""(async rid => { const R = RBID.get(rid), g = portById('gryllefjord'), b = S.boat; S.adm = null; S.sleep = null; S.rest = null;
          b.status = 'idle'; b.port = null; b.pos = {x:g.p.x, y:g.p.y}; S.plan = null; b.fuel = BOAT.fuelCap;
          const res = await leiaRoute({x:g.p.x, y:g.p.y}, R.p, null, R.id); if (res.why) return {why:res.why};
          const wps = res.wps.map((q, i) => i === res.wps.length - 1 ? {x:R.p.x, y:R.p.y, port:R.id, fish:0} : {x:q.x, y:q.y, port:null, fish:0});
          S.plan = {wps, idx:0, speed:BOAT.cruise || 6, returning:false}; b.status = 'sailing'; let n = 0; while (b.status !== 'port' && n < 600){ step(); n++; }
          return {n, st:b.status, port:b.port, berth:berthKind(b), log:(S.log || []).slice(-6).map(l => l.no || l[1] || '').join(' | ')}; })""", rid)
        check(r.get('st') == 'port' and r.get('port') == rid, 'Autonav takes the boat from Gryllefjord to the rorbu, and she lies at its quay', r)
        # 3b. «Fortøy» in the dock when she lies still off the quay (Jonas 05.10.2026: «Det må også være mulig å fortøye i kaia»)
        await pg.evaluate("""(rid => { const R = RBID.get(rid), b = S.boat, N = [-R.site.u[1], R.site.u[0]]; restEnd && restEnd(); S.plan = null; b.status = 'idle'; b.port = null; b.v = 0;
          b.pos = {x:R.p.x + N[0] * 0.15, y:R.p.y + N[1] * 0.15}; DOCK.tick && DOCK.tick(); renderActs && renderActs(); const el = [...document.querySelectorAll('#dock button')].find(e => e.textContent.trim() === 'Fortøy'); if (el) el.click(); })""", rid)
        await pg.wait_for_timeout(2500)
        r = await pg.evaluate("""(rid => { const b = S.boat, st0 = b.status; let n = 0; while (b.status !== 'port' && n < 200){ step(); n++; } return {st0, n, st:b.status, port:b.port}; })""", rid)
        check(r['st0'] == 'sailing' and r['st'] == 'port' and r['port'] == rid, 'lying still 150 m off the rorbu, «Fortøy» in the dock takes her in to its quay', r)
        # 4. the dock: rest, no market, no shop; Gryllefjord's plant is not here
        r = await pg.evaluate("""(() => { DOCK.tick && DOCK.tick(); renderActs && renderActs(); const t = [...document.querySelectorAll('#dock button')].map(b => b.textContent.trim()).join('|');
          return {t, shop:shopBuy('jig', 0, false), mottak:!!portById(S.boat.port).mottak}; })()""")
        check('Hvil' in r['t'] and 'Marked' not in r['t'] and 'Verft' not in r['t'] and r['shop'] and 'rorbua' in r['shop'][0] and not r['mottak'],
              'at the rorbu the dock has «Hvil» and no market, yard or shop', r)
        # 5. a night for 150 kr, full in six hours, the skipper ashore; the next night paid; aboard again when she leaves
        r = await pg.evaluate("""(() => { const b = S.boat; S.cash = 1000; S.energy = 0; S.drowsy = false; const cw = genCrew(); cw.fatigue = 100; S.crew.push(cw); const why = restStart(), c1 = S.cash;
          const t0 = S.t; let n = 0; while (S.energy < 100 && n < 800){ step(); n++; } const full = n, rest = resting(), crewF = Math.round(crewById(cw.id).fatigue);
          DOCK.tick && DOCK.tick(); const info = (document.getElementById('dockInfo') || {}).textContent || '';
          while (S.t < t0 + 24 * 60 + 2) step(); const c2 = S.cash; depart(); S.crew = S.crew.filter(c => c.id !== cw.id); return {why, paid:1000 - c1, full, rest, crewF, info, night2:c1 - c2, after:!!S.rest, st:b.status}; })()""")
        check(not r['why'] and r['paid'] == 150 and 355 <= r['full'] <= 362 and r['rest'], 'a night at the rorbu costs 150 kr and rests you from 0 to 100 % in six hours, ashore (the skipper is gone from the boat)', r)
        check(r['crewF'] <= 5, 'the crew rest ashore with the skipper: worn out (100) to rested in the same six hours', r['crewF'])
        check(r['night2'] == 150 and not r['after'] and r['st'] == 'unmooring', 'the next night is paid when the day has gone, and casting off you go aboard again', r)
        # 6. an open boat at a plant's quay gives no rest; with bunks it does; at home the naust
        r = await pg.evaluate("""(() => { const b = S.boat, q = portById('husoy'); S.plan = null; b.status = 'port'; b.port = 'husoy'; b.pos = {x:q.p.x, y:q.p.y}; S.rest = null;
          S.energy = 40; for (let i = 0; i < 60; i++) step(); const open = +(S.energy - 40).toFixed(2), noRest = restStart();
          return {open, noRest:noRest && noRest[0], bunks:+(restRate({status:'port', port:'husoy', type:'sjark'}) * 60).toFixed(2), type:b.type, berths:VESSELS[b.type].berths}; })()""")
        check(r['open'] == 0 and r['noRest'] and abs(r['bunks'] - 12.5) < 0.05 and r['berths'] == 0, 'an open boat at a plant’s quay gives no rest (and no bed is to be had there); a boat with bunks rests you aboard', r)
        # 7. the chart's houses round the rorbu
        r = await pg.evaluate("""(async rid => { const R = RBID.get(rid); openPlotter(); view.cx = R.p.x; view.cy = R.p.y; view.z = MAP_H / 8; applyView(); scheduleStatic();
          await new Promise(res => setTimeout(res, 1500)); const n = document.querySelectorAll('#map .rorbu').length, lbl = [...document.querySelectorAll('#map text')].some(t => t.textContent.startsWith('Rorbu '));
          return {n, lbl, z:view.z}; })""", rid)
        check(r['n'] >= 1 and r['lbl'], 'the chart plotter draws the rorbuer as little houses with their names', r)
        # 8. a save at the rorbu is loaded again
        await pg.evaluate("""(rid => { const R = RBID.get(rid), b = S.boat; b.status = 'port'; b.port = rid; b.pos = {x:R.p.x, y:R.p.y}; S.plan = null; S.rest = null; restStart(); save(); })""", rid)
        await pg.reload(); await pg.wait_for_function("typeof S !== 'undefined' && !!S.boat", timeout=90000); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("""(() => { const b = S.boat, q = portById(b.port); return {port:b.port, st:b.status, rorbu:!!(q && q.rorbu), rest:!!S.rest, name:q && q.name}; })()""")
        check(r['port'] == rid and r['st'] == 'port' and r['rorbu'] and r['rest'], 'a game saved at the rorbu is there again when loaded, still resting', r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
