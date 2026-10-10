"""The paper of the opening scene (ui/08b-letter.js; Jonas 05.10.2026: «Skjermen er helt svart, med en slitt konvolutt med røff
håndskrift hvor det står: "Til den som tar over" ... Ut kommer det et brettet brev som åpnes», and «Kanskje bruke blender til brevet
og sånt?»). Blender makes the paper and the light; the handwriting is the page's text on top, so it stays sharp and has both languages.

Five pictures, each a sheet of real geometry (crumples, a crease or two, the letter's two folds) lit by a low sun from the upper left,
seen straight from above, its worn edges cut out (transparent), with stains in a colour layer:
  env-front   the envelope's front, brown kraft paper, worn and creased, a water stain, grime at the edges
  env-pocket  its back below the flap: the bottom and side flaps glued over each other, open above the pocket's mouth
  env-inside  the inside of the front panel, seen in the mouth when the flap is open
  env-flap    the flap, a triangle hinged at the top edge
  paper       the letter, unfolded: yellowed, a coffee ring, foxing, the two folds of a letter folded in three

    pip install bpy==4.5.4
    python3 tools/opening/brev.py      -> src/data/letter-*.b64 (WebP), previews in tools/opening/out/

Sizes in decimetres: the envelope C5 (2.29 x 1.62), the letter A4 (2.10 x 2.97)."""
import os, sys, math, random, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
import bpy, bmesh
from mathutils import Vector as V, noise

OUT = os.path.join(HERE, 'out')
EW, EH = 2.29, 1.62          # the envelope
PW, PH = 2.10, 2.97          # the letter
FLAP = 0.60                  # the flap reaches 60 % down the envelope
MOUTH = 0.50                 # the side flaps meet half-way down; the bottom flap's edge a little lower at the sides


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
    sc.cycles.samples = 64; sc.cycles.use_denoising = True
    sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.62, 0.62, 0.64, 1); bg.inputs['Strength'].default_value = 0.55
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.6; sun.angle = math.radians(6)
    so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(62), 0, math.radians(-38))      # low from the upper left, so every crumple shows
    return sc


