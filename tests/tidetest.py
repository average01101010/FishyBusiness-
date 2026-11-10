"""The tide and the sky by place (phase K10 of the coast plan, core/03-simulation.js): the tide's constants come from Kartverket's
prediction at a point per coast tile (data/tide.json, tools/tide), blended between the nearest points, and the sun and the moon are
reckoned where the boat is. Checks the range of the tide from the Skagerrak to Nordland, that the tide follows the boat and is smooth
between the points, the sun's day in June and December from Hvaler to Kirkenes, and grounding in the south: over the same charted
shoal at high water a boat drawing 1.8 m runs aground at Hvaler, where the tide is small, and floats at Bodø.
The current (Fysikk 4 F8a, 10.11.2026; core/06e-anchor.js curAt, src/data/strom.json): it turns with the tide in Saltstraumen and reaches
the cap of 8 knots at the springs; Gisundet and the open coast at Bergen, Bodø and Båtsfjord have no sound, and there the stream that
turns with the tide stays under 0.2 knots while the coastal current runs 0.2-0.5 knots with the land on its right (north off Bergen,
east off Båtsfjord, west in the Skagerrak); the chart plotter draws arrows in Saltstraumen at the flood (in) and the ebb (out), shot in
both formats (tests/out/strom-saltstraumen-<flo|fjaere>-<w>x<h>.png). Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


PLACES = {'hvaler': (59.03, 11.0), 'bergen': (60.40, 5.29), 'bodo': (67.28, 14.38), 'senja': (69.53, 17.65), 'kirkenes': (69.727, 30.06)}
# a sea point near (lat, lon) on the national core, 300 m or more from the land
SEA = """([la, lo]) => { const c = P(la, lo); for (let r = 0; r <= 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++){
  const t = a / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1};
  if (!isLandFar(q) && coastDistFar(q) >= 0.3) return q; } return null; }"""


# the current (F8a): the narrows of Saltstraumen (from strom.json), Gisundet at Finnsnes, the open coast off Bergen, Båtsfjord and in the
# Skagerrak (sea points 5-8 km out), and Bodø's harbour side of Saltfjorden
CPLACES = {'gisund': (69.232, 17.985), 'bergen': (60.40, 4.85), 'batsfjord': (70.82, 29.75), 'skagerrak': (57.90, 7.60), 'bodo': (67.29, 14.30)}
CURJS = """async (Q) => {
  const H0 = Math.round((Date.UTC(2027, 2, 1, 0) - EPOCH) / 6e4) / 60, KN = 3600 / 1852, R = {coast:{}};
  const brgT = (x, y, p) => ((Math.atan2(x, -y) / RAD + gridGamma(p)) % 360 + 540) % 360 - 180;
  // Saltstraumen: the sound strom.json has nearest the bridge
  const c0 = P(67.2335, 14.623); let q = null, bd = 1e9; for (const s of STROM.s){ const d = Math.hypot(s.x - c0.x, s.y - c0.y); if (d < bd){ bd = d; q = s; } }
  const at = {x:q.x, y:q.y}; let mx = 0, turns = 0, against = 0;
  for (let h = 0; h < 15 * 24; h += 0.25){ const c = curAt(at, H0 + h); mx = Math.max(mx, Math.abs(c.snd)); if (Math.abs(c.dh) > 0.1){ if ((c.nx * q.ax + c.ny * q.ay) * c.dh > 0) turns++; else against++; } }
  R.salt = {d:+bd.toFixed(2), w:q.w, dep:q.d, A:q.A, maxKn:+(mx * KN).toFixed(2), turns, against};
  // the same over a tide: the whole of it, and its parts
  const over = p => { let t = 0, k = 0, a = 0; for (let h = 0; h < 15 * 24; h += 0.5){ const c = curAt(p, H0 + h); t = Math.max(t, Math.abs(c.tide)); k = Math.max(k, c.coast); a = Math.max(a, Math.hypot(c.sx, c.sy)); }
    return {tideKn:+(t * KN).toFixed(2), coastKn:+(k * KN).toFixed(2), kn:+(a * KN).toFixed(2), sound:stromNear(p).some(s => stromAt(s, p, 0.5) !== 0)}; };
  R.gisund = over(Q.gisund); R.bodo = over(Q.bodo);
  for (const k of ['bergen', 'batsfjord', 'skagerrak']){ const p = Q[k], o = over(p);
    // the coastal current's own way: at slack water (the tide's stream nil) the stream is the coastal current alone
    let H = H0, best = 1e9; for (let h = 0; h < 13; h += 0.05){ const v = Math.abs(curAt(p, H0 + h).dh); if (v < best){ best = v; H = H0 + h; } }
    const c = curAt(p, H); o.brg = Math.round(brgT(c.sx, c.sy, p)); R.coast[k] = o; }
  // the current reads only the core: the same before and after the tiles' detail is loaded round the place
  const before = curAt(Q.bergen, H0 + 3); await mapNeed(Q.bergen, 2); const after = curAt(Q.bergen, H0 + 3); R.same = before.x === after.x && before.y === after.y;
  return R; }"""
# the chart at Saltstraumen at the strongest flood or ebb of a spring day, about 3 km tall: the arrows drawn, the middle one's way
ARROWS = """async (kind) => { const c0 = P(67.2335, 14.623); let q = null, bd = 1e9; for (const s of STROM.s){ const d = Math.hypot(s.x - c0.x, s.y - c0.y); if (d < bd){ bd = d; q = s; } }
  const at = {x:q.x, y:q.y}, H0 = Math.round((Date.UTC(2027, 2, 8, 0) - EPOCH) / 6e4) / 60, sg = kind === 'flo' ? 1 : -1; let H = H0, best = -1e9;
  for (let h = 0; h < 13; h += 0.05){ const v = sg * curAt(at, H0 + h).dh; if (v > best){ best = v; H = H0 + h; } }
  const b = S.boat, home = {x:q.x - q.ax * 2.5, y:q.y - q.ay * 2.5}; await mapNeed(at, MAPD.simR);
  b.status = 'idle'; b.port = null; b.pos = {x:home.x, y:home.y}; S.plan = null; S.draft = []; b.v = 0; S.t = Math.round(H * 60); WX_FORCE = {w:3, d:200};
  if (typeof G3 !== 'undefined' && G3.show) G3.show(false); view.cx = q.x; view.cy = q.y; view.z = MAP_H / 3; applyView(); CURARR.k = ''; scheduleStatic(); renderStatic(); renderDyn();
  const c = curAt(at, S.t / 60), n = (curArrowsSvg(1 / view.px).match(/<g transform/g) || []).length;
  return {n, kn:+(Math.hypot(c.sx, c.sy) * 3600 / 1852).toFixed(1), inward:(c.sx * q.ax + c.sy * q.ay) > 0, at:new Date(EPOCH + S.t * 6e4).toISOString().slice(0, 16)}; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1100, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        pts = {k: await pg.evaluate(SEA, list(v)) for k, v in PLACES.items()}
        r = await pg.evaluate("""async (Q) => {
          await Promise.all(Object.values(Q).map(p => mapNeed(p, 1)));   // the tiles' detail where the boat is put, as the barrier would load it
          const H0 = Math.round((Date.UTC(2027, 2, 1, 0) - EPOCH) / 6e4) / 60, R = {table:!!TIDEP, n:TIDEP ? TIDEP.length : 0, places:{}};
          for (const k in Q){ const p = Q[k]; let lo = 1e9, hi = -1e9; for (let h = 0; h < 15 * 24; h += 0.25){ const z = tideH(H0 + h, p); lo = Math.min(lo, z); hi = Math.max(hi, z); }
            R.places[k] = {range:+(hi - lo).toFixed(2), zc:+tideZC(p).toFixed(2), M2:+tidePlace(p).C[0][0].toFixed(2), M2g:Math.round(tidePlace(p).C[0][1])}; }
          // the tide follows the boat you follow
          const b = S.boat, keep = {...b.pos}; b.pos = {...Q.bodo}; let same = 0, apart = 0;
          for (let h = 0; h < 12; h += 0.5){ same = Math.max(same, Math.abs(tideH(H0 + h) - tideH(H0 + h, Q.bodo))); apart = Math.max(apart, Math.abs(tideH(H0 + h) - tideH(H0 + h, Q.hvaler))); }
          R.follow = same < 1e-9 && apart > 0.3; b.pos = keep;
          // smooth between the points: a kilometre along the coast never moves the water by more than 3 cm
          let jump = 0; const A = Q.bergen, B = Q.bodo;
          for (let i = 0; i < 400; i++){ const u = i / 400, q = {x:A.x + (B.x - A.x) * u, y:A.y + (B.y - A.y) * u}, q2 = {x:q.x + 0.7, y:q.y + 0.7};
            for (const h of [1, 4, 7]) jump = Math.max(jump, Math.abs(tideH(H0 + h, q) - tideH(H0 + h, q2))); }
          R.jump = +jump.toFixed(3);
          // the sun's day: midsummer and midwinter (game hours)
          const day = (Y, M, D, p) => { const s = sunTimes(Math.round((Date.UTC(Y, M, D, 12) - EPOCH) / 6e4) / 60, p); return s.always ? 'always' : s.never ? 'never' : +(((s.dn - s.up) + 24) % 24).toFixed(1); };
          R.june = {}; R.dec = {}; for (const k in Q){ R.june[k] = day(2027, 5, 21, Q[k]); R.dec[k] = day(2027, 11, 21, Q[k]); }
          // the sky over the boat: at noon on 21 December the sun stands over Bergen and not over Senja
          const Hn = Math.round((Date.UTC(2027, 11, 21, 11) - EPOCH) / 6e4) / 60; b.pos = {...Q.bergen}; R.elBergen = +sunAt(Hn).el.toFixed(1); b.pos = {...Q.senja}; R.elSenja = +sunAt(Hn).el.toFixed(1); b.pos = keep;
          // grounding in the south: the same charted shoal (1.0 m) at high water, a boat drawing 1.8 m
          const dF = depthF, dr = BOAT.draft, st = {t:S.t}; window.depthF = () => 1.0; BOAT.draft = 1.8; R.ground = {};
          try { for (const k of ['hvaler', 'bodo']){ const p = Q[k], hw = tideEvents(H0, 30, p).find(e => e.kind === 'high'); S.t = Math.round(hw.t * 60); b.pos = {...p};
              R.ground[k] = {water:+(1 + tideCD(S.t / 60, p)).toFixed(2), aground:!!groundCheck(p, {x:p.x + 0.05, y:p.y})}; } }
          finally { window.depthF = dF; BOAT.draft = dr; S.t = st.t; b.pos = keep; }
          return R; }""", pts)
        print(json.dumps(r, ensure_ascii=False))
        P = r['places']
        check(r['table'] and r['n'] >= 100, 'tidevannstabellen fra Kartverket er inne (et punkt per kystflis)', r['n'])
        check(P['hvaler']['range'] < 0.8 and P['bergen']['range'] < 2.2 and P['bodo']['range'] > 2.2 and 1.5 < P['senja']['range'] < 3.6, 'tidevannet: lite i Skagerrak, middels i Bergen, stort i Nordland og Troms', {k: v['range'] for k, v in P.items()})
        check(P['hvaler']['zc'] < P['bergen']['zc'] < P['bodo']['zc'], 'middelvann over sjøkartnull øker nordover', {k: v['zc'] for k, v in P.items()})
        check(r['follow'], 'tidevannet regnes der båten er')
        check(r['jump'] < 0.03, 'tidevannet er glatt mellom punktene (under 3 cm per km)', r['jump'])
        check(r['june']['senja'] == 'always' and r['june']['kirkenes'] == 'always' and isinstance(r['june']['bergen'], float) and 18 <= r['june']['bergen'] <= 19.8 and 17.8 <= r['june']['hvaler'] <= 19.2, 'midtsommer: midnattssol i Senja og Kirkenes, en lang dag i Bergen og på Hvaler', r['june'])
        check(r['dec']['senja'] == 'never' and isinstance(r['dec']['bergen'], float) and 5 <= r['dec']['bergen'] <= 6.8 and 5.3 <= r['dec']['hvaler'] <= 6.8, 'midtvinter: mørketid i Senja, en kort dag i Bergen og på Hvaler', r['dec'])
        check(r['elBergen'] > 2 and r['elSenja'] < 0, 'sola står over båten: midt på dagen 21. desember over horisonten i Bergen, under i Senja', (r['elBergen'], r['elSenja']))
        g = r['ground']
        check(g['hvaler']['aground'] and not g['bodo']['aground'], 'grunnstøting i sør: over samme grunne (1,0 m i kartet) ved høyvann går en båt med 1,8 m dypgang på grunn på Hvaler, men flyter i Bodø', g)
        # ---- the current (F8a) ----
        cq = {k: await pg.evaluate(SEA, list(v)) for k, v in CPLACES.items()}
        c = await pg.evaluate(CURJS, cq)
        print(json.dumps(c, ensure_ascii=False))
        sl = c['salt']
        check(sl['d'] < 1.5 and 100 < sl['w'] < 300 and 15 < sl['dep'] < 40, 'Saltstraumen er funnet og målt som kildene (150–255 m bredt, terskel 26 m)', sl)
        check(sl['turns'] >= 50 and sl['against'] == 0, 'strømmen i Saltstraumen snur med tidevannet: inn på flo, ut på fjære', {k: sl[k] for k in ('turns', 'against')})
        check(7.0 < sl['maxKn'] <= 8.0001, 'Saltstraumen når taket på 8 knop ved springflo og aldri over', sl['maxKn'])
        g = c['gisund']
        check(not g['sound'] and g['tideKn'] < 0.2 and g['kn'] < 1.0, 'Gisundet: ikke et sund med basseng (åpent i begge ender); strømmen som snur med tidevannet under 0,2 knop', g)
        for k, want in {'bergen': 0, 'batsfjord': 90, 'skagerrak': 270}.items():
            q = c['coast'][k]; off = abs((q['brg'] - want + 540) % 360 - 180)
            check(q['tideKn'] < 0.2 and 0.2 <= q['coastKn'] <= 0.5 and off <= 60, f'åpen kyst ved {k}: tidevannets strøm under 0,2 knop, kyststrømmen 0,2–0,5 knop med land på høyre hånd (mot {want}° ± 60°)', q)
        check(c['bodo']['tideKn'] < 0.2, 'utenfor Bodø (ikke i sundet): tidevannets strøm under 0,2 knop', c['bodo'])
        check(c['same'], 'strømmen er den samme uansett hva som er lastet av kartet (bare kjernens lag)')
        for vw in [(800, 1280), (1280, 800)]:
            cx = await b.new_context(viewport={'width': vw[0], 'height': vw[1]}); cp = await cx.new_page(); cp.on('pageerror', lambda e: errs.append(str(e)))
            await boot(cp)
            for kind in ('flo', 'fjaere'):
                a = await cp.evaluate(ARROWS, kind); await cp.wait_for_timeout(1500); await cp.evaluate("(() => { renderStatic(); renderDyn(); })()"); await cp.wait_for_timeout(300)
                await cp.screenshot(path=os.path.join(ROOT, 'tests', 'out', f'strom-saltstraumen-{kind}-{vw[0]}x{vw[1]}.png'))
                check(a['n'] >= 3 and a['inward'] == (kind == 'flo') and a['kn'] >= 0.5, f'kartplotteren ({vw[0]}×{vw[1]}): strømpiler i Saltstraumen på {kind}, {"inn mot Skjerstadfjorden" if kind == "flo" else "ut mot Saltfjorden"}', a)
            await cx.close()
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
