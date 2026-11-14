"""Every place a boat can lie, with the older coastal vessel (13.11.2026; Jonas: «Test å start fra alle kaiplasser, butikker, verft, rorbuer,
fiskemottak med den eldre kystbåten å se om du kan starte en rute som går en eller annen plass. Å se at det faktisk fungerer både å ligge der
med båten med tanke på størrelse og dypgående, men også at det faktisk er mulig å seile videre der i fra … Jeg MÅ vite at alle stedene i
spillet fungerer som de skal og at spillere ikke blir stuck NOEN steder»).
kyst21 (21 m, 3.4 m draught) at each place along the whole coast: the harbours (PORTS: the plants, the tackle shops, the yards and Senja's
own), the rorbuer (src/data/rorbuer.json, where their shore is found) and Father's naust by each start plant. For each:
  - lie: where she lies, her hull is on water (berthPose, five points, isLand) with her draught under her at the lowest tide (depthF,
    chart datum). The rorbuer and the naust take boats up to 15 m (SITE_MAXLEN; Jonas 13.11.2026 «Grense ved 15 m»): there kyst15
    (14.99 m, 3.0 m) is sailed from, and kyst21 must not be offered the place (rorbuTarget, naustTarget, moorAll; berthKind);
  - route: Autonav finds a way from there to the nearest other harbour 2-200 km off or open water within 3 km (leiaRoute; up to three tried), no leg over land;
  - sail: «Kast loss», and she sails it with the boat model (dynTick, as the game's loop does when it is looked at, and the minute step)
    and lies in the harbour she was sent to, without running aground, within the time the route takes and a margin.
Needs the whole coast (dist-vec). LITE. Prints a FEIL line per place that fails (allesteder: kind name lat lon what), then OK or FEIL per check.
KYST_ALLE=ports,rorbu,naust,havn picks the kinds (havn: the coast's 3 300 harbours, the way out found from each, sailed from every
KYST_ALLE_SAIL-th, 10); KYST_ALLE_N=20 takes every n-th place only (a quick look); KYST_ALLE_ID=id,id those places; KYST_ALLE_H=hours starts the clock
so many hours later."""
import asyncio, json, os, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST') or os.path.join(ROOT, 'dist-vec')
from _env import GAME, boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
KINDS = [k for k in os.environ.get('KYST_ALLE', 'ports,rorbu,naust,havn').split(',') if k]
EVERY = int(os.environ.get('KYST_ALLE_N', '1'))
IDS = [s for s in os.environ.get('KYST_ALLE_ID', '').split(',') if s]
TYPE = os.environ.get('KYST_ALLE_TYPE', 'kyst21')
# the rorbuer and the naust take boats up to 15 m (SITE_MAXLEN, Jonas 13.11.2026 «Grense ved 15 m»): sailed from with the biggest of those,
# and the older coastal vessel must be turned away there
SMALL = os.environ.get('KYST_ALLE_SMALL', 'kyst15')
# the clock moved on so many hours from the start (a place that failed in the whole run, tried alone at the time it came up there)
HOURS = float(os.environ.get('KYST_ALLE_H', '0'))

