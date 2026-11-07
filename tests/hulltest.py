"""Fysikk 3 (core/16c-hull.js): what the blows and the groundings do to the hull, the leak and the bilge pump, the water aboard, the
rescue when the engine room is full, the yard's repair, and the hull insurance (kasko). Jonas 18.10.2026: «kollisjoner og grunnstøting
skal få konsekvens, laget bra og intuitivt».
1. Blows by speed: under 1 knot nothing, 1-3 knots scratches only, from 3 knots damage, a hard blow a leak the pump keeps up with, a
   harder one more than it takes; wood takes more than steel.
2. The leak at sea: the water rises, the log and the alarm say so, the engine room fills, the engine stops and the crew calls the rescue
   boat; the rescue boat's pumps hold it; towed to the yard she is mended there (the first repair free), and the water is gone.
3. Running aground: on rock the hull is damaged and opened, on sand she gets scratches; the log says which.
4. Speed and weight: a damaged hull is slower, the water aboard weighs.
5. The hull insurance at the yard: the premium, the deductible, the claim paid over it, the premium up a quarter after the claim, and the
   monthly premium; the repair job takes the damage off when it is done.
6. The yard's card on the phone (portrait and landscape screenshots), and a second blow while a repair is queued is ordered on its own.
7. Collisions (Ø11.3, core/05e-sjovei.js; sjøloven kap. 8): by hand, in real time, into Senja's ferry crossing from the starboard side
   (rule 15: you give way, and steer at her instead): the contact in the manoeuvring model's steps, the damage to both, the fault read
   from the looks before the blow (yours), the payment, § 164 on the VHF and in the deck log (screenshots of both in both formats), and
   the ferry standing by; another player's boat lying still (no damage to her, no money); and a sea mark.
Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


OUT = os.path.join(os.path.dirname(__file__), 'out')

# 7a: a calm June morning; the ferry under way clear of the harbours; the boat you follow T game minutes off the point the ferry is at
# then, on her port side, heading across her course (the ferry comes from her starboard side: rule 15, she gives way), at 6 knots by hand
CLASH_SETUP = """async () => { PHONE.show(false); if (typeof DOCK !== 'undefined') DOCK.close(); S.jobs = []; S.cash = 1e6; S.free = {tow:1, rep:1}; WX_FORCE = {w:4, d:200};
  S.t = Math.round((Date.UTC(2027, 5, 15, 8, 5) - EPOCH) / 6e4); acc = 0;
  SJV.E.clear(); SJV.sits.clear(); SJV.trail.clear(); SJV.lp.clear(); SJV.clash.clear(); SJV.own = null; SJV.warn = null; SJV.at = -1; SJV.tl = null;
  const b = S.boat; b.type = 'hurtigsjark'; applyVessel(); b.dmg = null; b.damage = 0; b.kasko = null; b.tow = null; b.anch = null; b.hove = null; b.gop = null; S.boatName = 'Havbris'; S.home = 'finnsnes';
  const T = 2.5, vp = 10, H0 = S.t / 60;
  for (let k = 0; k < 120; k++){
    const n = npcStates(H0 + k / 60, 'ferje')[0], q = npcStates(H0 + (k + T) / 60, 'ferje')[0], q2 = npcStates(H0 + (k + T + 1) / 60, 'ferje')[0];
    if (!n || !q || !q2 || !(n.v >= 6) || !(q.v >= 6) || !(q2.v >= 6) || inHarbour(n.p) || inHarbour(q.p)) continue;
    const M = q.p, c = q.cog != null ? q.cog : q.hd, gs = gridScale(M), d = vp * NM * gs * T / 60, st = {x:M.x - Math.cos(c) * d, y:M.y - Math.sin(c) * d};
    await mapNeed(M, MAPD.simR); if (groundCheck(st, M) || inHarbour(st)) continue;
    S.t = Math.round(H0 * 60) + k; acc = 0; b.port = null; b.pos = {x:st.x, y:st.y}; b.heading = c + Math.PI / 2; b.v = vp; b.status = 'idle'; b.dyn = null; S.plan = null; DYN.line = null;
    S.settings.manual = true; helmTake(); S.helm.thr = vp / BOAT.vmax; S.helm.v = vp; S.helm.rud = 0;
    S.log.push({t:S.t, no:'Kastet loss fra Botnhamn.', en:'Cast off from Botnhamn.', k:'nav'});
    return {k, M, st, hd:b.heading, n0:SJV.nClash, t0:S.t, r0:(S.radio || []).length, c0:S.cash}; }
  return {err:'ferja går ikke under fart innen to timer'}; }"""
# one look: on the collision course across hers, and the last 250 m at full speed for the point ahead of her (she turns away, 17 a ii)
CLASH_STEER = """(L0) => { const H = (S.t + liveFrac()) / 60, f = npcStates(H).find(q => q.id === 'ferje'), p = livePose().p, hd = S.boat.heading, gs = gridScale(p);
  if (!f) return {gone:true}; const r = dist(f.p, p) / gs * 1000, want = r < 250 ? 18 : 10, v = S.helm.v || 0;
  S.helm.thr = clamp((S.helm.thr || 0) + 0.06 * (want - v) / want, 0, 1);   // (the throttle for the speed wanted: 10 knots, the last 250 m 18)
  // (for the point ahead of her where they meet at the speed she has now)
  const tg = r / Math.max(3, v * KN_MS), c = f.cog != null ? f.cog : f.hd, k = (f.v || 0) * NM / 3600 * gs * tg, q = {x:f.p.x + Math.sin(c) * k, y:f.p.y - Math.cos(c) * k}, aim = Math.atan2(q.x - p.x, -(q.y - p.y));
  const err = sjvWrap(aim - hd); S.helm.rud = clamp(2.5 * err, -1, 1);
  return {n:SJV.nClash, rng:Math.round(dist(f.p, p) / gridScale(p) * 1000), err:+(err * 180 / Math.PI).toFixed(0), v:+(S.helm.v || 0).toFixed(1), fv:f.v, st:S.boat.status}; }"""
CLASH_READ = """(L0) => { const b = S.boat, rec = (S.clashes || [])[(S.clashes || []).length - 1], Hs = (S.t + liveFrac()) / 60;
  const f1 = npcStates(Hs).find(q => q.id === 'ferje'), f2 = npcStates(Hs + 0.02).find(q => q.id === 'ferje');
  return {rec:rec && {id:rec.id, name:rec.name, kn:rec.kn, kA:rec.kA, kB:rec.kB, law:rec.law, sit:rec.sit, fa:rec.fa, fb:rec.fb, why:rec.why, own:rec.own, oth:rec.oth, owe:rec.owe, you:rec.you, got:rec.got},
    logs:S.log.filter(l => l.t >= L0.t0 && l.k === 'nav').map(l => l.no).filter(t => /Sammenstøt|Smell|sjøloven|erstatter|Rederiet/.test(t)),
    vhf:(S.radio || []).slice(L0.r0).map(x => x.from + ': ' + x.no), dmg:b.dmg && {s:+b.dmg.s.toFixed(2), h:+b.dmg.h.toFixed(2), A:+(b.dmg.A || 0).toFixed(1)},
    stand:SJV.E.has('ferje') ? SJV.E.get('ferje').why : null, still:f1 && f2 ? [f1.v, f2.v, Math.round(dist(f1.p, f2.p) * 1e6) / 1000] : null,
    paid:L0.c0 - S.cash, ledger:(S.ledger || []).slice(-3).map(l => l.no + ' ' + l.kr), toast:(document.getElementById('toast') || {}).textContent || ''}; }"""


async def collisions(pg):
    await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(300)
    L0 = await pg.evaluate(CLASH_SETUP)
    print('7 setup:', json.dumps(L0, ensure_ascii=False))
    if not L0 or L0.get('err'):
        check(False, '7. the ferry under way for the collision', L0); return
    S = []
    for i in range(400):
        await pg.wait_for_timeout(150)
        s = await pg.evaluate(CLASH_STEER, L0); S.append(s)
        if s.get('gone') or s['n'] > L0['n0']:
            await pg.evaluate('S.helm.thr = 0; S.helm.rud = 0'); break
    print('  steer:', S[:3], '...', S[-3:])
    # (the blow's own toast stands 2.6 s, then the VHF message is back for the rest of its 15 s; timers run late with another test beside)
    try: await pg.wait_for_function("((document.getElementById('toast') || {}).textContent || '').includes('VHF 16')", timeout=8000)
    except Exception: pass
    r = await pg.evaluate(CLASH_READ, L0)
    print(json.dumps(r, ensure_ascii=False))
    await pg.screenshot(path=os.path.join(OUT, 'clash_vhf_land.png'))
    await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(500)
    await pg.screenshot(path=os.path.join(OUT, 'clash_vhf_port.png'))
    await pg.evaluate("BOOK.open('dag')"); await pg.wait_for_timeout(700)
    await pg.screenshot(path=os.path.join(OUT, 'clash_book_port.png'))
    await pg.evaluate("BOOK.close()"); await pg.set_viewport_size({'width': 1280, 'height': 800}); await pg.wait_for_timeout(500)
    await pg.evaluate("BOOK.open('dag')"); await pg.wait_for_timeout(700)
    await pg.screenshot(path=os.path.join(OUT, 'clash_book_land.png'))
    book = await pg.evaluate("(document.getElementById('bkStage') || {}).innerText || ''")
    await pg.evaluate("BOOK.close()")
    rec = r['rec'] or {}
    # (how hard depends on the angle they meet at, which the ferry's own turn under 17 a ii sets: her blow as a quay would give it is
    # under a knot when it is glancing, and then she takes no damage and nobody pays, as the model has it)
    hard = rec.get('kB', 0) >= 1
    check(rec.get('id') == 'ferje' and rec.get('kn', 0) >= 1 and r['dmg'] and r['dmg']['s'] > 0 and ((rec.get('oth', 0) > 0) == hard),
          '7a. by hand into the ferry: the contact in the manoeuvring model\'s steps, damage to your hull, and to hers when her blow is a knot or more', [rec, r['dmg']])
    check(rec.get('law') == '161' and rec.get('fa', 0) >= 0.6 and 'gw:15' in ((rec.get('why') or {}).get('a') or []),
          '7b. the fault from the looks before the blow: you had to give way under rule 15 and steered at her', rec.get('why'))
    check(any('Sammenstøt med «MF Senjasund»' in t or 'Smell i «MF Senjasund»' in t for t in r['logs']) and any('sjøloven § 161' in t for t in r['logs']),
          '7c. the deck log has the collision and the fault', r['logs'])
    check(len(r['vhf']) == 2 and '«Havbris»' in r['vhf'][0] and 'hjemsted Finnsnes' in r['vhf'][0] and 'fra Botnhamn' in r['vhf'][0] and 'Trenger dere hjelp' in r['vhf'][0] and 'VHF 16' in r['toast'],
          '7d. § 164 on the VHF: your name, home port, where you come from, and whether they need help; her answer; on the screen', [r['vhf'], r['toast'][:80]])
    check(r['stand'] == '164' and r['still'] and r['still'][0] == 0 and r['still'][1] == 0 and r['still'][2] < 1, '7e. the ferry stands by where it happened (§ 164), a local stop on the shared clock', [r['stand'], r['still']])
    check((rec.get('owe', 0) > 0 and r['paid'] == rec.get('you') and any('Erstatning til «MF Senjasund»' in x for x in r['ledger'])) if hard else (rec.get('owe') == 0 and r['paid'] == 0 and any('tok ikke skade' in t for t in r['logs'])),
          '7f. you pay your share of her damage, booked as damages (no hull insurance: all of it); with no damage to her, nothing, and the log says she took none', [rec.get('kB'), rec.get('owe'), r['paid'], r['ledger']])
    check('VHF 16' in book and 'Sammenstøt' in book, '7g. the deck log\'s page for the day shows the collision and the VHF message', book[:400])
    # 7h: another player's boat lying still 14 m ahead: she takes no damage, nobody pays, only the message (and the log says so)
    r = await pg.evaluate("""(L0) => { const b = S.boat; b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0; b.tow = null; if (S.rescue) S.rescue = null; b.status = 'idle'; b.v = 0; b.dyn = null;
      b.port = null; b.pos = {x:L0.st.x, y:L0.st.y}; b.heading = L0.hd;   // (whole again after 7a, which may have opened her, and back in the open water it began in)
      const gs = gridScale(b.pos), n0 = SJV.nClash, c0 = S.cash, m0 = S.log.length; SJV.E.clear(); SJV.clash.clear(); SJV.tl = null;
      const t0 = S.t, ahead = 14 / 1000 * gs; PEERS.length = 0; PEERS.push({id:'zz1', x:b.pos.x + Math.sin(b.heading) * ahead, y:b.pos.y - Math.cos(b.heading) * ahead, hd:b.heading + Math.PI / 2, v:0, st:'idle', vtype:'sjark', boat:'Nordlys', user:'Testspiller', at:Date.now()});
      helmTake(); S.helm.thr = 0.35; S.helm.v = 3; S.helm.rud = 0; let hooked = null; const h0 = hooks.onClash; hooks.onClash = (n, r) => { hooked = r; if (h0) h0(n, r); };
      for (let i = 0; i < 120 && SJV.nClash === n0; i++) helmStep(0.2);
      hooks.onClash = h0; PEERS.length = 0; const rec = (S.clashes || []).slice(-1)[0];
      return {n:SJV.nClash - n0, peer:rec && rec.peer, oth:rec && rec.oth, owe:rec && rec.owe, got:rec && rec.got, paid:c0 - S.cash, stood:SJV.E.has('pzz1'), hooked:!!(hooked && hooked.peer), log:S.log.filter(l => l.t >= t0 && l.k === 'nav').map(l => l.no).join(' | ')}; }""", L0)
    print(json.dumps(r, ensure_ascii=False))
    check(r['n'] == 1 and r['peer'] and r['oth'] == 0 and r['owe'] == 0 and r['got'] == 0 and r['paid'] == 0 and not r['stood'] and r['hooked'] and 'tar ikke skade' in r['log'],
          '7h. another player\'s boat: no damage to her, no money either way, not stopped, and the message goes to her (ui/10n-hail.js)', r)
    # 7i: a sea mark (a 1 m buoy) laid in the obstacles' index in open water where the ferry went (Senja's marks stand on skerries: the
    # map has no depth at them), 14 m ahead: the blow on your hull, said in the log
    r = await pg.evaluate("""(async () => { const b = S.boat, idx = obsIndex(), t0 = S.t, s0 = b.dmg ? b.dmg.s : 0; b.dmg = null; b.damage = 0; SJV.fix.clear(); SJV.tl = null;
      const p = {x:b.pos.x + Math.sin(b.heading) * 0.06, y:b.pos.y - Math.cos(b.heading) * 0.06}; await mapNeed(p, 2); if (isLand(p) || depthF(p) < 4) return {err:'no open water ahead', d:depthF(p)};
      const o = {t:0, x:p.x * 1000, z:p.y * 1000, r:1, why:'mark', id:'testmerke'}, C = HIND.C;
      for (let j = Math.floor((o.z - 40) / C); j <= Math.floor((o.z + 40) / C); j++) for (let i = Math.floor((o.x - 40) / C); i <= Math.floor((o.x + 40) / C); i++){ const k = i * 1048576 + j; if (!idx.has(k)) idx.set(k, []); idx.get(k).push(o); }
      b.pos = {x:p.x - Math.sin(b.heading) * 0.015, y:p.y + Math.cos(b.heading) * 0.015}; b.dyn = null; helmTake(); S.helm.thr = 0.18; S.helm.v = 3.5; S.helm.rud = 0;
      for (let i = 0; i < 120 && !S.log.some(l => l.t >= t0 && /sjømerket/.test(l.no)); i++) helmStep(0.2);
      return {log:S.log.filter(l => l.t >= t0 && /sjømerket/.test(l.no)).map(l => l.no), ds:+(b.dmg ? b.dmg.s : 0).toFixed(2)}; })()""")
    print(json.dumps(r, ensure_ascii=False))
    check(not r.get('err') and r['log'] and r['ds'] > 0, '7i. by hand into a sea mark: a knock on the hull, in the log', r)
    S_ = await pg.evaluate("(() => { helmOff(); S.settings.manual = false; S.boat.status = 'idle'; return 1; })()")


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut' + ('#no3d' if os.environ.get('KYST_LITE') else ''))
        # 1. blows by speed, on a sjark (fibreglass) and on steel and wood
        r = await pg.evaluate("""(() => { const b = S.boat, R = {}; S.free = {tow:1, rep:1}; b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0;
          const snap = () => ({s:+(b.dmg ? b.dmg.s : 0).toFixed(3), h:+(b.dmg ? b.dmg.h : 0).toFixed(3), A:+(b.dmg ? b.dmg.A : 0).toFixed(1), dmg:b.damage});
          R.r05 = hullHit(0.5, 100, 'kai'); R.s05 = snap();
          hullHit(2, 1e4, 'kai'); R.s2 = snap();
          b.dmg = null; b.damage = 0; hullHit(4, 5e4, 'kai'); R.s4 = snap();
          b.dmg = null; b.damage = 0; hullHit(6, 1e5, 'kai'); R.s6 = snap(); R.q6 = [Math.round(hullLeak()), Math.round(hullPump())];
          b.dmg = null; b.damage = 0; hullHit(8, 2e5, 'kai'); R.s8 = snap(); R.q8 = [Math.round(hullLeak()), Math.round(hullPump())]; R.cost8 = hullCost();
          const mat = t => { b.type = t; applyVessel(); b.dmg = null; hullHit(5, 1e5, 'kai'); return +b.dmg.h.toFixed(3); };
          R.mat = {tre:mat('trebat'), glass:mat('snekke'), steel:mat('kyst21')};
          b.type = 'sjark'; applyVessel(); b.dmg = null; b.damage = 0; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['r05'] is None and r['s05']['s'] == 0, '1a. under a knot the fenders take it: nothing', r['s05'])
        check(r['s2']['s'] > 0 and r['s2']['h'] == 0 and r['s2']['dmg'] == 0, '1b. at 2 knots scratches in the paint, no damage', r['s2'])
        check(r['s4']['h'] > 0 and r['s4']['A'] == 0 and r['s4']['dmg'] == 1, '1c. at 4 knots the hull is damaged, no leak', r['s4'])
        check(r['s6']['A'] > 0 and r['q6'][0] < r['q6'][1], '1d. at 6 knots a leak the bilge pump keeps up with (litres a minute in, out)', [r['s6'], r['q6']])
        check(r['s8']['A'] > r['s6']['A'] and r['q8'][0] > r['q8'][1], '1e. at 8 knots more water comes in than the pump takes', [r['s8'], r['q8'], r['cost8']])
        check(r['mat']['tre'] > r['mat']['glass'] > r['mat']['steel'] > 0, '1f. the same blow does most to wood and least to steel', r['mat'])
        # 2. the leak at sea: the water rises, the engine room fills, the crew calls the rescue boat; towed to the yard and mended there
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {w:[]}; S.free = {}; S.member = false; b.type = 'sjark'; applyVessel(); S.plan = null; S.jobs = [];
          const yd = PORTS.find(q => q.sted === 'verft' && dist(q.p, P(69.5, 17.5)) < 60); const q0 = {x:yd.p.x, y:yd.p.y - 2.5}; let sea = q0;
          for (let k = 0; k < 36 && (isLand(sea) || depthF(sea) < 20); k++){ const a = k / 36 * 2 * Math.PI; sea = {x:yd.p.x + Math.sin(a) * 3, y:yd.p.y - Math.cos(a) * 3}; }
          await mapNeed(sea, 9); b.status = 'idle'; b.port = null; b.pos = {...sea}; b.dmg = null; b.damage = 0; b.tow = null; const m0 = S.log.length;
          hullHit(9, 3e5, 'kai'); R.lim = hullFlood(); R.Q = Math.round(hullLeak()); R.P = Math.round(hullPump());
          let flooded = null, pumped = null, i = 0;
          for (; i < 6000; i++){ step(); if (i % 15 === 0) await new Promise(r => setTimeout(r, 0)); const d = b.dmg || {};
            if (i < 40 || i % 30 === 0) R.w.push([i, Math.round(d.w || 0), b.status, b.tow ? b.tow.ph : null]);
            if (d.flood && flooded == null) flooded = i;
            if (b.tow && (b.tow.ph === 'tow') && pumped == null) pumped = {i, w:Math.round(d.w)};
            if (pumped && pumped.w2 == null && b.tow && i > pumped.i + 20) pumped.w2 = Math.round(d.w);
            if (b.status === 'port') break; }
          R.flooded = flooded; R.pumped = pumped; R.i = i; R.st = b.status; R.port = b.port; R.yard = !!(portById(b.port) && portServices(portById(b.port)).verft);
          R.logs = S.log.slice(m0).map(l => l.no).filter(t => /Vann i båten|Motorrommet|Lensepumpa|lekker/.test(t)).map(t => t.slice(0, 70));
          R.jobs = (S.jobs || []).map(j => [j.kind, j.paid, !!j.dmg]); R.free = !!(S.free && S.free.rep);
          for (let k = 0; k < YARD_H * 60 + 5; k++){ step(); if (k % 30 === 0) await new Promise(r => setTimeout(r, 0)); }
          R.after = {dmg:b.dmg, damage:b.damage, jobs:(S.jobs || []).length}; return R; })()""")
        print(json.dumps({k: v for k, v in r.items() if k != 'w'}, ensure_ascii=False)); print('  water:', r['w'][:12], '...', r['w'][-4:])
        check(r['Q'] > r['P'] and r['flooded'] is not None and any('Vann i båten' in t for t in r['logs']) and any('Motorrommet' in t for t in r['logs']),
              '2a. a 9-knot blow: more in than the pump takes, the log says «Vann i båten», the engine room fills and the crew calls the rescue boat', {'Q': r['Q'], 'P': r['P'], 'flooded at min': r['flooded'], 'logs': r['logs']})
        check(r['pumped'] is not None and r['pumped'].get('w2') is not None and r['pumped']['w2'] < r['pumped']['w'],
              '2b. made fast, the rescue boat\'s pumps take the water down', r['pumped'])
        check(r['st'] == 'port' and r['yard'] and any(j[0] == 'repair' and j[1] == 0 for j in r['jobs']) and r['free'],
              '2c. towed to the yard and mended there, the first repair free', {k: r[k] for k in ('st', 'port', 'yard', 'jobs', 'free')})
        check(r['after']['dmg'] is None and r['after']['damage'] == 0 and r['after']['jobs'] == 0, '2d. the repair done: the hull is whole and the water gone', r['after'])
        # 3. running aground on rock and on sand, along the coast
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {}; b.type = 'sjark'; applyVessel();
          const spots = []; for (const c of [P(69.35, 17.3), P(69.6, 18.0), P(68.2, 14.5), P(60.4, 5.2), P(70.66, 23.7)]){ await mapNeed(c, 9);
            for (let k = 0; k < 400; k++){ const q = {x:c.x + (Math.sin(k * 2.39) * k) * 0.012, y:c.y + (Math.cos(k * 2.39) * k) * 0.012}; let cd = 1; try { cd = coastDist(q); } catch (e){ continue; } if (isLand(q) || cd > 0.05) continue; spots.push({q, rock:bedRock(q)}); } }
          const rock = spots.find(s => s.rock), sand = spots.find(s => !s.rock); R.n = [spots.filter(s => s.rock).length, spots.filter(s => !s.rock).length];
          const go = s => { if (!s) return null; b.dmg = null; b.damage = 0; b.status = 'sailing'; b.v = 6; S.plan = null; const m0 = S.log.length; runAground(s.q); const d = b.dmg || {};
            const o = {s:+(d.s || 0).toFixed(2), h:+(d.h || 0).toFixed(2), A:+(d.A || 0).toFixed(1), dmg:b.damage, log:(S.log.slice(m0).find(l => /Gikk på grunn/.test(l.no)) || {}).no}; b.status = 'idle'; b.dmg = null; b.damage = 0; return o; };
          R.rock = go(rock); R.sand = go(sand); return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['rock'] and r['rock']['h'] > 0.3 and r['rock']['A'] > 0 and 'på fjell' in (r['rock']['log'] or '') and 'lekker' in (r['rock']['log'] or ''),
              '3a. aground on rock at 6 knots: the hull damaged and opened, and the log says «på fjell»', r['rock'])
        check(r['sand'] and r['sand']['s'] > 0 and r['sand']['A'] == 0 and r['sand']['h'] < 0.2 and 'sandbunn' in (r['sand']['log'] or ''),
              '3b. aground on sand at 6 knots: scratches and a little damage to the rudder and propeller, no leak, «på sandbunn»', r['sand'])
        # 4. speed and weight
        r = await pg.evaluate("""(() => { const b = S.boat; b.type = 'sjark'; applyVessel(); b.dmg = null; const v0 = speedCap(0.5), t0 = boatTons();
          b.dmg = {s:0.2, h:0.5, A:0, w:2000}; const v1 = speedCap(0.5), t1 = boatTons(); b.dmg = null; return {v0:+v0.toFixed(2), v1:+v1.toFixed(2), t0:+t0.toFixed(2), t1:+t1.toFixed(2)}; })()""")
        check(r['v1'] < r['v0'] * 0.95 and abs(r['t1'] - r['t0'] - 2.05) < 0.05, '4. a damaged hull is slower, and 2000 litres aboard weigh 2 tonnes', r)
        # 5. the hull insurance at the yard
        r = await pg.evaluate("""(async () => { const b = S.boat, R = {}; b.type = 'sjark'; applyVessel(); S.free = {tow:1, rep:1}; S.jobs = []; b.kasko = null;
          const yd = PORTS.find(q => q.sted === 'verft'); await mapNeed(yd.p, 3); dock(yd.id); S.cash = 1e6; b.dmg = null; b.damage = 0;
          R.prem = kaskoPrem(); R.self = kaskoSelf(); const c0 = S.cash; kaskoSign(); R.signPaid = c0 - S.cash; R.signed = !!b.kasko;
          hullHit(6, 1e5, 'kai'); const B = hullBill(); R.bill = {tot:B.tot, ins:B.ins, you:B.you};
          const c1 = S.cash; R.why = hullOrder(false); R.paid = c1 - S.cash; R.claims = kaskoClaims(); R.prem2 = kaskoPrem();
          for (let k = 0; k < YARD_H * 60 + 5; k++){ step(); if (k % 30 === 0) await new Promise(r => setTimeout(r, 0)); }
          R.after = {dmg:b.dmg, damage:b.damage};
          S.t = b.kasko.next; const c2 = S.cash; kaskoHour(); R.month = c2 - S.cash;
          kaskoEnd(); R.ended = !b.kasko; return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        check(r['signed'] and r['signPaid'] == r['prem'] and r['self'] >= 5000, '5a. signing at the yard pays the first month\'s premium; the deductible is at least 5 000 kr', r)
        check(r['bill']['ins'] == r['bill']['tot'] - r['self'] and r['paid'] == r['self'] and r['why'] is None, '5b. the insurance pays the repair over the deductible, and you pay the deductible', r['bill'])
        check(r['claims'] == 1 and abs(r['prem2'] - r['prem'] * 1.25) <= 10 and r['month'] == r['prem2'], '5c. after the claim the premium is a quarter up, and that is what the month takes', [r['prem'], r['prem2'], r['month']])
        check(r['after']['dmg'] is None and r['after']['damage'] == 0 and r['ended'], '5d. the job done takes the damage off; the insurance can be cancelled', r['after'])
        # 6. the yard's card on the phone, in portrait and landscape, and a second blow while a repair is queued
        r = await pg.evaluate("""(() => { const b = S.boat; S.jobs = []; b.dmg = null; b.damage = 0; S.cash = 1e6; hullHit(6, 1e5, 'kai');
          PHONE.open('verksted'); const hc = document.getElementById('hullCard'), kc = document.getElementById('kaskoCard'), btn = document.querySelector('[data-pa=hullfix]');
          const R = {hull:hc ? hc.innerText.replace(/\\n/g, ' | ').slice(0, 300) : null, kasko:kc ? kc.innerText.replace(/\\n/g, ' | ').slice(0, 400) : null, btn:!!btn && !btn.disabled};
          return R; })()""")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=os.path.join(OUT, 'hull_yard_land.png'))
        await pg.set_viewport_size({'width': 800, 'height': 1280}); await pg.wait_for_timeout(600)
        await pg.evaluate("(() => { const c = document.getElementById('hullCard'); if (c) c.scrollIntoView(); })()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=os.path.join(OUT, 'hull_yard_port.png'))
        r2 = await pg.evaluate("""(() => { const b = S.boat, btn = document.querySelector('[data-pa=hullfix]'); if (btn) btn.click(); const n1 = (S.jobs || []).filter(j => j.kind === 'repair').length;
          hullHit(4, 5e4, 'kai'); const L = hullLeft(); hullOrder(false); const n2 = (S.jobs || []).filter(j => j.kind === 'repair').length; PHONE.show(false); return {n1, n2, left:L && +L.h.toFixed(3)}; })()""")
        print(json.dumps([r, r2], ensure_ascii=False))
        check(r['hull'] and 'Skrammer' in r['hull'] and 'Reparer' in r['hull'] and r['kasko'] and 'Tegn kasko' in r['kasko'] and r['btn'], '6a. the yard\'s card shows the damage, the repair and its price, and the insurance to sign', r)
        check(r2['n1'] == 1 and r2['n2'] == 2 and r2['left'] and r2['left'] > 0, '6b. «Reparer» queues the repair; a second blow while it is queued is ordered on its own, the rest only', r2)
        await collisions(pg)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
