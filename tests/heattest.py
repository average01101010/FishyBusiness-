"""The echo-sounder heat map and the fish model under it. Prints OK or FEIL per check, then the page errors.

Part 1, the model: the stock is read between the four nearest cells and a catch is taken from the same four, so the drop where
you fish is exactly kg/K · Σw²; a fished-down cell comes all the way back (rounding used to stop it at 0.876); the stock has no
hard 2 km edges. The hotspots drift instead of jumping every 120 hours, keeping their mean, and the schools average 1.
The first trip: the guaranteed catch is a real skrei patch on the guide's ground, so the heat shows it; the top-up is only a
safety net, and only the stock's own share of the catch is taken from the stock.
Part 2, the chart plotter, in landscape and portrait: the radius of each tier, the heat at the boat is 30·Σdensity, the species
choice only with CHIRP or sonar and without working anything out again, on and off (echo sounder, sonar, port), no number for
the fish in the box, the afterglow, a vessel without a plotter, and the time on a CPU four times slower. Screenshots: tests/out/heat_*.png.
Part 3, the sonar: only on the sjark and the new sjark, 16 hours to fit, the 3 nm heat once fitted, and a fitting paid back if the
boat is traded for one it does not suit. The skiff's console in 3D shows the heat, and «EKKOLODD AV» when it is off.
"""
from _env import GAME, boot
import asyncio, json, time
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def model(pg):
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      S.stock = initStock(); delete S.cstk; S.tut = 0;
      // a sea point well away from the grounds the local fleet works
      let p = null; for (let k = 0; k < 4000 && !p; k++){ const q = LG(4 + (k * 7.31) % 70, 4 + (k * 3.77) % 74);
        if (!isLand(q) && GROUNDS.slice(0, 3).every(g => dist(q, g.p) > 18) && stockW(q).every(([i]) => stkGet(S.stock, i) === 1)) p = q; }
      const R = {p};
      const w = stockW(p), s0 = stockAt(p); takeStock(p, 1500);
      R.drop = s0 - stockAt(p); R.want = 1500 / STK.K * w.reduce((a, [, x]) => a + x * x, 0);
      R.total = w.reduce((a, [i]) => a + (1 - stkGet(S.stock, i)), 0) * STK.K;
      // no step at a cell edge: two cells side by side with different stock
      S.stock = initStock(); const c = Math.floor(p.x / STK.c), e = (c + 1) * STK.c, i0 = stockIdx(p); S.stock[i0] = 0.4;
      R.edge = Math.abs(stockAt({x:e - 1e-4, y:p.y}) - stockAt({x:e + 1e-4, y:p.y}));
      // regrowth all the way back: no other fleets, the whole sea fished down to a half
      const keep = npcStates; npcStates = () => []; S.stock = stockFill(0.5); S.cstk = stockFill(0.1);
      const H0 = (Date.UTC(2028, 5, 1, 0) - EPOCH) / 36e5; let d42 = null;
      for (let h = 0; h < 2400; h++){ stockHour(H0 + h); if (h === 42 * 24) d42 = stkGet(S.stock, i0); }
      npcStates = keep; R.d42 = d42; R.d100 = stkGet(S.stock, i0); R.crab = stkGet(S.cstk, i0);
      S.stock = initStock(); delete S.cstk;
      return R; })())"""))
    check(abs(r['drop'] - r['want']) < 1e-9, 'bestanden synker med nøyaktig kg/K·Σw² der det fiskes', {k: round(r[k], 5) for k in ('drop', 'want')})
    check(abs(r['total'] - 1500) < 1e-6, 'hele fangsten trekkes fra bestanden, fordelt på de fire nærmeste rutene', round(r['total'], 3))
    check(r['edge'] < 1e-3, 'bestanden har ingen brå kant mellom to ruter', round(r['edge'], 6))
    check(r['d42'] >= 0.99 and r['d100'] == 1, 'en rute fisket ned til 0,5 er full igjen etter 42 dager (før stoppet den på 0,876)', {'42 d': r['d42'], '100 d': r['d100']})
    check(r['crab'] >= 0.97, 'krabbebestanden kommer også tilbake (før stoppet den på 0,667)', r['crab'])

    # the fish move along instead of jumping every 120 hours, and the schools average 1
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      const old = (sp, p, H) => { const w = Math.floor(H / 120), n = noise2(LGI(p).x / 3.5 + w * 0.61, LGI(p).y / 3.5 - w * 0.37, 20 + ALLSP.indexOf(sp)); return 0.3 + 1.5 * n * n; };
      const pts = []; for (let k = 0; pts.length < 2000; k++){ const p = LG((k * 7.919) % LEGF.W, (k * 3.141) % LEGF.H); if (!isLand(p)) pts.push(p); }
      const H0 = (Date.UTC(2028, 2, 1, 0) - EPOCH) / 36e5; let a = 0, b = 0, n = 0, sc = 0, jump = 0, step = 0, hour = 0;
      for (let t = 0; t < 24; t++){ const H = H0 + t * 37.3; for (const p of pts.slice(0, 600)) for (const sp of ['torsk', 'hyse', 'sei']){ a += hotspot(sp, p, H); b += old(sp, p, H); sc += school(sp, p, H); n++; } }
      // across a multiple of 120 hours, and from one game minute to the next
      const Hk = Math.ceil(H0 / 120) * 120;
      for (const p of pts.slice(0, 400)){ const sp = 'torsk', h0 = hotspot(sp, p, Hk - 0.5 / 60), h1 = hotspot(sp, p, Hk + 0.5 / 60), m0 = hotspot(sp, p, H0 + 31), m1 = hotspot(sp, p, H0 + 31 + 1 / 60), q0 = hotspot(sp, p, H0 + 50), q1 = hotspot(sp, p, H0 + 51);
        jump = Math.max(jump, Math.abs(h1 - h0) / h0); step = Math.max(step, Math.abs(m1 - m0) / m0); hour += Math.abs(q1 - q0) / q0; }
      return {mean:a / n, oldMean:b / n, school:sc / n, jump, step, hour:hour / 400}; })())"""))
    check(abs(r['mean'] / r['oldMean'] - 1) < 0.02, 'hotspotene har samme snitt som før (±2 %)', {k: round(r[k], 4) for k in ('mean', 'oldMean')})
    check(r['jump'] < 0.01 and r['step'] < 0.01, 'fisken flytter seg jevnt: under 1 % per spillminutt, også over 120-timersskiftet', {k: round(r[k], 5) for k in ('jump', 'step')})
    check(r['hour'] > 0.003, 'men den flytter seg i løpet av en time', round(r['hour'], 4))
    check(abs(r['school'] - 1) < 0.02, 'stimene gir 1 i snitt, så fangsten over en dag endres ikke', round(r['school'], 4))


