from _env import GAME, boot
# Stability (03c-stability.js): hydrostatics per vessel type, deck load and catch, the motions in a sea (resonance, course and speed),
# what they do to the work (hsWork), and the warnings in the log, the HUD and the Vær panel.
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{
          const R = {}, none = {hold:0, deck:0, gear:0}, r2 = v => Math.round(v * 100) / 100, dg = v => Math.round(v * 1800 / Math.PI) / 10;
          R.types = {}; for (const id of Object.keys(VESSELS)){ const s = stabOf(id, none); R.types[id] = {GM:r2(s.GM), Tr:r2(s.Tr), Tz:r2(s.Tz), edge:dg(s.deckEdge)}; }
          // a sjark at sea on the Husøy ground, a gale from the west
          S.t = Math.round((Date.UTC(2027, 10, 12, 11) - EPOCH) / 6e4); const H = S.t / 60, g = GROUNDS[0].p, b = S.boat;
          b.type = 'sjark'; applyVessel(); b.status = 'idle'; b.port = null; b.pos = {...g}; S.plan = null; S.hold = []; WX_FORCE = {w:14, d:270};
          S.pgear = S.pgear || newPGear(); S.pgear.pots = {big:0};
          R.empty = r2(stabOf('sjark').GM);
          S.pgear.pots.big = 300; R.pots300 = r2(stabOf('sjark').GM); R.pots300state = motionHere(H).state;
          b.stab = 0; b.stabAt = 0; stabTick(H); R.warned = S.log[S.log.length - 1].no;
          R.hud = (renderHud(), document.getElementById('hud').textContent); R.panel = panelWx();
          S.pgear.pots.big = 90; R.atMax = r2(stabOf('sjark').GM); S.pgear.pots.big = 0; b.stab = 0;
          // catch low in the hold makes her stiffer, not tender
          R.withCatch = r2(stabOf('sjark', {hold:2000, deck:0, gear:0}).GM);
          // resonance: in a light wind the swell from the west (10-12 s) meets a pelagic trawler (roll period about 9 s) at different periods
          // with course and speed; the roll is largest where the encounter period meets her roll period
          WX_FORCE = {w:3, d:270}; const St = stabOf('pelagisk', none); let best = {roll:0};
          for (let hd = 0; hd < 360; hd += 15) for (const kn of [0, 4, 8, 14]){ const M = motionAt(g, H, hd * Math.PI / 180, kn, St); if (M.roll > best.roll){ best = M; best.hd = hd; best.kn = kn; } }
          const into = motionAt(g, H, swellOpen(H).dir * Math.PI / 180, 14, St); WX_FORCE = {w:14, d:270};
          R.res = {maxRoll:dg(best.roll), ratio:r2(best.res), hd:best.hd, kn:best.kn, intoRoll:dg(into.roll), intoAv:r2(into.av)};
          // the work: drifting beam-on with nothing aboard is the reference; a skiff driving into a head sea feels much more
          b.type = 'skiff'; applyVessel(); b.status = 'idle'; b.v = 0; R.fDrift = r2(motionHere(H).f);
          b.status = 'sailing'; b.v = 18; b.heading = 270 * Math.PI / 180; R.fHead = r2(motionHere(H).f); b.heading = 90 * Math.PI / 180; R.fFollow = r2(motionHere(H).f);
          R.hsWork = r2(hsWork(b.pos, H)); R.hs = r2(hsAt(b.pos, H));
          b.status = 'idle'; b.v = 0; WX_FORCE = null;
          return R; })()""")
        for k, v in r['types'].items(): print('  ', k.ljust(12), v)
        print(json.dumps({k: v for k, v in r.items() if k not in ('types', 'panel', 'hud')}, ensure_ascii=False))
        T = r['types']
        print(ok(all(T[k]['GM'] >= 0.35 for k in T)), 'every vessel type has at least IMO\'s 0.35 m of GM with nothing on deck')
        print(ok(T['skiff']['Tr'] < T['sjark']['Tr'] < T['kyst21']['Tr'] < T['pelagisk']['Tr'] and 1 < T['skiff']['Tr'] < 3 and 3.5 < T['sjark']['Tr'] < 5.5 and 5 < T['kyst21']['Tr'] < 8 and 7 < T['pelagisk']['Tr'] < 12), 'the roll periods grow with size: a skiff snaps, a sjark rolls in 4-5 s, a pelagic trawler in about 9 s')
        print(ok(r['pots300'] < 0.35 and r['pots300state']['lvl'] >= 1 and r['pots300state']['why'] == 'gm' and 'rank' in r['warned']), '500 pots on the deck of a sjark (beyond her 150) make her tender (GM under 0.35 m), and the log warns')
        print(ok('Stabilitet' in r['hud'] and 'rank' in r['hud'] and 'Stabilitet' in r['panel'] and 'rulleperiode' in r['panel']), 'the HUD shows the warning and the Vær panel the GM, the roll period and the roll')
        print(ok(r['withCatch'] >= r['empty'] - 0.05 and 0.4 < r['atMax'] < r['empty']), 'catch low in the hold does not make her tender; her full 150 pots on deck take some GM, but stay above IMO\'s minimum')
        print(ok(0.7 < r['res']['ratio'] < 1.4 and r['res']['maxRoll'] > 1.5 * r['res']['intoRoll']), 'she rolls most where the encounter period meets her roll period, far more than heading into the sea')
        print(ok(abs(r['fDrift'] - 1) < 0.02 and r['fHead'] > 1.2 and r['fFollow'] < r['fHead']), 'the work feels the motions: drifting beam-on is the reference, a skiff driving into the sea feels much more, running before it less')
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
