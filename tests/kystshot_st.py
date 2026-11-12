"""kystshot.py in 800x1280 (the coastal ship and an express boat at their quays at Tromsø, in 3D): one format a run, so each keeps
under the runner's 15 minutes."""
import os, runpy
os.environ['KYST_SHOT_FMT'] = 'staaende'
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kystshot.py'), run_name='__main__')
