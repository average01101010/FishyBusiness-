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
  R.dropped = dropAnchor(); const A0 = {x:b.anch.x, y:b.anch.y}; for (let i = 0; i < 12 * 60; i++) step();
  // (she swings round it now, core/06e-anchor.js anchorSwing: the anchor holds where it went down, and she lies within the rode's reach of it)
  R.calmHeld = b.anch && b.anch.drags === 0 && dist({x:b.anch.x, y:b.anch.y}, A0) < 1e-9 && dist(b.pos, A0) * 1000 < b.anch.rode + VESSELS[b.type].len;
  R.load = Math.round(anchorLoad(BOAT.risk[2] * 1.5, 0.3, 0.5) * 100) / 100;
  window.windAt = () => BOAT.risk[2] * 1.25; window.hsAt = () => BOAT.risk[0] * 1.1; S.settings.autoOn = false; b.windArm = false;
  S.crew = [Object.assign(genCrew(), {bi:false, off:false})];
  let drags = 0; for (let i = 0; i < 40 * 60 && b.anch; i++){ step(); drags = b.anch ? b.anch.drags : drags; } R.dragged = drags > 0;
  // a gale: the awake boat weighs and heads for a quay
  window.windAt = () => BOAT.risk[3] * 1.2; window.hsAt = () => BOAT.risk[1] * 1.2; b.status = 'idle'; b.port = null; b.pos = {x:spot.x, y:spot.y}; S.plan = null; b.anch = null; dropAnchor();
  // (the minutes are played as catch-up plays them, with the manoeuvring model off: in a loop of steps it would only move her in real time)
  let gone = false; for (let i = 0; i < 20 * 60 && !gone; i++){ DYN.on = false; step(); if (i % 20 === 0) await tick(); gone = !b.anch && (!!S.plan || b.status === 'sailing' || b.status === 'port'); } R.gale = gone;
  window.windAt = realW; window.hsAt = realH; b.anch = null;
  // the alarm hook: a drag rings it, and the one asleep alone aboard is woken by the same ring as the bridge watch alarm
  { let rang = 0; const keep = hooks.onAnchorAlarm; hooks.onAnchorAlarm = (k, n) => { rang++; }; anchorAlarm('drag', 1); R.alarmRang = rang === 1; hooks.onAnchorAlarm = keep; }
  // a rorbu: arrival by a route starts the rest by itself (Jonas 08.10.2026), a tired skipper aboard, none when rested
  { const rid = RORBUER[0].id; S.me = S.cur; S.energy = 40; S.rest = null; S.plan = {wps:[], idx:0}; b.status = 'sailing'; b.port = null; S.cash = 5e5; dock(rid); R.rorbuRest = !!S.rest && S.rest.w === 'rorbu';
    S.rest = null; S.energy = 100; S.plan = {wps:[], idx:0}; b.status = 'sailing'; dock(rid); R.rorbuRested = !S.rest; S.rest = null; b.status = 'idle'; b.port = null; b.pos = {x:spot.x, y:spot.y}; S.plan = null; }
  // 3. the plan: a big boat (from 24 m, Jonas 23.10.2026) lies at anchor near home between the days, and at the quay when the night is too hard
  // (a boat of 15 m or more may not fish cod inside the fjord lines, so the place is outside them: a harbour on the outer coast)
  b.type = 'autoliner'; applyVessel(); let HQ = null, spot2 = null;
  for (const pid of ['husoy', 'botnhamn', 'gryllefjord', 'finnsnes']){ const P = portById(pid); if (!P || spot2) continue; await mapNeed(P.p, 20);
    for (let r = 3; r < 20 && !spot2; r += 0.5) for (let a = 0; a < 24 && !spot2; a++){ const q = {x:P.p.x + r * Math.sin(a * 0.26), y:P.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 30 && coastDist(q) > 0.5 && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})){ spot2 = q; HQ = P; } } catch (e){} } }
  R.bigHome = HQ && HQ.id;
  let calm = null; for (let d = 0; d < 150 && calm == null; d++){ const H0 = (Date.UTC(2028, 4, 1 + d, 4) - EPOCH) / 3.6e6; let good = true; for (let k = 0; k <= 30; k++) if (realW(H0 + k) > 7.5 || hsOpen(H0 + k) > 1.2) good = false; if (good) calm = H0; } R.calm = calm; if (calm == null || !spot2) return R;
  const run = async (mode) => {
    b.type = 'autoliner'; applyVessel(); b.status = 'port'; b.port = HQ.id; b.pos = {...HQ.p}; b.fuel = BOAT.fuelCap; b.gear = true; b.land = b.shift = b.fueling = null; S.hold = []; S.plan = null; b.anch = null; S.sales = []; S.me = 'nobody';
    S.t = Math.round(calm * 60); const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole'}), per = Object.assign(genCrew(), {bi:false, off:false, name:'Per'}); S.crew = [ole, per]; setSkipper(ole.id); setMate(per.id);
    const o = driftNew({home:HQ.id, anchor:true, rig:'juksa', jigs:[{id:'a', x:spot2.x, y:spot2.y}], dep:Math.round(driftHod(calm)), wx:'tough'}); S.ops = o;
    const err = await new Promise(r => driftMake(o, r)); o.on = true;
    // the storm comes at night only: the day is fished, and the anchorage is too open for the night
    if (mode === 'storm') window.windAt = (H, p) => { const h = driftHod(H); return h >= 21 || h < 4 ? BOAT.risk[2] * 1.3 : realW(H, p); };
    const ev = {err, anch:0, outAfterAnch:0, port:0, homeA:!!o.homeA}; let wasAnch = false;
    for (let i = 0; i < 28 * 60; i++){ DYN.on = false; step(); if (i % 15 === 0) await tick(); if (b.anch && !wasAnch){ ev.anch++; } wasAnch = !!b.anch;
      if (b.status !== 'port' && ev.anch >= 1 && !b.anch && b.status === 'sailing') ev.outAfterAnch++; if (b.status === 'port' && S.t % 60 === 0) ev.port++; }
    ev.logs = S.log.slice(-30).map(l => hm(l.t / 60) + ' ' + (l.no || '').slice(0, 70)); ev.reps = o.rep.length; ev.on = o.on; ev.stop = o.stop; ev.wait = o.wait; ev.status = b.status; ev.anchNow = !!b.anch; ev.portNow = b.port;
    window.windAt = realW; window.hsAt = realH; window.hsOpen = realO; S.ops = null; b.type = 'skiff'; applyVessel(); return ev;
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
        print(ok(r.get('alarmRang')), 'ankeralarmen ringer ved slep')
        print(ok(r.get('rorbuRest') and r.get('rorbuRested')), 'ankomst til rorbu starter hvilen av seg selv (ikke når du er uthvilt)')
        c = r.get('calmPlan') or {}
        print(ok(not c.get('err') and c.get('homeA') and c.get('anch', 0) >= 1 and c.get('outAfterAnch', 0) > 0 and c.get('reps') >= 1), 'planen: en stor båt fisker, leverer, ligger til ankers hjemme og går ut fra ankeret neste dag')
        s = r.get('stormPlan') or {}
        print(ok(s.get('anch') == 0 and s.get('reps') >= 1 and s.get('port', 0) >= 8), 'planen: når natta blir for hard for ankerplassen, ligger båten ved kai i stedet (natta ved kaia, ut igjen neste dag)')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
