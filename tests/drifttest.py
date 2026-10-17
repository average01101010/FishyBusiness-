"""Drift, the operations plan v2 (core/06d-drift.js): an old plan becomes one session; the check (the plan must close, one gear type,
no overlap); two trips a day with a landing after each; a trip is held back by the plan's own wind limit; the plan pauses after three
failed attempts; a template keeps a plan."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(async () => {
  const R = {}; S.tut = 0;
  let t0 = null; for (let d = 0; d < 120 && t0 == null; d++){ const H0 = (Date.UTC(2028, 4, 1 + d, 4) - EPOCH) / 3.6e6; let good = true; for (let k = 0; k <= 30; k++) if (windAt(H0 + k) > 9 || hsOpen(H0 + k) > 1.6) good = false; if (good) t0 = H0; }
  R.t0 = t0; if (t0 == null) return R;
  S.t = Math.round(t0 * 60); S.cash = 5e6; S.stock = initStock(); S.quota = null; S.settings.autoW = 14;
  const HP = portById('husoy'), W = q => ({x:q.x, y:q.y, port:null, fish:0});
  const rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0].slice(1).map(q => ({x:q[0], y:q[1]}));
  const wps = exitWps(HP, rt[0]).map(W).concat(rt.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === rt.length - 1 ? 1 : 0}))); rt.slice(0, -1).reverse().forEach(q => wps.push(W(q)));
  entryWps(HP, rt[0]).forEach(q => wps.push(W(q))); wps.push({x:HP.p.x, y:HP.p.y, port:'husoy', fish:0});
  const b = S.boat; S.plan = null; b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; b.fuel = 90; b.gear = true; b.kgear = true; b.land = b.shift = b.fueling = null; S.hold = []; S.target = 'mix';
  const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole Mikalsen'}); S.crew = [ole]; S.me = 'nobody';
  // 1. an old plan becomes a plan of one session
  S.ops = {on:false, dep:5, days:[1, 1, 1, 1, 1, 1, 1], maxWind:15, skipper:ole.id, last:-1, wps, speed:16, home:'husoy', end:'husoy', hours:6};
  const o = driftOps(); R.up = {v:o.v, sess:o.sess.length, dep:o.sess[0].dep, wind:o.wx.wind, rig:o.rig, home:o.sess[0].route.home, end:o.sess[0].route.end};
  // 2. the check
  const hrs = driftSessHours(o, o.sess[0]); R.hrs = Math.round(hrs * 10) / 10;
  R.c1 = driftCheck(o); R.c1ok = R.c1.ok; R.c1err = R.c1.errors.length;
  const mk = (dep, home, end) => ({id:driftSid(), type:'tur', dep, route:{wps:wps.map(w => ({...w})), speed:16, home, end, hours:hrs}});
  o.sess.push(mk(5 + hrs + 2, 'husoy', 'senjahopen')); const c2 = driftCheck(o); R.openErr = c2.errors.some(e => /Planen ender i|må ende der/.test(e)) ; 
  o.sess[1].route.end = 'husoy'; o.sess[1].dep = 5 + hrs - 1; const c3 = driftCheck(o); R.overlapErr = c3.errors.some(e => /før forrige tur er ferdig/.test(e));
  o.sess[1].dep = 5 + hrs + 2; const c4 = driftCheck(o); R.twoOk = c4.ok; R.trips = c4.trips; R.work = Math.round(c4.work * 10) / 10; R.restMin = Math.round(c4.restMin * 10) / 10;
  o.rig = 'garn'; o.sess[0].route.wps.push({x:wps[3].x, y:wps[3].y, port:null, fish:0, act:{op:'cycle', kind:'line'}}); const c5 = driftCheck(o); R.mixErr = c5.errors.some(e => /Bare én type utstyr/.test(e));
  o.rig = 'juksa'; o.sess[0].route.wps.pop(); R.soon = (() => { o.rig = 'bunntral'; const c = driftCheck(o); o.rig = 'juksa'; return c.errors.some(e => /havsteget/.test(e)); })();
  // soak: two rounds of nets close together warn that the soak is short, far apart it is fine
  { const st = (kind) => ({x:wps[3].x, y:wps[3].y, port:null, fish:0, act:{op:'cycle', kind}}); const o2 = driftNew({rig:'garn'}); o2.sess = [mk(5, 'husoy', 'husoy'), mk(8, 'husoy', 'husoy')]; o2.sess.forEach(q => q.route.wps.splice(3, 0, st('garn')));
    const w = driftCheck(o2); R.soakShort = w.soak.length === 2 && w.soak[0].h === 3 && w.warnings.some(x => /Ståtiden er bare 3 t/.test(x)); o2.sess[1].dep = 17; const w2 = driftCheck(o2); R.soakOk = w2.soak[0].h === 12 && !w2.warnings.some(x => /Ståtiden/.test(x)); }
  // crew system: round the clock 2 + 2 needs four hands, a mate and bunks for the watch off; the watch off sleeps and is off deck
  { const vt = Object.keys(VESSELS).find(k => VESSELS[k].crewMax >= 4 && VESSELS[k].berths >= 2), keep = {type:b.type, crew:S.crew, plan:S.plan, status:b.status};
    b.type = vt; applyVessel(); const mk4 = () => Object.assign(genCrew(), {bi:false, off:false}); S.crew = [mk4(), mk4(), mk4(), mk4()];
    const o3 = driftNew({crewMode:'watch', skipper:S.crew[0].id, mate:S.crew[1].id}); o3.sess = [mk(5, 'husoy', 'husoy')]; const c3 = driftCheck(o3); R.watchOk = !c3.errors.some(e => /Døgndrift|styrmann|køyer/.test(e)) && c3.watch && c3.watch.on === 6;
    const R3 = driftRoles(o3); R.roles = R3.A.length === 2 && R3.B.length === 2 && R3.A[0] === S.crew[0] && R3.B[0] === S.crew[1];
    S.crew = S.crew.slice(0, 3); R.few = driftCheck(o3).errors.some(e => /krever fire mann/.test(e)); S.crew = [mk4(), mk4(), mk4(), mk4()]; o3.skipper = S.crew[0].id; o3.mate = S.crew[1].id; S.ops = o3;
    S.plan = {ops:true, wps:[], idx:0}; b.status = 'sailing'; const H6 = Math.floor(S.t / 60 / 24) * 24 + 7;   // 07:00 and 13:00: A on, then B on
    driftWatch(H6); const a1 = S.crew.filter(c => c.sleepW).map(c => S.crew.indexOf(c)).join(''); R.onDeck = crewAboard(H6).length; R.allAboard = crewAboard(H6, true).length;
    driftWatch(H6 + 6); const a2 = S.crew.filter(c => c.sleepW).map(c => S.crew.indexOf(c)).join(''); R.watch = [a1, a2];
    b.status = 'port'; driftWatch(H6); R.upAtQuay = !S.crew.some(c => c.sleepW);
    o3.crewMode = 'day'; b.status = 'sailing'; driftWatch(H6); R.dayAllUp = !S.crew.some(c => c.sleepW);
    b.type = keep.type; applyVessel(); S.crew = keep.crew; S.plan = keep.plan; b.status = keep.status; S.ops = o; }
  // 3. two trips a day, each with a landing: calm day, 05:00 and the second one
  o.on = true; o.a0 = null; o.fails = 0; o.hold = 0;
  const landed = [], m0 = S.msgs.length, trips0 = S.stats.trips; let outs = 0, wasPort = true;
  for (let i = 0; i < 22 * 60; i++){ step();
    if (b.status !== 'port' && wasPort){ outs++; for (const [sp, kg] of [['torsk', 80]]) S.hold.push({sp, cls:SPECIES[sp].ref, kg, n:1, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}); }
    wasPort = b.status === 'port'; }
  R.outs = outs; R.reps = o.rep.length; R.repKg = o.rep.map(r => r.kg); R.status = b.status; R.sales = S.sales.length; R.idx = o.idx; R.cn = o.cn;
  R.msgs = S.msgs.slice(m0).filter(m => /Driftsrapport/.test(m.no || '')).length;
  // 4. the plan's own wind limit holds a trip back
  o.wx.wind = 2; o.a0 = null; o.idx = 0; o.cn = 0; o.rep = []; o.hold = 0; o.delay = 0; S.t += Math.round(((4 - driftHod(S.t / 60) + 24) % 24) * 60); b.status = 'port'; b.port = 'husoy'; S.plan = null;
  const sBefore = S.stats.trips; for (let i = 0; i < 5 * 60; i++) step(); R.heldBack = S.stats.trips === sBefore && b.status === 'port'; R.stayMsg = S.msgs.slice(-12).some(m => /Blir på land/.test(m.no || ''));
  // 5. three failed attempts pause the plan
  o.wx.wind = 15; o.hold = 0; o.delay = 0; o.fails = 0; o.skipper = null; S.crew = []; S.me = 'nobody'; o.on = true; o.a0 = null; o.idx = 0; o.cn = 0; S.t += Math.round(((4 - driftHod(S.t / 60) + 24) % 24) * 60); b.status = 'port'; b.port = 'husoy'; S.plan = null;
  for (let i = 0; i < 12 * 60; i++) step(); R.paused = !o.on && !!o.paused; R.fails = o.fails; R.dbg = {on:o.on, st:b.status, busy:portBusy(b), plan:!!S.plan, hold:o.hold, H:S.t / 60, due:o.a0 != null ? driftDue(o) : null, idx:o.idx, jobs:S.jobs && S.jobs.length, land:!!b.land, shift:!!b.shift, wait:b.landWait, hod:driftHod(S.t / 60)};
  // 6. templates
  S.crew = [ole]; o.on = false; o.name = 'Tomtur'; driftTplSave('Tomtur'); const tpl = (S.driftTpl || []).length; S.ops = null; driftTplUse(0); R.tpl = {n:tpl, sess:S.ops.sess.length, name:S.ops.name, on:S.ops.on};
  S.me = S.cur; S.ops = null; return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(600000)
        r = await pg.evaluate(JS)
        r.pop('c1', None); print(json.dumps(r, ensure_ascii=False))
        up = r['up']
        print(ok(up['v'] == 2 and up['sess'] == 1 and up['dep'] == 5 and up['wind'] == 15 and up['home'] == 'husoy' and up['end'] == 'husoy'), 'gammel plan blir én økt')
        print(ok(r['c1ok']), 'enkel plan godkjennes', r.get('c1err'))
        print(ok(r['openErr']), 'plan som ikke ender der den begynner avvises')
        print(ok(r['overlapErr']), 'overlappende turer avvises')
        print(ok(r['twoOk'] and r['trips'] == 2), 'to turer i døgnet godkjennes', r.get('restMin'))
        print(ok(r['mixErr']), 'to typer utstyr avvises')
        print(ok(r['watchOk'] and r['roles'] and r['few']), 'døgndrift 2+2 godkjennes med fire mann, styrmann og køyer, ellers ikke')
        print(ok(r['onDeck'] == 2 and r['allAboard'] == 4 and r['watch'][0] != r['watch'][1] and len(r['watch'][0]) == 2 and len(r['watch'][1]) == 2), 'vaktene bytter: to på dekk, to sover, alle er mannskap')
        print(ok(r['upAtQuay'] and r['dayAllUp']), 'ved kai og i dagdrift er alle oppe')
        print(ok(r['soakShort'] and r['soakOk']), 'ståtid regnes mellom rundene, og for kort ståtid advares')
        print(ok(r['soon']), 'trål/not/snurrevad kan ikke settes opp ennå')
        print(ok(r['outs'] == 2 and r['reps'] == 2 and r['msgs'] == 2 and r['status'] == 'port'), 'to turer med levering etter hver')
        print(ok(r['heldBack'] and r['stayMsg']), 'planens vindgrense holder båten på land')
        print(ok(r['paused'] and r['fails'] >= 3), 'pause etter tre mislykkede forsøk')
        print(ok(r['tpl']['n'] == 1 and r['tpl']['sess'] == 2 and r['tpl']['name'] == 'Tomtur' and not r['tpl']['on']), 'mal lagres og brukes')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
