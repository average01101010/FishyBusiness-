# The snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026), in the built game with the whole coast:
#  - the catch per pot and per day on Storbanken, Sentralbanken and at Hopen, on the real banks (the depth and the shelf from the chart),
#    in February and April, against the notes and the profitability survey (5-7 kg a pot, about 8 t a day at sea)
#  - the purchase: the snow crab vessel with her permit from an NPC owner, the register of 30, no quota factor, the price by what the
#    fishery bears (V6 B), the data sheet in the boat market
#  - a string of 200 conical pots set, soaked a week and hauled: the pace, the bait, the sorting (males from 9.5 cm kept, the rest back alive)
#  - the rules at the place: § 28 (8 000 pots), within 12 nm, another country's shelf, the closed season
#  - the landing: the vessel quota (433 t in 2027 and the 10 % flexibility), the rest confiscated
#  - the UI: the data sheet, «Sett ut» and Redskap › Om bord in both formats (800×1280 and 1280×800)
# LITE (no 3D). Needs the whole coast in tools/map/out/game (python3 tools/map/release.py and game.py).
import asyncio, json, os, sys
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

CAL = """async () => {
  const banks = {Storbanken:['24-01', '24-02', '24-03', '24-04', '24-05'], Sentralbanken:['15-03', '15-04', '15-05', '15-09', '15-10'], Hopen:['23-07', '23-15']};
  const D = fkData(), kgOf = {}; for (const [c, ms] of D.snok.lok) kgOf[c] = ms;
  const I = new Map(RU.lok.map((h, i) => [h.c, i])), out = {}; S.tut = 0;
  const legal = m => { let kg = 0, n = 0; for (let i = 0; i < 20000; i++){ const c = snoCrab(m); n++; if (c.cw >= SNOC.minCW || c.dead) kg += c.w; } return kg / n; };
  const LW = {1:legal(1), 3:legal(3)};
  for (const bank in banks){ const R = out[bank] = {pts:0, depth:0, m:{}};
    const pts = [];
    for (const c of banks[bank]){ const L = RU.lok[I.get(c)]; if (!L) continue; const b = L.P[0].bb; let got = 0;
      for (let j = 0; j < 400 && got < 5; j++){ const p = {x:b[0] + (b[2] - b[0]) * h2(j, 9100 + c.charCodeAt(4)), y:b[1] + (b[3] - b[1]) * h2(j, 9300 + c.charCodeAt(1))};
        if (!ruIn(L.P, p.x, p.y)) continue; await mapNeed(p, 6); const d = depthF(p);
        if (isLand(p) || d < 220 || d > 380 || ruBlockMsg({p, H:(Date.UTC(2027, 1, 15) - EPOCH) / 36e5, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'})) continue;
        pts.push({p, c, d}); got++; } }
    R.pts = pts.length; R.depth = Math.round(pts.reduce((a, q) => a + q.d, 0) / Math.max(1, pts.length));
    for (const m of [1, 3]){ const H0 = (Date.UTC(2027, m, 8, 6) - EPOCH) / 36e5; let sum = 0, w = 0, n = 0, nn = 0;
      for (const q of pts){ const s = {kind:'teine', pot:'sno', n:200, a:{x:q.p.x - 2.5, y:q.p.y}, b:{x:q.p.x + 2.5, y:q.p.y}, tSet:H0 * 60, acc:{}, bait:'blekksprut', cond:1, dry:true, dead:0};
        for (let h = 0; h < 7 * 24; h++){ S.t = (H0 + h) * 60; soakHour(s, H0 + h); }
        const kgp = (s.acc.snokrabbe ? s.acc.snokrabbe.n : 0) / 200 * LW[m], wt = (kgOf[q.c] || [])[m] || 0; sum += kgp * wt; w += wt; n += kgp; nn++; }
      R.m[m] = {kgPot:+(w > 0 ? sum / w : n / Math.max(1, nn)).toFixed(2), mean:+(n / Math.max(1, nn)).toFixed(2)}; } }
  return {banks:out, perDay:Math.round(1440 / POTS.sno.haul)}; }"""

