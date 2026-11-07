# The national frame of the game (phase K4 of the coast plan): UTM zone 33 (EPSG:25833) in km, x = (E + 250 km) / 1000 east and
# y = (8 050 km - N) / 1000 south. Cells of a layer are numbered from the frame's origin: cell (ix, iy) of size c km covers
# x in [ix c, (ix + 1) c); blocks are 10 km and tiles 50 km, so they line up along the whole coast (src/js/core/01b-mapdata.js).
import numpy as np
from pyproj import Transformer
E0, N1 = -250000.0, 8050000.0
BLOCK, TILE = 10, 50
# The frames, in km (x0, y0, x1, y1), the one place the pipeline takes them from (H1b R2 of the ocean step, 03.11.2026):
#   FRAME  the game's frame (MAPB in src/js/core/01-world.js): from H1b R1 East Greenland and the Denmark Strait, Iceland, Jan Mayen,
#          all Svalbard and the Russian zone to Novaya Zemlya. The origin stays where it was (the saves keep their places).
#   OLD    the frame of the coast (phase K6), which the national core's fine layers (land200, dc200, expo) and the coast's tiles keep:
#          their cells are numbered from it, and the 100 m layer's cell numbers are baked into the route data (DC, 01-world.js), so
#          it does not move. Its layers run to OLD_Y1 (whole 50 km tiles).
#   WIDE   FRAME padded to whole 100 km blocks: the wide frame's coarse layers (land1k, dc1k, expo2k, deep) cover it.
FRAME = (-1100, -1250, 2500, 1720)
OLD = (0, 0, 1450, 1720); OLD_Y1 = 1750
WIDE = (-1100, -1300, 2500, 1800)
# the 50 km tiles of the frame (tx0, ty0, tx1, ty1 exclusive), and whether a tile lies inside the old frame's layers
FRAME_TILES = (FRAME[0] // TILE, FRAME[1] // TILE, -(-FRAME[2] // TILE), -(-FRAME[3] // TILE))
def in_old(tx, ty): return 0 <= tx * TILE and (tx + 1) * TILE <= OLD[2] and 0 <= ty * TILE and (ty + 1) * TILE <= OLD_Y1
_F = Transformer.from_crs(4326, 25833, always_xy=True)
_I = Transformer.from_crs(25833, 4326, always_xy=True)
def to_nat(lon, lat):
    e, n = _F.transform(np.asarray(lon, float), np.asarray(lat, float)); return (e - E0) / 1000, (N1 - n) / 1000
def to_ll(x, y):
    return _I.transform(np.asarray(x, float) * 1000 + E0, N1 - np.asarray(y, float) * 1000)
# the legacy Senja frame (01-world.js LEGF): flat at 69.35 N, km east and south of 69.72 N 16.55 E
LEG = dict(KY=111.32, KX=111.32 * np.cos(np.radians(69.35)), lat0=69.72, lon0=16.55)
def leg_to_ll(x, y): return LEG['lon0'] + np.asarray(x) / LEG['KX'], LEG['lat0'] - np.asarray(y) / LEG['KY']
def ll_to_leg(lon, lat): return (np.asarray(lon) - LEG['lon0']) * LEG['KX'], (LEG['lat0'] - np.asarray(lat)) * LEG['KY']
# a region: whole 10 km blocks (bx0..bx1, by0..by1 exclusive) in the national frame
class Region:
    def __init__(s, name, bx0, by0, bx1, by1): s.name, s.bx0, s.by0, s.bx1, s.by1 = name, bx0, by0, bx1, by1
    def km(s): return s.bx0 * BLOCK, s.by0 * BLOCK, s.bx1 * BLOCK, s.by1 * BLOCK
    def lonlat_box(s, pad_km=2):
        x0, y0, x1, y1 = s.km(); xs = np.linspace(x0 - pad_km, x1 + pad_km, 21); ys = np.linspace(y0 - pad_km, y1 + pad_km, 21)
        X, Y = np.meshgrid(xs, ys); lon, lat = to_ll(X.ravel(), Y.ravel()); return float(lon.min()), float(lat.min()), float(lon.max()), float(lat.max())
    # the cell centres of a layer of cell size c (km) over the region, as two 2-D arrays of km
    def grid(s, c):
        n = round(BLOCK / c); ix0, iy0 = s.bx0 * n, s.by0 * n; nx, ny = (s.bx1 - s.bx0) * n, (s.by1 - s.by0) * n
        return ix0, iy0, nx, ny
# Senja: the blocks round the legacy square (as tools/mappack.mjs made them in K4)
REGIONS = {'senja': Region('senja', 80, 31, 90, 40)}
