"""The crew who organise themselves (core/13-work.js workAssign, 14-crewlife.js crewSlip, deckcrew.js; Jonas 23.10.2026: «mannskapet skal
i større grad være mer selvstendige dynamiske mennesker»), on three boats: the havsjark with two hands, the 15 m coastal boat with
four and the longliner with ten. Without 3D: workAssign is asked directly and the deck agents are stepped by hand (CREW3D.tick).
Checks: hauling line every place with work is taken (one hauls, one bleeds, the table, the ice) and nobody rests while fish wait;
under way one steers (you, else the mate); the mistakes come with a seeded die the same each run, more for the tired; a cut slows the
one cut; and on deck the moments between: the mug put away before the walk to work, the hauler hauls on until the one taking over is
there, a hand to the door before going in, and the tired at a slower beat. Prints OK or FEIL."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:500])
    if not c: bad.append(msg)

# a boat of type t with n hands hauling line, the fish coming aboard; what each one does, and under way who steers
BOAT = """(([t, n]) => { const b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); S.settings.autoOn = false;
  b.type = t; applyVessel(); S.crew = Array.from({length:n}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:0})); S.crew.forEach(c => { c.job = null; delete c.mate; });
  if (typeof crewChanged === 'function') crewChanged(); S.me = S.cur; S.mySt = null; S.settings.gut = true; S.settings.ice = true; S.equip.linehaler = true;
  b.pos = {x:g.x, y:g.y}; b.v = 0; b.port = null; S.plan = null; b.ice = 300; b.status = 'fishing'; b.deckStop = false; b.fishUntil = S.t + 600;
  S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:30 * n, n:9 * n, bled:false, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true},
            {sp:'torsk', cls:SPECIES.torsk.ref, kg:20 * n, n:6 * n, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:true, hook:true}];
  b.gop = {op:'haul', kind:'line', n:6, done:0, prog:0, sub:0, sl:1, hooksPer:600, a:{...b.pos}, b:{x:b.pos.x + 0.2, y:b.pos.y}};
  const haul = workAssign().map(p => ({st:p.st, why:p.why, me:!p.c}));
  b.gop = null; S.hold = []; b.status = 'sailing'; b.v = 7; S.plan = {wps:[{x:b.pos.x + 5, y:b.pos.y, port:null, fish:0}], idx:0, speed:7, returning:false};
  const sail = workAssign().filter(p => p.st === 'ror').map(p => p.c ? p.c.id : 'me');
  S.me = 'nobody'; setMate(S.crew[n - 1].id); const mate = workAssign().filter(p => p.st === 'ror').map(p => p.c && p.c.mate ? 'mate' : p.c ? 'crew' : 'me'); setMate(null); S.me = S.cur;
  S.plan = null; b.status = 'idle'; b.v = 0;
  return {haul, sail, mate, places:BOAT.stations || {}}; })"""

# the mistakes with a seeded die: n minutes of work by a crew of three, tired or rested; how many of each, and the same again with the same seed
SLIPS = """(([seed, fat, n]) => { const b = S.boat; b.type = 'sjark'; applyVessel(); b.status = 'fishing'; b.port = null; S.me = S.cur; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4); S.meal = null;
  // (the same three people every run: genCrew draws them at random)
  const C0 = window.__slipCrew || (window.__slipCrew = JSON.stringify([0, 1, 2].map(() => genCrew())));
  S.crew = JSON.parse(C0).map(c => Object.assign(c, {bi:false, off:false, fatigue:fat, morale:fat > 50 ? 25 : 70})); S.crew.forEach(c => { delete c.cut; });
  const seen = {slip:0, cut:0, botch:0}, say0 = crewSay, fx0 = hooks.onCrewFx; let cutFor = null, drive = [];
  hooks.onCrewFx = (c, k) => { seen[k]++; if (k === 'cut' && cutFor == null){ cutFor = Math.round(c.cut - S.t); drive = crewDrive(c, S.t / 60, hsWork(b.pos, S.t / 60)).map(x => x[0]); } return false; };
  window.crewSay = (c, sit) => { if (sit === 'botch') seen.botch++; return false; };
  window.CREW_SEED = seed;
  for (let i = 0; i < n; i++){ S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:300, n:80, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:true, hook:true}]; S.t += 1; crewSlip(S.crew); }
  window.CREW_SEED = null; window.crewSay = say0; hooks.onCrewFx = fx0;
  return {seen, cutFor, drive}; })"""

# the deck agents on the new sjark hauling line with three hands (crewwalk.py's scene): step them by dt for n steps
DECK = """(() => { const b = S.boat; b.type = 'sjarkny'; applyVessel(); S.crew = [0, 1, 2].map(() => Object.assign(genCrew(), {bi:false, off:false, fatigue:0, morale:70})); S.crew.forEach(c => { c.job = null; delete c.cut; delete c.mate; });
  S.me = S.cur; S.meal = null; S.equip.linehaler = true; S.hold = [{sp:'torsk', cls:SPECIES.torsk.ref, kg:60, n:18, bled:true, iced:false, hr:Math.floor(S.t / 60), fresh:100, gut:false, hook:true}];
  b.status = 'fishing'; b.deckStop = false; b.ice = 300; b.v = 0; S.plan = null;
  b.gop = {op:'haul', kind:'line', n:4, done:0, prog:0, sub:0, sl:1, hooksPer:600, a:{...b.pos}, b:{x:b.pos.x + 0.2, y:b.pos.y}};
  CREW3D.reset(); for (let i = 0; i < 600; i++) CREW3D.tick(0.05);
  return CREW3D.agents().map(a => a.id + ':' + a.st + ':' + a.task); })()"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); await boot(pg)
        # 1. three boats hauling line: every place with work taken, nobody resting while fish wait; under way one steers
        for t, n in (('sjark', 2), ('kyst15', 4), ('autoliner', 10)):
            r = await pg.evaluate(BOAT, [t, n]); st = [x['st'] for x in r['haul']]
            cnt = lambda k: st.count(k)
            ok = cnt('haling') >= 1 and cnt('blogg') == (1 if n + 1 >= 3 else cnt('blogg')) and cnt('sloy') >= 1 and (cnt('is') >= 1 or n + 1 < 4)
            check(ok and all(x['why'] for x in r['haul']), f'{t} with {n} hands hauling line: someone hauls, bleeds, guts and ices, each with a reason why', r['haul'])
            check(cnt('pause') == 0 or cnt('sloy') >= r['places'].get('table', 1), f'{t}: nobody rests while there is room at the table and fish wait', {'st':st, 'places':r['places']})
            check(r['sail'] == ['me'] and r['mate'] == ['mate'], f'{t} under way: you steer, and without you the mate', {'sail':r['sail'], 'mate':r['mate']})
        # 2. the mistakes: a seeded die, the same each run; the tired slip more; a cut slows the one cut for four hours
        a = await pg.evaluate(SLIPS, [12345, 90, 4000]); b2 = await pg.evaluate(SLIPS, [12345, 90, 4000]); c = await pg.evaluate(SLIPS, [12345, 0, 4000])
        check(a['seen'] == b2['seen'], 'the same seed gives the same slips, cuts and bad gutting (window.CREW_SEED)', {'a':a['seen'], 'b':b2['seen']})
        tot = lambda r: sum(r['seen'].values())
        check(min(a['seen'].values()) >= 1 and tot(a) > 1.5 * tot(c), 'tired and sour they slip more than rested and glad, and all three kinds happen', {'tired':a['seen'], 'rested':c['seen']})
        check(a['cutFor'] is not None and 0 < a['cutFor'] <= 240 and 'cut' in a['drive'], 'a cut hand slows the one cut (crewDrive "cut") for up to four hours', a)
        # 3. on deck: the moments between
        r = await pg.evaluate(DECK)
        check(any(':haling:haul' in x for x in r) and any(':blogg:' in x for x in r), 'the deck agents haul and bleed on the new sjark', r)
        # the mug put away first: a coffee break ends, and the one on it stands put for a moment with the mug, then walks
        put = await pg.evaluate("""(() => { const a = CREW3D.agents().find(q => (q.st === 'is' || q.st === 'sloy') && !q.sub && q.mode === 'at'); if (!a) return []; const x0 = a.x, z0 = a.z;
          a.goal = Object.assign({}, a.goal, {task:'coffee', idle:true, until:CREW3D._st.clk + 999}); a.task = 'coffee'; a.blend = 1; a.kind = 'pause:coffee'; CREW3D._st.ctxT = -1e9;
          const L = []; for (let i = 0; i < 40; i++){ CREW3D.tick(0.05); L.push([a.task, !!a.put, +Math.hypot(a.x - x0, a.z - z0).toFixed(3)]); } return L; })()""")
        held = [x for x in put if x[1]]
        check(held and all(x[0] == 'coffee' and x[2] < 0.01 for x in held) and 0.9 <= len(held) * 0.05 <= 1.5, 'the coffee is put away first: about 1.4 s with the mug where they stood, then on to the work', put[:6] + put[-4:])
        # the hauler hauls on until the one taking over is there (the hauler and the bleeder swap places)
        rel = await pg.evaluate("""(() => { const A = CREW3D.agents(), h = A.find(q => q.st === 'haling'), o = A.find(q => q.st === 'blogg'); if (!h || !o) return null;
          const wa0 = workAssign, hk = h.c ? h.c.id : null, ok = o.c ? o.c.id : null;
          window.workAssign = as => wa0(as).map(p => { const q = Object.assign({}, p), id = p.c ? p.c.id : null; if (id === hk){ const r = wa0(as).find(x => (x.c ? x.c.id : null) === ok); q.st = r.st; q.role = r.role; } else if (id === ok){ const r = wa0(as).find(x => (x.c ? x.c.id : null) === hk); q.st = r.st; q.role = r.role; } return q; });
          const H0 = [h.x, h.z], L = []; let left = -1, near = -1;
          for (let i = 0; i < 400; i++){ CREW3D._st.ctxT = -1e9; CREW3D.tick(0.05); const P = CREW3D._st.M.at(h.relief ? h.relief.g.k : h.cell), dO = Math.hypot(o.x - H0[0], o.z - H0[1]), dH = Math.hypot(h.x - H0[0], h.z - H0[1]);
            if (near < 0 && dO < 0.95) near = i; if (left < 0 && dH > 0.05) left = i; if (i % 20 === 0) L.push([h.task, !!h.relief, +dH.toFixed(2), +dO.toFixed(2)]); }
          window.workAssign = wa0; return {left, near, L, h:h.st, o:o.st}; })()""")
        check(rel and rel['h'] != 'haling' and rel['o'] == 'haling' and rel['left'] >= 0 and rel['near'] >= 0 and rel['left'] >= rel['near'] - 1, 'the hauler hauls on until the one taking over is at the hauler, then leaves', rel)
        # under way: in through the door, with a hand to it first; and the tired at a slower beat
        door = await pg.evaluate("""(() => { const b = S.boat; b.gop = null; S.hold = []; b.status = 'sailing'; b.v = 7; S.plan = {wps:[{x:b.pos.x + 5, y:b.pos.y, port:null, fish:0}], idx:0, speed:7, returning:false};
          S.crew[0].fatigue = 96; S.crew[0].morale = 10; const seen = {}; let t0 = CREW3D._st.clk, tk0 = {};
          for (const a of CREW3D.agents()) tk0[a.id] = a.tk || 0;
          for (let i = 0; i < 600; i++){ CREW3D._st.ctxT = -1e9; CREW3D.tick(0.05); for (const a of CREW3D.agents()) if (a.task === 'door') seen[a.id] = (seen[a.id] || 0) + 1; }
          const dt = CREW3D._st.clk - t0, A = CREW3D.agents();
          const rate = A.map(a => ({id:a.id, ef:+(a.ef || 1).toFixed(2), r:+((a.tk - tk0[a.id]) / dt).toFixed(2), mode:a.mode}));
          b.status = 'idle'; b.v = 0; S.plan = null; return {seen, rate}; })()""")
        crew_in = [x for x in door['rate'] if x['id'] != 'me']
        check(door['seen'] and all(4 <= v <= 16 for v in door['seen'].values()) and all(x['mode'] == 'in' for x in crew_in), 'under way the crew go in through the door with a hand to it first (about 0.6 s), and are in', door)
        tired = [x for x in door['rate'] if x['ef'] < 0.85]; fresh = [x for x in door['rate'] if x['ef'] >= 0.95]
        check(tired and fresh and max(x['r'] for x in tired) < min(x['r'] for x in fresh) - 0.05, 'the tired one works and walks at a slower beat than the rested', door['rate'])
        check(not errs, 'no page errors', errs[:3])
        await br.close()
    print('FEIL:' if bad else 'Alt OK', len(bad))

asyncio.run(main())
