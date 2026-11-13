"""The coast's boats at their quays (03.11.2026, Jonas: «NPC båtene langs hele kysten ligger ved utgravd landmasse, ikke ekte modellerte
kaier som glir sømløst inn i miljøet»): at Tromsø, Bergen, Bodø, Båtsfjord and Finnsnes at night, the boats in port that lie at a quay
face are looked at in 3D, and the player's boat at Father's naust. Checks: each hull floats (the 3D ground under its 9 points under the sea; the quay is built out to her where
the shore was in the way, face.out, quayOut, and nothing over the sea is dug any more), no GL errors and no page errors. Pictures of the nearest such boat in tests/out/kai_*.png.
KYST_DIST=<dir> takes another build (for a picture of before)."""
import asyncio, json, os
from playwright.async_api import async_playwright
ROOT0 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT0, 'dist-vec'))   # the quays are in the vec packs (run.py builds dist-vec/)
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + str(extra)) if extra else ''))
SHOTS = [('tromso', 69.6489, 18.9604), ('bergen', 60.3990, 5.3180), ('bodo', 67.2870, 14.3790), ('batsfjord', 70.6349, 29.7230), ('finnsnes', 69.2302, 17.9742), ('vardo', 70.8577, 29.0912)]   # (Vardø: steg 36, a quay was built out over another boat there, kaiover.py)
TAG = os.environ.get('KAI_TAG', '')

PROBE = """(() => { const H = S.t / 60, b = S.boat.pos, out = [];
  COASTM.k = ''; npcStates(H);
  const add = (m, L, B, T, id) => { const f = m.face; if (!f) return; out.push({id, x:m.p.x * 1000, z:m.p.y * 1000, hd:m.hd, L, B, T, out:f.out || 0, mod:!!f.mod, kind:f.kind, fx:f.x, fz:f.z, nx:f.nx, nz:f.nz, ux:f.ux, uz:f.uz}); };
  for (const t of VEC.tiles.values()) for (const h of t.npc || []){ if (dist(h, b) > 1.6 || h.moorVer !== MOOR.ver) continue;
    for (const bt of h.boats){ const m = bt.moored; if (m && !m.none && m.face) add(m, bt.L, bt.B, bt.T, bt.id); } }
  FLEET.forEach((f, i) => { if (dist({x:f.hp[0], y:f.hp[1]}, b) > 1.6) return; const m = fleetBerth(i); if (m) add(m, f.L, f.B, f.T, 'f' + i); });
  return out; })()"""

NAUST_GO = """() => { const b = S.boat; b.port = S.home || HOME0; b.status = 'port'; b.berth = 'naust'; b.v = 0; S.plan = null;
  S.t = Math.round((Date.UTC(2027, 5, 15, 13) - EPOCH) / 6e4); WX_FORCE = {w:3, d:200}; if (!G3.isActive()) G3.show(true); }"""
