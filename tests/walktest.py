"""The deck map (vessel3d.js deckMap/deckPath/deckPoints; docs/mannskap-plan.md): for every vessel type, read off the model's triangles,
the deck has cells, the work places (gutting, icing, the hauler, the helm or the house door) and the rail places lie on it, and there is
a way between every pair of places. Writes a plan of each deck to tests/out/walk-<type>.txt (# deck, + a place, · barred, space
nothing) so the maps can be looked at. Prints OK or FEIL per type; no 3D needed."""
from _env import OUT, boot
import asyncio, json, os
from playwright.async_api import async_playwright

bad = []
def check(c, msg, d=None):
    print(('OK   ' if c else 'FEIL ') + msg, '' if c else json.dumps(d, ensure_ascii=False, default=str)[:300])
    if not c: bad.append(msg)

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); await boot(pg)
        types = await pg.evaluate("Object.keys(VESSELS)")
        for ty in types:
            r = await pg.evaluate("""(ty) => { const t0 = performance.now(), M = deckMap(ty), pt = M && deckPoints(ty); if (!M) return {none:true};
              const ms = performance.now() - t0, G = geoOf(ty), keys = Object.keys(pt).filter(k => k !== 'lean'), miss = [];
              for (const k of ['sloy', 'is']) if (!pt[k]) miss.push(k); if (!pt.ror && !pt.door) miss.push('ror/door');
              // a way between every pair of the named places and the rail places
              const cells = keys.map(k => pt[k].k).concat(pt.lean.map(l => l.k)), fail = []; let paths = 0, longest = 0;
              for (let i = 0; i < cells.length; i++) for (let j = i + 1; j < cells.length; j++){ const P = deckPath(M, cells[i], cells[j]); if (!P) fail.push([cells[i], cells[j]]); else { paths++; longest = Math.max(longest, P.length); } }
              // the plan, bow at the top
              const rows = []; for (let j = 0; j < M.nz; j++){ let s = ''; for (let i = 0; i < M.nx; i++){ const k = j * M.nx + i; s += cells.includes(k) ? '+' : M.ok(k) ? '#' : M.bar[k] ? '·' : ' '; } rows.push(s); }
              const area = M.n * M.c * M.c, L = VESSELS[ty].len, B = VESSELS[ty].beam;
              return {ms:Math.round(ms), n:M.n, area:Math.round(area * 10) / 10, LB:[L, B], keys, lean:pt.lean.length, miss, fail:fail.length, paths, longest, plan:rows.join('\\n'),
                parts:M.parts.slice(0, 6), hmin:Math.round(Math.min(...Array.from(M.h).filter(v => v === v)) * 100) / 100, hmax:Math.round(Math.max(...Array.from(M.h).filter(v => v === v)) * 100) / 100, deckY:G.deck && G.deck.y}; }""", ty)
            if r.get('none'): check(False, ty + ': no deck map'); continue
            open(os.path.join(OUT, 'walk-' + ty + '.txt'), 'w').write('%s %sx%s m, %d cells = %.1f m2, floors %.2f..%.2f (deck %s), %d ms\nparts: %s\nplaces: %s, rail %d\n\n%s\n' % (ty, r['LB'][0], r['LB'][1], r['n'], r['area'], r['hmin'], r['hmax'], r['deckY'], r['ms'], json.dumps(r['parts']), ' '.join(r['keys']), r['lean'], r['plan']))
            ok = r['n'] > 10 and not r['miss'] and r['fail'] == 0 and (r['LB'][0] < 8 or r['area'] > 0.05 * r['LB'][0] * r['LB'][1])
            check(ok, '%-11s %4d cells %5.1f m2 of %5.1f, places %s%s, rail %d, %d ways (longest %d), %d ms' % (ty, r['n'], r['area'], r['LB'][0] * r['LB'][1], ','.join(r['keys']), (' MISSING ' + ','.join(r['miss'])) if r['miss'] else '', r['lean'], r['paths'], r['longest'], r['ms']), {'fail':r['fail']})
        check(not errs, 'no page errors', errs[:3])
        await br.close()
    print('FEIL: ' + ', '.join(bad) if bad else 'alt OK')
asyncio.run(main())
