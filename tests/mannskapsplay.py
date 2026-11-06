"""Mannskapsplay (06.11.2026, Ø8): a Playwright player keeps a crew at sea for three days in «Det Store Blå», without drawing 3D, and
writes down every hour what the crew system does to them: the skipper's energy and sleep, each hand's fatigue and morale, the food on
board (the meals and their quality), the quarrels, the team spirit and who signs off. Four scenarios, after backlog 10.2 «Mannskapet er
ikke spilltestet»: a crew with nobody who can cook (kokk under 3), the same crew with one cook of 4, the same again with the skipper in the
bunk at night, and a boat with no galley at all (a packed lunch when the meal is due). The pattern is tests/fiskeplay.py: only the scenario is set up by script (the boat, the date, the
place, the crew from genCrew with a fixed seed, clothes for everybody); the hours go with step(), the game's own minute, in the rhythm of
a long trip: jigging from 06 to 22, lying still at sea the eight hours of the night. The hold is emptied by the script when it is nearly
full, so the fishing goes on (this is a test of the crew, not of the catch). Nothing is answered for the player: a quarrel is left as the
game leaves it, so the test shows what happens when nobody taps «Mannskap».

  python3 tests/mannskapsplay.py                 all three scenarios, 72 hours each, landscape 1280×800 (about 2 minutes a scenario)
  python3 tests/mannskapsplay.py utenkokk         only the scenarios named: utenkokk, medkokk, medkoye, utenbysse
  KYST_MP_HOURS=24 python3 tests/mannskapsplay.py      shorter
  KYST_MP_FMT=staaende python3 tests/mannskapsplay.py  upright 800×1280 (the pictures of the Mannskap page)

Each scenario writes tests/out/mannskapsplay/<scenario>/timer.csv (one row an hour) and steps.json (the rows, the crew, the notes and
the page errors), and a picture of the Mannskap page (Om bord › Mannskap) at the start and after 24, 48 and 72 hours. The report is
docs/playtest/rapport-4-mannskap.md. Not in run.py: a review tool, as fiskeplay.py and uiplay.py.
"""
import asyncio, csv, json, os, sys, time
from _env import GAME_TUT, boot, OUT
from playwright.async_api import async_playwright

FMT = os.environ.get('KYST_MP_FMT', 'liggende')
W, H = (1280, 800) if FMT == 'liggende' else (800, 1280)
HOURS = int(os.environ.get('KYST_MP_HOURS', '72'))
URL = GAME_TUT + '#notut,no3d'
ROOT = os.path.join(OUT, 'mannskapsplay')
FISH_FROM, FISH_TO = 6, 22   # the day's jigging, by the game's clock

