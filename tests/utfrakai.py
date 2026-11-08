"""Out from the quay with Autonav (08.11.2026; Jonas: «Noen spillere opplever å ikke kunne forlate kaien ved første oppdrag fordi Autonav
ikke fungerer»). Two faults, both seen red before the fix:
1. Father's naust had no way out by water (core/07c-naust.js naustWay, ui/03b-route.js leiaTo). At Averøy the naust lay in a bay shut off
   behind a spit and at Sleneset in a lagoon with a mouth narrower than the 25 m mask: Autonav found no way from the berth to the first
   trip's field at any tide («Fant ingen trygg rute dit.»). At Fosnavåg on 17.09.2027 the way it found from the naust had its first leg
   over the harbour's fill, and an hour later the field lay where Autonav found no way to even from the plant (ui/08c-start.js). For those three and a start place in the south, the middle and the north (Kvitsøy, Bodø, Båtsfjord) and
   Vangshamn, a new game there: the naust is found with a way out (ver 3), Autonav from its berth to the field ends in the ring with no
   leg over land and «Kast loss» free, and the boat gets away from the quay. For Averøy and Sleneset, also a save with the old naust
   (ver 2, where the old rule put it): it is found again where the boat gets out.
2. In the sealed harbours (approachPath pt.free: Ålesund, Fosnavåg, Laukvik, Vengsøy) the way out crosses the harbour's own fill by
   design, but the route panel's land check did not know it (core/07-harbours.js quayLandLeg): every Autonav route from the plant's
   quay had its first leg «over land», and «Kast loss» stood grey. For each: Autonav from the plant's quay, «Kast loss» not greyed, and
   she gets away.
Needs the whole coast (tools/map/release.py, tools/map/game.py); builds dist-vec/ itself (KYST_VEC_BUILT or KYST_NOBUILD skips it). LITE.
Prints OK or FEIL per check."""
import asyncio, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the naust keeps clear of the vec packs' piers and quays (naustClash), and the app always has them: dist-vec/, built here as havntest does
os.environ['KYST_DIST'] = os.environ.get('KYST_DIST_VEC') or os.path.join(ROOT, 'dist-vec')   # (KYST_DIST_VEC: another vec build, as the one before a fix)
from _env import GAME, boot
from playwright.async_api import async_playwright

ok = lambda c: 'OK  ' if c else 'FEIL'
# [name, lat, lon, the old naust shut in, the game minute or None for the test's own clock]: the start place nearest each point.
# Fosnavåg's naust has a way out, but on 17.09.2027 (the world's clock on 08.11.2026, when it was found) the first trip's field lay where
# Autonav found no way to it from the berth; the way by water to the harbour and on from there finds it (leiaTo)
# Later the same day (289026) the field it chose lay 2.6 km south-west, where Autonav found no way even from the plant's quay: the start
# takes the next best field it reaches (chooseStart, ui/08c-start.js). That one goes first, in the fresh page: the weather that puts the
# field there is the seeded one (seed=1) as it stands before anything else has been asked of it
HOMES = [['Fosnavåg', 62.34, 5.63, False, 289026], ['Averøy', 63.068, 7.492, True, None], ['Sleneset', 66.361, 12.608, True, None], ['Fosnavåg', 62.34, 5.63, False, 288780],
         ['Kvitsøy', 59.06, 5.41, False, None], ['Bodø', 67.28, 14.38, False, None], ['Vangshamn', 69.47, 18.01, False, None], ['Båtsfjord', 70.63, 29.72, False, None]]

