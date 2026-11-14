"""npcshot.py in 800x1280 (the NPC fleet's ship models at their quays and under way, by day and by night): one format a run, so each
keeps under the runner's 15 minutes."""
import os, runpy
os.environ['NPC_SHOT_FMT'] = 'staaende'
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'npcshot.py'), run_name='__main__')
