from _env import boot
# The rules along the coast (core/03e-rules.js, R2 of the rules plan, 05.10.2026) on src/data/rules.json (tools/rules/regler.py, R1):
# the zones of the fjord lines, the baseline and its distance, the statistics areas, and the answers of rulesAt() for høstingsforskriften
# § 31, § 33, § 39 and J-161-2026 § 32 at points picked in tools/rules (sea in the game's land, the zone and area as the data have them),
# and the king crab's quota area, free fishing and November closure (J-136-2026 and J-138-2026, 04.10.2026).
import asyncio, json
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'

PTS = {'malangen': (69.50, 18.40), 'vfInner': (68.0, 15.3), 'vfOuter': (67.9, 14.3), 'open': (69.6, 16.5), 'oslo': (59.25, 10.4833),
       'porsInner': (70.2, 25.05), 'porsOuter': (70.95, 26.0), 'senjaBL': (69.1333, 16.0667), 'a05lt4': (69.275, 15.7),
       'finn24': (70.875, 29.375), 'finn02': (70.875, 29.25), 'henn': (68.1442, 14.42), 'darupW': (70.75, 21.5),
       'kcFree': (71.05, 24.9), 'kcVar': (70.1, 30.2), 'kcBox': (71.19, 25.6)}

RULES = """(() => { const R = {}, Q = __Q__, at = (m, d) => (Date.UTC(2027, m - 1, d, 12) - EPOCH) / 36e5, p = k => P(...Q[k]);
  const ks = r => r.items.map(i => i.v + ':' + i.k), has = (r, k) => r.items.some(i => i.k === k);
  R.data = {ok:RU.ok, zones:RU.zones.length, layers:Object.keys(RU.L).length, hom:RU.hom.length, lok:RU.lok.length, made:RU.made};
  R.where = {}; for (const k in Q){ const q = p(k); R.where[k] = {F:insideFjord(q), bl:insideBaseline(q), nm:+blNm(q).toFixed(2), hom:ruHom(q), lok:ruLok(q), b:ruBits(q)}; }
  // the official 4 nm line lies 4 nm from the baseline
  const n4 = RU.dec(RU.nm['4'][0]), d4 = []; for (let i = 0; i < n4.length; i += 40) d4.push(blNm({x:n4[i], y:n4[i + 1]})); d4.sort((a, b) => a - b);
  R.nm4 = [+d4[0].toFixed(3), +d4[Math.floor(d4.length / 2)].toFixed(3), +d4[d4.length - 1].toFixed(3)];
  const q = (k, len, sp, gear, H, hand) => rulesAt({p:p(k), H, len, sp, gear:gear || 'juksa', hand});
  R.f31 = {cod16:ks(q('malangen', 16, 'torsk', 'garn', at(2, 1))), saithe16:ks(q('malangen', 16, 'sei', 'garn', at(2, 1))), saithe22:ks(q('malangen', 22, 'sei', 'garn', at(2, 1))), small:q('malangen', 9, 'torsk', 'juksa', at(2, 1)).v};
  R.j32b = {senjaCod:has(q('senjaBL', 24, 'torsk', 'line', at(2, 15)), 'j32b'), senjaHad:has(q('senjaBL', 24, 'hyse', 'line', at(2, 15)), 'j32b'),
            vfCodFeb:has(q('vfOuter', 24, 'torsk', 'line', at(2, 15)), 'j32b'), vfCodJun:has(q('vfOuter', 24, 'torsk', 'line', at(6, 1)), 'j32b'), vfHad:has(q('vfOuter', 24, 'hyse', 'line', at(6, 1)), 'j32b'),
            open:has(q('open', 24, 'torsk', 'line', at(2, 15)), 'j32b')};
  R.j32c = {outJan:has(q('a05lt4', 30, 'torsk', 'line', at(1, 15)), 'j32c'), outAug:has(q('a05lt4', 30, 'torsk', 'line', at(8, 15)), 'j32c'), inBL:has(q('senjaBL', 30, 'torsk', 'line', at(1, 15)), 'j32c'),
            finn24Aug:has(q('finn24', 30, 'torsk', 'line', at(8, 15)), 'j32c'), finn02Aug:has(q('finn02', 30, 'torsk', 'line', at(8, 15)), 'j32c'), open:has(q('open', 30, 'torsk', 'line', at(8, 15)), 'j32c')};
  R.henn = {big:has(q('henn', 12, 'torsk', 'juksa', at(2, 1)), 'henn'), small:has(q('henn', 10, 'torsk', 'juksa', at(2, 1)), 'henn'), july:has(q('henn', 12, 'torsk', 'juksa', at(7, 1)), 'henn')};
  R.oslo = {cod:has(q('oslo', 8, 'torsk', 'juksa', at(5, 1), true), 'oslo'), net:has(q('oslo', 8, 'sei', 'garn', at(5, 1)), 'oslog'), hand:has(q('oslo', 8, 'sei', 'juksa', at(5, 1), true), 'oslog')};
  R.kveite = {mar:has(q('open', 9, 'kveite', 'juksa', at(3, 1)), 'kv39'), jun:has(q('open', 9, 'kveite', 'juksa', at(6, 1)), 'kv39'), south:has(q('oslo', 9, 'kveite', 'juksa', at(6, 1)), 'kv39')};
  R.uer = {small:has(q('open', 12, 'uer', 'juksa', at(7, 1)), 'uer39'), big:has(q('open', 20, 'uer', 'juksa', at(7, 1)), 'uer39'), may:has(q('open', 12, 'uer', 'juksa', at(5, 1)), 'uer39')};
  R.limits = {malangen:fjordLimits(p('malangen'), at(12, 1)), porsOuterDec:fjordLimits(p('porsOuter'), at(12, 1)), porsOuterJun:fjordLimits(p('porsOuter'), at(6, 1)), porsInnerDec:fjordLimits(p('porsInner'), at(12, 1)), open:fjordLimits(p('open'), at(12, 1))};
  R.size = {codIn:ruMinSize('torsk', p('senjaBL')), codOut:ruMinSize('torsk', p('open')), codSouth:ruMinSize('torsk', p('oslo')), kc:ruMinSize('krabbe', p('kcFree'))};
  R.kc = {free:ks(q('kcFree', 11, 'krabbe', 'teiner', at(9, 1))), varanger:has(q('kcVar', 11, 'krabbe', 'teiner', at(9, 1)), 'kc2'), pors:has(q('porsInner', 11, 'krabbe', 'teiner', at(9, 1)), 'kc2'),
          boxNov:has(q('kcBox', 11, 'krabbe', 'teiner', at(11, 5)), 'kc10'), boxDec:has(q('kcBox', 11, 'krabbe', 'teiner', at(12, 5)), 'kc10'), cod:has(q('kcFree', 11, 'torsk', 'juksa', at(9, 1)), 'kc5')};
  R.field = fieldCode(GROUNDS[0].p);
  R.block = {small:ruBlockMsg({p:p('malangen'), len:9, gear:'juksa', sp:null}), big:!!ruBlockMsg({p:p('malangen'), len:16, gear:'juksa', sp:null})};
  // speed: the cells along the coast and the full answer
  let t0 = performance.now(), n = 0; for (let i = 0; i < 20000; i++){ const x = 820 + (i * 7919 % 6000) / 100, y = 340 + (i * 104729 % 6000) / 100; n += ruBits({x, y}) & 2 ? 1 : 0; } R.tBits = Math.round(performance.now() - t0);
  t0 = performance.now(); for (let i = 0; i < 400; i++) ruBits({x:600 + (i * 7919 % 600), y:200 + (i * 104729 % 500)}); R.tBlocks = Math.round(performance.now() - t0);
  t0 = performance.now(); for (let i = 0; i < 300; i++) rulesAt({p:{x:840 + i * 0.05, y:380}, len:16, sp:'torsk', gear:'line'}); R.tRules = Math.round(performance.now() - t0);
  // R3: the Regler app, the line in the status box, and the chart's rule layer
  const P0 = {...S.boat.pos}, st0 = S.boat.status; S.boat.status = 'sailing'; S.boat.pos = {...p('malangen')}; RU_NOW = null; renderHud();
  const row = document.querySelector('#hud .rlink'); R.hud = row ? row.textContent : null;
  PHONE.open('regler'); const v = () => document.querySelector('#phone') ? document.querySelector('#phone').innerText : document.body.innerText;
  R.app = {here:/Kan jeg fiske her|Can I fish here/.test(v()), grid:document.querySelectorAll('.ru-grid tr').length, cells:document.querySelectorAll('.ru-c').length};
  const cell = document.querySelector('.ru-c[data-v="hyse:line"]'); if (cell) cell.click();
  R.app.check = {tab:/Svar|Answer/.test(v()), sp:(document.querySelector('.ru-chips button.on[data-k="sp"]') || {}).dataset ? document.querySelector('.ru-chips button.on[data-k="sp"]').dataset.v : null, gear:(document.querySelector('.ru-chips button.on[data-k="gear"]') || {dataset:{}}).dataset.v};
  const lb = document.querySelector('.ph-sub button[data-s="laer"]'); if (lb) lb.click(); R.app.learn = document.querySelectorAll('.ph-c .ph-card').length;
  PHONE.show(false); S.boat.pos = P0; S.boat.status = st0; RU_NOW = null;
  const qm = p('malangen'), bx = Math.floor(qm.x / 10), by = Math.floor(qm.y / 10), cnt = (A, v) => A.reduce((a, x) => a + (x === v ? 1 : 0), 0);
  t0 = performance.now(); const A16 = ruLayerBlock(bx, by, {len:16, gear:'juksa', sp:null, hand:false}); R.tLayer = Math.round(performance.now() - t0);
  const A9 = ruLayerBlock(bx, by, {len:9, gear:'juksa', sp:null, hand:false});
  R.layer = {no16:cnt(A16, 2), no9:cnt(A9, 2), land:cnt(A16, 3), sea:1600 - cnt(A16, 3)};
  return R; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 900, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        R = await pg.evaluate(RULES.replace("__Q__", json.dumps(PTS)))
        d = R['data']
        print(ok(d['ok'] and d['zones'] > 50 and d['layers'] >= 15 and d['hom'] > 40 and d['lok'] > 400), 'rules.json is in the page: the baseline, the zones, the layers and the statistics areas', d)
        w = R['where']
        print(ok(w['malangen']['F'] and w['vfInner']['F'] and not w['vfOuter']['F'] and w['vfOuter']['bl'] and not w['open']['bl'] and w['porsInner']['F'] and w['porsOuter']['F']), 'inside the fjord lines: Malangen, inner Vestfjorden, Porsanger; outer Vestfjorden is inside the baseline only, the sea off Andøya outside it', {k: (v['F'], v['bl']) for k, v in w.items()})
        print(ok(w['malangen']['hom'] == '05' and w['vfOuter']['hom'] == '00' and w['porsInner']['hom'] == '03' and w['oslo']['hom'] == '09' and w['darupW']['hom'] == '04'), 'the main statistics areas: Troms 05, Vestfjorden 00, Øst-Finnmark 03, Vest-Finnmark 04, the Oslo fjord 09', {k: v['hom'] for k, v in w.items()})
        print(ok(abs(R['nm4'][1] - 4) < 0.05 and R['nm4'][0] > 3.9 and R['nm4'][2] < 4.1), 'the official 4 nm line lies 4 nm from the baseline (min, median, max)', R['nm4'])
        print(ok(1 < w['a05lt4']['nm'] < 1.5 and 2.2 < w['finn24']['nm'] < 2.5 and 0.9 < w['finn02']['nm'] < 1.3 and w['senjaBL']['nm'] == 0), 'the distance from the baseline, 0 inside it', {k: w[k]['nm'] for k in ('a05lt4', 'finn24', 'finn02', 'senjaBL', 'open')})
        f = R['f31']
        print(ok('no:f31' in f['cod16'] and 'ok:f31h' in f['saithe16'] and 'no:f31' in f['saithe22'] and f['small'] != 'no'), '§ 31: 15 m or more may not fish cod inside the fjord lines; under 21 m other species, 21 m or more not at all north of Tysfjorden; under 15 m free', f)
        b = R['j32b']
        print(ok(b['senjaCod'] and b['senjaHad'] and not b['vfCodFeb'] and b['vfCodJun'] and not b['vfHad'] and not b['open']), 'J-161 § 32: 21-27.99 m not inside the baseline; in area 00 cod up to the fjord lines 1.1-1.5 and haddock always', b)
        c = R['j32c']
        print(ok(not c['outJan'] and c['outAug'] and c['inBL'] and not c['finn24Aug'] and c['finn02Aug'] and not c['open']), 'J-161 § 32: 28 m or more not within 4 nm; from area 05 to Russia up to the baseline in Jan-Jun, east of Darupskjæret up to 2 nm in Jul-Dec', c)
        h = R['henn']
        print(ok(h['big'] and not h['small'] and not h['july']), 'Henningsværboksen is closed 1.1-30.6 for vessels over 11 m', h)
        o = R['oslo']
        print(ok(o['cod'] and o['net'] and not o['hand']), 'the Oslo fjord: no cod all year, and only hand-held gear for fish', o)
        k = R['kveite']; u = R['uer']
        print(ok(k['mar'] and not k['jun'] and k['south'] and not u['small'] and u['big'] and u['may']), '§ 39: halibut closed 20.12-20.4 north of 62 and all year south; redfish only by jig under 15 m in June-August', {'kveite': k, 'uer': u})
        lm = R['limits']
        print(ok(lm['malangen'] == {'nets': 80, 'hooks': 5000} and lm['porsOuterDec'] == {'nets': 80, 'hooks': None} and lm['porsOuterJun']['hooks'] == 5000 and lm['porsInnerDec']['hooks'] == 5000 and lm['open'] is None), '§ 33 and § 33a: 80 cod nets and 5,000 hooks inside the fjord lines; the outer Porsanger is free of the hook limit 1.11-30.4', lm)
        s = R['size']
        print(ok(s == {'codIn': 55, 'codOut': 44, 'codSouth': 40, 'kc': None}), '§ 47 minimum sizes by place, and none for king crab in the free area', s)
        kc = R['kc']
        print(ok('ok:kc5' in kc['free'] and not any(x.endswith(':kc2') for x in kc['free']) and kc['varanger'] and kc['pors'] and kc['boxNov'] and not kc['boxDec'] and not kc['cod']), 'king crab: free west of 26° E, the quota area in Varanger and Porsanger is closed to a Senja boat, the box off Nordkapp closed 1-9 November (J-136-2026 § 2, J-138-2026 § 5 and § 10)', kc)
        print(ok(R['field'].startswith('05-') and len(R['field']) == 5), 'the landing note\'s location from Fiskeridirektoratet\'s locations', R['field'])
        print(ok(R['block']['small'] is None and R['block']['big']), 'what the game stops: a 16 m boat jigging in Malangen, not a 9 m one', R['block'])
        print(ok(R['tBits'] < 400 and R['tRules'] < 400 and R['tBlocks'] < 3000), 'speed: 20,000 cells round Senja (60 x 60 km), 300 full answers, and 400 cells spread over northern Norway, each in a new 10 km block (ms)', R['tBits'], R['tRules'], R['tBlocks'])
        a = R['app']
        print(ok(R['hud'] and ('Ikke torsk' in R['hud'] or '✓' in R['hud'] or '!' in R['hud'])), 'R3: the status box has a rules line at sea that opens the Regler app', R['hud'])
        print(ok(a['here'] and a['grid'] == 8 and a['cells'] == 19 and a['check']['tab'] and a['check']['sp'] == 'hyse' and a['check']['gear'] == 'line' and a['learn'] == 8), 'R3: the Regler app: here and now with the grid of species and gear, a tap shows the check, and eight rules told plainly', a)
        l = R['layer']
        print(ok(l['no16'] > l['sea'] * 0.5 and l['no9'] < l['no16'] * 0.1 and R['tLayer'] < 300), 'R3: the chart\'s rule layer is red inside Malangen for a 16 m boat and not for a 9 m one (cells, ms)', l, R['tLayer'])
        print('errors:', errs[:5]); await br.close()

asyncio.run(main())
