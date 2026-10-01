"""The echo-sounder heat map and the fish model under it. Prints OK or FEIL per check, then the page errors.

Part 1, the model: the stock is read between the four nearest cells and a catch is taken from the same four, so the drop where
you fish is exactly kg/K · Σw²; a fished-down cell comes all the way back (rounding used to stop it at 0.876); the stock has no
hard 2 km edges. The hotspots drift instead of jumping every 120 hours, keeping their mean, and the schools average 1.
The first trip: the guaranteed catch is a real skrei patch on the guide's ground, so the heat shows it; the top-up is only a
safety net, and only the stock's own share of the catch is taken from the stock.
"""
from _env import GAME
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


async def model(pg):
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      S.stock = initStock(); delete S.cstk; S.tut = 0;
      // a sea point well away from the grounds the local fleet works
      let p = null; for (let k = 0; k < 4000 && !p; k++){ const q = {x:4 + (k * 7.31) % 70, y:4 + (k * 3.77) % 74};
        if (!isLand(q) && GROUNDS.slice(0, 3).every(g => dist(q, g.p) > 18) && stockW(q).every(([i]) => S.stock[i] === 1)) p = q; }
      const R = {p};
      const w = stockW(p), s0 = stockAt(p); takeStock(p, 1500);
      R.drop = s0 - stockAt(p); R.want = 1500 / STK.K * w.reduce((a, [, x]) => a + x * x, 0);
      R.total = w.reduce((a, [i]) => a + (1 - S.stock[i]), 0) * STK.K;
      // no step at a cell edge: two cells side by side with different stock
      S.stock = initStock(); const c = Math.floor(p.x / STK.c), e = (c + 1) * STK.c, i0 = stockIdx(p); S.stock[i0] = 0.4;
      R.edge = Math.abs(stockAt({x:e - 1e-4, y:p.y}) - stockAt({x:e + 1e-4, y:p.y}));
      // regrowth all the way back: no other fleets, the whole sea fished down to a half
      const keep = npcStates; npcStates = () => []; S.stock = new Array(STK.nx * STK.ny).fill(0.5); S.cstk = new Array(STK.nx * STK.ny).fill(0.1);
      const H0 = (Date.UTC(2028, 5, 1, 0) - EPOCH) / 36e5; let d42 = null;
      for (let h = 0; h < 2400; h++){ stockHour(H0 + h); if (h === 42 * 24) d42 = S.stock[i0]; }
      npcStates = keep; R.d42 = d42; R.d100 = S.stock[i0]; R.crab = S.cstk[i0];
      S.stock = initStock(); delete S.cstk;
      return R; })())"""))
    check(abs(r['drop'] - r['want']) < 1e-9, 'bestanden synker med nøyaktig kg/K·Σw² der det fiskes', {k: round(r[k], 5) for k in ('drop', 'want')})
    check(abs(r['total'] - 1500) < 1e-6, 'hele fangsten trekkes fra bestanden, fordelt på de fire nærmeste rutene', round(r['total'], 3))
    check(r['edge'] < 1e-3, 'bestanden har ingen brå kant mellom to ruter', round(r['edge'], 6))
    check(r['d42'] >= 0.99 and r['d100'] == 1, 'en rute fisket ned til 0,5 er full igjen etter 42 dager (før stoppet den på 0,876)', {'42 d': r['d42'], '100 d': r['d100']})
    check(r['crab'] >= 0.97, 'krabbebestanden kommer også tilbake (før stoppet den på 0,667)', r['crab'])

    # the fish move along instead of jumping every 120 hours, and the schools average 1
    r = json.loads(await pg.evaluate("""JSON.stringify((() => {
      const old = (sp, p, H) => { const w = Math.floor(H / 120), n = noise2(p.x / 3.5 + w * 0.61, p.y / 3.5 - w * 0.37, 20 + ALLSP.indexOf(sp)); return 0.3 + 1.5 * n * n; };
      const pts = []; for (let k = 0; pts.length < 2000; k++){ const p = {x:(k * 7.919) % MAP_W, y:(k * 3.141) % MAP_H}; if (!isLand(p)) pts.push(p); }
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
      const st0 = S.stock.slice(), base = (() => { let d = 0, t = 0; for (const sp of SP){ d += density(sp, g.p, H); t += tutBonus(sp, g.p); } return (d - t) / d; })();
      for (let i = 0; i < 400 && b.status === 'fishing'; i++){ S.t++; fish(S.t / 60, 4, 0.4); deckMinute(); }   // deck stops add minutes
      R.hold = holdTotal(); R.top = window.TUTTOP; R.removed = st0.reduce((a, v, i) => a + (v - S.stock[i]), 0) * STK.K; R.want = (R.hold - R.top) * base;
      S.tut.catch = false; R.after = heat(g.p);
      S.tut = keep.tut; S.haill = keep.haill; b.status = 'port'; S.hold = []; S.stock = initStock();
      return R; })())"""))
    check(r['ring'] >= 100 and r['edge'] < r['ring'] * 0.3, 'første tur: feltet i ringen er varmt (over 100 kg/t), kanten svakere', {k: round(r[k], 1) for k in ('ring', 'edge')})
    check(r['after'] < 40, 'når garantien er over, er feltet vanlig igjen', round(r['after'], 1))
    check(r['hold'] >= 349, 'to timer på feltet gir full last (350 kg)', round(r['hold'], 1))
    check(r['top'] / r['hold'] < 0.35, 'påfyllingen er bare et sikkerhetsnett (under 35 % av fangsten)', round(r['top'] / r['hold'], 3))
    check(abs(r['removed'] - r['want']) < 0.05 * r['want'] + 1, 'bare bestandens egen andel trekkes fra bestanden, ikke skreiflekken eller påfyllingen', {k: round(r[k], 1) for k in ('removed', 'want', 'hold')})


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--disable-gpu-compositing', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(GAME); await pg.wait_for_timeout(1200); await pg.click('#obGo'); await pg.wait_for_timeout(500)
        await pg.wait_for_function("typeof DEPTH !== 'undefined' && DEPTH", timeout=60000)
        await model(pg)
        await tutorial(pg)
        print(errs)
        await b.close()

asyncio.run(main())