SETUP = r"""([type, hh]) => { TAB.held = true; const b = S.boat; S.tut = 0; S.cash = Math.max(S.cash, 1e9);
  b.type = type; if (!S.owned.includes(type)) S.owned.push(type); applyVessel(); b.fuel = BOAT.fuelCap;
  // summer noon, light wind from the south-west: the weather is not what is tested
  S.t = Math.round((Date.UTC(2027, 5, 15, 11) - EPOCH) / 6e4) + Math.round(hh * 60); WX_FORCE = {w:3, d:225};
  window.ALS = {
    // the harbours a route may go to: the plants, shops and yards (the trade places), and Senja's
    dests:PORTS.filter(q => !q.havOnly),
    clear(){ for (const k in BERTHPOSE) delete BERTHPOSE[k]; },
    // the place by its id, its map loaded round it
    async place(kind, id){
      if (kind === 'rorbu'){ const R = RBID.get(id); await mapPreload([R.cand], [['sim', 3], ['chart', 3], ['vec', 1.5]]); rorbuSite(R); return R.site ? R : null; }
      const pt = portById(id); await mapPreload([pt.p], [['sim', 3], ['chart', 3], ['vec', 1.5]]); return pt; },
    // where she lies: the face, the fit, her hull on water and the water under it at the lowest tide
    lie(pid, kind){ const b = S.boat, V = VESSELS[b.type], f = quayFace(pid, kind), bp = berthPose(pid, b.type, kind), R = {fit:f ? quayFit(f, V.len, V.draft) : null, face:f ? [Math.round(f.hl * 2), f.depth == null ? null : +f.depth.toFixed(1)] : null};
      if (!bp){ R.pose = false; return R; } R.pose = true;
      const fx = Math.sin(bp.hd), fz = -Math.cos(bp.hd), sx = Math.cos(bp.hd), sz = Math.sin(bp.hd), X = bp.x * 1000, Z = bp.y * 1000;
      const pts = [[0, 0], [bp.Lb / 2 - 1, 0], [-bp.Lb / 2 + 1, 0], [0, bp.Bb / 2 - 0.3], [0, -bp.Bb / 2 + 0.3]].map(([l, s]) => ({x:(X + fx * l + sx * s) / 1000, y:(Z + fz * l + sz * s) / 1000}));
      R.land = pts.filter(p => isLand(p)).length; R.dmin = +Math.min(...pts.map(p => depthF(p))).toFixed(1); return R; },
    // Autonav from her berth to a harbour 2-40 km off (the nearest first, up to three tried), then sailed with the boat model
    async go(pid, noSail){ const b = S.boat, from = {...(typeof quayPos === 'function' && quayPos(b) || b.pos)}, R = {};
      const cands = ALS.dests.filter(q => q.id !== pid && dist(q.p, from) > 2 && dist(q.p, from) < 200).sort((a, c) => dist(a.p, from) - dist(c.p, from)).slice(0, 3);
      if (!cands.length){ R.why = 'no harbour 2-200 km off'; return R; }
      // or open water within 3 km (deeper than 15 m, 300 m from the coast): from there she goes on
      let open = null; for (let rr = 0.5; rr <= 3 && !open; rr += 0.25) for (let a = 0; a < 6.28; a += 0.26){ const c = {x:from.x + Math.cos(a) * rr, y:from.y + Math.sin(a) * rr}; try { if (!isLand(c) && depthF(c) > 15 && coastDist(c) > 0.3){ open = {p:c, id:null, name:'open water ' + rr + ' km'}; break; } } catch (e){} }
      if (open) cands.push(open);
      // now, and where the water is too shallow now, over the next tide (every 3 hours for 12): a place she leaves only near high water is
      // not one she is stuck at, but it is counted (tideBound)
      let r = null, to = null; const T00 = S.t;
      for (let h = 0; h <= 12 && !to; h += 3){ S.t = T00 + h * 60;
        for (const q of cands){ await mapPreload([q.p], [['sim', 3], ['chart', 3]]); try { r = await leiaRoute(from, q.p, pid, q.id); } catch (e){ r = {why:[String(e && e.message)]}; } if (r && r.wps){ to = q; R.waitH = h; break; } } }
      if (!to){ S.t = T00; R.why = 'route: ' + String(r && r.why ? r.why[0] : 'none').slice(0, 90) + ' (to ' + cands.map(q => q.name).join(', ') + ', over 12 h)'; return R; }
      if (R.waitH) R.tideBound = R.waitH;
      R.to = to.name; R.nm = +r.nm.toFixed(1); if (noSail){ S.t = T00; return R; }
      S.plan = {wps:r.wps.map((q, i) => i === r.wps.length - 1 ? {x:to.p.x, y:to.p.y, port:to.id, fish:0} : {x:q.x, y:q.y, port:null, fish:0, leia:true}), idx:0, speed:BOAT.vcruise, returning:false};
      if (!to.id) S.plan.wps[S.plan.wps.length - 1].leia = true;   // (open water: she stops there)
      // no leg over land (the route panel's check)
      let a = from, bad = 0; for (const w of S.plan.wps){ if (!legClear(a, w)) bad++; a = w; } R.overLand = bad;
      const T0 = S.t, L0 = S.log.length, H0 = DYN.hands || 0, HK0 = {...(DYN.handsK || {})}; if (depart() === false){ R.why = 'depart: ' + (S.msgs && S.msgs.length ? '' : '') + 'refused'; S.plan = null; return R; }
      // the game's loop (ui/08-actions.js): the model each frame, the minute step on the clock; she must lie in port at the end in time
      const limit = 60 + Math.ceil(r.nm / Math.max(3, BOAT.vcruise) * 60 * 1.6); let acc = 0, k = 0, best = 1e9, lastBest = S.t, stuck = null, nh = (b.hits || []).length; const pl0 = S.plan;
      while (S.t - T0 < limit){
        if (!simAreaReady()){ await mapNeed(b.pos, 4); await new Promise(r2 => setTimeout(r2, 20)); continue; }
        dynTick(0.25); acc += 0.25 * simRate() / 60; while (acc >= 1){ step(); acc -= 1; }
        // what she struck, and where: every knock the model counts (b.hits), with her position then (the log says only «støt»)
        if (b.hits && b.hits.length > nh){ for (const hh of b.hits.slice(nh)){ const l = natLL(b.pos); R.hits = (R.hits || []).concat([[hh.k, hh.kn, +l.lat.toFixed(5), +l.lon.toFixed(5), pl0 ? pl0.idx : -1]]).slice(-8); } nh = b.hits.length; }
        if (++k % 400 === 0) await new Promise(r2 => setTimeout(r2, 0));
        if (b.status === 'aground'){ stuck = 'aground'; break; }
        if (b.status === 'port' && !S.plan) break;
        if (!to.id && !S.plan && ['idle', 'fishing', 'sailing'].includes(b.status)) break;   // (at the open water point)
        // headway: what is left of the route (to the next point and on), not the straight line to the end (a route round an island goes away from it)
        const pl = S.plan; let d = 0; if (pl && pl.wps.length > pl.idx){ d = dist(b.pos, pl.wps[pl.idx]); for (let j = pl.idx + 1; j < pl.wps.length; j++) d += dist(pl.wps[j - 1], pl.wps[j]); }
        if (d < best - 0.03){ best = d; lastBest = S.t; } else if (S.t - lastBest > 40){ stuck = 'no headway for 40 min (' + b.status + ', at ' + JSON.stringify(natLL(b.pos)).slice(0, 60) + ', leg ' + (pl ? pl.idx + '/' + pl.wps.length : '-') + ')'; break; }
      }
      R.log = S.log.slice(L0).map(e => e.no || '').filter(t => /grunn|traff|kollisjon|Kollisjon|støtte|Vann i båten|Motorrommet|slep|Slep|fast|venter|Venter|ly\b/i.test(t)).slice(0, 4);
      R.min = S.t - T0; R.end = b.status; R.hands = (DYN.hands || 0) - H0; R.handsK = {}; for (const k in (DYN.handsK || {})) if (DYN.handsK[k] - (HK0[k] || 0)) R.handsK[k] = DYN.handsK[k] - (HK0[k] || 0);   /* (the hands took her along the line: stuck, or a sharp corner by a mark, 16b-dyn.js) */ R.at = b.port === to.id; R.left = +dist(b.pos, from).toFixed(2); R.km = +dist(b.pos, to.p).toFixed(2);
      if (!to.id) R.at = R.km < 0.3;
      R.dmg = typeof hullBad === 'function' && hullBad(b); if (R.dmg && !stuck){ const all = S.log.slice(L0).map(e => e.no || ''), why = all.filter(t => /støt|Støt|Smell|grunn|Grunn|Sammenstøt|skade|Skade|lekk/.test(t)); R.log = why.length ? why.slice(0, 6) : all.filter(t => !/^Kl\.|klokka|Posisjon/.test(t)).slice(-6); stuck = 'hull damaged on the way (' + (R.hits ? 'struck ' + JSON.stringify(R.hits) + ' ' : '') + R.log.join(' | ').slice(0, 300) + ')'; }
      if (typeof asleep === 'function' && asleep()) R.asleep = true;
      if (stuck) R.why = stuck + ' ' + R.left + ' km out'; else if (!R.at) R.why = 'not in ' + to.name + ' after ' + R.min + ' min (' + b.status + ', ' + R.km + ' km off)';
      S.plan = null; return R; },
    // she is put at the place: in port, at its berth (main; the naust's for the naust)
    put(pid, kind){ const b = S.boat, pt = portById(pid); S.plan = null; S.draft = []; S.jobs = []; b.status = 'port'; b.port = pid; b.berth = kind; b.v = 0; b.land = null; b.landQ = null; b.anch = null; b.dyn = null; b.fuel = BOAT.fuelCap; b.damage = 0; b.dmg = null; b.tow = null; b.tripBad = false; b.engineUntil = null; b.prev = null; b.engH = 0; b.svcAt = 0; b.hits = [];   /* (one boat sails a thousand trips here: her engine hours are not what is tested) */
      S.energy = 100; S.sleep = null; S.drowsy = false; S.rest = null;   /* (nor the skipper's sleep: a thousand trips without rest put him to sleep at the helm, «Du sovnet av utmattelse», and the boat drifted: Ålesund 13.11.2026) */
      b.pos = {x:pt.p.x, y:pt.p.y}; S.trail = [{x:pt.p.x, y:pt.p.y, port:pid}]; ALS.clear(); DYN.line = null; }
  }; return true; }"""

