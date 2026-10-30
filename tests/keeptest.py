"""How the catch keeps (D3 of the operations plan, Jonas 23.10.2026, svar 15a; core/03-simulation.js KEEP, 05-vessels.js):
 - bled fish in ice follow Huss et al. (FAO 1995): E to 2 days, A to 6, B to 12, X to 16, then V
 - on deck, not iced, they keep worse by (1 + 0.1 T)^2 (FAO), T between the sea's and the air's temperature; the vessel's minute does it
 - a freezer hold (bunntral) freezes what the crew put down, with no ice, and frozen fish keep their grade
 - an RSW hold (pelagisk) chills the catch as it comes aboard
 - at the plant frozen fish is paid as fresh at its grade (Råfisklaget: the same minimum price for frozen as for fresh, uke 31 2026),
   marked frozen on the landing note, and kept out of the fresh-fish scheme (J-161-2026 § 25)
Prints OK or FEIL."""
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(() => {
  const R = {}, b = S.boat; S.tut = 0; S.crew = []; S.quota = null; S.me = S.cur;
  // 1. the curve: grade after h hours in ice from 100
  const gAt = h => grade(keepF(h / 24));
  R.curve = [47, 49, 143, 145, 287, 289, 383, 385].map(h => gAt(h)).join('');
  R.round = [100, 90, 85, 70, 50, 20, 5].every(f => Math.abs(keepF(keepDay(f)) - f) < 1e-9);
  // 2. the vessel's minute: 10 hours in port in July, one lot iced and one on deck
  S.t = Math.round((Date.UTC(2028, 6, 12, 8) - EPOCH) / 6e4); b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p};
  S.hold = [{sp:'torsk', cls:2, kg:50, n:10, bled:true, iced:true, hr:0, fresh:100, gut:true, hook:true}, {sp:'torsk', cls:2, kg:50, n:10, bled:true, iced:false, hr:0, fresh:100, gut:true, hook:true}];
  const rrs = keepRRS(S.t / 60, b.pos);
  for (let i = 0; i < 600; i++){ S.t++; vesselStep(S.t / 60); }
  R.iced = +S.hold[0].fresh.toFixed(2); R.icedWant = +keepF(10 / 24).toFixed(2);
  R.deck = +S.hold[1].fresh.toFixed(2); R.rrs = +rrs.toFixed(2); R.T = +((seaTemp(S.t / 60, b.pos) + airTemp(S.t / 60, b.pos)) / 2).toFixed(1);
  R.deckHE = +keepHours(100, 85, rrs).toFixed(1);
  // 3. a freezer trawler: the crew freeze the catch with no ice, and frozen fish keep
  b.type = 'bunntral'; applyVessel(); b.status = 'sailing'; b.port = null; b.ice = 0; S.settings.gut = true; S.settings.ice = true;
  S.crew = [0, 1, 2, 3].map(() => Object.assign(genCrew(), {bi:false, off:false, fatigue:5}));
  S.hold = [{sp:'torsk', cls:2, kg:400, n:80, bled:true, iced:false, hr:0, fresh:95, gut:false, hook:false}];
  for (let i = 0; i < 240; i++){ S.t++; deckMinute(); }
  const fz = S.hold.filter(x => x.frozen), kgF = fz.reduce((a, x) => a + x.kg, 0);
  R.freeze = {kgF:Math.round(kgF), all:Math.round(holdTotal()), ice:b.ice, f0:fz.length ? +fz[0].fresh.toFixed(2) : null};
  const f0 = fz.length ? fz[0].fresh : null; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p};
  for (let i = 0; i < 600; i++){ S.t++; vesselStep(S.t / 60); }
  R.freeze.f1 = fz.length ? +S.hold.find(x => x.frozen).fresh.toFixed(2) : null; R.freeze.kept = f0 != null && S.hold.find(x => x.frozen).fresh === f0;
  // 4. an RSW boat chills the catch as it comes aboard
  b.type = 'pelagisk'; applyVessel(); S.hold = []; addCatch('sei', 100, 1, false); R.rsw = S.hold.map(x => x.iced);
  b.type = 'sjark'; applyVessel(); S.hold = []; addCatch('sei', 100, 1, false); R.noRsw = S.hold.map(x => x.iced);
  // 5. the landing in July with the cod quota full (a sjark of the open group): frozen cod is paid as fresh at its grade (each sold alone,
  // the plant's market fresh), marked on the note, and kept out of the fresh-fish scheme
  S.crew = []; b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; R.acc = access();
  const lot = (fz, kg, sp) => Object.assign({sp:sp || 'torsk', cls:sp === 'hyse' ? 1 : 2, kg, n:Math.round(kg / 5), bled:true, iced:true, hr:0, fresh:80, gut:true, hook:false}, fz ? {frozen:true} : {});
  const sellOne = hold => { S.t = Math.round((Date.UTC(2028, 6, 12, 8) - EPOCH) / 6e4); S.quota = null; S.market = {}; const q = quotaState(); q.torsk = 99999; q.ffW = null; S.hold = hold; sell(); return {ls:S.lastSale, q}; };
  const kpk = ls => { const r = ls.lines.find(r => r.sp === 'torsk'); return r ? +(r.sum / r.kg).toFixed(2) : null; };
  const A = sellOne([lot(true, 300)]), B = sellOne([lot(false, 300)]), C = sellOne([lot(true, 300), lot(false, 100), lot(false, 600, 'hyse')]);
  R.sale = {pct:ffPct(S.t / 60), frozenKpk:kpk(A.ls), freshKpk:kpk(B.ls), ffKg:Math.round(C.ls.ffKg || 0), ffTot:Math.round(C.q.ffTot), fz:C.ls.lines.filter(r => r.sp === 'torsk').map(r => [r.fz ? 'fryst' : 'fersk', r.g, Math.round(r.kg)])};
  R.note = (S.sales || []).slice(-1).map(x => x.d && x.d.ln);
  b.type = 'skiff'; applyVessel(); b.port = 'finnsnes'; b.pos = {...portById('finnsnes').p}; S.hold = [];
  return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 900, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(JS)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['curve'] == 'EAABBXXV' and r['round']), 'bled fish in ice: E to 2 days, A to 6, B to 12, X to 16, then V (Huss et al., FAO 1995)', r['curve'])
        print(ok(abs(r['iced'] - r['icedWant']) < 0.05 and r['deck'] < r['iced'] and 1 < r['rrs'] < 9 and abs((100 - r['deck']) / (100 - r['iced']) - r['rrs']) < 0.25 * r['rrs']),
              'the vessel\'s minute: 10 h in ice as the curve, on deck (1 + 0.1 T)^2 faster', [r['iced'], r['icedWant'], r['deck'], r['rrs'], r['T'], 'E on deck for', r['deckHE'], 'h'])
        fz = r['freeze']
        print(ok(fz['kgF'] >= 399 and fz['ice'] == 0 and fz['kept']), 'a freezer hold: the crew freeze the catch with no ice, and frozen fish keep its grade', fz)
        print(ok(r['rsw'] == [True] and r['noRsw'] == [False]), 'an RSW hold chills the catch as it comes aboard (and a sjark\'s does not)', [r['rsw'], r['noRsw']])
        s = r['sale']
        print(ok(r['acc'] != 'none' and s['frozenKpk'] and s['frozenKpk'] == s['freshKpk'] and s['pct'] > 0 and s['ffKg'] <= 100 and s['ffTot'] == 600 + 100 and len(s['fz']) == 2),
              'frozen cod is paid as fresh at its grade, and only fresh fish counts on the fresh-fish scheme', s)
        print(ok(any(len(l) == 8 and l[7] == 1 for n in r['note'] if n for l in n)) if r['note'] else 'LES ', 'the landing note marks the frozen lot', r['note'])
        print('sidefeil:', errs[:5])
        await b.close()
asyncio.run(main())
