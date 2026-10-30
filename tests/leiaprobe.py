"""Autonav's routes between named places, with a picture of each in the chart plotter (Jonas 12.10.2026: the routes took odd turns
that made the way much longer: round Havøya instead of through the sound, V-shaped turns into and out of the fairway network by
Honningsvåg, Risøyhamn and Myre). For each pair: the route's length, the straight line, their ratio, the points, how it was found
and how long it took; the picture goes to tests/out/leia/<TAG>_<label>.png. Prints one line per pair (OK when the route exists and
every leg passes the simulation's own check). TAG=before|after names the pictures; PAIRS=a>b,... (names of places, or lat,lon)."""
from _env import GAME, boot, OUT
import asyncio, json, os, sys
from playwright.async_api import async_playwright

TAG = os.environ.get('TAG', 'probe')
D = os.path.join(OUT, 'leia'); os.makedirs(D, exist_ok=True)
PAIRS = [('Havøysund', 'rorbu:Havøysund', 'havoy_rorbu'), ('Havøysund', 'Hammerfest utstyrsbutikk', 'havoy_hammerfest'),
         ('Havøysund', 'Mehamn', 'havoy_mehamn'), ('Honningsvåg', 'Hammerfest utstyrsbutikk', 'honningsvag_hammerfest'),
         ('Risøyhamn', 'Myre', 'risoyhamn_myre'), ('Havøysund', 'Myre', 'havoy_myre'), ('Engenes', 'Harstad verft', 'engenes_harstad'), ('Engenes', 'Tromsø', 'engenes_tromso'),
         ('Finnsnes', 'Tromsø', 'finnsnes_tromso'), ('Bodø', 'Reine', 'bodo_reine'), ('Bergen', 'Florø', 'bergen_floro')]
if os.environ.get('PAIRS'): PAIRS = [tuple(x.split('>')) + (x.replace('>', '_').replace(' ', '')[:30],) for x in os.environ['PAIRS'].split(',')]

FIND = """async (name) => { const low = s => (s || '').toLowerCase();
  if (name.startsWith('rorbu:')){ const A = PORTS.find(p => low(p.name).includes(low(name.slice(6)))); if (!A) return null; await mapNeed(A.p, 9); const R = rorbuSites(A.p, 8)[0]; return R ? {p:R.p, name:'rorbu ' + (R.name || ''), rorbu:true} : null; }
  const m = name.match(/^(-?[\\d.]+),(-?[\\d.]+)$/); if (m) return {p:P(+m[1], +m[2]), name};
  const hit = PORTS.filter(p => low(p.name).includes(low(name))).sort((a, b) => (b.mottak ? 1 : 0) - (a.mottak ? 1 : 0) || a.name.length - b.name.length)[0];
  return hit ? {p:hit.p, id:hit.id, name:hit.name} : null; }"""

RUN = """async ([A, B]) => {
  const b = S.boat; b.status = A.id ? 'port' : 'idle'; b.port = A.id || null; b.pos = {x:A.p.x, y:A.p.y}; S.plan = null; S.draft = [];
  await mapNeed(A.p, 1); await mapNeed(B.p, 1);
  const t0 = performance.now(); let r; try { r = await leiaRoute({x:A.p.x, y:A.p.y}, {x:B.p.x, y:B.p.y}, A.id || null, B.id || null); } catch (e){ return {err:String(e && e.stack || e).slice(0, 400)}; }
  const ms = Math.round(performance.now() - t0), st = r.st || {};
  const out = {ms, by:st.by || 'grid', soft:st.soft || 0, mended:st.mended || 0, dropped:st.dropped || 0, net:st.net || null, lane:(st.laneOut || 0) + (st.laneIn || 0), pocket:st.pocket || 0, maxSlice:Math.round(st.maxSlice || 0), pull:st.pull || null, fine50:st.fine50 || 0, ahead:st.ahead || 0, tide:st.tide};
  if (r.why) return Object.assign(out, {why:r.why[0]});
  const wps = r.wps, line = dist(A.p, B.p) / NM; out.n = wps.length; out.nm = +r.nm.toFixed(2); out.line = +line.toFixed(2); out.ratio = +(r.nm / line).toFixed(2);
  // the legs as the simulation sails them (land every 5 m, the depth with the tide now)
  const bad = []; let p0 = {x:A.p.x, y:A.p.y}, shortest = 1e9, minD = 1e9;
  for (let i = 0; i < wps.length; i++){ const w = wps[i], L = dist(p0, w); if (L < shortest) shortest = L; await mapNeed({x:(p0.x + w.x) / 2, y:(p0.y + w.y) / 2}, Math.min(40, L / 2 + 0.5));
    try { const gp = groundCheck(p0, w); if (gp) bad.push({i, gp, z:+depthF(gp).toFixed(1), land:isLand(gp)}); } catch (e){ bad.push({i, err:String(e).slice(0, 100)}); }
    const n = Math.max(1, Math.ceil(L / 0.02)); for (let k = 1; k < n; k++){ const q = {x:p0.x + (w.x - p0.x) * k / n, y:p0.y + (w.y - p0.y) * k / n}; try { if (!inHarbour(q) && !isLand(q)){ const z = depthF(q); if (z < minD) minD = z; } } catch (e){} }
    p0 = w; }
  out.bad = bad; out.shortestLeg = +(shortest * 1000).toFixed(0); out.minDepth = +minD.toFixed(1); out.draft = BOAT.draft; out.sd = safeDepth();
  // the picture: the route as the draft, the plotter fitted to it
  S.draft = wps.map(w => ({x:w.x, y:w.y, port:w.port || null, fish:0, leia:true}));
  openPlotter(); const r2 = document.getElementById('map').getBoundingClientRect(); const xs = [A.p.x].concat(wps.map(w => w.x)), ys = [A.p.y].concat(wps.map(w => w.y));
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), asp = r2.width / r2.height, h = Math.max(1.5, (y1 - y0) * 1.25, (x1 - x0) * 1.25 / asp);
  view.cx = (x0 + x1) / 2; view.cy = (y0 + y1) / 2; view.z = MAP_H / h; applyView(); scheduleStatic(); renderDyn();
  out.dbg = {cls:document.body.className, lines:document.querySelectorAll('#map line.route').length, map:[Math.round(r2.width), Math.round(r2.height)]};
  return out; }"""


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await br.new_page(viewport={'width': 1280, 'height': 800}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg); pg.set_default_timeout(0)
        await pg.wait_for_function("typeof SIMREADY !== 'undefined' && SIMREADY", timeout=120000)
        res = {}
        for a, b, label in PAIRS:
            A = await pg.evaluate(FIND, a); B = await pg.evaluate(FIND, b)
            if not A or not B: print('FEIL', label, 'fant ikke', a if not A else b); continue
            r = await pg.evaluate(RUN, [A, B]); res[label] = r
            await pg.wait_for_timeout(2500); await pg.screenshot(path=os.path.join(D, '%s_%s.png' % (TAG, label)))
            ok = not r.get('err') and not r.get('why') and not r.get('bad')
            print(('OK  ' if ok else 'FEIL'), '%-22s' % label, json.dumps(r, ensure_ascii=False)[:420], flush=True)
        json.dump(res, open(os.path.join(D, TAG + '.json'), 'w'), ensure_ascii=False, indent=0)
        print('sidefeil', errs[:3])
        await br.close()

asyncio.run(main())
