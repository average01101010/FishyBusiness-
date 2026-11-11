"""Ø10c (steg 68, 11.11.2026): the rules south of 62° N that the sources settle (core/03e-rules.js ruNsjo, RU_GYTE, the layers 18 and 19;
core/03d-quota.js SORQ, sorConf; ui/08-actions.js landConf; ui/07-guide.js landWarn; core/09j-kystvakt.js nsjo3 and skag3). The spot check
along the coast, with the starting boat (7 m, the open group):
  Bergen        the North Sea, the fjords too: the jig fishes, the cod is counted against the 3 tonnes, nothing is taken while there is
                room; with the cap full the quay says what is over 15 % before «Lever», the landing takes it, the coast guard asks
  Egersund      the same off the coast, and Egersundbanken (the spawning area) closed to all fishing on 1 March, open on 1 June
  Revet         the spawning area in the Skagerrak, the part in Norway's zone: closed on 1 March, open on 1 April
  Kristiansand  outside the baseline on 1 June with blad B: the cod goes on the exception's 3 tonnes, and over them it is a bycatch (5 %)
  Tromsø        north of 62° N: nothing of this
Needs the whole coast (tools/map/out/game). Screenshots of the quay and the landing note in both formats go to tests/out/sor62-*.png.
Prints OK or FEIL per check."""
from _env import GAME, boot, OUT
import asyncio, json, os
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)) if extra != '' else ''))


# the best jig place near the plant (outside the baseline when out is set, else where the boat lies off the town), four hours' fishing
FISH = """(async ([lat, lon, out]) => { const a = P(lat, lon), H = S.t / 60; let best = null;
  for (let d = 0.5; d <= 40; d += 0.5) for (const [dx, dy] of [[0, 1], [-1, 0], [-0.7, 0.7], [0.7, 0.7]]){ const p = {x:a.x + dx * d, y:a.y + dy * d};
    if (out ? (insideBaseline(p) || blNm(p) < 1 || blNm(p) > 6) : !insideBaseline(p)) continue; await mapNeed(p, MAPD.simR); if (isLand(p)) continue;
    const v = SP.reduce((s, sp) => s + density(sp, p, H), 0); if (!best || v > best.v) best = {v, p}; if (!out && best && d > 6) break; }
  if (!best) return {err:'no place'};
  const b = S.boat, p = best.p; S.hold = []; delete b.byc; S.fsess = null; S.plan = null; S.draft = []; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; S.tut = 0;
  const zone = ruByc({p, len:BOAT.len, gear:'juksa'}), block = ruBlockMsg({p, len:BOAT.len, gear:'juksa', sp:null, hand:true});
  const v = rulesAt({p, len:BOAT.len, gear:'juksa', sp:null, hand:true}), n0 = S.msgs.length;
  b.status = 'fishing'; b.deckStop = false; b.deckEnd = null; b.fishUntil = S.t + 240; for (let k = 0; k < 240 && b.status === 'fishing'; k++){ S.t += 1; fish(S.t / 60, 3, 0.3); }
  const kgOf = sp => S.hold.reduce((s, x) => s + (x.sp === sp ? x.kg : 0), 0), tot = S.hold.reduce((s, x) => s + x.kg, 0), it = v.items.find(i => i.k === 'nsjo' || i.k === 'nsjoby' || i.k === 'skag4');
  return {p:[+p.x.toFixed(1), +p.y.toFixed(1)], inBL:insideBaseline(p), nm:+blNm(p).toFixed(1), zone, block, v:v.v, keys:v.items.map(i => i.k + ':' + i.v), text:it ? it.no : '', kg:Math.round(tot), cod:Math.round(kgOf('torsk')),
    byc:b.byc || null, told:S.msgs.slice(n0).filter(m => m.from === 'Regler').length, kv:kvCheck(b).items.map(i => i.k), left:Math.round(sorLeft(zone || 'nsjo'))}; })"""

