"""Driftsplan 2's page (ui/05d-plan2.js, part 5 of docs/planer/driftsplan-2/02-design.md): with DRIFT2 on, the Drift app shows the day first
(«I dag» as the engine follows it, else the next day as planDay reckons it), then the answers as rows (Hjem, Redskap, Plasser, Levering, Vær,
Rytme, Mannskap), then the statistics. A new plan comes filled in; rows open where they are tapped; places come from the own marks; the
plan is started (made first), paused, and a stopped plan shows the button that fixes it; the gear in the sea gets «Hent redskapet» while
the plan is off; the plan is copied to another vessel. Screenshots of the page in 800×1280, 1280×800 and 384×853 go to tests/out/."""
from _env import GAME, boot
import asyncio, json, os
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')

JS = """(async () => {
  const R = {}; S.tut = 0; S.settings.lang = 'no'; S.lang = 'no'; DRIFT2 = true; window.confirm = () => true;
  const b = S.boat, HP = portById('husoy'); b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; S.plan = null; S.ops = null; S.draft = []; S.me = S.cur; S.cash = 500000;
  const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole Mikalsen', known:[true, true]}), per = Object.assign(genCrew(), {bi:false, off:false, name:'Per Hansen', known:[true, true]}); S.crew = [ole, per];
  await mapNeed(HP.p, 14);
  const sea = []; for (let r = 2.5; r < 12 && sea.length < 3; r += 0.5) for (let a = 0; a < 24 && sea.length < 3; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && sea.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null})) sea.push(q); } catch (e){} }
  S.marks.push({x:sea[0].x, y:sea[0].y, t:S.t - 300, kgph:52, q:1}, {x:sea[2].x, y:sea[2].y, t:S.t - 400, kgph:30, q:1});
  const page = () => PHONE.page('drift'), act = (a, d) => PHONE.dact('drift', a, d || {});
  R.intro = page().includes('p2-new') && !page().includes('dr-new');
  // a new plan comes filled in: home where the crew sleep well, the rig she has, the best catch mark as the jig place
  act('p2-new'); const o = S.ops; R.fresh = {v:o.v, home:o.home, rest:plan2RestOk(o.home), rig:o.rig, places:o.places.map(q => q.k)};
  const p1 = page(); R.rows = ['Hjem', 'Redskap', 'Plasser', 'Levering', 'Vær', 'Rytme', 'Mannskap'].every(k => p1.includes('>' + k + '<'));
  R.dayCard = /I morgen|Neste dag|I dag/.test(p1) && p1.includes('dr-pv') && /Går fra/.test(p1) && /Hjem til/.test(p1);   // (a jig day that lands when the hold is full has no landing line before the catch is in)
  // the rows open and shut where they are tapped
  act('p2-row', {k:'home'}); R.homeOpen = page().includes('data-pa="p2-home"'); act('p2-row', {k:'home'}); R.homeShut = !page().includes('data-pa="p2-home"');
  // the weather: the numbers and the presets; the rhythm: round the clock locked with two hands, the hour out
  act('p2-row', {k:'wx'}); act('p2-wx-preset', {v:'safe'}); R.wx1 = {...o.wx}; act('p2-wx-w', {d:'1'}); act('p2-wx-h', {d:'1'}); R.wx2 = {...o.wx};
  act('p2-row', {k:'rhythm'}); R.watchOff = /data-v="watch" disabled/.test(page()); act('p2-dep', {d:'1'}); act('p2-dep', {d:'1'}); R.dep = o.dep;
  // a jig place from the suggestions (the own marks), its order, and one removed
  act('p2-row', {k:'places'}); act('p2-add', {k:'juks'}); const p2 = page(); R.sugg = p2.includes('Fangstplass'); act('p2-addp', {i:'0'}); R.places2 = o.places.length;
  const q0 = o.places[0].id; act('p2-pdn', {i:'0'}); R.order = o.places[1].id === q0; act('p2-pdel', {id:o.places[1].id}); R.places3 = o.places.length;
  // a line rig: the fields, their units and soak, and the line's bait at home
  S.equip.linehaler = true; S.pgear.kits.n = 6; const LN = S.pgear.lines.hyse; LN.n = 4; LN.baited = 4; LN.bt = {makrell:4}; S.pgear.bait = {makrell:40};
  act('p2-row', {k:'rig'}); act('p2-rig', {g:'line'}); R.rig = o.rig; act('p2-jig', {v:'1'});
  act('p2-row', {k:'places'}); act('p2-add', {k:'felt'}); R.suggF = page().includes('p2-addp'); R.sugg0 = PLAN2UI.put(o, 'felt', sea[1]); const f = o.places.find(q => q.k === 'felt'); R.field = f && {n:f.n, soak:f.soak};
  act('p2-pn', {id:f.id, d:'-1'}); act('p2-ps', {id:f.id, d:'1'}); R.field2 = {n:f.n, soak:f.soak};
  // land is refused
  let land = null; for (let r = 0.2; r < 3 && !land; r += 0.1) for (let a = 0; a < 24 && !land; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (isLand(q) && !inHarbour(q)) land = q; } catch (e){} }
  R.landRefused = !!land && !PLAN2UI.put(o, 'felt', land);
  // the landing: a plant chosen, and the rule
  act('p2-row', {k:'land'}); const p5 = page(); R.landRows = p5.includes('Nærmeste mottak') && p5.includes('Når lasten er full') && p5.includes('Hver tur'); act('p2-land-when', {v:'days'}); act('p2-land-days', {d:'1'}); R.land = {...o.land}; act('p2-land-when', {v:'trip'});
  // without you aboard the plan waits for a skipper and a mate
  S.me = 'nobody'; const p6 = page(); R.notReady = p6.includes('Ikke klar ennå') && /skipper og en styrmann|skipper og styrmann/.test(p6);
  setSkipper(ole.id); setMate(per.id); R.ready = !page().includes('Ikke klar ennå');
  // Start: the plan is made (the plant, the legs), then on; «Nå» and «I dag» are shown
  act('p2-start'); for (let k = 0; k < 300 && !o.on; k++) await new Promise(r => setTimeout(r, 100)); R.on = o.on; R.M = o.M; R.made = plan2Made(o); R.err = o.err;
  for (let i = 0; i < 60; i++){ DYN.on = false; step(); }
  R.after60 = {t:driftClock(driftHod(S.t / 60)), status:S.boat.status, port:S.boat.port, i:o.run && o.run.i, wait:o.run && o.run.wait && o.run.wait.no, sets:mySets().length, opsK:S.plan && S.plan.opsK, steps:o.run && o.run.day && o.run.day.steps.map(s => s.k + (s.t != null ? '@' + driftClock(driftHod(s.t)) : '')), log:S.log.slice(-6).map(e => e.no)};
  const p3 = page(); R.now = p3.includes('Nå:'); R.today = p3.includes('I dag') && p3.includes(' ←'); R.landVal = p3.includes(portById(o.M).name);
  R.line = PLAN2UI.line().includes('Driftsplan');
  // pause; the gear in the sea while the plan is off gets «Hent redskapet»
  act('p2-pause'); R.paused = !o.on && !o.stop;
  // the line stands in the sea (set at 06:15): «Hent redskapet» goes out, hauls it whatever the soak, lands and switches the plan off
  const p7 = page(); R.fetchBtn = mySets().length >= 1 && p7.includes('p2-fetch') && /har stått/.test(p7);
  const gl0 = (S.gearLog || []).length; act('p2-fetch'); R.fetchOn = o.on && !!o.fetch; let fm = 0; const tr = [], stt = () => { const r = o.run, pl = S.plan; return (pl ? (pl.ops ? pl.opsK : 'own') : '-') + ':' + S.boat.status + (S.boat.port ? '@' + S.boat.port : '') + (S.boat.gop ? '/' + S.boat.gop.op : '') + (S.boat.land ? '/land' : '') + (r && r.day ? '#' + r.i + (r.day.steps[r.i] ? r.day.steps[r.i].k : '') : '') + (r && r.wait ? '?' + r.wait.k : '') + (S.boat.landWait ? '/lw' : ''); }; let was = null;
  for (; fm < 1440 && o.on; fm++){ DYN.on = false; step(); const x = stt(); if (x !== was){ tr.push(driftClock(driftHod(S.t / 60)) + ' ' + x + ' h' + Math.round(holdTotal())); was = x; } } R.fetchTrace = tr.slice(0, 40); R.fetchDay = o.run && o.run.day ? o.run.day.steps.map(s => s.k) : null;
  R.fetched = {sets:mySets().length, on:o.on, fetch:o.fetch, min:fm, trips:o.stats.sum.trips, kg:o.stats.sum.kg, newSets:(S.gearLog || []).slice(gl0).filter(e => e.tSet > S.t - fm).length, port:S.boat.port, said:S.msgs.slice(-1).map(m => m.no).join('')};
  // a stopped plan: the reason and the button that fixes it
  o.stop = {t:S.t, k:'closed', no:'Felt 1 er stengt (test).', en:'Field 1 is closed (test).', fix:'places'}; const p4 = page(); R.stopShown = p4.includes('Stoppet: Felt 1 er stengt') && p4.includes('p2-fix');
  act('p2-fix'); R.fixOpens = page().includes('p2-pn'); o.stop = null;
  // the statistics with a landing in it
  o.stats.days.push({d:gDate(S.t / 60).toISOString().slice(0, 10), trips:1, kg:312, kr:5400, lott:1800, cost:600, conf:0, sp:{torsk:280, hyse:32}, port:{[o.M]:312}}); const p8 = page(); R.stats = p8.includes('p2-stat') && /Torsk \d+ %/.test(p8) && p8.includes(portById(o.M).name + ' ') && p8.includes(fmt(Math.round(o.stats.days.reduce((a, d) => a + d.kg, 0))) + ' kg');
  // copy to another vessel
  const v2 = newVesselObj('sjark', 'husoy'); act('p2-copy', {id:v2.id}); const o2 = vget(v2, 'ops'); R.copy = !!o2 && o2.v === 4 && o2.places.length === o.places.length && !o2.on && o2.places[0].id !== o.places[0].id;
  S.me = S.cur; o.on = true; return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(JS)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['intro'] and r['fresh']['v'] == 4 and r['fresh']['rest'] and r['fresh']['places'] == ['juks']), 'a new plan comes filled in: home where the crew sleep well, the rig she has, the best catch mark as the jig place', r['fresh'])
        print(ok(r['rows'] and r['dayCard']), 'the day first, then the seven rows', [r['rows'], r['dayCard']])
        print(ok(r['homeOpen'] and r['homeShut']), 'a row opens and shuts where it is tapped')
        print(ok(r['wx1'] == {'wind': 10, 'hs': 1.5} and r['wx2'] == {'wind': 11, 'hs': 2.0} and r['watchOff'] and r['dep'] == 6), 'the weather as numbers with presets, round the clock locked with two hands, the hour out', [r['wx1'], r['wx2'], r['watchOff'], r['dep']])
        print(ok(r['sugg'] and r['places2'] == 2 and r['order'] and r['places3'] == 1), 'a jig place from the own marks; the order; one removed', [r['sugg'], r['places2'], r['order'], r['places3']])
        print(ok(r['rig'] == 'line' and r['sugg0'] and r['field'] and r['field2']['n'] == r['field']['n'] - 1 and r['field2']['soak'] == r['field']['soak'] + 1 and r['landRefused']), 'a line field, its units and soak; land is refused', [r['rig'], r['field'], r['field2'], r['landRefused']])
        print(ok(r['landRows'] and r['land']['when'] == 'days' and r['land']['days'] == 3), 'the landing: where and when', [r['landRows'], r['land']])
        print(ok(r['notReady'] and r['ready']), 'without you aboard the plan waits for a skipper and a mate', [r['notReady'], r['ready']])
        print(ok(r['on'] and r['made'] and r['M'] and r['now'] and r['today'] and r['landVal'] and r['line']), 'Start makes the plan and switches it on; «Nå», «I dag» with the step she is on, and the plant are shown', [r['on'], r['M'], r['err'], r['now'], r['today'], r['landVal']])
        print(ok(r['paused'] and r['fetchBtn'] and r['stopShown'] and r['fixOpens']), 'pause; the gear in the sea gets «Hent redskapet»; a stopped plan shows the reason and the button that fixes it', [r['paused'], r['fetchBtn'], r['stopShown'], r['fixOpens']])
        f = r['fetched']; fok = r['after60']['sets'] >= 1 and r['fetchOn'] and f['sets'] == 0 and not f['on'] and not f['fetch'] and f['trips'] >= 1 and f['newSets'] == 0 and 'hentet' in f['said']
        print(ok(fok), '«Hent redskapet» hauls the line whatever the soak, lands, sets nothing again and switches the plan off', f)
        if not fok: print('  dagen:', r.get('fetchDay')); [print('  ', x) for x in r.get('fetchTrace', [])]
        print(ok(r['stats']), 'the statistics: today, seven days and all, with the species')
        print(ok(r['copy']), 'the plan is copied to another vessel, off, with its own places')
        # the page in both formats and on a phone: the plan on (the day card and «Nå»), and with the places open
        for w, h in [(800, 1280), (1280, 800), (384, 853)]:
            await pg.set_viewport_size({'width': w, 'height': h})
            await pg.evaluate("DOCK.open('drift')"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=os.path.join(OUT, 'driftsplan2ui-%dx%d.png' % (w, h)))
            await pg.evaluate("PHONE.dact('drift', 'p2-row', {k:'places'}); DOCK.open('drift')"); await pg.wait_for_timeout(500)
            await pg.evaluate("(() => { const e = document.querySelector('.dr-row.on'); if (!e) return; let d = e.parentElement; while (d && d !== document.body && !(d.scrollHeight > d.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(d).overflowY))) d = d.parentElement; if (d) d.scrollTop = e.getBoundingClientRect().top - d.getBoundingClientRect().top + d.scrollTop - 8; })()"); await pg.wait_for_timeout(400)
            await pg.screenshot(path=os.path.join(OUT, 'driftsplan2ui-%dx%d-plasser.png' % (w, h)))
            ov = await pg.evaluate("(() => { const d = document.getElementById('drawerBody'); return {w:d.scrollWidth, cw:d.clientWidth}; })()")
            print(ok(ov['cw'] > 0 and ov['w'] <= ov['cw'] + 1), 'no sideways overflow at %d px' % w, ov)
            await pg.evaluate("PHONE.dact('drift', 'p2-row', {k:'places'}); DOCK.close()")
        print('sidefeil:', errs[:4]); await b.close()
asyncio.run(main())