HOOK = r"""(() => {
  if (window.MP) return;
  // the crew is drawn with a seed of its own inside the block (mulberry32, as caretest and worktest), because the game's loop draws numbers between the blocks
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const SEEN = new WeakSet(); for (const x of S.log) SEEN.add(x); for (const x of S.msgs) SEEN.add(x);
  const fresh = a => a.filter(x => x && typeof x === 'object' && !SEEN.has(x) && (SEEN.add(x), true));
  window.MP = {
    date(y, m, d, h){ S.t = Math.round((Date.UTC(y, m - 1, d, h) - EPOCH) / 60000); refreshAll(); },
    vessel(type){ const b = S.boat; b.type = type; applyVessel(); b.fuel = BOAT.fuelCap; b.ice = Math.min(300, BOAT.holdCap); refreshAll();
      return {type, len:VESSELS[type].len, crewMax:BOAT.crewMax, galley:(BOAT.fac || {}).galley || 'bysse', wc:!!(BOAT.fac || {}).wc, house:(BOAT.fac || {}).house, cap:Math.round(capHold()), berths:BOAT.berths}; },
    // n hands from genCrew with the seed; kokk[i] sets a hand's cooking skill (null leaves it); none is on a side job, every trait is known
    crew(n, seed, kokk){ const r0 = Math.random; Math.random = mul(seed); S.crew = []; for (let i = 0; i < n; i++){ const c = genCrew(); c.bi = false; c.biDays = null; c.known = [true, true]; S.crew.push(c); } Math.random = r0;
      (kokk || []).forEach((k, i) => { if (S.crew[i] && k != null) S.crew[i].attr.kokk = k; }); S.team = null; S.meal = null; S.cevt = null; S.workLog = []; refreshAll();
      return S.crew.map(c => ({name:c.name, age:c.age, lv:c.lv, kokk:c.attr.kokk, uth:c.attr.uth, erf:c.attr.erf, traits:c.traits, ask:c.ask, share:c.share, morale:c.morale, fatigue:c.fatigue})); },
    async sea(p){ await mapNeed(p, MAPD.simR); const b = S.boat; S.plan = null; b.status = 'idle'; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; b.gop = null; b.fishUntil = null; if (typeof DOCK !== 'undefined') DOCK.close(); refreshAll(); },
    // a spot at sea within r km of c, between two depths, where sp stands thickest now (fiskeplay.py FP.spot)
    async spot(c, r, d0, d1, sp){ await mapNeed(c, MAPD.simR); const H0 = S.t / 60; let best = null, bv = -1;
      for (let i = 0; i <= 24; i++) for (let k = 0; k < Math.max(1, i * 8); k++){ const a = k / Math.max(1, i * 8) * 2 * Math.PI, q = {x:c.x + Math.cos(a) * r * i / 24, y:c.y + Math.sin(a) * r * i / 24};
        try { if (isLand(q)) continue; const d = depthF(q); if (!(d >= d0 && d <= d1)) continue; let ok = true; for (let j = 0; j < 8 && ok; j++){ const t = j / 8 * 2 * Math.PI; if (isLand({x:q.x + Math.sin(t) * 0.25, y:q.y - Math.cos(t) * 0.25})) ok = false; } if (!ok) continue;
        const v = sp ? density(sp, q, H0) : 1; if (v > bv){ bv = v; best = q; } } catch (e){} }
      return best && {x:best.x, y:best.y, depth:Math.round(depthF(best)), dens:sp ? +bv.toFixed(3) : null}; },
    fish(hours){ const b = S.boat; b.status = 'fishing'; b.fishUntil = S.t + hours * 60; b.deckStop = false; b.gop = null; refreshAll(); },
    still(){ const b = S.boat; b.status = 'idle'; b.fishUntil = null; b.deckStop = false; refreshAll(); },
    // an hour goes minute by minute as the game steps it (the manoeuvring model aside, as the game does when it plays time caught up);
    // the hold is emptied by the script at 80 % so the jig goes on, and fishing that ended of itself (full) is started again
    hour(fishing){ if (typeof DYN !== 'undefined') DYN.on = false; let dumped = 0, sleptMin = 0, restarted = 0; try { TAB.held = true; } catch (e){}   // (the game's own tick is held while the test steps, testing.md)
      for (let n = 0; n < 60; n++){ if (fishing){ if (holdTotal() > capHold() * 0.8){ dumped += holdTotal(); S.hold = []; } if (S.boat.status !== 'fishing'){ S.boat.status = 'fishing'; S.boat.fishUntil = S.t + 24 * 60; S.boat.deckStop = false; restarted++; } }
        step(); if (S.sleep) sleptMin++; }
      try { TAB.held = false; lastWall = Date.now(); } catch (e){} refreshAll(); return {dumped:Math.round(dumped), sleptMin, restarted}; },
    read(){ const b = S.boat, H0 = S.t / 60, M = S.meal || {}, T = S.team || {}; let hs = null, cold = null, wind = null;
      try { hs = +hsAt(b.pos, H0).toFixed(2); wind = Math.round(windAt(H0)); cold = +coldPen(H0, hs).toFixed(2); } catch (e){}
      const eff = c => { try { const e = crewEffort(c, H0, hs || 0); return {f:+e.f.toFixed(2), word:e.word}; } catch (e){ return null; } };   // (crewEffort gives {f, lvl, word, why, text})
      return {t:S.t, time:new Date(EPOCH + S.t * 60000).toISOString().slice(0, 16).replace('T', ' '), st:b.status, energy:Math.round(S.energy), sleep:!!S.sleep, drowsy:!!S.drowsy, hs, wind, cold,
        food:+foodScore().toFixed(2), meals:(M.hist || []).slice(), lastMeal:M.last ? {q:M.last.q, by:M.last.by, at:new Date(EPOCH + M.last.t * 60000).toISOString().slice(11, 16)} : null, due:M.due != null ? Math.round((M.due - S.t)) : null,
        team:T.v != null ? Math.round(T.v) : null, cevt:S.cevt ? {type:S.cevt.type, topic:S.cevt.topic, ageH:+((S.t - S.cevt.t0) / 60).toFixed(1), esc:!!S.cevt.esc} : null,
        crew:S.crew.map(c => ({name:c.name.split(' ')[0], fatigue:Math.round(c.fatigue), morale:Math.round(c.morale), low:c.low || 0, cut:!!c.cut, eff:eff(c), grudge:Object.keys(c.grudge || {}).length})),
        n:S.crew.length, hold:Math.round(holdTotal()), cap:Math.round(capHold()), log:fresh(S.log).map(x => x.no), msgs:fresh(S.msgs).map(m => m.from + ': ' + m.no)}; },
    hud(){ const e = document.getElementById('hud'); return e ? (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 300) : ''; },
    drawer(){ const e = document.getElementById('drawerBody'); return e ? (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2500) : ''; },
  };
})()"""


