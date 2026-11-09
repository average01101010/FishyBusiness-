"""Havnmaal (Ø8b S3, docs/planer/spillbarhet-fangst.md V5 A, 09.11.2026): how much fish the model puts inside the harbour basins
against the nearest fishing ground outside, before any rule for fishing inside a harbour in a gale is made (Jonas 06.11.2026:
«ingen ny regel før tettheten i havnebassengene er målt»).

At ten harbours spread along the coast (south, middle and north), in March and in July:
  - the basin: every point 40 m apart that inHarbour (core/01-world.js) gives to this harbour (600 m from the harbour point, 350 m from
    the way in) and that is sea;
  - the ground: the nearest of Fiskeridirektoratet's fishing grounds (feltGeo, core/03j-felt.js) that has one of the jig's species that
    month, up to 150 sea points inside it nearest the harbour (and outside every harbour);
  - Σ density over the jig's species (SP) at each point, ten days at 8-16 every second hour (the stock untouched, no luck, no weather):
    the mean in the basin against the mean on the ground, and the basin's best point against the ground's mean;
  - an hour of the hand jig in a gale (WX_FORCE 15 m/s from the direction that gives the most sea on the ground): fish() and deckMinute()
    minute by minute on the basin's best point and the ground's best point, the sea there (hsAt), the weather's share (wpen) and the kilos,
    and what the model expects (30 × Σ density × effort × the factors, without the dice).
The plan's line: under 20 % of the ground everywhere and V5 A is done (no rule); over 20 % anywhere and B is built (×0.1 in denPlace).
Needs the whole coast in the build (python3 tools/map/release.py, python3 tools/map/game.py, node build.mjs). Not in run.py's lists:
a measurement, run by hand.
  python3 tests/havnmaal.py            prints one JSON line per harbour and month, and the summary; writes tests/out/havnmaal.json
"""
import asyncio, json, os, sys
from _env import GAME_TUT, boot, OUT
from playwright.async_api import async_playwright

URL = GAME_TUT + '#notut,no3d'
# the places along the coast; the nearest receiving plant (a port with a mottak) to each point is measured
PLACES = [('Egersund', 58.45, 5.99), ('Fedje', 60.78, 4.72), ('Ålesund', 62.47, 6.15), ('Kristiansund', 63.11, 7.73), ('Rørvik', 64.86, 11.24),
          ('Bodø', 67.28, 14.40), ('Henningsvær', 68.15, 14.21), ('Husøy', 69.55, 17.66), ('Hammerfest', 70.66, 23.68), ('Båtsfjord', 70.63, 29.72)]
MONTHS = [3, 7]

PICK_JS = """([lat, lon]) => { const c = P(lat, lon); let best = null, bd = 1e9;
  for (const pt of PORTS){ if (!pt.mottak || !pt.p) continue; const d = dist(pt.p, c); if (d < bd){ bd = d; best = pt; } }
  return best && {id:best.id, name:typeof best.name === 'string' ? best.name : (best.name.no || best.name.en), km:+bd.toFixed(1)}; }"""