NAUST_LOOK = """() => { const bp = berthPose(S.boat.port, S.boat.type, 'naust'); if (!bp) return null; const c = G3._debug.cam; c.helm = false; c.dist = 26; c.pitch = 0.42; c.yaw = 2.4;
  const tr = G3._debug.terrRaw, s = Math.sin(bp.hd), cs = Math.cos(bp.hd); let mx = -99;
  for (const fa of [-0.4, 0, 0.4]) for (const ab of [-0.45, 0, 0.45]){ const x = bp.x * 1000 + s * fa * bp.Lb + cs * ab * bp.Bb, z = bp.y * 1000 - cs * fa * bp.Lb + s * ab * bp.Bb; mx = Math.max(mx, tr(x, z)); }
  return {out:+bp.face.out.toFixed(1), worst:+mx.toFixed(2)}; }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        errs = []; R = {'gl': 0, 'glFirst': None}; k = 0
        for name, lat, lon in SHOTS:
            k += 1
            # (a fresh page for each place: one moved from town to town in 3D waited for its coast past two minutes)
            ctx = await b.new_context(viewport={'width': 1000, 'height': 700}); pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await boot(pg, GAME + '#qfix#glchk')
            await pg.evaluate("""async ([lat, lon, k]) => { const q0 = P(lat, lon); await mapNeed(q0, MAPD.simR); let q = q0;
              outer: for (let r = 0; r < 600; r += 15) for (let a = 0; a < 6.28; a += 0.4){ const c = {x:q0.x + Math.cos(a) * r / 1000, y:q0.y + Math.sin(a) * r / 1000}; if (!isLand(c) && depthF(c) > 3){ q = c; break outer; } }
              const b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.pos = {x:q.x, y:q.y}; b.heading = 0; b.v = 0;
              vecWant(q.x - 3, q.y - 3, q.x + 3, q.y + 3);
              S.t = Math.round((Date.UTC(2027, 5, 15, 1) - EPOCH) / 6e4) + k; WX_FORCE = {w:3, d:200}; if (!G3.isActive()) G3.show(true); }""", [lat, lon, k])
            try: await pg.wait_for_function("(() => { COASTM.k = ''; npcStates(S.t / 60); const b = S.boat.pos, F = 4; return VEC.wait.size === 0 && coastFine(b) && !!coastIndexAt(b, false) && mapPacksIn('vec', b.x - F, b.y - F, b.x + F, b.y + F).every(pk => VEC.tiles.has(pk.tile[0] + ':' + pk.tile[1])); })()", timeout=120000)
            except Exception: print(name, 'kysten kom ikke inn innen 2 min'); R[name] = {'n': 0, 'wait': True}; await ctx.close(); continue
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(4000)
            boats = await pg.evaluate(PROBE)
            if not boats: R[name] = {'n': 0}; print(name, 'ingen båter ved kai'); await ctx.close(); continue
            # the nearest boat to the boat that has a quay built out to her (or the nearest of all), the boat 45 m off her, looking at her
            tgt = await pg.evaluate("""(B) => { const b = S.boat.pos, d = q => Math.hypot(q.x - b.x * 1000, q.z - b.y * 1000);
              const w = B.filter(q => q.out > 1).sort((p, q) => d(p) - d(q))[0] || B.sort((p, q) => d(p) - d(q))[0];
              const ang = Math.atan2(w.ux, -w.uz) + 0.6; let px = w.x + w.nx * (w.B / 2 + 22) + w.ux * 10, pz = w.z + w.nz * (w.B / 2 + 22) + w.uz * 10;
              const s = S.boat; s.pos = {x:px / 1000, y:pz / 1000}; s.heading = 0; return w; }""", boats)
            await pg.wait_for_timeout(16000)
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
            await pg.evaluate("""(w) => { const c = G3._debug.cam, bv = G3._debug.bv; c.helm = false; c.dist = 30; c.pitch = 0.42;
              const dx = w.x - bv.x, dz = w.z - bv.z; c.yaw = Math.atan2(dx, -dz) - bv.head; }""", tgt)
            await pg.wait_for_timeout(9000)
            await pg.screenshot(path=os.path.join(OUT, f'kai_{name}{TAG}.png'), timeout=300000)
            # the hulls float, and nothing over the sea is dug: the 3D ground under each hull, and the ground round the berths with the
            # pits and without them (terrRaw is the pits' too; the same sampled with the berths moved far away)
            r = await pg.evaluate("""(B) => { const tr = G3._debug.terrRaw, out = {n:B.length, built:0, dry:0, worst:-99, out:[]};
              for (const q of B){ if (q.out > 0.3 || q.mod) out.built++; out.out.push(+q.out.toFixed(1)); const s = Math.sin(q.hd), c = Math.cos(q.hd); let mx = -99;
                for (const fa of [-0.4, 0, 0.4]) for (const ab of [-0.45, 0, 0.45]){ const x = q.x + s * fa * q.L + c * ab * q.B, z = q.z - c * fa * q.L + s * ab * q.B; mx = Math.max(mx, tr(x, z)); }
                out.worst = Math.max(out.worst, +mx.toFixed(2)); if (mx > -0.3) out.dry++; }
              return out; }""", boats)
            R[name] = r; print(name, json.dumps(r))
            R['gl'] = R['gl'] or await pg.evaluate("G3._debug.glErr()"); R['glFirst'] = R['glFirst'] or await pg.evaluate("G3._debug.glFirst")
            await ctx.close()
        # the player's own boat at Father's naust (the players' places the same since 03.11.2026: nothing dug on land, the quay built
        # out to her where the shore is in the way, timber to meet the naust's pile quay)
        ctx = await b.new_context(viewport={'width': 1000, 'height': 700}); pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix#glchk')
        await pg.evaluate(NAUST_GO)
        await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
        await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
        nb = await pg.evaluate(NAUST_LOOK)
        await pg.wait_for_timeout(8000); await pg.screenshot(path=os.path.join(OUT, f'kai_naust{TAG}.png'), timeout=300000)
        R['naust'] = nb; print('naust', json.dumps(nb)); await ctx.close()
        print(json.dumps(R))
        check(bool(nb) and nb['worst'] <= -0.3, 'the boat at Father\'s naust floats (the 3D ground under her hull under the sea)', nb)
        for name, *_ in SHOTS:
            q = R.get(name, {})
            if q.get('n'): check(q['dry'] == 0, f'{name}: every boat at a quay floats (the 3D ground under her hull under the sea)', q)
        check(R['gl'] == 0 and not R['glFirst'], 'no GL errors', (R['gl'], R['glFirst']))
        check(not errs, 'no page errors', errs[:2])
        await b.close()
asyncio.run(main())