def sheet(name, W, H, nx, ny, zf, cf, af):
    """a grid W x H with nx x ny cells: z = zf(x, y), colour layer cf(x, y) -> (r, g, b), alpha af(x, y) in 0..1"""
    bm = bmesh.new(); vs = []
    for j in range(ny + 1):
        row = []
        for i in range(nx + 1):
            x = W * i / nx; y = H * j / ny; row.append(bm.verts.new((x, y, zf(x, y))))
        vs.append(row)
    for j in range(ny):
        for i in range(nx): bm.faces.new([vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for k, v in enumerate(me.vertices):
        x, y = v.co.x, v.co.y; c = cf(x, y); col.data[k].color = (c[0], c[1], c[2], af(x, y))
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return o


def paper_mat(name, base, fleck, rough=0.88, fibre=1.0):
    """paper: the colour layer x fibres x cloudiness, a fine grain in the bump, the layer's alpha cut sharp for torn edges"""
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; N = nt.nodes; Lk = nt.links
    bsdf = N['Principled BSDF']; bsdf.inputs['Roughness'].default_value = rough
    at = N.new('ShaderNodeAttribute'); at.attribute_name = 'Col'
    tc = N.new('ShaderNodeTexCoord')
    fib = N.new('ShaderNodeTexNoise'); fib.inputs['Scale'].default_value = 260 * fibre; fib.inputs['Detail'].default_value = 10; fib.inputs['Roughness'].default_value = 0.65
    cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = 0.42; cr.color_ramp.elements[0].color = (*fleck, 1); cr.color_ramp.elements[1].position = 0.56; cr.color_ramp.elements[1].color = (*base, 1)
    cl = N.new('ShaderNodeTexNoise'); cl.inputs['Scale'].default_value = 26; cl.inputs['Detail'].default_value = 6
    cr2 = N.new('ShaderNodeValToRGB'); cr2.color_ramp.elements[0].position = 0.3; cr2.color_ramp.elements[0].color = (0.84, 0.84, 0.84, 1); cr2.color_ramp.elements[1].position = 0.7; cr2.color_ramp.elements[1].color = (1.04, 1.04, 1.04, 1)
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
    mul2 = N.new('ShaderNodeMix'); mul2.data_type = 'RGBA'; mul2.blend_type = 'MULTIPLY'; mul2.inputs['Factor'].default_value = 1.0
    Lk.new(tc.outputs['Object'], fib.inputs['Vector']); Lk.new(tc.outputs['Object'], cl.inputs['Vector'])
    Lk.new(fib.outputs['Fac'], cr.inputs['Fac']); Lk.new(cl.outputs['Fac'], cr2.inputs['Fac'])
    Lk.new(at.outputs['Color'], mul.inputs[6]); Lk.new(cr.outputs['Color'], mul.inputs[7])
    Lk.new(mul.outputs[2], mul2.inputs[6]); Lk.new(cr2.outputs['Color'], mul2.inputs[7])
    Lk.new(mul2.outputs[2], bsdf.inputs['Base Color'])
    gr = N.new('ShaderNodeTexNoise'); gr.inputs['Scale'].default_value = 900; gr.inputs['Detail'].default_value = 2
    bu = N.new('ShaderNodeBump'); bu.inputs['Strength'].default_value = 0.12; bu.inputs['Distance'].default_value = 0.002
    Lk.new(tc.outputs['Object'], gr.inputs['Vector']); Lk.new(gr.outputs['Fac'], bu.inputs['Height']); Lk.new(bu.outputs['Normal'], bsdf.inputs['Normal'])
    gt = N.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.5
    Lk.new(at.outputs['Alpha'], gt.inputs[0]); Lk.new(gt.outputs[0], bsdf.inputs['Alpha'])
    return m


def shoot(o, W, H, path, px):
    """render o (lying in x 0..W, y 0..H) straight from above to px wide, then save it as WebP and return the base64"""
    from PIL import Image
    sc = bpy.context.scene
    for ob in list(sc.objects):
        if ob.type == 'MESH' and ob is not o: ob.hide_render = True
    o.hide_render = False
    cd = bpy.data.cameras.new('cam'); cd.type = 'ORTHO'; cd.ortho_scale = max(W, H) * 1.0
    cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); cam.location = (W / 2, H / 2, 10); cam.rotation_euler = (0, 0, 0); sc.camera = cam
    sc.render.resolution_x = px; sc.render.resolution_y = int(round(px * H / W)); sc.render.resolution_percentage = 100
    png = os.path.join(OUT, path + '.png'); sc.render.filepath = png; bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    im = Image.open(png); webp = os.path.join(OUT, path + '.webp'); im.save(webp, 'WEBP', quality=80, method=6)
    data = base64.b64encode(open(webp, 'rb').read()).decode()
    open(os.path.join(ROOT, 'src', 'data', 'letter-' + path + '.b64'), 'w').write(data)
    print(path, im.size, '%.0f KB' % (os.path.getsize(webp) / 1024))
    return data


# ---------- the shapes on the paper ----------
def creases(rr, n, W, H, amp, width, length):
    """random short creases: (point, direction, amplitude, half-width, half-length)"""
    return [(V((rr.uniform(0, W), rr.uniform(0, H))), V((math.cos(a), math.sin(a))), rr.uniform(-amp, amp), rr.uniform(width * 0.5, width), rr.uniform(length * 0.4, length))
            for a in (rr.uniform(0, math.pi) for _ in range(n))]

def crumple(x, y, cs, seed, low=0.008):
    p = V((x, y)); z = low * noise.noise(V((x * 1.1, y * 1.1, seed))) + low * 0.4 * noise.noise(V((x * 3.3, y * 3.3, seed + 7)))
    for c, d, a, w, L in cs:
        q = p - c; along = q.dot(d); across = q.x * -d.y + q.y * d.x
        if abs(along) < L * 2.2 and abs(across) < w * 3:
            z += a * max(0.0, 1 - abs(across) / w) * math.exp(-(along / L) ** 2)   # a sharp ridge (or valley) that fades along its length
    return z

def edge_d(x, y, W, H): return min(x, W - x, y, H - y)

def worn(x, y, W, H, seed, depth, tears=()):
    """1 on the paper, 0 where the edge is worn or torn away"""
    d = edge_d(x, y, W, H); n = 0.5 + 0.5 * noise.noise(V((x * 13, y * 13, seed))) + 0.25 * noise.noise(V((x * 60, y * 60, seed + 2)))
    inset = depth * (0.3 + 0.7 * n)
    for cx, cy, r in tears:
        dc = math.hypot(x - cx, y - cy); inset += max(0.0, r - dc) * (0.7 + 0.5 * noise.noise(V((x * 30, y * 30, seed + 5))))
    return 1.0 if d > inset else 0.0

def tint(c, t, k):
    k = max(0.0, min(1.0, k)); return [c[i] * (1 - k) + t[i] * k for i in range(3)]


# ---------- the envelope ----------
KRAFT, KFLECK = (0.62, 0.46, 0.29), (0.40, 0.29, 0.17)

def env_colour(seed, W, H, water=None, grime=0.5):
    rr = random.Random(seed); spots = [(rr.uniform(0, W), rr.uniform(0, H), rr.uniform(0.004, 0.015)) for _ in range(18)]
    def cf(x, y):
        c = [1.0, 1.0, 1.0]; d = edge_d(x, y, W, H)
        c = tint(c, (0.5, 0.42, 0.34), grime * 1.4 * math.exp(-d / 0.07))                    # handled edges, darker
        c = tint(c, (0.74, 0.68, 0.62), 0.45 * max(0.0, noise.noise(V((x * 2.5, y * 2.5, seed + 9)))))   # grime in patches
        c = tint(c, (1.1, 1.06, 1.0), 0.3 * max(0.0, -noise.noise(V((x * 1.6, y * 1.6, seed + 4)))))   # faded where the sun had it
        if water:
            wx, wy, R = water; a = math.atan2(y - wy, x - wx); r = math.hypot((x - wx) * 1.0, (y - wy) * 1.25) * (1 + 0.22 * noise.noise(V((x * 3, y * 3, seed))))
            w = 0.008 + 0.014 * (0.5 + 0.5 * noise.noise(V((math.cos(a) * 2, math.sin(a) * 2, seed + 3))))
            c = tint(c, (1.12, 1.1, 1.06), 0.3 * (r < R) * (0.6 + 0.4 * noise.noise(V((x * 5, y * 5, seed + 1)))))
            c = tint(c, (0.64, 0.52, 0.38), 0.65 * math.exp(-((r - R) / w) ** 2))         # a dried water stain with its tide line
        for sx, sy, sr in spots:
            if abs(x - sx) < 0.05 and abs(y - sy) < 0.05: c = tint(c, (0.55, 0.42, 0.3), 0.6 * math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / sr ** 2))
        return c
    return cf

