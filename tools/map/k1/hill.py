import sys, numpy as np, math
from PIL import Image
from terrain import stitch
# Husøy and its harbour, about 4 x 3 km
box = (17.60, 69.525, 17.73, 69.562)
def shade(g, m_per_px):
    gy, gx = np.gradient(g, m_per_px); s = (-gx * math.cos(math.radians(315)) - gy * math.sin(math.radians(315)))
    sl = np.hypot(gx, gy); v = (math.cos(math.radians(45)) + math.sin(math.radians(45)) * s / np.maximum(sl, 1e-6) * np.sin(np.arctan(sl))) / np.sqrt(1)
    v = np.clip(0.5 + 0.5 * (s / np.sqrt(1 + sl ** 2)), 0, 1)
    img = (v * 220 + 20).astype(np.uint8); rgb = np.stack([img] * 3, -1); rgb[g <= 0.5] = (70, 110, 140); return rgb
out = []
for z in [11, 13]:
    g, bb = stitch(box, z); mpp = 40075016 * math.cos(math.radians(69.55)) / 2 ** z / 256
    im = Image.fromarray(shade(g, mpp))
    # crop to the box
    W, H = im.size; x0 = (box[0] - bb[0]) / (bb[2] - bb[0]) * W; x1 = (box[2] - bb[0]) / (bb[2] - bb[0]) * W
    from terrain import ty
    y0 = (ty(box[3], z) - ty(bb[1], z)) / (ty(bb[3], z) - ty(bb[1], z)) * H; y1 = (ty(box[1], z) - ty(bb[1], z)) / (ty(bb[3], z) - ty(bb[1], z)) * H
    im = im.crop((int(x0), int(y0), int(x1), int(y1))).resize((600, 440), Image.NEAREST if z == 11 else Image.BILINEAR)
    out.append(im); print('z', z, 'm/px', round(mpp, 1), 'max h', g.max())
sh = Image.new('RGB', (1210, 440), 'white'); sh.paste(out[0], (0, 0)); sh.paste(out[1], (610, 0)); sh.save('husoy_z11_z13.png')
