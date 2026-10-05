"""The picture behind the loading screen and the sign-in (05.10.2026, the plan's «Innloggings- og innlastingsskjerm i Blender, finere
typografi»): Father's old naust on its pile quay at the blue hour, the lamp over the loft door lit and a warm light in the windows,
the old wooden boat (the start boat) made fast along the quay, the calm sea in front and Senja's peaks with snow behind, the last of
the light low over them. The same models as in the game: tools/harbour/naust.py and tools/boats/snekke23.py.

    pip install bpy==4.5.4 pillow
    python3 tools/brand/loader.py          -> src/data/loader-land.b64 (1600 x 1000) and loader-port.b64 (960 x 1600), WebP as base64;
                                              the renders in tools/brand/out/
    python3 tools/brand/loader.py quick    -> few samples and small renders, to try the composition
    python3 tools/brand/loader.py port     -> only the upright one (or land: only the wide one)

The title goes over the sky at the top and the progress at the bottom over the water, so the naust stands in the middle third (upright
a little over the middle, so the sign-in's card can lie over the water under it; wide, the card stands to the left of it). Frame: the naust's (x along the quay face, the face at y = 0, y inland, z up from mean sea level)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, os.path.join(ROOT, 'tools', 'harbour')); sys.path.insert(0, HERE)
import bpy, bmesh
from mathutils import Vector as V
import bpyutil
from bpyutil import reset, link, obj_from_bm, join, grid
import naust as NA
import snekke23 as SN
import logo as LO

OUT = os.path.join(HERE, 'out'); DATA = os.path.join(ROOT, 'src', 'data')
QUICK = 'quick' in sys.argv
SEA = 0.35                                   # the water this evening: a little over mean sea level
LO.SUN = V((-0.55, 1.0, 0.035)).normalized()  # the sun just down behind the peaks, to the left


def lit(name, rgb, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = 0.3
    b.inputs['Emission Color'].default_value = (*rgb, 1); b.inputs['Emission Strength'].default_value = strength
    return m


def the_naust():
    NA.colours(); solids, glass = NA.build(True)
    H = join(solids, 'NAUST'); G = join(glass, 'NAUST_GLASS')
    # a lamp burns inside: the panes glow warm, and the lamp over the loft door is lit
    G.data.materials.clear(); G.data.materials.append(lit('window', (1.0, 0.66, 0.34), 7.0))
    lm = NA.C['lamp'].node_tree.nodes['Principled BSDF']; lm.inputs['Emission Strength'].default_value = 40.0
    lm.inputs['Emission Color'].default_value = (1.0, 0.78, 0.48, 1)
    l = bpy.data.lights.new('doorlamp', 'POINT'); l.energy = 320; l.color = (1.0, 0.72, 0.42); l.shadow_soft_size = 0.08
    o = link(bpy.data.objects.new('doorlamp', l)); o.location = (NA.LAMP[0], NA.LAMP[1] - 0.12, NA.LAMP[2] - 0.12)
    # the light inside, out through the panes and the broken one
    for x, z in ((-2.3, NA.FLOOR + 1.4), (3.9, NA.FLOOR + 1.4)):
        li = bpy.data.lights.new('inside', 'POINT'); li.energy = 140; li.color = (1.0, 0.62, 0.32); li.shadow_soft_size = 0.3
        oi = link(bpy.data.objects.new('inside', li)); oi.location = (x, NA.NY0 + 1.2, z)
    return H


def the_boat():
    """the old wooden boat along the quay, port side in, her bow to the east; made fast fore and aft to the bollards"""
    bpyutil.MATS.clear(); SN.colours()
    solids, glass = SN.build(True); B = join(solids, 'SNEKKE'); T = SN.tiller_part()
    x0 = -4.6; y0 = -(1.13 + 0.32)                      # the sternpost's x along the face, the boat's middle out from it
    for o in (B, T):
        o.location = (x0, y0, SEA - SN.WL)
    for (bx, by), (sx, sz) in ((NA.BOLL[1], (0.25, 1.1)), (NA.BOLL[2], (6.75, 1.15))):
        a = V((x0 + sx, y0, SEA - SN.WL + sz)); b = V((bx, by, NA.QTOP + 0.7))
        rope(a, b, 0.25)
    return B


def rope(a, b, sag):
    cu = bpy.data.curves.new('rope', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.014; cu.bevel_resolution = 2
    sp = cu.splines.new('POLY'); n = 12; sp.points.add(n)
    for i in range(n + 1):
        t = i / n; p = a.lerp(b, t); p.z -= sag * 4 * t * (1 - t); sp.points[i].co = (p.x, p.y, p.z, 1)
    o = link(bpy.data.objects.new('rope', cu)); o.data.materials.append(NA.C['rope'])
    return o


def landz(x, y):
    """the ground: the naust's bank profile along the shore (the shoreline wanders away from the naust), and the low land behind it"""
    ax = abs(x)
    wig = 2.5 * math.sin(x / 19.0 + 0.6) + 1.5 * math.sin(x / 7.3)
    yy = y - (wig * min(1.0, max(0.0, (ax - 20) / 20)))
    if yy < 16: h = NA.interp1(NA.BANK, yy) + NA.noise(x, y)
    else:
        s = (yy - 16) / 220.0; h = NA.QTOP + 0.9 + 14.0 * (1 - math.exp(-3.0 * s)) + 6.0 * s
        h += 1.6 * math.sin(x / 31.0 + y / 47.0) + 0.8 * math.sin(x / 9.0 - y / 13.0) * min(1.0, (yy - 16) / 20)
    if ax < 16.5 and -4 < y < 16.5: h = min(h, NA.interp1(NA.BANK, y) - 1.2)       # under the model's own bank
    return h


