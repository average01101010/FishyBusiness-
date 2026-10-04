"""The logo and the app icons of Det Store Blå, built and rendered in Blender (the user's wish 04.10.2026: «Lag gjerne ny logo i blender
som er litt penere»). A sjark (the Havsjark 35 from tools/boats/havsjark35.py) on the deep blue sea at the blue hour, her wheelhouse
lit, Senja's jagged peaks with snow behind her and the low sun's glow and glitter over the water.

    pip install bpy==4.5.4 pillow
    python3 tools/brand/logo.py          -> src/pwa/icon-192.png, icon-512.png, icon-maskable-512.png and og-image.jpg (1200 x 630, the
                                            picture for sharing, with the name); the renders in tools/brand/out/
    python3 tools/brand/logo.py quick    -> few samples and small renders, to try the composition

The name on the sharing picture is set in Source Serif 4 (the game's serif, SIL Open Font License, tools/brand/fonts/), a static
semibold display instance made with fontTools.

Frames: Blender's, z up; the boat's waterline at z = 0, her middle at the origin, the camera on -y looking along +y."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector as V
from bpyutil import reset, link, obj_from_bm, join
import havsjark35 as HJ

OUT = os.path.join(HERE, 'out'); PWA = os.path.join(ROOT, 'src', 'pwa'); FONT = os.path.join(HERE, 'fonts', 'SourceSerif4-Display-Semibold.ttf')
QUICK = 'quick' in sys.argv
SUN = V((-0.42, 1.0, 0.045)).normalized()          # where the sun stands: low, behind the peaks to the left
HEAD = math.radians(-34)                           # the boat's heading: bow to the right and towards us


def principled(name, rgb, rough=0.5, metal=0.0, emit=None, estr=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m


def world():
    # the blue hour: deep blue overhead, pale teal lower down, a warm band on the horizon and the glow round the sun
    w = bpy.data.worlds.new('sky'); bpy.context.scene.world = w; w.use_nodes = True; nt = w.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sep.inputs[0])
    ramp = N.new('ShaderNodeValToRGB'); E = ramp.color_ramp.elements
    E[0].position = 0.0; E[0].color = (0.95, 0.52, 0.30, 1); E[1].position = 0.55; E[1].color = (0.015, 0.035, 0.11, 1)
    for p, c in ((0.035, (0.80, 0.60, 0.52, 1)), (0.09, (0.38, 0.52, 0.68, 1)), (0.22, (0.10, 0.20, 0.40, 1))):
        e = E.new(p); e.color = c
    L.new(sep.outputs['Z'], ramp.inputs['Fac'])
    # the glow: (dir . sun)^k, added in warm light
    dot = N.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = SUN
    L.new(tc.outputs['Generated'], dot.inputs[0])
    pw = N.new('ShaderNodeMath'); pw.operation = 'POWER'; pw.inputs[1].default_value = 24.0; pw.use_clamp = True
    mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 0.0
    L.new(dot.outputs['Value'], mx.inputs[0]); L.new(mx.outputs[0], pw.inputs[0])
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = 1.6; L.new(pw.outputs[0], mul.inputs[0])
    glow = N.new('ShaderNodeMix'); glow.data_type = 'RGBA'; glow.blend_type = 'ADD'
    L.new(mul.outputs[0], glow.inputs['Factor']); L.new(ramp.outputs['Color'], glow.inputs['A']); glow.inputs['B'].default_value = (1.0, 0.62, 0.32, 1)
    bg = N.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 1.0; L.new(glow.outputs['Result'], bg.inputs['Color'])
    out = N.new('ShaderNodeOutputWorld'); L.new(bg.outputs[0], out.inputs['Surface'])


def sun():
    l = bpy.data.lights.new('sun', 'SUN'); l.energy = 2.2; l.color = (1.0, 0.70, 0.45); l.angle = math.radians(1.5)
    o = link(bpy.data.objects.new('sun', l)); o.rotation_euler = SUN.to_track_quat('Z', 'Y').to_euler()
    # a cool fill from the sky overhead, so the side towards us is not black
    f = bpy.data.lights.new('fill', 'SUN'); f.energy = 0.35; f.color = (0.55, 0.68, 1.0); f.angle = math.radians(30)
    fo = link(bpy.data.objects.new('fill', f)); fo.rotation_euler = V((0.3, -1.0, 0.9)).normalized().to_track_quat('Z', 'Y').to_euler()


def sea():
    m = principled('sea', (0.004, 0.022, 0.055), rough=0.05)
    b = m.node_tree.nodes['Principled BSDF']; b.inputs['IOR'].default_value = 1.33
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0)); s = bpy.context.active_object; s.name = 'ocean'
    oc = s.modifiers.new('ocean', 'OCEAN'); oc.geometry_mode = 'GENERATE'
    oc.spatial_size = 40; oc.repeat_x = 6; oc.repeat_y = 6; oc.wave_scale = 0.32; oc.choppiness = 0.9; oc.wind_velocity = 8.0; oc.random_seed = 11
    oc.wave_alignment = 0.35; oc.wave_direction = math.radians(70)
    res = 7 if QUICK else 10
    for a in ('resolution', 'viewport_resolution'):
        if hasattr(oc, a): setattr(oc, a, res)
    s.data.materials.append(m)
    with bpy.context.temp_override(object=s, active_object=s, selected_objects=[s], selected_editable_objects=[s]): bpy.ops.object.modifier_apply(modifier='ocean')
    bb = [s.matrix_world @ V(c) for c in s.bound_box]; cx = (min(p.x for p in bb) + max(p.x for p in bb)) / 2; cy = (min(p.y for p in bb) + max(p.y for p in bb)) / 2
    s.location = (-cx, -cy + 60, 0)
    for p in s.data.polygons: p.use_smooth = True
    print('ocean: %d vertices, %.0f m across' % (len(s.data.vertices), max(p.x for p in bb) - min(p.x for p in bb)))
    # the far sea out to the peaks, flat
    bm = bmesh.new(); h = 4000
    for v in [(-h, 100, -0.05), (h, 100, -0.05), (h, 3 * h, -0.05), (-h, 3 * h, -0.05)]: bm.verts.new(v)
    bm.faces.new(bm.verts); far = obj_from_bm('farsea', bm, [m])


def peaks(name, y0, depth, x0, x1, P, rock, snow, seed, nx=360, ny=36):
    """a range of jagged peaks along x at distance y0..y0+depth: P = [(x, height, half width)]"""
    def H(x):
        h = 4.0
        for px, ph, pw in P:
            u = abs(x - px) / pw
            if u < 1: h = max(h, ph * (1 - u) ** 1.35)
        return h + 3.5 * math.sin(x * 0.11 + seed) + 2.2 * math.sin(x * 0.37 + 2 * seed)
    bm = bmesh.new(); G = []
    for j in range(ny + 1):
        v = j / ny; yy = y0 + depth * v; prof = max(0.0, 1 - (2 * v - 0.8) ** 2) ** 0.6
        row = []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx; hz = H(x) * prof
            hz += (math.sin(x * 1.7 + yy * 0.9 + seed) * 0.5 + math.sin(x * 3.1 - yy * 1.3) * 0.3) * min(1.0, hz / 20) * 3.0
            row.append(bm.verts.new((x, yy, hz - 2.0)))
        G.append(row)
    for j in range(ny):
        for i in range(nx):
            f = bm.faces.new((G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i])); zc = f.calc_center_median().z
            x = f.calc_center_median().x; line = 0.55 * H(x) + 6 * math.sin(x * 0.23 + seed * 3) + 4 * math.sin(x * 0.71)
            f.material_index = 1 if zc > line and zc > 18 else 0
    o = obj_from_bm(name, bm, [rock, snow])
    for p in o.data.polygons: p.use_smooth = False
    return o


def boat():
    HJ.colours(); solids, glass = HJ.build(True)
    B = join(solids, 'BOAT'); Gl = join(glass, 'GLASS')
    # the wheelhouse lit from inside at the blue hour
    warm = principled('lit', (0.9, 0.7, 0.45), rough=0.2, emit=(1.0, 0.72, 0.40), estr=4.0)
    Gl.data.materials.clear(); Gl.data.materials.append(warm)
    for o in (B, Gl):
        o.location.x -= HJ.XM
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]): bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
        o.rotation_euler = (0, 0, HEAD)
    bb = [B.matrix_world @ V(c) for c in B.bound_box]
    print('boat: %.1f x %.1f x %.1f m' % (max(p.x for p in bb) - min(p.x for p in bb), max(p.y for p in bb) - min(p.y for p in bb), max(p.z for p in bb) - min(p.z for p in bb)))
    # the masthead light
    top = max(bb, key=lambda p: p.z)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, location=(top.x, top.y, top.z + 0.05)); ml = bpy.context.active_object
    ml.data.materials.append(principled('mast', (1, 1, 1), emit=(1.0, 0.95, 0.85), estr=30.0))
    return B


def setup(w, h, samples):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100
    sc.cycles.samples = samples; sc.cycles.use_denoising = True
    try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.render.film_transparent = False
    try: sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
    except Exception: pass
    sc.view_settings.exposure = 0.15
    return sc


def camera(loc, look, lens, shift_x=0.0, shift_y=0.0):
    sc = bpy.context.scene
    cam = bpy.data.objects.get('cam') or link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam')))
    cam.location = V(loc); cam.rotation_euler = (V(look) - V(loc)).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = lens; cam.data.shift_x = shift_x; cam.data.shift_y = shift_y; cam.data.clip_end = 6000; sc.camera = cam
    return cam


def render(path):
    bpy.context.scene.render.filepath = path; bpy.ops.render.render(write_still=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); world(); sun(); sea(); boat()
    rockN = principled('rockN', (0.035, 0.05, 0.075), rough=0.9); snowN = principled('snowN', (0.70, 0.76, 0.86), rough=0.7)
    rockF = principled('rockF', (0.16, 0.22, 0.33), rough=0.9); snowF = principled('snowF', (0.62, 0.70, 0.82), rough=0.8)
    # Senja's outer coast: spires like Okshornan and Segla near, a softer range far behind
    peaks('near', 520, 160, -700, 700, [(-310, 70, 70), (-235, 92, 55), (-170, 64, 60), (-60, 50, 90), (60, 84, 48), (110, 102, 42), (165, 76, 50), (290, 60, 85), (420, 72, 70)], rockN, snowN, 1.0)
    peaks('far', 1300, 300, -1800, 1800, [(-900, 150, 260), (-420, 190, 200), (150, 170, 240), (700, 210, 260), (1200, 160, 220)], rockF, snowF, 2.3, nx=240, ny=24)
    S = 24 if QUICK else 160; k = 0.5 if QUICK else 1.0
    look = (0.4, 0.0, 2.3)
    setup(int(1024 * k), int(1024 * k), S); camera((0.0, -27.0, 2.6), look, 50); render(os.path.join(OUT, 'logo.png'))
    setup(int(1024 * k), int(1024 * k), S); camera((0.0, -27.0, 2.6), look, 38); render(os.path.join(OUT, 'logo-maskable.png'))
    setup(int(1200 * k), int(630 * k), S); camera((0.0, -27.0, 2.4), look, 30, shift_x=-0.17, shift_y=0.04); render(os.path.join(OUT, 'og.png'))
    if QUICK: return
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    im = Image.open(os.path.join(OUT, 'logo.png')).convert('RGB')
    im.resize((512, 512), Image.LANCZOS).save(os.path.join(PWA, 'icon-512.png'), optimize=True)
    im.resize((192, 192), Image.LANCZOS).save(os.path.join(PWA, 'icon-192.png'), optimize=True)
    Image.open(os.path.join(OUT, 'logo-maskable.png')).convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(PWA, 'icon-maskable-512.png'), optimize=True)
    # the sharing picture: the name in white with a soft shadow, top left
    og = Image.open(os.path.join(OUT, 'og.png')).convert('RGBA'); W, H = og.size
    f1 = ImageFont.truetype(FONT, 96); f2 = ImageFont.truetype(FONT, 34)
    txt = Image.new('RGBA', og.size, (0, 0, 0, 0)); d = ImageDraw.Draw(txt)
    d.text((70, 64), 'Det Store Blå', font=f1, fill=(255, 255, 255, 255)); d.text((74, 180), 'Kystfiske langs norskekysten', font=f2, fill=(226, 236, 248, 235))
    sh = Image.new('RGBA', og.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
    ds.text((73, 68), 'Det Store Blå', font=f1, fill=(0, 10, 30, 170)); ds.text((76, 183), 'Kystfiske langs norskekysten', font=f2, fill=(0, 10, 30, 150))
    og = Image.alpha_composite(Image.alpha_composite(og, sh.filter(ImageFilter.GaussianBlur(6))), txt)
    og.convert('RGB').save(os.path.join(PWA, 'og-image.jpg'), quality=88, optimize=True)
    print('icons and og-image written to src/pwa/')


if __name__ == '__main__':
    main()
