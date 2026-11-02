# One national coastal fleet (L2/N1 of docs/planer/bestand-og-flaate.md, 02.11.2026): the boats in the harbours along the coast are
# the vessel register's, kommune by kommune, not one per 150 m of quay. The harbours, their berths, grounds and routes are the map's
# (tools/map/npc.py, in each tile's vec pack); this gives each harbour the register's active boats of its kommune (fiske.json kom, B1:
# the boats with landings in the last year, by length group and main gear), shared over the kommune's harbours by their berths, the
# biggest boats to the biggest berths. The game puts them on the berths (flaateApply in 05-vessels.js).
#
#   python3 tools/npc/flaate.py [game dir]     (default tools/map/out/game; the kommune of each harbour is asked of Geonorge's
#                                               kommuneinfo and kept in tools/npc/cache/kommune.json)
#
# flaate.json:
#   meta  made, src, gear, lgN (the boats placed by length group), openShare (the share under 11 m in the open group), the counts: active (the register's active boats under 28 m along the coast), placed, over (active boats of a kommune
#         with more boats than berths), none (the kommuner with active boats and no harbour in the packs: Senja's square, whose fleet is
#         the game's FLEET, and inland), harbours, empty (harbours whose kommune has no active boats left for them)
#   h     {"tx:ty.hi": [[bi, L, gear], ...]}: the harbour's berth bi (its place in the pack) gets a boat of L m and the gear (meta.gear)
import os, sys, json, time, zlib, urllib.request, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, 'cache'); KOMF = os.path.join(CACHE, 'kommune.json')
LG = [(6.0, 10.99), (11.0, 14.99), (15.0, 20.99), (21.0, 27.99)]   # the length groups under 28 m (fiske.json meta.lg)

def h01(*a): return int(hashlib.sha256(repr(a).encode()).hexdigest()[:12], 16) / 16 ** 12

def harbours(game):
    man = json.load(open(os.path.join(game, 'manifest.json'))); out = []
    for p in man['packs']:
        if p['kind'] != 'vec': continue
        data = open(os.path.join(game, p['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); body = data[8 + hl:]
        tx, ty = p['tile']
        for bl in head['blocks']:
            if bl[0] != 'npc': continue
            J = json.loads(zlib.decompress(body[bl[3]:bl[3] + bl[4]], -15))
            for hi, h in enumerate(J['h']):
                out.append({'k': f'{tx}:{ty}.{hi}', 'x': (tx * 50000 + h['x']) / 1000, 'y': (ty * 50000 + h['z']) / 1000, 'slots': [b[0] for b in h['b']]})
    return out

def kommune(hs):
    os.makedirs(CACHE, exist_ok=True); K = json.load(open(KOMF)) if os.path.exists(KOMF) else {}
    todo = [h for h in hs if h['k'] not in K]
    for i, h in enumerate(todo):
        E, N = round(h['x'] * 1000 - 250000), round(8050000 - h['y'] * 1000)
        for t in range(3):
            try:
                with urllib.request.urlopen(f'https://ws.geonorge.no/kommuneinfo/v1/punkt?nord={N}&ost={E}&koordsys=25833', timeout=30) as r: d = json.load(r)
                K[h['k']] = d.get('kommunenummer'); break
            except Exception as e:
                if '404' in str(e): K[h['k']] = None; break
                time.sleep(2 * (t + 1))
        if i % 200 == 199: json.dump(K, open(KOMF, 'w')); print(f'  kommune {i + 1}/{len(todo)}')
    json.dump(K, open(KOMF, 'w'))
    return K

def main(game):
    F = json.load(open(os.path.join(ROOT, 'src', 'data', 'fiske.json'))); gears = F['meta']['gear']
    hs = harbours(game); K = kommune(hs); print(f'{len(hs)} harbours, {sum(1 for h in hs if K.get(h["k"]))} with a kommune')
    byk = {}
    for h in hs:
        if K.get(h['k']): byk.setdefault(K[h['k']], []).append(h)
    out, placed, over, active, none = {}, 0, 0, 0, {}
    for knr, rows in F['kom'].items():
        # the kommune's active boats under 28 m, the biggest first: [lg, gear]
        boats = []
        for lg, g, reg, act, res in rows:
            if lg <= 3 and act > 0: boats += [(lg, g)] * act
        active += len(boats)
        if not boats: continue
        H = byk.get(knr)
        if not H: none[knr] = len(boats); continue
        boats.sort(key=lambda b: -b[0])
        # the berths of the kommune's harbours, the biggest first; a boat takes the biggest free berth that is not much smaller than her
        berths = sorted(((L, h['k'], bi) for h in H for bi, L in enumerate(h['slots'])), key=lambda b: -b[0]); used = set()
        for j, (lg, g) in enumerate(boats):
            lo, hi = LG[lg]; L = round(lo + (hi - lo) * h01(knr, j, 'L'), 1)
            pick = next(((bl, k, bi) for bl, k, bi in berths if (k, bi) not in used and bl >= min(L, 11) * 0.8), None)
            if pick is None: over += 1; continue
            bl, k, bi = pick; used.add((k, bi)); L = min(L, round(bl * 1.25, 1)) if bl < L * 0.8 else L
            out.setdefault(k, []).append([bi, L, g]); placed += 1
    empty = sum(1 for h in hs if h['k'] not in out)
    # the boats placed by length group, and the share under 11 m that fishes in the open group (the game's 2 100 boats, OPENF.n in
    # 03d-quota.js, against the boats under 11 m placed)
    lgN = [0, 0, 0, 0]
    for e in out.values():
        for bi, L, g in e: lgN[0 if L < 11 else 1 if L < 15 else 2 if L < 21 else 3] += 1
    meta = {'made': time.strftime('%Y-%m-%d'), 'src': 'Fiskeridirektoratets fartøyregister og sluttsedler (fiske.json kom, NLOD); havnene fra kartpakkene (tools/map/npc.py); kommunene fra Geonorges kommuneinfo (Kartverket)',
            'gear': gears, 'active': active, 'placed': placed, 'over': over, 'none': none, 'harbours': len(hs), 'empty': empty, 'lgN': lgN, 'openShare': round(min(0.9, 2100 / max(1, lgN[0])), 3)}
    f = os.environ.get('KYST_FLAATE') or os.path.join(ROOT, 'src', 'data', 'flaate.json')
    open(f, 'w').write(json.dumps({'meta': meta, 'h': out}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps({k: v for k, v in meta.items() if k != 'none'}), 'none:', sum(none.values()), 'in', len(none), 'kommuner', f'{os.path.getsize(f) / 1000:.0f} kB')

if __name__ == '__main__': main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'map', 'out', 'game'))
