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
        b = await pg.evaluate("""(() => { S.boat.fuel = BOAT.fuelCap; fsState().p = fsNeed(4); const T = turEnsure(true), B = T.board;
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
        check(errs == [], 'sidefeil', errs[:3])
        await br.close()


asyncio.run(main())
