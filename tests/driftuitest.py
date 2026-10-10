"""The Drift app (ui/05c-drift.js): a plan is made, a rig chosen, sessions added, the route of a trip drawn in the plotter from a start
that is not where the boat lies, saved back to the plan; the overview approves it and the plan is switched on."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright
ok = lambda c: 'OK  ' if c else 'FEIL'

JS = """(async () => {
  const R = {}; S.tut = 0; S.settings.lang = 'no'; S.lang = 'no';
  const b = S.boat; b.status = 'port'; b.port = 'husoy'; b.pos = {...portById('husoy').p}; S.plan = null; S.ops = null; S.draft = [];
  const ole = Object.assign(genCrew(), {bi:false, off:false, name:'Ole Mikalsen'}); S.crew = [ole];
  const page = () => PHONE.page('drift');
  const act = (a, d) => PHONE.dact('drift', a, d || {});
  R.p0 = page().includes('dr-znew');
  act('dr-new'); R.o = !!S.ops && S.ops.v === 2;
  R.p1 = page().includes('Oppsett') && page().includes('Økter') && page().includes('Oversikt');
  R.soonDisabled = /<button disabled[^>]*>Bunntrål/.test(page());
  act('dr-add'); const sid = S.ops.sess[0].id; R.sess = S.ops.sess.length;
  R.notOk = !driftCheck(S.ops).ok;
  // draw a route from Husøy: out to a point and home again
  act('dr-draw', {id:sid}); R.ctx = !!DRIFTCTX && DRIFTCTX.home === 'husoy';
  const HP = portById('husoy'), q = {x:HP.p.x + 6, y:HP.p.y - 3};
  S.draft = [{x:q.x, y:q.y, port:null, fish:1}, {x:HP.p.x, y:HP.p.y, port:'husoy', fish:0}];
  R.origin = draftOrigin().x === HP.p.x; R.port = draftPort();
  R.est = estimate().nm > 5; const ok1 = DRIFTUI.saveRoute(); R.saved = ok1 && !DRIFTCTX && S.draft.length === 0;
  const s = S.ops.sess[0]; R.route = s.route && s.route.wps.length === 2 && s.route.end === 'husoy' && s.route.home === 'husoy';
  R.closed = driftCheck(S.ops).ok;
  // a trip that starts elsewhere is drawn from there, not from the boat
  act('dr-add'); const sid2 = S.ops.sess[1].id; const SH = portById('senjahopen'); S.ops.sess[0].route.end = 'senjahopen'; S.ops.sess[0].route.wps[1] = {x:SH.p.x, y:SH.p.y, port:'senjahopen', fish:0};
  act('dr-draw', {id:sid2}); R.ctx2 = DRIFTCTX && DRIFTCTX.home === 'senjahopen'; R.origin2 = Math.abs(draftOrigin().x - SH.p.x) < 1e-6 && draftOrigin().x !== quayPos(b).x; R.port2 = draftPort();
  DRIFTUI.cancelRoute(); R.cancelled = !DRIFTCTX && !S.draft.length;
  // a rest session and the overview
  act('dr-addrest'); R.rest = S.ops.sess.some(x => x.type === 'hvile');
  R.html = page(); R.bar = R.html.includes('dr-bar'); R.prevBtn = R.html.includes('dr-prev');
  act('dr-prev'); R.prevList = page().includes('dr-ev');
  // a rest at anchor: the place is found, with its shelter and the limits of the boat
  { const rs = S.ops.sess.find(x => x.type === 'hvile'); act('dr-at', {id:rs.id, p:'anker'}); R.ankerSet = rs.at === 'anker' && !!rs.near; await new Promise(r => setTimeout(r, 1500));
    R.ankerPos = !!rs.pos; const h = page(); R.ankerUi = /Ankerplass/.test(h) && /begynner å slepe/.test(h); act('dr-at', {id:rs.id, p:'husoy'}); R.ankerBack = rs.at === 'husoy' && !rs.pos; }
  // rig change clears the stations of the other gear
  act('dr-rig', {r:'line'}); R.rig = S.ops.rig === 'line';
  act('dr-w', {d:'2'}); R.wind = S.ops.wx.wind === 14; act('dr-hs', {d:'0.5'}); R.hs = S.ops.wx.hs === 3;
  act('dr-stock', {k:'ice'}); R.stock = S.ops.stock.ice === false;
  act('dr-tplsave', {}); 
  return R; })()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await b.new_page(viewport={'width': 900, 'height': 700}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept('Min mal')))
        await boot(pg); pg.set_default_timeout(120000)
        r = await pg.evaluate(JS); r.pop('html', None)
        print(json.dumps(r, ensure_ascii=False))
        for k, label in [('p0', 'tom side har «Lag driftsplan»'), ('o', 'ny plan er v2'), ('p1', 'oppsett, økter og oversikt vises'), ('soonDisabled', 'trål er sperret'), ('notOk', 'plan uten rute er ikke godkjent'),
                         ('ctx', 'Tegn rute setter startsted'), ('origin', 'plotteren tegner fra turens start'), ('est', 'estimatet bruker turens start'), ('saved', 'ruta lagres i planen'), ('route', 'ruta har start og slutt'), ('closed', 'lukket plan godkjennes'),
                         ('ctx2', 'tur 2 starter i havna forrige tur sluttet'), ('origin2', 'tur 2 tegnes fra den havna, ikke fra båten'), ('cancelled', 'avbryt rydder opp'), ('rest', 'hviløkt'), ('bar', 'døgnstolpen vises'), ('prevList', 'test av planen viser hendelser'),
                         ('rig', 'bytte av utstyr'), ('wind', 'vindgrense'), ('hs', 'sjøgrense'), ('stock', 'bunkring av/på')]:
            print(ok(r.get(k)), label)
        print(ok(r['ankerSet'] and r['ankerPos'] and r['ankerUi'] and r['ankerBack']), 'hvile ved anker: ankerplass funnet, med skjerming og båtens grenser')
        print(ok(r['port'] == 'husoy' and r['port2'] == 'senjahopen'), 'draftPort følger turens start')
        print('sidefeil', errs[:3]); await b.close()
asyncio.run(main())
