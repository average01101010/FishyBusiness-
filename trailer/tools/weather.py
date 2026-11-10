"""Finds the hour that gives a shot the light and the weather it wants, from the game's own weather (seeded, the same every run).

    python trailer/tools/weather.py trailer/tools/weather-wants.json

For each want: a place (lat, lon), a window of days and UTC hours, and limits on the sun's elevation (degrees), the wind (m/s), the
cloud (0-1), the rain/snow (0-1), the visibility (km) and the aurora (0-1). Every quarter hour in the window is scored, and the best
few printed with their values, so the shot's "when" can be set to one of them. The game is booted without 3D (#no3d)."""
import sys, json, asyncio, functools, threading, http.server, os
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def serve(dist):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=dist))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return 'http://127.0.0.1:%d/' % srv.server_port

SCAN = """(w) => { const p = P(w.lat, w.lon), out = [], d0 = Date.parse(w.from), d1 = Date.parse(w.to), L = w.want || {};
  const inside = (v, r) => !r || ((r[0] == null || v >= r[0]) && (r[1] == null || v <= r[1]));
  const miss = (v, r) => !r ? 0 : (r[0] != null && v < r[0] ? r[0] - v : 0) + (r[1] != null && v > r[1] ? v - r[1] : 0);
  for (let t = d0; t <= d1; t += 9e5){ const hh = new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60;
    if (w.hours && (hh < w.hours[0] || hh > w.hours[1])) continue;
    const H = (t - EPOCH) / 3.6e6, s = sunAt(H, p), v = {when:new Date(t).toISOString().slice(0, 16) + 'Z', sun:+s.el.toFixed(1), az:Math.round(s.az * 180 / Math.PI) % 360,
      wind:+windAt(H, p).toFixed(1), hs:+hsAt(p, H).toFixed(2), cloud:+cloudAt(H, p).toFixed(2), rain:+precipAt(H, p).toFixed(2), vis:+visibility(H, p).toFixed(0), aur:+auroraAt(H, p).toFixed(2)};
    const bad = miss(v.sun, L.sun) / 3 + miss(v.wind, L.wind) / 2 + miss(v.cloud, L.cloud) * 4 + miss(v.rain, L.rain) * 6 + miss(v.vis, L.vis) / 5 + miss(v.aur, L.aur) * 6;
    v.score = +bad.toFixed(2); out.push(v); }
  out.sort((a, b) => a.score - b.score); return out.slice(0, w.top || 6); }"""

async def main():
    wants = json.load(open(sys.argv[1], encoding='utf-8'))
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto(serve(os.path.join(ROOT, 'dist')) + 'index.html#seed=1,notut,no3d')
        await pg.wait_for_function("typeof windAt === 'function' && typeof EPOCH === 'number' && typeof P === 'function'", timeout=120000)
        await pg.wait_for_timeout(3000)
        for name, w in wants.items():
            r = await pg.evaluate(SCAN, w)
            print('==', name, json.dumps(w.get('want')))
            for v in r: print('  ', json.dumps(v))
        await b.close()
asyncio.run(main())
