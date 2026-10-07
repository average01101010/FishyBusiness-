#!/usr/bin/env python3
# The lighthouses along the whole coast for the missions «Bilde for Kystposten» (core/09g-turer.js turFoto, 07.10.2026): the named
# lights of the newest sjomerker- release (release.py marks(), from OpenStreetMap's seamark tags, in the national frame) that are
# lighthouses and not harbour, pier, leading or range lights: a major light, a range of 10 nautical miles or more, or «fyr» in the name.
#   python3 tools/map/fyr.py   ->  src/data/fyr.json  [[x km, y km, height m, name], ...]
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from release import marks
BAD = re.compile(r'molo|innflygning|havnefyr|bifyr|lykt|lanterne|overr?ett|ledfyr|ledlykt|øvre|nedre|kirke|tårn|bøye|stake|\d|[, ]N[ØV]?$|[, ]S[ØV]?$', re.I)
def main():
    f = marks()
    if not f: sys.exit('no sjomerker release')
    L = json.load(open(f))['lights']
    out, seen = [], []
    for q in L:
        name = (q[7] or '').strip()
        if not name or BAD.search(name) or q[2] < 8 or q[1] < 0: continue   # not Svalbard (north of the frame)
        if not (q[6] == 'M' or q[3] >= 10 or 'fyr' in name.lower()): continue
        if any(n == name and abs(x - q[0]) < 2 and abs(y - q[1]) < 2 for x, y, n in seen): continue   # one of each
        seen.append((q[0], q[1], name)); out.append([round(q[0], 3), round(q[1], 3), round(q[2], 1), name])
    out.sort(key=lambda r: (r[1], r[0]))
    dst = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'fyr.json')
    json.dump(out, open(dst, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(json.dumps({'fyr': len(out), 'kb': round(os.path.getsize(dst) / 1e3, 1), 'from': os.path.basename(os.path.dirname(f))}))
if __name__ == '__main__': main()
