"""npcshot.py with NPC_SHOT_SET=skip (N7's second part, steg 36: the merchant ships put into npcStates by the test; needs their lines in src/index.html, which N5 adds), in the format NPC_SHOT_FMT
(liggende unless set; staaende by day only)."""
import os, runpy
os.environ['NPC_SHOT_SET'] = 'skip'
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'npcshot.py'), run_name='__main__')
