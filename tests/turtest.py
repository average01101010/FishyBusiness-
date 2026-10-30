"""Turoppdrag (core/09g-turer.js, ui/05f-turer.js; docs/engasjement.md point 4, Jonas 07.10.2026; paid for the job, #73, 19.10.2026): a board made from where the boat
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
        # (the sections take missions one after another and leave some under way: the limit of two is checked with the economy below)
        await pg.evaluate("TUR.maxAct = 9")
        b = await pg.evaluate("""(() => { S.adm = Object.assign(S.adm || {}, {noEnergy:true}); S.boat.fuel = BOAT.fuelCap; fsState().p = fsNeed(4); const T = turEnsure(true), B = T.board;
          return {n:B.length, cls:B.map(m => m.cls), kinds:B.map(m => m.k), rate:Math.round(turRate()), cap:Math.round(turCap()), v:turV(), range:Math.round(turRange()),
            ok:B.every(m => m.pay >= 500 && m.hTot >= m.h * 2.5 && (m.cls === 'sesong' || (m.h >= TUR.cls[m.cls].h[0] && m.h < TUR.cls[m.cls].h[1] * (m.k === 'garn' ? 1.6 : 1)))),
            perH:Object.fromEntries(B.filter(m => m.k !== 'garn').map(m => [m.cls, Math.round(m.pay / m.h)])), mins:B.map(m => turMinR(m.h))}; })()""")
        ph = b['perH']
        check(b['n'] >= 3 and 'kort' in b['cls'] and b['ok'] and b['rate'] == b['cap'],
              'the board: short, middle and long missions by the real time to sail; paid by the boat\'s hourly curve (ordinary fishing without haill); deadlines at least 2.5 times the time without trim', b)
        # 1a. an order the player fishes for gets the hours the kilos take on top (alternative A, Jonas 26.10.2026, #92 and #93): longer
        #     than freight with the same sailing, growing with the kilos, and the board's own orders carry it
        fh = await pg.evaluate("""(() => { const h = 2, frakt = h * 2.5 + 12, B = S.turer.board.filter(m => m.k === 'best');
          return {best300:+turBestH(h, 300, 'torsk').toFixed(1), best1500:+turBestH(h, 1500, 'torsk').toFixed(1), frakt, fish300:+turFishH(300, 'torsk').toFixed(1), fish1500:+turFishH(1500, 'torsk').toFixed(1),
            onBoard:B.map(m => [m.kg, +m.hTot.toFixed(1), +turBestH(m.h, m.kg, m.sp).toFixed(1)]), gear:{hands:handsAboard(), line:!!hasHauler('line'), garn:!!hasHauler('garn')}}; })()""")
        check(fh['best300'] > fh['frakt'] and fh['best1500'] > fh['best300'] and fh['fish1500'] > fh['fish300'] and all(abs(x[1] - x[2]) < 0.2 for x in fh['onBoard']),
              'an order\'s deadline: longer than freight with the same sailing, and longer the more kilos it asks for (the hours the gear takes, turFishH)', fh)
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
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); const c0 = cargoRoom(); const err = turTake(m.id); const loaded = c0 - cargoRoom(), fish = holdTotal();   // (freight goes on deck first, schema v2: the room for freight shrinks, the hold only beyond the deck)
          const cash0 = S.cash; dock(m.to); const done = T.done.find(d => d.id === m.id);
          return {err, kg:m.kg, loaded, fish, after:cargoKg(), done:!!(done && done.ok), gain:S.cash - cash0, pay:m.pay}; })()""")
        check(fr.get('none') or (fr['err'] is None and abs(fr['loaded'] - fr['kg']) < 0.5 and fr['fish'] < 0.5 and fr['after'] < 0.5 and fr['done'] and fr['gain'] == fr['pay']),
              'freight is loaded at the quay and takes the room for freight, on deck first (it is no part of the catch); delivered, it leaves the boat and pays', fr)
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
        #    in three stages (30.10.2026): a third landed pays a third and the mission goes on; all of it pays the rest, the whole reward in all;
        #    a week that runs out after one stage keeps what was paid and stands as partly done, not as failed
        se = await pg.evaluate("""(() => { const T = turState(), ty = S.boat.type; S.boat.type = 'sjark'; applyVessel(); const m = turSesong(turHere()); S.boat.type = ty; applyVessel(); if (!m) return {none:true};
          m.id = ++T.seq; m.until = S.t + 1440; T.board.push(m); turTake(m.id); const cash0 = S.cash, st = turStages(m);
          turSale(m.to, {[m.sp]:st.at[0]}); const one = {act:T.act.some(x => x.id === m.id), stage:m.stage, paid:m.paid, gain:S.cash - cash0};
          turSale(m.to, {[m.sp]:m.kg - st.at[0]}); const done = T.done.find(d => d.id === m.id), all = {done:!!(done && done.ok), gain:S.cash - cash0, pay:m.pay, sum:st.part.reduce((a, b) => a + b, 0)};
          // a second move: one stage, then the week runs out
          S.boat.type = 'sjark'; applyVessel(); const m2 = turSesong(turHere()); S.boat.type = ty; applyVessel(); let out = null;
          if (m2){ m2.id = ++T.seq; m2.until = S.t + 1440; T.board.push(m2); turTake(m2.id); const c1 = S.cash, s2 = turStages(m2); turSale(m2.to, {[m2.sp]:s2.at[0]}); m2.due = S.t - 1; turHour();
            const d2 = T.done.find(d => d.id === m2.id); out = {ended:!!d2, ok:d2 && d2.ok, part:d2 && d2.part, pay:d2 && d2.pay, kept:S.cash - c1, first:s2.part[0]}; }
          return {sp:m.sp, to:m.to, nm:m.nm, kg:m.kg, at:st.at, part:st.part, one, all, out}; })()""")
        check(se.get('none') or (se['one']['act'] and se['one']['stage'] == 1 and se['one']['gain'] == se['part'][0] and se['all']['done'] and se['all']['gain'] == se['all']['pay'] and se['all']['sum'] == se['all']['pay'] and se['at'][2] == se['kg']
                                 and (se['out'] is None or (se['out']['ended'] and not se['out']['ok'] and se['out']['part'] and se['out']['pay'] == se['out']['first'] and se['out']['kept'] == se['out']['first']))),
              "the season's move in three stages: a third landed pays a third and goes on, all of it pays the whole reward in all; a week that runs out after one stage keeps that stage's pay and stands as partly done", se)
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
          return {cards, tav:/Tavla/.test(txt), act, dine:/Dine oppdrag/.test(txt2), best:/Bestillinger/.test(best), ring:/turmk/.test(svg), omvei:!turWay() || /Omvei/.test(txt)}; })()""")
        check(u['cards'] >= 3 and u['tav'] and u['act'] == 1 and u['dine'] and u['best'] and u['ring'] and u['omvei'],
              "the Oppdrag app shows the board (with the detour when the boat has a way), a mission is taken from it, the orders have their own tab, and the chart rings where it goes", u)
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
        # the missions' economy (Jonas 19.10.2026, tilbakemelding #73): paid by the boat's curve whatever the player's own landings (haill),
        # the price shown is the price paid whatever else is under way, two at most; the supply: a place every 18 game hours, at most four,
        # a third as often once the week's missions are over 30 % of the week's income
        ec = await pg.evaluate("""(() => { const T = turState(), cap = turCap(), keep = {sales:S.sales, act:T.act, done:T.done, board:T.board, slots:T.slots, slotT:T.slotT};
          T.act = []; T.done = []; S.sales = [{t:S.t - 600, v:S.cur, port:'x', kg:500, total:cap / GAME_RATE * 30 * 5, sp:[]}]; const rich = turRate() / cap;
          S.sales = []; const none = turRate() / cap;
          const m = {base:10000}, a0 = turFinal(m); T.act = [{pay:0}]; const a1 = turFinal(m); T.act = [{pay:0}, {pay:0}]; const a2 = turFinal(m);
          TUR.maxAct = 2; T.board = [{id:-5, k:'frakt', cls:'kort', until:S.t + 999, base:1000, pay:1000, kg:0}]; const two = turTake(-5); T.act = []; TUR.maxAct = 9;
          T.board = []; T.slots = 0; T.slotT = S.t - 18 * 60; T.at = {t:S.t, x:turHere().x, y:turHere().y}; turEnsure(); const one = {slots:+T.slots.toFixed(2), n:T.board.length};
          T.slotT = S.t - 100 * 18 * 60; turEnsure(); const cap4 = {slots:+T.slots.toFixed(2), n:T.board.length};
          T.board = []; T.slots = 0; T.slotT = S.t - 18 * 60; S.sales = [{t:S.t - 600, v:S.cur, port:'x', kg:500, total:100000, sp:[]}]; T.done = [{ok:true, t:S.t - 60, pay:400000}];
          const slow = turSlow(); turEnsure(); const slowSlots = +T.slots.toFixed(2);
          Object.assign(S, {sales:keep.sales}); Object.assign(T, {act:keep.act, done:keep.done, board:keep.board, slots:keep.slots, slotT:keep.slotT});
          return {rich:+rich.toFixed(2), none:+none.toFixed(2), a0, a1, a2, two, one, cap4, slow, slowSlots}; })()""")
        check(ec['rich'] == 1 and ec['none'] == 1 and ec['a0'] == ec['a1'] == ec['a2'] == 10000 and ec['two'] and 'to oppdrag' in ec['two']
              and abs(ec['one']['slots'] - 1) < 0.02 and ec['cap4']['slots'] == 4 and ec['slow'] and abs(ec['slowSlots'] - 0.33) < 0.02,
              "the pay is the boat's curve whatever the player's landings, and the price shown is the price paid with other missions under way; two at most; a new place on the board every 18 game hours, at most four, a third as often past 30 % of the week's income", ec)
        # the season's move: kilos from the player's own week, at most two holds and 70 % of the quota left; no crab without pots; no cod when the cod is fished
        se2 = await pg.evaluate("""(() => { const T = turState(), keep = {sales:S.sales, act:T.act}, o = turHere(), out = [], hold = BOAT.holdCap; T.act = [];
          S.sales = [{t:S.t - 600, v:S.cur, port:'x', kg:hold * 6, total:100000, sp:[['torsk', hold * 6]]}];
          for (let i = 0; i < 6; i++){ const m = turSesong(o); if (m) out.push({sp:m.sp, kg:m.kg, room:turRoom(m.sp, S.t / 60)}); }
          const crab = turSpOk('krabbe'), pots = S.pgear && S.pgear.pots ? S.pgear.pots.big : 0;
          S.sales = keep.sales; T.act = keep.act; return {out, hold, crab, pots}; })()""")
        o2 = se2['out']
        check(all(x['kg'] <= 2 * se2['hold'] + 50 and (x['room'] is None or x['kg'] <= 0.7 * x['room'] + 50) for x in o2) and (se2['crab'] == (se2['pots'] > 0)),
              "the season's move: at most two holds and 70 % of what is left on the quota; crab only with pots aboard", se2)
        # the board is rolled by moving far once a game day at most; old missions are brought down to the new rules when the save opens
        rr = await pg.evaluate("""(() => { const T = turEnsure(true); T.mvDay = null; T.slots = 4; const seq0 = T.seq, b = S.boat, p0 = {x:b.pos.x, y:b.pos.y};
          b.pos = {x:p0.x + 50, y:p0.y}; turEnsure(); const seq1 = T.seq; b.pos = {x:p0.x + 100, y:p0.y}; turEnsure(); const seq2 = T.seq; b.pos = p0;
          const old = {k:'sesong', cls:'sesong', to:'x', sp:'sei', kg:BOAT.holdCap * 3, got:0, h:12, hTot:150, pay:400000, id:999};
          const keep = T.act; T.act = [old]; T.v = 1; turState(); const after = {kg:old.kg, pay:old.pay, v:T.v, slots:T.slots}; T.act = keep;
          return {moved1:seq1 > seq0, moved2:seq2 > seq1, kg:after.kg, pay:after.pay, v:after.v, slots:after.slots, hold:BOAT.holdCap}; })()""")
        check(rr['moved1'] and not rr['moved2'] and rr['kg'] <= 2 * rr['hold'] and rr['pay'] < 400000 and rr['v'] == 3 and rr['slots'] == 4,
              'moving far makes a new board once a game day, not twice; a season\'s move from the oldest saves is brought down to two holds; the save comes over to the new rules with a full board', rr)
        # 14. the measurement (30.10.2026): a board seen sends tur_show once for that set of missions; a mission taken sends tur_take with its id
        #     and the real minutes allowed; given up it sends tur_fail with the same id, how it ended ('drop') and the share of the deadline used
        ev = await pg.evaluate("""(() => { const T = turState(), EV = []; const keep = {ev:cloudEv, act:T.act, shown:T.shown}; cloudEv = (k, d) => EV.push({k, d}); T.act = []; T.shown = null;
          turEnsure(true); turPage(); turPage(); const shows = EV.filter(e => e.k === 'tur_show').length, show = EV.find(e => e.k === 'tur_show');
          const m = T.board[0]; turTake(m.id); const take = EV.find(e => e.k === 'tur_take'); S.t += 30; turDrop(m.id); const fail = EV.find(e => e.k === 'tur_fail');
          cloudEv = keep.ev; T.act = keep.act; T.shown = keep.shown;
          return {shows, show:show && show.d, take:take && take.d, fail:fail && fail.d, id:m.id}; })()""")
        check(ev['shows'] == 1 and ev['show'] and ev['show']['n'] >= 1 and ev['take'] and ev['take']['id'] == ev['id'] and ev['take']['allow'] > ev['take']['min']
              and ev['fail'] and ev['fail']['id'] == ev['id'] and ev['fail']['how'] == 'drop' and 0 < ev['fail']['frac'] < 1 and ev['fail']['pay'] == 0,
              'the measurement: tur_show once per board seen; tur_take with the mission\'s id and the minutes allowed; given up, tur_fail with the same id, how=drop and the share of the deadline used', ev)
        # 15. the first mission (30.10.2026): a player who has landed once and never taken a mission gets a short freight of mail laid on top of the
        #     board, a few miles on, with a week's deadline, told once by the harbour; it takes no place on the board; none once a mission is done
        fm = await pg.evaluate("""(() => { const T = turState(), EV = [], keep = {ev:cloudEv, done:T.done, act:T.act, board:T.board, slots:T.slots, told:T.firstTold, landN:S.landN, msgs:S.msgs.length}; cloudEv = (k, d) => EV.push({k, d});
          T.done = []; T.act = []; T.board = []; T.firstTold = 0; S.landN = 1; S.boat.status = 'port'; S.boat.port = S.home || PORTS[0].id; S.boat.pos = {...portById(S.boat.port).p};
          turEnsure(true); const m = T.board[0], first = m && m.first ? {k:m.k, kg:m.kg, nm:m.nm, hTot:m.hTot, pay:m.pay, from:m.from, to:m.to, n:T.board.length} : null;
          const told = S.msgs.length - keep.msgs, ev1 = EV.filter(e => e.k === 'tur_first').length; turEnsure(true); const again = T.board.filter(x => x.first).length, told2 = S.msgs.length - keep.msgs, m2 = T.board.find(x => x.first);
          const slots0 = T.slots; const err = m2 ? turTake(m2.id) : 'none'; const take = EV.find(e => e.k === 'tur_take' && e.d.first), slots1 = T.slots, act = T.act.some(x => x.first);
          T.act = []; T.done = [{id:m2 ? m2.id : 0, ok:true}]; T.board = []; turEnsure(true); const none = !T.board.some(x => x.first);
          cloudEv = keep.ev; Object.assign(T, {done:keep.done, act:keep.act, board:keep.board, slots:keep.slots, firstTold:keep.told}); S.landN = keep.landN;
          return {first, told, ev1, again, told2, err, take:take && take.d, slots0, slots1, act, none, home:S.boat.port}; })()""")
        check(fm['first'] and fm['first']['k'] == 'frakt' and 20 <= fm['first']['kg'] <= 40 and fm['first']['nm'] <= 35 and fm['first']['hTot'] == 168 and fm['first']['pay'] >= 500
              and fm['told'] == 1 and fm['ev1'] == 1 and fm['again'] == 1 and fm['told2'] == 1 and fm['err'] is None and fm['take'] and fm['take']['first'] == 1 and fm['slots1'] == fm['slots0'] and fm['act'] and fm['none'],
              "the first mission: a short freight of mail laid on top of the board after the first landing, a week to do it, told once by the harbour; taken, it uses no place on the board; none once a mission is done", fm)
        # 16. the people behind the missions (30.10.2026): an order's card names the plant's manager; taken, she sends a word; landed, she
        #     remembers how many the boat has landed there (the first, the second, the third), and the place counts it; from the third
        #     she lays an order of her own on the board (20 % over the price, no place used), told by her, and not again within a week
        pp = await pg.evaluate("""(() => { const T = turState(), keep = {done:T.done, act:T.act, board:T.board, rep:T.rep, slots:T.slots, msgs:S.msgs.length}; T.done = []; T.act = []; T.board = []; T.rep = {}; S.landN = 9;
          const o = turHere(), me = turMe(); let q = null, m = null;
          for (const cand of turPlants().filter(x => x.id !== S.boat.port).sort((a, b) => turNm(o, a.p) - turNm(o, b.p))){ const h = turNm(o, cand.p) / turV(); if (h < 0.4 || h >= 18) continue; const c = h < 3 ? 'kort' : h < 7.5 ? 'mid' : 'lang'; m = turBestAt(o, cand, h, c, me); if (m){ q = cand; break; } }
          if (!m) return {none:true};
          const name = folkPlantName(q.id), said = [], land = () => { const O = ordState(), a = O.active.find(x => x.tur === m.id); O.active = O.active.filter(x => x !== a); O.done.unshift({...a, ok:true}); turSale(q.id, {[m.sp]:m.kg}); };
          const run = () => { m = Object.assign({}, m, {id:++T.seq, until:S.t + 9999, ask:false}); m.pay = turFinal(m); T.board.push(m); const n0 = S.msgs.length; turTake(m.id); const took = S.msgs.slice(n0).map(x => x.from + ': ' + x.no); const n1 = S.msgs.length; land(); said.push({took, landed:S.msgs.slice(n1).map(x => x.from + ': ' + x.no)}); };
          run(); run(); const asksBefore = T.board.filter(x => x.ask).length; run();
          const rep = T.rep[q.id] && T.rep[q.id].n, card = turCard(T.board.length ? T.board[0] : m, false);
          const slots0 = T.slots; T.board = []; turEnsure(true); const ask = T.board.find(x => x.ask), askMsg = ask ? S.msgs[S.msgs.length - 1].from : null, slotsAfterLaid = T.slots;
          let took2 = null; if (ask){ turTake(ask.id); took2 = {slots:T.slots, prem:ordState().active.find(x => x.tur === ask.id).prem, act:T.act.some(x => x.ask)}; T.act = []; ordState().active = []; }
          T.board = []; turEnsure(true); const again = T.board.filter(x => x.ask).length;
          Object.assign(T, {done:keep.done, act:keep.act, board:keep.board, rep:keep.rep, slots:keep.slots}); ordState().active = [];
          return {name, said, asksBefore, rep, card:/Bestilling fra/.test(card), ask:ask && {prem:ask.prem, pay:ask.pay, to:ask.to, hTot:ask.hTot, base:ask.base}, askMsg, slots0, slotsAfterLaid, took2, again}; })()""")
        ok16 = pp.get('none') or (len(pp['said']) == 3 and all(any(pp['name'] in t for t in s['took']) for s in pp['said']) and 'Første gang' in ' '.join(pp['said'][0]['landed']) and 'Andre gangen' in ' '.join(pp['said'][1]['landed'])
                                  and 'Tredje gangen' in ' '.join(pp['said'][2]['landed']) and pp['rep'] == 3 and pp['card'] and pp['asksBefore'] == 0 and pp['ask'] and pp['ask']['prem'] == 0.2 and pp['askMsg'] and pp['name'] in pp['askMsg']
                                  and pp['took2'] and pp['took2']['slots'] == pp['slotsAfterLaid'] and pp['took2']['prem'] == 0.2 and pp['took2']['act'] and pp['again'] == 0)
        check(ok16, "the people: the order names the manager, she sends a word when it is taken, remembers the first, second and third landing, and from the third lays an order of her own (20 % over, no place used), not again within a week", pp)
        check(errs == [], 'sidefeil', errs[:3])
        await br.close()


asyncio.run(main())
