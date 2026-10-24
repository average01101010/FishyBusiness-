"""The boat at anchor (core/06e-anchor.js): the rode runs out after the drop, she lies head to the wind on the rode's catenary and
swings round the anchor when the wind turns, lies to the current in a calm, sheers a little in a wind; weighing takes the windlass's
time and brings her up over the anchor, and a route waits for it. Tried at three places along the coast (south, middle, north)."""
from _env import boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(async (pid) => {
  const R = {pid}; S.tut = 0; const b = S.boat, pt = portById(pid); if (!pt) return {pid, err:'no port'}; await mapNeed(pt.p, 14);
  const spot = driftAnchorage(pid); if (!spot) return {pid, err:'no spot'}; await mapNeed(spot, 6);
  b.type = 'kyst15'; applyVessel(); b.status = 'idle'; b.port = null; b.pos = {x:spot.x, y:spot.y}; b.heading = 0; S.plan = null; S.crew = []; S.me = S.cur; b.anch = null; b.drv = null;
  S.t = Math.round((Date.UTC(2028, 4, 3, 10) - EPOCH) / 6e4); DYN.on = false;
  const brg = (dx, dy) => ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360) % 360, dAng = (a, c) => Math.abs(((a - c) % 360 + 540) % 360 - 180);
  const lie = () => { const a = b.anch, g = anchorGear(b.type), fx = b.pos.x + Math.sin(b.heading) * g.fair / 1000, fy = b.pos.y - Math.cos(b.heading) * g.fair / 1000;
    return {bow:Math.round(dAng(b.heading * 180 / Math.PI, brg(a.x - fx, a.y - fy))), from:Math.round(brg(b.pos.x - a.x, b.pos.y - a.y)), X:Math.round(Math.hypot(fx - a.x, fy - a.y) * 1000), hd:Math.round(b.heading * 180 / Math.PI)}; };
  // 1. a fresh breeze from the west: she falls back east of the anchor with her bow to it, the rode all out
  WX_FORCE = {w:9, d:270}; R.dropped = dropAnchor(); const a = b.anch; R.rode = a && a.rode; R.depth = a && a.depth; if (!a) return R;
  let tOut = 0; for (let i = 0; i < 25; i++){ step(); if (!tOut && b.anch.out >= b.anch.rode) tOut = i + 1; } R.paidOut = tOut; R.west = lie();
  R.westOk = R.west.bow < 12 && dAng(R.west.from, 90 - gridGamma(b.pos)) < 25 && R.west.X > 0.6 * Math.sqrt(a.rode * a.rode - (a.depth + 1.65) ** 2) && R.west.X <= a.rode;
  // she sheers to and fro in the wind
  { const hs = []; for (let i = 0; i < 12; i++){ step(); hs.push(b.heading * 180 / Math.PI); } R.sheer = Math.round(Math.max(...hs) - Math.min(...hs)); }
  // 2. the wind goes round to the east: she swings round the anchor to its west side
  WX_FORCE = {w:9, d:90}; let tSw = 0; for (let i = 0; i < 40; i++){ step(); const l = lie(); if (!tSw && dAng(l.from, 270 - gridGamma(b.pos)) < 25) tSw = i + 1; } R.east = lie(); R.swingMin = tSw;
  R.eastOk = R.east.bow < 12 && tSw > 0 && dAng(a.x === b.anch.x ? 0 : 1, 0) === 0;
  // 3. near calm: she lies to the current (the tide's stream and the wind's drift)
  WX_FORCE = {w:0.4, d:90}; for (let i = 0; i < 40; i++) step(); { const c = curAt(b.pos, S.t / 60); R.cur = {ms:Math.round(Math.hypot(c.x, c.y) * 100) / 100, brg:Math.round(brg(c.x, c.y)), dh:Math.round(c.dh * 100) / 100}; R.calm = lie();
    R.calmOk = R.cur.ms < 0.02 || (dAng(R.calm.from, R.cur.brg) < 35 && R.calm.bow < 15); }
  // the stream over a tide: it turns with it, and it is never wild
  { let mx = 0, turns = 0, s0 = 0; for (let h = 0; h < 13; h += 0.5){ const c = curAt(b.pos, S.t / 60 + h), s = Math.sign(c.tide); mx = Math.max(mx, Math.abs(c.tide)); if (s0 && s && s !== s0) turns++; if (s) s0 = s; } R.tide = {max:Math.round(mx * 100) / 100, turns}; R.tideOk = turns >= 1 && mx > 0.02 && mx < 1.3; }
  // 4. weighing: she comes up over the anchor while the windlass hauls, in the minutes the rode takes
  WX_FORCE = {w:6, d:200}; const p0 = {x:a.x, y:a.y}; weighAnchor(); const need = Math.ceil(a.out / anchorGear(b.type).haul); let tUp = 0, dEnd = null;
  for (let i = 0; i < 40 && b.anch; i++){ step(); if (b.anch && b.anch.out <= b.anch.depth + 2 && dEnd == null) dEnd = Math.round(Math.hypot(b.pos.x - p0.x, b.pos.y - p0.y) * 1000); if (!b.anch) tUp = i + 1; }
  R.weigh = {min:tUp, need, overIt:dEnd}; R.weighOk = !b.anch && tUp >= need - 1 && tUp <= need + 2 && dEnd != null && dEnd < 40;
  // 5. a route started at anchor waits for the anchor, then goes
  dropAnchor(); for (let i = 0; i < 20; i++) step(); const q0 = {...b.pos}, A = {x:b.anch.x, y:b.anch.y};
  S.plan = {wps:[{x:b.pos.x + 1, y:b.pos.y, port:null, fish:0}], idx:0, speed:8}; b.status = 'sailing';
  let held = true, gone = 0; for (let i = 0; i < 30; i++){ step(); if (b.anch && Math.hypot(b.pos.x - A.x, b.pos.y - A.y) * 1000 > b.anch.rode + 30) held = false; if (!b.anch && !gone) gone = i + 1; }
  R.route = {held, upAfter:gone, moved:Math.round(Math.hypot(b.pos.x - q0.x, b.pos.y - q0.y) * 1000), st:b.status}; R.routeOk = held && gone > 2 && R.route.moved > 150;
  WX_FORCE = null; S.plan = null; b.status = 'idle'; b.anch = null; return R; })"""

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # south, middle and north along the coast, and Senja
        # (the first of each group that has an anchorage near it: the city quays in Bergen have none within 13 km)
        for grp in [['Bergen', 'Florø', 'Egersund', 'Stavanger'], ['Bodø'], ['Husøy'], ['Båtsfjord', 'Hammerfest']]:
            r = None
            for nm in grp:
                pid = await pg.evaluate("(nm) => { const q = PORTS.find(q => q.name === nm) || PORTS.find(q => (q.name || '').startsWith(nm)); return q ? q.id : null; }", nm)
                if not pid: continue
                r = await pg.evaluate(JS, pid)
                if not r.get('err'): pid = nm + ' ' + pid; break
            if not r or r.get('err'): print('FEIL', grp, 'ingen ankerplass', r and r.get('err')); continue
            print(ok(r['westOk']), pid, 'vest: rode', r['rode'], 'm på', r['depth'], 'm, ute etter', r['paidOut'], 'min, ligger', json.dumps(r['west']))
            print(ok(r['sheer'] >= 4), pid, 'svaier', r['sheer'], 'grader i vinden')
            print(ok(r['eastOk']), pid, 'vinden til øst: svinger på', r['swingMin'], 'min,', json.dumps(r['east']))
            print(ok(r['calmOk']), pid, 'stille: strøm', json.dumps(r['cur']), 'ligger', json.dumps(r['calm']))
            print(ok(r['tideOk']), pid, 'tidevannsstrøm over ett tidevann', json.dumps(r['tide']))
            print(ok(r['weighOk']), pid, 'hiving', json.dumps(r['weigh']))
            print(ok(r['routeOk']), pid, 'rute fra anker', json.dumps(r['route']))
        print('sidefeil', errs[:3])
        await br.close()
asyncio.run(main())
