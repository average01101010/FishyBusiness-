from _env import boot
# The quota system (core/03d-quota.js, plan Q1–Q6, 04.10.2026): the regulation's chain from the total quota to the group and vessel
# quotas (J-161-2026, exact for 2026), the stocks and total quotas year by year, the open group's season (the stop, raises and free
# fishing) against 2019–2026, the fresh-fish scheme's autumn changes, § 29 when the boat changes, the register of closed-group rights,
# structure quotas with the cap, the special scheme under 11 m, quota cooperation, the closed group's haddock and saithe, and the app.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

RULES = """(() => { const R = {}, c = codChain(139827), at = (y, m, d) => (Date.UTC(y, m - 1, d) - EPOCH) / 36e5;
  R.chain = {open:Math.round(c.open), lukket:Math.round(c.lukket), u11:Math.round(c.grp.u11), g11:Math.round(c.grp.g11), g15:Math.round(c.grp.g15), g21:Math.round(c.grp.g21)};
  const u7 = licQ({id:'u7'}, at(2026, 6, 1), 6.5), h20 = licQ({id:'h20'}, at(2026, 6, 1), 21);
  R.lic26 = {u7:u7.torsk, u7h:[u7.hyse[0], u7.hyse[1]], h20:h20.torsk, h20s:h20.sei};
  R.nor25 = Math.round(norQuota('torsk', 340000));
  const s0 = S.qseed, t0 = S.t, tacs = [], stops = [], raised = [], ffs = [];
  for (let i = 0; i < 60; i++){ S.qseed = 500 + i * 6151; S.qy = {}; for (const k in YQC) delete YQC[k]; tacs.push(stockYear('torsk', 2027).tac);
    S.t = (Date.UTC(2028, 0, 2) - EPOCH) / 36e5 * 60; const Y = qyAt(at(2027, 12, 31)); stops.push(Y.stop); raised.push(Y.add);
    ffs.push(ffPlan(2027)); }
  S.qseed = s0; S.t = t0; S.qy = {}; for (const k in YQC) delete YQC[k];
  R.tac27 = [Math.min(...tacs), Math.max(...tacs)];
  const st = stops.filter(x => x != null).sort((a, b) => a - b);
  R.stops = {none:stops.length - st.length, min:st[0], med:st[Math.floor(st.length / 2)], max:st[st.length - 1], raisedNoStop:raised.filter((a, i) => a > 0 && stops[i] == null).length, raisedStop:raised.filter((a, i) => a > 0 && stops[i] != null && stops[i] < doyOf(2027, 5, 1)).length};
  const jun29 = doyOf(2027, 6, 29), sep15 = doyOf(2027, 9, 15), nov30 = doyOf(2027, 11, 30);
  R.ff = {start:ffs.every(P => P[0][0] === jun29 && P[0][1] === 0.2), raised:ffs.filter(P => P.some(([d, p]) => p > 0.2 && d >= sep15 && d <= nov30 + 25)).length, max:Math.max(...ffs.flat().map(e => e[1])),
    early:ffPct(at(2027, 6, 1)), sorted:ffs.every(P => P.every((e, i) => !i || e[0] >= P[i - 1][0]))};
  R.stockF = [stockF('torsk', 0), stockF('torsk', 3 * 8760), stockF('uer', 3 * 8760)];
  return R; })()"""

