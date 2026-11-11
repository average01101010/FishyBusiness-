"""Ø10b (steg 65, 11.11.2026): the cod where it may only be a bycatch, the Skagerrak outside the baseline (core/03e-rules.js ruByc, RU_BYC;
core/05-vessels.js bycAdd, bycConf and the word in fish(); ui/08-actions.js landConf; ui/07-guide.js landWarn; core/09j-kystvakt.js skagby).
The spot check along the coast: Kristiansand and Arendal (the boat fishes outside the baseline with the cod in the catch, the word over
5 %, the coast guard's remark, the quay before «Lever» and the confiscation at the landing), Egersund and Bergen (nothing new). Needs the
whole coast (tools/map/out/game). Screenshots of the word, the quay and the landing note in both formats go to tests/out/skag-*.png.
Prints OK or FEIL per check."""
from _env import GAME, boot, OUT
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


PLACES = [('Kristiansand', 58.140, 7.996, True), ('Arendal', 58.462, 8.778, True), ('Egersund', 58.438, 5.979, False), ('Bergen', 60.39, 5.0, False)]

# the best jig place 1–6 nm outside the baseline south or west of the plant, the boat put there, and four hours' fishing
FISH = """(async ([lat, lon]) => { const a = P(lat, lon), H = S.t / 60; let best = null;
  for (let d = 0.5; d <= 40; d += 0.5) for (const [dx, dy] of [[0, 1], [-1, 0], [-0.7, 0.7], [0.7, 0.7]]){ const p = {x:a.x + dx * d, y:a.y + dy * d};
    if (insideBaseline(p) || blNm(p) < 1 || blNm(p) > 6) continue; await mapNeed(p, MAPD.simR); if (isLand(p)) continue;
    const v = SP.reduce((s, sp) => s + density(sp, p, H), 0); if (!best || v > best.v) best = {v, p}; }
  if (!best) return {err:'no place'};
  const b = S.boat, p = best.p; S.hold = []; delete b.byc; S.fsess = null; S.plan = null; S.draft = []; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; S.tut = 0; S.fm = {...(S.fm || {}), b:false};
  const zone = ruByc({p, len:BOAT.len, gear:'juksa'}), block = ruBlockMsg({p, len:BOAT.len, gear:'juksa', sp:null, hand:true}), blockCod = !!ruBlockMsg({p, len:BOAT.len, gear:'juksa', sp:'torsk', hand:true});
  const v = rulesAt({p, len:BOAT.len, gear:'juksa', sp:null, hand:true}), n0 = S.msgs.length;
  // (fish() itself in a light breeze, a minute at a time: the day's own weather can be too hard for a hand jig, and then nothing is asked)
  b.status = 'fishing'; b.deckStop = false; b.deckEnd = null; b.fishUntil = S.t + 240; for (let k = 0; k < 240 && b.status === 'fishing'; k++){ S.t += 1; fish(S.t / 60, 3, 0.3); }
  const fs = S.fsess, kgOf = sp => S.hold.reduce((s, x) => s + (x.sp === sp ? x.kg : 0), 0), tot = S.hold.reduce((s, x) => s + x.kg, 0);
  const told = S.msgs.slice(n0).filter(m => m.from === 'Regler' && /bifangst/.test(m.no)), kv = kvCheck(b).items.map(i => i.k);
  return {p:[+p.x.toFixed(1), +p.y.toFixed(1)], nm:+blNm(p).toFixed(1), zone, block, blockCod, v:v.v, keys:v.items.map(i => i.k), kg:Math.round(tot), cod:Math.round(kgOf('torsk')), byc:b.byc ? {kg:Math.round(b.byc.skag.kg), cod:Math.round(b.byc.skag.cod)} : null,
    st:b.status, dens:+best.v.toFixed(3), log:S.log.slice(-2).map(l => l.no || l[1] || String(l)), told:told.length, text:told[0] ? told[0].no : '', kv, conf:+bycConf().kg.toFixed(1)}; })"""

# to the nearest plant with what is aboard: the quay's word before «Lever», then the landing
LAND = """(() => { const b = S.boat, pt = PORTS.filter(q => q.mottak).sort((x, y) => dist(x.p, b.pos) - dist(y.p, b.pos))[0]; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; S.fsess = null; delete b.land;
  const q = quotaState(), C = landConf(S.t / 60, q, access()), d = document.createElement('div'); d.innerHTML = landWarn(pt); const txt = d.textContent, n0 = S.msgs.length, cod = S.hold.reduce((s, x) => s + (x.sp === 'torsk' ? x.kg : 0), 0);
  sell(); const ls = S.lastSale, m = S.msgs.slice(n0).filter(x => x.from === 'Norges Råfisklag' && /Skagerrak/.test(x.no));
  return {port:pt.name, acc:access(), cod:Math.round(cod), zConf:+C.zConf.toFixed(1), codConf:+C.codConf.toFixed(1), warn:txt, rows:ls.confRows, confKg:Math.round(ls.confKg), msg:m.length, byc:b.byc || null}; })()"""