def build_front():
    rr = random.Random(11); cs = creases(rr, 26, EW, EH, 0.006, 0.05, 0.35)
    diag = (V((0.2, 0.15)), V((0.83, 0.56)).normalized(), 0.012, 0.035, 1.6)                     # folded once, long ago
    cs.append(diag)
    o = sheet('front', EW, EH, 230, 163, lambda x, y: crumple(x, y, cs, 3), env_colour(5, EW, EH, water=(1.72, 0.42, 0.24)),
              lambda x, y: worn(x, y, EW, EH, 4, 0.012, tears=((EW, EH, 0.07), (0.0, 0.0, 0.035))))
    o.data.materials.append(paper_mat('kraft', KRAFT, KFLECK)); return o

def pocket_alpha(x, y, W, H, seed):
    """the back panel's flaps: side flaps (triangles from each side to the middle) and the bottom flap (its top edge a shallow curve)"""
    if not worn(x, y, W, H, seed, 0.01): return 0.0
    yt = H - y                                                         # from the top
    side = yt > MOUTH * H + abs(x - W / 2) / (W / 2) * 0.12 * H - 0.0  # the side flaps' slanted top edges
    bottom = yt > (MOUTH + 0.04) * H - 0.1 * H * (1 - ((x - W / 2) / (W / 2)) ** 2)
    return 1.0 if (side or bottom) else 0.0