SEASON = """(() => { const R = {}, at = (y, m, d) => (Date.UTC(y, m - 1, d) - EPOCH) / 36e5;
  // a save whose 2027 has a stop: the Coast Post a week ahead and on the day, and the skiff's limit drops to the guaranteed quota
  let seed = 0; for (let i = 0; i < 200 && !seed; i++){ S.qseed = 900 + i * 7417; S.qy = {}; for (const k in YQC) delete YQC[k]; S.t = (Date.UTC(2027, 6, 1) - EPOCH) / 36e5 * 60; const Y = qyAt(S.t / 60); if (Y.stop && Y.stop > 75) seed = S.qseed; }
  S.qseed = seed; S.qy = {}; for (const k in YQC) delete YQC[k]; S.t = (Date.UTC(2027, 6, 1) - EPOCH) / 36e5 * 60; const Y = qyAt(S.t / 60);
  const dayOfDoy = d => Math.ceil(at(2027, 1, 1) / 24) + d, ttl = d => newsForDay(dayOfDoy(d)).map(n => n.h ? n.h.no : JSON.stringify(n)).join(' | ');
  R.stop = Y.stop; R.ann = Y.ann; R.newsAnn = ttl(Y.ann); R.newsStop = ttl(Y.stop);
  S.lic = null; S.boat.type = 'skiff'; applyVessel(); const before = codLimitNow(at(2027, 1, 1) + (Y.stop - 1) * 24), after = codLimitNow(at(2027, 1, 1) + (Y.stop + 1) * 24), L = codLimits(at(2027, 1, 1) + Y.stop * 24);
  R.lim = {before, after, max:L.max, guar:L.guar};
  return R; })()"""

