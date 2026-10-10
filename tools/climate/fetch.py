"""The climate along the coast (V1 of the weather plan, 06.10.2026; Jonas: «Vi skal jo ikke ha ekte live-vær, men vi må kunne simulere
været langs hele kysten på en god måte, med variasjoner fra sted til sted»). Not live weather: the average of each month at points along
the coast, which the game's simulated weather varies around (core/03-simulation.js climAt).

For each point of tools/climate/klima.json, from Open-Meteo (open-meteo.com, CC BY 4.0):
  - the ERA5 reanalysis (Copernicus/ECMWF) for the years in "period": the daily mean air temperature, precipitation, snowfall, the day's
    strongest wind (10 m) and the cloud cover, made into monthly means: t (°C), p (mm a month), snow (cm a month), wmax (m/s), gale (the
    share of days whose strongest wind is a gale, 17.2 m/s or more) and cloud (%)
  - the marine API's sea surface temperature for the years in "sst_years", as monthly means (sst, °C); where the point's own cell is
    land, the nearest sea cell west of it
Open-Meteo counts a long request as many calls (about one per 14 days of data), so the script waits between points and backs off when
told to; the whole fetch takes an hour or two. Run by .github/workflows/klima.yml (the cloud session cannot reach Open-Meteo).

    python3 tools/climate/fetch.py climate.json
"""
import json, os, sys, time
from datetime import date
import requests

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, 'klima.json'), encoding='utf-8'))
ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'
MARINE = 'https://marine-api.open-meteo.com/v1/marine'
DAILY = ['temperature_2m_mean', 'precipitation_sum', 'snowfall_sum', 'wind_speed_10m_max', 'cloud_cover_mean']


def get(url, params, tries=12):
    for k in range(tries):
        try:
            r = requests.get(url, params=params, timeout=300)
            if r.status_code == 200:
                return r.json()
            print('  ', r.status_code, r.text[:200], flush=True)
            if r.status_code in (429, 500, 502, 503, 504):
                time.sleep(min(3600, 60 * 2 ** k)); continue
            r.raise_for_status()
        except requests.RequestException as e:
            print('  ', e, flush=True); time.sleep(min(3600, 60 * 2 ** k))
    raise SystemExit('gave up on ' + url)


def monthly(times, vals, how='mean'):
    """Monthly means (how='mean') or mean monthly sums (how='sum') of daily values; None where there is nothing"""
    acc = {}
    for t, v in zip(times, vals):
        if v is None:
            continue
        y, m = int(t[:4]), int(t[5:7])
        acc.setdefault((y, m), []).append(v)
    out = []
    for m in range(1, 13):
        per = [sum(v) if how == 'sum' else sum(v) / len(v) for (y, mm), v in acc.items() if mm == m]
        out.append(round(sum(per) / len(per), 2) if per else None)
    return out


def main(dst):
    y0, y1 = CFG['period']; s0, s1 = CFG['sst_years']; pts = []
    for name, lat, lon in CFG['points']:
        print(name, lat, lon, flush=True)
        d = get(ARCHIVE, {'latitude': lat, 'longitude': lon, 'start_date': f'{y0}-01-01', 'end_date': f'{y1}-12-31', 'daily': ','.join(DAILY),
                          'wind_speed_unit': 'ms', 'timezone': 'UTC'})['daily']
        T = d['time']
        rec = {'n': name, 'lat': lat, 'lon': lon, 't': monthly(T, d['temperature_2m_mean']), 'p': monthly(T, d['precipitation_sum'], 'sum'),
               'snow': monthly(T, d['snowfall_sum'], 'sum'), 'wmax': monthly(T, d['wind_speed_10m_max']),
               'gale': monthly(T, [None if w is None else (1.0 if w >= 17.2 else 0.0) for w in d['wind_speed_10m_max']]),
               'cloud': monthly(T, d['cloud_cover_mean'])}
        time.sleep(300)   # the archive request counts as some 400 calls; keep under the hourly limit (5 000)
        sst = None
        for dl in (0, -0.25, -0.5, -0.75, -1.0, -1.5):
            m = get(MARINE, {'latitude': lat, 'longitude': lon + dl, 'start_date': f'{s0}-01-01', 'end_date': f'{s1}-12-31',
                             'hourly': 'sea_surface_temperature', 'timezone': 'UTC'})
            h = m.get('hourly') or {}
            vals = h.get('sea_surface_temperature') or []
            if sum(v is not None for v in vals) > len(vals) * 0.8:
                sst = monthly([t[:10] for t in h['time']], vals); rec['sstLon'] = round(lon + dl, 2); break
            time.sleep(20)
        rec['sst'] = sst
        print('  t', rec['t'], '\n  p', rec['p'], '\n  sst', sst, flush=True)
        pts.append(rec)
        time.sleep(60)
    out = {'made': date.today().isoformat(), 'period': [y0, y1], 'sstYears': [s0, s1],
           'src': 'Open-Meteo (CC BY 4.0): ERA5 reanalysis (Copernicus Climate Change Service/ECMWF) and the marine API', 'pts': pts}
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote', dst, len(pts), 'points')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'climate.json')
