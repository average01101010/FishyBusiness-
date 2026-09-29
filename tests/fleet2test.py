from _env import GAME, ROUTES
# Fleet phase 2: access rules at landing, two vessels on standing plans for a simulated week, the fleet buttons, and save/load.
import asyncio, json
from playwright.async_api import async_playwright

R = json.load(open(ROUTES))['4']
ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width':900,'height':800}); pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        dialogs = []
        async def on_dialog(d):
            dialogs.append(d.type)
            await (d.accept('Testbåt') if d.type == 'prompt' else d.accept())
        pg.on('dialog', lambda d: asyncio.ensure_future(on_dialog(d)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(400)

        # 1. landing with and without access
        land = await pg.evaluate("""(()=>{
          S.tut = 0; S.t = Math.round((Date.UTC(2028, 2, 7, 10) - EPOCH) / 6e4); S.cash = 5e6; S.crew = []; S.ops = null;
          const lic = O => ({id:O.id, hl:O.hl, cod:O.cod, hyse:O.hyse, sei:O.sei, kpk:O.kpk});
          const land = hold => { S.crew = []; S.boat.status = 'port'; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p};
            S.hold = hold.map(([sp, kg]) => ({sp, cls:SPECIES[sp].ref, kg, n:1, bled:true, iced:true, hr:0, fresh:95, gut:false, hook:true}));
            sell(); const q = quotaState(); return {acc:S.lastSale.acc, confKg:Math.round(S.lastSale.confKg * 10) / 10, torsk:Math.round(q.torsk), byCod:Math.round((q.byCod || 0) * 10) / 10, hyse:Math.round(q.hyse * 10) / 10}; };
          const mix = [['torsk', 100], ['hyse', 50], ['sei', 50], ['lange', 300]];
          const v1 = curVessel(), v2 = newVesselObj('snekke', 'finnsnes'), R = {};
          S.tripOwner = true; R.openOwner = land(mix);
          S.tripOwner = false; R.openOps = land(mix);
          withVessel(v2, () => { S.tripOwner = true; R.second = land(mix); quotaState().byCod = 1990; R.secondCap = land(mix); });
          R.openBefore = openVesselId();
          const v3 = newVesselObj('sjark', 'finnsnes', lic(LIC_OFFERS[1]));
          R.openAfterLic = openVesselId();
          S.tripOwner = true; R.firstAfterLic = land(mix);
          withVessel(v3, () => { R.licensed = land(mix); });
          R.names = S.fleet.map(v => vget(v, 'boatName'));
          // clean up: back to one vessel
          S.fleet = [v1]; S.cur = v1.id; S.me = v1.id; S.quota = null;
          return R; })()""")
        print('landing:', json.dumps(land, ensure_ascii=False))
        print(ok(land['openOwner']['acc'] == 'open' and land['openOwner']['confKg'] == 0 and land['openOwner']['torsk'] == 100), 'open-group vessel, owner aboard: cod on the quota, nothing confiscated')
        print(ok(land['openOps']['acc'] == 'none' and land['openOps']['confKg'] == 150 and land['openOps']['byCod'] == 25), 'open-group vessel without the owner: 10 % bycatch, 150 kg confiscated, 25 kg cod as bycatch')
        print(ok(land['second']['acc'] == 'none' and land['second']['confKg'] == 150), 'second vessel: no access')
        print(ok(land['secondCap']['confKg'] == 165 and land['secondCap']['byCod'] == 2000), 'bycatch cod capped at 2 t a year')
        print(ok(land['openBefore'] == 'v1' and land['openAfterLic'] is None and land['firstAfterLic']['acc'] == 'none'), 'a closed-group vessel in the fleet takes away the open group')
        print(ok(land['licensed']['acc'] == 'lukket' and land['licensed']['confKg'] == 0 and land['licensed']['torsk'] == 100), 'closed-group vessel lands on its own quota')

        # 2. two vessels on standing plans for a simulated week
        week = await pg.evaluate("""(()=>{
          // a working day from Husøy (which has a fish plant): out along the local boats' route into Øyfjorden, fish four hours, and back
          S.t = Math.round((Date.UTC(2028, 4, 8, 0) - EPOCH) / 6e4); S.cash = 5e6; S.stock = initStock(); S.settings.autoW = 14;
          const rt = FLEET.find(f => f.home === 'husoy' && f.L < 15).rt[0].slice(1).map(q => ({x:q[0], y:q[1]}));
          const mk = sk => { const wps = rt.map((q, i) => ({x:q.x, y:q.y, port:null, fish:i === rt.length - 1 ? 4 : 0})); rt.slice(0, -1).reverse().forEach(q => wps.push({x:q.x, y:q.y, port:null, fish:0}));
            const h = portById('husoy').p; wps.push({x:h.x, y:h.y, port:'husoy', fish:0}); return {on:true, dep:5, days:[1, 1, 1, 1, 1, 1, 1], maxWind:20, skipper:sk.id, last:-1, wps, speed:16, home:'husoy', end:'husoy', hours:8}; };
          const hand = () => Object.assign(genCrew(), {bi:false, off:false}); const v1 = curVessel(); S.crew = [hand()]; S.ops = mk(S.crew[0]); S.hold = []; S.boat.port = 'husoy'; S.boat.pos = {...portById('husoy').p}; S.boat.fuel = 90; S.boat.gear = true;
          const O = LIC_OFFERS[0], v2 = newVesselObj('snekke', 'husoy', {id:O.id, hl:O.hl, cod:O.cod, hyse:O.hyse, sei:O.sei, kpk:O.kpk});
          withVessel(v2, () => { S.crew = [hand()]; S.ops = mk(S.crew[0]); S.boat.gear = true; });
          const log0 = S.log.length; let onLand = 0, maxAtSea = 0;
          for (let i = 0; i < 7 * 1440; i++){ step(); if (i % 10 === 0){ let n = 0; for (const v of S.fleet){ const b = vget(v, 'boat'); if (b.status !== 'port'){ n++; if (isLand(b.pos)) onLand++; } } maxAtSea = Math.max(maxAtSea, n); } }
          const ev = S.log.slice(log0).map(e => e.no);
          const per = S.fleet.map(v => { const q = vget(v, 'quota') || {}, nm = vget(v, 'boatName'); return {id:v.id, name:nm, type:vget(v, 'boat').type, status:vget(v, 'boat').status, hold:Math.round((vget(v, 'hold') || []).reduce((a, x) => a + x.kg, 0)),
            torsk:Math.round(q.torsk || 0), byCod:Math.round(q.byCod || 0), conf:Math.round(q.conf || 0), trips:ev.filter(t => t.startsWith(nm + ': Kastet loss')).length, landed:ev.filter(t => t.startsWith(nm + ': Leverte')).length}; });
          const v2log = ev.filter(t => t.startsWith(S.fleet[1] && vget(S.fleet[1], 'boatName') + ':') && /Kastet loss|Leverte|Fortøyd|Vinden/.test(t)).map(t => t.split(': ')[1].slice(0, 22)); return {v2log, per, onLand, maxAtSea, sample:ev.filter(t => /Kastet loss|Leverte|inndratt|på land/.test(t)).slice(0, 8)}; })""", R)
        print('week:', json.dumps(week, ensure_ascii=False))
        p1, p2 = week['per']
        print(ok(week['onLand'] == 0), 'no vessel on land during the week')
        print(ok(p1['trips'] > 0 and p2['trips'] > 0 and week['maxAtSea'] == 2), 'both vessels went out, at the same time')
        print(ok(p1['torsk'] == 0 and p2['torsk'] > 0 and p2['byCod'] == 0), 'quotas kept apart: the skiff has no access (on ops, no closed-group room), the snekke lands on its own quota')

        # 3. the fleet buttons, clicked for real
        btn = await pg.evaluate("""(()=>{
          const R = {}; const v1 = curVessel(), v2 = S.fleet[1]; S.cash = 5e6;
          for (const v of S.fleet) withVessel(v, () => { S.plan = null; S.ops && (S.ops.on = false); S.boat.status = 'port'; S.boat.port = 'finnsnes'; S.boat.pos = {...PORTS[0].p}; });
          PHONE.open('fartoy'); const q = s => document.querySelector(s);
          q('[data-pa="vfollow"][data-id="' + v2.id + '"]').click(); R.follow = S.cur;
          R.hudRow = document.getElementById('hud').innerText.includes(S.boatName) && !document.getElementById('hud').innerText.includes('⚓');
          q('[data-pa="vboard"][data-id="' + v2.id + '"]').click(); R.board = S.me; R.hudAnchor = document.getElementById('hud').innerText.includes('⚓');
          q('[data-pa="vname"][data-id="' + v2.id + '"]').click(); return R; })()""")
        await pg.wait_for_timeout(300)
        btn2 = await pg.evaluate("""(()=>{
          const R = {name:S.boatName}; const q = s => document.querySelector(s), v1 = S.fleet[0], val = vesselValue(v1), c0 = S.cash;
          PHONE.render(); q('[data-pa="vsell"][data-id="' + v1.id + '"]').click(); return Object.assign(R, {val, c0}); })()""")
        await pg.wait_for_timeout(300)
        btn3 = await pg.evaluate("""(([c0, val])=>{
          const R = {fleet:S.fleet.length, cashUp:Math.round(S.cash - c0) === val, got:Math.round(S.cash - c0), val, openNow:openVesselId(), me:S.me, cur:S.cur};
          // buy a skiff for the fleet from the market tab, with the real button
          PHONE.open('fartoy'); document.querySelector('[data-pa="sub"][data-s="marked"]').click();
          const bt = document.querySelector('[data-pa="buy"][data-ti="0"][data-k="skiff"]'); R.buyEnabled = !bt.disabled; bt.click();
          R.after = S.fleet.map(v => vget(v, 'boatName') + ':' + vget(v, 'boat').type + ':' + vget(v, 'boat').port);
          // not aboard and no crew: the new skiff cannot leave
          const nv = S.fleet[S.fleet.length - 1]; R.depart = onVessel(nv, () => { S.crew = []; S.plan = {wps:[{x:1, y:1, port:null, fish:0}], idx:0, speed:10}; return depart(); });
          return R; })""", [btn2['c0'], btn2['val']])
        print('buttons:', json.dumps([btn, btn2['name'], btn3], ensure_ascii=False))
        print(ok(btn['follow'] == 'v2' and btn['hudRow']), 'follow: the HUD shows the followed vessel, no anchor')
        print(ok(btn['board'] == 'v2' and btn['hudAnchor']), 'go aboard: the anchor shows')
        print(ok(btn2['name'] == 'Testbåt'), 'rename via prompt')
        print(ok(btn3['fleet'] == 1 and btn3['cashUp']), 'sell the other vessel for its value')
        print(ok(btn3['buyEnabled'] and len(btn3['after']) == 2 and btn3['depart'] is False), 'buy for the fleet, and a crewless vessel without you cannot leave')

        # 4. save and load with two vessels
        await pg.evaluate("save()")
        await pg.reload(); await pg.wait_for_timeout(1800)
        rl = await pg.evaluate("JSON.stringify({fleet:S.fleet.map(v => vget(v, 'boatName')), me:S.me, cur:S.cur, bound:curVessel().boat === S.boat && curVessel().hold === S.hold})")
        print('after reload:', rl)
        r = json.loads(rl)
        print(ok(len(r['fleet']) == 2 and r['me'] == btn3['me'] and r['bound']), 'two vessels, the one you are aboard and the bound aliases survive a reload')

        # 5. a new build ordered for the fleet is added when the yard delivers
        order = await pg.evaluate("""(()=>{ S.cash = 1e7; S.order = null; for (const v of S.fleet) withVessel(v, () => { S.plan = null; S.boat.status = 'port'; S.boat.port = 'finnsnes'; });
          PHONE.open('fartoy'); document.querySelector('[data-pa="sub"][data-s="marked"]').click();
          const n0 = S.fleet.length; document.querySelector('[data-pa="buy"][data-ti="0"][data-k="sjarkny"]').click(); const vid = S.order ? S.order.vid : 'no order';
          S.t = S.order.due; deliverOrder(); const nv = S.fleet[S.fleet.length - 1];
          return {n0, n1:S.fleet.length, vid, order:S.order, type:vget(nv, 'boat').type, port:vget(nv, 'boat').port, msg:S.msgs[S.msgs.length - 1].no}; })()""")
        print('new build:', json.dumps(order, ensure_ascii=False))
        print(ok(order['vid'] is None and order['n1'] == order['n0'] + 1 and order['type'] == 'sjarkny' and order['order'] is None), 'the new build joins the fleet in Finnsnes')
        print('dialogs:', dialogs)
        print('errors:', errs[:4]); await b.close()
asyncio.run(main())
