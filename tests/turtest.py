"""Turoppdrag (core/09g-turer.js, ui/05f-turer.js; docs/engasjement.md point 4, Jonas 07.10.2026): a board made from where the boat
is, with short, middle and long missions by the real time they take to sail, a reward that follows what the boat earns an hour and
grows with the length, and deadlines well beyond the time without trim; only what the boat can do is offered (her range on a tank, an
open boat's sheltered water); an order to a far plant, freight in the hold, lost gear with fish in it, and the season's move each run
to the end and pay; a deadline passed ends the mission; at a long departure the time it takes is told and now and then the engine is
mentioned (at most once in 20 real hours, never with trim on, never to a guest); the Oppdrag app shows the board and the chart rings
the places. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # 1. the board: classes by the time to sail, pay by the boat's hourly earnings, deadlines beyond the time without trim
        # the missions, not the skipper's sleep, are tested here: no energy (as in Admin), so a long haul does not end in sleep and the shore
        b = await pg.evaluate("""(() => { S.adm = Object.assign(S.adm || {}, {noEnergy:true}); S.boat.fuel = BOAT.fuelCap; fsState().p = fsNeed(4); const T = turEnsure(true), B = T.board;
          return {n:B.length, cls:B.map(m => m.cls), kinds:B.map(m => m.k), rate:Math.round(turRate()), v:turV(), range:Math.round(turRange()),
            ok:B.every(m => m.pay >= 500 && m.hTot >= m.h * 2.5 && (m.cls === 'sesong' || (m.h >= TUR.cls[m.cls].h[0] && m.h < TUR.cls[m.cls].h[1] * (m.k === 'garn' ? 1.6 : 1)))),
            perH:Object.fromEntries(B.filter(m => m.k !== 'garn').map(m => [m.cls, Math.round(m.pay / m.h)])), mins:B.map(m => turMinR(m.h))}; })()""")
        ph = b['perH']
        check(b['n'] >= 3 and 'kort' in b['cls'] and b['ok'] and 8000 <= b['rate'] <= 10000 and (not ('lang' in ph and 'kort' in ph) or ph['lang'] > ph['kort']),
              'the board: short, middle and long missions by the real time to sail; the pay follows what the boat earns an hour, more an hour for the long; deadlines at least 2.5 times the time without trim', b)
        # 1b. weighed by the player's own record: a newcomer gets no long trip and no season's move; an old hand's long go further;
        #     the order is for a species the player lands, about a usual landing; a plant pays a known skipper more
        w = await pg.evaluate("""(() => { const o = turHere(), fs = fsState(), p0 = fs.p, sales0 = S.sales;
          fs.p = 0; turEnsure(true); const newbie = S.turer.board.map(m => m.cls);
          fs.p = fsNeed(12); const hiOld = turHi('lang', turMe()), hiNew = (fs.p = fsNeed(4), turHi('lang', turMe()));
          S.sales = [{t:S.t, v:S.cur, port:'x', kg:180, total:5000, sp:[['hyse', 150], ['torsk', 30]]}, {t:S.t, v:S.cur, port:'x', kg:220, total:6000, sp:[['hyse', 200], ['torsk', 20]]}];
          const me = turMe(); let m = null, takes = false;
          for (const c of ['kort', 'mid', 'lang']){ m = turBest(o, c, new Set(), me); if (m) break; }
          if (m){ const q = portById(m.to), mon = gDate(S.t / 60).getUTCMonth(); takes = !!(q.mk && q.mk.sp && q.mk.sp.hyse && (q.mk.sp.hyse.months & (1 << mon)) && spCatchable('hyse', S.t / 60)) || (CUSTOMERS.find(c => c.id === m.cust) || {sp:[]}).sp.includes('hyse') && !q.mk; }
          let rep = null; if (m){ const id = m.cust; S.rep = S.rep || {}; const r0 = S.rep[id]; S.rep[id] = 100; const hi = turPay(m.h, 1) * (0.8 + repOf(id) / 250); S.rep[id] = 0; const lo = turPay(m.h, 1) * (0.8 + repOf(id) / 250); rep = Math.round(hi / lo * 100) / 100; if (r0 == null) delete S.rep[id]; else S.rep[id] = r0; }
          S.sales = sales0; fs.p = p0;
          return {newbie, hiOld, hiNew, sp:m && m.sp, kg:m && m.kg, takes, usual:me.kg, rep}; })()""")
        check(not any(c in ('lang', 'sesong') for c in w['newbie']) and w['hiOld'] == 18 and w['hiNew'] == 12 and (not w['sp'] or not w['takes'] or w['sp'] == 'hyse')
              and (not w['kg'] or 50 <= w['kg'] <= 300) and (w['rep'] is None or 1.45 < w['rep'] < 1.55),
              "weighed by the player's own record: a newcomer gets no long trip and no season's move, an old hand's long trips go to three hours; the order is for the species the player lands, about a usual landing; a known skipper is paid more", w)
        # 1c. the quotas: without access no mission asks for cod, haddock or saithe (bycatch only), and the lost gear holds none;
        #     with the cod quota fished no mission asks for cod; an order never asks for more than is left
        qu = await pg.evaluate("""(() => { const o = turHere(), H = S.t / 60, acc0 = access, q = quotaState(), t0 = q.torsk, fs = fsState(), p0 = fs.p; fs.p = fsNeed(4);
          const sps = () => { const r = []; for (let i = 0; i < 6; i++){ for (const c of ['kort', 'mid', 'lang']){ const m = turBest(o, c, new Set()); if (m) r.push([m.sp, m.kg]); } const s = turSesong(o); if (s) r.push([s.sp, s.kg]); } return r; };
          window.access = () => 'none'; const none = sps(); const g = turGarn(o); let gearSp = []; if (g){ g.id = -1; turSpawn(g); const s = S.sets.find(x => x.tur === -1); gearSp = Object.keys(s.acc); S.sets = S.sets.filter(x => x !== s); }
          window.access = acc0; q.torsk = codLimitNow(H) - 200; const tight = sps(); q.torsk = codLimitNow(H); const full = sps(); q.torsk = t0; fs.p = p0;
          return {none, gearSp, tight, full, room:Math.round(turRoom('torsk', H))}; })()""")
        ths = ('torsk', 'hyse', 'sei')
        check(not any(s in ths for s, k in qu['none']) and not any(s in ths for s in qu['gearSp']) and not any(s == 'torsk' for s, k in qu['full'])
              and all(k <= 160 for s, k in qu['tight'] if s == 'torsk'),
              'the quotas: without access no mission asks for cod, haddock or saithe and the lost gear holds none; with the cod quota fished none asks for cod; an order is never more than is left', qu)
        # 2. only what the boat can do: on a small tank nothing long is offered; a new board when she has moved more than 20 nm
        f = await pg.evaluate("""(() => { const cap = BOAT.fuelCap; BOAT.fuelCap = 3; turEnsure(true); const short = S.turer.board.every(m => m.nm * (m.k === 'garn' ? 2 : 1) <= 0.75 * turRange() + 0.5);
          BOAT.fuelCap = cap; turEnsure(true); const at = S.turer.at.t; S.t += 5; const same = turEnsure().at.t === at;
          const p0 = {x:S.boat.pos.x, y:S.boat.pos.y}, st = S.boat.status; S.boat.status = 'idle'; S.boat.pos = {x:p0.x + 45, y:p0.y}; const moved = turEnsure().at.t !== at;
          S.boat.pos = p0; S.boat.status = st; turEnsure(true); return {short, same, moved}; })()""")
        check(f['short'] and f['same'] and f['moved'], 'only what the boat can reach on her tank is offered; the board stays until she moves more than 20 nm (or the morning comes)', f)
        # 3. an order to a plant farther off: taken, it is an order with the trip's pay as bonus; landed there, the mission is done
        o = await pg.evaluate("""(() => { const T = turState(), o = turHere(); let m = null;
          for (const c of ['kort', 'mid', 'lang']){ m = turBest(o, c, new Set()); if (m) break; }
          if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); const err = turTake(m.id), ord = ordState().active.find(x => x.tur === m.id);
          const cash0 = S.cash; S.boat.status = 'port'; S.boat.port = m.to; S.boat.pos = {x:m.p.x, y:m.p.y};
          S.hold = [{sp:m.sp, cls:SPECIES[m.sp].ref, kg:m.kg + 5, n:Math.round(m.kg / 3), bled:true, iced:true, hr:0, fresh:95, gut:true}];
          sell(); const done = T.done.find(d => d.id === m.id);
          return {err, ord:!!ord, bonus:ord && ord.bonus === m.pay, done:!!(done && done.ok), act:T.act.some(x => x.id === m.id), gain:S.cash - cash0, pay:m.pay}; })()""")
        check(o.get('none') or (o['err'] is None and o['ord'] and o['bonus'] and o['done'] and not o['act'] and o['gain'] > 0),
              "an order to a plant farther off is an order with the trip's pay as its bonus, and landing it there ends the mission", o)
        # 4. freight: loaded at the quay it takes room in the hold, and delivered it pays
        fr = await pg.evaluate("""(() => { const T = turState(); S.hold = []; S.boat.status = 'port'; S.boat.port = S.home || PORTS[0].id; S.boat.pos = {...portById(S.boat.port).p};
          const o = turHere(); let m = null; for (const c of ['kort', 'mid', 'lang']){ m = turFrakt(o, c, new Set()); if (m) break; }
          if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); const c0 = capHold(); const err = turTake(m.id); const loaded = c0 - capHold(), fish = holdTotal();
          const cash0 = S.cash; dock(m.to); const done = T.done.find(d => d.id === m.id);
          return {err, kg:m.kg, loaded, fish, after:cargoKg(), done:!!(done && done.ok), gain:S.cash - cash0, pay:m.pay}; })()""")
        check(fr.get('none') or (fr['err'] is None and abs(fr['loaded'] - fr['kg']) < 0.5 and fr['fish'] < 0.5 and fr['after'] < 0.5 and fr['done'] and fr['gain'] == fr['pay']),
              'freight is loaded at the quay and takes room in the hold (it is no part of the catch); delivered, it leaves the hold and pays', fr)
        # 5. lost gear: a line (one aboard can haul it) with fish in it near the coast; hauled, the fish is aboard and the owner pays
        g = await pg.evaluate("""(() => { const T = turState(); S.hold = []; S.cargo = []; S.boat.status = 'idle'; S.boat.port = null; const o = {...S.boat.pos};
          const m = turGarn(o); if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const s = S.sets.find(x => x.tur === m.id);
          if (!s) return {set:false};
          S.boat.pos = {x:s.a.x, y:s.a.y}; S.boat.v = 0; window.__tg = {m, s}; return {set:true}; })()""")
        if g.get('set'):
            # the map round the gear is loaded as the boat comes there (here she is put there, so wait for it)
            await pg.wait_for_function("mapReadyAt(S.boat.pos, MAPD.simR)", polling=500, timeout=90000)
            g = await pg.evaluate("""(() => { const {m, s} = window.__tg, T = turState(); const why = startHaul(s.id, false, 0); const cash0 = S.cash;
          // the haul as a player does it: started again when the deck work (a full bleeding tub) has stopped it
          for (let i = 0; i < 3000 && S.sets.some(x => x.id === s.id); i++){ if (!S.boat.gop && !S.boat.deck && ['idle', 'fishing'].includes(S.boat.status) && i % 30 === 29){ S.boat.pos = {x:s.a.x, y:s.a.y}; S.boat.status = 'idle'; startHaul(s.id, false, 0); } step(); }
          const done = T.done.find(d => d.id === m.id);
          return {kind:m.kind, why, set:true, gone:!S.sets.some(x => x.tur === m.id), kg:Math.round(holdTotal()), done:!!(done && done.ok), fee:S.cash - cash0, pay:m.pay, log:S.log.slice(-5).map(l => l.no)}; })()""")
        check(g.get('none') or (g['set'] and not g['why'] and g['gone'] and g['kg'] > 0 and g['done'] and g['fee'] >= g['pay'] * 0.99),
              "lost gear with fish in it near the coast: hauled, the fish is aboard, the gear goes to its owner and the finder's fee is paid", g)
        # 5b. a boat with engine trouble: lying still beside her the line goes over, she follows astern at 5.5 knots at most and the
        #     engine burns more; brought to the harbour nearest her, the owner pays
        sl = await pg.evaluate("""(() => { const T = turState(); S.hold = []; S.cargo = []; S.boat.status = 'idle'; S.boat.port = null; S.plan = null; const o = {...S.boat.pos};
          let m = null; for (let i = 0; i < 6 && !m; i++) m = turSlep(o, 'kort') || turSlep(o, 'mid'); if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const npc0 = turNpcs().find(n => n.id === 't' + m.id);
          window.__f0 = [fuelLph(6, 5), speedCap(0.3)];   // before the line is fast (the game runs on while the map loads)
          S.boat.pos = {x:m.p.x + 0.05, y:m.p.y}; S.boat.v = 0; window.__ts = m; return {stage0:m.stage, npc0:!!(npc0 && npc0.st === 'idle' && npc0.coast)}; })()""")
        if not sl.get('none'):
            await pg.wait_for_function("mapReadyAt(S.boat.pos, MAPD.simR)", polling=500, timeout=90000)
            sl.update(await pg.evaluate("""(() => { const m = window.__ts, [f0, v0] = window.__f0; step();
              const npc = turNpcs().find(n => n.id === 't' + m.id), behind = npc ? dist(npc.p, S.boat.pos) : null;
              const r = {stage:m.stage, behind:behind && Math.round(behind * 1000), cap:speedCap(0.3), v0, fuelX:Math.round(fuelLph(6, 5) / f0 * 100) / 100, msg:S.msgs.some(x => x.from === m.owner)};
              const cash0 = S.cash; S.plan = null; dock(m.to); const d = T => T.done.find(x => x.id === m.id); r.done = !!(d(turState()) && d(turState()).ok); r.gain = S.cash - cash0; r.pay = m.pay; r.lo = m.payLo; r.hi = m.payHi; r.value = m.value; r.ins = S.msgs.some(x => x.from === 'Forsikringsselskapet' && /Bergelønn/.test(x.no)); r.gone = !turNpcs().some(n => n.id === 't' + m.id);
              // no cure, no pay: one that drifts ashore before help comes is lost, and there is nothing
              let m2 = null; for (let i = 0; i < 6 && !m2; i++) m2 = turSlep({...S.boat.pos}, 'kort'); if (m2){ m2.id = ++turState().seq; turState().board.push(m2); turTake(m2.id); const cdf = coastDistFar, c1 = S.cash; window.coastDistFar = () => 0.01; turMinute(); window.coastDistFar = cdf; const d2 = turState().done.find(x => x.id === m2.id); r.ashore = !!(d2 && !d2.ok) && S.cash === c1; }
              return r; })()"""))
        check(sl.get('none') or (sl['stage0'] == 'reach' and sl['npc0'] and sl['stage'] == 'tow' and 20 < (sl['behind'] or 0) < 80 and sl['cap'] <= 5.5 and sl['fuelX'] >= 1.4
              and sl['done'] and sl['gain'] == sl['pay'] and sl['lo'] <= sl['pay'] <= sl['hi'] <= sl['value'] and sl['ins'] and sl['gone'] and sl.get('ashore', True)),
              'a boat with engine trouble drifts until you are beside her; then she follows astern on the line, at 5.5 knots at most and with more fuel burnt; brought in, the insurer pays a salvage reward by her value and the danger, never above her value; ashore first, nothing', sl)
        # 6. the season's move (a decked sjark; the open boat keeps to sheltered water): land enough near the place before the week is out
        se = await pg.evaluate("""(() => { const T = turState(), ty = S.boat.type; S.boat.type = 'sjark'; applyVessel(); const m = turSesong(turHere()); S.boat.type = ty; applyVessel(); if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const cash0 = S.cash;
          turSale(m.to, {[m.sp]:m.kg / 2}); const half = T.act.some(x => x.id === m.id); turSale(m.to, {[m.sp]:m.kg / 2});
          const done = T.done.find(d => d.id === m.id); return {sp:m.sp, to:m.to, nm:m.nm, kg:m.kg, half, done:!!(done && done.ok), gain:S.cash - cash0, pay:m.pay}; })()""")
        check(se.get('none') or (se['half'] and se['done'] and se['gain'] == se['pay']), "the season's move: half the kilos landed there is half, all of it pays", se)
        # 7. a deadline passed ends the mission, and freight goes back
        dl = await pg.evaluate("""(() => { const T = turState(); S.boat.status = 'port'; S.boat.port = S.home || PORTS[0].id; S.boat.pos = {...portById(S.boat.port).p}; S.hold = [];
          let m = null; for (const c of ['kort', 'mid', 'lang']){ m = turFrakt(turHere(), c, new Set()); if (m) break; } if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const had = cargoKg(); m.due = S.t - 1; turHour();
          const d = T.done.find(x => x.id === m.id); return {had, after:cargoKg(), failed:!!(d && !d.ok)}; })()""")
        check(dl.get('none') or (dl['had'] > 0 and dl['after'] == 0 and dl['failed']), 'a deadline passed ends the mission, and the freight leaves the hold', dl)
        # 8. the long trip's start: when she is there; the engine mentioned on the second long departure, not again within 20 hours,
        #    never with trim on or to a guest; alone aboard it is the memory of Father
        tk = await pg.evaluate("""(() => { const T = turState(), b = S.boat; T.tip = {t:0, n:0, k:0, said:0}; S.crew.forEach(c => c.aboard = false);
          const far = {x:b.pos.x + 80, y:b.pos.y}; const go = () => { S.plan = {wps:[far], idx:0, speed:BOAT.vcruise}; const n0 = S.log.length; turDepart(); return S.log.slice(n0).map(l => l.no); };
          delete b.trim; const first = go(), second = go(), third = go();
          T.tip.t = 0; T.tip.n = 5; b.trim = {k:'pump', t0:S.t}; const trimmed = go(); delete b.trim;
          T.tip.t = 0; T.tip.n = 5; CLOUD.on = true; CLOUD.guest = true; const guest = go(); CLOUD.guest = false; CLOUD.on = false;
          S.plan = null; return {first, second, third, trimmed, guest, eta:first.some(l => /Beregnet framme/.test(l)), can:canBoost(VESSELS[b.type])}; })()""")
        tune = lambda ls: any(('pumpa' in l or 'ladeluft' in l.lower() or 'turbo' in l.lower()) for l in ls)
        check(tk['eta'] and (not tk['can'] or (not tune(tk['first']) and tune(tk['second']) and any('far' in l for l in tk['second']))) and not tune(tk['third']) and not tune(tk['trimmed']) and not tune(tk['guest']),
              'a long departure tells when she will be there; the engine is mentioned on the second (alone: the memory of Father), not again within 20 hours, never with trim on, never to a guest', tk)
        # 9. the phone's Oppdrag app: the board's cards, a mission taken from it, the orders tab, and the chart's ring
        u = await pg.evaluate("""(() => { const T = turState(); T.act = []; turEnsure(true); PHONE.show(true); PHONE.open('ordl');
          const v = document.getElementById('phView'), cards = v.querySelectorAll('.ph-card.tur').length, txt = v.innerText;
          const btn = v.querySelector('[data-pa=\"turtake\"]'); if (btn) btn.click();
          const act = T.act.length, txt2 = document.getElementById('phView').innerText;
          PHONE.dact('ordl', 'sub', {s:'best'}); PHONE.render(); const best = document.getElementById('phView').innerText; PHONE.show(false);
          const svg = turSvg(1, () => true);
          return {cards, tav:/Tavla/.test(txt), act, dine:/Dine oppdrag/.test(txt2), best:/Bestillinger/.test(best), ring:/turmk/.test(svg)}; })()""")
        check(u['cards'] >= 3 and u['tav'] and u['act'] == 1 and u['dine'] and u['best'] and u['ring'],
              "the Oppdrag app shows the board, a mission is taken from it, the orders have their own tab, and the chart rings where it goes", u)
        # 10. survey fishing for Havforskningsinstituttet: an hour at the station counts what comes up from then; ten fish on the board,
        #     read within half a centimetre, pay the time and the whole bonus; an empty station is a sample too
        pv = await pg.evaluate("""(() => { S.equip = S.equip || {}; S.equip.jukse = Math.max(1, S.equip.jukse || 0);   // a jigging reel aboard, so a station can be offered
          const T = turState(); T.act = []; S.hold = []; S.cargo = []; const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; const o = {...b.pos};
          let m = null; for (let i = 0; i < 40 && !(m && m.kind === 'stasjon'); i++) m = turProve(o, i % 2 ? 'mid' : 'kort'); if (!m || m.kind !== 'stasjon') return {none:true, gear:turGearOk()};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const stage0 = m.stage;
          b.pos = {...m.p}; b.status = 'fishing'; turProveMinute(m, b); S.hold.push({sp:'torsk', cls:0, kg:40, n:10, fresh:S.t}, {sp:'hyse', cls:0, kg:12, n:6, fresh:S.t});
          for (let i = 1; i < m.need; i++) turProveMinute(m, b);
          const r = {stage0, stage:m.stage, got:m.got, fish:turProveFish(m).length, sps:[...new Set(m.fish.map(f => f.sp))], span:m.fish.every(f => f.cm >= TUR_LEN[f.sp][0] && f.cm <= TUR_LEN[f.sp][1] && f.c0 <= f.cm && f.cm <= f.c0 + 24)};
          const cash0 = S.cash; m.meas = m.fish.map(f => Math.round(f.cm)); const base = m.pay; turProveDone(m);
          const d = T.done.find(x => x.id === m.id); Object.assign(r, {done:!!(d && d.ok), gain:S.cash - cash0, base, bonusMax:m.bonusMax, err:m.err, hi:S.msgs.some(x => x.from === 'Havforskningsinstituttet' && /Ti fisk/.test(x.no))});
          // an empty station
          let e = null; for (let i = 0; i < 40 && !(e && e.kind === 'stasjon'); i++) e = turProve(o, 'kort'); if (e && e.kind === 'stasjon'){ e.id = ++T.seq; T.board.push(e); turTake(e.id); const c1 = S.cash; b.pos = {...e.p}; for (let i = 0; i < e.need; i++) turProveMinute(e, b); const d2 = T.done.find(x => x.id === e.id); r.empty = !!(d2 && d2.ok) && S.cash - c1 === e.pay; }
          b.status = 'idle'; S.hold = []; return r; })()""")
        check(pv.get('none') or (pv['stage0'] == 'fish' and pv['stage'] == 'measure' and pv['got'].get('torsk') == 40 and pv['fish'] == 10 and pv['span'] and pv['done'] and pv['gain'] == pv['base'] + pv['bonusMax'] and pv['err'] <= 0.5 and pv['hi'] and pv.get('empty', True)),
              'survey fishing: an hour at the station counts what came up from then; ten fish of those species on the board, read within half a centimetre, pay the time and the whole bonus; an empty station is a sample too', pv)
        # 11. the echo line: the three points in order at 8 knots at most (too fast does not count), and the institute says what it saw
        ek = await pg.evaluate("""(() => { const T = turState(), b = S.boat; T.act = []; b.status = 'sailing'; const o = {...b.pos};
          let m = null; for (let i = 0; i < 60 && !(m && m.kind === 'ekko'); i++) m = turProve(o, i % 2 ? 'mid' : 'kort'); if (!m || m.kind !== 'ekko') return {none:true};
          m.id = ++T.seq; T.board.push(m); turTake(m.id); const cash0 = S.cash;
          b.pos = {...m.pts[0]}; b.v = 12; turProveMinute(m, b); const fast = m.at;
          const ats = []; for (const q of m.pts){ b.pos = {...q}; b.v = 6.5; turProveMinute(m, b); ats.push(m.at); }
          const d = T.done.find(x => x.id === m.id); b.status = 'idle'; b.v = 0;
          return {fast, ats, done:!!(d && d.ok), gain:S.cash - cash0, pay:m.pay, msg:(S.msgs.find(x => x.from === 'Havforskningsinstituttet' && /Ekkoloddlinja/.test(x.no)) || {}).no || null}; })()""")
        check(ek.get('none') or (ek['fast'] == 0 and ek['ats'][:2] == [1, 2] and ek['done'] and ek['gain'] == ek['pay'] and ek['msg']),
              'the echo line: the three points in order at no more than 8 knots (too fast does not count); the institute pays and says what the echo sounder saw', ek)
        # 12. the lighthouse picture: a light it asks for comes before the deadline; too far, out of the picture or in the wrong light it is
        #     not taken (and says when the light comes); taken, the paper prints it with the picture and pays
        fo = await pg.evaluate("""(() => { const T = turState(), b = S.boat; T.act = []; b.status = 'idle'; const o = {...b.pos};
          let m = null; for (const c of ['kort', 'mid', 'lang', 'kort', 'mid']){ m = turFoto(o, c); if (m) break; } if (!m) return {none:true};
          m.id = ++T.seq; T.board.push(m); turTake(m.id); const r = {name:turFyrName(m), lys:m.lys, d:Math.round(dist(m.p, m.fyr) * 1000)};
          r.lysOk = !m.lys || turLysNext(m, S.t / 60 + m.h) != null;
          b.pos = {x:m.fyr.x + 5, y:m.fyr.y}; r.far = turFotoTake(m, {front:true, clear:true}, null);
          b.pos = {...m.p}; r.away = turFotoTake(m, {front:false, clear:true}, null); r.hidden = turFotoTake(m, {front:true, clear:false}, null);
          if (m.lys){ const ok = TUR_LYS[m.lys].ok; TUR_LYS[m.lys].ok = () => false; r.wrong = turFotoTake(m, {front:true, clear:true}, null); TUR_LYS[m.lys].ok = ok; m.lys = null; }
          const cash0 = S.cash; r.why = turFotoTake(m, {front:true, clear:true}, 'data:image/jpeg;base64,AAAA');
          const d = T.done.find(x => x.id === m.id), news = pressList(false).find(s => s.kind === 'foto' && s.img && s.img.foto === m.id);
          Object.assign(r, {done:!!(d && d.ok), gain:S.cash - cash0, pay:m.pay, news:news ? news.h[0] : null, src:turFotoSrc(m.id) === 'data:image/jpeg;base64,AAAA', no3d:turFotoAt() ? true : false});
          return r; })()""")
        check(fo.get('none') or (fo['lysOk'] and fo['far'] and fo['away'] and fo['hidden'] and (not fo['lys'] or fo['wrong']) and fo['why'] is None and fo['done'] and fo['gain'] == fo['pay'] and fo['news'] and fo['src'] and 400 <= fo['d'] <= 1300),
              "the lighthouse picture: a light it asks for comes before the deadline; too far, out of the picture, behind something or in the wrong light it is not taken; taken, Kystposten prints it with the picture and pays", fo)
        # 13. the board has the new kinds now and then, never two of one, and the measuring board takes a reading from a tap
        bd = await pg.evaluate("""(() => { const T = turState(), b = S.boat; T.act = []; const kinds = {}; let two = false;
          for (let i = 0; i < 14; i++){ turEnsure(true); const ks = T.board.map(m => m.k); ks.forEach(k => kinds[k] = (kinds[k] || 0) + 1); if (ks.filter(k => k === 'prove').length > 1 || ks.filter(k => k === 'foto').length > 1) two = true; }
          let m = null; for (let i = 0; i < 40 && !(m && m.kind === 'stasjon'); i++) m = turProve({...b.pos}, 'kort'); let tap = null;
          if (m && m.kind === 'stasjon'){ m.id = ++T.seq; T.board.push(m); turTake(m.id); m.stage = 'measure'; m.got = {torsk:30}; turMeasure(m.id);
            const sv = document.querySelector('#turMeas svg'), r = sv.getBoundingClientRect(), f = m.fish[0], X = r.left + (f.cm - f.c0) * 15 / 360 * r.width;
            sv.onpointerdown({clientX:X}); document.querySelector('#turMeas [data-x=ok]').click(); tap = {got:m.meas[0], cm:f.cm}; document.querySelector('#turMeas [data-x=later]') && document.querySelector('#turMeas [data-x=later]').click(); }
          return {kinds, two, tap}; })()""")
        check(bd['kinds'].get('prove', 0) > 0 and bd['kinds'].get('foto', 0) > 0 and not bd['two'] and (bd['tap'] is None or abs(bd['tap']['got'] - bd['tap']['cm']) <= 1),
              'the board offers survey fishing and lighthouse pictures now and then, never two of one kind; a tap on the measuring board reads the length there', bd)
        check(errs == [], 'sidefeil', errs[:3])
        await br.close()


asyncio.run(main())