def build_pocket():
    rr = random.Random(12); cs = creases(rr, 18, EW, EH, 0.005, 0.05, 0.3)
    def zf(x, y):
        z = crumple(x, y, cs, 6); yt = EH - y
        # the paper layers: the bottom flap over the side flaps, each a little higher, so their edges cast a line of shadow
        if yt > (MOUTH + 0.04) * EH - 0.1 * EH * (1 - ((x - EW / 2) / (EW / 2)) ** 2) + 0.01: z += 0.003
        if min(x, EW - x) < 0.32 + (yt / EH) * 0.0: z += 0.0015
        return z
    base = env_colour(7, EW, EH, grime=0.4)
    def cf(x, y):
        c = base(x, y); yt = EH - y
        e = abs(yt - ((MOUTH + 0.04) * EH - 0.1 * EH * (1 - ((x - EW / 2) / (EW / 2)) ** 2)))
        return tint(c, (0.62, 0.55, 0.48), 0.45 * math.exp(-(e / 0.012) ** 2))   # the glued edge, darker
    o = sheet('pocket', EW, EH, 230, 163, zf, cf, lambda x, y: pocket_alpha(x, y, EW, EH, 8))
    o.data.materials.append(paper_mat('kraft_b', KRAFT, KFLECK)); return o

def build_inside():
    rr = random.Random(13); cs = creases(rr, 8, EW, EH, 0.004, 0.06, 0.4)
    def cf(x, y):
        k = (1 - y / EH)                                                  # darker down in the pocket
        return tint([0.72, 0.68, 0.64], (0.35, 0.3, 0.26), 0.55 * k)
    o = sheet('inside', EW, EH, 115, 82, lambda x, y: crumple(x, y, cs, 9), cf, lambda x, y: 1.0)
    o.data.materials.append(paper_mat('kraft_i', KRAFT, KFLECK)); return o

def build_flap():
    """the flap: the top edge is the hinge, its tip FLAP of the envelope's height down; drawn on a sheet EW x FLAP*EH + a margin"""
    H = FLAP * EH; rr = random.Random(14); cs = creases(rr, 10, EW, H, 0.005, 0.05, 0.3)
    def af(x, y):
        yt = H - y; half = (1 - yt / H) * EW / 2 + 0.06 * math.sin(math.pi * yt / H)   # slightly rounded sides down to the tip
        if abs(x - EW / 2) > half - 0.012 * (0.5 + 0.5 * noise.noise(V((x * 15, y * 15, 3)))): return 0.0
        return worn(x, y, EW, H * 2, 21, 0.008) if yt < 0.02 else 1.0
    base = env_colour(15, EW, H, grime=0.55)
    def cf(x, y):
        c = base(x, y); yt = H - y; half = (1 - yt / H) * EW / 2 + 0.06 * math.sin(math.pi * yt / H)
        e = half - abs(x - EW / 2)
        return tint(c, (0.7, 0.6, 0.48), 0.35 * math.exp(-(e / 0.03) ** 2))                  # handled along its edge
    o = sheet('flap', EW, H, 230, 98, lambda x, y: crumple(x, y, cs, 12), cf, af)
    o.data.materials.append(paper_mat('kraft_f', KRAFT, KFLECK)); return o, H


