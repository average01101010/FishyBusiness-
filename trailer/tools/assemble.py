"""The rough cut: the filmed shots laid on the song's beats, the words on screen, the end card and the song under it.

    python trailer/tools/assemble.py trailer/audio/music-edit-1.json [--out trailer/out/rough/m1.mp4]

The cut list names, per clip, the shot, where it starts in the film (s) and from which second of the shot it is taken; it ends where
the next begins. The cuts and the words' times are seconds that beats.py found on the song's beats, rounded to the frame. Every frame
of the film is put together from the shots' own frames (trailer/out/<shot>-<size>/fNNNN.png):

- the words (trailer/out/titles/, titles.py) fade in over 0.35 s while they rise 14 px, and fade out over 0.25 s;
- a dissolve where the list asks for one (`mix` seconds into the clip);
- the end card (`card` on the last clip): the shade over the picture, the logo on its beat, the address a beat later;
- one grade over every frame (Jonas 10.11.2026: «Det må se proft, gjennomført og cinematisk ut»), so shots from other places and
  light hang together: a gentle S-curve, a vignette, and a faint grain that moves;
- black after the song's last sound.

ffmpeg makes the H.264 film with the song (AAC) at the size and rate of the shots, and a half-size copy for the phone."""
import os, sys, json, argparse, subprocess, shutil, math
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def ffmpeg(): return shutil.which('ffmpeg') or os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft', 'WinGet', 'Links', 'ffmpeg.exe')

def grade_tools(w, h, G):
    """the S-curve as a lookup table, the vignette as a per-pixel factor, and eight frames of grain"""
    x = np.arange(256) / 255.0; s = G.get('contrast', 0.12)
    curve = x + s * (x - 0.5) * (1 - np.abs(2 * x - 1))   # steeper in the middle, the ends kept
    lut = np.clip(curve * 255 + 0.5, 0, 255).astype(np.uint8)
    yy, xx = np.mgrid[0:h, 0:w]; r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) / math.sqrt(2)
    vig = (1 - G.get('vignette', 0.22) * np.clip((r - 0.35) / 0.65, 0, 1) ** 1.6).astype(np.float32)[..., None]
    rng = np.random.default_rng(7); grain = [rng.normal(0, G.get('grain', 2.2), (h, w, 1)).astype(np.float32) for _ in range(8)]
    return lut, vig, grain

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('edit'); ap.add_argument('--out', default=None); ap.add_argument('--frames', default=None, help='only these frames, as a:b, for a look')
    a = ap.parse_args()
    E = json.load(open(a.edit, encoding='utf-8')); fps = E['fps']; size = E['size']; w, h = map(int, size.split('x'))
    out = a.out or os.path.join(ROOT, 'trailer', 'out', 'rough', E['name'] + '.mp4'); fdir = os.path.join(os.path.dirname(out), E['name'] + '-frames')
    os.makedirs(fdir, exist_ok=True)
    N = int(round(E['dur'] * fps)); clips = sorted(E['clips'], key=lambda c: c['at']); TT = os.path.join(ROOT, 'trailer', 'out', 'titles')
    rng = range(N) if not a.frames else range(*map(int, a.frames.split(':')))
    if not a.frames:
        for f in os.listdir(fdir): os.remove(os.path.join(fdir, f))
    lut, vig, grain = grade_tools(w, h, E.get('grade', {}))
    cache = {}
    def layer(k):
        if k not in cache: cache[k] = Image.open(os.path.join(TT, k + '.png')).convert('RGBA')
        return cache[k]
    def put(im, k, f, dy=0):
        if f <= 0: return
        L = layer(k)
        if f < 1: L = L.copy(); L.putalpha(L.getchannel('A').point(lambda v: int(v * f)))
        if dy: im.alpha_composite(L, (0, int(round(dy))))
        else: im.alpha_composite(L)
    missing = sorted({c['shot'] for c in clips if not os.path.exists(os.path.join(ROOT, 'trailer', 'out', c['shot'] + '-' + size, 'f0000.png'))})
    if missing: print('mangler opptak:', missing)
    def shot_frame(c, t):
        """the shot's frame for film time t within clip c (the last one held if the shot is short)"""
        if c['shot'] in missing: return Image.new('RGBA', (w, h), (30, 30, 30, 255))
        d = os.path.join(ROOT, 'trailer', 'out', c['shot'] + '-' + size); i = int(round((c.get('in', 0) + t - c['at']) * fps))
        while i > 0 and not os.path.exists(os.path.join(d, 'f%04d.png' % i)): i -= 1
        return Image.open(os.path.join(d, 'f%04d.png' % i)).convert('RGBA')
    def ramp(t, t0, t1, up, down):
        if t < t0 or t > t1: return 0.0
        return max(0.0, min(1.0, (t - t0) / up if up else 1, (t1 - t) / down if down else 1))
    ease = lambda u: 1 - (1 - u) ** 3
    for n in rng:
        t = n / fps; k = max(i for i, c in enumerate(clips) if c['at'] <= t + 1e-6); c = clips[k]
        im = shot_frame(c, t)
        # a dissolve into this clip from the one before over `mix` seconds
        if c.get('mix') and t - c['at'] < c['mix'] and k > 0:
            im = Image.blend(shot_frame(clips[k - 1], t), im, (t - c['at']) / c['mix'])
        # the grade, before the words and the card, so they stay clean white
        arr = np.asarray(im.convert('RGB'))
        arr = lut[arr].astype(np.float32) * vig + grain[n % 8]
        im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
        for wd in E.get('words', []):
            t0, t1 = wd['at'], wd['at'] + wd['len']; up, down = (0.12, 0.08) if wd['len'] < 1 else (0.35, 0.25)
            f = ramp(t, t0, t1, up, down)
            if f > 0: put(im, wd['key'], f, 14 * (1 - ease(min(1, (t - t0) / up))))
        card = next((cc for cc in clips if cc.get('card')), None)
        if card and t >= card['at']:
            T = card['card']; t0 = card['at']
            put(im, 'shade', ramp(t, t0, 1e9, 0.8, 0))
            put(im, 'logo', ramp(t, t0 + T.get('logo', 0.0), 1e9, 0.6, 0), 10 * (1 - ease(min(1, max(0, t - t0 - T.get('logo', 0)) / 0.6))))
            put(im, 'url', ramp(t, t0 + T.get('url', E['beat']), 1e9, 0.5, 0))
        # the film ends in black after the song's last sound
        if t > E.get('black_from', 1e9): im = Image.blend(im, Image.new('RGBA', (w, h), (0, 0, 0, 255)), min(1, (t - E['black_from']) / E.get('black_len', 0.6)))
        im.convert('RGB').save(os.path.join(fdir, '%05d.png' % n), compress_level=1)
        if n % 150 == 0: print('bilde %d/%d' % (n, N), flush=True)
    if a.frames: print('bilder i', fdir); return
    song = os.path.join(ROOT, E['song'])
    r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(fdir, '%05d.png'), '-i', song, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-t', '%.3f' % E['dur'], '-movflags', '+faststart', out])
    print('grovklipp', out if r.returncode == 0 else 'FEIL')
    small = out.replace('.mp4', '-540.mp4')
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', out, '-vf', 'scale=540:-2', '-c:v', 'libx264', '-crf', '22', '-c:a', 'copy', '-movflags', '+faststart', small])
    print('liten', small)

main()
