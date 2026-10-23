"""The Drift app (ui/05c-drift.js, made anew 23.10.2026): one screen with Start, «Nå» and the answers as rows. A new plan starts filled in;
the rows open where they are tapped; a jig place is added from the player's own catch marks and a field from the chart plotter; the plan
is started (made first), paused, and a stopped plan shows the button that fixes it. The Crew page has the skipper and mate buttons and a
line for the plan; the plan is copied to another vessel."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(async () => {
  const R = {}; S.tut = 0; S.settings.lang = 'no'; S.lang = 'no';
  const b = S.boat, HP = portById('husoy'); b.type = 'sjark'; applyVessel(); b.status = 'port'; b.port = 'husoy'; b.pos = {...HP.p}; S.plan = null; S.ops = null; S.draft = []; S.me = S.cur;
  const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole Mikalsen'}), per = Object.assign(genCrew(), {bi:false, off:false, name:'Per Hansen'}); S.crew = [ole, per];
  await mapNeed(HP.p, 14);
  const sea = []; for (let r = 2.5; r < 12 && sea.length < 3; r += 0.5) for (let a = 0; a < 24 && sea.length < 3; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (!isLand(q) && depthF(q) > 20 && coastDist(q) > 0.4 && sea.every(z => dist(z, q) > 1) && !ruBlockMsg({p:q, len:BOAT.len, gear:'juksa', sp:null, hand:true})) sea.push(q); } catch (e){} }
  S.marks.push({x:sea[0].x, y:sea[0].y, t:S.t - 300, kgph:52, q:1}, {x:sea[2].x, y:sea[2].y, t:S.t - 400, kgph:30, q:1});
  const page = () => PHONE.page('drift'), act = (a, d) => PHONE.dact('drift', a, d || {});
  R.intro = page().includes('dr-new');
  // a new plan comes filled in: home where she lies, the rig she has, the best catch mark as the jig place
  act('dr-new'); const o = S.ops; R.fresh = {v:o.v, home:o.home, rig:o.rig, jigs:o.jigs.length};
  const p1 = page(); R.rows = ['Hjem', 'Fiske', 'Plasser', 'Levering', 'Vær', 'Rytme', 'Mannskap'].every(k => p1.includes('>' + k + '<'));
  R.noSessions = !/Økter|Flere valg|Maler|Test planen/.test(p1);
  // the rows open where they are tapped
  act('dr-row', {k:'home'}); R.homeOpen = page().includes('dr-home'); act('dr-row', {k:'home'}); R.homeShut = !page().includes('data-pa="dr-home"');
  // the weather and the rhythm
  act('dr-row', {k:'wx'}); act('dr-wx', {v:'safe'}); R.wx = o.wx;
  act('dr-row', {k:'rhythm'}); R.watchOff = /data-v="watch" disabled/.test(page()); act('dr-dep', {d:'1'}); act('dr-dep', {d:'1'}); R.dep = o.dep;
  // a jig place from the suggestions (the boat's own marks), another from the chart plotter
  act('dr-row', {k:'places'}); act('dr-add', {k:'J'}); const p2 = page(); R.sugg = p2.includes('Fangstplass'); act('dr-addp', {i:'map'});
  R.picking = !!DRIFTCTX && DRIFTCTX.spot === 'J+';
  S.draft = [{x:sea[1].x, y:sea[1].y, port:null, fish:0}]; R.saved = DRIFTUI.saveRoute() && !DRIFTCTX; R.jigs = o.jigs.length;
  // a place on land is refused
  let land = null; for (let r = 0.2; r < 3 && !land; r += 0.1) for (let a = 0; a < 24 && !land; a++){ const q = {x:HP.p.x + r * Math.sin(a * 0.26), y:HP.p.y - r * Math.cos(a * 0.26)}; try { if (isLand(q) && !inHarbour(q)) land = q; } catch (e){} }
  DRIFTCTX = {vid:S.cur, spot:'J+'}; S.draft = [{...land, port:null, fish:0}]; R.landRefused = !!land && !DRIFTUI.saveRoute() && o.jigs.length === R.jigs; DRIFTCTX = null; S.draft = [];
  // the order of the jig places
  const j0 = o.jigs[0].id; act('dr-jdn', {i:'0'}); R.order = o.jigs[1].id === j0;
  // a field for nets: the rig, the field from the chart, units and soak
  S.equip.garnhaler = true; S.pgear.nets = [{id:'nn', mesh:180, ty:'bunn', n:12, cond:1, max:0.95}]; S.pgear.kits.n = 4;
  act('dr-row', {k:'fish'}); act('dr-rig', {g:'garn'}); R.rig = o.rig; act('dr-jig', {v:'1'});
  act('dr-row', {k:'places'}); DRIFTCTX = {vid:S.cur, spot:'F+'}; S.draft = [{x:sea[2].x, y:sea[2].y, port:null, fish:0}]; DRIFTUI.saveRoute();
  const f = o.fields[0]; R.field = f && {n:f.n, soak:f.soak}; act('dr-fn', {id:f.id, d:'-1'}); act('dr-fs', {id:f.id, d:'1'}); R.field2 = {n:f.n, soak:f.soak};
  // the places in the chart
  act('dr-show'); R.pins = (driftSvg(1) || '').split('<circle').length - 1; act('dr-row', {k:'places'});
  // without you aboard, the skipper and the mate: the plan is not ready until both are appointed on the Crew page
  S.me = 'nobody'; R.notReady = page().includes('Ikke klar ennå') && page().includes('skipper og en styrmann');
  DOCK.open('arbeid'); const D = () => document.getElementById('drawerBody'); R.skBtn = !!D().querySelector('[data-pa=wk-sk]'); R.line = D().innerText.includes('Driftsplan') && !D().querySelector('.dr-rows');
  setSkipper(ole.id); setMate(per.id); R.ready = !page().includes('Ikke klar ennå');
  // Start: the plan is made (the plant, the legs), then switched on
  act('dr-start'); for (let k = 0; k < 300 && !o.on; k++) await new Promise(r => setTimeout(r, 100)); R.on = o.on; R.M = o.M; R.made = driftMade(o); R.err = o.err;
  const p3 = page(); R.now = p3.includes('Nå:'); R.land = p3.includes('Nærmeste mottak: ' + portById(o.M).name); R.next = /Neste tur|Turen nå/.test(p3);
  act('dr-pause'); R.paused = !o.on && !o.stop;
  // a stopped plan: the reason and the button that fixes it
  o.stop = {t:S.t, k:'closed', no:'Felt 1 er stengt (test).', en:'Field 1 is closed (test).', fix:'places'}; const p4 = page(); R.stopShown = p4.includes('Stoppet: Felt 1 er stengt') && p4.includes('dr-fix');
  act('dr-fix'); R.fixOpens = page().includes('dr-fn');
  // copy to another vessel
  const v2 = newVesselObj('sjark', 'husoy'); act('dr-copy', {id:v2.id}); const o2 = vget(v2, 'ops'); R.copy = !!o2 && o2.jigs.length === o.jigs.length && o2.fields.length === o.fields.length && !o2.on && o2.fields[0].id !== o.fields[0].id;
  S.me = S.cur; return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 900}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate(JS)
        print(json.dumps(r, ensure_ascii=False))
        print(ok(r['intro'] and r['fresh']['v'] == 3 and r['fresh']['home'] == 'husoy' and r['fresh']['jigs'] == 1), 'a new plan comes filled in: home where she lies, the best catch mark as the jig place', r['fresh'])
        print(ok(r['rows'] and r['noSessions']), 'one screen with the seven rows, and no sessions, routes, templates or «Flere valg»')
        print(ok(r['homeOpen'] and r['homeShut']), 'a row opens and shuts where it is tapped')
        print(ok(r['wx'] == 'safe' and r['watchOff'] and r['dep'] == 6), 'the weather, the rhythm (2+2 locked without four hands) and the hour out', [r['wx'], r['watchOff'], r['dep']])
        print(ok(r['sugg'] and r['picking'] and r['saved'] and r['jigs'] == 2 and r['landRefused'] and r['order']), 'jig places from the own marks and from the chart; land is refused; the order can be changed', r)
        print(ok(r['rig'] == 'garn' and r['field'] and r['field2'] and r['field2']['n'] == r['field']['n'] - 1 and r['field2']['soak'] == r['field']['soak'] + 6 and r['pins'] >= 4), 'a net field from the chart, its units and soak, and the places shown in the chart', [r['field'], r['field2'], r['pins']])
        print(ok(r['notReady'] and r['skBtn'] and r['line'] and r['ready']), 'without you aboard the plan waits for a skipper and a mate; the Crew page has the button and a line for the plan', r)
        print(ok(r['on'] and r['made'] and r['M'] and r['now'] and r['land'] and r['next']), 'Start makes the plan and switches it on; «Nå», the nearest plant and the next trip are shown', [r['on'], r['M'], r['err']])
        print(ok(r['paused'] and r['stopShown'] and r['fixOpens']), 'pause; a stopped plan shows the reason and the button that fixes it', r)
        print(ok(r['copy']), 'the plan is copied to another vessel, off, with its own places')
        print('sidefeil:', errs[:4]); await b.close()
asyncio.run(main())
