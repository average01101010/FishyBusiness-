"""Draw calls and triangles in Bergen's harbour (Ø15 N7, steg 36, before and after the ship models): the boat in Vågen, the camera at
the harbour (Strandkaien, the express boats, the passenger ferry to Kleppestø; the coastal ship's quay in view), at 12:00 and 15:00 on
a summer's day (16.06.2027; the coastal ship lies at Bergen from 14:45). The WebGL draw calls are counted by a wrapper put round
drawArrays and drawElements before the page loads (the test's, not the game's), over 12 frames (SwiftShader takes seconds a frame in Bergen), and their triangles (the count over 3;
lines and points left out). Prints the means and what the 3D view drew of the ferries and the coastal ship (G3._debug.ships, after N7).
Run against another build with KYST_DIST (the baseline before a change). Not in run.py's lists: a measurement, read by hand.
Needs the whole coast in the build.
NPC_MAAL_STED=lofoten (N7's second part, the coast's fishing boats by their gear): the harbour of the Lofoten map tiles (13:9, 14:9) with
the most boats whose gear has its own model (flaate.json), the boat 200 m off it looking at it, on 10.03.2027 at the hours in NPC_MAAL_H
(07,12 unless set); the same counts, and the coast's boats within 1.5 km by their model. Needs the vec packs (KYST_VEC=1)."""
import asyncio, json, os
from playwright.async_api import async_playwright
from _env import *

WRAP = """(() => { const C = {calls:0, tris:0, on:false};
  for (const P of [WebGLRenderingContext.prototype, typeof WebGL2RenderingContext !== 'undefined' ? WebGL2RenderingContext.prototype : null]){ if (!P) continue;
    const da = P.drawArrays, de = P.drawElements;
    P.drawArrays = function(m, f, n){ if (C.on){ C.calls++; if (m === 4) C.tris += n / 3; else if (m === 5 || m === 6) C.tris += Math.max(0, n - 2); } return da.call(this, m, f, n); };
    P.drawElements = function(m, n, t, o){ if (C.on){ C.calls++; if (m === 4) C.tris += n / 3; else if (m === 5 || m === 6) C.tris += Math.max(0, n - 2); } return de.call(this, m, n, t, o); }; }
  window.__DC = C; })();"""
SETUP = """async ([hh]) => { const F = ferjeInit(); WX_FORCE = {w:3, d:200}; const day = Math.round((Date.UTC(2027, 5, 16) - EPOCH) / 6e4);
  const sk = F.q.find(q => q.name === 'Strandkaien'), b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.v = 0;
  S.t = day + hh * 60; COASTM.k = ''; await mapNeed(sk.p, MAPD.simR);
  // on the water of Vågen some 350 m out from Strandkaien, looking back at it
  let at = null; for (const r of [0.35, 0.3, 0.42, 0.25]) { for (let a = 0; a < 6.28 && !at; a += 0.15){ const c = {x:sk.p.x + Math.sin(a) * r, y:sk.p.y - Math.cos(a) * r}; if (!isLand(c) && depthF(c) > 5) at = c; } if (at) break; }
  b.pos = at; b.heading = Math.atan2(sk.p.x - at.x, -(sk.p.y - at.y)); if (!G3.isActive()) G3.show(true);
  return {at, sk:sk.p}; }"""
