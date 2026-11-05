# The autoline (H2a of docs/planer/havsteget-h2-autoline.md, 05.11.2026), in the built game with the whole coast:
#  - the catch per 1,000 hooks on the NPC autoliners' 36 grounds, every month, weighed by the landings of line 28 m and over (fiske.json):
#    about 200 kg round weight and the notes' species mix (cod 36 %, haddock 21 %, tusk 21 %, ling 16 %, Greenland halibut 5 %)
#  - a whole set and haul of two lenker on a ground (the pace, the bait from the freezer, the line back on the magazines, set again at once)
#  - § 26 at the place: within 4 nm of the baseline the setting is stopped
#  - the landing rules of an ocean permit: ling over 35 %, tusk over 15 % after the stop and saithe over 25 % are confiscated
#  - the UI: «Sett ut» offers the autoline, the phone's gear app shows it; screenshots standing and lying (800×1280 and 1280×800)
# LITE (no 3D). Needs the whole coast in tools/map/out/game (python3 tools/map/release.py and game.py).
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

CAL = """async () => {
  const D = havData(), G = D.g.line, mix = {}; let W = 0, kg = 0; S.tut = 0;
  for (const e of G){ if (e[1] == null) continue; const p = {x:e[1], y:e[2]}; await mapNeed(p, 8);
    for (let m = 0; m < 12; m++){ const w = e[3][m]; if (!(w > 0)) continue; const H = (Date.UTC(2027, m, 15, 6) - EPOCH) / 36e5;
      const s = {kind:'line', lk:'auto', hooks:5000, n:1, a:p, b:{x:p.x + 6.5, y:p.y}, tSet:H * 60, acc:{}, dead:0, dry:true, cond:1, miss:0, bent:0, baitW:{saury:1, blekksprut:1}};
      for (let h = 1; h <= 8; h++){ S.t = (H + h) * 60; soakHour(s, H + h); }
      for (const sp in s.acc){ mix[sp] = (mix[sp] || 0) + s.acc[sp].kg * w; kg += s.acc[sp].kg * w; } W += w; } }
  const T = Object.values(mix).reduce((a, v) => a + v, 0), pct = {}; for (const sp in mix) pct[sp] = +(mix[sp] / T * 100).toFixed(1);
  return {grounds:G.length, per1000:+(kg / W / 5).toFixed(1), pct}; }"""

