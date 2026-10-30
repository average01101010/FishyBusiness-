"""The picture behind the loading screen and the sign-in, with the sjark of the app icon (Jonas 08.10.2026: «Kunne du laget det bildet til
innlastingsbildet?»): the same scene as tools/brand/logo.py (the Havsjark 35 at the blue hour, her wheelhouse lit, Senja's peaks with snow
behind, the low sun's glow on the water), framed wide and upright. The title stays in CSS over the sky (.ld-k, .ld-t in styles.css, Source
Serif 4) and the progress bar over the water, so the boat stands in the middle third; wide, a little right of the middle so the sign-in's
card can stand to the left of her.

    pip install bpy==4.5.4 pillow
    python3 tools/brand/loader_sjark.py          -> src/data/loader-land.b64 (1600 x 1000) and loader-port.b64 (960 x 1600), WebP as
                                                    base64; the renders in tools/brand/out/
    python3 tools/brand/loader_sjark.py quick    -> small renders, to try the composition (nothing written to src/data)
    python3 tools/brand/loader_sjark.py port     -> only the upright one (or land: only the wide one)

The naust picture it replaces is tools/brand/loader.py (kept)."""
import os, sys, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import bpy
import logo as LO
from logo import principled, peaks, world, sun, sea, boat, setup, camera, render
from bpyutil import reset

OUT = os.path.join(HERE, 'out'); DATA = os.path.join(ROOT, 'src', 'data'); QUICK = 'quick' in sys.argv


def scene():
    reset(); world(); sun(); sea(); boat()
    rockN = principled('rockN', (0.05, 0.075, 0.12), rough=0.9); snowN = principled('snowN', (0.70, 0.76, 0.86), rough=0.7)
    rockF = principled('rockF', (0.14, 0.22, 0.38), rough=0.9); snowF = principled('snowF', (0.62, 0.70, 0.82), rough=0.8)
    peaks('near', 520, 160, -900, 900, [(-310, 70, 70), (-235, 92, 55), (-170, 64, 60), (-60, 50, 90), (60, 84, 48), (110, 102, 42), (165, 76, 50), (290, 60, 85), (420, 72, 70), (560, 80, 60), (700, 66, 70)], rockN, snowN, 1.0)
    peaks('far', 1300, 300, -2400, 2400, [(-1500, 140, 240), (-900, 150, 260), (-420, 190, 200), (150, 170, 240), (700, 210, 260), (1200, 160, 220), (1800, 150, 240)], rockF, snowF, 2.3, nx=300, ny=24)


def shot(path, w, h, loc, look, lens, shift_x=0.0, shift_y=0.0):
    k = 0.4 if QUICK else 1.0
    sc = setup(int(w * k), int(h * k), 20 if QUICK else 96); sc.view_settings.exposure = 0.4
    camera(loc, look, lens, shift_x=shift_x, shift_y=shift_y); render(path)


def webp_b64(png, name, q):
    from PIL import Image
    im = Image.open(png).convert('RGB'); p = os.path.join(OUT, name + '.webp'); im.save(p, 'WEBP', quality=q, method=6)
    open(os.path.join(DATA, name + '.b64'), 'w').write(base64.b64encode(open(p, 'rb').read()).decode())
    print(name, im.size, os.path.getsize(p), 'bytes')


def main():
    os.makedirs(OUT, exist_ok=True); scene()
    land = os.path.join(OUT, 'loader-land.png'); port = os.path.join(OUT, 'loader-port.png')
    only = [a for a in ('land', 'port') if a in sys.argv] or ['land', 'port']
    look = (0.4, 0.0, 3.0)
    if 'land' in only: shot(land, 1600, 1000, (0.0, -30.0, 2.6), look, 40, shift_x=-0.12, shift_y=-0.02)
    if 'port' in only: shot(port, 960, 1600, (0.0, -24.0, 2.6), look, 34, shift_y=0.0)
    if QUICK: return
    if 'land' in only: webp_b64(land, 'loader-land', 84)
    if 'port' in only: webp_b64(port, 'loader-port', 84)


if __name__ == '__main__':
    main()
