# Reference values for tests/projtest.py from pyproj (PROJ, EPSG:25833 ETRS89 / UTM 33N): a grid over Norway and the far corners.
# pip install pyproj; python3 tools/map/projref.py
import json, os
from pyproj import Transformer, Proj
T = Transformer.from_crs(4258, 25833, always_xy=True); P = Proj('EPSG:25833')
pts = [(lat / 10, lon / 10) for lat in range(578, 716, 23) for lon in range(40, 320, 31)]
# the seas the ocean fleet fishes, for the frame of H1b (docs/planer/havsteget-h1b-rammen.md): Bjørnøya, Svalbard, the snow crab
# grounds, the Russian zone, Jan Mayen, Iceland, the Denmark Strait, East Greenland, the Faroes, Shetland and the North Sea west
pts += [(74.45, 19.0), (76.5, 16.5), (80.8, 20.0), (80.1, 32.0), (76.0, 35.0), (73.5, 37.0), (68.5, 44.0), (69.5, 52.0), (74.0, 56.0),
        (71.0, -8.5), (66.5, -18.0), (64.1, -22.0), (66.5, -27.0), (70.0, -22.0), (62.0, -7.0), (61.0, -1.0), (59.0, -2.0)]
pts += [(69.7895, 30.9555), (71.1854, 25.7836), (58.9, 11.43), (59.3101, 4.8798), (69.5435, 17.6655), (58.0, 7.0), (70.95, 31.15), (57.75, 4.0)]
out = []
for lat, lon in pts:
    E, N = T.transform(lon, lat); f = P.get_factors(lon, lat)
    out.append({'lat': lat, 'lon': lon, 'E': round(E, 5), 'N': round(N, 5), 'gamma': round(f.meridian_convergence, 9), 'k': round(f.meridional_scale, 10)})
json.dump(out, open(os.path.join(os.path.dirname(__file__), '..', '..', 'tests', 'proj_ref.json'), 'w'), indent=0)
print(len(out), 'points')
