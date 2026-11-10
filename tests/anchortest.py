"""Anchor (core/06e-anchor.js): where one can anchor; an anchored boat holds in calm and drags in weather over her own limits (a gale
sends her to the quay); the alarm, and the rest at a rorbu. (The old plan's rest at anchor at home for a big boat went with the old plan
in Ø12 C 08.11.2026: in Driftsplan 2 the boats from 24 m are ocean vessels that run round the clock; Pause with the anchor is in
driftsplan2kyst.)"""
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
  // the anchor reads the current (curAt, F8a): the push on her has the stream of the place in it, and in the narrows of Saltstraumen at the
  // flood it is many times what it is at the anchorage off Husøy
  { const H = S.t / 60, F = anchorForce(b.type, spot, H);
    const c0 = P(67.2335, 14.623); let q = null, bd = 1e9; for (const s of STROM.s){ const d = Math.hypot(s.x - c0.x, s.y - c0.y); if (d < bd){ bd = d; q = s; } }
    let Hs = H; for (let h = 0; h < 13; h += 0.1) if (curAt({x:q.x, y:q.y}, H + h).dh > curAt({x:q.x, y:q.y}, Hs).dh) Hs = H + h;
    const Fs = anchorForce(b.type, {x:q.x, y:q.y}, Hs); R.curSalt = {husoy:Math.round(F.Fc), salt:Math.round(Fs.Fc)}; R.curSaltOk = Fs.Fc > 20 * Math.max(1, F.Fc);
    // and without the current there is no push from it: curAt stubbed to still water gives nil
    const realC = curAt; window.curAt = () => ({x:0, y:0, sx:0, sy:0, nx:0, ny:0, tide:0, snd:0, coast:0, dh:0}); let F0;
    try { F0 = anchorForce(b.type, {x:q.x, y:q.y}, Hs); } finally { window.curAt = realC; } R.curRead = F0.Fc === 0 && Fs.Fc > 0; }
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
  b.type = 'skiff'; applyVessel();
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
        print(ok(r.get('curRead') and r.get('curSaltOk')), 'ankeret leser strømmen (curAt): i Saltstraumen på flo er strømmens trykk mange ganger det ved Husøy', r.get('curSalt'))
        print(ok(r.get('dragged')), 'i vær over båtens grenser slepper ankeret')
        print(ok(r.get('gale')), 'i kuling hiver båten og går til kai')
        print(ok(r.get('alarmRang')), 'ankeralarmen ringer ved slep')
        print(ok(r.get('rorbuRest') and r.get('rorbuRested')), 'ankomst til rorbu starter hvilen av seg selv (ikke når du er uthvilt)')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
