from _env import GAME, boot
# The crew's work at sea (Jonas 09.10.2026; core/10b-gearcare.js seaWork, core/05-vessels.js): with a crew aboard, baiting, hooks and
# mending go on while the boat is under way or lying still, and wait while the crew fishes or guts; the skipper alone cannot do it at
# sea; the crew baits the free tubs by itself at sea; and now and then it says how the gear, the hooks and the bait stand (once a day
# each), with a word when a job is done. Prints OK or FEIL per check.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
SEED = """(()=>{ let a = 20261009; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })()"""
PREP = """(()=>{ S.equip.linehaler = S.equip.garnhaler = S.equip.teinehaler = true; S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.stock = initStock();
  const b = S.boat; b.type = 'sjark'; applyVessel(); b.gear = true;
  S.pgear = newPGear(); S.jobs = []; S.sets = []; S.crew = []; for (let i = 0; i < 2; i++) S.crew.push(Object.assign(genCrew(), {bi:false, off:false}));
  // out at sea, lying still, away from land
  const p = portById('finnsnes').p; b.status = 'idle'; b.port = null; b.pos = {x:p.x + 3, y:p.y + 2}; S.plan = null;
  window.mins = n => { for (let i = 0; i < n; i++){ S.t += 1; step(); } };
})()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await br.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); await pg.evaluate(SEED); await pg.evaluate(PREP)
        r = await pg.evaluate("""(()=>{ const R = {}, pg = S.pgear, b = S.boat;
          const L = pg.lines.hyse; L.n = 4; L.baited = 0; baitOf(pg).makrell = 40;
          R.sea = seaWork(); R.why = careWhy();
          // baiting at sea by order: a job with its time, done after it
          R.e1 = egnSelf('hyse', 2); const j = S.jobs.find(x => x.kind === 'egn'); R.until = j && j.until != null; const h = j ? j.h : 0;
          // the crew fishes for an hour: the job waits
          const u0 = j.until; b.status = 'fishing'; b.fishUntil = S.t + 600; mins(60); R.waited = j.until - u0 >= 59; b.status = 'idle'; b.fishUntil = null;
          const m0 = S.msgs.length, l0 = S.log.length; S.sayT = -1e9; mins(Math.ceil(h * 60) + 5); R.done = !S.jobs.some(x => x.kind === 'egn') && L.baited >= 2;
          R.doneTalk = S.log.slice(l0).some(x => /«/.test(x.no || ''));
          // the crew baits the rest by itself at sea (careTick once an hour)
          CARE_LAST = -1; S.sayT = -1e9; mins(1); R.autoQueued = S.jobs.some(x => x.kind === 'egn'); mins(600); R.allBaited = L.baited >= 4 && L.n >= 4;
          // the hooks run out: someone says so, once
          L.miss = 0.2; pg.hooks = 0; S.gsay = {}; S.sayT = -1e9; CARE_LAST = -1; const l1 = S.log.length; mins(1);
          R.hookTalk = S.log.slice(l1).map(x => x.no).join(' | '); S.sayT = -1e9; CARE_LAST = -1; const l2 = S.log.length; mins(1); R.hookTalk2 = S.log.slice(l2).filter(x => /krok/i.test(x.no || '')).length;
          // no bait for the tubs that need it
          pg.lines.hyse.baited = 0; baitOf(pg).makrell = 0; S.gsay = {hooksOut:S.t, hooksLow:S.t}; S.sayT = -1e9; CARE_LAST = -1; const l3 = S.log.length; mins(1); R.baitTalk = S.log.slice(l3).map(x => x.no).join(' | ');
          // alone aboard, at sea: not possible
          const crew = S.crew; S.crew = []; R.alone = careWhy(); R.aloneEgn = egnSelf('hyse', 1); S.crew = crew;
          // on a standing plan (Jonas 10.10.2026): the crew still baits and changes hooks at sea; nets are mended unless the plan fishes nets
          S.jobs = []; const L2 = pg.lines.hyse; L2.n = 4; L2.baited = 0; baitOf(pg).makrell = 40; pg.hooks = 500; L2.miss = 0; S.plan = {ops:true, wps:[{}], idx:0};
          CARE_LAST = -1; careTick(); R.planBait = S.jobs.some(x => x.kind === 'egn'); S.jobs = [];
          L2.n = 4; L2.baited = 4; L2.miss = 0.3; CARE_LAST = -1; careTick(); R.planHooks = S.jobs.some(x => x.kind === 'hk'); S.jobs = []; L2.miss = 0;
          pg.nets.push({id:'nT', mesh:60, ty:'x', n:4, cond:0.3, max:0.95}); b.rig = 'garn'; CARE_LAST = -1; careTick(); R.planNetsKept = !S.jobs.some(x => x.kind === 'mend') && pg.nets.some(x => x.id === 'nT'); S.jobs = [];
          b.rig = 'line'; CARE_LAST = -1; careTick(); R.planNetsMended = S.jobs.some(x => x.kind === 'mend'); S.plan = null; S.jobs = [];
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False)[:1400])
        print(ok(r['sea'] and r['why'] is None and r['e1'] is None and r['until']), 'with a crew aboard, out at sea and lying still, the line can be baited, and the job starts at once')
        print(ok(r['waited'] and r['done'] and r['doneTalk']), 'the job waits while the crew fishes, is done afterwards, and someone says so')
        print(ok(r['allBaited']), 'the crew baits the free tubs by itself at sea with the bait aboard')
        print(ok('krok' in r['hookTalk'].lower() and r['hookTalk2'] == 0), 'out of hooks: someone says so, and not again the same day', r['hookTalk'])
        print(ok('agn' in r['baitTalk'].lower()), 'out of bait for the tubs: someone says so', r['baitTalk'])
        print(ok(r['planBait'] and r['planHooks']), 'on a standing plan the crew still baits and changes hooks at sea', r['planBait'], r['planHooks'])
        print(ok(r['planNetsKept'] and r['planNetsMended']), 'on a net plan the nets stay aboard for the next set; on other plans the crew mends them', r['planNetsKept'], r['planNetsMended'])
        print(ok(r['alone'] and r['aloneEgn']), 'the skipper alone cannot do it at sea', r['alone'])
        print('errors:', errs[:3]); await br.close()

asyncio.run(main())
