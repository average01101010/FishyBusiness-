# Shared paths for the Playwright scripts. They test the built game (run `node build.mjs` first),
# and screenshots and other output land in tests/out/.
import os, threading, functools, http.server

HERE = os.path.dirname(os.path.abspath(__file__))
# the game is served over HTTP from dist/ (it fetches its map data from dist/map/, which a file:// page cannot), by a server of
# this test's own on a free port; each test gets its own origin, so its own localStorage
class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
_SRV = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(_Quiet, directory=os.environ.get('KYST_DIST') or os.path.join(os.path.dirname(HERE), 'dist')))
threading.Thread(target=_SRV.serve_forever, daemon=True).start()
BASE = 'http://127.0.0.1:%d/' % _SRV.server_port
GAME_TUT = BASE + 'index.html'
# the tests play without the first-trip tutorial; tut.py uses GAME_TUT
GAME = GAME_TUT + '#notut'
# KYST_LITE=1 (tests/run.py sets it for the tests that do not look at 3D): the game runs as before, but no 3D frame is drawn,
# which is most of the time a test takes with SwiftShader
if os.environ.get('KYST_LITE') == '1':
    GAME = GAME_TUT + '#notut,no3d'
ROUTES = os.path.join(HERE, 'routes.json')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
# KYST_SHIFT=1 (the torture test of the coast plan, phase K2): the game runs with #frameshift, which moves the map 1000 km east and
# south, and the hand-drawn routes are moved with it. A test that still passes legacy km to the game shows up.
SHIFT = 1000 if os.environ.get('KYST_SHIFT') == '1' else 0
if SHIFT:
    GAME_TUT += '#frameshift'; GAME += ',frameshift'
    import json as _json
    _r = {k: [{**q, 'x': q['x'] + SHIFT, 'y': q['y'] + SHIFT} for q in v] for k, v in _json.load(open(ROUTES)).items()}
    ROUTES = os.path.join(OUT, 'routes_shift.json'); _json.dump(_r, open(ROUTES, 'w'))
os.chdir(OUT)


async def boot(pg, url=None):
    """Open the game and press «Start» on the first screen. It waits for the page and the start, not for fixed pauses."""
    await pg.goto(url or GAME)
    await pg.wait_for_selector('#obGo', state='visible', timeout=90000)
    await pg.click('#obGo')
    await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=30000)
