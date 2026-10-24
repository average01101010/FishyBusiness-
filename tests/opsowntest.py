from _env import GAME, boot
# The standing plan (06d-drift.js) with you aboard. In the open group the owner must be the master aboard; when you are aboard, the plan's trip is
# yours: cod, haddock and saithe go on your quota, nothing is confiscated, the hired skipper is ordinary crew and gets no skipper's
# bonus, and the plan does not switch you to halibut. When the skipper runs the plan alone, the old rules hold.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

TRIP = """(async (alone)=>{
  S.tut = 0;
  // a calm day, so the plan's weather check lets the boat out
  let t0 = null; for (let d = 0; d < 90 && t0 == null; d++){ const H0 = (Date.UTC(2028, 4, 1 + d, 5) - EPOCH) / 3.6e6; let ok = true; for (let k = 0; k <= 8; k++) if (windAt(H0 + k) > 14 || hsOpen(H0 + k) > 2) ok = false; if (ok) t0 = H0; }
  S.t = Math.round(t0 * 60) - 20; S.cash = 5e6; S.stock = initStock(); S.settings.autoW = 14; S.quota = null; S.lic = null;
  const HP = portById('husoy'), rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0], end = rt[rt.length - 1], spot = {x:end[0], y:end[1]};
  // the skipper alone needs a mate too (Jonas 23.10.2026), so that case has a boat with room for two
  const b = S.boat; if (alone){ b.type = 'sjark'; applyVessel(); }
  S.plan = null; b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; b.fuel = BOAT.fuelCap; b.gear = false; S.equip.jukse = 0; b.kgear = true; b.land = b.shift = b.fueling = null; S.hold = []; S.target = 'mix';
  const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole Martin Mikalsen'}), per = Object.assign(genCrew(), {bi:false, off:false});
  S.crew = alone ? [ole, per] : [ole]; setSkipper(ole.id); if (alone) setMate(per.id);
  S.me = alone ? 'nobody' : S.cur;
  const o = S.ops = driftNew({home:'husoy', rig:'juksa', jigs:[{id:'a', x:spot.x, y:spot.y}], dep:Math.round(driftHod(t0)), wx:'tough'});
  S.me = S.cur; const err = await new Promise(r => driftMake(o, r)); S.me = alone ? 'nobody' : S.cur; o.on = true;
  const m0 = S.msgs.length, c0 = S.cash; let added = false, target = null, left = false;
  for (let i = 0; i < 24 * 60; i++){ DYN.on = false; step();
    if (!left && b.status !== 'port'){ left = true; target = S.target; }
    // cod, haddock and saithe in the hold on the way out, so the landing has something to judge
    if (left && !added){ added = true; for (const [sp, kg] of [['torsk', 100], ['hyse', 50], ['sei', 50], ['lange', 300]]) S.hold.push({sp, cls:SPECIES[sp].ref, kg, n:1, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}); }
    if (left && b.status === 'port' && !b.land && S.lastSale && S.lastSale.t >= S.t - 600) break;
    if (i % 120 === 0) await new Promise(r => setTimeout(r, 0)); }
  const q = quotaState(), ms = S.msgs.slice(m0), L = S.lastSale || {};
  const R = {err, day:dayStr(t0), left, back:b.status, owner:S.tripOwner, acc:L.acc, confKg:Math.round((L.confKg || 0) * 10) / 10, torsk:Math.round(q.torsk || 0), target, stop:o.stop, wait:o.wait,
    conf:ms.filter(m => /inndratt/.test(m.no || m.text || '')).length, bonus:ms.some(m => /skippertillegg/.test(m.no || '')), report:ms.filter(m => /Driftsrapport|Blir på land/.test(m.no || '')).map(m => m.no.slice(0, 90))};
  S.me = S.cur; S.ops = null; return R; })"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':900, 'height':900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        own = await pg.evaluate(TRIP, False)
        print('aboard:', json.dumps(own, ensure_ascii=False))
        # a fresh game for the second case, so nothing from the first trip is left on the quay
        await pg.close(); pg = await (await b.new_context(viewport={'width':900, 'height':900})).new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        alone = await pg.evaluate(TRIP, True)
        print('alone: ', json.dumps(alone, ensure_ascii=False))
        eff = await pg.evaluate("""(()=>{ S.crew = [Object.assign(genCrew(), {bi:false, off:false})]; setSkipper(S.crew[0].id); S.me = S.cur;
          S.plan = {ops:true, wps:[], idx:0}; const onPlan = fishEffort(); S.plan = {wps:[], idx:0}; const own = fishEffort();
          S.me = 'nobody'; S.plan = {ops:true, wps:[], idx:0}; const skip = fishEffort(); S.me = S.cur; S.plan = null;
          return {onPlan, own, skip}; })()""")
        print('effort:', json.dumps(eff))
        # a saved game from before the fix: a plan trip at sea with you aboard, marked as the skipper's
        await pg.evaluate("(()=>{ S.me = S.cur; S.plan = {wps:[{x:S.boat.pos.x, y:S.boat.pos.y, port:null, fish:1}], idx:0, speed:16, returning:false, ops:true, unsafe:[]}; S.boat.status = 'fishing'; S.boat.port = null; S.tripOwner = false; save(); })()")
        await pg.reload(); await pg.wait_for_timeout(1800)
        mig = await pg.evaluate("({owner:S.tripOwner, ops:!!(S.plan && S.plan.ops), st:S.boat.status})")
        print('saved game:', json.dumps(mig))
        print(ok(own['left'] and own['back'] == 'port' and own['owner'] is True), 'the plan went out with you aboard, and the trip is yours')
        print(ok(own['acc'] == 'open' and own['confKg'] == 0 and own['conf'] == 0 and own['torsk'] == 100), 'with you aboard: cod on your quota in the open group, nothing confiscated')
        print(ok(own['target'] == 'mix' and not own['bonus']), 'with you aboard: the plan does not switch you to halibut, and the skipper gets no bonus')
        print(ok(abs(eff['onPlan'] - eff['own']) < 1e-9 and eff['skip'] != eff['own']), 'with you aboard the fishing effort counts you, as on your own trips')
        print(ok(alone['left'] and alone['owner'] is False and alone['acc'] == 'none' and alone['confKg'] >= 150 and alone['target'] == 'kveite' and alone['bonus']), 'the skipper alone: no access, the 150 kg of cod, haddock and saithe confiscated (and what he caught), halibut, and his bonus')
        print(ok(mig['owner'] is True and mig['ops']), 'a saved plan trip with you aboard becomes yours when the game loads')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
