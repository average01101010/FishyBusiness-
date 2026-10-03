"""The tide and the sky by place (phase K10 of the coast plan, core/03-simulation.js): the tide's constants come from Kartverket's
prediction at a point per coast tile (data/tide.json, tools/tide), blended between the nearest points, and the sun and the moon are
reckoned where the boat is. Checks the range of the tide from the Skagerrak to Nordland, that the tide follows the boat and is smooth
between the points, the sun's day in June and December from Hvaler to Kirkenes, and grounding in the south: over the same charted
shoal at high water a boat drawing 1.8 m runs aground at Hvaler, where the tide is small, and floats at Bodø. Prints OK or FEIL."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))


PLACES = {'hvaler': (59.03, 11.0), 'bergen': (60.40, 5.29), 'bodo': (67.28, 14.38), 'senja': (69.53, 17.65), 'kirkenes': (69.727, 30.06)}
# a sea point near (lat, lon) on the national core, 300 m or more from the land
SEA = """([la, lo]) => { const c = P(la, lo); for (let r = 0; r <= 60; r++) for (let a = 0; a < Math.max(1, r * 6); a++){
  const t = a / Math.max(1, r * 6) * 2 * Math.PI, q = {x:c.x + Math.cos(t) * r * 0.1, y:c.y + Math.sin(t) * r * 0.1};
  if (!isLandFar(q) && coastDistFar(q) >= 0.3) return q; } return null; }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1100, 'height': 700})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        pts = {k: await pg.evaluate(SEA, list(v)) for k, v in PLACES.items()}
        r = await pg.evaluate("""(Q) => {
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
        check(not errs, 'ingen sidefeil', errs[:3])
        await b.close()

asyncio.run(main())
