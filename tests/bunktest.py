"""Rest in the bunk aboard (tilbakemelding #70, 17.10.2026; core/15-energy.js 'koye', ui/10c-dock.js): on a boat with berths you can
rest at anchor, and at sea when someone of the crew is awake on watch; the crew work on without you; an open boat gives nothing,
and alone at sea there is no watch. Prints OK/FEIL lines. No 3D."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("SIMREADY && S.boat.status === 'port'", timeout=60000)
        r = await pg.evaluate("""(()=>{ const R = {}, b = S.boat; S.tut = 0; S.settings.autoOn = false; S.me = S.cur; S.adm = null; S.skip = null; S.sleep = null; S.rest = null;
          S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})];
          const sea = () => { b.status = 'idle'; b.port = null; b.anch = null; b.v = 0; };
          // the havsjark (four berths) at anchor: the bunk is there
          b.type = 'sjark'; applyVessel(); sea(); b.anch = {x:b.pos.x, y:b.pos.y, t0:S.t, depth:30, expo:0.2, drags:0}; S.energy = 40;
          R.anchWhere = restWhere(b); R.start = restStart(); R.resting = resting(); R.ashore = restAshore();
          R.meWorking = workAssign().some(p => !p.c);
          const e0 = S.energy; for (let i = 0; i < 60; i++) step(); R.gain = +(S.energy - e0).toFixed(1);
          restEnd(true); R.after = resting();
          // under way with the hand awake: the bunk, slower; with the hand off, no watch and no bunk
          b.anch = null; b.status = 'sailing'; b.v = 6; S.energy = 40; R.seaWhere = restWhere(b); restStart(); const e1 = S.energy; for (let i = 0; i < 60; i++) step(); R.seaGain = +(S.energy - e1).toFixed(1); restEnd(true);
          S.crew[0].off = true; R.noWatch = restWhere(b); S.crew[0].off = false;
          // the snekke (no berths) at anchor: nothing
          b.type = 'snekke'; applyVessel(); sea(); b.anch = {x:b.pos.x, y:b.pos.y, t0:S.t, depth:30, expo:0.2, drags:0}; R.openWhere = restWhere(b); R.openWhy = restStart();
          // the dock offers the bunk only where it is
          b.type = 'sjark'; applyVessel();
          b.anch = null; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.crew = []; S.energy = 100; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['anchWhere'] == 'koye' and r['start'] is None and r['resting'] and not r['ashore'] and not r['meWorking']), 'at anchor on a boat with berths you go down to the bunk, the deck goes on without you, and it is not a rest ashore')
        print(ok(8 <= r['gain'] <= 12 and not r['after']), 'an hour in the bunk at anchor gives about 10 % (85 % of a night at the quay), and up again it is over', r['gain'])
        print(ok(r['seaWhere'] == 'koye' and 6 <= r['seaGain'] <= 10 and r['noWatch'] is None), 'under way with a hand on watch the bunk gives less; with nobody awake there is no watch and no bunk', (r['seaWhere'], r['seaGain'], r['noWatch']))
        print(ok(r['openWhere'] is None and r['openWhy'] and 'naustet' in r['openWhy'][0]), 'an open boat gives no rest aboard, and says where to go instead')
        # the dock's row at sea carries «Hvil i køya» on a boat with berths and a watch, not on the open boat
        d = await pg.evaluate("""(()=>{ const b = S.boat, R = {}; S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})];
          b.type = 'sjark'; applyVessel(); b.status = 'idle'; b.port = null; b.anch = {x:b.pos.x, y:b.pos.y, t0:S.t, depth:30, expo:0.2, drags:0}; R.sjark = DOCK.items().filter(i => i.id === 'rest').map(i => i.no || i.label || i.id);
          b.type = 'snekke'; applyVessel(); R.snekke = DOCK.items().filter(i => i.id === 'rest').map(i => i.no || i.label || i.id);
          b.type = 'sjark'; applyVessel(); b.anch = null; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.crew = []; return R; })()""")
        print(ok(len(d['sjark']) == 1 and not d['snekke']), 'the dock offers «Hvil i køya» at anchor on the havsjark and not on the snekke', d)
        print('errors:', errs)
        await br.close()

asyncio.run(main())