ONE = r"""async ([kind, id, type, big]) => { const R = {kind, id, type}; let pt;
  if (S.boat.type !== type){ S.boat.type = type; if (!S.owned.includes(type)) S.owned.push(type); applyVessel(); }
  try { pt = await ALS.place(kind, id); } catch (e){ R.why = 'map: ' + String(e && e.message).slice(0, 80); return R; }
  if (!pt){ R.skip = 'no shore found for it'; return R; }
  R.name = pt.name; const ll = natLL(pt.p); R.ll = [+ll.lat.toFixed(4), +ll.lon.toFixed(4)];
  const berth = kind === 'naust' ? 'naust' : 'main', pid = kind === 'naust' ? id : pt.id;
  // the big boat is turned away at a rorbu and the naust: not offered as a place to lie, and the naust's berth reads as the plant's
  if (big){ const b = S.boat, t0 = b.type; b.type = big; applyVessel(); const bp = kind === 'rorbu' ? berthPose(pid, b.type, 'main') : null;
    const at = kind === 'naust' ? (berthPose(pid, 'kyst15', 'naust') || pt.p) : (bp || pt.p);
    R.bigOffered = kind === 'rorbu' ? !!rorbuTarget(at, 0.3) || moorAll(at, 0.3).some(m => m.id === pid) : !!naustTarget(at, 0.3) || moorAll(at, 0.3).some(m => m.berth === 'naust');
    if (kind === 'naust'){ b.berth = 'naust'; b.port = pid; R.bigNaustKind = berthKind(b); }
    b.type = t0; applyVessel(); }
  R.h = +((S.t - Math.round((Date.UTC(2027, 5, 15, 11) - EPOCH) / 6e4)) / 60).toFixed(2); ALS.put(pid, berth); R.lie = ALS.lie(pid, berth);
  try { Object.assign(R, await ALS.go(pid)); } catch (e){ R.why = 'error: ' + String(e && e.message).slice(0, 100); }
  return R; }"""

