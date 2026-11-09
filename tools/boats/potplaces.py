"""The places of the conical pots' stacks on the coastal models (OB16, 09.11.2026; tools/boats/potplaces.json says how they were found).

    pots(model)                      the kit.pots entry for a model (None: no stacks on it); kit(model) as {'pots': ...} to merge
                                     into the script's kit_places
    python3 tools/boats/potplaces.py writes the places into the exported models (src/data/boat-<model>.b64, the scene's extras
                                     anchors.kit.pots) without exporting them again: the meshes stay as they are, byte for byte

Needs no Blender. A model exported again by its script gets the same places from kit_places."""
import os, sys, json, base64, struct
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(HERE, 'potplaces.json')

def table():
    return {k: v for k, v in json.load(open(SRC)).items() if not k.startswith('_')}

def pots(model):
    e = table().get(model)
    if not e: return None
    out = {'kind': 'kong', 'at': [list(a) for a in e['at']]}
    if e.get('spot'): out['spot'] = list(e['spot'])
    return out

def kit(model):
    """{'pots': ...} to merge into a model's kit, or {} without stacks"""
    p = pots(model); return {'pots': p} if p else {}

def patch(model):
    path = os.path.join(ROOT, 'src', 'data', 'boat-%s.b64' % model); b = base64.b64decode(open(path).read())
    L, T = struct.unpack('<II', b[12:20]); assert T == 0x4E4F534A
    js = json.loads(b[20:20 + L]); rest = b[20 + L:]
    kit = js['scenes'][0]['extras']['anchors'].setdefault('kit', {}); kit['pots'] = pots(model)
    j = json.dumps(js, separators=(',', ':')).encode()
    while len(j) % 4: j += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + len(rest)) + struct.pack('<II', len(j), 0x4E4F534A) + j + rest
    open(path, 'w').write(base64.b64encode(out).decode())
    return len(kit['pots']['at'])

if __name__ == '__main__':
    for m in (sys.argv[1:] or sorted(table())): print(m, patch(m), 'stacks')