TRADE = """(async () => { const R = {}, y = yearH(S.t / 60), tap = q => { const e = document.querySelector('#drawerBody ' + q) || document.querySelector(q); if (e) e.click(); return !!e; };
  S.tut = 0; window.confirm = () => true; S.cash = 3e6; S.loan = null; S.loanIN = null; S.fm = {n:20, last:-1, kr:5e5, b:true}; S.sales = S.sales.length >= 3 ? S.sales : [{t:0, total:1}, {t:1, total:1}, {t:2, total:1}];
  const b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.lic = null; S.crew = [];
  // § 29: open-group cod follows the owner from a closed-group boat traded back to the open group
  const q0 = freshQuota(); q0.torsk = 1200; openUsedSave(q0); S.lic = {id:'u7', since:y - 1}; quotaState().torsk = 5000; b.type = 'trebat'; applyVessel();
  PHONE.dact('rederi', 'buy', {k:'skiff', ti:'1'}); R.p29 = {lic:!!S.lic, torsk:quotaState().torsk, type:S.boat.type};
  // buying a right: one NPC owner fewer, the right dated, the seller's catch off the quota
  const r0 = npcReg().u7; DOCK.open('fartoy'); tap('[data-pa=mksel]:not([data-k])'); tap('[data-pa=mktab][data-s=lic]'); tap('[data-pa=mksel][data-k=trebat][data-o=u7]'); tap('[data-pa=buylic][data-ti="1"]'); DOCK.close();
  R.buy = {lic:S.lic && S.lic.id, since:S.lic && S.lic.since, from:S.lic && S.lic.from, reg:[r0, npcReg().u7], seller:quotaState().seller, quota:licQ(S.lic).torsk};
  // structure quotas on a 14.99 m boat with a 14–14.9 m right: 10 % off, and the cap at three times its own quota
  S.cash = 1e8; S.loan = null; S.loanIN = null; b.type = 'kyst15'; applyVessel(); S.lic = {id:'h14', since:y - 1}; freshQuota(); const c0 = licQ(S.lic).torsk;
  PHONE.dact('kvote', 'struct', {id:'h14'}); const c1 = licQ(S.lic).torsk; PHONE.dact('kvote', 'struct', {id:'h14'}); const c2 = licQ(S.lic).torsk; PHONE.dact('kvote', 'struct', {id:'h14'}); const c3 = licQ(S.lic).torsk;
  R.struct = {c0, c1, c2, c3, n:(S.lic.st || []).length, until:S.lic.st && S.lic.st[0].until, room:structRoom(S.lic, 'h14'), small:structRoom({id:'u7'}, 'u7')};
  // haddock and saithe in the closed group: over the maximum quota only 30 % haddock and 20 % saithe of the landing are kept
  const LQ = licQ(S.lic); quotaState().hyse = LQ.hyse[0]; quotaState().sei = LQ.sei[0];
  S.hold = [{sp:'torsk', kg:500, fresh:90, bled:true, iced:true, c:1, g:'A'}, {sp:'hyse', kg:500, fresh:90, c:1, g:'A'}]; S.tripOwner = true; sell(); R.hyse = {conf:Math.round(S.lastSale.confKg), keptH:Math.round(quotaState().hyse - LQ.hyse[0])};
  // the special scheme: two boats under 11 m, both since last year; one is sold and the other fishes both quotas
  b.type = 'sjark'; applyVessel(); S.lic = {id:'h9', since:y - 1}; freshQuota(); const v2 = newVesselObj('snekke', 'husoy', {id:'h7', since:y - 1}), n0 = S.fleet.length, q9 = licQ(S.lic).torsk;
  PHONE.dact('kvote', 'two', {a:S.cur, b:v2.id}); R.two = {fleet:[n0, S.fleet.length], two:S.lic.two, quota:[q9, licQ(S.lic).torsk, licQ({id:'h7'}).torsk]};
  // quota cooperation: the NPC owner signs on, his quota comes aboard, he takes half the value of the cod on it, and leaves at new year
  S.lic = {id:'h9', since:y - 1}; freshQuota(); S.crew = []; const own = licQ(S.lic).torsk; PHONE.dact('kvote', 'coop', {}); const co = S.lic.coop;
  R.coop = {on:!!co, crew:S.crew.length, coopCrew:S.crew.some(c => c.coop), quota:[own, licQ(S.lic).torsk]};
  quotaState().torsk = own - 100; const cash0 = S.cash; S.hold = [{sp:'torsk', kg:400, fresh:90, bled:true, iced:true, c:1, g:'A'}]; sell(); R.coop.paid = /fikk .* for torsken på kvoten hans/.test(S.log.slice(-3).map(e => e.no).join(' '));
  S.qyY = y - 1; S.lic.coop.y = y - 1; quotaNewYear(y); R.coop.after = {coop:S.lic.coop, crew:S.crew.length};
  // the app: four tabs, each rendered
  PHONE.open('kvote'); const txt = s => { PHONE.dact('kvote', 'sub', {s}); PHONE.render(); return document.querySelector('#phone').textContent; };
  R.app = {open:/Gruppekvote/.test(txt('open')), stock:/Gytebestand|Totalkvote/.test(txt('stock')), mkt:/Deltakeradganger/.test(txt('mkt')), mine:/Fartøykvote|Maksimalkvote|Ingen adgang/.test(txt('mine'))}; PHONE.show(false);
  return R; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 900, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(RULES); print('rules:', json.dumps(r, ensure_ascii=False))
        c = r['chain']
        print(ok(abs(c['open'] - 9257) <= 1 and abs(c['lukket'] - 72945) <= 1 and abs(c['u11'] - 19164) <= 1 and abs(c['g11'] - 19036) <= 1 and abs(c['g15'] - 17407) <= 1 and abs(c['g21'] - 12796) <= 1), 'the chain from Norway\'s 139 827 t of cod gives § 5 of J-161-2026: the open group, the closed group and its four length groups', c)
        l = r['lic26']
        print(ok(abs(l['u7'] - 10625) <= 1 and abs(l['h20'] - 71764) <= 2 and l['u7h'][0] in (None, float('inf')) and l['u7h'][1] == 5391 and l['h20s'] == [68360, 45570]), 'vessel quotas for 2026 as in §§ 16, 18 and 19 (under 7 m: 10.625 t cod, no haddock maximum; 20–20.9 m on a 21 m boat: 71.764 t cod, saithe 68.36 / 45.57 t)', l)
        print(ok(abs(r['nor25'] - 163436) / 163436 < 0.005), 'Norway\'s cod quota from the total quota: 2025 within 0.5 % (163 436 t)', r['nor25'])
        print(ok(312667 <= r['tac27'][0] and r['tac27'][1] <= 312667 * 1.08 + 100), 'the 2027 total quota is the advice (312 667 t) or up to 8 % over it, as in 2026', r['tac27'])
        s = r['stops']
        print(ok(9 <= s['none'] <= 33 and 59 <= s['min'] and s['max'] <= 151 + 7 and 85 <= s['med'] <= 135), 'the open group in 2027, 60 saves: about a third of the years without a stop (3 of 8 in 2019–2026), the stops announced before June, the middle one in April', s)
        print(ok(s['raisedStop'] == 0), 'no raise before a stop: the maximum quotas are only raised when the group quota will not be taken', s)
        f = r['ff']
        print(ok(f['start'] and f['early'] == 0 and f['sorted'] and 30 <= f['raised'] <= 54 and f['max'] <= 0.5), 'the fresh-fish scheme: 20 % from 29 June, raised in most autumns (6 of 9 years in 2017–2025) to at most 50 %', f)
        print(ok(r['stockF'][0] == 1 and 0.6 <= r['stockF'][1] <= 1.6 and r['stockF'][2] == 1), 'the fish follow the spawning stock: 1 in March 2027, within 0.6–1.6 later, and only for cod, haddock and saithe', r['stockF'])
        se = await pg.evaluate(SEASON); print('season:', json.dumps(se, ensure_ascii=False)[:600])
        print(ok(se['stop'] == se['ann'] + 7 and 'om en uke' in se['newsAnn'] and 'stoppet' in se['newsStop']), 'the Coast Post announces the stop a week ahead, and again on the day', se['newsAnn'][:80], '…')
        print(ok(se['lim']['before'] == se['lim']['max'] and se['lim']['after'] == se['lim']['guar'] < se['lim']['max']), 'the skiff fishes on its maximum quota until the stop, and on the guaranteed quota after it', se['lim'])
        tr = await pg.evaluate(TRADE); print('trade:', json.dumps(tr, ensure_ascii=False)[:1400])
        print(ok(not tr['p29']['lic'] and tr['p29']['torsk'] == 1200 and tr['p29']['type'] == 'skiff'), '§ 29: back in the open group the owner\'s cod this year follows (1.2 t), not the closed-group boat\'s', tr['p29'])
        bu = tr['buy']
        print(ok(bu['lic'] == 'u7' and bu['reg'][1] == bu['reg'][0] - 1 and bu['since'] and bu['from'] and 0 <= bu['seller'] <= 0.85 * bu['quota']), 'buying a right takes one NPC owner out of the register, and his catch this year comes off the quota', bu)
        st = tr['struct']
        print(ok(st['n'] == 2 and abs((st['c1'] - st['c0']) / st['c0'] - 0.9) < 0.01 and st['c2'] > st['c1'] and st['c3'] == st['c2'] and not st['room'] and st['small'] is False and st['until'] == st['until']), 'structure quotas: each adds the right less 10 %, for 20 years, and the third is stopped by the cap of three times the own quota; under 11 m cannot structure', st)
        print(ok(tr['hyse']['conf'] > 100 and tr['hyse']['keptH'] <= 301), 'over the haddock maximum quota only 30 % of the landing may be haddock; the rest is confiscated', tr['hyse'])
        tw = tr['two']
        print(ok(tw['fleet'][1] == tw['fleet'][0] - 1 and tw['two'] == 'h7' and abs(tw['quota'][1] - tw['quota'][0] - tw['quota'][2]) <= 2), 'the special scheme: one boat sold, the other fishes both quotas (9–9.9 m + 7–7.9 m)', tw)
        co = tr['coop']
        print(ok(co['on'] and co['coopCrew'] and co['quota'][1] > co['quota'][0] and co['paid'] and co['after']['coop'] is None and co['after']['crew'] == co['crew'] - 1), 'quota cooperation: the owner signs on, his quota comes aboard, he is paid for the cod on it, and goes ashore at new year', co)
        a = tr['app']
        print(ok(all(a.values())), 'the Kvote app has four tabs: my quotas, the open group, the stocks and the market', a)
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