TRIP = """async () => {
  const R = {}, b = S.boat, H0 = (Date.UTC(2027, 5, 10, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60); S.tut = 0;
  b.type = 'autoliner'; applyVessel(); S.lic = {id:'konv', hav:true, kf:3.49, hl:'Konvensjonell havfisketillatelse'}; freshQuota();
  S.pgear = newPGear(); const pg = S.pgear, A = autoL(pg); R.lenker = A.n; R.kits = pg.kits.n;
  baitOf(pg).saury = 1000; baitOf(pg).blekksprut = 500;
  // a ground on the edge off Tromsøflaket (the NPC autoliners' ground nearest 71° N 17° Ø), lying still
  const G = havData().g.line.filter(e => e[1] != null).map(e => ({x:e[1], y:e[2]})), tgt = P(71.0, 17.0), p = G.sort((a, c) => dist(a, tgt) - dist(c, tgt))[0];
  await mapNeed(p, 12); R.ll = LL(p); R.depth = Math.round(depthF(p)); R.nm = +blNm(p).toFixed(1);
  b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; b.heading = 0; b.fuel = BOAT.fuelCap; b.hove = null; S.hold = []; S.plan = null;
  R.choices = setChoices().map(c => c.lbl[0]);
  const ch = setChoices().find(c => c.spec && c.spec.lk === 'auto' && c.n === 2);
  R.why = startSet('line', ch.spec, 0); R.gop = !!b.gop;
  const t0 = S.t; let k = 0; while (b.gop && k++ < 600) step();
  R.setMin = S.t - t0; const s = mySets()[0] || {}; R.set = {n:s.n, hooks:s.hooks, km:+dist(s.a || p, s.b || p).toFixed(2), bait:s.bait, depth:s.depth};
  R.baitLeft = Math.round(baitOf(pg).saury + baitOf(pg).blekksprut); R.onMag = autoL(pg).n;
  // soak 8 hours, then haul and set again at once
  k = 0; while (k++ < 8 * 60) step();
  b.pos = {...s.a}; b.status = 'idle'; b.v = 0;
  R.haulWhy = startHaul(s.id, true, 0); const t1 = S.t; k = 0; let done = null;
  while (k++ < 900){ step(); if (!done && b.gop && b.gop.op === 'set'){ done = S.t; R.hauledKg = Math.round(holdTotal()); } if (done && !b.gop) break; }
  R.haulMin = (done || S.t) - t1; R.reset = mySets().length === 1 && mySets()[0].id !== s.id; R.holdKg = Math.round(holdTotal());
  R.bySp = {}; for (const x of S.hold) R.bySp[x.sp] = (R.bySp[x.sp] || 0) + Math.round(x.kg);
  R.onMag2 = autoL(pg).n; R.log = S.log.slice(-8).map(l => l.no || l[0] || '').join(' | ');
  // § 26: walking from the ground towards the nearest harbour, the first point at sea 1-3 nm off the baseline stops the setting
  const hb = PORTS.filter(q => q.mottak).sort((a, c) => dist(a.p, p) - dist(c.p, p))[0].p; let near = null;
  for (let i = 1; i <= 400 && !near; i++){ const q = {x:p.x + (hb.x - p.x) * i / 400, y:p.y + (hb.y - p.y) * i / 400}; if (i % 20 === 0) await mapNeed(q, 4); const n = blNm(q); if (n > 1 && n < 3 && !isLand(q) && depthF(q) > 20) near = q; }
  if (near){ await mapNeed(near, 4); b.gop = null; b.pos = {...near}; b.status = 'idle'; R.f26 = gearRules('line', {lk:'auto', n:1, bait:'saury'}, near); R.f26nm = +blNm(near).toFixed(1); }
  // the landing rules (ui/08-actions.js landConf): 600 kg cod, 500 ling (38 %) and 200 tusk (15.4 %) after the stop; then 40 % saithe
  const Hs = lbStop(yearH(H0)) + 48; S.t = Math.round(Hs * 60);
  S.hold = [{sp:'torsk', kg:600, n:200, cls:0, fresh:100, frozen:true}, {sp:'lange', kg:500, n:100, cls:0, fresh:100, frozen:true}, {sp:'brosme', kg:200, n:80, cls:0, fresh:100, frozen:true}];
  const c1 = landConf(Hs, quotaState(), access()); R.conf1 = {lange:+(c1.confBy.lange || 0).toFixed(3), brosme:+(c1.confBy.brosme || 0).toFixed(3), torsk:+(c1.confBy.torsk || 0).toFixed(3)};
  S.hold = [{sp:'torsk', kg:600, n:200, cls:0, fresh:100, frozen:true}, {sp:'sei', kg:400, n:100, cls:0, fresh:100, frozen:true}];
  const c2 = landConf(Hs, quotaState(), access()); R.conf2 = {sei:+(c2.confBy.sei || 0).toFixed(3)};
  S.hold = []; return R; }"""