BUY = """async ([la, lo]) => {
  const R = {}, b = S.boat, T = P(la, lo), H0 = (Date.UTC(2027, 1, 8, 6) - EPOCH) / 36e5;
  S.t = Math.round(H0 * 60); S.tut = 0; S.landN = Math.max(S.landN || 0, 8); S.fm = Object.assign(S.fm || {}, {b:true}); S.cash = Math.max(S.cash, 4e8);
  const yard = PORTS.filter(q => /verft/.test(q.sted || '')).sort((a, c) => dist(a.p, T) - dist(c.p, T))[0];
  R.yard = yard.name; await mapNeed(yard.p, 6);
  if (S.lic){ try { regFree(S.lic.id); } catch (e){} } S.lic = null;
  b.type = 'kyst15'; applyVessel(); freshQuota(); b.status = 'port'; b.port = yard.id; b.pos = {...yard.p}; b.berth = 'main'; b.land = null; b.gop = null; b.fueling = null; b.shift = null; b.hove = null; b.anch = null;
  S.plan = null; S.sets = []; S.hold = []; S.me = S.cur; S.crew = []; S.lag = null; S.ops = null;
  R.reg = npcReg().krab; R.price = havPrice('snokrabbe', S.t / 60); R.value = havValue({id:'krab', kf:1}, S.t / 60); R.why = havLicWhy('snokrabbe'); R.lock = !!VESSELS.snokrabbe.lock;
  R.kf = [0, 1, 2, 3].map(w => havOffer('krab', S.t / 60 + w * 168).kf);
  PHONE.show(true); PHONE.open('fartoy'); PHONE.render(); await new Promise(r => setTimeout(r, 100));
  const tab = document.querySelector('[data-pa="mktab"][data-s="hav"]'); if (tab) tab.click(); await new Promise(r => setTimeout(r, 100));
  const card = document.querySelector('[data-pa="mksel"][data-k="snokrabbe"]'); if (card) card.click(); await new Promise(r => setTimeout(r, 150));
  const v = document.querySelector('.vsheet') || document.getElementById('drawerBody'); R.sheet = v ? v.closest('#drawerBody, #phView').innerText : '';
  const btn = document.querySelector('[data-pa="buy"][data-ti="1"][data-k="snokrabbe"]'); R.btn = btn ? !btn.disabled : null;
  const sec = [...document.querySelectorAll('.vsec h5')].find(e => /Tillatelse|Permit/.test(e.textContent)); if (sec) sec.scrollIntoView({block:'start'});
  return R; }"""

BUYNOW = """async () => {
  const R = {}, b = S.boat, c0 = S.cash, r0 = npcReg().krab || 0;
  document.querySelector('[data-pa="buy"][data-ti="1"][data-k="snokrabbe"]').click(); await new Promise(r => setTimeout(r, 200));
  R.type = b.type; R.lic = S.lic ? {id:S.lic.id, hav:S.lic.hav, kf:S.lic.kf} : null; R.paid = Math.round(c0 - S.cash); R.reg = [r0, npcReg().krab || 0];
  R.q = Math.round(havQ(S.lic, S.t / 60).snokrabbe / 1000);
  await new Promise(r => setTimeout(r, 400)); const sk = document.querySelector('.bm-skip'); if (sk) sk.click();
  PHONE.show(false); return R; }"""

