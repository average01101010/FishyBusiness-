#!/usr/bin/env python3
"""The county (fylke) of every port, for the admin's media card (M9, steg 28; docs/planer/butikker-og-sponsorer.md 4.6).

The game's data has no county lines, so each port's point is asked of Kartverket's «Kommuneinfo» API (ws.geonorge.no/kommuneinfo/v1/punkt,
Kartverket's «Administrative enheter», open data under CC BY 4.0), which gives the municipality and the county a point lies in. The
municipalities reach out over the sea to the baseline, so a port's point on the water is in one. Svalbard is in no county (the API has
no answer there): its ports get «Svalbard».

    KYST_WRITE=1 node tests/unit/run.mjs regions   writes tools/regions/havner.json (each port's id and lat, lon) and port-regions.json
    python3 tools/regions/fylke.py                 asks for the ports that are new or have moved, writes tools/regions/fylke.json
    KYST_WRITE=1 node tests/unit/run.mjs regions   puts the counties into src/data/port-regions.json (build.mjs: the admin page)

A port the API has no county for (not Svalbard) is asked again a little way off, up to 3 km in eight directions, and is printed; one that
still has none stays out of fylke.json, and the unit test is red until it has one.
"""
import json, math, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
PORTS = os.path.join(HERE, 'havner.json')
OUT = os.path.join(HERE, 'fylke.json')
API = 'https://ws.geonorge.no/kommuneinfo/v1/punkt?nord=%.6f&ost=%.6f&koordsys=4258'


def ask(lat, lon):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(API % (lat, lon), headers={'User-Agent': 'kystfiske-regions/1'}), timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if 400 <= e.code < 500: return None   # (no municipality at the point: 404, and maybe 400 or 422 for one beyond the baseline)
            if i == 3: raise
        except (urllib.error.URLError, TimeoutError):
            if i == 3: raise
        time.sleep(1 + 2 * i)


def county(lat, lon):
    if lat > 74: return {'fylke': 'Svalbard', 'nr': '', 'kommune': 'Svalbard', 'off': 0}
    j = ask(lat, lon)
    if j: return {'fylke': j['fylkesnavn'], 'nr': j['fylkesnummer'], 'kommune': j['kommunenavn'], 'off': 0}
    for d in (0.5, 1.0, 2.0, 3.0):   # km
        for k in range(8):
            a = k * math.pi / 4; la = lat + d / 111.2 * math.cos(a); lo = lon + d / (111.2 * math.cos(math.radians(lat))) * math.sin(a)
            j = ask(la, lo)
            if j: return {'fylke': j['fylkesnavn'], 'nr': j['fylkesnummer'], 'kommune': j['kommunenavn'], 'off': d}
    return None


def main():
    ports = json.load(open(PORTS, encoding='utf-8'))
    had = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    out, asked, off, none = {}, 0, [], []
    for pid, (lat, lon) in sorted(ports.items()):
        h = had.get(pid)
        if h and abs(h['lat'] - lat) < 1e-5 and abs(h['lon'] - lon) < 1e-5: out[pid] = h; continue
        c = county(lat, lon); asked += 1
        if not c: none.append(pid); continue
        if c['off']: off.append('%s (%s km)' % (pid, c['off']))
        out[pid] = dict(c, lat=lat, lon=lon)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0, sort_keys=True)
    open(OUT, 'a').write('\n')
    by = {}
    for v in out.values(): by[v['fylke']] = by.get(v['fylke'], 0) + 1
    print('%d havner, %d spurt nå; fylkene: %s' % (len(out), asked, ', '.join('%s %d' % kv for kv in sorted(by.items()))))
    if off: print('fant fylket et stykke unna: ' + ', '.join(off))
    if none: print('FEIL uten fylke: ' + ', '.join(none)); sys.exit(1)


if __name__ == '__main__':
    main()