# ---------- the letter ----------
def build_paper():
    rr = random.Random(31); cs = creases(rr, 22, PW, PH, 0.0045, 0.05, 0.35)
    def zf(x, y):
        z = crumple(x, y, cs, 13, 0.006)
        for yc in (PH / 3, 2 * PH / 3):                                   # the two folds, valleys on the side with the writing
            z -= 0.0045 * math.exp(-((y - yc) / 0.006) ** 2) + 0.002 * math.exp(-((y - yc) / 0.03) ** 2)
        t = (y % (PH / 3)) / (PH / 3); z += 0.004 * math.sin(math.pi * t)  # the panels still bowed from lying folded
        z += 0.05 * max(0.0, (math.hypot(PW - x, y) - 0.0) < 0.35) * (0.35 - math.hypot(PW - x, y)) ** 2   # a curled corner
        return z
    spots = [(rr.uniform(0, PW), rr.uniform(0, PH), rr.uniform(0.004, 0.012)) for _ in range(40)]
    cx, cy, R = 1.55, 0.62, 0.34
    def cf(x, y):
        c = [1.0, 1.0, 1.0]; d = edge_d(x, y, PW, PH)
        c = tint(c, (0.80, 0.64, 0.40), 0.75 * math.exp(-d / 0.1))          # yellowed and browned towards the edges
        c = tint(c, (0.84, 0.75, 0.58), 0.55 * max(0.0, noise.noise(V((x * 2.2, y * 2.2, 4)))))   # aged in patches
        c = tint(c, (1.04, 1.02, 0.98), 0.3 * max(0.0, -noise.noise(V((x * 1.3, y * 1.3, 8)))))
        for (rx, ry, rR, k) in ((cx, cy, R, 1.0), (cx + 0.06, cy - 0.035, R * 0.97, 0.35)):   # a mug set down twice
            a = math.atan2(y - ry, x - rx); r = math.hypot(x - rx, y - ry) * (1 + 0.07 * noise.noise(V((x * 3.5, y * 3.5, 2))))
            w = 0.006 + 0.012 * (0.5 + 0.5 * noise.noise(V((math.cos(a) * 2, math.sin(a) * 2, 5))))
            brk = max(0.0, 0.5 + 0.7 * math.sin(a * 1.5 + 0.7) + 0.4 * noise.noise(V((math.cos(a) * 3, math.sin(a) * 3, 9))))
            c = tint(c, (0.58, 0.40, 0.22), k * (0.6 * math.exp(-((r - rR) / w) ** 2) * min(1.0, brk) + 0.07 * (r < rR)))
        for sx, sy, sr in spots:
            if abs(x - sx) < 0.04 and abs(y - sy) < 0.04: c = tint(c, (0.62, 0.47, 0.3), 0.55 * math.exp(-((x - sx) ** 2 + (y - sy) ** 2) / sr ** 2))
        for yc in (PH / 3, 2 * PH / 3): c = tint(c, (0.78, 0.72, 0.62), 0.3 * math.exp(-((y - yc) / 0.012) ** 2))   # dirt in the folds
        c = tint(c, (0.7, 0.68, 0.66), 0.25 * math.exp(-(((x - 0.25) / 0.09) ** 2 + ((y - 0.3) / 0.12) ** 2)))     # a thumb
        return c
    o = sheet('paper', PW, PH, 210, 297, zf, cf, lambda x, y: worn(x, y, PW, PH, 33, 0.008, tears=((0.0, PH, 0.03),)))
    o.data.materials.append(paper_mat('letter', (0.94, 0.88, 0.75), (0.82, 0.75, 0.6), 0.9, 1.2)); return o


def main():
    os.makedirs(OUT, exist_ok=True)
    reset()
    shoot(build_front(), EW, EH, 'env-front', 1024)
    shoot(build_pocket(), EW, EH, 'env-pocket', 1024)
    shoot(build_inside(), EW, EH, 'env-inside', 512)
    fo, fh = build_flap(); shoot(fo, EW, fh, 'env-flap', 1024)
    shoot(build_paper(), PW, PH, 'paper', 1000)


if __name__ == '__main__':
    main()
