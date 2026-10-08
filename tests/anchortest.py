"""Anchor (core/06e-anchor.js): where one can anchor; an anchored boat holds in calm and drags in weather over her own limits (a gale
sends her to the quay); a rest at anchor in the operations plan: out to a sheltered spot, back to work from there, and in bad weather
the quay instead."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(async () => {
  const R = {}; S.tut = 0; const realW = windAt, realH = hsAt, realO = hsOpen, tick = () => new Promise(r => setTimeout(r, 0));
  const HP = portById('husoy'), b = S.boat; await mapNeed(HP.p, 14);
  // 1. the places
  R.land = !anchorSpot({x:HP.p.x - 4, y:HP.p.y + 6}).ok || true;
  const spot = driftAnchorage('husoy'); R.spot = !!spot; if (!spot) return R;
  R.spotOk = anchorSpot(spot).ok && spot.depth >= ANCH.minDepth && spot.depth <= ANCH.maxDepth; R.spotNear = spot.d <= 13;
  let landFound = false; for (let i = 0; i < 400 && !landFound; i++){ const q = {x:HP.p.x + (i % 20 - 10) * 0.7, y:HP.p.y + (Math.floor(i / 20) - 10) * 0.7}; try { if (isLand(q)){ const s = anchorSpot(q); landFound = !s.ok && s.why === 'land'; } } catch (e){} } R.landNo = landFound;
  // 2. hold in calm, drag in a blow
  b.status = 'idle'; b.port = null; b.pos = {x:spot.x, y:spot.y}; S.plan = null; S.crew = []; S.me = S.cur; S.t = Math.round((Date.UTC(2028, 4, 3, 10) - EPOCH) / 6e4);
  window.windAt = () => 3; window.hsAt = () => 0.2;
  R.dropped = dropAnchor(); const p0 = {...b.pos}; for (let i = 0; i < 12 * 60; i++) step(); R.calmHeld = b.anch && b.anch.drags === 0 && dist(b.pos, p0) < 1e-9;
  R.load = Math.round(anchorLoad(BOAT.risk[2] * 1.5, 0.3, 0.5) * 100) / 100;
  window.windAt = () => BOAT.risk[2] * 1.25; window.hsAt = () => BOAT.risk[0] * 1.1; S.settings.autoOn = false; b.windArm = false;
  S.crew = [Object.assign(genCrew(), {bi:false, off:false})];
  let drags = 0; for (let i = 0; i < 40 * 60 && b.anch; i++){ step(); drags = b.anch ? b.anch.drags : drags; } R.dragged = drags > 0;
  // a gale: the awake boat weighs and heads for a quay
  window.windAt = () => BOAT.risk[3] * 1.2; window.hsAt = () => BOAT.risk[1] * 1.2; b.status = 'idle'; b.port = null; b.pos = {x:spot.x, y:spot.y}; S.plan = null; b.anch = null; dropAnchor();
  let gone = false; for (let i = 0; i < 20 * 60 && !gone; i++){ step(); if (i % 20 === 0) await tick(); gone = !b.anch && (!!S.plan || b.status === 'sailing' || b.status === 'port'); } R.gale = gone;
  window.windAt = realW; window.hsAt = realH; b.anch = null;
  // 3. a rest at anchor in the plan
  const W = q => ({x:q.x, y:q.y, port:null, fish:0}), rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0].slice(1).map(q => ({x:q[0], y:q[1]}));
  const wps = exitWps(HP, rt[0]).map(W).concat(rt.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === rt.length - 1 ? 1 : 0}))); rt.slice(0, -1).reverse().forEach(q => wps.push(W(q)));
  entryWps(HP, rt[0]).forEach(q => wps.push(W(q))); wps.push({x:HP.p.x, y:HP.p.y, port:'husoy', fish:0});
  const trip = dep => ({id:driftSid(), type:'tur', dep, route:{wps:wps.map(w => ({...w})), speed:16, home:'husoy', end:'husoy', hours:3}});
  let calm = null; for (let d = 0; d < 150 && calm == null; d++){ const H0 = (Date.UTC(2028, 4, 1 + d, 4) - EPOCH) / 3.6e6; let good = true; for (let k = 0; k <= 22; k++) if (realW(H0 + k) > 7.5 || hsOpen(H0 + k) > 1.2) good = false; if (good) calm = H0; } R.calm = calm; if (calm == null) return R;
  const run = async (mode) => {
    b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; b.fuel = 90; b.gear = true; b.kgear = true; b.land = b.shift = b.fueling = null; S.hold = []; S.plan = null; b.anch = null; S.sales = []; S.me = 'nobody';
    S.t = Math.round(calm * 60); const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole'}); S.crew = [ole];
    const o = driftNew({skipper:ole.id, days:[1, 1, 1, 1, 1, 1, 1]}); o.wx.wind = 40; o.wx.hs = 7; o.sess = [trip(5), {id:driftSid(), type:'hvile', dep:9, at:'anker', near:'husoy', pos:null}, trip(15)]; S.ops = o; o.on = true;
    if (mode === 'storm'){ window.windAt = () => BOAT.risk[2] * 1.3; window.hsAt = () => 0.3; window.hsOpen = () => 0.3; }
    const ev = {anch:0, outAfterAnch:0, port:0}; let wasAnch = false, outs = 0, hold = 0;
    for (let i = 0; i < 28 * 60; i++){ step(); if (i % 15 === 0) await tick(); if (b.anch && !wasAnch){ ev.anch++; } wasAnch = !!b.anch;
      if (b.status !== 'port' && ev.anch >= 1 && !b.anch && b.status === 'sailing') ev.outAfterAnch++; if (b.status === 'port' && S.t % 60 === 0) ev.port++;
      if (b.status !== 'port' && !b.anch && !S.hold.length && b.status === 'sailing' && hold < 3){ for (const [sp, kg] of [['torsk', 80]]) S.hold.push({sp, cls:SPECIES[sp].ref, kg, n:1, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}); hold++; } }
    ev.logs = S.log.slice(-40).map(l => hm(l.t / 60) + ' ' + (l.no || '').slice(0, 70)); ev.reps = o.rep.length; ev.msgs = S.msgs.filter(m => /ankers/.test(m.no)).map(m => m.no.slice(0, 80)); ev.fails = o.fails; ev.on = o.on; ev.pos = o.sess[1].pos; ev.status = b.status; ev.anchNow = !!b.anch; ev.dbg = {idx:o.idx, cn:o.cn, a0:o.a0, hold:o.hold, delay:o.delay, sk:o.skipped, H:S.t / 60, hod:driftHod(S.t / 60), busy:portBusy(b), jobs:S.jobs && S.jobs.length, plan:!!S.plan, land:!!b.land, shift:!!b.shift, st:b.status, crew:S.crew.length, wxw:windAt(S.t/60), hs:hsOpen(S.t/60)};
    window.windAt = realW; window.hsAt = realH; window.hsOpen = realO; S.ops = null; return ev;
  };
  R.calmPlan = await run('calm'); R.stormPlan = await run('storm');
  S.me = S.cur; return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(900000)
        r = await pg.evaluate(JS)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r.get('spot') and r.get('spotOk') and r.get('spotNear')), 'ankerplass nær havna: riktig dyp og svingrom')
        print(ok(r.get('landNo')), 'ikke ankring på land')
        print(ok(r.get('dropped') and r.get('calmHeld')), 'i stille vær holder ankeret i 12 timer')
        print(ok(r.get('dragged')), 'i vær over båtens grenser slepper ankeret')
        print(ok(r.get('gale')), 'i kuling hiver båten og går til kai')
        c = r.get('calmPlan') or {}
        print(ok(c.get('anch') == 1 and c.get('reps') >= 2), 'planen: tur, hvile til ankers, tur fra ankeret, to leveringer')
        s = r.get('stormPlan') or {}
        print(ok(s.get('anch') == 0 and s.get('reps') >= 2), 'planen: i hardt vær ligger båten ved kai i stedet for å ankre')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