async def tutorial(pg):
    # the first trip's guarantee is a real skrei patch on the guide's ground: the heat shows it, the boat gets it, the stock keeps it
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      const keep = {tut:S.tut, haill:S.haill}, g = GROUNDS[TUT_FIELD], b = S.boat;
      S.stock = initStock(); S.tut = tutNew(); S.haill = {type:'luksus', t0:0, how:'shop'};
      const H = (Date.UTC(2027, 2, 1, 9) - EPOCH) / 36e5, heat = q => 30 * SP.reduce((a, sp) => a + density(sp, q, H), 0);
      const R = {ring:heat(g.p), edge:heat({x:g.p.x + g.r, y:g.p.y})};
      S.t = Math.round(H * 60); S.hold = []; S.facc = {}; S.fnext = {}; S.haill.t0 = S.t; b.gear = true; b.ice = 150; S.equip.jukse = 0; S.settings.deckFirst = false;
      b.status = 'fishing'; b.pos = {...g.p}; b.fishUntil = S.t + 120; window.TUTTOP = 0;
      const st0 = {...S.stock}, base = (() => { let d = 0, t = 0; for (const sp of SP){ d += density(sp, g.p, H); t += tutBonus(sp, g.p); } return (d - t) / d; })();
      for (let i = 0; i < 400 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 4, 0.4); deckMinute(); }   // deck stops add minutes
      R.hold = holdTotal(); R.top = window.TUTTOP; R.removed = [...new Set(Object.keys(st0).concat(Object.keys(S.stock)))].reduce((a, k) => a + (stkGet(st0, k) - stkGet(S.stock, k)), 0) * STK.K; R.want = (R.hold - R.top) * base;
      S.tut.catch = false; R.after = heat(g.p);
      S.tut = keep.tut; S.haill = keep.haill; b.status = 'port'; S.hold = []; S.stock = initStock();
      return R; })())"""))
    check(r['ring'] >= 100 and r['edge'] < r['ring'] * 0.3, 'første tur: feltet i ringen er varmt (over 100 kg/t), kanten svakere', {k: round(r[k], 1) for k in ('ring', 'edge')})
    check(r['after'] < 40, 'når garantien er over, er feltet vanlig igjen', round(r['after'], 1))
    check(r['hold'] >= 349, 'to timer på feltet gir full last (350 kg)', round(r['hold'], 1))
    check(r['top'] / r['hold'] < 0.35, 'påfyllingen er bare et sikkerhetsnett (under 35 % av fangsten)', round(r['top'] / r['hold'], 3))
    check(abs(r['removed'] - r['want']) < 0.05 * r['want'] + 1, 'bare bestandens egen andel trekkes fra bestanden, ikke skreiflekken eller påfyllingen', {k: round(r[k], 1) for k in ('removed', 'want', 'hold')})


SETUP = """(([tier, chart, mo, gi, echo, sonar]) => { const b = S.boat, g = GROUNDS[gi];
  S.t = Math.round((Date.UTC(2028, mo, 10, 9) - EPOCH) / 6e4); S.stock = initStock(); S.mult = 1; S.tut = 0;
  b.status = 'fishing'; b.port = null; b.pos = {x:g.p.x + 1.2, y:g.p.y + 0.8}; b.fishUntil = S.t + 600; b.gear = true; b.ice = 150; S.plan = null;
  S.equip.chirp = tier !== 'basic'; S.equip.sonar = tier === 'sonar'; S.equip.plotter = chart === 'fish'; S.settings.chart = chart;
  S.settings.echo = echo; S.settings.sonar = sonar; delete S.settings.heatSp;
  heatReset(); openPlotter(); view.cx = b.pos.x; view.cy = b.pos.y; view.z = MAP_H / 9; applyView(); renderBase(); scheduleStatic(); renderDyn(); renderPanel(); heatTick(); return 1; })"""
DONE = "!HEATC.busy && HEATC.qi >= HEATC.queue.length && HEATC.cells.size > 0"


async def ui(pg, tag):
    R = {'basic': 0.5 * 1.852, 'chirp': 0.75 * 1.852, 'sonar': 1.5 * 1.852}
    for tier in ('basic', 'chirp', 'sonar'):
        await pg.evaluate(SETUP, [tier, 'nav', 2, 0, True, True]); await pg.wait_for_function(DONE, timeout=20000); await pg.wait_for_timeout(400)
        r = json.loads(await pg.evaluate("""JSON.stringify((() => { const b = S.boat, H = S.t / 60, s = heatSample(b.pos, H), sum = 30 * SP.reduce((a, sp) => a + density(sp, b.pos, H), 0);
          const cs = HEATC.cs, cc = HEATC.cells.get(heatKey(Math.floor(b.pos.x / cs), Math.floor(b.pos.y / cs))), at = cc.v, ctr = heatSample(cc, cc.t / 60);   // the cell, at the time it was worked out
          return {tier:heatTier(), r:HEAT.tiers[heatTier()].r, px:+heatCv.dataset.r, want:HEAT.tiers[heatTier()].r * view.px, s:heatValue(s, 'all'), sum, cell:heatValue(at, 'all'), ctr:heatValue(ctr, 'all'),
            pick:(plotSetOpen(true), document.querySelectorAll('#plotSet .seg.hsp button').length), note:/Artsvalg krever/.test(document.querySelector('#plotSet .ecs').textContent), box:(plotSetOpen(false), !$('heatBox').hidden), echo:!document.getElementById('echoWrap')}; })())"""))
        check(r['tier'] == tier and abs(r['r'] - R[tier]) < 1e-9, f'{tag}: {tier} har radius {R[tier]:.3f} km ({R[tier] * 2 / 1.852:g} nm i diameter)', r['r'])
        check(abs(r['px'] - r['want']) < 1.5, f'{tag}: {tier}: sirkelen på skjermen er r·view.px', {k: round(r[k], 1) for k in ('px', 'want')})
        check(abs(r['s'] - r['sum']) < 1e-9 and abs(r['cell'] - r['ctr']) < 1e-9, f'{tag}: {tier}: varmen ved båten er 30·Σdensity, og ruta på kartet har verdien i sentrum', {k: round(r[k], 2) for k in ('s', 'sum', 'cell', 'ctr')})
        check((r['pick'] == 4) == (tier != 'basic') and r['note'] == (tier == 'basic'), f'{tag}: {tier}: artsvalg {"finnes" if tier != "basic" else "krever CHIRP eller sonar"}', r['pick'])
        check(r['box'] and r['echo'], f'{tag}: {tier}: skalaen står i toppbaren, og den lille ekkoloddboksen er borte')
        await pg.screenshot(path=f'heat_{tag}_{tier}_nav.png')
    # the fishing chart with CHIRP, for the screenshots
    await pg.evaluate(SETUP, ['chirp', 'fish', 2, 0, True, True]); await pg.wait_for_function(DONE, timeout=20000); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'heat_{tag}_chirp_fish.png')

    # on and off: the echo sounder off hides it, the sonar alone shows it, both off hides it, and in port there is nothing
    out = {}
    for name, args in [('ekko av', ['chirp', 'nav', 2, 0, False, True]), ('sonar alene', ['sonar', 'nav', 2, 0, False, True]), ('begge av', ['sonar', 'nav', 2, 0, False, False])]:
        await pg.evaluate(SETUP, args); await pg.wait_for_timeout(700)
        out[name] = json.loads(await pg.evaluate("JSON.stringify({tier:heatTier(), on:heatCv.dataset.on, box:!$('heatBox').hidden, echo:false})"))
    await pg.evaluate("(() => { const b = S.boat, p = portById('husoy'); b.status = 'port'; b.port = 'husoy'; b.pos = {...p.p}; S.settings.echo = true; S.settings.sonar = true; heatPaint(); })()"); await pg.wait_for_timeout(500)
    out['i havn'] = json.loads(await pg.evaluate("JSON.stringify({tier:heatTier(), on:heatCv.dataset.on})"))
    check(out['ekko av']['tier'] is None and not out['ekko av']['on'] and not out['ekko av']['box'] and not out['ekko av']['echo'], f'{tag}: ekkoloddet av skjuler varmekartet og skalaen i toppbaren', out['ekko av'])
    check(out['sonar alene']['tier'] == 'sonar' and out['sonar alene']['on'] == 'sonar', f'{tag}: sonaren alene viser varmekartet', out['sonar alene'])
    check(out['begge av']['tier'] is None and not out['begge av']['on'], f'{tag}: ekkolodd og sonar av: ingenting vises', out['begge av'])
    check(out['i havn']['tier'] and not out['i havn']['on'], f'{tag}: i havn tegnes ikke varmekartet', out['i havn'])

    # the species: switching redraws without working anything out again
    await pg.evaluate(SETUP, ['chirp', 'nav', 2, 0, True, True]); await pg.wait_for_function(DONE, timeout=20000); await pg.wait_for_timeout(300)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const n0 = HEATC.stats.n; plotSetOpen(true); const b = document.querySelector('#plotSet .seg.hsp button[data-s=torsk]'); b.click(); plotSetOpen(false);
      const v = heatAt(S.boat.pos); return {sp:heatSpecies(), n:HEATC.stats.n - n0, cod:v[0], all:heatValue(v, 'all'), chip:document.querySelector('#heatBox .hb-sp').textContent}; })())"""))
    check(r['sp'] == 'torsk' and r['n'] == 0 and r['cod'] < r['all'] and 'Torsk' in r['chip'], f'{tag}: artsvalget bytter til torsk uten ny utregning, og brikka på kartet viser arten', r)

    # the box never shows a number for the fish: no kilos, no rates, only «Lite fisk» to «Mye fisk»; and the afterglow fades
    await pg.wait_for_timeout(1200)
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const tx = $('heatBox').textContent; return {tx, kg:/kg|\\d+\\s*%/.test(tx), scale:/lite/.test(tx) && /mye fisk/.test(tx)}; })())"""))
    check(not r['kg'] and r['scale'], f'{tag}: boksen viser ingen tall for fisken, bare en skala fra «Lite fisk» til «Mye fisk»', r['tx'][:90])
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const b = S.boat, p0 = {...b.pos}, k = heatKey(Math.floor(p0.x / HEATC.cs), Math.floor(p0.y / HEATC.cs));
      b.pos = {x:p0.x + 3.5, y:p0.y}; S.t += 10; heatTick(); const c = HEATC.cells.get(k), a10 = c ? 0.6 * Math.max(0, 1 - (S.t - c.seen) / HEAT.glow) : null;
      S.t += 21; heatTick(); const gone = !HEATC.cells.get(k); b.pos = p0; return {a10, gone}; })())"""))
    check(r['a10'] is not None and 0.3 < r['a10'] < 0.5 and r['gone'], f'{tag}: etterglød: feltet bak båten blekner (0,4 etter 10 min) og er borte etter 31', r)

    # a vessel without a plotter shows the navigation chart, and the wish for the fishing chart is kept
    r = json.loads(await pg.evaluate("(() => { S.settings.chart = 'fish'; S.equip.plotter = false; renderBase(); return JSON.stringify({mode:chartMode(), nav:svg.classList.contains('nav'), kept:S.settings.chart}); })()"))
    check(r['mode'] == 'nav' and r['nav'] and r['kept'] == 'fish', f'{tag}: en båt uten kartplotter viser navigasjonskart, og ønsket om fiskekart beholdes', r)