# the coast's harbours (07e-havn.js): every harbour of the vec packs, by tile; [tx, ty, hi, x, y]
HAVNS = r"""async () => { VEC.forceMain = true; const out = [];
  for (const pk of MAPD.packs.filter(pk => pk.kind === 'vec')){ await mapLoad(pk); const t = vecTile(pk.tile[0], pk.tile[1]); if (t && t.npc) t.npc.forEach((h, hi) => out.push([pk.tile[0], pk.tile[1], hi, h.x, h.y])); if (VEC.tiles.size > 12) vecPrune([S.boat.pos]); }
  return out; }"""
# a free berth for her in that harbour (havnBerths: a face as long as she is and two metres, her draught and half a metre at the lowest
# tide), put there, and the way out (and on every SAIL-th harbour, sailed)
ONE_HAVN = r"""async ([x, y, type, sail]) => { const R = {kind:'havn', type}; const p = {x, y};
  if (S.boat.type !== type){ S.boat.type = type; applyVessel(); }
  try { await mapPreload([p], [['sim', 3], ['chart', 3], ['vec', 1.5]]); } catch (e){ R.why = 'map: ' + String(e && e.message).slice(0, 80); return R; }
  const H = havnsNear(p, 0.02)[0]; if (!H){ R.skip = 'harbour not found'; return R; }
  if (typeof havnMoor === 'function') havnMoor(H.h);
  const L = havnBerths(H, type, S.cur, 1); const ll = natLL(p); R.ll = [+ll.lat.toFixed(4), +ll.lon.toFixed(4)];
  if (!L.length){ R.skip = 'no berth for her'; R.none = true; return R; }
  const pl = havnPlaceOf(H, L[0], type); R.name = pl.name; R.id = pl.id;
  ALS.put(pl.id, 'main'); R.lie = ALS.lie(pl.id, 'main');
  try { Object.assign(R, await ALS.go(pl.id, !sail)); } catch (e){ R.why = 'error: ' + String(e && e.message).slice(0, 100); }
  S.boat.status = 'idle'; S.boat.port = null; if (typeof havnFree === 'function') try { havnFree(pl.id); } catch (e){}
  return R; }"""
