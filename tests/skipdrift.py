"""Skippertak on the operations plan (core/06g-plan2.js planDay, plan2NextDep; 06h-plan2-engine.js plan2SkipGiven, the rest step;
15-energy.js giveSkip). The Kaiboden tab promises «et døgn uten hvile … også på driftsplanen» and, for Max, «Driftsplanene går døgnet
rundt» (Jonas 06.11.2026: «Døgnet rundt»). Before 06.11.2026 the plan's own engine (plan2, since 27.10) ignored it: Max for four days
gave the same hours at sea and the same catch as nothing, a plan waiting for the rest or your energy kept waiting after the purchase,
and a player resting at a rorbu stayed there and paid for the nights. A day-rhythm jig plan on a sjark with two hands (the harness of
driftsplan2test.py, D2), run through the minute step, bought through the shop's own path (shopGive), no reload.
KYST_LITE=1 python3 tests/skipdrift.py. Prints OK or FEIL."""
from _env import boot
import asyncio, json, re, os
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
D2 = re.search(r'D2 = r"""(.*?)"""', open(os.path.join(HERE, 'driftsplan2test.py')).read(), re.S).group(1)


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


# a plan2 day-rhythm jig plan on a sjark with 2 crew, you aboard or not; Skippertak from the start (skip0) or bought at minute giveAt
PLAN = """async (args) => { D2.reset(args.seed || 25); const home = D2.boat('sjark', 2, !!args.me); await mapNeed(portById(home).p, 14);
  const J = D2.spots(2, 2.5, 6);
  const o = S.ops = plan2New({home, rig:'juksa', jig:true, places:[D2.juks('j1', J[0]), D2.juks('j2', J[1])], dep:5, land:{mode:'near', port:null, when:'trip'}, rhythm:'day', days:3});
  o.M = D2.plant(o);
  const err = await D2.make(o); if (err) return {err}; o.on = true;
  if (args.energy != null) S.energy = args.energy;
  if (args.fat != null) for (const c of S.crew) c.fatigue = args.fat;
  if (args.skip0) shopGive({data:{give:'skip', k:args.skip0}});
  let seaMin = 0, gave = null; const waits = [];
  const hook = i => {
    if (args.giveAt != null && i === args.giveAt){ gave = {wait:o.run && o.run.wait ? o.run.wait.k : null}; shopGive({data:{give:'skip', k:'std'}}); }
    if (S.boat.status !== 'port' && !S.boat.anch) seaMin++;
    const w = o.run && o.run.wait; if (w && (!waits.length || waits[waits.length - 1][1] !== w.k)) waits.push([D2.when(S.t), w.k, (w.no || '').slice(0, 90)]);
  };
  const L = await D2.run(args.mins, 'closed', 'x', hook);
  return {seaH:+(seaMin / 60).toFixed(1), kg:L.stats.sum.kg, trips:L.stats.sum.trips, gave, waits:waits.slice(0, 12)};
}"""

RORBU = """(() => { D2.reset(4); D2.boat('sjark', 2, true); const R = {}; const rb = portById(RORBUER[0].id), b = S.boat; b.port = rb.id; b.pos = {...rb.p}; b.status = 'port';
  S.energy = 20; restStart(); R.rest0 = S.rest && S.rest.w; const c0 = S.cash;
  shopGive({data:{give:'skip', k:'max'}}); R.restAfter = !!S.rest && resting(); R.en = S.energy;
  for (let i = 0; i < 24 * 60; i++) step(); R.nights = S.log.filter(l => /En natt til på rorbua/.test(l.no)).length; return R; })()"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate(D2)
        await pg.evaluate("lifeDay = () => {}; lifeInjury = () => {};")
        await pg.evaluate("() => { window.PLAN = " + PLAN + "; }")
        run = lambda a: pg.evaluate("PLAN(%s)" % json.dumps(a))
        # 1. four days of day rhythm, Max from the start against none: round the clock
        a, m = await run({'mins': 4 * 1440}), await run({'mins': 4 * 1440, 'skip0': 'max'})
        rests = [w for w in m['waits'] if w[1] in ('rest', 'dep', 'energy')]
        check(m['seaH'] > 1.7 * a['seaH'] and m['kg'] > 1.6 * a['kg'], 'Skippertak Max i fire døgn: planen går døgnet rundt (timer på sjøen og fangst mot ingen drikk)', {'h': [a['seaH'], m['seaH']], 'kg': [a['kg'], m['kg']], 'turer': [a['trips'], m['trips']]})
        check(not rests, 'med Max hviler ikke mannskapet og venter ikke på avgangstimen', rests[:3])
        # 2. the plan waits for your energy («Du må hvile til kl. …»): bought in the wait, she goes at once
        c, s = await run({'me': True, 'energy': 0, 'mins': 1440}), await run({'me': True, 'energy': 0, 'mins': 1440, 'giveAt': 130})
        check(s['gave'] and s['gave']['wait'] == 'energy' and s['seaH'] > c['seaH'] + 6 and s['kg'] > c['kg'], 'kjøpt mens planen venter på energien din: båten går med en gang, uten ny innlasting', {'h': [c['seaH'], s['seaH']], 'kg': [c['kg'], s['kg']], 'ventet': s['gave']})
        # 3. tired hands, the day laid short and the trip under way: bought then, the day after it goes on without the rest
        c, s = await run({'fat': 90, 'mins': 2 * 1440}), await run({'fat': 90, 'mins': 2 * 1440, 'giveAt': 150})
        rests = [w for w in s['waits'] if w[1] == 'rest']
        check(s['seaH'] > 2 * c['seaH'] and s['kg'] > 2 * c['kg'] and not rests, 'slitne folk, kjøpt etter avgang: ingen hvile etter turen, og neste tur går straks', {'h': [c['seaH'], s['seaH']], 'kg': [c['kg'], s['kg']], 'hvile': rests[:2]})
        # 4. resting at a rorbu: the drink takes you aboard, and no more nights are paid
        r = await pg.evaluate(RORBU)
        check(r['rest0'] == 'rorbu' and not r['restAfter'] and r['nights'] == 0, 'hviler på rorbua: Skippertak tar deg om bord, og ingen flere netter betales', r)
        print('sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