# to the nearest plant with what is aboard: the quay's word before «Lever», then the landing
LAND = """(() => { const b = S.boat, pt = PORTS.filter(q => q.mottak).sort((x, y) => dist(x.p, b.pos) - dist(y.p, b.pos))[0]; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; S.fsess = null; delete b.land;
  const q = quotaState(), q0 = {nsjo:q.nsjo || 0, skag4:q.skag4 || 0, torsk:q.torsk}, C = landConf(S.t / 60, q, access()), d = document.createElement('div'); d.innerHTML = landWarn(pt); const txt = d.textContent, n0 = S.msgs.length;
  const kv = kvCheck(b).items.map(i => i.k); sell(); const ls = S.lastSale, m = S.msgs.slice(n0).filter(x => x.from === 'Norges Råfisklag').map(x => x.no);
  return {port:pt.name, acc:access(), sConf:+C.sConf.toFixed(1), zConf:+C.zConf.toFixed(1), codConf:+C.codConf.toFixed(1), sOk:C.sOk, warn:txt, rows:ls.confRows, ved:ls.vedKr, confKr:Math.round(ls.confKr), msg:m, kv,
    dq:{nsjo:Math.round((q.nsjo || 0) - q0.nsjo), skag4:Math.round((q.skag4 || 0) - q0.skag4), torsk:Math.round(q.torsk - q0.torsk)}, byc:b.byc || null}; })()"""

# a set catch at a place: kg of saithe and cod jigged there, the boat then at the nearest plant
SCENE = """(async ([lat, lon, out, sei, cod, q]) => { const a = P(lat, lon); let p = null;
  for (let d = 0.2; d <= 40 && !p; d += 0.2) for (const [dx, dy] of [[0, 1], [-1, 0], [-0.7, 0.7], [0.7, 0.7]]){ const c = {x:a.x + dx * d, y:a.y + dy * d}; if (p) break; if (out ? (!insideBaseline(c) && blNm(c) > 1) : true){ await mapNeed(c, MAPD.simR); if (!isLand(c)) p = c; } }
  const b = S.boat; S.hold = []; delete b.byc; S.plan = null; S.draft = []; S.tut = 0; b.port = null; b.status = 'idle'; b.pos = {x:p.x, y:p.y}; S.t += 20; Object.assign(quotaState(), q || {});
  for (let k = 0; k < sei / 10; k++) addCatch('sei', 10, null, true, {how:'juksa'}); for (let k = 0; k < cod / 5; k++) addCatch('torsk', 5, null, true, {how:'juksa'});
  const kv = kvCheck(b).items.map(i => i.k), zone = ruByc({p, len:BOAT.len, gear:'juksa'}), keys = rulesAt({p, len:BOAT.len, gear:'juksa', sp:null, hand:true}).items.map(i => i.k + ':' + i.v);
  const pt = PORTS.filter(c => c.mottak).sort((x, y) => dist(x.p, b.pos) - dist(y.p, b.pos))[0]; b.status = 'port'; b.port = pt.id; b.pos = {...pt.p}; delete b.land;
  return {byc:b.byc, kv, zone, keys, port:pt.name, conf:+landConf(S.t / 60, quotaState(), access()).sConf.toFixed(1)}; })"""

