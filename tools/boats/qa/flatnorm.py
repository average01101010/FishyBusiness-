"""Shading streaks on flat walls (Jonas 10.11.2026, the havsjark's wheelhouse: «Den ser liksom ut som den huler litt innover mot vinduene
pga de stripene», and «Dette må du notere ned at vi sjekker på alle de andre båtene også»). A part shaded smooth with its sharp edges marked
before a boolean cut (the windows, the door, the ports) gets smooth edges round the openings: the flat wall's corner normals bend toward
the reveals and the long triangles from the openings' corners shade in streaks, as if the wall were hollow. This builds a boat script's
near model and reports, per part and material, the flat faces (over 0.02 m2) whose corner normals stand more than LIMIT degrees off the
face's own normal: the walls that will show streaks in the game (the GLB carries the corner normals). The cure in the script: mark the
sharp edges again after the cut (bpyutil.shade(obj, 5) on a part of flat panels, as havsjark35.py wheelhouse() does).
    python3.11 tools/boats/qa/flatnorm.py tools/boats/<script>.py [LIMIT]      (LIMIT default 20 degrees: round parts, a mast or a
    fender of 12-14 segments, are smooth by design and stand 13-15 degrees off; the streaks on the havsjark's walls stood 70-135)"""
import os, sys, math, importlib.util, collections
script = sys.argv[1]; LIMIT = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, BOATS); sys.path.insert(0, os.path.dirname(os.path.abspath(script)))
spec = importlib.util.spec_from_file_location('boat', script); B = importlib.util.module_from_spec(spec); sys.argv = [script, 'fast', 'dry']; spec.loader.exec_module(B)
import bpy
from bpyutil import *
reset(); B.colours(); out = B.build(True); solids = out[0] if isinstance(out, tuple) else out
bad = collections.defaultdict(lambda: [0, 0.0, 0.0]); total = 0
for o in solids:
    if o.type != 'MESH': continue
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh(); mats = [m.name if m else '?' for m in me.materials]
    for p in me.polygons:
        if p.area < 0.02 or p.normal.length < 1e-6: continue
        w = 0.0
        for li in p.loop_indices:
            c = me.corner_normals[li].vector
            if c.length > 1e-6: w = max(w, math.degrees(c.angle(p.normal)))
        if w > LIMIT:
            k = (o.name, mats[p.material_index] if mats else '?'); bad[k][0] += 1; bad[k][1] = max(bad[k][1], w); bad[k][2] += p.area; total += 1
    oe.to_mesh_clear()
for (nm, mt), (n, w, a) in sorted(bad.items(), key=lambda q: -q[1][2]):
    print('%-24s %-10s %4d flater, %5.2f m2, verste hjørne %5.1f grader skjevt' % (nm, mt, n, a, w))
print(('OK   ' if not total else 'FEIL ') + '%s: %d flate flater over 0,02 m2 med skyggenormaler over %.0f grader skjevt (striper på plane vegger)' % (os.path.basename(script), total, LIMIT))