SAIL = int(os.environ.get('KYST_ALLE_SAIL', '10'))

# Father's naust by a start plant: the start (chooseStart) there, the naust found
NAUST = r"""async (id) => { const pt = portById(id); await mapPreload([pt.p], [['sim', 3], ['chart', 3], ['vec', 1.5]]); S.home = id; S.naust = null;
  let n = null; for (let i = 0; i < 80 && !(n = naustSite()); i++) await new Promise(r => setTimeout(r, 100)); return !!n; }"""


async def main():
    if not os.path.isdir(os.path.join(ROOT, 'tools', 'map', 'out', 'game')):
        print('FEIL the whole coast is not in the build (tools/map/release.py, tools/map/game.py, KYST_VEC=1 node build.mjs)'); return
    async with async_playwright() as p:
        br = await p.chromium.launch()
        pg = await (await br.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('' if 'no3d' in GAME else ',no3d'))
        # a slower machine (KYST_ALLE_CPU=4: four times slower): the model's step reads the wall clock between frames (dynCatch), so a
        # slow tablet is not the same as a fast one
        if os.environ.get('KYST_ALLE_CPU'): await (await pg.context.new_cdp_session(pg)).send('Emulation.setCPUThrottlingRate', {'rate': float(os.environ['KYST_ALLE_CPU'])})
        await pg.evaluate(SETUP, [TYPE, HOURS])
        todo = []
        if 'ports' in KINDS: todo += [('port', i) for i in await pg.evaluate("() => PORTS.filter(q => !q.havOnly).map(q => q.id)")]
        if 'rorbu' in KINDS: todo += [('rorbu', i) for i in await pg.evaluate("() => [...RBID.keys()]")]
        if 'naust' in KINDS: todo += [('naust', i) for i in await pg.evaluate("() => PORTS.filter(q => q.mottak && !q.sted).map(q => q.id)")]
        if 'havn' in KINDS: todo += [('havn', h) for h in await pg.evaluate(HAVNS)]
        if IDS: todo = [t for t in todo if t[1] in IDS]
        todo = todo[::EVERY]
        res = []; t0 = time.time()
        for i, (kind, pid) in enumerate(todo):
            if kind == 'naust':
                if not await pg.evaluate(NAUST, pid): res.append({'kind': 'naust', 'id': pid, 'skip': 'no naust found'}); continue
            if kind == 'havn': r = await pg.evaluate(ONE_HAVN, [pid[3], pid[4], TYPE, i % SAIL == 0])
            else: r = await pg.evaluate(ONE, [kind, pid, TYPE if kind == 'port' else SMALL, None if kind == 'port' else TYPE])
            res.append(r)
            bad = r.get('why') or (r.get('lie', {}).get('land') if r.get('lie') else None)
            if bad: print('allesteder:', kind, r.get('name'), r.get('ll'), json.dumps({k: r.get(k) for k in ('why', 'to', 'nm', 'min', 'end', 'log', 'hits', 'asleep', 'h', 'hands')}, ensure_ascii=False), flush=True)
            if i % 25 == 0: print('   ', i, '/', len(todo), round(time.time() - t0), 's', flush=True)
        json.dump(res, open(os.path.join(ROOT, 'tests', 'out', 'allesteder%s.json' % ('_' + TYPE if TYPE != 'kyst21' else '')), 'w'), ensure_ascii=False, indent=0)
        done = [r for r in res if not r.get('skip')]
        by = lambda k: [r for r in done if r['kind'] == k]
        print('places:', len(done), {k: len(by(k)) for k in ('port', 'rorbu', 'naust', 'havn')}, '| harbours with no berth for her:', sum(1 for r in res if r.get('none')), '| skipped:', [(r['kind'], r['id'], r['skip']) for r in res if r.get('skip')][:8])
        noroute = [r for r in done if r.get('why', '').startswith(('route', 'no harbour'))]
        unsailed = [r for r in done if r.get('why') and r not in noroute]
        onland = [r for r in done if r.get('lie', {}).get('land')]
        bigin = [r for r in done if r['kind'] != 'port' and (r.get('bigOffered') or r.get('bigNaustKind', 'main') != 'main')]
        shallow = [r for r in done if r.get('lie', {}).get('pose') and r['lie'].get('dmin', 99) < (3.4 if r['kind'] == 'port' else 3.0)]
        print(ok(not noroute), 'Autonav finds a route from every place to a harbour 2-200 km off or open water (%d without)' % len(noroute), [(r['kind'], r.get('name'), r.get('why')) for r in noroute[:6]])
        print(ok(not unsailed), 'she sails it from every place and lies in the harbour at the end, without running aground (%d did not)' % len(unsailed), [(r['kind'], r.get('name'), r.get('why')) for r in unsailed[:6]])
        print(ok(not onland), 'where she lies, her hull is on water (%d with a hull point on land)' % len(onland), [(r['kind'], r.get('name')) for r in onland[:6]])
        print(ok(not bigin), 'the older coastal vessel (21 m) is not offered a rorbu or the naust, and the naust reads as the plant for her (%d were)' % len(bigin), [(r['kind'], r.get('name')) for r in bigin[:6]])
        print(ok(not shallow), 'her draught under her at the lowest tide where she lies (kyst21 3.4 m at the harbours, kyst15 3.0 m at the rorbuer and the naust; %d with less)' % len(shallow), [(r['kind'], r.get('name'), r['lie']['dmin']) for r in shallow[:6]])
        print(ok(not any(r.get('overLand') for r in done)), 'no leg of a route over land')
        hd = [r for r in done if r.get('hands')]
        kinds = {}
        for r in hd:
            for k, n in (r.get('handsK') or {}).items(): kinds[k] = kinds.get(k, 0) + n
        print('places where the hands took her along the line (the last way out, Jonas 14.11.2026; %d places, %d times, by kind %s):' % (len(hd), sum(r['hands'] for r in hd), json.dumps(kinds)), [(r['kind'], r.get('name'), r.get('handsK')) for r in hd[:30]])
        # (the hands are the last way out, «i enkelte situasjoner»: stuck or held is a place the model does not solve; a sharp corner by a
        # mark is the hands' own job. Red when the stuck and held ones are more than one place in a hundred)
        sh = [r for r in hd if (r.get('handsK') or {}).get('stuck') or (r.get('handsK') or {}).get('held')]
        print(ok(len(sh) <= max(1, len(done) // 100)), 'the hands took her on where she was stuck or held at no more than one place in a hundred (%d of %d)' % (len(sh), len(done)), [(r['kind'], r.get('name')) for r in sh[:12]])
        tb = [r for r in done if r.get('tideBound')]
        print('places she leaves only nearer high water (not stuck; %d):' % len(tb), [(r['kind'], r.get('name'), r['tideBound']) for r in tb[:12]])
        print('errors:', errs[:4]); await br.close()
asyncio.run(main())