# a point inside a feature of a layer, in Norway's zone, and what the rules say there on a date (hours from now) for a gear
AREA = """(([id, name, days, gear]) => { const f = RU.L[id].f.find(f => f.a.navn.startsWith(name)), b = f.bb; let p = null;
  for (let i = 1; i < 20 && !p; i++) for (let j = 1; j < 20 && !p; j++){ const c = {x:b[0] + (b[2] - b[0]) * i / 20, y:b[1] + (b[3] - b[1]) * j / 20}; if (ruIn(f.P, c.x, c.y) && ruSea(c) === 'no') p = c; }
  if (!p) return {err:'no point'}; const H = S.t / 60 + days * 24, r = rulesAt({p, H, len:BOAT.len, gear, sp:null, hand:true}), ll = LL(p);
  return {ll:[+ll.lat.toFixed(2), +ll.lon.toFixed(2)], date:dayStr(H), keys:r.items.map(i => i.k + ':' + i.v), block:ruBlockMsg({p, H, len:BOAT.len, gear, sp:null, hand:true}), p}; })"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        d0 = await pg.evaluate("({date:dayStr(S.t / 60), len:BOAT.len, acc:access(), type:S.boat.type})")
        print('start:', json.dumps(d0, ensure_ascii=False))

        # ---- Bergen and Egersund: the North Sea, the fjords and the coast
        for name, lat, lon, out in [('Bergen (innenfor grunnlinja)', 60.39, 5.30, False), ('Bergen (utenfor)', 60.39, 5.0, True), ('Egersund (utenfor)', 58.438, 5.979, True)]:
            f = await pg.evaluate(FISH, [lat, lon, out])
            if f.get('err'): check(False, name + ': a place', f); continue
            c = (f['byc'] or {}).get('nsjo') or {}
            check(f['zone'] == 'nsjo' and not f['block'] and f['v'] == 'ok' and 'nsjo:ok' in f['keys'] and '3 tonn' in f['text'], name + ': the North Sea, the jig is not stopped, the rule says 3 tonnes and what is left, no yellow', f)
            check(f['kg'] > 5 and abs(c.get('kg', 0) - f['kg']) <= 2 and abs(c.get('cod', 0) - f['cod']) <= 1 and f['told'] == 0 and 'nsjo3' not in f['kv'], name + ': she fishes, the hold counts the catch and its cod in the North Sea, no word and no remark', f)
            l = await pg.evaluate(LAND)
            check(l['sConf'] == 0 and l['codConf'] == 0 and 'Nordsjøen' not in l['warn'] and abs(l['dq']['nsjo'] - f['cod']) <= 1 and l['dq']['torsk'] == 0 and l['byc'] is None, name + ': landed with room on the cap: nothing taken, the cod counted on the North Sea\'s 3 tonnes and not on the quota north of 62° N', l)

        # ---- the cap full: 300 kg of saithe and 100 kg of cod, 15 % of 400 is 60, so 40 kg is over. Both formats, with the pictures
        for tag, w, h in [('liggende', 1280, 800), ('staaende', 800, 1280)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
            s = await pg.evaluate(SCENE, [60.39, 5.0, True, 300, 100, {'nsjo': 3000}])
            check(abs(s['conf'] - 40) < 0.01 and 'nsjo3' in s['kv'] and 'nsjoby:warn' in s['keys'], tag + ': Bergen with the cap full: the rule is yellow (bycatch only), the coast guard remarks on the 40 kg over', s)
            await pg.evaluate("toastClear(); PHONE.open('lever')"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=os.path.join(OUT, 'sor62-kaia-' + tag + '.png'))
            t1 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            n0 = await pg.evaluate("S.msgs.length")
            await pg.evaluate("sell(); PHONE.render()"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=os.path.join(OUT, 'sor62-seddel-' + tag + '.png'))
            t2 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            m = await pg.evaluate("n0 => S.msgs.slice(n0).filter(x => x.from === 'Norges Råfisklag' && /Nordsjøen/.test(x.no)).length", n0)
            check('Nordsjøen' in t1 and '40 kg' in t1 and '15 %' in t1 and '20 %' in t1, tag + ': the quay says 40 kg over the 3 tonnes (15 % bycatch) before «Lever», and the 20 % compensation')
            check('over 3 tonn i Nordsjøen' in t2 and 'Vederlag for ilandføring' in t2 and m == 1, tag + ': the landing note has the row «Inndratt: torsk over 3 tonn i Nordsjøen», the compensation, and Råfisklaget writes')
            await pg.evaluate("PHONE.show(false)")
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        # a vessel without access: bycatch only from the first kilo
        n = await pg.evaluate("(() => { const C = sorConf({nsjo:{kg:400, cod:100}}, 100, {}, 'none'); return +C.kg.toFixed(1); })()")
        check(n == 40, 'a vessel without access in the North Sea: 15 % bycatch only (40 kg of 100 over)', n)

        # ---- the spawning areas on the game's first day (1 March) and later; the nursery areas from 1 July
        for name, lid, per in [('Egersundbanken', 18, 92), ('Revet', 18, 31), ('Vestbanken', 18, 31), ('Stanhope', 18, 92), ('Coral', 18, 31)]:
            a = await pg.evaluate(AREA, [lid, name, 0, 'juksa']); b = await pg.evaluate(AREA, [lid, name, per, 'juksa'])
            if a.get('err'): check(False, name + ': a point in Norway\'s zone', a); continue
            closed = name != 'Coral'   # (Coral edge closes on the last of February: open on the game's first day)
            check(('gyte18:no' in a['keys']) == closed and bool(a['block']) == closed and 'gyte18:no' not in b['keys'], name + (': closed to all fishing on ' if closed else ': open on ') + a['date'] + ', open on ' + b['date'], {'ll': a['ll'], 'block': a['block']})
        e = await pg.evaluate(AREA, [18, 'Egersundbanken', 0, 'juksa'])
        st = await pg.evaluate("""(async p => { await mapNeed(p, MAPD.simR); const b = S.boat; S.hold = []; delete b.byc; S.fsess = null; S.plan = null; b.port = null; b.pos = {x:p.x, y:p.y}; S.ruAt = null;
          b.status = 'fishing'; b.deckStop = false; b.fishUntil = S.t + 60; for (let k = 0; k < 60 && b.status === 'fishing'; k++){ S.t += 1; fish(S.t / 60, 3, 0.3); }
          return {kg:Math.round(S.hold.reduce((s, x) => s + x.kg, 0)), st:b.status, log:S.log.slice(-1).map(l => l.no || l[1] || String(l))}; })""", e['p'])
        check(st['kg'] == 0, 'Egersundbanken on 1 March: the jig takes nothing, the boat waits with the reason', st)
        for name in ['Egersundbanken', 'Midtbanken', 'Lille Fiskebank']:
            a = await pg.evaluate(AREA, [19, name, 150, 'line']); j = await pg.evaluate(AREA, [19, name, 150, 'juksa']); g = await pg.evaluate(AREA, [19, name, 150, 'garn']); b = await pg.evaluate(AREA, [19, name, 100, 'line'])
            check('opp19:no' in a['keys'] and bool(a['block']) and not j['block'] and not g['block'] and 'opp19g:warn' in g['keys'] and 'opp19:no' not in b['keys'], name + ' (nursery area): line stopped on ' + a['date'] + ', jig and nets not, open to line on ' + b['date'], {'ll': a['ll'], 'block': a['block']})

        # ---- Kristiansand on 1 June with blad B: the exception's 3 tonnes
        await pg.evaluate("(() => { S.t += 92 * 1440; S.fm = {...(S.fm || {}), b:true}; S.ruAt = null; })()")
        for tag, w, h in [('liggende', 1280, 800), ('staaende', 800, 1280)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
            s = await pg.evaluate(SCENE, [58.140, 7.996, True, 100, 300, {'skag4': 2900}])
            d = await pg.evaluate("dayStr(S.t / 60)")
            # 300 kg cod of 400: 100 on the cap, 5 % of 400 = 20 as bycatch, 180 over
            check(abs(s['conf'] - 180) < 0.01 and 'skag3' in s['kv'] and (s['byc'] or {}).get('skag4', {}).get('cod') == 300, tag + ': Kristiansand ' + d + ' with blad B and 100 kg left of the 3 tonnes: 300 kg of cod jigged, 180 kg over (100 on the cap, 20 as bycatch)', s)
            await pg.evaluate("toastClear(); PHONE.open('lever')"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=os.path.join(OUT, 'sor62-skag-kaia-' + tag + '.png'))
            t1 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            await pg.evaluate("sell(); PHONE.render()"); await pg.wait_for_timeout(2500)
            await pg.screenshot(path=os.path.join(OUT, 'sor62-skag-seddel-' + tag + '.png'))
            t2 = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            q = await pg.evaluate("Math.round(quotaState().skag4)")
            check('Skagerrak' in t1 and '180 kg' in t1 and 'over 3 tonn med juksa i Skagerrak' in t2 and q == 3000, tag + ': the quay says 180 kg, the note has the row, and the cap is counted full (3 000 kg)', q)
            await pg.evaluate("PHONE.show(false)")
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        f = await pg.evaluate(FISH, [58.140, 7.996, True])
        check(f.get('zone') == 'skag' and 'skag5:warn' in f.get('keys', []), 'Kristiansand with the 3 tonnes taken: the exception is over, the cod is a bycatch again (5 %)', f)
        await pg.evaluate("(() => { quotaState().skag4 = 0; S.hold = []; delete S.boat.byc; S.ruAt = null; })()")
        f = await pg.evaluate(FISH, [58.140, 7.996, True])
        c = (f.get('byc') or {}).get('skag4') or {}
        check(f.get('zone') == 'skag4' and 'skag4:warn' in f.get('keys', []) and '3,0 tonn igjen' in f.get('text', '').replace('3.0', '3,0') and abs(c.get('cod', -9) - f.get('cod', 0)) <= 1 and 'skagby' not in f.get('kv', []), 'Kristiansand with nothing landed on it: the exception, the rule says 3 tonnes left, the cod is counted on the cap, no bycatch remark', f)
        l = await pg.evaluate(LAND)
        check(l['sConf'] == 0 and l['zConf'] == 0 and abs(l['dq']['skag4'] - f['cod']) <= 1, 'Kristiansand: landed under the exception: nothing taken, the cod counted on the 3 tonnes', l)

        # ---- the follow-up: the word in the catch with the North Sea's cap full, the Kvote app, the free cod inside the baseline on Sørlandet
        await pg.evaluate("(() => { const q = quotaState(); q.nsjo = 3000; q.skag4 = 0; S.hold = []; delete S.boat.byc; S.ruAt = null; S.sorWarn = null; })()")
        f = await pg.evaluate(FISH, [58.438, 5.979, True])
        t = await pg.evaluate("S.msgs.filter(m => m.from === 'Regler' && /Nordsjøen/.test(m.no)).slice(-1).map(m => m.no)[0] || ''")
        over = f.get('cod', 0) > 0.15 * f.get('kg', 0) + 1 and f.get('kg', 0) >= 20
        check((f.get('told') == 1 and '15 %' in t and '§ 5' in t) if over else f.get('told') == 0, 'Egersund with the 3 tonnes fished' + (': over 15 % cod in the catch, the game says so once, with the paragraph' if over else ': at most 15 % cod, no word'), {'kg': f.get('kg'), 'cod': f.get('cod'), 'text': t[:160]})
        check('nsjoby:warn' in f.get('keys', []) and 'nsjo3' in f.get('kv', []) if over else True, 'Egersund with the 3 tonnes fished: yellow, and the coast guard remarks on the cod over', f.get('kv'))
        lg = await pg.evaluate("S.log.filter(l => /Maksimalkvoten på 3 tonn torsk i Nordsjøen er full/.test(l.no || l[1] || '')).length")
        check(lg == 1, 'the log says once that the North Sea quota is full', lg)
        await pg.evaluate("(() => { quotaState().nsjo = 1240; S.hold = []; delete S.boat.byc; const pt = PORTS.filter(q => q.mottak).sort((x, y) => dist(x.p, S.boat.pos) - dist(y.p, S.boat.pos))[0]; S.boat.status = 'port'; S.boat.port = pt.id; S.boat.pos = {...pt.p}; })()")
        for tag, w, h in [('liggende', 1280, 800), ('staaende', 800, 1280)]:
            await pg.set_viewport_size({'width': w, 'height': h}); await pg.wait_for_timeout(300)
            await pg.evaluate("toastClear(); PHONE.open('kvote')"); await pg.wait_for_timeout(700)
            await pg.evaluate("(() => { const e = [...document.querySelectorAll('.ph-card h4')].find(x => /sør for 62/.test(x.textContent)); if (e) e.scrollIntoView({block:'start'}); })()"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=os.path.join(OUT, 'sor62-kvote-' + tag + '.png'))
            tx = await pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ')")
            check('Torsk sør for 62° N' in tx and '1 240 kg' in tx.replace('\u00a0', ' ') and '1 760 kg' in tx.replace('\u00a0', ' '), tag + ': the Kvote app has the card with what is landed (1 240 kg) and what is left (1 760 kg) of the North Sea\'s 3 tonnes')
            await pg.evaluate("PHONE.show(false)")
        await pg.set_viewport_size({'width': 1280, 'height': 800})
        await pg.evaluate("(() => { S.hold = []; delete S.boat.byc; S.ruAt = null; })()")
        f = await pg.evaluate(FISH, [58.140, 7.996, False])
        c = (f.get('byc') or {}).get('sorfri') or {}
        check(f.get('zone') == 'sorfri' and f.get('inBL') and abs(c.get('cod', -9) - f.get('cod', 0)) <= 1 and f.get('told') == 0 and not any(k.startswith(('nsjo', 'skag')) for k in f.get('keys', [])), 'Kristiansand inside the baseline: no quota there, the cod is counted as free, no rule and no word', f)
        l = await pg.evaluate(LAND)
        check(l['sConf'] == 0 and l['zConf'] == 0 and l['codConf'] == 0 and l['dq']['torsk'] == 0 and l['dq']['nsjo'] == 0, 'Kristiansand inside the baseline: landed, nothing taken, and not counted on the quota north of 62° N or on a cap', l)
        # nets of 156 mm in a nursery area: stopped where the string is set (10-gear.js passes the string's mesh)
        g = await pg.evaluate("""(([a, b]) => { S.pgear.nets = [{id:'t156', mesh:156, ty:'bunn', n:5, cond:1}, {id:'t180', mesh:180, ty:'bunn', n:5, cond:1}]; const H = S.t / 60 + 60 * 24;
          const q = m => ruBlockMsg({p:a, H, len:BOAT.len, gear:'garn', sp:null, mesh:m}); return {date:dayStr(H), m156:q(156), m180:q(180), none:ruBlockMsg({p:a, H, len:BOAT.len, gear:'garn', sp:null})}; })""", [(await pg.evaluate(AREA, [19, 'Midtbanken', 0, 'garn']))['p'], 0])
        check(bool(g['m156']) and '156 mm' in g['m156'] and not g['m180'] and bool(g['none']), 'Midtbanken ' + g['date'] + ': a string of 156 mm nets is stopped, 180 mm is not; with both aboard and no string named, the smallest decides', g)
        await pg.evaluate("S.pgear.nets = []")

        # ---- north of 62° N: nothing of this
        f = await pg.evaluate(FISH, [69.65, 18.96, False])
        check(f.get('zone') is None and not any(k.startswith(('nsjo', 'skag', 'gyte18', 'opp19')) for k in f.get('keys', [])) and not f.get('byc'), 'Tromsø: no zone, no count, none of the rules', f)
        print('errors:', errs[:5])
        await br.close()

asyncio.run(main())
