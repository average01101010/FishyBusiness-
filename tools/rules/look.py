# A picture of rules.json to look at (tools/rules/out/look-<name>.png): the game's land in grey, the sea inside the baseline lighter,
# the zones (F violet, K orange, O green), the baseline in black and the fjord lines dashed.
#   python3 tools/rules/look.py [name x0 y0 x1 y1 px_per_km]
import os, sys, json, numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map')); import pack
import frame
# views by their middle (lat, lon), size (km) and scale (px per km)
def view(lat, lon, w, h, k):
    x, y = frame.to_nat(lon, lat); return (float(x) - w / 2, float(y) - h / 2, float(x) + w / 2, float(y) + h / 2, k)
VIEWS = {'nord': view(69.6, 20.5, 900, 520, 1.3), 'senja': view(69.3, 17.6, 200, 160, 5), 'vesteralen': view(68.75, 15.6, 180, 140, 5),
         'lofoten': view(68.2, 14.6, 200, 160, 4.5), 'finnmark': view(70.6, 25.5, 330, 200, 3), 'midt': view(64.0, 10.5, 320, 300, 2.5),
         'oslo': view(59.5, 10.5, 140, 230, 3.5)}
def dec(a, u):
    o = np.cumsum(np.array(a, float).reshape(-1, 2), axis=0) * u; return o
def main():
    R = json.load(open(os.environ.get('KYST_RULES') or os.path.join(ROOT, 'src', 'data', 'rules.json'))); u = R['unit']
    L200, _ = pack.read_layer(sys.argv[1] if len(sys.argv) > 1 and os.path.isdir(sys.argv[1]) else os.path.join(ROOT, 'tools', 'map', 'out', 'game'), 'land200')
    views = VIEWS if len(sys.argv) < 7 else {sys.argv[1]: tuple(float(v) for v in sys.argv[2:7])}
    for name, (x0, y0, x1, y1, k) in views.items():
        W, H = int((x1 - x0) * k), int((y1 - y0) * k); im = Image.new('RGB', (W, H), (190, 214, 236)); d = ImageDraw.Draw(im)
        tf = lambda P: [((x - x0) * k, (y - y0) * k) for x, y in P]
        for r in R['blin']: d.polygon(tf(dec(r[0], u)), fill=(222, 236, 248))
        col = {'F': (170, 120, 210), 'FK': (230, 150, 60), 'O': (110, 190, 120)}
        for z in R['zones']:
            for r in z['r']: d.polygon(tf(dec(r[0], u)), fill=col.get(z['f'], (200, 80, 80)))
        sub = L200[int(y0 / 0.2):int(y1 / 0.2), int(x0 / 0.2):int(x1 / 0.2)] > 0
        land = Image.fromarray((sub * 255).astype(np.uint8)).resize((W, H), Image.NEAREST)
        im.paste((150, 150, 140), mask=land)
        d.line(tf(dec(R['bl'], u)), fill=(0, 0, 0), width=2)
        for f in R['L'].get('2', {}).get('f', []):
            for l in f.get('l', []): d.line(tf(dec(l, u)), fill=(120, 20, 140), width=2)
        for f in R['L'].get('5', {}).get('f', []):
            for l in f.get('l', []): d.line(tf(dec(l, u)), fill=(200, 90, 0), width=2)
        out = os.path.join(HERE, 'out', f'look-{name}.png'); im.save(out); print(out, W, H)
if __name__ == '__main__': main()
