"""npcshot.py with NPC_SHOT_SET=skip (N7's second part, steg 36: the merchant ships put into npcStates by the test; needs their lines in src/index.html, which N5 adds), in the format NPC_SHOT_FMT
(liggende unless set; staaende by day only)."""
# Until N5 and N6 add their lines to src/index.html: add the five lines (glb-ship-last, -tank, -cruise, -fritid, -seil, as glb-ship-kystrute)
# to a copy of the page, KYST_VEC=1 KYST_DIST=dist-skip node build.mjs, restore the page, and run this with KYST_DIST=dist-skip.
import os, runpy
os.environ['NPC_SHOT_SET'] = 'skip'
runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'npcshot.py'), run_name='__main__')