async def shots(pg, tag):
    # the action bar with the autoline's choices and the phone's gear app, Om bord
    await pg.evaluate("() => { const b = S.boat; b.gop = null; b.status = 'idle'; S.sets = []; refreshAll(); }")
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=os.path.join(OUT, 'autoline-bar-' + tag + '.png'))
    await pg.evaluate("() => { PHONE.open('redskap'); const t = document.querySelector('[data-pa=sub][data-s=bord]'); if (t) t.click(); }")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'autoline-redskap-' + tag + '.png'))
    html = await pg.evaluate("() => document.getElementById('drawerBody') ? document.getElementById('drawerBody').innerText : document.body.innerText")
    await pg.evaluate("() => PHONE.show(false)")
    return html


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width':1280, 'height':800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        c = await pg.evaluate(CAL)
        print(ok(c['grounds'] >= 30 and 170 <= c['per1000'] <= 230), 'fangsten på %d felt: %.1f kg per 1000 krok (sedlene for line 28+: om lag 200)' % (c['grounds'], c['per1000']))
        want = {'torsk':36, 'hyse':21, 'brosme':21, 'lange':16, 'blakveite':5}
        print(ok(all(abs(c['pct'].get(k, 0) - v) <= 5 for k, v in want.items())), 'artsmiksen mot sedlene:', json.dumps(c['pct'], ensure_ascii=False))
        r = await pg.evaluate(TRIP)
        print(ok(r['lenker'] == 8 and r['kits'] == 8), 'autolineren har %d lenker på magasinene og %d bøyestenger' % (r['lenker'], r['kits']))
        print(ok(any('autoline' in x for x in r['choices'])), 'Sett ut tilbyr autoline:', r['choices'][:3])
        print(ok(r['why'] is None and r['set'].get('n') == 2 and r['set'].get('hooks') == 10000 and 12 < r['set'].get('km', 0) < 14), 'satte 2 lenker (%s krok, %s km) på %s m ved %s, %s nm fra grunnlinja' % (r['set'].get('hooks'), r['set'].get('km'), r['set'].get('depth'), r['ll'], r['nm']))
        print(ok(40 <= r['setMin'] <= 80), 'settingen tok %d min (to lenker à 28 min)' % r['setMin'])
        print(ok(r['baitLeft'] == 1500 - 170 and r['onMag'] == 6), 'egnemaskinen tok 170 kg agn fra frysen (%d kg igjen), 6 lenker igjen på magasinene (%d)' % (r['baitLeft'], r['onMag']))
        print(ok(r['haulWhy'] is None and 200 <= r['haulMin'] <= 330), 'draget av 2 lenker tok %d min' % r['haulMin'])
        print(ok(r['hauledKg'] and 600 <= r['hauledKg'] <= 6000), 'fikk %s kg på 10 000 krok etter 8 timer: %s' % (r['hauledKg'], json.dumps(r['bySp'], ensure_ascii=False)))
        print(ok(r['reset']), 'lina ble satt ut igjen med én gang etter draget (egnemaskinen)')
        print(ok(r.get('f26') and '4 nm' in r['f26'][0]), '§ 26: %s nm fra grunnlinja: %s' % (r.get('f26nm'), r.get('f26')))
        print(ok(abs(r['conf1']['lange'] - (1 - 0.35 * 1300 / 500)) < 0.01 and abs(r['conf1']['brosme'] - (1 - 0.15 * 1300 / 200)) < 0.01 and r['conf1']['torsk'] == 0), 'landingen: lange over 35 %% og brosme over 15 %% inndras etter stoppen: %s' % r['conf1'])
        print(ok(abs(r['conf2']['sei'] - (1 - 0.25 * 1000 / 400)) < 0.01), 'landingen: sei over 25 %% inndras uten garnseitillatelse: %s' % r['conf2'])
        # the UI, both formats
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            await pg.evaluate("() => { const b = S.boat; b.type = 'autoliner'; applyVessel(); b.status = 'idle'; b.gop = null; S.sets = []; baitOf(S.pgear).saury = 1000; }")
            txt = await shots(pg, tag)
            print(ok('Autoline' in txt and 'På magasinene' in txt), 'Redskap › Om bord viser autolina (%s)' % tag)
        print('sidefeil', errs[:5])
        await br.close()

asyncio.run(main())