class Player:
    def __init__(self, br, name):
        self.br, self.name = br, name
        self.dir = os.path.join(ROOT, name); os.makedirs(self.dir, exist_ok=True)
        for f in os.listdir(self.dir):
            if f.endswith('.png'): os.remove(os.path.join(self.dir, f))
        self.rows, self.notes, self.errs, self.shots = [], [], [], []

    async def start(self):
        self.ctx = await self.br.new_context(viewport={'width': W, 'height': H}, has_touch=True)
        self.pg = await self.ctx.new_page()
        self.pg.on('pageerror', lambda e: self.errs.append({'h': len(self.rows), 'err': (getattr(e, 'stack', '') or str(e))[:400]}))
        t = time.time(); await boot(self.pg, URL); await self.pg.evaluate(HOOK)
        await self.pg.evaluate("S.mult = 1; S.settings.autoOn = false")
        self.note('boot', 'game started in %.0f s' % (time.time() - t))

    def note(self, kind, text):
        self.notes.append({'h': len(self.rows), 'kind': kind, 'text': text}); print('   [%s] %s' % (kind, text), flush=True)

    async def js(self, code, *a): return await self.pg.evaluate(code, *a)

    async def shot(self, name, note=''):
        # the Mannskap page as the player sees it: Om bord › Mannskap (DOCK.open('arbeid') lands on that tab, 10c-dock.js)
        await self.js("DOCK.open('arbeid')"); await self.pg.wait_for_timeout(500)
        f = '%s.png' % name
        try: await self.pg.screenshot(path=os.path.join(self.dir, f), timeout=120000)
        except Exception as e: self.note('shot', 'failed %s %s' % (name, e))
        txt = await self.js("MP.drawer()"); hud = await self.js("MP.hud()")
        self.shots.append({'f': f, 'h': len(self.rows), 'note': note, 'hud': hud, 'mannskap': txt})
        await self.js("DOCK.close()")
        print('  %s %s | %s | %s' % (self.name, f, note, txt[:160]), flush=True)

    async def close(self):
        json.dump({'scenario': self.name, 'format': FMT, 'hours': HOURS, 'setup': getattr(self, 'setup', None), 'rows': self.rows, 'shots': self.shots, 'notes': self.notes, 'pageerrors': self.errs},
                  open(os.path.join(self.dir, 'steps.json'), 'w'), ensure_ascii=False, indent=1)
        with open(os.path.join(self.dir, 'timer.csv'), 'w', newline='') as f:
            w = csv.writer(f); names = [c['name'] for c in (self.rows[0]['crew'] if self.rows else [])]
            w.writerow(['time', 'tur_t', 'status', 'energi', 'sover', 'hs_m', 'vind', 'kulde', 'mat', 'siste_maaltid', 'samhold', 'krangel', 'om_bord', 'last_kg'] + sum([[n + '_slit', n + '_trivsel', n + '_innsats'] for n in names], []))
            for i, r in enumerate(self.rows):
                by = {c['name']: c for c in r['crew']}
                w.writerow([r['time'], i + 1, r['st'], r['energy'], int(r['sleep']), r['hs'], r['wind'], r['cold'], r['food'], (r['lastMeal'] or {}).get('q'), r['team'], (r['cevt'] or {}).get('topic') or '', r['n'], r['hold']]
                           + sum([[by[n]['fatigue'], by[n]['morale'], (by[n]['eff'] or {}).get('f')] if n in by else ['', '', ''] for n in names], []))
        if self.errs: print('  PAGE ERRORS', self.name, json.dumps(self.errs, ensure_ascii=False)[:1200])
        await self.ctx.close()


SCEN = {}
def scenario(f): SCEN[f.__name__] = f; return f

