import pickle, numpy as np, math
from PIL import Image, ImageDraw
from shapely.geometry import Polygon, MultiPolygon
KY = 111.32; KX = 111.32 * math.cos(69.35 * math.pi / 180); C = 0.025; NX, NY = 3140, 3296
d = pickle.load(open('senja_land.pkl', 'rb'))
def raster(polys, scale=1):
    im = Image.new('L', (NX * scale, NY * scale), 0); dr = ImageDraw.Draw(im)
    f = lambda cs: [((lon - 16.55) * KX / C * scale, (69.72 - lat) * KY / C * scale) for lon, lat in cs]
    for p in polys:
        for q in (p.geoms if isinstance(p, MultiPolygon) else [p]):
            dr.polygon(f(q.exterior.coords), fill=1)
            for h in q.interiors: dr.polygon(f(h.coords), fill=0)
    return np.array(im)
polys = [g for g, s in zip(d['g'], d['sub']) if s == 'land' and g.geom_type in ('Polygon', 'MultiPolygon')]
ov = raster(polys)
gm = np.load('game_mask.npy')
agree = (ov == gm).mean(); ol = ((ov == 1) & (gm == 0)).sum(); gl = ((ov == 0) & (gm == 1)).sum()
print('cells', ov.size, 'agree', round(agree * 100, 3), '% ; Overture land / game sea', ol, '; game land / Overture sea', gl)
print('land share overture', ov.mean().round(4), 'game', gm.mean().round(4))
np.save('ov_mask.npy', ov)
# diff picture: grey = both land, white = both sea, red = Overture land only, blue = game land only
rgb = np.full((NY, NX, 3), 255, np.uint8); rgb[(ov == 1) & (gm == 1)] = (150, 150, 150); rgb[(ov == 1) & (gm == 0)] = (220, 30, 30); rgb[(ov == 0) & (gm == 1)] = (30, 60, 220)
Image.fromarray(rgb).save('senja_diff.png')
Image.fromarray(rgb).resize((785, 824), Image.NEAREST).save('senja_diff_small.png')
