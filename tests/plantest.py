# The plan maker (core/06f-plan.js): the questions make a day that lands and keeps the rest. Jigging only, and line with the jig; the plan's
# check passes, the day is within the work hours and the rest is had in one stretch at the base, and the engine runs the day.
import asyncio, json
from playwright.async_api import async_playwright
from _env import *
ok = lambda c: 'OK  ' if c else 'FEIL'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        r = await pg.evaluate("""async () => { const R = {}, b = S.boat; S.tut = 0; S.cash = 1e7; S.settings.autoOn = false; S.crew = [Object.assign(genCrew(), {bi:false, off:false})];
          const home = portById(S.home || HOME0); R.home = home.id; R.restOk = planRestOk(home.id);
          const g = GROUNDS.slice().sort((x, y) => dist(x.p, home.p) - dist(y.p, home.p))[0]; R.gd = Math.round(dist(g.p, home.p));
          // jigging only
          const a = planWizDefaults(); a.base = home.id; a.gear = 'juksa'; a.jp = {x:g.p.x, y:g.p.y}; a.start = 5;
          const o = S.ops = driftNew(); o.wiz = a; await new Promise(res => planBuild(o, res));
          const C = driftCheck(o); R.j = {err:a.err, ok:C.ok, errors:C.errors.slice(0, 2), trips:a.est && a.est.trips, work:a.est && a.est.work, rest:a.est && a.est.rest, sess:o.sess.map(s => s.type + (s.asap ? '*' : '')), first:o.sess[0].route && o.sess[0].route.home, last:o.sess[o.sess.length - 1].at, tl:a.est ? a.est.tl.length : 0};
          // line and the jig
          S.equip.linehaler = true; S.pgear.lines.hyse.n = 4; S.pgear.lines.hyse.baited = 4;
          const a2 = Object.assign({}, a, {gear:'line', jig:true, gp:{x:g.p.x + 0.4, y:g.p.y}, jp:null, est:null});
          const o2 = driftNew(); o2.wiz = a2; await new Promise(res => planBuild(o2, res));
          const C2 = driftCheck(o2), st = o2.sess.flatMap(s => s.route ? s.route.wps.filter(w => w.act) : []);
          R.l = {err:a2.err, ok:C2.ok, errors:C2.errors.slice(0, 2), trips:a2.est && a2.est.trips, work:a2.est && a2.est.work, stations:st.length, final:st.map(w => !!w.act.final)};
          // a place too far for a day with rest
          const a3 = Object.assign({}, a, {jp:{x:home.p.x + 400, y:home.p.y}, est:null}), o3 = driftNew(); o3.wiz = a3; await new Promise(res => planBuild(o3, res)); R.far = a3.err;
          // no expected catch is shown: the timeline has no kilos
          R.noKg = !a.est.tl.some(x => /kg/.test(x.no));
          return R; }""")
        print(json.dumps(r, ensure_ascii=False)[:1500])
        j, l = r['j'], r['l']
        print(ok(r['restOk']), 'the home naust is a place the crew can sleep', r['home'])
        print(ok(not j['err'] and j['ok'] and j['trips'] >= 1), 'a jigging plan is made and its check passes', [j['err'], j['errors'], j['trips']])
        print(ok(j['work'] is not None and j['work'] <= 14 and j['rest'] >= 10), 'the working day is within 14 hours, and 10 hours of rest in one stretch', [j['work'], j['rest']])
        print(ok(j['first'] == r['home'] and j['last'] == r['home'] and j['sess'][-1] == 'hvile*' and all(s.endswith('*') for s in j['sess'][1:])), 'the day starts and ends at the base, the later trips follow straight on', [j['first'], j['last'], j['sess']])
        print(ok(not l['err'] and l['ok'] and l['stations'] >= 2 and l['final'][-1]), 'a line plan sets the gear and hauls it the same day, with the jig in between', l)
        print(ok(bool(r['far'])), 'grounds too far for a day with rest are refused with a reason', r['far'])
        print(ok(r['noKg']), 'the plan shows no expected catch', r['noKg'])
        # the engine runs the jigging plan for a day: out, lands, rests at the base, and waits out the rest before the next day
        e = await pg.evaluate("""async () => { const R = {}, o = S.ops, b = S.boat, home = o.wiz.base;
          b.status = 'port'; b.port = home; b.pos = {...portById(home).p};
          const H = S.t / 60; o.wiz.start = Math.floor(driftHod(H)) + 1; await new Promise(res => planBuild(o, res));
          o.on = true; o.a0 = null; o.idx = 0; o.cn = 0; o.hold = 0;
          const t0 = S.t; let left = null, landed = 0, restAt = null, out2 = null;
          for (let i = 0; i < 60 * 40; i++){ step(); if (left == null && b.status !== 'port') left = S.t;
            if (o.restT0 != null && restAt == null) restAt = o.restT0;
            if (restAt != null && out2 == null && b.status !== 'port' && S.t > restAt + 30) out2 = S.t;
            if (out2 != null) break;
            if (i % 120 === 0) await new Promise(r => setTimeout(r, 0)); }
          R.left = left != null ? Math.round((left - t0) / 60 * 10) / 10 : null; R.landings = o.rep.length; R.kg = o.rep.reduce((a, x) => a + x.kg, 0);
          R.restAt = restAt != null; R.restH = restAt != null && out2 != null ? Math.round((out2 - restAt) / 60 * 10) / 10 : null; R.paused = o.paused; return R; }""")
        print('engine:', json.dumps(e, ensure_ascii=False))
        print(ok(e['left'] is not None and e['landings'] >= 1), 'the plan goes out and lands', e)
        print(ok(e['restAt'] and (e['restH'] is None or e['restH'] >= 10)), 'the boat rests at the base, and the next day waits until 10 hours of rest are had', e)
        # the questions in the app, tapped through: base, gear, place (a catch mark), weather, make, use
        u = await pg.evaluate("""async () => { const R = {}, b = S.boat; S.ops = null; b.status = 'port'; b.port = S.home || HOME0; b.pos = {...portById(b.port).p};
          const home = portById(b.port), g = GROUNDS.slice().sort((x, y) => dist(x.p, home.p) - dist(y.p, home.p))[0]; S.marks.push({x:g.p.x, y:g.p.y, t:S.t, kgph:60, q:1});
          DOCK.open('drift'); const D = () => document.getElementById('drawerBody'), tap = sel => { const e = D().querySelector(sel); if (!e || e.disabled) return false; e.click(); return true; };
          R.intro = tap('[data-pa=dr-znew]'); R.s0 = D().querySelectorAll('[data-pa=dr-zbase]').length; tap('[data-pa=dr-zbase]'); R.n0 = tap('[data-pa=dr-zstep][data-s="1"]');
          tap('[data-pa=dr-zgear][data-g=juksa]'); R.n1 = tap('[data-pa=dr-zstep][data-s="2"]');
          R.mark = D().innerHTML.includes('Fangstplass ('); R.noHeat = !/ca\. \d+ kg\/t på juksa/.test(D().innerHTML); tap('[data-pa=dr-zspot][data-k=jp][data-i="0"]'); R.n2 = tap('[data-pa=dr-zstep][data-s="3"]');
          tap('[data-pa=dr-zwx][data-v=safe]'); R.n3 = tap('[data-pa=dr-zstep][data-s="4"]'); R.make = tap('[data-pa=dr-zbuild]');
          for (let i = 0; i < 100 && !(S.ops && S.ops.wiz && (S.ops.wiz.est || S.ops.wiz.err)); i++) await new Promise(r => setTimeout(r, 100));
          DOCK.open('drift'); R.err = S.ops.wiz.err; R.use = tap('[data-pa=dr-zuse]'); R.on = !!(S.ops && S.ops.on); R.summary = /Fangstrapport/.test(D().innerHTML) && /Endre planen/.test(D().innerHTML);
          R.wx = S.ops.wx.wind; DOCK.close(); return R; }""")
        print('ui:', json.dumps(u, ensure_ascii=False))
        print(ok(u['intro'] and u['s0'] >= 1 and u['n0'] and u['n1'] and u['n2'] and u['n3'] and u['make'] and not u['err']), 'the questions are tapped through one at a time and the plan is made', u)
        print(ok(u['mark'] and u['noHeat']), 'the places show the catch you had there, not what the sea holds', [u['mark'], u['noHeat']])
        print(ok(u['use'] and u['on'] and u['summary'] and u['wx'] == 10), 'the plan is switched on; the page shows the day, Change and the catch report; careful weather is 10 m/s', u)
        # tilbakemelding 09.10.2026: at sea, «Velg i kartet» and then leaving the questions must not move the start of the boat's own route
        f = await pg.evaluate("""(() => { const R = {}, b = S.boat, home = portById(S.home || HOME0); S.ops = null; b.status = 'idle'; b.port = null; b.pos = {x:home.p.x + 3, y:home.p.y - 2}; b.v = 0; S.plan = null; S.draft = [];
          DRIFTUI.act('dr-znew', {}); DRIFTUI.act('dr-zstep', {s:'2'}); DRIFTUI.act('dr-zspot', {k:'jp', i:'map'}); R.picking = !!(DRIFTCTX && DRIFTCTX.spot);
          const o = draftOrigin(); R.originBoat = dist(o, b.pos) < 0.05; R.portNull = draftPort() == null;
          DRIFTUI.act('dr-zcancel', {}); R.cleared = DRIFTCTX === null;
          DRIFTCTX = {vid:S.cur, spot:'jp'}; R.staleOrigin = dist(draftOrigin(), b.pos) < 0.05; DRIFTUI.page(); R.staleCleared = DRIFTCTX === null; return R; })()""")
        print('spot:', json.dumps(f))
        print(ok(f['picking'] and f['originBoat'] and f['portNull'] and f['cleared'] and f['staleOrigin'] and f['staleCleared']), 'picking a place for the plan never moves the start of the route from the boat, and leaving the questions clears it', f)
        print(ok(not errs), 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