# the set scene for the pictures: 300 kg of saithe and 100 kg of cod jigged outside the baseline off Kristiansand
SCENE = """(async () => { const a = P(58.140, 7.996); let p = null; for (let d = 0.2; d <= 40 && !p; d += 0.2){ const q = {x:a.x, y:a.y + d}; if (!insideBaseline(q) && blNm(q) > 1) p = q; }
  await mapNeed(p, MAPD.simR); const b = S.boat; S.hold = []; delete b.byc; S.plan = null; S.draft = []; S.tut = 0; b.port = null; b.status = 'idle'; b.pos = {x:p.x, y:p.y}; S.t += 20;
  for (let k = 0; k < 30; k++) addCatch('sei', 10, null, true, {how:'juksa'}); for (let k = 0; k < 20; k++) addCatch('torsk', 5, null, true, {how:'juksa'});
  const pt = PORTS.filter(q => q.mottak).sort((x, y) => dist(x.p, b.pos) - dist(y.p, b.pos))[0]; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; delete b.land;
  return {byc:b.byc, conf:bycConf().kg, port:pt.name}; })()"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        for name, lat, lon, skag in PLACES:
            f = await pg.evaluate(FISH, [lat, lon])
            if f.get('err'): check(False, name + ': a place outside the baseline', f); continue
            if skag:
                check(f['zone'] == 'skag' and not f['block'] and f['blockCod'] and f['v'] == 'warn' and 'skag5' in f['keys'], name + ': outside the baseline the jig is not stopped, the answer is yellow (skag5), fishing for cod is closed', f)
                check(f['kg'] > 5 and f['byc'] and abs(f['byc']['kg'] - f['kg']) <= 2, name + ': she fishes there, and the hold counts the catch as taken in the Skagerrak', f)
                if not f['byc']: continue
                over = f['byc']['cod'] > 0.05 * f['byc']['kg'] + 1 and f['byc']['kg'] >= 20
                check((f['told'] == 1 and '§ 5' in f['text'] and 'skagby' in f['kv']) if over else f['told'] == 0, name + (': over 5 % cod: the word once, with the paragraph, and the coast guard remarks on it' if over else ': at most 5 % cod here: no word'), f)
            else:
                check(f['zone'] is None and 'skag5' not in f['keys'] and f['byc'] is None and f['told'] == 0 and f['conf'] == 0 and 'skagby' not in f['kv'], name + ': nothing new (no bycatch zone, no count, no word)', f)
            l = await pg.evaluate(LAND)
            want = max(0, (f['byc']['cod'] - 0.05 * f['byc']['kg'])) if f.get('byc') else 0
            if skag and want > 1:
                check(abs(l['zConf'] - f['conf']) < 0.2 and 'Skagerrak' in l['warn'] and any(r[0] == 'torsk' for r in (l['rows'] or [])) and l['msg'] == 1 and l['byc'] is None, name + ': the quay says it before «Lever», the landing takes the cod over 5 %, and the count ends', l)
            else:
                check(l['zConf'] == 0 and 'Skagerrak' not in l['warn'] and not any(r[3] == 'byc5' for r in (l['rows'] or [])), name + ': nothing confiscated as Skagerrak bycatch', l)
        # the pictures, both formats: the word on the screen, the quay before «Lever», the landing note
        for tag, w, h in [('liggende', 1280, 800), ('staaende', 800, 1280)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
            await pg.evaluate("(() => { const b = S.boat; b.port = null; b.status = 'idle'; b.pos = {...P(58.02, 8.0)}; toast('24 % torsk i fangsten: over bifangstgrensen på 5 %. Flytt.', 8000); })()"); await pg.wait_for_timeout(150)
            await pg.screenshot(path=os.path.join(OUT, 'skag-varsel-' + tag + '.png'))
            s = await pg.evaluate(SCENE)
            await pg.evaluate("toastClear(); PHONE.open('lever')"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=os.path.join(OUT, 'skag-kaia-' + tag + '.png'))
            t1 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            await pg.evaluate("sell(); PHONE.render()"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=os.path.join(OUT, 'skag-seddel-' + tag + '.png'))
            t2 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            check(abs(s['conf'] - 80) < 0.01 and 'Skagerrak' in t1 and '80 kg' in t1, tag + ': the quay says 80 kg (100 cod of 400 kg taken there)', {'scene': s})
            check('over 5 % bifangst i Skagerrak' in t2, tag + ': the landing note has the row «Inndratt: torsk over 5 % bifangst i Skagerrak»')
            await pg.evaluate("PHONE.show(false)")
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
