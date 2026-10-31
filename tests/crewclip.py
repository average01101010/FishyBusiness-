from _env import GAME, boot
# No limb through a wall, the rail or anything else (Jonas 23.10.2026: «Sørg også for at mannskapet aldri "clipper" gjennom vegger, rekka eller
# andre ting»). For every boat with a deck map: each break the game can choose (core/13-work.js idleAssign) forced on three hands in turn,
# then the work (jigging, gutting and icing, hauling the line), and for the places the crew are given (deckcrew.js) every limb of the pose
# tested against the model (vessel3d.js deckMap M.hit). Also how many of the rail places each break fits at (clipScan): a break that fits
# nowhere falls back to standing and looking out. Prints OK or FEIL per check.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
BREAKS = ['lean', 'back', 'look', 'coffee', 'sit', 'chat', 'sweep', 'hose', 'coil', 'knife', 'lunch', 'phone', 'binoc', 'aurora', 'seasick', 'gear', 'smoke', 'snus']
JS = """((breaks) => { const R = {}, b = S.boat, t0 = b.type, g = GROUNDS[2].p; S.tut = 0; S.settings.autoOn = false; S.me = S.cur;
  const orig = idleAssign; let FORCE = null;
  window.idleAssign = (P, ctx) => { orig(P, ctx); if (!FORCE) return; let i = 0; for (const p of P){ if (p.st !== 'pause' || !p.c) continue; p.idle = FORCE[i % FORCE.length]; p.with = null; i++; }
    const ch = P.filter(p => p.idle === 'chat' && p.c); for (let i = 0; i + 1 < ch.length; i += 2){ ch[i].with = ch[i + 1].c.id; ch[i + 1].with = ch[i].c.id; } };
  const settle = () => { CREW3D._st.ctxT = -1e9; CREW3D._st.lastSim = null; CREW3D.tick(0.05); CREW3D._st.ctxT = -1e9; CREW3D.tick(0.05); };
  const bad = () => (CREW3D.clipNow() || []).filter(x => x.n > 0).map(x => x.task + ':' + x.n + (x.segs ? '[' + x.segs.join('.') + ']' + JSON.stringify(x.rail) : ''));
  for (const vt of Object.keys(VESSELS)){ b.type = vt; applyVessel(); CREW3D.reset(); if (!CREW3D.on()){ R[vt] = null; continue; }
    S.crew = [0, 1, 2].map(i => Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, age:[30, 66, 45][i]}));
    const r = R[vt] = {idle:[], work:{}, given:{}};
    // the breaks, lying still at sea, three at a time
    b.status = 'idle'; b.port = null; b.pos = {...g}; b.gop = null; S.plan = null; S.hold = []; b.deckStop = false;
    for (let i = 0; i < breaks.length; i += 3){ FORCE = breaks.slice(i, i + 3); S.t += 13; settle(); r.idle.push(...bad()); for (const a of CREW3D.agents()) if (a.goal && a.c) r.given[a.goal.task] = (r.given[a.goal.task] || 0) + 1; }
    FORCE = null;
    // the work: jigging, the tub stopped to gut, the line coming in
    b.status = 'fishing'; b.fishUntil = S.t + 600; S.t += 1; settle(); r.work.jig = bad();
    addCatch('torsk', tubCap(), null, true); b.deckStop = true; S.t += 1; settle(); r.work.deck = bad();
    S.hold = []; b.deckStop = false; S.equip.linehaler = true; b.gop = {op:'haul', kind:'line', n:10, done:0, prog:0, a:{...g}, b:{x:g.x + 0.2, y:g.y}}; addCatch('torsk', 20, null, true); S.t += 1; settle(); r.work.haul = bad(); b.gop = null;
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
            print('%-11s idle %s  work %s  fits %s' % (vt, r['idle'] or '-', {k: v for k, v in r['work'].items() if v} or '-', ' '.join('%s %d/%d' % (k, v[0], v[1]) for k, v in r['scan'].items())))
            if r['idle']: idleBad[vt] = r['idle']
            if any(r['work'].values()): workBad[vt] = r['work']
        print(ok(len(boats) >= 10), 'every boat with a deck has its crew on it', len(boats))
        print(ok(not idleBad), 'no break, on any boat, puts a limb through a wall, the rail or anything else', idleBad)
        print(ok(not workBad), 'nor does the work at its places (jigging, gutting, icing, hauling)', workBad)
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
