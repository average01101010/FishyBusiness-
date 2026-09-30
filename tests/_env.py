# Shared paths for the Playwright scripts. They test the built game (run `node build.mjs` first),
# and screenshots and other output land in tests/out/.
import os

HERE = os.path.dirname(os.path.abspath(__file__))
GAME_TUT = 'file://' + os.path.join(os.path.dirname(HERE), 'dist', 'index.html')
# the tests play without the first-trip tutorial; tut.py uses GAME_TUT
GAME = GAME_TUT + '#notut'
ROUTES = os.path.join(HERE, 'routes.json')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)
os.chdir(OUT)
