# Shared paths for the Playwright scripts. They test the built game (run `node build.mjs` first),
# and screenshots and other output land in tests/out/.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
GAME_TUT = 'file://' + os.path.join(os.path.dirname(HERE), 'dist', 'index.html')
# the tests play without the first-trip tutorial; tut.py uses GAME_TUT
GAME = GAME_TUT + '#notut'
# KYST_LITE=1 (tests/run.py sets it for the tests that do not look at 3D): the game runs as before, but no 3D frame is drawn,
# which is most of the time a test takes with SwiftShader
if os.environ.get('KYST_LITE') == '1':
    GAME = GAME_TUT + '#notut,no3d'
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