PICK = """([la, lo]) => { const p = P(la, lo); let b = null; for (const q of PORTS.filter(q => q.mottak || q.id === HOME0)){ const d = dist(q.p, p); if (!b || d < b.d) b = {d, id:q.id}; } return b.id; }"""
# a new game at the place: the boat at Father's naust, the first trip at its route step, Autonav to the field's ring, then «Kast loss»
START = r"""async ([id, old, T]) => {
  TAB.held = true; const pt = portById(id), b = S.boat, R = {id, n:pt.name};
  if (window.__t0 == null) window.__t0 = S.t; S.t = T != null ? T : window.__t0;
  S.plan = null; S.draft = []; S.jobs = []; b.status = 'port'; b.v = 0; b.land = null; b.landQ = null; b.fuel = BOAT.fuelCap; draftForget(true);
  await chooseStart(pt, null);
  S.tut = {v:2, m:{n1:1, nout:1, intro:1, gps:1}, catch:true, pAt:Date.now(), t0:Date.now(), T:{}, ...S.tutStart};
  let ns = null; for (let i = 0; i < 80 && !(ns = naustSite()); i++) await new Promise(r => setTimeout(r, 250));
  R.naust = !!ns; R.ver = S.naust && S.naust.ver; R.wayOk = !!ns && typeof naustWayOk === 'function' && naustWayOk(ns, id);
  // the save from before: the naust where the old rule put it (naustFind without the way out), as version 2
  // (before the way out was asked for there is no naustWay, and the old rule is the only one)
  if (old && ns){ const W = typeof naustWay === 'function' ? naustWay : null; if (W) naustWay = () => Object.assign([{x:0, y:0}, {x:0, y:0}], {to:'harbour'});
    S.naust = null; naustSite(); const o = S.naust; if (W) naustWay = W;
    R.oldO = o && o.o; R.newO = ns.o; R.moved = !!(o && o.o && Math.hypot(o.o[0] - ns.o[0], o.o[1] - ns.o[1]) > 20);
    S.naust = Object.assign({}, o, {ver:2}); BERTHPOSE_RESET(); const n2 = naustSite(); R.oldAgain = !!n2 && Math.hypot(n2.o[0] - o.o[0], n2.o[1] - o.o[1]) < 1; R.ver2 = S.naust.ver;
    R.wayOk2 = !!n2 && typeof naustWayOk === 'function' && naustWayOk(n2, id); }
  // the first trip's field is one Autonav reaches from the harbour
  { const f = S.tut.f; let r = null; try { r = f ? await leiaRoute({x:pt.p.x, y:pt.p.y}, f.p, id, null) : null; } catch (e){} R.reach = !!(r && !r.why); R.fieldKm = f ? +dist(f.p, pt.p).toFixed(2) : null; }
  b.berth = 'naust'; R.kind = berthKind(b);
  const q0 = quayPos(b); R.q0 = q0;
  view.px = 220;
  const toasts = []; window.__tst = toasts; const T0 = toast; toast = m => { toasts.push(String(m)); };
  const f = S.tut.f;
  try { await leiaTo({x:f.p.x, y:f.p.y}); } catch (e){ R.err = String(e && e.message); }
  tutUpdate(); const e = estimate();
  R.draft = S.draft.length; R.inRing = tutFieldWp(S.draft) >= 0; R.bad = e.bad; R.why = tutStartWhy(); R.step = (tutStep() || {}).id; R.toasts = toasts.slice();
  R.first = S.draft.length ? Math.round(dist(q0, S.draft[0]) * 1000) : null;
  doAct({dataset:{act:'start'}, disabled:false});
  R.st0 = b.status; window.__dep = {q0, f:f.p};
  toast = T0; S.mult = 30; TAB.held = false;
  return R;
}"""
# the sealed harbours: [name, lat, lon]
SEALED = [['Ålesund', 62.468, 6.129], ['Fosnavåg', 62.34, 5.64], ['Laukvik', 68.387, 14.409], ['Vengsøy', 69.836, 18.588]]
# a game after the first trip at the plant's quay there: Autonav out to where the first trip's field would be, and the route panel's «Kast loss»
PLANT = r"""async ([id]) => {
  TAB.held = true; const pt = portById(id), b = S.boat, R = {id, n:pt.name};
  if (window.__t0 == null) window.__t0 = S.t; S.t = window.__t0;
  S.plan = null; S.draft = []; S.jobs = []; b.status = 'port'; b.v = 0; b.land = null; b.landQ = null; b.fuel = BOAT.fuelCap; draftForget(true);
  await chooseStart(pt, null); S.tut = 0; b.berth = 'main'; R.kind = berthKind(b);
  const q0 = quayPos(b), f = S.tutStart.f; view.px = 220;
  const toasts = []; const T0 = toast; toast = m => { toasts.push(String(m)); };
  try { await leiaTo({x:f.p.x, y:f.p.y}); } catch (e){ R.err = String(e && e.message); }
  toast = T0; const e = estimate(); R.draft = S.draft.length; R.bad = e.bad; R.toasts = toasts;
  R.free = pt.free || 0; R.lc0 = S.draft.length ? legClear(q0, S.draft[0]) : null;
  setTab('route'); panelDirty = true; renderPanel(); const bt = document.querySelector('#panel .rbar [data-act=start]'); R.btn = bt ? (bt.disabled ? 'grey' : 'on') : 'none';
  doAct({dataset:{act:'start'}, disabled:false}); R.st0 = b.status; window.__dep = {q0, f:f.p};
  S.mult = 30; TAB.held = false;
  return R;
}"""
LOOK = """() => { const b = S.boat, d = window.__dep; return {st:b.status, km:+dist(b.pos, d.q0).toFixed(3), fkm:+dist(b.pos, d.f).toFixed(3)}; }"""