MEASURE_JS = r"""async ([id, months, y]) => {
  const pt = PORTS.find(q => q.id === id); await mapNeed(pt.p, MAPD.simR);
  const mine = q => dist(q, pt.p) < 0.6 || (pt.app && dist(q, pt.app) < 0.35);
  // the basin: points 40 m apart round the harbour point and the way in
  const B = [], seen = new Set(), st = 0.04;
  for (const c of [pt.p, pt.app].filter(Boolean)) for (let gy = -16; gy <= 16; gy++) for (let gx = -16; gx <= 16; gx++){
    const q = {x:Math.round((c.x + gx * st) / st) * st, y:Math.round((c.y + gy * st) / st) * st}, k = q.x.toFixed(3) + ',' + q.y.toFixed(3);
    if (seen.has(k)) continue; seen.add(k);
    try { if (!mine(q) || !inHarbour(q) || isLand(q)) continue; B.push(q); } catch (e){} }
  const G = feltGeo(), hrs = m => { const a = []; for (let d = 5; d < 15; d++) for (let h = 8; h <= 16; h += 2) a.push((Date.UTC(y, m - 1, d, h) - EPOCH) / 3.6e6); return a; };
  const sum = (q, H) => { let s = 0; for (const sp of SP) s += density(sp, q, H); return s; };
  const out = {id, name:typeof pt.name === 'string' ? pt.name : pt.name.no, nB:B.length, months:[]};
  if (B.length) out.dB = Math.round(B.reduce((a, q) => a + depthF(q), 0) / B.length);
  for (const m of months){
    // the nearest ground with one of the jig's species this month
    let g = null, gd = 1e9;
    for (const c of G){ if (!SP.some(sp => c.sm[sp] && ((c.sm[sp] >> (m - 1)) & 1))) continue;
      if (c.b[0] - pt.p.x > 40 || pt.p.x - c.b[2] > 40 || c.b[1] - pt.p.y > 40 || pt.p.y - c.b[3] > 40) continue;
      const d = Math.max(0, -feltSd(c, pt.p.x, pt.p.y)); if (d < gd){ gd = d; g = c; } }
    const R = {m, ground:g ? (g.f.nf || g.f.n || ('#' + g.f.i)) : null, groundKm:+gd.toFixed(1)};
    if (!g){ out.months.push(R); continue; }
    // up to 150 sea points inside the ground nearest the harbour, outside every harbour
    const w = Math.max(g.b[2] - g.b[0], g.b[3] - g.b[1]), s = Math.max(0.08, w / 60), C = [];
    for (let yy = g.b[1]; yy <= g.b[3]; yy += s) for (let xx = g.b[0]; xx <= g.b[2]; xx += s){ if (feltSd(g, xx, yy) > 0.05) C.push({x:xx, y:yy, d:Math.hypot(xx - pt.p.x, yy - pt.p.y)}); }
    C.sort((a, b) => a.d - b.d);
    const F = [];
    for (const q of C){ if (F.length >= 150) break; try { await mapNeed(q, 2); if (isLand(q) || inHarbour(q)) continue; F.push({x:q.x, y:q.y}); } catch (e){} }
    R.nF = F.length; if (F.length) R.dF = Math.round(F.reduce((a, q) => a + depthF(q), 0) / F.length);
    const H = hrs(m), mean = P => P.map(q => H.reduce((a, h) => a + sum(q, h), 0) / H.length);
    const vb = mean(B), vf = mean(F), avg = v => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    R.basin = +avg(vb).toFixed(4); R.groundMean = +avg(vf).toFixed(4);
    R.basinBest = vb.length ? +Math.max(...vb).toFixed(4) : 0; R.groundBest = vf.length ? +Math.max(...vf).toFixed(4) : 0;
    R.ratio = R.groundMean > 0 ? +(R.basin / R.groundMean).toFixed(3) : null;
    R.ratioBest = R.groundMean > 0 ? +(R.basinBest / R.groundMean).toFixed(3) : null;
    // kg an hour for one person with the hand jig, from the means (30 × Σ density × effort 2)
    R.kghBasin = +(60 * R.basin).toFixed(1); R.kghGround = +(60 * R.groundMean).toFixed(1);
    R.pB = vb.length ? B[vb.indexOf(Math.max(...vb))] : null; R.pF = vf.length ? F[vf.indexOf(Math.max(...vf))] : null;
    out.months.push(R); }
  return out; }"""

