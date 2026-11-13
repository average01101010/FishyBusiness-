"""npcshot.py with NPC_SHOT_SET=fisk (N7's second part, steg 36: the coast's fishing boats by their gear; needs the vec packs, KYST_VEC=1), in the format NPC_SHOT_FMT
(liggende unless set; staaende by day only)."""
import os, runpy
os.environ['NPC_SHOT_SET'] = 'fisk'
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'npcshot.py'), run_name='__main__')