async def sonar(pg):
    # the sonar is sold for the sjark and the new sjark only, fits in 16 hours, and gives the 3 nm heat; a fitting that waits while
    # the boat is traded for one it does not suit is paid back
    r = json.loads(await pg.evaluate("""JSON.stringify((() => { const b = S.boat, R = {}, p = portById('husoy');
      b.status = 'port'; b.port = 'husoy'; b.pos = {...p.p}; S.cash = 1e6; S.jobs = []; S.equip.sonar = false; S.settings.sonar = true; S.settings.echo = true;
      for (const ty of ['skiff', 'snekke', 'sjark', 'sjarkny']){ b.type = ty; applyVessel(); PHONE.open('utstyr'); const btn = document.querySelector('#drawerBody [data-pa=equip][data-k=sonar]'); R[ty] = btn ? btn.textContent : null; }
      // buy it on the sjark and let the yard finish
      b.type = 'sjark'; applyVessel(); PHONE.open('utstyr'); const c0 = S.cash; document.querySelector('#drawerBody [data-pa=equip][data-k=sonar]').click();
      R.paid = c0 - S.cash; R.queued = (S.jobs || []).some(j => j.kind === 'fit' && j.k === 'sonar'); const j = S.jobs.find(j => j.k === 'sonar'); finishJob(j); S.jobs = S.jobs.filter(q => q !== j);
      R.fitted = !!S.equip.sonar; R.tier = heatTier(); R.r = HEAT.tiers[R.tier].r;
      DOCK.open('beholdning:boat'); R.listed = /Sonar/.test(document.getElementById('drawerBody').textContent);
      // a fitting left waiting while the boat became a skiff
      S.equip.sonar = false; const c1 = S.cash; queueJob({kind:'fit', k:'sonar', h:fitHours('sonar'), no:'Sonar', en:'Sonar'}); b.type = 'skiff'; applyVessel(); finishJob(S.jobs[S.jobs.length - 1]); S.jobs = [];
      R.refund = S.cash - c1; R.skiffSonar = !!S.equip.sonar; DOCK.close();
      return R; })())"""))
    check(r['skiff'] is None and r['snekke'] is None and r['sjark'] and r['sjarkny'], 'sonaren tilbys bare på sjark og ny sjark', {k: r[k] for k in ('skiff', 'snekke', 'sjark', 'sjarkny')})
    check('16 t' in (r['sjark'] or '') and 'undefined' not in (r['sjark'] or ''), 'knappen viser monteringstida 16 t', r['sjark'])
    check(r['paid'] == 150000 and r['queued'] and r['fitted'] and r['tier'] == 'sonar' and abs(r['r'] - 2.778) < 0.001 and r['listed'], 'kjøpt og montert: sonaren gir varmekart 3 nm i diameter og står under Båten i Beholdning', {k: r[k] for k in ('paid', 'tier', 'r', 'listed')})
    check(r['refund'] == 150000 and not r['skiffSonar'], 'en montering som venter mens båten byttes til en som ikke passer, betales tilbake', {k: r[k] for k in ('refund', 'skiffSonar')})


