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

ffmpeg makes the H.264 film at the size and rate of the shots, and a 540-wide copy for the phone, with the export settings in enc.py
(CRF 13, BT.709 limited range, AAC 320k 48 kHz). The sound is the song from its start, with the voice on top when the cut list has one
(`voice`: [{file, at}]), at -14 LUFS and then 60 % (`level`), see enc.master.

    --size 2160x3840 --fps 60   the same cut list on shots filmed at another size and rate (the master)
    --jobs 6                    the frames put together by this many processes at once

The pixel measures (the words' rise, the grain) follow the width, so the 4K film looks like the 1080 one."""
import os, sys, json, argparse, subprocess, shutil, math
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from enc import ffmpeg, video_args, AUDIO, master

def grade_tools(w, h, G):
    """the S-curve as a lookup table, the vignette as a per-pixel factor, and eight frames of grain"""
    x = np.arange(256) / 255.0; s = G.get('contrast', 0.12)
    curve = x + s * (x - 0.5) * (1 - np.abs(2 * x - 1))   # steeper in the middle, the ends kept
    lut = np.clip(curve * 255 + 0.5, 0, 255).astype(np.uint8)
    yy, xx = np.mgrid[0:h, 0:w]; r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) / math.sqrt(2)
    vig = (1 - G.get('vignette', 0.22) * np.clip((r - 0.35) / 0.65, 0, 1) ** 1.6).astype(np.float32)[..., None]
    # the grain is made at the 1080-wide size and enlarged, so it is as coarse on the 4K film as on the rough cut
    k = max(1, round(w / 1080)); rng = np.random.default_rng(7); gh, gw = -(-h // k), -(-w // k)
    grain = [np.repeat(np.repeat(rng.normal(0, G.get('grain', 2.2), (gh, gw, 1)).astype(np.float32), k, 0), k, 1)[:h, :w] for _ in range(8)]
    return lut, vig, grain

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('edit'); ap.add_argument('--out', default=None); ap.add_argument('--frames', default=None, help='only these frames, as a:b, for a look')
    ap.add_argument('--size', default=None); ap.add_argument('--fps', type=int, default=None); ap.add_argument('--jobs', type=int, default=1)
    ap.add_argument('--audio-only', action='store_true', help='only the sound mix, to listen to and measure')
    a = ap.parse_args()
    E = json.load(open(a.edit, encoding='utf-8')); fps = a.fps or E['fps']; size = a.size or E['size']; w, h = map(int, size.split('x')); K = w / 1080
    if a.size or a.fps: E['name'] += '-%s-%d' % (size, fps)
    out = a.out or os.path.join(ROOT, 'trailer', 'out', 'rough', E['name'] + '.mp4'); fdir = os.path.join(os.path.dirname(out), E['name'] + '-frames')
    os.makedirs(fdir, exist_ok=True)
    def sound():
        wav = out.replace('.mp4', '-mix.wav'); voice = [{'file': os.path.join(ROOT, v['file']), 'at': v['at'], 'gain': v.get('gain', 0)} for v in E.get('voice', [])]
        m = master(os.path.join(ROOT, E['song']), E['dur'], wav, voice, level=E.get('level', 0.6), fade=E.get('fade', 0), over=E.get('over', 8.0), env=E.get('music_env'))
        print('lyd: %.1f LUFS inn, %+.1f dB%s, så %d %% -> %.1f LUFS, topp %.1f dBTP' % (m['in_lufs'], m['gain_db'], ' (holdt av toppen)' if m['peak_limited'] else '', round(m['level'] * 100), m['out_lufs'], m['out_peak']))
        if voice: print('stemme %s LUFS, musikk %.1f LUFS, musikken %+.1f dB' % (m['voice_lufs'], m['music_lufs'], m['music_gain_db']))
        return wav
    if a.audio_only: print('miks', sound()); return
    N = int(round(E['dur'] * fps)); clips = sorted(E['clips'], key=lambda c: c['at']); TT = os.path.join(ROOT, 'trailer', 'out', 'titles')
    if os.path.isdir(TT + '-' + size): TT += '-' + size   # the words drawn at the film's own size (titles.py --size ... --out trailer/out/titles-<size>)
    rng = range(N) if not a.frames else range(*map(int, a.frames.split(':')))
    def src(shot, i=0):
        d = os.path.join(ROOT, 'trailer', 'out', shot + '-' + size)
        return next((p for p in (os.path.join(d, 'f%04d.%s' % (i, e)) for e in ('png', 'jpg')) if os.path.exists(p)), None)
    jpg = any((src(c['shot']) or '').endswith('.jpg') for c in clips); fext = 'jpg' if jpg else 'png'   # JPEG shots (4K) give JPEG frames, a tenth of the disk
    if not a.frames:
        for f in os.listdir(fdir): os.remove(os.path.join(fdir, f))
    if a.jobs > 1 and not a.frames:
        cut = [N * j // a.jobs for j in range(a.jobs + 1)]
        ps = [subprocess.Popen([sys.executable, os.path.abspath(__file__), a.edit, '--out', out, '--frames', '%d:%d' % (cut[j], cut[j + 1])] + (['--size', a.size] if a.size else []) + (['--fps', str(a.fps)] if a.fps else [])) for j in range(a.jobs)]
        if any(p.wait() for p in ps): print('FEIL i en av prosessene'); return
        rng = range(0)
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
    missing = sorted({c['shot'] for c in clips if not src(c['shot'])})
    if missing: print('mangler opptak:', missing)
    def shot_frame(c, t):
        """the shot's frame for film time t within clip c (the last one held if the shot is short)"""
        if c['shot'] in missing: return Image.new('RGBA', (w, h), (30, 30, 30, 255))
        i = int(round((c.get('in', 0) + t - c['at']) * fps))
        while i > 0 and not src(c['shot'], i): i -= 1
        return Image.open(src(c['shot'], i)).convert('RGBA')
    def ramp(t, t0, t1, up, down):
        if t < t0 or t > t1: return 0.0
        f = max(0.0, min(1.0, (t - t0) / up if up else 1, (t1 - t) / down if down else 1)); return f * f * (3 - 2 * f)   # eased at both ends
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
            t0, t1 = wd['at'], wd['at'] + wd['len']; up, down = (0.2, 0.2) if wd['len'] < 1 else (0.6, 0.5)   # (Jonas 10.11.2026: the words fade in and out, they do not jump)
            f = ramp(t, t0, t1, up, down)
            if f > 0: put(im, wd['key'], f, 14 * K * (1 - ease(min(1, (t - t0) / up))))
        # the voice's lines as subtitles (`subs`): fading in over 0.5 s and out over 0.45 s, standing still
        for sb in E.get('subs', []): put(im, sb['key'], ramp(t, sb['at'], sb['at'] + sb['len'], min(0.5, sb['len'] * 0.3), min(0.45, sb['len'] * 0.3)))
        card = next((cc for cc in clips if cc.get('card')), None)
        if card and t >= card['at']:
            T = card['card']; t0 = card['at']
            put(im, 'shade', ramp(t, t0, 1e9, 0.8, 0))
            put(im, 'logo', ramp(t, t0 + T.get('logo', 0.0), 1e9, 0.6, 0), 10 * K * (1 - ease(min(1, max(0, t - t0 - T.get('logo', 0)) / 0.6))))
            put(im, 'url', ramp(t, t0 + T.get('url', E['beat']), 1e9, 0.5, 0))
        # the film ends in black after the song's last sound
        if t > E.get('black_from', 1e9): im = Image.blend(im, Image.new('RGBA', (w, h), (0, 0, 0, 255)), min(1, (t - E['black_from']) / E.get('black_len', 0.6)))
        if jpg: im.convert('RGB').save(os.path.join(fdir, '%05d.jpg' % n), quality=98, subsampling=0)
        else: im.convert('RGB').save(os.path.join(fdir, '%05d.png' % n), compress_level=1)
        if n % 150 == 0: print('bilde %d/%d' % (n, N), flush=True)
    if a.frames: print('bilder i', fdir); return
    wav = sound()
    r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', os.path.join(fdir, '%05d.' + fext), '-i', wav, '-map', '0:v', '-map', '1:a']
                       + video_args(E.get('crf', 13)) + AUDIO + ['-t', '%.3f' % E['dur'], '-movflags', '+faststart', out])
    print('film', out if r.returncode == 0 else 'FEIL')
    small = out.replace('.mp4', '-540.mp4')
    subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', out, '-vf', 'scale=540:-2:flags=lanczos', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
                    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'copy', '-movflags', '+faststart', small])
    print('liten', small)

main()
