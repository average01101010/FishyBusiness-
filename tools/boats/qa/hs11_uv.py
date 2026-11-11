"""hs11.py for qa/shots.py with light from below and no water, to show the underwater hull (the keel, the rudder, the propeller in its
nozzle; OB10 round 2: the black antifouling under the sky's light alone renders as a silhouette):
    python3.11 tools/boats/qa/shots.py tools/boats/qa/hs11_uv.py r2 uv_q uv_side uv_prop"""
import math
import bpy
from hs11 import *
import hs11
WL = hs11.WLE
def build(fine=True):
    out = hs11.build(fine)
    for nm, rot, e in (('uv1', (math.radians(150), 0, math.radians(25)), 3.0), ('uv2', (math.radians(200), 0, math.radians(-35)), 1.8)):
        if nm in bpy.data.objects: continue
        d = bpy.data.lights.new(nm, 'SUN'); d.energy = e; o = bpy.data.objects.new(nm, d); o.rotation_euler = rot; bpy.context.scene.collection.objects.link(o)
    return out
CLOSE = [('uv_q', (-5.5, -7.5, -1.6), (3.2, 0, 0.2), 35, False, False), ('uv_side', (5.5, -30, -0.6), (5.5, 0, 0.3), ('o', 12.5), False, False),
         ('uv_prop', (-2.6, -2.2, -0.9), (0.9, 0, -0.3), 35, False, False)]
