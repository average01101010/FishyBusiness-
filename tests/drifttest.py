# The operations plan (core/06d-drift.js, made anew 23.10.2026): the answers are the plan, the engine makes the trips.
#  - a jigging day: out at the hour, jig at the places in turn, land at the nearest plant, home, rest until rested, out again the next day
#  - line set and hauled on the same trip with the jig between; nets that stand a day are hauled and set again the next day
#  - without you aboard a skipper and a mate must be appointed; a boat with room for one hand waits while you are ashore
#  - the plan waits when you take the boat over, and stops by itself at a closed field and a used-up cod quota
#  - round the clock 2+2 needs four hands and bunks and never goes home; a long trip rests aboard and goes home at its end
#  - an older plan is switched off with a word
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

SETUP = """window.DT = {
  // a boat in the home harbour with crew, the skipper and the mate appointed, you ashore unless me
  boat: (vt, n, me) => { const b = S.boat, home = portById(S.home || HOME0); S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; WX_FORCE = {w:3, d:200};
    b.type = vt; applyVessel(); b.status = 'port'; b.port = home.id; b.pos = {...home.p}; b.anch = null; S.plan = null; S.hold = []; b.fuel = BOAT.fuelCap; b.ice = BOAT.iceCap; b.gear = true;
    S.crew = Array.from({length:n}, () => Object.assign(genCrew(), {bi:false, off:false, fatigue:10})); if (n){ setSkipper(S.crew[0].id); if (n > 1) setMate(S.crew[1].id); }
    S.lic = null; S.me = me ? S.cur : 'nobody'; S.sets = (S.sets || []).filter(s => s.vid !== S.cur); S.jobs = []; S.ops = null; return home.id; },
  // places at sea near home, deep enough, away from each other
  spots: (k, r0) => { const home = portById(S.home || HOME0), out = [];
    for (let r = r0 || 2; r < 12 && out.length < k; r += 0.5) for (let a = 0; a < 24 && out.length < k; a++){ const q = {x:home.p.x + r * Math.sin(a * 0.26), y:home.p.y - r * Math.cos(a * 0.26)};
      try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && out.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})) out.push(q); } catch (e){} }
    return out; },
  make: o => new Promise(res => driftMake(o, res)),
  // play the minutes as catch-up plays them; f(i) may stop the run by returning true
  run: async (mins, f) => { for (let i = 0; i < mins; i++){ DYN.on = false; step(); if (f && f(i)) return i; if (i % 120 === 0) await new Promise(r => setTimeout(r, 0)); } return mins; },
};"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate(SETUP)

        # 1. a jigging day with the crew, you ashore
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('sjark', 2, false), J = DT.spots(2, 2.5);
          await mapNeed(portById(home).p, 14);
          const o = S.ops = driftNew({home, rig:'juksa', jigs:J.map((q, i) => ({id:'j' + i, x:q.x, y:q.y})), dep:Math.floor(driftHod(S.t / 60)), wx:'tough'});
          R.err = await DT.make(o); R.made = driftMade(o); R.M = o.M; R.legs = Object.keys(o.legs).length; R.check = driftCheck(o);
          o.on = true; const b = S.boat, ev = []; let was = null, t0 = S.t, out2 = null, homeAt = null, restMax = 0;
          await DT.run(60 * 44, i => { const st = (S.plan && S.plan.ops ? S.plan.opsK : '-') + ':' + b.status + (b.port ? '@' + b.port : '');
            if (st !== was){ ev.push([Math.round((S.t - t0) / 6) / 10, st]); was = st; }
            if (homeAt == null && b.status === 'port' && b.port === home && o.rep.length) homeAt = S.t;
            if (homeAt != null && out2 == null && b.status !== 'port') out2 = S.t;
            if (homeAt != null) restMax = Math.max(restMax, ...S.crew.map(c => c.fatigue));
            return out2 != null || !o.on; });
          R.on = o.on; R.stop = o.stop; R.rep = o.rep.map(x => [x.kg, x.port]); R.ev = ev.slice(0, 30); R.homeAt = homeAt != null; R.out2 = out2 != null;
          R.fatOut = S.crew.map(c => Math.round(c.fatigue)); R.dayDep = out2 != null ? Math.round(driftHod(out2 / 60) * 10) / 10 : null; R.dep = o.dep;
          R.jigged = ev.some(e => /fish:fishing/.test(e[1])); R.marks = S.marks.filter(m => !m.g && m.t > t0).length; return R; }""")
        print('1:', json.dumps(r, ensure_ascii=False)[:2500])
        print(ok(not r['err'] and r['made'] and r['M'] and r['check']['ok']), 'a jigging plan is made: the plant, the legs, and its check passes', [r['err'], r['M'], r['legs'], r['check']['errors']])
        print(ok(r['jigged'] and r['marks'] >= 1 and len(r['rep']) >= 1 and r['rep'][0][1] == r['M']), 'the boat goes out, jigs at the places and lands at the nearest plant', r['rep'])
        print(ok(r['homeAt'] and r['out2'] and r['on']), 'after the day she goes home, rests, and goes out again', [r['homeAt'], r['out2'], r['stop']])
        print(ok(r['dayDep'] is not None and abs(r['dayDep'] - r['dep']) < 1.01 and max(r['fatOut']) <= 26), 'the next day begins at the hour, with the crew rested', [r['dayDep'], r['dep'], r['fatOut']])

        # 2. without you aboard: no skipper and mate appointed stops the plan; a boat with room for one hand waits
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('sjark', 2, false), J = DT.spots(1, 2.5);
          for (const c of S.crew){ delete c.sk; delete c.mate; }
          const o = S.ops = driftNew({home, rig:'juksa', jigs:[{id:'a', x:J[0].x, y:J[0].y}], dep:Math.floor(driftHod(S.t / 60))});
          R.check = driftCheck(o).errors; setSkipper(S.crew[0].id); setMate(S.crew[1].id); await DT.make(o); for (const c of S.crew){ delete c.sk; delete c.mate; }
          o.on = true; await DT.run(5); R.stop = o.stop && o.stop.k; R.on = o.on;
          // the skiff: one crew besides you
          const h2 = DT.boat('skiff', 1, false), o2 = S.ops = driftNew({home:h2, rig:'juksa', jigs:[{id:'a', x:J[0].x, y:J[0].y}], dep:Math.floor(driftHod(S.t / 60))});
          S.me = S.cur; await DT.make(o2); S.me = 'nobody'; o2.on = true; await DT.run(5); R.one = o2.wait && o2.wait.k; R.oneOn = o2.on; R.left = S.boat.status;
          S.me = S.cur; await DT.run(5); R.withMe = S.boat.status !== 'port' || !!S.plan; return R; }""")
        print('2:', json.dumps(r, ensure_ascii=False)[:900])
        print(ok(any('skipper' in e for e in r['check']) and r['stop'] == 'roles' and not r['on']), 'without you aboard, a skipper and a mate must be appointed, or the plan stops', [r['check'], r['stop']])
        print(ok(r['one'] == 'one' and r['oneOn'] and r['left'] == 'port' and r['withMe']), 'a boat with room for one hand waits while you are ashore, and goes with you aboard', r)

        # 3. line on one trip: set, jig, haul, land
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('sjark', 2, false), P = DT.spots(2, 3);
          S.equip.linehaler = true; S.pgear.kits.n = 4; const L = S.pgear.lines.hyse; L.n = 4; L.baited = 4; if (L.bt) L.bt = {makrell:4};
          const o = S.ops = driftNew({home, rig:'line', jig:true, fields:[{id:'f1', x:P[0].x, y:P[0].y, n:3, soak:6}], jigs:[{id:'j1', x:P[1].x, y:P[1].y}], dep:Math.floor(driftHod(S.t / 60)), wx:'tough'});
          R.err = await DT.make(o); o.on = true; const ev = [], t0 = S.t; let was = null, setAt = null, haulAt = null;
          await DT.run(60 * 20, i => { const g = S.boat.gop, st = g ? g.op + ':' + g.kind : S.boat.status; if (st !== was){ ev.push([Math.round((S.t - t0) / 6) / 10, st]); was = st; }
            if (g && g.op === 'set' && setAt == null) setAt = S.t; if (g && g.op === 'haul' && haulAt == null) haulAt = S.t; return o.rep.length >= 1 || !o.on; });
          R.ev = ev.slice(0, 24); R.set = setAt != null; R.haul = haulAt != null; R.soak = setAt != null && haulAt != null ? Math.round((haulAt - setAt) / 6) / 10 : null;
          R.rep = o.rep.map(x => x.kg); R.inSea = mySets().length; R.fid = (S.gearLog || []).slice(-1).map(e => e.fid); R.stop = o.stop; return R; }""")
        print('3:', json.dumps(r, ensure_ascii=False)[:1200])
        print(ok(not r['err'] and r['set'] and r['haul'] and r['soak'] is not None and r['soak'] >= 4 and len(r['rep']) >= 1 and r['inSea'] == 0), 'line is set, jigged beside and hauled on the same trip, then landed; nothing is left in the sea', [r['err'], r['soak'], r['rep'], r['inSea'], r['stop']])

        # 4. nets that stand a day: set on day one, hauled and set again on day two
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('sjark', 2, false), P = DT.spots(1, 3);
          S.equip.garnhaler = true; S.pgear.nets = [{id:'nx', mesh:180, ty:'bunn', n:12, cond:1, max:0.95}]; S.pgear.kits.n = 4;
          const o = S.ops = driftNew({home, rig:'garn', jig:false, fields:[{id:'g1', x:P[0].x, y:P[0].y, n:6, soak:24}], dep:Math.floor(driftHod(S.t / 60)), wx:'tough'});
          R.err = await DT.make(o); o.on = true; const ev = []; let sets = 0, hauls = 0, soak = null, reset = null;
          await DT.run(60 * 52, i => { const g = S.boat.gop; if (g && g.done === 0 && g.prog === 0){ if (g.op === 'set' && ev[ev.length - 1] !== 'set'){ sets++; ev.push('set'); } if (g.op === 'haul' && ev[ev.length - 1] !== 'haul'){ hauls++; ev.push('haul'); soak = Math.round(g.soak); reset = g.reset; } } return hauls >= 1 && sets >= 2 && mySets().length && !S.boat.gop || !o.on; });
          R.ev = ev; R.sets = sets; R.hauls = hauls; R.soak = soak; R.reset = reset; R.inSea = mySets().map(s => [s.n, s.fid]); R.rep = o.rep.length; R.stop = o.stop; R.lenker = S.pgear.nets.map(l => l.n); return R; }""")
        print('4:', json.dumps(r, ensure_ascii=False)[:900])
        print(ok(not r['err'] and r['sets'] >= 2 and r['hauls'] >= 1 and r['soak'] is not None and 18 <= r['soak'] <= 30 and r['reset']), 'nets are set on day one and hauled and set again a day later', [r['err'], r['ev'], r['soak'], r['reset']])
        print(ok(r['inSea'] and r['inSea'][0][0] == 6 and r['inSea'][0][1] == 'g1'), 'the field gets the number of nets it asks for, and the string is known as its field', r['inSea'])

        # 5. you take the boat over: the plan waits; it stops by itself at a closed field and a used-up cod quota
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('sjark', 2, true), J = DT.spots(1, 2.5);
          const o = S.ops = driftNew({home, rig:'juksa', jigs:[{id:'a', x:J[0].x, y:J[0].y}], dep:Math.floor(driftHod(S.t / 60))}); await DT.make(o); o.on = true;
          S.plan = {wps:[{x:J[0].x, y:J[0].y, port:null, fish:0}], idx:0, speed:6, returning:false}; await DT.run(3); R.held = !!o.held; S.plan = null; S.boat.status = 'port';
          driftResume(o); await DT.run(3); R.resumed = !o.held;
          // a closed field
          S.plan = null; S.boat.status = 'port'; S.boat.port = home; S.boat.pos = {...portById(home).p}; o.on = true; o.stop = null; o.day = null; o.last = null; o.hold = 0; o.wait = null;
          const rb = ruBlockMsg; ruBlockMsg = q => q.gear === 'juksa' && dist(q.p, J[0]) < 0.01 ? 'Stengt felt (test).' : rb(q); await DT.run(3); ruBlockMsg = rb; R.closed = o.stop && o.stop.k; R.closedOn = o.on; R.fix = o.stop && o.stop.fix;
          // the cod quota used up
          o.on = true; o.stop = null; o.hold = 0; S.lic = null; S.tripOwner = true; R.access = access(); const lim = codLimitNow(S.t / 60), q0 = quotaState().torsk; quotaState().torsk = lim + 10; await DT.run(3); R.quota = o.stop && o.stop.k; R.lim = lim; quotaState().torsk = q0; return R; }""")
        print('5:', json.dumps(r, ensure_ascii=False)[:700])
        print(ok(r['held'] and r['resumed']), 'the plan waits while you have the boat, and goes on when you give her back', r)
        print(ok(r['closed'] == 'closed' and not r['closedOn'] and r['fix'] == 'places'), 'a closed place stops the plan with what fixes it', r)
        print(ok(r['quota'] == 'quota' or r['access'] == 'none'), 'a used-up cod quota stops the plan', r)

        # 6. round the clock 2+2: four hands and bunks; lands and goes straight out again without going home. A long trip rests aboard.
        r = await pg.evaluate("""async () => { const R = {}, home = DT.boat('kyst15', 2, false), J = DT.spots(1, 3);
          const o = S.ops = driftNew({home, rig:'juksa', jigs:[{id:'a', x:J[0].x, y:J[0].y}], rhythm:'watch', dep:Math.floor(driftHod(S.t / 60)), wx:'tough'});
          R.need4 = driftCheck(o).errors.filter(e => /fire/.test(e)).length;
          DT.boat('kyst15', 4, false); S.ops = o; R.ok4 = driftCheck(o).ok; R.err = await DT.make(o); o.on = true; let homeBack = false, slept = 0, again = false;
          await DT.run(60 * 48, i => { const b = S.boat; if (b.status === 'port' && b.port === home && o.rep.length) homeBack = true; if (S.crew.some(c => c.sleepW)) slept++; if (o.rep.length && S.plan && S.plan.opsK === 'fish') again = true; return again && b.status === 'fishing' || !o.on; });
          R.again = again;
          R.rep = o.rep.length; R.homeBack = homeBack; R.slept = slept; R.stop = o.stop; R.wait = o.wait;
          // a long trip with two hands: the crew rest aboard at the plant's quay when they have had enough, and the trip ends at home
          DT.boat('kyst15', 2, false); const o2 = S.ops = driftNew({home, rig:'juksa', jigs:[{id:'a', x:J[0].x, y:J[0].y}], rhythm:'multi', days:2, dep:Math.floor(driftHod(S.t / 60)), wx:'tough'});
          R.err2 = await DT.make(o2); o2.on = true; let rested = false, home2 = false;
          await DT.run(60 * 60, i => { if (o2.wait && o2.wait.k === 'rest' && S.boat.port !== home) rested = true; if (o2.rep.length && S.boat.status === 'port' && S.boat.port === home) home2 = true; return home2 || !o2.on; });
          R.rested = rested; R.home2 = home2; R.rep2 = o2.rep.length; R.stop2 = o2.stop; R.wait2 = o2.wait; R.restA = o2.restA; return R; }""")
        print('6:', json.dumps(r, ensure_ascii=False)[:900])
        print(ok(r['need4'] >= 1 and r['ok4'] and not r['err'] and r['rep'] >= 1 and r['again'] and not r['homeBack'] and r['slept'] > 0), 'round the clock needs four hands; it lands and goes out again without going home, with a watch asleep', r)
        print(ok(not r['err2'] and r['rested'] and r['home2']), 'a long trip rests aboard away from home and goes home at its end', [r['rested'], r['home2'], r['rep2'], r['stop2']])

        # 7. an older plan is switched off with a word
        r = await pg.evaluate("""() => { S.ops = {v:2, on:true, sess:[{id:'x', type:'tur', dep:5}]}; const n = S.msgs.length; const o = driftOps(); return {o:o, gone:S.ops === null, msg:S.msgs.length > n ? S.msgs[S.msgs.length - 1].no : null}; }""")
        print(ok(r['o'] is None and r['gone'] and r['msg'] and 'laget på nytt' in r['msg']), 'an older plan is switched off with a word', r['msg'])
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