def village():
    """the neighbours' windows along the shore, far off to both sides"""
    m = lit('house', (1.0, 0.70, 0.40), 9.0); bm = bmesh.new()
    for x, y in ((-150, 42), (-104, 58), (-66, 31), (-232, 76), (118, 47), (172, 66), (236, 40), (310, 95), (-300, 120), (64, 160)):
        z = landz(x, y) + 1.4
        for dx in (0.0, 1.3):
            v = [bm.verts.new((x + dx + a_, y - 4.0, z + b_)) for a_, b_ in ((0, 0), (0.7, 0), (0.7, 0.8), (0, 0.8))]
            bm.faces.new(v)
    obj_from_bm('village', bm, [m])


def land():
    """the shore round the naust's own bank, and the low land behind it rising to a ridge, so the peaks show over it"""
    z = landz
    xs = [-320 + 640 * i / 160 for i in range(161)]
    ys = [-30 + 6 * j for j in range(8)] + [18 + 8 * j for j in range(10)] + [98 + 25 * j for j in range(14)]
    G = [[(x, y, z(x, y)) for y in ys] for x in xs]
    rr = __import__('random').Random(3)
    def matf(i, j):
        x = (xs[i] + xs[i + 1]) / 2; y = (ys[j] + ys[j + 1]) / 2; h = (G[i][j][2] + G[i + 1][j + 1][2]) / 2
        if y > 40 and NA.noise(x * 0.05, y * 0.04) > 0.1: return NA.C['heather']
        return NA.ground_mat(h, x, y, rr)
    o = grid('land', G, matf, out=lambda c: (0, 0, 1))
    for p in o.data.polygons: p.use_smooth = True
    return o


