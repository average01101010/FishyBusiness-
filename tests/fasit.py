"""The model against the real fishing (02.11.2026, docs/systemer/fiskerimodellen.md 5.3e): how well the game's density (the whole model:
the field from the landing notes, the migrations, the skrei front, the baseline of the fleet's pressure, depth, exposure, temperature)
agrees with what the fleet actually caught per landing, location by location and month by month, in a year of landing notes.

  KYST_DIST=<build> FASIT_TRUTH=<fiske json of one year> FASIT_LABEL=<name> python3 tests/fasit.py

FASIT_TRUTH is a fiske.json made by tools/npc/fiske.py for one year (KYST_FISKE=<file> python3 tools/npc/fiske.py 2025). For a test
outside the data the build is made with the notes of another year (2024) and compared with 2025; the ceiling is how well 2024's notes
alone foretell 2025's (tests/fasit_ref.py), the floor the game from before B2 (one table for the whole coast).

The truth per location and month is the catch per landing against the national mean for the same gear and length group, times the
share of the location's landings that had the species (as 03f-fiske.js reads the notes), where at least 5 landings had it. The model per
location and month is the mean of density() over up to 6 points of water 20-300 m deep in the location, at 08, 12 and 16 on the 5th,
15th and 25th, with the players' deviation untouched. The measure is Spearman's rank correlation (1 is the same order, 0 none):
  all     over every location × month with a figure
  place   between the locations, the year's mean
  season  through the year, the coast's mean per month
Writes tests/out/fasit-<label>.json and prints the measures."""
import os, sys, json, math, asyncio
from _env import GAME, boot
from playwright.async_api import async_playwright

SPS = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite']
HERE = os.path.dirname(os.path.abspath(__file__))

def truth_index(F, sp):
    """{lokcode: [12 values or None]} from a fiske.json (unsmoothed, as fkBuild reads it)"""
    M, o = F['meta'], F['sp'].get(sp)
    if not o: return {}
    E = {}
    for tab in ('k', 'h'):
        for a, ms in o[tab]:
            for c in ms:
                for i in range(0, len(c), 3): e = E.setdefault(c[i], [0, 0]); e[0] += c[i + 1]; e[1] += c[i + 2]
    nall = {}
    for s2, o2 in F['sp'].items():
        for a, ms in o2['k']:
            for m, c in enumerate(ms):
                n = sum(c[i + 2] for i in range(0, len(c), 3)); k = (a, m); nall[k] = max(nall.get(k, 0), n)
    out = {}
    for a, ms in o['k']:
        row = []
        for m, c in enumerate(ms):
            kg = sum(c[i + 1] for i in range(0, len(c), 3)); n = sum(c[i + 2] for i in range(0, len(c), 3))
            ex = sum(c[i + 2] * E[c[i]][0] / max(1, E[c[i]][1]) for i in range(0, len(c), 3))
            row.append((kg / ex) * min(1, n / max(1, nall.get((a, m), n))) if n >= 5 and ex > 0 else None)
        out[M['lok'][a]] = row
    return out

def rank(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0] * len(v); i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]: j += 1
        for k in range(i, j + 1): r[o[k]] = (i + j) / 2
        i = j + 1
    return r

def spearman(x, y):
    if len(x) < 5: return None
    rx, ry = rank(x), rank(y); n = len(x); mx, my = sum(rx) / n, sum(ry) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(rx, ry)); sx = math.sqrt(sum((a - mx) ** 2 for a in rx)); sy = math.sqrt(sum((b - my) ** 2 for b in ry))
    return round(sxy / (sx * sy), 3) if sx and sy else None

def measures(model, truth):
    """model and truth: {lok: [12]}; returns the three correlations and how many cells"""
    xa, ya, xp, yp = [], [], [], []
    for l, tr in truth.items():
        md = model.get(l)
        if not md: continue
        pairs = [(md[m], tr[m]) for m in range(12) if tr[m] is not None and md[m] is not None]
        for a, b in pairs: xa.append(a); ya.append(b)
        if len(pairs) >= 4: xp.append(sum(a for a, _ in pairs) / len(pairs)); yp.append(sum(b for _, b in pairs) / len(pairs))
    xs, ys = [], []
    for m in range(12):
        a = [model[l][m] for l in truth if l in model and truth[l][m] is not None and model[l][m] is not None]
        b = [truth[l][m] for l in truth if l in model and truth[l][m] is not None and model[l][m] is not None]
        if a: xs.append(sum(a) / len(a)); ys.append(sum(b) / len(b))
    return {'all': spearman(xa, ya), 'place': spearman(xp, yp), 'season': spearman(xs, ys), 'cells': len(xa), 'places': len(xp)}

