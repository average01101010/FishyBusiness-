"""The sea marks along the whole coast (05.10.2026, core/01e-marks.js; tools/map/sjomerker.py, in the chart packs' 'marks' entry):
round Tromsø the chart pack's marks are read with its coast (lights with sectors and a rhythm, beacons and buoys, rocks), none inside
Senja's square (the embedded SEAMARKS stay there), the rocks count for running aground and for Autonav (rocksIn), the marks for the
routes' obstacles (11b-obstacles.js), and the chart plotter draws them. Prints OK or FEIL per check."""
from _env import GAME, boot
import asyncio, json
from playwright.async_api import async_playwright


def check(ok, what, extra=''):
    print(('OK  ' if ok else 'FEIL') + ' ' + what + (('  ' + json.dumps(extra, ensure_ascii=False, default=str)[:400]) if extra != '' else ''))


async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing'])
        ctx = await br.new_context(viewport={'width': 1100, 'height': 800}); pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await boot(pg, GAME + '#notut'); await pg.wait_for_timeout(800)
        r = await pg.evaluate("""(async () => { const P0 = P(69.6489, 18.9561); await mapNeed(P0, 6);
          const T = MAPD.man.tile, k = Math.floor(P0.x / T) + ':' + Math.floor(P0.y / T), t = MARKS.tiles.get(k), all = [...MARKS.tiles.values()].filter(Boolean);
          const L = marksNear('lights', P0.x, P0.y, 30), M = marksNear('marks', P0.x, P0.y, 30), rk = rocksIn(P0.x - 15, P0.y - 15, P0.x + 15, P0.y + 15);
          const inS = all.some(t => t.lights.concat(t.marks, t.rocks).some(q => inSenja(q[0], q[1])));
          const sect = L.filter(q => q[5].length > 1).length, rhythm = L.every(q => Array.isArray(q[4]) && q[4].length && q[4].some(v => v > 0));
          return {tile:k, has:!!t, lights:t ? t.lights.length : 0, marks:t ? t.marks.length : 0, rocks:t ? t.rocks.length : 0, near:{L:L.length, M:M.length, rk:rk.length}, types:[...new Set(M.map(q => q[2]))].join(''), inS, sect, rhythm}; })()""")
        check(r['has'] and r['lights'] > 10 and r['marks'] > 10, 'round Tromsø the chart pack\'s sea marks are read with its coast', r)
        check(r['sect'] > 0 and r['rhythm'], 'the lights have sectors and a rhythm the 3D view can flash', {'sect': r['sect']})
        check(not r['inS'], 'none of the coast\'s marks lie inside Senja\'s square (the embedded ones stay there)')
        check(r['rocks'] == 0 or r['near']['rk'] > 0, 'the coast\'s rocks are in rocksIn (running aground, Autonav)', r['near'])
        # the routes' obstacles take the coast's marks
        r = await pg.evaluate("""(() => { obsIndex(); const n = HIND.list.filter(o => o.why === 'mark').length; return {n, senja:SEAMARKS.marks.length}; })()""")
        check(r['n'] > r['senja'], 'the routes\' obstacles take the coast\'s marks too', r)
        # Ø13 K3 (steg 33d): IALA region A. One mark of each kind from the whole coast's chart packs (all of them read), its colours bottom
        # to top and its topmark as markInto (view3d/05-quays-breakwaters.js) builds them, and the chart plotter's symbol (markSvg)
        r = await pg.evaluate("""(async () => {
          await mapLoadKind('chart'); for (const pk of MAPD.packs.filter(p => p.kind === 'chart')) for (const t of pk.tiles || [pk.tile]){ const q = MAPD.byTile.get('chart:' + t[0] + ':' + t[1]); if (q){ await mapLoad(q); marksAdd(q); } }
          const all = [...MARKS.tiles.values()].filter(Boolean).flatMap(t => t.marks), pick = f => all.find(f) || null;
          const want = {north:m => m[2] === 'C' && m[3] === 'north', east:m => m[2] === 'C' && m[3] === 'east', south:m => m[2] === 'C' && m[3] === 'south', west:m => m[2] === 'C' && m[3] === 'west',
            port:m => m[2] === 'B' && m[3] === 'port', starb:m => m[2] === 'B' && m[3] === 'starb', portL:m => m[2] === 'L' && m[3] === 'port' && m.length < 5, starbL:m => m[2] === 'L' && m[3] === 'starb' && m.length < 5,
            isol:m => m[2] === 'I', safe:m => m[2] === 'A', spec:m => m[2] === 'Y' && (m[3] || '').includes('x'), stake:m => m[2] === 'D' && !m[3] && m.length > 4};
          const D = G3._debug, ns = all.filter(m => (m[2] === 'L' || m[2] === 'B') && m[3] !== 'port' && m[3] !== 'starb'), out = {kinds:[...new Set(all.map(m => m[2]))].sort().join(''), n:all.length, noside:ns.length, has:!!(D && D.markInto)};
          // the lateral marks without a side in the data: how many the 3D view draws red, and how many the chart does
          if (D && D.markInto){ let red3 = 0, redC = 0; for (const mk of ns){ const m = D.MB(); D.markInto(m, mk); for (let i = 0; i < m.c.length; i += 9) if (m.c[i] > 0.6 && m.c[i + 1] < 0.3){ red3++; break; } if (markSvg(mk, 0.01).includes('#c8231c')) redC++; } out.red3 = red3; out.redC = redC; }
          const name = c => { const k = c.map(v => Math.round(v * 20) / 20).join(','); return {'0.05,0.05,0.05':'k', '0.95,0.8,0.1':'y', '0.8,0.1,0.1':'r', '0.1,0.55,0.2':'g', '0.95,0.95,0.9':'w', '0.15,0.15,0.15':'i'}[k] || k; };
          for (const [k, f] of Object.entries(want)){
            const mk = pick(f); if (!mk){ out[k] = null; continue; }
            const o = out[k] = {mk:mk.slice(0, 5)}; if (!o || !D || !D.markInto) continue;
            const m = D.MB(); m.trace = []; D.markInto(m, mk); const cx = mk[0] * 1000, cz = mk[1] * 1000; const P = m.p, C = m.c, T = P.length / 9, T0 = m.trace.length ? m.trace[0] / 9 : T;
            o.tris = T;
            // the body's colours, bottom to top: the faces of the body (out at half its width) at heights through it
            const tris = []; for (let i = 0; i < T; i++){ const v = [0, 1, 2].map(j => [P[i * 9 + j * 3] - cx, P[i * 9 + j * 3 + 1], P[i * 9 + j * 3 + 2] - cz]); tris.push({v, c:name([C[i * 9], C[i * 9 + 1], C[i * 9 + 2]]), r:Math.max(...v.map(q => Math.hypot(q[0], q[2])))}); }
            const pre = tris.slice(0, T0), rmax = Math.max(...pre.map(t => t.r)), body = pre.filter(t => t.r >= rmax * 0.5), y0 = Math.min(...body.flatMap(t => t.v.map(q => q[1]))), y1 = Math.max(...body.flatMap(t => t.v.map(q => q[1]))), bands = [];
            for (let h = y0 + 0.05; h < y1; h += 0.1){ const cs = [...new Set(body.filter(t => Math.min(...t.v.map(q => q[1])) <= h && Math.max(...t.v.map(q => q[1])) >= h && Math.abs(Math.max(...t.v.map(q => q[1])) - Math.min(...t.v.map(q => q[1]))) > 0.01).map(t => t.c))].join('');
              if (cs && bands[bands.length - 1] !== cs) bands.push(cs); }
            o.bands = bands.join('|');
            // the topmark over the body: each cone's tip up or down (the axis vertex h from its ring), balls, the cylinder, the cross
            const top = tris.slice(T0), ax = [], ring = new Set();
            for (const t of top) for (const q of t.v){ const rr = Math.hypot(q[0], q[2]); if (rr < 1e-6) ax.push(+q[1].toFixed(3)); else if (rr > 0.2) ring.add(+q[1].toFixed(3)); }
            const cones = []; for (const ry of [...ring].sort((a, b) => a - b)){ const tip = ax.find(a => Math.abs(Math.abs(a - ry) - 0.66) < 0.02 || Math.abs(Math.abs(a - ry) - 0.55) < 0.02); if (tip != null) cones.push(tip > ry ? 'up' : 'down'); }
            o.cones = cones.join(','); o.topTris = top.length; o.topCol = [...new Set(top.map(t => t.c))].join('');
            const svg = markSvg([10, 10, mk[2], mk[3]], 0.01); o.svg = (svg.match(/fill="(#[0-9a-f]+)"/g) || []).map(s => s.slice(6, -1)).join(' ');
            o.svgCones = (svg.match(/<path d="M[^"]*z"/g) || []).map(d => { const n = d.match(/-?[0-9.]+/g).map(Number); return n[5] < n[1] ? 'up' : 'down'; }).join(',');
          }
          // Senja's embedded marks corrected from the tiles (marksSenja): no cardinal post without a quadrant is left, the rods have arrows
          const latAt = L => SEAMARKS.marks.some(m => (m[2] === 'L' || m[2] === 'B') && Math.hypot(m[0] - L[0], m[1] - L[1]) < 0.003);
          out.senja = {S0:SEAMARKS.marks.filter(m => (m[2] === 'S' || m[2] === 'C') && !m[3]).length, arrows:SEAMARKS.marks.filter(m => m.length > 4).length, up:MARKS.senja,
            floodY:SEAMARKS.lights.filter(L => L[5].some(c => c[2] === 'y') && latAt(L)).length, upL:MARKS.senjaL};
          return out; })()""")
        check(r['senja'].get('floodY') == 0, 'Senja\'s embedded lights at the lateral marks have no yellow sector from the floodlight any more', r['senja'])
        check(r['senja']['S0'] == 0 and r['senja']['arrows'] > 10, 'Senja\'s embedded marks take the kind and the arrow of the same mark in the coast\'s data (no yellow cardinal post without a quadrant)', r['senja'])
        exp = {'north': ('k|y', 'up,up'), 'east': ('k|y|k', 'down,up'), 'south': ('y|k', 'down,down'), 'west': ('y|k|y', 'up,down')}
        check(r['has'], 'the 3D view\'s markInto can be asked (G3._debug)')
        for q, (bands, cones) in exp.items():
            o = r.get(q) or {}
            # bands are listed bottom first: north is black over yellow, so yellow at the bottom
            want_b = '|'.join(reversed(bands.split('|')))
            check(bool(o) and o.get('bands') == want_b and o.get('cones') == cones, f'the {q} cardinal buoy: {bands} from the top, its two cones {cones} (bottom first)', o)
            card = {'north': '#1a1a1a #e0b000 #1a1a1a #1a1a1a', 'south': '#e0b000 #1a1a1a #1a1a1a #1a1a1a'}
            check(bool(o) and o.get('svgCones') == cones and o.get('svg', '').startswith(' '.join({'k': '#1a1a1a', 'y': '#e0b000'}[c] for c in bands.split('|'))), f'the chart plotter shows the {q} cardinal\'s bands and its cones', {'svg': o.get('svg'), 'cones': o.get('svgCones')})
        for q, col, top in (('port', 'r', 'r'), ('starb', 'g', 'g')):
            o = r.get(q) or {}
            check(bool(o) and o.get('bands') == col and top in (o.get('topCol') or '') and (o.get('cones') == ('up' if 'starb' in q else '')), f'the {q} lateral buoy is {col} with its topmark ({"a cone" if "starb" in q else "a can"})', o)
        # the fixed lateral marks as Kystverket sets them (retningslinjene 2.2, s. 10): white with a red or green band, a red square or a
        # green triangle on top (two crossed plates: 4 or 2 triangles, and the stalk's 12)
        for q, col, ntop in (('portL', 'r', 16), ('starbL', 'g', 14)):
            o = r.get(q) or {}
            check(bool(o) and o.get('bands') == 'w|' + col + '|w' and col in (o.get('topCol') or '') and o.get('topTris') == ntop and ('#ffffff #' in o.get('svg', '')), f'the {q} fixed lateral mark is white with a {col} band and its {"square" if col == "r" else "triangle"}', o)
        o = r.get('isol') or {}
        check(bool(o) and o.get('bands') == 'k|r|k' and o.get('topCol') == 'k' and o.get('tris', 0) > 30, 'an isolated danger buoy: black with a red band, two black balls', o)
        o = r.get('safe') or {}
        check(bool(o) and set((o.get('bands') or '').replace('|', '')) >= {'r', 'w'} and 'r' in (o.get('topCol') or ''), 'a safe water buoy: red and white stripes, a red ball', o)
        o = r.get('spec') or {}
        check(bool(o) and 'y' in (o.get('bands') or o.get('topCol') or '') and 'y' in (o.get('topCol') or ''), 'a special mark buoy: yellow with a yellow cross', o)
        o = r.get('stake') or {}
        check(bool(o) and len(o.get('mk') or []) == 5 and 8 <= o.get('tris', 0) <= 20 and o.get('bands') == 'i', 'Norway\'s iron rods (D) stay thin rods, with the arrow (viser) the data gives', o)
        check(r.get('noside', 0) > 0 and r.get('red3') == 0 and r.get('redC') == 0, 'no buoy or beacon without a side is drawn red as port, in 3D or in the chart', {k: r.get(k) for k in ('noside', 'red3', 'redC', 'kinds', 'n')})
        # the chart plotter draws them round Tromsø
        r = await pg.evaluate("""(async () => { openPlotter(); const P0 = P(69.6489, 18.9561); view.cx = P0.x; view.cy = P0.y; view.z = MAP_H / 6; applyView(); scheduleStatic(); renderDyn();
          await new Promise(r => setTimeout(r, 1500)); const s = document.querySelector('#mapsvg') || document.querySelector('svg'); return {lights:document.querySelectorAll('.lightsym').length}; })()""")
        check(r['lights'] > 5, 'the chart plotter draws the coast\'s lights round Tromsø', r)
        print('errors:', errs[:3]); await ctx.close(); await br.close()

asyncio.run(main())
