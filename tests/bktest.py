from _env import GAME, boot
# Greenland halibut (blåkveite, 07.10.2026; docs/plan-blakveite.md): the sea floor offshore (tools/map/deep.py), where the fish stands
# (eggaArea: the shelf edge at 300-1100 m, north of 62° N, thinner in winter south of 70° N), the jig hardly takes it and the bank line
# does, the direct fishery from 25 May with the maximum quota by length, 7 % bycatch outside it, and the rules (J-241-2025).
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 900, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.evaluate("""() => { S.mult = 0; window.HOUR = (y, m, d, h) => (Date.UTC(y, m, d, h) - EPOCH) / 3.6e6;
          window.atSea = p => { const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {...p}; b.heading = 1.2; b.gop = null; };
          window.hand = () => Object.assign(genCrew(), {bi:false, off:false}); window.hStep = n => { for (let i = 0; i < n && S.boat.gop; i++) step(); }; }""")
        # 1. the depth: out along transects off Andøya and Vesterålen (into and past the coast's tiles), and a point on the edge
        r = await pg.evaluate("""(async () => { const R = {}, line = (la, lo, br, km) => { const p0 = P(la, lo), a = br * Math.PI / 180; return {x:p0.x + Math.sin(a) * km, y:p0.y - Math.cos(a) * km}; };
          const walk = async (la, lo, br) => { const out = []; for (let d = 0; d <= 80; d += 2){ const q = line(la, lo, br, d); try { await mapNeed(q, 2); } catch (e){} out.push([d, Math.round(depthF(q)), q]); } return out; };
          const A = await walk(69.30, 15.90, 300), V = await walk(68.90, 14.60, 300);
          R.andoyaMax = Math.max(...A.map(e => e[1])); R.vestMax = Math.max(...V.filter(e => e[0] >= 44).map(e => e[1]));
          const e = A.find(e => e[1] > 600 && e[1] < 850); R.edge = e ? {km:e[0], d:e[1]} : null; window.EDGE = e ? e[2] : null;
          const dp = A.find(e => e[1] > 1200); window.DEEP = dp ? dp[2] : null; R.deep = dp ? dp[1] : null;
          return R; })()""")
        print('depth:', json.dumps(r))
        print(ok(r['andoyaMax'] > 1500 and r['vestMax'] > 1000 and r['edge'] and r['deep']), 'the shelf edge is in the depth off Andøya and Vesterålen, also past the tiles of the coast (more than 1000 m)')

        # 2. where the fish is
        r = await pg.evaluate("""(async () => { const R = {}, Hj = HOUR(2028, 5, 10, 8), Hw = HOUR(2028, 0, 10, 8), E = window.EDGE;
          R.edgeJun = +density('blakveite', E, Hj).toFixed(3); R.edgeJan = +density('blakveite', E, Hw).toFixed(3);
          const g = GROUNDS[2].p; R.bankJun = +density('blakveite', g, Hj).toFixed(4); R.bankDepth = Math.round(depthF(g));
          R.deepJun = +density('blakveite', window.DEEP, Hj).toFixed(4);
          const sk = P(58.30, 9.40); try { await mapNeed(sk, 2); } catch (e){} R.skagDepth = Math.round(depthF(sk)); R.skag = +density('blakveite', sk, Hj).toFixed(4);
          R.area = [eggaArea(E, 700, Hj, 1), eggaArea(E, 250, Hj, 1), eggaArea(E, 1200, Hj, 1)].map(v => +v.toFixed(3));
          R.seeds = ALLSP.indexOf('krabbe') === 8 && ALLSP[ALLSP.length - 1] === 'blakveite' && SP.includes('blakveite');
          return R; })()""")
        print('where:', json.dumps(r))
        print(ok(r['edgeJun'] > 0.2 and r['bankJun'] < 0.01 and r['deepJun'] < 0.01 and r['skag'] < 0.001), 'on the edge at 600-850 m off Andøya, none on the cod bank, none deeper than 1100 m and none south of 62° N (the Skagerrak trench)')
        print(ok(r['edgeJan'] < 0.6 * r['edgeJun'] and r['area'][1] == 0 and r['area'][2] == 0 and r['area'][0] > 0.5), 'thinner off Andøya in winter (the spawners are further north), and only between 300 and 1100 m')
        print(ok(r['seeds']), 'the other species keep their seeds: the crab is still the ninth, the Greenland halibut last')

        # 3. the jig hardly takes it, the bank line does; the end lines take time on deep water
        r = await pg.evaluate("""(() => { const R = {}, b = S.boat, E = window.EDGE; S.t = Math.round(HOUR(2028, 5, 10, 6) * 60);
          S.stock = initStock(); S.bstk = {}; S.hold = []; S.facc = {}; S.fnext = {}; b.gear = true; S.equip.jukse = 2; b.ice = 500; S.settings.gut = true; S.settings.ice = true;
          atSea(E); b.status = 'fishing'; b.fishUntil = S.t + 480; for (let i = 0; i < 480 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 5, 0.5); }
          R.jig = Math.round(S.hold.filter(x => x.sp === 'blakveite').reduce((a, x) => a + x.kg, 0)); R.jigAll = Math.round(holdTotal());
          S.hold = []; S.pgear = newPGear(); S.pgear.kits.n = 2; S.pgear.lines.bank = {n:10, baited:10, bt:{makrell:10}}; S.equip.linehaler = true; S.crew = [hand()];
          atSea(E); b.rig = 'line'; const why = startSet('line', {lk:'bank', n:10}, 0); R.setWhy = why; R.leadSet = b.gop && b.gop.lead; hStep(600); b.status = 'idle';
          for (let k = 0; k < 20 * 60; k++) step();
          const s = S.sets.find(x => x.kind === 'line'); R.depth = s && s.depth; atSea(s.a); startHaul(s.id); R.leadHaul = b.gop && b.gop.lead; hStep(1200);
          R.line = Math.round(S.hold.filter(x => x.sp === 'blakveite').reduce((a, x) => a + x.kg, 0)); R.lineAll = Math.round(holdTotal());
          return R; })()""")
        print('gear:', json.dumps(r))
        print(ok(r['jig'] <= 10 and r['setWhy'] is None and r['line'] > 100 and r['line'] > 0.4 * r['lineAll']), 'the jig hardly takes Greenland halibut on the edge; ten tubs of bank line over 20 hours do, and it is most of their catch')
        print(ok((r['leadSet'] or 0) >= 15 and (r['leadHaul'] or 0) >= 25), 'setting and hauling take longer on deep water (the end lines)')

        # 4. the direct fishery and the landing: 7 % bycatch outside the period, the maximum quota inside it (with blad B)
        r = await pg.evaluate("""(() => { const R = {}, y = 2028, ss = bkSeason(y), d = gDate(ss.open);
          R.open = [d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()]; R.days = ss.days; R.max = [bkMax(10.5, 2026), bkMax(14, 2026), bkMax(19.99, 2026), bkMax(25, 2026), bkMax(40, 2026)]; R.max28 = bkMax(10.5, 2028); R.f28 = +bkTacF(2028).toFixed(3);
          const fill = () => { S.hold = [{sp:'torsk', cls:2, kg:100, n:30, bled:true, iced:true, hr:0, fresh:90, gut:true, hook:true}, {sp:'blakveite', cls:1, kg:100, n:50, bled:true, iced:true, hr:0, fresh:90, gut:false, hook:true}]; };
          S.bkq = null; S.fm = {b:true}; const q = quotaState();
          fill(); const Hm = HOUR(y, 2, 10, 12); R.marchConf = +(landConf(Hm, q, access()).confBy.blakveite || 0).toFixed(3);
          fill(); const Hj = ss.open + 72; R.juneConf = +(landConf(Hj, q, access()).confBy.blakveite || 0).toFixed(3);
          S.fm = {b:false}; fill(); R.juneNoB = +(landConf(Hj, q, access()).confBy.blakveite || 0).toFixed(3);
          S.fm = {b:true}; S.bkq = {y, v:{[S.cur]:bkMax(BOAT.len) - 40}, wk:-1, wtot:0, wbk:0}; fill(); R.overMax = +(landConf(Hj, q, access()).confBy.blakveite || 0).toFixed(3);
          S.hold = []; S.bkq = null; return R; })()""")
        print('quota:', json.dumps(r))
        print(ok(r['open'][:2] == [5, 25] and 30 <= r['days'] <= 97 and r['max'] == [9700, 10900, 10900, 12100, 12100]), 'the direct fishery opens on 25 May for 30-97 days; maximum quotas 9.7, 10.9 and 12.1 t by length (J-241-2025 § 6)')
        print(ok(abs(r['max28'] - round(9700 * r['f28'] / 100) * 100) < 1 and 0.5 < r['f28'] < 1.6), 'from 2027 the maximum quotas follow the total quota', r['max28'], r['f28'])
        print(ok(abs(r['marchConf'] - 0.86) < 0.01 and r['juneConf'] == 0 and abs(r['juneNoB'] - 0.86) < 0.01 and abs(r['overMax'] - 0.6) < 0.01), 'outside the period (or without blad B) all but 7 % of the landing is confiscated; inside it up to the maximum quota', r)

        # 5. the rules where you are
        r = await pg.evaluate("""(() => { const E = window.EDGE, y = 2028, ss = bkSeason(y), ks = (H, p, b) => { S.fm = {b}; return rulesAt({p, H, len:10.5, gear:'line'}).items.filter(x => /^bk/.test(x.k)).map(x => x.k + (x.block ? '!' : '')); };
          const R = {june:ks(ss.open + 48, E, true), march:ks(HOUR(y, 2, 10, 12), E, true), noB:ks(ss.open + 48, E, false), deep:ks(ss.open + 48, window.DEEP, true), min:ruMinSize('blakveite', E)}; S.fm = null; return R; })()""")
        print('rules:', json.dumps(r))
        print(ok(r['june'] == ['bk5o'] and r['march'] == ['bk5c'] and r['noB'] == ['bkB'] and r['deep'] == ['bk1000!'] and r['min'] == 45), 'the rules: open in the period, bycatch only outside it or without blad B, no bottom gear deeper than 1000 m, minimum size 45 cm')

        # 6. the stock year by year (STOCK.blakveite), the Coast Post on the opening, the stop notice, the stop, the advice and the total quota
        r = await pg.evaluate("""(() => { const R = {}, y = 2028, ss = bkSeason(y), day = H => Math.floor(H / 24), tt = H => newsForDay(day(H) + (H % 24 ? 1 : 0)).map(n => (n.h || n[0] || {}).no || JSON.stringify(n)).join(' | ');
          R.s26 = stockYear('blakveite', 2026); R.s27 = stockYear('blakveite', 2027); R.s30 = stockYear('blakveite', 2030); R.f = +stockF('blakveite', HOUR(2030, 5, 1, 0)).toFixed(3);
          R.open = tt(ss.open); R.notice = tt(ss.notice); R.stop = tt(ss.stop); R.adv = tt(HOUR(y, 5, 26, 0)); R.tac = tt(HOUR(y, 9, 17, 0)); return R; })()""")
        print('stock:', json.dumps({k: r[k] for k in ('s26', 's27', 's30', 'f')}))
        print(ok(r['s26']['ssb'] == 55174 and r['s26']['tac'] == 19000 and r['s27']['adv'] == 19610 and r['s27']['ssb'] == 52635 and r['s30']['ssb'] > 20000 and 0.6 <= r['f'] <= 1.6), 'the stock: 2026 and the advice for 2027 from HI, a model after that, and it moves the fish (stockF)')
        print(ok('Blåkveitefisket er i gang' in r['open'] and 'Blåkveitefisket stopper' in r['notice'] and 'Blåkveitefisket er stoppet' in r['stop'] and 'blåkveite' in r['adv'] and 'Totalkvoten for blåkveite' in r['tac']), 'the Coast Post: the opening, the stop three days ahead, the stop day, the advice in June and the total quota in October', {k: r[k][:160] for k in ('open', 'notice', 'stop')})

        # 7. the orders: every plant north of 62° N orders Greenland halibut in the direct fishery, for a boat with line or nets on blad B
        r = await pg.evaluate("""(() => { const R = {}, y = 2028, ss = bkSeason(y), b = S.boat; S.fm = {b:true}; S.bkq = null; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p};
          S.pgear = newPGear(); S.pgear.lines.bank = {n:20, baited:0, bt:{}}; S.rep = S.rep || {};
          const run = H => { const sp = {}; for (let i = 0; i < 40; i++){ const O = ordState(); O.offers = []; O.active = []; ordersTick(H); for (const o of O.offers) if (o.sp === 'blakveite') sp[o.id] = o; } return Object.values(sp); };
          const at6 = H => { let h = Math.floor(H); while (gDate(h).getUTCHours() !== 6) h++; return h; }, Hin = at6(ss.open + 24), Hout = at6(ss.open - 96);
          const inn = run(Hin); R.inN = inn.length; R.kg = inn.map(o => o.kg).slice(0, 5); R.days = inn.length ? inn[0].days : null;
          R.outN = run(Hout).length; S.pgear = newPGear(); R.noGearN = run(Hin).length; S.pgear.nets.push({id:'n1', mesh:200, n:20, cond:1}); S.fm = {b:false}; R.noBN = run(Hin).length; S.fm = {b:true};
          R.plants = {husoy:bkPlant('husoy'), south:PORTS.filter(q => q.mottak && natLL(q.p).lat < 61).slice(0, 1).map(q => bkPlant(q.id))[0], north:PORTS.filter(q => q.coastal && q.mottak && natLL(q.p).lat >= 62).length, withBk:PORTS.filter(q => q.coastal && q.mottak && q.mk && q.mk.sp && q.mk.sp.blakveite).length};
          R.room = turRoom('blakveite', Hin); S.pgear = newPGear(); const O = ordState(); O.offers = []; O.active = []; S.fm = null; return R; })()""")
        print('orders:', json.dumps(r))
        print(ok(r['inN'] > 0 and all(300 <= k <= 3000 for k in r['kg']) and r['days'] == 4 and r['outN'] == 0 and r['noGearN'] == 0 and r['noBN'] == 0), 'orders for Greenland halibut in the direct fishery only, for a boat on blad B with line or nets: 300-3000 kg in four days')
        print(ok(r['plants']['husoy'] and r['plants']['south'] is False and r['plants']['north'] > 50 and r['plants']['withBk'] == r['plants']['north']), 'every plant north of 62° N takes it (and none south of it orders it)')
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
