from _env import GAME, boot
# No limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger, rekka eller
# andre ting»). For every boat with a deck map: each break the game can choose (core/13-work.js idleAssign) forced on three hands in turn,
# then the work (jigging, gutting and icing, hauling the line), and for the places the crew are given (deckcrew.js) every limb of the pose
# tested against the model (vessel3d.js deckMap M.hit). Also how many of the rail places each break fits at (clipScan): a break that fits
# nowhere falls back to standing and looking out. Prints OK or FEIL per check.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
BREAKS = ['lean', 'back', 'look', 'coffee', 'sit', 'chat', 'sweep', 'hose', 'knife', 'lunch', 'phone', 'binoc', 'aurora', 'seasick', 'gear', 'smoke', 'snus']
JS = """((breaks) => { const R = {}, b = S.boat, t0 = b.type, g = GROUNDS[2].p; S.tut = 0; S.settings.autoOn = false; S.me = S.cur;
  const orig = idleAssign; let FORCE = null;
  window.idleAssign = (P, ctx) => { orig(P, ctx); if (!FORCE) return; let i = 0; for (const p of P){ if (p.st !== 'pause' || !p.c) continue; p.idle = FORCE[i % FORCE.length]; p.with = null; i++; }
    const ch = P.filter(p => p.idle === 'chat' && p.c); for (let i = 0; i + 1 < ch.length; i += 2){ ch[i].with = ch[i + 1].c.id; ch[i + 1].with = ch[i].c.id; } };
  const settle = () => { CREW3D._st.ctxT = -1e9; CREW3D._st.lastSim = null; CREW3D.tick(0.05); CREW3D._st.ctxT = -1e9; CREW3D.tick(0.05); };
  const bad = () => (CREW3D.clipNow() || []).filter(x => x.n > 0).map(x => x.task + ':' + x.n + (x.segs ? '[' + x.segs.join('.') + ']' + JSON.stringify(x.rail) : ''));
  for (const vt of Object.keys(VESSELS)){ b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()){ R[vt] = null; continue; }
    S.crew = [0, 1, 2].map(i => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, age:[30, 66, 45][i]}));
    const r = R[vt] = {idle:[], work:{}, given:{}};
    // the jigging places on her rails, as the view gives them every frame (cinema: CREW3D.setJig(jigRail)); without them the hands jigged
    // at the crew spots, and the snekke's place 2 with the hard top's post through it was never tried (OB6 09.11.2026, F15)
    CREW3D.setJig(G3._debug.jigRail(vt)); r.jigs = (G3._debug.jigRail(vt) || []).length;
    // the breaks, lying still at sea, three at a time
    b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; S.plan = null; S.hold = []; b.deckStop = false;
    for (let i = 0; i < breaks.length; i += 3){ FORCE = breaks.slice(i, i + 3); S.t += 13; settle(); r.idle.push(...bad()); for (const a of CREW3D.agents()) if (a.goal && a.c) r.given[a.goal.task] = (r.given[a.goal.task] || 0) + 1; }
    FORCE = null;
    // the work: jigging, the tub stopped to gut, the line coming in
    // (every jigging place taken: as many machines as she may carry and everyone aboard at them)
    S.equip.jukse = Math.max(1, VESSELS[vt].jukseMax || 3); b.status = 'fishing'; b.fishUntil = S.t + 600; S.t += 1; settle(); r.work.jig = bad();
    r.jigAt = CREW3D.agents().filter(a => a.goal && a.goal.task === 'jig').length;
    addCatch('torsk', tubCap(), null, true); b.deckStop = true; S.t += 1; settle(); r.work.deck = bad();
    // (F19, OB8 10.11.2026: two at the same table or tub stand side by side, not inside each other: the hands at the deck work once they
    // have walked to their places, the two nearest each other's middles)
    for (let i = 0; i < 200; i++) CREW3D.tick(0.1);
    // (pairs at the same task only: two gutting, two packing, two bleeding; null when no two share one, printed as such)
    { const A = CREW3D.agents().filter(a => a.mode === 'at' && a.goal && ['gut', 'pack', 'bleedst'].includes(a.goal.task)); let m = 9, n = 0;
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) if (A[i].goal.task === A[j].goal.task){ n++; m = Math.min(m, Math.hypot(A[i].x - A[j].x, A[i].z - A[j].z)); }
      r.pair = n ? +m.toFixed(2) : null; }
    S.hold = []; b.deckStop = false; S.equip.linehaler = true; b.gop = {op:'haul', kind:'line', n:10, done:0, prog:0, a:{...g}, b:{x:g.x + 0.2, y:g.y}}; addCatch('torsk', 20, null, true); S.t += 1; settle(); r.work.haul = bad(); b.gop = null;
    // (OB3 11.11.2026, F15 and F4: every place in every pose. The nets coming in (the hauler and the one picking), the line and the nets
    // going out (the one paying the gear out at the stern and the one handing it to him), the pots where she takes them; and that the
    // one setting has a place of his own in the setting pose, not the hauler's)
    const V = VESSELS[vt], gop = (op, kind) => { b.gop = {op, kind, n:10, done:2, prog:0, hooksPer:300, a:{...g}, b:{x:g.x + 0.2, y:g.y}}; S.t += 1; CREW3D.reset(); CREW3D.on(); CREW3D.setJig(G3._debug.jigRail(vt)); settle(); };
    r.sett = {};
    if ((V.rigs || []).includes('garn')){ S.equip.garnhaler = true; gop('haul', 'garn'); r.work.haulG = bad(); }
    for (const kind of ['line', 'garn']) if ((V.rigs || []).includes(kind) && !V.autoHooks){ gop('set', kind); r.work['set_' + kind] = bad();
      r.sett[kind] = CREW3D.agents().filter(a => a.role === 'sett' && a.goal && a.goal.task === 'sett').length + '/' + CREW3D.agents().filter(a => a.st === 'haling' && a.goal && a.goal.task === 'haul').length; }
    if ((V.rigs || []).includes('teiner') && !V.pot){ S.equip.teinehaler = true; gop('haul', 'teine'); r.work.pots = bad();
      // (the two sorting the crab, each a place of their own: they stood 0.40 m apart in a clump by the hauler)
      { const T = CREW3D.agents().filter(a => a.goal && a.goal.task === 'tend' && !a.goal.inside).map(a => CREW3D._st.M.at(a.goal.k)); let m = 9; for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) m = Math.min(m, Math.hypot(T[i][0] - T[j][0], T[i][2] - T[j][2])); if (T.length > 1) r.pairPots = +m.toFixed(2); }
      gop('set', 'teine'); r.work.potsSet = bad(); }
    // (OB4 11.11.2026, F10, F11, F23: the boat's own hands at the quay. While the plant's crane lands her tubs, one hooks the sling on
    // beside the tub that goes next and one gives the signs at the rail to the quay; the ice from the silo is taken aboard by one at the
    // ice box; her own crane is driven by one beside it while the other hooks on. Every pose of it against the model, on the coast boats:
    // an ocean vessel's pallets have their own gang at the hatch)
    if ((V.hold || {}).kind === 'rom' || V.kar){ const q = portById('husoy'), own = !!V.kar, K0 = geoOf(vt).kit || {}, M = () => CREW3D._st.M, at = a => M().at(a.goal.k);
      b.gop = null; b.status = 'port'; b.port = 'husoy'; b.berth = 'main'; b.pos = {...q.p}; b.moorT = S.t - 90; S.hold = []; S.jobs = []; S.cargo = [];
      b.land = {pid:'husoy', t0:S.t, until:S.t + 20, kind:'tub', n:2, lifts:own ? 4 : 2, kg:800, own, wash:own ? LANDING.wash : 0}; b.iceUntil = S.t + 30; S.t += 0.4;
      CREW3D.reset(); CREW3D.on(); settle(); r.work.loss = bad();
      const A = CREW3D.agents(), hk = A.find(a => a.role === 'hekt' && a.goal && a.goal.dyn), lk = A.find(a => a.role === 'luke' && a.goal && a.goal.dyn), ic = A.find(a => a.role === 'isrom' && a.goal && a.goal.ice);
      const Ls = CREW3D.landSlots ? CREW3D.landSlots() : [], T = own ? (K0.tubs || [])[0] : Ls[0], sd = CREW3D.quaySide ? CREW3D.quaySide() : 1;
      r.loss = {slots:own ? 1 : Ls.length, hekt:hk && T ? +Math.hypot(at(hk)[0] - T[0], at(hk)[2] - T[2]).toFixed(2) : null, luke:lk ? +(at(lk)[0] * sd).toFixed(2) : null, is:!!ic, pose:hk ? [0.36, 0.5].map(u => { S.t = b.land.t0 + LANDING.prep + u * LANDING.lift; CREW3D.tick(0.05); return hk.task; }).join('+') : null};
      if (V.crane > 0 && K0.crane){ b.land = null; b.iceUntil = 0; S.cargo = [{tur:'t1', kg:500, no:'proviant', en:'provisions'}]; S.jobs = [{kind:'last', crew:true, h:2, until:S.t + 120, no:'Lasting av proviant', en:'Loading the provisions'}]; S.t += 1; settle(); r.work.kran = bad();
        const A2 = CREW3D.agents(), kr = A2.find(a => a.role === 'kran' && a.goal && a.goal.task === 'remote'); r.loss.kran = kr ? +Math.hypot(at(kr)[0] - K0.crane.at[0], at(kr)[2] - K0.crane.at[2]).toFixed(2) : null;
        r.loss.kranHekt = A2.filter(a => a.role === 'hekt' && a.goal && a.goal.dyn === 'kai').length; S.jobs = []; S.cargo = []; }
      b.land = null; b.iceUntil = 0; b.status = 'idle'; b.port = null; b.pos = {...g}; }
    b.gop = null; CREW3D.reset(); CREW3D.on(); CREW3D.setJig(G3._debug.jigRail(vt));
    // walking between them: the breaks changing every three seconds for a minute, the bodies tested every tenth of a second
    b.status = 'idle'; b.gop = null; S.hold = []; b.deckStop = false; r.walk = 0; r.walked = 0; CREW3D._st.ctxT = -1e9; CREW3D._st.lastSim = null; CREW3D.tick(0.05);
    for (let i = 0; i < 600; i++){ if (i % 30 === 0){ FORCE = [breaks[(i / 30) % breaks.length], breaks[(i / 30 + 5) % breaks.length], breaks[(i / 30 + 11) % breaks.length]]; S.t += 13; CREW3D._st.lastSim = S.t; }
      CREW3D.tick(0.1); const h = (CREW3D.bodyHits() || []).concat((CREW3D.clipNow() || []).filter(x => x.n > 0 && CREW3D.agents().some(a => a.id === x.id && a.mode === 'at'))); r.walk += h.length; r.walked += CREW3D.agents().filter(a => a.mode === 'walk').length; if (h.length) (r.walkAt = r.walkAt || []).push(...h.map(x => x.which + ':' + x.near + ':' + x.mode)); }
    FORCE = null;
    r.scan = CREW3D.clipScan(); }
  window.idleAssign = orig; b.type = t0; applyVessel(); CREW3D.reset(); return R; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await br.new_context(viewport={'width': 1000, 'height': 760})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        R = await pg.evaluate(JS, BREAKS)
        idleBad, workBad, boats = {}, {}, []
        for vt, r in R.items():
            if not r: continue
            boats.append(vt)
            print('%-11s idle %s  work %s  jig %d/%d  fits %s' % (vt, r['idle'] or '-', {k: v for k, v in r['work'].items() if v} or '-', r['jigAt'], r['jigs'], ' '.join('%s %d/%d' % (k, v[0], v[1]) for k, v in r['scan'].items())))
            if r['idle']: idleBad[vt] = r['idle']
            if any(r['work'].values()): workBad[vt] = r['work']
        print(ok(len(boats) >= 10), 'every boat with a deck has its crew on it', len(boats))
        print(ok(not idleBad), 'no break, on any boat, puts a limb through a wall, the rail or anything else', idleBad)
        print(ok(not workBad), 'nor does the work at its places (jigging, gutting, icing, hauling, setting, and landing, ice and the crane at the quay)', workBad)
        sett = {vt: r['sett'] for vt, r in R.items() if r and any(v != '1/0' for v in r.get('sett', {}).values())}
        print(ok(not sett and sum(len(r.get('sett', {})) for r in R.values() if r) >= 16), 'setting line and nets, one stands where the gear goes over in the setting pose and nobody in the hauling pose (F4; set/haul per kind)', sett)
        # (OB4 11.11.2026, F10, F11, F23; seen red on the build from before: no one had a place at the tubs, the rail or the ice box)
        LO = {vt: r['loss'] for vt, r in R.items() if r and r.get('loss')}
        lossBad = {vt: l for vt, l in LO.items() if not l['slots'] or l['hekt'] is None or not 0.55 <= l['hekt'] <= 1.45 or l['luke'] is None or l['luke'] <= 0 or not l['is'] or l['pose'] != 'unhook+guide'}
        print(ok(not lossBad and len(LO) >= 8), 'landing at the plant, one hooks the sling on beside the tub (0.55-1.45 m from its middle, hooking on with the hook down), one gives the signs at the rail to the quay, and one takes the ice at the ice box (F10, F11; %d boats)' % len(LO), lossBad)
        kranBad = {vt: l for vt, l in LO.items() if 'kran' in l and (l['kran'] is None or not 0.8 <= l['kran'] <= 2.4 or l['kranHekt'] != 1)}
        print(ok(not kranBad and sum(1 for l in LO.values() if 'kran' in l) >= 4), 'her own crane on the freight: one drives it from beside its foot, one hooks on at the freight (F23)', kranBad)
        # (F19: the boats revised on board so far, OB5-OB11; the others are their phases' to put right, printed so they are seen)
        near = {vt: r['pair'] for vt, r in R.items() if r and r.get('pair') is not None and r['pair'] < 0.55}
        near.update({vt + ':teiner': r['pairPots'] for vt, r in R.items() if r and r.get('pairPots') is not None and r['pairPots'] < 0.55})
        unm = [vt for vt in ('snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark') if R.get(vt) and R[vt].get('pair') is None]
        # (OB3 11.11.2026: every boat now, deckcrew.js deckAt: the third at a table took the second's side and stood 0.40 m from him on the
        # 15 m and the 21 m boats, the snow crab vessel and the trawler; seen red on the build from before)
        print(ok(not near), 'two at the same table or tub stand side by side, 0.55 m or more between their middles (F19; every boat; no pair to measure: %s)' % (unm or '-'), near)
        walk = {vt: [r['walk'], r['walked'], r.get('walkAt')] for vt, r in R.items() if r and r['walk']}
        print(ok(not walk and all(r['walked'] > 50 for r in R.values() if r)), 'nor a body on the way between them (shoulders, chest and back, every tenth of a second)', walk)
        given = {}
        for r in R.values():
            if r:
                for k, n in r['given'].items(): given[k] = given.get(k, 0) + n
        shown = [k for k in BREAKS if given.get(k)]
        print(ok(len(shown) >= len(BREAKS) - 2), 'nearly every break finds a place clear of everything somewhere (the rest stand and look out)', len(shown), [k for k in BREAKS if not given.get(k)])
        print('errors:', errs[:3])
        await br.close()

asyncio.run(main())