async def console3d(pg):
    # the skiff's console in 3D shows the same heat, and «EKKOLODD AV» when the echo sounder is off
    await pg.evaluate(SETUP, ['chirp', 'nav', 2, 0, True, True])
    await pg.evaluate("(() => { S.boat.type = 'skiff'; applyVessel(); G3.show(true); })()")
    await pg.wait_for_function(DONE, timeout=20000); await pg.wait_for_timeout(4000)
    import base64
    for name, echo in [('heat_konsoll.png', True), ('heat_konsoll_av.png', False)]:
        await pg.evaluate(f"(() => {{ S.settings.echo = {'true' if echo else 'false'}; G3._debug.SK.tP = 0; }})()"); await pg.wait_for_timeout(1500)
        url = await pg.evaluate("G3._debug.SK.cvP.toDataURL('image/png')")
        open(name, 'wb').write(base64.b64decode(url.split(',')[1]))
    r = json.loads(await pg.evaluate("JSON.stringify({g3:G3.isActive(), tier:heatTier()})"))
    check(r['g3'], 'konsollen i 3D tegnes (tests/out/heat_konsoll.png og heat_konsoll_av.png)', r)
    await pg.evaluate("(() => { S.settings.echo = true; G3.show(false); })()")


async def perf(pg, cdp):
    # a tablet stand-in: the CPU four times slower; no slice may hold up a frame, and the sonar's whole disk comes within 3 s.
    # The best of up to three runs counts (garbage collection or a busy test machine can stretch a slice); every run is printed
    # (the 3D view is hidden while measuring: SwiftShader draws 3D on the CPU, and with the CPU throttled each frame takes many seconds,
    # which says nothing about the heat slices; on the tablet the GPU draws 3D)
    was3d = await pg.evaluate("G3.isActive()"); await pg.evaluate("G3.show(false)")
    runs = []
    for k in range(3):
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
        await pg.evaluate(SETUP, ['sonar', 'nav', 2, 0, True, True])
        t = await pg.evaluate("""new Promise(res => { HEATC.stats = {slices:0, maxSlice:0, n:0, ms:0, over:0}; heatReset(); const t0 = performance.now(); heatTick();
          const w = () => { if (!HEATC.busy && HEATC.qi >= HEATC.queue.length) res(JSON.stringify({ms:performance.now() - t0, ...HEATC.stats})); else setTimeout(w, 20); }; w(); })""")
        await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
        r = json.loads(t); runs.append(r); print('· %4.0f s  perf run %d: %d ms' % (time.time() - T0, k + 1, round(r['ms'])), flush=True)
        # a slice is 5 ms of work; one slice over a frame (16 ms) is let through, never two, and none over two frames
        if r.get('over', 0) <= 1 and r['maxSlice'] < 33 and r['ms'] < 3000: break
    if was3d: await pg.evaluate("G3.show(true)")
    r = runs[-1]
    check(r.get('over', 0) <= 1 and r['maxSlice'] < 33 and r['ms'] < 3000, 'ytelse (CPU ×4): bitene holder seg under én skjermramme (16 ms, høyst én unntak), og hele sonarsirkelen kommer på under 3 s', {'ms': round(r['ms']), 'biter': r['slices'], 'over 16 ms': r.get('over', 0), 'lengste': round(r['maxSlice'], 1), 'ruter': r['n'], 'µs/rute': round(r['ms'] / max(1, r['n']) * 1000, 1), 'forsøk': [(round(x['ms']), round(x['maxSlice'], 1), x.get('over', 0)) for x in runs]})


T0 = time.time()
stage = lambda s: print('· %4.0f s  %s done' % (time.time() - T0, s), flush=True)   # progress, so a run that runs out of time shows where it was


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []
        for (W, H, tag) in [(1280, 800, 'liggende'), (915, 1208, 'staaende')]:
            ctx = await b.new_context(viewport={'width': W, 'height': H}, has_touch=True)
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg)
            await pg.wait_for_function("typeof DEPTH !== 'undefined' && DEPTH", timeout=60000)
            if tag == 'liggende':
                await model(pg); stage('model')
                await tutorial(pg); stage('tutorial')
                await perf(pg, cdp); stage('perf')
                await sonar(pg); stage('sonar')
                await console3d(pg); stage('console3d')
            await ui(pg, tag); stage('ui ' + tag)
            await ctx.close()
        print(errs)
        await b.close()

asyncio.run(main())
