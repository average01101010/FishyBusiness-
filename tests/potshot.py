"""The conical king crab pot from Blender (tools/gear/teine.py kong; OB16, Jonas 09.11.2026: the square pot is out of the game) and
its hauling and setting in 3D (view3d/10-gear.js drawPots): on the coastal boats with places for the stacks (tools/boats/potplaces.json,
kit.pots), pictures through one hauled pot (on its way up, at the block, tipped over by the hauler and emptied into the tank, to the
stack) and one set pot (over the rail, sinking), and the stacks aboard while she is rigged for pots, in both formats. Checks that every
stack stands on one floor of the deck map (vessel3d.js deckMap) with its height clear over it and clear of the hauler and the crab tank,
and that the pots aboard are all drawn. Pictures pot_*.png. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


SET = """((a) => { const [op, type] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.t = Math.round((Date.UTC(2027, 5, 12, 11) - EPOCH) / 6e4); b.type = type; applyVessel(); G3.vesselChanged();
  if (!S.crew.length) S.crew = [Object.assign(genCrew(), {bi:false, off:false, fatigue:10, morale:62, traits:[]})]; S.me = S.cur; b.rig = 'teiner'; S.equip.teinehaler = true; S.equip.krabbekar = true;
  S.hold = [{sp:'krabbe', cls:1, kg:40, n:16, bled:true, iced:false, hr:0, fresh:98, gut:false, hook:false}];
  S.sets = [{id:'pz', vid:S.cur, kind:'teine', pot:'big', n:12, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, tSet:S.t - 1440, acc:{krabbe:{kg:60, n:40, ts:0}}, dead:0, lost:null, rep:false, warn:0, heavy:false, depth:60}];
  b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; S.plan = null; S.mult = 0;
  b.gop = op === 'haul' ? {op:'haul', kind:'teine', sid:'pz', n:12, done:5, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, kg:0, rel:0, dead:0, hooksPer:0}
                        : {op:'set', kind:'teine', s:{kind:'teine', pot:'big'}, n:12, done:4, prog:0.4, a:{x:g.x, y:g.y}, b:{x:g.x + 0.3, y:g.y}, fishAfter:0, hooksPer:0};
  const c = G3._debug.cam; c.helm = false; c.dist = 9; c.pitch = 0.42; c.yaw = -1.1; })"""


# the boats with places for the stacks (tools/boats/potplaces.json)
BOATS = ['hurtigsjark', 'sjarkny', 'breisjark', 'kyst21']
# each stack's footprint (a 1.45 m ring) on one floor of the deck map with its height clear over it (to the egg float on the top
# one), and clear of the hauler (1.2 m) and the crab tank (its half sizes and the ring); returns what is wrong per boat
STACKS = """((boats) => Object.fromEntries(boats.map(t => { const G = vesselModel(t).geo, M = deckMap(t), F = M._floors, K = (G.kit || {}).pots, X = (glbLoad('gear-pot').ex || {}).kong, out = [];
  if (!K || !K.at || !K.at.length) return [t, ['ingen plasser']];
  const T = G3._debug.tankPlace(t), TK = Array.isArray(T) ? T : T && T.tank;
  K.at.forEach((a, i) => { const h = Math.min(X.stack, a[4] || X.stack), top = X.h + (h - 1) * X.pitch + 0.45;
    // (every cell under the ring, 5 cm apart: a coaming or a sill one cell wide is found)
    for (let dx = -X.r; dx <= X.r + 1e-6; dx += 0.05) for (let dz = -X.r; dz <= X.r + 1e-6; dz += 0.05){ if (Math.hypot(dx, dz) > X.r) continue; const x = a[0] + dx, z = a[2] + dz, k = M.cellOf(x, z), f = k >= 0 ? F[k] : null;
      if (!f || !f.some(([y, b]) => !b && Math.abs(y - a[1]) < 0.1)){
        // (OB10, Jonas 10.11.2026: «To stabler»: the map's cells are 20 cm, and the outermost one at the bulwark's foot is no floor
        // though the deck runs under it; a ring may reach into that one cell at the ship's side, with floor in the cell inboard of it
        // and none outboard. A coaming or a sill inside the deck has floor on both sides and is still found)
        const c = M.c || 0.2, sg = x >= 0 ? 1 : -1, fl = q => { const kk = M.cellOf(q, z), ff = kk >= 0 ? F[kk] : null; return !!(ff && ff.some(([y, b]) => !b && Math.abs(y - a[1]) < 0.1)); };
        if (Math.abs(x) > (G.beam || 3) / 2 - 0.45 && fl(x - sg * c) && !fl(x + sg * c)) continue;
        out.push(i + ': ikke gulv ved ' + x.toFixed(2) + ',' + z.toFixed(2)); return; }
      const over = f.filter(([y]) => y > a[1] + 0.12).map(([y]) => y - a[1]); if (over.length && Math.min(...over) < top){ out.push(i + ': ' + Math.min(...over).toFixed(2) + ' m fri høyde, trenger ' + top.toFixed(2)); return; } }
    if (Math.hypot(a[0] - G.hauler[0], a[2] - G.hauler[2]) < 1.2) out.push(i + ': ved haleren');
    if (TK && Math.abs(a[0] - TK[0]) < X.r + 0.4 && Math.abs(a[2] - TK[2]) < X.r + 0.6) out.push(i + ': i krabbekaret'); });
  return [t, out]; })))"""
# rigged for pots in port, all her pots aboard; returns [aboard, what the places hold]
REST = """((type) => { const b = S.boat; S.tut = 0; b.type = type; applyVessel(); G3.vesselChanged(); S.pgear = newPGear(); b.rig = 'teiner'; S.equip.teinehaler = true; S.equip.krabbekar = true;
  b.gop = null; b.status = 'fishing'; S.sets = []; S.hold = []; const n = VESSELS[type].gearMax.teine; S.pgear.pots.big = n;
  const K = vesselModel(type).geo.kit.pots, X = glbLoad('gear-pot').ex.kong, room = K.at.reduce((s, a) => s + Math.min(X.stack, a[4] || X.stack), 0);
  const c = G3._debug.cam; c.helm = false; c.dist = 12; c.pitch = 0.75; c.yaw = -0.6; return [n, room]; })"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        parts = await pg.evaluate("(() => typeof glbHas === 'function' && glbHas('gear-pot') ? ['kong', 'kongtopp', 'konglag', 'konglagfull', 'davit', 'davitskive', 'krabbekar', 'teine', 'teinedor'].map(n => !!glbPart('gear-pot', n)) : [])()")
        check(len(parts) == 9 and all(parts[:7]) and not any(parts[7:]), 'den koniske kongekrabbeteina (hel, øverst, nestet, full stabel), davitten, haleskiva og krabbekaret er med, den firkantede og luka er ute', parts)
        st = await pg.evaluate(STACKS, BOATS)
        bad = {t: v for t, v in st.items() if v}
        check(not bad and len(st) == len(BOATS), 'hver stabel står på ett gulv med høyden fri over seg, unna haleren og krabbekaret', bad or st)
        shots = 0
        # (each picture takes about a minute in software 3D: the whole cycle lying, the pot tipped and the stacks standing)
        for vw, haul, rest in (((960, 640), [('haul', 'sjarkny', [0.5, 0.75, 0.95]), ('set', 'sjarkny', [0.45]), ('haul', 'kyst21', [0.75])], BOATS),
                               ((640, 960), [('haul', 'sjarkny', [0.75])], ['sjarkny', 'kyst21'])):
            await pg.set_viewport_size({'width': vw[0], 'height': vw[1]}); fmt = 'ligg' if vw[0] > vw[1] else 'staa'
            for op, type, us in haul:
                await pg.evaluate(SET, [op, type]); await pg.wait_for_timeout(2500)
                for u in us:
                    await pg.evaluate(f"G3._debug.pota.fix = {u}"); await pg.wait_for_timeout(900)
                    await pg.screenshot(path=f'pot_{type}_{op}_{int(u * 100)}_{fmt}.png'); shots += 1
            await pg.evaluate("G3._debug.pota.fix = null")
            # the stacks aboard, rigged for pots and not working them: as many drawn as there are aboard, up to what the places hold
            for type in rest:
                n = await pg.evaluate(REST, type); await pg.wait_for_timeout(2500)
                drawn = await pg.evaluate("G3._debug.kitStat.pots"); await pg.screenshot(path=f'pot_{type}_stabler_{fmt}.png'); shots += 1
                check(drawn == min(n[0], n[1]), f'{type} ({fmt}): stablene om bord viser teinene som er om bord', {'om bord': n[0], 'plass': n[1], 'tegnet': drawn})
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0 and shots == 12, 'bildene gjennom halte og satte teiner og stablene er tatt uten GL-feil', (gerr, shots))
        print('errors:', errs[:5])
        await b.close()


asyncio.run(main())
