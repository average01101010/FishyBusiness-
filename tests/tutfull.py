"""Ø8b S0, a full hold on the first trip (V3 C in docs/planer/spillbarhet-fangst.md, Jonas 06.11.2026): the guarantee tops up to a full
hold (capHold(), 500 kg in the starting boat) within the hour on the field, only while the boat fishes; a player who stops early lands what is
aboard; and «what fishing gives here» (tutNormKg) is per hour actually jigged and leaves the top-up out. Runs fish() and deckMinute()
minute by minute on the guide's field in March, as heattest's tutorial part does, without 3D. `--kyst` (needs the whole coast in the
build: tools/map/release.py, tools/map/game.py) does the same on the first trip's own field near Bergen, Bodø and Hammerfest (tutFieldNear,
ui/08c-start.js), the stikkprøve along the coast. Prints OK/FEIL lines."""
from _env import GAME, boot
import asyncio, json, sys
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK   ' if ok else 'FEIL ') + what + ('  ' + json.dumps(extra, ensure_ascii=False) if extra != '' else ''))

RUN = """(([mins, stopAt, alone, fld]) => {
  const keep = {tut:S.tut, haill:S.haill, stock:S.stock, type:S.boat.type}, b = S.boat;
  b.type = 'trebat'; applyVessel();   // the first trip's boat
  S.stock = initStock(); S.tut = tutNew(); S.tut.v = 2; S.haill = null; if (fld) S.tut.f = fld; const g = tutFieldAt();
  const H = (Date.UTC(2027, 2, 1, 9) - EPOCH) / 36e5;
  S.t = Math.round(H * 60); S.hold = []; S.facc = {}; S.fnext = {}; b.gear = true; b.ice = 150; S.equip.jukse = 0; S.settings.deckFirst = alone;
  b.status = 'fishing'; b.pos = {...g.p}; b.fishUntil = S.t + mins; window.TUTTOP = 0; const t0 = S.t; let at = {};
  for (let i = 0; i < 400 && b.status === 'fishing'; i++){
    if (stopAt && S.t - t0 >= stopAt){ b.fishUntil = S.t; S.plan = null; endFishing('done'); break; }   // as «Stopp» (08-actions.js stopfish)
    S.t++; fish(S.t / 60, 4, 0.4); deckMinute(); if (!at.t30 && S.t - t0 >= 30) at.t30 = holdTotal();
  }
  const F = S.tut.fk || {}, kg = holdTotal();
  // as the sale does it: the landed kilos in S.lastSale.lines
  const ls = S.lastSale; S.lastSale = {lines:[{kg}]}; const n = tutNormKg(); S.lastSale = ls;
  const share = F.d > 0 ? (F.d - F.t) / F.d : 0;
  const R = {kg:+kg.toFixed(1), cap:capHold(), top:+(window.TUTTOP || 0).toFixed(1), mins:S.t - t0, m:F.m, st:b.status, t30:at.t30 ? +at.t30.toFixed(1) : null,
    mix:Object.fromEntries(S.hold.reduce((m, x) => m.set(x.sp, (m.get(x.sp) || 0) + x.kg), new Map())), want:tutMixOf(),
    n, old:Math.round(kg * share / TUT_FISH_H / 10) * 10, own:Math.round((kg - (F.top || 0)) * share / ((F.m || 60) / 60)), step:tutStep() ? tutStep().id : null};
  S.tut = keep.tut; S.haill = keep.haill; S.stock = keep.stock; b.status = 'port'; S.hold = []; b.fishUntil = null; b.type = keep.type; applyVessel();
  return R; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await boot(pg)
        one = await pg.evaluate('JSON.stringify(' + RUN + '([60, 0, false]))'); one = json.loads(one)
        alone = json.loads(await pg.evaluate('JSON.stringify(' + RUN + '([60, 0, true]))'))
        two = json.loads(await pg.evaluate('JSON.stringify(' + RUN + '([120, 0, false]))'))
        stop = json.loads(await pg.evaluate('JSON.stringify(' + RUN + '([60, 20, false]))'))
        # a save from the middle of a first trip before S0: S.tut.fk without the minute and top-up counters; they are not begun halfway
        leg = json.loads(await pg.evaluate('''JSON.stringify((() => { const keep = S.tut, b = S.boat, g = GROUNDS[TUT_FIELD]; S.tut = tutNew(); S.tut.v = 2; S.tut.fk = {d:40, t:30};
          S.hold = []; S.facc = {}; S.fnext = {}; b.gear = true; b.status = 'fishing'; b.pos = {...g.p}; b.fishUntil = S.t + 10; for (let i = 0; i < 10 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 4, 0.4); deckMinute(); }
          const F = S.tut.fk, r = {m:F.m === undefined ? null : F.m, top:F.top === undefined ? null : F.top}; S.tut = keep; b.status = 'port'; S.hold = []; b.fishUntil = null; return r; })())'''))
        check(leg['m'] is None and leg['top'] is None, 'en lagring fra midt i første tur før S0 får ingen tellere halvveis (tutNormKg regner den som før)', leg)
        # the slip and the deck log say the same N (Jonas' choice A 08.11.2026: portSlip calls tutNormKg): a real sale at the first trip's plant
        sl = json.loads(await pg.evaluate("""(() => { const keep = {tut:S.tut, stock:S.stock, type:S.boat.type, ls:S.lastSale, cash:S.cash}, b = S.boat, g = GROUNDS[TUT_FIELD]; b.type = 'trebat'; applyVessel();
          S.stock = initStock(); S.tut = tutNew(); S.tut.v = 2; for (const id of ['n1','nout','intro','gps','route1','fish2','cast1','sail','fish','deck','full','route2','cast2']) S.tut.m[id] = 1;
          S.t = Math.round(((Date.UTC(2027, 2, 1, 9) - EPOCH) / 36e5) * 60); S.hold = []; S.facc = {}; S.fnext = {}; b.gear = true; b.status = 'fishing'; b.pos = {...g.p}; b.fishUntil = S.t + 60;
          for (let i = 0; i < 400 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 4, 0.4); deckMinute(); }
          const pt = portById(tutLand()); b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; S.t = Math.round(S.t / 1440) * 1440 + 600; sell();
          const box = document.createElement('div'); box.innerHTML = portSlip(); const el = box.querySelector('.tutnorm'), m = el && el.textContent.match(/rundt ([\\d\\s\\u00a0]+) kg|under 10 kg/);
          const r = {slip:m ? (m[1] ? +m[1].replace(/\\D/g, '') : 0) : null, log:tutNormKg()};
          S.tut = keep.tut; S.stock = keep.stock; S.lastSale = keep.ls; S.cash = keep.cash; b.type = keep.type; applyVessel(); return JSON.stringify(r); })()"""))
        check(sl['slip'] is not None and sl['log'] is not None and (sl['slip'] == sl['log'] or (sl['log'] < 10 and sl['slip'] == 0)), 'sluttseddelen og dekksdagboka sier samme N etter en ekte levering ved første turs mottak', sl)
        print('en time', one); print('en time, alene på dekk', alone); print('to timer', two); print('stopp etter 20 min', stop)
        check(one['kg'] >= one['cap'] - 1, 'en time på feltet gir full last i trebåtens kar (TUT_HOLD 1, capHold ' + str(one['cap']) + ' kg)', one)
        check(alone['kg'] >= alone['cap'] - 1 and alone['st'] != 'fishing', 'også alene, med sløyingen først: full last, og fisket er slutt', {k: alone[k] for k in ('kg', 'mins', 'st')})
        check(two['kg'] >= two['cap'] - 1 and two['top'] < one['top'], 'to timer gir full last med mindre påfylling enn én', {'en': one['top'], 'to': two['top']})
        check(stop['kg'] < 0.6 * stop['cap'] and stop['st'] == 'idle' and (stop.get('m') or 0) <= 21, 'den som stopper etter 20 minutter, har det som er om bord, og påfyllingen stopper med fisket', {k: stop.get(k) for k in ('kg', 'm', 'st')})
        check(one['n'] is not None and abs(one['n'] - one['own']) <= 5 and one['n'] < one['old'], '«vanlig fiske her» er uten påfyllingen (før ville det sagt ' + str(one['old']) + ')', {k: one[k] for k in ('n', 'own', 'old', 'top', 'kg')})
        check(stop['n'] is not None and abs(stop['n'] - one['n']) <= max(20, 0.5 * one['n']), '«vanlig fiske her» er per time fisket: omtrent likt etter 20 minutter og etter en time', {'20 min': stop['n'], 'en time': one['n']})
        if '--kyst' in sys.argv:
            for nm, la, lo in (('Bergen', 60.39, 5.32), ('Bodø', 67.28, 14.38), ('Hammerfest', 70.66, 23.68)):
                f = json.loads(await pg.evaluate('''async ([la, lo]) => { const p = P(la, lo); let pt = null, bd = 1e9; for (const q of PORTS){ if (!q.mottak) continue; const d = dist(q.p, p); if (d < bd){ bd = d; pt = q; } }
                  S.t = Math.round((Date.UTC(2027, 2, 1, 9) - EPOCH) / 6e4); await mapNeed(pt.p, 10.5); const f = tutFieldNear(pt, pt); return JSON.stringify({pt:pt.name, f}); }''', [la, lo]))
                if not f['f']:
                    check(False, nm + ': første turs felt finnes nær ' + f['pt'], f); continue
                r = json.loads(await pg.evaluate('JSON.stringify(' + RUN + '([60, 0, true, %s]))' % json.dumps(f['f'])))
                tot = sum(r['mix'].values()) or 1; off = max(abs(r['mix'].get(k, 0) / tot - w) for k, w in r['want'].items())
                print(nm, f['pt'], {k: r[k] for k in ('kg', 'cap', 'top', 'mins', 'm', 'n')}, {k: round(v / tot, 2) for k, v in r['mix'].items()}, r['want'])
                check(r['kg'] >= r['cap'] - 1 and r['st'] == 'idle', nm + ' (' + f['pt'] + '): en time på første turs felt gir full last, og fisket er slutt', {k: r[k] for k in ('kg', 'mins', 'top')})
                check(off < 0.15, nm + ': fangsten har feltets egen miks (innen 15 prosentpoeng per art)', {'fikk': {k: round(v / tot, 2) for k, v in r['mix'].items()}, 'feltet': r['want']})
                check(r['n'] is not None and r['n'] < r['old'], nm + ': «vanlig fiske her» er uten påfyllingen', {k: r[k] for k in ('n', 'old', 'own')})
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
