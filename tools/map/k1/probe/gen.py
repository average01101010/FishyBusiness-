# Files for the measuring page: random 1 KB, 5 MB and 14.9 MB, and 32 deflated map blocks (seed 42, so the hashes in index.html hold),
# plus game.html = dist/index.html with bench.js. Publish index.html with these as supporting files (binaries as .wasm).
import hashlib, zlib, struct, numpy as np, json, os, base64
D = os.path.dirname(os.path.abspath(__file__)); os.makedirs(D + '/p', exist_ok=True)
rng = np.random.default_rng(42); H = {}
for name, n in [('1k', 1024), ('5m', 5 * 1024 * 1024), ('15m', 15623782)]:
    b = rng.integers(0, 256, n, dtype=np.uint8).tobytes(); open(f'{D}/p/{name}.wasm', 'wb').write(b); H[name] = hashlib.sha256(b).hexdigest()
def field(n):
    f = np.zeros((n, n))
    for k in range(1, 6):
        g = rng.normal(size=(2 ** k + 1, 2 ** k + 1)); x = np.linspace(0, 2 ** k, n); i = np.minimum(x.astype(int), 2 ** k - 1); t = x - i
        a = g[i][:, i] * (1 - t)[None, :] + g[i][:, i + 1] * t[None, :]; b2 = g[i + 1][:, i] * (1 - t)[None, :] + g[i + 1][:, i + 1] * t[None, :]
        f += (a * (1 - t)[:, None] + b2 * t[:, None]) / 1.7 ** k
    return f
hdr, out = [], []
for k in range(16):
    m = (field(400) > 0.2).astype(np.uint8); raw = m.tobytes(); c = zlib.compress(raw, 9)[2:-4]; hdr.append((0, len(raw), len(c), int(m.sum()))); out.append(c)
for k in range(16):
    d = np.clip(-field(200) * 800 - 50, -4000, 300).astype(np.int16); raw = d.tobytes(); c = zlib.compress(raw, 9)[2:-4]
    hdr.append((1, len(raw), len(c), int(d.astype(np.int64).sum()) & 0xffffffff)); out.append(c)
blob = struct.pack('<I', len(hdr)) + b''.join(struct.pack('<IIII', *h) for h in hdr) + b''.join(out)
open(f'{D}/p/blocks.wasm', 'wb').write(blob); open(f'{D}/p/blocks.txt', 'w').write(base64.b64encode(blob).decode()); H['blocks'] = hashlib.sha256(blob).hexdigest()
s = open(os.path.join(D, '../../../../dist/index.html')).read(); i = s.rindex('</body>')
open(f'{D}/game.html', 'w').write(s[:i] + '<script src="bench.js"></script>\n' + s[i:])
print(json.dumps(H))
