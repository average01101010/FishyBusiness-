"""The critique loop's renders (docs/skipsmodeller/sulebas-bygging.md kap. 5, 13): a boat script's model from the planliste's cameras
K1-K7 (planliste-fiskefartoy.md kap. 30.3: K1 starboard bow quarter, K2 port stern quarter, K3 orthographic from both sides, K4 from
above, K5 on the working deck, K6 = K1 at night with the lanterns lit, K7 drone), straight ahead and astern, from under, a 3/4 view,
the skipper's eye (EYE in the script, if any) and the script's own close views (CLOSE: [(name, camera, target, lens or ('o', ortho),
water, night)]). Sky light 0.45 and exposure -1.0, so the white does not burn out. Never run it beside a SwiftShader test.
    /opt/bpyenv/bin/python tools/boats/qa/shots.py tools/boats/<script>.py <prefix> [names...]   -> tools/boats/out/qa/<prefix>_<name>.png
The script must expose colours() and build(fine) (bpyutil), WL, XF (and XA, ZC if it has a working deck; K5 = (camera, target) if the
default K5 is blocked). The helm's views are rendered without the glass, which renders opaque."""
import os, sys, math, importlib.util
script, prefix = sys.argv[1], sys.argv[2]; only = set(sys.argv[3:])
BOATS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BOATS); sys.path.insert(0, os.path.dirname(os.path.abspath(script)))
spec = importlib.util.spec_from_file_location('boat', script); B = importlib.util.module_from_spec(spec); sys.argv = [script, 'fast', 'dry']; spec.loader.exec_module(B)
import bpy, bmesh
from bpyutil import *
OUTD = os.path.join(BOATS, 'out', 'qa'); os.makedirs(OUTD, exist_ok=True)
reset(); B.colours(); solids, glass = B.build(True); join(solids, 'BOAT0')
if glass: join(glass, 'GLASS0')
for f in ('render_only',):
    if hasattr(B, f): join(getattr(B, f)(), 'RO')
WL = B.WL; XA = getattr(B, 'XA', 0.0); XF = B.XF; XM = (XA + XF) / 2; Lb = XF - XA
sc = bpy.context.scene
def look(night=False):
    setup_render(1400, 900, samples=48)
    bg = sc.world.node_tree.nodes['Background']
    sc.view_settings.exposure = -1.0
    if night:
        bg.inputs['Color'].default_value = (0.01, 0.012, 0.02, 1); bg.inputs['Strength'].default_value = 0.15
        bpy.data.objects['sun'].data.energy = 0.0
        for m in bpy.data.materials:
            if m.name.startswith(('lamp', 'lred', 'lgreen', 'lwhite')) and m.node_tree:
                b = m.node_tree.nodes.get('Principled BSDF'); rgb = m.get('rgb', (1, 1, 1))
                b.inputs['Emission Color'].default_value = (rgb[0], rgb[1], rgb[2], 1); b.inputs['Emission Strength'].default_value = 40.0
        sc.view_settings.exposure = 0.0
    else:
        bg.inputs['Color'].default_value = (0.55, 0.68, 0.85, 1); bg.inputs['Strength'].default_value = 0.45
        bpy.data.objects['sun'].data.energy = 3.2
if 'water' not in bpy.data.objects:
    bm = bmesh.new(); s_ = 80; bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, WL), (s_, -s_, WL), (s_, s_, WL), (-s_, s_, WL))])
    obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
W = bpy.data.objects['water']
a = math.radians(38); D = 3.3 * Lb
eye = getattr(B, 'EYE', None)
SH = [  # name, camera, target, lens or ortho, water, night
    ('K1', (XM + D * math.cos(a), -D * math.sin(a), WL + 3.0), (XM, 0, WL + 0.9), 100, True, False),
    ('K2', (XM - D * math.cos(a), D * math.sin(a), WL + 3.0), (XM, 0, WL + 0.9), 100, True, False),
    ('K3p', (XM, 40, WL + 0.6), (XM, 0, WL + 0.6), ('o', Lb * 1.12), False, False),
    ('K3s', (XM, -40, WL + 0.6), (XM, 0, WL + 0.6), ('o', Lb * 1.12), False, False),
    ('K4', (XM, 0, 40), (XM + 0.001, 0, 0), ('o', Lb * 1.12), False, False),
    ('fore', (XF + 30, 0, WL + 0.6), (XM, 0, WL + 0.6), ('o', 4.2), False, False),
    ('aft', (XA - 30, 0, WL + 0.6), (XM, 0, WL + 0.6), ('o', 4.2), False, False),
    ('under', (XM, -0.01, -30), (XM, 0, 0), ('o', Lb * 1.12), False, False),
    ('K5',) + (getattr(B, 'K5', None) or ((XA + 0.6, 0.55, getattr(B, 'ZC', WL + 0.4) + 1.7), (XM + 0.8, -0.2, getattr(B, 'ZC', WL) + 0.6))) + (24, True, False),   # (a script's K5 = (camera, target) when something stands in the way)
    ('K6', (XM + D * math.cos(a), -D * math.sin(a), WL + 3.0), (XM, 0, WL + 0.9), 100, True, True),
    ('K7', (XM + 30, -22, WL + 38), (XM, 0, WL), 70, True, False),
    ('q3', (XM + 9, -7, WL + 4.2), (XM, 0, WL + 1.0), 35, True, False),
]
if eye: SH.append(('helm', eye, (eye[0] + 3, eye[1] - 0.2, eye[2] - 0.55), 28, True, False))
for extra in getattr(B, 'CLOSE', []): SH.append(extra)
for nm, cam, tgt, lens, wat, night in SH:
    if only and nm not in only: continue
    look(night); W.hide_render = not wat
    gl_ = bpy.data.objects.get('GLASS0')       # the views from inside a wheelhouse: the glass (opaque in the render) out, so the daylight comes in
    if gl_: gl_.hide_render = nm in ('helm',) or nm.startswith('c_helm')
    if isinstance(lens, tuple): camera(cam, tgt, ortho=lens[1])
    else: camera(cam, tgt, lens=lens)
    render(os.path.join(OUTD, '%s_%s.png' % (prefix, nm))); print('rendered', nm, flush=True)
