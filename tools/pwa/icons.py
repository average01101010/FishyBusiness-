# The app's icons for the home screen (P1 of the PWA plan, 03.10.2026): a red sjark on a dark sea under snowy peaks in the polar dusk.
# Drawn at 4 x and scaled down (smooth edges). icon-512 and icon-192 fill the square; icon-maskable-512 keeps the picture inside the
# middle 80 % that Android's masks leave (the safe zone), on the same background.
#   python3 tools/pwa/icons.py   writes src/pwa/icon-192.png, icon-512.png and icon-maskable-512.png
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'pwa')

def scene(n, inset):
    S = n * 4; im = Image.new('RGB', (S, S)); d = ImageDraw.Draw(im)
    top, mid, low = (12, 28, 52), (60, 78, 112), (214, 132, 108)   # night blue, dusk violet, the glow under the horizon
    hz = int(S * 0.62)
    for y in range(hz):
        t = y / hz; c = tuple(int(top[k] + (mid[k] - top[k]) * min(1, t * 1.4)) for k in range(3)) if t < 0.7 else tuple(int(mid[k] + (low[k] - mid[k]) * (t - 0.7) / 0.3) for k in range(3))
        d.line([(0, y), (S, y)], fill=c)
    for y in range(hz, S):
        t = (y - hz) / (S - hz); d.line([(0, y), (S, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip((26, 52, 78), (8, 20, 34))))
    m = inset * S; W = S - 2 * m; X = lambda u: m + u * W; Y = lambda v: m + v * W
    # the peaks, with snow on their tops
    peaks = [(-0.05, 0.62), (0.08, 0.44), (0.2, 0.52), (0.36, 0.3), (0.52, 0.5), (0.64, 0.4), (0.8, 0.55), (0.92, 0.46), (1.05, 0.62)]
    d.polygon([(X(u), Y(v)) for u, v in peaks] + [(X(1.05), Y(0.62)), (X(-0.05), Y(0.62))], fill=(30, 40, 58))
    for (u0, v0), (u1, v1), (u2, v2) in zip(peaks, peaks[1:], peaks[2:]):
        if v1 < v0 and v1 < v2:
            k = 0.32; d.polygon([(X(u1), Y(v1)), (X(u1 + (u2 - u1) * k), Y(v1 + (v2 - v1) * k)), (X(u1 + (u2 - u1) * k * 0.5), Y(v1 + (v2 - v1) * k * 0.8)), (X(u1 - (u1 - u0) * k * 0.4), Y(v1 + (v0 - v1) * k * 0.9)), (X(u1 - (u1 - u0) * k), Y(v1 + (v0 - v1) * k))], fill=(232, 238, 246))
    # a light glinting on the water under the dusk
    d.rectangle([X(0.0), Y(0.625), X(1.0), Y(0.632)], fill=(170, 120, 112))
    # the sjark: red hull with a white rail, white wheelhouse with dark windows, the mast with its top light
    hull = [(X(0.2), Y(0.66)), (X(0.84), Y(0.66)), (X(0.78), Y(0.75)), (X(0.27), Y(0.75))]
    d.polygon(hull, fill=(196, 38, 34)); d.rectangle([X(0.2), Y(0.655), X(0.84), Y(0.668)], fill=(240, 240, 236))
    d.rectangle([X(0.27), Y(0.575), X(0.45), Y(0.66)], fill=(244, 244, 240)); d.rectangle([X(0.29), Y(0.59), X(0.43), Y(0.615)], fill=(30, 44, 60))
    d.rectangle([X(0.355), Y(0.44), X(0.37), Y(0.575)], fill=(224, 224, 220)); d.ellipse([X(0.348), Y(0.428), X(0.377), Y(0.452)], fill=(255, 236, 170))
    d.rectangle([X(0.6), Y(0.6), X(0.74), Y(0.62)], fill=(230, 160, 40))   # the fish boxes on deck
    # the wake and the ripples
    for k, (u, w) in enumerate([(0.12, 0.08), (0.05, 0.12), (0.86, 0.06)]):
        d.rectangle([X(u), Y(0.77 + k * 0.025), X(u + w), Y(0.775 + k * 0.025)], fill=(120, 150, 175))
    d.polygon([(X(0.27), Y(0.75)), (X(0.78), Y(0.75)), (X(0.74), Y(0.77)), (X(0.31), Y(0.77))], fill=(70, 30, 34))   # her shadow on the water
    return im.resize((n, n), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
scene(512, 0.0).save(os.path.join(OUT, 'icon-512.png'), optimize=True)
scene(192, 0.0).save(os.path.join(OUT, 'icon-192.png'), optimize=True)
scene(512, 0.1).save(os.path.join(OUT, 'icon-maskable-512.png'), optimize=True)
print('icons in', os.path.normpath(OUT))
