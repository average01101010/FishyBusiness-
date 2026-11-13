"""No quay built out over another boat's place (steg 36, 13.11.2026; Jonas: «vi kan ikke ha det sånn at det er kaier på innsiden av andre
kaier. Da må heller den innerste kaien fjernes slik at båtene ligger … realistisk fortøyd … i den kaien som faktisk vises»). The coast's
boats in port lie at the quay faces of the vec packs, and where the 3D shore is in the way the quay is built out from the shore to the
boat's side (face.out, quayOut in core/07-harbours.js; drawDocks quayMod draws it from 3 m in on the land out to her, as long as she is
and 2 m more each end). At Vardø (tile 25:2, where a Danish seiner stood inside the quay built out to the boats outside her), south of
Bergen (60°00'N 5°07'E), Bergen, Svolvær, Båtsfjord, Tromsø and Egersund: every harbour's boats moored at a face, and for each quay built
out (out > 0.3 m) no other boat of the harbour with a hull point inside it. Without the 3D view (KYST_LITE), the vec packs in the build
(KYST_DIST, dist-vec as run.py builds it). Prints OK or FEIL per place."""
import asyncio, json, os
from playwright.async_api import async_playwright
ROOT0 = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('KYST_DIST', os.path.join(ROOT0, 'dist-vec'))
from _env import *

def check(c, what, extra=''): print(('OK  ' if c else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False)[:600]) if extra != '' else ''))

PLACES = [('Vardø', 70.8577, 29.0912), ('sør for Bergen', 60.0039, 5.1086), ('Bergen', 60.3990, 5.3180), ('Svolvær', 68.2340, 14.5680),
          ('Båtsfjord', 70.6349, 29.7230), ('Tromsø', 69.6489, 18.9604), ('Egersund', 58.4500, 5.9900)]

PROBE = """async ([la, lo]) => { const c = P(la, lo), b = S.boat; b.status = 'idle'; b.port = null; S.plan = null; b.v = 0; b.pos = c;
  S.t = Math.round((Date.UTC(2027, 2, 10, 23) - EPOCH) / 6e4); await mapNeed(c, MAPD.simR); vecWant(c.x - 3, c.y - 3, c.x + 3, c.y + 3);
  for (let i = 0; i < 60; i++){ vecTilesIn((c.x - 3) * 1000, (c.y - 3) * 1000, (c.x + 3) * 1000, (c.y + 3) * 1000); COASTM.k = ''; npcStates(S.t / 60); await new Promise(r => setTimeout(r, 250)); }
  const hits = [], seen = {harbours:0, quays:0, boats:0};
  for (const t of VEC.tiles.values()) for (const h of t.npc || []){ if (dist(h, c) > 3 || h.moorVer !== MOOR.ver) continue; seen.harbours++;
    const M = h.boats.filter(q => q.moored && !q.moored.none).map(q => ({id:q.id, L:q.L, B:q.B, m:q.moored})); seen.boats += M.length;
    for (const a of M){ const F = a.m.face; if (!F || !(F.out > 0.3)) continue; seen.quays++;
      for (const o of M){ if (o === a) continue; const s = Math.sin(o.m.hd), cs = Math.cos(o.m.hd), hl = o.L / 2, hb = o.B / 2;
        for (const fa of [-1, -0.5, 0, 0.5, 1]) for (const ab of [-1, 0, 1]){ const x = o.m.p.x * 1000 + s * fa * hl + cs * ab * hb - F.x, z = o.m.p.y * 1000 - cs * fa * hl + s * ab * hb - F.z;
          const al = x * F.ux + z * F.uz, ac = x * F.nx + z * F.nz;
          if (Math.abs(al) < a.L / 2 + 2 - 0.2 && ac > -3 && ac < F.out - 0.2){ hits.push({quay:a.id, out:+F.out.toFixed(1), boat:o.id, at:[+al.toFixed(1), +ac.toFixed(1)]}); } } } } }
  const uniq = {}; for (const x of hits) uniq[x.quay + '>' + x.boat] = x;
  return {seen, hits:Object.values(uniq).slice(0, 6), n:Object.keys(uniq).length}; }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={'width': 900, 'height': 700})).new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME_TUT + '#notut,no3d')
        for name, la, lo in PLACES:
            r = await pg.evaluate(PROBE, [la, lo])
            check(r['seen']['harbours'] > 0 and r['n'] == 0, '%s: ingen båt ligger innenfor kaia som er bygd ut til en annen (%d havner, %d båter i havn, %d kaier bygd ut)' % (name, r['seen']['harbours'], r['seen']['boats'], r['seen']['quays']), r['hits'] if r['n'] else '')
        check(not errs, 'ingen sidefeil', errs[:2])
        await b.close()
asyncio.run(main())
