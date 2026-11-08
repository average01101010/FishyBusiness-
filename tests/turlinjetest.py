"""Ø8b S2, the trip's line on the landing note and in the deck log (V2 A and V4 A in docs/planer/spillbarhet-fangst.md, Jonas 06.11.2026):
fish() keeps the trip's sums (the minutes jigged, what the fish stood to, and what the fishing down, the sea and the wind, the cold, the
wear and the luck took or gave), and sell() makes them one line (core/04-crew.js tripSum, tripWhy) that stands on the landing note
(portSlip, .tripwhy) and in the deck log. Jigs minute by minute on a Senja ground in March without 3D, in calm and rough weather, with
the luck on, and where the stock is fished down, and lands each trip. `--kyst` (needs the whole coast in the build: tools/map/release.py,
tools/map/game.py) does a calm trip near Bergen, Bodø and Hammerfest, the stikkprøve along the coast. `--shots` takes the landing note in
both formats into tests/out/ (_env.py works there). Prints OK/FEIL lines."""
from _env import GAME, boot
import asyncio, json, sys, os
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK   ' if ok else 'FEIL ') + what + ('  ' + json.dumps(extra, ensure_ascii=False) if extra != '' else ''))

# [where (a point or null for Senja's ground 0), hours, wind, sea, luck, stock left, crew]: jig, land at the nearest plant, read the line
RUN = """(async ([at, hrs, W, hs, haill, stk]) => {
  const b = S.boat, p = at ? at : GROUNDS[0].p;
  if (at) await mapNeed(p, 10.5);
  S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); S.crew = []; S.quota = null; S.hold = []; S.facc = {}; S.fnext = {};
  S.stock = initStock(); if (stk < 1){ const ix = Math.floor(p.x / 2), iy = Math.floor(p.y / 2); for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) S.stock[gridKey(ix + dx, iy + dy)] = stk; }
  S.haill = haill ? {type:'luksus', t0:S.t} : null; S.clothes = {olje:0, varme:0};
  b.deckStop = false; b.deckEnd = null; b.gop = null;   // (a trip before that ended full in the middle of the gutting leaves these, which endFishing clears in the game)
  b.trip = null; b.status = 'fishing'; b.pos = {...p}; b.fishUntil = S.t + hrs * 60; b.gear = true; S.equip.jukse = 0; b.ice = 500; S.settings.gut = false;
  const nf = S.log.length; let mins = 0;
  for (let i = 0; i < hrs * 60 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, W, hs); deckMinute(); mins++; }
  const fishLog = S.log.slice(nf).map(e => e.no).slice(0, 6), st = b.status;
  const W0 = tripSum(b.trip); b.fishUntil = null; b.status = 'idle'; S.haill = null;
  let pt = null, bd = 1e9; for (const q of PORTS){ if (!q.mottak || plantFor && !plantFor(q, b.type)) continue; const d = dist(q.p, p); if (d < bd){ bd = d; pt = q; } }
  S.t += 120; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; b.land = null; const kg = holdTotal(), n0 = S.log.length; sell();
  const ls = S.lastSale, box = document.createElement('div'); box.innerHTML = portSlip(); const el = box.querySelector('.tripwhy');
  const logs = S.log.slice(n0).map(e => e.no);
  return JSON.stringify({pt:pt.name, kg:Math.round(kg), W:W0, mins, st, fishLog, why:ls.why, slip:el ? el.textContent : null, inLog:!!(ls.why && logs.includes(ls.why[0])), logs, trip:b.trip}); })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await boot(pg)
        run = lambda *a: pg.evaluate('(async () => ' + RUN + '(' + json.dumps(list(a)) + '))()')
        calm = json.loads(await run(None, 4, 4, 0.4, False, 1))
        print('stille', calm['pt'], calm['kg'], 'kg:', calm['why'][0] if calm['why'] else None)
        j = (calm['W'] or {}).get('j') or {}
        check(bool(calm['why']) and calm['why'][0].startswith('Turen ga ') and 'Fisken sto' in calm['why'][0], 'en vanlig tur med håndjuksa gir turens linje', calm['why'])
        check(calm['slip'] == (calm['why'] or [None])[0], 'linja står på sluttseddelen (portSlip, .tripwhy)', calm['slip'])
        check(calm['inLog'], 'og den samme linja står i dekksdagboka (Drift) etter «Leverte …»', calm['logs'])
        check(calm['trip'] is None, 'turen er null etter salget, så neste tur teller fra null')
        check(j and abs(j['kgph'] * j['h'] - calm['kg']) <= 1, 'kilo i timen er de leverte kiloene delt på timene fisket', {'kgph': j.get('kgph'), 'h': j.get('h'), 'kg': calm['kg']})
        sh = j.get('sh', {})
        check(j and abs(sum(sh.values()) - j['pen']) < 1e-9 and sh['sea'] < 0.01 and sh['stock'] < 0.1, 'i stille vær tar sjøen ingenting, på urørt felt tar bestanden lite, og andelene summerer til tapet (kulda i mars uten klær står)', {'sh': sh, 'pen': j.get('pen')})
        exp = j and j['pot'] * (1 - j['pen']) * (1 + j['luck'])
        check(j and 0.6 * exp <= j['kgph'] <= 1.4 * exp, 'det som kom om bord, er innen 40 % av det modellen ventet (potensialet ganger trinnene; resten er tilfeldig)', {'kgph': round(j.get('kgph', 0), 1), 'ventet': round(exp or 0, 1)})
        rough = json.loads(await run(None, 4, 13, 2.2, False, 1)); jr = (rough['W'] or {}).get('j') or {}
        print('grov sjø:', rough['why'][0] if rough['why'] else None, rough['mins'], rough['st'], rough['fishLog'])
        check(jr and jr['sh']['sea'] >= 0.1 and 'sjøen og vinden (2,2 m, 13 m/s) tok' in (rough['why'] or [''])[0], 'i grov sjø og kuling sier linja hva sjøen og vinden tok', rough['why'])
        check(jr and jr['kgph'] < j['kgph'], 'og turen ga mindre enn i stille vær', {'grov': round(jr.get('kgph', 0), 1), 'stille': round(j['kgph'], 1)})
        luck = json.loads(await run(None, 4, 4, 0.4, True, 1)); jl = (luck['W'] or {}).get('j') or {}
        print('haill:', luck['why'][0] if luck['why'] else None)
        check(jl and jl['luck'] > 0.9 and 'Haillen ga' in (luck['why'] or [''])[0], 'med luksushaillen sier linja hva haillen ga', {'luck': jl.get('luck'), 'why': luck['why']})
        down = json.loads(await run(None, 4, 4, 0.4, False, 0.5)); jd = (down['W'] or {}).get('j') or {}
        print('nedfisket:', down['why'][0] if down['why'] else None)
        check(jd and 0.4 <= jd['sh']['stock'] <= 0.6 and 'nedfisket felt tok' in (down['why'] or [''])[0], 'der bestanden er fisket ned til halvparten, tar nedfisket felt rundt 50 %', {'stock': jd.get('sh', {}).get('stock'), 'why': down['why']})
        check(jd and abs(jd['pot'] - j['pot']) <= 0.25 * j['pot'], 'det fisken sto til, er det samme som på urørt felt (bestanden er et trinn, ikke potensialet)', {'ned': round(jd.get('pot', 0), 1), 'urørt': round(j['pot'], 1)})
        en = await pg.evaluate("(() => { S.lang = 'en'; const b = document.createElement('div'); b.innerHTML = portSlip(); const el = b.querySelector('.tripwhy'); S.lang = 'no'; return el ? el.textContent : null; })()")
        check(bool(en) and en == down['why'][1] and en.startswith('The trip gave '), 'på engelsk står den engelske linja', en)
        if '--kyst' in sys.argv:
            for nm, la, lo in (('Bergen', 60.39, 5.32), ('Bodø', 67.28, 14.38), ('Hammerfest', 70.66, 23.68)):
                # the first trip's field finder (ui/08c-start.js tutFieldNear) for a ground with jig fish near the plant, as tutfull.py does
                at = await pg.evaluate('''async ([la, lo]) => { const p = P(la, lo); let pt = null, bd = 1e9; for (const q of PORTS){ if (!q.mottak) continue; const d = dist(q.p, p); if (d < bd){ bd = d; pt = q; } }
                  S.t = Math.round((Date.UTC(2028, 2, 10, 7) - EPOCH) / 6e4); await mapNeed(pt.p, 10.5); const f = tutFieldNear(pt, pt); return f ? {x:f.p.x, y:f.p.y} : null; }''', [la, lo])
                if not at:
                    check(False, nm + ': et felt med juksafisk nær mottaket'); continue
                r = json.loads(await run(at, 3, 4, 0.4, False, 1)); jk = (r['W'] or {}).get('j') or {}
                print(nm, r['pt'], r['kg'], 'kg:', r['why'][0] if r['why'] else None)
                check(bool(r['why']) and r['slip'] == r['why'][0] and r['inLog'] and jk and abs(jk['kgph'] * jk['h'] - r['kg']) <= 1, nm + ' (' + r['pt'] + '): linja på seddelen og i dagboka, med kiloene som ble levert', r['why'])
        if '--shots' in sys.argv:
            for nm, w, h in (('liggende', 1280, 800), ('staaende', 800, 1280)):
                await pg.set_viewport_size({'width': w, 'height': h})
                await pg.evaluate("PHONE.open('lever')"); await pg.wait_for_timeout(5000)
                await pg.evaluate("(() => { const e = document.querySelector('.tripwhy'); if (e) e.scrollIntoView({block:'center'}); })()"); await pg.wait_for_timeout(600)
                await pg.screenshot(path='turlinje-' + nm + '.png'); await pg.evaluate("PHONE.show(false)"); await pg.wait_for_timeout(300)
        print('sidefeil', errs)
        await br.close()

asyncio.run(main())