TRIP = """async ([la, lo]) => {
  const R = {}, b = S.boat, H0 = (Date.UTC(2027, 1, 10, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60); S.tut = 0;
  if (b.type !== 'snokrabbe'){ b.type = 'snokrabbe'; applyVessel(); }
  if (!S.lic || S.lic.id !== 'krab') S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'};
  const pg = S.pgear; pg.pots.sno = 400; pg.kits.n = Math.max(pg.kits.n, 2); pg.kits.heavy = Math.max(pg.kits.heavy, 2); baitOf(pg).blekksprut = 300;
  // a point on Storbanken at the banks' depth, where the rules allow it
  let p = null; for (let k = 0; k < 200 && !p; k++){ const q = P(la + 0.15 * Math.sin(k), lo + 0.4 * Math.cos(k * 1.3)); await mapNeed(q, 8); const d = depthF(q); if (!isLand(q) && d >= 230 && d <= 360 && !ruBlockMsg({p:q, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'})) p = q; }
  R.ll = LL(p); R.depth = Math.round(depthF(p)); R.area = +snoArea(p, H0).toFixed(2);
  b.status = 'idle'; b.port = null; b.pos = {...p}; b.v = 0; b.heading = Math.PI / 2; b.fuel = BOAT.fuelCap; b.hove = null; S.hold = []; S.plan = null; S.sets = [];
  R.choices = setChoices().map(c => c.lbl[0]);
  const ch = setChoices().find(c => c.spec && c.spec.pot === 'sno'); R.spec = ch && ch.spec;
  R.why = startSet('teine', ch.spec, 0, Math.PI / 2);
  const t0 = S.t; let k = 0; while (b.gop && k++ < 600) step();
  R.setMin = S.t - t0; const s = mySets()[0] || {}; R.set = {n:s.n, km:+dist(s.a || p, s.b || p).toFixed(2), bait:s.bait, depth:s.depth, pot:s.pot};
  R.potsLeft = pg.pots.sno; R.baitLeft = Math.round(baitOf(pg).blekksprut);
  // a week in the sea, an hour at a time
  for (let h = 0; h < 7 * 24; h++){ S.t += 60; gearHour(S.t / 60); }
  R.inPot = s.acc && s.acc.snokrabbe ? +(s.acc.snokrabbe.n / s.n).toFixed(1) : 0;
  b.pos = {...s.a}; b.status = 'idle'; b.v = 0; b.gop = null; const m0 = S.log.length;
  R.haulWhy = startHaul(s.id, false, 0); const t1 = S.t; k = 0; while (b.gop && k++ < 900) step();
  R.haulMin = S.t - t1; R.holdKg = Math.round(holdTotal()); R.kgPot = +(holdTotal() / s.n).toFixed(2);
  R.cls = {}; R.n = 0; for (const x of S.hold){ if (x.sp !== 'snokrabbe') continue; R.cls[x.cls] = (R.cls[x.cls] || 0) + x.n; R.n += x.n; }
  // (H3b: on a frozen trip the kept crab goes to the factory, split into clusters and frozen, none whole and none in the tanks; the dead round)
  R.gut = S.hold.every(x => x.sp !== 'snokrabbe' || (!x.tank && (x.rund ? x.cls === 2 : !x.frozen || x.gut))) && S.hold.some(x => x.sp === 'snokrabbe' && x.gut && !x.rund); R.potsBack = pg.pots.sno;
  R.log = S.log.slice(m0).map(l => l.no || l[0] || '').filter(x => /Sortert|Trakk/.test(x)).join(' | ');
  return R; }"""

RULES = """async ([la, lo]) => {
  const R = {}, b = S.boat, pg = S.pgear, H0 = (Date.UTC(2027, 1, 12, 6) - EPOCH) / 36e5; S.t = Math.round(H0 * 60);
  const q = (p, H) => ({p, H, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'});
  // § 28: 7 800 in the sea, 200 more is fine, 201 not
  const p = P(la, lo); await mapNeed(p, 8); b.pos = {...p}; b.status = 'idle'; b.gop = null; pg.pots.sno = 400; pg.kits.n = 40; baitOf(pg).blekksprut = 400;
  S.sets = Array.from({length:39}, (_, i) => ({id:'x' + i, vid:S.cur, kind:'teine', pot:'sno', n:200, a:P(la - 0.3, lo + i * 0.01), b:P(la - 0.3, lo + i * 0.01 + 0.005), tSet:S.t, acc:{}, dead:0}));
  R.r200 = gearRules('teine', {pot:'sno', n:200, bait:'blekksprut'}, p); R.r201 = gearRules('teine', {pot:'sno', n:201, bait:'blekksprut'}, p); S.sets = [];
  // within 12 nm of Hopen (Svalbard's territorial sea) and on Russia's shelf east of the line, and the closed season on the bank
  const hop = P(76.52, 25.6); await mapNeed(hop, 6); R.hopen = ruBlockMsg(q(hop)); R.hopenSea = ruSea(hop);
  const ru = P(74.6, 44.0); await mapNeed(ru, 6); R.ru = ruBlockMsg(q(ru)); R.ruShelf = ruShelf(ru);
  R.aug = ruBlockMsg(q(p, (Date.UTC(2027, 7, 15) - EPOCH) / 36e5));
  R.ok = ruBlockMsg(q(p)); R.items = rulesAt(q(p)).items.map(i => i.k);
  return R; }"""

