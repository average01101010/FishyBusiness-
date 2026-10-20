"""The people aboard as agents who walk the deck (deckcrew.js CREW3D, over vessel3d.js deckMap; docs/mannskap-plan.md del 1). Without 3D:
the agents are stepped by hand with CREW3D.tick(dt). A sjark with two hands: at the first tick everyone stands at their place at once;
when the work changes (the tub is full, deck work: workAssign sends them to the gutting table and the tub) they walk there over
deck cells only, in real time at walking pace, and arrive; under way the crew go in through the door and the skipper stands at the
wheel; a hand given time off is gone from the deck. Prints OK or FEIL."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:400])
    if not c: bad.append(msg)

SETUP = """(() => { const b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); S.settings.autoOn = false;
  b.type = 'sjark'; applyVessel(); S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:0}), Object.assign(genCrew(), {bi:false, off:false, fatigue:0})]; S.crew.forEach(c => { c.job = null; });
  S.equip.jukse = 2; S.target = 'torsk'; S.hold = []; b.ice = 300; b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; b.gop = null; b.deckStop = false; S.plan = null; S.rest = null;
  CREW3D.reset(); CREW3D.tick(0.05); const M = deckMap('sjark');
  const A = CREW3D.agents().map(a => ({id:a.id, st:a.st, mode:a.mode, task:a.task, cell:a.cell, ok:M.ok(M.cellOf(a.x, a.z)), goal:a.goal && a.goal.k}));
  return {on:CREW3D.on(), A, people:workAssign().map(p => (p.c ? 'c' : 'me') + ':' + p.st)}; })()"""

# step the agents n times by dt seconds; every step checks that each visible agent stands on a deck cell; returns the walked distance per agent and the end state
STEP = """(([n, dt]) => { const M = deckMap('sjark'), walked = {}, off = [], last = {}; let moved = 0;
  for (let i = 0; i < n; i++){ CREW3D._st.ctxT = 0; CREW3D.tick(dt);
    for (const a of CREW3D.agents()){ if (a.mode === 'in') continue; if (!M.ok(M.cellOf(a.x, a.z))) off.push([a.id, +a.x.toFixed(2), +a.z.toFixed(2)]);
      if (last[a.id]){ const d = Math.hypot(a.x - last[a.id][0], a.z - last[a.id][1]); walked[a.id] = (walked[a.id] || 0) + d; if (d > dt * 2.5) off.push([a.id, 'too fast', d]); } last[a.id] = [a.x, a.z]; } }
  return {walked, off:off.slice(0, 5), A:CREW3D.agents().map(a => ({id:a.id, st:a.st, mode:a.mode, task:a.task, at:a.cell === (a.goal && a.goal.k), goal:a.goal && a.goal.task}))}; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); await boot(pg)
        r = await pg.evaluate(SETUP)
        check(r['on'] and len(r['A']) == 3, 'a sjark with two hands has three agents (the skipper and two)', r)
        check(all(a['ok'] or a['mode'] in ('in', 'helm') for a in r['A']) and all(a['mode'] != 'walk' for a in r['A']), 'the first tick puts everyone straight at their place, on the deck', r['A'])
        # the deck work: the tub fills, fishing stops for gutting, and the chains send people to the table and the tub (03.10.2026 deck work)
        r2 = await pg.evaluate("""(() => { S.settings.gut = true; S.settings.ice = true; addCatch('torsk', 90, null, true); S.boat.deckStop = true; S.boat.deckEnd = S.t + 60; return workAssign().map(p => (p.c ? 'c' : 'me') + ':' + p.st); })()""")
        st = await pg.evaluate(STEP, [60, 0.05])   # 3 s: on their way
        walking = [a for a in st['A'] if a['mode'] == 'walk']
        check(any(a['st'] in ('sloy', 'is') for a in st['A']) and walking, 'with the tub full someone is on the way to the table or the tub', {'wa':r2, 'A':st['A']})
        check(not st['off'], 'nobody leaves the deck or goes faster than walking', st['off'])
        st2 = await pg.evaluate(STEP, [400, 0.05])   # 20 s more: all arrived
        check(all(a['at'] or a['mode'] in ('in', 'helm') for a in st2['A']) and not st2['off'], 'twenty seconds later everyone has arrived at their place', st2)
        check(sum(st['walked'].values()) + sum(st2['walked'].values()) > 1.0, 'they walked there (metres on deck), they did not jump', {'first':st['walked'], 'then':st2['walked']})
        # under way: the crew go inside through the door, the skipper at the wheel
        await pg.evaluate("(() => { S.hold = []; S.boat.deckStop = false; S.boat.status = 'sailing'; S.boat.v = 7; S.plan = {wps:[{x:S.boat.pos.x + 5, y:S.boat.pos.y, port:null, fish:0}], idx:0, speed:8, returning:false}; })()")
        st3 = await pg.evaluate(STEP, [600, 0.05])
        me = [a for a in st3['A'] if a['id'] == 'me']; crew = [a for a in st3['A'] if a['id'] != 'me']
        check(me and me[0]['mode'] == 'helm' and all(a['mode'] == 'in' for a in crew), 'under way the crew are inside and the skipper is at the wheel', st3['A'])
        # time off: the hand is gone from the deck
        r4 = await pg.evaluate("(() => { S.boat.status = 'fishing'; S.boat.v = 0; S.plan = null; S.crew[1].off = true; CREW3D._st.ctxT = 0; CREW3D.tick(0.05); return CREW3D.agents().length; })()")
        check(r4 == 2, 'a hand given time off has no agent', r4)
        # each on a place of their own (Jonas 20.10.2026, tilbakemelding #75: «To av mannskapet står også inni hverandre»): hauling line on
        # the new sjark with three hands, one hauls, one bleeds, one guts and one packs, none closer to another than 0.4 m and none in the deck kit
        r5 = await pg.evaluate("""(() => { const b = S.boat; b.type = 'sjarkny'; applyVessel(); S.crew = [0, 1, 2].map(() => Object.assign(genCrew(), {bi:false, off:false, fatigue:0})); S.crew.forEach(c => { c.job = null; });
          S.equip.linehaler = true; S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:60, n:18, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}]; b.status = 'fishing'; b.deckStop = false; b.ice = 300;
          b.gop = {op:'haul', kind:'line', n:4, done:0, prog:0, sub:0, sl:1, hooksPer:600, a:{...b.pos}, b:{x:b.pos.x + 0.2, y:b.pos.y}};
          CREW3D.reset(); for (let i = 0; i < 600; i++) CREW3D.tick(0.05);
          const A = CREW3D.visible(), d = []; for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) d.push(+Math.hypot(A[i].x - A[j].x, A[i].z - A[j].z).toFixed(2));
          const M = CREW3D._st.M; b.gop = null; S.hold = [];
          return {st:A.map(a => a.st + ':' + a.task).sort(), d, kit:M.kit || 0, inKit:A.filter(a => a.mode === 'at' && !M.ok(M.cellOf(a.x, a.z))).map(a => a.id)}; })()""")
        check(r5['st'] == ['blogg:bleedst', 'haling:haul', 'is:pack', 'sloy:gut'] and min(r5['d']) >= 0.39 and not r5['inKit'] and r5['kit'] > 0, 'hauling line on the new sjark: one hauls, one bleeds, one guts, one packs and ices, each on a place of their own (no two closer than 0.4 m), none in the kit', r5)
        check(not errs, 'no page errors', errs[:3])
        await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