LSETUP = """async ([hh, key]) => { const [tk, hi] = key.split('.'), [tx, ty] = tk.split(':').map(Number), TL = MAPD.man.tile; WX_FORCE = {w:3, d:200};
  const day = Math.round((Date.UTC(2027, 2, 10) - EPOCH) / 6e4), b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; S.draft = []; b.v = 0;
  const c0 = {x:(tx + 0.5) * TL, y:(ty + 0.5) * TL}; b.pos = c0; S.t = day + hh * 60; COASTM.k = ''; await mapNeed(c0, MAPD.simR); let t = null;
  for (let i = 0; i < 80 && !t; i++){ t = vecTile(tx, ty); if (!t) await new Promise(r => setTimeout(r, 250)); }
  const h = t && t.npc && t.npc[+hi]; if (!h) return {err:'no harbour'}; await mapNeed(h, MAPD.simR);
  let at = null; for (const r of [0.2, 0.25, 0.15, 0.3]) { for (let a = 0; a < 6.28 && !at; a += 0.15){ const c = {x:h.x + Math.sin(a) * r, y:h.y - Math.cos(a) * r}; if (!isLand(c) && depthF(c) > 3) at = c; } if (at) break; }
  b.pos = at || {x:h.x + 0.2, y:h.y}; b.heading = Math.atan2(h.x - b.pos.x, -(h.y - b.pos.y)); if (!G3.isActive()) G3.show(true);
  return {at:b.pos, h:{x:h.x, y:h.y}, boats:h.boats.length}; }"""
def lofoten_key():
    D = json.load(open(os.path.join(HERE, '..', 'src', 'data', 'flaate.json'))); G = D['meta']['gear']
    ok = lambda g, L: (g in ('snurrevad', 'not', 'tral') and L >= 8) or (g == 'teine' and 7 <= L < 13) or (g == 'line' and L >= 13)
    n = [(sum(1 for bi, L, gi in v if ok(G[gi], L)), k) for k, v in D['h'].items() if k.split('.')[0] in ('13:9', '14:9')]
    return max(n)[1]
CAM = """() => { for (const b of document.querySelectorAll('button[data-close], button')) if (/^Til sjøs|^To sea/.test(b.textContent.trim())) b.click(); const c = G3._debug.cam; c.helm = false; c.dist = 40; c.pitch = 0.06; c.yaw = 0; return true; }"""
COUNT = """async () => { const C = window.__DC, fr = n => new Promise(r => { let k = 0; const f = () => { if (++k >= n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await fr(3); C.calls = 0; C.tris = 0; C.on = true; await fr(12); C.on = false;
  const sh = G3._debug.ships || null; return {calls:Math.round(C.calls / 12), tris:Math.round(C.tris / 12), ships:sh && sh.filter(s => s.d < 2500)}; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 1280, 'height': 800}); await ctx.add_init_script(WRAP)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#qfix'); R = {}
        lof = os.environ.get('NPC_MAAL_STED') == 'lofoten'; key = lofoten_key() if lof else None
        for hh in [int(h) for h in os.environ.get('NPC_MAAL_H', '7,12' if lof else '12,15').split(',')]:
            r = await pg.evaluate(LSETUP, [hh, key]) if lof else await pg.evaluate(SETUP, [hh])
            if lof: print('Lofoten, havna %s: %s' % (key, json.dumps(r)), flush=True)
            await pg.wait_for_function("G3.isActive()", timeout=120000); await pg.wait_for_timeout(20000)
            await pg.evaluate("() => { for (const b of document.querySelectorAll('button[data-close]')) if (/Til sjøs|To sea/.test(b.textContent)) b.click(); }")
            for w in (3000, 3000): await pg.evaluate(CAM); await pg.wait_for_timeout(w)
            m = await pg.evaluate(COUNT); R[hh] = m
            near = [s for s in (m.get('ships') or [])]
            print(('Lofoten 10.03.2027' if lof else 'Bergen') + ' kl. %02d: %d tegnekall, %d trekanter per bilde; skipene innen 2,5 km: %s' % (hh, m['calls'], m['tris'], json.dumps([[s['id'], s['t'], s['lod'], s['tris'], s['d']] for s in near]) if m.get('ships') is not None else '(ingen G3._debug.ships i dette bygget)'), flush=True)
            await pg.screenshot(path=os.path.join(OUT, 'npcmaal_%s_%02d.png' % (os.environ.get('NPC_MAAL_TAG', 'na'), hh)), timeout=300000)
        print('sidefeil:', errs[:2])
        await b.close()
asyncio.run(main())
