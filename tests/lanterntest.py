"""The lanterns after Sjøveisreglene (vessel3d.js lanterns; docs/batplan.md del 11): under way, fishing, trawling, at anchor, aground,
not under command and in port, on boats of every size; and the NPCs' after what they do (Ø11.2, core/05e-sjovei.js sjvLanternSt): a
boat jigging shows the lights of one under way (26 e), nets in the sea red over white, the sides and stern by her real speed, a trawler
towing green over white, at anchor the anchor light, not under command two reds, at the quay none. Prints OK/FEIL lines. No 3D."""
import asyncio, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _env import boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await br.new_context(viewport={'width':1100, 'height':800})).new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""(()=>{ const R = {}, kinds = L => L.map(l => l[2]), col = c => c[0] > 0.8 && c[1] < 0.4 ? 'r' : c[1] > 0.8 && c[0] < 0.4 ? 'g' : 'w';
          const lan = (k, st) => lanterns(geoOf(k), VESSELS[k], st), way = {v:6}, still = {v:0};
          R.port = lan('sjark', {port:true}).length;
          R.trebat = kinds(lan('trebat', way)); R.skiff = kinds(lan('skiff', way)); R.sjark = kinds(lan('sjark', way)); R.kyst21 = kinds(lan('kyst21', way)); R.auto = kinds(lan('autoliner', way)); R.big = kinds(lan('bunntral', way));
          R.fishStill = lan('sjark', {fishing:true, v:0}).map(l => col(l[1]) + ':' + l[2]); R.fishWay = kinds(lan('sjark', {fishing:true, v:4}));
          const f = lan('sjark', {fishing:true, v:0}); R.redOverWhite = f.length === 2 && f[1][0][1] > f[0][0][1] && col(f[1][1]) === 'r' && col(f[0][1]) === 'w';
          R.gap = ['sjark', 'kyst21', 'autoliner', 'snokrabbe'].map(t => { const q = lan(t, {fishing:true, v:0}); return [t, VESSELS[t].len, +(q[1][0][1] - q[0][0][1]).toFixed(2)]; });
          R.trawl = lan('bunntral', {fishing:true, trawl:true, v:3}).map(l => col(l[1]) + ':' + l[2]);
          R.anch = kinds(lan('sjark', {anch:true, v:0})); R.anch50 = kinds(lan('bunntral', {anch:true, v:0}));
          R.aground11 = kinds(lan('sjark', {aground:true})); R.aground15 = lan('kyst15', {aground:true}).map(l => col(l[1]) + ':' + l[2]);
          R.nuc = lan('hurtigsjark', {nuc:true, v:0}).map(l => col(l[1]) + ':' + l[2]); R.nucWay = kinds(lan('hurtigsjark', {nuc:true, v:3}));
          // the NPC models' typed lights go through the same rules
          const GN = {lights:[[[0, 10.2, -1.2], [1, 0.95, 0.85]], [[-1.9, 5.3, -2.2], [1, 0.12, 0.1]], [[1.9, 5.3, -2.2], [0.1, 1, 0.35]], [[0, 2.8, 7.8], [1, 0.95, 0.85]]]};
          R.npcWay = kinds(lanterns(GN, {len:21, vmax:12}, {v:5})); R.npcFish = lanterns(GN, {len:21, vmax:12}, {fishing:true, v:0}).map(l => col(l[1]) + ':' + l[2]); R.npcPort = lanterns(GN, {len:21}, {port:true}).length;
          // Ø11.2: an NPC's lanterns from what she does (sjvLanternSt), no longer a fixed 5 knots and fishing lights for every boat fishing
          const N = o => lanterns(GN, {len:21, vmax:12}, sjvLanternSt(o)), ck = L => L.map(l => col(l[1]) + ':' + l[2]);
          R.nJig = kinds(N({cls:'pow', st:'fishing', v:0})); R.nNet = ck(N({cls:'fish', st:'fishing', v:0})); R.nNetWay = kinds(N({cls:'fish', st:'fishing', v:2}));
          R.nTrawl = ck(N({cls:'fish', st:'fishing', trawl:true, v:3})); R.nAnch = kinds(N({cls:'anch', v:0})); R.nNuc = ck(N({cls:'nuc', v:0})); R.nNucWay = kinds(N({cls:'nuc', v:3})); R.nQuay = N({cls:'moor', v:0}).length;
          // and from the clock: every boat on the AIS list gets a state, the ones at the quay none
          const all = npcStates(S.t / 60); R.clock = {n:all.length, quayLit:all.filter(n => n.cls === 'moor' && N(n).length).length, jigFish:all.filter(n => n.cls === 'pow' && sjvLanternSt(n).fishing).length};
          return R; })()""")
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['port'] == 0 and r['npcPort'] == 0), 'in port no lanterns')
        print(ok(r['trebat'] == ['allround', 'side', 'side'] and r['skiff'] == ['allround', 'side', 'side'] and r['sjark'] == ['allround', 'side', 'side', 'stern']), 'under way an open boat shows one all-round white and the sides, the havsjark her stern light too', [r['trebat'], r['skiff'], r['sjark']])
        print(ok(r['kyst21'] == ['masthead', 'side', 'side', 'stern'] and r['auto'] == ['masthead', 'side', 'side', 'stern'] and r['big'] == ['masthead', 'side', 'side', 'stern', 'masthead2']), 'from 12 m a masthead light, sides and stern (the 45 m autoliner too); from 50 m a second masthead light', [r['kyst21'], r['auto'], r['big']])
        print(ok(all(g >= (2.0 if L >= 20 else 1.0) - 1e-6 for _, L, g in r['gap'])), 'the two fishing lights at least 2 m apart from 20 m, 1 m under (vedlegg I 2(i))', r['gap'])
        print(ok(r['fishStill'] == ['w:fishW', 'r:fishR'] and r['redOverWhite'] and r['fishWay'] == ['fishW', 'fishR', 'side', 'side', 'stern']), 'fishing: red over white, the sides and stern only when she makes way', [r['fishStill'], r['fishWay']])
        print(ok(r['trawl'][:2] == ['w:fishW', 'g:trawlG'] and 'w:masthead2' in r['trawl'] and 'w:stern' in r['trawl']), 'trawling: green over white, and a 60 m trawler a masthead light abaft', r['trawl'])
        print(ok(r['anch'] == ['anchor'] and r['anch50'] == ['anchor', 'anchor2'] and r['aground11'] == ['anchor'] and r['aground15'] == ['w:anchor', 'r:nuc', 'r:nuc']), 'at anchor one white (two from 50 m); aground also two reds from 12 m', [r['anch'], r['anch50'], r['aground11'], r['aground15']])
        print(ok(r['nuc'] == ['r:nuc', 'r:nuc'] and r['nucWay'] == ['nuc', 'nuc', 'side', 'side', 'stern']), 'not under command: two reds, the sides and stern only when making way', [r['nuc'], r['nucWay']])
        print(ok(r['npcWay'] == ['masthead', 'side', 'side', 'stern'] and r['npcFish'] == ['w:fishW', 'r:fishR']), 'the NPC models follow the same rules', [r['npcWay'], r['npcFish']])
        print(ok(r['nJig'] == ['masthead', 'side', 'side', 'stern'] and r['nNet'] == ['w:fishW', 'r:fishR'] and r['nNetWay'] == ['fishW', 'fishR', 'side', 'side', 'stern']), 'Ø11.2: the NPC jigging shows the lights of one under way (26 e), with nets red over white, the sides and stern when she makes way', [r['nJig'], r['nNet'], r['nNetWay']])
        print(ok(r['nTrawl'][:2] == ['w:fishW', 'g:trawlG'] and 'w:stern' in r['nTrawl'] and r['nAnch'] == ['anchor'] and r['nNuc'] == ['r:nuc', 'r:nuc'] and r['nNucWay'] == ['nuc', 'nuc', 'side', 'side', 'stern'] and r['nQuay'] == 0), 'Ø11.2: the NPC trawler towing green over white, at anchor the anchor light, not under command two reds, at the quay none', [r['nTrawl'], r['nAnch'], r['nNuc'], r['nQuay']])
        print(ok(r['clock']['n'] > 0 and r['clock']['quayLit'] == 0 and r['clock']['jigFish'] == 0), 'Ø11.2: the boats from the clock: none at the quay lit, none jigging with fishing lights', r['clock'])
        print('errors:', errs)
        await br.close()

asyncio.run(main())