async def main():
    if not os.path.isdir(os.path.join(ROOT, 'tools', 'map', 'out', 'game')):
        print('FEIL the whole coast is not in the build (tools/map/release.py, tools/map/game.py, node build.mjs)'); return
    if os.environ.get('KYST_VEC_BUILT') or os.environ.get('KYST_NOBUILD'): print(ok(True), 'dist-vec/ built before the test')
    else:
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1'), capture_output=True, text=True)
        print(ok(r.returncode == 0), 'dist-vec/ is built with the vec packs', r.stderr[-200:])
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        pg = await (await br.new_context(viewport={'width': 1280, 'height': 800})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + ('' if 'no3d' in GAME else ',no3d'))
        # the boat's berth poses are remembered per naust site (07-harbours.js BERTHPOSE); the test moves the site under them
        await pg.evaluate("window.BERTHPOSE_RESET = () => { for (const k in BERTHPOSE) delete BERTHPOSE[k]; }")
        for name, la, lo, old, T in HOMES:
            pid = await pg.evaluate(PICK, [la, lo])
            r = await asyncio.wait_for(pg.evaluate(START, [pid, old, T]), timeout=180)
            tag = '%s (%s)' % (r['n'], pid)
            print('   ', tag, json.dumps({k: r.get(k) for k in ('ver', 'kind', 'fieldKm', 'draft', 'first', 'bad', 'why', 'step', 'toasts', 'oldO', 'newO', 'err')}, ensure_ascii=False)[:400], flush=True)
            print(ok(r['naust'] and r['ver'] == 3 and r['wayOk']), tag + ': the naust is found where the boat gets out by water (ver 3)', {k: r.get(k) for k in ('naust', 'ver', 'wayOk')})
            if old:
                print(ok(r.get('moved') and not r.get('oldAgain') and r.get('ver2') == 3 and r.get('wayOk2')), tag + ': a save with the old naust shut in (ver 2) gets it again where she gets out', {k: r.get(k) for k in ('moved', 'oldAgain', 'ver2', 'wayOk2')})
            print(ok(r['reach']), tag + ': the first trip\'s field is one Autonav reaches from the harbour', {k: r.get(k) for k in ('reach', 'fieldKm')})
            print(ok(r['kind'] == 'naust' and r['inRing'] and r['bad'] < 0 and not r['why'] and not any('Fant ingen' in t for t in r['toasts'])), tag + ': Autonav from the naust to the first trip\'s ring, no leg over land, «Kast loss» free', {k: r.get(k) for k in ('kind', 'inRing', 'bad', 'why')})
            track = []
            for i in range(40):
                await pg.wait_for_timeout(1000); s = await pg.evaluate(LOOK); track.append(s)
                if s['fkm'] < 0.3 or s['st'] == 'fishing': break
            await pg.evaluate("TAB.held = true")
            mx = max([s['km'] for s in track] or [0])
            print(ok(r['st0'] == 'unmooring' and mx > 0.25 and (track[-1]['st'] in ('sailing', 'fishing') or track[-1]['fkm'] < 0.3)), tag + ': «Kast loss» and she gets away from the quay', {'st0': r['st0'], 'maxKm': mx, 'last': track[-1] if track else None})
        for name, la, lo in SEALED:
            pid = await pg.evaluate(PICK, [la, lo])
            r = await asyncio.wait_for(pg.evaluate(PLANT, [pid]), timeout=180)
            tag = '%s (%s), at the plant\'s quay' % (r['n'], pid)
            print('   ', tag, json.dumps({k: r.get(k) for k in ('kind', 'free', 'draft', 'bad', 'lc0', 'btn', 'toasts', 'err')}, ensure_ascii=False)[:300], flush=True)
            print(ok(r['kind'] == 'main' and r['free'] > 0 and r['draft'] > 0 and r['bad'] < 0 and r['btn'] == 'on'), tag + ': a sealed harbour; Autonav out, no leg «over land», «Kast loss» not greyed', {k: r.get(k) for k in ('kind', 'free', 'draft', 'bad', 'btn')})
            track = []
            for i in range(40):
                await pg.wait_for_timeout(1000); s = await pg.evaluate(LOOK); track.append(s)
                if s['fkm'] < 0.3 or s['st'] == 'fishing': break
            await pg.evaluate("TAB.held = true")
            mx = max([s['km'] for s in track] or [0])
            print(ok(r['st0'] == 'unmooring' and mx > 0.25 and (track[-1]['st'] in ('sailing', 'fishing') or track[-1]['fkm'] < 0.3)), tag + ': «Kast loss» and she gets away from the quay', {'st0': r['st0'], 'maxKm': mx, 'last': track[-1] if track else None})
        print(ok(not errs), 'no page errors', errs[:3])
        await br.close()

asyncio.run(main())