# an hour of the hand jig in a gale on one point: fish() and deckMinute() as simday.py plays them, the sea and the weather's share, and the
# kilos the model expects without the dice (fish()'s own sum: 30 × effort × density × luck × target × jig × bite × wpen × pen)
GALE_JS = r"""async ([pB, pF, y, m, w]) => {
  await mapNeed(pB, MAPD.simR); await mapNeed(pF, MAPD.simR);
  const b = S.boat, t0 = Math.round((Date.UTC(y, m - 1, 10, 10) - EPOCH) / 6e4), H0 = t0 / 60;
  // the wind's direction that gives the most sea on the ground
  let dir = 0, hmax = -1; for (let d = 0; d < 360; d += 30){ WX_FORCE = {w, d}; const h = hsAt(pF, H0); if (h > hmax){ hmax = h; dir = d; } }
  WX_FORCE = {w, d:dir};
  const hour = p => {
    S.t = t0; S.hold = []; S.facc = {}; S.fnext = {}; S.ruAt = null; S.fsess = null;
    b.status = 'fishing'; b.port = null; b.pos = {x:p.x, y:p.y}; b.v = 0; b.gop = null; b.deckStop = false; b.deckEnd = null; b.fishUntil = S.t + 60; b.gear = true; S.equip.jukse = 0; b.ice = 150;
    let hs = 0, wp = 0, exp = 0, n = 0; const logN = S.log.length;
    for (let i = 0; i < 60 && b.status === 'fishing'; i++){ S.t++; const H = S.t / 60, W = weAt(H, b.pos), h = hsAt(b.pos, H), f = catchFactors(H, W, h);
      let e = 0; for (const sp of SP) e += 30 * f.eff * density(sp, b.pos, H) * luck(sp) * targetF(sp, H) * (SPECIES[sp].jig != null ? SPECIES[sp].jig : 1) * biteF(sp, b.pos, H) * f.wpen * f.pen / 60;
      exp += e; hs += h; wp += f.wpen; n++;
      fish(H, W, h); deckMinute(); }
    const kg = holdTotal(), lg = S.log.slice(logN).map(x => x.no).filter(Boolean).slice(0, 3);
    return {kg:+kg.toFixed(1), exp:+exp.toFixed(1), hs:+(hs / Math.max(1, n)).toFixed(2), wpen:+(wp / Math.max(1, n)).toFixed(2), min:n, st:b.status, log:lg}; };
  const r = {dir, basin:hour(pB), ground:hour(pF)};
  WX_FORCE = null; b.status = 'idle'; S.hold = []; return r; }"""


async def main():
    res = []
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await br.new_page(viewport={'width': 800, 'height': 600})
        errs = []; pg.on('pageerror', lambda e: errs.append((getattr(e, 'stack', '') or str(e))[:600]))
        await boot(pg, URL)
        await pg.evaluate("S.mult = 1; S.settings.autoOn = false; if (typeof DYN !== 'undefined') DYN.on = false")
        nc = await pg.evaluate("PORTS.filter(q => q.coastal).length")
        if not nc: print('FEIL: the build has no coastal receivers (the whole coast is needed: release.py, game.py, node build.mjs)'); return
        for nm, lat, lon in PLACES:
            pk = await pg.evaluate(PICK_JS, [lat, lon])
            if not pk: print(json.dumps({'place': nm, 'err': 'no port'})); continue
            r = await pg.evaluate(MEASURE_JS, [pk['id'], MONTHS, 2027])
            r.update({'place': nm, 'portKm': pk['km']})
            for R in r['months']:
                if R.get('pB') and R.get('pF'):
                    R['gale'] = await pg.evaluate(GALE_JS, [R['pB'], R['pF'], 2027, R['m'], 15])
                R.pop('pB', None); R.pop('pF', None)
            print(json.dumps(r, ensure_ascii=False), flush=True); res.append(r)
        await br.close()
    rows = [(r['place'], R) for r in res for R in r['months'] if R.get('ratio') is not None]
    over = [(nm, R['m'], R['ratio']) for nm, R in rows if R['ratio'] > 0.2]
    print('summary: %d harbour-months measured; basin/ground (mean) from %.3f to %.3f, median %.3f; the basin\'s best point against the ground\'s mean up to %.3f' % (
        len(rows), min(R['ratio'] for _, R in rows), max(R['ratio'] for _, R in rows), sorted(R['ratio'] for _, R in rows)[len(rows) // 2], max(R['ratioBest'] for _, R in rows)) if rows else 'summary: nothing measured')
    print('over 20 %%: %s' % (over or 'none'))
    print('page errors:', errs[:3])
    os.makedirs(OUT, exist_ok=True); json.dump(res, open(os.path.join(OUT, 'havnmaal.json'), 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    asyncio.run(main())
