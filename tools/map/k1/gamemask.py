import base64, numpy as np
def varints(b):
    i = 0; n = len(b)
    while i < n:
        v = s = 0
        while True:
            x = b[i]; i += 1; v += (x & 127) << s; s += 7
            if not x & 128: break
        yield v
def game_mask():
    b = base64.b64decode(open('/home/user/FishyBusiness-/src/data/geo-mask.b64').read().strip())
    it = varints(b); nx, ny = 3140, 3296; m = np.zeros((ny, nx), np.uint8)
    for r in range(ny):
        n = next(it); c = 0; cur = 0
        for k in range(n):
            L = next(it)
            if cur: m[r, c:c + L] = 1
            c += L; cur ^= 1
    return m
if __name__ == '__main__':
    m = game_mask(); np.save('game_mask.npy', m); print(m.shape, m.mean())
