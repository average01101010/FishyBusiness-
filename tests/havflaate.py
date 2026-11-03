"""The ocean fleet as NPCs (H1, 02.11.2026: tools/npc/havflaate.py -> src/data/havflaate.json, core/05d-hav.js), in the build with the
vec packs (dist-vec, as npctest): the ships at their plants' quays only where a face is long and deep enough for them (quayFit) or
not shown, the ways from the plants to the grounds off the land (the core's 200 m land), the ships on the AIS within its range with
their own models and gear, the trawlers towing and the autoliners' lines in the sea in February off Tromsø, and the time it takes."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT, 'dist-vec'))
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright

def check(ok, what, extra=''):
    print(('OK   ' if ok else 'FEIL ') + what, ('' if extra == '' else ' ' + json.dumps(extra, ensure_ascii=False, default=str)[:600]))

AT = "(a) => { S.t = Math.round((Date.UTC(2027, a[0], a[1], a[2]) - EPOCH) / 6e4); WX_FORCE = {w:5, d:200}; COASTM.k = ''; HAV.k = ''; }"

async def main():
    if not os.path.exists(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json')):
        check(False, 'hele kysten i tools/map/out/game (python3 tools/map/release.py og game.py)'); return
    if os.environ.get('KYST_VEC_BUILT'): check(True, 'dist-vec/ bygd av run.py før testene')
    else:
        r = subprocess.run(['node', 'build.mjs'], cwd=ROOT, env=dict(os.environ, KYST_VEC='1', KYST_DIST=os.path.join(ROOT, 'dist-vec')), capture_output=True, text=True)
        check(r.returncode == 0, 'dist-vec/ bygges med vec-pakkene', r.stderr[-200:])
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg)
        # the ways: every plant to every ground its ships go to, sampled every 200 m on the core's land (the first and last 400 m left
        # out: the plant's quay and the access leg the tool checked)
        w = await pg.evaluate("""(() => { const D = havData(), NS = new Set(); for (let i = 0; i < LNET.n; i++) NS.add(LNET.X[i] + ',' + LNET.Y[i]);
          let n = 0, land = 0, netLand = 0, netKm = 0, long = 0; const worst = [], seen = new Set();
          const ways = []; for (const s of D.ships) D.g[s.g].forEach((e, gi) => { if (e[1] == null) return; const k = s.pi + ':' + s.g + ':' + gi; if (!seen.has(k)){ seen.add(k); ways.push([havWay(s, gi), s.pi, e[0]]); }
            // (and the landing: from the ground to the plant that takes the catch, and from there home, 03.11.2026)
            const dp = e[5]; if (dp == null || dp === s.pi || Math.hypot(D.p[dp][1] - D.p[s.pi][1], D.p[dp][2] - D.p[s.pi][2]) < 5) return;   /* within 5 km: the same harbour, havLand */ const kd = dp + ':' + s.g + ':' + gi, kl = 'L' + dp + ':' + s.pi;
            if (!seen.has(kd)){ seen.add(kd); ways.push([havWay(s, gi, dp), dp, e[0]]); } if (!seen.has(kl)){ seen.add(kl); const L = havLeg(dp, s.pi); if (L) ways.push([L, dp, D.p[s.pi][0]]); } });
          for (const [W, pi, code] of ways){ n++;
            const P = W.R.pts; let hit = 0, s0 = 0;
            for (let i = 1; i < P.length; i++){ const a = P[i - 1], c = P[i], L = dist(a, c), m = Math.max(1, Math.ceil(L / 0.2)), net = NS.has(a.x + ',' + a.y) && NS.has(c.x + ',' + c.y);
              for (let j = 0; j <= m; j++){ const d = s0 + L * j / m; if (d < 0.4 || d > W.R.len - 0.4) continue; if (isLandFar({x:a.x + (c.x - a.x) * j / m, y:a.y + (c.y - a.y) * j / m})){ if (net) netLand++; else hit++; } }
              if (net) netKm += L; s0 += L; }
            if (hit > 2){ land++; if (worst.length < 4) worst.push([D.p[pi][0], code, hit]); } if (W.R.len > 3500) long++; }
          return {n, land, long, worst, netLandKm:Math.round(netLand * 0.2), netKm:Math.round(netKm)}; })()""")
        # (the fairways' own legs were checked against the 25 m map when the net was baked, tools/leia/bake.py: on the 200 m map a narrow
        # sound reads as land, so only their share is checked)
        check(w['n'] > 100 and w['land'] == 0 and w['long'] == 0 and w['netLandKm'] <= w['netKm'] * 0.01, 'leiene ut av mottakene og ut til feltene, inn til leveringsmottaket og hjem derfra holder seg av land, og farledene mellom går gjennom sundene', w)
        # February at Tromsø: the ships within AIS range, in port only at a quay that fits, their models and their gear
        await pg.evaluate("""async () => { const c = P(69.6495, 18.972); await mapNeed(c, MAPD.simR); const b = S.boat; b.status = 'idle'; b.port = null; b.pos = {x:c.x, y:c.y}; S.plan = null; b.v = 0; }""")
        R = {}
        for d in (1, 5, 9, 13, 17, 21, 25):
            await pg.evaluate(AT, [1, d, 12])
            await pg.wait_for_function("(() => { npcStates(S.t / 60); const b = S.boat.pos, F = AIS_KM + 3; return VEC.wait.size === 0 && mapPacksIn('vec', b.x - F, b.y - F, b.x + F, b.y + F).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
            R[d] = await pg.evaluate("""(() => { COASTM.k = ''; HAV.k = ''; const a = npcStates(S.t / 60).filter(n => n.hav), out = {n:a.length, st:{}, gear:{}, port:0, fit:0, models:0, trawl:0, far:0};
              for (const n of a){ out.st[n.st] = (out.st[n.st] || 0) + 1; out.gear[n.hav] = (out.gear[n.hav] || 0) + 1; if (SPEC3D[n.vtype]) out.models++; if (n.trawl) out.trawl++; if (dist(n.p, S.boat.pos) > AIS_KM) out.far++;
                if (n.st === 'port'){ out.port++; const s = havData().ships.find(q => q.id === n.id), A = havState(s, S.t / 60); if (A.face){ const t = [...VEC.tiles.values()].find(t => t.quays.some(f => f.id === A.face.id)), f = t && t.quays.find(f => f.id === A.face.id); if (f && quayReal(f) && quayFit(f, n.L, n.T)) out.fit++; } } }
              out.sets = NPCGEAR.filter(g => String(g.id)[0] === 'v').length; return out; })()""")
        tot = {k: sum(v[k] for v in R.values()) for k in ('n', 'port', 'fit', 'models', 'trawl', 'far', 'sets')}
        check(tot['n'] >= 5 and tot['far'] == 0, 'havflåten er på AIS ved Tromsø i februar, bare innenfor rekkevidden', {d: (v['n'], v['st'], v['gear']) for d, v in R.items()})
        check(tot['port'] == tot['fit'], 'i havn ligger hvert skip ved en kai som står i 3D og er lang og dyp nok for det, ellers vises det ikke', tot)
        check(tot['models'] == tot['n'], 'hvert skip er sin egen modell (tråler, ringnot, autoliner, snøkrabbe)', tot)
        # the time npcStates takes with the ocean fleet
        ms = await pg.evaluate("(() => { const t0 = performance.now(); for (let i = 0; i < 20; i++){ COASTM.k = ''; HAV.k = ''; npcStates(S.t / 60 + i / 60); } return (performance.now() - t0) / 20; })()")
        check(ms < 8, 'npcStates med havflåten tar under 8 ms per kall', round(ms, 2))
        # a trawler on a ground (whichever is nearest a trawler's trip now): towing, her trawl, her AIS card
        tw = await pg.evaluate("""(() => { const D = havData(), H = S.t / 60; for (const s of D.ships){ if (s.g !== 'tral') continue; for (let h = 0; h < 24 * 30; h += 3){ const A = havState(s, H + h); if (A.st === 'fishing' && A.trawl){
              S.boat.pos = {x:A.p.x + 0.4, y:A.p.y}; S.t = Math.round((H + h) * 60); HAV.k = ''; COASTM.k = ''; const n = npcStates(S.t / 60).find(q => q.id === s.id); if (!n) return {none:true};
              return {id:n.id, st:n.st, trawl:n.trawl, v:n.v, card:aisInfo(n).includes('Tråler') || aisInfo(n).includes('Trawling')}; } } } return {none:true}; })()""")
        check(tw.get('trawl') and tw.get('card') and 2 <= tw.get('v', 0) <= 6, 'en tråler på feltet tråler med 3–5 knop, og AIS-kortet sier det', tw)
        # a ship landing her catch at another plant than her home (03.11.2026): at a quay there that fits, or not shown; the AIS card says so
        lv = await pg.evaluate("""(() => { const D = havData(), H0 = S.t / 60;
          for (const s of D.ships) for (let h = 0; h < 24 * 60; h += 2){ const A = havState(s, H0 + h, {x:-1e6, y:-1e6}); if (A.lev !== 'land') continue;
            const pl = D.p[A.at]; S.boat.pos = {x:pl[1] + 0.3, y:pl[2]}; S.t = Math.round((H0 + h) * 60); HAV.k = ''; COASTM.k = '';
            return {id:s.id, home:D.p[s.pi][0], at:pl[0], L:s.L, T:s.T, pending:true}; }
          return {none:true}; })()""")
        if lv.get('pending'):
            await pg.evaluate("async () => { await mapNeed(S.boat.pos, MAPD.simR); }")
            try: await pg.wait_for_function("(() => { npcStates(S.t / 60); const b = S.boat.pos, F = 3; return VEC.wait.size === 0 && mapPacksIn('vec', b.x - F, b.y - F, b.x + F, b.y + F).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
            except Exception: pass   # (packs further off may still be on their way; the plant's own are checked below)
            lv = await pg.evaluate("""(a) => { HAV.k = ''; COASTM.k = ''; const s = havData().ships.find(q => q.id === a.id), A = havState(s, S.t / 60, S.boat.pos), n = npcStates(S.t / 60).find(q => q.id === a.id);
              let fit = null; if (A.face){ const t = [...VEC.tiles.values()].find(t => t.quays.some(f => f.id === A.face.id)), f = t && t.quays.find(f => f.id === A.face.id); fit = !!(f && quayReal(f) && quayFit(f, s.L, s.T)); }
              return Object.assign(a, {lev:A.lev, hidden:!!A.hidden, fit, shown:!!n, card:n ? aisInfo(n).includes('Leverer') || aisInfo(n).includes('Landing') : null, km:A.hidden ? null : Math.round(dist(A.p, {x:havData().p[A.at][1], y:havData().p[A.at][2]}) * 100) / 100}); }""", lv)
        check(lv.get('lev') == 'land' and lv['home'] != lv['at'] and (lv['hidden'] or (lv['fit'] and lv['km'] < 1.6 and lv['card'])), 'et skip leverer ved et annet mottak enn hjemmemottaket, ved en kai der som passer (eller vises ikke), og AIS sier «Leverer fangsten»', lv)
        check(not errs, 'ingen sidefeil', errs[:3])
        print('sidefeil:', errs[:3])
        await b.close()

asyncio.run(main())