# variants run on the same points in the same page (FASIT_VARIANTS=all): the parts of the model switched off one at a time, to see
# which of them moves the measures
VARIANTS = {'spillet':'', 'uten-grunnlinje':'TRK.r = 1e9; LOKC.forEach(c => { c.tH = -1; });',
  'uten-av':'for (const sp of SP) SPECIES[sp].av = SPECIES[sp].av.map(() => 1); DENT.H = NaN;',
  'uten-begge':'TRK.r = 1e9; LOKC.forEach(c => { c.tH = -1; }); for (const sp of SP) SPECIES[sp].av = SPECIES[sp].av.map(() => 1); DENT.H = NaN;',
  'sesong-fra-sedlene':"FK.season = 'data'; FK.af = undefined; fkBuild();",
  'uten-front':'MIG.skreiDays = 0; for (const c of LOKC.values()) c.tH = -1;',
  'uten-lodde':'MIG.loddeW = () => 0;',
  'alt-fra-sedlene':"FK.season = 'data'; FK.torsk = 'data'; FK.af = undefined; fkBuild();"}
# which variants to run: FASIT_VARIANTS=all, or a comma list of names
def variant_names():
    v = os.environ.get('FASIT_VARIANTS') or 'spillet'
    return list(VARIANTS) if v == 'all' else v.split(',')
JS = """async ([locs, sps, variants]) => {
  S.mult = 0; S.stock = {}; S.bstk = {}; const out = {}, P8 = {}, t0 = performance.now(); let npts = 0;
  const idx = new Map(RU.lok.map((h, i) => [h.c, i]));
  for (const code of locs){
    const i = idx.get(code); if (i === undefined) continue; const P = RU.lok[i].P; if (!P.length) continue;
    const bb = P[0].bb, cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, half = Math.min(45, Math.hypot(bb[2] - bb[0], bb[3] - bb[1]) / 2);
    try { await mapNeed({x:cx, y:cy}, half + 2); } catch (e){}
    const pts = []; let k = 0;
    // a fixed draw per location (h2), so every build samples the same points
    while (pts.length < 6 && k < 400){ k++; const q = {x:bb[0] + (bb[2] - bb[0]) * h2(i, 9000 + k), y:bb[1] + (bb[3] - bb[1]) * h2(i, 9500 + k)};
      if (!ruIn(P, q.x, q.y)) continue; let d; try { if (isLand(q)) continue; d = depthF(q); } catch (e){ continue; } if (d >= 20 && d <= 300) pts.push(q); }
    if (!pts.length) continue; npts += pts.length; P8[code] = pts;
  }
  // each variant from a fresh copy of the tables it changes
  const keep = {r:TRK.r, av:Object.fromEntries(SP.map(sp => [sp, SPECIES[sp].av.slice()])), season:FK.season, torsk:FK.torsk, days:MIG.skreiDays, lw:MIG.loddeW};
  for (const [name, setup] of variants){
    TRK.r = keep.r; for (const sp of SP) SPECIES[sp].av = keep.av[sp].slice(); DENT.H = NaN; LOKC.forEach(c => { c.tH = -1; }); TRKM.clear();
    if (FK.season !== keep.season || FK.torsk !== keep.torsk){ FK.season = keep.season; FK.torsk = keep.torsk; FK.af = undefined; fkBuild(); } MIG.skreiDays = keep.days; MIG.loddeW = keep.lw;
    if (setup) (new Function(setup))();
    const res = out[name] = {};
    for (const code in P8){ const pts = P8[code], row = {}; for (const sp of sps) row[sp] = [];
      for (let m = 0; m < 12; m++){ const acc = {}; let n = 0;
        for (const day of [5, 15, 25]) for (const h of [8, 12, 16]){ const H = (Date.UTC(2027, m, day, h) - EPOCH) / 3.6e6; n++;
          for (const q of pts) for (const sp of sps) acc[sp] = (acc[sp] || 0) + density(sp, q, H) / pts.length; }
        for (const sp of sps) row[sp].push(acc[sp] / n); }
      res[code] = row; }
  }
  TRK.r = keep.r; for (const sp of SP) SPECIES[sp].av = keep.av[sp];
  return {out, npts, ms:Math.round(performance.now() - t0)};
}"""

async def main():
    truthF = json.load(open(os.environ['FASIT_TRUTH'])); label = os.environ.get('FASIT_LABEL', 'model')
    locs = sorted(set(truthF['meta']['lok']))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        names = variant_names()
        r = await pg.evaluate(JS, [locs, SPS, [[n, VARIANTS[n]] for n in names]])
        await b.close()
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    for name in names:
        res = {'label': label, 'variant': name, 'truth': os.path.basename(os.environ['FASIT_TRUTH']), 'points': r['npts'], 'ms': r['ms'], 'species': {}}
        for sp in SPS:
            model = {l: r['out'][name][l][sp] for l in r['out'][name]}
            res['species'][sp] = measures(model, truth_index(truthF, sp))
        tag = label if name == 'spillet' else label + '-' + name
        json.dump(res, open(os.path.join(HERE, 'out', 'fasit-%s.json' % tag), 'w'), indent=1, ensure_ascii=False)
        print('fasit', tag, 'mot', res['truth'], '·', res['points'], 'punkter,', res['ms'], 'ms')
        for sp, v in res['species'].items(): print('  %-8s alle %s · steder %s · sesong %s · (%d celler, %d steder)' % (sp, v['all'], v['place'], v['season'], v['cells'], v['places']))
    print('errors:', errs[:3])

if __name__ == '__main__': asyncio.run(main())