LAND = """async () => {
  const R = {}, b = S.boat, H = (Date.UTC(2027, 2, 20, 12) - EPOCH) / 36e5; S.t = Math.round(H * 60);
  const pt = PORTS.filter(q => (q.mottak || q.havOnly) && !portWhy(q, 'snokrabbe')).sort((a, c) => dist(a.p, P(70.63, 29.72)) - dist(c.p, P(70.63, 29.72)))[0];
  R.port = pt.name; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p};
  const q = quotaState(); q.snokrabbe = 0; R.room = Math.round(snoRoom(H) / 1000);
  S.hold = [{sp:'snokrabbe', kg:500000, n:900000, cls:0, fresh:100, frozen:true, gut:true, iced:true}];
  const c = landConf(H, q, access()); R.conf = +(c.confBy.snokrabbe || 0).toFixed(3);
  S.hold = [{sp:'snokrabbe', kg:100000, n:180000, cls:0, fresh:100, frozen:true, gut:true, iced:true}];
  R.price = clsPrice(pt, 'snokrabbe', 0, H, false, true);
  const c2 = landConf(H, q, access()); R.conf2 = +(c2.confBy.snokrabbe || 0).toFixed(3); S.hold = []; return R; }"""


async def shots(pg, tag):
    # the action bar with the strings to set, and the phone's gear app, Om bord
    await pg.evaluate("() => { const b = S.boat; b.gop = null; b.status = 'idle'; S.sets = []; S.pgear.pots.sno = 400; baitOf(S.pgear).blekksprut = 300; refreshAll(); }")
    await pg.wait_for_timeout(400)
    await pg.screenshot(path=os.path.join(OUT, 'snokrabbe-bar-' + tag + '.png'))
    await pg.evaluate("() => { PHONE.open('redskap'); const t = document.querySelector('[data-pa=sub][data-s=bord]'); if (t) t.click(); }")
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'snokrabbe-redskap-' + tag + '.png'))
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
        for bank, R in c['banks'].items():
            f, a = R['m'].get('1', {}), R['m'].get('3', {})
            print(ok(R['pts'] >= 5 and f.get('kgPot', 0) > 1), '%s: %d punkter på %d m i snitt; februar %.1f kg per teine (vektet etter sedlene; snitt %.1f), april %.1f (%.1f); %.1f t i døgnet i februar med %d teiner' % (bank, R['pts'], R['depth'], f.get('kgPot', 0), f.get('mean', 0), a.get('kgPot', 0), a.get('mean', 0), f.get('kgPot', 0) * c['perDay'] * 0.85 / 1000, round(c['perDay'] * 0.85)))
        sb, se = c['banks']['Storbanken']['m']['1']['kgPot'], c['banks']['Sentralbanken']['m']['1']['kgPot']
        print(ok(4 <= sb <= 9 and 4 <= se <= 9), 'Storbanken og Sentralbanken i februar: %.1f og %.1f kg per teine etter 7 døgn (5–7 kg fra sedlene og undersøkelsen)' % (sb, se))
        print(ok(c['banks']['Hopen']['m']['1']['kgPot'] < sb), 'ved Hopen er det mindre enn på Storbanken (%.1f kg)' % c['banks']['Hopen']['m']['1']['kgPot'])
        # the purchase, the data sheet in both formats
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            r = await pg.evaluate(BUY, [70.63, 29.72])
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(OUT, 'snokrabbe-datablad-' + tag + '.png'))
            print(ok(not r['lock'] and r['reg'] == 30 and r['why'] is None and set(r['kf']) == {1} and r['btn']), 'Båthandelen (%s, %s): snøkrabbefartøyet kan kjøpes, %d tillatelser ledige, kvotefaktor %s, pris %.1f MNOK (skroget og tillatelsen %.1f MNOK)' % (tag, r['yard'], r['reg'], r['kf'], r['price'] / 1e6, r['value'] / 1e6))
            print(ok('lik for alle 30' in r['sheet'] and 'Tilleggskvote' in r['sheet'] and 'Kvotefleks' in r['sheet']), 'databladet viser kvoten lik for alle, tilleggskvoten, kvotefleksen og verdien (%s)' % tag)
        b = await pg.evaluate(BUYNOW)
        print(ok(b['type'] == 'snokrabbe' and b['lic'] and b['lic']['id'] == 'krab' and b['lic']['kf'] == 1 and b['reg'][1] == b['reg'][0] - 1 and b['q'] == 433), 'kjøpt: %s med %s, %d t i 2027, registeret %s' % (b['type'], b['lic'], b['q'], b['reg']))
        r = await pg.evaluate(TRIP, [76.6, 33.5])
        print(ok(any('lenke' in x for x in r['choices'])), 'Sett ut tilbyr lenker:', r['choices'][:2])
        print(ok(r['why'] is None and r['set'].get('n') == 200 and 4.9 < r['set'].get('km', 0) < 5.1 and r['set'].get('pot') == 'sno'), 'satte 1 lenke (%s teiner, %s km) på %s m ved %s, krabben der %.2f' % (r['set'].get('n'), r['set'].get('km'), r['set'].get('depth'), r['ll'], r['area']))
        print(ok(20 <= r['setMin'] <= 50 and r['potsLeft'] == 200 and r['baitLeft'] == 200), 'settingen tok %d min, 200 teiner igjen om bord, 100 kg akkar brukt (%d kg igjen)' % (r['setMin'], r['baitLeft']))
        print(ok(r['haulWhy'] is None and 150 <= r['haulMin'] <= 300 and r['potsBack'] == 400), 'trekkingen av 200 teiner tok %d min, teinene er om bord igjen (%d)' % (r['haulMin'], r['potsBack']))
        print(ok(2 <= r['kgPot'] <= 10 and r['n'] > 0 and r['gut']), 'etter 7 døgn: %.1f krabber i teina, %d kg beholdt (%.1f kg per teine), klassene %s, til fabrikken (delt eller ventende, den døde rund)' % (r['inPot'], r['holdKg'], r['kgPot'], r['cls']))
        print(ok('Sortert' in r['log'] and 'satt ut levende' in r['log']), 'loggen:', r['log'][:300])
        u = await pg.evaluate(RULES, [76.6, 33.5])
        print(ok(u['r200'] is None and u['r201'] and '§ 28' in u['r201'][0]), '§ 28: 8 000 teiner går, 8 001 stoppes: %s' % (u['r201'] and u['r201'][0]))
        print(ok(u['hopen'] and '12 nm' in u['hopen']), 'innenfor 12 nm av Hopen (%s): %s' % (u['hopenSea'], u['hopen']))
        print(ok(u['ru'] and 'sokkel' in u['ru'] and not u['ruShelf']), 'på russisk sokkel: %s' % u['ru'])
        print(ok(u['aug'] and '1. juli' in u['aug'] and u['ok'] is None and 'sk6' in u['items']), 'fredningen i august: %s; i februar lov (%s)' % (u['aug'], u['items']))
        l = await pg.evaluate(LAND)
        print(ok(470 <= l['room'] <= 480 and abs(l['conf'] - (1 - l['room'] / 500)) < 0.01 and l['conf2'] == 0 and l['price'] > 80), 'landingen i %s: kvoterommet %d t (433 t og 10 %% kvotefleks), %.1f %% av 500 t inndras, 100 t går fritt, %.1f kr/kg' % (l['port'], l['room'], l['conf'] * 100, l['price']))
        # the UI, both formats
        for tag, vp in (('liggende', {'width':1280, 'height':800}), ('staaende', {'width':800, 'height':1280})):
            await pg.set_viewport_size(vp)
            txt = (await shots(pg, tag)).replace('\u00a0', ' ').replace('\u202f', ' ')
            i = txt.find('Teiner')
            print(ok('Snøkrabbeteiner' in txt and '8 000' in txt and 'rømmingshull' in txt), 'Redskap › Om bord viser snøkrabbeteinene, taket og teina (%s): %s' % (tag, txt[i:i + 260].replace('\n', ' / ')))
        print('sidefeil', errs[:5])
        await br.close()

asyncio.run(main())
