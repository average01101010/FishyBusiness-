"""The life of the crew (core/14-crewlife.js del 2; docs/mannskap-plan.md): every hired person gets a family, a dream, savings that
start above nought and grow with what is earned, and a story; one whose savings reach the target gives a week's notice, goes ashore
in port to a boat of their own (S.alumni), fishes out of the home port on the AIS (alumniStates) and is back at the exchange after a
year or two for a smaller share; time off with a date runs out by itself; a fall in a heavy sea puts someone ashore for weeks.
Without 3D. Prints OK or FEIL."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:400])
    if not c: bad.append(msg)

SETUP = """(() => { const b = S.boat; S.tut = 0; S.cash = 1e6; S.t = Math.round((Date.UTC(2027, 2, 12, 5, 30) - EPOCH) / 6e4); S.settings.autoOn = false; S.boatName = 'Testbåten';
  b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; const q = portById('husoy'); b.pos = {x:q.p.x, y:q.p.y}; b.v = 0; S.plan = null; S.rest = null; S.alumni = [];
  S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:0, age:28, yrs:6}), Object.assign(genCrew(), {bi:false, off:false, fatigue:0, age:44, yrs:20})];
  S.crew.forEach(c => { c.job = null; delete c.life; }); S.crew[0].home = 'Tromsø'; S.crew[0].homePort = null; /* a home with no port in the game: the alumnus fishes out of the skipper's home port */ crewTick(S.t / 60);
  return S.crew.map(c => ({id:c.id, home:c.home, hp:c.homePort, life:c.life})); })()"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); await boot(pg)
        r = await pg.evaluate(SETUP)
        check(all(x['life'] and x['life']['fam'] and x['life']['goal'] in ('egenbat', 'skipper', 'ro') and x['life']['target'] >= 600000 and x['life']['story'] for x in r), 'everyone aboard has a family, a dream, a target and the first line of a story', r)
        check(all(0 < x['life']['saved'] <= 0.7 * x['life']['target'] for x in r), 'the savings start above nought and below 70 % of the target (endowed progress)', [x['life']['saved'] for x in r])
        # earnings go to the savings; the best settlement is a line in the story
        r2 = await pg.evaluate("(() => { const c = S.crew[0], s0 = c.life.saved; lifeEarn(c, 20000); return {d:c.life.saved - s0, kids:c.life.fam === 'kids', story:c.life.story.map(q => q[1])}; })()")
        check(r2['d'] in (5000, 8000) and (r2['d'] == 5000) == r2['kids'] and any('Beste' in q for q in r2['story']), 'a settlement of 20 000 kr puts 40 % (25 % with children) in the savings, and the best one is in the story', r2)
        # the dream within reach: the week's notice on the next morning, the departure in port when it is up
        r3 = await pg.evaluate("""(() => { const c = S.crew[0]; c.life.goal = 'egenbat'; c.life.saved = c.life.target; c.life.fam = 'single'; const id = c.id, name = c.name;
          S.t += 1440; crewTick(S.t / 60); const notice = c.life.notice, n1 = S.crew.length;   // the morning after: the notice
          S.t += 6 * 1440; crewTick(S.t / 60); const n2 = S.crew.length;   // six days on: still aboard
          S.boat.status = 'sailing'; S.t += 1440; crewTick(S.t / 60); const n3 = S.crew.length;   // the day it is up, but at sea: stays till port
          S.boat.status = 'port'; S.t += 60; crewTick(S.t / 60);
          const a = (S.alumni || []).find(x => x.id === id); return {notice:notice != null && notice > 0, n1, n2, n3, n4:S.crew.length, gone:!S.crew.some(x => x.id === id), alum:a && {boat:a.boat, hp:a.homePort, back:a.back > S.t + 300 * 1440, hasC:!!a.c, story:a.c && a.c.life && a.c.life.story.map(q => q[1])},
            msgs:S.msgs.slice(-4).map(m => m.from + ': ' + m.no)}; })()""")
        check(r3['notice'] and r3['n1'] == 2 and r3['n2'] == 2 and r3['n3'] == 2 and r3['n4'] == 1 and r3['gone'], 'the week\'s notice is given, and the hand goes ashore to a boat of their own in port when it is up, not at sea', r3)
        check(r3['alum'] and r3['alum']['boat'] and r3['alum']['back'] and r3['alum']['hasC'] and any('egen båt' in q for q in (r3['alum']['story'] or [])), 'the alumnus has a boat with a name, a return date a year or more on, and the story says so', r3['alum'])
        # the alumnus fishes out of the home port on the AIS (Senja grounds), and is quiet on Sunday (the hours by the clock: the game's
        # hour 0 is 06:00, EPOCH_HR)
        r4 = await pg.evaluate("""(() => { const a = S.alumni[0], out = [], D0 = Math.floor((S.t / 60 + EPOCH_HR) / 24) * 24 - EPOCH_HR; for (let d = 0; d < 7; d++){ const H0 = D0 + d * 24 + 10; const L = alumniStates(H0); out.push({wd:gDate(H0).getUTCDay(), n:L.length, st:L[0] && L[0].st, name:L[0] && L[0].name, land:L[0] ? (typeof isLand === 'function' ? isLand(L[0].p) : null) : null, id:L[0] && L[0].id}); }
          const night = alumniStates(D0 + 24 + 3).length, inAis = npcStates(D0 + 48 + 10).some(n => n.alum); return {out, night, inAis, g:a.g}; })()""")
        wk = [o for o in r4['out'] if o['wd'] != 0]; su = [o for o in r4['out'] if o['wd'] == 0]
        check(r4['g'] and all(o['n'] == 1 and o['st'] == 'fishing' for o in wk) and all(o['n'] == 0 for o in su) and r4['night'] == 0 and r4['inAis'], 'the alumnus fishes on a ground near home 07–15 on weekdays, not on Sunday or at night, and is among the AIS boats', r4)
        # back at the exchange after the years away, for a smaller share, with the story carried on
        r5 = await pg.evaluate("""(() => { const a = S.alumni[0], ask0 = a.c.ask; S.t = a.back + 60; S.bors = {pool:[], day:-1}; borsTick(S.t / 60); const c = S.bors.pool.find(x => x.id === a.id);
          return {back:!!c, left:S.alumni.length, ask:c && c.ask, ask0, story:c && c.life.story.map(q => q[1]).slice(-2)}; })()""")
        check(r5['back'] and r5['left'] == 0 and r5['ask'] < r5['ask0'] and any('Solgte' in q for q in (r5['story'] or [])), 'after the years away the old hand is back at the exchange for a smaller share, and the story says the boat was sold', r5)
        # time off with a date runs out by itself; a fall in a heavy sea puts someone ashore for weeks
        r6 = await pg.evaluate("""(() => { const c = S.crew[0]; lifeOff(c, 2, 'x', 'x', 'y', 'y'); const off1 = c.off; S.t += 1440; crewTick(S.t / 60); const off2 = c.off; S.t += 1440 + 60; crewTick(S.t / 60); const off3 = c.off;
          let hurt = 0; const r = Math.random; Math.random = () => 0; lifeInjury(c, 3.5); Math.random = r; hurt = c.off && c.offUntil > S.t + 13 * 1440; return {off1, off2, off3, hurt, story:c.life.story.map(q => q[1]).slice(-1)}; })()""")
        check(r6['off1'] and r6['off2'] and not r6['off3'], 'two days off run out by themselves', r6)
        check(r6['hurt'] and any('Skadet' in q for q in r6['story']), 'a fall on deck in a 3.5 m sea puts the hand ashore for two weeks or more', r6)
        check(not errs, 'no page errors', errs[:3])
        await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