async def three_days(pl, boat, ncrew, kokk, seed=7, clothes=True, koye=False):
    """The common course: 1 March at Husøy, out on the cod spot north of Senja, jigging 06–22 and still at night, HOURS hours.
    With koye the skipper goes down in the bunk at 22 («Hvil i køya», restStart) and comes up at 06 (restEnd), as the game offers on a boat with berths."""
    v = await pl.js("MP.vessel(%r)" % boat); await pl.js("MP.date(2027, 3, 1, %d)" % FISH_FROM)
    await pl.js("S.cash = 300000; S.clothes = {olje:%d, varme:%d}" % ((8, 8) if clothes else (0, 0)))
    crew = await pl.js("MP.crew(%d, %d, %s)" % (ncrew, seed, json.dumps(kokk)))
    pl.setup = {'boat': v, 'crew': crew, 'clothes': clothes, 'koye': koye, 'rhythm': 'jig %02d–%02d, still at night%s' % (FISH_FROM, FISH_TO, ', the skipper in the bunk' if koye else '')}
    pl.note('setup', 'boat %s' % json.dumps(v, ensure_ascii=False))
    for c in crew: pl.note('setup', 'crew %s' % json.dumps(c, ensure_ascii=False))
    q = await pl.js("async () => await MP.spot(portById('husoy').p, 8, 20, 90, 'torsk')")
    if not q: pl.note('setup', 'no spot found'); return
    await pl.js("p => MP.sea(p)", q); pl.note('setup', 'out on %s m, cod density %s, north of Senja; the sail is skipped' % (q['depth'], q['dens']))
    await pl.js("MP.fish(%d)" % 24)
    await pl.shot('t00', 'the Mannskap page at the start, 06:00 day 1')
    for h in range(1, HOURS + 1):
        hr = (FISH_FROM + h - 1) % 24   # the hour that is about to go
        fishing = FISH_FROM <= hr < FISH_TO
        if hr == FISH_TO:
            await pl.js("MP.still()")
            if koye: pl.note('koye', 'Hvil i køya at 22: %s' % await pl.js("(() => { restStart(); return JSON.stringify({rest:S.rest, resting:resting(), where:restWhere(S.boat)}); })()"))
        if hr == FISH_FROM and h > 1:
            if koye: pl.note('koye', 'Opp av køya at 06: energy %s' % await pl.js("(() => { restEnd(); return Math.round(S.energy); })()"))
            await pl.js("MP.fish(24)")
        r = await pl.js("f => MP.hour(f)", fishing)
        st = json.loads(await pl.js("JSON.stringify(MP.read())")); st.update(r); pl.rows.append(st)
        cm = ' '.join('%s %d/%d' % (c['name'], c['fatigue'], c['morale']) for c in st['crew'])
        print('  %s h%02d %s %-8s energi %3d%s | mat %.2f%s | samhold %s | %s | %s%s%s' % (pl.name, h, st['time'], st['st'], st['energy'], ' sover' if st['sleep'] else '', st['food'],
              (' siste %s' % st['lastMeal']['q']) if st['lastMeal'] else '', st['team'], cm, ('krangel %s %sh ' % (st['cevt']['topic'], st['cevt']['ageH'])) if st['cevt'] else '', ('tømt %d kg ' % r['dumped']) if r['dumped'] else '', ' '.join(st['log'] + st['msgs'])[:220]), flush=True)
        if h in (24, 48, 72): await pl.shot('t%02d' % h, 'the Mannskap page after %d hours' % h)
        if st['n'] < ncrew: pl.note('quit', 'the crew is down to %d after %d hours' % (st['n'], h))
    if HOURS not in (24, 48, 72): await pl.shot('t%02d' % HOURS, 'the Mannskap page at the end')


@scenario
async def utenkokk(pl):
    """Breisjark (10,99 m, a galley) with three hands, none of whom can cook (kokk at most 2): dry bread when nobody cooks."""
    await three_days(pl, 'breisjark', 3, [2, 1, 2])

@scenario
async def medkokk(pl):
    """The same boat and the same three hands, the first of them a cook of 4."""
    await three_days(pl, 'breisjark', 3, [4, 1, 2])

@scenario
async def medkoye(pl):
    """As medkokk, and the skipper rests in the bunk at night (the boat has four berths), as the game offers with «Hvil i køya»."""
    await three_days(pl, 'breisjark', 3, [4, 1, 2], koye=True)

@scenario
async def utenbysse(pl):
    """Snekke (7,9 m, no galley, an open boat) with the first two of the same hands: a packed lunch and coffee from the flask."""
    await three_days(pl, 'snekke', 2, [4, 1])


async def main():
    names = [a for a in sys.argv[1:] if not a.startswith('-')] or list(SCEN)
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-compositing'])
        summary = {}
        for nm in names:
            print('== scenario', nm, FMT, HOURS, 'hours', flush=True); t = time.time()
            pl = Player(br, nm)
            try:
                await pl.start(); await SCEN[nm](pl)
            except Exception:
                import traceback; pl.note('crash', traceback.format_exc()[-1500:])
            last = pl.rows[-1] if pl.rows else {}
            summary[nm] = {'s': round(time.time() - t), 'hours': len(pl.rows), 'crew_left': last.get('n'), 'food_end': last.get('food'), 'team_end': last.get('team'),
                           'morale_end': [c['morale'] for c in last.get('crew', [])], 'quarrels': len({(r['cevt']['type'], r['cevt']['topic'], round(r['t'] - r['cevt']['ageH'] * 60)) for r in pl.rows if r.get('cevt')}),
                           'skipper_sleeps': sum(1 for i, r in enumerate(pl.rows) if r['sleep'] and not (i and pl.rows[i - 1]['sleep'])), 'pageerrors': len(pl.errs)}
            await pl.close()
        print(json.dumps(summary, indent=1))
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
