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
# the hand-drawn routes, in the national frame (km, UTM 33: x = (E + 250 km) / 1000, y = (8050 km - N) / 1000)
ROUTES = os.path.join(HERE, 'routes.json')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
os.chdir(OUT)


async def boot(pg, url=None):
    """Open the game and press «Start» on the first screen. It waits for the page and the start, not for fixed pauses."""
    await pg.goto(url or GAME)
    await pg.wait_for_selector('#obGo', state='visible', timeout=90000)
    await pg.click('#obGo')
    await pg.wait_for_function("S.intro === true && document.getElementById('modal').hidden", timeout=30000)
