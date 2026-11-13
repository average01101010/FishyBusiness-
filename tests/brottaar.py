"""How often the breaking sea comes in a year (Ø9 F7, core/03b-sea.js brottCond, brottEvent): at a point on open water outside Bergen,
Bodø, Frøya and Hammerfest (needs the whole coast: python3 tools/map/release.py and tools/map/game.py before the build), every game hour of a
year: whether the sea there can raise one (Hs over 3 m where the wind sea and the swell cross at over 60 degrees, or the wind sea against
over two knots of stream), and the number a boat lying there through the year would meet by the rule's rate at a point
(BRT.rs / Tz x e^-8 x BRT.B a game minute). Prints the hours, the expected number and the months; a measure, not a pass or fail, except
that the rule must give some hours on the open coast and none in a sheltered harbour (Bergen's Vågen)."""
import asyncio, json
from playwright.async_api import async_playwright
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))

PLACES = [('Bergen, vest av Sotra', 60.36, 4.80), ('Bodø, ute ved Givær', 67.40, 13.70), ('Frøya, vest av Halten', 64.15, 8.90), ('Hammerfest, nord av Sørøya', 70.78, 22.90), ('Bergen, Vågen', 60.398, 5.318)]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 800, 'height': 600})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME_TUT + '#notut,no3d')
        R = {}
        for name, lat, lon in PLACES:
            R[name] = await pg.evaluate("""async ([lat, lon]) => { const p = P(lat, lon); await mapNeed(p, MAPD.simR);
              const H0 = (Date.UTC(2027, 2, 1, 6) - EPOCH) / 3.6e6, mon = new Array(12).fill(0); let hrs = 0, exp = 0, kryss = 0, strom = 0, hsMax = 0;
              for (let h = 0; h < 8760; h++){ const H = H0 + h; let C = null; try { C = brottCond(p, H); } catch (e){ return {err:String(e)}; }
                const q = hsParts(p, H); hsMax = Math.max(hsMax, Math.hypot(q.w, q.sw));
                if (!C) continue; hrs++; if (C.why === 'kryss') kryss++; else strom++;
                const ew = C.w * C.w / (C.w * C.w + C.sw * C.sw), lam = tp => BRT.rs / (Math.max(3, tp) / 1.29) * Math.exp(-8) * BRT.B;
                const r = 60 * (C.why === 'strom' ? lam(C.tp) : ew * lam(C.tp) + (1 - ew) * lam(C.swTp)); exp += r; mon[gDate(H).getUTCMonth()] += r; }
              return {hrs, kryss, strom, exp:+exp.toFixed(2), hsMax:+hsMax.toFixed(1), mon:mon.map(v => +v.toFixed(2)), land:isLand(p)}; }""", [lat, lon])
        # the minute step itself through the year at three of them: what a boat lying there would have met (warnings and hits), by the
        # groups the rule puts on the water (brottMinute with the real sea), against the expected number
        for name, lat, lon in [PLACES[0], PLACES[1], PLACES[3]]:
            R[name]['moett'] = await pg.evaluate("""([lat, lon]) => { const b = S.boat, p = P(lat, lon), t0 = S.t, n = {warn:0, hit:0}, f0 = window.crewBrott;
              window.crewBrott = k => { if (k in n) n[k]++; return 0; }; b.status = 'idle'; b.v = 0; b.heading = 0; b.pos = {x:p.x, y:p.y}; b.brt = null;
              const T0 = Math.round((Date.UTC(2027, 2, 1, 6) - EPOCH) / 6e4); try { for (let m = 0; m < 525600; m++){ S.t = T0 + m; brottMinute(); } } finally { window.crewBrott = f0; S.t = t0; b.status = 'port'; }
              return n; }""", [lat, lon])
        # what the minute step costs: a day of minutes for a boat under way off Bergen (the breaking sea and the slamming)
        R['ms_dag'] = await pg.evaluate("""() => { const b = S.boat, p = P(60.36, 4.80), t0 = S.t; b.status = 'sailing'; b.v = 6; b.heading = 4.4; b.pos = {x:p.x, y:p.y};
          const T0 = performance.now(); for (let i = 0; i < 1440; i++){ S.t = t0 + i; brottMinute(); slamMinute(); } const ms = performance.now() - T0; S.t = t0; b.status = 'port'; return +ms.toFixed(0); }""")
        print(json.dumps(R, ensure_ascii=False))
        for name, *_ in PLACES[:4]:
            r = R[name]; check('err' not in r and not r['land'] and r['hrs'] > 0, name + ': timer i året med sjø som kan reise en brottsjø, og ventet antall for en båt som lå der hele året', (r.get('hrs'), r.get('exp')))
        for name in [PLACES[0][0], PLACES[1][0], PLACES[3][0]]:
            r = R[name]; check(r['moett']['warn'] >= r['moett']['hit'] and abs(r['moett']['hit'] - r['exp']) <= 3 * max(1, r['exp']) ** 0.5 + 1, name + ': brottsjøene minuttsteget møter i året, mot det ventede (innen tilfeldighetens spredning)', (r['moett'], r['exp']))
        check(R['Bergen, Vågen'].get('hrs') == 0, 'Bergen, Vågen (i havn): ingen', R['Bergen, Vågen'].get('hrs'))
        check(R['ms_dag'] < 1500, 'et døgn av minuttsteget med brottsjøen og slagene tar under 1,5 s', R['ms_dag'])
        check(not errs, 'no page errors', errs[:2])
        await b.close()
if __name__ == "__main__": asyncio.run(main())
