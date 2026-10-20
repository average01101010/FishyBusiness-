"""The deck kit from Blender in 3D (tools/deck: fisk.py, rigg.py, kran.py, sikker.py; view3d.js drawDeck, drawSafety, drawCargo,
drawCrane; the user's wish 19.10.2026): every coastal boat with her places (the model's anchors.kit), the liferaft and the buoys the
rules ask for (V.lsa), the radar that is bought turning at sea, the catch in the tubs on the open boats, the nets in their tub and the
line in its tubs when she is rigged for them, and at the quay the crates on deck and the crane unfolding to work the freight.
Pictures deck_*.png in tests/out (landscape, and portrait for two). Prints OK or FEIL."""
from _env import boot, OUT
import asyncio, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra != '' else ''))


# the boat at sea on a ground or at a plant's quay; the radar she can carry bought; her rig, the gear aboard and the catch
SET = """((a) => { const [type, scene] = a, b = S.boat, g = GROUNDS[0].p; S.tut = 0; S.mult = 0; S.t = Math.round((Date.UTC(2027, 2, 12, 11) - EPOCH) / 6e4);
  b.type = type; applyVessel(); G3.vesselChanged(); S.boatName = 'Havbris'; S.equip = {}; S.jobs = []; S.cargo = []; b.gop = null; S.plan = null;
  if (equipFits('radarA', type)) S.equip.radarA = true; else if (equipFits('radar', type)) S.equip.radar = true;
  S.pgear = newPGear(); b.rig = scene === 'garn' ? 'garn' : scene === 'line' ? 'line' : 'juksa';
  if (scene === 'garn') S.pgear.nets = [{id:'n1', mesh:180, ty:'torsk', n:6, cond:1}];
  if (scene === 'line'){ S.pgear.lines.bank.n = 6; S.pgear.lines.bank.baited = 4; }
  const V = VESSELS[type]; S.hold = scene === 'fiske' ? [{sp:'torsk', kg:Math.round((V.holdCap || 400) * 0.55), gut:true, iced:true}, {sp:'sei', kg:60, gut:true, iced:true}] : [];
  if (scene === 'kai'){ const q = portById('husoy'); b.status = 'port'; b.port = 'husoy'; b.pos = {...q.p}; b.berth = 'main'; b.shift = b.fueling = b.land = b.after = null; b.moorT = S.t - 60;
    S.cargo = [{tur:'t1', kg:Math.min(1500, V.deckCargo || 0), no:'proviant', en:'provisions'}]; S.jobs = [{kind:'last', crew:true, h:2, until:S.t + 120, no:'Lasting av proviant', en:'Loading the provisions'}]; }
  else { b.status = 'fishing'; b.port = null; b.pos = {x:g.x, y:g.y}; b.heading = 0.4; b.v = 0; b.fishUntil = S.t + 600; }
  const c = G3._debug.cam; c.helm = false; c.pitch = 0.42; c.yaw = 1.25; c.dist = 4 + V.len * (V.len < 14 ? 0.55 : 0.8); })"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 960, 'height': 640}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        await pg.wait_for_function("G3.isActive()", timeout=90000); await pg.wait_for_timeout(3000)
        parts = await pg.evaluate("""(() => { const P = G3._debug.kitPart, need = {fish:['kar300', 'kar460', 'kar1000', 'vann', 'is', 'hott', 'kniv', 'bord', 'benk'],
          rig:['stamp', 'line_r', 'line_g', 'kroker', 'garn', 'garn_kant', 'kasse', 'pall', 'kasse_s'], crane:['base', 'col', 'b1', 'b2', 'ext1', 'ext2', 'hook', 'cyl1b', 'cyl1r', 'cyl2b', 'cyl2r', 'rest'],
          safe:['radome', 'radar_ped', 'radar_bar4', 'livboye', 'boyeholder', 'boyelys', 'boyeline', 'flate4', 'flate6', 'flate12', 'vugge4', 'vugge6', 'vugge12']}, miss = [];
          for (const [f, ns] of Object.entries(need)) for (const n of ns) if (!P(f, n)) miss.push(f + ':' + n); return miss; })()""")
        check(not parts, 'alle delene i dekksutstyret fra Blender er med', parts)
        boats = await pg.evaluate("Object.keys(VESSELS).filter(t => VESSELS[t].cls !== 'hav')")
        # every coastal boat has the places its data asks for: rafts and buoys by the rules, the radar where it fits, tubs on the open
        # boats that keep the catch on deck, the crane on the boats rated for one, the rig's tubs and room for freight
        miss = await pg.evaluate("""((boats) => { const out = {}; for (const t of boats){ const V = VESSELS[t], K = geoOf(t).kit || {}, m = [], L = V.lsa;
            if (L.rafts && !(K.raft && K.raft.length >= L.rafts)) m.push('raft'); if (!(K.buoys && K.buoys.length >= L.buoys)) m.push('buoys');
            if (equipFits('radar', t) && !K.radar) m.push('radar'); if (equipFits('radarA', t) && !K.radarA) m.push('radarA');
            if (V.hold.kind === 'dekk' && !(K.tubs && K.tubs.length) && !geoOf(t).hand) m.push('tubs'); if (V.crane > 0 && !K.crane) m.push('crane');
            if (!K.garn) m.push('garn'); if (!K.stamps) m.push('stamps'); if (!(K.cargo && K.cargo.length)) m.push('cargo'); if (m.length) out[t] = m; } return out; })""", boats)
        check(not miss, 'hver kystbåt har plassene dataene krever (flåte, livbøyer, radar, kar, kran, garnkar, stamper, last)', miss)
        seen = {}
        for t in boats:
            for scene in ['fiske', 'garn', 'line'] + (['kai'] if t in ('kyst15', 'kyst21', 'sjarkny', 'snekke') else []):
                await pg.evaluate(SET, [t, scene]); await pg.wait_for_timeout(2500 if scene != 'kai' else 12000)
                st = await pg.evaluate("JSON.parse(JSON.stringify(G3._debug.kitStat))")
                seen[(t, scene)] = st
                await pg.screenshot(path=os.path.join(OUT, f'deck_{t}_{scene}.png'))
        lsa = await pg.evaluate("((boats) => Object.fromEntries(boats.map(t => [t, VESSELS[t].lsa])))", boats)
        bad = {t: [seen[(t, 'fiske')]['raft'], seen[(t, 'fiske')]['buoys']] for t in boats if seen[(t, 'fiske')]['raft'] != lsa[t]['rafts'] or seen[(t, 'fiske')]['buoys'] != lsa[t]['buoys']}
        check(not bad, 'flåtene og livbøyene tegnes i tallet reglene krever', bad)
        txt = {t: seen[(t, 'fiske')]['text'] for t in boats if seen[(t, 'fiske')]['text'] != seen[(t, 'fiske')]['buoys']}
        check(not txt, 'hver livbøye har båtens navn og hjemhavn', txt)
        rad = {t: seen[(t, 'fiske')]['radar'] for t in boats if seen[(t, 'fiske')]['radar'] == 0 and (t not in ('skiff', 'trebat'))}
        check(not rad, 'den kjøpte radaren vises på hver båt den passer på', rad)
        # (the old wooden boat keeps her catch in the bleeding tub at her own place, the model's 'tub')
        tubs = {t: seen[(t, 'fiske')]['tubs'] + seen[(t, 'fiske')]['htub'] for t in boats if seen[(t, 'fiske')]['tubs'] + seen[(t, 'fiske')]['htub'] == 0 and t in ('skiff', 'snekke')}
        check(not tubs, 'de åpne båtene har fangsten i kar på dekk', tubs)
        # the radar's open array turns: two frames a second apart give two angles
        await pg.evaluate(SET, ['kyst15', 'fiske']); await pg.wait_for_timeout(2000)
        a0 = await pg.evaluate("G3._debug.kitStat.radar"); await pg.screenshot(path=os.path.join(OUT, 'deck_radar_a.png')); await pg.wait_for_timeout(700); await pg.screenshot(path=os.path.join(OUT, 'deck_radar_b.png'))
        check(a0 == 2, 'den åpne radarantennen på kystbåten tegnes', a0)
        # the crane at the quay: folded at sea, out and working while the freight goes aboard, with crates on deck
        cr = {t: seen[(t, 'kai')]['crane'] for t in ('kyst15', 'kyst21') if (t, 'kai') in seen}
        sea = {t: seen[(t, 'fiske')]['crane'] for t in ('kyst15', 'kyst21')}
        work = {t: c for t, c in cr.items() if c and c['job'] and sea[t] and abs(c['a1'] - sea[t]['a1']) + abs(c['a2'] - sea[t]['a2']) + c['e'] > 0.3}
        check(len(work) == 2, 'kranen er foldet sammen på sjøen og folder seg ut for å laste ved kaia', {'kai': cr, 'sjø': sea})
        crates = {t: seen[(t, 'kai')]['cargo'] for t in ('kyst15', 'kyst21', 'sjarkny', 'snekke')}
        check(all(v > 0 for v in crates.values()), 'trekassene står på dekk når båten har frakt', crates)
        # two pictures standing up (the tablet held upright)
        await pg.set_viewport_size({'width': 640, 'height': 960})
        for t, scene in [('sjarkny', 'line'), ('kyst15', 'kai')]:
            await pg.evaluate(SET, [t, scene]); await pg.wait_for_timeout(4000); await pg.screenshot(path=os.path.join(OUT, f'deck_{t}_{scene}_staaende.png'))
        gerr = await pg.evaluate("G3._debug.glErr()")
        check(gerr == 0, 'ingen GL-feil', gerr)
        check(not errs, 'ingen sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