def sea():
    """calm water: one flat sheet out to the horizon with small ripples in its normal (a ripple field seen low lies in bands across the
    view, so the noise is finer along y than along x); the lit windows draw long streaks in it"""
    m = bpy.data.materials.new('sea'); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links; b = N['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.004, 0.022, 0.05, 1); b.inputs['Roughness'].default_value = 0.035; b.inputs['IOR'].default_value = 1.33
    tc = N.new('ShaderNodeTexCoord'); bumps = []
    for sc, det, st in (((0.9, 3.2, 1.0), 4.0, 0.22), ((0.12, 0.42, 1.0), 2.0, 0.35)):
        mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = sc; L.new(tc.outputs['Object'], mp.inputs['Vector'])
        nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.0; nz.inputs['Detail'].default_value = det; nz.inputs['Roughness'].default_value = 0.55
        L.new(mp.outputs['Vector'], nz.inputs['Vector'])
        bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = st; bu.inputs['Distance'].default_value = 0.05; L.new(nz.outputs['Fac'], bu.inputs['Height'])
        if bumps: L.new(bumps[-1].outputs['Normal'], bu.inputs['Normal'])
        bumps.append(bu)
    L.new(bumps[-1].outputs['Normal'], b.inputs['Normal'])
    bm = bmesh.new(); h = 6000
    for v in [(-h, -h, SEA), (h, -h, SEA), (h, 3 * h, SEA), (-h, 3 * h, SEA)]: bm.verts.new(v)
    bm.faces.new(bm.verts); obj_from_bm('sea', bm, [m])


def stars():
    """a few stars high in the sky, added to the blue hour's world"""
    nt = bpy.context.scene.world.node_tree; N = nt.nodes; L = nt.links
    bg = next(n for n in N if n.type == 'BACKGROUND'); src = bg.inputs['Color'].links[0].from_socket
    tc = next(n for n in N if n.type == 'TEX_COORD')
    vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'F1'; vo.inputs['Scale'].default_value = 260.0; L.new(tc.outputs['Generated'], vo.inputs['Vector'])
    th = N.new('ShaderNodeMapRange'); th.inputs['From Min'].default_value = 0.035; th.inputs['From Max'].default_value = 0.0; L.new(vo.outputs['Distance'], th.inputs['Value'])
    sel = N.new('ShaderNodeMath'); sel.operation = 'GREATER_THAN'; sel.inputs[1].default_value = 0.82; L.new(vo.outputs['Color'], sel.inputs[0])
    sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
    hi = N.new('ShaderNodeMapRange'); hi.inputs['From Min'].default_value = 0.22; hi.inputs['From Max'].default_value = 0.5; L.new(sep.outputs['Z'], hi.inputs['Value'])
    m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'; L.new(th.outputs['Result'], m1.inputs[0]); L.new(sel.outputs[0], m1.inputs[1])
    m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY'; L.new(m1.outputs[0], m2.inputs[0]); L.new(hi.outputs['Result'], m2.inputs[1])
    m3 = N.new('ShaderNodeMath'); m3.operation = 'MULTIPLY'; m3.inputs[1].default_value = 0.9; L.new(m2.outputs[0], m3.inputs[0])
    add = N.new('ShaderNodeMix'); add.data_type = 'RGBA'; add.blend_type = 'ADD'
    L.new(m3.outputs[0], add.inputs['Factor']); L.new(src, add.inputs['A']); add.inputs['B'].default_value = (0.85, 0.9, 1.0, 1)
    L.new(add.outputs['Result'], bg.inputs['Color'])


def mountain_mat(name, rock, snow, line, seed):
    """rock with snow where it is high and not too steep, broken up by noise, per pixel"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; L = nt.links; b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.85
    geo = N.new('ShaderNodeNewGeometry'); sp = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Position'], sp.inputs[0])
    sn = N.new('ShaderNodeSeparateXYZ'); L.new(geo.outputs['Normal'], sn.inputs[0])
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.012; nz.inputs['Detail'].default_value = 8.0; nz.inputs['Roughness'].default_value = 0.62
    L.new(geo.outputs['Position'], nz.inputs['Vector'])
    # the height over the snow line, moved up and down by the noise
    off = N.new('ShaderNodeMath'); off.operation = 'MULTIPLY_ADD'; off.inputs[1].default_value = line * 0.9; off.inputs[2].default_value = -line * 0.45
    L.new(nz.outputs['Fac'], off.inputs[0])
    hh = N.new('ShaderNodeMath'); hh.operation = 'SUBTRACT'; L.new(sp.outputs['Z'], hh.inputs[0])
    ln = N.new('ShaderNodeMath'); ln.operation = 'ADD'; ln.inputs[1].default_value = line; L.new(off.outputs[0], ln.inputs[0]); L.new(ln.outputs[0], hh.inputs[1])
    hs = N.new('ShaderNodeMapRange'); hs.inputs['From Min'].default_value = 0.0; hs.inputs['From Max'].default_value = line * 0.12; L.new(hh.outputs[0], hs.inputs['Value'])
    # snow does not lie on the steep walls
    st = N.new('ShaderNodeMapRange'); st.inputs['From Min'].default_value = 0.40; st.inputs['From Max'].default_value = 0.60; L.new(sn.outputs['Z'], st.inputs['Value'])
    f = N.new('ShaderNodeMath'); f.operation = 'MULTIPLY'; L.new(hs.outputs['Result'], f.inputs[0]); L.new(st.outputs['Result'], f.inputs[1])
    mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(f.outputs[0], mx.inputs['Factor'])
    mx.inputs['A'].default_value = (*rock, 1); mx.inputs['B'].default_value = (*snow, 1); L.new(mx.outputs['Result'], b.inputs['Base Color'])
    return m


def massif(name, y0, depth, x0, x1, P, mat_, seed, nx, ny):
    """a range of jagged peaks along x at y0 .. y0 + depth: P = [(x, height, half width)]; ridged noise cuts the spires and gullies"""
    from mathutils import noise
    def env(x):
        h = 0.0
        for px, ph, pw in P:
            u = abs(x - px) / pw
            if u < 1: h = max(h, ph * (1 - u) ** 1.25)
        return h
    top = max(p[1] for p in P)
    bm = bmesh.new(); G = []
    for j in range(ny + 1):
        v = j / ny; yy = y0 + depth * v; prof = max(0.0, 1 - ((v - 0.45) / 0.45) ** 2) ** 0.6
        row = []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; e = env(x) * prof
            r = noise.ridged_multi_fractal(V((x / 90.0, yy / 90.0, seed)), 0.9, 2.1, 7, 0.9, 2.2)
            hz = e * (0.62 + 0.24 * r) + 10 * prof + 0.06 * top * noise.noise(V((x / 40.0, yy / 40.0, seed + 5)))
            row.append(bm.verts.new((x, yy, hz - 3.0)))
        G.append(row)
    for j in range(ny):
        for i in range(nx): bm.faces.new((G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]))
    o = obj_from_bm(name, bm, [mat_])
    for p in o.data.polygons: p.use_smooth = True
    return o


def scene():
    reset(); LO.world(); stars(); LO.sun()
    # the sun is down: its light only a glow on the peaks, the blue sky lights the rest
    bpy.data.objects['sun'].data.energy = 0.8; bpy.data.objects['fill'].data.energy = 2.4
    the_naust(); the_boat(); land(); sea()
    # the near range dark with snow in the hollows, the far one paler in the haze
    near = mountain_mat('near', (0.035, 0.045, 0.07), (0.50, 0.56, 0.68), 100.0, 1.0)
    far = mountain_mat('far', (0.13, 0.19, 0.33), (0.42, 0.50, 0.66), 180.0, 2.0)
    # the near range rises behind the naust and to the right, with a gap to the left where the far range stands in the last light
    massif('near', 430, 520, -1100, 1100, [(-560, 220, 150), (-360, 200, 110), (60, 180, 100), (170, 290, 110), (300, 245, 95), (430, 280, 130),
           (640, 240, 180), (900, 260, 200)], near, 1.0, 900, 110)
    massif('far', 2300, 800, -3500, 3500, [(-1400, 430, 500), (-700, 520, 330), (-250, 470, 300), (400, 500, 420), (1500, 560, 600)], far, 2.3, 600, 60)
    village()


def shot(path, w, h, loc, look, lens, shift_y=0.0):
    k = 0.5 if QUICK else 1.0
    sc = LO.setup(int(w * k), int(h * k), 20 if QUICK else 72); sc.view_settings.exposure = 0.55
    LO.camera(loc, look, lens, shift_y=shift_y); LO.render(path)


def webp_b64(png, name, q):
    from PIL import Image
    im = Image.open(png).convert('RGB'); p = os.path.join(OUT, name + '.webp'); im.save(p, 'WEBP', quality=q, method=6)
    open(os.path.join(DATA, name + '.b64'), 'w').write(base64.b64encode(open(p, 'rb').read()).decode())
    print(name, im.size, os.path.getsize(p), 'bytes')


def main():
    os.makedirs(OUT, exist_ok=True)
    scene()
    land_png = os.path.join(OUT, 'loader-land.png'); port_png = os.path.join(OUT, 'loader-port.png')
    only = [a for a in ('land', 'port') if a in sys.argv] or ['land', 'port']           # e.g. «loader.py port» renders only the upright one
    # upright, the naust a little over the middle: the sign-in's card lies over the water under it
    if 'land' in only: shot(land_png, 1600, 1000, (-3.0, -30.0, 3.4), (0.4, 8.0, 5.0), 30, shift_y=0.06)
    if 'port' in only: shot(port_png, 960, 1600, (-1.5, -34.0, 3.2), (0.6, 8.0, 5.8), 30, shift_y=-0.05)
    if QUICK: return
    if 'land' in only: webp_b64(land_png, 'loader-land', 84)
    if 'port' in only: webp_b64(port_png, 'loader-port', 84)


if __name__ == '__main__':
    main()
