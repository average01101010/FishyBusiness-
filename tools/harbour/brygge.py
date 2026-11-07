"""The modular quays and floating docks (Jonas 18.10.2026: «Lag også en modulær blendermodell for kaier og flytebrygger»), built in
Blender like the other harbour pieces. Each part is a module the game repeats and turns (view3d.js): a floating dock is gangway +
pontoons in a row (+ fingers), a timber pier is pile bays in a row, a quay front is wall bays in a row. The measures are those of the
common Norwegian kinds: concrete/foam pontoons 12 x 2.4 m with half a metre of freeboard, finger piers 8 x 0.8 m, an aluminium
gangway 10 x 1.2 m from a concrete abutment on the shore, timber piers on creosoted piles with the deck 2.4 m over mean sea level
(QTOP in 07-harbours.js), and the mooring buoy small boats swing on in the basin.

Parts (the frame of each: x along the module, z across it, out to sea or to starboard of the gangway; y up from the water):
    ponton      a 12 x 2.4 m pontoon: the float, the timber deck in boards with gaps, the rubbing timbers, four cleats, the joints
    ponton_end  the last pontoon's end: a closed end beam, a ladder down to the water and a life ring post
    finger      an 8 x 0.8 m finger pier, its root at x = 0 (it bolts to a pontoon's side), with two cleats and a float under its tip
    landgang    the gangway, 10 m from the hinge at x = 0 on the abutment to the rollers on the pontoon, level here (the game tilts it)
    landkar     the concrete abutment on the shore: its top at the quay's height, the gangway's hinge at its sea edge, x = 0
    kai_tre     a 6 m bay of a timber pier on piles, 4.2 m wide (the width the packs' line piers have): deck, stringers, bents, piles,
                a fender pile, the kerb log, a bollard; its middle at x = 0 and z = 0, the deck at y = 2.4
    kai_betong  a 6 m bay of a concrete quay front: the wall from below the water to the deck at 2.4 m, rubber fenders, the edge beam,
                a bollard, a ladder in a recess; the face at z = 0, the deck running back to z = -5
    boye        a mooring buoy, white with an orange band and a ring on top, from the waterline

    pip install bpy==4.5.4
    python3 tools/harbour/brygge.py         -> src/data/harbour-brygge.b64, renders in tools/harbour/out/
    python3 tools/harbour/brygge.py fast    -> without the renders

In Blender: x along, y across (out = -y in the game's z), z up; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
QTOP = 2.4                     # the quay's deck over mean sea level (07-harbours.js QTOP)
PL, PW, FB = 12.0, 2.4, 0.5    # a pontoon's length, width and freeboard (the deck's top over the water)
FL, FW = 8.0, 0.8              # a finger
GL, GW = 10.0, 1.2             # the gangway

C = {}
def colours():
    C['conc'] = mat('concrete', (0.56, 0.56, 0.54), 0.15)
    C['concd'] = mat('concrete_wet', (0.36, 0.37, 0.36), 0.25)
    C['wood'] = mat('deckwood', (0.50, 0.40, 0.29), 0.2)
    C['woodd'] = mat('deckwood_old', (0.40, 0.35, 0.29), 0.15)
    C['tar'] = mat('creosote', (0.17, 0.14, 0.11), 0.3)
    C['weed'] = mat('weed', (0.16, 0.20, 0.10), 0.2)
    C['alu'] = mat('alu', (0.74, 0.76, 0.78), 0.6, metal=0.7)
    C['galv'] = mat('galv', (0.58, 0.60, 0.62), 0.5, metal=0.5)
    C['black'] = mat('rubber', (0.07, 0.07, 0.08), 0.3)
    C['float'] = mat('float', (0.30, 0.31, 0.32), 0.2)
    C['white'] = mat('white', (0.90, 0.90, 0.88), 0.5)
    C['orange'] = mat('orange', (0.95, 0.40, 0.08), 0.5)
    C['yellow'] = mat('yellow', (0.92, 0.74, 0.12), 0.4)
    C['ring'] = mat('lifering', (0.92, 0.30, 0.08), 0.5)

def cleat(A, x, y, z, along=True):
    """a galvanised cleat (kryssholt) on the deck at x, y"""
    if along:
        abox(A, x - 0.05, x + 0.05, y - 0.04, y + 0.04, z, z + 0.08, C['galv']); abox(A, x - 0.17, x + 0.17, y - 0.035, y + 0.035, z + 0.08, z + 0.12, C['galv'])
    else:
        abox(A, x - 0.04, x + 0.04, y - 0.05, y + 0.05, z, z + 0.08, C['galv']); abox(A, x - 0.035, x + 0.035, y - 0.17, y + 0.17, z + 0.08, z + 0.12, C['galv'])

def boards(A, x0, x1, y0, y1, z, mats=('wood', 'woodd'), across=True, w=0.145, gap=0.012):
    """deck boards with gaps, laid across (each from y0 to y1) along x0..x1"""
    n = int((x1 - x0) / (w + gap)); k = 0; x = x0 + ((x1 - x0) - n * (w + gap) + gap) / 2
    while k < n:
        m = C[mats[0]] if (k * 7) % 5 else C[mats[1]]
        if across: abox(A, x, x + w, y0, y1, z - 0.035, z, m)
        x += w + gap; k += 1

def ponton(end=False):
    A = Acc('ponton_end' if end else 'ponton'); hw = PW / 2; x0, x1 = -PL / 2, PL / 2
    # the float: a concrete shell, its top just under the deck, half a metre under the water, the joints' chamfers at its ends
    abox(A, x0 + 0.04, x1 - 0.04, -hw + 0.05, hw - 0.05, -0.55, FB - 0.12, C['conc'])
    abox(A, x0 + 0.06, x1 - 0.06, -hw + 0.06, hw - 0.06, -0.6, -0.05, C['concd'])          # the wet, darker band in the water
    # the deck timber on its bearers, the rubbing timbers along both sides, the cleats
    for y in (-0.8, 0, 0.8): abox(A, x0 + 0.05, x1 - 0.05, y - 0.05, y + 0.05, FB - 0.12, FB - 0.035, C['tar'])
    boards(A, x0 + 0.05, x1 - 0.05, -hw + 0.08, hw - 0.08, FB)
    for s in (-1, 1):
        abox(A, x0, x1, s * hw - (0.08 if s > 0 else 0), s * hw + (0 if s > 0 else 0.08), FB - 0.32, FB - 0.02, C['woodd'])
        abox(A, x0, x1, s * (hw + 0.04) - 0.04, s * (hw + 0.04) + 0.04, FB - 0.28, FB - 0.14, C['black'])     # the rubber fender strip
        for x in (x0 + 2.0, -1.5, 1.5, x1 - 2.0): cleat(A, x, s * (hw - 0.18), FB)
    # the joint plates at the ends (where the next pontoon bolts on)
    for x in (x0, x1):
        abox(A, x - 0.03, x + 0.03, -hw + 0.1, -hw + 0.4, FB - 0.3, FB - 0.05, C['galv']); abox(A, x - 0.03, x + 0.03, hw - 0.4, hw - 0.1, FB - 0.3, FB - 0.05, C['galv'])
    if end:
        abox(A, x1 - 0.12, x1, -hw, hw, FB - 0.3, FB - 0.02, C['woodd'])
        # a ladder down from the end, a life ring on its post
        for y in (-0.22, 0.22): acyl(A, (x1 + 0.05, y, FB + 0.6), (x1 + 0.05, y, -0.9), 0.02, lambda z: C['galv'], seg=6)
        for k in range(5): z = FB - 0.25 - 0.3 * k; acyl(A, (x1 + 0.05, -0.22, z), (x1 + 0.05, 0.22, z), 0.016, lambda z_: C['galv'], seg=6)
        acyl(A, (x1 - 0.4, hw - 0.3, FB), (x1 - 0.4, hw - 0.3, FB + 1.3), 0.03, lambda z: C['galv'], seg=6)
        atorus(A, (x1 - 0.4, hw - 0.36, FB + 0.95), (0, 1, 0), 0.3, 0.05, lambda a: C['white'] if (a % (math.pi / 2)) < math.pi / 9 else C['ring'], 18, 6)
    return A.done(30)

def finger():
    A = Acc('finger'); hw = FW / 2
    abox(A, 0.0, FL, -hw + 0.04, hw - 0.04, FB - 0.22, FB - 0.06, C['galv'])                                   # the galvanised frame
    for y in (-hw + 0.06, hw - 0.06): abox(A, 0.0, FL, y - 0.03, y + 0.03, FB - 0.3, FB - 0.06, C['galv'])
    boards(A, 0.05, FL - 0.05, -hw + 0.04, hw - 0.04, FB)
    for s in (-1, 1): abox(A, 0.0, FL, s * hw - (0.06 if s > 0 else 0), s * hw + (0 if s > 0 else 0.06), FB - 0.25, FB - 0.03, C['woodd'])
    abox(A, FL - 3.0, FL - 0.1, -hw + 0.05, hw - 0.05, -0.35, FB - 0.3, C['float'])                           # the float under the tip
    abox(A, FL - 0.08, FL, -hw, hw, FB - 0.25, FB - 0.03, C['woodd'])
    for s in (-1, 1): cleat(A, FL - 0.4, s * (hw - 0.14), FB); cleat(A, 1.0, s * (hw - 0.14), FB)
    for s in (-1, 1): abox(A, 0.0, 0.5, s * hw - 0.25, s * hw + 0.25, FB - 0.25, FB - 0.05, C['galv'])         # the knees at its root
    return A.done(30)

def landgang():
    A = Acc('landgang'); hw = GW / 2
    for s in (-1, 1):
        abox(A, 0.0, GL, s * hw - 0.04, s * hw + 0.04, -0.12, 0.12, C['alu'])                                   # the side beams
        acyl(A, (0.1, s * hw, 1.0), (GL - 0.1, s * hw, 1.0), 0.025, lambda z: C['alu'], seg=8, cap=False)        # the handrails
        acyl(A, (0.1, s * hw, 0.5), (GL - 0.1, s * hw, 0.5), 0.015, lambda z: C['alu'], seg=6, cap=False)
        for k in range(11): x = 0.1 + k * (GL - 0.2) / 10; acyl(A, (x, s * hw, 0.1), (x, s * hw, 1.0), 0.02, lambda z: C['alu'], seg=6)
    for k in range(int(GL / 0.3)): x = 0.15 + k * 0.3; abox(A, x, x + 0.04, -hw + 0.04, hw - 0.04, 0.0, 0.06, C['alu'])   # the cleats underfoot
    abox(A, 0.0, GL, -hw + 0.04, hw - 0.04, -0.06, 0.0, C['alu'])
    for s in (-1, 1): acyl(A, (GL - 0.15, s * (hw - 0.1), -0.1), (GL - 0.15, s * (hw + 0.05), -0.1), 0.09, lambda z: C['black'], seg=12)   # the rollers
    acyl(A, (0.05, -hw, 0.0), (0.05, hw, 0.0), 0.05, lambda z: C['galv'], seg=10)                               # the hinge
    return A.done(30)

def landkar():
    A = Acc('landkar')
    abox(A, -3.2, 0.0, -1.6, 1.6, -1.2, QTOP, C['conc'])                                                         # the block, its sea edge at x = 0
    abox(A, -3.25, 0.03, -1.65, 1.65, QTOP - 0.08, QTOP + 0.04, C['concd'])
    abox(A, -0.25, 0.05, -0.75, 0.75, QTOP + 0.04, QTOP + 0.16, C['galv'])                                       # the hinge plate
    for y in (-1.3, 1.3): acyl(A, (-2.6, y, QTOP + 0.04), (-2.6, y, QTOP + 0.5), 0.12, lambda z: C['galv'], seg=12)   # bollards for the dock's shore lines
    return A.done(30)

def kai_tre():
    A = Acc('kai_tre'); hw = 2.1
    boards(A, -3.0, 3.0, -hw, hw, QTOP, mats=('woodd', 'wood'), w=0.2, gap=0.015)
    for y in (-1.4, -0.45, 0.45, 1.4): abox(A, -3.0, 3.0, y - 0.075, y + 0.075, QTOP - 0.3, QTOP - 0.035, C['tar'])   # the stringers
    for x in (-3.0, 0.0):
        abox(A, x - 0.12, x + 0.12, -hw - 0.1, hw + 0.1, QTOP - 0.6, QTOP - 0.3, C['tar'])                       # the bent's cap
        for y in (-1.75, 0.0, 1.75):
            acyl(A, (x, y, QTOP - 0.6), (x, y, -4.0), 0.16, lambda z: C['tar'] if z > 0.6 else C['weed'], seg=10, cuts=(0.6,))   # the piles
        acyl(A, (x - 0.1, -1.75, QTOP - 0.7), (x + 0.1, 1.75, -1.0), 0.07, lambda z: C['tar'], seg=6)            # a cross brace
    for s in (-1, 1):
        abox(A, -3.0, 3.0, s * hw - 0.12, s * hw + 0.12, QTOP, QTOP + 0.22, C['woodd'])                           # the kerb logs
        acyl(A, (1.5, s * (hw + 0.18), QTOP + 0.15), (1.5, s * (hw + 0.18), -2.5), 0.14, lambda z: C['woodd'] if z > 0.6 else C['weed'], seg=10, cuts=(0.6,))   # fender piles
    acyl(A, (-1.5, 1.6, QTOP), (-1.5, 1.6, QTOP + 0.45), 0.13, lambda z: C['tar'], seg=10)                        # a timber bollard
    return A.done(30)

def kai_betong():
    A = Acc('kai_betong')
    abox(A, -3.0, 3.0, 0.0, 5.0, -3.0, QTOP - 0.25, C['conc'])                                                    # the wall and fill behind it
    abox(A, -3.0, 3.0, -0.25, 0.0, -3.0, 0.4, C['concd'])                                                          # the tidal band, darker
    abox(A, -3.0, 3.0, -0.3, 5.0, QTOP - 0.25, QTOP, C['conc'])                                                    # the deck slab, the edge beam proud of the wall
    abox(A, -3.0, 3.0, -0.32, 0.0, QTOP - 0.05, QTOP + 0.2, C['yellow'])                                           # the painted kerb
    for x in (-1.8, 1.8): abox(A, x - 0.25, x + 0.25, -0.62, -0.3, -0.6, QTOP - 0.3, C['black'])                  # rubber fenders
    acyl(A, (0.0, 0.6, QTOP), (0.0, 0.6, QTOP + 0.4), 0.15, lambda z: C['galv'], seg=12); acyl(A, (0.0, 0.6, QTOP + 0.4), (0.0, 0.6, QTOP + 0.48), 0.22, lambda z: C['galv'], seg=12)
    # a ladder in its recess
    abox(A, 2.35, 2.85, -0.05, 0.2, -1.5, QTOP - 0.3, C['concd'])
    for y in (2.42, 2.78): acyl(A, (y, -0.05, QTOP + 0.6), (y, -0.05, -1.5), 0.022, lambda z: C['galv'], seg=6)
    for k in range(10): z = QTOP - 0.35 - 0.33 * k; acyl(A, (2.42, -0.05, z), (2.78, -0.05, z), 0.018, lambda z_: C['galv'], seg=6)
    return A.done(30)

def boye():
    A = Acc('boye')
    acyl(A, (0, 0, -0.3), (0, 0, 0.32), 0.34, lambda z: C['orange'] if 0.05 < z < 0.17 else C['white'], seg=18, cuts=(0.05, 0.17), r1=0.3)
    acyl(A, (0, 0, 0.32), (0, 0, 0.4), 0.16, lambda z: C['white'], seg=14)
    atorus(A, (0, 0, 0.5), (1, 0, 0), 0.09, 0.02, lambda a: C['galv'], 12, 6)
    acyl(A, (0, 0, -0.3), (0, 0, -1.6), 0.015, lambda z: C['galv'], seg=5)
    return A.done(30)

PARTS = [('ponton', lambda: ponton(False)), ('ponton_end', lambda: ponton(True)), ('finger', finger), ('landgang', landgang),
         ('landkar', landkar), ('kai_tre', kai_tre), ('kai_betong', kai_betong), ('boye', boye)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    objs = {nm: f() for nm, f in PARTS}
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for nm, o in objs.items()]
    ex = {'frame': 'kystfiske docks: x along the module, y up from the water (mean sea level), z across (out to sea / to starboard)',
          'ponton': [PL, PW, FB], 'finger': [FL, FW], 'landgang': [GL, GW], 'qtop': QTOP, 'kai': [6.0, 4.2]}
    glb = os.path.join(OUT, 'harbour-brygge.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'harbour-brygge.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('docks GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # a control picture: a floating dock off an abutment (gangway down to three pontoons, fingers), a timber pier, a quay front, a buoy
    for o in objs.values(): o.hide_render = True
    def place(nm, loc, rot=0.0, tilt=0.0):
        o = objs[nm].copy(); o.data = objs[nm].data; bpy.context.collection.objects.link(o); o.location = loc; o.rotation_euler = (0, tilt, rot); o.hide_render = False; return o
    bm = bmesh.new(); s_ = 120; bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0), (s_, -s_, 0), (s_, s_, 0), (-s_, s_, 0))])
    obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-40, 4, QTOP - 0.2), (40, 4, QTOP - 0.2), (40, 40, QTOP + 2), (-40, 40, QTOP + 2))])
    obj_from_bm('shore', bm, [mat('grass', (0.27, 0.32, 0.18), 0.05)])
    place('landkar', (0, 1.6 + 3.2, 0), rot=-math.pi / 2)                     # its sea edge at y = 1.6
    tilt = math.atan2(QTOP - FB, GL)
    place('landgang', (0, 1.6, QTOP), rot=-math.pi / 2, tilt=tilt)
    for k in range(3): place('ponton_end' if k == 2 else 'ponton', (0, 1.6 - GL * math.cos(tilt) - PL / 2 - k * PL, 0), rot=-math.pi / 2)
    for k in range(4): place('finger', (PW / 2, -12 - k * 6, 0), rot=0.0); place('finger', (-PW / 2, -12 - k * 6, 0), rot=math.pi)
    for k in range(3): place('kai_tre', (22, -6 - k * 6, 0), rot=math.pi / 2)
    for k in range(3): place('kai_betong', (-22 + k * 6, 4.0, 0))
    place('boye', (12, -42, 0))
    setup_render(1600, 1000, samples=48)
    camera((38, -58, 22), (0, -14, 0), lens=32); render(os.path.join(OUT, 'brygge_3q.png'))
    camera((9, -20, 4), (0, -10, 0.5), lens=30); render(os.path.join(OUT, 'brygge_near.png'))
    camera((30, 2, 6), (22, -12, 1.5), lens=35); render(os.path.join(OUT, 'brygge_kai.png'))

if __name__ == '__main__':
    main()
