# Norway on a 200 m UTM33 grid: land, territorial sea, the coastal band (land within 3 km of the sea) and the sea within reach
import pickle, numpy as np, json
from pyproj import Transformer
from PIL import Image, ImageDraw
from scipy import ndimage
land, mar = pickle.load(open('norway.pkl', 'rb'))[::-1] if False else None, None
geo = pickle.load(open('norway.pkl', 'rb')); mar, land = geo[0], geo[1]
T = Transformer.from_crs(4326, 25833, always_xy=True)
C = 200.0; E0, N1 = -250000.0, 8050000.0; NX, NY = int(1450e3 / C), int(1720e3 / C)
def draw(g, val, im):
    dr = ImageDraw.Draw(im)
    for q in getattr(g, 'geoms', [g]):
        xs, ys = T.transform(*np.array(q.exterior.coords).T)
        dr.polygon(list(zip((xs - E0) / C, (N1 - ys) / C)), fill=val)
        for h in q.interiors:
            xs, ys = T.transform(*np.array(h.coords).T); dr.polygon(list(zip((xs - E0) / C, (N1 - ys) / C)), fill=0)
    return im
L = np.array(draw(land, 1, Image.new('L', (NX, NY), 0))).astype(bool)
M = np.array(draw(mar, 1, Image.new('L', (NX, NY), 0))).astype(bool)
sea = M & ~L
a = C * C / 1e6
dsea = ndimage.distance_transform_edt(~sea) * C / 1000   # km from the Norwegian sea, for land cells
band3 = L & (dsea <= 3); band1 = L & (dsea <= 1)
dland = ndimage.distance_transform_edt(~L) * C / 1000
R = {'land_km2': int(L.sum() * a), 'territorialSea_km2': int(sea.sum() * a), 'band3_km2': int(band3.sum() * a), 'band1_km2': int(band1.sum() * a),
     'sea_within2km_km2': int((sea & (dland <= 2)).sum() * a), 'sea_within10km_km2': int((sea & (dland <= 10)).sum() * a)}
print(json.dumps(R)); json.dump(R, open('national.json', 'w'))
np.save('nat_L.npy', L); np.save('nat_sea.npy', sea)
rgb = np.full((NY, NX, 3), 235, np.uint8); rgb[sea] = (120, 170, 210); rgb[L] = (190, 190, 180); rgb[band3] = (120, 120, 110)
Image.fromarray(rgb).resize((NX // 8, NY // 8), Image.NEAREST).save('national.png')
